import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ArrowLeft, Trophy, UserPlus, X, Lock, Eye, EyeOff } from 'lucide-react';

export default function ChampionshipForm() {
  const { dispatch } = useStore();
  const [form, setForm] = useState({
    name: '',
    totalGames: 10,
    entryFee: 10,
    rebuyFee: 10,
    prizePoolPerPlayer: 5,
    cagnottePercent1: 60,
    cagnottePercent2: 30,
    cagnottePercent3: 10,
    adminPassword: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [players, setPlayers] = useState([]);
  const [playerInput, setPlayerInput] = useState('');

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const addPlayer = () => {
    const name = playerInput.trim();
    if (!name || players.includes(name)) return;
    setPlayers(p => [...p, name]);
    setPlayerInput('');
  };

  const removePlayer = (name) => setPlayers(p => p.filter(n => n !== name));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!form.adminPassword.trim()) { alert('Veuillez définir un mot de passe administrateur'); return; }
    const p1 = Number(form.cagnottePercent1);
    const p2 = Number(form.cagnottePercent2);
    const p3 = Number(form.cagnottePercent3);
    if (p1 + p2 + p3 !== 100) {
      alert(`La somme des pourcentages doit être égale à 100% (actuellement ${p1 + p2 + p3}%)`);
      return;
    }
    dispatch({
      type: 'CREATE_CHAMPIONSHIP',
      data: {
        name: form.name.trim(),
        totalGames: Number(form.totalGames),
        entryFee: Number(form.entryFee),
        rebuyFee: Number(form.rebuyFee),
        prizePoolPerPlayer: Number(form.prizePoolPerPlayer),
        cagnottePercent1: p1,
        cagnottePercent2: p2,
        cagnottePercent3: p3,
        players,
        adminPassword: form.adminPassword.trim(),
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1923] to-[#1a2d1e] p-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-2">
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'home' })}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Nouveau Championnat</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div className="bg-[#1e2d3d]/80 rounded-xl p-4 border border-white/10">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Nom du championnat *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Ex: Poker League 2024"
            className="w-full bg-transparent text-white placeholder-gray-600 text-lg font-medium outline-none border-b border-white/20 pb-1 focus:border-green-400 transition-colors"
            required
          />
        </div>

        {/* Settings */}
        <div className="bg-[#1e2d3d]/80 rounded-xl p-4 border border-white/10">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Configuration
          </h3>
          <div className="space-y-4">
            <Field
              label="Nombre de parties au championnat"
              value={form.totalGames}
              onChange={v => set('totalGames', v)}
              type="number"
              min={1}
              suffix="parties"
            />
            <Field
              label="Inscription par partie"
              value={form.entryFee}
              onChange={v => set('entryFee', v)}
              type="number"
              min={0}
              suffix="€"
            />
            <Field
              label="Coût d'une recave"
              value={form.rebuyFee}
              onChange={v => set('rebuyFee', v)}
              type="number"
              min={0}
              suffix="€"
            />
            <Field
              label="Cagnotte par joueur par partie"
              value={form.prizePoolPerPlayer}
              onChange={v => set('prizePoolPerPlayer', v)}
              type="number"
              min={0}
              suffix="€"
            />
          </div>
        </div>

        {/* Admin password */}
        <div className="bg-[#1e2d3d]/80 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider">
              Mot de passe administrateur *
            </h3>
          </div>
          <p className="text-gray-500 text-xs mb-3">
            Ce mot de passe sera demandé pour ajouter ou valider des parties.
            Les autres joueurs pourront uniquement consulter les résultats.
          </p>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={form.adminPassword}
              onChange={e => set('adminPassword', e.target.value)}
              placeholder="Définir un mot de passe"
              className="w-full bg-[#0f1923] text-white placeholder-gray-600 rounded-lg px-3 py-2.5 pr-10 text-sm outline-none border border-white/10 focus:border-green-400 transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Players */}
        <div className="bg-[#1e2d3d]/80 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Joueurs inscrits
            </h3>
            <span className="text-xs text-gray-500">{players.length} joueur{players.length > 1 ? 's' : ''}</span>
          </div>

          {/* Add player input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={playerInput}
              onChange={e => setPlayerInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPlayer(); } }}
              placeholder="Prénom Nom du joueur"
              className="flex-1 bg-[#0f1923] text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm outline-none border border-white/10 focus:border-green-400 transition-colors"
            />
            <button
              type="button"
              onClick={addPlayer}
              className="bg-green-600 hover:bg-green-500 text-white rounded-lg px-3 py-2.5 flex items-center gap-1 text-sm font-semibold transition-colors"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Players list */}
          {players.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-3">
              Ajoutez les joueurs qui participeront au championnat
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {players.map(name => (
                <span
                  key={name}
                  className="flex items-center gap-1.5 bg-green-600/20 border border-green-500/30 text-green-300 text-sm px-3 py-1.5 rounded-full"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => removePlayer(name)}
                    className="text-green-400/60 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Cagnotte distribution */}
        <div className="bg-[#1e2d3d]/80 rounded-xl p-4 border border-yellow-500/20">
          <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-1">
            Répartition de la cagnotte
          </h3>
          <p className="text-gray-500 text-xs mb-4">
            La somme des 3 pourcentages doit être égale à 100%
          </p>
          <div className="space-y-4">
            <Field label="% cagnotte — 1er" value={form.cagnottePercent1} onChange={v => set('cagnottePercent1', v)} type="number" min={0} suffix="%" />
            <Field label="% cagnotte — 2ème" value={form.cagnottePercent2} onChange={v => set('cagnottePercent2', v)} type="number" min={0} suffix="%" />
            <Field label="% cagnotte — 3ème" value={form.cagnottePercent3} onChange={v => set('cagnottePercent3', v)} type="number" min={0} suffix="%" />
          </div>
          <div className={`mt-3 text-xs font-semibold text-right ${
            Number(form.cagnottePercent1) + Number(form.cagnottePercent2) + Number(form.cagnottePercent3) === 100
              ? 'text-green-400' : 'text-red-400'
          }`}>
            Total : {Number(form.cagnottePercent1) + Number(form.cagnottePercent2) + Number(form.cagnottePercent3)}%
          </div>
        </div>

        {/* Points reminder */}
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-semibold">Barème de points</span>
          </div>
          <p className="text-gray-400 text-xs">1er: 13pts, 2ème: 12pts, ... nème: (14-n) pts</p>
          <p className="text-gray-400 text-xs mt-1">+2pts au top killer, +1pt au 2ème killer</p>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-green-900/30 text-lg"
        >
          Créer le championnat
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', min, suffix }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm text-gray-300 flex-1 pr-4">{label}</label>
      <div className="flex items-center gap-1 bg-[#0f1923] rounded-lg px-3 py-2 min-w-[100px]">
        <input
          type={type}
          value={value}
          min={min}
          onChange={e => onChange(e.target.value)}
          className="bg-transparent text-white text-right w-16 outline-none font-semibold"
        />
        {suffix && <span className="text-gray-400 text-sm">{suffix}</span>}
      </div>
    </div>
  );
}
