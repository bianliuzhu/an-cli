# Installation

## Global Installation

```bash
$ npm install anl -g
```

```bash
$ yarn global add anl
```

```bash
$ pnpm add -g anl
```

### Global Usage

After global installation, use `anl [type | mock | lint | git | skill]` from the root directory of the project you want to work on.

## Project Installation

```bash
$ npm install anl -D
```

```bash
$ yarn add anl --dev
```

```bash
$ pnpm add anl -D
```

### Project Usage

Add these commands to the `scripts` field of `package.json`, preserving existing project scripts:

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

Open a terminal in the project root directory and run `npm run api` to execute the `anl type` command.

### Generate and Serve Mocks

Generate the API files and declarations first, then run `npm run mock:generate` to select services, or `npm run mock:generate -- -S growth` to select a service explicitly. Replace `growth` with an actual service name.

Generating files does not require a server plugin. To serve mock responses over HTTP, run `npm install -D mock-service-plugin` in the consuming project. See [mock Command and Plugin Installation](en/anl-mock) for pnpm/Yarn alternatives, the package download link and `startServer` setup. The generator does not start a server or overwrite an existing `npm run mock` script.
