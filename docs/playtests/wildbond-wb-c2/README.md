# WB-C2: first partner sooner

Draft implementation; not merged, exported or published. This is targeted verification of the approved cycle-1 opening fix, not a new exploratory playtest campaign.

## Change

The arrival, Maren greeting and barn invitation lose repeated exposition. Family recognition stays at the register; the exact four existing family tales and the four-tellings clue follow the first bond instead of delaying the first creature choice. No automatic choice, skipped character creator, new lore, save flag or creature-data change.

## Baseline and verification

Baseline source: `40fcaf9c459e55f3e71c98b3a269072c45e707ee`; baseline main.gd SHA-256 `175eedf35465095581b7ca0d1fc9da199ca5d7c2fbf9065f8b4c424e27609801`.

- Local Godot 4.6.3: baseline 1,528 checks pass; revised 1,606 pass, including all twelve heritage/starter combinations and frozen pre-change save loading.
- Official Godot 4.7.2 + Chromium: [all 20 aggregate suites pass](https://github.com/ecbarish/generations/actions/runs/38397671326), including all 1,606 Wildbond checks. Local Chromium could not start.
- Initial rendered landscape touch passes for all three starters; desktop jobs hit the software-renderer wall-time limit while repainting simulated reading frames. The final harness stops redraw only during fixed reading budgets, still advances every game frame, and resumes rendered input/movement and all checkpoint screenshots. Final exact-head checks and full-window screenshots are linked from the PR.
- A repeatable real-input protocol will report both first acquisition and returned control with the partner. Simulated reading/choice budgets are disclosed; they are not a guarantee of every newcomer's reading speed.

## Frozen save provenance

`wildbond-godot/tests/fixtures/wb-c2-pre-change.json` is a synthetic fixture written by the baseline game's own save_game(), in an isolated test process. It has a renamed Ripplet (Puddle), a named ranch Mosshog (Fern), Coastfolk identity, nondefault HP/trust, inventory, badge, story and position. SHA-256: `643589c680ea74c739c93b586a7e56d475fd6144cf58da24c79b74503a35bb74`.

The revised suite loads those bytes, checks all preserved values and confirms the opening and relocated tale do not replay. Existing corrupt/missing-save recovery and older-format checks remain intact. This proves save-format compatibility; it does not establish browser IndexedDB continuity across the earlier site rename.

## Measurement protocol and limits

The same input fixture runs baseline and current. It includes the fresh-game how-to (12s), dialogue at 180 words/minute plus 0.75s per line, 30s in the character creator, a 2s Not yet/reopen check, 12s on the partner card and a deliberate choice. Navigation uses ordinary keyboard/touch-pad events and read-only shortest-route planning. The wandering seed is fixed. There is no skip-opening, teleport or direct story-handler call.

These are **60Hz simulated elapsed times**, not real first-time-player or physical-phone measurements. Players can spend longer customising, comparing partners or reading. Timing uses default Rowan/Farmfolk; separate regression tests cover all four heritages. Both acquisition and the full encounter through returned control must stay below 180 seconds. Moving the family tale cannot by itself satisfy that second gate.

Touch is injected through the actual Godot input handlers at an 812×375 landscape window under X11. It is not a browser-export, Safari or physical-device claim. Desktop runs use 1920×1080, with additional 1366×768 and 3440×1440 screenshots after timing ends. The fixture captures actual window pixels, including scaling/letterboxing.

Eight negative-control tests reject wrong partner identity, incomplete encounters, over-budget timings, missing captures and incorrect image dimensions. The existing map-render verifier had a stale count of 18 after main added Saltmarsh Trail and Moon Pool; it now demands the exact 20 map IDs and rejects omissions/duplicates. No existing screenshot/access assertion was removed.

## Local input-only comparison (final fixture, Godot 4.6.3)

| Method / Cindercub | First acquired before → after | Full encounter before → after |
|---|---|---|
| Keyboard | 168.92 → 119.02s | 200.68 → 174.42s |
| Touch | 168.38 → 118.18s | 200.40 → 173.93s |

All six current input/starter combinations pass; slowest acquisition is 119.55s, slowest full encounter 174.95s. The baseline's acquisition already met three minutes under this protocol, but its complete encounter did not. Raw [reports and reproduction steps](local-input/README.md) include exact source-file hashes and input counts. The final rendered CI uses the same protocol and verifies screenshots independently; consult the PR for its exact-head outcome.
