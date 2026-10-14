# WB-C4: Larkhaven and the first route (the Thornwood Trail) at their best

Before and after pictures, rendered by the real Godot renderer (xvfb + gl_compatibility) at 1536 by 864. "Whole" pictures
zoom the camera out to show the entire map. "View" pictures are what a player sees. Each comes twice: faded (the
valley before its colour returns) and in colour (after it has; the art has to read both ways, per the art direction).

Made with `tools/audit/wildbond_place_views.gd` (the command is at its top). "Before" is main at d82363f; "after" is
this branch. Views: Larkhaven by the pen (view0) and by the barn (view1); the trail by the pond (view0) and in the east
clearing (view1). `pond-close-before-after.png` is the trail's pond, close up, in colour.

## Before

- Larkhaven: wide stretches of the same plain grass tile (the middle, around the pen, beside the cottages), and little
  village life (one sign; no gardens, no well, no lamps).
- Thornwood Trail: the pond is a hard rectangle with a cream (beach) border, so it reads like a pool, not a woodland
  pond. The east clearing is plain grass.

## After

Everything below lies flat on the ground. No layout, door, collision or map-data change; the browser game is untouched.

- **Larkhaven:** the barn's kitchen garden east of the barn (furrows, cabbages and a radish; bare earth in winter);
  a flat stone step at each cottage door; straw in the pen and under the barn door; clover, daisies, grass tufts and
  pebbles scattered over the plain grass (the same on every visit), and pebbles on the paths.
- **Thornwood Trail (and the other Thornwood ponds):** a dark muddy bank instead of a beach, bulging a little along
  each side and rounded at the corners, with reeds and cattails in the shallows and a flat stone where the clearing
  comes down to the water. Ferns and red-capped mushrooms where the trees meet the grass, and pebbles on the trail.
- Colours from the art direction's ramps (Leaf, Path, Bark, Whitewash, Barn red, Lamplight); ground details have no
  outline (rule 3); light from the top left. Drawn under the season's layer, so snow, leaves and petals still cover them.
  Faded, the details sink into the grey, as the art direction asks.
