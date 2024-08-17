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
	namespace: string;
	payload: {
		path: Array<string>; // 在 path 中的参数
		_path?: { [key: string]: string };
		query: Array<string>; // 在 body 中的参数
		_query?: { [key: string]: string };
		body: Array<string>; // 在 query 中的参数
	};
	response: string; // 响应
	_response: string;
	fileName: string; // 文件名
	method: string; // 方法名
	path: string; // 请求路径
	summary: string | undefined;
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
	namespace: '',
	payload: {
		path: [],
		query: [],
		body: [],
	},
	response: '',
	_response: '',
	fileName: '',
	method: '',
	path: '',
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

	pathTranslantionName(path: string, method: HttpMethods): { name: string; method: string } {
		// 补全路径
		let completionPath = path;
		if (!path.startsWith('/')) {
			completionPath = '/' + path;
		}

		const name = completionPath
			.slice(1)
			.replace(/\/\{\w+\}/g, () => '')
			.replace(/\/\w/g, (str) => {
				const [, two] = str.split('');
				return two.toUpperCase();
			})
			.replace(/(\/api)|(api)/g, '');
		return { name, method };
	}

	pathTranslantionFileName(_path: string): { name: string; path: string } {
		// 补全路径
		let completionPath = _path;
		if (!_path.startsWith('/')) {
			completionPath = '/' + _path;
		}

		const path = completionPath.replace(/(\/api)|(api)/g, '').replace(/\{\w+\}/g, (s) => `$${s}`);
		const name = completionPath.slice(1).replace(/\//g, '-').replace('api-', '');
		return { name, path };
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
			this.contentBody.response = `type Response = void`;
			this.contentBody._response = 'void';
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
						return [`${TIGHTEN}type Body = void`];
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

	parsePathItemObject(itemObject: PathItemObject) {
		for (const key in HttpMethods) {
			const _key = key.toLowerCase() as HttpMethods;
			const methodItems = itemObject[_key];
			if (methodItems) {
				const Path = this.pathKey;
				const { name, method } = this.pathTranslantionName(this.pathKey, key as HttpMethods);
				// if (Path === 'api/user/login') {
				this.requestHandle(methodItems);
				this.responseHandle(methodItems.responses);
				this.contentBody.method = method;
				this.contentBody.namespace = name + method;
				this.contentBody.summary = methodItems.summary;
				// }
			}
		}
	}

	initialize(): Promise<MapType> {
		return new Promise((resolve, reject) => {
			try {
				for (const key in this.pathsObject) {
					const itemObject = this.pathsObject[key];
					this.pathKey = key;
					if (itemObject) {
						const fileName = this.pathTranslantionFileName(key);
						this.contentBody.fileName = fileName.name;
						this.contentBody.path = fileName.path;
						this.parsePathItemObject(itemObject);
						this.Map.set(key, this.contentBody);
						this.contentBody = {
							namespace: '',
							payload: {
								path: [],
								query: [],
								body: [],
							},
							response: '',
							_response: '',
							fileName: '',
							method: '',
							path: '',
							summary: '',
						};
					}
				}
				resolve(this.Map);
			} catch (error) {
				reject(error);
			}
		});
	}

	writeApiListFile(content: ContentBody) {
		const { namespace, payload, method, path: apiPath, _response, summary } = content;
		const { _path, _query, body } = payload;
		const apiName = namespace.replace(namespace[0], namespace[0].toLowerCase());
		const pathParamsHandle = (p: any) => {
			const arr = [];
			for (const i in p) {
				arr.push(`${i}: ${namespace}.Path.${i}`);
			}
			if (arr.length > 1) return arr.join(',');
			else return arr.join('');
		};

		const apiParamsPath = _path ? pathParamsHandle(_path) : '';
		const apiParamsQuery = _query ? `params: ${namespace}.Query` : '';
		const apiParamsBody = body.length > 0 ? `params: ${namespace}.Body` : '';
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
			_query ? `params: ${namespace}.Query` : '',
			body.length > 0 ? `params: ${namespace}.Body` : '',
			')',
			` => `,
			`${method}${_response ? '<' + `${namespace}.Response` + '>' : ''}`,
			'(`' + apiPath + '`' + `${apiParamsQuery || apiParamsBody ? ', params' : ''}` + ');',
		];
		return contentList.join('');
	}

	writeFileHabdler() {
		const Plist = [];
		const apiListFileContent: string[] = [];
		const saveTypeFolderPath = this.config.saveTypeFolderPath;
		const methodList: Array<string> = [];

		const P = (key: string, content: ContentBody) =>
			new Promise((resolve, reject) => {
				try {
					const { namespace, payload, response, fileName, method, summary } = content;

					!methodList.includes(method) && methodList.push(method);

					const contentArray = [`declare namespace ${namespace} {`, ...payload.path, ...payload.query, ...payload.body, `${TIGHTEN}${response}`, `}`];

					// 添加注释
					const Comment = ['/**', '\n', ` * ${summary}`, '\n', ' */'].join('');
					summary && apiListFileContent.push(Comment);

					// api 请求
					const apistr = this.writeApiListFile(content);
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
			Plist.push(P(key, value));
		}

		Promise.all(Plist).then(() => {
			apiListFileContent.unshift(`import { ${methodList.join(', ')} } from './api';`, '\n');
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
