# Night Market tale illustration prompts

For the Game Art Director: these 24 short briefs show one moment from each original tale in [vendor-tales.json](../../games/night-market/vendor-tales.json), in its exact stall and milestone order. They prepare possible small tale pictures; they do not create images, approve a production run or put art into the game. Willow Quay's separate `district-tales.json` is outside this brief.

## References and shared direction

Read [the house art rules](README.md) and the [vendor look brief](night-market-vendor-prompts.md) before using any prompt. The latter received [GAD's approval at 9903c6bd](https://github.com/ecbarish/generations/pull/498#issuecomment-6184886237); that approval covers those vendor looks, not these new compositions. Each vendor section below links its own look. [The lane specification](../plans/night-market-visuals.md), [current lane drawing](../../games/night-market/lane.js) and [the existing lane screenshot](../playtests/nm-visuals/after-desktop-strip.png) ground the scale, props and palette. The tales decide the moment; the look brief supplies consistent people, not permission to show a later prop early.

Every prompt inherits these rules:

- Crisp pixels, a one-pixel `#1e1a22` ink outline, real human proportions and simple readable shapes. Five working adults and Old Wen as the eldest; keep the looks and pronouns established in the vendor brief. Clothing remains GAD's choice. No chibi heads, smoothing, gradients or painted blur.
- Use the lane's nine colours: `#161326` night, `#1e1a22` ink, `#241c16` timber, `#8a4e1d` amber, `#6e6258` mute, `#ddd4c6` pale steam, `#f6e6cf` wash, `#f2d080` lamplight and `#1d5c3e` green. Green remains a progress accent, not a new light source. Give objects upper-left light and lower-right shade. Mei's early scenes keep the lanterns unlit; use restrained ambient light from the same direction. Lit scenes use warm lamplight from the upper left. Do not add colours to simulate blue, silver or bronze: dusk reads through night colour, scissors through pale/mute pixels, and bronze through amber/timber.
- The approved vendor brief notes that the nine colours have no skin or cloth ramps. Start with ink silhouettes and a restrained amber rim where a lamp is lit. Any additional material ramp needs GAD's decision in a separate art PR, within the house palette cap. These prompts grant no palette expansion.
- Calm, warm, original scenes that a child can hear read aloud. No real people's likenesses, brands, logos or copied game characters, compositions or assets. No lettering, milestone numbers, reward icons or dialogue bubbles in the picture; the tale's title and text remain separate.
- One clear action and one distinguishing prop. Suggest a growing market with a few neighbouring stalls or listeners, rather than drawing 25, 50 or 100 copies. Bo's goat stays inside his spoken story. An's sleeping-cat comparison is light, not a new cat. Old Wen's tortoise is pictured only on the paper screen when the tale supplies it; do not invent the story's ending.

## Proposed small card size

For planning, compose each illustration on a **96x64 native-pixel canvas**, six by four 16-pixel tiles, using the lane's **16x24 standing-person reference**. A seated figure keeps those proportions; children are smaller people, not large-headed mascots. The lane itself is 384x72, with 64x56 stall slots. This card can therefore show one vendor, a counter or mat and a small amount of surrounding lane at the same pixel scale. Keep the action clear at 1x; show larger previews only at 2x or 3x nearest-neighbour. Do not enlarge heads or tiny props to fill the card.

The 96x64 composition is a proposal for GAD, not an approved screen or asset contract. GAD's [NM-G4 review](https://github.com/ecbarish/generations/pull/498#issuecomment-6184738903) kept larger portraits on hold until a screen exists. That hold remains: this task supplies only the requested planning note. A later art task must settle the destination, crop, final dimensions and any palette-file/asset contract before drawing. These cards have no collision footprint or runtime placement. Old Wen's full seated figure is a possible card composition; the existing lane still has a counter in front of his mat.

## Mei at the Tea Stall

Vendor look: [Mei](night-market-vendor-prompts.md#1-mei-the-tea-stall-tea). Keep her early opening and quiet care; no lit lantern in these before-opening moments.

### 01 | tea | hired | Mei Opens Early

**Prompt:** Mei pours the first cup behind her plain tea counter. A few regulars wait close by, hands wrapped around their coats. Pale steam rises between them; the lantern above remains unlit, and the lane beyond is dark and quiet.

### 02 | tea | 25 | Warm Bread for the Row

**Prompt:** At Mei's early tea stall, a baker leaves a warm loaf beside the cups. Mei shares the bread with neighbours gathered along the counter. A few tea stalls recede into the dim lane; their lanterns are still unlit.

### 03 | tea | 50 | The Quiet Hour

**Prompt:** Mei stands beside steaming kettles during the lane's quiet blue hour. Her counter is ready, the lanterns unlit; a line of early customers begins farther down the lane. Leave still, dark space around the pale steam and her patient figure.

### 04 | tea | 100 | No One Waits in the Dark

**Prompt:** Mei smiles as she pours a cup for the street sweeper beside a broom. Nearby tea counters are already open, welcoming the first customers before their lanterns are lit. Soft ambient light reveals the lane and the waiting cups.

## Bo at the Dumpling Cart

Vendor look: [Bo](night-market-vendor-prompts.md#2-bo-the-dumpling-cart-dumpling). Rolled sleeves, busy folding hands and a head turned toward his listeners carry his talkative habit. Do not draw a literal goat or invent its name.

### 05 | dumpling | hired | Bo Folds and Talks

**Prompt:** Bo rolls his sleeves and talks to regulars while pinching a dumpling closed. An open bamboo steamer fills beside his hands. The listeners linger at the cart, watching his folds and his lively face beneath the warm upper-left lantern.

### 06 | dumpling | 25 | The Goat Gets a Name

**Prompt:** Bo laughs while folding another dumpling. Across his cart, two regulars gesture in friendly disagreement about the goat's new name. Steam rises between them; his working hands remain the focus. The goat and its name are not pictured.

### 07 | dumpling | 50 | Listeners in the Lane

**Prompt:** Bo carefully finishes a dumpling fold as listeners cheer the next turn in his story. Their food is already gone, but they stay around the steaming cart. Use relaxed, welcoming gestures and a small crowd framed by the lamplit lane.

### 08 | dumpling | 100 | One Long Story

**Prompt:** Bo tells his still-unfinished story while folding at his steaming cart. Familiar listeners exchange amused, doubtful looks, settling in for more. A few neighbouring carts steam farther along the lane; keep Bo's busy hands and talking pose clear in front.

## An at the Lantern Stand

Vendor look: [An](night-market-vendor-prompts.md#3-an-the-lantern-stand-lantern). Keep her attentive lean and small scissors, with blades in pale and mute pixels. Her steady lantern light has no smoke.

### 09 | lantern | hired | An Trims the Wicks

**Prompt:** An holds small scissors beside a freshly trimmed wick and waits, watching its perfectly still flame. The paper lantern rests within reach before she hangs it. Its upper-left light catches her attentive face and steady hands; the background stays simple.

### 10 | lantern | 25 | Twenty-Five Steady Flames

**Prompt:** An pauses beside a carefully trimmed lantern to answer a child looking up at her. Her small scissors rest safely at her side. A few steady flames lead along the lane, lighting the people below; her patient attention holds the scene.

### 11 | lantern | 50 | Clean Light

**Prompt:** An watches moths resting quietly around a clean-burning lantern. Its small flame is still, with no smoke. Her scissors remain lowered while she leaves the moths undisturbed; lamplight separates their tiny resting shapes from the dark lane.

### 12 | lantern | 100 | The Alley, Lit

**Prompt:** An waits beside the last wick she has trimmed, scissors lowered, until its flame settles. Beyond her, a short view down the alley shows gentle pools of steady lantern light revealing the stalls. No smoke or literal sleeping cat.

## Qiao at the Mooncake Table

Vendor look: [Qiao](night-market-vendor-prompts.md#4-qiao-the-mooncake-table-mooncake). Precise, fair and gently amused; she counts twice and keeps a favourite tin. Never make her greedy or sinister.

### 13 | mooncake | hired | Qiao Counts Twice

**Prompt:** Qiao hands a customer one mooncake tin while keeping a favourite slightly apart on her table. Her free hand rests near the neat row she has counted twice. The customer looks pleased; warm lamplight catches the round tin tops.

### 14 | mooncake | 25 | The Tin She Likes Best

**Prompt:** A customer points to the tin Qiao likes least. Qiao glances from that tin to her favourite set aside, quietly amused that the lane seems to know her secret. Keep the twice-counted row neat beneath the lamp.

### 15 | mooncake | 50 | A Painted Sign

**Prompt:** At dusk, Qiao and the painter look at her finished sign, small tins painted along its edge. Her counted coins sit on the table beside real tins. Leave the sign's centre unlettered; her satisfied posture makes the table feel proud.

### 16 | mooncake | 100 | Tins Along the Table

**Prompt:** After her second count, Qiao pats the nearest tin and smiles. Round tins line the table into the lamplit distance, their orderly tops echoing one another. Keep her hand and the nearest tin distinct, with no printed numbers.

## Ren at the Incense Tray

Vendor look: [Ren](night-market-vendor-prompts.md#5-ren-the-incense-tray-incense). A calm shopkeeper, never a mystic or religious figure. The alley's bronze stand appears from `50`, when its tale introduces it.

### 17 | incense | hired | Ren Lights Two Sticks

**Prompt:** Ren sets a second lit incense stick at the mouth of the alley while the first burns beside his stall tray. Thin grey smoke marks both places. His calm, open posture welcomes passers-by; no bronze stand yet.

### 18 | incense | 25 | Cedar Before Dusk

**Prompt:** Near dusk, Ren watches the first visitors approach the alley stick, following its thin cedar smoke toward the welcoming stalls. His own tray burns nearby. Keep the alley mostly open, with gentle smoke shapes and no bronze stand yet.

### 19 | incense | 50 | A Bronze Stand

**Prompt:** Ren watches a thin smoke ribbon curl from the alley stick in its new small bronze stand, then holds the next stick ready to light. Place the stand at the alley's mouth beneath the lanterns; use amber and timber for bronze.

### 20 | incense | 100 | Smoke from the Gate

**Prompt:** From the gate, thin grey smoke ribbons lead the eye toward Ren. He lights one stick beside his stall tray; the second burns in its bronze stand at the alley's mouth. A few trays suggest the market continuing beyond him.

## Old Wen at the Story Mat

Vendor look: [Old Wen](night-market-vendor-prompts.md#6-old-wen-the-story-mat-stories). Keep his upright seated posture, held gesture and patient pause. No paper screen before `50`; no invented tortoise ending at `100`.

### 21 | stories | hired | Old Wen Unrolls the Mat

**Prompt:** Old Wen sits upright on his newly unrolled mat, one hand held mid-gesture and his mouth closed just before the ending. The crowd leans in, a few hands offering coins for the rest. Keep the lamplit scene centred on his pause.

### 22 | stories | 25 | The Tortoise Climbs

**Prompt:** Old Wen smiles and pauses with one hand raised. Listeners settle on cushions around his mat, tea cups close by, eager for the next part of the tortoise's climb. More mats edge the lane; there is no paper screen yet.

### 23 | stories | 50 | A Paper Screen

**Prompt:** Old Wen pauses beside his painted paper screen as children lean forward to hear more. On the screen, a tiny tortoise carries a lantern up a hill, still below the top. Keep his raised hand distinct from the painted story.

### 24 | stories | 100 | The Ending, Twice

**Prompt:** Old Wen begins the tale again, opening his hand toward a contented crowd relaxing on their mats after the ending. His upright posture and small smile invite another telling. Keep the picture with the listeners; do not depict or invent the ending.

## GAD review

Please review the story moments, vendor consistency and proposed card scale on the PR. In particular, confirm the pre-lantern lighting for Mei and whether the 96x64 planning canvas gives the later card enough room. Approval of this text would not approve generated images, new palette colours, a new screen or runtime integration. Any later art must receive its own review beside the reference people and neighbouring pieces at actual display size.
