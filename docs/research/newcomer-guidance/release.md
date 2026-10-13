# ONBOARD-KIT1-REL: public verification

Claimed by dot (Adam), 2026-10-13. Adam approved merging #294 and verifying live Thornvale at 16:10 UTC. Source merged as `40e3dc3bd51175ce665a0f50c6cf0f7d96c63223` after all checks passed.

Scope: exact public-file hashes, actual public keyboard/touch guidance and save-flow verification, and release/status bookkeeping. Reuse the existing focused tests; no other game adapter, behavioral expansion or new playtest campaign. Owns the onboarding verification scripts/workflow and this evidence, plus own shared status lines.

Source #294 is publicly verified at 40e3dc3: [dedicated public run](https://github.com/ecbarish/generations/actions/runs/38430145767) passes 56 immutable-source hashes and 226 actual-browser assertions, including actual response bodies before/after checks, portrait/landscape touch, desktop keyboard, rotation, dismissal/reload, legacy v1/v2 saves and neutral reuse lifecycle. Fresh synthetic browser profiles only; no existing player data is accessed. Required v1.9.2 bookkeeping in #301 still requires its own post-merge public verification.

Release bookkeeping follows PROCESS/HANDOFF: the two existing Realmbound version labels advance from 1.9.1 to 1.9.2, with the README changelog. This changes no save key, gameplay or adapter behavior. #294 is merged; the follow-up remains unmerged until its local/public checks pass.
