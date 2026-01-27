# an-cli

[简体中文](./README.zh.md) | [English](./README.md) | [Español](./README.es.md) | [العربية](./README.ar.md) | Français | [Русский](./README.ru.md) | [日本語](./README.jp.md)


# Aperçu des fonctionnalités

> an-cli est un outil de ligne de commande frontend qui inclut les commandes suivantes :
>
> - Commande `anl type` : Un outil de ligne de commande qui génère automatiquement des définitions de types TypeScript et des fonctions de requête API basées sur Swagger JSON.
> - Commande `anl lint` : Génère les configurations eslint, stylelint, prettier, commitLint et VSCode pour les projets React ou Vue
> - Commande `anl git` : Génère la configuration locale Git avec des fonctionnalités optionnelles : création de branches selon le standard gitflow, thèmes de messages git commit, configuration de commandes git personnalisées

# Caractéristiques

- `anl type`
  - 🚀 Analyse automatique des documents Swagger JSON
  - 📦 Génération de fichiers de définition de types TypeScript
  - 🔄 Génération de fonctions de requête API type-safe
  - 🎯 Support des paramètres de chemin, de requête et de corps
  - 📝 Génération automatique de définitions de types enum
  - 🎨 Support du formatage de code
  - ⚡️ Support du téléchargement de fichiers
  - 🛠 Options de génération de code configurables
  - 🌐 Support de la configuration de plusieurs serveurs Swagger
  - 🔧 Support des méthodes HTTP OPTIONS, HEAD, SEARCH, etc.

- `anl lint`
  - 🔍 Configuration en un clic de divers outils lint
  - 🎨 Configuration ESLint automatisée
  - 🎯 Configuration de formatage Prettier
  - 🔄 Normes de commit CommitLint
  - 📦 Configuration de l'éditeur VSCode

- `anl git`
  - 🔍 Installation optionnelle de plusieurs fonctionnalités
  - 🎨 Création de branches selon le standard git flow
  - 🎯 Configuration automatique de thèmes conformes aux normes CommitLint
  - 🔄 Fournit la configuration et le point d'entrée pour les commandes git personnalisées
  - 📦 Génération automatisée avec configuration zéro

# Installation

> [!NOTE]
> Installation globale requise

```bash
$ npm install anl -g
```

```bash
$ yarn global add anl
```

```bash
$ pnpm add -g anl
```

# Guide d'utilisation

> [!TIP]
>
> 1. Si vous utilisez cet outil pour la première fois et ne savez pas quel sera le résultat, il est recommandé d'exécuter d'abord la commande, d'observer les changements dans le projet, puis de consulter la documentation pour modifier la configuration et la régénérer jusqu'à obtenir le résultat souhaité
> 2. Ou suivez les étapes ci-dessous étape par étape pour obtenir des résultats
> 3. Veuillez exécuter les commandes `anl type`, `anl lint`, `anl git` dans le répertoire racine du projet

## Guide d'utilisation de la commande `anl type`

- Lors de la **première** exécution de la commande `anl type`, un fichier de configuration nommé `an.config.json` sera _automatiquement créé_ dans le _répertoire racine du projet_ (la création manuelle est également possible) avec un modèle de configuration initialisé.

- Lors de l'exécution de la commande `anl type`, le fichier de configuration `an.config.json` dans le répertoire racine du projet utilisateur sera recherché, et ses informations de configuration seront lues pour générer l'encapsulation axios, la configuration, la liste des interfaces, les requêtes d'interface et les types TS de paramètres et réponses pour chaque requête d'interface correspondants

- Les éléments de configuration dans le fichier de configuration peuvent être librement modifiés

- À propos du fichier de configuration `an.config.json`
  - Le fichier de configuration doit être dans le répertoire racine du projet

  - Le nom du fichier de configuration ne peut pas être modifié

  - Pour une explication détaillée des paramètres, voir [Explication détaillée du fichier de configuration](#explication-détaillée-du-fichier-de-configuration)

- Mettez à jour le fichier de configuration selon vos besoins, puis exécutez à nouveau la commande `anl type`, qui générera les informations de type correspondantes selon la configuration spécifiée dans le fichier de configuration

- Si les fichiers 'config.ts', 'error-message.ts', 'fetch.ts', 'api-type.d.ts' existent, ils ne seront pas régénérés

-

> [!NOTE]
>
> Si vous ne comprenez pas ces configurations, vous pouvez d'abord exécuter la commande anl type pour générer les types, puis vérifier le répertoire du projet, ajuster les éléments de configuration en fonction des explications, régénérer, vérifier progressivement le rôle des éléments de configuration et finaliser la configuration

### Méthode d'utilisation

```bash
$ anl type
```

### Explication détaillée du fichier de configuration

#### Exemple de fichier de configuration

**Configuration d'un seul serveur Swagger :**

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

**Configuration de plusieurs serveurs Swagger :**

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
					"path": "/generate",
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

#### Explication des éléments de configuration

| Élément de configuration           | Type                                  | Obligatoire | Description                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------- | ------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| saveTypeFolderPath                 | string                                | Oui         | Chemin de sauvegarde des fichiers de définition de types                                                                                                                                                                                                                                                                                                                                   |
| saveApiListFolderPath              | string                                | Oui         | Chemin de sauvegarde des fichiers de fonctions de requête API                                                                                                                                                                                                                                                                                                                              |
| saveEnumFolderPath                 | string                                | Oui         | Chemin de sauvegarde des fichiers de données enum                                                                                                                                                                                                                                                                                                                                          |
| importEnumPath                     | string                                | Oui         | Chemin d'import enum (chemin des fichiers enum référencés dans apps/types/models/\*.ts)                                                                                                                                                                                                                                                                                                    |
| swaggerJsonUrl                     | string                                | Non         | Adresse du document Swagger JSON (migré vers `swaggerConfig`, conservé pour compatibilité avec les anciennes configurations) **Ce champ sera supprimé dans les versions futures**                                                                                                                                                                                                          |
| swaggerConfig                      | object \| Array<object>               | Non         | Configuration des serveurs Swagger. Un seul serveur peut être directement rempli comme objet, plusieurs serveurs utilisent un tableau. Chaque serveur peut configurer `url`, `publicPrefix`, `apiListFileName`, `headers`<br />Ce champ correspond aux exemples de configuration d'un seul serveur Swagger et de plusieurs serveurs Swagger, veuillez faire défiler vers le haut pour voir |
| swaggerConfig[].url                | string                                | Oui         | Adresse du document Swagger JSON                                                                                                                                                                                                                                                                                                                                                           |
| swaggerConfig[].publicPrefix       | string                                | Non         | Préfixe commun sur le chemin URL, par exemple : api/users, api/users/{id}, api est le préfixe commun                                                                                                                                                                                                                                                                                       |
| swaggerConfig[].modulePrefix       | string                                | Non         | Préfixe de chemin de requête (peut être compris comme nom de module), sera ajouté automatiquement devant chaque chemin de requête API.<br />Par exemple : lorsque `modulePrefix: "/forward"`,<br />`/publicPrefix/modulePrefix/user` devient `/api/forward/user`                                                                                                                           |
| swaggerConfig[].apiListFileName    | string                                | Non         | Nom du fichier de liste API, par défaut `index.ts`. Lors de l'utilisation de plusieurs serveurs, le nom de fichier de chaque serveur doit être unique                                                                                                                                                                                                                                      |
| swaggerConfig[].headers            | object                                | Non         | Configuration des en-têtes de requête pour ce serveur                                                                                                                                                                                                                                                                                                                                      |
| swaggerConfig[].dataLevel          | 'data' \| 'serve' \| 'axios'          | Non         | Niveau de données de retour d'interface pour ce serveur. Si non défini, utilise la configuration globale `dataLevel`                                                                                                                                                                                                                                                                       |
| swaggerConfig[].parameterSeparator | '$' \| '\_'                           | Non         | Séparateur utilisé lors de la génération des noms d'API et des noms de type pour ce serveur. Si non défini, utilise la configuration globale `parameterSeparator`                                                                                                                                                                                                                          |
| swaggerConfig[].includeInterface   | Array<{path: string, method: string}> | Non         | Liste des interfaces incluses pour ce serveur. Si non définie, utilise la configuration globale `includeInterface`                                                                                                                                                                                                                                                                         |
| swaggerConfig[].excludeInterface   | Array<{path: string, method: string}> | Non         | Liste des interfaces exclues pour ce serveur. Si non définie, utilise la configuration globale `excludeInterface`                                                                                                                                                                                                                                                                          |
| requestMethodsImportPath           | string                                | Oui         | Chemin d'import des méthodes de requête                                                                                                                                                                                                                                                                                                                                                    |
| dataLevel                          | 'data' \| 'serve' \| 'axios'          | Non         | Configuration globale du niveau de données de retour d'interface, valeur par défaut : `'serve'`. Chaque serveur peut le configurer individuellement pour remplacer                                                                                                                                                                                                                         |
| formatting                         | object                                | Non         | Configuration du formatage du code                                                                                                                                                                                                                                                                                                                                                         |
| formatting.indentation             | string                                | Non         | Caractère d'indentation du code, par exemple : `"\t"` ou `"  "` (deux espaces)                                                                                                                                                                                                                                                                                                             |
| formatting.lineEnding              | string                                | Non         | Caractère de saut de ligne, par exemple : `"\n"` (LF) ou `"\r\n"` (CRLF)                                                                                                                                                                                                                                                                                                                   |
| headers                            | object                                | Non         | Configuration des en-têtes de requête (migré vers `swaggerConfig`, conservé pour compatibilité avec les anciennes configurations)                                                                                                                                                                                                                                                          |
| includeInterface                   | Array<{path: string, method: string}> | Non         | Interfaces incluses globalement : Le fichier de liste d'interfaces spécifié par `saveApiListFolderPath` ne contiendra que les interfaces de la liste, mutuellement exclusif avec `excludeInterface`. Chaque serveur peut le configurer individuellement pour remplacer                                                                                                                     |
| excludeInterface                   | Array<{path: string, method: string}> | Non         | Interfaces exclues globalement : Le fichier de liste d'interfaces spécifié par `saveApiListFolderPath` ne contiendra pas les interfaces de cette liste, mutuellement exclusif avec `includeInterface`. Chaque serveur peut le configurer individuellement pour remplacer                                                                                                                   |
| publicPrefix                       | string                                | Non         | Préfixe commun global sur le chemin URL (migré vers `swaggerConfig`, conservé pour compatibilité avec les anciennes configurations)                                                                                                                                                                                                                                                        |
| modulePrefix                       | string                                | Non         | Préfixe de chemin de requête global (chaque serveur peut le configurer individuellement pour remplacer)                                                                                                                                                                                                                                                                                    |
| apiListFileName                    | string                                | Non         | Nom du fichier de liste API global, par défaut `index.ts` (migré vers `swaggerConfig`, conservé pour compatibilité avec les anciennes configurations)                                                                                                                                                                                                                                      |
| enmuConfig                         | object                                | Oui         | Objet de configuration d'énumération                                                                                                                                                                                                                                                                                                                                                       |
| enmuConfig.erasableSyntaxOnly      | boolean                               | Oui         | Doit être cohérent avec l'option `compilerOptions.erasableSyntaxOnly` de tsconfig.json. Si `true`, génère un objet const au lieu d'un enum (syntaxe de type uniquement). Valeur par défaut : `false`                                                                                                                                                                                       |
| enmuConfig.varnames                | string                                | Non         | Nom du champ dans le schéma Swagger contenant les noms personnalisés des membres d'enum. Valeur par défaut : `enum-varnames`.                                                                                                                                                                                                                                                              |
| enmuConfig.comment                 | string                                | Non         | Nom du champ dans le schéma Swagger contenant les descriptions des membres d'enum (utilisé pour générer des commentaires). Valeur par défaut : `enum-descriptions`.                                                                                                                                                                                                                        |
| parameterSeparator                 | '$' \| '\_'                           | Non         | Séparateur utilisé globalement entre les segments de chemin et les paramètres lors de la génération des noms d'API et des noms de type. Par exemple, `/users/{userId}/posts` avec le séparateur `'_'` génère `users_userId_posts_GET`. Valeur par défaut : `'_'`. Chaque serveur peut le configurer individuellement pour remplacer                                                        |

#### Relation entre les éléments de configuration et les fichiers générés

> La structure des fichiers est générée selon le fichier de configuration, marqué **non contrôlé** signifie : ce dossier et ses fichiers sont générés automatiquement et ne sont pas contrôlés par les éléments de configuration

```
project/
├── apps/
│   ├── types/               		# Spécifié par l'élément de configuration saveTypeFolderPath
│   │   ├── models/          				# Tous les fichiers de définition de types (excluant les types enum) non contrôlé
│   │   ├── connectors/      				# Définitions de types API (fichiers de définition d'interface) non contrôlé
│   └── api/                 		# Fichiers de requête : Spécifié par l'élément de configuration saveApiListFolderPath
│   │    └── index.ts        				# Liste des fonctions de requête API (serveur unique ou premier serveur) non contrôlé
│   │    └── op.ts           				# Fichier de liste API d'autres serveurs lors de l'utilisation de plusieurs serveurs non contrôlé
│   │    └── api-type.d.ts      		# Fichier de définition de types de requête non contrôlé
│   │    └── config.ts       				# Configuration de requête, interception de requête/réponse non contrôlé
│   │    └── error-message.ts   		# Messages d'erreur au niveau système non contrôlé
│   │    ├── fetch.ts        				# Encapsulation de requête axios, peut être remplacé par fetch non contrôlé
│   └── enums/               		# Définitions de types de données enum : Spécifié par l'élément de configuration saveEnumFolderPath
```

### Exemples de code généré

#### Définition de types d'interface

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

#### Fonction de requête API

```typescript
import { GET } from './fetch';

/**
 * Obtenir les détails de l'utilisateur
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

### Explication des fonctionnalités

#### Priorité de Configuration

L'outil prend en charge la configuration globale et la configuration au niveau du serveur, en suivant ces règles de priorité :

**Priorité : Configuration au niveau du serveur > Configuration globale > Valeurs par défaut**

Les éléments de configuration suivants prennent en charge le remplacement au niveau du serveur de la configuration globale :

- `dataLevel` : Niveau de données de retour d'interface
- `parameterSeparator` : Séparateur pour les noms d'API et les noms de type
- `includeInterface` : Liste des interfaces incluses
- `excludeInterface` : Liste des interfaces exclues
- `modulePrefix` : Préfixe de chemin de requête
- `publicPrefix` : Préfixe commun d'URL
- `headers` : Configuration des en-têtes de requête

**Exemple :**

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

Dans la configuration ci-dessus :

- `api1.ts` utilise `dataLevel: "data"` (configuration au niveau du serveur)
- `api2.ts` utilise `dataLevel: "serve"` (configuration globale)
- Les deux serveurs utilisent `parameterSeparator: "_"` (configuration globale)

#### Analyse de types

- Support de tous les types de données de la spécification OpenAPI 3.0
- Gestion automatique des types imbriqués complexes
- Support des types array, object, enum, etc.
- Génération automatique de commentaires d'interface

#### Génération d'enum

L'outil prend en charge deux modes de génération d'enum, contrôlés par la configuration `enmuConfig.erasableSyntaxOnly` :

**Mode enum traditionnel** (`enmuConfig.erasableSyntaxOnly: false`, valeur par défaut) :

```typescript
export enum Status {
	Success = 'Success',
	Error = 'Error',
	Pending = 'Pending',
}
```

**Mode objet constant** (`enmuConfig.erasableSyntaxOnly: true`) :

```typescript
export const Status = {
	Success: 'Success',
	Error: 'Error',
	Pending: 'Pending',
} as const;

export type StatusType = (typeof Status)[keyof typeof Status];
```

> **Pourquoi utiliser le mode objet constant ?**
> Lorsque `compilerOptions.erasableSyntaxOnly` de TypeScript est défini sur `true`, le code ne peut utiliser que la syntaxe de type effaçable. Les `enum` traditionnels génèrent du code d'exécution, tandis que les objets constants sont purement typés et sont complètement effacés après compilation. Cela garantit la compatibilité avec les outils de construction nécessitant une syntaxe de type uniquement.

**Utilisation dans les types :**

```typescript
// Mode enum traditionnel
interface User {
	status: Status; // Utilise directement l'enum comme type
}

// Mode objet constant
interface User {
	status: StatusType; // Utilise le type généré avec le suffixe 'Type'
}
```

#### Configuration du Niveau de Données (dataLevel)

`dataLevel` est utilisé pour configurer le niveau d'extraction des données retournées par l'interface, prend en charge trois options :

1. **`'serve'` (valeur par défaut)** : Extrait le champ `data` retourné par le serveur

   ```typescript
   // Retour du serveur : { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   // Retour de la fonction : { id: 1, name: 'user' }
   ```

2. **`'data'`** : Extrait le champ `data.data` (adapté aux scénarios de data imbriquée)

   ```typescript
   // Retour du serveur : { data: { code: 200, data: { id: 1, name: 'user' } } }
   // Retour de la fonction : { id: 1, name: 'user' }
   ```

3. **`'axios'`** : Retourne l'objet de réponse axios complet
   ```typescript
   // Retour du serveur : { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   // Retour de la fonction : { code: 200, message: 'success', data: { id: 1, name: 'user' } }
   ```

**Exemple de configuration :**

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

> **Note** : La configuration `dataLevel` au niveau du serveur remplacera la configuration globale.

#### Téléchargement de fichiers

Lorsqu'un type de téléchargement de fichier est détecté, les en-têtes de requête correspondants sont automatiquement ajoutés :

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

#### Formatage du Code

L'outil prend en charge des options de formatage de code personnalisées, contrôlées par la configuration `formatting` :

**Exemple de configuration :**

```json
{
	"formatting": {
		"indentation": "\t",
		"lineEnding": "\n"
	}
}
```

**Explication de la configuration :**

- `indentation` : Caractère d'indentation du code
  - `"\t"` : Utiliser l'indentation Tab (par défaut)
  - `"  "` : Utiliser l'indentation de 2 espaces
  - `"    "` : Utiliser l'indentation de 4 espaces
- `lineEnding` : Type de saut de ligne
  - `"\n"` : LF (style Linux/macOS, recommandé)
  - `"\r\n"` : CRLF (style Windows)

**Note :** Si Prettier est configuré dans le projet, le code généré sera automatiquement formaté avec Prettier, et la configuration `formatting` peut être remplacée par Prettier.

#### Gestion des erreurs

L'outil intègre un mécanisme complet de gestion des erreurs :

- Indications d'erreur d'analyse
- Avertissements d'échec de génération de types
- Gestion des exceptions d'écriture de fichiers

#### Filtrage d'interfaces

L'outil prend en charge le filtrage des interfaces à générer via la configuration :

1. Inclure des interfaces spécifiques
   - Spécifier les interfaces à générer via l'élément de configuration `includeInterface`
   - Seules les interfaces spécifiées dans la configuration seront générées
   - Le format de configuration est un tableau d'objets contenant `path` et `method`

2. Exclure des interfaces spécifiques
   - Spécifier les interfaces à exclure via l'élément de configuration `excludeInterface`
   - Toutes les interfaces sauf celles spécifiées dans la configuration seront générées
   - Le format de configuration est un tableau d'objets contenant `path` et `method`

Exemple de configuration : Cette configuration est dans `an.config.json`

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

Note : `includeInterface` et `excludeInterface` ne peuvent pas être utilisés simultanément, si les deux sont configurés, `includeInterface` sera prioritaire.

#### Support de plusieurs serveurs Swagger

L'outil prend en charge la configuration de plusieurs serveurs Swagger, chaque serveur peut être configuré indépendamment :

- **Un seul serveur** : `swaggerConfig` peut être directement rempli comme objet
- **Plusieurs serveurs** : `swaggerConfig` utilise un tableau, chaque serveur doit configurer un `apiListFileName` unique

**Principe de fonctionnement :**

- Les API du premier serveur seront générées dans le `apiListFileName` spécifié (par défaut `index.ts`)
- Les API des serveurs suivants seront ajoutées dans leurs propres fichiers `apiListFileName`
- Les définitions de types et les enum seront fusionnées dans un dossier unifié pour éviter les doublons

**Configuration au niveau du serveur :**

Chaque serveur prend en charge une configuration indépendante des options suivantes. Si non configuré, la configuration globale est utilisée :

- `dataLevel` - Niveau de données de retour d'interface
- `parameterSeparator` - Séparateur pour les noms d'API et les noms de type
- `includeInterface` - Liste des interfaces incluses
- `excludeInterface` - Liste des interfaces exclues
- `modulePrefix` - Préfixe de chemin de requête

#### Préfixe de Chemin (modulePrefix)

`modulePrefix` est utilisé pour ajouter automatiquement un préfixe devant tous les chemins de requête API, ce qui est particulièrement utile dans les scénarios suivants :

1. **Scénario de proxy inverse** : Lorsque le service backend est routé via un proxy inverse
2. **Gateway d'API** : Ajouter uniformément un préfixe de gateway devant le chemin
3. **Configuration multi-environnements** : Utiliser différents préfixes de chemin pour différents environnements

**Exemple d'utilisation :**

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

**Effet :**

Le chemin `/api/user/list` défini dans Swagger sera généré comme :

```typescript
export const apiUserListGet = (params: ApiUserList_GET.Query) => GET<ApiUserList_GET.Response>('/forward/api/user/list', params);
```

**Différence avec publicPrefix :**

- `publicPrefix` : Utilisé pour supprimer le préfixe commun du chemin d'interface (n'affecte que le nom de fonction généré)
- `modulePrefix` : Utilisé pour ajouter un préfixe devant le chemin de requête réel (affecte l'URL de requête à l'exécution)

**Exemple de configuration :**

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

**Exemple de configuration (ancien format) :**

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

**Instructions de migration :**

- Les anciennes configurations (`swaggerJsonUrl`, `publicPrefix`, `headers`) restent compatibles
- L'outil détectera automatiquement les anciennes configurations et suggérera des méthodes de migration
- Il est recommandé de migrer vers la nouvelle configuration `swaggerConfig` pour une meilleure flexibilité

#### Support des méthodes HTTP

L'outil prend en charge les méthodes HTTP suivantes :

- `GET` - Obtenir des ressources
- `POST` - Créer des ressources
- `PUT` - Mettre à jour des ressources (remplacement complet)
- `PATCH` - Mettre à jour des ressources (mise à jour partielle)
- `DELETE` - Supprimer des ressources
- `OPTIONS` - Requête de pré-vérification
- `HEAD` - Obtenir les en-têtes de réponse
- `SEARCH` - Requête de recherche

Toutes les méthodes prennent en charge les définitions de types sécurisées pour les paramètres et les types de réponse.

### Remarques

1. Assurez-vous que l'adresse du document Swagger JSON est accessible
2. Les chemins dans le fichier de configuration doivent être relatifs au répertoire racine du projet
3. Les fichiers générés écraseront les fichiers existants du même nom (mais `config.ts`, `error-message.ts`, `fetch.ts`, `api-type.d.ts` ne seront pas écrasés s'ils existent déjà)
4. Il est recommandé d'ajouter les fichiers générés au contrôle de version
5. Lors de l'utilisation de plusieurs serveurs Swagger, assurez-vous que le `apiListFileName` de chaque serveur est unique pour éviter l'écrasement des fichiers
6. Lors de la configuration de plusieurs serveurs, les définitions de types et les enum seront fusionnées, si différents serveurs ont des types du même nom, des conflits peuvent survenir
7. La configuration au niveau du serveur (`dataLevel`, `parameterSeparator`, `includeInterface`, `excludeInterface`, `modulePrefix`) remplacera la configuration globale
8. `includeInterface` et `excludeInterface` ne peuvent pas être configurés simultanément. Si les deux sont configurés, `includeInterface` sera prioritaire

### Problèmes courants

1. Échec du formatage des fichiers de types générés
   - Vérifiez si prettier est installé
   - Confirmez la présence d'un fichier de configuration prettier dans le répertoire racine du projet

2. Erreur de chemin d'import des fonctions de requête
   - Vérifiez que la configuration requestMethodsImportPath est correcte
   - Confirmez l'existence du fichier de méthodes de requête

3. **Quand utiliser `modulePrefix` ?**
   - Lorsque votre API doit être accessible via un proxy inverse ou une passerelle
   - Par exemple : Swagger définit `/api/user`, mais la requête réelle doit être `/gateway/api/user`
   - Il suffit de définir `modulePrefix: "/gateway"`

4. **Quelle est la différence entre `publicPrefix` et `modulePrefix` ?**
   - `publicPrefix` : Supprime le préfixe du chemin d'interface, n'affecte que le nom de fonction généré
     - Par exemple : `/api/user/list` après suppression de `/api`, le nom de fonction est `userListGet`
   - `modulePrefix` : Ajoute un préfixe devant le chemin de requête, affecte l'URL de requête réelle
     - Par exemple : `/api/user/list` après ajout de `/forward`, l'URL de requête est `/forward/api/user/list`

5. **Comment configurer différents `dataLevel` pour plusieurs serveurs ?**

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

   - `old-api.ts` utilise `dataLevel: "axios"`
   - `new-api.ts` utilise le `dataLevel: "serve"` global

6. **Comment générer seulement des interfaces partielles ?**
   - Utilisez la configuration `includeInterface` :
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
   - Ou utilisez `excludeInterface` pour exclure les interfaces non désirées

7. **Que faire si les fichiers générés ont été écrasés ?**
   - Les fichiers `config.ts`, `error-message.ts`, `fetch.ts`, `api-type.d.ts` ne sont générés que la première fois s'ils n'existent pas
   - Les fichiers de liste API et les fichiers de types sont régénérés à chaque fois
   - Il est recommandé d'inclure les fichiers générés dans le contrôle de version pour faciliter la révision des modifications

8. **Quand utiliser `modulePrefix` ?**
   - Lorsque votre API doit être accessible via un proxy inverse ou une passerelle
   - Par exemple : Swagger définit `/api/user`, mais la requête réelle doit être `/gateway/api/user`
   - Il suffit de définir `modulePrefix: "/gateway"`

9. **Quelle est la différence entre `publicPrefix` et `modulePrefix` ?**
   - `publicPrefix` : Supprime le préfixe du chemin d'interface, n'affecte que le nom de fonction généré
     - Par exemple : `/api/user/list` après suppression de `/api`, le nom de fonction est `userListGet`
   - `modulePrefix` : Ajoute un préfixe devant le chemin de requête, affecte l'URL de requête réelle
     - Par exemple : `/api/user/list` après ajout de `/forward`, l'URL de requête est `/forward/api/user/list`

10. **Comment configurer différents `dataLevel` pour plusieurs serveurs ?**

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

    - `old-api.ts` utilise `dataLevel: "axios"`
    - `new-api.ts` utilise le `dataLevel: "serve"` global

11. **Comment générer seulement des interfaces partielles ?**
    - Utilisez la configuration `includeInterface` :
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
    - Ou utilisez `excludeInterface` pour exclure les interfaces non désirées

12. **Que faire si les fichiers générés ont été écrasés ?**
    - Les fichiers `config.ts`, `error-message.ts`, `fetch.ts`, `api-type.d.ts` ne sont générés que la première fois s'ils n'existent pas
    - Les fichiers de liste API et les fichiers de types sont régénérés à chaque fois
    - Il est recommandé d'inclure les fichiers générés dans le contrôle de version pour faciliter la révision des modifications

# Guide d'utilisation de la commande `anl lint`

> Fournit une fonctionnalité de configuration en un clic pour divers outils lint de projets frontend, incluant :
>
> - Vérification de code ESLint
> - Formatage de code Prettier
> - Normes de messages de commit CommitLint
> - Configuration de l'éditeur VSCode

### Méthode d'utilisation

```bash
$ anl lint
```

Après l'exécution de la commande, une interface de sélection multiple interactive apparaîtra où vous pourrez choisir les outils à installer :

```
? Select the linting tools to install (multi-select):
❯◯ ESLint - JavaScript/TypeScript linter
 ◯ Stylelint - CSS/SCSS/Less linter
 ◯ Commitlint - Git commit message linter
 ◯ Prettier - Code formatter
 ◯ VSCode - Editor settings
```

Utilisez la **barre d'espace** pour sélectionner/désélectionner, **Entrée** pour confirmer.

### Détails de configuration

#### 1. Configuration ESLint

- Installation automatique des dépendances nécessaires
- Support des frameworks React/Vue (vous serez invité à choisir un framework si sélectionné)
- Génération automatique de `.eslintrc.js` et `.eslintignore`
- Support TypeScript intégré

#### 2. Configuration Stylelint

- Installation automatique des dépendances liées à stylelint
- Support des préprocesseurs Less/Sass (vous serez invité à choisir un préprocesseur si sélectionné)
- Génération du fichier de configuration `.stylelintrc.js`
- Support Prettier intégré

#### 3. Configuration Prettier

- Installation automatique des dépendances prettier associées
- Génération du fichier de configuration `.prettierrc.js`
- La configuration par défaut inclut :
  - Largeur de ligne : 80
  - Indentation par Tab
  - Utilisation de guillemets simples
  - Parenthèses des fonctions fléchées
  - Autres normes de style de code

#### 4. Configuration CommitLint

- Installation des dépendances commitlint associées
- Configuration des hooks git husky
- Génération de `commitlint.config.js`
- Normalisation des messages git commit

#### 5. Configuration VSCode

- Création de `.vscode/settings.json`
- Configuration du formatage automatique de l'éditeur
- Définition de l'outil de formatage par défaut
- Support de la mise à jour des fichiers de configuration existants

### Exemples d'utilisation

1. **Installer uniquement ESLint et Prettier**
   - Sélectionnez ESLint et Prettier
   - Si ESLint est sélectionné, vous serez invité à choisir un framework (React/Vue)
   - Après l'installation, votre projet aura `.eslintrc.js` et `.prettierrc.js`

2. **Configuration complète**
   - Sélectionnez toutes les options
   - Complétez les sélections de framework et de préprocesseur
   - Votre projet aura un système complet de normes de code configuré

# Commande `anl git`

### Aperçu des fonctionnalités

- Via une sélection multiple interactive, applique les capacités Git suivantes au dépôt actuel :
  - Création de branches selon le standard gitflow
    - Copie `.gitscripts/`, `.gitconfig`, `.commit-type.cjs` dans le projet (uniquement s'ils sont absents)
    - Ajoute des permissions d'exécution à `.gitscripts/random-branch.sh`
    - Exécute `git config --local include.path ../.gitconfig`
  - Configuration automatique du sujet de commit
    - Copie `.githooks/commit-msg` et le rend exécutable
    - Exécute `git config core.hooksPath .githooks`
  - Commandes git personnalisées
    - Ajoute `.gitattributes` au projet (uniquement s'il est absent)

### Méthode d'utilisation

```bash
$ anl git
```

Sélectionnez une ou plusieurs fonctionnalités dans l'invite. Les fichiers ne sont créés que s'ils n'existent pas ; les fichiers existants sont préservés.

### Remarques

- Veuillez exécuter dans un dépôt Git.
- Si l'exécution automatique de git config échoue, veuillez exécuter manuellement :

```bash
git config --local include.path ../.gitconfig
git config core.hooksPath .githooks
```

# Licence

ISC License

# Guide de contribution

Les [Issues](https://github.com/bianliuzhu/an-cli/issues) et [Pull Requests](https://github.com/bianliuzhu/an-cli/pulls) sont les bienvenus !
