import type { ConfigType } from '../types';

export const DEFAULT_INDENT = '\t';
export const DEFAULT_LINE_ENDING = '\n';

export function applyFormattingDefaults<Config extends ConfigType>(config: Config): Config & { formatting: NonNullable<ConfigType['formatting']> } {
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

export function indentContinuationLines(value: string, indentation: string): string {
	return value.replace(/\r?\n/g, `\n${indentation}`);
}
