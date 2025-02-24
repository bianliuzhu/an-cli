import { OpenAPIV3 } from 'openapi-types';
import { clearDir, log, writeFileRecursive } from '../../utils';
import {
	ArraySchemaObject,
	ContentBody,
	MapType,
	NonArraySchemaObject,
	OperationObject,
	ParameterObject,
	ParseError,
	PathItemObject,
	PathParseConfig,
	Properties,
	ReferenceObject,
	RequestBodyObject,
	ResponseObject,
	Schema,
	SchemaObject,
} from '../types';

const TIGHTEN = `\t`; // 缩进

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

// 修改默认配置，添加必需的属性
const defaultConfig: Partial<PathParseConfig> = {
	typeMapping: new Map([
		['integer', 'number'],
		['string', 'string'],
		['boolean', 'boolean'],
		['binary', 'File'],
	]),
	errorHandling: {
		throwOnError: false,
		logErrors: true,
	},
	formatting: {
		indentation: '\t',
		lineEnding: '\n',
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
	};
	Map: MapType = new Map();
	private config: PathParseConfig;
	private errors: ParseError[] = [];
	private schemaCache = new Map<string, string>();
	private referenceCache = new Map<string, string>();

	// 优化字符串操作
	private readonly templates = {
		exportConst: (name: string) => `export const ${name}`,
		typeDefinition: (name: string, type: string) => `type ${name} = ${type}`,
		interfaceDefinition: (name: string) => `interface ${name}`,
	};

	constructor(pathsObject: OpenAPIV3.PathsObject, config: PathParseConfig) {
		this.pathsObject = pathsObject;
		// 合并配置，确保必需的属性来自传入的 config
		this.config = {
			...defaultConfig,
			...config,
			typeMapping: new Map([...(defaultConfig.typeMapping || []), ...(config.typeMapping || [])]),
		};
	}

	// 错误处理方法
	private handleError(error: ParseError) {
		this.errors.push(error);
		if (this.config.errorHandling?.logErrors) {
			log.error(`${error.type}: ${error.message}${error.path ? ` at ${error.path}` : ''}`);
		}
		if (this.config.errorHandling?.throwOnError) {
			throw new Error(`${error.type}: ${error.message}`);
		}
	}

	// 使用配置
	private getIndentation(): string {
		return this.config.formatting?.indentation || TIGHTEN;
	}

	private formatCode(code: string): string {
		const indent = this.getIndentation();
		const lineEnd = this.config.formatting?.lineEnding || '\n';
		return code
			.split('\n')
			.map((line) => `${indent}${line}`)
			.join(lineEnd);
	}

	typeNameToFileName(str: string) {
		str = str.replace(/_/g, '-');
		str = str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
		str = str.replace(/-+/g, '-');
		return str;
	}

	// 复杂类型处理
	private handleComplexType(schema: SchemaObject): string {
		try {
			if (schema.oneOf) {
				return schema.oneOf.map((type) => this.schemaParse(type)).join(' | ');
			}
			if (schema.allOf) {
				return schema.allOf.map((type) => this.schemaParse(type)).join(' & ');
			}
			if (schema.anyOf) {
				return schema.anyOf.map((type) => this.schemaParse(type)).join(' | ');
			}
			// 处理 enum
			if (schema.enum) {
				if (schema.type === 'number' || schema.type === 'integer') {
					return schema.enum.join(' | ');
				}
				return schema.enum.map((v) => `'${v}'`).join(' | ');
			}
			return 'unknown';
		} catch (error) {
			this.handleError({
				type: 'SCHEMA',
				message: 'Failed to handle complex type',
				details: error,
			});
			return 'unknown';
		}
	}

	propertiesParse(properties: Properties): string[] {
		const content = [];
		for (const key in properties) {
			const item = properties[key];
			const result = this.schemaParse(item);
			let _value = '';
			if (Array.isArray(result)) {
				_value = `${TIGHTEN}${TIGHTEN}${key}:{${result.join('\n')}};`;
			} else {
				_value = `${TIGHTEN}${TIGHTEN}${key}:${result};`;
			}
			content.push(_value);
		}
		return content;
	}

	nonArraySchemaObjectParse(nonArraySchemaObject: NonArraySchemaObject): string | string[] {
		if (!nonArraySchemaObject) return 'unknown';
		switch (nonArraySchemaObject.type) {
			case 'boolean':
				return 'boolean';
			case 'integer':
			case 'number':
				return 'number';
			case 'object':
				return this.propertiesParse(nonArraySchemaObject.properties);
			case 'string':
				if (nonArraySchemaObject.format === 'binary') {
					return 'File';
				}
				return 'string';
			default:
				return 'unknown';
		}
	}

	arraySchemaObjectParse(arraySchemaObject: ArraySchemaObject): string {
		if (arraySchemaObject.type !== 'array') return '';
		const { items } = arraySchemaObject;
		const referenceObject = '$ref' in (items as ReferenceObject) ? (items as ReferenceObject) : null;
		const schemaObject = items as SchemaObject;

		if (referenceObject) {
			const val = this.referenceObjectParse(referenceObject);
			return `Array<${val}>`;
		}

		if (schemaObject) {
			const val = this.schemaParse(items);
			if (Array.isArray(val)) {
				return `Array<{${val.join('\n')}}>`;
			} else {
				return `Array<${val}>`;
			}
		}
		return '';
	}

	referenceObjectParse(refobj: ReferenceObject): string {
		try {
			const refKey = refobj.$ref;

			// 使用缓存
			const cachedValue = this.referenceCache.get(refKey);
			if (cachedValue) {
				return cachedValue;
			}

			// 处理不同格式的引用路径
			let typeName = refKey;
			if (refKey.startsWith('#/components/schemas/')) {
				typeName = refKey.replace('#/components/schemas/', '');
			} else if (refKey.startsWith('#/definitions/')) {
				typeName = refKey.replace('#/definitions/', '');
			}

			const fileName = this.typeNameToFileName(typeName);
			const importStatement = `import('../models/${fileName}').${typeName}`;

			// 存入缓存
			this.referenceCache.set(refKey, importStatement);

			return importStatement;
		} catch (error) {
			this.handleError({
				type: 'REFERENCE',
				message: 'Failed to parse reference object',
				details: error,
			});
			return 'unknown';
		}
	}

	schemaParse(schema: Schema | undefined): string | string[] {
		try {
			if (!schema) return 'unknown';

			// 处理复杂类型
			if ('oneOf' in schema || 'allOf' in schema || 'anyOf' in schema || 'enum' in schema) {
				return this.handleComplexType(schema as SchemaObject);
			}

			// 处理引用类型
			if ('$ref' in schema) {
				return this.referenceObjectParse(schema);
			}

			const schemaObj = schema as SchemaObject;
			const type = schemaObj.type;

			// 处理 nullable
			const isNullable = schemaObj.nullable === true;
			const nullableStr = isNullable ? ' | null' : '';

			// 使用类型映射
			if (type && this.config.typeMapping?.has(type)) {
				return (this.config.typeMapping.get(type) as string) + nullableStr;
			}

			// 处理数组类型
			if (type === 'array' && schemaObj.items) {
				const itemType = this.schemaParse(schemaObj.items as Schema);
				return `Array<${itemType}>` + nullableStr;
			}

			// 处理对象类型
			if (type === 'object') {
				if (schemaObj.properties) {
					const props = this.propertiesParse(schemaObj.properties);
					return props.length ? props : ['unknown'];
				}
				if (schemaObj.additionalProperties === true) {
					return 'Record<string, unknown>' + nullableStr;
				}
				if (typeof schemaObj.additionalProperties === 'object') {
					const valueType = this.schemaParse(schemaObj.additionalProperties as Schema);
					return `Record<string, ${valueType}>` + nullableStr;
				}
			}

			return 'unknown';
		} catch (error) {
			this.handleError({
				type: 'SCHEMA',
				message: 'Failed to parse schema',
				details: error,
			});
			return 'unknown';
		}
	}

	responseObjectParse(responseObject: OpenAPIV3.ResponseObject) {
		try {
			const content = responseObject.content;
			if (!content) return '';

			// 支持多种响应格式
			const supportedTypes = ['application/json', 'text/json', 'text/plain', '*/*'];

			let schema;
			for (const type of supportedTypes) {
				if (content[type]?.schema) {
					schema = content[type].schema;
					break;
				}
			}

			if (schema) {
				return this.schemaParse(schema);
			}

			return '';
		} catch (error) {
			this.handleError({
				type: 'RESPONSE',
				message: 'Failed to parse response object',
				details: error,
			});
			return '';
		}
	}

	responseHandle(response: OpenAPIV3.ResponsesObject) {
		const value = response['200'];
		if (!value) return;
		const responseObject = 'content' in (value as ResponseObject) ? (value as ResponseObject) : null;
		const referenceObject = '$ref' in (value as ReferenceObject) ? (value as ReferenceObject) : null;

		if (responseObject === null && referenceObject === null) {
			this.contentBody.response = `type Response = unknown`;
			this.contentBody._response = 'unknown';
		}

		if (referenceObject) {
			const typeName = this.referenceObjectParse(referenceObject);
			this.contentBody.response = `type Response = ${typeName}`;
			this.contentBody._response = typeName;
		}

		if (responseObject) {
			const responsess = this.responseObjectParse(responseObject);
			if (Array.isArray(responsess)) {
				this.contentBody.response = `interface Response {${responsess.join('\n')}} `;
				this.contentBody._response = `${responsess.join('\n')}`;
			} else {
				this.contentBody.response = `type Response = ${responsess}`;
				this.contentBody._response = `${responsess}`;
			}
		}
	}

	requestBodyObjectParse(requestBodyObject: OpenAPIV3.RequestBodyObject) {
		const requestBodyObjectContent = Object.values(requestBodyObject.content);
		const { schema } = requestBodyObjectContent[0] || { schema: null };

		if (schema) {
			const type = (schema as SchemaObject)?.type;
			const referenceObject = '$ref' in schema ? (schema as ReferenceObject) : null;
			const arraySchemaObject = type === 'array' ? (schema as ArraySchemaObject) : null;
			const nonArraySchemaObject = type && this.nonArrayType.includes(type) ? (schema as NonArraySchemaObject) : null;

			if (referenceObject) {
				const str = this.referenceObjectParse(referenceObject);
				return `${TIGHTEN}type Body = ${str}`;
			}
			if (arraySchemaObject) {
				const str = this.arraySchemaObjectParse(arraySchemaObject);
				return `${TIGHTEN}type Body = ${str}`;
			}
			if (nonArraySchemaObject) {
				const result = this.nonArraySchemaObjectParse(nonArraySchemaObject);
				if (Array.isArray(result)) {
					if (result.length === 0) {
						return [`${TIGHTEN}type Body = unknown`];
					} else {
						return [`${TIGHTEN}interface Body {`, ...result, `}`];
					}
				} else {
					return [`${TIGHTEN}type Body = ${result}`];
				}
			}
		}
	}

	requestBodyParse(requestBody: OperationObject['requestBody']) {
		if (!requestBody) return '{}';
		const referenceObject = '$ref' in requestBody ? (requestBody as ReferenceObject) : null;
		const requestBodyObject = 'content' in requestBody ? (requestBody as RequestBodyObject) : null;
		if (referenceObject) {
			const typeName = this.referenceObjectParse(referenceObject);
			return `${TIGHTEN}type Body = ${typeName}`;
		}
		if (requestBodyObject && String(requestBody) === '[object Object]' && Reflect.ownKeys(requestBody).length !== 0) {
			return this.requestBodyObjectParse(requestBodyObject);
		}
		return '{}';
	}

	requestParametersParse(parameters: OperationObject['parameters']) {
		const path: Array<string> = [];
		const query: Array<string> = [];
		parameters?.map((item) => {
			const V1 = '$ref' in item ? (item as ReferenceObject) : null;
			const V2 = 'name' in item ? (item as ParameterObject) : null;

			if (V1) {
				const typeName = this.referenceObjectParse(V1);
				log.warning(`${this.pathKey} ${typeName} item 是 ReferenceObject 类型 ----未处理---`);
				return typeName;
			}
			if (V2) {
				if (V2.in === 'path') {
					const v2value = this.schemaParse(V2.schema);
					path.push(`${TIGHTEN}${TIGHTEN}type ${V2.name} = ${v2value};`);
					if (this.contentBody.payload._path) {
						if (typeof v2value === 'string') {
							this.contentBody.payload._path[V2.name] = v2value;
						} else {
							console.log('Unexpected v2value type:', v2value);
						}
					} else {
						if (typeof v2value === 'string') {
							this.contentBody.payload._path = { [V2.name]: v2value };
						} else {
							console.log('Unexpected v2value type:', v2value);
						}
					}
				}
				if (V2.in === 'query') {
					const v2value = this.schemaParse(V2.schema);
					query.push(`${TIGHTEN}${TIGHTEN}${V2.name}: ${v2value};`);
					if (this.contentBody.payload._query) {
						if (typeof v2value === 'string') {
							this.contentBody.payload._query[V2.name] = v2value;
						} else {
							console.log('Unexpected v2value type:', v2value);
						}
					} else {
						if (typeof v2value === 'string') {
							this.contentBody.payload._query = { [V2.name]: v2value };
						} else {
							console.log('Unexpected v2value type:', v2value);
						}
					}
				}
			}
		});

		if (path.length !== 0) {
			path.unshift(`${TIGHTEN}namespace Path {`);
			path.push(`${TIGHTEN}}`);
		}

		if (query.length !== 0) {
			query.unshift(`${TIGHTEN}interface Query {`);
			query.push(`${TIGHTEN}}`);
		}

		this.contentBody.payload.path = path;
		this.contentBody.payload.query = query;
	}

	requestHandle(v: OperationObject) {
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

	apiRequestItemHandle(content: ContentBody) {
		const { payload, requestPath, _response, method, typeName, apiName } = content;
		const { _path, _query, body } = payload;

		// 检查是否包含文件上传
		const hasFileUpload = body.some((line) => line.includes('File:') || line.includes(': File'));

		const pathParamsHandle = (p: { [x: string]: string }) => {
			const arr = [];
			for (const i in p) {
				arr.push(`${i}: ${typeName}.Path.${i}`);
			}
			if (arr.length > 1) return arr.join(',');
			else return arr.join('');
		};

		const apiParamsPath = _path ? pathParamsHandle(_path) : '';
		const apiParamsQuery = _query ? `params: ${typeName}.Query` : '';
		const apiParamsBody = body.length > 0 ? `params: ${typeName}.Body` : '';
		const temp: {
			apiParamsPath?: string;
			apiParamsQuery?: string;
			apiParamsBody?: string;
		} = {};
		apiParamsPath && (temp['apiParamsPath'] = apiParamsPath);
		apiParamsQuery && (temp['apiParamsQuery'] = apiParamsQuery);
		apiParamsBody && (temp['apiParamsBody'] = apiParamsBody);
		const paramsLeg = Object.keys(temp).length >= 2;

		// 只在文件上传时添加 datalevel 和 config
		const datalevel = hasFileUpload ? `,'serve'` : '';
		const config = hasFileUpload ? `, { headers: { 'Content-Type': 'multipart/form-data' } }` : '';

		const contentList: Array<string> = [
			`export const ${apiName} = `,
			'(',
			_path ? pathParamsHandle(_path) : '',
			`${paramsLeg ? ',' : ''}`,
			_query ? `params: ${typeName}.Query` : '',
			body.length > 0 ? `params: ${typeName}.Body` : '',
			')',
			` => `,
			`${method}${_response ? '<' + `${typeName}.Response` + '>' : ''}`,
			'(`' +
				requestPath +
				'`' +
				`${apiParamsQuery || apiParamsBody ? ', params' : ''}` +
				datalevel + // 只在文件上传时添加 datalevel
				config + // 只在文件上传时添加 config
				');',
		];
		const apidetails = contentList.join('');
		return apidetails;
	}

	parsePathItemObject(itemObject: PathItemObject, pathKey: string) {
		if (!itemObject) return;

		for (const method in itemObject) {
			const methodItems = itemObject[method as HttpMethods];
			if (methodItems) {
				const methodUp = method.toUpperCase();
				const mapKey = pathKey + '|' + methodUp;
				const { apiName, typeName, fileName, path } = this.convertEndpointString(mapKey);

				this.contentBody = {
					payload: { path: [], query: [], body: [] },
					response: '',
					_response: '',
					fileName,
					method: methodUp,
					typeName,
					requestPath: path,
					apiName,
					summary: methodItems.summary,
				};

				this.requestHandle(methodItems);
				this.responseHandle(methodItems.responses);

				if (!this.Map.has(mapKey)) {
					this.Map.set(mapKey, JSON.parse(JSON.stringify(this.contentBody)));
				}
			}
		}
	}

	convertEndpointString(apiString: string) {
		let completionPath = apiString;
		if (!apiString.startsWith('/')) {
			completionPath = '/' + apiString;
		}
		const [path, method] = completionPath.split('|');
		const trimmedPath = path.replace('/api/', '').split('/');

		const pathName = trimmedPath
			.map((part) => (part.includes('{') ? `$${part.slice(1, -1)}` : part.charAt(0).toUpperCase() + part.slice(1)))
			.join('');

		const str = `${pathName}_${method}`;

		return {
			apiName: str.charAt(0).toLowerCase() + str.slice(1),
			fileName: (path.slice(1).replace(/\//g, '-').replace('api-', '') + '-' + method).toLowerCase(),
			typeName: str.charAt(0).toUpperCase() + str.slice(1),
			path: path.replace(/(\/api)|(api)/g, '').replace(/\{\w+\}/g, (s) => `$${s}`),
		};
	}

	parseData(): Promise<MapType> {
		return new Promise((resolve, reject) => {
			try {
				for (const requestPath in this.pathsObject) {
					const methodObject = this.pathsObject[requestPath];
					if (methodObject) {
						this.parsePathItemObject(methodObject, requestPath);
					}
				}
				resolve(this.Map);
			} catch (error) {
				this.handleError({
					type: 'SCHEMA',
					message: 'Failed to parse schema',
					details: error,
				});
				reject(error);
			}
		});
	}

	async writeFile() {
		const Plist = [];
		const apiListFileContent: string[] = [];
		const saveTypeFolderPath = this.config.saveTypeFolderPath;
		const methodList: Array<string> = [];

		const P = (key: string, content: ContentBody) =>
			new Promise((resolve, reject) => {
				try {
					const { payload, response, fileName, summary, typeName } = content;

					const [, method] = key.split('|');
					!methodList.includes(method) && methodList.push(method);

					const contentArray = [`declare namespace ${typeName} {`, ...payload.path, ...payload.query, ...payload.body, `${TIGHTEN}${response}`, `}`];

					// 添加注释
					if (summary) {
						apiListFileContent.push(['/**', '\n', ` * ${summary}`, '\n', ' */'].join(''));
					}

					// api 请求
					const apistr = this.apiRequestItemHandle(content);
					apiListFileContent.push(apistr, '\n');

					writeFileRecursive(`${saveTypeFolderPath}/api/${fileName}.d.ts`, contentArray.join('\n'))
						.then(() => resolve(1))
						.catch((err) => {
							this.handleError({
								type: 'FILE_WRITE',
								message: 'Failed to write type definition file',
								path: fileName,
								details: err,
							});
							reject(err);
						});
				} catch (error) {
					this.handleError({
						type: 'PATH',
						message: 'Failed to process path item',
						path: key,
						details: error,
					});
					reject(error);
				}
			});

		for (const [key, value] of this.Map) {
			Plist.push(P(key, value));
		}

		try {
			await Promise.all(Plist);

			apiListFileContent.unshift(`import { ${methodList.join(', ')} } from '${this.config.requestMethodsImportPath || './api'}';`, '\n');

			await clearDir(this.config.apiListFilePath + '/index.ts');
			await writeFileRecursive(this.config.apiListFilePath + '/index.ts', apiListFileContent.join('\n'));

			this.Map = new Map();

			if (this.errors.length > 0) {
				log.warning(`Completed with ${this.errors.length} errors`);
			}
		} catch (error) {
			this.handleError({
				type: 'FILE_WRITE',
				message: 'Failed to write API list file',
				details: error,
			});
			throw error;
		}
	}

	async handle() {
		try {
			await this.parseData();
			await this.writeFile();
			log.success('Path parse & write done!');
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
