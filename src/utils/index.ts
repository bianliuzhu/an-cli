import chalk from 'chalk';
import fs from 'fs';
import ora from 'ora';
import path from 'path';
import { exec } from 'shelljs';

export function isFileExisted(path_way: string) {
	return new Promise((resolve, reject) => {
		fs.access(path_way, (err) => {
			if (err) {
				/**
				 * 文件不存在
				 */
				reject(false); // "不存在"
			} else {
				/**
				 * 文件存在
				 */
				resolve(true); // "存在"
			}
		});
	});
}
/**
 * 用于判断路径是否存在， 如果不存在，则创建一个
 * @param pathStr 文件路径
 * @returns {Promise<string>} 路径
 */
export async function mkdirPath(pathStr: string): Promise<string> {
	let projectPath = path.join(process.cwd());
	const tempDirArray = pathStr.split('\\');
	for (let i = 0; i < tempDirArray.length; i++) {
		projectPath = projectPath + '/' + tempDirArray[i];
		if (await isFileExisted(projectPath)) {
			const tempstats = fs.statSync(projectPath);
			if (!tempstats.isDirectory()) {
				fs.unlinkSync(projectPath);
				fs.mkdirSync(projectPath);
			}
		} else {
			fs.mkdirSync(projectPath);
		}
	}
	return projectPath;
}

export const writeFileRecursive = function (path: string, buffer: string): Promise<boolean> {
	return new Promise((resolve, reject) => {
		try {
			const lastPath = path.substring(0, path.lastIndexOf('/'));
			fs.mkdir(lastPath, { recursive: true }, (err) => {
				if (err) return reject(false);
				fs.writeFile(path, buffer, function (err) {
					if (err) return reject(false);
					resolve(true);
				});
			});
		} catch (error) {
			console.error(error);
			reject(error);
		}
	});
};

export const log = {
	info: (msg: string) => console.log(chalk.dim(msg)),
	error: (msg: string) => console.log(chalk.red(`❌ ${msg}`)),
	success: (msg: string) => console.log(chalk.green(`🥂 ${msg}`)),
	warning: (msg: string) => console.log(chalk.yellow(`❗️ ${msg}`)),
	load: (msg: string) => console.log(chalk.dim(`🌐 ${msg}`)),
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

/**
 * 删除文件夹下所有文件
 * @param {string} path
 */
function emptyDir(path: string): Promise<boolean> {
	return new Promise((resolve, reject) => {
		try {
			if (fs.existsSync(path)) {
				const files = fs.readdirSync(path);
				files.forEach((file) => {
					const filePath = `${path}/${file}`;
					const stats = fs.statSync(filePath);
					if (stats.isDirectory()) {
						emptyDir(filePath);
					} else {
						fs.unlinkSync(filePath);
						// console.log(`删除${file}文件成功`);
					}
				});
			}
			resolve(true);
		} catch (error) {
			console.error(error);
			reject(error);
		}
	});
}

/**
 * 删除指定路径下的所有空文件夹
 * @param {*} path
 */
function rmEmptyDir(path: string, level = 0): Promise<boolean> {
	return new Promise((resolve, reject) => {
		try {
			if (fs.existsSync(path)) {
				const files = fs.readdirSync(path);
				if (files.length > 0) {
					let tempFile = 0;
					files.forEach((file) => {
						tempFile++;
						rmEmptyDir(`${path}/${file}`, 1);
					});
					if (tempFile === files.length && level !== 0) {
						fs.rmdirSync(path);
					}
				} else {
					level !== 0 && fs.rmdirSync(path);
				}
			}
			resolve(true);
		} catch (error) {
			console.error(error);
			reject(error);
		}
	});
}

/**
 * 清空指定路径下的所有文件及文件夹
 * @param {*} path
 */
export function clearDir(path: string): Promise<boolean> {
	return new Promise((resolve, reject) => {
		// (async () => {
		// 	try {
		// 		await emptyDir(path);
		// 		await rmEmptyDir(path);
		// 		resolve(true);
		// 	} catch (error) {
		// 		console.error(error);
		// 		reject(error);
		// 	}
		// })();
		try {
			exec(`rm -rf ${path}`);
			resolve(true);
		} catch (error) {
			console.error(error);
			reject(false);
		}
	});
}

/**
 * 删除某一个包下面的需要符合格式的文件。
 * @param  {string} url  文件路径，绝对路径
 * @param  {string} name 需要删除的文件名称
 * @return {Promise<boolean>} 删除结果
 */
export function deleteFile(url: string, name: string): Promise<boolean> {
	return new Promise((resolve, reject) => {
		try {
			let files = [];
			// 判断给定的路径是否存在
			if (fs.existsSync(url)) {
				files = fs.readdirSync(url); // 返回文件和子目录的数组
				files.forEach(function (file) {
					const curPath = path.join(url, file);
					if (fs.statSync(curPath).isDirectory()) {
						// 同步读取文件夹文件，如果是文件夹，则函数回调
						deleteFile(curPath, name);
					} else {
						if (file.indexOf(name) > -1) {
							// 是指定文件，则删除
							fs.unlinkSync(curPath);
							console.log('删除文件：' + curPath);
							resolve(true);
						}
					}
				});
			} else {
				reject('给定的路径不存在！');
				console.log('给定的路径不存在！');
			}
		} catch (error) {
			console.error(error);
			reject(error);
		}
	});
}

export function isValidJSON(str: string) {
	if (typeof str !== 'string') {
		return false;
	}
	try {
		JSON.parse(str);
		return true;
	} catch (e) {
		return false;
	}
}

/**
 * 动态导入一个 ts 文件
 * @param modulePath 要导入的文件路径
 * @param clearCache 是否清除缓存
 */
export function requireModule(modulePath: string, clearCache = true) {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const m = require(modulePath);
		if (clearCache) {
			setTimeout(() => {
				delete require.cache[require.resolve(modulePath)];
			}, 200);
		}
		return m;
	} catch (error: unknown) {
		throw new Error(error instanceof Error ? error.message : String(error));
	}
}
