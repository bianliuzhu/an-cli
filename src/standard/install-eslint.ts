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
		try {
			fs.copyFileSync(`${__dirname.replace('lib/src', 'template/.eslintignore')}`, `${process.cwd()}/.eslintignore`);
			fs.copyFileSync(`${__dirname.replace('lib/src', `template/${lintfile}`)}`, `${process.cwd()}/.eslintrc.js`);
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
