import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { spinner } from '../utils';

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
		const vscodePath = `${process.cwd()}/.vscode`;
		try {
			mkdirSync(vscodePath);
			copyFileSync(`${__dirname.replace('lib/src', 'template/settings.json')}`, `${vscodePath}/settings.json`);
			spinner.success('✨ .vscode/settings.json file write success');
		} catch (error) {
			spinner.error('.vscode/settings.json file write fail');
			console.error(error);
		}
	}
};

export default vscodeHandle;
