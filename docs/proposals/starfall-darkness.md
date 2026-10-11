# Starfall: darkness with consequences (proposal)

Grok for Adam (abarish-dev, guest), 2026-10-11. **Proposal only. Nothing here is built.** It follows Adam's feedback on
PR #179 (SF2.8):

> unlit areas should have consequences, inspired by Minecraft. Darkness should create visible, recoverable trouble near
> an unlit wall, not just silently deduct money or stats. Each lantern should protect its section. Start small.

## What's there to build on (after #179)

- Four wall lanterns (west, north, east, south), lit by hand at dusk or by Odo once he's hired. At nightfall a fully lit
  wall gives +1 nerve to adventurers at home, and lamp money if you walked the round yourself. An unlit night has no
  effect yet.
- The town map has sections on each side: the gate and watchtower (west), behind the hall and inn (north), the end of
  the road (east), and the south plots.
- Hand jobs that are already "walk up, press E, a short timing game" (counter, forge, tap, spar), and hires who take
  them over.
- The wilds stretch west of the gate (SF2.7), with signs of slimes, boar, webs and wolves.

## Rules for every option

- **Each lantern protects its section.** Trouble can only appear in the section of a lantern that was left dark.
- **Visible:** you see it in the morning, in the world, where it happened. A short line in the evening report points
  to it ("Something got in by the south wall").
- **Recoverable, never a fail state:** nothing is destroyed or lost for good. Every bit of trouble can be cleared by
  hand in a few seconds, or by the right hire. Leaving it costs a little until it's fixed, and it doesn't stack up into
  a disaster: at most one problem per dark section.
- **No combat system.** You don't fight anything; you clear, mend or shoo.

## Option A: something gets in and leaves a mess (recommended default)

In each dark section, overnight, a small night creature from the wilds (a creek slime by the west and south walls, a
fox or a boar near the farms) slips in under the stakes. In the morning there's **a mess in that section**: a
slime puddle, scattered crates, a dug-up patch or toppled barrels (code-drawn bits plus ART-SF-6 props). There are
pawprints or a shiny trail from the wall to the mess.

- **While it's there:** the nearest building in that section works a little worse. Adventurers won't use the yard
  past a slime puddle, the counter or tap serves one fewer, or a plot's builders stop for the day. One of these at
  most, and it's shown on the building.
- **Fix it by hand:** walk up and press E to sweep, mend or scrub (one press, or a short hold, with no timing game).
  Small thanks follow (an adventurer barks "Thanks, guildmaster", +1 nerve to whoever's nearest).
- **Fix it with a hire:** Odo clears messes on his way back to his post. If nobody fixes it, it's gone the next
  night, so it never stacks.
- **Why it fits:** it reuses the lanterns, sections, props, the wilds creatures, the hand-then-hire pattern and nerve.
  No new save shape beyond one small list of `messes` (section and kind, defaulting to empty).
- **Code it would touch:** `starfall-godot/scripts/main.gd` (`_watch_night` decides messes per dark section; a draw for
  messes; `use()` to clear one; one effect hook per building kind; save/load `messes`) and
  `starfall-godot/tests/run_tests.gd` (lit section means no mess; dark section means a mess there only; clearing it by
  hand or by Odo; old saves load with none). Score 15/21: fun 2, Evan 2, friends 2, focus 2, cheap 2. It belongs in
  the path, in milestone order.

## Option B: a frightened neighbour won't open

A dark section near a building or stall (the tavern, the apothecary shelf, a travelling carter's cart at the east
end) means **that place stays shuttered next morning**: "Too dark by the east wall. Not opening till someone's seen
to it." You see the shutters closed and the keeper standing outside. Talk to them and relight that lantern (one E
press, any time of day) and they open again.

- **Fits:** the tavern already has a "shut" state you reopen by hand (SF2.3), and this reuses it.
- **Weaker on "visible trouble":** it's a closed door rather than something that happened. Score 13/21.

## Option C: tracks and a small creature you shoo off

A dark section gets **tracks and a small creature still there in the morning**: a slime in a puddle, or a fox in
the crates. Walk at it and it flees back to the wall and out through a gap, which then needs mending (press E). Your
adventurers point it out. It's lively and Minecraft-like, but it needs a creature that moves and flees (a new mover
with simple flee pathing), so it costs more. Score 14/21: fun 3, cheap 1.

## Recommended default

**Option A**, one mess per dark section, with Odo clearing messes as part of his round. It's the smallest thing that
makes each lantern matter. It can be seen in the morning, it's fixed by hand in seconds, and it grows naturally
later. Option C's fleeing creature can be added on top as a second step, and seasons (SF3.1) can change which
creatures come.

**Open question for Adam and Evan:** should a mess left for a whole day also cost a point of nerve to adventurers who
walk past it? The default is no, only the building effect.
