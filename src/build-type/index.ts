import fs from 'fs';
import { OpenAPIV3 } from 'openapi-types';
import { clearDir, writeFileRecursive } from '../utils';
import Components from './core/components';
import { getSwaggerJson } from './core/get-data';
import PathParse from './core/path';
import { ComponentsSchemas, ConfigType, PathsObject } from './types';
import { exec } from 'shelljs';
import { log } from '../utils';
import chalk from 'chalk';
import path from 'path';

let isConfigFile: boolean;

interface ExecResult {
	stdout: string;
	stderr: string;
}
const isDev = process.env.NODE_ENV === 'development';

const configContent: ConfigType = {
	saveTypeFolderPath: isDev ? 'apps/types' : 'src/api/types',
	saveApiListFolderPath: isDev ? 'apps/types' : 'src/api',
	saveEnumFolderPath: isDev ? 'apps/types/enums' : 'src/enums',
	importEnumPath: '../../../enums',
	requestMethodsImportPath: './fetch',
	publicPrefix: '/api',
	dataLevel: 'serve',
	swaggerJsonUrl: 'https://generator3.swagger.io/openapi.json',
	headers: {},
	formatting: {
		indentation: '\t',
		lineEnding: '\n',
	},
	includeInterface: [],
	excludeInterface: [],
};

export class Main {
	private schemas: ComponentsSchemas = {};
	private paths: PathsObject = {};

	/**
	 * 处理 Swagger 数据
	 */
	private async handle(config: ConfigType) {
		try {
			let response: OpenAPIV3.Document;

			if (isDev) {
				response = (await import('../../data/open-api.json')).default as unknown as OpenAPIV3.Document;
			} else {
				response = (await getSwaggerJson(config)) as OpenAPIV3.Document;
			}

			if (!response) {
				throw new Error('无法获取 Swagger 数据');
			}

			this.schemas = response.components?.schemas || {};
			this.paths = response.paths || {};

			const components = new Components(this.schemas, config);
			const paths = new PathParse(this.paths, response.components?.parameters, config);

			await components.handle();
			await paths.handle();

			return true;
		} catch (error: unknown) {
			if (error instanceof Error) {
				throw new Error(`Handle Swagger data failed: ${error.message}`);
			}
			throw new Error('Handle Swagger data failed: unknown error');
		}
	}

	/**
	 * 执行格式化命令
	 */
	private async formatGeneratedFiles(config: ConfigType) {
		const formatCommand = `npx prettier --write "${config.saveTypeFolderPath}/**/*.{ts,d.ts}"`;

		try {
			await fs.promises.access(config.saveTypeFolderPath);

			const { stderr } = await new Promise<ExecResult>((resolve, reject) => {
				exec(formatCommand, (error, stdout, stderr) => {
					if (error) reject(error);
					else resolve({ stdout, stderr });
				});
			});

			if (stderr) {
				console.log('\n');
				console.log('$', chalk.yellow(formatCommand));
				console.log('\n');
			}
			log.success('File formatting successful');
			console.log('\n');
		} catch (error: unknown) {
			console.log('');
			console.log(error);
			log.error('Format failed, please manually execute the following command:');
			console.log('$', chalk.yellow(formatCommand));
			console.log('');
		}
	}

	/**
	 * 复制 AJAX 配置文件
	 */
	private async copyAjaxConfigFiles(saveApiListFolderPath: string) {
		try {
			const filesToCopy = ['config.ts', 'error-message.ts', 'fetch.ts', 'api-type.d.ts'];
			const sourceDir = isDev ? path.join(__dirname, '..', '..', 'postbuild-assets', 'ajax-config') : path.join(__dirname, '..', '..', 'ajax-config');
			const destDir = saveApiListFolderPath;

			for (const file of filesToCopy) {
				const sourceFile = path.join(sourceDir, file);
				const destFile = path.join(destDir, file);

				try {
					await fs.promises.access(sourceFile);
					try {
						await fs.promises.access(destFile);
						log.info(`${file} already exists, skipping generation.`);
					} catch {
						await fs.promises.copyFile(sourceFile, destFile);
						log.success(`${file} create done.`);
					}
				} catch (error) {
					log.error(`Source file ${sourceFile} does not exist`);
					continue;
				}
			}
		} catch (error) {
			return error;
		}
	}

	/**
	 * 获取配置文件
	 */
	private async getConfig(configFilePath: string): Promise<ConfigType> {
		try {
			const data = await fs.promises.readFile(configFilePath, 'utf8');
			isConfigFile = true;
			return JSON.parse(data) as ConfigType;
		} catch (error: unknown) {
			isConfigFile = false;
			log.warning('Config file does not exist, will automatically create config file.');
			await writeFileRecursive(configFilePath, JSON.stringify(configContent, null, 2));
			log.success('Please check the an.config.json file in the project root directory');
			return configContent;
		}
	}

	async initialize() {
		const configFilePath = process.cwd() + '/an.config.json';

		try {
			const config = await this.getConfig(configFilePath);

			if (!isConfigFile) return;

			// 创建目标目录（如果不存在）
			await fs.promises.mkdir(config.saveApiListFolderPath, { recursive: true });

			// 复制 ajax 配置文件
			await this.copyAjaxConfigFiles(config.saveApiListFolderPath);

			// 清理文件夹
			await clearDir(config.saveTypeFolderPath);
			await clearDir(config.saveEnumFolderPath);

			// 解析 swagger 数据及生成文件
			await this.handle(config);

			// 对生成文件进行格式化
			await this.formatGeneratedFiles(config);

			log.success('Successfully, all done, see you next time!');
			console.log('\n');
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			log.error(`Initialization failed: ${message}`);
		}
	}
}

if (process.env.NODE_ENV === 'development') {
	const int = new Main();
	int.initialize();
}
