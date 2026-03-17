import React, { createContext, useContext, useReducer, useState, useEffect, useCallback } from 'react';
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, serverTimestamp, query, orderBy, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Point calculation helpers ────────────────────────────────────────────────

function calculateGamePoints(players) {
  const sorted = [...players].sort((a, b) => b.kills - a.kills);
  const topKillerKills = sorted[0]?.kills || 0;
  const secondKillerKills = sorted[1]?.kills || 0;

  return players.map(player => {
    const rankPoints = Math.max(14 - player.rank, 0);
    let bonusPoints = 0;

    if (topKillerKills > 0 && player.kills === topKillerKills) {
      const topKillers = players.filter(p => p.kills === topKillerKills);
      bonusPoints = topKillers.length === 1 ? 2 : 1;
    } else if (secondKillerKills > 0 && player.kills === secondKillerKills) {
      const topKillers = players.filter(p => p.kills === topKillerKills);
      if (topKillers.length === 1) bonusPoints = 1;
    }

    return { ...player, points: rankPoints + bonusPoints, bonusPoints };
  });
}

function calculateEarnings(player, game, championship) {
  const cost = championship.entryFee + player.rebuys * championship.rebuyFee;
  let prize = 0;
  if (player.rank === 1) prize = game.prizes.first;
  else if (player.rank === 2) prize = game.prizes.second;
  else if (player.rank === 3) prize = game.prizes.third;
  return prize - cost;
}

function computeStandings(games) {
  const playerMap = {};

  // Collect all game results per player
  games.filter(g => g.validated).forEach(game => {
    game.players.forEach(player => {
      if (!playerMap[player.name]) {
        playerMap[player.name] = { name: player.name, gameResults: [] };
      }
      playerMap[player.name].gameResults.push({
        totalPoints: player.points || 0,
        bonusPoints: player.bonusPoints || 0,
        rank: player.rank,
        kills: player.kills || 0,
        earnings: player.earnings || 0,
      });
    });
  });

  return Object.values(playerMap).map(({ name, gameResults }) => {
    const gamesPlayed = gameResults.length;

    // Règle 1 : seules les 11 meilleures parties comptent
    const sorted = [...gameResults].sort((a, b) => a.totalPoints - b.totalPoints);
    const gamesToDrop = Math.max(0, gamesPlayed - 11);
    const droppedGames = sorted.slice(0, gamesToDrop);
    const keptGames = sorted.slice(gamesToDrop);

    // Règle 2 : les bonus kills des parties éliminées sont conservés
    const pointsFromKept = keptGames.reduce((sum, g) => sum + g.totalPoints, 0);
    const bonusFromDropped = droppedGames.reduce((sum, g) => sum + g.bonusPoints, 0);
    const totalPoints = pointsFromKept + bonusFromDropped;

    // Stats globales (toutes parties)
    const wins = gameResults.filter(g => g.rank === 1).length;
    const secondPlaces = gameResults.filter(g => g.rank === 2).length;
    const thirdPlaces = gameResults.filter(g => g.rank === 3).length;
    const kills = gameResults.reduce((sum, g) => sum + g.kills, 0);
    const totalEarnings = gameResults.reduce((sum, g) => sum + g.earnings, 0);

    return { name, totalPoints, totalEarnings, wins, secondPlaces, thirdPlaces, gamesPlayed, kills };
  }).sort((a, b) => {
    // Règle 3 : départage en cas d'égalité
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    const podiumA = a.wins + a.secondPlaces + a.thirdPlaces;
    const podiumB = b.wins + b.secondPlaces + b.thirdPlaces;
    if (podiumB !== podiumA) return podiumB - podiumA;
    return b.kills - a.kills;
  });
}

// ─── UI state (navigation only) ───────────────────────────────────────────────

const initialUI = {
  view: 'home',
  currentChampionshipId: null,
  selectedGameId: null,
  selectedPlayerId: null,
};

function uiReducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW':
      return {
        ...state,
        view: action.view,
        selectedGameId: action.gameId ?? state.selectedGameId,
        selectedPlayerId: action.playerId ?? state.selectedPlayerId,
      };
    case 'SET_CURRENT_CHAMPIONSHIP':
      return { ...state, currentChampionshipId: action.id, view: 'championship' };
    case 'GO_HOME':
      return { ...initialUI };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [ui, dispatchUI] = useReducer(uiReducer, initialUI);
  const [championships, setChampionships] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener on championships + their games
  useEffect(() => {
    const q = query(collection(db, 'championships'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setChampionships(prev => {
        const updated = snapshot.docs.map(champDoc => {
          const existing = prev.find(c => c.id === champDoc.id);
          return {
            id: champDoc.id,
            ...champDoc.data(),
            games: existing?.games || [],
          };
        });
        return updated;
      });
      setLoading(false);
    }, (err) => {
      console.error('Firestore error:', err);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Real-time listener on games for current championship
  useEffect(() => {
    if (!ui.currentChampionshipId) return;
    const q = query(
      collection(db, 'championships', ui.currentChampionshipId, 'games'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const games = snapshot.docs.map(g => ({ id: g.id, ...g.data() }));
      setChampionships(prev =>
        prev.map(c =>
          c.id === ui.currentChampionshipId ? { ...c, games } : c
        )
      );
    });
    return unsub;
  }, [ui.currentChampionshipId]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const dispatch = useCallback(async (action) => {
    switch (action.type) {

      case 'SET_VIEW':
        dispatchUI(action);
        break;

      case 'SET_CURRENT_CHAMPIONSHIP':
        dispatchUI(action);
        break;

      case 'GO_HOME':
        dispatchUI({ type: 'GO_HOME' });
        break;

      case 'CREATE_CHAMPIONSHIP': {
        const ref = await addDoc(collection(db, 'championships'), {
          ...action.data,
          createdAt: serverTimestamp(),
        });
        dispatchUI({ type: 'SET_CURRENT_CHAMPIONSHIP', id: ref.id });
        break;
      }

      case 'UPDATE_CHAMPIONSHIP_PERCENTS': {
        const champRef = doc(db, 'championships', action.id);
        await updateDoc(champRef, {
          cagnottePercent1: action.p1,
          cagnottePercent2: action.p2,
          cagnottePercent3: action.p3,
        });
        break;
      }

      case 'DELETE_CHAMPIONSHIP': {
        const gamesSnap = await getDocs(collection(db, 'championships', action.id, 'games'));
        await Promise.all(gamesSnap.docs.map(g => deleteDoc(g.ref)));
        await deleteDoc(doc(db, 'championships', action.id));
        if (ui.currentChampionshipId === action.id) {
          dispatchUI({ type: 'GO_HOME' });
        }
        break;
      }

      case 'CREATE_GAME': {
        const champ = championships.find(c => c.id === ui.currentChampionshipId);
        if (!champ) break;

        const playersWithPoints = calculateGamePoints(action.data.players);
        const playersWithEarnings = playersWithPoints.map(p => ({
          ...p,
          earnings: calculateEarnings(p, action.data, champ),
        }));

        await addDoc(collection(db, 'championships', ui.currentChampionshipId, 'games'), {
          ...action.data,
          players: playersWithEarnings,
          validated: false,
          createdAt: serverTimestamp(),
        });
        dispatchUI({ type: 'SET_VIEW', view: 'championship' });
        break;
      }

      case 'VALIDATE_GAME': {
        const gameRef = doc(db, 'championships', ui.currentChampionshipId, 'games', action.gameId);
        await updateDoc(gameRef, { validated: true });
        break;
      }

      case 'DELETE_GAME': {
        const gameRef = doc(db, 'championships', ui.currentChampionshipId, 'games', action.gameId);
        await deleteDoc(gameRef);
        break;
      }

      default:
        break;
    }
  }, [championships, ui.currentChampionshipId]);

  // ── Selectors ──────────────────────────────────────────────────────────────

  const getCurrentChampionship = useCallback(() =>
    championships.find(c => c.id === ui.currentChampionshipId),
    [championships, ui.currentChampionshipId]
  );

  const getStandings = useCallback((championshipId) => {
    const champ = championships.find(c => c.id === (championshipId || ui.currentChampionshipId));
    if (!champ) return [];
    return computeStandings(champ.games);
  }, [championships, ui.currentChampionshipId]);

  const getPlayerHistory = useCallback((playerName, championshipId) => {
    const champ = championships.find(c => c.id === (championshipId || ui.currentChampionshipId));
    if (!champ) return [];
    return champ.games
      .filter(g => g.validated)
      .map(game => {
        const playerData = game.players.find(p => p.name === playerName);
        return {
          gameId: game.id,
          date: game.date,
          organizer: game.organizer,
          participated: !!playerData,
          ...playerData,
        };
      });
  }, [championships, ui.currentChampionshipId]);

  // Backward-compatible state object
  const state = {
    championships,
    currentChampionshipId: ui.currentChampionshipId,
    view: ui.view,
    selectedGameId: ui.selectedGameId,
    selectedPlayerId: ui.selectedPlayerId,
    loading,
  };

  return (
    <StoreContext.Provider value={{ state, dispatch, getCurrentChampionship, getStandings, getPlayerHistory }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
