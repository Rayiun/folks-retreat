import { useState, useRef, useEffect } from 'react';
import { useStore } from './store.js';
import { THEMES, themeVars, Icon } from './ui.jsx';
import { HomeScreen, HistoryScreen, StatsScreen, WeekEditor, PeopleManager, ProfileSheet, ShareSheet } from './screens.jsx';
import { GamesScreen } from './games.jsx';
import { WheelScreen } from './wheel.jsx';

const GATE_KEY = 'fr_authed';
const PASSCODE = '2013';

function AppGate({ onUnlock, themeVars: vars }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const MAX = 4;

  const press = (d) => {
    if (err) { setPw(String(d)); setErr(false); return; }
    if (pw.length >= MAX) return;
    const next = pw + d;
    setPw(next);
    if (next.length === MAX) {
      if (next === PASSCODE) { setTimeout(onUnlock, 120); }
      else { setTimeout(() => { setErr(true); setPw(''); }, 120); }
    }
  };
  const del = () => { setErr(false); setPw(p => p.slice(0, -1)); };
  const KEYS = [1,2,3,4,5,6,7,8,9,null,0,'⌫'];

  return (
    <div style={{ ...vars, fontFamily: "ThmanyahSans, system-ui, sans-serif", height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '0 32px' }}>
      <div style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.5, marginBottom: 6 }}>Folk's Retreat</div>
      <div style={{ fontSize: 13.5, color: 'var(--muted)', fontWeight: 500, marginBottom: 40 }}>Enter passcode to continue</div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 40 }}>
        {Array.from({ length: MAX }).map((_, i) => (
          <div key={i} style={{
            width: 14, height: 14, borderRadius: '50%',
            background: pw.length > i ? (err ? 'oklch(0.58 0.18 25)' : 'var(--ink)') : 'var(--line)',
            transition: 'background .15s',
          }} />
        ))}
      </div>

      {err && <div style={{ fontSize: 13, fontWeight: 600, color: 'oklch(0.58 0.18 25)', marginBottom: 20, marginTop: -28 }}>Wrong passcode</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 280 }}>
        {KEYS.map((k, i) => {
          if (k === null) return <div key={i} />;
          const isBack = k === '⌫';
          return (
            <button key={i} onClick={() => isBack ? del() : press(k)} style={{
              height: 68, borderRadius: 22, border: 'none', cursor: 'pointer',
              fontFamily: isBack ? 'inherit' : 'var(--display)',
              fontSize: isBack ? 22 : 26, fontWeight: 600,
              background: isBack ? 'transparent' : 'var(--sunken)',
              color: isBack ? 'var(--muted)' : 'var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isBack ? 'none' : 'var(--card-shadow)',
              transition: 'transform .08s',
            }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.93)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.93)'}
              onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
            >{k}</button>
          );
        })}
      </div>
    </div>
  );
}

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'wheel', icon: 'wheel', label: 'Shame' },
    { id: 'games', icon: 'trophy', label: 'Games' },
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'history', icon: 'users', label: 'Nights' },
    { id: 'stats', icon: 'chart', label: 'Stats' },
  ];
  return (
    <div style={{
      display: 'flex',
      background: 'var(--surface)',
      borderTop: '1px solid var(--line)',
      padding: '8px 8px env(safe-area-inset-bottom, 16px)',
      flexShrink: 0,
    }}>
      {tabs.map(tab => {
        const on = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)} style={{
            flex: 1, border: 'none', background: 'none', cursor: 'pointer', padding: '4px 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: on ? 'var(--accent)' : 'var(--faint)', transition: 'color .18s',
          }}>
            <Icon name={tab.icon} size={25} sw={on ? 2.4 : 2} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 700 : 500, letterSpacing: 0.1 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const store = useStore();
  const [authed] = useState(true);
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('fr_theme') || 'light');
  const [tab, setTab] = useState(() => sessionStorage.getItem('fr-tab') || 'home');
  const [editor, setEditor] = useState({ open: false, editing: null, draft: null });
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [profile, setProfile] = useState({ open: false, person: null });
  const [shareOpen, setShareOpen] = useState(false);
  const scrollRef = useRef(null);

  const isDark = THEMES[themeKey]?.dark ?? false;
  const vars = themeVars(themeKey);

  useEffect(() => {
    const color = themeKey === 'dark' ? '#2e2a23' : '#f5ede0';
    document.body.style.background = color;
    document.documentElement.style.background = color;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
  }, [themeKey]);

  if (!authed) return <AppGate themeVars={vars} onUnlock={() => { localStorage.setItem(GATE_KEY, '1'); setAuthed(true); }} />;

  if (store.loading) return (
    <div style={{ ...vars, height: '100dvh', background: 'var(--bg)' }} />
  );

  const toggleTheme = () => {
    const next = themeKey === 'dark' ? 'light' : 'dark';
    setThemeKey(next);
    localStorage.setItem('fr_theme', next);
    const color = next === 'dark' ? '#2e2a23' : '#f5ede0';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
    document.documentElement.style.background = color;
    document.body.style.background = color;
  };

  const openEditor = (weekOrDraft) => {
    if (weekOrDraft && weekOrDraft.id) setEditor({ open: true, editing: weekOrDraft, draft: null });
    else setEditor({ open: true, editing: null, draft: weekOrDraft || null });
  };
  const closeEditor = () => setEditor(e => ({ ...e, open: false }));
  const openProfile = (person) => { if (person) setProfile({ open: true, person }); };
  const goTo = (id) => { setTab(id); sessionStorage.setItem('fr-tab', id); if (scrollRef.current) scrollRef.current.scrollTop = 0; };

  let screen;
  if (tab === 'home') screen = <HomeScreen store={store} openEditor={openEditor} goTo={goTo} openProfile={openProfile} isDark={isDark} toggleTheme={toggleTheme} />;
  else if (tab === 'history') screen = <HistoryScreen store={store} openEditor={openEditor} openProfile={openProfile} />;
  else if (tab === 'wheel') screen = <WheelScreen store={store} />;
  else if (tab === 'games') screen = <GamesScreen store={store} />;
  else screen = <StatsScreen store={store} openPeople={() => setPeopleOpen(true)} openProfile={openProfile} openShare={() => setShareOpen(true)} />;

  return (
    <div style={{ ...vars, fontFamily: "ThmanyahSans, system-ui, sans-serif", height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: 'env(safe-area-inset-top, 0px)', WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
        {screen}
      </div>
      <TabBar active={tab} onChange={goTo} />

      <WeekEditor store={store} open={editor.open} editing={editor.editing} draft={editor.draft} onClose={closeEditor} />
      <PeopleManager store={store} open={peopleOpen} onClose={() => setPeopleOpen(false)} />
      <ProfileSheet store={store} person={profile.person} open={profile.open} onClose={() => setProfile(p => ({ ...p, open: false }))} openEditor={openEditor} />
      <ShareSheet store={store} open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
