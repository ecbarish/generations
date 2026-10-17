# Wildbond: art direction

## Creature direction update — Evan, 2026-10-17

All existing and future creatures should read as expressive anime monster characters, drawing on Pokemon
Generations 1-4: memorable silhouettes, exaggerated proportions, signature anatomy and visible personality.
Preserve the selected Bogsnap design and existing species/evolution identities. Apply the same character
across the Game Boy-to-modern presentation progression. [Creature vision and starter concepts](creature-vision/README.md)
define the rollout and distinguish concept illustrations from production sprite/animation requirements.
This direction supersedes ordinary-animal styling; it does not waive game-size, framing or palette checks.


Started 2026-10-09, after Evan chose **"Our own tiles"** for Wildbond. Evan, the same day: *"it's important we do our
own art because the goal is to push the graphics over time further and further. And I want eventually to be able to
have a first person game that resembles the assets we've used. So the more we design and set ourselves up right, the
more we can understand the art direction and future."*

This page is the art direction for every Wildbond picture: the pixel version today and any 3D or first-person version
later. Read it before you draw anything for Wildbond. Change it when the direction changes, and say why.

## 1. The feel in one line

**A storybook valley that lost its colour and is getting it back.** It should feel old-souled and handmade. The
greens are deep and cool, the stone and timber are warm, the roofs are slate blue, and the barns are red. It should
never look candy-bright. The faded world is the game's premise, so every colour also has to read well washed out
(the fade shader turns it to soft sepia-grey).

## 2. Rules that hold in 2D and in 3D

1. **Everything is ours.** People, creatures, buildings, plants and ground are drawn by our own code or by hand for
   Wildbond. No pack art in new work. The Ninja Adventure pack keeps Starfall's look, so the two games stop looking alike.
2. **Shapes before detail.** Each object is a few big, readable shapes: a crown, a trunk, a roof, a wall. Detail sits
   inside those shapes. This is also what lets an object be rebuilt as a 3D model: the same shapes become the same
   meshes.
3. **One outline.** Figures and standing objects have a dark outline (`#1e1a22`, figures.gd `OUTLINE`). Ground has
   none, and soft plants (tall grass) get a dark leaf edge instead. In 3D, this becomes an ink-line or toon shader with
   the same colour.
4. **Light from the top left.** Light at the top left, the darkest shade at the bottom right. A 3D sun goes in the
   same place.
5. **Real sizes.** The locked numbers are in **Scale (locked v3)** below. A tile is 16px, about 1.30 m at 12.35px
   per metre. The tamer is about 12×21. A cottage is 64×64 (4×4 tiles) with a 12×24 door. Maren's barn is 64×80 with
   16×26 doors. The door line is 24px, not 25. `buildings()` in `main.gd` (line 1893) still records the older 4×3
   cottage until a paint pass adopts this scale. Pictures and footprints stay the same size, so a 3D version can
   stand the same buildings on the same ground.
6. **A palette, not loose colours.** Every colour comes from the named ramps below, which are kept in
   `wildbond-godot/tools/paint_tiles.gd`. A new material gets a new ramp of three to five shades, recorded here.
   The house cap is about 32 colours per palette (`docs/art/README.md` rule 6). A new place that needs its own
   shades gets its own palette, not more colours on the world set.

## Scale (locked v3)

Evan approved this overworld scale on 2026-10-13. It replaces the older "one tile is one metre" and "cottage 4×3"
notes wherever they disagree. The painter has not caught up yet: `_cottage` in `paint_tiles.gd` (line 250) is still
64×48, and the barn doors in `_barn` (around line 319) are still about 16×18. Those cells change in a later paint
pass. Until then, new briefs cite this section, not the old pixels.

| Thing | Locked size | In metres, at 12.35px per metre |
|---|---|---|
| Tile | 16×16 px | about 1.30 m |
| Tamer | about 12×21 px (`figures.gd` line 50) | about 1.70 m tall |
| Door line | 24 px tall. Not 25 | about 1.94 m, which is the 2.0 m door rounded to 1.5 tiles |
| Cottage | 64×64 px, 4×4 tiles, door 12×24 | the opening is one tile and a half tall |
| Maren's barn | 64×80 px, doors 16×26 | the footprint is already 4×5 tiles in `buildings()` |
| Bell house | door 12×24, on the 5×3 footprint `buildings()` already gives Hollowecho | |
| Meeting hall | double doors 24×24, on the 8×3 footprint at Sunthread | a 24px-tall creature can pass without turning sideways |
| Lookout | door 12×24 | |
| Boathouse | door 20×24 | wider than a cottage, still on the 24px line |

Anything taller than the 24px door line waits outside. A creature at 24px or under follows the tamer indoors. A
creature taller than the door may crawl in only when the crawl pose is 12px tall or less and at least twice as long
as it is tall. Today that is Deeptide, and only in that pose. Standing, Deeptide waits outside.

Overworld creatures in the pixel tiers run from a 12px floor to a 32px cap. Walking pixels use this rule. Take
px = round(metres × 12.35). If px is 24 or less, the walking height is px, and anything under 12 is raised to 12.
If px is over 24, the walking height is 24 + 8 × log2(px / 24), rounded, and capped at 32.

The four Legends at 2.0 m go through the curve and come out at 24px. px = round(2.0 × 12.35) = 25, which is above
24, so px = min(32, round(24 + 8 × log2(25 / 24))) = 24. A plain rounding of 24.7 would have left them at 25.
Meadowmantle at 2.66 m is the tall worked case.
2.66 × 12.35 is 32.851, which rounds to 33. The curve is 24 + 8 × log2(33 / 24). log2(33 / 24) is about 0.459,
times 8 is about 3.68, and 27.68 rounds to 28. Meadowmantle is 28px. Holding 33 down to a cap of 32 would have
left it at 32.

`figures.gd` `drawn_px` follows this rule. At 24 or under it keeps round(metres × 12.35), with a 12px floor.
Above 24 it uses the curve and the 32px cap. The rows below are the walking heights the curve
produces.

The pixel table is a view of the metres. In 3D the door is the 2.0 m door, and creatures use their true heights in
metres, not these compressed pixels. Mistfinch is 0.24 m, Elderhorn is 3.64 m, and the tamer is 1.70 m. Tier T3
draws a creature at about metres times 12.35, clamped to 10–48px. The 24px door line is the 2.0 m door rounded for
pixels: 2.0 times 12.35 is 24.7, drawn as 24.

Overworld height is 12px for every species in the locked table, except the rows below. 113 of the 189 catalogue
species match a row in that table. The other 76 have no locked height yet, and they wait for one. Three names in
the table are retired in the current save (`RETIRED_FORMS` in `main.gd`, line 3588): Deeptide is stored as
Tidewyrm, Pyremane as Blazefang, and Elderthorn as Thornback. Tidewyrm itself is 15px and follows indoors. The
retired heights stay on the table so an old picture is not drawn through a door it cannot use.

| Height | Species in the locked table |
|---|---|
| 13px | Sunfrill, Cloudharrier, Boughchorus |
| 15px | Tidewyrm, Shoalcrest, Ferrycrest, Fogsail, Rainback, Gorgebelly |
| 16px | Bramblestag |
| 17px | Stormfrill |
| 18px | Thornback, Kilntusk |
| 19px | Blazefang, Soundhowl, Briarwatch, Rilllynx, Hearthlaugh, Ridgewarden, Laughrill, Mistlynx, Sunlynx |
| 20px | Fordfoal |
| 24px | Bloomcourser, Lanterncrest, Stillwake, Watchlight, Veilmote |
| 26px | Deeptide, Elderthorn. Deeptide may crawl indoors only when that pose is 12px tall or less and at least twice as long as it is tall |
| 28px | Meadowmantle, Breakwatermane, Undertone |
| 30px | Pyremane |
| 31px | Elderhorn, Hearthcrown |

Current sprite heights, not part of the locked table (`run_tests.gd` line 203): Riverwisp 14px, Thicketboar 15px,
Smoulderpup 16px. A later update of the locked table may add them. Until then they are not a rule for doors.

The eight from 26px to 31px are the mounts. They wait outside on foot, except Deeptide in the crawl pose above.
Lanterncrest, Stillwake, Watchlight and Veilmote are 24px, so they may follow through a 24px door with no headroom
left. Tidewyrm is 15px and follows indoors.

## 3. The palette (part 1)

| Ramp | Shades, dark to light | Used for |
|---|---|---|
| Grass | `#4f8a50` `#5c9a5a` `#6aa862` `#7cb86c` | Meadow ground, clover, blade tips |
| Path | `#a8875a` `#bb9a6a` `#ccad7c` `#dcc092` | Packed earth, flat stones |
| Sand | `#d2b886` `#e0c896` `#ead6a8` | Beaches |
| Leaf | `#24503e` `#2f6a4a` `#3f8558` `#5ea26a` `#8ccf7e` | Broadleaf crowns, bushes, tall grass roots |
| Pine | `#1f4a44` `#2a5e54` `#37766a` `#4f9480` | Valley pines |
| Bark | `#4a3426` `#6a4a32` `#8a6444` | Trunks, timbers, doors |
| Slate | `#33465e` `#435a78` `#56708f` `#7290ad` | Cottage roofs |
| Whitewash | `#cfc4ac` `#e6dcc6` `#f4eddc` | Cottage walls, barn trim |
| Water | `#2f5f7e` `#3a7090` `#4a84a2` `#8cc0d4` | Ponds, rivers and the sea; the darkest is the bank's edge |
| Barn red | `#6e2620` `#8e342c` `#ab463a` `#c45e4e` | Maren's barn |
| Lamplight | `#f2d080` | Windows at any hour |

## 4. Objects so far (part 1)

Each object is listed with its shapes, so the same thing can be redrawn bigger or modelled in 3D.

- **Broadleaf tree** (2 x 2 tiles): a short trunk with a flared foot, a big round crown, and five smaller rounded
  clusters on top catching the light.
- **Valley pine** (2 x 2 tiles): three stacked tiers of dark teal, narrowing upward, on a short trunk. Trees alternate
  broadleaf and pine along a treeline.
- **Bush** (1 tile): a low round crown; one kind has red berries.
- **Tall grass** (1 tile, drawn twice and swaying): a clump of long blades, dark at the root and pale at the tip.
- **Flowers** (1 tile): a leafy clump with three blooms. There are bluebells, poppies and daisies.
- **Path**: packed earth, with a flat stone pressed in now and then, and grass curling over the edges.
- **Cottage** (4 x 4 tiles, 64×64, door 12×24): whitewashed walls with dark timber posts, a round-topped door in the
  second column, two lit windows with green shutters, a steep slate roof in staggered rows, and a stone chimney.
  The painted cell is still the older 64×48 cottage until the v3 paint pass.
- **Maren's barn** (64×80): red boards with white trim and a gambrel roof (steep sides, a gentler top). It has a
  hayloft door with an X brace and the big doors, 16×26, in the second column, one swung open. The painted doors
  are still the shorter pair until that same pass.

## 5. What is still borrowed (and the order to replace it)

- **Part 2:** water is done (2026-10-09: still water, a glint and a lily pad on the Water ramp). Still to do: the battle backdrops, the remaining hand-drawn halls
  (the bell house, Sunthread's hall, the lookout, the boathouse and the league courts are already ours but should use
  these ramps), and the interiors.
- **Part 3:** the battle effect sprites, the emotes (the "!" over a trainer) and the sound effects and music. Sound
  isn't art direction, but it is the same "make it ours" job.
- Starfall keeps the pack for now. If Starfall gets its own look later, it should differ from this one on purpose
  (warmer, busier, a guild town).

## 6. Towards 3D and first person

The steps that keep that door open, in order of value:

1. **Footprints match the pictures** (done for buildings, 2026-10-09: `buildings()` in main.gd).
2. **Objects are made of parts with sizes** (sections 2 and 4). The code that paints a cottage already builds it from
   walls, posts, a door, windows, a roof and a chimney. A 3D builder would use the same list.
3. **One palette file** (section 3). A 3D material per ramp, with a toon shader using the same light direction and
   outline colour, keeps a 3D Wildbond recognisably the same game.
4. **Godot can do both.** The game is already in Godot 4, which has a full 3D engine, so a first-person or 3D
   version can share data (maps, creatures, story) with this one. How the world stays independent of the picture,
   and what each step costs, is in `docs/plans/wildbond-world-design.md`, section 9. A first experiment, when it's
   time, is a 3D Larkhaven built from `buildings()` and the tile map. It would be a new ticket in
   docs/DEVELOPMENT-PATH.md, not a switch.

## 7. How to change the art

`wildbond-godot/tools/paint_tiles.gd` paints `wildbond-godot/assets/env/wild/` (floor.png, nature.png, house.png,
water.png).
Change a colour or a shape there, run it, and then look at the result in the game:

```
godot --headless --path wildbond-godot -s tools/paint_tiles.gd
```

A hand-drawn replacement for any cell is welcome too: draw it into the PNG at the same cell, and note here that the
cell is hand-drawn (so a later run of the painter doesn't overwrite it; move that object's code out of the painter).

## 8. Evaluation backlog: creature sprite tools (Evan, 2026-10-13)

**Candidate only; no production dependency approved.** Evan wants to keep
[Sprite Sheet Creator](https://github.com/chelinho139/sprite-sheet-creator), a fork of
[blendi-remade/sprite-sheet-creator](https://github.com/blendi-remade/sprite-sheet-creator), worth checking out
for playable Wildbond creatures. Its README describes prompt/reference generation through fal.ai, four-frame
2x2 sheets, side-scroller/isometric modes, background removal, adjustable slicing/FPS and playable previews.
Those are tool claims, not evidence that our creatures will animate consistently. The isometric preset supplies
up/down/side walk and attack sheets; do not assume that covers Wildbond's required directions or asymmetric markings.

**Fit with the project:** Evan describes pixel art, painted 2D and eventual 3D as parts of Wildbond's progression.
Section 6 and wildbond-plan.md phase 7 already preserve a route toward 3D; this note does not change that direction
or schedule. Evaluate sprite tools for the early pixel-art representation, retaining silhouette, anatomy, markings,
palette and proportions across painted 2D and later 3D versions. Sprite sheets do not supply 3D meshes, rigs or
skeletal animations. Use the established art direction and approved creature reference, not a tool's default look.

**Future bounded comparison:** try one representative existing creature using the actual game's required directions
and scale: idle, walk or run, attack, hit and faint. Compare [PixelLab](https://www.pixellab.ai/) for pixel animation
and directional consistency, with [Aseprite](https://www.aseprite.org/) for cleanup and PNG/JSON export. Judge anatomy
and marking consistency across frames/directions, planted feet, seamless loops where appropriate, clean alpha,
readability at game scale, Godot import, manual cleanup time and total cost per usable asset (including retries).
Keep the approved creature identity fixed; four frames are a candidate format, not an imposed animation limit.

**Before a trial:** confirm source reuse and generated-output terms separately. The fork's GitHub metadata returned
`license: null` on 2026-10-13; public source alone does not establish reuse permission. Clarify terms before
incorporating code. Record cost and acceptance evidence before adopting any provider. Nothing was installed,
generated or purchased for this note, and broader development remains paused.
