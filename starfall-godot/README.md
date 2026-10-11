# Starfall in Godot: the guild's town

Starfall Guild growing into a village (docs/plans/starfall-village.md; Evan, 2026-10-08). You are the guildmaster of a
small frontier town. This is the first slice.

## Play it
Double-click **Play Starfall.bat** (Godot is unzipped in `C:\Users\evanb\Godot`). Arrow keys or WASD to walk, or click
and tap where to go. Enter, Space or E to talk and to use things. Click or tap the board or the counter to walk up and
use it.

## What's in it
- **The town:** the Guild Hall, the Lantern Inn with its counter (a striped awning and a pot of stew), the guild board,
  a well and a watchtower inside a log palisade, with the gate to the wilds in the west wall (SF2.6). The town is bigger
  than the screen and scrolls as you walk. Drawn with Starfall's own frontier pictures (`assets/env/frontier/`, ART-SF);
  the people are the same parts-built people as Wildbond's Godot version.
- **The guild board:** three requests from the farms each day (Easy, Risky, Dangerous, Deadly). Pin up to two. Your
  adventurers (Aki the Swordsman, Ren the Mage, Yuna the Cleric) choose for themselves by their level and their nerve; a
  bold one may take a job a step too hard.
- **Jobs:** they walk out through the gate, and come back later with the guild's share of the reward (three coins in
  ten), or without it if it went badly. Hurt either way; badly hurt ones wear a bandage. **Nobody dies:** a disastrous
  job means being carried home for a long rest.
- **The inn's counter, by hand:** hungry adventurers come straight to the counter. Stand behind it and serve them (eight
  coins a bowl). Keep them waiting too long and they give up, grumbling.
- **Bryn:** after you've served ten meals yourself, Bryn the cook offers to take the counter for ten coins a day. She
  serves on her own from then on. Can't pay at the end of a day, and she goes back to her own kitchen.
- **Rest:** fed adventurers go up to bed at the inn (a lit window for each) and come back out when they're well.
- **Building on the plots:** two staked-out plots (west and east). Walk up to one for Hob's plans: **the Healer's Hut**
  (120 coins: badly hurt adventurers go to Ama, and mend twice as fast) or **a Training Yard** (150 coins: adventurers
  with nothing to do practise there and slowly gain experience). Hob's crew put it up behind scaffolding while you watch.
- **The town's rank:** Hamlet, then Village (a building and six jobs done), then Town. Each new rank brings a newcomer
  through the gate looking for the guild (Kaito the Archer, then Hana the Knight). The rank shows at the top.
- **More ground as the town grows:** a Village gets a plot in the north, a Town one in the south. Four buildings to
  choose between, each once.
- **The Smithy, worked by hand:** adventurers keep their share of each reward, and when they have saved enough for
  better gear (40, 80, 130 coins) they come to the smithy door. Stand at the anvil beside them and press E: a bar
  over the anvil with a glowing middle and a spark sliding to and fro. Strike three times while the spark is in the
  glow; three good strikes make **fine** work. Better gear means more jobs done and fewer bruises. After five pieces,
  **Garrick** the smith walks in and asks for the forge (twelve coins a day); then he forges without you.
- **The Apothecary:** jobs by the creek, the farms and the woods bring herbs home. At the shelf, brew three tonics
  from two herbs (you stir the pot), and set the price on the slate: Cheap, Fair or Dear. Adventurers buy a tonic
  before a risky job if the price seems fair to them, leave the coins in the jar, and come home half as hurt. Too
  dear, and they go without.
- **Members' stories:** each adventurer has a short arc. When one is ready (a few jobs done, spirits up) they ask for a
  word and a **!** shows over their head. Talk to them, hear them out and choose what to say; your answer stays with
  them: spirits, sometimes coins, sometimes a trait for good (steadier on every job, braver, a map that pays, quicker
  to mend). Aki's sister, Ren's nerves and his map, Yuna's charity and her lessons with Ama. The stories are in
  `data/stories.json`.
- **Music:** a bright tune through the working day, a gentler one as evening comes. Press **M** to turn it off and on.
- **The end of each day:** a short report at the foot of the screen (jobs done or gone badly, meals, coins), wages, and
  new requests on the board in the morning. No interruptions during the day.
- **Saving:** the town saves itself every few seconds and when you close the window (user://starfall.json).

## For assistants
- `scripts/main.gd`: the whole town (the frontier stockade map, drawn from `assets/env/frontier/` (SF2.6), people, adventurers' decisions, the counter, Bryn, the board, saving).
  `scripts/figures.gd` is copied from wildbond-godot (keep them in step until shared code has its own home).
- **Checks:** `Godot_v4.7.2-stable_win64_console.exe --headless --path starfall-godot --script res://tests/run_tests.gd`
  (96 checks on 2026-10-08). Run the game with `-- --no-save` to try it without touching the real town (add `--built`
  to start with the hut built and the yard going up, or `--market` for all four buildings).
- Next slices (docs/plans/starfall-village.md): more places to run by hand (the smithy, the apothecary), more plots as
  the town grows, guild members' stories, seasons as chapters.