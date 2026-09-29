import type { ComponentSchemas, Schema, SchemaObject } from '../types';
import type { SchemaDiagnosticKind } from './schema-diagnostics';

import { formatPropertyName } from './naming';

export interface SchemaTypeOptions {
	reference: (reference: string) => string;
	direction?: SchemaDirection;
	schemas?: ComponentSchemas;
	exactObject?: boolean;
	mapping?: (schema: SchemaObject) => string | undefined;
	property?: (schema: Schema, name: string, required: boolean) => string | undefined;
	comment?: (schema: SchemaObject) => string;
	indentation?: string;
	diagnostic?: (message: string, path?: string, kind?: SchemaDiagnosticKind) => void;
	path?: string;
	schemaPath?: (schema: Schema) => string | undefined;
	allOfAncestors?: ReadonlySet<Schema>;
}

export type SchemaDirection = 'request' | 'response';

function propertySchema(schema: Schema | undefined, schemas: ComponentSchemas): SchemaObject | undefined {
	const visited = new Set<string>();
	while (schema && '$ref' in schema) {
		if (visited.has(schema.$ref)) return undefined;
		visited.add(schema.$ref);
		schema = resolveLocalSchemaReference(schema.$ref, schemas, () => undefined)?.schema;
	}
	return schema;
}

export function schemaNeedsDirection(schema: Schema | undefined, schemas: ComponentSchemas, direction: SchemaDirection, visited = new Set<string>()): boolean {
	if (!schema || typeof schema !== 'object') return false;
	if ('$ref' in schema) {
		if (visited.has(schema.$ref)) return false;
		visited.add(schema.$ref);
		return schemaNeedsDirection(resolveLocalSchemaReference(schema.$ref, schemas, () => undefined)?.schema, schemas, direction, visited);
	}
	for (const child of Object.values(schema.properties ?? {})) {
		const resolved = propertySchema(child, schemas);
		if (direction === 'request' ? resolved?.readOnly : resolved?.writeOnly) return true;
		if (schemaNeedsDirection(child, schemas, direction, visited)) return true;
	}
	const children = [...(schema.allOf ?? []), ...(schema.anyOf ?? []), ...(schema.oneOf ?? [])];
	if (schema.type === 'array') children.push(schema.items);
	if (schema.additionalProperties && typeof schema.additionalProperties === 'object') children.push(schema.additionalProperties);
	return children.some((child) => schemaNeedsDirection(child, schemas, direction, visited));
}

export function directionalTypeName(name: string, schema: Schema, schemas: ComponentSchemas, direction?: SchemaDirection): string {
	return direction && schemaNeedsDirection(schema, schemas, direction) ? `${name}.${direction === 'request' ? 'Request' : 'Response'}` : name;
}

export function hasMixedAdditionalProperties(schema: Schema): boolean {
	return (
		!('$ref' in schema) &&
		schema.type === 'object' &&
		!!Object.keys(schema.properties ?? {}).length &&
		!!schema.additionalProperties &&
		typeof schema.additionalProperties === 'object'
	);
}

export function resolveLocalSchemaReference(reference: string, schemas: ComponentSchemas, diagnostic: (message: string) => void): { name: string; schema: Schema } | undefined {
	const visited = new Set<string>();
	let current = reference;
	let first: { name: string; schema: Schema } | undefined;
	while (true) {
		let pointer: string;
		try {
			pointer = decodeURIComponent(current);
		} catch {
			diagnostic(`Invalid schema reference: ${current}.`);
			return undefined;
		}
		const match = /^#\/(?:components\/schemas|definitions)\/([^/]+)$/.exec(pointer);
		if (!match) {
			diagnostic(`Unsupported schema reference: ${current}. Only local component references are supported.`);
			return undefined;
		}
		const name = match[1].replace(/~1/g, '/').replace(/~0/g, '~');
		if (visited.has(name)) {
			diagnostic(`Circular schema aliases: ${reference}.`);
			return undefined;
		}
		visited.add(name);
		const schema = schemas && Object.hasOwn(schemas, name) ? schemas[name] : undefined;
		if (!schema || typeof schema !== 'object') {
			diagnostic(`Unresolved schema reference: ${current}.`);
			return undefined;
		}
		first ??= { name, schema };
		if (!('$ref' in schema)) return first;
		current = schema.$ref;
	}
}

function combine(types: string[], operator: ' | ' | ' & '): string {
	const union = operator === ' | ';
	const absorbing = union ? 'unknown' : 'never';
	const identity = union ? 'never' : 'unknown';
	if (types.includes(absorbing)) return absorbing;
	const unique = [...new Set(types.filter((type) => type !== identity))];
	if (!unique.length) return identity;
	if (unique.length === 1) return unique[0];
	return unique.map((type) => (type.includes(' | ') || type.includes(' & ') ? `(${type})` : type)).join(operator);
}

function literal(value: unknown): string {
	if (value === null) return 'null';
	if (typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map(literal).join(', ')}]`;
	if (value && typeof value === 'object') {
		return `{ ${Object.entries(value)
			.map(([name, entry]) => `${JSON.stringify(name)}: ${literal(entry)};`)
			.join(' ')} }`;
	}
	return 'never';
}

function matchesType(value: unknown, schema: SchemaObject): boolean {
	if (!schema.type) return true;
	if (value === null) return schema.nullable === true;
	switch (schema.type) {
		case 'integer':
			return typeof value === 'number' && Number.isInteger(value);
		case 'number':
			return typeof value === 'number' && Number.isFinite(value);
		case 'array':
			return Array.isArray(value);
		case 'object':
			return typeof value === 'object' && !Array.isArray(value);
		case 'string':
			return typeof value === 'string';
		case 'boolean':
			return typeof value === 'boolean';
		default:
			return false;
	}
}

function mergeAllOf(schema: SchemaObject, options: SchemaTypeOptions): { schema: Schema; ancestors: Set<Schema> } | undefined {
	if (!schema.allOf?.length) return undefined;
	const allowed = new Set(['type', 'properties', 'required', 'additionalProperties', 'items', 'allOf', 'title', 'description', 'example', 'deprecated', 'readOnly', 'writeOnly']);
	const ancestors = new Set(options.allOfAncestors);
	const branches: SchemaObject[] = [];
	const references = new Map<SchemaObject, Schema>();
	const collect = (candidate: Schema, visiting = new Set<Schema>()): boolean => {
		if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false;
		if (visiting.has(candidate) || options.allOfAncestors?.has(candidate)) return false;
		const resolved = propertySchema(candidate, options.schemas);
		if (!resolved || visiting.has(resolved) || options.allOfAncestors?.has(resolved)) return false;
		if (Object.keys(resolved).some((key) => !allowed.has(key)) || options.mapping?.(resolved)) return false;
		if (resolved.type !== undefined && resolved.type !== 'object' && resolved.type !== 'array') return false;
		if (resolved.additionalProperties !== undefined && resolved.additionalProperties !== true) return false;
		if (resolved.allOf && !resolved.allOf.length) return false;
		ancestors.add(candidate);
		ancestors.add(resolved);
		if ('$ref' in candidate) references.set(resolved, candidate);
		const next = new Set([...visiting, candidate, resolved]);
		branches.push(resolved);
		return (resolved.allOf ?? []).every((branch) => collect(branch, next));
	};
	if (!collect(schema)) return undefined;
	const kinds = new Set(branches.map((branch) => branch.type).filter((kind) => kind !== undefined));
	if (kinds.size !== 1) return undefined;
	const intersect = (children: Schema[]): Schema => {
		const unique = [...new Set(children)];
		if (unique.length === 1) return unique[0];
		const resolved = unique.map((child) => (child && typeof child === 'object' && !Array.isArray(child) ? propertySchema(child, options.schemas) : undefined));
		return {
			allOf: unique,
			description: resolved.find((child) => child?.description)?.description,
			readOnly: resolved.some((child) => child?.readOnly),
			writeOnly: resolved.some((child) => child?.writeOnly),
		};
	};
	if (kinds.has('array')) {
		if (branches.some((branch) => branch.properties !== undefined || branch.required !== undefined || branch.additionalProperties !== undefined)) return undefined;
		const arrays = branches.filter((branch) => branch.type === 'array');
		if (arrays.some((branch) => !branch.items)) return undefined;
		return { schema: { type: 'array', items: intersect(arrays.map((branch) => branch.items)) }, ancestors };
	}
	if (branches.some((branch) => 'items' in branch)) return undefined;
	const constrained = branches.filter((branch) => Object.keys(branch.properties ?? {}).length || branch.required?.length);
	if (constrained.length === 1 && constrained[0].type === 'object') {
		const reference = references.get(constrained[0]);
		if (reference) return { schema: reference, ancestors };
	}
	const properties = new Map<string, Schema[]>();
	const required = new Set<string>();
	for (const branch of branches) {
		for (const name of branch.required ?? []) required.add(name);
		for (const [name, child] of Object.entries(branch.properties ?? {})) {
			properties.set(name, [...(properties.get(name) ?? []), child]);
		}
	}
	return {
		schema: { type: 'object', properties: Object.fromEntries([...properties].map(([name, children]) => [name, intersect(children)])), required: [...required] },
		ancestors,
	};
}

export function renderSchemaType(schema: Schema | undefined, options: SchemaTypeOptions): string {
	const schemaPath = schema && typeof schema === 'object' ? options.schemaPath?.(schema) : undefined;
	const location = schemaPath ?? options.path ?? '#';
	const report = (message: string, kind: SchemaDiagnosticKind = 'warning') => options.diagnostic?.(message, location, kind);
	if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
		report('Invalid OpenAPI 3.0 schema; using unknown. Boolean schemas require OpenAPI 3.1.');
		return 'unknown';
	}
	if ('$ref' in schema) return options.reference(schema.$ref);

	const runtimeKeywords = [
		'pattern',
		'minimum',
		'maximum',
		'exclusiveMinimum',
		'exclusiveMaximum',
		'multipleOf',
		'minLength',
		'maxLength',
		'minItems',
		'maxItems',
		'uniqueItems',
		'minProperties',
		'maxProperties',
		'not',
	] as const;
	const presentConstraints = runtimeKeywords.filter((keyword) => schema[keyword] !== undefined);
	if (presentConstraints.length) {
		report(
			`Validation constraints (${presentConstraints.join(', ')}) are not enforced by TypeScript; validate payloads at runtime.`,
			presentConstraints.includes('not') ? 'warning' : 'runtime',
		);
	}
	for (const keyword of ['const', 'prefixItems', 'patternProperties', 'unevaluatedProperties', '$schema', '$id', 'if', 'then', 'else']) {
		if (keyword in schema) report(`Unsupported schema keyword for TypeScript generation: ${keyword}.`);
	}
	if (schema.nullable && !schema.type) report('OpenAPI 3.0 nullable requires type in the same schema; nullable was ignored.');

	const merged = mergeAllOf(schema, options);
	if (merged) return renderSchemaType(merged.schema, { ...options, path: location, allOfAncestors: merged.ancestors });

	const render = (child: Schema | undefined, suffix: string) => renderSchemaType(child, { ...options, exactObject: false, path: `${location}/${suffix}` });
	const formatObject = (fields: string[]): string => {
		if (options.indentation === undefined && !fields.some((field) => field.includes('\n'))) return `{ ${fields.join(' ')} }`;
		const indent = options.indentation ?? '\t';
		const body = fields
			.join('\n')
			.split('\n')
			.map((line) => `${indent}${line}`)
			.join('\n');
		return `{\n${body}\n}`;
	};
	const renderObject = (): string => {
		const properties = schema.properties ?? {};
		const required = new Set(schema.required ?? []);
		const names = [...new Set([...Object.keys(properties), ...required])].sort();
		const additional = schema.additionalProperties;
		const valueType = additional === false ? 'never' : additional === undefined || additional === true ? 'unknown' : render(additional, 'additionalProperties');
		if (additional === false && [...required].some((name) => !Object.hasOwn(properties, name))) return 'never';
		if (!names.length) return `Record<string, ${valueType}>`;

		const fieldTypes: string[] = [];
		const fields = names.map((name) => {
			const child = Object.hasOwn(properties, name) ? properties[name] : undefined;
			const resolved = propertySchema(child, options.schemas);
			if (resolved?.readOnly && resolved.writeOnly) report(`Property ${name} cannot be both readOnly and writeOnly.`);
			const excluded = options.direction === 'request' ? resolved?.readOnly : options.direction === 'response' ? resolved?.writeOnly : false;
			if (excluded) {
				fieldTypes.push('undefined');
				return `${formatPropertyName(name)}?: never;`;
			}
			const isRequired = required.has(name);
			const childIsObject = child && typeof child === 'object' && !Array.isArray(child);
			const childPath = `properties/${name.replace(/~/g, '~0').replace(/\//g, '~1')}`;
			const type = childIsObject ? (options.property?.(child, name, isRequired) ?? render(child, childPath)) : child !== undefined ? render(child, childPath) : valueType;
			fieldTypes.push(type);
			if (!isRequired) fieldTypes.push('undefined');
			const comment = childIsObject && !('$ref' in child) ? options.comment?.(child) : '';
			return `${comment ? `${comment}\n` : ''}${formatPropertyName(name)}${isRequired ? '' : '?'}: ${type};`;
		});
		if (additional !== false) {
			if (options.exactObject && hasMixedAdditionalProperties(schema)) {
				const keys = names.map((name) => JSON.stringify(name)).join(' | ');
				return `${formatObject(fields)} & ${formatObject([`[Key in Exclude<keyof Value, ${keys}>]: ${valueType};`])}`;
			}
			if (valueType !== 'unknown') report('Fixed properties and additionalProperties use a widened index signature; extra property values require runtime validation.');
			fields.push(`[key: string]: ${combine([valueType, ...fieldTypes], ' | ')};`);
		} else {
			report('TypeScript structural types cannot enforce additionalProperties: false on non-empty objects.', 'runtime');
		}
		return formatObject(fields);
	};

	let base: string;
	switch (schema.type) {
		case 'string':
			base = schema.format === 'binary' ? 'File' : 'string';
			break;
		case 'integer':
		case 'number':
			base = 'number';
			break;
		case 'boolean':
			base = 'boolean';
			break;
		case 'array':
			base = `Array<${render(schema.items, 'items')}>`;
			break;
		case 'object':
			base = renderObject();
			break;
		case undefined:
			base =
				schema.properties || schema.required || schema.additionalProperties !== undefined
					? combine([renderObject(), 'string', 'number', 'boolean', 'null', 'Array<unknown>'], ' | ')
					: 'unknown';
			break;
		default:
			report('Unsupported OpenAPI 3.0 type; using unknown.');
			base = 'unknown';
	}
	if (schema.type && schema.nullable) base = combine([base, 'null'], ' | ');
	const mapped = options.mapping?.(schema);
	if (mapped) base = schema.type && schema.nullable ? combine([mapped, 'null'], ' | ') : mapped;
	if (Array.isArray(schema.enum)) {
		const values = schema.enum.filter((value: unknown) => matchesType(value, schema));
		const enumType = combine(values.map(literal), ' | ');
		base = schema.type === 'object' || schema.type === 'array' ? combine([base, enumType], ' & ') : enumType;
	}
	const constraints = [base];
	for (const keyword of ['allOf', 'anyOf', 'oneOf'] as const) {
		const branches = schema[keyword];
		if (!branches) continue;
		if (!branches.length) {
			report(`${keyword} must contain at least one schema.`);
			continue;
		}
		if (keyword === 'oneOf' && branches.length > 1) report('oneOf is approximated as a TypeScript union; exactly-one matching requires runtime validation.');
		constraints.push(
			combine(
				branches.map((branch, index) => render(branch, `${keyword}/${index}`)),
				keyword === 'allOf' ? ' & ' : ' | ',
			),
		);
	}
	return combine(constraints, ' & ');
}

export function isNamedEnumSchema(schema: SchemaObject): boolean {
	return (
		(schema.type === 'string' || schema.type === 'number' || schema.type === 'integer') &&
		!schema.allOf &&
		!schema.anyOf &&
		!schema.oneOf &&
		!schema.not &&
		!!schema.enum?.length &&
		schema.enum.every((value: unknown) => value !== null && matchesType(value, schema))
	);
}
