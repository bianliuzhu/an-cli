# Overview

> an-cli is a frontend command-line tool that includes the following commands:
>
> - `anl type` command: A command-line tool that automatically generates TypeScript type definitions and API request functions based on Swagger JSON.
> - `anl lint` command: Generates eslint, stylelint, prettier, commitLint, and VSCode related configurations for React or Vue projects
> - `anl git` command: Generates git local configuration with optional features: gitflow standard branch creation, git commit messages subject, and git custom command configuration
> - `anl skill` command: Initializes Agent Skill files for AI-assisted development, supporting api-report and api-mock skills

## 工具介绍

- 命令：`anl`
- 读音：/ænl/（安偶）

## Features

- `anl type`
  - 🚀 Automatically parses Swagger JSON documentation
  - 📦 Generates TypeScript type definition files
  - 🔄 Generates type-safe API request functions
  - 🎯 Supports path parameters, query parameters, and request body
  - 📝 Automatically generates enum type definitions
  - 🎨 Supports code formatting
  - ⚡️ Supports file upload
  - 🛠 Configurable code generation options
  - 🌐 Supports multiple Swagger server configurations
  - 🔧 Supports HTTP methods like OPTIONS, HEAD, SEARCH

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

- `anl skill`
  - 🤖 Agent Skill file initialization tool for AI-assisted development
  - 📊 Supports api-report: API change detection report, comparing git diffs and analyzing type changes
  - 🎭 Supports api-mock: Generates MockJS-compatible mock data files based on API definitions
  - 🛠 Supports output to multiple AI tool directories such as Cursor and Claude Code

> [!TIP]
>
> 1. If you're using it for the first time and unsure about the results, it's recommended to execute the command first, observe what changes occur in the project, then combine with the documentation to further modify the configuration and regenerate until you achieve your ideal setup
> 2. Or follow the steps below step by step for results
> 3. Please execute `anl type`, `anl lint`, `anl git` commands in the project root directory

## Next Steps

- [Installation](en/install)
- [type Command](en/anl-type)
- [lint Command](en/anl-lint)
- [git Command](en/anl-git)
- [skill Command](en/anl-skill)

## License

ISC License

## Contributing

Welcome to submit [Issue](https://github.com/bianliuzhu/an-cli/issues) and [Pull Request](https://github.com/bianliuzhu/an-cli/pulls)!
