import { program } from 'commander';

program
	.version(`${require('../package.json').version}`, '-v --version')
	.usage('<command> [options]');

program
	.command('lint')
	.description('初始化 eslint, prettier, commitlint')
	.action(() => {
		console.log('初始化');
	});

program.parse(process.argv);
