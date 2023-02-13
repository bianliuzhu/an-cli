import { program } from 'commander';
import { installEslint } from './eslint-init';
program
	.version(`${require('../package.json').version}`, '-v --version')
	.usage('<command> [options]');

program
	.command('lint')
	.description('初始化 eslint, prettier, commitlint')
	.action(() => {
		installEslint();
	});

program.parse(process.argv);
