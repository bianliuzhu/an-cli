# an-cli

[English](./README.zh.md) | [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | [Русский](./README.ru.md) | [日本語](./README.jp.md) | 简体中文

# 功能概述

> an-cli 是前端命令行工具，包含以下命令:
>
> - `anl type` 命令：基于 Swagger JSON 自动生成 TypeScript 类型定义和 API 请求函数的命令行工具。
> - `anl lint` 命令: 生成 react 或 vue 项目 eslint、stylelint、prettier、commitLint、VSCode相关配置
> - `anl git` 命令: 生成 git 本地配置，并设有可选功能： gitflow 标准分支创建、git commit messages 主题、git 自定义命令配置

# 功能特点

- `anl type`
  - 🚀 自动解析 Swagger JSON 文档
  - 📦 生成 TypeScript 类型定义文件
  - 🔄 生成类型安全的 API 请求函数
  - 🎯 支持路径参数、查询参数和请求体
  - 📝 自动生成枚举类型定义
  - 🎨 支持代码格式化
  - ⚡️ 支持文件上传
  - 🛠 可配置的代码生成选项

- `anl lint`
  - 🔍 一键配置各种 lint 工具
  - 🎨 ESLint 配置自动化
  - 🎯Prettier 格式化配置
  - 🔄 CommitLint 提交规范
  - 📦 VSCode 编辑器配置

- `anl git`
  - 🔍 多种功能可选安装
  - 🎨 标准 git flow 分支创建
  - 🎯 符合 CommitLint 提交规范的主题自动设置
  - 🔄 提供 git 自定义命令配置以及入口
  - 📦 自动化生成 0 配置

# 安装

> [!NOTE]
> 需要全局安装

```bash
$ npm install anl -g
```

```bash
$ yarn global add anl
```

```bash
$ pnpm add -g anl
```

# 使用说明

> [!TIP]
>
> 1. 如果初次使用，不清楚会产生什么结果，建议先执行命令，观察会在项目中发生什么变化，然后在结合文档，进一步修改配置，再次生成，最终达到自己理想中的样子
> 2. 或者跟着下面步骤 一步一步做，就会有收获
> 3. 请在项目根目录执行 `anl type`、`anl lint`、 `anl git` 命令

## `anl type` 命令使用说明

- **首次**执行 `anl type`, 命令，会在*项目根目录下*, _自动创建_ 以 `an.config.json` 为名的配置文件（手动创建也可以）初始化配置模板。

- 执行 `anl type` 命令时，会找用户项目根目录下的 `an.config.json` 配置文件，并读取其配置信息，生成对应的axios封装、配置、接口列表、接口请求及每个接口请求参数及响应的TS类型

- 配置文件内的配置项是可自由修改的

- 关于 `an.config.json` 配置文件
  - 配置文件必须在项目根目录下

  - 配置文件名称不可更改

  - 具体参数说明请看[配置文件详解](#配置文件详解)

- 按照自己的需要更新配置文件，然后再次执行 `anl type` 命令，会依照配置文件中的指定配置信息生成，生成对应的类型信息

- 如果 'config.ts', 'error-message.ts', 'fetch.ts', 'api-type.d.ts' 这些文件存在的话将不再重复生成

-

> [!NOTE]
>
> 如果不清楚这些配置，可以先执行 anl type 命令，将类型先生成，然后检查项目目录，结合配置项说明，调整配置项，再次生成，逐步验证配置项目作用，完成最终配置

### 使用方法

```bash
$ anl type
```

### 配置文件详解

#### 配置文件示例

```json
{
	"saveTypeFolderPath": "apps/types",
	"saveApiListFolderPath": "apps/api/",
	"saveEnumFolderPath": "apps/enums",
	"importEnumPath": "../../enums",
	"swaggerJsonUrl": "https://generator3.swagger.io/openapi.json",
	"requestMethodsImportPath": "./fetch",
	"dataLevel": "serve",
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	},
	"headers": {},
	"includeInterface": [
		{
			"path": "/api/user",
			"method": "get"
		}
	],
	"excludeInterface": [
		{
			"path": "/api/admin",
			"method": "post"
		}
	],
	"publicPrefix": "api",
	"erasableSyntaxOnly": false,
	"parameterSeparator": "_"
}
```

#### 配置项说明

| 配置项                   | 类型                                  | 必填 | 说明                                                                                                                                                   |
| ------------------------ | ------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| saveTypeFolderPath       | string                                | 是   | 类型定义文件保存路径                                                                                                                                   |
| saveApiListFolderPath    | string                                | 是   | API 请求函数文件保存路径                                                                                                                               |
| saveEnumFolderPath       | string                                | 是   | 枚举数据文件保存路径                                                                                                                                   |
| importEnumPath           | string                                | 是   | 枚举导入路径(apps/types/models/\*.ts 中 enum 文件的引用的路径)                                                                                         |
| swaggerJsonUrl           | string                                | 是   | Swagger JSON 文档地址                                                                                                                                  |
| requestMethodsImportPath | string                                | 是   | 请求方法导入路径                                                                                                                                       |
| dataLevel                | 'data' \| 'serve' \| 'axios'          | 是   | 接口返回数据层级                                                                                                                                       |
| formatting               | object                                | 否   | 代码格式化配置                                                                                                                                         |
| headers                  | object                                | 否   | 请求头配置                                                                                                                                             |
| includeInterface         | Array<{path: string, method: string}> | 否   | 包含的接口：`saveApiListFolderPath`指定的接口列表文件，只会包含列表中的接口，与 `excludeInterface` 字段互斥                                            |
| excludeInterface         | Array<{path: string, method: string}> | 否   | 排除的接口: `saveApiListFolderPath` 指定的接口列表文本，不存在该列表中的接口，与 `includeInterface` 互斥                                               |
| publicPrefix             | string                                | 否   | url path 上的公共前缀，例如：api/users、api/users/{id} ,api 就是公共前缀                                                                               |
| erasableSyntaxOnly       | boolean                               | 是   | 与 tsconfig.json 的 `compilerOptions.erasableSyntaxOnly` 选项保持一致。为 `true` 时，生成 const 对象而非 enum（仅类型语法）。默认值：`false`           |
| parameterSeparator       | string                                | 否   | 生成 API 名称和类型名称时，路径段和参数之间使用的分隔符。例如，`/users/{userId}/posts` 使用分隔符 `'_'` 会生成 `users_userId_posts_GET`。默认值：`'_'` |

#### 配置项与生成的文件对应关系

> 文件结构是依据配置文件产生的，标注 **不受控** 表示： 该文件夹及其文件为自动生成不受配置项控制

```
project/
├── apps/
│   ├── types/               		# 由 saveTypeFolderPath 配置项指定
│   │   ├── models/          				# 所有类型定义文件（不包含枚举类型） 不受控
│   │   ├── connectors/      				# API 类型定义（接口定义文件）不受控
│   └── api/                 		# 请求文件：由 saveApiListFolderPath 配置项指定
│   │    └── index.ts        				# API 请求函数列表 不受控
│   │    └── api-type.d.ts      		# 请求类型定义文件 不受控
│   │    └── config.ts       				# 请求、响应拦截、请求配置 不受控
│   │    └── error-message.ts   		# 系统级错误提示 不受控
│   │    ├── fetch.ts        				# axios 请求封装，可换成 fetch 不受控
│   └── enums/               		# 枚举数据类型定义：由 saveEnumFolderPath 配置项指定
```

### 生成的代码示例

#### 接口类型定义

```typescript
declare namespace UserDetail_GET {
	interface Query {
		userId: string;
	}

	interface Response {
		id: string;
		name: string;
		age: number;
		role: UserRole;
	}
}
```

#### API 请求函数

```typescript
import { GET } from './fetch';

/**
 * 获取用户详情
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

### 特性说明

#### 类型解析

- 支持所有 OpenAPI 3.0 规范的数据类型
- 自动处理复杂的嵌套类型
- 支持数组、对象、枚举等类型
- 自动生成接口注释

#### 枚举生成

工具支持两种枚举生成模式，通过 `erasableSyntaxOnly` 配置控制：

**传统枚举模式** (`erasableSyntaxOnly: false`，默认值):

```typescript
export enum Status {
	Success = 'Success',
	Error = 'Error',
	Pending = 'Pending',
}
```

**常量对象模式** (`erasableSyntaxOnly: true`):

```typescript
export const Status = {
	Success: 'Success',
	Error: 'Error',
	Pending: 'Pending',
} as const;

export type StatusType = (typeof Status)[keyof typeof Status];
```

> **为什么使用常量对象模式？**
> 当 TypeScript 的 `compilerOptions.erasableSyntaxOnly` 设置为 `true` 时，代码只能使用可擦除的类型语法。传统的 `enum` 会生成运行时代码，而常量对象是纯类型的，编译后会被完全擦除。这确保了与要求仅类型语法的构建工具的兼容性。

**在类型中使用：**

```typescript
// 传统枚举模式
interface User {
	status: Status; // 直接使用枚举作为类型
}

// 常量对象模式
interface User {
	status: StatusType; // 使用生成的带 'Type' 后缀的类型
}
```

#### 文件上传

当检测到文件上传类型时，会自动添加对应的请求头：

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

#### 错误处理

工具内置了完善的错误处理机制：

- 解析错误提示
- 类型生成失败警告
- 文件写入异常处理

#### 接口过滤

工具支持通过配置来过滤需要生成的接口：

1. 包含特定接口
   - 通过 `includeInterface` 配置项指定需要生成的接口
   - 只会生成配置中指定的接口
   - 配置格式为包含 `path` 和 `method` 的对象数组

2. 排除特定接口
   - 通过 `excludeInterface` 配置项指定需要排除的接口
   - 会生成除了配置中指定接口之外的所有接口
   - 配置格式为包含 `path` 和 `method` 的对象数组

示例配置：该配置在`an.config.json` 配置

```json
{
	"includeInterface": [
		{
			"path": "/api/user",
			"method": "get"
		}
	],
	"excludeInterface": [
		{
			"path": "/api/admin",
			"method": "post"
		}
	]
}
```

注意：`includeInterface` 和 `excludeInterface` 不能同时使用，如果同时配置，会优先使用 `includeInterface`。

### 注意事项

1. 确保 Swagger JSON 文档地址可访问
2. 配置文件中的路径需要是相对于项目根目录的路径
3. 生成的文件会覆盖已存在的同名文件
4. 建议将生成的文件加入版本控制

### 常见问题

1. 生成的类型文件格式化失败
   - 检查是否安装了 prettier
   - 确认项目根目录下是否有 prettier 配置文件

2. 请求函数导入路径错误
   - 检查 requestMethodsImportPath 配置是否正确
   - 确认请求方法文件是否存在

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

# `anl git` 命令

### 功能概述

- 通过交互式多选，为当前仓库应用以下 Git 能力：
  - gitflow 标准分支创建
    - 将 `.gitscripts/`、`.gitconfig`、`.commit-type.cjs` 复制到项目（仅在缺失时）
    - 为 `.gitscripts/random-branch.sh` 添加可执行权限
    - 执行 `git config --local include.path ../.gitconfig`
  - 自动设置 commit subject
    - 复制 `.githooks/commit-msg` 并设置为可执行
    - 执行 `git config core.hooksPath .githooks`
  - 自定义 git 命令
    - 向项目添加 `.gitattributes`（仅在缺失时）

### 使用方法

```bash
$ anl git
```

在提示中选择一个或多个功能。文件仅在不存在时创建；已有文件会被保留。

### 注意事项

- 请在 Git 仓库内运行。
- 若自动执行的 git config 失败，请手动执行：

```bash
git config --local include.path ../.gitconfig
git config core.hooksPath .githooks
```

# 许可证

ISC License

# 贡献指南

欢迎提交 [Issue](https://github.com/bianliuzhu/an-cli/issues) 和 [Pull Request](https://github.com/bianliuzhu/an-cli/pulls)！
