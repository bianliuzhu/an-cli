export type GitFeatureOption = 'gitflow' | 'commitSubject' | 'customGitCommand';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { log } from '../utils';
import { copyDirectoryRecursive, copyFileIfMissing, pathExists } from './utils';

/**
 * 复制 git 配置文件
 */
const copyGitConfigFiles = async () => {
	// 运行时位置在 lib/git-local-config，向上三级到包根目录，再进入 postbuild-assets/git-local-config
	const sourceRoot = path.join(__dirname, '..', '..', 'git-local-config');
	const destRoot = process.cwd(); // 用户工程根目录

	// 复制 .gitscripts 目录（递归）
	const sourceScriptsDir = path.join(sourceRoot, '.gitscripts');
	const targetScriptsDir = path.join(destRoot, '.gitscripts');
	if (await pathExists(sourceScriptsDir)) {
		await copyDirectoryRecursive(sourceScriptsDir, targetScriptsDir);
		log.success(`.gitscripts create done.`);
	} else {
		log.error(`source directory ${sourceScriptsDir} does not exist`);
	}

	// 复制根部文件 .gitconfig 与 .commit-type.cjs
	const rootFiles = ['.gitconfig', '.commit-type.cjs'];
	for (const filename of rootFiles) {
		const sourceFilePath = path.join(sourceRoot, filename);
		const targetFilePath = path.join(destRoot, filename);
		if (await pathExists(sourceFilePath)) {
			await copyFileIfMissing(sourceFilePath, targetFilePath);
		} else {
			log.error(`source file ${sourceFilePath} does not exist`);
		}
	}

	// 为 random-branch.sh 增加可执行权限
	try {
		fs.chmodSync(path.join(targetScriptsDir, 'random-branch.sh'), 0o755);
		// log.success(`chmod +x .gitscripts/random-branch.sh`);
		log.success(`random-branch.sh Raise power`);
	} catch (e) {
		console.log(e);
		log.error(`Set .githooks/commit-msg executable permission failed: ${e instanceof Error ? e.message : String(e)}`);
	}

	// git config --local include.path ../.gitconfig
	try {
		execSync('git config --local include.path ../.gitconfig', { stdio: 'ignore' });
		// log.success(`git config --local include.path ../.gitconfig`);
		log.success(`.gitconfig git set`);
	} catch (e) {
		console.log(e);
		log.error(`Execute git config --local include.path ../.gitconfig failed, please execute the command manually`);
	}
};

const copyCommitSubjectFiles = async () => {
	// 运行时位置在 lib/git-local-config，向上三级到包根目录，再进入 postbuild-assets/git-local-config/.githooks
	const sourceHooksDir = path.join(__dirname, '..', '..', 'git-local-config', '.githooks');
	const destRoot = process.cwd(); // 用户工程根目录
	const targetHooksDir = path.join(destRoot, '.githooks');

	if (!(await pathExists(sourceHooksDir))) {
		log.error(`source directory ${sourceHooksDir} does not exist`);
		return;
	}

	// 复制 .githooks 目录（递归）
	await copyDirectoryRecursive(sourceHooksDir, targetHooksDir);
	log.success(`.githooks create done.`);

	// 为 commit-msg 增加可执行权限
	try {
		fs.chmodSync(path.join(targetHooksDir, 'commit-msg'), 0o755);
		log.success(`commit-msg raise power done.`);
	} catch (e) {
		console.log(e);
		// 翻译成英文
		log.error(`Set .githooks/commit-msg executable permission failed: ${e instanceof Error ? e.message : String(e)}`);
	}

	// 设置 git hooks 路径到 .githooks
	try {
		execSync('git config core.hooksPath .githooks', { stdio: 'ignore' });
		log.success(`git set .githooks done.`);
	} catch (e) {
		console.log(e);
		log.error(`Execute [git config core.hooksPath .githooks] failed, please execute the command manually`);
	}
};

const copyCustomGitCommandFiles = async () => {
	// 运行时位置在 lib/git-local-config，向上三级到包根目录，再进入 postbuild-assets/git-local-config
	const sourceRoot = path.join(__dirname, '..', '..', 'git-local-config');
	const destRoot = process.cwd(); // 用户工程根目录

	const sourceFilePath = path.join(sourceRoot, '.gitattributes');
	const targetFilePath = path.join(destRoot, '.gitattributes');

	if (!(await pathExists(sourceFilePath))) {
		log.error(`source file ${sourceFilePath} does not exist`);
		return;
	}

	await copyFileIfMissing(sourceFilePath, targetFilePath);
};

export const gitHandle = async (options: GitFeatureOption[] = []) => {
	// 使用 switch 语句
	if (options.includes('gitflow')) {
		await copyGitConfigFiles();
	}

	if (options.includes('commitSubject')) {
		await copyCommitSubjectFiles();
	}

	if (options.includes('customGitCommand')) {
		await copyCustomGitCommandFiles();
	}

	console.log('\n');
	log.warning(`please run [git nb] command to create a new branch.`);
	console.log('\n');
};
