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
	],
	"publicPrefix": "api",
	"erasableSyntaxOnly": false,
	"parameterSeparator": "_"
}
```

#### Explication des éléments de configuration

| Élément de configuration | Type                                  | Obligatoire | Description                                                                                                                                                                                                                                          |
| ------------------------ | ------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| saveTypeFolderPath       | string                                | Oui         | Chemin de sauvegarde des fichiers de définition de types                                                                                                                                                                                             |
| saveApiListFolderPath    | string                                | Oui         | Chemin de sauvegarde des fichiers de fonctions de requête API                                                                                                                                                                                        |
| saveEnumFolderPath       | string                                | Oui         | Chemin de sauvegarde des fichiers de données enum                                                                                                                                                                                                    |
| importEnumPath           | string                                | Oui         | Chemin d'import enum (chemin des fichiers enum référencés dans apps/types/models/\*.ts)                                                                                                                                                              |
| swaggerJsonUrl           | string                                | Oui         | Adresse du document Swagger JSON                                                                                                                                                                                                                     |
| requestMethodsImportPath | string                                | Oui         | Chemin d'import des méthodes de requête                                                                                                                                                                                                              |
| dataLevel                | 'data' \| 'serve' \| 'axios'          | Oui         | Niveau de données retournées par l'interface                                                                                                                                                                                                         |
| formatting               | object                                | Non         | Configuration du formatage du code                                                                                                                                                                                                                   |
| headers                  | object                                | Non         | Configuration des en-têtes de requête                                                                                                                                                                                                                |
| includeInterface         | Array<{path: string, method: string}> | Non         | Interfaces à inclure : Le fichier de liste d'interfaces spécifié par `saveApiListFolderPath` ne contiendra que les interfaces de la liste, mutuellement exclusif avec `excludeInterface`                                                             |
| excludeInterface         | Array<{path: string, method: string}> | Non         | Interfaces à exclure : Le fichier de liste d'interfaces spécifié par `saveApiListFolderPath` ne contiendra pas les interfaces de cette liste, mutuellement exclusif avec `includeInterface`                                                          |
| publicPrefix             | string                                | Non         | Préfixe commun sur le chemin URL, par exemple : api/users, api/users/{id}, api est le préfixe commun                                                                                                                                                 |
| erasableSyntaxOnly       | boolean                               | Oui         | Doit être cohérent avec l'option `compilerOptions.erasableSyntaxOnly` de tsconfig.json. Si `true`, génère un objet const au lieu d'un enum (syntaxe de type uniquement). Valeur par défaut : `false`                                                 |
| parameterSeparator       | string                                | Non         | Séparateur utilisé entre les segments de chemin et les paramètres lors de la génération des noms d'API et des noms de type. Par exemple, `/users/{userId}/posts` avec le séparateur `'_'` génère `users_userId_posts_GET`. Valeur par défaut : `'_'` |

#### Relation entre les éléments de configuration et les fichiers générés

> La structure des fichiers est générée selon le fichier de configuration, marqué **non contrôlé** signifie : ce dossier et ses fichiers sont générés automatiquement et ne sont pas contrôlés par les éléments de configuration

```
project/
├── apps/
│   ├── types/               		# Spécifié par l'élément de configuration saveTypeFolderPath
│   │   ├── models/          				# Tous les fichiers de définition de types (excluant les types enum) non contrôlé
│   │   ├── connectors/      				# Définitions de types API (fichiers de définition d'interface) non contrôlé
│   └── api/                 		# Fichiers de requête : Spécifié par l'élément de configuration saveApiListFolderPath
│   │    └── index.ts        				# Liste des fonctions de requête API non contrôlé
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

#### Analyse de types

- Support de tous les types de données de la spécification OpenAPI 3.0
- Gestion automatique des types imbriqués complexes
- Support des types array, object, enum, etc.
- Génération automatique de commentaires d'interface

#### Génération d'enum

L'outil prend en charge deux modes de génération d'enum, contrôlés par la configuration `erasableSyntaxOnly` :

**Mode enum traditionnel** (`erasableSyntaxOnly: false`, valeur par défaut) :

```typescript
export enum Status {
	Success = 'Success',
	Error = 'Error',
	Pending = 'Pending',
}
```

**Mode objet constant** (`erasableSyntaxOnly: true`) :

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

#### Téléchargement de fichiers

Lorsqu'un type de téléchargement de fichier est détecté, les en-têtes de requête correspondants sont automatiquement ajoutés :

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

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

### Remarques

1. Assurez-vous que l'adresse du document Swagger JSON est accessible
2. Les chemins dans le fichier de configuration doivent être relatifs au répertoire racine du projet
3. Les fichiers générés écraseront les fichiers existants du même nom
4. Il est recommandé d'ajouter les fichiers générés au contrôle de version

### Problèmes courants

1. Échec du formatage des fichiers de types générés
   - Vérifiez si prettier est installé
   - Confirmez la présence d'un fichier de configuration prettier dans le répertoire racine du projet

2. Erreur de chemin d'import des fonctions de requête
   - Vérifiez que la configuration requestMethodsImportPath est correcte
   - Confirmez l'existence du fichier de méthodes de requête

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
