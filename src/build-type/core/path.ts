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
};

/**
 * 路径解析类，用于处理 OpenAPI 规范中的路径对象
 */
export class PathParse {
	/** OpenAPI 路径对象 */
	pathsObject: OpenAPIV3.PathsObject = {};
	/** 非数组类型列表 */
	nonArrayType = ['boolean', 'object', 'number', 'string', 'integer'];
	/** 当前处理的路径键 */
	pathKey = '';
	/** 内容主体对象，存储请求和响应相关信息 */
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
	/** 类型映射表 */
	Map: MapType = new Map();
	/** 配置对象 */
	private config: PathParseConfig;
	/** 解析错误列表 */
	private errors: ParseError[] = [];
	/** Schema 缓存 */
	private schemaCache = new Map<string, string>();
	/** 引用缓存 */
	private referenceCache = new Map<string, string>();

	/** 字符串模板对象 */
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

	/**
	 * 处理错误信息
	 * @param error 错误对象
	 */
	private handleError(error: ParseError) {
		this.errors.push(error);
		if (this.config.errorHandling?.logErrors) {
			log.error(`${error.type}: ${error.message}${error.path ? ` at ${error.path}` : ''}`);
		}
		if (this.config.errorHandling?.throwOnError) {
			throw new Error(`${error.type}: ${error.message}`);
		}
	}

	/**
	 * 获取缩进字符串
	 * @returns 缩进字符串
	 */
	private getIndentation(): string {
		return this.config.formatting?.indentation || TIGHTEN;
	}

	/**
	 * 格式化代码
	 * @param code 需要格式化的代码
	 * @returns 格式化后的代码
	 */
	private formatCode(code: string): string {
		const indent = this.getIndentation();
		const lineEnd = this.config.formatting?.lineEnding || '\n';
		return code
			.split('\n')
			.map((line) => `${indent}${line}`)
			.join(lineEnd);
	}

	/**
	 * 将类型名转换为文件名
	 * @param str 类型名
	 * @returns 转换后的文件名
	 */
	typeNameToFileName(str: string) {
		str = str.replace(/_/g, '-');
		str = str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
		str = str.replace(/-+/g, '-');
		return str;
	}

	/**
	 * 处理复杂类型的解析
	 * @param schema Schema 对象
	 * @returns 解析后的类型字符串
	 */
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

	/**
	 * 解析属性对象
	 * @param properties 属性对象
	 * @returns 解析后的属性字符串数组
	 */
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

	/**
	 * 解析非数组类型的Schema对象
	 * @param nonArraySchemaObject 非数组Schema对象
	 * @returns 解析后的类型字符串或字符串数组
	 */
	nonArraySchemaObjectParse(nonArraySchemaObject: NonArraySchemaObject): string | string[] {
		if (!nonArraySchemaObject) return 'unknown';

		// 检查 format 和 type
		if (nonArraySchemaObject.format === 'binary' || (nonArraySchemaObject.type === 'string' && nonArraySchemaObject.format === 'binary')) {
			return 'File';
		}

		switch (nonArraySchemaObject.type) {
			case 'boolean':
				return 'boolean';
			case 'integer':
			case 'number':
				return 'number';
			case 'object':
				return this.propertiesParse(nonArraySchemaObject.properties);
			case 'string':
				// 再次检查是否为文件类型
				if (nonArraySchemaObject.format === 'binary') {
					return 'File';
				}
				return 'string';
			default:
				return 'unknown';
		}
	}

	/**
	 * 解析数组类型的Schema对象
	 * @param arraySchemaObject 数组Schema对象
	 * @returns 解析后的数组类型字符串
	 */
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

	/**
	 * 解析引用对象
	 * @param refobj 引用对象
	 * @returns 解析后的引用类型字符串
	 */
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
			const regEnum = /enum/gi;
			const importStatement = regEnum.test(typeName)
				? `import('${this.config.importEnumPath}/${fileName}').${typeName}`
				: `import('../models/${fileName}').${typeName}`;

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

	/**
	 * 解析 Schema 对象
	 * @param schema Schema 对象
	 * @returns 解析后的类型字符串或字符串数组
	 */
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

			if (schema.format && this.config.typeMapping?.has(schema.format)) {
				return (this.config.typeMapping.get(schema.format) as string) + nullableStr;
			}

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

	/**
	 * 处理响应对象
	 * @param responseObject OpenAPI 响应对象
	 * @returns 响应类型字符串
	 */
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

	/**
	 * 处理响应对象
	 * @param response OpenAPI响应对象
	 */
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

	/**
	 * 解析请求体对象
	 * @param requestBodyObject 请求体对象
	 * @returns 解析后的请求体类型定义
	 */
	requestBodyObjectParse(requestBodyObject: RequestBodyObject) {
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
						return [`${TIGHTEN}interface Body {`, ...result.map((item) => item.replace(/: string;/, ': File;')), `}`];
					}
				} else {
					return [`${TIGHTEN}type Body = ${result}`];
				}
			}
		}
	}

	/**
	 * 解析请求体
	 * @param requestBody 请求体对象
	 * @returns 解析后的请求体类型字符串
	 */
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

	/**
	 * 解析请求参数
	 * @param parameters 请求参数数组
	 */
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

	/**
	 * 处理请求对象
	 * @param v 操作对象
	 */
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

	/**
	 * 处理API请求项
	 * @param content 内容主体对象
	 * @returns 生成的API请求代码
	 */
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
		const datalevel = hasFileUpload ? `,${this.config.dataLevel}` : '';
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

	/**
	 * 解析路径项对象
	 * @param itemObject 路径项对象
	 * @param pathKey 路径键
	 */
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

	/**
	 * 转换端点字符串
	 * @param apiString API字符串
	 * @returns 转换后的端点信息对象
	 */
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

	/**
	 * 解析数据
	 * @returns Promise<MapType> 解析后的数据Map
	 */
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

	/**
	 * 写入文件
	 * 将解析后的数据写入到指定文件中
	 */
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

					writeFileRecursive(`${saveTypeFolderPath}/connectors/${fileName}.d.ts`, contentArray.join('\n'))
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

			await clearDir(this.config.saveApiListFolderPath + '/index.ts');
			await writeFileRecursive(this.config.saveApiListFolderPath + '/index.ts', apiListFileContent.join('\n'));

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

	/**
	 * 主要处理方法，解析并写入文件
	 */
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
