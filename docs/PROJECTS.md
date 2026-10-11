# Idle Arcade: the master project list

Every outlined project in one place, so Evan can hand work to any assistant (Claude, ChatGPT/Codex, or another AI)
and they can carry it to launch. START-HERE.md says what is happening *right now*; this file says *everything there
is to do*. Ground rules for how assistants work, and how much creative freedom they have: [CREATIVE.md](CREATIVE.md).

## Realmbound readability

| ID | Project | Size | Status | Notes |
|---|---|---|---|---|
| RB1.6 | Readable ability names | S | ready: PR #141, Codex, 2026-10-10 | PLAYTEST pass 1; action bar only, no gameplay or saves |

## Realmbound road approach

| ID | Project | Size | Status | Notes |
|---|---|---|---|---|
| RB1.3 | Walkable town road (T48) | M | claimed: Codex, 2026-10-09, codex/realmbound-road-places | Inn and traveler camp in the world; no Godot work |

## Area briefs for the Godot build

| ID | Project | Size | Status | Notes |
|---|---|---|---|---|
| WB3.5b | Sunthread and Farwatch briefs (T49) | S | claimed: Codex, 2026-10-09, codex/wildbond-final-area-briefs | Existing canon/data handoff for Claude; no Godot edits |
| WB3.5a | Hollowecho brief (T47) | S | claimed: Codex, 2026-10-09, codex/wildbond-hollowecho-brief | Existing canon/data gathered for Claude; Stillreed already built, Sunthread/Farwatch later |

## Seasonal content handoff

| ID | Project | Size | Status | Notes |
|---|---|---|---|---|
| WS6 | Four festival traditions and lines (T51) | S | ready: PR #78, Codex, 2026-10-09 | Stacked after T50; data/lore only |
| WS3 | Seasonal encounter and townsperson data (T50) | M | claimed: Codex, 2026-10-09, codex/wildbond-seasonal-data | Append-only export fields; Classic unchanged |

## Starfall member writing handoff

| ID | Project | Size | Status | Notes |
|---|---|---|---|---|
| SF2.4a | Member arcs, separate JSON handoff (T52) | M | ready: PR #79, Codex, 2026-10-09 | Twelve new beats; Godot files remain Claude's |

## League writing handoff

| ID | Project | Size | Status | Notes |
|---|---|---|---|---|
| WB4.4a | League script and payoff map (T53) | S | ready: PR #80, Codex, 2026-10-09 | Existing finale and optional homecoming; undecided mystery reveals held |

## Champion return conversations

| ID | Project | Size | Status | Notes |
|---|---|---|---|
| WB4.4b-content | Gate scene and Warden returns (T54) | S | ready: PR #81, Codex, 2026-10-09 | Append-only exported writing, not the pending deep reveal |

## Final-truth clue audit

| ID | Project | Size | Status | Notes |
|---|---|---|---|
| SF3.3-outline | Four Starfall seasonal chapters (T57) | S | ready: PR #84, Codex, 2026-10-09 | Design/writing handoff in village plan; no Godot edits |
| WB3.6-pacing | Final-four-area and league pacing (T56) | S | ready: PR #83, Codex, 2026-10-09 | Diagnostic copies of current Godot rules/battles; report before tuning |
| WB4.4b-reveal | Three observations and the final truth (T58) | M | ready: PR #101, Codex, 2026-10-09 | Approved account and observations; data only for Claude to place |
| WB4.4b-audit | Clue fit and three late observations (T55) | S | ready: PR #82, Codex, 2026-10-09 | Writer doc first; no reveal text before Claude review |

## How to use this list

- **Pick** any project whose status is `open` and whose dependencies are done, in the focus order of
  [PRIORITIES.md](PRIORITIES.md) (2026-10-09: Wildbond in Godot, then the Starfall village, then Realmbound).
- **Claim it** before starting: change its status to `claimed: <who>, <date>, <branch>` in a tiny first commit
  (push it), so two assistants don't build the same thing. Release it (`open`) if you stop without finishing.
- **One project, one branch** (`claude/<topic>`, `codex/<topic>`, `<ai>/<topic>`). Keep to the files the project
  needs; say in the PR which files you touched so parallel work merges cleanly.
- **Done means:** it works in the game, all test pages pass (`tests/run.html`, `tests/wildbond.html`,
  `tests/starfall.html`, `tests/sound.html`), new behaviour has checks, the README changelog and the relevant design
  doc are updated, START-HERE's session log has a line, and this file's status says `done <date>`.
- **Bigger than it looked?** Split it here into parts (`R3a`, `R3b`) and ship the first part.
- Specs: a project's **Spec** column points to the detailed ticket or design section. If there is none, write a
  short plan in the PR (or in `docs/proposals/`) before building; see CREATIVE.md for when Evan must approve first.

**Sizes:** S = an afternoon (a few files), M = a day (a feature with checks), L = several days (a system), XL = a
multi-part effort (split it). **Kinds:** Data (content in existing systems), System (new mechanics or engine work),
Art (visuals and audio), Polish (UX, feel, fixes), Design (a plan or research, no code).

## Read first: where things stand and what we've learned (updated 2026-10-08, night)

These decisions and lessons override older rows below wherever they disagree. Each points to its source. **The path
for every game, and how to make your next ticket when your lane is empty: [DEVELOPMENT-PATH.md](DEVELOPMENT-PATH.md).**

- **Fleshed-out games are built in Godot** (Evan, 2026-10-08): `wildbond-godot/` (the new Wildbond) and
  `starfall-godot/` (the Starfall village). They also play on the web: previews in `play/` (re-export after changes
  worth showing; `play/README.md`). The browser versions stay playable and get fixes, but **no big browser screen
  rebuilds** (the old Wildbond phases 1, 4 and 5 are being built in Godot instead). Realmbound stays in the browser for
  now; whether it moves is an open question for Evan (START-HERE). Primordial stays light.
- **Everything happens in the game window**, for every game (CLAUDE.md). People speak in place, menus are things you
  hold, a thin overlay at most.
- **Games feel like games** (docs/wildbond-plan.md principles): physical interactions, features arrive with the story,
  full words, nothing plays itself.
- **A world that knows where things are** (docs/proposals/depth-and-first-person.md, approved): every new thing has a
  footprint and a height, ground gets heights, things happen where they are, **maps are data, never pictures**, and
  nothing is drawn standing on someone (the partner stands beside you; trainers keep a gap). First person comes much
  later, as the reward of the wild bond; the fading took depth as well as colour (canon).
- **Stories are woven** (docs/lore/wildbond-threads.md): threads, fair clues, several truths alive until late. Canon
  decided: the wild bond, the Unbound, heritages (docs/proposals/wildbond-heritage.md), reputation
  (docs/proposals/reputation-and-consequence.md), the creature catalogue and evolution
  (docs/proposals/creature-catalogue-and-evolution.md).
- **Player text** (docs/CREATIVE.md "Writing for players"): capitalised names, the world's words, no jargon, and look at
  the real screen. In Godot, use only plain Latin characters (the web font has no arrows, dots or circles: write
  "Orders ready: 2 of 3", not symbols).
- **Variety without cheap repetition** (docs/proposals/showing-the-games.md): we have the whole Ninja Adventure pack
  (CC0, `C:\Users\evanb\Godot\NinjaAdventure`): 41 tracks, sounds, animated water and waterfalls, interiors, effects.
  Each area gets its own furniture, sound and battle effects; people and creatures stay our own code-drawn style.
  Credit everything in CREDITS.md. AI-generated assets are allowed (credited). Ask Evan before paying for anything;
  downloads need his OK.
- **Readable numbers:** stat bars measure against the strongest creature known (120) and show the number.
- **Friends are testing now:** the Come Play page (playtest.html) says what each game is, our goals, first steps and
  "if you're lost"; keep it current when a game changes. Full guides wait until systems settle. Trailer:
  tools/trailer (recording flags `--demo`, `--photo`, `--colour`); Windows builds go in `Desktop\Game builds`.
- **Starfall village** (docs/plans/starfall-village.md): one hands-on thing per place, hire people once you've
  mastered a job, you can fail and excel, no windfalls, not a game within a game.
- **Process:** ChatGPT works on browser games and data (never `wildbond-godot/`, `starfall-godot/` or `play/`); no PR
  limit; Claude merges, bumps versions and keeps START-HERE, QUEUE and this file current. After any merge, check for
  leftover conflict markers (`git grep -n "^<<<<<<< "`). Evan likes big chunks per prompt.
- **Tools on Evan's PC:** Godot 4.7.2 and its export templates (`C:\Users\evanb\Godot`), ffmpeg
  (`C:\Users\evanb\Tools\ffmpeg-9.0.2-essentials_build\bin`).

## Arcade preview discoverability

| ID | Project | Size | Status | Notes |
|---|---|---|---|---|
| AR2.2 | **Put the new previews on the arcade shelf** (T46) | S | claimed: Codex, 2026-10-09, codex/arcade-previews | New preview cards and links; Classic saves stay separate; no Godot/export edit |

## Species appearance data

| ID | Project | Size | Status | Scope |
|---|---|---|---|---|
| WD2-data | Species appearance contract | M | built: Codex, PR #113 | Additive browser metadata; renderer remains separate |

## Wildbond in Godot (the new Wildbond; Claude's lane)

Browser-data handoff T40: areas 5–8 clues and chatter merged 2026-10-08 (Wildbond v1.8.0, PR #64); they reach the Godot version when Claude builds those areas (WG2).

Built so far (wildbond-godot/README.md): the opening (register, barn, Wren), Thornwood, Saltmarsh, Emberfall,
Cloudglass, wild creatures and bonding, trainers and Wardens, the ranch as a place (paddock, barn, nursery, trough,
workbench and gear), evolution shapes and conditions, heritages, music, saving. Checks: `tests/run_tests.gd`.

| ID | Project | Size | Status | Notes |
|---|---|---|---|---|
| WB2.6 | **Early-road heritage recognition** (T45; browser data exported for Claude) | S | claimed: Codex, 2026-10-08, codex/wildbond-early-heritages | All four origins for existing early-road NPCs and Wardens; ledger and checks |
| WG1 | **Tamer abilities** with heritages: orders that grow from who you are and who taught you (Toren's Steady) | M | open (next) | creature-catalogue-and-evolution.md §4 |
| WG2 | **Stillreed Basin** and the areas after it (Hollowecho, Sunthread, Farwatch), from the browser data | L | open | Each with its own furniture, sound and music (variety plan) |
| WG3 | **The league, the Champion and the Spire** in Godot | L | open | After WG2 |
| WG4 | **The wild bond**: discovered at the edge of defeat with a Kindred creature; hints placed area by area; the first-person glimpse | L | open | §5 of the catalogue proposal; thread 2 in the ledger |
| WG5 | **The Unbound** and reputation: a faction you can oppose, join or infiltrate; a world that remembers | L | open | reputation-and-consequence.md |
| WG6 | **Depth, step 1**: ground heights (cliffs, ledges, the loft), footprints and heights on objects; fix the colour layer drawing you and your partner over people standing in front of you | M | open | depth-and-first-person.md part 1 |
| WG7 | **Variety pass**: animated water and waterfalls, interiors (inn, shop, homes), element effects in battle, area sounds, edge tiles where paths and plots end | M | open | showing-the-games.md |
| WG8 | **Maren's daily letter**, ranch jobs (Palworld-style delegation), Maren's hint for "where next" in the field book | M | open | wildbond-plan.md phase 5 |
| WG9 | **A larger catalogue in Godot**: bodies for new families and species from ChatGPT's batches (T37) | M per batch | open | Export with tools/godot-export.ps1 |
| WG10 | **Phone controls** for the web preview (an on-screen walk pad, tap-to-walk everywhere) | S | open | The previews are best on a computer today |
| WG11 | **First person, later**: a 3D view generated from the same maps | XL | later | V10; after the 2D game is done |

## Starfall in Godot (the village; Claude's lane)

Built so far (starfall-godot/README.md): the town, the guild board, adventurers who choose their own jobs, the inn's
counter by hand and Bryn, plots and Hob's plans, the Healer's Hut and Ama, a Training Yard, the Smithy by hand and
Garrick, the Apothecary with prices, ranks and newcomers, music, saving. Checks: `tests/run_tests.gd`.

| ID | Project | Size | Status | Notes |
|---|---|---|---|---|
| SV1 | **Members' stories**: short arcs per adventurer, choices that can go either way | M | open (next) | Like Realmbound's R4 |
| SV2 | **Seasons as chapters**, festivals, travelling merchants | L | open | starfall-village.md; shared calendar and festivals: docs/proposals/seasons-and-holidays.md |
| SV3 | **Failing and excelling, visible**: a place that closes when run badly (and reopens), people who leave, rarer adventurers drawn by a well-run town | M | open | starfall-village.md "Failing and doing exceptionally" |
| SV4 | **The tavern and placement**: a tavern you serve at; buildings near each other help a little | M | done 2026-10-09 (SF2.3) | |
| SV5 | **Expeditions you can see**: the wilds past the gate as a place, adventurers' camps, catalogue creatures as monsters | L | open | Shared catalogue |

## Local development helper

| ID | Project | Size | Status | Notes |
|---|---|---|---|---|
| LH0 | Local helper queue runner (Lane D0) | S | done, merged 2026-10-08 (PR #66) | OpenCode with local Ollama; review required; docs/research/local-ai-helper.md |

| LH1 | Local helper permission order (D0b) | S | claimed: Codex, 2026-10-08, `codex/local-helper-permissions` | Follow-up to Claude's benchmark: preserve wildcard-first runtime overrides |

## Showing the games

| ID | Project | Size | Status | Notes |
|---|---|---|---|---|
| PM1 | Come Play page for friends | S | done 2026-10-08 | playtest.html; keep it current |
| PM2 | Web previews and Windows builds of the Godot games | S | done 2026-10-08 | play/; Desktop\Game builds; rebuild after big changes |
| PM3 | Trailer | S | done 2026-10-08 | images/play/trailer.mp4; tools/trailer |
| PM4 | A trailer per game, and a short "what's new" clip after big releases | S each | open | Same tools |

## Launch track (the road to a public 1.0)

"Launch" means Wildbond and Realmbound are complete, polished, safe with saves and pleasant on desktop and phone (with Wildbond moving to Godot, what Launch means for it is a question for Evan in START-HERE; until he answers, these tracks still apply to the browser games),
and the arcade's homepage shows them off. Any assistant may push these forward without asking first.

| ID | Project | Size | Kind | Depends | Status | Spec / notes |
|---|---|---|---|---|---|---|
| L1 | **Shared settings panel** in every game: sound, graphics quality (S6), reduced motion, text size | M | Polish | G1 | done 2026-10-07 (Claude): shared/settings.js (text size, motion) plus each game's rows (sound, graphics, Wildbond view distance) | One `shared/settings.js`; respects `prefers-reduced-motion` by default |
| L2 | **Save safety** in every game: export / import / automatic backup slot, version tags in saves | M | System | — | done 2026-10-07 (Claude): automatic backups and recovery in shared/engine.js, "Your save" box (download, load a file, restore) in all three games | Starfall already exports; copy its pattern; never change existing save keys |
| L2b | **Otherworld test-runner save safety** | S | Polish | L2 | done: Codex, merged 2026-10-08 by Claude (PR #56) | tests/otherworld.html; failed-check recovery regression page |
| L3 | **Mobile pass**: layouts, tap targets, the walkable worlds on touch, performance on a mid phone | L | Polish | G4 | part 1 done 2026-10-07 (Claude): 40px tap targets on phones and touch screens in every game (shared/settings.js), phones start the launcher on the road; checked at 375px, no sideways scroll. Still to do: performance on a mid phone, a shorter Realmbound phone layout (zone list) | Test at 375 px wide; scenes must stay above ~40 fps; see L11 for big screens |
| L4 | **Onboarding**: a gentle first 10 minutes per game (what to click, what Auto does) | M | Design+Polish | — | Realmbound done: Codex, merged 2026-10-08 by Claude (v1.1.0, PR #47); Wildbond onboarding comes with the Godot opening | Realmbound and Wildbond first; use the shared dialogue scenes |
| L5 | **Install and offline** (web app manifest + service worker), so the arcade works like an app | S | System | — | done: Codex, 2026-10-07, `codex/arcade-offline`, merged 2026-10-07 by Claude, who made it online-first (no version bumps; see docs/offline.md) | docs/offline.md; GitHub Pages scope, complete release cache, waiting updates, browser checks |
| L6 | **Credits** page and `CREDITS.md` for any outside assets | S | Polish | — | done 2026-10-07 (Codex), merged 2026-10-07 by Claude on `codex/arcade-credits` | credits.html, CREDITS.md and full notices in licenses/; see CREATIVE.md "Outside assets" |
| L7 | **Bug bash and balance pass**: full playthrough sims of both games, fix what they find | L | Polish | W1, W2 | done: both audits merged 2026-10-07 | Use the pacing sim methods in the design docs; docs/wildbond-launch-balance.md records challenge failures and remaining manual playtests |
| L8 | **Immersive homepage** that shows off the engines (living scene, sound, dialogue, creatures) | L | Art | G1, W2 | part 1 done 2026-10-07 (Claude): launcher/launcher.js, two styles (the living world, the arcade hall) with a player vote (docs/VOTES.md); part 2 the road; 2026-10-09 (AR2.12, PR #109) Evan chose **the arcade hall** as the one style to make the ultimate one (living world and road removed); next for the hall: more life in the room (other visitors, sound, a cabinet per new game, its own "coming soon" corner), then the walk-in arcade (AR3.1) | Evan: build once the games are further along (START-HERE) |
| L9 | **Versioning and release notes**: a version number in each game, a release checklist | S | Polish | — | done 2026-10-10 (Jules) | HANDOFF.md "Releasing a version" |
| L10 | **Accessibility**: keyboard play everywhere, colour contrast, readable fonts, screen-reader labels | M | Polish | — | claimed: Codex, 2026-10-08, codex/accessibility | |
| L11 | **Big screens**: laptop, desktop and ultrawide (3440x1440) layouts that use the space: the scene grows (wider view in the walkable worlds, more of the zone in Realmbound), panels sit side by side, text scales, canvases stay crisp at high resolution | M | Polish | — | part done 2026-10-10 (Claude): wide layouts at 1700 px and 2400 px+ in every game and the hub (a 21:9 scene on ultrawides); panel text and buttons scale (zoom 1.12 / 1.3, canvases never zoom); Wildbond view distance (Close/Wide/Far, V key; Wide by default on tall scenes). Left: a similar zoom for the Realmbound town if wanted | Evan's main screen is a 45-inch ultrawide; test at 1366x768, 1920x1080 and 3440x1440 alongside 375 px |

| T8-R | **Realmbound guide and lore page** (T8, Lane A3) | M | Design | — | done, merged 2026-10-08 | docs/ROADMAP.md T8; Wildbond waits for its redesign. A8 opening audit ready in PR #44: docs/realmbound-first-ten-minutes.md (documentation only; L4/V1 implementation remains open) |

| T8-Rb | **Realmbound guide: rooms and commissions** | S | Polish | R5, R6 | done, merged 2026-10-08 (PR #57) | Guides follow the released Smithy and Inn |

| RE-G | **Godot research assessment and animation/migration research prompt** | S | Design | — | done, merged 2026-10-08 (documentation only, requested by Evan) | Separate research files; no Godot or shared plan edits |

| RE-O | **First-play research briefs for Realmbound, Starfall and the other games** | S | Design | — | done: Starfall review and prompt archive merged 2026-10-08 (research only) | docs/research/gemini-prompts.md; research does not authorize extra implementation |

## Graphics: light, fog and atmosphere (S6)

Evan (2026-10-09): *"paying attention to the details of the lighting and the shadows greatly affects the overall
look."* Inspired by WoW: Forever's renderer: volumetric fog you move through, sun and moon shadows that line up and
move with the time of day, bounce light that carries colour into shadows, real torchlight, zone-by-zone tuning.

| ID | Project | Size | Kind | Depends | Status | Spec / notes |
|---|---|---|---|---|---|---|
| G1 | **Light engine** `shared/light.js`: sun/moon model, aligned sprite shadows, fog pockets with light scattering, height fog, bounce light, colour grading, light shafts, bloom | L | System+Art | — | done 2026-10-09 (Claude) | HANDOFF.md "Light engine" once built |
| G2 | **Zone lighting passes**: tune every Realmbound zone and dungeon and every Wildbond area to its own character (Duskwood-style care) | L | Art | G1 | Realmbound: every zone tuned 2026-10-07 (Claude: golden dusk, a night colour per zone, bounce light; Frostmere by Codex); dungeons open. Wildbond: Saltmarsh done, the rest is T32 (ChatGPT). Frostmere done: Codex, 2026-10-07, `codex/realmbound-frostmere-light`, merged 2026-10-07 by Claude; other zones open | Low snow haze, cool bounce light and clearer blue mountain layers; before/after screenshots in the PR |
| G2-saltmarsh | **Saltmarsh Coast lighting**: low sea mist, coastal bounce light and softer shafts | S | Art | G1 | done, merged 2026-10-07 (Codex, PR #38) | One-area pass; before/after screenshots; all other area defaults preserved |
| G3 | **Water**: reflections of sky, sun and moon, flow, depth colour, in the HD-2D views | M | Art | G1 | open | Stillreed, Saltmarsh, the Fens |
| G4 | **Graphics quality setting** (Low / High) and a performance budget for phones | M | System | G1 | open | Auto-pick Low on slow devices |
| G5 | **Diorama lighting**: real shadows, fog and torchlight in Wildbond's three.js era | M | Art | G1 | open | three.js r134 shadows and fog |
| G6 | **Weather polish**: puddles that gather in rain, wet sheen, snow that settles, wind you can see in grass | M | Art | G1 | open | |
| G7 | **Reactive light** (Evan: light should react to the world, not be a drawn-on shadow): walls and buildings *block* light (2D ray-cast visibility from every lamp and fire, so light spills through doorways and stops at walls); each sprite is lit on the side facing the light and dark on the other (and rim-lit at sunset); moving lights (your torch, a mage's spell, lightning) re-light everything they pass; cloud shadows drift over the ground; bright surfaces reflect colour onto their neighbours | L | System+Art | G1 | open | Today G1 already recomputes every shadow each frame from the sprite's real shape and the current sun or nearest lamp; G7 adds occlusion, per-sprite shading, moving lights and reflections |

## Studio: editing, GM and repair tools (Evan, 2026-10-09)

A place where Evan can change things himself without code, and fix problems quickly. No server: edits are saved as
small "patch" files that the games load on top of the built-in data, and an Export button turns them into a file an
assistant commits for everyone. Build in this order; each step is useful alone.

| ID | Project | Size | Kind | Depends | Status | Spec / notes |
|---|---|---|---|---|---|---|
| E1 | **Studio shell** (`studio.html`): one page with tabs per game, a search box, and an "export my changes" button; patch format in `shared/patch.js` that every game reads at start | M | System | — | part done 2026-10-10 (Claude): studio.html with GM mode, saves and backups, GM log; still to do: the patch format for content edits | Write the patch format first; patches never replace saves |
| E2 | **GM panel** (local only, behind a toggle): give gold, items, levels, creatures; teleport; set time of day and weather; heal; unlock areas; spawn a boss; all logged | M | System | E1 | done 2026-10-10 (Claude): shared/gm.js + a GM file per game; add more actions any time | Reuses the test hooks (`window.__rb`, `__wb`); never in normal play |
| E3 | **Save doctor**: load any save, see it as readable fields, fix values with checks, restore from automatic backups, export/import | M | System | L2 | done 2026-10-10 (Claude): in studio.html; summary, health check with one-click fixes, a searchable field editor; add per-game checks to `DOCTOR` as games grow | Never edits a save without making a backup first |
| E4 | **Text editor**: every line of dialogue, quest text, item and creature name, with a live preview in the scene style | M | System | E1 | open | |
| E5 | **Creature and quest editors**: stats, moves, evolutions, wild tables; quest goals and rewards; validates against the same rules the tests use | L | System | E1 | open | Reuse the checks from tests/ as validators |
| E6 | **Map painter**: paint tiles, place people, signs, items and exits; walk the map right there; export | L | System | E1 | open | Or import maps from the free LDtk/Tiled editors |
| E7 | **Lighting and music tuner**: sliders for a zone's fog, shadow strength, colour grade; play and tweak a tune | M | System | G1, E1 | open | Good for G2 |

## Feedback and suggestions (Evan, 2026-10-09)

| ID | Project | Size | Kind | Depends | Status | Spec / notes |
|---|---|---|---|---|---|---|
| F1 | **Issue forms** for playtest feedback, bugs and suggestions | S | Polish | — | done 2026-10-09 | `.github/ISSUE_TEMPLATE/`, docs/FEEDBACK.md |
| F2 | **In-game "Send feedback" button** in every game: opens the right form with game, version, place and a small summary filled in (no personal data) | S | Polish | F1 | done 2026-10-10 (Jules) | shared/feedback.js |
| F3 | **Triage habit**: assistants read open issues at the start of a session (docs/FEEDBACK.md) | S | Process | F1 | done 2026-10-09 | In CLAUDE.md's start-of-session steps |
| F4 | **Tester build notes**: a short "what to try" page for each release, linked from the homepage | S | Polish | L9 | done: Codex, 2026-10-07, `codex/playtest-notes`, merged 2026-10-07 by Claude | playtest.html; docs/playtesting.md |

## Wildbond, browser version (content complete; it stays playable and gets fixes)

New Wildbond work goes to **Wildbond in Godot** above. Browser data (species, maps, story) still feeds the Godot version through `tools/godot-export.ps1`, so data tickets here (new species, lore) help both.

| ID | Project | Size | Kind | Depends | Status | Spec / notes |
|---|---|---|---|---|---|---|
| T29 | Area 7, Sunthread Commons (62-68), Warden Halen, Loom Badge | M | Data | — | done 2026-10-10 (ChatGPT) | ROADMAP.md "T29" |
| W1 | Area 8 (66-72), the last Warden and badge | M | Data | T29 | done, merged 2026-10-10 (ChatGPT) | docs/lore/wildbond.md "Area 8 canon"; Farwatch/Rysa/Horizon/Watchlight, copied T29's shape |
| W2 | **The league and the Champion** (about 72-75): the ending, its scenes, Wren's last battle | L | System+Data | W1 | done, merged 2026-10-07 (ChatGPT, T30) | docs/creature-game-design.md; decision 1 in docs/research/decisions.md |
| W3 | **Post-game**: battle tower, roaming legendaries, rematch tiers, the road to 100 | L | System | W2 | part 1 done: Codex, 2026-10-07, `codex/wildbond-postgame` (T31), merged 2026-10-07 by Claude; part 2 (roaming legendaries) open | |
| W4 | **Contests and races** at the ranch | M | System | — | open | docs/creature-game-design.md |
| W5 | **Ranch jobs** on the shared roster (S3) | M | System | — | moved to Godot (WG8) | shared/roster.js; docs/research/decisions.md |
| W6 | **Modern 3D era** after the Diorama | XL | Art | G5 | superseded by WG11 and V10 (3D from the Godot maps) | Split into parts |
| W7 | Map polish: Stillreed's ferry landing you can see; interiors for town buildings | S | Art | — | Ferry landing done: Codex, 2026-10-07, `codex/wildbond-ferry-landing`, merged 2026-10-07 by Claude; interiors open | Raised crossings, reachable jetty, moored skiff and sign in all five eras; no transport mechanic |
| W8 | Pacing pass for areas 5-8 (sim) and tuning | M | Polish | W1 | done, merged 2026-10-07 | docs/wildbond-launch-balance.md: 15-case before/after audit and level-only tuning; failed Nuzlocke starts recorded separately |
| W9 | **Baby forms and growth (design)**: creatures hatch or are found as babies and grow through more stages (baby, young, adult, elder?), giving more room to raise them; how it meets eggs, evolution levels, caps, and old saves | M | Design | — | proposal written 2026-10-07 (Claude), waiting for Evan | Evan, 2026-10-09; write `docs/proposals/creature-growth.md` first (CREATIVE.md: new system) |
| W10 | **Baby forms (build)**: the growth stages, baby art from the existing families, ranch care that matters more for babies | L | System+Art | W9 | open | Old saves keep their creatures as they are |
| W11 | **A larger roster**: batches of 10-12 new species per element, filling every family and element pairing (target about 150 to start), each with a dex line; ChatGPT-friendly data work | L (batches) | Data | W9 | batch 1 merged 2026-10-08 (v1.7.0, PR #51); batch 2 is T37 (ChatGPT, A11) | T6 rules in creature-game-design.md; one batch per PR |
| W12 | **New creature families** (body shapes beyond the current ones: serpents, golems, insects, jellyfish...) with their own art | L | Art | — | moved to Godot (WG9) | shared/creatures.js and 01-art.js |
| W13 | **Character creator**: your tamer's body type (male, female, other), skin, hair style and colour, outfit; shown in the world, in scenes and in battle | M | Art+System | — | done in Godot 2026-10-08 (Maren's ranch register, with heritage) | Evan, 2026-10-07; part of the opening (B3b); later shared with Realmbound's heroes |
| W14 | **Creature variants**: rare looks within a species (a shimmering colour like shinies, tiny and huge sizes, unique pattern markings like Spinda), shown in the Wilddex; cosmetic, never stronger | M | Art+Data | — | done, merged 2026-10-08 (v1.6.0, PR #43) | Evan, 2026-10-07 |

## Realmbound (classic-MMO idle, flagship)

| ID | Project | Size | Kind | Depends | Status | Spec / notes |
|---|---|---|---|---|---|---|
| R3 | **Battlegrounds**: faction rivalry, the hook the raid's ending sets up | L | Design+System | — | open | Write a plan first (CREATIVE.md: new system) |
| R4 | **Guild members' personal stories**: short arcs per adventurer, unlocked by mood and time together | M | Data+System | — | done, merged 2026-10-08 (Realmbound v1.2.0, PR #49); choices with consequences merged (v1.3.0, PR #53) | docs/realmbound-40-60.md "The guild as built" |
| R5 | **Crafted gear from 55** from the guild economy (the plan's gear route) | M | System | — | done, merged 2026-10-08 (Realmbound v1.5.0, PR #55) | docs/realmbound-40-60.md "Loot from 40 to 60" |
| R6 | **Hub variety**: a layout per zone (Fenwatch Post, Lanternrest Lodge...), interiors for the inn and smithy | M | Art | — | done, merged 2026-10-08 (Realmbound v1.4.0, PR #54) | js/22-town.js |
| R6b | **T41: Pages become places**: Guild Hall, Trainer, Stable and quest givers | M | System+Polish | R6, T38 | claimed: Codex, 2026-10-08, `codex/realmbound-window-2` | docs/ROADMAP.md T41 |
| R7 | **Second raid tier** after The Hollow Throne | L | Data+System | — | open | docs/realmbound-40-60.md "Raids" |
| R8 | **Pacing re-measure 1-60** with every system on; tune zone XP only | M | Polish | — | done, merged 2026-10-07 | docs/realmbound-40-60.md "Measured" |
| R9 | Heroic tiers and loot review for the newest dungeons (Rootrot, Heartwood) | S | Polish | — | done, merged 2026-10-07 by Claude (Codex; docs/realmbound-heroic-review.md) | |

| RB-W1 | **T38 Realmbound in the game window, plan and part 1** | M | Polish | — | done, merged 2026-10-08 (Realmbound v1.6.0, PR #62) | ROADMAP T38; world fills the window, Quest Journal and Satchel overlays; no gameplay/balance or version changes |

## Shared systems and the world kit

| ID | Project | Size | Kind | Depends | Status | Spec / notes |
|---|---|---|---|---|---|---|
| S4c | **Starfall Guild's walkable guild hall** on the world kit | M | System+Art | — | open | shared/world.js; Realmbound's js/22-town.js is the example |
| S7 | **Shared roster in Starfall** (adventurers on jobs and expeditions) | M | System | — | open | docs/plans/starfall-guild.md G2 |
| S8 | **Shared settings** (see L1) and a shared **credits** screen (see L6) | — | — | — | — | Tracked in the launch track |

## Vision (Evan, 2026-10-07; read docs/VISION.md first)

| ID | Project | Size | Kind | Needs | Status | Notes |
|---|---|---|---|---|---|---|
| V1 | **Prologues**: a short, skippable narrated "trailer" per game in its own engine; plays on first visit to its launcher place and from a button; feeds onboarding (L4) | M per game | Art+Data | L8 | Realmbound arrival done: Codex, merged 2026-10-08 by Claude (PR #47); other games open | Dialogue + ambience + light engines; optional browser speech voice |
| V2 | **Look: Classic / Enhanced / Modern** across the arcade; Enhanced (HD-2D depth, rich light) as the first impression; a Realmbound HD-2D world view | L | Art+System | G1 | open | Poll testers on the starting look; Modern grows from W6 |
| V3 | **Game boxes**: box art, back of the box, an instruction booklet (the T8 guide) to pick up on the launcher, with an era slider (cartridge box → DVD case → store page) | M | Art | L8, T8 | open | Box art: Gemini images (CREDITS.md) or code-drawn |
| V4 | **Procedural content, done properly**: seeded Spire floors, Heroic dungeon layouts and affixes, weekly wild routes, rare-spawn events | L | System | W3 | open | Hand-made places stay hand-made |
| V5 | **A living world of bots**: simulated adventurers in Realmbound's zones (questing, chat, groups, asking for help), rules-based, no server | L | System | R4 | open | Like AzerothCore playerbots; AI chat later and optional |
| V6 | **Friends**: no-server sharing first (trade and battle codes, ghost teams, shared seeds), then a free hosted database (leaderboards, async trades), real-time co-op last | XL | System | — | open | Evan creates any service accounts himself |
| V7 | **Nodes** in Realmbound: camps grow into villages and towns from what the guild and the bots do there; neglect fades them | L | System | V5 | open | The Ashes of Creation idea, single-player |
| V8 | **Automation as earned QoL and delegation** (not skipping play): review each game's Auto against docs/VISION.md §8 | M | Design+Polish | — | open | Answers "when does full Auto unlock" |
| V9 | **Choices that matter** (Mass Effect, Fable): a remembered world state per save, story choices with lasting consequences, companions with loyalty and personal arcs who can be lost in rare warned moments, bonds and tasteful romance between adult characters, reputation | L | Design+System | R4 | open | Start with a few Realmbound story choices and the guild stories; Design doc first (CREATIVE.md "Ask Evan first" for permanent loss) |
| V10 | **A big world, first person one day** (every game): worlds as renderer-independent data, large chunked regions, real height, then a 3D renderer (third person, later first person) | XL | System+Art | W6 | open | docs/VISION.md §10; the 2D games stay complete at every step |
| V11 | **Walk into the arcade** (Evan, 2026-10-08): you walk through the arcade hall and through a door or portal into each game's world. **Clarified by Evan the same evening:** there is no single arcade avatar; the figure you walk as in the hall resembles the character of the game you are about to enter or have just come out of (your Wildbond tamer by Wildbond's door, your Realmbound hero, with its race, by Realmbound's), read from that game's save. A direct Play button stays for returning players | L | Art+System | L8, S4 | open: research first (docs/research/gemini-arcade-first-visit-prompt.md), then a plan | Every game runs on the same site, so the hall can read each game's saved character. The parts-built people in wildbond-godot/scripts/figures.gd can draw them; a natural Godot project after Wildbond (docs/research/decisions.md) |

## Other games (Diamond Career and Otherworld are active in ChatGPT's lane; the rest wait for Evan)

| ID | Project | Size | Kind | Status | Spec |
|---|---|---|---|---|---|
| SG1-SG4 | Starfall Guild stages G1-G4: careers, two expeditions, the town serves the guild, seasons become campaigns | L each | System | superseded by the Starfall village in Godot (SV1-SV5 above) | docs/plans/starfall-guild.md |
| OW0-OW5 | Otherworld (isekai) stages O0-O5 | L each | System | active: all three worlds playable (v0.3.0: Asterhold with Lanthorn, Hearthmere, the Ashen Throne); next: memories that matter across lives, O2 onward | docs/plans/otherworld.md, docs/ideas.md |
| DC0-DC4 | Diamond Career (baseball) stages D0-D4 | L each | System | D0 + first D1 merged (PR #45); D1 first month merged 2026-10-08 by Claude (v0.2.0, PR #48); D1c merged (v0.3.0, PR #50); v0.3.1 batting you can see (Claude); T36 in the game window and a road trip in progress (ChatGPT, A10); later stages outlined | docs/plans/diamond-career.md, docs/plans/sports-careers.md |
| PR0-PR4 | Primordial stages P0-P4 | L each | System | back burner | docs/plans/primordial.md |
| CS1 | **Card shop** (Evan's idea, 2026-10-08): run a card shop whose cards are our own catalogue creatures; packs, singles, Friday tournaments on Wildbond's element rules, regulars with stories | L | System | unparked 2026-10-09: one of Main Street's businesses; build after Wildbond 2.0 (needs the roster) | DEVELOPMENT-PATH "Main Street" |
| MS1 | **Main Street** business game | L | System | unparked 2026-10-09: design now (MS0.1-0.2), build after Wildbond 2.0 | DEVELOPMENT-PATH "Main Street" |

## Done (for reference; details in git history and the design docs)

Content: T14-T28 (Wildbond areas 1-6, Realmbound zones to 60, lore). Systems: T1/T1-A/T1-B/T1-C talents and pacing,
R1 supplies, the guild (favors, guild raiders, walkable hall), R2 the raid, D1-D7 decisions. Shared: S1 dialogue,
S2 sound (+ rain), S3 roster, S4 world kit (walker, HD-2D, Wildbond walking, Realmbound towns, camps, Abbey), S5
ambience. Wildbond extras: weather forecast, battle backdrops, challenge pennants, intro for the faded start.

## Guide extension (2026-10-08)

A6b: merged 2026-10-08 (PR #52) by Claude; written by Codex on codex/game-guides: illustrated Realmbound guide and tips; Diamond Career and Otherworld starter guides. Wildbond waits for Godot.

## R4 consequence follow-up (2026-10-08)

Merged 2026-10-08 (Realmbound v1.3.0, PR #53); written by Codex on codex/realmbound-story-choices: ten guild arcs gain warned, recoverable consequences; repair in world conversations, retained history in the Guild record. Stacked on the A6b guide PR #52 because queue/session metadata overlaps.

## Otherworld follow-up

| ID | Project | Size | Kind | Depends | Status | Spec / notes |
|---|---|---|---|---|---|---|
| OW2 | **T42: memories that matter across lives** | M | Data+System | OW1 | claimed: Codex, 2026-10-08, codex/otherworld-memories | Cross-world knowledge and persistent wants, grudges and debts; authored rules |
| OW1 | **T35: a living Lanthorn** | M | Data+Polish | OW0 | done, merged 2026-10-08 (Otherworld v0.2.0, PR #58) | docs/ROADMAP.md T35: visible locked choices, gift costs, food/fear over three days and Archivist memories |

## Diamond Career follow-up

| ID | Project | Size | Kind | Depends | Status | Spec / notes |
|---|---|---|---|---|---|---|
| D1d | **T36: in the game window and a road trip** | L | Polish+Data | D1c | done, merged 2026-10-08 (Diamond Career v0.4.0, PR #59) | docs/ROADMAP.md T36; keep existing features reachable, three away parks and calendar pay |



T43 claimed by Codex, 2026-10-08, on codex/catalogue-realmbound: zone and dungeon beast catalogue correspondences and names in the game window; stacked after T41, with combat and local identities preserved.
