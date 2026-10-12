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


## Verified live result — 2026-10-12

Preview PR #222 merged as `95b1655f894d4b8fbe139144907325fe0dda6bc1` after [all 19 suites](https://github.com/ecbarish/idle-arcade/actions/runs/38260286667) and [exact committed-pack review](https://github.com/ecbarish/idle-arcade/actions/runs/38260286755) passed on head `cd2b8f7b3d7cb9c937aa466be22c7fc9fdd60bf0`. The latter passed 1,429 checks / 136 screenshots; artifact 11752009873 retains full evidence.

[Pages deployment](https://github.com/ecbarish/idle-arcade/actions/runs/38262092537), [post-merge all-suite checks](https://github.com/ecbarish/idle-arcade/actions/runs/38262093297) and [live verification](https://github.com/ecbarish/idle-arcade/actions/runs/38262093152) all passed for that exact merge. At **2026-10-12 14:21:59 UTC**, the public build metadata and all four file hashes exactly matched the reviewed release. [Original downloaded live verification JSON](starfall-mobile-live-verification.json); artifact 11753031931.

Live: https://ecbarish.github.io/idle-arcade/play/starfall/

| Public file | Bytes | Verified SHA-256 |
|---|---:|---|
| index.html | 5,486 | 984c3e1f3f9b72ae625991c7cf4e4a0c8558e19f19a7fcaad0818973631ad61d |
| index.js | 279,815 | 33c94cb3175f3333b82e2a3be5e8e86f77986f0aa2042b1631f6367a4e5bb6ba |
| index.pck | 3,194,852 | 30e2e6382740bcddc783f73aa7831138bf5aa638c4e6bc3792b8225172c6b8b8 |
| index.wasm | 39,514,754 | fc74679e3b97f76878947fcd4fbe1268cbfa6188182a2e33bbc3f5dc9bfa57d0 |

Existing open tabs need a refresh to load the new pack; the save location and format are unchanged. The final COMMS entry records these results without replacing other contributors' messages. Implementation/release commits use the verified abarish-dev noreply author and committer; GitHub-generated merge commits have that noreply author and GitHub's standard `noreply@github.com` service committer.
