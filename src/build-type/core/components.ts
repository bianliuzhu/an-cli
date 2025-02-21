import { OpenAPIV3 } from 'openapi-types';
import { log, writeFileRecursive } from '../../utils';
import { ArraySchemaObject, ComponentsSchemas, ConfigType, NonArraySchemaObject, ReferenceObject, SchemaObject } from '../types';

const INDENT = `\t`;

type TReturnType = { headerRef: string; renderStr: string; comment?: string } | null;
type TrenderType = { fileName: string; content: string };

class Components {
	defaultReturn = { headerRef: '', renderStr: '' };
	schemas: ComponentsSchemas = {};
	schemasMap: Map<string, TrenderType> = new Map();
	config: ConfigType;

	constructor(schemas: ComponentsSchemas, config: ConfigType) {
		this.schemas = schemas;
		this.config = config;
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
		const header = `import type { ${typeName} } from './${fileName}';`;
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
				renderStr = `${INDENT}${key}: ${obj.type};`;
			}
		}

		return { headerRef, renderStr };
	}

	parseArray(schemaSource: OpenAPIV3.SchemaObject, name: string): TReturnType {
		const { items = {}, nullable } = schemaSource as OpenAPIV3.ArraySchemaObject;
		const ref = (items as ReferenceObject)?.$ref;

		if (ref) {
			const { headerRefStr, typeName } = this.parseRef(ref);
			return {
				headerRef: headerRefStr,
				renderStr: `${INDENT}${name}${nullable ? '?' : ''}: Array<${typeName}>;`,
			};
		}

		const itemType = (items as SchemaObject)?.type;
		const finalType = itemType === 'integer' ? 'number' : itemType;
		return {
			headerRef: '',
			renderStr: `${INDENT}${name}${nullable ? '?' : ''}: Array<${finalType}>;`,
		};
	}

	parseBoolean(schemaObject: NonArraySchemaObject, key: string): string {
		return schemaObject.type === 'boolean' ? `${INDENT}${key}: boolean;` : '';
	}

	parseEnum(value: NonArraySchemaObject, key: string): string {
		if (value.type === 'integer' && Array.isArray(value.enum)) {
			const enumValues = value.enum.map((item: number) => `${INDENT}NUMBER_${item} = ${item},`);
			return [`export enum ${key} {`, ...enumValues, `}`].join('\n');
		}
		return '';
	}

	parseInteger(value: NonArraySchemaObject, key: string): string {
		return Array.isArray(value.enum) ? this.parseEnum(value, key) : `${INDENT}${key}: number;`;
	}

	parseNumber(value: NonArraySchemaObject, key: string): string {
		return value.type === 'number' ? `${INDENT}${key}: number;` : '';
	}

	parseString(value: NonArraySchemaObject, key: string): TReturnType {
		return value.type === 'string' ? { headerRef: '', renderStr: `${INDENT}${key}: string;` } : null;
	}

	parseProperties(properties: OpenAPIV3.BaseSchemaObject['properties'], interfaceKey?: string): string {
		const content: string[] = [];
		const headerRef: string[] = [];

		for (const name in properties) {
			const schemaSource = properties[name];

			if ((schemaSource as ReferenceObject)?.$ref) {
				const { headerRefStr, typeName } = this.parseRef((schemaSource as ReferenceObject).$ref);
				if (!headerRef.includes(headerRefStr)) headerRef.push(headerRefStr);
				content.push(`${INDENT}${name}: ${typeName};`);
				continue;
			}

			if ('allOf' in schemaSource) {
				const V1 = schemaSource['allOf']?.[0] as ReferenceObject;
				if (V1?.$ref) {
					const { headerRefStr, typeName } = this.parseRef(V1.$ref);
					if (!headerRef.includes(headerRefStr)) headerRef.push(headerRefStr);
					content.push(`${INDENT}${name}: ${typeName};`);
					continue;
				}
			}

			/** 添加注释 */
			const comment = this.fieldComment(schemaSource as NonArraySchemaObject);
			comment !== '' && content.push(comment);

			switch ((schemaSource as SchemaObject).type) {
				case 'array':
					{
						const value = this.parseArray(schemaSource as ArraySchemaObject, name) ?? this.defaultReturn;
						content.push(value.renderStr);
						if (!headerRef.includes(value.headerRef)) headerRef.push(value.headerRef);
					}
					break;

				case 'boolean':
					{
						content.push(this.parseBoolean(schemaSource as NonArraySchemaObject, name));
					}
					break;

				case 'integer':
					{
						content.push(this.parseInteger(schemaSource as NonArraySchemaObject, name));
					}
					break;

				case 'number':
					{
						content.push(this.parseNumber(schemaSource as NonArraySchemaObject, name));
					}
					break;

				case 'string':
					{
						content.push(this.parseString(schemaSource as NonArraySchemaObject, name)?.renderStr ?? '');
					}
					break;

				case 'object':
					{
						const { headerRef: _headerObj, renderStr: _renderStr } = this.parseObject(schemaSource as SchemaObject, name) ?? this.defaultReturn;
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
		return v;
	}

	async parse(): Promise<void> {
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

				const fileName = this.typeNameToFileName(key);
				const content = await this.generateContent(schemaObject, key);
				if (content) {
					this.schemasMap.set(key, { fileName, content });
				}
			}
		} catch (error) {
			console.error('解析过程出错:', error);
			throw error;
		}
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
			case 'number':
				return this.parseNumber(schemaObject, key);
			case 'object':
				return this.parseProperties(schemaObject.properties, key);
			case 'string':
				return this.parseString(schemaObject, key)?.renderStr ?? '';
			default:
				return '';
		}
	}

	async writeFileHandler(): Promise<void> {
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
		await writeFileRecursive(`${saveTypeFolderPath}/index.ts`, exportFileContent.join('\n'));
	}

	async handle(): Promise<void> {
		await this.parse();
		await this.writeFileHandler();
		log.success('Component parse & write done!');
	}
}

export default Components;
