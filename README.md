# an-cli

[English](./README.en.md) | [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | [Русский](./README.ru.md) | [日本語](./README.jp.md) | 简体中文

前端命令行工具

一个基于 Swagger JSON 自动生成 TypeScript 类型定义和 API 请求函数的命令行工具。

## 功能特点

- 🚀 自动解析 Swagger JSON 文档
- 📦 生成 TypeScript 类型定义文件
- 🔄 生成类型安全的 API 请求函数
- 🎯 支持路径参数、查询参数和请求体
- 📝 自动生成枚举类型定义
- 🎨 支持代码格式化
- ⚡️ 支持文件上传
- 🛠 可配置的代码生成选项

## 安装

```bash
$ npm install anl -g

$ yarn global add anl
```

## 使用方法

1. 执行命令

```bash
$ anl type
```

2. 完善配置项目

- 首次执行 `anl type`, 命令，会在*项目根目录下*, _自动创建_ 以 `an.config.json` 为名的配置文件（手动创建也可以），
- 具体参数说明请看配置项说明
- 配置文件名不可修改

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
	"headers": {}
}
```

3. 生成 TypeScript 类型定义和 API 请求函数，再次执行生成命令即可

```bash
$ anl type
```

## 配置项说明

| 配置项                   | 类型                         | 必填 | 说明                     |
| ------------------------ | ---------------------------- | ---- | ------------------------ |
| saveTypeFolderPath       | string                       | 是   | 类型定义文件保存路径     |
| saveApiListFolderPath    | string                       | 是   | API 请求函数文件保存路径 |
| saveEnumFolderPath       | string                       | 是   | 枚举类型文件保存路径     |
| importEnumPath           | string                       | 是   | 枚举类型导入路径         |
| swaggerJsonUrl           | string                       | 是   | Swagger JSON 文档地址    |
| requestMethodsImportPath | string                       | 是   | 请求方法导入路径         |
| dataLevel                | 'data' \| 'serve' \| 'axios' | 是   | 接口返回数据层级         |
| formatting               | object                       | 否   | 代码格式化配置           |
| headers                  | object                       | 否   | 请求头配置               |

## 生成的文件结构

- 这个文件结构是根据配置文件生成的

```
project/
├── apps/
│   ├── types/
│   │   ├── models/           # 所有类型定义文件（不包含枚举类型）
│   │   ├── connectors/      # API 类型定义（接口定义文件）
│   │   └── enums/           # 枚举类型定义
│   └── api/
│       ├── fetch.ts         # 请求方法实现
│       └── index.ts         # API 请求函数
```

## 生成的代码示例

### 类型定义文件

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

### API 请求函数

```typescript
import { GET } from './fetch';

/**
 * 获取用户详情
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

## 特性说明

### 类型解析

- 支持所有 OpenAPI 3.0 规范的数据类型
- 自动处理复杂的嵌套类型
- 支持数组、对象、枚举等类型
- 自动生成接口注释

### 文件上传

当检测到文件上传类型时，会自动添加对应的请求头：

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

### 错误处理

工具内置了完善的错误处理机制：

- 解析错误提示
- 类型生成失败警告
- 文件写入异常处理

## 开发

```bash
# 安装依赖
npm install

# 开发模式
按 F5 进行调试

# 构建
npm run build

# 本地链接调试
npm run blink
```

## 注意事项

1. 确保 Swagger JSON 文档地址可访问
2. 配置文件中的路径需要是相对于项目根目录的路径
3. 生成的文件会覆盖已存在的同名文件
4. 建议将生成的文件加入版本控制

## 常见问题

1. 生成的类型文件格式化失败

   - 检查是否安装了 prettier
   - 确认项目根目录下是否有 prettier 配置文件

2. 请求函数导入路径错误
   - 检查 requestMethodsImportPath 配置是否正确
   - 确认请求方法文件是否存在

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

ISC License
