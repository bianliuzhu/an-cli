export type GitFeatureOption = 'gitflow' | 'commitSubject' | 'customGitCommand';
import { execFileSync, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { log } from '../utils';
import { copyDirectoryRecursive, copyFileIfMissing, pathExists } from './utils';

const isGitRepository = (cwd: string) => {
	try {
		execSync('git rev-parse --is-inside-work-tree', { cwd, stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
};

const runGitConfig = (args: string[], cwd: string, errorMessage: string) => {
	try {
		execFileSync('git', args, { cwd, stdio: 'ignore' });
		return true;
	} catch (e) {
		console.log(e);
		log.error(errorMessage);
		return false;
	}
};

type PackageManager = 'pnpm' | 'yarn' | 'npm';

const hasCommand = (command: string) => {
	const checker = process.platform === 'win32' ? 'where' : 'command -v';
	try {
		execSync(`${checker} ${command}`, { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
};

const detectPackageManager = (cwd: string): PackageManager => {
	if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) {
		return 'pnpm';
	}

	if (fs.existsSync(path.join(cwd, 'yarn.lock'))) {
		return 'yarn';
	}

	return 'npm';
};

const getInstallDevDependenciesCommand = (pm: PackageManager) => {
	const deps = '@commitlint/cli @commitlint/config-conventional lint-staged';
	if (pm === 'pnpm') {
		return `pnpm add -D ${deps}`;
	}

	if (pm === 'yarn') {
		return `yarn add -D ${deps}`;
	}

	return `npm install -D ${deps}`;
};

const runDependencyPrecheck = (options: GitFeatureOption[], cwd: string) => {
	const warnings: string[] = [];

	if (options.includes('gitflow') && !hasCommand('jq')) {
		warnings.push('Missing dependency: jq (required by git nb branch generator).');
		warnings.push('Quick fix (macOS): brew install jq');
	}

	if (options.includes('commitSubject')) {
		const hasCommitlint = fs.existsSync(path.join(cwd, 'node_modules', '.bin', process.platform === 'win32' ? 'commitlint.cmd' : 'commitlint')) || hasCommand('commitlint');
		const hasLintStaged = fs.existsSync(path.join(cwd, 'node_modules', '.bin', process.platform === 'win32' ? 'lint-staged.cmd' : 'lint-staged')) || hasCommand('lint-staged');
		if (!hasCommitlint || !hasLintStaged) {
			const pm = detectPackageManager(cwd);
			warnings.push('Missing dependencies for hooks: commitlint and/or lint-staged.');
			warnings.push(`Quick fix (${pm}): ${getInstallDevDependenciesCommand(pm)}`);
		}
	}

	if (warnings.length > 0) {
		console.log('\n');
		for (const warning of warnings) {
			log.warning(warning);
		}
		console.log('\n');
	}
};

const ensureCommitTypeFile = async (sourceRoot: string, destRoot: string) => {
	const sourceFilePath = path.join(sourceRoot, '.commit-type.cjs');
	const targetFilePath = path.join(destRoot, '.commit-type.cjs');

	if (!(await pathExists(sourceFilePath))) {
		log.error(`source file ${sourceFilePath} does not exist`);
		return;
	}

	await copyFileIfMissing(sourceFilePath, targetFilePath);
};

/**
 * 复制 git 配置文件
 */
const copyGitConfigFiles = async () => {
	// 运行时位置在 lib/git-local-config，资源文件与 index.cjs 同目录
	const sourceRoot = __dirname;
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

	// 复制根部文件 .gitconfig
	const rootFiles = ['.gitconfig'];
	for (const filename of rootFiles) {
		const sourceFilePath = path.join(sourceRoot, filename);
		const targetFilePath = path.join(destRoot, filename);
		if (await pathExists(sourceFilePath)) {
			await copyFileIfMissing(sourceFilePath, targetFilePath);
		} else {
			log.error(`source file ${sourceFilePath} does not exist`);
		}
	}

	await ensureCommitTypeFile(sourceRoot, destRoot);

	// 为 random-branch.sh 增加可执行权限
	try {
		fs.chmodSync(path.join(targetScriptsDir, 'random-branch.sh'), 0o755);
		// log.success(`chmod +x .gitscripts/random-branch.sh`);
		log.success(`random-branch.sh Raise power`);
	} catch (e) {
		console.log(e);
		log.error(`Set .gitscripts/random-branch.sh executable permission failed: ${e instanceof Error ? e.message : String(e)}`);
	}

	// 使用绝对路径设置 include.path，避免工作树 gitdir 不在 .git 目录时路径解析错误
	const includePath = path.resolve(destRoot, '.gitconfig');
	if (
		runGitConfig(
			['config', '--local', '--replace-all', 'include.path', includePath],
			destRoot,
			`Execute [git config --local --replace-all include.path ${includePath}] failed, please execute the command manually`,
		)
	) {
		log.success(`.gitconfig git set`);
	}
};

const copyCommitSubjectFiles = async () => {
	// 运行时位置在 lib/git-local-config，资源文件与 index.cjs 同目录
	const sourceHooksDir = path.join(__dirname, '.githooks');
	const destRoot = process.cwd(); // 用户工程根目录
	const targetHooksDir = path.join(destRoot, '.githooks');

	if (!(await pathExists(sourceHooksDir))) {
		log.error(`source directory ${sourceHooksDir} does not exist`);
		return;
	}

	// 覆盖更新 hooks，确保老项目也能升级到最新脚本
	await copyDirectoryRecursive(sourceHooksDir, targetHooksDir, true);
	log.success(`.githooks create done.`);

	await ensureCommitTypeFile(__dirname, destRoot);

	// 为 hooks 增加可执行权限
	try {
		fs.chmodSync(path.join(targetHooksDir, 'commit-msg'), 0o755);
		fs.chmodSync(path.join(targetHooksDir, 'pre-commit'), 0o755);
		log.success(`commit-msg/pre-commit raise power done.`);
	} catch (e) {
		console.log(e);
		log.error(`Set .githooks hooks executable permission failed: ${e instanceof Error ? e.message : String(e)}`);
	}

	// 设置 git hooks 路径到 .githooks
	if (
		runGitConfig(
			['config', '--local', '--replace-all', 'core.hooksPath', '.githooks'],
			destRoot,
			'Execute [git config --local --replace-all core.hooksPath .githooks] failed, please execute the command manually',
		)
	) {
		log.success(`git set .githooks done.`);
	}
};

const copyCustomGitCommandFiles = async () => {
	// 运行时位置在 lib/git-local-config，资源文件与 index.cjs 同目录
	const sourceRoot = __dirname;
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
	if (options.length === 0) {
		log.warning(`No Git feature selected, nothing to initialize.`);
		return;
	}

	const destRoot = process.cwd();
	const requiresGitRepo = options.includes('gitflow') || options.includes('commitSubject');
	if (requiresGitRepo && !isGitRepository(destRoot)) {
		log.error(`Current directory is not a Git repository. Please run this command in a Git project.`);
		return;
	}

	runDependencyPrecheck(options, destRoot);

	if (options.includes('gitflow')) {
		await copyGitConfigFiles();
	}

	if (options.includes('commitSubject')) {
		await copyCommitSubjectFiles();
	}

	if (options.includes('customGitCommand')) {
		await copyCustomGitCommandFiles();
	}

	if (options.includes('gitflow')) {
		console.log('\n');
		log.warning(`please run [git nb] command to create a new branch.`);
		console.log('\n');
	}
};
