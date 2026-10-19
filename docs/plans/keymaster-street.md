# KM-STREET design: one street, five listings, one goal

**Status: proposal, waiting for Evan's yes.** This is a sketch for must-have 2 on [launch-keymaster.md](launch-keymaster.md). Nothing here is built.
Written by Claude, 2026-10-19, from [the Keymaster proposal](../proposals/keymaster.md) and the current build (KM0, `games/keymaster/model.js`). Every number below comes from the game's own formulas, run on these listings.

## The idea in one paragraph

You have **$200,000 of savings** and one street, **Alder Street in Millbrook**. Five homes come up for sale, one at a time. For each one you run the numbers exactly as you do today (offer, down payment, plan for the work), then make an offer or pass. A pass is final: someone else buys it. **The goal: own three homes on Alder Street that each pay you in their first year.** Two of the five look fine and aren't. The cash runs out if you are careless with it. A run is about five minutes, one decision a minute, as the proposal asks.

## The five listings, in order

Each listing makes a different line of the worksheet matter. The first is today's duplex, so KM0 becomes the street's tutorial.

| # | Home | What it teaches | The right read (at the sellers' lowest price) |
|---|---|---|---|
| 1 | **14 Alder**, the duplex (today's listing): ask $240,000, sellers' lowest $216,000 | **Price is where you make money.** At asking it is a thin or costly buy; at their lowest it is a great one | At $216,000 with 25% down and the refresh: $432 a month, $18,000 of equity on day one |
| 2 | **3 Alder**, the pretty one: a renovated single-family home, ask $285,000, sellers' lowest $276,000 (not in a hurry) | **A nice house is not a good rental.** It loses money every month at every price and plan | Pass. Even with full work and 25% down it runs −$82 a month and is worth about $94,000 less than you would pay once let |
| 3 | **22 Alder**, the tired triplex: ask $255,000, sellers' lowest $235,000; three units let cheaply as they are | **The plan for the work is the deal.** As it is, it barely pays; with a refresh or full work it is the best home on the street | Refresh with 20% down: $664 a month, about $56,000 of equity. Full work earns more but takes $96,000–$113,000 of your cash |
| 4 | **9 Alder**, high taxes: ask $190,000, sellers' lowest $177,000; taxes $8,400 a year | **The 1% rule is only a quick screen.** The rent passes it (1.0–1.2%), but the taxes eat the cap rate and the home is worth less than its price once let | Pass. Its best case is a thin $227 a month with negative equity |
| 5 | **31 Alder**, the small cottage: ask $150,000, sellers' lowest $138,000 | **Cash is limited: a small, steady buy can finish the street.** Cheap enough to fit in what is left | At $138,000, refresh, 20% down: $234 a month, $12,000 of equity, about $37,000 of cash |

**Why the cash matters.** Buying 14, 22 and 31 at their lowest prices with refreshes uses about $174,000 of the $200,000 (25%, 20% and 20% down). Choose full work on the triplex, or 25% down everywhere, and the cottage no longer fits. So the down-payment choice (borrow more, keep cash) becomes a real trade-off, not only a line on the worksheet.

**Winning and losing.**

- **Win:** own three homes, each paying you in its first year by the game's own verdict: a thin buy or better.
- **Miss:** a home bought at asking with no work can still pass, but buying a trap or running out of cash costs you the street.

Either way the run ends with **Your street**: each home you bought, its first year side by side, the total each month, and what happened to the homes you passed.

## What stays the same

- The worksheet, the offer stepper, the down payment and plan choices, the sellers' yes, counter or no, and the plain-word verdicts.
- Nothing plays itself, and there are no timers. A run pauses anywhere: it's a page you come back to.
- No property manager, rent collection or delegation. Those come after launch, under the hired-hand rule.

## What the build changes (for the build ticket, not now)

- **`model.js`:**
  - A listing carries its own units, rents and three plans.
  - The seller's floor and counter become per listing.
  - The first year's events become per listing: a repair, and one unit between tenants, scaled to that home.
  - A `street` list holds the five homes, and a run keeps the cash, the homes owned and which listing is up.
  - All of this stays pure, testable rules.
- **`game.js`:**
  - Shows "Listing 2 of 5", your cash, and the goal line.
  - Shows a small street strip of five doors (owned, passed, coming up).
  - Ends with the Your street summary.
- **Tests:** each listing's lesson is checked as a fact. Examples: 3 Alder loses money at every price and plan; 9 Alder passes the 1% rule but has negative equity; the three good homes fit in $200,000 with refreshes.
- **Saving is KM-SAVE, a separate pull,** and it needs Evan's yes. Until then a run lasts as long as the page is open, which is fine for five minutes.

## Questions for Evan

1. **Yes to this shape?** One street, five homes, $200,000, "own three homes that each pay you in their first year".
2. **Are the numbers believable to you?** They use the game's current assumptions: 7% for 30 years, 3% closing costs, 10% set aside, and homes nearby selling at a 7.5% cap rate. You are the expert. Any rent, tax or price that would make an investor laugh should change before it's built.
3. **Title and tone:** keep the defaults (Keymaster; a straight simulation with small human touches like Mrs Okafor), or change them now?
