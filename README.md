# an-cli

[简体中文](./README.zh.md) | English | [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | [Русский](./README.ru.md) | [日本語](./README.jp.md)

# Overview

> an-cli is a frontend command-line tool that includes the following commands:
>
> - `anl type` command: A command-line tool that automatically generates TypeScript type definitions and API request functions based on Swagger JSON.
> - `anl lint` command: Generates eslint, stylelint, prettier, commitLint, and VSCode related configurations for React or Vue projects
> - `anl git` command: Generates git local configuration with optional features: gitflow standard branch creation, git commit messages subject, and git custom command configuration

# Features

- `anl type`
  - 🚀 Automatically parses Swagger JSON documentation
  - 📦 Generates TypeScript type definition files
  - 🔄 Generates type-safe API request functions
  - 🎯 Supports path parameters, query parameters, and request body
  - 📝 Automatically generates enum type definitions
  - 🎨 Supports code formatting
  - ⚡️ Supports file upload
  - 🛠 Configurable code generation options

- `anl lint`
  - 🔍 One-click configuration for various lint tools
  - 🎨 Automated ESLint configuration
  - 🎯 Prettier formatting configuration
  - 🔄 CommitLint commit standards
  - 📦 VSCode editor configuration

- `anl git`
  - 🔍 Multiple optional features for installation
  - 🎨 Standard git flow branch creation
  - 🎯 Automatic subject setting that complies with CommitLint commit standards
  - 🔄 Provides git custom command configuration and entry points
  - 📦 Automated generation with zero configuration

# Installation

> [!NOTE]
> Requires global installation

```bash
$ npm install anl -g
```

```bash
$ yarn global add anl
```

```bash
$ pnpm add -g anl
```

# Usage

> [!TIP]
>
> 1. If you're using it for the first time and unsure about the results, it's recommended to execute the command first, observe what changes occur in the project, then combine with the documentation to further modify the configuration and regenerate until you achieve your ideal setup
> 2. Or follow the steps below step by step for results
> 3. Please execute `anl type`, `anl lint`, `anl git` commands in the project root directory

## `anl type` Command Usage

- **First time** executing the `anl type` command will automatically create a configuration file named `an.config.json` in the _project root directory_ (can also be created manually) to initialize the configuration template.

- When executing the `anl type` command, it will look for the `an.config.json` configuration file in the user's project root directory, read its configuration information, and generate corresponding axios encapsulation, configuration, interface list, interface requests, and TS types for each interface request parameters and responses

- Configuration items in the configuration file can be freely modified

- About the `an.config.json` configuration file
  - The configuration file must be in the project root directory

  - The configuration file name cannot be changed

  - For specific parameter descriptions, see [Configuration File Details](#configuration-file-details)

- Update the configuration file according to your needs, then execute the `anl type` command again, and it will generate corresponding type information according to the specified configuration information in the configuration file

- If files like 'config.ts', 'error-message.ts', 'fetch.ts', 'api-type.d.ts' exist, they will not be regenerated

> [!NOTE]
>
> If you're unclear about these configurations, you can first execute the anl type command to generate the types, then check the project directory, combine with the configuration item descriptions, adjust the configuration items, and regenerate to gradually verify the role of configuration items and complete the final configuration

### Usage Method

```bash
$ anl type
```

### Configuration File Details

#### Configuration File Example

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

#### Configuration Item Descriptions

| Configuration Item       | Type                                  | Required | Description                                                                                                                                                                                                |
| ------------------------ | ------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| saveTypeFolderPath       | string                                | Yes      | Type definition file save path                                                                                                                                                                             |
| saveApiListFolderPath    | string                                | Yes      | API request function file save path                                                                                                                                                                        |
| saveEnumFolderPath       | string                                | Yes      | Enum data file save path                                                                                                                                                                                   |
| importEnumPath           | string                                | Yes      | Enum import path (path referenced by enum files in apps/types/models/\*.ts)                                                                                                                                |
| swaggerJsonUrl           | string                                | Yes      | Swagger JSON documentation address                                                                                                                                                                         |
| requestMethodsImportPath | string                                | Yes      | Request method import path                                                                                                                                                                                 |
| dataLevel                | 'data' \| 'serve' \| 'axios'          | Yes      | Interface return data level                                                                                                                                                                                |
| formatting               | object                                | No       | Code formatting configuration                                                                                                                                                                              |
| headers                  | object                                | No       | Request header configuration                                                                                                                                                                               |
| includeInterface         | Array<{path: string, method: string}> | No       | Included interfaces: The interface list file specified by `saveApiListFolderPath` will only include interfaces in the list, mutually exclusive with `excludeInterface` field                               |
| excludeInterface         | Array<{path: string, method: string}> | No       | Excluded interfaces: The interface list file specified by `saveApiListFolderPath` will not include interfaces in this list, mutually exclusive with `includeInterface`                                     |
| publicPrefix             | string                                | No       | Common prefix on url path, e.g.: api/users, api/users/{id}, api is the common prefix                                                                                                                       |
| erasableSyntaxOnly       | boolean                               | Yes      | Align with tsconfig.json `compilerOptions.erasableSyntaxOnly`. When `true`, generates const objects instead of enums (type-only syntax). Default: `false`                                                  |
| parameterSeparator       | string                                | No       | Separator used between path segments and parameters when generating API names and type names. For example, `/users/{userId}/posts` with separator `'_'` generates `users_userId_posts_GET`. Default: `'_'` |

#### Configuration Items and Generated Files Correspondence

> File structure is generated based on configuration file, marked **uncontrolled** indicates: The folder and its files are automatically generated and not controlled by configuration items

```
project/
├── apps/
│   ├── types/               		# Specified by saveTypeFolderPath configuration item
│   │   ├── models/          				# All type definition files (excluding enum types) uncontrolled
│   │   ├── connectors/      				# API type definitions (interface definition files) uncontrolled
│   └── api/                 		# Request files: Specified by saveApiListFolderPath configuration item
│   │    └── index.ts        				# API request function list uncontrolled
│   │    └── api-type.d.ts      		# Request type definition file uncontrolled
│   │    └── config.ts       				# Request, response interceptor, request configuration uncontrolled
│   │    └── error-message.ts   		# System-level error messages uncontrolled
│   │    ├── fetch.ts        				# Axios request encapsulation, can be replaced with fetch uncontrolled
│   └── enums/               		# Enum data type definitions: Specified by saveEnumFolderPath configuration item
```

### Generated Code Examples

#### Interface Type Definition

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

#### API Request Function

```typescript
import { GET } from './fetch';

/**
 * Get user details
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

### Feature Descriptions

#### Type Parsing

- Supports all OpenAPI 3.0 specification data types
- Automatically handles complex nested types
- Supports arrays, objects, enums, and other types
- Automatically generates interface comments

#### Enum Generation

The tool supports two enum generation modes, controlled by the `erasableSyntaxOnly` configuration:

**Traditional Enum Mode** (`erasableSyntaxOnly: false`, default):

```typescript
export enum Status {
	Success = 'Success',
	Error = 'Error',
	Pending = 'Pending',
}
```

**Const Object Mode** (`erasableSyntaxOnly: true`):

```typescript
export const Status = {
	Success: 'Success',
	Error: 'Error',
	Pending: 'Pending',
} as const;

export type StatusType = (typeof Status)[keyof typeof Status];
```

> **Why use const object mode?**
> When TypeScript's `compilerOptions.erasableSyntaxOnly` is set to `true`, the code can only use type-erasable syntax. Traditional `enum` generates runtime code, while const objects are type-only and get completely erased during compilation. This ensures compatibility with build tools that require type-only syntax.

**Usage in types:**

```typescript
// Traditional enum mode
interface User {
	status: Status; // Use enum as type directly
}

// Const object mode
interface User {
	status: StatusType; // Use the generated type with 'Type' suffix
}
```

#### File Upload

When file upload types are detected, corresponding request headers are automatically added:

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

#### Error Handling

The tool has built-in comprehensive error handling mechanisms:

- Parse error prompts
- Type generation failure warnings
- File write exception handling

#### Interface Filtering

The tool supports filtering interfaces to be generated through configuration:

1. Include specific interfaces
   - Specify interfaces to be generated through the `includeInterface` configuration item
   - Only interfaces specified in the configuration will be generated
   - Configuration format is an object array containing `path` and `method`

2. Exclude specific interfaces
   - Specify interfaces to be excluded through the `excludeInterface` configuration item
   - All interfaces except those specified in the configuration will be generated
   - Configuration format is an object array containing `path` and `method`

Example configuration: This configuration is in `an.config.json`

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

Note: `includeInterface` and `excludeInterface` cannot be used simultaneously. If both are configured, `includeInterface` will be prioritized.

### Notes

1. Ensure the Swagger JSON documentation address is accessible
2. Paths in the configuration file need to be relative to the project root directory
3. Generated files will overwrite existing files with the same name
4. It's recommended to add generated files to version control

### Common Issues

1. Generated type file formatting fails
   - Check if prettier is installed
   - Confirm if there's a prettier configuration file in the project root directory

2. Request function import path error
   - Check if the requestMethodsImportPath configuration is correct
   - Confirm if the request method file exists

# `anl lint` Command Usage

> Provides **interactive multi-select** configuration for various lint tools in frontend projects, including:
>
> - ESLint - JavaScript/TypeScript code linting
> - Stylelint - CSS/SCSS/Less style linting
> - Prettier - Code formatting
> - CommitLint - Git commit message standards
> - VSCode - Editor configuration

### Usage Method

```bash
$ anl lint
```

After executing the command, an interactive multi-select interface will appear where you can choose the tools to install:

```
? Select the linting tools to install (multi-select):
❯◯ ESLint - JavaScript/TypeScript linter
 ◯ Stylelint - CSS/SCSS/Less linter
 ◯ Commitlint - Git commit message linter
 ◯ Prettier - Code formatter
 ◯ VSCode - Editor settings
```

Use **spacebar** to select/deselect, **Enter** to confirm.

### Configuration Details

#### 1. ESLint Configuration

- Automatically installs required dependencies
- Supports React/Vue frameworks (you'll be prompted to choose a framework if selected)
- Automatically generates `.eslintrc.js` and `.eslintignore`
- Integrates TypeScript support

#### 2. Stylelint Configuration

- Automatically installs stylelint related dependencies
- Supports Less/Sass preprocessors (you'll be prompted to choose a preprocessor if selected)
- Generates `.stylelintrc.js` configuration file
- Integrates Prettier support

#### 3. Prettier Configuration

- Automatically installs prettier related dependencies
- Generates `.prettierrc.js` configuration file
- Default configuration includes:
  - Line width: 80
  - Tab indentation
  - Use single quotes
  - Arrow function parentheses
  - Other code style standards

#### 4. CommitLint Configuration

- Installs commitlint related dependencies
- Configures husky git hooks
- Generates `commitlint.config.js`
- Standardizes git commit messages

#### 5. VSCode Configuration

- Creates `.vscode/settings.json`
- Configures editor auto-formatting
- Sets default formatting tools
- Supports updating existing configuration files

### Usage Examples

1. **Install ESLint and Prettier Only**
   - Select ESLint and Prettier
   - If ESLint is selected, you'll be prompted to choose a framework (React/Vue)
   - After installation, your project will have `.eslintrc.js` and `.prettierrc.js`

2. **Full Configuration**
   - Select all options
   - Complete the framework and preprocessor selection prompts
   - Your project will have a complete code standards system configured

# `anl git` Command

### Feature Overview

- Through interactive multi-selection, applies the following Git capabilities to the current repository:
  - gitflow standard branch creation
    - Copies `.gitscripts/`, `.gitconfig`, `.commit-type.cjs` to the project (only when missing)
    - Adds executable permissions to `.gitscripts/random-branch.sh`
    - Executes `git config --local include.path ../.gitconfig`
  - Automatic commit subject setting
    - Copies `.githooks/commit-msg` and sets it as executable
    - Executes `git config core.hooksPath .githooks`
  - Custom git commands
    - Adds `.gitattributes` to the project (only when missing)

### Usage Method

```bash
$ anl git
```

Select one or more features in the prompts. Files are only created when they don't exist; existing files are preserved.

### Notes

- Please run within a Git repository.
- If automatically executed git config fails, please execute manually:

```bash
git config --local include.path ../.gitconfig
git config core.hooksPath .githooks
```

# License

ISC License

# Contributing

Welcome to submit [Issues](https://github.com/bianliuzhu/an-cli/issues) and [Pull Requests](https://github.com/bianliuzhu/an-cli/pulls)!
