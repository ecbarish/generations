# START HERE

**AI quick route (Evan, 2026-10-13):** read AGENTS.md, then run `node tools/agent-context.cjs --agent Codex --task TASK-ID --project PROJECT`. Follow docs/AI-START.md; read this file by relevant section/search, not the whole Session log. Current cycle and live PRs outrank historical status. This overrides older full-document reading instructions.

**Control Tower reporting (Adam, 2026-10-12):** update the fenced `json` block with a top-level `tower` object in your task's PR description when claiming work, changing status, handing off, becoming blocked, submitting for review, merging or publishing. Use the format in [docs/COMMS.md](docs/COMMS.md) (TOWER-COMMS, 2026-10-12) and the PR template. Report your actual AI/thread, operator, project/lane, task ID, owned paths, dependencies, blocker/next action, check evidence and release details; leave unknown values null. Never infer AI identity from a shared GitHub account, or equate merged with published. At session start, reconcile your open PR metadata even if you missed COMMS. [Control Tower](https://idle-arcade-tower.abarish227759.chatgpt.site) is Adam's private viewer; the reporting format is in the repository.

**For Evan:** when one assistant runs out of usage, open any other one (Claude, ChatGPT/Codex, another AI or a
person) and paste the prompt in the box below. Everything it needs is in this file and the files it links.
**For any assistant:** use the quick route above and read only the needed sections. The current cycle/live PRs establish current work; this file keeps the shared handoff history. Update it before you stop (see "Before you stop").

```
Repo: github.com/ecbarish/generations. Read AGENTS.md and use docs/AI-START.md.
Fetch current main in your own checkout and check live open PR ownership. Run
node tools/agent-context.cjs --agent Codex --task TASK-ID --project PROJECT
Read the scoped ticket/source/tests and full relevant COMMS entries. Build, test and open a PR.
Add one START-HERE Session log line; planning owns Where we are/Up next. No full history sweep.
```

## Rules (short version; HANDOFF.md has the full list)

- **Commit email:** only `206636510+ecbarish@users.noreply.github.com` (set it as the repo's `user.email`). Never a
  personal email.
- **Browser games: plain HTML/JS, no build step.** Run `powershell -ExecutionPolicy Bypass -File serve.ps1` (or
  `python -m http.server 8765`) in the repo folder and open http://localhost:8765/. **Godot games** (`wildbond-godot/`,
  `starfall-godot/`, Claude's): Godot 4.7.2 in `C:\Users\evanb\Godot`; their web previews live in `play/` (see play/README.md).
- **Tests must stay all-pass:** run `node tools/run-all-checks.cjs` for every browser test page and both Godot
  suites (install Godot or set `GODOT` to its console executable). The current suite list is in
  [tools/run-all-checks.cjs](tools/run-all-checks.cjs); GitHub runs it on every push and pull request. Never merge
  a failing check. Add checks for what you build. How we build: [docs/learning/](docs/learning/).
- **Old saves must keep loading.** New save fields need defaults (Wildbond `fresh()`/`load()`, Realmbound `migrate()`).
- **Small playable steps,** each with a line in README.md's changelog.
- **Save your work to GitHub at the end of every step** (commit and push). Never leave finished work only on one
  computer or only in one assistant's sandbox.
- **What Evan wants** (more in docs/PROJECTS.md "Read first"): real games with deep lore, everything in the game window, not dashboards; automation is earned, never sold; active play is
  always worth at least as much as Auto; the player picks the pace; explain things in plain words.

## How work moves

[docs/PROCESS.md](docs/PROCESS.md) is the current rulebook for every assistant and contributor.

- Work in your own clone on a `codex/<topic>`, `claude/<topic>` or `guest/<topic>` branch; never push straight to `main`.
- Read COMMS and check open PR titles, then publish a small claim commit and open a draft PR whose title starts
  with the task ID **before building**. One task per PR.
- Run the task's checks, include screenshots for visual changes, describe the result, and mark the PR ready.
- Only Generations Reviewer merges; nobody merges their own PR. A ready PR merges after every PROCESS self-check line passes on the latest commit and the self-check
  is recorded in a PR comment. Generations Reviewer squash-merges, records the release/session notes and ticks the completed task.

## Where we are (rewritten 2026-10-08, night)

**Read `docs/PROJECTS.md` "Read first" before anything else:** it lists every decision and lesson since 2026-10-07
(Godot, the game window, depth, woven stories, player text, variety, friends' testing, the process). In short:

- **The new Wildbond, in Godot** (`wildbond-godot/`, Claude): the opening (Maren's register with heritages, the barn,
  the bond that brings back colour, Wren), Thornwood, Saltmarsh, Emberfall and Cloudglass with wild creatures,
  bonding, trainers and Wardens; the ranch as a place (paddock, barn, nursery and eggs, trough, Maren's workbench and
  creature gear you can see); evolution with branches and conditions; music per place; saving. 198 checks
  (`tests/run_tests.gd`). Plays on the web at `play/wildbond/`.
- **The Starfall village, in Godot** (`starfall-godot/`, Claude): a frontier guild town: the guild board,
  adventurers who choose their own jobs, the inn's counter by hand then Bryn, Hob's plots, the Healer's Hut, a Training
  Yard, the Smithy worked by hand then Garrick, the Apothecary with prices, ranks and newcomers, music. 85 checks.
  Plays on the web at `play/starfall/`.
- **Browser games** (all playable, linked from the arcade): Wildbond v1.8.0 (the full journey: eight areas, the league,
  the Spire; content complete, fixes only), Realmbound v1.6.0 (1-60, dungeons, guild with stories and commissions, a
  raid), Diamond Career v0.4.0 (a baseball career, now in the game window, with a road trip), Otherworld v0.3.0
  (the Between and three worlds: Asterhold with a living Lanthorn, Hearthmere, the Ashen Throne), Starfall Guild (the old browser version), Primordial.
- **Friends are testing:** the Come Play page (`playtest.html`) with a one-minute trailer, first steps and "if you're
  lost" per game, and Wildbond's element chart. Windows builds in `Desktop\Game builds`.
- **Lore and design decided** (Evan, 2026-10-08): the wild bond, the Unbound, heritages, reputation, the creature
  catalogue and evolution, depth and first person one day (the fading took depth as well as colour). Ledger:
  `docs/lore/wildbond-threads.md`.

## Up next (2026-10-13: the cycle decides)

**Your task is in [docs/QUEUE.md](docs/QUEUE.md) "This cycle"**: one week, each worker named with one to three tasks
and a done-when line, a Play day on Sunday and a rollover by lane P on Monday ([docs/STUDIO-PLAN.md](docs/STUDIO-PLAN.md)
section 4). Take your named task, then the block's spare-effort order. How to work: [docs/PROCESS.md](docs/PROCESS.md).

## Questions for Evan (work continues on the defaults until he answers)

1. **Answered 2026-10-09: (a), the Godot Wildbond becomes the main one.** **What does "launch" (version 2.0) mean now?** The new Wildbond in Godot replaces the browser screens. Options: (a)
   launch when the Godot Wildbond reaches the full journey (all eight areas and the league), with the browser version
   kept as "Wildbond Classic"; (b) launch the browser games as they are now, and the Godot version later as a sequel.
   **Default:** (a), and keep friends testing the previews meanwhile.
2. **Realmbound: stay in the browser, or move to Godot later?** **Default:** stay in the browser, move into the game
   window there (T38), and decide after the Godot Wildbond is further along.
3. **Answered 2026-10-09: approved as life stages (see the proposal).** **Baby forms (W9):** read `docs/proposals/creature-growth.md` and answer its five questions. **Default:** its
   recommendations.
4. **Answered 2026-10-09: unparked.** The card shop is one of Main Street's businesses; design now, build after Wildbond 2.0.

**Answered:** browser or standalone (Godot, 2026-10-08); heritages, the Unbound, the wild bond, reputation, depth
(all approved 2026-10-08); see the "Decided" section at the top of `docs/research/decisions.md`.

## Before you stop (every session, even a short one)

1. Commit and push everything that works to your task branch; keep unfinished work in its draft PR.
2. Add your dated Session log line and update your task status. Planning owns "Where we are" and "Up next";
   report changes it needs through COMMS.
3. If you added a design decision, put it in the relevant design doc too.

## Session log (newest first; one or two lines each)

- 2026-10-19 — Codex / root for Evan: WB-BOGSNAP-FAMILY #600 supplies a three-stage Water/Grass family + Mega concept (C+A normal retained; v7 Mega direction approved: stronger upright kaiju, branching reed growth and flowing water; Boglet/Bogsnap preserved), source-aware starter parity audit and candidate600/700 Stillmaw final/Mega budgets; starter targets remain530/630. [Study](docs/art/bogsnap-family/README.md).101 arithmetic/structure assertions pass; 2026-10-20 adds a read-only source/data checker, regression cases and bounded four-view production brief; integrated603 review and closed provisional-level consistency/approval gap with six regressions; four static front/back source candidates saved with prompts/hashes and explicit alpha/import blockers; no live stat/ability/save/art replacement or battle-balance claim.

- 2026-10-19 — Codex / root for Evan: reviewed and squash-merged #519, #520, #521, #523, #545, #569, #575 and #583 under Evan's explicit merge instruction. Combined-main world planning: 220 tests pass; full-suite evidence and holds are in [the integration report](docs/research/review-integration-20261019.md). #491 and dependent #544 remain held for the three-ally phone battle defect. Night Market #545 is merged after current-head CI passed. No publication claim.
- 2026-10-19, Codex / Evan: reviewed NM-HEADER-FIT #545 for integration under Evan's explicit review/merge instruction. Added the v0.1.8 README changelog; save version remains 1. Publication is a separate verification.
- 2026-10-17 Codex (Evan): NM-HEADER-FIT in PR #545 fixes the baseline 568×320 Back/cash wrap with equal landscape columns. All 28 suites pass (423 unchanged Night Market checks); six before/after viewport/text pairs inspected. No save, balance or version change; source ready for review, not published. Wildbond registry integration follows.


- **2026-10-15, dot (guest), NM-G9:** Twenty-four Willow Quay vendor tales are in `games/night-market/district-tales.json` as data, four for each of the six vendors, plus a checker, `tests/nm-district-tales.cjs` (918 checks passed, 834 malformed tale fixtures rejected). The live game does not load this file. Recorded for [#515](https://github.com/ecbarish/generations/pull/515) (434fea91). Night Market Stalls stays at v0.1.7 and the save stays at version 1. This is data toward the second district, and that district stays unwired. DEVELOPMENT-PATH has no row that names NM-G9 or #515. The launch checklist does not say NM-G9 or #515 closes a row, so nothing is ticked.
- **2026-10-15, dot (guest), LB-G11:** Seven weekly training choices are in `games/lantern-bowl/training.json` as inactive data, plus a standalone season-simulation checker, `tests/lantern-bowl-training.cjs` (98753 checks, 414 malformed cases rejected). The live game does not load this file. Recorded for [#511](https://github.com/ecbarish/generations/pull/511) (292b121d). Lantern Bowl stays at v0.1.8 and the save stays at version 2. This is data toward LB-SEASON and LBL-5, and both stay open. DEVELOPMENT-PATH has no row that names LB-G11 or #511. The launch checklist does not say LB-G11 or #511 closes a row, so nothing is ticked.
- **2026-10-15, dot (guest), NM-G3:** Night Market Stalls v0.1.7. The Back and footer links are now 1rem and stay on one line, and the header reflows when the text is larger, as Generations Director approved. Game Art Director approved it at 9548a7bb. Recorded for [#499](https://github.com/ecbarish/generations/pull/499) (6b7b7a12). The save stays version 1. DEVELOPMENT-PATH has no row that names NM-G3 or #499. The launch checklist does not say NM-G3 or #499 closes a row, so nothing is ticked.
- **2026-10-15, dot (guest), NM-G6:** Night Market Stalls stays at v0.1.6. Cedar Steps, a third district with six new stall types, opens at 4,000,000 lifetime. It is in `districts.json`, and the district checker now checks each district. The game does not load the new district into play yet. Recorded for [#507](https://github.com/ecbarish/generations/pull/507) (3a2f7db0). The save stays version 1. DEVELOPMENT-PATH has no row that names NM-G6 or #507. The launch checklist does not say NM-G6 or #507 closes a row, so nothing is ticked.
- **2026-10-15, Grok (guest), LR-G1:** Little Ranch stays at v0.18.2. A real-browser phone pre-check script, a README, the results and 40 screenshots are under `docs/playtests/lrl-11/`. No game file changed. Recorded for [#508](https://github.com/ecbarish/generations/pull/508) (ba4dd747). LRL-11 itself stays open with Playtester. DEVELOPMENT-PATH has no row that names LR-G1 or #508. The launch checklist does not say LR-G1 or #508 closes a row, so nothing is ticked.
- **2026-10-15, Grok (guest), WBW-4:** The Answering Ways cave is in as data: a map, three field-key gates, overlay zones, Undertone's marker, three echo stones and wild creatures, plus a test. Six open questions for Wildbond Dev Lead are in `answering.md`. Nothing loads in the game. Recorded for [#503](https://github.com/ecbarish/generations/pull/503) (cf3e87d0). Browser Wildbond stays at v1.8.1. Godot Wildbond has no version number, so nothing is bumped. DEVELOPMENT-PATH has no row that names WBW-4 or #503. The launch checklist does not say WBW-4 or #503 closes a row, so nothing is ticked.
- **2026-10-15, dot (guest), WBW-5:** Wild-creature tables and level ranges for the 16 new routes are in as planning data, plus a test. Nothing loads in the game. Recorded for [#501](https://github.com/ecbarish/generations/pull/501) (a50ea391). Browser Wildbond stays at v1.8.1. Godot Wildbond has no version number, so nothing is bumped. DEVELOPMENT-PATH has no row that names WBW-5 or #501. The launch checklist does not say WBW-5 or #501 closes a row, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), #505:** The Game Art Director's palette merge spec is in `docs/art/lantern-bowl-palette-merge.md`. Six merges would take Lantern Bowl from 36 colours to 30. The ink `#1e1a22` and the lamplight `#f2d080` stay unchanged. A read-only counting tool, `tools/palette-inventory.py`, reports that count. No game file changed, so nothing a player sees changes. Recorded for [#505](https://github.com/ecbarish/generations/pull/505) (b6f0fe0d). Lantern Bowl stays at v0.1.8 and the save stays at version 2. This unblocks the guest row LB-PAL, which applies the merges later. DEVELOPMENT-PATH has no row that names #505 or the palette spec. The launch checklist does not say #505 or the palette spec closes a row, and the palette row stays open until LB-PAL applies the merges, so nothing is ticked.
- **2026-10-15, Grok (guest), LB-G7:** The roster view is in `games/lantern-bowl/roster-view.js`, with words-first ratings and star grades (the stars show the overall rating), plus a checker, `tests/lantern-bowl-roster-view.cjs` (136 checks, 26 broken copies caught), and a preview page under `docs/playtests/lb-roster-view/`. The live game does not load `roster-view.js`. Recorded for [#495](https://github.com/ecbarish/generations/pull/495) (5e728bbd). Lantern Bowl stays at v0.1.8 and the save stays at version 2. LB-MANAGER stays open. DEVELOPMENT-PATH has no row that names LB-G7 or #495. The launch checklist does not say LB-G7 or #495 closes a row, so nothing is ticked.
- **2026-10-15, Grok (guest), NM-G4:** Text-only portrait prompts for the six Night Market vendors are in `docs/art/night-market-vendor-prompts.md`. No game file reads that page, and nothing a player sees changes. Recorded for [#498](https://github.com/ecbarish/generations/pull/498) (a6591719). Night Market Stalls stays at v0.1.6 and the save stays at version 1. DEVELOPMENT-PATH has no row that names NM-G4 or #498. The launch checklist does not say NM-G4 or #498 closes a row, so nothing is ticked.
- **2026-10-15, Grok (guest), NM-G5:** 72 away-summary gossip lines for the six vendors, across three away-time bands, are in `games/night-market/gossip.json`, with a checker, `tests/nm-gossip.cjs` (66 checks). The game does not load this file yet. Recorded for [#500](https://github.com/ecbarish/generations/pull/500) (56fa9611). Night Market Stalls stays at v0.1.6 and the save stays at version 1. DEVELOPMENT-PATH has no row that names NM-G5 or #500. The launch checklist does not say NM-G5 or #500 closes a row, so nothing is ticked.
- **2026-10-15, dot (guest), LB-G10:** Opponent scouting styles for the five rival clubs are in `games/lantern-bowl/scouting.json`, with a standalone checker, `tests/lantern-bowl-scouting.cjs` (386 checks, 202 malformed cases rejected). The live game does not load this file yet. Recorded for [#496](https://github.com/ecbarish/generations/pull/496) (df3d30c2). Lantern Bowl stays at v0.1.8 and the save stays at version 2. LB-SEASON stays open. DEVELOPMENT-PATH has no row that names LB-G10 or #496. The launch checklist does not say LB-G10 or #496 closes a row, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), WBW-6:** The Wildbond field-lesson and gate list is in as data: seven field lessons and 64 gate records, plus a doc, with a unittest. Nothing loads in the game. Recorded for [#492](https://github.com/ecbarish/generations/pull/492) (e937d5ed). Browser Wildbond stays at v1.8.1. Godot Wildbond has no version number, so nothing is bumped. DEVELOPMENT-PATH has no row that names WBW-6 or #492. The launch checklist does not say WBW-6 or #492 closes a row, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), WBW-2:** Knothollow's cave layout and the Thornwood encounters are in as planning data, plus a unittest. Nothing loads in the game. Recorded for [#490](https://github.com/ecbarish/generations/pull/490) (86f4a634). Browser Wildbond stays at v1.8.1. Godot Wildbond has no version number, so nothing is bumped. DEVELOPMENT-PATH has no row that names WBW-2 or #490. The launch checklist does not say WBW-2 or #490 closes a row, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), NM-G2:** Night Market Stalls stays at v0.1.6. Second-district data for Willow Quay is in `districts.json`, plus a pacing checker. The game does not load the new district into play yet. Recorded for [#483](https://github.com/ecbarish/generations/pull/483) (e833d166). The save stays version 1. DEVELOPMENT-PATH has no row that names NM-G2 or #483. The launch checklist does not say NM-G2 or #483 closes a row, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), LB-G9:** Lantern Bowl v0.1.8. When the crowd bed plays, it holds its peak until it is stopped, then fades out over 0.25 seconds. The live play page may still not wire these cues; the listening page is what exercises the loop. Recorded for [#489](https://github.com/ecbarish/generations/pull/489) (1edc6396). The save stays version 2. This same version also covers [#494](https://github.com/ecbarish/generations/pull/494). DEVELOPMENT-PATH has no row that names LB-G9 or #489. The launch checklist does not say LB-G9 or #489 closes a row, and LB-FEEL stays open, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), LB-G8:** Season standings and playoff pairings are in `standings.js`, and the live game does not load that module yet. Recorded for [#494](https://github.com/ecbarish/generations/pull/494) (1eab3e96). Lantern Bowl stays at v0.1.8 from the #489 record above, with no second bump. The save stays version 2. LB-SEASON stays open. DEVELOPMENT-PATH has no row that names LB-G8 or #494. The launch checklist does not say LB-G8 or #494 closes a row, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), WBW-3:** The Wildbond world connection graph is in as data: 47 places and 54 links, plus a doc, with a 44-test unittest. Nothing changes for players. Recorded for [#487](https://github.com/ecbarish/generations/pull/487) (621a3444). Browser Wildbond stays at v1.8.1. Godot Wildbond has no version number, so nothing is bumped. DEVELOPMENT-PATH has no row that names WBW-3 or #487. The launch checklist does not say WBW-3 or #487 closes a row, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), WBW-1:** Ten Wildbond errand definitions and a schema doc are under docs/plans/wildbond-world/, plus a Python test. Nothing changes for players. Recorded for [#485](https://github.com/ecbarish/generations/pull/485) (8ef880f0). Browser Wildbond stays at v1.8.1. Godot Wildbond has no version number, so nothing is bumped. DEVELOPMENT-PATH has no row that names WBW-1 or #485. The launch checklist does not say WBW-1 or #485 closes a row, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), NM-G1:** Night Market Stalls stays at v0.1.6. Twenty-four vendor tales are in as data, four for each of the six vendors, plus a checker. The game does not load them yet. Recorded for [#482](https://github.com/ecbarish/generations/pull/482) (2a396331). The save stays version 1. DEVELOPMENT-PATH has no row that names NM-G1 or #482. The launch checklist does not say NM-G1 or #482 closes a row, so nothing is ticked. GAD or Dev Lead should read the wording before the tales are wired in.
- **2026-10-15, Grok (Cursor cloud), LB-G6:** Lantern Bowl stays at v0.1.7. Sixteen between-games decision cards are in as data, plus a checker. The game does not load them yet. Recorded for [#481](https://github.com/ecbarish/generations/pull/481) (c1431201). The save stays version 2. DEVELOPMENT-PATH has no row that names LB-G6 or #481. The launch checklist does not say LB-G6 or #481 closes a row, and LB-SEASON stays open, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), LB-G3:** Lantern Bowl stays at v0.1.7. A player progression table has been added, plus a five-season simulation checker (258 checks). The game does not load it yet. Recorded for [#480](https://github.com/ecbarish/generations/pull/480) (cd20b9d0). The save stays version 2. DEVELOPMENT-PATH has no row that names LB-G3 or #480. The launch checklist does not say LB-G3 or #480 closes a row, and LB-SEASON stays open, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), #458:** Clicks now land on the title buttons, Sign the register, Choose, Fight, and Catch, and each click activates the button once. Holding a direction now keeps up with a tap, stays continuous, and stops within one tile when the key is released. Choose is the highlighted button on the starter card. A creature with no painted sheet stands at battle size and keeps that size while it idles. Turn-order names on the landscape battle show in full. Each click, tap, or key press advances exactly one battle line. Closing Maren's conversation does not start it again. The menu opens on the same frame. After her barn dialogue, the speech box sits clear of the objective banner and the status bar, and the objective tracker moves off the stall signs. The catch timing bar crosses in well under a second, and a throw shows "In the green!" or "Missed the green". The guided first catch still fills the whole bar. Recorded for [#458](https://github.com/ecbarish/generations/pull/458) (06bb9ec). The web pack in that merge includes these fixes. Godot Wildbond has no version number, so this is a changelog line only, matching the earlier Godot Wildbond merges. Browser Wildbond stays at v1.8.1, because that label lives in game code. DEVELOPMENT-PATH and the launch checklist have no row that names #458 or Wildbond fix bundle 2, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), WB-ROAD:** #467 only adds a Continue test, so nothing changes for players. The test starts a journey, quits, and continues, and it reports the gaps it found. Recorded for [#467](https://github.com/ecbarish/generations/pull/467) (0002cb96). Browser Wildbond stays at v1.8.1. Godot Wildbond has no version number. DEVELOPMENT-PATH has no row that names WB-ROAD or #467. The launch checklist names WB-ROAD as an open bundle, and WBL-8, WBL-9 and WBL-10 stay open, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), LB-G4:** Lantern Bowl stays at v0.1.7. Sound-cue work has been added, with a checker and a listening page. The game does not play those cues yet. Recorded for [#474](https://github.com/ecbarish/generations/pull/474) (df686853). The save stays version 2. DEVELOPMENT-PATH has no row that names LB-G4 or #474. The launch checklist does not say LB-G4 or #474 closes a row, and LB-FEEL stays open, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), LB-G5:** Lantern Bowl stays at v0.1.7. Kick rules have been added as their own module, with a make-rate checker. The game does not use them yet. Recorded for [#479](https://github.com/ecbarish/generations/pull/479) (955ea0b9). The save stays version 2. DEVELOPMENT-PATH has no row that names LB-G5 or #479. The launch checklist does not say LB-G5 or #479 closes a row, and LB-FEEL stays open, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), LB-G2:** Lantern Bowl stays at v0.1.7. Season schedule data has been added, plus a checker. The game does not load it yet. Recorded for [#478](https://github.com/ecbarish/generations/pull/478) (8ba7a26d). The save stays version 2. DEVELOPMENT-PATH has no row that names LB-G2 or #478. The launch checklist does not say LB-G2 or #478 closes a row, and LB-SEASON stays open, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), LB-G1:** Lantern Bowl stays at v0.1.7. Roster and ratings data for six clubs has been added, plus a checker. The game does not load it yet. Recorded for [#472](https://github.com/ecbarish/generations/pull/472) (53c6b096). The save stays version 2. DEVELOPMENT-PATH has no row that names LB-G1 or #472. The launch checklist does not say LB-G1 or #472 closes a row, and LB-MANAGER stays open, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), #471:** The Millrace snap watch keeps running for at least 48 live frames, and it reads the one-line drive result if the drive ends during the watch. That fixes the flaky check "a Millrace drive ends as one line" on main, in [#471](https://github.com/ecbarish/generations/pull/471) (a6cfb2fe). Only the test page changed, so Lantern Bowl stays at v0.1.7. No changelog. DEVELOPMENT-PATH and the launch checklist have no row that names #471, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), NM-PHONE:** Night Market Stalls v0.1.6. On phones, Night Market keeps its Back control and first stall within reach. Every touch target is at least 44px at all seven tested sizes. Contrast is at least 5.16:1. The Pour button now sits above the fold on sideways phones. Recorded for [#456](https://github.com/ecbarish/generations/pull/456) (f2f8a26). The save stays version 1. DEVELOPMENT-PATH has no row that names NM-PHONE or #456, so nothing is ticked there. In the Night Market launch checklist, item 10, the NM-PHONE playtest row, the NM-PHONE timeline row, and the NM-PHONE clause on the NML-6 row are marked done for this merge.
- **2026-10-15, Grok (Cursor cloud), LB-PLAYBOOK-DATA:** Lantern Bowl stays at v0.1.7. Twelve original plays are in the data file: 4 runs and 8 passes, with 32 receiver routes, plus a checker. The game does not load them yet, so the field stays as it is. Recorded for [#451](https://github.com/ecbarish/generations/pull/451) (2bc844f7). The save stays version 2. DEVELOPMENT-PATH has no row that #451 or LB-PLAYBOOK-DATA closes. The launch checklist does not say #451 or LB-PLAYBOOK-DATA closes a row, so it is left as written.
- **2026-10-15, docs, #468:** the guest backlog puts launch-game and Wildbond world-build rows at the top, in docs/plans/guest-backlog.md, in [#468](https://github.com/ecbarish/generations/pull/468) (1a4ec13). Docs only. No version bump, no changelog, and no DEVELOPMENT-PATH tick.
- **2026-10-15, Grok (Cursor cloud), LR-TOY-POLISH:** Little Ranch stays at v0.18.2. The snack shows in the kitchen bowl, and the bowl gives a small bounce. A tap on the top of a painted sign opens that place. The extra click after a ball tap is ignored, so the ball rolls once. The page uses the arcade picture as its icon, so the browser no longer asks for a missing favicon. Recorded for [#460](https://github.com/ecbarish/generations/pull/460) (642c812). DEVELOPMENT-PATH has no row that names this pull request, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), #462:** Bogsnap and Glimmerwing get real battle art and overworld sprites, in place of the blocky placeholders, in [#462](https://github.com/ecbarish/generations/pull/462) (81e6ace). The web pack in that merge includes the new art. Godot Wildbond has no version number, so this is a changelog line only. DEVELOPMENT-PATH has no row that names this pull request, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), LB-GAMEFLOW:** Lantern Bowl v0.1.7. Before each Millrace drive you pick Blitz, Balanced, or Prevent, and the drive plays on the field as a short highlight. A slower clock keeps a two-minute quarter and leaves room for a full game. On fourth down the call offers a punt, and a field goal when the goal is within 38 yards. A short completion no longer gains one fixed number of yards, and a typical carry lands nearer 3 yards. A miss says why: Overthrown, Underthrown, Wide left, Wide right, Broken up, or Picked. While you drag, the receiver nearest the aim point is highlighted, and Inside and Outside are labelled as runs. On a phone, a full throw takes a long drag, and the camera keeps the quarterback clear of the left edge. After the whistle one result line sits on the bottom edge, and the hint stays above the grass so the top receiver and the yard numbers stay visible. The version label stays whole at 360 pixels wide, and Settings stays on the screen at 390 pixels wide. A phone held upright still shows Turn your phone sideways and the game waits. Recorded for [#444](https://github.com/ecbarish/generations/pull/444) (095ec172). The save stays version 2. DEVELOPMENT-PATH has no row that names #444, so nothing is ticked. The launch checklist does not say #444 closes a row, so it is left as written.
- **2026-10-15, Grok (Cursor cloud), ART-SF-8a:** The mud road ruts now join into continuous tracks. The dark line of each wheel rut runs unbroken from edge to edge, and the lighter lip still wears away inside the tile. Recorded for [#426](https://github.com/ecbarish/generations/pull/426) (a3a7e10). Godot Starfall has no version number, so this is a changelog line only, in the same style as ART-SF-8. Starfall Guild Classic stays at v1.0.1, because that label lives in game code and this merge did not change that game. The web preview was not rebuilt. DEVELOPMENT-PATH has no row that names this pull request, so nothing is ticked.
- **2026-10-15, docs, #459:** a standing backlog at docs/plans/guest-backlog.md, so Grok and dot can take the next guest task without waiting, in [#459](https://github.com/ecbarish/generations/pull/459) (427cf97). Docs only. No version bump, no changelog, and no DEVELOPMENT-PATH tick.
- **2026-10-15, Grok (Cursor cloud), NM-FIX-6:** Night Market Stalls v0.1.5. Choosing Load a save file with another game's save is refused straight away. The box says that file isn't a save for this game, and it does not ask to replace the save. A real Night Market save still asks first. Recorded for [#461](https://github.com/ecbarish/generations/pull/461) (1d36ee6). The save stays version 1. The check is in the shared save box, so other games with Your save refuse a wrong file the same way, and their version labels were not changed. DEVELOPMENT-PATH has no row that names this pull request, so nothing is ticked.
- **2026-10-15, docs, #455:** the Wildbond world design plan for a connected region, field abilities, caves and towns, in docs/plans/wildbond-world-design.md, in [#455](https://github.com/ecbarish/generations/pull/455) (90802ca). The text map matches the flowchart, rideable water includes the flooded places, and the 2.0 m Legends come out at 24px. Docs only. No version bump, no changelog, and no DEVELOPMENT-PATH tick.
- **2026-10-15, docs, #465:** the Wildbond world concept map, region mood panels and style notes, drawn from the world design in #455, in docs/art/wildbond-world/, in [#465](https://github.com/ecbarish/generations/pull/465) (92e8b99). Docs only. No version bump, no changelog, and no DEVELOPMENT-PATH tick.
- **2026-10-15, Grok (Cursor cloud), WB-PHONE:** Wildbond now plays upright on phones, with a d-pad, A, B and Menu under the picture. Recorded for [#431](https://github.com/ecbarish/generations/pull/431) (3d353a4). The web pack in that merge includes this layout. Godot Wildbond has no version number, so this is a changelog line only, matching the earlier Godot Wildbond merges. Browser Wildbond stays at v1.8.1, because that label lives in game code and this merge did not change that game. DEVELOPMENT-PATH has no row that names this pull request, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), LR-POLISH:** Little Ranch stays at v0.18.2. The coloured dots on the Dough Table tint the dough, and feeding the fox gets an answer at once. Bedtime cues are bigger and last longer, dusk takes longer to fade, and leaving the Paint Shed early sends her home with a puff of the colours so far. The idle sign wiggle is gentler, with one small wiggle every 9 seconds and none when reduced motion is on, and the selected-pot ring is slimmer, as the Game Art Director asked. Recorded for [#449](https://github.com/ecbarish/generations/pull/449) (44f49c2). DEVELOPMENT-PATH has no row that names this pull request, so nothing is ticked.
- **2026-10-15, Grok (Cursor cloud), Night Market visuals:** Night Market Stalls v0.1.4. A picture of the lane now sits under the header, with the six stalls in order. An open stall shows a striped awning, a counter and its own wares, and a shuttered stall stays dark. Each sale pops a coin up from that stall. Lanterns flicker along the top of the lane and on the awnings. The tea stall, the dumpling cart and the mooncake table steam, and the incense tray smokes, once that stall is open and has been served or hired. Buying or hiring outlines that stall for a moment, and reaching 25, 50 or 100 plays a brighter flash. The awning's light stripe changes colour at those same counts. Once a stall is staffed, people stroll along the lane. When reduced motion is on, the lane holds still, and a sale or a flash shows as one still picture. Recorded for [#438](https://github.com/ecbarish/generations/pull/438) (4e92d87). The save stays version 1. DEVELOPMENT-PATH has no row that names this pull request, so nothing is ticked.
- **2026-10-14, dot (Adam), NM-RETUNE:** Night Market Stalls v0.1.3. The first million now takes a longer evening, about 48 to 66 minutes of active play. Later stalls cost more and earn less. The dumpling cart earns 0.5/s like the tea stall. Old saves keep their coins and stalls. Recorded for [#445](https://github.com/ecbarish/generations/pull/445) (61846a1). The save stays version 1. Nothing is ticked.
- **2026-10-14, docs, #453:** a Wildbond vs Pokémon benchmark, with fan-game ideas, in docs/research/wildbond-vs-pokemon-benchmark.md, in [#453](https://github.com/ecbarish/generations/pull/453) (09dc55d). Docs only. No version bump, no changelog, and no DEVELOPMENT-PATH tick.
- **2026-10-14, docs, #452:** research on how classic overworlds are woven together, with a full-world skeleton for Wildbond, in docs/research/wildbond-world-references.md, in [#452](https://github.com/ecbarish/generations/pull/452) (964f83a). No version bump, no changelog, and no DEVELOPMENT-PATH tick.
- **2026-10-14, Claude, WBL-7:** wildbond-godot/tests/north_roads.gd walks every built road north and fails if the title screen shows, in [#416](https://github.com/ecbarish/generations/pull/416) (b681a00). The north-exit bug did not reproduce, so WBL-7 stays open. No game code changed. Godot Wildbond has no version number, so nothing is bumped. Nothing is ticked.
- **2026-10-14, docs, #448:** Lantern Bowl's launch plan records Evan's approved team-manager scope, in [#448](https://github.com/ecbarish/generations/pull/448) (c4dbfb1). Docs only. No version bump, changelog, or DEVELOPMENT-PATH tick.
- **2026-10-14, Grok (Cursor cloud), #446:** A CI check now fails when Wildbond's Godot game changes and its web pack is not exported again, in [#446](https://github.com/ecbarish/generations/pull/446) (93baf43). The game itself is unchanged. No version, changelog, or DEVELOPMENT-PATH tick.
- **2026-10-14, Grok (Cursor cloud), #443:** The live web build now includes #429. The re-export put the Larkhaven menu, single taps that no longer also sign or choose, the status bar, and Catch in battle into the pack that players load, in [#443](https://github.com/ecbarish/generations/pull/443) (2db670b). Godot Wildbond has no version number, so nothing is bumped. Nothing is ticked.
- **2026-10-14, Grok (Cursor cloud), LRL-4:** Little Ranch keeps the sound choice after a reload. [#439](https://github.com/ecbarish/generations/pull/439) added the tests and the evidence, and it was squash-merged as 0264d67. No game code changed, so there is no version bump. DEVELOPMENT-PATH has no LRL-4 row, and the launch checklist is not ticked. It is waiting for Playtester or Evan to confirm.
- **2026-10-14, Grok (Cursor cloud), WB-BUNDLE-1:** The menu works again in Larkhaven. The tap that opens the register, card or battle menu no longer also signs or chooses. Speech advances only on a press. Recorded for [#429](https://github.com/ecbarish/generations/pull/429) (b2af229). Source only; not a preview release. Godot Wildbond has no version number, so this is a changelog line only. DEVELOPMENT-PATH has no WB-BUNDLE-1 row, and the launch checklist has no checkbox for it.
- **2026-10-14, Claude, WBL-2:** a battle opens on your action menu. Your lead creature starts with a full turn meter, so a quicker foe no longer strikes or winds up before you choose, in [#418](https://github.com/ecbarish/generations/pull/418) (56204cc). A battle in which every foe is already down ends instead of opening a menu. Source only; not a preview release.
- **2026-10-14, Grok (Cursor cloud), LB-PLAYSCREEN:** Lantern Bowl v0.1.6. The field has new play art and a playbook. Slingshot passing lets you pull back to throw. A landing circle stays on screen on deep throws. An overthrown pass says "Overthrown: too much power". On phones, a turn-sideways prompt in portrait pauses the game. Recorded for [#432](https://github.com/ecbarish/generations/pull/432) (0bf5f0d). The save stays version 2. DEVELOPMENT-PATH has no LB-PLAYSCREEN row. Launch checklist item 5b-2 stays open, because merging a pull request does not finish it, and 5c stays open.
- **2026-10-14, docs, #419:** the pull request checklist and bundling rules, plus the launch-plan updates for the bundles, the dates and the owners, in [#419](https://github.com/ecbarish/generations/pull/419) (99c9138). No version, changelog or DEVELOPMENT-PATH tick.
- **2026-10-14, docs, #436:** the Night Market visuals spec, plus the Guest AIs section in AI-START.md, in [#436](https://github.com/ecbarish/generations/pull/436) (64716ec). No version, changelog or DEVELOPMENT-PATH tick.
- **2026-10-14, Grok (Cursor cloud), Night Market playtest fixes:** Night Market Stalls v0.1.2. Holding the pour button keeps pouring, about eight cups a second, and a cups bar and counter show how close the stall is to its vendor. The pour button stays after you hire. The save box is styled, and its backup list refreshes each time it opens. Payback times show whole seconds. Recorded for [#434](https://github.com/ecbarish/generations/pull/434) (9195865). The save stays version 1. DEVELOPMENT-PATH has no Night Market row. NML-1, NML-3, NML-4 and NML-6 stay open.
- **2026-10-14, Grok (Cursor cloud), LRL-1:** Little Ranch v0.18.2. The visit ends at bedtime from any of the five rooms once 6 minutes or 12 activities are reached. A toy you are in the middle of gets at most 6 more seconds, and an unfinished toy earns no reward. Recorded for [#417](https://github.com/ecbarish/generations/pull/417) (e352a7b). DEVELOPMENT-PATH has no LRL-1 row.
- **2026-10-14, Grok (Cursor cloud), WBL-6:** Wildbond battles show the real creature sprites, scaled by whole pixels, with their feet clear of the command box, in [#406](https://github.com/ecbarish/generations/pull/406) (440e4d6). Source only; not a preview release. Godot Wildbond has no version number, so this is a changelog line only. DEVELOPMENT-PATH has no WBL-6 row, and the launch checklist has no checkbox for it.
- **2026-10-14, Grok (Cursor cloud), LR-LAYOUT-1:** Little Ranch v0.18.1. Cookies hop clear of the cutter. The sponge, ball and flowers no longer overlap on phones. Recorded for [#424](https://github.com/ecbarish/generations/pull/424) (e66ddbc). DEVELOPMENT-PATH has no LR-LAYOUT-1 row, and the launch checklist has no checkbox for this fix.
- **2026-10-14, Grok (Cursor cloud), WBL-1:** Esc, I, the bag and Start open a pause menu (Party, Field book, Save, Close), a status bar shows the area, the party lead and the coins, and a click on a full-screen button stays on the button, in [#413](https://github.com/ecbarish/generations/pull/413) (bb4031c). Source only; not a preview release. Godot Wildbond has no version number, so this is a changelog line only. DEVELOPMENT-PATH has no WBL-1 or WBL-14 row.
- **2026-10-14, Grok (Cursor cloud), WBL-11:** an old-save upgrade step that returns nothing holds the save untouched, and Erase leaves a held save on the hub, in [#415](https://github.com/ecbarish/generations/pull/415) (5a88c12). Shared engine only; no game version bump. DEVELOPMENT-PATH has no WBL-11 or WBL-12 row.
- **2026-10-14, Side Games Dev Lead, NM-FIX-1:** Night Market Stalls v0.1.1, each stall says how long the next one pays for itself, and welcome back and the cash box say stalls earn 50% while you are away, for up to four hours, in [#421](https://github.com/ecbarish/generations/pull/421) (1459413).
- **2026-10-14, docs, #414:** section 8 wording in docs/research/office-idle-progression.md, aligning the spec with the per-tick maxOfflineSec clamp shipped in #393, in [#414](https://github.com/ecbarish/generations/pull/414) (5598d00). No version, changelog or DEVELOPMENT-PATH tick.
- **2026-10-14, docs:** Launch dates redone from the measured merge rate. Likely dates are 16 Oct (Little Ranch), 17 Oct (Wildbond), 20 Oct (Lantern Bowl) and 22 Oct (Night Market). #403, #400, #381, #383, #380 and #399 are merged. #404 and #409 are on hold. Summary in docs/plans/launch-summary.md.
- **2026-10-14, Grok (Adam), LR18:** Little Ranch v0.18.0, the Dough Table (a dough picture-sign opens a table with one lump of dough in the baby's colour; tap squishes it flat, a forgiving rub rolls it back into a ball, the blue cutter stamps out a little dough baby that hops away; three babies, a cheer, then home as one happy thing), in [#400](https://github.com/ecbarish/generations/pull/400) (43785a4).
- **2026-10-14, Claude, WB-C4b:** the Thornwood pond outline breaks the box, and the reeds sway by whole pixels, in [#399](https://github.com/ecbarish/generations/pull/399) (59f78cb). Source only; not a preview release.
- **2026-10-14, Side Games Dev Lead, IDLE-NM1:** Night Market Stalls v0.1.0, six stalls you work yourself before a vendor runs them, then buy in bulk, with a capped welcome back, in [#403](https://github.com/ecbarish/generations/pull/403) (d9cde61).
- **2026-10-14, dot (Adam), WB-FUNNEL1:** a tap advances opening dialogue, and the opening records time to the first partner, first battle and first catch, in [#380](https://github.com/ecbarish/generations/pull/380) (18c4169). Source only; not a preview release.
- **2026-10-14, Side Games Dev Lead, 371-5a:** Lantern Bowl v0.1.5, a side-on field with eleven a side and carries with a real spread, in [#383](https://github.com/ecbarish/generations/pull/383) (253c545).
- **2026-10-14, Grok (Adam), LR17:** Little Ranch v0.17.0, the Busy Barn Door (a doorbell, a light switch, a latch, a slide bolt and a crank; once all five are played with, the door opens and the baby peeks out), in [#381](https://github.com/ecbarish/generations/pull/381) (320e1bd).
- **2026-10-14, docs:** Launch checklists corrected by the dev leads. Lantern Bowl 5a is merging; 5b is the passing and playbook slice. Night Market #403 is built. Wildbond's first task is the nine battle sprites. Little Ranch's dates are still pending a dev-lead check. Summary in docs/plans/launch-summary.md.
- **2026-10-14, docs:** Launch quality. Little Ranch, Lantern Bowl and Night Market are the launch games; Wildbond is the steady lane. Checklists and the one-page summary are in docs/plans/.
- **2026-10-14, #401:** Arcade v1.8.0. A new home page, a Lab page, and per-game pages, in [#401](https://github.com/ecbarish/generations/pull/401) (1779129).
- **2026-10-14, Side Games Dev Lead, IDLE-CORE:** the shared idle core in shared/idle-core.js, in [#393](https://github.com/ecbarish/generations/pull/393) (cae662e). Elapsed time, a capped catch-up when the page is opened again, bulk buy, and an optional income readout in the tab title. Games keep their own saves. Shared Systems Architect co-reviewed it.
- **2026-10-14, #396:** Arcade v1.7.2. A Play Wildbond header button, share and meta tags, a Start here section plus a collapsed More section, and Classic editions hidden, in [#396](https://github.com/ecbarish/generations/pull/396) (b5c9f3c).
- **2026-10-14, Side Games Dev Lead, ENGINE-SAVEVER:** versioned saves in the shared engine, in [#392](https://github.com/ecbarish/generations/pull/392). Existing saves are unaffected, since no game registers a version yet. Shared Systems Architect co-reviewed it.
- **2026-10-14, docs, #388:** office idle progression spec, docs/research/office-idle-progression.md (Game Researcher), research plus the §8 build spec for IDLE-CORE, NM1, SS1, CS1 and DP1 (curves, prestige, offline caps, where offline means the page was closed, milestones and done-when criteria). No version, changelog or DEVELOPMENT-PATH tick.
- **2026-10-14, docs, #389:** office idle ruling (Evan, via Director, 2026-10-14). PRIORITIES gets an Office idle slot, and QUEUE gets IDLE-CORE then NM1, SS1, CS1 and DP1. Card Shop lite is approved, and the full Wildbond tie-in stays gated. Docs only.
- **2026-10-14, Claude, WB-C4:** Larkhaven gets a barn garden, door stones, straw in the pen and grass variety, and the Thornwood ponds get a muddy, reedy bank, in [#372](https://github.com/ecbarish/generations/pull/372). Source only; not a preview release.
- **2026-10-14, Claude, WB-C3b:** the register shows only the tap hint on phones, and the partner-card note no longer touches the stat bars, in [#382](https://github.com/ecbarish/generations/pull/382). Source only; not a preview release.
- **2026-10-14, Claude, KM0:** Keymaster v0.1.0, one listing, one analyzer, one buy, in [#379](https://github.com/ecbarish/generations/pull/379).
- **2026-10-14, docs, #384:** Little Ranch six toddler places (LR17-LR22), and LR17 in Grok's guest-lane queue. Docs only.
- **2026-10-14, docs, #385:** KM0 is marked approved, not parked, in PRIORITIES and QUEUE, and is in review in #379. Docs only.
- **2026-10-14, docs, #375:** QUEUE catch-up. Lantern Bowl round 5 is 5a, 5b and 5c under #371; EVO-1 and WB5.6 are marked done in the cycle. Docs only.
- **2026-10-14, Grok (Adam), OW-N1:** Otherworld v0.4.1, a Memories carried ledger, two open choices at every beat, and the hall blurb, in [#378](https://github.com/ecbarish/generations/pull/378).
- **2026-10-14, WB5.6:** Godot Wildbond catalogue batch, 189 species, evolved forms at half, in [#368](https://github.com/ecbarish/generations/pull/368). Source only; not a preview release.
- **2026-10-14, docs, #374:** guest lanes get WB-FUNNEL1 and OW-N1, the SF-GUILD2 ticket, and the spare-effort order. Docs only.
- **2026-10-14, Side Games Dev Lead, #359:** Lantern Bowl v0.1.4, running matters and Millrace's drives on the field, in [#369](https://github.com/ecbarish/generations/pull/369).
- **2026-10-14, Claude, WB-C3:** Wildbond on a phone held sideways, by touch, in [#361](https://github.com/ecbarish/generations/pull/361). Source only; not a preview release.
- **2026-10-14, EVO-1:** starters as three-stage lines in [#366](https://github.com/ecbarish/generations/pull/366), with old saves converting and battle sprites clearing the HP panel in [#370](https://github.com/ecbarish/generations/pull/370). Source only; not a preview release.
- **2026-10-14, docs, #367:** QUEUE notes DM-N1d after #347 closed. Docs only.
- **2026-10-14, #365:** two Checks flakes stopped (Starfall boot and the Godot audio import). No game version.
- **2026-10-14, docs, #364:** QUEUE adds the WB-NOSTALGIA first tasks, NOS-1a through NOS-1e. Docs only.
- **2026-10-14, docs, #363:** START-HERE's merge rule matches #362. Docs only.
- **2026-10-14, docs, #362:** only Generations Reviewer merges, and each task has one owner. Docs only.
- **2026-10-14, Claude (cloud session for Evan), SF-GUILD1:** the map of Starfall Guild's loops into the village (docs/plans/starfall-guild-fold.md), and the first loop, your call in the fight: halfway out an adventurer finds the trouble and you pick press or hold (odds and knocks in words; their own way works a little better; no call and they fight as before), in [#360](https://github.com/ecbarish/generations/pull/360). 488 Starfall checks, all 24 suites. Not published.
- **2026-10-14, Grok (Adam), LR16:** Little Ranch v0.16.0, the meadow ball (tap it and it rolls; the baby kicks it; every third kick is one happy thing; at night a tap only boings), in [#357](https://github.com/ecbarish/generations/pull/357).
- **2026-10-14, Grok (Adam), LR8:** Little Ranch v0.15.0, spoken words (the device's voice says the names, colours and "Night night"; sound off stays silent), in [#354](https://github.com/ecbarish/generations/pull/354).
- 2026-10-14, dot (Adam): PR #310 bounded review repair adds missing form model dependencies and rejects malformed live-game form metadata while preserving legacy resumes and Evan's ownership. Main documentation conflicts reconciled; four focused regressions and loader smoke pass, exact-head CI/UI evidence in the PR Tower; no merge/deploy.
- 2026-10-13 Grok (Adam / abarish-dev): SF2.13 (H7) trust per adventurer in PR #325; 297 Starfall checks (19 new), all 23 suites pass with Godot 4.7.2. Merged, not published (Adam is holding the Starfall release for the ART-SF-8 art review).
- 2026-10-13 Grok (Adam / abarish-dev): ART-SF-8 (H3) dresses Starfall's square and roads in PR #323; tools/art/starfall_square.py, 278 Starfall checks (6 new), all suites pass. Merged, not published: the exact-build preview release needs Adam's approval.
- **2026-10-13, dot (Adam), CHAR-BROWSER1:** Completed portable character-bench browser selection in [#318](https://github.com/ecbarish/generations/pull/318); Adam authorized merge. Seven focused cases, 113 unchanged bench checks and 22 aggregate suites passed on 87e5852; refreshed main is rechecked before merge. [Evidence](docs/playtests/character-browser/README.md); final merge/check status in PR Tower. Tooling only, no game/art release.

- **2026-10-13, Grok (Adam), LR7:** Little Ranch v0.14.0, the bedtime routine (toothbrush, cup, goodnight to the flowers and the Pebblit, then the lullaby; steps do themselves if left), in [#313](https://github.com/ecbarish/generations/pull/313).
- 2026-10-13 18:02 UTC Codex (historical implementation result): DM-N1c / PR #310 adds bounded hot/cold next-game ratings, visible base values and Iona result feedback; 114 Diamond Manager checks and phone/desktop/ultrawide views pass. Aggregate 21/22, existing Little Ranch kitchen hint still failing.

- **2026-10-13, Grok (Adam), LR-POLISH-1:** Little Ranch v0.13.1, toddler-rules polish (basket clear of the sign post, friend sleeps beside the baby, 80 px tablet targets checked), in [#308](https://github.com/ecbarish/generations/pull/308).
- **2026-10-13, Grok (Adam), LR6:** Little Ranch v0.13.0, the hat basket (five hats in turn, then bare and round again; wide-screen puddle nudge), in [#305](https://github.com/ecbarish/generations/pull/305).
- **2026-10-13, Grok (Adam), LR5:** Little Ranch v0.12.0, rain and puddles (tap the cloud for rain; puddles and a rainbow after; tap a puddle and the baby jumps in), in [#303](https://github.com/ecbarish/generations/pull/303).
- 2026-10-13 Codex: AI-EFF1 introduces fresh task packets and scoped startup routing; old root instructions preserved in docs/archive. Local-tool comparison and measured context savings recorded with this task.

- 2026-10-13 Codex: ART-PORT1 / PR #300 adds a creature design-language journal with 17 studies, revision comparisons, life-stage views and approval/source records; small previews, no new generation. Reconciled main 4c5b74a; portfolio 211 checks pass, aggregate 21/22 (Little Ranch hint outstanding).

- **2026-10-13, Grok (Adam), LR4:** Little Ranch v0.11.0, a second friend (a baby Pebblit visits about half the time; eats and gets bubbly too; tap it and they nuzzle), in [#297](https://github.com/ecbarish/generations/pull/297).
- **2026-10-13, dot (Adam), ONBOARD-KIT1:** #294 and #301 published as Realmbound v1.9.2 at de884cc; all 22 suites, 526 focused checks and [final public verification](https://github.com/ecbarish/generations/actions/runs/38434067678) (56 hashes, 226 actual-browser assertions) pass. No human-enjoyment claim.

- **2026-10-13, Grok (Adam), LR11:** Little Ranch v0.10.0, the Snack Kitchen (snack-bowl sign; four foods, one bowl; berries get a yum, the rest funny faces; three bowls of berries and home), in [#293](https://github.com/ecbarish/generations/pull/293).

- **2026-10-13, dot (Adam), RB1.12a:** [#283](https://github.com/ecbarish/generations/pull/283) opens overlapping Thornvale mine requests with compact Journal tracking. Existing save structure/progress/rewards retained; source 56ad188 passes all 21 suites and 9,074 Realmbound checks, with six-setting browser/reload evidence. Final evidence/metadata checks are on the PR; published at 05d39631; final live verification on #283.

- **2026-10-13, Grok (Adam), LR10:** Little Ranch v0.9.0, the Little Wagon (load two babies, windmill/pond/woolies, a colour gate where any car cheers), in [#290](https://github.com/ecbarish/generations/pull/290).
- **2026-10-13, Grok (Adam), LR3:** Little Ranch v0.8.0, the singing flowers (five notes, the baby dances, drag for a song), in [#289](https://github.com/ecbarish/generations/pull/289).

- **2026-10-13, dot (Adam), WB-C2:** source #279 and preview #286 published at f81ef50; all 22 suites, full exact-pack save/phone gate and [93 live browser assertions](https://github.com/ecbarish/generations/actions/runs/38435221402) pass. First partner 118.50–119.60 simulated seconds, full encounter 173.90–175.82. [Final evidence](docs/releases/wildbond-wbc2-handoff.md).


- **2026-10-13, Grok (Adam), LR-C1:** Little Ranch v0.7.0, the first five minutes alone on a tablet: idle hint glow, nearest-target taps, roomier paint pots; parent's checklist and tablet screenshots in [#281](https://github.com/ecbarish/generations/pull/281).
- 2026-10-13 Codex: ART-WB-SPRITE-EVAL saved as a future candidate in docs/art/wildbond-art-direction.md section 8; note-only, no trial started or credits spent.

- **2026-10-13, dot (Adam), WB-C2:** shorter arrival/barn dialogue and unchanged family tales immediately after the first bond, in draft [#279](https://github.com/ecbarish/generations/pull/279). All 20 aggregate suites pass on the implementation, including 1,612 integrated Wildbond checks and frozen pre-change save compatibility. Input-only before/after timing and full-resolution desktop/phone evidence: [record](docs/playtests/wildbond-wb-c2/README.md). Adam approved merge and preview publication at 13:32 UTC; reconciling current main and rerunning exact-head checks before the scoped release.

- 2026-10-13 Codex: PR #278 final asset push adds a male/female 3D fitting bench and paired role sheets; pause handoff in docs/art/starfall-higgsfield/FINAL-PUSH.md. Next bounded step is one fitted kit on both bodies.

- 2026-10-13 Codex: PR #278 adds male/female library coverage, three licensed female GLB prototypes, paired body references and per-body gear/role acceptance requirements; game loaders unchanged.

- **2026-10-13, Codex (Evan), ART-SF-HF1:** PR #278 adds Starfall adult role/visible-gear references and Evan's shared asset-library foundation: 17 stable IDs, reusable existing sources, browser and CI integrity/readiness checks. No game loader changes. Role/library browser checks pass; generation cost 6 credits, 60.75 remain.

- **2026-10-13, Codex (Evan), ART-WB-HF2:** PR #277 follows EVO-0's new-middle / established-final stage plan, carries the post-merge Pyremane follow-up, and adds five 1K middle/payoff concepts plus an all-three-stage workshop. All 20 suites and 243 covering/layout checks pass; Crown Mantle direction approved by Evan, other refs remain candidates. Cost 7.5 credits, 66.75 remain.

- **2026-10-13, Codex (Evan), ART-WB-HF1:** applied "humble beginnings, spectacular payoff" to 15 live Godot evolution families / 17 final outcomes in PR #274. Corrected starter stages (Blazefang/Tidewyrm/Thornback are middles); generated three Pyremane candidates and recommended Crown Mantle. Endpoint workshop passes 54 responsive/mode/size checks. This round cost 8.25 credits; 74.25 remain.

- **2026-10-13, Codex (Evan), ART-WB-HF1 follow-up:** PR #274 now includes three Tidewyrm evolution concepts, a refined directional reference and an interactive silhouette/scale workshop. Current Sail is the working recommendation; crest and marking inconsistencies are documented before production. Four images cost 11 credits; no purchase.

- **2026-10-13, Codex (Evan):** ART-WB-HF1 in PR #274 preserves six Higgsfield outputs, exact prompts and an isolated Godot scale/evolution review. All 20 suites pass. Promising portraits/references; not finished animations. No game/version changes or purchase.
- 2026-10-13 Claude (lane P): posted cycle 1 in QUEUE.md "This cycle" (named tasks per worker, Play day Sunday 18th, rollover Monday 19th) and pointed PROCESS, CONTRIBUTING, CLAUDE.md and START-HERE at it; the studio plan's first block had never been posted.

- 2026-10-12 Codex: DM-N1b named Training Rooms outlook, PR #269; all 20 suites, 102 Manager checks and 28 four-size browser checks pass. Read-only feedback, no versions or balance changes.
- 2026-10-13 Grok (Adam / abarish-dev, guest): LR9 the Paint Shed ([#262](https://github.com/ecbarish/generations/pull/262)), Little Ranch v0.6.0: paint-drip sign, four pots, tap/drag to fill the baby's outline, the painted baby walks out until bedtime. 111 checks.

- 2026-10-12 Muse (Adam / abarish-dev): WB-N1 done — rival heal nudge, Maren ranch pointer after first catch, battle HP snap; PR #257 merged, bookkeeping PR #265 merged. SF-WEB-BOOT investigated (could not reproduce, boots clean), released, PR #254 merged.

- 2026-10-12 Codex: SG-N1 browser-classic recovery and Ledger fixes, PR #264; all 20 suites and 26 browser checks pass. Godot unchanged.

- 2026-10-12 Codex: DM-N1a, reported Diamond Manager post-game/bench-start bugs, PR #261; isolated browser bug fixes, no content/version changes.

- **2026-10-12, Codex:** RB-N1 in PR #253 repairs loot expiry/full-satchel loss and resource/dialogue feedback; pending field drops default safely for old saves. No content expansion or version bump.
- 2026-10-12 Claude (Priorities and direction): Evan picked folding Starfall Guild into the Godot village: SF-GUILD (map first, Heavy lifting H21); browser SG-N1 is fixes only.
- 2026-10-12 Claude (lane S): SF-WEB-BOOT checked (live previews match, Starfall boots on desktop and phone; no fix needed); SF2.11 counter mastery on branch claude/sf2.11-counter-mastery, 272 Starfall checks, web preview rebuilt.

- **2026-10-12, Codex:** AR2.15 in PR #249 separates the hall’s sports destinations and save displays; existing game saves and the mixed legacy index remain intact.
- 2026-10-12 Claude (website thread): rename sweep. The homepage sign, hall neon, promo kickers and trailer card say Generations; the tagline "Play for the fun. Automate the grind." is on the homepage, manifest, README and CLAUDE.md; CONTRIBUTING, FEEDBACK, glossary, offline and winter-road docs point to ecbarish/generations. History lines, save keys, Godot names and the votes form name left as they were.
- 2026-10-12 Claude (Priorities and direction): check-in. Plan holds; Evan's business-games direction and "passions first" recorded (QUEUE direction, GOALS, PRIORITIES); DM5 moved ahead of Lantern Bowl.

- **2026-10-12, Codex:** DC-N newcomer fixes in PR #247: calendar Play, tapered opening timing, complete dialogue and preparation return; own Generations clone, old saves preserved.
- 2026-10-12 Claude (Priorities and direction): AR-REN steps 6-8 done. #241 merged; the old idle-arcade repository forwards every link to /generations/ and clears the old offline cache (check passed, save kept). Left: AR-REN10 (trailer, QR codes) and the outside places in rename-checklist step 9.

- **2026-10-12, Codex for Evan:** moved to an isolated Generations clone; AC3.3 in PR #244 fixes Brisket's visible deaths, timer, lives/run counts and progress without initials. Original save keys/scores and AC3.2 release record kept; no Godot or version changes.
- 2026-10-12 Claude (Priorities and direction): AR-REN steps 5-6. Evan renamed the repository to ecbarish/generations and set the description (19:50 UTC); addresses switched (#241). Update your git remote: `git remote set-url origin https://github.com/ecbarish/generations.git`. Next: step 7, the leftover idle-arcade redirect site.
- 2026-10-12 Claude (Priorities and direction): rename steps 1-3: rename window in COMMS, save-names check (22 names), "Idle Arcade" to "Generations" in page titles, manifest, comments and top docs. All 18 suites pass.
- 2026-10-12 Claude (Priorities and direction): Generations rename as ticket AR-REN (waits for Evan; checklist gaps added), GOALS refinements (earned automation, five-minute sessions), Keymaster KM0 parked.
- 2026-10-12 dot engineering task (Adam): Brisket v0.1.2 easier opening is live, #233 merge `032bbd09`. Pages, eight public file hashes and 40 real public-browser checks verified at 17:27 UTC; all 19 source suites and 784 responsive/opening checks pass. [Release record](docs/playtests/brisket-ac3-2/README.md), scoped handoff #236.
- 2026-10-12 dot engineering task (Adam): AC3.2 draft [#233](https://github.com/ecbarish/idle-arcade/pull/233) eases Brisket's opening; 375px phone road gaps grow from 19px to 74px. Implementation passes all 19 suites and 784 responsive/opening checks; independent source/visual review found no blocker. [Evidence](docs/playtests/brisket-ac3-2/README.md); final-head checks in PR, no merge/publication authorized.
- 2026-10-12 Grok (Adam / abarish-dev, guest): claimed WD4b, Saltmarsh you can explore (`guest/saltmarsh-explore`, draft #232): coast road, original settlement kept, Tide-gated Moon Pool. Not merged.
- 2026-10-12 dot engineering task (Adam): Brisket v0.1.1 #180 is live (`19a7ee37`), eight public file hashes and 31 actual public-browser checks verified at 16:34 UTC. All 19 suites and 336 responsive checks pass; [release record](docs/playtests/brisket-ac3-1/README.md), status-only handoff #231.
- 2026-10-12 dot engineering task (Adam): #180 landscape correction approved; responsive art/caption fix passes 336 browser checks/70 captures and independent visual review; head 527b28a9 passes all 19 suites and 336 responsive checks; awaiting Adam's merge decision, kept draft. Original before screenshots retained, no merge/publication.
- 2026-10-12 dot engineering task (Adam): authorized ownership handoff for AC3.1 draft #180, fixture repair and current-main reconciliation; all 19 suites and 57 Brisket checks pass; six browser images reviewed, with pre-existing landscape stretch documented for the merge decision. No merge or publication.
- 2026-10-11 — Codex (Adam): AC3.1 built in draft [PR #180](https://github.com/ecbarish/idle-arcade/pull/180): Brisket recovery/release gate, ready keyboard launch, larger mule. Model checks pass; browser CI and visual review pending because local Chromium is unavailable. Capture script and review limits in docs/playtests/brisket-ac3-1/. No merge.
- 2026-10-12 Codex (Adam / abarish-dev): Starfall mobile fit is live: source #221 (`1a37f695`), exact preview #222 (`95b1655`). All 19 suites, 1,429 exact-pack browser checks / 136 captures, Pages and public manifest/four-file hashes pass; [verified release and COMMS handoff](docs/research/starfall-preview-mobile-fit.md).
- 2026-10-12 Grok (Adam / abarish-dev, guest): SF2.9 Starfall darkness step 1 ([#224](https://github.com/ecbarish/idle-arcade/pull/224)): one visible slime a night at most, through an unlit wall section; small mess cleared by E or Odo, gone after a day. Pacing re-measured (docs/measurements/starfall-day-pacing.md): the skip-the-lanterns player stays solvent. Source only; preview not rebuilt.
- 2026-10-12 Codex (Adam / abarish-dev): Adam approved publishing mobile fit; source [#221](https://github.com/ecbarish/idle-arcade/pull/221) merged as `1a37f695`. Exact tested pack staged in [#222](https://github.com/ecbarish/idle-arcade/pull/222), with committed-byte browser checks and Pages/live hashes as release gates; [record](docs/research/starfall-preview-mobile-fit.md).

- 2026-10-12 Codex (Adam): TOWER-COMMS #223 requests shared task reporting for the separate read-only AI Control Tower Site; no game or save changes.
- 2026-10-12 Codex (Adam / abarish-dev): SF-MOBILE-FIT in draft [#221](https://github.com/ecbarish/idle-arcade/pull/221): phones use fractional aspect-fit, desktop keeps integer pixels; camera and saves unchanged. 1,406 exported-browser checks / 136 captures and all 19 suites pass; [evidence](docs/screenshots/starfall-mobile-fit/README.md). Final-head checks gate review; not merged or published.
- 2026-10-12 Claude (sports thread): Diamond Manager v0.8.1: balls in play keep a watchable pace at Fast and Very fast, infielders react, first baseman covers, batter runs it out (Evan saw only strikeouts at speed).
- 2026-10-12 Claude (Priorities and direction): long runway: QUEUE "The direction" section, Heavy lifting H1-H20, road 16 rows (LB2+ unparked, AC5/AC6 added), WD3 ticked.

- **2026-10-12, Codex:** RB1.11 in PR #218, stacked after #214: active encounters, no idle fallback, earned easy-road Auto, rested time away and safe old-save reload. First-hour/human enjoyment validation remains separate; raids parked.

- **2026-10-11, Codex:** Evan deferred another Realmbound raid for player validation; #213 released/closed. RB-PLAY1 in PR #214 audits the first quest and fixes Focus town ownership, travel restrictions and visible return guidance. Human fun/first-party validation remains; no endgame content built.
- 2026-10-12 Claude (Priorities and direction): Evan's two changes: Realmbound early game first (RB1.10-RB1.12, end-game parked) and "Play, not watch" in GOALS.md (less automatic play, no full Auto; tasks RB1.11, AR2.14).
- 2026-10-11 Claude (Wildbond builder): creature catalogue and pipeline for Evan: docs/wildbond-creatures.md (target ~150, tiers with six showpiece lines, world-fit rules after Cobblemon, a step-by-step for adding a creature, tasks CR1-CR8 in DEVELOPMENT-PATH WB-C) and a generated list, docs/wildbond-creatures/catalog.md.
- 2026-10-11 Claude (Wildbond builder): WB-KEYS (QUEUE H2, the playtest pass 2 blocker): Wildbond shows its keys in the world the first times they matter (arrows over your head, the Talk key and word beside you, J beside the bag); gamepad buttons on a gamepad; nothing extra on a phone. Checks and screenshots in docs/screenshots/wildbond-keys/.

- 2026-10-11 Claude (Continue Idle Arcade games thread): SF2.10 / H1, Starfall's goal line and on-screen controls (the playtest pass 2 blocker); 230 checks; play/starfall/ pack rebuilt so the Playtester can re-score.
- 2026-10-11 Claude (ideas thread): Evan says Little Ranch is a big hit with his daughter. docs/proposals/little-ranch-next.md: new toddler toys as places inside Little Ranch (Little Wagon 17, Snack Kitchen 17, Paint Shed 16) and LR3-LR8 for the ranch. No builds; PRIORITIES places them.
- 2026-10-11 Grok (Adam / abarish-dev, guest): LR15 Little Ranch grown-up panel cleanup and app mode (#215, v0.5.0). Little Ranch checks 96/96; the tick, changelog and this line are in the PR itself. The Android wrapper that uses app mode stays outside the repo.
- 2026-10-11 Grok (Adam / abarish-dev, guest): LR14 Little Ranch moon's song (#212, v0.4.0). Three taps on the moon at night play Twinkle Twinkle Little Star while the baby sleeps. Little Ranch checks 79/79; the tick, changelog and this line are in the PR itself.
- 2026-10-11 Grok (Adam / abarish-dev, guest): LR13 Little Ranch sun surprise (#211, v0.3.0). Five taps on the sun in the daytime bring a rainbow and a cheering baby. Little Ranch checks 66/66; the tick, changelog and this line are in the PR itself.
- 2026-10-11 Grok (Adam / abarish-dev, guest): LR12 Little Ranch wake-up taps (#210, v0.2.0). Six taps on the sleeping baby wake it for a fresh day. Little Ranch checks 57/57; the tick, changelog and this line are in the PR itself.
- 2026-10-11 Codex (Adam / abarish-dev): Adam approved publication; SF2.6c #200 merged as `0af5b92`, after preserving current-main website/Little Ranch notes and rechecking all 18 suites. Exact-source preview #206 passes 54 browser checks and 17 captures; downloaded bytes independently hash/blob verified. Final read-only committed-pack check and Pages/live hashes gate publication; [release record](docs/research/starfall-preview-opening.md). #195 remains separate.

- 2026-10-11 Codex (Adam / abarish-dev): SF2.6c in [PR #200](https://github.com/ecbarish/idle-arcade/pull/200): fresh opening shows the complete Guild Hall and inn, old positions/progress preserved, three unused environment tiles removed. All 18 CI suites pass (Starfall 227/0), plus 32 nonblank rendered captures at four sizes and 501 construction states; final evidence-only head will be rechecked. [Evidence](docs/screenshots/starfall-opening-view/README.md). Not merged or exported.

- 2026-10-11 Claude (website thread): arcade v1.6.0, AR2.14. Classic editions in their own section with ribbons; guides labelled by edition; site and guide refreshes tied to milestones (docs/SITE-AND-GUIDES.md); hall upgrade ticket AR2.13 on the QUEUE road (#13).
- 2026-10-11 Claude (ideas thread): Evan says Little Ranch is a big hit with his daughter. docs/proposals/little-ranch-next.md: new toddler toys as places inside Little Ranch (Little Wagon 17, Snack Kitchen 17, Paint Shed 16) and LR3-LR8 for the ranch. No builds; PRIORITIES places them.
- **2026-10-11, Codex:** DM7 records/history in PR #209 after #208/#207/#196: actual club stints, league awards and Trophy Case; old history preserved without invented awards. 93 Diamond Manager checks and four-size browser/reload evidence.

- **2026-10-11, Codex:** DM-B2 six-season league/market balance in PR #208, stacked after #207 and #196. Reproducible 12-seed before/after report in docs/diamond-manager-balance.md; no versions, Godot or shared office changes.

- **2026-10-11, Codex:** DM4 player morale and named Iona stories in PR #207, stacked after coaches #196. Playing time, results, contracts, optional deals/trades and recovery; 78 Diamond Manager checks and four-size UI/reload evidence. No version or Godot changes.

- **2026-10-11, Codex:** DM3 coach hiring/development in PR #196: two roles, six winter candidates, seasonal cash salaries and exact visible player gains; old saves and phone/laptop/desktop/ultrawide flows checked. No versions, Godot or other games changed.
- 2026-10-11 Codex (Adam / abarish-dev): SF2.6c in [PR #200](https://github.com/ecbarish/idle-arcade/pull/200): fresh opening shows the complete Guild Hall and inn, old positions/progress preserved, three unused environment tiles removed. All 18 CI suites pass (Starfall 227/0), plus 32 nonblank rendered captures at four sizes and 501 construction states; final evidence-only head will be rechecked. [Evidence](docs/screenshots/starfall-opening-view/README.md). Not merged or exported.

- 2026-10-11 Claude (website thread): arcade v1.6.0, AR2.14. Classic editions in their own section with ribbons; guides labelled by edition; site and guide refreshes tied to milestones (docs/SITE-AND-GUIDES.md); hall upgrade ticket AR2.13 on the QUEUE road (#13).

- 2026-10-11 Claude (Priorities and direction): docs/GOALS.md, short, medium and long-term goals for the arcade and each game (Evan asked). Wildbond's long term: the creature game people wish Pokémon was, six pillars drawn from the best fan games (Radical Red, Reborn, Cassette Beasts, Temtem, Coromon, Infinite Fusion, Insurgence) plus our own idea, the bond as the game.
- 2026-10-11 Grok (Adam / abarish-dev, guest): at Adam's request ("do your suggestions"), merged SF2.18 no mandatory chores (#187, `a0e4787`) and SF2.20 Tamsin easier to reach (#190, `fa44b3a`). Adam dropped SF2.19 (extra board pins measured worse; #189 closed). The pacing re-measure is in docs/measurements/starfall-day-pacing.md. Then rebuilt play/starfall/ from `fa44b3a` (pack only, 3,252,424 bytes) in the PR that carries this line.
- 2026-10-11 Claude (Priorities and direction): refreshed the shared docs after Evan heard they were stale. QUEUE's Heavy lifting (12 builds) and road ahead (12 tasks) rebuilt from what is really open; 11 merged path lines ticked; new WB-KEYS, LR3, AC-x; PRIORITIES section 4 and this Up next rewritten.
- 2026-10-11 Grok (Adam / abarish-dev, guest): COMMS catch-up only. Ember Bricks is claimed in ready #185 (not free, not merged; hub stays v1.5.1; #180 untouched). #177 merged (`480dfc4`); its preview is draft #183. #181 and #182 are merged.
- 2026-10-11 — Grok (Adam / abarish-dev, guest): claimed AC3 Ember Bricks on `guest/ember-bricks`. The Breakout-shaped cabinet only. Brisket's Crossing stays merged. No hub bump.

- 2026-10-11 Grok (Adam / abarish-dev, guest): at Adam's request, Starfall planning docs (#181): the darkness proposal updated with Adam's decision (one visible creature, at most one incident a night), the progression audit with his priority order, tickets SF2.9 to SF2.17 in DEVELOPMENT-PATH, and the SF2.17 day-pacing measurement (docs/measurements/starfall-day-pacing.md; no game numbers changed).
- 2026-10-11 Grok (Adam / abarish-dev, guest): at Adam's request merged SF2.8 "Something by hand every day" (#179, `76f73aa`: lantern round then Odo, sparring then Ilse; Starfall Godot 199/0, all 17 suites pass), then rebuilt play/starfall/ from `76f73aa` (pack only, 3,251,192 bytes) in the PR that carries this line.
- 2026-10-11 — Grok (Adam / abarish-dev, guest): at Adam's request merged #160 (AC3 Brisket's Crossing, `a7fac81`). Cabinet v0.1.0, no hub bump. Ember Bricks stays open. The hit-pause follow-up stays draft #180.
- 2026-10-11 Codex (Adam / abarish-dev): WB-DOOR-TAP [PR #177](https://github.com/ecbarish/idle-arcade/pull/177) fixes four rejected door targets and clears Nora's entrance from the unchanged-size phone pad. All 17 suites pass (Wildbond 1503/0); 150 rendered input transitions and 256 captures pass, including visible-pad entry/exit/re-entry at four sizes. [Evidence](docs/screenshots/wildbond-door-taps/README.md). Merged as `480dfc4`; exact preview release #183 passes 353 browser checks and 119 captures, with final CI/live-hash gates before publication. No save-format changes.

- 2026-10-11 Grok (Adam / abarish-dev, guest): at Adam's request built and merged SF2.7 "See the wilds sooner" (#174, `9c48e64`): a short stretch outside Starfall's west gate (trail, creek, Tull's field, North Road, waymarkers; adventurers on those jobs seen at work). Starfall Godot 167/0, all 17 suites pass. Then rebuilt play/starfall/ from `9c48e64` (pack only, 3,241,944 bytes) in the PR that carries this line.
- 2026-10-11 Claude (Playtester thread): playtest pass 2 (docs/PLAYTEST.md). The four new games pass (Storm Front, Lighthouse Watch and Little Ranch 17, Brisket's Crossing 15, with a no-pause-after-a-hit fix wanted). The Starfall village is still below the bar (no goal line or controls). Wildbond is better (its own village, tap to walk) but still shows no keys in game.
- 2026-10-11 Claude (Art direction thread): reviewed ART-SF-1 to 7 and SF2.6 in the game: passed (Starfall no longer looks like Larkhaven). Moved the food counter onto Starfall's palette; new tasks ART-SF-8 (dress the square) and SF2.6c (day-one view shows the hall and inn roofs; drop unused pack tiles) in DEVELOPMENT-PATH.
- 2026-10-11 Claude (Wildbond builder thread, lane W): WB4.2 part 1, the wild bond in battle (battle.gd `can_join`/`_join`, tests/wild_bond.gd, PR #170). Then WB4.3 part 2 in the same PR: T58 placed (evidence beside Orri, Ceryn and Sivet; the reveal by Hollowecho's cave mouth; long shadows once depth returns; each Warden's after-line; tests/reveal.gd). Left for lane W: the fused form per family and the wild bond's field book page and legends (WB4.2), the partner's walk in the reveal, Maren's and Wren's tell lines.
- 2026-10-11 Claude (sports thread): DM-G, Diamond Manager v0.5.0: pitch-by-pitch games on an animated field, pitching changes, pinch hitters and runners, box scores, a Stats page and league leaders; 49 checks.
- 2026-10-11 Claude (sports thread): DM-T, Diamond Manager v0.4.0: trade finder (find a deal, shop a player, what would make it work), prospects tradeable; 41 checks.
- 2026-10-11 Claude (sports thread): LB0 done: Lantern Bowl pitch with three mock screens (docs/plans/lantern-bowl.md). LB1 done too: the front office (contracts, trades, money, schedule, standings, save loading) lives in shared/sports-office.js; Diamond Manager passes all 53 checks unchanged. LB2 (one playable drive) is open for any AI.
- 2026-10-11 Claude (sports thread): Diamond Manager v0.5.1: pitcher rest like the majors (starters every fifth day, relievers by pitch count); 53 checks. Mobile sports games researched (docs/plans/sports-management.md); new tickets DM-K key moments you call, DM-H highlights speed, DM-M traits, DM-N news. Lantern Bowl LB0-LB5 still unclaimed.
- 2026-10-11 Claude (sports thread): DM6, Diamond Manager v0.3.0: the draft (three rounds, worst first), ceilings and growth, a six-player farm club with call-ups and send-downs; 37 checks. Next for any assistant: DM-B2 (league balance over many seasons), DM3 coaches, LB0/LB1 football.
- 2026-10-11 Claude (sports thread): DM-B, Diamond Manager v0.2.0: managing now matters (bigger budget, standouts, league-minimum players, faster training, Iona on trades); 27 checks. Next for any assistant: DM3 coaches, LB0/LB1 football (docs/plans/sports-management.md).
- 2026-10-10 — Codex (Adam / abarish-dev): LR2 [PR #140](https://github.com/ecbarish/idle-arcade/pull/140) repairs meals interrupted by Peekaboo and keeps the baby/toys aligned through rotation. 49 browser checks, repeated saved-sound compatibility, before/after captures and all 14 implementation suites passed; reconciled with current main and all 17 suites passed. Adam approved publication; v0.1.1 release metadata is being rechecked before the approved merge. No save changes.
- **2026-10-10, Codex:** PR #159: fuller arm/torso mesh volume with unchanged bone lengths/head, reversible earlier builds, matched volume evidence and 72 asset checks; rigid shoulder pad excluded from body inflation. No purchases, Godot or production/save changes.

- **2026-10-10, Codex:** PR #159: broader imported-character build at unchanged height/head size, reversible comparison menu, matched front/profile/room evidence and reduced-motion startup fix. No purchases or production changes.

- **2026-10-10, Codex:** PR #159 now includes an opt-in free Quaternius CC0 rigged-character comparison in the 3D inn, with authored walking/talking and bone-mounted sword. No purchase or live game/save/Godot changes; 17 suites and original 146 trial checks pass; dedicated imported-asset checks and screenshots included.

- **2026-10-10, Codex:** RB1.9: isolated third-person 3D Realmbound inn trial, PR #159. Plan in docs/proposals/realmbound-3d.md; all 17 suites and 146 dedicated checks pass; jointed characters, planted feet, conversation facing and modular eight-slot equipment previews added; asset upgrade contract recorded. No live game, saves, versions or Godot edits.

- 2026-10-10 — Codex (Adam): FB-17 [PR #168](https://github.com/ecbarish/idle-arcade/pull/168) repairs the broken old-save rule and aligns onboarding claim/merge instructions with PROCESS.md. Test coverage now points to the runner instead of stale counts. Documentation only; local links and diff checked.

- 2026-10-10 — Grok (Adam / abarish-dev, guest): AC3 Brisket's Crossing is draft [PR #160](https://github.com/ecbarish/idle-arcade/pull/160) (Frogger shape, original art, v0.1.0). Ready for review, not merged. Ember Bricks stays a separate unclaimed cabinet. No hub version bump.
- 2026-10-10 — Grok (Adam / abarish-dev, guest): at Adam's request merged #165 (Starfall evening tint + yard footprint, `28cee8c`) and #166 (play/starfall rebuilt, `d146ce9`), each after a self-check (checks green; Starfall Godot 152/0; full suite 16/16 with Godot; preview verified in headless Chrome).
- 2026-10-10 — Grok (Adam / abarish-dev, guest): re-exported `play/starfall/` (pack only, 3,231,660 bytes, from `28cee8c`; build.json + BUILD.md like Wildbond's) and refreshed images/play/sf-town.png; verified in headless Chrome + SwiftShader.
- 2026-10-10 — Grok (Adam / abarish-dev, guest): Starfall evening tint and yard footprint (SF2.6 follow-ups, guest/starfall-evening-yard). Starfall Godot 152/0.
- 2026-10-10 — Codex (Adam / abarish-dev): AC2.1 in [PR #163](https://github.com/ecbarish/idle-arcade/pull/163), Lighthouse Watch display/control polish: uniform square fit, accurate resized taps, 87 cabinet checks and nine touch/DPR cases; before/after captures. Lighthouse Watch v0.1.1 release via #163 at Adam's request; balance/save format unchanged. 87 cabinet checks, 14 browser suites and both native suites verified; screenshots and old scores checked.

- 2026-10-10 — Grok (Adam / abarish-dev, guest): at Adam's request merged #162 (ART-SF-7: side-on west gate, 2-tile smithy and tavern, `a4afc54`) after a self-check (checks green; fit --check PASS; Starfall Godot 149/0; full suite 16/16 with Godot). Still open: Starfall's evening tint; play/starfall re-export.
- 2026-10-10 — Grok (Adam / abarish-dev, guest): ART-SF-7 in [PR #162](https://github.com/ecbarish/idle-arcade/pull/162): new `tools/art/starfall_fit.py` (--check) draws a side-on west gate and 2-tile smithy and tavern, now wired into Starfall. Starfall Godot 149/0. Not merged; Adam decides.
- 2026-10-10 — Grok (Adam / abarish-dev, guest): at Adam's request merged #157 (SF2.6 / H4 Starfall's own place, `5db4331`) after a self-check (checks green; Starfall Godot 147/0; full suite 16/16 with Godot). Godot Starfall has no version number to bump (changelog entries are dated; the SF2.6 entry is in). play/starfall not re-exported.
- 2026-10-10 — Grok (Adam / abarish-dev, guest): SF2.6 / H4 "Starfall's own place" in [PR #157](https://github.com/ecbarish/idle-arcade/pull/157): a 44×18 frontier stockade map that scrolls, drawn with the merged ART-SF-1 to 5 pictures, plus 17 new Godot checks (reachability, doors, old saves). Not merged; Adam decides.
- **2026-10-10, Codex:** RB1.8 in PR #155: facing/stepping people, object silhouette shadows on Low/High, continuous room side walls, a generous stone fireplace around the larger contained flame, and slightly steeper room framing. All suites and four-size captures checked; no shared engine, Godot, saves or version edits.
- 2026-10-10 — Codex (Adam / abarish-dev): AR2.4 / X2 #158 checked 7 guide/playtest pages, 140 local references, 22 distinct images and 14 browser views. All pass; no repairs needed. Evidence in guides/link-check-2026-10-10.md; no game changes.

- 2026-10-10 — Grok (Adam / abarish-dev, guest): at Adam's request merged the Starfall art series ART-SF-1 to 5: #134 (`0b7de29`), #135 (`d71cf82`), #136 (`0ae329d`), #139 (`3f23825`), #144 (`41b06f5`), each retargeted to main after the one before, with art-direction sign-off waived by Adam. Assets only, not wired into the game yet (SF2.6), so no Starfall version bump.
- **2026-10-10, Codex:** RB1.7 inn furnishing is ready in PR #153, from latest main a18a195. All 16 suites pass, including 144 new entrance/furniture/movement checks; actual canvas tap, resting and keyboard exit tested at 375/1366/1920/3440. No Godot edits or version bumps.
- 2026-10-10 — Codex (Adam / abarish-dev): WB-ROOF-149 #154 fixes accepted tap routes that hit roof collision in Larkhaven/Sunthread; 23 regression checks preserve one-tap arrival, doors and NPC avoidance. No save/version/preview change; scene review remains #150.

- 2026-10-10 — Grok (Adam / abarish-dev, guest): at Adam's request merged #137 (WB2.4/H8 Larkhaven homes, `efa943a`), #143 (COMMS map review, `8c782a0`), #145 (AC2 Lighthouse Watch, `612813e`) and #146 (AR2.11 Tell us, `e81ac6a`), each after the PROCESS.md self-check. Post-merge: Lighthouse Watch v0.1.0 with its Tell us hookup, arcade v1.5.1, ticks. ART-SF series (#134 to #144) held: see COMMS.
- 2026-10-10 Codex: SCENE-PLAN, PR #151, docs/plans/scene-layout-pass.md; Evan's shared interior/scene outline, Larkhaven briefs and claimable follow-ups complement MAP-AUDIT #147 and issues #149/#150. Docs only; no game/art/preview edits.

- 2026-10-10 — Grok (Adam / abarish-dev, guest): AR2.11 "Tell us" in [PR #146](https://github.com/ecbarish/idle-arcade/pull/146): a row in the shared Settings panel built on shared/feedback.js, Storm Front hooked up, issue forms list every game, ten-minute playtest on Come Play, tests/tell-us.html in run-all-checks. Ready for review, not merged.
- 2026-10-10 — Grok (Adam / abarish-dev, guest): AC2 Lighthouse Watch cabinet in [PR #145](https://github.com/ecbarish/idle-arcade/pull/145), built like Storm Front: new folder, one launcher link and cover, tests/lighthouse-watch.html (45 checks) in run-all-checks. Ready for review, not merged.
- 2026-10-10 Grok (Adam / abarish-dev, guest): PR #137 updated with Adam's decisions: Mira (Pip's mum) and Nora (his gran, Nora's cottage) introduce themselves once; lore/wildbond.md has both homes, wildbond-threads.md thread 7 the harvest hum (origin open); run_tests.gd door check (every door, doorway and road has an open, reachable tile in front; none blocked).
- 2026-10-10 Codex: RB1.6, PR #141, readable Realmbound ability labels; full names, shortcut/cooldown separation, 40 class/viewport/text-size layouts and all 14 suites pass. No gameplay, saves, versions or Godot changes.
- 2026-10-10 Codex: OW1.1, PR #142, optional Choose a world shortcut inside the Between introduction; four new story/save checks and five actual browser flows pass, all 14 suites pass. No story, save, version, Godot or preview changes.
- 2026-10-10 — Codex (Adam / abarish-dev): MAP-AUDIT #147 records native access checks for 16 main / 18 PR #137 Wildbond maps and 501 Starfall building states. Roof-routing defect filed as #149; rendered occlusion/furnishing review remains #150. No game/save/version edits.

- 2026-10-10 — Codex (Adam / abarish-dev): WB-PREVIEW [PR #132](https://github.com/ecbarish/idle-arcade/pull/132) merged as `7b212edd` and deployed. Main [Checks](https://github.com/ecbarish/idle-arcade/actions/runs/38056640269) pass all 14 suites; [Pages](https://github.com/ecbarish/idle-arcade/actions/runs/38056640121) succeeded. Live pack, shell and engine hashes match the browser-reviewed build (55 checks, 27 captures, synthetic pre-WD3 saves); fresh live gameplay could not be retested here because cloud WebGL2 is unavailable. No game/save/version change.

- 2026-10-10 — Codex (Adam / abarish-dev): WB-PREVIEW in [PR #132](https://github.com/ecbarish/idle-arcade/pull/132) refreshes the Wildbond web pack from merged main, updates its guide and records exact-build browser/old-save verification. Ready for maintainer review after CI; no merge, deploy or version bump.

- 2026-10-10 Grok (Adam / abarish-dev, guest): WB2.4/H8 Larkhaven homes on guest/larkhaven-homes (PR #137): main.gd INTERIORS pip_home and gran_home (doors added to the Larkhaven rows in _build_homes, so a fresh export keeps them), a bed tile, one find each in got_items, old-save nudge off the new roofs; 28 new run_tests checks. Names of Pip's mum and gran are a question for Evan.
- 2026-10-10 — Grok (Adam / abarish-dev): ART-SF-6 in [PR #148](https://github.com/ecbarish/idle-arcade/pull/148), stacked after #144. Loose props sheet (barrel, crate, firewood, lantern, cart, bunting, staked plot) with footprints and a scale contact scene; asset checks pass. Art review before integration; game/save/version/preview untouched.

- 2026-10-10 — Codex (Adam / abarish-dev): ART-SF-5 in [PR #144](https://github.com/ecbarish/idle-arcade/pull/144), stacked after #139. Seven original frontier shops/civic sprites with footprints and silhouette/contact sheet; asset checks pass. Art review before integration; game/save/version/preview untouched.

- 2026-10-10 — Codex (Adam / abarish-dev): ART-SF-4 in [PR #139](https://github.com/ecbarish/idle-arcade/pull/139), stacked after #134–136. Guild Hall and Inn, lit/unlit glass, 12×20 doors and placement/contact notes; deterministic asset checks pass. Art review before merge/integration; no game/save/version/preview change.

- 2026-10-10 — Codex (Adam / abarish-dev): ART-SF-3 in [PR #136](https://github.com/ecbarish/idle-arcade/pull/136), stacked after #135 and #134. Original pine sizes, clearing props and repeating forest edge; palette, footprint and repeat checks pass. Art review before integration; no game/save/version/preview change.

- 2026-10-10 — Codex (Adam / abarish-dev): ART-SF-2 in [PR #135](https://github.com/ecbarish/idle-arcade/pull/135), stacked after #134. Frontier palisade, gate and watchtower with state/footprint metadata and scale contact sheet; deterministic asset checks pass. Art review before integration; no game/save/version/preview change.

- 2026-10-10 — Codex (Adam / abarish-dev): ART-SF-1 in [PR #134](https://github.com/ecbarish/idle-arcade/pull/134), Starfall frontier ground atlas and 24×14 scale patch. Palette, seam and deterministic-output checks pass; art direction reviews before SF2.6 integration. No game/save/version/preview change.

- 2026-10-09 Codex (codex/diamond-manager-save-safety): review follow-up preserves invalid league JSON before recovery, validates playable imports and keeps roster confirmation/trade errors in the game window. Applied after DM2; no version or balance change. Evan authorized review/merge while Claude is unavailable; reviewed and merged #121/#124/#126/#127/#131. All 14 combined suites pass; launcher 178 checks; DM safety 23 checks.

- 2026-10-09 Grok (Adam / abarish-dev, guest): LR1 Little Ranch smallest test, games/little-ranch/ (v0.1.0): feed, bubbles, peekaboo, bedtime, grown-up lock; tests/little-ranch.html (38 checks) in run-all-checks; launcher entry and cover.
- 2026-10-09 Claude (Art direction thread, was Game assets): one arcade-wide art guide (docs/art/README.md), Starfall's look sheet, palette and frontier mock-up (docs/art/starfall.md), and drawing tasks ART-SF-1 to 6 in QUEUE.md "Art tasks" for any AI. Wildbond's page (PR #123) is linked as the first sheet. Next: review ART-SF PRs; then sheets for the browser games as they move into the game window.
- 2026-10-09 Claude (Playtester thread): DM2, the Diamond Manager playtest (docs/playtests/diamond-manager-1.md). It passes the bar (15), but over two seasons an active manager wins no more than a hands-off one. Three small fixes landed; the deeper fix is ticket DM-B in docs/plans/sports-management.md.
- 2026-10-09 Codex (Adam / abarish-dev): WB5.1 in PR #129 builds the post-Champion Lighthouse Spire (escalating floors, five-floor rests, saved best floor) plus progressively stronger Warden rematches; old saves default the new fields safely and automated league/Spire captures pass.
- 2026-10-09 Grok (Adam / abarish-dev, guest): Godot Wildbond playtest fixes on guest/wildbond-ui-fixes: card.gd sizes 3+ button rows to their words (workbench "Have it made" was cut off); main.gd's after-Wren caption no longer says "End of the trial" and clears at any door. Three new run_tests.gd checks.
- 2026-10-09 Codex (Adam / abarish-dev): WD4a Thornwood in PR #128 splits the first region into Thornwood Trail, the preserved Thornwood settlement, and Stone-gated Old Root Grove; old-save coordinates are covered, full checks and 1366x768 map captures are the merge gate.
- 2026-10-09 Grok (Adam / abarish-dev, guest): WB6.4 Wildbond guide, guides/wildbond.html (first steps, element chart, ranch, controls) with real captures of play/wildbond/ in guides/images/wildbond-*.png; card on guides/index.html.
- 2026-10-09 Claude (Priorities and direction): PROCESS.md also has "When you get ahead of the road" (path items in focus order, then write-your-own tickets scoring 12+ on the scorecard, ask first for new games, canon, saves, outside assets or money).
- 2026-10-09 Claude (Priorities and direction): docs/PROCESS.md is the one rulebook for claiming, submitting and merging (Evan: any AI may do any step, including merging its own PR at once, after a written self-check; no waiting, no gatekeeping).
- 2026-10-09 Claude (Priorities and direction): after the review pile-up, QUEUE.md now keeps Heavy lifting 10+ builds deep (H8-H11 added), has a "When the road is empty" fallback list so helpers never sit idle, and "Saving Claude's usage" rules (also in CLAUDE.md). Evan said yes to backup merging: his dad's AIs may merge others' green PRs after 2 hours without a Claude reviewer (QUEUE.md "Backup merging").
- 2026-10-09 Codex (Adam / abarish-dev): RB1.4 phone pass in PR #116, full CI and before/after pictures pass; updated with latest main, fresh CI pending. Guest branch, own noreply, no merge or version bump.
- 2026-10-09, Codex for Adam / abarish-dev: AC1 Storm Front built on guest/storm-front, PR #119. Fresh browser checks and cabinet captures run in GitHub; no merge or version bump. #104 and #116 updated to main, green and ready.
- 2026-10-09 Claude (website thread): AR2.12 the front door, arcade v1.5.0 (PR #117). The arcade hall is the only homepage style (living world and road removed, vote closed); games in sections by kind; every card says what you do and its controls. Wildbond's in-game controls/roofs stay with the Wildbond builder; Diamond Career's redesign with the sports thread.
- 2026-10-09 Grok (lane C): C4/E7 Studio lighting and music tuner (studio/tuner.js, studio/tuner-preview.html; reads ZONE_LIGHT, AREA_AIR and TRACKS; preview-only, localStorage `studio-tuner-v1`); 43 Studio checks; no game or shared/ edits.
- 2026-10-09 Claude (Wildbond builder thread, lane W): WA part 1, Wildbond's own art (Evan chose "Our own tiles"): tools/paint_tiles.gd paints assets/env/wild (ground, trees, cottages, barn); pack tiles removed; docs/art/wildbond-art-direction.md (palette, shapes, toward 3D/first person). Then water (no pack tiles left) and a "turn your phone sideways" card for phones held upright (scripts/turn_card.gd; Playtester item 4). These wait on a branch until PR #107 merges. Next: WA part 2 (battle backdrops, the halls on the palette, interiors).
- 2026-10-09 Claude (Wildbond builder thread, lane W): Evan's playtest notes, part 1: How to play page (howto.gd: title button, before a new journey, book Settings), no walking on roofs (main.gd buildings()/_under_roof); 310 checks. Wildbond's own look is a question to Evan (decision card in the Wildbond builder thread).
- 2026-10-09 Claude (Wildbond builder thread, lane W): WB6.1-6.2: named controls (controls.gd), phone pad (touch_pad.gd), sound buses and a Settings page in the book (settings.gd); 305 checks; web preview pack rebuilt. Next in lane W: WB4.3 part 2 (place ChatGPT's T58 reveal once PR #101 merges), then WB5.1 (the Spire).
- 2026-10-09 Claude (sports thread): Evan asked for a baseball game you manage instead of bat (and a Retro Bowl-style football game). DM1 built: games/diamond-manager/ (v0.1.0) replaces Diamond Career on the shelf and Come Play; 18 checks in tests/diamond-manager.html. Road for any assistant: docs/plans/sports-management.md (DM2-DM8, Lantern Bowl LB0-LB5). PR #110.
- 2026-10-09 Claude (Playtester thread): docs/PLAYTEST.md, a playability scorecard and the bar every game must pass before friends see it (six questions, no 1s, 13+). Pass 1 played all eight games from fresh saves: Diamond Career fails (9/18; the game hides behind "Talk to Iona", odd scale, two at-bats a game); the Starfall village shows no goal or controls; Wildbond passes on a computer but shows no controls in game and shares Starfall's village. Fixes handed to lanes W, S, A and the website and sports threads. `tools/playtest/first-look.cjs` re-runs the screenshots.
- 2026-10-09 Codex (PR #113, codex/wildbond-look-data): WD2 data half gives all 107 species explicit shapes and four distinct drawing hints. Actual export verified unchanged gameplay/lore; all 11 suites pass (Wildbond 2625). Godot parts remain Claude's next step; no engine or version edits.
- 2026-10-09 Claude (ideas thread): docs/proposals/games-for-everyone.md for Evan's daughter (almost 3) and his dad (Atari era): Little Ranch (a tap-and-play toy with Wildbond's baby creatures) and the Arcade Cabinets (original single-screen games, 1978-85 style), both 17/18; Evan said yes to both, each starting with a one-PR test. No builds yet.
- 2026-10-09 Claude (Wildbond builder thread, lane W): WD2 part 1: serpent, turtle, moth and tree-folk shapes for twelve species (figures.gd SHAPE_FOR). Next in lane W: phone controls and settings (WB6.1-6.2) while ChatGPT writes T58 and the WD2 look features.
- 2026-10-09 Codex (Adam / abarish-dev, guest lane X): X2 audit in PR #102; all 112 local guide/Come Play references, HTML anchors and referenced images pass; no page fixes needed. X1 unclaimed because this cloud browser lacks WebGL2; no game defect inferred.
- 2026-10-09 Codex: RB1.5 opening polish, PR #98; conversations pause the world, Focus fallback waits for the first victory, sky details clear the HUD. Four screen sizes checked; no Godot, version or save-schema edits.

- 2026-10-09 Codex: T58 reveal writing ready, PR #101; 53 lines, approved three shared observations, warm-pocket conversation, depth moment and eight Warden responses. 159 portrait previews and all ten suites pass; Claude places it, no Godot/preview/version changes.

- 2026-10-09 Grok (lane C): C2/E5 Studio creature and quest viewers (studio/viewers.js, rules from the game checks; current data clean), 34 Studio checks; PR #106, stacked on #99.
- 2026-10-09 Grok (lane C): C1/E4 the Studio text browser (studio.html + studio/text-browser.js): search all player text in the eight games with file, line and data path; tests/studio.html (26 checks) added to run-all-checks; PR #99. Adam's Grok helper, working as a guest per CONTRIBUTING.md.
- 2026-10-09 Codex (Adam / abarish-dev, guest lane X): X3 text cleanup in draft PR #104; syntax, 60,017 baseline story-state snapshots and 0/1/2/10 life summaries pass. Full browser/visual checks await CI/reviewer; local Chromium unavailable.

- 2026-10-09 Claude (Design decisions thread, lane Q): docs/DECISIONS.md, the design-answer log and how to ask; DD-2 one day in Starfall (calendar counts service days), DD-3 Warden levels follow the data (lore paragraphs fixed).
- 2026-10-09 Claude (planning): a way in for guest contributors (Evan's dad first): CONTRIBUTING.md (collaborator with guest/* branches, a start prompt for their AI, pull requests reviewed by lane R) and QUEUE.md lane X with three starter tasks.
- 2026-10-09 Claude (Wildbond builder thread, lane W): reviewed T55 (ledger "Claude's review of T55"), wrote ChatGPT's T58 (the late observations and the reveal). Evan decided the watcher is the turned friend. Next in lane W: WD2 body shapes while T58 is written.
- 2026-10-09 Claude (lane S): SF2.5 the apothecary's apprentice (Fen), 130 Starfall checks, web preview rebuilt; branch claude/sf2.5-apprentice.
- 2026-10-09 Claude (Wildbond builder thread, lane W): WB3.6b pacing: a level costs about 12 even-level wins at every stage (was 24 early, ~400 late). Evan chose 12; next in lane W: the ending (WB4.3).
- 2026-10-09 Claude (Wildbond builder thread, lane W): WD1 done in PR #91 (satchel icon and a Satchel page in the field book instead of the numbers line; large place names on arrival) and the T56 Deeptide cooldown stall fixed (a creature with nothing ready catches its breath until a move is ready). Next in lane W: PRIORITIES section 4 item 2, pacing fixes from T56.
- 2026-10-09 Claude: game review of every game (docs/proposals/game-review-2026-10-09.md): twelve proposals GR-1 to GR-12 with screenshots; scored and placed in docs/PRIORITIES.md. Godot checks 273 and 116 pass.
- 2026-10-09 Claude (art and sound, branch claude/project-thread-fhkf1l, includes the craft review branch): sound effects in both Godot games from the Ninja Adventure pack on Evan's PC (`scripts/sfx.gd`, N toggles, every sound checked); feeling bubbles over heads in Starfall and the "!" bubble for Wildbond's trainers; docs/learning/assets.md (what we use, the pack's unused treasures mapped to deliverables, safe licences and sources, making our own) and the arcade palette; CREDITS and credits.html. Starfall 127, Wildbond 282 checks; all 10 suites pass. Web previews not rebuilt (milestone rule). Next: AR2.10, our own sounds.
- 2026-10-09 Claude (ideas thread): docs/proposals/new-game-ideas.md, the pitch card for new games and seven ideas judged with research. Evan: the features (ranch races, Saltmarsh fishing, Starfall delves) are good direction; football in the Retro Bowl shape is a strong option (he loves Retro Bowl); the Card Shop moves to the back, gated behind Wildbond. No builds, no path reordering (the priorities thread owns that).
- 2026-10-09 Claude (PR reviewer thread): PR sweep. Closed 14 stale PRs whose work was already in main (#50, 53, 58, 60-65, 70, 71, 78, 79, 81); merged #85 (craft review), #86 (priorities) and the stacked T55/T56/T57 (#82-#84) after all ten suites passed. For Claude next: T56's Deeptide cooldown stall (docs/wildbond-godot-pacing.md) and T55's three late observations need review before the reveal.
- 2026-10-09 Claude: docs/PRIORITIES.md, focus slots and a scorecard for every idea; DEVELOPMENT-PATH's ticket factory now takes work in focus order. Flagship Wildbond (Godot, confirmed by Evan), second Starfall, ChatGPT's own Realmbound.
- 2026-10-09 Claude (craft review, branch claude/project-thread-2h7yfo): new docs/learning/ (glossary, Godot practices, saves and testing, web and shipping); safe saves in both Godot games (277 and 119 checks); Wildbond ambience to OGG and shared tunes (web pack 25.3 to 20.0 MB, both previews re-exported); `.import` files committed; `.gitattributes`; `node tools/run-all-checks.cjs` runs all ten suites (all pass) and GitHub runs it on every push and PR. DEVELOPMENT-PATH Part 4 now logs lessons; AR2.7 (build previews on GitHub) waits on Evan.
- 2026-10-09, Codex: T57/SF3.3 ready in PR #84, stacked after #83: four seasonal village chapters, threats/festivals/newcomers, recoverable choices and date-independent story. Verified shared calendar versus service-day timing; eight browser suites pass. Docs only; Claude owns implementation.
- 2026-10-09, Codex: T56 ready in PR #83, stacked after #82: actual copied Godot battle pacing, 24 entry benchmarks, six direct routes and four trained journeys. 79,732 diagnostic checks/eight pages pass; direct teams stall or lose, trained league can win at 70; Deeptide no-ready-turn finding for Claude. Godot unchanged.
- 2026-10-09, Codex: T55 audit ready in PR #82: all clue groups fit checked against Evan's chosen account; Rysa/Classic chronology and watcher identity cautions, three shared late observation proposals. 56 reference checks and eight pages pass. Reveal waits for Claude review; no Godot edits.
- 2026-10-09 Claude: Evan chose Wildbond's final truth (recorded in the thread ledger; WB4.4b to ChatGPT). Godot Starfall SF2.3 the Tavern (pouring, Tamsin, shutting, placement bonuses), 116 checks, web preview rebuilt.
- 2026-10-09 Claude: merged T53 (finale handoff) and T54 (Champion returns); placed in Godot: the homecoming at the league gate and every Warden's welcome; 273 checks; browser Wildbond 2290; web preview rebuilt. Question for Evan: the final truth (docs/proposals/wildbond-final-reveals.md).
- 2026-10-09, Codex: T54 ready in PR #81, stacked after #80: leagueAfter and eight Warden byStory.leagueEnding arrays, 22 lines. 69 new checks, 101 source/export/staging/layout checks, 88 full-card previews and eight suites pass. Classic dispatch/Godot/versions untouched.

- 2026-10-09, Codex: T53/WB4.4a ready in PR #80 against main, including Claude's seasonal/festival and Starfall integrations: league script, optional homecoming and payoff/decision map. 271 checks, actual export, 148 portrait previews and eight suites pass; no Godot/runtime/version edits.

- 2026-10-09 Claude: Godot Wildbond WB4.1 the league built (Wren, four courts, Avenne, ending lines); the new Wildbond is playable start to finish; 269 checks; web preview rebuilt; card and Come Play updated. Next: WB4.2/4.3 ending staging (needs ChatGPT WB4.4 text), WB5.1 Spire, SF2.3 tavern.
- 2026-10-09 Claude: applied T52 to starfall-godot/data/stories.json (Kaito, Hana, Sora arcs; third beats for Aki, Ren, Yuna); 106 Starfall checks; web preview rebuilt.
- 2026-10-09 Claude: merged T50 (seasonal data), T51 (festival writing), T52 (Starfall arcs handoff). Godot Wildbond: seasonal wild tables, seasonal and festival lines, the four festival activities with keepsakes (WS3, WS5, WS6 done); 260 checks; browser Wildbond 2221; web preview rebuilt. Next: apply T52 to starfall-godot/data/stories.json, then WB4.1 the league.
- 2026-10-09, Codex: T52/SF2.4a writing ready in PR #79, stacked after #78: twelve additive member beats outside Godot. 640 schema/path checks, Godot font/wrapping measurements and eight browser suites pass; existing six beats untouched. Claude integrates.

- 2026-10-09, Codex: T51/WS6 ready in PR #78, stacked after #77: four traditions and keepsakes, 24 lines. 89 new checks, all eight suites, exact baseline preservation, actual export and 96 four-size portrait previews pass; no Godot, save or version changes.

- 2026-10-09, Codex: T50/WS3 ready in PR #77: 32 seasonal tables, four year-round visitors and 96 resident lines. 526 new checks, eight suites, actual export and 384 scene previews pass; baseline tables unchanged. No Godot, save or version edits.

- 2026-10-09 Claude: Godot Wildbond WS5 decorations for the four festivals in Larkhaven (lines, activity and keepsakes wait for ChatGPT's WS6); web preview rebuilt.
- 2026-10-09 Claude: Godot Wildbond WS1 calendar (scripts/calendar.gd) and WS2 four seasonal looks; date in the field book, C cycles calendar modes; 254 checks; web preview rebuilt. Next: WS4 winter weather or WS5 festivals (waiting on WS6 writing), WB4.1 the league.
- 2026-10-09 Claude: Godot Wildbond WB3.4 Farwatch Reach built: all eight areas now in Godot (245 checks, web preview rebuilt; card and Come Play updated). Next: WS1 the calendar and seasons, WB4.1 the league, SF2.3 the tavern.
- 2026-10-09 Claude: Godot Wildbond WB3.3 Sunthread Commons built (meeting hall, forecourt, mending frame, braids, nursery beds, Sunny tune), 239 checks, web preview rebuilt; card and Come Play say seven regions. Next: WB3.4 Farwatch (brief ready), then WS1 the calendar.
- 2026-10-09 Claude: merged T48 (Realmbound walkable road, released as Realmbound v1.8.0, 8441 checks pass) and T49 (Sunthread and Farwatch briefs).
- 2026-10-09, Codex: T49 Sunthread/Farwatch build briefs ready on codex/wildbond-final-area-briefs for Claude: complete current data, clues and staging; Halen/Rysa stale lore levels flagged. 73 live export/path checks and eight pages pass; no Godot/data/version edits.

- 2026-10-09 Claude: Evan asked for four seasons and holiday decorations. Plan in docs/proposals/seasons-and-holidays.md (own calendar plus a real-calendar setting, four looks, seasonal creatures, a festival each season, Midwinter Hearth in December); path WB-S (WS1-WS6) and SF3.4.
- 2026-10-09, Codex: T48/RB1.3 built on codex/realmbound-road-places: optional inn/camp approach with physical paths, portrait scenes and normal rest/travel. Eight pages pass; phone through ultrawide checks and frames recorded. PR for Claude; no Godot or versions.


- 2026-10-09 Claude: Godot Wildbond WB2.2 part 2: tall trees with crowns in front of you (canopy layer and shader), never over signs or items; --stand=x,y picture flag; 234 checks; web preview rebuilt.
- 2026-10-09 Claude: Godot Starfall SF2.2 failing and excelling (day judged at nightfall, people leave and return, bunting, board size, two travellers); 104 checks; web preview rebuilt. Fixed a 5%-flaky herbs check.
- 2026-10-09 Claude: merged T46 (launcher previews) and T47 (Hollowecho brief). Godot Wildbond: Hollowecho Hills built (WB3.2: bell house, bells, survey cord, cave mouths, mist, Quiet tune), 232 checks; web preview rebuilt; arcade card and Come Play say six regions. Next: WB3.3 Sunthread (waiting for its brief), SF2.2, WB2.2 canopies.
- 2026-10-09, ChatGPT: T47 Hollowecho area brief ready on codex/wildbond-hollowecho-brief: source coordinates, encounters, all T40 clues/payoffs and staging checklist. Live inventory and all eight pages pass; flagged Senna lore/data discrepancy, no new canon or Godot edits.
- 2026-10-09, ChatGPT: T46 launcher previews, PR #73, now against main after #71 merged. Real screenshots, separate Classic journeys, focus-safe road; 174 launcher and 164 accessibility checks plus all eight pages pass. No Godot, exports, worker or version edits.

- 2026-10-09 Claude: Godot Wildbond: Stillreed Basin opened (WB3.1: footbridges, moored skiff and readable mooring sign, trainers, Warden, river ambience, Boat music); web preview rebuilt; 225 checks. Also its own touches (current, cattails, orchard windfall, rope coil, dragonflies). Next: WB3.2 Hollow Echo, WB2.2-2.4 depth items, SF2.2.
- 2026-10-08 Codex: T45 ready in PR #72: 60 early-road heritage reactions for 11 people and four Wardens, every clue recorded. Eight pages pass (Wildbond 1,606); actual 39-table export carries all reactions and retains existing content exactly. No Godot, screen, save or version changes. T44 is ready separately in #71.
- 2026-10-08 Codex: T44 ready in PR #71 after #70/#67: focused dialogue decisions, Settings isolation, named Realmbound paths, reading sizes and Otherworld status controls. Eight pages and 164 Chrome checks at four widths pass; docs/accessibility.md records remaining gaps. No Godot or version changes.

- 2026-10-08 Claude (night, late): DEVELOPMENT-PATH.md (the whole path, ticket factory) and COMMS.md (message board with ChatGPT, working).
  Godot: tamer orders, Maren's letters, depth fix, battle effects, ambience, the inn and shop as rooms (218 checks); Starfall members' stories (96).
  Local helper: primer, lessons, benchmark (Qwen3-Coder 80%, gpt-oss 40%), model now arcade-coder-32k. Merged ChatGPT PR #66.
- 2026-10-08 Codex: local runner follow-up PR #68 preserves wildcard-first runtime permission order; 19 parser/policy checks pass. Installed without restarting Claude's benchmark/model runs. T41 remains separately ready in PR #67; no game/version/Godot changes in #68.
- 2026-10-08 Codex: T42 ready in PR #69: practical uses for all eleven memories, six authored wants/debts, repairs and Return defaults; 1,895 Otherworld checks and all eight pages pass. Actual choices/rebirth checked at four sizes with screenshots; no game version or Godot changes.

- 2026-10-08 Codex: T43 ready in PR #70, stacked after T41/PR #67: all 48 zone/dungeon beasts show shared species and hunter observations; generated catalogue checked against Wildbond. All eight pages pass (Realmbound 8,205), four-size before/after pictures; old pets, combat and Godot unchanged.

- 2026-10-08 Codex: T41 ready in PR #67: walk-in Trainer/Stable, physical Guild board/chest/member conversations, all quest givers placed and Journal routes to them. All eight pages pass (Realmbound 8,029); real purchases/jobs/quest rewards and exact reload at all four widths. Old saves, prices and Godot/version files preserved; Claude merged D0 separately in PR #66.

- 2026-10-08 Codex: D0 queue runner ready in PR #66: OpenCode with local Ollama, Claude's primer/lessons attached, selectable model, strict error/completion handling. Nine runner regressions and actual read-only queue lookup pass; all eight browser pages pass. Broader model audit remains unapproved; no game/Godot/version changes.

- 2026-10-08 Claude (late night): task lists rewritten around everything learned (PROJECTS "Read first", QUEUE goal, START-HERE). Merged
  ChatGPT's seven stacked PRs (T36-T40, the Ashen Throne, its plan sync): Diamond Career v0.4.0, Realmbound v1.6.0, Otherworld v0.3.0,
  Wildbond v1.8.0; all eight pages pass (Realmbound 7738, Wildbond 1530, Otherworld 1757). Lane A refilled (T41-T44). Tested the local
  AI helper (fast, unreliable judgement; Lane D for small checkable jobs). Evan's PC cleanup worked: 871 GB free.

- 2026-10-08 Claude (night): Evan approved the downloads: Godot export templates installed, ffmpeg in C:\Users\evanb\Tools. Web previews
  of the new Wildbond and Starfall live at play/ (linked from Come Play), Windows zips in Desktop\Game builds, a 56-second trailer
  (images/play/trailer.mp4, on the Come Play page; tools/trailer). Merged ChatGPT PR #57 and #58 (Otherworld v0.2.0).
- 2026-10-08 Claude (evening): Come Play page for friends (playtest.html), stat-bar yardstick (Wildbond v1.7.1 and Godot), Starfall detail
- 2026-10-08 · Codex: OW0c ready in PR #65, stacked on #64: Otherworld's Ashen Throne, Kael, three costly gifts, six end nodes and cross-world memories. All eight browser pages pass; actual outcomes and Return death/reload at four sizes. No Godot/version changes.

- 2026-10-08 · Codex: T40 ready in PR #64, stacked on #63: four later-road witnesses, signs/Warden clues and badge payoffs, with all 16 heritage reactions exported as data. Ledger records every placement; all eight pages pass (Wildbond 1,530); walk-up conversations/export checked at four widths. Claude still owns Godot dispatch/export; Lane A has no further open build ticket.

- 2026-10-08 · Codex: T39 ready in PR #63, stacked on #62: Hearthmere complete life, four endings, each gift cost once, visible winter consequences and cross-world knowledge. All eight pages pass (Otherworld 1,691); actual gift/ending/reload flows at four widths. No Godot/version changes.

- 2026-10-08 · Codex: T38 ready in PR #62, stacked on recovered plan #61: full-window Realmbound, Quest Journal and Satchel overlays, map/road/battle record and all existing pages reachable. Reading pauses combat and town Auto; 25 new scenarios, all eight pages pass, actual equipment/quest/Smithy/reload at four widths. No Godot/version changes.

- 2026-10-08 · Codex: recovered Claude's four uncommitted planning files read-only into PR #61; preserved his new Godot/browser direction and T38-T40 tickets, reconciled T36/T37 ready status. Claude's checkout remains untouched.
- 2026-10-08 · Codex: T37 ready in PR #60 (stacked on #59): fourteen species, three growth lines, Saillet conditional handoff and all 31 Reach beasts mapped. All eight pages pass; Wildbond 1,485; actual Wilddex at four widths. Claude must export and merge Saillet options into Godot; no screen/Godot/version changes. Lane A has no further open build ticket.
- 2026-10-08 · Codex: T36 ready in PR #59: Diamond Career fills the window with objects for career records and a second month at three away parks; deliberate bus choices, no signing windfall, exact calendar pay. All eight pages pass (Diamond 122), real UI and reload at all four widths; no Godot or version overlap.
- 2026-10-08 · Codex: T35 ready in PR #58: Lanthorn's food/fear shown through the square and its people; visible locked choices, all gift costs, recoverable relief-flour choice and Archivist memory responses. All eight pages pass (Otherworld 831); actual Mira ending, reload and controls checked at all four widths. No Godot or version overlap.

  of the new Wildbond and Starfall live at play/ (linked from Come Play), Windows zips in Desktop\Game builds, a 56-second trailer
  (images/play/trailer.mp4, on the Come Play page; tools/trailer). Merged ChatGPT PR #57 and #58 (Otherworld v0.2.0).
- 2026-10-08 Claude (evening): Come Play page for friends (playtest.html), stat-bar yardstick (Wildbond v1.7.1 and Godot), Starfall detail
  (finished buildings settle in), Godot Wildbond music per place, partner stands beside you. Plan: docs/proposals/showing-the-games.md
  (Godot demos need export templates: waiting on Evan). Card shop idea parked (CS1).
- 2026-10-08 Claude (later, 2): Wildbond Godot creature gear: Maren's workbench, seven pieces that each do one thing and show on the
  creature (walking, ranch, battle, page); 195 checks. Next in Claude's Godot lane: tamer abilities with heritages, then Stillreed Basin.
- 2026-10-08 · Codex: T35 ready in PR #58: Lanthorn's food/fear shown through the square and its people; visible locked choices, all gift costs, recoverable relief-flour choice and Archivist memory responses. All eight pages pass (Otherworld 831); actual Mira ending, reload and controls checked at all four widths. No Godot or version overlap.

- 2026-10-08 · Codex: PR #57 guide refresh: illustrated rooms and commissions, generated costs, corrected equipment advice. All eight test pages pass; static guide checks pass at phone, laptop, desktop and ultrawide widths.

- 2026-10-08 Claude (later): Diamond Career v0.3.1 (Evan couldn't see the pitch: field cleared mid-throw, tap to swing, a circle at the plate). Starfall
  Godot slice 3: the Smithy (three strikes on the anvil, Garrick takes over after five pieces), the Apothecary (brew tonics, set the
  price), plots unlock with rank, adventurers save their share; 85 checks. ChatGPT reset: Lane A refilled with T35-T37.
- 2026-10-08 Claude (late): merged ChatGPT's PR #56 (Otherworld test runner restores recovery backups; tests only; otherworld 38 and the new
  runner-safety page 35 pass). ChatGPT is out of usage for the week, so Claude carries both lanes. Wildbond Godot: the barn trough and the
  Nursery (breeding pairs, an egg that hatches as you walk), people stand beside you, 183 checks. Evan's idea recorded as a proposal:
  docs/proposals/depth-and-first-person.md (a world that knows where things are; the fading took depth too; first person one day).

- 2026-10-08 · Codex: A8 save-safety follow-up ready in PR #56, stacked on #55: Otherworld runner now restores its save/hub recovery backups even on failure, prevents overlapping runs, and leaves other games untouched. All eight pages pass (35 runner-safety checks); regression catches old runner, four widths checked. Tests only; no Godot overlap.

- 2026-10-08 · Codex: R5 ready in PR #55: deterministic level-55 rare gear from guild ore/herbs, commissioned in Smithy portrait scenes. All seven browser pages pass (Realmbound 7729); real purchase/cancel/locked flows checked at all four widths, old saves and shared-bank safety covered; no version bumps.
- 2026-10-08 Claude (night, continued): Wildbond Godot heritages: a Family line in Maren's register (farmfolk, coastfolk,
  highlanders, wanderers), each a small bonding/exploring gift and its own tale of the fading told at signing (clues in
  docs/lore/wildbond-threads.md thread 5), recognition by Pip and Tobin, arrival memories; 173 checks. Also organised Evan's
  PC on request (outside the repo; plan in his Desktop\PC Cleanup).

- 2026-10-08 Claude (night, continued): merged ChatGPT's R6 (Realmbound v1.4.0, regional town layouts, walk-in inns and smithies;
  7370 checks). Wildbond Godot: evolution with shapes and conditions (data/evolution.json; Pyremane by place, Deeptide by trust,
  Elderthorn with a companion, Poolkit's three-way branch; you're asked, Not yet waits a level; hints in the field book); creatures
  in the way step aside (the pup no longer blocks the paddock gate); 165 checks. Next (B2b): heritages at the register, the trough.

- 2026-10-08 Claude (night, continued): merged ChatGPT's guide CRLF fix and Hearth Book capitals (kept the world's-words story text over
  its numbered version). Wildbond Godot: Cloudglass Pass (cold stone, drifting cloud, Ilka, Teodor, Warden Vessa; 151 checks).
  Starfall Godot slice 2: plots with Hob's plans, the Healer's Hut (Ama; hurt adventurers mend twice as fast), a Training Yard,
  the town's rank (Hamlet, Village, Town) bringing newcomers through the gate; 51 checks.

- 2026-10-08 Claude (night, later): Starfall's village begun in Godot (starfall-godot/, Play Starfall.bat): the town (Guild Hall,
  Lantern Inn and its counter, the guild board, the east gate), three adventurers who choose posted jobs by level and nerve, come home
  hurt (never killed), eat at the counter you run by hand, rest at the inn; Bryn takes the counter after ten meals for daily
  wages; a short end-of-day report. 33 checks. Next: building on plots, the healer, the town's rank.

- 2026-10-08 · Codex: R6 ready in PR #54: eight regional hub layouts, walk-in Inn and Smithy conversations, intact Auto routes; all seven browser suites pass (Realmbound 7386), phone/laptop/desktop/ultrawide checked. Continuing R5; no version bumps.

- 2026-10-08 Claude (night): merged ChatGPT's PR #52 (illustrated guides) and #53 (guild story choices that can hurt trust, with amends);
  rewrote their player-facing text in the world's words (no mood numbers or gates), Realmbound v1.3.0, 6935 checks pass. Lifted the
  two-PR limit (Evan). Starting Starfall's village in Godot (starfall-godot/).

- 2026-10-08 · Codex: R4 follow-up ready in PR #53, stacked on guide PR #52; ten warned guild choices, portrait consequences and recoverable trust. All seven test pages pass (Realmbound 6935); no versions bumped. Two PRs await review.

- 2026-10-08 · Codex: A6b illustrated guides and Realmbound tips ready in PR #52; all seven test pages pass. Wildbond guide waits for Godot.
- 2026-10-08 Claude (night): rules for player-facing text (docs/CREATIVE.md, Writing for players; Realmbound Guild Hall title fixed).
  Godot: Maren's ranch as a place: creatures not on your team live in the paddock (four) and the barn; walk up or tap one to see
  its page and Take along / Swap in (choose who rests); the lead creature walks with you. 143 Godot checks. Next (B2b):
  Cloudglass Pass; then the trough, breeding stall and Maren's letter; then evolution shapes.

- **2026-10-08 (Codex):** W11 batch 1 ready in PR #51: twelve definitions, ten missing pairs, two evolution lines, strong single-form Hearthlaugh and proposed cross-world habitat manifest. Seven pages pass (Wildbond 1354); actual Godot export includes all 93 species. Evan requested this extra piece while #49/#50 await review; no merges, versions or Godot edits. docs/wildbond-roster-batch1.md records availability and checks.

- 2026-10-08 Claude (evening, with Evan on his phone): Gemini reports for Diamond Career, Otherworld and the walk-in arcade saved and
  reviewed against the code (docs/research/*-review.md; queued D1c, O1, V11 later). Evan's direction: everything in the game window for
  every game; fleshed-out games likely move to Godot; budget not a guardrail; AI tools allowed; guides and wiki. Approved: Wildbond
  heritages. Planned: one creature catalogue, evolution shapes and conditions, creature gear, tamer abilities and the wild bond
  (docs/proposals/creature-catalogue-and-evolution.md). Tonight: Evan installs Godot export templates; then the first shareable build.

- **2026-10-08 (Codex):** A5b D1c ready in PR #50, stacked on #49: explicit field swing choices, honest results and Iona's Eye lesson (docs/diamond-swings.md). Seven test pages pass (Diamond 102, Realmbound 6683). Two PRs await Claude; no merges or version bumps.

- 2026-10-08 (Codex): A5/R4 guild member stories ready in PR #49 on codex/realmbound-member-stories: all 32 adventurers have three moments, shared-time/mood gates and two remembered outcomes. All seven pages pass (RB 6,683); 375/1366/1920/3440 UI checked. World portrait conversations in the hall, with the Guild tab only a record. Saves and favors preserved; no merge/version bump. Next Lane A: A5b Diamond swings you understand.

- 2026-10-08 Claude (PC session, later): Godot trial: the Emberfall Highlands (cliff road from the coast with the Tide Badge; layered
  cliffs, meadow boulders, amber hot springs with steam, drifting sparks; Orsk, Sela, Warden Toren; battles with a highland skyline).
  Fixed a battle crash when a foe chose a support move (no power value). 133 Godot checks. Next (B2b): the ranch as a place, then
  Cloudglass Pass; the Godot build for friends once Evan installs export templates.

- 2026-10-08 Claude (from Evan's phone, PC session): merged ChatGPT's PR #47 Realmbound onboarding (v1.1.0: arrival scene on the first
  questgiver, optional road guidance) and PR #48 Diamond Career's second contract and first month (v0.2.0). All seven pages pass:
  Realmbound 4407, Diamond 83, Wildbond 1254, Starfall 48, sound 21, offline 15, Otherworld 38. ChatGPT next: A5 R4 guild stories.

- 2026-10-08 Codex: Lane A4 Realmbound onboarding ready in PR #47: existing first request, optional Focus/loot/reward/town/companion guidance, safe legacy defaults and paused arrival replay. All seven pages pass (Realmbound 4407); phone through ultrawide controls/save reload checked. No version/cache bump or merge; Claude's Godot files untouched.

- 2026-10-08 Codex: Lane A4b Diamond Career second contract/30-day first month ready in PR #48 (83 Diamond checks; all seven pages pass), legacy salary IDs preserved, phone through ultrawide checked. Independent Realmbound onboarding is ready in PR #47. Two PRs await Claude; no further Lane A implementation started, no version/cache bumps or merges. Read-only phone/PC Claude test prompt: docs/claude-pc-connection-test.md.

- 2026-10-08 Claude (day): merged ChatGPT's T34 Diamond Career (56 checks pass; on the shelf and the road) and its
  Starfall research review. Queue: ChatGPT next A4 Realmbound onboarding (from the first-hour review), then Diamond Career
  part 2. Godot trial: Larkhaven shop + inn + Pip, the field book (Wilddex + team, J), story moments while exploring
  (Wren rematches, Elderhorn, Breakwatermane), Saltmarsh Coast with Warden Nerys, level caps from badges; 122 checks.
  Next for Claude (B2b): Emberfall Highlands (new tiles), the ranch as a place, then the Godot build for friends once Evan
  installs export templates.
- 2026-10-08 Codex: T34 Diamond Career first call-up/payday prototype (merged by Claude 2026-10-08, 56 checks). Both batting styles, six-game careers, contracts, home/garage, 56 Diamond checks and all six existing pages pass; keyboard/touch, saves and phone/desktop/ultrawide played. No existing version or cache bump. Integrated latest main, preserving Claude's Godot work; Starfall report/prompt cleanup is a separate documentation task.
- 2026-10-08 Codex: Evan's Starfall report preserved and reviewed against existing aggregate combat, Inn recovery and automatic Hall selection; answered prompts archived, one active Gemini queue for Diamond Career/Otherworld/arcade/optional Primordial. Documentation in PR #46; no gameplay changes. T34 is separately ready in PR #45, all seven test pages pass; two PRs now await Claude, so no next Lane A implementation is started.

- 2026-10-08 Claude (overnight, continued): Godot trial, Thornwood playable from the exported data: roads between maps,
  tall grass + water + items, exploring like the browser (62% wild creature), Bond (lure + calm meter, browser catch
  formula), Bag berries, catches restore colour, team of three + ranch, Bram/Lise spot and battle, Warden Isolde and the
  Thorn Badge open the gate, signs, Maren heals, body plans for all ten families (81 creatures), save/load with a
  Continue page, --skip-opening for testing; 98 Godot checks. Next (B2b): Larkhaven's shop and inn as places (lures for
  coins), the Wilddex book, then Saltmarsh Coast from the data.
- 2026-10-08 Claude (overnight, Evan asleep): Godot trial: the partner choice in Maren's barn (full-screen barn, three
  starters with their own bodies and habits, Wilddex pages, Choose / Not yet, colour floods out of the barn), Wren and
  the first battle (classic layout, turn order, orders, results); rules.gd translated and checked against the browser;
  data bridge tools/godot-export.ps1 (Edge, no installs); click/tap to walk; a launcher that finds Godot anywhere; web
  and Windows export presets + tools/godot-build.ps1; 64 Godot checks; docs/godot-port-plan.md answers Evan's questions.
  Measured the first battle (battle_odds.gd): Cindercub won 5 in 100 -> Wildbond v1.6.1 (element moves at level 5:
  97/78/100); browser checks 1254 pass. Next: Evan installs export templates; then Route 1 in Godot (B2b).
- 2026-10-08 Claude: Godot trial: the cub (parts-based creature in scripts/figures.gd: trot, wag, sniff, sit, pounce at a
  butterfly, watches you when you come near) and Maren's ranch register, the character creator (scripts/register.gd:
  name, body, skin, hair, clothes; signing paints you in colour onto your own layer). Fixed after Evan's look: cabins
  were cut off (they are 4 tiles wide), register values now centred. Next: choosing your partner in Maren's barn.
- 2026-10-08 Claude: Godot trial environment now uses the Ninja Adventure CC0 tilesets (grass, dirt paths with edges,
  flowers, garden bushes, cottages, a staggered woods border; scripts/main.gd _draw_ground and _draw_structures; files in
  wildbond-godot/assets/env/). Our figures, fences and sign stay code-drawn. Fan-made Pokemon sprites ruled out
  (Nintendo's characters; docs/wildbond-plan.md). Next: the cub's animation, the character creator, the partner choice.
- 2026-10-08 Claude: Godot trial figures rebuilt from parts (draw_person, LOOKS in scripts/main.gd): head, hair style,  body, apron, swinging arms, legs or a skirt, 4-frame walk in four directions, blinking, idle glances, a dark  outline; the parts system is the basis for the character creator and a later 3D rig. Next: the environment  (Evan liked the pack's structures; pieces kept as separate objects with footprints so they can stand up in 3D).
- 2026-10-08 Claude: Evan rejected the Ninja Adventure look (chibi, no visible legs; preferred our code-drawn figures).  Reverted the Godot trial to the code-drawn tamer, Maren and cub; removed the pack's files from the project. Art  direction recorded in docs/wildbond-plan.md: real proportions with legs, our own art. (The test window that raced  through the opening was the sped-up recording, not the game's real pace.)
- 2026-10-08 Claude: downloaded Ninja Adventure (CC0, 94 MB zip in Evan's Downloads; unzipped to  C:UsersevanbGodotNinjaAdventure; only used files copied into wildbond-godot/assets/ninja). The Godot trial's  tamer, Maren and the cub are now real 4-way animated sprites. Next: the map from the pack's tilesets. Own original  art is the long-term goal (Evan).
- 2026-10-08 Claude: Evan's worries recorded: sports need no physics engine (stats model + readable moments, T34 as  written); Otherworld must not be predetermined: systemic world first, an AI storyteller layer as an experiment  (docs/otherworld-design.md). Asked Evan to approve downloading a CC0 sprite pack for Wildbond's Godot art.
- 2026-10-08 Claude: Otherworld v0.1.0 built in games/otherworld/ (data in 00-data.js: CAST, WORLDS, GIFTS, MEMORIES,  ENDINGS, NODES, EPILOGUES; engine 01-game.js; scenes 02-scene.js): the Between, world and gift choice, name and look,  Asterhold's full life (status window, Mira, 3 branching choices, 8 endings), soul memories and rebirth both ways.  tests/otherworld.html walks every path for every gift and memory set (38 checks). Hub v1.4.0 (portal on the road).
- 2026-10-08 Claude: Evan unparked Diamond Career and Otherworld (answers in docs/research/decisions.md). T34 for  ChatGPT (Diamond Career part 1, games/diamond-career/); docs/otherworld-design.md (choose your world from a list:  Asterhold, Hearthmere, the Ashen Throne; gifts with costs; rebirth by choice and on death); Claude builds O0.
- 2026-10-07 Codex: preserved Evan's Gemini Realmbound report and three source panels in docs/research/; realmbound-first-hour-review.md separates useful companion/UX lessons from incorrect Godot/creature-game/full-Auto assumptions and proposes current-game onboarding tests. Integrated main a2ddc69, preserving Claude's trial fixes. Research only; no gameplay/installs/merges into main, PR #44.

- 2026-10-08 Claude: merged ChatGPT's branch: Wildbond creature variants (T33: Gleaming, tiny/huge, markings; cosmetic;  js/19-variants.js) -> Wildbond v1.6.0, the Realmbound field guide (guides/realmbound.html), and research: its careful  review of Gemini's Godot report (docs/research/godot-production-slice-review.md: keep/try/defer/reject) and Evan's  direction (docs/research/owner-direction-2026-10-07.md: ~US$200 cash ceiling, platforms open, automation serves play).  Godot trial: vertex snapping off (transform snapping only, per Godot docs). Wildbond 1254, Realmbound 4173, offline 15.
- 2026-10-08 Claude: Evan played the Godot trial: "this feels much better". Fixed his notes (Maren off the gate,  fences join vertically, four-way facing with walk frames and idle breathing, cub tail wag and trot). His animation  bar ("better than the first Pokémon") needs real sprite art: docs/wildbond-plan.md "Art and animation".
- 2026-10-07 Codex: saved Evan's supplied Gemini Godot report verbatim as docs/research/godot-production-slice.md; review beside it fact-checks snapping, MSDF, saves and web constraints, rejects invented stamina/chemistry requirements and unsupported schedule. Research only, PR #44; no trial edits, installs or plan adoption.

- 2026-10-07 Codex: recorded Evan's clarified direction in docs/research/owner-direction-2026-10-07.md: open platform choice, approximate US$200 total cash budget, earned help for tedium rather than universal full Auto; Otherworld/Diamond remain in design discussions. Updated the old control contract in docs/plans/README.md to prevent conflicting instructions. Documentation only, PR #44.

- 2026-10-07 Codex: Evan confirmed Godot production research is running in Gemini and requested research for the other games. Added docs/research/first-play-research-pack.md with full Realmbound/Starfall/arcade prompts, parked-game briefs and a newcomer completion gate. Research only; no gameplay/Claude files changed; PR #44.

- 2026-10-07 Codex: reviewed Gemini's creature research and the Godot trial at Evan's request; docs/research/codex-godot-assessment.md adds priorities and migration cautions, gemini-godot-production-prompt.md asks for art/animation and safe-port research. Installed Godot 4.7.2 verified; short headless startup passed. No trial/plan/gameplay changes; documents in PR #44.

- 2026-10-07 Codex: at Evan's request, left Godot and Wildbond to Claude. Lane A8 Realmbound opening audit added to PR #44: four isolated browser diagnostics and an L4/V1 implementation brief in docs/realmbound-first-ten-minutes.md; corrected the guide's Focus fallback explanation. Documentation only; no gameplay, versions or merge.

- 2026-10-07 Codex: T8 Realmbound guide ready in PR #44, stacked on T33 #43; static 2800-word lore/booklet, generated references and hub card link. All five pages pass (1254/4173/48/21/15), phone through ultrawide, links/spoilers/save safety checked. T32 scope conflict documented in docs/proposals/wildbond-area-air.md; no partial lighting shipped. Two PRs await review; no version/cache bump or merge.

- 2026-10-07 Codex: T33/W14 variants ready in PR #43 (codex/wildbond-variants): Gleaming, tiny/huge and seeded markings, cosmetic only; egg inheritance, old-save defaults, Wilddex records and all-era art. All five pages pass (1254/4173/48/21/15), saves/hub restored, phone through ultrawide and actual Diorama checked. Small label/drawing adapters only; no restyle, version/cache bump or merge. Continuing Lane A.

- 2026-10-07 Claude: Evan installed Godot 4.7.2 (unzipped to C:\Users\evanb\Godot). Built the trial in wildbond-godot/  (README there): faded Larkhaven on the real map at 384x216 with integer scaling, Maren walks up and speaks in  bubbles, the first bond floods colour back (fade.gdshader), the partner follows. Verified headless and with recorded  frames. Waiting for Evan to play it (Play Wildbond trial.bat) before deciding browser vs standalone.
- 2026-10-07 Claude: saved Gemini's research (docs/research/creature-games-ux.md) and mapped its lessons onto  docs/wildbond-plan.md phases. Evan is considering a standalone game: options and a recommendation (Godot, small  trial first) are Question 1 in Questions for Evan; the screen rebuild waits for his answer.
- 2026-10-07 Claude: rewrote the plans from Evan's play notes: docs/wildbond-plan.md (one plan, principles + phases  1-7), queue lanes A and B rewritten, CLAUDE.md "Where we are" rewritten, T33 creature variants ticket for ChatGPT.
- 2026-10-07 Claude: merged ChatGPT's launch balance (Wildbond L7a: Stillreed 46+, later Wardens within caps; Realmbound  L7b: late-zone xpMult .6 from level 40). Wildbond v1.5.2: DAY_SECONDS 3600, AUTOPILOT=false (Auto-explore off).  Recorded Evan's notes: characters present in the intro (B3b), W13 character creator, W14 creature variants, V10 big  worlds/first person. Wildbond 1225, Realmbound 4173 checks.
- 2026-10-07 Claude: Wildbond v1.5.1 (results wait for Continue, visible tamer, close view, softer fade, ranch/breeding/  pennants appear with the story: `ranchOpen`, `breedOn`). Evan wants Wildbond to be all game world: plan in  docs/wildbond-immersive.md, queued as B3a (Claude, top priority). 1214 checks.
- 2026-10-07 Codex: L7b/R8 Realmbound audit ready in PR #42, stacked on #41. Fifteen actual-combat class/journey runs complete story and both Heroic 1 clears; proposed late-zone 0.6 XP budget gives Classic 40–60 19.91–23.77h. All five pages pass (4173/1225/48/21/15), saves/hub restored; no version/cache bumps or merge. Two audit PRs await Claude.

- 2026-10-07 Codex: L7a/W8 Wildbond pacing audit in PR #41 (codex/wildbond-launch-balance): 15-case before/after simulations, smoother Stillreed entry, cap-aligned late Wardens, 11 new regression checks. All five browser pages pass (4150/1213/48/21/15), saves/hub restored. Failed Nuzlocke starts are distinguished from second-chance completions; no version/cache changes or merge. Next: Lane A3 Realmbound pacing.


- 2026-10-07 Claude: Wildbond v1.5.0 from Evan's second play notes: turn-based battles (`S.battleStyle`, `B.wait`,  `chooseTurn`, `moveInfo`), autopilot earned at the first badge (`autoEarned`; fixed lastInput -99 bug), new  journeys start in faded colour (`S.faded`, body.faded filter; Thorn lifts it), panel menu buttons removed (walk;  `fastTravel` at the Ember Badge, `S.visited`), roles and stat help on cards (`roleOf`, `STAT_HELP`). 1214 checks.
- 2026-10-07 Claude: Evan's first Wildbond play notes -> v1.4.0: start screen picks then confirms (`START.pick`,  `starterCard`, Begin), story names + random, challenge modes unlock at Champion (`modesUnlocked`, localStorage  wildbond-modes-unlocked), Maren's Wilddex goal lines, fixed a missing comma that swallowed two intro lines.  docs/wildbond-opening.md has his notes, the premise and part 2 (queue B3b). Wildbond 1209 checks.
- 2026-10-07 Claude: vision V9 (choices that matter, Mass Effect). L3 phone pass part 1: shared/settings.js adds 40px  tap targets on phones/touch (audit at 375px: Wildbond 13, Realmbound 27, Starfall 15 small targets -> 0); launcher  starts phones on the road. Tests pass (Wildbond 1202, Realmbound 4150, Starfall 48).
- 2026-10-07 Claude: votes confirmed working (first response in Evan's form). Wrote docs/VISION.md from Evan's  brainstorm (prologues, too-retro worry, game boxes, procedural content, bot world, friends, nodes, automation as QoL)  and projects V1-V8; CLAUDE.md, CREATIVE.md ("old soul, modern craft") and AGENTS.md point to it; queue A5 now  includes prologues, B4b game boxes.
- 2026-10-07 Claude: votes connected to Evan's Google Form (shared/votes-config.js; a Pages build was skipped, re-pushed).  L8 part 2, the road (launcher/launcher.js `road()`, STOPS = the four games + building sites for games in design),  from Evan's feedback (hall scales better, likes a character). Poll is now `launcher-style-2`. Hub v1.3.0.
- 2026-10-07 Claude: L8 part 1: launcher/launcher.js (the living world on the real clock, ?time=dawn|day|dusk|night  to preview; the arcade hall with walkable cabinets), shared/votes.js + votes-config.js (Google Form, empty until  Evan sets it up: docs/VOTES.md), poll `launcher-style-1` on the hub. Hub v1.2.0, fresher game blurbs.
- 2026-10-07 Claude: merged R9 heroic loot review (ChatGPT, +2613 Realmbound checks) and Saltmarsh follow-up notes;  L1 settings (Lane B2): shared/settings.js (loads right after engine.js; text size via --arc-text in each style.css,  motion by answering matchMedia's reduced-motion query) and per-game rows in wildbond 18-settings.js, realmbound  25-settings.js, starfall 10-settings.js. Wildbond 1202, Realmbound 4150, Starfall 48, offline 15. Next: B3 launcher.
- 2026-10-07 Claude: L2 save safety (Lane B1): shared/engine.js keeps automatic backups (arcade-backup:<key>:auto-recent  and auto-day-<date>, Studio format), load() recovers from them, `Arcade.saveToolsHTML(KEY)` box in all three games,  `Arcade.validators`; GM pruning skips auto backups; test runners restore backup keys. Wildbond 1199, Realmbound 1537,  Starfall 48, sound 21.
- 2026-10-07 Claude: decided with Evan: the next phase is **Launch** (both games content complete, not launch ready).  docs/QUEUE.md now leads with the launch checklist; Lane A: T32, then bug bash and balance (both games), guides and  lore pages (T8 unparked), onboarding; Lane B: save safety, settings, the arcade launcher, phone, accessibility.  Both games become 2.0 at Launch; a new game only after (docs/research/decisions.md).
- 2026-10-07 Codex: Lane A2/R9 Heroic loot review ready in PR #40 (`codex/realmbound-heroic-review`). Rootrot/Heartwood already match the shared ladder and seven-drop budget; no balance, version or cache changes. All five pages pass (Realmbound 4150, Wildbond 1194, Starfall 48, sound 21, offline 15), saves/hub restored. Review measurements in docs/realmbound-heroic-review.md.

- 2026-10-07 Claude: docs/QUEUE.md, the autopilot work queue: a lane per assistant (A Codex, B Claude, C Grok/other),  the loop (claim, build, PR, next; max two open PRs), and rules that avoid conflicts (Claude bumps versions and edits  START-HERE's status sections at merge).
- 2026-10-07 Claude: G2 for every Realmbound zone (23-light.js `ZONE_LIGHT`: per-zone `night` colour, bounce, grade,  shafts, fogTop; 20-ambience.js `ambFront` holds the visual dark to 30% while the sun is up, fixing grey sunsets;  towns use the zone night). Realmbound v1.0.2, 1537 checks. **Next for Claude:** G2 dungeons, or W3 part 2 (roaming  legendaries); review T32 when ChatGPT finishes.
- 2026-10-07 Codex: integrated main b9d526b into `codex/wildbond-saltmarsh-light` after Claude merged PR #38 during validation. Preserved T32 and online-first offline code unchanged. All five pages pass: Wildbond 1194, Realmbound 1534, Starfall 48, sound 21, offline 15; saves/hub restored. Follow-up contains refreshed screenshots, validation notes and a v1.3.1 tester route only. No Codex merge into main.


- 2026-10-07 Claude: merged G2 Saltmarsh lighting (ChatGPT; Wildbond v1.3.1, 1194 checks); wrote T32 (lighting for  every other Wildbond area, `codex/wildbond-area-light`) for ChatGPT. **Next for Claude:** G2 for Realmbound zones and  dungeons (not Frostmere), or W3 part 2 (roaming legendaries).
- 2026-10-07 Claude: merged six ChatGPT branches: T31 post-game (Spire + league rematches, v1.3.0), W7 ferry landing,
  G2 Frostmere lighting, F4 playtest notes, L6 credits, L5 offline. **Changed L5 to online first** (sw.js: network
  first with a 4 s fallback to the kept copy, no `CACHE_VERSION` bumps, takes over at once; docs/offline.md says why).
  Hub header combines What to try, Credits and Install. playtest.html gained a v1.3.0 Wildbond route. All pass:
  Wildbond 1176, Realmbound 1534, Starfall 48, sound 21, offline 15. The browser pane can't run service workers, so
  the live install is unchecked: on the site, the hub should say "Ready for offline play".
- 2026-10-07 Codex: T31/W3 part 1 complete on `codex/wildbond-postgame` (PR #37), awaiting review, no merge. Wildbond v1.3.0; Spire, safe persistent rewards/eggs, daily league rematches. All four browser pages pass; real 30-floor command-driven max-level climb completed, all five art styles (including actual 3D) and four screen sizes checked. Preserved Claude’s wider view/feedback keyboard changes. Next: review pending PRs; W3 roaming legendaries remains open.

- 2026-10-07 Claude: Wildbond view distance (L11: `VIEWS`, `viewMult()`, `cycleView()` in 06-scene.js; header button
  and V key; `S.view` optional, no `fresh()` change so T31 merges cleanly); feedback menu keys no longer walk. 1123
  checks. **Next for Claude:** W9 baby-forms design (`docs/proposals/creature-growth.md`), then G2 zone lighting.
- 2026-10-07 Claude: merged T30 (ChatGPT, the league and Champion, Wildbond v1.2.0, 1120 checks; played through to
  the Champion title); wrote T31 (post-game part 1: the tower and league rematches) for ChatGPT on
  `codex/wildbond-postgame`. **Next for Claude:** W9 baby-forms design, or the wider walkable view (L11).
- 2026-10-07 Codex: T30/W2 complete on `codex/wildbond-league`, awaiting PR review; no merge. Returning Light League, Wren, four courts, Avenne and the colour-restoration homecoming; Champion title, daily progress and reload recovery, v1.2.0. All four pages pass: Wildbond 1120, Realmbound 1519, Starfall 48, sound 21; saves/hub restored. Phone/laptop/desktop/3440x1440 and five eras checked.

- 2026-10-07 Codex: G2 Frostmere lighting ready for review on `codex/realmbound-frostmere-light`; no merge. Realmbound v1.0.1; low snow haze, cool bounce and blue distant layers. Four browser pages pass: Realmbound 1534, Wildbond 1044, Starfall 48, sound 21; saves/hub restored. Dawn/noon/night/blizzard, hubs, High/Low, reduced motion and 375/1366/1920/3440 widths checked; save reloaded. Before/after captures in `docs/screenshots/`. Claude's league retry investigation is untouched.
- 2026-10-10 Claude: E3 save doctor in studio.html (summary, health check with fixes, searchable editor; per-game
  rules in `DOCTOR`, labels in `LABELS`; backs up before writing). **Next:** review T30 when it lands; W9 design or
  the wider walkable view (L11).
- 2026-10-10 Claude: L11 part 2: panels, text and buttons scale with CSS `zoom` at 1700 px+ (1.12) and 2400 px+
  (1.3); canvases never zoom so taps stay exact (checked at 3440x1440 in all three games; tests pass). **Next:** review
  T30 (`codex/wildbond-league`) when it lands; then E3 save doctor, or W9 design, or the wider walkable view (L11).
- 2026-10-10 Claude: merged W1 (ChatGPT, Farwatch, Wildbond 1044 checks, v1.1.0); sent T30 (Wildbond's ending: the
  league and the Champion) to ChatGPT; L11 part 1: wide layouts for desktops and ultrawides (CSS only, verified at
  3440x1440). **Next:** review T30; L11 part 2 (panel text and buttons scale), or E3 save doctor, or W9 design.
- 2026-10-07 Codex: W1 Farwatch Reach complete on `codex/wildbond-area8`, awaiting PR review; no merge. Rysa/Horizon/Watchlight, nine species, harbor map, Wren's shared-notes rematch, original tune and coastal backdrop are canon. Wildbond v1.1.0; no save or engine changes. All four browser pages pass: Wildbond 1044, Realmbound 1519, Starfall 48, sound 21; saves/hub restored. Five art eras and 375px phone map/backdrop checked.

- 2026-10-10 Claude: built the Studio (E1 part, E2): studio.html (GM mode, save backups/download/import/restore, GM
  log) and the GM panel (shared/gm.js) with actions in every game. Tests: Realmbound 1519, Wildbond 908, Starfall 48,
  sound 21. ChatGPT is on W1 (Wildbond area 8). **Next for Claude:** E3 save doctor or W9 baby-forms design; G2.
- 2026-10-10 Claude: merged T29 (ChatGPT, Sunthread Commons, Wildbond 908 checks). Jules (Google's coding agent, first
  task, L9 + F2) couldn't push from its sandbox, so Evan pasted its diff and Claude applied it with three fixes
  (Wildbond's context read the wrong fields, Starfall's season field, `VERSION` placed above 'use strict').
  **Jules is paused (Evan, 2026-10-10: more work than it was worth).** ChatGPT and Claude carry the work. If Jules is
  ever used again: Evan must press "Publish branch / Publish PR" in its code panel, and its guesses need checking.
- 2026-10-09 Claude (night, low on credits, planning only): Evan's new notes are now projects in docs/PROJECTS.md:
  the **Studio** (E1-E7: GM panel, save doctor, text/creature/quest editors, map painter, lighting tuner), the
  **feedback loop** (F1 done: GitHub issue forms for feedback, bugs, suggestions, docs/FEEDBACK.md; F2 in-game button),
  **baby forms and a larger creature roster** (W9 design first, W10-W12), **reactive light** (G7: walls block light,
  sprites lit on the light side, moving lights, cloud shadows, reflections). T29 (Sunthread) not pushed yet.
  **Next:** merge T29 when it lands; then pick from PROJECTS.md (suggested: E1+E2, W9, G2, L-track).
- 2026-10-09 Claude (evening): Evan asked for (1) WoW: Forever-quality lighting, (2) a master project list any
  assistant can work from, (3) room for other assistants' creativity. Wrote `docs/PROJECTS.md` and `docs/CREATIVE.md`
  (linked from AGENTS.md, CLAUDE.md, here); built G1, the light engine (`shared/light.js`) in Realmbound (side view,
  towns, hall) and Wildbond (HD-2D, ambience). Tests: Realmbound 1519, Wildbond 769, Starfall 48, sound 21.
  **Next:** G2 zone lighting passes (any assistant, one zone per PR), review T29, then W1/W2 or R3 (see PROJECTS.md).
- 2026-10-07 Codex: T29 complete on `codex/wildbond-sunthread`, awaiting review, no merge. Sunthread/Halen/Loom/
  Meadowmantle are canon; no caps, eras, journey settings or shared-engine changes. Browser checks: Wildbond 908,
  Realmbound 1513, Starfall 48, sound 21, all pass; saves/hub restored. Map and backdrop desktop/phone checked.

- 2026-10-09 Claude (later): S4 part 2: Wildbond's walking on the shared walker; Wildclan camps (tents, firepit,
  torches, totem), Thornvale's Abbey; the guild hall interior with members, favors, chest and jobs board. Tests:
  Realmbound 1513, Wildbond 769, Starfall 48. **Next:** review T29 (Sunthread) when it lands; Starfall's walkable hall.
- 2026-10-09 Claude: reviewed and merged seven ChatGPT branches (T28 Hollowecho Hills, guild member favors, guild
  raiders, shared rain sounds, Wildbond battle backdrops, Journal forecast, challenge pennants); fixed three check
  closings lost in the merge and a portrait crash without a hero; tidied this file; gave Hollowecho its ambience and
  battle scenery; sent T29 (Sunthread Commons) to ChatGPT. Tests: Realmbound 1506, Wildbond 769, Starfall 48, sound 21.
  **Next:** S4 part 2 (item 2).
- 2026-10-07 Codex: pulled Claude's S4 towns and completed guild-wide raid rosters on
  `codex/realmbound-guild-raiders`, awaiting review, no merge. All browser checks pass: Realmbound 1475,
  Wildbond 619, Starfall 48; saves/hub restored, zero errors. Gather button, nine health frames, reserved
  members, desktop/phone layouts checked. Combined with latest S4 main and all six earlier PRs:
  Realmbound 1506, Wildbond 769, Starfall 48, sound 21, all pass. S4 part 2 remains for Claude; PRs #22–27 also await review.

- 2026-10-09 Claude (late night): wrote T28 for ChatGPT (Wildbond Hollowecho Hills); built S4 part 1, the shared
  world kit (walker + HD-2D renderer), moved Wildbond's HD-2D onto it, and made Realmbound's towns walkable (inn,
  smithy, trainer, stable, guild hall, quest giver, Pell and Brisket, Auto stroll). Tests: Realmbound 1448,
  Wildbond 619, Starfall 48. **Next:** review T28 when it lands (and add Hollowecho's ambience); S4 part 2.
- 2026-10-07 Codex: T28 finished in the isolated clone, awaiting PR review; no merge. Wildbond 748, Realmbound 1434,
  Starfall 48 pass with saves restored. Senna/Echo/Undertone are canon; desktop and phone map verified.
- 2026-10-07 Codex: used Evan's lunch-session development authorization for the S5 Journal weather forecast; no merge.
  Shared the current weather schedule with predictions, hid locked routes, added live boundary/rollover checks.
- 2026-10-07 Codex: implemented the S5 regional battle-backdrop follow-up under Evan's lunch-session authorization.
  Shared ambience behind fighters; no save/combat changes. Reduced motion freezes the new scenery. Awaiting review.
- 2026-10-07 Codex: picked the planned ranch cosmetics while Claude prepares to return. Four original static
  pennants display automatically from earned challenge titles, no stats or save-format changes. Branch
  `codex/wildbond-challenge-pennants`, awaiting review; no merge. Tests: Wildbond 627, Realmbound 1434, Starfall 48,
  saves restored; desktop/phone checked. Combined with all five earlier PRs: Realmbound 1465, Wildbond 769,
  Starfall 48, sound 21, all pass. Earlier PRs #22–26 are ready for review; S4 remains claimed by Claude.
- 2026-10-07 Codex: S5 rain audio complete on `codex/shared-rain-audio`, awaiting PR review; no merge. Quiet filtered
  noise in effects or music mode, fades with weather, stops on off/hidden, one loop maximum. No save fields.
  Browser checks: Realmbound 1442, Wildbond 620, Starfall 48, shared sound 21; saves restored. Actual Web Audio
  measured rain signal, dry fade and zero hidden/off output. Combined with PRs #22–25: Realmbound 1465, Wildbond 761, Starfall 48, sound 21, all pass. Earlier PRs remain pending; S4 stays Claude's.
- 2026-10-07 Codex: used Evan's lunch-session authorization for the guild's first member requests; chose one-time
  supply favors, no deadlines, +10 mood/+3 friendship/15 guild XP. Browser checks: Realmbound 1457, Wildbond 619,
  Starfall 48; saves restored. Combined validation of all four lunch PRs also passed: Realmbound 1457, Wildbond 760, Starfall 48. Branch `codex/realmbound-member-requests`, awaiting review; no merge. S4 remains Claude's.

- 2026-10-09 Claude: merged ChatGPT's T27 (Wildbond area 5, Stillreed Basin, levels 52-60, Warden Olan, Reed Badge,
  Stillwake) and gave the basin its own mist and fireflies. Tests: Wildbond 619, Realmbound 1434, Starfall 48.
- 2026-10-07 Codex: T27 complete on `codex/wildbond-stillreed` for Claude's review, no merge. Browser checks pass:
  Wildbond 619, Realmbound 1434, Starfall 48; saves restored, zero errors. Desktop/phone map checked. Existing
  species, story, eras, journey settings and cap constants are preserved; Claude can add Stillreed ambience next.

- 2026-10-09 Claude (late): Wildbond's intro now explains the faded green start (Evan took it for a bug); recorded
  Evan's notes (outside assets allowed with a license and CREDITS.md; an immersive homepage later, item 21); built
  the Realmbound guild (founding, members with mood, guild levels, adventurers on the jobs board, Guard duty).
  Tests: Realmbound 1434, Wildbond 490, Starfall 48. **Next:** review T27 (Wildbond Stillreed) when it lands and add
  its ambience; then S4, the world kit (walkable towns for Realmbound, starting with a guild hall), or Wildbond
  areas 6-8 with ChatGPT.
- 2026-10-09 Claude (evening): built S5, the shared ambience kit (living skies, scenery, weather with lightning and
  thunder, night lighting, fire, life) in all three games; merged ChatGPT's T23 (Crown's Heart, cap 60, Hollow Key);
  the quest log now says which dungeons an attunement quest waits on; raid re-measured at 60 (no retune). Tests:
  Realmbound 1408, Wildbond 488, Starfall 48. Sent T27 (Wildbond Stillreed Basin) to ChatGPT. **Next:** the guild (members, mood, guild level, more job slots); review T27 when it lands.
- 2026-10-07 Codex: T23 complete on `codex/realmbound-crownheart` for Claude's review; no merge. All browser checks
  pass (Realmbound 1404, Wildbond 488, Starfall 48), saves restored. Focus Warrior: 45-52 282.19 min; 52-55 98.29 min.
  Evan chose to retain the strict file list: locked attunement reasons need a later quest-log UI change.
- 2026-10-09 Claude: merged T26 (Starfall sound); built T1-C (third talent trees for all five classes) and new jobs
  (Herbalism → healing potions, Questing for benched heroes); sent T23 (Crown's Heart 52-60, the Hollow Key) to
  ChatGPT. Evan asked for **larger chunks per prompt**. Tests: Realmbound 972, Wildbond 488, Starfall 48.
  Then built R2, the raid (The Hollow Throne), same session: Realmbound 997 checks. **Next:** review
  `codex/realmbound-crownheart` (T23) when it lands, then retune the raid at cap 60 (sim method in
  `docs/realmbound-40-60.md`, "R2 as built") [done 2026-10-09: T23 merged, raid re-measured at 60, no retune]; Claude next: the guild (members, mood, guild level, more job slots)
  and Wildbond area 5 (it has waited longest; bands in item 14).
- 2026-10-07 Codex: T26 complete on `codex/starfall-sound` for Claude's review, unmerged. Browser checks:
  Realmbound 929, Wildbond 488, Starfall 48; saves restored. Two-minute live audio capture: all three themes,
  no clipping or browser errors; phone-width sound control fits. Subjective listening remains for PR review.

- 2026-10-08 Claude (night, Evan asleep, later): built R1 + S3, the shared roster (`shared/roster.js`) and Realmbound's
  Supplies tab (other heroes mine ore → repair kits); merged ChatGPT's T22 (Hollow Crown 45-52, Rootrot Hollow).
  Tests: Realmbound 929, Wildbond 488, Starfall 24, all pass. **Next chat, start here:** (1) `git fetch`; review
  and merge `codex/starfall-sound` (T26) if it's there; (2) give ChatGPT T23 = Hollow Crown part 2 (the Crown's
  Heart, 52-56, see `docs/realmbound-40-60.md`), writing the ticket in `docs/ROADMAP.md` like T22; (3) Claude:
  T1-C third talent trees (item 5), or the next roster jobs (Questing, Herbalism; item 15), then the guild.
- 2026-10-07 Codex: T22 adds the Hollow Crown (45-52), twelve voiced quests, Veskareth and Rootrot Hollow.
  Evan approved the original zone tune in `17-sound.js` after S2 added per-zone music checks.
  Checks pass: Realmbound 911, Wildbond 488, Starfall 24. `codex/realmbound-hollowcrown` awaits PR review; no merge.

- 2026-10-08 Claude (night, Evan asleep): S2 done, the shared sound system. Realmbound now has its own music and
  effects, and Wildbond's sound improved. All test pages pass: Realmbound 600, Wildbond 488, Starfall 24.
  **Next chat, start here:** (1) `git fetch`; if `origin/codex/realmbound-hollowcrown` exists, review T22 and
  merge it (check the author email, read the diff, run all three test pages, `merge --no-ff`); (2) give
  ChatGPT the next side-lane ticket (T26 Starfall sound was sent too: review `codex/starfall-sound` if it is there); (3) Claude builds R1 together with S3 (items 4 and 15).
- 2026-10-08 Claude (late): merged T24 + T25; built S1, the shared scene system (moods, blinking, choices, faces
  from names): Wildbond switched over unchanged, Realmbound quest givers now speak in portrait scenes with Accept
  / Not now. Sent T22 (Hollow Crown) to ChatGPT. Next for Claude: S2 shared sound.
- 2026-10-08 Codex: T24 (Wildbond checks) and T25 (Starfall Guild split, a three-minute main save loads
  identically); both merged by Claude after all four test pages passed.
- 2026-10-08 Claude (night): Evan accepted all research recommendations and a light shared universe. Built D1
  (Wildbond cap table), D2+D3 (Realmbound group XP split, journey length; groups now ~1.3× solo) and D7
  (`docs/lore/multiverse.md`). Next open: S1 shared dialogue, S2 shared sound, T22 Hollow Crown.
- 2026-10-08 Claude (evening): research brief `docs/research/decisions.md` (level caps, group XP, pace, roster size,
  raids, shared systems and a shared universe). Sent T25 (split Starfall Guild) to ChatGPT; Primordial to the back
  burner at Evan's request.
- 2026-10-08 Claude (later): merged T21 (item names, ChatGPT); built T1-B (Grave Chill; pacing 40-45 measured, no XP
  change; found group questing ~5x faster, added as a question). Sent T24 (Wildbond checks) to ChatGPT. Fixed a
  Frostmere check that depended on which tab a local save was left on.
- 2026-10-08 Claude: wrote this file. Merged T20 (Barrowfields, cap 45) and T19 (promo pages); built T1-A (second
  talent trees, roles, respec) and T17 (Cloudglass Pass, which ChatGPT never delivered). Sent T21 to ChatGPT.
- 2026-10-07 Claude: T13 parts 1-3 (eras), T11b (challenge modes), T1 plan (`docs/realmbound-40-60.md`); merged T14,
  T16, T18 from ChatGPT.
- Earlier history: README.md changelog, `docs/ROADMAP.md`, and `docs/DEVELOPMENT.md` (Codex's notes up to 2026-10-06).

