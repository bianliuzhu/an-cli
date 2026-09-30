import type { MockValue } from '../../config';
import type { MockOperation } from './reader';

import fs from 'node:fs/promises';
import path from 'node:path';

export interface MockFile {
	service: string;
	operation: Pick<MockOperation, 'name' | 'method' | 'url' | 'description'>;
	template: MockValue;
}

export interface MockWriteResult {
	generated: number;
	overwritten: number;
	skipped: number;
	files: string[];
}

interface ExistingMock {
	fileName: string;
	route?: string;
}

function routeKey(method: string, url: string): string {
	const route = url
		.split('?')[0]
		.split('/')
		.filter(Boolean)
		.map((part) => (part.startsWith(':') ? ':parameter' : part))
		.join('/');
	return `${method.toUpperCase()}:/${route}`;
}

async function existingMocks(directory: string): Promise<ExistingMock[]> {
	const entries = await fs.readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
		if (error.code === 'ENOENT') return [];
		throw error;
	});
	const result: ExistingMock[] = [];
	for (const entry of entries) {
		const fileName = path.join(directory, entry.name);
		if (entry.isSymbolicLink()) throw new Error(`Refusing to scan a symbolic link inside mockDir: ${fileName}`);
		if (entry.isDirectory()) {
			result.push(...(await existingMocks(fileName)));
		} else if (entry.isFile() && /\.json$/i.test(entry.name)) {
			const content = await fs.readFile(fileName, 'utf8');
			const header = /^\s*\/\*([\s\S]*?)\*\//.exec(content)?.[1];
			const url = header && /@url\s+(\S+)/.exec(header)?.[1];
			const method = /@method\s+(\S+)/.exec(header ?? '')?.[1] ?? 'GET';
			result.push({ fileName, route: url ? routeKey(method, url) : undefined });
		}
	}
	return result;
}

export async function writeMockFiles(
	directory: string,
	files: MockFile[],
	options: { overwrite?: boolean; indentation?: string; lineEnding?: string } = {},
): Promise<MockWriteResult> {
	const root = path.resolve(directory);
	const existing = await existingMocks(root);
	const byPath = new Map(existing.map((item) => [item.fileName, item]));
	const byRoute = new Map<string, string[]>();
	for (const item of existing) {
		if (item.route) byRoute.set(item.route, [...(byRoute.get(item.route) ?? []), item.fileName]);
	}
	const routes = new Set<string>();
	const paths = new Set<string>();
	const planned: { fileName: string; content: string; existed: boolean }[] = [];
	const result: MockWriteResult = { generated: 0, overwritten: 0, skipped: 0, files: [] };
	for (const file of files) {
		const { operation } = file;
		if (!file.service || !operation.name || [file.service, operation.name].some((value) => /[\\/]/.test(value) || value.includes('..'))) {
			throw new Error(`Invalid mock service or operation file name: ${file.service}/${operation.name}`);
		}
		if (!operation.url.startsWith('/') || /\s|\*\//.test(operation.url)) throw new Error(`Invalid mock URL for ${operation.name}: ${operation.url}`);
		const route = routeKey(operation.method, operation.url);
		if (routes.has(route)) throw new Error(`Multiple selected APIs match ${route}. mock-service-plugin cannot distinguish them by service.`);
		routes.add(route);
		const target = path.join(root, file.service, `${operation.name}.json`);
		const legacy = path.join(root, `${operation.name}.json`);
		const matches = new Set(byRoute.get(route) ?? []);
		if (byPath.has(target)) matches.add(target);
		if (byPath.has(legacy)) matches.add(legacy);
		if (matches.size && !options.overwrite) {
			result.skipped++;
			continue;
		}
		if (matches.size > 1) throw new Error(`Multiple existing mocks conflict with ${operation.name}; resolve these files before overwriting: ${[...matches].join(', ')}`);
		const fileName = [...matches][0] ?? target;
		if (path.dirname(fileName) !== root && !fileName.startsWith(`${path.join(root, file.service)}${path.sep}`)) {
			throw new Error(`Refusing to overwrite a matching mock in another service directory: ${fileName}`);
		}
		if (paths.has(fileName)) throw new Error(`Multiple APIs would overwrite the same mock file: ${fileName}`);
		paths.add(fileName);
		const description = (operation.description || operation.name).replace(/\*\//g, '* /').replace(/[\r\n]+/g, ' ');
		const header = `/**\n * ${description}\n * @url ${operation.url}\n * @method ${operation.method}\n */\n`;
		const content = `${header}${JSON.stringify(file.template, null, options.indentation ?? '\t')}\n`.replace(/\n/g, options.lineEnding ?? '\n');
		planned.push({ fileName, content, existed: byPath.has(fileName) });
	}
	for (const file of planned) {
		await fs.mkdir(path.dirname(file.fileName), { recursive: true });
		try {
			await fs.writeFile(file.fileName, file.content, { flag: options.overwrite ? 'w' : 'wx' });
		} catch (error) {
			if (!options.overwrite && (error as NodeJS.ErrnoException).code === 'EEXIST') {
				result.skipped++;
				continue;
			}
			throw error;
		}
		if (file.existed) result.overwritten++;
		else result.generated++;
		result.files.push(file.fileName);
	}
	return result;
}
