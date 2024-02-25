import { program } from 'commander';
import data from '../package.json';
import { Main } from './build-type';
import { lintHandle } from './standard/lint-init';

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
	.description('install eslint, prettier, commitlint')
	.action(() => lintHandle());

program.parse(process.argv);
