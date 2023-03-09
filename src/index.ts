import { program } from 'commander';
import data from '../package.json';
import { lintHandle } from './lint-init';
import { Inter } from './int';
program.version(`${data.version}`, '-v --version').usage('<command> [options]');

program
	.command('lint')
	.description('install eslint, prettier, commitlint')
	.action(() => lintHandle())
	.command('i')
	.description('生成interface')
	.action(() => Inter());

program.parse(process.argv);
