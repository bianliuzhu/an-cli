import type { ConfigType, ExecResult, FormatTarget, PrettierCommand, ServiceSelection } from '../types';

import chalk from 'chalk';
import { spawn } from 'cross-spawn';
import fs from 'fs';
import path from 'path';

import { log, spinner } from '../../utils';
import { PRETTIER_CONFIG_FILES } from './constants';
import { isEnumIsolated } from './naming';

async function resolvePrettierExecutable(): Promise<PrettierCommand> {
	const localBin = path.join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'prettier.cmd' : 'prettier');
	try {
		await fs.promises.access(localBin, fs.constants.X_OK);
		log.info(`Using local prettier: ${localBin}`);
		return { command: localBin, args: [] };
	} catch {
		return { command: 'npx', args: ['prettier'] };
	}
}

async function detectPrettierConfig(): Promise<string | null> {
	for (const fileName of PRETTIER_CONFIG_FILES) {
		const fullPath = path.join(process.cwd(), fileName);
		try {
			await fs.promises.access(fullPath);
			log.info(`Auto-detected prettier config: ${fileName}`);
			return fullPath;
		} catch {
			continue;
		}
	}
	try {
		const pkgPath = path.join(process.cwd(), 'package.json');
		const pkg = JSON.parse(await fs.promises.readFile(pkgPath, 'utf8')) as Record<string, unknown>;
		if (pkg.prettier) {
			log.info('Using prettier config from package.json');
			return pkgPath;
		}
	} catch {
		return null;
	}
	return null;
}

async function resolvePrettierConfigArgs(formatOption: string | boolean): Promise<string[]> {
	if (typeof formatOption === 'string' && formatOption.trim()) {
		const configPath = path.resolve(process.cwd(), formatOption.trim());
		try {
			await fs.promises.access(configPath);
			return ['--config', configPath];
		} catch {
			log.warning(`Prettier config file not found: ${formatOption}, falling back to auto-detection...`);
		}
	}
	const detected = await detectPrettierConfig();
	return detected ? ['--config', detected] : [];
}

export async function collectFormatTargets(config: ConfigType, selection?: ServiceSelection): Promise<string[]> {
	const candidates: FormatTarget[] = [];
	if (selection) {
		const { servers, selectedIndices, segments, isolateBySegment } = selection;
		for (const index of selectedIndices) {
			candidates.push({ path: `${config.saveApiListFolderPath}/${servers[index].apiListFileName}` });
			const segment = isolateBySegment ? segments[index] : '';
			for (const folder of ['connectors', 'models']) {
				candidates.push({ path: `${config.saveTypeFolderPath}/${folder}${segment ? `/${segment}` : ''}`, pattern: '**/*.{ts,d.ts}' });
			}
			const enumSegment = segment && isEnumIsolated(servers[index]) ? segment : '';
			candidates.push({
				path: `${config.saveEnumFolderPath}${enumSegment ? `/${enumSegment}` : ''}`,
				pattern: enumSegment ? '**/*.{ts,d.ts}' : '*.ts',
			});
		}
	} else {
		candidates.push(
			{ path: config.saveTypeFolderPath, pattern: '**/*.{ts,d.ts}' },
			{ path: config.saveApiListFolderPath, pattern: '**/*.ts' },
			{ path: config.saveEnumFolderPath, pattern: '**/*.ts' },
		);
	}

	const targets = new Set<string>();
	for (const candidate of candidates) {
		try {
			await fs.promises.access(candidate.path);
			targets.add(`${candidate.path}${candidate.pattern ? `/${candidate.pattern}` : ''}`.replace(/\\/g, '/'));
		} catch {
			continue;
		}
	}
	return [...targets];
}

export async function formatGeneratedFiles(config: ConfigType, formatOption: string | boolean, selection?: ServiceSelection): Promise<void> {
	const targets = await collectFormatTargets(config, selection);
	if (!targets.length) {
		log.warning(selection ? 'No files to format for the selected services.' : 'No generated directories found to format.');
		return;
	}

	const executable = await resolvePrettierExecutable();
	const configArgs = await resolvePrettierConfigArgs(formatOption);
	const args = [...executable.args, '--write', ...targets, ...configArgs];
	const formatCommand = [executable.command, ...args].map((argument) => JSON.stringify(argument)).join(' ');
	try {
		spinner.start(selection ? 'Formatting selected files...' : 'Formatting generated files...');
		const { stdout, stderr } = await new Promise<ExecResult>((resolve, reject) => {
			const child = spawn(executable.command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
			let stdout = '';
			let stderr = '';
			child.stdout?.setEncoding('utf8').on('data', (chunk: string) => {
				stdout += chunk;
			});
			child.stderr?.setEncoding('utf8').on('data', (chunk: string) => {
				stderr += chunk;
			});
			child.on('error', reject);
			child.on('close', (code) => {
				if (code !== 0) reject(new Error(stderr || `Prettier exited with code ${String(code)}`));
				else resolve({ stdout, stderr });
			});
		});
		if (stdout) log.print(stdout);
		if (stderr) log.print(stderr, '\n$', chalk.yellow(formatCommand), '\n');
		spinner.success('File formatting successful');
		log.print('\n');
	} catch (error: unknown) {
		spinner.error('Format failed');
		log.print(error);
		log.error('Format failed. Executable and arguments:');
		log.print('$', chalk.yellow(formatCommand));
	}
}
