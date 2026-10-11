# Starfall shops and civic assets (ART-SF-5)

Original code-drawn, transparent indexed PNGs from the approved Starfall palette.
Generate with `PYTHONDONTWRITEBYTECODE=1 python tools/art/starfall_civic.py`;
append `--check` to verify. Requires Pillow and ART-SF-1–4 helper scripts.

| Asset | Canvas px | Placement footprint tiles | Height tiles | Recognition |
|---|---|---|---|---|
| smithy.png | 64×56 | 4×2 | 3 | stone, open forge, tall chimney, outside anvil |
| apothecary.png | 32×56 | 2×2 | 3 | steep narrow roof, hanging herbs, bottle window |
| healer.png | 48×48 | 3×2 | 2.5 | low roof, light cloth over door, bench, herb bed |
| tavern.png | 64×56 | 4×2 | 3 | covered porch with posts, barrels, tankard sign |
| well.png | 32×32 | 2×1 | 1.5 | round stone cylinder, timber frame, suspended bucket |
| board.png | 32×32 | 2×1 | 2 | shake roof, notices, two supporting posts |
| yard.png | 64×48 | 4×3 | 1.5 | rope fence, straw dummy, weapon rack, open entry |

`civic.json` uses local top-left coordinates. Building footprints cover the drawn stone
bases. Doors are 12×20 including outlines. The smithy has an open working front rather
than a door. World height is independent of canvas height. Roofs are weathered wooden
shakes. Only the smithy's walls are stone; the other shops are logs.

The well and board footprint rectangles are placement envelopes. The well's round base
should use its alpha shape for collision; the board has explicit post `solid_rects`.
The training yard is walkable: `solid: false` prevents treating it as an opaque block;
its explicit solid rectangles cover posts/dummy/rack and its fence segments leave the
18×8 southern entry clear. SF2.6 owns collision, depth ordering and interaction wiring.

The forge flame is part of the smithy sprite; breathing light is added by the engine.
Smoke is not baked into art: `smoke_anchor` identifies the chimney emitter position.
No fog, night tint, illumination halo or cast shadow is painted into any piece.

[Contact sheet](../../../../docs/art/starfall/civic-contact.png) places each shop beside
a 16×24 review person on frontier ground with pines. It shows all seven at native scale,
red footprint overlays separately from assets, and an ink-only silhouette row.
[Native scene](../../../../docs/art/starfall/civic-scene-1x.png) is an asset-layout
preview, not an integrated game screenshot. Original code and metadata are the source.

Checks verify indexed palette and binary transparency, exact canvas sizes and footprint
bounds, doors, four distinct building silhouettes, chimney/steep roof, a clear yard
entry, solid bounds and byte-for-byte PNG/JSON reproduction. Earlier art checks remain
unchanged. Review in the Art direction thread before merge.

Stacked after #134–136 and #139; merge those in order, then retarget #144 to main.
No game code, saves, versions or shipped previews change here.
