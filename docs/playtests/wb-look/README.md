# WB-LOOK: early route pacing

WBL-5 only. WBL-13 is deferred. [Draft PR #466](https://github.com/ecbarish/generations/pull/466).

## Boundary and player problem

[The Dev Lead's approved boundary](https://github.com/ecbarish/generations/issues/373#issuecomment-6182341126) is a new `scripts/early_pace.gd`, one marked call at `main.gd::_arrived`'s grass-counter reset and one in `::_explore`'s quiet-find branch, plus a standalone regression and this audit. There is no save-format change. The new read-only CI workflow was [claimed separately](https://github.com/ecbarish/generations/issues/373#issuecomment-6182379944).

The initial ten-grass countdown is unchanged. Previously, every later find needed 8–16 grass arrivals (6–12 for Wander), and a quiet sunny-clearing message never restored health. Before the first badge, the three Thornwood-biome maps now reset to 4–8 arrivals (3–6 for Wander). A quiet find restores rounded 30% maximum HP to each injured living teammate, capped at maximum. Fainted partners still need the existing free Maren/inn recovery. Later regions and journeys with any badge retain their old intervals and quiet finds.

The 62% wild / 14% loot / 24% quiet branches, first-catch guidance, starters and story thresholds stay unchanged. Healing skips the old random flavour-message selection, so subsequent seeded outcomes can differ. The shared Thornwood story still triggers at 12 and 20 explorations; less walking reaches those thresholds sooner. The route's main road contains no grass: these changes do not create encounters while walking only on that road.

No walking, input, road, Continue, art, battle rendering, COMMS or preview-export changes are included. #458 owns the fix bundle; Grok owns WB-ROAD. The pack is deliberately deferred until the coordinated main merge/export after #458, as instructed.

## Reproducible evidence

`measure.gd` exercises the real `_step`, `_walk`, `_arrived` and `_explore` handlers on a small isolated patch of Thornwood Trail grass. It runs 100 seeds × three starters × two encounter-interval heritages, plus 1,000 isolated find rolls and 100 seeds × two heritages through both early story triggers. Creature creation and movement RNG are seeded separately. The story measurement models successful completion without combat or reading time.

The rendered CI workflow checks out the exact PR head with credentials disabled and a read-only token. It compares immutable baseline `90802ca04aaa8ffcf9055d5ba5aae6edb578ec80` against the candidate with official Godot 4.7.2. Each side captures real Xvfb/OpenGL frames at 1536×864 and 390×844 for the quiet find and wild battle. `validate.py` requires complete unique trial/shot sets, correct source SHAs, dimensions, HP changes and story counters. Artifacts stay under `early-pace-review/`.

All runtime homes are isolated. The standalone test refuses a reused or nonisolated home and uses only scratch save paths; it tests actual legacy loading and a real writer round-trip. No personal saves are read or rewritten.

## Local working-tree measurements (Godot 4.6.3)

These are simulated movement-only seconds, excluding the opening, navigation decisions, reading and combat. They are preliminary, not exact-head CI or human acceptance.

| Heritage | Mean first battle, before → after | Median | 95th percentile, before → after |
| --- | --- | --- | --- |
| Farm/default | 8.135 → 6.405 s | 4.75 s unchanged | 17.75 → 10.75 s |
| Wander | 7.100 → 5.960 s | 4.75 s unchanged | 14.75 → 9.25 s |

All 600 walks reached a wild battle. The first find remained at ten grass arrivals (19 steps / 4.75 movement seconds on this patch). The improvement is in longer waits after an initial nonbattle find, not a globally faster first countdown.

The 1,000 independent find seeds produced 605 battles, 139 loot events and 256 quiet events on both versions. With an injured living starter, 0 quiet events healed before and all 256 healed after. No berries were added.

| Heritage / story | Mean grass arrivals before → after | Trigger explorations |
| --- | --- | --- |
| Farm / Wren | 143.19 → 75.83 | 12 unchanged |
| Farm / Elderhorn | 239.45 → 123.73 | 20 unchanged |
| Wander / Wren | 108.47 → 58.80 | 12 unchanged |
| Wander / Elderhorn | 180.22 → 94.06 | 20 unchanged |

## Current validation status

- Standalone early-pace regression: 11,255 assertions passed locally; exact-head CI pending.
- Baseline full suite: 18,943 passed / 0 failed.
- Current unchanged full suite: 18,841 passed / 54 failed. Independent diagnosis traced the cascade to the Isolde navigation fixture: its six-grass-tile route now correctly finds a lure, but the helper never dismisses incidental dialogue. A temporary diagnostic that dismisses that line and resumes the same route passes all 18,943 original assertions. This is diagnostic evidence only, not a passing unmodified suite.
- [Owner coordination for the explicitly excluded integration test](https://github.com/ecbarish/generations/issues/373#issuecomment-6182469836) is pending; no test assertions were removed or bypassed in this PR.
- Rendered frames, exact-head Checks, export freshness and final independent review are pending. Draft remains held.

No physical-phone, first-ten-minutes playtest or human-fun acceptance is claimed. Playtester retains those checks.
