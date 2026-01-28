import { defineConfig, globalIgnores } from 'eslint/config';

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import sortKeysPlugin from 'eslint-plugin-sort-keys-fix';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import header from 'eslint-plugin-header';
import importPlugin from 'eslint-plugin-import';
import noFunctionDeclareAfterReturn from 'eslint-plugin-no-function-declare-after-return';
import unusedImports from 'eslint-plugin-unused-imports';
import eslintPluginPrettier from 'eslint-plugin-prettier';

const ERROR = 2;
const WARN = 1;
const OFF = 0;

export default defineConfig([
	globalIgnores([
		'dist',
		'src/types/**/*.ts',
		'src/types/**/*.d.ts',
		'node_modules',
		"apps/**/*.ts",
	]),

	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			// 1. 基础 JavaScript 配置
			js.configs.recommended,

			// 2. TypeScript 配置（选择一套即可）
			// 选项 A：标准类型检查（推荐）
			tseslint.configs.recommendedTypeChecked,
			tseslint.configs.stylisticTypeChecked,

			// 选项 B：严格类型检查（更严格）
			// tseslint.configs.strictTypeChecked,
			// tseslint.configs.stylisticTypeChecked,
		],
		languageOptions: {
			ecmaVersion: 2020,
			globals: {
				...globals.browser,
				JSX: true,
				__DEV__: true,
			},
			parser: tseslint.parser,
			parserOptions: {
				project: ['./tsconfig.json', './tsconfig.node.json', './tsconfig.app.json'],
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			prettier: eslintPluginPrettier,
			'sort-keys-fix': sortKeysPlugin,
			'simple-import-sort': simpleImportSort,
			header,
			import: importPlugin,
			'no-function-declare-after-return': noFunctionDeclareAfterReturn,
			'unused-imports': unusedImports,
		},
		rules: {
			'prettier/prettier': ERROR,
			'@typescript-eslint/no-unused-vars': [
				ERROR,
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					vars: 'all',
					args: 'after-used',
					ignoreRestSiblings: true,
				},
			],
			'@typescript-eslint/consistent-type-imports': [
				ERROR,
				{
					prefer: 'type-imports',
				},
			],
			'no-function-declare-after-return/no-function-declare-after-return': ERROR,
			'space-before-blocks': ERROR,
			'simple-import-sort/imports': [
				ERROR,
				{
					groups: [['^.*\\u0000$'], ['^\\u0000'], ['^@?\\w'], ['^'], ['^\\.']],
				},
			],
			'no-multi-spaces': ERROR,
			'valid-typeof': [ERROR, { requireStringLiterals: true }],
			'import/no-namespace': ERROR,
			'unused-imports/no-unused-imports': ERROR,
			'unused-imports/no-unused-vars': [
				ERROR,
				{
					vars: 'all',
					varsIgnorePattern: '^_',
					args: 'after-used',
					argsIgnorePattern: '^_',
				},
			],
			'no-restricted-syntax': [
				'error',
				{
					selector: 'ExportDeclaration[declaration=false]',
					message: '所有导出必须在模块顶层',
				},
			],
		},
	},
	{
		files: ['**/*.tsx'],
		rules: {
			'import/prefer-named-exports': 'off',
			'import/no-anonymous-default-export': ERROR,
		},
	},
	{
		files: ['**/*.d.ts'],
		rules: {
			'@typescript-eslint/consistent-type-imports': OFF,
		},
	},
]);
