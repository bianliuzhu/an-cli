type TDatalevel = 'data' | 'serve' | 'axios';
type RServe<T> = Promise<ResponseModel<T>>;

type RAxios<T> = Promise<import('axios').AxiosResponse<ResponseModel<T>>>;

interface ResponseModel<T> {
	code: number;
	message: string;
	data: T;
	success: boolean;
}

interface IRequestFnRestParams<P = unknown> {
	config?: import('axios').AxiosRequestConfig<P>;
	[key: string]: unknown;
}

type IRequestFnParams<P = unknown> = import('axios').AxiosRequestConfig<P> & {
	query?: unknown;
	body?: unknown;
};

// 定义错误响应的 payload 类型
interface ErrorPayload {
	errors?: { message?: string }[];
	[key: string]: unknown;
}
