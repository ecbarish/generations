# Starfall loose props (ART-SF-6)

Original code-drawn indexed pixels from the approved Starfall palette, on one sheet.
Generate with `PYTHONDONTWRITEBYTECODE=1 python tools/art/starfall_props.py`;
append `--check` to verify. Requires Pillow and the ART-SF-1 ground helper.

| Piece | Atlas rect | Canvas | Footprint tiles | Height | Solid | Known by |
|---|---|---|---|---|---|---|
| barrel | 0,0 | 16×16 | 1×1 | 1 | yes | hooped cask, highlight on the upper left |
| crate | 16,0 | 16×16 | 1×1 | 1 | yes | boarded box with a cross brace |
| firewood | 32,0 | 16×16 | 1×1 | 1 | yes | three stacked logs, cut ends toward the light |
| bunting | 48,0 | 64×16 | 4×1 | 1 | no | rope and six flags; banner, guild and lamp |
| lantern-unlit | 0,16 | 16×32 | 1×1 | 2 | yes | post, cap, dark glass |
| lantern-lit | 16,16 | 16×32 | 1×1 | 2 | yes | same post; only the glass pixels change |
| cart | 32,16 | 32×24 | 2×1 | 1.5 | yes | plank bed, two wheels, a crate, one shaft |
| plot | 0,48 | 48×48 | 3×3 | 0 | no | bare mud, four stakes, a sagging string |

`props.json` uses local top-left coordinates inside each atlas rect. Footprints are
the placement base, not the whole drawing. The lantern's lit and unlit sprites share
alpha and every pixel outside the glass. Do not paint a glow; the engine owns light.
Bunting does not block walking. The empty plot is a placement envelope: walk the mud,
and use `solid_rects` for the four stakes only. Stumps, ferns and rocks stay in ART-SF-3.

[Contact sheet](../../../../docs/art/starfall/props-contact.png) scatters the pieces on
ART-SF-1 moss and an east-west mud road, beside a 16×24 review person. It repeats each
piece at 2× with a red footprint and an ink silhouette. [Native scene](../../../../docs/art/starfall/props-scene-1x.png)
is an asset-layout preview, not an integrated game screenshot.

The PNG bytes are also stored as lowercase hex beside each PNG (`props.png.hex`,
`props-scene-1x.png.hex`). A run of palette padding is written `{0*N}` so the text
lock cannot lose those zeros. The contact sheet is that same lock split into
`props-contact.png.hex.part00`, `part01`, the first 5000 characters of `part02`,
`part02b`, then `part03` and `part04`. `--check` joins those pieces, expands the
marker, rebuilds the sheets and matches those bytes, and matches a materialized
PNG when one is present. Running the script without `--check` writes the PNG and
the single hex file.

Stacked after #134–136, #139 and #144. Merge those in order, then retarget this PR to
main. Art direction reviews before merge. SF2.6 owns integration. No game code, saves,
versions or shipped previews change here.

The claim is recorded in the README changelog, the START-HERE session log, COMMS, and DEVELOPMENT-PATH (the ART-SF-6 checkbox and a Part 4 line).
