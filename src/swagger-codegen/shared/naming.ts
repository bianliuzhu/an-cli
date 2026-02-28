import type { ConfigType } from '../types';

import { pinyin } from 'pinyin-pro';

/**
 * 检测字符串是否包含中文字符
 */
export function containsChinese(str: string): boolean {
	return /[\u4e00-\u9fff]/.test(str);
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
					.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
					.join('');
			}
			return segment;
		})
		.join('');
}

/**
 * 将 schema 名称标准化：如果包含中文则转为拼音命名
 * 返回 { originalName, resolvedName } 以支持映射查找
 */
export function resolveSchemaName(name: string): string {
	return containsChinese(name) ? chineseNameToEnglish(name) : name;
}

export function typeNameToFileName(str: string): string {
	return str
		.replace(/_/g, '-')
		.replace(/([a-z])([A-Z])/g, '$1-$2')
		.toLowerCase()
		.replace(/-+/g, '-');
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
