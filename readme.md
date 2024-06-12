# Application de Suivi en Temps Réel et de Vidéoconférence

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
OPTIMISATIONS

### Visioconférence
EN COURS
