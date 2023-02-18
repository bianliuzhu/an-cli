import fs from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { log, spinner } from '../src/utils';
import { StyleLint } from '../src/const';
import createLogger from 'progress-estimator';

const logger = createLogger({
	storagePath: join(__dirname, '.progress-estimator'),
});
type Tcss = 'Less' | 'Sass';
export const styleLintHandle = async (css: Tcss) => {
	spinner.start('start installation...');
	const lintHandle = new Promise((resolve, reject) => {
		const str = StyleLint(css);
		console.log('安装命令=>', str);
		const child = exec(str, (err) => {
			if (err) spinner.error(`styleLintHandle: ${err.message}`);
		});

		child.stdout?.on('data', function (data) {
			spinner.success(data);
			resolve({ success: true });
		});

		child.stderr?.on('data', function (data) {
			spinner.error(data);
			reject({ success: false });
		});
	});

	const copyLintFile = new Promise((resolve, reject) => {
		const content = `module.exports = {
			plugins: ['stylelint-${css}', 'stylelint-prettier'],
			extends: ['stylelint-config-standard', 'stylelint-config-prettier', 'stylelint-prettier/recommended'],
			rules: {
				'prettier/prettier': [true, { singleQuote: true, tabWidth: 2 }],
				'custom-property-pattern': null,
			},
		};`;

		fs.writeFile(`${process.cwd()}/.stylelintrc.js`, content, (err) => {
			if (err) {
				log.error(`style copyLintFile => ${err.message}`);
				reject(err);
				return;
			}
			resolve({ success: true });
		});
	});

	await logger(lintHandle, 'installation style: ', {
		estimate: 5000,
	});

	await logger(copyLintFile, 'installation style: ');
};
