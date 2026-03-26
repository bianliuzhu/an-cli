import chalk from 'chalk';
import ora from 'ora';

// 日志级别定义（数值越大输出越多）
const LOG_LEVELS = { silent: 0, error: 1, warn: 2, info: 3, verbose: 4 } as const;
type LogLevelKey = keyof typeof LOG_LEVELS;
let currentLogLevel: LogLevelKey = 'info';

export function setLogLevel(level: LogLevelKey) {
	currentLogLevel = level;
}

export function shouldLog(level: LogLevelKey): boolean {
	return LOG_LEVELS[currentLogLevel] >= LOG_LEVELS[level];
}

/** 解析错误上下文信息 */
interface ParseErrorLike {
	type: string;
	message: string;
	path?: string;
	method?: string;
}

/**
 * 格式化结构化解析错误为可读字符串
 * 输出格式示例: [PARAMETERS] GET /api/goods/list - Parameter "id" has no schema defined
 */
export function formatParseError(error: ParseErrorLike): string {
	const parts: string[] = [`[${error.type}]`];
	if (error.path || error.method) {
		const endpoint = [error.method, error.path].filter(Boolean).join(' ');
		parts.push(endpoint);
		parts.push('-');
	}
	parts.push(error.message);
	return parts.join(' ');
}

// 在终端中显示 loading 动画图标。
const SP = ora();

/**
 * 在 spinner 运行期间安全地输出日志：
 * 先清除当前 spinner 行，打印内容后再恢复 spinner。
 */
function interruptSpinner(fn: () => void) {
	if (SP.isSpinning) {
		SP.clear();
		fn();
		SP.render();
	} else {
		fn();
	}
}

export const log = {
	/** 详细信息（verbose 级别），如单个文件写入完成 */
	info: (msg: string) => {
		if (shouldLog('verbose')) interruptSpinner(() => console.log(chalk.dim(msg)));
	},
	/** 错误信息（error 级别） */
	error: (msg: string) => {
		if (shouldLog('error')) interruptSpinner(() => console.log(chalk.red(`❌ ${msg}`)));
	},
	/** 成功信息（info 级别） */
	success: (msg: string) => {
		if (shouldLog('info')) interruptSpinner(() => console.log(chalk.green(`🥂 ${msg}`)));
	},
	/** 警告信息（warn 级别） */
	warning: (msg: string) => {
		if (shouldLog('warn')) interruptSpinner(() => console.log(chalk.yellow(`❗️ ${msg}`)));
	},
	/** 加载信息（verbose 级别） */
	load: (msg: string) => {
		if (shouldLog('verbose')) interruptSpinner(() => console.log(chalk.dim(`🌐 ${msg}`)));
	},
	/** verbose 级别的日志 */
	verbose: (msg: string) => {
		if (shouldLog('verbose')) interruptSpinner(() => console.log(chalk.dim(msg)));
	},
	/** warn 级别的日志 */
	warn: (msg: string) => {
		if (shouldLog('warn')) interruptSpinner(() => console.log(chalk.yellow(msg)));
	},
	/** info 级别的普通日志 */
	print: (...args: unknown[]) => {
		if (shouldLog('info')) interruptSpinner(() => console.log(...args));
	},
};

export const spinner = {
	stop: () => SP.stop(),
	error: (msg: string) => shouldLog('error') && SP.fail(`❌ ${chalk.red(msg)}`),
	start: (msg: string) => {
		if (!shouldLog('info')) return;
		SP.text = chalk.blue(msg);
		SP.start();
	},
	success: (msg: string) => {
		if (!shouldLog('info')) return;
		SP.stopAndPersist({
			symbol: chalk.green('✔'),
			text: chalk.green(msg),
		});
	},
};
