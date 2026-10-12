# Hall sports-card isolation (AR2.15)

[PR #249](https://github.com/ecbarish/generations/pull/249), based on main eb6293f. No game, shared-engine, service-worker, Godot, version or save-name changes.

Both Diamond games report under the legacy baseball ID. Their actual save keys have always been distinct. The hall now builds a read-only display index from each game's own save. Manager's existing baseball cabinet ID and URL stay compatible; Career gets a separate diamond-career card and destination. Neither the raw shared index nor either save is migrated or rewritten by viewing the hall. Last-played time cannot safely be recovered from the collided report, so the sports cards honestly say saved on this device. Manager's currency is in thousands, Career's in dollars. Player names are displayed as text.

Validation: launcher/sports-checks.cjs generates valid saves using the actual two game models, then tests current record, currency units, display isolation, unchanged save/index bytes, both reset confirmations, preserved other-game backups, malformed/missing saves, escaped names and actual keyboard navigation into the correctly titled games. It runs at 375×812, 1366×768, 1920×1080 and 3440×1440 in isolated Chromium contexts. Run from repo root with Playwright/local Chrome and ARCADE_TEST_ORIGIN pointing to serve.ps1. result.json records the completed count. tools/launcher-checks.cjs remains unchanged and passes 197 checks.

Baseline captures use exact main eb6293f index/catalogue/launcher bytes and a synthetic Career report under baseball, reproducing the mislabeled Manager progress. New captures use valid model-generated saves and show both correct cards. Emulation is not physical-phone/Safari testing. Existing animation art and hall branding are outside this ticket.

Results: all 20 repository suites pass; 80 sports-card checks and the original 197 launcher checks pass. Captures use the actual viewport, with a separate Career view on phone, avoiding the temporary viewport resize of a tall element screenshot. Reproduce captures.cjs from the repo root with ARCADE_TEST_ORIGIN set. Screenshot review is not physical-phone validation.
