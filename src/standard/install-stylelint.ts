import { exec } from 'child_process';
import fs from 'fs';
import { join } from 'path';
import createLogger from 'progress-estimator';

import { spinner } from '../utils';
import { StyleLint } from './const';

const logger = createLogger({
	storagePath: join(__dirname, '.progress-estimator'),
});

type Tcss = 'less' | 'sass';

export const styleLintHandle = async (css: Tcss) => {
	const lintHandle = new Promise((resolve, reject) => {
		const str = StyleLint(css);
		const child = exec(str, (err) => {
			if (err) {
				spinner.error(`Stylelint installation failed: ${err.message}`);
				reject(err);
			}
		});

		child.stdout?.on('data', function () {
			resolve({ success: true });
		});

		child.stderr?.on('data', function (data) {
			spinner.error(String(data));
			reject(new Error(String(data)));
		});
	});

	const copyLintFile = new Promise((resolve, reject) => {
		const content = `module.exports = {
	plugins: ['stylelint-${css}', 'stylelint-prettier'],
	extends: ['stylelint-config-standard', 'stylelint-prettier/recommended'],
	rules: {
		'prettier/prettier': [true, { singleQuote: true, tabWidth: 2 }],
		'custom-property-pattern': null,
	},
};`;

		fs.writeFile(`${process.cwd()}/.stylelintrc.js`, content, (err) => {
			if (err) {
				spinner.error(`.stylelintrc file creation failed: ${err.message}`);
				reject(err);
				return;
			}
			resolve({ success: true });
		});
	});

	try {
		await logger(lintHandle, 'Install Stylelint', {
			estimate: 10000,
		});

		await logger(copyLintFile, 'Create .stylelintrc file');
	} catch (error) {
		console.error('styleLintHandle======>', error);
	}
};
