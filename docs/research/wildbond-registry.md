# WB-REGISTRY: validated species registry

Claimed by Codex for Evan on 2026-10-17, following the explicit request to continue the Wildbond implementation plan in #543.

Scope: a read-only legacy-data adapter, stable namespaced IDs and transactional validation for additional species definitions, with meaningful Godot checks against all 189 existing species. Existing combat, startup, saves, art and exports stay unchanged. The module will be integration-ready; it will not compete with #491's main/battle/input work or #475's art/export work.

Owned paths: `wildbond-godot/tests/support/species_registry.gd`, `wildbond-godot/tests/species_registry.gd`, `tests/species_registry_runner.gd`, its call in `tests/run_tests.gd`, this report, the Godot README changelog and project/session bookkeeping. Staging under `tests/support/` is deliberate: both export presets exclude tests, and #491 owns the next game pack. Runtime promotion needs its own integration/export change.

No private sprites, copied Pokémon data, runtime pack picker, battle replacement or save migration in this increment.

## Implemented behavior

The integration candidate is [species_registry.gd](../../wildbond-godot/tests/support/species_registry.gd). It owns deep copies of accepted definitions, so reading a creature or move cannot change the registry or the current game.

| Method | Behavior |
|---|---|
| `load_legacy(DATA)` | Normalize the already-merged runtime catalogue; return an empty error list on success. A failure leaves the previous registry intact. |
| `resolve(id)` | Resolve an old bare ID or a canonical ID; unknown IDs return an empty string. |
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

This is a definition adapter, **not a file importer**. It never loads files, images, pack scripts or saved creatures. Missing private packs and persistence still require the separate save/import work in [audit PR #543](https://github.com/ecbarish/generations/pull/543). Callers must handle an empty resolution before looking up an individual creature; no runtime loader has been changed yet.

## Checks and integration handoff

The focused runner uses the actual merged game data and frozen v1 migration fixture:

```powershell
Godot_v4.7.2-stable_win64_console.exe --headless --path wildbond-godot -s tests/species_registry_runner.gd
```

Result: **3,508 passed, zero failed**, with clean shutdown. It covers all 189 species, every lesson and evolution branch, all move accuracy defaults, detached queries, old-save migration, a successful two-species pack and malformed imports/rollback. The same checks are appended to `tests/run_tests.gd`; existing checks are untouched.

The final `node tools/run-all-checks.cjs` run passes **27 of 28 suites**. Wildbond Godot passes **23,225 checks** (the 19,717 baseline plus 3,508 registry checks); Starfall Godot passes 488, Wildbond Classic 3,254, and catalogue/save-name/asset-library/agent-context checks pass. The one failure is unchanged from #543's baseline: Night Market, **“Ready to hire 568x320: Back and cash fit beside each other without overlap.”** The aggregate exits 1; this PR stays draft under the normal review gate. No tests are disabled, weakened or skipped.

The export-freshness command is `python tools/wildbond-export-freshness.py --base origin/main --head HEAD`, run on the implementation commit. The build-manifest source commit `246d62f57c5a9fc97ea290dd11de594afc9681e2` was fetched to allow that check to inspect its tree. There are no changes under runtime `scripts/`, `data/` or `play/wildbond/`; all executable additions are in the preset's excluded `tests/` tree. No public release, imported asset, phone acceptance or new battle behavior is claimed.

Promotion should be one owner-coordinated integration/export step after #491: move the candidate from `tests/support/` to `scripts/`, update the test preload, build a registry after `_ready` merges data and prepares move choices, then consume it at an explicit new-feature boundary. Do not point existing battle/save code at an untested replacement dictionary. Re-run parity/save checks and rebuild the pack through its designated owner. This PR does not claim that players can import sprites or encounter new species yet.
