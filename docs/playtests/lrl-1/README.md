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
- Exact implementation head `382ff23dfbcb44d33c42fcffc2681093197c025b`: [aggregate CI](https://github.com/ecbarish/generations/actions/runs/38626698336) **all 28 suites pass**, including **465 Little Ranch assertions**.
- [Browser review CI](https://github.com/ecbarish/generations/actions/runs/38626698629): **274 review checks pass; 96 screenshots**, including two complete 465-assertion Little Ranch runs. Existing muted sound preference and an unrelated saved level survive both runs and reload. The new scenarios produce no local/session storage writes. Little Ranch has no saved visit to migrate.
- [Persisted browser report](browser-report-382ff23.json) and [provenance/hash manifest](evidence-manifest.json). The full [CI artifact](https://github.com/ecbarish/generations/actions/runs/38626698629/artifacts/11923938872) expires on 2026-10-28; selected original captures remain below.
- Independent code review found no outstanding issue. It confirmed the prior assertions are retained; clock instrumentation starts only after every original review scenario. Adversarial held/late-event and natural-completion model checks were also reviewed.

New browser scenarios stop the production animation loop after the original review, advance only through the existing test clock, use real pointer input/resize events, and label this accelerated QA. They add 259 checks and 80 captures across five sizes, with the normal bedtime routine enabled. This tests the transitions and controls, not wall-clock pacing. Sound is muted by the preserved preference; lullaby scheduling is checked in state, not by listening.

Local Chromium could not launch in the execution sandbox. The browser results above are from GitHub CI's Chromium, not the user's browser or phone. Screenshots were inspected across all five room/size matrices and held/rotated cases: the toy is replaced by the ranch/yawn/toothbrush, followed by both babies asleep, without blank scenes or a stale room overlay. Physical touch ergonomics and perceived gentleness remain unconfirmed.

### Retained screenshots

These retained captures document the original repair at `382ff23d`, before the later LR-LAYOUT-1 merge (#424). The refreshed branch preserves that layout work. Current-head CI captures and verification are linked from the PR self-check; these historical images are not presented as the refreshed layout. The manifest hashes the original PNG bytes. The contact sheet is resized and labelled for overview only.

- [All five rooms, portrait before / bedtime / asleep](screenshots/contact-375x812.jpg)
- Dough Table, 375×812: [unfinished](screenshots/lrl1-dough-375x812-before.png), [automatic bedtime](screenshots/lrl1-dough-375x812-dusk.png), [asleep after the routine](screenshots/lrl1-dough-375x812-asleep.png)
- [Held gesture, rotation and late release at 667×375](screenshots/lrl1-dough-rotated-late-release.png)
- [Shed return at 1024×768](screenshots/lrl1-shed-1024x768-dusk.png)
- [Wagon visit asleep at 3440×1440](screenshots/lrl1-wagon-3440x1440-asleep.png)

## Acceptance still required

Playtester or Evan must confirm a newcomer reaches bedtime without help and that the transition feels gentle. No fun score, physical-phone/toddler session or launch acceptance is inferred from automated checks. LRL-2/LRL-3/LRL-4 are not marked complete here. Generations Reviewer alone merges; this work does not publish or deploy a build.
