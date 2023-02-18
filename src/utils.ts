import chalk from 'chalk';
import ora from 'ora';

export const log = {
	info: (msg: string) => console.log(chalk.dim(msg)),
	error: (msg: string) => console.log(chalk.red(`× ${msg}`)),
	success: (msg: string) => console.log(chalk.green(`✔ ${msg}`)),
	warning: (msg: string) => console.log(chalk.yellow(`⚠️ ${msg}`)),
	load: (msg: string) => console.log(chalk.dim(`☯︎ ${msg}`)),
};

// 在终端中显示 loading 动画图标。
const SP = ora();
export const spinner = {
	stop: () => SP.stop(),
	error: (msg: string) => SP.fail(`❌ ${chalk.red(msg)}`),
	start: (msg: string) => {
		SP.text = chalk.blue(msg);
		SP.start();
	},
	success: (msg: string) => {
		SP.stopAndPersist({
			symbol: chalk.green('✔'),
			text: chalk.green(msg),
		});
	},
};
