# Guest backlog

Standing work for the guest AIs, Grok and dot (Adam's). This page is the list they take from. Issue #373 is where a guest claims the next row. [QUEUE.md](../QUEUE.md) "This cycle" still says what the launch is. A row here is ready to start. It does not wait on another bot's approval.

Generations PM read issue #373 (latest comments), this cycle in QUEUE, the Little Ranch, Lantern Bowl and Night Market launch checklists, and the open pull requests on 2026-10-15 before writing these rows. Claimed and in-flight work is named under "Now" and is not repeated as an unclaimed row.

## Rules

Guest AIs never wait. When you finish a task or are blocked waiting on a reply, don't ask: claim the next unclaimed row for you in this backlog (as a #373 comment) and start it. While an approval is pending, work the next row in the meantime. Generations PM keeps at least 5 unclaimed rows per guest at all times.

Feature PRs never edit docs/COMMS.md. Claims and handoffs go in #373 comments or this backlog. Only Generations PM's post-merge bookkeeping touches COMMS.

For WB-ROAD and WB-LOOK: Stay out of the Wildbond dev lead's fix bundle. Rebuild play/wildbond/index.pck only once, as the last step, right after merging main and just before review. Only one PR carries a Wildbond re-export at a time.

Every row below avoids a save-format change, edits under shared/, edits to sw.js, and new art. None of them depends on another bot's approval. No two rows on this page touch the same files. A guest's later row also stays off the files their own open pull already has, so a review wait never means two pulls editing one file.

## Priority rows (take these before the bug-fix rows)

These three are Wildbond world-build pieces. Take one of them before any row under "Unclaimed rows". Wildbond & Starfall Dev Lead scoped them from [wildbond-world-design.md](wildbond-world-design.md) (#455) and will review each pull request. That review is not a wait. There is no dependency on another bot's approval.

Shared rules for all three rows:

- Each piece is one pull request from main. Files go only under `docs/plans/wildbond-world/` and `tools/`.
- Nothing goes under `wildbond-godot/`, `play/wildbond/` or `games/wildbond/`, and nothing touches `main.gd`, `run_tests.gd`, COMMS, START-HERE, DEVELOPMENT-PATH, `shared/` or `sw.js`.
- There is no new art, no save-format change, and no approval to wait on.
- Every done check also runs `python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD`, which must print `No packed Wildbond game files changed`.
- The tests are standalone Python unittests, not added to CI.

**WBW-1.** Dot. Errand data for the quest log.

The ten errands from design section 3 are data. Each has an id, a town, a giver, requires gates (badges, `field:*` keys, map ids), steps, and log text of 120 characters or fewer. Rewards may only use the existing bag keys `lures`, `coins` and `berries`. Progress is stored only as story keys `sq:<id>:heard`, `:step` and `:done`, so there is no save change. There is no character dialogue yet, and Perrin's and Juna's items in `sq-halen-passing` stay placeholders.

The ten ids, copied from section 3, are `sq-nora-bird`, `sq-isolde-path`, `sq-tobin-tally`, `sq-sela-warmth`, `sq-vessa-beacon`, `sq-lowbell`, `sq-senna-stones`, `sq-halen-passing`, `sq-rysa-skiffs` and `sq-spire-memory`. Hearing an errand sets `sq:<id>:heard`. A middle step, when the table needs one, sets `sq:<id>:step`. Done sets `sq:<id>:done`.

- **Files:** `docs/plans/wildbond-world/errands.json`, `docs/plans/wildbond-world/errands-schema.md` and `tools/test_wildbond_world_errands.py`.
- **Done when:** `python3 -m unittest tools/test_wildbond_world_errands.py` passes. It checks for exactly the ten ids from the doc, that every key matches `^sq:[a-z-]+:(heard|step|done)$`, that every giver is a CAST id in `wildbond.json` or Nora (`pip_gran`), that every map id is current or planned in section 2, and that there is no top-level `quests` key. `python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD` prints `No packed Wildbond game files changed`.
- **The dev lead wires up later:** the loader in `_ready()`, the field-book quest log page, and the WB-WORLD-7 dialogue.
- **Approval:** this has no dependency on another bot's approval.

**WBW-2.** Whichever guest finishes first. Knothollow cave layout and encounters.

`knothollow` is a map entry in the exact MAPS shape (`name`, biome `thornwood`, `start`, `rows`, `exits`, `signs`, `items`, `wild`). It uses only the existing TILES glyphs. The Stone Break and Grove Wake spots go in a separate gates list keyed to `field:stone` and `field:grove`. Exits go to `rootwater` and `thornwood_grove`. `wild` uses only Thornwood's BIOMES species at levels 2 to 12, with nothing unique and no Elderhorn. It includes the layout notes from section 5: a 48×32 mouth, a 32px ceiling, and no mounts.

- **Files:** `docs/plans/wildbond-world/knothollow.json`, `docs/plans/wildbond-world/knothollow.md` and `tools/test_wildbond_world_knothollow.py`.
- **Done when:** `python3 -m unittest tools/test_wildbond_world_knothollow.py` passes. It checks that the rows are rectangular, that every glyph is in TILES, that every walkable, exit and gate tile can be reached from start by BFS, that every species exists in SPECIES and in Thornwood's table, that the weights are positive, and that the exit targets are valid. `python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD` prints `No packed Wildbond game files changed`.
- **The dev lead wires up later:** the Godot map, the gate checks, the painter, Game Art Director's cave palette, and the reciprocal exits.
- **Approval:** this has no dependency on another bot's approval. Claim it on #373 when you are the first guest free. The other guest does not start it.

**WBW-3.** Grok. World connection graph.

Section 9's Region, Map and Connection records are one data file listing 20 routes, 10 towns, 7 caves and 3 water routes. Each link has its gate (a badge, a story key, or a field lesson), its phase, and a one-way flag, which is set only for Glassfall.

The 15 current map ids that must be present are `larkhaven`, `thornwood_route`, `thornwood`, `saltmarsh_route`, `saltmarsh`, `emberfall`, `cloudglass`, `stillreed`, `hollowecho`, `sunthread`, `farwatch`, `league`, `spire`, `thornwood_grove` and `saltmarsh_pool`. The edges are the mermaid flowchart in section 2 of the design doc. Glassfall is the only one-way link. The league needs all 8 badges. No stretch has more than three routes between healers. With all lessons learned, everything can be reached from Larkhaven.

- **Files:** `docs/plans/wildbond-world/world-graph.json`, `docs/plans/wildbond-world/world-graph.md` and `tools/test_wildbond_world_graph.py`.
- **Done when:** `python3 -m unittest tools/test_wildbond_world_graph.py` passes. It checks the counts, that every link is two-way except Glassfall, that all 15 current map ids are present, that everything can be reached from Larkhaven with all lessons, that the League needs all 8 badges, that no stretch has more than three routes between healers, that the edges match the mermaid flowchart in the design doc, and that it agrees with WBW-2's exits if that piece exists. `python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD` prints `No packed Wildbond game files changed`.
- **The dev lead wires up later:** the exits, INTERIORS, and the Glide inn list.
- **Approval:** this has no dependency on another bot's approval. If WBW-2's file is not on main yet, the exit agreement check waits for that file and does not block this pull request.

## Grok, now

GAD's change on #449, then the conflict on #438. Do these before the next build. They are already open, so they are not unclaimed rows.

**#449 sign wiggle.** Game Art Director asked for one change on the Little Ranch polish pull. Turn the idle sign wiggle off under `prefers-reduced-motion: reduce`. Otherwise make it gentle: a small shake every 8 to 10 seconds, or a slow bob. Push that fix together with a normal merge of main. Do not rebase or force-push. If the branch still has docs/COMMS.md edits, take main's version of that file and do not commit a new COMMS edit. Ask Game Art Director to re-check.

- **Files:** `games/little-ranch/game.js`, `tests/little-ranch.html`, and `tools/playtest/little-ranch-review.cjs`. Do not take the kitchen bowl, the console 404, or the sign tap responses. Those are LR-TOY-POLISH, and Side Games Dev Lead owns them.
- **Done when:** reduced motion shows no wiggle, the ordinary wiggle is the slower motion above, and the pull is clean against main.
- **Approval:** this change does not depend on another bot's approval. Game Art Director re-checks the motion after the push. That review is the ordinary art check, not a blocker that stops the next row.

**#438 conflict.** Night Market visuals is already approved by Game Art Director. Merge current main into that branch with a normal merge. Do not rebase or force-push. Take main's version of docs/COMMS.md and do not commit a new COMMS edit. Leave the games, tests and art as Game Art Director approved them.

- **Files:** the #438 branch only, to resolve the conflict. That branch already contains `games/night-market/game.js`, `games/night-market/index.html`, `games/night-market/lane.js`, `games/night-market/style.css`, and `tests/night-market.html`. Do not start a second Night Market art pass, and do not take the phone-layout edits that belong to #456.
- **Done when:** the branch merges cleanly with main and the approved visuals are unchanged.
- **Approval:** this does not depend on another bot's approval.

## Grok, next

These two are assigned. They are not in the unclaimed pool.

**NM-FIX-6.** The Night Market play residual. "Your save" does something. A reload shows the away summary. Every other game's save is left alone. Fix only what you can reproduce. One Night Market pull, with reload evidence. No save-format change and no version bump. This closes checklist item 11 and the NML-3 reload check in the Night Market launch checklist. Dot will not take this row. #438 and #456 already edit Night Market files, so this pull must not add a third editor of the same file.

- **Files:** the save-control path in `games/night-market/game.js`, and a new `tests/nm-save.cjs`. Do not edit `games/night-market/index.html`, `games/night-market/style.css`, `games/night-market/lane.js`, or `tests/night-market.html` while #438 or #456 is open. If "Your save" cannot be fixed without one of those files, say so on #373 and stop. Leave the phone layout to NM-PHONE.
- **Done when:** "Your save" does something on the live page, a reload shows the away summary, and other games' saves are untouched. Old saves load. `node tests/nm-save.cjs` passes, and the existing Night Market page check still passes.
- **Approval:** this has no dependency on another bot's approval.

**WB-ROAD.** One Godot pull for WBL-8, WBL-9 and WBL-10, and WBL-16 because it is the same title screen. The road from Larkhaven to Thornwood goes somewhere a newcomer can walk (WBL-8). Continue goes through the title screen and returns to the same place (WBL-9). Clicking "Continue your journey" chooses Continue (WBL-16). A real end-to-end Continue test starts a journey, quits, continues, and lands in the same place, not only a fixture load (WBL-10). WBL-7 stays with the north-roads check from #416. Stay out of the Wildbond dev lead's fix bundle (#458: mouse clicks on buttons, walking speed, and the opening tidy). Old saves must load. There is no save-format change.

The map data already connects Larkhaven north to the Thornwood route, and that route north to Thornwood. Reproduce the "does nothing" path. If a walkable exit tile is missing, or the exit character is not marked as an exit, fix that in `wildbond-godot/data/wildbond.json` only. If the only block is the "Not yet" sentence or the door check in `wildbond-godot/scripts/main.gd`, do not edit `main.gd`. Say what you reproduced on #373 and leave that part. WBL-9, WBL-10 and WBL-16 still go ahead in the title screen.

- **Files:** `wildbond-godot/scripts/title.gd`, a new standalone `wildbond-godot/tests/wbl_continue.gd`, and `wildbond-godot/data/wildbond.json` only if the reproduced road bug is exit data. Do not edit `wildbond-godot/scripts/main.gd`, `battle.gd`, `card.gd`, `controls.gd`, `howto.gd`, `phone_shell.gd`, `touch_pad.gd`, `turn_card.gd`, or `wildbond-godot/tests/run_tests.gd`. Those belong to the fix bundle or to the phone-layout pull. Do not edit the early-encounter or healing code that WB-LOOK owns. The Continue test runs as its own headless script, so it does not need a line in `run_tests.gd`.
- **Done when:** Continue returns to the same place, clicking "Continue your journey" chooses Continue, and the end-to-end test passes. The road either goes somewhere from the data fix, or the #373 note says the remaining block is in `main.gd` and was left there. Old saves load.
- **Approval:** this has no dependency on another bot's approval.
- **Re-export:** Rebuild `play/wildbond/index.pck` only once, as the last step, right after merging main and just before review. Only one PR carries a Wildbond re-export at a time. #431 and #458 already carry a pack. If either is still open, leave the pack out of this pull and say so.

## dot, now

**LB-PLAYBOOK-DATA.** Already open as #451. Play and route definitions live in a data file. Breaking routes are in that file. The match engine stays unchanged. This row feeds LB-MANAGER later, and that later row is Side Games Dev Lead's. Do not wait on #444 to keep moving. When #444 merges, finish the approved HTML integration on #451 and preserve #444's final tests. If #444 is still unmerged when the next row goes to review, say so on #451 and switch. Do not wait.

- **Files:** `games/lantern-bowl/playbook.json` and `tests/lantern-bowl-playbook.cjs`. Leave `tests/lantern-bowl.html`, `games/lantern-bowl/game.js`, `model.js`, `style.css` and `view.js` until the #444 handoff, and do not edit the match engine.
- **Done when:** the data file holds the plays and the breaking routes, and the match engine is unchanged.
- **Approval:** the data file itself has no dependency on another bot's approval. The HTML integration waits on #444, and that wait is not a reason to sit idle.

## dot, next

**NM-PHONE.** Already claimed as #456. "Back to the arcade" is large enough and stops covering another button. A stall is on screen on a phone without scrolling. One Night Market pull, with phone-size screenshots held upright and sideways. This closes checklist item 10 (NM-FIX-8). Leave "Your save" to Grok's NM-FIX-6. Leave #438's art as approved. Do not edit `games/night-market/game.js` or `games/night-market/lane.js`, which #438 and NM-FIX-6 already use.

- **Files:** `games/night-market/index.html`, `games/night-market/style.css`, `tests/night-market.html`, `.github/workflows/night-market-phone-review.yml`, and `tools/playtest/night-market-phone.cjs`. These files are already on #456. Do not edit the save-control code NM-FIX-6 owns.
- **Done when:** the back control does not cover another button, and a phone shows a stall without a scroll.
- **Approval:** this has no dependency on another bot's approval.

**WB-LOOK.** One Godot pull for early pace (WBL-5). A faster early encounter rate and healing, so the first session is not a long walk with nothing to do. Include before-and-after timing. The early grass counter and the early-route heal call are the change. Fold in WBL-13, the sprite that vanishes when hit, only if that fix is small and stays out of the fix bundle's sprite and battle work. Stay out of the Wildbond dev lead's fix bundle and out of Grok's WB-ROAD files. Old saves must load. There is no save-format change.

- **Files:** the early encounter counter (`grass_n` and the range in `_arrived`) and the early-route heal call, in `wildbond-godot/scripts/main.gd` only. For WBL-13, only if it is small: `wildbond-godot/scripts/creature_sprites.gd` or `wildbond-godot/scripts/battle_effects.gd`. Do not edit `battle.gd`, `title.gd`, `wildbond.json`, `card.gd`, `controls.gd`, or the fix bundle's other functions in `main.gd` (clicks, walking speed, the starter screen, the Maren loop, the speech box, and the catch bar). Do not edit the Thornwood road or Continue files.
- **Done when:** the early route has encounters and healing, and the timing note is in the pull. Old saves load. If WBL-13 is not a small change in one of the two sprite files above, leave it and say so on #373.
- **Approval:** this has no dependency on another bot's approval.
- **Re-export:** Rebuild `play/wildbond/index.pck` only once, as the last step, right after merging main and just before review. Only one PR carries a Wildbond re-export at a time. If #431, #458, or Grok's WB-ROAD pull already carries the re-export, leave the pack out of this pull and say so.

## Not listed here

These stay off this backlog. Do not claim them.

- LB-GAMEFLOW, LB-FEEL, LB-MANAGER and LB-SEASON belong to Side Games Dev Lead. LB-SEASON also changes the save format.
- Wildbond fix bundle 2 is #458. Stay out of its files.
- LR-TOY-POLISH is the kitchen bowl, the console 404, and sign tap responses. Side Games Dev Lead owns it.
- LR19 to LR22 are on hold.
- There is no new Realmbound work.
- NM-HUB stays with Side Games Dev Lead.
- NM-FIX-7 and LRL-11 are Playtester sessions, not build pulls.
- NM-CLAMP waits on Shared Systems Architect.
- NM-RETUNE is merged (#445). Do not open it again.
- SF2.11 and ART-SF are not in this cycle's guest list. ART-SF is new art and waits on #426.

## Unclaimed rows

Take a Priority row above before any bug-fix row in this section.

Little Ranch, Lantern Bowl and Night Market were taken first, in that order. None of them has a remaining unclaimed build row whose files are free.

Little Ranch's open build is #449, which Grok already has, and LR-TOY-POLISH, which Side Games owns on the same game files. LRL-11 is a Playtester session. LR19 to LR22 are on hold. The first-visit sound reload is already merged (#439).

Lantern Bowl's remaining bundles are LB-GAMEFLOW, LB-FEEL, LB-MANAGER, LB-SEASON and dot's LB-PLAYBOOK-DATA. The phone layout is landscape-only and already done in #432. There is no leftover Lantern Bowl file that avoids those bundles and avoids `shared/sports-office.js`.

Night Market's leftover build rows are Grok's NM-FIX-6 and #438, and dot's NM-PHONE. Those pulls already share the Night Market page. NM-HUB stays with Side Games. NM-RETUNE is merged. NM-CLAMP waits on Shared Systems Architect. NM-FIX-7 is a Playtester session. A third Night Market row would edit a file one of those pulls already has.

Wildbond's background lane was next. WB-ROAD and WB-LOOK are the assigned rows above. WBL-7 stays with the north-roads check from #416. WBL-16 rides inside WB-ROAD because it is `title.gd`. WBL-15 (long captions) and WBL-17 (the ranch prompt) sit in `main.gd` beside the fix bundle and beside WB-LOOK, so they are not separate rows. WBL-19 (the size table) sits in `main.gd` and `battle.gd`. WBL-18 was checked on 2026-10-15: `wildbond.json` does not contain duplicate species names, and DD-5 already says which lines use trust plus level, so it is not a build row. WBL-20 needs Evan. WBL-21 is wording, and DD-5 is already updated. WBL-22 is merged (#399). Shop clicks use `controls.gd`, which the fix bundle owns. There is no further Wildbond file that is free of the fix bundle, the phone-layout pull, WB-ROAD and WB-LOOK.

The rows below are keep-alive bug fixes for the other games. Brisket's Crossing already says "1 life" and already starts from get-ready on Space or an arrow. Only its short back link is still open, as BC-HOME. Each row has an ID, a scope in plain sentences, the files it touches, a done check, and an explicit statement that it has no dependency on another bot's approval. That statement is true: there is no save-format change, no `shared/` or `sw.js` edit, and no new art. No two of these rows touch the same files, and none of them touch a file named under Now or Next.

Nine unclaimed rows are ready for each guest.

### Grok, unclaimed

**DM-ROSTER.** Generated players draw a first name and a last name independently, so one club can hold two players with the same full name. Filling the batting order keeps an existing nine and can leave a better new signing on the bench. Fix both in the roster code. Do not edit `shared/sports-office.js`. Do not change the save format. A player already saved keeps their name.

- **Files:** `games/diamond-manager/js/league.js` and a new `tests/dm-roster.cjs`. Do not edit `tests/diamond-manager.html`, `tests/diamond-manager-checks.js`, `games/diamond-manager/js/game.js`, or `games/diamond-manager/js/ui.js`.
- **Done when:** a seeded league does not generate two identical full names on the same club, a better new batter is not stuck on the bench solely because the old nine was already full, and `node tests/dm-roster.cjs` passes. The existing Diamond Manager checks still pass. Old saves load.
- **Approval:** this has no dependency on another bot's approval.

**DM-SIM.** A home run sentence already ends with an exclamation mark, and the play step adds a period, so the line reads "to left!." A strikeout names the pitcher by surname only, so "against Ember" can be read as an element instead of a person. Use the pitcher's full name in that one sentence. Simulated games have also been reported leaving a starter in well past the 90 to 120 pitches the roster page states. The tired-pitcher hook returns nothing when no rested arm is available. Reproduce a simulated game that still does that, and fix only the path that still fails. Leave the other play-by-play sentences as they are.

- **Files:** `games/diamond-manager/js/game.js` and a new `tests/dm-sim.cjs`. Do not edit `league.js`, `ui.js`, `form.js`, `tests/diamond-manager.html`, or `tests/diamond-manager-checks.js`.
- **Done when:** a home run line does not end with "!." A strikeout names the pitcher in full. If a simulated starter still throws past the stated band, that path stops doing so, and the test shows the pitch count. If the band already holds, the test says so and the sentence fixes still land. `node tests/dm-sim.cjs` passes. Old saves load.
- **Approval:** this has no dependency on another bot's approval.

**DM-UI.** The scoreboard says "1 wins" and "1 losses". The ceiling line can also show a rounded scout figure below the player's current overall, such as "about 60" for a player who is already 63. Say "1 win" and "1 loss", and never show a ceiling below the overall the player already has. Leave the scout-rounding rule itself in `league.js` alone.

- **Files:** `games/diamond-manager/js/ui.js` and a new `tests/dm-ui.cjs`. Do not edit `league.js`, `game.js`, `tests/diamond-manager.html`, or `tests/diamond-manager-checks.js`.
- **Done when:** one win and one loss read as "1 win" and "1 loss", a displayed ceiling is never below overall, and `node tests/dm-ui.cjs` passes. Old saves load.
- **Approval:** this has no dependency on another bot's approval.

**DM-FORM.** Issue #340 says pitchers always show Steady. `form.js` already has a pitcher rule: three innings, warm at a 3.00 ERA or better, cool at 6.00 or worse. Reproduce a pitcher who met that bar and still reads Steady. If the mark never lands, fix `recordForm` so a qualifying good outing reads warm and a qualifying bad outing reads cool. If every Steady pitcher you can reproduce was under three innings, leave that bar in place and say so on #373. Do not add Sim week, streak icons, or an Iona bench suggestion. Those are tuning, not this row.

- **Files:** `games/diamond-manager/js/form.js` and a new `tests/dm-form.cjs`. Do not edit `ui.js`, `game.js`, `league.js`, `tests/diamond-manager.html`, or `tests/diamond-manager-checks.js`.
- **Done when:** a qualifying good outing and a qualifying bad outing are no longer both Steady, or the #373 note says the three-inning bar is why they still read Steady and the code is unchanged. `node tests/dm-form.cjs` passes. Old saves load.
- **Approval:** this has no dependency on another bot's approval.

**DM-TRAIN.** The winter outlook asks `scoutCeiling`, which rounds. A player whose overall is already 63 can be shown a before-figure of about 60. The numbers `trainingForecast` returns must not sit below the overall the player already has. Leave the scout-rounding function in `league.js` alone. The outlook screen already prints these numbers, so this row does not edit that screen.

- **Files:** `games/diamond-manager/js/training.js` and a new `tests/dm-train.cjs`. Do not edit `ui.js`, `league.js`, `tests/diamond-manager.html`, or `tests/diamond-manager-checks.js`.
- **Done when:** a forecast's before and after figures are never below the player's overall, and `node tests/dm-train.cjs` passes. Old saves load.
- **Approval:** this has no dependency on another bot's approval.

**DM-TAGS.** Field name tags are drawn centred on a point and are never kept inside the canvas. A tag on a foul line or a high fly can run off the edge of Lamplight Field. Keep every tag inside the drawable field. Drawing must not change the league.

- **Files:** `games/diamond-manager/js/field.js` and a new `tests/dm-tags.cjs`. Do not edit `ui.js`, `game.js`, `tests/diamond-manager.html`, or `tests/diamond-manager-checks.js`.
- **Done when:** a tag placed at the left edge, the right edge, and the top of the field stays inside the canvas, and `node tests/dm-tags.cjs` passes. Old saves load.
- **Approval:** this has no dependency on another bot's approval.

**EB-READY.** Ember Bricks tells the screen reader "1 lives". The get-ready panel also ignores Space and the arrow keys, because a key press returns early while focus is on the start button. Brisket's Crossing already starts from get-ready on Space or an arrow, and it already says "1 life". Match that. The back link is an anchor with a 44px minimum width, and a 44px minimum height only on a short screen. Give it a 44px minimum height as well.

- **Files:** `games/ember-bricks/game.js`, `games/ember-bricks/style.css`, and `tests/ember-bricks.html`.
- **Done when:** one life reads as "1 life", Space or an arrow starts the run from get-ready, the back link is at least 44px tall, and `tests/ember-bricks.html` still passes. Old scores load.
- **Approval:** this has no dependency on another bot's approval.

**ST-READY.** Storm Front tells the screen reader "1 lights remaining". The get-ready panel has the same early return, so Space and the arrow keys do not start the run. Say "1 light" when one light is left. Start from get-ready on Space or an arrow, the way Brisket's Crossing does. Give the back link a 44px minimum height, not only a 44px minimum width.

- **Files:** `games/storm-front/game.js`, `games/storm-front/style.css`, and `tests/storm-front.html`.
- **Done when:** one light reads as "1 light", Space or an arrow starts the run from get-ready, the back link is at least 44px tall, and `tests/storm-front.html` still passes. Old scores load.
- **Approval:** this has no dependency on another bot's approval.

**BC-HOME.** Brisket's Crossing already says "1 life" and already starts from get-ready on Space or an arrow. The back link is still an anchor with a 44px minimum width, and a 44px minimum height only when the screen is shorter than 500px. On a normal phone the link is shorter than 44px. Give it a 44px minimum height in the ordinary layout. Do not change the hop, the lives, or the recovery.

- **Files:** `games/briskets-crossing/style.css` and `tests/briskets-crossing.html`. Do not edit `games/briskets-crossing/game.js` or `games/briskets-crossing/model.js`.
- **Done when:** the back link is at least 44px tall on a phone-height screen above 500px, and `tests/briskets-crossing.html` still passes. Old scores load.
- **Approval:** this has no dependency on another bot's approval.

### dot, unclaimed

**LH-READY.** Lighthouse Watch tells the screen reader "1 boats afloat". The get-ready panel returns early while focus is on the start button, so Space and the arrow keys do not start the night. Say "1 boat" when one boat is left. Start from get-ready on Space or an arrow, the way Brisket's Crossing does. Give the back link a 44px minimum height, not only a 44px minimum width.

- **Files:** `games/lighthouse-watch/game.js`, `games/lighthouse-watch/style.css`, and `tests/lighthouse-watch.html`.
- **Done when:** one boat reads as "1 boat", Space or an arrow starts the run from get-ready, the back link is at least 44px tall, and `tests/lighthouse-watch.html` still passes. Old scores load.
- **Approval:** this has no dependency on another bot's approval.

**SF-PLAY.** Starfall village issue #333 still says a click can miss once the window is scaled, and the code comment on `_view_point` says the same: the hardware cursor is not that point once the window is scaled, and a touch is not the finger. Build cards and dialogue can also draw over the notice text. The day summary can still report "Meals served: 0" and can point the goal the wrong way. Reproduce items 1, 3 and 4 of #333 and fix only what still fails. Leave the second-pin behaviour alone unless a pin still knocks the first pin off. Do not add a menu, do not change the walk speed, and do not add "repeat yesterday's jobs".

- **Files:** `starfall-godot/scripts/main.gd` and a new standalone `starfall-godot/tests/sf333.gd`. Do not edit `starfall-godot/scripts/safe_save.gd`, `starfall-godot/tests/run_tests.gd`, `play/starfall/`, or any file under `starfall-godot/assets/`. The new test runs as its own headless script.
- **Done when:** a scaled click or tap lands on the control under the finger for each reproduced miss, overflow text stays inside its card, and a day that served meals does not report zero if that path still fails. `sf333.gd` passes. Old saves load. There is no save-format change and no new pack.
- **Approval:** this has no dependency on another bot's approval.

**SG-TIME.** Starfall Guild's region-choice timer was fixed in SG-N1 (#264): `advance()` now counts those seconds. The playtest note says that one path does not prove why a whole session undercounted. Reproduce any remaining undercount in the loop only. Fix only what you can reproduce. If nothing remains, say so on #373 and stop. Do not add a save field. Previously missed time cannot be reconstructed.

- **Files:** `games/starfall-guild/js/04-loop.js` and a new `tests/sg-time.cjs`. Do not edit `tests/starfall-checks.js`, `tests/starfall.html`, or any other guild script.
- **Done when:** either the reproduced undercount is gone and `node tests/sg-time.cjs` shows the counted seconds, or the #373 comment says no remaining undercount reproduced and the loop is unchanged. Old saves load.
- **Approval:** this has no dependency on another bot's approval.

**KM-MONTH.** Keymaster's first-year month grid is six columns, and four columns below 420px. A month amount such as −$1,400 does not fit a phone cell, so the year reads as a sideways scroll or a clipped figure. Let the grid wrap, or drop to fewer columns, under about 480px so each month stays readable. Do not change the model, the scripted year, or the save.

- **Files:** `games/keymaster/style.css` and `tests/keymaster.html`. Do not edit `games/keymaster/game.js` or `games/keymaster/model.js`.
- **Done when:** a phone-width screenshot shows the first-year months without a sideways scroll, the amounts are readable, and `tests/keymaster.html` still passes. Old saves load.
- **Approval:** this has no dependency on another bot's approval.

**OW-KEY.** When an Otherworld beat is asking and more than one choice is ready, Space or Enter takes the first ready choice. A player who meant the other choice never gets to pick. Number keys and clicks already choose a specific line. When two or more choices are ready, Space and Enter must not take one of them. A beat with a single ready choice may still advance. Do not edit the shared dialogue code.

- **Files:** `games/otherworld/js/99-boot.js` and a new `tests/ow-key.cjs`. Do not edit `tests/otherworld-checks.js`, `tests/otherworld.html`, `games/otherworld/js/08-open-choices.js`, or anything under `shared/`.
- **Done when:** with two ready choices, Space and Enter leave the choice open, a number key or a click still picks one, a single ready choice still advances, and `node tests/ow-key.cjs` passes. The existing Otherworld checks still pass. Old saves load.
- **Approval:** this has no dependency on another bot's approval.

**SG-TAP.** Starfall Guild's tab buttons use 6px of vertical padding at 13px type, and the buy-amount buttons use 4px. The arcade link has no 44px minimum. The recovery buttons are already 44px tall. Raise the short controls to a 44px minimum height. Leave the recovery panel's rules as they are.

- **Files:** `games/starfall-guild/style.css` and a new `tests/sg-tap.cjs`. Do not edit `games/starfall-guild/js/04-loop.js`, `tests/starfall.html`, or `tests/starfall-checks.js`.
- **Done when:** tabs, buy-amount buttons, and the arcade link are at least 44px tall, the recovery buttons stay usable, and `node tests/sg-tap.cjs` passes. Old saves load.
- **Approval:** this has no dependency on another bot's approval.

**OW-TAP.** Otherworld's arcade link, header buttons, and chips use about 6px of padding at 13px type. The colour swatches are 34px circles. Give those controls a 44px minimum box so a finger can hit them. Do not change the story, the choices, or the shared accessibility sheet.

- **Files:** `games/otherworld/style.css` and a new `tests/ow-tap.cjs`. Do not edit `games/otherworld/js/99-boot.js`, `tests/otherworld.html`, `tests/otherworld-checks.js`, or anything under `shared/`.
- **Done when:** the arcade link, header buttons, chips, and swatches are at least 44px in both directions, and `node tests/ow-tap.cjs` passes. The existing Otherworld checks still pass. Old saves load.
- **Approval:** this has no dependency on another bot's approval.

**PR-AWAY.** Primordial's away path adds nutrients before the player does anything, and the modal says "Your pool kept growing while you were away." That is the open note AR2.14b. The growth must wait until the player spends a welcome-back gift by pressing the button. Do not add a save field. If the gift cannot be done without a new save field, say so on #373 and stop. In the same file, the arcade link is 13px type with 5px of padding, and the tabs and buy-amount buttons are shorter than 44px. Give those controls a 44px minimum height.

- **Files:** `games/primordial/index.html` and a new `tests/pr-away.cjs`. Do not edit `shared/` or `sw.js`.
- **Done when:** returning to the page does not add nutrients until the player spends the gift, the away line no longer says the pool grew by itself, the arcade link and the short buttons are at least 44px tall, and `node tests/pr-away.cjs` passes. Old saves load.
- **Approval:** this has no dependency on another bot's approval.

**DM-MOOD.** When a finished game has no used-pitcher list for a club, morale treats `g.starters` as the pitchers who played. That list holds both clubs' starters, so the other club's starter can be marked as having pitched here. Count only this club's used list. If that list is missing, count this side's own starter and nobody else. Do not change mood numbers, contracts, or the save shape.

- **Files:** `games/diamond-manager/js/morale.js` and a new `tests/dm-mood.cjs`. Do not edit `ui.js`, `game.js`, `form.js`, `league.js`, `tests/diamond-manager.html`, or `tests/diamond-manager-checks.js`.
- **Done when:** a game with no used-list for one club does not mark the other club's starter as having pitched for it, and `node tests/dm-mood.cjs` passes. Old saves load.
- **Approval:** this has no dependency on another bot's approval.
