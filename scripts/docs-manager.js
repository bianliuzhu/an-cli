#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 定义支持的语言
const LANGUAGES = {
  'zh': { file: 'README.zh.md', name: '简体中文', code: 'zh' },
  'en': { file: 'README.md', name: 'English', code: 'en' },
  'es': { file: 'README.es.md', name: 'Español', code: 'es' },
  'ar': { file: 'README.ar.md', name: 'العربية', code: 'ar' },
  'fr': { file: 'README.fr.md', name: 'Français', code: 'fr' },
  'ru': { file: 'README.ru.md', name: 'Русский', code: 'ru' },
  'jp': { file: 'README.jp.md', name: '日本語', code: 'jp' }
};

const ROOT_DIR = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

// 确保 docs 目录存在
if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

/**
 * 检查文档是否存在
 */
function checkDocs() {
  console.log('📋 检查文档文件...\n');
  const missing = [];
  const existing = [];

  Object.entries(LANGUAGES).forEach(([code, info]) => {
    const filePath = path.join(ROOT_DIR, info.file);
    if (fs.existsSync(filePath)) {
      existing.push({ code, ...info });
      console.log(`  ✅ ${info.name} (${info.file})`);
    } else {
      missing.push({ code, ...info });
      console.log(`  ❌ ${info.name} (${info.file}) - 文件不存在`);
    }
  });

  console.log(`\n总计: ${existing.length} 个文件存在, ${missing.length} 个文件缺失\n`);
  return { existing, missing };
}

/**
 * 复制 README 文件到 docs 目录
 */
function copyDocsToDocs() {
  console.log('📦 复制文档到 docs 目录...\n');
  const { existing } = checkDocs();

  existing.forEach(({ file, name }) => {
    const sourcePath = path.join(ROOT_DIR, file);
    const targetPath = path.join(DOCS_DIR, file);

    try {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  ✅ 已复制: ${name} -> docs/${file}`);
    } catch (error) {
      console.error(`  ❌ 复制失败: ${name} - ${error.message}`);
    }
  });

  console.log('\n✅ 文档复制完成！\n');
}

/**
 * 更新语言导航链接
 */
function updateLanguageNav(content, currentLang) {
  const navLinks = Object.entries(LANGUAGES).map(([code, info]) => {
    if (code === currentLang) {
      return info.name;
    }
    // 对于 docs 目录中的文件，使用相对路径
    return `[${info.name}](./${info.file})`;
  });

  return content.replace(
    /(# an-cli\n\n).+?\n/s,
    `$1${navLinks.join(' | ')}\n\n`
  );
}

/**
 * 同步所有语言版本的导航
 */
function syncNav() {
  console.log('🔄 同步导航链接...\n');
  
  Object.entries(LANGUAGES).forEach(([code, info]) => {
    const filePath = path.join(DOCS_DIR, info.file);
    if (!fs.existsSync(filePath)) {
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = updateLanguageNav(content, code);
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`  ✅ 已更新: ${info.name}`);
    } else {
      console.log(`  ⏭️  跳过: ${info.name} (无需更新)`);
    }
  });

  console.log('\n✅ 导航同步完成！\n');
}

/**
 * 验证文档结构
 */
function validateStructure() {
  console.log('🔍 验证文档结构...\n');
  const { existing } = checkDocs();
  const issues = [];

  existing.forEach(({ file, name }) => {
    const filePath = path.join(ROOT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // 检查是否有标题
    if (!content.match(/^#\s+an-cli/m)) {
      issues.push(`${name}: 缺少主标题`);
    }

    // 检查是否有语言导航
    if (!content.match(/\[简体中文\]|\[English\]|\[Español\]/)) {
      issues.push(`${name}: 缺少语言导航`);
    }

    // 检查是否有安装部分
    if (!content.match(/#+\s+安装|#+\s+Installation/i)) {
      issues.push(`${name}: 缺少安装说明`);
    }
  });

  if (issues.length > 0) {
    console.log('⚠️  发现以下问题:\n');
    issues.forEach(issue => console.log(`  - ${issue}`));
    console.log('');
  } else {
    console.log('✅ 所有文档结构验证通过！\n');
  }

  return issues.length === 0;
}

/**
 * 生成文档统计信息
 */
function generateStats() {
  console.log('📊 文档统计信息...\n');
  const { existing } = checkDocs();

  existing.forEach(({ file, name }) => {
    const filePath = path.join(ROOT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').length;
    const size = (fs.statSync(filePath).size / 1024).toFixed(2);

    console.log(`  ${name}:`);
    console.log(`    文件: ${file}`);
    console.log(`    行数: ${lines}`);
    console.log(`    大小: ${size} KB\n`);
  });
}

/**
 * 主函数
 */
function main() {
  const command = process.argv[2] || 'all';

  console.log('📚 an-cli 文档管理工具\n');
  console.log('='.repeat(50) + '\n');

  switch (command) {
    case 'check':
      checkDocs();
      break;
    case 'copy':
      copyDocsToDocs();
      break;
    case 'sync':
      syncNav();
      break;
    case 'validate':
      validateStructure();
      break;
    case 'stats':
      generateStats();
      break;
    case 'all':
    default:
      checkDocs();
      copyDocsToDocs();
      syncNav();
      validateStructure();
      console.log('💡 提示: 使用以下命令查看帮助');
      console.log('  npm run docs:check    - 检查文档');
      console.log('  npm run docs:copy    - 复制文档到 docs 目录');
      console.log('  npm run docs:sync    - 同步导航链接');
      console.log('  npm run docs:validate - 验证文档结构');
      console.log('  npm run docs:stats   - 生成统计信息\n');
      break;
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  checkDocs,
  copyDocsToDocs,
  syncNav,
  validateStructure,
  generateStats
};