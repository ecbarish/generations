# Browser accessibility: T44 / L10
Codex, 2026-10-08. PR #71, stacked after #70 and #67. Browser work only; Godot stays with Claude.

## Fixed
- Shared Settings traps forward/backward Tab, temporarily makes its background inert, restores prior inert states and focus, and exposes whether it is open. Its explanatory text scales too.
- Shared portrait scenes have a labelled dialog and a real Continue button. The speaker and full sentence appear once in a separate live region; typewriter text is hidden from screen readers. Enter/Space activates the focused decision, numeric shortcuts still work, and scene completion restores focus before the next callback. Reduced motion stops portrait blinking.
- Realmbound buttons and reading windows own their keys instead of moving the hero or firing abilities behind them. The collapsible Look around list lives inside the world: named people, buildings and exits use the existing tap-to-walk pathfinder and physical conversations. No teleport or remote purchases. The canvas describes the location and walking guidance; existing full ability labels are preserved.
- Otherworld choices have dialog names and a focus loop. A status window appearing during speech is reachable with Tab; Escape closes it without skipping the story. Selected appearance swatches have a check. Diamond Career describes its scene through its location, scoreboard and swing guidance; score updates are a live status. Creator-only hidden controls stay hidden.
- The launcher gains shared Settings and reading sizes, samples motion after loading settings, and leaves focused menu buttons alone.
- All four surfaces have two-colour focus outlines, opaque reading backgrounds and larger dialogue/decision/field text. Realmbound and launcher quiet labels have improved colours.

## Verified
All eight existing pages pass: Realmbound 8,221 (NPC fixture counts vary), Wildbond 1,530, Starfall 48, sound 21, offline 15, Diamond Career 122, Otherworld 1,757 and runner safety 35. No game-save fields, versions or service-worker changes.

Run `node tools/accessibility-checks.cjs` with Playwright available and a served checkout. Defaults: localhost:8766 (use the name localhost: some games only expose their test hooks there) and the first installed Chrome, Chromium or Edge on Windows, macOS or Linux (`tools/find-browser.cjs`, shared with `run-all-checks.cjs`), else Playwright's own Chromium. Screenshots go to the system temp folder. ARCADE_TEST_ORIGIN, CHROME_PATH and ACCESSIBILITY_SHOTS override them. Fresh browser contexts protect player saves and preferences. **164 checks pass** across 375x812, 1366x768, 1920x1080 and 3440x1440: focused second-choice activation, focus return/wrap, Settings, Journal, gift cards, status during speech, larger text, device/explicit motion preferences, errors and horizontal overflow. [Phone and ultrawide screenshots](screenshots/accessibility/).

The checker calculates at least 4.5:1 for sampled visible text on solid opaque backgrounds. Disabled controls, gradients, translucent surfaces, canvas text and ancestor opacity are excluded rather than called passes. Thresholds: [W3C contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Focus principles: [W3C dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## Remaining
This is an improvement, not complete WCAG conformance. Contrast samples do not cover every quest, equipment rarity, gradient, canvas pixel or future state. Announcement/focus behaviour was checked in Chrome and its DOM; human NVDA/VoiceOver playtests are still needed. Browser zoom at 200%, forced colours and full reflow need a separate pass; shared text choices still top out at 130%.

Realmbound now has named town paths, but live raid timing/spatial combat has no complete nonvisual equivalent. Diamond Career's Tactical mode is the alternative to judging a moving pitch. The Godot previews and old browser Wildbond/Starfall/Primordial screens are outside the ticket's four named surfaces; shared dialogue/Settings fixes apply wherever those scripts are loaded. All eight suites catch shared regressions.
