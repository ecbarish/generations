# Starfall phone aspect-fit review

SF-MOBILE-FIT, draft PR #221. Source change: `ed266f80c7eb67fe259a50545bb2ac7ddd798174`.

## What changes

Native Android/iOS and web hosts identified by Godot as `web_android` or `web_ios` use fractional aspect-fit. The game keeps its 384×216 composition, nearest-filtered art, camera limits, touch routing and save format. Desktop retains integer pixel scaling. Portrait still has bars above/below the landscape game; wide landscape screens still have side bars. The fix removes unnecessary whole-number scaling gaps, rather than stretching or cropping the world.

Fractional sizing can make adjacent source pixels occupy slightly different display-pixel widths. No filtering blur is added. The amount of enlargement depends on viewport size and device pixel ratio.

## Verification

- Local official Godot 4.7.2: Wildbond 1,510 checks / Starfall 248 checks passed, including six added display invariants.
- All 19 aggregate suites on source commit `ed266f8`: [passed](https://github.com/ecbarish/idle-arcade/actions/runs/38252303687).
- Existing native opening/framing and construction review on that source: [passed](https://github.com/ecbarish/idle-arcade/actions/runs/38252303461).
- Dedicated exported-browser review: **1,406 checks, 136 real screenshots, 23 browser sessions and 71 save assertions passed**, zero runtime errors. [Run 38254467520](https://github.com/ecbarish/idle-arcade/actions/runs/38254467520), source/harness head `9bf2a446cc8f529fe807625870a682bdd1b1e726`, base `2da704145f43c24cf204244d43624fc4bea31597`. Full artifact `starfall-mobile-fit-review`, ID 11749657446, retained through 2027-01-10. [Portable evidence summary and screenshot hashes](summary.json).
- Android UA at DPR 1 / 2.75 / 3 and iPhone UA at DPR 1 / 3; portrait 375×812 and 393×851, landscape, eight repeated orientation/toolbar-height changes per phone flow, goal-list open/close and world taps, then IndexedDB reload. Old-writer towns kept day, position, coins, meals, buildings and roster in Android/iPhone/desktop sessions.
- Desktop 1366×768, 1920×1080 and 3440×1440 retains identical before/after painted bounds: 1152×648, 1920×1080 and 2304×1296 respectively. Pointer, keyboard and save reload checks pass.

## Original screenshot evidence

These seven PNGs are copied unchanged from that successful run. Their Git blob SHA and local SHA-256 were checked before publication. The screenshots use CSS-pixel dimensions; high-DPI backing size is recorded in the summary.

- [Android landscape before](android-dpr2.75-before-landscape.png) / [after](android-dpr2.75-after-landscape.png): at 812×375 and DPR 2.75, painted bounds grow from 559×314 to 666×374, about **19% larger in each dimension**. The one unused CSS row is the existing engine's fractional-DPR rounding.
- [Android portrait after](android-dpr2.75-after-portrait.png): uses the available canvas width (374 of 375 CSS pixels at DPR 2.75; 375 at DPR 1/3). Portrait still has large top/bottom bars because the view remains landscape.
- [iPhone-emulated landscape after rotation, with goals opened by touch](ios-393x851-dpr3-resize-0-851x393-goals-shown.png).
- [Desktop before](desktop-1366x768-before.png) / [after](desktop-1366x768-after.png): unchanged pixel-scaling bounds.
- [Old town loaded on phone](android-legacy-loaded.png): same saved position and progress, with fractional fitting.

I inspected the rendered welcome text, status, goal list, complete panels and landmark proportions. Landscape text is clearer at the enlarged scale. Portrait text remains small in the same landscape composition; this change does not enlarge fonts or redesign the phone interface. Pixel assertions establish presence/fit, not subjective readability.

The first browser attempt stopped on an overly strict white-glyph detector despite visibly opened goals. It was corrected to compare positive glyph appearance/disappearance in the same UI region, backed by the independent persisted goal acknowledgement. No game behavior or existing check was weakened. Final-head rerun is required after this evidence commit; its links will be recorded in the PR.

The dedicated workflow exports temporary before/after PCKs with official Godot 4.7.2, serves them through the existing committed HTML/JS/WASM and verifies preview files remain unchanged. Screenshot pixel scans independently measure the painted world bounds and visible text/panel pixels. Real browser pointer/touch and keyboard events are verified through resulting game saves, including persisted IndexedDB reloads. Android/iPhone UA, DPR and viewport emulation is explicitly distinguished from a physical phone.

## Limits and release gate

Local Chromium cannot launch in this executor; browser evidence comes from GitHub Actions. Chromium with an iPhone UA is not Safari/WebKit testing. Physical device/browser-toolbar behavior and desktop-UA iPads are not established. Godot's bundled web platform detection uses Android/iPhone/iPad/iPod UA strings.

This is a source repair only. `play/starfall/` remains unchanged. Publication requires approval, merging the reviewed source, rebuilding the preview from that exact merged source, rerunning exact-pack checks and verifying published file hashes. The PR stays draft until that decision.

An existing input quirk is kept unchanged: the cream dialogue panel consumes taps. Open-world taps advance dialogue. The browser checks use that existing gesture; a separate native viewport-input reproduction confirmed the panel behavior before changing any test expectation.
