import { useState, useEffect, useRef } from 'react';
import {
  fmtDate, fmtDateShort, surnameOf, initials,
  hostStats, overdueHost, fetchStats, lastFetcher, attendanceInfo, rotationOrder, awards, matchSides,
} from './store.js';
import { Avatar, AvatarStack, Icon, Sheet, Btn, Card, Segment, Stat, ConfirmDelete } from './ui.jsx';

export function SectionTitle({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '0 0 12px' }}>
      <h2 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 19, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.3 }}>{children}</h2>
      {action}
    </div>
  );
}

export function PageHead({ title, sub }) {
  return (
    <div style={{ padding: '4px 0 16px' }}>
      <h1 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 30, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.6 }}>{title}</h1>
      {sub && <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 14.5 }}>{sub}</p>}
    </div>
  );
}

function nightMVP(date, games, personById) {
  const wins = {};
  (games || []).filter(g => g.date === date).forEach(g => {
    const winners = g.format === 'teams'
      ? (g.winner === 'A' ? g.teamA : g.teamB) || []
      : g.winnerId ? [g.winnerId] : [];
    winners.forEach(id => { wins[id] = (wins[id] || 0) + 1; });
  });
  const sorted = Object.entries(wins).sort((a, b) => b[1] - a[1]);
  if (!sorted.length || sorted[0][1] < 1) return null;
  const topWins = sorted[0][1];
  const people = sorted.filter(([, w]) => w === topWins).map(([id]) => personById(id)).filter(Boolean);
  return { people, wins: topWins };
}

function WeekCard({ week, store, onEdit, onAvatar }) {
  const host = store.personById(week.hostId);
  const mvp = nightMVP(week.date, store.games, store.personById);
  return (
    <Card onClick={() => onEdit(week)} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }} pad={14}>
      {host ? (
        <div onClick={onAvatar ? (e) => { e.stopPropagation(); onAvatar(host); } : undefined} style={{ cursor: onAvatar ? 'pointer' : 'default' }}>
          <Avatar person={host} size={46} />
        </div>
      ) : (
        <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: 'var(--bg)', overflow: 'hidden' }}>
          <img src="/app-icon.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply' }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 16, letterSpacing: -0.2 }}>
          {host ? host.name : 'Collective Failure'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, color: 'var(--muted)', fontSize: 13 }}>
          <Icon name="calendar" size={13} sw={2} /> {fmtDate(week.date)}
        </div>
        {week.note ? (
          <div style={{ marginTop: 5, color: 'var(--faint)', fontSize: 12.5, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{week.note}"</div>
        ) : null}
        {mvp && (
          <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--accent-soft)', borderRadius: 99, padding: '3px 9px 3px 5px' }}>
            <div style={{ display: 'flex' }}>
              {mvp.people.map((p, i) => (
                <span key={p.id} style={{ marginLeft: i === 0 ? 0 : -6 }}><Avatar person={p} size={18} /></span>
              ))}
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)' }}>MVP · {mvp.wins} {mvp.wins === 1 ? 'win' : 'wins'}{mvp.people.length > 1 ? ' each' : ''}</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
        <AvatarStack ids={week.attendees} personById={store.personById} max={4} size={26} />
        <span style={{ fontSize: 11.5, color: 'var(--faint)', fontWeight: 600 }}>{week.attendees.length} attended</span>
      </div>
    </Card>
  );
}

export function HomeScreen({ store, openEditor, goTo, openProfile, isDark, toggleTheme }) {
  const { people, weeks, fetches } = store;
  const stats = hostStats(people, weeks);
  const lf = lastFetcher(fetches, store.personById);
  const rotation = rotationOrder(people, weeks);
  const lastWeek = weeks[0];

  return (
    <div style={{ padding: '4px 18px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0 14px' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, letterSpacing: 0.2 }}>Since 2020</div>
          <h1 style={{ margin: '2px 0 0', fontFamily: 'var(--display)', fontSize: 29, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.6 }}>Folk's Retreat</h1>
        </div>
        <button onClick={toggleTheme} aria-label={isDark ? 'Light mode' : 'Dark mode'} style={{ width: 46, height: 46, borderRadius: isDark ? 14 : '50%', background: 'var(--accent-soft)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .12s, border-radius .25s' }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <Icon name={isDark ? 'sun' : 'moon'} size={23} color="var(--accent)" sw={2} fill={!isDark} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22, gap: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.4, lineHeight: 1 }}>{350 + weeks.length}</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginTop: 4 }}>Nights</div>
          </div>
          <div style={{ width: 1, height: 36, background: 'var(--line)', margin: '0 18px', flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.4, lineHeight: 1 }}>
              {lastWeek ? fmtDateShort(lastWeek.date) : '—'}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--muted)', marginTop: 4 }}>Last night</div>
          </div>
        </div>
        <div style={{ width: 1, height: 36, background: 'var(--line)', margin: '0 18px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--faint)', fontStyle: 'italic', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            The World's Least Productive Meetings...
          </div>
        </div>
      </div>

      <Btn icon="plus" onClick={() => {
        const today = new Date();
        if (today.getHours() < 7) today.setDate(today.getDate() - 1);
        const iso = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        openEditor({ date: iso, attendees: weeks[0] ? weeks[0].attendees : people.map(p => p.id) });
      }} style={{ width: '100%', marginBottom: 20 }}>Log this gathering</Btn>

      <SectionTitle>Host rotation · up next</SectionTitle>
      <Card className="hide-scrollbar" style={{ display: 'flex', gap: 6, marginBottom: 18, overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }} pad={14}>
        {rotation.map((r, i) => (
          <button key={r.person.id} onClick={() => openProfile(r.person)} style={{ border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, width: 56, padding: 0 }}>
            <div style={{ position: 'relative' }}>
              <Avatar person={r.person} size={46} ring={i === 0} />
              <div style={{ position: 'absolute', top: -4, left: -4, width: 18, height: 18, borderRadius: '50%', background: i === 0 ? 'var(--accent)' : 'var(--sunken)',
                color: i === 0 ? 'var(--accent-ink)' : 'var(--muted)', fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 2px var(--surface)' }}>{i + 1}</div>
            </div>
            <span style={{ fontSize: 10.5, color: 'var(--faint)', fontWeight: 500, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.person.name}</span>
          </button>
        ))}
      </Card>

      <Card onClick={() => goTo('wheel')} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18,
        background: 'linear-gradient(110deg, var(--accent) 0%, color-mix(in oklch, var(--accent) 78%, black) 100%)' }} pad={16}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="wheel" size={26} color="var(--accent-ink)" sw={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'var(--accent-ink)', fontWeight: 700, fontSize: 17, fontFamily: 'var(--display)', letterSpacing: -0.2 }}>The Walk of Shame</div>
          <div style={{ color: 'var(--accent-ink)', opacity: 0.85, fontSize: 13, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lf ? `Last walk: ${lf.person ? lf.person.name : '—'} · ${fmtDateShort(lf.date)}` : 'Spin to find tonight\'s sucker'}
          </div>
        </div>
        <Icon name="arrowRight" size={22} color="var(--accent-ink)" sw={2.2} />
      </Card>

      <SectionTitle action={<Btn variant="quiet" size="sm" onClick={() => goTo('history')}>See all</Btn>}>Recent gatherings</SectionTitle>
      {weeks.slice(0, 3).map(w => <WeekCard key={w.id} week={w} store={store} onEdit={openEditor} onAvatar={openProfile} />)}
      {weeks.length === 0 && <Card style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>No weeks logged yet.</Card>}
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function pad2(n) { return n < 10 ? '0' + n : '' + n; }

function MonthGrid({ y, m, byDate, store, openEditor }) {
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--display)', marginBottom: 12, paddingLeft: 2 }}>{MONTH_NAMES[m]} {y}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {WEEKDAYS.map((w, i) => <div key={'h' + i} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'var(--faint)', paddingBottom: 4 }}>{w}</div>)}
        {cells.map((d, i) => {
          if (d == null) return <div key={'b' + i} />;
          const iso = `${y}-${pad2(m + 1)}-${pad2(d)}`;
          const week = byDate[iso];
          const host = week ? store.personById(week.hostId) : null;
          return (
            <div key={i} onClick={week ? () => openEditor(week) : undefined} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: week ? 'pointer' : 'default' }}>
              {week ? (
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: host ? host.color : 'var(--sunken)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 12,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.18)' }}>{host ? initials(host.name) : d}</div>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--faint)' }}>{d}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarView({ store, openEditor }) {
  const { weeks } = store;
  const byDate = {};
  weeks.forEach(w => { byDate[w.date] = w; });
  const monthsMap = {};
  weeks.forEach(w => { const d = new Date(w.date + 'T00:00:00'); monthsMap[d.getFullYear() + '-' + d.getMonth()] = { y: d.getFullYear(), m: d.getMonth() }; });
  const months = Object.values(monthsMap).sort((a, b) => (b.y - a.y) || (b.m - a.m));
  return (
    <div>
      {months.map(({ y, m }) => <MonthGrid key={y + '-' + m} y={y} m={m} byDate={byDate} store={store} openEditor={openEditor} />)}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 4, color: 'var(--faint)', fontSize: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} /> tap a circle to open</span>
      </div>
    </div>
  );
}

export function HistoryScreen({ store, openEditor, openProfile }) {
  const { weeks } = store;
  const [view, setView] = useState('list');
  const groups = {};
  weeks.forEach(w => {
    const d = new Date(w.date + 'T00:00:00');
    const key = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    (groups[key] = groups[key] || []).push(w);
  });
  return (
    <div style={{ padding: '4px 18px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <PageHead title="History" sub={`${350 + weeks.length} gatherings and counting`} />
      </div>
      <Btn icon="plus" onClick={() => openEditor(null)} style={{ width: '100%', marginBottom: 16 }} size="lg">Log a gathering</Btn>
      <div style={{ marginBottom: 20 }}>
        <Segment value={view} onChange={setView} options={[{ value: 'list', label: 'List' }, { value: 'calendar', label: 'Calendar' }]} />
      </div>
      {weeks.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 34 }}>
          <div style={{ color: 'var(--muted)', fontSize: 15 }}>Nothing logged yet.<br />Tap "Log a gathering" to start.</div>
        </Card>
      ) : view === 'calendar' ? (
        <CalendarView store={store} openEditor={openEditor} />
      ) : (
        Object.entries(groups).map(([month, ws]) => (
          <div key={month} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, paddingLeft: 4 }}>{month}</div>
            {ws.map(w => <WeekCard key={w.id} week={w} store={store} onEdit={openEditor} onAvatar={openProfile} />)}
          </div>
        ))
      )}
    </div>
  );
}

function AwardCard({ award, onClickPerson }) {
  const people = award.people || [];
  return (
    <div style={{ border: 'var(--card-border)', background: 'var(--surface)', borderRadius: 18, padding: '14px 12px',
      width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center',
      boxShadow: 'var(--card-shadow)', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent)' }}>
        <Icon name={award.icon} size={14} sw={2.2} />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>{award.label}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {people.map((p, i) => (
          <button key={p.id} onClick={() => onClickPerson(p)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', marginLeft: i === 0 ? 0 : -10 }}>
            <Avatar person={p} size={people.length > 1 ? 34 : 44} />
          </button>
        ))}
      </div>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13.5, letterSpacing: -0.2 }}>
          {people.map(p => p.name.split(' ').pop()).join(', ')}
        </div>
        <div style={{ color: 'var(--faint)', fontSize: 11.5, marginTop: 1 }}>{award.sub}</div>
      </div>
    </div>
  );
}

export function StatsScreen({ store, openPeople, openProfile, openShare }) {
  const { people, weeks, fetches, games } = store;
  const [mode, setMode] = useState('hosted');
  const aw = awards(people, weeks, fetches, games);

  let rows;
  if (mode === 'fetched') {
    rows = fetchStats(people, fetches).map(s => ({ person: s.person, val: s.fetched, sub: s.fetched ? 'delivery runs' : 'never fetched' }));
  } else {
    rows = hostStats(people, weeks).map(s => {
      if (mode === 'hosted') return { person: s.person, val: s.hosted, sub: s.lastHostedIso ? 'last ' + fmtDateShort(s.lastHostedIso) : 'never hosted' };
      const ai = attendanceInfo(s.person, weeks);
      return { person: s.person, val: s.attended, sub: `${ai.rate}% rate · streak ${ai.streak}` };
    });
    rows.sort((a, b) => b.val - a.val);
  }
  const max = Math.max(1, ...rows.map(r => r.val));
  const barColor = mode === 'hosted' ? 'var(--accent)' : mode === 'attended' ? 'var(--good)' : 'oklch(0.66 0.13 295)';
  const medals = ['oklch(0.78 0.14 85)', 'oklch(0.74 0.02 250)', 'oklch(0.62 0.11 50)'];

  return (
    <div style={{ padding: '4px 18px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <PageHead title="Hall of Fame" sub="For legal reasons, this isn't personal..." />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={openShare} style={{ border: 'none', background: 'var(--sunken)', width: 40, height: 40, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink)' }}>
            <Icon name="share" size={20} sw={2} />
          </button>
          <button onClick={openPeople} style={{ border: 'none', background: 'var(--sunken)', width: 40, height: 40, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink)' }}>
            <Icon name="users" size={20} sw={2} />
          </button>
        </div>
      </div>

      <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '14px 0 18px' }} pad={16}>
        <Stat value={350 + weeks.length} label="Gatherings" color="var(--accent)" />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, padding: '2px', margin: '0 -2px 18px' }}>
        {aw.map(a => <AwardCard key={a.key} award={a} onClickPerson={openProfile} />)}
      </div>

      <div style={{ marginBottom: 14 }}>
        <Segment value={mode} onChange={setMode} options={[{ value: 'hosted', label: 'Hosting' }, { value: 'attended', label: 'Attended' }, { value: 'fetched', label: 'Fetched' }]} />
      </div>

      {(() => {
        const uniqueVals = [...new Set(rows.map(r => r.val))].sort((a, b) => b - a);
        return rows.map((s, i) => {
          const rank = uniqueVals.indexOf(s.val) + 1;
          const medalIdx = rank - 1;
          return (
            <div key={s.person.id} onClick={() => openProfile(s.person)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', cursor: 'pointer',
              borderBottom: i < rows.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ width: 22, textAlign: 'center', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 15,
                color: medalIdx < 3 ? medals[medalIdx] : 'var(--faint)' }}>{rank}</div>
              <Avatar person={s.person} size={38} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 15, letterSpacing: -0.2 }}>{s.person.name}</div>
                  <div style={{ color: 'var(--faint)', fontSize: 11 }}>{s.sub}</div>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'var(--sunken)', marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${(s.val / max) * 100}%`, height: '100%', borderRadius: 99, background: barColor, transition: 'width .4s' }} />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 19, color: 'var(--ink)', minWidth: 24, textAlign: 'right' }}>{s.val}</div>
            </div>
          );
        });
      })()}
    </div>
  );
}

// ── DateField ─────────────────────────────────────────────
export function DateField({ value, onChange, autoOpen = false }) {
  const [open, setOpen] = useState(autoOpen);
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  const sel = new Date(value + 'T00:00:00');
  const [viewY, setViewY] = useState(sel.getFullYear());
  const [viewM, setViewM] = useState(sel.getMonth());

  useEffect(() => {
    if (open) {
      const d = new Date(value + 'T00:00:00');
      setViewY(d.getFullYear()); setViewM(d.getMonth());
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setShow(true)));
    } else {
      setShow(false);
      const t = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [mounted]);

  const first = new Date(viewY, viewM, 1).getDay();
  const days = new Date(viewY, viewM + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const td = new Date();
  const todayIso = `${td.getFullYear()}-${pad2(td.getMonth() + 1)}-${pad2(td.getDate())}`;

  const stepMonth = (dir) => {
    let m = viewM + dir, y = viewY;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    setViewM(m); setViewY(y);
  };
  const pick = (d) => { onChange(`${viewY}-${pad2(viewM + 1)}-${pad2(d)}`); setOpen(false); };

  const navBtn = (name, fn) => (
    <button type="button" onClick={fn} style={{ width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
      background: 'var(--sunken)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={18} sw={2.4} />
    </button>
  );

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 22 }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 14,
        border: open ? '1.5px solid var(--accent)' : '1.5px solid var(--line)',
        background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 16, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, transition: 'border-color .15s' }}>
        <span style={{ fontWeight: 600 }}>{fmtDate(value)}</span>
        <Icon name="calendar" size={20} sw={2} color="var(--accent)" />
      </button>

      {mounted && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50,
          background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 18, padding: 16,
          boxShadow: '0 12px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
          transformOrigin: 'top center', transition: 'opacity .18s ease, transform .18s ease',
          opacity: show ? 1 : 0, transform: show ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.97)',
          pointerEvents: show ? 'auto' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            {navBtn('chevronLeft', () => stepMonth(-1))}
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--display)' }}>{MONTH_NAMES[viewM]} {viewY}</div>
            {navBtn('chevronRight', () => stepMonth(1))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {WEEKDAYS.map((w, i) => <div key={'h' + i} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700, color: 'var(--faint)', paddingBottom: 6 }}>{w}</div>)}
            {cells.map((d, i) => {
              if (d == null) return <div key={'b' + i} />;
              const iso = `${viewY}-${pad2(viewM + 1)}-${pad2(d)}`;
              const isSel = iso === value;
              const isToday = iso === todayIso;
              return (
                <div key={i} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button type="button" onClick={() => pick(d)} style={{
                    width: 34, height: 34, borderRadius: '50%', border: isToday && !isSel ? '1.5px solid var(--accent)' : 'none', cursor: 'pointer',
                    background: isSel ? 'var(--accent)' : 'transparent',
                    color: isSel ? 'var(--accent-ink)' : 'var(--ink)',
                    fontFamily: isSel ? 'var(--display)' : 'inherit', fontWeight: isSel ? 700 : 500, fontSize: 13.5,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .12s',
                    boxShadow: isSel ? '0 2px 8px rgba(0,0,0,0.18)' : 'none' }}>{d}</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── WeekEditor ────────────────────────────────────────────
export function WeekEditor({ store, editing, draft, open, onClose }) {
  const isNew = !editing || !editing.id;
  const seed = editing || draft || { date: new Date().toISOString().slice(0,10), hostId: null, attendees: [] };
  const [date, setDate] = useState(seed.date);
  const [hostId, setHostId] = useState(seed.hostId);
  const [att, setAtt] = useState(() => new Set(seed.attendees || []));
  const [note, setNote] = useState(seed.note || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      const s = editing || draft || { date: new Date().toISOString().slice(0,10), hostId: null, attendees: [] };
      setDate(s.date); setHostId(s.hostId); setAtt(new Set(s.attendees || []));
      setNote(s.note || '');
    }
  }, [open, editing, draft]);

  const toggleAtt = (id) => setAtt(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const pickHost = (id) => { setHostId(id); setAtt(prev => new Set(prev).add(id)); };

  const save = () => {
    const payload = { date, hostId, attendees: [...att], note: note.trim() };
    if (editing && editing.id) store.updateWeek(editing.id, payload);
    else store.addWeek(payload);
    onClose();
  };
  const del = () => { if (editing && editing.id) store.deleteWeek(editing.id); onClose(); };

  return (
    <Sheet open={open} onClose={onClose} title={isNew ? 'Log a gathering' : 'Edit gathering'}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Date</label>
      <DateField value={date} onChange={setDate} />

      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Who took care of it</label>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '2px 2px 14px', margin: '0 -2px 8px' }}>
        {store.people.map(p => (
          <button key={p.id} onClick={() => pickHost(p.id)} style={{ border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, width: 58, padding: 0 }}>
            <Avatar person={p} size={50} ring={hostId === p.id} dim={hostId != null && hostId !== p.id} />
            <span style={{ fontSize: 11, color: hostId === p.id ? 'var(--ink)' : 'var(--faint)', fontWeight: hostId === p.id ? 700 : 500,
              maxWidth: 58, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 8 }}>
        <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Who attended · {att.size}</label>
        <div style={{ display: 'flex', gap: 2 }}>
          <Btn variant="quiet" size="sm" onClick={() => setAtt(new Set(store.people.map(p => p.id)))}>All</Btn>
          <Btn variant="quiet" size="sm" onClick={() => setAtt(new Set(hostId ? [hostId] : []))}>Clear</Btn>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {store.people.map(p => {
          const on = att.has(p.id);
          return (
            <button key={p.id} onClick={() => toggleAtt(p.id)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px 5px 5px', borderRadius: 99, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, transition: 'all .15s',
              background: on ? 'var(--good-soft)' : 'var(--sunken)', color: on ? 'var(--good)' : 'var(--muted)',
              boxShadow: on ? 'inset 0 0 0 1.5px var(--good)' : 'none',
            }}>
              <Avatar person={p} size={24} dim={!on} />{p.name}
            </button>
          );
        })}
      </div>

      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: '22px 0 8px' }}>Dinner</label>
      <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. KFC" style={{
        width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: 14, border: '1.5px solid var(--line)',
        background: 'var(--surface)', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 15.5, marginBottom: 24 }} />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {!isNew && <Btn variant="danger" icon="trash" onClick={() => setConfirmDelete(true)}>Delete</Btn>}
        <div style={{ flex: 1 }} />
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn icon="check" onClick={save}>Save</Btn>
      </div>
      <ConfirmDelete open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={del} />
    </Sheet>
  );
}

// ── PeopleManager ─────────────────────────────────────────
export function PeopleManager({ store, open, onClose }) {
  return (
    <Sheet open={open} onClose={onClose} title="Members">
      <div>
        {store.people.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 2px',
            borderBottom: i < store.people.length - 1 ? '1px solid var(--line)' : 'none' }}>
            <Avatar person={p} size={38} />
            <div style={{ flex: 1, fontWeight: 600, color: 'var(--ink)', fontSize: 15 }}>{p.name}</div>
          </div>
        ))}
      </div>
    </Sheet>
  );
}

// ── ProfileSheet ──────────────────────────────────────────
function MiniStat({ value, label, color }) {
  return (
    <div style={{ flex: 1, background: 'var(--sunken)', borderRadius: 16, padding: '14px 8px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 700, color: color || 'var(--ink)', lineHeight: 1, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 6, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

export function ProfileSheet({ store, person, open, onClose, openEditor }) {
  if (!person) return <Sheet open={open} onClose={onClose} />;
  const { weeks, fetches } = store;
  const hs = hostStats(store.people, weeks).find(s => s.person.id === person.id) || { hosted: 0, attended: 0, lastHostedIso: null };
  const ai = attendanceInfo(person, weeks);
  const fetched = fetches.filter(f => f.personId === person.id).length;
  const theirWeeks = weeks.filter(w => w.attendees.includes(person.id) || w.hostId === person.id).slice(0, 6);
  return (
    <Sheet open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <Avatar person={person} size={70} />
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 25, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.4 }}>{person.name}</h2>
          <div style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 2 }}>
            {hs.lastHostedIso ? `Last hosted ${fmtDateShort(hs.lastHostedIso)}` : "Hasn't hosted yet"}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <MiniStat value={hs.hosted} label="Hosted" color="var(--accent)" />
        <MiniStat value={ai.rate + '%'} label="Attendance" color="var(--good)" />
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        <MiniStat value={ai.streak} label="Streak" />
        <MiniStat value={fetched} label="Fetched" color="oklch(0.66 0.13 295)" />
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Recent gatherings</div>
      {theirWeeks.map(w => (
        <div key={w.id} onClick={() => { onClose(); setTimeout(() => openEditor(w), 280); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 2px', cursor: 'pointer',
          borderBottom: '1px solid var(--line)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: w.hostId === person.id ? 'var(--accent)' : 'var(--good)' }} />
          <div style={{ flex: 1, color: 'var(--ink)', fontSize: 14 }}>{fmtDate(w.date)}</div>
          <div style={{ color: 'var(--faint)', fontSize: 12 }}>{w.hostId === person.id ? 'hosted' : 'attended'}</div>
        </div>
      ))}
      {theirWeeks.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 14, padding: '8px 2px' }}>No gatherings yet.</div>}
    </Sheet>
  );
}

// ── ShareSheet ────────────────────────────────────────────
export function ShareSheet({ store, open, onClose }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (open) setCopied(false); }, [open]);
  const { people, weeks, fetches, games } = store;
  const hs = hostStats(people, weeks);
  const fs = fetchStats(people, fetches);
  const loyal = people.map(p => ({ person: p, ...attendanceInfo(p, weeks) })).filter(x => x.total >= 3).sort((a, b) => b.rate - a.rate)[0];

  const topGameWinner = (cat) => {
    const catGames = (games || []).filter(g => g.cat === cat);
    if (!catGames.length) return null;
    const wins = {};
    catGames.forEach(g => {
      const sides = matchSides(g);
      sides.winners.forEach(id => { wins[id] = (wins[id] || 0) + 1; });
    });
    const top = Object.entries(wins).sort((a, b) => b[1] - a[1])[0];
    if (!top) return null;
    const p = store.personById(top[0]);
    return p ? { person: p, wins: top[1] } : null;
  };
  const boardTop = topGameWinner('board');
  const fifaTop = topGameWinner('fifa');

  const lines = [
    '☕ Folk\'s Retreat — the story so far',
    `• ${weeks.length} gatherings, ${people.length} folks`,
    hs[0] && hs[0].hosted ? `• Top host: ${hs[0].person.name} (${hs[0].hosted}×)` : null,
    loyal ? `• Most loyal: ${loyal.person.name} (${loyal.rate}% turnout)` : null,
    fs[0] && fs[0].fetched ? `• Top fetcher: ${fs[0].person.name} (${fs[0].fetched} runs)` : null,
    boardTop ? `• Board game king: ${boardTop.person.name} (${boardTop.wins} wins)` : null,
    fifaTop ? `• FIFA champion: ${fifaTop.person.name} (${fifaTop.wins} wins)` : null,
  ].filter(Boolean);
  const text = lines.join('\n');
  const copy = () => {
    try { navigator.clipboard.writeText(text); } catch (e) {}
    setCopied(true);
  };
  return (
    <Sheet open={open} onClose={onClose} title="Share summary">
      <div style={{ background: 'var(--sunken)', borderRadius: 18, padding: 18, marginBottom: 16, whiteSpace: 'pre-wrap',
        fontSize: 14, lineHeight: 1.7, color: 'var(--ink)' }}>{text}</div>
      <Btn icon={copied ? 'check' : 'arrowRight'} onClick={copy} style={{ width: '100%' }} size="lg" variant={copied ? 'soft' : 'primary'}>
        {copied ? 'Copied to clipboard' : 'Copy for the group chat'}
      </Btn>
    </Sheet>
  );
}
