import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { ArrowLeft, TrendingUp, TrendingDown, Trophy, Sword, RefreshCw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
  BarChart, Bar, Cell, LabelList
} from 'recharts';

export default function PlayerDetailView() {
  const { state, dispatch, getCurrentChampionship, getStandings, getPlayerHistory } = useStore();
  const [chartTab, setChartTab] = useState('ranking'); // 'ranking' | 'earnings'

  const champ = getCurrentChampionship();
  const playerName = state.selectedPlayerId;
  const history = getPlayerHistory(playerName);
  const standings = getStandings();
  const playerStanding = standings.find(p => p.name === playerName);
  const playerRank = standings.findIndex(p => p.name === playerName) + 1;

  if (!champ || !playerName) return null;

  // Build cumulative chart data
  let cumulPoints = 0;
  let cumulEarnings = 0;
  const chartData = [
    { name: 'Début', date: 'Début', points: 0, earnings: 0, participated: false },
    ...history.map((game, idx) => {
      if (game.participated) {
        cumulPoints += game.points || 0;
        cumulEarnings += game.earnings || 0;
      }
      return {
        name: `P${idx + 1}`,
        date: game.date ? new Date(game.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : `P${idx+1}`,
        points: cumulPoints,
        earnings: cumulEarnings,
        participated: game.participated,
      };
    }),
  ];

  const totalGames = champ.games.filter(g => g.validated).length;

  // Kills & Rebuys stats
  const gamesParticipated = history.filter(g => g.participated);
  const playerAvgKills = playerStanding
    ? playerStanding.kills / Math.max(playerStanding.gamesPlayed, 1)
    : 0;
  const playerAvgRebuys = gamesParticipated.length > 0
    ? gamesParticipated.reduce((s, g) => s + (g.rebuys || 0), 0) / gamesParticipated.length
    : 0;

  const champAvgKills = standings.length > 0
    ? standings.reduce((s, p) => s + p.kills / Math.max(p.gamesPlayed, 1), 0) / standings.length
    : 0;

  const validatedGames = champ.games.filter(g => g.validated);
  let totalChampRebuys = 0;
  let totalChampParticipations = 0;
  validatedGames.forEach(g => {
    g.players.forEach(p => {
      totalChampRebuys += p.rebuys || 0;
      totalChampParticipations++;
    });
  });
  const champAvgRebuys = totalChampParticipations > 0 ? totalChampRebuys / totalChampParticipations : 0;

  const killsChartData = [
    { label: playerName, value: parseFloat(playerAvgKills.toFixed(2)) },
    { label: 'Moy. champ.', value: parseFloat(champAvgKills.toFixed(2)) },
  ];
  const rebuysChartData = [
    { label: playerName, value: parseFloat(playerAvgRebuys.toFixed(2)) },
    { label: 'Moy. champ.', value: parseFloat(champAvgRebuys.toFixed(2)) },
  ];
  const maxKills = Math.max(playerAvgKills, champAvgKills, 0.1) * 1.3;
  const maxRebuys = Math.max(playerAvgRebuys, champAvgRebuys, 0.1) * 1.3;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1923] to-[#1a2d1e]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pt-6 bg-[#1e2d3d]/60 border-b border-white/10">
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', view: 'championship' })}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{playerName}</h1>
          <p className="text-xs text-gray-400">{champ.name}</p>
        </div>
        <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-3 py-1.5 text-center">
          <p className="text-yellow-400 font-bold text-lg leading-none">{playerRank}</p>
          <p className="text-yellow-400/60 text-xs">rang</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats cards */}
        {playerStanding && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Points totaux"
              value={`${playerStanding.totalPoints} pts`}
              icon={<Trophy className="w-5 h-5 text-yellow-400" />}
              color="yellow"
            />
            <StatCard
              label="Bénéfice/Perte"
              value={`${playerStanding.totalEarnings >= 0 ? '+' : ''}${playerStanding.totalEarnings}€`}
              icon={playerStanding.totalEarnings >= 0
                ? <TrendingUp className="w-5 h-5 text-green-400" />
                : <TrendingDown className="w-5 h-5 text-red-400" />
              }
              color={playerStanding.totalEarnings >= 0 ? 'green' : 'red'}
            />
            <StatCard
              label="Parties jouées"
              value={`${playerStanding.gamesPlayed}/${totalGames}`}
              icon={<span className="text-xl">🎰</span>}
              color="blue"
            />
            <StatCard
              label="Podiums"
              value={`🥇${playerStanding.wins} 🥈${playerStanding.secondPlaces} 🥉${playerStanding.thirdPlaces}`}
              icon={null}
              color="purple"
              small
            />
          </div>
        )}

        {/* Charts */}
        {chartData.length > 0 && (
          <div className="bg-[#1e2d3d]/80 border border-white/10 rounded-xl p-4">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setChartTab('ranking')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  chartTab === 'ranking'
                    ? 'bg-green-600/30 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                Points
              </button>
              <button
                onClick={() => setChartTab('earnings')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  chartTab === 'earnings'
                    ? 'bg-green-600/30 text-green-400 border border-green-500/30'
                    : 'bg-white/5 text-gray-400'
                }`}
              >
                Gains/Pertes
              </button>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#ffffff10' }}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                {chartTab === 'earnings' && <ReferenceLine y={0} stroke="#ffffff30" strokeDasharray="3 3" />}
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e2d3d',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value) => chartTab === 'earnings' ? [`${value}€`, 'Gains'] : [`${value} pts`, 'Points']}
                />
                <Line
                  type="monotone"
                  dataKey={chartTab === 'ranking' ? 'points' : 'earnings'}
                  stroke={chartTab === 'earnings'
                    ? (chartData[chartData.length - 1]?.earnings >= 0 ? '#4ade80' : '#f87171')
                    : '#f0c040'
                  }
                  strokeWidth={2.5}
                  dot={{ fill: '#1e2d3d', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Kills & Rebuys comparison charts */}
        <div className="bg-[#1e2d3d]/80 border border-white/10 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Comparaison vs championnat
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {/* Kills — horizontal bar chart */}
            <div>
              <p className="text-xs text-gray-500 text-center mb-1">Kills / partie</p>
              <ResponsiveContainer width="100%" height={90}>
                <BarChart
                  data={killsChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 28, left: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, maxKills]}
                    tick={{ fill: '#6b7280', fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => v.toFixed(1)}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fill: '#9ca3af', fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    width={55}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e2d3d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e5e7eb', fontSize: '11px' }}
                    labelStyle={{ color: '#e5e7eb' }}
                    itemStyle={{ color: '#e5e7eb' }}
                    formatter={v => [`${v} kills/partie`]}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    <LabelList dataKey="value" position="right" style={{ fill: '#e5e7eb', fontSize: 10, fontWeight: 600 }} formatter={v => v.toFixed(2)} />
                    <Cell fill="#991b1b" />
                    <Cell fill="#6b7280" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Rebuys — vertical bar chart */}
            <div>
              <p className="text-xs text-gray-500 text-center mb-1">Recaves / partie</p>
              <ResponsiveContainer width="100%" height={90}>
                <BarChart
                  data={rebuysChartData}
                  margin={{ top: 4, right: 4, left: -18, bottom: 0 }}
                >
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#9ca3af', fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, maxRebuys]}
                    tick={{ fill: '#6b7280', fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => v.toFixed(1)}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e2d3d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e5e7eb', fontSize: '11px' }}
                    labelStyle={{ color: '#e5e7eb' }}
                    itemStyle={{ color: '#e5e7eb' }}
                    formatter={v => [`${v} recaves/partie`]}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={28}>
                    <LabelList dataKey="value" position="top" style={{ fill: '#e5e7eb', fontSize: 10, fontWeight: 600 }} formatter={v => v.toFixed(2)} />
                    <Cell fill="#1d4ed8" />
                    <Cell fill="#6b7280" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="inline-block w-3 h-3 rounded-sm bg-[#991b1b]" />
              {playerName}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="inline-block w-3 h-3 rounded-sm bg-[#6b7280]" />
              Moy. championnat
            </span>
          </div>
        </div>

        {/* Games history table */}
        <div className="bg-[#1e2d3d]/80 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Historique des parties
            </h3>
          </div>

          {history.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">Aucune partie validée</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs text-gray-500 font-medium px-4 py-2">Date</th>
                    <th className="text-center text-xs text-gray-500 font-medium px-2 py-2">Rang</th>
                    <th className="text-center text-xs text-gray-500 font-medium px-2 py-2">Pts</th>
                    <th className="text-center text-xs text-gray-500 font-medium px-2 py-2">
                      <RefreshCw className="w-3 h-3 inline" />
                    </th>
                    <th className="text-center text-xs text-gray-500 font-medium px-2 py-2">
                      <Sword className="w-3 h-3 inline" />
                    </th>
                    <th className="text-right text-xs text-gray-500 font-medium px-4 py-2">Gains</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((game, idx) => {
                    const date = new Date(game.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                    if (!game.participated) {
                      return (
                        <tr key={idx} className="border-b border-white/5 opacity-40">
                          <td className="px-4 py-2.5 text-gray-500">{date}</td>
                          <td colSpan={5} className="text-center text-gray-600 text-xs">Non participé</td>
                        </tr>
                      );
                    }
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2.5 text-gray-300">{date}</td>
                        <td className="px-2 py-2.5 text-center">
                          {game.rank <= 3
                            ? <span className="text-base">{medals[game.rank-1]}</span>
                            : <span className="text-gray-400">{game.rank}e</span>
                          }
                        </td>
                        <td className="px-2 py-2.5 text-center text-yellow-400 font-semibold">{game.points}</td>
                        <td className="px-2 py-2.5 text-center text-gray-400">{game.rebuys}</td>
                        <td className="px-2 py-2.5 text-center text-red-400">{game.kills}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${
                          game.earnings >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {game.earnings >= 0 ? '+' : ''}{game.earnings}€
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color, small }) {
  const colors = {
    yellow: 'bg-yellow-400/10 border-yellow-400/20',
    green: 'bg-green-600/10 border-green-500/20',
    red: 'bg-red-500/10 border-red-500/20',
    blue: 'bg-blue-500/10 border-blue-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className={`rounded-xl p-3 border ${colors[color] || colors.blue}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className={`font-bold text-white ${small ? 'text-base' : 'text-xl'}`}>{value}</p>
    </div>
  );
}
