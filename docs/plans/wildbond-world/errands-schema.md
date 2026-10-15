# Wildbond errand data contract (WBW-1)

## Scope and source

`errands.json` transcribes the ten errands in [world design §3](../wildbond-world-design.md#3-town-stories-the-banner-and-the-errand-list). It is proposed data for the later loader, field-book log and WB-WORLD-7 dialogue. Nothing reads it in the game today. This task adds no scene, dialogue, canon clue placement, map, reward payout, save field, art or export. The future dialogue phase records clues in the lore ledger; the banner and Maren's directions remain the main road.

The validator is a standalone Python unittest, using the standard library only. From the repository root:

    python3 -m unittest tools/test_wildbond_world_errands.py
    python3 tools/wildbond-export-freshness.py --base origin/main --head HEAD

Normal CI remains unchanged. These new unittests are not automatically included in that CI run; their output belongs in the PR alongside normal CI results.

## Shape

The root contains exactly `schemaVersion: 1` and `errands`, in design-table order. There is no `quests` object or replacement save document. Every errand has:

- `id`: the exact `sq-…` ID in the design. The resulting key intentionally begins `sq:sq-…`; do not remove the second `sq`.
- `town`: display `name` and a current `map` anchoring the errand. New town names preserve region map IDs: Warmstep is `emberfall`, Highlatch `cloudglass`, Reedhold `stillreed`, Bellstep `hollowecho`, Threadmeet `sunthread`, and The High Watch `farwatch`. Tobin remains on `saltmarsh_route`; his town label is Lantern Quay, rather than relocating him into its inn.
- `giver`: an existing `CAST` ID, or Nora's existing home ID `pip_gran`. Orla is the named giver for the Spire reflection; the league regulars are an unresolved group rather than fabricated people or a silent substitution of `SPIRE_REGULARS`.
- `requires`: four arrays, `badges`, `fields`, `maps`, `story`. Each is an AND of prerequisites. Badge values use `BADGES` IDs; fields are the seven design `field:*` lesson keys. `story` can only use the already-existing `leagueEnding` key, for the after-ending Spire errand.
- `log`: a proposed player-facing objective, 1–120 Unicode code points, one line. This is log copy, never character dialogue.
- `storyKeys`: `heard`, `step`, `done`, each exactly `sq:<id>:<phase>`.
- `steps`: ordered milestones. Each has `kind`, `log`, `locations`, `actors`, `requires`, and `write`. Optional typed detail is `object`, `subject`, `count`, `group`, or `cargo`. These descriptions are not a runtime event dispatcher or an executable collection predicate.
- `rewards`: a dictionary limited to `lures`, `coins`, and `berries`, with positive integer quantities when specified. All ten are currently empty: §3 does not choose payouts. WB-WORLD-7 can propose amounts without adding bag keys. The physical bird, shell, stone and passing-along objects are story props, never bag entries or creatures to trade.

Gates apply separately to hearing and individual steps. `maps` means the named map exists and is reachable in the world phase; it does not request new visited-map save flags. Step gates do not replace environmental collision, current-team readiness or the eventual field-lesson rules. In particular, Nora's first room does not need Stone Break or Loom; Tobin's pier does not need Tide Ride; and Ilka's rope scene precedes learning Glide. The Vessa lesson must use the existing design's partner readiness and teaching scene, not award `field:glide` from an errand write.

A location is exactly `{ "map": "…" }` for an existing or explicitly named planned machine ID, or `{ "place": "…" }` for a design-named place whose map ID is not assigned. Only `Lantern Quay` and `Outer Shoal` use the latter. Section 2 names both but does not specify machine IDs. They are unresolved references, not new map IDs; the integrating phase must resolve them before enabling the relevant objective. No coordinates, occupants or runtime identifiers are invented here.

## Progress contract and save compatibility

This file proposes a linear checkpoint contract inside the existing `story` dictionary:

1. The first `hear` step writes `heard: true` once.
2. Middle milestones write `step: 1`, `2`, and so on, meaning that many middle milestones have completed. Absent means zero. This one counter handles Halen's list without separate inventory or per-item keys.
3. The final milestone writes `done: true`. Rewards, if later chosen, are granted only on the first transition to done; repeating a conversation cannot pay twice.

`heard` and `done` are presence flags. Never store them as false: existing story checks use `.has()`. The `step` key is the only numeric value proposed here; it is not an existing game feature. `main.gd` writes `story_done` unchanged in `_save`, loads it unchanged in `_load_game`, and `safe_save.gd` serializes JSON, so the counter fits that dictionary without a new top-level key or version bump. The future consumer must normalize a valid integral JSON number and reject fractional, negative or out-of-range checkpoints; it must not treat merely having `:step` as completion.

The writer must preserve all unrelated story keys and old saves. A missing set of errand keys leaves every errand unheard. A completed middle milestone is durable, but a partially completed compound milestone is not tracked here. Tobin's count target and the identities/placement of the league regulars are unspecified in §3; these remain scene-author decisions, not invented thresholds or actors. Hearing, advancing and completion still require future gameplay tests, including save/reload and idempotent rewards. This data validator does not claim those tests passed in the game.

## The passing-along and placeholders

The nine cargo entries follow the table's order: Nora's thread, Bram's dried mushroom, Perrin's quay knot, Sela's warm nail, Ilka's rope splice, Juna's reed bundle, Veslin's spare echo stone, Mirel's ribbon, and Delka's corrected chart. Each carry joins its source town to the next listed recipient; Delka's chart returns to Halen for the final knot. All named current actors are checked against `CAST` plus `pip_gran`.

Perrin and Juna are proposed keepers absent from `CAST`. Their outgoing items have `placeholder: true` and a null `from` with `fromPlaceholder`; incoming items have a null `to` with `toPlaceholder`. No `perrin`/`juna` actor or bag key is minted. Their item names come from the design but remain placeholders, not approved dialogue or implemented rewards. The future wiring must resolve these two handoffs; this does not block the data-only row.

## Fidelity notes for the world owner

- Lowbell explicitly ends at Veslin in Bellstep, despite §3's later summary saying only the passing-along crosses towns. The specific Lowbell row wins in this data; it is not redirected back to Olan or changed into a guardian encounter.
- Isolde's errand uses Knothollow's Thorn entrance. Bram is not silently placed behind a Stone Break crack. Sela's stone is explicitly beyond Lantern. Senna's third stone explicitly needs Hush; no extra Lantern prerequisite is invented without a placement.
- The Spire requires `leagueEnding`; nothing depends on finishing it. It names no new truth and awards nothing.
- Every log keeps the work local and descriptive. The hum, faded tally, warm stones and other mysteries are not explained by this data. Character dialogue and lore-ledger placement remain with WB-WORLD-7.

## Validation

`validate_document` checks exact shape, IDs/order, current actor and badge references, current/planned map references, unresolved named-place allowlist, gates, short logs, only owned `sq:` keys, linear writes, typed details, and the nine placeholder-safe cargo handoffs. The tests also compare key design facts independently: exact givers/towns, lesson timing, three echo stones, two skiff crews, after-ending reflection and no prerequisites that would lock the early bird or fishing behind later lessons. Malformed fixtures exercise nested types, duplicate keys, non-finite JSON numbers, reference errors, placeholder substitution, invalid state writes and forbidden reward/save fields.
