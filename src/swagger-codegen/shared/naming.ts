import type { ConfigType } from '../types';

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
