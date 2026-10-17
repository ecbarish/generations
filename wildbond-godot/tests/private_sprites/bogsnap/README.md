# Bogsnap first animation pass

`walk-idle-v2.png` was generated with the built-in ImageGen tool on 2026-10-17 from Evan's approved Bogsnap sheet in `../../battle_slice/approved_bogsnap/approved-model-sheet.jpg`. It preserves the leafy olive crocodile design. This is new prototype animation art, not a pixel extraction of the approved sheet and not final production animation.

Rows contain four back-three-quarter idle poses (including a blink), four back-three-quarter walking poses, four front-three-quarter walking poses, and four right-facing side walking poses. This first sheet supplies the side and diagonal views; see the extension below. The approved starter concepts remain unchanged.

The first generated sheet crowded/clipped the outer cells and is not used. V2's actual dimensions are 1261×1247; it is **not** a uniform grid. `frames.json` records individually inspected full-body regions and ground anchors, with transparent padding. Do not divide the whole image into equal tiles. Runtime uses a constant scale across frames; tests verify every region is in bounds and has clear opaque-alpha margins. Source PNG bytes/alpha are preserved unchanged.

Idle uses a brief blink once per 3.8 seconds; walking phase follows actual travel distance. Walls and stopping halt the walk cycle. The companion follows sampled player footsteps, rather than a permanently offset painting sliding toward the player. In the isolated battle study, Bogsnap also uses the breathing/blinking poses.

See `generation-prompts.txt` for the complete initial and correction prompts. Generated files are intentionally confined to the export-excluded study.

## Eight-direction extension

Evan's feedback identified the missing true front/back views. `axial-walk-v1.png` adds four actual rear-facing and four front-facing walking poses, generated with built-in ImageGen from the same approved design. `axial-prompts.txt` preserves the complete prompt. Its measured dimensions are 1774x887; `axial-frames.json` records full-body regions and manually checked foot anchors. Rear anchors follow the feet, not the tail tip. The raw PNG is preserved unchanged.

The current companion selects down/front, down-right/front diagonal, right/side, up-right/rear diagonal, and up/true rear. The three leftward directions mirror their rightward counterparts. That gives eight movement directions using five drawn views, not eight independent drawings. All walking views have four poses; this does not yet match the frame count and hand-tuned consistency of the imported PMD animations. Small directional hysteresis prevents flickering at sector boundaries, and idle retains its last view with gentle breathing. Twenty-four total poses now include the original idle set.

The gait phase now survives brief movement pauses. Previously the follower catch-up threshold could repeatedly restart frame zero; separation hysteresis and distance-based speed correction now keep a sustained stride. Native capture verifies at least three distinct poses during actual held-key following.
