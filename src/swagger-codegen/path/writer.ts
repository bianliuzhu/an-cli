import type { ContentBody, MapType, PathParseConfig } from '../types';

import { clearDir, log, runWithConcurrency, writeFileRecursive } from '../../utils';
import { PAD_END } from '../shared/constants';
import { getIndentation } from '../shared/format';
import { getServerSegment } from '../shared/naming';

// 限制并发文件写入数，避免在 macOS 上触发 EMFILE: too many open files
const FILE_WRITE_CONCURRENCY = 32;

export class PathWriter {
	private config: PathParseConfig;

	constructor(config: PathParseConfig) {
		this.config = config;
	}

	async write(map: MapType, apiListFileContent: string[], methodList: string[]): Promise<void> {
		const saveTypeFolderPath = this.config.saveTypeFolderPath;
		const segment = getServerSegment(this.config);
		const connectorsDir = segment ? `${saveTypeFolderPath}/connectors/${segment}` : `${saveTypeFolderPath}/connectors`;

		const writeOne = async (key: string, content: ContentBody) => {
			const { payload, response, fileName } = content;
			const [, method] = key.split('|');
			if (!methodList.includes(method)) methodList.push(method);

			const contentArray = [
				`declare namespace ${content.typeName} {`,
				...payload.path,
				...payload.query,
				...payload.header,
				...payload.body,
				`${getIndentation(this.config)}${response}`,
				`}`,
			];

			const _path = `${connectorsDir}/${fileName}.d.ts`;
			await writeFileRecursive(_path, contentArray.join('\n'));
			log.info(`${_path.padEnd(PAD_END)} - Write done!`);
		};

		// 将 Map 转换为数组并按 key 排序以确保顺序一致性
		const sortedEntries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));

		// 限制并发数，避免一次性打开过多文件描述符（EMFILE）
		await runWithConcurrency(sortedEntries, FILE_WRITE_CONCURRENCY, ([key, value]) => writeOne(key, value));

		// 对 methodList 排序以确保顺序一致性
		methodList.sort();
		apiListFileContent.unshift(`import { ${methodList.join(', ')} } from '${this.config.requestMethodsImportPath || './api'}';`, '\n');

		const apiListFileName = this.config.apiListFileName ?? 'index.ts';
		const apiListFilePath = `${this.config.saveApiListFolderPath}/${apiListFileName}`;

		await clearDir(apiListFilePath);
		await writeFileRecursive(apiListFilePath, apiListFileContent.join('\n'));

		log.step('Paths parsed & written');
	}
}
