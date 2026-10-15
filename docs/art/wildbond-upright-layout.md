# Wildbond upright phone layout (Game Boy shape)

Game Art Director, 2026-10-14. This is the launch layout for an upright phone. It replaces the "turn your phone sideways" gate.

## Rules
House rules from docs/art/README.md apply. 384x216 viewport, 16px tiles, whole-number scale, nearest filtering. 1px ink #1e1a22 outlines, light from upper left. Wildbond palette only (wildbond-godot/tools/paint_tiles.gd).

## Scaling
All layout numbers are CSS px. Draw the game at the largest whole k where 384*k <= available width and 216*k <= view height. Canvas backing store = 384*k*devicePixelRatio, pixelated. If k would be 0 (screen narrower than 384), never scale fractionally: show fewer columns, logical width = largest multiple of 16 that fits at k=1, height 216, player centred, nothing essential only in outer columns.

## Worked numbers
390x844 (DPR3): safe area top 47 bottom 34 (read real env(safe-area-inset-*), don't hard-code). k=1, view 384x216 = 1152x648 device px. 3px ink side margins. 4px ink border above, view y=51..267. Below: 543px (y=267..810) for strip + deck.
360x780 (DPR3): safe top 24 bottom 16. Logical view 352x216 at k=1 (22 tiles). 4px side margins, view y=28..244. Below: 520px (y=244..764).
Don't stretch the view. Use k=2 if width >= 768.

## Control deck
Colours: deck #e6dcc6, top highlight line #f4eddc, bottom shadow line #cfc4ac, outlines #1e1a22. D-pad face #435a78, lit bevel #7290ad, shadow bevel #33465e, pressed arm #33465e no bevel. A face #ab463a light #c45e4e shadow #8e342c. B face #8e342c light #ab463a shadow #6e2620. Menu pill #8a6444 light #a8875a shadow #6a4a32. Labels #f4eddc on buttons, #1e1a22 on deck. Focus/pressed ring #f2d080 2px. Pressed: face down 2px, swap bevels. No gradients/blur/anti-aliasing; stepped pixel circles/pills.
Sizes (390; 360 in brackets): D-pad plus 132x132 (124x124), left edge 20 (16), vertically centred in deck; arms 44x44, centre inert; tap target per direction = whole 66x66 quadrant wedge (diagonals to nearer arm). A: 64 (60) circle, right edge 20 (16), centre 24px above d-pad centre, label 'A' below. B: 64 (60) circle, 16px gap left of A, 24px lower, label 'B'. Menu pill 96x44 (88x44), centred, 24px above bottom inset; on 360 if gap <8px move it centred between d-pad and B at d-pad bottom line. All controls >=8px apart.
Behaviour: holding a d-pad arm keeps walking until release (down starts; up/cancel/leave stops). Tap <100ms moves exactly one tile. No page scroll/zoom on deck. Respond on press-down, not click, so taps are never dropped. A = confirm/talk/advance. B = back/cancel/speed up dialogue. Menu = the #413 Party/Field book/Save/Close menu (must open in Larkhaven too).

## Dialogue/hint strip
Directly under the view, full width minus 8px margins, never over view or deck. 390: 112px tall (y=271..383). 360: 104px (y=248..352). Background #f4eddc, 1px #1e1a22 outline, 2px inner border #cfc4ac. Text #1e1a22 >=16px, line-height 1.3, 12px padding (4 lines on 390, 3 on 360). Long text paginates, never clipped or shrunk; blinking down-arrow #8e342c bottom-right when more. Tapping anywhere in the box advances it (same as A). With no dialogue it shows the current hint in #4a3426. Sideways layout: stop clipping the bottom hint and stop drawing it over the d-pad; give it its own band above the deck.

## Battle
Upright: scene stays in the view; command buttons move to strip + top of deck as a 3x2 grid: Fight, Guard, Orders / Bond, Bag, Run. Each >=112x48 (104x48 on 360), 8px gaps, text >=16px. Available: #e6dcc6, ink outline, ink text. Selected: #1e1a22, #f4eddc text, 2px #f2d080 ring. Disabled: #cfc4ac, #8a6444 text.
Turn-order chips: own row above buttons, wrap to second line; each >=28px tall, 6px gaps, 8px side padding, text >=14px; overflow beyond two lines shows a final '+N' chip. Colours unchanged (ally #435a78, foe #8e342c, #f4eddc text, ink outline). Same wrap rules sideways.

## Starter card
Upright: covers view + strip with 12px side margins; deck stays live. Portrait at 2x centred, 16px above/below; name 20px, type line, description <=3 lines at 16px; two buttons side by side, each >=140x48 (132x48 on 360), 16px gap, 16px bottom padding. 'Choose' is the default highlight (selected style + ring). A picks highlighted; B = Not yet. Tapping Choose must not also walk (keep current fix).

## How to play
On touch devices, the card and every hint say touch and name the drawn controls, e.g. 'Use the d-pad to walk. Tap A or the dialogue box to talk and go on. Tap Menu for your party and to save.' Never 'Keyboard' on touch. Keyboard devices keep current wording; with both, follow last input used.

## Safe areas
viewport-fit=cover; pad root with safe-area insets. Nothing tappable or text inside an inset. Top inset painted #1e1a22, bottom #e6dcc6. Sideways, left/right insets apply and controls move inward. On address-bar show/hide, recompute with visualViewport, keep same whole scale.

## Rotation
Remove the 'Turn your phone sideways' gate. Upright uses this layout, sideways the existing wide layout with the fixes above. Rotating switches live without losing game state or open dialogue.

## Acceptance checklist (390x844 and 360x780 upright, 844x390 sideways, screenshots next to current ones)
1. Rotate screen never appears.
2. View exactly 384x216 at 390 and 352x216 at 360; each game pixel an exact 3x3 device-pixel block, no blended edges.
3. View, strip and deck bounding boxes share no pixels.
4. Every tap target (d-pad directions, A, B, Menu, battle buttons, Choose, Not yet, dialogue box) >=44x44, targets >=8px apart.
5. Every sampled colour is from this spec; outlines #1e1a22.
6. 20 single taps each on A, d-pad right, Choose, Sign the register, bag, Fight give 20/20 on a real phone.
7. Holding d-pad right 2s walks continuously and stops within one tile of release.
8. Tapping inside the dialogue box advances it 10/10.
9. Longest dialogue line and hint fully visible, no text <16px (chips 14px).
10. Trainer battle with 4+ chips: every chip inside screen, right edge <= width-8px.
11. Starter card opens with Choose highlighted; A immediately picks.
12. On touch, How to play contains 'touch' or 'tap' and not 'Keyboard'.
13. On 390x844 with notch, nothing in top 47px or bottom 34px.
14. Menu opens Party/Field book/Save/Close in Larkhaven and Thornwood.
15. Rotating mid-dialogue keeps the same page open, state unchanged.
16. Text contrast >=4.5:1 for every pair (#1e1a22 on #f4eddc and #e6dcc6, #f4eddc on #435a78 and #8e342c, #8a6444 on #cfc4ac; darken to #6a4a32 if it fails).

## Godot notes
The game is Godot. CSS pixels are the window pixels of the web export. viewport-fit=cover and safe-area insets live in play/wildbond/index.html. The upright deck is a Control. A finger is an InputEventScreenTouch (and a real mouse press, for a desktop window of the same shape). Presses count on the way down. The disabled battle line uses #6a4a32 because #8a6444 on #cfc4ac is below 4.5:1. The focus ring #f2d080 is the house lamplight colour.
