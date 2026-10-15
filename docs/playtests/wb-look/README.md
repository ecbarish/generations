# WB-LOOK: early route pacing

WBL-5 only. WBL-13 is deferred. [Draft PR #466](https://github.com/ecbarish/generations/pull/466).

## Boundary and player problem

[The Dev Lead's approved boundary](https://github.com/ecbarish/generations/issues/373#issuecomment-6182341126) is a new `scripts/early_pace.gd`, one marked call at `main.gd::_arrived`'s grass-counter reset and one in `::_explore`'s quiet-find branch, plus a standalone regression and this audit. There is no save-format change. The new read-only CI workflow was [claimed separately](https://github.com/ecbarish/generations/issues/373#issuecomment-6182379944).

The initial ten-grass countdown is unchanged. Previously, every later find needed 8–16 grass arrivals (6–12 for Wander), and a quiet sunny-clearing message never restored health. Before the first badge, the three Thornwood-biome maps now reset to 4–8 arrivals (3–6 for Wander). A quiet find restores rounded 30% maximum HP to each injured living teammate, capped at maximum. Fainted partners still need the existing free Maren/inn recovery. Later regions and journeys with any badge retain their old intervals and quiet finds.

The 62% wild / 14% loot / 24% quiet branches, first-catch guidance, starters and story thresholds stay unchanged. Every quiet find retains the original random flavour-selection draw before recovery is attempted, so healing introduces no additional RNG-sequence shift. The shared Thornwood story still triggers at 12 and 20 explorations; less walking reaches those thresholds sooner. The route's main road contains no grass: these changes do not create encounters while walking only on that road.

No walking, input, road, Continue, art, battle rendering, COMMS or preview-export changes are included. #458 owns the fix bundle; Grok owns WB-ROAD. The pack is deliberately deferred until the coordinated main merge/export after #458, as instructed.

## Reproducible evidence

`measure.gd` exercises the real `_step`, `_walk`, `_arrived` and `_explore` handlers on a small isolated patch of Thornwood Trail grass. It runs 100 seeds × three starters × two encounter-interval heritages, plus 1,000 isolated find rolls and 100 seeds × two heritages through both early story triggers. Creature creation and movement RNG are seeded separately. The story measurement models successful completion without combat or reading time.

The rendered CI workflow checks out the exact PR head with credentials disabled and a read-only token. It compares immutable baseline `90802ca04aaa8ffcf9055d5ba5aae6edb578ec80` against the candidate with official Godot 4.7.2. This is a task-specific historical comparison: it triggers only for the early-pace helper, its standalone test, this audit directory or its own workflow, not unrelated Wildbond changes. The baseline is defined once in the workflow; the actual detached worktree HEAD is recorded in `baseline.txt` and checked against its measurement source SHA. Each side captures real Xvfb/OpenGL frames at 1536×864 and 390×844 for the quiet find and wild battle. `validate.py` requires complete unique trial/shot sets, correct source SHAs, dimensions, HP changes and story counters. Artifacts stay under `early-pace-review/`.

All runtime homes are isolated. The standalone test refuses a reused or nonisolated home and uses only scratch save paths; it tests actual legacy loading and a real writer round-trip. No personal saves are read or rewritten.

## Measured results (Godot 4.6.3 locally; reproduced on 4.7.2 CI)

These are simulated movement-only seconds, excluding the opening, navigation decisions, reading and combat. The exact-head 4.7.2 run reproduced these values. They are not human acceptance.

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

## Source/evidence handoff

The [Reviewer source follow-up](https://github.com/ecbarish/generations/pull/466#issuecomment-6182855341) preserves the original quiet-find RNG draw, distinguishes recovery text from the existing sunny-clearing flavour, and narrows the historical-comparison workflow. The recovery text is now "Your partners catch their breath and recover some health." It uses the unchanged `say()` box. The expanded standalone regression passes **24,443 / 0 locally on Godot 4.6.3**, including 300 continuous six-quiet-find sequences through full recovery, checking the subsequent RNG state and rolls without reseeding. Updated exact-head CI/frame results are recorded in the PR; the linked runs below document the earlier head. Wildbond & Starfall Dev Lead's explicit acceptance of the 30% recovery balance remains requested, not assumed.

[Exact-head rendered run on f9503192](https://github.com/ecbarish/generations/actions/runs/38668214861) passed with official Godot 4.7.2. [The artifact](https://github.com/ecbarish/generations/actions/runs/38668214861/artifacts/11943422799) contains eight X11/OpenGL PNGs, full trial data, logs, source IDs and summary. Archive SHA-256: `7d96991a8ca91ea602fbed4039b6bb66c3ae9b0fdbf287597870c158dcbfcf1e`. Both source variants have no runtime errors. The first rendered attempt was rejected for an incomplete fixture appearance; the second was correctly rejected for an unticked follower obstructing isolated timing. Those harness bugs are fixed, not suppressed. Timing excludes follower motion; still captures restore the actual chosen starter beside the player.

The [Director assigned the integration-fixture issue to its owner](https://github.com/ecbarish/generations/issues/373#issuecomment-6182646603) and requested this standalone-evidence handoff. **Source/evidence work is handed off for owner integration; this is not merge-ready.** The draft state and required checks are not bypassed.

- Standalone early-pace regression: **11,255 passed / 0 failed** locally on 4.6.3 and in exact-head CI on 4.7.2. Real legacy loading and scratch writer round-trip passed.
- Baseline full suite: 18,943 passed / 0 failed.
- Current unchanged full suite: 18,841 passed / 54 failed. Independent diagnosis traced the cascade to the Isolde navigation fixture: its six-grass-tile route now correctly finds a lure, but the helper never dismisses incidental dialogue. A temporary diagnostic that dismisses that line and resumes the same route passes all 18,943 original assertions. This is diagnostic evidence only, not a passing unmodified suite.
- `run_tests.gd` stays untouched, per the Director. The owner should dismiss the incidental lure dialogue and resume the same Warden destination while retaining every battle/gate/save assertion; no encounters or checks should be disabled. The local diagnostic demonstrates this approach, but is not an integrated fix.
- The same cascade is visible in the existing 4.7.2 WD3 workflow (18,849 passed / 54 failed). Aggregate Checks remains a required owner gate. Export freshness is intentionally red because no pack was rebuilt; the owner must coordinate the fresh main merge and single export after #458. Rebaseline the comparison at that fresh main if its movement/art has changed.
- Independent source/security/test and all-eight-frame visual review passed. Recovery text fits at both sizes; the player, Ripplet and Pebblepaw remain visible; quiet HP changes from 1/23 to 8/23. This is staged-render acceptance only. The latest head/check state is in the PR handoff comment.

No physical-phone, first-ten-minutes playtest or human-fun acceptance is claimed. Playtester retains those checks.
