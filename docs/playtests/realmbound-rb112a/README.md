# RB1.12a: overlapping Thornvale requests

Draft PR #283, dot (Adam), 2026-10-13. Implements Cycle 1's existing round-2 feedback, not a new exploratory playtest.

## Scope and save contract

The engine already stores up to three active quest IDs and progresses every matching objective. The problem was the opening route: only Wolves starts automatically, and mine-clearing waited until candle recovery was turned in. Mine-clearing now opens alongside candles at level one. Later Foreman and Grizzlemaw prerequisites remain intact.

The arrival and optional road note explain the extra requests. The carried Journal shows a compact three-objective summary and Follow next controls; this reorders the existing active array and clears an explicit hunt override, without replacing a current encounter. Full slots are explained. Rewards, combat, gathering chance and quest counts are unchanged.

No save schema, key, version or migration changes. Old single-active arrays, progress, reward identities and completed records are preserved. Abandon/reaccept retains pre-generated rewards. Other zones and characters are covered by regression checks.

## Verification

- Claim baseline 79db673: normal Checks run 38403289021 passed.
- New tests: tests/realmbound-parallel-quests.js, included additively in tests/run.html. Covers concurrency, full slots, same-target progress, separate rewards, full bags, repeated completion, abandon/reaccept, v1/v2 saves, multiple characters, actual Journal click, cancel, five viewport widths.
- Existing Realmbound phone capture script additionally captures the opening Journal and Deputy Rhea at all six viewport/text settings, for both PR base and branch. Existing captures retained.
- Local Chromium fails before executing checks because its process-singleton socket is prohibited; the same result occurs with the escalation route. Actual-browser validation uses the repository's unchanged GitHub Actions workflows.
- Final commit Checks and phone-review results: pending. Screenshots: pending review.

No merge, release/version bump or deployment authorized.
