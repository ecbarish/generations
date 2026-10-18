# Starter sprite review: Mosshog, Ripplet, Cindercub (PR #559)

WB-STARTER-SPRITES-REVIEW · Claude (lane S, independent review for Codex) · 2026-10-18 · reviewed commit
`cce4ae5a4838635c023a1a4e8afcf16b814e0b8c`, concept authority `docs/art/creature-vision/starter-personalities-v1.png` (#548).

This review covers the art and animation only. Starter selection, battle, follower and save integration (#560) belong to Codex
and were not reviewed. Nothing was regenerated, and no runtime file, asset or save was edited. Frame indices follow
`frames.json`: **0** front, **1** front blink, **2** back, **3** back breath, **4–7** walk down, **8–11** down-right,
**12–15** right, **16–19** up-right, **20–23** rear. Left-facing views are mirrors.

## Verdict

The identities are faithful. Mosshog's garden, sprout and tusks, Ripplet's wave frill and curled tail, and Cindercub's ears,
paws, flame tail and ember patches all survive at game size, and none of the three has been redesigned. Ripplet's white frill
rim gives the clearest silhouette of the three, and the Ripplet and Cindercub rear walks are steady. **They are not ready to
accept yet.** Six defects are visible in play: the blink and breath frames jump, the body swings sideways during walks, the
feet slide, the battle fronts are about 1.5× denser than the Pokémon beside them, the battle comparison scales unevenly, and
Cindercub's face flickers. Every fix is cleanup or configuration. None needs a new design or a new generation.

## Evidence

The evidence images contain original art only and are committed:

- [mosshog](media/mosshog-native-anchored.png), [ripplet](media/ripplet-native-anchored.png) and
  [cindercub](media/cindercub-native-anchored.png): each frame rendered at game size with the same 32/64-pixel budget and
  16-colour palette as the shaders.
  - Rows are the pose groups 0–1, 2–3, 4–7, 8–11, 12–15, 16–19 and 20–23.
  - Each frame sits on its own foot anchor (red tick) on a shared ground line.
  - The right-hand column overlays the group's silhouettes in red/blue/yellow/green, so any colour fringe is movement the
    player sees.
- [cindercub-walk-down-4-7-source.png](media/cindercub-walk-down-4-7-source.png): source crop of frames 4–7.

[review_frames.gd](review_frames.gd) regenerates the measurements and the contact sheets. Run it with `--headless --path wildbond-godot --script`; it writes to
an external folder.

The captures that include Pokémon art stay outside Git, at `C:/Users/evanb/AppData/Local/Temp/claude-starter-review/`:

- `private-gl_compatibility/` and `private-forward_plus/` hold `*-battle.png`, `*-world.png` and `starter-trio.png`.
- `zoom-*-world.png` shows each follower at 4× beside the PMD Pidgey.

My run of `tests/starter_sprites/checks.gd -- --private --capture` passed **369 checks, 0 failures** under Compatibility
and again under Forward+.

## Defects, in priority order

| # | Species and frames | What the player sees | Measured | Fix (cleanup, not redesign) |
|---|---|---|---|---|
| 1 | **Ripplet 0→1** | The curled tail vanishes for the whole blink. | Frame 0 is 256 px wide, frame 1 is 211; the tail exists only in frame 0 (red in the overlay). | Build the blink by copying frame 0 and painting only the eyelids. |
| 1 | **Cindercub 0→1, 2→3**; **Mosshog 2→3**; **Ripplet 2→3** | The whole body jumps when it blinks or breathes. | Body centre moves against the anchor by Cindercub 0.6→5.4 and 1.5→−0.8 art px, Mosshog 4.0→−0.1, Ripplet's tail shrinks in 3. | Front blink: eyelids on frame 0 only. Back breath: frame 2 with the torso raised 1 px. Remove the alternate pose until it's cleaned. |
| 2 | **Mosshog 4–7, 20–23**; **Cindercub 12–15**; **Ripplet 8–11** | The body swings side to side, or lurches forward and back, while walking straight. | Body centre minus foot anchor: Mosshog down +3.1/−0.3/−4.1/+3.0 (7 px on a 27 px sprite), rear +2.9/−3.3/+2.3/−4.0; Cindercub right −0.1/+1.2/−4.5/+4.1; Ripplet down-right −5.3/−2.2/−1.1/+1.8. | The anchor follows "the lower foot", so it changes every frame. Use one root per direction and species, for example the mean body centre of its 4 frames, and leave the ground line as y. Recheck that the stop pose (phase 1) doesn't pop. |
| 3 | All walks | Feet skate: the legs pedal while the body glides. | `actor_motion.gd:24` advances a frame every 0.29 m (the trainer's stride), a 1.16 m cycle for a 0.55–0.60 m creature. The art's feet move about 1–2 art px (≈0.02–0.04 m) per frame, while the body travels ≈17 art px. | Give each species its own stride distance, about 0.12–0.16 m per frame at these heights, or derive it from measured foot travel. Keep the trainer's value. |
| 4 | Battle fronts 0/1, all three | The starters look finer-grained and more detailed than the Platinum fronts beside them. | Front ink height is 62 px for all three. Reference fronts: Pidgey 35, Wooper 31, Vulpix 48 (80 px canvas). Backs are comparable: starters 57–62, references 47–59. On screen the starter fronts show ≈5 screen px per art px; reference fronts show 6–9. | Lower the front budget to about 44–48 px of ink height, the base-stage size, and keep the backs at 56–62. Bake the result as a native atlas (see 7). |
| 5 | Gallery, Ripplet and Cindercub | Pixels are uneven widths (5 and 6 screen px alternate). | Run lengths in the battle captures alternate 5:6. | `_portrait` (`preview.gd:87–100`) fits the art to the box at a non-integer scale. Snap to an integer number of screen pixels per art pixel. Show the references at the same art-pixel scale too, so the comparison stays truthful. |
| 6 | **Cindercub 4–7** | The face flickers while walking towards the camera. | Frames 5 and 7 have one eye shut and frame 4's head tilts ([source crop](media/cindercub-walk-down-4-7-source.png)). | Paste frame 6's face onto 4, 5 and 7. |
| 7 | All world frames, mostly Mosshog | Leaf texture "crawls" between frames, and Mosshog reads as a bush with a broken outline at 32 px. | The world shader starts its sampling grid at each frame's own region corner (`world_pixels.gdshader`, `preview.gd:45–46`), so the grid shifts against the body every frame. The 16-colour pick then turns soft shading into single-pixel speckle. | Bake native frames once from a fixed origin, then hand-clean them. Use a continuous dark outline like the PMD Pidgey's, group the leaves into 3–4 clumps, and keep the face and belly flat cream. |
| 8 | **Mosshog 4–7** | The tusks are missing when walking towards the camera. | Tusks appear in 0/1 and 12–15 but not in the front walk. | Add two small upturned tusk pixels beside the snout in 4–7. The tusks are an approved identity feature. |
| 9 | **Ripplet 8 vs 9–11, 16 vs 17–19, 2 vs 3** | The tail pops longer or shorter mid-cycle. | Frames 8 and 16 have an extended tail; their neighbours have a tucked one. | Keep one tail length per direction and let it sway 1–2 px. |
| 10 | **Cindercub 8–11** | It looks smaller for a moment when turning diagonally. | Ink is 24×26 at down-right, against 19×31 front and 18×32–33 rear. The head reads about 15% smaller. Perspective accounts for part of it. | Match the head width to the front and rear walks. Mosshog's down-right (30–31 tall against 27–28 side) is milder; recheck it after fix 2. |

## Taste and judgement (not defects)

- **Breath timing.** The back pose swaps for 0.16 s every 3.8 s (`art.gd:39`), which reads as a twitch. A slow 1 px rise over
  about 2 s would read as breathing. Front blinks at this rate are fine.
- **Mosshog's personality.** At game size it reads cuter and rounder than the concept's stubborn, heavily planted boar, and
  the knowing brow disappears. A slightly lower head and wider hoof stance in 0 and 12–15 would recover it.
- **Ripplet's front walk (4–7).** The eyes shrink to amber slits and the dark crest stripe can read as a long nose. That makes
  it look sulky rather than curious. Giving the eyes one more highlight pixel would keep the concept's face.
- **Cindercub's front walk (4–7).** The flame tail above the head reads as a flame hat. Tilting it to one side would separate
  head from tail.
- **Mirroring.** Mirroring the five drawn views for left-facing directions is normal practice. The sprout and the ember
  patches flip with it, which is acceptable.
- **Shadow size.** The follower's shadow disc is about 3× the sprite's width. This is a presentation choice, not art, and it
  belongs to the integration owner.

## Suggested order

1. Fixes 1, 2 and 6 are the biggest visible wins, cost almost nothing and need no art judgement.
2. Then fix 3, the stride distance (configuration).
3. Then bake the native atlas once (fixes 4, 5 and 7), so the hand cleanup in fixes 8–10 happens on real game pixels.
4. Re-run the starter checks with the new atlas hashes, and get Evan's eye on the walking preview before #560 ships it.
