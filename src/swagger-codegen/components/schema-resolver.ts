import type { SchemaDiagnostics } from '../shared/schema-diagnostics';
import type { ArraySchemaObject, ComponentSchemas, ConfigType, NonArraySchemaObject, ReferenceObject, RenderEntry, SchemaObject } from '../types';

import { log } from '../../utils';
import { getIndentation, getLineEnding } from '../shared/format';
import { adjustImportPathForSegment, appendEnumSegment, createSchemaNameMap, getEnumSegment, getEnumTypeName, getServerSegment, typeNameToFileName } from '../shared/naming';
import {
	directionalTypeName,
	hasMixedAdditionalProperties,
	isNamedEnumSchema,
	renderSchemaType,
	resolveLocalSchemaReference,
	type SchemaDirection,
	schemaNeedsDirection,
} from '../shared/schema-type';
import { EnumParser } from './enum-parser';

interface ComponentReferenceMetadata {
	typeName: string;
	fileName: string;
	dataType: string | undefined;
}

export class ComponentSchemaResolver {
	private schemas: ComponentSchemas;
	private config: ConfigType;
	private enumParser: EnumParser;
	private schemaNames: Map<string, string>;
	private originalNames: Map<string, string>;

	schemasMap = new Map<string, RenderEntry>();

	constructor(
		schemas: ComponentSchemas,
		config: ConfigType,
		private readonly diagnostics?: SchemaDiagnostics,
	) {
		this.schemas = schemas;
		this.config = config;
		this.enumParser = new EnumParser(config);
		this.schemaNames = createSchemaNameMap(schemas, config.enmuConfig.erasableSyntaxOnly);
		this.originalNames = new Map([...this.schemaNames].map(([raw, name]) => [name, raw]));
	}

	private stringifyValue(value: unknown): string {
		if (typeof value === 'string') return value;
		try {
			return JSON.stringify(value);
		} catch {
			return String(value);
		}
	}

	private buildDocComment(schemaSource: NonArraySchemaObject | ArraySchemaObject, _fieldName?: string): string {
		const lines: string[] = [];

		const { title, description } = schemaSource;

		if (title) {
			lines.push(`@title ${title}`);
		}
		if (description) {
			description.split('\n').forEach((line, i) => lines.push(i === 0 ? `@description ${line}` : line));
		}

		if ('deprecated' in schemaSource && schemaSource.deprecated) {
			lines.push('@deprecated');
		}

		if ('default' in schemaSource && schemaSource.default !== undefined) {
			lines.push(`@default ${this.stringifyValue(schemaSource.default)}`);
		}

		if ('example' in schemaSource && schemaSource.example !== undefined) {
			lines.push(`@example ${this.stringifyValue(schemaSource.example)}`);
		}

		if ('format' in schemaSource && schemaSource.format) {
			lines.push(`@format ${schemaSource.format}`);
		}

		const constraints: [keyof SchemaObject, string][] = [
			['pattern', '@pattern'],
			['minimum', '@minimum'],
			['maximum', '@maximum'],
			['exclusiveMinimum', '@exclusiveMinimum'],
			['exclusiveMaximum', '@exclusiveMaximum'],
			['minLength', '@minLength'],
			['maxLength', '@maxLength'],
			['minItems', '@minItems'],
			['maxItems', '@maxItems'],
		];
		const hasConstraint = constraints.some(([key]) => schemaSource[key] !== undefined);
		if (hasConstraint) {
			const constraintLines = constraints
				.map(([key, tag]) => {
					if (schemaSource[key] === undefined) return '';
					return `${tag} ${this.stringifyValue(schemaSource[key])}`;
				})
				.filter(Boolean);
			lines.push(...constraintLines);
		}

		if (!lines.length) return '';

		const rendered = ['/**'];
		lines.forEach((line) => {
			if (!line) return;
			line = line.replace(/\*\//g, '* /');
			if (line.includes('\n')) {
				line.split('\n').forEach((sub) => rendered.push(` * ${sub}`));
			} else {
				rendered.push(` * ${line}`);
			}
		});
		rendered.push(' */');
		return rendered.join('\n');
	}

	private nameTheHumpCenterStroke(ref: string): ComponentReferenceMetadata {
		const rawName = ref;
		const typeName = this.schemaNames.get(rawName)!;
		const fileName = typeNameToFileName(typeName);
		const returnData: ComponentReferenceMetadata = { typeName, fileName, dataType: '' };
		if (this.schemas) {
			const data = this.schemas[rawName] as SchemaObject;
			if (data && isNamedEnumSchema(data)) {
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
			const segment = getServerSegment(this.config);
			const enumImportPath = appendEnumSegment(adjustImportPathForSegment(this.config.importEnumPath ?? '', segment), getEnumSegment(this.config));
			header = `import type { ${importTypeName} } from '${enumImportPath}';`;
		} else {
			header = `import type { ${typeName} } from './${fileName}';`;
		}

		return { headerRefStr: header, typeName, dataType };
	}

	private renderType(schema: SchemaObject | ReferenceObject, key: string, imports: string[], direction?: SchemaDirection, exactObject = false): string {
		const diagnostics = new Set<string>();
		const result = renderSchemaType(schema, {
			path: `#/components/schemas/${(this.originalNames.get(key) ?? key).replace(/~/g, '~0').replace(/\//g, '~1')}`,
			schemaPath: (child) => this.diagnostics?.pathFor(child),
			direction,
			schemas: this.schemas,
			exactObject,
			reference: (reference) => {
				const target = resolveLocalSchemaReference(reference, this.schemas, (message) => diagnostics.add(message));
				if (!target) return 'unknown';
				const { headerRefStr, typeName, dataType } = this.parseRef(target.name);
				if (typeName !== key && !imports.includes(headerRefStr)) imports.push(headerRefStr);
				return dataType === 'enum' ? getEnumTypeName(this.config, typeName) : directionalTypeName(typeName, target.schema, this.schemas, direction);
			},
			property: (child, name, required) => {
				if ('$ref' in child || !isNamedEnumSchema(child)) return undefined;
				const result = this.enumParser.handleEnum({ ...child, nullable: false } as NonArraySchemaObject, name, required);
				if (result?.headerRef && !imports.includes(result.headerRef)) imports.push(result.headerRef);
				return result?.typeName;
			},
			comment: (child) => this.buildDocComment(child),
			indentation: getIndentation(this.config),
			diagnostic: (message, path, kind) => {
				if (this.diagnostics) this.diagnostics.add(message, path, kind);
				else if (kind === 'runtime') log.verbose(`${path}: ${message}`);
				else diagnostics.add(`${path}: ${message}`);
			},
		});
		for (const message of diagnostics) log.warn(`${key}: ${message}`);
		return result;
	}

	private generateContent(schema: SchemaObject | ReferenceObject, key: string): string {
		const imports: string[] = [];
		const type = this.renderType(schema, key, imports);
		const variants: string[] = [];
		for (const direction of ['request', 'response'] as const) {
			if (schemaNeedsDirection(schema, this.schemas, direction)) {
				variants.push(`export type ${direction === 'request' ? 'Request' : 'Response'} = ${this.renderType(schema, key, imports, direction)};`);
			}
		}
		if (hasMixedAdditionalProperties(schema)) {
			variants.push(`export type Exact<Value extends ${key}> = Value & (${this.renderType(schema, key, imports, undefined, true)});`);
		}
		const variantBody = variants
			.join('\n')
			.split('\n')
			.map((line) => `${getIndentation(this.config)}${line}`)
			.join('\n');
		const namespace = variants.length ? `\nexport namespace ${key} {\n${variantBody}\n}` : '';
		const joinContent = (declaration: string) => (imports.length ? `${imports.join('\n')}\n\n${declaration}` : declaration).replace(/\n/g, getLineEnding(this.config));
		const simpleObject = !('$ref' in schema) && schema.type === 'object' && !schema.nullable && !schema.allOf && !schema.anyOf && !schema.oneOf && !schema.enum;
		if (simpleObject && type.startsWith('{')) {
			return joinContent(`export interface ${key} ${type}${namespace}`);
		}
		if (simpleObject && type.startsWith('Record<') && type.includes(key)) {
			return joinContent(`export interface ${key} extends ${type} {}${namespace}`);
		}
		return joinContent(`export type ${key} = ${type};${namespace}`);
	}

	main(): { enumsMap: Map<string, RenderEntry>; schemasMap: Map<string, RenderEntry> } {
		if (!this.schemas) {
			log.warn('schemas 为空');
			return { enumsMap: this.enumParser.enumsMap, schemasMap: this.schemasMap };
		}

		// 使用排序后的键以确保顺序一致性
		const schemaKeys = Object.keys(this.schemas).sort();
		for (const key of schemaKeys) {
			const schema = this.schemas[key];

			if (!('$ref' in schema) && isNamedEnumSchema(schema)) {
				const resolvedEnumKey = this.schemaNames.get(key)!;
				const enumResult = this.enumParser.parseEnum(schema as NonArraySchemaObject, resolvedEnumKey);
				if (enumResult?.renderStr && !this.enumParser.hasEnum(resolvedEnumKey)) {
					this.enumParser.addEnumByName(resolvedEnumKey, enumResult.renderStr);
				}
				continue;
			}

			const resolvedKey = this.schemaNames.get(key)!;
			const fileName = typeNameToFileName(resolvedKey);
			const content = this.generateContent(schema, resolvedKey);
			if (content) {
				const isEnum = content.includes('export enum ') || (content.includes('export const ') && content.includes('as const'));

				if (isEnum && !this.enumParser.hasEnum(resolvedKey)) {
					this.enumParser.addEnumByName(resolvedKey, content);
				} else {
					this.schemasMap.set(resolvedKey, { fileName, content });
				}
			}
		}

		return { enumsMap: this.enumParser.enumsMap, schemasMap: this.schemasMap };
	}
}
