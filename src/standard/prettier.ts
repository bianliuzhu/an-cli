import { exec } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';
import createLogger from 'progress-estimator';

import { spinner } from '../utils';
import { Prettier } from './const';

const logger = createLogger({
	storagePath: join(__dirname, '.progress-estimator'),
});

export const prettierHanlde = async () => {
	const execution = new Promise((resolve, reject) => {
		const child = exec(Prettier, (err) => {
			if (err) {
				spinner.error(err.message);
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

	const copyFile = new Promise((resolve, reject) => {
		try {
			const prettierConfig = [
				'module.exports = {',
				'printWidth: 80,',
				'tabWidth: 2,',
				'useTabs: true,',
				'semi: true,',
				'singleQuote: true,',
				'quoteProps: "as-needed",',
				'trailingComma: "none",',
				'bracketSpacing: true,',
				'arrowParens: "always",',
				'rangeStart: 0,',
				'proseWrap: "preserve",',
				'htmlWhitespaceSensitivity: "css"',
				'};',
			];

			const targetPath = join(process.cwd(), '.prettierrc.js');
			writeFileSync(targetPath, prettierConfig.join('\n'), 'utf8');
			resolve({ success: true });
		} catch (error) {
			spinner.error('.prettierrc file write failed!');
			reject(new Error(String(error)));
		}
	});

	try {
		await logger(execution, 'Install Prettier', { estimate: 10000 });
		await logger(copyFile, 'Create .prettierrc file');
	} catch (error) {
		console.error('prettierHanlde======>', error);
	}
};
