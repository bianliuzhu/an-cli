const { types } = require('./.commit-type.cjs');

// 从自定义主题提取允许的 type 列表（使用 subject 作为 commit type）
const typeEnums = [...new Set(Object.values(types).map((t) => t.subject))];

module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'type-enum': [2, 'always', typeEnums],
	},
};
