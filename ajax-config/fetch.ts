import type { AxiosResponse } from 'axios';

import { dio as axios } from './config';
import { messageTip } from './error-message';

function GET<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'serve'): RServe<R>;
function GET<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'data'): Promise<R>;
function GET<R = unknown>(url: string, params: IRequestFnParams, datalevel?: 'axios'): RAxios<R>;
function GET<R = unknown>(url: string, params: IRequestFnParams, datalevel: TDatalevel = 'serve') {
	return axios
		.request<any, AxiosResponse<ResponseModel<R>>>({
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
	return axios
		.request<any, AxiosResponse<ResponseModel<R>>>({
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
	return axios
		.request<any, AxiosResponse<ResponseModel<R>>>({
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
	return axios
		.request<any, AxiosResponse<ResponseModel<R>>>({
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
	return axios
		.request<any, AxiosResponse<ResponseModel<R>>>({
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
export { DELETE, GET, PATCH, POST, PUT };
