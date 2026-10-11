# Diamond Manager: six-season balance (DM-B2)

## Design

Other clubs no longer receive an unearned Training-room bonus each winter. Everyone still develops toward their potential from playing time, with age decline intact. Natural growth uses one bonus step per ten points of remaining potential instead of six, spreading development over more seasons. Baseline growth no longer grants a guaranteed extra point when already at the ceiling; purchased training and coaches still help the player's club.

New ordinary market visitors are generated at the opposing clubs' current average (rounded) minus five. Standouts are twelve points above that baseline. Scouting still adds three points per level to ordinary recruits and two to standouts. Eight fresh ordinary visitors replace unsigned visitors each winter; existing signed and released players are not rescaled. A signing removes the visitor marker. Unsigned former club players age each winter and leave the market at 36. Bargains remain available at the league minimum.

This is roster turnover and recruitment balance, not rubber-banding scores or changing match odds. All game decisions still use actual ratings and the seeded simulation.

## Reproduce

```
node tools/diamond-balance-sim.cjs --baseline
node tools/diamond-balance-sim.cjs
node tools/run-all-checks.cjs
```

The baseline reads committed source from f04364c (DM4 before DM-B2). Twelve fixed seeds: 97 through 1164, in steps of 97. Each study plays six full seasons and finals, declines unsolicited trades, drafts through Iona and renews/fills a legal roster without recruitment upgrades. The report records beginning-of-season opponents, ordinary market visitors, standouts and that season's wins. Baseline ordinary agents have no visitor marker, so the baseline measures all ordinary unsigned players.

| Season | Opponents before | Opponents after | Ordinary market before | Fresh visitors after | Standouts after | Hands-off wins before | Hands-off wins after |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1 | 54.82 | 54.82 | 50.44 | 50.35 | 62.13 | 9.75 | 9.75 |
| 2 | 56.16 | 55.51 | 50.41 | 50.81 | 62.92 | 9.75 | 10.25 |
| 3 | 57.24 | 56.04 | 50.60 | 50.74 | 64.54 | 9.50 | 9.92 |
| 4 | 58.73 | 57.07 | 50.07 | 51.54 | 64.63 | 7.58 | 7.25 |
| 5 | 60.04 | 57.67 | 49.69 | 52.70 | 64.88 | 6.50 | 8.08 |
| 6 | 61.53 | 58.42 | 50.54 | 53.21 | 64.71 | 5.00 | 5.75 |
| After sixth winter | 63.40 | 59.08 | 51.56 | 53.62 | 64.67 | - | - |

Through all six winters, mean opponent drift falls from 8.58 to 4.26 points. Worst sampled seed falls from 10.67 to 5.99. Regression limits are a mean drift of at most 4.5 and individual drift below 6; the ticket says about four, not an exact cap on every seed. The check includes the sixth winter, rather than stopping before it. Fresh recruits remain about five points below the opponents; standouts remain better. Hands-off clubs are still weak: this does not grant success without managing.

## Checks and limits

The existing active-versus-hands-off check now plays six seasons across the same twelve seeds and keeps its minimum advantage of 2.5 wins per season and at least one final. New checks cover league drift, market quality, pure market-level calculation, scouting, signed visitor persistence, old unmarked saves and winter renewal/bargains. Existing farm departure checks remain unchanged and caught an early market refresh that removed released prospects; that implementation was fixed.

No layouts, Godot files, shared office code, versions, save schema or stored player ratings are changed. The optional visitor marker defaults to absent in old saves. A six-season seeded study is a regression guard, not evidence that every possible long career is balanced. Live economic playtesting and longer-career runs remain useful.

Validation: all 18 suites passed locally; after extending the sixth-winter bound and the final growth adjustment, all 84 Diamond Manager checks passed again. Other game suites are unaffected. Native suites use isolated writable temporary saves. GitHub CI runs separately on the final pushed commit.
