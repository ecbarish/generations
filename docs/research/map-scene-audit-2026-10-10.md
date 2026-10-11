# Godot map audit — 2026-10-10

Native access audit completed; rendered visual review remains outstanding in [#150](https://github.com/ecbarish/idle-arcade/issues/150). Requested by #143; implementation in #147. No game code, assets, saves, versions or preview exports changed.

## Revisions and scope

| Source | Exact revision | Coverage | Access failures |
| --- | --- | --- | --- |
| main Wildbond | `95412d5ec7e9bc37beeefb1cc396617482f92182` | 13 outdoor maps + barn, inn, shop = 16 | 0 |
| Wildbond homes PR #137 | `ec38dafc86b60b04e046ef34ed536d0028a019e8` | same outdoor maps + barn and 4 interiors = 18 | 0 |
| main Starfall | `95412d5ec7e9bc37beeefb1cc396617482f92182` | one town; all 501 legal unique-building assignments across 4 plots | 0 |

Wildbond target checks cover downward door approaches, outdoor exits, interior exit tiles, items, sign adjacency, NPC adjacency, keeper-front tiles and incoming portal arrivals. The #137 run also checks its two home finds. Starfall checks serving, orders, reading, gate, inn step, Bryn's home and every plot doorstep. Current Starfall has no walk-in interiors; its decorative facades are not failed entrances.

## Verified finding

[#149](https://github.com/ecbarish/idle-arcade/issues/149): Wildbond tap routing can select roof-collision tiles en route to an otherwise reachable destination. The real `_tap()` accepts and queues these routes, but the real `walkable()` rejects the roof step; `_process()` clears the queue on that step.

- Larkhaven: start (15,3), goal (21,3); route crosses barn roof at (17,1)–(20,1).
- Sunthread: start (27,3), goal (28,2); route chooses (27,2), beneath the meeting hall roof, instead of going through (28,3).

Both goals are in the legal movement flood. JSON records the route, tap queue, legal goal and rejected step. No collision redesign is justified by the entrance-access results. The fix belongs to lane W; acceptance checks are in #149.

## Method and reproduction

Godot `4.7.2.stable.official.ed1daf0bf`, native headless scene instantiation. Import each project first. From repo root, with `GODOT` set to your executable:

```sh
"$GODOT" --headless --path wildbond-godot --import
"$GODOT" --headless --path starfall-godot --import
AUDIT_OUTPUT="$PWD/docs/research/map-audit/wildbond.json" "$GODOT" --headless --path wildbond-godot --script "$PWD/tools/audit/wildbond_maps.gd"
AUDIT_OUTPUT="$PWD/docs/research/map-audit/starfall.json" "$GODOT" --headless --path starfall-godot --script "$PWD/tools/audit/starfall_maps.gd"
```

For #137, use a separate worktree at its exact revision; point `--path` to that worktree's Wildbond project while retaining this audit script and an absolute output path. Evidence: [main Wildbond](map-audit/wildbond.json), [homes](map-audit/wildbond-homes-pr137.json), [Starfall](map-audit/starfall.json). Starfall JSON shares target coordinates and deduplicates identical grids; every tested assignment records its grid index and any unreachable target IDs.

Wildbond movement flood includes base solidity and `_under_roof()`, excluding closed doors. Actors are moved off-map for static geometry checks. Route witnesses search legal starts within three tiles of roof-on-open cells against reachable goals, then call actual `route()` and `_tap()`. This is a targeted roof check, not an exhaustive all-pairs path proof. The two door interiors use keeper fronts two tiles below the counter; home residents also need rendered/manual interaction confirmation.

Starfall enumerates absent plots or distinct building types: 1 empty + 20 one-building + 120 two-building + 240 three-building + 120 four-building states. Finished buildings include their solid side props; unfinished buildings have the same footprint and fewer prop obstacles. Rank is set to 3 to inspect completed construction geometry. This does not prove progression, resource or interaction gating.

## Limits and outstanding review

No rendered occlusion/furnishing pass is claimed. Xvfb could not create any display listening socket in this environment. Headless imports and logic fixtures succeeded, but roof layering, trees overlapping doors, camera crops and whether an interior feels bare require actual rendered views. #150 records scope and acceptance criteria for that review. Moving actors, input-device feel, progression gates and manual end-to-end door transitions are outside this static geometry pass. The #149 interruption is supported by accepted tap queues and movement predicates, not a filmed playthrough.
