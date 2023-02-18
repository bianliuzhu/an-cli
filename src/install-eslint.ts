import { plugins } from './type';
import { spinner } from './utils';
import { exec } from 'child_process';
import createLogger from 'progress-estimator';
import { join } from 'path';

import fs from 'fs';
import { ReactShell } from './const';

const logger = createLogger({
	storagePath: join(__dirname, '.progress-estimator'),
});

export const eslintHandle = async (plugins: plugins) => {
	spinner.start('start installation...');
	const eslintInstll = new Promise((resolve, reject) => {
		const child = exec(ReactShell, (err) => {
			if (err) spinner.error(err.message);
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

	const copyEslintFile = new Promise((resolve, reject) => {
		const rootPath = exec('npm root -g');
		rootPath.stdout?.on('data', (data: string) => {
			fs.copyFileSync(
				`${data.trim()}/anl/template/.eslintignore`,
				`${process.cwd()}/.eslintignore`,
			);
			fs.copyFileSync(
				`${data.trim()}/anl/template/.react-eslint.js`,
				`${process.cwd()}/.eslintrc.js`,
			);
			resolve({ success: true });
		});
		rootPath.stderr?.on('data', (data) => {
			spinner.error(data);
			reject({ success: false });
		});
	});

	await logger(eslintInstll, 'installation eslint: ', {
		estimate: 5000,
	});

	await logger(copyEslintFile, 'installation eslintignore: ');
};
