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
