import type { ComponentsSchemas, ConfigType, IConfigSwaggerServer, LogLevel, PathsObject } from './types';
import type { OpenAPIV3 } from 'openapi-types';

import chalk from 'chalk';
import fs from 'fs';
import inquirer from 'inquirer';
import { createJiti } from 'jiti';
import path from 'path';
import { exec } from 'shelljs';

import { clearDir, clearDirExcept, writeFileRecursive } from '../utils';
import { log, setLogLevel, spinner } from '../utils';
import Components from './components/index';
import { getSwaggerJson } from './get-data';
import PathParse from './path/index';
import { computeSegment, getServiceTag } from './shared/naming';

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

type NormalizedSwaggerServer = Required<Omit<IConfigSwaggerServer, 'name' | 'responseModelTransform' | 'includeTags' | 'excludeTags' | 'timeout'>> &
	Pick<IConfigSwaggerServer, 'name' | 'responseModelTransform' | 'includeTags' | 'excludeTags' | 'timeout'>;

export class Main {
	private schemas: ComponentsSchemas = {};
	private paths: PathsObject = {};

	/**
	 * 处理 Swagger 数据
	 */
	private async handle(config: ConfigType, appendMode: boolean, show?: 'miss' | 'gen'): Promise<{ path: string; method: string }[] | null> {
		const tag = getServiceTag(config);
		// 一个服务一段：使用 section 标题展示服务名 + URL，下面所有子任务无需重复 tag
		log.section(tag || 'service', config.swaggerJsonUrl);
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
	 * 解析要使用的 prettier 可执行文件路径
	 * 优先使用项目本地安装的 prettier，其次回退到 npx prettier
	 */
	private async resolvePrettierExecutable(): Promise<string> {
		const isWindows = process.platform === 'win32';
		const localBin = path.join(process.cwd(), 'node_modules', '.bin', isWindows ? 'prettier.cmd' : 'prettier');
		try {
			await fs.promises.access(localBin, fs.constants.X_OK);
			log.info(`Using local prettier: ${localBin}`);
			return `"${localBin}"`;
		} catch {
			return 'npx prettier';
		}
	}

	/**
	 * 自动检测项目根目录下的 prettier 配置文件
	 * 按优先级依次查找，找到第一个即返回其路径
	 */
	private async detectPrettierConfig(): Promise<string | null> {
		const configFileNames = [
			'.prettierrc',
			'.prettierrc.json',
			'.prettierrc.json5',
			'.prettierrc.yaml',
			'.prettierrc.yml',
			'.prettierrc.js',
			'.prettierrc.cjs',
			'.prettierrc.mjs',
			'.prettierrc.ts',
			'.prettierrc.cts',
			'.prettierrc.mts',
			'prettier.config.js',
			'prettier.config.cjs',
			'prettier.config.mjs',
			'prettier.config.ts',
			'prettier.config.cts',
			'prettier.config.mts',
		];
		for (const fileName of configFileNames) {
			const fullPath = path.join(process.cwd(), fileName);
			try {
				await fs.promises.access(fullPath);
				log.info(`Auto-detected prettier config: ${fileName}`);
				return fullPath;
			} catch {
				// 继续查找
			}
		}
		// 检查 package.json 中是否存在 prettier 字段
		try {
			const pkgRaw = await fs.promises.readFile(path.join(process.cwd(), 'package.json'), 'utf8');
			const pkg = JSON.parse(pkgRaw) as Record<string, unknown>;
			if (pkg.prettier) {
				log.info('Using prettier config from package.json');
				return path.join(process.cwd(), 'package.json');
			}
		} catch {
			// 忽略
		}
		return null;
	}

	/**
	 * 执行格式化命令
	 * @param config      全局配置
	 * @param formatOption  true = 自动检测配置; string = 用户指定配置文件路径
	 */
	private async formatGeneratedFiles(config: ConfigType, formatOption: string | boolean) {
		const prettierBin = await this.resolvePrettierExecutable();

		// 解析配置文件标志
		let configFlag = '';
		if (typeof formatOption === 'string' && formatOption.trim()) {
			// 用户明确指定了配置文件路径
			const configPath = path.resolve(process.cwd(), formatOption.trim());
			try {
				await fs.promises.access(configPath);
				configFlag = ` --config "${configPath}"`;
			} catch {
				log.warning(`Prettier config file not found: ${formatOption}, falling back to auto-detection...`);
				const detected = await this.detectPrettierConfig();
				if (detected) configFlag = ` --config "${detected}"`;
			}
		} else {
			// 自动检测
			const detected = await this.detectPrettierConfig();
			if (detected) configFlag = ` --config "${detected}"`;
		}

		// 收集存在的生成目录
		const dirsToFormat: string[] = [];
		const checkDir = async (dir: string, pattern: string) => {
			try {
				await fs.promises.access(dir);
				dirsToFormat.push(`"${dir}/${pattern}"`);
			} catch {
				// 目录不存在，跳过
			}
		};
		await checkDir(config.saveTypeFolderPath, '**/*.{ts,d.ts}');
		await checkDir(config.saveApiListFolderPath, '**/*.ts');
		await checkDir(config.saveEnumFolderPath, '**/*.ts');

		if (dirsToFormat.length === 0) {
			log.warning('No generated directories found to format.');
			return;
		}

		const formatCommand = `${prettierBin} --write ${dirsToFormat.join(' ')}${configFlag}`;

		try {
			spinner.start('Formatting generated files...');

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
			// 校验 apiListFileName，避免路径分隔符 / 路径穿越导致生成到非预期目录
			if (/[\\/]/.test(apiListFileName) || apiListFileName.includes('..')) {
				throw new Error(`swaggerConfig[${index}].apiListFileName 非法："${apiListFileName}"，请使用单个文件名（如 "bff.ts"），不要包含路径分隔符或 ".."。`);
			}
			const headers = server.headers ?? config.headers ?? {};
			const dataLevel = server.dataLevel ?? config.dataLevel ?? 'serve';
			const parameterSeparator = server.parameterSeparator ?? config.parameterSeparator ?? '_';
			const includeInterface = server.includeInterface ?? config.includeInterface ?? [];
			const excludeInterface = server.excludeInterface ?? config.excludeInterface ?? [];
			const includeTags = server.includeTags ?? config.includeTags;
			const excludeTags = server.excludeTags ?? config.excludeTags;
			const modulePrefix = server.modulePrefix ?? config.modulePrefix ?? '';
			const responseModelTransform = server.responseModelTransform ?? config.responseModelTransform;
			const timeout = server.timeout ?? config.timeout;

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
				timeout,
			};

			// 可选字段需要单独处理
			if (server.name?.trim()) {
				result.name = server.name.trim();
			}
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

			// 同时校验 name 全局唯一（仅检查显式提供的 name）
			const explicitNameSet = new Set<string>();
			normalized.forEach((server) => {
				if (!server.name) return;
				if (explicitNameSet.has(server.name)) {
					throw new Error(`swaggerConfig 中 name 重复：${server.name}，请为每个服务设置唯一名称。`);
				}
				explicitNameSet.add(server.name);
			});
		}

		if (legacyDetected) {
			this.showLegacyConfigHint(config);
		}

		return normalized;
	}

	/**
	 * 将 swaggerServer 数据合并到配置中，便于后续处理
	 *
	 * @param segment 用于隔离 models/connectors 目录的子段；空串表示不隔离
	 */
	private buildServerConfig(baseConfig: ConfigType, server: NormalizedSwaggerServer, segment: string): ConfigType {
		const result: ConfigType & { __segment?: string } = {
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
			timeout: server.timeout ?? baseConfig.timeout,
			swaggerConfig: server,
			// 内部字段：当多服务隔离时携带 segment，下游通过 getServerSegment 读取
			__segment: segment,
		};
		return result;
	}

	/**
	 * 加载 TypeScript 配置文件
	 */
	private async loadTsConfig(tsConfigPath: string): Promise<ConfigType> {
		try {
			const jiti = createJiti(__filename, { interopDefault: true });
			const mod = await jiti.import(tsConfigPath);
			const resolved = mod as { default?: ConfigType } | ConfigType;
			const config = ('default' in resolved && resolved.default ? resolved.default : resolved) as ConfigType;
			isConfigFile = true;
			return config;
		} catch (error: unknown) {
			isConfigFile = true;
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`配置文件加载失败，请检查 an.config.ts 文件: ${message}`);
		}
	}

	/**
	 * 加载 JSON 配置文件
	 */
	private async loadJsonConfig(jsonConfigPath: string): Promise<ConfigType> {
		try {
			const data = await fs.promises.readFile(jsonConfigPath, 'utf8');
			isConfigFile = true;
			try {
				return JSON.parse(data) as ConfigType;
			} catch (parseError) {
				// JSON 解析失败，配置文件存在但格式错误
				isConfigFile = true; // 文件存在，不应该创建新文件
				throw new Error(`配置文件格式错误，请检查 an.config.json 的 JSON 格式是否正确: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
			}
		} catch (error: unknown) {
			if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
				throw error; // 文件不存在，抛出让上层处理
			}
			throw error;
		}
	}

	/**
	 * 获取配置文件（优先加载 an.config.ts，其次 an.config.json）
	 */
	private async getConfig(projectRoot: string): Promise<ConfigType> {
		const tsConfigPath = path.join(projectRoot, 'an.config.ts');
		const jsonConfigPath = path.join(projectRoot, 'an.config.json');

		// 优先使用 ts 配置文件
		if (fs.existsSync(tsConfigPath)) {
			log.info('检测到 an.config.ts 配置文件。');
			return this.loadTsConfig(tsConfigPath);
		}

		// 其次使用 json 配置文件
		if (fs.existsSync(jsonConfigPath)) {
			return this.loadJsonConfig(jsonConfigPath);
		}

		// 均不存在，创建 ts 配置文件
		isConfigFile = false;
		log.warning('配置文件不存在，将自动创建配置文件。');
		const tsContent = this.generateTsConfigContent();
		await writeFileRecursive(tsConfigPath, tsContent);
		log.success('配置文件已创建，请检查项目根目录下的 an.config.ts 文件并配置后重新运行。');
		return configContent;
	}

	/**
	 * 生成 an.config.ts 文件内容
	 */
	private generateTsConfigContent(): string {
		return `import { defineConfig } from 'anl/config';

export default defineConfig({
	saveTypeFolderPath: 'src/types',
	saveApiListFolderPath: 'src/apis',
	saveEnumFolderPath: 'src/enums',
	importEnumPath: '../../../enums',
	requestMethodsImportPath: './config/fetch',
	formatting: {
		indentation: '\\t',
		lineEnding: '\\n',
	},
	swaggerConfig: [
		{
			url: 'https://generator3.swagger.io/openapi.json',
			apiListFileName: 'index.ts',
			headers: {},
			dataLevel: 'serve',
			parameterSeparator: '_',
			includeInterface: [],
			excludeInterface: [],
		},
	],
	enmuConfig: {
		erasableSyntaxOnly: false,
		varnames: 'enum-varnames',
		comment: 'enum-descriptions',
	},
});
`;
	}

	/**
	 * 解析 --service 输入，定位选中的服务索引集合。
	 * 匹配优先级：name（显式声明） > apiListFileName 去扩展名（即 segment 派生值）。
	 * 不匹配的 token 会汇总后报错。
	 */
	private resolveSelectedServiceIndices(servers: NormalizedSwaggerServer[], requested: string[]): number[] {
		const tokenToIndex = new Map<string, number>();
		servers.forEach((server, idx) => {
			if (server.name) {
				tokenToIndex.set(server.name.toLowerCase(), idx);
			}
		});
		// apiListFileName 去扩展名作为兜底匹配，且不会覆盖已有 name 索引
		servers.forEach((server, idx) => {
			const seg = computeSegment(server.apiListFileName).toLowerCase();
			if (seg && !tokenToIndex.has(seg)) {
				tokenToIndex.set(seg, idx);
			}
		});

		const selected = new Set<number>();
		const unknown: string[] = [];
		for (const raw of requested) {
			const key = raw.toLowerCase();
			const idx = tokenToIndex.get(key);
			if (idx === undefined) unknown.push(raw);
			else selected.add(idx);
		}

		if (unknown.length) {
			const available = servers
				.map((s) => s.name || computeSegment(s.apiListFileName))
				.filter(Boolean)
				.join(', ');
			throw new Error(`未找到匹配的 swagger 服务：${unknown.join(', ')}。可用服务：${available || '<无>'}`);
		}

		return Array.from(selected).sort((a, b) => a - b);
	}

	/**
	 * 交互式选择需要重新生成的服务（多选）。
	 * 仅在 TTY 环境调用，调用方需要确保 stdout/stdin 是 TTY。
	 */
	private async promptSelectServices(servers: NormalizedSwaggerServer[]): Promise<number[]> {
		const choices = servers.map((server, idx) => {
			const id = server.name || computeSegment(server.apiListFileName) || `#${idx}`;
			return {
				name: `${id}  (${server.apiListFileName}  ←  ${server.url})`,
				value: idx,
				short: id,
			};
		});

		const { picked } = await inquirer.prompt<{ picked: number[] }>([
			{
				type: 'checkbox',
				name: 'picked',
				message: '请选择需要重新生成的 swagger 服务（空选 = 全部）：',
				choices,
				pageSize: Math.min(20, choices.length),
			},
		]);

		// 空选视为全选，保持与传统全量行为一致
		if (!picked || picked.length === 0) return servers.map((_, i) => i);
		return picked.sort((a, b) => a - b);
	}

	async initialize(show?: 'miss' | 'gen', formatOption?: string | boolean, logLevel?: string, requestedServices?: string[]): Promise<void> {
		const projectRoot = process.cwd();

		try {
			const userConfig = await this.getConfig(projectRoot);
			const mergedConfig = { ...configContent, ...userConfig };

			// 设置日志输出级别：命令行参数优先于配置文件
			const resolvedLogLevel = (logLevel ?? mergedConfig.logLevel) as LogLevel | undefined;
			if (resolvedLogLevel) {
				setLogLevel(resolvedLogLevel);
			}

			const hasUserswaggerConfig = Object.prototype.hasOwnProperty.call(userConfig, 'swaggerConfig');
			const servers = this.normalizeswaggerConfig(mergedConfig, hasUserswaggerConfig);

			if (!isConfigFile) return;

			// 多服务时按 apiListFileName 派生 segment 进行目录隔离，并校验 segment 唯一性
			// 注意：isolateBySegment 必须基于 "原始 servers 总数"，与 --service 过滤无关
			const isolateBySegment = servers.length > 1;
			const segments = isolateBySegment ? servers.map((s) => computeSegment(s.apiListFileName)) : servers.map(() => '');
			if (isolateBySegment) {
				const seen = new Map<string, number>();
				segments.forEach((seg, idx) => {
					if (!seg) {
						throw new Error(`swaggerConfig[${idx}].apiListFileName="${servers[idx].apiListFileName}" 无法派生有效 segment（清洗后为空），请使用包含字母/数字的文件名。`);
					}
					if (seen.has(seg)) {
						throw new Error(
							`swaggerConfig 多个服务的 apiListFileName 在派生 segment 时冲突："${servers[seen.get(seg)!].apiListFileName}" 与 "${servers[idx].apiListFileName}" 都解析为 "${seg}"，请改名以避免目录覆盖。`,
						);
					}
					seen.set(seg, idx);
				});
			}

			// 决定本次需要生成的服务索引
			let selectedIndices: number[];
			let isSelective: boolean;
			if (requestedServices?.length) {
				selectedIndices = this.resolveSelectedServiceIndices(servers, requestedServices);
				isSelective = selectedIndices.length !== servers.length;
			} else if (servers.length > 1 && process.stdin.isTTY && process.stdout.isTTY) {
				// 多服务且交互式终端：弹出多选
				log.print(chalk.cyan('\n检测到多个 swagger 服务，请选择本次要重新生成的服务：'));
				selectedIndices = await this.promptSelectServices(servers);
				isSelective = selectedIndices.length !== servers.length;
			} else {
				selectedIndices = servers.map((_, i) => i);
				isSelective = false;
			}

			// 打印本次执行计划
			this.printExecutionPlan(servers, selectedIndices, isSelective);

			// 创建目标目录（如果不存在）
			await fs.promises.mkdir(mergedConfig.saveApiListFolderPath, { recursive: true });

			// 复制 ajax 配置文件
			await this.copyAjaxConfigFiles(mergedConfig.saveApiListFolderPath);

			if (isSelective) {
				// 选择型：精准清理被选中的服务对应文件/目录，绝不动其他服务的产物
				await this.cleanSelectedTargets(mergedConfig, servers, selectedIndices, segments, isolateBySegment);
			} else {
				// 全量：保持原有清理策略
				await clearDirExcept(mergedConfig.saveApiListFolderPath, ['config']);
				await clearDir(mergedConfig.saveTypeFolderPath);
				await clearDir(mergedConfig.saveEnumFolderPath);
			}

			const showSummary: { serverUrl: string; list: { path: string; method: string }[] }[] = [];

			// 逐个 swagger 服务生成
			// 选择型：appendMode 恒为 true（基于已有 index 合并写入，不会污染其他服务）
			// 全量：保持原行为，第一个服务负责重写 index，后续 append
			for (let order = 0; order < selectedIndices.length; order++) {
				const i = selectedIndices[order];
				const serverConfig = this.buildServerConfig(mergedConfig, servers[i], segments[i]);
				const appendMode = isSelective ? true : order > 0;
				const list = await this.handle(serverConfig, appendMode, show);
				if (show && list) showSummary.push({ serverUrl: servers[i].url, list });
			}

			// 多服务隔离时，写入顶层 models 聚合 barrel
			if (isolateBySegment) {
				await this.writeTopLevelModelsBarrel(mergedConfig, segments, selectedIndices, isSelective);
			}

			// 对生成文件进行格式化（仅当用户传入 --format 参数时执行）
			if (formatOption !== undefined && formatOption !== false) {
				if (isSelective) {
					await this.formatSelectedFiles(mergedConfig, servers, selectedIndices, segments, isolateBySegment, formatOption);
				} else {
					await this.formatGeneratedFiles(mergedConfig, formatOption);
				}
			}

			log.banner('All done — see you next time!');

			if (show && showSummary.length > 0) {
				const label = show === 'miss' ? 'excludeInterface' : 'includeInterface';
				for (const { serverUrl, list } of showSummary) {
					if (selectedIndices.length > 1) log.print(chalk.cyan(`\n[${label}] ${serverUrl}`));
					else log.print(chalk.cyan(`\n[${label}]`));
					log.print(JSON.stringify(list, null, 2));
				}
				log.print('\n');
			}
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			log.error(`Initialization failed: ${message}`);
			process.exitCode = 1;
		}
	}

	/**
	 * 打印本次将要执行的服务清单（选中/跳过）。
	 */
	private printExecutionPlan(servers: NormalizedSwaggerServer[], selectedIndices: number[], isSelective: boolean): void {
		const selectedSet = new Set(selectedIndices);
		log.print(chalk.cyan(isSelective ? '\n[anl type] 选择型生成，仅处理以下服务：' : '\n[anl type] 全量生成，将处理所有服务：'));
		servers.forEach((server, idx) => {
			const id = server.name || computeSegment(server.apiListFileName) || `#${idx}`;
			if (selectedSet.has(idx)) {
				log.print(`  ${chalk.green('●')} ${id}  (${server.apiListFileName})  ${chalk.gray(server.url)}`);
			} else {
				log.print(`  ${chalk.gray('○ skip ')}${id}  (${server.apiListFileName})  ${chalk.gray(server.url)}`);
			}
		});
		log.print('');
	}

	/**
	 * 选择型清理：仅删除被选中服务对应的 API 文件、connectors/<seg>、models/<seg>。
	 * 共享的 enum 目录不清理（写入时按文件覆盖，index.ts 通过 appendMode 合并去重）。
	 */
	private async cleanSelectedTargets(
		baseConfig: ConfigType,
		servers: NormalizedSwaggerServer[],
		selectedIndices: number[],
		segments: string[],
		isolateBySegment: boolean,
	): Promise<void> {
		for (const i of selectedIndices) {
			const apiFilePath = `${baseConfig.saveApiListFolderPath}/${servers[i].apiListFileName}`;
			await clearDir(apiFilePath);

			if (isolateBySegment) {
				const seg = segments[i];
				if (seg) {
					await clearDir(`${baseConfig.saveTypeFolderPath}/connectors/${seg}`);
					await clearDir(`${baseConfig.saveTypeFolderPath}/models/${seg}`);
				}
			} else {
				// 单服务模式 = 全量等价，按全量逻辑清理
				await clearDir(`${baseConfig.saveTypeFolderPath}/connectors`);
				await clearDir(`${baseConfig.saveTypeFolderPath}/models`);
			}
		}
	}

	/**
	 * 顶层 models/index.ts 聚合 barrel 写入。
	 * 全量：直接重写为所有 segment 的导出。
	 * 选择型：读取现有 barrel + 合并所选 segment 的导出，去重写回，避免丢失其他服务的导出。
	 */
	private async writeTopLevelModelsBarrel(baseConfig: ConfigType, segments: string[], selectedIndices: number[], isSelective: boolean): Promise<void> {
		const barrelPath = `${baseConfig.saveTypeFolderPath}/models/index.ts`;

		const targetSegments = isSelective ? selectedIndices.map((i) => segments[i]).filter(Boolean) : segments.filter(Boolean);
		const newExports = targetSegments.map((seg) => `export * from './${seg}';`);

		let merged: string[];
		if (isSelective) {
			let existing: string[] = [];
			try {
				const current = await fs.promises.readFile(barrelPath, 'utf8');
				existing = current.split('\n').filter((line) => line.trim() !== '');
			} catch {
				existing = [];
			}
			const set = new Set(existing);
			merged = [...existing];
			for (const line of newExports) {
				if (!set.has(line)) {
					merged.push(line);
					set.add(line);
				}
			}
		} else {
			merged = newExports;
		}

		const content = merged.join('\n') + '\n';
		await writeFileRecursive(barrelPath, content);
		log.info(`${barrelPath} - Top-level models barrel ${isSelective ? 'merged' : 'written'}.`);
	}

	/**
	 * 选择型格式化：仅格式化被选中的服务对应的产物，避免误格式化其他服务文件。
	 */
	private async formatSelectedFiles(
		config: ConfigType,
		servers: NormalizedSwaggerServer[],
		selectedIndices: number[],
		segments: string[],
		isolateBySegment: boolean,
		formatOption: string | boolean,
	): Promise<void> {
		const targets: string[] = [];
		for (const i of selectedIndices) {
			const apiFile = `${config.saveApiListFolderPath}/${servers[i].apiListFileName}`;
			try {
				await fs.promises.access(apiFile);
				targets.push(`"${apiFile}"`);
			} catch {
				/* ignore */
			}

			const segDirs =
				isolateBySegment && segments[i]
					? [`${config.saveTypeFolderPath}/connectors/${segments[i]}`, `${config.saveTypeFolderPath}/models/${segments[i]}`]
					: [`${config.saveTypeFolderPath}/connectors`, `${config.saveTypeFolderPath}/models`];
			for (const dir of segDirs) {
				try {
					await fs.promises.access(dir);
					targets.push(`"${dir}/**/*.{ts,d.ts}"`);
				} catch {
					/* ignore */
				}
			}
		}

		if (targets.length === 0) {
			log.warning('No files to format for the selected services.');
			return;
		}

		const prettierBin = await this.resolvePrettierExecutable();
		let configFlag = '';
		if (typeof formatOption === 'string' && formatOption.trim()) {
			const configPath = path.resolve(process.cwd(), formatOption.trim());
			try {
				await fs.promises.access(configPath);
				configFlag = ` --config "${configPath}"`;
			} catch {
				const detected = await this.detectPrettierConfig();
				if (detected) configFlag = ` --config "${detected}"`;
			}
		} else {
			const detected = await this.detectPrettierConfig();
			if (detected) configFlag = ` --config "${detected}"`;
		}

		const formatCommand = `${prettierBin} --write ${targets.join(' ')}${configFlag}`;
		try {
			spinner.start('Formatting selected files...');
			await new Promise<void>((resolve, reject) => {
				exec(formatCommand, (error) => {
					if (error) reject(new Error(String(error)));
					else resolve();
				});
			});
			spinner.success('File formatting successful');
			log.print('\n');
		} catch (error: unknown) {
			spinner.error('Format failed');
			log.print(error);
			log.error('Format failed, please manually execute the following command:');
			log.print('$', chalk.yellow(formatCommand));
		}
	}
}

if (isDebug) {
	const instance = new Main();
	instance.initialize().catch((error) => {
		console.error(error);
	});
}
