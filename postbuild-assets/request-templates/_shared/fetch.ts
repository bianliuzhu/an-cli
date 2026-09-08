/**
 * 只需要导出 GET DELETE PUT POST PATCH OPTIONS HEAD SEARCH 这些请求方法即可，
 * 至于方法内使用 axios / fetch / wx / uni / taro 由 dio.ts 中的 dio 实例决定。
 * 请注意方法的参数和返回值类型，请参考 dio.ts 中 dio 的类型定义；实现函数重载。
 */

import { dio } from './dio';
import { messageTip } from './error-message';

function GET<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'serve'): RServe<R>;
function GET<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'data'): Promise<R>;
function GET<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'axios'): RAxios<R>;
function GET<R = unknown>(url: string, params: IRequestFnParams, datalevel: TDatalevel = 'serve') {
	return dio
		.request<ResponseModel<R>>({
			...params,
			url,
			query: params.query,
			method: 'GET',
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
		.request<ResponseModel<R>>({
			...params,
			url,
			query: params.query,
			method: 'DELETE',
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
		.request<ResponseModel<R>>({
			...rest,
			url,
			query,
			body,
			method: 'PUT',
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
		.request<ResponseModel<R>>({
			...rest,
			url,
			query,
			body,
			method: 'POST',
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
		.request<ResponseModel<R>>({
			...rest,
			url,
			query,
			body,
			method: 'PATCH',
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
		.request<ResponseModel<R>>({
			...rest,
			url,
			query,
			body,
			method: 'OPTIONS',
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
		.request<ResponseModel<R>>({
			...rest,
			url,
			query,
			body,
			method: 'HEAD',
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
		.request<ResponseModel<R>>({
			...rest,
			url,
			query,
			body,
			method: 'SEARCH',
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

export { DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT, SEARCH };
