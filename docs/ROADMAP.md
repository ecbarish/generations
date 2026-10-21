# Roadmap

Shared plan for every contributor (Claude, ChatGPT/Codex, or a person). One ticket per session.
Mark a ticket done in the same PR that finishes it.

### T46: Arcade, put the new previews on the shelf (AR2.2)
- [x] Built 2026-10-09; PR #73 for review. Separate editions and saves; 174 launcher checks and all eight pages pass.
Why: friends should find the current Godot games without hunting through Come Play, while keeping Classic journeys and saves reachable.
Read first: docs/DEVELOPMENT-PATH.md AR2.2, docs/PROJECTS.md Read first, docs/CREATIVE.md, play/README.md and current preview READMEs.
Branch: codex/arcade-previews (stacked after T44/#71; launcher overlaps).
- Add distinct new Wildbond/Starfall preview cards with real existing screenshots, factual scope, desktop/loading guidance and direct play/ links. Keep Classic cards, progress and reset tied only to their existing browser saves.
- Primary landscape places enter the new versions; both versions remain on the road and in the hall. Preview cards never load the engines before the player chooses them or claim a Classic save is a preview save.
- Do not edit Godot, play/ exports, service worker, save schemas or versions. Keyboard links, phone through ultrawide, reduced motion, all eight pages, new launcher checks; README and one Session line.

### T45: Wildbond, early-road heritage recognition (WB2.6)
- [x] Built by Codex, 2026-10-08; PR #72 for review, not merged. 60 exported reactions; all eight pages pass. Godot dispatch remains with Claude.
Why: the chosen roots should change who confides in the tamer while keeping every route to the truth open (heritage proposal and thread ledger).
Read first: docs/proposals/wildbond-heritage.md, docs/lore/wildbond-threads.md, docs/CREATIVE.md.
Branch: codex/wildbond-early-heritages.
- Add one plain-JSON byHeritage line for each farm/coast/highland/wander origin to all 11 existing map NPCs in Larkhaven and areas 1-4, and the four Warden STORY entries. Append-only handoff, same shape as T40.
- Preserve base lines, trainer battles, badges, maps, save data and all unresolved mysteries. Classic has no heritage dispatcher; Claude wires the exported lines into Godot. Never edit Godot or its exporter.
- Record every clue in the ledger. Add content/JSON checks and inspect the actual export from an isolated browser; all eight pages pass. README and Session log only, no versions.

### T48: Realmbound, the walkable town road (RB1.3)
- [x] Built by Codex, 2026-10-09, codex/realmbound-road-places; ready for review. All eight pages pass; no release bump.
Why: give the journey a physical approach with a roadside inn and camp while retaining Realmbound's established combat and travel (DEVELOPMENT-PATH RB1.3; in-window plan).
Read first: docs/plans/realmbound-in-window.md, docs/lore/realmbound.md, docs/VISION.md, docs/CREATIVE.md.
Branch: codex/realmbound-road-places.
- An optional Walk the road action in the world opens a connected walkable regional approach, with a sign to town, roadside inn interior, keeper and traveler camp. Arrows/WASD, tap and named walking destinations use shared/world.js. Story speaks inside the scene.
- The town exit invokes existing travel; return resumes the same field state. No battles, dungeon/raid shortcuts, automatic gold/items or instant healing. Deliberate catch-your-breath uses the current rest rate; no progress ticks while reading.
- Road state is transient, hero/account/zone-bound and cleared on boot; old saves remain unchanged. No Godot/shared engine/version edits. Files: new js/33-road-places.js and road-places.css; small scene/step/boot/index hooks; tests/realmbound-scenarios.cjs and documentation.
- All eight pages pass; connected paths and transitions, callback safety, normal healing, no currency/quest windfalls and reload checks; inspect phone through ultrawide with screenshots. README and one Session log line.

### T47: Wildbond, Hollowecho build brief (WB3.5 part 1)
- [x] Built 2026-10-09; runtime inventory verified; documentation-only handoff, no new clues or engine edits.
Why: Claude is building the next Godot area; its existing people, clues and encounter data should be together without a new canon or engine rewrite.
Read first: docs/lore/wildbond.md, docs/lore/wildbond-threads.md, browser 00-data.js and 11-maps.js, docs/CREATIVE.md, docs/wildbond-plan.md.
Branch: codex/wildbond-hollowecho-brief, from latest main.
- Write docs/lore/wildbond-hollowecho-brief.md: route/coordinates, people/voices, species and encounters, all T40 clues/payoffs, heritage delivery, one memorable arrival-to-return moment and a concrete acceptance checklist for Claude.
- Distinguish existing exported canon from proposed staging. Preserve names, levels, badge rewards and undecided mysteries. No engine, browser data, save or version changes.
- Verify cited source IDs/coordinates/content using a read-only browser inventory; all eight pages pass. README and one Session log line.

### T49: Wildbond, Sunthread and Farwatch build briefs (WB3.5 part 2)
- [x] Built by Codex, 2026-10-09; 73 live inventory/export/route checks and all eight pages pass. Documentation only, for Claude's build.
Why: Claude requested the final two area handoffs before their Godot builds; preserve existing exported canon and separate physical staging from new mechanics.
Read first: docs/COMMS.md, docs/lore/wildbond.md, docs/lore/wildbond-threads.md, Hollowecho brief, browser data/maps/sound/scene, docs/CREATIVE.md and docs/wildbond-plan.md.
Branch: codex/wildbond-final-area-briefs, from latest main.
- Write docs/lore/wildbond-sunthread-brief.md and docs/lore/wildbond-farwatch-brief.md in the Hollowecho brief shape: map/coordinates, people, ecology/encounters, clues/payoffs, heritage perspective, memorable moment, light/weather/music and acceptance checks.
- Gather existing canon only; mark recommendations as staging. No new clue, encounter, balance, engine/exporter, save or version changes. Preserve unresolved truths and all essential clues for every heritage.
- Verify against read-only live browser inventory and run all eight test pages. Note stale historical prose rather than silently retuning; README and one Session log line, message board handoff.

### T50: Wildbond seasonal data (WS3)
- [x] Built by Codex, 2026-10-09; PR #77. 526 new checks, all eight pages and actual export pass; Classic unchanged.
Why: Claude's calendar and seasonal looks need modest ecological changes and people noticing the season, without calendar-locked progress.
Read first: docs/COMMS.md, seasons-and-holidays proposal, wildbond thread ledger, canon and CREATIVE.
Branch: codex/wildbond-seasonal-data, from latest main.
- Add plain-JSON seasonal fields in browser species/maps data: four keyed seasonal wild tables per regional map, modest relative-weight changes, a few existing seasonal visitors rare out of season. No removed species, guardians or progress requirements.
- One seasonal line per townsperson for each season, with shared/base/badge/heritage lines retained; reserve festival writing for WS6. Keep essential clues shared and record any observations in the ledger.
- Document export schema and integration rules, check faded-season presentation against decided canon without revealing an undecided cause. Classic behavior, encounters, levels, rewards, saves and versions unchanged; no Godot or exporter edit.
- Files: games/wildbond/js/00-data.js, js/11-maps.js, tests/wildbond-checks.js, docs/lore/wildbond-seasons.md and thread ledger, normal claim/README/Session/message-board notes. Actual 39-table export and all eight browser suites pass.

### T51: Wildbond festival writing (WS6)
- [x] Ready in PR #78: writing/export handoff only; activities and cosmetic delivery remain WS5 integration.
Why: Claude's four Larkhaven decorations need traditions, voices and keepsake names, using his current calendar IDs.
Read first: seasons-and-holidays proposal, COMMS, T50 schema, thread ledger, CREATIVE and current Larkhaven data.
Branch: codex/wildbond-festival-writing, stacked after T50/#77.
- Four short traditions in docs/lore/wildbond-festivals.md; plain-JSON MAPS.larkhaven.festivals keyed planting/longlight/lanterns/midwinter. Include names, season, proposed-activity invite/completion text and cosmetic keepsake names/descriptions. No dates duplicated from the calendar.
- Larkhaven's Maren and Pip each get byFestival lines in the bySeason shape; preserve their base, badge, heritage and seasonal lines. No required clue or revelation exclusive to a date; ledger notes all added lore.
- Data/writing only in 11-maps.js and checks/lore/handoff docs; no engine, Godot, exporter, gameplay/save/version changes. Actual export, base preservation, readable scene previews and all eight suites pass.

### T52: Starfall member writing handoff (SF2.4a)
- [x] Writing ready in PR #79: twelve additive beats, existing six preserved, 640 content/path checks and Godot text measurements pass; integration remains Claude's.
Why: Claude requested three-beat arcs for Kaito, Hana and Sora and a third beat for Aki, Ren and Yuna. Evan's no-Godot-edit rule remains authoritative; supply additive data for Claude to merge into his stories file.
Branch: codex/starfall-member-writing, stacked after #78 for shared claim/handoff docs.
- Create docs/lore/starfall-member-stories.json containing only the twelve new beats, with append semantics documented in docs/lore/starfall-member-stories.md. Existing six beats must remain byte-for-byte untouched in Godot.
- Use the existing after_jobs/needs/lines/options/morale/coins/trait shape; only steady, bold, mapper and healer traits. No new effect handler, save key, class, building or asset. Short original voices and legible choices with plainly shown, bounded consequences; no positive coin windfall or permanent punishment.
- Validate against actual member/building IDs, increasing thresholds, all choices, economy and recoverable morale. Read-only inspect the Godot dialogue/choice surfaces; record previews without claiming integration. All eight browser pages stay pass. Normal claim/README/Session/COMMS only.

### T53: Wildbond league script and payoff map (WB4.4a)
- [x] Handoff ready in PR #80: 271 checks, 148 portrait previews, actual export and eight browser pages pass. Full mystery resolution is WB4.4b, pending the ledger decisions.
Why: Claude builds WB4.1 next and requested ending text from the ledger. Separate the usable league finale from the deeper revelations whose truths remain open.
Branch: codex/wildbond-finale-handoff, stacked after #79 for handoff/tracking documents.
- docs/lore/wildbond-finale.json copies six existing league encounters and the existing ending, plus a clearly optional short Larkhaven homecoming. docs/lore/wildbond-finale-brief.md maps staging, cast, battle order, callbacks, every thread's status and heritage fairness.
- Use current canon only. Record optional care-themed lines in the ledger. Do not invent the fading opponent, old pair, watcher identity or Unbound leader motive, or award depth restoration through a league win. A separate writer decision map records the unresolved reveals for later approval.
- Data/docs only; no engine/exporter/Godot/play/save/version changes. Check source equality, exact IDs/order/teams/map connectivity, real export and optional dialogue readability; all eight browser pages pass. Normal README/Session/COMMS handoff.

### T54: Wildbond Champion return conversations (WB4.4 content)
- [x] Ready in PR #81: 69 new browser checks, 101 source/export/staging/layout checks, 88 full-card previews and all eight suites pass.
Why: Claude's latest COMMS request, after WB4.1 shipped, asks for additive leagueAfter and post-Champion Warden speech that he can place inside the world.
Branch: codex/wildbond-champion-returns, stacked after #80 for shared ledger/handoff docs.
- Add SCENES.leagueAfter and STORY Warden entries' byStory.leagueEnding arrays in games/wildbond/js/00-data.js (Wardens are story actors, not static MAPS.npcs). Eight distinct short conversations; preserve all base, victory, badge and heritage lines. Append-only export fields; Classic behavior unchanged.
- Gate staging with clear standing positions in docs/lore/wildbond-champion-returns.md, using T53's payoff map. No new culprit, pair/watcher identity, leader motive or claimed depth restoration. Record every echo in the ledger.
- Add content checks in tests/wildbond-checks.js; verify source preservation, actual 39-table export and real portrait previews at four sizes. All eight pages pass. No Godot/engine/exporter/save/version changes; normal claim/README/Session/COMMS only.

### T55: Wildbond final-truth clue audit (WB4.4b part 1)
Why: Evan chose the account in the ledger, and Claude asks for a short reviewable audit before reveal dialogue.
Branch: codex/wildbond-final-truth-audit, from latest main.
- Write docs/lore/wildbond-final-truth-audit.md: inspect browser/exported and Godot-specific placed text, cover every ledger clue group, distinguish factual contradictions from attributed misunderstandings, list fixes or evidence gaps without rewriting player text.
- Propose exactly three shared late observations with location, evidence, competing explanations narrowed, accessibility for all heritages, and fair sequence after wild-bond discovery and before reveal. Observation proposals only, not dialogue, placed clues or new canon.
- Preserve the decided account and future hooks; identify any residual ambiguity explicitly rather than secretly deciding identity/fate. No runtime/Godot/exporter/save/version changes. All eight pages pass; source addresses verified, normal claim/README/Session/COMMS notes. Claude reviews this before part 2.
- [x] T55 audit ready in PR #82: all ledger groups, two chronology risks, one identity ambiguity and exactly three shared observation proposals. 56 source/reference checks and eight browser suites pass; no reveal dialogue or Godot edits.

### T56: Wildbond areas 5-8 and league pacing (WB3.6)
Why: Claude requests expected team levels for Halen, Rysa, the courts and Avenne, using current Godot rules.
Branch: codex/wildbond-late-pacing, stacked after T55 from current main.
- Add a reproducible diagnostic outside wildbond-godot: copy the current unmodified battle/rules/figures and exported data to a disposable project, drive actual battles and XP, never use player saves or write into Godot/play.
- Record current teams/caps and compare ordinary entry-level teams, several seeded potential/trait rolls and a lower-powered team. Model the two route trainers, current staged story fights and wild training in areas 5-8; record before/after levels, defeats and wild wins needed, not invented human completion hours. League uses actual full rests between courts and resets on loss.
- Include a no-extra-training route to expose deficits, and a bounded train-to-ace policy to measure the grind needed. Label synthetic starting fixtures, command policy, evolution, missing systems and differences from Classic. Verify browser/export/Godot data and numeric rules; report drift instead of silently assuming parity.
- Write docs/wildbond-godot-pacing.md plus machine-readable results under docs/measurements; tests/tools may be new or changed. No gameplay tuning, engine/preview/save/version edits. All eight browser pages pass. Normal README/Session/COMMS/project/queue/path notes; open PR, never merge.
- [x] T56 ready in PR #83: 24 entry benchmarks, six continuous direct routes, four train-to-ace journeys, raw results and copied-input hashes. 79,732 diagnostic checks and all eight browser suites pass. Deeptide cooldown stalls handed to Claude; no engine/gameplay tuning.
### T57: Starfall seasons one to four (SF3.3)
Why: Claude asks for four outlines in docs/plans/starfall-village.md using the shared calendar's existing festival timings.
Branch: codex/starfall-season-outlines, stacked after T56 because planning notes overlap.
- Append four original chapter outlines to docs/plans/starfall-village.md: one threat, one named shared-calendar festival and one newcomer each. Include street staging, active guildmaster actions through existing places, a meaningful recoverable choice and a visible aftermath.
- Preserve current cast, six member arcs, earned staffing, recovery and no-windfall economy. Distinguish new proposals from implemented systems, chapter readiness from calendar dates, and shared-calendar day length from Starfall's existing service/wage day. No new mandatory calendar waits or missable essential story in real/held modes.
- Include a smallest-first build order and acceptance checks for Claude; no final dialogue arrays or engine/save/economy edits. Change only the plan plus normal ticket/project/queue/path/README/Session/COMMS notes. All eight browser test pages remain passing; no versions or Godot/play edits.
- [x] T57 outlines ready in PR #84: four threats/festivals/newcomers, recoverable decisions, no mandatory calendar waits; shared timing and service-day distinction verified. All eight browser pages pass; docs only.

### T59: Realmbound waits for the reader (RB1.5 / GR-10)
- [x] Built by Codex, 2026-10-09, PR #98; awaiting review.
Why: first-time readers must not see fallback take over while learning their first errand.
Branch: codex/realmbound-opening-polish, from latest main.
- Pause every opened portrait conversation; no automated dialogue choices, QuestHelper rewards or background hunting behind it.
- Focus fallback waits until the first victory, then keeps the existing fifteen seconds. Explicit Auto remains a player choice; HUD and combat use the same predicate. Preserve basic attacks and old saves without new save fields.
- Move the sun/cloud details clear of the title and health frames, with finer sky pixels. Browser Realmbound only: combat, world UI, scenes, onboarding, quest helper, offline-state and ambience hooks; regression scenarios and four-size screenshots.
- Run tools/run-all-checks.cjs; add normal changelog, Session, path and COMMS notes. No versions, Godot, preview or shared-engine changes; never merge.

### T58: Wildbond, the three late observations and the reveal (WB4.4b part 2)
- [x] Writing ready in PR #101, Codex, 2026-10-09; 53 lines, 159 shared portrait previews and all ten suites pass. Claude places it.
Why: Claude accepted T55's three observations and settled its open calls (ledger, "Claude's review of T55"); the ending
needs its words before Claude places them in Godot (WB4.3 part 2).
Branch: codex/wildbond-reveal, from latest main. Claim with a draft PR titled "T58".
- Write docs/lore/wildbond-reveal.json (with a short .md beside it): for each observation, the inspection text (what you
  see, in the world's words, a few short lines), and optional lines for Orri, Ceryn and Sivet plus one each for Maren
  and Wren when you tell them. Every heritage sees the same evidence.
- The reveal conversation: after the league and the Champion returns, at the warm pocket in Hollowecho (default; propose
  a better place if the clues want one), with Toren, Isolde and your partner. It connects coercion, memory loss, the
  turned friend, the joining and common roots, and lands the irony (the old order and the modern Unbound both reject
  the bond; the answer is friends who choose each other). Keep open: the old pair's fate, entity fragments, Veilmote's
  nests, Tobin's sighting. The watcher was the turned friend, now asleep in the warm pocket (Evan decided, 2026-10-09).
- The depth restoration moment (narration, three to five lines) and one line from each of the eight Wardens afterwards.
- Follow CREATIVE.md "Writing for players" and "Stories are woven": no new names for the entity or the order, no
  game-rule words. Docs/data only; no Godot, engine or save changes. All eight browser pages pass; normal README,
  Session log, COMMS and queue notes.

## Priorities
1. **Realmbound** is the flagship. Everything else is parked until it reaches level 60.
2. **The creature system** is next: built once as a shared module, used by Realmbound pets/mounts and by a
   standalone creature game (capture, raise, breed hybrids, race and battle; common to mythical).
3. Parked: Primordial, Starfall Guild, Diamond Career (baseball), Otherworld (isekai). See docs/ideas.md.

## Research and future upgrade plans

See [docs/plans/README.md](plans/README.md) for comparable-game research, staged plans for each game, the expanded sports career/lifestyle direction, manual-to-automated controls, and tonight's desktop checklist. These are proposed milestones, not newly approved gameplay tickets. Desktop and phone are the current targets; VR is deferred. Keep existing ticket ownership and parked status until Evan changes them.

## Who does what
- **Claude:** specs and design decisions, new systems with tricky game feel (creatures, raids, guilds),
  balance passes, anything that changes the save format, reviewing and merging PRs.
- **ChatGPT/Codex:** refactors with no behavior change, content written to a spec (zones, quests, enemies,
  items, dialogue), test tooling, bug fixes from the list below.

## Tickets
- [x] **T0: Split Realmbound into small files** (ChatGPT). No behavior change. See HANDOFF.md.
- [x] **T1: Specs for levels 40-60, raids and the guild** (Claude): [docs/realmbound-40-60.md](realmbound-40-60.md),
  done 2026-10-07. Follow-ups in its build order: T1-A (Claude, second talent trees and roles), T20 and T21
  (ChatGPT, below), T1-B, R1, T22/T23, guild and raid.
- [x] **T1-A: Second talent trees, roles from your build, respec** (Claude, done 2026-10-07).
- [x] **T1-B: Grave Chill in the Silent Barrows, pacing 40-45 measured** (Claude, done 2026-10-08).
- [x] **T20: Realmbound Frostmere II, The Barrowfields and The Silent Barrows** (ChatGPT, data): see the T20 section.
- [x] **T21: Realmbound item name tiers to level 60** (ChatGPT, data + one formula): see the T21 section.
- [x] **T22: Realmbound Hollow Crown, part 1** (ChatGPT, data): see the T22 section.
- [x] **T23: Realmbound Hollow Crown II, the Crown's Heart** (Codex): content, Key gates and pacing done; owner kept the strict file list, so the missing locked-quest UI reason is documented for follow-up in the PR.
- [x] **T24: Wildbond checks for the newer systems** (ChatGPT, tests only): see the T24 section.
- [x] **T25: Split Starfall Guild into small files, add a test page** (ChatGPT, no behavior change): see the T25 section.
- [x] **T26: Starfall Guild sound on the shared sound system** (Codex): see the T26 section; original town, delve and boss themes, guarded effects and browser checks.
- [x] **T2: Creature game spec + shared creature module plan** (Claude). See docs/creature-game-design.md.
- [x] **T3: Content for levels 30-40** (Codex): Frostmere, The Winter Road. See
  [chapter specification](realmbound-winter-road.md). Evan authorized the narrow progression spec while Claude
  was unavailable; T1's remaining 40–60, raid and guild design stays open.
- [x] **T4a: Shared creature module + Wildbond part 1** (Claude): starters, rival, Thornwood, capture, 3v3 command
  battles, evolution, Warden and badge, art-era system (Pixel only). Done 2026-10-08.
- [x] **T4b: Wildbond part 2** (Claude): ranch days (food, training regimens, fatigue, injury, mood), breeding barn with
  inherited genes, pedigree and 3 discoverable hybrids, biome travel (for T6). Done 2026-10-08.
- [x] **T5: Wildbond 16-bit art era** (ChatGPT): a new `ART.bit16` in games/wildbond/js/01-art.js with the same three
  functions as `ART.pixel` (creature, backdrop, tamer). Finer sprites, shading, outlines. Unlocked by the Thorn Badge
  (add 'bit16' to S.eras when the badge is earned). Gameplay files must not change.
- [x] **T6: Wildbond second biome, data only** (ChatGPT): add **Saltmarsh Coast** to `BIOMES` in
  games/wildbond/js/00-data.js (levels 10-18, `req: 'thorn'` so it opens after the Thorn Badge, its own sky/hill/ground
  colors and a wild table) and 8-10 new species to `SPECIES` using only the existing families (wolf, boar, cat, hyena,
  lizard, croc, spider, horse, bird, sprite) and elements. Include at least one two-stage evolution line (with `evo`),
  one rare species (low weight in the wild table) and one unique legendary-style species with `unique: 1` that is not
  in the wild table. Each species needs base stats (sum about 300 for basic forms, 420 for evolved), a learnset using
  existing MOVES only, and a one-line `dex` entry. Data only: change no other file. Claude adds biome travel in T4b.
- [x] **T7a: Wildbond real-game feel, part 1** (Claude): dialogue scenes with portraits and typewriter text for
  every story beat (09-dialogue.js, CAST/SCENES/`lines`/`win` in 00-data.js), battle animation (slide-in, lunge,
  flinch, element sparks, crit shake, faint, victory hop), chiptune sound effects and per-area music made live with
  Web Audio (10-sound.js, off by default). Done 2026-10-08.
- [ ] **T8: Game guides** (ChatGPT) — **unparked 2026-10-07** (Wildbond and Realmbound first; docs/QUEUE.md A4). Was parked so guides wouldn't need constant
  rewrites. Spec kept below. Meanwhile, keep lore written down in each game's design doc as it's added.
- [ ] **T9: Wildbond guide** (ChatGPT) — unparked with T8 (docs/QUEUE.md A4).
- [x] **T11: Wildbond pacing overhaul** (Claude): levels 1-100, journey length (Breezy/Classic/Long Road),
  badge level caps (soft/hard/off), XP share toggle, Saltmarsh Warden + Tide Badge, Saltmarsh/Emberfall rescaled.
  Done 2026-10-06. See "Pacing, level caps and journey settings" in docs/creature-game-design.md.
- [x] **T11b: Challenge modes and rematches** (Claude, done 2026-10-07; ranch cosmetics for titles still to come): Nuzlocke/Randomizer/Solo/Hardcore at a new game,
  Warden and Wren rematch tiers, area mastery stars.
- [x] **T13 part 3** (Claude): the Diorama era (Ember Badge): the same maps as a voxel model in three.js, sprites
  extruded into voxels, an orbiting camera; riding your lead creature. Done 2026-10-07. Modern 3D and VR later.
- [x] **T13 part 2** (Claude): the HD-2D era (Tide Badge): perspective view of the same maps with standing sprites,
  haze, depth of field and light; weather that changes spawns; wild creatures you can see in the grass. Done 2026-10-06.
- [x] **T13 part 1** (Claude): the Pocket era to start, color returning with the Thorn Badge, running shoes,
  day/night clock, era-aware townsfolk. Done 2026-10-06. Parts 2 (HD-2D) and 3 (Diorama) follow.
- [ ] **T13: Era progression in the world** (Claude, after T7b): Pocket (Game Boy) → 16-bit → HD-2D → voxel
  Diorama → modern 3D → first-person/VR, each with era-matched mechanics and story beats. See "Eras you walk through"
  in docs/creature-game-design.md. T7b must keep the tile map separate from the renderer.
- [x] **T7b part 1: Walkable world** (Claude): top-down tile maps for Larkhaven, Thornwood, Saltmarsh Coast and
  Emberfall (games/wildbond/js/11-maps.js, data only); walking by keys or tap (12-walk.js); tall grass finds wild
  creatures; inn, shop and Maren's ranch you walk into; townsfolk and Wardens standing in the world; Auto-explore
  walks the grass. Drawn through `ART[era].tile/walker`. Done 2026-10-06.
- [x] **T7b part 2** (Claude): route trainers who spot you, items on the ground, your lead creature following you,
  signposts. Done 2026-10-06. Later: more townsfolk; the menu shortcuts (Rest, Buy lures, Travel) can retire.
- [x] **T10: Wildbond third area, data only** (ChatGPT): see the T10 section below.

- [x] **T12: Realmbound lore pass** (ChatGPT): see the T12 section below.
- [x] **T14: Wildbond lore bible and region outline** (ChatGPT, docs only): see the T14 section below.
- [x] **T15: Emberfall Warden and badge, data only** (ChatGPT): see the T15 section below.
- [x] **T16: Wildbond browser checks** (ChatGPT, tests only): see the T16 section below.
- [x] **T17: Wildbond area 4, Cloudglass Pass** (built by Claude 2026-10-08 after the ChatGPT run never arrived; see the T17 section below).
- [x] **T29: Wildbond area 7, Sunthread Commons** (Codex): content, gathering map, original tune, meadow battle backdrop and browser checks; see the T29 section.
- [x] **T28: Wildbond area 6, Hollowecho Hills** (Codex): content, winding map, original tune and browser checks; see the T28 section.
- [x] **T27: Wildbond area 5, Stillreed Basin** (Codex): content, walkable map, weather, original tune and browser checks; see the T27 section.
- [x] **T19: Promo pages for friends** (ChatGPT, pages only): see the T19 section below.

### T19: Promo pages for friends (pages only)
`promo.html` (linked from the hub) is a "game box back cover" for Realmbound, but it's out of date: it lists Wildbond
as "Creature game · Planned" and doesn't know Realmbound reaches level 40. Bring it up to date and give Wildbond
its own. **Change only `promo.html`, a new `promo-wildbond.html`, and the hub `index.html`** (the Wildbond and
Realmbound entries in its `GAMES` list, and a promo link like the existing one). Don't change games/, shared/ or
docs other than ticking T19 here. Claude is working in games/wildbond/ meanwhile.
- **promo.html (Realmbound):** update facts from the game and README (levels to 40, Frostmere and the Winter Road,
  Hushfang, the lore pass: quest givers who answer when you turn in). In "Also in the arcade", replace "Creature game
  · Planned" with **Wildbond** (status like the hub's "Early access") linking to promo-wildbond.html.
- **promo-wildbond.html:** same idea and structure (title, a short pitch, "What's in it today" feature cards, "Where
  it's headed", play button to games/wildbond/), with Wildbond's own look: reuse the hub's Wildbond colors and fonts
  (Fredoka/Nunito), not Realmbound's bronze. Cover, in plain words for friends: picking a partner and your rival
  Wren; walking a real world (towns, tall grass, trainers who spot you, items, riding your partner); catching with
  lures and timing; raising, training and breeding on the ranch (hybrids, potential grades); Wardens and badges that
  raise your level cap; choosing your journey length; the world's look growing with the story (a faded handheld
  start, color, then light and depth, then a little 3D diorama you can turn); day/night, weather, music. "Where it's
  headed": more regions, contests and races, challenge modes. Facts must match the game: read README.md's changelog
  and games/wildbond/js/00-data.js, don't invent features. A small live scene at the top is welcome if it stays
  simple (a canvas drawing a couple of creatures and the tamer like the hub covers do); no screenshots needed.
- Plain HTML/CSS/JS, no build, readable at phone width (16px side gutter, no sideways scrolling), light and dark
  are both fine. Check both pages and the hub at http://localhost:8765/ (serve.ps1).
- [x] **T18: Wildbond music for every place** (ChatGPT, sound only): see the T18 section below.

### T18: Wildbond music for every place (sound only)
Wildbond's chiptune music (games/wildbond/js/10-sound.js) has tracks for Thornwood, the Saltmarsh, battles, trainer
battles and legendaries, written as note strings and played live by Web Audio. Give every place and moment its own
tune. **Change only games/wildbond/js/10-sound.js** (plus ticking T18 here). Claude is building the Diorama era
in other files, and T17 is editing 00-data.js and 11-maps.js.
- **New tracks** in `TRACKS`, same format (one 8th note per token, `.` = rest, `mel` and `bass` the same length,
  `bpm`, optional `shift`): `larkhaven` (cosy home town, gentle), `emberfall` (warm, a bit adventurous, highland
  air), `cloudglass` (airy, high, a little lonely; T17's area 4 uses the biome id `cloudglass`), `warden` (a Warden
  battle: proud and serious, faster than `trainer`), `night` (a soft, slower variant for any area at night) and
  `rain` (a calm, steady tune for rainy weather). Each melody 32-64 tokens, original (never copy real songs), and
  musical: stay mostly in one key, end in a way that loops smoothly back to the start.
- **Choose them** in `musicKey()`: Warden battles (`B.story` is a beat with `gate`, look it up in `STORY`) play
  `warden`; in town (`S.pos` on a map with no `biome`) play `larkhaven`; out in an area, `night` when `isNight()`
  is true, otherwise `rain` when `weatherNow() === 'rain'`, otherwise the area's own track if it has one. Both
  `isNight` and `weatherNow` already exist (12-walk.js); call them only when `S.pos` is set.
- **Voices:** add `vessa` (T17's Warden) and the route trainers in 11-maps.js (`bram`, `lise`, `cato`, `marit`,
  `orsk`, `sela`) to `VOICE`, each a pitch in Hz that suits the character (dialogue blips).
- **Check:** serve the repo (serve.ps1), open http://localhost:8765/games/wildbond/, set Sound to "Effects + music"
  with the header button and listen in town, Thornwood and a battle; `tests/wildbond.html` must still pass.

### T17: Wildbond area 4, Cloudglass Pass (data + map)
Build area 4 from the "Area 4 proposal: Cloudglass Pass" in docs/lore/wildbond.md (Evan approved it by sending
this ticket). **Change only games/wildbond/js/00-data.js and games/wildbond/js/11-maps.js** (plus ticking T17 here
and adding Cloudglass to docs/lore/wildbond.md as canon). Claude is building the HD-2D era in other files meanwhile;
in 00-data.js don't touch `ERAS`, `JOURNEY` or the cap constants.
- **00-data.js:** `BADGES.beacon` (Beacon Badge); a `CAST.vessa` speaker (Warden Vessa, 'Warden of Cloudglass Pass';
  `hair` one of short, long, bun, spiky, hat); `BIOMES.cloudglass` with `lv: [32, 42]`, `req: 'ember'`, its own
  `sky`/`hill`/`ground` colors (misty, pale rock) and a wild table; 8-10 new `SPECIES` mixing Gale birds and horses,
  Stone cats and spiders, Radiant sprites, with the T6 rules (existing families, elements and `MOVES` only; base
  stats about 300 basic / 420 evolved; a one-line `dex`), one two-stage evolution line (`evo.at` 40 or lower), one rare
  species (low weight) and **Lanterncrest** (Radiant bird, `unique: 1`, `big: 1`, not in the wild table).
- **STORY** (after the Emberfall beats, same shape as theirs, `biome: 'cloudglass'`): a Wren rematch at 6 following
  the lore's Wren beat (`team` ending `['$rival', 39]`, levels 37-39); the Lanterncrest encounter at 14
  (`wild: ['lanterncrest', 41, 4]`); Warden Vessa at 24 (`gate: 'beacon'`, `trainer: 'Warden Vessa'`, team at levels
  41, 42, 44, judging asking for help and sharing responsibility). Each with `title`, `text`, `lines` (3-4), `win` (2-3).
- **11-maps.js:** a new `MAPS.cloudglass` (`name: 'Cloudglass Pass'`, `biome: 'cloudglass'`), about 30 wide and 14
  tall, using only the tile letters in the legend at the top of the file (rock `R` edges suit a mountain pass), with
  tall grass patches, a path, an `S` exit at the bottom back to Emberfall, `start`, `warden` spot, one signpost (`P`
  + `signs`), three `items`, and two route trainers (`npcs` with `trainer`, teams at levels 34-40, short warm
  dialogue like the existing ones; add their speakers to the `Object.assign(CAST, ...)` list in that file).
  **Emberfall gets a way up:** change Emberfall's row 0 columns 13-14 from `RR` to `NN` and row 1 columns 13-14 from
  `RR` to `..`, and add `N: { to: 'cloudglass', x: <arrival x>, y: <arrival y>, dir: 'up', locked: '<a line about
  needing the Ember Badge>' }` to Emberfall's `exits`. The Cloudglass `S` exit returns to Emberfall at x 13, y 1.
- **Check:** serve the repo with serve.ps1 and open http://localhost:8765/tests/wildbond.html: every check must pass
  (it validates maps, exits, NPC spots, speakers and moves). Then play it: give a save the first three badges with
  `window.__wb` on http://localhost:8765/games/wildbond/, walk north out of Emberfall, and make sure the pass, its
  trainers, items and Warden work and the Beacon Badge raises the level cap to 55.

- [ ] T32 open for ChatGPT on `codex/wildbond-area-light` (G2, every other Wildbond area).
- [x] T33 merged 2026-10-08 by Claude (Wildbond v1.6.0, PR #43).
- [x] T34 implemented by Codex on `codex/diamond-career-d0`, PR #45 ready for review (2026-10-08; not merged).

- [ ] T41-T44 open for ChatGPT (2026-10-08, late night), after T36-T40 (all merged). Read PROJECTS.md "Read first".

### T41: Realmbound in the game window, part 2 (pages become places)
Follows docs/plans/realmbound-in-window.md "Follow-ups" (T38). Branch `codex/realmbound-window-2`.
- [x] Built by Codex, 2026-10-08; PR #67 submitted for review, not merged. See the plan for checks and screenshots.
- Replace notebook pages with their physical interactions, one at a time, only when each is ready, never removing the
  old route before its replacement exists: the **guild** happens in the walkable guild hall (members where they stand,
  the jobs board you walk to), the **trainer and talents** with the trainer in town, the **stable** for pets and mounts.
- Quest givers speak in place (portrait scenes over the world, not a page). Phone to ultrawide; old saves load; all
  eight test pages pass; before/after screenshots.

### T42: Otherworld, memories that matter across lives (O2)
- [x] Built by Codex in PR #69 (2026-10-08), ready for review; no version bump. See docs/otherworld-memories.md.
docs/otherworld-design.md ("A life, step by step" 7, "Rebirth", and the "Not predetermined" direction: systemic
first). Branch `codex/otherworld-memories`.
- Each memory the soul carries changes something real in other worlds: a choice that only appears because you
  remember, a person who reacts, a rule that bends (a remembered song calms a spirit in Hearthmere and a beast in
  Asterhold). Start small: every existing memory gets at least one effect in another world.
- **Toward a systemic world:** give two or three people in each world a want, a grudge or a debt that persists and
  changes what they do across that life (no AI, authored rules). Words, not meters; checks in tests/otherworld.html.

### T43: The creature catalogue reaches Realmbound (data, then names on screen)
- [x] Built by Codex in PR #70 (2026-10-08), stacked after T41/PR #67; ready for review, no version bump. See docs/lore/catalogue.md's T43 record.
docs/lore/catalogue.md (T37's Reach beast mappings) and docs/proposals/creature-catalogue-and-evolution.md §1. Branch
`codex/catalogue-realmbound`.
- Complete the mapping for every Realmbound zone and dungeon beast. Where a mapping is clean, Realmbound shows the
  catalogue creature's name and a one-line description in its world's voice (a Realmbound hunter's view of a
  Wildbond creature), without changing combat numbers. Old saves load; tests/run.html passes.

### T44: Accessibility pass on the browser games (L10)
- [x] Built by Codex, 2026-10-08; PR #71 for review, not merged. Verified fixes and remaining limitations: docs/accessibility.md.
docs/accessibility.md. Branch `codex/accessibility`.
- Keyboard play everywhere (Realmbound, Diamond Career, Otherworld, the arcade launcher), visible focus, colour
  contrast at least AA for text, readable sizes with the shared text-size setting, labels for screen readers on
  buttons and scenes, reduced motion respected. A short report of what was fixed and what remains.

- [x] T38-T40 merged 2026-10-08 by Claude (PR #62-#64; Realmbound v1.6.0, Otherworld v0.3.0, Wildbond v1.8.0).

### T38: Realmbound in the game window (the plan, then part 1)
- [x] Plan and part 1 ready in PR #62 (Codex, 2026-10-08): world viewport, carried Journal/Satchel, all existing feature routes retained; 25 new scenarios and all eight pages pass; before/after at four widths. No release bump.
Evan, 2026-10-08: every game happens in the game window (CLAUDE.md); Realmbound stays in the browser for now. Branch
`codex/realmbound-window`.
- **First a plan** in `docs/plans/realmbound-in-window.md`: every panel Realmbound shows today (quests, bags,
  character, guild, the Road guide, the jobs board, settings) and where each goes in the world: people who speak in
  place, things you open over the scene (a quest journal, a satchel), a thin overlay for health and resources. Keep
  every feature reachable; phone (375 wide) to 3440 ultrawide. Use Wildbond Godot's field book and Starfall's board
  as the reference for "things you hold" (screenshots in images/play/).
- **Then part 1:** the world scene fills the window, and the quest log and bags open over it. Old saves load; all
  eight test pages pass; README entry; before/after screenshots at four widths.

### T39: Otherworld, Hearthmere (the second world)
- [x] Ready PR #63 (Codex, 2026-10-08): four endings, gifts with costs, winter scenes, cross-world memories; all eight pages pass; docs/otherworld-hearthmere.md.
docs/otherworld-design.md (the Hearthmere row and "Order" step 3), with what T35 built: visible locked choices with
reasons, gift costs that bite, a town that changes with your choices, the Archivist answering memories. Branch
`codex/otherworld-hearthmere`.
- A complete life in Hearthmere: the shuttered lakeside inn, Puddle the shy water-spirit in the well, the long winter
  that will close the passes; the three gifts (Hearth Cooking, Spirit Speech, Green Thumb), each with a cost that bites
  once. Cosy, slow, with real stakes (the winter). At least four endings, memories that carry into other worlds.
- Scenes drawn in code in Hearthmere's own style (soft greens, lantern light). Words, not meters. Checks in
  tests/otherworld.html; old saves load.

### T40: Wildbond areas 5-8, woven clues, signs and chatter (data and lore)
- [x] Ready PR #64 (Codex, 2026-10-08): four witnesses, signs and Warden clues, four small badge payoffs and 16 exportable heritage reactions. Every clue in the ledger; all eight suites pass. Godot dispatch remains Claude's.
Read docs/lore/wildbond-threads.md (the ledger) and docs/lore/wildbond.md ("Decided for future writing": the wild bond,
the fading, which also took the valley's depth, the Unbound, heritages). Branch `codex/wildbond-threads-5-8`.
- For Stillreed Basin, Hollowecho Hills, Sunthread Commons and Farwatch Reach, write into the browser game's data:
  signs, townsfolk chatter and a few NPC lines that place fair clues for threads 1 to 5 (keep at least two candidate
  truths alive), a small thread paid off in each area, the first hints of the Unbound (people who free creatures,
  misreading the old fight), and lines that react to the player's heritage where it fits.
- Record every clue in the ledger. Data only (no screen changes); this flows into the new Wildbond through
  tools/godot-export.ps1 when Claude builds those areas. tests/wildbond.html stays all-pass; README entry.

- [x] T35 merged 2026-10-08 (Otherworld v0.2.0). [ ] T36, T37 open for ChatGPT (2026-10-08, after its reset): one branch and PR each, stacked if needed.
- [x] T35 merged (Otherworld v0.2.0); T36 and T37 merged 2026-10-08 (Diamond Career v0.4.0, Wildbond v1.8.0).

### T35: Otherworld O1, a living Lanthorn (moved from Claude's lane; Claude is in Godot)
- [x] Implementation ready in PR #58 (Codex, 2026-10-08); 831 Otherworld checks, all eight pages pass. Review/version bump remain Claude's. Details: docs/otherworld-lanthorn.md.
Read docs/otherworld-design.md, docs/research/otherworld-first-life-review.md ("Proposed ticket: O1", whose defaults
Evan's rules already settle), docs/CREATIVE.md "Writing for players" and the in-window rule in CLAUDE.md. Branch
`codex/otherworld-living-lanthorn`.
- **Locked choices show**, greyed, each with a one-line reason in the world's words (add `why` beside `need` in the
  data): "You'd need to have seen the truth of him", never numbers.
- **Every gift's cost bites once.** Appraisal: someone feels you reading them and shuts a door that would otherwise
  open. Pocket Space: Corvin asks you to carry something you shouldn't; refusing has a price, so does agreeing.
- **The town moves.** Lanthorn tracks two needs over the days before the tide (food and fear). People's lines, prices
  and who will help change with them, and your choices push them up or down. Authored lines chosen by the state; shown
  in the scene (a busier or emptier market, shutters, a queue at the well), not as meters.
- **The Archivist** reacts lightly to the memories you carry (a written line per memory).
- Checks in tests/otherworld.html for each; old saves load; all test pages pass; bump Otherworld's version.

### T36: Diamond Career in the game window, and a road trip (part 3)
- [x] Ready in PR #59 (Codex, 2026-10-08); all eight pages pass, Diamond Career 122. Four widths checked; version bump remains Claude's. docs/diamond-career-world.md.
Evan, 2026-10-08: every game happens in the game window (CLAUDE.md "In the game window"). Branch
`codex/diamond-career-window`.
- **The screen is the world:** the ballpark, the clubhouse and the home/garage scenes fill the window. Stats, the
  calendar, contract and ledger become things in the world (the scoreboard, a locker with your contract taped inside,
  a wall calendar in the clubhouse, a notebook from Iona) or a thin overlay, not panels beside the scene. Keep every
  existing feature reachable; phone (375 wide) to 3440 ultrawide; muted by default.
- **A road trip:** the second month opens with three away series in three fictional towns, each with its own ballpark
  look (a seaside park, a mountain park, an old brick downtown park) and one local character who remembers you if you
  come back next season. Travel is a short scene on the team bus, with one choice per trip that matters a little
  (rest, study film, or join the card game: rest helps stamina, film helps reads, cards help clubhouse standing).
- No windfalls; salary on the calendar as now. Checks in tests/diamond.html; old saves load; bump its version.

### T37: The shared creature catalogue, batch 2 (data and lore)
- [x] Data and lore ready in PR #60 (Codex, 2026-10-08): fourteen species, three three-stage lines, authored Saillet branch, three never-evolvers, 31 Reach beast mappings; Wildbond 1,485 and all eight pages pass. Godot export/branch activation and version bump remain Claude's. See docs/lore/catalogue.md.
Read docs/proposals/creature-catalogue-and-evolution.md (sections 1-2, "Order" step 2) and the evolution rules
(Godot `wildbond-godot/data/evolution.json`: branches, three-stage lines, conditions, never-evolvers). Branch
`codex/creature-catalogue-2`.
- **Twelve to fifteen new creatures** for the browser Wildbond data (games/wildbond/js, like W11 batch 1): fill empty
  family and element pairs; include at least two three-stage lines, one branching line (with its condition written as
  a place, a trust level or a companion, e.g. "raised beside a Glimmerwing"), and one creature that never evolves and
  says why in its dex line. Each with a dex line in the world's words and where it lives.
- **Realmbound's beasts from the catalogue (data only):** a table in a new `docs/lore/catalogue.md` mapping each
  Realmbound zone's beasts (wolves, boars, spiders, drakes and so on) to catalogue creatures, with any new catalogue
  entries they need. Don't change Realmbound's code yet.
- Running `tools/godot-export.ps1` afterwards is Claude's job; note in the PR which species are new. tests/wildbond.html
  stays all-pass; bump Wildbond's browser version.

### T34: Diamond Career, part 1: the first call-up and the first payday (D0 + the start of D1)
Evan (2026-10-08) unparked the sports game. Read docs/plans/diamond-career.md, docs/plans/sports-careers.md,
docs/research/decisions.md (top entry: his answers), docs/wildbond-plan.md (the principles: games feel like games;
they apply to every game) and docs/CREATIVE.md. You have creative freedom (names, the fictional league, writing); put a
"Design" section at the top of the PR. Original fictional clubs and players only.
- **A new browser game** in `games/diamond-career/` (index.html, style.css, js/ in numbered files like the other
  games), using shared/engine.js (saves, with `Arcade.validators` and `Arcade.saveToolsHTML`), shared/settings.js
  (Settings.create with its own rows), shared/sound.js, shared/feedback.js. Save key `diamond-career-save-v1`.
- **The player:** a short creator (name, bats left or right, a few looks), position: a batter. A fictional development
  club and a short series (about six games).
- **At-bats in both styles (Evan's choice), switchable in Settings:** *Timing*: the pitch comes in and you swing at
  the right moment (keyboard, mouse and touch); *Tactical*: read the pitcher and choose patience, contact or power and
  a guess at the pitch; your stats and the read decide the result. Manual play improves the odds, never guarantees a
  home run. Count, outs, bases and scoring always correct; the result explained in plain words ("you were early on
  the change-up"). Key moments are played; the rest of each game simulates from the same model, with a short summary.
- **The first payday:** after the series the coach evaluates you against visible thresholds; two contract offers with
  a real tradeoff (more money vs more playing time); a salary ledger paid on the calendar; a first purchase in a small
  **home/garage scene** (a better apartment or a first car), never mandatory upkeep.
- **Feels like a game, not a form:** the at-bat is a ballpark scene drawn in code (the pitcher, the ball, your batter,
  the crowd), with the count, outs and bases as a scoreboard in the scene; between games, a clubhouse or home scene.
  Readable on a phone and a 3440x1440 ultrawide.
- **The arcade:** add Diamond Career to the hub's `GAMES` list (status "Prototype", a cover) and give it a place in
  launcher/launcher.js: on the road it is currently a building site (`drawSite`); when it gets an `href`, add a
  `DRAW` entry (a small ballpark) so the road and the living world draw it, and a hall cabinet screen via its cover.
- **Checks:** a new tests/diamond.html (count rules, walks and strikeouts, outs and innings, runners and scoring,
  simulation totals over many games, both batting modes, contract and salary ledger, purchase, save and reload,
  old/empty saves). All test pages pass. Don't bump other games' versions.


### T33: Wildbond creature variants (W14)
Evan (2026-10-07): "it would be cool for some creatures, even though they're the same creature, to have some unique
looks, like Pokémon has shiny, huge, tiny, and a creature with random spot patterns... a little variety in some cases could be cool and intriguing."
Read docs/wildbond-plan.md (the principles) and docs/CREATIVE.md; you have creative freedom on names, rates and looks.
Put a short "Design" section at the top of the PR.
- **Three kinds of variety, all cosmetic (never stronger or weaker):**
  1. **A rare shimmering colour** (our "shiny"; name it to fit the lore, e.g. *Gleaming* or *Dawn-touched*: a
     creature the faded world remembers in full colour), about 1 in 200 wild encounters, with a sparkle when it
     appears in battle and in the world.
  2. **Sizes**: *tiny* and *huge*, each about 1 in 25, drawn smaller or larger (and shown in the Wilddex with a
     size note).
  3. **Markings**: for a few families with patterns (cats, hyenas, spiders, birds...), each creature gets its own
     seeded pattern of spots or stripes, so no two look quite alike (like a creature with random spot patterns).
- **Where it lives:** an optional `c.variant` field (missing = ordinary, so old saves are unchanged), rolled in
  `newCreature` for wild creatures and eggs; breeding can pass a variant on at a small chance. Starters and story
  guardians are ordinary unless you have a reason. Drawn in every art era (Pocket, Pixel, 16-bit, HD-2D, Diorama):
  most creature drawing goes through `ART[era].creature` in 01-art.js and is reused by 13-hd.js and 14-diorama.js.
- **The Wilddex** records which variants you've seen and bonded (a small field in `S`, with defaults), and a creature's
  card shows its variant in words ("Gleaming, huge"). Keep the UI change to a small helper (for example
  `variantLabel(c)`) and a line on the card and the Wilddex entry: **Claude is rebuilding Wildbond's layout, battle
  screen and menus (docs/wildbond-plan.md phases 1-4), so don't restyle or restructure 05-ui.js, 06-scene.js,
  index.html or style.css**; put new code in a new file (e.g. js/19-variants.js) where you can.
- **Checks:** rates within a sensible band over many rolls, old saves load unchanged, variants survive save/load and
  breeding, every era draws them without errors, sizes stay readable, cosmetic only (stats identical). All test
  pages pass (tests/wildbond.html, run.html, starfall.html, sound.html, offline.html). Don't bump versions (Claude does).

- [x] Saltmarsh lighting merged 2026-10-07 by Claude (Wildbond v1.3.1, 1194 checks).

### T32: Wildbond lighting for every other area (G2)
Your Saltmarsh pass (docs/saltmarsh-lighting.md) added optional `AREA_AIR` settings in 06-scene.js (`fogTop`, `mist`,
`dawnFog`, `mistFx`, `nightCol`, `grade`, `shafts`, `bounceSky`, `bounceGround`). Give each remaining place its own
character the same careful way, in one PR: **Thornwood** (green woodland light through leaves, soft morning haze),
**Emberfall** (warm ash haze, ember glow, smoky dusk), **Cloudglass Pass** (thin bright mountain air, crisp shadows,
cold blue shade), **Stillreed Basin** (wet green reed light, low water mist), **Hollowecho Hills** (hushed lavender
dusk, mist in the hollows), **Sunthread Commons** (golden open meadow, long evening shafts), **Farwatch Reach**
(clear sea air, bright horizon, harbour lamps at night), the **league** and the **Lighthouse Spire** (warm stone,
a beacon feel at night), and **Larkhaven** (town: warm windows and lamps at night). Add new optional settings only if a
place truly needs them, keeping every default unchanged.
- **Quality bar** (docs/CREATIVE.md "Light first"): before/after screenshots per area at noon, dusk and night, plus
  one at 3440x1440 and one at 375 px; check Pocket (no light), 16-bit, HD-2D and Diorama; Graphics Low and High;
  reduced motion. Night must stay readable.
- **Checks:** each area's settings are valid numbers/colours; the scene calls receive them; unchanged defaults for
  any area you don't touch; old saves load. All four test pages and tests/offline.html pass.
- **Version:** Wildbond 1.3.2 (both places). Merge main into your branch first (main has your merged Saltmarsh work).
- **Don't touch:** shared/, Realmbound, Starfall, the maps' layouts or game rules.

- [x] T30 merged 2026-10-07 by Claude (1120 Wildbond checks; full league run played through to the Champion title).

- [x] T31 merged 2026-10-07 by Claude (Wildbond v1.3.0, 1176 checks).

### T31: Wildbond post-game, part 1: the Lighthouse Spire and league rematches (W3)
After the Champion, players need a reason to keep raising their team toward level 100 (CLAUDE.md: "reasons to revisit
old content"). Build on your own T30 league code (04-world.js `league*` functions, the league map) and the rematch
code in 15-challenge.js. You have creative freedom (docs/CREATIVE.md); put a short "Design" section at the top of the PR.
- **The tower:** a new walkable place for Champions only (name it to fit the lore; a lighthouse or tower near Farwatch
  or the league is a good fit), locked before `S.story.leagueEnding`. Battles in a row against trainers with themed
  teams; each floor's levels climb from about 75 toward 100 (floor N: min(100, 74 + N)), healing every 5 floors,
  a short rest choice ("keep climbing" or "leave with your rewards"). A loss ends the climb. Save your best floor
  (`S.tower = { best: 0, ... }` with safe defaults) and show it in the Journal.
- **Rewards that matter but never pay-to-win:** coins and lures every floor; at milestone floors (10, 20, 30...) a
  rare food, a title (e.g. "Spire Climber" at 10, "Lightkeeper" at 30), and the rare creature eggs the ranch can hatch
  (use the existing egg code). Auto can climb, but earns less than climbing yourself (the same rule as Auto-explore).
- **League rematches:** once a ranch day, the four league trainers and Champion Avenne can be rematched in the league
  at higher tiers (teams scale with yours, like `S.rematch`), with new short lines for each.
- **Trainer variety:** the tower's trainers use teams drawn from every area's species (a pool by floor band), with
  a few named regulars who return every 10 floors and have a line or two (kind, curious voices).
- **Saves:** new fields default safely; old saves load unchanged. **Checks:** the lock, floor levels, healing every 5,
  losing ends the climb, best-floor saving, milestone rewards (once only), Auto's smaller rewards, rematches once a day,
  old saves. All four test pages pass. Bump Wildbond's VERSION to 1.3.0. Check phone, desktop and ultrawide.
- **Don't touch:** shared/ files, `ERAS`, the caps, or Realmbound/Starfall.


### T30: Wildbond's ending: the league and the Champion (W2)
The story's finale after the eighth badge (docs/research/decisions.md decision 1: the main story ends around level 70-75,
the Champion near 72-75; the post-game, W3, comes later). Read docs/lore/wildbond.md first and keep the tone: kind,
cooperative, Wren as the heart of the journey. You have real creative freedom here (docs/CREATIVE.md); put a short
"Design" section at the top of the PR explaining your choices.
- **The place:** a new walkable map, the league (name it to fit the lore), reached from Farwatch once all eight badges
  are held (locked before), with its own tune, weather, BATTLE_PLACES entry and ambience-friendly layout.
- **The gauntlet:** four league trainers (each with a theme, a voice and a team at 70-74) fought in a row, then the
  Champion (team 74-76). No ranch trips in between, but a short rest scene between rooms that heals; losing sends you
  back to the league's entrance with your progress through the gauntlet kept for the day only. Use the existing battle
  and trainer code (`startBattle('trainer', ...)`, STORY beats, `talk()` scenes) rather than a new battle system.
- **Wren:** her last battle happens at the league's gate before the gauntlet (her strongest varied team, `$rival` at
  73), and she is there in the ending.
- **The ending:** scenes after the Champion (the world's colour fully restored, Maren and Isolde, the guardians), a
  title in `S.titles` ("Champion"), and a gentle message that the post-game is coming. Record it in the Journal.
- **Saves:** new fields default safely; old saves load unchanged. **Checks** for the lock, each room, losing and
  retrying, the Champion victory, the ending flags and old saves. All four test pages pass. Bump Wildbond's VERSION to
  1.2.0 (both places). Check desktop and ultrawide as well as phone (docs/CREATIVE.md quality bar).

### T29: Wildbond area 7, Sunthread Commons (data + map + tune)
Build area 7 from the "Area 7 proposal: Sunthread Commons" in docs/lore/wildbond.md at the **decided level band
62-68** (decision 1; six badges cap at 65, seven at 70). Same shape as your T28 (Hollowecho Hills): read its ticket
and your own code and copy the structure, including T28's map quality (winding paths, irregular fields, a real place).
- **Change only:** games/wildbond/js/00-data.js, games/wildbond/js/11-maps.js, one `WEATHER` entry in 12-walk.js
  (`sunthread: ['clear', 'clear', 'rain']`: clear mornings, sudden storms), one `TRACKS` entry in 10-sound.js (original,
  open and bright), one `BATTLE_PLACES` entry in 06-scene.js (the battle backdrop you built: meadow hills, `leaves`),
  tests/wildbond-checks.js, docs/lore/wildbond.md (Sunthread into canon), README.md, ticking T29 here and in
  START-HERE.md. Don't touch `ERAS`, `JOURNEY` or the caps.
- **Content:** `BADGES.loom` (Loom Badge); `CAST.halen` (Warden Halen, 'Warden of Sunthread Commons', remembers
  everyone's name); `BIOMES.sunthread` (`lv: [62, 68]`, `req: 'echo'`); 8-10 species mixing Grove horses and boars,
  Radiant sprites and birds, Ember wolves and Gale horses (T6 rules), one two-stage line (`evo.at` 66 or lower), one
  rare species, and **Meadowmantle** (Grove boar guardian, unique, big). STORY: Wren at 6 (she helps a nervous young
  tamer find a role at the gathering; her varied team, `['$rival', 67]`, levels 64-67), Meadowmantle at 14 (`wild:
  ['meadowmantle', 67, 4]`), Warden Halen at 24 (`gate: 'loom'`, team 65, 66, 68, judging making space for partners
  with different strengths). Map: `MAPS.sunthread` ~30 x 14 joined to Hollowecho (locked until the Echo Badge), a
  meeting hall corner (walls `#` and a door is not needed; a sign will do), a signpost, three items, two trainers
  (64-67). Pell the peddler fits a gathering well, as a townsperson.
- **Checks:** mirror your Hollowecho checks (map valid and connected, exits both ways, species rules, Halen gives the
  Loom Badge and the cap becomes 70, story beats). All four test pages must pass (`tests/wildbond.html`,
  `tests/run.html`, `tests/starfall.html`, `tests/sound.html`).

### T28: Wildbond area 6, Hollowecho Hills (data + map + tune)
Build area 6 from the "Area 6 proposal: Hollowecho Hills" in docs/lore/wildbond.md at the **decided level band
58-64** (docs/research/decisions.md, decision 1; the proposal's 52-62 is outdated: five badges cap your team at 60, six
at 65). Same shape as your T27 (Stillreed Basin): read its ticket and your own T27 code and copy the structure.
- **Change only:** games/wildbond/js/00-data.js, games/wildbond/js/11-maps.js, one `WEATHER` entry in 12-walk.js
  (`hollowecho: ['clear', 'mist', 'clear']`), one `TRACKS` entry in 10-sound.js (`hollowecho`: original, echoing,
  a little mysterious; try `lead: 'pulse'`), tests/wildbond-checks.js, docs/lore/wildbond.md (move Hollowecho into
  canon), README.md changelog, ticking T28 here and in START-HERE.md. Don't touch `ERAS`, `JOURNEY` or the caps.
- **00-data.js:** `BADGES.echo` (Echo Badge); `CAST.senna` (Warden Senna, 'Warden of Hollowecho Hills', a quiet
  surveyor); `BIOMES.hollowecho` with `lv: [58, 64]`, `req: 'reed'`, its own colours (low green hills, grey stone,
  dark cave mouths) and a wild table; 8-10 new `SPECIES` mixing Shade hyenas and spiders, Stone boars and cats,
  Radiant sprites and Tide lizards (T6 rules: existing families, elements and `MOVES` only; base stats about 300 basic
  / 420 evolved; a one-line `dex`), one two-stage evolution line (`evo.at` 60 or lower), one rare species, and
  **Undertone** (Shade hyena guardian, `unique: 1`, `big: 1`, not in the wild table).
- **STORY** (after the Stillreed beats, `biome: 'hollowecho'`): the Wren rematch at 6 following the lore's beat (her
  partner's unease at a wrong passage; `team` ending `['$rival', 61]`, levels 58-61); the Undertone encounter at 14
  (`wild: ['undertone', 63, 4]`, it guides a separated group home through sound); Warden Senna at 24 (`gate: 'echo'`,
  team at levels 60, 61, 63, judging listening to a partner's warning even when it contradicts a plan).
- **11-maps.js:** `MAPS.hollowecho` (`name: 'Hollowecho Hills'`, `biome: 'hollowecho'`), about 30 x 14, legend tiles
  only. **Make it feel like a place, not a grid** (the one note on T27: Stillreed's map came out as even repeated
  patches): winding paths around rock outcrops, a hamlet corner with a bell post (a sign), irregular grass patches,
  cave mouths suggested with rock. An exit back to Stillreed and Stillreed gets a way on (locked until the Reed
  Badge), `start`, `warden` spot, one signpost, three `items`, two route trainers (teams 58-62, warm short dialogue).
- **Checks:** mirror your Stillreed checks (map valid and joined both ways, species rules, the Warden gives the Echo
  Badge and the cap becomes 65, story beats run). All three test pages must pass.

### T27: Wildbond area 5, Stillreed Basin (data + map + tune)
Build area 5 from the "Area 5 proposal: Stillreed Basin" in docs/lore/wildbond.md (Evan approved continuing the journey
by sending this ticket), at the **decided level band 52-60** (docs/research/decisions.md, decision 1; the proposal's
42-52 is outdated: four badges already cap your team at 55). Same shape as T17 (Cloudglass Pass, below): read it and
your own T17 code and copy the structure.
- **Change only:** games/wildbond/js/00-data.js and games/wildbond/js/11-maps.js (as T17), plus: one `WEATHER` entry in
  games/wildbond/js/12-walk.js (`stillreed: ['rain', 'clear', 'rain', 'mist']`, it's a rainy basin), one `TRACKS` entry
  in games/wildbond/js/10-sound.js (`stillreed`, an original tune in the same format as the others: calm water, reeds,
  32-token `mel`), tests/wildbond-checks.js (a block of checks), docs/lore/wildbond.md (move Stillreed into canon),
  README.md changelog, and ticking T27 here and in START-HERE.md. In 00-data.js don't touch `ERAS`, `JOURNEY` or the
  cap constants (`CAP_TABLE` already gives 60 with five badges). Claude is building other systems meanwhile.
- **00-data.js:** `BADGES.reed` (Reed Badge); `CAST.olan` (Warden Olan, 'Warden of Stillreed Basin', a ferryman);
  `BIOMES.stillreed` with `lv: [52, 60]`, `req: 'beacon'`, its own `sky`/`hill`/`ground` colours (grey-green water,
  reed gold, orchard green) and a wild table; 8-10 new `SPECIES` mixing Tide crocs and lizards, Grove boars, Gale
  birds and Shade spiders, with the T6 rules (existing families, elements and `MOVES` only; base stats about 300 basic
  / 420 evolved; a one-line `dex`), one two-stage evolution line (`evo.at` 54 or lower), one rare species (low weight)
  and **Stillwake** (Tide croc guardian, `unique: 1`, `big: 1`, not in the wild table).
- **STORY** (after the Cloudglass beats, `biome: 'stillreed'`): a Wren rematch at 6 following the lore's Wren beat
  (the tangled ferry rope, then a fair restart on dry ground; `team` ending `['$rival', 55]`, levels 52-55); the
  Stillwake encounter at 14 (`wild: ['stillwake', 57, 4]`); Warden Olan at 24 (`gate: 'reed'`, `trainer: 'Warden
  Olan'`, team at levels 54, 55, 57, judging restraint when the stronger team could win carelessly). Each with
  `title`, `text`, `lines` (3-4), `win` (2-3), in the characters' voices.
- **11-maps.js:** `MAPS.stillreed` (`name: 'Stillreed Basin'`, `biome: 'stillreed'`), about 30 wide and 14 tall, only
  the legend's tile letters (water `~` channels with reed-grass `"` banks, a ferry landing, an orchard of `T`), an exit
  back to Cloudglass Pass and Cloudglass gets a way on into the basin (as T17 did for Emberfall), `start`, `warden`
  spot, one signpost, three `items`, two route trainers (teams at levels 52-56, short warm dialogue; add their speakers
  to the `Object.assign(CAST, ...)` list in that file). Follow docs/lore/multiverse.md: Pell the peddler may appear as
  a townsperson or a sign if it fits.
- **Checks** (tests/wildbond-checks.js, mirroring the area-4 checks): the map is valid and walkable, exits join both
  ways, the new species follow the rules, the Warden gives the Reed Badge and the cap becomes 60, the story beats run.
  All three test pages must pass (`tests/wildbond.html`, `tests/run.html`, `tests/starfall.html`).

### T23: Realmbound Hollow Crown II, the Crown's Heart (data, levels 52-60)
The last chapter before the raid: docs/realmbound-40-60.md ("The journey", "Story thread", "Raids"). Same shape and rules
as T22 (read its ticket below and your own T22 code: copy the structure), building on everything T22 added.
- **Change only:** games/realmbound/js/00-core.js (`LEVEL_CAP = 60`), 01-world.js (zone + quests), 06-npcs.js
  (`npcZone`: companions 52+ visit the new zone), 07-dungeons.js (the new dungeon), 17-sound.js (one new `TRACKS` entry
  for the zone: original, 32-token `mel`, a check fails without it), tests/realmbound-scenarios.cjs (a block after
  your T22 checks), docs/lore/realmbound.md, docs/realmbound-40-60.md (pacing numbers), README.md changelog, and ticking
  T23 here and in START-HERE.md. Claude is meanwhile building the raid system in new files, so don't add a raid.
- **Zone `crownheart`, "The Crown's Heart"**, `lv: [52, 60]`, shared, hub: Thornmantle Camp moved inward (a new name
  is fine, e.g. *Heartwatch*, both factions), its own colours (deeper, older wood, gold light on the throne), a `lore`
  paragraph, appended to both `ZONE_ORDER` routes after `hollowcrown`. **6 mob types 52-60** with roles (e.g. Ashwing
  elders and broodguards, rootbound choir-treants, crown-gnawed beasts) and a legendary tameable elite at 60.
- **14 quests `ch1`...** (8 levels need more than T22's 12; kill/collect, 52-60, `req` chains, faction `giver` pairs
  and `done` lines in each giver's voice, existing givers from T22 can return). Story: the forest's hunger to fill the
  empty seat grows near the throne; Seraveth, the Ashwing matriarch, sits on it (heard, glimpsed, never fought here).
  Follow `docs/lore/multiverse.md`: the Archivist may appear once as a quiet observer if it fits.
- **Attunement, "The Hollow Key"** (the raid's entry): three final quests `ch12`-`ch14` marked `attune: true`, whose
  `req` chain needs `ch11`, plus a check that the Silent Barrows and Rootrot Hollow have each been cleared at least once
  (`dungeonStats('barrows').clears > 0` and `dungeonStats('rootrot').clears > 0`): add an optional `needDun: ['barrows',
  'rootrot']` field to those quests and make `qState()` (08-inventory-quests.js; you may change this one function)
  treat a quest whose dungeons aren't cleared as not yet available, with the reason shown in the quest log. The last
  quest's `done` lines hand the player **the Hollow Key** and point at the Hollow Throne (the raid, coming next).
- **Dungeon `heartwood`, "The Heartwood Vault"** (or a better name): `minLvl: 56`, `zone: 'crownheart'`, levels 56-60,
  4 packs and 3 bosses in the `ROOTROT` shape; the last boss a little tougher than Arveth (`hpM` 13-14). Existing
  `mech` keys only. Add it to `DUNGEONS`.
- **Checks:** everything your T22 checks cover, for the new zone, quests, elite and dungeon; plus: `ch12` isn't
  available until both dungeons are cleared and is once they are; a level-52 save resumes and reaches 53; level 60 is
  the cap. All three test pages must pass (`tests/run.html`, `tests/wildbond.html`, `tests/starfall.html`).
- **Pacing (required this time):** run the sim from docs/realmbound-40-60.md ("Measured: the Barrowfields") for one class
  from 45 to 52 (your zone) and from 52 to 55 (this zone) and add the minutes per level to that doc. Targets: about 45
  minutes per level rising to 75 by 59, Focus play. Tune only the new zone's quest XP and mob levels, never the curve.

### T26: Starfall Guild sound on the shared sound system (parked-games side lane)
Starfall Guild has no sound. Give it music and effects through the arcade's shared engine, `shared/sound.js` (read its
header comment first; Wildbond's `js/10-sound.js` and Realmbound's `js/17-sound.js` are the two examples to copy).
- **Change only:** `games/starfall-guild/index.html` (load `../../shared/sound.js` after `shared/engine.js`, a new
  script tag for the new file, and a header button `<button id="sndBtn" data-act="sound" aria-pressed="false">Sound:
  off</button>` placed in `<header class="top">` in the same style as its other buttons), a new
  `games/starfall-guild/js/08-sound.js` (load it after `07-events.js` and before boot), a `case`/branch for
  `data-act="sound"` in `07-events.js` that calls `SND.cycle()`, `SND.render()` once at boot, one-line `sfx(...)` calls
  at the hook points below, `tests/starfall-checks.js`, HANDOFF.md (the Starfall layout list), README changelog, and
  ticking T26 here and in START-HERE.md. **Don't edit `shared/sound.js`** (if it needs a change, describe it in the
  PR), and don't touch Wildbond or Realmbound.
- **Setting:** off by default; `mode: () => S.snd || 0`, `setMode: m => { S.snd = m; save(); }` (use the game's real
  save function name). Old saves without `snd` must load unchanged, with sound off.
- **Music (original tunes, note strings, 8th notes, '.' rests, mel 32 tokens, bass 16 or 32, optional drums):**
  `town` (when no run is active / in town: warm, hopeful), `delve` (a normal dungeon floor: steady, adventurous,
  with drums), `boss` (a boss floor, `isBoss(floor)`: fast, `echo: false`). `musicKey()` returns one of these from
  the game state, or null when the tab is a modal that should be quiet. Starfall's feel is starry and arcane, so try
  `lead: 'pulse'` or `'triangle'` and minor or Dorian keys. Every note must be a real pitch (`ArcadeSound.hz(n) > 0`).
- **Effects (shared names only; keep them to big moments, never on every hit or every tick):** boss defeated →
  `win`; relic chosen → `loot`; hero recruited at the tavern → `quest`; hero levels up → `level`; town building
  bought → `coin`; party wiped / forced back up → `lose`; season reset → `badge`. If a hook can fire many times in one
  tick (offline catch-up, farming), guard it so it plays at most once.
- **Checks** (add to `tests/starfall-checks.js`): every track exists and every note is a real pitch; sound starts off;
  clicking `#sndBtn` cycles `S.snd` 0 → 1 → 2 → 0 and the button text follows; every `sfx` name above runs without
  throwing; `musicKey()` gives `town`, `delve` and `boss` in the matching states; an old save without `snd` loads.
  All three test pages must pass: `tests/starfall.html`, `tests/run.html`, `tests/wildbond.html`.
- **Listen to it:** play with sound on for a couple of minutes and note in the PR how the tunes feel; the bar is "would
  you leave it on", not just "it makes noise".

### T22: Realmbound Hollow Crown, part 1 (data)
Levels 45-52, the second chapter of docs/realmbound-40-60.md ("The Hollow Crown" and "Story thread"). Same shape and
rules as T20 (read its ticket below and copy its structure), building on what T20 and T1-B added.
- **Change only:** games/realmbound/js/00-core.js (`LEVEL_CAP = 52`), 01-world.js (zone + quests), 06-npcs.js
  (`npcZone`: companions 45+ visit the new zone), 07-dungeons.js (the new dungeon), tests/realmbound-scenarios.cjs
  (add your checks in a block after the T20 checks), docs/lore/realmbound.md, README.md changelog, and ticking T22 here
  and in START-HERE.md. Claude is building shared dialogue scenes meanwhile in new files and the quest UI.
- **Zone `hollowcrown`, "The Hollow Crown"**, `lv: [45, 52]`, shared, hub *Thornmantle Camp* for both factions (a
  shared forward camp, so both `hub` entries can be the same name), its own colours (sick green-gold canopy, dark
  roots), a `lore` paragraph, appended to both `ZONE_ORDER` routes after `barrowfield`. Mobs (5 types, 45-52): Ashwing
  drakes (`fam: 'lizard'`), corrupted treant wardens (humanoid), rot-bitten wolves, canopy spiders, thornback boars;
  plus a legendary tameable elite at 52 (an Ashwing broodmother or old drake, `elite`, `rare`, a tameable family).
- **12 quests `hc1`...** (kill/collect, 45-52, `req` chains, faction `giver` pairs and `done` lines in each giver's
  voice). Story: both factions follow the barrows road east into a forest grown around an empty throne; the Ashwing
  treat the throne as their hoard; the corruption is the forest trying to fill the empty seat. New quest givers are
  welcome (original names). The last quests point to the dungeon and toward Seraveth (not met yet). Follow
  `docs/lore/multiverse.md` (Pell the travelling peddler may appear as a quest giver or a line if it fits).
- **Dungeon `rootrot`, "Rootrot Hollow"**: `minLvl: 49`, `zone: 'hollowcrown'`, levels 49-52, 4 packs and 3 bosses in
  the same shape as `BARROWS`; bosses may use `wave`, `surge`, `enrage` and Grave Chill's `chill` only if it fits (it
  is a cold mechanic; probably not). Add `rootrot: ROOTROT` to `DUNGEONS`.
- **Checks:** everything T20's checks cover, for the new zone, quests, elite and dungeon (travel at 43 refused, 43+ if
  the zone starts at 45: use the existing "minimum level − 2" rule; a level-45 save resumes and reaches 46). Also run
  tests/wildbond.html and tests/starfall.html: all three test pages must pass.
- **Pacing:** optional but welcome: run the sim described in docs/realmbound-40-60.md ("Measured") for one class
  and add its numbers.

### T25: Split Starfall Guild into small files, add a test page (no behavior change)
Starfall Guild (games/starfall-guild/index.html) is one 826-line file, the shape Realmbound was in before T0. Split it
the same way so it can be improved safely later. **No gameplay, balance, text or save changes.**
- **Files:** `games/starfall-guild/index.html` (markup + ordered classic `<script src>` tags, no build step, no modules),
  `style.css` (the existing styles, unchanged), and `js/NN-name.js` files in load order: data (classes, heroes,
  dungeon, town buildings, staff, seasons), state and save (`KEY = 'starfall-guild-save-v1'` and the save format stay
  exactly as they are), the dungeon/battle runtime, town and staff logic, UI and tabs, rendering, events, boot.
  Keep top-level names identical so behaviour is unchanged; if two parts depend on load order, note it in HANDOFF.md.
- **Test hook and page:** on `localhost` only, expose `window.__sg` (state getter, save/load, the main tick function and
  a few key actions) like Realmbound's `window.__rb`. Add `tests/starfall.html` (+ `tests/starfall-checks.js`) in the
  style of `tests/wildbond.html`: back up and restore `starfall-guild-save-v1` and the hub progress, load the game in
  an iframe, and check that a fresh save starts, an old save from the current main version loads unchanged, recruiting,
  a dungeon run, a town building purchase and a season reset work, and the tick advances without errors.
- **Prove no change:** before splitting, save a game played for a few minutes on main; after splitting, load it and
  confirm identical numbers. Note the check in the PR.
- **Docs:** HANDOFF.md layout section for Starfall Guild; README changelog line; tick T25 here and in START-HERE.md.
- Don't touch Wildbond, Realmbound or Primordial (Primordial is on the back burner).

### T24: Wildbond checks for the newer systems (tests only)
`tests/wildbond.html` (T16) checks maps, story data, walking, gates, caps, Wardens, old saves, the inn and the shop.
Everything built since has no checks yet. **Change only `tests/wildbond-checks.js`** (plus ticking T24 here and in
START-HERE.md's "Up next"). Use the same style: `check(label, () => …)`, `ready()` for a fresh tamer, `walk()`,
finishing battles with `worldTick(0.1)` in a loop. Read the code you're testing; don't guess names.
- **Route trainers and items (12-walk.js, 11-maps.js):** walking into a trainer's line of sight (`trainer.sight` in
  the direction they face) starts a scene and a `trainer` battle; winning sets `S.beaten[who]`; talking to a beaten
  trainer plays `after`; a trainer who beat you doesn't challenge again until you change maps (`WK.cool`). Walking
  onto an item adds its coins/lures/food once (`S.items`). Signposts (`P`) set `W.msg` and block movement.
- **Riding and running:** `toggleRide()` only works with the Ember Badge and a conscious partner; `speedNow()` is
  `RIDE_SPEED` when riding, `RUN_SPEED` with Warden's boots and Shift (`WK.run`), `WALK_SPEED` on Auto.
- **Eras:** a new save starts in `pocket`; winning the Thorn Badge unlocks `pixel` and `bit16`, gives `S.shoes`
  and switches Pocket to 16-bit; the Tide Badge unlocks `hd` (switching from 16-bit); the Ember Badge unlocks
  `diorama` (switching from HD-2D). Old saves get the eras their badges imply (`load()`).
- **Day, night and weather:** `darkness()` is 0 before the Thorn Badge; at night (`isNight()`) Shade species are
  picked more often by `wildPick()`; `weatherNow()` is `clear` before the Tide Badge and in town; rain raises Tide.
- **Visible wild creatures:** after the Tide Badge, `WK.roam` fills up on a map with tall grass; stepping onto one
  starts a wild battle with that species.
- **Challenge modes (15-challenge.js):** `chooseStarter(id, name, pace, {nuzlocke:true})` stores `S.modes`;
  Nuzlocke: the second wild meeting in an area can't be lured, a fainted creature is released after battle, and a
  run with nobody left ends gently (`S.modes.nuzlockeEnded`); Solo: `teamMax()` is 1 and catches go to the ranch;
  Hardcore: Rally is refused; Randomizer: `randomized()` is a permutation and stays the same for one `S.modes.seed`.
- **Rematches and mastery:** talking to a beaten Warden starts a `trainer` battle with `B.rematch` set; winning
  raises `S.rematch[id]` and blocks another the same `S.day`; Wren appears in Larkhaven after `S.story.rival2`;
  `masteryOf(biome)` counts its three stars.
- Restore saves as T16 does. All checks pass before you push.

### T20: Realmbound Frostmere II, The Barrowfields and The Silent Barrows (data)
The first chapter of docs/realmbound-40-60.md: levels 40-45 and a third dungeon, built with existing systems
only, following The Winter Road's contract (docs/realmbound-winter-road.md). Read docs/realmbound-40-60.md
("The journey" and "Story thread") and docs/lore/realmbound.md first.
- **Change only:** games/realmbound/js/00-core.js (`LEVEL_CAP = 45`), 01-world.js (a new zone and its quests),
  06-npcs.js (`npcZone`: companions level 40+ visit the new zone), 07-dungeons.js (the new dungeon),
  tests/realmbound-scenarios.cjs (checks), docs/lore/realmbound.md, README.md changelog, and ticking T20 here.
  Claude is changing talents and party roles (03-talents-abilities.js, 09-dungeon-runs.js, 12-tabs.js) meanwhile.
- **Zone `barrowfield`, "The Barrowfields"**, `lv: [40, 45]`, shared (`faction: null`), hubs `Lanternrest Lodge` /
  `Whitebough Hearth` (forward camps), its own sky/hill/ground (grey-blue snow, dark barrow stone), a `lore`
  paragraph, appended to both `ZONE_ORDER` routes after `frostmere`. Mobs: 5 types levels 40-45 using existing
  families/kinds (e.g. grave-cold wolves, barrow spiders, restless Wayfolk dead as humanoids, ice troll diggers) and
  one legendary tameable elite at 45 (`elite: true, rare: true`, a beast family that can be tamed).
- **11-12 quests** `bf1`…: kill/collect, levels 40-45, `req` chains like Frostmere, faction-specific `giver`
  pairs and `done` lines in each giver's voice (reuse Surveyor Tavin / Storykeeper Eshra and the Roadwarden pair, or
  add new named givers). The story follows "Story thread: Frostmere II": the Wayfolk, their road-stones, the
  grave-cold spreading up the road. The last quest sends you to the dungeon. Original names only.
- **Dungeon `barrows`, "The Silent Barrows"**: `minLvl: 42`, `zone: 'barrowfield'`, its own sky/hill/ground,
  `waveName`/`surgeName`, 4 packs and 3 bosses at levels 42-45 in the same shape as `FOUNDRY` (existing `mech`
  keys only: `wave`, `surge`, `enrage`; boss `hpM`/`dmgM`/`loot` like the Foundry's, slightly higher). Final
  boss **the Last Wayward** (level 45). Add `barrows: BARROWS` to `DUNGEONS`. Claude adds its new Grave Chill
  mechanic afterwards (T1-B).
- **Checks:** tests/run.html must pass, plus new scenario checks like Frostmere's: both factions travel at 38 (not
  37), see the right hub and lore, take every quest, hear each turn-in voice, get a scaled reward; the elite spawns
  and can be tamed; a level-40 save resumes and earns XP to 41; the dungeon appears in the dungeon list at 42 in its
  zone. Lore record: add the Barrowfields, its people, the dungeon and its bosses, consistent with the spec's story.

### T21: Realmbound item name tiers to level 60 (data + one formula)
Item names stop changing at item level 16 today. Give every level band its own names (docs/realmbound-40-60.md,
"Loot from 40 to 60").
- **Change only:** games/realmbound/js/02-items.js (names), the `tier` line in `genItem` in 08-inventory-quests.js,
  tests/realmbound-scenarios.cjs (a few checks), README.md changelog, and ticking T21 here.
- **Formula:** `tier = ilvl <= 20 ? Math.min(3, Math.floor((ilvl - 1) / 5)) : Math.min(7, 3 + Math.ceil((ilvl - 20) / 10))`
  so tiers 0-3 cover levels 1-20 as today, 4 = 21-30, 5 = 31-40, 6 = 41-50, 7 = 51-60. Items already in saves keep
  the names they were generated with.
- **Names:** extend every list indexed by tier to 8 entries (each `MAT` material, each `WEAPONS[...].names`, each
  `OFFH` list, `TRINKETS`), getting sturdier and grander with level and fitting the existing style (Banded → e.g.
  Runed, Frostforged, Wayfolk, Ashwing-scale…). Add 8-12 dungeon-flavored entries to `BLUE_PRE` (Wayfolk's,
  Barrow-touched, Rimebound…). Original names only.
- **Checks:** tests/run.html passes; new checks that `genItem` at item levels 1, 16, 25, 35, 45, 55 uses tier 0, 3,
  4, 5, 6, 7 names for a weapon, an armor piece, an off-hand and a trinket.

### T16: Wildbond browser checks (tests only)
Realmbound has `tests/run.html` (click **Run checks**, get PASS/FAIL, no Node.js). Give Wildbond the same, so every
future change can be checked in a minute. **Create only `tests/wildbond.html` and `tests/wildbond-checks.js`** (plus
ticking T16 here). Don't change games/, shared/ or other docs: Claude is building T7b part 2 in Wildbond meanwhile.
- **How it runs:** like tests/run.html: served by `serve.ps1`, it loads games/wildbond/index.html in a same-origin
  iframe, uses the localhost hook `window.__wb` plus the game's globals (`iframe.contentWindow`), runs every check,
  and lists each as PASS/FAIL with a summary line `PASS — N checks.` or `FAIL — x of N failed.` in `#summary`.
  **Back up `localStorage['wildbond-save-v1']` and the hub's progress first and restore them afterwards**, even
  when a check throws. Battles can be finished by calling `worldTick(0.1)` in a loop; skip scenes with `skipTalk()`.
- **Data checks** (read the data, no playing): every map in `MAPS` has rows of equal length; every exit letter in a
  map's rows has an `exits` entry whose `to` map exists and whose arrival tile is walkable; every `doors` key sits on a
  `D` tile; every NPC's `who` is in `CAST` and stands on a walkable tile; every `warden` spot is walkable and its
  area has a Warden beat in `STORY`; every `STORY` speaker and every `win`/`lines` speaker is a `CAST` key, `''` or
  `'@<species id>'`; every species' learnset uses moves in `MOVES`; every `evo.to` and every wild-table id is a
  species; every `gate` is a key of `BADGES`; every biome `req` is a badge some Warden gives.
- **Play checks** (through `__wb` on a fresh save): choosing a starter puts you in Larkhaven; walking north reaches
  Thornwood; the Thornwood north gate is locked without the Thorn Badge and open with it; soft/hard/off caps behave
  (soft: a creature at the cap still gains a little XP; hard: none; off: grows past it); `levelCap()` is 15, 25, 35,
  45 with 0-3 badges; each Warden can be challenged on their own map (not in town), beating them awards their badge;
  an old save without `pos`, `journey` or `capMode` loads with defaults; the inn heals; the shop sells 5 lures for 50.
- Add one line to the top of the page saying what it checks, and keep the file plain HTML/JS (no build, no installs).

### T15: Emberfall Warden and badge (data only)
Emberfall Highlands (levels 22-32) is the only area without a Warden. Add one, using the Warden system T11 built.
**Change only games/wildbond/js/00-data.js** (plus ticking T15 here). Claude is building the walkable world (T7b)
in other files at the same time.
- `BADGES`: add one badge (pick an id and a name that fit a volcanic highland, e.g. `ember: { name: 'Ember Badge' }`).
- `CAST`: add the Warden as a speaker (same fields as `isolde`/`nerys`; `hair` must be one of short, long, bun,
  spiky, hat; `hatCol` only with `hat`). Give them a title like 'Warden of Emberfall'.
- `STORY`: add one beat right after the `hearthstag` beat, copying the shape of the `warden2` (Warden Nerys) beat:
  `biome: 'emberfall'`, `at: 24`, a unique `id` (e.g. 'warden3'), `gate: '<your badge id>'`, `title`, `text` (one
  journal line), `lines` (4 lines: one narration line setting the scene, then the Warden), `win` (3 lines: praise, the
  badge handed over, a hint about something old further on), `trainer: '<Warden name>'` matching CAST, and `team` of
  three from Emberfall's own species at levels 31, 32 and 34 (use the evolved form `kilntusk`, not `slaglet`, if
  you use that line). The game already shows the "Challenge" button, plays the scenes, awards the badge and raises
  the level cap from these fields; no code changes are needed.
- **What this Warden judges** must differ from the others: Isolde judges bond ("does your team fight *for* you"),
  Nerys judges adapting ("can your team change with the tide"). Pick something new (patience, endurance under heat,
  trust under pressure...) and make the dialogue show it. Match the existing tone: warm, plain, a little wry.
- Test: serve the repo (`serve.ps1`), open http://localhost:8765/games/wildbond/, and in the console use the
  localhost hook `window.__wb`: give a save both badges, set `S.biome = 'emberfall'` and
  `S.exploredIn = { emberfall: 24 }`; the Challenge button must show your Warden's name, the scene must play,
  and winning must add the badge and raise `__wb.levelCap()` to 45. No console errors.

### T14: Wildbond lore bible and region outline (docs only)
Wildbond is heading for about eight areas and eight badges (levels 1-100, see "Pacing, level caps and journey
settings" in docs/creature-game-design.md). Write the world down before more of it is built, the way T12 did for
Realmbound. **Create one file, `docs/lore/wildbond.md`, and change nothing else** (Claude is editing the Wildbond
code and data for T11 at the same time, so don't touch games/, shared/ or other docs).
- **What exists now, from the game:** read games/wildbond/js/00-data.js (SCENES, STORY, CAST, SPECIES `dex` lines,
  BIOMES) and docs/creature-game-design.md. Record the region's history (the frontier, why nobody owns a creature,
  what bonds are), Larkhaven, Keeper Maren, Wren, Warden Isolde, the Wardens as an order, each area so far
  (Thornwood, Saltmarsh Coast, Emberfall Highlands), the guardians (Elderhorn, Breakwatermane, Hearthcrown) and what
  "every region has something old watching it" means. Expand freely but never contradict in-game text.
- **Saltmarsh Warden:** Claude is adding a Saltmarsh Coast Warden and the Tide Badge in T11. Leave a short
  "to be filled in after T11" stub for them rather than inventing one.
- **Proposed areas 4-8:** for each, a name, a one-paragraph feel (landscape, weather, people), a level band (about
  32-42, 42-52, 52-62, 62-70, then post-game toward 100), an element/family mix using only the existing elements
  and families, a Warden (name, personality, what their test judges), a badge name, a guardian creature, and one story
  beat for Wren. Mark all of these clearly as **proposals for Evan to approve**, not canon.
- **Open questions** at the end: anything the game hints at but never explains.
- Keep it original (inspired by the genre, never naming or copying real games). Friendly, plain tone; headings and
  short paragraphs; about 2,000-3,500 words.

### T12: Realmbound lore pass
Make Realmbound's world feel lived-in, and start the lore record future guides will be built from.
- **Lore bible:** create `docs/lore/realmbound.md`: the Sundered Reach's history (why it is "sundered"), the Concord
  and the Wildclans (how they formed, what they want, why they clash in the Greywater Fens), the four races, every
  zone, every named NPC and quest giver (a line or two each: who they are, what they want), the bosses and named
  elites (Grizzlemaw, Kraska Duneclaw, Coalmaw, the dungeon bosses) and the Ember Covenant. Build only on what the
  game already says (games/realmbound/js/01-world.js, 06-npcs.js, 07-dungeons.js and docs/realmbound-design.md);
  expand freely but never contradict in-game text. Keep it original. List any open lore questions at the end.
- **In-game, data plus one small display change:** give every quest a `done` line (what the giver says when you turn
  it in, in their voice, 1-2 sentences) and show it in the existing quest-completed message in the log. Give every
  zone a `lore` paragraph (2-3 sentences) and show it where the zone's name/description already appears. Change
  nothing else: no balance, no new mechanics, no save-format changes. Run tests/run.html; all checks must still pass.
- Leave games/wildbond/ alone (Claude is working there).

### T10: Wildbond third area (data only)
Add **Emberfall Highlands** (volcanic uplands above the coast; name places and creatures however fits) in
games/wildbond/js/00-data.js only. Change no other file.
- `BIOMES.emberfall`: levels `[18, 26]`, `req: 'tide'` (the Saltmarsh badge Claude adds), its own `sky`/`hill`/`ground`
  colors and a wild table.
- 8-10 new `SPECIES` with the same rules as T6: existing families and elements only, base stats about 300 basic /
  420 evolved, learnsets from existing `MOVES`, a one-line `dex`. Include one two-stage evolution line (`evo`), one
  rare species, and one `unique: 1` legendary that is not in the wild table. Evolution levels must be 25 or lower.
- Two `STORY` beats with `biome: 'emberfall'`, written as scenes like the Saltmarsh ones: a Wren rematch at 6
  (`team` ending with `['$rival', 24]`, levels 22-24) and the legendary encounter at 14 (`wild: [id, 25, 4]`). Each
  needs `text` (one line for the journal), `lines` (3-4 lines of dialogue/narration) and `win` (2 lines). Speakers are
  keys of `CAST` (`wren`, `maren`, `isolde`), `''` for narration, or `'@speciesId'` for a creature. Keep Wren's voice
  (cheeky, competitive, warm) and match the existing tone. You may add one new `CAST` speaker if a scene needs one.
- Claude handles the code side: raising the level cap, the Saltmarsh Warden and the `tide` badge.

Realmbound portion ready for review: Codex, 2026-10-07, PR #44 (`guides/realmbound.html`). Other game guides remain open; Wildbond waits for its redesign.

### T8: Game guides
One guide page per game, written like a good fan wiki or strategy guide: lore first, then how to play, then tips.
- **Files:** `guides/index.html` (lists the guides), `guides/guide.css` (shared look, readable at phone width, 16px
  side gutter, no horizontal scroll), and one page each: `guides/primordial.html`, `guides/starfall-guild.html`,
  `guides/realmbound.html`. Plain HTML/CSS, no build step, no JavaScript needed (use `<details>` for collapsibles).
  On the hub (`index.html`), add a small "Guide" link to the cards of those three games. Change no game files.
- **Sections per guide:** 1) **The world** (setting, factions, characters, places; written as lore, not
  mechanics), 2) **Getting started** (the first 15 minutes), 3) **Systems explained** (every currency, resource and
  screen, what it does and when it unlocks), 4) **Automation** (what you can automate, how you earn it), 5) **Tips and
  tricks** (concrete advice: what to buy first, good builds, how to beat the hard parts), 6) **Spoilers** (bosses,
  late content, secrets) inside a closed `<details>` with a clear spoiler warning.
- **Facts come from the code.** Every number, unlock condition and name must match the game's source. Read the game
  files, don't guess. If something is unclear, leave it out and list it in the PR description.
- **Lore can be expanded** (history, legends, flavor for places and characters), but it must not contradict any
  in-game text, and must stay original (inspired by the genre, never naming or copying real games).
- **Tone:** friendly and plain, short paragraphs, headings and lists. Each guide 1,500-3,000 words.

## Bugs and feedback
Add one line per issue: what happened, where (zone or screen), and the character's level/class.

### T60: Individual species appearance data (WD2 data)

- [x] Give every current species an explicit renderer shape and four drawable feature hints, including ranch hybrids; preserve families, balance, moves, dex text and existing new-body assignments.
- [x] Document the artist contract, token vocabulary and species contact sheet. Do not change Godot or browser screens; renderer adoption is separate.
- [x] Check complete coverage, unique silhouettes/markings, JSON export and save independence; run all suites.
- Files: games/wildbond/js/00-data.js, games/wildbond/js/07-ranch.js (attach hybrid data only), tests/wildbond-checks.js, docs/lore/wildbond-looks.md and coordination docs.

### RB1.11: Realmbound, play rather than watch

- [x] Remove Focus's idle AI fallback, including established heroes. Every opponent waits for a deliberate Fight/ability order; pause both sides if the player stops giving combat input. Show the action inside the game window.
- [x] Reuse the Rotation Macro's 500 manual ability-use milestone for earned Auto, only strictly above the region's upper level and never in dungeons/raids. No new full Auto system; retain existing loot, selling and repair conveniences.
- [x] Give only bounded rested XP for away time. Hidden tabs cannot simulate combat; loading and returning from hidden/suspended sessions do not resume Auto without a choice. Old earned progress loads unchanged.
- [x] Check idle starts/resumes, pets/companions/timers, every region's mastery boundary, save reload and away rewards; exercise actual UI at phone, laptop, desktop and ultrawide sizes. All arcade suites pass. This is not the independent first-hour playtest (RB1.10).
- Files: games/realmbound/, tests/realmbound-scenarios.cjs, tests/realmbound-active-play-ui.cjs, guides/realmbound*.html, docs/playtests/realmbound-active-play.md, its screenshots and normal coordination lines. No shared/Godot/preview or version edits.
- Ready for review: Codex, PR #218, stacked after #214.
