# an-cli

[English](./README.en.md) | [Español](./README.es.md) | [العربية](./README.ar.md) | Français | [Русский](./README.ru.md) | [日本語](./README.jp.md) | [简体中文](./README.md)

Outil en Ligne de Commande Frontend

Un outil en ligne de commande qui génère automatiquement des définitions de types TypeScript et des fonctions de requête API basées sur Swagger JSON.

## Fonctionnalités

- 🚀 Analyse automatique de la documentation Swagger JSON
- 📦 Génération de fichiers de définition de types TypeScript
- 🔄 Génération de fonctions de requête API typées
- 🎯 Prise en charge des paramètres de chemin, de requête et de corps
- 📝 Génération automatique de définitions de types énumérés
- 🎨 Prise en charge du formatage du code
- ⚡️ Prise en charge du téléchargement de fichiers
- 🛠 Options de génération de code configurables

## Installation

```bash
$ npm install anl -g

$ yarn global add anl
```

## Utilisation

1. Exécuter la commande

```bash
$ anl type
```

2. Configurer le projet

- Lors de la première exécution de `anl type`, un fichier de configuration nommé `an.config.json` sera automatiquement créé dans le répertoire racine du projet (ou peut être créé manuellement)
- Voir la section Configuration pour plus de détails
- Le nom du fichier de configuration ne peut pas être modifié

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

3. Générer les définitions de types TypeScript et les fonctions API en exécutant à nouveau la commande

```bash
$ anl type
```

## Configuration

| Option                   | Type                         | Requis | Description                                  |
| ------------------------ | ---------------------------- | ------ | -------------------------------------------- |
| saveTypeFolderPath       | string                       | Oui    | Chemin de sauvegarde des fichiers de types   |
| saveApiListFolderPath    | string                       | Oui    | Chemin de sauvegarde des fonctions API       |
| saveEnumFolderPath       | string                       | Oui    | Chemin de sauvegarde des énumérations        |
| importEnumPath           | string                       | Oui    | Chemin d'importation des énumérations        |
| swaggerJsonUrl           | string                       | Oui    | URL du document Swagger JSON                 |
| requestMethodsImportPath | string                       | Oui    | Chemin d'importation des méthodes de requête |
| dataLevel                | 'data' \| 'serve' \| 'axios' | Oui    | Niveau de données de réponse                 |
| formatting               | object                       | Non    | Configuration du formatage du code           |
| headers                  | object                       | Non    | Configuration des en-têtes de requête        |

## Structure des Fichiers Générés

project/
├── apps/
│ ├── types/
│ │ ├── models/ # Fichiers de définition de types (sans énumérations)
│ │ ├── connectors/ # Définitions de types API
│ │ └── enums/ # Définitions des types énumérés
│ └── api/
│ ├── fetch.ts # Implémentation des méthodes de requête
│ └── index.ts # Fonctions de requête API

## Exemples de Code Générés

### Fichier de Définition de Type

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

### Fonction de Requête API

```typescript
import { GET } from './fetch';

/**
 * Obtenir les détails de l'utilisateur
 */
export const userDetailGet = (params: UserDetail_GET.Query) => GET<UserDetail_GET.Response>('/user/detail', params);
```

## Caractéristiques

### Analyse des Types

- Prise en charge de tous les types de données OpenAPI 3.0
- Traitement automatique des types imbriqués complexes
- Prise en charge des tableaux, objets, énumérations
- Génération automatique des commentaires d'interface

### Téléchargement de Fichiers

```typescript
export const uploadFile = (params: UploadFile.Body) =>
	POST<UploadFile.Response>('/upload', params, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
```

### Gestion des Erreurs

L'outil intègre un mécanisme complet de gestion des erreurs :

- Messages d'erreur d'analyse
- Avertissements de génération de types
- Gestion des exceptions d'écriture de fichiers

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

## Points Importants

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

## Guide de Contribution

Les Issues et Pull Requests sont les bienvenus !

## Licence

Licence ISC

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
