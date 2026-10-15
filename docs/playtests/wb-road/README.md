# WB-ROAD: the road to Thornwood and Continue (WBL-8, WBL-9, WBL-10, WBL-16)

`docs/plans/guest-backlog.md` keeps this pull to `title.gd`, a new standalone Continue test, and `wildbond.json` only if
the road bug is exit data. It says not to edit `main.gd` or `run_tests.gd`, because the Wildbond fix bundle (#458)
owns them. So this pull adds the test and reports what the test found. It changes no game code.

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
journey. It never loads a fixture file. Result: 68 checks pass.

## What the test reproduced in `main.gd` (left alone, reported on #373)

The test prints each of these as a `GAP`. They do not fail it. When `main.gd` fixes one, the line says `GAP CLOSED`.

1. **Larkhaven's goal names no road (WBL-8).** Before the first catch the goal says "Meet someone wild in the tall
   grass." Larkhaven has no tall grass, and nothing names the road that leads to it, so the road reads as a road to nowhere
   (`reproduced/larkhaven-goal-names-no-road.png`).
2. **Quit under a second after crossing the road, with no warning (WBL-9).** The save waits for a five-second tick, so the
   crossing is lost and Continue puts you back a map behind, in Larkhaven (`reproduced/title-after-quick-quit-says-larkhaven.png`,
   `reproduced/continue-lands-in-larkhaven.png`).
3. **Hiding the tab (WBL-9).** A browser tab or a phone app never sends the window-closed signal, and nothing saves when
   the game loses the screen, so it is the same loss as 2 on the web build.
4. **The first click on the road after Wren's battle (WBL-8).** Wren is still standing on the route, so `main.gd` drops the
   walk without a word. A second click a few seconds later works. This is the one path where the road does nothing when you
   click it.

`main-gd-proposal.patch` is a small change that closes 1 to 3 and leaves 4 (a goal line, a save when you arrive somewhere
new, and a save when the tab is hidden). It also updates the one existing goal check in `tests/wbl_battle_start.gd`. I checked that `wbl_continue.gd` reports 1 to 3
closed with it applied, and that the Wildbond suite passed with it (18,945 checks). It changes no save field, so old saves
load as before. It is not applied here.

## Clicking "Continue your journey" (WBL-16)

Not reproducible in the Godot build. In real windows under X, a real mouse click on the button chose Continue at 1024×576,
at 1280×720 and on the upright phone layout at 390×844 (`real-window/`). `wbl_continue.gd` also clicks and touches it in
the headless run. The remaining cause is the web canvas reporting window pixels, which the fix bundle already handles in
`controls.gd` (`Controls.at`, #458). So `title.gd` is unchanged.

## WBL-7

Still not reproduced, and `tests/north_roads.gd` from #416 stays. The title page opens only when the page loads, so a
reload (or a lost save, see 2 and 3) is the likely cause.

## Pictures

`reproduced/` comes from `wildbond-godot/tests/wb_road_screens.gd` on main, in a real window
(`OUT=/tmp/wb-road xvfb-run -a -s "-screen 0 1600x900x24" godot --path wildbond-godot --audio-driver Dummy --rendering-method gl_compatibility --script res://tests/wb_road_screens.gd`).
`real-window/` is the real game, started with a saved journey, with a mouse click made by `xdotool`.
