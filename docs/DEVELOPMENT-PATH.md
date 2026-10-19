# The development path (every game, to launch and beyond)

Written 2026-10-08 by Claude at Evan's request: "flesh out a full development path or set up a system where other AIs
can figure it out ... we have a lot to still do but ChatGPT said it had finished its tickets." This page is both:
**the path** (milestones for every game, broken into deliverables of about one pull request each) and **the system**
(how any assistant turns the path into its next ticket without waiting for anyone). Read docs/PROJECTS.md
"Read first" before using it; it holds the decisions and lessons this path follows.

## Part 1: the system (read this when your lane is empty)

### The ticket factory
When your lane in docs/QUEUE.md has no `open` task, **do not stop and do not report "finished"**. Instead:

1. **Reviews first** (Claude): merge waiting PRs. **Bugs first** (everyone): open GitHub issues and anything Evan
   reported.
2. **Find your next deliverable here, in focus order** ([PRIORITIES.md](PRIORITIES.md), updated 2026-10-09): the
   flagship game first (its order is in PRIORITIES section 4), then the second game, then your own slot, then
   keep-alive games. Within a game, the earliest milestone first. Take an unticked deliverable **with your owner tag**
   (`[Claude]`, `[ChatGPT]`, `[any]`, `[local]`) and no `(claimed ...)` note. (This replaced "prefer the game with the
   fewest open PRs", which spread work so evenly that no game got finished.)
3. **Claim it** as docs/PROCESS.md says (a draft pull request titled with the deliverable's ID, opened
   before you build; the deliverable marked here `(claimed: <you>, <date>, <branch>)` in its first commit). Take only
   deliverables in your lane's files (QUEUE.md "Who works where"). Write the ticket into docs/ROADMAP.md with the
   template below when the work needs one.
4. **Build it, test it, open the PR** (QUEUE.md "The loop"), and go straight back to step 2.
5. **When a whole milestone is ticked**, write the next one's deliverables if they aren't listed yet (a short
   proposal in `docs/proposals/` if it's new design; see "Ask Evan first" below), then continue.
6. **If everything you own is blocked**, take an `[any]` deliverable, or a "Standing work" item (Part 3).

### The ticket template
```
### T<number>: <Game>, <deliverable name> (<deliverable ID>)
Why: <the player-facing reason, in one or two sentences; cite Evan or the plan doc>.
Read first: <the plan or design docs, lore ledger entries>.
Branch: `codex/<topic>` (or claude/ for Claude when not on main).
- <what to build, as concrete behaviour the player sees>
- <what must not change: old saves load, other games untouched, the game window rule>
- Checks: <which test page or Godot test, what new checks prove it>; README changelog entry; screenshots if visual.
```
Ticket numbers: take the next free `T` number in docs/ROADMAP.md.

### Ask Evan first (everything else, go ahead)
Open a `docs/proposals/<topic>.md` with a recommended default, mark the deliverable `blocked: needs Evan`, and move on,
when a deliverable would: start a new game or unpark one; spend money or need an account; download large files;
change canon already decided (docs/lore/, the "Decided" list in docs/research/decisions.md); remove a feature
players use; add an AI service at play time; or touch another lane's files (QUEUE.md "Who works where"; since 2026-10-09 any AI may take Godot
deliverables under the Godot rules in QUEUE.md "The road ahead"). Questions for Evan live in START-HERE "Questions for Evan", each with a default so work never waits.

### The quality bar (every deliverable)
Feels like a game (docs/wildbond-plan.md principles); everything in the game window; the world's words, readable;
no windfalls; earned automation; old saves load; all test pages pass (eight browser pages, plus the Godot checks for
Claude: `node tools/run-all-checks.cjs` runs all ten, and GitHub runs it on every pull request, so never merge a red
cross); one README changelog line; Claude bumps versions on merge. The craft rules (saving, sound formats, Godot
structure, when to rebuild `play/`) are in docs/learning/. **Playable by a newcomer:** before friends see a new game or a
big step, someone who didn't build it scores it with docs/PLAYTEST.md's six questions (no 1s, 13 or more).

### Owners
- **Claude:** reviews and merges; the Godot games (`wildbond-godot/`, `starfall-godot/`) and their web previews
  (`play/`); shared design calls; keeping this page, PROJECTS, QUEUE and START-HERE current.
- **ChatGPT/Codex:** the browser games (Realmbound, Diamond Career, Otherworld, browser Wildbond and Starfall Guild),
  data and lore that feed the Godot games (species, maps, lines), guides, research write-ups.
- **[any]:** whoever gets there first. **[local]:** small checkable jobs for the local helper (Lane D).

## Part 2: the path

Tick a box when the deliverable is merged (`- [x]`, with the date). IDs are stable; tickets reference them.

### Wildbond (Godot): the new Wildbond, to version 2.0
- [x] WB-C2 [dot / Adam] (merged: #279, c8fa1c8, 2026-10-13) Meet your partner sooner (cycle 1): measure New Game to first partner before and after; trim the opening to three minutes or less while preserving story essentials and old saves. Files: Wildbond opening, regression/timing evidence, and coordination docs. Done when both measurements are in the PR, checks pass, and old saves load.
- [x] WB-C2-REL [dot / Adam] (published: #286, f81ef50, 2026-10-13) Exact c8fa1c8/e07 pack released; all 22 suites, complete browser save/rename/phone gate, Pages and 93 actual-live assertions pass. [Evidence](releases/wildbond-wbc2-handoff.md). Engine/storage identity and concurrent work preserved.
- [x] WB-C3 [Claude, Wildbond builder] (merged: #361, e76cfa9, 2026-10-14) Wildbond on a phone held sideways: the web preview walks, talks, battles and opens the bag by touch. Files: wildbond-godot/. Done when a phone-size run is recorded in the PR.
- [x] WB-C3b [Claude] (merged: #382, 8b4a33c, 2026-10-14) The register shows only the tap hint on phones, and the partner-card note no longer touches the stat bars. Files: wildbond-godot/scripts/register.gd, scripts/card.gd. Done when those two screens are checked.
- [x] WB-C4 [Claude, Game assets] (merged: #372, ef1bf0c, 2026-10-14) Larkhaven and the first route at their best: a barn garden, door stones, straw in the pen and grass variety, and a muddy, reedy bank on the Thornwood ponds. Files: wildbond-godot/. Done when before and after screenshots are in the PR.
- [x] WB-FUNNEL1 [dot / Adam] (merged: #380, 18c4169, 2026-10-14) First-three-minutes funnel (Evan's ruling, COMMS 2026-10-14 12:11 UTC): record time from New Game to first partner, first battle and first catch (a debug/test readout, no new save fields), and let every opening dialogue line be fast-forwarded. Doesn't touch the starter choice scene (NOS-1a). Files: wildbond-godot/ opening and dialogue scripts, wildbond-godot/tests/. Done when a headless test prints the three times for a default New Game, fast-forward works on every opening line, old saves load and all checks pass.

- [x] WB-N1 [any] (done 2026-10-12 by Muse, Adam / abarish-dev, PR #257) Wildbond newcomer snags (Flint round 2, COMMS 2026-10-12 20:52): after the rival fight, Maren says the team is hurt and the Larkhaven inn heals (win scene + loss line); after the first catch, Maren points to the ranch once (`story_done["marenRanchTip"]`); battle HP bars snap to real HP on finish (`u.shown`). Bond-gated evolution is a design question for Design decisions first. Files: wildbond-godot/. All Godot checks pass; old saves load (additive changes only).
**WB-M1: the start of the journey (done 2026-10-08).**
- [x] The opening, register and heritages, the barn, Wren; Thornwood, Saltmarsh, Emberfall, Cloudglass; wild
  bonding; trainers and Wardens; the ranch as a place (nursery, trough, workbench, gear); evolution; music; saving;
  web preview.

**WB-M2: who you are and where you stand.**
- [x] WB2.1 [Claude] Tamer abilities with heritages (WG1): done 2026-10-08 (Orders menu: Rally, a family order, Toren's Steady).
- [x] WB-KEYS [any] Show the keys in game (PLAYTEST pass 2: "Wildbond still shows no keys in game"): the first time each action matters, its key or phone-pad button appears in the world; no website needed to play. (QUEUE H2) *Done 2026-10-11 (Claude, lane W): the arrow keys float over your head until you have walked a few steps; beside anyone or anything you can use, the Talk key and its word ("E Talk", "E Feed"; A on a gamepad) sit beside you until you have used it three times; J (or Y) sits beside the bag until the field book has been opened. On a phone the pad and the Talk button already label themselves, so nothing is added. Older saves never see them. Screenshots: docs/screenshots/wildbond-keys/.*
- [ ] WB2.2 [Claude] Depth step 1 (WG6): ground heights, object footprints and heights (part 1 done 2026-10-08: the colour layer drawn in true depth order, people in front of you faded as the world is). Part 2 done 2026-10-09: trees beside open ground stand at their true height and their crowns pass in front of you (see-through, faded like the world: shaders/canopy.gdshader), never over a sign or an item. Left: ground heights, footprints and heights on objects (houses and rocks).
- [ ] WB2.3 [Claude] Variety pass (WG7) (done 2026-10-08: an animated effect per element in battle; waves and wind under the music. Tried the pack's water ripples: opaque tiles, rejected). Left: waterfalls, edge
  tiles.
- [x] WB-ROOMS-1 [any] (done 2026-10-12, Grok for Adam / abarish-dev, guest/wildbond-rooms) ROOM-03, ROOM-04 and the inn part of ROOM-05 from the #176 audit: the Larkhaven inn gets chaired tables, long tables with benches, a rug and barrels behind the bar; Pip and Mira's home a hearth rug and chair, a family table with three chairs, Pip's own bed and toy crate; Nora's cottage a hearth corner with her chair and a kettle on the hob, a rug, a chair at her table and a berry crock. New code-art furniture (chair, bench, barrel, kettle stand, walkable rug) in main.gd; keepers, finds, doors and exits unchanged and reachable (map audit: 18 maps, 0 findings). Shop and barn stay for a later ROOM-05 pass.
- [x] WB-DOOR-TAP [any] (verified: draft PR #177, Adam / abarish-dev, 2026-10-11) Fix the registered-door tap rejection reported on #137; main.gd and native input regressions, with desktop/phone entry, exit and re-entry evidence for all five Larkhaven buildings. Also clear the confirmed Nora doorway/D-pad overlap at Adam's explicit request; retain button size, actions and preferences. Keep keyboard, state restrictions, camera transforms and saves unchanged; no preview export or merge. (merged: PR #177; ticked 2026-10-11 by lane P)
- [x] WB2.4 [Claude] Interiors: the inn, the shop and two homes in Larkhaven, walkable (inn and shop done 2026-10-08, with Old Ned and Juniper; both homes done 2026-10-10: Pip's home with Mira and Nora's cottage, Grok for Adam / abarish-dev, PR #137, H8; the pack's unused Interior tileset has furniture, floors and walls: docs/learning/assets.md).
- [x] WB2.5 [Claude] Maren's letter and the field book's "where next" hint (WG8): done 2026-10-08.
- [x] WB2.6 [ChatGPT] (done, merged 2026-10-09; T45) Lore: a heritage line for every Warden and townsperson in areas 1-4 (data in the browser game,
  exported to Godot), recorded in the thread ledger.
- [x] WB2.7 [Claude] Bring T37's fourteen creatures into Godot (WG9): done 2026-10-09 (exported; all use existing body types; 107 species).

**WB-C: creatures worth raising (Evan, 2026-10-11; spec: docs/wildbond-creatures.md, list: docs/wildbond-creatures/catalog.md).**
Target about 150 species in about 70 lines; most new species are new stages of today's 74 loners; six showpiece lines.
- [x] CR1 [any] (done 2026-10-12 by Muse, Adam / abarish-dev, PR #267) Sizes and tiers in the data (`size`, `tier` on all 112 species) and creatures drawn at their size in battle and when following you (spec 4.4). Screenshots small beside huge (docs/screenshots/cr1/). All Godot checks pass (1528).
- [ ] CR2 [ChatGPT / writer] The six showpiece lines (spec 3): the three starter lines promoted, new Stone, Gale and Radiant lines, a slow growth rate, guardians raised to 560-600; pacing check (WB3.6b) holds.
- [ ] CR3 [any, one region per PR] Grow the loners into lines: about 58 of the 74 creatures that never evolve gain a new stage before or after them, each its own creature with its own name and look (like Squirtle, Wartortle, Blastoise; not baby or adult versions, which are WB5.5), in journey order (Thornwood first).
- [x] CR4 [any] (done 2026-10-13 by Muse, Adam / abarish-dev, PR #280) The evolution moment: the light, the silhouette growing, the new form at full size, someone who notices; the full version for showpieces (Legend as stand-in until CR2). Screenshots docs/screenshots/cr4/. 1534 Godot checks pass.
- [x] CR5 [any] (done 2026-10-13 by Muse, Adam / abarish-dev, PR #285) Two more branching lines with unused conditions (time of day, weather, what it ate). Mistfinch->Dawnchorus/Duskwing/Cloudharrier; Brineskit->Rainback/Gorgebelly/Shoalcrest. 1565 Godot checks pass.
- [ ] CR6 [any] World-fit audit: every creature in solid black by shape; fix look-alikes; each region's size and shape spread (spec 4.2, 4.7).
- [ ] CR7 [any] Rare spawns for showpieces: a hidden pocket or rare-condition spawn per region, hinted by someone there.
- [ ] CR8 [any] New shapes: fish and a winged drake first, then rabbit-kind, beetle, owl (one per PR, screenshots).

**WB-M3: the rest of the valley (areas 5-8).**
- [ ] WB3.1 [Claude] Stillreed Basin in Godot (map, ferry, trainers, Warden), with its own furniture, sound and music. *Step 1 done 2026-10-09: the area is walkable with its wooden footbridges, trainers, Warden, river ambience and the Boat tune; step 2: the moored ferry skiff and its mooring sign (readable), the river flowing under the bridges. Step 3: its own touches: the current running down the river, cattails on the banks, windfall under the orchard, a coil of ferry rope, dragonflies. Still to do (later, with the story): a ferry ride once the rope is mended.*
- [x] WB3.2 [Claude] Hollowecho Hills. *Done 2026-10-09 from ChatGPT's brief (docs/lore/wildbond-hollowecho-brief.md): walkable with Veslin, Narro, Orri (byBadge and heritage lines from data), Warden Senna and her gate; the bell house with two swaying bells, the tool roll, the survey cord and chalk arrows, Senna's resting stones, cave mouths, grey-green hill stone, low mist, the Quiet tune. Not done: Undertone's reunion staging and the answering-bell moment (story beats, later); Senna's team levels left as the data has them (58-60; the lore paragraph says 60-63).*
- [x] WB3.3 [Claude] Sunthread Commons. *Done 2026-10-09 from the T49 brief: the timber meeting hall with pennants, the sandy forecourt, Mirel's mending frame, Nesla's bench with the four braided ties, nursery beds with green ribbons; Mirel, Aldren, Pell, Nesla and Warden Halen from data (Halen's team as the data has it, 63-65); the Sunny tune. Not done: the Wren, nursery and Meadowmantle scene staging (story beats, later).*
- [x] WB3.4 [Claude] Farwatch Reach. *Done 2026-10-09 from the T49 brief: the stone lookout with its lamp room, the harbor house with drying nets, the pier over the water, Rysa's open ledger, a dry bench, mooring posts and shore lanterns; Delka, Sivren, Ceryn and Warden Rysa from data (Rysa's team as the data has it, 68-70); the Peaceful tune and waves. The road north to the league is honest that the league is not built yet (WB4.1). Not done: the Watchlight and answering-lights scene staging (story beats, later).*
- [x] WB3.5 [ChatGPT] (Hollowecho T47, Sunthread and Farwatch T49: all merged 2026-10-09) For each area before Claude builds it: a short "area brief" in docs/lore/ (places, people,
  clues from T40, creatures, one memorable moment) so the Godot build has everything in one page.
- [x] WB3.6 [ChatGPT] T56, merged 2026-10-09 (PR #83): actual copied Godot battle/rules, final-area and league pacing, raw measurements and cooldown finding; no balance tuning or Godot edits. Report: docs/wildbond-godot-pacing.md.
- [x] WB3.6b [Claude] Pacing fix from T56: a level costs about 12 even-level wins at every stage (rules.gd `win_xp`); cooldown stall fixed in PR #91.
- [ ] WB3.7 [Claude] The Unbound appear (WG5): first encounters, a choice to help or oppose; reputation begins.

**WB-S: the turning year (Evan asked 2026-10-09; can run alongside WB-M3; docs/proposals/seasons-and-holidays.md).**
- [x] WS1 [Claude] (done 2026-10-09: scripts/calendar.gd, shared rules for Starfall too; the date and festival in the field book's header; C cycles the world's calendar, the real one and each season held; saved) The calendar: an in-game date that moves while you play (a season is about 2-3 hours of play),
  shown in the field book; settings for "follow the real calendar" (December brings the winter festival) and
  "hold one season". Saved.
- [x] WS2 [Claude] (done 2026-10-09: leaves tinted through the year, blossom and snow caps on crowns, snow on roofs, snow and frozen ponds, fallen leaves on paths, petals, leaves and snow in the air; the faded world washes it all out until colour returns; --season= picture flag) Four looks for every area: spring blossom, summer as now, autumn leaves, winter snow (tints and a
  few drawn extras over the same maps); faded places show the season faintly until colour returns.
- [x] WS3 [ChatGPT] (T50, merged 2026-10-09; in Godot: seasonal wild tables and one seasonal remark per person) Seasonal data in the browser game, exported to Godot: wild-encounter weight shifts and a few
  seasonal species (each also rare out of season), a seasonal line for each townsperson; check the faded-seasons
  idea against the thread ledger before it becomes canon.
- [ ] WS4 [Claude] Winter weather (snow, frozen pond edges, breath) and spring rain, building on G6 (the pack has rain and
  storm sounds and rain and leaf particles, unused: docs/learning/assets.md).
- [x] WS5 [Claude] (done 2026-10-09: Maren invites you once a festival a year; plant a flower in the paddock (it stays), run a lap to the north edge and back to Pip, fill the trough, or make a gift at the bench and give it to someone; a keepsake each, shown on the Team page; festival lines from townsfolk. Decorations: ribbons, flower boxes and a seed table for Planting Day; lanterns over the street for the Long Light; carved lanterns and a supper table for the Harvest Lanterns; garlands with lights on every house and the big tree with gifts for the Midwinter Hearth; --festival= picture flag.) The four festivals in Larkhaven: Planting Day, the Long Light, the Harvest Lanterns and the
  Midwinter Hearth (garlands, lights on the houses, a big tree in the square, gifts). Decorations, festival lines,
  one small activity and a cosmetic keepsake each.
- [x] WS6 [ChatGPT] (T51, merged 2026-10-09; placed in Godot by WS5) Festival writing: lines, keepsake names, a short tradition for each festival in docs/lore/.
**WB-M4: the ending.**
- [x] WB4.1 [Claude] The league: Wren at the gate, four courts, Champion Avenne. *Done 2026-10-09: from Farwatch with all eight badges; five stone courts with banners (a gold mark once won); Nelva explains and heals; the battles, lines and teams from the game data; healed between rooms; a loss starts the courts again (Wren stays beaten); the Champion brings the homecoming lines. The Spire stays closed (WB5.1).*
- [ ] WB4.2 [Claude] (claimed 2026-10-11 by the Wildbond builder thread, with WB4.3 part 2: placing T58) The wild bond's
  discovery (WG4) and the first-person glimpse. *Part 1 done 2026-10-11 (battle.gd `can_join`/`_join`, tests/wild_bond.gd): your last creature standing, badly hurt, Bonded, from the fourth badge on, against a harder foe (a Warden, the league, the Spire or a rematch at least its level, or any foe 3+ levels above; Evan, 2026-10-11: "I don't want it to just trigger at any low health"), once a game day: it looks back at you, Run's slot becomes "Stand with it", colour floods the field, you fight as one for 14 battle seconds (hits x1.6, takes x0.6, faster), then both are spent (its health low, your orders gone). Named only afterwards, the first time (`story_done.wildBond`; save field `bondDay`). Left: a fused form per family (now you stand within its shape), the field book page, people reacting, the scattered legends in the areas, the first-person glimpse, a challenge-mode switch.*
- [ ] WB4.3 [Claude] The homecoming ending, colour and depth restored. *Part 1 done 2026-10-09: after the Champion, Maren and Isolde come to the league gate and Avenne walks down (T54 staging), the ending and the quiet-down lines play, and every Warden welcomes the Champion on return. Part 2 done 2026-10-11 (PR #170; main.gd "the reveal", tests/reveal.gd): T58 placed. After the wild bond, Orri's rubbing (Hollowecho), Ceryn's survey (Farwatch) and Sivet's ferry leaf (Stillreed) appear one after another beside their keepers, re-readable; once all three are seen and the league is won, Toren and Isolde wait either side of Hollowecho's cave mouth, the reveal and depth's return play, long shadows fall from then on, and each Warden has one after-line. Left: the partner's walk-away-and-back as real movement (now narrated), Maren's and Wren's optional `tell` lines, a notebook page of what was seen, depth beyond shadows.*
- [ ] WB4.4 [ChatGPT] (T58 writing placed in Godot 2026-10-11, PR #170) (WB4.4a: T53 and T54 merged 2026-10-09 and placed; WB4.4b, the full mystery payoff, waits on Evan's choice in docs/proposals/wildbond-final-reveals.md) The ending's text and every thread's payoff, written from the ledger, for Claude to place.

**WB-D: deeper play (from the game review, docs/proposals/game-review-2026-10-09.md; before 2.0, order in PRIORITIES.md).**
- [x] WD1 [Claude] **Done 2026-10-09 in PR #91** (satchel icon and Satchel page; large place names on arrival). Numbers off the screen (GR-4): remove the Badges/Lures/Coins/Wilddex line; a readable arrival name.
- [ ] WD2 [ChatGPT data, Claude drawing] (data built: Codex, PR #113; drawing remains open) Creatures that look different (GR-1): per-species look features in data;
  parts drawn in figures.gd; 4-5 new body shapes. *Part 1 done 2026-10-09: serpent, turtle, moth and tree-folk shapes for twelve species (figures.gd `SHAPE_FOR`; a `shape` field in the data overrides it). Data half built in PR #113: all 107 browser species have shape + head/back/tail/pattern hints, including hybrids. Left: Claude draws the parts; a fish shape with WB5.7.*
- [x] WD3 [Claude, ChatGPT data] (merged: PR #125; ticked 2026-10-12 by lane P) Battles with real choices (GR-2): about 60 moves, family signature moves, a few
  statuses, an order per Warden; tuned with WB3.6.
- [ ] WD4 [Claude] Areas you can explore (GR-3): route, settlement and hidden pocket per area, return spots gated by
  element. **WD4a Thornwood done 2026-10-09 in PR #128:** Thornwood Trail, the preserved settlement, and Stone-gated Old Root Grove. **WD4b Saltmarsh (claimed: Grok for Adam / abarish-dev, 2026-10-12, guest/saltmarsh-explore):** the coast road, the original settlement kept, and Tide-gated Moon Pool. Emberfall and Cloudglass stay open, one area per PR.
- [ ] WA [Claude] **Wildbond's own art** (Evan chose "Our own tiles", 2026-10-09; direction in
  docs/art/wildbond-art-direction.md, which keeps a later 3D or first-person version in view). **Part 1 done
  2026-10-09:** ground, trees, bushes, flowers, cottages and Maren's barn painted by `tools/paint_tiles.gd`; the pack's
  floor, nature and house tiles removed. Water done too (no pack tiles left). Part 2: battle backdrops, the hand-drawn halls on the shared palette,
  interiors. Part 3: battle effects and emotes.

**WB-M5: life after the league.**
- [x] WB5.1 [Claude] The Lighthouse Spire and rematches. **Done 2026-10-09 in PR #129:** post-Champion Spire floors start at level 75 and keep climbing, full rest every fifth floor, best/current climb saved; defeated Wardens offer progressively stronger Champion rematches without duplicate badges.
- [ ] WB5.2 [Claude] Contests and races at the ranch (W4).
- [ ] WB5.3 [Claude] Ranch jobs: creatures help (W5/WG8).
- [ ] WB5.4 [Claude] Roaming legendaries (W3 part 2).
- [ ] WB5.5 [Claude] Baby forms as life stages (W9/W10, approved by Evan 2026-10-09 with the proposal's defaults; docs/proposals/creature-growth.md "Evan's answers"): part 1 eggs hatch as babies, care, growing up; part 2 elders and care-shaped potential; part 3 lost hatchlings.
- [x] EVO-1 [Wildbond & Starfall Dev Lead] (merged: #366, 9cc9788, follow-up #370, d82363f, 2026-10-14) Starters as three-stage lines: three middle species (middle at 16, final at 36), old saves grandfathered. The follow-up converts old saves and clears battle sprites off the HP panel.
- [x] WB5.6 [ChatGPT] (merged: #368, 8d6886a, 2026-10-14, 189 species) Catalogue batch 3 and 4 (12-15 creatures each, data and lore).
- [ ] WB5.7 [Claude] Fishing at Saltmarsh (from docs/proposals/new-game-ideas.md, scored 16/18; added 2026-10-09).

**WB-M6: version 2.0, ready for everyone.**
- [x] WB-PREVIEW [any] **Done 2026-10-10:** merged and deployed; all 14 main suites pass, exact committed pack passed 55 browser checks with 27 captures and synthetic pre-WD3 saves, and all four live-file hashes match the reviewed build. (merged: [PR #132](https://github.com/ecbarish/idle-arcade/pull/132), Adam / abarish-dev, 2026-10-10, `guest/wildbond-preview-integration`) Refresh the `play/wildbond` pack to include WD3, WD4a, WB5.1 and the UI fixes. Scope: `play/wildbond`, release/guide notes and verification screenshots. Done when the full tests pass and the web build is verified playable.
- [x] WB6.1 [Claude] Phone controls (WG10). **Done 2026-10-09:** named actions in `controls.gd`, the phone pad in `touch_pad.gd`, gamepads. Start by moving every key to named Input Map actions
  (docs/learning/godot-practices.md rule 2), so on-screen buttons, a gamepad and rebinding all come free.
- [x] WB6.2 [Claude] **Done 2026-10-09** (`settings.gd`, the book's Settings page). Settings in the game window (sound, music, text size,
  battle speed). Start with Music, Ambience and Effects sound buses (godot-practices.md rule 3).
- [x] WB6.2b [Claude] **Done 2026-10-09** (`turn_card.gd`; renamed from a clashing WB6.3). A phone held upright gets a "Turn your phone sideways" card and the game holds still (Playtester, PR #111). Learned: with `canvas_items` stretch and `keep` aspect, portrait leaves a thin strip, so no portrait layout is worth building; pausing the tree with the card set to `PROCESS_MODE_ALWAYS` freezes battles and walks cleanly.
- [ ] WB6.3 [Claude] Import a browser Wildbond save into the new version.
- [x] WB6.4 [any] A Wildbond guide (first steps, the element chart, the ranch), now that systems are settling. (merged: PR #127, 2026-10-09)
- [ ] WB6.5 [Claude] A Wildbond trailer and store-style page; Windows build and web build published.
- [ ] WB6.6 blocked: needs Evan (what "launch" means; START-HERE question 1).

**WB-M7 (later): first person.** WG11: a 3D view generated from the same maps (docs/proposals/depth-and-first-person.md).

### Starfall (Godot): the village
- [x] SF-WEB-BOOT [any] (checked 2026-10-12, Claude lane S: not reproducible after the rename settled. The live play/starfall/ and play/wildbond/ index.pck, index.wasm and index.js are byte-identical to the committed files (SHA-256), and Starfall boots to the town on desktop and at phone size (375x812) at the new address. No fix needed; the stall was the Pages switchover serving stale copies.) Bug (Flint round 3, 2026-10-12 21:02; the same family as the Wildbond live check: on 2026-10-12 21:39 UTC `tools/wildbond-preview-live.py` found the live play/wildbond/index.pck still different from the committed pack, unchanged since aa01a07, after 15 minutes, so the Pages copies of the large preview files may be stale since the rename; check both previews): the hall's "Play the preview" link to /generations/play/starfall/ stuck at about 90% loading across two loads after the rename. Reproduce at the new address; check the service worker, cached paths and the verifier's pinned address; fix and republish so it boots on desktop and phone.
- [x] SG-N1 [any] (done: Codex, PR #264, merged 2026-10-13 as v1.0.1) Starfall Guild (the browser classic), fixes only (Evan 2026-10-12: its best loops move into the Godot village, SF-GUILD below): something to do during the 8-second rest after a wipe, and the Ledger's time played counts correctly. Files: games/starfall-guild/. Old saves load.
- [ ] SF-GUILD [any; plan first, then Godot] (SF-GUILD1 done: Claude, cloud session for Evan, 2026-10-14, [PR #360](https://github.com/ecbarish/generations/pull/360): the map, docs/plans/starfall-guild-fold.md, and the first loop, a press-or-hold call halfway through each job; not published. Next loops follow the map's order) Fold Starfall Guild's best loops into the Godot village (Evan picked this 2026-10-12 over developing the browser game). Step 1: a one-page map, docs/plans/starfall-guild-fold.md, of which Guild loops land where in this path (build, upgrade and push; boss walls; relics; prestige seasons as the season and festival; the Staff "they join because of what you've done" rule as SF hires). It must include Flint's two asks: one tactical call during a fight, and an earned hire early enough to feel in the first five-minute session. Step 2: one ticket per loop in this section, in the path's order. Play, not watch: no loop that plays itself. Files: docs/plans/ first, then starfall-godot/.
- [ ] SF-GUILD2 [Wildbond & Starfall Dev Lead] An early earned hire (docs/plans/starfall-guild-fold.md, Flint round 3 note 3): measure New Game to the first hire (Bryn after ten meals by hand today) and bring it inside the first five-minute session, still earned by doing the job by hand first. Files: starfall-godot/ (hire and inn scripts, data), starfall-godot/tests/. Done when the first hire lands within five minutes of a normal first session (before and after times in the PR), it still needs the job done by hand first, old saves load, and all checks pass.

- [x] SF-MOBILE-FIT [any] (merged: [PR #221](https://github.com/ecbarish/idle-arcade/pull/221), `1a37f695`, Codex for Adam / abarish-dev, 2026-10-12; final 1,429 browser checks / 136 captures and all 19 suites passed) Fix phone letterboxing with mobile fractional aspect-fit; retain desktop integer scaling, camera, controls and saves. Files: starfall-godot/ scaling/tests, scoped tools/ and CI harness, evidence/session notes. Done when rendered portrait/landscape, rotation/repeated resize, touch/text and desktop checks pass. Source merged after Adam approved publication; exact preview tracked in SF-MOBILE-PREVIEW.
**SF-M1: the working town (done 2026-10-08).**
- [x] Board, adventurers, the counter and Bryn, plots and Hob, healer,
yard, smithy and Garrick, apothecary and prices, ranks and newcomers, music, detail, web preview.

**SF-M2: people and stakes.**
- [x] SF2.1 [Claude] Members' stories (SV1): done 2026-10-08 (two beats each for Aki, Ren and Yuna; data/stories.json).
- [x] SF2.2 [Claude] Failing and excelling, visible (SV3). *Done 2026-10-09: each evening judges the day (good: two jobs done, none gone badly, nobody left hungry; hard: more failed than done, or two left hungry). Someone at rock bottom packs up and leaves, and comes back on a good run; two good days hang bunting and add a notice to the board, two hard days take one away; three good days bring rarer travellers (Mirelle, a mage; Tobin, a thief). Still open from SV3: a place that closes when run badly (comes with SF2.3, the tavern).*
- [x] SF2.3 [Claude] The tavern you serve at, and placement that matters a little (SV4). *Done 2026-10-09: a new building; adventurers with savings come in the evening; you pour (stop in the gold band: a tip and better spirits); Tamsin asks for the tap after six pours (8 a day); left unserved two evenings it shuts until you open it (the last piece of SV3); near the inn drinks lift spirits more, a smithy beside the yard makes training count double, and Hob says so on his plans.*
- [x] SF2.4 [ChatGPT] (T52 merged and applied to starfall-godot/data/stories.json 2026-10-09: six members, three beats each; was: writing handoff, integration pending) Story text for SF2.1 (the system is built; extend `starfall-godot/data/stories.json`: arcs for Kaito, Hana and Sora, and a third beat for Aki, Ren and Yuna; keep its format and the four traits): three short arcs per adventurer (choices that can go either way), in a
  data file Claude wires in (`starfall-godot/data/stories.json`; ChatGPT may write that one data file).
- [x] ART-SF-1 [any] ([PR #134](https://github.com/ecbarish/idle-arcade/pull/134), Adam / abarish-dev, merged 2026-10-10; art-direction sign-off waived by Adam, art thread may follow up) Starfall frontier ground: 16 px moss variants, joining mud roads, packed-earth square and stone footing; palette-only atlas plus scale/contact patch; art review before SF2.6 integration.
- [x] ART-SF-2 [any] ([PR #135](https://github.com/ecbarish/idle-arcade/pull/135), Adam / abarish-dev, merged 2026-10-10; art-direction sign-off waived by Adam, art thread may follow up) Frontier palisade, open/shut gate and lit/unlit watchtower; approved palette, footprint metadata and scale contact sheet; art review before SF2.6 integration.
- [x] ART-SF-3 [any] ([PR #136](https://github.com/ecbarish/idle-arcade/pull/136), Adam / abarish-dev, merged 2026-10-10; art-direction sign-off waived by Adam, art thread may follow up) Pine edge: three pine sizes, stumps, ferns and rocks; palette-only pines.png and sideways-tiling forest_edge.png, footprint metadata and contact scene behind ART-SF-2 palisade; art review before integration.
- [x] ART-SF-4 [any] ([PR #139](https://github.com/ecbarish/idle-arcade/pull/139), Adam / abarish-dev, merged 2026-10-10; art-direction sign-off waived by Adam, art thread may follow up) Guild Hall 96×80 and Inn 64×80: original log walls and shake roofs, banner/sign, lit and unlit windows, footprint metadata and contact scene; art review before SF2.6 integration.
- [x] ART-SF-5 [any] ([PR #144](https://github.com/ecbarish/idle-arcade/pull/144), Adam / abarish-dev, merged 2026-10-10; art-direction sign-off waived by Adam, art thread may follow up) Smithy, apothecary, healer and tavern, plus well, job board and training yard; original palette art, silhouette/contact review and footprint metadata; no integration.
- [x] ART-SF-7 [any] (Grok for Adam / abarish-dev, [PR #162](https://github.com/ecbarish/idle-arcade/pull/162) merged 2026-10-10; score 13/21: fun 1, Evan 2, friends 2, focus 2, cheap 3) SF2.6 follow-ups: a side-on west-wall gate picture in ART-SF-2's style, wired in place of the gap; smithy and tavern pictures redrawn 2 tiles wide to fit their plots, footprints matching (4-wide originals kept). Files: tools/art/, starfall-godot/assets/env/frontier/, starfall-godot/scripts/main.gd, tests. Done when: art --check passes; gate and fitted buildings in game; every door/plot reachable; screenshots.
- [x] SF2.6 [Claude] Its own place (GR-5): a frontier stockade look and road layout instead of Larkhaven's; a map
  that scrolls. (Grok for Adam / abarish-dev, H4; [PR #157](https://github.com/ecbarish/idle-arcade/pull/157) merged 2026-10-10; follow-ups all done 2026-10-10: west gate and fitted smithy/tavern in ART-SF-7 #162, evening tint and yard footprint #165, play/starfall rebuilt #166) Before SF3.1. *The look is set (2026-10-09): docs/art/starfall.md (palette, sizes, footprints, mock-up); the
- [x] Art review of ART-SF-1 to 7 and SF2.6 (Art direction thread, 2026-10-11): passed. In the game Starfall now reads as a
  log-walled frontier town and can't be mistaken for Larkhaven (the GR-5 check); the pieces keep the palette, the shake
  roofs, the sizes and distinct silhouettes. Fixed in review: the food counter's awning and wood moved onto Starfall's
  palette; and, after Evan spotted it, the hall's and inn's doors now sit centred on their map tile (so the inn's path
  meets the door) and stand on a plank step to the ground instead of floating on the stone base. Follow-ups: ART-SF-8 and
  SF2.6c below.
- [x] ART-SF-8 [any] (done: Grok for Adam / abarish-dev, 2026-10-13, H3, PR #323; 278 Starfall checks; before/after in docs/playtests/art-sf-8/) Dress the square and roads: the square is one plain packed-earth rectangle. Add worn ruts and
  puddles, grass tufts along the edges, a bench and a hitching post, and place ART-SF-6's barrels, crates and firewood
  by the buildings that would use them (inn, tavern, smithy). Pictures in `starfall-godot/assets/env/frontier/`,
  placement in main.gd. Also give the apothecary, healer and tavern doors a step down to the ground, as the
  hall and inn now have (Evan saw the inn's door floating above its stone base on 2026-10-11; fixed for those two in
  tools/art/starfall_hall_inn.py). Done when the opening screenshot reads lived-in, every building is still reachable, and the
  Starfall checks pass.
- [x] SF2.6c [any] (merged 2026-10-11: [PR #200](https://github.com/ecbarish/idle-arcade/pull/200), Codex for Adam / abarish-dev; full roofs, 227 native checks, 32 rendered captures and 501 layout checks) Open on the town's best side: on day one the camera cuts off the Guild Hall's and the inn's roofs
  and banner, the most recognisable parts. Start the player (or the camera) so both buildings show whole. Also delete
  the unused Ninja Adventure tiles in `starfall-godot/assets/env/` (house.png, nature.png, floor.png and their .import
  files; nothing loads them) and update CREDITS.md (the pack's music and sounds stay). Done when a day-one screenshot
  shows both roofs and the checks pass.
- [x] MAP-AUDIT [any] (claimed: Adam / abarish-dev, 2026-10-10) Audit current Wildbond/Starfall map and interior reachability, entrance occlusion and scene furnishing; reproduce findings and file fix tickets; no game edits. (merged: PR #147; rendered follow-up MAP-AUDIT-150 is draft #176; ticked 2026-10-11 by lane P)
- [x] ART-SF-6 [any] ([PR #148](https://github.com/ecbarish/idle-arcade/pull/148), Adam / abarish-dev, merged 2026-10-11) Loose props: barrel, crate, firewood, lit/unlit lantern, 2×1 cart, bunting and a 48×48 staked plot on props.png; footprint metadata and a contact scene on ART-SF-1 ground; art review before integration.
- [x] WB-ROOF-149 [any] (claimed: Adam / abarish-dev, 2026-10-10) Fix #149: tap routes avoid roof collision while preserving doors and NPC avoidance; wildbond-godot/scripts/main.gd and native tests; done when both witnessed taps and existing transition checks pass. (merged: PR #154; ticked 2026-10-11 by lane P)
- [x] SF2.7 [Claude] See the wilds sooner (GR-7): a small walkable stretch past the gate (an early piece of SF4.1). (claimed: Grok for Adam / abarish-dev, 2026-10-11, guest/starfall-wilds-sooner, H5 part 1) Built in #174: a 26×18 stretch west of the gate on the town's grid (x -26 to -1); SF4.1 can extend it west or add camps there. Merged 2026-10-11 (`9c48e64`); play/starfall/ rebuilt to include it.
- [x] SF2.8 [Claude] Something by hand every day (GR-8): the next jobs to master, then hire. (claimed: Grok for Adam / abarish-dev, 2026-10-11, guest/starfall-by-hand, H5 part 2) Merged 2026-10-11 ([PR #179](https://github.com/ecbarish/idle-arcade/pull/179), `76f73aa`): the gate watch (lantern round, then Odo, who walks it) and sparring at the yard (then Ilse). Darkness consequences are a separate follow-up.
- [x] SF2.5 [Claude] Hire the apothecary's apprentice once you've brewed enough (the same "master it, then hire" rule). *Done 2026-10-09: after four batches by hand Fen walks in; six coins a day; brews whenever there are herbs and room on the shelf; leaves the pot to you if unpaid.*

**SF-M2b: progression (Adam, 2026-10-11; docs/proposals/starfall-progression.md).** Rule for all of these: no
mandatory daily chores; convenience is earned. Files for each: `starfall-godot/scripts/main.gd`,
`starfall-godot/tests/run_tests.gd` (plus `data/stories.json` where noted); new save fields default for old saves.
- [x] SF2.9 [any] Darkness, step 1 (docs/proposals/starfall-darkness.md, Adam's decision): on a night with an unlit wall
  section, sometimes (start ~1 in 3) a small creature is seen slipping in through that section to the nearest building.
  At most one incident in the whole town per night, and each lantern protects only its own section. Next morning there's
  a mess with tracks to the wall, a report line, and that building works a little worse until it's cleared with one E
  press or by Odo on his round. Gone after a day; no combat. Done when: all lit means no incident; a dark section is the
  only way in; there's never more than one a night; a hand clear and an Odo clear both work; old saves load; screenshot.
  Score 14/21 (fun 2, Evan 2, friends 2, focus 2, cheap 2). (done 2026-10-12, Grok for Adam / abarish-dev, PR #224: a creek slime, chance 1 in 3, late evening (86% of the day); mess costs 2 coins a sale; 264 checks, 17 new)
- [x] SF2.10 [any] (done 2026-10-11, Claude, PR #195: goals() and control_hint() in main.gd; 230 checks) In-world goal guidance: a goal line under the status bar naming the nearest unlock with its count, in
  the world's words ("Walk the walls 2 more nights: someone might ask to keep watch"; "4 more jobs: Starfall becomes a
  Village"), plus a "Next" list of the three nearest unlocks (ranks, hires, plots, story beats). Done when: it always shows
  a reachable next step, updates as counts change, works on phone width, and is checked for each kind of unlock. Fixes the
  COMMS lane S "no goal line" note. Score 18/21 (fun 2, Evan 3, friends 3, focus 2, cheap 3).
- [ ] SF2.11 [any] (counter done 2026-10-12, Claude lane S, branch claude/sf2.11-counter-mastery: meals by hand earn Kitchen Hand at 10 (serve from beside the counter), Cook at 25 (a recipe slate: hearty stew lifts spirits, healing broth mends), Head Cook at 50 (the big two-handled pot serves two in line); plank, slate and pot drawn on the counter; Bryn stays plain; 272 checks. Next: the forge, pot, tap, lantern round and yard) Station mastery ranks: counter, forge, pot, tap, lantern round and yard each earn named ranks at 10/25/50
  uses. Rank 1 widens the gold band (less fiddly), rank 2 adds a technique with a choice (for example a stew that lifts
  spirits or one that heals), and rank 3 brings a tool drawn in the world that makes one press do more. Start with the
  counter; one station per PR is fine. Done when: ranks save, each rank visibly changes the station, and hand play stays
  better than the hire. Score 18/21 (fun 3, Evan 3, friends 2, focus 2, cheap 2).
- [ ] SF2.12 [any] The hire works at your rank: Bryn, Garrick, Fen, Tamsin, Odo and Ilse work at the mastery rank you
  reached before hiring them, so mastering first makes the helper better. Done when it's checked per hire. Score 14/21
  (fun 2, Evan 2, friends 1, focus 2, cheap 3).
- [x] SF2.13 [any] (done: Grok for Adam / abarish-dev, 2026-10-13, H7, PR #325; marks over their head while you stand near, after_trust 2 and 4 on beats 2 and 3, perk at 6 (doesn't stack with bold); 297 Starfall checks; not published) Trust per adventurer: +1 for each thing you do by hand for them (a meal, a pour, a piece forged, a
  bout, a story talk), shown as marks on their card. It gates later story beats (with jobs) and gives one high-trust perk
  (they'll take a job a step harder for you). Uses `data/stories.json`. Done when: trust saves and defaults to 0, and
  shows; gating and the perk are checked. Score 17/21 (fun 2, Evan 3, friends 2, focus 2, cheap 3).
- [ ] SF2.14 [any] Veteran requests: at level 5 or 10 jobs done, a few danger-5 requests on the board ask for that
  adventurer by name and only they can take them. Each pays more and leaves a visible change in town (a trophy over the
  hall door, a new carter route). Done when: early recruits get them, a higher-level newcomer can't take theirs, and the
  change shows. Score 17/21 (fun 3, Evan 3, friends 1, focus 2, cheap 2).
- [ ] SF2.15 [any] Signature moves through training and equipment: at a level, with training-yard bouts and good gear, each
  member learns one move tied to their class and story (Aki's guard halves the hurt on a failed job; Ren's map shortens
  trips). It's shown on their card and announced in town. Done when: each starting member has one, it's earned (not given),
  and it's checked. Score 15/21 (fun 2, Evan 3, friends 1, focus 2, cheap 2).
- [ ] SF2.16 [any] Recruit specialities, not bigger numbers: each job lists who suits it ("good for: archers, thieves"),
  and suited adventurers get better odds. Newcomers and visitors arrive near your team's middle level, never above your
  best, each bringing a trait. Done when: every class suits at least one job, favourites stay best at their own work,
  and relationships (trust, stories) are untouched by new arrivals. Score 15/21 (fun 2, Evan 2, friends 2, focus 2,
  cheap 3).
- [x] SF2.17 [any] Day-pacing check: measure the 150-second day in normal play (hand jobs per day, chores vs bonuses,
  time to each hire and rank, active vs idle income) with a scripted player; recommendations only, no numbers changed.
  (Grok for Adam / abarish-dev, 2026-10-11: docs/measurements/starfall-day-pacing.md.) Score 14/21 (fun 2, Evan 2,
  friends 2, focus 2, cheap 2).
- [x] SF2.18 [any] No mandatory chores (SF2.17's findings; Adam: "Do your suggestions"): if nobody cooks, adventurers
  help themselves from a stew pot (fed, half the coins, no lift in spirits, so cooking by hand stays better); at dusk
  you light a wall lantern just by walking within 4 tiles (the round is a ~15 to 20 s loop off the road; Odo still walks
  it; still optional); a bout or drill past full spirits becomes practice xp (hand > Ilse); adventurers read the board
  from anywhere along its front, so standing there doesn't block them. Files: `starfall-godot/scripts/main.gd`,
  `tests/run_tests.gd`. Done when: checked; pacing re-measured. (Claimed: Grok for Adam / abarish-dev,
  guest/starfall-no-chores; merged 2026-10-11, [#187](https://github.com/ecbarish/idle-arcade/pull/187), `a0e4787`.) Score 16/21 (fun 2, Evan 2, friends 2, focus 3, cheap 3).
- [x] SF2.19 [any] **Dropped, not built (Adam, 2026-10-11):** the pacing re-measure showed extra pins saved ~3 s a day but kept adventurers away from the tavern and smithy (Tamsin 0 of 6, Garrick 3 of 6) and lowered spirits; draft #189 closed. See docs/measurements/starfall-day-pacing.md. Was: Earned board help: more pin slots as the town grows (an earned unlock, not a purchase), shown in the
  board view. Files: as SF2.18. Done when: the slots grow with rank, old saves load, checked, pacing re-measured. Score
  15/21 (fun 2, Evan 2, friends 2, focus 2, cheap 3).
- [x] SF2.20 [any] (Grok for Adam / abarish-dev; merged 2026-10-11, [#190](https://github.com/ecbarish/idle-arcade/pull/190), `fa44b3a`: Tamsin also asks after 3 evenings you kept the tap) Tamsin easier to reach: her offer comes from tavern evenings you keep, not only drinks poured, so a
  quiet tavern still gets there. Files: as SF2.18. Done when: checked, pacing re-measured. Score 14/21 (fun 2, Evan 2,
  friends 1, focus 2, cheap 3).

**SF-M3: seasons.**
- [ ] SF3.1 [Claude] Seasons as chapters (SV2), the first one ending in a festival.
- [ ] SF3.2 [Claude] Travelling merchants and visitors from other games (the shared universe, lightly).
- [x] SF3.3 [ChatGPT] T57, merged 2026-10-09 (PR #84): four seasonal chapters in docs/plans/starfall-village.md, each with threat/festival/newcomer, recoverable choices and shared-calendar boundaries; docs only, Claude implements.

- [ ] SF3.4 [Claude] Festivals in Starfall on the shared calendar (WS1's rules): the square and every building you've
  built decorated for each season's festival (lights and garlands at midwinter), a festival supper at the inn, a
  visitor. Builds on the good-day bunting (SF2.2).
**SF-M4: the wilds.**
- [ ] SF4.1 [Claude] Expeditions you can see (SV5): the wilds past the gate, camps, catalogue
creatures as monsters. Built as first-person grid delves (docs/proposals/new-game-ideas.md), one-PR prototype first.
- [ ] SF4.2 [Claude] Phone controls and settings; Starfall guide [any]; trailer.

### Realmbound (browser)
- [x] RB-N1 [any] (merged as Realmbound v1.9.1 in PR #253) (ready: Codex, PR #253, 2026-10-12; loot/resource/dialogue fixes; all 20 suites and 48 browser checks pass; overlapping quests remain RB1.12) Realmbound newcomer snags (Flint's playtest round 2, docs/COMMS.md 2026-10-12 20:52): loot never vanishes unseen (a corpse's loot stays until taken, or the window says plainly what was left and where it went); pressing an ability without energy says "Not enough energy"; the dialogue Continue button works by click and tap, not only Enter. Then, as RB1.12 work: two or three quests at once in Thornvale. Files: games/realmbound/. Done when tests/run.html passes and old saves load.
- [x] RB1.9 [ChatGPT] Third-person 3D inn trial (built: Codex, PR #159, 2026-10-10; awaiting review). Evan asked for a modern Pokemon-like third-person presentation. Isolated prototype, original procedural stylized models, honest character/furniture dimensions, walk/orbit/collision, a substantial contained hearth, real light/shadow geometry, phone and ultrawide checks. Files: experiments/realmbound-3d/, tests/realmbound-3d.cjs, docs/proposals/realmbound-3d.md, screenshots and handoff. No production renderer, saves, shared engines or Godot edits. Score 18/21 (Fun 3x2, Heart 3x2, Notice 3, Focus 2, Cheap 1). (merged: PR #159; ticked 2026-10-11 by lane P)

**RB-M1: in the game window.**
- [x] Part 1 (T38).
- [x] RB1.2 [ChatGPT] Part 2: pages become places (T41). (merged 2026-10-09)
- [x] RB1.3 [ChatGPT] (done, merged 2026-10-09; T48) Part 3: the road between towns as a walkable stretch at key points (an inn on the road, a
  camp), keeping auto-combat where it already lives.
- [x] RB1.4 [ChatGPT] Phone pass for the new layout (L3 part 2). (built: Codex for Adam / abarish-dev, 2026-10-09, PR #116; awaiting review)
- [x] RB1.6 [ChatGPT] (ready: PR #141, Codex, 2026-10-10) Readable ability names (PLAYTEST pass 1): action-bar styles and tests/realmbound-phone.js only; full names in a body font, phone-safe wrapping and visible shortcuts/cooldowns; screenshots at 375, 1280 and 3440, all suites pass. Score 17/21 (fun 2x2, heart 2x2, friends 3, focus 3, cheap 3). (merged: PR #141; ticked 2026-10-11 by lane P)
- [x] RB1.5 [ChatGPT] (built: Codex, 2026-10-09, PR #98; awaiting review) Wait for the player (GR-10, a bug): autopilot must not take over during the first dialogue
  (games/realmbound/js/13-world-ui.js:95); fix the stray blocks in the sky. Do first.

- [x] RB1.7 [ChatGPT] Realmbound inn furnishing pass (built: Codex, 2026-10-10, PR #153; awaiting review). Files: games/realmbound/js/22-hub-layouts.js, 22-town.js, tests/realmbound-inn-layout.js and run.html, screenshots and task notes. Done when sleeping, dining and hearth spaces are distinct; the entrance, Keeper and exit work by tap and keyboard; existing services and saves stay intact. Score: 17/21 (Fun now 2x2, Evan's heart 3x2, Friends notice 2, Moves the focus 2, Cheap 3). (merged: PR #153; ticked 2026-10-11 by lane P)
- [x] RB1.8 [ChatGPT] Facing people and object-shaped shadows (built: Codex, 2026-10-10, PR #155; awaiting review). Evan's request: four-direction walking sprites and quieter foot contact shadows so existing silhouette casts read clearly, including Low quality. Files: browser Realmbound scene/town/road/light code, focused rendering checks and their run.html hookup, screenshots and notes; no shared engine or Godot edits, saves or versions. Done when walking away hides the face, NPC facing is respected, sun/lamp casts retain object shapes, side walls join as planes, a substantial flame fits a generous hearth opening, room framing is a little steeper, and all suites pass. Score 19/21 (Fun 3x2, Evan's heart 3x2, Friends notice 3, Focus 2, Cheap 2). (merged: PR #155; ticked 2026-10-11 by lane P)

**RB-M1b: the first hour is fun (Evan, 2026-10-12, before anything later-game).** Evan: "we don't have any players yet and we need the game to be worth playing and fun before we push anything later game." Take these in order; RB-M2 and RB-M3 below are parked until a newcomer scores Realmbound 17+.
- [ ] RB1.10 [any] Newcomer playtest of the first hour (character creation to about level 10), played actively with no time away, scored with docs/PLAYTEST.md. Write docs/playtests/realmbound-first-hour.md (what was fun, what was dull or confusing, with screenshots) and add the top five fixes below as RB1.12a-e lines. Done when the note and the lines are merged. Score 17/21.
- [x] RB1.11 [any] (v1.9.0, PR #218, merged 2026-10-12) Play, not watch (GOALS.md rule, Evan 2026-10-12): the autopilot no longer takes over when the player pauses (`aiOn()` in games/realmbound/js/11-combat.js:46 after 15 idle seconds); Auto becomes an earned toggle only for zones the hero has out-levelled; time away gives rested XP at the inn instead of kills and loot ("kept hunting while you were away", 13-world-ui.js:174, `offline()` in 10-state.js). Keep the conveniences (auto-loot, the repair trip, batch selling). Old saves load. Done when tests/run.html passes and a newcomer's first ten minutes never show the hero fighting on its own. Score 18/21.
- [x] RB1.12a [dot / Adam] (published: #283 at 05d39631, 2026-10-13; source passes 21 suites / 9,074 Realmbound checks; final public verification passed) Two or three concurrent Thornvale quests (Cycle 1; Flint round 2, note 3). Preserve existing quest progress/rewards and old saves; readable phone Journal and objective guidance. Files: games/realmbound/, focused tests and evidence. Done when tests/run.html is all-pass and acceptance, simultaneous progress, completion/rewards, reload, cancellation and full slots are verified.
- [ ] RB1.12 [any] The first hour, made fun: the fixes RB1.10 lists, one PR each (expected: fights with something to react to, hits and sounds that land, the first quest chain told by people, a first dungeon before level 10, loot worth opening). Done when the next newcomer playtest scores Realmbound 17+.

**Parked until RB-M1b is done (Evan, 2026-10-12): RB-M2 and RB-M3.**
**RB-M2: what the raid set up.**
- [ ] RB2.1 [ChatGPT] Battlegrounds plan in docs/proposals/ (R3; new system: Evan
approves).
- [ ] RB2.2 [ChatGPT] Second raid tier (R7), data and encounters. (deferred by Evan, 2026-10-11: validate the opening/core loop with players before deeper content)
- [x] RB2.3 [ChatGPT] The catalogue reaches Realmbound (T43). (merged 2026-10-09)

- [x] RB-PLAY1 [ChatGPT] Fresh-character first-session audit: first quest, combat, recovery and reload; immediately useful fixes only. (v1.8.1, PR #214, merged 2026-10-12)

**RB-M3: a living world.**
- [ ] RB3.1 [ChatGPT] Simulated adventurers in the zones (V5 part 1: questing, groups,
asking for help; rules only).
- [ ] RB3.2 [ChatGPT] Camps that grow into villages (V7 part 1).
- [ ] RB3.3 [any]
Realmbound's Godot question answered by Evan, then a plan (START-HERE question 2).

### Diamond Manager (browser; the baseball game, reworked 2026-10-09)
- [x] DM-N1a [any] Diamond Manager newcomer bugs (done: Codex, PR #261, merged 2026-10-13 as v0.8.2): post-game F opens the office without losing the result; starting a bench batter replaces the matching position when available, with an explicit replacement label. Preserve saves and the existing game loop. Verify the hall record fix from AR2.15; no new streaks or content. Files: games/diamond-manager/, tests/diamond-manager-checks.js, docs/playtests/. Reported-playtest bugs exception under STUDIO-PLAN.
- [x] DM-N1b [any] Training Rooms feedback (done: Codex, PR #269, merged 2026-10-13 as v0.8.3): show named roster/farm players' existing winter ceiling effects at current/next room levels, respecting scout uncertainty, age limits and the ceiling cap. Preview only; no balance, RNG or save changes. Files: games/diamond-manager/, tests/diamond-manager-checks.js, docs/playtests/. Fixes Flint's reported invisible upgrade effects; larger DM-N1 systems wait for the studio cycle.
- [ ] DM-N1c [ChatGPT] Hot and cold streaks (ready: Codex, Evan, PR #310, 2026-10-13): last five qualifying appearances, temporary rating adjustment capped at three; named form and next-game ratings in the in-game roster and Iona's result note. Never alter permanent ratings, contracts or ceilings; deterministic, save-safe. Files: games/diamond-manager/, tests/diamond-manager-checks.js, docs/playtests/.
- [ ] DM-N1 [any] Diamond Manager, numbers you watch climb (Flint round 3, COMMS 2026-10-12 21:02): upgrades show their effect on named players ("Cy Moss: ceiling 60 to 62"); hot and cold streaks so ratings move game to game; one or two dugout calls with visible risk (steal, hit-and-run, intentional walk, pinch hitter). Bugs first: F does nothing on the post-game screen until "Hear from Iona" is clicked; signing a left fielder showed two left fielders in the lineup; the hall card kept a stale 0-1 record after two games.
Evan, 2026-10-09: the batting game was too hard to read and to hit; make it one you manage (ratings, trades,
contracts, hiring, stadium upgrades, watching games) and plan a Retro Bowl-style football game. Full plan and the
deliverables with their details: [plans/sports-management.md](plans/sports-management.md). The old DC2-DC4 career
deliverables are retired; the batting prototype stays in games/diamond-career/ off the shelf.
- [x] DM1 [Claude] The first playable season (v0.1.0, PR #110).
- [x] DM2 [any] Playability pass (docs/playtests/diamond-manager-1.md). - [x] DM-B [Claude] Choices matter (v0.2.0).
- [x] DM3 [any] Hiring coaches (v0.6.0, PR #196, merged 2026-10-12). - [x] DM4 [any] Player morale and stories (v0.7.0, PR #207, merged 2026-10-12; was ready: Codex, 2026-10-11; stacked after #196) - [ ] DM5 [any] The ballpark you see grow.
- [x] DC-N [any] (merged as Diamond Career v0.4.2 in PR #247, 2026-10-12; remaining X1 issues #228–#230 fixed; all 20 suites pass) Diamond Career, the way in (Flint's playtest, 2026-10-12; check X1's issues #227-#230 first and skip what they already cover): a "Play" button on the calendar's game day instead of only through talking to Iona; a wider timing window in game 1 so a newcomer gets a hit with their own bat; long lines in conversations wrap instead of being cut off. Nice to have: "Practice contact" becomes a small timing game (play, not watch). Files: games/diamond-career/.
- [x] DM6 [Claude] The draft and player development (v0.3.0). - [x] DM-T [Claude] Trade finder (v0.4.0). - [x] DM-G [Claude] Pitch-by-pitch game, in-game moves, box scores, stats (v0.5.0). - [x] DM-B2 [any] Keep the league in balance over many seasons (v0.7.1, PR #208, merged 2026-10-12). - [x] DM7 [any] Records and history (v0.8.0, PR #209, merged 2026-10-12). - [ ] DM8 [later] Step into the big moment.

### Lantern Bowl (browser; American football in the Retro Bowl spirit, our own code and art)
Evan said yes 2026-10-09. Plan: [plans/sports-management.md](plans/sports-management.md) "Game 2".
- [x] #359 [Side Games Dev Lead] (merged: #369, cd491bd, 2026-10-14, Lantern Bowl v0.1.4) Running matters, and Millrace's drives play on the field.
- [x] 371-5a [Side Games Dev Lead] (merged: #383, 253c545, 2026-10-14, Lantern Bowl v0.1.5) Side-on field, eleven a side, and carries with a real spread. Part of #371.
- [ ] LB0 [any] One-page pitch with three mock screens. - [ ] LB1 [any] shared/sports-office.js from Diamond Manager.
- [ ] LB2 [any] One drive, playable. - [ ] LB3 [any] One full game. - [ ] LB4 [any] Season and office. - [ ] LB5 [any] Playability pass.

### Lantern Ice (hockey, after football; Evan 2026-10-09: baseball, football and hockey are his favourites, all sports eventually)
Plan: [plans/sports-management.md](plans/sports-management.md) "Game 3". Reuses shared/sports-office.js (LB1).
- [ ] HK0 [any] Pitch. - [ ] HK1 [any] Hockey simulation. - [ ] HK2 [any] Shootout moment. - [ ] HK3 [any] Season, lines, office. - [ ] HK4 [any] Playability pass.

### Otherworld (browser)
- [x] OW-N1 [Grok / Adam] (merged: #378, 76017d5, 2026-10-14, Otherworld v0.4.1) Otherworld newcomer snags (Flint round 2): a visible "Memories carried" ledger so players can plan unlocks across runs; at least two choices open at every beat (no single-choice click-through); the hall blurb calls it a story life sim, not idle management. Files: games/otherworld/, index.html (claimed in COMMS first, per the touch rule).
**OW-M1: three lives (done through v0.3.0).**
- [x] The Between, Asterhold with Lanthorn, Hearthmere, the Ashen Throne.
**OW-M2: memories and a systemic world.**
- [x] OW1.1 [ChatGPT] (ready: PR #142, Codex, 2026-10-10) Visible Choose a world option in the Between introduction (PLAYTEST pass 1); games/otherworld/js/01-game.js, style.css and existing checks only; uses existing dialogue skip, preserves all choices/memories/saves; phone and desktop screenshots, all suites pass. Score 16/21 (fun 2x2, heart 2x2, friends 3, focus 2, cheap 3). (merged: PR #142; ticked 2026-10-11 by lane P)
- [x] OW2.1 [ChatGPT] Memories that matter across lives (T42). (merged 2026-10-09)
- [ ] OW2.2 [ChatGPT] Skills that grow through use (O1 in docs/plans/otherworld.md).
- [ ] OW2.3 [ChatGPT] People
with wants, grudges and debts that persist across a life, in every world.
- [ ] OW2.4 [ChatGPT] A fourth world
proposal (Evan picks the theme).
**OW-M3: the AI storyteller experiment.**
- [ ] OW3.1 blocked: needs Evan (an AI voicing characters inside the
rules; free local model first, as docs/otherworld-design.md says).

### The arcade (everything shared)

- [x] **CHAR-BROWSER1 [any]**: Make `tests/character-library.cjs` browser selection portable: preserve `CHROME_PATH`, use installed Windows Chrome when present, otherwise Playwright Chromium. Add focused selection regressions and rerun the unchanged three-size character bench plus aggregate. No artwork, game, save or rig changes. Explicit Adam request, 2026-10-13. (implementation complete: dot / Adam, 2026-10-13, [#318](https://github.com/ecbarish/generations/pull/318); Adam authorized merge. 7 focused + 113 bench checks and 22 suites passed on 87e5852; exact refreshed-head checks and final merge status are recorded in PR Tower.)
- [x] AR2.16 [any] Hall blurbs that match the games (Flint round 2): Lighthouse Watch is arcade action, not automation; Otherworld is a story life sim, not idle management. Files: index.html, launcher/.
**AR-M1: friends can play (done 2026-10-08).**
- [x] Come Play, previews, trailer, Windows builds.
**AR-M2: polish for everyone.**
- [x] AR-REN [any] Rename Idle Arcade to Generations (Evan decided 2026-10-12; done 2026-10-12, #239, #241, #242, lane P). Site live at https://ecbarish.github.io/generations/; the leftover `ecbarish/idle-arcade` repository forwards every old link to the same page and removes the old offline cache, and its "Check the old address forwards" run passed with a save kept. Save keys and Godot `config/name` unchanged (tools/save-names-check.cjs). Left: AR-REN10 below, and the outside places in rename-checklist.md step 9.
- [ ] AR-REN10 [any] Re-render the trailer and any QR codes with the new address (rename-checklist.md step 10). Files: the trailer tools and promo pages. Done when no shared picture or video shows `idle-arcade`.
- [ ] AR2.14 [any] Play, not watch, across the arcade (GOALS.md rule, Evan 2026-10-12). Audit 2026-10-12 by lane P: Wildbond (Godot and Classic, `AUTOPILOT = false`), Starfall (helpers are delegation), Diamond Manager ("Let Iona finish the game" is a convenience), Otherworld, Little Ranch and the cabinets already follow it; Realmbound is RB1.11. Still to do, one small PR each: (a) the hall's tagline in index.html says "a stable of idle and progression games"; use the new tagline, "Play for the fun. Automate the grind." (decided 2026-10-12); (b) Primordial: its "pool kept growing while you were away" becomes a small welcome-back gift to spend by playing (index.html `offline()`); (c) any AI touching a game checks its own work against the rule. Classic editions (Wildbond Classic, Starfall Guild Classic) stay as they were, as archives. Score 15/21.
- [x] AR2.1 [ChatGPT] Accessibility (T44, L10). (merged 2026-10-09)
- [x] AR2.2 [ChatGPT] (done, merged 2026-10-09; T46) The
launcher shows the Godot previews as games (cards, covers, links).
- [ ] AR2.3 [any] Game boxes (V3).
- [x] AR2.4 [any] (claimed: Adam / abarish-dev, 2026-10-10) Link and image check across guides/ and playtest.html (X2 / Lane D3); fix broken destinations and fragments, verify pictures, and record exact-source results. Checked: 140 local references, 22 images and 14 browser views pass; evidence / review in PR #158. (merged: PR #158; ticked 2026-10-11 by lane P)
- [ ] AR2.5 [ChatGPT] Studio text
browser (E4). (claimed: Grok, 2026-10-09, grok/studio-text-browser; Lane C task C1)
- [x] AR2.6 [Claude] Craft review and learning notes (docs/learning/): done 2026-10-09 (safe saves, smaller web pack,
  committed import settings, line-ending rules, one command for all checks, checks on GitHub).
- [ ] AR2.7 blocked: needs Evan. Build the web previews on GitHub instead of committing them (docs/learning/web-and-shipping.md;
  default: keep committing packs at milestones only). Needs Evan to set Pages' source to "GitHub Actions".
- [x] AR2.9 [Claude] Sound effects and feeling bubbles in both Godot games: done 2026-10-09 (`scripts/sfx.gd`, sounds
  named by meaning, N toggles them, checks for every sound; Starfall's emotes over heads, Wildbond's "!" when spotted;
  the asset guide docs/learning/assets.md and the arcade palette).
- [ ] AR2.10 [Claude] Our own signature sounds, the first original assets (docs/learning/assets.md "Making our own"):
  a short cry for each Wildbond creature body type, made in jfxr or sfxr and played when it appears and when it
  chooses you; then the arcade's own menu sounds and jingles, replacing the pack's by name. Evan listens before merge.
- [ ] AR2.8 [Claude] Split Wildbond's main.gd as systems are touched (godot-practices.md rule 1): music and ambience
  first, then festivals, interiors, the ranch; one system per commit, checks passing.
- [x] AR2.11 [any] Hearing from players (GR-9): a "Tell us" in every game's settings that opens a prefilled GitHub
  issue; a 10-minute playtest script on Come Play. (built: Grok for Adam / abarish-dev, PR #146, merged 2026-10-10; arcade v1.5.1; Godot previews and Primordial are follow-ups)
- [x] AR2.12 [any] The front door (done 2026-10-09, Claude, PR #109: the hall only, sections by kind, how to play on every card) (GR-12): the hub leads with the Godot games, Starfall Guild and Primordial move to
  Classic, the old homepage vote closes; START-HERE versions corrected (Claude).
**AR-M3: the walk-in arcade and friends.**
- [x] AR2.14 [Claude] Classic versus the new version made obvious; site and guides refreshed at milestones (docs/SITE-AND-GUIDES.md), done 2026-10-11.
- [ ] AR2.13 [any] The hall, upgraded (QUEUE road ahead).
- [x] AR2.15 [any] (merged in PR #249, 2026-10-12; own-save cards and isolated reset, all 20 suites pass) The hall card that shows the wrong game (Flint's playtest, 2026-10-12): the "Diamond Manager" card under Sports showed Diamond Career's progress, and the game it opened called itself Diamond Career. Check which game each sports card opens and whose save it reads; each card opens and shows its own game. Files: launcher/, index.html.
- [ ] AR3.1 [Claude] Walk-in arcade steps 1-2 (V11).
- [ ] AR3.2 [any]
No-server sharing: trade and battle codes, ghost teams (V6 part 1).

### Family games (Evan said yes 2026-10-09; docs/proposals/games-for-everyone.md)
**Little Ranch (browser), a toy for ages 2-4.**
- [x] LR2 [any] Repair interrupted feeding and preserve active play through resize/rotation. Scope: Little Ranch game/test files, isolated read-only browser-review script/workflow, screenshots and brief process notes. Done when repeat/interruption and phone-to-ultrawide checks pass with sound preferences unchanged. Score: 18/21. (v0.1.1 release: [PR #140](https://github.com/ecbarish/idle-arcade/pull/140), Codex for Adam / abarish-dev, 2026-10-10; 49 game checks, 15 Chromium review checks and all 17 current-main suites passed; version-only release metadata is rechecked before merge)
- [x] LR1 [any] The smallest test: one baby creature, three actions (feed, bubbles, peekaboo) and a bedtime
  ending; no reading, no failing, no links or purchases, a grown-up lock. Shares the baby-form drawings W9/W10 needs. (claimed: Grok for Adam / abarish-dev, 2026-10-09, guest/little-ranch)
Next steps, from docs/proposals/little-ranch-next.md (PR #203, 2026-10-11; Evan: "a big hit with my daughter"). Each is one PR on `games/little-ranch/` with checks in `tests/little-ranch.html`, a README changelog line and a "tried with a toddler" note; the toddler rules in games-for-everyone.md hold for every step. Done when the step works on a phone and a tablet with no reading and nothing to fail.
- [x] LR3 [any] (done 2026-10-13, Grok for Adam / abarish-dev, PR #289, v0.8.0; not yet tried with a toddler) The singing flowers: a row of big flowers; tap one and it sings its own note and bobs; the baby dances. (QUEUE road 10)
- [x] LR4 [any] (done 2026-10-13, Grok for Adam / abarish-dev, PR #297, v0.11.0; not yet tried with a toddler) A second friend: a baby Pebblit (or Glowmote) visits some days; both can be fed and bubbled; they nuzzle.
- [x] LR5 [any] (done 2026-10-13, Grok for Adam / abarish-dev, PR #303, v0.12.0; not yet tried with a toddler) Rain and rainbows: tap the cloud for soft rain and puddles to splash; tap the sun for a rainbow. (The sun's rainbow is done in LR13; the rain and puddles are still to do.)
- [x] LR6 [any] (done 2026-10-13, Grok for Adam / abarish-dev, PR #305, v0.13.0; not yet tried with a toddler) The hat basket: tap the basket and the baby tries on the next hat.
- [x] LR7 [any] (done 2026-10-13, Grok for Adam / abarish-dev, PR #313, v0.14.0; not yet tried with a toddler) The bedtime routine: teeth, a drink of water, goodnight to each friend, then the lullaby.
- [x] LR8 [any] (done 2026-10-14, Grok for Adam / abarish-dev, PR #354, v0.15.0; not yet tried with a toddler) Spoken words: names, colours and "night night" in the browser's voice (no microphone; recording a parent's voice needs Evan's yes).
- [x] LR16 [any] (done 2026-10-14, Grok for Adam / abarish-dev, PR #357, v0.16.0; not yet tried with a toddler) The meadow ball (18/21: fun 3×2, heart 2×2, friends 3, focus 2, cheap 3): a big soft ball in the grass; tap it and it rolls, the baby runs over and kicks it; every third kick is one happy thing; nothing to miss. At night a tap only boings. No words to read, nothing saved. Files: `games/little-ranch/`, `tests/little-ranch.html`.
Places inside Little Ranch (a picture-sign at the ranch's edge leads there, the barn picture leads home; never a separate icon on the homepage). **Evan picked the Paint Shed first (2026-10-11)**, then the Little Wagon, then the Snack Kitchen; LR3-LR8 continue alongside.
- [x] LR9 [any] (done 2026-10-13, Grok for Adam / abarish-dev, PR #262, v0.6.0; not yet tried with a toddler) The Paint Shed (16/18, Evan's pick): reached by a paint-drip picture sign; one creature outline, four fat paint pots, tap to fill a part, sparkles when every part is coloured, the painted baby walks out in its colours until bedtime.
- [x] LR10 [any] (done 2026-10-13, Grok for Adam / abarish-dev, PR #290, v0.9.0; not yet tried with a toddler) The Little Wagon (17/18): load two babies, one ride with three things to tap and one colour gate where any car gets a cheer.
- [x] LR11 [any] (done 2026-10-13, Grok for Adam / abarish-dev, PR #293, v0.10.0; not yet tried with a toddler) The Snack Kitchen (17/18): four foods, one bowl, one baby who loves berries and pulls funny faces at the rest.
(The shape puzzle, 14/18, waits until she is 3½ to 4.)
- [x] LR12 [any] Wake-up taps (Adam, 2026-10-11): once the baby is asleep, six taps on it wake it and start a fresh sunny day (the same reset as New visit), with a small wiggle and shrinking zzz on each tap and a happy wake on the sixth; no text, nothing to fail. Files: `games/little-ranch/`, `tests/little-ranch.html`. (Grok for Adam / abarish-dev, PR #210, v0.2.0)
- [x] LR13 [any] Sun surprise (Adam, 2026-10-11): in the daytime, each tap on the sun makes it a little brighter; on the fifth a big rainbow arches over the field, the baby looks up and cheers, and after a few seconds it fades and the count starts again. No words, nothing to fail; at night there's no sun to tap. Files: `games/little-ranch/`, `tests/little-ranch.html`. (Grok for Adam / abarish-dev, PR #211, v0.3.0)
- [x] LR14 [any] The moon's song (Adam, 2026-10-11): at night, while the baby sleeps and the moon is up, each tap on the moon makes it glow a little more with a soft note; on the third it plays the first verse of Twinkle Twinkle Little Star (a public-domain tune, made in code, quiet when sound is off) while the stars twinkle in time. The baby sleeps on with a little smile, moon taps don't count toward the six wake taps, taps during the song just twinkle, and stray taps wear off. No words, nothing to fail. Files: `games/little-ranch/`, `tests/little-ranch.html`. (Grok for Adam / abarish-dev, PR #212, v0.4.0)
- [x] LR15 [any] A cleaner grown-up panel, and app mode (Adam, 2026-10-11, after trying a test Android build): fix the panel buttons that did nothing in the Android WebView ('Back to play', 'Back to the arcade'); redesign the panel (rounded card, drawn icons, one-line labels, a close X, tap outside to close; portrait, landscape and small phones); when the game runs inside the standalone app it shows just Replay, Sound and Exit. The 3 s hold lock stays. Files: `games/little-ranch/`, `tests/little-ranch.html`. (Grok for Adam / abarish-dev, PR #215, v0.5.0)
Six toddler places (Evan, 2026-10-14; docs/proposals/little-ranch-next.md "Six toddler places"), in this order. Shared rules for every place: no words, nothing to fail, no timers, no links or purchases, a 5–10 minute visit, the barn picture goes home, bedtime works from anywhere, taps and drags only. Files: games/little-ranch/, tests/little-ranch.html.
- [x] LR17 [Grok / Adam] (done 2026-10-14, Grok for Adam / abarish-dev, PR #381, v0.17.0; not yet tried with a toddler) **Busy Barn Door**: The barn door has a latch, a doorbell, a light switch, a crank that turns a windmill and a slide bolt. Each gives a big reaction. Once all are touched, the door opens and the baby peeks out (peekaboo). No wrong order. Done when (smallest test): Bell, switch and latch, then the door opens. Each reacts in under 100 ms, and no order can get it stuck. Then one session with the toddler. Sources: https://playpokpok.com/ ; https://www.luriechildrens.org/en/specialties-conditions/pediatric-occupational-therapy/developmental-milestones/play-developmental-milestones/. Caveats: None.
- [x] LR18 [Grok / Adam] (done 2026-10-14, Grok for Adam / abarish-dev, PR #400, v0.18.0; not yet tried with a toddler) **Dough Table**: Tap the dough lump (in the baby's colour) to squish it flat, and drag to roll it into a ball. Tap the creature cutter to stamp out a little baby that hops off. Done when (smallest test): One lump, squish and roll, and one cutter that stamps a hopping baby. Drags checked on phone and tablet. Sources: https://www.cdc.gov/act-early/milestones/3-years.html. Caveats: The drag must be forgiving for small fingers.
- [ ] LR19 [Grok / Adam] **Block Tower**: Tap a soft creature-face block and it drops onto the stack with a clunk. Tap the baby to knock the tower down (giggle), then restack. No height limit, and it never falls by accident. Done when (smallest test): Five blocks that snap in, plus the knock-down. The stack never goes off screen (cap the visible height or pan). Sources: Pok Pok blocks (https://playpokpok.com/) ; the Lurie link above. Caveats: None.
- [ ] LR20 [Grok / Adam] **Little Garden**: Tap the seed bag to plant in one of three patches, then tap the watering can. Each watering is one growth stage (by taps, not time). The third watering gives a berry, carrot or flower, which the baby eats; berries also appear in the Snack Kitchen. Done when (smallest test): One patch, three waterings, a berry, and the baby eats it. Nothing is saved between visits. Sources: https://www.cdc.gov/act-early/milestones/3-years.html. Caveats: The Snack Kitchen tie-in is optional for the first slice.
- [ ] LR21 [Grok / Adam] **Barn Band**: Babies hold a drum, bells or a horn. Tap one and it plays. Tap the conductor stick and they all play Twinkle together (the same tune as the moon). Done when (smallest test): Two instruments plus play-together. With sound off it is silent, with the visuals still moving. Sources: Pok Pok music (https://playpokpok.com/) ; the CDC songs tip (https://www.cdc.gov/act-early/milestones/3-years.html). Caveats: It overlaps with the singing flowers (LR3), so it must look and sound different.
- [ ] LR22 [Grok / Adam] **Feel-Better Corner**: The baby has a tiny bump. Tap a bandage, a cuddle blanket and a cup of water. Hearts appear and the baby bounces back. It's never really hurt and can't go wrong. Done when (smallest test): Bandage, cuddle, then hearts, plus one parent check on how the toddler reacts. Sources: https://sagomini.com/en/. Caveats: Evan OK'd: keep the bump very mild, with no crying sounds and no blood.
**The Arcade Cabinets (browser), original single-screen games in the 1978-85 style.**
- [x] AC1 [any] Storm Front (the Space Invaders shape, Evan's pick): one cabinet, original name and art, one PR. (built: Codex for Adam / abarish-dev, guest/storm-front, PR #119; awaiting review)
- [x] AC2 [any] Lighthouse Watch (the Missile Command shape). (built: Grok for Adam / abarish-dev, PR #145, merged 2026-10-10; v0.1.0)
- [x] AC2.1 [any] Lighthouse Watch display and controls polish: uniform harbour scale, taps mapped after resize, phone pause/rotation checks and before/after captures. Files: `games/lighthouse-watch/`, `tests/lighthouse-watch.html`, evidence in `docs/playtests/lighthouse-watch-display/`; done when circles remain round and aiming/menus/scores pass on phone and desktop. Score 16/21 (fun 2×2, heart 2×2, friends 3, focus 2, cheap 3). (built: Codex for Adam / abarish-dev, PR #163; v0.1.1 release)
- [ ] AC5 [any] A fifth cabinet: a 1978-85 one-screen shape we don't have yet (the maze chase or the asteroid field), our own name, art and sound, never a copied look; shared high scores; phone and desktop. Score 16/21. (QUEUE road 9, added 2026-10-12)
- [ ] AC6 [any] A sixth cabinet, the other shape from AC5's choice, same rules. (QUEUE road 9)
- [ ] AC-x [any] Cabinet polish from playtests (docs/PLAYTEST.md pass 2): one cabinet per PR (AC1.1, AC2.2, ...), until each scores 17+. (QUEUE road 9, added 2026-10-11)
- [x] AC3 [any] Brisket's Crossing (the Frogger shape) and Ember Bricks (the Breakout shape), one PR each. Brisket's Crossing is merged ([PR #160](https://github.com/ecbarish/idle-arcade/pull/160), `a7fac81`). Ember Bricks is merged ([PR #185](https://github.com/ecbarish/idle-arcade/pull/185), Grok for Adam / abarish-dev, 2026-10-11).

### Parked (Evan decides when)
Primordial beyond light polish, a second sport. Proposals welcome; no builds.
- [x] KM0 [parked until Evan gives it a focus slot] (merged: #379, c1d4d9c, 2026-10-14, v0.1.0) **Keymaster**, the property-portfolio game built on Evan's deal analyzer (docs/proposals/keymaster.md, 18-19/21). Smallest test when unparked: one listing, one analyzer, one buy.
Judged ideas and the scorecard for new ones: docs/proposals/new-game-ideas.md (2026-10-09).

### Main Street (business game) and its card shop (unparked by Evan 2026-10-09)
Evan: "Yes I want to develop these. The card shop is just one of the businesses for the game, and could have some card
trend elements in it where people love pulling cards and grading them. Though the card shop is kind of locked behind the
development of Wildbond, because we need the roster of creatures and trainers." So: **Main Street** is the business game;
the **card shop** is one of its businesses, selling Wildbond cards (creatures and tamers from the shared catalogue).
- [ ] MS0.1 [ChatGPT] Design doc docs/plans/main-street.md: the businesses (the card shop first), owning one then several,
  staff and managers who automate (earned), the street as a place you walk (the screen is the world), progression,
  what is shared with the arcade. Comparable games and what to borrow; no ads, no paid speed-ups.
- [ ] MS0.2 [ChatGPT] Card shop design inside it: pulling packs (the thrill of the pull, rarities from the catalogue),
  grading cards (a grading service with scores and turnaround), card trends (some creatures become hot after events,
  prices move with what players and townsfolk chase), singles, regulars with stories, Friday tournaments on Wildbond's
  element rules. Card art generated from the Godot creature figures.
- [ ] MS0.3 [Claude] Platform and first slice (likely Godot, sharing figures and catalogue), built **after Wildbond 2.0**,
  when the roster of creatures and tamers is settled.

## Part 3: standing work (always available, any assistant)
- **Run every check** (`node tools/run-all-checks.cjs`) and fix or file anything red.
- **A playtest pass:** play one game for its first 20 minutes as a newcomer, file what's confusing or broken as
  GitHub issues (or a short report in docs/playtests/).
- **A game review** when a milestone closes: play it as a newcomer and add proposals with screenshots. The first one
  (2026-10-09, docs/proposals/game-review-2026-10-09.md) proposes GR-1 to GR-12: creature looks, battle choices,
  explorable areas, Starfall's own look, hearing from players; scored and placed in docs/PRIORITIES.md.
- **Player-text sweep** of one game against docs/CREATIVE.md "Writing for players".
- **Keep Come Play current** (playtest.html): versions, pictures, what's new.
- **Research prompts** for Evan's Gemini reports (docs/research/gemini-prompts.md), then review the reports against
  the game.
- **Small local-helper jobs** (Lane D), checked by a person.

- [x] SCENE-PLAN [any] (ready: PR #151, Codex, 2026-10-10) Shared scene/interior design outline requested by Evan: docs/plans/scene-layout-pass.md; distinct Larkhaven home briefs, entrance/input/visual checks and independently claimable follow-ups. Complements MAP-AUDIT #147; no engine or art edits. Done when the brief and COMMS handoff are published. Score 18/21 (fun 3x2, heart 2x2, friends 3, focus 2, cheap 3). (merged: PR #151; ticked 2026-10-11 by lane P)

## Part 4: what we've learned and actioned (newest first; every piece of work adds a line)
- **2026-10-13, ART-SF-HF1 (Codex, PR #278, merged by lane R):** a shared asset registry (shared/assets/catalog.json, 25 stable IDs, checked in CI as the 21st suite) and a male/female 3D fitting bench in experiments/character-library/. Lesson: the three Higgsfield reference rounds (#274, #277, #278) added about 90 MB of images and models to the repository; future reference images go in as compressed JPEG/WebP, and optional browser tests must find Chromium on any machine, not only Evan's PC.
- **2026-10-12, Starfall Guild (Evan's pick):** one Starfall gets the effort. Starfall Guild's loops fold into the Godot village (SF-GUILD); the browser game gets fixes only (SG-N1).
- **2026-10-12, check-in (Claude, lane P):** Flint's three playtest rounds found no crashes, and every game honours "no cash grab". The common snag is the same in Diamond Manager and Starfall Guild: the player watches the action instead of acting in it. So the business games come next after the newcomer fixes (Evan), and their tickets (DM-N1, SG-N1) give the hands something to do during the action. DM5 moved ahead of Lantern Bowl.

- **2026-10-12, AC3.3 (Codex):** separate completed-play progress from optional leaderboard identity, and distinguish a new session from harder rounds inside it. Demo lives are not the newcomer's starting lives.
- **2026-10-12, rename steps 5-6 (Claude, lane P):** after a repository rename, the Pages site at the new address can keep serving an older build until the next push to main deploys, so verify live files after the first post-rename merge, not before. A verifier that pins one release's hashes is a record and cannot pass again once later work changes those files; don't read its failure as a broken site. Flint's playtest became AC3.3, AR2.15 and DC-N.

- **2026-10-12, RB1.11 (Codex):** disabling AI fallback is insufficient when basic attacks, pets and companions still advance. Pause the whole combat transaction together, and test old away saves through boot rather than only calling an offline helper.

- **2026-10-11, creature catalogue (Wildbond builder):** counting the data showed the real gap: 74 of 89 lines never evolve and every creature is drawn the same size. Growing existing creatures into lines beats adding loners, and the catalogue is now generated from the data (`tools/wildbond-catalog.cjs`, checked by run-all-checks) so it can't go stale.

- **2026-10-11, WB-KEYS:** a caption that names the keys is easy to miss; a small key drawn beside you, with the word it does, at the moment it matters, is not. Keep such hints in the world, count uses and let them step aside (an older save starts as already knowing). Put the hint beside the player, never over the person you're about to talk to.

- **2026-10-11, SF2.6c:** frame the whole landmark texture, not only its collision footprint, and reserve space for screen text. A fresh spawn plus a one-tile northern margin fixes the first view without moving existing saves; verify actual renderer captures and service routes at every supported shape. [Evidence](screenshots/starfall-opening-view/README.md).

- **2026-10-11, AC3 Ember Bricks:** the Breakout shape is its own cabinet and its own pull request. Leave the shared AC3 checkbox open until that cabinet is merged too.

- **2026-10-11, AC3 merge:** a status line that still says "not merged" after the merge is wrong; correct it, and leave the checkbox open while the other cabinet on that line is unbuilt.

- **2026-10-11, the wild bond and the reveal (Claude, Wildbond builder, PR #170):** an emergent moment that gates story (the reveal waits on the wild bond, as T58's contract asks) needs a way to be reached by every player: the Spire and rematches give hard battles late, but a player who never lets a Bonded partner stand alone may never see it. Watch for this in playtests; if it bites, a Warden can hint at it rather than the gate opening without it. A scene that sets its flags as it starts is safe because nothing saves while lines are playing, so a closed game replays it. Writing packs kept outside the Godot project need a copy inside it (data/wildbond-reveal.json); note the pair in both places.
- 2026-10-10 (AC2.1): fit a fixed arcade world with one scale and invert the same viewport for taps; test render transforms and real screen targets across resize/DPR so a visual fix cannot silently break aim.

- **2026-10-10, AC3:** a log has to carry the mule before the lane moves, or the log slides out from under them the same tick. A full set of lanterns rebuilds faster lanes. Open water and a cart each cost a life.
- **2026-10-10, ART-SF-6:** a lantern's lit state may change only the glass pixels; bunting and an empty plot are placement envelopes, not solid blocks.

- **2026-10-10, RB1.8 (Codex, PR #155):** walkers already had directions, but drawing ignored them. Low graphics replaced silhouette casts with ellipses; Realmbound now uses unblurred casts and smaller contacts. Side walls need connected projected corners rather than upright tile rectangles; size the hearth around a substantial flame instead of shrinking the flame to conceal a proportion problem.
- **2026-10-10, ART-SF-5:** a yard's footprint is a placement envelope, not a solid block; record individual props/fence segments and keep the entry clear.

- **2026-10-10, ART-SF-4:** model window states as glass-only changes; alpha and footprint invariants keep lighting swaps from changing placement or collision.
- **2026-10-10, RB1.6:** a valid 44px tap target can still hide its words. Check actual text line rectangles as well as button bounds; wrap names in a body font, and let the existing ResizeObserver measure the larger action bar.
- **2026-10-10, OW1.1:** a keyboard-only story shortcut is easy to miss. Offer the existing skip as a visible, optional in-scene button; bind it to the introduction state so stale controls cannot skip later choices.
- **2026-10-10, SCENE-PLAN:** static access, real input and visual composition are separate checks. Purposeful furniture groups and clear thresholds make small rooms believable; a full map audit already exists in #147, so the shared outline extends its visual/design handoff.
- **2026-10-10, RB1.7 (Codex, PR #153):** repeated bed tiles read as a storage room. Group beds with linen cupboards and tables with chairs; keep the centre open. Check the drawn furniture footprint against real movement, then tap the Keeper and leave by keyboard on four screen sizes.

- **2026-10-09, WD2 data (Codex, PR #113):** the roster has 104 base species and three hybrids added by the ranch module. Validate the full exporter, not just 00-data.js; all 107 preserve their original gameplay fields. Drawing hints stay out of creature saves; the appearance contract is in docs/lore/wildbond-looks.md.
Standing rule (Evan, 2026-10-09): each piece of work records here what it taught us and what was done about it, in a
line or two, with the page that holds the detail.
- **2026-10-11, playtest pass 2 (Claude, Playtester):** the cabinets passed easily because they copied the classic
  conventions (controls under the screen, a demo behind the title, touch buttons); the one rough edge was a convention
  skipped (a pause after a hit). Lesson: when a genre has a convention, keep it unless there's a reason. Actioned: fixes
  in docs/PLAYTEST.md's pass 2 table.
- **2026-10-11, Starfall art review (Claude, Art direction thread):** seven drawing tasks written as specs (size, footprint,
  palette, contact sheet) were all built by Evan's dad's AIs within a day and fit together without redrawing: a tight
  spec is what lets other assistants make art that matches. What slipped was the space between the pieces (a bare
  square, the opening view) and one older code-drawn piece off the palette, and doors drawn between two tiles
  (a door must be centred on the map tile you walk through, and touch the ground); next time a set of tasks includes one for
  dressing the scene and one for the first screen. Tasks ART-SF-8, SF2.6c.
- **2026-10-11, DM-G (Claude, sports thread):** "watching" a sports sim means seeing it, not reading it. To add pitches
  and fielders without breaking a balanced simulation, the result of each plate appearance still comes from the tested
  ratings formula and the pitches are written to fit it (four balls end a walk, three strikes a strikeout); the run and
  batting numbers stayed within a few percent. A game is a plain saved object stepped one pitch at a time, so the
  player can be asked between batters and a game left halfway resumes.
- **2026-10-11, DM-T (Claude, sports thread):** a trade finder needs no new rules, only a search over the existing
  judge (every suggested deal is checked by the same function that answers a hand-built proposal), so it can never
  offer something the other club would refuse; a check pins that and that no single cheaper player would do.
- **2026-10-11, DM6 (Claude, sports thread):** growth needs a ceiling, or every young player becomes a star and the
  league inflates. Ceilings plus "plays every day grows faster" turn the farm club and the batting order into real
  choices. A six-season simulation showed the league still inflates (it did before DM6 too) while the market stays put;
  actioned as ticket DM-B2 in plans/sports-management.md. A send-down must keep the salary on the payroll, or the
  farm becomes a way around the budget (caught in review, now a check).
- **2026-10-11, DM-B (Claude, sports thread):** a management game must be tested by simulating a manager, not only
  by playing it: a policy that signs, orders and builds won no more games than doing nothing until money and the market
  gave it room. The check now pins the gap (an active manager at least 2.5 wins a season ahead), and the simulation
  found two real traps (an ended contract arriving by trade or free agency; a roster you could neither fill nor
  release), both fixed.
- **2026-10-09, Art direction (Claude, Art direction thread, formerly Game assets):** borrowed art made Starfall and
  Wildbond look like one game, and free packs can't carry a future 3D or first-person game. Actioned: one arcade-wide
  art guide (docs/art/README.md: ten shared rules, a palette per game, footprints and heights in data, a drawing-task
  template), Starfall's look sheet and frontier mock-up (docs/art/starfall.md), and six drawing tasks (ART-SF-1 to 6)
  any AI can claim. Wildbond's art page (docs/art/wildbond-art-direction.md, PR #123) is the first look sheet; the
  games share only ink #1e1a22 and lamplight #f2d080, and Starfall's roofs are weathered wood so they never echo Wildbond's slate.
- **2026-10-09, DM2 playtest (Claude, Playtester):** simulating many seasons through the game's own functions (hands-off
  against active) finds balance problems a single playthrough can't: in Diamond Manager the choices barely moved
  results. Actioned: three small fixes and ticket DM-B (docs/playtests/diamond-manager-1.md).
- **2026-10-11, AR2.14 editions and milestone refreshes (Claude, website thread):** "Classic" was used for every
  browser game in places, which blurred the one distinction that matters (two editions of Wildbond and Starfall). Now
  only those two are Classic, they sit in their own last section with ribbons, and the site and guides refresh at
  milestones instead of every merge (docs/SITE-AND-GUIDES.md), because each update changes the games too much.
  Fitting every cabinet on one screen stopped working at 14 games: cabinets now keep one size and the hall scrolls with
  the walker; on phones the hall is hidden (Evan: unusable there) and the cards are the menu.
- **2026-10-09, AR2.12 the front door (Claude, website thread):** three homepage styles split the effort and the
  living world could only fit four or five games, so a style that holds every game wins: the arcade hall is now the
  only one (Evan's call). Players could not tell what a game was or how to control it, so every card now says what you
  do and the controls, and the games sit in sections by kind (games.js `ArcadeKinds`); a new game needs a `kind`,
  `goal` and `controls` (tools/launcher-checks.cjs counts them). Canvas text inherits `textAlign` from earlier draws:
  set it in every label helper.
- **2026-10-09, Wildbond's own art, part 1 (Claude, Wildbond builder):** Wildbond and Starfall looked alike because
  both drew the same free pack. Painting our own tiles in code, into the same cells the game already read, swapped the
  whole look without touching the map code. Evan wants the art to grow toward 3D and first person, so the direction
  (palette ramps, shapes with real sizes, footprints that match pictures) is written down in
  docs/art/wildbond-art-direction.md before the art grows further.
- **2026-10-09, Evan's playtest (Claude, Wildbond builder):** "see-through roofs": the barn's picture is taller than
  its footprint in the map data, so the row behind it was walkable and you walked across the roof. Now every
  building's picture is listed (`buildings()`) and its roof rows are closed, with a check. "Controls not clear": a How
  to play page opens before a new journey and from the title and the book. Lesson: when art is bigger than the map's
  footprint, the map has to learn the art's size.
- **2026-10-09, WB6.1-6.2 phone controls and settings (Claude, Wildbond builder):** taps already walked you anywhere,
  but talking needed the E key, so a phone could reach the ranch and nobody in it. Named actions (`controls.gd`) let one
  button, a key or a gamepad all mean Talk, and the phone button names what it will do. The pad hides whenever a menu
  is open, because menus are better tapped directly. Settings live on the device, not in the journey save.
  godot-practices.md rules 2 and 3 are now done.
- **2026-10-09, DM1 (Claude, sports thread):** Evan couldn't work out how to hit in Diamond Career: a game can pass
  every rules check and still not be playable. So every sports deliverable now ends with a playability pass (DM2,
  LB5) by someone playing as a first-timer, and the manager game's first screen says what to press and why. A
  ratings-only simulation needed tuning against real baseball numbers (runs a game, batting average); the checks pin
  those ranges so a later change can't drift.
- **2026-10-09, playtest pass 1 (Claude, Playtester thread):** our tests prove the code works, not that a newcomer can
  play. Diamond Career passed its tests and still failed a first-time player (the game hid behind "Talk to Iona",
  the scale was off, two at-bats a game). Actioned: docs/PLAYTEST.md's bar is now part of the quality bar, and its
  fixes went to lanes W, S and A and the website and sports threads.
- **2026-10-09, WD2 part 1 (Claude, Wildbond builder):** new shapes are cheapest where a description already asks for
  one (a "wyrm", roots, a shell, dusk drifting), and a Godot-side table (figures.gd `SHAPE_FOR`) lets them land without
  touching the browser's shared families. A pixel shape needs a look at 2x before shipping: the first moth read as a box.
- **2026-10-09, design decisions (Claude, Design decisions thread):** questions were waiting in COMMS for days because
  nobody owned answering them. Now docs/DECISIONS.md is the log and the thread answers from the research, going to Evan
  only for goals, new games, money or the irreversible. First answers: one day in Starfall (DD-2), Warden levels follow
  the data and the level caps (DD-3). Lesson: when lore and data disagree, check which one the rules (caps) allow.
- **2026-10-09, guest contributors (Claude, planning; CONTRIBUTING.md, QUEUE.md lane X):** the process assumed only
  Evan's own assistants, so a newcomer with their own AI had no rules to read and no safe work to take. Now a
  plain-language CONTRIBUTING.md with a paste-in start prompt, collaborator access with `guest/*` branches (never
  `main`), and a lane of self-contained starter tasks reviewed and merged by lane R.
- **2026-10-09, T55 review (Claude, Wildbond builder):** an audit that lists open calls is only useful once someone
  makes them. Made three (chronology, early depth, superseded notes) and sent the one that changes the story to Evan;
  wrote T58 so the reveal's text can be written while Claude builds other things.
- **2026-10-09, WB3.6b pacing (Claude, Wildbond builder):** T56 showed the late areas needed thousands of wild wins.
  Cause: reward grew with level, XP needed with level^2.2, so wins per level rose from 24 to about 400. A formula ported
  from an idle game assumes idle speed; with hand-played battles, measure wins per level, not XP. Now a constant
  `WINS_PER_LEVEL` (12, Evan's pick: training before each Warden matters) in rules.gd, with a check.
- **2026-10-09, WD1 and the Deeptide stall (Claude, Wildbond builder, PR #91):** a menu that pauses time can trap a
  player when every choice in it depends on time passing (cooldowns only tick while the battle runs). Fix the rule, not
  the symptom: a creature with nothing ready never opens the menu; it waits while time runs. A numbers line can always
  become a thing you carry: the satchel icon opens the book's new Satchel page. Screenshots: docs/screenshots/wildbond-wd1/.
- **2026-10-09, art and sound (Claude, docs/learning/assets.md):** neither Godot game made a sound when you did
  something, against CREATIVE.md's "every action answers with sound": both now have sound effects from the Ninja
  Adventure pack already on Evan's PC (no new download), named by meaning so originals can replace them file by file,
  with a check that every sound named in code has a file. Feelings (spirits, waiting, wanting a word) were invisible
  or drawn ad hoc: the pack's emote bubbles now show them over heads. Learned: the cloud can't reach asset sites (only
  GitHub), so new downloads happen on Evan's PC via the folder tools; a picture loaded with `load()` inside `_draw()` drew as a
  white box in our test screenshot (GL renderer); loading it once and keeping it (`_emote()`) fixed it; the pack's palette is the
  bridge to original art (docs/learning/art/arcade-palette.gpl). Next: AR2.10, our own sounds first.
- **2026-10-09, priorities (Claude, docs/PRIORITIES.md):** spreading work evenly across every game kept all of them
  moving and none finishing, while ideas kept arriving. Now focus slots (Evan confirmed Wildbond first) and one
  scorecard; new ideas and improvements are scored and filed before anyone builds them.
- **2026-10-09, craft review (Claude, docs/learning/):** saves were written straight over the old file, so a crash
  mid-write could lose a journey: both Godot games now save through a spare file and keep a backup. Wildbond's place
  sounds were WAV and two tunes were stored twice: now OGG and shared, web pack 25.3 to 20.0 MB. Godot's `.import`
  files were ignored against Godot's advice: now committed. No line-ending rules across Windows and Linux: now
  `.gitattributes`. Ten test suites were run by hand and "all pass" taken on trust: now one command, and GitHub runs it
  on every push and PR. Web packs committed on every rebuild had grown the history to 284 MB: rebuild at milestones
  only, and AR2.7 proposes building them on GitHub. Wildbond's main.gd (3,600 lines), raw key reads and missing sound
  buses: rules to grow out of them gradually, tied to WB6.1, WB6.2 and AR2.8.
- **2026-10-09, RB1.5:** use one fallback predicate for combat and HUD; dialogue pauses must also cover QuestHelper and background hunting. Existing victory counts can protect the first fight without adding save fields.
- **2026-10-09, T58:** reveal handoffs distinguish observed documents from character interpretation, shared evidence from optional family perspective, and written restoration from engine placement. Never claim the visual payoff ships with a JSON file.
- **2026-10-07 to 10-09, earlier lessons:** recorded in docs/PROJECTS.md "Read first" (the game window, depth, woven
  stories, player text, variety, friends' testing, the process).

- **2026-10-10, MAP-AUDIT:** grid-only door floods miss renderer-defined roof collision; compare actual tap routing with movement predicates and keep visual review separate (#147 / #149 / #150).
- **2026-10-10, WB-ROOF-149:** test one accepted tap through completion without automatic retries; otherwise a helper can hide planned routes that cross movement collision. #154.
- **2026-10-10, RB1.9 (Codex):** convincing perspective is not a nearly completed 3D port. An isolated physical-scale trial separates camera/art judgement from save and gameplay risk; camera collision also needs room bounds when rays pass through open doorways.

- **2026-10-10, RB1.9 character follow-up (Codex):** animation phase should follow travelled distance, not held input; use foot placement rather than whole-leg swinging to prevent skating and floor penetration. Interpreting palette colours in the renderer's linear space prevents washed-out materials.

- **2026-10-10, RB1.9 equipment follow-up (Codex):** visible gear needs stable item-type IDs and joint attachment points before higher-detail art. Inspect screenshots as well as checking meshes exist: a replaced scale component can accidentally stretch chest armour over a face. Keep prop dimensions, collisions and interactions separate from replaceable art.
## Maintenance

- [x] **FB-17 [any]: onboarding instructions cleanup** (ready: PR #168, Codex / Adam, 2026-10-10). Files: START-HERE.md and task/status notes only. Repair the broken old-save rule, refer test coverage to the runner, and align claim/merge instructions with PROCESS.md. Done when links resolve and the diff changes documentation only. (merged: PR #168)


## Wildbond doorway preview release record

- [x] WB-PREVIEW-177 [any] Built and browser-verified 2026-10-11, Adam / abarish-dev, [PR #183](https://github.com/ecbarish/idle-arcade/pull/183). Exact merged source `480dfc4`; 353 browser checks, 119 captures, 60 door transitions, 20 fresh-save reloads and 12 pad hold/release cases. Unchanged engine and save format. Final latest-head CI, merge and live hash confirmation gate publication; see [release record](research/wildbond-preview-door-release.md).



## Starfall opening preview release

- [x] SF-PREVIEW-200 [any] Built and browser-verified 2026-10-11, Codex for Adam / abarish-dev, [PR #206](https://github.com/ecbarish/idle-arcade/pull/206). Exact merged source `0af5b92`; 54 browser checks, 17 nonblank captures, fresh nondefault-position reloads and previous-source saved towns. Engine and save format unchanged. Final latest-head CI, merge and live-hash confirmation gate publication; see [release record](research/starfall-preview-opening.md).


## Starfall mobile-fit preview release

- [x] SF-MOBILE-PREVIEW [any] (done: Codex for Adam / abarish-dev, 2026-10-12; [PR #222](https://github.com/ecbarish/idle-arcade/pull/222) merged `95b1655`, live manifest/four hashes verified 14:21:59 UTC, [record](research/starfall-preview-mobile-fit.md)) Publish the exact rebuilt and tested pack for merged phone-fit source 1a37f695. Only play/starfall/ pack, shell byte count, build manifest, scoped release verification and release/session notes. Preserve the existing engine and concurrent work. Done when exact committed-pack checks and all suites pass, the release PR is merged, and Pages serves verified hashes. Adam approved merge and publication at 13:51 UTC.

- [x] **AC3.1 [any]: Brisket playtest polish** (published: PR #180, merge `19a7ee37`, dot / Adam, 2026-10-12; all 19 suites, 336 responsive checks and 31 live-browser checks pass; eight public hashes verified, record in docs/playtests/brisket-ac3-1/README.md). Short knocked-over recovery, Space/arrows launch from ready, larger mule. Files: games/briskets-crossing/, its checks, screenshots and release/status notes. Done when held movement cannot immediately repeat a death, ready keyboard controls work, old scores load and phone/desktop captures pass. Score 16/21 (fun 3×2, heart 2×2, friends 2, focus 1, cheap 3).

- [x] **AC3.2 [any]: Brisket easier opening** (published: dot / Adam, #233, merge `032bbd09`, v0.1.2, 2026-10-12; all 19 suites and 784 responsive/opening checks pass; eight public hashes and 40 actual live-browser checks verified at 17:27 UTC, record in docs/playtests/brisket-ac3-2/README.md). Wider early-road gaps and river landing windows, slower first-run traffic and more time after Adam's phone playtest. Controls, recovery and old scores preserved; original challenge returns from run 4. Phone portrait/landscape captures and timed routes independently reviewed. Scoped release handoff #236.

- [ ] **AC3.3 [any]: Brisket newcomer fixes** (ready: Codex, PR #244, 2026-10-12) (Flint's first-time playtest, docs/COMMS.md 2026-10-12 20:19). Show a death: a short knocked-over moment and a line in words, not a silent respawn. Label the timer bar "Time", with more urgency in the last seconds. "1 life", not "1 lives". One lives rule a newcomer can see (the get-ready screen showed 1 life on one run and 3 on the next; explain it or make it the same). The run counter goes up each run. "Pell's Crossing" reads as a typo next to "Brisket's Crossing": show it as the place's subtitle. The hall card says "Not started yet" after runs without initials: count a run with or without them. Files: games/briskets-crossing/, its checks. Done when old scores still load and phone and desktop captures pass. Release note: the AC3.2 verifier pins release 032bbd09, so a new release gets its own record.

## Shared first-impression kit (cycle 1 spare effort)

- [x] ONBOARD-KIT1 [dot / Adam] (merged: dot, PR #294, 2026-10-13; all 21 suites / 526 focused browser checks; authorized public verification in #301) Reusable browser newcomer guidance with one Realmbound adapter and a neutral reference fixture. Files: `shared/onboarding.*`, `games/realmbound/` guidance integration, focused tests/tools/workflow and evidence, one-line coordination notes. Done when goal/input/orientation hints remain inside the game, current story/dismissal/save behavior is retained, keyboard/touch portrait/landscape/desktop/large-font/rotation/reload/old-save checks and current aggregates pass, and an independent review is recorded. No other production adapter or new playtest campaign; Adam approved #294 merge and live verification on 2026-10-13.

## Review integration, 2026-10-19

- [ ] REVIEW-INTEGRATION-20261019 [ChatGPT] Record Evan-authorized merge batch, completed scoped tasks, exact checks and holds. Own README changelog, START-HERE Session log, task records and docs/research/review-integration-20261019.md. (claimed: Codex / root for Evan, 2026-10-19, codex/review-integration-20261019). No runtime, save or publication changes.
