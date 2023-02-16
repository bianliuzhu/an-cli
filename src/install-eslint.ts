import { plugins } from './type';
import { spinner, log } from './utils';

import { exec } from 'child_process';

import fs from 'fs';
export const eslintHandle = (plugins: plugins) => {
	spinner.start('start installation...');
	const rootPath = exec('npm root -g');
	rootPath.stdout?.on('data', (data: string) => {
		fs.copyFile(
			`${data.trim()}/anl/template/.eslintrc.js`,
			`${process.cwd()}/.eslintrc.js`,
			(err) => {
				if (err) console.log('出了点小问题，哈哈哈哈');
				else console.log('拷贝成功');
			},
		);
	});
	rootPath.stderr?.on('data', (data) => {
		spinner.error(data);
	});
	const ReactShell = `npm i eslint-plugin-react@latest @typescript-eslint/eslint-plugin@latest @typescript-eslint/parser@latest -D`;
	const child = exec(ReactShell, (err) => {
		if (err) spinner.error(err.message);
	});

	child.stdout?.on('data', function (data) {
		spinner.success(data);
	});

	child.stderr?.on('data', function (data) {
		spinner.error(data);
	});
};
