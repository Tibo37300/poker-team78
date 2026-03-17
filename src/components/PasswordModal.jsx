import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, Eye, EyeOff } from 'lucide-react';

export default function PasswordModal({ onSuccess, onCancel }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const ok = onSuccess(input);
    if (!ok) {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1e2d3d] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`rounded-full p-3 border transition-colors ${
            error ? 'bg-red-500/20 border-red-500/40' : 'bg-green-600/20 border-green-500/30'
          }`}>
            <Lock className={`w-7 h-7 ${error ? 'text-red-400' : 'text-green-400'}`} />
          </div>
        </div>

        <h2 className="text-white font-bold text-lg text-center mb-1">Accès administrateur</h2>
        <p className="text-gray-400 text-sm text-center mb-5">
          Entrez le mot de passe pour accéder à cette fonctionnalité
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPwd ? 'text' : 'password'}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Mot de passe"
              className={`w-full bg-[#0f1923] text-white placeholder-gray-600 rounded-xl px-4 py-3 pr-12 outline-none border transition-colors ${
                error ? 'border-red-500 animate-pulse' : 'border-white/10 focus:border-green-400'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center">Mot de passe incorrect</p>
          )}

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Valider
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-gray-400 hover:text-white py-2 text-sm transition-colors"
          >
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
}
