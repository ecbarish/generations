# Ten nights of the lantern festival

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

At dusk the player chooses one of three omens. The three are drawn from the six below. Until one is chosen, prices and rates stay on the approved numbers. The chosen omen is named on the goal line for the rest of the night.

A charm is offered when the next stall unlocks: dumplings at ten tea stalls, lanterns at ten carts, mooncakes at ten stands, incense at twelve tables unless an omen or charm says otherwise, and the Story Mat at ten trays. The offer is one of three charms, or skip. One reroll is free each night. One option favours the stall that is furthest behind.

The book starts with six charms in the pool. Each night that ends adds two, up to the twelve in this pull request. Coins, stall counts, and income percents do not carry.

### Omens

| Name | What changes |
|---|---|
| Rain | Lanterns start at 770 coins. Tea earns 0.5 a second. |
| Ferry crowd | Away earnings are 75%. The box holds two hours. |
| Short wick | The Story Mat starts at 1,760,000 coins. |
| Mooncake festival | Qiao opens at six lantern stands. |
| Quiet alley | Ren waits for fourteen mooncake tables. The first tray costs 77,000 coins. |
| Long pour | Mei asks for thirty cups. The first tea stall costs 5 coins. |

### Charms

The first six are in the pool on night 1. The last six join two at a time.

| Name | What changes |
|---|---|
| Mei's regulars | Tea stalls start at 5 coins. |
| Bo's queue | Dumplings double at 22, then at the usual later marks. |
| An's paper | Lanterns grow at 1.065. |
| Qiao's moulds | Mooncakes grow at 1.04. |
| Ren's sticks | The first tray costs 63,000 coins. |
| Wen's discount | The Story Mat starts at 2,000,000 coins. |
| Mei's quick pour | Tea earns 0.5 a second. |
| Bo's steam | A dumpling earns 1 coin a second. |
| An's offcuts | The first lantern costs 640 coins. |
| Qiao comes early | Qiao opens at eight lantern stands. |
| Ren comes early | The tray opens at ten mooncake tables. |
| Wen's patience | Later mats grow at 1.32. |

## Pacing

The approved evening stays the default. With no omen and no charm, the first Story Mat is still bought between minute 20 and minute 30, and the tenth mat is still bought between minute 45 and minute 55, on the same human-buyer and fast-buyer measures as the pacing pass that set those windows.

A seeded night may take an omen and may take charms. Across several seeds, for a buyer who skips charms and a buyer who takes the charm that helps the stall just opening, both mat times stay within 25% of that default night. Nights are not shortened by remembered vendors. That head-start is not in this pull request, so the 15 to 20 minute target for later nights is not enforced here.
