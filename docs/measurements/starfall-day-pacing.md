# Starfall: the 150-second day in normal play (SF2.17)

Grok for Adam (abarish-dev, guest), 2026-10-11, on main `76f73aa` (after SF2.8). **Measurement and recommendations
only; no game numbers were changed.** Adam asked to "test the 150-second day pacing during normal play" and wants
"satisfying progression and earned convenience, without mandatory daily chores."

## How it was measured

`starfall-godot/tests/pacing_sim.gd` (a measurement script, not part of the test suite) plays the real game headless
for **10 days (1,500 s)**, three seeds per player type:

- **board:** pins jobs on the board, answers anyone who asks for a word, and builds. **No hand jobs at all.**
- **hand:** also does every hand job (counter, forge, pot, tap, the lantern round, sparring) whenever one is waiting,
  and **takes each hire as soon as it's offered**.
- **hand, no hires:** does every hand job and never hires.

The world runs at normal speed. Everything the player does costs the real time it takes: walking there at the
player's speed along the real route, plus the action itself (a serve 1.5 s, a pour 2 s, three forge strikes 2.5 s, a
brew 4.5 s, a bout 5 s including the partner walking over, about 0.8 s per lantern, the board 3 s). The player stops
a timing game in the gold 70% of the time. Builds go in a fixed order: smithy, tavern, apothecary, yard. Raw numbers
are in `starfall-day-pacing.json`. Re-run with
`Godot --headless --path starfall-godot -s tests/pacing_sim.gd` (about 40 s).

## Results (average of 3 seeds)

| | board only (no hand jobs) | hand + hire when asked | hand, never hire |
|---|---|---|---|
| Coins after 10 days | 14 to 127 (started with 100) | **2,933 to 3,426** | 1,543 to 2,067 |
| Jobs done | 3 to 20 | **85 to 106** | 36 to 47 |
| Adventurers' spirits on day 10 (0 to 10) | **0.5** | 9.9 | 10.0 |
| Days judged "hard" | **7 of 10** | 0.3 | 2.3 |
| Player busy (share of the day) | 12 to 26% | 79 to 85% | **90 to 98%** |
| Busiest days | | days 1 to 4: 108, 133, 152, 149 of 150 s | every day: 117 to 158 s |
| Market Town reached | never | day 5 to 6 | day 7 to 9 |

**When the hires arrive** (hand + hire, in days): Bryn 1.9 to 2.5; Odo 2.9 to 4.0; Garrick 3.4 to 4.2; Ilse 4.2
to 5.4; Fen 2.9 to 5.9; Tamsin 5.3 to 7.9 (not at all in one seed: too few tavern customers for 6 pours). **Ranks:**
Village 1.4 to 2.4, Town 3.0 to 4.2, Market Town 5.0 to 6.1.

**Hand jobs that fit in a day** (hand, never hire, days 4 to 10): about 4 to 6 meals, 1 to 2 pours, 1 to 3 forge
pieces, 1 to 2 brews, 1 lantern round and, once the yard stands, 2 to 6 bouts. They fill the whole day.

**Where the player's time goes:**
- **The board** is the biggest single cost: about 67 s a day once things are busy (hand + hire). Only two jobs can be
  pinned (`MAX_POSTED = 2`), and an attentive player walks back every time one is taken.
- **The lantern round** costs about 39 to 40 s each night: about 60% of the 67-second evening, or a quarter of the
  whole day, for 4 coins and +1 spirits.
- **The counter** costs about 25 to 30 s a day until Bryn comes.

## What this means

1. **Skipping hand work is not fine yet: the counter is a mandatory chore.** With no hand jobs at all, nobody is fed,
   spirits fall from 6 to about 0.5 in ten days, 7 of 10 days are hard, adventurers walk out, and the town hardly
   grows. Meals are the only steady source of spirits before the tavern, so the first ~2 days of cooking (10 meals,
   until Bryn) are compulsory. That's fine as a tutorial, but harsh if a player wants to play "manager only".
2. **Hiring is strongly rewarded, which is good earned convenience.** Hand + hire ends with about 1.8× the coins and
   over 2× the jobs of never hiring, because the player's freed time goes to the board and building. Each hand action is
   still worth more than the hire's (by design), but time is the limit, so a player who refuses hires is busy 90 to
   98% of every day doing chores.
3. **Days 1 to 4 are completely full** even for the efficient player (72 to 100% busy). After the hires the day
   relaxes to about 65 to 80%, and most of that is the board.
4. **The lantern round is too long for what it gives** if it's done every night (~40 s for 4 coins and +1 spirits),
   and with darkness (SF2.9) coming it will feel like a chore unless it stays clearly optional.
5. **Spirits max out** (9.9 to 10 by day 4 to 5 when you work by hand). Sparring and the lit wall add nerve to people
   already at 10, so their value disappears mid-game.
6. **A small bug the simulation tripped over:** if the guildmaster stands still on the spot in front of the board
   (7, 8), adventurers coming to read it wait beside it for ever and never take a job. A real player usually moves
   on, but an idle player standing there stalls the guild.

## Recommendations (for the tickets; nothing changed here)

- **Keep the 150-second day.** It's a good length once hires arrive. Instead, ease the first days and cut walking:
- **Make the counter forgiving before Bryn** (no mandatory chore): a hungry adventurer left unserved eats "dry bread"
  without losing spirits the first time each day, or Bryn covers the counter at half quality until you've hired her.
  Spirits then fall only for real neglect. The SF2.10 goal line can say "Serve 4 more meals: Bryn will offer to cook".
- **Board convenience as an earned unlock:** let a pinned job stay pinned after someone takes it (a standing order),
  or raise `MAX_POSTED` to 3 at Village and 4 at Town, or add a hire (a clerk) after N pins. This is the single
  biggest time cost. It fits SF2.10 and SF2.11.
- **Shorten the lantern round** to about 15 to 20 s: light the gate and watchtower lanterns from one spot, or place
  the four lanterns nearer the square. Keep it optional: a dark night only risks the one SF2.9 incident.
- **Make sparring and the lit wall matter at full spirits:** for example, a bout at 10 spirits gives a little
  XP or trust (SF2.13) instead of nothing.
- **Tamsin's unlock** sometimes never comes in 10 days (too few tavern customers). Count pours or evenings open, or
  lower 6 to 4.
- **Fix the board-spot stall:** let adventurers read the board from any side (beside the board, not only at
  `READ_AT`), or have them ask you to step aside.
- **Optional bonuses, not chores:** after its hire, every hand job should be a pure bonus (it already is). Before the
  hire, only the counter is truly needed; with the fix above, nothing is.

## After the fixes (Adam: "Do your suggestions")

Re-measured with the same script, the same three seeds and the same 10 days, after each fix. ("Wins" means jobs
finished successfully.)

### After SF2.18, no mandatory chores

What changed: a stew pot feeds anyone left waiting (4 coins, no lift in spirits; a hand meal is 8 and +1), and the
whole line waits together, so nobody queues all day. You light a wall lantern by walking within 4 tiles at dusk. A
bout or drill past full spirits becomes practice. Adventurers read the board from anywhere along its front.
Raw numbers: `starfall-day-pacing-sf2.18.json`.

| | board only (no hand jobs) | hand + hire when asked | hand, never hire |
|---|---|---|---|
| Coins after 10 days | **1,057 to 1,588** (before: 14 to 127) | 2,731 to 3,391 (before: 2,933 to 3,426) | 1,291 to 2,045 |
| Wins | 64 to 90 (before: 3 to 20) | 60 to 95 | 36 to 50 |
| Spirits on day 10 | **7.8** (before: 0.5) | 9.9 | 9.8 |
| Busy, days 1 to 4 (s of 150) | 56 to 64 | **89, 94, 122, 116** (before: 108, 133, 152, 149) | 85 to 152 |
| Lantern round | | **about 21 s** (before: 40) | about 24 s |
| Market Town | day 4.7 to 5.5 | day 5.0 to 7.2 | day 6.2 to 6.8 |

- **Skipping hand work is now fine:** the town stays solvent and spirits hold at 7 to 8 instead of collapsing.
- **Hand + hire is still clearly best for coins** (about 2.4× the board-only player), with spirits at the top. But
  the board-only player now reaches the ranks about as fast, because rank counts wins and buildings, and that player
  spends all their time on the board. Something for SF2.10 and SF2.11 to reward: mastery ranks should make hand work
  count toward the town's growth.
- **Days 1 to 4 are no longer full** for the efficient player (59 to 81% busy).
- Tamsin still didn't come in one seed (SF2.20).

### Six seeds: before, SF2.18, SF2.19 (dropped) and SF2.20

Three seeds were noisy, so every version is re-run with six seeds (`-- 6`: seeds 11 to 66) using the same script.
Averages, with the range in brackets. Raw: `starfall-day-pacing-6seeds-*.json`.

| | before (`1f19d35`) | SF2.18 (`a0e4787`) | SF2.19 extra pins (dropped) | SF2.20 Tamsin |
|---|---|---|---|---|
| **Board only:** coins | 76 (17 to 177) | **917** (408 to 1,353) | 851 | 889 (44 to 1,315) |
| **Board only:** wins | 15 | **61** | 44 | 54 |
| **Board only:** spirits on day 10 | 1.1 | **8.1** | 6.2 | 7.8 |
| **Hand + hire:** coins | 3,018 | 3,605 | 3,424 | 3,267 (2,779 to 3,606) |
| **Hand + hire:** wins | 86 | 98 | 91 | 92 |
| **Hand + hire:** busy, days 1 to 4 (avg s of 150) | 120 | 125 | 118 | 120 |
| **Hand + hire:** lantern round | 30 s | 21 s | 22 s | 21 s |
| **Hand + hire:** Garrick hired in 10 days | 6 of 6 | 5 of 6 | 3 of 6 | 6 of 6 |
| **Hand + hire:** Tamsin hired in 10 days | 2 of 6 | 5 of 6 | 0 of 6 | 5 of 6 |
| **Hand + hire:** Tamsin hired, average day | 7.8 | 6.3 | | **4.7** (median 4.1) |

- **SF2.18 does what it should.** A player who skips hand work stays solvent and spirits hold at about 8 instead
  of collapsing. Hand + hire stays clearly best (about 3.7 to 3.9× the skip player's coins, and the most wins). Days 1
  to 4 run at about 80% busy for the efficient player, not 100%; the rest of the time goes to the board, now the main
  remaining chore.
- **SF2.19, more pins at Village and Town, was dropped by Adam on 2026-10-11 after this re-measure.** It saved only
  about 3 s of board walking a day. With more adventurers out at once, fewer were home in the evenings and at the
  smithy, so Tamsin was hired in 0 of 6 runs and Garrick in 3 of 6, and the skip player's spirits fell from 8.1 to 6.2
  and wins from 61 to 44. If board help comes back, it should cut the walking, not add slots: for example, a pinned
  job that stays pinned.
- **SF2.20:** Tamsin now also asks after **3 evenings you kept the tap yourself** (at least one drink poured by hand
  that evening), as well as after 6 pours. She comes about 1.6 days sooner on average (median day 4.1). One run of six
  still didn't reach her in 10 days. Run-to-run noise is large, so the coin differences between SF2.18 and SF2.20
  (3,605 vs 3,267 for hand + hire) are within the spread; nothing else changed.

## Limits of this measurement

It's a scripted player: teleporting between actions (but paying the walk time), a fixed build order (the healer is
never built), first story choice each time, and 70% timing skill. Real players wander, read and chat, so they'll be
busier than this. These numbers are a lower bound on how full the day is.
