# DPK WhatsApp Telegram Bot

Bot WhatsApp contrôlé depuis Telegram.

## Commandes

/start
/pair
/status
/logout
/help

## Installation

npm install

## Configuration

Créer un fichier `.env` :

BOT_TOKEN=VOTRE_TOKEN
BOT_NAME=DPK
OWNER_IDS=

## Démarrage

npm start

## Pairing

1. Ouvrir le bot Telegram.
2. Utiliser /pair.
3. Envoyer le numéro WhatsApp avec l'indicatif du pays.
4. Exemple : 509XXXXXXXX
5. Le bot affiche le code de pairing.
6. Sur WhatsApp :
   Paramètres → Appareils connectés →
   Connecter un appareil →
   Connecter avec un numéro de téléphone.

## Statut

Utiliser :

/status

## Déconnexion

Utiliser :

/logout

## Sécurité

Ne publiez jamais votre fichier `.env`.

Ne publiez jamais le contenu du dossier `sessions/`.

Le bot doit être utilisé conformément aux règles de WhatsApp et Telegram.