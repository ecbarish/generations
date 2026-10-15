# Lantern Bowl palette merge

This spec brings Lantern Bowl back under the house cap of about 32 colours per game (docs/art/README.md, rule 6). It was written against main at `df3d30c2` (LB-G10, #496, 15 Oct 2026, 00:55 ET). On that commit the game uses 36 colours. After the six merges below it uses 30, which leaves two slots of headroom. The ink `#1e1a22` and the lamplight `#f2d080` are not merged and do not change.

The change is polish only. No layout, size, timing, text or save data changes. Apart from the merges listed here, a player should see nothing different.

## How to count

The count comes from `tools/palette-inventory.py` (the copy that goes with this spec). Run it from the repo root:

```
python3 tools/palette-inventory.py                 # plain report, one colour per block with every file:line
python3 tools/palette-inventory.py --markdown      # the same as a Markdown table
python3 tools/palette-inventory.py --max 30        # exits 1 if the game uses more than 30 colours
python3 tools/palette-inventory.py --json out.json # full data for a diff
```

The script needs Python 3 and Pillow (`pip install pillow`) for the sprite scan. On a machine without Pillow, `--skip-sprites` still runs, but then it can miss a colour that appears only in a sprite. On main today the sprites add no colour that the code does not already name, so both runs give 36.

These are the rules the script uses. A reviewer should judge the count by the same rules.

1. **Every form is read.** The script reads `#rgb`, `#rgba`, `#rrggbb` and `#rrggbbaa`, as well as `rgb()`, `rgba()`, `hsl()` and `hsla()`. It also reads CSS named colours (such as `white` or `black`) when they appear as a CSS value, an SVG `fill` or `stroke`, or a whole JavaScript string. `transparent`, `currentColor`, `inherit` and `none` are not colours. Lantern Bowl uses no named colours today.
2. **Comments are not colours.** CSS and HTML comments are removed before the scan. In JavaScript only string literals are read, so a note such as "see #444" is never counted.
3. **Alpha folds into its base.** Every value is reduced to its opaque `#rrggbb`. `#141820`, `#141820f2` and `rgba(20, 24, 32, 0.94)` are one palette colour. A colour used only with transparency still counts once, as its base. A fully transparent value (alpha 0) is not counted. Colours the browser mixes at run time are not counted either. That covers `opacity`, `globalAlpha`, a translucent fill over the canvas, and the in-between shades of a gradient. Only the stops count. So a translucent variant never costs a slot, but a new base always does.
4. **Sprites count by what the player sees.** Every opaque pixel colour in `games/lantern-bowl/art/*.png` is counted. The `_mask.png` files are tint masks and are not counted. The key colours `#ff00ff`, `#c000c0` and `#800080` are not counted, because `view.js` repaints every key pixel with the club ramp. The script checks that each key pixel sits under the mask. On main all 1,305 key pixels do.
5. **Shared chrome is listed but not counted.** `index.html` loads `shared/engine.js`, `shared/settings.js`, `shared/sound.js` and `shared/feedback.js`. Their colours belong to the arcade-wide Settings panel and save notices, and every game shows them. The house cap is per game, so these are reported separately and this spec does not change them.
6. **Data counts only when the game loads it.** `season.json` names six club colours. No loaded script fetches `season.json` yet, so its four new colours are listed but not counted.

The game total is the number of distinct bases across game code (`.css`, `.js`, `.html`), the sprite pixels the player sees, and loaded data.

## Inventory on main (df3d30c2): 36 colours

Line numbers are on `df3d30c2`. Paths without a folder are in `games/lantern-bowl/`. In the Uses column, the first number counts the code lines, and "+ N sprites" counts the sprite PNGs that contain the colour.

| # | Hex | Role | Uses | Where | Plan |
|---|---|---|---|---|---|
| 1 | `#000000` | HUD text shadow (style.css:42). The other uses are shared chrome shadows and are not counted. | 1 | style.css:42 (`#000`), shared/engine.js:93 (`rgba(0,0,0,.4)`) [shared, not counted], shared/engine.js:202 (`rgba(0,0,0,.4)`) [shared, not counted], shared/settings.js:32 (`rgba(0,0,0,.5)`) [shared, not counted], shared/feedback.js:13 (`#000`) [shared, not counted], shared/feedback.js:14 (`rgba(0,0,0,.25)`) [shared, not counted] | Merge into `#141820` (ΔE 7.33) |
| 2 | `#10141c` | Page background behind the cabinet, and the stops of the dark curtain gradient behind panels. | 4 | style.css:7, style.css:121 (`rgba(16, 20, 28, 0.05)`), style.css:121 (`rgba(16, 20, 28, 0.05)`), style.css:121 (`rgba(16, 20, 28, 0.94)`) | Merge into `#141820` (ΔE 1.17) |
| 3 | `#101820` | Fill of the play screen frame behind the canvas. | 1 | style.css:32 | Merge into `#141820` (ΔE 2.20) |
| 4 | `#141820` | Dusk (--dusk): the canvas letterbox fill, the field top strip, and the HUD, sheet, cue, hint, banner and Turn your phone backgrounds. | 10 | game.js:926, style.css:1, style.css:42 (`#141820ee`), style.css:54 (`#141820d0`), style.css:60 (`#141820f2`), style.css:81 (`#141820e6`), style.css:105 (`#141820f2`), style.css:112, view.js:318, view.js:481 | Keep |
| 5 | `#1a120c` | Turbo button text while Turbo is held, on lamplight. | 1 | style.css:138 | Merge into `#1e1a22` (ΔE 8.55) |
| 6 | `#1b2430` | Panel (title, pause, final) background and its action row. | 2 | style.css:127 (`#1b2430f2`), style.css:135 | Keep |
| 7 | `#1c4a58` | Millrace dark ramp shade, and the Millrace end zone. | 4 | view.js:316, view.js:322, view.js:685, view.js:686 | Keep |
| 8 | `#1e1a22` | Ink: every outline, the power meter well, the label plate under the throw label, and the ball ends. Protected. | 11 + 12 sprites | model.js:43, view.js:314, view.js:561, view.js:628, view.js:634, view.js:635, view.js:636, view.js:760, view.js:783, view.js:842, view.js:861, 12 sprite PNGs, 1767 px | Keep (protected) |
| 9 | `#243044` | Button fill. | 1 | style.css:12 | Keep |
| 10 | `#2a3040` | Listed in the canvas PALETTE array only. Nothing draws it. | 1 | view.js:315 | Merge into `#243044` (ΔE 2.52) |
| 11 | `#2d6f80` | Millrace club colour, mid ramp shade. | 6 | model.js:65, view.js:316, view.js:322, view.js:322, view.js:684, view.js:685, season.json:15 [data, not loaded] | Keep |
| 12 | `#2d8a3c` | Grass stripe, dark. | 2 | view.js:312, view.js:317 | Keep |
| 13 | `#38994a` | Grass stripe, light. | 2 | view.js:312, view.js:317 | Keep |
| 14 | `#3a2a30` | Closed run lane line. | 2 | view.js:160, view.js:318 | Keep |
| 15 | `#3e4658` | Dark grey pixels in the six defence sprites. | 1 + 6 sprites | view.js:315, 6 sprite PNGs, 89 px | Keep |
| 16 | `#4a93a4` | Millrace light ramp shade. | 2 | view.js:316, view.js:322 | Keep |
| 17 | `#4aa8ff` | Line of scrimmage, landing ring of the pass guide, power meter fill. | 4 | view.js:317, view.js:523, view.js:570, view.js:610 | Keep |
| 18 | `#5a6478` | Mid grey pixels in the six defence sprites. | 1 + 6 sprites | view.js:315, 6 sprite PNGs, 187 px | Keep |
| 19 | `#5e3020` | A few dark brown pixels (1 to 4 per sprite) in the run, dive and throw sprites. | 1 + 6 sprites | view.js:315, 6 sprite PNGs, 19 px | Keep |
| 20 | `#6d5a38` | Button border and screen frame border. | 2 | style.css:12, style.css:32 | Keep |
| 21 | `#8a3420` | Lanterns dark ramp shade, and the Lanterns end zone. | 5 | view.js:316, view.js:321, view.js:415, view.js:685, view.js:686 | Keep |
| 22 | `#8a4a2a` | Ball leather (view.js:779), and a few brown pixels in the run, dive and throw sprites. | 2 + 6 sprites | view.js:315, view.js:779, 6 sprite PNGs, 19 px | Keep |
| 23 | `#8a5e48` | Dark skin tone in all 12 sprites. | 1 + 12 sprites | view.js:314, 12 sprite PNGs, 64 px | Keep |
| 24 | `#8a7e64` | Listed in the canvas PALETTE array only. Nothing draws it yet. | 1 | view.js:314 | Keep, and give it the #495 unlit star |
| 25 | `#b89a5a` | Contested run lane line. | 2 | view.js:159, view.js:318 | Keep |
| 26 | `#c45a32` | Lanterns club colour, mid ramp shade, and the fallback figure fill. | 8 | model.js:56, view.js:316, view.js:321, view.js:321, view.js:415, view.js:683, view.js:686, view.js:872, season.json:8 [data, not loaded] | Keep |
| 27 | `#c99a78` | Skin mid tone in idle, dive and throw sprites. | 1 + 6 sprites | view.js:314, 6 sprite PNGs, 15 px | Keep |
| 28 | `#c9bc9a` | Light trim pixels in all 12 sprites, the power meter frame and the touch stick knob. | 3 + 12 sprites | game.js:955, view.js:314, view.js:563, 12 sprite PNGs, 123 px | Merge into `#d9c89a` (ΔE 4.45) |
| 29 | `#d9c89a` | Secondary text: HUD team names, the version label and the hint line. | 3 | style.css:47, style.css:65, style.css:100 | Keep |
| 30 | `#e07a48` | Lanterns light ramp shade. | 3 | view.js:316, view.js:321, view.js:415 | Keep |
| 31 | `#e7c4a8` | Skin light tone in sprites and on the fallback figure. | 2 + 12 sprites | view.js:314, view.js:877, 12 sprite PNGs, 196 px | Keep |
| 32 | `#f2d080` | Lamplight: titles, scores, links, focus ring, open lane, the aimed player and the Turn your phone icon. Protected. | 10 | index.html:40, style.css:1, style.css:138, view.js:158, view.js:164, view.js:165, view.js:314, view.js:630, view.js:760, view.js:763 | Keep (protected) |
| 33 | `#f6edd4` | Main text, yard numbers, field labels, the carrier ring, the pass arc, the stick ring and light pixels in the offence sprites. | 23 + 6 sprites | game.js:947, game.js:950, index.html:41, index.html:42, style.css:1, style.css:54, style.css:112, view.js:160, view.js:163, view.js:163, view.js:314, view.js:469, view.js:496, view.js:512, view.js:559, view.js:600, view.js:612, view.js:636, view.js:668, view.js:764, view.js:781, view.js:794, view.js:846, 6 sprite PNGs, 189 px | Keep |
| 34 | `#ffb0a4` | Warning tint: a wobbling pass arc, a covered receiver and the collapsing pocket ring. | 7 | view.js:164, view.js:165, view.js:166, view.js:166, view.js:318, view.js:600, view.js:635 | Keep |
| 35 | `#ffdd33` | Goal posts, first-down line and the open window mark. | 4 | view.js:317, view.js:517, view.js:525, view.js:634 | Keep |
| 36 | `#ffffff` | Yard lines and hash marks. | 3 | view.js:317, view.js:502, view.js:506, shared/engine.js:93 (`#fff`) [shared, not counted], shared/engine.js:202 (`#fff`) [shared, not counted], shared/feedback.js:13 (`#fff`) [shared, not counted] | Keep |

### Listed but not counted (16)

These colours appear only in shared chrome or in data the game does not load. `#000000` and `#ffffff` also appear in shared chrome, but they are in the table above because the game itself uses them.

| Hex | Where it lives | Uses | Where |
|---|---|---|---|
| `#080a12` | shared chrome | 1 | shared/settings.js:31 (`rgba(8,10,18,.55)`) |
| `#1a1020` | shared chrome | 2 | shared/settings.js:35, shared/settings.js:37 |
| `#1a1f2c` | shared chrome | 1 | shared/settings.js:32 |
| `#1d2433` | shared chrome | 2 | shared/engine.js:93, shared/engine.js:202 |
| `#232a3a` | shared chrome | 2 | shared/settings.js:34, shared/settings.js:35 |
| `#3a4560` | shared chrome | 1 | shared/settings.js:32 |
| `#47526d` | shared chrome | 2 | shared/settings.js:34, shared/settings.js:35 |
| `#75a46e` | season.json, not loaded | 1 | games/lantern-bowl/season.json:43 |
| `#7f7f7f` | shared chrome | 1 | shared/feedback.js:17 (`rgba(127,127,127,.15)`) |
| `#8be0d6` | shared chrome | 3 | shared/settings.js:35, shared/settings.js:35, shared/settings.js:35 |
| `#8e86c4` | season.json, not loaded | 1 | games/lantern-bowl/season.json:29 |
| `#b47e9b` | season.json, not loaded | 1 | games/lantern-bowl/season.json:36 |
| `#cccccc` | shared chrome | 1 | shared/feedback.js:14 (`#ccc`) |
| `#d6b34c` | season.json, not loaded | 1 | games/lantern-bowl/season.json:22 |
| `#eef1f7` | shared chrome | 3 | shared/settings.js:32, shared/settings.js:34, shared/settings.js:35 |
| `#f2c14e` | shared chrome | 5 | shared/engine.js:93, shared/engine.js:202, shared/settings.js:35, shared/settings.js:35, shared/settings.js:37 |

## The merges: 36 to 30

Each colour below folds into its nearest perceptual match among the colours that stay. The distance is CIEDE2000 (ΔE00) on sRGB with a D65 white point. A ΔE under about 2.3 is hard to see side by side. A ΔE between about 4 and 9 is a slight shift that a careful look at the same pixel can find.

| # | Remove | Fold into | ΔE00 | Where it changes | What the player sees |
|---|---|---|---|---|---|
| 1 | `#10141c` | `#141820` (dusk) | 1.17 | style.css:7 becomes `background: var(--dusk);`. style.css:121 becomes `rgba(20, 24, 32, …)` at the same three alphas (0.05, 0.05 and 0.94). | The page behind the cabinet and the curtain behind panels are a hair lighter. Nothing visible at normal viewing. |
| 2 | `#101820` | `#141820` (dusk) | 2.20 | style.css:32 becomes `background: var(--dusk);`. | The screen fill sits behind the canvas, so it shows only at the rounded frame edge. It now matches the canvas letterbox exactly. Nothing visible at normal viewing. |
| 3 | `#2a3040` | `#243044` | 2.52 | Delete `'#2a3040'` from the `PALETTE` array at view.js:315. | Nothing. No code draws this colour. |
| 4 | `#c9bc9a` | `#d9c89a` | 4.45 | game.js:955 and view.js:563 change to `#d9c89a`. At view.js:314, swap the `PALETTE` entry to `#d9c89a`, because it is already in the array. In all 12 sprite PNGs, repaint the 123 pixels of `#c9bc9a` to `#d9c89a` (the alpha stays 255, and the masks are not touched). | The sprite trim, the power meter frame and the stick knob are a little lighter and warmer. That makes them the same colour as the HUD names and the hint. |
| 5 | `#1a120c` | `#1e1a22` (ink) | 8.55 | style.css:138 becomes `color: #1e1a22;`. | The Turbo label, while Turbo is held, is ink instead of a brown-black. It still reads 11.51:1 on lamplight. |
| 6 | `#000000` | `#141820` (dusk) | 7.33 | style.css:42 becomes `text-shadow: 0 1px 1px var(--dusk);`. | The 1px HUD text shadow, already only 1.18:1 against the HUD, no longer shows. This is the one merge that removes a visible effect. It is intended, because the shadow adds nothing on a solid HUD. |

The nearest match for `#000000` across the whole palette is `#1a120c` (ΔE 6.25), and the nearest for `#1a120c` is `#000000`. Both of those are removed, so each one folds into its nearest colour that stays. Merges 1 and 2 also make the page, the screen and the letterbox one colour. The `#6d5a38` frame border still separates the screen from the page.

These colours were considered and kept:

- `#2d8a3c` and `#38994a` (ΔE 5.31) are the two grass stripes. The pattern needs both.
- `#8a3420`, `#8a4a2a` and `#8a5e48` (ΔE 7.33 to 7.56) belong to the club ramp, the ball and the skin ramp. Folding any of them would recolour every player.
- `#ffffff` into `#f6edd4` (ΔE 10.86) would save a slot by turning the yard lines cream. Hold this one in reserve for when the season clubs arrive (see below).

After the merges the 30 colours are `#141820`, `#1b2430`, `#1c4a58`, `#1e1a22`, `#243044`, `#2d6f80`, `#2d8a3c`, `#38994a`, `#3a2a30`, `#3e4658`, `#4a93a4`, `#4aa8ff`, `#5a6478`, `#5e3020`, `#6d5a38`, `#8a3420`, `#8a4a2a`, `#8a5e48`, `#8a7e64`, `#b89a5a`, `#c45a32`, `#c99a78`, `#d9c89a`, `#e07a48`, `#e7c4a8`, `#f2d080`, `#f6edd4`, `#ffb0a4`, `#ffdd33` and `#ffffff`. The canvas `PALETTE` array in view.js drops from 28 entries to 27, all unique, so the test at tests/lantern-bowl.html:219 (32 or fewer, no repeats) still passes.

I applied these six edits to a scratch copy of main and re-ran the script. It reported 30 colours, and `--max 30` exited 0. No test file names any of the six removed colours, and nothing in `launcher/`, `shared/` or `tests/` refers to them.

## The #495 roster view and the unlit star

PR #495 (LB-G7, the roster view) adds `games/lantern-bowl/roster-view.js`. As it stands on `05a9b560` it brings five new colours. With it, main would count 41. The art review asked for four swaps, and this spec adds one more swap and fixes the unlit star colour, so that the two changes land together at 30.

| In #495 now | Use in #495 | Change to | ΔE00 | Why |
|---|---|---|---|---|
| `#141d2a` | Even rows | `#141820` | 3.22 | Swap from the art review. |
| `#182230` | Row fill | `#1b2430` | 1.29 | Swap from the art review. |
| `#2b3a4f` | Row divider | `#243044` | 3.32 | Swap from the art review. |
| `#c9bf9f` | Dim text (`--lbrv-dim`) | `#d9c89a` | 4.80 | Swap from the art review. `#d9c89a` stays after merge 4, so there is no conflict. |
| `#101820` | Panel (`--lbrv-panel`) | `#141820` | 2.20 | **New in this spec.** Merge 2 removes `#101820`, so #495 must not bring it back. Without this swap the total is 31. |
| `#4a4a50` | Unlit star (`.lbrv-off`) | `#8a7e64` | not a merge | `#8a7e64` is already in the palette and nothing draws it yet. It reads 3.91:1 on the `#1b2430` rows and 4.44:1 on the `#141820` rows. `#4a4a50` read only 1.82:1 and 1.93:1. |

The four swaps from the review all land on colours that stay, so the review and this spec do not conflict. The one gap is `#101820`, the roster panel. The #495 review draft should add that swap. After the swaps, the even rows (`#141820`) are the same colour as the panel. The row dividers (`#243044`) and the lighter odd rows (`#1b2430`) still mark the rows.

I checked the order on scratch copies. Main with #495 as it stands counts 41. After the merges, #495 as it stands counts 36. With the four review swaps and the star, it counts 31. With the panel swap as well, it counts 30. The merge and #495 can land in either order, as long as the later one is rebased and the script still reports 30.

## Contrast after the merges

Ratios are WCAG 2 relative-luminance contrast. Translucent backgrounds are measured as their opaque base, because each one sits over a fill of the same or nearly the same colour (the HUD and the hint sit over the `#141820` field strip). The target is 4.5:1 for text and 3:1 for graphics a player has to read. This table lists every pairing in which either colour changes.

| Kind | Pairing | Foreground | Background | Before | After |
|---|---|---|---|---|---|
| Text | Body text on the page (style.css:7) | `#f6edd4` | `#10141c` → `#141820` | 15.79 | 15.22 |
| Text | Title and Home link on the page (style.css:15, 21) | `#f2d080` | `#10141c` → `#141820` | 12.39 | 11.94 |
| Text | Version label, 11px (style.css:65) | `#d9c89a` | `#10141c` → `#141820` | 11.13 | 10.73 |
| Text | Turbo while held (style.css:138) | `#1a120c` → `#1e1a22` | `#f2d080` | 12.42 | 11.51 |
| Graphic | Power meter frame on its well (view.js:563 on 561) | `#c9bc9a` → `#d9c89a` | `#1e1a22` | 9.09 | 10.34 |
| Graphic | Sprite trim against the ink outline | `#c9bc9a` → `#d9c89a` | `#1e1a22` | 9.09 | 10.34 |
| Graphic | Power meter frame on dark grass | `#c9bc9a` → `#d9c89a` | `#2d8a3c` | 2.32 | 2.63 |
| Graphic | Power meter frame on light grass | `#c9bc9a` → `#d9c89a` | `#38994a` | 1.91 | 2.18 |
| Graphic | Stick knob on dark grass (game.js:955) | `#c9bc9a` → `#d9c89a` | `#2d8a3c` | 2.32 | 2.63 |
| Graphic | Stick knob on light grass | `#c9bc9a` → `#d9c89a` | `#38994a` | 1.91 | 2.18 |
| Decorative | Screen frame border on the page (style.css:32 on 7) | `#6d5a38` | `#10141c` → `#141820` | 2.78 | 2.68 |
| Decorative | Screen frame border on the screen fill | `#6d5a38` | `#101820` → `#141820` | 2.70 | 2.68 |
| Decorative | Button fill on the page (style.css:12 on 7) | `#243044` | `#10141c` → `#141820` | 1.39 | 1.34 |
| Decorative | HUD text shadow (style.css:42) | `#000000` → `#141820` | `#141820` | 1.18 | 1.00 |
| Graphic (#495) | Unlit star on a row | `#4a4a50` → `#8a7e64` | `#182230` → `#1b2430` | 1.82 | 3.91 |
| Graphic (#495) | Unlit star on an even row | `#4a4a50` → `#8a7e64` | `#141d2a` → `#141820` | 1.93 | 4.44 |
| Text (#495) | Dim text on a row | `#c9bf9f` → `#d9c89a` | `#182230` → `#1b2430` | 8.73 | 9.45 |
| Text (#495) | Lamplight on a row | `#f2d080` | `#182230` → `#1b2430` | 10.77 | 10.52 |
| Text (#495) | Main text on a row | `#f6edd4` | `#182230` → `#1b2430` | 13.72 | 13.40 |

Every text pairing stays above 4.5:1, and the lowest is 9.45:1. Every graphic pairing that was 3:1 or above stays above it. The merges move no pairing from above 3:1 to below it.

Four pairings were already under 3:1 on main, and this spec does not fix them:

- **The power meter frame and the stick knob on grass** (2.32 and 1.91 before). Merge 4 raises them to 2.63 and 2.18. They still fall short of 3:1. The meter itself sits in an ink well at 10.34:1, and the knob sits inside a `#f6edd4` ring, so the player can still read both. They are a follow-up, not part of this merge.
- **The screen frame border and the button fill against the page.** These are decorative. The frame does not carry meaning, and every button has a text label and the `#6d5a38` border. They drop by 0.10 and 0.05.

## The season clubs: a warning about headroom

`season.json` names four more clubs: `#d6b34c`, `#8e86c4`, `#b47e9b` and `#75a46e`. They are not counted today because the game does not load the file. When the season ships, each club that gets a full three-shade ramp like the Lanterns and Millrace adds three colours. Four clubs would add up to 12, and the two slots of headroom will not cover that. The season task should plan its palette before it draws other clubs. It could give the other clubs one colour each with a shared shading rule, or spend the reserve merge of `#ffffff` into `#f6edd4`. It should not add raw hex values one club at a time.

## What the review will check

The palette PR is reviewed on its head commit. It passes when every item below holds.

1. **The count.** Running `python3 tools/palette-inventory.py --max 30` on the head exits 0 and reports 30 colours or fewer. The full report should match the post-merge list above. If #495 has landed by then, the count includes `roster-view.js` and must still be 30 or fewer.
2. **No new hex values.** Every base colour in the head's inventory is already in the main inventory above. `rgba(20, 24, 32, …)` at style.css:121 is the dusk base with alpha, so it is not new. The PR adds no named colours and does not edit any `shared/` file.
3. **Only the intended edits.** The diff touches only the lines in the merge table (style.css:7, 32, 42, 121 and 138, view.js:314, 315 and 563, and game.js:955) and the 12 sprite PNGs. In each PNG, exactly the `#c9bc9a` pixels change, to `#d9c89a`, 123 pixels in total. No other pixel or alpha changes, and the `_mask.png` files do not change.
4. **The contrast table.** The PR includes the before-and-after table above, recomputed on its own head. Text stays at 4.5:1 or above, and no graphic pairing falls from 3:1 or above to below it.
5. **Screenshots.** The PR includes before-and-after captures from the same build at 844×390 and 1920×1080, at the same device pixel ratio, of four screens:
   - the title panel;
   - a match at the snap, with a pass aimed so the power meter and the touch stick show;
   - the roster (the #495 view, or its preview page if #495 has not landed yet);
   - the Final results panel.

   A pixel diff of each pair may show only the intended merges: the page and screen fill, the trim and meter frame and knob, the Turbo label, and the HUD shadow. Nothing may move, resize or reflow.
6. **CI.** `checks` and `pack-matches-source` are green on the head. The Lantern Bowl page (`tests/lantern-bowl.html`) passes in full, including the 32-colour `PALETTE` check and the ink-outline check.
