# Wildbond WB-C2 preview release

Claimed by dot / Adam, 2026-10-13. Source PR #279 merged as `c8fa1c8eb2105b32c1c387caa562c67317ede441`; game tree `2bd2ebab5fa157c9ac5a143a8308e7fd7da54afe`. Source checks: all 21 suites, Wildbond 1,612; all six rendered opening comparisons; map, door-input and WD3 reviews passed on 3980f9b.

## Scope and status

Pack-only build with official Godot 4.7.2. Preserve current index.js/index.wasm and HTML except the pack byte count. No gameplay edits, save-schema changes, storage-name changes or other-game exports. A short-lived Actions workflow token stages only the three release files on this guest branch. Exact committed bytes are reviewed afterward; no automatic main merge or deployment.

Public pack inspected at 13:42 UTC: SHA-256 `1abb288d5b50f1ccfbf4ae8b3f965d5103ffb2cb9f0804b68c9e882fca17b01b`, identical to Git's pack. The manifest still reports `6fe636cc62df6824be145acdbfaca002414ba5454fd5441833928fead2697048`, so metadata is stale; current CDN bytes are not divergent from Git. The actual pack's data equals source480dfc4; its compiled script includes key hints, but lacks CR1 scaling and CR4 cinematic identifiers and retains all56 old interior rows.

New release therefore includes the shorter opening plus already-merged creature sizes/tiers, evolution cinematic, newcomer healing/ranch guidance and HP-display fix, Saltmarsh Road/Moon Pool, and furnished Larkhaven rooms. Existing key hints remain. Adam approved this disclosed combined publication at 14:25 UTC. Publication remains gated on the complete exact-pack browser suite and live verification.

## Required evidence

- Exact merged source/game-tree, exporter version, committed release head and pack SHA/size.
- Existing browser legacy-save, workbench, fixture-free IndexedDB reload, settings, 60 door transitions and touch-pad assertions preserved.
- Fresh keyboard and phone opening through safe decline/reopen, selected partner, bond dialogue and returned movement.
- Frozen WB-C2 pre-change save and source regression evidence.
- Official Pages manifest plus all four file hashes; live browser behavior and actually loaded pack hash.

Measured source timing remains simulated at 60 Hz with fixed reading/choice budgets, not human novice or physical-device timing. Existing phone letterboxing is separate WB-C3 work. Repository rename continuity is not assumed from a source save test.

## Staged export

Build run [38407995978](https://github.com/ecbarish/generations/actions/runs/38407995978) committed only three preview files at `48a13e8cec83ecae02bd839748d118576a2cd96b`. Pack SHA-256 `e07fb136963268fee136c46fbc3b9b80ba89e0517b17b728392097453a214100`, 20,398,356 bytes. Author and committer verified as abarish-dev / 319211409+abarish-dev@users.noreply.github.com. Actual pack inspection validates all154 entry checksums, all three data JSON files against exact source, shortened opening text and CR1/CR4/interior tokens; the old pack fails this validator. Engine hashes unchanged. Exact committed browser review pending.

## First exported-browser run

Run [38408642351](https://github.com/ecbarish/generations/actions/runs/38408642351) stopped at the Maren/register OCR assertion. The captured native 1920×1080 image visibly contains the correct complete revised dialogue; the verifier downsampled its high-resolution browser font before OCR and misread it. Correcting the observer to crop native-resolution text; required phrases and matching tolerances are unchanged. This is a failed verification run, not a passed browser review. Exact pack bytes remain unchanged.

## Rename-continuity coverage

The automated local browser suite now also models the same-origin repository path change: actual prior pack at `/idle-arcade/play/wildbond/`, a real movement-triggered IndexedDB save, then fixture-free navigation to `/generations/play/wildbond/` with the new pack response hash checked. It must preserve team/ranch identities, possessions, progression and settings. Existing authored barn reload lands at its doorway (11,11), not the prior movement tile (11,10). This is a controlled same-origin path regression, not access to anyone’s existing browser data. Runtime result pending; all 16 validator positive/negative controls pass locally.

## Moving main and immutable release

Main advanced with CR5 and Little Ranch while the browser suite ran. Their source and documentation are preserved. This release remains fixed to c8fa1c8 / e07fb136; CR5 is deliberately not rebuilt into it. Default manifest verification still demands branch/source tree equality. The explicit verify-only pinned-artifact mode instead requires source ancestry, the fixed reviewed pack hash and byte count, the immutable source tree/data, unchanged engine/shell rules and all prior checksum assertions. The release workflow pins those constants; it cannot stage/export in this mode.

Second browser run38409932476 completed the entire desktop opening, partner identity, safe decline/reopen, heritage and harvest text, and regained movement. Phone reached the correct Follow Maren screen but tiny white guidance over scenery failed OCR. Screenshots confirm its presence; required text assertions are retained while improving observation. Complete browser verification is not yet passed.

## Ordinary phone input correction

Runs38413410612 (e560965) and38414028594 (7fcded5) passed the complete desktop opening and phone through the barn greeting. The latter transition failed correctly: screenshot shows Maren’s greeting still open. The verifier tapped the greeting’s `PanelContainer`, which consumes that touch before the existing unhandled-input dialogue advance. Use visibly empty world space outside panels and controls; preserve every caption and movement assertion. This is a test-input correction, not a game/pack change or a passed full suite. Aggregate checks are green on7fcded5.

Known existing phone limitation: tapping directly on some dialogue panels is consumed by UI and does not advance the conversation; tapping open world space does. This frozen release does not change that control behavior. Retain it for the separate WB-C3 phone-controls task, alongside the existing letterboxing.
