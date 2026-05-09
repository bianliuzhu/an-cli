import type { PathParseConfig } from '../types';

import { getNamespacePrefix } from '../shared/naming';

interface PathPart {
	type: 'normal' | 'param';
	original: string;
	normalized: string;
}

export interface EndpointNamingResult {
	apiName: string;
	fileName: string;
	typeName: string;
	path: string;
}

const DEFAULT_SEPARATOR = '_';

function cleanSegment(segment: string): string {
	let cleaned = segment.replace(/^[0-9]+/, '');
	if (!cleaned) {
		return 'num' + segment;
	}
	cleaned = cleaned.replace(/[^a-zA-Z0-9_.-]/g, '');
	return cleaned;
}

function toCamelCase(segment: string, isFirst = false): string {
	const cleaned = cleanSegment(segment);
	const words = cleaned.split(/[-_.]+/).filter((word) => word.length > 0);
	if (words.length === 0) return '';
	return words
		.map((word, index) => {
			if (index === 0 && isFirst) {
				return word.toLowerCase();
			}
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		})
		.join('');
}

function toPascalCase(segment: string): string {
	const cleaned = cleanSegment(segment);
	const words = cleaned.split(/[-_.]+/).filter((word) => word.length > 0);
	if (words.length === 0) return '';
	return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
}

function normalizePrefix(publicPrefix?: string): string {
	if (!publicPrefix) return '';
	return publicPrefix.replace(/^\/+|\/+$/g, '');
}

function normalizePathPrefix(config: PathParseConfig, rawPath: string): string {
	let normalizedPath = rawPath.replace(/^\/+/, '');
	const normalizedPrefix = normalizePrefix(config.publicPrefix);

	if (normalizedPrefix && normalizedPath.startsWith(normalizedPrefix + '/')) {
		normalizedPath = normalizedPath.slice(normalizedPrefix.length + 1);
	} else if (normalizedPrefix && normalizedPath === normalizedPrefix) {
		normalizedPath = '';
	} else if (normalizedPrefix && normalizedPath.startsWith(normalizedPrefix)) {
		const afterPrefix = normalizedPath.slice(normalizedPrefix.length);
		if (afterPrefix.startsWith('/') || afterPrefix === '') {
			normalizedPath = afterPrefix.replace(/^\/+/, '');
		}
	}
	return normalizedPath;
}

function deduplicateParts(parts: PathPart[]): PathPart[] {
	const deduplicatedParts: PathPart[] = [];
	for (let i = 0; i < parts.length; i++) {
		const current = parts[i];
		const next = parts[i + 1];

		if (current.type === 'normal' && next?.type === 'param') {
			const currentNorm = cleanSegment(current.normalized).toLowerCase().replace(/[-_.]/g, '');
			const nextNorm = cleanSegment(next.normalized).toLowerCase().replace(/[-_.]/g, '');
			if (currentNorm === nextNorm) {
				continue;
			}
		}
		deduplicatedParts.push(current);
	}
	return deduplicatedParts;
}

/**
 * 由 path|METHOD 字符串派生 apiName / typeName / fileName / 实际请求 path。
 *
 * 注意：typeName 末尾会按 `getNamespacePrefix(config)` 的结果加上服务级前缀（用 `_` 连接），
 * 该前缀来自 buildServerConfig 注入的 `__namespacePrefix` / `__segment` + `namespaceIsolation`。
 * 单独调用本函数（如单元测试）时若未注入这些字段，将得到无前缀的 typeName。
 */
export function convertEndpointString(apiString: string, config: PathParseConfig): EndpointNamingResult {
	let completionPath = apiString;
	if (!apiString.startsWith('/')) {
		completionPath = '/' + apiString;
	}
	const [path, method] = completionPath.split('|');
	const normalizedPath = normalizePathPrefix(config, path);
	const pathSegments = normalizedPath ? normalizedPath.split('/').filter((seg) => seg) : [];
	const parts: PathPart[] = pathSegments.map((seg) => {
		if (seg.startsWith('{') && seg.endsWith('}')) {
			const paramName = seg.slice(1, -1);
			return { type: 'param', original: seg, normalized: paramName };
		}
		return { type: 'normal', original: seg, normalized: seg };
	});

	const deduplicatedParts = deduplicateParts(parts);
	const paramSeparator = config.parameterSeparator ?? DEFAULT_SEPARATOR;

	let apiName = '';
	let camelBuffer: string[] = [];

	const flushCamelBuffer = (isFirst: boolean) => {
		if (camelBuffer.length > 0) {
			const camelStr = camelBuffer.map((seg, idx) => toCamelCase(seg, isFirst && idx === 0)).join('');
			apiName += (apiName && camelBuffer.length > 0 ? paramSeparator : '') + camelStr;
			camelBuffer = [];
		}
	};

	for (const part of deduplicatedParts) {
		if (part.type === 'normal') {
			camelBuffer.push(part.normalized);
		} else {
			flushCamelBuffer(apiName === '');
			const cleanedParam = cleanSegment(part.normalized);
			apiName += (apiName ? paramSeparator : '') + cleanedParam;
		}
	}
	flushCamelBuffer(apiName === '');

	let typeName = '';
	camelBuffer = [];

	const flushCamelBufferPascal = () => {
		if (camelBuffer.length > 0) {
			const pascalStr = camelBuffer.map((seg) => toPascalCase(seg)).join('');
			typeName += (typeName && camelBuffer.length > 0 ? paramSeparator : '') + pascalStr;
			camelBuffer = [];
		}
	};

	for (const part of deduplicatedParts) {
		if (part.type === 'normal') {
			camelBuffer.push(part.normalized);
		} else {
			flushCamelBufferPascal();
			const pascalParam = toPascalCase(part.normalized);
			typeName += (typeName ? paramSeparator : '') + pascalParam;
		}
	}
	flushCamelBufferPascal();

	let fileName = '';
	if (pathSegments.length > 0) {
		fileName = pathSegments.map((seg) => seg.replace(/[{}]/g, '')).join('-');
		fileName = `${fileName}-${method}`.toLowerCase();
	} else {
		fileName = `${method}`.toLowerCase();
	}

	let finalPath = '/' + normalizedPath;
	if (!normalizedPath) {
		finalPath = '/';
	}
	finalPath = finalPath.replace(/\{(\w+)\}/g, (_, param) => `\${${param}}`);

	const baseTypeName = typeName ? `${typeName}_${method}` : method;
	const prefix = getNamespacePrefix(config);
	const finalTypeName = prefix ? `${prefix}_${baseTypeName}` : baseTypeName;

	return {
		apiName: apiName ? `${apiName}_${method}` : method,
		fileName,
		typeName: finalTypeName,
		path: finalPath,
	};
}
