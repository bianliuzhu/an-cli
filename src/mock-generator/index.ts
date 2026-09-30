import type { IConfigSwaggerServer, LogLevel, MockGenerationOptions, UserConfig } from '../../config';
import type { MockFile, MockWriteResult } from './writer';

import inquirer from 'inquirer';
import { createJiti } from 'jiti';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { createDefaultConfig } from '../swagger-codegen/config-template';
import { computeSegment } from '../swagger-codegen/shared/naming';
import { log, setLogLevel } from '../utils';
import { isGeneratedApiFile, readMockOperations } from './reader';
import { renderMockOperation } from './template';
import { writeMockFiles } from './writer';

export interface MockCommandOptions {
	service?: string;
	all?: boolean;
	overwrite?: boolean;
	mockDir?: string;
	logLevel?: string;
}

export interface MockService {
	name: string;
	segment: string;
	fileName: string;
	apiFile: string;
	options: MockGenerationOptions;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function loadConfig(projectRoot: string): Promise<UserConfig> {
	const tsPath = path.join(projectRoot, 'an.config.ts');
	const jsonPath = path.join(projectRoot, 'an.config.json');
	const configPath = existsSync(tsPath) ? tsPath : jsonPath;
	if (!existsSync(configPath)) throw new Error('No an.config.ts or an.config.json found. Run anl type first.');
	try {
		const loaded: unknown = configPath === tsPath ? await createJiti(__filename, { interopDefault: true }).import(tsPath) : JSON.parse(await fs.readFile(jsonPath, 'utf8'));
		const config = isObject(loaded) && isObject(loaded.default) ? loaded.default : loaded;
		if (!isObject(config)) throw new Error('The configuration must export an object.');
		return config as UserConfig;
	} catch (error) {
		throw new Error(`Cannot load ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
	}
}

function resolveDirectory(projectRoot: string, value: unknown, fallback: string, field: string): string {
	const input = value ?? fallback;
	if (typeof input !== 'string' || !input.trim()) throw new Error(`${field} must be a non-empty directory path.`);
	return path.resolve(projectRoot, input);
}

function generationOptions(global: MockGenerationOptions | undefined, local: MockGenerationOptions | undefined): MockGenerationOptions {
	for (const input of [global, local]) {
		if (input !== undefined && !isObject(input)) throw new Error('mock must be an object.');
		if (input?.responseDefaults !== undefined && !isObject(input.responseDefaults)) throw new Error('mock.responseDefaults must be an object.');
	}
	const options = { ...global, ...local, responseDefaults: { ...global?.responseDefaults, ...local?.responseDefaults } };
	for (const [name, limit] of [
		['arrayLength', 100],
		['maxDepth', 30],
	] as const) {
		const value = options[name];
		if (value !== undefined && (!Number.isInteger(value) || value < 1 || value > limit)) throw new Error(`mock.${name} must be an integer between 1 and ${limit}.`);
	}
	return options;
}

async function discoverServices(apiDir: string, config: UserConfig): Promise<MockService[]> {
	const configured = new Map<string, IConfigSwaggerServer>();
	const servers = config.swaggerConfig ? (Array.isArray(config.swaggerConfig) ? config.swaggerConfig : [config.swaggerConfig]) : [];
	for (const server of servers) {
		if (!isObject(server)) throw new Error('Each swaggerConfig service must be an object.');
		const fileName = server.apiListFileName ?? config.apiListFileName ?? 'index.ts';
		if (typeof fileName !== 'string' || /[\\/]/.test(fileName) || fileName.includes('..')) throw new Error('apiListFileName must be a single file name.');
		if (configured.has(fileName)) throw new Error(`Duplicate apiListFileName in swaggerConfig: ${fileName}`);
		configured.set(fileName, server);
	}
	const entries = await fs.readdir(apiDir, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
		if (error.code === 'ENOENT') throw new Error(`API directory not found: ${apiDir}. Run anl type first.`);
		throw error;
	});
	const services: MockService[] = [];
	const segments = new Set<string>();
	const names = new Set<string>();
	for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
		if (!entry.isFile() || !entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) continue;
		const apiFile = path.join(apiDir, entry.name);
		if (!isGeneratedApiFile(apiFile)) continue;
		const server = configured.get(entry.name);
		const segment = computeSegment(entry.name);
		if (server?.name !== undefined && typeof server.name !== 'string') throw new Error('Service name must be a string.');
		const configuredName = server?.name?.trim() ?? '';
		const name = configuredName.length ? configuredName : segment;
		if (!segment || segments.has(segment.toLowerCase())) throw new Error(`Conflicting mock service directory for ${entry.name}`);
		if (names.has(name.toLowerCase())) throw new Error(`Duplicate mock service name: ${name}`);
		segments.add(segment.toLowerCase());
		names.add(name.toLowerCase());
		services.push({ name, segment, fileName: entry.name, apiFile, options: generationOptions(config.mock, server?.mock) });
	}
	if (!services.length) throw new Error(`No generated service API files found in ${apiDir}. Run anl type first.`);
	return services;
}

export async function selectMockServices(
	services: MockService[],
	options: MockCommandOptions,
	interactive = !!(process.stdin.isTTY && process.stdout.isTTY),
): Promise<MockService[]> {
	if (options.all && options.service !== undefined) throw new Error('--all and --service cannot be used together.');
	if (options.service !== undefined) {
		const tokens = options.service
			.split(',')
			.map((token) => token.trim().toLowerCase())
			.filter(Boolean);
		if (!tokens.length) throw new Error('--service requires at least one service name.');
		const lookup = new Map(services.map((service) => [service.name.toLowerCase(), service]));
		for (const service of services) {
			if (!lookup.has(service.segment.toLowerCase())) lookup.set(service.segment.toLowerCase(), service);
		}
		const unknown = tokens.filter((token) => !lookup.has(token));
		if (unknown.length) throw new Error(`Unknown generated service(s): ${unknown.join(', ')}. Available: ${services.map((service) => service.name).join(', ')}.`);
		const selected = new Set(tokens.map((token) => lookup.get(token)!));
		return services.filter((service) => selected.has(service));
	}
	if (options.all || !interactive || services.length === 1) return services;
	const { picked } = await inquirer.prompt<{ picked: number[] }>([
		{
			type: 'checkbox',
			name: 'picked',
			message: 'Select services to generate mock files (empty = all):',
			choices: services.map((service, index) => ({ name: `${service.name} (${service.fileName})`, value: index })),
			pageSize: Math.min(20, services.length),
		},
	]);
	return picked.length ? services.filter((_, index) => picked.includes(index)) : services;
}

export async function mockHandle(options: MockCommandOptions = {}, projectRoot = process.cwd()): Promise<MockWriteResult & { warnings: string[] }> {
	const config = await loadConfig(projectRoot);
	const defaults = createDefaultConfig();
	const level = options.logLevel ?? config.logLevel ?? 'info';
	if (!['silent', 'error', 'warn', 'info', 'verbose'].includes(level)) throw new Error(`Invalid log level: ${level}`);
	setLogLevel(level as LogLevel);
	const apiDir = resolveDirectory(projectRoot, config.saveApiListFolderPath, defaults.saveApiListFolderPath, 'saveApiListFolderPath');
	const typeDir = resolveDirectory(projectRoot, config.saveTypeFolderPath, defaults.saveTypeFolderPath, 'saveTypeFolderPath');
	const mockDir = resolveDirectory(projectRoot, options.mockDir ?? config.mock?.mockDir, 'mocks', 'mock.mockDir');
	if (mockDir === path.parse(mockDir).root) throw new Error('mockDir cannot be the filesystem root.');
	const services = await selectMockServices(await discoverServices(apiDir, config), options);
	log.section('anl mock', mockDir);
	log.print(`Services: ${services.map((service) => service.name).join(', ')}`);
	const { checker, operations } = readMockOperations({ projectRoot, apiDir, typeDir, apiFiles: services.map((service) => service.apiFile) });
	const warnings: string[] = [];
	const files: MockFile[] = operations.map((operation) => {
		const service = services.find((candidate) => candidate.apiFile === operation.sourceFile)!;
		const rendered = renderMockOperation(checker, operation, service.options);
		warnings.push(...rendered.warnings);
		return { service: service.segment, operation, template: rendered.template };
	});
	const result = await writeMockFiles(mockDir, files, { overwrite: options.overwrite, ...config.formatting });
	for (const fileName of result.files) log.verbose(fileName);
	if (warnings.length) {
		log.warning(`${warnings.length} field(s) need review (unknown or recursive types). Use --log-level verbose for details.`);
		for (const warning of warnings) log.verbose(warning);
	}
	log.success(`Mock files: ${result.generated} generated, ${result.overwritten} overwritten, ${result.skipped} skipped.`);
	return { ...result, warnings };
}
