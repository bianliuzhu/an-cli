import type { RequestTemplate } from '../types';

export const PAD_END = 100;

export const DEFAULT_REQUEST_TEMPLATE: RequestTemplate = 'axios';
export const SUPPORTED_REQUEST_TEMPLATES: readonly RequestTemplate[] = ['axios', 'fetch', 'wx', 'uniapp', 'taro'];
export const REQUIRED_TEMPLATE_FILES = ['dio.ts', 'error-message.ts', 'fetch.ts', 'api-type.d.ts'] as const;
export const TEMPLATE_MARKER_RE = /@an-cli-request-template:\s*([a-z]+)/i;

export const PRETTIER_CONFIG_FILES = [
	'.prettierrc',
	'.prettierrc.json',
	'.prettierrc.json5',
	'.prettierrc.yaml',
	'.prettierrc.yml',
	'.prettierrc.js',
	'.prettierrc.cjs',
	'.prettierrc.mjs',
	'.prettierrc.ts',
	'.prettierrc.cts',
	'.prettierrc.mts',
	'prettier.config.js',
	'prettier.config.cjs',
	'prettier.config.mjs',
	'prettier.config.ts',
	'prettier.config.cts',
	'prettier.config.mts',
] as const;
