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

全局安装以后，会在系统环境变量中注入 anl 命令，所有可以在任何终端中 输入 `anl [type | git | skill]` 使用该工具

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

可以在 `package.json` 中 `script` 字段中增加 启动命令如下：

```json
{
	"name": "demo-package.json",
	"private": true,
	"version": "0.0.0",
	"type": "module",
	"scripts": {
		"format": "prettier 'src/**/*.{js,jsx,ts,tsx}' --write --config .prettierrc.mjs",
		"api": "anl type && pnpm run format",
		"git": "anl git"
	}
}
```

在项目根目录开启终端，运行`npm run api` 即可执行 `anl type` 命令
