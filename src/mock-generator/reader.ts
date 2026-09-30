import path from 'node:path';
import ts from 'typescript';

const methods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'SEARCH', 'TRACE']);

export interface ReaderOptions {
	projectRoot: string;
	apiDir: string;
	typeDir: string;
	apiFiles: string[];
}

export interface MockOperation {
	name: string;
	method: string;
	url: string;
	sourceFile: string;
	description: string;
	responseType: ts.Type;
	bodyType: ts.Type;
	node: ts.Node;
}

interface OperationNode {
	name: ts.Identifier;
	call: ts.CallExpression;
	method: string;
}

function collectOperations(sourceFile: ts.SourceFile): OperationNode[] {
	const aliases = new Map<string, string>();
	for (const statement of sourceFile.statements) {
		if (!ts.isImportDeclaration(statement)) continue;
		const bindings = statement.importClause?.namedBindings;
		if (!bindings || !ts.isNamedImports(bindings)) continue;
		for (const specifier of bindings.elements) {
			const method = (specifier.propertyName ?? specifier.name).text;
			if (methods.has(method)) aliases.set(specifier.name.text, method);
		}
	}
	const result: OperationNode[] = [];
	for (const statement of sourceFile.statements) {
		if (!ts.isVariableStatement(statement) || !statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
		for (const declaration of statement.declarationList.declarations) {
			if (!ts.isIdentifier(declaration.name) || !declaration.initializer || !ts.isArrowFunction(declaration.initializer)) continue;
			const body = declaration.initializer.body;
			let expression = ts.isBlock(body) ? body.statements.find(ts.isReturnStatement)?.expression : body;
			while (expression && (ts.isParenthesizedExpression(expression) || ts.isAwaitExpression(expression))) expression = expression.expression;
			if (!expression || !ts.isCallExpression(expression) || !ts.isIdentifier(expression.expression)) continue;
			const method = aliases.get(expression.expression.text) ?? expression.expression.text;
			if (!methods.has(method) || !expression.typeArguments?.length) continue;
			result.push({ name: declaration.name, call: expression, method });
		}
	}
	return result;
}

export function isGeneratedApiFile(fileName: string): boolean {
	const content = ts.sys.readFile(fileName);
	return content !== undefined && collectOperations(ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true)).length > 0;
}

function readUrl(expression: ts.Expression | undefined, name: string): string {
	if (expression && (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression))) return expression.text;
	if (expression && ts.isTemplateExpression(expression)) {
		let url = expression.head.text;
		for (const span of expression.templateSpans) {
			let parameter = span.expression;
			if (ts.isCallExpression(parameter) && ts.isIdentifier(parameter.expression) && parameter.expression.text === 'encodeURIComponent' && parameter.arguments.length === 1) {
				parameter = parameter.arguments[0];
			}
			if (!ts.isIdentifier(parameter)) throw new Error(`Cannot resolve the URL parameter of ${name}: ${parameter.getText()}`);
			url += `:${parameter.text}${span.literal.text}`;
		}
		return url;
	}
	throw new Error(`Cannot resolve the static URL of ${name}. Regenerate the API file with anl type.`);
}

function compilerOptions(projectRoot: string): ts.CompilerOptions {
	const configPath = path.join(projectRoot, 'tsconfig.json');
	let options: ts.CompilerOptions = {};
	if (ts.sys.fileExists(configPath)) {
		const loaded = ts.readConfigFile(configPath, (fileName) => ts.sys.readFile(fileName));
		if (loaded.error) throw new Error(ts.flattenDiagnosticMessageText(loaded.error.messageText, '\n'));
		const parsed = ts.parseJsonConfigFileContent(loaded.config, ts.sys, projectRoot);
		const errors = parsed.errors.filter((diagnostic) => diagnostic.code !== 18003);
		if (errors.length) throw new Error(errors.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')).join('\n'));
		options = parsed.options;
	}
	return {
		target: ts.ScriptTarget.ESNext,
		module: ts.ModuleKind.ESNext,
		moduleResolution: ts.ModuleResolutionKind.Bundler,
		...options,
		noEmit: true,
		skipLibCheck: true,
		strictNullChecks: true,
		types: [],
	};
}

export function readMockOperations(options: ReaderOptions): { checker: ts.TypeChecker; operations: MockOperation[] } {
	const overlays = new Map<string, string>();
	for (const fileName of options.apiFiles) {
		const content = ts.sys.readFile(fileName);
		if (content === undefined) throw new Error(`API file not found: ${fileName}. Run anl type first.`);
		const source = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true);
		let overlay = content;
		const calls = collectOperations(source).map((operation) => operation.call);
		for (const call of calls.reverse()) {
			const level = call.arguments[2];
			if (level && ts.isStringLiteral(level) && (level.text === 'data' || level.text === 'axios')) {
				overlay = `${overlay.slice(0, level.getStart(source))}'serve'${overlay.slice(level.end)}`;
			}
		}
		overlays.set(path.resolve(fileName), overlay);
	}
	const settings = compilerOptions(options.projectRoot);
	const host = ts.createCompilerHost(settings);
	const getSourceFile = host.getSourceFile.bind(host);
	host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
		const overlay = overlays.get(path.resolve(fileName));
		return overlay === undefined ? getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) : ts.createSourceFile(fileName, overlay, languageVersion, true);
	};
	const rootNames = [
		...options.apiFiles,
		...ts.sys.readDirectory(options.typeDir, ['.ts', '.tsx'], ['**/node_modules/**']),
		...ts.sys.readDirectory(options.apiDir, ['.d.ts'], ['**/node_modules/**']),
	];
	const program = ts.createProgram([...new Set(rootNames)], settings, host);
	const checker = program.getTypeChecker();
	const operations: MockOperation[] = [];
	for (const fileName of options.apiFiles) {
		const source = program.getSourceFile(fileName);
		if (!source) throw new Error(`Cannot load API file: ${fileName}`);
		for (const operation of collectOperations(source)) {
			const bodyNode = operation.call.typeArguments![0];
			const bodyType = checker.getTypeFromTypeNode(bodyNode);
			const returnType = checker.getTypeAtLocation(operation.call);
			const responseType = checker.getAwaitedType(returnType) ?? returnType;
			if ((bodyType.flags | responseType.flags) & ts.TypeFlags.Any) {
				throw new Error(`Cannot resolve the response type of ${operation.name.text} in ${fileName}. Check the API declarations and ResponseModel<T>.`);
			}
			const symbol = checker.getSymbolAtLocation(operation.name);
			operations.push({
				name: operation.name.text,
				method: operation.method,
				url: readUrl(operation.call.arguments[0], operation.name.text),
				sourceFile: fileName,
				description: symbol ? ts.displayPartsToString(symbol.getDocumentationComment(checker)) : '',
				responseType,
				bodyType,
				node: bodyNode,
			});
		}
	}
	return { checker, operations };
}
