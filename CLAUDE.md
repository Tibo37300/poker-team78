# Poker League — Contexte du projet

## Description
Application web de gestion d'un championnat de poker entre amis.
Responsive mobile-first (max-width 448px). Thème sombre.

## Stack technique
- **Frontend** : React 18 + Vite 8
- **Style** : Tailwind CSS v3 (thème sombre, bg-[#0f1923])
- **Icônes** : lucide-react
- **Graphiques** : Recharts
- **Base de données** : Firebase Firestore (temps réel)
- **Hébergement prévu** : Vercel (gratuit)

## Lancer le projet en local
```bash
cd c:/Users/User/Documents/App_poker_Team78
npm run dev
```
L'app s'ouvre sur http://localhost:5173 (ou port suivant si occupé).

## Structure des fichiers
```
src/
  App.jsx                          # Router principal + LoadingScreen
  firebase.js                      # Config Firebase (lit les variables .env)
  index.css                        # Styles globaux + Tailwind
  store/
    useStore.jsx                   # Store central : Firestore + logique métier
    useStore.backup.jsx            # Sauvegarde de l'ancienne version localStorage
  components/
    HomeView.jsx                   # Page d'accueil — liste des championnats
    ChampionshipForm.jsx           # Formulaire création championnat
    ChampionshipView.jsx           # Dashboard championnat (classement + parties)
    GameForm.jsx                   # Formulaire création d'une partie
    GameDetailView.jsx             # Détail d'une partie
    PlayerDetailView.jsx           # Profil joueur + graphiques
    PasswordModal.jsx              # Modale mot de passe admin
```

## Variables d'environnement
Fichier `.env` à créer à la racine (ne jamais committer) :
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
Voir `.env.example` pour le modèle.

## Structure Firestore
```
/championships/{champId}
    name, totalGames, entryFee, rebuyFee, prizePoolPerPlayer
    adminPassword, players[], createdAt

/championships/{champId}/games/{gameId}
    organizer, date, prizes{first,second,third}
    players[], validated, createdAt
```

## Règles métier importantes
- **Points par classement** : rang n → (14-n) points. 1er=13, 2ème=12, ... 13ème=1, au-delà=0
- **Bonus kills** : top killer unique → +2pts | 2ème killer → +1pt | ex-aequo au top → +1pt chacun
- **Gains** = prize gagné − entryFee − (rebuys × rebuyFee)
- Une partie doit être **validée** par l'admin pour compter dans le classement
- Les joueurs sont **pré-inscrits au championnat** (liste définie à la création)
- À chaque partie, on peut marquer un joueur comme **Absent** (ne compte pas dans cette partie)

## Système d'authentification admin
- Mot de passe défini à la création du championnat (stocké en clair dans Firestore)
- Session admin stockée dans `sessionStorage` avec la clé `admin_champ_{id}`
- Actions protégées : créer une partie, valider une partie, supprimer une partie
- Les autres utilisateurs ont accès en **lecture seule**

## État d'avancement
- [x] Création de championnat avec joueurs inscrits et mot de passe admin
- [x] Création de parties avec gestion des absents, kills, recaves
- [x] Calcul automatique des points et gains
- [x] Validation de partie par l'admin
- [x] Dashboard classement avec tableau et clic sur joueur
- [x] Détail joueur : stats + graphiques (points cumulés / gains)
- [x] Migration localStorage → Firebase Firestore
- [ ] Déploiement Vercel (en cours — fichier .env à configurer)
- [ ] Règles de sécurité Firestore à durcir après tests (actuellement en mode test)

## Prochaines étapes prévues
1. L'utilisateur doit créer son projet Firebase et renseigner le fichier `.env`
2. Tester l'app en local avec Firebase
3. Déployer sur Vercel en ajoutant les variables d'env dans l'interface Vercel
4. Optionnel : durcir les règles Firestore (read: public, write: restreint)

## Décisions de conception
- Pas de système d'authentification Firebase Auth → mot de passe simple géré dans l'app
- Les données sont partagées en temps réel via Firestore `onSnapshot`
- L'interface est pensée mobile-first mais fonctionne aussi sur desktop
- Pas de backend custom (serverless Firestore suffit)
