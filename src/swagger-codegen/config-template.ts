import type { ConfigType, RequestTemplate } from './types';

export const DEFAULT_REQUEST_TEMPLATE: RequestTemplate = 'axios';

export function createDefaultConfig(template: RequestTemplate = DEFAULT_REQUEST_TEMPLATE): ConfigType {
	return {
		saveTypeFolderPath: 'src/types',
		saveApiListFolderPath: 'src/apis',
		saveEnumFolderPath: 'src/enums',
		importEnumPath: '../../../enums',
		requestMethodsImportPath: './config/fetch',
		requestTemplate: template,
		formatting: {
			indentation: '\t',
			lineEnding: '\n',
		},
		enmuConfig: {
			erasableSyntaxOnly: false,
			varnames: 'enum-varnames',
			comment: 'enum-descriptions',
		},
		swaggerConfig: [
			{
				url: 'https://generator3.swagger.io/openapi.json',
				apiListFileName: 'index.ts',
				headers: {},
				dataLevel: 'serve',
				parameterSeparator: '_',
				includeInterface: [],
				excludeInterface: [],
			},
		],
	};
}

export function renderTsConfig(config: ConfigType): string {
	return `import { defineConfig } from 'anl/config';

/** 请求模板：axios | fetch | wx | uniapp | taro，切换后需删除 <saveApiListFolderPath>/config 目录重新生成 */
export default defineConfig(${JSON.stringify(config, null, '\t')});
`;
}
