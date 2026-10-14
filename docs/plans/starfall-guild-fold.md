# Starfall Guild's best loops, folded into the village (SF-GUILD map)

Evan, 2026-10-12: one Starfall gets the effort. The browser Starfall Guild (games/starfall-guild/) keeps its fixes
(SG-N1) and stays playable; its best loops move into the Godot village (starfall-godot/) one ticket at a time, in the
order of DEVELOPMENT-PATH's Starfall section. This page says which loop lands where. It is a map, not a spec: each row
becomes one ticket with its own done-when line. Claude, SF-GUILD1, 2026-10-14.

**The rules every row keeps:** play, not watch (nothing plays itself; no full Auto); the screen is the world (in the
street, not a tab); master it by hand, then a person asks to take it over; numbers stay small and shown in the world; no
windfalls; old saves load. The village's 150-second day stays the clock (DAY_SECONDS); nothing below adds a second one.

## What the browser game does well, and where each part goes

| Browser loop (games/starfall-guild/js) | Why players like it | Where it lands in the village | Ticket |
|---|---|---|---|
| **The fight you watch** (02-dungeon.js battleTick: party against one monster, floor by floor) | Lively hits, numbers going down | **A call in the fight**: when someone out on a job finds trouble, you pick how they take it (two calls, odds and knocks shown). Not a battle screen: the fight stays where it is, in the wilds or out of sight | **SF-GUILD1 (this PR)** |
| **Staff who join because of what you did** (00-data.js STAFF: Mina at 5 recruits, Kuro at level 15...) | Automation you earned | Already the village's rule (Bryn, Garrick, Fen, Tamsin, Odo, Ilse: do it by hand, then they ask). Flint's ask is the *first* one sooner, inside a five-minute session | **SF-GUILD2** (Muse, cycle 1) |
| **Build, upgrade and push** (03-town-staff.js: shops, facilities, level-ups, the push to the next floor) | A number that keeps climbing | Hob's plots and the mastery ranks (SF2.11: 10/25/50 uses per station). The hire works at your rank (SF2.12). No shop-income multipliers: a building does one visible thing | SF2.11, SF2.12 |
| **Party combos** (00-data.js COMBOS: Knight + Cleric, Mage + Archer...) | Choosing who goes together | **Who suits the job** (SF2.16): a notice says who it suits; later, two adventurers can pair on a Dangerous job, and a good pair gets better odds. Read off the board, not a party screen | SF2.16, then a pairing ticket |
| **Boss walls** (isBoss: every tenth floor a Lord stops the push) | A wall you plan for, then break | **Veteran requests** (SF2.14): danger-5 notices by name, each a wall the guild prepares for (gear, a tonic, trust, your call in the fight). Breaking one leaves a trophy in town | SF2.14 |
| **Relics** (RELICS: pick one of three after a boss) | A choice that changes the run | **Keepsakes from the wilds**: a broken wall brings home one of two finds, shown in the guild hall (a whetstone on the rack, a lucky coin over the door), each a small, specific edge. Never a pure multiplier stack | New ticket after SF2.14 |
| **Seasons and Renown** (newSeason, chooseRegion: reset for a permanent bonus and a new region) | Starting again stronger, somewhere new | **Seasons as chapters** (SF3.1, SF3.3's outlines) ending in a festival (SF3.4). No reset of the town: the season changes the problems and the board, and the guild's record carries. Regions become the wilds past the gate (SF4.1) | SF3.1, SF3.4, SF4.1 |
| **The recruit board** (stars, rerolls) | Hoping for a good one | Newcomers arrive with a rank and a trait (already), near the team's middle level (SF2.16). No star lottery and no rerolls for coins | SF2.16 |
| **Aldric starts the next season for you** | Hands off | **Not carried over.** A season ends because of what you did, never on a timer the game runs for you | none |

## Flint's two asks (round 3, 2026-10-12)

1. **"Combat is 100% automatic: one tactical decision would convert watching into playing."** In the village, a job's
   outcome was one roll when the adventurer came home. SF-GUILD1 adds **the call**: halfway through a job the
   adventurer finds the trouble, a short choice comes up at the foot of the screen ("Aki has found the wolves. Your
   call?"), and you pick one of two ways to take it, each showing its odds and knocks in words. Some adventurers say
   what they'd like (a Mage wants to go straight at it; a Knight or a Cleric would rather hold). No call in time and
   they fight their own way, exactly as before: calling is never a chore you're punished for missing.
2. **"Offer one early automation taste so earned automation lands in the first five minutes."** SF-GUILD2, Muse's.
   The village already earns Bryn after ten meals by hand; that ticket measures and brings the first hire inside the
   first session.

## Order

SF-GUILD1 (the call) and SF-GUILD2 (the early hire) this cycle; then the path's own order: SF2.11 (the remaining
stations), SF2.12, SF2.14 with keepsakes, SF2.16 with pairs, SF3.1 and SF3.4, SF4.1. The call grows with them: a
veteran request's call matters most, a pair gets a call for the two of them, and the wilds (SF4.1) let you see the
fight you're calling.
