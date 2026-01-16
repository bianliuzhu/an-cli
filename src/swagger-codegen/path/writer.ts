import { log, writeFileRecursive, clearDir } from '../../utils';
import { ContentBody, MapType, PathParseConfig } from '../types';
import { getIndentation } from '../shared/format';

export class PathWriter {
	private config: PathParseConfig;

	constructor(config: PathParseConfig) {
		this.config = config;
	}

	async write(map: MapType, apiListFileContent: string[], methodList: string[]): Promise<void> {
		const Plist = [];
		const saveTypeFolderPath = this.config.saveTypeFolderPath;

		const taskFactory = (key: string, content: ContentBody) =>
			new Promise((resolve, reject) => {
				try {
					const { payload, response, fileName } = content;
					const [, method] = key.split('|');
					!methodList.includes(method) && methodList.push(method);

					const contentArray = [
						`declare namespace ${content.typeName} {`,
						...payload.path,
						...payload.query,
						...payload.header,
						...payload.body,
						`${getIndentation(this.config)}${response}`,
						`}`,
					];

					const _path = `${saveTypeFolderPath}/connectors/${fileName}.d.ts`;
					writeFileRecursive(_path, contentArray.join('\n'))
						.then(() => {
							log.info(`${_path.padEnd(80)} - Write done!`);
							resolve(1);
						})
						.catch((err) => {
							reject(err);
						});
				} catch (error) {
					reject(error);
				}
			});

		for (const [key, value] of map) {
			Plist.push(taskFactory(key, value));
		}

		await Promise.all(Plist);

		apiListFileContent.unshift(`import { ${methodList.join(', ')} } from '${this.config.requestMethodsImportPath || './api'}';`, '\n');

		const apiListFileName = this.config.apiListFileName || 'index.ts';
		const apiListFilePath = `${this.config.saveApiListFolderPath}/${apiListFileName}`;

		await clearDir(apiListFilePath);
		await writeFileRecursive(apiListFilePath, apiListFileContent.join('\n'));

		log.success('Path parse & write done!');
	}
}
