import type { Answers } from 'inquirer';
export interface Iancli {
	answers: Answers;
	lintHandle: () => void;
}
export enum plugins {
	'ESLint' = 'eslint',
	'StyleLint' = 'stylelint',
	'CommitLint' = 'commitlint',
	'Prettier' = 'prettier',
}
