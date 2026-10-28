# Baby forms and growing up (W9)
Who: Claude  Date: 2026-10-07  Game(s): Wildbond (the art part helps any game that draws creatures)

**The experience.** An egg hatches in Maren's barn and out tumbles a tiny, round-headed Cindercub that trips over its
own paws. For the next few ranch days you raise it: what you feed it, how you play with it and how much it rests
shape the creature it grows into. One morning the day report says *"Ember isn't a baby any more"*, and the sprite on
the ranch is suddenly lankier, a young creature with its own temperament. Much later, a level-90 partner you've had
since Thornwood gets a grey muzzle and a calm glow: an elder, who now teaches the babies on the ranch. Out in the tall
grass you sometimes find a lost hatchling alone, and you choose: take it home to its family or adopt it.

**Why it fits the pillars.** Raising is the heart of a creature game (Monster Rancher, DQM, Palworld's ranch), and
right now a hatched creature is just a level-3 copy of an adult. Growth stages make the ranch matter, give old partners
a reason to stay (elders), and the lost-hatchling choice is warm, kind and curious. Nothing is sold and nothing
punishes: care only ever adds.

## The key choice: a *life stage*, not new species

Pokémon makes babies separate species (a baby form before the grown form). That would triple the roster's art and data. Instead,
**every creature has a life stage of its own** (`c.stage`: baby, young, adult, elder), drawn from its species' normal
art with different proportions. Every current and future species gets babies for free, and W11's bigger roster
doesn't need baby entries. Species evolution (Cindercub → Blazefang at 14) stays exactly as it is.

## How it works
- **Who starts as a baby:** everything that hatches from an egg, and lost hatchlings found in the wild. Creatures
  caught in battle are young or adult as now. Starters stay as they are (the story needs them to fight).
- **Baby (about 3 ranch days, 15 minutes of play):** a baby lives on the ranch, not in the team. Each day its *care*
  is counted: fed (favourite food counts double), played with (a new ranch activity, "Play"), rested, and time with
  an elder. Care can nudge its **potential** up: at most one grade per stat over babyhood, and only toward the stats
  its care favoured (training-style play favours Power, quiet rest favours Spirit...). Parents already pass potential
  (DQM-style inheritance); care is how *you* shape what they pass.
- **Young (levels up normally, until level 20 or the next evolution):** can join the team. Slightly smaller sprite,
  a little more Speed and a little less Guard (playful, not weak). Evolution waits until a creature is at least young:
  a baby past its evolution level evolves the moment it grows up, which makes a nice double scene.
- **Adult:** as every creature is today.
- **Elder (optional, level 80+ and the highest bond):** never weaker. A grey muzzle or soft glow, a line in the dex
  card, and a ranch job: an elder on the ranch counts as care for every baby there and teaches it one of its own moves
  (inheritance). This is a reason to keep your oldest partners around and fits W5's ranch jobs.
- **Lost hatchlings:** a rare find in tall grass (more often at night, by water, in spring weather...). It can't be
  caught by battle. You can **return it** (it leads you to its parent: a little bond for your team, coins, a dex note
  about the species' family life) or **adopt it** (it comes home as a baby). Either is a good choice.

## What it touches
- **Saves:** new optional fields only: `c.stage` (missing = adult, so every existing creature stays as it is),
  `c.care = { fed, played, rested, elder }` while a baby. Eggs already in the barn hatch as babies under the new rules.
  A check loads an old save and confirms nothing changed.
- **Code:** 07-ranch.js (hatching, the daily care tally, Play), 08-ranch-ui.js (baby cards and the grow-up line in
  the day report), 02-state.js (`grow()` holds evolution while a baby), 12-walk.js (lost hatchlings), 03-battle.js
  (babies can't be sent in), 00-data.js (a few lines of text).
- **Art:** one function in 01-art.js turns any species' sprite into its baby or young proportions (head about 1.3x,
  body and legs shorter, bigger eyes, rounder outline) and an elder variant (paler palette, grey pixels). Because the
  HD-2D and Diorama views draw from the same sprites, they get babies for free. Later this can move to
  `shared/creatures.js` if Starfall or Primordial want young creatures too.

## Smallest first version (W10 part 1)
Eggs hatch as babies with baby art; the daily care tally and "Play" on the ranch; growing up after 3 ranch days with
a day-report line and a short scene; evolution waits for growing up; old saves unchanged. **How we'll know it works:**
breed two creatures, raise the baby for three ranch days, and see it grow, with checks for each step and old saves.
Part 2 adds care-shaped potential and elders; part 3 adds lost hatchlings.

## Open questions for Evan
1. **Life stages (recommended) or separate baby species** like a separate baby species? Stages give every creature a baby at once;
   species give each baby its own name and design but need far more art.
2. **Can babies battle?** Recommended: no (they stay on the ranch, which makes raising feel different from training).
   The alternative is letting them fight at reduced strength.
3. **The elder stage:** yes, as described (never weaker, a mentor on the ranch)? Or leave creatures as adults forever?
4. **How long is babyhood?** Recommended 3 ranch days (about 15 minutes of play). Longer makes raising deeper but
   slower; the journey-length setting could scale it.
5. **Lost hatchlings:** is the return-or-adopt choice the right tone, or would you rather they simply join you?

## Evan's answers (2026-10-09)
"Proposal looks good, though eventually we can build baby forms. I like the idea of young to old." So: **life stages**,
with the recommended defaults for questions 2-5 (babies stay on the ranch, elders yes, 3 ranch days, return or adopt).
It's a later build (WB5.5), after the journey is polished.

**How age and evolution work together** (Evan asked; this is the rule):
- **Two separate clocks.** *Age* (baby, young, adult, elder) is about time and care, and every species has it.
  *Evolution* (Cindercub to Blazefang) is about level (and sometimes place), and only species with a next form have it.
  Some species never evolve; they still grow up and grow old.
- **Eggs hatch from the bottom.** Any two adult parents can breed, at any evolution stage (a Blazefang and a
  Tidehound both work, as now, from level 8 and Friendly). The egg always hatches the **first form** of the line, as
  a baby. You never need the top evolution to breed.
- **They meet in one place:** a baby can't evolve. It must grow up to young first; if it has already passed its
  evolution level by then, it grows up and evolves in the same moment (a double scene).
- **Elder is at any form:** a level-80 Cindercub that never evolved can become an elder just like a Blazefang.
  Elders don't evolve further or get weaker; they teach babies on the ranch.
