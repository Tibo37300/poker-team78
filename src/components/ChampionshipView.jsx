import React, { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import PasswordModal from './PasswordModal';
import {
  ArrowLeft, Plus, Trophy, CheckCircle, Clock, ChevronRight,
  Users, TrendingUp, TrendingDown, Minus, Trash2, Lock, Unlock, DollarSign, Sword
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Session storage key for admin auth per championship
const adminKey = (id) => `admin_champ_${id}`;

function useAdminSession(champ) {
  const [isAdmin, setIsAdmin] = useState(() => {
    if (!champ) return false;
    return sessionStorage.getItem(adminKey(champ.id)) === '1';
  });

  const tryLogin = useCallback((password) => {
    if (!champ) return false;
    if (password === champ.adminPassword) {
      sessionStorage.setItem(adminKey(champ.id), '1');
      setIsAdmin(true);
      return true;
    }
    return false;
  }, [champ]);

  const logout = useCallback(() => {
    if (!champ) return;
    sessionStorage.removeItem(adminKey(champ.id));
    setIsAdmin(false);
  }, [champ]);

  return { isAdmin, tryLogin, logout };
}

export default function ChampionshipView() {
  const { state, dispatch, getCurrentChampionship, getStandings } = useStore();
  const champ = getCurrentChampionship();
  const [tab, setTab] = useState('standings');
  const [modal, setModal] = useState(null); // null | { action: fn }
  const [dropCount, setDropCount] = useState(null); // null = auto (règle 11 parties), 0/1/2 = simulation

  const { isAdmin, tryLogin, logout } = useAdminSession(champ);

  if (!champ) return null;

  const standings = getStandings(null, dropCount);
  const validatedGames = champ.games.filter(g => g.validated);

  // Wrap any admin action: if already admin, run immediately; else show modal
  const requireAdmin = (action) => {
    if (isAdmin) {
      action();
    } else {
      setModal({ action });
    }
  };

  const handlePasswordSuccess = (password) => {
    const ok = tryLogin(password);
    if (ok && modal?.action) {
      modal.action();
      setModal(null);
    }
    return ok;
  };

  const validateGame = (gameId) => {
    requireAdmin(() => dispatch({ type: 'VALIDATE_GAME', gameId }));
  };

  const deleteGame = (gameId) => {
    requireAdmin(() => {
      if (confirm('Supprimer cette partie ?')) {
        dispatch({ type: 'DELETE_GAME', gameId });
      }
    });
  };

  const goToCreateGame = () => {
    requireAdmin(() => dispatch({ type: 'SET_VIEW', view: 'create-game' }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1923] to-[#1a2d1e]">
      {/* Password modal */}
      {modal && (
        <PasswordModal
          onSuccess={handlePasswordSuccess}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div className="bg-[#1e2d3d]/60 border-b border-white/10">
        <div className="flex items-center gap-3 p-4 pt-6">
          <button
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white truncate">{champ.name}</h1>
              {/* Admin badge */}
              {isAdmin ? (
                <button
                  onClick={logout}
                  title="Mode admin actif — cliquer pour se déconnecter"
                  className="flex items-center gap-1 bg-green-600/20 border border-green-500/30 text-green-400 text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                >
                  <Unlock className="w-3 h-3" />
                  Admin
                </button>
              ) : (
                <button
                  onClick={() => setModal({ action: () => {} })}
                  title="Se connecter en tant qu'admin"
                  className="flex items-center gap-1 bg-white/5 border border-white/10 text-gray-500 hover:text-gray-300 text-xs px-2 py-0.5 rounded-full flex-shrink-0 transition-colors"
                >
                  <Lock className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {validatedGames.length}/{champ.totalGames} parties · {standings.length} joueurs
            </p>
          </div>

          {/* Add game button — always visible, requires admin */}
          <button
            onClick={goToCreateGame}
            className="bg-green-600 hover:bg-green-500 text-white rounded-xl px-3 py-2 flex items-center gap-1.5 text-sm font-semibold transition-colors"
          >
            {isAdmin ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            Partie
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progression</span>
            <span>{Math.round((validatedGames.length / champ.totalGames) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all"
              style={{ width: `${(validatedGames.length / champ.totalGames) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 px-4 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setTab('standings')}
          className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tab === 'standings' ? 'border-green-400 text-green-400' : 'border-transparent text-gray-400'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Classement
        </button>
        <button
          onClick={() => setTab('games')}
          className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tab === 'games' ? 'border-green-400 text-green-400' : 'border-transparent text-gray-400'
          }`}
        >
          <Users className="w-4 h-4" />
          Parties ({champ.games.length})
        </button>
        <button
          onClick={() => setTab('killers')}
          className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tab === 'killers' ? 'border-red-400 text-red-400' : 'border-transparent text-gray-400'
          }`}
        >
          <Sword className="w-4 h-4" />
          Killers
        </button>
        <button
          onClick={() => setTab('cagnotte')}
          className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            tab === 'cagnotte' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-400'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Cagnotte
        </button>
      </div>

      <div className="p-4">
        {/* STANDINGS TAB */}
        {tab === 'standings' && (
          <div>
            {/* Sélecteur suppression pires scores */}
            <div className="bg-[#1e2d3d]/60 border border-white/10 rounded-xl p-3 mb-4">
              <p className="text-xs text-gray-400 mb-2">Supprimer les N pires scores par joueur :</p>
              <div className="flex gap-2">
                {[{ label: 'Règle auto', value: null }, { label: '- 1 score', value: 1 }, { label: '- 2 scores', value: 2 }].map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setDropCount(opt.value)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      dropCount === opt.value
                        ? 'bg-green-600/30 border-green-500/50 text-green-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {dropCount !== null && (
                <p className="text-xs text-yellow-400/70 mt-2 text-center">
                  Simulation — {dropCount} pire{dropCount > 1 ? 's' : ''} score{dropCount > 1 ? 's' : ''} retiré{dropCount > 1 ? 's' : ''} par joueur
                </p>
              )}
            </div>

            {standings.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucun résultat pour l'instant</p>
                <p className="text-sm mt-1">Ajoutez et validez une partie pour voir le classement</p>
              </div>
            ) : (
              <div className="space-y-2">
                {standings.map((player, idx) => (
                  <PlayerRow
                    key={player.name}
                    player={player}
                    rank={idx + 1}
                    onClick={() => dispatch({
                      type: 'SET_VIEW',
                      view: 'player-detail',
                      playerId: player.name,
                    })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* KILLERS TAB */}
        {tab === 'killers' && (() => {
          const killers = [...standings]
            .filter(p => p.kills > 0)
            .sort((a, b) => b.kills - a.kills);
          return (
            <div>
              {killers.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Sword className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun kill enregistré</p>
                  <p className="text-sm mt-1">Validez des parties pour voir le classement</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {killers.map((player, idx) => {
                    const isTop = idx === 0;
                    return (
                      <div
                        key={player.name}
                        className={`bg-[#1e2d3d]/80 border rounded-xl p-3 flex items-center gap-3 ${
                          isTop ? 'border-red-500/40' : 'border-white/10'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isTop ? 'bg-red-600/20' : 'bg-white/5'
                        }`}>
                          {isTop
                            ? <span className="text-lg">💀</span>
                            : <span className="font-bold text-sm text-gray-500">{idx + 1}</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white">{player.name}</p>
                          <p className="text-xs text-gray-500">{player.gamesPlayed} parties jouées</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`flex items-center gap-1.5 font-bold text-lg ${isTop ? 'text-red-400' : 'text-gray-300'}`}>
                            <Sword className="w-4 h-4" />
                            {player.kills}
                          </div>
                          <p className="text-xs text-gray-500">
                            {(player.kills / Math.max(player.gamesPlayed, 1)).toFixed(1)} /partie
                          </p>
                          {player.totalBonusPoints > 0 && (
                            <p className="text-xs text-yellow-400 font-semibold">+{player.totalBonusPoints} pts bonus</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* CAGNOTTE TAB */}
        {tab === 'cagnotte' && (
          <CagnotteTab champ={champ} standings={standings} validatedGames={validatedGames} requireAdmin={requireAdmin} dispatch={dispatch} />
        )}

        {/* GAMES TAB */}
        {tab === 'games' && (
          <div>
            {champ.games.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Aucune partie enregistrée</p>
                <button
                  onClick={goToCreateGame}
                  className="mt-3 text-green-400 text-sm hover:text-green-300"
                >
                  + Créer une partie
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {[...champ.games].reverse().map(game => (
                  <GameCard
                    key={game.id}
                    game={game}
                    isAdmin={isAdmin}
                    onValidate={() => validateGame(game.id)}
                    onDelete={() => deleteGame(game.id)}
                    onSelect={() => dispatch({ type: 'SET_VIEW', view: 'game-detail', gameId: game.id })}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerRow({ player, rank, onClick }) {
  const rankBg = ['bg-yellow-400/10', 'bg-gray-400/10', 'bg-amber-600/10'];
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div
      onClick={onClick}
      className="bg-[#1e2d3d]/80 border border-white/10 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-green-500/30 active:scale-[0.98] transition-all"
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${rank <= 3 ? rankBg[rank-1] : 'bg-white/5'}`}>
        {rank <= 3
          ? <span className="text-lg">{medals[rank-1]}</span>
          : <span className="font-bold text-sm text-gray-500">{rank}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white">{player.name}</p>
        <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
          <span>{player.gamesPlayed} parties</span>
          <span>🥇{player.wins} 🥈{player.secondPlaces} 🥉{player.thirdPlaces}</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-white font-bold">{player.totalPoints} pts</p>
        <div className={`flex items-center justify-end gap-0.5 text-xs font-semibold ${
          player.totalEarnings > 0 ? 'text-green-400' : player.totalEarnings < 0 ? 'text-red-400' : 'text-gray-400'
        }`}>
          {player.totalEarnings > 0 ? <TrendingUp className="w-3 h-3" /> :
           player.totalEarnings < 0 ? <TrendingDown className="w-3 h-3" /> :
           <Minus className="w-3 h-3" />}
          {player.totalEarnings > 0 ? '+' : ''}{player.totalEarnings}€
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
    </div>
  );
}

function CagnotteTab({ champ, standings, validatedGames, requireAdmin, dispatch }) {
  const prizePerPlayer = champ.prizePoolPerPlayer || 0;
  const [editing, setEditing] = useState(false);
  const [ep1, setEp1] = useState(champ.cagnottePercent1 ?? 60);
  const [ep2, setEp2] = useState(champ.cagnottePercent2 ?? 30);
  const [ep3, setEp3] = useState(champ.cagnottePercent3 ?? 10);

  const p1 = champ.cagnottePercent1 ?? 60;
  const p2 = champ.cagnottePercent2 ?? 30;
  const p3 = champ.cagnottePercent3 ?? 10;

  // Build cumulative chart data (sorted by date)
  const sorted = [...validatedGames].sort((a, b) => new Date(a.date) - new Date(b.date));
  const chartData = [{ name: 'Début', cagnotte: 0 }];
  let cumulative = 0;
  sorted.forEach((game, idx) => {
    cumulative += game.players.length * prizePerPlayer;
    chartData.push({ name: `P${idx + 1}`, cagnotte: cumulative });
  });
  const totalCagnotte = cumulative;

  const medals = ['🥇', '🥈', '🥉'];
  const percents = [p1, p2, p3];
  const top3 = standings.slice(0, 3);

  const handleEditClick = () => {
    requireAdmin(() => {
      setEp1(p1); setEp2(p2); setEp3(p3);
      setEditing(true);
    });
  };

  const handleSave = () => {
    const total = Number(ep1) + Number(ep2) + Number(ep3);
    if (total !== 100) {
      alert(`La somme doit être égale à 100% (actuellement ${total}%)`);
      return;
    }
    dispatch({
      type: 'UPDATE_CHAMPIONSHIP_PERCENTS',
      id: champ.id,
      p1: Number(ep1),
      p2: Number(ep2),
      p3: Number(ep3),
    });
    setEditing(false);
  };

  return (
    <div className="space-y-5">
      {/* Total */}
      <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4 text-center">
        <p className="text-xs text-yellow-400/70 uppercase tracking-wider mb-1">Cagnotte totale actuelle</p>
        <p className="text-4xl font-bold text-yellow-400">{totalCagnotte} €</p>
        <p className="text-xs text-gray-500 mt-1">{validatedGames.length} partie{validatedGames.length > 1 ? 's' : ''} · {prizePerPlayer}€/joueur/partie</p>
      </div>

      {/* Chart */}
      <div className="bg-[#1e2d3d]/80 border border-white/10 rounded-xl p-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Évolution de la cagnotte</p>
        {chartData.length < 2 ? (
          <p className="text-gray-600 text-sm text-center py-6">Aucune partie validée</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cagnotteGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FBBF24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} unit="€" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e2d3d', border: '1px solid #ffffff20', borderRadius: 8 }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(v) => [`${v} €`, 'Cagnotte']}
              />
              <Area type="monotone" dataKey="cagnotte" stroke="#FBBF24" strokeWidth={2} fill="url(#cagnotteGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Distribution top 3 */}
      <div className="bg-[#1e2d3d]/80 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Gains cagnotte — Top 3 actuel</p>
          {!editing && (
            <button
              onClick={handleEditClick}
              className="flex items-center gap-1 text-xs text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 hover:bg-yellow-400/20 rounded-lg px-2.5 py-1 transition-colors"
            >
              <Lock className="w-3 h-3" />
              Modifier
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            {[{ label: '🥇 1er', val: ep1, set: setEp1 }, { label: '🥈 2ème', val: ep2, set: setEp2 }, { label: '🥉 3ème', val: ep3, set: setEp3 }].map(({ label, val, set }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{label}</span>
                <div className="flex items-center gap-1 bg-[#0f1923] rounded-lg px-3 py-2">
                  <input
                    type="number"
                    value={val}
                    min={0}
                    max={100}
                    onChange={e => set(e.target.value)}
                    className="bg-transparent text-white text-right w-12 outline-none font-semibold"
                  />
                  <span className="text-gray-400 text-sm">%</span>
                </div>
              </div>
            ))}
            <div className={`text-xs font-semibold text-right ${Number(ep1) + Number(ep2) + Number(ep3) === 100 ? 'text-green-400' : 'text-red-400'}`}>
              Total : {Number(ep1) + Number(ep2) + Number(ep3)}%
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-gray-400 text-sm hover:text-white transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} className="flex-1 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-semibold text-sm transition-colors">
                Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <>
            {top3.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">Aucun classement disponible</p>
            ) : (
              <div className="space-y-3">
                {top3.map((player, idx) => {
                  const gain = Math.round(totalCagnotte * percents[idx] / 100);
                  return (
                    <div key={player.name} className="flex items-center gap-3">
                      <span className="text-xl">{medals[idx]}</span>
                      <div className="flex-1">
                        <p className="text-white text-sm font-semibold">{player.name}</p>
                        <p className="text-gray-500 text-xs">{percents[idx]}% de la cagnotte</p>
                      </div>
                      <p className="text-yellow-400 font-bold text-lg">{gain} €</p>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-gray-600 text-xs text-center mt-4">
              Répartition : {p1}% / {p2}% / {p3}%
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function GameCard({ game, isAdmin, onValidate, onDelete, onSelect }) {
  const date = new Date(game.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const winner = game.players.find(p => p.rank === 1);

  return (
    <div className="bg-[#1e2d3d]/80 border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={onSelect}>
        <div className={`rounded-lg p-2 flex-shrink-0 ${game.validated ? 'bg-green-600/20' : 'bg-orange-500/20'}`}>
          {game.validated
            ? <CheckCircle className="w-5 h-5 text-green-400" />
            : <Clock className="w-5 h-5 text-orange-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm">{date} · {game.organizer}</p>
          <p className="text-xs text-gray-500">
            {game.players.length} joueurs{winner && ` · 🥇 ${winner.name}`}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </div>

      {!game.validated && (
        <div className="border-t border-white/10 p-3 flex gap-2">
          <button
            onClick={onValidate}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5"
          >
            {isAdmin ? <CheckCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            Valider la partie
          </button>
          <button
            onClick={onDelete}
            className="bg-red-900/30 hover:bg-red-900/50 text-red-400 py-2.5 px-3 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
