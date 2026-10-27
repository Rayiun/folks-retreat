# Local development changes

Run `npm run dev` to open the local app, `npm test` for the offline regression tests,
`npm run lint` for code checks, and `npm run build` for the production build.
No additional packages are required.

## Behavior

- Editing no longer asks for a shared passcode. Deleting a single record asks for
  confirmation. The unused entry passcode and bulk/member deletion code are removed.
- Forms wait for the database to return the affected row. Pending submissions block
  double taps; failed submissions leave the draft open. A failure to confirm is not
  proof that no write happened: check the latest records before retrying.
- Successful writes trigger a reload, including when realtime is unavailable.
- Loading failures show a retry action and preserve any previously loaded records.
  Read requests time out after 20 seconds. Writes are not retried automatically.
- Away remains the reversible way to pause a hosting turn. No member history is
  removed. The existing linked-host, historical credit, 350-night offset, ranking,
  and Thursday/Friday streak rules are retained.
- Gathering dates use the existing local 7am night cutoff for new nights and games.

## Arena logging

The match logger retains the existing sheets, avatars, and theme. Choose FIFA or
Board Game, then select one or more winners and one or more losers. Players cannot
appear on both sides. No score, team mode, or game title is required. Optional name
and date controls are collapsed below the player pickers. New results use the
existing solo/team database formats, so no schema migration is required. Historical
scores remain intact when only a match's date/title is edited. Changing participants,
category, or outcome clears a score that no longer describes the result.

## Security decision

The owner explicitly deferred database access changes on October 26, 2026.
No authentication, database grants, policies, or settings were changed. The existing
anonymous access remains a known risk. Removing shared screen passcodes does not
provide database protection. A future authenticated member-access change must be
designed and tested separately before applying production policies.

## Validation limits

Tests use synthetic data and fake clients. They cover business rules, failed reads
and writes, selected-row deletion, duplicate submission prevention, and server-side
rendering of screens/editors. They never write to Supabase. Browser interaction,
mobile layout, realtime behavior, and successful live writes still need manual
verification or an isolated test database; the render tests are not end-to-end tests.
