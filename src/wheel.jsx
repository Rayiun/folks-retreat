import { useState, useRef, useEffect } from 'react';
import { lastFetcher, surnameOf, initials, fmtDateShort } from './store.js';
import { Avatar, Icon, Sheet, Btn, ConfirmDelete } from './ui.jsx';

let _actx = null;
function ensureCtx() {
  if (!_actx) { try { _actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (_actx.state === 'suspended') _actx.resume();
  return _actx;
}
function blip(freq, dur = 0.06, vol = 0.12) {
  const c = ensureCtx(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = 'triangle'; o.frequency.value = freq;
  const t = c.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}
function tick() { blip(500 + Math.random() * 80, 0.05, 0.10); }
function fanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const c = ensureCtx(); if (!c) return;
  notes.forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * 0.11;
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.55);
  });
}

function fireConfetti(canvas, colors) {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = canvas.clientWidth, H = canvas.clientHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
  const N = 130;
  const parts = Array.from({ length: N }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 80, y: H * 0.42,
    vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 13 - 5,
    g: 0.32 + Math.random() * 0.12, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
    rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4,
    color: colors[Math.floor(Math.random() * colors.length)], life: 0,
  }));
  let raf;
  const start = performance.now();
  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of parts) {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr; p.life = elapsed;
      const a = Math.max(0, 1 - elapsed / 2600);
      if (a > 0 && p.y < H + 30) {
        alive = true;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
    }
    if (alive) raf = requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, W, H);
  }
  raf = requestAnimationFrame(frame);
}

function polar(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}
function slicePath(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}
const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

function Wheel({ people, angle }) {
  const n = people.length;
  const C = 160, R = 150, seg = 360 / n;
  return (
    <svg viewBox="0 0 320 320" style={{
      width: '100%', height: '100%', display: 'block',
      transform: `rotate(${angle}deg)`,
      filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.18))',
    }}>
      <circle cx={C} cy={C} r={R + 4} fill="var(--surface)" />
      {people.map((p, i) => {
        const a0 = i * seg, a1 = (i + 1) * seg, mid = a0 + seg / 2;
        const [lx, ly] = polar(C, C, R * 0.66, mid);
        const big = n <= 8;
        return (
          <g key={p.id}>
            <path d={slicePath(C, C, R, a0, a1)} fill={p.color} stroke="var(--surface)" strokeWidth="2.5" />
            <text x={lx} y={ly} fill="oklch(0.99 0.01 80)" fontFamily="var(--display)" fontWeight="700"
              fontSize={big ? 20 : 15} textAnchor="middle" dominantBaseline="central"
              transform={`rotate(${mid} ${lx} ${ly})`} style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {initials(p.name)}
            </text>
          </g>
        );
      })}
      <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="3" />
    </svg>
  );
}

export function WheelScreen({ store }) {
  const { people, weeks, fetches, personById } = store;
  const lastAttendees = weeks[0] ? weeks[0].attendees : [];
  const [selected, setSelected] = useState(() => new Set(lastAttendees.length ? lastAttendees : people.map(p => p.id)));
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [fairMode, setFairMode] = useState(true);
  const [saved, setSaved] = useState(false);
  const [deletingFetch, setDeletingFetch] = useState(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const safetyRef = useRef(null);
  const doneRef = useRef(true);

  const pool = people.filter(p => selected.has(p.id));
  const canSpin = pool.length >= 2 && !spinning;

  const toggle = (id) => {
    if (spinning) return;
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const setAll = (on) => { if (!spinning) setSelected(on ? new Set(people.map(p => p.id)) : new Set()); };

  const spin = () => {
    if (!canSpin) return;
    ensureCtx();
    setWinner(null); setShowResult(false); setSaved(false);
    const n = pool.length, seg = 360 / n;
    let wIdx;
    if (fairMode) {
      const lf = lastFetcher(store.fetches, personById);
      let cands = (lf && lf.person && pool.length > 1) ? pool.filter(p => p.id !== lf.person.id) : pool.slice();
      const fc = p => store.fetches.filter(f => f.personId === p.id).length;
      const min = Math.min(...cands.map(fc));
      cands = cands.filter(p => fc(p) === min);
      const chosen = cands[Math.floor(Math.random() * cands.length)];
      wIdx = pool.findIndex(p => p.id === chosen.id);
    } else {
      wIdx = Math.floor(Math.random() * n);
    }
    const jitter = (Math.random() - 0.5) * seg * 0.7;
    const targetMod = (360 - (wIdx * seg + seg / 2) + jitter + 360) % 360;
    const start = angle;
    const base = start - (start % 360);
    const spins = 5 + Math.floor(Math.random() * 3);
    const total = base + spins * 360 + targetMod;
    const finalTarget = total > start ? total : total + 360;
    const dur = 4400 + Math.random() * 700;
    const t0 = performance.now();
    let lastSeg = -1;
    doneRef.current = false;
    setSpinning(true);
    const win = pool[wIdx];

    const finalize = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      cancelAnimationFrame(rafRef.current);
      clearTimeout(safetyRef.current);
      setAngle(finalTarget);
      setSpinning(false);
      setWinner(win);
      setTimeout(() => {
        setShowResult(true);
        try { const a = new Audio('/win-sound.mp3'); a.play(); } catch (e) {}
        fireConfetti(canvasRef.current, people.map(p => p.color).concat(['oklch(0.72 0.17 28)', 'oklch(0.78 0.15 150)']));
      }, 180);
    };

    const step = (now) => {
      if (doneRef.current) return;
      const t = Math.min(1, (now - t0) / dur);
      const eased = easeOutQuart(t);
      const cur = start + (finalTarget - start) * eased;
      setAngle(cur);
      const topLocal = (360 - (cur % 360) + 360) % 360;
      const idx = Math.floor(topLocal / seg);
      if (idx !== lastSeg) { lastSeg = idx; if (t < 0.999) tick(); }
      if (t < 1) { rafRef.current = requestAnimationFrame(step); }
      else finalize();
    };
    rafRef.current = requestAnimationFrame(step);
    safetyRef.current = setTimeout(finalize, dur + 500);
  };
  useEffect(() => () => { cancelAnimationFrame(rafRef.current); clearTimeout(safetyRef.current); }, []);

  return (
    <div style={{ padding: '4px 18px 16px' }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 30, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.6 }}>Luck Wheel</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 14.5 }}>Spin to find this week's sucker!</p>
      </div>

      <div style={{ position: 'relative', width: '100%', maxWidth: 340, margin: '6px auto 8px', aspectRatio: '1' }}>
        <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%) rotate(180deg)', zIndex: 5,
          fontSize: 38, lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
          filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.28))' }}>🖕🏼</div>
        {pool.length >= 1 ? (
          <Wheel people={pool} spinning={spinning} angle={angle} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px dashed var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--faint)', textAlign: 'center', padding: 30, fontSize: 14.5 }}>
            Pick who's here to build the wheel
          </div>
        )}
        {pool.length >= 1 && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 4,
            width: 56, height: 56, borderRadius: '50%', background: 'var(--surface)', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid var(--accent)' }}>
            <Icon name="sparkle" size={24} color="var(--accent)" fill sw={1} />
          </div>
        )}
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <Btn onClick={spin} disabled={!canSpin} size="lg" icon={spinning ? null : 'shuffle'}
          style={{ minWidth: 200, boxShadow: canSpin ? '0 6px 18px color-mix(in oklch, var(--accent) 40%, transparent)' : 'none' }}>
          {spinning ? 'Spinning…' : 'Spin the wheel'}
        </Btn>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 6 }}>
        <button onClick={() => setFairMode(f => !f)} disabled={spinning} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: spinning ? 'default' : 'pointer',
          background: fairMode ? 'var(--good-soft)' : 'var(--sunken)', color: fairMode ? 'var(--good)' : 'var(--muted)',
          borderRadius: 99, padding: '7px 14px', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, transition: 'all .15s' }}>
          <span style={{ width: 30, height: 18, borderRadius: 99, background: fairMode ? 'var(--good)' : 'var(--line)', position: 'relative', transition: 'background .15s' }}>
            <span style={{ position: 'absolute', top: 2, left: fairMode ? 14 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .18s', boxShadow: '0 1px 2px rgba(0,0,0,0.25)' }} />
          </span>
          Fair mode
        </button>
      </div>
      <p style={{ textAlign: 'center', color: 'var(--faint)', fontSize: 12, margin: '0 0 16px', padding: '0 20px', lineHeight: 1.4 }}>
        {fairMode ? 'Favours whoever has fetched least — and never the same person twice in a row.' : 'Pure luck — every name has an equal shot.'}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Who's here · {pool.length}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <Btn variant="quiet" size="sm" onClick={() => setAll(true)}>All</Btn>
          <Btn variant="quiet" size="sm" onClick={() => setAll(false)}>Clear</Btn>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {people.map(p => {
          const on = selected.has(p.id);
          return (
            <button key={p.id} onClick={() => toggle(p.id)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px 6px 6px',
              borderRadius: 99, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: on ? 'var(--accent-soft)' : 'var(--sunken)',
              color: on ? 'var(--accent)' : 'var(--muted)',
              fontSize: 14, fontWeight: 600, transition: 'all .15s',
              boxShadow: on ? 'inset 0 0 0 1.5px var(--accent)' : 'none',
            }}>
              <Avatar person={p} size={26} dim={!on} />
              {p.name}
            </button>
          );
        })}
      </div>

      {fetches.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>
            Fetch history
          </div>
          {fetches.slice(0, 6).map((f, i) => {
            const p = personById(f.personId);
            if (!p) return null;
            const timesChosen = fetches.filter(x => x.personId === f.personId).length;
            const pct = Math.round((timesChosen / fetches.length) * 100);
            return (
              <div key={f.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                borderBottom: i < Math.min(fetches.length, 6) - 1 ? '1px solid var(--line)' : 'none' }}>
                <Avatar person={p} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 500, marginTop: 2 }}>{fmtDateShort(f.date)}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-soft)',
                  padding: '3px 9px', borderRadius: 99 }}>{pct}%</span>
                <button onClick={() => setDeletingFetch(f.id)} style={{ border: 'none', background: 'none', cursor: 'pointer',
                  padding: 4, color: 'var(--faint)', display: 'flex', flexShrink: 0 }}>
                  <Icon name="trash" size={16} sw={2} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDelete open={!!deletingFetch} onClose={() => setDeletingFetch(null)} onConfirm={() => store.deleteFetch(deletingFetch)} />

      <Sheet open={showResult} onClose={() => setShowResult(false)}>
        {winner && (
          <div style={{ textAlign: 'center', padding: '6px 4px 8px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>
              The wheel has spoken
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Avatar person={winner} size={108} />
            </div>
            <h2 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.6 }}>{winner.name}</h2>
            <p style={{ margin: '10px auto 22px', color: 'var(--muted)', fontSize: 16, maxWidth: 260 }}>
              Is this week's sucker 🖕🏼
            </p>
            <Btn icon={saved ? 'check' : 'plus'} disabled={saved}
              onClick={() => { store.addFetch(winner.id); setSaved(true); }}
              variant={saved ? 'soft' : 'primary'} size="lg" style={{ width: '100%', marginBottom: 10 }}>
              {saved ? 'Saved to the fetch tally' : "Save as the night's fetcher"}
            </Btn>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Btn variant="ghost" onClick={() => setShowResult(false)} style={{ flex: 1 }}>Done</Btn>
              <Btn variant="ghost" icon="shuffle" onClick={() => { setShowResult(false); setTimeout(spin, 320); }} style={{ flex: 1 }}>Spin again</Btn>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
