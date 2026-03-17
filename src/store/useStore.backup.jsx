import { createContext, useContext, useReducer, useEffect } from 'react';

const STORAGE_KEY = 'poker_championship_data';

const initialState = {
  championships: [],
  currentChampionshipId: null,
  view: 'home', // 'home' | 'create-championship' | 'championship' | 'create-game' | 'game-detail' | 'player-detail'
  selectedGameId: null,
  selectedPlayerId: null,
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...initialState, ...parsed, view: 'home', selectedGameId: null, selectedPlayerId: null };
    }
  } catch (e) {}
  return initialState;
}

function saveState(state) {
  try {
    const toSave = { championships: state.championships, currentChampionshipId: state.currentChampionshipId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {}
}

function calculateGamePoints(players) {
  // Sort by kills to find top killers
  const sorted = [...players].sort((a, b) => b.kills - a.kills);
  const topKillerKills = sorted[0]?.kills || 0;
  const secondKillerKills = sorted[1]?.kills || 0;

  return players.map(player => {
    const rankPoints = Math.max(14 - player.rank, 0);
    let bonusPoints = 0;

    if (topKillerKills > 0 && player.kills === topKillerKills) {
      // Check if multiple players share the top
      const topKillers = players.filter(p => p.kills === topKillerKills);
      if (topKillers.length === 1) {
        bonusPoints = 2;
      } else {
        bonusPoints = 1; // shared top
      }
    } else if (secondKillerKills > 0 && player.kills === secondKillerKills) {
      const topKillers = players.filter(p => p.kills === topKillerKills);
      if (topKillers.length === 1) {
        bonusPoints = 1;
      }
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

function computeStandings(championship) {
  const playerMap = {};

  championship.games.filter(g => g.validated).forEach(game => {
    game.players.forEach(player => {
      if (!playerMap[player.name]) {
        playerMap[player.name] = {
          name: player.name,
          totalPoints: 0,
          totalEarnings: 0,
          wins: 0,
          secondPlaces: 0,
          thirdPlaces: 0,
          gamesPlayed: 0,
          kills: 0,
        };
      }
      const s = playerMap[player.name];
      s.totalPoints += player.points || 0;
      s.totalEarnings += player.earnings || 0;
      s.gamesPlayed += 1;
      s.kills += player.kills || 0;
      if (player.rank === 1) s.wins += 1;
      else if (player.rank === 2) s.secondPlaces += 1;
      else if (player.rank === 3) s.thirdPlaces += 1;
    });
  });

  return Object.values(playerMap).sort((a, b) => b.totalPoints - a.totalPoints);
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.view, selectedGameId: action.gameId ?? state.selectedGameId, selectedPlayerId: action.playerId ?? state.selectedPlayerId };

    case 'CREATE_CHAMPIONSHIP': {
      const championship = {
        id: Date.now().toString(),
        ...action.data,
        games: [],
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        championships: [...state.championships, championship],
        currentChampionshipId: championship.id,
        view: 'championship',
      };
    }

    case 'SET_CURRENT_CHAMPIONSHIP':
      return { ...state, currentChampionshipId: action.id, view: 'championship' };

    case 'DELETE_CHAMPIONSHIP':
      return {
        ...state,
        championships: state.championships.filter(c => c.id !== action.id),
        currentChampionshipId: state.currentChampionshipId === action.id ? null : state.currentChampionshipId,
        view: state.currentChampionshipId === action.id ? 'home' : state.view,
      };

    case 'CREATE_GAME': {
      const championship = state.championships.find(c => c.id === state.currentChampionshipId);
      if (!championship) return state;

      const playersWithPoints = calculateGamePoints(action.data.players);
      const playersWithEarnings = playersWithPoints.map(p => ({
        ...p,
        earnings: calculateEarnings(p, action.data, championship),
      }));

      const game = {
        id: Date.now().toString(),
        ...action.data,
        players: playersWithEarnings,
        validated: false,
        createdAt: new Date().toISOString(),
      };

      const updatedChampionships = state.championships.map(c =>
        c.id === state.currentChampionshipId
          ? { ...c, games: [...c.games, game] }
          : c
      );

      return { ...state, championships: updatedChampionships, view: 'championship' };
    }

    case 'VALIDATE_GAME': {
      const updatedChampionships = state.championships.map(c => {
        if (c.id !== state.currentChampionshipId) return c;
        const updatedGames = c.games.map(g =>
          g.id === action.gameId ? { ...g, validated: true } : g
        );
        return { ...c, games: updatedGames };
      });
      return { ...state, championships: updatedChampionships };
    }

    case 'DELETE_GAME': {
      const updatedChampionships = state.championships.map(c => {
        if (c.id !== state.currentChampionshipId) return c;
        return { ...c, games: c.games.filter(g => g.id !== action.gameId) };
      });
      return { ...state, championships: updatedChampionships };
    }

    default:
      return state;
  }
}

import React from 'react';
const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const getCurrentChampionship = () =>
    state.championships.find(c => c.id === state.currentChampionshipId);

  const getStandings = (championshipId) => {
    const champ = state.championships.find(c => c.id === (championshipId || state.currentChampionshipId));
    if (!champ) return [];
    return computeStandings(champ);
  };

  const getPlayerHistory = (playerName, championshipId) => {
    const champ = state.championships.find(c => c.id === (championshipId || state.currentChampionshipId));
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
