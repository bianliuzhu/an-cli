# an-cli

[简体中文](./README.zh.md) | [English](./README.md) | Español | [العربية](./README.ar.md) | [Français](./README.fr.md) | [Русский](./README.ru.md) | [日本語](./README.jp.md)

## Descripción

an-cli es una herramienta de línea de comandos para frontend con los siguientes comandos:

> `anl type`: Herramienta CLI que genera automáticamente definiciones de tipos TypeScript y funciones de solicitud de API basadas en un documento Swagger/OpenAPI JSON.

> `anl lint`: Genera configuraciones de ESLint, Stylelint, Prettier, CommitLint y VSCode para proyectos React o Vue.

> `anl git`: Genera configuración local de Git con funciones opcionales como ramas estándar de gitflow, asuntos de mensajes de commit y comandos personalizados de Git.

## Características

- `anl type`
  - 🚀 Analiza automáticamente documentos Swagger JSON
  - 📦 Genera archivos de definición de tipos TypeScript
  - 🔄 Genera funciones de solicitud de API con tipos seguros
  - 🎯 Soporta parámetros de ruta, consulta y cuerpo
  - 📝 Genera automáticamente definiciones de tipos de enumeración
  - 🎨 Soporta formateo de código
  - ⚡️ Soporta carga de archivos
  - 🛠 Opciones de generación configurables

- `anl lint`
  - 🔍 Configuración en un clic de varias herramientas de lint
  - 🎨 Configuración automatizada de ESLint
  - 🎯 Configuración de Prettier
  - 🔄 Convenciones de commit con CommitLint
  - 📦 Configuración del editor VSCode

## Instalación

> Nota
>
> Instalar globalmente

```bash
$ npm install anl -g

$ yarn global add anl
```

## Uso

> Consejo
>
> 1. Si es tu primera vez y no sabes qué ocurrirá, ejecuta el comando primero para observar los cambios en tu proyecto. Luego, con la documentación, ajusta la configuración y vuelve a ejecutar hasta lograr el resultado deseado.
> 2. O sigue los pasos a continuación, uno por uno.

# Comando anl type

## Modo de uso

1. Ejecuta el comando

```bash
$ anl type
```

2. Descripción del archivo de configuración

- La primera vez que ejecutes `anl type`, se creará automáticamente un archivo de configuración llamado `an.config.json` en la raíz del proyecto (también puedes crearlo manualmente).
- Al ejecutar `anl type`, la herramienta buscará `an.config.json` en la raíz del proyecto, lo leerá y generará el wrapper de Axios, configuración, lista de APIs y los tipos de solicitud/respuesta según corresponda.
- Los elementos de configuración del archivo son totalmente editables.

3. Ejemplo de `an.config.json`

- El archivo de configuración debe residir en la raíz del proyecto y no puede moverse.
- El nombre del archivo de configuración no se puede cambiar.
- Para detalles de parámetros, consulta Opciones de configuración.

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

3. Actualiza el archivo de configuración según sea necesario y vuelve a ejecutar `anl type`. La herramienta generará el código de acuerdo a tu configuración.

```bash
$ anl type
```

> Nota
>
> Si no estás seguro sobre estas opciones, ejecuta `anl type` una vez para generar todo, inspecciona la salida en tu proyecto, ajusta las opciones según las explicaciones y vuelve a ejecutar hasta que coincida con lo que deseas.

## Opciones de configuración

| Opción                   | Tipo                                  | Requerido | Descripción                                                            |
| ------------------------ | ------------------------------------- | --------- | ---------------------------------------------------------------------- | --- | ------------------------------ |
| saveTypeFolderPath       | string                                | Sí        | Ruta para guardar archivos de definición de tipos                      |
| saveApiListFolderPath    | string                                | Sí        | Ruta para guardar archivos de funciones de solicitud de API            |
| saveEnumFolderPath       | string                                | Sí        | Ruta para guardar archivos de tipos de enumeración                     |
| importEnumPath           | string                                | Sí        | Ruta de importación para tipos de enumeración                          |
| swaggerJsonUrl           | string                                | Sí        | URL del documento Swagger JSON                                         |
| requestMethodsImportPath | string                                | Sí        | Ruta de importación para métodos de solicitud                          |
| dataLevel                | 'data'                                | 'serve'   | 'axios'                                                                | Sí  | Nivel de datos de la respuesta |
| formatting               | object                                | No        | Configuración de formateo de código                                    |
| headers                  | object                                | No        | Cabeceras de la solicitud                                              |
| includeInterface         | Array<{path: string, method: string}> | No        | Solo generar las interfaces listadas aquí; si se establece, solo estas |
| excludeInterface         | Array<{path: string, method: string}> | No        | Excluir las interfaces listadas aquí; se generarán las demás           |

## Estructura de archivos generados

- La siguiente estructura se genera en base a tu archivo de configuración.

```
project/
├── apps/
│   ├── types/
│   │   ├── models/          # Todas las definiciones de tipos (excluye enums)
│   │   ├── connectors/      # Definiciones de tipos de API (definiciones de interfaces)
│   │   └── enums/           # Definiciones de tipos de enumeración
│   └── api/
│       ├── fetch.ts         # Implementación de métodos de solicitud
│       └── index.ts         # Funciones de solicitud de API
```

## Ejemplos de código generado

### Definiciones de tipos

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

### Función de solicitud de API

```typescript
import { GET } from './fetch';

/**
 * Obtener detalles del usuario
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

## Funcionalidades adicionales

### Análisis de tipos

- Soporta todos los tipos de datos de OpenAPI 3.0
- Maneja automáticamente tipos anidados complejos
- Soporta arreglos, objetos, enums, etc.
- Genera automáticamente comentarios de interfaces

### Carga de archivos

Cuando se detecta un tipo de carga de archivos, se agregan automáticamente los encabezados correspondientes:

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

### Manejo de errores

La herramienta incluye un manejo de errores robusto:

- Mensajes de error de análisis
- Advertencias cuando falla la generación de tipos
- Manejo de excepciones al escribir archivos

### Filtrado de interfaces

Controla qué interfaces se generan mediante la configuración:

1. Incluir interfaces específicas
   - Usa `includeInterface` para especificar las interfaces a generar
   - Solo se generarán las interfaces listadas
   - Formato: arreglo de objetos con `path` y `method`

2. Excluir interfaces específicas
   - Usa `excludeInterface` para especificar interfaces a omitir
   - Se generarán todas las demás interfaces
   - Formato: arreglo de objetos con `path` y `method`

Ejemplo:

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

Nota: `includeInterface` y `excludeInterface` no pueden usarse al mismo tiempo. Si ambos están establecidos, `includeInterface` tiene prioridad.

## Desarrollo

```bash
# Instalar dependencias
npm install

# Modo de desarrollo
Presiona F5 para depurar

# Construcción
npm run build

# Enlace local para depuración
npm run blink
```

## Notas

1. Asegúrate de que la URL del Swagger JSON sea accesible
2. Las rutas del archivo de configuración son relativas a la raíz del proyecto
3. Los archivos generados sobrescribirán archivos existentes con el mismo nombre
4. Se recomienda agregar los archivos generados al control de versiones

## Preguntas frecuentes

1. Fallo al formatear archivos de tipos generados
   - Verifica si Prettier está instalado
   - Asegura que exista un archivo de configuración de Prettier en la raíz

2. Ruta de importación incorrecta en funciones de solicitud
   - Verifica que `requestMethodsImportPath` sea correcta
   - Asegura que el archivo del método de solicitud exista

# Comando anl lint

### Descripción general

Proporciona configuración en un clic para varias herramientas de lint del frontend, incluyendo:

- ESLint para linting de código
- Prettier para formateo de código
- CommitLint para convenciones de mensajes de commit
- Configuración del editor VSCode

### Uso

```bash
$ anl lint
```

### Detalles de configuración

#### 1. ESLint

- Instala automáticamente las dependencias requeridas
- Soporta frameworks React/Vue
- Genera `.eslintrc.js` y `.eslintignore`
- Integra soporte para TypeScript

#### 2. Prettier

- Instala automáticamente dependencias de Prettier
- Genera `.prettierrc.js`
- Configuración por defecto incluye:
  - Ancho de línea: 80
  - Indentación con tabulaciones
  - Comillas simples
  - Paréntesis en funciones flecha
  - Otras reglas de estilo

#### 3. CommitLint

- Instala dependencias de CommitLint
- Configura hooks de git con Husky
- Genera `commitlint.config.js`
- Estandariza los mensajes de commit

#### 4. VSCode

- Crea `.vscode/settings.json`
- Configura formateo automático del editor al guardar
- Establece el formateador por defecto
- Soporta actualización de configuraciones existentes

# Comando anl git

### Descripción general

Aplica las siguientes capacidades de Git al repositorio actual mediante selección múltiple interactiva:

- Creación de ramas estándar gitflow
  - Copia `.gitscripts/`, `.gitconfig`, `.commit-type.js` al proyecto (solo si faltan)
  - Agrega permiso de ejecución a `.gitscripts/random-branch.sh`
  - Ejecuta `git config --local include.path ../.gitconfig`
- Configuración automática del asunto del commit
  - Copia `.githooks/commit-msg` y lo establece como ejecutable
  - Ejecuta `git config core.hooksPath .githooks`
- Comandos personalizados de git
  - Agrega `.gitattributes` al proyecto (solo si falta)

### Uso

```bash
$ anl git
```

Selecciona una o varias funciones en los prompts. Los archivos solo se crean cuando faltan; los existentes se preservan.

### Notas

- Ejecuta dentro de un repositorio Git.
- Si las configuraciones automáticas fallan, ejecútalas manualmente:

```bash
git config --local include.path ../.gitconfig
git config core.hooksPath .githooks
```

# Licencia

Licencia ISC

# Contribuciones

Se aceptan Issues y Pull Requests: https://github.com/bianliuzhu/an-cli
