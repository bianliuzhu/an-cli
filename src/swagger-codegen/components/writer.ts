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

		for (const [, value] of schemasMap) {
			const task = async ({ fileName, content }: RenderEntry) => {
				exportFileContent.push(`export * from './${fileName}';`);
				const _path = `${saveTypeFolderPath}${fileName}.ts`;
				await writeFileRecursive(_path, content);
				log.info(`${_path.padEnd(80)} - Write done!`);
			};
			tasks.push(task(value));
		}

		await Promise.all(tasks);
		await writeIndexFileWithDedup(`${saveTypeFolderPath}index.ts`, exportFileContent, { appendMode: this.appendMode });
		log.success('Component parse & write done!');
	}

	async writeEnums(enumsMap: Map<string, RenderEntry>): Promise<void> {
		const tasks = [];
		const exportFileContent: string[] = [];
		for (const [, value] of enumsMap) {
			const task = async ({ fileName, content }: RenderEntry) => {
				exportFileContent.push(`export * from './${fileName}';`);
				const _path = `${this.config.saveEnumFolderPath}/${fileName}.ts`;
				await writeFileRecursive(_path, content);
				log.info(`${_path.padEnd(80)} - Write done!`);
			};
			tasks.push(task(value));
		}
		await Promise.all(tasks);
		await writeIndexFileWithDedup(`${this.config.saveEnumFolderPath}/index.ts`, exportFileContent, { appendMode: this.appendMode });
		log.success('Enums write done!');
	}
}
