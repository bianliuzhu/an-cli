import { program } from 'commander';
import data from '../package.json';
import { lintHandle } from './lint-init';

program.version(`${data.version}`, '-v --version').usage('<command> [options]');

program
	.command('lint')
	.description('install eslint, prettier, commitlint')
	.action(() => lintHandle());

program.parse(process.argv);
