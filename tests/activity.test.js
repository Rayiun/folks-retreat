import test from 'node:test';
import assert from 'node:assert/strict';
import { activityEntries } from '../src/activity.js';

test('activity merges event types by date without mutating records or losing same-day entries', () => {
  const weeks = [{ id: 'w', date: '2026-10-29', hostId: null, attendees: ['a'], note: 'Dinner' }];
  const games = [{ id: 'g', date: '2026-10-30', cat: 'board', format: 'teams', teamA: ['a'], teamB: ['b'] }];
  const fetches = [{ id: 'f', date: '2026-10-29', personId: 'a' }];
  const before = JSON.stringify({ weeks, games, fetches });
  const entries = activityEntries({ weeks, games, fetches, personById: id => id === 'a' ? { name: 'Member A' } : null });
  assert.equal(entries.length, 3);
  assert.equal(entries[0].type, 'games');
  assert.equal(entries.find(entry => entry.type === 'weeks').title, 'Collective Failure');
  assert.equal(entries[0].detail, 'Member A, Former member');
  assert.equal(entries.find(entry => entry.type === 'fetches').title, 'Member A');
  assert.equal(JSON.stringify({ weeks, games, fetches }), before);
});
