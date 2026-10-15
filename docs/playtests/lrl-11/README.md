# Little Ranch phone pre-check for the LRL-11 playtest (LR-G1)

**What this is.** A real-browser check, run before Playtester's phone session (LRL-11), so Playtester starts with a known list. `phone-precheck.cjs` opens Little Ranch in Chromium at four phone and tablet sizes, goes to every place with real touch taps, and reports every tap target smaller than 44 by 44 pixels, every pair of tappable things that overlap, and anything cut off the screen. It saves one screenshot per place and size. **It changes no game file and fixes nothing.** LRL-11 is still Playtester's phone playtest. This is only the list that goes in first.

It ran against `main` at `56fa9611` (Little Ranch `v0.18.2`, Chrome 154.0.8037.97). The output is `report.json` and the PNG files in this folder, named `<width>x<height>-<place>.png`.

## Run it

```
node docs/playtests/lrl-11/phone-precheck.cjs [output-directory]
```

It needs the `playwright` package (or `playwright-core`) and a Chromium or Chrome binary. Set `CHROME_PATH` if the binary is not at `/usr/bin/google-chrome`, `/usr/bin/chromium` or `/usr/bin/chromium-browser`. With no output directory it writes next to the script. It serves the repo from a throw-away local server on a random port, gives each size a fresh browser profile with the service worker blocked (so it never reads or writes a player's saved settings), and makes no network call. It exits 0 when it finished, with or without findings. It exits 1 if a check of the script itself fails (see "How far to trust it"), and 2 if it crashed.

## What it does at each size

The sizes are **390x844** and **844x390** (an iPhone 12 held upright and sideways, as in the checklist), **360x780** (a small Android) and **1024x594** (a tablet). Every size is a touch screen at device scale 1, so a CSS pixel is a screen pixel.

1. **Ranch, in the day**, then the ranch with a friend visiting.
2. **Each of the five places**, entered by a real tap on its sign (the paint shed, the wagon, the snack kitchen, the dough and the barn door). In each one it taps the middle of one thing and checks the game reacted, then taps the barn picture and checks it went home.
3. **Bedtime**: the routine step that waits for a tap (the toothbrush or the cup), then the ranch with the baby asleep.
4. **The grown-ups panel**: it holds the lock button with a real finger for the full three seconds, measures the panel's buttons while the finger is still down, lifts, and taps the close button.

The "tap target" for a thing drawn on the canvas is the area the game really answers to: the game's own tap zones (copied from `games/little-ranch/game.js`: `ranchTarget`, `shedTap`, `wagonTap`, `kitchenTap`, `doughTap`, `doorTap` and the bedtime taps), laid out from `LR.layout`. The screen is sampled every 2 pixels and each point is given to the zone the game would give it to. A zone's size is **the biggest square that fits wholly inside the area the player actually gets**, so a zone that other zones eat into counts at its reduced size. For the buttons in the panel and the lock it is the button's own box.

## Biggest square tap area in each place

The smallest zone in each place, in CSS pixels (the rule is 44):

| Place | 390x844 (iPhone 12 upright) | 844x390 (iPhone 12 sideways) | 360x780 (small Android) | 1024x594 (tablet) |
|---|---|---|---|---|
| Ranch, day | 56 px (ball) | 70 px (flower1) | 52 px (ball) | 78 px (flower4) |
| Ranch, with a friend | 56 px (ball) | 70 px (friend) | 52 px (ball) | 78 px (flower4) |
| Paint shed | 52 px (outline: body) | 38 px (outline: body) | 50 px (outline: body) | 56 px (outline: body) |
| Wagon | 64 px (barn (leave)) | 60 px (barn (leave)) | 60 px (barn (leave)) | 92 px (barn (leave)) |
| Snack kitchen | 64 px (barn (leave)) | 60 px (barn (leave)) | 60 px (barn (leave)) | 92 px (barn (leave)) |
| Dough | 60 px (colour dot0) | 60 px (barn (leave)) | 56 px (colour dot0) | 92 px (barn (leave)) |
| Barn door | 64 px (barn (leave)) | 60 px (barn (leave)) | 60 px (barn (leave)) | 92 px (barn (leave)) |
| Bedtime routine (toothbrush or cup) | 102 px (toothbrush or cup) | 108 px (toothbrush or cup) | 94 px (toothbrush or cup) | 164 px (toothbrush or cup) |
| Bedtime, baby asleep | 56 px (ball) | 80 px (ball) | 52 px (ball) | 120 px (ball) |
| Grown-ups panel | 44 px (#gX) | 44 px (#gX) | 44 px (#gX) | 44 px (#gX) |

## Findings

Nothing was cut off the screen at any size: no page is bigger than the screen, no zone's middle is off screen, and the lock and the panel's buttons are inside the screen. Every other zone has a biggest square of 50 px or more at every size, and the grown-ups lock is 48 by 48.

The script found 7 things. None of them stops the game working, and none needs a rule change.

1. **Paint shed, body of the baby outline, 844x390 (small).** On the sideways phone the biggest square the player can tap to colour the body is **38 by 38 px**, under 44. The screenshot is [`844x390-shed.png`](844x390-shed.png). The head, the legs and the tail around the body take priority over it, and the shed is short on that screen, so the body is squeezed. A drag over the outline paints whatever it crosses, and a tap anywhere near the baby colours the nearest part, so the effect for a child is small, but it is the only thing under 44 and Playtester should see whether a small child can colour the body on this screen. It is not at the other three sizes (50 px at 360x780, 52 px at 390x844, 56 px on the tablet). **Real, small. I would take this one if Playtester sees it matter.**
2. **Grown-ups panel, the close button overlaps an action button, 844x390 and 360x780 (overlap).** The round close button (44 by 44) overlaps the top-right action card by **36 by 5.2 px** at 844x390 ("Back to play") and by **42 by 3.2 px** at 360x780 ("Sound on"). The screenshots are [`844x390-grown-ups-panel.png`](844x390-grown-ups-panel.png) and [`360x780-grown-ups-panel.png`](360x780-grown-ups-panel.png). The close button is on top, so it wins the overlap and the card is still tappable on the rest of its face. It is a strip a few pixels deep, and it is not there at 390x844 or on the tablet. **Real, cosmetic, and it touches no save. I would take this one in the next Little Ranch fix list.**
3. **Grown-ups panel after the finger lifts, all four sizes (check on a real phone).** After the three-second hold the panel opens and stays open while the finger is down. Then, in Chromium's touch emulation, **the panel closes about 1 ms after the finger lifts**: a click lands on the dimmed backdrop right where the lock was, and tapping the backdrop closes the panel. Phones do not always send a click after a long press, so this may well be a quirk of the emulation. It cannot be told apart from a real bug without a real phone. The screenshots are `390x844-grown-ups-panel.png`, `844x390-grown-ups-panel.png`, `360x780-grown-ups-panel.png` and `1024x594-grown-ups-panel.png`. **Playtester: hold the lock for three seconds on a real phone, lift your finger, and say whether the panel stays open.** If it closes, that is a real bug and I take the fix.

Screens with nothing found: every other place at every size, including both bedtime screens.

## How far to trust it

- The canvas zones are **copies** of the game's rules, so the script checks itself two ways. On the ranch, the zones agree with the game's own `LR.ranchTarget` at all 773,688 sampled points across the eight ranch screens (two per size), and a mismatch fails the run. In each place a real tap at the middle of one zone made the game react (80 of 80 checks of this kind pass, including every real tap on a sign and on a barn picture). If the game's tap rules change, the script will say so before it is wrong.
- It measures **one moment** of each place. The baby, the ball, the rain puddles, the hat basket, the sun's slide at dusk, the moon, the soap bubbles, the wagon's ride (the windmill, pond and sheep that scroll by) and the barn-door gadgets after they are touched are not walked through. The ball and the baby overlap as they rest at the start: the game gives the shared spot to the ball, and the baby keeps the rest of its area.
- It does not measure what a thumb can reach, how fast a finger has to be, how the sound or the spoken words come out, or anything on a real phone. It is a **browser-engineering** check, not a physical-phone or newcomer playtest.
- It says nothing about whether things are *drawn* cut off, only whether a tap zone's middle is off screen or the DOM buttons leave the screen. Please look at the screenshots too.

## For Playtester

1. Open the screenshots for your phone's size, and look at the two places above (the paint shed body on a sideways phone, and the panel's close button).
2. Do the real-phone check in finding 3.
3. Everything else in LRL-11 is yours as before. Anything you find that is not on this list is a new finding.
