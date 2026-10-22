# LR-TOYS-POLISH timing and before measurements

Claim for LR-G3 and LR-G4, measured on main `9494928f` before the polish. A comment on issue #373 was refused by the GitHub integration (`addComment` is not available to this run), so the claim is recorded here and on the pull request.

Palette on main, from `python3 tools/palette-inventory.py --game little-ranch --max 32`: 196 colours. The tool exits 1 because 196 is over the cap of 32. That cap failure is the same on main. This change has to lower the count and must not raise it.

What still failed on that main, in canvas pixels unless a line says CSS:

- At 1280×800 the pack sign and the wagon sign boards were 0.6 px apart. The pack board covered the cloud's face, and its post stopped in the sky.
- Block Tower at 12 blocks kept a camera offset of 0. At 844×390 a block was 17.6 CSS px and the old stack column was 28 CSS px.
- A tap on the stack or on open sky did not add a block. A tap on the tray during a tumble only played a note.
- Barn Band's wooden floor started at 72% of the height, so the lower stage read as empty. The idle hint sat on the drummer. Bunting crossed the barn button and the lock. The conductor stood on a dark ellipse.
- The stamped dough baby stayed peach after a blue tint. `doughCol()` had already changed.
- `ROUTINE_WAIT` was 18 seconds. The README said about eight seconds.

What already held, so this change locks it and does not redraw it:

- After a blue head paint, both shed eye centres stayed `#2a1a18` at 1280×800, 844×390, 820×1180 and 390×844.
- The shed head was already wider than 44 CSS px at 844×390 (about 123 CSS px).
- The idle glow already reaches `dsign` once earlier ranch things are used, and it already reaches the wagon puller once both babies are aboard.
- The yard pet already keeps `st.paint` until bedtime, and bedtime already clears it. No extra stored key.
- The shed outline already uses the yard fox's ears, tail, body and legs. It is filled white until it is painted.

The nine-second wait, measured after the code change by `node tools/run-all-checks.cjs little-ranch` (702 checks, PASS, on game code `7e9f6c06`):

- `ROUTINE_WAIT` is 9.
- After bedtime, 8 seconds leaves the toothbrush step at 0 and not doing itself. The code starts a step only when the wait is strictly longer than 9 seconds.
- 1.2 seconds more (9.2 seconds in all) starts the toothbrush.
- The README bedtime line says "about nine seconds", and the changelog section is not the place that line was checked.

Palette after the same code, from `python3 tools/palette-inventory.py --game little-ranch --max 32`: 195 colours. The tool still exits 1 because 195 is over the cap of 32. The count went down by one. `#ff9ac0` is gone. No new hex was added.

Before pictures for Game Art Director are in [../lr-toys-polish/before](../lr-toys-polish/before). After pictures are in [../lr-toys-polish/after](../lr-toys-polish/after).
