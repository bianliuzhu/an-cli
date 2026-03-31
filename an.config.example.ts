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
		},
	],
	enmuConfig: {
		erasableSyntaxOnly: false,
		varnames: 'enum-varnames',
		comment: 'enum-descriptions',
	},
});
