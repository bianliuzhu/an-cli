import type { ArraySchemaObject, IResponseModelTransform, NonArraySchemaObject, ParseError, PathParseConfig, ReferenceObject, Schema, SchemaObject } from '../types';
import type { OpenAPIV3 } from 'openapi-types';

import { getIndentation, getLineEnding } from '../shared/format';
import { SUPPORTED_REQUEST_TYPES_ALL } from '../shared/http';
import { getEnumTypeName, typeNameToFileName } from '../shared/naming';
import { applyTypeMapping, formatObjectProperties, nullableSuffix, stringifyArrayType } from '../shared/schema-utils';

const componentsPathEnum = {
	schemas: '#/components/schemas/',
	parameters: '#/components/parameters/',
	definitions: '#/definitions/',
};

type HandleErrorFn = (error: ParseError) => void;

export class SchemaResolver {
	private config: PathParseConfig;
	private schemas: OpenAPIV3.ComponentsObject['schemas'];
	private parameters: OpenAPIV3.ComponentsObject['parameters'];
	private referenceCache = new Map<string, string>();
	private handleError: HandleErrorFn;

	constructor(config: PathParseConfig, schemas: OpenAPIV3.ComponentsObject['schemas'], parameters: OpenAPIV3.ComponentsObject['parameters'], onError: HandleErrorFn) {
		this.config = config;
		this.schemas = schemas ?? {};
		this.parameters = parameters ?? {};
		this.handleError = onError;
	}

	private stringifySchemaResult(result: string | string[]): string {
		if (Array.isArray(result)) {
			const ln = getLineEnding(this.config);
			const indent = getIndentation(this.config);
			const body = result.join(ln);
			return `{${ln}${body}${ln}${indent}}`;
		}
		return result;
	}

	handleComplexType(schema: SchemaObject): string {
		try {
			if (schema.oneOf) {
				return schema.oneOf.map((type) => this.stringifySchemaResult(this.main(type))).join(' | ');
			}

			if (schema.allOf) {
				return schema.allOf.map((type) => this.stringifySchemaResult(this.main(type))).join(' & ');
			}

			if (schema.anyOf) {
				return schema.anyOf.map((type) => this.stringifySchemaResult(this.main(type))).join(' | ');
			}

			if (schema.enum) {
				if (schema.type === 'number' || schema.type === 'integer') {
					return schema.enum.join(' | ');
				}
				return schema.enum.map((v) => `'${v}'`).join(' | ');
			}

			return 'unknown';
		} catch (error) {
			this.handleError({
				type: 'SCHEMA',
				message: 'Failed to handle complex type',
				details: error,
			});
			return 'unknown';
		}
	}

	referenceObjectParse(refobj: ReferenceObject): string {
		try {
			const refKey = refobj.$ref;
			const cachedValue = this.referenceCache.get(refKey);
			if (cachedValue) {
				return cachedValue;
			}

			let typeName = refKey;

			if (refKey.startsWith(componentsPathEnum.schemas)) {
				typeName = refKey.replace(componentsPathEnum.schemas, '');
			}

			if (refKey.startsWith(componentsPathEnum.parameters)) {
				typeName = refKey.replace(componentsPathEnum.parameters, '');
			}

			if (refKey.startsWith(componentsPathEnum.definitions)) {
				typeName = refKey.replace(componentsPathEnum.definitions, '');
			}

			const fileName = typeNameToFileName(typeName);
			const schema = this.schemas?.[typeName];
			let isEnum = false;

			if (schema && !('$ref' in schema)) {
				const isObject = 'properties' in schema || schema.type === 'object';
				const isArray = schema.type === 'array' || 'items' in schema;
				const hasEnumField = 'enum' in schema && Array.isArray(schema.enum);

				if (hasEnumField && !isObject && !isArray) {
					isEnum = true;
				}
			} else {
				const regEnum = /Enum$/i;
				isEnum = regEnum.test(typeName);
			}

			const finalTypeName = isEnum ? getEnumTypeName(this.config, typeName) : typeName;

			const importStatement = isEnum ? `import('${this.config.importEnumPath}/${fileName}').${finalTypeName}` : `import('../models/${fileName}').${typeName}`;

			this.referenceCache.set(refKey, importStatement);

			return importStatement;
		} catch (error) {
			this.handleError({
				type: 'REFERENCE',
				message: 'Failed to parse reference object',
				details: error,
			});
			return 'unknown';
		}
	}

	nonArraySchemaObjectParse(nonArraySchemaObject: NonArraySchemaObject): string | string[] {
		if (!nonArraySchemaObject) return 'unknown';
		if (nonArraySchemaObject.format === 'binary' || (nonArraySchemaObject.type === 'string' && nonArraySchemaObject.format === 'binary')) {
			return 'File';
		}

		switch (nonArraySchemaObject.type) {
			case 'boolean':
				return 'boolean';
			case 'integer':
			case 'number':
				return 'number';
			case 'object':
				return this.propertiesParse(nonArraySchemaObject.properties);
			case 'string':
				if (nonArraySchemaObject.format === 'binary') {
					return 'File';
				}
				return 'string';
			default:
				return 'unknown';
		}
	}

	arraySchemaObjectParse(arraySchemaObject: ArraySchemaObject): string {
		if (arraySchemaObject.type !== 'array') return '';
		const { items } = arraySchemaObject;
		const referenceObject = '$ref' in (items as ReferenceObject) ? (items as ReferenceObject) : null;
		const schemaObject = items as SchemaObject;

		if (referenceObject) {
			const val = this.referenceObjectParse(referenceObject);
			return `Array<${val}>`;
		}

		if (schemaObject) {
			const val = this.main(items);
			if (Array.isArray(val)) {
				return `Array<{${val.join('\n')}}>`;
			} else {
				return `Array<${val}>`;
			}
		}
		return '';
	}

	propertiesParse(properties: OpenAPIV3.BaseSchemaObject['properties']): string[] {
		return formatObjectProperties(properties, this.config, (schema) => this.main(schema));
	}

	/**
	 * 转换响应模型
	 * @param responseType 原始响应类型
	 * @param transform 响应模型转换配置
	 * @returns 转换后的响应类型
	 *
	 * 支持三种转换类型：
	 * 1. unwrap: 剔除响应模型，提取指定字段（默认为 data 字段）
	 *    例如: ResultMessage<Boolean> -> Boolean
	 * 2. wrap: 添加响应模型，将原类型包装到指定字段中
	 *    例如: Boolean -> { success?: boolean; code?: number; data?: Boolean }
	 * 3. replace: 替换响应模型为指定类型
	 *    例如: ResultMessage<Boolean> -> CustomType
	 */
	transformResponseModel(responseType: string | string[], transform?: IResponseModelTransform): string | string[] {
		if (!transform) return responseType;

		try {
			switch (transform.type) {
				case 'unwrap': {
					// 剔除响应模型，提取 data 字段
					const dataField = transform.dataField ?? 'data';

					// 如果响应类型是数组（内联对象类型），尝试提取字段
					if (Array.isArray(responseType)) {
						this.handleError({
							type: 'RESPONSE',
							message: 'Response model unwrap is not supported for inline object response types',
						});
						return responseType;
					}

					// 检查是否是导入类型（例如: import('../models/result-message-boolean').ResultMessageBoolean）
					const importMatch = /^import\('([^']+)'\)\.(\w+)$/.exec(responseType);
					if (importMatch) {
						const [, _importPath, typeName] = importMatch;
						// 查找对应的 schema
						const schema = this.schemas?.[typeName];
						if (schema && !('$ref' in schema)) {
							const schemaObj = schema as SchemaObject;
							// 如果有 properties 并且包含指定的 data 字段
							if (schemaObj.properties?.[dataField]) {
								const dataFieldSchema = schemaObj.properties[dataField];
								// 解析 data 字段的类型
								const dataType = this.main(dataFieldSchema as Schema);
								if (Array.isArray(dataType)) {
									// 如果 data 字段是对象类型，返回对象字段数组
									return dataType;
								}
								return dataType;
							} else {
								this.handleError({
									type: 'RESPONSE',
									message: `Field "${dataField}" not found in response type "${typeName}"`,
								});
							}
						}
					}

					// 如果无法识别或提取，返回原类型
					return responseType;
				}

				case 'wrap': {
					// 添加响应模型
					if (!transform.wrapperFields) {
						this.handleError({
							type: 'RESPONSE',
							message: 'wrapperFields is required when using wrap transform',
						});
						return responseType;
					}

					// 构建包装类型
					const indent = getIndentation(this.config);
					const doubleIndent = indent + indent;
					const fields: string[] = [];
					const dataFieldName = transform.dataField ?? 'data';

					for (const [fieldName, fieldType] of Object.entries(transform.wrapperFields)) {
						if (fieldName === dataFieldName) {
							// data 字段使用原响应类型
							if (Array.isArray(responseType)) {
								// 如果原响应类型是对象字段数组，需要转换为内联对象
								const objContent = responseType.join('\n');
								fields.push(`${doubleIndent}${fieldName}?: {${objContent}\n${doubleIndent}};`);
							} else {
								fields.push(`${doubleIndent}${fieldName}?: ${responseType};`);
							}
						} else {
							fields.push(`${doubleIndent}${fieldName}?: ${fieldType};`);
						}
					}

					return fields;
				}

				case 'replace': {
					// 替换响应模型
					if (!transform.wrapperType) {
						this.handleError({
							type: 'RESPONSE',
							message: 'wrapperType is required when using replace transform',
						});
						return responseType;
					}

					return transform.wrapperType;
				}

				default:
					return responseType;
			}
		} catch (error) {
			this.handleError({
				type: 'RESPONSE',
				message: 'Failed to transform response model',
				details: error,
			});
			return responseType;
		}
	}

	responseObjectParse(responseObject: OpenAPIV3.ResponseObject) {
		try {
			const content = responseObject.content;
			if (!content) return '';

			let schema;

			for (const type of SUPPORTED_REQUEST_TYPES_ALL) {
				if (content[type]?.schema) {
					schema = content[type].schema;
					break;
				}
			}

			if (schema) {
				return this.main(schema);
			}

			return '';
		} catch (error) {
			this.handleError({
				type: 'RESPONSE',
				message: 'Failed to parse response object',
				details: error,
			});
			return '';
		}
	}

	main(schema: Schema | undefined): string | string[] {
		try {
			if (!schema) return 'unknown';

			if ('oneOf' in schema || 'allOf' in schema || 'anyOf' in schema || 'enum' in schema) {
				return this.handleComplexType(schema);
			}

			if ('$ref' in schema) {
				return this.referenceObjectParse(schema);
			}

			const schemaObj = schema;
			const type = schemaObj.type;
			const nullableStr = nullableSuffix(schemaObj.nullable);

			const mappedType = applyTypeMapping(this.config, schemaObj);
			if (mappedType) {
				return mappedType;
			}

			if (type === 'array' && schemaObj.items) {
				const itemType = this.main(schemaObj.items as Schema);
				return stringifyArrayType(itemType, this.config);
			}

			if (type === 'object' || typeof schemaObj === 'object') {
				if (schemaObj.properties) {
					const props = this.propertiesParse(schemaObj.properties);
					return props.length ? props : ['unknown'];
				}
				if (schemaObj.additionalProperties === true) {
					return 'Record<string, unknown>' + nullableStr;
				}
				if (typeof schemaObj.additionalProperties === 'object') {
					const valueType = this.main(schemaObj.additionalProperties as Schema) as string;
					return `Record<string, ${valueType}>` + nullableStr;
				}
			}

			return 'unknown';
		} catch (error) {
			this.handleError({
				type: 'SCHEMA',
				message: 'Failed to parse schema',
				details: error,
			});
			return 'unknown';
		}
	}
}
