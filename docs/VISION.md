# The vision (Evan, 2026-10-07)

Evan's brainstorm after the launcher and the first votes, in his words where possible, with what each idea means for
the arcade and how reachable it is. Every assistant should read this before proposing big features. Projects that
come out of it are in [PROJECTS.md](PROJECTS.md) under "Vision" (V1-V9).

## The heart of it

> "The goal is to make a place where I or people can go, when they're bored at work or even at home and want a fun
> game to play and be able to get lost into the world."

> "WoW: Forever has really struck a nostalgia chord ... it's so nicely blending old with the new ... there's plenty of
> things we can do for the first time or do the right way."

Evan's roots: early Pokémon (LeafGreen, Ruby, Emerald), classic WoW; today he plays modern games too. So the arcade's
look should be **old soul, modern craft**: pixel art and classic structure, with modern light, motion, sound and
comfort. Not retro for its own sake.

## The ideas, and what we'll do with them

**1. A trailer or narrator that brings you into each world** (V1). A short, skippable prologue per game, played in
the game's own engine: a narrator's lines over a few moving scenes (the world, its people, the first stakes), like an
attract mode. It plays when you first visit a place on the launcher, and from a "Watch the prologue" button. Built
from what exists (dialogue scenes, the ambience and light engines, the chiptune); an optional spoken narrator can use
the browser's built-in speech voice. Primordial gets a short one, as Evan says.

**2. "Have we gone too retro?"** (V2). Fair worry. Wildbond already climbs from Game Boy greens to HD-2D and a 3D
diorama, but new players start in the faded era on purpose, and Realmbound is side-on pixel art. Plan: an arcade-wide
**Look** choice, *Classic / Enhanced / Modern*, alongside the existing eras: Enhanced (HD-2D depth, rich light, smooth
motion) becomes the default first impression; Classic keeps the pure pixels for players who want them; Modern grows
from Wildbond's planned Modern 3D era (W6). Realmbound gets an HD-2D world view like its towns. A poll will ask
testers which look they'd start in.

**3. Box art and a virtual game box** (V3). Each game gets a box you can pick up on the launcher (front art, back
blurb and screenshots, and an instruction booklet that *is* the guide, T8). Ties to idea 2 with an **era slider**:
the same box as a 1990s cartridge box, a 2000s DVD case, a modern store page. Box art is a good job for Gemini's image
generation (recorded in CREDITS.md); the box itself is drawn in code.

**4. Procedural generation, done properly** (V4). Hand-made places stay hand-made; procedural content goes where
variety is the point: the Lighthouse Spire's floors and rewards, Realmbound's Heroic dungeons (layouts, packs,
affixes), Wildbond "wild routes" that change each ranch week, rare-spawn events, and later Primordial. Seeds, so a
run can be shared and replayed.

**5. NPCs that feel like players** (V5). Realmbound's guild already has members with moods and favour. Next: a
**living world of bots**, like AzerothCore's playerbots: other adventurers questing in your zones, chatting, forming
groups, asking for help, with their own levels and gear, all simulated in the browser by rules (no internet or AI
service needed). Real language-model conversation is possible later, but needs a server and costs money per chat, so
it's an optional extra, not the base.

**6. Play with friends, online or offline** (V6). Offline is what we have (and the bot world makes it feel
populated). Online needs a server, which GitHub Pages can't run. Steps in order of cost: first things that need no
server (trade or battle codes you paste to a friend, "ghost" teams of friends' creatures to battle, shared seeds);
then light online features on a free hosted database (leaderboards, async trades, guild boards); real-time co-op
last. Evan would create any service account himself.

**7. "A game like Ashes of Creation was supposed to be"** (V7). The full thing is out of reach, honestly. But its
best idea fits Realmbound: **nodes**, towns that grow from what people do around them. In Realmbound the guild and the
bot adventurers raise a camp into a village into a town (new services, quests, looks), and neglect lets it fade.
That's a single-player slice of the dream, buildable here.

**8. Automation, rethought** (V8).
> "The more fleshed out a game we do the less I want to automate it, because then people will be missing ... fun
> gameplay. ... It can take the form of quality of life stuff that you unlock rather than fully automating, though
> maybe you can hire people or train creatures to do things for you."

So, from now on: **automation means earned quality of life and delegation to characters**, not skipping the game.
Unlock conveniences (auto-loot, faster travel, batch actions, smarter Auto for grinding you've already mastered);
hand jobs to people and creatures who live in the world (guild members on contracts, Palworld-style ranch jobs,
hired help in Starfall). Full Auto stays for grinding and idle time, never for the story's best moments. This answers
the open question "when does full Auto unlock". **Updated 2026-10-12 (Evan):** greatly reduce automatic play; no
full Auto at all. The rule is now GOALS.md "Play, not watch".

**9. Choices that matter, and people who remember** (V9). Grown 2026-10-08: hero, nobody or villain, and a world that physically changes; see docs/proposals/reputation-and-consequence.md.
> "Mass Effect 1, 2 and 3 ... the way choices genuinely affected things was surreal. ... characters could
> die/survive/have a relationship ... made the game feel almost alive." (He has heard Fable does some of this too.)

Our version: **choices with consequences that carry forward**, and **companions with lives of their own**. Story
decisions are remembered (a world-state record per save) and change later scenes, towns (V7 nodes), who helps you and
who doesn't; some outcomes are permanent. Companions (Realmbound's guild members, Wildbond's Wren and the people you
meet) have loyalty and personal arcs (R4), can be lost for good in rare high-stakes moments the player is warned about,
and can form close bonds, friendships and, for adult characters, romance written tastefully (fade to black, never
explicit). A Fable-like reputation colours how places greet you. Start small: a few real choices in Realmbound's
story with visible consequences, the guild stories (R4) with loyalty and an outcome that can go either way.

**10. A big world, and one day first person** (V10, 2026-10-07): "I dont want the world to be small. Eventually the goal
may be to make this a first person game with an open world map and its explorable ... (this goes for each game)."
Groundwork, in order: keep every game's world as data that any renderer can draw (Wildbond already draws the same
maps five ways: Pocket, 16-bit, HD-2D, Diorama, and later Modern 3D); grow maps from single screens into large
connected regions loaded in pieces (chunks) with the camera following you; give places real height (cliffs, stairs,
bridges) so a 3D renderer has something to stand on; then a three.js renderer with a third-person camera, then first
person. The 2D games stay complete and playable at every step.

## What this changes right away

- The Launch plan stays, but onboarding (L4) becomes "the prologue and the first ten minutes" (V1 feeds it).
- The launcher gains the game boxes (V3) as its next step.
- The quality bar (CREATIVE.md) adds: *old soul, modern craft*; first impressions in the Enhanced look.
- Automation work follows V8: quality of life and delegation first.
