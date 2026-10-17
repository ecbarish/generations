# Wildbond: reuse-first asset sources

Reviewed 2026-10-17 after Evan supplied a trainer-resource spreadsheet and PokeAPI/sprites. Reuse suitable existing work to get to a polished playable slice; spend original-art effort on the approved starters, Bogsnap, signature characters and Wildbond landmarks.

This is a source shortlist and intake plan. No new third-party sprites, packs or runtime imports were downloaded, installed or committed for this review.

## Verified source roles

| Source | Useful coverage | Wildbond use and limits |
|---|---|---|
| [PokeAPI sprites](https://github.com/PokeAPI/sprites) | Version-organized Gen 1-4 battle fronts/backs, variants and icons; animated folders for selected games; Showdown and Black/White animated front/back collections | Best structured candidate for optional private Pokemon battle art and the progression through visual eras. A pair of battle views is not an eight-direction walking set. Exact per-species animation availability must be checked. |
| [Evan's spreadsheet](https://docs.google.com/spreadsheets/d/1hHkm8mbWbH-TAsDW9L0xZ3uVqPl2kz3unohhtQtqRI0/htmlview) | The readable content is a trainer/NPC resource index: official-game rips and fan packs from The Spriters Resource, Eevee Expo and DeviantArt; artist, category, generation and credit notes | A useful human-character/overworld discovery index. Its header says non-commercial and asks readers to verify each source's conditions. The readable fetch flattened link labels, so individual underlying download links were not all resolved or reviewed. It is not a blanket asset license. |
| [PMD SpriteCollab](https://github.com/PMDCollab/SpriteCollab) / [browser](https://sprites.pmdcollab.org/) | Directional creature animation sheets, animation XML and expression portraits, with a tracker and per-asset credits | Strong fit for optional private Pokemon companions in the sprite-in-3D prototype. The reference demo credits this source and its inspected metadata uses directional states/anchors. Coverage varies; check the actual selected species and animation set. Repository policy is attribution/non-commercial; preserve individual credits. |
| [Eevee Expo: PurpleZaffre Gen 4 overworld pack](https://eeveeexpo.com/resources/609/) | Author describes over 200 DPPt/HGSS human overworlds, protagonist animations, objects and extra effects/tiles | A concrete entry from the spreadsheet, useful for private reference/prototype exploration. Author asks for credit and no redistribution elsewhere. Do not bundle this pack into the public repository or treat the whole site as one license. Existing Wildbond NPC identities still need their own consistent representation. |
| [Kenney Nature Kit](https://kenney.nl/assets/nature-kit) | 330 3D files, CC0 | First environment candidate for trees, rocks and generic props in the Thornwood clearing. Match proportions/palette and create distinctive Wildbond landmarks around reusable pieces. |
| [Kenney Fantasy Town Kit](https://kenney.nl/assets/fantasy-town-kit) | 160 3D files, CC0 | Candidate for reusable town construction/props. Select only pieces that fit Wildbond's world rather than adopting an entire unrelated town. |
| [Kenney Particle Pack](https://kenney.nl/assets/particle-pack) | 80 2D VFX files, CC0 | Generic textures for sparks, dust, smoke and magical particles. These are ingredients; move timing, colour and motion still need Godot effects work. |
| [Quaternius Ultimate Monsters](https://quaternius.com/packs/ultimatemonsters.html) | 50 animated textured models, CC0; glTF available | Optional later 3D rendering/rig experiment. These do not represent the approved Wildbond starter/Bogsnap identities and must not silently replace them. |

Existing local reuse: `C:/Users/evanb/Godot/NinjaAdventure` exists. The repository already records it as an asset source; inspect its included inventory/license and existing credits before duplicating any audio, tiles or effects work. File existence was checked; this review did not enumerate or relicense its contents.

## Rights and distribution boundary

[PokeAPI's license file](https://github.com/PokeAPI/sprites/blob/master/LICENCE.txt) expressly identifies the images as Pokemon Company copyright, then labels the repository CC0. Do not interpret the repository label as a new public-domain grant over the Pokemon artwork. Keep optional imported Pokemon assets outside publicly distributed repository content, as Evan's original direction requires. Private use is a project scope, not an automatic rights clearance.

[SpriteCollab's policy and license](https://github.com/PMDCollab/SpriteCollab/blob/master/LICENSE.md) specify CC BY-NC 4.0; retain the selected artists' credits and relevant notices. Distinguish community contributions from original game material. A spreadsheet credit flag, free download or source-code license is not a substitute for checking the selected asset.

Kenney's listed packs and Quaternius models have independently stated CC0 terms on their original pages. For any incorporated public asset, preserve the original license/provenance and update the project's credits. No such intake occurred in this review.

## Small intake before any bulk collection

1. Keep originals and imported Pokemon separate by namespace and provenance. Original starter/Bogsnap art is already approved; adding imports must not overwrite it or rename saved species.
2. For a private pilot, choose only a few Gen 1-4 species needed for a deliberate test encounter, rather than importing every generation. Do not change current encounters just because assets exist.
3. Collect a coherent battle set plus directional overworld set where needed. An animated Gen 5-style sprite depicting a Gen 1-4 species is a separate art-era choice; species generation and sprite style are different fields.
4. Record provider URL, provider revision, source ID/form, artists, terms, raw hash, pixel dimensions, alpha, frame rectangles, per-frame durations, direction count, foot anchors and physical display scale. Retain fallback static art for missing animation. Do not invent eight-direction frames from a two-view battle pair.
5. Keep optional restricted assets in a user-selected external folder/private pack. Public code may include importer/manifest logic and original or appropriately licensed assets; public builds must work when the optional pack is absent.
6. Validate one loaded sprite in the real scene: complete body, stable feet, no halo/clipping, correct front/back/direction and readable motion. Verify an existing journey still loads and absent/bad private packs fall back cleanly before expanding intake.

Priority for the playable world slice: approved original companion + reusable environment props, then coherent animation and battle presentation. The shortlist saves drawing time; it does not require changing engines or generating hundreds of replacement assets.

