const fs = require('fs');
const path = require('path');

// 定义支持的语言
const LANGUAGES = {
  'zh-CN': '简体中文',
  'en': 'English',
  'es': 'Español',
  'ar': 'العربية',
  'fr': 'Français',
  'ru': 'Русский',
  'ja': '日本語'
};

// 读取主文档结构
function getMainStructure() {
  const mainContent = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf8');
  return mainContent;
}

// 更新语言切换导航
function updateLanguageNav(content, currentLang) {
  const navLinks = Object.entries(LANGUAGES).map(([code, name]) => {
    if (code === currentLang) {
      return name;
    }
    return `[${name}](./README.${code}.md)`;
  });

  return content.replace(
    /(# an-cli\n\n).+?\n/s,
    `$1${navLinks.join(' | ')}\n\n`
  );
}

// 同步所有语言版本
function syncDocs() {
  const mainStructure = getMainStructure();

  Object.keys(LANGUAGES).forEach(lang => {
    if (lang === 'zh-CN') return; // 跳过主文档

    const filePath = path.join(__dirname, `../README.${lang}.md`);
    let content = mainStructure;

    // 更新语言导航
    content = updateLanguageNav(content, lang);

    // 保存文件
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${lang} version`);
  });
}

// 运行同步
syncDocs();