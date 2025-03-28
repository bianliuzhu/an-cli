# an-cli

English| [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | [Русский](./README.ru.md) | [日本語](./README.jp.md) | [简体中文](./README.md)

Frontend Command Line Tool

A command-line tool that automatically generates TypeScript type definitions and API request functions based on Swagger JSON.

## Features

- 🚀 Automatic parsing of Swagger JSON documentation
- 📦 Generate TypeScript type definition files
- 🔄 Generate type-safe API request functions
- 🎯 Support for path parameters, query parameters, and request body
- 📝 Automatic generation of enum type definitions
- 🎨 Support for code formatting
- ⚡️ Support for file uploads
- 🛠 Configurable code generation options

## Installation

```bash
$ npm install anl -g

$ yarn global add anl
```

## Usage

1. Execute command

```bash
$ anl type
```

2. Complete configuration

- When executing `anl type` for the first time, a configuration file named `an.config.json` will be automatically created in the project root directory (manual creation is also possible)
- See configuration description for specific parameter details
- Configuration filename cannot be modified

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

3. Generate TypeScript type definitions and API request functions by executing the generation command again

```bash
$ anl type
```

## Configuration Options

| Option                   | Type                         | Required | Description                         |
| ------------------------ | ---------------------------- | -------- | ----------------------------------- |
| saveTypeFolderPath       | string                       | Yes      | Type definition file save path      |
| saveApiListFolderPath    | string                       | Yes      | API request function file save path |
| saveEnumFolderPath       | string                       | Yes      | Enum type file save path            |
| importEnumPath           | string                       | Yes      | Enum type import path               |
| swaggerJsonUrl           | string                       | Yes      | Swagger JSON documentation URL      |
| requestMethodsImportPath | string                       | Yes      | Request method import path          |
| dataLevel                | 'data' \| 'serve' \| 'axios' | Yes      | Interface return data level         |
| formatting               | object                       | No       | Code formatting configuration       |
| headers                  | object                       | No       | Request header configuration        |

## Generated File Structure

- This file structure is generated based on the configuration file
