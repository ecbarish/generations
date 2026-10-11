# Goals: short, medium and long term

Evan, 2026-10-11: "Can we build short, medium and long term goals, and our long term should be the most ambitious and
short term more easily achievable. My personal thought is the long term goal for Wildbond is better than a Pokémon game
and drawing from a lot of fan games, as people have seemed to greatly improve how Pokémon works. But my visions can be
low; maybe you have better, clearer visions."

How this page works with the others:

- **Short term** (the next few weeks): small and certain. Every line is already a task in [QUEUE.md](QUEUE.md) or
  [DEVELOPMENT-PATH.md](DEVELOPMENT-PATH.md), so any AI can pick it up today.
- **Medium term** (the next few months): a finished version of each focus game that friends play start to finish.
  These are the milestones in DEVELOPMENT-PATH and the order in [PRIORITIES.md](PRIORITIES.md) section 4.
- **Long term** (a year and more): the ambition. Each goal is a direction, not a ticket yet. Lane P turns a long-term
  goal into path tickets only once the medium-term goal before it is done, so nobody builds year-two features on
  unfinished ground.
- **At a milestone** (a medium-term goal reached, or a game's version step): refresh the site and guide
  (docs/SITE-AND-GUIDES.md), not on every update.
- When a goal is reached, tick it here with the PR, and move the next one up. Lane P (Priorities and direction) keeps
  this page current alongside QUEUE.md.

## The whole arcade

| Term | Goal | Done when |
|---|---|---|
| Short | **Every game passes a newcomer playtest.** | Each game on the hall scores 15 or more in docs/PLAYTEST.md (pass 2 left Starfall at 11 and Wildbond without keys on screen). |
| Short | **The task lists never go stale.** | QUEUE's Heavy lifting and road ahead stay 10+ deep and match what's open (docs/PROCESS.md). |
| Medium | **Friends come back on their own.** | Testers finish Wildbond's journey and a Starfall season without being asked; "Tell us" issues are mostly ideas, not confusion. |
| Medium | **One recognisable arcade look.** | Wildbond, Starfall and the cabinets share the art direction (docs/art/README.md) and the shared code in `shared/`. |
| Long | **A small studio's catalogue.** | Wildbond and Starfall ship as full games (desktop and phone, and a store page if Evan chooses), with the arcade as their home; something for everyone, from Little Ranch for a toddler to the cabinets for a dad who grew up on Atari. |

## Wildbond (the flagship)

### Short term

1. **Keys on screen** (WB-KEYS): the first time each action matters, its key or pad button appears in the world.
2. **Battles with real choices** (WD3, data then wiring): about 60 moves, signature moves, a few statuses, Wardens
   who fight with a plan.
3. **Saltmarsh you can explore** (WD4b): a route, a settlement and a hidden pocket, like Thornwood.
4. **The ending's last pieces** (WB4.3 rest, the Wildbond builder): the partner's walk away and back, the notebook page.

### Medium term: Wildbond 2.0, ready for everyone

The whole journey, finished and pleasant, on the web and on a phone (PRIORITIES section 4): creatures that look
different (WD2), every area explorable (WD4), the Unbound and reputation (WB3.7), a browser save carried across
(WB6.3), ranch jobs, races and contests (WB5.2-5.3), and a trailer and builds (WB6.5). **Done when** a newcomer finishes
it on a phone, scores it 17+, and wants the post-game.

### Long term: the creature game people wish Pokémon was

Pokémon's fans have spent twenty years fixing what the main games won't. The best fan games and Pokémon-likes agree on
a lot, and none of them has put all of it in one game, with its own world and its own idea at the centre. That's the
goal: **take every fix players have proven they want, and build them around one idea Pokémon never had: the bond
itself is the game.** Wildbond already has it in the wild bond (fighting as one) and the partner who walks with you.

Six pillars, each with the games that proved it (our research notes: docs/research/creature-games-ux.md and
docs/plans/wildbond.md "Learn from the references"):

1. **Respect the player's time.** *Radical Red, Pokémon Unbound*: no chore moves, moves you can always relearn, items
   that never run out, every number explained in plain words, fast battles, level caps per badge. *Legends: Arceus*:
   catching in the overworld. **For us:** no grinding walls, field skills are creatures helping in the world, and our
   rule stays: active play always worth at least as much as idle, automation earned.
2. **Battles that are puzzles, not luck.** *Pokémon Reborn and Rejuvenation*: field effects that change every fight.
   *Temtem*: stamina instead of move points and a visible turn order. *Cassette Beasts*: elements that react ("fire on
   water makes healing steam"). *Radical Red*: trainers with real teams and smart choices. **For us:** each Warden a
   different puzzle, weather and ground that matter, difficulty settings from relaxed to brutal (*Coromon*), and
   optional challenge rules built in (the "one life per creature" runs fans invented as Nuzlockes).
3. **Creatures with more identity.** *Cassette Beasts and Infinite Fusion*: fuse any two. *Dragon Quest Monsters*:
   inheritance, where children carry their parents' moves. *Coromon's Potent and Perfect, Temtem's Luma, Cassette
   Beasts' bootlegs*: rare variants that play differently, not just shine. *Palworld*: creatures that work and live with
   you. **For us:** the wild bond grows into fusion and inheritance, baby forms as life stages (approved), rare variants
   with their own element or move, a ranch that's alive.
4. **A world that remembers you.** *Pokémon Insurgence and Rejuvenation*: choices with consequences. *Reborn*: a story
   that trusts the player with darker, adult themes. *Metroid-style* routes: places you return to with the right
   creature. **For us:** the Unbound and reputation, woven story threads (docs/lore/wildbond-threads.md), every area a
   route, a settlement and secrets, people whose lives change as the journey goes on.
5. **Friends in the same world.** *Temtem*: co-op and a shared world. **For us:** trade and battle with friends first,
   then co-op routes, then the living world of bots from VISION.md, so the world feels inhabited even when you play alone.
6. **Something new to the genre.** This is where we go past the fan games. **For us:** first-person moments in our own
   art style (the wild bond's glimpse is the first, Art direction's long-term goal), a world that changes with seasons
   and festivals (WS4, Starfall's calendar), creatures that remember the trainer who raised them, and a post-game that
   never runs dry (the Spire, roaming legendaries, rematches, mastery).

**Done when** a player who loves Pokémon tries Wildbond and says the thing every fan-game comment section says: "this
is what the real games should be."

## Starfall (second slot)

| Term | Goal | Path IDs |
|---|---|---|
| Short | **Say what to do next**: the goal line and controls on screen, so it passes the newcomer playtest. Then the town's best side and a dressed square. | SF2.10, SF2.6c, ART-SF-8 |
| Medium | **A full first season**: the progression plan (mastery ranks, hires at your rank, trust, veteran requests, signature moves, recruit specialities), darkness, then the first season as a chapter ending in a festival. | SF2.9, SF2.11-2.16, SF3.1, SF3.4 |
| Long | **The guild sim with a heart**: Moonlighter's shop by day and Darkest Dungeon's expeditions by night, run by people you know by name. Expeditions you see as first-person grid delves, adventurers who grow old and retire, and visitors from Wildbond and Realmbound. | SF4.1 and beyond |

## Diamond Manager and Lantern Bowl (sports)

| Term | Goal | Path IDs |
|---|---|---|
| Short | **Hire coaches in Diamond Manager; pitch Lantern Bowl** (a one-page pitch with three mock screens) and share the office code. | DM3, LB0, LB1 |
| Medium | **Two sports that play well**: Diamond Manager with morale, records and a league that stays balanced over many seasons; Lantern Bowl from one playable drive to a full season (Retro Bowl's quick, readable football). | DM4, DM-B2, DM7, LB2-LB5 |
| Long | **One sports world**: a shared management core across baseball, football and hockey, where your career and your salary buy a life that lasts (homes, cars), as the 2026-10-06 plans describe. | HK0+, docs/plans/sports-management.md |

## The cabinets and Little Ranch (the family games)

| Term | Goal | Path IDs |
|---|---|---|
| Short | **Polish from playtests**: Brisket's Crossing's pause and keyboard start (#180), each cabinet to 17+; Little Ranch's next gentle step. | AC3.1, AC-x, LR3 |
| Medium | **A full row of cabinets and a toy a toddler asks for by name**: six to eight cabinets with shared high scores; Little Ranch with a few baby creatures and a bedtime routine parents trust. | AC-x, LR4+ |
| Long | **The walk-in arcade**: you walk into a room and pick a cabinet (V11), and Little Ranch's babies grow up into Wildbond's creatures. | AR3.1 |

## Realmbound and Otherworld (keep alive)

Short: Realmbound's second raid tier (RB2.2) and Otherworld's skills that grow with use (OW2.2). Medium: each becomes a
finished, playtested game in the game window. Long: decided by evidence once Wildbond 2.0 ships (START-HERE question 2).

## Log

- 2026-10-11: first version (Claude, Priorities and direction), from Evan's ask above.
