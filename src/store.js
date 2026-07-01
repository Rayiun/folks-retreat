import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase.js';

const HUES = [25, 55, 95, 135, 165, 200, 230, 260, 290, 320, 345, 10, 75];

// Linked hosts: hosting counts for all members in the same group
const LINKED_HOST_NAMES = [['A. Alzamil', 'F. Alzamil']];

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
const mapPerson = r => ({ id: r.id, name: r.name, color: r.color });
const mapWeek   = r => ({ id: r.id, date: r.date, hostId: r.host_id, attendees: r.attendees || [], note: r.note || '' });
const mapFetch  = r => ({ id: r.id, personId: r.person_id, date: r.date });
const mapGame   = r => ({ id: r.id, cat: r.cat, title: r.title || '', date: r.date, format: r.format,
  players: r.players || [], winnerId: r.winner_id,
  teamA: r.team_a || [], teamB: r.team_b || [], winner: r.winner, score: r.score });

function todayIso() {
  const d = new Date();
  if (d.getHours() < 7) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function useStore() {
  const [state, setState] = useState({ people: [], weeks: [], fetches: [], games: [], loading: true });

  const reload = useCallback(async () => {
    const [p, w, f, g] = await Promise.all([
      supabase.from('people').select('*').order('name'),
      supabase.from('weeks').select('*').order('date', { ascending: false }),
      supabase.from('fetches').select('*').order('date', { ascending: false }),
      supabase.from('games').select('*').order('date', { ascending: false }),
    ]);
    setState({
      people: (p.data || []).map(mapPerson),
      weeks:  (w.data || []).map(mapWeek),
      fetches:(f.data || []).map(mapFetch),
      games:  (g.data || []).map(mapGame),
      loading: false,
    });
  }, []);

  useEffect(() => {
    reload();
    const ch = supabase.channel('fr-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'people' },  reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weeks' },   reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fetches' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' },   reload)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [reload]);

  const personById = useCallback((id) => state.people.find(p => p.id === id), [state.people]);

  const addWeek = useCallback(async (week) => {
    await supabase.from('weeks').insert({
      id: 'w' + Date.now(), date: week.date, host_id: week.hostId || null,
      attendees: week.attendees || [], note: week.note || '',
    });
  }, []);
  const updateWeek = useCallback(async (id, patch) => {
    await supabase.from('weeks').update({
      date: patch.date, host_id: patch.hostId || null,
      attendees: patch.attendees || [], note: patch.note || '',
    }).eq('id', id);
  }, []);
  const deleteWeek = useCallback(async (id) => {
    await supabase.from('weeks').delete().eq('id', id);
  }, []);

  const addPerson = useCallback(async (name) => {
    const hue = HUES[Math.floor(Math.random() * HUES.length)];
    await supabase.from('people').insert({
      id: 'p' + Date.now(), name, color: `oklch(0.70 0.115 ${hue})`,
    });
  }, []);
  const removePerson = useCallback(async (id) => {
    await Promise.all([
      supabase.from('people').delete().eq('id', id),
      supabase.from('games').delete().filter('players', 'cs', JSON.stringify([id])),
    ]);
  }, []);

  const addFetch = useCallback(async (personId) => {
    await supabase.from('fetches').insert({ id: 'f' + Date.now(), person_id: personId, date: todayIso() });
  }, []);
  const deleteFetch = useCallback(async (id) => {
    await supabase.from('fetches').delete().eq('id', id);
  }, []);

  const addGame = useCallback(async (game) => {
    await supabase.from('games').insert({
      id: 'g' + Date.now(), cat: game.cat, title: game.title || '', date: game.date,
      format: game.format, players: game.players || [], winner_id: game.winnerId || null,
      team_a: game.teamA || [], team_b: game.teamB || [],
      winner: game.winner || null, score: game.score || null,
    });
  }, []);
  const updateGame = useCallback(async (id, game) => {
    await supabase.from('games').update({
      cat: game.cat, title: game.title || '', date: game.date,
      format: game.format, players: game.players || [], winner_id: game.winnerId || null,
      team_a: game.teamA || [], team_b: game.teamB || [],
      winner: game.winner || null, score: game.score || null,
    }).eq('id', id);
  }, []);
  const deleteGame = useCallback(async (id) => {
    await supabase.from('games').delete().eq('id', id);
  }, []);

  const resetAll = useCallback(async () => {
    await Promise.all([
      supabase.from('games').delete().neq('id', ''),
      supabase.from('fetches').delete().neq('id', ''),
      supabase.from('weeks').delete().neq('id', ''),
      supabase.from('people').delete().neq('id', ''),
    ]);
  }, []);

  return { ...state, personById, addWeek, updateWeek, deleteWeek, addPerson, removePerson, addFetch, deleteFetch, addGame, updateGame, deleteGame, resetAll };
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
  for (const w of ordered) { if (w.attendees.includes(person.id)) streak++; else break; }
  return { attended, total, rate: total ? Math.round((attended / total) * 100) : 0, streak };
}
export function rotationOrder(people, weeks) {
  const groups = linkedHostIds(people);
  return people.map(p => {
    const ids = expandHostId(p.id, groups);
    const hosted = weeks.filter(w => ids.includes(w.hostId));
    const last = hosted.length ? hosted.map(w => w.date).sort().reverse()[0] : null;
    return { person: p, hosted: hosted.length, lastHostedIso: last };
  }).sort((a, b) => {
    if (a.hosted !== b.hosted) return a.hosted - b.hosted;
    return (a.lastHostedIso || '0') < (b.lastHostedIso || '0') ? -1 : 1;
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
  const loyal = people.map(p => ({ person: p, ...attendanceInfo(p, weeks) }))
    .filter(x => x.total >= 3).sort((a, b) => b.rate - a.rate || b.streak - a.streak)[0];

  const wins = {};
  (games || []).forEach(g => {
    const sides = matchSides(g);
    sides.winners.forEach(id => { wins[id] = (wins[id] || 0) + 1; });
  });
  const topWinner = people.map(p => ({ person: p, wins: wins[p.id] || 0 }))
    .filter(x => x.wins > 0).sort((a, b) => b.wins - a.wins)[0];

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
    const lastHostedIso = hostedWeeks.length ? hostedWeeks.map(w => w.date).sort().reverse()[0] : null;
    return { person: p, hosted: hostedWeeks.length, attended, lastHostedIso };
  }).sort((a, b) => b.hosted - a.hosted || b.attended - a.attended);
}

export function overdueHost(people, weeks) {
  const groups = linkedHostIds(people);
  const stats = people.map(p => {
    const ids = expandHostId(p.id, groups);
    const hostedWeeks = weeks.filter(w => ids.includes(w.hostId));
    const lastHostedIso = hostedWeeks.length ? hostedWeeks.map(w => w.date).sort().reverse()[0] : null;
    return { person: p, hosted: hostedWeeks.length, lastHostedIso };
  });
  stats.sort((a, b) => {
    if (a.hosted !== b.hosted) return a.hosted - b.hosted;
    const ad = a.lastHostedIso || '0000-00-00';
    const bd = b.lastHostedIso || '0000-00-00';
    return ad < bd ? -1 : ad > bd ? 1 : 0;
  });
  return stats[0];
}
