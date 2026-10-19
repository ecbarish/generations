# WB-GUEST-COORD-GUARD

Claimed by dot for Adam on 2026-10-19, before implementation. Owner routing: https://github.com/ecbarish/generations/issues/373#issuecomment-6267258938.

Exact base: #581 `288e07486a79ee2c5813ef7bdab652ba31d03272`, branch `codex/wildbond-workbench-safety-fixes`.

Own only coordinate validation in `tools/sprite-workbench/session.gd`, the new standalone `tools/sprite-workbench/reviews/dot-coordinate-guard.gd`, and this report. Reject raw out-of-range coordinates before narrowing or absolute value, while preserving canonical ordinary negative coordinates and the complete pending session on failed load. Use disposable synthetic fixtures. Rerun unchanged `dot-safety.gd` and `safety-fixes.gd`, plus the new boundary suite, and report the actual Godot version.

No UI, artwork, source inputs, player saves, schema, CI, exports, COMMS, START-HERE, versions, merge or release changes. Wider paused work remains paused. Test results and source anchors will be recorded after implementation; no check is claimed yet.
