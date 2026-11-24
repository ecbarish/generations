# Saltmarsh Coast Chart — art spec (chunk 3)

Game Art Director, 24 November 2026, America/New_York. Drawn against `ecbarish/generations` at the Saltmarsh #675 head `b2056c7ec1739a7dfd6a4fe186df89ae01654f6e` (`cursor/saltmarsh-seasons-7245`), with `docs/art/README.md` and `docs/saltmarsh-lighting.md` as the house rules.

This is final pixel art, made in Python with Pillow, not a prompt sheet. Nothing here has been pushed, pulled, or wired in.

## Source layout (no placeholder PR)

Cloud agent `bc-b4fc5cd5`'s placeholder-strip pull and branch were not on the repository when this was drawn. A search of open and recently created pulls, and of every remote branch name, found no `placeholder-strip`, `coast-chart`, or `bc-b4fc5cd5` hook. The art is therefore sized to the **current** office, not to a future hook.

Current harbour (from `games/saltmarsh-shipping/style.css` and `harbour.js`):

- `.harbour-wrap` is full office width, with a negative side margin so the canvas is edge to edge.
- Canvas heights: 320px default; 240px at `min-width: 900px` (the later of two desktop rules); 300px at `max-width: 899px` and `min-height: 500px`; 180px at `max-width: 420px` and `max-height: 640px`; 128px at `max-height: 430px`; **48px** at `max-width: 400px` and `max-height: 600px`.
- Office column is `max-width: 60rem` (960px) at the desk. At 320px the harbour is 320px wide.
- Towers today are 3px posts at `x = w * (0.42 + i * 0.1)` for Pier, Headland, Reed, and Quay. A house lamp at `w * 0.72` is not a lighthouse.
- The existing `.chart` in the desk is Hollis's fleet chart. It is not this strip. Do not reuse that node.

Proposed hook, for the wiring pull, when one exists:

- Put a `.coast-chart` band **above** `#harbour`, inside `.harbour-wrap` (or immediately above it).
- Seven stop slots, `data-stop` of `pier`, `headland`, `reed`, `quay`, `voyage`, `frost`, `glass`.
- Icons from the sheet; **labels and progress are HTML**, not pixels, so they can change (for example `Quay: 11/16 barks`).
- Do not bake numbers into the PNGs.
- The band must not introduce page sideways scroll (`scrollTo(500)` still leaves `scrollX` at 0).

## House rules followed

- 16px tile grid. The 384×216 compositions are the house viewport, used here as the harbour target look, not as the live canvas size.
- 1px outline in house ink `#1e1a22` (the current office uses `#23394c` as UI ink; both stay in the palette).
- House lamplight `#f2d080`. Light from the upper left; lower right is the shade.
- At most 32 colours per game. This set is **18**.
- Simple shapes (boxes, prisms, cylinders). Real proportions. A 16×24 person is included for scale.
- Gentle four-frame motion. No anti-aliasing. Transparent backgrounds. Binary alpha (0 or 255).
- The current office is flat placeholder art with no outline. This pack is the final drawing, so the outline and the three-value materials start here.

## Palette (18 colours)

Nine colours already live in the office CSS and `harbour.js`. Nine are new, so materials can have a light, a mid, and a dark, and so the house ink can be used.

`#f3efe4` appears only as a CSS fallback on `--paper` in `style.css`. It is **not** in this palette and should be dropped when the office is wired, or the game would sit at 19.

| Hex | Key | Role | Source |
| --- | --- | --- | --- |
| `#1e1a22` | ink | 1px outlines | new (house ink) |
| `#23394c` | water | Deep water, night, current UI ink, deep shade | existing |
| `#3a5568` | water_m | Wave face, wet stone, glass shade | new |
| `#9cbecb` | sky | Day sky, sail shade, frost shadow, water highlight | existing |
| `#d4e5e4` | mist | Sea mist, sails, ice, glass light | existing |
| `#e7f0ef` | paper | Page, chart ground, snow mid | existing |
| `#f4faf8` | panel | Cards, snow light, sail light, foam, shine | existing |
| `#c8c5a0` | sand | Beach, pale stone | existing |
| `#9a956e` | sand_d | Beach shade, stone mid | new |
| `#b59a68` | timber_l | Lit timber, upper-left faces | new |
| `#8d7a52` | timber | Timber mid (sheds, pier, quay, pressed buttons) | existing |
| `#6e5840` | hull | Hull mid, timber shade, quiet text | existing |
| `#4a3828` | hull_d | Hull and timber deep shade | new |
| `#f2d080` | lamp | Lamplight, current glow, flags, stern light | existing (house) |
| `#c4924a` | lamp_d | Lamp shade, warm ember | new |
| `#8a9a6a` | reed_l | Sunlit reed | new |
| `#6b7a54` | reed | Reed mid, headland grass | new |
| `#4a5640` | reed_d | Reed shade | new |

Year two does not add colours. Winter is the same set: snow is `panel` / `paper` / `mist`, ice is `mist` / `sky` / `panel`, the Glass lantern uses `mist` and `water_m`, and the winter sky is a paler band of `sky` over `mist`.

The `.gpl` is in `palette.gpl` and again at `assets/palette.gpl`, which is where it would sit under `games/saltmarsh-shipping/assets/`.

## Coast Chart strip

Seven stops, in order: **Pier, Headland, Reed, Quay, the last voyage, Frost Lane, the Glass Lighthouse**. Year two's stops stay on the strip in year one, locked, so the mid-game coast is one chart.

### Dimensions

| Piece | Size | Notes |
| --- | --- | --- |
| Art band | 32px tall (2 tiles), full harbour width | Background PNGs at 320, 384, and 960, plus a 16×32 tileable centre |
| Caption row | 16px under the art, HTML | Short name at 320; full name plus progress at the desk |
| Default strip | **48px** tall (32 art + 16 caption) | Portrait phones and the desk |
| Compact strip | **32px** art only | When the harbour canvas is 128px or 48px (`max-height: 430px`, and 390×600 / 320×480) |
| Stop icon | **24×24** canonical | 4px margin so the current glow stays inside the cell. `stops-32.png` is the same drawing, centred in a 32×32 cell, for looser desk spacing |
| Cell at 320 | 44px wide (7 × 44 = 308, 6px side pad) | Icons centred; short labels: Pier, Head, Reed, Quay, Voyage, Frost, Glass |
| Cell at 960 | about 132px wide (16px side pad) | Full labels, for example `Quay` + `11/16` |
| Connector | 16×8 | Locked (dashed `water_m`), current (`lamp`), done (`timber`), plus a dot |

The strip must read at 320px and at desk width. The 320 and 960 mocks in `previews/` are the layout check. Seven 24px icons plus connectors fit at 320 without horizontal scrolling. At 320 the progress line is one current-stop sentence in HTML beside or under the band (the 16px caption holds only the short name). At the desk, each slot can carry `Quay: 11/16 barks`.

### States

Built from one lit drawing per stop, then recast:

- **Locked** — lamp and highlight mapped down to `sand_d` / `hull` / `mist`. No glow. Year-two stops look like this in year one.
- **Current** — a 1px hard glow of `#f2d080`, with `#c4924a` on the diagonals, around the silhouette. No alpha, no new colours, and the glow is clipped to the 24×24 cell.
- **Done** — the lit lantern (or the bright Frost sign) with no halo.

Silhouettes, so they do not swap by accident:

- Pier: short timber tower on a plank pier with piles.
- Headland: stone tower on a jagged rock.
- Reed: slender tower, reed clumps on a sand footing.
- Quay: tallest, banded stone, a gallery under the lantern, a wide quay block.
- Voyage: a tiny three-masted bark, bow to the right, stern lamp aft.
- Frost Lane: a timber marker and a snowy lane, not a lighthouse.
- Glass: a wider glazed lantern with a pane cross and a pale cap.

### Suggested progress copy (HTML, not in the PNG)

Drawn from the live model at this head. The last voyage is four preparations, not eight.

| Stop | Typical requirement |
| --- | --- |
| Pier | Routes 1, then Raise / Light / Lit |
| Headland | Routes 2, then Raise / Light / Lit |
| Reed | Routes 3, then Raise / Light / Lit |
| Quay | `Quay: 11/16 barks` (sixteen barks light the house lamp and open the quay light), then Raise / Light / Lit |
| Voyage | `Voyage: 2/4 packed`, then Home |
| Frost Lane | Visible in year two once harbour regard is at least 1; `0/1` signed |
| Glass | Raise / Light / Lit (lifts the winter storm) |

## Harbour towers

Five towers: Pier, Headland, Reed, Quay, and Glass (year two). Each has **unlit** (stage 1, tower up) and **lit** (stage 2, burning). Stage 0 draws nothing, as today.

| Sheet | Cell | When to use |
| --- | --- | --- |
| `towers-16x48.png` | 16×48 (1 × 3 tiles) | Default, 180px and taller harbours |
| `towers-16x32.png` | 16×32 (1 × 2 tiles) | Short harbours (128px and 48px) |
| `towers-16x48-year2.png` / `towers-16x32-year2.png` | same | Snow caps and snow on the Pier and Quay footings |

Columns are Pier, Headland, Reed, Quay, Glass. Row 0 is unlit, row 1 is lit. Frames are in `assets/harbour/manifest.json`.

Lit versus unlit, inside the palette only:

- Unlit lantern is `#23394c` with a `#3a5568` upper-left edge.
- Lit lantern is `#f2d080`, highlight `#f4faf8`, shade `#c4924a`, plus a few hard `#f2d080` glow pixels outside the pane, still inside the 16px cell.
- Glass keeps a pane cross in `mist` / `water_m` in both states.

Place them on the live canvas at the current fractions, and add Glass at **0.85**:

`pier 0.42, headland 0.52, reed 0.62, quay 0.72, glass 0.85`

The base (bottom 8–16px) is the footprint and should sit on the waterline.

## Bark

A three-masted bark, **48×32** (3 × 2 tiles), four frames at 8 fps.

- Sheet `bark-48x32.png`: row 0 leaving (bow to the right, seaward), row 1 coming home (the same frames, flipped).
- Individual frames: `bark-leaving-0.png` … `bark-home-3.png`.
- Frames bob 1px and flutter the sails 1px. Reduced motion holds frame 0 at the berth.
- The stern lamp (`#f2d080`) sits **aft**, opposite the bow.
- Wake is two or three `panel` / `mist` pixels, no extra colours.

### Motion path

The current skiff already goes out and back with `sin(trip * PI) * w * 0.45` from `w * 0.22`. The bark should do a real voyage, not that same hop.

1. Berth on the quay, about `x = 0.22w`, waterline just under the hull (y ≈ 20 in the 32px cell, plus the lane).
2. Leave, bow right, along a shallow waterline toward the active lighthouse (`0.42w`–`0.72w`, or Glass at `0.85w`). About 2–3 seconds.
3. A short pause under that light.
4. Come home, bow left, 2–3 seconds, back to the berth.

`previews/bark-preview.gif` (and the copy at the pack root) shows that path on a 384×64 water strip. The GIF is quantised for preview only; wire the PNG frames.

## Year-two harbour

Same palette. The scene, not new paints:

- Sky: a pale cold day, `sky` above a `mist` horizon, with sparse `panel` flakes. Not a night sky.
- Water: the same deep `#23394c`, with `mist` glints and a few `panel` ice chips.
- Sand: a `paper` / `panel` snow edge on the wet line.
- Office and sheds: snow caps (`office-48x32-year2.png`, `shed-24x24-year2.png`).
- Quay: a `panel` highlight on the plank.
- Towers: the year-two sheets, snow on the caps and on the Pier and Quay bases.
- Glass Lighthouse stands at `0.85w` once it has been raised.
- Frost Lane is a chart stop, not a sixth tower in the water.

Layer strips at 384 wide (`layer-sky-384-year2.png`, `layer-water-384-year2.png`, `layer-sand-384-year2.png`) are for the canvas to blit under the boats, so the fleet can keep moving. The composed `previews/harbour-year2-*.png` files are the target look, not a single flat background to drop in over the live harbour.

## File layout

As it would sit under `games/saltmarsh-shipping/assets/`:

```
assets/
  palette.gpl
  coast-chart/     stops, strip backgrounds, connectors, manifest
  harbour/         towers, bark, office, shed, person, sky/water/sand layers, manifest
```

Also in this pack, not for the game folder:

- `spec.md` (this file), `audit.md`, `palette.gpl`, `palette.json`
- `contact-sheet.png` — every production piece, the 16×24 person, the 320 and desk strips, and the year-one / year-two harbours
- `bark-preview.gif` — motion preview
- `previews/` — the same sheet, the GIF, strip mocks, and harbour compositions at 320, 384, and 960
- `_src/make_coastchart.py` — rerun to rebuild everything

There is no prompt sheet. Every PNG was drawn by the script.

## Wiring blockers

1. **No placeholder-strip PR or branch.** Sizes and hooks above are a proposal against the current harbour. If that pull lands with different cell sizes, the generator can be rerun; do not stretch these pixels.
2. The live harbour is a CSS-pixel canvas of varying height, not a 384×216 viewport. Blit sprites with nearest-neighbour scaling only, in whole-number scales when possible. Prefer the 16×32 tower sheet once the canvas is 128px or 48px, and drop the caption row on the strip at those heights so the chart still fits.
3. Labels and progress must be HTML in the office type (Georgia, readable, contrast at least 4.5:1 against the chart paper). The pixel captions on the mocks are only for the contact sheet.
4. Keep the existing UI colours. Adding house ink `#1e1a22` for sprite outlines is already in the 18. Do not introduce `#f3efe4` into new CSS.
5. Year-two Glass at `0.85w` is new. The four year-one lights keep their current fractions.
6. This pack is art only. It does not edit the game, open a pull, or change a save.

## Audit

See `audit.md`. Production assets under `assets/`: **18 / 18** palette colours used, **0** off-palette pixels, **0** non-binary alpha, sheet sizes and 8px alignment **PASS**. Previews and the contact sheet also stay inside the 18. Verdict: **PASS**.
