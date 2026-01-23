import { PathParseConfig, Schema } from '../types';
import { getIndentation, getLineEnding } from './format';
import { formatPropertyName } from './naming';

export function nullableSuffix(nullable?: boolean): string {
	return nullable ? ' | null' : '';
}

export function applyTypeMapping(config: PathParseConfig, schemaObj: { type?: string; format?: string; nullable?: boolean }): string | undefined {
	const nullable = nullableSuffix(schemaObj.nullable);

	if (schemaObj.format && config.typeMapping?.has(schemaObj.format)) {
		return (config.typeMapping.get(schemaObj.format) as string) + nullable;
	}

	if (schemaObj.type && config.typeMapping?.has(schemaObj.type)) {
		return (config.typeMapping.get(schemaObj.type) as string) + nullable;
	}

	return undefined;
}

export function stringifyArrayType(result: string | string[], config: PathParseConfig): string {
	if (Array.isArray(result)) {
		const ln = getLineEnding(config);
		const indent = getIndentation(config);
		return `Array<{${ln}${result.join('\n')}${ln}${indent}${indent}}>`;
	}
	return `Array<${result}>`;
}

export function formatObjectProperties(
	properties: { [name: string]: Schema } | undefined,
	config: PathParseConfig,
	parseSchema: (schema: Schema) => string | string[],
): string[] {
	if (!properties) return [];
	const indent = getIndentation(config);
	const doubleIndent = indent + indent;
	const content: string[] = [];
	// 使用 Object.keys() 并排序以确保顺序一致性
	const keys = Object.keys(properties).sort();
	for (const key of keys) {
		const item = (properties as Record<string, Schema>)[key];
		const result = parseSchema(item);
		const propertyName = formatPropertyName(key);
		if (Array.isArray(result)) {
			content.push(`${doubleIndent}${propertyName}: {${result.join('\n')}};`);
		} else {
			content.push(`${doubleIndent}${propertyName}: ${result};`);
		}
	}
	return content;
}
