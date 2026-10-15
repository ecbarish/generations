# Night Market Stalls (IDLE-NM1)

v0.1.4.

A small night market you can leave open. Six stalls stand on one lane. You work each stall yourself, then ask its vendor to run it. After that you buy more of that stall, one, ten, or as many as you can afford. At 25, 50 and 100 the stall changes look and earns twice as much each time.

The Tea Stall, the Dumpling Cart and the Lantern Stand open first. Later stalls cost more and earn less. The dumpling cart earns 0.5/s like the tea stall. The first million takes a longer evening, about 48 to 66 minutes of active play. The next stall appears when you have ten of the one before it.

While this page is open, income uses the full rate, including a hidden tab. Closing the page and coming back pays at half rate, and only four hours count. The cash box says so. Saves go through the idle core's save callback into the arcade save, version 1 (`night-market-save-v1`). Numbers use `Arcade.fmt`.

It is not in the hall. Open `games/night-market/index.html`. Nothing here is taken from another market game. `sw.js`, `index.html`, `shared/`, `launcher/` and `.github/workflows/` are untouched.

Checks: `node tools/run-all-checks.cjs night-market`

## Changelog

- v0.1.4 (2026-10-15, visuals, PR #438): A picture of the lane now sits under the header, with the six stalls in order. An open stall shows a striped awning, a counter and its own wares, and a shuttered stall stays dark. Each sale pops a coin up from that stall. Lanterns flicker along the top of the lane and on the awnings. The tea stall, the dumpling cart and the mooncake table steam, and the incense tray smokes, once that stall is open and has been served or hired. Buying or hiring outlines that stall for a moment, and reaching 25, 50 or 100 plays a brighter flash. The awning's light stripe changes colour at those same counts. Once a stall is staffed, people stroll along the lane. When reduced motion is on, the lane holds still, and a sale or a flash shows as one still picture. The save stays version 1.
- v0.1.3 (2026-10-14, NM-RETUNE, PR #445): The first million now takes a longer evening, about 48 to 66 minutes of active play. Later stalls cost more and earn less. The dumpling cart earns 0.5/s like the tea stall. Old saves keep their coins and stalls. The save stays version 1.
- v0.1.2 (2026-10-14, playtest fixes, PR #434): Holding the pour button keeps pouring, about eight cups a second. A cups bar and counter show how close the stall is to its vendor. The pour button stays after you hire. The save box is styled, and its backup list refreshes each time it opens. Payback times show whole seconds. The save stays version 1.
- v0.1.1 (2026-10-14, NM-FIX-1, PR #421): each stall says how long the next one pays for itself. Welcome back and the cash box say stalls earn 50% while you are away, and only four hours count.
- v0.1.0 (2026-10-14, IDLE-NM1): first playable lane. Six stalls, hire after the job, bulk buy, milestones, capped welcome back.
