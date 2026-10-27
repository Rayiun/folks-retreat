import { matchSides } from './domain.js';

export function entryFromGame(game) {
  if (!game) return { winners: [], losers: [] };
  const { players, winners } = matchSides(game);
  return {
    winners: [...new Set(winners)],
    losers: [...new Set(players.filter(id => !winners.includes(id)))],
  };
}

export function toggleParticipant(entry, side, id) {
  const other = side === 'winners' ? 'losers' : 'winners';
  return {
    [side]: entry[side].includes(id) ? entry[side].filter(value => value !== id) : [...entry[side], id],
    [other]: entry[other].filter(value => value !== id),
  };
}

const sameMembers = (a, b) => a.length === b.length && a.every(id => b.includes(id));

export function buildMatchResult({ cat, date, title, winners, losers }, editing = null) {
  if (!['board', 'fifa'].includes(cat) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return null;
  if (!winners.length || !losers.length || winners.some(id => losers.includes(id))) return null;
  if (new Set(winners).size !== winners.length || new Set(losers).size !== losers.length) return null;
  const base = { cat, date, title: cat === 'fifa' ? 'FIFA' : title.trim() || 'Game night', score: null };
  const previous = entryFromGame(editing);
  if (editing && cat === editing.cat && sameMembers(winners, previous.winners) && sameMembers(losers, previous.losers)) {
    // Keep historical team orientation and scores when only date/title changed.
    return { ...base, format: editing.format, players: editing.players || [], winnerId: editing.winnerId || null, teamA: editing.teamA || [], teamB: editing.teamB || [], winner: editing.winner || null, score: editing.score ?? null };
  }
  if (winners.length === 1) {
    return { ...base, format: 'ffa', players: [...winners, ...losers], winnerId: winners[0], teamA: [], teamB: [], winner: null };
  }
  return { ...base, format: 'teams', players: [], winnerId: null, teamA: winners, teamB: losers, winner: 'A' };
}
