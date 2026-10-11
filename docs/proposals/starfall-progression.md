# Starfall progression: what exists, what's missing, small next steps

Grok for Adam (abarish-dev, guest), 2026-10-11. **A planning document; nothing here is built yet.** Tickets SF2.9 to SF2.17 in DEVELOPMENT-PATH. Adam asked
(PR #179) to first say which of his five goals already exist in the Godot Starfall (`starfall-godot/`), then outline
small playable steps. The experience he wants: *"We helped this person blossom, we've grown together, and there are
still exciting people and possibilities to discover."*

Sources: `starfall-godot/scripts/main.gd` and `data/stories.json` on main `a0934b6`, plus SF2.8 (#179, not merged),
`docs/plans/starfall-village.md` and the SF lines in `docs/DEVELOPMENT-PATH.md`. Scores use the
[PRIORITIES](../PRIORITIES.md) scorecard (fun x2, Evan x2, friends, focus, cheap; out of 21).

## How Starfall works today, in one paragraph

You run the guild. You pin requests from the farms on the board; each adventurer picks a job on their own (the best
reward that fits their nerve: level, +1 if spirits are high, +1 if bold), walks out of the gate **alone**, and comes
back later. Success is a chance from level against danger, plus spirits, gear, a fine piece, a tonic and the
"steady" trait. Nobody dies. You serve them at the counter, forge their gear, brew tonics, pour at the tavern and
(with #179) light the walls and spar. Each of those is done by hand first, and then a hire offers to take it over.
The town grows in ranks (Hamlet, Village, Town, Market Town) by buildings and jobs done, and each rank brings a
newcomer and a new plot.

## Goal 1: invest in people early (early recruits can become exceptional; never disposable)

**Exists**
- Levels with no cap: XP from jobs and the training yard (double next to the smithy). Each level needs `level × 20` XP
  and raises max HP.
- Gear in four tiers (plain, good, fine, masterwork), bought from the adventurer's own savings at the smithy, plus a
  one-off "fine" piece you forge by hand. Tonics before a job.
- Traits earned from story choices (bold, steady, healer, mapper, ...) that change how they work.
- Spirits ("nerve") from meals, drinks, good days, and in #179 sparring and a lit wall.
- Starters: Aki (level 2), Ren and Yuna (level 1). Later arrivals start higher: Kaito 1, Hana 2, Sora 3, and the
  visitors Mirelle and Tobin at level 4.

**Missing**
- **Nowhere to be exceptional.** Jobs top out at danger 4 (Lights in the Old Barrow). A level-8 Aki and a level-4
  Mirelle do the same jobs, so investing in someone early doesn't open anything new.
- **No signature growth.** Levels only add HP and success chance. There's no technique, title or special job that
  belongs to *your* veteran.
- Class doesn't matter on jobs (a cleric and a swordsman are judged the same way).

**Small next steps**
1. **Veteran requests** (new; feeds SF4.1). At level 5 or with 10 jobs done, an adventurer can be *asked for by name*
   on the board ("The miller wants Aki, the one who cleared the creek"). These are a few danger-5 requests that only
   that person can take, worth more, each ending with a small visible change in town: a trophy over the hall door, or
   a carter route that opens. Score 17/21: fun 3, Evan 3, friends 1, focus 2, cheap 2.
2. **One signature technique per adventurer** (new). At a level threshold each person learns one move tied to their
   class and story (Aki's "come home every time" guard: halves the hurt on a failed job; Ren's map: shorter trips).
   It's shown on their card and announced in town. Score 15/21.

## Goal 2: reward lasting partnerships (trust, teamwork, personal moments)

**Exists**
- **Members' stories (SF2.1/SF2.4):** six members (Aki, Ren, Yuna, Kaito, Hana, Sora) have three beats each, unlocked
  by jobs done (and sometimes a building). Your choice changes spirits and coins and can give a trait. These are the
  personal moments.
- Adventurers bark, show feelings (hearts, heartbreak), and leave if spirits hit bottom, coming back when things go
  well.

**Missing**
- **No trust value between you and a person.** Beats are gated on job count, not on how much you've done *with* them
  (meals served, bouts, gear forged).
- **No teamwork.** Every job is done alone, so two adventurers never become a pair who work well together.
- Stories end after three beats. There's nothing after the last one.

**Small next steps**
1. **Trust per adventurer** (new, small). +1 each time you do something by hand for them: a meal you cook, a pour, a
   piece you forge, a bout, a story talk. It's shown as a few marks on their card. Trust gates the later story beats
   (alongside jobs) and one perk at high trust (they'll take a job a step harder for you, a softer version of "bold").
   Score 17/21: fun 2, Evan 3, friends 2, focus 2, cheap 3.
2. **Pairs** (new; first small step toward parties for SF4.1). Two adventurers who come home on the same day often
   enough become *friends*: they sit together at the tavern, and a shared story line plays. Later a friend pair can
   take a two-person request together, with better odds. Score 14/21.

## Goal 3: keep new recruits exciting (different, not just bigger)

**Exists**
- Newcomers by rank: Kaito (archer), Hana (knight), Sora (monk), each with their own three-beat story. Visitors
  (Mirelle, a bold mage; Tobin, a mapper thief) come after three good days in a row, and both start with a trait.
- Seven classes with different attack and HP numbers.

**Missing**
- **Recruits are mostly bigger numbers.** Later people start at higher levels, and class doesn't change what they're
  good at, so a new level-4 visitor simply out-levels a favourite.
- No specialities: no "the archer is best against wolves", no job only a thief can do.
- No choice: newcomers simply arrive. There's no "who do we take on?"

**Small next steps**
1. **Each class has a speciality on the board** (new, small). Every job lists who suits it ("good for: archers,
   thieves"). A suited adventurer gets better odds and it's shown on the request. Recruits bring a *new kind* of
   strength instead of more of the same, and the favourites stay best at their own work. Score 15/21: fun 2, Evan 2,
   friends 2, focus 2, cheap 3.
2. **Newcomers start near your team's level, never above your best** (a fix). They arrive at the level of your
   middle adventurer and bring a trait. That keeps them exciting without making favourites look small. Pair with
   step 1. Score 14/21.

## Goal 4: give repetitive work a mastery path (better, new techniques, tools, then a helper)

**Exists**
- **"Master it, then hire" everywhere:** counter (10 meals, then Bryn), forge (5 pieces, then Garrick), pot (4
  batches, then Fen), tap (6 pours, then Tamsin), and in #179 the lantern round (3, then Odo) and sparring (5, then
  Ilse). Each hand job is a short timing game, and doing it yourself stays worth more than the hire.
- Daily things to do by hand (meals, the evening tap and, with #179, the dusk round and a bout each).

**Missing**
- **Your skill never grows.** The 10th meal is exactly like the 1st: the timing band, the rewards and the inputs never
  change, and there's no new technique.
- **No tools.** Nothing you earn makes a hand job quicker or opens a new choice at that station.
- After the hire you rarely go back.

**Small next steps**
1. **Mastery ranks per station** (new). At 10, 25 and 50 uses a station gets a named rank (Cook, Good Cook, Master
   Cook) with one visible change each: a wider gold band (less tedious), then a **new technique** with a choice, such
   as a stew that lifts spirits *or* one that heals (an interesting decision). The third rank brings a **tool** drawn
   in the world (a better ladle, a smith's apprentice hammer) that lets one press do a double batch. Score 18/21:
   fun 3, Evan 3, friends 2, focus 2, cheap 2. **Strongest single step.**
2. **Teach the hire** (new, small). Your mastery rank carries over to the hire: Bryn cooks at your rank's quality, so
   mastering first makes the helper better. Score 14/21.

## Goal 5: make unlocks feel earned and desirable (see what's next, why it matters, visible change)

**Exists**
- Ranks bring a newcomer and a new plot, and Hob staking it out is shown in town. Buildings visibly go up. Bunting
  goes up after good days. Each hire walks in and takes a visible post.
- The evening report says how the day went.

**Missing**
- **No "what's next" on screen.** COMMS (lane S) already notes there's no goal line after the opening. Hires and ranks
  arrive as surprises; you can't see "2 more rounds and a watchman might come" or "4 more jobs to be a Village".
- Some rewards are only numbers (spirits, coins).

**Small next steps**
1. **A goal line and a "Next" list** (new, small; also fixes the COMMS lane S note). One line under the status bar
   names the nearest unlock with its count ("Walk the walls 2 more nights: someone might ask to keep watch"; "4 more
   jobs: Starfall becomes a Village, with a new plot"), in the world's words, and you can tap it to see all three
   nearest unlocks. Score 18/21: fun 2, Evan 3, friends 3, focus 2, cheap 3. **Do first; it makes every other step
   feel earned.**
2. **Every unlock changes the town** (rule for new work). Each hire, rank or mastery rank adds something you can see or
   do: a lit post, a new stall, a new request type. Make it part of the "done when" of every SF task.

## Adam's priorities (2026-10-11)

> After that [darkness step 1], add the in-world goal guidance and build station mastery. Then prioritise meaningful
> adventurer investment and lasting partnerships: equipment, training, trust and veteran opportunities should help
> early recruits blossom. New recruits should offer different specialities rather than simply replace our favourites
> with higher numbers. Please turn these into separate small tickets, show the next unlocks inside the game, and test
> the 150-second day pacing during normal play. I want satisfying progression and earned convenience, without
> mandatory daily chores.

**The rule for every ticket below: no mandatory daily chores, and convenience is earned.** Hand work is always worth
doing and better than the hire, but skipping it never breaks anything. Hires, tools and mastery are earned conveniences
that take repetition away; they never take choices away.

## The order (one small PR each)

| Order | ID | Ticket | Score |
|---|---|---|---|
| 1 | SF2.9 | Darkness, step 1: a visible small creature through an unlit section, at most one incident a night ([starfall-darkness.md](starfall-darkness.md)) | 14 |
| 2 | SF2.10 | In-world goal guidance: a goal line and the next unlocks shown in the game | 18 |
| 3 | SF2.11 | Station mastery ranks (a wider band, a technique with a choice, a tool) | 18 |
| 4 | SF2.12 | The hire works at your mastery rank | 14 |
| 5 | SF2.13 | Trust per adventurer | 17 |
| 6 | SF2.14 | Veteran requests (asked for by name) | 17 |
| 7 | SF2.15 | Signature moves through training and equipment | 15 |
| 8 | SF2.16 | Recruit specialities, not bigger numbers (and newcomers near your team's level) | 15 |
| (now) | SF2.17 | Day-pacing check of the 150-second day in normal play ([measurement](../measurements/starfall-day-pacing.md)) | 14 |

## Suggested order before Adam's decision (kept for the record)

1. **Goal line and Next list** (goal 5), 18/21.
2. **Mastery ranks per station, with one technique and one tool** (goal 4), 18/21. Start with the counter.
3. **Trust per adventurer** (goal 2), 17/21, then **veteran requests** (goal 1), 17/21.
4. **Class specialities on the board** (goal 3), 15/21, with newcomers starting near your team's level.
5. Darkness with consequences (Adam's #179 note): see [starfall-darkness.md](starfall-darkness.md), option A, 14/21.

None of these has an SF ID yet. They'd sit under SF-M2 (people and stakes) as new lines, except veteran requests,
which lead into SF4.1 (expeditions). Planning (Claude) or Adam decides IDs and order. SF3.1 seasons and SF3.4 festivals
are untouched by this list.
