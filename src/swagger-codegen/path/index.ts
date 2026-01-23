import { OpenAPIV3 } from 'openapi-types';
import { log } from '../../utils';
import {
	ArraySchemaObject,
	ContentBody,
	IContentType,
	IIncludeInterface,
	MapType,
	NonArraySchemaObject,
	OperationObject,
	ParameterObject,
	ParseError,
	PathItemObject,
	PathParseConfig,
	ReferenceObject,
	RequestBodyObject,
	ResponseObject,
	SchemaObject,
} from '../types';
import { SchemaResolver } from './schema-resolver';
import { convertEndpointString } from './naming';
import { PathWriter } from './writer';
import { formatPropertyName } from '../shared/naming';
import { applyFormattingDefaults, getIndentation } from '../shared/format';
import { SUPPORTED_REQUEST_TYPES_ALL, SUPPORTED_REQUEST_UPLOAD_TYPES } from '../shared/http';

enum HttpMethods {
	GET = 'get',
	PUT = 'put',
	POST = 'post',
	DELETE = 'delete',
	OPTIONS = 'options',
	HEAD = 'head',
	PATCH = 'patch',
	TRACE = 'trace',
}

const defaultConfig: Partial<PathParseConfig> = {
	typeMapping: new Map([
		['integer', 'number'],
		['string', 'string'],
		['boolean', 'boolean'],
		['binary', 'File'],
		['number', 'number'],
		['null', 'null'],
		['undefined', 'undefined'],
		['date', 'Date'],
		['time', 'Date'],
		['datetime', 'Date'],
		['timestamp', 'Date'],
	]),
	errorHandling: {
		throwOnError: false,
		logErrors: true,
	},
};

export class PathParse {
	pathsObject: OpenAPIV3.PathsObject = {};
	nonArrayType = ['boolean', 'object', 'number', 'string', 'integer'];
	pathKey = '';
	contentBody: ContentBody = {
		payload: {
			path: [],
			query: [],
			header: [],
			body: [],
		},
		response: '',
		_response: '',
		fileName: '',
		method: '',
		requestPath: '',
		summary: '',
		apiName: '',
		typeName: '',
		deprecated: false,
		contentType: 'application/json',
	};
	Map: MapType = new Map();
	private config: PathParseConfig;
	private errors: ParseError[] = [];
	private parameters: OpenAPIV3.ComponentsObject['parameters'] = {};
	private schemas: OpenAPIV3.ComponentsObject['schemas'] = {};
	private schemaResolver: SchemaResolver;
	private writer: PathWriter;
	private apiListFileContent: string[] = [];

	constructor(
		pathsObject: OpenAPIV3.PathsObject,
		parameters: OpenAPIV3.ComponentsObject['parameters'],
		schemas: OpenAPIV3.ComponentsObject['schemas'],
		config: PathParseConfig,
	) {
		this.pathsObject = pathsObject;
		this.parameters = parameters ?? {};
		this.schemas = schemas ?? {};

		const normalized = applyFormattingDefaults({
			...defaultConfig,
			...config,
			typeMapping: new Map([...(defaultConfig.typeMapping || []), ...(config.typeMapping || [])]),
		} as PathParseConfig);

		this.config = normalized;
		this.schemaResolver = new SchemaResolver(this.config, this.schemas, this.parameters, this.handleError.bind(this));
		this.writer = new PathWriter(this.config);
	}

	private handleError(error: ParseError) {
		this.errors.push(error);
		if (this.config.errorHandling?.logErrors) {
			log.error(`${error.type}: ${error.message}${error.path ? ` at ${error.path}` : ''}`);
		}
		if (this.config.errorHandling?.throwOnError) {
			throw new Error(`${error.type}: ${error.message}`);
		}
	}

	private getIndentation(): string {
		return getIndentation(this.config);
	}

	private getDoubleIndentation(): string {
		const indent = this.getIndentation();
		return indent + indent;
	}

	private generateParamComment(param: ParameterObject, indent: string): string[] {
		const comments: string[] = [];
		const commentLines: string[] = [];

		if (param.description) {
			commentLines.push(param.description);
		}

		if (param.deprecated) {
			commentLines.push('@deprecated');
		}

		if (param.schema && typeof param.schema === 'object' && 'example' in param.schema) {
			const example = param.schema.example;
			const exampleStr = typeof example === 'string' ? example : JSON.stringify(example);
			commentLines.push(`@example ${exampleStr}`);
		}

		if (param.schema && typeof param.schema === 'object' && 'default' in param.schema) {
			const defaultValue = param.schema.default;
			const defaultStr = typeof defaultValue === 'string' ? defaultValue : JSON.stringify(defaultValue);
			commentLines.push(`@default ${defaultStr}`);
		}

		if (commentLines.length > 0) {
			if (commentLines.length === 1 && !commentLines[0].includes('\n')) {
				comments.push(`${indent}/** ${commentLines[0]} */`);
			} else {
				comments.push(`${indent}/**`);
				commentLines.forEach((line) => {
					if (line.includes('\n')) {
						line.split('\n').forEach((subLine) => {
							comments.push(`${indent} * ${subLine}`);
						});
					} else {
						comments.push(`${indent} * ${line}`);
					}
				});
				comments.push(`${indent} */`);
			}
		}

		return comments;
	}

	private parametersItemHandle(item: ReferenceObject | ParameterObject, path: string[], query: string[], header: string[]) {
		const doubleIndent = this.getDoubleIndentation();
		const V1 = '$ref' in item ? (item as ReferenceObject) : null;
		const V2 = 'name' in item ? (item as ParameterObject) : null;

		if (V1 && V1.$ref && V1.$ref.startsWith('#/components/parameters/') && this.parameters) {
			const typeName = V1.$ref.replace('#/components/parameters/', '');
			const value = this.parameters[typeName];
			this.parametersItemHandle(value, path, query, header);
		}

		if (V2) {
			if (!V2.schema) {
				console.warn(`Parameter "${V2.name}" has no schema defined, skipping...`);
				return;
			}

			const v2value = this.schemaResolver.main(V2.schema);

			if (!v2value || typeof v2value !== 'string') {
				console.warn(`Failed to parse schema for parameter "${V2.name}", got:`, v2value);
				return;
			}

			if (V2.in === 'path') {
				const comments = this.generateParamComment(V2, doubleIndent);
				comments.forEach((comment) => path.push(comment));

				path.push(`${doubleIndent}type ${V2.name} = ${v2value};`);
				if (this.contentBody.payload._path) {
					this.contentBody.payload._path[V2.name] = v2value;
				} else {
					this.contentBody.payload._path = { [V2.name]: v2value };
				}
			} else if (V2.in === 'query') {
				const comments = this.generateParamComment(V2, doubleIndent);
				comments.forEach((comment) => query.push(comment));

				const optional = V2.required !== true ? '?' : '';
				const propertyName = formatPropertyName(V2.name);
				query.push(`${doubleIndent}${propertyName}${optional}: ${v2value};`);

				if (this.contentBody.payload._query) {
					this.contentBody.payload._query[V2.name] = v2value;
				} else {
					this.contentBody.payload._query = { [V2.name]: v2value };
				}
			} else if (V2.in === 'header') {
				const comments = this.generateParamComment(V2, doubleIndent);
				comments.forEach((comment) => header.push(comment));

				const optional = V2.required !== true ? '?' : '';
				const propertyName = formatPropertyName(V2.name);
				header.push(`${doubleIndent}${propertyName}${optional}: ${v2value};`);

				if (this.contentBody.payload._header) {
					this.contentBody.payload._header[V2.name] = v2value;
				} else {
					this.contentBody.payload._header = { [V2.name]: v2value };
				}
			} else if (V2.in === 'cookie') {
				console.info(`Cookie parameter "${V2.name}" detected but not added to type definition (cookies are typically handled separately)`);
			} else {
				console.warn(`Unknown parameter location "${V2.in}" for parameter "${V2.name}"`);
			}
		}
	}

	private requestParametersParse(parameters: OperationObject['parameters']) {
		const indent = this.getIndentation();
		const path: Array<string> = [];
		const query: Array<string> = [];
		const header: Array<string> = [];

		parameters?.map((item) => this.parametersItemHandle(item, path, query, header));

		if (path.length !== 0) {
			path.unshift(`${indent}namespace Path {`);
			path.push(`${indent}}`);
		}

		if (query.length !== 0) {
			query.unshift(`${indent}interface Query {`);
			query.push(`${indent}}`);
		}

		if (header.length !== 0) {
			header.unshift(`${indent}interface Header {`);
			header.push(`${indent}}`);
		}

		this.contentBody.payload.path = path;
		this.contentBody.payload.query = query;
		this.contentBody.payload.header = header;
	}

	private requestBodyObjectParse(requestBodyObject: RequestBodyObject) {
		const indent = this.getIndentation();
		const requestBodyObjectContent = Object.values(requestBodyObject.content);
		const { schema } = requestBodyObjectContent[0] || { schema: null };

		if (schema) {
			const type = (schema as SchemaObject)?.type;
			const referenceObject = '$ref' in schema ? (schema as ReferenceObject) : null;
			const arraySchemaObject = type === 'array' ? (schema as ArraySchemaObject) : null;
			const nonArraySchemaObject = type && this.nonArrayType.includes(type) ? (schema as NonArraySchemaObject) : null;

			if (referenceObject) {
				const str = this.schemaResolver.referenceObjectParse(referenceObject);
				return `${indent}type Body = ${str}`;
			}

			if (arraySchemaObject) {
				const str = this.schemaResolver.arraySchemaObjectParse(arraySchemaObject);
				return `${indent}type Body = ${str}`;
			}

			if (nonArraySchemaObject) {
				const result = this.schemaResolver.nonArraySchemaObjectParse(nonArraySchemaObject);
				if (Array.isArray(result)) {
					if (result.length === 0) {
						return [`${indent}type Body = ${nonArraySchemaObject.type};`];
					} else {
						return [`${indent}interface Body {`, ...result.map((item) => item.replace(/: string;/, ': File;')), `}`];
					}
				} else {
					return [`${indent}type Body = ${result}`];
				}
			}
		}
	}

	private requestBodyParse(requestBody: OperationObject['requestBody']) {
		if (!requestBody) return '{}';
		const referenceObject = '$ref' in requestBody ? (requestBody as ReferenceObject) : null;
		const requestBodyObject = 'content' in requestBody ? (requestBody as RequestBodyObject) : null;
		if (referenceObject) {
			const typeName = this.schemaResolver.referenceObjectParse(referenceObject);
			return `${this.getIndentation()}type Body = ${typeName}`;
		}
		if (requestBodyObject && String(requestBody) === '[object Object]' && Reflect.ownKeys(requestBody).length !== 0) {
			return this.requestBodyObjectParse(requestBodyObject);
		}
		return '{}';
	}

	private normalizemodulePrefix(modulePrefix?: string): string {
		if (!modulePrefix || modulePrefix.trim() === '') {
			return '';
		}

		let normalized = modulePrefix.trim();
		normalized = normalized.replace(/\/+$/g, '');

		if (!normalized.startsWith('/')) {
			normalized = '/' + normalized;
		}

		return normalized;
	}

	private apiRequestItemHandle(content: ContentBody) {
		const { payload, requestPath, _response, method, typeName, apiName, contentType } = content;
		const { _path, _query, body } = payload;
		const dataLevel = content.dataLevel || this.config.dataLevel || 'serve';
		const modulePrefix = this.normalizemodulePrefix(this.config.modulePrefix);

		const pathParamsHandle = () => {
			const arr = [];
			for (const i in _path) {
				arr.push(`${i}: ${typeName}.Path.${i}`);
			}
			const str = arr.join(arr.length > 1 ? ',' : '');
			if (str === '') return str;
			else return str + ',';
		};

		const queryParamsHandle = (): string => {
			const str = _query ? `query: ${typeName}.Query,` : '';
			return str === '' ? '' : `${str}`;
		};

		const bodyParamsHandle = (): string => {
			const str = body.length > 0 ? `body: ${typeName}.Body,` : '';
			return str === '' ? `` : `${str}`;
		};

		const apiParamsPath = pathParamsHandle();
		const apiParamsQuery = queryParamsHandle();
		const apiParamsBody = bodyParamsHandle();

		const objParamsHandle = () => {
			const _config = SUPPORTED_REQUEST_UPLOAD_TYPES.includes(contentType as any) ? `headers: { 'Content-Type': '${contentType}' }` : undefined;
			const param = [
				`{`,
				_config ? `${_config},` : '',
				'...params, ',
				apiParamsQuery === '' ? '' : 'query,',
				apiParamsBody === '' ? '' : 'body,',
				`},`,
			];
			return param.join('');
		};

		const parameter = (apiParamsPath + apiParamsQuery + apiParamsBody).replace(/,$/, '');

		const contentList: Array<string> = [
			`export const ${apiName} = `,
			'(',
			parameter,
			parameter === '' ? 'params?: IRequestFnParams' : ', params?: IRequestFnParams',
			')',
			` => `,
			method,
			`${_response ? '<' + `${typeName}.Response` + '>' : ''}`,
			'(',
			'`' + `${modulePrefix}${requestPath}` + '`,',
			objParamsHandle(),
			`'${dataLevel}'`,
			');',
		];
		const apidetails = contentList.join('');
		return apidetails;
	}

	private responseHandle(response: OpenAPIV3.ResponsesObject) {
		const value = response['200'];
		if (!value) return;
		const responseObject = 'content' in (value as ResponseObject) ? (value as ResponseObject) : null;
		const referenceObject = '$ref' in (value as ReferenceObject) ? (value as ReferenceObject) : null;

		if (responseObject === null && referenceObject === null) {
			this.contentBody.response = `type Response = unknown`;
			this.contentBody._response = 'unknown';
		}

		if (referenceObject) {
			let typeName = this.schemaResolver.referenceObjectParse(referenceObject);

			// 应用响应模型转换
			if (this.config.responseModelTransform) {
				typeName = this.schemaResolver.transformResponseModel(typeName, this.config.responseModelTransform) as string;
			}

			this.contentBody.response = `type Response = ${typeName}`;
			this.contentBody._response = typeName;
		}

		if (responseObject) {
			let responsess = this.schemaResolver.responseObjectParse(responseObject);

			// 应用响应模型转换
			if (this.config.responseModelTransform) {
				responsess = this.schemaResolver.transformResponseModel(responsess, this.config.responseModelTransform);
			}

			if (Array.isArray(responsess)) {
				if (responsess.length === 1 && responsess[0] === 'unknown') {
					this.contentBody.response = `type Response = ${responsess.join('\n')};`;
				} else {
					const ln = this.config.formatting?.lineEnding;
					const ind = this.config.formatting?.indentation;
					this.contentBody.response = `interface Response {${ln}${responsess.join('\n')}${ln}${ind}};`;
				}
				this.contentBody._response = `${responsess.join('\n')}`;
			} else {
				this.contentBody.response = `type Response = ${responsess}`;
				this.contentBody._response = `${responsess}`;
			}
		}
	}

	private requestHandle(v: OperationObject) {
		if (v.parameters) {
			this.requestParametersParse(v.parameters);
		}

		if (v.requestBody) {
			const body = this.requestBodyParse(v.requestBody);
			if (Array.isArray(body)) {
				this.contentBody.payload.body = body;
			} else if (body) {
				const value = body?.split('\n') || [];
				this.contentBody.payload.body = value;
			}
		}
	}

	private parsePathItemObject(itemObject: PathItemObject, pathKey: string, apiListFileContent: string[]) {
		if (!itemObject) return;

		for (const method in itemObject) {
			const methodItems = itemObject[method as HttpMethods];
			if (methodItems) {
				let matchedInclude: IIncludeInterface | undefined;

				if (this.config.includeInterface && this.config.includeInterface.length > 0) {
					const include = this.config.includeInterface?.find((item) => pathKey === item.path && item.method === method);
					if (!include) return;
					matchedInclude = include;
				} else if (this.config.excludeInterface && this.config.excludeInterface.length > 0) {
					const exclude = this.config.excludeInterface?.find((item) => pathKey === item.path && item.method === method);
					if (exclude) return;
				}

				const methodUp = method.toUpperCase();
				const mapKey = pathKey + '|' + methodUp;
				const { apiName, typeName, fileName, path } = convertEndpointString(mapKey, this.config);

				const contentType = methodItems.requestBody && 'content' in methodItems.requestBody && methodItems.requestBody.content;
				const contentTypeKey = (typeof contentType === 'object' ? Object.keys(contentType)[0] : 'application/json') as IContentType;

				this.contentBody = {
					payload: { path: [], query: [], header: [], body: [] },
					response: '',
					_response: '',
					fileName,
					method: methodUp,
					typeName,
					requestPath: path,
					apiName,
					summary: methodItems.summary,
					deprecated: methodItems.deprecated ?? false,
					contentType: SUPPORTED_REQUEST_TYPES_ALL.includes(contentTypeKey) ? contentTypeKey : 'application/json',
					dataLevel: matchedInclude?.dataLevel,
				};

				this.requestHandle(methodItems);
				this.responseHandle(methodItems.responses);

				if (methodItems.summary) {
					apiListFileContent.push(
						['/**', '\n', methodItems.deprecated ? ` * @deprecated ${methodItems.summary}` : ` * ${methodItems.summary}`, '\n', ' */'].join(''),
					);
				}

				const apistr = this.apiRequestItemHandle(this.contentBody);
				apiListFileContent.push(apistr, '');

				if (!this.Map.has(mapKey)) {
					this.Map.set(mapKey, JSON.parse(JSON.stringify(this.contentBody)));
				}
			}
		}
	}

	private async parseData(): Promise<MapType> {
		for (const requestPath in this.pathsObject) {
			const methodObject = this.pathsObject[requestPath];
			if (methodObject) {
				this.parsePathItemObject(methodObject, requestPath, this.apiListFileContent);
			}
		}
		return this.Map;
	}

	private async writeFile() {
		const methodList: Array<string> = [];
		await this.writer.write(this.Map, this.apiListFileContent, methodList);
		this.Map = new Map();

		if (this.errors.length > 0) {
			log.warning(`Completed with ${this.errors.length} errors`);
		}
	}

	async handle() {
		try {
			await this.parseData();
			await this.writeFile();
		} catch (error) {
			this.handleError({
				type: 'SCHEMA',
				message: 'Failed to handle schema',
				details: error,
			});
			if (this.config.errorHandling?.throwOnError) {
				throw error;
			}
		}
	}
}

export default PathParse;
