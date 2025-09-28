// 兼容 CommonJS 和 ES 模块的解决方案
const fs = require('fs');
const path = require('path');

// 获取配置文件路径
const configPath = path.join(__dirname, '../.commit-type.js');

try {
	// 读取配置文件内容
	const fileContent = fs.readFileSync(configPath, 'utf8');

	// 提取 types 对象定义
	const typesMatch = fileContent.match(/const types = \{[\s\S]*?\};/);
	if (!typesMatch) {
		throw new Error('无法找到 types 对象定义');
	}

	// 创建一个安全的执行环境来解析对象
	const typesCode = typesMatch[0] + '\nmodule.exports = { types };';

	// 使用 vm 模块安全执行代码
	const vm = require('vm');
	const context = { module: { exports: {} } };
	vm.createContext(context);
	vm.runInContext(typesCode, context);

	const types = context.module.exports.types;

	// 生成输出
	const output = Object.entries(types).map(([type, config]) => ({
		type,
		description: config.description,
		emoji: config.emoji,
	}));

	console.log(JSON.stringify(output));

} catch (error) {
	console.error('错误：无法读取分支类型配置文件');
	console.error('请确保 .commit-type.js 文件存在且格式正确');
	console.error('详细错误：', error.message);
	process.exit(1);
}