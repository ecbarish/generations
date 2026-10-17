# Generations credits

Player page: [credits.html](credits.html). Project direction and playtesting: Evan. Development contributions: Claude, ChatGPT/Codex and Jules; [repository contributors](https://github.com/ecbarish/generations/graphs/contributors).

## Art and sound

The arcade's creature art, landscapes, portraits and covers are drawn in code. Its game tunes and effects use the shared Web Audio sound engine. No externally sourced image or audio files were found in the runtime asset audit of main ef770d7 on 2026-10-07. Review screenshots in docs are evidence, not game assets.

## Fonts

These families are requested unchanged through Google Fonts. Each is under the SIL Open Font License 1.1. The linked local notices include each family's copyright and full license. Browser/system fallback fonts are supplied by the player's device.

| Family | Used in | Copyright notice | Source notice | Local notice |
|---|---|---|---|---|
| Bungee | Hub; Realmbound promo | Copyright 2023 The Bungee Project Authors (https://github.com/djrrb/Bungee) | [Google Fonts source](https://raw.githubusercontent.com/google/fonts/5e8a3ba899557829a76cfdac30fa512bda91d7ca/ofl/bungee/OFL.txt) | [OFL 1.1](licenses/bungee-OFL.txt) |
| Figtree | Hub; Primordial | Copyright 2022 The Figtree Project Authors (https://github.com/erikdkennedy/figtree) | [Google Fonts source](https://raw.githubusercontent.com/google/fonts/5e8a3ba899557829a76cfdac30fa512bda91d7ca/ofl/figtree/OFL.txt) | [OFL 1.1](licenses/figtree-OFL.txt) |
| Instrument Serif | Hub; Primordial | Copyright 2022 The Instrument Serif Project Authors (https://github.com/Instrument/instrument-serif) | [Google Fonts source](https://raw.githubusercontent.com/google/fonts/5e8a3ba899557829a76cfdac30fa512bda91d7ca/ofl/instrumentserif/OFL.txt) | [OFL 1.1](licenses/instrumentserif-OFL.txt) |
| DotGothic16 | Hub; Starfall Guild | Copyright 2020 The DotGothic16 Project Authors (https://github.com/fontworks-fonts/DotGothic16) | [Google Fonts source](https://raw.githubusercontent.com/google/fonts/5e8a3ba899557829a76cfdac30fa512bda91d7ca/ofl/dotgothic16/OFL.txt) | [OFL 1.1](licenses/dotgothic16-OFL.txt) |
| JetBrains Mono | Primordial | Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono) | [Google Fonts source](https://raw.githubusercontent.com/google/fonts/5e8a3ba899557829a76cfdac30fa512bda91d7ca/ofl/jetbrainsmono/OFL.txt) | [OFL 1.1](licenses/jetbrainsmono-OFL.txt) |
| M PLUS Rounded 1c | Starfall Guild | Copyright 2016 The Rounded M+ Project Authors. | [Google Fonts source](https://raw.githubusercontent.com/google/fonts/5e8a3ba899557829a76cfdac30fa512bda91d7ca/ofl/roundedmplus1c/OFL.txt) | [OFL 1.1](licenses/roundedmplus1c-OFL.txt) |
| IM Fell English SC | Realmbound; Realmbound promo | Copyright (c) 2010, Igino Marini (mail@iginomarini.com) | [Google Fonts source](https://raw.githubusercontent.com/google/fonts/5e8a3ba899557829a76cfdac30fa512bda91d7ca/ofl/imfellenglishsc/OFL.txt) | [OFL 1.1](licenses/imfellenglishsc-OFL.txt) |
| Alegreya Sans | Realmbound; Realmbound promo | Copyright 2013 The Alegreya Sans Project Authors (https://github.com/huertatipografica/Alegreya-Sans) | [Google Fonts source](https://raw.githubusercontent.com/google/fonts/5e8a3ba899557829a76cfdac30fa512bda91d7ca/ofl/alegreyasans/OFL.txt) | [OFL 1.1](licenses/alegreyasans-OFL.txt) |
| Fredoka | Wildbond; Wildbond promo | Copyright 2016 The Fredoka Project Authors (https://github.com/hafontia/Fredoka-One) | [Google Fonts source](https://raw.githubusercontent.com/google/fonts/5e8a3ba899557829a76cfdac30fa512bda91d7ca/ofl/fredoka/OFL.txt) | [OFL 1.1](licenses/fredoka-OFL.txt) |
| Nunito | Wildbond; Wildbond promo | Copyright 2014 The Nunito Project Authors (https://github.com/googlefonts/nunito) | [Google Fonts source](https://raw.githubusercontent.com/google/fonts/5e8a3ba899557829a76cfdac30fa512bda91d7ca/ofl/nunito/OFL.txt) | [OFL 1.1](licenses/nunito-OFL.txt) |

Google Fonts source revision: `5e8a3ba899557829a76cfdac30fa512bda91d7ca` (notices retrieved 2026-10-07). The existing Google Fonts CSS URLs select the font files at runtime; this document records the source notices, not pinned font binaries.

## Renderer

**three.js r134**, copyright © 2010–2021 three.js authors, MIT License. Wildbond's Diorama loads the unmodified library from [cdnjs](https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js); its offline fallback is the existing HD-2D renderer. The isolated Realmbound third-person inn trial also uses this same pinned library (plus its GLTFLoader); its default characters and textures are original procedural code, and its optional comparison uses the Quaternius models credited below. [Version-specific source notice](https://raw.githubusercontent.com/mrdoob/three.js/r134/LICENSE) · [Full local MIT notice](licenses/three-r134-MIT.txt).

## Wildbond Thornwood atmosphere study

The isolated, export-excluded `wildbond-godot/tests/thornwood_environment/` study uses 15 unchanged GLB models from **Kenney Nature Kit**, created/distributed by Kenney (www.kenney.nl), CC0 1.0. The supplied notice labels the archive **2.1**, dated 2020-04-29; the creator's web listing calls it 1.0. Retrieved 2026-10-17 from [Kenney's Nature Kit page](https://kenney.nl/assets/nature-kit). [Supplied CC0 notice](licenses/Kenney-NatureKit-CC0.txt). Individual original paths/hashes and the exact archive URL/hash are recorded in `wildbond-godot/tests/thornwood_environment/assets/kenney/sources.json`. Source bytes are unchanged; runtime placement/scaling, nonmetallic materials and forest colour overrides are project-authored. Ground/water shaders, lighting and composition are authored for Wildbond. No models or code from Pokemon Battle Advanced are included.

## Maintaining the credits

Before adding an outside asset or library, record its name, author/copyright, exact source, version where applicable, use in the arcade, license and any changes here. Copy the supplied notice into licenses/ and update credits.html. Keep attribution required by the asset's license; CREATIVE.md sets the permitted-source rules. Third-party notices describe those components only; they do not grant a license for the entire arcade.

## Starfall adventurer reference pilot (docs only)

`docs/art/starfall-higgsfield/` contains AI-generated unnamed Swordsman, Mage and Cleric role studies and a frontal lineup, generated through Higgsfield using GPT Image 2.5 in Evan's authorised ART-SF-HF1 pilot (October 2026). Exact prompts, generation IDs and source hashes are recorded beside the originals. These are visual references only; provider usage rights remain unverified and they are not included as assets in a playable game. Verify and record rights before copying generated art into a game. The existing Starfall mock-up shown in the review is the repository's authored blocking reference, not generated by this pilot.

## Wildbond reference pilot: Higgsfield images (docs only, not in any game)

`docs/art/wildbond-higgsfield-pilot/` holds AI-generated concept references made with Higgsfield in Evan's authorised trial (ART-WB-HF1, PR #274, October 2026): starter turnarounds, prop concepts, evolution portraits and Tidewyrm explorations. Prompts, generation IDs and hashes are recorded beside them. The provider's usage rights have not been verified, so these images are design references only: none ships in a game, and none may be copied into a game until the rights are checked and recorded here.

## Wildbond (Godot trial): Ninja Adventure asset pack

**Ninja Adventure - Asset Pack** by **Pixel-Boy** and **AAA** ([itch.io](https://pixel-boy.itch.io/ninja-adventure-asset-pack)),
CC0 1.0 (public domain dedication; attribution not required, given with thanks). Downloaded 2026-10-07 (update #8,
March 2026). Used in `wildbond-godot/assets/ninja/` (the tamer: *Boy*; Maren: *OldWoman*; the first partner:
*Racoon*; their face portraits). **Removed the same day:** Evan didn't like its chibi proportions (big heads, no visible
legs) and preferred our own code-drawn figures. **Environment in use since 2026-10-08:** Evan liked the pack's
structures and nature, so `wildbond-godot/assets/env/` holds its *TilesetFloor* (as floor.png: grass, dirt paths),
*TilesetNature* (nature.png: trees, bushes, flowers) and *TilesetHouse* (house.png: the cottages), unchanged, with the
pack's licence file beside them. People and creatures stay our own. **Replaced 2026-10-09 by our own art** (Evan chose "Our own tiles"): the game now draws its ground, trees, bushes, flowers, cottages, Maren's barn and water from `wildbond-godot/assets/env/wild/`, painted by our own `tools/paint_tiles.gd` (docs/art/wildbond-art-direction.md). None of the pack's tiles are left in Wildbond. Evan, 2026-10-08: free packs are
placeholders to save time; the goal is the arcade's own original art and identity. **Music since 2026-10-08:** `wildbond-godot/assets/music/` holds nine of the pack's tracks, unchanged and renamed by
place: *Lost Village* (faded.ogg), *Calm Village* (larkhaven.ogg), *Peaceful* (barn.ogg), *Clearing* (thornwood.ogg),
*Sunny* (saltmarsh.ogg), *Adventure* (emberfall.ogg), *Ascension* (cloudglass.ogg), *Fight* (wild.ogg) and the second
*Fight* (trainer.ogg). **Ambience since 2026-10-08:** `wildbond-godot/assets/ambience/`: *WaveFar* (saltmarsh), *Wind2* (emberfall), *Wind* (cloudglass), *River* (stillreed, since 2026-10-09), unchanged except that since 2026-10-09 they are stored as OGG Vorbis instead of WAV (a sixteenth of the size); music *Boat* (stillreed.ogg, since 2026-10-09) *Quiet* (hollowecho.ogg, since 2026-10-09) *Sunny* (Sunthread, since 2026-10-09, playing saltmarsh.ogg) and *Peaceful* (Farwatch, since 2026-10-09, playing barn.ogg; places sharing a tune share the file); ambience *Wave* (farwatch, since 2026-10-09). **Battle effects since 2026-10-08:** `wildbond-godot/assets/fx/` holds seven of the pack's FX/Elemental sprite sheets, unchanged and renamed by element: *Flam* (ember.png), *Water* (tide.png), *Plant* (grove.png), *Rock* (stone.png), *Thunder* (gale.png), *Explosion* (shade.png, tinted violet in game) and *Ice* (radiant.png, tinted gold in game). Starfall's Godot town now uses its own frontier environment art (`starfall-godot/assets/env/frontier/`). The unused pack tiles (house.png, nature.png and floor.png, plus their import files) were removed in SF2.6c on 2026-10-11. It retains the pack's two tracks in `starfall-godot/assets/music/`: *Good Time* (town.ogg) and *Chill* (evening.ogg).

**Sound effects and feeling bubbles since 2026-10-09** (same pack, CC0; the full list of names, uses and source files
is in [docs/learning/assets.md](docs/learning/assets.md)): `starfall-godot/assets/sfx/` and `wildbond-godot/assets/sfx/`
hold sounds from *Audio/Sounds* (Menu, Bonus, Hit & Impact, Elemental, Magic & Skill, Whoosh & Slash, Alert, Creature)
and *Audio/Jingles* (LevelUp1, Success1, Secret1, GameOver), renamed by meaning; unchanged, except that the ones near a
second or longer are stored as OGG Vorbis. `starfall-godot/assets/emote/` and `wildbond-godot/assets/emote/` hold
emotes from *Ui/Emote*, unchanged and renamed by meaning. The pack's 53-colour palette is copied (enlarged, and as a
palette file) in `docs/learning/art/` for drawing our own art to match.

## Wildbond location planning reference

`docs/research/wildbond-layout/art-reference.png` is an original generated design reference made with the built-in image-generation tool on 2026-10-17, using the source-derived measured map. Exact prompt, hashes and limitations are recorded beside it. It is a visual proposal, not a runtime asset or an implemented map. The regional schematic is reused from the existing Wildbond world concept-map work.

## Realmbound 3D trial: Quaternius characters

Models and animations by **Quaternius** (https://quaternius.com), CC0 1.0 (public domain dedication; attribution not
required, given with thanks). Downloaded free from the creator on 2026-10-10: [Universal Base Characters](https://quaternius.itch.io/universal-base-characters),
[Modular Character Outfits: Fantasy](https://quaternius.itch.io/modular-character-outfits-fantasy) and
[Universal Animation Library](https://quaternius.itch.io/universal-animation-library) (Standard versions). Used only in
`experiments/realmbound-3d/` (`?characters=quaternius`); licence copy and the list of adapted parts in
`experiments/realmbound-3d/assets/quaternius/`.

### Shared paired character intake (2026-10-13)

Quaternius female Superhero base and Peasant/Ranger composites: CC0-1.0, notices preserved in shared/assets/characters/quaternius/. Original male resources remain credited in the Realmbound prototype. Two Higgsfield adult body reference sheets: generated design references only, rights unverified; exact prompts/jobs in docs/art/starfall-higgsfield/body-provenance.json. Not shipping meshes or sprites.

The paired Swordsman, Mage and Cleric sheets are additional Higgsfield references (2026-10-13), rights unverified; see kit-provenance.json. The isolated character-library fitting bench reuses the credited Quaternius CC0 assets and THREE/GLTFLoader r134 (MIT, licenses/three-r134-MIT.txt). Its sword attachment probe is project-authored.
