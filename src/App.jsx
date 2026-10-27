import { useState, useRef, useEffect } from 'react';
import { useStore } from './store.js';
import { Icon, Btn } from './ui.jsx';
import { THEMES, themeVars } from './theme.js';
import { HomeScreen, HistoryScreen, StatsScreen, WeekEditor, PeopleManager, ProfileSheet, ShareSheet } from './screens.jsx';
import { GamesScreen } from './games.jsx';
import { WheelScreen } from './wheel.jsx';

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'wheel', icon: 'wheel', label: 'Shame' },
    { id: 'games', icon: 'trophy', label: 'Arena' },
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

  if (!store.loaded) return (
    <div style={{ ...vars, minHeight: '100dvh', background: 'var(--bg)', color: 'var(--ink)', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Folk’s Retreat</h1>
        <p role={store.loadError ? 'alert' : 'status'}>{store.loadError || 'Loading your gatherings…'}</p>
        {store.loadError && <Btn onClick={store.reload} disabled={store.loading}>Try again</Btn>}
      </div>
    </div>
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
    <div style={{ ...vars, fontFamily: "ThmanyahSans, system-ui, sans-serif", height: '100dvh', width: '100%', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingTop: 'env(safe-area-inset-top, 0px)', WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
        {store.loadError && <div role="alert" className="status-banner">{store.loadError} Showing the last loaded records. <Btn size="sm" onClick={store.reload} disabled={store.loading}>Retry</Btn></div>}
        {screen}
      </div>
      {(store.saving || store.mutationError || store.notice) && <div role={store.mutationError ? 'alert' : 'status'} className="status-banner operation-status">{store.saving ? 'Saving…' : store.mutationError || store.notice}</div>}
      <TabBar active={tab} onChange={goTo} />

      <WeekEditor store={store} open={editor.open} editing={editor.editing} draft={editor.draft} onClose={closeEditor} />
      <PeopleManager store={store} open={peopleOpen} onClose={() => setPeopleOpen(false)} />
      <ProfileSheet store={store} person={profile.person} open={profile.open} onClose={() => setProfile(p => ({ ...p, open: false }))} openEditor={openEditor} />
      <ShareSheet store={store} open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
