# Little Ranch

LR1, the smallest test of a tap-and-play toy for ages 2 to 4 (docs/proposals/games-for-everyone.md). A baby Cindercub in a sunny corner of the ranch:

- tap the **bowl** and it trots over and eats, with happy crunching;
- drag (or just tap) the **sponge** and it gets bubbly; tap the bubbles to pop them;
- tap the **bush**: it hides behind it; tap again (or wait) for peekaboo;
- tap the **baby** and it giggles; a tap anywhere else makes a sparkle and a note;
- tap the **sun**: it gets a little brighter each time, and on the fifth tap a rainbow arches over the field while the baby looks up and cheers; it fades after a few seconds and you can do it again (daytime only) (LR13);
- at night, once the baby is asleep, tap the **moon**: it glows a little more each time, and on the third tap it plays the first verse of *Twinkle Twinkle Little Star* (a traditional, public-domain tune, played softly in code) while the stars twinkle in time. The baby sleeps on with a little smile. Moon taps don't count toward the six wake-up taps; with the sound off the stars still dance (LR14).

- tap a **singing flower** (a row of five along the front of the meadow): it sings its own note and bobs, and the baby dances; run a finger along the row for a little song. Every five notes count as one happy thing. At night the flowers close and sleep (LR3).
- tap the **paint-drip sign** at the ranch's edge to visit the **Paint Shed** (LR9): four fat paint pots and a big outline of the baby. Tap a pot, then tap (or drag over) a part (head, body, tail, legs) to fill it; a tap near a part counts. When every part has colour there are sparkles and a cheer, and the painted baby walks back out to the ranch in its colours until bedtime. The barn picture goes home at any time; nothing is saved.

- tap the **hat basket** at the field's left edge (LR6): a hat hops out onto the baby's head, and each tap brings the next one: a straw sun hat, a party hat, a crown, a flower crown, a cowboy hat, then it hops back in (bare head) and round again. Every third hat is one happy thing. The hat stays on through play until the next visit.

- tap the **cloud** (LR5): soft rain falls for a few seconds (another tap keeps it going). When it stops, two puddles shine on the grass and a rainbow comes out. Tap a puddle and the baby runs over and jumps in, splash (one happy thing). The puddles dry up after about a minute. No cloud at night.

- **a second friend** (LR4): on about half of visits a baby Pebblit (the wagon's round grey friend) wanders in from the right and settles beside the baby. Tap the bowl and it trots over and eats too; tap the sponge and after the baby it gets bubbly too (or drag the sponge over it); tap it and the baby runs over and they nuzzle, with hearts (one happy thing). At bedtime it curls up and sleeps too.

- tap the **snack-bowl sign** on the hilltop to visit the **Snack Kitchen** (LR11): four big foods along the table (berries, a carrot, a lemon, broccoli) and one bowl. Tap a food and it hops into the bowl and the baby eats it. Berries: a happy yum and hearts. The others: a funny face (carrot puffs its cheeks, lemon a sour squeeze, broccoli a tongue out) and a silly sound, never a wrong answer. After three bowls of berries it's full: a cheer, and it walks home to the ranch (one happy thing). Left alone, the berries glow. The barn picture goes home at any time.

- tap the **wagon-wheel sign** on the hill to visit the **Little Wagon** (LR10): tap the two babies (or their cars) and they hop into the red and the blue car and wave; tap the wagon and a gentle ranch creature pulls it down the valley. Tap the windmill (it spins), the pond (splash) and the woolies (baa) as they roll by. A coloured gate stops the wagon: tap any car and the gate swings open with a cheer; the car of the gate's colour gets the bigger cheer, so nothing is ever wrong. At the end of the road the babies hop off and the baby walks home to the ranch. The barn picture goes home at any time; nothing is saved.

After about a dozen of those (or six minutes) it yawns, the sky turns orange and then night, a lullaby plays and it curls up asleep. That is the end of the visit: taps around it only twinkle stars, but **six taps on the sleeping baby** wake it up (it stirs and its zzz shrink with each tap; on the sixth it wakes happy, with hearts) and a fresh sunny day begins, the same as New visit (LR12). No words to read, no scores, timers, lives or wrong answers, no links out, no purchases, no feedback button.

- **Never stuck** (LR-C1): after about six quiet seconds the first thing not yet tried glows softly and bobs (then each in turn); at night it's the sleeping baby, in the Paint Shed the next part to colour. Any touch hides it. Where tap zones overlap, the nearest thing wins.

**Grown-ups:** hold the lock in the top corner for three seconds for New visit, Sound on/off, Arcade and Back to play (or tap the X, or anywhere outside the card). **App mode** (LR15): a standalone wrapper that loads `index.html?app=1`, or provides `window.LittleRanchApp.exit()`, gets just Replay, Sound and Exit; Exit calls `LittleRanchApp.exit()`. Sound is gentle and on by default; the choice is the only thing stored (`little-ranch-settings-v1`). There is no save.

Art and sounds are drawn and made in code (no assets). Checks: `node tools/run-all-checks.cjs little-ranch` (tests/little-ranch.html).
