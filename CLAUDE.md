# Idle Arcade: notes for Claude

Evan's personal stable of browser games, live at https://ecbarish.github.io/idle-arcade/ (GitHub Pages from `main`).
Evan works on this from more than one computer and with ChatGPT/Codex too, so **this repo is the shared memory**:
read **`START-HERE.md`** (where we are, what's next, the session log, shared by every assistant), **`docs/PRIORITIES.md`**
(which games get the focus now, and the scorecard every idea goes through), **`docs/PROCESS.md`** (how every AI claims, submits and merges work), **`docs/GOALS.md`** (short, medium and long-term goals per game), **`docs/PROJECTS.md`**
(the master list of every outlined project, with the launch track), **`docs/CREATIVE.md`** (ground rules and how much
creative freedom assistants have), this
file, `HANDOFF.md` (rules, layout, workflow) and `docs/ROADMAP.md` (full tickets) at the start of a session.

## Start of every session
0. Read docs/COMMS.md (the message board with ChatGPT) and answer or act on anything addressed to Claude.
1. `git pull`, then `git fetch` and check `git branch -r` for `codex/*` branches newer than `main` (ChatGPT's work).
2. For each: `git log --format='%h %ae %s' main..origin/<branch>`, review the diff, test it (see below), merge with
   `git merge --no-ff`, push, and mark the ticket done if ChatGPT didn't. Evan confirmed on 2026-10-06 that Claude
   merges after checking; ChatGPT/Codex still opens PRs and never merges its own work (unless Claude is
   unavailable: then START-HERE.md lets it merge after both test pages pass; double-check those merges).
3. Check open GitHub issues (testers' feedback, bugs, suggestions; see docs/FEEDBACK.md): bugs first.
4. Read START-HERE.md's Session log for anything done elsewhere, then take the first task in its "Up next"
   (or any open project in docs/PROJECTS.md).

## End of every session (Evan may switch to another assistant at any moment)
Commit and push everything that works; update START-HERE.md ("Where we are", "Up next" with enough detail for
someone with no memory of this session, a dated Session log line). Do this after each finished step, not only at
the very end, so running out of usage never strands work.

## Rules
- **Commits use only** `206636510+ecbarish@users.noreply.github.com` (set it as repo-local `user.email`). Never a
  personal email. End commit messages with the Co-Authored-By line the session gives you.
- Never enter Evan's passwords or create accounts for him; he signs in himself.
- Plain HTML/JS, no build step, no installs. Test locally with `serve.ps1` (http://localhost:8765/) in the browser
  pane. Realmbound: `tests/run.html` must stay all-pass. Wildbond: `tests/wildbond.html` must stay all-pass;
  `window.__wb` hook on localhost.
- Ship in small playable steps with a README changelog entry. When handing work to ChatGPT, write the ticket into
  `docs/ROADMAP.md` first and give Evan a copy-paste prompt (branch `codex/<topic>`, open a PR, don't merge,
  noreply email).

## What Evan wants (keep this in mind for every design choice)
- **Real games, not dashboards or puzzles:** deep lore and deep gameplay, like Pokemon, Palworld, classic WoW.
  Be *in* the world: places and people instead of menu buttons. May become an app or full game someday.
- **Earned automation, never paywalled.** Active play is always worth at least as much as idle. **Updated 2026-10-07
  (docs/VISION.md §8):** as games deepen, automation means earned quality of life and delegating to characters (guild
  members, ranch creatures, hired help), not skipping the fun; full Auto is for grinding and idle time.
- **Games feel like games** (Evan, 2026-10-07, after playing Wildbond): the screen is the world; interactions are
  physical (walk to the shop, the trough, the person); features arrive through the story; everything is readable in
  full words; nothing plays itself. The principles in docs/wildbond-plan.md apply to every game.
- **In the game window, for every game** (Evan, 2026-10-08): the lessons from Wildbond apply to all games. The screen is the world: no game in a small window with panels of information beside it. Guidance, menus, stats and story happen inside the game (people who speak, things you hold and open, a thin overlay), not in boxes off to the side. A separate panel is the exception and needs a reason (for example a save tool or settings). New features in any game follow this; existing dashboard layouts (Realmbound, Starfall, Diamond Career) are queued to move into the game window.
- **Budget and scope** (updated by Evan 2026-10-08): free first, and there is a lot we can do for free; the earlier
  ~US$200 figure was a passing thought, not a guardrail, so don't cite it as a limit. Ask Evan before paying for
  anything. AI tools may generate assets (credit them in CREDITS.md). The games matter most; the walk-in arcade and
  intros come later. Platforms stay open (browser, Godot or other, per game, decided by evidence). Every game
  belongs in the discussion (Starfall valued; Primordial lower priority). Automation serves play: earned conveniences
  that remove repetition, never skipping the parts players enjoy.
- **Read docs/VISION.md** (2026-10-07): old soul, modern craft; prologues, a Classic/Enhanced/Modern look, game boxes,
  procedural content, a living world of bots, friends, Realmbound nodes. Projects V1-V8 in PROJECTS.md.
- **The journey and the grind are the fun**, but the player picks the pace (journey-length settings, badge level
  caps, challenge modes) and there are reasons to revisit old content (rematches, rare spawns, mastery).
- References are inspiration, not templates. Suggest better mechanics from other games when they fit
  (he liked IdleOn's many characters working at once, Palworld ranch jobs, DQM inheritance, fusion).
- **Build strong shared assets, never cheap ones** (Evan, 2026-10-08): prefer work that genuinely improves several
  games at once ("two birds with one stone") and builds a recognisable arcade look and feel, but only if it makes each
  game better, never as a shortcut. Shared systems live in `shared/` (engine, creatures, dialogue, sound, roster,
  ambience; the world kit next).
- **Outside assets are allowed** (Evan, 2026-10-09): if you find art, sound or music online that fits, use it and
  tweak it, but only with a license that allows it (CC0, CC-BY with credit, or a free-for-games license), and record
  each one with its source and license in `CREDITS.md`. Prefer assets that strengthen the shared look.
- **One light shared universe** (decided 2026-10-08): recurring characters and a few deliberate links between games,
  every game playable alone. Canon: `docs/lore/multiverse.md`. Big decisions and their research:
  `docs/research/decisions.md`.
- **Stories are woven, not marched** (Evan, 2026-10-08): threads everywhere that only become a tapestry at the end; fair
  clues, several possible truths kept alive until late, misdirection only through characters (never the game's own
  text), small threads paid off early. Wildbond's ledger: docs/lore/wildbond-threads.md; check it before writing story.
- Guides per game come later, once games are near-finished. Record lore in docs as it's written
  (`docs/lore/`, design docs).
- Evan isn't a programmer: explain in plain words, show results, give clear next steps.

## Where we are (rewritten 2026-10-08, late night; update at the end of each session)
- **Read docs/PROJECTS.md "Read first"** (every decision and lesson since 2026-10-07) and **docs/DEVELOPMENT-PATH.md**
  (the path for every game, and the ticket factory: no lane is ever "finished").
- **The new Wildbond and the Starfall village are built in Godot** (Claude's lane): `wildbond-godot/`, `starfall-godot/`,
  web previews in `play/` (re-export after big steps), Windows builds in `Desktop\Game builds`. Next: WB-M2 in the path
  (tamer abilities, depth step 1, variety, interiors), then the remaining areas.
- **Browser games** (ChatGPT's lane): Realmbound v1.6.0, Diamond Career v0.4.0, Otherworld v0.3.0, browser Wildbond
  v1.8.0 (content complete; its data feeds the Godot version), Starfall Guild (old), Primordial (light).
- **Friends are testing:** playtest.html (Come Play) with a trailer and the previews. Keep it current.
- **The local helper** (Ollama on Evan's PC): small checkable jobs only (docs/research/local-ai-helper.md, Lane D).

## Latest owner direction and Codex handoff — 2026-10-06

Read [docs/plans/README.md](docs/plans/README.md) (and START-HERE.md for current status). The plans cover six games and a broader sports framework, based on 19 comparable titles. All games should eventually support manual through full automation, with independent delegation settings. Earned automation remains the current rule; whether full Auto is available immediately is still an owner decision. Desktop and phone come first; VR is deferred.

Sports should support athlete careers and team management across sports. Salaries should fund lasting personal progress (homes, cars, other purchases). Baseball remains the recommended first module; do not silently unpark implementation.

Winter Road (PR #7) and these plans (PR #8) are merged and live; `tests/run.html` passed (231) before merging. Wider T1 remains open. Wildbond stays Claude's lane. Open owner decisions: full-Auto unlock timing, the second sport, and whether purchases (homes/cars) have gameplay effects.

## Autopilot (Evan, 2026-10-07)
docs/QUEUE.md has a lane per assistant. Claude's lane starts with reviewing and merging every waiting PR (Codex,
Grok), bumping game versions on merge, keeping START-HERE current and refilling the lanes from PROJECTS.md.

## Working style (Evan, 2026-10-09)
Evan wants **larger chunks per prompt**: when he says "proceed", finish several queue items in one go (review and merge
ChatGPT's branches, write ChatGPT a sizeable ticket, then build more than one item yourself), committing after each.
**Token efficiency** (Evan, 2026-10-09): Claude's usage is the scarcest resource. Batch reviews, no status-only
replies, short plans, big builds to the helpers' Heavy lifting list. Rules: docs/QUEUE.md "Saving Claude's usage".

**Player-facing text** (Evan, 2026-10-08): capitalised names and titles, correct spelling, the world's words instead of the rules' words (no "mood -8" or "gate" in story text), and look at the real screen as a first-time player before shipping. Full rules: docs/CREATIVE.md "Writing for players".
