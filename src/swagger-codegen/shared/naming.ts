import type { ConfigType } from '../types';

import { pinyin } from 'pinyin-pro';

import { log } from '../../utils';

/**
 * 检测字符串是否包含中文字符
 */
export function containsChinese(str: string): boolean {
	return /[\u4e00-\u9fff]/.test(str);
}

/**
 * 首字母大写
 */
export function capitalize(word: string): string {
	if (!word) return '';
	return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * 按非标识符字符分割字符串，将每个单词首字母大写后拼接（PascalCase）
 * - "banner VO" -> "BannerVO"
 * - "(SKU)" -> "SKU"
 * - "«string»" -> "String"
 * - "Optional?" -> "Optional"
 */
export function wordsToPascalCase(str: string): string {
	return str
		.split(/[^a-zA-Z0-9_]+/)
		.filter(Boolean)
		.map((word) => capitalize(word))
		.join('');
}

/**
 * 将中文名称转换为 PascalCase 拼音命名
 * 保留非中文部分（如 SKU、Result、Message 等）
 *
 * 例如：
 * - "三方商品SKU对象入参" -> "SanFangShangPinSKUDuiXiangRuCan"
 * - "ResultMessage三方商品SKU对象入参" -> "ResultMessageSanFangShangPinSKUDuiXiangRuCan"
 * - "IPage试用权益配置表返回DTO" -> "IPageShiYongQuanYiPeiZhiBiaoFanHuiDTO"
 */
export function chineseNameToEnglish(name: string): string {
	if (!containsChinese(name)) return name;

	// 将字符串按中文和非中文部分分割
	const segments = name.match(/[\u4e00-\u9fff]+|[^\u4e00-\u9fff]+/g) ?? [];

	return segments
		.map((segment) => {
			if (containsChinese(segment)) {
				// 为中文部分生成拼音，每个字首字母大写
				return pinyin(segment, { toneType: 'none', type: 'array' })
					.map((p) => capitalize(p))
					.join('');
			}
			return wordsToPascalCase(segment);
		})
		.join('');
}

/**
 * 确保名称是合法的 TypeScript 标识符
 * - 空字符串返回 'Unknown'
 * - 数字开头加 '_' 前缀
 */
function ensureValidIdentifier(name: string): string {
	if (!name) return 'Unknown';
	return /^[0-9]/.test(name) ? `_${name}` : name;
}

/**
 * 将 schema 名称标准化：如果包含中文则转为拼音命名，处理空格和特殊字符等非法标识符字符
 */
export function resolveSchemaName(name: string): string {
	if (!name) return 'Unknown';
	if (containsChinese(name)) {
		return ensureValidIdentifier(chineseNameToEnglish(name));
	}
	// 检测是否包含非法标识符字符（非字母、数字、下划线、$）
	if (/[^a-zA-Z0-9_$]/.test(name)) {
		return ensureValidIdentifier(wordsToPascalCase(name));
	}
	return ensureValidIdentifier(name);
}

export function typeNameToFileName(str: string): string {
	return str
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.toLowerCase()
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

/**
 * 由 `apiListFileName` 派生 segment（用于隔离生成目录）。
 *
 * 仅取 basename 并去除扩展名，再清洗为合法目录名（[a-zA-Z0-9_-]）。
 *
 * 例：
 * - 'bff.ts' -> 'bff'
 * - 'a/b/notice.ts' -> 'notice'
 * - 'bad name!.ts' -> 'bad-name'
 */
export function computeSegment(apiListFileName: string | undefined): string {
	const raw = (apiListFileName ?? '').trim();
	if (!raw) return '';
	const base = raw.split(/[\\/]/).pop() ?? '';
	const noExt = base.replace(/\.[^.]+$/, '');
	const cleaned = noExt.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
	return cleaned;
}

/**
 * 读取预先计算好的 segment（在 buildServerConfig 阶段写入 `__segment`）。
 * 多服务隔离时返回非空字符串，否则返回空串。
 */
export function getServerSegment(config: object): string {
	return (config as { __segment?: string }).__segment ?? '';
}

/**
 * 把 segment（kebab/snake/dot 形式）转为 PascalCase，作为命名空间前缀。
 * - 'op' -> 'Op'
 * - 'agents' -> 'Agents'
 * - 'dot-digital-human' -> 'DotDigitalHuman'
 * - '123abc' -> '_123abc'（数字开头需补下划线以保证 TS 标识符合法）
 * - '' -> ''
 */
export function segmentToNamespacePrefix(segment: string): string {
	if (!segment) return '';
	const result = segment
		.split(/[-_.]+/)
		.filter(Boolean)
		.map((word) => capitalize(word.toLowerCase()))
		.join('');
	if (!result) return '';
	// 数字开头补下划线，避免生成非法 TS 标识符
	return /^[0-9]/.test(result) ? `_${result}` : result;
}

/**
 * 基于 segment + namespaceIsolation 决定 namespace 前缀。
 *
 * 优先读取 buildServerConfig 阶段预计算的 `__namespacePrefix`（允许单服务也能出现前缀，
 * 只要能从 apiListFileName 派生 segment）；未写入时回退到“读 __segment + isolation”的旧逻辑。
 */
export function getNamespacePrefix(config: ConfigType): string {
	const injected = (config as { __namespacePrefix?: string }).__namespacePrefix;
	if (typeof injected === 'string') return injected;
	const isolation = config.namespaceIsolation ?? 'segment';
	if (isolation === 'none') return '';
	const segment = getServerSegment(config);
	return segmentToNamespacePrefix(segment);
}

/**
 * 生成用于日志输出的服务标签，格式为 `【bff】`。
 * 优先使用 apiListFileName 去扩展名，其次使用 segment，最后使用 url 的 host。
 * 用于在多服务（甚至单服务）模式下区分日志属于哪个 swagger 服务。
 */
export function getServiceTag(config: ConfigType): string {
	const fileName = config.apiListFileName?.replace(/\.[^/.]+$/, '').trim();
	if (fileName) return `【${fileName}】`;
	const segment = getServerSegment(config);
	if (segment) return `【${segment}】`;
	const url = config.swaggerJsonUrl;
	if (url) {
		try {
			const host = new URL(url).host;
			if (host) return `【${host}】`;
		} catch {
			// 非合法 URL（可能为本地文件路径），忽略
		}
	}
	return '';
}

/**
 * 当 models / connectors 多嵌套了一层 segment 子目录时，
 * 需要把用户配置的 importEnumPath 相对路径整体再向上一层。
 *
 * - `./xxx`、`../xxx` 自动追加一层 `../`
 * - 包名 / 路径别名 / 绝对路径保持不变
 * - 裸相对路径（如 `enums`）无法判断语义，发出警告并保持不变
 */
export function adjustImportPathForSegment(importPath: string, segment: string): string {
	if (!segment) return importPath;
	if (!importPath) return importPath;
	if (importPath.startsWith('./') || importPath.startsWith('../')) {
		return '../' + importPath;
	}
	// 绝对路径 / 包名 / alias 不调整
	if (importPath.startsWith('/') || /^[a-zA-Z@]/.test(importPath)) {
		return importPath;
	}
	log.warning(`importEnumPath="${importPath}" 形态不明确，建议以 "./" 或 "../" 开头。多服务隔离已开启，工具未自动补偿层级，请自行确认 enum 引用是否正确。`);
	return importPath;
}

/**
 * 计算当前服务"有效的"枚举 segment：仅当多服务隔离生效（__segment 非空）
 * 且 enumIsolation !== 'none' 时返回 segment，否则返回空串。
 *
 * 与 connectors / models 的目录隔离独立可控，但默认与 segment 隔离同步开启。
 */
export function getEnumSegment(config: ConfigType): string {
	const segment = getServerSegment(config);
	if (!segment) return '';
	const isolation = (config as { enumIsolation?: 'segment' | 'none' }).enumIsolation ?? 'segment';
	if (isolation === 'none') return '';
	return segment;
}

/**
 * 在已经过 `adjustImportPathForSegment` 处理的 enumImportPath 后追加 `/<enumSegment>` 子目录。
 * - 空 enumSegment 直接返回原值
 * - 自动处理末尾斜杠
 */
export function appendEnumSegment(importPath: string, enumSegment: string): string {
	if (!enumSegment) return importPath;
	if (!importPath) return enumSegment;
	const trimmed = importPath.replace(/\/+$/, '');
	return `${trimmed}/${enumSegment}`;
}

export function getEnumTypeName(config: ConfigType, enumName: string): string {
	if (!config.enmuConfig.erasableSyntaxOnly) {
		return enumName;
	}
	return `${enumName}Type`;
}

/**
 * 检查属性名是否需要用引号包裹
 * 如果属性名包含特殊字符（非字母、数字、下划线、$），则需要引号
 */
export function needsQuotes(propertyName: string): boolean {
	// 如果属性名是有效的 JavaScript 标识符，则不需要引号
	// 有效标识符：以字母、_、$ 开头，后续可以包含字母、数字、_、$
	const validIdentifierPattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
	return !validIdentifierPattern.test(propertyName);
}

/**
 * 格式化属性名，如果需要则添加引号
 */
export function formatPropertyName(propertyName: string): string {
	return needsQuotes(propertyName) ? `"${propertyName}"` : propertyName;
}

/**
 * 清洗不规范的标识符名称：
 * 将名称中的中划线 `-` 统一转成下划线 `_`，以便用于 TS 属性名 / 枚举成员名。
 * 例如 `form-data` -> `form_data`，`LIST-CARD` -> `LIST_CARD`。
 * 其他非法标识符字符不在此处处理，仍由 `needsQuotes` / `formatPropertyName` 决定是否加引号。
 */
export function sanitizeIdentifierName(name: string): string {
	if (!name) return name;
	return name.replace(/-/g, '_');
}
