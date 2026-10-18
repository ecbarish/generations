# One creature catalogue, richer evolution, gear and tamer abilities

Evan, 2026-10-08: build a larger creature catalogue and use the creatures as enemies in Realmbound too, "so no asset
goes wasted"; evolution with different types and conditions (Eevee's branches, single and triple lines, creatures that
never evolve like Hitmonlee); armour for creatures; abilities on the tamer that enhance or interact with the creature.
Claude's plan below; Evan can change any of it.

## Where we are (checked 2026-10-08)

Wildbond has 81 species in ten families (wolf, cat, hyena, lizard, croc, boar, horse, bird, spider, sprite). **Only 10
evolve, all the same way** (one step at a level: Cindercub becomes Blazefang at 14). Three hybrids come from breeding
(cat + wolf = Lynxhound). Eight are unique guardians. Every creature in the Godot version is drawn from parts by family
(`wildbond-godot/scripts/figures.gd`), and the creature rules are shared in `shared/creatures.js`.

## 1. One catalogue for the arcade

- **One list of creatures** (`shared/catalogue`: names, family, element, looks, lore, where they live in each world),
  exported for Godot like Wildbond's data today. Wildbond is its first user; **Realmbound's beasts come from it** (wolves,
  boars, drakes and spiders in its zones become catalogue creatures drawn in Realmbound's style), and Otherworld and
  Starfall can borrow from it later.
- Fits the shared universe (docs/lore/multiverse.md): the same kinds of creature live in several worlds, a deliberate
  link; each game keeps its own rules (a tamer bonds with them, a Realmbound hero fights them).
- Bodies built from parts mean a new creature is mostly data (colours, proportions, horns, wings, patterns), so a large
  catalogue is affordable.
- **Target:** grow Wildbond from 81 to about 150 over several batches (ChatGPT's W11 starts this), filling every family
  and element.

## 2. Evolution with shapes and conditions

**Shapes** (each line is one of these):
- **Stays itself:** never evolves, and is stronger or stranger for it (higher base stats or a signature move).
- **Two stages** (today's kind) and **three stages** (a long journey with a creature).
- **Branching:** one young creature, several possible adults, chosen by how you raise it (the Eevee kind).
- **Late bloomer:** looks plain for a long time, then changes dramatically under one rare condition.

**Conditions** (a line can use any, and several can combine):
- Level (as now), **trust** (bond level), **time of day** or **weather** (both already exist), **place** (beside
  Emberfall's springs), an **item or gear** worn, **how it fought** (won a battle in the rain, guarded its team often),
  **what it ate** at the ranch, or **its partner** (raised beside a certain creature).
- **Readable, not secret:** once you've seen a creature, the Wilddex records what you've learned ("Maren thinks it
  changes when it trusts you completely"), and people in the world drop hints.
- **Never forced:** when a creature is ready you can say "not yet".

## 3. Gear for creatures

Harnesses, light armour, charms and bands, made at the ranch or found. Each piece does one thing (shrug off burns, a
first strike in the rain, calmer when bonding) and **shows on the creature** (the parts system can draw it). Some
evolutions need a piece of gear worn at the right moment.

## 4. Tamer abilities

The tamer already gives orders in battle (Guard, Rally). Grow that into the tamer's own abilities:
- **Learned from people and Wardens** (Toren teaches Steady: calm a frightened creature mid-battle) and from your
  **heritage** (a coastfolk tamer reads the tide).
- **In battle:** a few orders that help your creatures in your own way, charged by what happens in the fight.
- **In the world:** creatures you trust help you (a strong creature moves a boulder, a water creature carries you across
  a stream), earned through bond rather than taught by a machine.

## 5. The wild bond: fusing with a creature (Evan's idea, 2026-10-08)

> Historical design. Evan's 2026-10-18 [Mega-style direction](../plans/wildbond-world/stand-with-it.md) supersedes the hidden near-defeat activation requirements below for future work. Preserve the history and audit existing lore before replacing literal fusion presentation. The native chapter has not yet implemented this new system.

Evan: an ultimate power for a creature you've maxed your bond with: you fuse and become an ultimate form for the
toughest battles (Digimon, Power Rangers). Not usable every fight with no reason not to (Pokémon's Mega Evolution),
not reserved for a scripted story moment; it happens when you're backed against a wall and push beyond the limit, and
it is **discovered**, not taught: only mentioned here and there as a legend.

**The legend gives the game its name.** Nothing in the story says yet why the game is called Wildbond. Old people,
signs and ruins speak of "the wild bond": in the oldest days a tamer and a creature who trusted each other completely
could, at the edge of defeat, become one. Nobody alive has seen it; most think it's a story for children. Hints are
scattered and vague (Tobin's grandmother's tale, a carving at a ruin, a line from Toren about the watcher in the
mountain, a faded page in an old Wilddex). Never a tutorial, never a menu entry before it has happened.

**When it can happen** (all must be true; none of it is ever shown as a checklist):
- That creature's trust is at the highest level (Kindred).
- The battle matters: a Warden, a guardian, a rival, a league battle, or a foe clearly stronger than your team. Never
  against an ordinary weaker wild creature, so it can't be farmed.
- You are backed against the wall: that creature is your last one standing, badly hurt, and you didn't run.
- It hasn't happened yet that day.

**How it happens:** the creature looks back at you. For a moment the screen holds; one new choice appears in the
battle orders with no explanation, just its words ("Stand with it."). You hold the button rather than tap it (digging
your heels in). Colour floods the whole battlefield, the tamer and creature become one form (the tamer's figure
wearing the creature's shape like living armour, drawn from both sets of parts), and a short, earned moment plays.

**Why it isn't used every fight:** it lasts a few turns; it can turn a lost battle but doesn't guarantee a win; after
it ends both of you are spent (the creature rests until you next rest, and your own tamer abilities are used up).

**After the first time:** the field book gains a page about the wild bond, people react when they hear of it, and it can
happen again under the same conditions. Each family has its own fused form; branching evolutions give different ones.
Challenge modes can turn it off.

**Lore:** this ties to the colour returning with trust (the fullest trust there is floods everything with colour) and to
the old watchers older than the Wardens. Keep it in docs/lore/wildbond.md when it is built.
## Order

1. Evolution shapes and conditions in the Godot rules, with the first branching line and the first three-stage line
   (Claude, with checks), then convert the existing ten.
2. The catalogue file and W11 batches (ChatGPT: data and lore; Claude: bodies and checks).
3. Creature gear at the ranch (after the ranch becomes a place).
4. Tamer abilities with heritages; then the wild bond (it builds on trust, tamer abilities and fused bodies), with
   its scattered hints written into the areas as they are built.
5. Realmbound's beasts from the catalogue (when Realmbound moves to Godot, or sooner for the data).
