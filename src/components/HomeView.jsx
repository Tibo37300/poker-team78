import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Trophy, Plus, ChevronRight, Trash2, Calendar, Users, Key, Eye, EyeOff, X } from 'lucide-react';
import PasswordModal from './PasswordModal';

const FOUNDER_PASSWORD = import.meta.env.VITE_FOUNDER_PASSWORD;

export default function HomeView() {
  const { state, dispatch } = useStore();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [founderAuth, setFounderAuth] = useState(false);
  const [showFounderPrompt, setShowFounderPrompt] = useState(false);
  const [showFounderPasswords, setShowFounderPasswords] = useState(false);
  const [revealedIds, setRevealedIds] = useState({});

  const handleDeleteClick = (champ, e) => {
    e.stopPropagation();
    setDeleteTarget({ id: champ.id, adminPassword: champ.adminPassword, name: champ.name });
  };

  const handlePasswordSuccess = (input) => {
    if (input === deleteTarget.adminPassword) {
      dispatch({ type: 'DELETE_CHAMPIONSHIP', id: deleteTarget.id });
      setDeleteTarget(null);
      return true;
    }
    return false;
  };

  const handleFounderAuth = (input) => {
    if (input === FOUNDER_PASSWORD) {
      setFounderAuth(true);
      setShowFounderPrompt(false);
      setShowFounderPasswords(true);
      return true;
    }
    return false;
  };

  const toggleReveal = (id) => setRevealedIds(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1923] to-[#1a2d1e] p-4">
      {/* Header */}
      <div className="text-center py-8 mb-6">
        <div className="flex justify-center mb-3">
          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-full p-4">
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-1">Poker League</h1>
        <p className="text-gray-400 text-sm">Gérez vos championnats entre amis</p>
        <div className="flex justify-center gap-2 mt-3 text-lg">
          <span>♠</span><span className="text-red-400">♥</span>
          <span className="text-red-400">♦</span><span>♣</span>
        </div>
      </div>

      {/* Create button */}
      <button
        onClick={() => dispatch({ type: 'SET_VIEW', view: 'create-championship' })}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-semibold py-4 rounded-xl mb-6 transition-colors shadow-lg shadow-green-900/30"
      >
        <Plus className="w-5 h-5" />
        Créer un nouveau championnat
      </button>

      {/* Championships list */}
      {state.championships.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun championnat pour l'instant</p>
          <p className="text-sm mt-1">Créez votre premier championnat !</p>
        </div>
      ) : (
        <div>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Mes championnats ({state.championships.length})
          </h2>
          <div className="space-y-3">
            {state.championships.map(champ => {
              const validatedGames = champ.games.filter(g => g.validated).length;
              const allPlayers = champ.players || [];
              return (
                <div
                  key={champ.id}
                  onClick={() => dispatch({ type: 'SET_CURRENT_CHAMPIONSHIP', id: champ.id })}
                  className="bg-[#1e2d3d]/80 border border-white/10 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-green-500/50 active:scale-[0.98] transition-all"
                >
                  <div className="bg-green-600/20 rounded-lg p-2.5 flex-shrink-0">
                    <Trophy className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{champ.name}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {validatedGames}/{champ.totalGames} parties
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="w-3 h-3" />
                        {allPlayers.length} joueurs
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => handleDeleteClick(champ, e)}
                      className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Footer */}
      <div className="flex items-center justify-center gap-2 mt-10 pb-4">
        <p className="text-gray-600 text-xs">© 2026 Team78 by Thibaut MAS. Tous droits réservés.</p>
        <button
          onClick={() => founderAuth ? setShowFounderPasswords(true) : setShowFounderPrompt(true)}
          className="text-gray-600 hover:text-gray-400 transition-colors"
          title="Accès fondateur"
        >
          <Key className="w-3 h-3" />
        </button>
      </div>

      {deleteTarget && (
        <PasswordModal
          title="Supprimer le championnat"
          description={`Entrez le mot de passe admin pour confirmer la suppression de "${deleteTarget.name}"`}
          onSuccess={handlePasswordSuccess}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {showFounderPrompt && (
        <PasswordModal
          title="Accès fondateur"
          description="Entrez le mot de passe fondateur pour voir les mots de passe admin"
          onSuccess={handleFounderAuth}
          onCancel={() => setShowFounderPrompt(false)}
        />
      )}

      {showFounderPasswords && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1e2d3d] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-yellow-400" />
                <h2 className="text-white font-bold text-lg">Mots de passe admin</h2>
              </div>
              <button onClick={() => setShowFounderPasswords(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto space-y-3 pr-1">
              {state.championships.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Aucun championnat</p>
              ) : state.championships.map(champ => (
                <div key={champ.id} className="bg-[#0f1923] rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{champ.name}</p>
                    <p className="text-gray-400 text-xs font-mono mt-0.5">
                      {revealedIds[champ.id] ? (champ.adminPassword || '—') : '••••••••'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleReveal(champ.id)}
                    className="text-gray-500 hover:text-yellow-400 transition-colors flex-shrink-0"
                  >
                    {revealedIds[champ.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
