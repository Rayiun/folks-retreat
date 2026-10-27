import test from 'node:test';
import assert from 'node:assert/strict';
import { rotationOrder, hostStats, attendanceInfo, bonusHostedDates } from '../src/domain.js';
import { todayIso } from '../src/dates.js';

const person = (id, name = id, away = false) => ({ id, name, away });
const night = (date, hostId, attendees = []) => ({ date, hostId, attendees });

test('rotation prefers fewer hosted nights, then the oldest last hosting date', () => {
  const people = ['a', 'b', 'c'].map(id => person(id));
  const weeks = [night('2026-01-02', 'a'), night('2026-02-06', 'b')];
  assert.deepEqual(rotationOrder(people, weeks).map(x => x.person.id), ['c', 'a', 'b']);
});
test('away members stay visible at the bottom regardless of hosting count', () => {
  const people = [person('a', 'a', true), person('b')];
  const ordered = rotationOrder(people, [night('2026-01-02', 'b')]);
  assert.deepEqual(ordered.map(x => x.person.id), ['b', 'a']);
});
test('equal rotation entries retain their input order', () => {
  const people = ['a', 'b', 'c'].map(id => person(id));
  assert.deepEqual(rotationOrder(people, []).map(x => x.person.id), ['a', 'b', 'c']);
});
test('either linked host receives hosting credit for both members, exactly once', () => {
  const people = [person('a', 'A. Alzamil'), person('f', 'F. Alzamil')];
  const weeks = [night('2026-10-01', 'a'), night('2026-10-02', 'f')];
  for (const result of [rotationOrder(people, weeks), hostStats(people, weeks)]) {
    for (const entry of result) {
      assert.equal(entry.hosted, bonusHostedDates(entry.person.name).length + 2);
      assert.equal(entry.lastHostedIso, '2026-10-02');
    }
  }
});
test('a linked member missing from the people list does not create phantom credit', () => {
  const result = hostStats([person('a', 'A. Alzamil')], [night('2026-10-02', 'other')]);
  assert.equal(result[0].hosted, bonusHostedDates('A. Alzamil').length);
});
test('historical hosting credit survives and the later logged date wins', () => {
  const p = person('a', 'A. Alzamil');
  const old = hostStats([p], [night('2020-01-01', p.id)])[0];
  assert.equal(old.hosted, bonusHostedDates(p.name).length + 1);
  assert.equal(old.lastHostedIso, bonusHostedDates(p.name).at(-1));
});
test('attendance totals count all nights regardless of weekday or input order', () => {
  const weeks = [night('2026-10-15', 'a', ['a']), ...['17', '18', '19', '20', '21'].map(day => night(`2026-10-${day}`, 'b')), night('2026-10-23', 'a', ['a'])];
  assert.deepEqual(attendanceInfo(person('a'), weeks), { attended: 2, total: 7, rate: 29 });
});
test('empty attendance history has zero stats', () => {
  assert.deepEqual(attendanceInfo(person('a'), []), { attended: 0, total: 0, rate: 0 });
});
test('the night rolls over at 7am, including month boundaries', () => {
  assert.equal(todayIso(new Date(2026, 10, 1, 6, 59)), '2026-10-31');
  assert.equal(todayIso(new Date(2026, 10, 1, 7, 0)), '2026-11-01');
});
