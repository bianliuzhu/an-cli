import { PathParseConfig } from '../types';

type PathPart = {
	type: 'normal' | 'param';
	original: string;
	normalized: string;
};

export type EndpointNamingResult = {
	apiName: string;
	fileName: string;
	typeName: string;
	path: string;
};

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

		if (current.type === 'normal' && next && next.type === 'param') {
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
	const paramSeparator = config.parameterSeparator || DEFAULT_SEPARATOR;

	let apiName = '';
	let camelBuffer: string[] = [];

	const flushCamelBuffer = (isFirst: boolean) => {
		if (camelBuffer.length > 0) {
			const camelStr = camelBuffer.map((seg, idx) => toCamelCase(seg, isFirst && idx === 0)).join('');
			apiName += (apiName && camelBuffer.length > 0 ? paramSeparator : '') + camelStr;
			camelBuffer = [];
		}
	};

	for (let i = 0; i < deduplicatedParts.length; i++) {
		const part = deduplicatedParts[i];
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

	for (let i = 0; i < deduplicatedParts.length; i++) {
		const part = deduplicatedParts[i];
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

	return {
		apiName: apiName ? `${apiName}_${method}` : method,
		fileName,
		typeName: typeName ? `${typeName}_${method}` : method,
		path: finalPath,
	};
}
