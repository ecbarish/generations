# Little Ranch world spec

This file is the LR-WORLD-1 direction spec, committed with the strip and camera so a later review can cite it. The status line in the spec still stands: it is direction for the Dev Lead and the art pass, not an approval of any pull request. The measured inventory tables are repeated as an appendix.

## Departures this build had to make

Existing Little Ranch checks would not pass if section 3.3 were followed exactly. The review of pull request 618 measured these at `44e1bc5a` and listed them under "Where the spec values cannot be used as written." The game uses the spots below. Section 3.3 is left as written so the original targets stay visible.

- **Meadow baby.** Section 3.3 puts the baby at 0.5, beside the bush at 0.62. That fails the LR-C1 head-tap check: a tap on the head must hit the baby, not the bush. The baby has to sit at about 0.414 or less on wide screens and 0.435 or less on the iPad. This build uses 0.40 on wide screens and 0.42 on tall screens.
- **Meadow bowl.** Section 3.3 puts the bowl at 0.12. On wide screens that leaves no room for LR4's bowl trot, and the bowl also has to stay out of the Garden view. This build puts the bowl at 0.02 on wide screens and 0.12 on tall screens, and clamps its left edge with `max(stopFor(0) + W + R + 1, stop + R + 2)`.
- **Meadow sponge.** The sponge is capped at `stopFor(2) − 0.8R − 3` so its art does not show in the Toy Yard view. Its target stays 0.88.
- **Meadow friend.** Section 3.3 says 0.72. This build uses 0.78. That change was not tested at 0.72 in the final review run, so 0.78 is the measured spot.
- **Toy Yard basket, Pebblit and the ball.** Section 3.3 puts the basket at 0.3 beside ball rests at about 0.35 and 0.75, and it gives the Toy Yard no friend spot. Those three cannot fit on phones. At the reviewed head the basket and Pebblit both sat at 0.42, the pup stood on them, and the ball was pushed to about 0.16. This build puts the basket at 0.86 on wide screens and 0.87 on tall screens, on the front row. On a wide screen its y is 0.885 of the screen height, so the ball at 0.75 does not overlap the basket. On a tall screen its y stays at 0.7 of the screen height, unless that would put the handle in the arrow lane. Then it drops to `H * .56 - U * .08 + U * .175 + L.R * .9 * .95 + 2`. On the iPad that keeps the handle below the lane. Pebblit is at 0.13 on wide screens and 0.2 on tall screens. On the iPad that friend is lowered so its head stays out of the arrow lane. The pup starts at 0.55. On a wide screen it slides clear of the picture signs. In the Toy Yard, and in every place when the screen is at most 1.7 times as wide as it is tall, it drops below the boards when a sideways step would show in the next place. That drop put the pup on the ball, so the two ball rests move to the outer rims of the yard when the pup fits between them. When the pup and Pebblit cannot both stand clear of those rims, both rests sit on the right and the two of them keep the left. The height is unchanged: above the flowers on a wide screen, on the front row on a tall one, and still y=123 at 844×390. The basket drops until its body misses both ball taps. On a wide Meadow the bowl sinks until its tap is below the pup's feet, and the bush steps right and up until the pup is clear of it. On a short wide Meadow that still leaves Pebblit on the bush, the bush rises to the top of the screen. On a tall Meadow where the bush tap covers the whole standing row, the bush lifts above that row and clear of the sun, and the pup steps aside so Pebblit misses the sponge. A garden puddle that the pup would cover steps aside. Pebblit uses the same clearance.
- **Section 8 C and the basket.** The check uses the drawn rim and the handle. The rim is 0.88 of the basket radius, and the handle top is `y - 0.9r - max(1, 0.05r)`. The handle stays below the arrow lane. At `8a9fd99c` the tall basket is still `y = 0.7H`. On the iPad that same box sits in the right lane, and the check fails there: `820x1180 C: arrow lane, arrow disc and the end caps`.
- **How A and C are checked.** Section 8 A watches centres as well as drawn bounds, and its leak rule watches whether another area's centre is on screen. The checks in this build use the drawn art. An element fails when it is cut off at a viewport edge, when its art shows in a neighbouring area's view, or when any of it sits in an arrow lane. The cloud may sit about a tenth of an art pixel past an edge. That is the only past-edge that is allowed.
- **J, light and dusk.** Shadows stay deferred to LR-WORLD-2. Daytime shadows still fall to the left, with the offset at −0.25 of the object's width.
- **Left arrow.** The disc's left edge stays at least 16 CSS px in at every review size. Both `arrowCenter` and `discRim` take `if (side < 0) pad = Math.max(pad, 16 / S + r)`.
- **Garden cloud.** The cloud steps to the right of the place dots, leaving about 4 px between the drawn cloud and those dots.
- **K, palette.** Seven near-duplicates are folded into colours the ranch already used, and the count is 194, under the 195 cap. CI runs `tools/palette-inventory.py --game little-ranch --max 195` and fails when the count is higher. That check was not in the suite before this: section 8 K names the cap, and the tool can enforce it, but the browser check called K only tested that the Toy Yard pup, Pebblit and the basket stand clear of each other. The separate house rules (32 colours, a `#1e1a22` outline, and `#f2d080` lamplight) already failed before this work. They are not part of LR-WORLD-1.
- **K, toy taps.** The same K now also requires the pup's body to miss every toy tap circle in all four areas at all five sizes. The toys are the cloud, the puddles, the bowl, the sponge, the bush, the flowers, the sun and both ball rests. Sign boards stay on their own check. At `44fe2cf6`, before this placement, that check fails on the first size: `1280x800 K: the pup stands clear of every toy tap in every area — garden puddle0, meadow bush, toy yard ball, toy yard ball`.
- **Overlaps the review accepted.** At 844 the bowl used to sit in front of the pup's feet, and at 1280 the bush covered part of the baby. On the iPad, Pebblit's feet used to touch the sponge. Those are cleared now: the pup, Pebblit and the basket miss every toy tap, and the pup and Pebblit miss the sign boards.

The layout mockup named at the end of the spec (`layout.png`) was not in the text copy, so it is not in this file.

---


# Little Ranch: explorable world, art and layout direction spec

Status: direction spec for the Dev Lead and the art pass. It is not an approval of any PR.
Baselines read: main at b17ae6be (after #614 and #615), and the #613 head at 5d468f60 ("run each picture-sign post down behind the fence").
Measurements come from a headless probe of both builds at the five review sizes, with the friend forced on. All sizes are in art pixels unless they say CSS px.

Evan's request (Oct 22, 7:09 PM ET): "Can we just make the world more polished and maybe make things in different places so we don't cram it all into one screen maybe we can look around." Earlier he asked, "Why are signs floating in space."

## 0. Summary

The ranch becomes one strip, 6.2U wide and one screen tall, with four named areas and a scenic cap at each end. From left to right the areas are the Kitchen Garden, the Meadow (home), the Toy Yard and the Barn Yard. The camera always rests on exactly one area, so a toddler sees one small place at a time with no more than four toys in it, besides the baby, the friend and the sun. Big round wooden arrow buttons at the left and right screen edges glide the camera one area per tap. The pup trots along and Pebblit follows. There is no swipe in v1. Every doorway becomes a building or a sign whose post stands on one shared back ground line behind the fence. The sun and cloud live only in a sky band, and one dusk dim covers the whole world. The work ships as three larger PRs: the strip and camera, then sky, ground and parallax, then the area buildings. The palette cut to 32 colours is a separate, later pass. #613 should land for its in-room work. Its ranch sign and cloud placement is interim, because LR-WORLD-1 deletes the pack sign and the joint sign and cloud search.

## 1. Why the current screen is crowded (measured)

The ranch has about 20 resting tap targets on one screen: the baby, the friend, the bowl, the sponge, the bush, the ball, the hat basket, five flowers, the sun, the cloud and six doorway signs. Two puddles and a bedtime item can appear on top of these.

`layout()` and `packSignSpot()` (about 170 lines of joint search) exist only to fit all of that into one viewport. The measured results show the strain.

- At 1280x800, on both main and the #613 head, the Paint Shed sign's board overlaps the Dough Table sign's board by 7.1 × 40.1 art px. The Snack Kitchen board overlaps the Dough Table board by 7.0 × 5.3.
- At 1280x800 on the #613 head, the pack sign hangs at the top left at scale 0.8. Its board's right edge is at x 55.4 and the sun disc's left edge is at x 49.7, so the board covers part of the sun. The balloon also sits on the sun's glow.
- On the tall layouts (the iPad and both phones), the signs stack in three rows. The Dough Table and Busy Barn Door boards start 82 art px (iPad) or about 110 art px (phones) from the top of the canvas. Their bottoms sit more than 0.25U above the ground line, so their posts become long stilts. This is the "floating" look Evan asked about.
- The Little Wagon and Snack Kitchen boards top out at y 21.5 on desktop, which is in the sky beside the sun and cloud.

## 2. Inventory (#613 head 5d468f60; main where it differs)

### 2.1 What each element does

| Element | What it does today | Where it goes (section 3) |
|---|---|---|
| Baby (Cindercub) | Rests at home (W/2, 0.76H). Tap it to hear a giggle. It walks to whatever you tap. | Follows the camera. Each area has a baby spot. |
| Friend (Pebblit) | Visits on about half of visits, wanders in, and joins in actions. | Follows the baby about 0.4 s behind. Each area has a friend spot. |
| Bowl | Tap to feed. | Meadow |
| Sponge | Drag to scrub, with bubbles. | Meadow |
| Bush | Peekaboo. | Meadow |
| Big red ball | Kick. It rolls between two spots beside the baby. | Toy Yard |
| Five singing flowers | Tap or run a finger along the front row to sing. | Meadow |
| Hat basket (6 hats) | Tap to put a hat on the baby. | Toy Yard, as the dress-up chest |
| Cloud | Tap for rain, then 2 puddles to splash in, then a rainbow. | Kitchen Garden sky (it waters the garden) |
| Sun | Five taps make a rainbow. | Fixed to the screen, upper-left sky |
| Moon (night) | Three taps play Twinkle. | Fixed to the screen, upper-left sky, taking the sun's slot |
| Bedtime items | A toothbrush and a cup in a bubble during the routine. | Meadow (the camera goes home for bedtime) |
| Hills, 2-rail fence, grass flecks | Scenery. | Continuous across the whole strip (section 4) |
| Paint Shed sign (sign) | Opens the Paint Shed room. | Barn Yard: the paint shed building |
| Little Wagon sign (wsign) | Opens the Wagon room. | Barn Yard: the wagon at the lane gate |
| Snack Kitchen sign (ksign) | Opens the Kitchen room. | Kitchen Garden: a garden hutch |
| Dough Table sign (tsign) | Opens the Dough room. | Kitchen Garden: a picnic table under an awning |
| Busy Barn Door sign (dsign) | Opens the Barn Door room. | Barn Yard: the barn's big door |
| Toy Pack sign (psign) on a balloon | Opens the two-card pack screen, which leads to the Block Tower and the Band. | Removed. The Toy Yard gets a stage doorway (Band) and a block-shelf doorway (Tower), and the pack screen goes. |
| Lock | A 48×48 CSS px parent lock at the top right, 10 px in. | Unchanged, as a HUD element |
| Rooms (Shed, Wagon, Kitchen, Door, Dough, Tower, Band) | Separate places, each with a barn "home" button at its top left. The Tower room has the shelf and tray. The Band room has the stage, the music stand with the stick, and bunting. | Unchanged inside. "Home" returns to the area whose doorway you used. |

### 2.2 Sizes at the five review sizes (#613 head; ranch sizes are identical on main)

Values are rounded to 0.1 art px. "Tap r" is the current tap radius that LR-WORLD-1 must not shrink.

| Element | 1280x800 | 844x390 | 820x1180@2 | 390x844@2 | 375x812 |
|---|---|---|---|---|---|
| Canvas in art px (W×H), CSS px per art px | 320×200, ×4 | 422×195, ×2 | 410×590, ×2 | 195×422, ×2 | 188×406, ×2 |
| U / R / ground line y | 230 / 32.2 / 112 | 224.2 / 31.4 / 109.2 | 410 / 57.4 / 330.4 | 195 / 27.3 / 236.3 | 188 / 26.3 / 227.4 |
| Baby (drawn size) | 39.1 (tap r 46.9 = 188 CSS px) | 38.1 (tap r 45.7 = 91 CSS px) | 69.7 (tap r 83.6 = 167 CSS px) | 33.2 (tap r 39.8 = 80 CSS px) | 32 (tap r 38.4 = 77 CSS px) |
| Friend Pebblit (size) | 37.1 | 36.2 | 66.2 | 31.5 | 30.4 |
| Bowl (width) | 64.4 (tap r 38.6 = 154 CSS px) | 62.8 (tap r 37.7 = 75 CSS px) | 114.8 (tap r 68.9 = 138 CSS px) | 54.6 (tap r 32.8 = 66 CSS px) | 52.6 (tap r 31.6 = 63 CSS px) |
| Sponge (w×h) | 51.5×28.3 (tap r 35.4 = 142 CSS px) | 50.2×27.6 (tap r 34.5 = 69 CSS px) | 91.8×50.5 (tap r 63.1 = 126 CSS px) | 43.7×24 (tap r 30 = 60 CSS px) | 42.1×23.2 (tap r 29 = 58 CSS px) |
| Bush (width) | 92.6 (tap r 45.1 = 180 CSS px) | 90.3 (tap r 44 = 88 CSS px) | 165 (tap r 80.4 = 161 CSS px) | 78.5 (tap r 38.2 = 76 CSS px) | 75.7 (tap r 36.8 = 74 CSS px) |
| Hat basket (radius) | 19.3 (tap r 33.8 = 135 CSS px) | 18.8 (tap r 33 = 66 CSS px) | 51.7 (tap r 60.3 = 121 CSS px) | 24.6 (tap r 28.7 = 57 CSS px) | 23.7 (tap r 27.6 = 55 CSS px) |
| Ball (radius) | 28.3 | 27.6 | 50.5 | 24 | 23.2 |
| Flower (radius, ×5) | 15 | 22 | 41 | 19.5 | 18.8 |
| Puddle (radius, ×2) | 21 / 27.6 | 26.9 / 23.7 | 49.2 / 49.2 | 23.4 / 23.4 | 22.6 / 22.6 |
| Sun (disc radius) | 20.7 (tap r 36.8 = 147 CSS px) | 20.2 (tap r 35.9 = 72 CSS px) | 36.9 (tap r 65.6 = 131 CSS px) | 17.6 (tap r 31.2 = 62 CSS px) | 16.9 (tap r 30.1 = 60 CSS px) |
| Cloud (radius / width) | 22 / 57.2 (tap r 29.7 = 119 CSS px) | 21.4 / 55.8 (tap r 29 = 58 CSS px) | 41 / 106.6 (tap r 55.4 = 111 CSS px) | 19.5 / 50.7 (tap r 26.3 = 53 CSS px) | 18.8 / 48.9 (tap r 25.4 = 51 CSS px) |
| Moon (radius) | 16.1 | 15.7 | 28.7 | 13.7 | 13.2 |
| Bedtime item (radius) | 35.4 | 34.5 | 68.9 | 32.8 | 31.6 |
| Doorway sign board (w×h) | 58.1×44 (tap r 40.2 = 161 CSS px) | 56.7×42.9 (tap r 39.2 = 78 CSS px) | 103.6×78.5 (tap r 71.8 = 144 CSS px) | 49.3×37.3 (tap r 34.1 = 68 CSS px) | 47.5×36 (tap r 32.9 = 66 CSS px) |
| Tower block (side) | 26 | 25.4 | 61.5 | 29.3 | 28.2 |
| Band baby (size) | 32 | 31.2 | 57.4 | 27.3 | 26.3 |
| Room barn button (radius) | 19 | 18.5 | 42.1 | 20 | 19.3 |

| Sign | 1280x800 | 844x390 | 820x1180@2 | 390x844@2 | 375x812 |
|---|---|---|---|---|---|
| sign | (41.9, 100) ×1, top 64.2 | (46.4, 97.5) ×1, top 62.6 | (74.6, 295) ×1, top 231.2 | (35.5, 211) ×1, top 180.7 | (34.2, 203) ×1, top 173.7 |
| wsign | (278.1, 57.3) ×1, top 21.5 | (371.4, 55.8) ×1, top 20.9 | (335.4, 295) ×1, top 231.2 | (159.5, 211) ×1, top 180.7 | (153.8, 203) ×1, top 173.7 |
| ksign | (144, 57.3) ×1, top 21.5 | (189.9, 55.8) ×1, top 20.9 | (205, 220.4) ×1, top 156.6 | (97.5, 175.5) ×1, top 145.2 | (94, 168.8) ×1, top 139.5 |
| tsign | (92.9, 96) ×1, top 60.2 | (118.2, 93.6) ×1, top 58.7 | (74.6, 145.8) ×1, top 82 | (35.5, 140) ×1, top 109.7 | (34.2, 134.6) ×1, top 105.3 |
| dsign | (284.6, 144) ×1, top 108.2 | (387.5, 140.4) ×1, top 105.5 | (335.4, 145.8) ×1, top 82 | (159.5, 140) ×1, top 109.7 | (153.8, 134.6) ×1, top 105.3 |
| psign | (32.1, 32.4) ×0.8, top 3.7; main (219.4, 63.7) | (266.9, 38.8) ×1, top 3.9; main (281.9, 62.8) | (164.4, 58.6) ×0.8, top 4.4; main (200.2, 65.4) | (60.2, 34.1) ×1, top 3.8; main (114.2, 73.1) | (56.5, 33) ×1, top 3.8; main (110.5, 72) |

- 1280x800: sun (70.4, 34); cloud (204.8, 18.4) at the #613 head, (204.8, 18.4) on main.
- 844x390: sun (92.8, 33.2); cloud (37.5, 17.9) at the #613 head, (270.1, 17.9) on main.
- 820x1180@2: sun (90.2, 100.3); cloud (262.4, 47.2) at the #613 head, (262.4, 47.2) on main.
- 390x844@2: sun (42.9, 71.7); cloud (124.8, 33.8) at the #613 head, (124.8, 33.8) on main.
- 375x812: sun (41.4, 69); cloud (120.3, 32.5) at the #613 head, (120.3, 32.5) on main.


## 3. The world strip

### 3.1 Geometry (all in U, so it scales the way the ranch already does)

- The world is one screen tall and 6.2U wide. There is no vertical camera.
- There are four areas at a pitch of 1.4U. Each area has a 1.0U **core** where all of its tap targets live, inset at least 0.1U from the core edges. Between cores there is a 0.4U gutter of scenery, such as fence, grass and a tree.
- There is a 0.3U scenic cap at each end: a pond on the left and a lane gate on the right. Neither is interactive in v1.
- Area i (0 to 3) is centred at x = 1.0U + 1.4U × i. Its core spans 0.5U to either side of that centre.
- The camera stop for area i is camX = round(clamp(centre − W/2, 0, 6.2U − W)). This never clamps for views up to 2.0U wide, which covers every review size.
- **The one-area rule:** at every snapped stop, at every size, all of that area's tap targets are fully in view and no other area's tap target is in view. The widest view is 1.88U at 844x390. There, 0.04U of each neighbour's core shows, which is inside the 0.1U inset. Neighbouring roofs and fence may peek in. That is welcome, because it tells the child there is more to see.
- The camera x and every parallax offset are whole art pixels on every frame, so the pixel art never shimmers.
- `artScale` from #611 is untouched: S = max(2, round(cssMin/190)), capped at 2 CSS px per art pixel when DPR > 1. The world is drawn into the same art canvas with a translate of −camX.

### 3.2 Vertical bands (the same in every area)

These use G, the existing ground line at 0.56H.

| Band | Rule | Desktop | 390 phone |
|---|---|---|---|
| Sky band | y < G − 0.28U. Only the sun, moon, stars, cloud, rain start, rainbows and the far sky go here. | y < 47.6 | y < 181.7 |
| Building and sign band | From G − 0.28U to the back line. Doorway buildings and signs stand here, and nothing is taller than 0.28U above G. | 47.6 to 141.9 | 181.7 to 261.7 |
| Back ground line (fence foot) | yb = G + 0.13U. Every post foot and building sill sits on it within 1 art px. | 141.9 | 261.7 |
| Fence | Rails at G + 0.02U and G + 0.09U, continuous across the strip, with a gate gap in front of each doorway building. | | |
| Play floor | G + 0.2U and below. The baby, friend and toys use it. Existing y formulas (such as bowl 0.84H and home 0.76H) are kept. | | |

### 3.3 Areas and placements

Placements are target x positions inside the 1U core (0 is the core's left edge). The y positions keep today's formulas unless stated. Each area holds at most 4 toys or doorways besides the baby, the friend and the sun.

| Area (index) | Contents and core x | Notes |
|---|---|---|
| **Kitchen Garden** (0) | Snack Kitchen hutch at 0.22U. Dough Table picnic table under an awning at 0.6U. Cloud in the sky band over about 0.62U, keeping its current radius. Two puddles on the play floor at 0.3U and 0.72U. Baby spot 0.45U, friend spot 0.7U. | The rain "waters the garden". There is no left arrow here (first area), so the left edge is free. |
| **Meadow** (1, home and start) | Bowl 0.12U, bush 0.62U (its art must stay inside 0.8U), sponge 0.88U on the play floor, five flowers on the front row from 0.15U to 0.85U, baby home 0.5U, friend 0.72U. Bedtime items appear here. | Every visit starts here, and bedtime returns here. |
| **Toy Yard** (2) | Wooden stage at 0.3U, about 0.5U wide, as the Band doorway. Block shelf corner at 0.68U as the Tower doorway. Hat chest (the basket) on the play floor at 0.3U. Ball rolls between two spots at about 0.35U and 0.75U on the play floor. Baby spot 0.55U. | Replaces the pack sign, its balloon and the pack card screen. |
| **Barn Yard** (3) | Barn at 0.3U, about 0.42U wide with the roof peak under the sky band; its big door carries the Busy Barn Door plaque. Paint Shed at 0.72U, 0.26U wide, with paint drips. Wagon parked on the play floor at 0.85U, heading out the lane gate. Baby spot 0.45U. | There is no right arrow here (last area), so the wagon can sit near the right edge. |
| Pond cap (left) and lane gate cap (right) | Scenery only. | |

Doorway rules:
- Every doorway keeps its existing picture plaque (no words), mounted on its building wall or on a grounded post.
- Each doorway's tap target is at least today's board, 0.253U × 0.19U with tap radius 0.175U (see 2.2).
- Taps on the drawn building art anywhere count as that doorway.
- Returning from a room drops you back into the area you left.

## 4. Navigation

### 4.1 Options weighed

| Option | For | Against |
|---|---|---|
| Free swipe or drag pan | Feels natural to adults, and allows looking around continuously. | It conflicts with the sponge drag and the finger-run along the flowers. Toddlers drag and palm the screen by accident, so they would get lost mid-play. It needs a threshold, a direction lock and snapping, and it still misfires. |
| Edge arrows (recommended) | One tap means one move, with nothing to learn. Big targets. Fits the existing tap-on-release model. Cannot fire by accident during a drag. | It takes up edge space. The lane rule below handles that. |
| Destination signs ("go to the Barn") | They name where you go. | A picture of a place you can't see is abstract for a 2-year-old. They would look like doorway signs, which mean "go inside", and they add more signs to a screen we are trying to calm down. |

### 4.2 Recommendation: big edge arrows, no swipe in v1

- **Look:** a round wooden button with the same wood, outline and shine as the room barn button. It shows a fat arrow and a tiny picture of the next area: a carrot for the Garden, a flower for the Meadow, a block for the Toy Yard and a barn for the Barn Yard. The arrows are HUD elements fixed to the screen, not world signs, so they never look as if they float over the ground.
- **Placement:** centred at (0.1U, G − 0.08U) and (W − 0.1U, G − 0.08U). The visible radius is 0.09U and the tap radius is at least 0.175U, which equals the current sign tap radius: 161 CSS px on desktop, 78 at 844x390, 144 on the iPad, 68 on the 390 phone and 66 on the 375 phone. The arrows act on release, like signs.
- **Arrow lane:** on screen, x within 0.2U of an edge and y within 0.175U of the arrow centre. No other tap target's centre or drawn art may sit in the lane at any snapped stop, at any size. Nearest-wins (`ranchTarget`) must give the arrow every tap on its visible disc.
- **Ends:** there is no left arrow in the Garden and no right arrow in the Barn Yard.
- **Glide:** one area per tap, over 0.65 s with ease-in-out. During the glide the arrows and all other taps are inert, and there is no queueing.
- **Snapping:** the camera only rests at the four stops. On resize or rotate, it keeps the area index and recomputes the stop with no animation.
- **The pup follows:** when an arrow is tapped, the baby drops its current action. Eating stops, bubbles pop, a hiding baby pops out and a sponge drag is cancelled. The baby trots after the camera and reaches the new area's baby spot no later than 0.6 s after the camera settles. Pebblit follows about 0.4 s behind and goes to the friend spot. The baby is never left off screen.
- **Reduced motion** (`prefers-reduced-motion`): the move is an instant cut in one frame, the parallax layers stay still, and the baby and friend are placed at their spots instantly.
- **Bedtime:** when the routine starts, the camera glides home to the Meadow (or cuts, under reduced motion) and the arrows hide. They stay hidden through the routine and sleep, and come back when the baby wakes.
- **Never-stuck hint:** if everything in the current area has been tried, the existing hint glow goes to the arrow that points toward the nearest area with something untried.
- **Swipe later:** a swipe could be playtested in a later PR as an addition, never as a replacement. It would need at least 0.35U of horizontal travel, a horizontal-to-vertical ratio of at least 3:1, and must not start on a tap target.

## 5. Polish rules

1. **Continuous ground and horizon:** one ground line G, one back line yb and one fence run the full 6.2U with no seams at area edges. The fence breaks only at gates in front of doorway buildings, with a gate post on each side. Grass flecks use a world-x seeded pattern, so they don't repeat per screen.
2. **Parallax:** from back to front:
   - L0 is the sky gradient, fixed to the screen.
   - L1 is the sun, moon, stars and the sun's rainbow, fixed to the screen (factor 0).
   - L2 is the far hills at factor 0.3.
   - L3 is the near hills at factor 0.6.
   - L4 is the world at factor 1.0: ground, fence, buildings, props, characters, and the cloud and its rain.

   The hills are generated across the world width times their factor, plus one view, so their ends never show. The Wagon room already has a drifting-hills pattern (game.js, around line 1080) that can be reused.
3. **Light from the upper left:** shines and highlights go on the upper left, and shadows fall to the lower right. Today `shadow()` uses `off = lerp(-1, 1.6, dusk) × w × .25`, which puts daytime shadows to the left, toward the sun. Change the daytime end to a small positive offset, such as lerp(0.4, 1.6, dusk). The moon moves to the sun's upper-left slot so night light comes from the same side, and the top right stays clear for the lock.
4. **Sky band only:** the sun and cloud, including the cloud's full face, stay inside y < G − 0.28U at rest. The sun is screen-fixed at today's (0.22W, 0.17H) and the cloud is world-locked over the Garden. At rest in the Garden, the cloud's disc does not overlap the sun's disc or glow at any size. While the camera glides, the cloud may pass in front of the sun, and it is drawn after the sun.
5. **One post and sign kit:**
   - A board is 1.8R × 1.37R, with a #5a3a24 outline and the plaque art unchanged.
   - There is exactly one centred post, max(2, 0.16R) wide, running from the board to yb.
   - The board bottom sits between G − 0.09U and G − 0.02U, so no stilts. The visible post between the board and the top rail is at most 0.15U.
   - Buildings use the same wood colours and outline, and their sill is on yb.
   - No sign hangs from anything.
6. **Global dusk dim:**
   - One dusk value drives every layer. All world colours come from fixed three-step day, sunset and night ramps through `pick3`, following the fixed drawBlock colours in #613.
   - The single full-canvas rgba(20,20,60, 0.25 × dusk) overlay is drawn after the world and before the HUD.
   - No element keeps its own night colour logic, and no area stays undimmed.
   - Rooms keep their own interior lighting.
7. **Palette:**
   - main and the #613 head measure 195 colours with `tools/palette-inventory.py --game little-ranch`.
   - No world PR may raise the count above the main baseline at merge time, and 195 is the ceiling. New buildings, the pond, the gate and the hill layers are built from existing colours: woods #5a3a24, #8a5a34, #a87a4a and #c8955a; reds #c8453a, #8a2a24 and #e8483c; greens #7cc85a, #8acb6a, #7abf5c, #3f9a48 and #5cba5a. These hexes were read from the current source.
   - The cut to 32 colours is a separate later pass. It is not mixed into the world PRs.
8. **Draw order:** sky, stars, sun and moon, cloud, far hills, near hills, grass, back-line buildings and signs, fence, then the bush and back props, then play-floor props and characters sorted by y, then the flowers and foreground, effects (rain, bubbles, rainbows), the dusk overlay, and finally the HUD (arrows and lock).
9. Nothing on the ranch is written in words, and v1 adds no spoken area names. The Little Ranch keeps its own U-based scaling and is not moved to the generations 384×216 viewport.

## 6. Behaviour per size

| Size | Art canvas | CSS px per art px | U | View width | World width | Screens wide | Areas visible at rest | Camera bounds (camX) | Stops for areas 0, 1, 2, 3 |
|---|---|---|---|---|---|---|---|---|---|
| 1280x800 | 320×200 | 4 | 230 | 1.39U | 1426 | 4.46 | 1 (plus gutters) | 0 to 1106 | 70, 392, 714, 1036 |
| 844x390 | 422×195 | 2 | 224.2 | 1.88U | 1390 | 3.29 | 1 (0.04U of each neighbour core, no tap targets) | 0 to 968 | 13, 327, 641, 955 |
| 820x1180@2 | 410×590 | 2 | 410 | 1.0U | 2542 | 6.2 | 1 (exactly the core) | 0 to 2132 | 205, 779, 1353, 1927 |
| 390x844@2 | 195×422 | 2 | 195 | 1.0U | 1209 | 6.2 | 1 (exactly the core) | 0 to 1014 | 98, 370, 644, 916 |
| 375x812 | 188×406 | 2 | 188 | 1.0U | 1166 | 6.2 | 1 (exactly the core) | 0 to 978 | 94, 357, 620, 884 |

- On portrait screens the view equals the core, so the arrow lane rule (section 4.2) is the binding constraint.
- The tall sky above G − 0.28U stays sky. Parallax clouds without faces may decorate it, but they are not tappable.
- These numbers come from the formulas in section 3.1 using the probed W, H and U. The camera stops are rounded to whole art pixels.

## 7. Build plan (larger PRs, one per feature area)

1. **LR-WORLD-1, the strip and camera:**
   - World coordinates and the four areas plus caps. Edge arrows, the glide, snapping, the reduced-motion cut, the pup and friend follow, bedtime going home, and the hint on arrows.
   - Every element placed in its area per section 3.3, using the existing sign art on grounded posts (the section 5.5 kit) as stand-ins for the buildings.
   - The Tower and Band get their own doorways in the Toy Yard. `packSignSpot()`, the pack sign, its balloon and the pack card screen are deleted.
   - Rooms return to their area.
   - Includes all of section 8, A to F.
2. **LR-WORLD-2, sky, ground and parallax:** a continuous ground, horizon and fence with gates, the L0 to L4 parallax, sky-band enforcement, the light-direction fix to shadows and the moon slot, the unified dusk ramps and overlay, and the post and sign kit as shared draw helpers. Includes section 8, G to J.
3. **LR-WORLD-3, area buildings:** the garden hutch, picnic table and awning, stage, block shelf corner, barn with its big door, paint shed, parked wagon, pond cap and lane gate. All within the palette ceiling, with plaques kept. Includes section 8, K, and a screenshot set.
4. **Later, separately:** the palette cut to 32, then an optional swipe playtest.

### 7.1 Recommendation on #613

- Land #613 at its newest head for the in-room work, which survives the world rework unchanged: the tower cap and wiggle, the stick hint on the music stand, the shelf, music stand, stage and bunting, and the fixed drawBlock colours.
- Treat its ranch sign and cloud placement (82a6e5bc and 5d468f60) as interim. LR-WORLD-1 deletes the pack sign and `packSignSpot()`, so further rounds on the pack sign and cloud blockers should stop, and those blockers should be closed as moot rather than fixed.
- The formal re-check of 5d468f60 is still due. From this probe, every picture-sign post at 5d468f60 runs down to the fence foot, and the cloud sits in the sky band at all five sizes. The re-check should record the residual issue: at 1280x800 the pack sign's board overlaps the sun disc (board right edge x 55.4, sun left edge x 49.7) and its balloon sits on the sun's glow. It should also record the Paint Shed and Dough Table board overlap on desktop, which predates #613. Both are acceptable only as interim because LR-WORLD-1 removes them.
- This is a recommendation, not an approval.

## 8. Tests and checks to audit against

All of these are automated in tests/little-ranch.html and run with `node tools/run-all-checks.cjs little-ranch` at the five sizes, unless marked as screenshots. LR-WORLD-1 adds the test hooks `LR.world` (areas with core bounds and stops, and the width), `LR.camera` (area, x and target), and `LR.go(i)`. It keeps `LR.layout`, `LR.scale`, `LR.toScreen` (now camera-aware), `LR.ranchTarget`, `LR.advance` and the rest.

- **A. One area per view:** at each stop, every tap target of that area is fully on screen (centre and drawn bounds), and no other area's tap target centre is on screen.
- **B. Tap sizes:** each element's tap radius in CSS px is at least its section 2.2 value at the same size. The new Stage and Shelf doorways are at least the sign value. Each arrow's tap radius is at least 0.175U. A grid of taps over each element's drawn art resolves to that element, extending the existing 285-tap sign check to every doorway.
- **C. Arrow lane:** no tap target's centre or drawn bounds is in the lane at any stop. 100% of taps on an arrow's visible disc go to the arrow. There is no outward arrow at the ends.
- **D. Navigation:**
  - An arrow tap reaches the next stop within 0.7 s.
  - The baby reaches its spot within 0.6 s after the camera settles, and the friend follows.
  - Taps during the glide do nothing.
  - A drag that starts anywhere, including a sponge scrub or a flower run, never moves the camera.
  - Resize keeps the area.
  - Under reduced motion the camera reaches the stop in one frame and the parallax offsets don't change.
- **E. Bedtime:** sunset sends the camera to the Meadow and hides the arrows. They stay hidden through night and come back on waking. A new visit starts in the Meadow.
- **F. Rooms:** leaving each of the 7 rooms returns to the area of its doorway. The pack screen no longer exists.
- **G. Grounding:**
  - Every post foot is at yb within 1 art px.
  - Every board bottom is within G − 0.09U to G − 0.02U.
  - The visible post length is at most 0.15U.
  - Every building sill is at yb within 1 px.
  - Nothing hangs.
- **H. Sky band:**
  - The sun disc and glow, and the cloud's full drawn bounds, sit at y < G − 0.28U.
  - No building, sign or arrow reaches into the sky band.
  - At the Garden stop, the cloud does not overlap the sun or the lock.
- **I. Pixels and scale:** the camera x and every parallax offset are integers on every frame. The `artScale` result equals the #611 formula, with at most 2 CSS px per art pixel when DPR > 1.
- **J. Light and dusk:**
  - Daytime shadow centres sit at or to the right of their object.
  - At full dusk, a pixel sample in each area at each stop is dimmed compared with day (no undimmed area).
  - Night colours come only from the fixed ramps.
- **K. Overlap and palette:**
  - At rest, no two boards or buildings overlap, and no tap target's art overlaps another's, except designed cases such as the baby behind the bush.
  - The palette inventory is at or below the main baseline and at most 195.
- **L. Screenshots (manual audit):** each of the 4 areas, at each of the 5 sizes, by day and at night, for 40 shots per world PR, plus one mid-glide frame per size.
- **M. Regression:** all existing Little Ranch checks pass, and the lock still works and stays clear of everything.

## 9. Layout mockup

See layout.png. It is a rough block diagram of the strip, marked as a layout mockup and not art. It shows the four areas and the end caps, the sky band, the building band, the back line and fence, the play floor, the arrow positions, and the view-width brackets for each review size.

---

## Appendix: measured inventory tables

These are the size tables section 2.2 summarises. They were measured on the #613 head, and the ranch sizes are the same on main. Values are art pixels unless a cell says CSS px. "Tap r" is the tap radius LR-WORLD-1 must not shrink.

| Element | 1280x800 | 844x390 | 820x1180@2 | 390x844@2 | 375x812 |
|---|---|---|---|---|---|
| Canvas in art px (W×H), CSS px per art px | 320×200, ×4 | 422×195, ×2 | 410×590, ×2 | 195×422, ×2 | 188×406, ×2 |
| U / R / ground line y | 230 / 32.2 / 112 | 224.2 / 31.4 / 109.2 | 410 / 57.4 / 330.4 | 195 / 27.3 / 236.3 | 188 / 26.3 / 227.4 |
| Baby (drawn size) | 39.1 (tap r 46.9 = 188 CSS px) | 38.1 (tap r 45.7 = 91 CSS px) | 69.7 (tap r 83.6 = 167 CSS px) | 33.2 (tap r 39.8 = 80 CSS px) | 32 (tap r 38.4 = 77 CSS px) |
| Friend Pebblit (size) | 37.1 | 36.2 | 66.2 | 31.5 | 30.4 |
| Bowl (width) | 64.4 (tap r 38.6 = 154 CSS px) | 62.8 (tap r 37.7 = 75 CSS px) | 114.8 (tap r 68.9 = 138 CSS px) | 54.6 (tap r 32.8 = 66 CSS px) | 52.6 (tap r 31.6 = 63 CSS px) |
| Sponge (w×h) | 51.5×28.3 (tap r 35.4 = 142 CSS px) | 50.2×27.6 (tap r 34.5 = 69 CSS px) | 91.8×50.5 (tap r 63.1 = 126 CSS px) | 43.7×24 (tap r 30 = 60 CSS px) | 42.1×23.2 (tap r 29 = 58 CSS px) |
| Bush (width) | 92.6 (tap r 45.1 = 180 CSS px) | 90.3 (tap r 44 = 88 CSS px) | 165 (tap r 80.4 = 161 CSS px) | 78.5 (tap r 38.2 = 76 CSS px) | 75.7 (tap r 36.8 = 74 CSS px) |
| Hat basket (radius) | 19.3 (tap r 33.8 = 135 CSS px) | 18.8 (tap r 33 = 66 CSS px) | 51.7 (tap r 60.3 = 121 CSS px) | 24.6 (tap r 28.7 = 57 CSS px) | 23.7 (tap r 27.6 = 55 CSS px) |
| Ball (radius) | 28.3 | 27.6 | 50.5 | 24 | 23.2 |
| Flower (radius, ×5) | 15 | 22 | 41 | 19.5 | 18.8 |
| Puddle (radius, ×2) | 21 / 27.6 | 26.9 / 23.7 | 49.2 / 49.2 | 23.4 / 23.4 | 22.6 / 22.6 |
| Sun (disc radius) | 20.7 (tap r 36.8 = 147 CSS px) | 20.2 (tap r 35.9 = 72 CSS px) | 36.9 (tap r 65.6 = 131 CSS px) | 17.6 (tap r 31.2 = 62 CSS px) | 16.9 (tap r 30.1 = 60 CSS px) |
| Cloud (radius / width) | 22 / 57.2 (tap r 29.7 = 119 CSS px) | 21.4 / 55.8 (tap r 29 = 58 CSS px) | 41 / 106.6 (tap r 55.4 = 111 CSS px) | 19.5 / 50.7 (tap r 26.3 = 53 CSS px) | 18.8 / 48.9 (tap r 25.4 = 51 CSS px) |
| Moon (radius) | 16.1 | 15.7 | 28.7 | 13.7 | 13.2 |
| Bedtime item (radius) | 35.4 | 34.5 | 68.9 | 32.8 | 31.6 |
| Doorway sign board (w×h) | 58.1×44 (tap r 40.2 = 161 CSS px) | 56.7×42.9 (tap r 39.2 = 78 CSS px) | 103.6×78.5 (tap r 71.8 = 144 CSS px) | 49.3×37.3 (tap r 34.1 = 68 CSS px) | 47.5×36 (tap r 32.9 = 66 CSS px) |
| Tower block (side) | 26 | 25.4 | 61.5 | 29.3 | 28.2 |
| Band baby (size) | 32 | 31.2 | 57.4 | 27.3 | 26.3 |
| Room barn button (radius) | 19 | 18.5 | 42.1 | 20 | 19.3 |

| Sign | 1280x800 | 844x390 | 820x1180@2 | 390x844@2 | 375x812 |
|---|---|---|---|---|---|
| sign | (41.9, 100) ×1, top 64.2 | (46.4, 97.5) ×1, top 62.6 | (74.6, 295) ×1, top 231.2 | (35.5, 211) ×1, top 180.7 | (34.2, 203) ×1, top 173.7 |
| wsign | (278.1, 57.3) ×1, top 21.5 | (371.4, 55.8) ×1, top 20.9 | (335.4, 295) ×1, top 231.2 | (159.5, 211) ×1, top 180.7 | (153.8, 203) ×1, top 173.7 |
| ksign | (144, 57.3) ×1, top 21.5 | (189.9, 55.8) ×1, top 20.9 | (205, 220.4) ×1, top 156.6 | (97.5, 175.5) ×1, top 145.2 | (94, 168.8) ×1, top 139.5 |
| tsign | (92.9, 96) ×1, top 60.2 | (118.2, 93.6) ×1, top 58.7 | (74.6, 145.8) ×1, top 82 | (35.5, 140) ×1, top 109.7 | (34.2, 134.6) ×1, top 105.3 |
| dsign | (284.6, 144) ×1, top 108.2 | (387.5, 140.4) ×1, top 105.5 | (335.4, 145.8) ×1, top 82 | (159.5, 140) ×1, top 109.7 | (153.8, 134.6) ×1, top 105.3 |
| psign | (32.1, 32.4) ×0.8, top 3.7; main (219.4, 63.7) | (266.9, 38.8) ×1, top 3.9; main (281.9, 62.8) | (164.4, 58.6) ×0.8, top 4.4; main (200.2, 65.4) | (60.2, 34.1) ×1, top 3.8; main (114.2, 73.1) | (56.5, 33) ×1, top 3.8; main (110.5, 72) |

- 1280x800: sun (70.4, 34); cloud (204.8, 18.4) at the #613 head, (204.8, 18.4) on main.
- 844x390: sun (92.8, 33.2); cloud (37.5, 17.9) at the #613 head, (270.1, 17.9) on main.
- 820x1180@2: sun (90.2, 100.3); cloud (262.4, 47.2) at the #613 head, (262.4, 47.2) on main.
- 390x844@2: sun (42.9, 71.7); cloud (124.8, 33.8) at the #613 head, (124.8, 33.8) on main.
- 375x812: sun (41.4, 69); cloud (120.3, 32.5) at the #613 head, (120.3, 32.5) on main.
