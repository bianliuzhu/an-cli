import { OpenAPIV3 } from 'openapi-types';
import { writeFileRecursive } from '../../utils';
import { ArraySchemaObject, ComponentsSchemas, ConfigType, NonArraySchemaObject, ReferenceObject, SchemaObject } from '../types';

const INDENT = `\t`;
type TReturnType = { headerRef: string; renderStr: string } | null;
type TrenderType = { fileName: string; content: string };
class Components {
	defalutReturn = { headerRef: '', renderStr: '' };
	schemas: ComponentsSchemas = {};
	schemasMap: Map<string, TrenderType> = new Map();
	config: ConfigType;

	constructor(schemas: ComponentsSchemas, config: ConfigType) {
		this.schemas = schemas;
		this.config = config;
	}

	typeNameToFileName(str: string) {
		str = str.replace(/_/g, '-');
		str = str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
		str = str.replace(/-+/g, '-');
		return str;
	}

	nameTheHumpCenterStroke(str: string): { typeName: string; fileName: string } {
		try {
			const typeName = str.replace('#/components/schemas/', '');
			const fileName = this.typeNameToFileName(typeName);
			return { typeName, fileName };
		} catch (error) {
			console.error(error);
			throw JSON.stringify(error);
		}
	}

	parseRef(ref: string): { headerRefStr: string; typeName: string } {
		if (!ref) return { headerRefStr: '', typeName: '' };
		const { fileName, typeName } = this.nameTheHumpCenterStroke(ref);
		const header = `import { ${typeName} } from './${fileName}';`;
		return { headerRefStr: header, typeName };
	}

	parseObject(obj: OpenAPIV3.SchemaObject, key: string): TReturnType {
		let headerRef = '';
		let renderStr = '';
		if (obj.type === 'object') {
			const nonArraySchema = obj as OpenAPIV3.NonArraySchemaObject;
			switch (typeof nonArraySchema.additionalProperties) {
				case 'boolean':
					return { headerRef: '', renderStr: '' };
				case 'object': {
					const value = this.parseArray(nonArraySchema.additionalProperties as OpenAPIV3.ArraySchemaObject, key) ?? this.defalutReturn;
					const { headerRef: _headerFile, renderStr: _renderStr } = value;
					headerRef = _headerFile;
					renderStr = _renderStr;
				}
			}
		}
		return { headerRef, renderStr };
	}

	parseArray(schemaSource: OpenAPIV3.SchemaObject, name: string): TReturnType {
		let headerRef = '';
		let renderStr = '';
		const v1 = schemaSource as OpenAPIV3.ArraySchemaObject;
		const ref = (v1.items as OpenAPIV3.ReferenceObject).$ref;
		if (ref) {
			const { headerRefStr, typeName } = this.parseRef(ref);
			headerRef = headerRefStr;
			const arrayType1 = `${INDENT}${name}${schemaSource?.nullable ? '?:' : ':'} Array<${typeName}>;`;
			renderStr = arrayType1;
		} else {
			const sou = schemaSource as OpenAPIV3.ArraySchemaObject;
			const items = sou?.items as OpenAPIV3.SchemaObject;
			const arrayType2 = `${INDENT}${name}${schemaSource?.nullable ? '?:' : ':'} Array<${items?.type === 'integer' ? 'number' : items?.type}>;`;
			renderStr = arrayType2;
		}
		return { headerRef, renderStr };
	}

	parseBoolean(schemaObject: NonArraySchemaObject, key: string): string {
		if (schemaObject.type !== 'boolean') return '';
		const renderStr = `${INDENT}${key}: boolean;`;
		return renderStr;
	}

	parseEnum(value: NonArraySchemaObject, key: string): string {
		if (value.type !== 'integer') return '';
		if (Array.isArray(value.enum)) {
			const temp = value.enum.map((item: number) => `${INDENT}NUMBER_${item} = ${item},`);
			const content = [`export enum ${key} {`, ...temp, `}`];
			return content.join('\n');
		}
		return '';
	}

	parseInteger(value: NonArraySchemaObject, key: string): string {
		if (value.type !== 'integer') return '';
		if (Array.isArray(value.enum)) {
			return this.parseEnum(value, key);
		} else {
			return `${INDENT}${key}: number;`;
		}
	}

	parseNumber(value: NonArraySchemaObject, key: string): string {
		if (value.type !== 'number') return '';
		const renderStr = `${INDENT}${key}: number;`;
		return renderStr;
	}

	parseString(value: NonArraySchemaObject, key: string): TReturnType {
		if (value.type !== 'string') return null;
		const renderStr = `${INDENT}${key}: string;`;
		return { headerRef: '', renderStr };
	}

	// referenceObjectHandle() {}
	parseProperties(properties: OpenAPIV3.BaseSchemaObject['properties'], interfaceKey?: string) {
		try {
			const content: string[] = [];
			const headerRef: string[] = [];

			for (const name in properties) {
				const schemaSource = properties[name];

				// 处理引用类型
				if ((schemaSource as ReferenceObject).$ref) {
					const { headerRefStr, typeName } = this.parseRef((schemaSource as ReferenceObject).$ref);
					!headerRef.includes(headerRefStr) && headerRef.push(headerRefStr);
					content.push(`${INDENT}${name}: ${typeName};`);
					continue;
				}

				if ('allOf' in schemaSource) {
					const V1 = schemaSource['allOf']?.[0] as ReferenceObject;
					if (V1?.$ref) {
						const { headerRefStr, typeName } = this.parseRef(V1.$ref);
						!headerRef.includes(headerRefStr) && headerRef.push(headerRefStr);
						content.push(`${INDENT}${name}: ${typeName};`);
						continue;
					}
				}

				switch ((schemaSource as SchemaObject).type) {
					case 'array':
						{
							const value = this.parseArray(schemaSource as OpenAPIV3.ArraySchemaObject, name) ?? this.defalutReturn;
							const { headerRef: _headerFile, renderStr: _renderStr } = value;
							content.push(_renderStr);
							!headerRef.includes(_headerFile) && headerRef.push(_headerFile);
						}
						break;
					case 'boolean':
						{
							const value = this.parseBoolean(schemaSource as NonArraySchemaObject, name) ?? this.defalutReturn;
							content.push(value);
						}
						break;
					case 'integer':
						{
							const value = this.parseInteger(schemaSource as NonArraySchemaObject, name) ?? this.defalutReturn;
							content.push(value);
						}
						break;
					case 'number':
						{
							const value = this.parseNumber(schemaSource as NonArraySchemaObject, name) ?? this.defalutReturn;
							content.push(value);
						}
						break;
					case 'string':
						{
							const { renderStr } = this.parseString(schemaSource as NonArraySchemaObject, name) ?? this.defalutReturn;
							content.push(renderStr);
						}
						break;
					case 'object':
						{
							const { headerRef: _headerObjet, renderStr: _render } =
								this.parseObject(schemaSource as OpenAPIV3.SchemaObject, name) ?? this.defalutReturn;
							content.push(_render);
							!headerRef.includes(_headerObjet) && headerRef.push(_headerObjet);
						}
						break;
				}
			}

			const interfaceName = `export interface ${interfaceKey} {`;
			const renderStr = [...headerRef, '\n', interfaceName, ...content, `}`];
			// return { properties, renderStr, fieldCount: content.length, propertiesCount: Object.keys(properties as object).length, headerRef };
			return renderStr.join('\n');
		} catch (error) {
			console.error(error);
			throw JSON.stringify(error);
		}
	}

	parse(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			try {
				for (const key in this.schemas) {
					const temp = this.schemas[key];
					const V1 = temp as ReferenceObject;
					const V2 = temp as SchemaObject;
					const referenceObj = '$ref' in V1 ? V1 : null;
					const schemaObject = 'type' in V2 ? V2 : null;

					if (referenceObj) {
						console.warn('ReferenceObject 未处理');
					}

					if (schemaObject) {
						const V3 = temp as ArraySchemaObject;
						const V4 = temp as NonArraySchemaObject;
						const schemaObject = 'items' in V3 ? V3 : V4;
						const fileName = this.typeNameToFileName(key);
						if ('items' in schemaObject) {
							console.log('未处理--------------------------->', schemaObject.items);
						} else {
							switch (schemaObject.type) {
								case 'boolean':
									{
										const value = this.parseBoolean(schemaObject, key) ?? this.defalutReturn;
										this.schemasMap.set(key, { fileName, content: value });
									}
									break;
								case 'integer':
									{
										const value = this.parseInteger(schemaObject, key);
										this.schemasMap.set(key, { fileName, content: value });
									}
									break;
								case 'number':
									{
										const renderStr = this.parseNumber(schemaObject, key);
										this.schemasMap.set(key, { fileName, content: renderStr });
									}
									break;
								case 'object':
									{
										const value = this.parseProperties(schemaObject.properties, key);

										this.schemasMap.set(key, { fileName, content: value });
									}
									break;
								case 'string':
									{
										const { renderStr } = this.parseString(schemaObject, key) ?? this.defalutReturn;
										this.schemasMap.set(key, { fileName, content: renderStr });
									}
									break;
							}
						}
					}
				}
				resolve(true);
			} catch (error) {
				console.error(error);
				reject(error);
			}
		});
	}

	writeFileHabdler() {
		const Plist = [];
		const exportFileContent: string[] = [];
		const saveTypeFolderPath = `${this.config.saveTypeFolderPath}/models/`;
		const P = ({ fileName, content }: TrenderType) =>
			new Promise((resolve, reject) => {
				try {
					exportFileContent.push(`export * from './${fileName}';`);
					writeFileRecursive(`${saveTypeFolderPath}${fileName}.ts`, content).finally(() => resolve(void 0));
				} catch (error: any) {
					console.error(error, true);
					reject();
				}
			});

		for (const [, value] of this.schemasMap) {
			Plist.push(P(value));
		}
		Promise.all(Plist).then(() => {
			writeFileRecursive(`${saveTypeFolderPath}/index.ts`, exportFileContent.join('\n')).finally(() => console.log('components done!'));
		});
	}

	handle() {
		this.parse().then(() => this.writeFileHabdler());
	}
}
export default Components;
