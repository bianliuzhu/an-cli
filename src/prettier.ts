import { Prettier } from './const';
import createLogger from 'progress-estimator';
import { join } from 'path';
import { exec } from 'child_process';
import { spinner } from './utils';
import { copyFileSync } from 'fs';
import _package from '../package.json';
const logger = createLogger({
	storagePath: join(__dirname, '.progress-estimator'),
});
export const prettierHanlde = async () => {
	const execution = new Promise((resolve, reject) => {
		const child = exec(Prettier, (err) => {
			if (err) spinner.error(err.message);
		});

		child.stdout?.on('data', function () {
			spinner.success('✨ prettier instll success!');
			resolve({ success: true });
		});

		child.stderr?.on('data', function (data) {
			spinner.error(data);
			reject({ success: false });
		});
	});

	const copyFile = new Promise((resolve, reject) => {
		const getRootPath = exec('npm root -g');
		getRootPath.stdout?.on('data', (data: string) => {
			copyFileSync(
				`${data.trim()}/${_package.name}/template/.prettierrc.js`,
				`${process.cwd()}/.prettierrc.js`,
			);
			spinner.success('✨ .prettierrc write done!');
			resolve({ success: true });
		});
		getRootPath.stderr?.on('data', () => {
			spinner.error('.prettierrc write fail!');
			reject({ success: false });
		});
	});
	await logger(execution, 'install prettier', { estimate: 10000 });
	await logger(copyFile, 'write .prettierrc file');
};
