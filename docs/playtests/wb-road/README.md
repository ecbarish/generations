# WB-ROAD: the road to Thornwood and Continue (WBL-8, WBL-9, WBL-10, WBL-16)

`docs/plans/guest-backlog.md` keeps this pull to `title.gd`, a new standalone Continue test, and `wildbond.json`, and says
to stay out of `run_tests.gd` and the fix bundle's (#458) functions. The Director then allowed the four `main.gd` spots
below on #373, so this pull adds the test and closes the three findings that sit there.

## The test

`wildbond-godot/tests/wbl_continue.gd` runs by itself:

```
godot --headless --path wildbond-godot --script res://tests/wbl_continue.gd
```

It plays a journey from the first line (register, barn, Wren's battle), holds the real Up key from the Larkhaven road
mouth onto Thornwood Trail, and quits two ways: the window closing, and killed with no warning after the game's own
autosave. A second game then opens on the title page, which must name Thornwood Trail. Continue is pressed with the Enter
key (and, in a second set, a mouse click and a touch). The place, tile, partner, team, bag, badges, story and goal must
match, Wren must still be away and Maren at home, and you must be able to walk on. It runs for all three starters. It also
checks that Start a new journey asks twice and keeps the save, and that quitting during the opening writes no half
journey. It never loads a fixture file. Result: 71 checks pass.

## What the test reproduced in `main.gd`

1. **Larkhaven's goal names no road (WBL-8).** Before the first catch the goal said "Meet someone wild in the tall grass."
   Larkhaven has no tall grass and nothing named the road. Now: "Take the north road to Thornwood, then meet someone wild in
   the tall grass." (`next_objective`; before `reproduced/larkhaven-goal-names-no-road.png`, after `after/larkhaven-goal-names-the-road.png`.)
2. **Quit under a second after crossing the road, with no warning (WBL-9).** The save waited for a five-second tick, so
   Continue put you back a map behind. Now the game also saves within half a second of arriving somewhere new
   (`_autosave`; before `reproduced/title-after-quick-quit-says-larkhaven.png` and `reproduced/continue-lands-in-larkhaven.png`,
   after `after/title-after-quick-quit-says-thornwood-trail.png` and `after/continue-lands-on-thornwood-trail.png`).
3. **Hiding the tab (WBL-9).** A browser tab or a phone app never sends the window-closed signal. The game now also saves
   when the window or app loses focus or is paused (`_notification`).
4. **The first click on the road right after Wren's battle (WBL-8).** Wren is still standing on the route, so the walk is
   dropped without a word. This is in the walking code that fix bundle 2 (#458) owns, so it is not changed here. The test
   prints it as a `GAP` and does not fail. A second click a few seconds later works.

The `main.gd` edits are inside `_autosave`, `_notification`, `next_objective` and one `saved_map` line in `_load_game`
(plus the `ROAD_OBJECTIVE` constant and the `saved_map` variable beside them), as the Director allowed on #373. No save
field changes, so old saves load as before. The one existing goal check in `tests/wbl_battle_start.gd` is updated for the
new Larkhaven goal.

## Clicking "Continue your journey" (WBL-16)

Not reproducible in the Godot build. In real windows under X, a real mouse click on the button chose Continue at 1024×576,
at 1280×720 and on the upright phone layout at 390×844 (`real-window/`). `wbl_continue.gd` also clicks and touches it in
the headless run. The remaining cause is the web canvas reporting window pixels, which the fix bundle already handles in
`controls.gd` (`Controls.at`, #458). So `title.gd` is unchanged.

## WBL-7

Still not reproduced, and `tests/north_roads.gd` from #416 stays. The title page opens only when the page loads, so a
reload (or a lost save, see 2 and 3) is the likely cause.

## Pictures

`reproduced/` (before) and `after/` come from `wildbond-godot/tests/wb_road_screens.gd`, in a real window
(`OUT=/tmp/wb-road xvfb-run -a -s "-screen 0 1600x900x24" godot --path wildbond-godot --audio-driver Dummy --rendering-method gl_compatibility --script res://tests/wb_road_screens.gd`).
`real-window/` is the real game, started with a saved journey, with a mouse click made by `xdotool`.
