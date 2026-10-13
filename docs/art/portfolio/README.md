# Creature design-language portfolio

Open [the visual journal](index.html). It starts with the three Wildbond starter families and records 17 studies from the existing reference packets. Every card points to the original image, its pinned Git revision and prompt provenance. Compressed historical previews remain stable even as later working files evolve. Family navigation is generated from the manifest.

**Two axes:** design history shows how our ideas changed during development; three life stages show the reference round's base/middle/final proposal. Earlier/latest payoff compares two ideas for the same intended endpoint, not a baby with an adult. Dates and sequence describe the recorded reference packets; this is not a release or shipped-game timeline.

## Add another family or revision

1. Append a stable entry ID to history.json with source path/hash/pinned Git commit, compact preview, date/within-family sequence, stage label, what changed, why, and provenance.
2. Preserve earlier entries. Use reference, alternative, superseded, candidate or approved-direction honestly. Approved-direction needs a linked recorded owner decision; it never means production-ready.
3. Update the family's earlier/latest comparison and three-stage references deliberately. Names describe the recorded round; do not silently rewrite historical files when canon changes.
4. Preview images are derived WebP at up to 768px, each below 300 KB. Original source images are linked, not duplicated. Keep full-size future originals outside Git as the art intake policy requests.
5. Review history, comparison and life-stage views on phone, desktop and ultrawide. Confirm all original/provenance links, image hashes and approval scope.

The current fire-crown approval is recorded in ../wildbond-higgsfield-pilot/STARTER-STAGES.md. Other family payoffs await approval. Generated rights remain unverified, as in their source packets; these are design references.

## The next chapters

Add other creature families when we have real revisions, then connect approved pixel/painted/3D representations through stable species/asset IDs. No sheet supplies a mesh or animation merely by existing.

For a later adventurer chapter, keep Evan's 2026-10-13 feedback: he likes the paired three-class concept models, and dislikes the white-haired stock 3D prototypes. Those prototypes prove technical bindings; they are not the accepted visual target. Record rejected/superseded directions without rewriting the actual development history.

## Verification

`node docs/art/portfolio/checks.cjs <served repo origin>`: 211 source/status/browser checks pass, including 27 family/mode/viewport combinations at 390, 1440 and 3440px. Source hashes and provenance files match; approved-direction has its recorded decision source; image previews stay below 300 KB each. No local-save writes. Missing-manifest recovery is checked. Captures use compressed WebP (ultrawide capture reduced for storage).

Seventeen 768px preview files total 1,517,958 bytes; source PNGs are linked in place. No new generation or credits. Approval scope and candidate corrections are visible in every view.

Aggregate verification after merging main 4c5b74a (2026-10-13): **21 of 22 suites pass**. The unchanged Little Ranch check `Left alone, the berries glow (the hint)` still fails. Both Godot suites pass (Wildbond 1,643; Starfall 272), as do the catalogue/save/asset/context checks. Portfolio verification remains 211 checks and 27 responsive views. No game code or assertion changed here.
