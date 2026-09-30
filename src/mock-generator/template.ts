import type { MockGenerationOptions, MockValue } from '../../config';
import type { MockOperation } from './reader';

import ts from 'typescript';

interface FieldContext {
	name: string;
	path: string;
	optional?: boolean;
	tags?: Map<string, string>;
}

function literalValue(type: ts.Type, checker: ts.TypeChecker): string | number | boolean | undefined {
	if (type.isStringLiteral() || type.isNumberLiteral()) return type.value;
	if (type.flags & ts.TypeFlags.BooleanLiteral) return checker.typeToString(type) === 'true';
	return undefined;
}

function stringTemplate(field: FieldContext): string {
	const format = field.tags?.get('format')?.toLowerCase();
	const example = field.tags?.get('example')?.replace(/^['"]|['"]$/g, '') ?? '';
	if (format === 'uuid' || /(^id$|Id$|_id$|uuid)/.test(field.name) || /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(example)) return '@guid';
	if (format === 'email' || /email/i.test(field.name)) return '@email';
	if (format === 'uri' || format === 'url' || /(^url$|Url$|_url$)/.test(field.name)) return '@url';
	if (format === 'date') return '@date("yyyy-MM-dd")';
	if (format === 'time') return '@time("HH:mm:ss")';
	if (format === 'date-time' || /^\d{4}-\d{2}-\d{2}T/.test(example)) return '@datetime("yyyy-MM-ddTHH:mm:ss")Z';
	if (/(At|Time|Date)$|_(at|time|date)$/.test(field.name) || /^(date|time|datetime)$/i.test(field.name)) return '@datetime';
	return '@string';
}

function isArray(type: ts.Type, checker: ts.TypeChecker): boolean {
	return checker.isArrayType(type) || (type.isIntersection() && type.types.some((part) => checker.isArrayType(part)));
}

function envelopeType(operation: MockOperation, checker: ts.TypeChecker): { type: ts.Type; wrapped: boolean } {
	const properties = checker.getPropertiesOfType(operation.responseType);
	const data = checker.getPropertyOfType(operation.responseType, 'data');
	const wrapped =
		operation.responseType.getSymbol()?.name === 'ResponseModel' ||
		(!!data && operation.responseType !== operation.bodyType && checker.getTypeOfSymbolAtLocation(data, operation.node) === operation.bodyType);
	if (wrapped && properties.length > 1 && properties.every((property) => checker.getPropertyOfType(operation.bodyType, property.name))) {
		const compatible = properties
			.filter((property) => property.name !== 'data')
			.every((property) => {
				const bodyProperty = checker.getPropertyOfType(operation.bodyType, property.name)!;
				return checker.isTypeAssignableTo(checker.getTypeOfSymbolAtLocation(bodyProperty, operation.node), checker.getTypeOfSymbolAtLocation(property, operation.node));
			});
		if (compatible) return { type: operation.bodyType, wrapped: true };
	}
	return { type: operation.responseType, wrapped };
}

export function renderMockOperation(checker: ts.TypeChecker, operation: MockOperation, options: MockGenerationOptions = {}): { template: MockValue; warnings: string[] } {
	const warnings = new Set<string>();
	const maxDepth = options.maxDepth ?? 8;
	const arrayLength = options.arrayLength ?? 1;
	const envelope = envelopeType(operation, checker);
	let remainingNodes = 10000;
	const warn = (field: FieldContext, reason: string) => warnings.add(`${field.path}: ${reason}`);
	const render = (type: ts.Type, field: FieldContext, ancestors: Set<ts.Type>, depth: number): MockValue | undefined => {
		if (remainingNodes-- <= 0) {
			warnings.add(`${operation.name}: template size limit reached; reduce arrayLength or maxDepth`);
			return field.optional ? undefined : null;
		}
		if (type.flags & (ts.TypeFlags.Never | ts.TypeFlags.Undefined | ts.TypeFlags.Void)) return undefined;
		if (type.flags & ts.TypeFlags.Null) return null;
		const literal = literalValue(type, checker);
		if (literal !== undefined) return literal;
		if (type.flags & ts.TypeFlags.Boolean) return '@boolean';
		if (type.isUnion()) {
			const candidates = type.types.filter((part) => !(part.flags & (ts.TypeFlags.Null | ts.TypeFlags.Undefined | ts.TypeFlags.Never | ts.TypeFlags.Void)));
			if (!candidates.length) return type.types.some((part) => part.flags & ts.TypeFlags.Null) ? null : undefined;
			const values = candidates.map((part) => literalValue(part, checker));
			if (candidates.length > 1 && values.every((value) => value !== undefined)) return `@pick(${JSON.stringify(values)})`;
			return render(candidates[0], field, ancestors, depth);
		}
		if (type.flags & ts.TypeFlags.String) return stringTemplate(field);
		if (type.flags & (ts.TypeFlags.TemplateLiteral | ts.TypeFlags.StringMapping)) {
			warn(field, 'string pattern cannot be inferred safely; emitted @string');
			return '@string';
		}
		if (type.flags & ts.TypeFlags.Number) {
			if (/timestamp/i.test(field.name)) return '@integer(1700000000000,2000000000000)';
			return '@integer(0,100)';
		}
		if (type.isIntersection()) {
			const primitive = type.types.find((part) => part.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike));
			if (primitive) return render(primitive, field, ancestors, depth);
		}
		if (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) {
			warn(field, `${checker.typeToString(type)} has no inferable JSON structure; emitted null`);
			return null;
		}
		if (ancestors.has(type) || depth >= maxDepth) {
			warn(field, ancestors.has(type) ? 'recursive type truncated' : `maximum depth ${maxDepth} reached`);
			if (isArray(type, checker)) return [];
			return field.optional ? undefined : null;
		}
		const nextAncestors = new Set(ancestors).add(type);
		if (checker.isTupleType(type)) {
			return checker
				.getTypeArguments(type as ts.TypeReference)
				.map((element, index) => render(element, { name: field.name, path: `${field.path}[${index}]` }, nextAncestors, depth + 1) ?? null);
		}
		if (isArray(type, checker)) {
			const element = checker.getIndexTypeOfType(type, ts.IndexKind.Number);
			if (!element) {
				warn(field, 'array element type cannot be resolved; emitted []');
				return [];
			}
			if (nextAncestors.has(element)) {
				warn(field, 'recursive array truncated to []');
				return [];
			}
			const maximum = Number(field.tags?.get('maxItems') ?? arrayLength);
			const count = Math.min(arrayLength, Number.isFinite(maximum) ? Math.max(0, maximum) : arrayLength);
			return Array.from({ length: count }, (_, index) => render(element, { name: field.name, path: `${field.path}[${index}]` }, nextAncestors, depth + 1) ?? null);
		}
		if (type.getSymbol()?.name === 'Date') return '@datetime("yyyy-MM-ddTHH:mm:ss")Z';
		if (type.flags & (ts.TypeFlags.BigIntLike | ts.TypeFlags.ESSymbolLike | ts.TypeFlags.TypeParameter) || checker.getSignaturesOfType(type, ts.SignatureKind.Call).length) {
			warn(field, `${checker.typeToString(type)} is not a supported JSON type; emitted null`);
			return field.optional ? undefined : null;
		}
		const properties = checker.getPropertiesOfType(type);
		const result: Record<string, MockValue> = {};
		for (const property of properties) {
			const propertyType = checker.getTypeOfSymbolAtLocation(property, operation.node);
			const child: FieldContext = {
				name: property.name,
				path: `${field.path}.${property.name}`,
				optional: !!(property.flags & ts.SymbolFlags.Optional),
				tags: new Map(property.getJsDocTags(checker).map((tag) => [tag.name, ts.displayPartsToString(tag.text)])),
			};
			let value = render(propertyType, child, nextAncestors, depth + 1);
			if (value === undefined) continue;
			if (depth === 0) {
				const scalar = checker.getNonNullableType(propertyType);
				if (envelope.wrapped) {
					if (property.name === 'success' && scalar.flags & ts.TypeFlags.Boolean) value = true;
					if (property.name === 'code' && scalar.flags & ts.TypeFlags.Number) value = 10000;
					if ((property.name === 'msg' || property.name === 'message') && scalar.flags & ts.TypeFlags.String) value = 'success';
					if (property.name === 'timestamp' && scalar.flags & ts.TypeFlags.Number) value = Date.now();
				}
				if (options.responseDefaults && Object.hasOwn(options.responseDefaults, property.name)) value = options.responseDefaults[property.name];
			}
			Object.defineProperty(result, property.name, { value, enumerable: true, configurable: true, writable: true });
		}
		if (!properties.length) {
			const indexType = checker.getIndexTypeOfType(type, ts.IndexKind.String) ?? checker.getIndexTypeOfType(type, ts.IndexKind.Number);
			if (indexType) {
				if (indexType.flags & (ts.TypeFlags.Unknown | ts.TypeFlags.Any)) {
					warn(field, 'dictionary values have no inferable structure; emitted {}');
				} else {
					const key = checker.getIndexTypeOfType(type, ts.IndexKind.String) ? 'key' : '0';
					result[key] = render(indexType, { name: key, path: `${field.path}.${key}` }, nextAncestors, depth + 1) ?? null;
				}
			}
		}
		return result;
	};
	const template = render(envelope.type, { name: '', path: operation.name }, new Set(), 0) ?? null;
	return { template, warnings: [...warnings] };
}
