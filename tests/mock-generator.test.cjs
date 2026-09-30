const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { createJiti } = require('jiti');
const Mock = require('mockjs');
const ts = require('typescript');

const jiti = createJiti(__filename);
const { readMockOperations } = jiti('../src/mock-generator/reader.ts');
const { renderMockOperation } = jiti('../src/mock-generator/template.ts');
const { writeMockFiles } = jiti('../src/mock-generator/writer.ts');
const { mockHandle, selectMockServices } = jiti('../src/mock-generator/index.ts');

async function fixture(context, files) {
	const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), 'an-cli-mock-')));
	context.after(() => fs.rm(root, { recursive: true, force: true }));
	for (const [fileName, content] of Object.entries(files)) {
		const target = path.join(root, fileName);
		await fs.mkdir(path.dirname(target), { recursive: true });
		await fs.writeFile(target, content);
	}
	return root;
}

function readerOptions(root, names = ['growth']) {
	return {
		projectRoot: root,
		apiDir: path.join(root, 'apis'),
		typeDir: path.join(root, 'types'),
		apiFiles: names.map((name) => path.join(root, 'apis', `${name}.ts`)),
	};
}

const responseDeclarations = `
interface ResponseModel<Data> {
	success: boolean;
	msg: string;
	code: number;
	timestamp: number;
	data: Data;
}
`;

const requestDeclarations = `
export declare function GET<Data>(url: string, params: unknown, level?: 'serve'): Promise<ResponseModel<Data>>;
export declare function GET<Data>(url: string, params: unknown, level?: 'data'): Promise<Data>;
export declare function GET<Data>(url: string, params: unknown, level?: 'axios'): Promise<{ data: ResponseModel<Data>; status: number }>;
`;

test('reader infers the HTTP envelope for every data level without modifying API files', async (context) => {
	const apiSource = `
import { GET as read } from './config/fetch';
export const surveyServe_GET = (code: string) => read<Survey.Response>(\`/app/growth/survey/\${code}\`, {}, 'serve');
export const surveyData_GET = (code: string) => read<Survey.Response>(\`/app/growth/survey/\${code}\`, {}, 'data');
export const surveyAxios_GET = (code: string) => read<Survey.Response>(\`/app/growth/survey/\${code}\`, {}, 'axios');
`;
	const root = await fixture(context, {
		'apis/growth.ts': apiSource,
		'apis/config/api-type.d.ts': responseDeclarations,
		'apis/config/fetch.d.ts': requestDeclarations,
		'types/connectors/survey.d.ts': "declare namespace Survey { type Response = import('../models/survey').Survey; }",
		'types/models/survey.ts': 'export interface Survey { id: string; questions: Array<{ title: string; required?: boolean }>; }',
	});
	const { checker, operations } = readMockOperations(readerOptions(root));
	assert.equal(operations.length, 3);
	for (const operation of operations) {
		assert.equal(operation.url, '/app/growth/survey/:code');
		assert.equal(operation.method, 'GET');
		assert.deepEqual(
			checker.getPropertiesOfType(operation.responseType).map((symbol) => symbol.name),
			['success', 'msg', 'code', 'timestamp', 'data'],
		);
		const data = checker.getPropertyOfType(operation.responseType, 'data');
		assert.deepEqual(
			checker.getPropertiesOfType(checker.getTypeOfSymbolAtLocation(data, operation.node)).map((symbol) => symbol.name),
			['id', 'questions'],
		);
	}
	assert.equal(await fs.readFile(path.join(root, 'apis/growth.ts'), 'utf8'), apiSource);
});

test('reader reports unresolved response declarations instead of generating empty mocks', async (context) => {
	const root = await fixture(context, {
		'apis/growth.ts': "import { GET } from './config/fetch'; export const survey_GET = () => GET<Missing.Response>('/survey', {}, 'serve');",
		'apis/config/api-type.d.ts': responseDeclarations,
		'apis/config/fetch.d.ts': requestDeclarations,
	});
	assert.throws(() => readMockOperations(readerOptions(root)), /Cannot resolve the response type of survey_GET/);
});

test('mock source and public configuration pass strict type checking', () => {
	const root = path.resolve(__dirname, '..');
	const loaded = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
	const parsed = ts.parseJsonConfigFileContent({ ...loaded.config, include: ['src/mock-generator/**/*.ts', 'config.d.ts'] }, ts.sys, root);
	const host = ts.createCompilerHost(parsed.options);
	const program = ts.createProgram(parsed.fileNames, { ...parsed.options, noEmit: true }, host);
	const diagnostics = ts.getPreEmitDiagnostics(program);
	assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, host));
});

test('templates recursively preserve referenced models, enum constraints, tuples and mapped types', async (context) => {
	const root = await fixture(context, {
		'apis/growth.ts': "import { GET } from './config/fetch'; export const survey_GET = () => GET<Survey.Response>('/survey', {}, 'serve');",
		'apis/config/api-type.d.ts': responseDeclarations,
		'apis/config/fetch.d.ts': requestDeclarations,
		'types/survey.d.ts': "declare namespace Survey { type Response = import('./model').Survey; }",
		'types/model.ts': `
export enum Status { Draft = 'DRAFT', Submitted = 'SUBMITTED' }
interface Question { title: string; required: boolean; options: Array<{ label: string; score: number }>; }
export interface Survey {
	id: string;
	status: Status;
	rating: 1 | 2 | 3;
	fixed: 'fixed';
	format: string;
	version: number;
	/** @example static-title */
	title: string;
	/** @example 2026-01-01T00:00:00Z */
	createdAt: string;
	questions: Question[];
	tuple: readonly [string, number, true];
	mapped: Partial<Record<'en' | 'zh', string>>;
	counts: Record<string, number>;
	nested: { first: string } & { second: number };
	optional?: boolean;
	forbidden?: never;
	nullOnly: null;
}
`,
	});
	const { checker, operations } = readMockOperations(readerOptions(root));
	const { template, warnings } = renderMockOperation(checker, operations[0]);
	assert.deepEqual(warnings, []);
	assert.equal(template.code, 10000);
	assert.equal(template.msg, 'success');
	assert.equal(template.success, true);
	assert.equal(template.data.title, '@string');
	assert.equal(template.data.id, '@guid');
	assert.equal(template.data.fixed, 'fixed');
	assert.equal(template.data.format, '@string');
	assert.equal(template.data.createdAt, '@datetime("yyyy-MM-ddTHH:mm:ss")Z');
	assert.equal(Object.hasOwn(template.data, 'forbidden'), false);
	assert.deepEqual(template.data.mapped, { en: '@string', zh: '@string' });
	for (let attempt = 0; attempt < 10; attempt++) {
		const value = Mock.mock(template);
		assert.ok(['DRAFT', 'SUBMITTED'].includes(value.data.status));
		assert.ok([1, 2, 3].includes(value.data.rating));
		assert.equal(typeof value.data.version, 'number');
		assert.equal(typeof value.data.optional, 'boolean');
		assert.equal(value.data.questions.length, 1);
		assert.equal(typeof value.data.questions[0].required, 'boolean');
		assert.equal(typeof value.data.questions[0].options[0].score, 'number');
		assert.deepEqual(
			value.data.tuple.map((item) => typeof item),
			['string', 'number', 'boolean'],
		);
		assert.equal(value.data.tuple[2], true);
		assert.equal(typeof value.data.counts.key, 'number');
		assert.deepEqual(Object.keys(value.data.nested), ['first', 'second']);
	}
});

test('unknown dictionaries and recursive types produce bounded templates with explicit warnings', async (context) => {
	const root = await fixture(context, {
		'apis/growth.ts': "import { GET } from './config/fetch'; export const tree_GET = () => GET<Tree>('/tree', {}, 'serve');",
		'apis/config/api-type.d.ts': responseDeclarations,
		'apis/config/fetch.d.ts': requestDeclarations,
		'types/tree.d.ts': 'interface Tree { children: Tree[]; parent?: Tree; config: Record<string, unknown>; unknown: unknown; }',
	});
	const { checker, operations } = readMockOperations(readerOptions(root));
	const { template, warnings } = renderMockOperation(checker, operations[0]);
	assert.deepEqual(template.data.children, []);
	assert.equal(Object.hasOwn(template.data, 'parent'), false);
	assert.deepEqual(template.data.config, {});
	assert.equal(template.data.unknown, null);
	assert.ok(warnings.some((message) => message.includes('recursive')));
	assert.ok(warnings.some((message) => message.includes('tree_GET.data.config')));
	assert.doesNotThrow(() => Mock.mock(template));
});

test('already wrapped responses are not wrapped twice and defaults only change declared root fields', async (context) => {
	const root = await fixture(context, {
		'apis/growth.ts': "import { GET } from './config/fetch'; export const wrapped_GET = () => GET<ResponseModel<{ title: string }>>('/wrapped', {}, 'serve');",
		'apis/config/api-type.d.ts': responseDeclarations,
		'apis/config/fetch.d.ts': requestDeclarations,
	});
	const { checker, operations } = readMockOperations(readerOptions(root));
	const { template } = renderMockOperation(checker, operations[0], { responseDefaults: { code: 200, msg: 'OK', notDeclared: true } });
	assert.deepEqual(template.data, { title: '@string' });
	assert.equal(template.code, 200);
	assert.equal(template.msg, 'OK');
	assert.equal(Object.hasOwn(template, 'notDeclared'), false);
});

function mockFile(name = 'survey_GET', url = '/app/growth/survey/:code', service = 'growth') {
	return {
		service,
		operation: { name, method: 'GET', url, description: 'Survey response' },
		template: { code: 10000, success: true, data: { title: '@string' } },
	};
}

test('writer generates service folders and valid commented JSON without removing other files', async (context) => {
	const root = await fixture(context, { 'mocks/unrelated.json': 'keep this file' });
	const directory = path.join(root, 'mocks');
	const result = await writeMockFiles(directory, [mockFile()]);
	assert.equal(result.generated, 1);
	const content = await fs.readFile(path.join(directory, 'growth/survey_GET.json'), 'utf8');
	assert.match(content, /\* @url \/app\/growth\/survey\/:code/);
	assert.match(content, /\* @method GET/);
	const template = JSON.parse(content.slice(content.indexOf('*/') + 2));
	assert.equal(Mock.mock(template).success, true);
	assert.equal(await fs.readFile(path.join(directory, 'unrelated.json'), 'utf8'), 'keep this file');
	const repeated = await writeMockFiles(directory, [mockFile()]);
	assert.equal(repeated.skipped, 1);
	assert.equal(repeated.generated, 0);
});

test('existing legacy routes are preserved even with different parameter names and filenames', async (context) => {
	const original = '/**\n * Existing survey\n * @url /app/growth/survey/:id\n * @method GET\n */\n{"manual":true}\n';
	const root = await fixture(context, { 'mocks/custom-survey.json': original });
	const directory = path.join(root, 'mocks');
	const skipped = await writeMockFiles(directory, [mockFile()]);
	assert.equal(skipped.skipped, 1);
	assert.equal(await fs.readFile(path.join(directory, 'custom-survey.json'), 'utf8'), original);
	await assert.rejects(fs.access(path.join(directory, 'growth')), { code: 'ENOENT' });
	const overwritten = await writeMockFiles(directory, [mockFile()], { overwrite: true });
	assert.equal(overwritten.overwritten, 1);
	assert.deepEqual(overwritten.files, [path.join(directory, 'custom-survey.json')]);
	assert.match(await fs.readFile(overwritten.files[0], 'utf8'), /@url \/app\/growth\/survey\/:code/);
});

test('overwrite never modifies matching routes in another service directory', async (context) => {
	const original = '/**\n * Existing\n * @url /app/growth/survey/:id\n * @method GET\n */\n{"manual":true}';
	const root = await fixture(context, { 'mocks/user/survey.json': original });
	const directory = path.join(root, 'mocks');
	assert.equal((await writeMockFiles(directory, [mockFile()])).skipped, 1);
	await assert.rejects(writeMockFiles(directory, [mockFile()], { overwrite: true }), /another service directory/);
	assert.equal(await fs.readFile(path.join(directory, 'user/survey.json'), 'utf8'), original);
});

test('conflicting new or existing routes are rejected before any files are written', async (context) => {
	const root = await fixture(context, {});
	const directory = path.join(root, 'mocks');
	await assert.rejects(writeMockFiles(directory, [mockFile(), mockFile('duplicate_GET', '/app/growth/survey/:id', 'other')]), /Multiple selected APIs/);
	await assert.rejects(fs.access(directory), { code: 'ENOENT' });
	const header = '/**\n * Existing\n * @url /app/growth/survey/:code\n * @method GET\n */\n{}';
	await fs.mkdir(directory);
	await fs.writeFile(path.join(directory, 'first.json'), header);
	await fs.writeFile(path.join(directory, 'second.json'), header);
	await assert.rejects(writeMockFiles(directory, [mockFile()], { overwrite: true }), /Multiple existing mocks/);
	assert.equal(await fs.readFile(path.join(directory, 'first.json'), 'utf8'), header);
	await assert.rejects(fs.access(path.join(directory, 'growth')), { code: 'ENOENT' });
});

async function projectFixture(context) {
	return fixture(context, {
		'an.config.json': JSON.stringify({
			saveApiListFolderPath: 'apis',
			saveTypeFolderPath: 'types',
			logLevel: 'silent',
			mock: { mockDir: 'mock fixtures', arrayLength: 2, responseDefaults: { code: 0 } },
			swaggerConfig: [
				{ name: 'Surveys', apiListFileName: 'growth.ts', url: 'https://invalid.local', mock: { responseDefaults: { code: 200 } } },
				{ name: 'Accounts', apiListFileName: 'user.ts', url: 'https://invalid.local' },
			],
		}),
		'apis/growth.ts': "import { GET } from './config/fetch'; export const survey_GET = () => GET<Survey>('/survey', {}, 'serve');",
		'apis/user.ts': "import { GET } from './config/fetch'; export const user_GET = () => GET<Survey>('/user', {}, 'data');",
		'apis/index.ts': "export * from './growth'; export * from './user';",
		'apis/helper.ts': 'export const helper = () => true;',
		'apis/config/api-type.d.ts': responseDeclarations,
		'apis/config/fetch.d.ts': requestDeclarations,
		'types/survey.d.ts': 'interface Survey { id: string; tags: string[]; }',
	});
}

test('command selects generated services by name or filename and respects per-service options', async (context) => {
	const root = await projectFixture(context);
	const result = await mockHandle({ service: 'SURVEYS' }, root);
	assert.equal(result.generated, 1);
	const content = await fs.readFile(path.join(root, 'mock fixtures/growth/survey_GET.json'), 'utf8');
	const template = JSON.parse(content.slice(content.indexOf('*/') + 2));
	assert.equal(template.code, 200);
	assert.equal(template.data.tags.length, 2);
	await assert.rejects(fs.access(path.join(root, 'mock fixtures/user')), { code: 'ENOENT' });
	const repeated = await mockHandle({ service: 'growth' }, root);
	assert.equal(repeated.skipped, 1);
	const all = await mockHandle({ all: true }, root);
	assert.equal(all.generated, 1);
	assert.equal(all.skipped, 1);
	await assert.rejects(mockHandle({ service: 'not-generated' }, root), /Unknown generated service/);
	await assert.rejects(mockHandle({ all: true, service: 'growth' }, root), /cannot be used together/);
});

test('TypeScript configuration takes precedence and generated API modules are never executed', async (context) => {
	const root = await projectFixture(context);
	await fs.writeFile(
		path.join(root, 'an.config.ts'),
		"export default { saveApiListFolderPath: 'apis', saveTypeFolderPath: 'types', logLevel: 'silent', mock: { mockDir: 'typescript-mocks' } };",
	);
	await fs.appendFile(path.join(root, 'apis/growth.ts'), "\nthrow new Error('API modules must never execute');");
	const result = await mockHandle({ service: 'growth' }, root);
	assert.equal(result.generated, 1);
	assert.equal(result.files[0], path.join(root, 'typescript-mocks/growth/survey_GET.json'));
	await assert.rejects(fs.access(path.join(root, 'mock fixtures')), { code: 'ENOENT' });
});

test('interactive selection lists services only and supports empty selection as all', async (context) => {
	const inquirer = jiti('inquirer').default;
	const services = [
		{ name: 'Growth', segment: 'growth', fileName: 'growth.ts' },
		{ name: 'User', segment: 'user', fileName: 'user.ts' },
	];
	context.mock.method(inquirer, 'prompt', async (questions) => {
		assert.deepEqual(
			questions[0].choices.map((choice) => choice.name),
			['Growth (growth.ts)', 'User (user.ts)'],
		);
		return { picked: [1] };
	});
	assert.deepEqual(await selectMockServices(services, {}, true), [services[1]]);
	context.mock.method(inquirer, 'prompt', async () => ({ picked: [] }));
	assert.deepEqual(await selectMockServices(services, {}, true), services);
});

test('built CLI exposes mock options and fails unknown service selection without writing output', async (context) => {
	const cli = path.resolve(__dirname, '../bin/an-cli.js');
	const help = spawnSync(process.execPath, [cli, 'mock', '--help'], { encoding: 'utf8' });
	assert.equal(help.status, 0, help.stderr);
	assert.match(help.stdout, /--overwrite/);
	assert.match(help.stdout, /--service/);
	const root = await projectFixture(context);
	const failed = spawnSync(process.execPath, [cli, 'mock', '-S', 'missing'], { cwd: root, encoding: 'utf8' });
	assert.equal(failed.status, 1);
	assert.match(failed.stderr, /Unknown generated service/);
	await assert.rejects(fs.access(path.join(root, 'mock fixtures')), { code: 'ENOENT' });
	const success = spawnSync(process.execPath, [cli, 'mock', '-S', 'growth', '--mock-dir', 'cli-mocks'], { cwd: root, encoding: 'utf8' });
	assert.equal(success.status, 0, success.stderr);
	await fs.access(path.join(root, 'cli-mocks/growth/survey_GET.json'));
});
