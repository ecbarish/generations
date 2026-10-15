# Lantern Bowl vs Retro Bowl, ALL-22 and similar games: deep comparison

Game Researcher, 14 Oct 2026, 7:40 PM ET. Lantern Bowl was read at `ecbarish/generations` main **5e5a389** (14 Oct, 6:51 PM ET), v0.1.6. ALL-22: I describe its techniques only. No code or assets were copied, because it has no licence and uses Pokémon IP. **(est.)** marks my own estimates. Builds on `passing-layout-breakdown.md` and `round5/all22-deep.md`.

## Sources (all fetched or returned by search today)
- [RB-anj] Andrew McAlister's Retro Bowl breakdown (loop, economy, monetisation): https://anj.me/retro-bowl-a-breakdown-of-a-charming-little-game/
- [RB-fo] retrobowl.gg front office guide, which quotes the in-game help text: https://retrobowl.gg/blog/retro-bowl-front-office-guide/
- [RB-rob] Rob's guide, front office: https://robwritesaboutwhatever.com/2021/04/15/robs-complete-guide-to-retro-bowl-part-1-how-to-build-a-winning-front-office/ and drafting: https://robwritesaboutwhatever.com/2021/04/22/robs-complete-guide-to-retro-bowl-drafting-and-managing-players/ and later seasons: https://robwritesaboutwhatever.com/2021/04/29/robs-complete-guide-to-retro-bowl-maintaining-a-winning-team/
- [RB-lw] LevelWinner guide: https://www.levelwinner.com/retro-bowl-guide-tips-tricks-strategies-to-secure-wins-and-form-a-dominant-franchise/
- [RB-ir] InReview tips: https://inreviewcritics.com/2022/08/28/even-more-retro-bowl-tips-column-from-the-editor/
- [Wiki-opt] https://retro-bowl.fandom.com/wiki/Options · [Wiki-dil] https://retro-bowl.fandom.com/wiki/Dilemmas · [Wiki-unl] https://retro-bowl.fandom.com/wiki/Unlimited_Version
- [AppStore] Retro Bowl IAP list and 4.8★ from 24K ratings: https://apps.apple.com/ca/app/retro-bowl/id1478902583
- [SeqP] Sequential Planet Switch review: https://sequentialplanet.com/video-game-review-retro-bowl-nintendo-switch/
- [GR] GamesRadar: https://www.gamesradar.com/retro-bowls-addictive-simplicity-makes-it-one-of-the-best-sports-games-in-recent-years/
- [PG-sw] Pocket Gamer Switch review: https://www.pocketgamer.com/retro-bowl/review/
- [Guardian] NFL Retro Bowl '25: https://www.theguardian.com/games/2024/sep/27/retro-bowl-cute-nfl-8-bit-mobile-games
- [OS-upd] Operation Sports, difficulty update: https://www.operationsports.com/retro-bowl-update-adds-team-name-and-uniform-editing-difficulty-settings-increased-wind-effect-much-more/
- Reddit: "Just one more" https://www.reddit.com/r/RetroBowl/comments/t5v1nm/just_one_more/ · "Best game ever" https://www.reddit.com/r/RetroBowl/comments/f74ygu/best_game_ever/ · "Why do y'all like Retro Bowl" https://www.reddit.com/r/RetroBowl/comments/1cvddgm/why_do_yall_like_retro_bowl/ · quarter length https://www.reddit.com/r/RetroBowl/comments/196icwa/how_long_are_your_quarters/ · difficulty https://www.reddit.com/r/RetroBowl/comments/11zmh4e/whats_the_best_difficultyquarter_length_to_play_on/
- RB College: https://retrobowl.me/retro-bowl-college-online · https://inreviewcritics.com/2023/10/23/top-5-biggest-differences-between-retro-bowl-college-and-retro-bowl-column-from-the-editor/ · https://inreviewcritics.com/2024/01/15/5-tips-thatll-make-you-better-at-retro-bowl-college-column-from-the-editor/ · App Store reviews https://apps.apple.com/us/app/retro-bowl-college/id1632904520?see-all=reviews
- ALL-22: https://all22pokemon.com (landing page fetched today), plus `round5/all22-deep.md`.
- Passing and defence sources from the earlier breakdown (PocketTactics, OpSports, retrobowl.gg passing guide, Touchdowners) are listed in `passing-layout-breakdown.md`.

## 1. What Lantern Bowl actually is today (code read)
| Area | What the code does | Where |
|---|---|---|
| Scope | **One match** against Millrace, with 2-minute quarters and overtime. No season, league, draft, money or progression. The README lists all of these under "Later". | `README.md` "Later"; `model.js` `create()` L85 |
| Roster | Two hard-coded clubs. Only the QB, RB, 2 WR and TE have individual ratings. The line, rush, cover, tackle and kick are **one number each per team**, all between 55 and 64. | `model.js` `baseRoster` L42-61 |
| Play calling | **4 plays in total**: inside run, outside run, quick pass, deep pass, plus a kick. The dock shows 3 of them, chosen by down and distance. Millrace's defence leans toward the plays you call most. | `routeTable` L383, `offerPlays` L402, `tendencyLoad` L342 |
| Routes | Every pass play is a single straight segment per receiver (start → end). There are 3-4 routes per play, with no breaks, settles or timing. | `routeTable` L383-398 |
| Passing | Slingshot drag from anywhere, with a dotted landing arc. Power² sets the reach (7.5-42.5 yd). The bullet/lob choice is automatic by power (<0.42 is a bullet) unless you toggle it. Error = (0.25 + 0.03·yd) × pressure, plus a wobble once you hold past `aimSteady(throw)` = 0.32-1.6 s. Contest radius 2.6 yd. Pick = 7.5% only if the defender is the closer man. | `throwReach` L750, `passError` L766, `guideState` L777, `arriveOutcome` L868, `launch` L919 |
| Blocking (pass) | 3 rushers. At the snap, each one makes **one dice roll** (`chance(line, rush)`) for whether he is "held". A held rusher is stuck for 3.4 s, a free one for 1.15 s. Blocks are not simulated. | `buildPass` L430-435 |
| Blocking (run) | 3 lanes, each **pre-rolled open or shut at the snap**. Yardage then comes from a scripted table: 14.5% loss, 5.5% no gain, 78.5% a gain of 0.7-3.85 yd, 1.5% something more. The 11-a-side squad you see is **cosmetic drift**: linemen wobble by 0.06 yd and the "rules actors" are only 6-8 bodies. | `callPlay` L627, `buildRun` L362, `settleHole` ~L1090, `driftSquad` L567 |
| Running | Swipe or hold to steer and juke, tap to dive. A juke or dive is one `moveContest` roll: stop, gain (+1.35-2.9 yd) or break. The Turbo button is now hidden. | `moveContest` L1010, `extendMove` L1018, `paintTools` game.js L850 |
| Ratings | Every contest is `chance(a,b)` on 0-100 (about 50 is ordinary). The rosters only run from 48 to 70, so in practice ratings barely differ. | `model.js` L25, L42-61 |
| Defence / opponent drives | Millrace's drives play out on the field with a CPU policy and the call table `cpuCall`. You can only watch (or rush it at 0.04 s). You make no choice. | `cpuCall` L1439, game.js `beginWatch` L216 |
| Camera | Side-on, critically damped spring, line of scrimmage set back before the snap. The behind-the-play camera is **only kept for the checks**, the opposite of Evan's stated preference. | `view.js` `stepSideCamera` L317; README "Files" |
| Layout | Landscape. In portrait, a full-screen "Turn your phone sideways" note pauses the game. HUD strip about 18 px. Play dock of 3 cards before the snap. No action buttons during a play. | `index.html` `#turn`; game.js `dock` L282 |
| Juice | 5 shared chiptune sfx: select, hit, dodge, catch arpeggio, miss. **No touchdown sound**, because `soundFor` has no 'td' case. Sound **defaults to off**. No screen shake, hit-stop, slow-mo, replay, crowd, particles or celebration. The result is a single text line. | game.js `soundFor` L644, save default L73; shared/sound.js L114-129 |
| Onboarding | One title panel with two sentences, and a hint line. | game.js `title` L168 |
| Monetisation | None ("no ads, energy bars or paid shortcuts"). | README |
| **Unused asset** | `shared/sports-office.js` already holds a front office (salaries, payroll, schedule, standings, contracts, free agents, facilities, trades), "shared by every sport… Diamond Manager, Lantern Bowl". Only Diamond Manager uses it. | `shared/sports-office.js` L1-15 |

## 2. Retro Bowl (and College): the whole game
**Core loop and session.** Play a match, then develop the team: training, upgrades, facilities, draft and random events [RB-anj]. Quarters can be 1, 2 or 3 minutes [Wiki-opt]. A Reddit poll put about 60% of players on 2 minutes [Reddit quarter length]. Games last "6-7 minutes" [Reddit why], "less than 5 minutes" [SeqP] or "as little as three minutes" [Guardian]. A season is "30-45 minutes" [Reddit best game] or "roughly 2 hours" [RB-anj]. The figure depends on quarter length, and both numbers are players' own reports. The regular season plus playoffs is about 20 games [RB-anj].

**Franchise loop.**
- *Stars only.* You manage up to 10 star players (12 with Unlimited). The rest of the roster is generic and hidden, and coordinators set its quality [RB-anj, RB-fo, SeqP].
- *Ratings.* Each player has a current and a potential rating from 0.5 to 5 stars, and 4 attributes per position. Level-ups let you raise one attribute up to its own cap [RB-anj].
- *Draft.* One pick in each of 3 rounds. You can trade picks or skip them for 1-3 credits. "The draft… wanting to make you play to the end of the current season" [RB-anj]. Pocket Gamer calls it "one of the coolest parts" [PG-sw].
- *Contracts and cap.* A $150m cap. Extending costs credits; renewing is free but asks for a raise. "After 2-3 seasons… a lot of pressure on your salary cap" [RB-anj]. Draft cheap, develop, then let stars go [RB-fo].
- *Coaching credits* are the single currency, "not cash, it's kudos" [RB-fo]. A win pays 1-3 credits depending on fan support tier, and a Retro Bowl win pays 10 more [RB-anj, RB-rob].
- *Facilities.* Stadium, training and rehab. Each has a 10-step bar, the next step costs its own number in credits, you can make one upgrade per week, and the bars decline over time [RB-rob].
- *Coordinators* have traits such as Physio (+5% condition per game), Fan Favorite and Likeable [RB-lw, RB-rob].
- *Morale and press.* High morale means a player "performs above his rating", and low morale means below, with stars eventually asking to leave. Praising is free; blaming drops morale [RB-fo]. Dilemmas come after games, in bye weeks and before games: punish the player or the team, meet the board for credits or the fans for approval [Wiki-dil].
- *Attachment.* Records in many categories and championship rings on portraits [RB-anj].

**College version.** No cap or free agency. Instead there's a scholarship fund (about $50k), freshman admissions with limited scouting while rival schools sign the same prospects, 4-year careers, GPA and academic suspension, and 250 teams [retrobowl.me, InReview RBC]. Reviews ask for real recruiting work, a transfer portal and **playable defence** [RBC App Store].

**Stats shown.** Star ratings, attribute bars and team offence/defence star ratings on the home screen [RB-anj]. Division tables show pct and net points [OS-upd]. A long-standing request is past-season and other teams' stats [Reddit best game].

**Difficulty.** Easy, Medium, Hard, Extreme and Dynamic. Dynamic gets harder as you win, and Extreme makes every opponent 5★ [Wiki-opt]. On Dynamic, if you "go a couple of scores up… the other team will intercept your passes easier" [Guardian]. Interceptions are more likely at top difficulty [OS-upd].

**Feel and juice.** "Elegant touch controls… incredibly satisfying as you learn how to ping passes" [GR]. The ball "will sometimes bounce off players or cause diving catches" [RB-anj]. Replays can be fast-forwarded or slowed (Unlimited, and on Switch), and there's crowd noise during plays [SeqP, Wiki-unl]. Kicks are a two-tap needle minigame [RB-anj]. I couldn't find a source for screen shake or slow-mo on catches, so **those aren't claimed**.

**Onboarding.** You start from a static pre-snap picture with route arrows, the play starts the moment you touch, and there are 3 opening options (drag to throw, tap the RB, throw backwards to scramble) [RB-anj]. Audibles re-roll the play, limited by QB XP [RB-anj, SeqP].

**Monetisation.** Free, no ads. A $0.99 Unlimited unlock (team editor, weather, 12-man roster, replays, kick returns) and credit packs from $0.99 to $39.99 [AppStore, Wiki-unl]. Players praise it as "a rare mobile game with no ads, no gacha" [Reddit why]. The main pressure to spend is the cap squeeze on players you've grown attached to [RB-anj].

**Why people keep playing.** "Just one more season" [Reddit t5v1nm]. Short, snappy matches inside a season-long project [GR]. A steady stream of forced trade-off decisions that feed the coaching fantasy (Medium essay, cited via search). Attachment to your players [RB-anj]. Offline, battery-friendly, no ads [Reddit why]. Known hates: defence is a crap shoot [PocketTactics, in the earlier breakdown], you can't pick plays (audibles are only partly a fix), and there's no stiff-arm or boost button [Guardian].

## 3. ALL-22 (all22pokemon.com): techniques only
- **The landing page today** is a "lineup builder" draft: 22 rounds, each rolling a region and type (or a random pick). You place one creature into any open spot on a formation (3-4 or 4-3 defence, FB or Slot offence, kicker on or off), with 5 rerolls and up to 3 legendaries. Once all 22 are filled, you play a **17-game season** ("Can you go 17–0?"). Grades come from how well each creature's stats, size and type fit its position. QB, pass rushers and corners count most, and "your four weakest spots drag the whole team down". Opponents range from 350 to 910, and there's an X-linked leaderboard (fetched today from https://all22pokemon.com). **Technique to take:** a draft where every pick is a decision, a score that punishes weak links, and a clear target (17-0, best score).
- **On-field sim** (from my earlier source notes, `all22-deep.md`): full 11-a-side with real block engagement, shed timers (1.6-3.4 s × U(0.45-1.55)), leverage, pancakes, tackle rolls from about 0.56 with modifiers, waypoint routes in 3 depth tiers with settle and delay, auto-lead passes with error growing with distance, arm and pressure, a contest-based catch model, defensive fronts and zone landmarks, and a 20 s play clock. A spring camera with lookahead, plus screen shake and a punch zoom.
- **Not verified:** the in-game UI and layout. Fetching the play pages failed earlier.

## 4. Gap table
| Area | Retro Bowl | ALL-22 | Lantern Bowl now | Gap | Fix |
|---|---|---|---|---|---|
| Season / franchise | Seasons, draft, cap, credits, facilities, morale, dilemmas | Draft-22 → 17-game season, leaderboard | One match only (`README` "Later") | **High** | Wrap the match in a short season using `shared/sports-office.js` |
| Reason to replay | Attachment, records, rings, "one more season" | Best score, 17-0 chase | None after the final whistle | **High** | Season record, player career stats, a trophy shelf |
| Blocking | Ratings plus line play | Simulated sheds, leverage, pancakes | One roll per lane or rusher at the snap; the 11 bodies are cosmetic (`buildRun` L362, `driftSquad` L567) | **High** | Shed-timer blocks tied to line vs rush; let the visible linemen be the actors |
| Ratings matter | 0.5-5★, attributes cap by potential, morale ± | Fit grade, weak links drag | 0-100, but rosters only span 48-70; line and defence are 1 number (`baseRoster` L42) | **High** | Spread the rosters to 35-90, give each player 3-4 ratings, and show them as stars or words |
| Plays / routes | Called for you plus audibles | 6 sets, waypoint routes, read order | 4 plays, straight-line routes (`routeTable` L383) | **High** | 10-12 plays; routes with a break (out, slant, curl, post, flat) |
| Juice | Crowd, replays, diving catches, kick needle | Shake, punch zoom | 5 beeps, no TD sound, sound off by default, no shake (`soundFor` game.js L644) | **High** | TD fanfare and banner, catch hit-stop, tackle shake, crowd bed, sound on by default |
| Camera | Side-on | 3D pro / bowl rigs | Side-on live; behind-the-play only in checks (README) | Med | Restore behind-the-play as the default with side-on as an option (Evan's preference) |
| Defence / opponent | Text sim from your D ratings | Full sim | Watched on the field, no input (`cpuCall` L1439) | Med | One pre-drive choice (Blitz / Balanced / Prevent) and a fast watch |
| Passing | Slingshot, lob/bullet, manual lead | Auto-lead, physics error | Slingshot plus landing circle, contest model (good) | Low | Keep it; feed it real route breaks |
| Layout | Landscape, about 90% field (est.) | n/a | Landscape, 18 px HUD, rotate prompt in portrait | Low | Keep it; check the Kick off button sideways fix |
| Difficulty | 5 levels including Dynamic | Opponents 350-910 | Fixed Millrace | Med | Opponents with varied ratings over a season, plus an Easy/Normal/Hard toggle |
| Onboarding | Static setup, touch starts the play | n/a | Two sentences on a panel | Med | A guided first snap (drag ghost-finger), as in the Wildbond guided catch |
| Kicking | Two-tap needle | Simulated | Kick is a play card (simulated) | Low | Two-tap timing kick for FGs and PATs |
| Monetisation | $0.99 unlock + credit IAP, no ads | Free | None, by design | n/a | Keep none (policy) |

## 5. Top 10 fixes, ranked by player impact per effort
1. **Juice pass (small effort, big feel).** Turn sound on by default (or on the first tap). Add a touchdown fanfare and a full-width "TOUCHDOWN" banner held 1.6 s. Add 60-80 ms hit-stop and a 2 px shake on tackles and catches, a crowd bed that swells on big plays, and the spare 'td' and 'pick' sfx. Right now a touchdown is silent (game.js L644).
2. **Make ratings visibly matter.** Spread the two rosters (and later opponents) across 35-90. Split the team-level line, rush, cover and tackle into named starters. Show stars on the play card and a "Brisk beat Cover: speed 82 vs 61" line after a big play. Small effort: data plus text.
3. **Blockers really block.** Replace the lane and rusher dice-at-snap (`callPlay` L627, `buildPass` L430) with per-pair shed timers from line vs rush (about 1.6-3.4 s × random 0.45-1.55, backside shorter), and make the visible linemen the actors. Medium effort. This answers Evan's "blockers really block" directly and creates natural losses and breakaways.
4. **A short season wrapper using `shared/sports-office.js`.** 8-10 games against 6-8 clubs of varied strength, a standings table, playoffs and a trophy. The shared office code already does schedule, standings and contracts. Medium effort, and the biggest retention gain.
5. **More plays with real routes.** Grow from 4 to 10-12 plays. Give routes two legs (stem then break: slant, out, curl, post, flat, drag, go) in 3 depth tiers (about 5, 10-12 and 25+ yd). Keep the 3-card dock but rotate the cards from the bigger pool. Small to medium effort.
6. **Behind-the-play camera as the default, side-on as an option.** The behind camera still exists for the checks (view.js `behind`/`project`). Wire it to a settings toggle. Medium effort, and it's Evan's stated preference.
7. **Between-games decisions.** After each match, one dilemma card and a quick post-game question (praise the player or the team, owner or fans), feeding morale (±3-5 on performance) and coaching points. Small effort, and it's the "forced trade-off" cadence players cite.
8. **Progression and attachment.** XP per match, a level-up that raises one rating toward a potential cap, career stats, and records and rings on portraits. Medium effort.
9. **One defensive choice per opponent drive.** Blitz (more sacks, more big plays allowed), Balanced, or Prevent, then the drive plays at 2× speed with a "skip" option. Small effort. It fixes Retro Bowl's most-cited hole without making defence a chore.
10. **Guided first snap and a two-tap kick.** A ghost finger showing the drag on the first pass, a "tap the back" hint on the first run, and a needle kick for field goals and PATs. Small effort.

(Effort is my estimate; impact is ranked from the sourced player feedback above.)

## Notes for the team
- Lantern Bowl's **passing and layout are now close to Retro Bowl's**: slingshot, landing arc, no buttons in play, contest model. **The gap Evan feels is everything around the throw**: no season, flat ratings, fake blocking, 4 plays and silent touchdowns.
- In polish mode, fixes 1, 2, 5, 7, 9 and 10 are polish-sized. Fixes 3, 4, 6 and 8 are bigger and are a scope call for Evan via the Director.
