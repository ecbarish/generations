# Design decisions

Evan (2026-10-09): "When we have a question we need a thread that answers it." This page is that thread's log. Any
assistant (a Claude thread, ChatGPT/Codex, Evan's PC Claude) with a design question gets an answer here instead of
waiting on Evan, as long as the project's research supports one.

## How to ask

- **In COMMS:** a message addressed "to Claude (Design decisions)". Say the question, the options you see, and what
  you'd do by default. Keep working on your default meanwhile.
- **In the project:** ask in the "Design decisions" thread, or tell the project chat and it is routed there.
- The answer lands here as a numbered entry (DD-n), with a "Done" line under your COMMS message pointing at it.

## How questions are answered

1. **From what's already decided first:** CLAUDE.md "What Evan wants", docs/PRIORITIES.md, docs/research/decisions.md,
   docs/VISION.md, docs/CREATIVE.md, the lore ledgers (docs/lore/wildbond-threads.md), docs/learning/, and Evan's
   answers in COMMS and START-HERE.
2. **Then from the research:** docs/research/, docs/proposals/ (game reviews and new-game ideas), DEVELOPMENT-PATH Part 4
   (lessons).
3. **Decide** when that supports a clear answer, and write down why, so a later assistant can see the reasoning.
4. **Go to Evan only** when the answer would change his goals, start a new game (PRIORITIES: new games need his yes),
   spend money, or can't be undone. Those go in START-HERE "Questions for Evan" with a default, so work never waits.
   Story canon he has chosen (the final truth) is his; filling gaps inside it is ours.
5. **Who decides what:** this log owns *design answers* (how a feature, rule, story beat or screen should work). Lane P
   (docs/PRIORITIES.md) owns *order* (what is built next). Lanes own their files; an answer here becomes a ticket or a
   note to the lane that builds it.
6. Evan's word always wins. If he overrules an entry, mark it **Overruled (Evan, date)** and keep it, so the history stays.

## Log (newest first)

### DD-4 (2026-10-13, Evan): Classic editions and Diamond Career come off the site; Diamond Career is shelved

Evan (project chat, 2026-10-13): he expected the classic browser games to leave the website, and Diamond Career "was never
good enough to play so I thought we shelved it". Decision: the hall, Come Play and the visitor-facing lists stop showing
the Classic Wildbond, Classic Starfall Guild and Diamond Career. Their code, folders and save keys stay in the repository,
so nothing is deleted and old saves keep loading if a game ever returns. Diamond Career is **shelved** (Diamond Manager
replaced it); no more work on it, including the postponed practice swing. The Classic editions get no new work either
(their data still feeds the Godot games). Task: AR-SHELVE in docs/QUEUE.md "This cycle".

### DD-3 (2026-10-09): Wildbond's Warden levels: the data is right, the lore paragraphs were stale
**Asked by:** ChatGPT (T47 Hollowecho brief, T49 briefs) and Claude's own note in COMMS ("propose it as a separate
balance ticket"). **Question:** docs/lore/wildbond.md gave Senna 60/61/63, Halen 65/66/68 and Rysa 69/70/72; the game
data (browser and Godot) has 58-60, 63-65 and 68-70. Which is canon?
**Decision:** the data. Each Warden tops out at the level cap the previous badge allows (60 before the Echo Badge, 65
before the Loom Badge, 70 before the Horizon Badge), so the lore numbers would have put Wardens above the player's own
cap, which breaks the "train before each Warden, but no walls" pacing Evan chose (12 even-level wins per level,
PR #92; T56 showed trained teams win the league at 70). The three paragraphs in docs/lore/wildbond.md are corrected
(a three-number fix in lane A's file, noted in COMMS). No balance ticket needed.

### DD-2 (2026-10-09): Starfall keeps one "day"; the shared calendar counts Starfall's days
**Asked by:** ChatGPT (T57/SF3.3, PR #84): "the shared calendar has 300-second days; Starfall's service/wage day remains
150 seconds, so preserve both meanings when integrating."
**Decision:** the player only ever sees **one day** in Starfall: the 150-second service day that already has an
evening, wages and "Day 12" on screen. When SF3.1/SF3.4 bring in the seasons, Starfall's date comes from **its own day
count** fed through the shared calendar's rules (30 days a season, the four festivals on the same day numbers, the same
real-date and held-season modes). The calendar's maths gains a "days played" entry point (or a day-length setting) so
both games share the rules without sharing a day length. Wildbond keeps 300-second days.
**Why:** two clocks on one screen ("Day 14" in the corner, "Day 7 of Spring" at the festival) is exactly the kind of
rules-word confusion CREATIVE.md's "Writing for players" forbids, and a world where the sun sets twice per date doesn't
read as a world. Starfall is a shift-by-shift management game, so its day is naturally shorter; a season of 30 Starfall
days is about 75 minutes of play, which suits a village chapter (each SF3.3 chapter already moves on work done, not on
dates). Wages, service and the existing balance are unchanged; no save change beyond the date derived from `day`.
**For lane S** (SF3.1): build it this way; a small additive function in `wildbond-godot/scripts/calendar.gd` (lane W's
file, a few lines, say so in the PR) or a copy in `shared/`.

### DD-1 (2026-10-09): the T55 calls (Rysa's chronology, Classic's depth scenes, the late observations)
Settled by the Wildbond builder thread in PR #95 (docs/lore/wildbond-threads.md, "Claude's review of T55"), recorded
here so the log is complete: the three late observations are accepted; Rysa's witness and Ceryn's survey are both true
(the fading began long before; she saw the last local pallor); Classic's early depth scenes are not ported, depth
returns once, late. **The watcher and the turned friend** went to Evan because it names a character in canon he
chose; **Evan decided (2026-10-09): the same creature.** The ritual bound and broke the watcher, the entity hid behind
it, and the old pair fought their friend; freed, it slept to heal in the warm pocket (ledger, PR #95).
