# Saltmarsh Shipping Office (IDLE-SS1)

v0.1.0. The playable core. Trade routes, the lighthouse ending and the hall card come later.

You row three cargoes yourself. Then you buy boats: a Rowboat, a Sloop, a Schooner and a Bark. Capt. Wren takes the pier once enough rowboats are tied up. The sloop shop, the sheds and the harbour log follow a few at a time. At ten sloops, the fleet chart unrolls. Ten schooners mark the trade routes, and those routes sail on the next tide.

Boats earn the full rate while this page is open, including a hidden tab. Closing the page pays half, and only what the sheds can hold: two hours each, up to four sheds. Both kinds of absence leave a log with the coins you left and the coins you came back to. Captains are people on a timed haul. They are not a bonus on the boats. The same stretch of a haul pays once. A lighter hull or a deeper hold is a one-off choice beside the next shed.

It is not in the hall. Open `games/saltmarsh-shipping/index.html`. Nothing here is taken from another game. `sw.js`, `index.html`, `shared/`, `launcher/` and `.github/workflows/` are untouched.

The save is version 1 (`saltmarsh-shipping-save-v1`). A missing or broken save starts a new office. There is no older save to migrate.

Checks: `node tools/run-all-checks.cjs saltmarsh-shipping`

The pacing tool (`node tools/saltmarsh-pacing.cjs`) is a simulation, not a watched play.

## Changelog

- v0.1.0 (2026-10-23, IDLE-SS1): the office opens. Three hand cargoes, four boats, captains, the fleet chart, sheds, and the away log. A later pass on the same version spaces those unlocks, pays the captains in coins the player can see, and makes the away log match the header.
