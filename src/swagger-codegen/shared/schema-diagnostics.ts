export type SchemaDiagnosticKind = 'warning' | 'runtime';
export type SchemaDiagnosticLevel = 'warn' | 'info' | 'verbose';

export class SchemaDiagnostics {
	private readonly locations = new WeakMap<object, string>();
	private readonly groups = new Map<string, { message: string; kind: SchemaDiagnosticKind; paths: Set<string> }>();

	constructor(document: unknown) {
		const visit = (value: unknown, path: string): void => {
			if (!value || typeof value !== 'object' || this.locations.has(value)) return;
			this.locations.set(value, path);
			for (const [key, child] of Object.entries(value)) {
				if (['example', 'examples', 'default', 'enum'].includes(key) || key.startsWith('x-')) continue;
				visit(child, `${path}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`);
			}
		};
		visit(document, '#');
	}

	pathFor(schema: object): string | undefined {
		return this.locations.get(schema);
	}

	add(message: string, path = '#', kind: SchemaDiagnosticKind = 'warning'): void {
		const key = `${kind}:${message}`;
		const group = this.groups.get(key) ?? { message, kind, paths: new Set<string>() };
		group.paths.add(path);
		this.groups.set(key, group);
	}

	flush(write: (message: string, level: SchemaDiagnosticLevel) => void): void {
		for (const kind of ['warning', 'runtime'] as const) {
			const groups = [...this.groups.values()].filter((group) => group.kind === kind).sort((left, right) => left.message.localeCompare(right.message));
			if (!groups.length) continue;
			const count = groups.reduce((total, group) => total + group.paths.size, 0);
			const title = kind === 'warning' ? 'Schema warnings' : 'Schema runtime validation';
			const summary = `${title}: ${count} unique finding(s), ${groups.length} category(s).`;
			if (kind === 'runtime') {
				write(`${summary} TypeScript types do not enforce these constraints; validate payloads at runtime. Use --log-level verbose for details.`, 'info');
			}
			const lines = [summary];
			for (const { message, paths } of groups) {
				lines.push(`- ${message}`);
				for (const path of [...paths].sort()) lines.push(`  ${path}`);
			}
			write(lines.join('\n'), kind === 'warning' ? 'warn' : 'verbose');
		}
		this.groups.clear();
	}
}
