# Ten nights of the lantern festival

Evan approved this roguelite on 23 October 2026, relayed by the Generations Director. That approval includes the night ending at the first Story Mat, with Keep the lane open left for endless play. He also ruled that nothing has shipped, so there is no separate save and no migration. The game keeps `night-market-save-v1` and changes the file in place.

A night is one run of the lane. It ends when Old Wen unrolls the Story Mat and tells tonight's chapter. That is the first Story Mat, not the tenth. The lanterns dim and the tortoise moment plays then. Ten nights make the festival. Night *n* tells chapter *n*. This pull request builds the loop. The tenth-night ending, and the longer tale that goes with it, wait.

After the mat, the dawn panel offers two buttons.

- **Next night** clears the coins and the stalls and starts a new seeded night. The Lantern Book stays.
- **Keep the lane open** leaves this lane running, including the later mats and the last chapter.

Nothing is chosen for you. A pick that is waiting when you leave is still waiting when you come back. The stalls keep earning. Away time never fails a night.

## What this pull request ships

1. A night number and a seed. The same seed plays the same night.
2. The dawn panel above, at the first Story Mat.
3. Six omens and twelve charms. Each one changes a price, a rate, an unlock, a hire count, a milestone list, or the away box. None of them adds a multiplier or a currency. The lane light stays the only extra multiplier.
4. One save that holds the lane and the Lantern Book. The book lists nights, omens, and charms you have seen.
5. Pacing checks across several seeds. The default night, with no omen and no charm, keeps the approved prices and the approved mat times.

Left for the next pull request: lines that answer last night, vendor tales, visitors, the other twelve omens and charms, tiers, bells, and the night-10 ending.

## Evan's ruling on the save

Nothing here has shipped, so there is no old-save migration and no second save key. The game still uses `night-market-save-v1`. The file's version becomes 2 and gains `night` and `meta`. A version 1 file is not read. The next save replaces it with a fresh night. A file newer than version 2 is still refused and left on disk.

## How a night differs

Night 1 starts from seed 1. Next night steps the seed with a fixed mixer, so a festival is reproducible from the first seed.

At dusk the player chooses one of three omens. The three are drawn from the six below. Until one is chosen, prices and rates stay on the approved numbers. The chosen omen shows on its button, and in the cash box when it changes the away pay. The goal line keeps naming the next stall.

A charm is offered when the next stall unlocks: dumplings at ten tea stalls, lanterns at ten carts, mooncakes at ten stands, incense at twelve tables unless an omen or charm says otherwise, and the Story Mat at ten trays. The offer is one of three charms, or skip. One reroll is free each night. One option favours the stall that is furthest behind.

The book starts with six charms in the pool. Each night that ends adds two, up to the twelve in this pull request. Coins, stall counts, and income percents do not carry.

### Omens

| Name | What changes |
|---|---|
| Rain | Tea earns 0.52 coins a second instead of 0.45. Lantern stands cost 10% more from then on, 700 to 770. |
| Ferry crowd | Dumplings earn 1.05 coins a second instead of 0.9. Mooncakes cost 15% more, 6,400 to 7,360. While you're away, stalls earn 75% instead of half, and the box fills in 2 hours instead of 4. |
| Short wick | Story Mats cost 20% less from then on, 2,200,000 to 1,760,000. Incense earns 460 coins a second instead of 540. |
| Mooncake festival | Qiao opens at 6 lantern stands instead of 10, and mooncakes earn 34 coins a second instead of 40. |
| Quiet alley | Trays cost 10% more from then on, 70,000 to 77,000, and wait for 14 tables instead of 12. Tea stalls cost 5 coins instead of 6. |
| Long pour | Mei wants 30 cups instead of 25, and tea earns 0.52 coins a second instead of 0.45 once she has the stall. |

### Charms

The first six are in the pool on night 1. The last six join two at a time.

| Name | What changes |
|---|---|
| Mei's regulars | Tea stalls cost about 17% less from then on, 6 to 5. |
| Bo's queue | Dumplings first double at 22 carts instead of 25. Offered only while the row is still under 25. |
| An's paper | Lanterns earn 6 coins a second instead of 5. |
| Qiao's moulds | Mooncakes earn 48 coins a second instead of 40. |
| Ren's sticks | Incense trays cost about 10% less from then on, 70,000 to 63,000. |
| Wen's discount | Story Mats cost about 9% less from then on, 2,200,000 to 2,000,000. |
| Mei's quick pour | Tea earns 0.54 coins a second instead of 0.45, before the row's doublings and the lane light. |
| Bo's steam | Dumplings earn 1.08 coins a second instead of 0.9, before the row's doublings and the lane light. |
| An's offcuts | Lantern stands cost about 9% less from then on, 700 to 640. |
| Qiao comes early | Mooncakes open at 8 lantern stands instead of 10. Offered only while that stall is still shuttered. |
| Ren comes early | Incense opens at 10 mooncake tables instead of 12. Offered only while that stall is still shuttered. |
| Wen's patience | Later Story Mats cost 20% more each, instead of 36%. Offered only after Keep the lane open. |

## Pacing

The approved evening stays the default. With no omen and no charm, the first Story Mat is still bought between minute 20 and minute 30, and the tenth mat is still bought between minute 45 and minute 55, on the same human-buyer and fast-buyer measures as the pacing pass that set those windows.

A seeded night may take an omen and may take charms. Across several seeds, for a buyer who skips charms and a buyer who takes the charm that helps the stall just opening, the first Story Mat still lands between minute 20 and minute 30. The tenth mat stays within 25% of that default night. Nights are not shortened by remembered vendors. That head-start is not in this pull request, so the 15 to 20 minute target for later nights is not enforced here.

A charm is offered only when it can still change this night. A stall that is already open is not offered an earlier unlock. A doubling that has already passed is not offered again. Story Mat growth is offered only after Keep the lane open. The offer can be one or two charms when three would include a dead one. The lead says to pick a charm for tonight, or skip.
