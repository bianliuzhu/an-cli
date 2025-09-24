# an-cli

English | [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | [Русский](./README.ru.md) | [日本語](./README.jp.md) | [简体中文](./README.md)

## Description

an-cli is a frontend command line tool that includes the following two commands:

[anl type command](#anl-type-command): A command-line tool that automatically generates TypeScript type definitions and API request functions based on Swagger JSON.

`anl lint` command: Generates eslint, stylelint, prettier, commitLint, and VSCode related configurations for React or Vue projects.

## Features

- `anl type`
  - 🚀 Automatic parsing of Swagger JSON documentation
  - 📦 Generate TypeScript type definition files
  - 🔄 Generate type-safe API request functions
  - 🎯 Support for path parameters, query parameters, and request body
  - 📝 Automatic generation of enum type definitions
  - 🎨 Support for code formatting
  - ⚡️ Support for file uploads
  - 🛠 Configurable code generation options

- `anl lint`
  - 🔍 One-click configuration for various lint tools
  - 🎨 ESLint configuration automation
  - 🎯 Prettier formatting configuration
  - 🔄 CommitLint submission specifications
  - 📦 VSCode editor configuration

## Installation

> [!NOTE]
>
> Global installation is required

```bash
$ npm install anl -g

$ yarn global add anl
```

## Usage Notes

> [!TIP]
>
> 1. If you are using it for the first time and are unsure about the results, it is recommended to execute the command first, observe what changes will occur in the project, then combine with the documentation to further modify the configuration and generate again until you achieve your desired outcome
> 2. Or follow the steps below one by one, and you will gain understanding

# anl type command

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

3. Generate TypeScript type definitions and API request functions by executing the generation command again

```bash
$ anl type
```

## Configuration Options

| Option                   | Type                                  | Required | Description                                                 |
| ------------------------ | ------------------------------------- | -------- | ----------------------------------------------------------- |
| saveTypeFolderPath       | string                                | Yes      | Type definition file save path                              |
| saveApiListFolderPath    | string                                | Yes      | API request function file save path                         |
| saveEnumFolderPath       | string                                | Yes      | Enum type file save path                                    |
| importEnumPath           | string                                | Yes      | Enum type import path                                       |
| swaggerJsonUrl           | string                                | Yes      | Swagger JSON documentation URL                              |
| requestMethodsImportPath | string                                | Yes      | Request method import path                                  |
| dataLevel                | 'data' \| 'serve' \| 'axios'          | Yes      | Interface return data level                                 |
| formatting               | object                                | No       | Code formatting configuration                               |
| headers                  | object                                | No       | Request header configuration                                |
| includeInterface         | Array<{path: string, method: string}> | No       | Only generate interfaces that match these paths and methods |
| excludeInterface         | Array<{path: string, method: string}> | No       | Skip interfaces that match these paths and methods          |

## Generated File Structure

- This file structure is generated based on the configuration file

project/
├── apps/
│ ├── types/
│ │ ├── models/ # All type definition files (excluding enums)
│ │ ├── connectors/ # API type definitions (interface files)
│ │ └── enums/ # Enum type definitions
│ └── api/
│ ├── fetch.ts # Request method implementation
│ └── index.ts # API request functions

## Generated Code Examples

### Type Definition File

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

## Feature Details

### Type Parsing

- Supports all OpenAPI 3.0 specification data types
- Automatically handles complex nested types
- Supports arrays, objects, enums, and other types
- Automatically generates interface comments

### File Upload

When file upload type is detected, corresponding headers will be automatically added:

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

### Error Handling

The tool has built-in comprehensive error handling mechanisms:

- Parsing error prompts
- Type generation failure warnings
- File writing exception handling

### Interface Filtering

The tool supports filtering interfaces to be generated through configuration:

1. Include specific interfaces
   - Specify interfaces to be generated through the `includeInterface` configuration item
   - Only interfaces specified in the configuration will be generated
   - Configuration format is an array of objects containing `path` and `method`

2. Exclude specific interfaces
   - Specify interfaces to be excluded through the `excludeInterface` configuration item
   - All interfaces except those specified in the configuration will be generated
   - Configuration format is an array of objects containing `path` and `method`

Example configuration:

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

Note: `includeInterface` and `excludeInterface` cannot be used simultaneously. If `includeInterface` is specified, `excludeInterface` will be ignored.

## Development

```bash
# Install dependencies
npm install

# Development mode
Press F5 to debug

# Build
npm run build

# Local link debugging
npm run blink
```

## Important Notes

1. Ensure the Swagger JSON documentation URL is accessible
2. Paths in the configuration file should be relative to the project root directory
3. Generated files will overwrite existing files with the same name
4. It's recommended to include generated files in version control

## Common Issues

1. Generated type file formatting fails
   - Check if prettier is installed
   - Confirm if prettier configuration file exists in the project root

2. Request function import path error
   - Check if requestMethodsImportPath configuration is correct
   - Confirm if the request method file exists

## Contributing

Issues and Pull Requests are welcome!

## License

ISC License

# anl git command

### Feature Overview

- Git features can be applied to the current repository via an interactive prompt:
  - gitflow standard branch creation
    - Copies `.gitscripts/`, `.gitconfig`, `.commit-type.js` to your project (only if missing)
    - Makes `.gitscripts/random-branch.sh` executable
    - Executes `git config --local include.path ../.gitconfig`
  - automatically set commit subject
    - Copies `.githooks/commit-msg` and sets it executable
    - Executes `git config core.hooksPath .githooks`
  - custom git command
    - Adds `.gitattributes` to the project (only if missing)

### Usage

```bash
$ anl git
```

Select one or more features in the prompt. Files are only created if missing; existing files are preserved.

### Notes

- Run inside a Git repository.
- If automatic git config commands fail, execute manually:

```bash
git config --local include.path ../.gitconfig
git config core.hooksPath .githooks
```

# anl lint command

### Feature Overview

Provides one-click configuration functionality for various frontend project lint tools, including:

- ESLint code checking
- Prettier code formatting
- CommitLint commit message specifications
- VSCode editor configuration

### Usage

```bash
$ anl lint
```

### Configuration Details

#### 1. ESLint Configuration

- Automatically installs required dependencies
- Supports React/Vue frameworks
- Automatically generates `.eslintrc.js` and `.eslintignore`
- Integrates TypeScript support

#### 2. Prettier Configuration

- Automatically installs prettier-related dependencies
- Generates `.prettierrc.js` configuration file
- Default configurations include:
  - Line width: 80
  - Tab indentation
  - Use single quotes
  - Arrow function parentheses
  - Other code style specifications

#### 3. CommitLint Configuration

- Installs commitlint-related dependencies
- Configures husky git hooks
- Generates `commitlint.config.js`
- Standardizes git commit messages

#### 4. VSCode Configuration

- Creates `.vscode/settings.json`
- Configures editor auto-formatting
- Sets default formatting tools
- Supports updating existing configuration files
