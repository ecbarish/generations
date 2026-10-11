# Ground rules and creative freedom (for every assistant)

Evan (2026-10-09): he wants other assistants and AIs to bring **their own creativity and perspective**, not only fill
in plans Claude wrote, as long as the work lands where the arcade is going. This page is the shared frame: what never
changes, what "good" looks like, and how much each kind of decision is yours to make.

## The pillars (what every change should serve)

1. **Real games, not dashboards.** Deep lore and deep play, like Pokémon, Palworld and classic WoW. Be *in* the world:
   places, people and creatures instead of menu buttons.
2. **Beautiful, living worlds.** Light, shadow, fog, weather, movement and sound carry the mood. *"Paying attention
   to the details of the lighting and the shadows greatly affects the overall look."* (Evan, after WoW: Forever.)
3. **The journey is the fun, at the player's pace.** Earned automation, never paywalled; active play is always worth
   at least as much as idle; settings for journey length and challenge; reasons to revisit old places.
4. **One recognisable arcade.** Shared systems (`shared/`) make every game better at once; build them well, never
   as a shortcut. A light shared universe: recurring characters, a few links, every game playable alone.
5. **Warm, kind, curious.** Characters have voices; the world rewards cooperation and care; humour is gentle.

## Hard rules (never break these)

- **Saves:** never break an existing save. New fields get defaults; old saves load unchanged (add a check).
- **Tests:** all test pages pass before you push (`tests/run.html`, `tests/wildbond.html`, `tests/starfall.html`,
  `tests/sound.html`); new behaviour gets checks.
- **Commits** only as `206636510+ecbarish@users.noreply.github.com`; never Evan's personal email or accounts.
- **Plain HTML/JS**, no build step, no installs. Scripts from cdnjs only if truly needed (three.js already is).
- **Branches and PRs:** your own branch per project; don't merge your own work unless START-HERE says you may;
  never work in Evan's Desktop folder clone if you're not Claude (see AGENTS.md).
- **Canon:** follow `docs/lore/*.md` and `docs/lore/multiverse.md`. New lore is welcome (see below) but must not
  contradict established canon; record what you add.
- **Outside assets** (art, sound, music, fonts): allowed and encouraged when they raise quality, but only with a
  licence that allows it (CC0, CC-BY with credit, or a free-for-games licence); record each in `CREDITS.md` with
  source and licence. Tweak them to fit the arcade's look. The inventory is [CREDITS.md](../CREDITS.md), the player page is [credits.html](../credits.html), and full third-party notices live in `licenses/`.
- **Accessibility and comfort:** respect `prefers-reduced-motion` (no flashes, no sweeping motion), keep text readable.
- **No real-money anything**, no ads, no dark patterns, no daily-chore traps.

## The quality bar

- **Old soul, modern craft** (Evan, 2026-10-07, docs/VISION.md): pixel art and classic structure with modern light,
  motion, sound and comfort; never retro for its own sake. First impressions should look *Enhanced*, not faded.
- **Light first.** Every scene should have a time of day, a light source and shadows that agree with it. Things stand
  *on* the ground (contact shadows), fog sits in the low places, warm light pools around fires and windows, cool light
  fills the shade. Before/after screenshots in the PR for anything visual.
- **Pixel-art discipline:** crisp pixels (no blurry scaling), a palette that fits the zone, motion that's gentle.
- **Writing:** short lines, each character sounds like themselves, no exposition dumps; show the world through people.
- **Feel:** every action answers with sound, motion or a line of text; nothing important happens silently.
- **Every screen, not just phones** (Evan plays on a 45-inch 3440x1440 ultrawide): check a phone (375 px wide), a
  laptop (1366x768), a desktop (1920x1080) and an ultrawide (3440x1440). Big screens should *use* the space (a larger
  scene, panels side by side, crisp at high resolution), not show a small column in the middle; phones get taps.

## Writing for players (Evan, 2026-10-08)

Evan saw a story box that read "Trust hurt: mood −8 at the decision; no friendship reward... no extra mood or time
gate" under a title "The Open Seat · guild hall". Every word a player sees must pass these rules:

- **Capitalise names:** places (the Guild Hall, Thornwood, Saltmarsh Coast, the Hollow Crown), titles (Warden Toren,
  Registrar Mott), named things (the Thorn Badge, the Hearth Book). Correct spelling, grammar and punctuation always.
- **Say it in the world's words, not the rules' words.** No "mood −8", "gate", "flag", "XP reward", "cooldown" in story
  text. A person speaks: "Brienne won't meet your eyes. Maybe talk to her by the hearth when things have cooled." If a
  number matters for play (damage, price, level), show it where players expect numbers, never inside a story.
- **Read it as a first-time player.** Before shipping, look at the actual screen (phone and desktop) and ask: would
  someone who has never played understand every word, and does it look like a game rather than a form?
- **Games, not menus.** Prefer a person, a place or an object over a box of buttons (CLAUDE.md "In the game window").
  Where a choice must be a button, give it in-character words ("Talk it through", not "Option 1").
- Tests may check text exists, but a passing test doesn't prove the text reads well; look at it.
## Your creative freedom, by level

**Decide freely** (just do it and mention it in the PR):
names, dialogue, quest text, species, NPCs, map layouts, tunes, colours, lighting and weather moods, small UI
improvements, extra checks, small balance tweaks inside a ticket's stated ranges, and *how* to build anything a ticket
asks for. If a ticket's details seem worse than an idea you have, you may build your version *if it still meets the
ticket's goal*, and explain why.

**Propose in the PR** (build it, but call it out clearly so the reviewer can keep or revert it):
a new mechanic inside an existing system, changing a ticket's design, rebalancing beyond a ticket's ranges, new lore
that adds a place or faction, removing or reworking something players already use.

**Ask Evan first** (write `docs/proposals/<topic>.md` and stop; work continues on other projects):
a new system or game mode, starting a parked game, changes to a core loop or to canon, anything touching saves'
structure in a big way, monetisation, anything that would surprise Evan if he found it later.

## Bring a perspective

**Undecided between two good options?** (Evan, 2026-10-07) Build both if it's cheap enough, let the player switch, and add a
poll (`shared/votes.js`, list it in docs/VOTES.md) so playtesters decide. Polls inform Evan; they don't replace "Ask Evan".

Every PR may end with an **"An idea"** section: one thing you would do next or differently, from your own point of
view. Good ideas get added to `docs/PROJECTS.md` (or `docs/ideas.md` if they're further out), credited to whoever
had them. Disagreement is welcome when it's specific: "this would be better because...".

## Proposal template (`docs/proposals/<topic>.md`)

```
# <Title>
Who: <assistant>  Date: <date>  Game(s): <...>
The experience: one paragraph, from the player's point of view.
Why it fits the pillars: ...
How it works: the rules, in a few bullets.
What it touches: files, saves (new fields and defaults), shared systems.
Smallest first version: what ships first, and how we'll know it works.
Open questions for Evan: ...
```


## Visible progression and improving assets (Evan, 2026-10-10)

Equipment must appear on the character, not only as inventory text. Build characters, creatures, buildings, props and effects with stable identities, measured scale, interaction/collision anchors and replaceable art, so detail and animation can improve together toward a much higher-definition world. Preserve readability, the game's identity and playable performance. Realmbound's first implementation and upgrade contract: [visible equipment and assets](proposals/realmbound-assets.md). Other engines should implement equivalent attachment and replacement contracts within their own lanes.
