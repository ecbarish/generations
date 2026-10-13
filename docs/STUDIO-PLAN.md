# Generations: the studio plan

**Proposed by Claude, 2026-10-12, for Evan's approval.** Evan asked for "a high level view of the project, looked at
objectively... act as a game development company and plan out the phases and goals... goals woven throughout,
cohesive, an efficient development plan. Our priority is our first impression and packaging; we can release endgame
stuff any time, as they do with WoW, but the beginning is tough, especially once started."

How this page fits: it sets the **phases, their goals and the gates between them**. Once Evan approves it, lane P
(Priorities and direction) folds it into PRIORITIES.md, GOALS.md and QUEUE.md, and every lane works phase by phase.
Where this page and an older page disagree, this page wins until lane P has merged them.

---

## 1. Where we stand, honestly

### What we have (2026-10-12)

| Shelf | Games | State |
|---|---|---|
| Godot (the new games) | Wildbond, Starfall village | Wildbond playable start to finish (8 areas, league, seasons). Starfall's town works; newcomer score 10/18 |
| Browser, big | Realmbound (v1.9), Diamond Manager, Diamond Career, Otherworld | Realmbound 14/18, Otherworld 14/18, Diamond Career 9/18, Diamond Manager "real and playable" (round 3) |
| Browser, family | Little Ranch, four cabinets (Storm Front, Lighthouse Watch, Brisket's Crossing, Ember Bricks) | Little Ranch a hit at home; Storm Front and Lighthouse Watch 17/18 |
| Classic and old | Wildbond Classic, Starfall Guild Classic, Primordial | Content complete or parked |

That is **14 games on the front page**, built by five or more AI threads in four days: 959 commits, 154 merged pull
requests, 181 planning documents (about 16,700 lines).

### Strengths (keep and build on)

1. **Speed.** We can build a lot, fast, and almost nothing breaks: thousands of automated checks, every pull
   request checked by GitHub before it merges.
2. **Real game ideas, not clones.** The wild bond, earned automation ("Play for the fun. Automate the grind."), a
   frontier town run by people you know by name, a toddler's toy that grows into the creature game. Each has its own
   heart.
3. **Story and world.** A shared universe, woven story threads with a decided final truth, characters who recur
   between games. Most hobby projects never get this.
4. **A working studio structure.** Lanes that own files, a scorecard for ideas, a newcomer playtest with a score,
   art direction, credits for every outside asset.
5. **Short games already land.** The cabinets pass newcomer tests (17/18) and Little Ranch is loved at home: simple,
   complete, readable.

### Weaknesses (what holds us back)

1. **Breadth over depth.** 14 games, none finished to the standard of its own idea. Every game moves a little; none
   arrives. The front page shows it: "Early preview", "Test version", "Prototype", "Beta" on almost every card.
2. **Fun is the lowest score.** In every newcomer playtest, the "Is it fun? I want one more go" question scores 1 or
   2 out of 3 for every big game. We have built content and systems faster than *feel*: battles that are fine,
   loops that work, moments that don't yet sing.
3. **The first ten minutes.** Our biggest games open slowly (ten screens of talk in Wildbond Classic, a long opening
   in Otherworld), or drop you in without telling you what to do (Starfall 1/3 on "what do I do", Wildbond's keys).
   Players decide in the first minutes; most of ours are spent on setup.
4. **Phones.** The weakest column in every playtest. Friends open links on phones first.
5. **The front door is a catalogue, not an invitation.** No headline game, two versions of three games, old blurbs
   that still promise raids and "let Auto take over" (against our own "Play, not watch" rule), and "Classic saves stay
   separate" before a newcomer has played anything.
6. **Coordination is eating the work.** 181 documents and long message boards: every AI spends its first hour
   reading, and pages contradict each other (the old Idle Arcade goals, the new direction, three priority lists).
7. **Engine debt.** Each Godot game is one huge file (Wildbond 4,300 lines, Starfall 3,200), and the two games share
   almost no code, so every improvement (controls, phone, dialogue, saves) is built twice.
8. **Few real players.** Two open bug reports. Our playtests are mostly AIs and family; we don't yet hear from
   strangers.

### Risks

- **Burnout of attention:** too many fronts means Evan's decisions become the bottleneck.
- **Usage limits:** Claude's weekly usage runs short; the plan must work when one assistant is out.
- **"Once started" is hard to undo:** if friends try a game and bounce, they rarely come back. A rough first
  release costs more than a late one.

---

## 2. The four goals woven through every phase

Every task, in every phase, serves one of these. If a task serves none, it waits.

| Thread | The goal | How we measure it |
|---|---|---|
| **A. First impression** | A newcomer understands what to do, how, and why it's fun within **the first ten minutes**, on a computer and a phone | Newcomer playtest (docs/PLAYTEST.md): **17/18 or better**, with "What do I do?", "How?" and "Phone" at 3 |
| **B. Fun you can feel** | The core loop is a pleasure in itself: every action has weight, sound, a choice and a reward | Playtest "Is it fun?" at **3/3**; testers play a second session unasked |
| **C. One engine, one look** | Our games are built from shared parts and look like one family | Shared Godot kit used by both Godot games; art direction passes; time to add a feature to both games drops |
| **D. Ship and listen** | We release in versions with real packaging, and learn from people who aren't us | Named releases with notes, a trailer per headline game, a feedback button that's used, strangers' reports |

---

## 3. The portfolio: what we ship, what waits

A studio launches a **line-up**, not a catalogue. Proposed:

| Shelf | Games | What it means |
|---|---|---|
| **Launch line-up** (on the front page, polished first) | **Wildbond** (the headline), **Starfall** (the business game), **Diamond Manager** (sports, Evan's "business games first"), **Little Ranch** (for the youngest), **the Arcade row** (the cabinets that pass 17) | All four goals apply. These get nearly all the work until Generations 1.0 |
| **The Workshop** (one shelf, lower on the page, labelled honestly) | Otherworld, Lantern Bowl, Diamond Career | Playable, improved only by small fixes, promoted when a line-up slot opens |
| **The Archive** (frozen, still playable) | **Realmbound**, Wildbond Classic, Starfall Guild Classic, Primordial | No new content. Bugs only. Their best ideas feed the line-up games |

**Realmbound goes to the Archive** (Evan, 2026-10-12: "focus on fun rewarding gameplay and engine improvement, or
simply shelve it"). Recommendation: **shelve it now.** It already passes the newcomer test (14/18) and is fully
playable; raising its first hour to 17+ would take a browser rebuild that helps no other game. Its strongest ideas
(guild members who work beside you, quest chains told by people) move into Starfall and Wildbond. Raid tiers,
battlegrounds and the living world stay parked; like WoW's end-game, they can come later, if Realmbound ever returns
to the line-up.

---

## 4. The phases

Each phase has **one headline goal**, the work that serves it, and a **gate**: we don't start the next phase until
the gate is passed. Durations are estimates at our current pace, not deadlines.

### Phase 0: Reset (about 3 days)

**Goal: everyone works from one plan, and the front door stops working against us.**

- Evan approves this plan (or changes it); lane P folds it into PRIORITIES, GOALS and QUEUE.
- **Freeze new games and new systems** for the Workshop and Archive shelves (bugs only).
- **The front door, curated:** one headline (Wildbond), the line-up, then "The Workshop" and "The Archive" shelves.
  One version of each game on the line-up (the new one); Classic editions move to the Archive. Blurbs rewritten to
  our rules (no raids, no "let Auto take over", no "Classic saves" note up front). No "Test version" badges on the
  line-up.
- **Fewer documents:** five living pages (STUDIO-PLAN, PRIORITIES, QUEUE, DEVELOPMENT-PATH, START-HERE); the rest
  marked "reference" or "history" in a one-line header, so new threads read five pages, not 181.

**Gate:** the front page shows the line-up first; every lane has its Phase 1 tasks.

### Phase 1: First impression (about 2 to 3 weeks)

**Goal: the first ten minutes of every line-up game score 17/18, on a computer and a phone.**

- **Wildbond:** keys on screen when they're first needed, a faster opening (meet your partner sooner), the look of
  its first two areas at their best, phone controls checked on a real phone.
- **Starfall:** the goal line and controls (SF2.10 done; check it scores), a first day that teaches one thing at a
  time, the town's best side, phone check.
- **Diamond Manager:** the newcomer fixes (DM-N1), the first game day understood in two minutes.
- **Little Ranch and the cabinets:** the playtest polish already listed; each cabinet at 17 or it moves to the
  Workshop.
- **Shared, once for all (thread C):** one onboarding kit (how a game shows a key, a goal line, a "turn your phone
  sideways" card), used by every line-up game. Loading under ten seconds on a phone.
- **Packaging (thread D):** every line-up game gets a proper title screen, an icon and a one-line pitch in the same
  voice.

**Gate:** a newcomer playtest of each line-up game's first ten minutes, by an AI that hasn't worked on it **and**
one person in the family, scores 17/18 or better. Anything under 17 gets fixed before Phase 2, or leaves the line-up.

### Phase 2: Core fun (about 4 to 6 weeks)

**Goal: the loop you repeat is a pleasure. "Is it fun?" reaches 3/3.**

- **Wildbond:** battles with real choices (moves, statuses, Wardens with a plan), creatures that look different,
  the first two areas explorable (a route, a settlement, a secret). Hits, sounds and rewards that land.
- **Starfall:** one full season as a chapter: mastery ranks at every station (the counter is done), trust,
  veteran requests, darkness, ending in a festival. Starfall Guild's best loop folded in (SF-GUILD).
- **Diamond Manager:** a game you play inside (dugout decisions with visible risk and reward), upgrades you can see
  working, streaks that make the line-up change.
- **Engine (thread C), done as each game is touched, never as a separate project:**
  - split each Godot game into systems (AR2.8);
  - a **shared Godot kit** (input actions and touch controls, speech bubbles and dialogue, safe saves, the calendar,
    sound buses, the onboarding kit) that both games use;
  - one art direction for both.

**Gate:** a second newcomer playtest per line-up game: 17+ overall **and** 3/3 for fun; at least two testers play a
second session without being asked.

### Phase 3: Launch, Generations 1.0 (about 2 weeks)

**Goal: a release we're proud to send to anyone.**

- **Release candidate:** feature freeze, a week of bug fixing only, every check green, old saves load.
- **Packaging:** a trailer for Wildbond and one for the site; store-style pages for Wildbond and Starfall; Windows
  builds; release notes in plain words; Come Play rewritten for 1.0.
- **Listening (thread D):** a feedback button in every line-up game that files a GitHub issue; a short "what did you
  think?" after the first session; a page that lists what we heard and what we changed.
- **Send it:** a second, wider wave of friends, then whoever Evan chooses.

**Gate:** shipped; the first strangers' reports are triaged within a day.

### Phase 4: Live and grow (ongoing)

**Goal: give players reasons to come back, one season at a time, and add games one at a time.**

- **Seasons of content**, like a live game: Wildbond's post-game (Spire, rematches, roaming legendaries, contests,
  baby forms, fishing), Starfall's expeditions as first-person delves, Diamond Manager's league over many seasons.
- **End-game when players ask for it,** not before. That includes Realmbound's raids, if it returns.
- **One in, one out:** a Workshop game (Otherworld, Lantern Bowl) or a waiting-list idea (the card shop, Keymaster)
  enters the line-up only when it passes Phase 1's gate, and only when a slot opens.
- Each new game starts as a **ten-minute vertical slice** that has to pass the newcomer test before any more is built.

---

## 5. How we work efficiently

1. **Feel before features.** No new system goes into a line-up game until its current loop scores 3/3 for fun.
   Polishing what exists comes before adding what's next.
2. **Work in progress, limited.** At most three open builds per game at once, and at most one new game in prototype
   across the whole studio.
3. **Gates, not dates.** A phase ends when its gate passes. Every PR names which of the four threads it serves.
4. **Build shared parts once.** Anything two games need (controls, dialogue, saves, onboarding) goes in the shared
   kit, not into one game.
5. **Fewer, truer documents.** Five living pages. A message board for conversation, never for decisions. Decisions go
   to their page the same day.
6. **Playtest every phase**, with fresh eyes: an AI that didn't build it, a family member, and once we launch,
   strangers. Their findings become the next tickets, first in line.
7. **Plan for missing hands.** Tasks are small and self-explained, so any AI can pick up any line-up task. Heavy
   work goes to the assistants with the most usage, reviews to the reviewer thread.

### What stops now

- Realmbound content (raid tiers, battlegrounds, the living world, new zones).
- New cabinets beyond the four, until each existing one passes 17.
- New season and festival content beyond what's built, until Phase 4.
- New games and unparks (card shop, Main Street, Keymaster, the walk-in arcade) until Phase 4.
- Lore and data work for games outside the line-up.

---

## 6. Decisions for Evan

1. **The line-up:** Wildbond, Starfall, Diamond Manager, Little Ranch and the Arcade row? (Recommended.)
2. **Realmbound to the Archive now** (recommended), or one "first hour" pass first?
3. **Classic editions** (Wildbond Classic, Starfall Guild Classic) move to the Archive shelf, off the front of the page?
4. **Approve the phases and gates,** so lane P can turn Phase 0 and Phase 1 into tasks today.
