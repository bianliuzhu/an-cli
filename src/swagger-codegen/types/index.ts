import type { ConfigType, TDatalevel } from '../../../config';
import type { OpenAPIV3 } from 'openapi-types';

// ---- 配置相关类型统一从 config.d.ts 导出，避免重复维护 ----
export type { TDatalevel, LogLevel, IResponseModelTransform, IIncludeInterface, IConfigSwaggerServer, ConfigType } from '../../../config';

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
export interface ParseError {
	type: 'SCHEMA' | 'PATH' | 'REFERENCE' | 'FILE_WRITE' | 'RESPONSE' | 'PARAMETERS' | 'REQUEST_BODY' | 'API';
	message: string;
	/** API 路径，如 /api/goods/listGoodsSkuWithBenefits */
	path?: string;
	/** HTTP 方法，如 GET、POST */
	method?: string;
	details?: unknown;
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

export interface ContentBody {
	payload: {
		path: string[];
		_path?: Record<string, string>;
		query: string[];
		_query?: Record<string, string>;
		header: string[];
		_header?: Record<string, string>;
		body: string[];
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
}

export type MapType = Map<string, ContentBody>;

// 渲染条目类型，用于组件和枚举的文件生成
export interface RenderEntry {
	fileName: string;
	content: string;
}
