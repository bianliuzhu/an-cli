import { ConfigType } from '../types';

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
