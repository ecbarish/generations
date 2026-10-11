# Starfall pine edge (ART-SF-3)

Original pixel art from the approved 27-colour palette in `docs/art/starfall/palette.gpl`.
Generate: `PYTHONDONTWRITEBYTECODE=1 python tools/art/starfall_pines.py`.
Verify: append `--check`. Requires Pillow and the ART-SF-1 / ART-SF-2 generator helpers.

`pines.png` is a 96×96 indexed atlas. `pines.json` names every source rectangle and its
local footprint. Trees are 16, 32 and 48 pixels tall (one, two and three tiles), with
16, 24 and 32 pixel canvases. The bottom trunk is the collision base, not the canopy:
4×4, 6×4 and 8×4 pixels respectively. Fractional tile footprints preserve these visible
bases rather than making the whole crown solid. Stumps and rocks have small solid bases;
ferns are decorative. The last atlas row and unused cell space are transparent.

`forest_edge.png` is a transparent 128×64 horizontal repeat: overlapping conical pines
of different heights, wrapped across both sides. Place copies every 128 pixels without
padding or scaling. It is a decorative backdrop, with no rectangular collision wall.
Use the recorded individual tree placements and trunk footprints when integration needs
solid trees. Crowns can occlude objects; SF2.6 owns ordering, camera, collision and layout.
There is no painted fog, cast shadow or night illumination; those belong to the engine.

[Contact sheet](../../../../docs/art/starfall/pine-contact.png) and
[native scale scene](../../../../docs/art/starfall/pine-scene-1x.png) show three copies
behind the ART-SF-2 palisade on ART-SF-1 moss, the isolated sizes, props and a 16×24
review person. These are asset-layout previews, not integrated game screenshots.

Checks cover approved indexed colours and transparency, native dimensions, distinct
sprites, exact trunk bases, placement bounds, periodic edge composition and byte-for-byte
reproduction of PNGs and metadata. Review in the Art direction thread before merge.
This PR is stacked after #134 and #135; merge those first and retarget this PR to main.
No game code, save data, versions or shipped previews change here.
