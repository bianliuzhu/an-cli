import type { WriteIndexOptions } from '../types';

import fs from 'fs';

import { writeFileRecursive } from '../../utils';
import { segmentToNamespacePrefix } from './naming';

export async function readIndexLines(indexPath: string): Promise<string[]> {
	try {
		const current = await fs.promises.readFile(indexPath, 'utf8');
		return current.split('\n').filter((line) => line.trim() !== '');
	} catch {
		return [];
	}
}

export function buildNamespaceExport(segment: string): string {
	const namespace = segmentToNamespacePrefix(segment);
	if (!namespace) {
		throw new Error(`无法为 segment "${segment}" 生成 namespace 别名，请改用包含字母/数字的 apiListFileName。`);
	}
	return `export * as ${namespace} from './${segment}';`;
}

export function mergeNamespaceExports(existing: string[], targetSegments: string[], generatedSegments: string[], upgradeExisting = false): string[] {
	const targetSet = new Set(targetSegments);
	const kept = existing.flatMap((line) => {
		const segment = /from\s+['"]\.\/([^'"]+)['"]/.exec(line)?.[1];
		if (segment && targetSet.has(segment)) return [];
		if (upgradeExisting && segment && !/export\s+\*\s+as\s+/.test(line)) {
			try {
				return [buildNamespaceExport(segment)];
			} catch {
				return [line];
			}
		}
		return [line];
	});
	return [...kept, ...generatedSegments.map(buildNamespaceExport)];
}

export async function writeIndexFileWithDedup(indexPath: string, newExports: string[], options: WriteIndexOptions = {}): Promise<void> {
	const { appendMode = false } = options;
	const exportLines = newExports.filter(Boolean);
	if (!exportLines.length) return;

	const existingLines = appendMode ? await readIndexLines(indexPath) : [];

	const existingSet = new Set(existingLines);
	const merged = [...existingLines, ...exportLines.filter((line) => !existingSet.has(line))];
	const content = merged.join('\n');
	await writeFileRecursive(indexPath, content);
}
