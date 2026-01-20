import { OpenAPIV3 } from 'openapi-types';
import { isValidJSON } from '../../utils';
import { ComponentsSchemas, ConfigType, RenderEntry } from '../types';
import { getEnumTypeName, typeNameToFileName } from '../shared/naming';
import { getIndentation } from '../shared/format';
import { nullableSuffix } from '../shared/schema-utils';
import { EnumParser } from './enum-parser';

type SchemaObject = OpenAPIV3.SchemaObject;
type NonArraySchemaObject = OpenAPIV3.NonArraySchemaObject;
type ArraySchemaObject = OpenAPIV3.ArraySchemaObject;
type ReferenceObject = OpenAPIV3.ReferenceObject;

type TReturnType = {
	headerRef: string;
	renderStr: string;
	comment?: string;
	typeName?: string;
} | null;

export class ComponentSchemaResolver {
	private schemas: ComponentsSchemas;
	private config: ConfigType;
	private requiredFieldS: string[] = [];
	private readonly defaultReturn = { headerRef: '', renderStr: '', comment: '', typeName: '' };
	private enumParser: EnumParser;

	schemasMap: Map<string, RenderEntry> = new Map();

	constructor(schemas: ComponentsSchemas, config: ConfigType) {
		this.schemas = schemas;
		this.config = config;
		this.enumParser = new EnumParser(config);
	}

	private nullable(v?: boolean) {
		return nullableSuffix(v);
	}

	private fieldComment(schemaSource: NonArraySchemaObject) {
		const { description } = schemaSource;
		if (description) {
			const Comment = [
				getIndentation(this.config),
				'/**',
				'\n',
				`${getIndentation(this.config)} * ${description}`,
				'\n',
				`${getIndentation(this.config)} */`,
			].join('');
			return Comment;
		}
		return '';
	}

	private nameTheHumpCenterStroke(ref: string): { typeName: string; fileName: string; dataType: string | undefined } {
		const typeName = ref.replace('#/components/schemas/', '');
		const fileName = typeNameToFileName(typeName);
		const returnData: { typeName: string; fileName: string; dataType: string | undefined } = { typeName, fileName, dataType: '' };
		if (this.schemas) {
			const data = this.schemas[typeName] as SchemaObject;
			if (data?.enum) {
				returnData.dataType = 'enum';
			} else {
				returnData.dataType = data?.type;
			}
		}
		return returnData;
	}

	private parseRef(ref: string): { headerRefStr: string; typeName: string; dataType: string } {
		if (!ref?.trim()) return { headerRefStr: '', typeName: '', dataType: '' };
		const { fileName, typeName, dataType = '' } = this.nameTheHumpCenterStroke(ref);
		let header: string;

		if (dataType === 'enum') {
			const importTypeName = getEnumTypeName(this.config, typeName);
			header = `import type { ${importTypeName} } from '${this.config.importEnumPath}';`;
		} else {
			header = `import type { ${typeName} } from './${fileName}';`;
		}

		return { headerRefStr: header, typeName, dataType };
	}

	private parseArray(schemaSource: OpenAPIV3.SchemaObject, name: string): TReturnType {
		const arraySchema = schemaSource as OpenAPIV3.ArraySchemaObject;
		const { items = {}, nullable, example } = arraySchema;
		const ref = (items as ReferenceObject)?.$ref;

		if (ref) {
			const { headerRefStr, typeName, dataType } = this.parseRef(ref);
			if (dataType === 'enum' && isValidJSON(example)) {
				const enumContent = this.enumParser.convertJsonToEnumString(example as string, typeName);
				this.enumParser.addEnumByName(typeName, enumContent);
			}

			const finalTypeName = dataType === 'enum' ? getEnumTypeName(this.config, typeName) : typeName;

			return {
				headerRef: headerRefStr,
				renderStr: `${getIndentation(this.config)}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: Array<${finalTypeName}>${this.nullable(nullable)};`,
				typeName: finalTypeName,
			};
		}

		const itemType = (items as OpenAPIV3.SchemaObject)?.type;
		let finalType = itemType === 'integer' ? 'number' : itemType;

		if (itemType === 'object') finalType = 'Record<string, unknown>' as 'string';

		return {
			headerRef: '',
			renderStr: `${getIndentation(this.config)}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: Array<${finalType}>${this.nullable(nullable)};`,
			typeName: finalType,
		};
	}

	private parseBoolean(schemaObject: NonArraySchemaObject, key: string): string {
		return schemaObject.type === 'boolean'
			? `${getIndentation(this.config)}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: boolean${this.nullable(schemaObject.nullable)};`
			: '';
	}

	private parseInteger(value: NonArraySchemaObject, key: string): string {
		if (Array.isArray(value.enum)) {
			const enumResult = this.enumParser.handleEnum(value, key, this.requiredFieldS.includes(key));
			return enumResult?.renderStr ?? '';
		} else {
			return `${getIndentation(this.config)}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: number${this.nullable(value.nullable)};`;
		}
	}

	private parseNumber(value: NonArraySchemaObject, key: string): TReturnType | null {
		if (value.type !== 'number') return null;

		if (value.enum) {
			const enumResult = this.enumParser.handleEnum(value, key, this.requiredFieldS.includes(key));
			if (enumResult) return enumResult;
		}

		return {
			headerRef: '',
			renderStr: `${getIndentation(this.config)}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: number${this.nullable(value.nullable)};`,
		};
	}

	private getStringTypeByFormat(format?: string): string {
		if (!format) return 'string';

		switch (format) {
			case 'date-time':
			case 'date':
			case 'time':
				return 'Date';
			case 'email':
			case 'idn-email':
			case 'uuid':
			case 'uri':
			case 'uri-reference':
			case 'iri':
			case 'iri-reference':
			case 'hostname':
			case 'idn-hostname':
			case 'ipv4':
			case 'ipv6':
				return 'string';
			case 'binary':
				return 'File';
			default:
				return 'string';
		}
	}

	private parseString(value: NonArraySchemaObject, key: string): TReturnType {
		if (value.type !== 'string') return null;

		if (value.enum) {
			const enumResult = this.enumParser.handleEnum(value, key, this.requiredFieldS.includes(key));
			if (enumResult) return enumResult;
		}

		const strType = this.getStringTypeByFormat(value.format);

		return {
			headerRef: '',
			renderStr: `${getIndentation(this.config)}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: ${strType}${this.nullable(value.nullable)};`,
		};
	}

	private parseObject(obj: SchemaObject, key: string): TReturnType {
		let headerRef = '';
		let renderStr = '';

		if (obj.type === 'object') {
			const nonArraySchema = obj as NonArraySchemaObject;
			if (typeof nonArraySchema.additionalProperties === 'object') {
				const value = this.parseArray(nonArraySchema.additionalProperties as ArraySchemaObject, key) ?? this.defaultReturn;
				headerRef = value?.headerRef ?? '';
				renderStr = value?.renderStr ?? '';
			}
			if (typeof nonArraySchema.additionalProperties === 'boolean') {
				renderStr = `${getIndentation(this.config)}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: Record<string, unknown>${this.nullable(nonArraySchema.nullable)};`;
			} else {
				renderStr = `${getIndentation(this.config)}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: ${obj.type}${this.nullable(obj.nullable)};`;
			}
		}

		return { headerRef, renderStr };
	}

	private parseProperties(properties: OpenAPIV3.BaseSchemaObject['properties'], interfaceKey: string): TReturnType {
		const content: string[] = [];
		const headerRef: string[] = [];

		for (const name in properties) {
			const schemaSource = properties[name];

			if ((schemaSource as ReferenceObject)?.$ref) {
				const { headerRefStr, typeName, dataType } = this.parseRef((schemaSource as ReferenceObject).$ref);
				if (!headerRef.includes(headerRefStr) && typeName !== interfaceKey) headerRef.push(headerRefStr);

				const schema = schemaSource as SchemaObject;
				const comment = this.fieldComment(schema as NonArraySchemaObject);
				comment !== '' && content.push(comment);

				const finalTypeName = dataType === 'enum' ? getEnumTypeName(this.config, typeName) : typeName;
				content.push(`${getIndentation(this.config)}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: ${finalTypeName};`);

				const example = (schemaSource as SchemaObject).example;
				if (dataType === 'enum' && example && isValidJSON(example)) {
					const enumContent = this.enumParser.convertJsonToEnumString(example as string, typeName);
					this.enumParser.addEnumByName(typeName, enumContent);
				}
				continue;
			}

			if ('allOf' in schemaSource) {
				const V1 = schemaSource['allOf']?.[0] as ReferenceObject;
				if (V1?.$ref) {
					const { headerRefStr, typeName, dataType } = this.parseRef(V1.$ref);
					const finalTypeName = dataType === 'enum' ? getEnumTypeName(this.config, typeName) : typeName;

					if (!headerRef.includes(headerRefStr) && typeName !== interfaceKey) headerRef.push(headerRefStr);

					const schema = schemaSource as SchemaObject;
					const comment = this.fieldComment(schema as NonArraySchemaObject);
					comment !== '' && content.push(comment);

					content.push(
						`${getIndentation(this.config)}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: ${finalTypeName}${this.nullable(schemaSource.nullable)};`,
					);

					continue;
				}
			}

			const schema = schemaSource as OpenAPIV3.SchemaObject;
			const comment = this.fieldComment(schema as NonArraySchemaObject);
			comment !== '' && content.push(comment);

			switch (schema.type) {
				case 'array':
					{
						const arrayVal = this.parseArray(schema, name) ?? this.defaultReturn;
						content.push(arrayVal?.renderStr ?? '');
						if (!headerRef.includes(arrayVal.headerRef) && interfaceKey !== arrayVal.typeName) headerRef.push(arrayVal.headerRef);
					}
					break;

				case 'boolean':
					content.push(this.parseBoolean(schema as NonArraySchemaObject, name));
					break;

				case 'integer':
					content.push(this.parseInteger(schema as NonArraySchemaObject, name));
					break;

				case 'number':
					{
						const numberResult = this.parseNumber(schema as NonArraySchemaObject, name);
						if (numberResult) {
							if (numberResult.headerRef && !headerRef.includes(numberResult.headerRef)) headerRef.push(numberResult.headerRef);
							content.push(numberResult.renderStr);
						}
					}
					break;

				case 'string':
					{
						if (schema.enum) {
							const enumResult = this.enumParser.handleEnum(schema as NonArraySchemaObject, name, this.requiredFieldS.includes(name));
							if (enumResult) {
								if (enumResult.headerRef && !headerRef.includes(enumResult.headerRef)) {
									headerRef.push(enumResult.headerRef);
								}
								if (enumResult.renderStr) {
									content.push(enumResult.renderStr);
								}
							}
						} else {
							content.push(this.parseString(schema as NonArraySchemaObject, name)?.renderStr ?? '');
						}
					}
					break;

				case 'object':
					{
						const { headerRef: _headerObj, renderStr: _renderStr } = this.parseObject(schema, name) ?? this.defaultReturn;
						content.push(_renderStr);
						if (!headerRef.includes(_headerObj)) headerRef.push(_headerObj);
					}
					break;
			}
		}

		const interfaceName = `export interface ${interfaceKey} {`;
		const result = [interfaceName, ...content, `}`];

		if (headerRef.length > 0) {
			const head = headerRef.filter((e) => e !== '');
			if (head.length > 0) head.push('');
			result.unshift(...head);
		}
		const v = result.join('\n');

		return {
			headerRef: headerRef.join('\n'),
			renderStr: v,
		};
	}


	private async generateContent(schemaObject: NonArraySchemaObject | ArraySchemaObject, key: string): Promise<string> {
		if ('items' in schemaObject) {
			console.warn(`数组类型未处理: ${key}`, schemaObject.items);
			return '';
		}

		switch (schemaObject.type) {
			case 'boolean':
				return this.parseBoolean(schemaObject, key);
			case 'integer':
				return this.parseInteger(schemaObject, key);
			case 'number': {
				const result = this.parseNumber(schemaObject, key);
				return result?.renderStr ?? '';
			}
			case 'object': {
				const result = this.parseProperties(schemaObject.properties, key);
				return result?.renderStr ?? '';
			}
			case 'string': {
				const result = this.parseString(schemaObject, key);
				return result?.renderStr ?? '';
			}
			default:
				return '';
		}
	}

	async main(): Promise<{ enumsMap: Map<string, RenderEntry>; schemasMap: Map<string, RenderEntry> }> {
		if (!this.schemas) {
			console.warn('schemas 为空');
			return { enumsMap: this.enumParser.enumsMap, schemasMap: this.schemasMap };
		}

		for (const [key, schema] of Object.entries(this.schemas)) {
			if ('$ref' in schema) {
				console.warn(`跳过 ReferenceObject: ${key}`);
				continue;
			}

			const schemaObject = ('type' in schema ? schema : null) as NonArraySchemaObject | ArraySchemaObject;
			if (!schemaObject?.type) {
				console.warn(`无效的 schema 对象: ${key}`);
				continue;
			}
			this.requiredFieldS = schema.required ?? [];

			const fileName = typeNameToFileName(key);
			const content = await this.generateContent(schemaObject, key);
			if (content) {
				const isEnum = content.includes('export enum ') || (content.includes('export const ') && content.includes('as const'));

				if (isEnum && !this.enumParser.hasEnum(key)) {
					this.enumParser.addEnumByName(key, content);
				} else {
					this.schemasMap.set(key, { fileName, content });
				}
			}
		}

		return { enumsMap: this.enumParser.enumsMap, schemasMap: this.schemasMap };
	}
}
