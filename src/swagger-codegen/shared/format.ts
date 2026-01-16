import { ConfigType } from '../types';

export const DEFAULT_INDENT = '\t';
export const DEFAULT_LINE_ENDING = '\n';

export function applyFormattingDefaults(config: ConfigType): ConfigType {
	const formatting = {
		indentation: config.formatting?.indentation ?? DEFAULT_INDENT,
		lineEnding: config.formatting?.lineEnding ?? DEFAULT_LINE_ENDING,
	};
	return { ...config, formatting };
}

export function getIndentation(config: ConfigType): string {
	return config.formatting?.indentation ?? DEFAULT_INDENT;
}

export function getLineEnding(config: ConfigType): string {
	return config.formatting?.lineEnding ?? DEFAULT_LINE_ENDING;
}
