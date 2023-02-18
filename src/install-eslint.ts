import fs from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { spinner } from './utils';
import { REACT_ESLINT, VUE_ESLINT } from './const';
import createLogger from 'progress-estimator';
import _package from '../package.json';
const logger = createLogger({
	storagePath: join(__dirname, '.progress-estimator'),
});
type Tframework = 'react' | 'vue' | 'node';
export const eslintHandle = async (framework: Tframework) => {
	spinner.start('start installation...');

	const shell = framework === 'vue' ? VUE_ESLINT : REACT_ESLINT;
	const lintfile = framework === 'vue' ? `vue-eslint.js` : `react-eslint.js`;

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
		const rootPath = exec('npm root -g');
		rootPath.stdout?.on('data', (data: string) => {
			fs.copyFileSync(
				`${data.trim()}/${_package.name}/template/.eslintignore`,
				`${process.cwd()}/.eslintignore`,
			);
			fs.copyFileSync(
				`${data.trim()}/${_package.name}/template/${lintfile}`,
				`${process.cwd()}/.eslintrc.js`,
			);
			spinner.success('✨ .eslintrc file write success');
			resolve({ success: true });
		});
		rootPath.stderr?.on('data', () => {
			spinner.error('.eslintrc file write fail');
			reject({ success: false });
		});
	});

	await logger(eslintInstll, 'instll eslint', { estimate: 30000 });

	await logger(copyEslintFile, 'write .eslintignore file');
};
