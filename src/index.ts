import { program } from 'commander';
import data from '../package.json';
import { Main } from './swagger-codegen';
import { lintHandle } from './standard/lint-init';
import { gitHandle, type GitFeatureOption } from './git-local-config';
import inquirer from 'inquirer';

program.version(`${data.version}`, '-v --version').usage('<command> [options]');

program
	.command('type')
	.description('auto interface')
	.action(() => {
		const Instance = new Main();
		Instance.initialize();
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

		gitHandle(features);
	});

program.parse(process.argv);
