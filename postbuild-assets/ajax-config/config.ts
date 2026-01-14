import type { AxiosInstance } from 'axios';

import axios from 'axios';

import { message } from 'antd/message';

const { VITE_API_URL, VITE_API_PROXY, VITE_PUBLIC_PATH } = import.meta.env;

const HTTP_PROXY = `${VITE_PUBLIC_PATH}${VITE_API_PROXY}`;
// 基础URL
export const BASE_URL = process.env.NODE_ENV === 'production' ? VITE_API_URL : HTTP_PROXY;

export const dio: AxiosInstance = axios.create({
	// 设置baseUr地址,如果通过proxy跨域可直接填写base地址
	baseURL: BASE_URL,
	// 定义统一的请求头部
	headers: {
		'Content-Type': 'application/json',
	},
	// 配置请求超时时间
	timeout: 30000,
	// http 状态码判断
	validateStatus(status: number) {
		switch (status) {
			case 200:
				return true;
			case 400:
				message.error({ type: 'error', content: '请求无效或格式错误！' });
				break;
			case 401:
				message.error({ type: 'error', content: '登录过期,请重新登陆！' });
				break;
			case 403:
				message.error({ type: 'error', content: '服务器拒绝请求！' });
				break;
			case 404:
				message.error({ type: 'error', content: '资源未找到' });
				break;
			case 500:
				message.error({ type: 'error', content: '服务器内部错误' });
				break;
			case 502:
				message.error({ type: 'error', content: '网关或代理服务器收到无效响应' });
				break;
			case 503:
				message.error({ type: 'error', content: '服务器暂时无法处理请求' });
				break;
		}

		return true;
	},
});
// 请求拦截
dio.interceptors.request.use(
	(config) => {
		config.headers['Authorization'] = `Bearer 【auth -> replace】`;
		return config;
	},
	(error) => {
		console.error('request interceptors', error);
	},
);

// 响应拦截
dio.interceptors.response.use(
	(response) => {
		// 对响应数据做处理，例如只返回data部分
		if (response.data.code === 4001) {
			// 退出登录逻辑 自己写
			// window.location.href =  + 'login';
		}
		return response;
	},
	(error) => Promise.reject(error),
);
