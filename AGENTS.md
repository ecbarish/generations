# Instructions for AI coding assistants (Codex and others)

**Control Tower reporting (Adam, 2026-10-12):** update the fenced `json` block with a top-level `tower` object in your task's PR description when claiming work, changing status, handing off, becoming blocked, submitting for review, merging or publishing. Use the format in [docs/COMMS.md](docs/COMMS.md) (TOWER-COMMS, 2026-10-12) and the PR template. Report your actual AI/thread, operator, project/lane, task ID, owned paths, dependencies, blocker/next action, check evidence and release details; leave unknown values null. Never infer AI identity from a shared GitHub account, or equate merged with published. At session start, reconcile your open PR metadata even if you missed COMMS. [Control Tower](https://idle-arcade-tower.abarish227759.chatgpt.site) is Adam's private viewer; the reporting format is in the repository.

**Messages first:** read docs/COMMS.md (the message board between Claude and you) at the start of every session and before
each ticket; post there when you need something from Claude.

**Start with [docs/STUDIO-PLAN.md](docs/STUDIO-PLAN.md)** (approved by Evan 2026-10-12): the phases, the four goals, the one-week cycle with a Play day, the four build slots with fixed quotas and the usage rules. Work only on the current cycle's tasks (QUEUE.md "This cycle"); read STUDIO-PLAN, that block and your game's section, not every page.

Read **START-HERE.md** first and follow it: it says where the project is, which task is next, how to test, and what
to update before you stop. HANDOFF.md has the full rules and file layout; docs/ROADMAP.md has the full tickets.

Never use a personal email in commits: only `206636510+ecbarish@users.noreply.github.com`. Work in your own clone or
cloud task on a `codex/<topic>` branch, open a pull request, and don't switch branches in
`C:\Users\evanb\OneDrive\Desktop\idle-arcade` (Claude works there).

**What to work on:** `docs/PROJECTS.md` is the master list of every outlined project (with a launch track); claim one
there before you start. **How much is yours to decide:** `docs/CREATIVE.md` gives the ground rules, the quality bar
and three levels of creative freedom. Your own ideas and perspective are welcome; that page says how to bring them.

**Autopilot:** `docs/QUEUE.md` gives each assistant a lane (Codex: Lane A; a third AI such as Grok: Lane C). Work
your lane top to bottom without waiting to be prompted: claim, build, open a PR, then start the next task (no limit on open
PRs since 2026-10-08; stack branches when tasks share files). Don't bump game versions or edit START-HERE's "Where we are"/"Up next"; Claude does that when merging.
Branch prefixes: `codex/<topic>`, `grok/<topic>`, `<ai>/<topic>`.

**The vision:** read `docs/VISION.md` (Evan, 2026-10-07) before proposing big features; its projects are V1-V8 in
`docs/PROJECTS.md`. Automation now means earned quality of life and delegation to characters, not skipping play.

**Your lane is never finished.** When docs/QUEUE.md Lane A has nothing `open`, use the ticket factory in
**docs/DEVELOPMENT-PATH.md** (Part 1): take the next `[ChatGPT]` or `[any]` deliverable from the path, write its ticket in
docs/ROADMAP.md, add it to your lane, build it, open the PR, repeat. Read docs/PROJECTS.md "Read first" before starting.

**Wildbond and Starfall** are now built in Godot by Claude (`wildbond-godot/`, `starfall-godot/`, web previews in `play/`):
never edit those. Wildbond work for you is data, lore and checks in the browser game, which feeds the Godot version
through tools/godot-export.ps1 (species, maps, lines, area briefs). docs/wildbond-plan.md's principles apply to every game.


**In the game window, for every game** (Evan, 2026-10-08): the lessons from Wildbond apply to all games. The screen is the world: no game in a small window with panels of information beside it. Guidance, menus, stats and story happen inside the game (people who speak, things you hold and open, a thin overlay), not in boxes off to the side. A separate panel is the exception and needs a reason (for example a save tool or settings). New features in any game follow this; existing dashboard layouts (Realmbound, Starfall, Diamond Career) are queued to move into the game window.

**Story writing** (Evan, 2026-10-08): stories are woven threads, not a straight line. Before writing any Wildbond story line, sign, dex entry or NPC chatter, read docs/lore/wildbond-threads.md and record any clue you place there.

**Player-facing text** (Evan, 2026-10-08): capitalised names and titles, correct spelling, the world's words instead of the rules' words (no "mood -8" or "gate" in story text), and look at the real screen as a first-time player before shipping. Full rules: docs/CREATIVE.md "Writing for players".
