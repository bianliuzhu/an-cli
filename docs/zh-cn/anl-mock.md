# mock 命令

`anl mock` 根据 `anl type` 已生成的 API 列表和 TypeScript 响应类型，生成供 `mock-service-plugin` 读取的 Mock.js JSON 模板。只生成文件，不启动 mock 服务，不访问 Swagger，也不执行项目中的 API 或请求模块。

尚未安装 CLI 时，先参考 [anl 安装说明](zh-cn/install)。无需安装 AI 工具或执行 `anl skill`；后者初始化的是供 AI 使用的指令文件，详见 [skill 命令](zh-cn/anl-skill)。

## 安装 mock 服务插件

插件安装包地址：[mock-service-plugin（npm）](https://www.npmjs.com/package/mock-service-plugin)。该页面也提供插件的使用说明。

如果用户工程尚未安装插件，请在**用户项目根目录**执行与项目包管理器对应的命令，任选一种即可：

- npm：`npm install -D mock-service-plugin`
- pnpm：`pnpm add -D mock-service-plugin`
- Yarn：`yarn add -D mock-service-plugin`

包管理器会自动下载并安装插件及其依赖，无需手动下载源码。插件已包含 `mockjs` 运行依赖；只有项目代码需要直接导入 `mockjs` 时，才需要单独安装它。

仅生成 mock 文件不需要安装插件；通过 HTTP 提供 mock 响应时才需要它。`anl mock` 不会自动安装或启动插件。安装后按插件文档接入 `startServer({ mockDir, port })`，使 `mockDir` 与本命令的输出目录一致。项目已有对应的 `npm run mock` 启动脚本时，继续使用即可。

## 使用方式

先在项目根目录运行 `anl type`，确保 API 列表及其引用的类型声明已经生成，然后运行：

```bash
anl mock
```

命令优先读取 `an.config.ts`，不存在时读取 `an.config.json`。从 `saveApiListFolderPath` 中发现已生成的服务 API 文件，排除声明文件、纯导出入口和辅助模块。选择列表仅展示服务，不展示具体接口；名称优先使用 `swaggerConfig.name`，否则使用文件名去掉扩展名。可多选，空选表示全选；只有一个服务时直接生成。非交互终端默认处理全部服务。

```bash
anl mock -S growth
anl mock -S growth,user
anl mock --all
anl mock -S growth --overwrite
anl mock -S growth --mock-dir mocks --log-level verbose
```

| 参数                      | 说明                                                      |
| ------------------------- | --------------------------------------------------------- |
| `-S, --service <names>`   | 指定服务名称或 API 文件名去掉扩展名，忽略大小写，逗号分隔 |
| `-a, --all`               | 无需交互，生成全部已存在的服务，不可与 `--service` 同用   |
| `-d, --mock-dir <path>`   | 覆盖配置中的输出根目录                                    |
| `--overwrite`             | 显式覆盖已有接口的 mock，默认跳过                         |
| `-l, --log-level <level>` | `silent`、`error`、`warn`、`info`、`verbose`              |

## 输出与插件

默认输出到 `mocks/<服务文件名去扩展名>/<接口函数名>.json`。服务目录沿用 `anl type` 的目录名清洗规则。

例如 `appGrowthSurvey_code_GET` 使用 `/app/growth/survey/${code}`，生成文件为 `mocks/growth/appGrowthSurvey_code_GET.json`，路径参数保留原名 `:code`。下面省略了部分响应字段：

<!-- prettier-ignore -->
```jsonc
/**
 * Survey response
 * @url /app/growth/survey/:code
 * @method GET
 */
{
	"code": 10000,
	"msg": "success",
	"data": {
		"code": "@string",
		"id": "@guid",
		"version": "@integer(0,100)"
	},
	"success": true
}
```

文件是插件约定的“头部注释 + JSON”，不能直接把整个文件传给 `JSON.parse`。插件会移除注释，对正文执行 `JSON.parse` 后再用 `Mock.mock()` 渲染，因此正文必须是严格 JSON，不能有尾逗号或额外注释。`mock-service-plugin` 会递归扫描子目录，所以 `startServer` 的 `mockDir` 指向 `mocks` 根目录即可。

## 启动 mock 服务

首次接入可采用以下独立启动方式，推荐使用 Node.js 22 或 24。在用户项目中新增 `scripts/mock-server.mjs`，`.mjs` 可直接使用 ESM，无需修改项目的 `type` 配置或安装 TypeScript 执行器：

```mjs
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startServer } from 'mock-service-plugin';

const mockDir = fileURLToPath(new URL('../mocks/', import.meta.url));
mkdirSync(mockDir, { recursive: true });

startServer({ mockDir, port: 3008 });
```

`mockDir` 必须与 `an.config.ts` 中的 `mock.mockDir` 或 `--mock-dir` 指定的目录一致。`3008` 已被占用时，选择其他空闲端口，并同步修改前端开发代理。

将下面的命令合并到项目现有 `package.json` 的 `scripts` 中，保留其他脚本：

```json
{
	"scripts": {
		"mock:generate": "anl mock",
		"mock:server": "node scripts/mock-server.mjs"
	}
}
```

完成 API 生成后，先生成 mock，再启动服务：

```bash
npm run mock:generate -- -S growth
npm run mock:server
```

将 `growth` 替换为项目实际服务。使用 pnpm/Yarn 时，分别运行 `pnpm run mock:generate -S growth`、`yarn mock:generate -S growth`，再通过 `pnpm run mock:server`、`yarn mock:server` 启动。

服务启动后，在另一个终端使用实际接口路径验证，例如：

```bash
curl 'http://localhost:3008/app/growth/survey/example-code'
```

前端开发服务需要单独启动，并将需要 mock 的请求通过开发代理转发到 `http://localhost:3008`，保留与 `@url` 一致的完整路径，例如 `/app/...` 或 `/dot-ai-agent/...`。生成文件和启动插件不会自动修改应用的请求地址。插件仅用于开发，不应加入生产启动流程。

如果已有 `npm run mock` 会调用 `startServer({ mockDir, port })`（例如 app-h5-view 的 Nuxt mock 模式），继续使用原命令即可，不要再同时启动第二个 mock 服务。

## 配置

在现有 `an.config.ts` 中添加可选的 `mock` 配置：

```ts
import { defineConfig } from 'anl/config';

export default defineConfig({
	saveApiListFolderPath: 'app/apis',
	saveTypeFolderPath: 'app/types',
	mock: {
		mockDir: 'mocks',
		arrayLength: 1,
		maxDepth: 8,
		responseDefaults: {
			code: 10000,
			msg: 'success',
		},
	},
});
```

保留项目原来的 `swaggerConfig` 等配置。每个 `swaggerConfig` 服务也可配置 `mock.arrayLength`、`mock.maxDepth`、`mock.responseDefaults`，覆盖对应全局选项。`responseDefaults` 按字段合并，只覆盖响应根节点已经声明的字段，不增加字段。

所有相对目录均相对于执行命令的项目根目录。`arrayLength` 范围为 1-100，`maxDepth` 范围为 1-30。插件使用的 `mockDir` 必须与生成目录一致。

## 响应类型与生成规则

- 使用 TypeScript Compiler API 解析生成的请求调用及其类型引用。分析时在内存中使用 `serve` 层级解析请求方法重载，从 `RServe<T>` / `ResponseModel<T>` 等返回类型得到 HTTP 响应外壳；不会修改 API 文件。`data` 和 `axios` 层级不影响生成的 HTTP 响应内容。
- 若请求方法本身不包装响应，就按它的返回类型生成。业务响应已经带有相同外壳字段时不重复包装。类型缺失会报错，不会执行请求模块来猜测结果。
- 已识别外壳的宽泛类型字段默认使用 `success: true`、`code: 10000`、`msg/message: 'success'`。已声明的数字 `timestamp` 使用生成时的时间戳。字面量约束优先；其他成功码通过 `responseDefaults` 显式配置。没有声明 `timestamp` 就不会添加它。
- 递归展开接口、类型别名、导入类型、对象、数组、元组、交叉类型、映射类型和有值类型的字典。可选字段尽量展示，`never` 字段不生成。
- 字符串、数字、布尔值默认使用 `@string`、`@integer(0,100)`、`@boolean`。字段名、`@format` 和 `@example` 可辅助判断 UUID、日期、邮箱、URL，不直接照搬示例值。
- `@guid` 用于 UUID/常见字符串 ID。Mock.js 的 `@id` 实际生成身份证号码，不能当作通用 ID 规则。
- 保留单个字面量；字面量联合和枚举用 `@pick([...])` 在合法值中选择。其他联合类型选择第一个非空分支，不混合不同对象分支的字段。
- 数组默认生成一个递归展开的元素，可配置数量；存在 `@maxItems` 时限制数量。字典使用示意键，不能从类型推断业务键之间的关联。

## 文件保护与限制

- 默认根据“请求方法 + 归一化 URL”查找整个 mock 目录中的已有接口，即使文件名不同、路径参数叫 `:id` 而不是 `:code`，也会跳过。相同目标文件和根目录下同名旧文件同样受保护。
- `--overwrite` 优先原地更新已有文件，兼容旧的根目录平铺布局；不清空目录、不删除旧接口文件，不改写其他服务子目录中的冲突文件。多个候选文件或所选服务路由冲突时，在写入前报错。
- 插件无法按上游服务区分相同方法和路径，服务目录不提供路由隔离。先解决冲突再生成。mock 目录内的符号链接会被拒绝，以免越界扫描或覆盖。
- `unknown` / 无结构的值只能生成 `null`，`Record<string, unknown>` 只能生成 `{}`。例如无法从这个类型推断出 `en/zh` 或 `id/status` 字段，需要补充类型或手工完善 mock。
- 循环引用、最大深度和单接口 10000 个展开节点的上限会截断输出并提示；截断处可能需要人工补全。字符串模式等无法安全推导的结构会提供占位和警告。
- 这里只生成 JSON 模板，不构建流、文件响应或业务场景。数组间的 ID 关联、标签与颜色映射、成功码语义等不能仅凭 TypeScript 类型确定。

## 查看生成警告

```bash
anl mock -S agent --log-level verbose
```

`field(s) need review` 统计的是字段位置，不是失败接口数。详细输出包含接口名、字段路径和原因；例如 `dictionary values have no inferable structure; emitted {}` 表示当前声明是没有具体结构的字典，`unknown ... emitted null` 表示值类型未知。这些警告不会阻止其他字段或接口生成。

增大 `maxDepth` 只对 `maximum depth ... reached` 有帮助，不能补足 `unknown` 的结构，也不能解除循环引用。固定结构应完善类型定义后重新生成；动态 JSON 则需要手工完善 mock。

`generated` 是新建文件数，`overwritten` 是显式覆盖数，`skipped` 是保留已有文件数。诊断先于文件跳过判断收集，因此已跳过接口仍可能出现字段警告；仅查看警告不需要加 `--overwrite`。后续要更新已有文件时，再确认使用该选项。

生成后通过上述 `npm run mock:server` 或项目已有的 `npm run mock` 启动插件。

Mock.js 语法参考：[数据模板和占位符规范](https://github.com/nuysoft/Mock/wiki/Syntax-Specification)、[基础类型](https://github.com/nuysoft/Mock/wiki/Basic)、[GUID 与身份证号](https://github.com/nuysoft/Mock/wiki/Miscellaneous)。
