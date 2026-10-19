# Wildbond: current direction and AI handoff

**Read this before continuing Wildbond.** Evan requested this handoff on 2026-10-18 so an incoming AI can work without the original chat. This records his current direction and the verified implementation snapshot; fetch current main and inspect live PRs before changing anything. Later direct instructions from Evan take precedence. This is not a release record or a blanket authorization to edit another agent's files.

## Two-minute orientation

- **Goal:** a genuinely enjoyable, private Pokémon-style RPG in Godot, built efficiently around Wildbond's original interconnected world, story and characters. Familiar Pokémon gameplay and reusable assets come first; distinctive original creatures can join over time.
- **Active implementation:** the native Larkhaven–Thornwood chapter at `wildbond-godot/tests/opening/play.tscn`. Its location under `tests/` is historical/export isolation; it is the actual playable development chapter, not merely an automated test.
- **Latest gameplay continuation:** PR [#568](https://github.com/ecbarish/generations/pull/568), branch `codex/wildbond-community-centers`, expands healing interiors into community hubs. It stacks on #567 populated healing spaces / building sight lines, #566 connected Thornwood town / Gate Loft / first chapter badge, #565 encounter planning, #564 audit and the earlier original-starter implementation. Fetch current heads and reconcile review/CI before continuing. Source changes do not imply publication.
- **Do not start from main and assume this chapter is there.** At the 2026-10-18 snapshot, #543–#557 remain open; most are draft. Reconcile live state first, then use the appropriate current feature head in your own checkout. Main, the old public web build, earlier standalone studies and the current native chapter are distinct.
- **Next suggested gameplay increment:** play/review the connected outing and first badge, then measure the next Rootwater/Knothollow leg against the graph, field lesson and arrival points before implementation. Claude’s separate immediate task is a report-only encounter blueprint review; see [copyable task](research/wildbond-thornwood-destination/CLAUDE-TASK.md).

## Evan's current creative direction

Evan's clearest statement was: “I basically now want a pokemon game but we build the world and story around it and maybe add our own creatures over time. And we can add features.” The original request was a complete, polished playable game, not a commercial competitor or a reinvention of every mechanic.

**World and presentation.** Preserve Larkhaven, Thornwood, Saltmarsh Coast, Emberfall Highlands and the established wider world, NPCs, quests, ranching/breeding/training possibilities and story progression. Build a region with branches, loops and useful returns rather than a linear corridor. [PBA](https://thedaigan.itch.io/pba) is the main visual/environment reference: lively sprites in a world with depth, warm lighting, shadows, water and weather. Evan also supplied [rea](https://github.com/morluto/rea) as a research lead. These references do not establish that their custom code/assets are available to copy; verify each source independently before adapting it. Current chapter scenery is a partial approximation, not finished PBA-level art.

**Battles and controls.** Aim for Platinum / HeartGold–SoulSilver / Emerald readability and polish. Standard turn-based battles are the likely choice. Evan asked to explore real-time movement/dodging too, but said world presentation matters more and development ease should guide us. Do not switch the battle system merely to match a visual reference. Pokémon-inspired Bag, party, items and UI are desired. Menus belong inside the game window; the world is the screen, with no dashboard beside it.

**Creatures and people.** Generations 1–4 are the primary creature/battle-art references. Reuse suitable prebuilt Pokémon and NPC appearances for this private prototype rather than mass-producing mediocre original sprites. Original creatures should have memorable silhouettes, personality and Pokémon anime flair, not just resemble ordinary animals. Bogsnap is a standout to retain; the selected reference is the green, leaf-armoured crocodilian on Evan's `15642.jpg` sheet. The Muse ZIP's alternate Bogsnap was rejected, and its clipped idle extracts must not become final animation. Its base/middle/final evolutionary placement is not settled. Do not invent a final starter choice from the current samples: Pidgey, Vulpix and Wooper are installed test species, not approved starters. Keep both original and imported species compatible.

**Approved original starters.** Mosshog, Ripplet and Cindercub already have approved concept identities in PR [#548](https://github.com/ecbarish/generations/pull/548), branch `codex/wildbond-creature-vision`: `docs/art/creature-vision/starter-personalities-v1.png`. Its README/manifest record Evan's 2026-10-17 approval: “That generation is perfect for the starters.” Preserve Mosshog's moss garden/sprout, Ripplet's river-lizard wave frill and Cindercub's expressive ember wolf design as drawn. The task is faithful game-size front/back/walking sprite production, not choosing another trio or redesigning the approved concepts. Match the imported Pokémon's pixel scale, outlines, shading, grounded movement and animation quality; validate one complete starter beside them in-game before producing the trio. Concept approval does not mean production sprites or animations are finished. Pidgey/Vulpix/Wooper remain implementation samples. Bogsnap remains a separate standout creature, not a replacement for the approved trio. The concept board lives on its separate art branch and is not yet in the chapter tree.

**Starter family development (#571).** [Three evolution/Mega concept boards](art/starter-families/README.md) now cover Mosshog/Thicketboar/Thornback, Ripplet/Riverwisp/Tidewyrm and Cindercub/Smoulderpup/Blazefang, plus a temporary Mega concept for each final. New later-stage appearances are candidates; current approved bases/runtime sprites remain unchanged. Middle species already exist in the legacy `evolution.json` overlay. Do not claim these posters are sprite atlases, native evolution support or playable Megas. Use the family brief/provenance and pilot one complete game-sprite family before scaling.

**Starter evolution art correction (Evan).** Evolved faces must visibly mature in skull/muzzle/jaw/eye proportions; do not preserve the baby head on a larger body. The degree of change in Charmander's line is the reference. Megas should make a substantial silhouette/structural leap beyond the final form, with more than added size, glow or decoration. Current #571 candidates are Mosshog v2, Ripplet v2 and Cindercub v3; earlier boards remain for comparison. These are unapproved concepts, not runtime sprites.

**Starter concept approvals and Mega follow-up (Evan).** Mosshog v2's complete line and Ripplet v2's normal evolutions are explicitly approved; preserve them. #571 now adds standalone Mega Blazefang blue-fire/obsidian palette and Mega Tidewyrm water-wing candidates, overriding only those boards' earlier Mega panels. New Mega portraits are pending approval. The supplied Mega Charizard X image guides color/transformation impact, not copied dragon anatomy. Blue fire/water wings do not automatically assign types, abilities or traversal. All assets remain concept art, not runtime sprites.

**Approved Mega coverage (Evan, 2026-10-18).** Selective, not universal. Guarantee forms for the fully evolved Mosshog/Ripplet/Cindercub lines after normal final evolutions are settled. Prioritize existing official Megas, standout originals/story partners, selected strong favorites and a few overlooked creatures. Bogsnap's eventual final form is a candidate; its line placement remains open. Keep ordinary creatures useful and implement one complete form before scaling the roster.

**Regional forms.** Evan also supports modifying Pokémon sprites into Wildbond regional forms for this private game. Start selectively, with coherent silhouette/personality changes and complete front/back/walking consistency; keep source identity, provenance and imported-art isolation. Specific regional-form suggestions made in chat are proposals, not approved final designs.

**Stand with it / Mega direction (Evan, 2026-10-18).** Make Mega-style bond transformations a signature system, reuse existing Mega forms first and add custom forms selectively. Replace hidden near-defeat requirements with reliable story trigger points. [Current direction and integration plan](plans/wildbond-world/stand-with-it.md) supersedes the old activation proposal: the production engine currently requires last survivor, maximum trust, low HP, a qualifying opponent and a daily allowance. The native chapter has no transformation system yet, and the bulk art library excludes Mega variants. Proposed defaults are a guaranteed story awakening and a visible once-per-battle choice afterward; exact milestone, roster and balance remain proposals. Preserve established depth/final-truth story obligations and base saved creature identities. Do not implement mass forms, permanent species replacements or hidden injury grinding.

**Progression of presentation.** Evan approved the idea of visuals/controls becoming more modern as the game progresses, from Game Boy essence toward Switch-era presentation. This is a future design direction, not an implemented era-unlock system. Keep geography, identity and progression coherent across presentations. Preserve the existing colour/depth story rules; a modern development preview does not mean the story restores depth early.

**Efficiency.** Adapt proven, appropriately licensed code and reusable assets where practical. Preserve functionality and saves, test small increments, and spend effort on the first playable adventure. No whole-game rewrite, hundreds-of-sprites generation batch, or expansion of the original catalogue just to increase its count. Private use is Evan's stated intent; imported copyrighted files and their screenshots stay outside Git and public exports.

## Original starter production follow-up

[PR #559](https://github.com/ecbarish/generations/pull/559), branch `codex/wildbond-starter-sprites`, adds the approved trio's first usable sprite candidates and a save-free native art audition at `wildbond-godot/tests/starter_sprites/play.tscn`. [Production report](art/starter-production/README.md) lists exact prompts, unchanged raw PNGs, 72 measured poses, five drawn/mirrored eight-way views, four stride frames, battle blink/breathing poses, 32/64-pixel reference rendering and 16-colour palettes. Use its launcher to inspect them beside optional private Pokémon references. That art task does not implement persistent starter choice/rules integration, a full idle/attack/evolution set or final human art acceptance. The subsequent [#560 gameplay integration](research/wildbond-live-starters/README.md) now adds actual saved original starter choice, followers/party/battle art and schema-three migration. Existing players can choose Storage → Meet Starters once without losing their Pokémon. The art preview itself remains unsaved. Original saved species identities must remain distinct from Pokémon. Main still needs dependency-order review/merge; use the appropriate feature branch rather than assuming the preview is deployed.

## What actually works in the current chapter

| System | Current behavior |
| --- | --- |
| Connected exploration | One measured walkable Larkhaven–Thornwood grid, west Millgrass Lane and a short east Dewcut approach; collisions, local map and authored anchors. This is not the full redesigned region. |
| Original character hooks | Maren's catch → Healing Inn → return outing with one-time supplies; Pip's existing chatter; optional Wren/Bram friendly one-partner battles with persistent results. |
| Town services | Healing Inn restores HP/PP/burns; shop sells berries/balls; ranch/paddock/menu expose party and storage. |
| Partners and saves | Six-member party, storage up to 60, catching, lead/follower changes, saved HP/PP/XP/items/wallet/results, existing-schema migration and conservative recovery. |
| Bounded Pokémon rules | Three Pokémon plus three original starters, 10 Pokémon and seven original hit moves, Gen IV-style 17-type chart with dual types/STAB, physical/special damage, accuracy, priority, PP/Struggle, stages, burns, catching, XP/levels and automatic supported move learning. |
| Party summary (#557) | Portrait, types, actual stats, HP/condition, XP progress and selectable move PP/power/accuracy/effects; previous/next, Lead/Store and keyboard/pointer navigation. |
| Actor presentation (#556) | Animated trainer and directional Pokémon followers; six matching private NPC roles, facing/actual small steps/grounded feet, nurse bow, stable creature scale and foliage fading. |
| Environment | Reused Kenney scenery, 3D ground/buildings, lighting/shadows, weather controls, water and foreground fading. Art and performance still need playtesting. |

The three species have neutral nature, IV 15 and zero EVs. Base XP uses pinned current API values, so this is not cartridge parity. Abilities, held items, critical hits, most statuses, full learnsets/move forgetting, evolution, complete trainer AI and weather battle mechanics remain unimplemented in this chapter. Original ranch simulation and full register/heritage/bond opening still need integration. Original adventure features do not automatically exist in this newer chapter.

Thornwood town now works in #566: Gate Loft heals locally, and Isolde challenges with explicitly adapted Pidgey 6 / Wooper 7 / Mosshog 8 partners after the Maren outing. Victory grants one Thorn Badge and opens only a short Saltmarsh approach. Canonical source teams and graph gates remain unchanged. Full canonical badge/story/visual-era progression is not integrated. Nested opening version two preserves old checkpoints in `.pre-opening-v2`; older pre-town readers hold it without writing. Deeper Saltmarsh, deeper Dewcut and Larkburrow remain closed. Respect the graph's badge/field requirements: the Larkburrow home shortcut still needs Stone Break **and** the Loom Badge, and the later Stone-partner shelf must not be moved to the entrance. Do not imply these destinations already work.

## People, natural spaces and sight lines

Evan explicitly wants centers and towns populated with suitable Pokemon or equivalent complete NPC sprites, at the trainer's visual quality, with believable reasons to stand/rest/walk there. PR [#567](https://github.com/ecbarish/generations/pull/567), stacked on #566, adds two waiting visitors to the shared healing interior, one person beside each inn approach, a closer indoor camera and full-building camera cutaways. Preserve clear door/service/travel paths. Walk behind buildings and check nearby people and entrances, including wide roof edges, through the real game camera before accepting a map. Cutaways preserve collision; they are not a substitute for good placement.

Use the real private pack for visual acceptance. The blue bird in #566's public capture is generic fallback art, not Pidgey's final sprite. The private pack contains the correct Pidgey and existing matching Pokemon NPC roles; missing-pack battles now show TEST ART. Fallback figures/images are portable engineering evidence only. [Implementation and future-map acceptance](research/wildbond-lived-in-centers/README.md).

Evan further requested larger centers with the community role of the games/anime. In #568 the two-town native prefab grows from 10 by 8 to 18 by 12.5: reception, rest/waiting wing, shared table/seating, local noticeboard, existing partner-storage terminal and four visitors plus the nurse. A fixed room camera and real furniture collision keep the hall, door and side approaches clear. Save coordinates remain outdoors. This is the model for future town hubs, with local identity/layout to be authored as each town is measured. Beds/seating are scenery; healing/storage are functional existing services. [Implementation, checks and limits](research/wildbond-community-centers/README.md).

## References and characters: read before new designs

The [reference and lessons guide](research/wildbond-reference-guide.md) maps Evan’s examples (PBA, Gen 1–4, Muse, approved art and reuse sources) to what we learned, what we actually implemented and the supporting reports. It explains historical proposals versus current plans and points to the separate creature-vision branch when files are absent here. Use it instead of repeating research or guessing from a screenshot.

Evan subsequently requested broad Pokémon art intake. The [private library guide](research/wildbond-private-library/README.md) describes the external, resumable base-species library, actual coverage, private browsing gallery and explicit small-pack selection. Library availability does not add species data or encounters to this chapter; its active pilot pack remains the existing three Pokémon. Read that guide before collecting duplicate art or trying to load the whole library through the eager-loading pilot.

The [cast guide](lore/wildbond-cast-guide.md) introduces Maren, Wren, Pip, Bram, the home community, eight Wardens and regional companions. It distinguishes established character details, interpretation and proposed introductions, with source routes and spoiler boundaries. Read it alongside the writer-only lore ledger before adding dialogue; no proposed introduction there has been added to the game yet.

**Encounter planning after the region audit:** [the Pokémon-first blueprint](plans/wildbond-world/pokemon-encounters-v1.md), PR #565 stacked on Claude’s #564 audit, covers all 33 ordinary areas and targets originals in 18. It fully weights the first four proposed tables and records later habitat candidates, art/combat readiness and outstanding map dependencies. Early Thornwood stays fixed; other ordinary areas use badge-cap-relative bands with local difficulty. This is planning data only: no live encounter, saved level, trainer or guardian has changed. Starter species remain starter-exclusive in this proposal. Follow the blueprint before adding species or assuming the old all-original tables are the new roster.

## Where to work and what to read

Work in your own clone/branch; do not switch branches or edit Claude's shared `C:/Users/evanb/OneDrive/Desktop/idle-arcade` checkout. The current Codex checkout on Evan's PC is `C:/Users/evanb/AppData/Local/Temp/generations-wildbond-audit-20261016`; that is a machine-specific location, not a portable requirement. The repository is [ecbarish/generations](https://github.com/ecbarish/generations).

Older ownership notes assign all Godot work to Claude. Evan's subsequent direct instructions in this chat explicitly authorized Codex to build this native chapter; they do not transfer unrelated production files, Starfall, release ownership or other agents' tasks. Inspect open ownership and scope your next PR before editing. Follow [AGENTS](../AGENTS.md), [AI-START](AI-START.md), [PROCESS](PROCESS.md) and Tower reporting; only Generations Reviewer merges. Feature PRs do not edit COMMS. Never infer published state from a merge or a local launch.

| Need | Read / edit |
| --- | --- |
| Current chapter behavior | [opening README](../wildbond-godot/tests/opening/README.md), `tests/opening/scene.gd`, `map.gd`, `battle.gd`, `trainer_rounds.gd`, `npc_actor.gd`, `summary.gd` under `wildbond-godot/` |
| Shared chapter systems | `wildbond-godot/tests/journey/{scene,catalogue,rounds,profile,bag}.gd`, `core-data.json`, `source-manifest.json` |
| Private art boundary | [private sprite report](research/wildbond-private-sprites/README.md), `tools/wildbond-private-sprites.py`, `wildbond-godot/tests/private_sprites/pack.gd` |
| Existing tested battle/presentation reuse | `wildbond-godot/tests/{battle_slice,town,thornwood_environment}/` and journey/opening subclasses; inspect dependencies before replacing anything |
| Region topology | [world graph](plans/wildbond-world/world-graph.json), [world design](plans/wildbond-world-design.md), [regional artwork](art/wildbond-world/README.md) |
| Local map workflow | [layout report](research/wildbond-layout/README.md), [location template](research/wildbond-layout/location-template.md), `wildbond-godot/tests/layout_plan/layout.json` and opening `map.gd` |
| Story consistency | [lore ledger](lore/wildbond-threads.md), existing dialogue and story data; read before new NPC/story/sign/dex text and record any clue placed |
| Details / limits | [opening report](research/wildbond-opening-chapter/README.md), [rules report](research/wildbond-pokemon-rules/README.md), [actors report](research/wildbond-actor-polish/README.md), [summary report](research/wildbond-party-summary/README.md) |
| Original audit and creature direction | PR [#543](https://github.com/ecbarish/generations/pull/543), separate proposal [#548](https://github.com/ecbarish/generations/pull/548); do not assume separate proposal branches are included in the chapter |

Species identities are namespaced (`pokemon:16`, `pokemon:37`, `pokemon:194`), with original identities/legacy aliases maintained by the registry work. Preserve identities and migration contracts; do not use presentation names as save keys. The original 189-species catalogue remains intact.

## Launch, private assets and saves

With Godot 4.7.2 installed, from repository root:

```powershell
$env:GODOT='C:\Users\evanb\Godot\Godot_v4.7.2-stable_win64_console.exe'
& $env:GODOT --path wildbond-godot --rendering-method forward_plus res://tests/opening/play.tscn
```

The existing `wildbond-godot/tests/journey/Play First Journey.bat` opens the same chapter. Use `--rendering-method gl_compatibility` for the alternate renderer. WASD/arrows walk, Shift runs, E interacts, B opens Bag, Escape opens/closes menu, Tab opens map. N/R/T are retained development atmosphere controls, not story era progression.

**Private pack:** use `wildbond-godot/tests/private_sprites/Setup Private Sprites.bat` with Python + Pillow, or the importer directly. Its default is `%LOCALAPPDATA%/Wildbond/private-sprites/v1`; sandboxed Windows app storage may resolve that elsewhere. The ignored `wildbond-godot/tests/private_sprites/local-pack.json` points to the actual root; inspect it rather than hardcoding another machine's path. A fresh checkout may have no private pack and show fallback actors. Do not mistake that for the final private appearance, or commit the locator/pack to make it work.

The current pack verifies 50 files, three species and six NPC roles; pinned hashes/provenance are recorded externally. Emerald Brendan supplies trainer art; NPC roles are Maren/Mom, Wren/May, Pip/Little Boy, Bram/Hiker, healer/Nurse and shopkeeper/Mart Employee. Names and story stay Wildbond's. Platinum fronts/backs and PMD directional animations serve the current Pokémon. Source pins and geometry/anchor validation are in the importer/manifest. Keep source PNGs, derived copyrighted art and actual-art screenshots external. Public capture scripts use fallback art.

**Save safety:** chapter filename is `user://wildbond_pokemon_chapter_v1.json`, now schema 3 despite its filename. A saved original-starter individual marker prevents repeat adoption. Schema-two records are validated against independently frozen data and backed up as `.pre-v3` before upgrade; their parties/resources/progress survive. Bad migration backups and future schema-four records hold writes. Earlier builds already treat schema three as future, preventing rollback on reopening. Optional version-one `opening` metadata stores local chapter position/story/items/results. Schema-one migration preserves a validated independent `.pre-v2` backup; future/corrupt records hold writes. Original adventure `journey.json` stays separate. Closing mid-battle resumes the pre-battle checkpoint; results commit on Return to Trail. Never run old/new chapter writers simultaneously. Tests/captures use isolated process-specific paths; do not test recovery by corrupting Evan's real save.

## PR dependencies and verification snapshot

Verified open on 2026-10-18; this table is a snapshot, not live status. Fetch the PR's current head/base, reviews and CI before continuing. Do not blindly cherry-pick the newest commit onto main: its parents supply the systems it uses.

| Order | PR / branch | Purpose |
| --- | --- | --- |
| 1 | [#545](https://github.com/ecbarish/generations/pull/545) `codex/night-market-header-fit` | Unrelated Night Market repair, currently the base of registry work |
| 2 | [#544](https://github.com/ecbarish/generations/pull/544) `codex/wildbond-species-registry` | Compatible original/imported identities and runtime registry |
| 3 | [#546](https://github.com/ecbarish/generations/pull/546) `codex/wildbond-round-battle` | Isolated turn-based battle foundation |
| 4 | [#547](https://github.com/ecbarish/generations/pull/547) `codex/wildbond-muse-intake` | Supplied battle art/math intake and selected Bogsnap correction |
| 5 | [#549](https://github.com/ecbarish/generations/pull/549) `codex/wildbond-private-sprites` | External art intake, animation and private clearing |
| 6 | [#550](https://github.com/ecbarish/generations/pull/550) `codex/wildbond-thornwood-atmosphere` | 3D environment study |
| 7 | [#551](https://github.com/ecbarish/generations/pull/551) `codex/wildbond-town-study` | Town/services and Pokémon-inspired UI |
| 8 | [#552](https://github.com/ecbarish/generations/pull/552) `codex/wildbond-larkhaven-layout` | Measured layout and map/reference workflow |
| 9 | [#553](https://github.com/ecbarish/generations/pull/553) `codex/wildbond-pokemon-journey` | Persistent chapter party/catches/storage |
| 10 | [#554](https://github.com/ecbarish/generations/pull/554) `codex/wildbond-pokemon-rules` | Bounded Pokémon rules and migration |
| 11 | [#555](https://github.com/ecbarish/generations/pull/555) `codex/wildbond-opening-chapter` | Connected measured chapter and original NPC hooks |
| 12 | [#556](https://github.com/ecbarish/generations/pull/556) `codex/wildbond-actor-polish` | Matching animated NPCs and grounded creatures |
| 13 | [#557](https://github.com/ecbarish/generations/pull/557) `codex/wildbond-party-summary` | Party summary |
| 14 | [#558](https://github.com/ecbarish/generations/pull/558) `codex/wildbond-ai-handoff` | Original handoff and startup discovery |
| 15 | [#559](https://github.com/ecbarish/generations/pull/559) `codex/wildbond-starter-sprites` | Original trio sprite candidates / unsaved art audition |
| 16 | [#560](https://github.com/ecbarish/generations/pull/560) `codex/wildbond-live-starters` | Real original starter choice, saved mixed parties and conservative upgrade |

#543 audit and #548 creature proposal are separate main-based PRs, not missing links between these branches. Resolve review/rebase/dependency order with Generations Reviewer; do not merge or deploy yourself. The shared browser tab at `http://127.0.0.1:8879/docs/research/wildbond-layout/index.html` is a design board, not evidence that the newest native chapter is running or published.

Latest local gameplay integration (#560) adds 69 original-starter/migration assertions; 45 rules, 48 journey, 50 opening, 88 summary and 328 actor checks still pass. [Claude review task](research/wildbond-live-starters/CLAUDE-TASK.md) is deliberately report-only; Codex owns integration. Prior full baseline verification (#557), also rerun green for #560: **all 28 repository suites pass**, including Wildbond 26,976, Starfall 488, 189 original species and 23 unchanged save names; 88 summary, 50 opening and prior 328 actor assertions pass. Forward+ and Compatibility captures were inspected. These results do not establish human fun, mobile delivery, low-end performance or remote CI success. Reports retain exact boundaries and evidence. Re-run appropriate checks after your changes; do not claim inherited results as a new run.

```powershell
& $env:GODOT --headless --path wildbond-godot --script res://tests/opening/checks.gd -- --private
& $env:GODOT --headless --path wildbond-godot --script res://tests/opening/summary_checks.gd -- --private
& $env:GODOT --headless --path wildbond-godot --script res://tests/opening/actor_checks.gd
& $env:GODOT --headless --path wildbond-godot --script res://tests/journey/rules_checks.gd
$env:NODE_PATH='C:\Users\evanb\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node wildbond-godot/tests/private_sprites/quiet-checks.cjs
```

The quiet helper invokes the unchanged full repository runner while muting its test-browser speech/audio. This prevents Little Ranch test phrases such as “Night night” and “berries” from repeating aloud. It does not change assertions or normal game settings. Standard command remains `node tools/run-all-checks.cjs`. Without a private pack, omit `--private` for portable opening/summary checks; installed actor checks require that pack. New-machine executable/dependency paths must be adjusted.

## The next useful increment

1. Play the current catch → inn → Maren loop and Wren/Bram battles from the latest feature head. Fix any confusing controls, pacing or broken return/save behavior first; automated checks are not a fun score.
2. Inspect the existing graph, Thornwood/Rootwater/Knothollow briefs and gates. Choose one bounded extension with a reachable destination, discovery or meaningful encounter and a coherent return to Larkhaven. Draft the local measured grid and confirm actual connections/landing cells before dressing it. The exact new quest/reward is a design task, not already approved canon in this handoff.
3. Reuse the installed trainer/NPC/creature pipeline and supported battle rules. Add species/mechanics only when the expedition needs them. Preserve original lore and the later shortcut requirements.
4. Test collision/reachability, encounter → return, one-time rewards, old save/reopen, private/fallback presentation and required repository suites. Inspect the real screen, push the scoped PR and update this handoff only when its facts change.

## Paste into a new AI chat

> Continue Wildbond in ecbarish/generations. First read docs/WILDBOND-HANDOFF.md, AGENTS.md and docs/AI-START.md. If the handoff is absent on main, fetch codex/wildbond-ai-handoff / PR #558 and inspect it in your own checkout. Reconcile live PR heads and ownership before building. Evan wants a private Pokémon-style game with Wildbond's original interconnected world/story, lively imported sprites and PBA-inspired environment presentation, likely standard turn-based battles. Continue the existing native chapter rather than starting over. Preserve saves and keep copyrighted assets outside Git/public exports. The handoff lists what works, launch/tests, limitations and the suggested connected Thornwood expedition. Follow the current request and repository review process; do not merge/deploy yourself.
