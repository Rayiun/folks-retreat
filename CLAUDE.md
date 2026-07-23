# Folk's Retreat — Claude Context

Private PWA for a friend group. Tracks game nights, host rotation, game scores, food fetches, attendance streaks.

## Stack
- Vite + React 18, PWA
- Supabase (PostgreSQL + realtime subscriptions)
- Deployed on Vercel via GitHub auto-deploy (push to main → live instantly)
- No TypeScript, no test suite

## Credentials
Stored in Claude memory (not here). GitHub repo: https://github.com/Rayiun/folks-retreat (user: Rayiun).
Supabase URL and keys are in `.env.local` (not committed).

To update Supabase data directly via node, use credentials from `.env.local`.

## Key Files
- `src/store.js` — all data logic, Supabase client, hooks, pure functions
- `src/screens.jsx` — all screens (Home, History, Stats, ProfileSheet, etc.)
- `src/App.jsx` — app shell, tab bar, theme, passcode gate
- `src/ui.jsx` — shared UI components (Sheet, PasscodeGate, Icon, Avatar, etc.)
- `src/games.jsx` — Arena (games) screen
- `src/wheel.jsx` — Shame wheel screen

## Supabase Tables
- `people` — id, name, color, away (boolean)
- `weeks` — id, date, host_id, attendees (array), note
- `fetches` — id, person_id, date
- `games` — id, cat, title, date, format, players, winner_id, team_a, team_b, winner, score

## People (current)
| id  | name          |
|-----|---------------|
| p0  | R. Alturki    |
| p1  | S. Alshehri   |
| p2  | R. Alghamdi   |
| p3  | A. Almubark   |
| p4  | A. Alzamil    |
| p5  | S. Alhazzaa   |
| p6  | H. Alhoraim   |
| p7  | M. Almutairi  |
| p8  | S. Alhomoud   |
| p9  | S. Alassafi   |
| p10 | M. Alkheraiji |
| p11 | M. Aldawoud   |
| p12 | F. Alzamil    |

A. Alzamil (p4) and F. Alzamil (p12) are linked — when one hosts, it counts for both (linkedHostIds logic in store.js).

## App Rules & Logic
- **Host rotation**: sorted by fewest hosted → oldest last hosted. Away members sorted to bottom with ✈ badge.
- **Away toggle**: persists in `people.away` column in Supabase (not localStorage). Optimistic UI update.
- **Streak**: only missing on Thursday(4) or Friday(5) breaks streak. Sat–Wed misses are allowed/skipped.
- **Bonus hosted dates**: hardcoded in `BONUS_HOSTED_DATES` map in store.js — pre-app historical hosting dates per person.
- **mergedLastHosted**: picks the later of bonus dates vs logged weeks for "last hosted" display.
- **Fair mode** on wheel: default OFF.
- **Passcode to edit games**: `1416` (PasscodeGate component in ui.jsx).
- **App passcode gate**: `2013` (AppGate in App.jsx).
- **Collective failure**: when no host logged, shows app icon + "Collective Failure" label.
- **Dense ranking** for ties in leaderboard/podium.

## UI Rules
- Font: ThmanyahSans (loaded via CSS)
- Colors: oklch color space, CSS custom properties, light/dark theme
- Sheet component: `position: absolute` (NOT fixed — avoids PWA viewport issues)
- `pointerEvents: none` during Sheet close animation (prevents ghost overlay blocking tab bar)
- Profile sheet: looks up live person from `store.people` (not stale prop) so Away toggle updates instantly
- Tab names: Shame, Arena, Home, Nights, Stats

## Deployment
Every `git push` to `main` triggers Vercel auto-deploy. No manual deploy needed.
Changes to Supabase data (fix a date, etc.) can be done directly via node script with the credentials above — no redeploy needed.
