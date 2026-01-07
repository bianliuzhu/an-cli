# an-cli

[简体中文](./README.zh.md) | [English](./README.md) | Español | [العربية](./README.ar.md) | [Français](./README.fr.md) | [Русский](./README.ru.md) | [日本語](./README.jp.md)

# Descripción General de Funciones

> an-cli es una herramienta de línea de comandos para frontend que incluye los siguientes comandos:
>
> - Comando `anl type`: Herramienta de línea de comandos que genera automáticamente definiciones de tipos TypeScript y funciones de solicitud API basadas en Swagger JSON.
> - Comando `anl lint`: Genera configuraciones de eslint, stylelint, prettier, commitLint y VSCode para proyectos React o Vue.
> - Comando `anl git`: Genera configuración local de git con funciones opcionales: creación de ramas estándar gitflow, temas de mensajes git commit y configuración de comandos personalizados de git.

# Características

- `anl type`
  - 🚀 Análisis automático de documentos Swagger JSON
  - 📦 Generación de archivos de definición de tipos TypeScript
  - 🔄 Generación de funciones de solicitud API con seguridad de tipos
  - 🎯 Soporte para parámetros de ruta, parámetros de consulta y cuerpo de solicitud
  - 📝 Generación automática de definiciones de tipos enum
  - 🎨 Soporte para formateo de código
  - ⚡️ Soporte para carga de archivos
  - 🛠 Opciones de generación de código configurables
  - 🌐 Soporte para configuración de múltiples servidores Swagger
  - 🔧 Soporte para métodos HTTP como OPTIONS, HEAD, SEARCH

- `anl lint`
  - 🔍 Configuración de varias herramientas lint con un solo clic
  - 🎨 Automatización de configuración ESLint
  - 🎯 Configuración de formateo Prettier
  - 🔄 Especificaciones de commits CommitLint
  - 📦 Configuración del editor VSCode

- `anl git`
  - 🔍 Instalación opcional de múltiples funciones
  - 🎨 Creación de ramas estándar git flow
  - 🎯 Configuración automática de temas que cumplen con las especificaciones CommitLint
  - 🔄 Proporciona configuración de comandos personalizados de git y punto de entrada
  - 📦 Generación automatizada con 0 configuración

# Instalación

> [!NOTE]
> Requiere instalación global

```bash
$ npm install anl -g
```

```bash
$ yarn global add anl
```

```bash
$ pnpm add -g anl
```

# Instrucciones de Uso

> [!TIP]
>
> 1. Si es la primera vez que lo usas y no estás seguro de qué resultados producirá, se recomienda ejecutar primero el comando, observar qué cambios ocurren en el proyecto y luego, combinando con la documentación, modificar la configuración y generar nuevamente hasta alcanzar el resultado deseado.
> 2. O sigue los pasos a continuación paso a paso para obtener resultados.
> 3. Por favor, ejecuta los comandos `anl type`, `anl lint` y `anl git` en el directorio raíz del proyecto.

## Instrucciones de Uso del Comando `anl type`

- La **primera vez** que ejecutes el comando `anl type`, se creará automáticamente en el _directorio raíz del proyecto_ un archivo de configuración llamado `an.config.json` (también puedes crearlo manualmente) con una plantilla de configuración inicializada.

- Al ejecutar el comando `anl type`, buscará el archivo de configuración `an.config.json` en el directorio raíz del proyecto del usuario, leerá su información de configuración y generará el correspondiente wrapper de axios, configuración, lista de interfaces, solicitudes de interfaz y tipos TS de parámetros y respuestas para cada solicitud de interfaz.

- Los elementos de configuración en el archivo de configuración se pueden modificar libremente.

- Acerca del archivo de configuración `an.config.json`
  - El archivo de configuración debe estar en el directorio raíz del proyecto
  - El nombre del archivo de configuración no se puede cambiar
  - Para descripciones detalladas de parámetros, consulta [Explicación Detallada del Archivo de Configuración](#explicación-detallada-del-archivo-de-configuración)

- Actualiza el archivo de configuración según tus necesidades y luego ejecuta nuevamente el comando `anl type`, generará según la información de configuración especificada en el archivo de configuración, generando la información de tipo correspondiente.

- Si los archivos 'config.ts', 'error-message.ts', 'fetch.ts', 'api-type.d.ts' existen, no se generarán nuevamente.

-

> [!NOTE]
>
> Si no estás seguro de estas configuraciones, puedes ejecutar primero el comando anl type para generar los tipos, luego revisar el directorio del proyecto, combinar con las descripciones de los elementos de configuración, ajustar los elementos de configuración, generar nuevamente y verificar gradualmente el efecto de los elementos de configuración para completar la configuración final.

### Método de Uso

```bash
$ anl type
```

### Explicación Detallada del Archivo de Configuración

#### Ejemplo de Archivo de Configuración

**Configuración de un solo servidor Swagger:**

```json
{
	"saveTypeFolderPath": "apps/types",
	"saveApiListFolderPath": "apps/api/",
	"saveEnumFolderPath": "apps/enums",
	"importEnumPath": "../../enums",
	"requestMethodsImportPath": "./fetch",
	"dataLevel": "serve",
	"parameterSeparator": "_",
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	},
	"swaggerConfig": {
		"url": "https://generator3.swagger.io/openapi2.json",
		"apiListFileName": "index.ts",
		"publicPrefix": "/api",
		"modulePrefix": "/gateway",
		"dataLevel": "serve",
		"parameterSeparator": "_",
		"headers": {
			"Authorization": "Bearer token"
		},
		"includeInterface": [
			{
				"path": "/api/user",
				"method": "get"
			}
		]
	},
	"enmuConfig": {
		"erasableSyntaxOnly": false,
		"varnames": "enum-varnames",
		"comment": "enum-descriptions"
	}
}
```

**Configuración de múltiples servidores Swagger:**

```json
{
	"saveTypeFolderPath": "apps/types",
	"saveApiListFolderPath": "apps/api/",
	"saveEnumFolderPath": "apps/enums",
	"importEnumPath": "../../enums",
	"requestMethodsImportPath": "./fetch",
	"dataLevel": "serve",
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	},
	"parameterSeparator": "_",
	"enmuConfig": {
		"erasableSyntaxOnly": false,
		"varnames": "enum-varnames",
		"comment": "enum-descriptions"
	},
	"swaggerConfig": [
		{
			"url": "https://generator3.swagger.io/openapi1.json",
			"apiListFileName": "op.ts",
			"modulePrefix": "/forward",
			"dataLevel": "serve",
			"parameterSeparator": "_",
			"headers": {},
			"includeInterface": [
				{
					"path": "/op/trade/order/queryPage",
					"method": "post"
				}
			]
		},
		{
			"url": "https://generator3.swagger.io/openapi2.json",
			"apiListFileName": "index.ts",
			"publicPrefix": "/api",
			"dataLevel": "data",
			"headers": {}
		}
	]
}
```

#### Descripción de Elementos de Configuración

| Elemento de Configuración          | Tipo                                  | Requerido | Descripción                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------- | ------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| saveTypeFolderPath                 | string                                | Sí        | Ruta de guardado de archivos de definición de tipos                                                                                                                                                                                                                                                                                                                                                |
| saveApiListFolderPath              | string                                | Sí        | Ruta de guardado de archivos de funciones de solicitud API                                                                                                                                                                                                                                                                                                                                         |
| saveEnumFolderPath                 | string                                | Sí        | Ruta de guardado de archivos de datos enum                                                                                                                                                                                                                                                                                                                                                         |
| importEnumPath                     | string                                | Sí        | Ruta de importación de enum (ruta de referencia de archivos enum en apps/types/models/\*.ts)                                                                                                                                                                                                                                                                                                       |
| swaggerJsonUrl                     | string                                | No        | Dirección del documento Swagger JSON (migrado a `swaggerConfig`, conservado para compatibilidad con configuración antigua) **Este campo se eliminará en versiones futuras**                                                                                                                                                                                                                        |
| swaggerConfig                      | object \| Array<object>               | No        | Configuración del servidor Swagger. Un solo servidor se puede completar directamente como objeto, múltiples servidores usan array. Cada servidor puede configurar `url`, `publicPrefix`, `apiListFileName`, `headers`<br />Este campo corresponde a los ejemplos de configuración de un solo servidor Swagger y configuración de múltiples servidores Swagger, desplázate hacia arriba para verlos |
| swaggerConfig[].url                | string                                | Sí        | Dirección del documento Swagger JSON                                                                                                                                                                                                                                                                                                                                                               |
| swaggerConfig[].publicPrefix       | string                                | No        | Prefijo público en la ruta URL, por ejemplo: api/users, api/users/{id}, api es el prefijo público                                                                                                                                                                                                                                                                                                  |
| swaggerConfig[].modulePrefix       | string                                | No        | Prefijo de ruta de solicitud (puede entenderse como nombre de módulo), se agregará automáticamente delante de cada ruta de solicitud API.<br />Por ejemplo: cuando `modulePrefix: "/forward"`,<br />`/publicPrefix/modulePrefix/user` se convierte en `/api/forward/user`                                                                                                                          |
| swaggerConfig[].apiListFileName    | string                                | No        | Nombre del archivo de lista de API, el predeterminado es `index.ts`. Cuando hay múltiples servidores, el nombre de archivo de cada servidor debe ser único                                                                                                                                                                                                                                         |
| swaggerConfig[].headers            | object                                | No        | Configuración de encabezados de solicitud para este servidor                                                                                                                                                                                                                                                                                                                                       |
| swaggerConfig[].dataLevel          | 'data' \| 'serve' \| 'axios'          | No        | Nivel de datos de retorno de interfaz para este servidor. Si no se configura, se usa la configuración global `dataLevel`                                                                                                                                                                                                                                                                           |
| swaggerConfig[].parameterSeparator | '$' \| '\_'                           | No        | Separador utilizado al generar nombres de API y nombres de tipo para este servidor. Si no se configura, se usa la configuración global `parameterSeparator`                                                                                                                                                                                                                                        |
| swaggerConfig[].includeInterface   | Array<{path: string, method: string}> | No        | Lista de interfaces incluidas para este servidor. Si no se configura, se usa la configuración global `includeInterface`                                                                                                                                                                                                                                                                            |
| swaggerConfig[].excludeInterface   | Array<{path: string, method: string}> | No        | Lista de interfaces excluidas para este servidor. Si no se configura, se usa la configuración global `excludeInterface`                                                                                                                                                                                                                                                                            |
| requestMethodsImportPath           | string                                | Sí        | Ruta de importación de métodos de solicitud                                                                                                                                                                                                                                                                                                                                                        |
| dataLevel                          | 'data' \| 'serve' \| 'axios'          | No        | Configuración global de nivel de datos de retorno de interfaz, valor predeterminado: `'serve'`. Cada servidor puede configurarlo individualmente para sobrescribir                                                                                                                                                                                                                                 |
| formatting                         | object                                | No        | Configuración de formateo de código                                                                                                                                                                                                                                                                                                                                                                |
| formatting.indentation             | string                                | No        | Carácter de indentación de código, por ejemplo: `"\t"` o `"  "` (dos espacios)                                                                                                                                                                                                                                                                                                                     |
| formatting.lineEnding              | string                                | No        | Carácter de salto de línea, por ejemplo: `"\n"` (LF) o `"\r\n"` (CRLF)                                                                                                                                                                                                                                                                                                                             |
| headers                            | object                                | No        | Configuración de encabezados de solicitud (migrado a `swaggerConfig`, conservado para compatibilidad con configuración antigua)                                                                                                                                                                                                                                                                    |
| includeInterface                   | Array<{path: string, method: string}> | No        | Interfaces incluidas globalmente: el archivo de lista de interfaces especificado por `saveApiListFolderPath` solo incluirá las interfaces en la lista, es mutuamente excluyente con el campo `excludeInterface`. Cada servidor puede configurarlo individualmente para sobrescribir                                                                                                                |
| excludeInterface                   | Array<{path: string, method: string}> | No        | Interfaces excluidas globalmente: el texto de lista de interfaces especificado por `saveApiListFolderPath` no incluirá las interfaces en esta lista, es mutuamente excluyente con `includeInterface`. Cada servidor puede configurarlo individualmente para sobrescribir                                                                                                                           |
| publicPrefix                       | string                                | No        | Prefijo público global en la ruta URL (migrado a `swaggerConfig`, conservado para compatibilidad con configuración antigua)                                                                                                                                                                                                                                                                        |
| modulePrefix                       | string                                | No        | Prefijo de ruta de solicitud global (cada servidor puede configurarlo individualmente para sobrescribir)                                                                                                                                                                                                                                                                                           |
| apiListFileName                    | string                                | No        | Nombre del archivo de lista de API global, el predeterminado es `index.ts` (migrado a `swaggerConfig`, conservado para compatibilidad con configuración antigua)                                                                                                                                                                                                                                   |
| enmuConfig                         | object                                | Sí        | Objeto de configuración de enumeración                                                                                                                                                                                                                                                                                                                                                             |
| enmuConfig.erasableSyntaxOnly      | boolean                               | Sí        | Alineado con la opción `compilerOptions.erasableSyntaxOnly` de tsconfig.json. Cuando es `true`, genera objetos const en lugar de enum (solo sintaxis de tipo). Valor predeterminado: `false`                                                                                                                                                                                                       |
| enmuConfig.varnames                | string                                | No        | Nombre del campo en el esquema Swagger que contiene los nombres personalizados de los miembros del enum. Valor predeterminado: `enum-varnames`.                                                                                                                                                                                                                                                    |
| enmuConfig.comment                 | string                                | No        | Nombre del campo en el esquema Swagger que contiene las descripciones de los miembros del enum (se usa para generar comentarios). Valor predeterminado: `enum-descriptions`.                                                                                                                                                                                                                       |
| parameterSeparator                 | '$' \| '\_'                           | No        | Separador utilizado globalmente entre segmentos de ruta y parámetros al generar nombres de API y nombres de tipo. Por ejemplo, `/users/{userId}/posts` con el separador `'_'` genera `users_userId_posts_GET`. Valor predeterminado: `'_'`. Cada servidor puede configurarlo individualmente para sobrescribir                                                                                     |

#### Relación entre Elementos de Configuración y Archivos Generados

> La estructura de archivos se genera según el archivo de configuración. Marcado como **no controlado** indica que: esta carpeta y sus archivos se generan automáticamente y no están controlados por los elementos de configuración

```
project/
├── apps/
│   ├── types/               		# Especificado por el elemento de configuración saveTypeFolderPath
│   │   ├── models/          				# Todos los archivos de definición de tipos (sin incluir tipos enum) no controlado
│   │   ├── connectors/      				# Definiciones de tipos API (archivos de definición de interfaz) no controlado
│   └── api/                 		# Archivos de solicitud: especificado por el elemento de configuración saveApiListFolderPath
│   │    └── index.ts        				# Lista de funciones de solicitud API (servidor único o primer servidor) no controlado
│   │    └── op.ts           				# Archivos de lista de API de otros servidores cuando se usan múltiples servidores no controlado
│   │    └── api-type.d.ts      		# Archivo de definición de tipos de solicitud no controlado
│   │    └── config.ts       				# Solicitud, interceptor de respuesta, configuración de solicitud no controlado
│   │    └── error-message.ts   		# Mensajes de error a nivel de sistema no controlado
│   │    ├── fetch.ts        				# Wrapper de solicitud axios, se puede cambiar a fetch no controlado
│   └── enums/               		# Definición de tipos de datos enum: especificado por el elemento de configuración saveEnumFolderPath
```

### Ejemplos de Código Generado

#### Definición de Tipos de Interfaz

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

#### Función de Solicitud API

```typescript
import { GET } from './fetch';

/**
 * Obtener detalles de usuario
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

### Descripción de Características

#### Prioridad de Configuración

La herramienta admite configuración global y configuración a nivel de servidor, siguiendo estas reglas de prioridad:

**Prioridad: Configuración a nivel de servidor > Configuración global > Valores predeterminados**

Los siguientes elementos de configuración admiten sobrescritura a nivel de servidor de la configuración global:

- `dataLevel`: Nivel de datos de retorno de interfaz
- `parameterSeparator`: Separador para nombres de API y nombres de tipo
- `includeInterface`: Lista de interfaces incluidas
- `excludeInterface`: Lista de interfaces excluidas
- `modulePrefix`: Prefijo de ruta de solicitud
- `publicPrefix`: Prefijo común de URL
- `headers`: Configuración de encabezados de solicitud

**Ejemplo:**

```json
{
	"dataLevel": "serve",
	"parameterSeparator": "_",
	"swaggerConfig": [
		{
			"url": "http://api1.example.com/swagger.json",
			"dataLevel": "data",
			"apiListFileName": "api1.ts"
		},
		{
			"url": "http://api2.example.com/swagger.json",
			"apiListFileName": "api2.ts"
		}
	]
}
```

En la configuración anterior:

- `api1.ts` usa `dataLevel: "data"` (configuración a nivel de servidor)
- `api2.ts` usa `dataLevel: "serve"` (configuración global)
- Ambos servidores usan `parameterSeparator: "_"` (configuración global)

#### Análisis de Tipos

- Soporte para todos los tipos de datos de la especificación OpenAPI 3.0
- Manejo automático de tipos anidados complejos
- Soporte para tipos como arrays, objetos, enums, etc.
- Generación automática de comentarios de interfaz

#### Generación de Enumeraciones

La herramienta admite dos modos de generación de enumeraciones, controlados mediante la configuración `enmuConfig.erasableSyntaxOnly`:

**Modo de enumeración tradicional** (`enmuConfig.erasableSyntaxOnly: false`, valor predeterminado):

```typescript
export enum Status {
	Success = 'Success',
	Error = 'Error',
	Pending = 'Pending',
}
```

**Modo de objeto constante** (`enmuConfig.erasableSyntaxOnly: true`):

```typescript
export const Status = {
	Success: 'Success',
	Error: 'Error',
	Pending: 'Pending',
} as const;

export type StatusType = (typeof Status)[keyof typeof Status];
```

> **¿Por qué usar el modo de objeto constante?**
> Cuando la opción `compilerOptions.erasableSyntaxOnly` de TypeScript está configurada en `true`, el código solo puede usar sintaxis de tipo borrable. Los `enum` tradicionales generan código en tiempo de ejecución, mientras que los objetos constantes son puramente de tipo y se eliminan completamente después de la compilación. Esto garantiza la compatibilidad con herramientas de construcción que requieren sintaxis solo de tipo.

**Uso en tipos:**

```typescript
// Modo de enumeración tradicional
interface User {
	status: Status; // Usar directamente la enumeración como tipo
}

// Modo de objeto constante
interface User {
	status: StatusType; // Usar el tipo generado con sufijo 'Type'
}
```

#### Configuración de Nivel de Datos (dataLevel)

`dataLevel` se utiliza para configurar el nivel de extracción de datos devueltos por la interfaz, admite tres opciones:

1. **`'serve'` (valor predeterminado)**: Extrae el campo `data` devuelto por el servidor

   ```typescript
   // Retorno del servidor: { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   // Retorno de la función: { id: 1, name: 'user' }
   ```

2. **`'data'`**: Extrae el campo `data.data` (adecuado para escenarios de data anidada)

   ```typescript
   // Retorno del servidor: { data: { code: 200, data: { id: 1, name: 'user' } } }
   // Retorno de la función: { id: 1, name: 'user' }
   ```

3. **`'axios'`**: Devuelve el objeto de respuesta axios completo
   ```typescript
   // Retorno del servidor: { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   // Retorno de la función: { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   ```

**Ejemplo de configuración:**

```json
{
	"dataLevel": "serve",
	"swaggerConfig": [
		{
			"url": "http://api1.example.com/swagger.json",
			"dataLevel": "data"
		}
	]
}
```

> **Nota**: La configuración de `dataLevel` a nivel de servidor sobrescribirá la configuración global.

#### Carga de Archivos

Cuando se detecta un tipo de carga de archivo, se añaden automáticamente los encabezados de solicitud correspondientes:

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

#### Formateo de Código

La herramienta admite opciones de formateo de código personalizadas, controladas mediante la configuración `formatting`:

**Ejemplo de configuración:**

```json
{
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	}
}
```

**Explicación de la configuración:**

- `indentation`: Carácter de indentación de código
  - `"\t"`: Usar indentación Tab (predeterminado)
  - `"  "`: Usar indentación de 2 espacios
  - `"    "`: Usar indentación de 4 espacios
- `lineEnding`: Tipo de salto de línea
  - `"\n"`: LF (estilo Linux/macOS, recomendado)
  - `"\r\n"`: CRLF (estilo Windows)

**Nota:** Si Prettier está configurado en el proyecto, el código generado se formateará automáticamente con Prettier, y la configuración `formatting` puede ser sobrescrita por Prettier.

#### Manejo de Errores

La herramienta tiene un mecanismo completo de manejo de errores integrado:

- Mensajes de error de análisis
- Advertencias de fallo en generación de tipos
- Manejo de excepciones de escritura de archivos

#### Filtrado de Interfaces

La herramienta admite filtrado de interfaces a generar mediante configuración:

1. Incluir interfaces específicas
   - Especifica las interfaces a generar mediante el elemento de configuración `includeInterface`
   - Solo se generarán las interfaces especificadas en la configuración
   - El formato de configuración es un array de objetos que contienen `path` y `method`

2. Excluir interfaces específicas
   - Especifica las interfaces a excluir mediante el elemento de configuración `excludeInterface`
   - Se generarán todas las interfaces excepto las especificadas en la configuración
   - El formato de configuración es un array de objetos que contienen `path` y `method`

Ejemplo de configuración: Esta configuración va en `an.config.json`

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

Nota: `includeInterface` y `excludeInterface` no se pueden usar simultáneamente. Si se configuran ambos, se usará `includeInterface` con prioridad.

#### Soporte para Múltiples Servidores Swagger

La herramienta admite la configuración de múltiples servidores Swagger, cada servidor se puede configurar de forma independiente:

- **Un solo servidor**: `swaggerConfig` se puede completar directamente como objeto
- **Múltiples servidores**: `swaggerConfig` usa formato de array, cada servidor debe configurar un `apiListFileName` único

**Cómo funciona:**

- Las API del primer servidor se generan en el `apiListFileName` especificado (el predeterminado es `index.ts`)
- Las API de los servidores posteriores se agregan a sus respectivos archivos `apiListFileName`
- Las definiciones de tipos y enumeraciones se fusionan en una carpeta unificada para evitar duplicados

**Configuración a nivel de servidor:**

Cada servidor admite configuración independiente de las siguientes opciones. Si no se configura, se usa la configuración global:

- `dataLevel` - Nivel de datos de retorno de interfaz
- `parameterSeparator` - Separador para nombres de API y nombres de tipo
- `includeInterface` - Lista de interfaces incluidas
- `excludeInterface` - Lista de interfaces excluidas
- `modulePrefix` - Prefijo de ruta de solicitud

#### Prefijo de Ruta (modulePrefix)

`modulePrefix` se utiliza para agregar automáticamente un prefijo delante de todas las rutas de solicitud API, esto es especialmente útil en los siguientes escenarios:

1. **Escenario de proxy inverso**: Cuando el servicio backend se enruta a través de un proxy inverso
2. **Gateway de API**: Agregar uniformemente un prefijo de gateway delante de la ruta
3. **Configuración de múltiples entornos**: Usar diferentes prefijos de ruta para diferentes entornos

**Ejemplo de uso:**

```json
{
	"swaggerConfig": [
		{
			"url": "http://api.example.com/swagger.json",
			"modulePrefix": "/forward",
			"apiListFileName": "api.ts"
		}
	]
}
```

**Efecto:**

La ruta `/api/user/list` definida en Swagger se generará como:

```typescript
export const apiUserListGet = (params: ApiUserList_GET.Query) => GET<ApiUserList_GET.Response>('/forward/api/user/list', params);
```

**Diferencia con publicPrefix:**

- `publicPrefix`: Se usa para eliminar el prefijo común de la ruta de interfaz (solo afecta al nombre de función generado)
- `modulePrefix`: Se usa para agregar prefijo delante de la ruta de solicitud real (afecta a la URL de solicitud en tiempo de ejecución)

**Ejemplo de configuración:**

```json
{
	"swaggerConfig": [
		{
			"url": "http://api1.example.com/swagger.json",
			"apiListFileName": "api1.ts",
			"publicPrefix": "/api/v1",
			"modulePrefix": "/forward",
			"dataLevel": "serve",
			"parameterSeparator": "_",
			"headers": {
				"Authorization": "Bearer token1"
			},
			"includeInterface": [
				{
					"path": "/api/v1/users",
					"method": "get"
				}
			]
		},
		{
			"url": "http://api2.example.com/swagger.json",
			"apiListFileName": "api2.ts",
			"publicPrefix": "/api/v2",
			"dataLevel": "data",
			"headers": {
				"Authorization": "Bearer token2"
			}
		}
	]
}
```

**Ejemplo de configuración anterior (sin usar el nuevo formato):**

```json
{
	"swaggerConfig": [
		{
			"url": "http://api1.example.com/swagger.json",
			"apiListFileName": "api1.ts",
			"publicPrefix": "/api/v1",
			"headers": {
				"Authorization": "Bearer token1"
			}
		},
		{
			"url": "http://api2.example.com/swagger.json",
			"apiListFileName": "api2.ts",
			"publicPrefix": "/api/v2",
			"headers": {
				"Authorization": "Bearer token2"
			}
		}
	]
}
```

**Notas sobre migración:**

- La configuración antigua (`swaggerJsonUrl`, `publicPrefix`, `headers`) sigue siendo compatible
- La herramienta detectará automáticamente la configuración antigua y sugerirá el método de migración
- Se recomienda migrar a la nueva configuración `swaggerConfig` para obtener mayor flexibilidad

#### Soporte para Métodos HTTP

La herramienta admite los siguientes métodos HTTP:

- `GET` - Obtener recursos
- `POST` - Crear recursos
- `PUT` - Actualizar recursos (reemplazo completo)
- `PATCH` - Actualizar recursos (actualización parcial)
- `DELETE` - Eliminar recursos
- `OPTIONS` - Solicitud de preflight
- `HEAD` - Obtener encabezados de respuesta
- `SEARCH` - Solicitud de búsqueda

Todos los métodos admiten definiciones de tipos seguros para parámetros y respuestas.

### Notas

1. Asegúrate de que la dirección del documento Swagger JSON sea accesible
2. Las rutas en el archivo de configuración deben ser relativas al directorio raíz del proyecto
3. Los archivos generados sobrescribirán archivos existentes con el mismo nombre (pero `config.ts`, `error-message.ts`, `fetch.ts`, `api-type.d.ts` no se sobrescribirán si ya existen)
4. Se recomienda incluir los archivos generados en el control de versiones
5. Al usar múltiples servidores Swagger, asegúrate de que el `apiListFileName` de cada servidor sea único para evitar sobrescritura de archivos
6. Al configurar múltiples servidores, las definiciones de tipos y enumeraciones se fusionarán, y pueden ocurrir conflictos si hay tipos con el mismo nombre de diferentes servidores
7. La configuración a nivel de servidor (`dataLevel`, `parameterSeparator`, `includeInterface`, `excludeInterface`, `modulePrefix`) sobrescribirá la configuración global
8. `includeInterface` y `excludeInterface` no se pueden configurar simultáneamente. Si se configuran ambos, se usará `includeInterface` con prioridad

### Preguntas Frecuentes

1. Fallo en el formateo de archivos de tipos generados
   - Verifica si prettier está instalado
   - Confirma si hay un archivo de configuración de prettier en el directorio raíz del proyecto

2. Error en la ruta de importación de funciones de solicitud
   - Verifica si la configuración de requestMethodsImportPath es correcta
   - Confirma si el archivo de métodos de solicitud existe

3. **¿Cuándo usar `modulePrefix`?**
   - Cuando tu API necesita accederse a través de un proxy inverso o gateway
   - Por ejemplo: Swagger define `/api/user`, pero la solicitud real necesita ser `/gateway/api/user`
   - Simplemente configura `modulePrefix: "/gateway"`

4. **¿Cuál es la diferencia entre `publicPrefix` y `modulePrefix`?**
   - `publicPrefix`: Elimina el prefijo de la ruta de interfaz, solo afecta al nombre de función generado
     - Por ejemplo: `/api/user/list` después de eliminar `/api`, el nombre de función es `userListGet`
   - `modulePrefix`: Agrega prefijo delante de la ruta de solicitud, afecta a la URL de solicitud real
     - Por ejemplo: `/api/user/list` después de agregar `/forward`, la URL de solicitud es `/forward/api/user/list`

5. **¿Cómo configurar diferentes `dataLevel` para múltiples servidores?**

   ```json
   {
   	"dataLevel": "serve",
   	"swaggerConfig": [
   		{
   			"url": "http://old-api.com/swagger.json",
   			"dataLevel": "axios",
   			"apiListFileName": "old-api.ts"
   		},
   		{
   			"url": "http://new-api.com/swagger.json",
   			"apiListFileName": "new-api.ts"
   		}
   	]
   }
   ```

   - `old-api.ts` usa `dataLevel: "axios"`
   - `new-api.ts` usa el `dataLevel: "serve"` global

6. **¿Cómo generar solo interfaces parciales?**
   - Usa la configuración `includeInterface`:
     ```json
     {
     	"swaggerConfig": [
     		{
     			"url": "http://api.com/swagger.json",
     			"includeInterface": [
     				{ "path": "/api/user", "method": "get" },
     				{ "path": "/api/user/{id}", "method": "post" }
     			]
     		}
     	]
     }
     ```
   - O usa `excludeInterface` para excluir interfaces no deseadas

7. **¿Qué hacer si los archivos generados fueron sobrescritos?**
   - Los archivos `config.ts`, `error-message.ts`, `fetch.ts`, `api-type.d.ts` solo se generan la primera vez si no existen
   - Los archivos de lista de API y archivos de tipos se regeneran cada vez
   - Se recomienda incluir los archivos generados en el control de versiones para facilitar la revisión de cambios

# Instrucciones de Uso del Comando `anl lint`

> Proporciona funcionalidad de configuración con un solo clic para varias herramientas lint de proyectos frontend, incluyendo:
>
> - ESLint para verificación de código
> - Prettier para formateo de código
> - CommitLint para especificación de mensajes de commit
> - Configuración del editor VSCode

### Método de Uso

```bash
$ anl lint
```

Después de ejecutar el comando, aparecerá una interfaz de selección múltiple interactiva donde puedes elegir las herramientas a instalar:

```
? Select the linting tools to install (multi-select):
❯◯ ESLint - JavaScript/TypeScript linter
 ◯ Stylelint - CSS/SCSS/Less linter
 ◯ Commitlint - Git commit message linter
 ◯ Prettier - Code formatter
 ◯ VSCode - Editor settings
```

Usa la **barra espaciadora** para seleccionar/deseleccionar, **Enter** para confirmar.

### Detalles de Configuración

#### 1. Configuración ESLint

- Instalación automática de dependencias necesarias
- Soporte para frameworks React/Vue (se te pedirá que elijas un framework si se selecciona)
- Generación automática de `.eslintrc.js` y `.eslintignore`
- Integración de soporte TypeScript

#### 2. Configuración Stylelint

- Instalación automática de dependencias relacionadas con stylelint
- Soporte para preprocesadores Less/Sass (se te pedirá que elijas un preprocesador si se selecciona)
- Generación del archivo de configuración `.stylelintrc.js`
- Integración de soporte Prettier

#### 3. Configuración Prettier

- Instalación automática de dependencias relacionadas con prettier
- Generación del archivo de configuración `.prettierrc.js`
- La configuración predeterminada incluye:
  - Ancho de línea: 80
  - Indentación con Tab
  - Uso de comillas simples
  - Paréntesis en funciones flecha
  - Otras especificaciones de estilo de código

#### 4. Configuración CommitLint

- Instalación de dependencias relacionadas con commitlint
- Configuración de git hooks de husky
- Generación de `commitlint.config.js`
- Estandarización de mensajes git commit

#### 5. Configuración VSCode

- Creación de `.vscode/settings.json`
- Configuración de formateo automático del editor
- Configuración de herramienta de formateo predeterminada
- Soporte para actualización de archivos de configuración existentes

### Ejemplos de Uso

1. **Instalar solo ESLint y Prettier**
   - Selecciona ESLint y Prettier
   - Si se selecciona ESLint, se te pedirá que elijas un framework (React/Vue)
   - Después de la instalación, tu proyecto tendrá `.eslintrc.js` y `.prettierrc.js`

2. **Configuración Completa**
   - Selecciona todas las opciones
   - Completa las selecciones de framework y preprocesador
   - Tu proyecto tendrá un sistema completo de estándares de código configurado

# Comando `anl git`

### Descripción General de Funciones

- A través de selección múltiple interactiva, aplica las siguientes capacidades de Git al repositorio actual:
  - Creación de ramas estándar gitflow
    - Copia `.gitscripts/`, `.gitconfig`, `.commit-type.cjs` al proyecto (solo si faltan)
    - Añade permisos de ejecución a `.gitscripts/random-branch.sh`
    - Ejecuta `git config --local include.path ../.gitconfig`
  - Configuración automática de commit subject
    - Copia `.githooks/commit-msg` y lo hace ejecutable
    - Ejecuta `git config core.hooksPath .githooks`
  - Comandos git personalizados
    - Añade `.gitattributes` al proyecto (solo si falta)

### Método de Uso

```bash
$ anl git
```

En el prompt, selecciona una o más funciones. Los archivos solo se crean si no existen; los archivos existentes se conservan.

### Notas

- Por favor, ejecuta dentro de un repositorio Git.
- Si los comandos git config ejecutados automáticamente fallan, ejecuta manualmente:

```bash
git config --local include.path ../.gitconfig
git config core.hooksPath .githooks
```

# Licencia

ISC License

# Guía de Contribución

¡Bienvenidos a enviar [Issue](https://github.com/bianliuzhu/an-cli/issues) y [Pull Request](https://github.com/bianliuzhu/an-cli/pulls)!
