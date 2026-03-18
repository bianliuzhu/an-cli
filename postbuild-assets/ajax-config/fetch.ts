/**
 * 只需要 导出 GET DELETE PUT POST PATCH OPTIONS HEAD SEARCH 这些请求方法即可，至于 方法内使用 axios 还是 fetch ，由 dio.ts 中的 dio 实例决定的
 * 请注意，方法的参数和返回值类型，请参考 dio.ts 中的 dio 实例的类型定义
 * 请注意实现函数重载，参数和返回值类型需要匹配
 */

import type { AxiosResponse } from 'axios';

import { dio } from './dio';
import { messageTip } from './error-message';

function GET<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'serve'): RServe<R>;
function GET<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'data'): Promise<R>;
function GET<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'axios'): RAxios<R>;
function GET<R = unknown>(url: string, params: IRequestFnParams, datalevel: TDatalevel = 'serve') {
	return dio
		.request<unknown, AxiosResponse<ResponseModel<R>>>({
			...params,
			url,
			params: params.query,
			method: 'get',
		})
		.then((res) => {
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

function DELETE<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'serve'): RServe<R>;
function DELETE<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'data'): Promise<R>;
function DELETE<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'axios'): RAxios<R>;
function DELETE<R = unknown>(url: string, params: IRequestFnParams, datalevel: TDatalevel = 'serve') {
	return dio
		.request<unknown, AxiosResponse<ResponseModel<R>>>({
			...params,
			url,
			params: params.query,
			method: 'delete',
		})
		.then((res) => {
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

function PUT<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'serve'): RServe<R>;
function PUT<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'data'): Promise<R>;
function PUT<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'axios'): RAxios<R>;
function PUT<R = unknown>(url: string, { query, body, ...rest }: IRequestFnParams, datalevel: TDatalevel = 'serve') {
	return dio
		.request<unknown, AxiosResponse<ResponseModel<R>>>({
			...rest,
			url,
			params: query,
			data: body,
			method: 'put',
		})
		.then((res) => {
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

function POST<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'serve'): RServe<R>;
function POST<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'data'): Promise<R>;
function POST<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'axios'): RAxios<R>;
function POST<R = unknown>(url: string, { query, body, ...rest }: IRequestFnParams, datalevel: TDatalevel = 'serve') {
	return dio
		.request<unknown, AxiosResponse<ResponseModel<R>>>({
			...rest,
			url,
			params: query,
			data: body,
			method: 'post',
		})
		.then((res) => {
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

function PATCH<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'serve'): RServe<R>;
function PATCH<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'data'): Promise<R>;
function PATCH<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'axios'): RAxios<R>;
function PATCH<R = unknown>(url: string, { query, body, ...rest }: IRequestFnParams, datalevel: TDatalevel = 'serve') {
	return dio
		.request<unknown, AxiosResponse<ResponseModel<R>>>({
			...rest,
			url,
			params: query,
			data: body,
			method: 'patch',
		})
		.then((res) => {
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

function OPTIONS<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'serve'): RServe<R>;
function OPTIONS<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'data'): Promise<R>;
function OPTIONS<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'axios'): RAxios<R>;
function OPTIONS<R = unknown>(url: string, { query, body, ...rest }: IRequestFnParams, datalevel: TDatalevel = 'serve') {
	return dio
		.request<unknown, AxiosResponse<ResponseModel<R>>>({
			...rest,
			url,
			params: query,
			data: body,
			method: 'options',
		})
		.then((res) => {
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

function HEAD<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'serve'): RServe<R>;
function HEAD<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'data'): Promise<R>;
function HEAD<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'axios'): RAxios<R>;
function HEAD<R = unknown>(url: string, { query, body, ...rest }: IRequestFnParams, datalevel: TDatalevel = 'serve') {
	return dio
		.request<unknown, AxiosResponse<ResponseModel<R>>>({
			...rest,
			url,
			params: query,
			data: body,
			method: 'head',
		})
		.then((res) => {
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

function SEARCH<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'serve'): RServe<R>;
function SEARCH<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'data'): Promise<R>;
function SEARCH<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'axios'): RAxios<R>;
function SEARCH<R = unknown>(url: string, { query, body, ...rest }: IRequestFnParams, datalevel: TDatalevel = 'serve') {
	return dio
		.request<unknown, AxiosResponse<ResponseModel<R>>>({
			...rest,
			url,
			params: query,
			data: body,
			method: 'search',
		})
		.then((res) => {
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

export { DELETE, GET, PATCH, POST, PUT, OPTIONS, HEAD, SEARCH };
