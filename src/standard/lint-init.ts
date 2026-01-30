import chalk from 'chalk';
import inquirer from 'inquirer';

import { commitlintHanlde } from './install-commitlint';
import { eslintHandle } from './install-eslint';
import { styleLintHandle } from './install-stylelint';
import { prettierHanlde } from './prettier';
import vscodeHandle from './vscode';

export type LintFeature = 'eslint' | 'stylelint' | 'commitlint' | 'prettier' | 'vscode';
type Tframework = 'react' | 'vue';
type Tcss = 'less' | 'sass';

export function lintHandle(): void {
	void inquirer
		.prompt<{ features: LintFeature[] }>([
			{
				type: 'checkbox',
				name: 'features',
				message: 'Select the linting tools to install (multi-select):',
				choices: [
					{ name: 'ESLint - JavaScript/TypeScript linter', value: 'eslint' },
					{ name: 'Stylelint - CSS/SCSS/Less linter', value: 'stylelint' },
					{ name: 'Commitlint - Git commit message linter', value: 'commitlint' },
					{ name: 'Prettier - Code formatter', value: 'prettier' },
					{ name: 'VSCode - Editor settings', value: 'vscode' },
				],
				pageSize: 10,
			},
		])
		.then(async (answers) => {
			const { features } = answers;

			if (features.length === 0) {
				console.log('No tools selected. Exiting...');
				return;
			}

			// 如果选择了 ESLint，询问框架类型
			let framework: Tframework | undefined;
			if (features.includes('eslint')) {
				const frameworkAnswer = await inquirer.prompt<{ framework: Tframework }>([
					{
						type: 'list',
						message: 'Choose the framework to use:',
						name: 'framework',
						choices: ['React', 'Vue'],
						filter: (val: string) => val.toLowerCase() as Tframework,
					},
				]);
				framework = frameworkAnswer.framework;
			}

			// 如果选择了 Stylelint，询问 CSS 预处理器
			let css: Tcss | undefined;
			if (features.includes('stylelint')) {
				const cssAnswer = await inquirer.prompt<{ css: Tcss }>([
					{
						type: 'list',
						message: 'Choose the CSS preprocessor:',
						name: 'css',
						choices: ['Less', 'Sass'],
						filter: (val: string) => val.toLowerCase() as Tcss,
					},
				]);
				css = cssAnswer.css;
			}

			// 按顺序执行安装
			if (features.includes('commitlint')) {
				await commitlintHanlde();
			}

			if (features.includes('prettier')) {
				await prettierHanlde();
			}

			if (features.includes('vscode')) {
				await vscodeHandle();
			}

			if (features.includes('eslint') && framework) {
				await eslintHandle(framework);
			}

			if (features.includes('stylelint') && css) {
				await styleLintHandle(css);
			}

			// 绿色输出
			console.log(chalk.green('\n🎉 All selected tools have been installed successfully!\n'));
		});
}
