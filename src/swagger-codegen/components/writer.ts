import type { ConfigType, RenderEntry } from '../types';

import fs from 'fs';

import { log, runWithConcurrency, writeFileRecursive } from '../../utils';
import { PAD_END } from '../shared/constants';
import { getServerSegment } from '../shared/naming';
import { writeIndexFileWithDedup } from '../shared/writer';

// 限制并发文件写入数，避免在 macOS 上触发 EMFILE: too many open files
const FILE_WRITE_CONCURRENCY = 32;

export class ComponentWriter {
	private config: ConfigType;
	private appendMode: boolean;

	constructor(config: ConfigType, options?: { appendMode?: boolean }) {
		this.config = config;
		this.appendMode = options?.appendMode ?? false;
	}

	async writeSchemas(schemasMap: Map<string, RenderEntry>): Promise<void> {
		const exportFileContent: string[] = [];
		const segment = getServerSegment(this.config);
		const segmentSuffix = segment ? `${segment}/` : '';
		const saveTypeFolderPath = `${this.config.saveTypeFolderPath}/models/${segmentSuffix}`;

		// 将 Map 转换为数组并按 fileName 排序以确保顺序一致性
		const sortedEntries = Array.from(schemasMap.values()).sort((a, b) => a.fileName.localeCompare(b.fileName));

		await runWithConcurrency(sortedEntries, FILE_WRITE_CONCURRENCY, async ({ fileName, content }) => {
			exportFileContent.push(`export * from './${fileName}';`);
			const _path = `${saveTypeFolderPath}${fileName}.ts`;
			try {
				await writeFileRecursive(_path, content);
				log.info(`${_path.padEnd(PAD_END)} - Write done!`);
			} catch (err) {
				log.warning(`${_path} - Write failed: ${err instanceof Error ? err.message : String(err)}`);
			}
		});
		// exportFileContent 也需要排序以确保 index.ts 中的导出顺序一致
		exportFileContent.sort();
		await writeIndexFileWithDedup(`${saveTypeFolderPath}index.ts`, exportFileContent, { appendMode: this.appendMode });
		log.step('Components parsed & written');
	}

	async writeEnums(enumsMap: Map<string, RenderEntry>): Promise<void> {
		const exportFileContent: string[] = [];

		// 将 Map 转换为数组并按 fileName 排序以确保顺序一致性
		const sortedEntries = Array.from(enumsMap.values()).sort((a, b) => a.fileName.localeCompare(b.fileName));

		await runWithConcurrency(sortedEntries, FILE_WRITE_CONCURRENCY, async ({ fileName, content }) => {
			exportFileContent.push(`export * from './${fileName}';`);
			const _path = `${this.config.saveEnumFolderPath}/${fileName}.ts`;
			// enum 文件夹跨服务共享：appendMode 下若已存在同名 enum 但内容不同，发出警告以避免静默覆盖
			if (this.appendMode) {
				try {
					const prev = await fs.promises.readFile(_path, 'utf8');
					if (prev !== content) {
						log.warning(`Enum 文件冲突：${_path} 已存在且内容不同，将被当前服务覆盖。请检查不同 swagger 服务是否定义了同名但语义不一致的枚举。`);
					}
				} catch {
					// 文件不存在，正常写入
				}
			}
			await writeFileRecursive(_path, content);
			log.info(`${_path.padEnd(PAD_END)} - Write done!`);
		});
		// exportFileContent 也需要排序以确保 index.ts 中的导出顺序一致
		exportFileContent.sort();
		await writeIndexFileWithDedup(`${this.config.saveEnumFolderPath}/index.ts`, exportFileContent, { appendMode: this.appendMode });
		log.step('Enums written');
	}
}
