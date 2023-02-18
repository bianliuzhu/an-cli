import {
	NPM_HUSK,
	HUSKY_INSTALL,
	ADD_COMMIT_MSG,
	COMMIT_VERIFY,
	COMMIT_CONFIG_CONTENT,
} from './const';
import createLogger from 'progress-estimator';
import { join } from 'path';

import { log, spinner } from './utils';
import { writeFileSync } from 'fs';
import { exec, exit, which } from 'shelljs';
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
			spinner.start('commitlint tools instll...');
			exec(COMMIT_VERIFY, { silent: true }); // 5
			spinner.success('✨ commitlint instll success!');
			resolve({ success: true });
		} catch (error) {
			reject({ success: false });
		}
	});
	const toggle = true;
	const execution = new Promise((resolve, reject) => {
		try {
			log.load('instll husky...');
			exec(NPM_HUSK, { silent: toggle }); // 1
			log.success('husk instll done!');

			log.load('create husky...');
			exec(HUSKY_INSTALL, { silent: toggle }); // 2
			log.success('husk create done!');

			// log.load('set script...');
			// exec(SET_SCRIPT, { silent: toggle }); // 3
			// spinner.success('set script done!');

			log.load('set commit-msg...');
			exec(ADD_COMMIT_MSG, { silent: toggle }); // 4
			log.success('set commit-msg done!');

			log.load('create config file...');
			writeFileSync(
				`${process.cwd()}/commitlint.config.js`,
				COMMIT_CONFIG_CONTENT, // 6
			);
			log.success('config file write done!');

			resolve({ success: true });
		} catch (error) {
			spinner.error('commitlint instll fail!');
			reject({ success: false });
		}
	});

	await _logger(instllcommit, 'install commit lint tools', { estimate: 10000 });
	await _logger(execution, 'commit config file write');
};
