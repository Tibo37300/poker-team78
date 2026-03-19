import { computeStandings } from '../store/useStore';

export function exportGameToPdf({ game, champ }) {
  const gamesUpToDate = champ.games.filter(g => g.validated && g.date <= game.date);
  const standings = computeStandings(gamesUpToDate);

  const gameDate = new Date(game.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const sortedPlayers = [...game.players].sort((a, b) => a.rank - b.rank);
  const totalRebuys = game.players.reduce((s, p) => s + (p.rebuys || 0), 0);
  const potCalcule = game.players.length * (champ.entryFee || 0) + totalRebuys * (champ.rebuyFee || 0);

  const medals = ['🥇', '🥈', '🥉'];
  const killers = [...standings].filter(p => p.kills > 0).sort((a, b) => b.kills - a.kills);

  const partieRows = sortedPlayers.map((p, i) => `
    <tr class="${i % 2 === 0 ? 'even' : 'odd'} ${p.rank <= 3 ? 'podium' : ''}">
      <td class="center">${p.rank <= 3 ? medals[p.rank - 1] : p.rank}</td>
      <td><strong>${p.name}</strong></td>
      <td class="center">${p.rebuys || 0}</td>
      <td class="center">${p.kills || 0}</td>
      <td class="small">${(p.killedPlayers || []).join(', ') || '—'}</td>
      <td class="center">${(p.points || 0) - (p.bonusPoints || 0)}</td>
      <td class="center bonus">${p.bonusPoints > 0 ? '+' + p.bonusPoints : '—'}</td>
      <td class="center bold">${p.points || 0}</td>
      <td class="center ${(p.earnings || 0) >= 0 ? 'green' : 'red'}">${(p.earnings || 0) >= 0 ? '+' : ''}${p.earnings || 0}€</td>
    </tr>`).join('');

  const standingsRows = standings.map((p, idx) => `
    <tr class="${idx % 2 === 0 ? 'even' : 'odd'} ${idx < 3 ? 'podium' : ''}">
      <td class="center bold">${idx < 3 ? medals[idx] : idx + 1}</td>
      <td><strong>${p.name}</strong></td>
      <td class="center">${p.gamesPlayed}</td>
      <td class="center">${p.wins}</td>
      <td class="center">${p.secondPlaces}</td>
      <td class="center">${p.thirdPlaces}</td>
      <td class="center">${p.kills}</td>
      <td class="center bonus">${p.totalBonusPoints > 0 ? '+' + p.totalBonusPoints : '—'}</td>
      <td class="center bold">${p.totalPoints}</td>
      <td class="center ${p.totalEarnings >= 0 ? 'green' : 'red'}">${p.totalEarnings >= 0 ? '+' : ''}${p.totalEarnings}€</td>
    </tr>`).join('');

  const killersRows = killers.map((p, idx) => `
    <tr class="${idx % 2 === 0 ? 'even' : 'odd'} ${idx === 0 ? 'top-killer' : ''}">
      <td class="center">${idx === 0 ? '💀' : idx + 1}</td>
      <td><strong>${p.name}</strong></td>
      <td class="center bold">${p.kills}</td>
      <td class="center">${(p.kills / Math.max(p.gamesPlayed, 1)).toFixed(2)}</td>
      <td class="center bonus">${p.totalBonusPoints > 0 ? '+' + p.totalBonusPoints : '—'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Poker Team 78 — ${gameDate}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f4f6f8;
      color: #1a1a2e;
      padding: 24px;
      font-size: 12px;
    }
    .page-title {
      text-align: center;
      margin-bottom: 24px;
    }
    .page-title h1 {
      font-size: 22px;
      color: #1a472a;
      letter-spacing: 1px;
    }
    .page-title p { color: #555; font-size: 13px; margin-top: 4px; }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 24px;
    }
    .info-card {
      background: white;
      border-radius: 8px;
      padding: 10px 14px;
      border-left: 4px solid #1a472a;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .info-card .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-card .value { font-size: 16px; font-weight: 700; color: #1a1a2e; margin-top: 2px; }

    .prizes {
      display: flex;
      gap: 10px;
      margin-bottom: 24px;
    }
    .prize-card {
      flex: 1;
      background: white;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .prize-card .emoji { font-size: 22px; }
    .prize-card .amount { font-size: 18px; font-weight: 700; color: #1a472a; }

    section { margin-bottom: 28px; }
    section h2 {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #1a472a;
      border-bottom: 2px solid #1a472a;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }

    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    thead tr { background: #1a472a; color: white; }
    thead th { padding: 8px 10px; font-size: 11px; font-weight: 600; text-align: center; }
    thead th:nth-child(2) { text-align: left; }
    tbody td { padding: 7px 10px; border-bottom: 1px solid #f0f0f0; }
    tbody td:nth-child(2) { text-align: left; }

    tr.even { background: #fafafa; }
    tr.odd  { background: #ffffff; }
    tr.podium { background: #f0fdf4 !important; }
    tr.top-killer { background: #fff1f1 !important; }

    .center { text-align: center; }
    .bold { font-weight: 700; }
    .small { font-size: 10px; color: #666; }
    .green { color: #16a34a; font-weight: 700; }
    .red   { color: #dc2626; font-weight: 700; }
    .bonus { color: #b45309; font-weight: 600; }

    .footer {
      text-align: center;
      color: #aaa;
      font-size: 10px;
      margin-top: 20px;
      border-top: 1px solid #e0e0e0;
      padding-top: 10px;
    }

    @media print {
      body { background: white; padding: 10px; }
      .info-card, .prize-card, table { box-shadow: none; }
      section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="page-title">
    <h1>♠ Poker Team 78 — ${champ.name} ♠</h1>
    <p>${gameDate} · Organisateur : ${game.organizer}</p>
  </div>

  <!-- Info cards -->
  <div class="info-grid">
    <div class="info-card"><div class="label">Joueurs</div><div class="value">${game.players.length}</div></div>
    <div class="info-card"><div class="label">Pot total</div><div class="value">${potCalcule} €</div></div>
    <div class="info-card"><div class="label">Parties validées</div><div class="value">${gamesUpToDate.length} / ${champ.totalGames}</div></div>
    <div class="info-card"><div class="label">Top Killer</div><div class="value">${killers[0]?.name || '—'} (${killers[0]?.kills || 0} kills)</div></div>
  </div>

  <!-- Prizes -->
  <div class="prizes">
    <div class="prize-card"><div class="emoji">🥇</div><div class="amount">${game.prizes.first} €</div></div>
    <div class="prize-card"><div class="emoji">🥈</div><div class="amount">${game.prizes.second} €</div></div>
    <div class="prize-card"><div class="emoji">🥉</div><div class="amount">${game.prizes.third} €</div></div>
  </div>

  <!-- Résultat de la partie -->
  <section>
    <h2>Résultat de la partie</h2>
    <table>
      <thead><tr>
        <th>Rang</th><th style="text-align:left">Joueur</th>
        <th>Recaves</th><th>Kills</th><th>Victimes</th>
        <th>Pts rang</th><th>Bonus kill</th><th>Total pts</th><th>Gains</th>
      </tr></thead>
      <tbody>${partieRows}</tbody>
    </table>
  </section>

  <!-- Classement championnat -->
  <section>
    <h2>Classement du championnat — après cette partie</h2>
    <table>
      <thead><tr>
        <th>Rang</th><th style="text-align:left">Joueur</th>
        <th>Parties</th><th>Victoires</th><th>2ème</th><th>3ème</th>
        <th>Kills</th><th>Bonus kill</th><th>Total pts</th><th>Gains</th>
      </tr></thead>
      <tbody>${standingsRows}</tbody>
    </table>
  </section>

  <!-- Top Killers -->
  ${killers.length > 0 ? `
  <section>
    <h2>Top Killers</h2>
    <table>
      <thead><tr>
        <th>Rang</th><th style="text-align:left">Joueur</th>
        <th>Total kills</th><th>Kills / partie</th><th>Pts bonus kill</th>
      </tr></thead>
      <tbody>${killersRows}</tbody>
    </table>
  </section>` : ''}

  <div class="footer">© 2026 Team78 by Thibaut MAS — Généré le ${new Date().toLocaleDateString('fr-FR')}</div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
