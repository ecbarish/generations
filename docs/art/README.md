# Art direction (every game in the arcade)

**Shared asset library (Evan, 2026-10-13):** search [the library](asset-library.md) before rebuilding a resource. Its [registry](../../shared/assets/catalog.json) keeps stable asset IDs, source representations, rights/status and compatibility notes; [the browser](library.html) shows what already exists. Reuse compatible bodies, rigs, equipment and props across games, with game-specific style variants.

Started 2026-10-09 by the Art direction thread, at Evan's request: "we need a thread that develops our graphical
elements and pushes the envelope for our designs and games." **This is the one art guide for the whole arcade.** Each
game has a look sheet that follows it (below); a game never keeps a separate set of rules. Read this before drawing
anything, and before handing a drawing task to another assistant.

**Why our own art matters** (Evan, 2026-10-09): we keep raising the graphics over time, and one day we make a
first-person game in our own style. So every picture we draw is also a plan for a 3D object: the same shapes, sizes
and colours a 3D version would rebuild. Free packs are a bridge; [docs/learning/assets.md](../learning/assets.md)
covers sources, licences and sound.

## The arcade family (what every game shares)
1. **Crisp pixels at one scale.** 16-pixel tiles; the Godot games show 384 by 216 pixels, scaled up by whole numbers
   with nearest filtering. No smoothing, no blur, no anti-aliased edges inside a sprite. Mood (light, fog, weather,
   the faded colour) is added on top by the game, never painted into the sprite.
2. **Real proportions, no chibi.** A person is 16 pixels wide and about 24 tall (1 by 1.5 tiles), with legs (Evan
   rejected big-headed figures on 2026-10-08). Everything is sized against a person: a door 12 by 20, a window 6 to 8
   square, a cottage 3 to 4 tiles wide, a hall 5 to 6, a tree 2 to 3 tiles tall, a cart 2 tiles long.
3. **The footprint is the picture.** What you bump into is exactly the base drawn on the ground (a stone footing, a
   trunk, a fence line), and each object's footprint and height in tiles is written down in data beside the picture.
   That is what lets a 3D or first-person version rebuild the same place (VISION.md V10, Wildbond's WB-M7).
4. **Built from simple shapes.** Boxes, prisms (roofs), cylinders (towers, wells, trunks), cones (pines). A shape you
   could extrude reads clearly at 16 pixels and carries over to 3D.
5. **One outline, one light.** A one-pixel outline in the game's *ink* (a warm near-black, never pure black) around
   objects and people; light from the upper left, so each material has a light, a middle and a dark value and the
   shadow side is the lower right.
6. **Each game has its own palette** of at most about 32 colours, saved as a `.gpl` file (opens in Aseprite,
   LibreSprite, Pixelorama, GIMP, Krita), with three values per material. Games share only the ink (`#1e1a22`, Wildbond's
   figures.gd `OUTLINE`) and the lamplight (`#f2d080`), so outlines and lit windows feel like the same arcade.
7. **Every building is known by its silhouette.** Chimney and glow for a smithy, a tower for a watch, a porch and a
   hanging sign for a tavern, a banner for the guild. If two buildings could swap places unnoticed, one is wrong.
8. **People and creatures are ours,** drawn from parts in code (`figures.gd`), and feelings show as bubbles over heads.
9. **Gentle motion.** Walks of four frames; the world moves a little (smoke, flags, water glints, leaves), never busily.
10. **Readable first.** Text and anything you can use must stand out from the ground (the faded world included); look
    at a real screenshot as a first-time player before calling a piece finished.

## How a piece of art is made and accepted
- **Spec first.** Every drawing task names: what it is, its size in pixels and its footprint in tiles, the palette
  file, the files to produce, and a reference (a look sheet or a mock-up). The template is below.
- **Art as files or as code.** A PNG drawn in an editor, or a small script that draws it (Python with Pillow, in
  `tools/art/`), which any assistant can rerun and adjust. Either way: indexed colours from the palette only, no
  anti-aliasing, transparent background, PNG.
- **Accepted by a side-by-side check.** The pull request shows the piece next to a person and next to its neighbours,
  in a real screenshot of the game when it's wired in. Reviewed in this thread (Art direction) before merge.
- **Credit** anything not ours in CREDITS.md; AI-generated art is allowed and credited the same way.

**Drawing task template** (copy into QUEUE.md or ROADMAP.md):
```
ART-<game>-<n>: <what> (<size in px>, footprint <w x h tiles>, height <tiles>)
Look: docs/art/<game>.md, palette docs/art/<game>/palette.gpl, reference <image>.
Make: <file names> in <folder>; transparent PNG, palette colours only, 1 px ink outline, light from upper left.
States/frames: <lit and unlit, open and shut, seasons...>.
Footprint data: <where the tiles-and-height entry goes>.
Done when: a contact sheet beside a 16x24 person and the neighbouring pieces; reviewed by the Art direction thread.
```

## Look sheets (one per game)
| Game | Sheet | In a line |
|---|---|---|
| Wildbond (Godot) | [wildbond-art-direction.md](wildbond-art-direction.md) (by the Wildbond builder; its palette lives in `wildbond-godot/tools/paint_tiles.gd`, keep the two in step) | A storybook valley that lost its colour and is getting it back: deep cool greens, whitewashed cottages, slate-blue roofs, a red barn |
| Starfall village (Godot) | [starfall.md](starfall.md) | A log-walled frontier town in pine forest: cooler and darker, timber and stone, lamplight at night |
| Realmbound (browser) | not yet | Classic high-fantasy roads and towns; its own sheet comes when it moves into the game window |
| Diamond Career (browser) | not yet | Ballparks under lights; its own sheet with the sports framework |
| Otherworld (browser) | not yet | Each life a different world; a sheet per world |

When a game gets new art, its sheet comes first, then the drawing tasks, then the pieces.

## Design-language portfolio

[The Wildbond creature design journal](portfolio/index.html) records early studies, alternatives and current payoff directions, alongside the three-life-stage proposal. Every image carries source/provenance links and approval scope. Add real revisions as we develop them; do not replace the record with only the newest picture.
