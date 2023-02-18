import type { Answers } from 'inquirer';
export interface Iancli {
	answers: Answers;
	lintHandle: () => void;
}
