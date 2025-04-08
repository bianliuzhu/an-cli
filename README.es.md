# an-cli

[English](./README.en.md) | Español | [العربية](./README.ar.md) | [Français](./README.fr.md) | [Русский](./README.ru.md) | [日本語](./README.jp.md) | [简体中文](./README.md)

## Descripción

an-cli es una herramienta de línea de comandos frontend que incluye dos comandos:

[Comando anl type](#comando-anl-type): Una herramienta de línea de comandos que genera automáticamente definiciones de tipos TypeScript y funciones de solicitud de API basadas en Swagger JSON.

Comando `anl lint`: Genera configuraciones relacionadas con eslint, stylelint, prettier, commitLint y VSCode para proyectos React o Vue.

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

```bash
$ npm install anl -g

$ yarn global add anl
```

## Uso

1. Ejecutar el comando

```bash
$ anl type
```

2. Completar la configuración

- La primera vez que ejecute `anl type`, se creará automáticamente un archivo de configuración llamado `an.config.json` en la raíz del proyecto (también puede crearlo manualmente)
- Consulte la descripción de la configuración para obtener detalles sobre los parámetros
- El nombre del archivo de configuración no se puede modificar

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

3. Generar definiciones de tipos TypeScript y funciones de solicitud de API, ejecute el comando nuevamente

```bash
$ anl type
```

## Configuración

| Parámetro                | Tipo                         | Requerido | Descripción                                       |
| ------------------------ | ---------------------------- | --------- | ------------------------------------------------- |
| saveTypeFolderPath       | string                       | Sí        | Ruta para guardar archivos de definición de tipos |
| saveApiListFolderPath    | string                       | Sí        | Ruta para guardar funciones de solicitud API      |
| saveEnumFolderPath       | string                       | Sí        | Ruta para guardar tipos enum                      |
| importEnumPath           | string                       | Sí        | Ruta de importación para tipos enum               |
| swaggerJsonUrl           | string                       | Sí        | URL del documento Swagger JSON                    |
| requestMethodsImportPath | string                       | Sí        | Ruta de importación para métodos de solicitud     |
| dataLevel                | 'data' \| 'serve' \| 'axios' | Sí        | Nivel de datos de respuesta de la API             |
| formatting               | object                       | No        | Configuración de formato de código                |
| headers                  | object                       | No        | Configuración de encabezados de solicitud         |

## Estructura de Archivos Generados

- Esta estructura de archivos se genera según el archivo de configuración
  project/
  ├── apps/
  │ ├── types/
  │ │ ├── models/ # Todos los archivos de definición de tipos (excluyendo enums)
  │ │ ├── connectors/ # Definiciones de tipos API (archivos de interfaz)
  │ │ └── enums/ # Definiciones de tipos enum
  │ └── api/
  │ ├── fetch.ts # Implementación de métodos de solicitud
  │ └── index.ts # Funciones de solicitud API

## Ejemplos de Código Generado

### Archivo de Definición de Tipos

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

### Función de Solicitud API

```typescript
import { GET } from './fetch';

/**
 * Obtener detalles del usuario
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

## Características Detalladas

### Análisis de Tipos

- Soporta todos los tipos de datos del estándar OpenAPI 3.0
- Manejo automático de tipos anidados complejos
- Soporte para arrays, objetos, enums y otros tipos
- Generación automática de comentarios de interfaz

### Carga de Archivos

Cuando se detecta un tipo de carga de archivo, se añade automáticamente el encabezado correspondiente:

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

### Manejo de Errores

La herramienta incluye un mecanismo completo de manejo de errores:

- Mensajes de error de análisis
- Advertencias de fallos en la generación de tipos
- Manejo de excepciones en la escritura de archivos

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

## Problemas Comunes

1. Fallo en el formato de los archivos de tipos generados

   - Verificar si prettier está instalado
   - Confirmar si existe un archivo de configuración de prettier en la raíz del proyecto

2. Error en la ruta de importación de funciones de solicitud
   - Verificar si la configuración de requestMethodsImportPath es correcta
   - Confirmar si existe el archivo de métodos de solicitud

## Guía de Contribución

¡Las Issues y Pull Requests son bienvenidas!

## Licencia

Licencia ISC

# Comando anl lint

### Descripción General

Proporciona la funcionalidad de configurar varias herramientas lint para proyectos frontend con un solo comando, incluyendo:

- Verificación de código con ESLint
- Formateo de código con Prettier
- Estandarización de mensajes de commit con CommitLint
- Configuración del editor VSCode

### Uso

```bash
$ anl lint
```

### Detalles de Configuración

#### 1. Configuración de ESLint

- Instalación automática de dependencias necesarias
- Soporte para frameworks React/Vue
- Generación automática de `.eslintrc.js` y `.eslintignore`
- Integración con soporte TypeScript

#### 2. Configuración de Prettier

- Instalación automática de dependencias de prettier
- Generación del archivo de configuración `.prettierrc.js`
- Configuración predeterminada que incluye:
  - Ancho de línea: 80
  - Indentación con tabulaciones
  - Uso de comillas simples
  - Paréntesis en funciones flecha
  - Otras normas de estilo de código

#### 3. Configuración de CommitLint

- Instalación de dependencias relacionadas con commitlint
- Configuración de git hooks con husky
- Generación de `commitlint.config.js`
- Estandarización de mensajes git commit

#### 4. Configuración de VSCode

- Creación de `.vscode/settings.json`
- Configuración de formato automático del editor
- Configuración de la herramienta de formato predeterminada
- Soporte para actualización de archivos de configuración existentes
