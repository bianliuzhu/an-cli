/**
 * fetch 版 dio 实例：基于 Web 原生 fetch，无外部依赖。
 * 与 axios 版保持相同的对外形态：`dio.request(config)` 与 `dio.interceptors.request|response`。
 */

// 环境变量参考（Vite）：
// const { VITE_API_URL, VITE_API_PROXY, PROD } = import.meta.env;
// export const BASE_URL = PROD ? VITE_API_URL : VITE_API_PROXY;
export const BASE_URL = '';

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

const DEFAULT_TIMEOUT = 600000; // 10 分钟

function buildURL(base: string, url: string, query?: unknown): string {
	const full = /^https?:\/\//i.test(url) ? url : `${base}${url}`;
	if (!query || typeof query !== 'object') return full;
	const usp = new URLSearchParams();
	Object.entries(query as Record<string, unknown>).forEach(([k, v]) => {
		if (v === undefined || v === null) return;
		if (Array.isArray(v)) v.forEach((item) => usp.append(k, String(item)));
		else usp.append(k, String(v));
	});
	const qs = usp.toString();
	if (!qs) return full;
	return full.includes('?') ? `${full}&${qs}` : `${full}?${qs}`;
}

function normalizeHeaders(h?: Record<string, string>): Record<string, string> {
	return { 'Content-Type': 'application/json', ...(h ?? {}) };
}

async function coreRequest<T = unknown>(config: DioRequestConfig & { query?: unknown; body?: unknown }): Promise<DioResponse<T>> {
	const { url = '', method = 'GET', query, body, headers, timeout = DEFAULT_TIMEOUT, signal, responseType = 'json' } = config;
	const finalHeaders = normalizeHeaders(headers);

	const controller = new AbortController();
	const timerId = setTimeout(() => controller.abort(), timeout);
	// 外部传入的 signal 优先，被 abort 时也要中断 fetch
	if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });

	const init: RequestInit = {
		method: String(method).toUpperCase(),
		headers: finalHeaders,
		signal: controller.signal,
	};

	const upperMethod = init.method as string;
	if (body !== undefined && upperMethod !== 'GET' && upperMethod !== 'HEAD') {
		init.body = typeof body === 'string' || body instanceof FormData || body instanceof Blob ? (body as BodyInit) : JSON.stringify(body);
	}

	let response: Response;
	try {
		response = await fetch(buildURL(BASE_URL, url, query), init);
	} finally {
		clearTimeout(timerId);
	}

	let data: unknown;
	if (responseType === 'text') data = await response.text();
	else if (responseType === 'blob') data = await response.blob();
	else if (responseType === 'arrayBuffer') data = await response.arrayBuffer();
	else {
		const text = await response.text();
		try {
			data = text ? JSON.parse(text) : null;
		} catch {
			data = text;
		}
	}

	const respHeaders: Record<string, string> = {};
	response.headers.forEach((v, k) => (respHeaders[k] = v));

	const dioResponse: DioResponse<T> = {
		data: data as T,
		status: response.status,
		statusText: response.statusText,
		headers: respHeaders,
	};

	if (!response.ok) {
		const err: Error & { response?: DioResponse<T>; config?: DioRequestConfig } = new Error(`Request failed with status ${response.status}`);
		err.response = dioResponse;
		err.config = config;
		throw err;
	}
	return dioResponse;
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
		const respData = (data ?? {}) as { message?: string; data?: unknown };
		let errorMsg = respData.message ?? '请求失败，请稍后重试';
		const payload = respData.data;
		if (typeof payload === 'string') errorMsg = payload;
		else if (payload && typeof payload === 'object' && 'errors' in payload) {
			const errors = (payload as ErrorPayload).errors;
			if (Array.isArray(errors)) {
				const collected = errors.map((it) => it?.message).filter((m): m is string => Boolean(m));
				if (collected.length) errorMsg = collected.join('；');
			}
		}

		switch (status) {
			case 400:
				console.error(errorMsg);
				break;
			case 401:
				console.error('登录过期，请重新登录');
				if (typeof window !== 'undefined' && window.location.pathname !== '/login') window.location.href = '/login';
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
			case 502:
				console.error('网关或代理服务器收到无效响应');
				break;
			case 503:
				console.error('服务器暂时无法处理请求');
				break;
			default:
				console.error(errorMsg);
		}
		return Promise.reject(error);
	},
);
