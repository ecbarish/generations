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
