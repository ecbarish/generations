# DM-N1c: recent form

PR #310. Hot/cold form is a temporary next-game adjustment from the last five qualifying appearances, capped at ±3. Permanent ratings, ceilings, Glove, Speed, Stamina and contract values are separate. No new random rolls. Bench/rest days and small cameos do not count. Five neutral qualifying appearances clear any streak; a new season resets everyone.

Batters qualify with three plate appearances: two hits or a homer +1; hitless with three at-bats −1; otherwise 0. Pitchers qualify with nine outs: runs per nine ≤3 earns +1, ≥6 earns −1, otherwise 0. Regular-season and final games count once, using distinct persisted game keys. Old saves receive neutral form without reconstructing historical results; active games survive migration.

## Evidence: 2026-10-13 implementation snapshot

- tests/diamond-manager.html: **114 checks pass**, 12 new regressions covering qualifiers, bounded ratings, fade, fatigue, unchanged permanent ability/value/RNG, real plate-appearance integration, old/live saves, invalid imports, final keys, winter reset and readable roster labels.
- browser-checks.json: isolated fresh browser contexts at 390×844, 1440×1000 and 3440×1440; named hot/cold form, current/base values, expandable rules, Iona result note, close controls, no viewport overflow and no page errors. Small WebP captures below.
- Aggregate on main e795357 plus this task: **21 of 22 suites pass**. Only Little Ranch fails: “Left alone, the berries glow (the hint)”. Both Godot suites pass (1,643 Wildbond; 272 Starfall). Its owner was notified; no game assertions are weakened or skipped. Final targeted rerun after shortening phone copy passes all 114.

![Phone roster](roster-390.webp)
![Desktop roster](roster-1440.webp)
![Ultrawide roster](roster-3440.webp)
![Iona on phone](iona-390.webp)
![Iona on desktop](iona-1440.webp)
![Iona on ultrawide](iona-3440.webp)

This is implementation/visual evidence, not a new newcomer playtest. No game version bump or user-save modifications.

## Review repairs: 2026-10-14

Adam authorized the two reproduced review blockers and documentation reconciliation on the existing PR, preserving Evan's feature ownership. This is malformed-import hardening, not evidence that ordinary saves spontaneously corrupt.

- The current balance simulator and sports Manager fixture now load `form.js`. The historical `--baseline` list is unchanged because `f04364c` predates form. `node tests/diamond-model-loaders.cjs` executes both twelve-seed, six-season simulators and the actual sports fixture preamble; all three pass locally. The older full sports-card browser review is not rerun because Career has since been shelved from the hall.
- Live `formKey` values must be nonempty strings of at most 80 characters. Optional `formChanges` must be arrays of valid player/club/name/bounded-rating records. Validation rejects malformed input without mutating the imported league. Missing fields remain valid for legacy saves.
- Four new regressions cover malformed keys, malformed change arrays/entries, and genuinely pre-form regular/final games that preserve active play and seeded state through migration and completion. These four pass in a source-model VM; the full browser test page remains the authoritative game check.
- Main `078a7185517a844acc7a9e6624ee629588dc51ad` is reconciled, retaining every newer main COMMS/session entry and the dated historical DM-N1c entries. No historical failure is presented as the new-head result.
- Local Chromium cannot launch in this environment. The additive, read-only `Diamond Manager review` workflow checks the exact PR head, runs the model loaders and browser checks, and captures roster/rules/Iona/closing evidence at 390×844, 1440×1000 and 3440×1440. Screenshots and JSON are workflow artifacts, without tracked-image churn. `Checks` continues to run the unchanged full aggregate and both Godot suites using its configured version.

The PR's current Tower and review comments record the exact revision, completed Actions runs and remaining blockers. This document does not claim pending CI or physical-phone/Safari testing passed. No merge or publication is authorized by this repair.
