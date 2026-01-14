import type { AxiosResponse } from 'axios';

import { message } from 'antd';

/**
 * 跳过提示的 code 码
 */
const skipTipCode: number[] = [];

/**
 * 需要重写提示的 code 码
 */
const rewriteCodeMessage = ({ code = 10000, message = '网络错误，稍后重试！' }: ResponseModel<unknown>) => {
	switch (code) {
		case 10000:
			return { code, message: '系统错误，稍后重试！' };
		default:
			return { code, message };
	}
};

export const messageTip = ({ data }: AxiosResponse<ResponseModel<unknown>>) => {
	if (Object.prototype.toString.call(data) !== '[object Object]') return;
	if (!('message' in data && 'code' in data)) return;

	const { code, message: msg } = rewriteCodeMessage(data);

	if (skipTipCode.includes(code)) return;

	/**
	 * 信息提示范围
	 */
	if (code >= 2000 && code <= 3999) {
		message.info(msg);
	}

	/**
	 * 警告提示范围
	 */
	if (code > 3999 && code <= 4999) {
		message.warning(msg);
	}

	/**
	 * 错误提示范围
	 */
	if (code > 4999 && code <= 5999) {
		message.error(msg);
	}

	/**
	 * 系统提示范围
	 */
	if (code >= 9000) {
		message.info(msg);
	}
};
