import type { AxiosResponse } from 'axios';

import { dio as axios } from './config';
import { messageTip } from './error-message';

type RequestParamsWithDataLevel<P, D extends TDatalevel = 'serve'> = Omit<IRequestFnParams<P>, 'datalevel'> & {
	datalevel?: D;
};

function GET<R = unknown, P = unknown>(url: string, params?: RequestParamsWithDataLevel<P, 'serve'>): RServe<R>;
function GET<R = unknown, P = unknown>(url: string, params?: RequestParamsWithDataLevel<P, 'data'>): Promise<R>;
function GET<R = unknown, P = unknown>(url: string, params?: RequestParamsWithDataLevel<P, 'axios'>): RAxios<R>;
function GET<R = unknown, P = unknown>(
	url: string,
	{ query = {}, config = {}, datalevel = 'serve' }: IRequestFnParams<P> = {},
): Promise<R> | RServe<R> | RAxios<R> {
	return axios.request<P, AxiosResponse<ResponseModel<R>>>({
		...config,
		url,
		params: query,
		method: 'get',
		transformResponse(res) {
			messageTip(res);
			switch (datalevel) {
				case 'data':
					return res.data.data;
				case 'serve':
					return res.data;
				case 'axios':
					return res;
			}
		},
	});
}

function DELETE<R = unknown, P = unknown>(url: string, params?: RequestParamsWithDataLevel<P, 'serve'>): RServe<R>;
function DELETE<R = unknown, P = unknown>(url: string, params?: RequestParamsWithDataLevel<P, 'data'>): Promise<R>;
function DELETE<R = unknown, P = unknown>(url: string, params?: RequestParamsWithDataLevel<P, 'axios'>): RAxios<R>;
function DELETE<R = unknown, P = unknown>(
	url: string,
	{ query = {}, config = {}, datalevel = 'serve' }: IRequestFnParams<P> = {},
): Promise<R> | RServe<R> | RAxios<R> {
	return axios.request<P, AxiosResponse<ResponseModel<R>>>({
		...config,
		url,
		params: query,
		method: 'delete',
		transformResponse(res) {
			messageTip(res);
			switch (datalevel) {
				case 'data':
					return res.data.data;
				case 'serve':
					return res.data;
				case 'axios':
					return res;
			}
		},
	});
}

function PUT<R = unknown, P = unknown>(url: string, params?: RequestParamsWithDataLevel<P, 'serve'>): RServe<R>;
function PUT<R = unknown, P = unknown>(url: string, params?: RequestParamsWithDataLevel<P, 'data'>): Promise<R>;
function PUT<R = unknown, P = unknown>(url: string, params?: RequestParamsWithDataLevel<P, 'axios'>): RAxios<R>;
function PUT<R = unknown, P = unknown>(
	url: string,
	{ query = {}, body = {}, config = {}, datalevel = 'serve' }: IRequestFnParams<P> = {},
): Promise<R> | RServe<R> | RAxios<R> {
	return axios.request<P, AxiosResponse<ResponseModel<R>>>({
		...config,
		url,
		params: query,
		data: body,
		method: 'put',
		transformResponse(res) {
			messageTip(res);
			switch (datalevel) {
				case 'data':
					return res.data.data;
				case 'serve':
					return res.data;
				case 'axios':
					return res;
			}
		},
	});
}

function POST<R = unknown, P = unknown>(url: string, params?: RequestParamsWithDataLevel<P, 'serve'>): RServe<R>;
function POST<R = unknown, P = unknown>(url: string, params?: RequestParamsWithDataLevel<P, 'data'>): Promise<R>;
function POST<R = unknown, P = unknown>(url: string, params?: RequestParamsWithDataLevel<P, 'axios'>): RAxios<R>;
function POST<R = unknown, P = unknown>(
	url: string,
	{ query = {}, body = {}, config = {}, datalevel = 'serve' }: IRequestFnParams<P> = {},
): Promise<R> | RServe<R> | RAxios<R> {
	return axios.request<P, AxiosResponse<ResponseModel<R>>>({
		...config,
		url,
		params: query,
		data: body,
		method: 'post',
		transformResponse(res) {
			messageTip(res);
			switch (datalevel) {
				case 'data':
					return res.data.data;
				case 'serve':
					return res.data;
				case 'axios':
					return res;
			}
		},
	});
}

function PATCH<R = unknown, P = unknown>(url: string, params?: RequestParamsWithDataLevel<P, 'serve'>): RServe<R>;
function PATCH<R = unknown, P = unknown>(url: string, params?: RequestParamsWithDataLevel<P, 'data'>): Promise<R>;
function PATCH<R = unknown, P = unknown>(url: string, params?: RequestParamsWithDataLevel<P, 'axios'>): RAxios<R>;
function PATCH<R = unknown, P = unknown>(
	url: string,
	{ query = {}, body = {}, config = {}, datalevel = 'serve' }: IRequestFnParams<P> = {},
): Promise<R> | RServe<R> | RAxios<R> {
	return axios.request<P, AxiosResponse<ResponseModel<R>>>({
		...config,
		url,
		params: query,
		data: body,
		method: 'patch',
		transformResponse(res) {
			messageTip(res);
			switch (datalevel) {
				case 'data':
					return res.data.data;
				case 'serve':
					return res.data;
				case 'axios':
					return res;
			}
		},
	});
}

export { DELETE, GET, PATCH, POST, PUT };
