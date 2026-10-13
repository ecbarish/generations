# Validation — ART-SF-HF1, 2026-10-13

- `node tools/run-all-checks.cjs`: **all 21 suites pass**, including the new asset-library integrity check. Game/browser/Godot checks retain their existing source and save behaviour.
- `node tools/check-asset-library.cjs`: 17 unique stable IDs, 15 source files, valid paths/hashes/dependencies/status and production-rights gate.
- Four negative fixtures rejected as expected: duplicate ID, generated reference falsely marked production, changed source hash, missing dependency.
- Starfall role workshop: 54 front/rear × colour/grey/silhouette × reference/portrait/tiny height × phone/desktop/ultrawide cases, all passing. Lineup and existing town context load; all three role images remain nonempty and equally sized; no page errors or horizontal overflow.
- Library browser: 15 filter/layout cases at 390, 1440 and 3440 widths. Zero assets falsely appear under Production. All preview images load before the recorded library capture.
- Stable local review snapshot serves the shared library, Starfall workshop and pending Wildbond three-stage workshop together; HTTP GET checks return 200. This is a local review hub, not a published release.

Machine-readable evidence: `browser-checks.json`, `library-checks.json` and `audit.json`. Captures: `capture-390.png`, `capture-1440.png`, `capture-3440.png` and `library-1440.png`.

These checks establish working review/library tooling and source integrity. They do not accept the generated illustrations as pixel sprites, rigs, animation or universal cross-engine-compatible assets.
