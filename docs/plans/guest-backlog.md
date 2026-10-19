# Guest backlog

**Lantern Bowl is shelved (Evan, 2026-10-18).** Skip every LB row (LB-G12, LB-G13, LB-G14, LB-PAL and the rest) and take the next non-Lantern Bowl row in your order.

Standing work for the guest AIs, Grok and dot (Adam's). This page is the list they take from. Issue #373 is where a guest claims the next row. [QUEUE.md](../QUEUE.md) "This cycle" still says what the launch is. A row here is ready to start. It does not wait on another bot's approval.

Generations PM keeps at least 8 priority rows per guest and tops up whenever either guest drops below 4.

Generations PM read issue #373 (latest comments), this cycle in QUEUE, the Little Ranch, Lantern Bowl and Night Market launch checklists, and the open pull requests on 2026-10-15 before writing these rows. Claimed and in-flight work is named under "Now" and is not repeated as an unclaimed row.

## Rules

Guest AIs never wait. When you finish a task or are blocked waiting on a reply, don't ask: claim the next unclaimed row for you in this backlog (as a #373 comment) and start it. While an approval is pending, work the next row in the meantime. Generations PM keeps at least 8 priority rows per guest and tops up whenever either guest drops below 4.

Feature PRs never edit docs/COMMS.md. Claims and handoffs go in #373 comments or this backlog. Only Generations PM's post-merge bookkeeping touches COMMS.

For WB-ROAD and WB-LOOK: Stay out of the Wildbond dev lead's fix bundle. Rebuild play/wildbond/index.pck only once, as the last step, right after merging main and just before review. Only one PR carries a Wildbond re-export at a time.

Every row below avoids a save-format change, edits under shared/, edits to sw.js, and new art. None of them depends on another bot's approval. No two rows on this page touch the same files. A guest's later row also stays off the files their own open pull already has, so a review wait never means two pulls editing one file.

## Priority rows (take these before the bug-fix rows)

Take these before any row under "Unclaimed rows". The nine bug-fix rows for each guest stay below as the fallback.

Side Games Dev Lead scoped nine launch-game rows. In those rows, "I" and "mine" mean Side Games Dev Lead. Wildbond & Starfall Dev Lead scoped three world-build rows from [wildbond-world-design.md](wildbond-world-design.md) (#455) and will review each Wildbond pull. Side Games Dev Lead will review each launch-game pull. That review is not a wait. There is no dependency on another bot's approval.

Checked against the merged pulls and the latest #373 comments on 2026-10-15.

- **Grok:** WBW-4 (now, already in progress), then LR-G2, LB-G13, LB-G14, LR-G3, LR-G4, NM-G8, LB-PAL (seventh, after NM-G8), then LR-G1, WBW-7, WBW-9, WBW-11, WBW-13, WBW-15, WBW-17. Open priority rows left: 15.
- **dot:** WBW-5 (now, #501) and NM-G3 (#499) are already in progress. Then NM-G6, LB-G12, NM-G7, NM-G10, then WBW-8, WBW-10, WBW-12, WBW-14, WBW-16, WBW-18. Open priority rows left: 12. LB-G11 and NM-G9 are merged. Do not start a second copy.
- There is no LB-G4b row. A row that is merged, or already in review, is done for this queue. Do not start a second copy.
### Batch 3

Side Games Dev Lead drafted these on 2026-10-15. Launch games come before the Wildbond rows, and these rows sit below work that is already in progress. In these rows, "I", "mine" and "my" mean Side Games Dev Lead. The row text below is copied from the spec.

LR-G2 and LR-G3 both go to Grok. They edit the same files, and dot cannot take browser screenshots. The spec names LR-G3 for dot and NM-G7 for Grok. This queue gives LR-G3 to Grok and NM-G7 to dot.

Each bundle starts by re-checking its items on current main and dropping any that no longer reproduce, with a note in the pull. The bundles are LR-G2, LR-G3 and NM-G8.

The held toy pulls #404 to #412 will conflict with LR-G2, LR-G3 and LR-G4, and that is expected. They stay on hold. The open ones are #404, #409, #411 and #412, and they edit `games/little-ranch/game.js`. Do not wait for them.

### Dev lead keeps

- Night Market reset and new game
- Mooncake and cart balance
- NM-HUB
- The district move, since it is a save change
- All Lantern Bowl wiring into `game.js` and `model.js`, and the season save design

### LR-G2. Layout and depth bundle: the fox and the ball, signs, bubbles, Pebblit, puddles

**Status:** Grok, ready now, after WBW-4. Merge only after Playtester confirms it does not regress the 8/10 build, because Little Ranch launches on 16 October. Start by re-checking each item on main and drop any that no longer reproduce.

- **Guest:** Grok. This bundle is mostly screenshots, and Grok can run Chromium.
- **Scope:** Fix the five layout and draw-order problems from Playtester's 8/10 report and Reviewer's LRL-11 phone notes, in one PR.
  1. **The fox hides the ball at the start and after every roll.** This is the top item. Draw the ball in front of the fox, or keep the fox's resting spot clear of where `ballSpot()` puts the ball.
  2. **The five signs overlap in portrait.** Space `sign`, `wsign`, `ksign`, `tsign` and `dsign` so no two tap zones or drawings overlap on tall screens. Wide layouts stay as they are.
  3. **The bedtime toothbrush and cup bubble covers the hat basket and the bowl.** Move the bubble so it clears both.
  4. **Pebblit walks over the hat basket in landscape.** Keep its path off `L.basket`.
  5. **Puddles sit behind the ball or the bush.** Place `L.puddles` so they are not hidden, or draw them above the ground layer, and keep their tap zones clear.
- **Files:** `games/little-ranch/game.js` (layout in the `L.*` setup, `ballSpot()`, the friend's path and the draw order only), `tests/little-ranch.html` (new checks), and `docs/playtests/lr-layout-depth/` (screenshots and a README). Do not change the toys, timings, sounds or the settings key.
- **Done check:** new checks in `tests/little-ranch.html` show that the ball's rectangle is never covered by the fox at the start or after a roll, that no two sign tap circles overlap at 390x844 and 360x780, that the bedtime bubble does not intersect the basket or the bowl, that Pebblit's path never enters the basket circle at 844x390, and that both puddles are visible and not covered by the ball or the bush. The existing Little Ranch checks still pass, and CI is green. Before and after screenshots at 390x844, 844x390, 360x780 and 1024x594 go to GAD for review. The only stored value is still `little-ranch-settings-v1`.
- **What I wire later:** nothing. Playtester re-checks the layout on a phone.
- **Dependencies:** none.

### LB-G13. Headless full-season simulation test (LB-SEASON) (shelved 2026-10-18, do not start)

**Status:** Grok, ready now, after LR-G2.

- **Guest:** Grok.
- **Scope:** Write a test that plays whole seasons headlessly, using `season.json`, `roster.json`, `standings.js` and `progression.json` from main. Each match uses a simple score model written inside the test, which is not the game's engine. It proves that the season pieces fit together before I build LB-SEASON.
- **Files:** create `tests/lantern-bowl-season-sim.cjs` and `docs/playtests/lb-season-sim/README.md`. Edit nothing else. Do not import `lineup.js` or `training.json`, because they may not have merged yet.
- **What it does:** for each seeded season, play the 30 fixtures (each club's strength is the average of its roster ratings, and the winner is drawn with a logistic on the difference), build the table with `LanternBowlStandings.table`, the bracket with `bracket`, play the semis and the final with `advance`, then age and level every player once with `progression.json`'s rules. Run 200 seasons.
- **Done check:** `node tests/lantern-bowl-season-sim.cjs` passes, and it checks that every season has 10 weeks and 30 games, each club plays 10, the bracket is valid with a champion, the strongest club (`harrowgate`) wins the Lamplight Cup more often than the weakest (`fernmoor`) but less than 70% of the time, every rating stays within 35 to 90 after five chained seasons, and the same seed gives the same result. The README has the title-share table. CI is green.
- **What I wire later:** I use the results to tune LB-SEASON, and I add this check to `tests/lantern-bowl.html` when the season is wired.
- **Dependencies:** none.

### LB-G14. Dilemma picker, headless (LB-SEASON) (shelved 2026-10-18, do not start)

**Status:** Grok, ready now, after LB-G13.

- **Guest:** Grok, who wrote the dilemma cards (LB-G6).
- **Scope:** Write a pure module that chooses which card from `dilemmas.json` to show after a match, in a bye week or before a game, with no repeats in a season and a fair spread of roles. It is seeded, with no save of its own.
- **Files:** create `games/lantern-bowl/dilemma-pick.js` and `tests/lantern-bowl-dilemma-pick.cjs`. Do not edit `dilemmas.json`.
- **Shape:** a UMD file exposing `LanternBowlDilemmaPick`. `pick(cards, { when, used, rng })` returns one card whose `when` matches and whose `id` is not in `used`, or `null` if none is left. `used` is a plain array of card IDs that the caller keeps. It prefers a role it hasn't shown recently. `apply(card, choiceIndex, state)` returns a new effects summary (`morale`, `points`, `fans`, `owner`) and does not change the `state` it was given.
- **Done check:** `node tests/lantern-bowl-dilemma-pick.cjs` passes, and it checks that each `when` only gets matching cards, no card repeats within a ten-week season, the result is `null` when that `when` is used up, the same seed gives the same sequence, `apply` returns the card's exact effects and leaves its input untouched, and a bad `when` throws. CI is green.
- **What I wire later:** LB-SEASON shows the picked card and stores `used` and the effects in the season save, which goes to Evan through Director.
- **Dependencies:** none.

### LR-G3. Toys and timing bundle: cutter tint, head paint, shed pet, bedtime waits, hints

**Status:** Grok, after LR-G2 merges. The spec names dot. This queue gives it to Grok, because LR-G2 and LR-G3 edit the same files and dot cannot take browser screenshots. Same Playtester gate as LR-G2: merge only after Playtester confirms it does not regress the 8/10 build. Little Ranch launches on 16 October. Start by re-checking each item on main and drop any that no longer reproduce. The held toy pulls #404 to #412 will conflict, and that is expected.

- **Guest:** dot. **Start after LR-G2 merges.** Both edit `games/little-ranch/game.js` and `tests/little-ranch.html`. Merge `main` normally when you start, and do not rebase onto LR-G2's branch.
- **Scope:** Fix five toy and timing items in one PR.
  1. **The cutter ignores the dough tint and makes a peach bunny.** The stamped dough baby should use `doughCol()`, which is the tinted colour.
  2. **Head paint tints one eye.** Painting the head should colour the head, not an eye. Keep the eyes their normal colours.
  3. **The paint-shed pet is a white cat, but the yard pet is the fox (Cindercub).** Draw the shed outline as Cindercub's shape, so what you paint is the pet you see in the yard. Paint already comes back to the ranch through `st.paint`, which is visit memory and not a save, and bedtime washes it off. Check that a painted pet shows its colours in the yard. If it does not, fix it in `st.paint`. Do not add a stored value.
  4. **Bedtime step waits.** `ROUTINE_WAIT` is 18 seconds in the code, but the README says about 8. Set it to 9 seconds (inside the 8 to 10 that suits toddlers), and make the README's bedtime line match.
  5. **The wagon horse and the barn door are a little hidden for toddlers.** Add them to the idle-hint glow, the way the other ranch things get it: the wagon's puller once you are inside the wagon place, and the barn door's sign (`dsign`) on the ranch if it hasn't been tried. A hint is enough. Don't move them.
- **Files:** `games/little-ranch/game.js`, `games/little-ranch/README.md` (the bedtime wait and the new hints), `tests/little-ranch.html`, and `docs/playtests/lr-toys-timing/`.
- **Done check:** new checks in `tests/little-ranch.html` show that a stamp after tinting uses the tinted colour, that painting the head leaves the eye colours unchanged, that the shed outline matches the yard pet's shape, that `ROUTINE_WAIT` is 9 and the README agrees, that the hint list reaches the wagon's puller and the barn-door sign, and that a painted pet keeps its colours in the yard until bedtime. No new localStorage key is written. Existing checks pass, and CI is green. Screenshots of the cutter, head paint and shed outline go to GAD, because the shed outline is drawing work.
- **What I wire later:** nothing. Playtester re-checks.
- **Dependencies:** LR-G2 must merge first (same files).

### LR-G4. Shed outline tap and the grown-ups close button

**Status:** Grok, right after LR-G3. Starts after LR-G3 merges, because both edit `games/little-ranch/game.js` and `tests/little-ranch.html`. Same merge gate as LR-G2 and LR-G3: merge only after Playtester confirms it does not drop below 8/10. Little Ranch launches on 16 October. The held toy pulls #404 to #412 will conflict, and that is expected.

- **Guest:** Grok.
- **Scope:**
  1. The baby outline in the shed gets a tap area of at least 44px at 844x390.
  2. The grown-ups panel's close button moves so it no longer overlaps the action card.
  3. Add a geometry test for both.
  4. The panel closing on finger lift after the hold gets flagged in the PR for a real-phone check, and is not marked fixed from emulation.
- **Files:** `games/little-ranch/game.js` and `tests/little-ranch.html`.
- **Done check:** the new geometry checks in `tests/little-ranch.html` show that the shed outline's tap area is at least 44px at 844x390, and that the grown-ups close button does not overlap the action card. Existing checks pass, and CI is green. The PR says the panel still closes on finger lift after the hold, and that this needs a real phone, not an emulated fix. Playtester confirms the build does not drop below 8/10 before merge.
- **Dependencies:** LR-G3 must merge first (same files).

### NM-G8. Playtester fix bundle: dumpling hold, sideways scroll, walkers on counters, page icon, busier lane

**Status:** Grok, after #499 merges. If it needs `model.js` or a save change, it stops and reports on #373. Start by re-checking each item on main and drop any that no longer reproduce.

- **Guest:** Grok. **Start after #499 merges.** #499 edits `style.css` and `tests/night-market.html`.
- **Scope:** Fix the guest-safe items from Playtester's Night Market report (7/10) in one PR. None of them needs `model.js` or a save change.
  1. **"Fold a dumpling" stays active past 12 of 12 before Bo is hired.** By design (#434), the serve button stays, and each serve still pays the hand amount. So keep the button, but stop the hold-to-repeat at the vendor's count before the hire, and change the line under the bar to point at the Ask button. This is in `game.js` (`render` and the hold handler).
  2. **A horizontal scrollbar may appear.** `lane.js` sets the lane's wrapper to `document.documentElement.clientWidth` pixels inside the padded `.window`. Make sure the page never scrolls sideways at any width from 320 to 1920 pixels (`lane.js` sizing or `style.css` `.lane`).
  3. **Walker silhouettes overlap the counter fronts.** Draw the passers-by on a lane line in front of or below the counters (`drawWalker` and its y-position in `lane.js`), so they don't cut across a counter.
  4. **favicon.ico returns a 404.** Add `<link rel="icon" href="../../icons/arcade.svg">` to `games/night-market/index.html`, as Little Ranch did. `icons/arcade.svg` is on main.
  5. **The lane does not get busier from 30 to 66 stalls.** `walkerCap()` in `lane.js` tops out at 2. Let it rise with the total stalls owned, for example 3 from 30, 4 from 50 and 5 from 66, and keep 0 under reduced motion.
- **Files:** `games/night-market/game.js`, `games/night-market/lane.js`, `games/night-market/style.css`, `games/night-market/index.html` (the game's page only), `tests/night-market.html`, and `docs/playtests/nm-playtest-fixes-2/`. Do not edit `model.js`, the save, or the root `index.html`.
- **Done check:** new checks in `tests/night-market.html` show that a hold before the hire stops at the vendor's count and the hint names the Ask button, that `document.documentElement.scrollWidth <= clientWidth` at 320, 390, 844, 1366 and 1920 widths, that no walker's box intersects a counter box, that the page requests the icon and no `favicon.ico`, and that `walkerCap` gives at least 3, 4 and 5 at 30, 50 and 66 owned and 0 under reduced motion. Existing checks pass, old saves load, and CI is green. Lane screenshots go to GAD.
- **What I wire later:** nothing.
- **Dependencies:** #499 must merge first (same CSS and test page).

### NM-G6. Third district data, on #483's schema

**Status:** dot, ready now, after NM-G3.

- **Guest:** dot, who wrote `districts.json` and the sim.
- **Scope:** Add a third district as a second entry in `districts.json`, with six new stall types and its own customers, and change the sim so it validates and paces each district in turn. Follow my NM-G2 ruling (comment 6183588332): the first type is open on arrival, the chain opens each later type at ten of the one before it, a permit opens the next locked type early, and the favourite vendor's stall type arrives unlocked with one owned. Set the third district's `moveAtLifetime` to 4,000,000, the second permit in §8.3's `floor(sqrt(lifetime / 1e6))`.
- **Files:** `games/night-market/districts.json` (append one district) and `tools/night-market-district-sim.cjs` (replace the "only one district" rule with checks that run for each district). Edit nothing else.
- **Done check:** `node tools/night-market-district-sim.cjs` passes for both districts. Stall IDs are unique across all three districts, including the first district's `STALLS`. The third district's time to unlock all six types through the chain alone lands in the same 48 to 66 minute band, and its first stall can be bought within 2 minutes of arriving. Every malformed-file case still fails for the right reason. If the rules make a check impossible, change the cost numbers, not the rules, and say so. The PR pastes the table, and CI is green.
- **What I wire later:** the district move, which changes the save and goes to Evan through Director.
- **Dependencies:** none.

### LB-G11. Weekly training focus data, on #480's progression.json (shelved 2026-10-18, do not start)

**Status:** Done. Merged as #511 (292b121d). Do not reopen it.

- **Guest:** dot, who wrote the progression table.
- **Scope:** Write the weekly training choices as data. Each choice is a focus the player picks between games (passing, running, blocking, pass rush, coverage, kicking, or rest). It adds a small amount of XP toward named rating keys, using the XP and level rules in `progression.json`. Add a validator that simulates a season. No save field is added.
- **Files:** create `games/lantern-bowl/training.json` and `tests/lantern-bowl-training.cjs`. Do not edit `progression.json`.
- **Shape:** `schemaVersion: 1` and `focuses`, each with an `id`, a `label` of at most 20 characters, a one-sentence `detail`, `ratings` (one to three of the shared rating keys), `bonusXp` (1 to 4 per player who matches), and `appliesTo` (roster groups from `roster.json`: `qb`, `rb`, `wr`, `te`, `line`, `front`, `backers`, `secondary`, `kicker`). `rest` gives no XP and has `recovery: true` for my fatigue wiring.
- **Done check:** `node tests/lantern-bowl-training.cjs` passes. It reads `progression.json` and `roster.json` from main, runs one seeded ten-week season for each focus, and checks that every rating stays within 35 to 90, no player passes their age-band `potential` cap, a focused group gains more than an unfocused one but no more than one extra level per season, every `appliesTo` group and rating key exists, and malformed files are rejected. CI is green.
- **What I wire later:** the training card between games, and storing the choice in the season save, which goes to Evan through Director.
- **Dependencies:** none.

### LB-G12. Depth chart and auto-lineup, headless (LB-MANAGER) (shelved 2026-10-18, do not start)

**Status:** dot, ready now, after LB-G11.

- **Guest:** dot. It bridges dot's roster and playbook data.
- **Scope:** Write a pure module that picks a club's starters from `roster.json` and turns them into what the engine needs. That means the playbook's roster identities (`qb`, `rb`, `wr[0]`, `wr[1]`, `te`), the named blockers and rushers for LB-MANAGER, and the old team-level numbers (`line`, `rush`, `cover`, `tackle`, `kick`) that `model.js` reads today. It changes no game file.
- **Files:** create `games/lantern-bowl/lineup.js` and `tests/lantern-bowl-lineup.cjs`. Edit nothing else.
- **Shape:** a UMD file exposing `LanternBowlLineup`. `starters(club, opts)` returns the 23 starters by group, best first, by a per-slot weighting that is written in the file (for example, a QB by `throw`, then `speed`). `opts.out` is a list of player IDs who can't play, and the next best player fills in, even from another group if one group runs out. `teamNumbers(starters)` returns `{ line, rush, cover, tackle, kick }` as rounded averages within 35 to 90. `playbookSlots(starters)` returns `{ qb, rb, wr: [a, b], te }`.
- **Done check:** `node tests/lantern-bowl-lineup.cjs` passes, for all six clubs in `roster.json`: 23 unique starters, the kept names in their slots when nobody is out, a correct substitute when a starter is out, team numbers within 35 to 90 that rise when a better player starts, the same input always giving the same output, and a clear error for an unknown group. CI is green.
- **What I wire later:** LB-MANAGER replaces the team-level numbers in `model.js` with this module's output and uses `playbookSlots` for the playbook.
- **Dependencies:** none.

### NM-G9. Willow Quay vendor tales

**Status:** Done. Merged as #515 (434fea91). Do not reopen it.

- **Guest:** dot, who named the Willow Quay vendors.
- **Scope:** Write four tales for each of the six Willow Quay vendors, using the same schema as `vendor-tales.json` and the same milestones (`hired`, `25`, `50`, `100`), so the second district has its own stories. This is data only.
- **Files:** create `games/night-market/district-tales.json` and `tests/nm-district-tales.cjs`. Do not edit `vendor-tales.json` or `districts.json` (NM-G6 edits `districts.json`).
- **Shape:** `schemaVersion: 1` and `districts: { "willow-quay": { <stallId>: [4 tales] } }` for `chestnut`, `ribbon`, `soup`, `kite`, `flower` and `music`. Each tale has `at`, a `title` of at most 32 characters, and a `text` of two or three sentences and at most 280 characters, naming its vendor and matching that vendor's habit in `districts.json` (for example, Lin saves the warmest cone for the last ferry worker).
- **Done check:** `node tests/nm-district-tales.cjs` passes. It reads the Willow Quay stall IDs and vendor names from `districts.json` on main and checks every stall, every `at`, the lengths, that each tale names its vendor, and that malformed files are rejected. Calm, child-safe, original text. CI is green.
- **What I wire later:** the Tales list for the second district, once the district move exists.
- **Dependencies:** none. It reads only the first district entry, which NM-G6 does not change.

### NM-G7. Per-tale art prompts for GAD, text only

**Status:** dot, ready now, after NM-G9. The spec names Grok. This queue gives it to dot. Game Art Director reviews it.

- **Guest:** Grok, who wrote the tales (NM-G1).
- **Scope:** Write a short illustration prompt for each of the 24 tales in `games/night-market/vendor-tales.json`, so GAD can plan one small picture per tale. This is text only. No images are made in this PR.
- **Files:** create `docs/art/night-market-tale-prompts.md`. Edit nothing else. Do not edit #498's `night-market-vendor-prompts.md`. #498 has merged, so link it for each vendor's look.
- **Content:** one entry per tale, in the file's order, with the stall ID, the `at` value and the tale title, then a prompt of at most 50 words that shows the tale's moment. Use the house art rules (ink outline, dusk and lamplight palette, real proportions, `docs/art/README.md`). Add a size note for a small card at the lane's pixel scale. No real people, no brands, and nothing copied from another game.
- **Done check:** 24 entries that match `vendor-tales.json` exactly by stall, `at` and title (a short note in the PR says how this was checked), every prompt is 50 words or fewer, and GAD reviews the file. CI is green.
- **What I wire later:** nothing directly. GAD uses it for tale art, and any art PR gets GAD's review.
- **Dependencies:** none.

### NM-G10. Stall count at 16px on a phone

**Status:** dot, at the end of the priority launch rows, after NM-G7. Starts after NM-G8 merges, because both touch `games/night-market/style.css`. #499 has already merged.

- **Guest:** dot.
- **Scope:** The stall's `.count` line goes from 14.72px to 16px on a phone. Today `.count` in `games/night-market/style.css` is `font-size: 0.92rem`.
- **Files:** `games/night-market/style.css` (the `.count` size on a phone) and `tests/night-market.html`. Screenshots go with the pull for Game Art Director.
- **Done check:** a test check at 390 and 844 widths shows the stall's `.count` line is 16px. Existing checks pass, old saves load, and CI is green. Game Art Director reviews the screenshots.
- **Dependencies:** NM-G8 must merge first (same `style.css`).

### WBW-7 to WBW-12

Wildbond & Starfall Dev Lead scoped these on 2026-10-15. They come after the batch 3 launch rows. Grok takes WBW-7, WBW-9 and WBW-11 after LR-G1. Dot takes WBW-8, WBW-10 and WBW-12 after NM-G10. The spec below is copied as written.

The level cap stays as data at 58 to 64 and the runtime clamps it, the echo-stone errand finishing after Hush is intended, the dark behaviour belongs to the runtime and the painter, and the placements are accepted, so none of these need guest work.

None of these depends on another.

Shared rules:
- Each one is one PR.
- Files go only under docs/plans/wildbond-world/ and tools/. Nothing changes under wildbond-godot/, so there's no re-export, no art and no save change.
- Each comes with a standalone Python unittest at tools/test_wildbond_world_<name>.py that runs with `python3 -m unittest`.
- Every place, route and town id must exist in docs/plans/wildbond-world/world-graph.json, and the test checks that.
- Anything the design doc calls a proposal (keepers, lines, rosters) gets "status": "proposed".
- The source of truth is docs/plans/wildbond-world-design.md, and the PR names the section it follows. Nothing in a PR may contradict it.
- No PR touches COMMS, START-HERE or DEVELOPMENT-PATH.
- Reading wildbond-godot/ data is fine (species and move ids, CAP_TABLE). Editing it isn't.
- Every done check also runs `python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD`, which must print 'No packed Wildbond game files changed'.

## WBW-7: towns.json plus towns.md

**Guest:** Grok, after LR-G1.

The 10 towns from the Towns table in section 2. For each town:
- id, name and the world-graph node
- the proposed healer
- the indoor rooms
- the outdoor people who stay outside
- the keeper's shelf: lures and berries only, except that Reedhold has Colm's full shop

The test checks that every town is in the graph. It also checks that no walkable route node is more than 3 route steps from a town with a healer (BFS over the graph, with water routes counted only when they're flagged Tide Ride).

## WBW-8: kilnvent.json plus kilnvent.md

**Guest:** dot, after WBW-5. NM-G3 (#499) is still the next claimed row.

Uses the knothollow format. Section 2, cave 4.
- The mouth is on Ashstair and the first chamber is lit. The warm dark beyond needs Lantern, and the far door opens onto Sootpath.
- It holds slip-ember-mantle (after Lantern) and Sela's warm stone for sq-sela-warmth.
- Exits with no landing yet use null x/y with "landing": "planned", the same as #490.
- Gates must use ids from gates.json (#492).
- Encounter bands stay inside the cap for the Tide and Ember badge counts.

## WBW-9: larkburrow.json plus larkburrow.md

**Guest:** Grok, after WBW-7.

Uses the knothollow format. Section 2, cave 5.
- The mouth is on Millgrass Lane, visible from the start and shut until the late cave phase.
- The first room holds Nora's wooden bird (sq-nora-bird).
- The through-path to the back of Threadmeet needs Stone Break and the Loom Badge together. Until then the far door is stone.

The test checks that the Home Burrow loop from section 2 (Millgrass, Larkburrow, Threadmeet) is closed only when both requirements are present.

## WBW-10: lessons.json

**Guest:** dot, after WBW-8.

Section 4. The 8 lesson slips, each with slip id, move id, element (or any), source place, and the gate or person that gives it.

The test checks that:
- every move id exists in the game's move data under wildbond-godot/ (read only)
- every source place is in world-graph.json or in a cave json that's present
- every gate id is in gates.json

Leave the save field (lessons) out entirely; that waits on Evan.

put `slip-mist-veil` in the empty north wall-door niche, behind field:hush. Its source is answering, at the north niche's tile, with the gate `answering-wall-doors`. WBW-10's test checks that this tile is inside answering.json's hush-doors niche.

## WBW-11: trainers.json

**Guest:** Grok, after WBW-9.

Proposed trainer rosters for the 20 routes in section 2's Routes table.
- 1 to 4 trainers per route, each with a name and a team of 1 to 3 species.
- Each route records the badge count at which it's first reachable under WB-WORLD-ORDER.
- Don't use Wardens or named story characters.
- Store level as an offset from the cap, not a fixed number, because the design picks it when the battle starts.

The test checks that every species id is in the game's catalogue, that each team is one to three, and that no route is missing.

## WBW-12: banner-copy.json plus a fit test

**Guest:** dot, after WBW-10.

Section 3's table. For each badge count 0 to 8:
- the banner line
- Maren's where-next sentence
- the "before the new routes" wording, with today's place names (the high road, the ferry path and so on)

The test checks that:
- every banner line is one sentence and fits the walking banner, which is 344 wide at font size 8. If the font can't be measured from Python, use a character budget worked out from that width and font size, and state the estimate.
- the before-routes wording never names a route that isn't in today's build (Ashstair, Pass Foot, The Late Path, Ribbon Road, Orchard Fen, Shelter Mile, Trial Road).

This is the copy the clarity PR will wire in, so it guards the Where next confusion Playtester reported.

## Next ones the dev lead would write

finds.json (item and berry spots per route), keelcave and lowbell layouts, and route encounter tables for the 3 water routes.

### WBW-13 to WBW-18

Wildbond & Starfall Dev Lead scoped these on 2026-10-15. They follow the WBW-7 to WBW-12 rows. Grok takes WBW-13, WBW-15 and WBW-17 after WBW-11. Dot takes WBW-14, WBW-16 and WBW-18 after WBW-12. The spec below is copied as written.

The shared rules are the same as WBW-7 to 12 (see wbw-7-12.md):
- one PR each
- files only under docs/plans/wildbond-world/ and tools/
- a standalone Python unittest for each
- ids checked against world-graph.json
- proposals marked "status": "proposed"
- docs/plans/wildbond-world-design.md is the source
- the freshness check prints 'No packed Wildbond game files changed'

## WBW-13: finds.json

**Guest:** Grok, after WBW-11.

Item and berry spots for the 20 routes and the 7 caves.
- Each spot has a place id, an item id, a count, and a gate: null, or an id from gates.json when it sits behind a field lesson.
- Lesson slips stay in lessons.json (WBW-10), so they aren't repeated here.
- Use only items that already exist in the game's item data under wildbond-godot/ (read only).

The test checks that:
- every item id exists
- every gate id is in gates.json
- every route has at least one find
- no gated find is the only find on its route, so an early player always finds something

## WBW-14: keelcave.json and keelcave.md

**Guest:** dot, after WBW-12.

Uses the knothollow format. Keelcave is cave 3 in section 2.
- It opens off Greywash Sound, which needs Tide Ride.
- Inside, it is short and dry.
- slip-rinse sits on the back ledge.

The test also checks that the only way in is from greywash.

## WBW-15: lowbell.json and lowbell.md

**Guest:** Grok, after WBW-13.

Uses the knothollow format. Lowbell is cave 6 in section 2.
- It lies under The Quiet Channels.
- The flooded stair shows from Reedhold's jetty, and the floor needs Tide Ride.
- It holds the bell-ring count for sq-lowbell, which is turned in to Veslin in Bellstep.
- There's no second guardian here. Stillwake stays on the surface.

The test fails if any Legend species appears in Lowbell's encounter list.

## WBW-16: water-encounters.json

**Guest:** dot, after WBW-14.

Encounter tables for Greywash Sound, The Quiet Channels and The Open Grey.
- Same schema as WBW-5's route-encounters.json.
- Use Tide and Gale species from the catalogue.
- Each band sits inside CAP_TABLE for the earliest badge count that can reach that water with Tide Ride.
- The Open Grey is late, in the Horizon country.

The test reuses WBW-5's schema check if it has merged, otherwise it carries its own. It also checks that no Legend appears as a normal encounter.

## WBW-17: trialstair.json and trialstair.md

**Guest:** Grok, after WBW-15.

Uses the knothollow format. Trialstair is cave 7 in section 2.
- The main stair can be walked with all eight badges.
- The side rooms need Lantern, Stone Break, Tide Ride, Grove Wake, Hush and Daymark.
- Glide is never required.

The key test does a BFS from the Trial Road door: with all eight badges and no lessons, it must reach the league door. It also checks that:
- every side room has a rest or a slip
- no lesson gate sits on the main path

## WBW-18: dry-boards.json and a loop test

**Guest:** dot, after WBW-16.

The Dry Boards are a passage inside the Long Boards maps that links Pass Foot to the west end of the boards (see section 2, below the Routes table).

The test checks these loops from section 2 on world-graph.json:
- The Pass Ring can be walked both ways before Glide, through Pass Foot and the Dry Boards.
- Glassfall only goes down.
- The Dry Boards don't reach Bellstep.
- The Coast Ring needs Tide Ride.
- The Home Burrow needs both Stone Break and the Loom Badge.

If world-graph.json is missing an edge these checks need, the PR adds it and says so in its description.

add the edge `hollowecho--answering` to world-graph.json. The cave's mouth is in the hamlet, and Flintcut is the second door. Add a test that the answering cave can be reached from both hollowecho and flintcut.

## Next from the dev lead

The Answering Ways depth layout follow-ups, and the Lampcrown and Greymill maps.

### LB-PAL. Bring Lantern Bowl's palette from 36 colours to 30 (shelved 2026-10-18, do not start)

**Status:** Starts after #505 merges. #505 is Game Art Director's spec pull.

**Guest:** Grok. It is seventh in Grok's priority list, after NM-G8. WBW-4 stays the current task.

This is the Lantern Bowl launch checklist's palette cap. [launch-lantern-bowl.md](launch-lantern-bowl.md) says Game Art Director reviews any art. The launch picture check in `tests/lantern-bowl.html` is "the picture stays inside 32 colours", and [docs/art/README.md](../art/README.md) rule 6 caps each game at about 32 colours. The spec takes the picture from 36 colours to 30.

- **Scope:** Make the six hex merges in the spec. They take the palette from 36 colours to 30. Ink and lamplight stay as they are. Also fold in #495's `#101820` panel if that colour is still there.
- **Files:** follow [docs/art/lantern-bowl-palette-merge.md](../art/lantern-bowl-palette-merge.md). Check the result with `tools/palette-inventory.py`.
- **Done check:** `palette-inventory.py --max 30` passes. No new hex values. Contrast stays at or above 4.5:1 for text and 3:1 for graphics. Before-and-after screenshots at 844x390 and 1920x1080 of the title, a match, the roster and the results show no change beyond the merges. CI is green. Game Art Director signs off.
- **Dependencies:** this starts after #505 merges. It does not wait on another bot's approval.

### Batch 2

Side Games Dev Lead drafted these on 2026-10-14. Batch 1's rules still apply. #444 has merged, but `games/lantern-bowl/game.js`, `model.js`, `view.js`, `style.css` and `index.html` are still off limits: the wiring is Side Games Dev Lead's. Two rows edit an existing file. LB-G9 edits `sound-cues.js` and its test, and no open pull has them. NM-G3 edits `games/night-market/style.css` and `tests/night-market.html`, and no open pull has those since #456 and #461 merged.

### LB-G9. Crowd bed holds its volume until stop() (LB-FEEL fix, from Reviewer's comment 6183447752 on #474) (shelved 2026-10-18, do not start)

**Status:** Done. Merged as #489. This is the crowd-loop fix. There is no separate LB-G4b row. Do not reopen it.

- **Guest:** Grok, who wrote LB-G4.
- **Scope:** Make the `crowdBed` cue really loop. Today `play()` gives every voice the one-shot `envelope()`, which ramps the gain to 0 at `start + dur`. For `crowdBed` that is 4 seconds, so the buffer keeps looping silently after that, and the crowd's LFO also stops at `end`. For a cue with `loop: true`, hold the gain at its peak after the attack, skip the release and the LFO's `stop(end)`, and have `stop()` fade out over a short release (about 0.25 seconds) before stopping the sources. Add a checker case that fails if a loop cue schedules a ramp to 0 or a stop before `stop()` is called.
- **Files:** edit `games/lantern-bowl/sound-cues.js` and `tests/lantern-bowl-sound-cues.cjs`. You may update the crowd line in `docs/playtests/lb-feel-sounds/README.md` if it describes the old behaviour. Edit nothing else.
- **Done check:** `node tests/lantern-bowl-sound-cues.cjs` passes with these new cases: using a recording stub `AudioContext`, playing `crowdBed` schedules no `linearRampToValueAtTime(0, …)` and no `stop()` on any source or LFO until the handle's `stop()` is called; after `stop()`, every source is stopped and the gain ramps to 0 within 0.3 seconds; and every one-shot cue still schedules its end exactly as before, so their timing is unchanged. On the listening page in Chrome, the crowd bed is still audible after 30 seconds and goes quiet when stopped. Say so in the PR. Normal CI stays green.
- **What I wire later:** the crowd bed under each drive in LB-FEEL, started at the snap and stopped at the whistle or on pause.
- **Dependencies:** none.

### LB-G7. Roster view as a standalone module (LB-MANAGER) (shelved 2026-10-18, do not start)

**Status:** Done. Merged as #495. Do not reopen it.

- **Guest:** Grok. It needs real-browser screenshots, and Grok's sandbox can start Chromium.
- **Scope:** Build the club roster screen as its own module that reads `roster.json` and draws a list of the 23 players. It shows ratings as words and stars first and numbers second, which is the plan's rule in `docs/plans/lantern-bowl.md`. Add a test and a preview page. The game does not open this screen yet.
- **Files:** create `games/lantern-bowl/roster-view.js`, `tests/lantern-bowl-roster-view.cjs`, and `docs/playtests/lb-roster-view/index.html`, plus its screenshots and `README.md`. Do not edit `style.css`. The module's few styles live in one `<style>` block that it adds with a `lbrv-` class prefix, so nothing in the game changes.
- **Shape:** a UMD file like `kick.js`, exposing `LanternBowlRosterView`. `rows(roster, clubId)` is pure, with no DOM. It returns one row per player in this order: QB, RB, WR, WR, TE, line, front, backers, secondary, kicker. Each row has the slot label, name, age, the player's two best ratings, a 1-to-5 star grade, and a short word ("Solid", "Strong", "Elite" and so on). The star bands are 35–45, 46–56, 57–67, 68–78 and 79–90. `render(container, rows)` builds the list. Rows are 44px or taller, and the text is 16px or larger.
- **Phone rule:** Lantern Bowl is landscape-only on phones. Screenshot the preview page at 844x390, 780x360 and 667x375, plus 1024x594. Do not design a portrait layout.
- **Done check:** `node tests/lantern-bowl-roster-view.cjs` passes, and it checks that every club gives 23 rows in that order, every star grade sits in its band, the best two ratings are picked correctly, the same input always gives the same output, and an unknown club ID throws a clear error. The preview page renders all six clubs with no page error. The PR includes the four screenshots, and GAD reviews them, since this is a new screen. Normal CI stays green.
- **What I wire later:** a Roster button between games in LB-MANAGER that opens this view, plus moving the styles into `style.css` if GAD asks.
- **Dependencies:** none. `roster.json` is on main.

### NM-G4. Vendor portrait prompts for GAD, text only

**Status:** Done. Merged as #498. Do not reopen it.

- **Guest:** Grok.
- **Scope:** Write a portrait brief for each of the six vendors, so GAD can commission or draw their pictures later. Each brief covers the vendor's look, pose, props and palette, taken from the habits and gossip already in `model.js`: Mei opens before the lanterns are lit, Bo talks while he folds, An trims each wick, Qiao counts the tins twice, Ren lights one stick for the alley, and Old Wen stops before the ending. This is text only. No images are made in this PR.
- **Files:** create `docs/art/night-market-vendor-prompts.md`. Edit nothing else.
- **Content:** for each vendor, write a one-paragraph description in plain sentences and a short prompt of at most 60 words. Follow the house art rules already written down: the arcade's ink outline, the dusk-and-lamplight palette that #438's lane uses, and real proportions with no big heads (art guide rule 2, which `docs/plans/lantern-bowl.md` cites). Add a note on size, matching the lane's 384x72 canvas scale. Add a line on what each portrait must not look like: no real people, no brands, and no copying another game's characters.
- **Done check:** the file has six briefs that each match the vendor's habit in `model.js`, every prompt is 60 words or fewer, and the file links `docs/art/README.md` for the art rules. GAD reads it and says yes or asks for changes on the PR. Normal CI stays green.
- **What I wire later:** nothing directly. GAD uses the briefs for the vendor art, and any art PR gets GAD's review.
- **Dependencies:** none. It uses `model.js` on main, not #482's tales.

### NM-G5. Away-summary gossip lines (§4A "Day 2": the away summary reads like vendor gossip)

**Status:** Done. Merged as #500. Do not reopen it.

- **Guest:** Grok.
- **Scope:** Write extra gossip lines for each vendor as data, grouped by how long the player was away, so the welcome-back box does not repeat the single `gossip` line each stall has in `model.js`. This is text only. It changes no earnings and adds no save field. Any later pick can be made from the away time and the save's existing seed or counts.
- **Files:** create `games/night-market/gossip.json` and `tests/nm-gossip.cjs`. Edit nothing else. This is not #482's `vendor-tales.json`. Tales unlock at milestones. Gossip is the short away line.
- **Shape:** `schemaVersion: 1` and `gossip`, keyed by the six stall IDs in `model.js` (`tea`, `dumpling`, `lantern`, `mooncake`, `incense`, `stories`). Each has three bands, `short` (under 30 minutes away), `evening` (30 minutes to 2 hours) and `long` (2 to 4 hours, the offline cap), with at least 3 lines per band. Each line is one sentence of at most 100 characters that names its own vendor. Lines never promise extra coins or mention a multiplier, because offline pay stays at 50% for at most four hours.
- **Done check:** `node tests/nm-gossip.cjs` passes. It reads the stall IDs and vendor names from `model.js` the way `tools/night-market-pacing.cjs` does, and it checks every stall, band and line count, the length limit, that each line names its vendor, that no line repeats, and that no line contains a number or the words "double", "bonus" or "multiplier". Normal CI stays green.
- **What I wire later:** the welcome-back box picks one line from the right band for the stall that earned the most while the player was away. That goes in a Night Market PR of mine.
- **Dependencies:** none.

### LB-G8. Standings, tiebreakers and the playoff bracket, headless (LB-SEASON) (shelved 2026-10-18, do not start)

**Status:** Done. Merged as #494. Do not reopen it.

- **Guest:** dot. dot already knows `season.json`'s fixtures.
- **Scope:** Write the season table and the playoff bracket as a pure module that reads `season.json` and a list of results. It works out wins, losses, points for and against, the order of the clubs with clear tiebreakers, the top-four seeding and the semi-final and final pairings. It has no save and no DOM.
- **Files:** create `games/lantern-bowl/standings.js` and `tests/lantern-bowl-standings.cjs`. Do not edit `shared/sports-office.js`. Its `standings()` needs a global `SPORT` and only sorts by wins, then run difference, then index, so this module stands alone.
- **Shape:** a UMD file exposing `LanternBowlStandings`. `table(season, results)` takes results as `{ week, home, away, homeScore, awayScore }` with club indexes, and returns rows of `{ index, id, w, l, pf, pa, diff, played }` in order. `bracket(season, table)` returns `{ semis: [[1, 4], [2, 3]], final: null }` in seed order, with the higher seed at home. `advance(bracket, semiResults)` fills in the final. Lantern Bowl overtime keeps playing until one side leads, so a tie is invalid input and throws.
- **Tiebreakers, in order:** most wins; head-to-head wins among the tied clubs; points difference; points for; then the club's index in `season.json`, so the result never depends on luck.
- **Done check:** `node tests/lantern-bowl-standings.cjs` passes, with fixtures for a clean table, a two-way tie broken head-to-head, a three-way tie that drops to points difference, a tie broken by index, a partial season, a result for a week or pairing that is not in `fixtures` (rejected), a tie score (rejected), and the bracket and final from a full ten-week season. Normal CI stays green.
- **What I wire later:** the standings board and the playoffs in LB-SEASON. The season save holds the results list, and that save design goes to Evan through Director.
- **Dependencies:** none. `season.json` is on main.

### LB-G10. Opponent scouting data (LB-SEASON, comparison fix 9 and the "opponents of varied strength" gap) (shelved 2026-10-18, do not start)

**Status:** Done for this queue. In review as #496. Do not start a second copy.

- **Guest:** dot. It uses dot's playbook IDs.
- **Scope:** Give each of the five opponent clubs an attacking style as data: how often it runs or passes, which playbook plays it likes, how it reacts to each of the three defence calls, and a one-sentence scouting note the player reads before the game. Then, when you pick Blitz, Balanced or Prevent before a drive, the choice means something different against each club. Add a validator.
- **Files:** create `games/lantern-bowl/scouting.json` and `tests/lantern-bowl-scouting.cjs`. Edit nothing else.
- **Shape:** `schemaVersion: 1` and `clubs`, keyed by the five opponent IDs from `season.json` (not `brackenport`). Each has `runShare` (0.3 to 0.7), `favourites` (3 or 4 play IDs that exist in `playbook.json`, with weights adding up to 1), `deepShare` (0 to 0.4), a `versus` block for `blitz`, `balanced` and `prevent` that nudges those shares by at most ±0.15, and a `note` of at most 140 characters. Notes describe a style, such as "Herons run outside and test you deep late". They never tell the player which defence to pick, because the choice stays the player's.
- **Variety rule:** no two clubs share the same top favourite play, and at least one club leans run (`runShare` 0.6 or more) and one leans pass (0.4 or less).
- **Done check:** `node tests/lantern-bowl-scouting.cjs` passes. It reads `season.json` and `playbook.json` from main to check the club IDs and play IDs, and it also checks all the ranges, the weight sums, the variety rule, the note length, that no note names a defence call, and that malformed files are rejected. Normal CI stays green.
- **What I wire later:** `cpuCall` in `model.js` reads the opponent's style, and the pre-drive defence card shows the note.
- **Dependencies:** none. `season.json` and `playbook.json` are on main.

### NM-G3. Back and footer links at 1rem on one line (GAD's NM-PHONE follow-up)

**Status:** Claimed by dot as #499. It is next after WBW-5, and it is not the current task. The Director unblocked the header grid: the coin count may wrap to its own row when enlarged text does not fit, with a real overlap check at 200% text on a 390px-wide screen, and the change stays in the Night Market header. https://github.com/ecbarish/generations/issues/373#issuecomment-6184708856. Finish WBW-5 first. Do not open a second pull.

- **Guest:** dot, who built NM-PHONE (#456).
- **Scope:** Make "Back to the arcade" in the header and in the footer read at 1rem and never wrap onto two lines. Today `.home, .foot a` and `.foot` in `games/night-market/style.css` are `font-size: 0.95rem`, and nothing stops the text from wrapping.
- **Files:** edit `games/night-market/style.css`, only the `.home, .foot a` rule and the `.foot` rule, and add checks to `tests/night-market.html`. #499 already has this change. #456 and #461 have merged. Do not edit `game.js`, `lane.js`, `model.js` or `index.html`. Do not open a second pull.
- **Change:** set `font-size: 1rem` and `white-space: nowrap` on `.home, .foot a`, and `font-size: 1rem` on `.foot`. Keep `min-height: 44px` and the NM-PHONE grid placement as they are.
- **Done check:** `tests/night-market.html` gains checks that both links compute to at least 16px, have `white-space: nowrap`, are 44px or taller, and sit on one line, with a height under 2 lines of text at 320px, 390px and 844px widths. The existing Night Market checks still pass, and normal CI is green. The PR includes screenshots at 390x844, 844x390 and 320x568 for GAD.
- **What I wire later:** nothing. GAD re-checks the screenshots, and Reviewer merges.
- **Dependencies:** none.

### Held until dependencies merge

This wait is over. #480, #482 and #483 have all merged. Third-district content, training-focus data and per-tale art prompts are no longer held.

### WBW-4 to WBW-6

Wildbond & Starfall Dev Lead scoped these on 2026-10-14. Copy of the spec:

Shared rules (same as WBW-1 to 3):

- One PR from main per piece. Files only under docs/plans/wildbond-world/ and tools/.
- Each piece has a standalone Python unittest.
- Every done check ends with `python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD`, which must print 'No packed Wildbond game files changed'.
- Species come only from wildbond.json SPECIES plus evolution.json (189 species, no Greysail).
- The nine uniques never appear in a wild list: elderhorn, breakwatermane, hearthcrown, lanterncrest, stillwake, undertone, meadowmantle, watchlight, veilmote.
- Cross-checks against other WBW files are skipped if those files aren't on main yet.
- No new art, no save-format change, and no approval to wait on.
- Suggested order: whoever finishes first takes WBW-6 (it anchors the gate keys), then WBW-5, then WBW-4.

## WBW-6: Field-lesson and gate list

**Status:** Done. Merged as #492. Do not reopen it.

Scope:

- One record for every gate in the design doc, with id, place, kind, key, teacher, ready rule, phase and source section.
- Kinds:
  - field: stone, tide, grove, lantern, glide, hush, daymark
  - badge: the BADGES ids
  - story: depthReturns, leagueEnding, inn:<map>
  - element: today's two requiresElement exits, which stay
- Each lesson's ready rule (element, level, bond step) comes from section 1.

Files:

- docs/plans/wildbond-world/gates.json
- docs/plans/wildbond-world/gates.md
- tools/test_wildbond_world_gates.py

Done check: `python3 -m unittest tools/test_wildbond_world_gates.py` passes. It checks that:

- all 7 lessons are present, with one teacher and one teaching badge each
- every key matches the allowed pattern or is a BADGES id
- bond thresholds are only 20, 60 or 140 (rules.gd BOND)
- each ready level is at or below the cap after its teaching badge (Stone 12 ≤ 25, Tide 18 ≤ 35, Glide 36 ≤ 55, Daymark 64 ≤ 70)
- the league needs all 8 badges
- both existing requiresElement exits appear
- it agrees with world-graph.json, knothollow.json and answering.json if present

The dev lead wires up later: the gate and obstacle checks beside _team_has_element, and the teaching scenes (WB-WORLD-2 to 6).

## WBW-5: Encounter tables for the 16 new routes

**Status:** Dot's current task. Claimed as draft #501. Grok does not start it.

Scope:

- A wild table and level band for each of the 16 new routes.
- Each table is a reweighted subset of its parent country's table:
  - Thornwood: millgrass, dewcut, rootwater
  - Saltmarsh: wrackline
  - Emberfall: ashstair, sootpath
  - Cloudglass: passfoot
  - Stillreed: longboards, orchardfen
  - Hollowecho: latepath, flintcut
  - Sunthread: ribbonroad, sheltermile
  - Farwatch: chartroad, seaward, trialroad
- Use the [[species, weight], ...] shape that _wild_table() already reads.

Files:

- docs/plans/wildbond-world/route-encounters.json
- docs/plans/wildbond-world/route-encounters.md
- tools/test_wildbond_world_route_encounters.py

Done check: the unittest passes. It checks that:

- there are exactly those 16 ids
- every species is in its country's BIOMES or WILD_EXTRA table, with no uniques and no Kilnback
- weights are positive
- each band is inside the country's BIOMES.lv
- each band's top is at or below the CAP_TABLE cap for the badges that route needs (section 7)

The dev lead wires up later: the route maps in WB-WORLD-1.

## WBW-4: Answering Ways cave layout and encounters

**Status:** Grok's current task. Claimed on #373. No pull is open yet. Dot does not start it.

Scope:

- `answering`, the first enterable cave (section 2 cave 1, WB-WORLD-3), in the same map-entry format as WBW-2, with biome hollowecho.
- A gates list:
  - the Lantern dark line past the first hall: field:lantern
  - side cracks: field:stone
  - wall-doors: field:hush
- A zones list (the lit hall, the Lantern-dark area and the Hush doors), as overlays rather than new tiles.
- A story-only marker for Undertone's return at the first bend.
- Three echo-stone markers for sq-senna-stones.
- The mouth is 48x48, and it is not the reveal mouth at (19,8).

Files:

- docs/plans/wildbond-world/answering.json
- docs/plans/wildbond-world/answering.md
- tools/test_wildbond_world_answering.py

Done check: the unittest passes. It checks that:

- the rows are rectangular and use only TILES glyphs
- a BFS from start reaches every walkable, exit, gate and marker tile
- the lit first hall is reachable with no field key
- wild uses only Hollowecho species and no uniques (Undertone is not in wild)
- exits go only to bellstep or flintcut
- there are exactly 3 echo stones, with the last one behind field:hush

The dev lead wires up later: the map, dark overlay, gates and painter, with GAD's cave palette and mouth sign-off (WB-WORLD-3). Also the level-cap clamp, since Hollowecho's 58 to 64 tops the 5-badge cap of 60; the .md just records that.

### Notes every launch-game row inherits

- Never merge your own PR. Generations Reviewer merges. Stop at ready for review with CI green, and never force-push.
- Do not edit `shared/`, `sw.js`, the root `index.html`, `launcher/`, `.github/workflows/`, `docs/COMMS.md`, `START-HERE.md` or `docs/DEVELOPMENT-PATH.md`. Claims and handoffs go on #373.
- Do not edit `games/lantern-bowl/game.js`, `model.js`, `view.js`, `style.css`, `index.html` or `tests/lantern-bowl.html`. #444 has merged. Side Games Dev Lead still does the wiring.
- Do not edit `games/lantern-bowl/playbook.json` or `tests/lantern-bowl-playbook.cjs`. Those merged as #451.
- Do not edit `games/night-market/game.js`, `model.js`, `lane.js`, `style.css`, `index.html` or `tests/night-market.html`. #456 and #461 have merged, and these rows still do not edit those files.
- Do not edit `games/little-ranch/game.js`, `index.html`, `tests/little-ranch.html` or `tools/playtest/little-ranch-review.cjs`. #460 has merged, and LR-G1 still does not edit them.
- No save-format change. Any new art needs Game Art Director (GAD) review. These rows add no art.
- Only MIT-style code, and no code, data, text, melodies or assets from Retro Bowl, ALL-22 or any other commercial or unlicensed game. You may describe a technique. Every name, number and line of text is original.
- Each PR has a full-sentence title. Its description says what changed for the player (for a data row, say that nothing changes in the game yet), why, how it was tested, and which row it closes.
- Each PR pastes its node test output in the body because CI only runs the HTML test pages listed in `tools/run-all-checks.cjs`. A new `tests/*.cjs` file does not run in CI by itself. Paste its `node` output in the PR description, and make sure the normal CI run stays green. Side Games Dev Lead will add each validator to the game's HTML test page when the data is wired in.
- Validators are plain Node with no npm packages. Each one also exports its checks (`module.exports`, and a `window.` global when there is no `module`), the way `tests/lantern-bowl-playbook.cjs` on #451 does, so a test page can run it later.

Shared club IDs. LB-G1 and LB-G2 both use these six club IDs, so neither waits on the other: `brackenport`, `millrace`, `harrowgate`, `tollbridge`, `quarryhill` and `fernmoor`. `brackenport` is the player's club and is index 0, which matches `SPORT.cfg.you` in `shared/sports-office.js`. The six-club count matches `makeSchedule()` there, which is written for exactly six clubs.

Shared rating keys. LB-G1, LB-G3 and LB-G5 use the rating keys that `person()` in `games/lantern-bowl/model.js` already defines: `throw`, `catch`, `speed`, `carry`, `block`, `rush`, `cover`, `tackle` and `kick`. Every rating is a whole number from 35 to 90, which is Evan's approved range.

Night Market's phone layout merged as NM-PHONE #456. Done: NM-FIX-6 as #461 (`1d36ee61`), NM-VIS as #438 (`4e92d87a`), and NM-RETUNE as #445. NM-HUB stays with Side Games Dev Lead, NM-CLAMP waits on SSA, and NM-FIX-7 is a Playtester session. NM-G1 and NM-G2 are the checklist's later items, "a collection of vendor stories" and "moving to a new district, permits", which were waiting on NM-RETUNE. NM-RETUNE has merged, so they are free. Both are new data files, so they do not touch any file on #456.

Little Ranch has almost no build row left. #449 merged (`44f49c2c`) and covered LRL-6 (dough dots), LRL-7 (the fox), LRL-10 (the sign wiggle), and LRL-13, LRL-14 and LRL-15 (bedtime cues, the dusk fade, leaving the paint shed early). Do not reopen it. #460 has merged for the kitchen bowl, the picture-sign tap, the ball's double roll and the favicon 404. LRL-4 (the sound choice after a reload) is waiting for Playtester or Evan to confirm. LRL-11, the phone playtest, belongs to Playtester and is not a build PR. LR-G1 is a tool that gets that phone playtest ready without touching game files.

### Notes for the three Wildbond world-build rows

- Each piece is one pull request from main. Files go only under `docs/plans/wildbond-world/` and `tools/`.
- Nothing goes under `wildbond-godot/`, `play/wildbond/` or `games/wildbond/`, and nothing touches `main.gd`, `run_tests.gd`, COMMS, START-HERE, DEVELOPMENT-PATH, `shared/` or `sw.js`.
- There is no new art, no save-format change, and no approval to wait on.
- Every done check also runs `python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD`, which must print `No packed Wildbond game files changed`.
- The tests are standalone Python unittests, not added to CI.

### Grok

### LB-G4. Touchdown fanfare and game-feel sound cues (LB-FEEL) (shelved 2026-10-18, do not start)

**Status:** Done. Merged as #474.

- **Guest:** Grok.
- **Scope:** Write Lantern Bowl's new sounds as code-generated Web Audio cues: a touchdown fanfare, a tackle thud, a catch pop, a crowd bed and crowd swell, a whistle, a kick thump, a first-down chime and an interception sting. Add a validator and a page where anyone can listen to each one. Nothing plays in the game yet.
- **Files:** create `games/lantern-bowl/sound-cues.js`, `tests/lantern-bowl-sound-cues.cjs` and `docs/playtests/lb-feel-sounds/index.html`. Do not edit `shared/sound.js`. Shared code goes in its own PR, and that one is mine.
- **Shape:** `sound-cues.js` is a UMD file like `model.js`. It exposes `LanternBowlCues` with a `cues` object (pure data) and `play(audioContext, destinationNode, name)`, which builds the sound from oscillators and filtered noise into the node it is given. It never creates its own `AudioContext` and never touches the DOM. Notes use the same spelling as `shared/sound.js` (for example `'C5'` and `'F#4'`), so the cues sound like the arcade's family.
- **Limits:** the touchdown fanfare lasts 2.0 seconds or less, because the banner holds for 1.6 seconds. A tackle thud or catch pop lasts 0.2 seconds or less. The whistle and the kick thump last 0.5 seconds or less. The crowd bed is a loop with a level of 0.35 or less, and a swell lasts 2.5 seconds or less. No single voice goes above 0.5 gain, which matches the range `tone()` uses in `shared/sound.js`.
- **Licence:** every sound is synthesised in this file. No samples, no recordings, and no melody taken from a song or another game, including Retro Bowl's touchdown jingle. The fanfare is an original phrase.
- **Done check:** `node tests/lantern-bowl-sound-cues.cjs` passes, and it checks that every cue exists, every note parses, every cue's duration and level is inside the limits above, and `play` throws nothing when given a stub context. The listening page has one button per cue, and the PR links a short screen recording or lists the cues heard in Chrome on desktop and on a phone. Normal CI stays green.
- **What I wire later:** in LB-FEEL I turn sound on by default and call these cues on a touchdown, a catch, a tackle, a kick and a first down. Hooking them into the arcade's sound setting may need a small change to `shared/sound.js`. That goes in Side Games Dev Lead's own shared PR, under SSA's rule.
- **Dependencies:** none.

### LB-G5. Two-tap kick model, headless (LB-FEEL) (shelved 2026-10-18, do not start)

**Status:** Done. Merged as #479.

- **Guest:** Grok.
- **Scope:** Write the rules for a two-tap kick as its own headless module. The first tap sets power and the second sets aim on a sweeping needle, and the kicker's rating sets how fast and steady the needle is. This is the comparison's fix 10. It describes the technique only and copies no code. The game does not use it yet.
- **Files:** create `games/lantern-bowl/kick.js` and `tests/lantern-bowl-kick.cjs`. Edit nothing else. Field goals and punts on fourth down are #444's, in `model.js`, so do not touch them.
- **Shape:** `kick.js` is a UMD file like `model.js`, with no DOM, timers, audio or storage. It exposes `LanternBowlKick` with `needleAt(seconds, kickRating, phase)`, which gives the needle position from 0 to 1, and `resolve({ powerTap, aimTap, distanceYards, kickRating, rng })`, which returns `{ good, reason }`. The reason is one of `good`, `short`, `wide left` or `wide right`. Randomness only comes through the `rng` function passed in, so the seeded game dice stay in charge. Ratings run 35–90. A higher rating means a slower, steadier needle and a wider sweet spot. There is no automatic aim.
- **Done check:** `node tests/lantern-bowl-kick.cjs` passes, and it prints and checks a make-rate table over 1,000 seeded kicks for distances of 20, 30, 40 and 50 yards, kicker ratings of 35, 60 and 90, and three tap qualities (perfect, a little off, sloppy). These must hold: a 90 kicker with perfect taps makes at least 90% from 40 yards; a 35 kicker with perfect taps makes under 50% from 50 yards; sloppy taps miss more than they make at every rating from 40 yards; make rates fall as distance rises; and the same seed gives the same results. Normal CI stays green.
- **What I wire later:** after #444 merges, I draw the needle in `game.js` and use `resolve` for field goals and extra points, with touch read from the touch event and the follow-up synthetic click ignored.
- **Dependencies:** none.

### LB-G6. Between-games dilemma cards (LB-SEASON) (shelved 2026-10-18, do not start)

**Status:** Done. Merged as #481. Do not reopen it.

- **Guest:** Grok.
- **Scope:** Write at least 12 original between-games decision cards as data. Each card has a short situation and two choices, and each choice has small effects on morale, coaching points, fans or the owner. This is the comparison's fix 7. It is data only, with no save change.
- **Files:** create `games/lantern-bowl/dilemmas.json` and `tests/lantern-bowl-dilemmas.cjs`. Edit nothing else.
- **Shape:** `schemaVersion: 1` and a `cards` array. Each card has a unique `id`, a `when` from `afterWin`, `afterLoss`, `bye` or `beforeGame`, a `role` from `qb`, `rb`, `wr`, `te`, `line`, `defence`, `kicker` or `team`, a `text` of at most 160 characters, and exactly two `choices`. Each choice has a `label` of at most 32 characters, a `result` sentence of at most 120 characters, and `effects` that use only these keys: `morale` from -5 to 5 with a `target` of `player` or `team`, `points` from 0 to 3, `fans` from -5 to 5, and `owner` from -5 to 5. Text uses `{name}` and `{club}` as placeholders, never a real player's name. At least 3 cards go to each `when`.
- **Writing rules:** write plain, full sentences that a newcomer understands. The text is original. Do not copy or paraphrase the Retro Bowl wiki's dilemma list. No choice should be free of cost: each card's two choices must differ in at least two effect keys.
- **Done check:** `node tests/lantern-bowl-dilemmas.cjs` passes, and it checks the card count, the unique IDs, every allowed value and length limit, at least 3 cards per `when`, the two-key difference between choices, placeholder use, and malformed cards rejected. Normal CI stays green.
- **What I wire later:** LB-SEASON shows one card after each match, and the effects feed morale and coaching points in the new season save, which Evan signs off through Director.
- **Dependencies:** none.

### NM-G1. Vendor tales for the six stalls (later row: a collection of vendor stories)

**Status:** Done. Merged as #482. Do not reopen it.

- **Guest:** Grok.
- **Scope:** Write four short tales for each of the six vendors as data, one unlocked when the vendor is hired and one at 25, 50 and 100 owned. That reuses the existing milestones in `model.js`, so the game can work out which tales are unlocked from the current save with no new field. The game does not show them yet.
- **Files:** create `games/night-market/vendor-tales.json` and `tests/nm-vendor-tales.cjs`. Edit nothing else.
- **Shape:** `schemaVersion: 1` and a `tales` object keyed by the stall IDs in `model.js` (`tea`, `dumpling`, `lantern`, `mooncake`, `incense`, `stories`). Each holds exactly four entries with `at` set to `hired`, `25`, `50` or `100`, a `title` of at most 32 characters, and a `text` of two or three sentences and at most 280 characters. Each tale matches that vendor's habit and gossip in `model.js` (Mei opens early, Bo talks while he folds, An trims each wick, Qiao counts the tins twice, Ren lights one stick for the alley, and Old Wen stops before the ending).
- **Writing rules:** original, calm, warm text that a child can hear read aloud. No real brands or places. Do not copy text from another idle or market game.
- **Done check:** `node tests/nm-vendor-tales.cjs` passes. It reads the stall IDs and vendor names from `games/night-market/model.js` by loading that file the same way `tools/night-market-pacing.cjs` does, without editing it. It checks that every stall has its four tales with the right `at` values, each tale names its own vendor, and the length limits hold. Normal CI stays green.
- **What I wire later:** a "Tales" list in the save box or under each stall. That goes in a Night Market PR once #456 has merged. #461 (`1d36ee61`) has already merged.
- **Dependencies:** none.

**WBW-3.** Grok. World connection graph.

**Status:** Done. Merged as #487. Do not reopen it.

Section 9's Region, Map and Connection records are one data file listing 20 routes, 10 towns, 7 caves and 3 water routes. Each link has its gate (a badge, a story key, or a field lesson), its phase, and a one-way flag, which is set only for Glassfall.

The 15 current map ids that must be present are `larkhaven`, `thornwood_route`, `thornwood`, `saltmarsh_route`, `saltmarsh`, `emberfall`, `cloudglass`, `stillreed`, `hollowecho`, `sunthread`, `farwatch`, `league`, `spire`, `thornwood_grove` and `saltmarsh_pool`. The edges are the mermaid flowchart in section 2 of the design doc. Glassfall is the only one-way link. The league needs all 8 badges. No stretch has more than three routes between healers. With all lessons learned, everything can be reached from Larkhaven.

- **Files:** `docs/plans/wildbond-world/world-graph.json`, `docs/plans/wildbond-world/world-graph.md` and `tools/test_wildbond_world_graph.py`.
- **Done when:** `python3 -m unittest tools/test_wildbond_world_graph.py` passes. It checks the counts, that every link is two-way except Glassfall, that all 15 current map ids are present, that everything can be reached from Larkhaven with all lessons, that the League needs all 8 badges, that no stretch has more than three routes between healers, that the edges match the mermaid flowchart in the design doc, and that it agrees with WBW-2's exits if that piece exists. `python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD` prints `No packed Wildbond game files changed`.
- **The dev lead wires up later:** the exits, INTERIORS, and the Glide inn list.
- **Approval:** this has no dependency on another bot's approval. If WBW-2's file is not on main yet, the exit agreement check waits for that file and does not block this pull request.

### LR-G1. Phone pre-check for the LRL-11 playtest

**Status:** No pull and no claim. It is Grok's after WBW-4.

- **Guest:** Grok. Grok ran real Chromium for #461, which has merged (`1d36ee61`), and dot's sandbox could not start Chromium on #451 and #456.
- **Scope:** Write a real-browser script that opens Little Ranch at phone sizes, visits every place, and reports any tap target smaller than 44 by 44 pixels, any two tappable things that overlap, and anything cut off the screen. It also saves one screenshot per place and size, so Playtester starts LRL-11 with a known list. It changes no game file.
- **Files:** create `docs/playtests/lrl-11/phone-precheck.cjs`, `docs/playtests/lrl-11/README.md`, and the screenshots and `report.json` it writes in `docs/playtests/lrl-11/`. Follow the pattern of `docs/playtests/lr-polish-2/shots.cjs`. Do not edit `tools/playtest/little-ranch-review.cjs`, which #460 changes.
- **Sizes:** 390x844 and 844x390 (iPhone 12 held upright and sideways, as in the checklist), 360x780, and 1024x594 for a tablet.
- **Done check:** the script runs against `main` with real taps (touch events, with the follow-up synthetic click ignored as the game does), writes the screenshots and `report.json`, and exits cleanly. The README lists every finding in plain sentences with its screenshot, or says there were none. It does not fix anything. If it finds a real bug, the README says so and I take the fix. Normal CI stays green.
- **What I wire later:** nothing in the game. I hand the report to Playtester for LRL-11 and fold any real bug into my next Little Ranch fix list. #460 has merged, so run the script on current main.
- **Dependencies:** none. It runs on whatever `main` is.

### dot

### LB-G1. Roster and ratings data for six clubs (LB-MANAGER) (shelved 2026-10-18, do not start)

**Status:** Done. Merged as #472.

- **Guest:** dot. It fits next to dot's playbook data.
- **Scope:** Write the full roster for all six clubs as data, with every player rated from 35 to 90, and replace the single team numbers for the line, rush, cover and tackle with named starters. Add a validator. The live game does not load this file yet.
- **Files:** create `games/lantern-bowl/roster.json` and `tests/lantern-bowl-roster.cjs`. Edit nothing else.
- **Shape:** `schemaVersion: 1` and a `clubs` object keyed by the six club IDs above. Each club has `qb`, `rb`, `wr` (an array of exactly 2), `te`, `line` (5 blockers), `front` (4 rushers), `backers` (3 linebackers), `secondary` (4 defensive backs) and `kicker`. That is 11 on offence, 11 on defence and a kicker. Each player has a unique `id`, a `name`, an `age` from 21 to 36, and 2 to 4 ratings from the shared keys. A rating that is not listed means 50, as `person()` does today. The slots `qb`, `rb`, `wr[0]`, `wr[1]` and `te` must match the roster identities in #451's contract (`roster.wr[0]`, `roster.wr[1]`, `roster.te`, `roster.rb`).
- **Keep what exists:** Brackenport keeps Wren Talley (QB), Mara Holt (RB), Ada Brisk and Tomas Reed (WR), Bram Okafor (TE) and Sol Varga (K). Millrace keeps Ned Harrow, Cole Pimm, Lise Venn, Otto Brant, Ivo Pell and Pat Low. Each keeps the same relative strengths it has in `baseRoster()`, spread out onto the wider 35–90 scale. All other names are new and original.
- **Club strength targets:** the average of each club's 23 players should land within 2 of these targets, so the season has easy and hard opponents: harrowgate 72, quarryhill 67, millrace 63, brackenport 60, tollbridge 55, fernmoor 50. Every club also needs at least one player rated 80 or more and at least one rated 45 or less, so ratings visibly differ.
- **Done check:** `node tests/lantern-bowl-roster.cjs` passes, and it checks all of this: exactly six clubs with those IDs, the slot counts, unique player IDs across the file, every rating key in the shared list and every value a whole number from 35 to 90, the kept names in their kept slots, club averages within 2 of the targets, the 80+ and 45-or-less rule, and malformed files rejected (a 91, a 34, a missing slot, a duplicate ID, an unknown key). The PR pastes the output, and normal CI stays green.
- **What I wire later:** in LB-MANAGER I load the file in place of `baseRoster()`, turn the named line and rushers into real blocking pairs, and show the ratings on the cards. Old saves keep their match, because the save stores the roster it started with.
- **Dependencies:** none.

### LB-G2. Season schedule and club data, data only (LB-SEASON) (shelved 2026-10-18, do not start)

**Status:** Done. Merged as #478.

- **Guest:** dot.
- **Scope:** Write the season as data: the six clubs' names, colours and home grounds, a ten-week fixture list, and the playoff format. Add a validator. This does not touch the save and the game does not load it yet.
- **Files:** create `games/lantern-bowl/season.json` and `tests/lantern-bowl-season.cjs`. Edit nothing else.
- **Shape:** `schemaVersion: 1`. A `clubs` array of six entries in index order with `id`, `name`, `short`, `color` (a hex colour) and `field` (the home ground's name). Brackenport stays "Brackenport Lanterns", short "Lanterns", `#c45a32`, at Lamplight Field. Millrace stays "Millrace", `#2d6f80`. The four new clubs get original names that fit their place-name IDs. Then `weeks: 10`, `quarterSeconds: 120`, and a `fixtures` array of 10 weeks. Each week holds 3 games as `[homeIndex, awayIndex]`. Last, `playoffs: { "teams": 4, "rounds": ["semi", "final"], "seeding": "standings" }` and a `trophy` name. Ten weeks of six clubs is two full round robins, one home and one away, which is the same pattern `makeSchedule(10)` in `shared/sports-office.js` produces. The plan's "two-round final" (`docs/plans/lantern-bowl.md`) is the semi and the final.
- **Colours:** new club colours are used to tint the existing side-on sprites, so they must stand apart from each other and from the ink outline `#1e1a22`. Use a contrast ratio of at least 3:1 against `#1e1a22`, and keep any two club colours at least 40 apart in RGB distance. GAD reviews the colours on the field when I wire them in.
- **Done check:** `node tests/lantern-bowl-season.cjs` passes, and it checks all of this: six clubs with the shared IDs in order, Brackenport and Millrace unchanged, every club in exactly one game per week, every pair meeting exactly twice with the home side swapped, each club with 5 home and 5 away games, Brackenport playing in week 1, the colour rules, a valid playoff block, and malformed files rejected. The PR pastes the output, and normal CI stays green.
- **What I wire later:** LB-SEASON builds the league on `shared/sports-office.js`, with standings and playoffs, from this file. That PR changes the save, and its save design goes to Evan through Director first. This row does not.
- **Dependencies:** none. It shares only the club IDs in this page with LB-G1.

### LB-G3. Player progression table and five-season simulation (LB-SEASON) (shelved 2026-10-18, do not start)

**Status:** Done. Merged as #480. Do not reopen it.

- **Guest:** dot.
- **Scope:** Write how players grow and age as a data table, plus a seeded simulation that proves ratings stay inside 35–90 over five seasons. This is the "XP per match, level-up toward a potential cap" item in the comparison (fix 8). It is data and a test only. It adds no save field.
- **Files:** create `games/lantern-bowl/progression.json` and `tests/lantern-bowl-progression.cjs`. Edit nothing else.
- **Shape:** `schemaVersion: 1`. `xp`: points per match event (a start, a touchdown, a catch, a sack, a tackle, a made kick, a win), each a whole number from 0 to 10. `levels`: the XP needed for each level-up, rising. `levelUp`: how many points one level adds to one rating (1 to 3). `potential`: a cap per age band, so a 22-year-old can grow further than a 30-year-old. `aging`: the change per season by age band, with growth up to about 27, a plateau, and decline from about 31. `floor: 35` and `ceiling: 90`.
- **Done check:** `node tests/lantern-bowl-progression.cjs` passes. It builds its own seeded fixture of 23 players with the shared rating keys (it does not read LB-G1's file), runs five seasons of ten games, and checks all of this: no rating ever leaves 35–90, a typical 22-year-old starter gains 2 to 6 overall per season in the first two seasons, a 33-year-old loses overall, no player passes their potential cap, and the same seed gives the same result. It prints a small table per season. The PR pastes the output, and normal CI stays green.
- **What I wire later:** LB-SEASON applies the table between games and stores XP and level in the new season save, which Evan signs off through Director.
- **Dependencies:** none.

### NM-G2. Second district data and a pacing check (later row: moving to a new district, permits)

**Status:** Done. Merged as #483. The ruling is https://github.com/ecbarish/generations/pull/483#issuecomment-6183588332. Do not reopen it.

- **Guest:** dot. dot knows Night Market's pacing from NM-PHONE, and these files are separate from #456's.
- **Scope:** Write the second district as data, with its own six stall types in the same shape as `STALLS` in `model.js`, and add a pacing tool that shows how a fresh run in that district would play. This follows §8.3 of `docs/research/office-idle-progression.md`: permits are `floor(sqrt(lifetime / 1e6))`, the move is offered at a lifetime of 1,000,000, one favourite vendor comes along, and each permit opens one new stall type instead of a percentage boost. It is data and tooling only. It adds no save field.
- **Files:** create `games/night-market/districts.json` and `tools/night-market-district-sim.cjs`. Do not edit `tools/night-market-pacing.cjs`, `model.js` or any test page.
- **Shape:** `schemaVersion: 1` and a `districts` array with one entry for now: `id`, `name`, `customers` (one sentence about who shops there), `moveAtLifetime: 1000000`, and `stalls`, an array of six stall objects with every field `STALLS` uses (`id`, `name`, `vendor`, `habit`, `serve`, `left`, `lefts`, `hire`, `base`, `growth`, `rate`, `serves`, `hand`, `looks` (4 entries), `gossip` and `next`). Stall IDs must not repeat any first-district ID. Add `permitStalls`: which of the six stalls each permit opens.
- **Done check:** `node tools/night-market-district-sim.cjs` prints a pacing table for the "active" and "saver" profiles that `tools/night-market-pacing.cjs` already defines, with the minutes to each stall unlock and to the first hire in the new district. It exits with an error unless all of these hold: the first stall of the new district can be bought within 2 minutes of arriving with one permit, every unlock lands 3 to 15 minutes after the one before for the active profile, the whole district runs at least as long as the first district's 48 to 66 minutes to its own million, and every field matches the `STALLS` shape. The PR pastes the table. Normal CI stays green.
- **What I wire later:** the "Move district?" choice. It is a prestige reset, so it changes the save, and that design goes to Evan through Director before it is built.
- **Dependencies:** none.

**WBW-1.** Dot. Errand data for the quest log.

**Status:** Done. Merged as #485. Do not reopen it.

The ten errands from design section 3 are data. Each has an id, a town, a giver, requires gates (badges, `field:*` keys, map ids), steps, and log text of 120 characters or fewer. Rewards may only use the existing bag keys `lures`, `coins` and `berries`. Progress is stored only as story keys `sq:<id>:heard`, `:step` and `:done`, so there is no save change. There is no character dialogue yet, and Perrin's and Juna's items in `sq-halen-passing` stay placeholders.

The ten ids, copied from section 3, are `sq-nora-bird`, `sq-isolde-path`, `sq-tobin-tally`, `sq-sela-warmth`, `sq-vessa-beacon`, `sq-lowbell`, `sq-senna-stones`, `sq-halen-passing`, `sq-rysa-skiffs` and `sq-spire-memory`. Hearing an errand sets `sq:<id>:heard`. A middle step, when the table needs one, sets `sq:<id>:step`. Done sets `sq:<id>:done`.

- **Files:** `docs/plans/wildbond-world/errands.json`, `docs/plans/wildbond-world/errands-schema.md` and `tools/test_wildbond_world_errands.py`.
- **Done when:** `python3 -m unittest tools/test_wildbond_world_errands.py` passes. It checks for exactly the ten ids from the doc, that every key matches `^sq:[a-z-]+:(heard|step|done)$`, that every giver is a CAST id in `wildbond.json` or Nora (`pip_gran`), that every map id is current or planned in section 2, and that there is no top-level `quests` key. `python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD` prints `No packed Wildbond game files changed`.
- **The dev lead wires up later:** the loader in `_ready()`, the field-book quest log page, and the WB-WORLD-7 dialogue.
- **Approval:** this has no dependency on another bot's approval.

### Whichever guest finishes first

**WBW-2.** Knothollow cave layout and encounters.

**Status:** Done. Merged as #490. Do not reopen it.

`knothollow` is a map entry in the exact MAPS shape (`name`, biome `thornwood`, `start`, `rows`, `exits`, `signs`, `items`, `wild`). It uses only the existing TILES glyphs. The Stone Break and Grove Wake spots go in a separate gates list keyed to `field:stone` and `field:grove`. Exits go to `rootwater` and `thornwood_grove`. `wild` uses only Thornwood's BIOMES species at levels 2 to 12, with nothing unique and no Elderhorn. It includes the layout notes from section 5: a 48×32 mouth, a 32px ceiling, and no mounts.

- **Files:** `docs/plans/wildbond-world/knothollow.json`, `docs/plans/wildbond-world/knothollow.md` and `tools/test_wildbond_world_knothollow.py`.
- **Done when:** `python3 -m unittest tools/test_wildbond_world_knothollow.py` passes. It checks that the rows are rectangular, that every glyph is in TILES, that every walkable, exit and gate tile can be reached from start by BFS, that every species exists in SPECIES and in Thornwood's table, that the weights are positive, and that the exit targets are valid. `python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD` prints `No packed Wildbond game files changed`.
- **The dev lead wires up later:** the Godot map, the gate checks, the painter, Game Art Director's cave palette, and the reciprocal exits.
- **Approval:** this has no dependency on another bot's approval. Claim it on #373 when you are the first guest free. The other guest does not start it.

## Grok, now

Grok's current task is WBW-4, Answering Ways. It was claimed on #373. No pull is open yet. After that, launch games come first: LR-G2 (ready now), LB-G13, LB-G14, LR-G3 (after LR-G2 merges), LR-G4 (after LR-G3 merges), NM-G8 (after #499 merges), and LB-PAL (seventh, after NM-G8; it starts after #505 merges). Then LR-G1, WBW-7, WBW-9, WBW-11, WBW-13, WBW-15 and WBW-17. Open priority rows left: 15. LR-G2, LR-G3 and LR-G4 all belong to Grok. Merge each only after Playtester confirms it does not drop below 8/10, because Little Ranch launches on 16 October.

Done. Do not reopen these. LB-G7 is #495. NM-G4 is #498. NM-G5 is #500. LB-G9 is #489. WBW-6 is #492. WBW-3 is #487. LB-G6 is #481. NM-G1 is #482. LB-G4 is #474. LB-G5 is #479. WB-ROAD is #467. #449 merged as `44f49c2c`. #438 merged as `4e92d87a`. NM-FIX-6 merged as #461, `1d36ee61`. There is no LB-G4b row.

## Grok, next

WB-ROAD is done. It merged as #467. Do not reopen it. The WBL-8 to WBL-10 fixes now belong to Wildbond & Starfall Dev Lead. No guest-safe piece is left. The dev lead is taking those fixes into a follow-up after #458, along with registering `wbl_continue.gd` in `run_tests.gd`. The note below is the record of the guest row.

**WB-ROAD.** Done. Merged as #467. The WBL-8 to WBL-10 fixes belong to the Wildbond dev lead. One Godot pull for WBL-8, WBL-9 and WBL-10, and WBL-16 because it is the same title screen. The road from Larkhaven to Thornwood goes somewhere a newcomer can walk (WBL-8). Continue goes through the title screen and returns to the same place (WBL-9). Clicking "Continue your journey" chooses Continue (WBL-16). A real end-to-end Continue test starts a journey, quits, continues, and lands in the same place, not only a fixture load (WBL-10). WBL-7 stays with the north-roads check from #416. Stay out of the Wildbond dev lead's fix bundle (#458: mouse clicks on buttons, walking speed, and the opening tidy). Old saves must load. There is no save-format change.

The map data already connects Larkhaven north to the Thornwood route, and that route north to Thornwood. Reproduce the "does nothing" path. If a walkable exit tile is missing, or the exit character is not marked as an exit, fix that in `wildbond-godot/data/wildbond.json` only. If the only block is the "Not yet" sentence or the door check in `wildbond-godot/scripts/main.gd`, do not edit `main.gd`. Say what you reproduced on #373 and leave that part. WBL-9, WBL-10 and WBL-16 still go ahead in the title screen.

- **Files:** `wildbond-godot/scripts/title.gd`, a new standalone `wildbond-godot/tests/wbl_continue.gd`, and `wildbond-godot/data/wildbond.json` only if the reproduced road bug is exit data. Do not edit `wildbond-godot/scripts/main.gd`, `battle.gd`, `card.gd`, `controls.gd`, `howto.gd`, `phone_shell.gd`, `touch_pad.gd`, `turn_card.gd`, or `wildbond-godot/tests/run_tests.gd`. Those belong to the fix bundle or to the phone-layout pull. Do not edit the early-encounter or healing code that WB-LOOK owns. The Continue test runs as its own headless script, so it does not need a line in `run_tests.gd`.
- **Done when:** Continue returns to the same place, clicking "Continue your journey" chooses Continue, and the end-to-end test passes. The road either goes somewhere from the data fix, or the #373 note says the remaining block is in `main.gd` and was left there. Old saves load.
- **Approval:** this has no dependency on another bot's approval.
- **Re-export:** Rebuild `play/wildbond/index.pck` only once, as the last step, right after merging main and just before review. Only one PR carries a Wildbond re-export at a time. #431 and #458 already carry a pack. If either is still open, leave the pack out of this pull and say so.

## dot, now

Dot's current task is WBW-5. The draft is #501. Then NM-G3 (#499). The header-grid ruling is https://github.com/ecbarish/generations/issues/373#issuecomment-6184708856. Finish WBW-5 first. After that in-progress work, launch games come first: NM-G6, LB-G12, NM-G7 and NM-G10 (after NM-G8 merges). Then WBW-8, WBW-10, WBW-12, WBW-14, WBW-16 and WBW-18. Open priority rows left: 12. LB-G11 and NM-G9 are merged. Do not start a second copy.

In review, counted done for this queue, and not a wait: LB-G10 is #496.

Done. Do not reopen these. LB-G11 is #511. NM-G9 is #515. WBW-2 is #490. NM-G2 is #483. LB-G8 is #494. WBW-1 is #485. LB-G3 is #480. LB-G1 is #472. LB-G2 is #478.

**LB-PLAYBOOK-DATA.** Done. Merged as #451. Do not reopen it. The sentences below are the record of that row. #444 has also merged.

- **Files:** `games/lantern-bowl/playbook.json` and `tests/lantern-bowl-playbook.cjs`. Leave `tests/lantern-bowl.html`, `games/lantern-bowl/game.js`, `model.js`, `style.css` and `view.js` until the #444 handoff, and do not edit the match engine.
- **Done when:** the data file holds the plays and the breaking routes, and the match engine is unchanged.
- **Approval:** the data file itself has no dependency on another bot's approval. The HTML integration waits on #444, and that wait is not a reason to sit idle.

## dot, next

LB-G1 is done (#472). LB-G2 is done (#478). LB-G3 is done (#480). NM-PHONE is done (#456). WB-LOOK is still open as draft #466 and is not the current task. Its remaining gates stay with Wildbond & Starfall Dev Lead.

**NM-PHONE.** Done. Merged as #456. "Back to the arcade" is large enough and stops covering another button. A stall is on screen on a phone without scrolling. One Night Market pull, with phone-size screenshots held upright and sideways. This closes checklist item 10 (NM-FIX-8). The save work is done: NM-FIX-6 merged as #461 (`1d36ee61`). The approved art is done: #438 merged as `4e92d87a`. Do not edit `games/night-market/game.js` or `games/night-market/lane.js`.

- **Files:** `games/night-market/index.html`, `games/night-market/style.css`, `tests/night-market.html`, `.github/workflows/night-market-phone-review.yml`, and `tools/playtest/night-market-phone.cjs`. These files are already on #456. Do not edit `games/night-market/game.js` or `games/night-market/lane.js`.
- **Done when:** the back control does not cover another button, and a phone shows a stall without a scroll.
- **Approval:** this has no dependency on another bot's approval.

**WB-LOOK.** One Godot pull for early pace (WBL-5). A faster early encounter rate and healing, so the first session is not a long walk with nothing to do. Include before-and-after timing. The early grass counter and the early-route heal call are the change. Fold in WBL-13, the sprite that vanishes when hit, only if that fix is small and stays out of the fix bundle's sprite and battle work. Stay out of the Wildbond dev lead's fix bundle and out of Grok's WB-ROAD files. Old saves must load. There is no save-format change.

- **Files:** the early encounter counter (`grass_n` and the range in `_arrived`) and the early-route heal call, in `wildbond-godot/scripts/main.gd` only. For WBL-13, only if it is small: `wildbond-godot/scripts/creature_sprites.gd` or `wildbond-godot/scripts/battle_effects.gd`. Do not edit `battle.gd`, `title.gd`, `wildbond.json`, `card.gd`, `controls.gd`, or the fix bundle's other functions in `main.gd` (clicks, walking speed, the starter screen, the Maren loop, the speech box, and the catch bar). Do not edit the Thornwood road or Continue files.
- **Done when:** the early route has encounters and healing, and the timing note is in the pull. Old saves load. If WBL-13 is not a small change in one of the two sprite files above, leave it and say so on #373.
- **Approval:** this has no dependency on another bot's approval.
- **Re-export:** Rebuild `play/wildbond/index.pck` only once, as the last step, right after merging main and just before review. Only one PR carries a Wildbond re-export at a time. If #431, #458, or Grok's WB-ROAD pull already carries the re-export, leave the pack out of this pull and say so.

## Not listed here

These stay off this backlog. Do not claim them.

- LB-GAMEFLOW stays with Side Games Dev Lead. LB-FEEL, LB-MANAGER and LB-SEASON integration stays with Side Games Dev Lead, and their data pieces (LB-G1 to LB-G6) are now guest rows in Priority rows above. The LB-SEASON save-format change is not a guest row.
- Wildbond fix bundle 2 merged as #458. Do not reopen it.
- LR-TOY-POLISH is the kitchen bowl, the console 404, and sign tap responses. Side Games Dev Lead owns it.
- LR19 to LR22 are on hold. The held toy pulls #404 to #412 will conflict with LR-G2 and LR-G3, and that is expected.
- Dev lead keeps the Night Market reset and new game, Mooncake and cart balance, NM-HUB, the district move, and all Lantern Bowl wiring into `game.js` and `model.js` plus the season save design.
- There is no new Realmbound work.
- NM-HUB stays with Side Games Dev Lead.
- NM-FIX-7 and LRL-11 are Playtester sessions, not build pulls.
- NM-CLAMP waits on Shared Systems Architect.
- NM-RETUNE is merged (#445). Do not open it again.
- SF2.11 and ART-SF are not in this cycle's guest list. ART-SF is new art and waits on #426.

## Unclaimed rows

Take a Priority row above before any bug-fix row in this section. The nine rows in each list below stay as the fallback, after that guest's Priority rows are taken.

Little Ranch, Lantern Bowl and Night Market data and tool rows are the LB-G, NM-G and LR-G rows above. They create new files only. #449 has merged (`44f49c2c`). Little Ranch's remaining live files are LR-TOY-POLISH (#460). Lantern Bowl's live game files stay with LB-GAMEFLOW (#444) and with dot's playbook (#451). #438 (`4e92d87a`) and NM-FIX-6 (#461, `1d36ee61`) have merged. Night Market's open guest pull is #456. Do not start a second edit of a file a Priority row or an open pull already names. LRL-11 is a Playtester session. LR19 to LR22 are on hold. NM-HUB stays with Side Games. NM-RETUNE is merged. NM-CLAMP waits on Shared Systems Architect. NM-FIX-7 is a Playtester session.

Wildbond's background lane was next. WB-ROAD is done via #467, and the WBL-8 to WBL-10 fixes belong to the Wildbond dev lead. WB-LOOK is the assigned draft #466. WBL-7 stays with the north-roads check from #416. WBL-16 rides inside WB-ROAD because it is `title.gd`. WBL-15 (long captions) and WBL-17 (the ranch prompt) sit in `main.gd` beside the fix bundle and beside WB-LOOK, so they are not separate rows. WBL-19 (the size table) sits in `main.gd` and `battle.gd`. WBL-18 was checked on 2026-10-15: `wildbond.json` does not contain duplicate species names, and DD-5 already says which lines use trust plus level, so it is not a build row. WBL-20 needs Evan. WBL-21 is wording, and DD-5 is already updated. WBL-22 is merged (#399). Shop clicks use `controls.gd`, which the fix bundle owns. There is no further Wildbond file that is free of the fix bundle, the phone-layout pull, WB-ROAD and WB-LOOK.

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
