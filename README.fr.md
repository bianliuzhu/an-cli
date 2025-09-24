# an-cli

[English](./README.en.md) | [Español](./README.es.md) | [العربية](./README.ar.md) | Français | [Русский](./README.ru.md) | [日本語](./README.jp.md) | [简体中文](./README.md)

## Description

an-cli est un outil en ligne de commande frontend qui comprend les deux commandes suivantes :

> `anl type`：Un outil en ligne de commande qui génère automatiquement des définitions de types TypeScript et des fonctions de requête API basées sur Swagger JSON.

> `anl lint`: Génère des configurations ESLint, Stylelint, Prettier, CommitLint et VSCode pour les projets React ou Vue.

> `anl git`: Génère la configuration Git locale ; les fonctionnalités optionnelles incluent la création de branches standard gitflow, les sujets des messages de commit, et la configuration de commandes Git personnalisées

## Caractéristiques

- `anl type`
  - 🚀 Analyse automatique de la documentation Swagger JSON
  - 📦 Génération de fichiers de définition de types TypeScript
  - 🔄 Génération de fonctions de requête API typées
  - 🎯 Prise en charge des paramètres de chemin, de requête et de corps
  - 📝 Génération automatique de définitions de types énumérés
  - 🎨 Prise en charge du formatage du code
  - ⚡️ Prise en charge du téléchargement de fichiers
  - 🛠 Options de génération de code configurables

- `anl lint`
  - 🔍 Configuration en un clic de divers outils lint
  - 🎨 Configuration automatique d'ESLint
  - 🎯 Configuration du formatage Prettier
  - 🔄 Normes de commit avec CommitLint
  - 📦 Configuration de l'éditeur VSCode

## Installation

> [!NOTE]
>
> Installation globale requise

```bash
$ npm install anl -g

$ yarn global add anl
```

## Instructions d'utilisation

> [!TIP]
>
> 1. Si c'est votre première utilisation et que vous n'êtes pas sûr des résultats, il est recommandé d'exécuter d'abord la commande, d'observer les changements dans le projet, puis de consulter la documentation pour modifier la configuration et générer à nouveau jusqu'à obtenir le résultat souhaité.
> 2. Ou suivez les étapes ci-dessous une par une pour obtenir des résultats.

# Commande anl type

## Instructions d'utilisation

1. Exécuter la commande

```bash
$ anl type
```

2. Explication de la configuration

- Lors de la première exécution de `anl type`, un fichier de configuration nommé `an.config.json` sera automatiquement créé dans le répertoire racine du projet (ou peut être créé manuellement).
- Lors de l'exécution de la commande `anl type`, le système recherchera le fichier de configuration `an.config.json` dans le répertoire racine du projet et lira ses informations de configuration pour générer les encapsulations axios correspondantes, la configuration, la liste des interfaces, les types de requête et de réponse des interfaces.
- Les éléments de configuration dans le fichier de configuration peuvent être librement modifiés.

3. Exemple de configuration `an.config.json`

- Le fichier de configuration doit être dans le répertoire racine du projet et ne peut pas être déplacé
- Le nom du fichier de configuration ne peut pas être modifié
- Pour les détails des paramètres, voir [Description des options de configuration](#description-des-options-de-configuration)

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

3. Mettez à jour le fichier de configuration selon vos besoins, puis exécutez à nouveau la commande `anl type` pour générer les informations de type correspondantes selon les configurations spécifiées dans le fichier de configuration.

```bash
$ anl type
```

> [!NOTE]
>
> Si vous n'êtes pas sûr de ces configurations, vous pouvez d'abord exécuter la commande anl type pour générer les types, puis vérifier le répertoire du projet, ajuster les éléments de configuration en fonction de la description des options de configuration, et générer à nouveau jusqu'à obtenir l'effet souhaité.

## Description des options de configuration

| Option                   | Type                                  | Requis | Description                                                                                     |
| ------------------------ | ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| saveTypeFolderPath       | string                                | Oui    | Chemin de sauvegarde des fichiers de définition de types                                        |
| saveApiListFolderPath    | string                                | Oui    | Chemin de sauvegarde des fonctions de requête API                                               |
| saveEnumFolderPath       | string                                | Oui    | Chemin de sauvegarde des types énumérés                                                         |
| importEnumPath           | string                                | Oui    | Chemin d'importation des types énumérés                                                         |
| swaggerJsonUrl           | string                                | Oui    | URL du document Swagger JSON                                                                    |
| requestMethodsImportPath | string                                | Oui    | Chemin d'importation des méthodes de requête                                                    |
| dataLevel                | 'data' \| 'serve' \| 'axios'          | Oui    | Niveau de données de réponse                                                                    |
| formatting               | object                                | Non    | Configuration du formatage du code                                                              |
| headers                  | object                                | Non    | Configuration des en-têtes de requête                                                           |
| includeInterface         | Array<{path: string, method: string}> | Non    | Liste des interfaces à inclure, si défini, seules ces interfaces seront générées                |
| excludeInterface         | Array<{path: string, method: string}> | Non    | Liste des interfaces à exclure, si défini, toutes les interfaces sauf celles-ci seront générées |

## Structure des fichiers générés

- Cette structure de fichiers est générée selon la configuration

```
project/
├── apps/
│   ├── types/
│   │   ├── models/          # Tous les fichiers de définition de types (sans les types énumérés)
│   │   ├── connectors/      # Définitions de types API (fichiers de définition d'interface)
│   │   └── enums/           # Définitions des types énumérés
│   └── api/
│       ├── fetch.ts         # Implémentation des méthodes de requête
│       └── index.ts         # Fonctions de requête API
```

## Exemples de code généré

### Fichier de définition de type

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
 * Obtenir les détails de l'utilisateur
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

## Caractéristiques

### Analyse des types

- Prise en charge de tous les types de données OpenAPI 3.0
- Traitement automatique des types imbriqués complexes
- Prise en charge des tableaux, objets, énumérations
- Génération automatique des commentaires d'interface

### Téléchargement de fichiers

Lorsqu'un type de téléchargement de fichier est détecté, les en-têtes de requête correspondants sont automatiquement ajoutés :

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

### Gestion des erreurs

L'outil intègre un mécanisme complet de gestion des erreurs :

- Messages d'erreur d'analyse
- Avertissements de génération de types
- Gestion des exceptions d'écriture de fichiers

### Filtrage des interfaces

L'outil prend en charge le filtrage des interfaces à générer via la configuration :

1. Inclure des interfaces spécifiques
   - Spécifier les interfaces à générer via l'option `includeInterface`
   - Seules les interfaces spécifiées dans la configuration seront générées
   - Format de configuration : tableau d'objets contenant `path` et `method`

2. Exclure des interfaces spécifiques
   - Spécifier les interfaces à exclure via l'option `excludeInterface`
   - Toutes les interfaces seront générées sauf celles spécifiées dans la configuration
   - Format de configuration : tableau d'objets contenant `path` et `method`

Exemple de configuration :

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

Note : `includeInterface` et `excludeInterface` ne peuvent pas être utilisés simultanément. Si les deux sont configurés, `includeInterface` sera prioritaire.

## Développement

```bash
# Installation des dépendances
npm install

# Mode développement
Appuyez sur F5 pour déboguer

# Construction
npm run build

# Liaison locale pour le débogage
npm run blink
```

## Points importants

1. Assurez-vous que l'URL du document Swagger JSON est accessible
2. Les chemins dans le fichier de configuration doivent être relatifs à la racine du projet
3. Les fichiers générés écraseront les fichiers existants du même nom
4. Il est recommandé d'inclure les fichiers générés dans le contrôle de version

## FAQ

1. Échec du formatage des fichiers de types générés
   - Vérifiez si prettier est installé
   - Vérifiez la présence du fichier de configuration prettier dans la racine du projet

2. Erreur de chemin d'importation des fonctions de requête
   - Vérifiez la configuration de requestMethodsImportPath
   - Confirmez l'existence du fichier des méthodes de requête

# Commande anl lint

### Vue d'ensemble des fonctionnalités

Fournit une configuration en un clic des outils lint pour les projets frontend, notamment :

- Vérification de code ESLint
- Formatage de code Prettier
- Normes de messages de commit CommitLint
- Configuration de l'éditeur VSCode

### Méthode d'utilisation

```bash
$ anl lint
```

### Détails de la configuration

#### 1. Configuration ESLint

- Installation automatique des dépendances requises
- Support des frameworks React/Vue
- Génération automatique de `.eslintrc.js` et `.eslintignore`
- Intégration du support TypeScript

#### 2. Configuration Prettier

- Installation automatique des dépendances prettier
- Génération du fichier de configuration `.prettierrc.js`
- Configuration par défaut incluant :
  - Largeur de ligne : 80
  - Indentation par tabulation
  - Utilisation des guillemets simples
  - Parenthèses des fonctions fléchées
  - Autres normes de style de code

#### 3. Configuration CommitLint

- Installation des dépendances commitlint
- Configuration des hooks git husky
- Génération de `commitlint.config.js`
- Normalisation des messages de commit git

#### 4. Configuration VSCode

- Création de `.vscode/settings.json`
- Configuration du formatage automatique de l'éditeur
- Définition de l'outil de formatage par défaut
- Support de la mise à jour des configurations existantes

## Licence

Licence ISC

## Guide de contribution

Les Issues et Pull Requests sont les bienvenus !

# Commande anl git

### Vue d'ensemble

- Applique des fonctionnalités Git au dépôt courant via une invite interactive :
  - création de branches standard gitflow
    - Copie `.gitscripts/`, `.gitconfig`, `.commit-type.js` dans le projet (seulement si absent)
    - Rend exécutable `.gitscripts/random-branch.sh`
    - Exécute `git config --local include.path ../.gitconfig`
  - définir automatiquement l'objet du commit
    - Copie `.githooks/commit-msg` et le rend exécutable
    - Exécute `git config core.hooksPath .githooks`
  - commande git personnalisée
    - Ajoute `.gitattributes` au projet (seulement si absent)

### Utilisation

```bash
$ anl git
```

Sélectionnez une ou plusieurs fonctionnalités. Les fichiers ne sont créés que s'ils n'existent pas; les fichiers existants sont préservés.

### Remarques

- À exécuter dans un dépôt Git.
- Si les commandes de configuration automatique échouent, exécutez-les manuellement :

```bash
git config --local include.path ../.gitconfig
git config core.hooksPath .githooks
```

## Documentation Multilingue

Pour une meilleure maintenance de la documentation multilingue, nous suggérons :

1. Convention de Nommage des Fichiers
   - Utilisation des codes de langue standard :
     - Chinois : `README.zh-CN.md`
     - Anglais : `README.en.md`
     - Espagnol : `README.es.md`
     - Arabe : `README.ar.md`
     - Français : `README.fr.md`
     - Russe : `README.ru.md`
     - Japonais : `README.ja.md`

2. Synchronisation des Documents
   - Utilisez le script `sync-docs.js` pour synchroniser automatiquement
   - Exécutez `npm run sync-docs` après les modifications
   - Maintenez une structure cohérente dans toutes les versions

3. Normes de Traduction
   - Maintenir la cohérence des termes techniques
   - Conserver les exemples de code en anglais
   - Utiliser la langue correspondante pour les commentaires
   - Maintenir un format uniforme

4. Guide de Contribution
   - Les suggestions d'amélioration multilingue sont bienvenues
   - Mettre à jour toutes les versions lors des PR
   - Signaler les problèmes de traduction via Issues

5. Optimisation du Changement de Langue
   - Icônes de changement de langue en haut de chaque document
   - Ordre cohérent des liens linguistiques
   - Lien de la langue actuelle désactivé
