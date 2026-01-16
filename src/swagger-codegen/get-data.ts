import http from 'http';
import https from 'https';
import { OpenAPI } from 'openapi-types';
import path from 'path';
import { requireModule } from '../utils';
import { ConfigType } from './types';

interface DocumentCommom {
	swagger?: string;
	openapi?: string;
}

type TReturnType = Promise<OpenAPI.Document & DocumentCommom>;

/** 获取 Swagger JSON 数据 */
export async function getSwaggerJson(config: ConfigType): TReturnType {
	if (!config.swaggerJsonUrl) {
		return Promise.reject(new Error('swaggerJsonUrl 未配置，请检查 swaggerConfig.url'));
	}

	if (/^https?:\/\//.test(config.swaggerJsonUrl)) {
		return requestJson(config);
	} else {
		try {
			// 本地文件：将相对路径转换为以项目根目录为基准的绝对路径
			// 这样 an.config.json 中可以写 "./data/op.json" 这类相对路径
			const absolutePath = path.isAbsolute(config.swaggerJsonUrl) ? config.swaggerJsonUrl : path.resolve(process.cwd(), config.swaggerJsonUrl);

			const res = requireModule(absolutePath);
			return Promise.resolve(res);
		} catch (err) {
			console.error(err, true);
			return Promise.reject(err);
		}
	}
}

/** 发起请求 */
export function requestJson({ swaggerJsonUrl: url = '', headers = {} }: ConfigType): TReturnType {
	return new Promise((resolve, reject) => {
		let TM: ReturnType<typeof setTimeout> | undefined = undefined;
		const request = /^https/.test(url) ? https.request : http.request;

		console.info(`Request Start: ${url}`);

		const req = request(
			url,
			{
				method: 'GET',
				rejectUnauthorized: false,
				headers: {
					Accept: '*/*',
					'Accept-Encoding': 'utf-8',
					'Content-Type': 'application/x-www-form-urlencoded',
					...headers,
				},
			},
			(res) => {
				res.setEncoding('utf-8'); // 解决中文乱码

				let dataStr = '';
				res.on('data', (data: Buffer) => {
					dataStr += data.toString();
				});

				res.on('end', () => {
					clearTimeout(TM);
					try {
						const json = JSON.parse(dataStr);
						console.info(`Request Successful: ${url}`);
						resolve(json);
					} catch (error) {
						console.error(`Request Failed: ${url}`, true);
						reject(error);
					}
				});

				res.on('error', (err) => {
					console.error(`Request Failed: ${url}`, true);
					reject(err);
				});
			},
		);

		req.on('timeout', (err: Error) => {
			console.error(err, true);
			reject(err);
		});

		TM = setTimeout(() => {
			const err = new Error();
			err.name = 'Request Timeout';
			err.message = url;
			req.emit('timeout', err);
		}, 15000); // 15秒超时

		req.end();
	});
}
