# 文档管理使用指南

## 📚 概述

本项目已配置了轻量级的文档管理系统，使用 **Docsify** 来管理和展示多语言文档。

### 🎯 方案概述

为你的项目配置了**轻量级文档管理系统**，使用 **Docsify** 来管理和展示多语言 README 文档。

### ✅ 已完成的工作

#### 1. 创建 Docsify 配置
- ✅ `docs/index.html` - Docsify 主配置文件
- ✅ `docs/_sidebar.md` - 侧边栏导航
- ✅ `docs/README.md` - 文档首页

#### 2. 文档管理脚本
- ✅ `scripts/docs-manager.js` - 完整的文档管理工具
  - 检查文档文件
  - 复制文档到 docs 目录
  - 同步导航链接
  - 验证文档结构
  - 生成统计信息

#### 3. NPM 脚本命令
在 `package.json` 中添加了以下命令：
- `npm run docs:check` - 检查文档
- `npm run docs:copy` - 复制文档
- `npm run docs:sync` - 同步导航
- `npm run docs:validate` - 验证结构
- `npm run docs:stats` - 统计信息
- `npm run docs:setup` - 一键设置
- `npm run docs:serve` - 启动服务器

## 🚀 快速开始

### 第一步：初始化文档

首次使用或更新文档后，运行以下命令：

```bash
npm run docs:setup
```

这个命令会：
- 将所有 README 文件复制到 `docs/` 目录
- 同步所有语言版本的导航链接

### 第二步：启动本地文档服务器

```bash
npm run docs:serve
```

然后在浏览器中访问 `http://localhost:3000`

### 第三步：查看文档

文档会自动加载所有语言版本的 README 文件，你可以通过侧边栏切换不同语言。

## 📊 方案对比

在配置文档系统时，我们对比了以下方案：

| 特性 | Docsify（已选择） | MkDocs | VitePress |
|------|------------------|--------|-----------|
| 构建需求 | ❌ 无需 | ✅ 需要 | ✅ 需要 |
| 配置复杂度 | ⭐ 简单 | ⭐⭐ 中等 | ⭐⭐ 中等 |
| 多语言支持 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| 文件大小 | 很小 | 较大 | 中等 |
| 学习曲线 | 低 | 中 | 中 |
| 实时预览 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| 搜索功能 | ✅ 内置 | ✅ 强大 | ✅ 强大 |

### 🎨 为什么选择 Docsify？

1. **零构建** - 无需构建步骤，直接使用 Markdown
2. **轻量级** - 只需一个 HTML 文件，体积小
3. **简单配置** - 5 分钟即可上手
4. **实时预览** - 修改文件后刷新即可看到效果
5. **适合你的需求** - 完美适配多语言 README 管理

## 📝 可用命令

| 命令 | 说明 |
|------|------|
| `npm run docs:check` | 检查所有文档文件是否存在 |
| `npm run docs:copy` | 复制所有 README 文件到 docs 目录 |
| `npm run docs:sync` | 同步所有语言版本的导航链接 |
| `npm run docs:validate` | 验证文档结构是否完整 |
| `npm run docs:stats` | 生成文档统计信息 |
| `npm run docs:setup` | 一键设置（复制 + 同步） |
| `npm run docs:serve` | 启动本地文档服务器 |

## 📁 文件结构

```
an-cli/
├── docs/                    # 文档目录
│   ├── index.html          # Docsify 配置文件
│   ├── _sidebar.md         # 侧边栏导航
│   ├── README.md           # 首页（英文）
│   ├── README.zh.md        # 中文文档
│   ├── README.es.md        # 西班牙语文档
│   └── ...                 # 其他语言文档
├── README.md               # 根目录英文文档（源文件）
├── README.zh.md            # 根目录中文文档（源文件）
└── scripts/
    └── docs-manager.js     # 文档管理脚本
```

## 🔧 工作流程

### 日常更新文档

1. **编辑根目录的 README 文件**（如 `README.zh.md`）
2. **运行同步命令**：
   ```bash
   npm run docs:setup
   ```
3. **预览文档**（可选）：
   ```bash
   npm run docs:serve
   ```

### 检查文档状态

```bash
npm run docs:check    # 检查文件是否存在
npm run docs:validate # 验证文档结构
npm run docs:stats    # 查看统计信息
```

### 添加新语言

1. 在根目录创建新的 README 文件（如 `README.de.md`）
2. 在 `scripts/docs-manager.js` 中添加语言配置：
   ```javascript
   'de': { file: 'README.de.md', name: 'Deutsch', code: 'de' }
   ```
3. 运行 `npm run docs:setup` 同步文档

## 🌐 部署选项

### GitHub Pages（推荐）

#### 方法一：使用 GitHub Actions（推荐）

1. 在 `.github/workflows/` 创建 `docs.yml`：

```yaml
name: Deploy Docs

on:
  push:
    branches:
      - main
    paths:
      - 'docs/**'
      - 'README*.md'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup docs
        run: npm run docs:setup
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

2. 在 GitHub 仓库设置中启用 Pages，选择 `gh-pages` 分支

#### 方法二：手动部署

1. 运行 `npm run docs:setup`
2. 提交 `docs/` 目录的更改
3. 在 GitHub 仓库设置中启用 Pages，选择 `docs` 文件夹

### Netlify / Vercel

直接部署 `docs` 目录即可，无需额外配置。

## ✨ Docsify 特性

- ✅ **零构建**：无需构建步骤，直接使用 Markdown
- ✅ **实时预览**：修改文件后刷新浏览器即可看到效果
- ✅ **全文搜索**：内置搜索功能
- ✅ **代码高亮**：自动语法高亮
- ✅ **响应式设计**：支持移动端访问

## 🎨 自定义配置

编辑 `docs/index.html` 可以自定义：

- 主题样式
- 搜索配置
- 插件设置
- 侧边栏行为

### 下一步建议

1. **立即体验**：运行 `npm run docs:setup && npm run docs:serve`
2. **自定义样式**：根据需要修改 `docs/index.html` 中的主题
3. **添加插件**：可以添加更多 Docsify 插件（如代码复制、图片缩放等）
4. **部署文档**：配置 GitHub Pages 让文档在线访问

## 📖 更多资源

- [Docsify 官方文档](https://docsify.js.org/)
- [Docsify 插件列表](https://docsify.js.org/#/plugins)
- [Markdown 语法指南](https://www.markdownguide.org/)

## ❓ 常见问题

### Q: 文档更新后没有显示？

A: 确保运行了 `npm run docs:setup` 来同步文档。

### Q: 如何添加新的文档页面？

A: 在 `docs/` 目录创建新的 Markdown 文件，然后在 `_sidebar.md` 中添加链接。

### Q: 可以自定义主题吗？

A: 可以，编辑 `docs/index.html` 中的 CSS 链接，或添加自定义 CSS。

### Q: 如何禁用搜索功能？

A: 在 `docs/index.html` 中删除搜索插件的 script 标签。

### Q: 如何添加其他文档工具（如 MkDocs）？

A: 虽然我们推荐 Docsify，但如果需要更强大的功能（如 PDF 导出、版本管理），可以考虑 MkDocs 或 VitePress。这些工具需要构建步骤，配置相对复杂。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进文档系统！

---

**祝你使用愉快！** 🎉
