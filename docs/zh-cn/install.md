# 安装

## 全局安装

```bash
$ npm install anl -g
```

```bash
$ yarn global add anl
```

```bash
$ pnpm add -g anl
```

### 全局使用

全局安装后，可以通过 `anl [type | mock | lint | git | skill]` 使用该工具。请先切换到需要操作的项目根目录。

## 项目安装

```bash
$ npm install anl -D
```

```bash
$ yarn  add anl --dev
```

```bash
$ pnpm add anl -D
```

### 项目使用

可以在 `package.json` 的 `scripts` 字段中增加以下命令，保留项目原有脚本：

```json
{
	"name": "demo-package.json",
	"private": true,
	"version": "0.0.0",
	"type": "module",
	"scripts": {
		"format": "prettier 'src/**/*.{js,jsx,ts,tsx}' --write --config .prettierrc.mjs",
		"api": "anl type && pnpm run format",
		"mock:generate": "anl mock",
		"lint:init": "anl lint",
		"git": "anl git",
		"skill": "anl skill"
	}
}
```

在项目根目录开启终端，运行 `npm run api` 即可执行 `anl type` 命令。

### 生成并使用 mock

先生成 API 和类型声明，再运行 `npm run mock:generate` 选择服务，或使用 `npm run mock:generate -- -S growth` 指定服务。`growth` 替换为项目实际的服务名称。

生成文件不需要安装服务插件；需要通过 HTTP 提供 mock 响应时，在用户项目中执行 `npm install -D mock-service-plugin`。pnpm/Yarn 安装方式、插件下载地址及 `startServer` 启动步骤见 [mock 命令与插件安装](zh-cn/anl-mock)。生成器不会自动启动服务器，也不会覆盖项目已有的 `npm run mock` 脚本。
