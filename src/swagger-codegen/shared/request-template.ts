import type { RequestTemplate } from '../types';

import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

import { log } from '../../utils';
import { DEFAULT_REQUEST_TEMPLATE, REQUIRED_TEMPLATE_FILES, SUPPORTED_REQUEST_TEMPLATES, TEMPLATE_MARKER_RE } from './constants';

export function normalizeRequestTemplate(input: unknown, source: string): RequestTemplate {
	if (input === undefined || input === null || input === '') return DEFAULT_REQUEST_TEMPLATE;
	if (typeof input !== 'string') {
		throw new Error(`${source} 中的 requestTemplate 类型无效（期望字符串，实际 ${typeof input}），支持的值：${SUPPORTED_REQUEST_TEMPLATES.join(' | ')}`);
	}
	const template = input.trim().toLowerCase() as RequestTemplate;
	if (!SUPPORTED_REQUEST_TEMPLATES.includes(template)) {
		throw new Error(`${source} 中的 requestTemplate="${input}" 无效，支持的值：${SUPPORTED_REQUEST_TEMPLATES.join(' | ')}`);
	}
	return template;
}

async function readExistingTemplateMarker(destDir: string): Promise<string | null> {
	try {
		const content = await fs.promises.readFile(path.join(destDir, 'dio.ts'), 'utf8');
		return TEMPLATE_MARKER_RE.exec(content.slice(0, 500))?.[1].toLowerCase() ?? null;
	} catch {
		return null;
	}
}

export async function copyAjaxConfigFiles(saveApiListFolderPath: string, template: RequestTemplate, baseDir: string): Promise<void> {
	const templateDir = path.join(baseDir, template);
	const sharedDir = path.join(baseDir, '_shared');
	const destDir = path.join(saveApiListFolderPath, 'config');

	const exists = await fs.promises.access(destDir).then(
		() => true,
		() => false,
	);
	if (exists) {
		const existing = await readExistingTemplateMarker(destDir);
		if (existing && existing !== template) {
			log.warning(
				`config folder exists at ${destDir}, but its embedded marker "${existing}" differs from configured requestTemplate="${template}". To switch templates, delete the folder "${destDir}" first.`,
			);
		} else {
			log.info(`config folder already exists at ${destDir}, skipping generation. (template=${template})`);
			log.info(`  To switch templates, delete the folder "${destDir}" first.`);
		}
		return;
	}

	const resolved: { file: string; sourceFile: string }[] = [];
	for (const file of REQUIRED_TEMPLATE_FILES) {
		const inTemplate = path.join(templateDir, file);
		const inShared = path.join(sharedDir, file);
		let sourceFile: string;
		try {
			await fs.promises.access(inTemplate);
			sourceFile = inTemplate;
		} catch {
			try {
				await fs.promises.access(inShared);
				sourceFile = inShared;
			} catch {
				throw new Error(`Source file not found for template "${template}": ${file} (looked in ${templateDir} and ${sharedDir})`);
			}
		}
		resolved.push({ file, sourceFile });
	}

	await fs.promises.mkdir(destDir, { recursive: true });
	log.info(`Using request template: ${chalk.cyan(template)} (template dir: ${templateDir}, shared dir: ${sharedDir})`);
	try {
		for (const { file, sourceFile } of resolved) {
			const destFile = path.join(destDir, file);
			if (file === 'dio.ts') {
				const content = await fs.promises.readFile(sourceFile, 'utf8');
				const stamped = TEMPLATE_MARKER_RE.test(content)
					? content
					: `// @an-cli-request-template: ${template} — 切换请求模板前请删除本 config/ 目录后重新运行 anl type\n${content}`;
				await fs.promises.writeFile(destFile, stamped);
			} else {
				await fs.promises.copyFile(sourceFile, destFile);
			}
			log.success(`${file} create done.`);
		}
	} catch (error) {
		await fs.promises.rm(destDir, { recursive: true, force: true }).catch(() => undefined);
		throw error instanceof Error ? error : new Error(String(error));
	}
}
