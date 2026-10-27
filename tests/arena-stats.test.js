import test from 'node:test';
import assert from 'node:assert/strict';
import { gameStats, recentGames, rivalryStats, playerGameRecord } from '../src/domain.js';

const people = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }];
const games = [
  { id: 'f1', cat: 'fifa', date: '2026-10-27', format: 'ffa', players: ['a', 'b'], winnerId: 'a' },
  { id: 'b1', cat: 'board', date: '2026-10-26', format: 'ffa', players: ['a', 'b'], winnerId: 'b' },
  { id: 'f2', cat: 'fifa', date: '2026-10-25', format: 'ffa', players: ['a', 'b'], winnerId: 'a' },
];

test('All combines standings while category filters retain separate wins and losses', () => {
  const a = gameStats(people, games, 'all').find(row => row.person.id === 'a');
  assert.equal(a.won, 2);
  assert.equal(a.lost, 1);
  assert.equal(gameStats(people, games, 'fifa')[0].won, 2);
  assert.equal(gameStats(people, games, 'board')[0].person.id, 'b');
  assert.equal(playerGameRecord(people[0], games, 'all').played, 3);
});
test('combined and filtered result lists retain newest-first order', () => {
  assert.deepEqual(recentGames(games, 'all').map(game => game.id), ['f1', 'b1', 'f2']);
  assert.deepEqual(recentGames(games, 'board').map(game => game.id), ['b1']);
});
test('rivalries count both categories in All and only the selected category otherwise', () => {
  assert.equal(rivalryStats(games, 'all')[0].total, 3);
  assert.deepEqual(rivalryStats(games, 'all')[0].wins, { a: 2, b: 1 });
  assert.equal(rivalryStats(games, 'fifa')[0].total, 2);
  assert.equal(rivalryStats(games, 'board')[0].total, 1);
});
