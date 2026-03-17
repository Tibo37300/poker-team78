import React from 'react';
import { StoreProvider, useStore } from './store/useStore';
import HomeView from './components/HomeView';
import ChampionshipForm from './components/ChampionshipForm';
import ChampionshipView from './components/ChampionshipView';
import GameForm from './components/GameForm';
import GameDetailView from './components/GameDetailView';
import PlayerDetailView from './components/PlayerDetailView';
import './index.css';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0f1923] flex flex-col items-center justify-center gap-4">
      <div className="text-4xl animate-pulse">♠ ♥ ♦ ♣</div>
      <p className="text-gray-400 text-sm">Chargement...</p>
    </div>
  );
}

function Router() {
  const { state } = useStore();

  if (state.loading) return <LoadingScreen />;

  switch (state.view) {
    case 'home':             return <HomeView />;
    case 'create-championship': return <ChampionshipForm />;
    case 'championship':    return <ChampionshipView />;
    case 'create-game':     return <GameForm />;
    case 'game-detail':     return <GameDetailView />;
    case 'player-detail':   return <PlayerDetailView />;
    default:                return <HomeView />;
  }
}

export default function App() {
  return (
    <StoreProvider>
      <div className="max-w-md mx-auto min-h-screen relative overflow-x-hidden">
        <Router />
      </div>
    </StoreProvider>
  );
}
