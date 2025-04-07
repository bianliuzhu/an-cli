# an-cli

English | [Español](./README.es.md) | [العربية](./README.ar.md) | [Français](./README.fr.md) | [Русский](./README.ru.md) | [日本語](./README.jp.md) | [简体中文](./README.md)

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
