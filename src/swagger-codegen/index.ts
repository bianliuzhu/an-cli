import type {
	CodegenConfig,
	ComponentSchemas,
	ConfigType,
	GeneratedInterface,
	GenerationSummary,
	IConfigSwaggerServer,
	InterfaceOutputMode,
	LogLevel,
	NormalizedSwaggerServer,
	PathsObject,
	RequestTemplate,
} from './types';

import chalk from 'chalk';
import fs from 'fs';
import inquirer from 'inquirer';
import { createJiti } from 'jiti';
import path from 'path';

import { clearDir, clearDirExcept, log, setLogLevel, spinner, writeFileRecursive } from '../utils';
import Components from './components/index';
import { createDefaultConfig, renderTsConfig } from './config-template';
import { getSwaggerJson } from './get-data';
import PathParse from './path/index';
import { DEFAULT_REQUEST_TEMPLATE } from './shared/constants';
import { computeSegment, getServiceIdentifier, getServiceTag, isEnumIsolated, segmentToNamespacePrefix } from './shared/naming';
import { normalizeOpenApiDocument } from './shared/openapi-document';
import { formatGeneratedFiles } from './shared/prettier';
import { copyAjaxConfigFiles, normalizeRequestTemplate } from './shared/request-template';
import { SchemaDiagnostics } from './shared/schema-diagnostics';
import { mergeNamespaceExports, readIndexLines } from './shared/writer';

let isConfigFile: boolean;

const isDebug = process.env.NODE_ENV === 'debug';
const requestTemplateDir = isDebug ? path.join(__dirname, '..', '..', 'postbuild-assets', 'request-templates') : path.join(__dirname, '..', 'request-templates');

const configContent = createDefaultConfig();
if (isDebug) {
	configContent.saveTypeFolderPath = 'apps/types';
	configContent.saveApiListFolderPath = 'apps/types';
	configContent.saveEnumFolderPath = 'apps/enums';
}

export class Main {
	private schemas: ComponentSchemas = {};
	private paths: PathsObject = {};

	/**
	 * 处理 Swagger 数据
	 */
	private async handle(config: ConfigType, appendMode: boolean, show?: InterfaceOutputMode): Promise<GeneratedInterface[] | null> {
		const tag = getServiceTag(config);
		// 一个服务一段：使用 section 标题展示服务名 + URL，下面所有子任务无需重复 tag
		log.section(tag || 'service', config.swaggerJsonUrl);
		try {
			// 无论是否为调试模式，都优先按配置从 swaggerConfig.url 获取数据
			// 若需要本地调试示例数据，可以在 an.config.json 中将 swaggerConfig.url
			// 配置为本地文件路径（例如 ./data/openapi.json.js），getSwaggerJson 会自动处理。
			spinner.start('Fetching Swagger data...');
			const document = await getSwaggerJson(config);

			if (!document) {
				spinner.error('Failed to fetch Swagger data');
				throw new Error('无法获取 Swagger 数据');
			}
			const response = normalizeOpenApiDocument(document, (message) => log.warn(message));
			spinner.success('Swagger data fetched');

			this.schemas = response.components?.schemas ?? {};
			this.paths = response.paths ?? {};

			const diagnostics = new SchemaDiagnostics(response);
			const components = new Components(this.schemas, config, { appendMode }, diagnostics);
			const paths = new PathParse(this.paths, response.components?.parameters, this.schemas, config, diagnostics);

			spinner.start('Generating types and APIs...');
			await components.handle();
			await paths.handle();
			spinner.success('Types and APIs generated');
			diagnostics.flush((message, level) => {
				if (level === 'info') log.print(message);
				else if (level === 'verbose') log.verbose(message);
				else log.warn(message);
			});

			if (show === 'gen') return paths.getGeneratedInterfacesForOutput();
			if (show === 'miss') return paths.getMissingInterfacesForOutput();
			return null;
		} catch (error: unknown) {
			spinner.error('Swagger generation failed');
			if (error instanceof Error) {
				throw new Error(`Handle Swagger data failed: ${error.message}`);
			}
			throw new Error('Handle Swagger data failed: unknown error');
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
			const namespaceIsolation = server.namespaceIsolation ?? config.namespaceIsolation ?? 'segment';
			const enumIsolation = server.enumIsolation ?? config.enumIsolation ?? 'segment';

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
				namespaceIsolation,
				enumIsolation,
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
	 * @param namespacePrefix 预计算的 namespace 前缀（可与 segment 独立）；空串表示不加前缀
	 */
	private buildServerConfig(baseConfig: ConfigType, server: NormalizedSwaggerServer, segment: string, namespacePrefix: string): CodegenConfig {
		const result: CodegenConfig = {
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
			namespaceIsolation: server.namespaceIsolation ?? baseConfig.namespaceIsolation ?? 'segment',
			enumIsolation: server.enumIsolation ?? baseConfig.enumIsolation ?? 'segment',
			swaggerConfig: server,
			// 内部字段：当多服务隔离时携带 segment，下游通过 getServerSegment 读取
			__segment: segment,
			// 内部字段：预计算的 namespace 前缀，下游通过 getNamespacePrefix 读取
			__namespacePrefix: namespacePrefix,
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
	 * @param templateOverride 首次自动创建骨架时使用的请求模板；若无则在 TTY 场景弹出交互选择，非 TTY 使用默认 'axios'
	 */
	private async getConfig(projectRoot: string, templateOverride?: string): Promise<ConfigType> {
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

		// 决定骨架里写入的 requestTemplate
		let template: RequestTemplate = DEFAULT_REQUEST_TEMPLATE;
		if (templateOverride) {
			template = normalizeRequestTemplate(templateOverride, 'CLI --template');
		} else if (process.stdin.isTTY && process.stdout.isTTY) {
			const { picked } = await inquirer.prompt<{ picked: RequestTemplate }>([
				{
					type: 'list',
					name: 'picked',
					message: '请选择请求模板（决定 <saveApiListFolderPath>/config/ 下的底层实现）：',
					choices: [
						{ name: 'axios   —— 基于 axios（浏览器/Node，需 npm i axios）', value: 'axios' },
						{ name: 'fetch   —— 基于原生 fetch（浏览器/现代 Node，无额外依赖）', value: 'fetch' },
						{ name: 'wx      —— 基于 wx.request（微信小程序）', value: 'wx' },
						{ name: 'uniapp  —— 基于 uni.request（uni-app 跨端）', value: 'uniapp' },
						{ name: 'taro    —— 基于 Taro.request（Taro 3+ 跨端）', value: 'taro' },
					],
					default: 'axios',
				},
			]);
			template = picked;
		} else {
			log.warning(`未指定 --template 且当前非交互终端，requestTemplate 默认为 "${DEFAULT_REQUEST_TEMPLATE}"。可通过 --template 指定或修改 an.config.ts 后重跑。`);
		}

		const initialConfig = createDefaultConfig(template);
		const tsContent = renderTsConfig(initialConfig);
		await writeFileRecursive(tsConfigPath, tsContent);

		// 骨架生成的同时把 config/ 也落地，避免用户需要"跑两次"才拿到底层请求实现
		try {
			await fs.promises.mkdir(initialConfig.saveApiListFolderPath, { recursive: true });
			await copyAjaxConfigFiles(initialConfig.saveApiListFolderPath, template, requestTemplateDir);
			log.success(`配置文件已创建（requestTemplate=${template}），并已同步初始化 ${initialConfig.saveApiListFolderPath}/config/。请检查 an.config.ts 后重新运行以生成 API。`);
		} catch (err) {
			log.warning(`初始化 ${initialConfig.saveApiListFolderPath}/config/ 失败：${err instanceof Error ? err.message : String(err)}。配置文件已创建，请修正后重跑。`);
		}
		return initialConfig;
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
				.map((s) => s.name ?? computeSegment(s.apiListFileName))
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
			const id = getServiceIdentifier(server, idx);
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

	async initialize(show?: InterfaceOutputMode, formatOption?: string | boolean, logLevel?: string, requestedServices?: string[], templateOverride?: string): Promise<void> {
		const projectRoot = process.cwd();

		try {
			const userConfig = await this.getConfig(projectRoot, templateOverride);
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
					// 'index' 会与顶层 models/index.ts 自身冲突（export * from './index' 自引用），强制改名
					if (seg.toLowerCase() === 'index') {
						throw new Error(
							`swaggerConfig[${idx}].apiListFileName="${servers[idx].apiListFileName}" 派生 segment 为 "index"，会与顶层 models/index.ts 形成自引用，请改为其他文件名（如 "main.ts" / "default.ts"）。`,
						);
					}
					if (seen.has(seg)) {
						throw new Error(
							`swaggerConfig 多个服务的 apiListFileName 在派生 segment 时冲突："${servers[seen.get(seg)!].apiListFileName}" 与 "${servers[idx].apiListFileName}" 都解析为 "${seg}"，请改名以避免目录覆盖。`,
						);
					}
					seen.set(seg, idx);
				});
			}

			// 计算每个服务的 namespace 前缀（与 segment 隔离独立，单服务也可生效）
			// - 'none'：始终为空
			// - 'segment'（默认）：从 apiListFileName 派生，能派生出非空 segment 即加前缀
			const prefixes = servers.map((server) => {
				const isolation = server.namespaceIsolation ?? mergedConfig.namespaceIsolation ?? 'segment';
				if (isolation === 'none') return '';
				const seg = computeSegment(server.apiListFileName);
				return segmentToNamespacePrefix(seg);
			});

			// 多服务且任一服务关闭了 namespace 前缀时，提示存在跨服务全局 namespace 合并污染风险
			if (isolateBySegment) {
				const noneServers = servers
					.map((s, idx) => ({ s, idx }))
					.filter(({ s }) => (s.namespaceIsolation ?? mergedConfig.namespaceIsolation ?? 'segment') === 'none')
					.map(({ s }) => s.apiListFileName);
				if (noneServers.length > 0) {
					log.warning(
						`检测到多服务场景下以下服务关闭了 namespace 前缀（namespaceIsolation: 'none'）：${noneServers.join(', ')}。` +
							` 不同服务若存在同名 path，将会因 declare namespace 全局合并而互相污染类型，请确认是否符合预期。`,
					);
				}

				// 校验 prefix 唯一性，避免不同 segment（如 'op' / 'OP'）派生同一 prefix
				const prefixSeen = new Map<string, number>();
				prefixes.forEach((prefix, idx) => {
					if (!prefix) return;
					if (prefixSeen.has(prefix)) {
						throw new Error(
							`swaggerConfig 多个服务派生的 namespace 前缀冲突："${servers[prefixSeen.get(prefix)!].apiListFileName}" 与 "${servers[idx].apiListFileName}" 都解析为前缀 "${prefix}"，请改名以避免类型同名合并。`,
						);
					}
					prefixSeen.set(prefix, idx);
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

			// 解析请求模板：CLI 覆盖 > 配置文件 > 默认 'axios'
			const resolvedTemplate = templateOverride
				? normalizeRequestTemplate(templateOverride, 'CLI --template')
				: normalizeRequestTemplate(mergedConfig.requestTemplate, 'an.config');

			// 复制请求模板文件
			await copyAjaxConfigFiles(mergedConfig.saveApiListFolderPath, resolvedTemplate, requestTemplateDir);

			if (isSelective) {
				// 选择型：精准清理被选中的服务对应文件/目录，绝不动其他服务的产物
				await this.cleanSelectedTargets(mergedConfig, servers, selectedIndices, segments, isolateBySegment);
			} else {
				// 全量：保持原有清理策略
				await clearDirExcept(mergedConfig.saveApiListFolderPath, ['config']);
				await clearDir(mergedConfig.saveTypeFolderPath);
				await clearDir(mergedConfig.saveEnumFolderPath);
			}

			const showSummary: GenerationSummary[] = [];

			// 逐个 swagger 服务生成
			// 选择型：appendMode 恒为 true（基于已有 index 合并写入，不会污染其他服务）
			// 全量：保持原行为，第一个服务负责重写 index，后续 append
			for (let order = 0; order < selectedIndices.length; order++) {
				const i = selectedIndices[order];
				const serverConfig = this.buildServerConfig(mergedConfig, servers[i], segments[i], prefixes[i]);
				const appendMode = isSelective ? true : order > 0;
				const list = await this.handle(serverConfig, appendMode, show);
				if (show && list) showSummary.push({ serverUrl: servers[i].url, list });
			}

			// 多服务隔离时，写入顶层 models 聚合 barrel
			if (isolateBySegment) {
				await this.writeTopLevelModelsBarrel(mergedConfig, segments, selectedIndices, isSelective);
				// 至少有一个被选中的服务开启了 enum 隔离时，写入顶层 enums 聚合 barrel
				if (selectedIndices.some((index) => isEnumIsolated(servers[index]) && segments[index])) {
					await this.writeTopLevelEnumsBarrel(mergedConfig, segments, servers, selectedIndices, isSelective);
				}
				// 仅当所有服务都启用了 enum 隔离时，顶层残留 *.ts 必定是旧版升级遗留，主动提示用户清理；
				// 否则（存在 enumIsolation: 'none' 服务）顶层文件是合法产物，不能误报。
				const allIsolated = servers.every(isEnumIsolated);
				if (allIsolated) {
					await this.warnLegacyTopLevelEnums(mergedConfig);
				}
			}

			// 对生成文件进行格式化（仅当用户传入 --format 参数时执行）
			if (formatOption !== undefined && formatOption !== false) {
				await formatGeneratedFiles(mergedConfig, formatOption, isSelective ? { servers, selectedIndices, segments, isolateBySegment } : undefined);
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
			const id = getServiceIdentifier(server, idx);
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
	 * 当 enumIsolation === 'segment' 时，同步清理 enums/<seg>；
	 * 否则共享的 enum 顶层目录不清理（写入时按文件覆盖，index.ts 通过 appendMode 合并去重）。
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
					if (isEnumIsolated(servers[i])) {
						await clearDir(`${baseConfig.saveEnumFolderPath}/${seg}`);
					}
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
	 *
	 * 采用 namespace re-export 形式：`export * as Op from './op';`
	 * - 避免不同服务模型同名（如 ChaXunRuCan / FanHuiDTO 等通用拼音名）触发 TS2308 歧义。
	 * - 业务侧用法：`import { Op } from '@/types/models'; type T = Op.FanHuiDTO;`
	 *   或继续用扁平桶：`import { FanHuiDTO } from '@/types/models/op';`
	 *
	 * 全量：直接重写为所有 segment 的导出。
	 * 选择型：读取现有 barrel + 合并所选 segment 的导出（按 segment 去重），保留其他服务行。
	 */
	private async writeTopLevelModelsBarrel(baseConfig: ConfigType, segments: string[], selectedIndices: number[], isSelective: boolean): Promise<void> {
		const barrelPath = `${baseConfig.saveTypeFolderPath}/models/index.ts`;
		const targetSegments = isSelective ? selectedIndices.map((i) => segments[i]).filter(Boolean) : segments.filter(Boolean);
		const existing = isSelective ? await readIndexLines(barrelPath) : [];
		const merged = mergeNamespaceExports(existing, targetSegments, targetSegments, isSelective);

		const content = merged.join('\n') + '\n';
		await writeFileRecursive(barrelPath, content);
		log.info(`${barrelPath} - Top-level models barrel ${isSelective ? 'merged' : 'written'}.`);
	}

	/**
	 * 顶层 enums/index.ts 聚合 barrel 写入（与 writeTopLevelModelsBarrel 对称）。
	 *
	 * 采用 namespace re-export 形式：`export * as Op from './op';`
	 * - 业务侧用法：`import { Op } from '@/enums'; const s = Op.Status.Enabled;`
	 *   或继续用扁平桶：`import { Status } from '@/enums/op';`
	 *
	 * 仅会处理 enumIsolation === 'segment' 的服务；
	 * enumIsolation === 'none' 的服务的 enum 仍位于顶层目录（与历史行为一致），
	 * 由 warnLegacyTopLevelEnums 给出迁移提示。
	 */
	private async writeTopLevelEnumsBarrel(
		baseConfig: ConfigType,
		segments: string[],
		servers: NormalizedSwaggerServer[],
		selectedIndices: number[],
		isSelective: boolean,
	): Promise<void> {
		const barrelPath = `${baseConfig.saveEnumFolderPath}/index.ts`;

		const targetIndices = isSelective ? selectedIndices : segments.map((_, index) => index);
		const candidateSegments = targetIndices
			.filter((index) => isEnumIsolated(servers[index]))
			.map((index) => segments[index])
			.filter(Boolean);

		const uniqueCandidateSegments = Array.from(new Set(candidateSegments));
		const existsChecks = await Promise.all(
			uniqueCandidateSegments.map(async (seg) => {
				const segDir = `${baseConfig.saveEnumFolderPath}/${seg}`;
				try {
					const entries = await fs.promises.readdir(segDir, { withFileTypes: true });
					const hasEnumFiles = entries.some((entry) => entry.isFile() && /\.(d\.)?ts$/.test(entry.name) && entry.name !== 'index.ts');
					return hasEnumFiles ? seg : '';
				} catch {
					return '';
				}
			}),
		);
		const generatedSegments = existsChecks.filter(Boolean);
		const existing = await readIndexLines(barrelPath);
		const merged = mergeNamespaceExports(existing, uniqueCandidateSegments, generatedSegments);

		const content = merged.join('\n') + '\n';
		await writeFileRecursive(barrelPath, content);
		log.info(`${barrelPath} - Top-level enums barrel ${isSelective ? 'merged' : 'written'}.`);
	}

	/**
	 * 多服务隔离模式下，若 saveEnumFolderPath 顶层仍残留 *.ts 枚举文件，
	 * 极有可能是从旧版（共享枚举）升级而来，主动提示用户重跑全量或手动清理，避免新旧引用混存。
	 */
	private async warnLegacyTopLevelEnums(baseConfig: ConfigType): Promise<void> {
		const dir = baseConfig.saveEnumFolderPath;
		try {
			const entries = await fs.promises.readdir(dir, { withFileTypes: true });
			const stale = entries.filter((e) => e.isFile() && e.name.endsWith('.ts') && e.name !== 'index.ts').map((e) => e.name);
			if (stale.length > 0) {
				log.warning(
					`检测到 ${dir} 顶层仍存在历史枚举文件（${stale.slice(0, 5).join(', ')}${stale.length > 5 ? ' ...' : ''}），共 ${stale.length} 个。\n` +
						`若已切换到 enumIsolation: 'segment'（默认），建议执行 \`anl type\` 全量重生成或手动清理这些文件，避免与 ${dir}/<segment>/ 下的隔离枚举混用。`,
				);
			}
		} catch {
			// 目录不存在或无权限：忽略
		}
	}
}

if (isDebug) {
	const instance = new Main();
	instance.initialize().catch((error) => {
		console.error(error);
	});
}
