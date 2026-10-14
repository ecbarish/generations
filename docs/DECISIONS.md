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

### DD-5 (2026-10-14): trust is required alongside a level, not instead of one

**Asked by:** Flint, playtest round 2 note 3 (docs/COMMS.md, 2026-10-12 20:52), ticketed as WB-BOND. The bond meter did not change what a creature could become: almost every change waited on a level alone. Deeptide's own line already says it changes only for a tamer it trusts. The catalogue (docs/plans/wildbond-catalogue.md) also wants, later, one young creature whose final form depends on how it was raised.

**How bond is earned.** Trust is a number on the creature, `bond`, starting at 0. It rises only while you are with that creature:

- You tell it to use a move: +0.3.
- It is still standing when the battle is won: +0.5 against a wild creature, +2 against a tamer. A coastfolk tamer's lead partner, a highlander's team in a tamer battle, and a partner wearing the calm bell each earn half as much again on that win.
- Rally gives +1 to each partner still up. Steady gives +0.5.
- Finishing a festival together gives +2 to the team you are carrying.
- Maren's letter, while you are away, gives +1 to each creature resting at the ranch.
- A feed in the trough (two of the chosen food) gives +3 to each creature at the ranch, and it remembers what it ate.

The loyal trait multiplies each of these by 1.5. A partner that has fainted earns no trust from that win. Nothing here is a new way to earn trust; these are the ways the game already had.

**How it is measured.** Five named steps, the same ones the ranch already shows. Evolution data names the step by its number, never the raw total:

| Step | Name | From |
|---|---|---|
| 0 | Wary | 0 |
| 1 | Friendly | 20 |
| 2 | Loyal | 60 |
| 3 | Devoted | 140 |
| 4 | Bonded | 280 |

**How it combines with level and with the other conditions.** Each way a creature can change is one option in `wildbond-godot/data/evolution.json` (or the species' single `evo` in the catalogue). The first option whose requirements are all met is the one offered. You can always say not yet.

Evan (2026-10-14): there is no trust-only route. A starter will have the trust by the chosen level. Bond is an added requirement alongside level, not a replacement.

Every option asks for a level (`at`). It may also ask for a trust step (`bond`). The data shape is the two together: a level and, when the line needs it, a trust step. An option with no level does not change the creature.

- Level only: it changes when it has grown that far. The journey's existing lines stay like this, so a partner one level away in an older save is not suddenly held back.
- Level and trust: it changes only when it has grown that far and trusts you that much. Trust before that level does not change it.

Place, time of day, weather, a companion (`with`) and what it last ate (`ate`) still apply on top of the level, and on top of the trust step when the option names one.

Tidewyrm becomes Deeptide at level 32 with Devoted trust (step 3). That is the path it already had. Bonded trust before level 32 does not make it Deeptide. It still changes only for a tamer it trusts. Other lines are unchanged until their own data opts in.

**How this enables a future bond-branch creature.** One young creature, several finals, chosen by how you raised it (the catalogue's bond branch, CAT-2, which will name it). The shape is already in the data under `bond_branch`, and it is not a creature you can meet yet. Each final is an option. Put the special ones first and the ordinary one last.

As trust is earned it is also remembered on the creature, in `raised`:

- `raised.battle` — trust from a fight (a move you ordered, a win, Rally, Steady).
- `raised.care` — trust from a feed, a festival, or a letter home.

An option names the record with `raised` (`"care"` or `"battle"`) and that record's step with `raised_at`, using the same five steps. It also asks for a level (`at`), and it may ask for overall trust (`bond`). The final form is the first option that matches. Trust before that level does not choose a final. If care and battle are both far enough at that level, the one listed first wins, so the data decides the priority, not the code. Trust split across both records, with neither record far enough on its own, does not pick a special final; the ordinary level option does. A creature with no `raised` record, which is every save from before this rule, takes the ordinary option when its level says so.

CAT-2's job is to name that young creature and its finals and to point the same option list at it. No new art: a form still draws from its family's procedural figure.

**Not yet.** Saying not yet remembers the level and the trust step. It asks again when the creature grows a level or its trust steps up. An older save that only remembered the level still waits for a level.

**Saves.** `bond` is already stored on every creature. `raised` and `hold_bond` are optional. An old save loads with the same trust, no raising record, and the same forms. A creature that already changed stays changed. Nothing is forced.

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
