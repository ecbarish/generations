# Diamond Career newcomer fixes (DC-N)

Baseline: main 430d439. Draft/implementation: [PR #247](https://github.com/ecbarish/generations/pull/247). No version bump or public deployment claim.

The wall calendar offers Play and the existing optional preparations. A preparation line returns to Iona's corner with Play visible. Conversations show the full line immediately; Continue advances once. The first three opening games use arrival windows of ±32%, ±22%, and ±15% of pitch travel time, then the original ±10%. Both the glowing plate and the highlighted bar use that window. A first-game fastball has a 960 ms learning window, tapering to the original 300 ms. On-time swings still can miss or be caught; no hit or promotion is guaranteed. Signed clubs and later series do not restart the assistance.

Checks cover real UI navigation from a new character, single-press continuation, calendar/preparation Play, an arrival-timed pointer swing, and save/reload, at 375×812, 1366×768, 1920×1080 and 3440×1440. Captures include the exact pre-change game bytes routed from git and the new flow. No personal saves are used: every size gets a fresh isolated Chromium context, with service workers blocked.

Reproduce: serve this checkout with serve.ps1, then run node docs/playtests/diamond-dc-n/browser-review.cjs (Playwright and local Chrome required). Set DC_REVIEW_URL to another localhost port when Claude owns 8765. The browser-result.json records the completed check count. tests/diamond.html adds seven checks, including 6,000 seeded pairs proving improved early contact/hits without guaranteed success, the assistance taper, unchanged mid-pitch save data, and offers after six games. All original baseball and career checks remain.

Limits: Chromium touch emulation is not physical-phone or Safari validation. This verifies functionality and screenshots; it is not an independent newcomer fun score. Practice contact retains its existing stat preparation; a playable drill remains a separate possible task. No shared dialogue, Godot, hub, save-name or salary changes.

## Played series

A fresh phone-sized UI run completed all six games using actual calendar clicks and field taps, without overriding saves, pitch types, RNG or results. It made 24 manual swings, earned one manual hit in the first two games, and reached both contract offers after game six. See played-series.json, phone-earned-hit.png and phone-contract-offers.png. Reproduce with node docs/playtests/diamond-dc-n/played-series.cjs; the real RNG means results differ. The validation run timed every swing at 85% arrival rather than selecting only strikes or guaranteed hits. This proves the route works; one automated run cannot establish whether baseball balance feels satisfying.

## Baseline model comparison

24,000 direct comparisons against main 430d439 match the original pitch outcomes and feedback exactly when no learning window is requested: 1,000 seeds × eight arrival timings × timing, tactical and simulated batting. See baseline-model.json. The new career function supplies the wider window only for the first three opening games.

## Full checks

node tools/run-all-checks.cjs: all 20 suites pass on 2026-10-12, including 129 Diamond Career checks, 93 Diamond Manager checks, 1,526 Wildbond Godot checks, 264 Starfall Godot checks and 22 unchanged save names. Godot runs used isolated APPDATA in Temp. No Godot source or preview changes.
