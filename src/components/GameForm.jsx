import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ArrowLeft, Plus, Trash2, UserPlus, Trophy, Sword, RefreshCw, UserX } from 'lucide-react';

function makePlayer(name, rank) {
  return { name, rank, rebuys: 0, kills: 0, killedPlayers: [], absent: false };
}

export default function GameForm({ editMode = false }) {
  const { state, dispatch, getCurrentChampionship } = useStore();
  const champ = getCurrentChampionship();

  // In edit mode, pre-populate from existing game
  const editGame = editMode ? champ?.games.find(g => g.id === state.selectedGameId) : null;

  const initialPlayers = editGame
    ? (champ?.players || []).map(name => {
        const existing = editGame.players.find(p => p.name === name);
        return existing ? { ...existing, absent: false } : { ...makePlayer(name, 1), absent: true };
      })
    : champ?.players?.length > 0
      ? champ.players.map((name, i) => makePlayer(name, i + 1))
      : [makePlayer('', 1)];

  const [form, setForm] = useState({
    organizer: editGame?.organizer || '',
    date: editGame?.date || new Date().toISOString().split('T')[0],
    players: initialPlayers,
    prizes: editGame?.prizes || { first: 0, second: 0, third: 0 },
  });
  const [activeTab, setActiveTab] = useState('infos');

  if (!champ) return null;

  const presentPlayers = form.players.filter(p => !p.absent);

  const updatePlayer = (idx, field, value) => {
    setForm(f => ({
      ...f,
      players: f.players.map((p, i) => i === idx ? { ...p, [field]: value } : p),
    }));
  };

  const toggleAbsent = (idx) => {
    setForm(f => ({
      ...f,
      players: f.players.map((p, i) => i === idx ? { ...p, absent: !p.absent } : p),
    }));
  };

  const addKilledPlayer = (idx, killed) => {
    if (!killed.trim()) return;
    setForm(f => ({
      ...f,
      players: f.players.map((p, i) => {
        if (i !== idx) return p;
        if (p.killedPlayers.includes(killed)) return p;
        return { ...p, killedPlayers: [...p.killedPlayers, killed], kills: p.killedPlayers.length + 1 };
      }),
    }));
  };

  const removeKilledPlayer = (idx, killed) => {
    setForm(f => ({
      ...f,
      players: f.players.map((p, i) => {
        if (i !== idx) return p;
        const newKilled = p.killedPlayers.filter(k => k !== killed);
        return { ...p, killedPlayers: newKilled, kills: newKilled.length };
      }),
    }));
  };

  const addPlayer = () => {
    setForm(f => ({
      ...f,
      players: [...f.players, makePlayer('', f.players.filter(p => !p.absent).length + 1)],
    }));
  };

  const removePlayer = (idx) => {
    setForm(f => ({
      ...f,
      players: f.players.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = () => {
    if (!form.organizer.trim()) { alert("Veuillez entrer le nom de l'organisateur"); return; }
    const present = form.players.filter(p => !p.absent);
    if (present.some(p => !p.name.trim())) { alert('Tous les joueurs présents doivent avoir un nom'); return; }
    const ranks = present.map(p => Number(p.rank));
    const uniqueRanks = new Set(ranks);
    if (uniqueRanks.size !== ranks.length) { alert('Chaque joueur présent doit avoir un classement unique'); return; }

    const data = {
      organizer: form.organizer,
      date: form.date,
      players: present.map(p => ({
        name: p.name.trim(),
        rank: Number(p.rank),
        rebuys: Number(p.rebuys),
        kills: Number(p.kills),
        killedPlayers: p.killedPlayers,
      })),
      prizes: {
        first: Number(form.prizes.first),
        second: Number(form.prizes.second),
        third: Number(form.prizes.third),
      },
    };

    if (editMode && editGame) {
      dispatch({ type: 'UPDATE_GAME', gameId: editGame.id, data });
    } else {
      dispatch({ type: 'CREATE_GAME', data });
    }
  };

  const absentCount = form.players.filter(p => p.absent).length;
  const tabs = [
    { id: 'infos', label: 'Infos', icon: '📋' },
    { id: 'players', label: `Joueurs (${presentPlayers.length}/${form.players.length})`, icon: '👥' },
    { id: 'prizes', label: 'Gains', icon: '🏆' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1923] to-[#1a2d1e]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pt-6">
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'championship' })}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{editMode ? 'Modifier la partie' : 'Nouvelle Partie'}</h1>
          <p className="text-xs text-gray-400">{champ.name}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-4 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-green-400 text-green-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4 pb-32">

        {/* INFOS TAB */}
        {activeTab === 'infos' && (
          <div className="space-y-4">
            <div className="bg-[#1e2d3d]/80 rounded-xl p-4 border border-white/10 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Organisateur *
                </label>
                <input
                  type="text"
                  value={form.organizer}
                  onChange={e => setForm(f => ({ ...f, organizer: e.target.value }))}
                  placeholder="Nom de l'organisateur"
                  className="w-full bg-transparent text-white placeholder-gray-600 text-base outline-none border-b border-white/20 pb-1 focus:border-green-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="bg-[#0f1923] text-white rounded-lg px-3 py-2 outline-none border border-white/20 focus:border-green-400 transition-colors"
                />
              </div>
            </div>

            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4">
              <p className="text-yellow-400 text-sm font-semibold mb-1">Rappel des frais</p>
              <p className="text-gray-400 text-xs">Inscription: {champ.entryFee}€ | Recave: {champ.rebuyFee}€</p>
              <p className="text-gray-400 text-xs">Cagnotte: {champ.prizePoolPerPlayer}€/joueur</p>
            </div>

            {absentCount > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                <p className="text-orange-400 text-sm font-semibold">
                  {absentCount} joueur{absentCount > 1 ? 's' : ''} absent{absentCount > 1 ? 's' : ''}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {form.players.filter(p => p.absent).map(p => p.name).join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* PLAYERS TAB */}
        {activeTab === 'players' && (
          <div className="space-y-3">
            {/* Absent players first (collapsed at bottom) */}
            {form.players.map((player, idx) => (
              <PlayerCard
                key={idx}
                player={player}
                idx={idx}
                totalPresent={presentPlayers.length}
                allPresentNames={presentPlayers.map(p => p.name)}
                onUpdate={(field, value) => updatePlayer(idx, field, value)}
                onRemove={() => removePlayer(idx)}
                onToggleAbsent={() => toggleAbsent(idx)}
                onAddKilled={(name) => addKilledPlayer(idx, name)}
                onRemoveKilled={(name) => removeKilledPlayer(idx, name)}
                canRemove={!champ.players?.includes(player.name)} // can remove extra players
              />
            ))}
            <button
              onClick={addPlayer}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-white/20 hover:border-green-400/50 text-gray-400 hover:text-green-400 py-3 rounded-xl transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter un joueur supplémentaire
            </button>
          </div>
        )}

        {/* PRIZES TAB */}
        {activeTab === 'prizes' && (() => {
          const totalRebuys = presentPlayers.reduce((sum, p) => sum + Number(p.rebuys || 0), 0);
          const potCalcule = presentPlayers.length * (champ.entryFee || 0) + totalRebuys * (champ.rebuyFee || 0);
          const potRenseigne = Number(form.prizes.first) + Number(form.prizes.second) + Number(form.prizes.third);
          const potMatch = potCalcule > 0 && potRenseigne === potCalcule;
          const potMismatch = potRenseigne !== potCalcule;
          const suggested1 = Math.round(potCalcule * (champ.cagnottePercent1 || 0) / 100);
          const suggested2 = Math.round(potCalcule * (champ.cagnottePercent2 || 0) / 100);
          const suggested3 = Math.round(potCalcule * (champ.cagnottePercent3 || 0) / 100);
          return (
          <div className="space-y-4">
            <div className="bg-[#1e2d3d]/80 rounded-xl p-4 border border-white/10 space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Gains de la partie
              </h3>

              {/* Pot total banner */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pot total</span>
                  {potCalcule > 0 && potMismatch && (
                    <span className="text-xs text-red-400 mt-0.5">calculé : {potCalcule}€</span>
                  )}
                </div>
                <div className={`flex items-center gap-1 rounded-lg px-3 py-2 flex-shrink-0 ${
                  potMatch ? 'bg-green-600' : potMismatch && potRenseigne > 0 ? 'bg-red-600' : 'bg-[#0f1923]'
                }`}>
                  <span className="block text-white text-right w-20 font-semibold">{potRenseigne}</span>
                  <span className="text-white/70 text-sm">€</span>
                </div>
              </div>

              <PrizeField
                rank={1} emoji="🥇" value={form.prizes.first}
                suggested={suggested1} percent={champ.cagnottePercent1}
                onChange={v => setForm(f => ({ ...f, prizes: { ...f.prizes, first: v } }))}
              />
              <PrizeField
                rank={2} emoji="🥈" value={form.prizes.second}
                suggested={suggested2} percent={champ.cagnottePercent2}
                onChange={v => setForm(f => ({ ...f, prizes: { ...f.prizes, second: v } }))}
              />
              <PrizeField
                rank={3} emoji="🥉" value={form.prizes.third}
                suggested={suggested3} percent={champ.cagnottePercent3}
                onChange={v => setForm(f => ({ ...f, prizes: { ...f.prizes, third: v } }))}
              />
            </div>

            {presentPlayers.length > 0 && (
              <div className="bg-[#1e2d3d]/80 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Aperçu des coûts (joueurs présents)
                </h3>
                {presentPlayers.map((p, i) => {
                  const cost = champ.entryFee + p.rebuys * champ.rebuyFee;
                  let prize = 0;
                  if (p.rank == 1) prize = Number(form.prizes.first);
                  else if (p.rank == 2) prize = Number(form.prizes.second);
                  else if (p.rank == 3) prize = Number(form.prizes.third);
                  const net = prize - cost;
                  return (
                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-sm text-gray-300">{p.name || `Joueur ${i+1}`}</span>
                      <div className="flex gap-3 text-xs">
                        <span className="text-gray-500">-{cost}€</span>
                        <span className={net >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                          {net >= 0 ? '+' : ''}{net}€
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          );
        })()}
      </div>

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f1923] via-[#0f1923]/95 to-transparent">
        <button
          onClick={handleSubmit}
          className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-green-900/50 flex items-center justify-center gap-2"
        >
          <Trophy className="w-5 h-5" />
          {editMode ? 'Enregistrer les modifications' : `Enregistrer la partie (${presentPlayers.length} joueurs)`}
        </button>
      </div>
    </div>
  );
}

function PlayerCard({ player, idx, totalPresent, allPresentNames, onUpdate, onRemove, onToggleAbsent, onAddKilled, onRemoveKilled, canRemove }) {
  const [expanded, setExpanded] = useState(false);
  const [killedInput, setKilledInput] = useState('');

  const otherPlayers = allPresentNames.filter((n, i) => n && n !== player.name && !player.killedPlayers.includes(n));

  if (player.absent) {
    return (
      <div className="bg-[#1e2d3d]/40 rounded-xl border border-white/5 overflow-hidden opacity-60">
        <div className="flex items-center gap-3 p-3">
          <div className="bg-orange-500/20 rounded-lg w-9 h-9 flex items-center justify-center flex-shrink-0">
            <UserX className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-400 font-medium truncate">{player.name || `Joueur ${idx + 1}`}</p>
            <p className="text-xs text-orange-400">Absent</p>
          </div>
          <button
            onClick={onToggleAbsent}
            className="text-xs bg-orange-500/20 hover:bg-green-600/20 text-orange-400 hover:text-green-400 border border-orange-500/30 hover:border-green-500/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            Présent
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1e2d3d]/80 rounded-xl border border-white/10 overflow-hidden">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="bg-green-600/20 rounded-lg w-9 h-9 flex items-center justify-center flex-shrink-0">
          <span className="text-green-400 font-bold text-sm">#{idx + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">
            {player.name || <span className="text-gray-500">Joueur {idx + 1}</span>}
          </p>
          <p className="text-xs text-gray-500">
            {player.rank}ème · {player.rebuys} recave(s) · {player.kills} kill(s)
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleAbsent(); }}
          className="text-xs text-gray-600 hover:text-orange-400 border border-white/10 hover:border-orange-400/30 px-2 py-1 rounded-lg transition-colors mr-1"
          title="Marquer absent"
        >
          <UserX className="w-3.5 h-3.5" />
        </button>
        <span className="text-gray-600 text-xs">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="border-t border-white/10 p-3 space-y-3">
          {/* Name — only editable if it's an extra player (not from championship roster) */}
          {!player.name || canRemove ? (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nom du joueur</label>
              <input
                type="text"
                value={player.name}
                onChange={e => onUpdate('name', e.target.value)}
                placeholder="Prénom Nom"
                className="w-full bg-[#0f1923] text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm outline-none border border-white/10 focus:border-green-400 transition-colors"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 py-1">
              <span className="text-green-400">👤</span>
              <span className="text-white font-semibold">{player.name}</span>
              <span className="text-xs text-gray-500 ml-auto">Inscrit au championnat</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Classement</label>
              <select
                value={player.rank}
                onChange={e => onUpdate('rank', e.target.value)}
                className="w-full bg-[#0f1923] text-white rounded-lg px-2 py-2 text-sm text-center outline-none border border-white/10 focus:border-green-400 transition-colors"
              >
                {Array.from({ length: totalPresent }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Recaves</label>
              <select
                value={player.rebuys}
                onChange={e => onUpdate('rebuys', e.target.value)}
                className="w-full bg-[#0f1923] text-white rounded-lg px-2 py-2 text-sm text-center outline-none border border-white/10 focus:border-green-400 transition-colors"
              >
                {Array.from({ length: 11 }, (_, i) => i).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Kills</label>
              <div className="w-full bg-[#0f1923] text-white rounded-lg px-2 py-2 text-sm text-center border border-white/10">
                {player.kills}
              </div>
            </div>
          </div>

          {/* Killed players */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Joueurs éliminés</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {player.killedPlayers.map(name => (
                <span
                  key={name}
                  className="flex items-center gap-1 bg-red-900/30 border border-red-500/30 text-red-400 text-xs px-2 py-1 rounded-full"
                >
                  {name}
                  <button onClick={() => onRemoveKilled(name)} className="hover:text-red-200">×</button>
                </span>
              ))}
            </div>

            {otherPlayers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {otherPlayers.map(name => (
                  <button
                    key={name}
                    onClick={() => onAddKilled(name)}
                    className="text-xs bg-white/5 hover:bg-red-900/20 text-gray-400 hover:text-red-400 px-2 py-1 rounded-full border border-white/10 hover:border-red-500/30 transition-colors"
                  >
                    + {name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={killedInput}
                onChange={e => setKilledInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { onAddKilled(killedInput); setKilledInput(''); }
                }}
                placeholder="Autre joueur éliminé..."
                className="flex-1 bg-[#0f1923] text-white placeholder-gray-600 rounded-lg px-3 py-2 text-xs outline-none border border-white/10 focus:border-green-400 transition-colors"
              />
              <button
                onClick={() => { onAddKilled(killedInput); setKilledInput(''); }}
                className="bg-green-600/30 hover:bg-green-600/50 text-green-400 rounded-lg px-3 py-2 text-xs transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {canRemove && (
            <button
              onClick={onRemove}
              className="w-full flex items-center justify-center gap-1 text-xs text-red-400/70 hover:text-red-400 py-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Supprimer ce joueur
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PrizeField({ rank, emoji, value, onChange, suggested, percent }) {
  const labels = { 1: '1ère place', 2: '2ème place', 3: '3ème place' };
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-col">
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <span className="text-lg">{emoji}</span>
          {labels[rank]}
        </label>
        {suggested > 0 && (
          <span className="text-xs text-gray-500 ml-7">{percent}% → {suggested}€</span>
        )}
      </div>
      <div className="flex items-center gap-1 bg-[#0f1923] rounded-lg px-3 py-2 flex-shrink-0">
        <input
          type="number"
          value={value}
          min={0}
          onChange={e => onChange(e.target.value)}
          className="bg-transparent text-white text-right w-20 outline-none font-semibold"
        />
        <span className="text-gray-400 text-sm">€</span>
      </div>
    </div>
  );
}
