# Wildbond Battle Slice — Godot integration notes

Standalone web demo (wildbond-battle-slice.html — open in any browser, fully playable).
This package: the demo + its art assets as separate PNGs.

## What transfers directly

**Art (assets/):**
- `bogsnap-back.png` — player's battle back sprite (ChatGPT, new personality bar — the style anchor)
- `bogsnap-idle-1..4.png` — 4-frame battle idle cycle, ~4fps, ping-pong
- `cindercub-front.png` — foe battle front sprite
- `battle-bg.png` — 16:9 pixel-art meadow battlefield (Evan-generated)

**Battle math (read the HTML source — all formulas are inline and commented):**
- Gen 3-style damage formula, stat stages, type effectiveness
- Status: burn / paralysis / sleep with per-turn handling
- 4 equipped moves per side

**Catch system:**
- base rate × HP factor × orb tier × status × throw-timing multiplier
- Timing-ring minigame (perfect 2x / good 1.5x)
- Classic 4-shake algorithm

**Presentation:**
- Chunky Game Boy-style HP cards, message box, menu buttons (pixel font)
- Battle composition: foe upper-right platform, player lower-left platform
- The demo IS the "full-colour stage" — Game Boy UI language over full-color art

## What does NOT transfer

- No Godot integration, no save system, no world — standalone page
- Move names are placeholders (Tackle, Water Gun, Spark, Numbing Mud)
- Element labels use test names in places — canon is Tide/Ember/Grove/Gale/Stone/Shade/Radiant
- Cindercub art is the old bar; Bogsnap is the new bar (don't mix as a standard)

## Suggested adaptation order

1. Lift the art + composition into the Godot battle scene
2. Port the damage/catch formulas (they're isolated functions in the source)
3. Rebuild the UI cards in Godot matching the demo's layout
4. Keep Wildbond's existing world/save systems untouched — this is presentation + math only
