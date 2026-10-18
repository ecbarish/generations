# WB-PRIVATE-LIBRARY

Claimed by Codex for Evan, 2026-10-18. Evan explicitly requested importing as many usable Pokemon sprites as practical while building the original catalogue. Stack on #562. Owns a new bulk-library importer/checks and this report, plus discovery links and the existing pilot importer only as needed for safe explicit selection.

Build a resumable external, revision-pinned library of available battle views and directional Idle/Walk sets. Keep the working pilot pack and saves intact. Record missing/incompatible assets, per-species coverage and credits instead of claiming every species has every style. No encounter population, full combat-data expansion, public copyrighted assets, exports or publication.

## How this fits the game

The [bulk importer](../../../tools/wildbond-private-library.py) collects base-species art for National Dex 1–1025 into an **external library**, separate from the working three-Pokémon native pack. It does not replace the original starters or add encounters/stats/moves to saved parties. Battle and directional-world availability are separate flags. Variant forms, shinies, female variants, every historical art era and full attack/emote sets are not included in this first intake.

Battle preference is Platinum for 1–493, Black/White for 494–649, then the pinned PokeAPI default collection for later IDs or missing earlier pairs. Actual source style is recorded; later default art still needs an in-world art review. Species generation does not imply availability in every graphical generation. World Idle/Walk comes from the pinned SpriteCollab base-form folders; explicit source `CopyOf` aliases resolve to their actual sheet without redrawing or renaming source PNGs. Every world set must have valid eight-direction grids, positive timing and measured shadow anchors. Unsupported/missing sets remain catalogued with issues instead of being passed off as complete.

The existing game loader eagerly decodes its active pack. A bulk library stays outside that hot path. Explicit export makes a **new**, bounded pack of at most 12 selected species with the existing trainer/NPC/items/scenery. It does not switch the active pack or download combat data. Native selection defaults to a neutral display height; individually review scale and personality before using a new species in a scene. Keep the existing three species in a selection used to launch the current chapter, because its encounters still expect them.

## Setup, resume and browse

Needs Python and Pillow, as the existing pilot importer does. Run from the repository root:

```powershell
python tools/wildbond-private-library.py
python tools/wildbond-private-library.py --check
```

Default root is `%LOCALAPPDATA%/Wildbond/private-sprites/library-v1`. For packaged-app storage, inspect the ignored `wildbond-godot/tests/private_sprites/local-pack.json` and choose a **sibling** `library-v1`, not the active `v1` directory:

```powershell
$pilotRoot = (Get-Content -Raw wildbond-godot/tests/private_sprites/local-pack.json | ConvertFrom-Json).root
$libraryRoot = Join-Path (Split-Path $pilotRoot) 'library-v1'
python tools/wildbond-private-library.py --root $libraryRoot --workers 8
python tools/wildbond-private-library.py --root $libraryRoot --check
Start-Process (Join-Path $libraryRoot 'index.html')
```

The private HTML gallery shows front/back battle views, searchable names/Dex numbers, styles and a Battle + walking filter. It stays beside the copyrighted art, outside Git. `library.json` records the full inventory, per-source URL/revision/SHA-256, per-species credits, coverage and issues. Per-file receipts plus atomic per-species checkpoints allow interrupted runs to resume; a rerun verifies cached hashes before reusing them. It retries transient failures, records species-level failures and leaves the working pilot/locator alone. `--ids 1-493` or `--ids 1,4,7,16,37,194` narrows an intake; reruns preserve previously catalogued species. A changed source revision requires a new library root.

To prepare the Kanto starter lines plus the current pilot Pokémon without activating them:

```powershell
python tools/wildbond-private-library.py --root $libraryRoot --ids 1-9,16,37,194 --pilot-root $pilotRoot --export-pack (Join-Path (Split-Path $pilotRoot) 'kanto-selection-v1')
```

Destination must be a new external folder. Offline verification runs before publication of the selected pack. You can test a selected pack using Godot's existing `-- --pack=ABSOLUTE_PACK_PATH` override. This changes art availability only; species still need supported gameplay data and deliberate encounter design before becoming playable. Do not overwrite the current pilot manifest, change its locator or run another real-save chapter instance to browse assets.

## Credits and verification

Sources: [PokeAPI sprites](https://github.com/PokeAPI/sprites) and [SpriteCollab](https://github.com/PMDCollab/SpriteCollab), pinned to the same revisions as the pilot. Source licenses/notices and individual `credits.txt` files are retained externally. Pokémon owner rights remain; private use and source repository labels are not new public redistribution permissions. Public PR evidence contains numerical coverage and tooling only, never source/derived Pokémon artwork or actual-art screenshots.

Run `python -B tests/wildbond-private-library.py` for offline synthetic-fixture tests: missing coverage, animation aliases/cycles, corruption, geometry mismatch, unverified references, range/path restrictions, interrupted-download cache reuse and isolated selected-pack export. Original source PNG bytes are preserved.

## Completed intake: 2026-10-18

| Species generation | Battle front/back pairs | Eight-direction Idle/Walk sets |
| --- | --- | --- |
| Gen 1 | 151 / 151 | 151 / 151 |
| Gen 2 | 100 / 100 | 100 / 100 |
| Gen 3 | 135 / 135 | 135 / 135 |
| Gen 4 | 107 / 107 | 107 / 107 |
| Gen 5 | 156 / 156 | 142 / 156 |
| Gen 6 | 72 / 72 | 70 / 72 |
| Gen 7 | 88 / 88 | 83 / 88 |
| Gen 8 | 96 / 96 | 89 / 96 |
| Gen 9 | 120 / 120 | 94 / 120 |
| **Total** | **1,025 / 1,025** | **971 / 1,025** |

All **493 Gen 1–4 species** have both battle and compatible world sets in this pinned intake. The remaining **54** lack a currently accepted base-form world set; precise per-species reasons are in [coverage.csv](coverage.csv). This is base-species coverage, not all regional/Mega/Gigantamax/other forms. Battle art is 493 Platinum pairs, 156 Black/White pairs and 376 default pairs. Later-generation/default art needs human style acceptance alongside the current originals and imported actors.

The inventory contains **7,882 species source files / 32,717,383 bytes**, excluding the shared tracker, notices, receipts, gallery and other bookkeeping. [Numerical summary](inventory-summary.json) retains the pinned revisions and generation totals without copyrighted images.

Verification completed:

- Full offline hash/image/animation/credit-reference verification passes. Six source Idle→Walk aliases restored the complete Gen 1–4 coverage without altering art. The packed-pixel anchor search was checked against every pre-existing measured anchor and preserves the old pilot's geometry.
- All **971 complete species** pass the actual Godot pack loader, plus **17,478** world/battle frame lookups (Idle/Walk in all eight directions and front/back battle views). This establishes loader compatibility, not final visual scale, personality or animation acceptance for every species.
- A **new 12-species Kanto selection** contains Bulbasaur→Venusaur, Charmander→Charizard, Squirtle→Blastoise, Pidgey, Vulpix and Wooper. Its 122 files and six NPC roles pass offline/native loading. It remains separate from the active three-species pack.
- All **10 offline importer tests** and all **28 existing repository suites** pass. The original private pack still verifies as three species / 50 files / six NPC roles. Wildbond remains 189 original species and 23 unchanged save names; gameplay catalogue expansion was not part of this art intake. Active runtime roots and changed source revisions are rejected before any network/write operation.
- Private gallery browser verification passes: 1,025 cards, Wooper search and decoded images, 971-ready filter. A real screenshot was inspected and stays beside the external assets as `gallery-private.png`.

For repeatable native verification, run [the native probe](../../../tests/wildbond-private-library-runtime.gd) with the project configured and a library root argument:

```powershell
Godot --headless --path wildbond-godot --script ../tests/wildbond-private-library-runtime.gd -- $libraryRoot
Godot --headless --path wildbond-godot --script ../tests/wildbond-private-library-runtime.gd -- (Join-Path (Split-Path $pilotRoot) 'kanto-selection-v1') --selected
```

Use an absolute `--script` path if your Godot invocation resolves relative paths differently. The whole-library probe refuses an existing `manifest.json`, temporarily creates its own library-only manifest, removes it on normal completion, and writes `native-verification.json` externally. It never opens the chapter or any profile. If interrupted, inspect its leftover manifest before retrying; never point that mode at an active pack. The `--selected` mode reads an existing bounded pack without modifying its manifest.

Next: choose coherent Pokémon groups for the connected Thornwood expedition, review their actual scene scale/motion and import the necessary bounded gameplay records before adding encounters. The large art collection is ready to select from; the current game does not yet expose 1,025 playable species. No author merge, public export or deployment occurred.
