import fs from 'fs';
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
	typeName?: string;
} | null;

type TrenderType = { fileName: string; content: string };

type EnumMetadata = {
	customNames?: string[];
	descriptionMap?: Record<string, string>;
};

class Components {
	config: ConfigType;
	schemas: ComponentsSchemas = {};
	enumsMap: Map<string, TrenderType> = new Map();
	schemasMap: Map<string, TrenderType> = new Map();
	defaultReturn = { headerRef: '', renderStr: '', comment: '', typeName: '' };
	requiredFieldS: string[] = [];
	appendMode: boolean;

	constructor(schemas: ComponentsSchemas, config: ConfigType, options?: { appendMode?: boolean }) {
		this.schemas = schemas;
		this.config = config;
		this.appendMode = options?.appendMode ?? false;
	}

	private handleEnum(value: NonArraySchemaObject, key: string): TReturnType | null {
		const enumName = key.charAt(0).toUpperCase() + key.slice(1);
		if (isValidJSON(value.example)) {
			const enumContent = this.convertJsonToEnumString(value.example as string, enumName);
			const typeName = this.getEnumTypeName(enumName);
			return {
				headerRef: '',
				renderStr: `${INDENT}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: ${typeName}${this.nullable(value.nullable)};`,
				comment: enumContent,
			};
		}

		const fileName = this.typeNameToFileName(enumName);
		const enumResult = this.parseEnum(value, enumName);
		// 检查了
		if (enumResult && !this.enumsMap.has(fileName)) {
			this.enumsMap.set(fileName, { fileName, content: enumResult.renderStr });
			return { headerRef: '', renderStr: '' };
		}

		return null;
	}

	nullable(v?: boolean) {
		return `${v ? ' | null' : ''}`;
	}

	/**
	 * 根据配置获取枚举类型名
	 * 如果启用了 erasableSyntaxOnly，在枚举名后添加 Type 后缀以区分类型和常量
	 */
	getEnumTypeName(enumName: string): string {
		if (!this.config.enmuConfig.erasableSyntaxOnly) {
			return enumName;
		}

		// .enmuConfig.erasableSyntaxOnly 模式下，添加 Type 后缀以区分类型名和常量名
		// 例如：ActivityCorrectionPartStatusEnum => ActivityCorrectionPartStatusEnumType
		return `${enumName}Type`;
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

	nameTheHumpCenterStroke(ref: string): { typeName: string; fileName: string; dataType: string | undefined } {
		const typeName = ref.replace('#/components/schemas/', '');
		const fileName = this.typeNameToFileName(typeName);
		const returnData: { typeName: string; fileName: string; dataType: string | undefined } = { typeName, fileName, dataType: '' };
		if (this.schemas) {
			const data = this.schemas[typeName] as SchemaObject;
			if (data.enum) {
				returnData.dataType = 'enum';
			} else {
				returnData.dataType = data.type;
			}
		}
		return returnData;
	}

	parseRef(ref: string): { headerRefStr: string; typeName: string; dataType: string } {
		if (!ref?.trim()) return { headerRefStr: '', typeName: '', dataType: '' };
		const { fileName, typeName, dataType = '' } = this.nameTheHumpCenterStroke(ref);
		let header: string;

		if (dataType === 'enum') {
			const importTypeName = this.getEnumTypeName(typeName);
			header = `import type { ${importTypeName} } from '${this.config.importEnumPath}';`;
		} else {
			header = `import type { ${typeName} } from './${fileName}';`;
		}

		return { headerRefStr: header, typeName, dataType };
	}

	parseObject(obj: SchemaObject, key: string): TReturnType {
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
				renderStr = `${INDENT}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: Record<string, unknown>${this.nullable(nonArraySchema.nullable)};`;
			} else {
				renderStr = `${INDENT}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: ${obj.type}${this.nullable(obj.nullable)};`;
			}
		}

		return { headerRef, renderStr };
	}

	parseArray(schemaSource: OpenAPIV3.SchemaObject, name: string): TReturnType {
		const arraySchema = schemaSource as OpenAPIV3.ArraySchemaObject;
		const { items = {}, nullable, example } = arraySchema;
		const ref = (items as ReferenceObject)?.$ref;

		if (ref) {
			// array 类型 枚举值会走，但是不会携带 exzopen
			const { headerRefStr, typeName, dataType } = this.parseRef(ref);
			if (dataType === 'enum' && isValidJSON(example)) {
				const fileName = this.typeNameToFileName(typeName);
				const enumContent = this.convertJsonToEnumString(example, typeName);
				this.enumsMap.set(fileName, { fileName, content: enumContent });
			}

			// 如果是枚举类型，需要使用正确的类型名
			const finalTypeName = dataType === 'enum' ? this.getEnumTypeName(typeName) : typeName;

			return {
				headerRef: headerRefStr,
				renderStr: `${INDENT}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: Array<${finalTypeName}>${this.nullable(nullable)};`,
				typeName: finalTypeName,
			};
		}

		const itemType = (items as OpenAPIV3.SchemaObject)?.type;

		let finalType = itemType === 'integer' ? 'number' : itemType;

		if (itemType === 'object') finalType = 'Record<string, unknown>' as 'string';

		return {
			headerRef: '',
			renderStr: `${INDENT}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: Array<${finalType}>${this.nullable(nullable)};`,
			typeName: finalType,
		};
	}

	parseBoolean(schemaObject: NonArraySchemaObject, key: string): string {
		return schemaObject.type === 'boolean'
			? `${INDENT}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: boolean${this.nullable(schemaObject.nullable)};`
			: '';
	}

	private extractEnumMetadata(value: NonArraySchemaObject): EnumMetadata {
		const metadata: EnumMetadata = {};
		const { enmuConfig } = this.config;
		const schemaValue = value as Record<string, unknown>;

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
				Object.entries(rawComments as Record<string, unknown>).forEach(([key, desc]) => {
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

	private resolveEnumMemberName(
		enumValue: string | number,
		index: number,
		options: { customNames?: string[]; isNumericEnum: boolean; treatStringAsNumeric: boolean },
	): string {
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

	parseEnum(value: NonArraySchemaObject, enumName: string): TReturnType {
		if (!Array.isArray(value.enum)) return null;

		const Situation = ['integer', 'number'];
		const isNumericEnum = Boolean(value.type && Situation.includes(value.type));
		const enumValues = value.enum as Array<string | number>;
		const treatStringAsNumeric = value.type === 'string' && enumValues.every((item) => typeof item === 'string' && !isNaN(Number(item)));
		const { customNames, descriptionMap } = this.extractEnumMetadata(value);
		const useConstObject = this.config.enmuConfig.erasableSyntaxOnly;

		const enumEntries = enumValues.map((item, index) => {
			const memberName = this.resolveEnumMemberName(item, index, {
				customNames,
				isNumericEnum,
				treatStringAsNumeric,
			});
			const literalValue = isNumericEnum ? `${item}` : `'${String(item)}'`;
			const assignment = useConstObject ? `${memberName}: ${literalValue},` : `${memberName} = ${literalValue},`;
			const description = descriptionMap?.[String(item)];

			if (description) {
				return [`${INDENT}/** ${description} */`, `${INDENT}${assignment}`].join('\n');
			}

			return `${INDENT}${assignment}`;
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
					`export type ${this.getEnumTypeName(enumName)} = typeof ${enumName}[keyof typeof ${enumName}];`,
				].join('\n'),
			};
		}

		return {
			headerRef: '',
			renderStr: [`export enum ${enumName} {`, ...enumEntries, `}`].join('\n'),
		};
	}

	parseInteger(value: NonArraySchemaObject, key: string): string {
		if (Array.isArray(value.enum)) {
			const enumName = key.charAt(0).toUpperCase() + key.slice(1);
			return this.parseEnum(value, enumName)?.renderStr ?? '';
		} else {
			return `${INDENT}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: number${this.nullable(value.nullable)};`;
		}
	}

	parseNumber(value: NonArraySchemaObject, key: string): TReturnType | null {
		if (value.type !== 'number') return null;

		if (value.enum) {
			const enumResult = this.handleEnum(value, key);
			if (enumResult) return enumResult;
		}

		return {
			headerRef: '',
			renderStr: `${INDENT}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: number${this.nullable(value.nullable)};`,
		};
	}

	convertJsonToEnumString(jsonStr: string, enumName: string): string {
		try {
			const jsonObj = JSON.parse(jsonStr);

			if (this.config.enmuConfig.erasableSyntaxOnly) {
				// 生成 const 对象形式
				const enumValues = Object.entries(jsonObj)
					.map(([key, value]) => `${INDENT}${key}: '${value}'`)
					.join(',\n');
				return `export const ${enumName} = {\n${enumValues}\n} as const;\n\nexport type ${this.getEnumTypeName(enumName)} = typeof ${enumName}[keyof typeof ${enumName}];`;
			} else {
				// 生成传统 enum 形式
				const enumValues = Object.entries(jsonObj)
					.map(([key, value]) => `${INDENT}${key} = '${value}'`)
					.join(',\n');
				return `export enum ${enumName} {\n${enumValues}\n}`;
			}
		} catch (error) {
			console.error('JSON 解析失败:', error);
			return '';
		}
	}

	parseString(value: NonArraySchemaObject, key: string): TReturnType {
		if (value.type !== 'string') return null;

		if (value.enum) {
			const enumResult = this.handleEnum(value, key);
			if (enumResult) return enumResult;
		}

		return {
			headerRef: '',
			renderStr: `${INDENT}${key}${this.requiredFieldS.includes(key) ? '' : '?'}: string${this.nullable(value.nullable)};`,
		};
	}

	parseProperties(properties: OpenAPIV3.BaseSchemaObject['properties'], interfaceKey: string): TReturnType {
		const content: string[] = [];
		const headerRef: string[] = [];

		for (const name in properties) {
			const schemaSource = properties[name];

			if ((schemaSource as ReferenceObject)?.$ref) {
				// 这里引用类型会携带 example
				const { headerRefStr, typeName, dataType } = this.parseRef((schemaSource as ReferenceObject).$ref);
				if (!headerRef.includes(headerRefStr)) headerRef.push(headerRefStr);

				// 添加注释（如果存在 description）
				const schema = schemaSource as SchemaObject;
				const comment = this.fieldComment(schema as NonArraySchemaObject);
				comment !== '' && content.push(comment);

				// 如果是枚举类型，需要使用正确的类型名
				const finalTypeName = dataType === 'enum' ? this.getEnumTypeName(typeName) : typeName;
				content.push(`${INDENT}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: ${finalTypeName};`);

				const example = (schemaSource as SchemaObject).example;
				if (dataType === 'enum' && example && isValidJSON(example)) {
					const fileName = this.typeNameToFileName(typeName);

					// example 并且是 枚举 不做检查直接覆盖
					const enumContent = this.convertJsonToEnumString(example as string, typeName);
					this.enumsMap.set(fileName, { fileName, content: enumContent });
				}
				continue;
			}

			if ('allOf' in schemaSource) {
				const V1 = schemaSource['allOf']?.[0] as ReferenceObject;
				if (V1?.$ref) {
					// 这里枚举值不会走
					const { headerRefStr, typeName, dataType } = this.parseRef(V1.$ref);
					const finalTypeName = dataType === 'enum' ? this.getEnumTypeName(typeName) : typeName;

					if (!headerRef.includes(headerRefStr)) headerRef.push(headerRefStr);

					// 添加注释（如果存在 description）
					const schema = schemaSource as SchemaObject;
					const comment = this.fieldComment(schema as NonArraySchemaObject);
					comment !== '' && content.push(comment);

					content.push(`${INDENT}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: ${finalTypeName}${this.nullable(schemaSource.nullable)};`);

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
						const arrayVal = this.parseArray(schema, name) ?? this.defaultReturn;
						content.push(arrayVal?.renderStr ?? '');
						if (!headerRef.includes(arrayVal.headerRef) && interfaceKey !== arrayVal.typeName) headerRef.push(arrayVal.headerRef);
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
							// 将枚举名转换为大驼峰命名
							const enumName = name.charAt(0).toUpperCase() + name.slice(1);
							// console.log(enumName, name);
							if (schema.example && isValidJSON(schema.example)) {
								const typeName = this.getEnumTypeName(enumName);
								const header = `import type { ${typeName} } from '${this.config.importEnumPath}';`;
								if (!headerRef.includes(header)) headerRef.push(header);
								const fileName = this.typeNameToFileName(enumName);
								// 检查了
								if (!this.enumsMap.has(fileName)) {
									const enumContent = this.convertJsonToEnumString(schema.example as string, enumName);
									this.enumsMap.set(fileName, { fileName, content: enumContent });
								}

								content.push(`${INDENT}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: ${typeName}${this.nullable(schema.nullable)};`);
							} else {
								const enumResult = this.parseEnum(schema as NonArraySchemaObject, enumName);
								if (enumResult?.renderStr) {
									const typeName = this.getEnumTypeName(enumName);
									const header = `import type { ${typeName} } from '${this.config.importEnumPath}';`;
									if (!headerRef.includes(header)) headerRef.push(header);
									const fileName = this.typeNameToFileName(enumName);

									// 检查了
									if (!this.enumsMap.has(fileName)) {
										this.enumsMap.set(fileName, { fileName, content: enumResult.renderStr });
									}

									content.push(`${INDENT}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: ${typeName}${this.nullable(schema.nullable)};`);
								}
							}
						} else if (schema.format && schema.format === 'binary') {
							content.push(`${INDENT}${name}${this.requiredFieldS.includes(name) ? '' : '?'}: File${this.nullable(schema.nullable)};`);
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
					// 检查是否为枚举类型（支持传统 enum 和 const 对象形式）
					const isEnum = content.includes('export enum ') || (content.includes('export const ') && content.includes('as const'));

					if (isEnum && !this.enumsMap.has(fileName)) {
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
		const tasks = [];
		const exportFileContent: string[] = [];
		for (const [, value] of this.enumsMap) {
			const task = async ({ fileName, content }: TrenderType) => {
				exportFileContent.push(`export * from './${fileName}';`);
				const _path = `${this.config.saveEnumFolderPath}/${fileName}.ts`;
				await writeFileRecursive(_path, content);
				log.info(`${_path.padEnd(80)} - Write done!`);
			};
			tasks.push(task(value));
		}
		await Promise.all(tasks);
		await this.writeIndexFile(`${this.config.saveEnumFolderPath}/index.ts`, exportFileContent);
		log.success('Enums write done!');
	}

	private async writeFile(): Promise<void> {
		const tasks = [];
		const exportFileContent: string[] = [];
		const saveTypeFolderPath = `${this.config.saveTypeFolderPath}/models/`;

		for (const [, value] of this.schemasMap) {
			const task = async ({ fileName, content }: TrenderType) => {
				exportFileContent.push(`export * from './${fileName}';`);
				const _path = `${saveTypeFolderPath}${fileName}.ts`;
				await writeFileRecursive(_path, content);
				log.info(`${_path.padEnd(80)} - Write done!`);
			};
			tasks.push(task(value));
		}

		await Promise.all(tasks);
		await this.writeIndexFile(`${saveTypeFolderPath}index.ts`, exportFileContent);
		log.success('Component parse & write done!');
	}

	async handle(): Promise<void> {
		await this.parseData();
		await this.writeFile();
		await this.writeEnums();
	}

	private async writeIndexFile(indexPath: string, newExports: string[]): Promise<void> {
		const exportLines = newExports.filter(Boolean);
		if (!exportLines.length) return;

		let existingLines: string[] = [];
		if (this.appendMode) {
			try {
				const current = await fs.promises.readFile(indexPath, 'utf8');
				existingLines = current.split('\n').filter((line) => line.trim() !== '');
			} catch {
				existingLines = [];
			}
		}

		const existingSet = new Set(existingLines);
		const merged = [...existingLines, ...exportLines.filter((line) => !existingSet.has(line))];
		const content = merged.join('\n');
		await writeFileRecursive(indexPath, content);
	}
}

export default Components;
