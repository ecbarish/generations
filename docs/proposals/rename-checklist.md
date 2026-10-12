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
4. **Repo description + tagline**: pending Evan's tagline pick (see tagline.md). Do not change
   the description until he picks.
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
