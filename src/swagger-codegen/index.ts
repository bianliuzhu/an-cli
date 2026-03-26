import type { ComponentsSchemas, ConfigType, IConfigSwaggerServer, PathsObject } from './types';
import type { OpenAPIV3 } from 'openapi-types';

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { exec } from 'shelljs';

import { clearDir, clearDirExcept, writeFileRecursive } from '../utils';
import { log, setLogLevel, spinner } from '../utils';
import Components from './components/index';
import { getSwaggerJson } from './get-data';
import PathParse from './path/index';

let isConfigFile: boolean;

interface ExecResult {
	stdout: string;
	stderr: string;
}
const isDebug = process.env.NODE_ENV === 'debug';

const configContent: ConfigType = {
	saveTypeFolderPath: isDebug ? 'apps/types' : 'src/types',
	saveApiListFolderPath: isDebug ? 'apps/types' : 'src/apis',
	saveEnumFolderPath: isDebug ? 'apps/enums' : 'src/enums',
	importEnumPath: '../../../enums',
	requestMethodsImportPath: './config/fetch',
	formatting: {
		indentation: '\t',
		lineEnding: '\n',
	},
	swaggerConfig: {
		url: 'https://generator3.swagger.io/openapi.json',
		apiListFileName: 'index.ts',
		headers: {},
		dataLevel: 'serve',
		parameterSeparator: '_',
		includeInterface: [],
		excludeInterface: [],
	},
	enmuConfig: {
		erasableSyntaxOnly: false,
		varnames: 'enum-varnames',
		comment: 'enum-descriptions',
	},
};

type NormalizedSwaggerServer = Required<Omit<IConfigSwaggerServer, 'responseModelTransform' | 'includeTags' | 'excludeTags'>> &
	Pick<IConfigSwaggerServer, 'responseModelTransform' | 'includeTags' | 'excludeTags'>;

export class Main {
	private schemas: ComponentsSchemas = {};
	private paths: PathsObject = {};

	/**
	 * 处理 Swagger 数据
	 */
	private async handle(config: ConfigType, appendMode: boolean, show?: 'miss' | 'gen'): Promise<{ path: string; method: string }[] | null> {
		try {
			// 无论是否为调试模式，都优先按配置从 swaggerConfig.url 获取数据
			// 若需要本地调试示例数据，可以在 an.config.json 中将 swaggerConfig.url
			// 配置为本地文件路径（例如 ./data/openapi.json.js），getSwaggerJson 会自动处理。
			spinner.start('Fetching Swagger data...');
			const response = (await getSwaggerJson(config)) as OpenAPIV3.Document;

			if (!response) {
				spinner.error('Failed to fetch Swagger data');
				throw new Error('无法获取 Swagger 数据');
			}
			spinner.success('Swagger data fetched');

			this.schemas = response.components?.schemas ?? {};
			this.paths = response.paths ?? {};

			const components = new Components(this.schemas, config, { appendMode });
			const paths = new PathParse(this.paths, response.components?.parameters, this.schemas, config);

			spinner.start('Generating types and APIs...');
			await components.handle();
			await paths.handle();
			spinner.success('Types and APIs generated');

			if (show === 'gen') return paths.getGeneratedInterfacesForOutput();
			if (show === 'miss') return paths.getMissingInterfacesForOutput();
			return null;
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
			spinner.start('Formatting generated files...');
			await fs.promises.access(config.saveTypeFolderPath);

			const { stderr } = await new Promise<ExecResult>((resolve, reject) => {
				exec(formatCommand, (error, stdout, stderr) => {
					if (error) reject(new Error(String(error)));
					else resolve({ stdout, stderr });
				});
			});

			if (stderr) {
				log.print('\n');
				log.print('$', chalk.yellow(formatCommand));
				log.print('\n');
			}
			spinner.success('File formatting successful');
			log.print('\n');
		} catch (error: unknown) {
			spinner.error('Format failed');
			log.print('');
			log.print(error);
			log.error('Format failed, please manually execute the following command:');
			log.print('$', chalk.yellow(formatCommand));
			log.print('');
		}
	}

	/**
	 * 复制 AJAX 配置文件
	 */
	private async copyAjaxConfigFiles(saveApiListFolderPath: string) {
		const filesToCopy = ['dio.ts', 'error-message.ts', 'fetch.ts', 'api-type.d.ts'];
		const sourceDir = isDebug ? path.join(__dirname, '..', '..', 'postbuild-assets', 'ajax-config') : path.join(__dirname, '..', 'ajax-config');
		const destDir = path.join(saveApiListFolderPath, 'config');

		// 若用户本地已存在 config 文件夹，则整体跳过生成
		try {
			await fs.promises.access(destDir);
			log.info(`config folder already exists at ${destDir}, skipping generation.`);
			return;
		} catch {
			await fs.promises.mkdir(destDir, { recursive: true });
		}

		for (const file of filesToCopy) {
			const sourceFile = path.join(sourceDir, file);
			const destFile = path.join(destDir, file);

			try {
				await fs.promises.access(sourceFile);
				await fs.promises.copyFile(sourceFile, destFile);
				log.success(`${file} create done.`);
			} catch (error: unknown) {
				if (error instanceof Error) {
					log.error(`Source file ${sourceFile} does not exist`);
					throw new Error(`Source file ${sourceFile} does not exist: ${error.message}`);
				}
				throw new Error(`Source file ${sourceFile} does not exist: unknown error`);
			}
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
			const lang = process.env.LANG ?? process.env.LC_ALL ?? process.env.LC_MESSAGES ?? '';
			return lang.toLowerCase();
		}
	}

	/**
	 * 当检测到旧版配置时，在控制台提示迁移方式
	 */
	private showLegacyConfigHint(config: ConfigType) {
		const exampleServer = {
			url: config.swaggerJsonUrl ?? 'https://your.swagger.json',
			publicPrefix: config.publicPrefix ?? '',
			apiListFileName: config.apiListFileName ?? 'index.ts',
			headers: config.headers ?? {},
		};

		const locale = this.getSystemLocale();
		const isChinese = locale.startsWith('zh') || locale.includes('chinese');

		if (isChinese) {
			log.print('\n检测到旧版配置，请更新 an.config.json：');
			log.print('1) 将 swaggerJsonUrl / publicPrefix / headers 移到 swaggerConfig 字段。');
			log.print('2) 单个服务可直接填写对象，多个服务请使用数组，并确保 apiListFileName 唯一。');
			log.print('示例：');
			log.print(JSON.stringify({ swaggerConfig: exampleServer }, null, 2));
			log.print('');
		} else {
			log.print('\nLegacy configuration detected, please update an.config.json:');
			log.print('1) Move swaggerJsonUrl / publicPrefix / headers to swaggerConfig field.');
			log.print('2) Single service can be an object directly, multiple services should use an array, and ensure apiListFileName is unique.');
			log.print('Example:');
			log.print(JSON.stringify({ swaggerConfig: exampleServer }, null, 2));
			log.print('');
		}
	}

	/**
	 * 规范化 swaggerConfig，兼容旧配置并校验必填字段
	 */
	private normalizeswaggerConfig(config: ConfigType, hasUserDefinedServers: boolean): NormalizedSwaggerServer[] {
		let legacyDetected = false;
		let serversInput = hasUserDefinedServers ? config.swaggerConfig : undefined;

		if (!serversInput) {
			legacyDetected = true;
			serversInput = {
				url: config.swaggerJsonUrl ?? '',
				publicPrefix: config.publicPrefix ?? '',
				apiListFileName: config.apiListFileName ?? 'index.ts',
				headers: config.headers ?? {},
				modulePrefix: config.modulePrefix,
			};
		}

		const fillDefaults = (server: IConfigSwaggerServer, index: number): NormalizedSwaggerServer => {
			const url = server.url || config.swaggerJsonUrl;
			if (!url) {
				throw new Error(`swaggerConfig[${index}] 缺少 url，请补充后重试。`);
			}

			const publicPrefix = server.publicPrefix ?? config.publicPrefix ?? '';

			if (!server.url && config.swaggerJsonUrl) {
				legacyDetected = true;
			}

			const apiListFileNameRaw = server.apiListFileName ?? config.apiListFileName ?? 'index.ts';
			const apiListFileName = apiListFileNameRaw.trim() || 'index.ts';
			const headers = server.headers ?? config.headers ?? {};
			const dataLevel = server.dataLevel ?? config.dataLevel ?? 'serve';
			const parameterSeparator = server.parameterSeparator ?? config.parameterSeparator ?? '_';
			const includeInterface = server.includeInterface ?? config.includeInterface ?? [];
			const excludeInterface = server.excludeInterface ?? config.excludeInterface ?? [];
			const includeTags = server.includeTags ?? config.includeTags;
			const excludeTags = server.excludeTags ?? config.excludeTags;
			const modulePrefix = server.modulePrefix ?? config.modulePrefix ?? '';
			const responseModelTransform = server.responseModelTransform ?? config.responseModelTransform;

			const result: NormalizedSwaggerServer = {
				url,
				publicPrefix,
				apiListFileName,
				headers,
				dataLevel,
				parameterSeparator,
				includeInterface,
				excludeInterface,
				modulePrefix,
				responseModelTransform,
			};

			// 可选字段需要单独处理
			if (includeTags !== undefined) {
				result.includeTags = includeTags;
			}
			if (excludeTags !== undefined) {
				result.excludeTags = excludeTags;
			}

			return result;
		};

		const normalized = Array.isArray(serversInput) ? serversInput.map((item, index) => fillDefaults(item, index)) : [fillDefaults(serversInput, 0)];

		if (normalized.length === 0) {
			throw new Error('swaggerConfig 不能为空，请至少配置一个 swagger 服务。');
		}

		if (normalized.length > 1) {
			const nameSet = new Set<string>();
			normalized.forEach((server) => {
				if (nameSet.has(server.apiListFileName)) {
					throw new Error(`swaggerConfig 中 apiListFileName 重复：${server.apiListFileName}，请为每个服务设置唯一文件名。`);
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
			dataLevel: server.dataLevel,
			parameterSeparator: server.parameterSeparator,
			includeInterface: server.includeInterface,
			excludeInterface: server.excludeInterface,
			includeTags: server.includeTags,
			excludeTags: server.excludeTags,
			modulePrefix: server.modulePrefix,
			responseModelTransform: server.responseModelTransform ?? baseConfig.responseModelTransform,
			swaggerConfig: server,
		};
	}

	/**
	 * 获取配置文件
	 */
	private async getConfig(configFilePath: string): Promise<ConfigType> {
		try {
			const data = await fs.promises.readFile(configFilePath, 'utf8');
			isConfigFile = true;
			try {
				return JSON.parse(data) as ConfigType;
			} catch (parseError) {
				// JSON 解析失败，配置文件存在但格式错误
				isConfigFile = true; // 文件存在，不应该创建新文件
				throw new Error(`配置文件格式错误，请检查 an.config.json 的 JSON 格式是否正确: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
			}
		} catch (error: unknown) {
			// 文件不存在的情况
			if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
				isConfigFile = false;
				log.warning('配置文件不存在，将自动创建配置文件。');
				await writeFileRecursive(configFilePath, JSON.stringify(configContent, null, 2));
				log.success('配置文件已创建，请检查项目根目录下的 an.config.json 文件并配置后重新运行。');
				return configContent;
			}
			// 其他错误（如权限问题、JSON解析错误等）
			throw error;
		}
	}

	async initialize(show?: 'miss' | 'gen'): Promise<void> {
		const configFilePath = process.cwd() + '/an.config.json';

		try {
			const userConfig = await this.getConfig(configFilePath);
			const mergedConfig = { ...configContent, ...userConfig };

			// 设置日志输出级别
			if (mergedConfig.logLevel) {
				setLogLevel(mergedConfig.logLevel);
			}

			const hasUserswaggerConfig = Object.prototype.hasOwnProperty.call(userConfig, 'swaggerConfig');
			const servers = this.normalizeswaggerConfig(mergedConfig, hasUserswaggerConfig);

			if (!isConfigFile) return;

			// 创建目标目录（如果不存在）
			await fs.promises.mkdir(mergedConfig.saveApiListFolderPath, { recursive: true });

			// 复制 ajax 配置文件
			await this.copyAjaxConfigFiles(mergedConfig.saveApiListFolderPath);

			// 清理文件夹
			// 清理 API 文件夹，但保留配置文件
			await clearDirExcept(mergedConfig.saveApiListFolderPath, ['config']);
			await clearDir(mergedConfig.saveTypeFolderPath);
			await clearDir(mergedConfig.saveEnumFolderPath);

			const showSummary: { serverUrl: string; list: { path: string; method: string }[] }[] = [];

			// 逐个 swagger 服务生成
			for (let i = 0; i < servers.length; i++) {
				const serverConfig = this.buildServerConfig(mergedConfig, servers[i]);
				const appendMode = i > 0;
				const list = await this.handle(serverConfig, appendMode, show);
				if (show && list) showSummary.push({ serverUrl: servers[i].url, list });
			}

			// 对生成文件进行格式化
			await this.formatGeneratedFiles(mergedConfig);

			log.success('Successfully, all done, see you next time!');
			log.print('\n');

			if (show && showSummary.length > 0) {
				const label = show === 'miss' ? 'excludeInterface' : 'includeInterface';
				for (const { serverUrl, list } of showSummary) {
					if (servers.length > 1) log.print(chalk.cyan(`\n[${label}] ${serverUrl}`));
					else log.print(chalk.cyan(`\n[${label}]`));
					log.print(JSON.stringify(list, null, 2));
				}
				log.print('\n');
			}
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			log.error(`Initialization failed: ${message}`);
		}
	}
}

if (isDebug) {
	const instance = new Main();
	instance.initialize().catch((error) => {
		console.error(error);
	});
}
