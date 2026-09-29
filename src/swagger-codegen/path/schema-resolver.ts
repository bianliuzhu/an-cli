import type { SchemaDiagnostics } from '../shared/schema-diagnostics';
import type {
	ArraySchemaObject,
	ComponentParameters,
	ComponentSchemas,
	IResponseModelTransform,
	NonArraySchemaObject,
	ParseError,
	PathParseConfig,
	ReferenceObject,
	ResponseObject,
	Schema,
	SchemaObject,
	SchemaTypeExpression,
} from '../types';

import { log } from '../../utils';
import { getIndentation, getLineEnding, indentContinuationLines } from '../shared/format';
import { SUPPORTED_REQUEST_TYPES_ALL } from '../shared/http';
import { adjustImportPathForSegment, appendEnumSegment, createSchemaNameMap, getEnumSegment, getEnumTypeName, getServerSegment, typeNameToFileName } from '../shared/naming';
import { directionalTypeName, isNamedEnumSchema, renderSchemaType, resolveLocalSchemaReference, type SchemaDirection } from '../shared/schema-type';
import { formatObjectProperties } from '../shared/schema-utils';

type ParseErrorHandler = (error: ParseError) => void;

export class SchemaResolver {
	private config: PathParseConfig;
	private schemas: ComponentSchemas;
	private parameters: ComponentParameters;
	private referenceCache = new Map<string, string>();
	private schemaDiagnostics = new Set<string>();
	private schemaNames: Map<string, string>;
	private resolvedToOriginalName = new Map<string, string>();
	private handleError: ParseErrorHandler;

	constructor(
		config: PathParseConfig,
		schemas: ComponentSchemas,
		parameters: ComponentParameters,
		onError: ParseErrorHandler,
		private readonly diagnostics?: SchemaDiagnostics,
	) {
		this.config = config;
		this.schemas = schemas ?? {};
		this.schemaNames = createSchemaNameMap(schemas, config.enmuConfig.erasableSyntaxOnly);
		this.resolvedToOriginalName = new Map([...this.schemaNames].map(([raw, name]) => [name, raw]));
		this.parameters = parameters ?? {};
		this.handleError = onError;
	}

	private stringifySchemaResult(result: SchemaTypeExpression): string {
		if (Array.isArray(result)) {
			const ln = getLineEnding(this.config);
			const indent = getIndentation(this.config);
			const body = result.join(ln);
			return `{${ln}${body}${ln}${indent}}`;
		}
		return result;
	}

	handleComplexType(schema: SchemaObject): string {
		return this.stringifySchemaResult(this.main(schema));
	}

	referenceObjectParse(refobj: ReferenceObject, direction?: SchemaDirection): string {
		try {
			const refKey = refobj.$ref;
			const cacheKey = `${direction ?? 'shared'}:${refKey}`;
			const cachedValue = this.referenceCache.get(cacheKey);
			if (cachedValue) {
				return cachedValue;
			}

			const target = resolveLocalSchemaReference(refKey, this.schemas, (message) => this.handleError({ type: 'REFERENCE', message }));
			if (!target) return 'unknown';
			const typeName = target.name;

			const resolvedName = this.schemaNames.get(typeName)!;
			const fileName = typeNameToFileName(resolvedName);
			const schema = this.schemas?.[typeName];

			let isEnum = false;

			if (schema && !('$ref' in schema)) {
				const isObject = 'properties' in schema || schema.type === 'object';
				const isArray = schema.type === 'array' || 'items' in schema;
				const hasEnumField = isNamedEnumSchema(schema);

				if (hasEnumField && !isObject && !isArray) {
					isEnum = true;
				}
			}

			const finalTypeName = isEnum ? getEnumTypeName(this.config, resolvedName) : directionalTypeName(resolvedName, target.schema, this.schemas, direction);

			const segment = getServerSegment(this.config);
			const enumImportPath = appendEnumSegment(adjustImportPathForSegment(this.config.importEnumPath ?? '', segment), getEnumSegment(this.config));
			const modelsRelative = segment ? `../../models/${segment}` : '../models';
			const importStatement = isEnum ? `import('${enumImportPath}/${fileName}').${finalTypeName}` : `import('${modelsRelative}/${fileName}').${finalTypeName}`;

			this.referenceCache.set(cacheKey, importStatement);

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

	nonArraySchemaObjectParse(nonArraySchemaObject: NonArraySchemaObject): SchemaTypeExpression {
		return this.main(nonArraySchemaObject);
	}

	arraySchemaObjectParse(arraySchemaObject: ArraySchemaObject): string {
		if (arraySchemaObject.type !== 'array') return '';
		return this.stringifySchemaResult(this.main(arraySchemaObject));
	}

	propertiesParse(properties: SchemaObject['properties']): string[] {
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
	transformResponseModel(responseType: SchemaTypeExpression, transform?: IResponseModelTransform): SchemaTypeExpression {
		if (!transform) return responseType;

		// 如果配置了 modelPattern，只对匹配的类型名进行转换
		if (transform.modelPattern && typeof responseType === 'string') {
			const importMatch = /^import\('[^']+'\)\.([\w$]+)(?:\.(?:Request|Response))?$/.exec(responseType);
			const typeNameForMatch = importMatch ? importMatch[1] : responseType;
			const pattern = new RegExp(transform.modelPattern);
			if (!pattern.test(this.resolvedToOriginalName.get(typeNameForMatch) ?? typeNameForMatch) && !pattern.test(typeNameForMatch)) {
				return responseType;
			}
		}

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
					const importMatch = /^import\('([^']+)'\)\.([\w$]+)(?:\.(?:Request|Response))?$/.exec(responseType);
					if (importMatch) {
						const [, _importPath, typeName] = importMatch;
						// 查找对应的 schema（优先通过反向映射查找原始中文名称）
						const originalName = this.resolvedToOriginalName.get(typeName) ?? typeName;
						const schema = this.schemas?.[originalName];
						if (schema && !('$ref' in schema)) {
							const schemaObj = schema;
							// 如果有 properties 并且包含指定的 data 字段
							if (schemaObj.properties?.[dataField]) {
								const dataFieldSchema = schemaObj.properties[dataField];
								// 解析 data 字段的类型
								const dataType = this.main(dataFieldSchema as Schema, 'response');
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
								fields.push(`${doubleIndent}${fieldName}?: ${indentContinuationLines(responseType, doubleIndent)};`);
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

	responseObjectParse(responseObject: ResponseObject): SchemaTypeExpression {
		try {
			const content = responseObject.content;
			if (!content) return 'unknown';

			let schema;

			for (const type of SUPPORTED_REQUEST_TYPES_ALL) {
				if (content[type]?.schema) {
					schema = content[type].schema;
					break;
				}
			}
			schema ??= Object.keys(content)
				.sort()
				.map((type) => content[type].schema)
				.find((candidate) => candidate !== undefined);

			if (schema) {
				return this.main(schema, 'response');
			}

			return 'unknown';
		} catch (error) {
			this.handleError({
				type: 'RESPONSE',
				message: 'Failed to parse response object',
				details: error,
			});
			return 'unknown';
		}
	}

	main(schema: Schema | undefined, direction?: SchemaDirection): SchemaTypeExpression {
		try {
			if (!schema) return 'unknown';
			return renderSchemaType(schema, {
				schemaPath: (child) => this.diagnostics?.pathFor(child),
				indentation: getIndentation(this.config),
				direction,
				schemas: this.schemas,
				reference: (reference) => this.referenceObjectParse({ $ref: reference }, direction),
				mapping: (child) => this.config.typeMapping?.get(child.format ?? '') ?? this.config.typeMapping?.get(child.type ?? ''),
				diagnostic: (message, path, kind) => {
					if (this.diagnostics) {
						this.diagnostics.add(message, path, kind);
						return;
					}
					const entry = `${kind}: ${path}: ${message}`;
					if (this.schemaDiagnostics.has(entry)) return;
					this.schemaDiagnostics.add(entry);
					if (kind === 'runtime') log.verbose(`${path}: ${message}`);
					else log.warn(`${path}: ${message}`);
				},
			});
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
