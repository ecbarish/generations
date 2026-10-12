# Realmbound first-session audit: 2026-10-11 (RB-PLAY1)

Evan stopped the second-raid task before implementation: deeper content is behind substantial progression, while the opening still needs stronger player evidence. Raid claim #213 was reverted and closed. No raid content was built.

## Existing evidence

Claude's 2026-10-09 first-look pass scored Realmbound 14/18. It describes character creation and the opening questgiver, and flags ability readability/panel layout. Pass 2 says readability fixes landed but were not re-scored. This is useful AI evidence, not proof that human newcomers enjoy the first hour, form a party or reach the level-60 Hollow Key raid.

## Observed UI walkthrough

Own checkout at main 5d5f7fc, isolated Chromium context, 1366x768. Created Rowan as the default Concord Human Warrior. Used only visible controls/keyboard input during the walkthrough; did not inject XP, gear, quest progress or a completed quest. Read source afterward to diagnose observed behavior. Other user saves were not accessed.

- Creation and the arrival explain the first request. The arrival waits for Continue; the first fight waits for an ability input.
- Pressed Brutal Strike, fought Young Wolves and opened the Journal after the objective reached 8/8. During pauses for observation/diagnosis, combat fallback continued leveling the hero. This is NOT a timed ten-minute-human completion benchmark.
- The ready quest offered two return buttons. Outside town, clicking one only closed the book and gave a brief Map instruction; it had not selected or granted a reward.
- The Map's Go to town looked enabled during combat, but clicking it refused travel and closed the book. Putting away the Map and catching the loot/seek interval allowed the normal ten-second journey.
- In Focus, idle town arrival said Off to the Smithy, then the road. The hero performed the automatic town route and left without my choosing it. Before captures show this behavior; source confirmed the fifteen-second combat fallback also controlled town errands and service access.
- After the narrow fixes below, returned to Farmer Aldous through the Journal's walking link, heard his portrait dialogue, selected the Gloves and received the existing 65 copper / 420 XP reward. Reload preserved 1/8 quests complete, the item and the money.
- The same saved Journal was inspected at 375x812. Recovery through the Keeper was separately exercised in staged UI fixtures, rather than falsely claiming it occurred in the natural walkthrough after injury (the natural hero had already recovered/leveled).

## Fixes in this PR

1. Focus town visits stay manual even after combat's idle fallback becomes active. The hero does not start an automatic smith route, buy repairs or leave town; Inn, Smithy, Trainer and Stable access remain available. Explicit Auto retains its existing route. Switching to Focus cancels a pending automatic town path. Combat fallback itself is unchanged.
2. The Map disables Go to town during combat/dungeons and explains the restriction beside it, including putting away the Map before finishing a fight. Existing travel rules/time are unchanged.
3. Ready-request links outside town open the Map, retaining the reading pause, and describe meeting the giver/choosing rewards in town. They do not grant or select rewards. In town, the existing walking link and portrait choices remain.
4. Ready to return appears on the carried Journal button. Previously the existing ready marker was only inside the closed book's tab bar, where a newcomer couldn't see it.

No new content, saves, versions, balance formulas or Godot changes.

## Checks and limits

All 18 suites pass locally on this branch's main baseline. Thirteen added Realmbound scenario assertions cover idle Focus ownership, deliberate Keeper recovery, explicit Auto, cancelling an automatic route, travel restrictions, the visible Journal marker and non-transactional quest navigation. The final Realmbound/runner-safety rerun passes with 8921 scenario checks.

The four-size browser regression separately stages a first-quest-ready, idle Focus visit to check the actual NPC/reward/Keeper UI and reload at phone, laptop, desktop and ultrawide sizes. Those fixtures are not a second natural playthrough. [Evidence](../screenshots/realmbound-first-session/README.md).

This does not award a new independent fun score, prove a full first hour, validate every class/faction, test physical touch hardware, or validate parties/dungeons/raids. Menu reads and scene dialogue pause the world; some test-harness attempts hit covered/hidden controls, which were corrected and are not reported as game bugs.

## What comes before another raid

Ask two people unfamiliar with Realmbound to try 10-20 minutes without coaching: create a hero, finish one request, choose/equip its reward, find recovery and reload. Record where they stop, what they think Focus/Auto mean and whether they want another quest. Give tasks, not navigation instructions. Then test the first companion/party and normal dungeon before adding another endgame tier.

The most important design question is early agency: Focus still falls back to combat autopilot after inactivity. An explicit next-encounter choice and delegation earned after mastery are worth testing against the current loop. This PR fixes town ownership; it does not silently replace combat or decide that larger question. The empty narrator portrait frame and some overlapping newcomer information are smaller polish observations.
