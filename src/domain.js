// Linked hosts: hosting counts for all members in the same group
const LINKED_HOST_NAMES = [['A. Alzamil', 'F. Alzamil']];

// Historical hosting dates before app tracking began
const BONUS_HOSTED_DATES = {
  'M. Almutairi': ['2024-04-13','2024-06-28','2024-11-08','2024-12-06','2025-02-22','2025-07-10','2025-09-18','2026-01-08','2026-02-26','2026-05-08'],
  'S. Alhazzaa':  ['2024-04-25','2024-08-22','2024-11-15','2024-11-21','2025-02-22','2025-07-31','2025-11-13','2026-01-22','2026-04-19','2026-05-29'],
  'H. Alhoraim':  ['2024-05-30','2024-10-18','2024-12-26','2025-02-21','2025-03-06','2025-08-07','2025-10-23','2026-01-15','2026-04-02','2026-06-04'],
  'S. Alshehri':  ['2024-05-09','2024-09-12','2024-10-31','2025-03-27','2025-05-15','2025-08-15','2025-11-27','2026-02-19','2026-04-16','2026-06-11'],
  'R. Alturki':   ['2024-05-30','2024-08-16','2024-11-29','2025-01-24','2025-02-06','2025-02-14','2025-04-18','2025-07-24','2025-10-30','2025-11-06','2026-05-29','2026-06-18'],
  'R. Alghamdi':  ['2024-07-18','2024-09-27','2024-11-28','2025-05-01','2025-07-03','2025-09-08','2025-12-05','2026-02-12','2026-03-26'],
  'S. Alhomoud':  ['2024-05-24','2024-10-11','2024-12-19','2025-02-27','2025-05-22','2025-08-28','2025-12-24','2026-03-05','2026-04-24'],
  'A. Almubark':  ['2024-05-03','2024-07-25','2025-01-02','2025-05-29','2025-09-25','2025-12-11','2026-02-05','2026-04-30','2026-05-21'],
  'A. Alzamil':   ['2024-04-19','2024-08-09','2024-09-20','2025-01-09','2025-05-08','2025-07-22','2025-11-20','2026-01-29','2026-05-15'],
  'F. Alzamil':   ['2024-04-19','2024-08-09','2024-09-20','2025-01-09','2025-05-08','2025-07-22','2025-11-20','2026-01-29','2026-05-15'],
  'S. Alassafi':  ['2024-07-11','2024-12-12','2025-01-16','2025-04-24','2025-06-26','2025-09-25','2026-01-01','2026-03-16'],
};
export function bonusHostedDates(name) { return BONUS_HOSTED_DATES[name] || []; }
function bonusHosted(name) { return bonusHostedDates(name).length; }
function bonusLastHosted(name) { const d = bonusHostedDates(name); return d.length ? d[d.length - 1] : null; }
function mergedLastHosted(name, loggedLastIso) {
  const b = bonusLastHosted(name);
  if (!loggedLastIso && !b) return null;
  if (!loggedLastIso) return b;
  if (!b) return loggedLastIso;
  return loggedLastIso > b ? loggedLastIso : b;
}

function linkedHostIds(people) {
  return LINKED_HOST_NAMES.map(group =>
    group.map(n => people.find(p => p.name === n)?.id).filter(Boolean)
  ).filter(g => g.length > 1);
}

function expandHostId(id, groups) {
  const g = groups.find(g => g.includes(id));
  return g || [id];
}

export function surnameOf(name) {
  const parts = name.split(' ');
  return parts[parts.length - 1] || name;
}
export function initials(name) {
  const given = (name.trim()[0] || '?').toUpperCase();
  const sn = surnameOf(name).replace(/^Al/, '') || surnameOf(name);
  return given + (sn[0] || '').toUpperCase();
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export function fmtDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
export function fmtDateShort(iso) {
  const d = new Date(iso + 'T00:00:00');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function fetchStats(people, fetches) {
  return people.map(p => ({ person: p, fetched: fetches.filter(f => f.personId === p.id).length }))
    .sort((a, b) => b.fetched - a.fetched);
}
export function lastFetcher(fetches, personById) {
  if (!fetches || !fetches.length) return null;
  const sorted = [...fetches].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const f = sorted[0];
  return { person: personById(f.personId), date: f.date };
}
export function attendanceInfo(person, weeks) {
  const total = weeks.length;
  const attended = weeks.filter(w => w.attendees.includes(person.id)).length;
  const ordered = [...weeks].sort((a, b) => (a.date < b.date ? 1 : -1));
  let streak = 0;
  for (const w of ordered) {
    if (w.attendees.includes(person.id)) { streak++; }
    else {
      const day = new Date(w.date + 'T12:00:00').getDay(); // 4=Thu, 5=Fri
      if (day === 4 || day === 5) break;
    }
  }
  return { attended, total, rate: total ? Math.round((attended / total) * 100) : 0, streak };
}
export function rotationOrder(people, weeks) {
  const groups = linkedHostIds(people);
  return people.map(p => {
    const ids = expandHostId(p.id, groups);
    const hosted = weeks.filter(w => ids.includes(w.hostId));
    const last = hosted.length ? hosted.map(w => w.date).sort().reverse()[0] : null;
    return { person: p, hosted: hosted.length + bonusHosted(p.name), lastHostedIso: mergedLastHosted(p.name, last), away: p.away || false };
  }).sort((a, b) => {
    if (a.away !== b.away) return a.away ? 1 : -1;
    if (a.hosted !== b.hosted) return a.hosted - b.hosted;
    return (a.lastHostedIso || '0').localeCompare(b.lastHostedIso || '0');
  });
}


export function matchSides(g) {
  if (g.format === 'teams') {
    return { players: [...(g.teamA || []), ...(g.teamB || [])], winners: (g.winner === 'A' ? g.teamA : g.teamB) || [] };
  }
  return { players: g.players || [], winners: g.winnerId ? [g.winnerId] : [] };
}

export function gameStats(people, games, cat) {
  const list = (games || []).filter(g => g.cat === cat);
  const byDate = [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return people.map(p => {
    const mine = list.filter(g => matchSides(g).players.includes(p.id));
    const won = mine.filter(g => matchSides(g).winners.includes(p.id)).length;
    const played = mine.length;
    let streak = 0;
    for (const g of byDate) {
      const s = matchSides(g);
      if (!s.players.includes(p.id)) continue;
      if (s.winners.includes(p.id)) streak++; else break;
    }
    return { person: p, played, won, lost: played - won, winRate: played ? Math.round((won / played) * 100) : 0, streak };
  }).filter(x => x.played > 0)
    .sort((a, b) => b.won - a.won || b.winRate - a.winRate || b.played - a.played);
}

export function playerGameRecord(person, games, cat) {
  const list = (games || []).filter(g => g.cat === cat && matchSides(g).players.includes(person.id));
  const won = list.filter(g => matchSides(g).winners.includes(person.id)).length;
  const played = list.length;
  return { played, won, lost: played - won, winRate: played ? Math.round((won / played) * 100) : 0 };
}
export function playerMatches(person, games) {
  return (games || []).filter(g => matchSides(g).players.includes(person.id))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}
export function recentGames(games, cat) {
  return (games || []).filter(g => g.cat === cat)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function rivalryStats(games, cat) {
  const map = {};
  (games || []).filter(g => g.cat === cat).forEach(g => {
    let pairs = []; // [winnerId, loserId]
    if (g.format === 'teams') {
      const winners = g.winner === 'A' ? (g.teamA || []) : (g.teamB || []);
      const losers  = g.winner === 'A' ? (g.teamB || []) : (g.teamA || []);
      winners.forEach(w => losers.forEach(l => pairs.push([w, l])));
    } else {
      const others = (g.players || []).filter(id => id !== g.winnerId);
      if (g.winnerId) others.forEach(l => pairs.push([g.winnerId, l]));
    }
    pairs.forEach(([w, l]) => {
      const key = [w, l].sort().join('|');
      if (!map[key]) map[key] = { ids: [w, l].sort(), wins: {} };
      map[key].wins[w] = (map[key].wins[w] || 0) + 1;
      map[key].wins[l] = map[key].wins[l] || 0;
    });
  });
  return Object.values(map)
    .map(r => ({ ...r, total: Object.values(r.wins).reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total);
}

export function awards(people, weeks, fetches, games) {
  const hs = hostStats(people, weeks);
  const fs = fetchStats(people, fetches);


  const wins = {};
  (games || []).forEach(g => {
    const sides = matchSides(g);
    sides.winners.forEach(id => { wins[id] = (wins[id] || 0) + 1; });
  });
  const topHosts = hs[0] && hs[0].hosted > 0 ? hs.filter(s => s.hosted === hs[0].hosted) : [];
  const topFetchers = fs[0] && fs[0].fetched > 0 ? fs.filter(s => s.fetched === fs[0].fetched) : [];
  const winnerList = people.map(p => ({ person: p, wins: wins[p.id] || 0 })).filter(x => x.wins > 0).sort((a, b) => b.wins - a.wins);
  const topWinners = winnerList.length > 0 ? winnerList.filter(x => x.wins === winnerList[0].wins) : [];

  const attendList = people.map(p => ({ person: p, ...attendanceInfo(p, weeks) })).filter(x => x.attended > 0).sort((a, b) => b.attended - a.attended);
  const topAttendants = attendList.length > 0 ? attendList.filter(x => x.attended === attendList[0].attended) : [];

  const out = [];
  if (topHosts.length) out.push({ key: 'host', label: 'Top Host', sub: topHosts[0].hosted + ' nights', people: topHosts.map(s => s.person), icon: 'crown' });
  if (topAttendants.length) out.push({ key: 'attend', label: 'Top Attendant', sub: topAttendants[0].attended + ' nights', people: topAttendants.map(x => x.person), icon: 'users' });
  if (topFetchers.length) out.push({ key: 'fetch', label: 'Top Fetcher', sub: topFetchers[0].fetched + ' runs', people: topFetchers.map(s => s.person), icon: 'shuffle' });
  if (topWinners.length) out.push({ key: 'winner', label: 'Top Winner', sub: topWinners[0].wins + ' wins', people: topWinners.map(x => x.person), icon: 'swords' });
  return out;
}

export function hostStats(people, weeks) {
  const groups = linkedHostIds(people);
  return people.map(p => {
    const ids = expandHostId(p.id, groups);
    const hostedWeeks = weeks.filter(w => ids.includes(w.hostId));
    const attended = weeks.filter(w => w.attendees.includes(p.id)).length;
    const loggedLast = hostedWeeks.length ? hostedWeeks.map(w => w.date).sort().reverse()[0] : null;
    const lastHostedIso = mergedLastHosted(p.name, loggedLast);
    return { person: p, hosted: hostedWeeks.length + bonusHosted(p.name), attended, lastHostedIso };
  }).sort((a, b) => b.hosted - a.hosted || b.attended - a.attended);
}

export function overdueHost(people, weeks) {
  const sorted = [...hostStats(people, weeks)].sort((a, b) => {
    if (a.hosted !== b.hosted) return a.hosted - b.hosted;
    const ad = a.lastHostedIso || '0000-00-00';
    const bd = b.lastHostedIso || '0000-00-00';
    return ad < bd ? -1 : ad > bd ? 1 : 0;
  });
  return sorted[0];
}
