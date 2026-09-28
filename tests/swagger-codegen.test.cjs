const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { EventEmitter } = require('node:events');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { PassThrough } = require('node:stream');
const { test } = require('node:test');
const { createJiti } = require('jiti');
const crossSpawn = require('cross-spawn');

const jiti = createJiti(__filename);
const { Main } = jiti('../src/swagger-codegen/index.ts');
const { createDefaultConfig } = jiti('../src/swagger-codegen/config-template.ts');
const { REQUIRED_TEMPLATE_FILES, SUPPORTED_REQUEST_TEMPLATES } = jiti('../src/swagger-codegen/shared/constants.ts');
const { collectFormatTargets, formatGeneratedFiles } = jiti('../src/swagger-codegen/shared/prettier.ts');
const { copyAjaxConfigFiles, normalizeRequestTemplate } = jiti('../src/swagger-codegen/shared/request-template.ts');
const { mergeNamespaceExports, readIndexLines, writeIndexFileWithDedup } = jiti('../src/swagger-codegen/shared/writer.ts');
const { clearDir, clearDirExcept, log, writeFileRecursive } = jiti('../src/utils/index.ts');

async function fixture(context) {
	const cwd = process.cwd();
	const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'an-cli-codegen-')));
	context.after(async () => {
		if (process.cwd() === root) process.chdir(cwd);
		await fs.rm(root, { recursive: true, force: true });
	});
	return root;
}

function childResult(code = 0, stderr = '') {
	const child = new EventEmitter();
	child.stdout = new PassThrough();
	child.stderr = new PassThrough();
	process.nextTick(() => {
		child.stdout.end();
		child.stderr.end(stderr);
		child.emit('close', code);
	});
	return child;
}

function outputConfig(root) {
	return {
		...createDefaultConfig(),
		saveApiListFolderPath: `${root}/apis`,
		saveTypeFolderPath: `${root}/types`,
		saveEnumFolderPath: `${root}/enums`,
	};
}

test('filesystem helpers support native paths, spaces and shell characters', async (context) => {
	const root = await fixture(context);
	const target = path.join(root, 'generated files & data');
	const kept = path.join(target, 'config', 'dio.ts');
	const removed = path.join(target, 'nested files', 'api.ts');
	const sibling = path.join(root, 'keep.ts');
	const linkedFile = path.join(root, 'linked content', 'keep.ts');
	await writeFileRecursive(kept, 'keep config');
	await writeFileRecursive(removed, 'remove api');
	await writeFileRecursive(sibling, 'keep sibling');
	await writeFileRecursive(linkedFile, 'keep link target');
	await fs.symlink(path.dirname(linkedFile), path.join(target, 'linked folder'), 'junction');
	assert.equal(await clearDirExcept(target, ['config']), true);
	assert.equal(await fs.readFile(kept, 'utf8'), 'keep config');
	assert.equal(await fs.readFile(linkedFile, 'utf8'), 'keep link target');
	await assert.rejects(fs.access(removed), { code: 'ENOENT' });
	assert.equal(await clearDir(target), true);
	await assert.rejects(fs.access(target), { code: 'ENOENT' });
	assert.equal(await fs.readFile(sibling, 'utf8'), 'keep sibling');
	assert.equal(await clearDir(target), true);
	assert.equal(await clearDirExcept(target), true);
	assert.equal(await clearDir(sibling), true);
});

test('filesystem cleanup reports deletion failures', async (context) => {
	const failure = Object.assign(new Error('access denied'), { code: 'EACCES' });
	context.mock.method(fs, 'rm', async () => {
		throw failure;
	});
	await assert.rejects(clearDir('unwritable'), { code: 'EACCES' });
});

test('request template normalization preserves defaults and validation', () => {
	for (const input of [undefined, null, '']) assert.equal(normalizeRequestTemplate(input, 'test'), 'axios');
	for (const template of SUPPORTED_REQUEST_TEMPLATES) assert.equal(normalizeRequestTemplate(` ${template.toUpperCase()} `, 'test'), template);
	for (const input of [false, {}, 'unknown', ' ']) assert.throws(() => normalizeRequestTemplate(input, 'test'), /test/);
});

test('namespace merging upgrades models but preserves flat shared enum exports', () => {
	const existing = ["export * from './op';", "export * from './notice';", "export * from './import-task-status';"];
	assert.deepEqual(mergeNamespaceExports(existing, ['op'], ['op'], true), [
		"export * as Notice from './notice';",
		"export * as ImportTaskStatus from './import-task-status';",
		"export * as Op from './op';",
	]);
	assert.deepEqual(mergeNamespaceExports(existing, ['op'], ['op']), [...existing.slice(1), "export * as Op from './op';"]);
	assert.deepEqual(mergeNamespaceExports(existing, ['op'], []), existing.slice(1));
	assert.deepEqual(mergeNamespaceExports([], ['op'], ['op']), ["export * as Op from './op';"]);
	assert.deepEqual(mergeNamespaceExports(["export * from './---';"], [], [], true), ["export * from './---';"]);
	assert.throws(() => mergeNamespaceExports([], ['---'], ['---']));
});

test('index reads and append writes preserve existing dedup behavior', async (context) => {
	const root = await fixture(context);
	const file = `${root}/index.ts`;
	assert.deepEqual(await readIndexLines(file), []);
	await fs.writeFile(file, "export * from './op';\n\n");
	await writeIndexFileWithDedup(file, ["export * from './op';", "export * from './notice';"], { appendMode: true });
	assert.deepEqual(await readIndexLines(file), ["export * from './op';", "export * from './notice';"]);
	await writeIndexFileWithDedup(file, [], { appendMode: false });
	assert.equal((await readIndexLines(file)).length, 2);
	await writeIndexFileWithDedup(file, ["export * from './new';"]);
	assert.deepEqual(await readIndexLines(file), ["export * from './new';"]);
});

test('entry barrels retain unselected services and remove obsolete enum exports', async (context) => {
	const root = await fixture(context);
	const config = outputConfig(root);
	const main = new Main();
	const segments = ['op', 'notice'];
	const servers = [{ enumIsolation: 'segment' }, { enumIsolation: 'none' }];
	await fs.mkdir(`${root}/enums/op`, { recursive: true });
	await fs.writeFile(`${root}/enums/index.ts`, "export * from './shared-status';\nexport * as Op from './op';\n");
	await fs.writeFile(`${root}/enums/op/index.ts`, '');
	await main.writeTopLevelEnumsBarrel(config, segments, servers, [0], true);
	assert.deepEqual(await readIndexLines(`${root}/enums/index.ts`), ["export * from './shared-status';"]);
	await fs.writeFile(`${root}/enums/op/status.ts`, 'export enum Status { Active }');
	await main.writeTopLevelEnumsBarrel(config, segments, servers, [0, 1], false);
	assert.deepEqual(await readIndexLines(`${root}/enums/index.ts`), ["export * from './shared-status';", "export * as Op from './op';"]);
	await main.writeTopLevelModelsBarrel(config, segments, [0, 1], false);
	await main.writeTopLevelModelsBarrel(config, segments, [0], true);
	assert.deepEqual(await readIndexLines(`${root}/types/models/index.ts`), ["export * as Notice from './notice';", "export * as Op from './op';"]);
});

test('format targets stay service-scoped and shared enum globs are non-recursive', async (context) => {
	const root = await fixture(context);
	const globRoot = root.replace(/\\/g, '/');
	const config = outputConfig(root);
	assert.deepEqual(await collectFormatTargets(config), []);
	for (const folder of ['apis', 'types/models/op', 'types/connectors/op', 'enums/op', 'enums/notice']) {
		await fs.mkdir(`${root}/${folder}`, { recursive: true });
	}
	await fs.writeFile(`${root}/apis/op.ts`, '');
	const selection = {
		servers: [{ apiListFileName: 'op.ts' }, { apiListFileName: 'notice.ts', enumIsolation: 'none' }],
		selectedIndices: [0],
		segments: ['op', 'notice'],
		isolateBySegment: true,
	};
	assert.deepEqual(await collectFormatTargets(config, selection), [
		`${globRoot}/apis/op.ts`,
		`${globRoot}/types/connectors/op/**/*.{ts,d.ts}`,
		`${globRoot}/types/models/op/**/*.{ts,d.ts}`,
		`${globRoot}/enums/op/**/*.{ts,d.ts}`,
	]);
	selection.servers[0].enumIsolation = 'none';
	selection.selectedIndices = [0, 1];
	const targets = await collectFormatTargets(config, selection);
	assert.equal(targets.filter((target) => target === `${globRoot}/enums/*.ts`).length, 1);
	assert.equal(
		targets.some((target) => target.includes('notice')),
		false,
	);
	assert.deepEqual(await collectFormatTargets(config), [`${globRoot}/types/**/*.{ts,d.ts}`, `${globRoot}/apis/**/*.ts`, `${globRoot}/enums/**/*.ts`]);
	selection.isolateBySegment = false;
	assert.ok((await collectFormatTargets(config, selection)).includes(`${globRoot}/types/models/**/*.{ts,d.ts}`));
});

test('Prettier glob targets normalize Windows separators without shell quoting', async (context) => {
	context.mock.method(fs, 'access', async () => undefined);
	const config = {
		saveApiListFolderPath: 'C:\\project with spaces\\apis',
		saveTypeFolderPath: 'C:\\project with spaces\\types',
		saveEnumFolderPath: 'C:\\project with spaces\\enums',
	};
	assert.deepEqual(await collectFormatTargets(config), [
		'C:/project with spaces/types/**/*.{ts,d.ts}',
		'C:/project with spaces/apis/**/*.ts',
		'C:/project with spaces/enums/**/*.ts',
	]);
});

test('Prettier resolves local executable, explicit config, auto config and package fallback', async (context) => {
	const root = await fixture(context);
	process.chdir(root);
	const config = outputConfig(root);
	const commands = [];
	context.mock.method(crossSpawn, 'spawn', (command, args) => {
		commands.push({ command, args });
		return childResult();
	});
	await formatGeneratedFiles(config, true);
	assert.equal(commands.length, 0);
	await fs.mkdir(`${root}/apis`);
	await fs.mkdir(`${root}/node_modules/.bin`, { recursive: true });
	const executable = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'prettier.cmd' : 'prettier');
	await fs.writeFile(executable, '', { mode: 0o755 });
	await fs.writeFile(`${root}/custom.json`, '{}');
	await fs.writeFile(`${root}/.prettierrc`, '{}');
	await fs.writeFile(`${root}/package.json`, JSON.stringify({ prettier: {} }));
	await formatGeneratedFiles(config, ' custom.json ');
	assert.equal(commands.at(-1).command, executable);
	assert.equal(commands.at(-1).args[0], '--write');
	assert.deepEqual(commands.at(-1).args.slice(-2), ['--config', path.join(root, 'custom.json')]);
	await formatGeneratedFiles(config, 'missing.json');
	assert.deepEqual(commands.at(-1).args.slice(-2), ['--config', path.join(root, '.prettierrc')]);
	await fs.rm(`${root}/.prettierrc`);
	await fs.rm(executable);
	await formatGeneratedFiles(config, true);
	assert.equal(commands.at(-1).command, 'npx');
	assert.deepEqual(commands.at(-1).args.slice(0, 2), ['prettier', '--write']);
	assert.deepEqual(commands.at(-1).args.slice(-2), ['--config', path.join(root, 'package.json')]);
	await fs.rm(`${root}/package.json`);
	await formatGeneratedFiles(config, true);
	assert.equal(commands.at(-1).args.includes('--config'), false);
	context.mock.method(crossSpawn, 'spawn', () => childResult(1, 'failure'));
	const errors = context.mock.method(log, 'error', () => undefined);
	await assert.doesNotReject(() => formatGeneratedFiles(config, true));
	assert.equal(errors.mock.callCount(), 1);
	context.mock.method(crossSpawn, 'spawn', () => {
		const child = new EventEmitter();
		process.nextTick(() => child.emit('error', Object.assign(new Error('command not found'), { code: 'ENOENT' })));
		return child;
	});
	await assert.doesNotReject(() => formatGeneratedFiles(config, true));
	assert.equal(errors.mock.callCount(), 2);
});

test('all bundled request templates copy their required files and marker', async (context) => {
	const root = await fixture(context);
	const assets = path.resolve(__dirname, '../postbuild-assets/request-templates');
	for (const template of SUPPORTED_REQUEST_TEMPLATES) {
		await copyAjaxConfigFiles(`${root}/${template}`, template, assets);
		for (const file of REQUIRED_TEMPLATE_FILES) await fs.access(`${root}/${template}/config/${file}`);
		assert.match(await fs.readFile(`${root}/${template}/config/dio.ts`, 'utf8'), new RegExp(`@an-cli-request-template: ${template}`));
	}
});

test('template copying supports shared-only fallback, overrides and existing configs', async (context) => {
	const root = await fixture(context);
	const assets = `${root}/assets`;
	await fs.mkdir(`${assets}/_shared`, { recursive: true });
	for (const file of REQUIRED_TEMPLATE_FILES) await fs.writeFile(`${assets}/_shared/${file}`, `shared:${file}`);
	await copyAjaxConfigFiles(`${root}/shared`, 'axios', assets);
	assert.equal(await fs.readFile(`${root}/shared/config/fetch.ts`, 'utf8'), 'shared:fetch.ts');
	await fs.mkdir(`${assets}/axios`);
	await fs.writeFile(`${assets}/axios/dio.ts`, '// @an-cli-request-template: axios\ncustom');
	await fs.writeFile(`${assets}/axios/fetch.ts`, 'override');
	await copyAjaxConfigFiles(`${root}/override`, 'axios', assets);
	assert.equal(await fs.readFile(`${root}/override/config/fetch.ts`, 'utf8'), 'override');
	assert.equal(await fs.readFile(`${root}/override/config/dio.ts`, 'utf8'), '// @an-cli-request-template: axios\ncustom');
	const warning = context.mock.method(log, 'warning', () => undefined);
	await copyAjaxConfigFiles(`${root}/override`, 'wx', assets);
	assert.equal(warning.mock.callCount(), 1);
	assert.equal(await fs.readFile(`${root}/override/config/fetch.ts`, 'utf8'), 'override');
	await fs.writeFile(`${root}/override/config/dio.ts`, 'user config without marker');
	await copyAjaxConfigFiles(`${root}/override`, 'wx', assets);
	assert.equal(await fs.readFile(`${root}/override/config/dio.ts`, 'utf8'), 'user config without marker');
});

test('missing template files do not create output and copy failures roll it back', async (context) => {
	const root = await fixture(context);
	await assert.rejects(() => copyAjaxConfigFiles(`${root}/missing`, 'axios', `${root}/assets`), /Source file not found/);
	await assert.rejects(fs.access(`${root}/missing/config`), { code: 'ENOENT' });
	const assets = path.resolve(__dirname, '../postbuild-assets/request-templates');
	context.mock.method(fs, 'copyFile', async () => {
		throw new Error('copy failed');
	});
	await assert.rejects(() => copyAjaxConfigFiles(`${root}/failure`, 'axios', assets), /copy failed/);
	await assert.rejects(fs.access(`${root}/failure/config`), { code: 'ENOENT' });
});

test('built CLI generates and formats projects with native paths and spaces', async (context) => {
	const root = await fixture(context);
	const project = path.join(root, 'project with spaces & data');
	const cli = path.resolve(__dirname, '../bin/an-cli.js');
	const prettier = require('prettier');
	const prettierPackage = require.resolve('prettier/package.json');
	const prettierCli = path.resolve(path.dirname(prettierPackage), require(prettierPackage).bin);
	const style = { singleQuote: true, useTabs: true, semi: false };
	await fs.mkdir(project);

	const run = (args, env = process.env) => {
		const result = spawnSync(process.execPath, [cli, 'type', ...args], { cwd: project, env, encoding: 'utf8', timeout: 30000 });
		assert.ifError(result.error);
		assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
		assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /Format failed|Initialization failed/);
	};
	const installLauncher = async (directory, name) => {
		await fs.mkdir(directory, { recursive: true });
		const script = `${name === 'npx' ? 'process.argv.splice(2, 1);\n' : ''}require(${JSON.stringify(prettierCli)});\n`;
		if (process.platform === 'win32') {
			const proxy = path.join(directory, `${name}.cjs`);
			await fs.writeFile(proxy, script);
			const launcher = path.join(directory, `${name}.cmd`);
			await fs.writeFile(launcher, `@echo off\r\n"${process.execPath}" "${proxy}" %*\r\n`);
			return launcher;
		}
		const launcher = path.join(directory, name);
		await fs.writeFile(launcher, `#!/usr/bin/env node\n${script}`, { mode: 0o755 });
		return launcher;
	};

	run(['--template', 'fetch']);
	const scaffold = path.join(project, 'an.config.ts');
	assert.match(await fs.readFile(scaffold, 'utf8'), /fetch/);
	assert.match(await fs.readFile(path.join(project, 'src', 'apis', 'config', 'dio.ts'), 'utf8'), /@an-cli-request-template: fetch/);
	const config = {
		saveApiListFolderPath: path.join(project, 'output', 'api files'),
		saveTypeFolderPath: path.join(project, 'output', 'type files'),
		saveEnumFolderPath: path.join(project, 'output', 'enum files'),
		requestTemplate: 'fetch',
		swaggerConfig: ['op', 'notice'].map((name) => ({ name, url: path.join(project, `${name}.json`), apiListFileName: `${name}.ts` })),
	};
	const document = {
		openapi: '3.0.0',
		info: { title: 'fixture', version: '1' },
		components: {
			schemas: {
				Item: { type: 'object', properties: { id: { type: 'integer' }, state: { type: 'string', enum: ['active', 'paused'] } } },
			},
		},
		paths: {
			'/items': {
				get: { responses: { 200: { description: 'ok', content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } } } } },
			},
		},
	};
	for (const server of config.swaggerConfig) await fs.writeFile(server.url, JSON.stringify(document));
	await fs.writeFile(scaffold, `export default ${JSON.stringify(config)};\n`);
	const stylePath = path.join(project, 'prettier settings.json');
	await fs.writeFile(stylePath, JSON.stringify(style));
	const localPrettier = await installLauncher(path.join(project, 'node_modules', '.bin'), 'prettier');
	run(['--service', 'op,notice', '--format', stylePath]);
	const opFile = path.join(config.saveApiListFolderPath, 'op.ts');
	const noticeFile = path.join(config.saveApiListFolderPath, 'notice.ts');
	assert.equal(await prettier.check(await fs.readFile(opFile, 'utf8'), { ...style, filepath: opFile }), true);
	assert.match(await fs.readFile(path.join(config.saveTypeFolderPath, 'models', 'index.ts'), 'utf8'), /export \* as Notice/);
	const preserved = (await fs.readFile(noticeFile, 'utf8')) + '\n// unselected sentinel\n';
	await fs.writeFile(noticeFile, preserved);
	const configFile = path.join(config.saveApiListFolderPath, 'config', 'dio.ts');
	const originalTemplate = await fs.readFile(configFile, 'utf8');
	document.paths['/extra'] = document.paths['/items'];
	await fs.writeFile(config.swaggerConfig[0].url, JSON.stringify(document));
	run(['--service', 'op', '--format', stylePath]);
	assert.match(await fs.readFile(opFile, 'utf8'), /\/extra/);
	assert.equal(await fs.readFile(noticeFile, 'utf8'), preserved);
	assert.equal(await fs.readFile(configFile, 'utf8'), originalTemplate);
	assert.equal(await prettier.check(await fs.readFile(opFile, 'utf8'), { ...style, filepath: opFile }), true);

	await fs.rm(localPrettier);
	const tools = path.join(project, 'fallback tools');
	await installLauncher(tools, 'npx');
	const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === 'path') || 'PATH';
	const env = { ...process.env, [pathKey]: `${tools}${path.delimiter}${process.env[pathKey] || ''}` };
	run(['--service', 'op', '--format', stylePath], env);
	assert.equal(await fs.readFile(noticeFile, 'utf8'), preserved);
	assert.equal(await prettier.check(await fs.readFile(opFile, 'utf8'), { ...style, filepath: opFile }), true);
});
