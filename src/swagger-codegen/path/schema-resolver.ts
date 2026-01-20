import { OpenAPIV3 } from 'openapi-types';
import { getEnumTypeName, typeNameToFileName } from '../shared/naming';
import { getIndentation, getLineEnding } from '../shared/format';
import { SUPPORTED_REQUEST_TYPES_ALL } from '../shared/http';
import { applyTypeMapping, nullableSuffix, stringifyArrayType, formatObjectProperties } from '../shared/schema-utils';
import { ArraySchemaObject, NonArraySchemaObject, ParseError, PathParseConfig, ReferenceObject, Schema, SchemaObject } from '../types';

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

	constructor(
		config: PathParseConfig,
		schemas: OpenAPIV3.ComponentsObject['schemas'],
		parameters: OpenAPIV3.ComponentsObject['parameters'],
		onError: HandleErrorFn,
	) {
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

			const importStatement = isEnum
				? `import('${this.config.importEnumPath}/${fileName}').${finalTypeName}`
				: `import('../models/${fileName}').${typeName}`;

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
				return this.handleComplexType(schema as SchemaObject);
			}

			if ('$ref' in schema) {
				return this.referenceObjectParse(schema);
			}

			const schemaObj = schema as SchemaObject;
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
					const valueType = this.main(schemaObj.additionalProperties as Schema);
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
