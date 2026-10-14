# Night Market Stalls (IDLE-NM1)

v0.1.2.

A small night market you can leave open. Six stalls stand on one lane. You work each stall yourself, then ask its vendor to run it. After that you buy more of that stall, one, ten, or as many as you can afford. At 25, 50 and 100 the stall changes look and earns twice as much each time. That doubling is the only production change.

The first three stalls use the starting table in docs/research/office-idle-progression.md §8.2 (Tea Stall, Dumpling Cart, Lantern Stand). Mooncake Table, Incense Tray and Story Mat continue that curve so the half hour still has somewhere new to open. The next stall appears when you have ten of the one before it.

While this page is open, income uses the full rate, including a hidden tab. Closing the page and coming back pays at half rate, and only four hours count. The cash box says so. Saves go through the idle core's save callback into the arcade save, version 1 (`night-market-save-v1`). Numbers use `Arcade.fmt`.

It is not in the hall. Open `games/night-market/index.html`. Nothing here is taken from another market game. `sw.js`, `index.html`, `shared/`, `launcher/` and `.github/workflows/` are untouched.

Checks: `node tools/run-all-checks.cjs night-market`

## Changelog

- v0.1.2 (2026-10-14, playtest fixes, PR #434): Holding the pour button keeps pouring, about eight cups a second. A cups bar and counter show how close the stall is to its vendor. The pour button stays after you hire. The save box is styled, and its backup list refreshes each time it opens. Payback times show whole seconds. The save stays version 1.
- v0.1.1 (2026-10-14, NM-FIX-1, PR #421): each stall says how long the next one pays for itself. Welcome back and the cash box say stalls earn 50% while you are away, and only four hours count.
- v0.1.0 (2026-10-14, IDLE-NM1): first playable lane. Six stalls, hire after the job, bulk buy, milestones, capped welcome back.
