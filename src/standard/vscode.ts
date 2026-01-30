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

const vscodeHandle = (): Promise<void> => {
	const setting_path = `${process.cwd()}/.vscode/settings.json`;
	try {
		if (existsSync(setting_path)) {
			const readData = readFileSync(setting_path, 'utf-8');
			const parsedData = JSON.parse(readData) as Record<string, unknown>;
			parsedData['editor.formatOnSave'] = true;
			parsedData['editor.defaultFormatter'] = 'esbenp.prettier-vscode';
			const writeData = JSON.stringify(parsedData, null, '\t');
			writeFileSync(setting_path, writeData);
			spinner.success('VSCode settings updated!');
		} else {
			const vscodePath = `${process.cwd()}/.vscode`;
			mkdirSync(vscodePath);
			writeFileSync(`${vscodePath}/settings.json`, JSON.stringify(defaultSettings, null, '\t'));
			spinner.success('VSCode settings file created!');
		}
	} catch (error) {
		spinner.error('VSCode settings file creation failed!');
		console.error(error);
	}
	return Promise.resolve();
};

export default vscodeHandle;
