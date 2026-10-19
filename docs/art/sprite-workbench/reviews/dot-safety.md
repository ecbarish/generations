# Workbench draft/export safety review

**WB-GUEST-WORKBENCH-SAFETY · dot for Adam · 2026-10-19**

## Result

**Changes are needed before the documented source-preservation and round-trip guarantees hold for all accepted inputs.** A disposable reproduction shows a draft temporary-file collision removing its active source manifest. Six other validation/data-integrity defect families are reproduced below.

This is an independent test/report handoff for Codex, not a backend fix or approval to merge. The [routing clearance](https://github.com/ecbarish/generations/issues/373#issuecomment-6258774707) owns only this report and [the standalone test](../../../../tools/sprite-workbench/reviews/dot-safety.gd). [Draft PR #579](https://github.com/ecbarish/generations/pull/579) targets the feature branch, not main.

- **Tested production source:** #576 `a9ef87fc38f7290f98e7ae61175216834a729bf5`.
- **Engine actually used:** Linux Godot `4.6.3.stable.official.7d41c59c4`, headless. The README requests 4.7.2; that version and the graphical workflow were **not** tested here.
- **Final standalone result:** **170 passed, 24 failed**, exit **1**. The failures are intentional regression assertions exposing seven defect families, not 24 independent bugs and not an all-green result. Two malformed-input cases also emit `SCRIPT ERROR` at unchanged `session.gd:70`.
- **Inputs:** generated synthetic 16×8 and 509×1 PNGs plus synthetic JSON. No real art, original repository inputs, private packs or player saves are opened or modified. Only specifically labeled disposable copies are mutated in the stale-source and collision probes.
- **State-retention coverage:** entries, original measurements, pixel overrides, source path/hash, dirty flag, undo/redo, source image bytes/identity and cached native bytes/root/texture identity. A rejected load may change its explanatory `issue`.
- **Scope:** no editor/backend, CI, asset, schema, shared, COMMS/START-HERE, version, pack/export installation, merge or game-publication changes.

## Run it

From a checkout containing the test and the pinned workbench source:

```sh
godot --version
godot --headless --path tools/sprite-workbench --script res://reviews/dot-safety.gd
```

Exact Linux invocation used:

```sh
mkdir -p /tmp/dot-wb-safety-cache /tmp/dot-wb-safety-data
XDG_CACHE_HOME=/tmp/dot-wb-safety-cache \
XDG_DATA_HOME=/tmp/dot-wb-safety-data \
godot --headless --path tools/sprite-workbench \
  --script res://reviews/dot-safety.gd
```

Every run creates `user://dot-safety-<process-id>-<ticks>` in the separate Sprite Workbench application-data directory. It prints that absolute directory for inspection and leaves it as disposable evidence. It never reads a game profile, deletes another run, installs outputs or accesses a network. New runs do not depend on earlier run files.

Exact source identity was checked before/after execution:

| File | Git blob | SHA-256 |
| --- | --- | --- |
| `session.gd` | `4fcb60b8b8ecb9ee715491536a410cf9950c8670` | `c5dfe4fa05579141f0ab3dcb7a62754c57d78891e99d70c880f3af42d1f9643f` |
| `checks.gd` | `5e63bf0c77af0b450ad68bffa6825750e1869341` | `6f86047905c979ba6453c724d3fbd921df102c331f79fe85afc5a67ab4cc4e6b` |
| New `reviews/dot-safety.gd` | See PR head | `8be25ebd3e4fd4bdea3e538306fe10e4ea56b3a0b038979e33b0e498e5dd3e34` |

## Reproducible findings

### F1 · High data-integrity consequence: draft sidecar can remove the active source manifest

**Reproduction is backend-only and uses fresh disposable copies.** The test's `source_sidecar_case()`:

1. Writes a valid synthetic manifest to `<scratch>/sidecar-collision/target.json.tmp` and a separate synthetic `source.png`.
2. Calls `load_manifest(".../target.json.tmp")`; it succeeds. No manifest-extension check applies.
3. Adds a pixel edit and calls `save_draft(".../target.json")`.
4. Save returns true, dirty becomes false, and `target.json.tmp` no longer exists. `target.json` now contains the draft whose source reference points at the missing original manifest.

The destination guard compares only `path` with `source_path`. The next step opens `path + ".tmp"` for writing, then renames it to `path`. Here that temporary path **is the active source**, so the original manifest is overwritten and moved. [Source: save_draft, lines 152–164](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/tools/sprite-workbench/session.gd#L152-L164).

Observed: `source-sidecar save=true source still exists=false dirty=false`.

This requires the nonstandard source filename in the reproduction. The normal UI file picker filters `*.json`; this review does **not** claim that the ordinary picker exposes a `.tmp` file or that a user reproduced it through the GUI. Draft source references are another backend entry path. No symlink/hardlink attack, arbitrary file access, privilege escalation or real-source loss was tested. The narrower confirmed defect is violation of source preservation by an accepted backend path.

### F2 · High robustness consequence: oversized JSON regions wrap through Rect2i

In the 16×8 synthetic source, `geometry_cases()` imports each region with explicit step 1:

- `[4294967296, 0, 8, 8]`
- `[0, 0, 4294967304, 8]`

Both imports return true, clear pending edit/history state, and leave no issue. The constructor narrows components to a 32-bit `Rect2i` before checking containment. The width limit likewise uses that narrowed rectangle, while the accepted dictionary retains the original huge values. [Source: valid_frame, lines 34–44](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/tools/sprite-workbench/session.gd#L34-L44).

Rendering later reads the raw region values at [lines 124–143](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/tools/sprite-workbench/session.gd#L124-L143). **The test deliberately does not render the huge accepted frame**, avoiding large allocations/out-of-range reads. Acceptance and loss of the previous working session are confirmed; memory exhaustion or a crash is not claimed.

### F3 · Medium: a changed PNG can be saved as an unreloadable clean draft

`identity_and_hash_cases()` loads a disposable source copy, paints, changes only that copy's PNG and saves a new draft. The manifest bytes stay unchanged.

Observed: `saved=true dirty=false reload=false`; reopening says `Source hash changed: test_creature. Remeasure deliberately before importing.` Export correctly refuses the same changed source. The save gate checks only the manifest digest, whereas export checks all source PNGs. [Save: lines 152–164](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/tools/sprite-workbench/session.gd#L152-L164); [export: lines 203–208](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/tools/sprite-workbench/session.gd#L203-L208).

This contradicts the documented “source changes block save/export” contract and removes the unsaved-change signal while persisting a draft that cannot reopen against current inputs.

### F4 · Medium: missing-step inference errors before validation

Remove `sample_step` from the first synthetic frame, then set either `region=[]` or `ink=[]`. Import returns false-like and retains the previous state, but emits an invalid-array-index `SCRIPT ERROR` and leaves `issue` empty.

The default-step code indexes `ref.region[2]`, `ref.region[3]` and `ink[3]` before calling `valid_frame`. [Source: lines 65–72](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/tools/sprite-workbench/session.gd#L65-L72).

The test checks for an explanatory error as well as rejection/state retention, so an aborted function does not count as safe validation. Two failures represent two variants of this one defect family.

### F5 · Medium: accepted aliases silently drop pixel edits

A draft with frame key `test_creature:00`, `test_creature:+0`, or `test_creature:-0` loads successfully but stores the key verbatim. The renderer asks for `test_creature:0`. Likewise coordinates `00,0`, `+0,0`, `-0,0`, and `0,00` pass validation but do not match canonical `0,0`.

All seven variants are tested with a known root pixel whose original palette index differs from the requested paint. A load must either reject the alias or normalize it and apply the edit. On the baseline it does neither. [Validation/storage: lines 187–202](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/tools/sprite-workbench/session.gd#L187-L202); [lookup: lines 124–139](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/tools/sprite-workbench/session.gd#L124-L139).

### F6 · Medium: accepted wide frame exports an atlas that cannot reimport

One 509×1 frame with region `[0,0,509,1]`, anchor `[254,1]`, step 1 and an ordinary opaque palette imports successfully. Export succeeds and emits a 513×5 padded cell at step 1. Reimport fails with `Invalid bounds, anchor or sampling step: test_creature frame 0`.

The importer caps native dimensions at 512; export adds four pixels of padding and only tests the entire atlas against 4096. [Importer: lines 34–44](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/tools/sprite-workbench/session.gd#L34-L44); [export: lines 209–221](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/tools/sprite-workbench/session.gd#L209-L221).

### F7 · Medium: accepted palette alpha changes on export/reimport

Set one of the sixteen palette strings to `657b3180`; it is valid HTML color syntax and imports. Paint a root pixel with that index, export and render the reimported measurements.

Observed RGBA: `(0.3961, 0.4824, 0.1922, 0.502)` before, `(0.3961, 0.4824, 0.1922, 1.0)` after. This violates both documented binary alpha and exact reimport pixel identity. Palette validation accepts alpha; export serializes each color with `to_html(false)`, dropping it. [Validation: lines 73–76](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/tools/sprite-workbench/session.gd#L73-L76); [rendering: lines 132–149](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/tools/sprite-workbench/session.gd#L132-L149); [serialization: lines 226–229](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/tools/sprite-workbench/session.gd#L226-L229).

## What passes and what this adds

The existing [checks.gd](https://github.com/ecbarish/generations/blob/a9ef87fc38f7290f98e7ae61175216834a729bf5/tools/sprite-workbench/checks.gd) already tests ordinary painting/undo/redo, backed-up and portable drafts, future schema, one bad geometry draft, stale source rejection, actual original art, atlas blits, editable exports and UI workflows. It is unchanged.

The new test focuses on missing adversarial partitions and stronger assertions:

| Area | Actual result |
| --- | --- |
| Missing/negative/out-of-range/noninteger frame IDs; malformed coordinate syntax and coordinates outside ±512; invalid/noninteger/nonnumber palette indices; wrong edit-map types | Rejected with explanation and complete prior state retained |
| Ordinary negative/out-of-bounds/zero/fractional/mistyped regions; malformed/out-of-bounds anchors; invalid sample steps | Rejected with explanation and complete prior state retained |
| Changed draft palette/height/provenance; stale manifest/PNG digests; relative traversal, absolute PNG and backslash references | Rejected with explanation and complete prior state retained |
| PNG changed after load | Export refuses; draft save fails the promised guard (F3) |
| Fractional anchors, nonunit sampling, paint and erase | Normal export/reimport retains every native RGBA pixel and root with transparent padding; the reimport contains the entire original native frame |
| Normal metadata/draft/export identity | Palette, provenance, height, frame order, atlas hash/source hash, unit output sampling and edit-session overrides preserved; repeat export gets a new folder with identical PNG bytes and metadata |
| Immutable baseline synthetic inputs | Manifest and PNG hashes unchanged at end |
| Adversarial cases F1–F7 | Reproduced; 24 regression assertions fail |

No existing assertion was removed, weakened or marked as an expected pass. The new script exits 1 while these defects remain. It is intentionally **not** wired into CI by this review.

## Top three actions for the owning implementation

1. **Protect source identity through the entire write transaction.** Guard destination, temporary and backup paths against active inputs before opening anything; leave current edits dirty on failure. Verify PNG hashes as well as the manifest before saving. Prioritize F1's source-loss consequence, then F3's unreopenable drafts.
2. **Validate and canonicalize before mutating session state.** Check raw numeric bounds before narrowing to Rect2i, validate every dependency before default-step inference, and reject or canonicalize override keys without alias collisions. Add clean-error/full-state-retention regressions for F2, F4 and F5.
3. **Make accepted import/export contracts closed under reimport.** Account for native sampling and export padding against reader bounds, and explicitly reject/normalize unsupported palette alpha or retain the promised RGBA semantics. Re-render the reopened export, not only compare atlas blits (F6 and F7).

These are proposed fixes for Codex; none is implemented here.

## Verification limits and handoff

- Independent read-only review checked both unchanged production source and the standalone harness. The test adds no player-facing scene or artwork, so no screenshot/fun/art acceptance is claimed.
- The unchanged graphical `checks.gd`, full repository aggregate, real-family/base PNG suite, native GUI dialogs/pointer interactions, Windows filesystem behavior, 4.7.2 compatibility, symlink/hardlink aliases, decoder allocation limits and filesystem races were **not run**. The available shell has no display or Xvfb.
- The report establishes specific bounded robustness/data-integrity defects. It does not establish arbitrary code execution, a privilege boundary escape, or access to a player save.
- Local source/test hash checks and scoped diff whitespace checks are separate from remote CI. PR Tower/comments track CI for the exact final report/test head; a green existing workflow would not negate these intentionally failing standalone assertions.
- The original pause remains outside the explicitly cleared tasks. This task's question is answered by the reproductions and three bounded actions; no backend repair, unrelated investigation, merge or release follows from this report.
