import { OpenAPIV3 } from 'openapi-types';
import { writeFileRecursive } from '../../utils';
import { ArraySchemaObject, ComponentsSchemas, ConfigType, NonArraySchemaObject, ReferenceObject, SchemaObject } from '../types';

const INDENT = `\t`;

type TReturnType = { headerRef: string; renderStr: string } | null;
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
		if (!ref) return { headerRefStr: '', typeName: '' };
		const { fileName, typeName } = this.nameTheHumpCenterStroke(ref);
		const header = `import { ${typeName} } from './${fileName}';`;
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
			}
		}

		return { headerRef, renderStr };
	}

	parseArray(schemaSource: OpenAPIV3.SchemaObject, name: string): TReturnType {
		let headerRef = '';
		let renderStr = '';
		const v1 = schemaSource as OpenAPIV3.ArraySchemaObject;

		if ((v1.items as ReferenceObject)?.$ref) {
			const { headerRefStr, typeName } = this.parseRef((v1.items as ReferenceObject).$ref);
			headerRef = headerRefStr;
			renderStr = `${INDENT}${name}${schemaSource?.nullable ? '?:' : '?:'} Array<${typeName}>;`;
		} else {
			const items = v1.items as SchemaObject;
			renderStr = `${INDENT}${name}${schemaSource?.nullable ? '?:' : '?:'} Array<${items.type === 'integer' ? 'number' : items.type}>;`;
		}

		return { headerRef, renderStr };
	}

	parseBoolean(schemaObject: NonArraySchemaObject, key: string): string {
		return schemaObject.type === 'boolean' ? `${INDENT}${key}?: boolean;` : '';
	}

	parseEnum(value: NonArraySchemaObject, key: string): string {
		if (value.type === 'integer' && Array.isArray(value.enum)) {
			const enumValues = value.enum.map((item: number) => `${INDENT}NUMBER_${item} = ${item},`);
			return [`export enum ${key} {`, ...enumValues, `}`].join('\n');
		}
		return '';
	}

	parseInteger(value: NonArraySchemaObject, key: string): string {
		return Array.isArray(value.enum) ? this.parseEnum(value, key) : `${INDENT}${key}?: number;`;
	}

	parseNumber(value: NonArraySchemaObject, key: string): string {
		return value.type === 'number' ? `${INDENT}${key}?: number;` : '';
	}

	parseString(value: NonArraySchemaObject, key: string): TReturnType {
		return value.type === 'string' ? { headerRef: '', renderStr: `${INDENT}${key}?: string;` } : null;
	}

	parseProperties(properties: OpenAPIV3.BaseSchemaObject['properties'], interfaceKey?: string): string {
		const content: string[] = [];
		const headerRef: string[] = [];

		for (const name in properties) {
			const schemaSource = properties[name];

			if ((schemaSource as ReferenceObject)?.$ref) {
				const { headerRefStr, typeName } = this.parseRef((schemaSource as ReferenceObject).$ref);
				if (!headerRef.includes(headerRefStr)) headerRef.push(headerRefStr);
				content.push(`${INDENT}${name}?: ${typeName};`);
				continue;
			}

			if ('allOf' in schemaSource) {
				const V1 = schemaSource['allOf']?.[0] as ReferenceObject;
				if (V1?.$ref) {
					const { headerRefStr, typeName } = this.parseRef(V1.$ref);
					if (!headerRef.includes(headerRefStr)) headerRef.push(headerRefStr);
					content.push(`${INDENT}${name}?: ${typeName};`);
					continue;
				}
			}

			switch ((schemaSource as SchemaObject).type) {
				case 'array':
					{
						const value = this.parseArray(schemaSource as ArraySchemaObject, name) ?? this.defaultReturn;
						content.push(value.renderStr);
						if (!headerRef.includes(value.headerRef)) headerRef.push(value.headerRef);
					}
					break;
				case 'boolean':
					content.push(this.parseBoolean(schemaSource as NonArraySchemaObject, name));
					break;
				case 'integer':
					content.push(this.parseInteger(schemaSource as NonArraySchemaObject, name));
					break;
				case 'number':
					content.push(this.parseNumber(schemaSource as NonArraySchemaObject, name));
					break;
				case 'string':
					content.push(this.parseString(schemaSource as NonArraySchemaObject, name)?.renderStr ?? '');
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
		return [...headerRef, '\n', interfaceName, ...content, `}`].join('\n');
	}

	async parse(): Promise<void> {
		for (const key in this.schemas) {
			const temp = this.schemas[key];
			const V1 = temp as ReferenceObject;
			const V2 = temp as SchemaObject;

			if ('$ref' in V1) {
				console.warn('ReferenceObject 未处理');
				continue;
			}

			const schemaObject = ('type' in V2 ? V2 : null) as NonArraySchemaObject | ArraySchemaObject;
			const fileName = this.typeNameToFileName(key);

			if (!schemaObject) continue;

			if ('items' in schemaObject) {
				console.log('未处理--------------------------->', schemaObject.items);
			} else {
				let content = '';
				switch (schemaObject.type) {
					case 'boolean':
						content = this.parseBoolean(schemaObject, key);
						break;
					case 'integer':
						content = this.parseInteger(schemaObject, key);
						break;
					case 'number':
						content = this.parseNumber(schemaObject, key);
						break;
					case 'object':
						content = this.parseProperties(schemaObject.properties, key);
						break;
					case 'string':
						content = this.parseString(schemaObject, key)?.renderStr ?? '';
						break;
				}
				this.schemasMap.set(key, { fileName, content });
			}
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
		console.log('components done!');
	}

	async handle(): Promise<void> {
		await this.parse();
		await this.writeFileHandler();
	}
}

export default Components;
