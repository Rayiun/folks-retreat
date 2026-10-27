import test from 'node:test';
import assert from 'node:assert/strict';
import { requireResult, loadRecords, writeRecord, createMutationRunner } from '../src/repository.js';

test('a database error rejects instead of becoming a successful empty result', async () => {
  await assert.rejects(requireResult(Promise.resolve({ data: null, error: new Error('permission denied') })), /permission denied/);
});
test('a single table failure rejects the entire load so current records can be retained', async () => {
  const client = { from: table => ({ select: () => ({ order: async () => table === 'games' ? { error: new Error('offline') } : { data: [{ id: table }], error: null } }) }) };
  await assert.rejects(loadRecords(client), /offline/);
});
test('all four collections are returned together on a successful load', async () => {
  const client = { from: table => ({ select: () => ({ order: async () => ({ data: [{ id: table }], error: null }) }) }) };
  const records = await loadRecords(client);
  assert.deepEqual(Object.keys(records), ['people', 'weeks', 'fetches', 'games']);
  assert.equal(records.games[0].id, 'games');
});
test('updates require one confirmed row; no matching row is treated as failure', async () => {
  const calls = [];
  const query = { eq: (key, value) => { calls.push([key, value]); return query; }, select: columns => { calls.push(columns); return query; }, single: async () => ({ error: new Error('no matching row') }) };
  const client = { from: table => { calls.push(table); return { update: record => { calls.push(record); return query; } }; } };
  await assert.rejects(writeRecord(client, 'weeks', 'update', { note: 'Dinner' }, 'w1'), /no matching row/);
  assert.deepEqual(calls, ['weeks', { note: 'Dinner' }, ['id', 'w1'], 'id']);
});
test('delete requests target only the selected record', async () => {
  const calls = [];
  const query = { eq: (key, id) => { calls.push([key, id]); return query; }, select: () => query, single: async () => ({ data: { id: 'g1' } }) };
  const client = { from: table => { calls.push(table); return { delete: () => query }; } };
  assert.deepEqual(await writeRecord(client, 'games', 'delete', undefined, 'g1'), { id: 'g1' });
  assert.deepEqual(calls, ['games', ['id', 'g1']]);
});
test('a failed save never calls the success/close handler and reports an error', async () => {
  const patches = [];
  let closed = false;
  const run = createMutationRunner(patch => patches.push(patch));
  const result = await run(async () => { throw new Error('private database diagnostic'); }, () => { closed = true; });
  assert.equal(result, false);
  assert.equal(closed, false);
  assert.ok(patches.some(patch => patch.mutationError));
  assert.equal(JSON.stringify(patches).includes('private database diagnostic'), false);
  assert.deepEqual(patches.at(-1), { saving: false });
});
test('a save stays pending until confirmation and blocks double taps', async () => {
  let resolve;
  let writes = 0;
  let closed = false;
  const pending = new Promise(done => { resolve = done; });
  const run = createMutationRunner(() => {});
  const first = run(async () => { writes++; await pending; }, () => { closed = true; });
  assert.equal(closed, false);
  assert.equal(await run(async () => { writes++; }), false);
  resolve();
  assert.equal(await first, true);
  assert.equal(closed, true);
  assert.equal(writes, 1);
});
test('a rejected save can be retried after the pending lock is released', async () => {
  const run = createMutationRunner(() => {});
  assert.equal(await run(async () => { throw new Error('offline'); }), false);
  assert.equal(await run(async () => {}), true);
});
