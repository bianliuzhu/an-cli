import { OpenAPIV3 } from 'openapi-types';
import { isValidJSON, log, writeFileRecursive } from '../../utils';
import { ComponentsSchemas, ConfigType } from '../types';

type SchemaObject = OpenAPIV3.SchemaObject;
type NonArraySchemaObject = OpenAPIV3.NonArraySchemaObject;
type ArraySchemaObject = OpenAPIV3.ArraySchemaObject;
type ReferenceObject = OpenAPIV3.ReferenceObject;

const INDENT = `\t`;

type TReturnType = {
	headerRef: string;
	renderStr: string;
	comment?: string;
} | null;

type TrenderType = { fileName: string; content: string };

class Components {
	config: ConfigType;
	schemas: ComponentsSchemas = {};
	enumsMap: Map<string, TrenderType> = new Map();
	schemasMap: Map<string, TrenderType> = new Map();
	defaultReturn = { headerRef: '', renderStr: '' };
	requiredFieldS: string[] = [];

	constructor(schemas: ComponentsSchemas, config: ConfigType) {
		this.schemas = schemas;
		this.config = config;
	}

	nullable(v?: boolean) {
		return `${v ? ' | null' : ''}`;
	}

	fieldComment(schemaSource: NonArraySchemaObject) {
		const { description } = schemaSource;
		if (description) {
			const Comment = ['\t', '/**', '\n', `\t * ${description}`, '\n', '\t */'].join('');
			return Comment;
		}
		return '';
	}

	typeNameToFileName(str: string): string {
		return str
			.replace(/_/g, '-')
			.replace(/([a-z])([A-Z])/g, '$1-$2')
			.toLowerCase()
			.replace(/-+/g, '-');
	}

	nameTheHumpCenterStroke(ref: string): { typeName: string; fileName: string } {
		const typeName = ref.replace('#/components/schemas/', '');
		const fileName = this.typeNameToFileName(typeName);
		return { typeName, fileName };
	}

	parseRef(ref: string): { headerRefStr: string; typeName: string } {
		if (!ref?.trim()) return { headerRefStr: '', typeName: '' };
		const { fileName, typeName } = this.nameTheHumpCenterStroke(ref);
		let header: string;
		const reg = /enum/gi;
		if (reg.test(typeName)) {
			header = `import type { ${typeName} } from '${this.config.importEnumPath}';`;
		} else {
			header = `import type { ${typeName} } from './${fileName}';`;
		}

		return { headerRefStr: header, typeName };
	}

	parseObject(obj: SchemaObject, key: string): TReturnType {
		let headerRef = '';
		let renderStr = '';

		if (obj.type === 'object') {
			const nonArraySchema = obj as NonArraySchemaObject;
			if (typeof nonArraySchema.additionalProperties === 'object') {
				const value = this.parseArray(nonArraySchema.additionalProperties as ArraySchemaObject, key) ?? this.defaultReturn;
				headerRef = value.headerRef;
				renderStr = value.renderStr;
			} else {
				renderStr = `${INDENT}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: ${obj.type}${this.nullable(obj.nullable)};`;
			}
		}

		return { headerRef, renderStr };
	}

	parseArray(schemaSource: OpenAPIV3.SchemaObject, name: string): TReturnType {
		const arraySchema = schemaSource as OpenAPIV3.ArraySchemaObject;
		const { items = {}, nullable } = arraySchema;
		const ref = (items as ReferenceObject)?.$ref;

		if (ref) {
			const { headerRefStr, typeName } = this.parseRef(ref);
			return {
				headerRef: headerRefStr,
				renderStr: `${INDENT}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: Array<${typeName}>${this.nullable(nullable)};`,
			};
		}

		const itemType = (items as OpenAPIV3.SchemaObject)?.type;
		const finalType = itemType === 'integer' ? 'number' : itemType;
		return {
			headerRef: '',
			renderStr: `${INDENT}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: Array<${finalType}>${this.nullable(nullable)};`,
		};
	}

	parseBoolean(schemaObject: NonArraySchemaObject, key: string): string {
		return schemaObject.type === 'boolean'
			? `${INDENT}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: boolean${this.nullable(schemaObject.nullable)};`
			: '';
	}

	parseEnum(value: NonArraySchemaObject, enumName: string): TReturnType {
		if (!Array.isArray(value.enum)) return null;

		if (value.type === 'integer') {
			const enumValues = value.enum.map((item: number) => `${INDENT}NUMBER_${item} = ${item},`);
			return {
				headerRef: '',
				renderStr: [`export enum ${enumName} {`, ...enumValues, `}`].join('\n'),
			};
		}

		if (value.type === 'string') {
			const isAllNumeric = value.enum.every((item: string) => !isNaN(Number(item)));

			const enumValues = value.enum.map((item: string) => {
				if (isAllNumeric) {
					return `${INDENT}NUMBER_${item} = '${item}',`;
				}
				return `${INDENT}${item.toUpperCase()} = '${item}',`;
			});

			return {
				headerRef: '',
				renderStr: [`export enum ${enumName} {`, ...enumValues, `}`].join('\n'),
			};
		}

		return null;
	}

	parseInteger(value: NonArraySchemaObject, key: string): string {
		if (Array.isArray(value.enum)) {
			const enumName = key.charAt(0).toUpperCase() + key.slice(1);
			return this.parseEnum(value, enumName)?.renderStr ?? '';
		} else {
			return `${INDENT}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: number${this.nullable(value.nullable)};`;
		}
	}

	parseNumber(value: NonArraySchemaObject, key: string): string {
		return value.type === 'number' ? `${INDENT}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: number${this.nullable(value.nullable)};` : '';
	}

	convertJsonToEnumString(jsonStr: string, enumName: string): string {
		try {
			const jsonObj = JSON.parse(jsonStr);
			const enumValues = Object.entries(jsonObj)
				.map(([key, value]) => `${INDENT}${key.toUpperCase()} = '${value}'`)
				.join(',\n');
			return `export enum ${enumName} {\n${enumValues}\n}`;
		} catch (error) {
			console.error('JSON 解析失败:', error);
			return '';
		}
	}

	parseString(value: NonArraySchemaObject, key: string): TReturnType {
		if (value.type === 'string') {
			if (value.enum) {
				const enumName = key.charAt(0).toUpperCase() + key.slice(1);
				if (isValidJSON(value.example)) {
					const enumContent = this.convertJsonToEnumString(value.example as string, enumName);
					return {
						headerRef: '',
						renderStr: `${INDENT}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: ${enumName}${this.nullable(value.nullable)};`,
						comment: enumContent,
					};
				} else {
					const fileName = this.typeNameToFileName(enumName);
					const enumResult = this.parseEnum(value, enumName);
					if (enumResult) {
						this.enumsMap.set(fileName, { fileName, content: enumResult.renderStr });
						return { headerRef: '', renderStr: '' };
					}
				}
			}
			return {
				headerRef: '',
				renderStr: `${INDENT}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: string${this.nullable(value.nullable)};`,
			};
		}
		return null;
	}

	parseProperties(properties: OpenAPIV3.BaseSchemaObject['properties'], interfaceKey: string): TReturnType {
		const content: string[] = [];
		const headerRef: string[] = [];

		for (const name in properties) {
			const schemaSource = properties[name];

			if ((schemaSource as ReferenceObject)?.$ref) {
				const { headerRefStr, typeName } = this.parseRef((schemaSource as ReferenceObject).$ref);
				if (!headerRef.includes(headerRefStr)) headerRef.push(headerRefStr);
				content.push(`${INDENT}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: ${typeName};`);
				continue;
			}

			if ('allOf' in schemaSource) {
				const V1 = schemaSource['allOf']?.[0] as ReferenceObject;
				if (V1?.$ref) {
					const { headerRefStr, typeName } = this.parseRef(V1.$ref);
					if (!headerRef.includes(headerRefStr)) headerRef.push(headerRefStr);
					content.push(`${INDENT}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: ${typeName}${this.nullable(schemaSource.nullable)};`);
					continue;
				}
			}

			const schema = schemaSource as OpenAPIV3.SchemaObject;

			/** 添加注释 */
			const comment = this.fieldComment(schema as NonArraySchemaObject);
			comment !== '' && content.push(comment);

			switch (schema.type) {
				case 'array':
					{
						const value = this.parseArray(schema, name) ?? this.defaultReturn;
						content.push(value.renderStr);
						if (!headerRef.includes(value.headerRef) && !value.headerRef.includes(interfaceKey)) headerRef.push(value.headerRef);
					}
					break;

				case 'boolean':
					{
						content.push(this.parseBoolean(schema as NonArraySchemaObject, name));
					}
					break;

				case 'integer':
					{
						content.push(this.parseInteger(schema as NonArraySchemaObject, name));
					}
					break;

				case 'number':
					{
						content.push(this.parseNumber(schema as NonArraySchemaObject, name));
					}
					break;

				case 'string':
					{
						if (schema.enum) {
							// 将枚举名转换为大驼峰命名
							const enumName = name.charAt(0).toUpperCase() + name.slice(1);
							// console.log(enumName, name);
							if (isValidJSON(schema.example)) {
								const header = `import type { ${enumName} } from '${this.config.importEnumPath}';`;
								if (!headerRef.includes(header)) headerRef.push(header);
								const fileName = this.typeNameToFileName(enumName);
								const enumContent = this.convertJsonToEnumString(schema.example as string, enumName);
								this.enumsMap.set(fileName, { fileName, content: enumContent });
								content.push(`${INDENT}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: ${enumName}${this.nullable(schema.nullable)};`);
							} else {
								const enumResult = this.parseEnum(schema as NonArraySchemaObject, enumName);
								if (enumResult?.renderStr) {
									const header = `import type { ${enumName} } from '${this.config.importEnumPath}';`;
									if (!headerRef.includes(header)) headerRef.push(header);
									const fileName = this.typeNameToFileName(enumName);
									this.enumsMap.set(fileName, { fileName, content: enumResult.renderStr });
									content.push(`${INDENT}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: ${enumName}${this.nullable(schema.nullable)};`);
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

	async generateContent(schemaObject: NonArraySchemaObject | ArraySchemaObject, key: string): Promise<string> {
		if ('items' in schemaObject) {
			console.warn(`数组类型未处理: ${key}`, schemaObject.items);
			return '';
		}

		switch (schemaObject.type) {
			case 'boolean':
				return this.parseBoolean(schemaObject, key);
			case 'integer':
				return this.parseInteger(schemaObject, key);
			case 'number':
				return this.parseNumber(schemaObject, key);
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

	async parseData(): Promise<void> {
		try {
			if (!this.schemas) {
				console.warn('schemas 为空');
				return;
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

				const fileName = this.typeNameToFileName(key);
				const content = await this.generateContent(schemaObject, key);
				if (content) {
					if (content.includes('export enum ')) {
						this.enumsMap.set(fileName, { fileName, content });
					} else {
						this.schemasMap.set(key, { fileName, content });
					}
				}
			}
		} catch (error) {
			console.error('解析过程出错:', error);
			throw error;
		}
	}

	private async writeEnums(): Promise<void> {
		const Plist = [];
		const exportFileContent: string[] = [];
		for (const [, value] of this.enumsMap) {
			const P = async ({ fileName, content }: TrenderType) => {
				exportFileContent.push(`export * from './${fileName}';`);
				await writeFileRecursive(`${this.config.saveEnumFolderPath}/${fileName}.ts`, content);
			};
			Plist.push(P(value));
		}
		await Promise.all(Plist);
		await writeFileRecursive(`${this.config.saveEnumFolderPath}/index.ts`, exportFileContent.join('\n'));
	}

	private async writeFile(): Promise<void> {
		const Plist = [];
		const exportFileContent: string[] = [];
		const saveTypeFolderPath = `${this.config.saveTypeFolderPath}/models/`;

		for (const [, value] of this.schemasMap) {
			const P = async ({ fileName, content }: TrenderType) => {
				exportFileContent.push(`export * from './${fileName}';`);
				await writeFileRecursive(`${saveTypeFolderPath}${fileName}.ts`, content);
			};
			Plist.push(P(value));
		}

		await Promise.all(Plist);
		await writeFileRecursive(`${saveTypeFolderPath}index.ts`, exportFileContent.join('\n'));
	}

	async handle(): Promise<void> {
		await this.parseData();
		await this.writeFile();
		await this.writeEnums();
		log.success('Component parse & write done!');
	}
}

export default Components;
