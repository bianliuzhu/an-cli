import fs from 'fs';
import { OpenAPIV3 } from 'openapi-types';
import DATA from '../../data/umf.json';
import { clearDir, writeFileRecursive } from '../utils';
import Components from './core/components';
import { getSwaggerJson } from './core/get-data';
import PathParse from './core/path';
import { ComponentsSchemas, ConfigType, PathsObject } from './types';
import { exec } from 'shelljs';
import { log } from '../utils';
import chalk from 'chalk';

/**
	"saveTypeFolderPath": "apps/types",
	"apiListFilePath": "spps/services",
	"swaggerJsonUrl": "",
	"indent": "\t",
	"headers": {}x
 */

interface ExecResult {
	stdout: string;
	stderr: string;
}

const configContent = {
	saveTypeFolderPath: 'apps/types',
	apiListFilePath: 'apps/services',
	swaggerJsonUrl: '',
	requestMethodsImportPath: './fetch',
	indent: '\t',
	headers: {},
};

export class Main {
	private schemas: ComponentsSchemas = {};
	private paths: PathsObject = {};

	/**
	 * 处理 Swagger 数据
	 */
	private async handle(config: ConfigType) {
		try {
			const response =
				process.env.NODE_ENV === 'development' ? (DATA as unknown as OpenAPIV3.Document) : ((await getSwaggerJson(config)) as OpenAPIV3.Document);

			if (!response) {
				throw new Error('无法获取 Swagger 数据');
			}

			this.schemas = response.components?.schemas || {};
			this.paths = response.paths || {};

			const components = new Components(this.schemas, config);
			const paths = new PathParse(this.paths, config);

			await Promise.all([components.handle(), paths.handle()]);
			return true;
		} catch (error: unknown) {
			if (error instanceof Error) {
				throw new Error(`处理 Swagger 数据失败: ${error.message}`);
			}
			throw new Error('处理 Swagger 数据失败: 未知错误');
		}
	}

	/**
	 * 执行格式化命令
	 */
	private async formatGeneratedFiles(config: ConfigType) {
		const formatCommand = `npx prettier --write "${config.saveTypeFolderPath}/**/*.{ts,d.ts}"`;

		try {
			await fs.promises.access(config.saveTypeFolderPath);

			const { stderr } = await new Promise<ExecResult>((resolve, reject) => {
				exec(formatCommand, (error, stdout, stderr) => {
					if (error) reject(error);
					else resolve({ stdout, stderr });
				});
			});

			if (stderr) {
				throw new Error(stderr);
			}
			log.success('文件格式化成功');
		} catch (error: unknown) {
			console.log('');
			log.error('格式化失败，请手动执行以下命令：');
			console.log('$', chalk.yellow(formatCommand));
			console.log('');
		}
	}

	async initialize() {
		const configFilePath = process.cwd() + '/an.config.json';

		try {
			const config = await this.getConfig(configFilePath);
			await clearDir(config.saveTypeFolderPath);
			await this.handle(config);
			await this.formatGeneratedFiles(config);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : '未知错误';
			log.error(`初始化失败: ${message}`);
		}
	}

	/**
	 * 获取配置文件
	 */
	private async getConfig(configFilePath: string): Promise<ConfigType> {
		try {
			const data = await fs.promises.readFile(configFilePath, 'utf8');
			return JSON.parse(data) as ConfigType;
		} catch (error: unknown) {
			log.warning('配置文件不存在，将自动创建配置文件');
			await clearDir(configContent.saveTypeFolderPath);
			await writeFileRecursive(configFilePath, JSON.stringify(configContent, null, 2));
			return configContent;
		}
	}
}

if (process.env.NODE_ENV === 'development') {
	const int = new Main();
	int.initialize();
}
