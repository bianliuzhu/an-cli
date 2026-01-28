# 概览

> an-cli 是前端命令行工具，包含以下命令:
>
> - `anl type` 命令：基于 Swagger JSON 自动生成 TypeScript 类型定义和 API 请求函数的命令行工具。
> - `anl lint` 命令: 生成 react 或 vue 项目 eslint、stylelint、prettier、commitLint、VSCode相关配置
> - `anl git` 命令: 生成 git 本地配置，并设有可选功能： gitflow 标准分支创建、git commit messages 主题、git 自定义命令配置

## 功能特点

- `anl type`
  - 自动解析 Swagger JSON 文档
  - 生成 TypeScript 类型定义文件
  - 生成类型安全的 API 请求函数
  - 支持路径参数、查询参数和请求体
  - 自动生成枚举类型定义
  - 支持代码格式化
  - 支持文件上传
  - 可配置的代码生成选项
  - 支持多 Swagger 服务器配置
  - 支持 OPTIONS、HEAD、SEARCH 等 HTTP 方法

- `anl lint`
  - 一键配置各种 lint 工具
  - ESLint 配置自动化
  - Prettier 格式化配置
  - CommitLint 提交规范
  - VSCode 编辑器配置

- `anl git`
  - 多种功能可选安装
  - 标准 git flow 分支创建
  - 符合 CommitLint 提交规范的主题自动设置
  - 提供 git 自定义命令配置以及入口
  - 自动化生成 0 配置

> [!TIP]
>
> 1. 如果初次使用，不清楚会产生什么结果，建议先执行命令，观察会在项目中发生什么变化，然后再结合文档进一步修改配置，再次生成，最终达到自己理想中的样子
> 2. 或者跟着文档步骤一步一步做
> 3. 请在项目根目录执行 `anl type`、`anl lint`、`anl git` 命令

## 下一步

- [安装](zh-cn/install)
- [type 命令](zh-cn/anl-type)
- [lint 命令](zh-cn/anl-lint)
- [git 命令](zh-cn/anl-git)

## 许可证

ISC License

## 贡献指南

欢迎提交 [Issue](https://github.com/bianliuzhu/an-cli/issues) 和 [Pull Request](https://github.com/bianliuzhu/an-cli/pulls)！
