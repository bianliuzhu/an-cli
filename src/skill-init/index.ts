import chalk from 'chalk';
import fs from 'fs';
import inquirer from 'inquirer';
import path from 'path';

import { log, writeFileRecursive } from '../utils';

interface AnConfig {
	saveApiListFolderPath?: string;
	saveTypeFolderPath?: string;
	swaggerConfig?: {
		url: string;
		apiListFileName: string;
		modulePrefix?: string;
		publicPrefix?: string;
		[key: string]: unknown;
	}[];
	[key: string]: unknown;
}

interface ProjectConfig {
	apiDir: string;
	typesDir: string;
	apiFiles: string[];
	swaggerUrls: string[];
}

const AVAILABLE_SKILLS = [
	{
		name: 'api-report  - API 变更检测报告',
		value: 'api-report',
	},
	{
		name: 'api-mock    - Mock 数据生成',
		value: 'api-mock',
	},
];

function getTemplateDir(): string {
	return path.join(__dirname, '..', 'skills');
}

function applyTemplate(template: string, variables: Record<string, string>): string {
	return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
		return key in variables ? variables[key] : `{{${key}}}`;
	});
}

function readAnConfig(targetDir: string): AnConfig | null {
	const configPath = path.join(targetDir, 'an.config.json');
	if (!fs.existsSync(configPath)) return null;
	try {
		return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as AnConfig;
	} catch {
		return null;
	}
}

function extractProjectConfig(anConfig: AnConfig): ProjectConfig {
	const apiDir = anConfig.saveApiListFolderPath ?? 'src/api';
	const typesDir = anConfig.saveTypeFolderPath ?? 'src/types';
	const apiFiles: string[] = [];
	const swaggerUrls: string[] = [];

	if (Array.isArray(anConfig.swaggerConfig)) {
		for (const cfg of anConfig.swaggerConfig) {
			if (cfg.apiListFileName) apiFiles.push(cfg.apiListFileName);
			if (cfg.url) swaggerUrls.push(cfg.url);
		}
	}

	return { apiDir, typesDir, apiFiles, swaggerUrls };
}

type OutputMode = 'skill' | 'command';

function resolveOutputPath(targetDir: string, baseDir: string, templateName: string, mode: OutputMode): string {
	if (mode === 'command') {
		return path.join(targetDir, baseDir, `${templateName}.md`);
	}
	return path.join(targetDir, baseDir, templateName, 'SKILL.md');
}

async function renderAndWriteSkill(templateName: string, variables: Record<string, string>, targetDir: string, skillBaseDir: string, mode: OutputMode): Promise<void> {
	const templatePath = path.join(getTemplateDir(), templateName, 'SKILL.md');
	if (!fs.existsSync(templatePath)) {
		throw new Error(`找不到模板文件: ${templatePath}`);
	}

	const templateContent = fs.readFileSync(templatePath, 'utf-8');
	const rendered = applyTemplate(templateContent, variables);
	const outputPath = resolveOutputPath(targetDir, skillBaseDir, templateName, mode);
	await writeFileRecursive(outputPath, rendered);
	log.success(`Skill 文件已写入: ${path.relative(targetDir, outputPath)}`);
}

async function initApiReport(targetDir: string, project: ProjectConfig, skillBaseDir: string, mode: OutputMode): Promise<void> {
	const { scanDirs } = await inquirer.prompt<{ scanDirs: string }>([
		{
			type: 'input',
			name: 'scanDirs',
			message: '需要扫描 API 使用的目录（逗号分隔，支持 glob）：',
			default: 'src/pages/**,src/components/**',
		},
	]);

	await renderAndWriteSkill(
		'api-report',
		{
			API_DIR: project.apiDir,
			API_FILES: project.apiFiles.join(', '),
			TYPES_DIR: project.typesDir,
			SCAN_DIRS: scanDirs.trim(),
			SWAGGER_URLS: project.swaggerUrls.join('\n  - '),
		},
		targetDir,
		skillBaseDir,
		mode,
	);
}

async function initApiMock(targetDir: string, project: ProjectConfig, skillBaseDir: string, mode: OutputMode): Promise<void> {
	const { mockOutput } = await inquirer.prompt<{ mockOutput: string }>([
		{
			type: 'input',
			name: 'mockOutput',
			message: 'Mock 数据输出目录：',
			default: 'mocks/',
		},
	]);

	await renderAndWriteSkill(
		'api-mock',
		{
			API_DIR: project.apiDir,
			API_FILES: project.apiFiles.join(', '),
			TYPES_DIR: project.typesDir,
			MOCK_OUTPUT: mockOutput.trim(),
			SWAGGER_URLS: project.swaggerUrls.join('\n  - '),
		},
		targetDir,
		skillBaseDir,
		mode,
	);
}

export async function skillHandle(): Promise<void> {
	console.log(chalk.bold.blue('\n🛡️  an skill - Agent Skill 初始化工具\n'));

	const targetDir = process.cwd();
	const anConfig = readAnConfig(targetDir);

	if (!anConfig) {
		log.error('未找到 an.config.json，请先在项目根目录配置 an.config.json');
		return;
	}

	const project = extractProjectConfig(anConfig);

	if (project.apiFiles.length === 0) {
		log.error('an.config.json 中未找到 swaggerConfig 配置');
		return;
	}

	const { skills } = await inquirer.prompt<{ skills: string[] }>([
		{
			type: 'checkbox',
			name: 'skills',
			message: '选择要初始化的 Skill（可多选）：',
			choices: AVAILABLE_SKILLS,
			pageSize: 10,
		},
	]);

	if (skills.length === 0) {
		log.warning('未选择任何 Skill，已退出');
		return;
	}

	const { platform } = await inquirer.prompt<{ platform: string }>([
		{
			type: 'list',
			name: 'platform',
			message: 'Skill 输出目标：',
			choices: [
				{ name: '.cursor/skills    (Cursor Skill)', value: 'cursor' },
				{ name: '.claude/commands  (Claude Code /command)', value: 'claude' },
				{ name: '自定义路径...', value: '__custom__' },
			],
		},
	]);

	let outputDir: string;
	let outputMode: OutputMode;

	if (platform === 'cursor') {
		outputDir = '.cursor/skills';
		outputMode = 'skill';
	} else if (platform === 'claude') {
		outputDir = '.claude/commands';
		outputMode = 'command';
	} else {
		const { customDir } = await inquirer.prompt<{ customDir: string }>([
			{
				type: 'input',
				name: 'customDir',
				message: '请输入自定义输出目录：',
				validate: (v: string) => v.trim().length > 0 || '路径不能为空',
			},
		]);
		const { customMode } = await inquirer.prompt<{ customMode: OutputMode }>([
			{
				type: 'list',
				name: 'customMode',
				message: '文件组织方式：',
				choices: [
					{ name: '<name>/SKILL.md  (Cursor 风格)', value: 'skill' },
					{ name: '<name>.md        (Claude Code 风格)', value: 'command' },
				],
			},
		]);
		outputDir = customDir.trim();
		outputMode = customMode;
	}

	console.log(chalk.dim(`\n目标项目目录: ${targetDir}`));
	console.log(chalk.cyan('\n📋 已从 an.config.json 读取配置：'));
	console.log(chalk.dim(`  - API 目录: ${project.apiDir}`));
	console.log(chalk.dim(`  - API 文件: ${project.apiFiles.join(', ')}`));
	console.log(chalk.dim(`  - 类型目录: ${project.typesDir}`));
	console.log(chalk.dim(`  - 输出目录: ${outputDir}  (${outputMode === 'command' ? '/command 模式' : 'Skill 模式'})\n`));

	for (const skill of skills) {
		if (skill === 'api-report') {
			await initApiReport(targetDir, project, outputDir, outputMode);
		} else if (skill === 'api-mock') {
			await initApiMock(targetDir, project, outputDir, outputMode);
		}
	}

	const usageHint = outputMode === 'command' ? '在 Claude Code 中使用 /api-report 或 /api-mock 命令调用。' : '在 Cursor 中即可使用该 Skill。';
	console.log(chalk.bold.green('\n✅ Skill 初始化完成！'), chalk.dim(`\n${usageHint}\n`));
}
