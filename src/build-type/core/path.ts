import { OpenAPIV3 } from 'openapi-types';
import { clearDir, writeFileRecursive } from '../../utils';
import { ArraySchemaObject, ConfigType, NonArraySchemaObject, OperationObject, PathItemObject, PathsObject } from '../types';

const TIGHTEN = `\t`; // 缩进

type SchemaObject = ArraySchemaObject | NonArraySchemaObject;
type ReferenceObject = OpenAPIV3.ReferenceObject;
type ParameterObject = OpenAPIV3.ParameterObject;
type RequestBodyObject = OpenAPIV3.RequestBodyObject;
type Schema = ReferenceObject | SchemaObject; // OpenAPIV3.ParameterBaseObject['schema'] ;
type Properties = OpenAPIV3.BaseSchemaObject['properties'];
type ResponsesObject = OpenAPIV3.ResponsesObject;
type ResponseObject = OpenAPIV3.ResponseObject;

type ContentBody = {
	payload: {
		path: Array<string>; // 在 path 中的参数
		_path?: { [key: string]: string };
		query: Array<string>; // 在 body 中的参数
		_query?: { [key: string]: string };
		body: Array<string>; // 在 query 中的参数
	};
	response: string; // 响应
	_response: string;
	/**
	 * 文件名
	 */
	fileName: string; // 文件名
	/**
	 * 请求方法名
	 */
	method: string;
	/**
	 * 请求路径
	 */
	requestPath: string;
	/**
	 * 接口描述
	 */
	summary: string | undefined;
	/**
	 * API 名称
	 */
	apiName: string;
	/**
	 * 类型名称
	 */
	typeName: string;
};

type MapType = Map<string, ContentBody>;

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

const contentBody: ContentBody = {
	payload: {
		path: [],
		query: [],
		body: [],
	},
	response: '',
	_response: '',
	fileName: '',
	apiName: '',
	typeName: '',
	method: '',
	requestPath: '',
	summary: '',
};

export class PathParse {
	pathsObject: PathsObject = {};
	nonArrayType = ['boolean', 'object', 'number', 'string', 'integer'];
	pathKey = '';
	contentBody: ContentBody = contentBody;
	Map: MapType = new Map();
	config: ConfigType;

	constructor(pathsObject: PathsObject, config: ConfigType) {
		this.pathsObject = pathsObject;
		this.config = config;
	}

	typeNameToFileName(name: string) {
		const fileName = name
			.replace(/([A-Z][a-z])/g, (str: string) => '-' + str.toLowerCase())
			.replace(/([A-Z]{2,})/g, '-$1')
			.toLowerCase()
			.slice(1);
		return fileName;
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
				const _val = `Array<{${val.join('\n')}}>`;
				return _val;
			} else {
				return `Array<${val}>`;
			}
		}
		return '';
	}

	referenceObjectParse(refobj: ReferenceObject): string {
		if (!refobj) return '';
		const typeName = refobj.$ref.replace('#/components/schemas/', '');
		const fileName = this.typeNameToFileName(typeName);
		const importStatements = `import('../models/${fileName}').${typeName}`;
		// return { importStatements, typeName };
		return importStatements;
	}

	schemaParse(schema: Schema | undefined): string | string[] {
		if (!schema) return 'unknown';
		const type = (schema as SchemaObject)?.type;
		const referenceObject = '$ref' in schema ? (schema as ReferenceObject) : null;
		const arraySchemaObject = type === 'array' ? (schema as ArraySchemaObject) : null;
		const nonArraySchemaObject = type && this.nonArrayType.includes(type) ? (schema as NonArraySchemaObject) : null;
		if (referenceObject) {
			return this.referenceObjectParse(referenceObject);
		}
		if (arraySchemaObject) {
			return this.arraySchemaObjectParse(arraySchemaObject);
		}
		if (nonArraySchemaObject) {
			return this.nonArraySchemaObjectParse(nonArraySchemaObject);
		}
		return 'unknown';
	}

	responseObjectParse(responseObject: ResponseObject) {
		const content = responseObject.content;
		if (!content) return '';

		const { schema } = Object.values(content)[0];

		if (schema) {
			const result = this.schemaParse(schema);
			return result;
		}
	}

	responseHandle(response: ResponsesObject) {
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
			// this.contentBody.response = `type Response = ${typeName}['responseObject']`;
			this.contentBody.response = `type Response = ${typeName}`;
			this.contentBody._response = typeName;
		}

		if (responseObject) {
			const responsess = this.responseObjectParse(responseObject);
			// console.log(responsess);
			// this.contentBody.response = `type Response = ${responsess}['responseObject']`;
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

		const { schema } =
			Array.isArray(requestBodyObjectContent) && requestBodyObjectContent.length > 0 ? requestBodyObjectContent[0] : { schema: null };
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
				console.log(this.pathKey, typeName, 'item 是 ReferenceObject 类型', '----未处理---');
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
							console.log(v2value);
						}
					} else {
						if (typeof v2value === 'string') {
							this.contentBody.payload._path = { [V2.name]: v2value };
						} else {
							console.log(v2value);
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
							console.log(v2value);
						}
					} else {
						if (typeof v2value === 'string') {
							this.contentBody.payload._query = { [V2.name]: v2value };
						} else {
							console.log(v2value);
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

	parsePathItemObject(itemObject: PathItemObject, pathKey: string) {
		if (!itemObject) return;
		for (const method in itemObject) {
			const methodItems = itemObject[method as HttpMethods];
			if (methodItems) {
				const methodUp = method.toUpperCase();
				const mapKey = pathKey + '|' + methodUp;
				const { apiName, typeName, fileName, path } = this.convertEndpointString(mapKey);
				this.contentBody.method = methodUp;
				this.contentBody.typeName = typeName;
				this.contentBody.summary = methodItems.summary;
				this.contentBody.fileName = fileName;
				this.contentBody.requestPath = path;
				this.contentBody.apiName = apiName;

				this.requestHandle(methodItems);
				this.responseHandle(methodItems.responses);

				if (!this.Map.has(mapKey)) this.Map.set(mapKey, JSON.parse(JSON.stringify(this.contentBody)));
				this.contentBody = {
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
			}
		}
	}

	initialize(): Promise<MapType> {
		return new Promise((resolve, reject) => {
			try {
				for (const requestPath in this.pathsObject) {
					const itemObject = this.pathsObject[requestPath];
					if (itemObject) this.parsePathItemObject(itemObject, requestPath);
				}
				resolve(this.Map);
			} catch (error) {
				reject(error);
			}
		});
	}
	convertEndpointString(apiString: string) {
		// 去掉 "/api/" 并分割路径
		let completionPath = apiString;
		if (!apiString.startsWith('/')) {
			completionPath = '/' + apiString;
		}
		// 拆分路径和方法
		const [path, method] = completionPath.split('|');

		// 去掉开头的斜杠
		const trimmedPath = path.replace('/api/', '').split('/');

		const pathName = trimmedPath
			.map((part) => (part.includes('{') ? `$${part.slice(1, -1)}` : part.charAt(0).toUpperCase() + part.slice(1)))
			.join('');

		// 添加请求方法
		const str = `${pathName}_${method}`;

		return {
			// api 名称
			apiName: str.charAt(0).toLowerCase() + str.slice(1),
			// 文件 名
			fileName: (path.slice(1).replace(/\//g, '-').replace('api-', '') + '-' + method).toLowerCase(),
			// 类型名
			typeName: str.charAt(0).toUpperCase() + str.slice(1),
			// 请求路径
			path: path.replace(/(\/api)|(api)/g, '').replace(/\{\w+\}/g, (s) => `$${s}`),
		};
	}

	apiRequestItemHandle(content: ContentBody) {
		const { payload, requestPath, _response, method, typeName, apiName } = content;
		const { _path, _query, body } = payload;

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
			'(`' + requestPath + '`' + `${apiParamsQuery || apiParamsBody ? ', params' : ''}` + ');',
		];
		const apidetails = contentList.join('');
		return apidetails;
	}

	writeFileHabdler() {
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
					const Comment = ['/**', '\n', ` * ${summary}`, '\n', ' */'].join('');
					summary && apiListFileContent.push(Comment);

					// api 请求
					const apistr = this.apiRequestItemHandle(content);
					apiListFileContent.push(apistr, '\n');

					writeFileRecursive(`${saveTypeFolderPath}/api/${fileName}.d.ts`, contentArray.join('\n'))
						.then(() => resolve(1))
						.catch((err) => {
							reject(err);
							console.error(err);
						});
				} catch (error: any) {
					console.error(error, true);
					reject();
				}
			});

		for (const [key, value] of this.Map) {
			console.log(key);
			Plist.push(P(key, value));
		}

		Promise.all(Plist).then(() => {
			apiListFileContent.unshift(`import { ${methodList.join(', ')} } from '${this.config.requestMethodsImportPath || './api'}';`, '\n');
			clearDir(this.config.apiListFilePath + '/index.ts').finally(() => {
				writeFileRecursive(this.config.apiListFilePath + '/index.ts', apiListFileContent.join('\n'))
					.then(() => {
						console.log('path parse done!');
						this.Map = new Map();
					})
					.catch((err: any) => {
						console.error('----------->', err);
					});
			});
		});
	}

	handle() {
		this.initialize().then(() => this.writeFileHabdler());
	}
}

export default PathParse;
