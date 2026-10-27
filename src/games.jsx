import { entryFromGame, toggleParticipant, buildMatchResult } from './match-entry.js';
import { todayIso } from './dates.js';
import { useState, useEffect, useEffectEvent } from 'react';
import { fmtDateShort, fmtDate, matchSides, gameStats, recentGames, playerGameRecord, playerMatches, rivalryStats } from './store.js';
import { Avatar, Icon, Sheet, Btn, Card, Segment, ConfirmDelete } from './ui.jsx';
import { SectionTitle, DateField } from './screens.jsx';

const TEAM_B_COLOR = 'oklch(0.62 0.13 245)';
const teamColor = (t) => (t === 'A' ? 'var(--accent)' : TEAM_B_COLOR);

const Lbl = ({ children, top }) => (
  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--muted)', margin: top ? '0 0 8px' : '20px 0 8px' }}>{children}</div>
);

function TeamMark({ person, size = 44, ring, badge, crown, dim, onClick }) {
  const C = onClick ? 'button' : 'div';
  return (
    <C onClick={onClick} style={{ position: 'relative', border: 'none', background: 'none', padding: 0,
      cursor: onClick ? 'pointer' : 'default', lineHeight: 0 }}>
      <div style={{ borderRadius: '50%', opacity: dim ? 0.4 : 1, transition: 'opacity .15s',
        boxShadow: ring ? `0 0 0 2.5px var(--surface), 0 0 0 5px ${ring}` : 'none' }}>
        <Avatar person={person} size={size} />
      </div>
      {badge && (
        <span style={{ position: 'absolute', right: -4, bottom: -4, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9,
          background: teamColor(badge), color: '#fff', border: '2px solid var(--surface)', fontSize: 10.5, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display)' }}>{badge}</span>
      )}
      {crown && (
        <span style={{ position: 'absolute', right: -4, top: -7, transform: 'rotate(13deg)' }}>
          <Icon name="crown" size={15} sw={2} color="var(--accent)" fill />
        </span>
      )}
    </C>
  );
}

function ResultPlayers({ people, selected, side, onToggle }) {
  const winners = side === 'winners';
  const color = winners ? 'var(--accent)' : TEAM_B_COLOR;
  return (
    <div role="group" aria-label={winners ? 'Winning players' : 'Losing players'} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(62px, 1fr))', gap: 12 }}>
      {people.map(person => {
        const on = selected.includes(person.id);
        return <button key={person.id} type="button" aria-pressed={on} aria-label={`${person.name}: ${winners ? 'winner' : 'loser'}`} onClick={() => onToggle(side, person.id)} style={{
          border: 'none', background: 'none', padding: '5px 2px', minHeight: 70,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer',
        }}>
          <TeamMark person={person} size={44} ring={on ? color : null} crown={on && winners} dim={!on} />
          <span style={{ fontSize: 11, fontWeight: on ? 700 : 500, color: on ? 'var(--ink)' : 'var(--muted)', overflowWrap: 'anywhere' }}>{person.name}</span>
        </button>;
      })}
    </div>
  );
}

export function MatchEditor({ store, open, onClose, initialCat, editing }) {
  const [cat, setCat] = useState(editing?.cat || initialCat || 'board');
  const [date, setDate] = useState(editing?.date || todayIso());
  const [entry, setEntry] = useState(() => entryFromGame(editing));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const prepareEditor = useEffectEvent(() => {
    setCat(editing?.cat || initialCat || 'board');
    setDate(editing?.date || todayIso());
    setEntry(entryFromGame(editing));
    setDetailsOpen(false);
    setConfirmOpen(false);
  });
  useEffect(() => { if (open) prepareEditor(); }, [open]);

  // Preserve participants from older results even if they are no longer in the roster.
  const missingIds = [...entry.winners, ...entry.losers].filter(id => !store.people.some(person => person.id === id));
  const people = [...store.people, ...missingIds.map(id => ({ id, name: 'Former member', color: 'var(--muted)' }))];
  const result = buildMatchResult({ cat, date, ...entry }, editing);
  const toggle = (side, id) => setEntry(current => toggleParticipant(current, side, id));
  const save = async () => {
    if (!result || store.saving) return;
    const saved = editing ? await store.updateGame(editing.id, result) : await store.addGame(result);
    if (saved) onClose();
  };

  return (
    <Sheet open={open} onClose={store.saving ? undefined : onClose} title={editing ? 'Edit match' : 'Log a match'}>
      <fieldset disabled={store.saving} className="editor-fields">
        <Segment value={cat} options={[{ value: 'fifa', label: 'FIFA' }, { value: 'board', label: 'Others' }]} onChange={setCat} />
        <div style={{ margin: '22px 0 12px' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 19, fontWeight: 700, color: 'var(--ink)' }}>Who won? <span style={{ color: 'var(--accent)', fontSize: 14 }}>{entry.winners.length || ''}</span></div>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 3 }}>Choose one or more players.</div>
        </div>
        <ResultPlayers people={people.filter(person => !entry.losers.includes(person.id))} selected={entry.winners} side="winners" onToggle={toggle} />
        <div style={{ margin: '20px 0 12px' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 19, fontWeight: 700, color: 'var(--ink)' }}>Who lost? <span style={{ color: TEAM_B_COLOR, fontSize: 14 }}>{entry.losers.length || ''}</span></div>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 3 }}>Choose one or more players.</div>
        </div>
        <ResultPlayers people={people.filter(person => !entry.winners.includes(person.id))} selected={entry.losers} side="losers" onToggle={toggle} />
        <div style={{ margin: '16px 0' }}>
          <button type="button" aria-expanded={detailsOpen} onClick={() => setDetailsOpen(value => !value)} style={{ border: 'none', background: 'none', color: 'var(--muted)', fontSize: 12, padding: '10px 0', cursor: 'pointer' }}>
            {detailsOpen ? 'Hide details' : `${fmtDateShort(date)} · Change date`}
          </button>
          {detailsOpen && <div style={{ display: 'grid', gap: 14, marginBottom: 12 }}>
            <DateField value={date} onChange={setDate} />
          </div>}
        </div>
        <Btn icon="check" size="lg" disabled={!result || store.saving} onClick={save} style={{ width: '100%' }}>{store.saving ? 'Saving…' : 'Save result'}</Btn>
      </fieldset>
      {editing && <>
        <ConfirmDelete open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={async () => { const deleted = await store.deleteGame(editing.id); if (deleted) onClose(); return deleted; }} />
        <Btn variant="danger" disabled={store.saving} size="sm" icon="trash" onClick={() => setConfirmOpen(true)} style={{ width: '100%', marginTop: 10 }}>Delete this match</Btn>
      </>}
    </Sheet>
  );
}

function StandingRow({ rank, entry, onClick, spacious = false }) {
  const p = entry.person;
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', cursor: 'pointer',
      border: 'none', background: 'none', padding: spacious ? '15px 2px' : '10px 2px', textAlign: 'left' }}>
      <span style={{ width: 18, fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: 'var(--faint)' }}>{rank}</span>
      <Avatar person={p} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>{entry.winRate}% win rate · {entry.played} played</div>
        <div style={{ height: 4, borderRadius: 99, background: 'var(--sunken)', marginTop: 6, overflow: 'hidden', maxWidth: 130 }}>
          <div style={{ height: '100%', width: entry.winRate + '%', background: 'var(--accent)', borderRadius: 99, opacity: 0.85 }} />
        </div>
      </div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 15.5, fontWeight: 700, color: 'var(--ink)' }}>{entry.won}<span style={{ color: 'var(--faint)', fontWeight: 600 }}>–{entry.lost}</span></div>
    </button>
  );
}

function LocalAvatarStack({ ids, personById, size = 22, onPlayer }) {
  return (
    <span style={{ display: 'inline-flex' }}>
      {ids.map((id, i) => {
        const p = personById(id);
        return <span key={id} style={{ marginLeft: i === 0 ? 0 : -size * 0.34 }}>
          <TeamMark person={p} size={size} onClick={onPlayer ? () => onPlayer(p) : null} />
        </span>;
      })}
    </span>
  );
}

function MatchRow({ store, game, onPlayer, onSelect }) {
  const pById = store.personById;
  const isTeams = game.format === 'teams';

  let body;
  if (isTeams) {
    const aWon = game.winner === 'A';
    const winIds = aWon ? game.teamA : game.teamB;
    const loseIds = aWon ? game.teamB : game.teamA;
    const scoreTxt = game.cat === 'fifa' && game.score
      ? (aWon ? `${game.score[0]}–${game.score[1]}` : `${game.score[1]}–${game.score[0]}`)
      : null;
    body = (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <LocalAvatarStack ids={winIds} personById={pById} size={30} onPlayer={onPlayer} />
          <span style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>{scoreTxt || 'won'}</span>
          <span style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 700 }}>vs</span>
          <LocalAvatarStack ids={loseIds} personById={pById} size={24} onPlayer={onPlayer} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 600, marginTop: 5 }}>
          {game.cat === 'fifa' ? 'FIFA' : game.title}{winIds.length > 1 ? ' · teams' : ''}
        </div>
      </div>
    );
  } else {
    const winner = pById(game.winnerId);
    const losers = game.players.filter(id => id !== game.winnerId);
    body = (
      <>
        <TeamMark person={winner} size={42} ring="var(--accent)" crown onClick={() => onPlayer(winner)} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>{winner?.name || ''} <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 500 }}>won</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 600 }}>{game.title}</span>
            <span style={{ color: 'var(--line)' }}>·</span>
            <LocalAvatarStack ids={losers.slice(0, 4)} personById={pById} size={18} onPlayer={onPlayer} />
            {losers.length > 4 && <span style={{ fontSize: 11, color: 'var(--faint)' }}>+{losers.length - 4}</span>}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Card onClick={() => onSelect(game)} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, cursor: 'pointer' }} pad={13}>
        {body}
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'inline-block', background: 'var(--sunken)', color: 'var(--muted)', borderRadius: 99, padding: '3px 8px', fontSize: 10.5, fontWeight: 600, marginBottom: 5 }}>{game.cat === 'fifa' ? 'FIFA' : 'Others'}</span>
          <div style={{ fontSize: 11.5, color: 'var(--faint)', fontWeight: 600 }}>{fmtDateShort(game.date)}</div>
        </div>
      </Card>
    </>
  );
}

function DetailPlayers({ store, ids, win, onPlayer }) {
  if (!ids.length) return <div style={{ fontSize: 13.5, color: 'var(--faint)' }}>—</div>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {ids.map(id => {
        const p = store.personById(id);
        return (
          <button key={id} type="button" onClick={() => onPlayer(p)} style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none',
            borderRadius: 99, padding: '4px 13px 4px 4px', fontFamily: 'inherit',
            background: win ? 'var(--accent-soft)' : 'var(--sunken)' }}>
            <Avatar person={p} size={26} />
            <span style={{ fontSize: 13, fontWeight: 700, color: win ? 'var(--accent)' : 'var(--muted)' }}>{p?.name || 'Unknown'}</span>
          </button>
        );
      })}
    </div>
  );
}

function MetaRow({ label, value, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '11px 2px', borderBottom: last ? 'none' : '1px solid var(--line)' }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{value}</span>
    </div>
  );
}

function GameDetailSheet({ store, game, open, onClose, onPlayer, onEdit }) {
  if (!game) return <Sheet open={open} onClose={onClose} title="" />;
  const { players, winners } = matchSides(game);
  const losers = players.filter(id => !winners.includes(id));
  const isTeams = game.format === 'teams';
  const scoreTxt = game.score
    ? (isTeams
        ? (game.winner === 'A' ? `${game.score[0]}–${game.score[1]}` : `${game.score[1]}–${game.score[0]}`)
        : `${game.score[0]}–${game.score[1]}`)
    : null;

  return (
    <Sheet open={open} onClose={onClose} title={game.cat === 'fifa' ? 'FIFA' : (game.title || 'Match')}>
      <Card style={{ textAlign: 'center', marginBottom: 20 }} pad={20}>
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--muted)' }}>
          {isTeams && winners.length > 1 ? 'Winning team' : 'Winner'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '14px 0 10px', flexWrap: 'wrap' }}>
          {winners.map(id => {
            const p = store.personById(id);
            return (
              <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <TeamMark person={p} size={52} ring="var(--accent)" crown onClick={() => onPlayer(p)} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink)', maxWidth: 72,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p?.name || 'Unknown'}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: scoreTxt ? 27 : 17, fontWeight: 700, color: 'var(--accent)', letterSpacing: -0.5 }}>
          {scoreTxt || 'won'}
        </div>
      </Card>

      <Lbl top>{isTeams && losers.length > 1 ? 'Other team' : 'Also played'}</Lbl>
      <DetailPlayers store={store} ids={losers} onPlayer={onPlayer} />

      <Lbl>Details</Lbl>
      <Card pad={14} style={{ marginBottom: 20 }}>
        <MetaRow label="Date" value={fmtDate(game.date)} />
        <MetaRow label="Game" value={game.cat === 'fifa' ? 'FIFA' : (game.title || 'Others')} />
        <MetaRow label="Format" value={isTeams ? 'Teams' : 'Free-for-all'} />
        <MetaRow label="Players" value={players.length} last />
      </Card>

      <Btn variant="ghost" icon="edit" onClick={() => onEdit(game)} style={{ width: '100%', marginBottom: 8 }}>
        Edit match
      </Btn>
    </Sheet>
  );
}

function RecordBlock({ label, rec }) {
  return (
    <div style={{ flex: 1, background: 'var(--sunken)', borderRadius: 16, padding: '14px 16px' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</div>
      {rec.played > 0 ? (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 27, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.5 }}>{rec.won}<span style={{ color: 'var(--faint)' }}>–{rec.lost}</span></span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{rec.winRate}%</span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: 'var(--line)', marginTop: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: rec.winRate + '%', background: 'var(--accent)', borderRadius: 99 }} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--faint)', marginTop: 6 }}>{rec.played} played</div>
        </>
      ) : (
        <div style={{ fontSize: 13.5, color: 'var(--faint)', marginTop: 8 }}>No matches yet</div>
      )}
    </div>
  );
}

function GamePlayerSheet({ store, person, open, onClose }) {
  if (!person) return <Sheet open={open} onClose={onClose} title="" />;
  const board = playerGameRecord(person, store.games, 'board');
  const fifa = playerGameRecord(person, store.games, 'fifa');
  const matches = playerMatches(person, store.games).slice(0, 8);
  const totalWon = board.won + fifa.won;

  return (
    <Sheet open={open} onClose={onClose} title="">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: -4, marginBottom: 20 }}>
        <Avatar person={person} size={56} ring />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 23, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.3 }}>{person.name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 1 }}>{totalWon} total wins across the table</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        <RecordBlock label="Others" rec={board} />
        <RecordBlock label="FIFA" rec={fifa} />
      </div>
      {matches.length > 0 && (
        <>
          <Lbl top>Match history</Lbl>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 6 }}>
            {matches.map(g => {
              const won = matchSides(g).winners.includes(person.id);
              const sc = g.cat === 'fifa' && g.score ? (g.winner === 'A' ? `${g.score[0]}–${g.score[1]}` : `${g.score[1]}–${g.score[0]}`) : null;
              return (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 13, background: 'var(--sunken)' }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: won ? 'var(--accent)' : 'var(--line)', color: won ? 'var(--accent-ink)' : 'var(--muted)',
                    fontFamily: 'var(--display)', fontWeight: 800, fontSize: 13 }}>{won ? 'W' : 'L'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{g.cat === 'fifa' ? 'FIFA' : g.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{fmtDate(g.date)}{g.format === 'teams' && g.cat !== 'fifa' ? ' · teams' : ''}</div>
                  </div>
                  {sc && <span style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: won ? 'var(--accent)' : 'var(--faint)' }}>{sc}</span>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Sheet>
  );
}

function DayGroups({ store, games, onPlayer, onSelect }) {
  const [selected, setSelected] = useState(null);
  const grouped = games.reduce((acc, g) => { (acc[g.date] = acc[g.date] || []).push(g); return acc; }, {});
  const dates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));
  const selectedGames = selected ? (grouped[selected] || []) : [];

  return (
    <>
      {dates.map(date => {
        const gs = grouped[date];
        const players = [...new Set(gs.flatMap(g => g.format === 'teams' ? [...(g.teamA||[]), ...(g.teamB||[])] : (g.players||[])))];
        return (
          <Card key={date} onClick={() => setSelected(date)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }} pad={13}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{fmtDate(date)}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{gs.length} {gs.length === 1 ? 'game' : 'games'}</div>
            </div>
            <div style={{ display: 'flex' }}>
              {players.slice(0, 5).map((id, i) => (
                <span key={id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                  <Avatar person={store.personById(id)} size={26} />
                </span>
              ))}
            </div>
            <Icon name="chevron-right" size={16} sw={2.2} color="var(--faint)" />
          </Card>
        );
      })}
      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected ? fmtDate(selected) : ''}>
        {selectedGames.map(g => <MatchRow key={g.id} store={store} game={g} onPlayer={id => { setSelected(null); onPlayer(id); }} onSelect={g => { setSelected(null); onSelect(g); }} />)}
      </Sheet>
    </>
  );
}

function RivalryBar({ wins, total, idA }) {
  const pct = total === 0 ? 50 : Math.round((wins[idA] || 0) / total * 100);
  return (
    <div style={{ height: 5, borderRadius: 99, background: 'var(--line)', overflow: 'hidden', margin: '7px 0' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width .4s' }} />
    </div>
  );
}

function RivalriesSection({ store, cat }) {
  const { people, games } = store;
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickA, setPickA] = useState(null);
  const [pickB, setPickB] = useState(null);
  const pById = store.personById;

  const rivalries = rivalryStats(games, cat);
  const top = rivalries.slice(0, 4);

  const h2h = pickA && pickB ? rivalries.find(r => r.ids.includes(pickA.id) && r.ids.includes(pickB.id)) : null;

  const RivalryCard = ({ r }) => {
    const [a, b] = r.ids.map(pById).filter(Boolean);
    if (!a || !b) return null;
    const wA = r.wins[a.id] || 0, wB = r.wins[b.id] || 0;
    const leader = wA > wB ? a : wB > wA ? b : null;
    return (
      <Card pad={12} style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar person={a} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{a.name}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--display)' }}>{wA}</span>
            </div>
            <RivalryBar wins={r.wins} total={r.total} idA={a.id} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{b.name}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--muted)', fontFamily: 'var(--display)' }}>{wB}</span>
            </div>
          </div>
          <Avatar person={b} size={34} />
        </div>
        {leader && <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>👑 {leader.name} leads · {r.total} games</div>}
        {!leader && <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--muted)', marginTop: 6 }}>Tied · {r.total} games</div>}
      </Card>
    );
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <SectionTitle style={{ marginBottom: 0 }}>Rivalries</SectionTitle>
        <button type="button" onClick={() => { setPickA(null); setPickB(null); setSheetOpen(true); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--accent)', padding: 0 }}>Pick players</button>
      </div>

      {top.length === 0 ? (
        <Card pad={20} style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>Not enough games yet</div>
        </Card>
      ) : (
        top.map((r, i) => <RivalryCard key={i} r={r} />)
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Head-to-Head">
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>Pick two players to compare</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {people.map(p => {
            const selA = pickA?.id === p.id, selB = pickB?.id === p.id;
            const sel = selA || selB;
            return (
              <button key={p.id} type="button" onClick={() => {
                if (selA) { setPickA(null); return; }
                if (selB) { setPickB(null); return; }
                if (!pickA) setPickA(p); else if (!pickB) setPickB(p);
              }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{ borderRadius: '50%', boxShadow: sel ? `0 0 0 3px var(--surface), 0 0 0 5px ${selA ? 'var(--accent)' : 'oklch(0.62 0.13 245)'}` : 'none' }}>
                  <Avatar person={p} size={48} />
                </div>
                <span style={{ fontSize: 10.5, fontWeight: sel ? 700 : 500, color: sel ? 'var(--ink)' : 'var(--faint)', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </button>
            );
          })}
        </div>
        {pickA && pickB && (
          h2h ? <RivalryCard r={h2h} /> : (
            <Card pad={20} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13.5, color: 'var(--muted)' }}>No games between these two yet</div>
            </Card>
          )
        )}
      </Sheet>
    </>
  );
}

function ArenaCategoryFilter({ cat, onChange, label = 'Arena stats filter' }) {
  return (
    <div role="group" aria-label={label} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        <span style={{ color: 'var(--muted)', fontSize: 12, marginRight: 4 }}>Stats</span>
        {[{ value: 'all', label: 'All' }, { value: 'fifa', label: 'FIFA' }, { value: 'board', label: 'Others' }].map(option => (
          <button key={option.value} type="button" aria-pressed={cat === option.value} onClick={() => onChange(option.value)} style={{
            border: 'none', borderRadius: 99, padding: '8px 14px', minHeight: 38, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: cat === option.value ? 'var(--accent-soft)' : 'transparent', color: cat === option.value ? 'var(--accent)' : 'var(--muted)',
          }}>{option.label}</button>
        ))}
      </div>
  );
}

export function FullStandingsSheet({ open, onClose, standings, cat, onCategoryChange, onPlayer }) {
  const uniqueVals = [...new Set(standings.map(s => s.won))].sort((a, b) => b - a);
  return (
    <Sheet open={open} onClose={onClose} title="Full standings">
      <ArenaCategoryFilter cat={cat} onChange={onCategoryChange} label="Full standings filter" />
      <Card pad={8}>
        {standings.length ? standings.map((e, i) => (
          <div key={e.person.id}>
            {i > 0 && <div style={{ height: 1, background: 'var(--line)', margin: '0 2px' }} />}
            <StandingRow rank={uniqueVals.indexOf(e.won) + 1} entry={e} onClick={() => { onClose(); onPlayer(e.person); }} />
          </div>
        )) : <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>
          {cat === 'all' ? 'No matches yet' : `No ${cat === 'fifa' ? 'FIFA' : 'Others'} matches yet`}
        </div>}
      </Card>
    </Sheet>
  );
}

export function GamesScreen({ store }) {
  const { people, games } = store;
  const [cat, setCat] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const [view, setView] = useState('standings');
  const [allResults, setAllResults] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [player, setPlayer] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [detailGame, setDetailGame] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openPlayer = (p) => { if (p) { setPlayer(p); setPlayerOpen(true); } };
  const openDetail = (g) => { setDetailGame(g); setDetailOpen(true); };
  const openEdit = (g) => { setDetailOpen(false); setEditingGame(g); setEditorOpen(true); };
  const standings = gameStats(people, games, cat);
  const recent = recentGames(games, cat);
  const ranks = [...new Set(standings.map(entry => entry.won))];
  const recentDates = [...new Set(recent.map(game => game.date))];
  const visibleResults = allResults ? recent : recent.filter(game => recentDates.slice(0, 6).includes(game.date));

  return (
    <div style={{ padding: '4px 18px 28px' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0 20px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 32, color: 'var(--ink)', margin: 0 }}>The Arena</h1>
        </div>
        <Btn variant="primary" icon="plus" onClick={() => setEditorOpen(true)}>Log a match</Btn>
      </header>
      <ArenaCategoryFilter cat={cat} onChange={setCat} />
      <div className="arena-view-tabs" style={{ marginBottom: 20 }}>
        <Segment value={view} onChange={setView} options={[
          { value: 'standings', label: 'Standings' }, { value: 'results', label: 'Results' }, { value: 'rivalries', label: 'Rivalries' },
        ]} />
      </div>

      {view === 'standings' && <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 20, color: 'var(--ink)' }}>The leaderboard</h2>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>{recent.length} {recent.length === 1 ? 'match' : 'matches'}</span>
        </div>
        {standings.length ? <Card pad={12}>
          {standings.slice(0, 5).map((entry, i) => <div key={entry.person.id} style={{ borderTop: i ? '1px solid var(--line)' : 'none' }}>
            <StandingRow spacious rank={ranks.indexOf(entry.won) + 1} entry={entry} onClick={() => openPlayer(entry.person)} />
          </div>)}

          {standings.length > 5 && <button type="button" onClick={() => setShowAll(true)} style={{ width: '100%', border: 'none', borderTop: '1px solid var(--line)', background: 'none', color: 'var(--accent)', padding: '16px 0 4px', font: 'inherit', fontSize: 13, cursor: 'pointer' }}>
            See all {standings.length} players
          </button>}

        </Card> : <Card pad={24} style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--ink)', fontSize: 16 }}>{cat === 'all' ? 'No matches yet' : `No ${cat === 'fifa' ? 'FIFA' : 'Others'} matches yet`}</div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Log a match to start the leaderboard.</div>
        </Card>}
        <div style={{ color: 'var(--muted)', fontSize: 12, textAlign: 'center', marginTop: 12 }}>Ranked by wins · Tap a player for their record</div>
      </>}

      {view === 'results' && <>
        <SectionTitle>Match history</SectionTitle>
        {recent.length ? <>
          <DayGroups store={store} games={visibleResults} onPlayer={openPlayer} onSelect={openDetail} />
          {recentDates.length > 6 && <Btn variant="quiet" onClick={() => setAllResults(value => !value)} style={{ width: '100%' }}>{allResults ? 'Show latest 6 nights' : 'See all nights'}</Btn>}
        </> : <Card style={{ color: 'var(--muted)', textAlign: 'center' }}>No results in this category yet.</Card>}
      </>}
      {view === 'rivalries' && <RivalriesSection store={store} cat={cat} />}

      <FullStandingsSheet open={showAll} onClose={() => setShowAll(false)} standings={standings}
        cat={cat} onCategoryChange={setCat} onPlayer={openPlayer} />

      <GameDetailSheet store={store} game={detailGame} open={detailOpen} onClose={() => setDetailOpen(false)}
        onPlayer={p => { setDetailOpen(false); openPlayer(p); }} onEdit={openEdit} />
      <MatchEditor store={store} open={editorOpen} onClose={() => { setEditorOpen(false); setEditingGame(null); }} initialCat={cat === 'all' ? 'board' : cat} editing={editingGame} />
      <GamePlayerSheet store={store} person={player} open={playerOpen} onClose={() => setPlayerOpen(false)} />
    </div>
  );
}
