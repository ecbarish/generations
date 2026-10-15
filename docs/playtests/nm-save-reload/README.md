# NM-FIX-6: "Your save" and the reload check (Night Market)

`reload-check.cjs` drives the real page in Chromium with real clicks, real reloads, a real download and real file choosers, then checks that every other game's save is byte for byte unchanged. 19 checks; `report.json` is its output.

Run: `NODE_PATH=<playwright> CHROME_PATH=<chrome> node docs/playtests/nm-save-reload/reload-check.cjs [output-directory]`

What it proves on the live code:
- Real serve, hire and buy clicks are saved at once.
- "Your save" opens with Download, Load a save file and the automatic backups. Download hands over a real file that is this game's save.
- A reload after two hours away shows "While you were away" with the time and the coins earned, and the coins are in the saved cash. "Put the box away" closes it, and an immediate second reload does not show it again.
- Load a save file asks first, replaces the save and backs the old one up. Restore a backup asks first and reloads with the older save.
- Other games' saves (Little Ranch sound, Wildbond, Starfall, an unrelated key, a Wildbond backup) are unchanged, the hub index keeps the other game's row, and every storage write was to a Night Market key or the hub index.

The one defect it found: loading another game's file asked "Replace your save with this file?" first and only then said it wasn't a save for this game. The save was never changed, but the question was misleading. `shared/engine.js` now checks the file before it asks.

Shots (390×844): `1-your-save-open.png`, `2-away-summary-after-reload.png`, `3-wrong-file-refused.png`.
The away-time test edits the stored last-seen time back two hours before the reload, which is what closing the tab leaves behind.
