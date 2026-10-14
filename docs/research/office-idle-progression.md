# Office idle progression: research for the four first versions

**For:** Night Market Stalls (A), Card Shop lite (B), Saltmarsh Shipping Office (C), Desk Plant Lab (D), all built on one shared idle core.
**Evan's brief:** progression and improvement are the key features.
**House rules this doc respects** ([village-and-business-review.md](village-and-business-review.md)): do the job yourself before you hire; managers are people with habits, not multipliers; a reset is a move somewhere new; offline time is capped and never beats active play; avoid the multiplier treadmill; information shows up in the world; no ads.

Labels used below: **[Sourced]** means the fact comes from the linked page. **[Opinion]** means it's our design judgement. The doc never makes up numbers. Where a number isn't sourced, it's marked as a tuning target.

---

## 1. Progression structures that last days and weeks

| Structure | What it does | Example **[Sourced]** |
|---|---|---|
| Exponential generator costs | Every purchase costs more than the last, so income growth eventually slows and the next layer gets a reason to exist | AdCap's Lemonade Stand: cost growth 1.07 per unit, base cost 4, 1.67/s each ([Pecorella I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i)). Cookie Clicker buildings: +15% per purchase, so the price roughly doubles every 5 ([CC wiki](https://cookieclicker.fandom.com/wiki/Building)) |
| Ownership milestones | A big bump at a set count gives you a target to save toward | AdCap gives a stacking x2 at 25 and 50 owned, and purchases cluster just before those counts ([Pecorella I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i)) |
| Staggered tiers | Each new generator pays back more slowly, which spreads the pace out across days | Initial payoff time in Cookie Clicker: Cursor 2.5 min, Farm 2.3 min, Bank 16.7 min, Wizard Tower 2.1 h, Portal 1.16 days ([CC wiki](https://cookieclicker.fandom.com/wiki/Building)) |
| Shifting priorities | Good tuning lets older generators matter again instead of the newest one always winning | Pecorella shows that varying the milestone multipliers per generator changes which one leads over time ([Pecorella I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i)) |
| Prestige / reset | Start over with a lasting boost, the "ladder climbing" effect | Prestige currency: AdCap 150·√(lifetime/1e15); Cookie Clicker ∛(lifetime/1e12); Egg Inc (run earnings/1e6)^0.14. Doubling it takes about 3-4x (AdCap), about 8x (Cookie Clicker), or 128x (Egg Inc) more earnings ([Pecorella III](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-iii)) |
| Phase changes / unfolding | New systems open up partway through, and the game changes shape | Universal Paperclips moves from making clips by hand, to business, to space, and ends ([play it](https://www.decisionproblem.com/paperclips/)). Pecorella names "unfolding new features" as one place the fun can live ([Pecorella III](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-iii)) |
| Minigames that open on level-up | Depth gets added without more multipliers | Cookie Clicker's Garden, Grimoire, Pantheon and Stock Market open when you level buildings with sugar lumps ([CC wiki](https://cookieclicker.fandom.com/wiki/Building)) |
| Achievements and collections | Long-tail goals | Players report 637 achievements in Cookie Clicker and AdCap 100% runs lasting months (see §6) |
| Finite vs endless | An ending gives closure; endless play needs layers | The CHI 2018 taxonomy of 66 idle games describes the genre moving players "from playing to planning" ([Alharthi et al.](https://par.nsf.gov/servlets/purl/10061230)) |

**[Opinion]** For office play, prefer phases and visible unlocks over stacked multipliers. One reset layer per game is enough for a first version. Finite (C) and endless (A, B, D) both work, as long as each run has an ending-shaped goal.

## 2. A satisfying upgrade vs a treadmill

**[Sourced]**
- **Cost growth sets the pace.** 1.07 (AdCap) is gentle, so you keep buying and milestones carry the run. 1.15 (Cookie Clicker) is steep, so each building tier stalls sooner and you have to move up tiers ([Pecorella I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i), [CC wiki](https://cookieclicker.fandom.com/wiki/Building)).
- **Bulk buying is a decision tool.** Players don't follow the optimal one-at-a-time path. They buy in bulk or to round numbers. Closed-form bulk cost: b·r^k·(r^n−1)/(r−1). Max affordable: floor(log_r(c(r−1)/(b·r^k)+1)) ([Pecorella I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i)).
- **Tiny buys feel worthless.** A cheap generator that is "technically optimal" but makes no felt difference is "not worth the effort to consider purchasing" (Pecorella I).
- **Runs should be bumpy.** Make both runs and resets uneven, with fast stretches after big milestones (Pecorella III).

**[Opinion] Tests for a satisfying upgrade (use them in review):**
1. **You can see it in the world:** a new lantern, another shelf, a bigger boat, a new leaf. House rule: five logs look like five logs.
2. **It changes what you do,** not just a number: a new route, a vendor habit, a plant trait.
3. **A new decision about every 30-90 s while active, and one meaningful choice per return visit.** These are tuning targets, not sourced figures.
4. **Avoid pure "+x%" upgrades.** Cap them at one kind per game and make the rest of the upgrades verbs and places.

## 3. Genre complaints and how the best games avoid them

| Complaint | Player voice (see §6) | How others avoid it **[Sourced where linked]** | Our rule **[Opinion]** |
|---|---|---|---|
| Walls / weeks of grind | AdCap praised for being "not as frustrating as other idle games with large weeks-long sections of grinding" | Milestone multipliers lift you back over the cost curve (Pecorella I) | A milestone is always within one session |
| Monetised waiting | AdCap: "Artificial friction to make you buy the microtransactions" | n/a | No purchases at all (house rule) |
| Forced clicking | AdCap: events "force you to manually click for far >10 mins" | n/a | Hand work is short and only at the start |
| Offline feels pointless *or* unfair | Cookie Clicker: "Leave it overnight and you get just about 10% of what you already had" | Melvor simulates offline time in full, up to 24 h, then shows a summary ([wiki](https://wiki.melvoridle.com/w/Offline_Progression)). Egg Inc: each silo stores 1 h, up to 30 h max; the standard permit pays offline at half the online rate ([wiki](https://egg-inc.fandom.com/wiki/Silos)) | Capped, below active, but clearly worth it, and you unpack it in the world |
| Online-only / broken saves | Melvor: "requires connection to server. It needs an offline mode"; "Cloud saves being broken ruined all progression" | n/a | Local saves, versioned, plus backup strings |
| Repetition | AdCap: "gets repetitive and boring real quick" | Phase changes and minigames (§1) | Each tier adds a verb or a place |
| Throttled tabs | n/a | Chrome intensive throttling: hidden tabs drop to one wake-up per minute ([Chrome blog](https://developer.chrome.com/blog/timer-throttling-in-chrome-88)). Melvor runs offline catch-up on throttled tabs | Elapsed-time deltas everywhere |

## 4. Concepts A-D

All timings are **[Opinion] tuning targets**.

### A) Night Market Stalls
- **Spine:** serve by hand, hire vendors (people with habits), stalls change at 25/50/100, then move to a new district (the reset).
- **First 5 min:** tap customers at a lantern stall. Serving 25 earns your first named vendor, who grumbles about rain. A second stall type appears.
- **First hour:** 3-4 stalls, each looking different at 25/50. Vendor habits start to matter (the early riser, the chatter who sells slower but gets tips). You meet your first district goal.
- **Day 2:** the away summary reads like vendor gossip. The market's look at 100 lands. The "Move district?" choice appears, carrying one favourite vendor (house rule).
- **Week 1:** 2-3 districts, each with its own customers and a new stall type. A collection of vendor stories.
- **Borrow:** AdCap's 1.07 pace and its 25/50 milestones; Cookie Clicker's flavour text.

### B) Card Shop lite
- **Spine:** run the till yourself, stock shelves, hire a clerk, open a branch (Main Street loop). The reset is a new town, and Wildbond cards slot in later.
- **First 5 min:** ring up customers, restock empty shelves (visible), and unlock placeholder stock types.
- **First hour:** first clerk (with a habit); the second branch appears on a small street map.
- **Day 2:** a restock wagon waits to be unpacked (capped offline). The first branch manager has a quirk.
- **Week 1:** 3-4 branches and the choice to move to a new town. Shelves as a collection board.
- **Borrow:** AdCap's manager-per-business, but done as people; Egg Inc's sense that each run is self-contained.

### C) Saltmarsh Shipping Office (finite)
- **Spine:** rowboat, fleet, trade routes, lighthouse network, ending. Captains run timed routes, and the dock warehouse caps how much piles up while you're away, like Egg Inc's silos.
- **First 5 min:** row cargo by hand, three short trips. Buy a second boat.
- **First hour:** first captain. The activity log starts ("Capt. Wren back, 12 crates, gull stole one"). Phase 2 (fleet) opens.
- **Day 2:** queue longer routes before leaving and come back to the log. More warehouses means longer away time, at a lower rate than active play.
- **Week 1:** lighthouse phase, then an ending within roughly 1-2 weeks of light play.
- **Borrow:** Paperclips' phase reveals and ending; Egg Inc's 1 h-per-silo cap structure (Egg Inc itself pays offline at half rate on the standard permit).

### D) Desk Plant Lab
- **Spine:** species are generators, cuttings are the prestige, and a 24 h grow lamp is the offline cap.
- **First 5 min:** water one odd plant by hand and watch it visibly sprout. Discover a second species.
- **First hour:** 3 species and the first trait (it leans toward the window). The first cutting is possible.
- **Day 2:** the lamp has run. A plant has bloomed. Take a cutting and repot it on a new desk (reset as a move).
- **Week 1:** a species catalogue, hybrid traits, and a full desk.
- **Borrow:** Melvor's 24 h cap and away summary; Cookie Clicker's garden.

## 5. Shared idle core requirements

| # | Feature | Why / source |
|---|---|---|
| 1 | **Elapsed-time tick** (Date.now deltas, clamped) | Chrome throttling ([blog](https://developer.chrome.com/blog/timer-throttling-in-chrome-88)) |
| 2 | **Capped offline catch-up + away summary**, per-game cap and rate ≤ active | House rule; Melvor 24 h summary; Egg Inc silos |
| 3 | **Bulk buy x1/x10/max** using Pecorella's closed forms | Pecorella I |
| 4 | **Milestone engine** (count thresholds, visual hooks, effect) | AdCap 25/50 |
| 5 | **Unlock/phase system** (conditions, then reveal UI or place) | Paperclips; CC minigames |
| 6 | **Prestige layer API** (formula plug-in: root of lifetime or of the run; carry-over list such as a favourite vendor) | Pecorella III |
| 7 | **Achievements/collections** | CC, AdCap |
| 8 | **Next-goal bar** (the nearest milestone) | [Opinion] |
| 9 | **Tab-title income** (optional) | [Opinion], for office use |
| 10 | **Muted by default** | [Opinion] |
| 11 | **Boss-safe skin** (plain spreadsheet-like theme) | [Opinion] |
| 12 | **Save versioning + migrations**, built on shared/engine.js backup strings | Melvor cloud-save complaints |
| 13 | **Activity log** (C uses it, A uses it for gossip) | [Opinion] |

Note: shared/engine.js uses plain JS numbers, which top out near 1.8e308. Cookie Clicker's building prices hit that ceiling ([CC wiki](https://cookieclicker.fandom.com/wiki/Building)). **[Opinion]** Keep our curves small (the house rule favours small numbers), so we don't need a big-number library.

## 6. Players love / hate

All quotes are short excerpts from Steam reviews; each link was checked and loads.

**Cookie Clicker**
- Love: "Fun and well made game to idle when you're away or doing anything on your computer" ([review](https://steamcommunity.com/profiles/76561199605068229/recommended/1454400/))
- Love: "great idle game to play while studying" ([review](https://steamcommunity.com/profiles/76561199010204909/recommended/1454400/))
- Hate: "Leave it overnight and you get just about 10% of what you already had" ([review](https://steamcommunity.com/profiles/76561199888523724/recommended/1454400/))

**AdVenture Capitalist**
- Love: "Managers, upgrades, and Angel Investors keep the numbers climbing" ([review](https://steamcommunity.com/profiles/76561198662624462/recommended/346900/))
- Love: "Not as frustrating as other idle games with large weeks-long sections of grinding" ([review](https://steamcommunity.com/profiles/76561199664537274/recommended/346900/))
- Love: "you can just log in for a few minute every day" ([review](https://steamcommunity.com/profiles/76561198396298703/recommended/346900/))
- Hate: "Artificial friction to make you buy the microtransactions" ([review](https://steamcommunity.com/profiles/76561198230932564/recommended/346900/))
- Hate: "fun game when money is flowing but it gets repetitive and boring real quick" ([review](https://steamcommunity.com/profiles/76561199031877381/recommended/346900/))

**Melvor Idle**
- Love: "Skills that level through use, collection bonuses... plenty of content to let run when I'm doing other stuff" ([review](https://steamcommunity.com/profiles/76561197998260175/recommended/1267910/))
- Love: "Good work distraction (low resource can run in background...)" ([review](https://steamcommunity.com/profiles/76561198090212019/recommended/1267910/))
- Hate: "Single player idle game that requires connection to server" ([review](https://steamcommunity.com/profiles/76561198072876078/recommended/1267910/))
- Hate: "Super boring... you need to afk it so much to do something" ([review](https://steamcommunity.com/profiles/76561198150803152/recommended/1267910/))

**Patterns [Opinion]:** players love light background play, people and managers who keep things moving, and collections. They hate monetised friction, forced clicking, stingy or online-only offline progress, broken saves, and sameness.

**Gaps:** I didn't collect verified quotes for Egg Inc., Idle Miner Tycoon, Universal Paperclips, Kittens Game or Antimatter Dimensions (mobile, web-only, or not fetched). Those are left out rather than guessed at. Follow-up: r/incremental_games and app-store reviews.

## 7. Features to try (ranked)

| Rank | Feature | Suits | Why |
|---|---|---|---|
| 1 | Away summary you unpack in the world | A B C D | Fixes the top offline complaint while keeping offline below active |
| 2 | Visible milestone changes (25/50/100) | A B D | AdCap milestones plus the in-world rule |
| 3 | Hand work, then a named hire with a habit | A B C | House rule; AdCap managers done as people |
| 4 | Phase reveals | C (A, D lightly) | Paperclips; fights repetition |
| 5 | Next-goal bar | A B C D | Always a target |
| 6 | Bulk buy x1/x10/max | A B D | Pecorella I |
| 7 | Silo-style capped storage you can upgrade | C D | Egg Inc |
| 8 | Activity log / gossip feed | C A | Return-visit story |
| 9 | Reset as a move with one carry-over | A B D | House rule + prestige API |
| 10 | Collections/catalogue | D B A | Melvor and CC love |
| 11 | Boss-safe skin + mute + tab-title income | A B C D | Office use |
| 12 | Clear ending | C | Paperclips |
