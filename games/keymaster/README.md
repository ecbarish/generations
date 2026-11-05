# Keymaster

v0.1.0.

Alder Street in Millbrook. You have $200,000 and five homes come up for sale, one at a time. The goal is to own three
that each pay you in their first year (docs/plans/keymaster-street.md). The worksheet is the game (docs/proposals/keymaster.md).
14 Alder Street, the first home, is a 1962 duplex: Unit A is let, Unit B is empty and needs work, and the sellers have
moved away and want a quick sale. On every home you set three things:

- **your offer** (in $2,000 steps, from $60,000 under the asking price to $20,000 over it);
- **your down payment** (20% or 25%; the loan is 7% over 30 years);
- **the plan for the work**: leave it, refresh it, or renovate it (each costs more and lets for more).

The worksheet updates as you go: a month of rent, the 10% set aside for empty months and repairs, taxes and
insurance, the mortgage and the cash flow. Above the offer button it says whether this first year would count
toward the street. Then the four measures Evan picked: **cap rate** (against the 7.5% that rentals nearby sell at),
**cash-on-cash**, **the 1% rule**, and **after-repair value** with your equity on day one.

Each home has its own sellers. On 14 Alder Street they say yes at 90% of asking or more, counter from 84%, and say
no below that (two noes and they sell to someone else). A counter still lets you change the down payment and the
work. Buy, and you see that home's first year, then a verdict. Growth is shown but not counted, because nobody
promises it. Pass, and you see how the next buyer did. Two of the five homes do not pay you at any price.

The run is kept on this device under `keymaster-save-v1` (version 1). Open it from the Lab, or at
`games/keymaster/index.html`. Plain HTML and JS. Rules are in `model.js` (no page code); `game.js` is the screen.
`shared/engine.js` stores the save. No third-party assets.

Checks: `node tools/run-all-checks.cjs keymaster` (tests/keymaster.html: the arithmetic, the sellers, the year, the
street, the real buttons, and phone and desktop sizes). Launcher checks too, if the Lab card changed.

## Changelog

- KM-FINISH: before you offer, the worksheet says whether that first year would count. A counter still lets you change the down payment and the work. A home your cash cannot buy says so, instead of telling you to lower a price that still will not fit. The Lab card's picture text names the five homes. `keymaster-save-v1` is unchanged.
- v0.1.0 (2026-10-14, KM0, PR #379): Keymaster KM0 prototype added.
