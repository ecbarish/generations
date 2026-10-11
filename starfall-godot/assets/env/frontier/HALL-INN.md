# Guild Hall and Inn (ART-SF-4)

Original code-drawn pixel art using the approved Starfall palette. Rerun with:
`PYTHONDONTWRITEBYTECODE=1 python tools/art/starfall_hall_inn.py`.
Append `--check` to verify; Pillow and ART-SF-1 to ART-SF-3 generator helpers are required.

| Building | Canvas | Footprint in tiles | Local stone base | Height in tiles | Door |
|---|---|---|---|---|---|
| Guild Hall | 96×80 px | 6×3 | `[0,32,96,48]` | 4 | `[42,54,12,20]`, double |
| Inn | 64×80 px | 4×3 | `[0,32,64,48]` | 4.5 | `[26,54,12,20]`, single |

`hall-inn.json` records coordinates relative to the sprite's top-left, window frames and
glass, world height and state filenames. Height describes world geometry; it is not the
canvas height divided by tile size. The stone base is solid; roof, banner and sign project
above it. SF2.6 owns world placement, depth ordering, interaction and doorway handling.

`guild_hall.png` and `inn.png` are unlit. `guild_hall-lit.png` and `inn-lit.png` change
only window glass, keeping identical transparency, geometry, frames, banner and sign.
No night tint, fog, illumination halo, cast shadow or smoke is baked in; the engine adds
those. The hall uses horizontal round logs, the widest weathered shake roof and a blue
banner on a pole. The inn is narrower, has two storeys, the only upper windows and a
hanging bed sign. Five inn windows light versus four hall windows. Doors are exactly
12×20 pixels including outlines; frames are 8×8 with 6×6 glass.

[Contact sheet](../../../../docs/art/starfall/hall-inn-contact.png) shows both buildings
beside 16×24 review people, with moss, mud road, pine edge and palisade from earlier art
PRs. It includes unlit/lit states and separate red-footprint/yellow-door review overlays.
The overlays are absent from assets. [Native scene](../../../../docs/art/starfall/hall-inn-scene-1x.png)
and [lit-window scene](../../../../docs/art/starfall/hall-inn-lit-1x.png) are layout
previews, not integrated game screenshots or a night lighting demonstration.

Checks verify indexed colours and binary transparency, exact dimensions and doors,
footprint bounds and visible stone base, every window lighting, changes restricted to
glass, identical alpha and byte-for-byte PNG/JSON reproducibility.

Stacked after #134–136; merge those in order, then retarget this PR to main. Art direction
reviews before merge. No game code, saves, versions or shipped previews change here.
