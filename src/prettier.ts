import { Prettier } from './const';
import createLogger from 'progress-estimator';
import { join } from 'path';
import { exec } from 'child_process';
import { spinner } from './utils';
import { copyFileSync } from 'fs';

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
		try {
			copyFileSync(
				`${__dirname.replace('lib/src', 'template/prettierrc.js')}`,
				`${process.cwd()}/.prettierrc.js`,
			);
			spinner.success('✨ .prettierrc write done!');
			resolve({ success: true });
		} catch (error) {
			spinner.error('❌ prettierrc write fail!');
			reject(error);
		}
	});

	try {
		await logger(execution, 'install prettier', { estimate: 10000 });
		await logger(copyFile, 'write .prettierrc file');
	} catch (error) {
		console.error('prettierHanlde======>', error);
	}
};
