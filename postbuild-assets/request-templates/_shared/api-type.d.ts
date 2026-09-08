/**
 * datalevel 说明：
 * - 'data'  返回业务数据本体（ResponseModel.data）
 * - 'serve' 返回完整业务响应体 ResponseModel<T>
 * - 'axios' 返回底层适配器的原始响应对象 DioResponse<ResponseModel<T>>
 *   （命名沿用历史值以保持代码生成器一致，语义为"最底层原始响应"）
 */
type TDatalevel = 'data' | 'serve' | 'axios';

type RServe<T> = Promise<ResponseModel<T>>;
type RAxios<T> = Promise<DioResponse<ResponseModel<T>>>;

interface ResponseModel<T> {
	code: number;
	message: string;
	data: T;
	success: boolean;
}

/** 底层适配器统一响应结构（axios/fetch/wx/uni/taro 的共同抽象） */
interface DioResponse<T = unknown> {
	data: T;
	status: number;
	statusText?: string;
	headers?: Record<string, string>;
}

/** 底层适配器统一请求配置（axios/fetch/wx/uni/taro 的共同抽象） */
interface DioRequestConfig {
	url?: string;
	method?: 'GET' | 'DELETE' | 'PUT' | 'POST' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'SEARCH' | Lowercase<'GET' | 'DELETE' | 'PUT' | 'POST' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'SEARCH'>;
	headers?: Record<string, string>;
	timeout?: number;
	signal?: AbortSignal;
	responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer';
	[key: string]: unknown;
}

type IRequestFnParams = DioRequestConfig & {
	query?: unknown;
	body?: unknown;
};

interface IRequestFnRestParams {
	config?: DioRequestConfig;
	[key: string]: unknown;
}

interface ErrorPayload {
	errors?: { message?: string }[];
	[key: string]: unknown;
}
