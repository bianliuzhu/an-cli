import { OpenAPIV3 } from 'openapi-types';

export type ComponentsSchemas = OpenAPIV3.ComponentsObject['schemas'];

export type ArraySchemaObject = OpenAPIV3.ArraySchemaObject;
export type NonArraySchemaObject = OpenAPIV3.NonArraySchemaObject & { description?: string };
export type PathsObject = OpenAPIV3.PathsObject;
export type HttpMethods = OpenAPIV3.HttpMethods;

export type PathItemObject = OpenAPIV3.PathItemObject;
export type OperationObject = OpenAPIV3.OperationObject;

export interface TreeInterfaceParamsItem {
	name: string;
	in?: string;
	description?: string;
	required?: boolean;
	type?: string;
}

export interface ParametersItems {
	default?: string;
	enum?: string[];
	type: string;
}

export type TreeInterfacePropertiesItem = {
	name: string;
	description?: string;
	required?: boolean;
	type?: string;
	enum?: string[];
	itemsRequiredNamesList?: string[];
	properties?: Partial<TreeInterfacePropertiesItem>;
	/** 子类型 */
	item?: TreeInterfacePropertiesItem[] | string;
	/** 子类型-联合 */
	itemUnion?: Required<TreeInterfacePropertiesItem['item']>[];
	title?: string;
	titRef?: string;
	itemsType?: string;
	default?: any;
	items?: ParametersItems;
};

export interface TreeInterface {
	type: string;
	basePath: string;
	groupName: string;
	method: string;
	params: TreeInterfaceParamsItem[] | TreeInterfacePropertiesItem;
	response: TreeInterfacePropertiesItem | TreeInterfacePropertiesItem[] | string;
	title: string;
	path: string;
	subTitle: string;
	pathName: string;
	fileName: string;
	operationId: string;
	savePath: string;
	interfaceNamespace?: string;
}
interface FileHeaderInfo {
	/** 文件名 */
	fileName: string;
	/** 扩展名 */
	ext: string;
	/** 文件路径 */
	filePath: string;
	/** 接口名称 */
	name?: string;
	/** namespace */
	namespace?: string;
	/** 接口地址 */
	path?: string;
	/** 请求方法 */
	method?: string;
	/** 更新时间 */
	update?: string;
	/** 忽略自动更新 */
	ignore?: boolean;
	/** 接口保存目录 */
	savePath?: string;
}

export interface SwaggerJsonTreeItem extends Partial<TreeInterface> {
	key: string;
	parentKey: string;
	type:
		| 'root' // 根节点
		| 'group' // 接口分组
		| 'interface' // 接口节点
		| 'file-sync' // 本地文件
		| 'file-ignore'; // 本地文件
	title: string;
	subTitle: string;
	savePath?: string;
	children?: any[];
}
export interface TemplateBaseType {
	namespace?: (params: TreeInterface) => string;
	params?: (params: TreeInterface) => string;
	paramsItem?: (item: TreeInterfacePropertiesItem, params: TreeInterface) => string;
	response?: (params: TreeInterface) => string;
	responseItem?: (item: TreeInterfacePropertiesItem, params: TreeInterface) => string;
	copyRequest?: (params: FileHeaderInfo) => string | string[];
}
export type TSwaggerJsonMap = Map<string, SwaggerJsonTreeItem[]>;

export type SchemaObject = ArraySchemaObject | NonArraySchemaObject;
export type ReferenceObject = OpenAPIV3.ReferenceObject;
export type ParameterObject = OpenAPIV3.ParameterObject;
export type RequestBodyObject = OpenAPIV3.RequestBodyObject;
export type Schema = ReferenceObject | SchemaObject;
export type Properties = OpenAPIV3.BaseSchemaObject['properties'];
export type ResponseObject = OpenAPIV3.ResponseObject;

// 修改错误类型定义，添加新的错误类型
export type ParseError = {
	type: 'SCHEMA' | 'PATH' | 'REFERENCE' | 'FILE_WRITE' | 'RESPONSE' | 'PARAMETERS' | 'REQUEST_BODY' | 'API';
	message: string;
	path?: string;
	details?: unknown;
};

type TDatalevel = 'data' | 'serve' | 'axios';

export interface IncludeOrExcludeInterface {
	path: string;
	method: string;
}

export interface ConfigType {
	/** 存放生成的类型文件的文件夹路径 */
	saveTypeFolderPath: string;
	/** 存放生成的 api 文件的文件夹路径 */
	saveApiListFolderPath: string;
	/** swagger json 的 url */
	swaggerJsonUrl: string;
	/** 请求方法导入路径 */
	requestMethodsImportPath: string;
	/** 追加请求头 */
	headers?: Record<string, string>;
	/** 格式化 */
	formatting?: {
		/** 缩进 */
		indentation: string;
		/** 换行符（行结束符） */
		lineEnding: string;
	};
	/** 生成接口默认返回数据层级 */
	dataLevel: TDatalevel;
	/** 枚举数据保存路径 */
	saveEnumFolderPath: string;
	/** enum 导入路径 */
	importEnumPath: string;
	/** 包含的接口 */
	includeInterface?: IncludeOrExcludeInterface[];
	/** 排除的接口 */
	excludeInterface?: IncludeOrExcludeInterface[];
	/** 公共前缀 */
	publicPrefix?: string;
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
};

export type MapType = Map<string, ContentBody>;
