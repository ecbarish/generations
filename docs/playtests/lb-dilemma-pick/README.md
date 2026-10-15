# LB-G14: headless dilemma picker

Backlog row LB-G14, for LB-SEASON. `games/lantern-bowl/dilemma-pick.js` is a pure module (UMD, `LanternBowlDilemmaPick`) that chooses which card from `dilemmas.json` to show after a match, in a bye week or before a game. Nothing loads it yet, so the game does not change. It has no save of its own, no clock, no `Math.random`, no storage and no DOM. `node tests/lantern-bowl-dilemma-pick.cjs` runs the 26 checks on the real card file.

## The shape

- `pick(cards, { when, used, rng })` returns one card object from `cards` whose `when` matches and whose `id` is not in `used`, or `null` when none is left. `when` is `afterWin`, `afterLoss`, `bye` or `beforeGame`; anything else throws a `TypeError`, and so do a bad `used`, a bad `rng`, or a card list with a repeated id, a bad `when` or no `role`. `used` is the plain array of ids the caller keeps, **oldest first**. `rng` is any function returning a number from 0 up to below 1; `seeded(seed)` gives a repeatable one.
- Which card: the last two cards in `used` give the roles shown lately. A role that is not one of those two is preferred, then one that is not the very last role, then any. Among those, the role shown the fewest times in `used` (across every `when`) goes first, so roles stay spread over a season. The rng then picks one of the tied roles and one of that role's cards. A card result spends exactly two rng draws and `null` spends none.
- `apply(card, choiceIndex, state)` returns a new `{ cardId, choiceIndex, target, result, morale, points, fans, owner, total }`. The four numbers are the choice's effects exactly (0 where the card lists none), `target` is `'player'`, `'team'` or `null`, and `total` is the optional `state` (running totals with any of the four numbers) plus those effects. Nothing is clamped, and neither the card nor `state` is changed. A bad choice index, card or state throws.

The row does not say how `pick` learns which roles were shown lately, or what `apply` does with `state`. I read them as above (roles from the tail of `used`, and `state` as optional running totals); the Dev Lead can change either in review.

## What the checks cover

Each `when` only gets matching cards and never a used one (1,600 picks); no card repeats in 300 seeded ten-week seasons; `null` once a `when` is used up (and the one card left out comes back); the same seed gives the same sequence and different seeds differ; a role is never shown twice running while another role is left for that `when`; a role shown often but not lately comes before the role just shown; on a made-up pool of 9, 5 and 3 cards the first nine picks are three of each role and never more than one apart; `apply` returns every one of the 32 choices' exact effects, result text and target, with and without totals; `pick` and `apply` leave deep-frozen inputs untouched; every bad input throws; and the card and season files are unchanged by the run.

Mutation checks, run once by hand against the module: ignoring `used`, dropping the recency rule, dropping the fewest-shown rule, adding 1 to `morale` in `apply`, and accepting any `when` each make at least one check fail.

## What a ten-week season gets from the 16 cards on main (seeded, identical on every run)

```
What a ten-week season gets over 300 seeded seasons (a card before each of 10 games and one after it, wins and losses at 50/50):
cards shown per season: 11.60 of 20 slots; every slot filled in 0 of 300 seasons
slots with no card left per season: before a game 6.00, after a win 1.32, after a loss 1.08
role share of the cards shown: team 31.8%, rb 17.2%, kicker 17.1%, defence 16.7%, line 8.6%, qb 8.6%
the same role twice running in a season: 6.1% of back-to-back cards
bye cards shown: 0 (no club has a bye week in season.json: true)
```

## What this tells LB-SEASON

- **There are too few cards for a ten-week season with a card in every slot.** The file has 4 cards for each `when`. A club plays 10 games, so a card before each game would need 10 `beforeGame` cards and gets 4: **6 of the 10 before-game slots come back empty in every season**, and about 1.3 after-win and 1.1 after-loss slots too. No season filled all 20 slots (a card before and after each of 10 games); the average is 11.6. The module returns `null` there and does not repeat a card, which is what the row asks for. LB-SEASON can show a card only some weeks, or the cards can be added to later. I did not edit `dilemmas.json`.
- **No club has a bye week in `season.json`.** All six clubs play in each of the 10 weeks, so the 4 `bye` cards are never shown in a season as it stands. They would need a bye week or a different place to show them.
- **`used` must be reset each season.** With 16 cards, a second season on the same `used` would have nothing left. The season save is where LB-SEASON keeps `used`; that is a save change and goes to Evan through Director, as the row says.
- **Role spread shows in the order, not the totals.** A season shows most of the 12 cards that are not bye cards, so each role's share is close to its share of those 12 (`team` 4, `rb` 2, `kicker` 2, `defence` 2, `line` 1, `qb` 1). What the picker adds is the order: the same role comes up twice running in only 6.1% of back-to-back cards, and never while another role is left for that `when`. If LB-SEASON wants more `qb` and `line` moments it needs more cards of those roles.

## Not covered

The picker does not know the match, the standings or the lineup, so it cannot choose a card by what just happened (for example a close loss); it only uses `when`, `used` and the rng. It does not decide how many cards a week gets, and `apply` does not clamp morale or fans to any limit, or look up the named player behind a `player` target. Those belong in LB-SEASON.
