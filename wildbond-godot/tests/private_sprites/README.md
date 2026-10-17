# Wildbond private sprite pilot

Open **[Play Private Clearing.bat](<Play Private Clearing.bat>)** to play the native study. Evan's local private pack is already installed. On a new checkout/computer, run **[Setup Private Sprites.bat](<Setup Private Sprites.bat>)** first. The launchers use the installed Godot 4.7.2 and bundled Python; GODOT/PYTHON environment variables can override those executable paths.

- Move with WASD/Arrows; hold Shift to run. B opens the bag. Walk toward the creature, then E or Encounter.
- 1/2/3 or Next chooses Pidgey/Vulpix/Wooper.
- N toggles day/night; R toggles rain. Both also have buttons.
- Fight, switch, heal, catch or run in the existing turn-based study. After its final result, choose Return to Clearing. N in battle controls sound, as in the original battle study.

This is a separate, save-free native prototype. It does not open, alter or write the adventure, add captured creatures to its party, or update the public browser game. Imported encounter stats/type aliases are deliberate study proxies using Wildbond's existing seven elements and move rules, not full Pokemon mechanics. The turn-based engine is reused rather than rebuilt.

The world currently uses simple built-in meshes, a pitched follow camera, shadows, a pond barrier and tree-trunk collision. It establishes sprite-in-3D loading and the encounter/return loop; final Thornwood environment art, atmospheric polish, mobile/browser controls and performance are later work. Bogsnap now has approved-design-derived breathing/blinking and eight-direction walking from five drawn views, using individually measured frame regions and movement-driven steps. The private pack supplies Emerald trainer walk/run poses with four-way facing; the original procedural figure remains the animated fallback. The newly approved starter concept art remains unchanged and still needs proper production frames.

## External pack

The setup tool downloads **40 pinned source files and two decoded world images** outside this checkout, with six Platinum battle views and Idle/Walk/Shadow/XML/credit metadata for three species. It derives per-frame anchors from the single white marker on each PMD shadow frame, not guessed cropping. Eight directions and source durations are retained. Every image, source XML, individual credit file and license notice is hashed. Sources are PokeAPI/sprites, PMDCollab/SpriteCollab and pret/pokeemerald at the exact revisions in the setup script.

No source PNGs or generated manifest are included in Git. The tool writes only an ignored local-pack.json locator in this test directory; an explicit --pack=PATH argument or WILDBOND_PRIVATE_PACK overrides it. Godot's public Web/Windows export presets already exclude tests/* and *.bat, so this prototype/locator is excluded too. No public pack was rebuilt.

Offline verify:
```powershell
python -B tools/wildbond-private-sprites.py --root "YOUR_PRIVATE_PACK" --check
```

Run setup again to repair a changed file from its pinned source. Failed/absent packs clear cached imported entries and return to original Cindercub art. Optional imports cannot supply the wildbond: namespace. The loader bounds file size, checks hashes, image dimensions, source rectangles, frame timing, grids and anchors.

To use a deliberately different pack path:
```powershell
Godot --path wildbond-godot res://tests/private_sprites/play.tscn -- --pack="YOUR_PRIVATE_PACK"
```

Upstream artwork rights and individual attribution remain unchanged. The external pack preserves raw credits and notices, including the original CHUNSOFT entries for reused official PMD animations. The private pilot is not a license grant. Source artwork and captures containing imported sprites remain external; public review captures use only the original-creature fallback.

## Checks

```powershell
Godot --headless --path wildbond-godot --script res://tests/private_sprites/runner.gd
Godot --headless --path wildbond-godot --script res://tests/private_sprites/runner.gd -- --private
```

The first command is portable and verifies the missing-pack path. The second verifies the installed pilot's actual frames/directions, battle selection and return. The normal Wildbond suite also runs the synthetic malformed-pack checks without requiring any downloads or proprietary sprites. capture.gd exercises actual held-key walking and pointer Fight/Run/Return in the native Compatibility renderer.

## Bag and visit state

B opens the pocketed bag in the clearing; Bag opens it during a battle. Berries select a party member, show HP, and consume one berry only on successful healing. Balls are usable during battle. Key Items is presently empty. Arrow keys/Tab and Enter operate the focused controls; Escape/B returns or closes the bag. The practice party HP and supplies carry between encounters in this visit and reset when the scene is relaunched. Defeat rests the party so the practice visit cannot become stuck. Captures remain practice outcomes without adding creatures to a saved party.

Ranch Berry retains the existing study heal (half maximum HP); Bond Ball retains the existing lure odds. Private Oran Berry/Poke Ball icons are visual aliases, not a claim of canonical Oran Berry mechanics. Missing packs use original drawn item symbols. There is no shop, sorting, inventory save or full canonical item catalogue yet.

## Private world-art pilot

The optional pack now decodes the original Emerald general tileset with its six palettes and both metatile layers, including tile flips. It preserves raw PNG/palettes/metatiles and verifies two assembled images offline. The clearing uses that grass on a repeating ground material and a complete transparent tree assembled from source metatiles 30/31/38/39. Imported art remains external; path/pond placement, collision and encounter positions remain our prototype layout. This is a small terrain/foliage pilot: paths, water, rocks and buildings are not converted yet. These are flat tiles/props in a 3D scene, not native 3D Pokemon models. More polished modern biomes will need suitable 3D assets or authored scenery.

## Quiet automated browser checks

Evan reported repeated “Night night” and “berries.” Both phrases are emitted by Little Ranch's native browser speech synthesis, exercised by the full repository suite. No automated test browser remained in the subsequent process inventory; the native Wildbond clearing does not produce these spoken phrases.

For future local runs, use `node wildbond-godot/tests/private_sprites/quiet-checks.cjs` with the same Playwright dependency setup as the normal runner. Arguments still filter suites; `little-ranch` verifies the affected one. The helper invokes the unchanged repository runner, mutes its launched browser audio and replaces only native speech output before test pages/iframes load. Little Ranch's game word log, sound-setting logic and assertions remain active. It does not change normal browser sessions, global volume, game preferences or production code. The quiet Little Ranch run passes all 546 checks; this is not an audible speech acceptance test.
