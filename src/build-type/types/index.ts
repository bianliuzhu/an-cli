import { OpenAPIV3 } from 'openapi-types';

export interface ConfigType {
	saveTypeFolderPath: string;
	apiListFilePath: string;
	swaggerJsonUrl: string;
	indent: string;
	requestMethodsImportPath: string;
	/** 追加请求头 */
	headers?: Record<string, string>;
}

export type ComponentsSchemas = OpenAPIV3.ComponentsObject['schemas'];
export type ReferenceObject = OpenAPIV3.ReferenceObject;
export type SchemaObject = OpenAPIV3.SchemaObject;
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
