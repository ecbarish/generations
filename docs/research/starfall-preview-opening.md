# Starfall SF2.6c web-preview release review

Source [#200](https://github.com/ecbarish/idle-arcade/pull/200) merged as `0af5b92cf4ae03fbbb2dd83bf67b0e06332e38fd`. Publication: [#206](https://github.com/ecbarish/idle-arcade/pull/206). Adam explicitly approved ready, merge and preview publication after verification.

## Exact artifact

[Export/review run](https://github.com/ecbarish/idle-arcade/actions/runs/38182859055): 54 browser checks and 17 nonblank captures pass. PCK size 3,189,652 bytes; SHA-256 `8faaec5a620dd155a11b841d14ca76610444d5c21e74250cadc862978af9f682`.

Pack-only Godot 4.7.2 export. The existing engine's index.js and index.wasm hashes stay unchanged; only the PCK and one shell byte count change. [build.json](../../play/starfall/build.json) records exact source/project-tree and file digests. The downloaded export artifact is independently checked against SHA-256 and Git blob IDs before those blobs are committed. No diagnostics, fixture hooks or FS instrumentation are shipped.

The final read-only workflow verifies the committed artifact and runs the same browser tests without exporting over it. All normal aggregate suites also run. No unmerged #195 goal/controls work or unrelated game source is included.

## Actual browser coverage

- Chromium with SwiftShader, real WASM engine and release PCK. One unaltered-engine smoke start, then response-only FS exposure for observing saves. The PCK is never patched or replaced by a test project.
- Fresh opening on 1920×1080, 1366×768, 812×375 phone landscape and 3440×1440. Welcome and dismissed-dialogue pictures show complete roofs/banner. Real keyboard movement, mouse/touch return, and restored framing are exercised.
- Fresh towns save a nondefault position, persist it to IndexedDB, then reload without injected files and newly save that same position. A reset to the default opening fails the check.
- Synthetic legacy towns are written by the real pre-SF2.6c game at `fa44b3a`, tested first in the previous PCK and then the new PCK on desktop and phone. Position (14,10), 321 coins, day 7, 12 meals, rank 1, healer building and three adventurers are preserved.
- Legacy assertions require a game-written timestamp newer than the injected snapshot, then a further new write after fixture-free reload, so rereading an unused preload cannot pass.
- Classic and unrelated localStorage sentinels are seeded once before entering the game; they are not reseeded on reload.
- Seventeen screenshot files are checked for nonblank pixels and visually reviewed. Browser checks reject script/page errors.

## Evidence

[Desktop opening](../screenshots/starfall-preview-opening/1920x1080-fresh-ready.png), [phone opening](../screenshots/starfall-preview-opening/812x375-fresh-ready.png), [legacy phone town](../screenshots/starfall-preview-opening/812x375-legacy-after.png).

The source review separately passes 227 native Starfall checks, 32 actual native-renderer captures at four sizes and all 501 legal construction layouts. [Source evidence](../screenshots/starfall-opening-view/README.md).

## Limits and publication gate

Phone testing is an emulated browser viewport/touch input, not a physical-device test. The existing integer-scale letterboxing remains. The new source and pack do not change controls, save format or zoom.

Latest-head aggregate and exact-pack browser checks must pass before merge. After merge, verify official Pages deployment and public build.json plus index.pck/index.html/index.js/index.wasm hashes. Final run URLs and live confirmation are recorded on #206 to avoid claiming deployment before it happens.
