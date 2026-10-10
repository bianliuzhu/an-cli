export type TDatalevel = 'data' | 'serve' | 'axios';

/** 终端日志输出级别 */
export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'verbose';

/** 请求模板类型 —— 决定生成到项目 `<saveApiListFolderPath>/config/` 下的底层请求实现 */
export type RequestTemplate = 'axios' | 'fetch' | 'wx' | 'uniapp' | 'taro';

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

export type MockValue = string | number | boolean | null | MockValue[] | { [key: string]: MockValue };

export interface MockGenerationOptions {
	/** 数组默认元素数量，默认 1，取值 1-100 */
	arrayLength?: number;
	/** 类型递归最大深度，默认 8，取值 1-30 */
	maxDepth?: number;
	/** 覆盖响应根节点已有字段的模板值，例如 { code: 200, msg: 'OK' }；不会添加未声明字段 */
	responseDefaults?: Record<string, MockValue>;
}

export interface MockConfig extends MockGenerationOptions {
	/** mock-service-plugin 扫描的根目录，相对于项目根目录，默认 mocks */
	mockDir?: string;
}

export interface IConfigSwaggerServer {
	/** 服务名称，作为 `anl type --service <name>` 的匹配标识，建议在多服务场景下显式指定。
	 * 未指定时，会回退到 apiListFileName 去扩展名后的值作为标识。 */
	name?: string;
	/** swagger json 的 url */
	url: string;
	/** @deprecated 已移除，禁止使用；请改用 stripPathPrefix。为此字段配置前缀会产生类型错误，运行时不会生效。 */
	publicPrefix?: never;
	/** 从 OpenAPI 路径开头移除的前缀，按完整路径段匹配；同时影响生成的函数名、类型名、文件名和请求路径。未匹配时保留原路径。 */
	stripPathPrefix?: string;
	/** @deprecated 已移除，禁止使用；请改用 requestPathPrefix。为此字段配置前缀会产生类型错误，运行时不会生效。 */
	modulePrefix?: never;
	/** 添加到裁剪后的请求路径前的前缀，不影响生成名称；自动补齐开头斜杠并移除末尾斜杠，不去重路径段。 */
	requestPathPrefix?: string;
	/** 仅 anl mock 使用的额外路径前缀，如 '/api'。添加到已生成 API 的实际路径前，保留 requestPathPrefix，不修改 API 代码；自动处理首尾斜杠，不去重路径段，未配置、空字符串或 '/' 时不追加。 */
	mockPathPrefix?: string;
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
	/** 响应模型转换配置 */
	responseModelTransform?: IResponseModelTransform;
	/** 当前服务的 mock 生成选项，覆盖全局 mock 配置 */
	mock?: MockGenerationOptions;
	/** 请求超时时间（毫秒），默认 60000 */
	timeout?: number;
	/** 命名空间隔离策略（服务级配置）：
	 * - 'segment'（默认）：以服务 segment 派生 PascalCase 前缀（如 op → `Op_`），避免多服务同 path 的全局 namespace 合并污染。
	 * - 'none'：不加前缀（仅推荐单服务项目使用）。
	 */
	namespaceIsolation?: 'segment' | 'none';
	/** 枚举数据隔离策略（服务级配置，多服务时生效）：
	 * - 'segment'（默认）：将该服务的 enum 写入 `${saveEnumFolderPath}/<segment>/`，与 connectors / models 对称隔离，避免不同服务同名枚举互相覆盖。
	 * - 'none'：与其他服务共享 `${saveEnumFolderPath}` 顶层目录，存在同名时后写者覆盖前者（与历史行为一致）。
	 * 单服务模式下该选项无效，始终扁平写入顶层。
	 */
	enumIsolation?: 'segment' | 'none';
}

/**
 * CLI 配置。
 * 已移除的前缀字段：publicPrefix 改用 stripPathPrefix，modulePrefix 改用 requestPathPrefix，mockUrlPrefix 改用服务级 mockPathPrefix。
 * 旧前缀字段运行时不再读取，不提供兼容别名；publicPrefix 和 modulePrefix 仅保留 never 类型声明，用于类型报错和迁移提示。
 */
export interface ConfigType {
	/** 存放生成的类型文件的文件夹路径 */
	saveTypeFolderPath: string;
	/** 存放生成的 api 文件的文件夹路径 */
	saveApiListFolderPath: string;
	/** anl mock 生成选项 */
	mock?: MockConfig;
	/**
	 * 兼容旧配置的 Swagger JSON 地址。
	 * @deprecated 请改用 swaggerConfig.url；多服务时在 swaggerConfig 数组的每个服务中配置 url。
	 */
	swaggerJsonUrl?: string;
	/** swagger 服务器列表 */
	swaggerConfig: IConfigSwaggerServer[] | IConfigSwaggerServer;
	/**
	 * 兼容旧配置的 API 列表生成文件名，默认 index.ts。
	 * @deprecated 请改用 swaggerConfig.apiListFileName；多服务时为每个服务配置唯一文件名，单服务可省略。
	 */
	apiListFileName?: string;
	/** 请求方法导入路径 */
	requestMethodsImportPath: string;
	/** 请求模板类型（决定生成到 `<saveApiListFolderPath>/config/` 下的底层 `dio.ts` 实现），默认 `'axios'`。
	 *  - `axios` 基于 axios（浏览器/Node，需 `npm i axios`）
	 *  - `fetch` 基于原生 fetch（浏览器/现代 Node，无额外依赖）
	 *  - `wx`    基于 `wx.request`（微信小程序原生）
	 *  - `uniapp` 基于 `uni.request`（uni-app 跨端）
	 *  - `taro`   基于 `Taro.request`（Taro 3+ 跨端）
	 *  注意：切换模板时需手动删除 `<saveApiListFolderPath>/config/` 目录，CLI 才会重新写入对应模板文件。 */
	requestTemplate?: RequestTemplate;
	/**
	 * 兼容旧配置的全局请求头，服务级配置优先。
	 * @deprecated 请改用 swaggerConfig.headers；多服务时将公共请求头配置到各服务的 headers 中。
	 */
	headers?: Record<string, string>;
	/** @deprecated 已移除，禁止使用；请改用 stripPathPrefix，或服务级 swaggerConfig.stripPathPrefix。为此字段配置前缀会产生类型错误，运行时不会生效。 */
	publicPrefix?: never;
	/** 从 OpenAPI 路径开头移除的全局默认前缀，同时影响生成名称和请求路径；服务级配置优先，空字符串可清除全局默认值。 */
	stripPathPrefix?: string;
	/** @deprecated 已移除，禁止使用；请改用 requestPathPrefix，或服务级 swaggerConfig.requestPathPrefix。为此字段配置前缀会产生类型错误，运行时不会生效。 */
	modulePrefix?: never;
	/** 添加到裁剪后的请求路径前的全局默认前缀，不影响生成名称；服务级配置优先，空字符串可清除全局默认值。 */
	requestPathPrefix?: string;
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
	/** 响应模型转换配置（服务级配置注入） */
	responseModelTransform?: IResponseModelTransform;
	/** 请求超时时间（毫秒），默认 60000 */
	timeout?: number;
	/** 命名空间隔离策略（服务级配置注入），默认 'segment' */
	namespaceIsolation?: 'segment' | 'none';
	/** 枚举数据隔离策略（服务级配置注入），默认 'segment'。仅多服务时生效 */
	enumIsolation?: 'segment' | 'none';
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
