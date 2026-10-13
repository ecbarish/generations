# Starfall Guild browser fixes (SG-N1)

## What changed

Recovery now offers the existing single-level training purchase and one-floor retreat inside the scene. Training keeps the normal cost, ignores the bulk-buy setting, and does not heal or shorten recovery. Retreat keeps the existing rule: stop pushing and move one floor up. Unaffordable training and retreat at floor one are disabled. The prompt disappears when recovery finishes. Nothing new is automated.

The confirmed Ledger bug: advance() returned before adding time while a region choice was waiting. It now counts those seconds while leaving combat, income, staff and board refresh paused. The same path counts delayed/offline catch-up, retaining the existing one-day cap and granting no rewards during the choice. Invalid elapsed durations are ignored. Existing saved totals are preserved; previously missed time cannot be reconstructed. The existing counter includes away time; this patch preserves that convention rather than redefining or resetting it. This reproduces one undercount path; it does not prove why Flint's entire session undercounted.

## Validation

- All 20 suites pass. Starfall browser: 58 checks, including ten new; original split, sound and old-save checks preserved.
- Eight failures reproduced with original game scripts from main ee4f7d7: absent in-scene recovery actions and two minutes of region-choice time missing at each size (baseline.json).
- 26 browser checks pass (results.json): actual buttons, normal training price, no instant healing, retreat, normal recovery completion, Ledger display, a real boot interval during the choice, and actual save/reload.
- Eight screenshots at phone 375×812, laptop 1366×768, desktop 1920×1080 and ultrawide 3440×1440. Phone is emulation. Recovery text scales up for large screens.

Run with the own-clone serve.ps1 server at localhost:8777 and Playwright available in NODE_PATH:

`node docs/playtests/starfall-sg-n1/browser-checks.cjs`

BASELINE=1 loads the old scripts. The four-size fixture checks stop the game's intervals and drive advance() deliberately, then use real clicks; the final fresh browser context leaves the actual boot timer running. Saves are isolated from personal data.

## Scope

Browser Classic only. No Godot or shared-system edits, new save fields, version bumps, early staff hire, new combat system or content. The classic dashboard layout remains; the new preparation actions are inside the scene. This is the written SG-N1 reported-bugs task while Lane P reconciles the approved studio cycle.
