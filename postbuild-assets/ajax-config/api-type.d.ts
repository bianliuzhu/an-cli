type ResponseModel<T> = {
	code: number;
	message: string;
	data: T;
	success: boolean;
};

type TDatalevel = 'data' | 'serve' | 'axios';
type RServe<T> = Promise<ResponseModel<T>>;
type RAxios<T> = Promise<import('axios').AxiosResponse<ResponseModel<T>>>;

interface IRequestFnRestParams<P = unknown> {
	config?: import('axios').AxiosRequestConfig<P>;
	[key: string]: unknown;
}

type IRequestFnParams<P = unknown> = import('axios').AxiosRequestConfig<P> & {
	query?: unknown;
	body?: unknown;
};
