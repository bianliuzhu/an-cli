/**
 * 提示组件请按项目实际替换：
 * - Web：可换成 antd / element-plus / naive-ui 的 message
 * - 小程序/uni-app/Taro：可换成 wx.showToast / uni.showToast / Taro.showToast
 * 这里保留一个最小实现（console.warn），避免默认强依赖任何提示库。
 */
const message = {
	info: (msg: string) => console.info('[tip]', msg),
	warning: (msg: string) => console.warn('[warn]', msg),
	error: (msg: string) => console.error('[error]', msg),
};

/** 跳过提示的 code 码 */
const skipTipCode: number[] = [];

/** 需要重写提示的 code 码 */
const rewriteCodeMessage = ({ code = 10000, message = '网络错误，稍后重试！' }: ResponseModel<unknown>) => {
	switch (code) {
		case 10000:
			return { code, message: '系统错误，稍后重试！' };
		default:
			return { code, message };
	}
};

export const messageTip = ({ data }: DioResponse<ResponseModel<unknown>>) => {
	if (Object.prototype.toString.call(data) !== '[object Object]') return;
	if (!('message' in data && 'code' in data)) return;

	const { code, message: msg } = rewriteCodeMessage(data);

	if (skipTipCode.includes(code)) return;

	// 以下的代码是根据 code 码范围来显示不同的提示信息，请根据实际需求修改

	/** 信息提示范围 */
	if (code >= 2000 && code <= 3999) {
		message.info(msg);
	}

	/** 警告提示范围 */
	if (code > 3999 && code <= 4999) {
		message.warning(msg);
	}

	/** 错误提示范围 */
	if (code > 4999 && code <= 5999) {
		message.error(msg);
	}

	/** 系统提示范围 */
	if (code >= 9000) {
		message.info(msg);
	}
};
