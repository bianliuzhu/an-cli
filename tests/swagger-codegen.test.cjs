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
const ts = require('typescript');

const jiti = createJiti(__filename);
const { Main } = jiti('../src/swagger-codegen/index.ts');
const { createDefaultConfig } = jiti('../src/swagger-codegen/config-template.ts');
const { normalizeOpenApiDocument } = jiti('../src/swagger-codegen/shared/openapi-document.ts');
const { SchemaDiagnostics } = jiti('../src/swagger-codegen/shared/schema-diagnostics.ts');
const { createSchemaNameMap, resolveSchemaName, typeNameToFileName } = jiti('../src/swagger-codegen/shared/naming.ts');
const { ComponentSchemaResolver } = jiti('../src/swagger-codegen/components/schema-resolver.ts');
const { EnumParser } = jiti('../src/swagger-codegen/components/enum-parser.ts');
const { renderSchemaType } = jiti('../src/swagger-codegen/shared/schema-type.ts');
const { PathParse } = jiti('../src/swagger-codegen/path/index.ts');
const { convertEndpointString } = jiti('../src/swagger-codegen/path/naming.ts');
const { SchemaResolver } = jiti('../src/swagger-codegen/path/schema-resolver.ts');
const { SUPPORTED_REQUEST_TYPES_ALL } = jiti('../src/swagger-codegen/shared/http.ts');
const { REQUIRED_TEMPLATE_FILES, SUPPORTED_REQUEST_TEMPLATES } = jiti('../src/swagger-codegen/shared/constants.ts');
const { collectFormatTargets, formatGeneratedFiles } = jiti('../src/swagger-codegen/shared/prettier.ts');
const { copyAjaxConfigFiles, normalizeRequestTemplate } = jiti('../src/swagger-codegen/shared/request-template.ts');
const { mergeNamespaceExports, readIndexLines, writeIndexFileWithDedup } = jiti('../src/swagger-codegen/shared/writer.ts');
const { clearDir, clearDirExcept, log, writeFileRecursive } = jiti('../src/utils/index.ts');
const { setLogLevel } = jiti('../src/utils/logger.ts');

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

test('codegen source and configuration extensions pass strict type checking', () => {
	const root = path.resolve(__dirname, '..');
	const loaded = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
	assert.equal(loaded.error, undefined);
	const parsed = ts.parseJsonConfigFileContent({ ...loaded.config, include: ['src/swagger-codegen/**/*.ts', 'config.d.ts'] }, ts.sys, root);
	assert.deepEqual(parsed.errors, []);
	const options = { ...parsed.options, noEmit: true };
	const host = ts.createCompilerHost(options);
	const contractPath = path.join(root, 'src/swagger-codegen/type-contract-test.ts');
	const contract = `
import { createDefaultConfig } from './config-template';
import { applyFormattingDefaults } from './shared/format';
import { defineConfig } from '../../config';
import type { ContentType, Schema, SchemaRenderResult } from './types';
defineConfig({
	stripPathPrefix: '/global',
	requestPathPrefix: '/gateway',
	swaggerConfig: { url: 'unused', stripPathPrefix: '/api', requestPathPrefix: '', mockPathPrefix: '/local' },
});
const formatted = applyFormattingDefaults({
	...createDefaultConfig(),
	typeMapping: new Map<string, string>(),
	__segment: 'example',
});
formatted.typeMapping.set('integer', 'number');
formatted.__segment.toUpperCase();
formatted.formatting.indentation.toUpperCase();
const mediaType: ContentType = 'multipart/form-data';
const reference: Schema = { $ref: '#/components/schemas/Item' };
const rendered: SchemaRenderResult = { headerRef: '', renderStr: '' };
`;
	const getSourceFile = host.getSourceFile.bind(host);
	host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) =>
		fileName === contractPath ? ts.createSourceFile(fileName, contract, languageVersion, true) : getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
	const program = ts.createProgram([...parsed.fileNames, contractPath], options, host);
	const diagnostics = ts.getPreEmitDiagnostics(program);
	assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, host));
});

test('path prefixes strip full segments for naming and prepend only to request paths', () => {
	const config = { ...createDefaultConfig(), stripPathPrefix: '/api/v1/', requestPathPrefix: 'gateway/' };
	const naming = convertEndpointString('/api/v1/users/{id}|GET', config);
	assert.deepEqual(naming, { apiName: 'users_id_GET', typeName: 'Users_Id_GET', fileName: 'users-id-get', path: '/users/${id}' });
	const parser = new PathParse({}, {}, {}, config);
	const request = parser.apiRequestItemHandle({
		...naming,
		requestPath: naming.path,
		method: 'GET',
		payload: { _path: { id: 'string' }, _query: {}, body: [] },
		_response: 'string',
		contentType: 'application/json',
	});
	assert.ok(request.includes('export const users_id_GET'));
	assert.ok(request.includes('`/gateway/users/${id}`'));
	for (const [stripPathPrefix, rawPath, expected] of [
		[undefined, '/api/users', '/api/users'],
		['', '/api/users', '/api/users'],
		['/', '/api/users', '/api/users'],
		['api', '/api/users', '/users'],
		['///api///', '/api/users', '/users'],
		['/api', '/apiculture/users', '/apiculture/users'],
		['/api', '/other/api/users', '/other/api/users'],
		['/api', '/api', '/'],
	]) {
		assert.equal(convertEndpointString(`${rawPath}|GET`, { ...config, stripPathPrefix }).path, expected);
	}
});

test('path prefixes preserve global defaults, service overrides and explicit empty strings', () => {
	const main = new Main();
	const base = {
		...createDefaultConfig(),
		stripPathPrefix: '/global',
		requestPathPrefix: '/gateway',
		swaggerConfig: [
			{ url: 'unused', apiListFileName: 'inherited.ts' },
			{ url: 'unused', apiListFileName: 'overridden.ts', stripPathPrefix: '/api', requestPathPrefix: '/service' },
			{ url: 'unused', apiListFileName: 'cleared.ts', stripPathPrefix: '', requestPathPrefix: '' },
		],
	};
	const servers = main.normalizeswaggerConfig(base, true);
	assert.deepEqual(
		servers.map((server) => {
			const config = main.buildServerConfig(base, server, '', '');
			return [config.stripPathPrefix, config.requestPathPrefix];
		}),
		[['/global', '/gateway'], ['/api', '/service'], ['', '']],
	);
});

test('schema names normalize separators and allocate deterministic collision-safe file names', () => {
	for (const [raw, expected] of [
		['services__card__types__WidgetType', 'Services_Card_Types_WidgetType'],
		['models__response__page_notice_vo__WidgetType', 'Models_Response_Page_Notice_Vo_WidgetType'],
		['ApiResult_List_Dict__', 'ApiResult_List_Dict'],
		['MediaDto-Input', 'MediaDto_Input'],
		['some.name / DTO', 'Some_Name_DTO'],
		['user_id', 'User_Id'],
		['UserDTO', 'UserDTO'],
		['123_item', '_123_Item'],
		['__', 'Unknown'],
		['class', 'Class'],
		['$Result', '$Result'],
		['用户__DTO', 'YongHu_DTO'],
	]) {
		assert.equal(resolveSchemaName(raw), expected);
		assert.equal(resolveSchemaName(expected), expected);
	}
	assert.equal(typeNameToFileName(resolveSchemaName('services__card__types__WidgetType')), 'services-card-types-widget-type');
	const rawNames = ['ApiResult_Dict_', 'ApiResult_dict_', 'Foo__Bar', 'Foo_Bar', 'Foo-Bar', 'fooBar', 'FooBar', '$', '___', 'Unknown'];
	const schemas = Object.fromEntries(rawNames.map((name) => [name, { type: 'string' }]));
	const names = createSchemaNameMap(schemas);
	assert.deepEqual(names, createSchemaNameMap(Object.fromEntries(Object.entries(schemas).reverse())));
	assert.equal(new Set(names.values()).size, rawNames.length);
	assert.equal(new Set([...names.values()].map(typeNameToFileName)).size, rawNames.length);
	for (const name of names.values()) assert.match(name, /^[A-Za-z_$][\w$]*$/);
	assert.match(names.get('ApiResult_Dict_'), /^ApiResult_Dict_[a-f0-9]{8}$/);
	assert.equal(createSchemaNameMap({ UserDTO: {} }).get('UserDTO'), 'UserDTO');
	assert.notEqual(typeNameToFileName(createSchemaNameMap({ Index: {} }).get('Index')), 'index');
	const enumSchemas = { Status: { type: 'string', enum: ['active'] }, StatusType: { type: 'object' } };
	const enumNames = createSchemaNameMap(enumSchemas, true);
	assert.notEqual(`${enumNames.get('Status')}Type`, enumNames.get('StatusType'));
	assert.equal(createSchemaNameMap(enumSchemas, false).get('Status'), 'Status');
	const collidingName = names.get('ApiResult_Dict_');
	const extended = createSchemaNameMap({ ...schemas, [collidingName]: {} });
	assert.equal(new Set([...extended.values()].map(typeNameToFileName)).size, rawNames.length + 1);
});

test('schema name allocation is shared by models, enums, references and response unwrapping', () => {
	const schemas = {
		services__card__types__WidgetType: { type: 'string', enum: ['media'] },
		models__response__WidgetType: { type: 'string', enum: ['banner'] },
		ApiResult_Dict_: { type: 'object', properties: { data: { type: 'string' } } },
		ApiResult_dict_: { type: 'object', properties: { data: { type: 'number' } } },
		'media-widget': {
			type: 'object',
			properties: { type: { $ref: '#/components/schemas/services__card__types__WidgetType' }, self: { $ref: '#/components/schemas/media-widget' } },
		},
		Wrapper: { type: 'object', properties: { left: { $ref: '#/components/schemas/ApiResult_Dict_' }, right: { $ref: '#/components/schemas/ApiResult_dict_' } } },
		$Result: { type: 'object', properties: { data: { type: 'boolean' } } },
		Status: { type: 'string', enum: ['active'] },
		StatusType: { type: 'object' },
	};
	for (const erasableSyntaxOnly of [false, true]) {
		const config = createDefaultConfig();
		config.enmuConfig.erasableSyntaxOnly = erasableSyntaxOnly;
		const names = createSchemaNameMap(schemas, erasableSyntaxOnly);
		const { schemasMap, enumsMap } = new ComponentSchemaResolver(schemas, config).main();
		assert.equal(schemasMap.size + enumsMap.size, Object.keys(schemas).length);
		assert.equal(new Set([...schemasMap.values(), ...enumsMap.values()].map((entry) => entry.fileName)).size, Object.keys(schemas).length);
		const enumName = `Services_Card_Types_WidgetType${erasableSyntaxOnly ? 'Type' : ''}`;
		assert.ok(schemasMap.get('Media_Widget').content.includes(`import type { ${enumName} }`));
		assert.match(schemasMap.get('Media_Widget').content, /self\?: Media_Widget;/);
		assert.doesNotMatch(schemasMap.get('Media_Widget').content, /import type \{ Media_Widget \}/);
		const resolver = new SchemaResolver(config, schemas, {}, (error) => assert.fail(error.message));
		assert.ok(resolver.main({ $ref: '#/components/schemas/services__card__types__WidgetType' }).endsWith(`.${enumName}`));
		assert.ok(resolver.main({ $ref: '#/components/schemas/Status' }).endsWith(`.${names.get('Status')}${erasableSyntaxOnly ? 'Type' : ''}`));
		const inline = new EnumParser(config).handleEnum({ type: 'string', enum: ['active'] }, 'some__status');
		assert.equal(inline.typeName, `Some_Status${erasableSyntaxOnly ? 'Type' : ''}`);
		for (const [raw, expected] of [
			['ApiResult_Dict_', 'string'],
			['ApiResult_dict_', 'number'],
			['$Result', 'boolean'],
		]) {
			const name = names.get(raw);
			const reference = resolver.main({ $ref: `#/components/schemas/${raw}` }, 'response');
			assert.ok(reference.endsWith(`.${name}`));
			assert.ok(reference.includes(`/${typeNameToFileName(name)}'`));
			assert.equal(resolver.transformResponseModel(reference, { type: 'unwrap', modelPattern: raw.startsWith('ApiResult') ? '^ApiResult_' : '^\\$Result$' }), expected);
		}
		for (const raw of ['ApiResult_Dict_', 'ApiResult_dict_']) assert.ok(schemasMap.get('Wrapper').content.includes(`import type { ${names.get(raw)} }`));
	}
});

test('generated collision-safe names compile in both enum modes', async (context) => {
	const root = await fixture(context);
	const input = path.join(root, 'names.json');
	const reference = (name) => ({ $ref: `#/components/schemas/${name}` });
	const schemas = {
		services__card__types__WidgetType: { type: 'string', enum: ['media'] },
		services_card_types_WidgetType: { type: 'string', enum: ['audio'] },
		ApiResult_Dict_: { type: 'object', properties: { data: { type: 'string' } } },
		ApiResult_dict_: { type: 'object', properties: { data: { type: 'number' } } },
		Status: { type: 'string', enum: ['active'] },
		StatusType: { type: 'object' },
		Index: { type: 'object', properties: { self: reference('Index') } },
		$Result: { type: 'object', properties: { data: { type: 'boolean' } } },
	};
	const model = { type: 'object', properties: Object.fromEntries(Object.keys(schemas).map((name) => [name, reference(name)])) };
	await fs.writeFile(
		input,
		JSON.stringify({
			openapi: '3.1.0',
			info: { title: 'names', version: '1' },
			components: { schemas: { ...schemas, 'media-widget': model } },
			paths: { '/widget': { get: { responses: { 200: { description: 'ok', content: { 'application/json': { schema: reference('media-widget') } } } } } } },
		}),
	);
	for (const erasableSyntaxOnly of [false, true]) {
		const target = path.join(root, String(erasableSyntaxOnly));
		const config = { ...outputConfig(target), swaggerJsonUrl: input, importEnumPath: '../../enums' };
		config.enmuConfig.erasableSyntaxOnly = erasableSyntaxOnly;
		await new Main().handle(config, false);
		const files = [...ts.sys.readDirectory(path.join(target, 'types'), ['.ts']), ...ts.sys.readDirectory(path.join(target, 'enums'), ['.ts'])];
		const options = { strict: true, noEmit: true, skipLibCheck: false, types: [], target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS };
		const host = ts.createCompilerHost(options);
		const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram(files, options, host));
		assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, host));
		const source = await fs.readFile(path.join(target, 'types/models/media-widget.ts'), 'utf8');
		assert.match(source, /services__card__types__WidgetType\?:/);
		assert.match(source, /export interface Media_Widget/);
		const exported = await fs.readFile(path.join(target, 'types/models/index.ts'), 'utf8');
		assert.doesNotMatch(exported, /from '\.\/index'/);
	}
});

test('shared schema render types preserve models, enums and null results', () => {
	const config = createDefaultConfig();
	const resolver = new ComponentSchemaResolver(
		{
			Item: { type: 'object', properties: { objects: { type: 'array', items: { type: 'object' } }, count: { type: 'number', nullable: true } } },
			Status: { type: 'integer', enum: [0, 1] },
		},
		config,
	);
	const { schemasMap, enumsMap } = resolver.main();
	assert.equal(schemasMap.get('Item').fileName, 'item');
	assert.match(schemasMap.get('Item').content, /objects\?: Array<Record<string, unknown>>;/);
	assert.match(schemasMap.get('Item').content, /count\?: number \| null;/);
	assert.equal(enumsMap.get('status').fileName, 'status');
	assert.match(enumsMap.get('status').content, /Status/);
	assert.equal(new EnumParser(config).parseEnum({ type: 'string' }, 'Empty'), null);
});

test('OpenAPI 3.1 normalization preserves null, const, boolean schemas and reference siblings', () => {
	const document = {
		openapi: '3.1.0',
		info: { title: 'fixture', version: '1' },
		paths: {},
		components: {
			schemas: {
				Nullable: { anyOf: [{ type: 'string' }, { type: 'null' }] },
				Multi: { type: ['string', 'null'] },
				Constant: { type: 'string', const: 'divider' },
				Refined: { $ref: '#/components/schemas/Nullable', type: 'string' },
				Any: true,
				Never: false,
				Array: { type: 'array', items: false },
				Example: { type: 'object', example: { type: 'null', const: 'unchanged' } },
			},
		},
	};
	const original = JSON.stringify(document);
	const schemas = normalizeOpenApiDocument(document).components.schemas;
	const render = (schema) => renderSchemaType(schema, { reference: () => 'Nullable' });
	assert.equal(render(schemas.Nullable), 'string | null');
	assert.equal(render(schemas.Multi), 'string | null');
	assert.equal(render(schemas.Constant), 'string & "divider"');
	assert.equal(render(schemas.Refined), 'string & Nullable');
	assert.equal(render(schemas.Any), 'unknown');
	assert.equal(render(schemas.Never), 'never');
	assert.equal(render(schemas.Array), 'Array<never>');
	assert.deepEqual(schemas.Example.example, document.components.schemas.Example.example);
	assert.equal(JSON.stringify(document), original);
	const extra = normalizeOpenApiDocument({
		...document,
		components: {
			schemas: {
				LegacyNullable: { type: 'string', nullable: true },
				NoItems: { type: 'array' },
				Bound: { type: 'number', minimum: 3, exclusiveMinimum: 1 },
				NullConstant: { const: null },
				FalseProperty: { type: 'object', properties: { denied: false } },
			},
		},
	}).components.schemas;
	assert.equal(render(extra.LegacyNullable), 'string');
	assert.equal(render(extra.NoItems), 'Array<unknown>');
	assert.equal(extra.Bound.minimum, 3);
	assert.equal(extra.Bound.exclusiveMinimum, undefined);
	assert.equal(render(extra.NullConstant), 'null');
	assert.match(render(extra.FalseProperty), /denied\?: never;/);
	const legacy = { ...document, openapi: '3.0.3' };
	assert.equal(normalizeOpenApiDocument(legacy), legacy);
});

test('schema diagnostics distinguish single oneOf branches and report nested constraint paths', () => {
	const diagnostics = [];
	const options = { reference: () => 'Item', path: '#/components/schemas/Example', diagnostic: (message, path) => diagnostics.push({ message, path }) };
	assert.equal(renderSchemaType({ oneOf: [{ type: 'string' }] }, options), 'string');
	assert.equal(diagnostics.length, 0);
	assert.equal(renderSchemaType({ oneOf: [] }, options), 'unknown');
	assert.match(diagnostics.pop().message, /at least one/);
	assert.equal(renderSchemaType({ oneOf: [{ type: 'string' }, { type: 'number' }] }, options), 'string | number');
	assert.match(diagnostics.pop().message, /exactly-one/);
	renderSchemaType(
		{
			type: 'object',
			properties: {
				'field/~name': {
					type: 'array',
					items: {
						type: 'object',
						additionalProperties: {
							anyOf: [
								{ type: 'number', minimum: 0, maximum: 1 },
								{ type: 'string', pattern: '^test$' },
							],
						},
					},
				},
			},
		},
		options,
	);
	assert.deepEqual(
		diagnostics.map((item) => item.path),
		[
			'#/components/schemas/Example/properties/field~1~0name/items/additionalProperties/anyOf/0',
			'#/components/schemas/Example/properties/field~1~0name/items/additionalProperties/anyOf/1',
		],
	);
	assert.match(diagnostics[0].message, /minimum, maximum/);
	assert.match(diagnostics[1].message, /pattern/);
});

test('schema diagnostics separate runtime summaries from actionable warnings without dropping details', () => {
	const collector = new SchemaDiagnostics({});
	collector.add('Length requires runtime validation.', '#/second', 'runtime');
	collector.add('Length requires runtime validation.', '#/first', 'runtime');
	collector.add('Length requires runtime validation.', '#/first', 'runtime');
	collector.add('Unsupported schema keyword.', '#/unsupported');
	const output = [];
	collector.flush((message, level) => output.push({ message, level }));
	assert.deepEqual(
		output.map((entry) => entry.level),
		['warn', 'info', 'verbose'],
	);
	assert.match(output[0].message, /Schema warnings: 1 unique finding/);
	assert.match(output[0].message, /#\/unsupported/);
	assert.match(output[1].message, /Schema runtime validation: 2 unique finding\(s\), 1 category/);
	assert.match(output[1].message, /--log-level verbose/);
	assert.doesNotMatch(output[1].message, /#\//);
	assert.match(output[2].message, /#\/first\n  #\/second/);
	collector.flush(() => assert.fail('Flushed diagnostics must not be repeated'));
	new SchemaDiagnostics({}).flush(() => assert.fail('Empty diagnostics must not produce output'));
});

test('schema diagnostics classify FastAPI constraints without changing generated types', () => {
	const cases = [
		{ schema: { type: 'string', maxLength: 200 }, expected: 'string' },
		{ schema: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 200 }, expected: 'Array<string>' },
		{ schema: { type: 'integer', minimum: 0, exclusiveMinimum: true }, expected: 'number' },
		{ schema: { type: 'object', additionalProperties: false, properties: { name: { type: 'string' } } }, expected: '{ name?: string; }' },
	];
	for (const { schema, expected } of cases) {
		const diagnostics = [];
		assert.equal(renderSchemaType(schema, { reference: () => 'unknown', diagnostic: (message, path, kind) => diagnostics.push({ message, path, kind }) }), expected);
		assert.equal(diagnostics.length, 1);
		assert.equal(diagnostics[0].kind, 'runtime');
	}
	for (const schema of [
		{ not: { type: 'string' } },
		{ oneOf: [{ type: 'string' }, { type: 'number' }] },
		{ type: 'object', properties: { name: { type: 'string' } }, additionalProperties: { type: 'number' } },
	]) {
		const kinds = [];
		renderSchemaType(schema, { reference: () => 'unknown', diagnostic: (_message, _path, kind) => kinds.push(kind) });
		assert.deepEqual(kinds, ['warning']);
	}
});

test('service schema diagnostics deduplicate model variants and response unwraps with canonical paths', () => {
	const field = { type: 'number', minimum: 1, readOnly: true };
	const inline = { type: 'string', pattern: '^test$' };
	const document = {
		components: { schemas: { Example: { type: 'object', properties: { field } }, Result: { type: 'object', properties: { data: field } } } },
		paths: { '/items': { get: { parameters: [{ schema: inline }] } } },
	};
	const collector = new SchemaDiagnostics(document);
	const config = createDefaultConfig();
	new ComponentSchemaResolver(document.components.schemas, config, collector).main();
	const parser = new SchemaResolver(config, document.components.schemas, {}, (error) => assert.fail(error.message), collector);
	parser.main(field, 'response');
	parser.main(field, 'request');
	parser.transformResponseModel(parser.main({ $ref: '#/components/schemas/Result' }, 'response'), { type: 'unwrap', dataField: 'data' });
	parser.main(inline, 'request');
	const output = [];
	collector.flush((message, level) => {
		if (level !== 'info') output.push(message);
	});
	assert.equal(output.length, 1);
	assert.match(output[0], /2 unique finding/);
	assert.equal(output[0].split('#/components/schemas/Example/properties/field').length - 1, 1);
	assert.match(output[0], /#\/paths\/~1items\/get\/parameters\/0\/schema/);
	assert.match(output[0], /minimum/);
	assert.match(output[0], /pattern/);
	collector.flush((message) => output.push(message));
	assert.equal(output.length, 1);
	const nextService = new SchemaDiagnostics(document);
	nextService.add('new service', '#');
	nextService.flush((message) => output.push(message));
	assert.equal(output.length, 2);
});

test('generation separates runtime summaries and verbose paths from unsupported schema warnings', async (context) => {
	const root = await fixture(context);
	const input = path.join(root, 'schema-diagnostics.json');
	const document = {
		openapi: '3.1.0',
		info: { title: 'diagnostics', version: '1' },
		components: {
			schemas: {
				Example: {
					type: 'object',
					properties: {
						first: { type: 'integer', minimum: 1 },
						second: { type: 'integer', minimum: 1 },
						choice: { oneOf: [{ type: 'string' }] },
						unsupported: { type: 'object', patternProperties: { '^key': { type: 'string' } } },
					},
				},
			},
		},
		paths: { '/items': { get: { responses: { 200: { description: 'ok', content: { 'application/json': { schema: { $ref: '#/components/schemas/Example' } } } } } } } },
	};
	await fs.writeFile(input, JSON.stringify(document));
	const messages = [];
	const warnings = [];
	const details = [];
	context.mock.method(log, 'print', (message) => messages.push(message));
	context.mock.method(log, 'warn', (message) => warnings.push(message));
	context.mock.method(log, 'verbose', (message) => details.push(message));
	await new Main().handle({ ...outputConfig(root), swaggerJsonUrl: input, responseModelTransform: { type: 'unwrap', dataField: 'first' } }, false);
	assert.equal(messages.length, 1);
	assert.match(messages[0], /2 unique finding\(s\), 1 category/);
	assert.doesNotMatch(messages[0], /#\//);
	assert.equal(warnings.length, 1);
	assert.match(warnings[0], /Schema warnings: 1 unique finding/);
	assert.match(warnings[0], /patternProperties/);
	assert.match(warnings[0], /Example\/properties\/unsupported/);
	assert.doesNotMatch(warnings[0], /minimum/);
	const runtimeDetails = details.filter((message) => message.startsWith('Schema runtime validation:'));
	assert.equal(runtimeDetails.length, 1);
	assert.match(runtimeDetails[0], /Example\/properties\/first/);
	assert.match(runtimeDetails[0], /Example\/properties\/second/);
	assert.doesNotMatch(messages[0], /oneOf|exactly-one/);
	assert.match(await fs.readFile(path.join(root, 'types/models/example.ts'), 'utf8'), /choice\?: string;/);
});

test('generation respects log levels for runtime constraints and schema warnings', async (context) => {
	const root = await fixture(context);
	const input = path.join(root, 'log-levels.json');
	await fs.writeFile(
		input,
		JSON.stringify({
			openapi: '3.1.0',
			info: { title: 'log levels', version: '1' },
			paths: {},
			components: {
				schemas: {
					Example: {
						type: 'object',
						properties: { query: { type: 'string', maxLength: 200 } },
						patternProperties: { '^key': { type: 'string' } },
					},
				},
			},
		}),
	);
	const output = [];
	context.mock.method(console, 'log', (...args) => output.push(args.join(' ')));
	context.after(() => setLogLevel('info'));
	for (const level of ['silent', 'error', 'warn', 'info', 'verbose']) {
		setLogLevel(level);
		output.length = 0;
		await new Main().handle({ ...outputConfig(root), swaggerJsonUrl: input }, false);
		const text = output.join('\n');
		assert.equal(text.includes('Schema warnings:'), ['warn', 'info', 'verbose'].includes(level), level);
		assert.equal(text.includes('Schema runtime validation:'), ['info', 'verbose'].includes(level), level);
		assert.equal(text.includes('#/components/schemas/Example/properties/query'), level === 'verbose', level);
		if (['silent', 'error'].includes(level)) assert.equal(output.length, 0, level);
	}
});

test('generated models indent fields and attached comments with configured tabs or spaces', () => {
	for (const indentation of ['\t', '  ']) {
		const config = { ...createDefaultConfig(), formatting: { indentation, lineEnding: '\r\n' } };
		const schema = {
			type: 'object',
			properties: {
				name: { type: 'string', description: 'Name' },
				nested: { type: 'object', properties: { child: { type: 'number', description: 'Child' } } },
				plain: { type: 'boolean' },
			},
		};
		const content = new ComponentSchemaResolver({ Example: schema }, config).main().schemasMap.get('Example').content;
		assert.ok(content.includes(`\r\n${indentation}/**\r\n${indentation} * @description Name\r\n${indentation} */\r\n${indentation}name?: string;`));
		assert.ok(content.includes(`\r\n${indentation}nested?: {\r\n${indentation.repeat(2)}/**`));
		assert.ok(content.includes(`\r\n${indentation.repeat(2)}child?: number;`));
		assert.ok(content.includes(`\r\n${indentation}plain?: boolean;`));
		assert.ok(content.includes(`\r\n${indentation}[key: string]: unknown;`));
		assert.doesNotMatch(content, /(?<!\r)\n/);
	}
});

test('generated connectors format inline body and response types without Prettier', async (context) => {
	const root = await fixture(context);
	const input = path.join(root, 'inline.json');
	const schema = {
		type: 'object',
		required: ['publishDTO'],
		properties: {
			file: { type: 'string', format: 'binary' },
			publishDTO: { $ref: '#/components/schemas/PublishDTO' },
			nested: { type: 'object', properties: { child: { type: 'boolean' } } },
		},
	};
	await fs.writeFile(
		input,
		JSON.stringify({
			openapi: '3.0.3',
			info: { title: 'inline', version: '1' },
			components: { schemas: { PublishDTO: { type: 'string' } } },
			paths: {
				'/publish': {
					post: {
						parameters: ['path', 'query', 'header'].map((location) => ({ in: location, name: 'filter', required: true, schema })),
						requestBody: { content: { 'multipart/form-data': { schema } } },
						responses: { 200: { description: 'OK', content: { 'application/json': { schema } } } },
					},
				},
			},
		}),
	);
	for (const indentation of ['\t', '  ']) {
		for (const lineEnding of ['\n', '\r\n']) {
			await new Main().handle({ ...outputConfig(root), swaggerJsonUrl: input, formatting: { indentation, lineEnding } }, false);
			const folder = path.join(root, 'types/connectors');
			const [file] = await fs.readdir(folder);
			const content = await fs.readFile(path.join(folder, file), 'utf8');
			for (const name of ['Body', 'Response']) {
				assert.ok(content.includes(`${indentation}type ${name} = {${lineEnding}${indentation.repeat(2)}file?: File;`), content);
			}
			assert.ok(content.includes(`${lineEnding}${indentation.repeat(2)}nested?: {${lineEnding}${indentation.repeat(3)}child?: boolean;`), content);
			assert.ok(content.includes(`${lineEnding}${indentation.repeat(2)}publishDTO: import('../models/publish-dto').PublishDTO;`), content);
			for (const declaration of ['type filter =', 'filter:']) {
				assert.ok(content.includes(`${indentation.repeat(2)}${declaration} {${lineEnding}${indentation.repeat(3)}file?: File;`), content);
			}
			if (lineEnding === '\r\n') assert.doesNotMatch(content, /(?<!\r)\n/);
			assert.equal(ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true).parseDiagnostics.length, 0);
			await new Main().handle(
				{
					...outputConfig(root),
					swaggerJsonUrl: input,
					formatting: { indentation, lineEnding },
					responseModelTransform: { type: 'wrap', wrapperFields: { data: 'unknown' } },
				},
				false,
			);
			const wrapped = await fs.readFile(path.join(folder, file), 'utf8');
			assert.ok(wrapped.includes(`${indentation.repeat(2)}data?: {${lineEnding}${indentation.repeat(3)}file?: File;`), wrapped);
			assert.ok(wrapped.includes(`${lineEnding}${indentation.repeat(4)}child?: boolean;`), wrapped);
			if (lineEnding === '\r\n') assert.doesNotMatch(wrapped, /(?<!\r)\n/);
			assert.equal(ts.createSourceFile(file, wrapped, ts.ScriptTarget.Latest, true).parseDiagnostics.length, 0);
		}
	}
});

test('generated models separate imports from declarations with exactly one blank line', () => {
	for (const lineEnding of ['\n', '\r\n']) {
		const config = { ...createDefaultConfig(), formatting: { indentation: '\t', lineEnding } };
		const schemas = {
			First: { type: 'string' },
			Second: { type: 'number' },
			Example: { type: 'object', properties: { first: { $ref: '#/components/schemas/First' }, second: { $ref: '#/components/schemas/Second' } } },
			Alias: { $ref: '#/components/schemas/First' },
		};
		const models = new ComponentSchemaResolver(schemas, config).main().schemasMap;
		assert.ok(
			models
				.get('Example')
				.content.startsWith(["import type { First } from './first';", "import type { Second } from './second';", '', 'export interface Example {'].join(lineEnding)),
		);
		assert.equal(models.get('Alias').content, `import type { First } from './first';${lineEnding}${lineEnding}export type Alias = First;`);
		assert.equal(models.get('First').content, 'export type First = string;');
	}
});

test('generated property comments attach to every field including nested objects', () => {
	const schema = {
		type: 'object',
		properties: {
			first: { type: 'string', description: 'First field' },
			second: { type: 'number', description: 'Second field', minimum: 1 },
			nested: { type: 'object', description: 'Nested field', properties: { child: { type: 'boolean', description: 'Child field' } } },
		},
	};
	const content = new ComponentSchemaResolver({ Comments: schema }, createDefaultConfig()).main().schemasMap.get('Comments').content;
	const source = ts.createSourceFile('comments.ts', content, ts.ScriptTarget.Latest, true);
	let count = 0;
	const visit = (node) => {
		if (ts.isPropertySignature(node)) {
			assert.equal(ts.getJSDocCommentsAndTags(node).length, 1, node.name.getText(source));
			count++;
		}
		ts.forEachChild(node, visit);
	};
	visit(source);
	assert.equal(count, 4);
	assert.equal(source.parseDiagnostics.length, 0);
});

test('directional models propagate through recursive references and dictionaries', () => {
	const schemas = {
		Account: {
			type: 'object',
			required: ['id', 'password', 'name'],
			properties: {
				id: { type: 'number', readOnly: true },
				password: { type: 'string', writeOnly: true },
				name: { type: 'string' },
				children: { type: 'array', items: { $ref: '#/components/schemas/Account' } },
			},
		},
		Accounts: { type: 'object', additionalProperties: { $ref: '#/components/schemas/Account' } },
	};
	const models = new ComponentSchemaResolver(schemas, createDefaultConfig()).main().schemasMap;
	assert.match(models.get('Account').content, /export namespace Account/);
	assert.match(models.get('Account').content, /export type Request = .*id\?: never;.*password: string;/s);
	assert.match(models.get('Account').content, /export type Response = .*id: number;.*password\?: never;/s);
	assert.match(models.get('Account').content, /children\?: Array<Account.Request>/);
	assert.match(models.get('Account').content, /children\?: Array<Account.Response>/);
	assert.match(models.get('Accounts').content, /export type Response = Record<string, Account.Response>/);
});

test('operation direction selection survives cache reuse and response unwrapping', () => {
	const schemas = {
		Account: { type: 'object', properties: { id: { type: 'number', readOnly: true }, password: { type: 'string', writeOnly: true } } },
		Result: { type: 'object', properties: { data: { $ref: '#/components/schemas/Account' } } },
	};
	const config = createDefaultConfig();
	const operations = new SchemaResolver(config, schemas, {}, (error) => assert.fail(error.message));
	const reference = { $ref: '#/components/schemas/Account' };
	assert.match(operations.main(reference, 'request'), /\.Account.Request$/);
	assert.match(operations.main(reference, 'response'), /\.Account.Response$/);
	assert.match(operations.main(reference), /\.Account$/);
	const response = operations.responseObjectParse({ content: { 'application/json': { schema: { $ref: '#/components/schemas/Result' } } } });
	assert.match(response, /\.Result.Response$/);
	assert.match(operations.transformResponseModel(response, { type: 'unwrap', dataField: 'data', modelPattern: '^Result$' }), /\.Account.Response$/);
	const parser = new PathParse({}, {}, schemas, config);
	assert.match(parser.requestBodyObjectParse({ content: { 'application/json': { schema: reference } } }), /\.Account.Request;/);
	assert.match(operations.main(schemas.Account, 'response'), /password\?: never/);
});

test('directional schemas resolve property annotations through aliases and composition', () => {
	const schemas = {
		Secret: { type: 'string', writeOnly: true },
		SecretAlias: { $ref: '#/components/schemas/Secret' },
		Record: { type: 'object', required: ['secret'], additionalProperties: false, properties: { secret: { $ref: '#/components/schemas/SecretAlias' } } },
		Union: { anyOf: [{ $ref: '#/components/schemas/Record' }, { type: 'number' }] },
		Alias: { $ref: '#/components/schemas/Union' },
	};
	const config = createDefaultConfig();
	const models = new ComponentSchemaResolver(schemas, config).main().schemasMap;
	const operations = new SchemaResolver(config, schemas, {}, (error) => assert.fail(error.message));
	assert.match(models.get('Record').content, /\texport type Response = \{\n\t\tsecret\?: never;\n\t\};/);
	assert.match(models.get('Union').content, /export type Response = Record.Response \| number;/);
	assert.match(models.get('Alias').content, /export type Response = Union.Response;/);
	assert.match(operations.main({ $ref: '#/components/schemas/Alias' }, 'response'), /\.Alias.Response$/);
	assert.match(operations.main({ $ref: '#/components/schemas/Alias' }, 'request'), /\.Alias$/);
});

test('component dictionaries preserve value types, references and nullability', () => {
	const dictionary = (additionalProperties, extra = {}) => ({ type: 'object', additionalProperties, ...extra });
	const resolver = new ComponentSchemaResolver(
		{
			SurveyListItemVO: {
				type: 'object',
				required: ['tagColors'],
				properties: {
					tagColors: dictionary({ type: 'string', pattern: '^#[0-9A-F]{6}$' }),
					dimensionScores: dictionary({ type: 'number' }, { nullable: true }),
					flags: dictionary({ type: 'boolean' }),
					counts: dictionary({ type: 'integer' }),
					labels: dictionary({ type: 'string', nullable: true }),
					lists: dictionary({ type: 'array', items: { type: 'string' } }),
					items: dictionary({ $ref: '#/components/schemas/Item' }),
					states: dictionary({ $ref: '#/components/schemas/Status' }),
					nested: dictionary(dictionary({ type: 'string' })),
					config: dictionary(true),
					unknownValues: dictionary({}),
					closed: dictionary(false),
					inline: { type: 'object', properties: { colors: dictionary({ type: 'string' }) } },
				},
			},
			Item: { type: 'object', properties: { id: { type: 'string' } } },
			Status: { type: 'integer', enum: [0, 1] },
		},
		createDefaultConfig(),
	);
	const content = resolver.main().schemasMap.get('SurveyListItemVO').content;
	for (const declaration of [
		'tagColors: Record<string, string>;',
		'dimensionScores?: Record<string, number> | null;',
		'flags?: Record<string, boolean>;',
		'counts?: Record<string, number>;',
		'labels?: Record<string, string | null>;',
		'lists?: Record<string, Array<string>>;',
		'items?: Record<string, Item>;',
		'states?: Record<string, Status>;',
		'nested?: Record<string, Record<string, string>>;',
		'config?: Record<string, unknown>;',
		'unknownValues?: Record<string, unknown>;',
		'closed?: Record<string, never>;',
		'inline?: { colors?: Record<string, string>; [key: string]: unknown; };',
	]) {
		assert.ok(content.replace(/\s+/g, ' ').includes(declaration), `Missing declaration: ${declaration}\n${content}`);
	}
	assert.match(content, /import type \{ Item \} from '\.\/item';/);
	assert.match(content, /import type \{ Status \} from '[^']+';/);
	assert.doesNotMatch(content, /Array<undefined>/);
});

test('OpenAPI 3.0 schema types preserve dictionary boundaries and composition', () => {
	const diagnostics = [];
	const render = (schema) => renderSchemaType(schema, { reference: () => 'Item', diagnostic: (message) => diagnostics.push(message) });
	assert.equal(render({ type: 'object' }), 'Record<string, unknown>');
	assert.equal(render({ type: 'object', additionalProperties: false }), 'Record<string, never>');
	assert.equal(render({ type: 'object', additionalProperties: { type: 'boolean' } }), 'Record<string, boolean>');
	assert.equal(render({ type: 'array', nullable: true, items: { type: 'string', nullable: true } }), '(Array<string | null>) | null');
	assert.equal(render({ type: 'string', nullable: true, enum: ['active'] }), '"active"');
	assert.equal(render({ type: 'string', nullable: true, enum: ['active', null] }), '"active" | null');
	assert.equal(render({ type: 'string', enum: [null, 1] }), 'never');
	assert.equal(render({ type: 'boolean', enum: [false] }), 'false');
	assert.equal(render({ type: 'string', format: 'date-time' }), 'string');
	assert.equal(render({ $ref: '#/components/schemas/Item', nullable: true }), 'Item');
	assert.equal(render({ type: 'object', required: ['id'], additionalProperties: false }), 'never');
	assert.equal(render({ type: 'object', required: ['id'], additionalProperties: { type: 'number' } }), '{ id: number; [key: string]: number; }');
	assert.equal(
		render({ type: 'object', properties: { id: { type: 'number' } }, required: ['id'], additionalProperties: { type: 'string' } }),
		'{ id: number; [key: string]: string | number; }',
	);
	assert.equal(render({ type: 'object', additionalProperties: { anyOf: [{ type: 'string' }, { type: 'boolean' }] } }), 'Record<string, string | boolean>');
	assert.equal(render({ allOf: [{ anyOf: [{ type: 'string' }, { type: 'number' }] }, { type: 'string' }] }), '(string | number) & string');
	assert.equal(render({ type: 'string', nullable: true, allOf: [{ type: 'string' }] }), '(string | null) & string');
	assert.equal(render({ type: 'array' }), 'Array<unknown>');
	assert.equal(render(true), 'unknown');
	assert.ok(diagnostics.some((message) => message.includes('widened index')));
	assert.ok(diagnostics.some((message) => message.includes('Invalid OpenAPI')));
});

test('allOf merging preserves conflicts, dictionary boundaries and recursive references', () => {
	const schemas = {
		Base: { type: 'object', properties: { value: { type: 'number' } } },
		Alias: { $ref: '#/components/schemas/Base' },
		Nested: { allOf: [{ $ref: '#/components/schemas/Alias' }, { required: ['value'] }] },
		Recursive: { allOf: [{ $ref: '#/components/schemas/Recursive' }, { type: 'object', properties: { value: { type: 'string' } } }] },
	};
	const render = (schema, overrides = {}) => renderSchemaType(schema, { schemas, reference: (reference) => reference.split('/').pop(), ...overrides });
	assert.equal(render({ allOf: [{ $ref: '#/components/schemas/Nested' }, { type: 'object', required: ['extra'] }] }), '{ extra: unknown; value: number; [key: string]: unknown; }');
	assert.equal(
		render({ allOf: [{ $ref: '#/components/schemas/Base' }, { type: 'object', required: ['value'], properties: { value: { type: 'string' } } }] }),
		'{ value: number & string; [key: string]: unknown; }',
	);
	assert.equal(render(schemas.Recursive), 'Recursive & { value?: string; [key: string]: unknown; }');
	const array = (items) => ({ type: 'array', items });
	assert.equal(render({ allOf: [array({ type: 'object' }), array({ $ref: '#/components/schemas/Base' })] }), 'Array<Base>');
	assert.equal(render({ allOf: [array(array({ type: 'number' })), array(array({ type: 'string' }))] }), 'Array<Array<number & string>>');
	assert.equal(
		render({
			allOf: [
				array({ type: 'object', required: ['id'], properties: { id: { type: 'number' } } }),
				array({ type: 'object', required: ['title'], properties: { title: { type: 'string' } } }),
			],
		}),
		'Array<{ id: number; title: string; [key: string]: unknown; }>',
	);
	for (const constraint of [
		{ additionalProperties: false },
		{ additionalProperties: { type: 'string' } },
		{ nullable: true },
		{ enum: [{ value: 1 }] },
		{ minProperties: 1 },
		{ anyOf: [{ required: ['value'] }, { required: ['extra'] }] },
	]) {
		const branch = { type: 'object', ...constraint };
		assert.ok(render({ allOf: [{ $ref: '#/components/schemas/Base' }, branch] }).startsWith('Base & '), JSON.stringify(constraint));
	}
	assert.equal(render({ allOf: [{ type: 'object' }, { type: 'object' }] }, { mapping: (schema) => (schema.type === 'object' ? 'CustomObject' : undefined) }), 'CustomObject');
	assert.equal(render({ allOf: [true, { type: 'string' }] }), 'string');
	const directional = {
		allOf: [
			{ type: 'object', properties: { id: { type: 'number', readOnly: true }, secret: { type: 'string', writeOnly: true } } },
			{ type: 'object', required: ['id', 'secret'], properties: { id: { type: 'number' }, secret: { type: 'string' } } },
		],
	};
	assert.equal(render(directional, { direction: 'request' }), '{ id?: never; secret: string; [key: string]: unknown; }');
	assert.equal(render(directional, { direction: 'response' }), '{ id: number; secret?: never; [key: string]: unknown; }');
});

test('component and operation schemas share OpenAPI 3.0 rendering', () => {
	const schemas = {
		Colors: { type: 'object', additionalProperties: { type: 'string' } },
		Entries: { type: 'array', items: { type: 'boolean', nullable: true } },
		Choice: { anyOf: [{ type: 'string' }, { type: 'boolean' }] },
		Closed: { type: 'object', additionalProperties: false },
		Mixed: { type: 'object', required: ['id'], properties: { id: { type: 'number' } }, additionalProperties: { type: 'string' } },
		EnumNull: { type: 'string', nullable: true, enum: ['active', null] },
	};
	const config = createDefaultConfig();
	const models = new ComponentSchemaResolver(schemas, config).main().schemasMap;
	const operations = new SchemaResolver(config, schemas, {}, (error) => assert.fail(error.message));
	assert.match(models.get('Colors').content, /export type Colors = Record<string, string>;/);
	assert.match(models.get('Entries').content, /export type Entries = Array<boolean \| null>;/);
	assert.match(models.get('Choice').content, /export type Choice = string \| boolean;/);
	assert.match(models.get('Closed').content, /export type Closed = Record<string, never>;/);
	assert.match(models.get('Mixed').content, /id: number;\s+\[key: string\]: string \| number;/);
	for (const [name, schema] of Object.entries(schemas)) {
		assert.ok(models.get(name).content.replace(/\s+/g, ' ').includes(operations.main(schema).replace(/\s+/g, ' ')), name);
	}
	assert.equal(operations.nonArraySchemaObjectParse({ type: 'string', format: 'date-time' }), 'string');
	assert.equal(operations.arraySchemaObjectParse({ type: 'array', items: { type: 'string', nullable: true } }), 'Array<string | null>');
});

test('request body schema unions preserve references, arrays and media selection', () => {
	const parser = new PathParse({}, undefined, { Item: { type: 'object' } }, createDefaultConfig());
	const reference = { $ref: '#/components/schemas/Item' };
	const requestBody = { content: { 'application/json': { schema: reference } } };
	assert.equal(parser.pickRequestBodyContent(requestBody).schema, reference);
	assert.match(parser.requestBodyObjectParse(requestBody), /type Body = import\('[^']+'\)\.Item/);
	assert.match(parser.requestBodyObjectParse({ content: { 'application/json': { schema: { type: 'array', items: reference } } } }), /type Body = Array<import\('[^']+'\)\.Item>/);
	assert.match(
		parser.requestBodyObjectParse({ content: { 'application/json': { schema: { anyOf: [{ type: 'string' }, { type: 'boolean' }] } } } }),
		/type Body = string \| boolean;/,
	);
	assert.match(
		parser.requestBodyObjectParse({ content: { 'application/json': { schema: { type: 'object', additionalProperties: { type: 'number' } } } } }),
		/type Body = Record<string, number>;/,
	);
	for (const mediaType of SUPPORTED_REQUEST_TYPES_ALL) {
		assert.equal(parser.pickRequestBodyContent({ content: { [mediaType]: { schema: reference } } }).mediaType, mediaType);
	}
	assert.equal(parser.pickRequestBodyContent({ content: { 'application/json': {}, 'multipart/form-data': {} } }).mediaType, 'multipart/form-data');
	assert.equal(parser.pickRequestBodyContent({ content: { 'application/custom': {} } }).mediaType, 'application/json');
});

test('schema references preserve recursive models and reject missing targets and alias cycles', () => {
	const schemas = {
		Node: { type: 'object', properties: { children: { type: 'array', items: { $ref: '#/components/schemas/Node' } } } },
		Alias: { $ref: '#/components/schemas/Node' },
		CycleA: { $ref: '#/components/schemas/CycleB' },
		CycleB: { $ref: '#/components/schemas/CycleA' },
		Missing: { $ref: '#/components/schemas/Absent' },
		External: { $ref: 'external.json#/Item' },
	};
	const config = createDefaultConfig();
	const models = new ComponentSchemaResolver(schemas, config).main().schemasMap;
	assert.match(models.get('Node').content, /children\?: Array<Node>;/);
	assert.doesNotMatch(models.get('Node').content, /import type \{ Node \}/);
	assert.match(models.get('Alias').content, /import type \{ Node \} from '\.\/node';/);
	for (const name of ['CycleA', 'CycleB', 'Missing', 'External']) {
		assert.equal(models.get(name).content, `export type ${name} = unknown;`);
	}
	const errors = [];
	const operations = new SchemaResolver(config, schemas, {}, (error) => errors.push(error));
	assert.match(operations.main({ $ref: '#/components/schemas/Alias' }), /\.Alias$/);
	assert.equal(operations.main(schemas.Missing), 'unknown');
	assert.equal(operations.main(schemas.CycleA), 'unknown');
	assert.equal(errors.length, 2);
});

test('generated OpenAPI models compile and preserve positive and negative type contracts', async (context) => {
	const root = await fixture(context);
	const schemas = {
		PageItem: {
			type: 'object',
			required: ['title', 'id', 'secret'],
			properties: { title: { type: 'string' }, id: { type: 'number', readOnly: true }, secret: { type: 'string', writeOnly: true } },
		},
		PageBase: {
			type: 'object',
			required: ['list', 'totalPages'],
			properties: {
				list: { type: 'array', items: { type: 'object' } },
				page: { type: 'number' },
				pageSize: { type: 'number' },
				total: { type: 'number' },
				totalPages: { type: 'number' },
			},
		},
		PageAlias: { $ref: '#/components/schemas/PageBase' },
		Page: {
			allOf: [
				{ $ref: '#/components/schemas/PageAlias' },
				{
					type: 'object',
					required: ['list', 'page', 'pageSize', 'total'],
					properties: { list: { type: 'array', items: { $ref: '#/components/schemas/PageItem' } } },
				},
			],
		},
		ConflictingList: {
			allOf: [
				{ type: 'array', items: { type: 'number' } },
				{ type: 'array', items: { type: 'string' } },
			],
		},
		Colors: { type: 'object', additionalProperties: { type: 'string' } },
		Closed: { type: 'object', additionalProperties: false },
		Entries: { type: 'array', items: { type: 'string', nullable: true } },
		Nested: { type: 'object', additionalProperties: { $ref: '#/components/schemas/Nested' } },
		Mixed: { type: 'object', properties: { id: { type: 'number' }, label: { type: 'string' } }, required: ['id'], additionalProperties: { type: 'string' } },
		Choice: { anyOf: [{ type: 'string' }, { type: 'boolean' }] },
		EnumNull: { type: 'string', nullable: true, enum: ['active', null] },
		Escaped: { type: 'string', enum: ["it's", 'line\nbreak', 'back\\slash'] },
		Signed: { type: 'number', enum: [-1, 0.5] },
		Account: {
			type: 'object',
			required: ['id', 'password', 'name'],
			properties: {
				id: { type: 'number', readOnly: true },
				password: { type: 'string', writeOnly: true },
				name: { type: 'string' },
				children: { type: 'array', items: { $ref: '#/components/schemas/Account' } },
			},
		},
		JSONObject: { type: 'object', properties: { empty: { type: 'boolean' } }, additionalProperties: { type: 'object' } },
	};
	const { schemasMap, enumsMap } = new ComponentSchemaResolver(schemas, createDefaultConfig()).main();
	const files = [];
	for (const entry of [...schemasMap.values(), ...enumsMap.values()]) {
		const file = path.join(root, `${entry.fileName}.ts`);
		await fs.writeFile(file, entry.content);
		files.push(file);
	}
	const contract = path.join(root, 'contract.ts');
	await fs.writeFile(
		contract,
		`
import type { Colors } from './colors';
import type { Closed } from './closed';
import type { Entries } from './entries';
import type { Mixed } from './mixed';
import type { Nested } from './nested';
import type { Choice } from './choice';
import type { EnumNull } from './enum-null';
import type { Account } from './account';
import type { JSONObject } from './jsonobject';
import type { Page } from './page';
import type { ConflictingList } from './conflicting-list';
declare const page: Page;
declare const pageResponse: Page.Response;
declare const pageRequest: Page.Request;
const responseTitles: string[] = pageResponse.list.map(entry => entry.title);
const requestTitles: string[] = pageRequest.list.map(entry => entry.title);
const titles = page.list.map(entry => entry.title);
const title: string = page.list[0].title;
const pagination: number[] = [page.page, page.pageSize, page.total, page.totalPages];
const colors: Colors = { tag: '#1677FF' };
const closed: Closed = {};
const entries: Entries = ['text', null];
const mixed: Mixed = { id: 1, other: 'text' };
const nested: Nested = { child: { grandchild: {} } };
const empty: Colors = {};
const accountRequest: Account.Request = { password: 'secret', name: 'name', children: [{ password: 'child', name: 'name' }] };
const accountResponse: Account.Response = { id: 1, name: 'name', children: [{ id: 2, name: 'name' }] };
const exact: JSONObject.Exact<{ empty: boolean; custom: { value: number } }> = { empty: true, custom: { value: 1 } };
type Assert<Value extends true> = Value;
type Reject<Value, Target> = Value extends Target ? false : true;
type Checks = [
	Assert<typeof titles extends string[] ? true : false>,
	Assert<Reject<number[], ConflictingList>>,
	Assert<Reject<string[], ConflictingList>>,
	Assert<Reject<{ title: string; secret: string; id: number }, Page.Request['list'][number]>>,
	Assert<Reject<{ title: string; id: number; secret: string }, Page.Response['list'][number]>>,
	Assert<Reject<{ list: []; pageSize: number; total: number; totalPages: number }, Page>>,
	Assert<Reject<{ list: []; page: string; pageSize: number; total: number; totalPages: number }, Page>>,
  Assert<Reject<{ tag: number }, Colors>>,
  Assert<Reject<{ unexpected: string }, Closed>>,
  Assert<Reject<{ other: string }, Mixed>>,
  Assert<Reject<number[], Entries>>,
  Assert<Reject<number, Choice>>,
  Assert<Reject<'other', EnumNull>>,
	Assert<null extends EnumNull ? true : false>,
	Assert<Reject<{ password: string; id: number; name: string }, Account.Request>>,
	Assert<Reject<{ id: number; name: string; password: string }, Account.Response>>,
	Assert<Reject<{ id: number; other: number }, Mixed.Exact<{ id: number; other: number }>>>,
	Assert<Reject<{ empty: boolean; arbitrary: boolean }, JSONObject.Exact<{ empty: boolean; arbitrary: boolean }>>>
];
`,
	);
	const options = { strict: true, noEmit: true, skipLibCheck: true, types: [], target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS };
	const host = ts.createCompilerHost(options);
	const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([...files, contract], options, host));
	assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, host));
});

test('generation rejects unsupported OpenAPI versions before writing models', async (context) => {
	const root = await fixture(context);
	const input = path.join(root, 'openapi.json');
	await fs.writeFile(input, JSON.stringify({ openapi: '4.0.0', info: { title: 'fixture', version: '1' }, paths: {} }));
	await assert.rejects(new Main().handle({ ...outputConfig(root), swaggerJsonUrl: input }, false), /Unsupported OpenAPI version: 4\.0\.0/);
	await assert.rejects(fs.access(path.join(root, 'types')), { code: 'ENOENT' });
});

test('response media fallback supports HTML, vendor types and empty schemas', () => {
	const resolver = new SchemaResolver(createDefaultConfig(), {}, {}, (error) => assert.fail(error.message));
	assert.equal(resolver.responseObjectParse({ content: { 'text/html': { schema: { type: 'string' } } } }), 'string');
	assert.equal(resolver.responseObjectParse({ content: { 'application/vnd.example+json': { schema: { type: 'boolean' } } } }), 'boolean');
	assert.equal(resolver.responseObjectParse({ content: { 'text/html': {} } }), 'unknown');
	assert.equal(resolver.responseObjectParse({ content: {} }), 'unknown');
	assert.equal(resolver.responseObjectParse({ description: 'empty' }), 'unknown');
});

test('OpenAPI 3.1 documents generate nullable models and unwrapped responses end to end', async (context) => {
	const root = await fixture(context);
	const input = path.join(root, 'openapi.json');
	const document = {
		openapi: '3.1.0',
		info: { title: 'fixture', version: '1' },
		components: {
			schemas: {
				Item: { type: 'object', required: ['value', 'kind'], properties: { value: { anyOf: [{ type: 'string' }, { type: 'null' }] }, kind: { type: 'string', const: 'item' } } },
				Result: { type: 'object', properties: { data: { anyOf: [{ $ref: '#/components/schemas/Item' }, { type: 'null' }] } } },
			},
		},
		paths: {
			'/items': {
				post: {
					requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Item' } } } },
					responses: { 200: { description: 'ok', content: { 'application/json': { schema: { $ref: '#/components/schemas/Result' } } } } },
				},
			},
		},
	};
	await fs.writeFile(input, JSON.stringify(document));
	await new Main().handle({ ...outputConfig(root), swaggerJsonUrl: input, responseModelTransform: { type: 'unwrap', dataField: 'data' } }, false);
	const model = await fs.readFile(path.join(root, 'types/models/item.ts'), 'utf8');
	assert.match(model, /value: string \| null;/);
	assert.match(model, /kind: string & "item";/);
	const files = await fs.readdir(path.join(root, 'types/connectors'));
	const connector = await fs.readFile(
		path.join(
			root,
			'types/connectors',
			files.find((file) => file.endsWith('.d.ts')),
		),
		'utf8',
	);
	assert.match(connector, /type Response = import\('[^']+'\)\.Item \| null/);
});

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
