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
  - 🌐 支持多 Swagger 服务器配置
  - 🔧 支持 OPTIONS、HEAD、SEARCH 等 HTTP 方法

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

**单 Swagger 服务器配置：**

```json
{
	"saveTypeFolderPath": "apps/types",
	"saveApiListFolderPath": "apps/api/",
	"saveEnumFolderPath": "apps/enums",
	"importEnumPath": "../../enums",
	"requestMethodsImportPath": "./fetch",
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	},
	"enmuConfig": {
		"erasableSyntaxOnly": false,
		"varnames": "enum-varnames",
		"comment": "enum-descriptions"
	},
	"swaggerConfig": {
		"url": "https://generator3.swagger.io/openapi2.json",
		"apiListFileName": "index.ts",
		"publicPrefix": "/api",
		"modulePrefix": "/gateway",
		"dataLevel": "serve",
		"parameterSeparator": "_",
		"headers": {
			"Authorization": "Bearer token"
		},
		"includeInterface": [
			{
				"path": "/api/user",
				"method": "get",
				"dataLevel": "data"
			}
		],
		"excludeInterface":[]
	},
}
```

**多 Swagger 服务器配置：**

```json
{
	"saveTypeFolderPath": "apps/types",
	"saveApiListFolderPath": "apps/api/",
	"saveEnumFolderPath": "apps/enums",
	"importEnumPath": "../../enums",
	"requestMethodsImportPath": "./fetch",
	"dataLevel": "serve",
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	},
	"enmuConfig": {
		"erasableSyntaxOnly": false,
		"varnames": "enum-varnames",
		"comment": "enum-descriptions"
	},
	"swaggerConfig": [
		{
			"url": "https://generator3.swagger.io/openapi1.json",
			"apiListFileName": "op.ts",
			"modulePrefix": "/forward",
			"dataLevel": "serve",
			"parameterSeparator": "_",
			"headers": {},
			"includeInterface": [
				{
					"path": "/op/trade/order/queryPage",
					"method": "post",
					"dataLevel": "axios"
				}
			],
			"excludeInterface": []
		},
		{
			"url": "https://generator3.swagger.io/openapi2.json",
			"apiListFileName": "index.ts",
			"publicPrefix": "/api",
			"dataLevel": "data",
			"headers": {}
		}
	]
}
```

#### 配置项说明

| 配置项                             | 类型                                                         | 必填 | 说明                                                         |
| ---------------------------------- | ------------------------------------------------------------ | ---- | ------------------------------------------------------------ |
| saveTypeFolderPath                 | string                                                       | 是   | 类型定义文件保存路径                                         |
| saveApiListFolderPath              | string                                                       | 是   | API 请求函数文件保存路径                                     |
| saveEnumFolderPath                 | string                                                       | 是   | 枚举数据文件保存路径                                         |
| importEnumPath                     | string                                                       | 是   | 枚举导入路径(apps/types/models/\*.ts 中 enum 文件的引用的路径) |
| swaggerJsonUrl                     | string                                                       | 否   | Swagger JSON 文档地址（已迁移到 `swaggerConfig.url`，保留用于兼容旧版配置）**后面迭代版本会删除该字段** |
| swaggerConfig                      | object \| Array<object>                                      | 否   | Swagger 服务器配置。单个服务器可直接填写对象，多个服务器使用数组。每个服务器可配置 `url`、`publicPrefix`、`modulePrefix`、`apiListFileName`、`headers`、`dataLevel`、`parameterSeparator`、`includeInterface`、`excludeInterface`<br />这个字段 对应 单 Swagger 服务器配置 与 多 Swagger 服务器配置 示例，请向上滚动查看 |
| swaggerConfig[].url                | string                                                       | 是   | Swagger JSON 文档地址                                        |
| swaggerConfig[].publicPrefix       | string                                                       | 否   | url path 上的公共前缀，例如：api/users、api/users/{id} ,api 就是公共前缀 |
| swaggerConfig[].modulePrefix       | string                                                       | 否   | 请求路径前缀（可以理解为模块名），会自动添加到每个 API 请求路径前面。<br />例如：`modulePrefix: "/forward"` 时，<br />`/publicPrefix/modulePrefix/user` ， 会变成 `/publicPrefix/forward/user` |
| swaggerConfig[].apiListFileName    | string                                                       | 否   | API 列表文件名，默认为 `index.ts`。多个服务器时，每个服务器的API 列表文件名必须唯一 |
| swaggerConfig[].headers            | object                                                       | 否   | 该服务器的请求头配置                                         |
| swaggerConfig[].dataLevel          | 'data' \| 'serve' \| 'axios'                                 | 否   | 该服务器的接口返回数据层级。若未设置，使用全局 `dataLevel` 配置 |
| swaggerConfig[].parameterSeparator | '$' \| '\_'                                                  | 否   | 该服务器生成 API 名称和类型名称时使用的分隔符。若未设置，使用全局 `parameterSeparator` 配置 |
| swaggerConfig[].includeInterface   | Array<{path: string, method: string, dataLevel?: 'data' \| 'serve' \| 'axios'}> | 否   | 该服务器包含的接口列表。每个接口可单独配置 `dataLevel`，具有最高优先级。若未设置，使用全局 `includeInterface` 配置 |
| swaggerConfig[].excludeInterface   | Array<{path: string, method: string}>                        | 否   | 该服务器排除的接口列表。若未设置，使用全局 `excludeInterface` 配置 |
| requestMethodsImportPath           | string                                                       | 是   | 请求方法导入路径                                             |
| dataLevel                          | 'data' \| 'serve' \| 'axios'                                 | 否   | 全局接口返回数据层级配置，默认值：`'serve'`。各服务器可单独配置覆盖 |
| formatting                         | object                                                       | 否   | 代码格式化配置                                               |
| formatting.indentation             | string                                                       | 否   | 代码缩进字符，例如：`"\t"` 或 `"  "`（两个空格）             |
| formatting.lineEnding              | string                                                       | 否   | 换行符，例如：`"\n"` (LF) 或 `"\r\n"` (CRLF)                 |
| headers                            | object                                                       | 否   | 全局请求头配置（已迁移到 `swaggerConfig`，保留用于兼容旧版配置） |
| includeInterface                   | Array<{path: string, method: string}>                        | 否   | 全局包含的接口：`saveApiListFolderPath`指定的接口列表文件，只会包含列表中的接口，与 `excludeInterface` 字段互斥。各服务器可单独配置覆盖 |
| excludeInterface                   | Array<{path: string, method: string}>                        | 否   | 全局排除的接口: `saveApiListFolderPath` 指定的接口列表文本，不存在该列表中的接口，与 `includeInterface` 互斥。各服务器可单独配置覆盖 |
| publicPrefix                       | string                                                       | 否   | 全局 url path 上的公共前缀（已迁移到 `swaggerConfig`，保留用于兼容旧版配置） |
| modulePrefix                       | string                                                       | 否   | 全局请求路径前缀（各服务器可单独配置覆盖）                   |
| apiListFileName                    | string                                                       | 否   | 全局 API 列表文件名，默认为 `index.ts`（已迁移到 `swaggerConfig`，保留用于兼容旧版配置） |
| enmuConfig                         | object                                                       | 是   | 枚举配置对象                                                 |
| enmuConfig.erasableSyntaxOnly      | boolean                                                      | 是   | 与 tsconfig.json 的 `compilerOptions.erasableSyntaxOnly` 选项保持一致。为 `true` 时，生成 const 对象而非 enum（仅类型语法）。默认值：`false` |
| enmuConfig.varnames                | string                                                       | 否   | Swagger schema 中自定义枚举成员名所在的字段名。默认值：`enum-varnames`。 |
| enmuConfig.comment                 | string                                                       | 否   | Swagger schema 中自定义枚举描述所在的字段名（用于生成注释）。默认值：`enum-descriptions`。 |
| parameterSeparator                 | '$' \| '\_'                                                  | 否   | 全局生成 API 名称和类型名称时，路径段和参数之间使用的分隔符。例如，`/users/{userId}/posts` 使用分隔符 `'_'` 会生成 `users_userId_posts_GET`。默认值：`'_'`。各服务器可单独配置覆盖 |

#### 配置项与生成的文件对应关系

> 文件结构是依据配置文件产生的，标注 **不受控** 表示： 该文件夹及其文件为自动生成不受配置项控制

```
project/
├── apps/
│   ├── types/               		# 由 saveTypeFolderPath 配置项指定
│   │   ├── models/          				# 所有类型定义文件（不包含枚举类型） 不受控
│   │   ├── connectors/      				# API 类型定义（接口定义文件）不受控
│   └── api/                 		# 请求文件：由 saveApiListFolderPath 配置项指定
│   │    └── index.ts        				# API 请求函数列表（单服务器或第一个服务器）不受控
│   │    └── op.ts           				# 多服务器时，其他服务器的 API 列表文件 不受控
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

#### 配置优先级

工具支持全局配置和服务器级别配置，遵循以下优先级规则：

**优先级：接口级别配置 > 服务器级别配置 > 全局配置 > 默认值**

以下配置项支持多级优先级覆盖：

- `dataLevel`：接口返回数据层级
  - **接口级别**：`includeInterface[].dataLevel` - 最高优先级
  - **服务器级别**：`swaggerConfig[].dataLevel` - 次优先级
  - **全局配置**：`dataLevel` - 基础优先级
  - **默认值**：`'serve'`
- `parameterSeparator`：API 名称和类型名称的分隔符
- `includeInterface`：包含的接口列表
- `excludeInterface`：排除的接口列表
- `modulePrefix`：请求路径前缀
- `publicPrefix`：URL 公共前缀
- `headers`：请求头配置

**示例：**

```json
{
	"dataLevel": "serve",
	"parameterSeparator": "_",
	"swaggerConfig": [
		{
			"url": "http://api1.example.com/swagger.json",
			"dataLevel": "data",
			"apiListFileName": "api1.ts"
		},
		{
			"url": "http://api2.example.com/swagger.json",
			"apiListFileName": "api2.ts"
		}
	]
}
```

在上面的配置中：

- `api1.ts` 使用 `dataLevel: "data"`（服务器级别配置）
- `api2.ts` 使用 `dataLevel: "serve"`（全局配置）
- 两个服务器都使用 `parameterSeparator: "_"`（全局配置）

#### 类型解析

- 支持所有 OpenAPI 3.0 规范的数据类型
- 自动处理复杂的嵌套类型
- 支持数组、对象、枚举等类型
- 自动生成接口注释

#### 枚举生成

工具支持两种枚举生成模式，通过 `enmuConfig.erasableSyntaxOnly` 配置控制：

**传统枚举模式** (`enmuConfig.erasableSyntaxOnly: false`，默认值):

```typescript
export enum Status {
	Success = 'Success',
	Error = 'Error',
	Pending = 'Pending',
}
```

**常量对象模式** (`enmuConfig.erasableSyntaxOnly: true`):

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

#### 数据层级配置（dataLevel）

`dataLevel` 用于配置接口返回数据的提取层级，支持三个选项：

1. **`'serve'`（默认值）**：提取服务器返回的 `data` 字段

   ```typescript
   // 服务器返回: { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   // 函数返回: { id: 1, name: 'user' }
   ```

2. **`'data'`**：提取 `data.data` 字段（适用于嵌套 data 的场景）

   ```typescript
   // 服务器返回: { data: { code: 200, data: { id: 1, name: 'user' } } }
   // 函数返回: { id: 1, name: 'user' }
   ```

3. **`'axios'`**：返回完整的 axios 响应对象
   ```typescript
   // 服务器返回: { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   // 函数返回: { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   ```

**配置优先级：**

`dataLevel` 支持三级配置优先级：

```
接口级别 > 服务器级别 > 全局配置 > 默认值
```

**配置示例：**

```json
{
	"dataLevel": "serve",
	"swaggerConfig": [
		{
			"url": "http://api1.example.com/swagger.json",
			"dataLevel": "data",
			"includeInterface": [
				{
					"path": "/api/user/detail",
					"method": "get",
					"dataLevel": "axios"
				},
				{
					"path": "/api/user/list",
					"method": "get"
				}
			]
		}
	]
}
```

在上面的配置中：

- `/api/user/detail` 接口使用 `dataLevel: "axios"`（接口级别配置，最高优先级）
- `/api/user/list` 接口使用 `dataLevel: "data"`（服务器级别配置）
- 其他服务器的接口使用 `dataLevel: "serve"`（全局配置）

> **注意**：
>
> - 接口级别的 `dataLevel` 配置具有最高优先级，适用于个别接口需要特殊处理的场景
> - 服务器级别的 `dataLevel` 配置会覆盖全局配置
> - 未配置时使用默认值 `'serve'`

#### 文件上传

当检测到文件上传类型时，会自动添加对应的请求头：

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

#### 代码格式化

工具支持自定义代码格式化选项，通过 `formatting` 配置控制：

**配置示例：**

```json
{
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	}
}
```

**配置说明：**

- `indentation`：代码缩进字符
  - `"\t"`：使用 Tab 缩进（默认）
  - `"  "`：使用 2 个空格缩进
  - `"    "`：使用 4 个空格缩进
- `lineEnding`：换行符类型
  - `"\n"`：LF（Linux/macOS 风格，推荐）
  - `"\r\n"`：CRLF（Windows 风格）

**注意：** 如果项目中配置了 Prettier，生成的代码会自动使用 Prettier 进行格式化，`formatting` 配置可能会被 Prettier 覆盖。

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
   - 配置格式为包含 `path`、`method` 和可选的 `dataLevel` 的对象数组
   - 每个接口可以单独配置 `dataLevel`，具有最高优先级

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
			"method": "get",
			"dataLevel": "data"
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

#### 多 Swagger 服务器支持

工具支持配置多个 Swagger 服务器，每个服务器可以独立配置：

- **单个服务器**：`swaggerConfig` 可以直接填写对象
- **多个服务器**：`swaggerConfig` 使用数组形式，每个服务器必须配置唯一的 `apiListFileName`

**工作原理：**

- 第一个服务器的 API 会生成到指定的 `apiListFileName`（默认为 `index.ts`）
- 后续服务器的 API 会追加到各自的 `apiListFileName` 文件中
- 类型定义和枚举会合并到统一的文件夹中，避免重复

**服务器级别配置：**

每个服务器支持独立配置以下选项，若未设置则使用全局配置：

- `dataLevel` - 接口返回数据层级
- `parameterSeparator` - API 名称和类型名称的分隔符
- `includeInterface` - 包含的接口列表
- `excludeInterface` - 排除的接口列表
- `modulePrefix` - 请求路径前缀

#### 路径前缀（modulePrefix）

`modulePrefix` 用于在所有 API 请求路径前自动添加前缀，这在以下场景特别有用：

1. **反向代理场景**：当后端服务通过反向代理转发时
2. **API 网关**：统一在路径前添加网关前缀
3. **多环境配置**：不同环境使用不同的路径前缀

**使用示例：**

```json
{
	"swaggerConfig": [
		{
			"url": "http://api.example.com/swagger.json",
			"modulePrefix": "/forward",
			"apiListFileName": "api.ts"
		}
	]
}
```

**效果：**

Swagger 中定义的路径 `/api/user/list` 会生成为：

```typescript
export const apiUserListGet = (params: ApiUserList_GET.Query) => GET<ApiUserList_GET.Response>('/forward/api/user/list', params);
```

**与 publicPrefix 的区别：**

- `publicPrefix`：用于从接口路径中移除公共前缀（仅影响生成的函数名）
- `modulePrefix`：用于在实际请求路径前添加前缀（影响运行时的请求 URL）

**配置示例：**

```json
{
	"swaggerConfig": [
		{
			"url": "http://api1.example.com/swagger.json",
			"apiListFileName": "api1.ts",
			"publicPrefix": "/api/v1",
			"modulePrefix": "/forward",
			"dataLevel": "serve",
			"parameterSeparator": "_",
			"headers": {
				"Authorization": "Bearer token1"
			},
			"includeInterface": [
				{
					"path": "/api/v1/users",
					"method": "get"
				}
			]
		},
		{
			"url": "http://api2.example.com/swagger.json",
			"apiListFileName": "api2.ts",
			"publicPrefix": "/api/v2",
			"dataLevel": "data",
			"headers": {
				"Authorization": "Bearer token2"
			}
		}
	]
}
```

**迁移说明：**

- 旧版配置（`swaggerJsonUrl`、`publicPrefix`、`headers`）仍然兼容
- 工具会自动检测旧版配置并提示迁移方式
- 建议迁移到新的 `swaggerConfig` 配置以获得更好的灵活性

#### HTTP 方法支持

工具支持以下 HTTP 方法：

- `GET` - 获取资源
- `POST` - 创建资源
- `PUT` - 更新资源（完整替换）
- `PATCH` - 更新资源（部分更新）
- `DELETE` - 删除资源
- `OPTIONS` - 预检请求
- `HEAD` - 获取响应头
- `SEARCH` - 搜索请求

所有方法都支持类型安全的参数和响应类型定义。

### 注意事项

1. 确保 Swagger JSON 文档地址可访问
2. 配置文件中的路径需要是相对于项目根目录的路径
3. 生成的文件会覆盖已存在的同名文件（但 `config.ts`、`error-message.ts`、`fetch.ts`、`api-type.d.ts` 这些文件如果已存在则不会覆盖）
4. 建议将生成的文件加入版本控制
5. 使用多 Swagger 服务器时，确保每个服务器的 `apiListFileName` 唯一，避免文件覆盖
6. 多个服务器配置时，类型定义和枚举会合并，如果不同服务器有同名类型，可能会产生冲突
7. 服务器级别的配置（`dataLevel`、`parameterSeparator`、`includeInterface`、`excludeInterface`、`modulePrefix`）会覆盖全局配置
8. `includeInterface` 和 `excludeInterface` 不能同时配置，如果同时配置，会优先使用 `includeInterface`

### 常见问题

1. **生成的类型文件格式化失败**
   - 检查是否安装了 prettier
   - 确认项目根目录下是否有 prettier 配置文件
   - 检查 `formatting` 配置是否正确

2. **请求函数导入路径错误**
   - 检查 `requestMethodsImportPath` 配置是否正确
   - 确认请求方法文件是否存在

3. **什么时候使用 `modulePrefix`？**
   - 当你的 API 需要通过反向代理或网关访问时
   - 例如：Swagger 中定义的是 `/api/user`，但实际请求需要是 `/gateway/api/user`
   - 设置 `modulePrefix: "/gateway"` 即可

4. **`publicPrefix` 和 `modulePrefix` 有什么区别？**
   - `publicPrefix`：从接口路径中移除前缀，只影响生成的函数名
     - 例如：`/api/user/list` 移除 `/api` 后，函数名为 `userListGet`
   - `modulePrefix`：在请求路径前添加前缀，影响实际请求的 URL
     - 例如：`/api/user/list` 添加 `/forward` 后，请求 URL 为 `/forward/api/user/list`

5. **多个服务器如何配置不同的 `dataLevel`？**

   ```json
   {
   	"dataLevel": "serve",
   	"swaggerConfig": [
   		{
   			"url": "http://old-api.com/swagger.json",
   			"dataLevel": "axios",
   			"apiListFileName": "old-api.ts"
   		},
   		{
   			"url": "http://new-api.com/swagger.json",
   			"apiListFileName": "new-api.ts"
   		}
   	]
   }
   ```

   - `old-api.ts` 使用 `dataLevel: "axios"`
   - `new-api.ts` 使用全局的 `dataLevel: "serve"`

6. **如何为单个接口配置不同的 `dataLevel`？**

   ```json
   {
   	"dataLevel": "serve",
   	"swaggerConfig": [
   		{
   			"url": "http://api.com/swagger.json",
   			"apiListFileName": "api.ts",
   			"dataLevel": "data",
   			"includeInterface": [
   				{
   					"path": "/api/user/detail",
   					"method": "get",
   					"dataLevel": "axios"
   				},
   				{
   					"path": "/api/user/list",
   					"method": "get"
   				}
   			]
   		}
   	]
   }
   ```

   - `/api/user/detail` 使用接口级别的 `dataLevel: "axios"`（最高优先级）
   - `/api/user/list` 使用服务器级别的 `dataLevel: "data"`
   - 其他服务器的接口使用全局的 `dataLevel: "serve"`

7. **如何只生成部分接口？**
   - 使用 `includeInterface` 配置：
     ```json
     {
     	"swaggerConfig": [
     		{
     			"url": "http://api.com/swagger.json",
     			"includeInterface": [
     				{ "path": "/api/user", "method": "get" },
     				{ "path": "/api/user/{id}", "method": "post" }
     			]
     		}
     	]
     }
     ```
   - 或使用 `excludeInterface` 排除不需要的接口

8. **生成的文件被覆盖了怎么办？**
   - `config.ts`、`error-message.ts`、`fetch.ts`、`api-type.d.ts` 这些文件只会在首次不存在时生成
   - API 列表文件和类型文件每次都会重新生成
   - 建议将生成的文件纳入版本控制，便于查看变更

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
