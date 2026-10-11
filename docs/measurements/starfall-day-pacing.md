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

## Limits of this measurement

It's a scripted player: teleporting between actions (but paying the walk time), a fixed build order (the healer is
never built), first story choice each time, and 70% timing skill. Real players wander, read and chat, so they'll be
busier than this. These numbers are a lower bound on how full the day is.
