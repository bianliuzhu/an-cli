import fs from 'fs';

import { writeFileRecursive } from '../../utils';

interface WriteIndexOptions {
	appendMode?: boolean;
}

export async function writeIndexFileWithDedup(indexPath: string, newExports: string[], options: WriteIndexOptions = {}): Promise<void> {
	const { appendMode = false } = options;
	const exportLines = newExports.filter(Boolean);
	if (!exportLines.length) return;

	let existingLines: string[] = [];
	if (appendMode) {
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
