# WB-ROAD: the road to Thornwood and Continue (WBL-7 to WBL-10)

What a player sees, before and after. All pictures are the game's own canvas, taken by
`wildbond-godot/tests/wb_road_screens.gd` from a journey that is really played (register, barn, Wren's battle, then
free in Larkhaven). Run it in a real window:

```
OUT=/tmp/wb-road xvfb-run -a -s "-screen 0 1600x900x24" godot --path wildbond-godot --audio-driver Dummy \
  --rendering-method gl_compatibility --script res://tests/wb_road_screens.gd
```

| Picture | Before | After |
|---|---|---|
| Free in Larkhaven, before the first catch | `before/1-larkhaven-north-road.png`: the goal says "Meet someone wild in the tall grass." There is no tall grass in Larkhaven and nothing names the road. | `after/1-larkhaven-north-road.png`: "Take the north road to Thornwood, then meet someone wild in the tall grass." |
| The first step onto Thornwood Trail | `before/3-thornwood-road-first-step.png` | `after/3-thornwood-road-first-step.png`: same place, the goal is now the tall grass beside you. |
| The title page when you come back after the tab was closed a moment after crossing the road | `before/4-title-page-on-return.png`: "in Larkhaven" (the road crossing was never saved) | `after/4-title-page-on-return.png`: "in Thornwood Trail" |
| After pressing Continue | `before/5-after-continue.png`: back in Larkhaven | `after/5-after-continue.png`: on Thornwood Trail, with Ripplet beside you |

## What was wrong

- **WBL-8, the road to Thornwood.** The road was built and every walk north worked, but the one line on screen sent a
  new player to "the tall grass" in a village that has none. Nothing named the road, so it read as a road that goes
  nowhere. Larkhaven now says to take the north road, and Thornwood Trail says to meet someone in the tall grass.
- **WBL-9, Continue.** The game saved every five seconds and when the window closed. A browser tab or a phone app never
  sends the window-closed signal, so leaving the page a moment after a new road put you back on the map before it. The
  game now also saves within half a second of arriving somewhere new, and when the tab is hidden or the app is switched
  away. The save file is the same as before, so old saves load exactly as they did.
- **WBL-7, the north exit.** Still not reproduced. `tests/north_roads.gd` from #416 stays, and the new test also walks
  the road with the real Up key and by clicking it.

## The test (WBL-10)

`wildbond-godot/tests/road_continue.gd` runs inside `tests/run_tests.gd`. It plays a journey from the first line,
writes the save the way the game does, quits three ways (window closed, tab hidden, killed with no warning), launches a
second game, presses Continue on the title page with the Enter key, a mouse click and a touch, and compares the place,
partner, team, bag, badges, story and goal. It never loads a fixture file. Run against main it fails 30 checks (the
crossing is lost and the goal never names the road); with the change it passes.
