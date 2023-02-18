export const REACT_ESLINT = `npm i eslint eslint-plugin-react@latest @typescript-eslint/eslint-plugin@latest @typescript-eslint/parser@latest -D`;
export const VUE_ESLINT = `npm i eslint-plugin-vue@latest @typescript-eslint/eslint-plugin@latest @typescript-eslint/parser@latest eslint@latest -D`;
export const StyleLint = (css = 'less') => {
	return `npm i stylelint@latest stylelint-${css}@latest stylelint-config-standard@latest stylelint-prettier@latest stylelint-config-prettier@latest -D`;
};
export const Prettier = `npm install --save-dev --save-exact prettier eslint-config-prettier`;
/** 第一步 */
export const NPM_HUSK = 'npm install husky --save-dev';
/** 第二步 */
export const HUSKY_INSTALL = `npx husky install`;
/** 第三步 */
export const SET_SCRIPT = `npm set-script prepare "husky install"`;
/** 第四步 */
export const ADD_COMMIT_MSG = `npx husky add .husky/commit-msg 'npx --no-install commitlint --edit "$1"'`;
/** 第五步 */
export const COMMIT_VERIFY = `npm install --save-dev @commitlint/cli @commitlint/config-conventional`;
/** 第六步 */
export const COMMIT_CONFIG_CONTENT = `
module.exports = {
	extends: ['@commitlint/config-conventional']
}`;
