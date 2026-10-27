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
    bg: '#211f1c',
    surface: '#2d2a26',
    sunken: '#272420',
    ink: '#f1e9dc',
    muted: '#b7ad9e',
    faint: '#958b7d',
    line: '#403b34',
    accent: '#d3b37b',
    accentInk: '#211f1c',
    good: 'oklch(0.76 0.105 152)',
    goodSoft: 'oklch(0.30 0.055 152)',
    display: "ThmanyahSerif",
  },
};

export function themeVars(key) {
  const t = THEMES[key] || THEMES.light;
  return {
    '--member-color-strength': t.dark ? '70%' : '100%',
    '--member-ink': t.dark ? '#211f1c' : 'oklch(0.99 0.01 80)',
    '--bg': t.bg, '--surface': t.surface, '--sunken': t.sunken,
    '--ink': t.ink, '--muted': t.muted, '--faint': t.faint, '--line': t.line,
    '--accent': t.accent, '--accent-ink': t.accentInk,
    '--accent-soft': t.dark ? '#3d3427' : 'color-mix(in oklch, var(--accent) 15%, var(--surface))',
    '--good': t.good, '--good-soft': t.goodSoft, '--display': t.display,
    '--card-shadow': t.dark
      ? '0 1px 0 rgba(255,255,255,0.04) inset, 0 2px 6px rgba(0,0,0,0.36), 0 10px 28px rgba(0,0,0,0.42)'
      : '0 1px 2px rgba(0,0,0,0.04), 0 6px 18px rgba(0,0,0,0.035)',
    '--card-border': t.dark ? '1px solid #403b34' : '1px solid transparent',
  };
}

// Presentation only: the stored member color is never changed.
export function memberColor(color) {
  return `color-mix(in oklch, ${color} var(--member-color-strength, 100%), #d7cbb9)`;
}
