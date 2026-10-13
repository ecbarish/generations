# Diamond Manager newcomer bugs (DM-N1a)

The reported post-game F shortcut and bench replacement bugs were reproduced on main c6bf72d at 375×812, 1366×768, 1920×1080 and 3440×1440. baseline.json records eight failures, using those exact committed game scripts. The patched browser checks use actual clicks and keys without forced actions; fixture leagues keep personal saves out of the test.

## Changes

- Completed games offer Front office both by button and F, including when an action button has keyboard focus. The result is recorded before any roster moves; closing the office preserves the final-score screen and Iona's report remains available. Hearing the report does not record the game twice.
- Starting a bench batter replaces the first starter with the same natural position, keeping that batting slot. The button names the outgoing player and the confirmation names both. If there is no match, it replaces the last batting slot as before. Unavailable players, pitchers and players already starting are rejected.
- The column says Natural pos: it describes a player's preferred position, not a new defensive assignment system. Existing saved/automatic orders may still have repeated natural positions; this step does not rewrite them.
- The hall's stale record is already fixed by AR2.15. The browser harness plays two games and checks the hall's existing read-only save projection; no launcher changes needed.

## Evidence and limits

Run with the own-clone serve.ps1 server on localhost:8777 and Playwright available through NODE_PATH:

`node docs/playtests/diamond-manager-dm-n1a/browser-checks.cjs`

Set BASELINE=1 to replay the original two failures against c6bf72d. results.json records the patched results. Eight captures show the office and replacement at the four sizes. Phone is browser emulation, not a physical-device playtest. Four new model checks exercise replacement, fallback, rejection and old-save migration in tests/diamond-manager.html. No new save fields, keys, version changes, shared systems or content. Player development feedback, streaks and dugout expansion remain DM-N1, subject to the new studio cycle.

Validation: all 20 suites passed individually on the final game code: 19 in the full runner, and Diamond Manager re-run after correcting the new no-match fixture (it had mistakenly chosen DH, which was present). Diamond Manager: 97 checks, including four new. Browser results: 32 passing checks across four sizes. The first full invocation returned failure for that fixture; the existing tests were preserved.
