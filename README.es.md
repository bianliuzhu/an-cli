# an-cli

[English](./README.en.md) | Español | [العربية](./README.ar.md) | [Français](./README.fr.md) | [Русский](./README.ru.md) | [日本語](./README.jp.md) | [简体中文](./README.md)

## Descripción

an-cli es una herramienta de línea de comandos frontend que incluye dos comandos:

[Comando anl type](#comando-anl-type): Una herramienta de línea de comandos que genera automáticamente definiciones de tipos TypeScript y funciones de solicitud de API basadas en Swagger JSON.

[Comando anl lint](#comando-anl-lint): Genera configuraciones relacionadas con eslint, stylelint, prettier, commitLint y VSCode para proyectos React o Vue.

## Características

- `anl type`

  - 🚀 Análisis automático de documentación Swagger JSON
  - 📦 Genera archivos de definición de tipos TypeScript
  - 🔄 Genera funciones de solicitud de API con seguridad de tipos
  - 🎯 Soporte para parámetros de ruta, consulta y cuerpo de solicitud
  - 📝 Generación automática de definiciones de tipos enum
  - 🎨 Soporte para formateo de código
  - ⚡️ Soporte para carga de archivos
  - 🛠 Opciones configurables de generación de código

- `anl lint`
  - 🔍 Configuración con un solo comando para varias herramientas lint
  - 🎨 Configuración automatizada de ESLint
  - 🎯 Configuración de formato Prettier
  - 🔄 Estándares de commit con CommitLint
  - 📦 Configuración del editor VSCode

## Instalación

> [!NOTE]
>
> Requiere instalación global

```bash
$ npm install anl -g

$ yarn global add anl
```

## Uso

> [!TIP]
>
> 1. Si es la primera vez que lo usa y no está seguro de qué resultados obtendrá, se recomienda ejecutar el comando primero, observar los cambios en el proyecto, y luego consultar la documentación para ajustar la configuración y generar nuevamente hasta alcanzar el resultado deseado
> 2. O siga los pasos a continuación uno por uno para obtener resultados

# Comando anl type

## Uso

1. Ejecutar el comando

```bash
$ anl type
```

2. Explicación de la configuración

- La primera vez que ejecute `anl type`, se creará automáticamente un archivo de configuración llamado `an.config.json` en la raíz del proyecto (también puede crearlo manualmente)
- Al ejecutar el comando `anl type`, buscará el archivo de configuración `an.config.json` en la raíz del proyecto y leerá su información de configuración para generar el encapsulamiento de axios, configuración, lista de interfaces, tipos de solicitud y respuesta
- Los elementos de configuración en el archivo de configuración se pueden modificar libremente

3. Ejemplo de configuración `an.config.json`

- El archivo de configuración debe estar en la raíz del proyecto, no se puede mover
- El nombre del archivo de configuración no se puede cambiar
- Para detalles específicos de los parámetros, consulte [Descripción de la configuración](#descripción-de-la-configuración)

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

3. Actualice el archivo de configuración según sus necesidades, luego ejecute el comando `anl type` nuevamente, y generará la información de tipos correspondiente según la configuración especificada

```bash
$ anl type
```

> [!NOTE]
>
> Si no está seguro de estas configuraciones, puede ejecutar primero el comando anl type para generar los tipos, luego revisar el directorio del proyecto, ajustar los elementos de configuración según la descripción de la configuración, y generar nuevamente hasta alcanzar el resultado deseado

## Descripción de la configuración

| Parámetro                | Tipo                                  | Requerido | Descripción                                       |
| ------------------------ | ------------------------------------- | --------- | ------------------------------------------------- |
| saveTypeFolderPath       | string                                | Sí        | Ruta para guardar archivos de definición de tipos |
| saveApiListFolderPath    | string                                | Sí        | Ruta para guardar funciones de solicitud API      |
| saveEnumFolderPath       | string                                | Sí        | Ruta para guardar tipos enum                      |
| importEnumPath           | string                                | Sí        | Ruta de importación para tipos enum               |
| swaggerJsonUrl           | string                                | Sí        | URL del documento Swagger JSON                    |
| requestMethodsImportPath | string                                | Sí        | Ruta de importación para métodos de solicitud     |
| dataLevel                | 'data' \| 'serve' \| 'axios'          | Sí        | Nivel de datos de respuesta de la API             |
| formatting               | object                                | No        | Configuración de formato de código                |
| headers                  | object                                | No        | Configuración de encabezados de solicitud         |
| includeInterface         | Array<{path: string, method: string}> | No        | Lista de interfaces a incluir en la generación    |
| excludeInterface         | Array<{path: string, method: string}> | No        | Lista de interfaces a excluir de la generación    |

## Estructura de archivos generados

- Esta estructura de archivos se genera según el archivo de configuración

```
project/
├── apps/
│   ├── types/
│   │   ├── models/          # Todos los archivos de definición de tipos (excluyendo enums)
│   │   ├── connectors/      # Definiciones de tipos API (archivos de interfaz)
│   │   └── enums/           # Definiciones de tipos enum
│   └── api/
│       ├── fetch.ts         # Implementación de métodos de solicitud
│       └── index.ts         # Funciones de solicitud API
```

## Ejemplos de código generado

### Archivo de definición de tipos

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

### Función de solicitud API

```typescript
import { GET } from './fetch';

/**
 * Obtener detalles del usuario
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

## Características detalladas

### Análisis de tipos

- Soporta todos los tipos de datos del estándar OpenAPI 3.0
- Manejo automático de tipos anidados complejos
- Soporte para arrays, objetos, enums y otros tipos
- Generación automática de comentarios de interfaz

### Carga de archivos

Cuando se detecta un tipo de carga de archivo, se añade automáticamente el encabezado correspondiente:

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

### Manejo de errores

La herramienta incluye un mecanismo completo de manejo de errores:

- Mensajes de error de análisis
- Advertencias de fallos en la generación de tipos
- Manejo de excepciones en la escritura de archivos

### Filtrado de interfaces

La herramienta permite filtrar las interfaces que se generarán mediante dos opciones de configuración:

1. Incluir interfaces específicas

   - A través del elemento de configuración `includeInterface`
   - Solo se generarán las interfaces especificadas en la configuración
   - El formato de configuración es un array de objetos con `path` y `method`

2. Excluir interfaces específicas
   - A través del elemento de configuración `excludeInterface`
   - Se generarán todas las interfaces excepto las especificadas en la configuración
   - El formato de configuración es un array de objetos con `path` y `method`

Ejemplo de configuración:

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

Nota: `includeInterface` y `excludeInterface` no se pueden usar simultáneamente. Si ambos están configurados, se priorizará `includeInterface`.

## Desarrollo

```bash
# Instalar dependencias
npm install

# Modo desarrollo
Presionar F5 para depurar

# Construir
npm run build

# Enlace local para pruebas
npm run blink
```

## Consideraciones

1. Asegúrese de que la URL del documento Swagger JSON sea accesible
2. Las rutas en el archivo de configuración deben ser relativas a la raíz del proyecto
3. Los archivos generados sobrescribirán los archivos existentes con el mismo nombre
4. Se recomienda incluir los archivos generados en el control de versiones

## Problemas comunes

1. Fallo en el formato de los archivos de tipos generados

   - Verificar si prettier está instalado
   - Confirmar si existe un archivo de configuración de prettier en la raíz del proyecto

2. Error en la ruta de importación de funciones de solicitud
   - Verificar si la configuración de requestMethodsImportPath es correcta
   - Confirmar si existe el archivo de métodos de solicitud

# Comando anl lint

### Descripción general

Proporciona la funcionalidad de configurar varias herramientas lint para proyectos frontend con un solo comando, incluyendo:

- Verificación de código con ESLint
- Formateo de código con Prettier
- Estandarización de mensajes de commit con CommitLint
- Configuración del editor VSCode

### Uso

```bash
$ anl lint
```

### Detalles de configuración

#### 1. Configuración de ESLint

- Instalación automática de dependencias necesarias
- Soporte para frameworks React/Vue
- Generación automática de `.eslintrc.js` y `.eslintignore`
- Integración con soporte TypeScript

#### 2. Configuración de Prettier

- Instalación automática de dependencias prettier
- Generación de archivo de configuración `.prettierrc.js`
- Configuración predeterminada incluye:
  - Ancho de línea: 80
  - Indentación con tabulador
  - Uso de comillas simples
  - Paréntesis en funciones flecha
  - Otras normas de estilo de código

#### 3. Configuración de CommitLint

- Instalación de dependencias commitlint
- Configuración de husky git hooks
- Generación de `commitlint.config.js`
- Estandarización de mensajes de commit git

#### 4. Configuración de VSCode

- Creación de `.vscode/settings.json`
- Configuración de formateo automático del editor
- Establecimiento de herramienta de formateo predeterminada
- Soporte para actualización de configuraciones existentes

## Licencia

Licencia ISC

## Guía de contribución

¡Las Issues y Pull Requests son bienvenidas!
