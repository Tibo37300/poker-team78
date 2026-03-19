import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ArrowLeft, CheckCircle, Clock, Trophy, Sword, RefreshCw, Lock, Pencil, Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import PasswordModal from './PasswordModal';
import { exportGameToExcel } from '../utils/exportExcel';
import { exportGameToPdf } from '../utils/exportPdf';

const adminKey = (id) => `admin_champ_${id}`;

export default function GameDetailView() {
  const { state, dispatch } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'validate' | 'edit'
  const [showExportModal, setShowExportModal] = useState(false);

  const champ = state.championships.find(c => c.id === state.currentChampionshipId);
  const game = champ?.games.find(g => g.id === state.selectedGameId);

  const isAdmin = champ ? sessionStorage.getItem(adminKey(champ.id)) === '1' : false;

  if (!game) return null;

  const handleValidate = () => {
    if (isAdmin) {
      dispatch({ type: 'VALIDATE_GAME', gameId: game.id });
      dispatch({ type: 'SET_VIEW', view: 'championship' });
    } else {
      setPendingAction('validate');
      setShowModal(true);
    }
  };

  const handleEdit = () => {
    if (isAdmin) {
      dispatch({ type: 'SET_VIEW', view: 'edit-game' });
    } else {
      setPendingAction('edit');
      setShowModal(true);
    }
  };

  const handlePasswordSuccess = (password) => {
    if (!champ || password !== champ.adminPassword) return false;
    sessionStorage.setItem(adminKey(champ.id), '1');
    setShowModal(false);
    if (pendingAction === 'edit') {
      dispatch({ type: 'SET_VIEW', view: 'edit-game' });
    } else {
      dispatch({ type: 'VALIDATE_GAME', gameId: game.id });
      dispatch({ type: 'SET_VIEW', view: 'championship' });
    }
    setPendingAction(null);
    return true;
  };

  const sortedPlayers = [...game.players].sort((a, b) => a.rank - b.rank);
  const topKiller = [...game.players].sort((a, b) => b.kills - a.kills)[0];

  const date = new Date(game.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1923] to-[#1a2d1e]">
      {showModal && (
        <PasswordModal
          onSuccess={handlePasswordSuccess}
          onCancel={() => setShowModal(false)}
        />
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4">
          <div className="bg-[#1e2d3d] border border-white/10 rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Exporter la partie</h3>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => { exportGameToExcel({ game, champ }); setShowExportModal(false); }}
                className="w-full flex items-center gap-4 bg-green-600/10 hover:bg-green-600/20 border border-green-600/30 rounded-xl p-4 transition-colors text-left"
              >
                <div className="bg-green-600/20 rounded-lg p-2.5">
                  <FileSpreadsheet className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Excel (.xls)</p>
                  <p className="text-gray-400 text-xs mt-0.5">3 onglets : Partie, Classement, Top Killers</p>
                </div>
              </button>
              <button
                onClick={() => { exportGameToPdf({ game, champ }); setShowExportModal(false); }}
                className="w-full flex items-center gap-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl p-4 transition-colors text-left"
              >
                <div className="bg-red-500/20 rounded-lg p-2.5">
                  <FileText className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">PDF</p>
                  <p className="text-gray-400 text-xs mt-0.5">Tableaux colorés, impression ou sauvegarde</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pt-6">
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'championship' })}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Détail de la partie</h1>
          <p className="text-xs text-gray-400 capitalize">{date}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
          game.validated
            ? 'bg-green-600/20 text-green-400'
            : 'bg-orange-500/20 text-orange-400'
        }`}>
          {game.validated
            ? <><CheckCircle className="w-3.5 h-3.5" /> Validée</>
            : <><Clock className="w-3.5 h-3.5" /> En attente</>
          }
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Info card */}
        <div className="bg-[#1e2d3d]/80 border border-white/10 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Organisateur" value={game.organizer} />
            <Stat label="Joueurs" value={game.players.length} />
            <Stat label="Cagnotte totale" value={`${game.players.length * (champ?.prizePoolPerPlayer || 0)}€`} />
            <Stat label="Top Killer" value={topKiller?.kills > 0 ? `${topKiller.name} (${topKiller.kills})` : '-'} />
          </div>
        </div>

        {/* Prizes */}
        <div className="bg-[#1e2d3d]/80 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Gains</h3>
            <span className="text-xs text-gray-400">
              Pot total : <span className="text-white font-bold">
                {game.players.length * (champ?.entryFee || 0) + game.players.reduce((sum, p) => sum + (p.rebuys || 0), 0) * (champ?.rebuyFee || 0)}€
              </span>
            </span>
          </div>
          <div className="flex gap-3">
            <PrizeBadge emoji="🥇" amount={game.prizes.first} />
            <PrizeBadge emoji="🥈" amount={game.prizes.second} />
            <PrizeBadge emoji="🥉" amount={game.prizes.third} />
          </div>
        </div>

        {/* Players ranking */}
        <div className="bg-[#1e2d3d]/80 border border-white/10 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Classement de la partie
          </h3>
          <div className="space-y-2">
            {sortedPlayers.map((player) => (
              <PlayerResultRow key={player.name} player={player} topKillerKills={topKiller?.kills || 0} />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        {!game.validated ? (
          <button
            onClick={handleValidate}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-green-900/30 flex items-center justify-center gap-2 text-lg"
          >
            {isAdmin ? <CheckCircle className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            Valider la partie
          </button>
        ) : (
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-semibold px-5 py-2.5 rounded-full transition-colors"
            >
              <Download className="w-4 h-4" />
              Get File
            </button>
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 font-semibold px-5 py-2.5 rounded-full transition-colors"
            >
              <Lock className="w-4 h-4" />
              Modifier
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-white font-semibold text-sm">{value}</p>
    </div>
  );
}

function PrizeBadge({ emoji, amount }) {
  return (
    <div className="flex-1 bg-[#0f1923] rounded-lg p-2 text-center">
      <p className="text-lg">{emoji}</p>
      <p className="text-white font-bold text-sm">{amount}€</p>
    </div>
  );
}

function PlayerResultRow({ player, topKillerKills }) {
  const medals = ['🥇', '🥈', '🥉'];
  const rankDisplay = player.rank <= 3 ? medals[player.rank - 1] : `${player.rank}e`;

  const isTopKiller = player.kills > 0 && player.kills === topKillerKills;

  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
      <div className="w-8 text-center text-base flex-shrink-0">
        {player.rank <= 3 ? <span>{medals[player.rank-1]}</span> : <span className="text-gray-500 text-sm">{player.rank}e</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-white text-sm font-medium">{player.name}</span>
          {isTopKiller && <span className="text-xs bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded">💀 Top</span>}
          {player.bonusPoints > 0 && (
            <span className="text-xs text-yellow-400">+{player.bonusPoints}pts</span>
          )}
        </div>
        <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
          {player.rebuys > 0 && (
            <span className="flex items-center gap-0.5">
              <RefreshCw className="w-3 h-3" /> {player.rebuys}
            </span>
          )}
          {player.kills > 0 && (
            <span className="flex items-center gap-0.5">
              <Sword className="w-3 h-3 text-red-400" /> {player.kills}
              {player.killedPlayers?.length > 0 && (
                <span className="text-gray-600">({player.killedPlayers.join(', ')})</span>
              )}
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-white font-bold text-sm">{player.points} pts</p>
        <p className={`text-xs font-semibold ${
          player.earnings >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {player.earnings >= 0 ? '+' : ''}{player.earnings}€
        </p>
      </div>
    </div>
  );
}
