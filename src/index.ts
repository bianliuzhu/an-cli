import { program } from 'commander';
import data from '../package.json';
import { lintHandle } from './lint-init';
import vscodeHandle from './vscode';

program.version(`${data.version}`, '-v --version').usage('<command> [options]');

program
	.command('lint')
	.description('install eslint, prettier, commitlint')
	// .action(() => lintHandle());
	.action(() => vscodeHandle());

program.parse(process.argv);
