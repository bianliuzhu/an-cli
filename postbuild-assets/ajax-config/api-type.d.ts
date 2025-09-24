type TDatalevel = 'data' | 'serve' | 'axios';
type RServe<T> = Promise<ResponseModel<T>>;

type RAxios<T> = Promise<import('axios').AxiosResponse<ResponseModel<T>>>;

type ResponseModel<T> = {
	code: number;
	msg: string;
	data: T;
};

interface IRequestFnRestParams<P = any> {
	config?: import('axios').AxiosRequestConfig<P>;
	[key: string]: any;
}

type IRequestFnParams<P = any> = import('axios').AxiosRequestConfig<P> & {
	query?: any;
	body?: any;
};
