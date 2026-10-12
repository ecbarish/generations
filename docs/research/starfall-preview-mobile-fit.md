# Starfall mobile-fit preview release

Adam approved merge and publication on 2026-10-12 at 13:51 UTC. Source [PR #221](https://github.com/ecbarish/idle-arcade/pull/221) merged as `1a37f695fa6f271da74cb983e909f5968501d032`. Preview release: [PR #222](https://github.com/ecbarish/idle-arcade/pull/222).

## Exact provenance

- Game source tree: `cb5e9d7955b9d535f386cad988065d9777b7a07f`, identical in tested source head `bb8307036bd987a1d8ea750978138e1e17f40bab` and the merge.
- Official Godot 4.7.2 rebuilt the pack in [run 38256542577](https://github.com/ecbarish/idle-arcade/actions/runs/38256542577); artifact `starfall-mobile-fit-review`, ID 11750834193. That exact `pack/after.pck` passed 1,429 checks and 136 rendered screenshots before download. It is copied unchanged into this release, not rebuilt again into different unreviewed bytes.
- Pack: **3,194,852 bytes**, SHA-256 `30e2e6382740bcddc783f73aa7831138bf5aa638c4e6bc3792b8225172c6b8b8`; Git blob `7df9f62a91494cd6b419d39edd83461db8060c1b`. Downloaded bytes were independently hashed; the uploaded Git blob matched.
- The shell changes only the pack byte count. Existing JS/WASM engine bytes are preserved. `play/starfall/build.json` records all four published file hashes and the merged source identity.
- The previous actual shipped pack is the immutable blob from the source merge (3,194,932 bytes; SHA-256 `f8aacde0c490517cc070721d64378cab0fd8dbd070e7bf2c5db00db9c0a585d5`). Its prior build.json had become stale after another preview update, so release tests use the actual Git blob as the baseline rather than trusting that old metadata. The new manifest is fully verified.

## Publication gates

The PR222-only read-only workflow verifies the exact committed pack hash/size, source tree, unchanged harness and complete manifest, then reruns all phone/desktop/rotation/touch/save scenarios against the committed pack without exporting or modifying it. All aggregate suites must pass on that same release head. Final run links and results are recorded in PR #222 after completion.

After merging, the existing Pages verification workflow checks the public build manifest and independently hashes index.html, index.js, index.wasm and index.pck. The final deployment SHA, verification run and live result will be recorded in PR #222. No claim of being live is made before this gate passes.

The source-review screenshots and limits remain [here](../screenshots/starfall-mobile-fit/README.md): Chromium mobile emulation is not a physical device or Safari test, aspect bars remain, and the existing dialogue-panel input quirk is unchanged. No new gameplay, camera, save format or engine change is part of this release.
