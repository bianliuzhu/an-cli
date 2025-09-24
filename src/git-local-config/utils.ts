import path from 'path';
import fs from 'fs';
import { log } from '../utils';
/**
 * 确保目录存在
 * @param directoryPath 目录路径
 * @returns
 */
export const ensureDir = async (directoryPath: string) => {
	await fs.promises.mkdir(directoryPath, { recursive: true });
};

/**
 * 判断路径是否存在
 * @param targetPath 路径
 * @returns 是否存在
 */
export const pathExists = async (targetPath: string) => {
	try {
		await fs.promises.access(targetPath);
		return true;
	} catch {
		return false;
	}
};

/**
 * 复制文件，如果目标文件不存在则复制
 * @param sourceFilePath 源文件路径
 * @param targetFilePath 目标文件路径
 */
export const copyFileIfMissing = async (sourceFilePath: string, targetFilePath: string) => {
	const exists = await pathExists(targetFilePath);
	if (exists) {
		log.info(`${path.basename(targetFilePath)} 已存在，跳过生成.`);
		return;
	}
	await ensureDir(path.dirname(targetFilePath));
	await fs.promises.copyFile(sourceFilePath, targetFilePath);
	log.success(`${path.basename(targetFilePath)} create done.`);
};

/**
 * 递归复制目录
 * @param sourceDirectoryPath 源目录路径
 * @param targetDirectoryPath 目标目录路径
 */
export const copyDirectoryRecursive = async (sourceDirectoryPath: string, targetDirectoryPath: string) => {
	const sourceStat = await fs.promises.stat(sourceDirectoryPath);
	if (!sourceStat.isDirectory()) {
		throw new Error(`${sourceDirectoryPath} 不是目录`);
	}

	await ensureDir(targetDirectoryPath);
	const entries = await fs.promises.readdir(sourceDirectoryPath, { withFileTypes: true });
	for (const entry of entries) {
		const sourceEntryPath = path.join(sourceDirectoryPath, entry.name);
		const targetEntryPath = path.join(targetDirectoryPath, entry.name);
		if (entry.isDirectory()) {
			await copyDirectoryRecursive(sourceEntryPath, targetEntryPath);
		} else if (entry.isFile()) {
			await copyFileIfMissing(sourceEntryPath, targetEntryPath);
		}
	}
};
