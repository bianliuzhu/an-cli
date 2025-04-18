import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { spinner } from '../utils';

const defaultSettings = {
	'editor.formatOnSave': true,
	'[javascript]': {
		'editor.defaultFormatter': 'vscode.typescript-language-features',
	},
	'[typescript]': {
		'editor.defaultFormatter': 'esbenp.prettier-vscode',
	},
	'[json]': {
		'editor.quickSuggestions': {
			strings: true,
		},
		'editor.suggest.insertMode': 'replace',
		'gitlens.codeLens.scopes': ['document'],
		'editor.defaultFormatter': 'esbenp.prettier-vscode',
	},
};

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
			writeFileSync(`${vscodePath}/settings.json`, JSON.stringify(defaultSettings, null, '\t'));
			spinner.success('✨ .vscode/settings.json file write success');
		} catch (error) {
			spinner.error('.vscode/settings.json file write fail');
			console.error(error);
		}
	}
};

export default vscodeHandle;
