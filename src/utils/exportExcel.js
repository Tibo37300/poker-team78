import { computeStandings } from '../store/useStore';

function escapeXml(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cell(value, type = 'String', bold = false, bg = '') {
  const styleId = bold ? (bg ? '3' : '2') : bg ? '4' : '1';
  return `<Cell ss:StyleID="s${styleId}"><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
}

function numCell(value, bold = false) {
  return `<Cell ss:StyleID="s${bold ? '2' : '1'}"><Data ss:Type="Number">${value}</Data></Cell>`;
}

function headerCell(value) {
  return `<Cell ss:StyleID="sH"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function emptyRow() {
  return '<Row><Cell/></Row>';
}

function buildSheet(name, rows) {
  const xmlRows = rows.map(row => {
    if (row === null) return emptyRow();
    const cells = row.map(c => {
      if (c && typeof c === 'object') {
        if (c.header) return headerCell(c.v);
        if (c.type === 'Number') return numCell(c.v, c.bold);
        return cell(c.v, 'String', c.bold);
      }
      return cell(c);
    }).join('');
    return `<Row>${cells}</Row>`;
  }).join('\n');

  return `<Worksheet ss:Name="${escapeXml(name)}"><Table>${xmlRows}</Table></Worksheet>`;
}

export function exportGameToExcel({ game, champ }) {
  const gamesUpToDate = champ.games.filter(g => g.validated && g.date <= game.date);
  const standings = computeStandings(gamesUpToDate);

  const gameDate = new Date(game.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const sortedPlayers = [...game.players].sort((a, b) => a.rank - b.rank);
  const totalRebuys = game.players.reduce((s, p) => s + (p.rebuys || 0), 0);
  const potCalcule = game.players.length * (champ.entryFee || 0) + totalRebuys * (champ.rebuyFee || 0);

  // ── Sheet 1: Partie ─────────────────────────────────────────────────────
  const partieRows = [
    [{ v: `${champ.name} — Résultat de la partie`, bold: true }],
    [{ v: `Date : ${gameDate}` }, { v: '' }, { v: `Organisateur : ${game.organizer}` }],
    [{ v: `Joueurs présents : ${game.players.length}` }, { v: '' }, { v: `Pot total : ${potCalcule} €` }],
    [{ v: `Gains : 1er=${game.prizes.first}€  2ème=${game.prizes.second}€  3ème=${game.prizes.third}€` }],
    null,
    [
      { v: 'Rang', header: true }, { v: 'Joueur', header: true },
      { v: 'Recaves', header: true }, { v: 'Kills', header: true },
      { v: 'Joueurs éliminés', header: true }, { v: 'Pts classement', header: true },
      { v: 'Pts bonus kill', header: true }, { v: 'Total pts', header: true },
      { v: 'Gains (€)', header: true },
    ],
    ...sortedPlayers.map(p => [
      { v: p.rank, type: 'Number' },
      { v: p.name },
      { v: p.rebuys || 0, type: 'Number' },
      { v: p.kills || 0, type: 'Number' },
      { v: (p.killedPlayers || []).join(', ') },
      { v: (p.points || 0) - (p.bonusPoints || 0), type: 'Number' },
      { v: p.bonusPoints || 0, type: 'Number' },
      { v: p.points || 0, type: 'Number', bold: true },
      { v: p.earnings || 0, type: 'Number', bold: true },
    ]),
  ];

  // ── Sheet 2: Classement ──────────────────────────────────────────────────
  const classementRows = [
    [{ v: `${champ.name} — Classement à l'issue du ${new Date(game.date).toLocaleDateString('fr-FR')}`, bold: true }],
    [{ v: `${gamesUpToDate.length} partie(s) comptabilisée(s) sur ${champ.totalGames}` }],
    null,
    [
      { v: 'Rang', header: true }, { v: 'Joueur', header: true },
      { v: 'Parties', header: true }, { v: 'Victoires', header: true },
      { v: '2ème', header: true }, { v: '3ème', header: true },
      { v: 'Kills', header: true }, { v: 'Pts bonus kill', header: true },
      { v: 'Total pts', header: true }, { v: 'Gains (€)', header: true },
    ],
    ...standings.map((p, idx) => [
      { v: idx + 1, type: 'Number', bold: true },
      { v: p.name, bold: idx < 3 },
      { v: p.gamesPlayed, type: 'Number' },
      { v: p.wins, type: 'Number' },
      { v: p.secondPlaces, type: 'Number' },
      { v: p.thirdPlaces, type: 'Number' },
      { v: p.kills, type: 'Number' },
      { v: p.totalBonusPoints || 0, type: 'Number' },
      { v: p.totalPoints, type: 'Number', bold: true },
      { v: p.totalEarnings, type: 'Number', bold: true },
    ]),
  ];

  // ── Sheet 3: Top Killers ─────────────────────────────────────────────────
  const killers = [...standings].filter(p => p.kills > 0).sort((a, b) => b.kills - a.kills);
  const killersRows = [
    [{ v: `${champ.name} — Top Killers`, bold: true }],
    null,
    [
      { v: 'Rang', header: true }, { v: 'Joueur', header: true },
      { v: 'Total kills', header: true }, { v: 'Kills / partie', header: true },
      { v: 'Pts bonus kill', header: true },
    ],
    ...killers.map((p, idx) => [
      { v: idx + 1, type: 'Number', bold: idx === 0 },
      { v: p.name, bold: idx === 0 },
      { v: p.kills, type: 'Number', bold: idx === 0 },
      { v: parseFloat((p.kills / Math.max(p.gamesPlayed, 1)).toFixed(2)), type: 'Number' },
      { v: p.totalBonusPoints || 0, type: 'Number' },
    ]),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:x="urn:schemas-microsoft-com:office:excel">
  <Styles>
    <Style ss:ID="s1"/>
    <Style ss:ID="s2"><Font ss:Bold="1"/></Style>
    <Style ss:ID="sH">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#1A472A" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  ${buildSheet('Partie', partieRows)}
  ${buildSheet('Classement', classementRows)}
  ${buildSheet('Top Killers', killersRows)}
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PokerTeam78_Partie_${game.date}_${game.organizer.replace(/\s+/g, '_')}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}
