import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMatchResult, entryFromGame, toggleParticipant } from '../src/match-entry.js';
import { gameStats, matchSides, rivalryStats } from '../src/domain.js';

const base = { cat: 'fifa', date: '2026-10-27', title: '', winners: ['a'], losers: ['b'] };

test('one winner and multiple losers need no score for either category', () => {
  for (const cat of ['fifa', 'board']) {
    const result = buildMatchResult({ ...base, cat, losers: ['b', 'c'] });
    assert.deepEqual(matchSides(result), { players: ['a', 'b', 'c'], winners: ['a'] });
    assert.equal(result.score, null);
    assert.equal(result.title, cat === 'fifa' ? 'FIFA' : 'Others');
  }
});
test('multiple winners and losers use the existing team format and count each result correctly', () => {
  const result = buildMatchResult({ ...base, winners: ['a', 'b'], losers: ['c', 'd'] });
  assert.equal(result.format, 'teams');
  assert.deepEqual(matchSides(result).winners, ['a', 'b']);
  const people = ['a', 'b', 'c', 'd'].map(id => ({ id, name: id }));
  const stats = gameStats(people, [result], 'fifa');
  assert.equal(stats.find(entry => entry.person.id === 'a').won, 1);
  assert.equal(stats.find(entry => entry.person.id === 'b').won, 1);
  assert.equal(stats.find(entry => entry.person.id === 'c').lost, 1);
  assert.equal(rivalryStats([result], 'fifa').length, 4);
});
test('a player moves between groups and can be deselected', () => {
  const moved = toggleParticipant({ winners: ['a'], losers: ['b'] }, 'losers', 'a');
  assert.deepEqual(moved, { losers: ['b', 'a'], winners: [] });
  assert.deepEqual(toggleParticipant(moved, 'losers', 'a'), { losers: ['b'], winners: [] });
});
test('save requires distinct nonempty winner and loser groups', () => {
  assert.equal(buildMatchResult({ ...base, winners: [] }), null);
  assert.equal(buildMatchResult({ ...base, losers: [] }), null);
  assert.equal(buildMatchResult({ ...base, losers: ['a'] }), null);
  assert.equal(buildMatchResult({ ...base, winners: ['a', 'a'] }), null);
});
test('old solo records populate the winner and loser pickers', () => {
  assert.deepEqual(entryFromGame({ format: 'ffa', players: ['a', 'b', 'c'], winnerId: 'b' }), { winners: ['b'], losers: ['a', 'c'] });
});
test('editing only details preserves an old Team B win and its score', () => {
  const old = { ...base, format: 'teams', teamA: ['a'], teamB: ['b', 'c'], winner: 'B', score: [1, 3] };
  const entry = entryFromGame(old);
  const result = buildMatchResult({ ...base, ...entry, date: '2026-10-26' }, old);
  assert.equal(result.winner, 'B');
  assert.deepEqual(result.score, [1, 3]);
  assert.deepEqual(result.teamB, ['b', 'c']);
});
test('editing only details preserves old solo scores', () => {
  const old = { ...base, format: 'ffa', players: ['a', 'b'], winnerId: 'a', score: [3, 1] };
  assert.deepEqual(buildMatchResult(base, old).score, [3, 1]);
});
test('changing the outcome drops an incompatible old score and orientation', () => {
  const old = { ...base, format: 'teams', teamA: ['a'], teamB: ['b'], winner: 'A', score: [3, 1] };
  const result = buildMatchResult({ ...base, winners: ['b'], losers: ['a'] }, old);
  assert.equal(result.score, null);
  assert.deepEqual(matchSides(result).winners, ['b']);
});
