import { program } from 'commander';
import inquirer from 'inquirer';

import data from '../package.json';
import { type GitFeatureOption, gitHandle } from './git-local-config';
import { lintHandle } from './standard/lint-init';
import { Main } from './swagger-codegen';

program.version(`${data.version}`, '-v --version').usage('<command> [options]');

program
	.command('type')
	.description('auto interface')
	.action(() => {
		const Instance = new Main();
		Instance.initialize().catch((error) => {
			console.error(error);
		});
	});

program
	.command('lint')
	.description('install linting tools (eslint, stylelint, prettier, commitlint, vscode)')
	.action(() => lintHandle());

program
	.command('git')
	.description('config git Local custom command')
	.action(async () => {
		const { features } = await inquirer.prompt<{
			features: GitFeatureOption[];
		}>([
			{
				type: 'checkbox',
				name: 'features',
				message: 'Select the required Git features (multi-select):',
				choices: [
					{ name: 'gitflow standard branch creation', value: 'gitflow' },
					{ name: 'automatically set commit subject', value: 'commitSubject' },
					{ name: 'custom git command', value: 'customGitCommand' },
				],
				pageSize: 10,
			},
		]);

		gitHandle(features).catch((error) => {
			console.error(error);
		});
	});

program.parse(process.argv);
