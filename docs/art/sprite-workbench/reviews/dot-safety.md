# Workbench draft/export safety review

Status: claimed by dot for Adam, 2026-10-19. Findings are pending; no checks are claimed as passed.

Scope: WB-GUEST-WORKBENCH-SAFETY under [the explicit routing clearance](https://github.com/ecbarish/generations/issues/373#issuecomment-6258774707). Source baseline is #576 commit `a9ef87fc38f7290f98e7ae61175216834a729bf5`.

Owned paths are this report and `tools/sprite-workbench/reviews/dot-safety.gd` (new standalone test only). Review unchanged session/checks and add only meaningful missing adversarial cases, using disposable process-specific directories and preserving original inputs. No production, editor/backend, CI, shared, save/schema, asset, export-installation or game-publication changes.

Planned evidence: exact command/version/SHA, malformed overrides and indices, invalid regions/anchors, stale manifest/PNG hashes, failed-load retention and export/reimport metadata/pixel identity. Any reproduced defect remains a finding for the owning implementation.
