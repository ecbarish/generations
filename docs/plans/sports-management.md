# Sports, reworked: manage the club (Diamond Manager), then football (Lantern Bowl) and hockey (Lantern Ice)

Written 2026-10-09 by Claude (sports thread) after Evan played Diamond Career:

> "launching the diamond game the scale of everything is crazy and its not clear what to do either. And I am yet to
> figure out how to hit the ball. I think a baseball game that you play is going to be too difficult at least for now.
> So maybe one where you manage the team and watch what happens and make trades and do contracts based on ratings and
> contracts. A retro bowl game is probably much more reachable ... Team management and hiring and doing different
> things is one of the most fun things to do, and maybe we can upgrade the stadium and stuff ... We need someone that
> checks if these games are even reasonably playable."

Evan's message is his yes for both directions below. It replaces the batter-first career (docs/plans/diamond-career.md)
as the baseball direction; that prototype stays in the repo, untouched, but leaves the arcade shelf.

## What makes sports management fun (research, from published reviews and the games' own descriptions)

| Game | What players love | What we take |
|---|---|---|
| *Retro Bowl* (New Star Games, closed source, GameMaker) | Short drives you play yourself; between games a tiny front office: coaching credits to spend, a salary cap, star players with morale, facilities you upgrade (stadium, training, rehab), the owner and fans who judge you | The rhythm: one short game, then one or two decisions. Facilities as the long goal. A few players with names you remember |
| *Out of the Park Baseball* | Depth of a real front office: ratings, contracts, trades, minor leagues | Ratings that clearly decide results; contracts as the main tension. **Not** its spreadsheet look |
| *Baseball GM / Football GM* (ZenGM, browser) | Fast seasons, trade logic you can read ("they want more"), many seasons in one sitting | Fast simulation, a trade screen that says *why*, a career of many seasons |
| *Football Manager* | Watching your choices play out; story in the match feed | A readable play-by-play while you watch, with speed controls |
| *Two Point Hospital*, *Theme Park* style builders | Upgrading a building you can see | The ballpark grows on screen as you upgrade it |
| *Super Mega Baseball* | Stylised players with simple, clear traits | Short readable ratings (Contact, Power, Eye, Glove; Stuff, Control, Stamina) |

### Mobile sports games (Evan, 2026-10-11: "investigate other mobile games and see if there's something we can model off")

| Game | What players love | What we take (ticket) |
|---|---|---|
| *Retro Bowl* and *Retro Bowl College* (New Star Games) | You play only the moments that matter (your offence's drives); the sim does the rest; a game takes minutes | **Key moments you play** (DM-K): in baseball, call the pitch or the batter's approach in the big spots |
| *New Star Soccer*, *Retro Goal* (New Star Games) | A career told through people: relationships, headlines, a manager who reacts | **News and people** (DM-N): a paper after each day, owner and fan opinions |
| *OOTP Baseball Go* (mobile Out of the Park) | Real depth on a phone: full stats, a live game view, one-tap sim when you only want results | Already taken: box scores, stats, live view (DM-G). Next: **highlights speed** (DM-H) |
| *Baseball 9*, *MLB 9 Innings* (Com2uS) | Arcade pitching and batting choices plus team building and training; players with special skills | **Traits** (DM-M); pitch types for the pitch call (DM-K). **Not** their card packs, energy timers or paid boosts |
| *Super Mega Baseball* | Traits and "mojo" (confidence) you can read on each player; a difficulty slider (Ego) | **Traits and confidence** (DM-M); a difficulty setting later |
| *Football Manager Mobile*, *Top Eleven* | Short sessions; 2D highlights of your match; shouts from the touchline | **Highlights speed** (DM-H): watch only the chances, skip the rest |

The pattern every hit shares: **you act at the big moments, the simulation handles the rest, and the game is short.**
Our Diamond Manager has the watching and the managing; what it lacks is a moment where your own call decides a
pitch. That is DM-K, the first ticket below. Nothing here copies a game's names, screens or art.

The lessons: **ratings must visibly matter** (a better lineup wins more, and the game says so); **every decision is
small and quick** (no screen of 40 columns); **money is the tension** (payroll vs. upgrades vs. keeping stars);
**watching is the reward** (a game you can follow, skip or speed up); **a long goal you can see** (the park).

Why Retro Bowl itself can't be used: its code and art are New Star Games' and not open. We build an original game
in its spirit, with our own code, names, art and rules. We copy no names, screens or graphics.

## Game 1: Diamond Manager (the baseball rework), browser, `games/diamond-manager/`

You are the new general manager of the **Brackenport Lanterns**, the worst club in a six-club league (the same
fictional clubs Diamond Career already uses). Iona Vale, who coached you in Diamond Career, is your field manager.

**The loop, one game at a time (about a minute each):**
1. **Game day.** Set the batting order if you want (or leave Iona's). Press *Play ball*: the game plays out on the
   field with a running play-by-play you can speed up or skip to the final.
2. **After the game:** the gate money comes in, a short note from Iona says what decided it (in words, from the real
   events), and one decision is usually waiting: a trade offer, an unhappy player, a free agent, an upgrade finished.
3. **Front office, any time:** the roster with ratings; trades with the other five clubs (the other GM says yes, or
   what they'd want); free agents and contract renewals; the ballpark upgrades.
4. **Season:** 30 games, then a best-of-three final for the top two. Offseason: players age and grow or decline,
   contracts end, you re-sign or let go, and new free agents arrive. Seasons continue forever.

**Ratings (0 to 99, shown as a number and a word):** batters have Contact, Power, Eye and Glove; pitchers have Stuff,
Control and Stamina. Overall is their average. Age changes ratings each offseason (young players grow, players past
31 slip). The simulation is plate appearance by plate appearance from these numbers, so a better roster wins more
and the play-by-play explains why ("Pell struck out on Venn's sinker").

**Money:** a payroll limit (the owner's budget) and the club's own cash. Gate money per home game depends on wins,
ticket demand and the park. Cash pays for upgrades; payroll pays players. Contracts have salary and years.

**The ballpark (the long goal you see):** Seats (more gate money), Lights (night games draw more), Training rooms
(young players grow faster), Scouting office (better free agents appear), Clubhouse (happier players ask for less).
Each has levels and shows on the field drawing.

**Hiring:** a Hitting coach and Pitching coach you choose from candidates with a salary and a specialty; they add
growth to their kind of player. (Retro Bowl's coordinators, made ours.)

**Automation (earned, never paywalled):** *Sim to the final* works from day one (Evan: "watch what happens"); after
the first season, "Iona sets the lineup" and "auto-renew under a price" become options.

**The game window rule:** the field fills the screen; the front office is a clipboard you open over the field, not a
side panel. Text is in full words.

### The road (each about one pull request; claim with a draft PR titled with the ID)

- [x] **DM1** [Claude] (done 2026-10-09, PR #110) The first playable season: roster with ratings, watch or sim a game with play-by-play,
  standings, gate money, trades with a readable answer, free agents and contracts, stadium upgrades, offseason
  aging and renewals, save and load. `tests/diamond-manager.html` passes.
- [x] **DM2** [any] **Playability pass** (done 2026-10-09, Claude (Playtester): docs/playtests/diamond-manager-1.md; scores 15, passes) (Evan: "someone that checks if these games are even reasonably playable").
  Play two full seasons as a first-timer on desktop and a phone-sized window. Write
  docs/playtests/diamond-manager-1.md: what was unclear in the first five minutes, any number that felt wrong (a
  .400 hitter, a 20-1 club), screenshots. Fix the top three problems; add a check for any balance fix.
- [x] **DM-B** [Claude, done 2026-10-11, v0.2.0] **Make the general manager's choices matter** (from DM2): today a sensible active manager wins no
  more than a hands-off one over two seasons. Target 3 to 5 more wins a season and a final by about season 3; options
  in docs/playtests/diamond-manager-1.md. Add a simulation check for the gap.
- [ ] **DM3** [any] **Hiring coaches** (ready: Codex, PR #196, 2026-10-11): two coach slots (hitting, pitching), three candidates each offseason with a
  salary and a specialty (young players, power, control). Their effect is a visible growth bonus in the offseason
  report. Checks: a coach changes growth by the stated amount; old saves load.
- [ ] **DM4** [Codex, ready PR #207; after #196] **Player morale and stories**: each player has a mood (playing time, winning, contract); unhappy
  stars ask for a trade or more money. Iona's notes mention them by name. Checks: benching a star lowers mood;
  mood changes the asking price by the stated amount.
- [ ] **DM5** [any] **The ballpark you see grow**: draw each upgrade on the field (bigger stands, light towers,
  scoreboard, flags for titles). Screenshots required. Uses the shared look (shared/engine.js drawing helpers).
- [x] **DM6** [Claude, done 2026-10-11, v0.3.0] **A draft and player development** (Evan: "we need to add the draft and the
  development of players"): ceilings, growth toward them (faster when playing every day), scouting precision, a
  three-round draft of 24 prospects (worst first), a six-player farm club, call-ups and send-downs. 37 checks.
- [x] **DM-G** [Claude, done 2026-10-11, v0.5.0] **The game you watch and manage** (Evan: "The game is pretty basic
  right now. I'd love to see more of the game rather than a description ... more stats and a box score ... pitcher
  management, pinch hit or run"): pitch-by-pitch engine (js/game.js) with fatigue, individual relievers, pinch hitters
  and runners, Iona's questions at big moments, an animated field, box scores, season/last/career stats, league
  leaders, a Speed rating, double plays, stolen bases, defensive changes and pitcher rest (Evan: "those other ideas
  sound good"). Ideas left for any assistant: positions that matter (a shortstop playing first), a hit-and-run and
  bunts, sound for the crack of the bat, a trophy room.
- [x] **DM-T** [Claude, done 2026-10-11, v0.4.0] **Trading and a trade finder** (Evan: "We also need trading and trade
  finder"): find the cheapest deal for any player, shop one of ours to every club, "What would make it work?" in the
  trade table, prospects tradeable, ceilings in trade value. Later ideas for any assistant: trading draft picks and
  cash, other clubs trading with each other, a trade deadline.
- [ ] **DM-K** [any] **Key moments you play** (the Retro Bowl idea for baseball). In games you watch, at a big
  spot (7th inning or later, close score, runners in scoring position, or any at-bat you choose with a Call it button):
  on defence you pick the pitch (fastball, breaking ball, changeup) and where (inside, outside, low); on offence the
  batter's approach (take a pitch, swing away, protect the plate, bunt, hit-and-run). Each batter and pitcher has a
  readable strength and weakness (from the ratings, shown on the name tag), and a call that plays to them shifts the
  odds a little (about 10 to 20 per cent), never a sure thing. No timing or reflexes; every choice in full words.
  Iona can call it for you. Checks: a good call raises the success rate over 2,000 trials, a bad call lowers it, a
  league season's scoring stays within the current bounds.
- [ ] **DM-H** [any] **Highlights speed**: a fourth watch speed that skips to the moments that matter (runners on,
  late and close, Iona's questions, key moments, home runs), shown on the field, with the box score kept whole.
- [ ] **DM-M** [any] **Traits and confidence**: one or two traits per player in full words ("Clutch hitter",
  "Fastball hunter", "Workhorse", "Ground-ball pitcher"), a confidence that rises with hits and wins and falls in a
  slump, shown on the roster and name tags, and small, tested effects on results.
- [ ] **DM-N** [any] **The club's news and people**: the Lamplight paper after each day (two or three headlines from
  real results), and owner and fan opinions that react to winning, payroll and the park, as Retro Bowl does.
- [ ] **DM-B2** [Codex, PR #208; six-season measurements in diamond-manager-balance.md] **Keep the league in balance over many seasons**: in a six-season simulation the other clubs'
  average overall climbs from about 56 to 64 (it climbed to 62 before DM6 too), while the free-agent market stays at
  level 50, so a hands-off club falls to about 5 wins. Make free agents and standouts track the league's average
  (or slow the other clubs' growth) so the market stays useful; keep the gap check passing and add a check that the
  league average stays within about 4 points over six seasons. Harness idea: the gap check in
  tests/diamond-manager-checks.js, run for six seasons.
- [ ] **DM7** [Codex, PR #209; docs/diamond-manager-history.md] **Records and history**: season-by-season table, league awards (best hitter, best pitcher),
  club records, a trophy case in the clubhouse.
- [ ] **DM8** [Claude or any, later] **Step into the big moment** (optional): in close late innings, offer the old
  Diamond Career at-bat (tactical mode only) for one pinch-hit. Only after DM2 says the core is fun.

## Game 2: Lantern Bowl (working title), a football game in the Retro Bowl spirit, browser

The Brackenport Lanterns also field a football club. You are its head coach and general manager.

**What you play:** your offence's drives. Each drive is a few plays: pick from four plays (run, short pass, deep
pass, play action), then a short, readable passing moment: receivers run their routes on a small side-on or
top-down pixel field, you tap a receiver to throw (or drag-aim, later), the ball's success depends on timing,
coverage and ratings. Defence and kicking simulate, shown as a quick summary. A game is about six of your drives,
two to four minutes.

**Between games (the front office):** a salary cap; about twelve named players who matter (QB, RB, two WR, TE,
O-line as one rating, defence as three ratings, kicker); coaching points to spend on training or morale; facilities
(stadium, training, rehab) as in Diamond Manager; a draft each offseason; owner and fan satisfaction.

**Shared with Diamond Manager** (the "two birds" rule): the contracts, payroll, trade answer, facility upgrades,
season, standings and save code are written once in `shared/sports-office.js` (extracted by LB1 from Diamond
Manager, not copied), so both games improve together.

### The road

- [x] **LB0** [Claude, done 2026-10-11: [lantern-bowl.md](lantern-bowl.md)] One-page pitch with three mock screens (the field, a play call, the office) in
  docs/plans/lantern-bowl.md, checked by the Design decisions thread for anything too close to Retro Bowl's look.
- [x] **LB1** [Claude, done 2026-10-11: shared/sports-office.js; a sport defines a SPORT object with its overall, roster rule, lineup, role and follow-ups] Extract the office code from Diamond Manager into `shared/sports-office.js` with no behaviour
  change (all Diamond Manager checks still pass). Make it sport-neutral (positions, rating names and the game
  simulation passed in), since hockey and later sports reuse it.
- [ ] **LB2** [any] **One drive, playable**: field, four play calls, the passing moment, first downs, a touchdown.
  Keyboard and touch. Checks: downs and distance rules, scoring, a seeded drive is reproducible.
- [ ] **LB3** [any] **One full game**: alternating drives, simulated defence, clock and quarters, a final.
- [ ] **LB4** [any] **A season and the office**: twelve-game season, roster, cap, contracts, facilities, draft
  (reusing shared/sports-office.js).
- [ ] **LB5** [any] **Playability pass**, as DM2.

## Game 3: hockey (working title Lantern Ice), after baseball and football

Evan, 2026-10-09: "id also like a hockey game (eventually all sports but those 3 sports are my favorite)". Baseball,
football and hockey are his three favourites; every sport is the long-term goal. So the front office is built once and
shared: **shared/sports-office.js** (LB1) holds ratings words, salaries and asking prices, contracts and renewals, the
trade judge, free agents, the owner's budget, facilities, staff hiring, schedules, standings and saves. Each sport
supplies only its positions, its rating names and its game simulation (plus what you play, if anything). Adding a
sport should mean writing a new simulation and a few screens, not a new front office.

**The shape:** the Lanterns' hockey club. You manage, and in each game you can step in for a few short moments (a
power play or a shootout: pick the shot, aim, shoot), the way Lantern Bowl lets you play drives. Lines (three forward
lines, two defence pairs, a goalie) are the hockey version of the batting order. The ice rink upgrades like the ballpark.

- [ ] **HK0** [any, after LB4] One-page pitch with three mock screens in docs/plans/lantern-ice.md.
- [ ] **HK1** [any] A hockey game simulation from ratings (shots, saves, penalties, power plays) with a play-by-play,
  reusing shared/sports-office.js for everything off the ice. Checks: believable scores (about 5 to 7 goals a game),
  better ratings win more, seeded games are reproducible.
- [ ] **HK2** [any] The shootout moment, playable. **HK3** [any] Season, lines and office. **HK4** [any] Playability pass.

## Owner decisions still open (route to the Design decisions thread first; only goals and money go to Evan)
- Whether Lantern Bowl starts now or after DM2 (PRIORITIES places it; default: LB0 and LB1 may start now, LB2 after
  the Wildbond 2.0 focus allows).
- Whether purchases and upgrades affect play (default here: yes for the ballpark, since that is the goal Evan named).
