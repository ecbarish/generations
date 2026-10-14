# LRL-1: a first visit reaches bedtime

## Reproduced problem

On v0.18.0, the shared visit clock kept advancing in the Paint Shed, Little Wagon, Snack Kitchen, Busy Barn Door and Dough Table, but each place returned from `update()` before the bedtime check. An unfinished toy could stay in daytime indefinitely. The accepted design says bedtime comes from every place; finding the barn or completing a toy must not be required.

- Read-only baseline `c0d55bc85312c4061aa08278a261cdafae514f1e`: all five unfinished places remain daytime after 660 simulated seconds at six sizes. The same game bytes were investigated at `002ea91` before the checklist landed.
- Published build observed in a cloud browser on 2026-10-14: the Dough Table remained daytime after seven wall-clock minutes. Tapping its barn immediately started the yawn/toothbrush routine; both babies subsequently slept. This observation is supplementary, not an exact-commit or real-phone attestation.
- Repeated flower taps could also keep the baby busy indefinitely after the day was due to end.

## Repair

The original twelve-activity/six-minute bedtime threshold is unchanged. Its check now runs before the place-specific updates. A short motion or held gesture can settle for at most six further seconds; repeated taps cannot extend that grace period.

The baby returns home without a completion award for an unfinished toy, then follows the existing yawn, teeth, water, goodnights and lullaby. A completion already in progress still counts once. Old movement callbacks and pointer/sponge gestures are cleared so a late release cannot affect the old place or replace bedtime with a meal. The existing wake-up taps start a fresh day.

No visible countdown, new place, new artwork, save-format change, sound preference change or version bump. Held LR19–LR22 changes are not included.

## Test fixture repair

The grown-up-panel test emitted a synthetic lock `pointerdown` followed by `pointerup` on the panel, leaving the lock's held-pointer animation alive. It could reopen the panel after a later close, correctly suppressing the kitchen hint and causing an intermittent unrelated failure. The fixture now explicitly ends that synthetic hold. All prior assertions remain.

## Checks and evidence

- `node docs/playtests/lrl-1/model-checks.cjs`: **122 deterministic logic checks pass**, including a baseline-before/repair-after comparison, six layouts, late room entry, frozen ranch actions, natural completions, continuous flower play, held/late pointer events, reset and stored data. DOM, canvas and audio are stubbed; this does not establish browser or phone usability.
- `node --check games/little-ranch/game.js`: passes.
- `node tools/run-all-checks.cjs`: required aggregate, pending exact-head CI.
- `node tools/playtest/little-ranch-review.cjs`: required browser review, pending exact-head CI. The existing workflow uploads `little-ranch-browser-review` with screenshots and `report.json`. New scenarios stop the production animation loop after the original review, advance only through the existing test clock, use real pointer input/resize events, and label this accelerated QA. They add 259 checks and 80 captures; the original review cases remain unchanged.

Local Chromium cannot launch in the current execution sandbox (`socket() failed: Operation not permitted`); the approved escalation failed before launch. Browser and aggregate results must therefore come from the exact-head CI runs, with screenshots inspected before handoff. A published-site check is not substituted for the modified branch.

## Acceptance still required

Playtester or Evan must confirm a newcomer reaches bedtime without help and that the transition feels gentle. No fun score, physical-phone/toddler session or launch acceptance is inferred from automated checks. LRL-2/LRL-3/LRL-4 are not marked complete here. Generations Reviewer alone merges; this work does not publish or deploy a build.
