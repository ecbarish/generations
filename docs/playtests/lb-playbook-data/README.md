# LB-PLAYBOOK-DATA: original playbook data

This file documents the **data contract**, not a playable expansion. The live game does not load `games/lantern-bowl/playbook.json`. Its engine, movement, play selection, ratings, blocking and save format are unchanged. LB-MANAGER owns the later consumer and its playable tests; LB-SEASON owns season/save work.

## Authority and scope

- [Named task](https://github.com/ecbarish/generations/issues/373#issuecomment-6180884974), with the specification and comparison merged in [#448](https://github.com/ecbarish/generations/pull/448).
- [Proposed contract](https://github.com/ecbarish/generations/issues/373#issuecomment-6180949299) and [authoritative-start clarification](https://github.com/ecbarish/generations/issues/373#issuecomment-6180996299).
- [Director approval](https://github.com/ecbarish/generations/issues/373#issuecomment-6181292042) explicitly covers those proposals and the shared test paths. Claim-only commit `b9634b95` and draft [#451](https://github.com/ecbarish/generations/pull/451) preceded implementation.

The current feature file set is the JSON, this evidence directory, `tests/lantern-bowl-playbook.cjs`, and data-only additions to `tests/lantern-bowl.html` after #444. The original approval included a COMMS claim, but [PM's later rule](https://github.com/ecbarish/generations/issues/373#issuecomment-6181624983) moved claims/handoffs to #373. A normal main merge takes main's COMMS verbatim and drops the feature-branch claim from the final diff; its original commit history remains. There are no task-authored engine, game-index, save, shared-system, service-worker, art, version or START-HERE edits. No game screenshot or human-playtest acceptance is claimed for inactive data.

## The schema

The file is strict JSON with three metadata fields and one collection:

- `schemaVersion` is `1`. This versions the **playbook contract**, not a player save.
- `coordinates` declares yards, the line of scrimmage at the snap as origin, positive x downfield and positive y toward the offence's right. It fixes the authored x range to **[-12, 40]** and lateral range to **[-24.5, 24.5]**, both inclusive. Negative x is needed for players who start behind the line.
- `depthTiers` declares the bands below.
- `plays` is an array of twelve unique definitions. IDs do not depend on display labels or player names. The existing `inside`, `outside`, `quick` and `deep` IDs are retained. This does not change the existing engine's play table or usage/save counters.

Every play has `id`, `label`, `detail`, `family` (`run` or `pass`) and `formation` (`iform`, `singleback` or `shotgun`). Labels and details are original player-facing descriptions for a future consumer. Formations describe the intended alignment; they do not add an offset to the paths.

### Passes and roster identity

A pass adds `depthTier`, `readOrder`, and `routes`. `routes` is an object with exactly four keys:

| Key | Roster entry |
|---|---|
| `wr0` | `roster.wr[0]` |
| `wr1` | `roster.wr[1]` |
| `te` | `roster.te` |
| `rb` | `roster.rb` |

`readOrder` is an exact permutation of those keys. It is an advisory progression, not an instruction to auto-aim, auto-select a receiver or automate the snap. The anonymous visible Slot, Fullback and Wing bodies in the current model are outside this contract.

Each route has exactly `routeType`, `waypoints`, `releaseDelaySeconds` and `endBehavior`. `routeType` is one of `go`, `slant`, `out`, `curl`, `post`, `flat` and `drag`. `waypoints` is an ordered array of `{x, y}` objects. A straight go needs two points; a breaking route needs at least three points and an actual heading change. An extra point on the same forward line is not a break. A reversal is valid for a curl. Adjacent duplicate points are invalid. Routes are not required to move monotonically downfield.

Static intent checks also preserve the route names: a go advances on one straight heading; slants and posts advance downfield toward the middle after the stem; curls return toward the line on their last leg; outs and flats move farther toward their starting sideline without a backward last leg; drags cross the middle without a backward last leg. These checks describe the authored polyline, not speed, openness or successful execution.

**Waypoint 0 is authoritative for the participant's start, in absolute snap-relative coordinates.** The future consumer must use the same positions for the actor and the visible route/body. It must not translate them by a legacy formation anchor. Current `routeTable` and `formationSpots` use different starts, and `syncSquad` currently adds the anchor-to-start difference. Applying that transformation to this data would shift the route. For example, the old quick wr0 actor starts at y=-8 while its visible shotgun anchor is y=-20. This contract replaces that ambiguity for its future consumer; it does not change those functions now.

For this catalogue every pass uses the same four explicit starts: wr0 `(0,-18)`, wr1 `(0,16)`, te `(-1,-6)` and rb `(-5,5)`. The JSON remains authoritative, including if a future schema-compatible data revision changes a start.

### Timing and the last point

- `releaseDelaySeconds` is a finite number from 0 through 3. It is measured from the snap. During that time the future receiver remains at waypoint 0; afterwards it follows the points in order at the consumer's chosen speed. It is not a delay at each break.
- `hold` means stop at the last waypoint while that unpossessed receiver's route remains active. Curl routes use `hold`.
- `continue` means continue in the last segment's direction at the consumer's chosen speed while that unpossessed receiver's route remains active, subject to runtime boundaries. The data does not choose speeds or resolve catches, tackles or out-of-bounds events.

All release, movement and endpoint instructions apply only to an active, unpossessed receiver. Possession or the end of the play ends that route; a catch hands control to the consumer's ordinary ball-carrier behavior. In particular, `hold` must not freeze a receiver after a catch.

These are definitions for the later consumer. No timers, route interpolation or hold/continue behavior is implemented by this PR.

### Depth

The tier measures **the maximum x reached by the primary read's authored waypoints**, where the primary read is `readOrder[0]`. It is measured from the line of scrimmage, not as distance travelled from the receiver's start, and not from the last point alone. This correctly treats a curl that reaches 12 yards and returns to 9 as intermediate. Checkdowns do not reduce a deep concept's tier, and indefinite future `continue` travel is not included.

| Tier | Primary read's maximum authored x |
|---|---|
| `short` | 0 inclusive to 8 exclusive |
| `intermediate` | 8 inclusive to 20 exclusive |
| `deep` | 20 through 40 inclusive |

The comparison's approximate 5, 10–12 and 25+ yard depths informed the breadth. These exact classification bands and all authored paths are this catalogue's own choices.

### Runs

A run adds only `carrierSlot: "rb"` and `runPath`, an ordered array of the same `{x, y}` points. Its first point is also the authoritative start. The path describes an intended lane, not a forced movement, an automatic carry, a blocked/open lane or promised yardage. It has no pass depth, read order, timing, ratings or probabilities. Blocking, possession at the snap, steering and actual results remain the engine owner's work.

## Catalogue

| ID | Family | Formation | Primary read / maximum authored x | Intent |
|---|---|---|---|---|
| `inside` | Run | I-form | RB path | Middle lane |
| `outside` | Run | Singleback | RB path | Edge, then upfield |
| `counter` | Run | Singleback | RB path | Show one edge, cut across |
| `draw` | Run | Shotgun | RB path | Backfield start, then middle |
| `quick` | Pass | Shotgun | wr0 / 6, short | Quick inside break |
| `deep` | Pass | Shotgun | wr0 / 31, deep | Long go with outlets |
| `slant` | Pass | Shotgun | wr1 / 6, short | Two inward breaks |
| `out` | Pass | Shotgun | wr1 / 10, intermediate | Sideline break |
| `curl` | Pass | Shotgun | wr0 / 12, intermediate | Turn back and hold |
| `post` | Pass | Shotgun | wr0 / 29, deep | Deep inward break |
| `flat` | Pass | Shotgun | rb / 3, short | Back outside |
| `drag` | Pass | Shotgun | te / 5, short | Shallow crossing route |

There are **4 runs and 8 passes, with 32 receiver routes**, covering all seven route types and all three depth tiers. Kicks, field goals and punts remain LB-GAMEFLOW's existing work and are not added here.

## Consumer obligations, not delivered behavior

LB-MANAGER must load/validate the data, map roster identities, align visible bodies with authoritative starts, follow all legs and timing, and preserve manual control. It must also implement world/possession transforms, collision and legal runtime field/end-zone handling. A path authored inside the static bounds can still cross a goal or sideline after world translation or continued movement. **Static bounds do not prove near-goal runtime safety.** Player save migration and preservation of old play usage are separate from this schema.

No source code, data table, route coordinates or asset was copied from Retro Bowl or ALL-22. The repository comparison contributes descriptive techniques only: a larger play pool, stems followed by breaks, varied depths and read order. All twelve definitions here are original.

## Reproduce and evidence

From the repository root:

```sh
node tests/lantern-bowl-playbook.cjs
node tools/run-all-checks.cjs lantern-bowl
node tools/run-all-checks.cjs
```

The Node and browser paths use the same validator and malformed-data fixtures. The browser entry now runs within the existing Lantern Bowl test page and aggregate runner, after preserving #444. No test runner or workflow was changed. The page loads the shared validator as a script, fetches the actual JSON, sends every shared assertion to its ordinary failure-reporting callback, and verifies all 396 ran. A missing script, HTTP failure, malformed JSON or failed assertion makes the page fail.

### Historical draft verification, 2026-10-15

These checkpoints preceded HTML integration and are not final-head browser evidence:

- `node tests/lantern-bowl-playbook.cjs`: **396 passed, 0 failed**, including all 32 route-intent assertions, malformed-data rejections, inclusive field bounds, primary-read depth boundaries, curl reversals and JSON round trips.
- `node --check tests/lantern-bowl-playbook.cjs`: passed. The same 396 checks pass through the browser-style export in an isolated Node VM with frozen input and no DOM, storage, timer or network access. This is **VM parity evidence, not a real-browser run**.
- Independent geometry audit: 12 unique plays; 4 runs; 8 passes; 32 routes (26 breaking, 6 go); 107 finite points; no zero-length segment; x spans -9 to 31 and y spans -18 to 23; 4 short, 2 intermediate and 2 deep primary reads. The smallest authored break is approximately 40.9 degrees. All seven named route types have their intended direction.
- Independent review found loose go/slant/post intent guards in the first test draft. The guards were strengthened and 20 wrong-direction fixtures added; independent recheck passed all 396 checks and rejected the reported regressions in both exports. The actual authored data did not require a geometry change.
- The normal local Lantern Bowl runner could not start Chromium in this environment. No local real-browser or aggregate pass is claimed. Normal repository CI will supply final-head browser/aggregate evidence after HTML integration.
- `tests/lantern-bowl.html` is unchanged at this checkpoint while #444 is open. Its integration, final-head CI and review handoff are pending. Existing save tests remain intact; no new save format or live-game behavior is introduced.
- Implementation head `34f17629` passed [all 28 existing aggregate suites](https://github.com/ecbarish/generations/actions/runs/38660087760), including 216 existing Lantern Bowl browser assertions and unchanged save-name checks; export freshness also passed. Those existing suites do **not** execute the new data checks before HTML integration, so this is regression evidence only.

The PR stays draft until those remaining gates are met. Static data and automated checks do not establish game feel, a phone playtest or a launch pass.


### Browser integration after #444

#444 merged as `095ec172`. A normal two-parent merge brings current main into this branch without rewriting published history. Main's COMMS is retained verbatim. All of #444's HTML assertions and save tests are preserved; the only HTML changes are one shared script load and an appended data-only block. No runtime game file, runner or workflow is changed by this task.

- The direct Node suite and syntax check still pass: **396 checks, 0 failures**.
- The HTML block contributes those same 396 checks plus three integration guards (the browser export exists, the JSON fetch succeeds, and all shared checks ran). Together with #444's 258 checks, the expected full page result is **657 checks**. This is an expected count until confirmed by the actual browser run.
- The normal local Lantern Bowl runner was attempted again after integration. Chromium could not start in this environment, so no local real-browser pass is claimed.
- Exact-head browser and aggregate CI, including the preserved v1 migration / newer-save byte-preservation tests, are recorded in the final self-check on [PR #451](https://github.com/ecbarish/generations/pull/451). Only that exact-head result establishes completion; neither the older draft runs above nor Node VM parity substitutes for it.
- This remains inactive data. No screenshot, live expanded-playbook behavior, human football feel, merge or deployment is claimed.
