import { log, writeFileRecursive } from '../../utils';
import { ConfigType, RenderEntry } from '../types';
import { writeIndexFileWithDedup } from '../shared/writer';

export class ComponentWriter {
	private config: ConfigType;
	private appendMode: boolean;

	constructor(config: ConfigType, options?: { appendMode?: boolean }) {
		this.config = config;
		this.appendMode = options?.appendMode ?? false;
	}

	async writeSchemas(schemasMap: Map<string, RenderEntry>): Promise<void> {
		const tasks = [];
		const exportFileContent: string[] = [];
		const saveTypeFolderPath = `${this.config.saveTypeFolderPath}/models/`;

		// 将 Map 转换为数组并按 fileName 排序以确保顺序一致性
		const sortedEntries = Array.from(schemasMap.values()).sort((a, b) => a.fileName.localeCompare(b.fileName));

		for (const value of sortedEntries) {
			const task = async ({ fileName, content }: RenderEntry) => {
				exportFileContent.push(`export * from './${fileName}';`);
				const _path = `${saveTypeFolderPath}${fileName}.ts`;
				await writeFileRecursive(_path, content);
				log.info(`${_path.padEnd(80)} - Write done!`);
			};
			tasks.push(task(value));
		}

		await Promise.all(tasks);
		// exportFileContent 也需要排序以确保 index.ts 中的导出顺序一致
		exportFileContent.sort();
		await writeIndexFileWithDedup(`${saveTypeFolderPath}index.ts`, exportFileContent, { appendMode: this.appendMode });
		log.success('Component parse & write done!');
	}

	async writeEnums(enumsMap: Map<string, RenderEntry>): Promise<void> {
		const tasks = [];
		const exportFileContent: string[] = [];

		// 将 Map 转换为数组并按 fileName 排序以确保顺序一致性
		const sortedEntries = Array.from(enumsMap.values()).sort((a, b) => a.fileName.localeCompare(b.fileName));

		for (const value of sortedEntries) {
			const task = async ({ fileName, content }: RenderEntry) => {
				exportFileContent.push(`export * from './${fileName}';`);
				const _path = `${this.config.saveEnumFolderPath}/${fileName}.ts`;
				await writeFileRecursive(_path, content);
				log.info(`${_path.padEnd(80)} - Write done!`);
			};
			tasks.push(task(value));
		}
		await Promise.all(tasks);
		// exportFileContent 也需要排序以确保 index.ts 中的导出顺序一致
		exportFileContent.sort();
		await writeIndexFileWithDedup(`${this.config.saveEnumFolderPath}/index.ts`, exportFileContent, { appendMode: this.appendMode });
		log.success('Enums write done!');
	}
}
