# The work queue (autopilot)

Evan (2026-10-07): "create a task list for ChatGPT so I don't need to keep individually prompting it, and let you both
run on it", with Grok possibly joining. This page is that list. Each assistant has a **lane**: an ordered list of
tasks whose files don't overlap with the other lanes, so all of them can work at once. Work top to bottom, one task
after another, without waiting to be prompted. Projects and their specs live in [PROJECTS.md](PROJECTS.md); the rules
and how much creative freedom you have are in [CREATIVE.md](CREATIVE.md).

## This cycle: cycle 1, Tuesday 2026-10-13 to Monday 2026-10-19 (read this first; it overrides every list below)

**Launch mode** (Evan, 2026-10-14, updated the same day): quality and launchability come before breadth. The strong push is three launch games. Wildbond is a steady background lane. Each task has exactly one current owner. Claim it with a draft PR titled with its ID (PROCESS.md). **Chunks** (Evan, 2026-10-14): one pull request per fix list or feature area, and one game per pull request. Split a chunk only when one area gets genuinely risky. Guardrails stay: tests green, old saves load, screenshots, Game Art Director reviews any art, and no save-format change without Evan. **Only Generations Reviewer merges**; nobody merges their own PR. Nothing outside this block starts.

**Launch games: Little Ranch, Lantern Bowl and Night Market.** For those three, the only new work is something that ticks an item in [launch-little-ranch.md](plans/launch-little-ranch.md), [launch-lantern-bowl.md](plans/launch-lantern-bowl.md) or [launch-night-market.md](plans/launch-night-market.md). No new content until that checklist is done. **Finished means playable and fun:** a newcomer plays the first session without help, Playtester scores fun at least 7/10, there is no blocker or major bug, it plays on a phone where that applies, and there is one clear goal. Merging alone does not count. Dates are measured from merged pulls, in [launch-summary.md](plans/launch-summary.md).

**Wildbond** is the long project, not the first to ship. Steady checklist fixes are in [launch-wildbond.md](plans/launch-wildbond.md). WB-NOSTALGIA, roster growth and WB2.2 wait until that checklist is done.

**Weekly playtest:** each week Playtester plays each launch game, and Wildbond, as a newcomer and scores it. The lowest-scoring part of that game becomes its next task.

**Night Market:** IDLE-CORE is merged (#393, cae662e). #403 (IDLE-NM1) is merged (`d9cde61`). The hall entry (NM-HUB) still needs its own claim. IDLE-SS1, IDLE-CS1 and IDLE-DP1 wait on the shelf until Night Market has been playtested.

**Already merged:** #383 Lantern Bowl 5a, #432 the Lantern Bowl play screen (`0bf5f0d`), #400 LR18 (`43785a4`), #381 LR17, #424 the Little Ranch layout row (`e66ddbc`), LRL-1 bedtime (#417, `e352a7b`), #449 Little Ranch polish (`44f49c2c`), #438 Night Market visuals (`4e92d87a`), NM-FIX-6 as #461 (`1d36ee61`), #413 the Wildbond menu (`bb4031c`), #418 fair battles (`56204cc`), WBL-6 battle sprites (#406, `440e4d6`), #415, #380 WB-FUNNEL1, #399 the pond. **On hold:** #404 LR19 and #409 LR20. Other pull requests already open may finish. LB-GAMEFLOW is in progress, and its pull request is pending. The open Wildbond bundle is #429. Describe Retro Bowl's and ALL-22's techniques only, and never copy their code or assets.

**Keep-alive** (bug fixes only, no new content): Starfall, Keymaster, Diamond Manager, the cabinets, Realmbound and Otherworld. #341 (Starfall taps on the scaled screen) is already merged; do not start it again. The Starfall exact-build preview release for #323 and #325 is not now; it is on the shelf in [ideas.md](ideas.md).

**Owners:** Side Games Dev Lead takes the Little Ranch and Lantern Bowl bundles, except the data pieces LB-G1 to LB-G6, which are guest rows. LB-PLAYBOOK-DATA merged as #451. LB-FEEL, LB-MANAGER and LB-SEASON integration stays with Side Games Dev Lead. Guest work is the standing list in [plans/guest-backlog.md](plans/guest-backlog.md). Generations PM keeps at least 8 priority rows per guest and tops up whenever either guest drops below 4. Grok's current task is WBW-4. Then LR-G2, LB-G13, LB-G14, LR-G3 and NM-G8, then LR-G1, WBW-7, WBW-9, WBW-11, WBW-13, WBW-15 and WBW-17. Open priority rows left: 13. LB-PAL is unassigned and waiting on Game Art Director's merge spec. It is not on either guest's ready list until that spec exists. In review, counted done, and not a wait: LB-G7 is #495, NM-G4 is #498, and NM-G5 is #500. Dot's current task is WBW-5 (#501). Then NM-G3 (#499), which is unblocked by the header-grid ruling on #373, then NM-G6, LB-G11, LB-G12, NM-G9 and NM-G7, then WBW-8, WBW-10, WBW-12, WBW-14, WBW-16 and WBW-18. Open priority rows left: 13. Dev lead keeps the Night Market reset and new game, Mooncake and cart balance, NM-HUB, the district move, and all Lantern Bowl wiring into game.js and model.js plus the season save design. The held toy pulls #404 to #412 will conflict with LR-G2 and LR-G3, and that is expected. In review, counted done: LB-G10 is #496. The holds on #480, #482 and #483 are over, because those pulls have merged. The WBL-8 to WBL-10 fixes now belong to the Wildbond dev lead. Done, do not reopen: LB-G1 #472, LB-G2 #478, LB-G3 #480, LB-G4 #474, LB-G5 #479, LB-G6 #481, LB-G8 #494, LB-G9 #489, NM-G1 #482, NM-G2 #483, WBW-1 #485, WBW-2 #490, WBW-3 #487, WBW-6 #492, WB-ROAD #467, LB-PLAYBOOK-DATA #451, NM-PHONE #456, #449 (`44f49c2c`), #438 (`4e92d87a`), and NM-FIX-6 as #461 (`1d36ee61`). There is no LB-G4b row. WB-LOOK stays a draft at #466 and is not the current task. The Wildbond fix bundle merged as #458. Wildbond & Starfall Dev Lead reviews the WBW pulls. Side Games Dev Lead reviews the launch-game guest pulls. Payback hint and offline label are done (#421, `1459413`). NM-RETUNE is merged (#445). NM-HUB stays with Side Games Dev Lead.

Take a game's rows from the top. The full gap lists, the must-haves, and what does not block finish are in the four checklists.

| # | Game | ID | Task | Owner | Done when |
|---|---|---|---|---|---|
| 1 | Little Ranch | LR-POLISH | Done (#449, `44f49c2c`). Dough colour dots, the fox, the sign wiggle, the longer bedtime cues, and the slower dusk fade are merged. Do not reopen it. The kitchen bowl, the console 404 and sign tap responses stay LR-TOY-POLISH with Side Games Dev Lead (#460) | Done (#449, `44f49c2c`) | Merged. The kitchen bowl, the console 404 and sign tap responses stay on #460 |
| 1 | Little Ranch | LR-VISIT | First visit, one pull. Bedtime in the first sitting is done (LRL-1, #417, `e352a7b`). The sound preference is still there after a reload (LRL-4). No save-format change | Side Games Dev Lead | A reload keeps the sound preference. Old saves load |
| 1 | Little Ranch | LRL-11 | The phone layout still needs a playtest. Not a build pull | Playtester | A played phone session is scored |
| 1 | Lantern Bowl | LB-GAMEFLOW | First open bundle. In progress, pull request pending. One pull for 5c, a defence choice for each opponent drive, a slower clock, field goals and punts, varied quick-pass yardage, and Playtester's five #432 bugs: aim feedback and the catch window, the quarterback at the screen edge, the hidden toast, the target receiver highlight, and run labels. The play screen is done (#432, `0bf5f0d`). Phones stay landscape-only. Describe techniques only | Side Games Dev Lead | The defence can be chosen, the clock is slower, 4th down can kick or punt, quick passes do not all gain the same yards, and the five #432 bugs are gone. Screenshots included |
| 1 | Lantern Bowl | LB-FEEL | Game feel from the comparison, one pull. Sound on by default, a touchdown fanfare and banner, a short hit-stop and a small shake on a tackle or a catch, a crowd bed, a guided first snap, and a two-tap kick. The behind-the-play camera can be the default, with side-on kept as an option | Side Games Dev Lead | A touchdown is heard and shown, a hit has a short stop, and the first snap is guided. Screenshots included |
| 1 | Lantern Bowl | LB-PLAYBOOK-DATA | Done (#451). Play and route definitions are merged. Do not reopen it | Done (#451) | Merged. The data file holds the plays and the breaking routes |
| 1 | Lantern Bowl | LB-MANAGER | Ratings from 35 to 90, real blocking set by the line versus the pass rush, and the expanded playbook once LB-PLAYBOOK-DATA is in | Side Games Dev Lead | Players differ from 35 to 90, blockers hold the rush, and the new plays are callable |
| 1 | Lantern Bowl | LB-SEASON | The franchise season on `shared/sports-office.js`, and player progression. Save-format change. The save design needs Evan's sign-off via the Director before merge | Side Games Dev Lead | A season can be played, players progress, and Evan has signed off the save before merge. Old saves still load |
| 1 | Night Market | NM-FIX-6 | Done (#461, `1d36ee61`). "Your save" and the away summary after a reload are merged. Do not reopen it | Done (#461, `1d36ee61`) | Merged. Old saves load |
| 1 | Night Market | NM-VIS | Done (#438, `4e92d87a`). The approved visuals are merged. Do not reopen it | Done (#438, `4e92d87a`) | Merged |
| 1 | Night Market | NM-PHONE | Done (#456). The phone layout is merged. Do not reopen it | Done (#456) | Merged. The back control does not cover another button, and a phone shows a stall without a scroll |
| 1 | Night Market | NM-HUB | Hall and launcher entry, one pull. #403 did not add this. Not a guest row | Side Games Dev Lead | A newcomer can open the stall from the hall. `node tools/launcher-checks.cjs` passes |
| 1 | Night Market | NM-FIX-7 | The phone layout still needs a playtest. Not a build pull | Playtester | A played phone session is scored |
| 1 | Night Market | NM-RETUNE | Merged (#445). Does not block the first session. 1M lifetime coins arrives in about 8 minutes. Section 8 wants the district move at 45–75 minutes. Do not open this again | Done (#445) | Merged. The district move is not offered in the first few minutes. Old saves still load |
| 1 | Night Market | NM-CLAMP | SSA, not blocking. The idle-core per-tick clamp holds one tick to `maxOfflineSec` | Shared Systems Architect | SSA's ruling stands. A single tick is held to `maxOfflineSec` |
| 2 | Wildbond | WB-OPEN | First in this lane. Menu and battle start. The open Wildbond bundle is #429. WBL-2 is done (#418, `56204cc`). The menu and Choose Ripplet merged in #413 (`bb4031c`). This pull fixes the regression: the Larkhaven menu does not open | Wildbond & Starfall Dev Lead | The Larkhaven menu opens. Old saves load |
| 2 | Wildbond | WB-PHONE | Upright phone layout, one pull. Build it to Game Art Director's spec (docs/art/wildbond-upright-layout.md, the 16-item checklist). Remove the rotate gate. Game Art Director art-checks it | Wildbond & Starfall Dev Lead | The game plays upright, the rotate gate is gone, and Game Art Director has art-checked it. Screenshots included |
| 2 | Wildbond | WB-CATCH | First catch. Part of #429. An obvious Catch button and a guided first catch (WBL-3), and the objective tracker (WBL-4) | Wildbond & Starfall Dev Lead | A newcomer catches the first partner without help, and the objective fits on screen |
| 2 | Wildbond | WB-LOOK | Early pace (WBL-5), plus WBL-13 if that sprite fix is small. The nine battle sprites are done (WBL-6, #406, `440e4d6`). Mosshog stays on the older art. Stay out of the Wildbond fix bundle (#458). Rebuild play/wildbond/index.pck only once, as the last step, and only if no other open pull already carries one | dot (guest AI) | The early route has encounters and healing |
| 2 | Wildbond | WB-ROAD | Done (#467). The Continue test is merged. Do not reopen it. The WBL-8 to WBL-10 fixes belong to the Wildbond dev lead | Done (#467) | Merged |
| 3 | Docs | DOCS-ACC1 | README and site accuracy. README Games table: Realmbound is Beta, levels 1–60, not Prototype 1–40. The table is missing Starfall Guild, Diamond Manager, the cabinets, and Keymaster (or a note that Keymaster is hidden on purpose). Confirm the homepage still leads with Wildbond after #401. Rewrite docs/SITE-AND-GUIDES.md "Two editions" as shelved Classics, reachable only by direct URL. README Layout and the Run locally line need a macOS/Linux line beside `serve.ps1` | Docs Keeper | A reader of the README and the homepage can see the real status of each game, including what is hidden on purpose |
| 3 | Site | WEB-A11Y-FIX | `tools/accessibility-checks.cjs` still has a Windows-only Chrome path and a Windows-only screenshot path (`process.env.TEMP`). `.launch-modes` is gone from the homepage after #401. Confirm the check does not wait on it. `tools/run-all-checks.cjs` already picks a browser on macOS and Linux | Website Lead | The check runs on macOS and Linux without a Windows Chrome path or `TEMP`, and it does not wait on `.launch-modes` |
| 3 | Site | WEB-THUMBS | Recapture the Lab title-box pictures in `images/lab/` from real gameplay, Lantern Bowl first (`images/lab/lantern-bowl.jpg`) | Website Lead | The Lab cards show a moment of play, Lantern Bowl first, and `node tools/launcher-checks.cjs` passes |
| 3 | Shared | WBL-11 | Done (#415, `5a88c12`). A migrate that returns null holds the session. Off the blocking path | Shared Systems Architect | Merged. The save is untouched and saving stays off. Old saves load |
| 3 | Shared | WBL-12 | Done (#415, `5a88c12`). Erase leaves a held save on the hub. Off the blocking path | Shared Systems Architect | Merged. A held save still shows on the hub and is not written over |

**Not separate rows.** The gaps inside a bundle are not their own pulls. The Lantern Bowl phone rows and the ratings narration landed in LB-PLAYSCREEN (#432). 5c, the defence choice, the clock, field goals, punts, quick-pass yardage and the five #432 bugs are LB-GAMEFLOW. LB-PLAYBOOK-DATA is its own row because it is data only, and it feeds LB-MANAGER. LRL-13, LRL-14 and LRL-15 ride inside LR-POLISH and do not block finish. LRL-11 and NM-FIX-7 are Playtester sessions, not build pulls. #404 LR19 and #409 LR20 stay on hold. Dates count bundles, in launch-summary.md. Lantern Bowl's launch dates are 20 October and 30 October. One bundle on its own is 16 October and 22 October. NM-FIX-1 and NM-FIX-2 are done (#421, `1459413`). WBL-2 is done (#418). The Little Ranch layout row is done (#424). WBL-11 and WBL-12 are done (#415). LRL-1 is done (#417, `e352a7b`). WBL-6 is done (#406, `440e4d6`). The open Wildbond bundle is #429. Lantern Bowl on a phone is landscape-only. Portrait shows "Turn your phone sideways" and will not get its own layout. Describe Retro Bowl's and ALL-22's techniques only, and never copy their code or assets.

**Touch rule for guests** (2026-10-15): claims and handoffs go in a #373 comment or [plans/guest-backlog.md](plans/guest-backlog.md). Feature PRs never edit docs/COMMS.md. Only Generations PM's post-merge bookkeeping touches COMMS. Guest rows do not edit `shared/` or `sw.js`. Claim `index.html` or launcher files on #373 before editing them, and only when the row names those files. START-HERE stays off-limits; only Generations Reviewer merges, by squash.

**Routing:** Generations PM. **Questions for Evan:** Generations Director.

**Spare effort** (only after your own row is done or blocked): the next unticked must-have on a launch checklist, then a Wildbond must-have, then nothing new. No catalogue batch, no Keymaster or Main Street content, no new Realmbound work, no LR19–LR22, no Starfall preview release. Guest AIs do not use this spare-effort line. When a guest finishes or is blocked, they claim the next open Priority row for them in [plans/guest-backlog.md](plans/guest-backlog.md) as a #373 comment and start it. Grok's order is WBW-4, then LR-G2, LB-G13, LB-G14, LR-G3, NM-G8, then LR-G1, WBW-7, WBW-9, WBW-11, WBW-13, WBW-15 and WBW-17. Dot's order is WBW-5, NM-G3, then NM-G6, LB-G11, LB-G12, NM-G9, NM-G7, then WBW-8, WBW-10, WBW-12, WBW-14, WBW-16 and WBW-18. Bug-fix rows wait until those Priority rows are taken. They do not edit docs/COMMS.md. Generations PM keeps at least 8 priority rows per guest and tops up whenever either guest drops below 4.

**Superseded or done:** IDLE-CORE is done (#393, cae662e). WB-BOND is done (#339, merged; the bond-plus-level rule is DD-5). LB2 is #359, done via #369 (cd491bd). Done: SF-GUILD1 (#360), DM-N1b (#269), DM-N1c (#310), SG-N1 (#264), AR-FRONT and AR-SHELVE (#316, #319), WB-C2 (#279), RB1.12a (#283), LR-C1 (#281), LR3 (#289), LR10 (#290). EVO-1 is done (#366, 9cc9788, follow-up #370, d82363f). WB5.6 is done (#368, 8d6886a, 189 species). OW-N1 is done (#378). KM0's smallest slice is merged (#379). SF-TAP (#341) is merged. NM-FIX-1 and NM-FIX-2, the payback hint and the offline label, are merged (#421, `1459413`). On the shelf in docs/ideas.md: NOS-1a..e, roster growth, WB2.2, SF-GUILD2, MS1, IDLE-SS1, IDLE-CS1, IDLE-DP1, LR19–LR22, and the Starfall exact-build preview for #323 and #325. LR17 and LR18 stay in this cycle because they were opened before the hold.

## Out of this cycle (backlog; rows moved unchanged from cycle 1, 2026-10-14)

These rows left "This cycle" when Evan reset the priorities. Text, owner and done-when are exactly as they were; only the Status column is new (and the Game cell is filled in where it was blank).

| Game | ID | Task (Flint's note) | Who | Done when | Status |
|---|---|---|---|---|---|
| Wildbond | WB-C3 | Wildbond on a phone: the web preview held sideways walks, talks, battles and opens the bag by touch | Claude, Wildbond builder | A phone-size run recorded in the PR | in draft PR #361 |
| Wildbond | WB-C4 | Larkhaven and the first route at their best | Claude, Game assets | Before and after screenshots; the Art direction thread approves | open |
| Diamond Manager | DM-N1d | Dugout calls with visible risk: steal, hit-and-run, intentional walk, pinch hitter (note 1) | ChatGPT/Codex | Same | PR #347 closed 2026-10-14; rebuild from fresh main when back in cycle (see #347 closing comment) |

## The direction (the long view behind the cycles; Evan, 2026-10-12: "a large runway for the AIs to push, and a clear direction")

**What we're making:** real games you play, not watch. **Passions first** (Evan, 2026-10-12): games that may interest
anybody, led by what we love; the audience follows (not a checklist of ages). In order of what matters now:

1. **Every game passes a newcomer playtest** (GOALS.md short term). A stranger opens it, knows what to do, has fun in
   the first ten minutes, and scores it 15+ (17+ for the focus games). Bugs friends report jump every queue.
2. **Wildbond 2.0, the flagship:** battles with choices, every area explorable, creatures that look different, a living
   ranch, the Unbound. Done when a newcomer finishes the journey on a phone and wants the post-game.
3. **Starfall's first season:** mastery, hires who work at your rank, trust, darkness, then a season that ends in a
   festival.
4. **Realmbound's first hour made fun** (end-game parked), then **the business games** (Evan, 2026-10-12: develop
   the tycoon games once the playtest fixes land: Diamond Manager deeper, toward one sports front office with a game you
   play inside it, and Starfall Guild's best loops folded into the Godot village, SF-GUILD), then **Lantern Bowl playable**.
5. **The family games:** Little Ranch's next steps and places (the Paint Shed first), and more cabinets.

**The rules every task keeps:** play, not watch (no game plays itself, no new full Auto); the screen is the world (no
side panels); old saves load; our own look (docs/art/README.md); the "Ask first" list in PROCESS.md. **How to take
work:** PROCESS.md (claim with a draft PR titled with the ID, build, self-check, merge). **Order:** Heavy lifting
(Godot) and The road ahead (browser) below, top first; past the end of both, PROCESS.md "When you get ahead of the
road". Lane P (Priorities and direction) keeps both lists 20 deep. **These lists are the backlog: each cycle's tasks are drawn from them, and only "This cycle" is worked.**

**Keymaster (KM0):** approved by Evan and in review in #379. The rename to Generations is done (2026-10-12): the repository is `ecbarish/generations`, the old address forwards, and the tagline is "Play for the fun. Automate the grind."

## Who works where (lanes, updated 2026-10-09)

Evan (2026-10-09): "make sure assistants are working on different things and make different lanes for development so
AIs can claim different progression." By then several Claude threads worked at once beside ChatGPT, so "Claude" is no
longer one lane. **Each lane owns a set of files**, so lanes can't collide, and **a lane takes work in the order of
[PRIORITIES.md](PRIORITIES.md)**. Pick the lane that matches your thread or assistant; if none does, take the
"Open" lane. A lane with no owner can be taken by anyone: write your name in the Owner column on your branch's first
commit.

| Lane | Owner | Owns these files | Takes from the path |
|---|---|---|---|
| **W: Wildbond (Godot)**, the flagship | Claude: "Wildbond builder" thread (started 2026-10-09) | `wildbond-godot/` (except `assets/`), `play/wildbond/` | Every `[Claude]` WB, WD and WS deliverable, AR2.8 (splitting main.gd) |
| **S: Starfall (Godot)** | Claude: "Continue Idle Arcade games" thread | `starfall-godot/` (except `assets/`), `play/starfall/` | Every `[Claude]` SF deliverable |
| **A: browser games, data and lore** | ChatGPT/Codex | `games/`, `tests/*.html`, `docs/lore/`, the hub and launcher, `guides/` | Every `[ChatGPT]` deliverable (table below) |
| **G: art, sound and music** | Claude: "Game assets" thread | `*/assets/`, `shared/` art and sound, `CREDITS.md`, `licenses/` | Asset requests from any lane; hands wiring code to W or S as a short note in COMMS |
| **T: tools and craft** | Claude: "Best practices" thread | `tools/`, `.github/`, `docs/learning/`, `.gitattributes` | AR2.x tooling, CI; changes to game code go to W or S as a ticket |
| **R: reviews and merges** | Claude: "PR reviewer" and "Merge conflict fixer" threads | Merge commits, version numbers, README version lines | B0 below: review, test and merge every waiting PR; fix conflicts on others' PRs |
| **P: planning** | Claude: "Priorities and direction" thread | `docs/PRIORITIES.md`, the order and owner tags in `docs/DEVELOPMENT-PATH.md`, this page's lanes, START-HERE "Where we are" and "Up next" | Scoring and placing ideas; refilling lanes |
| **Q: design decisions** | Claude: "Design decisions" thread (started 2026-10-09) | `docs/DECISIONS.md` | Answers design questions from any lane (ask in COMMS "to Claude (Design decisions)"); turns answers into notes or tickets for the lane that builds |
| **I: ideas and reviews** | Claude: "New game ideas" and "Improve existing games" threads | `docs/proposals/`, `docs/ideas.md`, `docs/research/` | Proposals only; lane P places them |
| **D: local helper** | Ollama on Evan's PC | its own clone, read-only jobs | Lane D table below |
| **C: the Studio** | Grok (Adam's assistant, 2026-10-09) | `studio.html`, `studio/`, `tests/studio.html` and `tests/studio-checks.js` | Lane C table below (E4, E5, E7 and playtesting) |
| **X: guests** | Anyone outside the team with their own AI (first: Evan's dad, GitHub `abarish-dev`); start at [CONTRIBUTING.md](../CONTRIBUTING.md) and [plans/guest-backlog.md](plans/guest-backlog.md) | Only the files the task names | The guest backlog; claim the next row on #373 |

**Files every lane touches, kept to one line each:** START-HERE's Session log (your dated line at the top), README's
changelog (your entry at the top), and ticking your own deliverable in DEVELOPMENT-PATH. Feature PRs never edit docs/COMMS.md. Claims and handoffs go in a #373 comment or [plans/guest-backlog.md](plans/guest-backlog.md). Only Generations PM's post-merge bookkeeping touches COMMS. Anything
more in another lane's files: ask in a #373 comment or a GitHub issue, or keep it to a few lines and say so in your PR.

## Claiming, submitting and merging: see [PROCESS.md](PROCESS.md)

One page for every AI and thread: pick, claim with a draft pull request **before** building, build, submit (mark it
ready) after a written self-check. **Only Generations Reviewer merges**; nobody merges their own pull request.

## Heavy lifting (for the AIs with the most usage: Evan's dad's AIs first; refreshed 2026-10-12)

Evan: "my dad's AIs have much more usage available, so we can steer them to a lot of the heavy lifting." These are the
**big builds**, in the order that matters most. They are Godot work: follow the Godot rules under "The road ahead"
(all checks green, old saves load, screenshots, the self-check in docs/PROCESS.md). Before starting, check the open
pull request list. One task per pull request; split a big one into steps and open the next when the first is merged.

**Done since the last refresh (2026-10-12):** WD3 battles with real choices (#125), SF2.6c Starfall's best side
(#200), SF2.10 the goal line (#195), SF2.18 no mandatory chores (#187), WB4.2 part 1 and WB4.3 part 2 (#170).
**Claimed now:** MAP-AUDIT-150 (#176). WB-KEYS merged in #198 (2026-10-12). The Wildbond builder thread keeps the ending (WB4.2, WB4.3's
rest) and the creature drawing (WD2's drawing half).

| # | Big build (path ID) | Read first | Files | Done when |
|---|---|---|---|---|
| H1 | ~~Wildbond shows its keys in game (WB-KEYS)~~ **Done:** merged in #198 (2026-10-12) | docs/PLAYTEST.md pass 2 | `wildbond-godot/` | The first time each action matters, its key or pad button appears in the world |
| H2 | **Saltmarsh you can explore** (WD4b) | GR-3; WD4a (#128) as the pattern | `wildbond-godot/` maps and scenes | A route, the settlement and one hidden pocket, with a spot you come back to with the right creature; old saves load; screenshots |
| H3 | **Dress Starfall's square and roads** (ART-SF-8) | DEVELOPMENT-PATH ART-SF-8; docs/art/starfall.md | `starfall-godot/` | As the line says; before and after screenshots |
| H4 | ~~Starfall: darkness, step 1 (SF2.9)~~ **Done:** merged in #224 (2026-10-12) | docs/proposals/starfall-darkness.md | `starfall-godot/` | As the line says; old saves load |
| H5 | **Starfall: station mastery ranks** (SF2.11) | DEVELOPMENT-PATH SF2.11 | `starfall-godot/` | Named ranks at 10/25/50 per station, shown in the world; checks |
| H6 | **Starfall: the hire works at your rank** (SF2.12, after H5) | SF2.12 | `starfall-godot/` | Each helper works at the rank you reached; active play stays worth more; checks |
| H7 | **Starfall: trust per adventurer** (SF2.13) | SF2.13 | `starfall-godot/` | As the line says; checks |
| H8 | **Starfall: veteran requests, signature moves, recruit specialities** (SF2.14, SF2.15, SF2.16; one PR each) | those lines | `starfall-godot/` | As each line says |
| H9 | **The next area you can explore** (WD4c Emberfall, then WD4d Cloudglass, one area per PR in journey order) | as H2 | `wildbond-godot/` | As H2, for that area |
| H10 | **Baby forms as life stages** (WB5.5, approved) | docs/proposals/creature-growth.md | `wildbond-godot/` creatures | As the proposal's defaults; old saves load; screenshots |
| H11 | **Ranch jobs** (WB5.3) | "master it, then hire" | `wildbond-godot/` ranch | Creatures take jobs you've done by hand; play, not watch; checks |
| H12 | **Races and contests at the ranch** (WB5.2) | docs/proposals/new-game-ideas.md | `wildbond-godot/` ranch | One race and one contest, with rematches |
| H13 | **Bring a browser save across** (WB6.3) | `games/wildbond/` save format | `wildbond-godot/` save code | A browser save loads with its creatures and progress; a check with a sample save |
| H14 | **The Unbound appear** (WB3.7) | docs/lore/wildbond-threads.md; reputation-and-consequence.md | `wildbond-godot/` | First encounters and a choice; the Design decisions thread first for any new canon |
| H15 | **Fishing at Saltmarsh** (WB5.7, after H2) | new-game-ideas.md | `wildbond-godot/` | A fishing spot and a fish body shape |
| H16 | **Roaming legendaries** (WB5.4) | DEVELOPMENT-PATH WB5.4 | `wildbond-godot/` | One roaming legendary with fair clues to find it |
| H17 | **Starfall's first season** (SF3.1, after H4-H8) | docs/plans/starfall-village.md | `starfall-godot/` | The first season as a chapter, ending in a festival |
| H18 | **Festivals on the shared calendar** (SF3.4, then WS4 winter and spring weather in Wildbond) | SF3.4, WS4 | `starfall-godot/`, then `wildbond-godot/` | One PR each |
| H19 | **Stillreed Basin's remaining steps** (WB3.1) | DEVELOPMENT-PATH WB3.1 | `wildbond-godot/` | As the line says |
| H20 | **Travelling merchants and visitors** (SF3.2) | docs/lore/multiverse.md | `starfall-godot/` | One visitor from another game, lightly; the Design decisions thread for canon |
| H21 | **Starfall Guild's best loops in the Godot village** (SF-GUILD: the one-page map first, then one ticket per loop; Evan's pick 2026-10-12) | DEVELOPMENT-PATH SF-GUILD | `docs/plans/`, then `starfall-godot/` | The map merged, then each loop as its own PR with a tactical call in fights and an early earned hire |

**Keep this list at least 20 builds deep** (Evan, 2026-10-12). Any AI that finds it shorter adds the next open items
from PRIORITIES.md section 4 and the Starfall order, then the path's later milestones.


## Art tasks (our own art; any AI may claim; reviewed by the Art direction thread)

Evan, 2026-10-09: "we need a thread that develops our graphical elements and pushes the envelope for our designs and
games." The Art direction thread sets each game's look and reviews the pieces; the drawing itself is open to any AI.
Read the arcade guide [docs/art/README.md](art/README.md) and the game's look sheet first. Each task makes **picture
files only** (transparent PNG, the game's palette, 1 px ink outline, light from the upper left, no anti-aliasing),
drawn in an editor or by a Pillow script in `tools/art/` that can be rerun. Put them in
`starfall-godot/assets/env/frontier/` and do **not** wire them into the game (that is SF2.6). Each PR shows a contact
sheet: every piece beside a 16 by 24 person and its neighbours, on the moss ground. Claim as usual (a draft PR titled
with the ID).

| # | Task | Look | Make | Done when |
|---|---|---|---|---|
| ART-SF-1 | **Ground**: moss grass (4 variants), a mud road that joins up (straight, corners, ends, crossings, edges onto grass), packed-earth square, stone footing strip | [starfall.md](art/starfall.md), palette `docs/art/starfall/palette.gpl` | 16 px tiles in one sheet `ground.png`, plus a note of which tile is which | A 24 by 14 tile test patch with a road, a crossing and the square reads as the mock-up's ground, with no visible repeat |
| ART-SF-2 | **Palisade, gate, watchtower**: pointed-log wall (straight, corner, end, a stake for wall to come), gate 48 x 48 open and shut, watchtower 32 x 80 lantern lit and unlit | as above | `palisade.png` (16 x 32 pieces), `gate.png`, `watchtower.png` | A wall run with a corner, the gate in it and the tower beside it on the contact sheet |
| ART-SF-3 | **The pine edge**: three pine sizes (1, 2 and 3 tiles tall), stumps, ferns, rocks; a dense edge that tiles sideways | as above | `pines.png`, `forest_edge.png` | A forest edge behind the palisade that reads as dark pine, unlike Wildbond's round trees |
| ART-SF-4 | **Guild Hall and Inn** (96 x 80 and 64 x 80): log walls, weathered shake roofs, the hall's banner, the inn's two storeys and sign; windows lit and unlit | starfall.md "Buildings" | `guild_hall.png`, `inn.png` (day and night windows as separate files) | Both on the contact sheet with a person at the door; the door is 12 x 20; footprints marked |
| ART-SF-5 | **Smithy, apothecary, healer, tavern** (sizes in starfall.md), plus well, job board, training yard | as above | one PNG per building, `well.png`, `board.png`, `yard.png` | Each building recognisable by its silhouette alone (fill them in ink and check); footprints marked |
| ART-SF-6 | **Props**: barrels, crates, firewood, lantern post lit and unlit, cart, bunting, an empty plot's stakes and string | as above | `props.png` | Props scattered on the test patch from ART-SF-1 |

**Done:** ART-SF-1 to 7 were built by Adam's AIs (PRs #134-#162) and wired in by SF2.6 (#157); the Art direction
thread reviewed them on 2026-10-11 (passed). **Open:** ART-SF-8 (dress the square and roads) and SF2.6c (open on the
town's best side, drop unused pack tiles); specs in DEVELOPMENT-PATH.md under SF-M2. One task per PR. Other games get
their sheet first, then tasks here.

## The road ahead (browser work, ready to claim by any AI; refreshed 2026-10-12)

**First: AR-SHELVE** (in "This cycle" above): take the Classic editions and Diamond Career off the site, keeping their code and saves.

These tasks need **no Godot** and are open to **any** AI. Take the first one no open pull request names, claim it, build
it, then self-check and merge (docs/PROCESS.md). Each line names its spec; read it first.

**Done since the last refresh (2026-10-12):** Diamond Manager DM3, DM4, DM-B2, DM7 (v0.6.0 to v0.8.0), Lantern Bowl
LB0 (the pitch) and LB1 (the shared office), Ember Bricks (#185), Little Ranch LR12 to LR15.
**Claimed now:** AC3.1 Brisket polish (#180), Realmbound first-session check (#214, merged as v1.8.1), X1 Diamond Career playtest
(done 2026-10-12: issues #227-#230, #114 closed).

| # | Task (path ID) | Spec | Files | Done when |
|---|---|---|---|---|
| 1 | **Realmbound: the hero only fights when you do** (RB1.11), with the first-hour playtest (RB1.10) | DEVELOPMENT-PATH RB-M1b; GOALS.md "Play, not watch" | `games/realmbound/`, `docs/playtests/` | As the path says; `tests/run.html` passes; old saves load |
| 2 | **Realmbound: the first hour, made fun** (RB1.12, one PR per fix RB1.10 lists) | as above | `games/realmbound/` | The next newcomer playtest scores Realmbound 17+ |
| 3 | ~~**Brisket's Crossing: newcomer fixes**~~ **Done:** merged in #244 as v0.1.3 (AC3.3, Flint's playtest in COMMS 2026-10-12 20:19) | DEVELOPMENT-PATH AC3.3 | `games/briskets-crossing/`, its checks | As the path says; old scores load; phone and desktop captures |
| 4 | ~~**The hall card that shows the wrong game** (AR2.15) and **Diamond Career's way in** (DC-N, same playtest)~~ **Done:** merged in #249 and #247 (Diamond Career v0.4.2) | DEVELOPMENT-PATH AR2.15, DC-N | `launcher/`, `index.html`, `games/diamond-career/` | As the path says |
| 4a | **Starfall: the web preview that stops loading** (SF-WEB-BOOT, bug; Flint round 3) | DEVELOPMENT-PATH SF-WEB-BOOT | `play/starfall/`, its verifier | The hall's "Play the preview" opens a Starfall that finishes booting at the new address on desktop and phone; the verifier checks the new address |
| 4b | **Newcomer snags, round 2** (RB-N1 Realmbound, OW-N1 Otherworld, AR2.16 hall blurbs, WB-N1 Wildbond in Godot; Flint 2026-10-12 20:52) | DEVELOPMENT-PATH RB-N1, OW-N1, AR2.16 | `games/realmbound/`, `games/otherworld/`, `index.html` | As each path line says; one PR per game |
| 4c | **Diamond Manager: the numbers you watch climb** (DM-N1; Flint 2026-10-12 21:02) | DEVELOPMENT-PATH DM-N1 | `games/diamond-manager/` | As the path says; `tests/diamond-manager.html` passes |
| 4d | **Starfall Guild: small fixes only** (SG-N1; Flint 2026-10-12 21:02; its loops move to Godot, see H21) | DEVELOPMENT-PATH SG-N1 | `games/starfall-guild/` | As the path says; old saves load |
| 5 | **Diamond Manager: the ballpark you see grow** (DM5) | docs/plans/sports-management.md | `games/diamond-manager/` | As the plan says; `tests/diamond-manager.html` passes |
| 6 | **Lantern Bowl: one drive, playable** (LB2; Diamond Manager reached v0.8.0, so Lantern Bowl now has the sports slot, lane P 2026-10-12) | docs/plans/lantern-bowl.md, the mock screens; `shared/sports-office.js` | `games/lantern-bowl/` (new), its test page | You call plays and throw on one drive, on phone and desktop; quick and readable like Retro Bowl, our own art |
| 7 | **Lantern Bowl: one full game** (LB3), then **season and office** (LB4), then **playability pass** (LB5) | as above | as above | One PR each; LB5 scores 17+ in a newcomer playtest |
| 8 | **Little Ranch: the singing flowers** (LR3), then LR4 to LR8 in order | docs/proposals/little-ranch-next.md | `games/little-ranch/`, `tests/little-ranch.html` | One PR each; phone and tablet; no reading, nothing to fail; a "tried with a toddler" note |
| 9 | **Little Ranch: the Paint Shed** (LR9, Evan's pick), then the Little Wagon (LR10) and the Snack Kitchen (LR11) | as above | as above | As each path line says |
| 10 | **The next cabinet's polish** (AC-x: AC1.1 Storm Front, AC2.2 Lighthouse Watch, AC4.1 Ember Bricks) | docs/PLAYTEST.md pass 2 | that cabinet's folder | Each cabinet scores 17+ |
| 11 | **A fifth and sixth cabinet** (AC5, AC6: one-screen 1978-85 shapes we don't have yet, such as the maze chase or the asteroid field; our own names, art and sound, never a copied look) | docs/proposals/games-for-everyone.md; AC1-AC3 as the pattern | `games/<new cabinet>/`, its test page | Plays on phone and desktop with shared high scores; scores 17+ |
| 12 | **Play, not watch, elsewhere** (AR2.14: the hall's tagline, Primordial's away-gains) | DEVELOPMENT-PATH AR2.14 | `index.html`, `games/primordial/` | As the line says |
| 13 | **Otherworld: skills that grow with use** (OW2.2), then **people with wants and grudges** (OW2.3) | docs/plans/otherworld.md | `games/otherworld/` | `tests/otherworld.html` passes |
| 14 | **Newcomer playtest, pass 3** (X1 for every game on the hall, after the fixes above land) | docs/PLAYTEST.md | `docs/PLAYTEST.md`, issues | A score per game and the top fix for each as new path lines |
| 15 | **Wildbond catalogue batches 3 and 4** (WB5.6, after #198's catalogue pipeline merges) | #198's pipeline and world-fit rules | catalogue data | 12-15 creatures each, with lore, passing the catalogue checks |
| 16 | **The hall, upgraded** (AR2.13) | docs/SITE-AND-GUIDES.md | `launcher/`, `index.html` | A sign over each group, other visitors walking, a nicer Classic corner; `node tools/launcher-checks.cjs` passes |
| 17 | **Game boxes** (AR2.3, V3) | docs/VISION.md | `launcher/`, `index.html` | A box picture per game in the hall |
| 18 | **Lantern Ice pitch** (HK0, after LB3) | docs/plans/sports-management.md | `docs/plans/` | A one-page pitch with three mock screens using the shared office |

**Godot work is open to any AI too** (Evan, 2026-10-09: "Yes, with checks"). Rules for it: claim the deliverable as
above (the Wildbond builder and Starfall threads check the open PR list too); keep to the files the deliverable needs;
install Godot 4.7.2 (`docs/learning/`, or let GitHub do it) and run `node tools/run-all-checks.cjs`, which runs both
Godot suites; **old saves must load** (add a check); add checks for what you build; for anything visual, put a
screenshot in the PR; the GitHub "checks" tick must be green, and after the self-check in docs/PROCESS.md only Generations Reviewer merges (nobody merges their own pull request). Take
Godot deliverables from "Heavy lifting" above, in order, never one another open PR names.

## When the road is empty, or everything is waiting on review

(Past the end of the road with something that fits? docs/PROCESS.md "When you get ahead of the road" says how to write
and claim your own next task.)

Never sit idle. If every task above is claimed or waiting to merge, take one of these (no claim needed for 1 and 2;
claim 3-5 with a draft PR titled `FB-<n>: ...`):

1. **Review a waiting pull request** that isn't yours: run its checks and tests, play the change, and leave a
   comment saying what you tried and what you found (a pre-review, as Grok did on #112). This makes merging fast.
2. **Playtest a game** with docs/PLAYTEST.md's scorecard and open a GitHub issue per real problem (game, version, steps).
3. **Fix an open bug issue** (label `bug`), smallest first.
4. **Add tests** where a game has few: a check for something already built, in that game's test page or Godot suite.
5. **Polish player-facing text** in a game (docs/CREATIVE.md "Writing for players"): spelling, capitals, the
   world's words.

## Saving Claude's usage (Evan, 2026-10-09: "we need to be more efficient with our token usage")

Claude's weekly usage is the scarcest thing in the project. Claude threads:

- **Batch:** one sweep reviews and merges every waiting PR at once, rather than one PR per wake. Fewer, longer sessions
  beat many short ones.
- **No status-only replies:** report only results, blockers and decisions Evan must make; progress goes in the thread's
  status line, not a message.
- **Plan short:** tickets and plans as tables and short specs, not essays; read only the files a task needs.
- **Hand off building:** big builds go to the Heavy lifting list for the AIs with more usage; Claude threads review,
  plan and keep the hardest Wildbond pieces.
- **Lean on others' pre-reviews:** when a helper has already run the checks and played the change, verify the
  essentials rather than redo everything.

## The loop (every assistant)

1. `git fetch`; start from the latest `origin/main`. Read [COMMS.md](COMMS.md), the message board between assistants.
2. Take the **first task in your lane** (see "Who works where") whose status is `open`, and claim it as "Claiming
   work" says: a draft pull request titled with the deliverable's ID, opened before you build.
3. Build it on its own branch (`codex/<topic>`, `grok/<topic>`, `claude/<topic>`), with checks; all eight test pages pass
   (`tests/run.html`, `wildbond.html`, `starfall.html`, `sound.html`, `offline.html`, `diamond.html`, `otherworld.html`, `runner-safety.html`; Claude also runs the Godot checks).
4. Open a pull request and post the self-check (docs/PROCESS.md); only Generations Reviewer merges, never the author. In the PR: what you built, the files you touched,
   before/after screenshots for anything visual, and an "An idea" section if you have one.
5. **Go straight to the next task in your lane.** Don't wait for the review.
   - If the next task needs files your open PR touches, branch from that PR's branch and say so in the new PR.
   - **No limit on open PRs** (Evan, 2026-10-08: "remove the 2 PR limit in case it gets ahead"). Keep going down
     your lane; Claude reviews them in order. Keep each PR to one task so reviews stay easy.
6. **Lane empty? Never stop and never report "finished".** Use the ticket factory in
   [DEVELOPMENT-PATH.md](DEVELOPMENT-PATH.md) (Part 1): take the next deliverable you own from the path, write its ticket,
   add it to your lane here, build it. The path has work for every assistant through each game's version 2.0 and beyond.
7. If a task is unclear or turns out to need Evan (CREATIVE.md "Ask Evan first"), write `docs/proposals/<topic>.md`,
   mark the task `blocked: <why>`, and move to the next one.

## Rules that keep parallel work merging cleanly

- **Don't bump game versions** (`VERSION` in 99-boot.js and the header label). Lane R bumps them when merging.
- **Don't edit START-HERE.md's "Where we are" or "Up next".** Add only your one dated line at the top of its Session
  log. Lane P keeps the rest current.
- **README changelog:** add your entry at the top, without a version number ("Wildbond (2026-10-08): ...").
- **Stay inside your task's files.** If you must touch a file another lane owns, keep it to a few lines and say so.
- **In the game window** (Evan, 2026-10-08): every feature in every game happens inside the game window (people, places, things you hold, a thin overlay), not in panels beside it. See CLAUDE.md.
- **Saves:** new fields get defaults; old saves must load (add a check). Commits only as
  `206636510+ecbarish@users.noreply.github.com`.

## The focus (2026-10-09): read [PRIORITIES.md](PRIORITIES.md) first

**Flagship: Wildbond (Godot) to version 2.0. Second: the Starfall village. ChatGPT's own: Realmbound. Keep alive:
Diamond Career, Otherworld, browser Wildbond. Parked: the rest.** Each lane takes flagship work first. PRIORITIES.md
section 4 has the order inside each game; new ideas go through its scorecard before they reach a lane.

## The current goal (updated 2026-10-08, night; the focus above now decides the order)

What changed since the "Launch" goal of 2026-10-07: Evan moved the fleshed-out games to **Godot** (the new Wildbond
and the Starfall village, which also play on the web), asked that **everything happen in the game window** in every
game, and started sharing the games with **friends** (the Come Play page, web previews, a trailer). So:

1. **Friends' testing now.** Keep playtest.html, the previews in `play/` and the browser games working and current.
   Bugs from friends come first (GitHub issues, or Evan's messages).
2. **The new Wildbond (Godot) reaches the full journey**: the remaining areas, the league, then the deeper systems
   (tamer abilities, the wild bond, the Unbound, reputation, depth). Claude's lane; PROJECTS.md "Wildbond in Godot".
3. **The Starfall village grows** (Godot): members' stories, seasons, failing and excelling. Claude's lane.
4. **The browser games move into the game window**, one at a time (Realmbound, then Diamond Career), and keep their
   content growing (Otherworld's next worlds, Realmbound's raid tier, the creature catalogue). ChatGPT's lane.

What a public "version 2.0" launch means now (the Godot Wildbond, or the browser games as they stand) is a question
for Evan in START-HERE; until he answers, the old checklist below still applies to the browser games.

**Old launch checklist (browser games):** L1 settings Â· L2 save safety Â· L3 phone pass Â· L4 onboarding Â· L7 bug bash
and balance Â· L8 the arcade launcher Â· L10 accessibility Â· guides and lore pages (T8) Â· no open bug issues.
**Old launch checklist (browser games):** L1 settings · L2 save safety · L3 phone pass · L4 onboarding · L7 bug bash
and balance · L8 the arcade launcher · L10 accessibility · guides and lore pages (T8) · no open bug issues.
## Lane A: ChatGPT / Codex (browser games, data and lore, moving browser games into the game window)

Updated 2026-10-08: Wildbond's new version is built in Godot by Claude (never edit `wildbond-godot/`, `starfall-godot/` or `play/`). Wildbond browser work stays in data, lore and checks: it feeds the Godot version through tools/godot-export.ps1. Earlier note: Claude was rebuilding Wildbond's browser screens (plan phases 1-5), so
Lane A's Wildbond work stays in data, drawing and new files; don't restyle Wildbond's 05-ui.js, 06-scene.js,
index.html or style.css until those phases are merged.

| # | Task | Status | Notes |
|---|---|---|---|
| A1 | **T33** Wildbond creature variants (W14) | done, merged 2026-10-08 by Claude (Wildbond v1.6.0) | docs/ROADMAP.md T33: a rare shimmering colour, tiny/huge sizes, seeded markings; cosmetic only |
| A0 | **T34** Diamond Career part 1: the first call-up and the first payday | done, merged 2026-10-08 by Claude (56 checks pass; on the shelf and the road) | Evan unparked it 2026-10-08; docs/ROADMAP.md T34; browser, games/diamond-career/ |
| A2 | **T32** Wildbond lighting for every other area (G2) | blocked: profile-only scope cannot select town/league/Spire; see docs/proposals/wildbond-area-air.md | Finish if started; otherwise after A1. Only `AREA_AIR` values and their checks in 06-scene.js |
| A3 | **T8** Realmbound guide and lore pages | done, merged 2026-10-08 by Claude | ROADMAP T8, Realmbound first; Wildbond's guide waits for its redesign |
| A4 | **L4 + V1** Realmbound onboarding: the first quest, told by people | done, merged 2026-10-08 by Claude (Realmbound v1.1.0) | docs/realmbound-onboarding.md: arrival scene on the first questgiver, optional road guidance; legacy heroes stay quiet |
| A4b | **Diamond Career part 2** | done, merged 2026-10-08 by Claude | docs/diamond-career-first-month.md: second contract, a 30-day first month, Iona's notebook |
| A5 | **R4** Guild members' personal stories | done, merged 2026-10-08 by Claude (Realmbound v1.2.0); follow-up: give some stories an outcome that can go either way (VISION §9) | 3-4 beats per adventurer, unlocked by mood and time together; one outcome that can go either way (VISION §9) |
| A5c | **R4 follow-up: choices with consequences** | done, merged 2026-10-08 (Realmbound v1.3.0, PR #53) | Evan: about a third of stories can hurt trust; plain, recoverable outcomes in portrait conversations |
| A5b | **D1c** Diamond Career: swings you understand | done, merged 2026-10-08 by Claude (Diamond Career v0.3.0) | From docs/research/diamond-first-contract-review.md: Timing mode shows Contact / Power (no hidden carried-over stance); results say when a pitch was off the plate and separate good-contact-caught from weak contact; one visible effect of Eye growth noted by Iona. Checks for each; old saves load |
| A6 | **W11** A larger Wildbond roster, batch 1 | done, merged 2026-10-08 by Claude (Wildbond browser v1.7.0; 93 species) | 10-12 species filling empty family/element pairs (T6 rules); data only. Now part of the shared catalogue plan (docs/proposals/creature-catalogue-and-evolution.md): include at least one creature that never evolves and is strong for it, and write lore so the species can also live in Realmbound's zones |
| A6b | **Guides and wiki** | done, merged 2026-10-08 (PR #52) | Evan, 2026-10-08: a guide per game with pictures, tips and tricks, later short videos. Extend guides/realmbound.html with screenshots and a tips page; start a Diamond Career and an Otherworld page. Wildbond's waits for the Godot version |
| A7 | **R6** Realmbound hub variety | done, merged 2026-10-08 by Claude (Realmbound v1.4.0) | A layout per zone, inn and smithy interiors |
| A7b | **R5** crafted gear from 55 | done, merged 2026-10-08 by Claude (Realmbound v1.5.0) | Separate PR after R6 |
| A8a | **Otherworld browser runner save safety** | done, merged 2026-10-08 by Claude (PR #56; tests only) | Restore recovery backups too, including failed/thrown checks |
| A8b | **Realmbound guide: rooms and commissions** | done, merged 2026-10-08 (PR #57) | Current hub/service instructions, actual pictures and generated costs |
| A9 | **T35** Otherworld O1, a living Lanthorn | done, merged 2026-10-08 by Claude (Otherworld v0.2.0, PR #58; 831 checks) | docs/ROADMAP.md T35; moved from Claude's B0b |
| A10 | **T36** Diamond Career in the game window, and a road trip | done, merged 2026-10-08 (Diamond Career v0.4.0, PR #59) | docs/ROADMAP.md T36 |
| A11 | **T37** The shared creature catalogue, batch 2 | done, merged 2026-10-08 (Wildbond v1.8.0, PR #60) | docs/ROADMAP.md T37; data and lore only |
| A12 | **T38** Realmbound in the game window: the plan, then part 1 | done, merged 2026-10-08 (Realmbound v1.6.0, PR #62) | docs/ROADMAP.md T38 |
| A13 | **T39** Otherworld: Hearthmere, the second world | done, merged 2026-10-08 (Otherworld v0.3.0, PR #63) | docs/ROADMAP.md T39 |
| A14 | **T40** Wildbond areas 5-8: woven clues, signs and chatter (data; flows into the Godot version) | done, merged 2026-10-08 (Wildbond v1.8.0, PR #64) | docs/ROADMAP.md T40 |
| A15 | **OW0c** Otherworld: the Ashen Throne, complete third life | done, merged 2026-10-08 (Otherworld v0.3.0, PR #65) | docs/otherworld-design.md: Kael, three gifts with costs, endings and cross-world memories; Evan authorized further development |
| A16 | **T41** Realmbound in the game window, part 2: pages become places | done, merged 2026-10-09 (Realmbound v1.7.0) | docs/ROADMAP.md T41 |
| A17 | **T42** Otherworld: memories that matter across lives, toward a systemic world | done, merged 2026-10-09 (Otherworld v0.4.0) | docs/ROADMAP.md T42 |
| A18 | **T43** The creature catalogue reaches Realmbound | done, merged 2026-10-09 (Realmbound v1.7.0) | docs/ROADMAP.md T43 |
| A19 | **T44** Accessibility pass on the browser games (L10) | done, merged 2026-10-09 | docs/ROADMAP.md T44 |
| A20 | **T45** Early-road heritage dialogue (WB2.6) | done, merged 2026-10-09 (Wildbond v1.8.1) | Browser data and ledger; no Godot edits |
| A33 | **T58** Wildbond late observations and the reveal (WB4.4b part 2) | ready: PR #101, Codex, 2026-10-09 | docs/ROADMAP.md T58; text for Claude to place in Godot |
| A32 | **T57** Starfall four seasonal chapter outlines (SF3.3) | ready: PR #84, Codex, 2026-10-09 | One threat/festival/newcomer each; current calendar, existing street loop; docs only |
| A31 | **T56** Wildbond final-four-area and league pacing (WB3.6) | ready: PR #83, Codex, 2026-10-09 | Actual Godot battle/rules in a disposable diagnostic project; no Godot edits |
| A30 | **T55** Final truth clue audit (WB4.4b part 1) | ready: PR #82, Codex, 2026-10-09 | Check all placed clues; propose three shared late observations; review before dialogue |
| A29 | **T54** Wildbond Champion return conversations | done, merged 2026-10-09 | Claude's new WB4.4 request: gate scene and every Warden; stacked after #80 |
| A28 | **T53** Wildbond league script and payoff map (WB4.4a) | done, merged 2026-10-09 | Safe writing handoff while Claude builds WB4.1; no Godot edits |
| A27 | **T52** Starfall member writing handoff (SF2.4a) | done, merged 2026-10-09 | Separate additive JSON, preserve Godot ownership; stacked after #78 |
| A26 | **T51** Wildbond festival writing (WS6) | done, merged 2026-10-09 | Stacked after T50/#77; exact calendar IDs, traditions, town voices and cosmetic keepsakes |
| A25 | **T50** Wildbond seasonal data (WS3) | done, merged 2026-10-09 | Claude's next request: regional shifts, rare year-round visitors, seasonal voices; export only |
| A24 | **T49** Sunthread and Farwatch build briefs (WB3.5 part 2) | done, merged 2026-10-09 | Claude requested this next; existing data/canon only |
| A23 | **T48** Walkable Realmbound town road (RB1.3) | done, merged 2026-10-09 | Optional inn/camp approach; existing combat/travel retained |
| A22 | **T47** Hollowecho area brief (WB3.5 part 1) | done, merged 2026-10-09 | Data/lore handoff for Claude, no Godot edits |
| A21 | **T46** Put the new previews on the arcade shelf (AR2.2) | done, merged 2026-10-09 | Stacked after T44; no Godot/export edits |
| A8 | While you wait | always | Lore and dex text polish, more checks, bugs from GitHub issues |
| — | Done | — | A2 L7a Wildbond balance, A3 L7b Realmbound balance, R9 heroic loot review (all merged 2026-10-07) |

## Lane B: Claude (history; the work is now split into lanes W, S, R and P above)

| # | Task | Status | Notes |
|---|---|---|---|
| B0 | **Review and merge** every waiting PR, bump versions, keep START-HERE current, refill the lanes | always first | Check email, diff, tests, play it; `git merge --no-ff` |
| B0b | **Otherworld O0: the Between and Asterhold** | part 1 done 2026-10-08 (the Between, Asterhold's whole life, 8 endings, rebirth and memories; tests/otherworld.html); O1 handed to ChatGPT 2026-10-08 (A9, T35); was: **O1, a living Lanthorn** (docs/research/otherworld-first-life-review.md: locked choices shown with reasons, every gift cost bites, the town's food and fear change over the days), then Hearthmere, the Ashen Throne | Evan unparked it 2026-10-08; docs/otherworld-design.md; browser, games/otherworld/ |
| B1 | **Wildbond phase 1: the screen is the world** | done in Godot (the new Wildbond is all game window); no browser rebuild | docs/wildbond-plan.md: full-window scene, overlay HUD, dialogue near speakers, satchel and pause menu, bigger characters |
| B2 | **Wildbond phase 2: the opening, alive** | **in Godot, mostly done 2026-10-08** (wildbond-godot/: register = character creator, Maren, the barn and the partner choice, Wren); left: prologue, Wilddex goal, guided first wild bond | Prologue, Maren in the world, the character creator (W13), choosing your partner in the barn, Wren, guided first bond, the Wilddex goal |
| B3 | **Wildbond phase 3: battles on the field** | **in Godot, first battle done 2026-10-08** (scripts/battle.gd, rules.gd matches the browser exactly); left: Bond (catching) and Bag in wild battles, more creatures' bodies | Transition, classic layout, Fight / Bond / Bag / Run, a summary that waits |
| B2b | **Wildbond in Godot: the move** | **Thornwood, Saltmarsh and Emberfall done 2026-10-08** (wild creatures, catching, trainers, Wardens, story moments, shop, inn, Wilddex book, saving, area battle skylines); the ranch as a place started 2026-10-08 (creatures in the paddock and barn, visit, take along, swap); Cloudglass Pass done 2026-10-08; next: the rest of the ranch (feeding at the trough, breeding stall, Maren's daily letter), evolution shapes and conditions done 2026-10-08 (data/evolution.json: three third stages, the Poolkit branch, never-evolvers, Not yet); heritages at the register done 2026-10-08 (gifts, tales, recognition); next: the ranch trough and breeding stall, Stillreed Basin, tamer abilities | docs/godot-port-plan.md: Route 1 (Thornwood) from the exported maps, wild creatures and catching, team and save (with a browser-save importer), then area by area. Checks: wildbond-godot/tests/run_tests.gd |
| B4 | **Wildbond phase 4: menus you hold** | in Godot: the field book (J) and creature pages done; the Journal with map and badge case is part of WG8 | Wilddex field book, team scene, Journal with map and badge case |
| B5 | **Wildbond phase 5: the ranch as a place** | in Godot: paddock, barn, nursery, trough, workbench done 2026-10-08; Maren's daily letter is WG8 | Trough, posts, meadow, breeding stall, shop counter, Maren's daily letter |
| B6 | **L10** Accessibility; **L3** phone pass part 2 | open | Browser games now; the Godot previews need phone controls (WG10) |
| B9 | **Next in Godot, in focus order (PRIORITIES.md section 4, 2026-10-09):** Wildbond: pacing fixes from T56, finish the ending (WB4.3 with WB4.4b), phone controls and settings (WB6.1-6.2), the Spire and rematches (WB5.1), the Unbound (WB3.7), polish alongside (WB2.2-2.4, WS4). Starfall: SF2.5 apprentice, SF3.1 seasons, SF3.4 festivals. Rebuild play/ and the Come Play pictures after big steps | open | Was: WG1, WG6, WG7, WG2, SV1, SV3 (all done or under way by 2026-10-09) |
| B6b | **The screen is the world, for every game** | Wildbond and Starfall: done in Godot; Diamond Career: ChatGPT A10 (T36); Realmbound: ChatGPT A12 (T38) | Evan, 2026-10-08. Realmbound first, done in Godot when Realmbound moves (docs/research/decisions.md, 2026-10-08 evening), unless it stays in the browser (the world fills the window; quests, bags, guild and the new Road guide move into the world: quest givers speak in place, bags and the quest log are things you open over the scene); then Diamond Career (the ballpark fills the screen, at-bat choices and contracts happen in the scene: the clubhouse, Iona, your home); then Starfall. One plan doc per game first, then small steps |
| B6c | **V11 walk-in arcade, steps 1-2** | later (Evan: the games come first) | docs/research/arcade-first-visit-review.md: each game saves a small look record of its character; the hall puts you by the last door as that game's character, shows progress on the doors, glows the last-played door for a one-tap return |
| B6d | **Starfall village, first slice (Godot)** | done 2026-10-08 (starfall-godot/, 33 checks); slice 2 done 2026-10-08 (plots, the Healer's Hut, a Training Yard, the town's rank and newcomers; 51 checks); slice 3 done 2026-10-08 (the Smithy worked by hand, Garrick, the Apothecary with prices, more plots, adventurers' savings; 85 checks); next: members' stories, seasons | docs/plans/starfall-village.md: the guild board, one inn run by hand, three adventurers who take bounties, return hurt and recover, hiring the first barkeep |
| B7 | **V3** Game boxes on the launcher | open | docs/VISION.md §3 |
| B8 | **G2** Realmbound dungeon lighting; **W3 part 2** roaming legendaries; **W10** baby forms | open | After Launch is fine |
| — | Done | — | L2 save safety, L1 settings, L8 launcher (living world, road, hall, vote), L3 phone part 1, Wildbond v1.4-1.5.2 fixes from Evan's play |

## Lane X: guests (a `guest/<topic>` branch and a pull request; CONTRIBUTING.md has the steps)

Evan chose (2026-10-09) to add guests as collaborators: they push `guest/*` branches to this repo, never `main`.

Grok and dot take their next task from [plans/guest-backlog.md](plans/guest-backlog.md). They claim it as a #373 comment, then open a draft pull request titled with the ID. Feature PRs never edit docs/COMMS.md. After the self-check in docs/PROCESS.md, only Generations Reviewer merges; nobody, guests included, merges their own pull request. The older X1–X3 table below is history. Generations PM keeps at least 8 priority rows per guest and tops up whenever either guest drops below 4.

| # | Task | Status | Notes |
|---|---|---|---|
| X1 | **Play a game's first 20 minutes as a newcomer** and file what's confusing or broken as GitHub issues (the Bug and Feedback forms), with screenshots | done for Diamond Career (Grok, 2026-10-12): issues #227-#230; #114 closed. Open for other games | No code. Any game on the arcade; Wildbond and Starfall previews first. One issue per problem |
| X2 | **Broken links and pictures** (AR2.4): check every link and image in `guides/` and `playtest.html`, fix the broken ones | done (#158) | Only those files. Say in the PR how you checked |
| X3 | **Player-text sweep of Otherworld** (D1): fix names and wording in `games/otherworld/js/` that break docs/CREATIVE.md "Writing for players" | done (#104) | Text only, no rules or numbers; `tests/otherworld.html` must still pass (`node tools/run-all-checks.cjs`) |

## Lane D: the local helper (Ollama on Evan's PC; small, checkable jobs only)

docs/research/local-ai-helper.md says what it is good for (drafts, mechanical edits gated by a check, searches and
lists) and what not (reviews, design, story, balance). It works in its own clone with push disabled; nothing it makes
is merged without review. Queue tasks in `C:\Users\evanb\Local-AI\queue\` (one JSON file each, read-only first).

| # | Task | Status | Notes |
|---|---|---|---|
| D0 | **Make the queue runner work**: switch Run-LocalAgent.ps1 from Codex to OpenCode (`opencode run`, OPENCODE_CONFIG) | done, merged 2026-10-08 (PR #66) | The model can't drive Codex's tools; OpenCode works |
| D0b | **Preserve permission precedence in runtime overrides** (ChatGPT) | claimed: Codex, 2026-10-08, `codex/local-helper-permissions` | Ordered PowerShell policy; keep wildcard denial before explicit tool rules |
| D1 | List every player-facing string in games/otherworld/js/ that breaks docs/CREATIVE.md "Writing for players" (lowercase names, rule words in story text) | open (read-only) | Claude or ChatGPT checks the list |
| D2 | Draft ten dex lines for the newest catalogue creatures in the house style, for review | open (read-only; output in its log) | A person picks and edits |
| D3 | Check every link and image in guides/ and playtest.html points to a file that exists | open (read-only) | |

## Lane C: Grok (since 2026-10-09): the Studio

Self-contained work that touches almost nothing the other lanes use: the Studio is one page (`studio.html`) plus small
read-only hooks, and the accessibility audit is mostly reports and small fixes.

| # | Task | Status | Notes |
|---|---|---|---|
| C1 | **E4** Studio text browser | claimed by Grok, 2026-10-09, `grok/studio-text-browser` | In studio.html: browse and search every line of dialogue, quest text, item and creature name (read them from the games' data files); show where each is used. Read-only first; editing comes with E1's patch format |
| C2 | **E5** Creature and quest viewers with the test rules as validators | claimed by Grok, 2026-10-09, `grok/studio-viewers` (stacked on C1, #99) | Studio pages that list species, moves, evolutions, wild tables and quests, flagging anything the checks in tests/ would reject |
| C4 | **E7** Lighting and music tuner | claimed by Grok, 2026-10-09, `grok/studio-tuner` | Studio sliders for a zone's fog, shadow strength and grade, writing to localStorage only; previews in an iframe |
| C5 | While you wait | always | Playtest a game end to end and file what you find as GitHub issues (bug / suggestion templates) |

## Where this list comes from

Lanes are re-filled by Claude from PROJECTS.md when they run low. Evan can reorder anything, or say "Lane A: do X
next". Status here and in PROJECTS.md should agree; when a task is merged, Claude marks both `done`.
