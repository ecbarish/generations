# Wildbond world concept map

This folder is a planning aid for the Wildbond overworld. It shows the eight Warden regions, Larkhaven, and the League and Spire, with their places, routes, gates and Legend sites, taken from the world design in PR #455 at commit `66647dc9`, its final approved head.

## What to trust

**The schematic is the planning truth.** `world-map-schematic.svg` (and its 1920×1080 render, `world-map-schematic.png`) is drawn by `make_schematic.py` from `world_data.py`, and every name, link, gate and Legend site in it comes from #455 at `66647dc9`. If a painting disagrees with it, the schematic wins.

**The paintings are mood only.** `overworld-map-labelled.png`, the eight panels in `regions/` and `region-contact-sheet.png` are generated concept art. They set tone, light and palette direction. They are not layouts, sizes or tile plans, and the house rules in `docs/art/README.md` still apply to the real art (16px tiles, whole-number scaling, about 32 colours per palette, a 1px `#1e1a22` outline, light from the upper left, and mood added by the game as an overlay).

## Interim image

One image is interim: the overworld painting, `overworld-map-labelled.png`. Its Cloudglass Pass is painted as a rock outcrop with a cave mouth, with no lodge and no open summit, so the pass reads as a cave. A re-run did not fix it, so the original painting is kept as mood art until a better one exists. Its labels follow the schematic, not the paint: Highlatch and Lampcrown are pinned on the outcrop where the schematic puts them, and the hole there is not a cave. The painting also shows a house on a sea stack that is not a place, carries the sea further east than the schematic does, and has no court for the League, so the League and Trialstair labels sit on the winding stair. Old Root Grove, Lowbell's stair and the nest ledge on The Late Path have no clear painted landmark, so their labels sit where the schematic says those places are. These notes are also kept in `overworld-offsets.json` under `_paint_vs_schematic`.

The eight region panels are final mood art. Emberfall and Farwatch were re-run to fix two planning misses. Emberfall is now an inland highland with the coast only as a thin strip at the foot of Ashstair, and the spring-house has its round vent. Farwatch is now a mainland headland, with Outer Shoal as the only island. The bird in the Cloudglass panel is dark rather than bright. That is a mood miss only, so it was not re-run.

## Files

| File | What it is |
| --- | --- |
| `world-map-schematic.svg`, `world-map-schematic.png` | The planning schematic, with a legend listing all nine Legend sites |
| `overworld-map-labelled.png` | The overworld mood painting with place labels stamped on (interim, see above) |
| `regions/region-*.png` | One mood panel per Warden region, 1280×720 |
| `region-contact-sheet.png` | The eight panels on one sheet, captioned with each region's name |
| `style-notes.md` | Art direction per region, plus the cross-cutting rules (scale, light, the cave palette, water patterns, big creatures, palette budget) |
| `grok_world_prompts.txt` | The prompts used to generate the paintings |
| `world_data.py` | The data behind every picture: regions, places, routes, gates, loops and Legend sites |
| `make_schematic.py` | Builds the SVG from `world_data.py` and renders the PNG with headless Chrome |
| `label_overlay.py`, `overworld-offsets.json` | Stamps labels from `world_data.py` onto a painting. The offsets file pins each label for the current overworld painting |
| `make_contact_sheet.py` | Builds the contact sheet from the panels in `regions/` |

To rebuild, run `python3 make_schematic.py`, `python3 make_contact_sheet.py`, and `python3 label_overlay.py <painting> -o overworld-map-labelled.png --offsets overworld-offsets.json`. The source painting without labels is not checked in. When a better overworld painting arrives, the offsets file will need retuning.

## Where #452 and #455 disagree

The older reference in #452 and the world design in #455 conflict in the places below. This folder follows #455 at `66647dc9` in every case.

1. #452 says there are 8 areas but its table has 10 rows. #455 has eight Warden regions plus Larkhaven and the League and Spire.
2. Towns differ. #452 gives Saltmarsh Coast a town as well as a hamlet, while #455 has Lantern Quay only. #452 calls Emberfall's town "Emberfall", while #455 calls it Warmstep. #452 gives Cloudglass two towns, while #455 has Highlatch only.
3. In #452 the Meadow Track runs to Saltmarsh. In #455, Millgrass Lane reaches only Larkburrow.
4. In #452 Bramble Hollow runs through to Stillreed. In #455, Knothollow stays inside Thornwood's country.
5. In #452 Hollowecho's caverns come out in Sunthread. In #455, Flintcut leads to the Answering Ways, and Ribbon Road joins Bellstep to Threadmeet.
6. #452's Sunken Shrine tunnel loop is gone in #455. The Pass Ring and the Dry Boards replace it, and Lowbell is a dead end.
7. #452 puts a water guardian in the Sunken Shrine. #455 removes it and places Stillwake on the Reedhold jetty.
8. #452 has a roamer at the Old Mill. In #455 that only happens if Evan approves Greysail as a new species. Until then Greymill has no roamer.
9. #452 has a guardian in the Spire. #455 removes it, and the Spire stays Orla's floors.
10. #452 has 4 abilities. #455 has 7 lessons.
11. In #452, Stone Break and Tide Ride gate the grove and the pool. In #455, any Stone or Tide partner can still enter them.
12. The route numbering differs, and #452's Spire Steps route does not exist in #455.
13. #452's Victory cave asks for 4 abilities, while #455's Trialstair asks for all 7 lessons.

## What changed in #455 from `bf4c7f1e` to `66647dc9`

The places, links, gates and Legend sites did not change, so the schematic's map is the same and only its source line moved to `66647dc9`. The two later commits change heights and the cave brief, and `style-notes.md` now follows them:

- Walking pixels follow the locked curve. Take px = round(metres × 12.35). At 24 or under, the height is px with a floor of 12. Above 24, it is 24 + 8 × log2(px / 24), rounded and capped at 32. The four Legends at 2.0 m walk at 24px, and Meadowmantle at 2.66 m walks at 28px. Tier T3 does not use the curve: it draws about metres × 12.35, clamped to 10–48px.
- Tidewyrm (15px) follows indoors. A creature taller than the door may crawl in only when its crawl pose is 12px tall or less and at least twice as long as it is tall, which today is Deeptide only.
- No mount enters Knothollow, because its ceiling is 32px.
- One darker shade, `#2a2e38`, is allowed inside a cave mouth past the first walkable tile, never as a floor. The Larkburrow arch is drawn in the ink with that shade inside. The cave palette is counted at 24 colours, or 25 with the mouth shade.
- Rideable water also needs four inside corners for bays and channel bends.

## Sources

- PR #455 at `66647dc9`: the world design (places, links, gates, the Legend table, door and mount rules, the cave palette, the Moon Pool lip, and the locked v3 scale and walking-pixel curve in `docs/art/wildbond-art-direction.md`).
- PR #452 on `main`: the older reference, used only to list the conflicts above.
- `docs/art/README.md`: the house art rules.
