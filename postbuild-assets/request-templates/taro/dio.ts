/**
 * Taro 3+ 版 dio 实例：基于 Taro.request（跨端 H5/小程序/RN）。
 * 与 axios 版保持相同的对外形态：`dio.request(config)` 与 `dio.interceptors.request|response`。
 */

// Taro 环境变量：process.env.TARO_APP_XXX
export const BASE_URL = '';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- 用户项目需安装 @tarojs/taro
import Taro from '@tarojs/taro';

type Interceptor<V> = {
	onFulfilled?: (value: V) => V | Promise<V>;
	onRejected?: (error: unknown) => unknown;
};

class InterceptorManager<V> {
	private handlers: Interceptor<V>[] = [];
	use(onFulfilled?: (value: V) => V | Promise<V>, onRejected?: (error: unknown) => unknown): number {
		this.handlers.push({ onFulfilled, onRejected });
		return this.handlers.length - 1;
	}
	eject(id: number): void {
		if (this.handlers[id]) this.handlers[id] = {};
	}
	forEach(cb: (h: Interceptor<V>) => void): void {
		this.handlers.forEach((h) => h && cb(h));
	}
}

const DEFAULT_TIMEOUT = 600000;

function buildURL(base: string, url: string, query?: unknown): string {
	const full = /^https?:\/\//i.test(url) ? url : `${base}${url}`;
	if (!query || typeof query !== 'object') return full;
	const parts: string[] = [];
	Object.entries(query as Record<string, unknown>).forEach(([k, v]) => {
		if (v === undefined || v === null) return;
		const enc = encodeURIComponent(k);
		if (Array.isArray(v)) v.forEach((item) => parts.push(`${enc}=${encodeURIComponent(String(item))}`));
		else parts.push(`${enc}=${encodeURIComponent(String(v))}`);
	});
	if (!parts.length) return full;
	return full.includes('?') ? `${full}&${parts.join('&')}` : `${full}?${parts.join('&')}`;
}

async function coreRequest<T = unknown>(config: DioRequestConfig & { query?: unknown; body?: unknown }): Promise<DioResponse<T>> {
	const { url = '', method = 'GET', query, body, headers, timeout = DEFAULT_TIMEOUT, responseType } = config;
	const finalHeaders = { 'Content-Type': 'application/json', ...(headers ?? {}) };
	const res = (await Taro.request({
		url: buildURL(BASE_URL, url, query),
		method: String(method).toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD',
		data: body,
		header: finalHeaders,
		timeout,
		responseType: responseType === 'arrayBuffer' ? 'arraybuffer' : undefined,
		dataType: responseType && responseType !== 'json' ? '其他' : 'json',
	})) as { data: unknown; statusCode: number; header: Record<string, string> };

	const dioResponse: DioResponse<T> = {
		data: res.data as T,
		status: res.statusCode,
		headers: res.header,
	};
	if (res.statusCode >= 200 && res.statusCode < 300) return dioResponse;

	const err: Error & { response?: DioResponse<T>; config?: DioRequestConfig } = new Error(`Request failed with status ${res.statusCode}`);
	err.response = dioResponse;
	err.config = config;
	throw err;
}

const requestInterceptor = new InterceptorManager<DioRequestConfig & { query?: unknown; body?: unknown }>();
const responseInterceptor = new InterceptorManager<DioResponse<unknown>>();

async function runRequest<T>(config: DioRequestConfig & { query?: unknown; body?: unknown }): Promise<DioResponse<T>> {
	let current: DioRequestConfig & { query?: unknown; body?: unknown } = config;
	const reqHandlers: Interceptor<typeof current>[] = [];
	requestInterceptor.forEach((h) => reqHandlers.push(h));
	for (const h of reqHandlers) {
		try {
			if (h.onFulfilled) current = await h.onFulfilled(current);
		} catch (e) {
			if (h.onRejected) return Promise.reject(h.onRejected(e)) as never;
			throw e;
		}
	}

	let value: DioResponse<T>;
	try {
		value = await coreRequest<T>(current);
	} catch (e) {
		let error: unknown = e;
		const handlers: Interceptor<DioResponse<unknown>>[] = [];
		responseInterceptor.forEach((h) => handlers.push(h));
		for (const h of handlers) {
			if (h.onRejected) {
				try {
					const recovered = await h.onRejected(error);
					return recovered as DioResponse<T>;
				} catch (next) {
					error = next;
				}
			}
		}
		throw error;
	}

	let currentRes: DioResponse<unknown> = value;
	const resHandlers: Interceptor<DioResponse<unknown>>[] = [];
	responseInterceptor.forEach((h) => resHandlers.push(h));
	for (const h of resHandlers) {
		try {
			if (h.onFulfilled) currentRes = await h.onFulfilled(currentRes);
		} catch (e) {
			if (h.onRejected) return Promise.reject(h.onRejected(e)) as never;
			throw e;
		}
	}
	return currentRes as DioResponse<T>;
}

export const dio = {
	interceptors: {
		request: requestInterceptor,
		response: responseInterceptor,
	},
	request: <T = unknown>(config: DioRequestConfig & { query?: unknown; body?: unknown }) => runRequest<T>(config),
};

/**
 * 请求拦截
 */
dio.interceptors.request.use(
	(config) => {
		config.headers = { ...(config.headers ?? {}), Authorization: `Bearer 【auth -> replace】` };
		return config;
	},
	(error) => {
		console.error('request interceptors', error);
		return error;
	},
);

/**
 * 响应拦截 —— 成功（2xx）
 */
dio.interceptors.response.use(
	(response) => response,
	(rawError) => {
		const error = rawError as Error & { response?: DioResponse<{ message?: string; data?: unknown }> };
		if (!error.response) {
			console.error('网络异常，请检查网络连接');
			return Promise.reject(error);
		}
		const { status, data } = error.response;
		const respData = (data ?? {}) as { message?: string };
		const errorMsg = respData.message ?? '请求失败，请稍后重试';

		switch (status) {
			case 400:
				console.error(errorMsg);
				break;
			case 401:
				console.error('登录过期，请重新登录');
				Taro.reLaunch?.({ url: '/pages/login/index' });
				break;
			case 403:
				console.error('服务器拒绝请求');
				break;
			case 404:
				console.error('资源未找到');
				break;
			case 500:
				console.error('服务器内部错误');
				break;
			default:
				console.error(errorMsg);
		}
		return Promise.reject(error);
	},
);
