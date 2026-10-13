# Wildbond: art direction

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
5. **Real sizes.** One tile is about one metre. The tamer is about 1.5 tiles tall. A cottage is 4 x 3 tiles (its
   walls are about 2 m high, with a steep roof above). Maren's barn is 4 x 5 tiles, a head taller than the cottages.
   main.gd already gives every building a footprint (`buildings()`). Keep pictures and footprints the same size, so a
   3D version can stand the same buildings on the same ground (and so nobody walks on a roof).
6. **A palette, not loose colours.** Every colour comes from the named ramps below, which are kept in
   `wildbond-godot/tools/paint_tiles.gd`. A new material gets a new ramp of three to five shades, recorded here.

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
- **Cottage** (4 x 3 tiles): whitewashed walls with dark timber posts, a round-topped door in the second column, two
  lit windows with green shutters, a steep slate roof in staggered rows, and a stone chimney.
- **Maren's barn** (4 x 5 tiles): red boards with white trim and a gambrel roof (steep sides, a gentler top). It has a
  hayloft door with an X brace and the big doors in the second column, one swung open.

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
   version can share data (maps, creatures, story) with this one. A first experiment, when it's time, is a 3D
   Larkhaven built from `buildings()` and the tile map. It would be a new ticket in docs/DEVELOPMENT-PATH.md, not a
   switch.

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
