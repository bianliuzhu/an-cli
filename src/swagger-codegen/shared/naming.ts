import type { ConfigType } from '../types';

import { pinyin } from 'pinyin-pro';

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
