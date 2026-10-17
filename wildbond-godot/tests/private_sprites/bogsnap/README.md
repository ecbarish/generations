# Bogsnap first animation pass

`walk-idle-v2.png` was generated with the built-in ImageGen tool on 2026-10-17 from Evan's approved Bogsnap sheet in `../../battle_slice/approved_bogsnap/approved-model-sheet.jpg`. It preserves the leafy olive crocodile design. This is new prototype animation art, not a pixel extraction of the approved sheet and not final production animation.

Rows contain four back-three-quarter idle poses (including a blink), four back-three-quarter walking poses, four front-three-quarter walking poses, and four right-facing side walking poses. Leftward movement mirrors the side view. This provides three views, not eight independently drawn directions. The approved starter concepts remain unchanged.

The first generated sheet crowded/clipped the outer cells and is not used. V2's actual dimensions are 1261×1247; it is **not** a uniform grid. `frames.json` records individually inspected full-body regions and ground anchors, with transparent padding. Do not divide the whole image into equal tiles. Runtime uses a constant scale across frames; tests verify every region is in bounds and has clear opaque-alpha margins. Source PNG bytes/alpha are preserved unchanged.

Idle uses a brief blink once per 3.8 seconds; walking phase follows actual travel distance. Walls and stopping halt the walk cycle. The companion follows sampled player footsteps, rather than a permanently offset painting sliding toward the player. In the isolated battle study, Bogsnap also uses the breathing/blinking poses.

See `generation-prompts.txt` for the complete initial and correction prompts. Generated files are intentionally confined to the export-excluded study.
