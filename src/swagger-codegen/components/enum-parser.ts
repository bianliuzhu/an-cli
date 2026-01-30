import type { ConfigType, RenderEntry } from '../types';
import type { OpenAPIV3 } from 'openapi-types';

import { isValidJSON } from '../../utils';
import { getIndentation } from '../shared/format';
import { getEnumTypeName, typeNameToFileName } from '../shared/naming';
import { nullableSuffix } from '../shared/schema-utils';

type NonArraySchemaObject = OpenAPIV3.NonArraySchemaObject;

interface EnumMetadata {
	customNames?: string[];
	descriptionMap?: Record<string, string>;
	rawEnumJson?: string;
}

type EnumParseResult = {
	headerRef: string;
	renderStr: string;
	comment?: string;
	typeName?: string;
} | null;

/**
 * 枚举解析器类
 * 负责处理 OpenAPI Schema 中的所有枚举相关逻辑
 */
export class EnumParser {
	private config: ConfigType;
	enumsMap = new Map<string, RenderEntry>();

	constructor(config: ConfigType) {
		this.config = config;
	}

	/**
	 * 获取可空后缀
	 */
	private nullable(v?: boolean): string {
		return nullableSuffix(v);
	}

	/**
	 * 提取枚举元数据（自定义名称和描述）
	 */
	private extractEnumMetadata(value: NonArraySchemaObject): EnumMetadata {
		const metadata: EnumMetadata = {};
		const { enmuConfig } = this.config;
		const schemaValue = value as Record<string, unknown>;

		if (value.example && isValidJSON(value.example as string)) {
			metadata.rawEnumJson = value.example as string;
		}

		if (enmuConfig?.varnames) {
			const rawNames = schemaValue[enmuConfig.varnames];
			if (Array.isArray(rawNames)) {
				metadata.customNames = rawNames.map((item) => `${item}`);
			}
		}

		if (enmuConfig?.comment) {
			const rawComments = schemaValue[enmuConfig.comment];
			if (rawComments && typeof rawComments === 'object' && !Array.isArray(rawComments)) {
				const descriptionMap: Record<string, string> = {};
				// 使用排序后的键以确保顺序一致性
				Object.entries(rawComments as Record<string, unknown>)
					.sort((a, b) => a[0].localeCompare(b[0]))
					.forEach(([key, desc]) => {
						if (typeof desc === 'string') {
							descriptionMap[key] = desc;
						}
					});

				if (Object.keys(descriptionMap).length) {
					metadata.descriptionMap = descriptionMap;
				}
			}
		}

		return metadata;
	}

	/**
	 * 解析枚举成员名称
	 */
	private resolveEnumMemberName(enumValue: string | number, index: number, options: { customNames?: string[]; isNumericEnum: boolean; treatStringAsNumeric: boolean }): string {
		const { customNames, isNumericEnum, treatStringAsNumeric } = options;
		const customName = customNames?.[index];

		if (typeof customName === 'string' && customName.trim()) {
			return customName;
		}

		if (isNumericEnum || (typeof enumValue === 'string' && treatStringAsNumeric)) {
			return `NUMBER_${enumValue}`;
		}

		if (typeof enumValue === 'string' && enumValue) {
			return enumValue.toUpperCase();
		}

		return `ENUM_${index}`;
	}

	/**
	 * 将 JSON 字符串转换为枚举代码
	 */
	convertJsonToEnumString(jsonStr: string, enumName: string): string {
		try {
			const jsonObj = JSON.parse(jsonStr) as Record<string, unknown>;

			if (this.config.enmuConfig.erasableSyntaxOnly) {
				// 使用排序后的键以确保顺序一致性
				const enumValues = Object.entries(jsonObj)
					.sort((a, b) => a[0].localeCompare(b[0]))
					.map(([key, value]) => `${getIndentation(this.config)}${key}: '${String(value)}'`)
					.join(',\n');
				return `export const ${enumName} = {\n${enumValues}\n} as const;\n\nexport type ${getEnumTypeName(this.config, enumName)} = typeof ${enumName}[keyof typeof ${enumName}];`;
			} else {
				// 使用排序后的键以确保顺序一致性
				const enumValues = Object.entries(jsonObj)
					.sort((a, b) => a[0].localeCompare(b[0]))
					.map(([key, value]) => `${getIndentation(this.config)}${key} = '${String(value)}'`)
					.join(',\n');
				return `export enum ${enumName} {\n${enumValues}\n}`;
			}
		} catch (error) {
			console.error('JSON 解析失败:', error);
			return '';
		}
	}

	private normalizeEnumValues(enumValues: unknown[]): (string | number)[] {
		return enumValues.map((item, index) => {
			if (typeof item === 'string' || typeof item === 'number') return item;
			if (item && typeof item === 'object') {
				const record = item as Record<string, unknown>;
				if (record.value !== undefined && (typeof record.value === 'string' || typeof record.value === 'number')) {
					return record.value;
				}
				if (record.key !== undefined && (typeof record.key === 'string' || typeof record.key === 'number')) {
					return record.key;
				}
				if (record.id !== undefined && (typeof record.id === 'string' || typeof record.id === 'number')) {
					return record.id;
				}
				try {
					return JSON.stringify(record);
				} catch {
					return `ENUM_${index}`;
				}
			}
			return `ENUM_${index}`;
		});
	}

	/**
	 * 解析枚举定义
	 */
	parseEnum(value: NonArraySchemaObject, enumName: string): EnumParseResult {
		if (!Array.isArray(value.enum)) return null;

		const Situation = ['integer', 'number'];
		const normalizedEnumValues = this.normalizeEnumValues(value.enum);
		const isNumericEnum = Boolean(value.type && Situation.includes(value.type));
		const treatStringAsNumeric = value.type === 'string' && normalizedEnumValues.every((item) => typeof item === 'string' && !isNaN(Number(item)));
		const { customNames, descriptionMap, rawEnumJson } = this.extractEnumMetadata(value);
		const useConstObject = this.config.enmuConfig.erasableSyntaxOnly;

		if (rawEnumJson) {
			const enumContent = this.convertJsonToEnumString(rawEnumJson, enumName);
			if (enumContent) {
				return {
					headerRef: '',
					renderStr: enumContent,
				};
			}
		}

		const enumEntries = normalizedEnumValues.map((item, index) => {
			const memberName = this.resolveEnumMemberName(item, index, {
				customNames,
				isNumericEnum,
				treatStringAsNumeric,
			});
			const literalValue = isNumericEnum ? `${item}` : `'${String(item)}'`;
			const assignment = useConstObject ? `${memberName}: ${literalValue},` : `${memberName} = ${literalValue},`;
			const description = descriptionMap?.[String(item)];

			if (description) {
				return [`${getIndentation(this.config)}/** ${description} */`, `${getIndentation(this.config)}${assignment}`].join('\n');
			}

			return `${getIndentation(this.config)}${assignment}`;
		});

		if (!enumEntries.length) return null;

		if (useConstObject) {
			return {
				headerRef: '',
				renderStr: [
					`export const ${enumName} = {`,
					...enumEntries,
					`} as const;`,
					'',
					`export type ${getEnumTypeName(this.config, enumName)} = typeof ${enumName}[keyof typeof ${enumName}];`,
				].join('\n'),
			};
		}

		return {
			headerRef: '',
			renderStr: [`export enum ${enumName} {`, ...enumEntries, `}`].join('\n'),
		};
	}

	/**
	 * 处理枚举字段
	 * @param value - schema 对象
	 * @param key - 字段名
	 * @param isRequired - 字段是否必填
	 * @returns 枚举处理结果
	 */
	handleEnum(value: NonArraySchemaObject, key: string, isRequired = false): EnumParseResult {
		const enumName = key.charAt(0).toUpperCase() + key.slice(1);
		const typeName = getEnumTypeName(this.config, enumName);
		const fileName = typeNameToFileName(enumName);

		// 如果有 example 且为有效 JSON
		if (isValidJSON(value.example as string)) {
			const enumContent = this.convertJsonToEnumString(value.example as string, enumName);
			if (!this.enumsMap.has(fileName)) {
				this.enumsMap.set(fileName, { fileName, content: enumContent });
			}
			return {
				headerRef: `import type { ${typeName} } from '${this.config.importEnumPath}';`,
				renderStr: `${getIndentation(this.config)}${key}${isRequired ? '' : '?'}: ${typeName}${this.nullable(value.nullable)};`,
				comment: enumContent,
				typeName,
			};
		}

		// 解析枚举值
		const enumResult = this.parseEnum(value, enumName);
		if (enumResult) {
			if (!this.enumsMap.has(fileName)) {
				this.enumsMap.set(fileName, { fileName, content: enumResult.renderStr });
			}
			return {
				headerRef: `import type { ${typeName} } from '${this.config.importEnumPath}';`,
				renderStr: `${getIndentation(this.config)}${key}${isRequired ? '' : '?'}: ${typeName}${this.nullable(value.nullable)};`,
				typeName,
			};
		}

		return null;
	}

	/**
	 * 根据枚举名称添加枚举到 Map
	 */
	addEnumByName(enumName: string, content: string): void {
		const fileName = typeNameToFileName(enumName);
		if (!this.enumsMap.has(fileName)) {
			this.enumsMap.set(fileName, { fileName, content });
		}
	}

	/**
	 * 检查枚举是否已存在
	 */
	hasEnum(enumName: string): boolean {
		const fileName = typeNameToFileName(enumName);
		return this.enumsMap.has(fileName);
	}

	/**
	 * 获取枚举类型名称
	 */
	getEnumTypeName(enumName: string): string {
		return getEnumTypeName(this.config, enumName);
	}

	/**
	 * 获取枚举导入语句
	 */
	getEnumImport(enumName: string): string {
		const typeName = getEnumTypeName(this.config, enumName);
		return `import type { ${typeName} } from '${this.config.importEnumPath}';`;
	}
}
