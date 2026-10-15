# LB-PAL: Lantern Bowl at 30 colours

The six merges in `docs/art/lantern-bowl-palette-merge.md` (#505), applied. `python3 tools/palette-inventory.py --max 30` goes from 36 counted colours to 30 and exits 0.

| # | Merge | Where it landed |
|---|---|---|
| 1 | `#10141c` → `#141820` | `style.css` L7 (`var(--dusk)`), L121 (`rgba(20, 24, 32, …)`, same alphas) |
| 2 | `#101820` → `#141820` | `style.css` L32 (`var(--dusk)`), and `roster-view.js` L92 (`--lbrv-panel`, see "One edit outside the spec's list") |
| 3 | `#2a3040` deleted | the `PALETTE` array in `view.js` (L315); nothing drew from it |
| 4 | `#c9bc9a` → `#d9c89a` | `view.js` L314 (PALETTE) and L563 (meter frame), `game.js` L955 (stick knob), 123 sprite pixels in 12 PNGs |
| 5 | `#1a120c` → `#1e1a22` | `style.css` L138 (Turbo text while held) |
| 6 | `#000000` → `#141820` | `style.css` L42 (HUD text shadow, `var(--dusk)`) |

Removed from the counted set: `#000000, #10141c, #101820, #1a120c, #2a3040, #c9bc9a`. Added: nothing (`inventory-before.md`, `inventory-after.md`).

## One edit outside the spec's list

The spec's "only the intended edits" list names `style.css`, `view.js`, `game.js:955` and the PNGs. `roster-view.js` landed with #495 after that list was written and has `--lbrv-panel:#101820` at L92. Without changing it `#101820` stays counted and the total is 31. It is a one-token change to `#141820`, the same colour merge 2 sends every other `#101820` to. The spec says the count includes `roster-view.js` if #495 has landed, so I took that as the instruction. If GAD would rather have that line in its own change, it is a single revert and the count goes to 31.

## Evidence for each point of "What the review will check"

1. **The count.** `python3 tools/palette-inventory.py --max 30` exits 0: "lantern-bowl palette: 30 colours". The counted set equals the spec's 30-colour list.
2. **No new hex.** The after set is a subset of the before set (checked with `--json`: removed six, added none). No named colour, no `shared/` file.
3. **Only the intended edits.** `python3 docs/playtests/lb-palette-30/png-diff.py` (output in `png-diff.txt`): 12 PNGs, 123 pixels, all `#c9bc9a` → `#d9c89a` with the same alpha, 0 stray pixels, 0 `_mask.png` changed. Per file: defence line idle 2, run 4, tackle 2; defence skill idle 2, run 4, tackle 2; offence line idle 14, run 27; offence skill dive 12, idle 13, run 27, throw 14.
4. **The contrast table.** `python3 docs/playtests/lb-palette-30/contrast.py` (output in `contrast.txt`) recomputes every row of the spec's table from the colours and also checks that the head's source uses the "after" colours. Every row matches the spec to the second decimal. Lowest text ratio after: 9.45:1. No graphic falls from 3:1 or above to below. The four pairings already under 3:1 on main (meter frame and stick knob on grass at 2.63 and 2.18 after, the screen border and button fill against the page) are still under it; the spec leaves them.
5. **Screenshots.** `shots/before-*.png` (main, `b8493ff`) and `shots/after-*.png` (this head), 844x390 and 1920x1080, device pixel ratio 1, a fresh save and a fake clock so both builds see the same frames. Five screens each: `title` (the title panel), `pass-aim` (a pass aimed mid-drag: the power meter), `run-stick` (a run mid-drag: the touch stick and knob), `roster` (the #495 preview page) and `final` (the Final panel). `capture.cjs` makes them; `diff.cjs` compares them.
6. **Tests.** `node tools/run-all-checks.cjs lantern-bowl`: 657 checks pass, as on main. The roster-view and standings node tests pass. CI is on the PR.

The meter and the stick are separate screens because they cannot show together: the stick only appears while you carry the ball, and the meter only while you aim a pass. Both are covered at both sizes.

## The pixel diff

`pixel-diff.txt` bins every changed pixel:

- **merge**: the exact colour change one merge makes (the page, the screen fill, the sprite trim, the meter frame, the knob).
- **shadow**: the HUD text shadow, a near-black pixel that becomes `#141820` or within 8 of it (merge 6, which removes the visible shadow on purpose).
- **edge**: an antialiased pixel next to a pixel that took an exact merge (the rim of the meter frame and the knob).
- **blend**: a shift of 8 or less per channel where a translucent layer (the title vignette, panels, the gradient at `style.css:121`) sits over a merged base, so its result moves with the base. This is most of the title screen: the gradient is `rgba(20, 24, 32, …)` over `#141820` now.
- **other**: the rest. On every pair they all sit in the one text row of the HUD strip (`y 54-62` at 844x390, `y 62-70` at 1920x1080), 140 to 180 pixels: the antialiased fringe of the HUD text where its shadow went away. Nothing else on any screen moves.

`pixel-noise-floor.txt` is the same table for two runs of the *same* build. Rendering noise is 0 to 43 pixels of at most 2 levels, except `pass-aim-844x390`, where the aim guide's wobble moves 1,669 pixels between two runs of one build (the box `x509-708 y104-290`). That wobble is the same size in the before and after pair, so the "other" count there is higher than for the other screens, and it is not a palette change. The roster page is pixel-identical between runs.

## Not fixed, and for the reviewer

- **The HUD text shadow is gone on purpose** (merge 6, `#000` → the dusk colour at 1.00:1). The HUD strip is `#141820ee`, near opaque, and the text on it is the body text colour at about 15:1, so the shadow carried no contrast; check the HUD by eye all the same.
- **Meter frame and stick knob on grass** are still under 3:1 (2.63 and 2.18). The meter sits in an ink well and the knob in a `#f6edd4` ring, so both stay readable; a follow-up, as the spec says.
- **`VERSION` stays 0.1.8** and `sw.js` is untouched; the Director moves the version on merge.
- **Sprite files are larger** (about 110 bytes each, 267 → 381 for the first) because they were re-encoded by Pillow. The pixels and alpha are identical to main apart from the 123 swaps (`png-diff.txt`).
- **Season clubs.** `season.json` still adds up to 12 colours when it ships. This leaves two slots of headroom, as the spec warns.
- No `shared/`, `sw.js`, root `index.html`, `main.gd` or save change, and no pack rebuild.
