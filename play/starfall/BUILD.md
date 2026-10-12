# Starfall preview: SF2.6c opening view, 2026-10-11

Built from exact merged source `0af5b92cf4ae03fbbb2dd83bf67b0e06332e38fd` ([source PR #200](https://github.com/ecbarish/idle-arcade/pull/200)); publication is [PR #206](https://github.com/ecbarish/idle-arcade/pull/206).

The full Guild Hall roof/banner and Lantern Inn roof now fit in a new town's first view. Existing towns keep their saved position and progress. The three unused Ninja Adventure environment textures/imports are removed. This includes the previously published SF2.6/ART-SF-7 frontier town, evening tint, training-yard footprint, SF2.7 wilds, SF2.8 hand work, SF2.18 no mandatory chores and SF2.20 Tamsin pacing. Unmerged goal/controls PR #195 is not included.

Only index.pck and its byte count in index.html are rebuilt. The existing Godot 4.7.2 index.js and index.wasm are byte-for-byte unchanged. build.json records the exact source commit, project tree, export run and SHA-256 digests of all four shipped files.

The export job tests the actual produced PCK with Chromium/SwiftShader before storing its immutable Git blob. Final CI has read-only permissions: it verifies and plays the committed bytes without re-exporting them. Legacy saves come from the real writer in the previously shipped source `fa44b3ace8aa151ff264af679b3d739342b25a34`; the old comparison PCK comes from the pinned source's previous play/starfall build, never from the new committed pack.

[Verification and screenshots](../../docs/research/starfall-preview-opening.md). All required checks must be green before merge. After merge, the read-only live check compares build.json and the four exact public Pages file hashes; the final PR comment records its result.

## Reproduce a pack-only export

Import starfall-godot with official Godot 4.7.2, then export with --export-pack Web ../play/starfall/index.pck. Run tools/starfall-preview-manifest.py stage --source followed by the full merged source SHA to update the shell's single pack-size field and manifest. Do not replace the existing engine. Run the browser/save review and inspect actual pixels. Future releases must update the workflow's pinned source and PR gate deliberately.
