# Roof routing fix — issue #149

PR #154, built from main `0b7de2901a4a81e0936dd10e38e2eb25b383a080` (homes #137 are merged). Godot `4.7.2.stable.official.ed1daf0bf`.

`route()` now rejects `_under_roof()` cells, matching the static roof collision already enforced by movement. Its existing closed-door and stationary-NPC exceptions are unchanged. Calling `walkable()` for every planned step would also add its dynamic actor occupancy rules, which is outside this fix.

## Reproduction and regressions

`wildbond-godot/tests/roof_routes.gd`, called by the existing native suite, instantiates an isolated no-save scene and drives its actual `_tap()` and `_process()` methods. It never retries/replans a failed tap. Other actors are hidden to isolate fixed map geometry. Each route checks that the destination is legal, the tap is accepted, no planned cell is under a roof and the character reaches the goal within 20 seconds of simulated ticks.

| Map | Start | Destination | Before fix | After fix |
| --- | --- | --- | --- | --- |
| Larkhaven | (11,5) | (21,1) | stops at (11,2), before entering home roof collision | reaches destination |
| Larkhaven | (21,1) | (11,5) | reaches destination | reaches destination |
| Sunthread | (27,3) | (28,2) | stops at start, before entering hall roof collision | reaches destination |
| Sunthread | (28,2) | (27,3) | reaches destination | reaches destination |

The original #149 Larkhaven start (15,3) was valid on the older audit revision; the merged homes now cover it. This fixture uses the accepted tap witness from #147's homes audit instead, with both endpoints open on current main.

Seven additional checks preserve all four home/inn/shop door destinations, the barn door, detouring around a stationary NPC and deliberately routing to an NPC destination. The focused fixture has **23 checks**: old code fails four (roof avoidance and arrival in each affected forward direction); fixed code passes all 23. Existing full native tests independently exercise barn/inn/shop/home transitions and legacy save loading.

## Run

```sh
"$GODOT" --headless --path wildbond-godot --editor --import --quit
"$GODOT" --headless --path wildbond-godot --script res://tests/run_tests.gd
node tools/run-all-checks.cjs
```

`GODOT` points to Godot 4.7.2. The local all-suite runner uses Playwright's headless shell: the regular Chrome executable cannot create its singleton socket in this environment. This selects a compatible browser without changing the test runner or any assertions.

`access-after.json` is the #147 native static map audit rerun against this fix, using that PR's `tools/audit/wildbond_maps.gd`. No rendered scene-quality pass is claimed: screenshots for entrance occlusion/furnishing remain issue #150. No player saves, save format, game version or shipped web preview changed. The published web pack will need its lane owner's normal export after merge.

## Validation status

The first full run passed 15 of 16 suites, including Wildbond's **1,292 checks** (1,269 existing + 23 new) and Starfall's **130**. Storm Front failed its timing-based synthetic touch-fire assertion; a focused retry also failed, while the unchanged baseline worktree passed the same 38 checks. Storm Front source and test files are byte-identical to this fix's base and have not been edited. The second full run passed **all 16 suites**, including Storm Front's 38 checks. No assertions were disabled or weakened. [First run](all-checks-first.txt) and [passing run](all-checks.txt) summaries are retained.

The updated static audit covers **18 maps**, with zero target-access failures and zero route/roof witnesses in its targeted search. This is not an exhaustive proof for every dynamic actor placement. GitHub CI has not produced a run for the API-published branch.
