# LB-G13: headless full-season simulation test

Backlog row LB-G13, for LB-SEASON. `node tests/lantern-bowl-season-sim.cjs` plays whole Lantern Bowl seasons with nothing but the data on `main` and the pure standings module, to prove that the season pieces fit together before the manager is built. It is a test and a README only: no game file, no save field, no version change, no pack.

## What it reads

- `games/lantern-bowl/season.json`: six clubs, 10 weeks, three games a week (30 fixtures, every club plays 10), a four-team bracket.
- `games/lantern-bowl/roster.json`: 22 players per club.
- `games/lantern-bowl/standings.js`: `LanternBowlStandings.table`, `bracket` and `advance`.
- `games/lantern-bowl/progression.json`: XP, levels, potential caps, aging, floor 35, ceiling 90.

It does not load `lineup.js` or `training.json`. The match score model is the test's own and is not the game's engine: a club's strength is the average of its players' average ratings, and the winner is drawn with a logistic on the strength difference (scale 14, so a 14-point edge wins about 73 percent of games). Scores are made up only so that the table and the bracket have something to count (the loser scores a multiple of 3 from 0 to 18 and the winner 1 to 15 more, so there are no ties).

## What one season does

1. Play the 30 fixtures in `season.json`'s order, home and away as written.
2. Build the table with `LanternBowlStandings.table`, the bracket with `bracket`, play the two semi-finals, and take the final's two clubs from `advance`. The final is played with the same model, and its winner is the champion.
3. Give every player XP for the games their club played (10, plus one or two playoff games) from a made-up per-position workload: every player gets a start, quarterbacks and running backs touchdowns, running backs, receivers and tight ends catches, the front and backers tackles and sometimes a sack, the secondary tackles, the kicker made kicks, all priced with `progression.json`'s `xp` table, plus the win XP for each club win. Then level them up with `progression.json`'s rules, apply the aging change for the age just played, make them a year older and apply the new age cap. This follows the contract at the top of `tests/lantern-bowl-progression.cjs` (LB-G3).

## What it checks (14 checks, all pass)

- The season has 10 weeks of 3 fixtures, and each of the 200 seeded seasons plays 30 games.
- Each of the six clubs plays 10 games in every season.
- The table adds up in every season (30 wins, 30 losses, points for equal points against) and is ordered by wins.
- The bracket is valid in every season: four different clubs in seeds 1 v 4 and 2 v 3, a final between the semi-final winners, and one champion.
- `harrowgate` has the highest average rating and `fernmoor` the lowest, `harrowgate` wins the Lamplight Cup more often than `fernmoor`, and in less than 70 percent of seasons.
- Every rating stays within 35 to 90 after the age-and-level step at the end of each of the 200 seasons, and after five chained seasons (40 chains of five, with ratings, ages, levels and XP carried forward).
- After the first season of aging nobody is above their age-band potential cap, and every player is exactly one year older each season.
- In the first chained season the young gain and the old decline in overall rating.
- The same seed gives the same season and a different seed a different one, and the run does not change the data it read.

A mutation check, run once by hand: with the score model's scale set to 2 (so the best club nearly always wins), the "less than 70 percent" check fails at 90.5 percent and the run reports 13 of 14.

## Output (seeded, identical on every run)

```
Lamplight Cup title share over 200 seeded seasons (the test's own logistic score model, scale 14):
club         average rating   avg wins   top seed   playoffs   final   cup
harrowgate            72.1        7.1        52%        97%     65%   38.0%
quarryhill            67.1        6.2        23%        91%     56%   32.5%
millrace              63.4        5.4        18%        80%     33%   12.5%
brackenport           59.7        4.7         3%        72%     33%   13.0%
tollbridge            55.0        3.7         4%        39%      9%    2.5%
fernmoor              49.8        2.9         2%        22%      4%    1.5%

After each chained season (40 chains of 5), the mean club strength, harrowgate cups, and the average one-season change in a player's overall for ages 22 and under and 33 and over:
after season   mean strength   harrowgate cups   age<=22 change   age>=33 change
           0            63.2                 -                -                -
           1            64.2          15 of 40             4.01            -0.83
           2            64.6          17 of 40             3.23            -1.29
           3            64.4          17 of 40                -            -1.44
           4            63.9          19 of 40                -            -1.64
           5            63.9          18 of 40                -            -1.70
```

## What this tells LB-SEASON

- **The pieces fit.** `season.json`, `roster.json`, `standings.js` and `progression.json` run through 200 seasons and 40 five-season chains with no schema surprise and no rating outside 35 to 90. Ratings do touch the floor of 35 and the ceiling of 90 (the lowest and highest values seen are exactly 35 and 90), so the clamp is doing work.
- **A title is open, with a score model this simple.** The strongest club wins about 38 percent of cups and the second strongest about 32 percent. A top seed is no lock: `quarryhill` is top seed 23 percent of the time yet wins 32.5 percent of cups, because the four-team bracket is only two rounds. The weakest club makes the playoffs 22 percent of the time and wins about 1.5 percent of cups. These shares depend on the test's own scale; LB-SEASON should tune against its real engine, not this table.
- **Strength is stable over five seasons.** The mean club strength goes 63.2, 64.2, 64.6, 64.4, 63.9, 63.9, so progression and aging roughly balance at the league level. Players aged 22 and under gain 4.0 then 3.2 overall in the first two seasons, and players aged 33 and over lose 0.8 rising to 1.7 a season.
- **For the Dev Lead: ten starting ratings on seven veterans are already above their age-band potential cap** in `roster.json` (`brackenport` Ada Brisk 35 has speed 82 and catch 78 against a cap of 75, Anya Barlewick 35 cover 79; `millrace` Edra Bellhaven 33 cover 84, speed 86 and tackle 82 against 80; `harrowgate` Leona Gatewell 31 throw 89 and Bela Dawnwick 33 tackle 81 against 80; `tollbridge` Nell Fallow 34 speed 84; `quarryhill` Tarin Cinderley 31 rush 84). `progression.json` clamps them down at the first birthday, which is how this test treats them, so `harrowgate`'s quarterback loses 9 points of throw in the first season. LB-SEASON should decide whether to clamp at load or leave the starters alone and cap only growth. This test does not decide that.

## Not covered

- No lineup, training, injury, retirement, draft or contract logic, and no dilemma cards. The workload that earns XP is a transparent stand-in per position, not the engine's events.
- No save. Nothing here is stored.
- The test is not wired into CI or `tests/lantern-bowl.html`; `docs/plans/guest-backlog.md` says the Director adds it to the page when the season is wired. CI runs the existing browser suites only, so the output above is pasted in the pull.
