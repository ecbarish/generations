# Validation — ART-SF-HF1, 2026-10-13

- `node tools/run-all-checks.cjs`: **all 21 suites pass**, including the new asset-library integrity check. Game/browser/Godot checks retain their existing source and save behaviour.
- `node tools/check-asset-library.cjs`: 17 unique stable IDs, 15 source files, valid paths/hashes/dependencies/status and production-rights gate.
- Four negative fixtures rejected as expected: duplicate ID, generated reference falsely marked production, changed source hash, missing dependency.
- Starfall role workshop: 54 front/rear × colour/grey/silhouette × reference/portrait/tiny height × phone/desktop/ultrawide cases, all passing. Lineup and existing town context load; all three role images remain nonempty and equally sized; no page errors or horizontal overflow.
- Library browser: 15 filter/layout cases at 390, 1440 and 3440 widths. Zero assets falsely appear under Production. All preview images load before the recorded library capture.
- Stable local review snapshot serves the shared library, Starfall workshop and pending Wildbond three-stage workshop together; HTTP GET checks return 200. This is a local review hub, not a published release.

Machine-readable evidence: `browser-checks.json`, `library-checks.json` and `audit.json`. Captures: `capture-390.png`, `capture-1440.png`, `capture-3440.png` and `library-1440.png`.

These checks establish working review/library tooling and source integrity. They do not accept the generated illustrations as pixel sprites, rigs, animation or universal cross-engine-compatible assets.

## Paired body intake (2026-10-13)

Registry expanded to 22 IDs with female base, travel and ranger GLBs and two adult body reference sheets. Six male/female GLB containers have valid headers, embedded resources, bounded buffer views, meshes and skins; exact skeleton names are recorded in shared/assets/characters/quaternius/intake-checks.json. This is source integrity evidence, not animation or gear-fit acceptance.

Updated library: 15 filter/layout cases pass; four invalid fixtures rejected. Paired-body page loads both images without horizontal overflow at 390, 1440 and 3440px; evidence in body-browser-checks.json and bodies-1440.png. Images inspected: opaque painted backgrounds and different collar tailoring remain corrections. PNGs are references, separate from CC0 source meshes. No game loader or Godot file changed.
