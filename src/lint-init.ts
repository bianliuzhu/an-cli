import inquirer, { QuestionCollection } from 'inquirer';

import { eslintHandle } from './install-eslint';

export function lintHandle(): void {
	const promptList: QuestionCollection[] = [
		{
			type: 'list',
			message: 'Choose to use the framework',
			name: 'framework',
			choices: ['React', 'Vue', 'Node'],
			filter: (val: string) => val.toLowerCase(),
		},
		{
			type: 'checkbox',
			message: 'Choose to install plugins',
			name: 'plugins',
			choices: ['ESLint', 'StyleLint', 'CommitLint', 'Prettier'],
			filter: (val: string[]) => val.map((item) => item.toLowerCase()),
		},
	];
	inquirer.prompt(promptList).then((answers) => {
		console.log(answers);
		eslintHandle(answers.plugins);
	});
}
