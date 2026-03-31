export type TDatalevel = 'data' | 'serve' | 'axios';

/** 终端日志输出级别 */
export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'verbose';

/** 响应模型转换配置 */
export interface IResponseModelTransform {
	/** 转换类型：unwrap-剔除响应模型，wrap-添加响应模型，replace-替换响应模型 */
	type: 'unwrap' | 'wrap' | 'replace';
	/** 当 type 为 unwrap 时，指定要提取的字段名，默认为 'data' */
	dataField?: string;
	/** 当 type 为 wrap 或 replace 时，指定响应模型的类型定义 */
	wrapperType?: string;
	/** 响应模型中的字段映射关系，key为字段名，value为字段类型 */
	wrapperFields?: Record<string, string>;
	/** 响应模型名称匹配正则，只有匹配的类型才会被转换，不匹配则跳过。例如 "^ResultMessage" 只转换 ResultMessage 开头的类型 */
	modelPattern?: string;
}

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
	/** 包含的模块（tag）列表，与 excludeTags 互斥，优先级低于 includeInterface/excludeInterface（在单接口过滤之后应用） */
	includeTags?: string[];
	/** 排除的模块（tag）列表，与 includeTags 互斥，优先级低于 includeInterface/excludeInterface（在单接口过滤之后应用） */
	excludeTags?: string[];
	/** path 前缀 */
	modulePrefix?: string;
	/** 响应模型转换配置 */
	responseModelTransform?: IResponseModelTransform;
	/** 请求超时时间（毫秒），默认 60000 */
	timeout?: number;
}

export interface ConfigType {
	/** 存放生成的类型文件的文件夹路径 */
	saveTypeFolderPath: string;
	/** 存放生成的 api 文件的文件夹路径 */
	saveApiListFolderPath: string;
	/** 兼容旧配置的 swagger json 地址（已迁移到 swaggerConfig 中） */
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
	/** 包含的模块（tag）列表（服务级配置注入） */
	includeTags?: string[];
	/** 排除的模块（tag）列表（服务级配置注入） */
	excludeTags?: string[];
	/** path 前缀（服务级配置注入） */
	modulePrefix?: string;
	/** 响应模型转换配置（服务级配置注入） */
	responseModelTransform?: IResponseModelTransform;
	/** 请求超时时间（毫秒），默认 60000 */
	timeout?: number;
	/** 格式化配置 */
	formatting?: {
		/** 缩进字符 */
		indentation: string;
		/** 换行符（行结束符） */
		lineEnding: string;
	};
	/** 终端日志输出级别，默认 'info'。silent-无输出, error-仅错误, warn-警告+错误, info-常规信息, verbose-详细输出 */
	logLevel?: LogLevel;
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

/** 用户配置类型（所有字段均为可选，未指定的使用默认值） */
export type UserConfig = Partial<ConfigType>;

/**
 * 定义 an-cli 配置（提供类型提示支持）
 */
export declare function defineConfig(config: UserConfig): UserConfig;
