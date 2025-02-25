import type { AxiosResponse } from 'axios';

import { message } from 'antd';

type BaseResponse<T> = {
	code: number;
	msg: string;
	data: T;
};

/**
 * 跳过提示的 code 码
 */
const skipTipCode: number[] = [4023, 4009];

/**
 * 需要重写提示的 code 码
 */
const rewriteCodeMessage = ({ code = 10000, msg = '网络错误，稍后重试！' }: BaseResponse<unknown>) => {
	switch (code) {
		case 10000:
			return { code, msg: '系统错误，稍后重试！' };
		case 4001:
			return { code, msg: '登录超时，请重新登录！' };
		case 4011:
			return { code, msg: '背景名称已存在，请重新修改' };
		case 4016:
			return { code, msg: '画布信息保存失败，请稍后重试' };
		case 4021:
			return { code, msg: '无可推荐人物形象，请自行生成' };
		default:
			return { code, msg };
	}
};

export const messageTip = ({ data }: AxiosResponse<BaseResponse<unknown>>) => {
	if (Object.prototype.toString.call(data) !== '[object Object]') return;
	if (!('msg' in data && 'code' in data)) return;

	const { code, msg } = rewriteCodeMessage(data);

	if (skipTipCode.includes(code)) return;

	if (code >= 2000 && code <= 3999) {
		message.inof(msg);
	}

	if (code > 3999 && code <= 4999) {
		message.warning(msg);
	}

	if (code > 4999 && code <= 5999) {
		message.error(msg);
	}

	if (code >= 9000) {
		message.error(msg);
	}
};
