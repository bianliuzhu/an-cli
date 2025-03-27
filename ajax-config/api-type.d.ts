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
	datalevel?: TDatalevel;
	[key: string]: any;
}

interface IRequestFnParams<P = any> extends IRequestFnRestParams<P> {
	query?: any;
	body?: any;
}
