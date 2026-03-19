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
- **Hébergement** : Vercel — https://poker-team78.vercel.app
- **GitHub** : https://github.com/Tibo37300/poker-team78

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
    HomeView.jsx                   # Page d'accueil — liste des championnats + footer
    ChampionshipForm.jsx           # Formulaire création championnat
    ChampionshipView.jsx           # Dashboard championnat (classement + parties + cagnotte)
    GameForm.jsx                   # Formulaire création d'une partie
    GameDetailView.jsx             # Détail d'une partie
    PlayerDetailView.jsx           # Profil joueur + graphiques
    PasswordModal.jsx              # Modale mot de passe admin
```

## Variables d'environnement
Fichier `.env` à la racine (ne jamais committer) — projet Firebase : pokerteam78-a1231
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Structure Firestore
```
/championships/{champId}
    name, totalGames, entryFee, rebuyFee, prizePoolPerPlayer
    cagnottePercent1, cagnottePercent2, cagnottePercent3
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

## Règles de classement championnat
1. **Seules les 11 meilleures parties** sont retenues par joueur (sur 13 max)
2. **Bonus kills conservés** même si la partie est éliminée du total
3. **Départage à égalité** : victoires → podiums → total kills sur l'année

## Onglet Cagnotte
- Cagnotte par partie = `prizePoolPerPlayer × nb joueurs présents`
- Cagnotte totale = cumul de toutes les parties validées
- Répartition définie à la création : `cagnottePercent1/2/3` (doit totaliser 100%)
- Affichage : courbe évolution + montants promis au top 3 du classement actuel

## Système d'authentification admin
- Mot de passe défini à la création du championnat (stocké en clair dans Firestore)
- Session admin stockée dans `sessionStorage` avec la clé `admin_champ_{id}`
- Actions protégées : créer une partie, valider une partie, supprimer une partie
- Les autres utilisateurs ont accès en **lecture seule**

## Firebase
- Projet : **PokerTeam78** (pokerteam78-a1231)
- Région Firestore : eur3 (europe-west)
- Règles : lecture/écriture ouvertes sans expiration (sécurité gérée par mot de passe admin dans l'app)

## État d'avancement
- [x] Création de championnat avec joueurs inscrits et mot de passe admin
- [x] Création de parties avec gestion des absents, kills, recaves
- [x] Calcul automatique des points et gains
- [x] Validation de partie par l'admin
- [x] Dashboard classement avec tableau et clic sur joueur
- [x] Détail joueur : stats + graphiques (points cumulés / gains)
- [x] Migration localStorage → Firebase Firestore
- [x] Déploiement Vercel (https://poker-team78.vercel.app)
- [x] Règles Firestore permanentes (sans expiration)
- [x] Règles classement : 11 meilleures parties, bonus kills conservés, départage
- [x] Onglet Cagnotte : courbe évolution + répartition top 3
- [x] Titre page : "Poker League Management"
- [x] Footer © 2026 Team78 by Thibaut MAS
- [x] Simulateur suppression N pires scores (0/1/2) dans l'onglet Classement
- [x] Absences comptent comme 0 pts en mode simulation
- [x] Courbe joueur part de l'origine (0,0)
- [x] Chargement des parties de tous les championnats au démarrage (compte correct sur HomeView)
- [x] Onglet Killers : classement par kills totaux + bonus pts kill + ratio /partie
- [x] GameDetailView : affichage du pot total calculé (inscriptions + recaves) dans le bloc Gains
- [x] GameForm onglet Gains : pot total saisi (vert/rouge vs pot calculé) + montants suggérés par %
- [x] GameForm : classement et recaves via listes déroulantes (UX mobile)
- [x] Barre d'onglets championship scrollable horizontalement sur mobile (scrollbar cachée)
- [x] Modification partie validée protégée par mot de passe admin

## Détails techniques récents

### computeStandings (useStore.jsx)
- Retourne `totalBonusPoints` par joueur (somme des bonusPoints de toutes les parties réelles)
- `dropCount=null` → règle auto 11 meilleures parties
- `dropCount=1|2` → simulation avec absences comptées comme 0 pts

### GameForm — onglet Gains
- `potCalcule` = `nb présents × entryFee + totalRebuys × rebuyFee`
- `potRenseigne` = somme des 3 montants saisis
- Fond vert si égaux, rouge si différents, montant calculé affiché en sous-titre si différent
- Montants suggérés via `cagnottePercent1/2/3` du championnat

### Onglet Killers (ChampionshipView)
- Filtre les joueurs avec kills > 0, triés par kills desc
- Top killer : fond rouge + icône 💀
- Affiche : kills totaux, ratio /partie, bonus pts kill (en jaune)

## Décisions de conception
- Pas de système d'authentification Firebase Auth → mot de passe simple géré dans l'app
- Les données sont partagées en temps réel via Firestore `onSnapshot`
- L'interface est pensée mobile-first mais fonctionne aussi sur desktop
- Pas de backend custom (serverless Firestore suffit)
- Pour mettre à jour l'app en prod : `git add`, `git commit`, `git push origin main` → Vercel redéploie automatiquement
