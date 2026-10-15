# WB-ROAD: the road to Thornwood and Continue (WBL-8, WBL-9, WBL-10, WBL-16)

The Continue test started as a report. `docs/plans/guest-backlog.md` kept that pull off `main.gd`, because the fix
bundle owned the game. Fix bundle 3 now applies the four gaps in `main.gd`, and `wbl_continue.gd` fails the run when
one of them misses. `saved_map` is remembered only while the game is open. It is not a field in the save, so an old
save still loads.

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

## What the test found, and what the game does now

These four were printed as gaps and left in `main.gd`. They are real checks now. A miss fails `wbl_continue.gd`.

1. **Larkhaven's goal names the road (WBL-8).** Before the first catch, Larkhaven's goal is "Take the north road to
   Thornwood, then meet someone wild in the tall grass." The old line, "Meet someone wild in the tall grass.", is what
   the test reproduced (`reproduced/larkhaven-goal-names-no-road.png`). Thornwood's own road still uses that older line.
2. **Arriving on a new road is saved (WBL-9).** The usual save still waits about five seconds. Crossing onto a map that
   is not the one last written is saved within half a second, so a quit just after the road leaves you on that road.
   The pictures of the old loss are `reproduced/title-after-quick-quit-says-larkhaven.png` and
   `reproduced/continue-lands-in-larkhaven.png`.
3. **Losing the screen saves too (WBL-9).** Closing the window still saves. So does hiding the window, the app losing
   focus, or the game being paused, which is what a hidden browser tab or a switched-away phone does.
4. **The first click waits when someone is crossing (WBL-8).** If Wren, or anyone else with their own path, is on the
   tile or about to step onto it, the walk waits instead of being thrown away.

`main-gd-proposal.patch` is the note that first described 1 to 3. The game code that plays is `main.gd` in the fix
bundle, not that patch file. The patch is not a second copy of the change.

## Clicking "Continue your journey" (WBL-16)

Not reproducible in the Godot build. In real windows under X, a real mouse click on the button chose Continue at 1024×576,
at 1280×720 and on the upright phone layout at 390×844 (`real-window/`). `wbl_continue.gd` also clicks and touches it in
the headless run. Godot maps that click into the 384×216 view before the game reads it, and `Controls.at` leaves that
point as it is. `title.gd` is unchanged.

## WBL-7

Still not reproduced, and `tests/north_roads.gd` from #416 stays. The title page opens only when the page loads, so a
reload (or a lost save, see 2 and 3) is the likely cause.

## Pictures

`reproduced/` comes from `wildbond-godot/tests/wb_road_screens.gd` on main, in a real window
(`OUT=/tmp/wb-road xvfb-run -a -s "-screen 0 1600x900x24" godot --path wildbond-godot --audio-driver Dummy --rendering-method gl_compatibility --script res://tests/wb_road_screens.gd`).
`real-window/` is the real game, started with a saved journey, with a mouse click made by `xdotool`.
