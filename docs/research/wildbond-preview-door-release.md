# WB-PREVIEW-177 release record

Claimed in draft PR #183 before export. User approved ready/merge/rebuild/live publication of #177 and the necessary preview release on 2026-10-11.

Source repair merged as `480dfc4`. Export candidate `71a5c311` passes all 17 suites and 353 browser checks with 119 captures. Exact artifact blob IDs and hashes were independently verified locally; every screenshot is nonblank. Published pack bytes come directly from the successful run, not a second export. Independent tooling review confirmed source/engine/shell/live integrity checks and prompted stronger fresh-save reload assertions.

Final release uses read-only verification workflow. No persistent credentials, CI branch pushes, new engine, game source or save-schema changes. The temporary export job used only GitHub's automatic ephemeral token to store tested unreferenced blobs. Final committed-pack CI, PROCESS self-check, merge commit, Pages deployment and matching public hashes remain required publication gates. See play/wildbond/BUILD.md for exact source, artifact and coverage.
