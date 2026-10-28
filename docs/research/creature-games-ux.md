# Creature games: onboarding, battle screens, immersive menus, variants, world ranching (Gemini deep research)

Gemini deep research for Evan, 2026-10-07 (prompt in gemini-prompts.md). Summarised and organised by Claude; the
lessons we adopt and how they map to Wildbond's phases are in ../wildbond-plan.md ("Lessons
from the research"). Game facts below are as the report states them; treat specific numbers as approximate.

## 1. The first hour: teach through the world
- **Pokémon Red/Blue:** Professor Oak stops you at the tall grass, so "tall grass means wild creatures" is learned
  without a manual. FireRed/LeafGreen's optional Teachy TV kept tutorials off the critical path.
- **Ruby/Emerald:** the starter choice is an event: Professor Birch is chased by a wild creature and you grab a
  partner from his dropped bag, straight into the first battle.
- **Scarlet/Violet:** in the opening minutes you fall from a cliff and the box-art legendary saves you, a bond with
  an endgame creature before the tutorial ends.
- **Palworld:** the environment is the tutorial (gather, craft your first capture item). **Cassette Beasts:** a
  ranger, Kayleigh, fights beside you and demonstrates combat and recording as it happens.
- **For a faded world:** begin in near-monochrome isolation; the first bond should visibly restore colour around
  you, teaching the core loop without words.
- **Starters and rivals:** Monster Sanctuary's familiar follows you and has an overworld ability (a companion, not a
  statistic). Pokémon's rival picks the type that beats yours (teaching type advantage); Temtem's first rival battle
  can be lost without penalty and sets a benchmark.
- **The first catch** should show its chance of success visually and feel like bonding, not capture: a burst of
  colour from the creature, painting the tiles around it.

## 2. Character creation inside the story
- Coromon frames it as joining a research company (uniform, hair, faction); Temtem as getting dressed on the morning
  of your apprenticeship, with an extensive dye system.
- Idea for us: you begin as a faded, colourless silhouette and *paint yourself in*, choosing your colours.
- Technical: layered sprites must line up across every animation; show the creator at the same pixel scale as the
  world.

## 3. Battle screens
- Classic geometry: your creature bottom left, the foe top right (reads left-to-right as forward momentum).
  Monster Sanctuary's side view (three on three, a combo meter) makes several health bars easy to track.
- Keep the command menu in a bottom corner or grid so the centre stays free for the animation.
- **Temtem:** a stamina bar instead of move points (overexert and you lose a turn), and a visible **turn-order
  queue** by Speed, so there is no hidden randomness in planning.
- **Cassette Beasts' Chemistry:** elements change states (fire on water makes a healing steam; fire melts plastic
  into poison) instead of just multiplying damage.
- Transitions without photosensitive flashing (an ink wash, a burst of grey fog that clears). Results screens that
  show XP and growth clearly; Coromon adds a second "potential" bar that grants stat points to place.

## 4. Menus that feel like objects
- **Ni no Kuni's Wizard's Companion:** a huge in-game book with page turns, used to research recipes and weaknesses.
- For us: the Wilddex as a sketchbook: a charcoal sketch on first sight, watercolour blooming in when you bond.
- **The map** starts blank or grey and inks itself in as you explore and restore colour.
- **The bag** as physical pouches (a jar of berries, a satchel of lures, a box of key items). **The trainer card** as
  a document: a licence with your portrait, badges pinned to it.

## 5. Variants
- Pokémon shinies (about 1/4096 now) are a palette swap plus a sparkle, yet the ultimate status symbol; a creature with random spot patterns has
  spots generated per creature (billions of patterns); sizes (tiny, huge) and regional forms add collecting depth.
- Temtem **Lumas** glow and announce themselves, and are guaranteed strong stats; breeding two Lumas greatly raises
  the odds. Coromon's Standard/Potent/Perfect tiers come with a scanner to hunt them actively.
- Cassette Beasts **Bootlegs** change the creature's element entirely, so they play differently.
- Scarlet/Violet's sandwiches let players raise variant and type odds for a while (agency over randomness).
- For us: "Prismatic" or over-saturated variants that glow into the faded world so you notice them from afar;
  mixing pigments gathered from plants to raise the odds for a while.

## 6. The ranch through the world
- **Palworld:** creatures live in the base and work stations that suit their element (fire smelts, water
  irrigates). **Stardew Valley:** you walk up to pet each animal, fill the trough by hand, and neglect shows.
- For us: replace storage with a **Sanctuary** that starts grey and blooms as creatures live there; water creatures
  restore the fountain, plant creatures make dead trees blossom; you walk through it, pet, feed and play.

## 7. Mistakes to avoid
- **Spreadsheet fatigue:** creatures reduced to stats in nested menus stop feeling alive; every care action should
  show on the creature.
- **Hallway worlds feel small:** give creatures overworld abilities (push a boulder, swim, glide) so early blocked
  paths open hours later; that makes a world feel big.
- **Pixel scaling:** use a fixed base resolution (320x180, 384x216 or 640x360) and integer scaling only, with
  nearest-neighbour filtering; never mix pixel densities (all UI, fonts and sprites on the same pixel grid).

## 8. The report's 15 lessons (its priority order)
1. Teach bonding through an environmental interaction; the first bond restores colour around you.
2. Character creation inside the story (painting yourself into the faded world).
3. The starter follows you from the first moment and has a use outside battle.
4. Chemistry (element interactions that change states) over plain damage multipliers.
5. Stamina-driven combat instead of move points.
6. A visible turn-order queue.
7. The Wilddex as a tactile book; sketches bloom into watercolour on bonding.
8. The map as a living canvas that inks in as you explore and restore colour.
9. Meaningful variants (the report suggests better stats or a changed element).
10. Crafting for probability (pigments that raise variant or type odds for a while).
11. A physical Sanctuary instead of a storage box.
12. Physical affection: petting, feeding and playing in the Sanctuary.
13. Strict integer scaling of a fixed base resolution.
14. Overworld traversal abilities that gate the world.
15. Never mix pixel resolutions.
