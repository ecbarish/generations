# Launch checklist: Keymaster

**Owner:** not assigned yet. Generations PM assigns it. Side Games Dev Lead's time is free since Lantern Bowl was shelved, so that thread is the natural owner.
**The build on main:** v0.1.0, KM0 (#379, `c1d4d9c`). One listing (14 Alder Street, a duplex), the deal analyzer, one offer, and a first-year summary. Files: `games/keymaster/model.js` (pure rules), `game.js` and `index.html`. Tests: `tests/keymaster.html`.
**Ruling:** Evan, 2026-10-18: "Wildbond and Keymaster also make the list", which makes Keymaster a launch game after Lantern Bowl was shelved. The design is [docs/proposals/keymaster.md](../proposals/keymaster.md): the deal analyzer is the game, five-minute sessions, and nothing plays itself.
**Chunks:** one pull request per item below, and one game per pull request. Guardrails stay: tests green, saves load, screenshots, Game Art Director reviews any art, and no save-format change without Evan's yes.

Claude played KM0 on 2026-10-18 at desktop width and at 375x812.

- **What works:**
  - The analyzer reads clearly, and every line explains itself in plain words.
  - Offering the sellers' lowest (90% of asking) closes the deal.
  - The first year shows real months: a furnace repair and a month between tenants. It explains why a quiet month pays more than the worksheet says.
  - On a phone nothing runs off the side, and every button is at least 44 px.
- **What it lacks, compared with a launch game:**
  - There is one listing and then "Try the deal again". There is no second decision and no goal.
  - It saves nothing (no storage keys at all).
  - It isn't on the homepage.
  - On a phone the page is about two screens tall. Measured on 2026-10-19 at 375x812, 390x844 and 812x375: every answer already scrolls into view. The gap was the "They say no" answer, whose offer controls are a screen above it (fixed by KM-PHONE).

## Finished means

Playable and fun, the same bar as the other launch games. Further improvements do not hold the release.

**Pass** when all of these are true:

- A newcomer plays a first session without help.
- Playtester scores fun at least **7/10**.
- There is no blocker and no major bug.
- It plays on a phone.
- There is one clear goal.

## The six items

| Item | Gap | Where it stands |
|---|---|---|
| A newcomer gets through the first five minutes without help | **KML-1** | The analyzer explains itself. The newcomer still has to find the game (it's hidden) and has nothing to do after one deal |
| Playtester rates the first session as fun | **KML-2** | Not scored yet. The proposal's test: "If running the numbers isn't fun, the game is wrong" |
| No crashes and no broken saves | **KML-3** | No save exists yet, so the first save is a new format and needs Evan's yes |
| Plays well on a phone | **KML-4** | Fits at 375 px with large targets. Every answer scrolls into view. KM-PHONE adds a way back to the offer after a no. #527 (KM-MONTH) keeps the month amounts readable |
| One clear goal | **KML-5** | None yet: the session ends after one deal |
| Known bugs are fixed | **KML-6** | None found on 2026-10-18 beyond KML-4 |

## Must-haves (these block finish)

1. **KM-HUB:** a homepage card in `launcher/games.js`, with status, goal and controls, so a newcomer can open Keymaster from the hall (KML-1). One pull. `tests/keymaster.html` already runs in `tools/run-all-checks.cjs`, and `node tools/launcher-checks.cjs` must still pass.
2. **KM-STREET:** a short run of listings in one five-minute session, so there is a second and third decision (KML-1, KML-5). This is the proposal's first progression step, "a few doors on one street". Requirements:
   - Each listing makes a different analyzer line matter, and at least one is a deal you should pass on.
   - A goal line names what the run is for.
   - The exact goal is a design choice for the owner and Evan; this checklist does not set it.
   - No new decision types beyond offer, down payment, renovation, and buy or pass. Later tiers wait.
3. **KM-SAVE:** keep what you own and your cash between visits (KML-3).
   - New key `keymaster-save-v1`, versioned, and added to `tools/save-names-check.cjs`.
   - It must not touch other games' saves.
   - **Needs Evan's yes before merge** (new save format).
4. **KM-PHONE:** after "They say no", a "Change your offer" button takes you back to the offer controls, and #527's month amounts stay readable (KML-4). Screenshots at 375x812 and 812x375. The other answers already scroll into view (measured 2026-10-19).
5. **KM-PLAYTEST:** Playtester plays a newcomer session on desktop and on a phone and scores fun at least 7/10 (KML-2). It is not a build pull. The lowest-scoring part becomes the next task, as for the other launch games.
6. **Evan's open questions** from the proposal, answered or defaulted before KM-STREET is built: the title (default: Keymaster) and the tone (default: straight simulation; a named tenant like Mrs Okafor already adds warmth).

## Does not block finish

- Commercial units, development deals, market cycles and rate changes (the proposal's later tiers).
- A property manager or any delegation: the hired-hand rule says you do the job yourself first, so it comes after launch.
- Art beyond what the page has now. A Game Art Director pass is welcome but optional.
- Monetization: the proposal rules out timers and pay-to-win; anything else is post-launch.

## Order

Do KM-HUB and KM-PHONE first: they are small and let Playtester score the current build early. Then KM-STREET, then KM-SAVE once Evan approves the save, then the KM-PLAYTEST score.
