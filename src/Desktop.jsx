import { useState } from 'react';
import { Icon, Avatar, Card, Btn, Segment } from './ui.jsx';
import { fmtDate, fmtDateShort, rotationOrder, lastFetcher, recentGames, gameStats, matchSides, overdueHost } from './store.js';
import { WeekEditor, PeopleManager, ProfileSheet, ShareSheet, SectionTitle, HistoryScreen, StatsScreen } from './screens.jsx';
import { WheelScreen } from './wheel.jsx';
import { GamesScreen } from './games.jsx';

// ── Sidebar ──────────────────────────────────────────────────
function Sidebar({ active, onChange, store, isDark, toggleTheme }) {
  const { weeks, people } = store;
  const overdue = overdueHost(people, weeks);
  const lf = lastFetcher(store.fetches, store.personById);

  const navItems = [
    { id: 'home',     icon: 'home',    label: 'Home' },
    { id: 'history',  icon: 'users',   label: 'Gatherings' },
    { id: 'games',    icon: 'trophy',  label: 'Games' },
    { id: 'wheel',    icon: 'wheel',   label: 'Wheel' },
    { id: 'stats',    icon: 'chart',   label: 'Stats' },
  ];

  return (
    <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--line)', padding: '28px 16px 24px', gap: 4 }}>
      <div style={{ fontFamily: 'var(--display)', fontSize: 20, fontWeight: 800, color: 'var(--ink)', letterSpacing: -0.5, marginBottom: 6, paddingLeft: 8 }}>Folk's Retreat</div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, paddingLeft: 8, marginBottom: 18 }}>Since 2020 · {350 + weeks.length} nights</div>

      {navItems.map(item => {
        const on = active === item.id;
        return (
          <button key={item.id} onClick={() => onChange(item.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: on ? 700 : 500,
            background: on ? 'var(--accent-soft)' : 'transparent',
            color: on ? 'var(--accent)' : 'var(--muted)', transition: 'all .15s', textAlign: 'left',
          }}>
            <Icon name={item.icon} size={18} sw={on ? 2.4 : 2} color={on ? 'var(--accent)' : 'var(--muted)'} />
            {item.label}
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      {overdue && (
        <div style={{ background: 'var(--sunken)', borderRadius: 12, padding: '11px 12px', marginBottom: 10 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'var(--faint)', marginBottom: 6 }}>Up next to host</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar person={overdue.person} size={28} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{overdue.person.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{overdue.hosted} times hosted</div>
            </div>
          </div>
        </div>
      )}

      <button onClick={toggleTheme} style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 12,
        border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 500,
        background: 'transparent', color: 'var(--muted)', transition: 'all .15s',
      }}>
        <Icon name={isDark ? 'sun' : 'moon'} size={18} sw={2} color="var(--muted)" />
        {isDark ? 'Light mode' : 'Dark mode'}
      </button>
    </div>
  );
}

// ── Center: Gatherings ────────────────────────────────────────
function CenterPanel({ store, openEditor, openProfile }) {
  const { weeks, people } = store;
  const rotation = rotationOrder(people, weeks);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px', minWidth: 0 }}>
      <div style={{ fontSize: 22, fontFamily: 'var(--display)', fontWeight: 800, color: 'var(--ink)', marginBottom: 20, letterSpacing: -0.5 }}>Gatherings</div>

      <button onClick={() => openEditor(null)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: '14px 0', borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 16, fontWeight: 700, background: 'var(--accent)', color: 'var(--accent-ink)',
        marginBottom: 24, transition: 'opacity .15s',
      }}>
        <Icon name="plus" size={18} sw={2.5} color="var(--accent-ink)" /> Log this gathering
      </button>

      <SectionTitle>Host rotation · up next</SectionTitle>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {rotation.slice(0, 6).map((r, i) => (
          <button key={r.person.id} onClick={() => openProfile(r.person)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{ position: 'relative' }}>
              <Avatar person={r.person} size={46} ring={i === 0} />
              <span style={{ position: 'absolute', top: -4, left: -4, width: 18, height: 18, borderRadius: '50%', background: i === 0 ? 'var(--accent)' : 'var(--sunken)', border: '2px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: i === 0 ? 'var(--accent-ink)' : 'var(--faint)' }}>{i + 1}</span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--muted)', maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.person.name}</span>
          </button>
        ))}
      </div>

      <SectionTitle>Recent gatherings</SectionTitle>
      {weeks.slice(0, 8).map(w => {
        const host = store.personById(w.hostId);
        return (
          <Card key={w.id} onClick={() => openEditor(w)} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, cursor: 'pointer' }} pad={12}>
            <Avatar person={host} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{host?.name || 'No host'}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{fmtDate(w.date)}{w.note ? ` · "${w.note}"` : ''}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 600, whiteSpace: 'nowrap' }}>{w.attendees.length} attended</div>
          </Card>
        );
      })}
    </div>
  );
}

// ── Right: Games ──────────────────────────────────────────────
function RightPanel({ store, openProfile }) {
  const { people, games } = store;
  const [cat, setCat] = useState('board');
  const standings = gameStats(people, games, cat);
  const recent = recentGames(games, cat).slice(0, 5);
  const pById = store.personById;

  const PODIUM_ORDER = [2, 1, 3];
  const HEIGHTS = { 1: 64, 2: 44, 3: 34 };
  const COLORS  = { 1: 'var(--accent)', 2: 'oklch(0.60 0.035 250)', 3: 'oklch(0.58 0.085 55)' };

  return (
    <div style={{ width: 320, flexShrink: 0, borderLeft: '1px solid var(--line)', overflowY: 'auto', padding: '28px 18px' }}>
      <div style={{ fontSize: 18, fontFamily: 'var(--display)', fontWeight: 800, color: 'var(--ink)', marginBottom: 16, letterSpacing: -0.4 }}>Games</div>

      <div style={{ marginBottom: 16 }}>
        <Segment value={cat} options={[{ value: 'board', label: 'Board' }, { value: 'fifa', label: 'FIFA' }]} onChange={setCat} />
      </div>

      {standings.length > 0 ? (
        <Card pad={14} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8, paddingBottom: 4 }}>
            {PODIUM_ORDER.map(rank => {
              const e = standings[rank - 1];
              if (!e) return <div key={rank} style={{ flex: 1 }} />;
              return (
                <button key={rank} onClick={() => openProfile(e.person)} style={{ flex: 1, border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Avatar person={e.person} size={rank === 1 ? 44 : 36} ring={rank === 1} />
                  <div style={{ fontSize: rank === 1 ? 12 : 11, fontWeight: 700, color: 'var(--ink)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.person.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{e.won}–{e.lost}</div>
                  <div style={{ width: '100%', height: HEIGHTS[rank], borderRadius: '8px 8px 0 0', background: `color-mix(in oklch, ${COLORS[rank]} 18%, var(--surface))`, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 6 }}>
                    <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: rank === 1 ? 18 : 14, color: COLORS[rank] }}>{rank}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card pad={20} style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>No {cat === 'board' ? 'board' : 'FIFA'} games yet</div>
        </Card>
      )}

      <SectionTitle>Recent results</SectionTitle>
      {recent.length === 0 && <div style={{ fontSize: 13, color: 'var(--faint)', marginBottom: 16 }}>No games logged yet</div>}
      {recent.map(g => {
        const isTeams = g.format === 'teams';
        const { winners } = matchSides(g);
        const teamA = (g.teamA || []).map(pById).filter(Boolean);
        const teamB = (g.teamB || []).map(pById).filter(Boolean);
        const winner = pById(g.winnerId);
        return (
          <Card key={g.id} pad={10} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>{g.title || (g.cat === 'fifa' ? 'FIFA' : 'Board')}</div>
            {isTeams ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>
                <span>{teamA.map(p => p.name.split(' ')[0]).join(', ')}</span>
                <span style={{ color: 'var(--faint)', fontSize: 10 }}>vs</span>
                <span>{teamB.map(p => p.name.split(' ')[0]).join(', ')}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 11 }}>{g.winner === 'A' ? 'Team A' : 'Team B'} won</span>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>
                {winner?.name || '—'} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>won</span>
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 3 }}>{fmtDateShort(g.date)}</div>
          </Card>
        );
      })}
    </div>
  );
}

// ── Wheel panel (full width overlay when active) ──────────────
function WheelPanel({ store }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <WheelScreen store={store} />
    </div>
  );
}

// ── Desktop root ──────────────────────────────────────────────
export function DesktopApp({ store, isDark, toggleTheme }) {
  const [tab, setTab] = useState('home');
  const [editor, setEditor] = useState({ open: false, editing: null, draft: null });
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [profile, setProfile] = useState({ open: false, person: null });
  const [shareOpen, setShareOpen] = useState(false);

  const openEditor = (w) => {
    if (w && w.id) setEditor({ open: true, editing: w, draft: null });
    else setEditor({ open: true, editing: null, draft: w || null });
  };
  const openProfile = (person) => { if (person) setProfile({ open: true, person }); };

  const fullScreenTabs = ['wheel', 'stats', 'history'];
  const isFullScreen = fullScreenTabs.includes(tab);

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      <Sidebar active={tab} onChange={setTab} store={store} isDark={isDark} toggleTheme={toggleTheme} />

      {tab === 'home' && (
        <>
          <CenterPanel store={store} openEditor={openEditor} openProfile={openProfile} />
          <RightPanel store={store} openProfile={openProfile} />
        </>
      )}

      {tab === 'wheel' && <WheelPanel store={store} />}

      {tab === 'history' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <HistoryScreen store={store} openEditor={openEditor} openProfile={openProfile} />
        </div>
      )}

      {tab === 'stats' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <StatsScreen store={store} openPeople={() => setPeopleOpen(true)} openProfile={openProfile} openShare={() => setShareOpen(true)} />
        </div>
      )}

      {tab === 'games' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <GamesScreen store={store} />
        </div>
      )}

      <WeekEditor store={store} open={editor.open} editing={editor.editing} draft={editor.draft} onClose={() => setEditor(e => ({ ...e, open: false }))} />
      <PeopleManager store={store} open={peopleOpen} onClose={() => setPeopleOpen(false)} />
      <ProfileSheet store={store} person={profile.person} open={profile.open} onClose={() => setProfile(p => ({ ...p, open: false }))} openEditor={openEditor} />
      <ShareSheet store={store} open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
