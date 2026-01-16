import { OpenAPIV3 } from 'openapi-types';

export type ComponentsSchemas = OpenAPIV3.ComponentsObject['schemas'];

export type ArraySchemaObject = OpenAPIV3.ArraySchemaObject;
export type NonArraySchemaObject = OpenAPIV3.NonArraySchemaObject & { description?: string };
export type PathsObject = OpenAPIV3.PathsObject;

export type PathItemObject = OpenAPIV3.PathItemObject;
export type OperationObject = OpenAPIV3.OperationObject;

export type SchemaObject = ArraySchemaObject | NonArraySchemaObject;
export type ReferenceObject = OpenAPIV3.ReferenceObject;
export type ParameterObject = OpenAPIV3.ParameterObject;
export type RequestBodyObject = OpenAPIV3.RequestBodyObject;
export type Schema = ReferenceObject | SchemaObject;
export type ResponseObject = OpenAPIV3.ResponseObject;

// 修改错误类型定义，添加新的错误类型
export type ParseError = {
	type: 'SCHEMA' | 'PATH' | 'REFERENCE' | 'FILE_WRITE' | 'RESPONSE' | 'PARAMETERS' | 'REQUEST_BODY' | 'API';
	message: string;
	path?: string;
	details?: unknown;
};

type TDatalevel = 'data' | 'serve' | 'axios';

export interface IIncludeInterface {
	path: string;
	method: string;
	dataLevel?: TDatalevel;
}

export interface IConfigSwaggerServer {
	/** swagger json 的 url */
	url: string;
	/** 公共前缀 */
	publicPrefix?: string;
	/** 生成接口默认返回数据层级（服务级配置） */
	dataLevel?: TDatalevel;
	/** 参数分隔符（服务级配置） */
	parameterSeparator?: '$' | '_';
	/** api list 的文件名称 */
	apiListFileName?: string;
	/** 追加请求头 */
	headers?: Record<string, string>;
	/** 包含的接口（服务级配置） */
	includeInterface?: IIncludeInterface[];
	/** 排除的接口（服务级配置） */
	excludeInterface?: Omit<IIncludeInterface, 'dataLevel'>[];
	/** path 前缀 */
	modulePrefix?: string;
}

export interface ConfigType {
	/** 存放生成的类型文件的文件夹路径 */
	saveTypeFolderPath: string;
	/** 存放生成的 api 文件的文件夹路径 */
	saveApiListFolderPath: string;
	/**
	 * 兼容旧配置的 swagger json 地址（已迁移到 swaggerConfig 中）
	 */
	swaggerJsonUrl?: string;

	/** swagger 服务器列表 */
	swaggerConfig: IConfigSwaggerServer[] | IConfigSwaggerServer;

	/** api list 生成文件名，单个 swaggerServer 可省略，默认 index.ts */
	apiListFileName?: string;

	/** 请求方法导入路径 */
	requestMethodsImportPath: string;
	/** 追加请求头 */
	headers?: Record<string, string>;
	/** 公共前缀（仅为兼容旧配置，最终以服务级配置为准） */
	publicPrefix?: string;
	/** 生成接口默认返回数据层级（服务级配置注入） */
	dataLevel?: TDatalevel;
	/** 参数分隔符（服务级配置注入） */
	parameterSeparator?: '$' | '_';
	/** 包含的接口（服务级配置注入） */
	includeInterface?: IIncludeInterface[];
	/** 排除的接口（服务级配置注入） */
	excludeInterface?: Omit<IIncludeInterface, 'dataLevel'>[];
	/** path 前缀（服务级配置注入） */
	modulePrefix?: string;
	/** 格式化 */
	formatting?: {
		/** 缩进 */
		indentation: string;
		/** 换行符（行结束符） */
		lineEnding: string;
	};

	/** 枚举数据保存路径 */
	saveEnumFolderPath: string;
	/** enum 导入路径 */
	importEnumPath: string;

	/** enum 配置 */
	enmuConfig: {
		/** 该选项与项目中 tsconfig.json 中 compilerOptions.erasableSyntaxOnly 选项一致 */
		erasableSyntaxOnly: boolean;
		/** 枚举变量名 */
		varnames: string;
		/** 枚举描述 */
		comment: string;
	};
}

// 修改配置类型定义，将必需属性标记出来
export interface PathParseConfig extends ConfigType {
	// 可选的属性
	typeMapping?: Map<string, string>;
	errorHandling?: {
		throwOnError: boolean;
		logErrors: boolean;
	};

	templates?: {
		apiFunction?: string;
		typeDefinition?: string;
	};
}

export type IContentType =
	| 'application/json'
	| 'text/json'
	| 'text/plain'
	| 'application/x-www-form-urlencoded'
	| 'application/xml'
	| 'text/xml'
	| '*/*'
	| 'application/octet-stream'
	| 'multipart/form-data';

export type ContentBody = {
	payload: {
		path: Array<string>;
		_path?: { [key: string]: string };
		query: Array<string>;
		_query?: { [key: string]: string };
		header: Array<string>;
		_header?: { [key: string]: string };
		body: Array<string>;
	};
	response: string;
	_response: string;
	fileName: string;
	method: string;
	requestPath: string;
	summary: string | undefined;
	apiName: string;
	typeName: string;
	deprecated: boolean;
	contentType: IContentType;
	/** 接口级别的 dataLevel 配置，优先级最高 */
	dataLevel?: TDatalevel;
};

export type MapType = Map<string, ContentBody>;

// 渲染条目类型，用于组件和枚举的文件生成
export type RenderEntry = { fileName: string; content: string };
