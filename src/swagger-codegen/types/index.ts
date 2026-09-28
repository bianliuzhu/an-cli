import type { ConfigType, IConfigSwaggerServer, IIncludeInterface, TDatalevel } from '../../../config';
import type { ContentType } from '../shared/http';
import type { OpenAPIV3 } from 'openapi-types';

// ---- 配置相关类型统一从 config.d.ts 导出，避免重复维护 ----
export type { TDatalevel, LogLevel, RequestTemplate, IResponseModelTransform, IIncludeInterface, IConfigSwaggerServer, ConfigType } from '../../../config';
export type { ContentType } from '../shared/http';

export interface CodegenConfig extends ConfigType {
	__segment?: string;
	__namespacePrefix?: string;
}

export type NormalizedSwaggerServer = IConfigSwaggerServer &
	Required<
		Pick<
			IConfigSwaggerServer,
			| 'publicPrefix'
			| 'apiListFileName'
			| 'headers'
			| 'dataLevel'
			| 'parameterSeparator'
			| 'includeInterface'
			| 'excludeInterface'
			| 'modulePrefix'
			| 'namespaceIsolation'
			| 'enumIsolation'
		>
	>;

export interface ServiceSelection {
	servers: NormalizedSwaggerServer[];
	selectedIndices: number[];
	segments: string[];
	isolateBySegment: boolean;
}

export interface ExecResult {
	stdout: string;
	stderr: string;
}

export interface PrettierCommand {
	command: string;
	args: string[];
}

export interface FormatTarget {
	path: string;
	pattern?: string;
}

export interface WriteIndexOptions {
	appendMode?: boolean;
}

export type InterfaceOutputMode = 'miss' | 'gen';

export type GeneratedInterface = Pick<IIncludeInterface, 'path' | 'method'>;

export interface GenerationSummary {
	serverUrl: string;
	list: GeneratedInterface[];
}

export type ComponentSchemas = OpenAPIV3.ComponentsObject['schemas'];
export type ComponentParameters = OpenAPIV3.ComponentsObject['parameters'];

export type ArraySchemaObject = OpenAPIV3.ArraySchemaObject;
export type NonArraySchemaObject = OpenAPIV3.NonArraySchemaObject;
export type PathsObject = OpenAPIV3.PathsObject;

export type PathItemObject = OpenAPIV3.PathItemObject;
export type OperationObject = OpenAPIV3.OperationObject;

export type SchemaObject = OpenAPIV3.SchemaObject;
export type ReferenceObject = OpenAPIV3.ReferenceObject;
export type ParameterObject = OpenAPIV3.ParameterObject;
export type RequestBodyObject = OpenAPIV3.RequestBodyObject;
export type Schema = ReferenceObject | SchemaObject;
export type ResponseObject = OpenAPIV3.ResponseObject;
export type ResponsesObject = OpenAPIV3.ResponsesObject;
export type SchemaTypeExpression = string | string[];

export interface SchemaRenderResult {
	headerRef: string;
	renderStr: string;
	comment?: string;
	typeName?: string;
}

export interface ParseError {
	type: 'SCHEMA' | 'PATH' | 'REFERENCE' | 'FILE_WRITE' | 'RESPONSE' | 'PARAMETERS' | 'REQUEST_BODY' | 'API';
	message: string;
	/** API 路径，如 /api/goods/listGoodsSkuWithBenefits */
	path?: string;
	/** HTTP 方法，如 GET、POST */
	method?: string;
	details?: unknown;
}

export interface PathParseConfig extends CodegenConfig {
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

export interface EndpointDefinition {
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
	description: string | undefined;
	apiName: string;
	typeName: string;
	deprecated: boolean;
	contentType: ContentType;
	/** 接口级别的 dataLevel 配置，优先级最高 */
	dataLevel?: TDatalevel;
}

export type EndpointDefinitionMap = Map<string, EndpointDefinition>;

// 渲染条目类型，用于组件和枚举的文件生成
export interface RenderEntry {
	fileName: string;
	content: string;
}
