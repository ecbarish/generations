# Wildbond creatures: catalogue, target, evolution tiers and how to add one

Evan, 2026-10-11: "Do we have a creature catalog for wildbond and a pipeline to making more or adding evolutions? Do we
have a goal for a number? I want evolutions to be exciting and rewarding ... some like Salamence or Tyranitar that feel
so cool to have versus like a Pidgey ... all fit in the same world and have differing sizes, styles and types ... a path
to improved creatures. Cobblemon as a better reference since it's closer to our style."

This page sets the rules. The list itself is generated from the game data: **[wildbond-creatures/catalog.md](wildbond-creatures/catalog.md)**
(`node tools/wildbond-catalog.cjs` rewrites it; `--check` fails if it's stale). It serves GOALS.md's Wildbond pillar 3,
"creatures with more identity", and the older plan in docs/proposals/creature-catalogue-and-evolution.md (shapes and
conditions of evolution, still valid). Looks: docs/lore/wildbond-looks.md. Art rules: docs/art/README.md.

## 1. Where we are (counted 2026-10-11 from the data)

- **112 species**, 10 families drawn as 14 body shapes, 7 elements. Every creature is drawn in code from parts
  (`wildbond-godot/scripts/figures.gd`), so a new creature is mostly data.
- **The weak spot is evolution:** of 89 lines, **74 never evolve**. Only 9 lines have two stages and 6 have three. One line
  branches (Poolkit into three lynxes). The trust and place evolutions work (`data/evolution.json`), so the system can
  do far more than the roster uses.
- **No sizes:** every creature is drawn at the same scale in battle and in the world. A big final form doesn't look big.
- **No tiers:** strength is a flat ladder (young 300, middle 420, final 510, guardians 525-544). Nothing is set apart as a
  prize to raise.
- Nine one-of-a-kind guardians (Elderhorn, Watchlight, Veilmote ...) are the legends.

## 2. The target: about 150, in about 70 lines

**150 by Wildbond 2.0**, then grow only when an area or a story needs a creature. Why 150: the original 151 is the
number fans remember as "enough to know them all"; Cobblemon and the fan games show that a well-known 150 beats a thin
400. With our parts-based drawing, 150 is affordable; more would outrun the drawing quality (section 6).

The count matters less than the shape of it. **Most new species should be new stages of creatures we already have**, so
lines grow instead of the list of loners:

| Kind of line | Lines | Species | Example (Pokémon, for the feel) |
|---|---|---|---|
| Showpiece: three stages, late and hard-won | 6 | 18 | Bagon to Salamence, Larvitar to Tyranitar |
| Three stages | 16 | 48 | Charmander to Charizard |
| Two stages | 18 | 36 | Pidgey to Pidgeotto (short and plain) |
| Branching (one young, several adults) | 3 | 12 | Eevee |
| Stays itself (stronger for it) | 16 | 16 | Tauros, Lapras |
| Legends and guardians | 10 | 10 | (ours: the nine guardians and one more) |
| **Total** | **69** | **140, plus ranch hybrids and seasonal forms ≈ 150** | |

So about 58 of today's 74 loners gain a new stage before them, after them, or both, and about 16 stay themselves on
purpose. **A new stage is its own creature**, with its own name, look and dex, the way Squirtle, Wartortle and Blastoise
each stand alone. It is not a younger or older version of the same creature. Those life stages (a baby that hatches
from an egg and grows up as the same creature) are a separate feature, WB5.5, and they don't count as evolution here.

**Most creatures evolve** (Evan, 2026-10-11: "I'd like for the majority of creatures like in Pokémon to evolve, that's
one of my favorite features"). In the original 151, about five in six belong to an evolution line; this plan gives the
same share (about 124 of 150). The ones that stay themselves are rare on purpose, each with a reason in its dex and a
strength that makes up for it. CR3 is the task that gets us there, and the biggest single gain in the plan.

## 3. Tiers: plain lines and showpiece lines

Strength is the sum of the six base stats. Each line has a tier, stored as `tier` on its species (the catalogue shows
a default until it's set):

| Tier | Final strength | Evolves | How it feels |
|---|---|---|---|
| **Plain** | 440-480 | early (12-20) | common, everywhere, friendly; a good first team that you outgrow (Pidgey) |
| **Strong** | 490-520 | mid (18-36) | most of a good team; each has a trick |
| **Showpiece** | **570** | late (**30, then 50**) | rare, slow, and the creature people talk about (Salamence, Tyranitar) |
| **Legend** | 560-600 | never | one of a kind, met through the story |

Showpiece rules, so getting one is a reward and not a lottery:
- **Rare to find, and found on purpose:** one per region, in a hidden pocket or a rare spawn (night, a season, the right
  weather), never in the opening grass. Its young form is weak and grows slowly (a `growth: "slow"` field that CR2 adds to rules.gd's XP need, about 1.25×).
- **Its last change needs more than a level:** Bonded trust, a place, a deed ("won a Warden battle together"), or a
  wild bond with you. Maren or a townsperson hints at it.
- **The change is a moment:** the screen dims, the silhouette grows in light, the new form is shown at its full size,
  and someone in the world reacts the next time you meet them. Plain lines get the simple version of this; showpieces
  get the whole thing.
- **Visibly bigger and finer:** "huge" size, the most parts (wings, crest, plates), its own idle movement, and a
  signature move only that line learns (WD3 already plans one per family).
- **Balanced by time, not power creep:** they arrive late, so the Warden pacing check (WB3.6b) still holds. Raise the
  guardians to 560-600 in the same pass so a legend stays a legend.

The six showpieces, one per element (Shade's place goes to the guardians); ChatGPT or another writer names and places
the new ones in CR2, using these as the shape of each:
1. **Stone:** a burrowing larva into an armoured hill-breaker (the Tyranitar role).
2. **Gale:** a small, grounded dragonling that dreams of flight, then a glider, then a great sky drake (the Salamence role).
3. **Tide:** today's Ripplet → Tidewyrm → Deeptide, promoted (Deeptide already needs complete trust).
4. **Ember:** today's Cindercub → Blazefang → Pyremane, promoted (Pyremane already needs Emberfall).
5. **Grove:** today's Mosshog → Thornback, given a third stage: a walking ancient grove (treefolk shape).
6. **Radiant:** a lantern moth into a crowned dawn moth (moth shape).

The three starters' lines are showpieces because the partner you start with should become the most impressive thing
you own; only Stone, Gale and Radiant need brand-new lines.

## 4. One world: fitting in while looking different

Cobblemon is the closest reference: one consistent look (simple shapes, flat colours, a readable silhouette, the same
detail level for every creature) while sizes, body plans and colours vary a lot. The same rules for us:

1. **Same hand:** every creature is drawn by `figures.gd` from parts, on the same pixel grid and outline, in the shared
   palette (docs/art/README.md). No pasted-in sprites from other styles.
2. **Silhouette first:** you should be able to tell two creatures apart in solid black. Two species of the same shape
   must differ in at least two of: head, back, tail, size (the `look` parts in docs/lore/wildbond-looks.md).
3. **Element shows in materials, not only colour:** Ember glows and smoulders, Tide is glossy with fins, Grove is moss,
   bark and leaf, Stone has plates and cracks, Gale has feathers and sails, Radiant has light and rays, Shade has ink
   and soft edges.
4. **Sizes:** five classes, drawn to scale in battle and when they walk with you (Cobblemon scales each species):
   tiny ×0.7, small ×0.85, medium ×1.0, large ×1.2, huge ×1.45. Young forms are tiny or small; a showpiece's last form is huge.
   A huge creature still fits the battle stage and stands half off its tile in the world, like Cobblemon's big ones.
5. **It belongs somewhere:** each creature has a home area, a reason to live there (food, shelter, weather), and a
   line of dex text that says how people live alongside it. Spawn tables put it there (`MAPS.*.seasonal.*.wild`).
6. **Growing up shows growth:** an evolved form keeps its young form's colours and one feature, made bigger (Cindercub's
   ruff becomes Blazefang's mane). No change of element without a reason the dex explains.
7. **Spread:** each region has at least one creature of each size class and at least four shapes in its grass. No two
   lines share both shape and element unless one is a regional or seasonal form.

## 5. How to add a creature or an evolution (any AI)

Cobblemon adds a species as a species file (stats, evolutions and their conditions), a spawn file (where, how rare,
time, weather) and a model. Ours is the same split:

1. **Claim it:** draft PR titled with the task ID (docs/PROCESS.md). Check docs/lore/wildbond-threads.md before writing
   dex text that touches the story.
2. **Data** (one place per creature):
   - New species and new evolutions go in `wildbond-godot/data/evolution.json` (`species` and `evos`), the Godot-only
     data. Don't edit the browser game for this.
   - Fields: `name`, `fam`, `el`, `col`, `base` (six stats, within the tier's strength), `learn` (moves at levels;
     existing moves first, a new move only with WD3), `dex` (one or two sentences, world's words), `size`, `tier`,
     `shape` (if not the family's), `look` (head, back, tail, pattern from the vocabulary in wildbond-looks.md).
   - Evolutions: `{ to, at, place?, bond?, with?, hint }`, special conditions first, the plain one last; `hint` is what
     Maren thinks, in plain words.
   - Spawns: add `[id, weight]` to the area's `seasonal.<season>.wild` lists (weights: common 15-25, uncommon 6-12, rare
     2-5, showpiece 1).
3. **Drawing:** if the shape and parts already exist, nothing to draw: check it in battle and in the world. If it needs
   a new part (a horn, a crest), add it to the shape's function in `figures.gd`, reusing the palette.
4. **Catalogue:** `node tools/wildbond-catalog.cjs`, and commit `docs/wildbond-creatures/catalog.md`.
5. **Checks:** `node tools/run-all-checks.cjs` (all pass). The Wildbond checks already test that every species has
   stats, moves and a drawable shape; add a check for any new evolution condition.
6. **Screenshot:** the new creature in battle and walking with you, beside one creature of the same shape, in
   `docs/screenshots/<task-id>/`. Show that the two read as different.
7. **Log:** README changelog line, START-HERE Session log, DEVELOPMENT-PATH Part 4 lesson.

## 6. The path to better creatures

1. **Sizes and tiers in data, drawn to scale** (CR1). The cheapest big change: big finals finally look big.
2. **Every creature uses its `look` parts** (WD2 drawing, open): the head, back, tail and pattern hints in the data,
   drawn. After this, no two species share a silhouette.
3. **More shapes:** fish, a drake with wings, a hopping rabbit-kind, a beetle, an owl. Each new shape opens several lines.
4. **Movement:** each shape gets its own walk and idle (birds hop and flap, serpents slither); showpieces get a
   signature idle.
5. **The evolution moment** (CR4), and rare variants with their own move (pillar 3).
6. **Later:** higher-resolution parts in the same style, the shared look carried to Little Ranch's babies, and in the
   long run the same creatures in a first-person view (Art direction's goal). Because they're built from parts and
   rules, each step improves every creature at once.

## 7. Ready-to-claim tasks

Also listed in docs/DEVELOPMENT-PATH.md under WB-C. Data and writing tasks suit ChatGPT and the outside AIs; drawing
tasks suit anyone comfortable with `figures.gd`.

- **CR1 [any]** Sizes and tiers: add `size` and `tier` to every species (start from the catalogue's defaults), and draw
  creatures at their size in battle and when following you (section 4.4). Checks: every species has both; a huge final
  is drawn larger than its young form. Screenshots of a small and a huge creature side by side.
- **CR2 [ChatGPT / writer]** The six showpiece lines (section 3): names, dex, homes, stats, moves, evolution conditions
  and hints, as data in evolution.json; promote the three starter lines; raise the guardians to 560-600. Check against
  docs/lore/wildbond-threads.md. Includes the WB3.6b pacing check.
- **CR3 [any, several PRs]** Grow the loners into lines: about 58 of the 74 creatures that never evolve gain a new
  stage before or after them, each its own creature with its own name and look (section 2), never a baby or adult version. One region per PR, in journey order (Thornwood first), following section 5.
- **CR4 [any]** The evolution moment: the light, the silhouette growing, the new form at full size, and a townsperson
  who notices; the full version for showpieces.
- **CR5 [any]** Two more branching lines, using conditions we don't use yet (time of day, weather, what it ate at the
  ranch).
- **CR6 [any]** World-fit audit: a contact sheet of every creature in solid black, grouped by shape; fix any two that
  read the same (section 4.2), and fill each region's size and shape spread (4.7).
- **CR7 [any]** Rare spawns for showpieces: one hidden pocket or rare-condition spawn per region, hinted by someone in
  that area.
- **CR8 [any]** New shapes: fish and a winged drake first (each its own PR, with screenshots), then rabbit-kind, beetle, owl.
