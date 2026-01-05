import fs from 'fs';
import { OpenAPIV3 } from 'openapi-types';
import { clearDir, writeFileRecursive } from '../utils';
import Components from './core/components';
import { getSwaggerJson } from './core/get-data';
import PathParse from './core/path';
import { ComponentsSchemas, ConfigType, IConfigSwaggerServer, PathsObject } from './types';
import { exec } from 'shelljs';
import { log } from '../utils';
import chalk from 'chalk';
import path from 'path';

let isConfigFile: boolean;

interface ExecResult {
	stdout: string;
	stderr: string;
}
const isDebug = process.env.NODE_ENV === 'debug';

const configContent: ConfigType = {
	saveTypeFolderPath: isDebug ? 'apps/types' : 'src/api/types',
	saveApiListFolderPath: isDebug ? 'apps/types' : 'src/api',
	saveEnumFolderPath: isDebug ? 'apps/types/enums' : 'src/enums',
	importEnumPath: '../../../enums',
	requestMethodsImportPath: './fetch',
	dataLevel: 'serve',
	swaggerJsonUrl: 'https://generator3.swagger.io/openapi.json',
	swaggerServers: {
		url: 'https://generator3.swagger.io/openapi.json',
		apiListFileName: 'index.ts',
		headers: {},
	},
	apiListFileName: 'index.ts',
	headers: {},
	formatting: {
		indentation: '\t',
		lineEnding: '\n',
	},
	includeInterface: [],
	excludeInterface: [],

	parameterSeparator: '_',
	enmuConfig: {
		erasableSyntaxOnly: false,
		varnames: 'enum-varnames',
		comment: 'enum-descriptions',
	},
};

type NormalizedSwaggerServer = Required<IConfigSwaggerServer>;

export class Main {
	private schemas: ComponentsSchemas = {};
	private paths: PathsObject = {};

	/**
	 * 处理 Swagger 数据
	 */
	private async handle(config: ConfigType, appendMode: boolean) {
		try {
			let response: OpenAPIV3.Document;

			if (isDebug) {
				response = (await import('../../data/openapi.json')).default as unknown as OpenAPIV3.Document;
				// response = (await import('../../data/df.json')).default as unknown as OpenAPIV3.Document;
			} else {
				response = (await getSwaggerJson(config)) as OpenAPIV3.Document;
			}

			if (!response) {
				throw new Error('无法获取 Swagger 数据');
			}

			this.schemas = response.components?.schemas || {};
			this.paths = response.paths || {};

			const components = new Components(this.schemas, config, { appendMode });
			const paths = new PathParse(this.paths, response.components?.parameters, this.schemas, config);

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
			const sourceDir = isDebug
				? path.join(__dirname, '..', '..', 'postbuild-assets', 'ajax-config')
				: path.join(__dirname, '..', '..', 'ajax-config');
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
	 * 检测系统语言
	 */
	private getSystemLocale(): string {
		try {
			// 优先使用 Intl API 检测语言
			const locale = Intl.DateTimeFormat().resolvedOptions().locale;
			return locale.toLowerCase();
		} catch {
			// 回退到环境变量
			const lang = process.env.LANG || process.env.LC_ALL || process.env.LC_MESSAGES || '';
			return lang.toLowerCase();
		}
	}

	/**
	 * 当检测到旧版配置时，在控制台提示迁移方式
	 */
	private showLegacyConfigHint(config: ConfigType) {
		const exampleServer = {
			url: config.swaggerJsonUrl || 'https://your.swagger.json',
			publicPrefix: config.publicPrefix || '',
			apiListFileName: config.apiListFileName || 'index.ts',
			headers: config.headers || {},
		};

		const locale = this.getSystemLocale();
		const isChinese = locale.startsWith('zh') || locale.includes('chinese');

		if (isChinese) {
			console.log('\n检测到旧版配置，请更新 an.config.json：');
			console.log('1) 将 swaggerJsonUrl / publicPrefix / headers 移到 swaggerServers 字段。');
			console.log('2) 单个服务可直接填写对象，多个服务请使用数组，并确保 apiListFileName 唯一。');
			console.log('示例：');
			console.log(JSON.stringify({ swaggerServers: exampleServer }, null, 2));
			console.log('');
		} else {
			console.log('\nLegacy configuration detected, please update an.config.json:');
			console.log('1) Move swaggerJsonUrl / publicPrefix / headers to swaggerServers field.');
			console.log('2) Single service can be an object directly, multiple services should use an array, and ensure apiListFileName is unique.');
			console.log('Example:');
			console.log(JSON.stringify({ swaggerServers: exampleServer }, null, 2));
			console.log('');
		}
	}

	/**
	 * 规范化 swaggerServers，兼容旧配置并校验必填字段
	 */
	private normalizeSwaggerServers(config: ConfigType, hasUserDefinedServers: boolean): NormalizedSwaggerServer[] {
		let legacyDetected = false;
		let serversInput = hasUserDefinedServers ? config.swaggerServers : undefined;

		if (!serversInput) {
			legacyDetected = true;
			serversInput = {
				url: config.swaggerJsonUrl || '',
				publicPrefix: config.publicPrefix || '',
				apiListFileName: config.apiListFileName || 'index.ts',
				headers: config.headers || {},
			};
		}

		const fillDefaults = (server: IConfigSwaggerServer, index: number): NormalizedSwaggerServer => {
			const url = server.url || config.swaggerJsonUrl;
			if (!url) {
				throw new Error(`swaggerServers[${index}] 缺少 url，请补充后重试。`);
			}

			const publicPrefix = server.publicPrefix ?? config.publicPrefix ?? '';

			if (!server.url && config.swaggerJsonUrl) {
				legacyDetected = true;
			}

			const apiListFileNameRaw = server.apiListFileName || config.apiListFileName || 'index.ts';
			const apiListFileName = apiListFileNameRaw.trim() || 'index.ts';
			const headers = server.headers || config.headers || {};

			return {
				url,
				publicPrefix,
				apiListFileName,
				headers,
			};
		};

		const normalized = Array.isArray(serversInput) ? serversInput.map((item, index) => fillDefaults(item, index)) : [fillDefaults(serversInput, 0)];

		if (normalized.length === 0) {
			throw new Error('swaggerServers 不能为空，请至少配置一个 swagger 服务。');
		}

		if (normalized.length > 1) {
			const nameSet = new Set<string>();
			normalized.forEach((server) => {
				if (nameSet.has(server.apiListFileName)) {
					throw new Error(`swaggerServers 中 apiListFileName 重复：${server.apiListFileName}，请为每个服务设置唯一文件名。`);
				}
				nameSet.add(server.apiListFileName);
			});
		}

		if (legacyDetected) {
			this.showLegacyConfigHint(config);
		}

		return normalized;
	}

	/**
	 * 将 swaggerServer 数据合并到配置中，便于后续处理
	 */
	private buildServerConfig(baseConfig: ConfigType, server: NormalizedSwaggerServer): ConfigType {
		return {
			...baseConfig,
			swaggerJsonUrl: server.url,
			publicPrefix: server.publicPrefix ?? baseConfig.publicPrefix,
			headers: server.headers,
			apiListFileName: server.apiListFileName,
			swaggerServers: server,
		};
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
			const userConfig = await this.getConfig(configFilePath);
			const mergedConfig = { ...configContent, ...userConfig };
			const hasUserSwaggerServers = Object.prototype.hasOwnProperty.call(userConfig, 'swaggerServers');
			const servers = this.normalizeSwaggerServers(mergedConfig, hasUserSwaggerServers);

			if (!isConfigFile) return;

			// 创建目标目录（如果不存在）
			await fs.promises.mkdir(mergedConfig.saveApiListFolderPath, { recursive: true });

			// 复制 ajax 配置文件
			await this.copyAjaxConfigFiles(mergedConfig.saveApiListFolderPath);

			// 清理文件夹
			await clearDir(mergedConfig.saveTypeFolderPath);
			await clearDir(mergedConfig.saveEnumFolderPath);

			// 逐个 swagger 服务生成
			for (let i = 0; i < servers.length; i++) {
				const serverConfig = this.buildServerConfig(mergedConfig, servers[i]);
				const appendMode = i > 0;
				await this.handle(serverConfig, appendMode);
			}

			// 对生成文件进行格式化
			await this.formatGeneratedFiles(mergedConfig);

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
