# an-cli

[简体中文](./README.zh.md) | [English](./README.md) | [Español](./README.es.md) | [العربية](./README.ar.md) | Français | [Русский](./README.ru.md) | [日本語](./README.jp.md)

## Description

an-cli est un outil CLI frontend proposant les commandes suivantes :

> `anl type` : Outil en ligne de commande qui génère automatiquement des définitions de types TypeScript et des fonctions de requête API à partir d'un document Swagger/OpenAPI JSON.

> `anl lint` : Génère les configurations pour ESLint, Stylelint, Prettier, CommitLint et VSCode pour des projets React ou Vue.

> `anl git` : Génère une configuration Git locale avec des options comme la création de branches gitflow, le sujet des messages de commit et des commandes Git personnalisées.

## Fonctionnalités

- `anl type`
  - 🚀 Analyse automatiquement les documents Swagger JSON
  - 📦 Génère des fichiers de définitions de types TypeScript
  - 🔄 Génère des fonctions de requête API typées de manière sûre
  - 🎯 Prend en charge paramètres de chemin, de requête et corps
  - 📝 Génère automatiquement les définitions d'énumérations
  - 🎨 Prend en charge le formatage du code
  - ⚡️ Prend en charge l'upload de fichiers
  - 🛠 Options de génération configurables

- `anl lint`
  - 🔍 Configuration en un clic de divers outils de lint
  - 🎨 Configuration ESLint automatisée
  - 🎯 Configuration Prettier
  - 🔄 Conventions de commit avec CommitLint
  - 📦 Configuration de l'éditeur VSCode

## Installation

> Remarque
>
> Installation globale requise

```bash
$ npm install anl -g

$ yarn global add anl
```

## Guide d'utilisation

> Astuce
>
> 1. Si c'est votre première utilisation, exécutez d'abord la commande pour voir les changements produits dans le projet, puis ajustez la configuration selon la documentation et régénérez jusqu'à obtenir le résultat souhaité.
> 2. Ou suivez simplement les étapes ci-dessous une par une.

# Commande anl type

## Utilisation

1. Exécuter la commande

```bash
$ anl type
```

2. Fichier de configuration

- Lors de la première exécution de `anl type`, un fichier de configuration nommé `an.config.json` est automatiquement créé à la racine du projet (création manuelle possible).
- À l'exécution, `anl type` recherche `an.config.json` à la racine, le lit et génère le wrapper Axios, la configuration, la liste d'API, ainsi que les types de requête/réponse.
- Les options de configuration sont librement modifiables.

3. Exemple de `an.config.json`

- Le fichier de configuration doit rester à la racine du projet.
- Le nom du fichier ne peut pas être modifié.
- Pour le détail des paramètres, voir Options de configuration.

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

3. Mettez à jour le fichier de configuration selon vos besoins puis relancez `anl type`. Le code sera généré en conséquence.

```bash
$ anl type
```

> Remarque
>
> En cas de doute, exécutez d'abord `anl type`, inspectez les fichiers générés, ajustez les options puis relancez jusqu'à obtenir le résultat désiré.

## Options de configuration

| Option                   | Type                                  | Requis | Description                                       |
| ------------------------ | ------------------------------------- | ------ | ------------------------------------------------- |
| saveTypeFolderPath       | string                                | Oui    | Chemin de sauvegarde des définitions de types     |
| saveApiListFolderPath    | string                                | Oui    | Chemin de sauvegarde des fonctions de requête API |
| saveEnumFolderPath       | string                                | Oui    | Chemin de sauvegarde des énumérations             |
| importEnumPath           | string                                | Oui    | Chemin d'import des énumérations                  |
| swaggerJsonUrl           | string                                | Oui    | URL du document Swagger JSON                      |
| requestMethodsImportPath | string                                | Oui    | Chemin d'import des méthodes de requête           |
| dataLevel                | 'data' \| 'serve' \| 'axios'          | Oui    | Niveau de données de la réponse                   |
| formatting               | object                                | Non    | Configuration du formatage du code                |
| headers                  | object                                | Non    | En-têtes de requête                               |
| includeInterface         | Array<{path: string, method: string}> | Non    | Générer seulement les interfaces listées ici      |
| excludeInterface         | Array<{path: string, method: string}> | Non    | Exclure les interfaces listées ici                |

## Arborescence générée

- Cette structure est générée selon votre fichier de configuration.

```
project/
├── apps/
│   ├── types/
│   │   ├── models/          # Toutes les définitions (hors énumérations)
│   │   ├── connectors/      # Définitions de types d'API (interfaces)
│   │   └── enums/           # Définitions d'énumérations
│   └── api/
│       ├── fetch.ts         # Implémentation des méthodes de requête
│       └── index.ts         # Fonctions de requête API
```

## Exemples de code généré

### Définitions de types

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

### Fonction de requête API

```typescript
import { GET } from './fetch';

/**
 * Obtenir le détail d'un utilisateur
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

## Fonctionnalités additionnelles

### Analyse des types

- Prend en charge tous les types de données OpenAPI 3.0
- Gère automatiquement les types imbriqués complexes
- Prend en charge tableaux, objets, énumérations, etc.
- Génère automatiquement les commentaires d'interface

### Téléversement de fichiers

Lorsqu'un upload est détecté, les en-têtes appropriés sont ajoutés automatiquement :

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

### Gestion des erreurs

L'outil intègre une gestion des erreurs robuste :

- Messages d'erreur d'analyse
- Avertissements si la génération des types échoue
- Gestion des exceptions d'écriture de fichier

### Filtrage des interfaces

Contrôlez les interfaces générées via la configuration :

1. Inclure des interfaces spécifiques
   - Utilisez `includeInterface` pour préciser les interfaces à générer
   - Seules les interfaces listées seront générées
   - Format : tableau d'objets avec `path` et `method`

2. Exclure des interfaces spécifiques
   - Utilisez `excludeInterface` pour ignorer des interfaces
   - Toutes les autres seront générées
   - Format : tableau d'objets avec `path` et `method`

Exemple :

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

Remarque : `includeInterface` et `excludeInterface` ne peuvent pas être utilisés simultanément. Si les deux sont définis, `includeInterface` est prioritaire.

## Développement

```bash
# Installer les dépendances
npm install

# Mode développement
Appuyez sur F5 pour déboguer

# Build
npm run build

# Lien local pour le débogage
npm run blink
```

## Notes

1. Assurez-vous que l'URL Swagger JSON est accessible
2. Les chemins de configuration sont relatifs à la racine du projet
3. Les fichiers générés écraseront les fichiers existants portant le même nom
4. Il est recommandé de versionner les fichiers générés

## FAQ

1. Échec du formatage des fichiers de types générés
   - Vérifiez que Prettier est installé
   - Assurez-vous qu'un fichier de config Prettier existe à la racine

2. Mauvais chemin d'import dans les fonctions de requête
   - Vérifiez `requestMethodsImportPath`
   - Assurez-vous que le fichier de méthode de requête existe

# Commande anl lint

### Vue d'ensemble

Configuration en un clic de plusieurs outils de lint frontend, dont :

- ESLint pour l'analyse de code
- Prettier pour le formatage
- CommitLint pour les conventions de message de commit
- Configuration de l'éditeur VSCode

### Utilisation

```bash
$ anl lint
```

### Détails de configuration

#### 1. ESLint

- Installe automatiquement les dépendances requises
- Prend en charge React/Vue
- Génère `.eslintrc.js` et `.eslintignore`
- Intègre TypeScript

#### 2. Prettier

- Installe automatiquement les dépendances Prettier
- Génère `.prettierrc.js`
- Paramètres par défaut :
  - Largeur de ligne : 80
  - Indentation par tabulation
  - Guillemets simples
  - Parenthèses pour les fonctions fléchées
  - Autres règles de style

#### 3. CommitLint

- Installe les dépendances CommitLint
- Configure les hooks Git Husky
- Génère `commitlint.config.js`
- Normalise les messages de commit

#### 4. VSCode

- Crée `.vscode/settings.json`
- Configure le formatage automatique à l'enregistrement
- Définit le formateur par défaut
- Peut mettre à jour des configs existantes

# Commande anl git

### Vue d'ensemble

Applique les capacités Git suivantes via une sélection multiple interactive :

- Création de branches standard gitflow
  - Copier `.gitscripts/`, `.gitconfig`, `.commit-type.js` dans le projet (si manquants)
  - Rendre exécutable `.gitscripts/random-branch.sh`
  - Exécuter `git config --local include.path ../.gitconfig`
- Définition automatique du sujet de commit
  - Copier `.githooks/commit-msg` et le rendre exécutable
  - Exécuter `git config core.hooksPath .githooks`
- Commandes Git personnalisées
  - Ajouter `.gitattributes` au projet (si manquant)

### Utilisation

```bash
$ anl git
```

Sélectionnez une ou plusieurs fonctionnalités. Les fichiers sont créés uniquement s'ils sont absents ; les fichiers existants sont préservés.

### Notes

- À exécuter dans un dépôt Git.
- Si la configuration automatique échoue, exécutez manuellement :

```bash
git config --local include.path ../.gitconfig
git config core.hooksPath .githooks
```

# Licence

Licence ISC

# Contributions

Issues et Pull Requests bienvenus : https://github.com/bianliuzhu/an-cli
