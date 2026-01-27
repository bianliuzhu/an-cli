# `anl lint` 命令使用说明

> 提供**交互式多选**配置前端项目各种 lint 工具的功能，包括：
>
> - ESLint - JavaScript/TypeScript 代码检查
> - Stylelint - CSS/SCSS/Less 样式检查
> - Prettier - 代码格式化
> - CommitLint - Git 提交信息规范
> - VSCode - 编辑器配置

### 使用方法

```bash
$ anl lint
```

执行命令后，会出现交互式多选界面，你可以选择需要安装的工具：

```
? Select the linting tools to install (multi-select):
❯◯ ESLint - JavaScript/TypeScript linter
 ◯ Stylelint - CSS/SCSS/Less linter
 ◯ Commitlint - Git commit message linter
 ◯ Prettier - Code formatter
 ◯ VSCode - Editor settings
```

使用 **空格键** 选择/取消选择，**回车键** 确认。

### 配置详情

#### 1. ESLint 配置

- 自动安装所需依赖
- 支持 React/Vue 框架（选择后会提示选择框架）
- 自动生成 `.eslintrc.js` 和 `.eslintignore`
- 集成 TypeScript 支持

#### 2. Stylelint 配置

- 自动安装 stylelint 相关依赖
- 支持 Less/Sass 预处理器（选择后会提示选择预处理器）
- 生成 `.stylelintrc.js` 配置文件
- 集成 Prettier 支持

#### 3. Prettier 配置

- 自动安装 prettier 相关依赖
- 生成 `.prettierrc.js` 配置文件
- 默认配置包括：
  - 行宽：80
  - Tab 缩进
  - 使用单引号
  - 箭头函数括号
  - 其他代码风格规范

#### 4. CommitLint 配置

- 安装 commitlint 相关依赖
- 配置 husky git hooks
- 生成 `commitlint.config.js`
- 规范化 git commit message

#### 5. VSCode 配置

- 创建 `.vscode/settings.json`
- 配置编辑器自动格式化
- 设置默认格式化工具
- 支持已有配置文件更新

### 使用示例

1. **只安装 ESLint 和 Prettier**
   - 选择 ESLint 和 Prettier
   - 如果选择了 ESLint，会提示选择框架（React/Vue）
   - 安装完成后项目中会有 `.eslintrc.js` 和 `.prettierrc.js`

2. **完整配置**
   - 选择所有选项
   - 依次完成框架和预处理器的选择
   - 项目将配置完整的代码规范体系
