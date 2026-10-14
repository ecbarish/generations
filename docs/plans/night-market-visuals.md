# Night Market Stalls: visual life polish spec (ART-NM-1)

Status: draft from Game Art Director, 2026-10-14. Polish only: no changes to balance, save or model.
Trigger: Playtester's note "no visual life" (Playtester screenshots nm_01 to nm_06 (on the PM box)).

## What the game is today (read from `games/night-market/` on main, v0.1.1)

It will be v0.1.2 after the #434 bookkeeping.

- **No canvas and no draw loop.** It is a DOM ledger: `index.html` + `style.css` + `game.js`, which calls `render()` from `setInterval(render, 250)`. The only "scene" is one sentence: "Lanterns over a short lane of stalls."
- **Current palette (style.css): 10 colours.** `#241c16` ink, `#f4efe6` paper, `#ddd4c6` rule, `#8a4e1d` amber, `#f6e6cf` amber-wash, `#6e6258` mute, `#1d5c3e` good, `#161326` night, `#fffdf8` button face, `#fbf6ec` away box.
- The house shared colours are missing: ink `#1e1a22` and lamplight `#f2d080`.

So "visual life" needs one small surface to live on. **Effect 0** below adds it. Effects 1–5 draw on it. Everything else stays DOM.

## Palette
| | Colours |
|---|---|
| Before | 10 (above) |
| Added | `#1e1a22` house ink (outline), `#f2d080` house lamplight. Both are required by docs/art/README.md rule 6, so they are not new invented colours. |
| After | **12 / 32 cap** |

Scene uses only: `#161326` night (sky/ground), `#1e1a22` ink (outlines, silhouettes), `#241c16` (stall timber, dark value), `#8a4e1d` amber (stall mid value / lantern body), `#6e6258` mute (smoke, far wall), `#ddd4c6` rule (steam, light value), `#f6e6cf` amber-wash (glow light value, coin highlight), `#f2d080` lamplight (lantern core, coin), `#1d5c3e` good (upgrade flash rim). No alpha blending, no gradients: every pixel is one palette index.

## Effect 0 (base): the lane strip
- A `<canvas id="lane" width="384" height="72">` under the header (one 384x216 viewport is too tall for a ledger page, so use a 384-wide band, 4.5 tiles high, on the 16px grid). CSS: `width:100%; image-rendering:pixelated;` and scaled by **whole numbers only** (`Math.floor(container/384)`, minimum 1, centred on the night colour).
- Six stall slots, each 64x56 px (4x3.5 tiles), left to right in `M.STALLS` order. Shuttered stall = `#241c16` box with `#1e1a22` outline and `#6e6258` shutter slats. Open = awning + counter, lit from the upper left (light `#f6e6cf`, mid `#8a4e1d`, dark `#241c16`, shadow side lower right).
- Static art painted once to an offscreen canvas and re-blitted; only the effect layers redraw.
- **Loop:** one `requestAnimationFrame` loop, stepped at a **fixed 8 fps** (125 ms ticks, accumulator), drawing only dirty rects. Stop the loop when `document.hidden`; restart on `visibilitychange`. Honour `prefers-reduced-motion: reduce` by showing static frame 0 of everything (coin pop and flash still show as one still frame for 500 ms).
- Done when: the strip shows the six stalls matching current unlock state, scales crisply at 1x/2x/3x, and the game's 250 ms DOM render is unchanged.

Effects are listed by impact, highest first.

## 1. Coin pop on each sale (the biggest win: income becomes visible)
- **Size:** 5x5 px coin (`#f2d080` face, `#f6e6cf` 1px upper-left glint, `#1e1a22` outline).
- **Frames / timing:** 4 frames at 125 ms (500 ms total): rise 0, 2, 4, 6 px; frame 4 is a 3x3 "sparkle" plus. Whole-pixel steps.
- **Placement:** from the counter top-centre of the stall that earned it.
- **Trigger:** hand sales (`serve`): every click. Hired stalls: they earn continuously, so pop **at most one coin per stall every 2 s** (a visual tick, not tied to the real income maths), and only for stalls with `owned > 0`.
- **Perf:** pool of 12 coins max, no allocation per frame; extras are dropped.
- **Done when:** clicking Serve always pops a coin over that stall; a full lane never shows more than 12 coins; nothing pops while the tab is hidden, and there is no burst of queued coins on return.

## 2. Lantern flicker (the scene the page already promises)
- **Size:** lanterns 6x8 px (1 per open stall hung from the awning, plus a string of 3x4 lanterns along the top every 32 px = 12).
- **Colours:** body `#8a4e1d`, core `#f2d080`, glow ring 1 px `#f6e6cf` on frames that are "bright", outline `#1e1a22`.
- **Frames / timing:** 3 frames (bright / normal / dim, where dim drops the glow ring and the core shrinks by 1 px). Each lantern holds a frame 375–1000 ms, picked from a seeded random so they never sync. A lantern **never sways**: no sub-pixel motion.
- **Placement:** top 12 px of the strip; stall lanterns at the awning's upper-left corner (they are the light source for the upper-left lighting).
- **Perf:** at most ~2 lantern redraws per tick (each a 8x10 dirty rect).
- **Done when:** lanterns visibly flicker without blinking in unison, there is no blur, and shuttered stalls have an unlit (`#6e6258` core) lantern.

## 3. Stall steam / smoke (each stall reads by its silhouette)
- **Size:** puffs of 2x2 to 3x3 px; a column ≤ 6x14 px per stall.
- **Colours:** steam `#ddd4c6` for Tea Stall, Dumpling Cart and Mooncake Table; smoke `#6e6258` for Incense Tray; Lantern Stand and Story Mat get none (lanterns and a rug read on their own).
- **Frames / timing:** 6-frame loop, 166 ms per frame (~1 s loop, run at the nearest tick). The puff rises 2 px per frame and drifts 1 px right every 2nd frame, shrinking 3→2→1 px, then resets. Offset each stall's loop by a different start frame.
- **Placement:** from the pot/brazier at counter level, inside the stall's 64 px slot.
- **Perf:** ≤ 3 puffs per stall, 4 stalls = 12 sprites; precomputed frame table, no particles system.
- **Done when:** steam only appears on open, hired-or-served stalls, stays inside the strip, and looks like steam (light) vs incense (grey).

## 4. Upgrade flash (milestones 25 / 50 / 100 and each buy)
- **Size:** 1 px rim around the stall's 64x56 slot; at milestones also 4 rays of 3 px at the corners.
- **Colours:** `#f2d080` rim on a buy, `#1d5c3e` rim plus `#f2d080` rays on a milestone (matches the green "goal" text, so the green means progress).
- **Frames / timing:** buy: 2 frames (rim on 125 ms, off). Milestone: 4 frames at 125 ms (rim, rim+rays, rim, off), and the stall's art then swaps to its next look (owner-supplied art; if none exists yet, re-tint the awning stripe only).
- **Placement:** on the stall that was bought/hired.
- **Perf:** a dirty rect around one slot; Buy max fires one flash, not one per unit.
- **Done when:** every Buy / Ask to hire flashes exactly that stall once; crossing 25/50/100 plays the milestone version once (not on every reload).

## 5. Passer-by silhouettes (life when you aren't clicking)
- **Size:** 16x24 px people (house proportions, rule 2: no chibi), but a lower strip version is cropped to the top 20 px so feet sit behind the counter line; solid `#1e1a22` silhouettes with a 1 px `#241c16` inner shade on the lower-right edge. Optional lantern-carrier holds a 3x4 `#f2d080` lantern.
- **Frames / timing:** 4-frame walk (house rule 9) at 125 ms per frame; speed 1 px per tick = 8 px/s, so a walk across 384 px takes 48 s.
- **Placement:** a walk lane in front of the counters, at y = 48–72; left-to-right or right-to-left.
- **Spawn:** at most 2 on screen; a new one every 12–30 s (seeded random). Number on screen scales with open stalls (0 open = 0, 1–3 = 1, 4+ = 2) so a busy market looks busy.
- **Perf:** a 16x24 dirty rect each per tick.
- **Done when:** walkers never overlap the coins or pass through text, never sit still mid-walk, walk only in whole pixels, and are gone (not frozen) after returning to a hidden tab.

## Performance budget (whole strip)
- Fixed 8 fps, rAF-driven, **fully stopped when `document.hidden`** (no setInterval for art). On `visibilitychange` back, reset timers; do not replay missed frames.
- ≤ 40 sprites live at once; all from one tiny sprite sheet PNG (or drawn by a `tools/art/` script), indexed colours only.
- Target: < 0.5 ms per tick on a mid laptop, zero GC per frame (pooled objects). Verify a 30-minute open tab with DevTools: no memory growth.
- Must not touch `M`, the idle core, or the save. Read-only use of `state` (`stalls[i].owned`, `hired`, unlock).

## Acceptance (whole task)
1. Side-by-side screenshot at 1x and 3x on desktop and a 390x844 phone (portrait strip still whole-pixel scaled; at 390 px wide that is 1x, centred).
2. Palette check: a script lists every colour in the strip's pixels; it is a subset of the 12 above.
3. Reduced motion respected; hidden tab = 0 animation frames (check with a rAF counter).
4. No balance or text changes ride along (the welcome-back text and "pays for itself" fixes are separate tasks).
5. Reviewed by the Art direction thread before merge.

## Build order
Effect 0 → 1 → 2 → 3 → 4 → 5, in one pull request covering effects 0 to 5. Night Market visuals is one bundle.
