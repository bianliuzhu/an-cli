import type { AxiosError, AxiosInstance } from 'axios'; // 默认 axios 可以替换成 fetch

import axios from 'axios'; // 默认 axios 可以替换成 fetch

import { message } from 'antd/message'; // 可以替换成项目中现有的提示组件

const { VITE_API_URL, VITE_API_PROXY, PROD } = import.meta.env; // import.meta.env 来自环境变量 可以是 process.env.NODE_ENV

// 基础URL
export const BASE_URL = PROD ? VITE_API_URL : VITE_API_PROXY;

export const dio: AxiosInstance = axios.create({
	// 设置baseUr地址,如果通过proxy跨域可直接填写base地址
	baseURL: BASE_URL,
	// 定义统一的请求头部
	headers: {
		'Content-Type': 'application/json',
	},
	// 1 分钟等于 60000 毫秒，超时设置为10分钟
	timeout: 600000,
});

/**
 * 请求拦截
 * @param config 请求配置
 * @returns 请求配置
 */
dio.interceptors.request.use(
	(config) => {
		config.headers['Authorization'] = `Bearer 【auth -> replace】`;
		return config;
	},
	(error) => {
		console.error('request interceptors', error);
	},
);

/**
 * 响应拦截
 * @param response 响应数据
 * @returns 响应数据
 */
// 响应拦截 —— 成功（2xx）
dio.interceptors.response.use(
	(response) => response,
	(error: AxiosError<{ message?: string; data?: unknown }>) => {
		// 网络错误或请求取消等，无 response
		if (!error.response) {
			message.error('网络异常，请检查网络连接');
			return Promise.reject(error);
		}

		const { status, data } = error.response;

		switch (status) {
			case 400: {
				const respData = data ?? {};
				const payload = (respData as { data?: unknown }).data;
				let errorMsg = (respData as { message?: string }).message ?? '请求参数错误';

				if (typeof payload === 'string') {
					errorMsg = payload;
				} else if (payload && typeof payload === 'object' && 'errors' in payload) {
					const errors = (payload as { errors?: { message?: string }[] }).errors;
					if (Array.isArray(errors)) {
						const collected = errors.map((item) => item?.message).filter((msg): msg is string => Boolean(msg));
						if (collected.length) {
							errorMsg = collected.join('；');
						}
					}
				}

				message.error(errorMsg);
				break;
			}
			case 401:
				message.error('登录过期，请重新登录');
				if (window.location.pathname !== '/login') {
					window.location.href = '/login';
				}
				break;
			case 403:
				message.error('服务器拒绝请求');
				break;
			case 404:
				message.error('资源未找到');
				break;
			case 500:
				message.error('服务器内部错误');
				break;
			case 502:
				message.error('网关或代理服务器收到无效响应');
				break;
			case 503:
				message.error('服务器暂时无法处理请求');
				break;
			default:
				message.error(data?.message ?? '请求失败，请稍后重试');
		}

		return Promise.reject(error);
	},
);
