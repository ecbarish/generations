# Wildbond in Godot: the trial

Evan (2026-10-07) wondered whether Wildbond should become a standalone game rather than a browser game. This folder is
a small trial in the free **Godot 4** engine to find out how it feels and how well the assistants work in it, before
deciding (START-HERE.md "Questions for Evan" 1; docs/wildbond-plan.md).

## Unreleased

- #458 (merged 06bb9ec, 2026-10-15): Clicks now land on the title buttons, Sign the register, Choose, Fight, and Catch, and each click activates the button once. A release that never had a press is still ignored, and touch still chooses Fight and Catch. Holding a direction now keeps up with a tap, stays continuous, and stops within one tile when the key is released. Choose is the highlighted button on the starter card, on desktop and in the upright phone frame. A creature with no painted sheet stands at battle size and keeps that size while it idles. Bogsnap and Glimmerwing keep the painted fronts from #462. Turn-order names on the landscape battle show in full. Walking height follows the locked curve. Each click, tap, or key press advances exactly one battle line. The press that closes Maren's conversation does not start it again. The menu opens on the same frame, and presses buffered during a door or a menu transition are dropped. After her barn dialogue, the speech box sits clear of the objective banner and the status bar, and the objective tracker moves off the stall signs. The catch timing bar crosses in well under a second, and a throw shows "In the green!" or "Missed the green". The guided first catch still fills the whole bar. The web pack in that merge includes these fixes. Godot Wildbond has no version number, so this is a changelog line only.
- #462 (merged 81e6ace, 2026-10-15): Bogsnap and Glimmerwing get real battle art and overworld sprites, in place of the blocky placeholders. The web pack in that merge includes the new art. Godot Wildbond has no version number, so this is a changelog line only.
- WB-PHONE (merged #431, 2026-10-15): Wildbond now plays upright on phones, with a d-pad, A, B and Menu under the picture. The web pack in that merge includes this layout. Godot Wildbond has no version number, so this is a changelog line only.
- The live web build now includes #429. The re-export in #443 (2db670b, 2026-10-14) put the Larkhaven menu, single taps that no longer also sign or choose, the status bar, and Catch in battle into the pack that players load. Godot Wildbond has no version number, so nothing is bumped.
- WB-BUNDLE-1 (merged #429, 2026-10-14): The menu works again in Larkhaven. The tap that opens the register, card or battle menu no longer also signs or chooses. Speech advances only on a press. Not published.
- WBL-2 (merged #418, 2026-10-14): a battle opens on your action menu. Your lead creature starts with a full turn meter, so a quicker foe no longer strikes or winds up before you choose. A battle in which every foe is already down ends instead of opening a menu. Not published.
- WBL-6 (merged #406, 2026-10-14): Wildbond battles show the real creature sprites, scaled by whole pixels, with their feet clear of the command box. Not published.
- WBL-1 (merged #413, with WBL-14, 2026-10-14): Esc, I, the bag and Start open a pause menu (Party, Field book, Save, Close), and a status bar shows the area, the party lead and the coins. A click on a full-screen button stays on the button, so Choose Ripplet chooses. Not published.
- WB-C4b (merged #399, 2026-10-14): the Thornwood pond outline breaks the box, and the reeds sway by whole pixels. Not published.
- WB-FUNNEL1 (merged #380, 2026-10-14): a tap advances opening dialogue, and the opening records time to the first partner, first battle and first catch. Not published.
- WB-C4 (merged #372, 2026-10-14): Larkhaven gets a barn garden, door stones, straw in the pen and grass variety, and the Thornwood ponds get a muddy, reedy bank. Not published.
- WB-C3b (merged #382, 2026-10-14): the register shows only the tap hint on phones, and the partner-card note no longer touches the stat bars. Not published.
- EVO-1 (merged #366, follow-up #370, 2026-10-14): starters are three-stage lines. Old saves convert, and battle sprites clear the HP panel. Not published.
- WB-C3 (merged #361, 2026-10-14): a phone held sideways walks, talks, battles and opens the bag by touch. Not published.
- WB5.6 (merged #368, 2026-10-14): catalogue batch, 189 species, evolved forms at half. Not published.
- WB-C2: a shorter arrival and barn introduction; the same family tales now accompany the first bond. Character creation, starter choice and old saves are unchanged. Timing and regression evidence: [WB-C2](../docs/playtests/wildbond-wb-c2/README.md).

## Play it
Double-click **Play Wildbond trial.bat** (Godot is unzipped in `C:\Users\evanb\Godot`). Arrow keys or WASD to walk;
Enter, Space, E or a click to continue a conversation and to bond. A gamepad works, and on a phone a walking pad and a
button appear (every control is a named action in `scripts/controls.gd`; the pad is `scripts/touch_pad.gd`). To edit it, run the Godot program, choose
**Import**, and pick this folder's `project.godot`.

## What's in the trial
- Faded Larkhaven on the real map (from games/wildbond/js/11-maps.js), drawn in code on a 384x216 pixel canvas that
  scales by whole numbers, so it stays crisp on every screen (the research's advice).
- An opening that happens in the world: a short narration, Maren walking out of her barn up to you, her words in
  speech bubbles over her head.
- **Maren's ranch register** (the character creator): an open book with you walking and turning on the left page;
  name (type it or pick one), body (broad or narrow), skin, hair style and colour, top, bottom and outfit on the right.
  Arrow keys or the mouse. **Signing paints you in:** you are drawn in colour on your own layer, the one bright thing
  in the faded valley. Your choices are remembered for next time (user://register.json).
- **Choosing your partner in Maren's barn:** Maren leads you to her barn (the big wooden one, top right). Inside, three
  young creatures in their stalls (Cindercub, Ripplet, Mosshog), each with its own body and habits: Cindercub
  pounces at a moth, Ripplet blows bubbles, Mosshog roots in the straw with a finch on its back. Walk up and press Enter
  to open its page (element, role, stats, first moves, matchups, what Maren thinks of it), then **Choose** or **Not
  yet**. The bond floods the barn with colour; your partner follows you out, and the colour has spilled into town.
- **One source of truth:** creatures, moves and matchups come from the browser game (`data/wildbond.json`, made by
  `tools/godot-export.ps1`), so both versions always agree.
- **The paddock pup** (Maren's ranch pup) wanders the paddock, sniffs the grass, sits with its tail curled, and stalks
  and pounces at a butterfly; when you come near it stops and watches you, ears up and tail going.
- **Wren and the first battle:** Wren runs in after you leave the barn (lines from the browser game) and takes the
  partner that beats yours. The battle is on the field: classic layout, who acts next, Fight (moves with descriptions),
  Guard and Rally (orders that refill), Bond, Bag, Run, a soft grey fog in and out, and a results page that waits.
  The rules (`scripts/rules.gd`) give the browser game's exact numbers (checked).
- **Thornwood, the first route:** walk north out of Larkhaven. Tall grass, a pond, items in pouches, signs. Every
  8-16 steps in the grass you find something (like the browser): a wild creature at a level near yours, coins, a lure,
  or a moment in the woods. **Bond** throws a lure and starts a calm meter: press when the marker is in the green
  (weaker, calmer creatures are easier). **Each creature that trusts you brings colour back** where you are. Your team
  holds three; the rest go to Maren's ranch. **Bram and Lise** spot you and walk over to battle; **Warden Isolde**
  waits at the hawthorn gate with her scene and three creatures, and the **Thorn Badge** opens the gate onto Saltmarsh Road (the settlement keeps its old map; Moon Pool opens for a Tide partner). Lose a battle and you hurry home to Maren; talk to her any time to heal your team.
- **Story moments as you explore** (the browser's STORY): Wren catches you up on the Thornwood trail after 12
  explorations, and Elderhorn, the guardian stag, steps out of the old trees at 20 (befriend it, or it slips away to
  return later). On the coast: Wren again, and Breakwatermane walking out of the surf at low tide.
- **Saltmarsh:** the Thorn Badge opens onto Saltmarsh Road, then the original coast settlement, so an old save keeps its map and coordinates. Beach, reeds, rocks and the open sea. Tobin the old fisher stands on the road; Cato, Marit and Warden Nerys stay in the settlement. The Tide Badge opens the cliff road east. A Tide partner can climb down to Moon Pool, where Foamglint is easier to find. Badges
  raise the level cap (15, then 25, ...: CAP_TABLE).
- **Emberfall Highlands:** up the cliff road with the Tide Badge. A mountain of layered rock with sunlit rims and shaded
  cliff faces (rock out in the meadow stands as boulders), warm dry turf, amber hot springs that bubble and steam, and
  sparks drifting up from the vents. Orsk the ridge hiker, Sela the spring keeper, and Warden Toren above the springs
  (the Ember Badge); Wren at Warmstep Rise and Hearthcrown, the guardian stag, as you explore. Battles here have the
  highland sky and ridges.
- **Cloudglass Pass:** up the high path with the Ember Badge. Cold grey-blue stone, boulders on the slopes, and banks of
  cloud that drift across the pass and now and then come down thick before lifting. Ilka the rope-mender, Teodor on the
  trail, and Warden Vessa in her shelter at the top (the Beacon Badge); Wren somewhere in the cloud and the lamp-bird as
  you explore. Battles have sharp peaks and drifting cloud. Stillreed Basin, beyond, is next to build.
- **Maren's ranch, as a place:** creatures you aren't carrying live where you can see them: up to four in the paddock
  (wandering, sniffing, sitting, watching you come over), the rest on the barn floor. Walk up to one (or tap it) to see
  its page (level, trust, moves, strengths) and **Take along**, or with a full team **Swap in** and choose who rests
  instead. The creature at the front of your team is the one that walks with you.
- **The barn trough and the nursery:** stand at the trough on the barn's right wall and press E: two berries feed your
  ranch creatures, who come over to eat and trust you more. The empty stall on the left is the **Nursery**: send two
  creatures there from their page (**To the stall**), then ask at the stall. A pair from the same family (or a few
  special pairs) can have an egg for 80 coins; it sits in the straw and hatches while you walk on your journey, and
  word comes from Maren. Babies take their potential from both parents, now and then better than either.
- **Maren's workbench and creature gear:** a bench on the barn's left wall. Stand at it and press E: the creature walking
  with you tries each piece on (Previous, Next), and Maren makes what you don't have for coins. Seven pieces, each
  doing one thing: a Leather Harness (takes knocks better), a Calm Bell (trust grows faster in battle), a Swift Ribbon
  (quicker off the mark), and four charms that soften one element's moves (Ember-Glass Band, Shell, Bark and Slate
  Charms). Gear **shows on the creature** wherever you see it: walking with you, at the ranch, in battle, on its page.
  Pieces you take off go in your satchel for another creature.
- **The inn and the shop are rooms:** walk in through their doors in Larkhaven. **Old Ned** at the inn's counter rests
  your team; **Juniper** behind hers sets out lures and berries. Walk back out through the door.
- **Your family is recognised** by everyone on the early roads (townsfolk, trainers and Wardens), once each, in lines
  written for each heritage (from the browser game's data, T45). The Wilddex has 107 creatures.
- **Battle effects:** each element's hit has its own animated effect (flames, water, leaves, rock, lightning, a dark burst,
  a golden shimmer), from the free Ninja Adventure pack.
- **Maren's letters:** every so often on the road a runner brings a letter from Maren: news of your ranch creatures
  (who miss you a little, and trust you more), the egg, and where to go next. The field book's ranch page says
  **Where next** in her words too.
- **Tamer orders:** the battle menu's **Orders** holds Rally, one order from your family (Farmfolk: Patch Up;
  coastfolk: Read the Tide, your team braces itself for the next big attack; highlanders: Stand Firm; wanderers: Find
  an Opening, another creature acts at once) and orders people teach you: Toren teaches **Steady** (calm poison and
  slowness) when you earn the Ember Badge. Orders cost orders, which come back as the battle goes on.
- **Music:** a tune for each place and for battles (nine free tracks from the Ninja Adventure pack). Under it, the
  sound of the place: waves on Saltmarsh Coast, wind in the Highlands and up in Cloudglass Pass. Larkhaven plays a
  lost, quiet tune while it is faded and a warm village tune once its colour comes back. Press **M** to turn music off
  and on.
- **People stand beside you, not on you:** Maren comes to your side to talk, and trainers who walk up from above or
  below stop a step further off, so tall figures never cover each other.
  Whoever stands in front of you is drawn in front of you, even though you are in colour and they are still faded.
- **Heritage** (docs/proposals/wildbond-heritage.md): the register's ninth line is your **Family**: Larkhaven farmfolk
  (field and forest creatures trust you a little sooner), Saltmarsh coastfolk (your lead creature's trust grows half
  again as fast), Emberfall highlanders (trust grows faster in battles against tamers) or Farwatch wanderers (you find
  more in the tall grass). When you sign, Maren recognises your family. Just after your first bond, you remember your family's tale of the fading (each a different
  part of the truth). Pip and Tobin recognise their own people; reaching your family's country brings a memory of home.
- **Evolution with shapes and conditions** (`data/evolution.json`): you're asked when a creature is ready to change
  (Let it change, or Not yet; "not yet" waits a level). New third stages for the starter lines, each with its own
  condition: Blazefang becomes **Pyremane** at 32 in the heat of Emberfall; Tidewyrm becomes **Deeptide** only for a
  tamer it trusts completely; Thornback becomes **Elderthorn** when raised beside a Glimmerwing. A branching line:
  Poolkit becomes **Mistlynx** in the cloud of Cloudglass, **Sunlynx** if devoted to you, or Rilllynx otherwise.
  Hearthlaugh never evolves. The field book shows Maren's hint once you've seen a creature.
- **Larkhaven's shop and inn:** walk into the cottage door by the paddock for the shop counter (5 lures for 50 coins,
  berries for a tired team; you start with 120 coins, like the browser) and into the inn door for a night's rest that heals
  your team. Pip lives in town too, and notices the colour after your first badge. (The browser's shop stands where
  Maren's barn is here: the tall barn only fits top right, so the shop moved to the cottage by the paddock.)
- **The field book** (Tab or J, or tap the satchel line): the Wilddex, every creature in the game (seen ones in colour,
  the rest dark shapes, a mark for those that chose you; each with its page: element, description, where it lives),
  and your Team (level, health, XP, moves; who rests at the ranch), the Satchel, and Settings (volume for music, the
  sounds of each place and effects, text size, battle pace, phone buttons; `scripts/settings.gd`, kept per device).
- **Every creature has a body:** ten family body plans (wolf, cat, hyena, lizard, croc, boar, horse, bird, spider,
  sprite) in each species' own colour, so all 81 creatures look like themselves (`tests/gallery.gd` draws them all).
- **Your journey saves** (team, ranch, satchel, badges, Wilddex, items, beaten trainers, restored colour, where you
  stand) at calm moments and when you close the window; a start page offers Continue or a new journey.
- Click or tap anywhere to walk there; tap a creature in the barn to walk up and meet it.

## How it's built (for assistants)
- `scripts/figures.gd`: people and creatures built from parts, drawn by any node (the world, the register, later
  other games and a 3D rig). `scripts/register.gd`: the ranch register. `scripts/card.gd`: a creature's page.
- `data/wildbond.json`: the browser game's content (creatures, moves, maps, story). Refresh it after changing the
  browser game: run serve.ps1, then `powershell -File toolsgodot-export.ps1` (uses Edge, built into Windows).
- `scenes/main.tscn` (the camera, the fade layer, the text layer), `scripts/main.gd` (map, walking, people, dialogue,
  the bond), `shaders/fade.gdshader` (the faded world with restored circles).
- Check it without a window: `Godot_v4.7.2-stable_win64_console.exe --headless --path wildbond-godot --quit-after 120`.
  See it: add `--write-movie <folder>/f.png --fixed-fps 10 --quit-after 200 -- --demo` (the demo plays the opening by
  itself) and look at the frames.
- **Checks:** `Godot_v4.7.2-stable_win64_console.exe --headless --path wildbond-godot --script res://tests/run_tests.gd`
  plays the opening, the first battle, Thornwood, a catch, the Warden and a save by itself; must stay all-pass (218 checks on 2026-10-08). `tests/battle_odds.gd` measures how winnable a battle is; run the game with `-- --skip-opening` to start in Thornwood (add `--at=saltmarsh` for the coast, `--at=emberfall` for the highlands, `--at=cloudglass` for the pass, `--at=larkhaven --ranch` to see creatures at the ranch, `--at=larkhaven --ranch --nursery` for the nursery with an egg, `--bench` for the workbench, `--book` to open the field book).
- **Builds for sharing:** `tools/godot-build.ps1` (web: play/wildbond/, Windows: export/Wildbond-trial-windows.zip),
  once Godot's export templates are installed (Editor > Manage Export Templates > Download and Install).
- Click or tap anywhere to walk there; tap a creature in the barn to walk up and meet it.
- The `.godot/` folder is Godot's cache and isn't saved in git.

## Evan's verdict (2026-10-08)
"This feels much better." Fixed after his first play: Maren no longer blocks the paddock gate, fences join up and
down, people face the way they walk (front, back, side) with stepping feet and a breath when standing, and the cub
wags and trots. His bar for animation is "better than the first Pokémon": see docs/wildbond-plan.md "Art and
animation" (real sprite art is the next step).

## Next, if Evan likes it
A battle on the field, the
Wilddex sketchbook, and the rest of docs/wildbond-plan.md, carrying over all creatures, maps and story as data.
