const config = {
	printWidth: 180,
	tabWidth: 2,
	useTabs: true,
	semi: true,
	singleQuote: true,
	quoteProps: 'as-needed',
	jsxSingleQuote: false,
	trailingComma: 'all',
	bracketSpacing: true,
	bracketSameLine: true,
	arrowParens: 'always',
	requirePragma: false,
	insertPragma: false,
	proseWrap: 'preserve',
	htmlWhitespaceSensitivity: 'css',
	endOfLine: 'lf',
	embeddedLanguageFormatting: 'auto',
	overrides: [
		{
			files: ["apps/**/*.ts"],
			options: {
				printWidth: 3000,
			}
		},
	],
};

export default config;
