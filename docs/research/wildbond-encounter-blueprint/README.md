# WB-ENCOUNTER-BLUEPRINT

Claimed by Codex for Evan, 2026-10-18. Implements the approved planning increment: regional wild-level scaling, 18 original-bearing areas out of Claude's 33 ordinary encounter areas, all-area habitat/progression/readiness records, and four fully weighted opening encounter proposals. Stack on region audit #564.

Owned: docs/plans/wildbond-world/pokemon-encounters-v1.json and .md; tools/wildbond_encounter_plan.py; tools/test_wildbond_encounter_plan.py; this evidence report; a narrow discovery update in docs/WILDBOND-HANDOFF.md. No graph/gate corrections owned by other PRs, runtime encounters, species data, assets, profile schema, production exports or release changes.

Acceptance: validate IDs and references against the live graph/audit/catalogues/asset coverage, exact original allocation, every badge-stage level band and offset, fixed-area revisits, first-four weights and separate art/combat readiness. Record map dependencies and preserve old encounter plans.

## Result

[Review the blueprint](../../plans/wildbond-world/pokemon-encounters-v1.md) or [machine-readable proposal](../../plans/wildbond-world/pokemon-encounters-v1.json). It covers all 33 audited ordinary/ordinary+special areas, 18 original-bearing placements, 16 distinct existing originals and 73 total species candidates. The four opening tables are weighted; the other 29 pools deliberately have no invented weights. Starter species are excluded. No original design is commissioned or automatically art-approved by a proposed slot.

To reconcile the exact opening tables with Claude's optional 18-area allocation, the original slots move Thornwood Trail → Millgrass and Knothollow → Dewcut. Rootwater and Old Root Grove keep originals, all eight regions and a water route remain represented, and reused Seedpip/Brineskit habitats avoid extra design work. Bogsnap's 8% rarity preserves the intended discovery; no evolution-placement decision is made.

The pure [level evaluator and validator](../../../tools/wildbond_encounter_plan.py) reads the current cap table and evaluates all nine badge stages. It has no profile input, runtime hook, encounter RNG or save writes. Fixed early bands remain the same on return; regional bands are cap−13 to cap−5 plus −2/0/+3, clamped to [2, cap]. Special-only sites/Glassfall are rejected as ordinary-pool queries. Level resolution is a proposed encounter-start operation; no caught creature, active battle, trainer or guardian has been rescaled.

Source hashes pin the graph, audit and library coverage used for this proposal. Text hashes normalize CRLF to LF so Windows and Linux checkouts agree; content changes still require reconciliation. Validation reads current original/evolution records, the chapter's explicit ALL_IDS and actual art coverage; asset availability never implies supported combat. All 57 Pokémon candidates have verified private world/battle sets awaiting scene review; only Pidgey, Vulpix and Wooper among these candidates are currently supported in the chapter. All 16 proposed originals need chapter catalogue integration; Bogsnap has approved-design animation candidates, and the others need redesign/art review. The current selectable original starters are unaffected and remain outside wild pools.

## Verification

- **20 new encounter tests**, plus **162 existing region-audit/world-plan tests** pass: 182 total, including negative fixtures for bad IDs/areas, duplicate JSON keys, nonfinite/invalid weights, forbidden starters/guardians, source drift, false readiness, changed allocation flags and saved-creature policy. A cross-platform regression verifies LF/CRLF provenance equivalence without masking content changes.
- Every area is checked at each of the nine badge stages (297 area/stage evaluations); all offsets and fixed revisits are exercised. These are planning arithmetic checks, not a human balance/fun assessment.
- The generated Markdown must exactly match the data/render function. Default validator invocation reads only; `--render` explicitly writes its owned companion document.
- All **28 repository suites pass**, including Wildbond 26,976/0, Starfall 488/0, the 189-species original catalogue, 23 unchanged save names and 21 agent-context checks. All **29 local documentation links** and whitespace checks pass. Committed export-freshness evidence is recorded in the PR self-check. No game UI changed, so there is no new gameplay screenshot or claimed playtest.

Repeat:

```powershell
python -B tools/wildbond_encounter_plan.py
python -B -m unittest tools/test_wildbond_encounter_plan.py tools/test_wildbond_region_audit.py tools/test_wildbond_world_graph.py tools/test_wildbond_world_gates.py tools/test_wildbond_world_knothollow.py tools/test_wildbond_world_answering.py tools/test_wildbond_world_route_encounters.py tools/test_wildbond_world_errands.py
```

## Dependencies and next increment

RA-03 Orchard Fen rope, RA-04 Answering Ways connection (existing #523), RA-05 temporary League access, unresolved arrival tiles and the first Grove Wake loop remain with their existing owners. The audited first-reach values are explicitly historical snapshots that include known gaps, not proof those gates are implemented. No graph, old encounter table, map/cave brief, lore ledger or production game file was edited.

The next playable destination remains Thornwood town with Isolde and healing, followed by the first badge/Grove Wake loop. Before wiring encounters, resolve location ownership and arrivals, approve the selected art and import bounded combat data while preserving old records. This task does not activate 73 species, finish the other 29 weighted tables, approve new habitat lore or claim a published build. Independent review and remote CI remain separate from local verification; only Generations Reviewer merges.
