import createLogger from 'progress-estimator';
import { plugins } from './type';
import { exec, exit } from 'shelljs';
import { spinner, log } from './utils';
const logger = createLogger();

const eslintHanlde = new Promise((resolve) => {
	const cd = `npm i eslint-plugin-react@latest @typescript-eslint/eslint-plugin@latest @typescript-eslint/parser@latest eslint@latest -D`;
	if (exec(cd).code !== 0) {
		log.error('Error: installation failed');
		exit(1);
	} else {
		resolve({ success: true });
	}
});

// const task2 = new Promise((resolve) => {
// 	setTimeout(() => {
// 		resolve({ success: true });
// 	}, 4200);
// });

export const eslintInstllHanle = async (val: string[]) => {
	spinner.start('start installation');
	if (val.includes(plugins.ESLint)) {
		await logger(eslintHanlde, 'install eslint');
	}
};
