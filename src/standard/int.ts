import { readFileSync } from 'fs';

export const Inter = () => {
	const fileContent = readFileSync('../data/sw.json');
	console.log(fileContent);
};
