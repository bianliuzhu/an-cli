import type { AxiosRequestConfig, AxiosResponse } from 'axios';

import { dio as axios } from './config';

// 将这里替换为自己的错误提示
import { messageTip } from './errror-message';

type TDatalevel = 'data' | 'serve' | 'axios';
export type RServe<T> = Promise<BaseResponse<T>>;
export type RAxios<T> = Promise<AxiosResponse<BaseResponse<T>>>;
export type BaseResponse<T> = {
	code: number;
	msg: string;
	data: T;
};

function POST<R = unknown, P = unknown>(url: string, data?: P, datalevel?: 'serve', config?: AxiosRequestConfig<P>): RServe<R>;
function POST<R = unknown, P = unknown>(url: string, data?: P, datalevel?: 'data', config?: AxiosRequestConfig<P>): Promise<R>;
function POST<R = unknown, P = unknown>(url: string, data?: P, datalevel?: 'axios', config?: AxiosRequestConfig<P>): RAxios<R>;
function POST<R = unknown, P = unknown>(url: string, data?: P, datalevel: TDatalevel = 'serve', config?: AxiosRequestConfig<P>) {
	return axios.post<P, AxiosResponse<BaseResponse<R>>>(url, data, config).then((res) => {
		messageTip(res);
		switch (datalevel) {
			case 'data':
				return res.data.data;
			case 'serve':
				return res.data;
			case 'axios':
				return res;
		}
	});
}

function GET<R = unknown, P = unknown>(url: string, params?: P, datalevel?: 'serve', config?: AxiosRequestConfig<P>): RServe<R>;
function GET<R = unknown, P = unknown>(url: string, params?: P, datalevel?: 'data', config?: AxiosRequestConfig<P>): Promise<R>;
function GET<R = unknown, P = unknown>(url: string, params?: P, datalevel?: 'axios', config?: AxiosRequestConfig<P>): RAxios<R>;
function GET<R = unknown, P = unknown>(url: string, params?: P, datalevel: TDatalevel = 'serve', config?: AxiosRequestConfig<P>) {
	return axios.get<P, AxiosResponse<BaseResponse<R>>>(url, { params, ...config }).then((res) => {
		messageTip(res);
		switch (datalevel) {
			case 'data':
				return res.data.data;
			case 'serve':
				return res.data;
			case 'axios':
				return res;
		}
	});
}

function DELETE<R = unknown, P = unknown>(url: string, params?: P, datalevel?: 'serve', config?: AxiosRequestConfig<P>): RServe<R>;
function DELETE<R = unknown, P = unknown>(url: string, params?: P, datalevel?: 'data', config?: AxiosRequestConfig<P>): Promise<R>;
function DELETE<R = unknown, P = unknown>(url: string, params?: P, datalevel?: 'axios', config?: AxiosRequestConfig<P>): RAxios<R>;
function DELETE<R = unknown, P = unknown>(url: string, params?: P, datalevel: TDatalevel = 'serve', config?: AxiosRequestConfig<P>) {
	return axios.delete<P, AxiosResponse<BaseResponse<R>>>(url, { params, ...config }).then((res) => {
		messageTip(res);
		switch (datalevel) {
			case 'data':
				return res.data.data;
			case 'serve':
				return res.data;
			case 'axios':
				return res;
		}
	});
}

function PATCH<R = unknown, P = unknown>(url: string, params?: P, datalevel?: 'serve', config?: AxiosRequestConfig<P>): RServe<R>;
function PATCH<R = unknown, P = unknown>(url: string, params?: P, datalevel?: 'data', config?: AxiosRequestConfig<P>): Promise<R>;
function PATCH<R = unknown, P = unknown>(url: string, params?: P, datalevel?: 'axios', config?: AxiosRequestConfig<P>): RAxios<R>;
function PATCH<R = unknown, P = unknown>(url: string, params?: P, datalevel: TDatalevel = 'serve', config?: AxiosRequestConfig<P>) {
	return axios.patch<P, AxiosResponse<BaseResponse<R>>>(url, params, config).then((res) => {
		messageTip(res);
		switch (datalevel) {
			case 'data':
				return res.data.data;
			case 'serve':
				return res.data;
			case 'axios':
				return res;
		}
	});
}

function PUT<R = unknown, P = unknown>(url: string, params?: P, datalevel?: 'serve', config?: AxiosRequestConfig<P>): RServe<R>;
function PUT<R = unknown, P = unknown>(url: string, params?: P, datalevel?: 'data', config?: AxiosRequestConfig<P>): Promise<R>;
function PUT<R = unknown, P = unknown>(url: string, params?: P, datalevel?: 'axios', config?: AxiosRequestConfig<P>): RAxios<R>;
function PUT<R = unknown, P = unknown>(url: string, params?: P, datalevel: TDatalevel = 'serve', config?: AxiosRequestConfig<P>) {
	return axios.put<P, AxiosResponse<BaseResponse<R>>>(url, params, config).then((res) => {
		messageTip(res);
		switch (datalevel) {
			case 'data':
				return res.data.data;
			case 'serve':
				return res.data;
			case 'axios':
				return res;
		}
	});
}

export { DELETE, GET, PATCH, POST, PUT };
