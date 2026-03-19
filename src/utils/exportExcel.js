import * as XLSX from 'xlsx';
import { computeStandings } from '../store/useStore';

function styleHeader(ws, cellRef, value) {
  ws[cellRef] = {
    v: value,
    t: 's',
    s: {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1A472A' } },
      alignment: { horizontal: 'center' },
    },
  };
}

export function exportGameToExcel({ game, champ }) {
  // Classement calculé uniquement sur les parties validées jusqu'à la date de cette partie
  const gamesUpToDate = champ.games.filter(
    g => g.validated && g.date <= game.date
  );
  const standings = computeStandings(gamesUpToDate);
  const wb = XLSX.utils.book_new();

  // ── SHEET 1 : Détail de la partie ────────────────────────────────────────

  const gameDate = new Date(game.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const sortedPlayers = [...game.players].sort((a, b) => a.rank - b.rank);
  const totalRebuys = game.players.reduce((s, p) => s + (p.rebuys || 0), 0);
  const potCalcule = game.players.length * (champ.entryFee || 0) + totalRebuys * (champ.rebuyFee || 0);

  const gameRows = [
    [`${champ.name} — Résultat de la partie`],
    [`Date : ${gameDate}`, '', `Organisateur : ${game.organizer}`],
    [`Joueurs présents : ${game.players.length}`, '', `Pot total : ${potCalcule} €`],
    [`Gains : 🥇 ${game.prizes.first}€  🥈 ${game.prizes.second}€  🥉 ${game.prizes.third}€`],
    [],
    ['Rang', 'Joueur', 'Recaves', 'Kills', 'Joueurs éliminés', 'Pts classement', 'Pts bonus kill', 'Total pts', 'Gains (€)'],
    ...sortedPlayers.map(p => [
      p.rank,
      p.name,
      p.rebuys || 0,
      p.kills || 0,
      (p.killedPlayers || []).join(', '),
      (p.points || 0) - (p.bonusPoints || 0),
      p.bonusPoints || 0,
      p.points || 0,
      p.earnings || 0,
    ]),
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(gameRows);

  // Column widths
  ws1['!cols'] = [
    { wch: 6 }, { wch: 16 }, { wch: 8 }, { wch: 6 },
    { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, 'Partie');

  // ── SHEET 2 : Classement du championnat ──────────────────────────────────

  const standingsRows = [
    [`${champ.name} — Classement à l'issue de la partie du ${new Date(game.date).toLocaleDateString('fr-FR')}`],
    [`${gamesUpToDate.length} partie(s) comptabilisée(s) sur ${champ.totalGames}`],
    [],
    ['Rang', 'Joueur', 'Parties', 'Victoires', '2ème', '3ème', 'Kills', 'Pts bonus kill', 'Total pts', 'Gains (€)'],
    ...standings.map((p, idx) => [
      idx + 1,
      p.name,
      p.gamesPlayed,
      p.wins,
      p.secondPlaces,
      p.thirdPlaces,
      p.kills,
      p.totalBonusPoints || 0,
      p.totalPoints,
      p.totalEarnings,
    ]),
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(standingsRows);
  ws2['!cols'] = [
    { wch: 6 }, { wch: 16 }, { wch: 8 }, { wch: 10 },
    { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, ws2, 'Classement');

  // ── SHEET 3 : Top Killers ─────────────────────────────────────────────────

  const killers = [...standings]
    .filter(p => p.kills > 0)
    .sort((a, b) => b.kills - a.kills);

  const killersRows = [
    [`${champ.name} — Top Killers`],
    [],
    ['Rang', 'Joueur', 'Total kills', 'Kills / partie', 'Pts bonus kill total'],
    ...killers.map((p, idx) => [
      idx + 1,
      p.name,
      p.kills,
      (p.kills / Math.max(p.gamesPlayed, 1)).toFixed(2),
      p.totalBonusPoints || 0,
    ]),
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(killersRows);
  ws3['!cols'] = [
    { wch: 6 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws3, 'Top Killers');

  // ── Export ────────────────────────────────────────────────────────────────

  const fileName = `PokerTeam78_Partie_${game.date}_${game.organizer.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
