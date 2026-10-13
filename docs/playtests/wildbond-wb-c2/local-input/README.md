# WB-C2 local input-only timing evidence

These reports were produced with Godot 4.6.3, `--headless --fixed-fps 60`, on the immutable baseline project copied before changes and the WB-C2 modified project. They measure simulated elapsed frames under a disclosed reading protocol, **not real novice play time**, rendering quality, or physical mobile/browser input. Baseline reports identify 40fcaf9 and contain the SHA-256 of `main.gd` at `40fcaf9`; current reports contain the changed file's SHA-256. The `working` source label is a local run label, not a Git SHA. The local checkout HEAD may differ from the source uploaded through the repository connector; use each report's file hash for source identity.

Both variants configure the headless window after initialization: keyboard 1920×1080, touch 812×375. Neither is rendered evidence. CI runs the identical input/read protocol in Xvfb with official Godot 4.7.2 at 1920×1080 keyboard and 812×375 touch, for all three starters, against baseline and current source. Its capture and window assertions must pass separately.

- Fresh game, including how-to: 12 seconds
- Dialogue: 180 words/minute + 0.75 seconds per line
- Character creator: fixed 30 seconds, default Rowan / Farmfolk, sign through input
- Walk through ordinary keyboard or touch-pad input; route/state reads only
- Meet chosen starter, use “Not yet”, reopen: 2-second consideration
- Read partner card: 12 seconds; deliberately choose (keyboard additionally pauses one second after moving selection)
- Measure both acquisition and control after all bond dialogue, including the relocated heritage story
- Touch waits two frames after movement for the context button to refresh; X11 additionally settles the pointer for four frames

No `_skip_opening`, direct signed/chosen handlers, teleportation, story-state writes, or shortened game waits. Character and journey saving are disabled; HOME/XDG directories are isolated. Creature wandering uses seed 20261013 in both variants; dialogue duration still affects where a creature is when approached. Redraw is paused only during simulated reading budgets; every game frame still advances.

Run from repository root (use a fresh isolated HOME/XDG path for each case):

```
HOME=/tmp/wb-home XDG_DATA_HOME=/tmp/wb-data XDG_CACHE_HOME=/tmp/wb-cache \
OPENING_METHOD=keyboard OPENING_STARTER=0 OPENING_OUTPUT=/tmp/wb-report \
SOURCE_SHA="$(git rev-parse HEAD)" \
godot --headless --path wildbond-godot --audio-driver Dummy --fixed-fps 60 \
  --script "$PWD/tools/audit/wildbond_opening_timing.gd"
```

Rendered CI: `.github/workflows/wildbond-opening-timing.yml`. Pairwise report validator: `tools/audit/validate_wildbond_opening_timing.py`. It requires acquisition and completed encounter both at or below 180 simulated seconds and faster than baseline, with successful input completion and (in CI) rendered captures. Local pairwise keyboard and touch comparisons passed. All current starters passed both methods; maximum current acquisition was 119.55 seconds and returned control 174.95 seconds.
