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

**Launch mode** (Evan, 2026-10-14, updated the same day): quality and launchability come before breadth. This table replaces the older share-of-effort split. The one-page dates are in [launch-summary.md](plans/launch-summary.md).

| Slot | What it means | Now (2026-10-14) |
|---|---|---|
| **Launch** (four games, the strong push; Evan, 2026-10-18) | Only work that ticks a checklist item. No new content until that game's checklist is done. Finished means it is playable and fun, not merely merged. | **Little Ranch** ([launch-little-ranch.md](plans/launch-little-ranch.md)), **Night Market** ([launch-night-market.md](plans/launch-night-market.md)), **Wildbond** (launch-wildbond.md), **Keymaster** ([launch-keymaster.md](plans/launch-keymaster.md)). Lantern Bowl is shelved (2026-10-18). Night Market includes IDLE-CORE, merged in #393. #403 is IDLE-NM1 and a launch task |
| **Wildbond** (steady background) | Checklist fixes, steadily. The long project, not the first to ship. New creatures, areas and features wait until its checklist is done. | launch-wildbond.md. Partial newcomer run, 2026-10-14: about 6 minutes on an existing save, Fun 5/10. Phone not yet tested |
| **Keep-alive** | Bug fixes only. No new content. Pull requests already open or claimed may finish. | Starfall, Keymaster, Diamond Manager, the cabinets, Realmbound, Otherworld. #341 (Starfall taps) is already merged. The Starfall exact-build preview for #323 and #325 is not now. Evan, 2026-10-27: finish the Saltmarsh Shipping Office (#619, then IDLE-SS1b) before polishing Otherworld, Keymaster or Diamond Manager into finished games |
| **Shelved** (Evan, 2026-10-13, AR-SHELVE) | Off the site; code, folders and saves kept, old links still open. No work. | **Diamond Career** (Diamond Manager replaced it), Classic Wildbond, Classic Starfall Guild |
| **Shelf** | Ideas and new content. The list is [ideas.md](ideas.md). | WB-NOSTALGIA, roster growth, WB2.2, LR19–LR22, IDLE-CS1, IDLE-DP1, Keymaster and Main Street new content, the Starfall exact-build preview, Primordial, the walk-in arcade. IDLE-SS1 left this shelf on 2026-10-23 (reconfirmed 2026-10-27) and is active: #619 first, then IDLE-SS1b |

**Where the effort goes** (a suggestion, not a new slot count): most of it on the three launch games. Side Games Dev Lead takes the Little Ranch and Lantern Bowl bundles. Guest lane (#373) takes the Night Market bundles. Wildbond & Starfall Dev Lead takes the Wildbond bundles. Payback hint and offline label are done (#421).

**First in each lane** after Playtester's 2026-10-14 scores (Night Market 5/10, Lantern Bowl 6/10, Little Ranch 7/10). These sit ahead of the older gaps in [QUEUE.md](QUEUE.md).

- **Night Market:** Guest lane (#373). NM-PLAY first (pour, save controls, the 22.0s trailing zero). Then NM-VIS, both pictures in one pull. Then the phone layout and the hall entry. Payback and the offline label are done.
- **Lantern Bowl: shelved by Evan, 2026-10-18 (see the Log). No new work.** History: Side Games Dev Lead. LB-GAMEFLOW first. It is in progress, and its pull request is pending. The play screen is done (#432, `0bf5f0d`). Then LB-FEEL, LB-PLAYBOOK-DATA (dot, data only, feeding LB-MANAGER), LB-MANAGER, and LB-SEASON. The season changes the save, and that design needs Evan's sign-off via the Director before merge. On a phone it is landscape-only. Held upright, it shows "Turn your phone sideways", the way ALL-22 does. Portrait will not get its own layout. Launch is 20 October likely and 30 October slower. One bundle on its own is 16 October and 22 October. Describe Retro Bowl's and ALL-22's techniques only, and never copy their code or assets.
- **Little Ranch:** Side Games Dev Lead. LR-POLISH first. The layout row is done (#424). LRL-1 is done (#417, `e352a7b`). Dough dots, the fox and the sign wiggle remain, plus three non-blocking notes from the #417 pass: bigger, longer bedtime cues, a slower dusk fade, and feedback for leaving the paint shed early. The sound preference is still open.
- **Wildbond:** Wildbond & Starfall Dev Lead. The open bundle is #429: the Larkhaven menu, the catch and the objective. WBL-2 is done (#418). WBL-6 is done (#406, `440e4d6`). WB-PHONE builds the upright layout and removes the rotate gate.
- **Phone:** LRL-11 and NM-FIX-7. Owner: Playtester. Not build pulls. Lantern Bowl on a phone is landscape-only, and that landed in LB-PLAYSCREEN (#432). Portrait shows "Turn your phone sideways" and will not get its own layout. Wildbond's phone work is WB-PHONE.

**Finished means playable and fun.** A newcomer gets through the first session without help, Playtester scores fun at least 7/10, there is no blocker or major bug, it plays on a phone where that applies, and there is one clear goal. Further improvements do not hold it. Merging alone does not count. Playtester or Evan confirms it.

**Weekly playtest:** each week Playtester plays each launch game, and Wildbond, as a newcomer and scores it. The lowest-scoring part of that game becomes its next task.

**Already merged:** Lantern Bowl 5a (#383), the Lantern Bowl play screen (#432, `0bf5f0d`), Night Market (#403), LR17 (#381), LR18 (#400), #380 and #399. **On hold:** #404 LR19 and #409 LR20. #400 LR18 (Grok, opened before the hold) may finish as Little Ranch launch polish. #381 LR17 was also opened before the hold and may finish; it is not required for the checklist. LR19–LR22 wait on the shelf until the Little Ranch checklist calls for them.

Rules:
- **Bugs friends report on a launch game or on Wildbond** become the next gap on that checklist. A bug on a keep-alive game may be fixed. It does not start new content.
- **CS1 and DP1** wait until Night Market has been playtested. **SS1** does not. Evan approved the Saltmarsh Shipping Office on 2026-10-23 and reconfirmed it on 2026-10-27. It is active. #619 is first, then IDLE-SS1b. Finish that office before polishing Otherworld, Keymaster or Diamond Manager into finished games.
- **Shared work counts when it ticks a checklist item** (the Continue save path, ENGINE-SAVEVER). It does not open a new game.

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
| Lantern Bowl, our Retro Bowl-style football game (LB0-LB5) | 15/18 | docs/plans/sports-management.md | **Shelved (Evan, 2026-10-18).** Retro Bowl and Super Tiny Football already do this well. Was a launch game: The approved scope, a season, real blocking, ratings from 35 to 90, a breaking-route playbook, progression and a defence choice, is on [launch-lantern-bowl.md](plans/launch-lantern-bowl.md). Describe techniques only. Never copy Retro Bowl's or ALL-22's code or assets |
| "The Crossing", sailing between the worlds | 12/18 | docs/proposals/new-game-ideas.md | On the shelf |
| Card shop, absorbing Main Street (CS1 + MS1) | 17/18 | docs/proposals/new-game-ideas.md | **Card Shop lite (IDLE-CS1) is approved**, and the Wildbond gate on that lite slice is lifted, but it waits until Night Market (IDLE-NM1) has been playtested. The full roster tie-in stays behind Wildbond |
| Keymaster, a property-portfolio game around Evan's deal analyzer (KM0) | 18-19/21 | docs/proposals/keymaster.md | **Launch game (Evan, 2026-10-18).** The smallest slice is merged (#379). Only work that ticks [launch-keymaster.md](plans/launch-keymaster.md) |
| Primordial beyond polish | 10 | docs/plans/primordial.md | Evan: lower priority |
| Walk-in arcade (AR3.1) | 10 | docs/VISION.md | Evan: the games come first |

## 4. The flagship goal, in order

**Launch mode overrides this section** (Evan, 2026-10-14). The strong push is the Little Ranch, Night Market, Wildbond and Keymaster checklists (Evan, 2026-10-18; Lantern Bowl shelved). Wildbond's long list below waits until its own checklist is done. This section is what the games are for after they are playable and fun.

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

- 2026-10-18 Evan (via Claude): **Lantern Bowl is shelved.** Evan, 2026-10-18: "Lantern Bowl sucks in its current state and likely should be shelved. Retro Bowl and Super Tiny Football are better and almost free ... it doesn't feel like it makes sense to waste any more development time." It leaves the homepage (moved to `ArcadeOffShelf` like the Classics); its code, folder, save key and direct link stay. The launch list becomes Little Ranch, Night Market, Wildbond and Keymaster ("Wildbond and Keymaster also make the list"). The open Lantern Bowl pulls (#513, #533, #534, #536) are closed unmerged, and the guest rows are marked shelved.

- 2026-10-13 Claude (lane P): cycle 1 revised on Evan's word ("the playtests are a waste until we update beyond Flint's notes"): every game's tasks come from Flint's three rounds; new playtests and Lantern Bowl wait for cycle 2.
- 2026-10-13 Claude (lane P): the studio plan's weekly cycle now runs the order. Cycle 1 (QUEUE.md "This cycle"): Wildbond, Little Ranch, Starfall in the rotating slot (lowest newcomer score, 10/18), Lantern Bowl in the Incubator, plus the Phase 0 front door. Cycle 2's rotating game is Realmbound.

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
- 2026-10-12 Evan: "a large runway for the AIs to push, and a clear direction". QUEUE.md now opens with "The direction" (five priorities and the rules); Heavy lifting rebuilt to 20 builds (H1-H20) and the road to 16 rows (about 35 tasks); Lantern Bowl LB2+ takes the sports slot; new cabinets AC5, AC6; WD3 (#125) ticked.
- 2026-10-12 Evan: the project becomes Generations (rename ticket AR-REN, waits for Evan to approve the sequence; tagline not yet picked). GOALS gains earned automation, not autoplay, and five-minute sessions. Keymaster scored 18-19/21 and parked until Evan gives it a slot.
- 2026-10-12 Evan: tagline decided, "Play for the fun. Automate the grind."; the rename is greenlit, with its order (rename-checklist.md "Proposed order") waiting for Evan's approval.
- 2026-10-12 Evan (via Flint): after the playtest fixes, develop the business games first (Diamond Manager toward one sports front office with a game you play inside; Starfall Guild's manager loop). QUEUE: DM5 moves ahead of Lantern Bowl; DM-N1 and SG-N1 stay right after the newcomer fixes. Passions first: games that may interest anybody, led by what we love.
- 2026-10-12 Evan (decision card): Starfall Guild's best loops fold into the Godot Starfall village (SF-GUILD, Heavy lifting H21); the browser Starfall Guild gets fixes only (SG-N1).
- 2026-10-14 Evan, via Generations Director: office idle is a small slot alongside the others, not ahead of Wildbond. Build all four concepts as small playable slices on a shared idle core (IDLE-CORE, then IDLE-NM1, IDLE-SS1, IDLE-CS1, IDLE-DP1). Card Shop lite (Main Street's shop loop with placeholder stock) is approved, which lifts the Wildbond gate on that lite slice. His words: "push as many options as possible and see what sticks and what's fun."
- 2026-10-14 Evan, later the same day: quality and launchability come before breadth. This replaces the "build all four office idle games now" line above. Launch games are Little Ranch, Lantern Bowl and Night Market (Night Market includes IDLE-CORE, merged in #393; #403 is IDLE-NM1 and a launch task). Wildbond is a steady background lane, not the first to ship. Keep-alive games get bug fixes only. SS1, CS1 and DP1 wait until Night Market has been playtested. LR19–LR22 and the Starfall exact-build preview (#323/#325) are on the shelf in docs/ideas.md. #400 LR18 may finish as Little Ranch launch polish. Finished means playable and fun, confirmed by Playtester or Evan. The bar is fun at least 7/10. The SS1 part of this wait was lifted on 2026-10-23; see the next office-idle lines. CS1 and DP1 still wait.
- 2026-10-23 Evan: "Yes, start Saltmarsh Shipping Office now in parallel", after the Night Market playtest. IDLE-SS1 is active. #619 is the first pull. IDLE-CS1 and IDLE-DP1 stay on the shelf.
- 2026-10-27 Evan reconfirmed IDLE-SS1. Finish the Saltmarsh Shipping Office (#619, then IDLE-SS1b) before polishing Otherworld, Keymaster or Diamond Manager into finished games. Capt. Wren and Pell stay in Saltmarsh.
