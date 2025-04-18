import inquirer, { QuestionCollection } from 'inquirer';
import { eslintHandle } from './install-eslint';
import { prettierHanlde } from './prettier';
import { commitlintHanlde } from './install-commitlint';
import vscodeHandle from './vscode';

export function lintHandle(): void {
	const promptList: QuestionCollection[] = [
		{
			type: 'list',
			message: 'Choose the framework to use',
			name: 'framework',
			choices: ['React', 'Vue'],
			filter: (val: string) => val.toLowerCase(),
			validate: (answer: string) => {
				if (!answer.length) {
					return 'Choose the framework to use';
				}
				return true;
			},
		},
		// {
		// 	type: 'list',
		// 	message: 'CSS 预编译',
		// 	name: 'css',
		// 	choices: ['Less', 'Sass'],
		// 	filter: (val: string) => val.toLowerCase(),
		// 	validate: (answer) => {
		// 		console.log(answer);
		// 		if (!answer.length) {
		// 			return 'CSS 预编译';
		// 		}
		// 		return false;
		// 	},
		// },
	];
	inquirer.prompt(promptList).then(async (answers) => {
		await commitlintHanlde();
		await prettierHanlde();
		await vscodeHandle();
		await eslintHandle(answers.framework);
	});
}
