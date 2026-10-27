import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';

test('screens and editors render with synthetic records, without production requests', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Network access is forbidden in render tests'); };
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' });
  try {
    const screens = await server.ssrLoadModule('/src/screens.jsx');
    const { GamesScreen, MatchEditor, FullStandingsSheet } = await server.ssrLoadModule('/src/games.jsx');
    const { WheelScreen } = await server.ssrLoadModule('/src/wheel.jsx');
    const { ConfirmDelete } = await server.ssrLoadModule('/src/ui.jsx');
    const people = [{ id: 'a', name: 'Test Member', color: '#987', away: false }, { id: 'b', name: 'Other Member', color: '#789', away: false }];
    const store = { people, weeks: [], fetches: [], games: [], personById: id => people.find(p => p.id === id), saving: false };
    const noop = () => {};
    for (const Component of [screens.HomeScreen, screens.HistoryScreen, screens.StatsScreen, GamesScreen, WheelScreen]) {
      assert.ok(renderToString(React.createElement(Component, { store, openEditor: noop, goTo: noop, openProfile: noop, openPeople: noop, openShare: noop, toggleTheme: noop })).length);
    }
    const stats = renderToString(React.createElement(screens.StatsScreen, { store, openPeople: noop, openProfile: noop, openShare: noop }));
    assert.match(stats, />Winning<\/button>/);
    const arena = renderToString(React.createElement(GamesScreen, { store }));
    assert.match(arena, /Arena stats filter/);
    assert.match(arena, /aria-pressed="true"[^>]*>All</);
    assert.match(arena, /Log a match/);
    assert.match(arena, /No matches yet/);
    for (const [cat, label] of [['all', 'All'], ['fifa', 'FIFA'], ['board', 'Others']]) {
      const fullTable = renderToString(React.createElement(FullStandingsSheet, {
        open: true, onClose: noop, standings: [], cat, onCategoryChange: noop, onPlayer: noop,
      }));
      assert.match(fullTable, /Full standings filter/);
      assert.match(fullTable, new RegExp(`aria-pressed="true"[^>]*>${label}<`));
      assert.match(fullTable, /No .*matches yet/);
    }
    const standingsTable = renderToString(React.createElement(FullStandingsSheet, {
      open: true, onClose: noop, cat: 'all', onCategoryChange: noop, onPlayer: noop,
      standings: [{ person: people[0], won: 3, lost: 1, played: 4, winRate: 75 }],
    }));
    assert.match(standingsTable.replace(/<!--.*?-->/g, ''), /75% win rate · 4 played/);
    const week = { id: 'w1', date: '2026-10-23', hostId: 'a', attendees: ['a'], note: '' };
    const weekForm = renderToString(React.createElement(screens.WeekEditor, { store, editing: week, open: true, onClose: noop }));
    assert.match(weekForm, /Edit night/);
    assert.doesNotMatch(weekForm, /Enter passcode/);
    const matchForm = renderToString(React.createElement(MatchEditor, { store: { ...store, saving: true }, open: true, onClose: noop, initialCat: 'board' }));
    assert.match(matchForm, /Saving…/);
    assert.match(matchForm, /fieldset disabled/);
    assert.match(matchForm, /Who won/);
    assert.match(matchForm, /Who lost/);
    assert.match(matchForm, /Winning players/);
    assert.match(matchForm, /Losing players/);
    assert.doesNotMatch(matchForm, /Team A|Team B|No draws|Log FIFA instead|Game name|e.g. Baloot/);
    const selectedMatch = renderToString(React.createElement(MatchEditor, {
      store, open: true, onClose: noop,
      editing: { id: 'g1', cat: 'fifa', date: '2026-10-23', format: 'ffa', players: ['a', 'b'], winnerId: 'a' },
    }));
    assert.match(selectedMatch, /Test Member: winner/);
    assert.doesNotMatch(selectedMatch, /Test Member: loser/);
    assert.match(selectedMatch, /Other Member: loser/);
    assert.doesNotMatch(selectedMatch, /Other Member: winner/);
    const confirmation = renderToString(React.createElement(ConfirmDelete, { open: true, onClose: noop, onConfirm: noop }));
    assert.match(confirmation, /Delete this record/);
    assert.doesNotMatch(confirmation, /passcode|1416/);
  } finally {
    await server.close();
    globalThis.fetch = originalFetch;
  }
});
