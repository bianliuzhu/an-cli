import fs from 'fs';
import { OpenAPIV3 } from 'openapi-types';
import DATA from '../../data/umf.json';
import { clearDir, isFileExisted, writeFileRecursive } from '../utils';
import Components from './core/components';
import { getSwaggerJson } from './core/get-data';
import PathParse from './core/path';
import { ComponentsSchemas, ConfigType, PathsObject } from './types';
import { exec } from 'shelljs';
import { log } from '../utils';

/**
	"saveTypeFolderPath": "apps/types",
	"apiListFilePath": "spps/services",
	"swaggerJsonUrl": "",
	"indent": "\t",
	"headers": {}
 */

const configContent = {
	saveTypeFolderPath: 'apps/types',
	apiListFilePath: 'apps/services',
	swaggerJsonUrl: '',
	requestMethodsImportPath: './fetch',
	indent: '\t',
	headers: {},
};
export class Main {
	private schemas: ComponentsSchemas = {};
	private paths: PathsObject = {};

	/**
	 * 获取远程数据
	 * @param item
	 * @param update 更新覆盖
	 */
	private handle(config: ConfigType) {
		if (process.env.NODE_ENV === 'development') {
			return new Promise((resolve, reject) => {
				const response = DATA as unknown as OpenAPIV3.Document;
				this.schemas = response.components?.schemas;
				this.paths = response.paths;
				const components = new Components(this.schemas, config);
				components.handle();
				const paths = new PathParse(this.paths, config);
				paths.handle();
				return resolve(true);
			});
		} else {
			return new Promise((resolve) => {
				if (!config.swaggerJsonUrl) return resolve({}); // reject map
				getSwaggerJson(config)
					.then((data) => {
						const response = data as OpenAPIV3.Document;
						this.schemas = response.components?.schemas;
						this.paths = response.paths;
						const components = new Components(this.schemas, config);
						components.handle();
						const paths = new PathParse(this.paths, config);
						paths.handle();

						resolve({});
					})
					.catch(() => {
						resolve({}); // reject map
					});
			});
		}
	}

	initialize() {
		const configFilePath = process.cwd() + '/an.config.json';
		isFileExisted(configFilePath)
			.then(() => {
				fs.readFile(configFilePath, 'utf8', (err, data) => {
					if (err) {
						console.error(err);
						return;
					}
					const config = JSON.parse(data) as ConfigType;

					console.log('config ---->', config);

					clearDir(config.saveTypeFolderPath).then(() => {
						this.handle(config)
							.then(() => {
								exec(`npx prettier --write "${config.saveTypeFolderPath}/**/*.{ts,d.ts}"`);
								log.warning(`format: npx prettier --write "${config.saveTypeFolderPath}/**/*.{ts,d.ts}"`);
								return;
							})
							.catch((err) => {
								console.log(err);
							});
					});
				});
			})
			.catch(() => {
				log.warning('配置文件不存在，将自动创建配置文件！');
				clearDir(configContent.saveTypeFolderPath).then(() => {
					writeFileRecursive(configFilePath, JSON.stringify(configContent, null, 2))
						.catch((err) => {
							log.error(err);
						})
						.finally(() => {
							this.handle(configContent);
						});
				});
			});
	}
}

if (process.env.NODE_ENV === 'development') {
	const int = new Main();
	int.initialize();
}
