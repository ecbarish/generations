# Diamond Manager records and history (DM7)

The League page holds the season ledger, saved final standings and named league awards. The Clubhouse holds the Trophy Case and club records. The season-end report announces the awards and opens the ledger directly. All are inside the existing game-window clipboard/notes.

## What is recorded

A regular-season appearance contributes to the club where it happened. A traded player's league award uses both stints, while Lanterns records use only the Lanterns stint. The ledger includes released players even after they leave the roster. Repeated recording of the same game cannot duplicate ledger statistics. Finals decide the champion but do not enter regular-season award totals.

Best Hitter: highest OPS, at least 60 at-bats. OPS is (hits + walks)/(at-bats + walks) plus total bases/at-bats. Total bases are hits + doubles + two times triples + three times home runs. Ties use home runs, then the smaller player ID.

Best Pitcher: lowest ERA, at least 30 innings (90 outs). The simulation has no unearned-run distinction, so recorded runs are used, matching its existing ERA display. Ties use strikeouts, then player ID. A league award across two clubs is labelled Two clubs.

Club records: most hits, home runs, runs batted in, strikeouts and pitcher wins in a regular season. Equal records retain the earliest season. Snapshots store names and stats rather than pointing to a current player object, so a release, trade or later rating change cannot erase the past. League championships and single-club Lanterns league awards add dated trophies; they grant no money or rating bonus.

## Older saves

Existing history/results stay. The stat ledger is optional in older saves: starting partway through a season creates a partial ledger, which cannot produce complete-season awards or player records. Its season result and standings still save. The following season starts a full ledger. Previous awards are not invented from missing data. Migration consumes no random rolls. Corrupted new ledger/history fields are rejected before rendering.

## Validation

93 Diamond Manager checks pass, including nine history regressions: actual full-season snapshots, qualification/ties, trade stints, pitcher wins, duplicate games, records, partial legacy saves, next-season/reset/reload and corrupt fields. The six-season balance/gap checks still pass.

Visual evidence and the separate browser flow are in screenshots/diamond-history/README.md. No game versions, Godot source or shared sports-office changes. PR #209 follows balance #208, morale #207 and coaches #196.

Final validation: all 18 suites pass locally (Diamond Manager 93, Wildbond Godot 1503/0, Starfall Godot 227/0). The subsequent season-report link and scrolling checks pass at all four sizes, including actual save/reload. GitHub CI is checked separately on the pushed head.
