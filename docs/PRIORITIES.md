# Priorities: where the focus goes

Evan (2026-10-09): "We need to better manage prioritizing and what direction to go and where focus should be as I
have more ideas and ambitions." This page is the answer. It is short on purpose. **Every assistant reads it before
picking work**, and the ordering in docs/DEVELOPMENT-PATH.md and docs/QUEUE.md follows it. Evan's word always wins;
when he says "focus on X", change the focus table below and note the date.

**Where each game is heading** (short, medium and long-term goals, Evan 2026-10-11): [GOALS.md](GOALS.md). This page
decides the order; GOALS.md says what the order is for.

## Why this exists

By 2026-10-09 the arcade had nine games or game ideas, two engines, three assistants and about 70 open deliverables.
The old rule ("take the earliest milestone of *any* game, prefer the one with fewest PRs") spreads effort evenly, so
every game moves a little and none of them gets finished. Ideas arrive faster than games ship. Two fixes:

1. **Focus slots:** only a few games are built at once; the rest wait their turn on purpose, not by accident.
2. **One scorecard:** every new game idea, improvement or feature is judged the same way, so the order is explainable.

## 1. Focus slots

| Slot | Share of build effort | What it means | Now (2026-10-09) |
|---|---|---|---|
| **Flagship** (confirmed by Evan 2026-10-09) | about 60% | The game we are finishing. Its next milestone comes before anything else in Claude's lane, and ChatGPT's data and writing for it comes first in Lane A. | **Wildbond (Godot)**, toward version 2.0 |
| **Second** | about 25% | Grows steadily, one milestone at a time. | **Starfall village (Godot)** |
| **ChatGPT's own** | ChatGPT's time after flagship support | One browser game ChatGPT moves forward. | **Realmbound**: the first hour made fun (RB1.10-RB1.12); end-game parked (Evan, 2026-10-12) |
| **Family games** (Evan said yes 2026-10-09) | small, alongside | Two small browser games "for everyone", each starting with its one-PR smallest test; never at the flagship's expense. | **Little Ranch** (a tap-and-play toy for ages 2-4) and **the Arcade Cabinets** (original 1978-85 style single-screen games, Storm Front first), docs/proposals/games-for-everyone.md. Little Ranch is a hit at home (2026-10-11): its next steps LR3-LR8 and new toddler toys as places inside it (LR9-LR11) follow docs/proposals/little-ranch-next.md |
| **Keep alive** | about 15% | Bugs from friends, small fixes, playtests. No new systems. | Diamond Manager (replaced Diamond Career; DM2, its playability pass, may go ahead), Otherworld, browser Wildbond (Classic), the arcade and Come Play |
| **Parked** | none | Ideas and proposals only, no builds. | Primordial, old Starfall Guild, card shop, Main Street, walk-in arcade, the AI storyteller |

Rules:
- **Bugs friends report jump every queue**, in any slot (GitHub issues, Evan's messages).
- **A game moves up a slot only when another moves down.** When the flagship reaches its goal (Wildbond 2.0), the
  second becomes flagship and the best-scoring waiting game (section 3) takes the second slot. A new idea never
  joins the build slots without taking a place from something.
- **Shared work counts for every game it helps** ("two birds with one stone", CLAUDE.md): a shared system that the
  flagship needs is flagship work, as long as it makes the flagship better now.
- **Keep-alive games still get their writing and research** when ChatGPT's own slot is blocked; they just don't get
  new systems until they move up.

## 2. The scorecard (for any feature, improvement or new game)

Score each question 1 (low), 2 or 3 (high). Total out of 21. Write the score next to the item.

| Question | Weight | Asks |
|---|---|---|
| **Fun now** | x2 | Does it make the game more fun to *play* the next time someone plays? (Not more content on paper.) |
| **Evan's heart** | x2 | How much does Evan care? (His words in CLAUDE.md, VISION.md, decisions.md; ask him if unsure.) |
| **Friends notice** | x1 | Will testers feel it in their first hour? (Bugs, confusion, phone play, the opening.) |
| **Moves the focus** | x1 | Does it finish a milestone of a focus-slot game, or unblock someone else's work? |
| **Cheap** | x1 | 3 = an afternoon, 2 = a day, 1 = several days or risky. |

Rough reading: **17+** do it soon; **12-16** it belongs in the path, in milestone order; **under 12** it waits on
the shelf (docs/ideas.md) and gets re-scored when the focus changes. Ties go to the flagship.

## 3. How ideas and improvements come in

Two project threads feed this page: **New game ideas** (research and pitches) and **Improve existing games** (reviews
of what we have). Anyone, Evan included, can add to either. The flow:

1. **Idea:** one line in docs/ideas.md (or a message). Costs nothing; never lost.
2. **Pitch:** new games are scored with the six-question card in
   [proposals/new-game-ideas.md](proposals/new-game-ideas.md) (out of 18; a pitch at 15+). For a new game, a one-page `docs/proposals/<game>-pitch.md`: the fantasy in one sentence, the core
   loop, two or three reference games and what we do better, what it shares with our games (catalogue, engine,
   universe), the smallest playable first slice, and its scorecard. For an improvement, a scored line is enough.
3. **Ranked:** the priorities owner (Claude) scores it and files it: improvements go into that game's milestone in
   DEVELOPMENT-PATH; new games go on the **waiting list** below.
4. **Picked:** a new game leaves the waiting list only when a focus slot opens (section 1) **and Evan says yes**.
   Starting or unparking a game is always Evan's call (DEVELOPMENT-PATH "Ask Evan first").

### Waiting list (new games and big unparks, best score first)

| Idea | Score | Pitch | Note |
|---|---|---|---|
| Lantern Bowl, our Retro Bowl-style football game (LB0-LB5) | 15/18 | docs/plans/sports-management.md | **Started** (Evan said yes 2026-10-09): LB0 and LB1 may be built now by any AI; LB2 onward waits for a focus slot |
| "The Crossing", sailing between the worlds | 12/18 | docs/proposals/new-game-ideas.md | Waits |
| Card shop, absorbing Main Street (CS1 + MS1) | 17/18 | docs/proposals/new-game-ideas.md | **At the back** (Evan, 2026-10-09: it is gated behind Wildbond's development). First step when its time comes: a one-PR Godot toy |
| Primordial beyond polish | 10 | docs/plans/primordial.md | Evan: lower priority |
| Walk-in arcade (AR3.1) | 10 | docs/VISION.md | Evan: the games come first |

## 4. The flagship goal, in order

**Wildbond 2.0** = the whole journey, finished and pleasant, playable on the web and on a phone, ready for friends and
then everyone (START-HERE question 1, default (a)). The game is already playable start to finish, so what is left is
what a player *feels*, in this order:

**Where it stands (2026-10-11):** done: 1 (WD1, #91), 6 (WB6.1-6.2, #107), 7 (WB5.1, #129), Thornwood in 8 (#128), the
Larkhaven homes in 10, the guide in 11 (#127). Mostly done: 3 (WB4.3 parts 1-2, #170; the rest stays with the Wildbond
builder). Next for helpers: QUEUE.md "Heavy lifting", which starts with the two playtest pass 2 blockers (Starfall's goal
line, Wildbond's keys in game).

1. **Numbers off the screen** (WD1, game review GR-4, scored 19/21): the stat line goes; a readable arrival name.
2. **Pacing and rough edges from a full playthrough** (ChatGPT's T56 pacing diagnosis, PR #83; then fixes).
3. **The ending finished** (WB4.3 with ChatGPT's WB4.4b, now that Evan chose the final truth).
4. **Creatures that look different** (WD2, GR-1, 19/21): 107 species share 10 body shapes. ChatGPT writes each
   species' look features as data now; Claude draws the parts and 4-5 new body shapes.
5. **Battles with real choices** (WD3, GR-2, 18/21): about 60 moves, family signature moves, a few statuses, an
   order per Warden; tuned with ChatGPT's pacing sim (WB3.6).
6. **Phone controls and settings in the game window** (WB6.1, WB6.2): friends play on phones.
7. **The Lighthouse Spire and rematches** (WB5.1): reasons to come back.
8. **Areas you can explore** (WD4, GR-3, 17/21 per area): each area becomes a route, a settlement and a hidden pocket,
   with spots you come back to with the right creature. Thornwood first.
9. **The Unbound appear** (WB3.7): the next layer of story and reputation.
10. **Polish that runs alongside:** depth (WB2.2), variety (WB2.3), Larkhaven homes (WB2.4), splitting main.gd as
    systems are touched (AR2.8, with GR-11's shared Godot code). More season and festival content (WS4) waits until
    creatures, battles and maps are deeper (game review).
11. **Ship it:** import a browser save (WB6.3), a guide (WB6.4), trailer and builds (WB6.5).

After-league life (contests, ranch jobs, roaming legendaries, baby forms, and now Saltmarsh fishing) is WB-M5 and comes
after 2.0 unless Evan moves it up. Evan likes these "better as features" ideas (2026-10-09). First in WB-M5: **races and contests at the ranch** (WB5.2; scored 17/18 by the New
game ideas thread), then **Saltmarsh fishing** (WB5.7, 16/18).

**Starfall (second slot), in order (refreshed 2026-10-11):** done: SF2.5 the apprentice, SF2.6 its own place
(#157), SF2.7 the wilds (#174), SF2.8 by hand (#179), SF2.17 the day-pacing check. Next: **SF2.10 the goal line**
(playtest pass 2 says Starfall fails without it), SF2.18 no mandatory chores (#187), SF2.6c and ART-SF-8 the town's
best side and square, then SF2.9 and SF2.11 to SF2.16 (darkness and progression, Adam's plan in #181), SF3.1 seasons as
chapters, SF3.4 festivals, then SF4.1 expeditions as **first-person grid delves** (16/18; a one-PR prototype first).

**Browser order (ChatGPT and any AI; refreshed 2026-10-11):** done: RB1.4 to RB1.9, AR2.11, AR2.12, OW1.1, WD2's
data. Next: WD3's move data (feeds the battles), then Diamond Manager DM3, DM4, DM-B2, DM7 (after v0.5.0, #175), Lantern
Bowl LB0-LB1, Realmbound's first hour RB1.10-RB1.12 (RB2 and RB3 parked, Evan 2026-10-12), Otherworld OW2.2, cabinet and Little Ranch polish from playtests. The
live list is QUEUE.md "The road ahead".

## 5. When to re-rank

- When a milestone finishes, a game changes slot, or Evan gives a new direction.
- Once a week otherwise: re-score the waiting list and anything new from the two idea threads.
- Each re-rank is one dated line in the log below.

## Log


- 2026-10-09 Claude: first version. Flagship Wildbond (Godot), second Starfall village, ChatGPT's own Realmbound;
  Diamond Career and Otherworld to keep-alive until Evan says otherwise. Asked Evan to confirm the focus.
- 2026-10-09 Claude: folded in the New game ideas shortlist (PR #87): card shop absorbs Main Street and tops the
  waiting list; ranch races and contests first in WB-M5, Saltmarsh fishing added (WB5.7); Starfall expeditions as
  grid delves. Primordial and the walk-in arcade keep their places; farm sim, survivors-style, puzzle, survival
  crafting and online/gacha ideas declined there.
- 2026-10-09 Claude: folded in the game review (docs/proposals/game-review-2026-10-09.md, PR #89), scored on this
  card: numbers off the screen (19), creatures that look different (19), battles with choices (18), Starfall's own
  place (18), Realmbound waits for the player (a bug, first in ChatGPT's lane), explorable areas (17), the wilds
  sooner (16), feedback and front door (14), by hand daily (14), shared Godot code (11, done as polish). Spire stays
  ahead of contests (GR-6, already so). Season and festival content slowed.
- 2026-10-09 Evan: card shop to the back (it depends on Wildbond); a Retro Bowl-style football game is a strong
  option and now tops the waiting list; the "better as features" ideas (ranch races, fishing, Starfall grid delves)
  are good direction.
- 2026-10-09 Evan confirmed: Wildbond first (flagship), as proposed.
- 2026-10-09 Evan: yes to Little Ranch and the Arcade Cabinets (Storm Front first). Placed in a small "family games"
  slot: LR1 and AC1 in DEVELOPMENT-PATH, each one smallest-test PR first. Evan: the cabinets (and Little Ranch) can be claimed by any AI that's building.
- 2026-10-09 Evan: Claude is near its usage cap and Evan's dad has two AIs helping, so the road ahead is laid out as
  ready-to-claim tasks any AI can take (QUEUE.md "The road ahead"); cabinets and Little Ranch are open to any AI.
- 2026-10-09 Evan: other AIs may build in the Godot games too, with checks (all suites green, old saves load,
  screenshots, a Claude reviewer or Evan merges). Rules in QUEUE.md "The road ahead".
- 2026-10-09 Evan: his dad's AIs have much more usage, so they take the heavy lifting (QUEUE.md "Heavy lifting": WD3
  battles, WD4 explorable areas, WB5.1 Spire, Starfall SF2.6-2.8, WB3.7 Unbound). Claude threads keep to planning,
  reviews, the ending and creature drawing while Claude's weekly usage is low.
- 2026-10-09 Evan (via the sports thread): the baseball game is one you manage (Diamond Manager, DM1 in PR #110,
  replaces Diamond Career) and a Retro Bowl-style football game goes ahead (Lantern Bowl). Diamond Manager stays
  keep-alive plus DM2; Lantern Bowl LB0-LB1 may start now, LB2 onward waits for a focus slot
  (docs/plans/sports-management.md).
- 2026-10-11: refreshed against what merged (#128 to #187): done items marked, Starfall and browser orders rewritten, the
  two playtest pass 2 blockers put first for helpers.
- 2026-10-11 Lane P: Little Ranch plan (PR #203) folded in: LR3-LR8 and places LR9-LR11 in the family slot (one toy, no new homepage icons); the first place waits for Evan's pick, the Little Wagon recommended.
- 2026-10-11 Evan picked the Paint Shed as Little Ranch's first new place (LR9), then the Little Wagon (LR10) and the Snack Kitchen (LR11).
- 2026-10-12 Evan, via lane P: Realmbound's end-game work (RB2.1, RB2.2, RB3.x) is parked until a newcomer scores its first hour 17+; RB1.10-RB1.12 come first. New arcade rule "Play, not watch" in GOALS.md (less automatic play, no full Auto); audit and tasks RB1.11 and AR2.14.
