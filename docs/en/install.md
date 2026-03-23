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

After global installation, the `anl` command will be injected into the system environment variables, so you can use the tool by typing `anl [type | git | skill]` in any terminal

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

You can add the following startup commands in the `scripts` field of `package.json`:

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

Open a terminal in the project root directory and run `npm run api` to execute the `anl type` command
