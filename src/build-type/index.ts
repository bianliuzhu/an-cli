import fs from 'fs';
import { OpenAPIV3 } from 'openapi-types';
// import DATA from '../../data/umf.json';
import { clearDir, isFileExisted, writeFileRecursive } from '../utils';
import Components from './core/components';
import { getSwaggerJson } from './core/get-data';
import PathParse from './core/path';
import { ComponentsSchemas, ConfigType, PathsObject } from './types';
import { exec, exit, which } from 'shelljs';
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
		// return new Promise((resolve, reject) => {
		// 	const response = DATA as unknown as OpenAPIV3.Document;
		// 	this.schemas = response.components?.schemas;
		// 	this.paths = response.paths;
		// 	const components = new Components(this.schemas, config);
		// 	components.handle();
		// 	const paths = new PathParse(this.paths, config);
		// 	paths.handle();
		// 	return resolve(true);
		// });

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
							.then((res) => {
								console.log('format: ', `prettier --write "${config.saveTypeFolderPath}/**/*.{ts,d.ts}"`);
								exec(`prettier --write "${config.saveTypeFolderPath}/**/*.{ts,d.ts}"`);

								return;
							})
							.catch((err) => {
								console.log(err);
							});
					});
				});
			})
			.catch((err) => {
				clearDir(configContent.saveTypeFolderPath).then(() => {
					writeFileRecursive(configFilePath, JSON.stringify(configContent, null, 2))
						.catch((err) => {
							console.log(err);
						})
						.finally(() => {
							this.handle(configContent);
						});
				});
				console.error(err);
			});
	}
}
// const int = new Main();
// int.initialize();
