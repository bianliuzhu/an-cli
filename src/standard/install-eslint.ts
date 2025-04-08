import { exec } from 'child_process';
import fs from 'fs';
import { join } from 'path';
import createLogger from 'progress-estimator';
import { spinner } from '../utils';
import { REACT_ESLINT, VUE_ESLINT } from './const';

const logger = createLogger({
	storagePath: join(__dirname, '.progress-estimator'),
});

type Tframework = 'react' | 'vue' | 'node';

const reactEslintConfig = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
	overrides: [],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	plugins: ['react', '@typescript-eslint'],
	rules: {},
};

const vueEslintConfig = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: ['eslint:recommended', 'plugin:vue/vue3-essential', 'plugin:@typescript-eslint/recommended', 'prettier'],
	overrides: [],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	plugins: ['vue', '@typescript-eslint'],
	rules: {},
};

export const eslintHandle = async (framework: Tframework) => {
	spinner.start('start installation...');

	const shell = framework === 'vue' ? VUE_ESLINT : REACT_ESLINT;
	const eslintConfig = framework === 'vue' ? vueEslintConfig : reactEslintConfig;

	const eslintInstll = new Promise((resolve, reject) => {
		const child = exec(shell, (err) => {
			if (err) spinner.error(err.message);
		});

		child.stdout?.on('data', () => {
			spinner.success('✨ eslint instll success!');
			resolve({ success: true });
		});

		child.stderr?.on('data', () => {
			spinner.error('eslint install fail!');
			reject({ success: false });
		});
	});

	const copyEslintFile = new Promise((resolve, reject) => {
		try {
			// 使用数组方式定义.eslintignore内容
			const eslintignoreContent = ['.eslintrc.js', '.prettierrc.js', 'commitlint.config.js'].join('\n');

			fs.writeFileSync(`${process.cwd()}/.eslintignore`, eslintignoreContent);
			fs.writeFileSync(`${process.cwd()}/.eslintrc.js`, `module.exports = ${JSON.stringify(eslintConfig, null, 2)}`);
			spinner.success('✨ .eslintrc file write success');
			resolve({ success: !0 });
		} catch (error) {
			spinner.error('.eslintrc file write fail');
			reject(error);
		}
	});

	try {
		await logger(eslintInstll, 'instll eslint', { estimate: 30000 });
		await logger(copyEslintFile, 'write .eslintignore file');
	} catch (error) {
		console.error('eslintHandle=====>', error);
	}
};
