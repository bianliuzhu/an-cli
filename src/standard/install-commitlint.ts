import { writeFileSync } from 'fs';
import { join } from 'path';
import createLogger from 'progress-estimator';
import { exec, exit, which } from 'shelljs';

import { log, spinner } from '../utils';
import { ADD_COMMIT_MSG, COMMIT_CONFIG_CONTENT, COMMIT_VERIFY, HUSKY_INSTALL, NPM_HUSK } from './const';

const _logger = createLogger({
	storagePath: join(__dirname, '.progress-estimator'),
});

export const commitlintHanlde = async () => {
	if (!which('git')) {
		log.warning('Sorry, this script requires git');
		exit(1);
	}
	const instllcommit = new Promise((resolve, reject) => {
		try {
			exec(COMMIT_VERIFY, { silent: true }); // 5
			resolve({ success: true });
		} catch (error) {
			reject(new Error(String(error)));
		}
	});
	const toggle = true;
	const execution = new Promise((resolve, reject) => {
		try {
			exec(NPM_HUSK, { silent: toggle }); // 1
			exec(HUSKY_INSTALL, { silent: toggle }); // 2
			exec(ADD_COMMIT_MSG, { silent: toggle }); // 4
			writeFileSync(
				`${process.cwd()}/commitlint.config.js`,
				COMMIT_CONFIG_CONTENT, // 6
			);
			resolve({ success: true });
		} catch (error) {
			spinner.error('Commitlint installation failed!');
			reject(new Error(String(error)));
		}
	});
	try {
		await _logger(instllcommit, 'Install Commitlint', {
			estimate: 10000,
		});
		await _logger(execution, 'Setup Commitlint hooks and config');
	} catch (error) {
		console.log('commitlintHanlde=====>', error);
	}
};
