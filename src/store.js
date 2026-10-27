import { useState, useEffect, useCallback, useRef } from 'react';
import { loadRecords, writeRecord, createMutationRunner } from './repository.js';
import { supabase } from './supabase.js';

export * from './domain.js';
import { todayIso } from './dates.js';
const HUES = [25, 55, 95, 135, 165, 200, 230, 260, 290, 320, 345, 10, 75];

const mapPerson = r => ({ id: r.id, name: r.name, color: r.color, away: r.away || false });
const mapWeek   = r => ({ id: r.id, date: r.date, hostId: r.host_id, attendees: r.attendees || [], note: r.note || '' });
const mapFetch  = r => ({ id: r.id, personId: r.person_id, date: r.date });
const mapGame   = r => ({ id: r.id, cat: r.cat, title: r.title || '', date: r.date, format: r.format,
  players: r.players || [], winnerId: r.winner_id,
  teamA: r.team_a || [], teamB: r.team_b || [], winner: r.winner, score: r.score });

export function useStore() {
  const [state, setState] = useState({ people: [], weeks: [], fetches: [], games: [], loading: true, loaded: false, loadError: null, mutationError: null, notice: null, saving: false });
  const lifecycle = useRef({ active: true, generation: 0 }).current;
  const runner = useRef(null);
  if (!runner.current) runner.current = createMutationRunner(patch => {
    if (lifecycle.active) setState(current => ({ ...current, ...patch }));
  });

  useEffect(() => {
    if (!state.notice) return;
    const timer = setTimeout(() => setState(current => ({ ...current, notice: null })), 3500);
    return () => clearTimeout(timer);
  }, [state.notice]);

  const reload = useCallback(async () => {
    const request = ++lifecycle.generation;
    if (lifecycle.active) setState(current => ({ ...current, loading: true, loadError: null }));
    try {
      const records = await loadRecords(supabase, AbortSignal.timeout(20000));
      if (!lifecycle.active || request !== lifecycle.generation) return;
      setState(current => ({ ...current, people: records.people.map(mapPerson), weeks: records.weeks.map(mapWeek), fetches: records.fetches.map(mapFetch), games: records.games.map(mapGame), loading: false, loaded: true, loadError: null }));
    } catch {
      if (lifecycle.active && request === lifecycle.generation) setState(current => ({ ...current, loading: false, loadError: 'Could not load the latest gatherings. Check your connection and try again.' }));
    }
  }, [lifecycle]);

  useEffect(() => {
    lifecycle.active = true;
    reload();
    const channel = supabase.channel('fr-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'people' }, payload => {
        if (payload.eventType === 'UPDATE') {
          setState(current => ({ ...current, people: current.people.map(person => person.id === payload.new.id ? mapPerson(payload.new) : person) }));
        } else reload();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weeks' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fetches' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, reload)
      .subscribe();
    return () => { lifecycle.active = false; lifecycle.generation++; supabase.removeChannel(channel); };
  }, [reload, lifecycle]);

  const personById = useCallback(id => state.people.find(person => person.id === id), [state.people]);
  const mutate = useCallback((operation, onSuccess) => runner.current(operation, () => {
    onSuccess?.();
    reload();
  }), [reload]);
  const weekRecord = week => ({ date: week.date, host_id: week.hostId || null, attendees: week.attendees || [], note: week.note || '' });
  const gameRecord = game => ({ cat: game.cat, title: game.title || '', date: game.date, format: game.format, players: game.players || [], winner_id: game.winnerId || null, team_a: game.teamA || [], team_b: game.teamB || [], winner: game.winner || null, score: game.score || null });
  const addWeek = week => mutate(() => writeRecord(supabase, 'weeks', 'insert', { id: 'w' + crypto.randomUUID(), ...weekRecord(week) }));
  const updateWeek = (id, week) => mutate(() => writeRecord(supabase, 'weeks', 'update', weekRecord(week), id));
  const deleteWeek = id => mutate(() => writeRecord(supabase, 'weeks', 'delete', undefined, id));
  const addPerson = name => mutate(() => writeRecord(supabase, 'people', 'insert', { id: 'p' + crypto.randomUUID(), name, color: `oklch(0.70 0.115 ${HUES[Math.floor(Math.random() * HUES.length)]})` }));
  const addFetch = personId => mutate(() => writeRecord(supabase, 'fetches', 'insert', { id: 'f' + crypto.randomUUID(), person_id: personId, date: todayIso() }));
  const deleteFetch = id => mutate(() => writeRecord(supabase, 'fetches', 'delete', undefined, id));
  const addGame = game => mutate(() => writeRecord(supabase, 'games', 'insert', { id: 'g' + crypto.randomUUID(), ...gameRecord(game) }));
  const updateGame = (id, game) => mutate(() => writeRecord(supabase, 'games', 'update', gameRecord(game), id));
  const deleteGame = id => mutate(() => writeRecord(supabase, 'games', 'delete', undefined, id));
  const toggleAway = id => {
    const person = state.people.find(person => person.id === id);
    if (!person || state.saving) return Promise.resolve(false);
    return mutate(async () => {
      setState(current => ({ ...current, people: current.people.map(p => p.id === id ? { ...p, away: !person.away } : p) }));
      try { await writeRecord(supabase, 'people', 'update', { away: !person.away }, id); }
      catch (error) {
        setState(current => ({ ...current, people: current.people.map(p => p.id === id ? { ...p, away: person.away } : p) }));
        throw error;
      }
    });
  };
  // No member deletion or bulk reset: historical records must remain intact.
  return { ...state, reload, personById, addWeek, updateWeek, deleteWeek, addPerson, addFetch, deleteFetch, addGame, updateGame, deleteGame, toggleAway };
}
