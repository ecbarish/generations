# Wildbond registry runtime verification

Source: `d24b181f1742ba91bc338a75a26c1ca3310d0516`.
Godot source tree: `449540e6f61c23bfc68b7dcb5df52ea2a4354b99`.
Godot 4.7.2; no engine JS/WASM replacement.

The source includes the pending #491 battle/input fixes, the validated registry foundation and #545's Night Market baseline repair. PR #544 targets #545's branch to keep its diff within Wildbond; #545 and #491 must be reviewed/merged before retargeting #544 to main. No publication is claimed.

## Checks

- Focused definition/runtime runner: **5,223 passed, zero failed**.
- Full Wildbond suite: **25,427 passed, zero failed**, including the inherited #491 checks and real Continue tests.
- Full repository aggregate: **all 28 suites pass**, including 423 unchanged Night Market checks, Starfall Godot 488, catalogue, save names, asset-library and context checks.
- The same code exercised all 189 species at levels 5, 18, 36 and 60 through bare/canonical creation and lookup, comparing full creature records, RNG state and derived stats. Frozen v1 save data went through the actual loader, migration and writer; party, ranch, egg, collection, badges/story and bare species IDs survived.
- Pack structure/entry hashes inspected with the existing `wildbond-preview-pack.py` unpacker: **240 entries**, compiled `scripts/species_registry.gdc` present, all `tests/` paths excluded.
- Export freshness and final-head CI are recorded in the PR after the pack commit.

Pack: **20,657,868 bytes**, SHA-256 `02e179255f32cc72198af1cdd8bd58d0852f47c8ee6cf0fa1c48d59394c89cca`. The build manifest pins this source/tree and all four preview-file hashes. `review_run` stays null for this local export; no invented CI or deployment record.

## Exact-pack browser smoke

The [smoke record](smoke.json) pins the same source/tree, pack hash and size. All three fresh browser contexts booted that exact pack and reported **zero runtime errors**. Desktop used Space; both phone sizes used a real tap on the visible How to play card. Screenshots were inspected to confirm that the first input reveals the world:

| View | Loaded instructions | After first input |
|---|---|---|
| Desktop 1366×768 | [How to play](howto-1366x768.png) | [Larkhaven arrival](arrival-1366x768.png) |
| Portrait 390×844 | [How to play](howto-390x844.png) | [Larkhaven arrival](arrival-390x844.png) |
| Landscape 844×390 | [How to play](howto-844x390.png) | [Larkhaven arrival](arrival-844x390.png) |

This is a boot/input smoke, not a fresh playthrough, physical-phone acceptance or a fun rating. The headless tests cover deeper save/creature parity. The initial portrait probe tapped the empty area between the card and controls; inspection showed it had not dismissed the card. The retained run taps the visible card and asserts a changed screen, then the images confirm the world is visible.

Reproduce after exporting from the pinned source:

```powershell
Godot_v4.7.2-stable_win64_console.exe --headless --path wildbond-godot --export-pack Web play/wildbond/index.pck
node docs/research/wildbond-registry-runtime/stage-pack.cjs
node docs/research/wildbond-registry-runtime/smoke.cjs
python tools/wildbond-export-freshness.py --base origin/main --head HEAD
```

The stage helper preserves the existing engine and changes only the shell's pack byte count plus its manifest. It does not export or publish. The smoke uses isolated browser storage and never invokes internal game methods or reads a player's saved journey.
