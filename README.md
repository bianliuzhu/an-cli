# an-cli

[简体中文](./README.zh.md) | English | [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | [Русский](./README.ru.md) | [日本語](./README.jp.md)

## Description

an-cli is a frontend command-line tool with the following commands:

> `anl type`: A CLI tool that automatically generates TypeScript type definitions and API request functions based on a Swagger/OpenAPI JSON document.

> `anl lint`: Generates ESLint, Stylelint, Prettier, CommitLint, and VSCode-related configurations for React or Vue projects.

> `anl git`: Generates local Git setup with optional features like gitflow standard branches, commit message subjects, and custom Git commands.

## Features

- `anl type`
  - 🚀 Automatically parses Swagger JSON documents
  - 📦 Generates TypeScript type definition files
  - 🔄 Generates type-safe API request functions
  - 🎯 Supports path params, query params, and request bodies
  - 📝 Auto-generates enum type definitions
  - 🎨 Supports code formatting
  - ⚡️ Supports file uploads
  - 🛠 Configurable code generation options

- `anl lint`
  - 🔍 One-click setup for various lint tools
  - 🎨 Automated ESLint configuration
  - 🎯 Prettier formatting configuration
  - 🔄 CommitLint commit conventions
  - 📦 VSCode editor configuration

## Installation

> Note
>
> Install globally

```bash
$ npm install anl -g

$ yarn global add anl
```

## Usage

> Tip
>
> 1. If this is your first time and you are unsure what will happen, run the command first to observe the changes in your project. Then combine with the docs to adjust your config, run again, and iterate until you reach your desired result.
> 2. Or simply follow the steps below, one by one.

# anl type Command

## How to Use

1. Run the command

```bash
$ anl type
```

2. Config file overview

- The first time you run `anl type`, a configuration file named `an.config.json` is automatically created in the project root (you can also create it manually).
- When running `anl type`, the tool looks for `an.config.json` in your project root, reads it, and generates the Axios wrapper, config, API list, and request/response types accordingly.
- The config items in the file are fully editable.

3. Example `an.config.json`

- The config file must reside in the project root and cannot be moved.
- The config file name cannot be changed.
- For parameter details, see Config Options.

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
	]
}
```

3. Update the config file as needed, then run `anl type` again. The tool will generate code according to your configuration.

```bash
$ anl type
```

> Note
>
> If you are unsure about these options, just run `anl type` once to generate everything, inspect the output in your project, adjust the options based on the explanations, and run again until it matches what you want.

## Config Options

| Option                   | Type                                  | Required | Description                                                                |
| ------------------------ | ------------------------------------- | -------- | -------------------------------------------------------------------------- |
| saveTypeFolderPath       | string                                | Yes      | Path to save type definition files                                         |
| saveApiListFolderPath    | string                                | Yes      | Path to save API request function files                                    |
| saveEnumFolderPath       | string                                | Yes      | Path to save enum type files                                               |
| importEnumPath           | string                                | Yes      | Import path for enum types                                                 |
| swaggerJsonUrl           | string                                | Yes      | Swagger JSON document URL                                                  |
| requestMethodsImportPath | string                                | Yes      | Import path for request methods                                            |
| dataLevel                | 'data' \| 'serve' \| 'axios'          | Yes      | Response data level                                                        |
| formatting               | object                                | No       | Code formatting configuration                                              |
| headers                  | object                                | No       | Request headers                                                            |
| includeInterface         | Array<{path: string, method: string}> | No       | Only generate interfaces listed here; if set, only these will be generated |
| excludeInterface         | Array<{path: string, method: string}> | No       | Exclude interfaces listed here; others will be generated                   |

## Generated File Structure

- The structure below is generated based on your config file.

```
project/
├── apps/
│   ├── types/
│   │   ├── models/          # All type definitions (excluding enums)
│   │   ├── connectors/      # API type definitions (interface definitions)
│   │   └── enums/           # Enum type definitions
│   └── api/
│       ├── fetch.ts         # Request method implementation
│       └── index.ts         # API request functions
```

## Generated Code Examples

### Type Definitions

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

### API Request Function

```typescript
import { GET } from './fetch';

/**
 * Get user details
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

## Additional Features

### Type Parsing

- Supports all OpenAPI 3.0 data types
- Automatically handles complex nested types
- Supports arrays, objects, enums, etc.
- Auto-generates interface comments

### File Upload

When a file upload type is detected, the corresponding headers are automatically added:

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

### Error Handling

The tool includes robust error handling:

- Parsing error messages
- Warnings when type generation fails
- File write exception handling

### Interface Filtering

Control which interfaces are generated via config:

1. Include specific interfaces
   - Use `includeInterface` to specify interfaces to generate
   - Only interfaces listed will be generated
   - Format: array of objects with `path` and `method`

2. Exclude specific interfaces
   - Use `excludeInterface` to specify interfaces to skip
   - All other interfaces will be generated
   - Format: array of objects with `path` and `method`

Example:

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

Note: `includeInterface` and `excludeInterface` cannot be used at the same time. If both are set, `includeInterface` takes precedence.

## Development

```bash
# Install dependencies
npm install

# Development mode
Press F5 to debug

# Build
npm run build

# Local link for debugging
npm run blink
```

## Notes

1. Ensure the Swagger JSON URL is reachable
2. Paths in the config file are relative to the project root
3. Generated files will overwrite existing files with the same name
4. It is recommended to commit generated files to version control

## FAQ

1. Generated type files fail to format
   - Check if Prettier is installed
   - Ensure there is a Prettier config file in the project root

2. Incorrect import path in request functions
   - Verify the `requestMethodsImportPath` is correct
   - Ensure the request method file exists

# anl lint Command

### Overview

Provides one-click setup for various frontend lint tools, including:

- ESLint code linting
- Prettier code formatting
- CommitLint commit message conventions
- VSCode editor configuration

### Usage

```bash
$ anl lint
```

### Configuration Details

#### 1. ESLint

- Automatically installs required dependencies
- Supports React/Vue frameworks
- Auto-generates `.eslintrc.js` and `.eslintignore`
- Integrates TypeScript support

#### 2. Prettier

- Automatically installs Prettier dependencies
- Generates `.prettierrc.js`
- Default settings include:
  - Print width: 80
  - Tab indentation
  - Single quotes
  - Arrow function parentheses
  - Other style rules

#### 3. CommitLint

- Installs CommitLint dependencies
- Configures Husky git hooks
- Generates `commitlint.config.js`
- Standardizes git commit messages

#### 4. VSCode

- Creates `.vscode/settings.json`
- Configures editor auto-format on save
- Sets default formatter
- Supports updating existing configs

# anl git Command

### Overview

Apply the following Git capabilities to the current repository via interactive multi-select:

- gitflow standard branch creation
  - Copy `.gitscripts/`, `.gitconfig`, `.commit-type.cjs` into the project (only if missing)
  - Add executable permission to `.gitscripts/random-branch.sh`
  - Run `git config --local include.path ../.gitconfig`
- Auto set commit subject
  - Copy `.githooks/commit-msg` and set it executable
  - Run `git config core.hooksPath .githooks`
- Custom git commands
  - Add `.gitattributes` to the project (only if missing)

### Usage

```bash
$ anl git
```

Select one or more features from the prompts. Files are only created when missing; existing files are preserved.

### Notes

- Run inside a Git repository.
- If automatic git config steps fail, run manually:

```bash
git config --local include.path ../.gitconfig
git config core.hooksPath .githooks
```

# License

ISC License

# Contributing

Issues and Pull Requests are welcome: https://github.com/bianliuzhu/an-cli
