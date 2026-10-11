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
**WB-M1: the start of the journey (done 2026-10-08).**
- [x] The opening, register and heritages, the barn, Wren; Thornwood, Saltmarsh, Emberfall, Cloudglass; wild
  bonding; trainers and Wardens; the ranch as a place (nursery, trough, workbench, gear); evolution; music; saving;
  web preview.

**WB-M2: who you are and where you stand.**
- [x] WB2.1 [Claude] Tamer abilities with heritages (WG1): done 2026-10-08 (Orders menu: Rally, a family order, Toren's Steady).
- [ ] WB2.2 [Claude] Depth step 1 (WG6): ground heights, object footprints and heights (part 1 done 2026-10-08: the colour layer drawn in true depth order, people in front of you faded as the world is). Part 2 done 2026-10-09: trees beside open ground stand at their true height and their crowns pass in front of you (see-through, faded like the world: shaders/canopy.gdshader), never over a sign or an item. Left: ground heights, footprints and heights on objects (houses and rocks).
- [ ] WB2.3 [Claude] Variety pass (WG7) (done 2026-10-08: an animated effect per element in battle; waves and wind under the music. Tried the pack's water ripples: opaque tiles, rejected). Left: waterfalls, edge
  tiles.
- [x] WB2.4 [Claude] Interiors: the inn, the shop and two homes in Larkhaven, walkable (inn and shop done 2026-10-08, with Old Ned and Juniper; both homes done 2026-10-10: Pip's home with Mira and Nora's cottage, Grok for Adam / abarish-dev, PR #137, H8; the pack's unused Interior tileset has furniture, floors and walls: docs/learning/assets.md).
- [x] WB2.5 [Claude] Maren's letter and the field book's "where next" hint (WG8): done 2026-10-08.
- [x] WB2.6 [ChatGPT] (done, merged 2026-10-09; T45) Lore: a heritage line for every Warden and townsperson in areas 1-4 (data in the browser game,
  exported to Godot), recorded in the thread ledger.
- [x] WB2.7 [Claude] Bring T37's fourteen creatures into Godot (WG9): done 2026-10-09 (exported; all use existing body types; 107 species).

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
- [ ] WB4.2 [Claude] The wild bond's
  discovery (WG4) and the first-person glimpse.
- [ ] WB4.3 [Claude] The homecoming ending, colour and depth restored. *Part 1 done 2026-10-09: after the Champion, Maren and Isolde come to the league gate and Avenne walks down (T54 staging), the ending and the quiet-down lines play, and every Warden welcomes the Champion on return. Left: the deeper reveal (waits on Evan's choice of the final truth, docs/proposals/wildbond-final-reveals.md, and WB4.4b).*
- [ ] WB4.4 [ChatGPT] (T58 writing ready: PR #101, Codex, 2026-10-09; Claude places approved reveal) (WB4.4a: T53 and T54 merged 2026-10-09 and placed; WB4.4b, the full mystery payoff, waits on Evan's choice in docs/proposals/wildbond-final-reveals.md) The ending's text and every thread's payoff, written from the ledger, for Claude to place.

**WB-D: deeper play (from the game review, docs/proposals/game-review-2026-10-09.md; before 2.0, order in PRIORITIES.md).**
- [ ] WD1 [Claude] Numbers off the screen (GR-4): remove the Badges/Lures/Coins/Wilddex line; a readable arrival name.
- [ ] WD2 [ChatGPT data, Claude drawing] (data built: Codex, PR #113; drawing remains open) Creatures that look different (GR-1): per-species look features in data;
  parts drawn in figures.gd; 4-5 new body shapes. *Part 1 done 2026-10-09: serpent, turtle, moth and tree-folk shapes for twelve species (figures.gd `SHAPE_FOR`; a `shape` field in the data overrides it). Data half built in PR #113: all 107 browser species have shape + head/back/tail/pattern hints, including hybrids. Left: Claude draws the parts; a fish shape with WB5.7.*
- [ ] WD3 [Claude, ChatGPT data] Battles with real choices (GR-2): about 60 moves, family signature moves, a few
  statuses, an order per Warden; tuned with WB3.6.
- [ ] WD4 [Claude] Areas you can explore (GR-3): route, settlement and hidden pocket per area, return spots gated by
  element. **WD4a Thornwood done 2026-10-09 in PR #128:** Thornwood Trail, the preserved settlement, and Stone-gated Old Root Grove. Remaining areas stay open, one area per PR.
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
- [ ] WB5.6 [ChatGPT] Catalogue batch 3 and 4 (12-15 creatures each, data and lore).
- [ ] WB5.7 [Claude] Fishing at Saltmarsh (from docs/proposals/new-game-ideas.md, scored 16/18; added 2026-10-09).

**WB-M6: version 2.0, ready for everyone.**
- [x] WB-PREVIEW [any] **Done 2026-10-10:** merged and deployed; all 14 main suites pass, exact committed pack passed 55 browser checks with 27 captures and synthetic pre-WD3 saves, and all four live-file hashes match the reviewed build. (merged: [PR #132](https://github.com/ecbarish/idle-arcade/pull/132), Adam / abarish-dev, 2026-10-10, `guest/wildbond-preview-integration`) Refresh the `play/wildbond` pack to include WD3, WD4a, WB5.1 and the UI fixes. Scope: `play/wildbond`, release/guide notes and verification screenshots. Done when the full tests pass and the web build is verified playable.
- [x] WB6.1 [Claude] Phone controls (WG10). **Done 2026-10-09:** named actions in `controls.gd`, the phone pad in `touch_pad.gd`, gamepads. Start by moving every key to named Input Map actions
  (docs/learning/godot-practices.md rule 2), so on-screen buttons, a gamepad and rebinding all come free.
- [x] WB6.2 [Claude] **Done 2026-10-09** (`settings.gd`, the book's Settings page). Settings in the game window (sound, music, text size,
  battle speed). Start with Music, Ambience and Effects sound buses (godot-practices.md rule 3).
- [x] WB6.3 [Claude] **Done 2026-10-09** (`turn_card.gd`). A phone held upright gets a "Turn your phone sideways" card and the game holds still (Playtester, PR #111). Learned: with `canvas_items` stretch and `keep` aspect, portrait leaves a thin strip, so no portrait layout is worth building; pausing the tree with the card set to `PROCESS_MODE_ALWAYS` freezes battles and walks cleanly.
- [ ] WB6.3 [Claude] Import a browser Wildbond save into the new version.
- [x] WB6.4 [any] A Wildbond guide (first steps, the element chart, the ranch), now that systems are settling. (merged: PR #127, 2026-10-09)
- [ ] WB6.5 [Claude] A Wildbond trailer and store-style page; Windows build and web build published.
- [ ] WB6.6 blocked: needs Evan (what "launch" means; START-HERE question 1).

**WB-M7 (later): first person.** WG11: a 3D view generated from the same maps (docs/proposals/depth-and-first-person.md).

### Starfall (Godot): the village
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
- [ ] MAP-AUDIT [any] (claimed: Adam / abarish-dev, 2026-10-10) Audit current Wildbond/Starfall map and interior reachability, entrance occlusion and scene furnishing; reproduce findings and file fix tickets; no game edits.
- [ ] ART-SF-1 [any] (art review: [PR #134](https://github.com/ecbarish/idle-arcade/pull/134), Adam / abarish-dev, 2026-10-10) Starfall frontier ground: 16 px moss variants, joining mud roads, packed-earth square and stone footing; palette-only atlas plus scale/contact patch; art review before SF2.6 integration.
- [ ] ART-SF-2 [any] (art review: [PR #135](https://github.com/ecbarish/idle-arcade/pull/135), Adam / abarish-dev, 2026-10-10) Frontier palisade, open/shut gate and lit/unlit watchtower; approved palette, footprint metadata and scale contact sheet; art review before SF2.6 integration.
- [ ] ART-SF-3 [any] (art review: [PR #136](https://github.com/ecbarish/idle-arcade/pull/136), Adam / abarish-dev, 2026-10-10) Pine edge: three pine sizes, stumps, ferns and rocks; palette-only pines.png and sideways-tiling forest_edge.png, footprint metadata and contact scene behind ART-SF-2 palisade; art review before integration.
- [ ] ART-SF-4 [any] (art review: [PR #139](https://github.com/ecbarish/idle-arcade/pull/139), Adam / abarish-dev, 2026-10-10) Guild Hall 96×80 and Inn 64×80: original log walls and shake roofs, banner/sign, lit and unlit windows, footprint metadata and contact scene; art review before SF2.6 integration.
- [ ] ART-SF-5 [any] (art review: [PR #144](https://github.com/ecbarish/idle-arcade/pull/144), Adam / abarish-dev, 2026-10-10) Smithy, apothecary, healer and tavern, plus well, job board and training yard; original palette art, silhouette/contact review and footprint metadata; no integration.
- [ ] ART-SF-6 [any] (art review: [PR #148](https://github.com/ecbarish/idle-arcade/pull/148), Adam / abarish-dev, 2026-10-10) Loose props: barrel, crate, firewood, lit/unlit lantern, 2×1 cart, bunting and a 48×48 staked plot on props.png; footprint metadata and a contact scene on ART-SF-1 ground; art review before integration.
- [ ] WB-ROOF-149 [any] (claimed: Adam / abarish-dev, 2026-10-10) Fix #149: tap routes avoid roof collision while preserving doors and NPC avoidance; wildbond-godot/scripts/main.gd and native tests; done when both witnessed taps and existing transition checks pass.
- [ ] SF2.6 [Claude] Its own place (GR-5): a frontier stockade look and road layout instead of Larkhaven's; a map
  that scrolls. Before SF3.1. *The look is set (2026-10-09): docs/art/starfall.md (palette, sizes, footprints, mock-up); the
  pictures are tasks ART-SF-1 to 6 in QUEUE.md for any AI; wiring them in and the scrolling map stay here.*
- [ ] SF2.7 [Claude] See the wilds sooner (GR-7): a small walkable stretch past the gate (an early piece of SF4.1).
- [ ] SF2.8 [Claude] Something by hand every day (GR-8): the next jobs to master, then hire.
- [x] SF2.5 [Claude] Hire the apothecary's apprentice once you've brewed enough (the same "master it, then hire" rule). *Done 2026-10-09: after four batches by hand Fen walks in; six coins a day; brews whenever there are herbs and room on the shelf; leaves the pot to you if unpaid.*

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
**RB-M1: in the game window.**
- [x] Part 1 (T38).
- [x] RB1.2 [ChatGPT] Part 2: pages become places (T41). (merged 2026-10-09)
- [x] RB1.3 [ChatGPT] (done, merged 2026-10-09; T48) Part 3: the road between towns as a walkable stretch at key points (an inn on the road, a
  camp), keeping auto-combat where it already lives.
- [x] RB1.4 [ChatGPT] Phone pass for the new layout (L3 part 2). (built: Codex for Adam / abarish-dev, 2026-10-09, PR #116; awaiting review)
- [ ] RB1.6 [ChatGPT] (ready: PR #141, Codex, 2026-10-10) Readable ability names (PLAYTEST pass 1): action-bar styles and tests/realmbound-phone.js only; full names in a body font, phone-safe wrapping and visible shortcuts/cooldowns; screenshots at 375, 1280 and 3440, all suites pass. Score 17/21 (fun 2x2, heart 2x2, friends 3, focus 3, cheap 3).
- [x] RB1.5 [ChatGPT] (built: Codex, 2026-10-09, PR #98; awaiting review) Wait for the player (GR-10, a bug): autopilot must not take over during the first dialogue
  (games/realmbound/js/13-world-ui.js:95); fix the stray blocks in the sky. Do first.

- [ ] RB1.7 [ChatGPT] Realmbound inn furnishing pass (built: Codex, 2026-10-10, PR #153; awaiting review). Files: games/realmbound/js/22-hub-layouts.js, 22-town.js, tests/realmbound-inn-layout.js and run.html, screenshots and task notes. Done when sleeping, dining and hearth spaces are distinct; the entrance, Keeper and exit work by tap and keyboard; existing services and saves stay intact. Score: 17/21 (Fun now 2x2, Evan's heart 3x2, Friends notice 2, Moves the focus 2, Cheap 3).

**RB-M2: what the raid set up.**
- [ ] RB2.1 [ChatGPT] Battlegrounds plan in docs/proposals/ (R3; new system: Evan
approves).
- [ ] RB2.2 [ChatGPT] Second raid tier (R7), data and encounters.
- [x] RB2.3 [ChatGPT] The catalogue reaches Realmbound (T43). (merged 2026-10-09)

**RB-M3: a living world.**
- [ ] RB3.1 [ChatGPT] Simulated adventurers in the zones (V5 part 1: questing, groups,
asking for help; rules only).
- [ ] RB3.2 [ChatGPT] Camps that grow into villages (V7 part 1).
- [ ] RB3.3 [any]
Realmbound's Godot question answered by Evan, then a plan (START-HERE question 2).

### Diamond Manager (browser; the baseball game, reworked 2026-10-09)
Evan, 2026-10-09: the batting game was too hard to read and to hit; make it one you manage (ratings, trades,
contracts, hiring, stadium upgrades, watching games) and plan a Retro Bowl-style football game. Full plan and the
deliverables with their details: [plans/sports-management.md](plans/sports-management.md). The old DC2-DC4 career
deliverables are retired; the batting prototype stays in games/diamond-career/ off the shelf.
- [x] DM1 [Claude] The first playable season (v0.1.0, PR #110).
- [ ] DM2 [any] Playability pass: two seasons as a first-timer, desktop and phone, fix the top three problems.
- [ ] DM3 [any] Hiring coaches. - [ ] DM4 [any] Player morale and stories. - [ ] DM5 [any] The ballpark you see grow.
- [ ] DM6 [any] A draft and a farm club. - [ ] DM7 [any] Records and history. - [ ] DM8 [later] Step into the big moment.

### Lantern Bowl (browser; American football in the Retro Bowl spirit, our own code and art)
Evan said yes 2026-10-09. Plan: [plans/sports-management.md](plans/sports-management.md) "Game 2".
- [ ] LB0 [any] One-page pitch with three mock screens. - [ ] LB1 [any] shared/sports-office.js from Diamond Manager.
- [ ] LB2 [any] One drive, playable. - [ ] LB3 [any] One full game. - [ ] LB4 [any] Season and office. - [ ] LB5 [any] Playability pass.

### Lantern Ice (hockey, after football; Evan 2026-10-09: baseball, football and hockey are his favourites, all sports eventually)
Plan: [plans/sports-management.md](plans/sports-management.md) "Game 3". Reuses shared/sports-office.js (LB1).
- [ ] HK0 [any] Pitch. - [ ] HK1 [any] Hockey simulation. - [ ] HK2 [any] Shootout moment. - [ ] HK3 [any] Season, lines, office. - [ ] HK4 [any] Playability pass.

### Otherworld (browser)
**OW-M1: three lives (done through v0.3.0).**
- [x] The Between, Asterhold with Lanthorn, Hearthmere, the Ashen Throne.
**OW-M2: memories and a systemic world.**
- [ ] OW1.1 [ChatGPT] (ready: PR #142, Codex, 2026-10-10) Visible Choose a world option in the Between introduction (PLAYTEST pass 1); games/otherworld/js/01-game.js, style.css and existing checks only; uses existing dialogue skip, preserves all choices/memories/saves; phone and desktop screenshots, all suites pass. Score 16/21 (fun 2x2, heart 2x2, friends 3, focus 2, cheap 3).
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
**AR-M1: friends can play (done 2026-10-08).**
- [x] Come Play, previews, trailer, Windows builds.
**AR-M2: polish for everyone.**
- [x] AR2.1 [ChatGPT] Accessibility (T44, L10). (merged 2026-10-09)
- [x] AR2.2 [ChatGPT] (done, merged 2026-10-09; T46) The
launcher shows the Godot previews as games (cards, covers, links).
- [ ] AR2.3 [any] Game boxes (V3).
- [ ] AR2.4 [local] Link and image check across guides and pages (Lane D3).
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
- [ ] AR3.1 [Claude] Walk-in arcade steps 1-2 (V11).
- [ ] AR3.2 [any]
No-server sharing: trade and battle codes, ghost teams (V6 part 1).

### Family games (Evan said yes 2026-10-09; docs/proposals/games-for-everyone.md)
**Little Ranch (browser), a toy for ages 2-4.**
- [x] LR2 [any] Repair interrupted feeding and preserve active play through resize/rotation. Scope: Little Ranch game/test files, isolated read-only browser-review script/workflow, screenshots and brief process notes. Done when repeat/interruption and phone-to-ultrawide checks pass with sound preferences unchanged. Score: 18/21. (v0.1.1 release: [PR #140](https://github.com/ecbarish/idle-arcade/pull/140), Codex for Adam / abarish-dev, 2026-10-10; 49 game checks, 15 Chromium review checks and all 17 current-main suites passed; version-only release metadata is rechecked before merge)
- [x] LR1 [any] The smallest test: one baby creature, three actions (feed, bubbles, peekaboo) and a bedtime
  ending; no reading, no failing, no links or purchases, a grown-up lock. Shares the baby-form drawings W9/W10 needs. (claimed: Grok for Adam / abarish-dev, 2026-10-09, guest/little-ranch)
**The Arcade Cabinets (browser), original single-screen games in the 1978-85 style.**
- [x] AC1 [any] Storm Front (the Space Invaders shape, Evan's pick): one cabinet, original name and art, one PR. (built: Codex for Adam / abarish-dev, guest/storm-front, PR #119; awaiting review)
- [x] AC2 [any] Lighthouse Watch (the Missile Command shape). (built: Grok for Adam / abarish-dev, PR #145, merged 2026-10-10; v0.1.0)
- [x] AC2.1 [any] Lighthouse Watch display and controls polish: uniform harbour scale, taps mapped after resize, phone pause/rotation checks and before/after captures. Files: `games/lighthouse-watch/`, `tests/lighthouse-watch.html`, evidence in `docs/playtests/lighthouse-watch-display/`; done when circles remain round and aiming/menus/scores pass on phone and desktop. Score 16/21 (fun 2×2, heart 2×2, friends 3, focus 2, cheap 3). (built: Codex for Adam / abarish-dev, PR #163; v0.1.1 release)
- [ ] AC3 [any] Brisket's Crossing (the Frogger shape) and Ember Bricks (the Breakout shape), one PR each. Brisket's Crossing is draft PR #160 (ready for review, not merged). Ember Bricks is still free.

### Parked (Evan decides when)
Primordial beyond light polish, a second sport. Proposals welcome; no builds.
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

- [ ] SCENE-PLAN [any] (ready: PR #151, Codex, 2026-10-10) Shared scene/interior design outline requested by Evan: docs/plans/scene-layout-pass.md; distinct Larkhaven home briefs, entrance/input/visual checks and independently claimable follow-ups. Complements MAP-AUDIT #147; no engine or art edits. Done when the brief and COMMS handoff are published. Score 18/21 (fun 3x2, heart 2x2, friends 3, focus 2, cheap 3).

## Part 4: what we've learned and actioned (newest first; every piece of work adds a line)

- 2026-10-10 (AC2.1): fit a fixed arcade world with one scale and invert the same viewport for taps; test render transforms and real screen targets across resize/DPR so a visual fix cannot silently break aim.

- **2026-10-10, AC3:** a log has to carry the mule before the lane moves, or the log slides out from under them the same tick. A full set of lanterns rebuilds faster lanes. Open water and a cart each cost a life.
- **2026-10-10, ART-SF-6:** a lantern's lit state may change only the glass pixels; bunting and an empty plot are placement envelopes, not solid blocks.

- **2026-10-10, ART-SF-5:** a yard's footprint is a placement envelope, not a solid block; record individual props/fence segments and keep the entry clear.

- **2026-10-10, ART-SF-4:** model window states as glass-only changes; alpha and footprint invariants keep lighting swaps from changing placement or collision.
- **2026-10-10, RB1.6:** a valid 44px tap target can still hide its words. Check actual text line rectangles as well as button bounds; wrap names in a body font, and let the existing ResizeObserver measure the larger action bar.
- **2026-10-10, OW1.1:** a keyboard-only story shortcut is easy to miss. Offer the existing skip as a visible, optional in-scene button; bind it to the introduction state so stale controls cannot skip later choices.
- **2026-10-10, SCENE-PLAN:** static access, real input and visual composition are separate checks. Purposeful furniture groups and clear thresholds make small rooms believable; a full map audit already exists in #147, so the shared outline extends its visual/design handoff.
- **2026-10-10, RB1.7 (Codex, PR #153):** repeated bed tiles read as a storage room. Group beds with linen cupboards and tables with chairs; keep the centre open. Check the drawn furniture footprint against real movement, then tap the Keeper and leave by keyboard on four screen sizes.

- **2026-10-09, WD2 data (Codex, PR #113):** the roster has 104 base species and three hybrids added by the ranch module. Validate the full exporter, not just 00-data.js; all 107 preserve their original gameplay fields. Drawing hints stay out of creature saves; the appearance contract is in docs/lore/wildbond-looks.md.
Standing rule (Evan, 2026-10-09): each piece of work records here what it taught us and what was done about it, in a
line or two, with the page that holds the detail.
- **2026-10-09, Art direction (Claude, Art direction thread, formerly Game assets):** borrowed art made Starfall and
  Wildbond look like one game, and free packs can't carry a future 3D or first-person game. Actioned: one arcade-wide
  art guide (docs/art/README.md: ten shared rules, a palette per game, footprints and heights in data, a drawing-task
  template), Starfall's look sheet and frontier mock-up (docs/art/starfall.md), and six drawing tasks (ART-SF-1 to 6)
  any AI can claim. Wildbond's art page (docs/art/wildbond-art-direction.md, PR #123) is the first look sheet; the
  games share only ink #1e1a22 and lamplight #f2d080, and Starfall's roofs are weathered wood so they never echo Wildbond's slate.
- **2026-10-09, DM2 playtest (Claude, Playtester):** simulating many seasons through the game's own functions (hands-off
  against active) finds balance problems a single playthrough can't: in Diamond Manager the choices barely moved
  results. Actioned: three small fixes and ticket DM-B (docs/playtests/diamond-manager-1.md).
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
