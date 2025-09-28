
const { types } = require('../.commit-type.cjs');

const typeToMeta = {};

// 从 commitlint 配置中提取 type 到 emoji/subject 的映射
Object.entries(types).forEach(([type, config]) => {
	typeToMeta[type] = { emoji: config.emoji || '', subject: config.subject || '' };
});

// 获取传入的分支类型
const branchType = process.argv[2];
const meta = typeToMeta[branchType] || { emoji: '', subject: '' };

// 以 JSON 输出，方便 shell 精确解析
process.stdout.write(JSON.stringify(meta));
