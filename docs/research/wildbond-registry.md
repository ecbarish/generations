# WB-REGISTRY: validated species registry

Claimed by Codex for Evan on 2026-10-17, following the explicit request to continue the Wildbond implementation plan in #543.

Scope, extended by Evan's next request: connect the read-only species registry to real startup and creature construction/lookup, preserving all 189 existing species, RNG behavior and save IDs. The Night Market baseline failure is repaired in #545. Pending battle/input fixes from #491 are merged as a dependency before the combined source is exported; #475 remains separate art work.

Owned paths: `wildbond-godot/scripts/species_registry.gd`, the narrow hooks in `scripts/main.gd` and `scripts/rules.gd`, registry tests/runners and their call in `tests/run_tests.gd`, the source-matched Web pack/manifest, this report and project/session bookkeeping. The module was initially test-staged, then moved into runtime by the explicit integration request. PR #544 targets #545's branch so its diff contains Wildbond work; review #545 and #491 first, then retarget to main after they merge. No author merge or deployment.

No private sprites, copied Pokémon data, runtime pack picker, battle replacement or save migration in this increment.

## Implemented behavior

The runtime module is [species_registry.gd](../../wildbond-godot/scripts/species_registry.gd). It owns deep copies of accepted definitions, so reading a normalized creature or move cannot change the registry or the current game.

| Method | Behavior |
|---|---|
| `load_legacy(DATA)` | Normalize the already-merged runtime catalogue; return an empty error list on success. A failure leaves the previous registry intact. |
| `resolve(id)` | Resolve an old bare ID or a canonical ID; unknown IDs return an empty string. |
| `legacy_id(id)` | Map only a registered original species back to its existing bare save/data key; imported metadata cannot impersonate an original. |
| `species(id)` / `move(id)` | Return detached definitions; unknown IDs return empty dictionaries. Missing accuracy defaults to 1.0. |
| `legacy_snapshot()` | Return an unchanged copy of the original runtime data; imported definitions never overwrite it. |
| `add_pack(dictionary)` | Stage species, move, type-profile and ability metadata together; commit all or nothing. |
| `ids()` / `size()` | Inspect accepted canonical identities. |

Existing `bogsnap` resolves to `wildbond:bogsnap` without rewriting a save. HP/Power/Guard/Speed/Wits/Spirit map to HP/Attack/Defense/Speed/Special Attack/Special Defense. JSON whole numbers normalize to integers in stats, lesson levels and evolution conditions. Names, descriptions, lesson order and level/bond/raising/place/time/weather/food/companion evolution conditions survive. Bogsnap still becomes Stillmaw at level 18 with Friendly trust.

No existing species, move, profile or ability can be replaced by a pack. Display names may match: identity comes from the ID. New definitions may reference later definitions in the same pack. Type and ability metadata can describe future imported creatures; it does not implement their battle mechanics.

Validation rejects missing references, ambiguous aliases, invalid IDs, missing/negative/fractional/nonfinite stats, malformed definitions, unsupported schema versions, invalid accuracy, absent companions and cyclic evolutions. Unknown evolution conditions are rejected instead of silently ignored. Graph validation is iterative. Both successful and failed validation leave caller-owned input unchanged. Failed imports also preserve previously accepted imported content.

The schema allows one or two distinct types per species profile; stats are whole numbers in 1–10,000, lesson/evolution levels in 1–100, trust stages in 0–4 and accuracy in 0–1. Packs contain 1–512 species. These are validation bounds, not balancing changes. Profiles list type identities only; no new type chart or ability execution is provided here.

## Definition shape

The synthetic fixture in [the tests](../../wildbond-godot/tests/species_registry.gd) is the executable example. Packs have `schema_version: 1`, `species: [...]`, and optional `moves`, `profiles` and `abilities` dictionaries. Species have a qualified `id`, `name`, optional `legacy_ids`, six `base_stats`, `profiles`, a `learnset` and optional `evolutions`.

The fixture defines `prototype:first` and `prototype:second`, a profile with two invented type names, two moves and ability metadata. The first evolves into the second and deliberately shares Bogsnap's display name, proving it cannot overwrite the original. The numbers and move names are synthetic; no Pokémon data or image was copied.

This is a definition adapter, **not a file importer**. It never loads files, images or pack scripts. Missing private packs and persistence still require the separate save/import work in [audit PR #543](https://github.com/ecbarish/generations/pull/543). Callers must handle an empty resolution before adding imported individuals to a party; that feature is not enabled here.

## Checks and integration handoff

The focused runner uses the actual merged game data and frozen v1 migration fixture:

```powershell
Godot_v4.7.2-stable_win64_console.exe --headless --path wildbond-godot -s tests/species_registry_runner.gd
```

The focused runner now passes **5,223 checks, zero failed**, with clean shutdown. It retains the original definition/rollback coverage and adds actual startup, identical fixed-seed construction of all 189 species at levels 5/18/36/60 through bare and canonical IDs, derived-stat equality, live content overrides, failed-rebuild isolation and a frozen-v1 load/migrate/save round trip through the unchanged writer. The same cases are appended to the normal suite; inherited checks remain intact.

Earlier test-staged evidence was 3,508 registry / 23,225 Wildbond checks, with the Night Market baseline failure. #545 fixes that failure and passes all 28 suites locally and its three GitHub workflows. The combined runtime source `d24b181f1742ba91bc338a75a26c1ca3310d0516` now passes **all 28 suites**, including **25,427 Wildbond checks**. The exact exported pack also boots without runtime errors on desktop, portrait and landscape, and first input is captured/inspected. [Source/pack hashes, counts, screenshots and limits](wildbond-registry-runtime/README.md) are retained. No check is disabled, weakened or skipped.

The registry is built after startup merges evolution data and prepares move lessons. `Rules.make` accepts a namespaced original ID and stores the original bare key on the individual; `Rules.sp` resolves namespaced original lookup to the same live `DATA` record. Bare-ID access remains direct, including content/test overrides. Damage, XP, evolution, party capacity and save schema are unchanged.

A failed startup rebuild creates a fresh empty registry rather than reusing another scene's definitions, and reports a developer error; current bare-ID rules still read the current scene's data. All shipped definitions pass validation. Runtime tests create an isolated real scene and restore the prior static Rules context; the first combined run exposed a shared test-context mismatch, which was corrected without weakening the live-override assertion.

This PR does not add a private-asset picker, new species encounters or a new battle scheduler. It connects the validated identity/data boundary while keeping legacy saves and play behavior stable. The next gameplay increment remains separating battle calculations from presentation events.
