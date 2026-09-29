import type { OpenAPI, OpenAPIV3 } from 'openapi-types';

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function normalizeOpenApiDocument(document: OpenAPI.Document, diagnostic: (message: string) => void = () => undefined): OpenAPIV3.Document {
	const version = 'openapi' in document ? document.openapi : undefined;
	if (version && !/^3\.[01]\.\d+$/.test(version)) {
		throw new Error(`Unsupported OpenAPI version: ${version}. Schema generation supports OpenAPI 3.0.x and 3.1.x.`);
	}
	if (!version?.startsWith('3.1.')) return document as OpenAPIV3.Document;

	const normalizeSchema = (input: unknown): unknown => {
		if (input === true) return {};
		if (input === false) return { enum: [] };
		if (!isObject(input)) return input;
		const schema: JsonObject = { ...input };
		for (const keyword of ['properties', '$defs', 'patternProperties', 'dependentSchemas']) {
			const entries = schema[keyword];
			if (isObject(entries)) schema[keyword] = Object.fromEntries(Object.entries(entries).map(([name, child]) => [name, normalizeSchema(child)]));
		}
		for (const keyword of ['items', 'additionalProperties', 'not', 'contains', 'propertyNames', 'unevaluatedProperties', 'if', 'then', 'else']) {
			if (!(keyword in schema)) continue;
			if (keyword === 'additionalProperties' && typeof schema[keyword] === 'boolean') continue;
			schema[keyword] = normalizeSchema(schema[keyword]);
		}
		for (const keyword of ['allOf', 'anyOf', 'oneOf', 'prefixItems']) {
			const children = schema[keyword];
			if (Array.isArray(children)) schema[keyword] = children.map(normalizeSchema);
		}
		const constraints: unknown[] = Array.isArray(schema.allOf) ? [...(schema.allOf as unknown[])] : [];
		if ('$ref' in schema && Object.keys(schema).length > 1) {
			constraints.push({ $ref: schema.$ref });
			delete schema.$ref;
		}
		if (schema.type === 'null') {
			delete schema.type;
			constraints.push({ enum: [null] });
		} else if (Array.isArray(schema.type)) {
			constraints.push({ anyOf: schema.type.map((type: unknown) => normalizeSchema({ type })) });
			delete schema.type;
		}
		if ('const' in schema) {
			constraints.push({ enum: [schema.const] });
			delete schema.const;
		}
		if ('nullable' in schema) {
			diagnostic('OpenAPI 3.1 nullable is ignored; use type: null or a null union branch.');
			delete schema.nullable;
		}
		for (const keyword of ['exclusiveMinimum', 'exclusiveMaximum'] as const) {
			if (typeof schema[keyword] === 'number') {
				const bound = keyword === 'exclusiveMinimum' ? 'minimum' : 'maximum';
				const value = schema[keyword];
				const existing = schema[bound];
				if (typeof existing !== 'number' || (bound === 'minimum' ? value >= existing : value <= existing)) {
					schema[bound] = value;
					schema[keyword] = true;
				} else {
					delete schema[keyword];
				}
			}
		}
		if (schema.type === 'array' && !('items' in schema)) schema.items = {};
		if (constraints.length) schema.allOf = constraints;
		return schema;
	};

	const visit = (input: unknown): unknown => {
		if (Array.isArray(input)) return input.map(visit);
		if (!isObject(input)) return input;
		return Object.fromEntries(
			Object.entries(input).map(([key, value]) => {
				if (key === 'schema') return [key, normalizeSchema(value)];
				if (key === 'schemas' && isObject(value)) return [key, Object.fromEntries(Object.entries(value).map(([name, schema]) => [name, normalizeSchema(schema)]))];
				if (['example', 'examples', 'default', 'enum'].includes(key) || key.startsWith('x-')) return [key, value];
				return [key, visit(value)];
			}),
		);
	};
	return visit(document) as OpenAPIV3.Document;
}
