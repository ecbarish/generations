# Saltmarsh Shipping Office (IDLE-SS1)

v0.1.1. The playable core. Trade routes, the lighthouse ending and the hall card come later.

You row three cargoes yourself, then keep a skiff you can row whenever you like. You buy boats: a Rowboat, a Sloop, a Schooner and a Bark. Capt. Wren takes the pier once enough rowboats are tied up. The sloop shop, the sheds and the harbour log follow a few at a time. At ten sloops, the fleet chart unrolls, and you choose a lighter hull or another shed. The same kind of choice comes back for the schooner holds. Ten schooners mark the trade routes, and those routes sail on the next tide. Twelve barks lengthen the quay. Sixteen light the bar lamp.

Boats earn the full rate while this page is open, including a hidden tab. Closing the page pays half, and only what the sheds can hold: two hours each, up to four sheds. Both kinds of absence leave a log with the coins you left, the haul totals, and the coins you came back to. Captains are people on a timed haul. They are not a multiplier on the boats. The same stretch of a haul pays once.

It is not in the hall. Open `games/saltmarsh-shipping/index.html`. Nothing here is taken from another game. `sw.js`, `index.html`, `shared/`, `launcher/` and `.github/workflows/` are untouched.

The save is version 1 (`saltmarsh-shipping-save-v1`). A missing or broken save starts a new office. There is no older save to migrate.

Checks: `node tools/run-all-checks.cjs saltmarsh-shipping`

The pacing tool (`node tools/saltmarsh-pacing.cjs`) is a simulation, not a watched play.

## Changelog

- v0.1.1 (2026-11-02, IDLE-SS1, PR #619): The office is open. You row three cargoes yourself, and the big button then stays "Row the skiff", even after Capt. Wren takes the pier. A skiff trip pays about three seconds of what the office is earning. You buy a Rowboat, a Sloop, a Schooner and a Bark. At ten sloops the desk offers lighter sloop hulls or another shed, and taking one locks the other. At ten schooners the same kind of choice returns for the deeper holds. Twelve barks lengthen the quay and put house flags up. Sixteen barks light the bar lamp. Flags go up again at 25 barks, the dock lengthens at 50, and a crane stands at 100. The harbour stays the tall size from the first screen, so the fleet chart does not push the page down. On a short window the boats sit on the water, and Row stays above the goal bar. When the shed yard is full, that button says "The sheds are full." Capt. Wren lands 179 coins a haul, Capt. Bramble 710, Capt. Hollis 9.00K and Capt. Pell 54.0K. A page left open, including a hidden tab, keeps the full rate. Closing the page pays half, and only what the sheds can hold. Both leave a harbour log, and a captain line gives the stretch total. When Max cannot buy even one boat, the card reads "Max · one costs N coins". The save stays version 1 (`saltmarsh-shipping-save-v1`). Nothing has shipped before this, so there is no older save to carry forward. The office is not in the hall yet.
- v0.1.0 (2026-10-23, IDLE-SS1): the office opens. Three hand cargoes, four boats, captains, the fleet chart, sheds, and the away log. Later passes on the same version space the unlocks, pay the captains in coins the player can see, keep a skiff to row, and make the hull-or-shed choices lock the other side.
