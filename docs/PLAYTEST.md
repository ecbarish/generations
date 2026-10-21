# Playtest scorecard: is each game actually playable?

Evan (2026-10-09), after trying the baseball game: "We need someone that checks if these games are even reasonably
playable because that baseball game as it was, did not really make sense. We need to push the bar and realize what
we can and cant do." This page is that check. The **Playtester** thread (Claude) keeps it; anyone can re-run it.

**The rule from now on:** a game, or a big new step in one, ships to friends only when it passes **the bar** below,
checked by someone who did not build it, playing as a first-time player with no docs open.

## The bar (six questions, scored 1 to 3)

| # | Question | 1 (fails) | 3 (passes well) |
|---|---|---|---|
| 1 | **What do I do?** | Nothing on screen says what to do next | The world tells you (a person, a sign, a goal line) within 30 seconds |
| 2 | **How do I do it?** | Controls are only on another page, or must be guessed | The controls are shown in the game the first time you need them |
| 3 | **Can I finish the core loop?** | The loop is hidden, broken or plays itself | A newcomer completes one full loop (a fight, a game, a day) in 10 minutes |
| 4 | **Can I see it?** | Things are the wrong size, cut off or unreadable | Characters, text and targets are a sensible size; nothing tiny or giant |
| 5 | **Is it fun?** | I'd stop within 5 minutes | I want one more go |
| 6 | **Phone** | Unplayable on a phone | Plays on a phone, in the way it's meant to |

**Ships when:** no question scores 1 and the total is 13 or more. A 1 on question 6 is allowed only if the game says
"best on a computer" before it loads. A 1 anywhere else blocks the release; fix it first.

**How the check is done:** serve the repo (`serve.ps1`, or `npx http-server -p 8765`), then
`NODE_PATH=$(npm root -g) node tools/playtest/first-look.cjs <folder>` saves the first screen of every game at
desktop (1280x800) and phone (390x844) size and prints errors. Then play each game by hand (or with Playwright
input) from a fresh save: read what's on screen, press what a newcomer would press, and stop when stuck. Screenshots
from the first pass are in [screenshots/playtest-2026-10-09/](screenshots/playtest-2026-10-09/).

## Pass 1: 2026-10-09 (Claude, Playtester thread; fresh saves, Chromium, desktop and phone)

| Game | What | How | Loop | See | Fun | Phone | Total | Verdict |
|---|---|---|---|---|---|---|---|---|
| Wildbond (Godot preview) | 3 | 2 | 2 | 3 | 2 | 1 | 13 | **Passes on a computer.** Fix the controls and the look (below) |
| Starfall village (Godot preview) | 1 | 1 | 2 | 3 | 2 | 1 | 10 | **Not yet.** No goal or controls on screen after the opening |
| Realmbound | 3 | 2 | 3 | 2 | 2 | 2 | 14 | **Passes.** Small ability labels; still a dashboard layout |
| Diamond Career | 1 | 2 | 2 | 1 | 1 | 2 | 9 | **Fails.** Replace with the team-management game (below) |
| Otherworld | 2 | 3 | 2 | 3 | 2 | 2 | 14 | **Passes.** A long opening before the first choice |
| Wildbond Classic (browser) | 2 | 3 | 3 | 3 | 2 | 2 | 15 | **Passes.** Ten screens of talk before you meet the creatures |
| Starfall Guild (old browser) | 2 | 3 | 3 | 3 | 1 | 2 | 14 | Passes as an idle game, but it's a dashboard; it belongs under "Classic" |
| Primordial | 3 | 3 | 3 | 3 | 1 | 2 | 15 | Works as a clicker, but nothing like the other games; its own shelf |

Loop scores marked 2 for the Godot previews mean "not verified to the end in this pass": the run followed the
opening and the first walk, not a whole battle or day. Pass 2 should finish one loop in each.

### What I saw, game by game

**Wildbond (Godot).** Loads in about 10 seconds. The opening is strong: a register to sign, then a clear goal line
("Follow Maren to her barn, the big wooden one at the top right"). Walking feels fine. Problems:
- **Controls are never shown inside the game.** They are on the launcher card ("Arrows or WASD to walk, Enter or E
  to talk, J for the field book") and nowhere after that. A newcomer who skipped the card has to guess.
- **The village is the same as Starfall's.** Same thatched cottages, same barn, same layout and paths
  (wildbond-village.png next to
  [starfall-village.png](screenshots/playtest-2026-10-09/starfall-village.png)). Evan noticed this. It makes both
  games feel like one game reskinned.
- **See-through roofs** (Evan's report; not caught in this short run): roofs that fade when you walk near read as
  glitches when the player isn't actually behind the building.
- **Phone portrait:** the game is a small strip in the middle of the screen, the text is tiny and there is no touch
  pad in this preview (wildbond-phone-portrait.png).
  The launcher says "best on a computer", so this is allowed for now, but a "turn your phone sideways" card would help.

**Starfall village (Godot).** Same engine and art as Wildbond. After the opening talk the screen shows only "Day 1,
Hamlet of Starfall, Coins 100": no goal, no hint of what to do or which keys do it. Walking works.

**Realmbound.** Character creation is clear, the first quest giver speaks at once, and "Continue (Enter)" is shown.
The ability buttons' names are tiny small caps and hard to read at 1280 px. It is still a panel layout (queued to move
into the game window).

**Diamond Career.** This is the one Evan couldn't play, and the pass agrees:
- **What to do:** after the name screen come seven "Continue" screens, then a clubhouse with "Your locker",
  "Wall calendar", "Iona's notebook" and "Talk to Iona". Nothing says "play". The game is hidden inside "Talk to Iona"
  ("Play game 1 of 6"). ([diamond-clubhouse.png](screenshots/playtest-2026-10-09/diamond-clubhouse.png))
- **Scale:** the lockers are giant and the people are tiny; on the field the batter is about 40 pixels tall on a
  1280-pixel screen. ([diamond-at-bat.png](screenshots/playtest-2026-10-09/diamond-at-bat.png))
- **How to hit:** the instructions exist, but in a panel the "Field notes" button opens. On the field a banner does say
  "Swing when the ball reaches the circle: tap the field or press Space", but "Throw the pitch" has to come first,
  and that is easy to miss.
- **The loop:** a whole nine-inning game passes with you playing two at-bats; the rest is simulated. Blind timing got
  1 for 5. It ends quickly and you never feel in control.
- **Verdict:** batting you play yourself is beyond what we can make feel good right now. Evan's direction (manage the
  team: ratings, trades, contracts, hiring, stadium upgrades, watch the games) plays to what we already do well
  (menus that are a world, idle sim, people). The sports thread owns it.

**Otherworld.** Seven screens of prologue, then three clear world cards, then a name and look. Fine; the opening could
be shorter.

**Wildbond Classic.** Works, but there are ten screens of talk before the partner choice. "Skip scene (Esc)" is shown,
which helps.

**Starfall Guild (old) and Primordial.** Both work as idle/clicker games and both are dashboards: panels of numbers
around a small picture. Neither fits the "screen is the world" rule. Primordial in particular has nothing in common
with the rest (Evan: "Primordial does not really fit any of our other games"). They should sit on their own shelf on
the website ("Classic and experiments"), not beside Wildbond.

**The website.** The "living world" homepage shows only two games, and the page has three layouts plus a vote. Evan
wants one layout, with games grouped by kind. (Website thread.)

## What we can and can't build right now (honest)

| We can do well | We can't do well yet |
|---|---|
| Walk-around top-down worlds with people, talk, quests (Wildbond, Starfall) | Real-time action that depends on precise timing and feel (batting, sword fights, platforming) |
| Turn-based battles and choices | Physics-heavy sports you play yourself |
| Management and idle sims with readable numbers and people (a team, a guild, a ranch) | 3D, or animation-heavy scenes |
| Retro one-screen arcade games with simple rules (Storm Front) | Many games at once: each one needs a person to finish it |
| A Retro Bowl-style football game: play-calling plus one simple pass gesture, with management around it | Matching a commercial game's polish quickly; we copy ideas, never code or art (Retro Bowl's source isn't open) |

## Fixes handed to the owning lanes (2026-10-09)

| Fix | Lane / thread | Priority |
|---|---|---|
| Show the controls in the game the first time they're needed (walk, talk, field book), in Wildbond and Starfall; a shared "how to play" card in `shared/` both use | W Wildbond builder (and S Starfall) | High: blocks question 2 |
| Give Wildbond its own village look so it no longer matches Starfall (different buildings, layout, palette) | W Wildbond builder, with G Game assets | High |
| Fix see-through roofs: only fade a roof when the player is really behind it, or not at all | W Wildbond builder | High (Evan's report) |
| "Turn your phone sideways" card, and the touch pad, in both Godot previews | W, then S | Medium |
| Starfall: an on-screen goal line after the opening, like Wildbond's | S Starfall | High: blocks question 1 |
| Diamond Career: stop new work on batting; design the team-management game (and the Retro Bowl-style football game) | Baseball and football management thread | That thread decides; pause DC2.x (more batting) until it does |
| One homepage, no "living world" screen, games grouped by kind (Adventures, Village and management, Sports, Arcade cabinets, Classic and experiments), and the controls on every game's card and loading screen | Arcade website cleanup thread (lane A files) | High |
| Realmbound: larger ability labels | A ChatGPT (with the game-window move) | Low |
| Wildbond Classic and Otherworld: a shorter opening, or an offer to skip it on the first screen | A ChatGPT | Low |

## Pass 2: 2026-10-11 (Claude, Playtester thread)

The same method as pass 1, now with 15 pages (`tools/playtest/first-look.cjs` includes the new games). No page threw an
error or scrolled sideways on a phone. I played the four new games from a fresh save and re-checked the pass 1 fixes.
Diamond Manager was scored in [playtests/diamond-manager-1.md](playtests/diamond-manager-1.md) (15, passes).

| Game | What | How | Loop | See | Fun | Phone | Total | Verdict |
|---|---|---|---|---|---|---|---|---|
| Storm Front | 3 | 3 | 3 | 3 | 2 | 3 | 17 | **Passes.** Controls under the screen, touch buttons, a demo behind the title; a minute's play reached 1,210 points |
| Lighthouse Watch | 3 | 3 | 3 | 3 | 2 | 3 | 17 | **Passes.** Reached night 2; the initials board works |
| Brisket's Crossing | 3 | 2 | 3 | 2 | 2 | 3 | 15 | **Passes, two fixes wanted** (below) |
| Little Ranch | 3 | 3 | 2 | 3 | 3 | 3 | 17 | **Passes.** Every tap does something; 60 random "toddler" taps opened nothing and broke nothing |
| Diamond Manager | 3 | 3 | 3 | 2 | 2 | 2 | 15 | Passes; active management doesn't pay yet (ticket DM-B) |
| Wildbond (Godot) | 3 | 2 | 2 | 3 | 2 | 2 | 14 | Better: its own village (slate cottages, a red barn), click or tap to walk, a "turn your phone sideways" card |
| Starfall village (Godot) | 1 | 2 | 2 | 3 | 2 | 1 | 11 | **Still not passing.** A new frontier town of its own, but still no goal or controls on screen after the opening |

Little Ranch's loop is a 2 because my run didn't reach bedtime (about a dozen actions or six minutes), not because
anything failed.

**What landed from pass 1:** Wildbond and Starfall no longer share a village. Wildbond has click-to-walk and the
sideways card, and Evan's see-through roofs have a fix merged (PR #154; not re-tested here). The homepage is one page
with games grouped by kind (Adventures, Build and manage, Sports, Stories, Something different) in a walk-in cabinet
hall, with "Press Enter (or tap) to play". Realmbound's readable ability labels (PR #141) and Otherworld's opening
choice (PR #142) are merged; I haven't re-scored them.

**Still open from pass 1:** the controls are still not shown inside either Godot game (Wildbond's launcher card has
them; Starfall's goal line is still missing). These two are now the top fixes in the arcade.

### Brisket's Crossing: two fixes

1. **A hit sends Brisket straight back to the start with no pause.** `hurt()` in `games/briskets-crossing/model.js`
   calls `respawn()` at once, so a player still holding Up hops straight back into the same wagon. Random play lost
   all three lives in about three seconds. The classic fix: a short beat (about a second) where Brisket is knocked
   over and input is ignored, then "Ready" again.
2. **The arrow keys don't start a run.** After "One player" a second panel waits for a click on "Lead Brisket out".
   Space or an arrow there should start it too, as in the other cabinets. Also, the mule is about 35 pixels on a
   1280-pixel screen; a little bigger would help, so it matches the wagons.

## Fixes handed out after pass 2

| Fix | Lane / thread | Priority |
|---|---|---|
| Show walk, talk and field-book keys in the game the first time they're needed | W Wildbond builder | High |
| Starfall: a goal line after the opening, and the controls on screen | S Starfall | High (blocks the bar) |
| Brisket's Crossing: a knocked-over beat after a hit; Space or arrows start a run; a bigger mule | Whoever built AC3 (guest lane), via COMMS | Medium |
| Diamond Manager: make the GM's choices matter (DM-B) | Baseball and football management | Medium |

## Next pass

Re-score Starfall once its goal line lands, finish one full loop in each Godot preview, and score Lantern Bowl (the
football game) and any new cabinet before it goes on the website.
