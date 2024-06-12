# Documentation de l'Application de Suivi en Temps Réel et de Vidéoconférence :
1. [Documentation utilisateur](#1--documentation-utilisateur)
2. [Documentation technique](#2--documentation-technique)


# 1- Documentation utilisateur

## Introduction

Bienvenue dans l'application de suivi en temps réel et de vidéoconférence. Cette application vous permet de partager votre position géographique, d'activer l'accéléromètre de votre appareil et de passer des appels vidéo en temps réel avec d'autres utilisateurs.

## Prérequis

- Un navigateur web compatible avec les technologies de géolocalisation, WebSocket et WebRTC.
- Une connexion internet stable.
- Pour les utilisateurs d'iPhone, l'accès à l'accéléromètre doit être autorisé manuellement.

## Utilisation de l'Application

### Connexion

- Accédez à l'application via l'URL: `https://julien.arcioni.caen.mds-project.fr`.
- Entrez votre nom dans le formulaire et cliquez sur "Submit".

### Partage de la Position

- Une fois connecté, votre position géographique sera automatiquement partagée et affichée sur la carte.
- Les positions des autres utilisateurs connectés seront également visibles.

### Activation de l'Accéléromètre

- A côté de votre nom et vos coordonnées GPS, cliquez sur le bouton "Activer l'accéléromètre". Cela est nécessaire pour les utilisateurs d'iPhone.
- Les données de l'accéléromètre seront alors partagées et affichées sous vos coordonnées. Les personnes connectées pourront voir ces données en temps réel.

### Vidéoconférence

- Une fois connecté, la vidéo de votre appareil sera automatiquement capturée et affichée.
- La connexion WebRTC permet d'établir des appels vidéo en temps réel avec d'autres utilisateurs connectés (en cours).

### Déconnexion

- Fermez simplement l'onglet ou la fenêtre du navigateur pour vous déconnecter.
- Votre position sera automatiquement supprimée de la carte et de la liste des utilisateurs connectés.

## Résolution des Problèmes

### Problèmes de Géolocalisation

- Assurez-vous que la géolocalisation est activée sur votre appareil.
- Vérifiez que vous avez autorisé l'accès à votre position pour cette application.

### Problèmes avec l'Accéléromètre (iPhone)

- Si l'application ne demande pas l'autorisation d'accéder à l'accéléromètre, essayez de cliquer à nouveau sur le bouton "Activer l'accéléromètre".
- Assurez-vous que votre navigateur supporte `DeviceMotionEvent`.

### Problèmes de Connexion Vidéo

- Assurez-vous que votre navigateur supporte WebRTC.
- Vérifiez que vous avez autorisé l'accès à votre caméra et à votre microphone pour cette application.

## Fonctionnalités enn cours de développement

### Accéléromètre
OPTIMISATIONS D'AFFICHAGE

### Visioconférence
EN COURS


# 2- Documentation technique

## Aperçu Général

L'application de suivi en temps réel et de vidéoconférence permet aux utilisateurs de partager leur position géographique et d'engager des appels vidéo. Les utilisateurs peuvent également activer l'accéléromètre pour partager les données de mouvement. L'application utilise WebSockets pour la communication en temps réel et WebRTC pour la vidéoconférence.

## Technologies Utilisées

- **Frontend**: HTML, CSS, JavaScript, Leaflet.js
- **Backend**: Node.js, Express.js, WebSocket, WebRTC, MongoDB

## Architecture

1. **Frontend**:
    - Affiche une carte (Leaflet.js) avec les positions des utilisateurs.
    - Gère les données de géolocalisation et d'accéléromètre.
    - Établit les connexions WebRTC pour la vidéoconférence.

2. **Backend**:
    - Serveur Node.js utilisant Express.js pour servir les fichiers statiques et gérer les requêtes API.
    - Utilisation de WebSocket pour la communication en temps réel des positions et des données de l'accéléromètre.
    - Stockage des positions des utilisateurs dans une base de données MongoDB.

## Structure du Projet

```
app
├── public
│ ├── index.html
│ ├── style.css
│ └── script.js
├── src
│ ├── server.js
│ ├── database.js
│ ├── cleanup.js
│ └── routes
│ └── api.js
├── .env
├── package.json
└── package-lock.json
```

## Configuration

1. **Installation des Dépendances**:
   ```bash
   npm install
    ```

2. **Configuration des Variables d'Environnement**:
 Créez un fichier .env à la racine du projet et définissez les variables suivantes:
    ```
   PORT=3000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```

3. **Démarrage du Serveur**:
   ```bash
    node src/server.js
    ```

## Fonctionnement

### Géolocalisation et WebSocket:
Les utilisateurs soumettent leur nom via un formulaire.
La position géographique de l'utilisateur est récupérée et envoyée au serveur via WebSocket.
Les positions des autres utilisateurs sont affichées sur la carte.

### Accéléromètre:
Les utilisateurs peuvent activer l'accès à l'accéléromètre en cliquant sur un bouton.
Les données de l'accéléromètre sont envoyées au serveur à intervalles réguliers et affichées sous les positions des utilisateurs.

### Vidéo WebRTC:
La vidéo locale est capturée et affichée.
La connexion WebRTC est établie entre les utilisateurs pour les appels vidéo en temps réel.