#!/bin/bash

# 定义颜色变量
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 使用颜色输出文本
# echo -e "${RED}这是红色文字${NC}"
# echo -e "${GREEN}这是绿色文字${NC}"
# echo -e "${YELLOW}这是黄色文字${NC}"
# echo -e "${BLUE}这是蓝色文字${NC}"

echo -e "${BLUE}========== 开始生成版本号 ==========${NC}"
echo -e "${YELLOW}当前 package.json 版本:${NC}"
cat package.json | grep '"version"'

# 使用 Node.js 生成日期版本号（与 GitHub Actions 工作流保持一致）
node << 'SCRIPT'
const fs = require('fs');
const { execSync } = require('child_process');

// 获取当前日期 (YY.MMDD 格式，符合 semver 规范)
const now = new Date();
const year = now.getFullYear().toString().slice(-2);
const month = (now.getMonth() + 1).toString().padStart(2, '0');
const day = now.getDate().toString().padStart(2, '0');
const dateVersion = `${year}.${month}${day}`;

console.log(`日期版本: ${dateVersion}`);

// 获取包名
const pkg = require('./package.json');
const packageName = pkg.name;

// 获取已发布的所有版本
let existingVersions = [];
try {
  const versionsJson = execSync(`npm view ${packageName} versions --json`, { encoding: 'utf-8' });
  existingVersions = JSON.parse(versionsJson);
} catch (e) {
  console.log('包未找到或尚未发布任何版本');
  existingVersions = [];
}

console.log('已发布的版本:', existingVersions);

// 查找今天发布的版本
const todayVersions = existingVersions.filter(v => v.startsWith(dateVersion));
console.log('今天已发布的版本:', todayVersions);

let newVersion;
if (todayVersions.length === 0) {
  // 今天第一次发布，patch 版本从 0 开始
  newVersion = `${dateVersion}.0`;
} else {
  // 找出今天最大的 patch 号
  let maxPatch = -1;
  
  todayVersions.forEach(v => {
    const match = v.match(new RegExp(`^${dateVersion.replace(/\./g, '\\.')}\\.(\\d+)$`));
    if (match) {
      maxPatch = Math.max(maxPatch, parseInt(match[1]));
    }
  });
  
  newVersion = `${dateVersion}.${maxPatch + 1}`;
}

console.log(`新版本: ${newVersion}`);

// 更新 package.json
pkg.version = newVersion;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, '\t') + '\n');

console.log('✅ package.json 版本已更新');
SCRIPT

echo -e "${BLUE}========== 版本号生成完成 ==========${NC}"
echo -e "${GREEN}更新后的版本:${NC}"
cat package.json | grep '"version"'

echo ""
echo -e "${BLUE}========== 开始构建 ==========${NC}"
npm run build

echo ""
echo -e "${BLUE}========== 开始发布到 NPM ==========${NC}"
npm publish --access public

echo ""
echo -e "${GREEN}========== 发布完成 ==========${NC}"
