import { program } from 'commander';
import inquirer from 'inquirer';

import data from '../package.json';
import { type GitFeatureOption, gitHandle } from './git-local-config';
import { skillHandle } from './skill-init';
import { lintHandle } from './standard/lint-init';
import { Main } from './swagger-codegen';

program.version(`${data.version}`, '-v --version').usage('<command> [options]');

program
	.command('type')
	.description('auto interface')
	.option('-s, --show <what>', 'show interface list after generation: miss | gen')
	.option('-f, --format [config]', 'enable prettier formatting after generation; optionally specify a prettier config file path (e.g. --format .prettierrc.mjs)')
	.option('-l, --log-level <level>', 'set log output level: silent | error | warn | info | verbose')
	.action((options: { show?: string; format?: string | boolean; logLevel?: string }) => {
		const raw = (options.show ?? '').toLowerCase().trim();
		const show =
			raw === 'miss' || raw === 'missing' || raw === 'm' || raw === 'exclude' || raw === 'x'
				? 'miss'
				: raw === 'gen' || raw === 'generated' || raw === 'g' || raw === 'include' || raw === 'i'
					? 'gen'
					: undefined;
		const Instance = new Main();
		Instance.initialize(show, options.format, options.logLevel).catch((error) => {
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

program
	.command('skill')
	.description('initialize an agent skill into the current project')
	.action(() => {
		skillHandle().catch((error) => {
			console.error(error);
		});
	});

program.parse(process.argv);
