# Keymaster (KM0: the smallest test)

One listing, one deal analyzer, one buy (docs/proposals/keymaster.md). 14 Alder Street is a 1962 duplex: Unit A is
let, Unit B is empty and needs work, and the sellers have moved away and want a quick sale. You set three things:

- **your offer** (in $2,000 steps, from $180,000 to $260,000);
- **your down payment** (20% or 25%; the loan is 7% over 30 years);
- **the plan for Unit B**: clean it and let it as it is, a refresh, or a full renovation (each costs more and lets for more).

The worksheet updates as you go: a month of rent, the 10% set aside for empty months and repairs, taxes and
insurance, the mortgage and the cash flow. Then the four measures Evan picked: **cap rate** (against the 7.5% that
rentals nearby sell at), **cash-on-cash**, **the 1% rule**, and **after-repair value** with your equity on day one.

Make an offer and the sellers answer: yes at 90% of asking or more, a counter at 90% for offers from 84%, and no
below that (two noes and they sell to someone else). Buy, and you see your first year month by month: a furnace in
May, Unit A empty for September. Then a verdict on what the year made you (cash, loan paid down, day-one equity) on
the cash you put in. Growth is shown but not counted, because nobody promises it. Pass, and you see how the next
buyer did.

Nothing is saved, and it isn't in the hall yet: open `games/keymaster/index.html`. Plain HTML and JS, no shared
modules and no third-party assets. Rules are in `model.js` (no page code); `game.js` is the screen.

Checks: `node tools/run-all-checks.cjs keymaster` (tests/keymaster.html: the arithmetic, the sellers, the year, the
real buttons, and phone and desktop sizes).

Next, if the test is fun: a second listing that is a bad deal on purpose, then tenants with names (open questions for
Evan in the proposal: title and tone).
