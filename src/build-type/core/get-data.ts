import http from 'http';
import https from 'https';
import { OpenAPI } from 'openapi-types';
import path from 'path';
import { requireModule } from '../tools';
import { ConfigType } from '../types';

interface DocumentCommom {
	swagger?: string;
	openapi?: string;
}

type TReturnType = Promise<OpenAPI.Document & DocumentCommom>;

/** 获取 Swagger JSON 数据 */
export async function getSwaggerJson(config: ConfigType): TReturnType {
	if (/^https?:\/\//.test(config.swaggerJsonUrl)) {
		return requestJson(config);
	} else {
		try {
			const res = requireModule(path.join('', config.swaggerJsonUrl));
			return Promise.resolve(res);
		} catch (err) {
			console.error(err, true);
			return Promise.reject(err);
		}
	}
}

/** 发起请求 */
export function requestJson({ swaggerJsonUrl: url, headers = {} }: ConfigType): TReturnType {
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
