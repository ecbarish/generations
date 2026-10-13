# Generations: the studio plan

**Approved by Evan, 2026-10-12** ("All approved"). Proposed by Claude the same day and revised with his answers below.

Evan asked for "a high level view of the project, looked at objectively... act as a game development company and plan
out the phases and goals... goals woven throughout, cohesive, an efficient development plan. Our priority is our first
impression and packaging; we can release endgame stuff any time, as they do with WoW, but the beginning is tough."

His answers to the first draft (2026-10-12), which this version follows:

- **Realmbound stays.** "The end game content makes no sense to keep iterating on. We need to work on early and making
  the game good before anyone cares about the end... It's a big grind to get to end game stuff."
- **Hide the Classic editions:** "we don't even know if they're playable; they have most of the content but not all
  the polish."
- **Clear goals and cycles:** "my dad and I are burning through usage so fast and there hasn't even been much playing
  yet... development is part of the fun, but we need to make these fun."
- **Little Ranch** is his daughter's favourite and is now an app (his dad's AI built it): make it a fun kids' world.
- **Wildbond** still needs polish; the assets have come a long way but can be better. **Build the catalogue** and make
  it feel like a new, exciting Pokémon-like experience, with the same kinds of media that hit the nostalgia.
- **The shelved ideas** (the football game, the real-estate game and others) have a lot of potential: "a gold mine."
- **Begin a plan to monetise** in the future.

How this page fits: it sets the **cycles, phases, goals and gates**. Once Evan approves it, lane P (Priorities and
direction) folds it into PRIORITIES.md, GOALS.md and QUEUE.md. Where this page and an older page disagree, this page
wins until lane P has merged them.

---

## 1. Where we stand, honestly

### What we have (2026-10-12)

| Kind | Games | State |
|---|---|---|
| Godot (the new games) | Wildbond, Starfall village | Wildbond playable start to finish (8 areas, league, seasons), but not polished. Starfall's town works; newcomer score 10/18 |
| Browser, big | Realmbound (v1.9), Diamond Manager, Diamond Career, Otherworld | Realmbound 14/18 (a long grind to its end-game), Otherworld 14/18, Diamond Career 9/18, Diamond Manager playable |
| For kids | Little Ranch (also an app now) | His daughter's favourite |
| Arcade cabinets | Storm Front, Lighthouse Watch, Brisket's Crossing, Ember Bricks | Storm Front and Lighthouse Watch 17/18 |
| Classic and old | Wildbond Classic, Starfall Guild Classic, Primordial | Content, little polish |
| Ideas on the shelf | Lantern Bowl (football), Keymaster (real estate), the card shop, The Crossing, Main Street | Pitches; Lantern Bowl has a first slice |

That is **14 games on the front page**, built by five or more AI threads in four days: 959 commits, 154 merged pull
requests, 181 planning documents (about 16,700 lines). **And very little of that time has been spent playing.**

### Strengths (keep and build on)

1. **Speed.** We build a lot, fast, and almost nothing breaks: thousands of automated checks, every pull request
   checked by GitHub before it merges.
2. **Original ideas, not clones.** The wild bond, "Play for the fun. Automate the grind.", a frontier town run by
   people you know by name, a toddler's toy whose babies could grow into Wildbond's creatures.
3. **Story and world.** A shared universe, woven story threads with a decided final truth, recurring characters.
4. **A working studio structure.** Lanes that own files, a scorecard for ideas, a newcomer playtest with a score, art
   direction, credits for every outside asset.
5. **Short, simple games already land.** The cabinets pass newcomer tests; Little Ranch is loved at home.
6. **A deep idea pipeline.** Football, real estate, a card shop, sailing between worlds: each scored, most strong.

### Weaknesses (what holds us back)

1. **Breadth over depth.** 14 games, none finished to the standard of its own idea; "Early preview", "Test version",
   "Prototype" and "Beta" on almost every card.
2. **Fun is the lowest score.** In every newcomer playtest, "Is it fun? I want one more go" scores 1 or 2 out of 3 for
   every big game. We build content and systems faster than *feel*.
3. **The first ten minutes, and the climb after.** Slow openings (Wildbond Classic, Otherworld), unclear starts
   (Starfall, Wildbond's keys), and in Realmbound a long grind before the good parts.
4. **Phones**: the weakest column in every playtest, and friends open links on phones first.
5. **The front door is a catalogue, not an invitation**: no headline, duplicate versions, old blurbs that break our
   own rules.
6. **Usage is spent on coordination, not play.** 181 documents and long message boards; every AI spends its first
   hour reading; pages contradict each other. Evan and his dad burn usage fast while the games are rarely played.
7. **Engine debt.** Each Godot game is one huge file (Wildbond 4,300 lines, Starfall 3,200) and the two share almost no
   code, so every improvement is built twice.
8. **Few real players.** Two open bug reports; testers are mostly AIs and family.

---

## 2. The four goals woven through everything

Every cycle, every phase and every task serves one of these. A task that serves none waits.

| Thread | The goal | How we measure it |
|---|---|---|
| **A. First impression** | A newcomer knows what to do, how, and why it's fun within **the first ten minutes**, on a computer and a phone | Newcomer playtest (docs/PLAYTEST.md) at **17/18 or better**, with "What do I do?", "How?" and "Phone" at 3 |
| **B. Fun you can feel** | The core loop is a pleasure in itself: actions with weight, sound, choices and rewards; progress that feels earned, never a slog | Playtest "Is it fun?" at **3/3**; people play a second session unasked |
| **C. One engine, one look** | Built from shared parts; looks like one family of games, at a quality we're proud of | One shared Godot kit used by both Godot games; art direction passes |
| **D. Ship and listen** | Real versions with real packaging, and feedback from people who aren't us | Named releases, trailers, a feedback button that's used, strangers' reports |

---

## 3. The portfolio

A studio launches a **line-up**, not a catalogue. Proposed:

| Shelf | Games | What it means |
|---|---|---|
| **Headline** | **Wildbond** | The game we're known for. Most of the work |
| **For kids** | **Little Ranch** (web and app) | A fun, safe kids' world; ideas come in through COMMS from Evan, his dad and his daughter |
| **Line-up** | **Starfall**, **Realmbound** (early game), **Diamond Manager**, **the Arcade row** | Real games on the front page, improved in rotation (section 4) |
| **The Workshop** | Otherworld, Diamond Career, Lantern Bowl until it passes its gate | Playable, labelled honestly, lower on the page; small fixes only |
| **Hidden** | Wildbond Classic, Starfall Guild Classic, Primordial | Off the front page (Evan: we don't know they're still playable). The files stay; their best ideas feed the new games |
| **The Incubator** | Lantern Bowl (football), Keymaster (real estate), the card shop, The Crossing, Main Street | The gold mine. Each earns its way in with a ten-minute prototype (section 7) |

**Realmbound, early game first.** No end-game work at all: no raid tiers, battlegrounds or living world. The work is
**the first hours and the climb**: a first hour that's fun, then a level 1 to 60 journey that feels quick and rewarding
rather than a grind (fewer kill-ten quests, more told stories, a first dungeon early, rewards that come often, a
pace a player can feel). Engine work that makes fights feel good counts too. End-game can come back later, the way WoW
releases raids, once players reach it and ask.

---

## 4. Development cycles (and saving usage)

The heart of this plan. Everyone works in the **same one-week cycle**, and **every cycle ends with people playing**.

### The cycle (one week)

| Day | What happens | Who |
|---|---|---|
| **1. Plan** | Lane P picks **one goal per active game** for the week from the current phase, and writes at most **five tasks** for each. Posted as one short "This cycle" block at the top of QUEUE.md | Lane P, Evan approves in one message |
| **2-5. Build** | Only this cycle's tasks. One task per pull request. Nobody starts a task that isn't on the list | Building threads and helpers |
| **6. Play day** | **Evan, his dad (and his daughter, for Little Ranch) play the week's builds.** AIs only fix what blocks play. Findings go into one place: a "Play day" note per game, in plain words | The family; one AI on call |
| **7. Review** | Score each game against the cycle's goal; tick what's done; the play-day notes become next week's first tasks. Then rest | Lane P, Evan reads a five-line summary |

### Which games are active each cycle

Not every game every week. **Three build slots per cycle:**

1. **Wildbond**: every cycle (the headline).
2. **Little Ranch**: every cycle, small (kids' ideas from COMMS).
3. **The rotating slot**: one of Starfall, Realmbound, Diamond Manager or the arcade row, chosen at Plan.

Everything else gets bug fixes only that week. This is how we stop spreading thin.

### Saving usage (Evan and his dad's AI time)

- **Fewer threads at once:** at most three building threads plus the reviewer in any cycle.
- **Read less:** a thread reads STUDIO-PLAN, the "This cycle" block and its game's section. Nothing else unless the
  task needs it.
- **Short messages:** COMMS posts of five lines or fewer; decisions go to their page the same day.
- **The right helper for the job:** mechanical work (checks, renames, data entry) goes to the cheapest capable
  helper or the local AI; big assistants do design and hard builds.
- **No speculative work:** no plans, lore or data for games outside this cycle's slots.
- **Stop when the goal is met.** A finished cycle goal isn't padded with extra features.

---

## 5. The phases

Each phase has **one headline goal** and a **gate**. Phases are made of cycles; a phase ends when its gate passes, not
on a date. Estimates assume the three-slot cycle above.

### Phase 0: Reset (one cycle)

**Goal: one plan, a front door that invites, and the cycle running.**

- Evan approves this plan; lane P folds it into PRIORITIES, GOALS and QUEUE, and posts the first "This cycle" block.
- **The front door:** Wildbond as the headline, Little Ranch for kids, then the line-up, then "The Workshop". Classic
  editions hidden. Blurbs rewritten to our rules (no raids, no "let Auto take over"). No "Test version" badges on the
  line-up.
- **Fewer documents:** five living pages (STUDIO-PLAN, PRIORITIES, QUEUE, DEVELOPMENT-PATH, START-HERE); everything
  else gets a one-line "reference" or "history" header.
- **The first Play day.**

**Gate:** the front page shows the line-up; the first Play day's notes exist.

### Phase 1: First impression (about 3 cycles)

**Goal: the first ten minutes of every line-up game score 17/18, on a computer and a phone.**

- **Wildbond:** keys on screen when first needed, meet your partner sooner, the first two areas at their best, a real
  phone check.
- **Little Ranch:** a kids' first five minutes that a three-year-old manages alone.
- **Starfall:** a first day that teaches one thing at a time; phone check.
- **Realmbound:** the first hour (RB1.10 playtest, then RB1.12 fixes), and a first map of the climb (where it drags).
- **Diamond Manager:** the newcomer fixes; the first game day understood in two minutes.
- **The arcade row:** each cabinet at 17 or it moves to the Workshop.
- **Shared, once (C):** one onboarding kit (keys on screen, a goal line, "turn your phone sideways"), used everywhere.
- **Packaging (D):** a proper title screen, icon and one-line pitch for every line-up game.

**Gate:** a fresh newcomer playtest of each line-up game's first ten minutes (an AI that didn't build it, plus one
family member) scores 17/18 or better. Under 17 is fixed first, or the game moves to the Workshop.

### Phase 2: Core fun (about 4 to 6 cycles)

**Goal: the loop you repeat is a pleasure. "Is it fun?" reaches 3/3.**

- **Wildbond:** battles with real choices, creatures that look different, the first areas explorable, the catalogue
  growing (section 6). Hits, sounds and rewards that land.
- **Realmbound:** the climb from 1 to 60 made quick and rewarding: pacing, quests told by people, rewards that come
  often, fights that feel good.
- **Starfall:** one full season: mastery ranks, trust, veteran requests, darkness, a festival; Starfall Guild's best
  loop folded in.
- **Diamond Manager:** a game you play inside (dugout decisions), upgrades you can see working.
- **Little Ranch:** more baby friends, places to visit, a bedtime routine parents trust.
- **Engine (C), as each game is touched:** split each Godot game into systems, and a **shared Godot kit** (controls
  and touch, dialogue, safe saves, the calendar, sound, onboarding) that both use. An art pass so Wildbond and Starfall
  reach the quality Evan wants.

**Gate:** a second newcomer playtest per line-up game: 17+ overall **and** 3/3 for fun; at least two people play a
second session unasked.

### Phase 3: Launch, Generations 1.0 (about 2 cycles)

**Goal: a release we're proud to send to anyone.**

- **Release candidate:** feature freeze, a cycle of bug fixing only, every check green, old saves load.
- **Packaging:** the Wildbond media kit (section 6), a trailer for the site, store-style pages, Windows builds, release
  notes in plain words, Little Ranch's app polished.
- **Listening (D):** a feedback button in every line-up game; "what did you think?" after the first session.
- **Send it:** a wider wave of friends, then whoever Evan chooses.

**Gate:** shipped; the first strangers' reports are answered within a day.

### Phase 4: Live and grow (ongoing)

**Goal: reasons to come back, one season at a time; new games one at a time.**

- **Content seasons:** Wildbond's post-game (Spire, rematches, roaming legendaries, contests, baby forms, fishing, new
  catalogue batches), Starfall's expeditions as first-person delves, Diamond Manager's long league.
- **End-game when players ask for it**, Realmbound's raids included.
- **The Incubator feeds the line-up** (section 7).
- **Monetisation**, if Evan decides to (section 8).

---

## 6. Wildbond: the catalogue and the nostalgia

The headline game has to feel like **a new, exciting Pokémon-like experience**: polished, with a catalogue worth
filling and the kinds of media that hit the same nostalgia, while every creature, name and picture is our own.

**Polish first (Phases 1-2):** the first areas at their best, creatures that look different, battles with choices,
sound and hits that land, the art raised to the standard Evan wants (the Game assets thread leads, with the art
direction review).

**The catalogue (Phases 2-4):** more creatures in batches, each with its own look, home, behaviour and dex line; rare
variants that play differently; evolution lines that surprise; regional forms tied to areas and seasons; the
catalogue shared with Starfall's wilds and Little Ranch's babies.

**The nostalgia kit (built through Phases 2-3, shipped with 1.0):**

- **A game box and a manual**: front art, back-of-box screenshots, a fold-out map and a short illustrated manual,
  like the ones you kept as a kid (VISION.md's game boxes).
- **The starter choice as an event**: three partners, a moment you remember.
- **A soundtrack you can hum**: a main theme, a battle theme, a town theme, a soundtrack page.
- **Trading cards**: a card for every creature, generated from its figure (and the seed of the card shop).
- **An opening**: a short intro sequence, the way the classics opened.
- **The dex as a collection**: seen and bonded marks, completion rewards, a printable poster of the catalogue.

---

## 7. The Incubator: the gold mine, earned one slice at a time

Lantern Bowl (football), Keymaster (real estate), the card shop, The Crossing and Main Street all have real potential.
To keep them without spreading thin:

1. **Pitch** (already done for most): one page, the fun in one sentence, the scorecard.
2. **Ten-minute slice:** the smallest version that shows the fun. **At most one slice in progress at a time**, built
   only when a cycle has room (usually a helper with spare usage).
3. **Gate:** the slice passes the newcomer test at 15/18 or better, and the family wants more.
4. **Graduate:** it joins the Workshop, then the line-up when a slot opens. One in, one out.

Order, by score and Evan's interest: **Lantern Bowl** (a slice exists; next the full drive), **Keymaster** (one
listing, one analyzer, one buy), **the card shop** (after Wildbond's catalogue and cards exist), The Crossing, Main
Street.

---

## 8. Monetisation: a plan for later, not now

No money changes now. Over Phases 3-4, research and decide. Ground rules that fit what we already believe:

- **Never pay-to-win, never paywalled automation**, never ads or purchases in the kids' game.
- **Fair options, from least to most effort:** a "pay what you want" page or tip jar (itch.io); a supporters' page
  (Ko-fi or Patreon) with thanks in the credits and early looks; **Wildbond as a paid game** on itch.io and later
  Steam once it's a finished 2.0; a paid, ad-free **Little Ranch app** parents trust; cosmetic extras (box art prints,
  the soundtrack, card sets).
- **Before any of it, the groundwork:** check that every outside asset's licence allows commercial use (most of ours
  are CC0; check each CC-BY and AI-generated one), keep every creature, name and picture our own (no Pokémon names or
  look-alikes), choose a studio name, and get advice on any legal or tax steps. Evan decides each step; nothing is
  paid for without asking him.

A research ticket for Phase 3: **MON-1**, a one-page comparison of these options with costs, store fees and what each
needs from us.

---

## 9. Decisions for Evan

1. **The shelves:** Wildbond headline; Little Ranch for kids; Starfall, Realmbound (early game), Diamond Manager and
   the arcade row in the line-up; Otherworld, Diamond Career and Lantern Bowl in the Workshop; Classics hidden?
2. **The one-week cycle with a Play day**, three build slots (Wildbond, Little Ranch, one rotating)?
3. **Approve the phases and gates**, so lane P can post the first "This cycle" today.
4. **The Incubator order:** Lantern Bowl, Keymaster, the card shop, The Crossing, Main Street?
