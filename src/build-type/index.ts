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
/**
	"saveTypeFolderPath": "apps/types",
	"saveApiListFolderPath": "spps/services",
	"swaggerJsonUrl": "",
	"indent": "\t",
	"headers": {}
 */

interface ExecResult {
	stdout: string;
	stderr: string;
}

const configContent: ConfigType = {
	saveTypeFolderPath: process.env.NODE_ENV === 'development' ? 'apps/types' : 'src/api/types',
	saveApiListFolderPath: process.env.NODE_ENV === 'development' ? 'apps/types' : 'src/api',
	saveEnumFolderPath: process.env.NODE_ENV === 'development' ? 'apps/types/enums' : 'src/enums',
	importEnumPath: '../../../enums',
	requestMethodsImportPath: './fetch',
	dataLevel: 'serve',
	swaggerJsonUrl: 'www.example.swagger.json.url',
	headers: {},
	formatting: {
		indentation: '\t',
		lineEnding: '\n',
	},
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

			if (process.env.NODE_ENV === 'development') {
				response = (await import('../../data/sau.json')).default as OpenAPIV3.Document;
			} else {
				response = (await getSwaggerJson(config)) as OpenAPIV3.Document;
			}

			if (!response) {
				throw new Error('无法获取 Swagger 数据');
			}

			this.schemas = response.components?.schemas || {};
			this.paths = response.paths || {};

			const components = new Components(this.schemas, config);
			const paths = new PathParse(this.paths, config);

			await Promise.all([components.handle(), paths.handle()]);

			return true;
		} catch (error: unknown) {
			if (error instanceof Error) {
				throw new Error(`处理 Swagger 数据失败: ${error.message}`);
			}
			throw new Error('处理 Swagger 数据失败: 未知错误');
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
				throw new Error(stderr);
			}
			log.success('文件格式化成功');
		} catch (error: unknown) {
			console.log('');
			log.error('格式化失败，请手动执行以下命令：');
			console.log('$', chalk.yellow(formatCommand));
			console.log('');
		}
	}

	/**
	 * 复制 AJAX 配置文件
	 */
	private async copyAjaxConfigFiles(saveApiListFolderPath: string) {
		try {
			const filesToCopy = ['config.ts', 'error-message.ts', 'fetch.ts'];
			const sourceDir = path.join(__dirname, '..', '..', 'ajax-config');
			const destDir = saveApiListFolderPath;

			for (const file of filesToCopy) {
				const sourceFile = path.join(sourceDir, file);
				const destFile = path.join(destDir, file);

				try {
					await fs.promises.access(sourceFile);
					try {
						await fs.promises.access(destFile);
						log.info(`${file} 已存在，跳过生成.`);
					} catch {
						await fs.promises.copyFile(sourceFile, destFile);
						log.success(`${file} create done.`);
					}
				} catch (error) {
					log.error(`源文件 ${sourceFile} 不存在`);
					continue;
				}
			}
		} catch (error) {
			return error;
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
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : '未知错误';
			log.error(`初始化失败: ${message}`);
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
			log.warning('配置文件不存在，将自动创建配置文件。');
			await writeFileRecursive(configFilePath, JSON.stringify(configContent, null, 2));
			log.success('请查看项目根目录下的 an.config.json 文件');
			return configContent;
		}
	}
}

if (process.env.NODE_ENV === 'development') {
	const int = new Main();
	int.initialize();
}
