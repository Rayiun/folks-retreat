import { useState, useEffect } from 'react';
import { surnameOf, fmtDateShort, fmtDate, matchSides, gameStats, recentGames, playerGameRecord, playerMatches } from './store.js';
import { Avatar, Icon, Sheet, Btn, Card, Segment, ConfirmDelete } from './ui.jsx';
import { SectionTitle, PageHead, DateField } from './screens.jsx';

const BOARD_TITLES = ['Baloot', 'Codenames', 'Catan', 'Carrom', 'Dominoes', 'Monopoly', 'Uno', 'Risk'];
const TEAM_B_COLOR = 'oklch(0.62 0.13 245)';
const teamColor = (t) => (t === 'A' ? 'var(--accent)' : TEAM_B_COLOR);
const strip = (name) => surnameOf(name);
const isoOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const TODAY_ISO = (() => { const d = new Date(); if (d.getHours() < 7) d.setDate(d.getDate() - 1); return isoOf(d); })();
const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

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

function Stepper({ value, onChange }) {
  const btn = (name, fn, disabled) => (
    <button type="button" onClick={disabled ? undefined : fn} style={{
      width: 34, height: 34, borderRadius: 11, border: 'none', cursor: disabled ? 'default' : 'pointer',
      background: 'var(--sunken)', color: disabled ? 'var(--faint)' : 'var(--ink)', opacity: disabled ? 0.5 : 1,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={17} sw={2.6} />
    </button>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      {btn('minus', () => onChange(Math.max(0, value - 1)), value <= 0)}
      <div style={{ minWidth: 22, textAlign: 'center', fontFamily: 'var(--display)', fontSize: 23, fontWeight: 700, color: 'var(--ink)' }}>{value}</div>
      {btn('plus', () => onChange(value + 1))}
    </div>
  );
}

function TeamPicker({ people, assign, activeTeam, onAssign }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 11 }}>
      {people.map(p => {
        const t = assign[p.id];
        return (
          <button key={p.id} type="button" onClick={() => onAssign(p.id)} style={{
            border: 'none', background: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <TeamMark person={p} size={44} ring={t ? teamColor(t) : null} badge={t} dim={!t} />
            <span style={{ fontSize: 10, fontWeight: t ? 700 : 500, color: t ? 'var(--ink)' : 'var(--faint)',
              maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function CrownPicker({ people, selected, winner, onToggle, onCrown }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 13 }}>
      {people.map(p => {
        const on = selected.includes(p.id);
        const isWin = winner === p.id;
        return (
          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => onToggle(p.id)} style={{
                border: 'none', background: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}>
                <TeamMark person={p} size={52} ring={on ? 'var(--accent)' : null} dim={!on} />
              </button>
              {on && (
                <button type="button" aria-label="Mark winner" onClick={(e) => { e.stopPropagation(); onCrown(p.id); }} style={{
                  position: 'absolute', right: -6, top: -8, width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', padding: 0,
                  border: '2.5px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isWin ? 'var(--accent)' : 'var(--sunken)', transition: 'all .15s',
                  boxShadow: isWin ? '0 2px 7px rgba(0,0,0,0.2)' : 'none' }}>
                  <Icon name="crown" size={14} sw={2.2} color={isWin ? 'var(--accent-ink)' : 'var(--faint)'} fill={isWin} />
                </button>
              )}
            </div>
            <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 500, color: on ? 'var(--ink)' : 'var(--faint)',
              maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
          </div>
        );
      })}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      border: 'none', cursor: 'pointer', borderRadius: 99, padding: '7px 13px', fontFamily: 'inherit',
      fontSize: 13, fontWeight: 600, transition: 'all .15s',
      background: active ? 'var(--accent)' : 'var(--sunken)', color: active ? 'var(--accent-ink)' : 'var(--muted)' }}>{children}</button>
  );
}

function SameCrewChip({ onClick, label, style: s = {} }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer', borderRadius: 99,
      padding: '8px 14px', border: '1.5px dashed var(--accent)', background: 'var(--accent-soft)',
      color: 'var(--accent)', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, ...s }}>
      <Icon name="history" size={15} sw={2.2} /> {label}
    </button>
  );
}

function QuickDate({ value, onChange }) {
  const [showCal, setShowCal] = useState(false);
  const customActive = value !== TODAY_ISO;
  const pill = (label, active, onClick) => (
    <button type="button" onClick={onClick} style={{
      flex: 1, border: 'none', cursor: 'pointer', borderRadius: 12, padding: '11px 8px', fontFamily: 'inherit',
      fontSize: 14, fontWeight: 700, transition: 'all .15s', whiteSpace: 'nowrap',
      background: active ? 'var(--accent)' : 'var(--sunken)', color: active ? 'var(--accent-ink)' : 'var(--muted)' }}>{label}</button>
  );
  return (
    <div style={{ marginBottom: showCal ? 0 : 22 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {pill('Today', !customActive, () => { onChange(TODAY_ISO); setShowCal(false); })}
        {pill(customActive ? fmtDateShort(value) : 'Pick a date', customActive, () => setShowCal(true))}
      </div>
      {showCal && <div style={{ marginTop: 10 }}><DateField value={value} onChange={(d) => { onChange(d); setShowCal(false); }} autoOpen /></div>}
    </div>
  );
}

const Lbl = ({ children, top }) => (
  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--muted)', margin: top ? '0 0 8px' : '20px 0 8px' }}>{children}</div>
);

function TeamTag({ t, count, active, onClick }) {
  const c = teamColor(t);
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', borderRadius: 14, padding: '10px 13px',
      fontFamily: 'inherit', transition: 'all .15s',
      border: active ? `2px solid ${c}` : '2px solid var(--line)',
      background: active ? `color-mix(in oklch, ${t === 'A' ? 'var(--accent)' : TEAM_B_COLOR} 13%, var(--surface))` : 'var(--surface)' }}>
      <span style={{ width: 24, height: 24, borderRadius: 8, background: c, color: '#fff', fontFamily: 'var(--display)',
        fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Team {t}</span>
      <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 'auto' }}>{count}</span>
      {active && <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, textTransform: 'uppercase', color: c }}>· filling</span>}
    </button>
  );
}

const TITLES_KEY = 'fr_game_titles';
function loadSavedTitles() {
  try { return JSON.parse(localStorage.getItem(TITLES_KEY) || '[]'); } catch { return []; }
}
function saveTitle(t) {
  if (!t) return;
  const existing = loadSavedTitles();
  if (!existing.includes(t)) localStorage.setItem(TITLES_KEY, JSON.stringify([t, ...existing].slice(0, 20)));
}

function MatchEditor({ store, open, onClose, initialCat, editing }) {
  const { people } = store;
  const [cat, setCat] = useState(initialCat || 'board');
  const [date, setDate] = useState(TODAY_ISO);
  const [title, setTitle] = useState('');
  const [savedTitles, setSavedTitles] = useState([]);
  const [assign, setAssign] = useState({});
  const [activeTeam, setActiveTeam] = useState('A');
  const [teamWinner, setTeamWinner] = useState(null);
  const [soloWinner, setSoloWinner] = useState(null);
  const [soloScore, setSoloScore] = useState({ w: 0, l: 0 });
  const [score, setScore] = useState({ A: 0, B: 0 });

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [teamsFromNight, setTeamsFromNight] = useState(false);

  const reset = () => {
    setTitle(''); setDate(TODAY_ISO);
    setAssign({}); setActiveTeam('A'); setTeamWinner(null); setSoloWinner(null); setSoloScore({ w: 0, l: 0 }); setScore({ A: 0, B: 0 });
    setTeamsFromNight(false);
  };
  useEffect(() => {
    if (!open) return;
    setSavedTitles(loadSavedTitles());
    if (editing) {
      setCat(editing.cat);
      setDate(editing.date);
      setTitle(editing.cat === 'fifa' ? '' : editing.title);
      if (editing.format === 'teams') {
        const a = {}; (editing.teamA || []).forEach(id => a[id] = 'A'); (editing.teamB || []).forEach(id => a[id] = 'B');
        setAssign(a); setActiveTeam('A'); setTeamWinner(editing.winner);
        if (editing.cat === 'fifa' && editing.score) setScore({ A: editing.score[0], B: editing.score[1] });
      } else {
        const a = {}; (editing.players || []).forEach(id => a[id] = 'A');
        setAssign(a); setActiveTeam('A'); setSoloWinner(editing.winnerId);
        if (editing.score) setSoloScore({ w: editing.score[0], l: editing.score[1] });
      }
    } else {
      setCat(initialCat || 'board'); reset();
      // pre-fill teams from most recent game tonight
      const tonight = store.games.filter(g => g.date === TODAY_ISO && g.format === 'teams');
      if (tonight.length > 0) {
        const last = tonight[0];
        const a = {}; (last.teamA || []).forEach(id => a[id] = 'A'); (last.teamB || []).forEach(id => a[id] = 'B');
        setAssign(a); setActiveTeam('A'); setTeamsFromNight(true);
      }
    }
  }, [open]);

  const pById = (id) => people.find(p => p.id === id);
  const teamA = Object.keys(assign).filter(id => assign[id] === 'A');
  const teamB = Object.keys(assign).filter(id => assign[id] === 'B');

  // solo = players assigned to only one side
  const isSolo = (teamA.length >= 1) !== (teamB.length >= 1);
  const soloPlayers = isSolo ? (teamA.length ? teamA : teamB) : [];

  const assignToTeam = (id) => {
    setTeamWinner(null); setSoloWinner(null);
    setAssign(a => {
      const copy = { ...a };
      if (copy[id] === activeTeam) delete copy[id];
      else copy[id] = activeTeam;
      return copy;
    });
  };

  const fifaScoreWinner = score.A === score.B ? null : (score.A > score.B ? 'A' : 'B');

  const soloFifaValid = soloWinner !== null && soloScore.w !== soloScore.l;
  const canSave = isSolo
    ? (soloPlayers.length >= 1 && soloWinner !== null && (cat === 'fifa' ? soloFifaValid : true))
    : (teamA.length >= 1 && teamB.length >= 1 && (cat === 'fifa' ? fifaScoreWinner : teamWinner));

  const save = () => {
    if (!canSave) return;
    const t = cat === 'fifa' ? 'FIFA' : (title.trim() || 'Game night');
    if (cat !== 'fifa' && title.trim()) saveTitle(title.trim());
    let gameData;
    if (isSolo) {
      const extras = cat === 'fifa' ? { score: [soloScore.w, soloScore.l] } : {};
      gameData = { cat, format: 'ffa', date, title: t, players: soloPlayers, winnerId: soloWinner, ...extras };
    } else if (cat === 'fifa') {
      gameData = { cat: 'fifa', format: 'teams', date, title: t, teamA, teamB, winner: fifaScoreWinner, score: [score.A, score.B] };
    } else {
      gameData = { cat: 'board', format: 'teams', date, title: t, teamA, teamB, winner: teamWinner };
    }
    if (editing) store.updateGame(editing.id, gameData);
    else store.addGame(gameData);
    onClose();
  };

  const switchCat = () => { setCat(nc => nc === 'fifa' ? 'board' : 'fifa'); setTeamWinner(null); setSoloWinner(null); setSoloScore({ w: 0, l: 0 }); setScore({ A: 0, B: 0 }); setTitle(''); };
  const suggestions = savedTitles.filter(t => t.toLowerCase().includes(title.toLowerCase()) && t !== title);

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit match' : `Log a ${cat === 'fifa' ? 'FIFA' : 'board'} match`}>
      {/* category switch */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6, marginBottom: 14 }}>
        <button type="button" onClick={switchCat} style={{ border: 'none', background: 'none', cursor: 'pointer',
          color: 'var(--accent)', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="shuffle" size={15} sw={2.2} /> {cat === 'fifa' ? 'Log a board game instead' : 'Log FIFA instead'}
        </button>
      </div>

      {/* game name input — board only */}
      {cat === 'board' && (
        <div style={{ marginBottom: 18, position: 'relative' }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Game name (e.g. Baloot, Catan…)"
            style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 13,
              border: '1.5px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)',
              fontFamily: 'inherit', fontSize: 15.5, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--line)'}
          />
          {suggestions.length > 0 && title.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {suggestions.slice(0, 6).map(s => (
                <button key={s} type="button" onClick={() => setTitle(s)} style={{
                  border: 'none', cursor: 'pointer', borderRadius: 99, padding: '5px 12px',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                  background: 'var(--sunken)', color: 'var(--muted)' }}>{s}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* team tags — A active by default */}
      <div style={{ display: 'flex', gap: 10, marginBottom: teamsFromNight ? 8 : 14, alignItems: 'center' }}>
        <TeamTag t="A" count={teamA.length} active={activeTeam === 'A'} onClick={() => setActiveTeam('A')} />
        <TeamTag t="B" count={teamB.length} active={activeTeam === 'B'} onClick={() => setActiveTeam('B')} />
      </div>
      {teamsFromNight && !editing && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '7px 11px', borderRadius: 12, background: 'var(--accent-soft)' }}>
          <span style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 600 }}>Same teams as tonight</span>
          <button type="button" onClick={() => { setAssign({}); setTeamsFromNight(false); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--accent)', padding: '2px 6px' }}>Clear</button>
        </div>
      )}

      {/* player grid */}
      <TeamPicker people={people} assign={assign} activeTeam={activeTeam} onAssign={assignToTeam} />

      {/* outcome — solo mode */}
      {isSolo && soloPlayers.length >= 1 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Who won?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {soloPlayers.map(id => {
              const p = pById(id);
              const won = soloWinner === id;
              return (
                <button key={id} type="button" onClick={() => setSoloWinner(won ? null : id)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
                  <div style={{ borderRadius: '50%', boxShadow: won ? `0 0 0 3px var(--surface), 0 0 0 5.5px var(--accent)` : 'none', transition: 'box-shadow .15s' }}>
                    <Avatar person={p} size={48} dim={soloWinner !== null && !won} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: won ? 700 : 500, color: won ? 'var(--accent)' : 'var(--faint)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    {won && <Icon name="crown" size={11} sw={2.2} color="var(--accent)" fill />}
                    {p?.name || ''}
                  </span>
                </button>
              );
            })}
          </div>
          {cat === 'fifa' && soloWinner && (
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
              background: 'var(--sunken)', borderRadius: 18, padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)' }}>
                  {pById(soloWinner)?.name || ''}
                </span>
                <Stepper value={soloScore.w} onChange={v => setSoloScore(s => ({ ...s, w: v }))} />
              </div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: 'var(--faint)' }}>vs</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--faint)' }}>Others</span>
                <Stepper value={soloScore.l} onChange={v => setSoloScore(s => ({ ...s, l: v }))} />
              </div>
            </div>
          )}
          {cat === 'fifa' && soloWinner && soloScore.w === soloScore.l && (
            <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--faint)', marginTop: 8 }}>No draws — someone has to lose.</div>
          )}
        </div>
      )}

      {/* outcome — teams mode */}
      {!isSolo && teamA.length >= 1 && teamB.length >= 1 && (
        <div style={{ marginTop: 20 }}>
          {cat === 'fifa' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 8,
                background: 'var(--sunken)', borderRadius: 18, padding: '16px 12px' }}>
                {['A', 'B'].map((side, i) => {
                  const ids = side === 'A' ? teamA : teamB;
                  const winning = fifaScoreWinner === side;
                  return (
                    <div key={side} style={{ display: 'contents' }}>
                      {i === 1 && <div style={{ fontFamily: 'var(--display)', fontSize: 15, fontWeight: 700, color: 'var(--faint)' }}>vs</div>}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                        opacity: fifaScoreWinner && !winning ? 0.5 : 1, transition: 'opacity .15s' }}>
                        <div style={{ display: 'flex' }}>
                          {ids.map((id, j) => <span key={id} style={{ marginLeft: j === 0 ? 0 : -10 }}><TeamMark person={pById(id)} size={34} ring={teamColor(side)} /></span>)}
                        </div>
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: teamColor(side), fontFamily: 'var(--display)' }}>Team {side}</span>
                        <Stepper value={score[side]} onChange={v => setScore(s => ({ ...s, [side]: v }))} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {score.A === score.B && <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--faint)', marginTop: 8 }}>No draws — someone has to lose.</div>}
            </>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              {['A', 'B'].map(side => {
                const won = teamWinner === side;
                const ids = side === 'A' ? teamA : teamB;
                return (
                  <button key={side} type="button" onClick={() => setTeamWinner(side)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', borderRadius: 15, padding: '11px 13px',
                    border: won ? `2px solid ${teamColor(side)}` : '2px solid var(--line)',
                    background: won ? `color-mix(in oklch, ${side === 'A' ? 'var(--accent)' : TEAM_B_COLOR} 14%, var(--surface))` : 'var(--surface)',
                    fontFamily: 'inherit', transition: 'all .15s' }}>
                    <div style={{ display: 'flex' }}>
                      {ids.slice(0, 3).map((id, j) => <span key={id} style={{ marginLeft: j === 0 ? 0 : -9 }}><Avatar person={pById(id)} size={26} /></span>)}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: teamColor(side), fontFamily: 'var(--display)' }}>Team {side}</span>
                    {won && <Icon name="crown" size={15} sw={2.2} color={teamColor(side)} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <QuickDate value={date} onChange={setDate} />
      </div>

      <Btn variant="primary" size="lg" icon="check" disabled={!canSave} onClick={save} style={{ width: '100%', marginTop: 4 }}>
        Save result
      </Btn>
      {editing && (
        <>
          <ConfirmDelete open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => { store.deleteGame(editing.id); onClose(); }} />
          <Btn variant="quiet" size="sm" icon="trash" onClick={() => setConfirmOpen(true)} style={{ width: '100%', marginTop: 10, color: 'oklch(0.58 0.18 25)' }}>
            Delete this match
          </Btn>
        </>
      )}
    </Sheet>
  );
}

// ── Podium ────────────────────────────────────────────────
const PODIUM_META = {
  1: { av: 60, ped: 56, tone: 'var(--accent)',            pedBg: 'var(--accent-soft)' },
  2: { av: 48, ped: 40, tone: 'oklch(0.60 0.035 250)',   pedBg: 'color-mix(in oklch, oklch(0.60 0.035 250) 14%, var(--surface))' },
  3: { av: 48, ped: 30, tone: 'oklch(0.58 0.085 55)',    pedBg: 'color-mix(in oklch, oklch(0.58 0.085 55) 14%, var(--surface))' },
};

function Podium({ entries, onPlayer }) {
  return (
    <Card pad={16} style={{ marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, var(--accent-soft), transparent 55%)', opacity: 0.45, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        {[2, 1, 3].map(rank => {
          const entry = entries[rank - 1];
          if (!entry) return <div key={rank} style={{ flex: 1 }} />;
          const m = PODIUM_META[rank];
          const p = entry.person;
          return (
            <button key={rank} onClick={() => onPlayer(p)} style={{ flex: 1, border: 'none', background: 'none', cursor: 'pointer',
              padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <TeamMark person={p} size={m.av} ring={m.tone} crown={rank === 1} />
              <div style={{ fontSize: rank === 1 ? 14 : 12.5, fontWeight: 700, color: 'var(--ink)', maxWidth: '100%',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: -2 }}>{entry.won}–{entry.lost}</div>
              <div style={{ width: '100%', height: m.ped, borderRadius: '11px 11px 0 0', background: m.pedBg, marginTop: 2,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 6 }}>
                <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: rank === 1 ? 20 : 16, color: m.tone }}>{rank}</span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function StandingRow({ rank, entry, onClick }) {
  const p = entry.person;
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', cursor: 'pointer',
      border: 'none', background: 'none', padding: '10px 2px', textAlign: 'left' }}>
      <span style={{ width: 18, fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: 'var(--faint)' }}>{rank}</span>
      <Avatar person={p} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
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

function MatchRow({ store, game, onPlayer, onEdit }) {
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
      <Card onClick={() => onEdit(game)} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, cursor: 'pointer' }} pad={13}>
        {body}
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 11.5, color: 'var(--faint)', fontWeight: 600 }}>{fmtDateShort(game.date)}</span>
        </div>
      </Card>
    </>
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
        <RecordBlock label="Board Games" rec={board} />
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

function DayGroups({ store, games, onPlayer, onEdit }) {
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
        {selectedGames.map(g => <MatchRow key={g.id} store={store} game={g} onPlayer={id => { setSelected(null); onPlayer(id); }} onEdit={g => { setSelected(null); onEdit(g); }} />)}
      </Sheet>
    </>
  );
}

export function GamesScreen({ store }) {
  const { people, games } = store;
  const [cat, setCat] = useState('board');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [player, setPlayer] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const openPlayer = (p) => { if (p) { setPlayer(p); setPlayerOpen(true); } };
  const openEdit = (g) => { setEditingGame(g); setEditorOpen(true); };
  const standings = gameStats(people, games, cat);
  const recent = recentGames(games, cat);
  const rest = standings.slice(3);
  const visibleRest = showAll ? rest : rest.slice(0, 5);

  return (
    <div style={{ padding: '4px 18px 28px' }}>
      <PageHead title="The Arena" sub="Bragging rights, officially logged!" />
      <div style={{ marginBottom: 18 }}>
        <Segment value={cat} options={[{ value: 'board', label: 'Board Games' }, { value: 'fifa', label: 'FIFA' }]} onChange={v => { setCat(v); setShowAll(false); }} />
      </div>

      {standings.length > 0 ? (
        <Podium entries={standings} onPlayer={openPlayer} />
      ) : (
        <Card style={{ textAlign: 'center', marginBottom: 18 }} pad={26}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>No {cat === 'board' ? 'Board Games' : 'FIFA'} yet</div>
          <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 4 }}>Someone's scared to lose. Log the first match.</div>
        </Card>
      )}

      <Btn variant="primary" size="lg" icon="plus" onClick={() => setEditorOpen(true)} style={{ width: '100%', marginBottom: 24 }}>
        Log a {cat === 'fifa' ? 'FIFA' : 'board'} match
      </Btn>

      {rest.length > 0 && (
        <>
          <SectionTitle>Rest of the table</SectionTitle>
          <Card style={{ marginBottom: rest.length > 5 ? 12 : 24 }} pad={8}>
            {visibleRest.map((e, i) => (
              <div key={e.person.id}>
                {i > 0 && <div style={{ height: 1, background: 'var(--line)', margin: '0 2px' }} />}
                <StandingRow rank={i + 4} entry={e} onClick={() => openPlayer(e.person)} />
              </div>
            ))}
          </Card>
          {rest.length > 5 && (
            <button onClick={() => setShowAll(s => !s)} style={{ display: 'block', margin: '0 auto 24px', border: 'none', background: 'none',
              cursor: 'pointer', color: 'var(--accent)', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700 }}>
              {showAll ? 'Show less' : `Show all ${standings.length}`}
            </button>
          )}
        </>
      )}

      {recent.length > 0 && (
        <>
          <SectionTitle>Recent results</SectionTitle>
          <DayGroups store={store} games={recent} onPlayer={openPlayer} onEdit={openEdit} />
        </>
      )}

      <MatchEditor store={store} open={editorOpen} onClose={() => { setEditorOpen(false); setEditingGame(null); }} initialCat={cat} editing={editingGame} />
      <GamePlayerSheet store={store} person={player} open={playerOpen} onClose={() => setPlayerOpen(false)} />
    </div>
  );
}
