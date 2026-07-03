import { useState, useEffect } from 'react';
import { initials } from './store.js';

export const THEMES = {
  light: {
    label: 'Light', dark: false,
    bg: 'oklch(0.962 0.014 70)',
    surface: 'oklch(0.995 0.006 75)',
    sunken: 'oklch(0.945 0.016 68)',
    ink: 'oklch(0.28 0.024 52)',
    muted: 'oklch(0.53 0.022 58)',
    faint: 'oklch(0.70 0.02 60)',
    line: 'oklch(0.89 0.014 68)',
    accent: 'oklch(0.605 0.14 42)',
    accentInk: 'oklch(0.99 0.01 75)',
    accentSoft: 'oklch(0.93 0.045 50)',
    good: 'oklch(0.58 0.075 150)',
    goodSoft: 'oklch(0.93 0.04 150)',
    display: "ThmanyahSerif",
  },
  dark: {
    label: 'Dark', dark: true,
    bg: 'oklch(0.225 0.011 57)',
    surface: 'oklch(0.275 0.013 58)',
    sunken: 'oklch(0.245 0.012 57)',
    ink: 'oklch(0.967 0.010 74)',
    muted: 'oklch(0.76 0.016 64)',
    faint: 'oklch(0.58 0.016 60)',
    line: 'oklch(0.305 0.013 58)',
    accent: 'oklch(0.70 0.155 46)',
    accentInk: 'oklch(0.135 0.02 50)',
    accentSoft: 'oklch(0.315 0.075 48)',
    good: 'oklch(0.76 0.105 152)',
    goodSoft: 'oklch(0.30 0.055 152)',
    display: "ThmanyahSerif",
  },
};

export function themeVars(key) {
  const t = THEMES[key] || THEMES.light;
  return {
    '--bg': t.bg, '--surface': t.surface, '--sunken': t.sunken,
    '--ink': t.ink, '--muted': t.muted, '--faint': t.faint, '--line': t.line,
    '--accent': t.accent, '--accent-ink': t.accentInk,
    '--accent-soft': `color-mix(in oklch, var(--accent) ${t.dark ? 26 : 15}%, var(--surface))`,
    '--good': t.good, '--good-soft': t.goodSoft, '--display': t.display,
    '--card-shadow': t.dark
      ? '0 1px 0 rgba(255,255,255,0.04) inset, 0 2px 6px rgba(0,0,0,0.36), 0 10px 28px rgba(0,0,0,0.42)'
      : '0 1px 2px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.035)',
    '--card-border': t.dark ? '1px solid oklch(0.34 0.013 58)' : '1px solid transparent',
  };
}

export function Avatar({ person, size = 40, ring = false, dim = false }) {
  if (!person) return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--sunken)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--faint)', fontSize: size * 0.4 }}>?</div>
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: person.color, color: 'oklch(0.99 0.01 80)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--display)', fontWeight: 600,
      fontSize: size * 0.36, letterSpacing: 0.3,
      boxShadow: ring ? '0 0 0 3px var(--surface), 0 0 0 5.5px ' + person.color : 'none',
      opacity: dim ? 0.32 : 1, transition: 'opacity .2s, box-shadow .2s',
      userSelect: 'none',
    }}>{initials(person.name)}</div>
  );
}

export function AvatarStack({ ids, personById, max = 5, size = 28 }) {
  const shown = ids.slice(0, max);
  const extra = ids.length - shown.length;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((id, i) => (
        <div key={id} style={{ marginLeft: i === 0 ? 0 : -size * 0.32, zIndex: max - i,
          borderRadius: '50%', boxShadow: '0 0 0 2.5px var(--surface)' }}>
          <Avatar person={personById(id)} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{ marginLeft: -size * 0.32, width: size, height: size, borderRadius: '50%',
          background: 'var(--sunken)', color: 'var(--muted)', boxShadow: '0 0 0 2.5px var(--surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 600 }}>
          +{extra}
        </div>
      )}
    </div>
  );
}

const PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5.5 9v10.5h13V9',
  history: 'M4 6h16M4 12h16M4 18h10',
  wheel: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 3v9l6.4 6.4M12 12 5.6 5.6',
  chart: 'M5 20V10M12 20V4M19 20v-7',
  plus: 'M12 5v14M5 12h14',
  check: 'M4 12.5 9 17.5 20 6.5',
  trash: 'M5 7h14M9 7V4.5h6V7M7 7l1 13h8l1-13',
  edit: 'M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4',
  chevron: 'M9 6l6 6-6 6',
  sparkle: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z',
  x: 'M6 6l12 12M18 6 6 18',
  calendar: 'M4 8h16M7 3v3M17 3v3M5 6h14v15H5V6Z',
  crown: 'M4 18h16M4 18l-1.5-9 5 4L12 6l4.5 7 5-4L20 18',
  trophy: 'M7 5h10v3a5 5 0 0 1-10 0V5ZM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9.5 14h5M9 20h6M12 16v4',
  clock: 'M12 7v5l3.5 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
  users: 'M16 19c0-2.8-2.7-4.5-6-4.5S4 16.2 4 19M10 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4M17 11.5a3 3 0 0 0 0-6M20 19c0-1.8-.9-3.2-2.4-4',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  shuffle: 'M4 7h3l9 10h4M16 7h4M4 17h3l3-3.3M16 4l4 3-4 3M16 14l4 3-4 3',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronRight: 'M9 6l6 6-6 6',
  minus: 'M5 12h14',
  gamepad: 'M8 8.5h8a4 4 0 0 1 4 4v1.2a2.6 2.6 0 0 1-4.7 1.5l-1-1.4a1.6 1.6 0 0 0-1.3-.7h-2a1.6 1.6 0 0 0-1.3.7l-1 1.4A2.6 2.6 0 0 1 4 13.7v-1.2a4 4 0 0 1 4-4Z M7.4 11v2.2 M6.3 12.1h2.2 M15.6 11.3h.01 M17.4 12.9h.01',
  medal: 'M8 4l-3 6m11-6l3 6M9 4h6M12 21a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-3.2l1.5.9-.4-1.7 1.3-1.1-1.7-.15L12 14l-.7 1.6-1.7.15 1.3 1.1-.4 1.7Z',
  swords: 'M14.5 17.5 21 11l-1-3-3-1-6.5 6.5M9.5 9.5 3 16l1 3 3 1 6.5-6.5M5 5l3.5 3.5M19 5l-3.5 3.5M4 14l2 2M18 14l-2 2',
  share: 'M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98M21 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM21 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
};

export function Icon({ name, size = 22, color = 'currentColor', sw = 2, fill = false }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, display: 'block' }}>
      <path d={d} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
        fill={fill ? color : 'none'} />
    </svg>
  );
}

export function Sheet({ open, onClose, title, children }) {
  const [mounted, setMounted] = useState(open);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (open) { setMounted(true); requestAnimationFrame(() => requestAnimationFrame(() => setShow(true))); }
    else { setShow(false); const t = setTimeout(() => setMounted(false), 280); return () => clearTimeout(t); }
  }, [open]);
  if (!mounted) return null;
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end',
      background: show ? 'rgba(20,12,8,0.42)' : 'rgba(20,12,8,0)',
      transition: 'background .28s ease', backdropFilter: show ? 'blur(2px)' : 'none',
      pointerEvents: show ? 'auto' : 'none',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', borderRadius: '28px 28px 0 0',
        padding: '10px 20px env(safe-area-inset-bottom, 24px)', maxHeight: '88dvh', display: 'flex', flexDirection: 'column',
        transform: show ? 'translateY(0)' : 'translateY(102%)',
        transition: 'transform .34s cubic-bezier(.22,1,.36,1)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.22)',
      }}>
        <div style={{ width: 40, height: 5, borderRadius: 99, background: 'var(--line)', margin: '4px auto 14px' }} />
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--display)', fontSize: 23, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.3 }}>{title}</h2>
            <button onClick={onClose} style={{ border: 'none', background: 'var(--sunken)', width: 34, height: 34, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)' }}>
              <Icon name="x" size={18} sw={2.2} />
            </button>
          </div>
        )}
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, margin: '0 -20px', padding: '0 20px', WebkitOverflowScrolling: 'touch' }}>{children}</div>
      </div>
    </div>
  );
}

export function Btn({ children, onClick, variant = 'primary', size = 'md', icon, disabled, style: s = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontFamily: 'inherit', fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
    border: 'none', borderRadius: 14, transition: 'transform .12s, filter .15s, opacity .15s',
    letterSpacing: -0.2, opacity: disabled ? 0.45 : 1, whiteSpace: 'nowrap',
    padding: size === 'lg' ? '15px 22px' : size === 'sm' ? '8px 14px' : '12px 18px',
    fontSize: size === 'lg' ? 17 : size === 'sm' ? 14 : 15.5,
  };
  const variants = {
    primary: { background: 'var(--accent)', color: 'var(--accent-ink)' },
    soft: { background: 'var(--accent-soft)', color: 'var(--accent)' },
    ghost: { background: 'var(--sunken)', color: 'var(--ink)' },
    quiet: { background: 'transparent', color: 'var(--muted)' },
    danger: { background: 'transparent', color: 'oklch(0.58 0.16 25)' },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...s }}
      onMouseDown={e => !disabled && (e.currentTarget.style.transform = 'scale(0.96)')}
      onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
      {icon && <Icon name={icon} size={size === 'lg' ? 20 : 18} sw={2.2} />}
      {children}
    </button>
  );
}

export function Card({ children, style: s = {}, onClick, pad = 18 }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--surface)', borderRadius: 22, padding: pad,
      boxShadow: 'var(--card-shadow)', border: 'var(--card-border)',
      cursor: onClick ? 'pointer' : 'default', ...s,
    }}>{children}</div>
  );
}

export function Segment({ value, options, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'var(--sunken)', borderRadius: 13, padding: 3, gap: 3 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          flex: 1, border: 'none', borderRadius: 10, padding: '8px 6px', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, letterSpacing: -0.1,
          background: value === o.value ? 'var(--surface)' : 'transparent',
          color: value === o.value ? 'var(--ink)' : 'var(--muted)',
          boxShadow: value === o.value ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
          transition: 'all .18s',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

export function Stat({ value, label, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--display)', fontSize: 30, fontWeight: 700, color: color || 'var(--ink)', lineHeight: 1, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, fontWeight: 500, letterSpacing: 0.2, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

export function ConfirmDelete({ open, onClose, onConfirm }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const MAX = 4;

  const close = () => { onClose(); setPw(''); setErr(false); };

  const press = (d) => {
    if (err) { setPw(String(d)); setErr(false); return; }
    if (pw.length >= MAX) return;
    const next = pw + d;
    setPw(next);
    if (next.length === MAX) {
      if (next === '1416') { setTimeout(() => { onConfirm(); close(); }, 120); }
      else { setTimeout(() => { setErr(true); setPw(''); }, 120); }
    }
  };

  const del = () => { setErr(false); setPw(p => p.slice(0, -1)); };

  const KEYS = [1,2,3,4,5,6,7,8,9,null,0,'⌫'];

  return (
    <Sheet open={open} onClose={close} title="Enter passcode">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <p style={{ margin: '0 0 20px', color: err ? 'oklch(0.58 0.18 25)' : 'var(--muted)', fontSize: 14, fontWeight: 600, transition: 'color .2s' }}>
          {err ? 'Wrong passcode' : 'Enter passcode to delete'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          {Array.from({ length: MAX }).map((_, i) => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: '50%',
              background: pw.length > i
                ? (err ? 'oklch(0.58 0.18 25)' : 'var(--ink)')
                : 'var(--line)',
              transition: 'background .15s',
            }} />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 280, margin: '0 auto 16px' }}>
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
              transition: 'background .1s, transform .08s',
              boxShadow: isBack ? 'none' : 'var(--card-shadow)',
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

      <Btn variant="ghost" onClick={close} style={{ width: '100%' }}>Cancel</Btn>
    </Sheet>
  );
}
