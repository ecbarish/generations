# Rename checklist: Idle Arcade → Generations (Flint, 2026-10-12)

**Decided (Evan, 2026-10-12): the project becomes Generations.** Rationale: it's not just idle
games anymore (the 2026-10-12 "Play, not watch" pivot), not just browser games (Godot for PC,
Little Ranch as an app). The brand is fun games born from real people, real experiences and
preferences — not big studios — and the collection genuinely spans generations, from toddler
toys to full RPGs.

This is its own ticket, not a quick edit. Do not start until Evan approves the sequence.

## Checklist

1. **Rename the repo** (GitHub settings). GitHub redirects the old name, but treat every
   link below as needing an update anyway.
2. **GitHub Pages URL**: `ecbarish.github.io/idle-arcade` → `ecbarish.github.io/generations`.
   Update every shared link, bookmark, and QR code.
3. **Control Tower viewer URL** (`idle-arcade-tower.abarish227759.chatgpt.site`): check whether
   it needs renaming or reconfiguring; update COMMS.md references.
4. **Repo description + tagline**: decided 2026-10-12, "Play for the fun. Automate the grind." (tagline.md).
   Evan edits the description himself on github.com.
5. **Docs sweep**: CLAUDE.md, README.md, START-HERE.md, HANDOFF.md, AGENTS.md, CONTRIBUTING.md
   and docs/* — "Idle Arcade" / "idle-arcade" / "the arcade" → "Generations". (Note: some
   "arcade" uses mean the site shell/launcher specifically; those may stay if the launcher
   keeps its name — Evan decides.)
6. **Site**: index.html title/meta, manifest.webmanifest `name`, promo.html,
   promo-wildbond.html, playtest.html, studio.html, credits.html.
7. **Code references**: comments and strings mentioning the old name (e.g. shared/engine.js
   header "Idle Arcade shared engine"). Cosmetic only — change carefully.
8. **Service worker** (sw.js): cache names containing the old name — version them so clients
   pick up the new shell cleanly.
9. **localStorage keys — do not rename blindly.** Keys like `arcade-index-v1` and
   `arcade-backup:` hold real player saves. Renaming them orphans saves. Either keep the
   `arcade-*` keys as-is (invisible to players) or ship a one-time migration. Recommended:
   keep them.
10. **Announce**: tell playtesters and friends (they have the old URL).

## Out of scope for the rename

- Game contents and save formats: untouched.
- The tagline decision itself: tracked in tagline.md.

## What the checklist missed (lane P, 2026-10-12)

Checked against the repository on 2026-10-12.

11. **The old address dies, it does not forward.** GitHub forwards a renamed repository, but not its Pages site:
    `ecbarish.github.io/idle-arcade/` will show a 404. After the rename, create a new small `idle-arcade` repository
    whose Pages site forwards every page to the same path under `/generations/` (an index.html and a 404.html that
    redirect), so friends' links, the playtest QR codes and the trailer's address keep working.
12. **Saves survive the move, but only because the site stays on `ecbarish.github.io`.** Browser saves belong to the
    origin, not the path, so `arcade-*` keys carry over. Keep the site on that origin (no custom domain in the same
    step, or saves are left behind).
13. **The old service worker.** Testers' browsers keep the old site's service worker for `/idle-arcade/`, which can
    serve the old cached pages offline and never show the forward. The forwarding repository needs a `sw.js` that
    unregisters itself and clears its caches.
14. **More save keys than item 9 names.** Keep every `arcade-*` key as it is: `arcade-index-v1`, `arcade-backup:`,
    `arcade-settings-v1`, `arcade-votes-v1`, `arcade-tester-id`, `arcade-gm`, `arcade-gm-log`, plus each game's own key.
15. **Godot saves.** The Godot games save under a folder named from `config/name` in `project.godot` ("Wildbond
    (Godot trial)", "Starfall (Godot)"). Changing those names orphans PC and web saves; leave them, or set a custom
    user folder with a migration.
16. **Hard-coded addresses in code and checks:** `shared/feedback.js` (the "Tell us" issue link) and its check in
    `tests/tell-us.html`, `LIVE_PREVIEW_URL` in `.github/workflows/wildbond-preview.yml` and `starfall-preview.yml`,
    `og:image` in playtest.html, the footers in promo.html and promo-wildbond.html, and `tools/godot-build.ps1`,
    `tools/trailer/make-trailer.ps1` (the trailer shows the old address, so re-render it) and
    `tools/local-ai/Run-LocalAgent.ps1` (a folder path on Evan's PC). Old `play/*/build.json` links are history; leave them.
17. **Page titles.** Every game page ends its title with "· Idle Arcade" (Little Ranch included, which also matters for
    its Android test build's name).
18. **Everything outside the repository that names it:** this Claude project's repository setting and cloud
    environment, the routines' prompts (the PR reviewer sweep), project memory, ChatGPT/Codex's connected repository,
    Adam's AIs' clones and their start prompts (CONTRIBUTING.md), and the local helper's folder on Evan's PC. Each
    keeps working through GitHub's forwarding for a while, but update them in the same session.
19. **Order matters:** merge every open pull request (or warn their authors) before renaming, since branches
    keep working but in-flight links and checks point at the old name.

## Proposed order (lane P, 2026-10-12; waits for Evan's approval)

Evan greenlit the rename and wants to approve this order before anyone starts. Steps marked **Evan** are his on
github.com; everything else any AI can do.

1. **Announce a short rename window** in COMMS and merge or warn every open pull request (item 19).
2. **Add a save-safety check** to `tools/run-all-checks.cjs`: it fails if any `arcade-*` key name or either Godot
   `config/name` changes (items 9, 14, 15). These names never change in any later step.
3. **Name pull request, merged before the rename:** the words "Idle Arcade" become "Generations" in docs, page
   titles, meta, the manifest name and code comments; the service worker's cache name gets a new version so
   players pick up the new pages (items 5-8, 17). Links still point at the old address, so nothing breaks yet.
4. **Address pull request, prepared but not merged:** every hard-coded `ecbarish/idle-arcade` and
   `github.io/idle-arcade` address switched to the new name (item 16), with `tests/tell-us.html` updated.
5. **Evan: rename the repository on github.com and edit its description** to the new tagline, in the same sitting
   (items 1, 4). The tagline edit can also happen today on its own; it does not depend on the rename.
6. **Merge step 4 at once**, then confirm the site loads at `ecbarish.github.io/generations/` and all checks pass.
7. **Evan: create an empty `idle-arcade` repository**; an AI fills it with an `index.html` and `404.html` that
   forward each page to the same path under `/generations/`, and a `sw.js` that unregisters the old service worker
   and clears its caches; Evan turns on Pages for it (items 2, 11, 13).
8. **Check saves:** open the old link on a device with an existing save; it lands on the new address and the save
   is still there (item 12: same origin, same keys). Repeat for a Godot web preview.
9. **Outside the repository** (item 18, item 3): the Claude project's repository setting and cloud environment,
   the routines' prompts, project memory, ChatGPT/Codex's repository connection, Adam's AIs' clones and
   CONTRIBUTING.md's start prompt, the local helper's folder on Evan's PC (Evan), the Control Tower viewer.
10. **Re-render the trailer and any QR codes** with the new address (items 2, 16).
11. **Tell testers and friends** (item 10).
