import { exec } from 'child_process';
import {
	existsSync,
	readFileSync,
	writeFileSync,
	copyFileSync,
	mkdirSync,
	constants,
} from 'fs';
import _package from '../package.json';
import { spinner } from './utils';

const vscodeHandle = async () => {
	const setting_path = `${process.cwd()}/.vscode/settings.json`;
	if (existsSync(setting_path)) {
		const readData = readFileSync(setting_path, 'utf-8');
		const parsedData = JSON.parse(readData);
		parsedData['editor.formatOnSave'] = true;
		parsedData['editor.defaultFormatter'] = 'esbenp.prettier-vscode';
		const writeData = JSON.stringify(parsedData, null, '\t');
		writeFileSync(setting_path, writeData);
	} else {
		const rootPath = exec('npm root -g');
		rootPath.stdout?.on('data', (data: string) => {
			const vscodePath = `${process.cwd()}/.vscode`;
			mkdirSync(vscodePath);
			copyFileSync(
				`${data.trim()}/${_package.name}/template/settings.json`,
				`${vscodePath}/settings.json`,
				constants.COPYFILE_EXCL,
			);
			spinner.success('✨ .vscode/settings.json file write success');
		});
		rootPath.stderr?.on('data', () => {
			spinner.error('.vscode/settings.json file write fail');
		});
	}
};

export default vscodeHandle;
