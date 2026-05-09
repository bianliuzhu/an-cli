import { defineConfig } from 'anl/config';

export default defineConfig({
	saveTypeFolderPath: 'src/types',
	saveApiListFolderPath: 'src/apis',
	saveEnumFolderPath: 'src/enums',
	importEnumPath: '../../../enums',
	requestMethodsImportPath: './config/fetch',
	formatting: {
		indentation: '\t',
		lineEnding: '\n',
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
			// 命名空间隔离策略：默认 'segment'，会根据 apiListFileName 派生 PascalCase 前缀
			// （如 op.ts → Op_xxx），无论单/多服务都会生效，避免多服务同 path 的 declare namespace 全局合并。
			// 设为 'none' 可关闭前缀；多服务场景下关闭存在跨服务类型污染风险，请谨慎。
			// namespaceIsolation: 'segment',
		},
	],
	enmuConfig: {
		erasableSyntaxOnly: false,
		varnames: 'enum-varnames',
		comment: 'enum-descriptions',
	},
});
