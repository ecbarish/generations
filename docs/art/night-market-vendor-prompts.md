# Night Market vendor portrait prompts (NM-G4)

These are written briefs for the six Night Market vendors, so the Game Art Director can commission or draw their pictures later. **This file is text only. No images are made here, and no game file reads it.** Each brief is taken from the vendor's own habit in [`games/night-market/model.js`](../../games/night-market/model.js) and from what that vendor's stall already shows on the lane in [`games/night-market/lane.js`](../../games/night-market/lane.js). Anything not in those two files is marked as a choice for GAD.

Read the arcade's art rules first: [docs/art/README.md](README.md). This file follows them and does not change them.

## House rules that apply to every portrait

1. **One ink outline.** A one-pixel outline in the arcade ink, `#1e1a22` (a warm near-black, never pure black). Light comes from the upper left, so the shadow side is the lower right (art guide rules 5 and 6).
2. **The lane's dusk-and-lamplight colours, and no others.** The lane strip (#438, `lane.js`) uses `#161326` night, `#1e1a22` ink, `#241c16` timber, `#8a4e1d` amber, `#6e6258` mute, `#ddd4c6` rule (the pale steam), `#f6e6cf` wash, `#f2d080` lamp and `#1d5c3e` good (the green of a milestone flash). The warm lamp is the only bright light in the picture. No gradients, no soft edges and no anti-aliasing inside a sprite (art guide rule 1).
3. **Real proportions, no big heads.** A person is 16 pixels wide and about 24 tall, with legs (art guide rule 2, which `docs/plans/lantern-bowl.md` also cites). These are grown-up shopkeepers, not chibi figures.
4. **Built from simple shapes** that could be extruded later (art guide rule 4), and **readable first**: the vendor must be known by their pose and one prop, even as a dark shape against the night.

## Size

Everything is drawn at the lane's own scale: the strip is **384x72 pixels**, six stall slots of **64x56**, with people at **16x24** (the lane's passers-by are 16x24, cropped to the top 20 so their feet sit behind the counter). So:

- **The lane sprite** of each vendor is at most 16 wide and 24 tall, and sits inside one 64-pixel slot behind the counter. A face is a few pixels, so the pose and the prop carry the picture.
- **A larger portrait**, if GAD wants one for a card or a welcome-back box, is the same drawing at a whole-number multiple, never a smoothed scale: 2x is 32x48 and 3x is 48x72 (the height of the strip). Nearest-neighbour scaling only.
- The prompts below are written for a **reference picture**, which GAD or an artist then reduces to the lane's pixel grid and the nine colours above. They describe the figure, not a final sprite.
- **Skin and cloth have no ramp in the nine colours.** README rule 5 asks for a light, middle and dark value per material. Whoever reduces the reference should either draw the lane vendors as ink silhouettes with an amber rim from the lamp, the way the passers-by are drawn (`docs/plans/night-market-visuals.md`), or propose a few new colours for a vendor ramp in the art pull request. Night Market uses about 12 colours today, so there is room under the 32-colour cap.

## What every portrait must not look like

No real people (no likeness of anyone, famous or not), no brands, logos or trademarked characters, and no copying another game's characters, stalls or style. Each vendor below adds one line for the specific trap with that vendor.

## The six vendors

The order is the lane's order, left to right. A vendor's pronoun is the one the already-merged tales in `games/night-market/vendor-tales.json` use for them; `model.js` gives only the habit. Age, build and clothing are choices for GAD unless stated.

### 1. Mei, the Tea Stall (`tea`)

**Habit in `model.js`:** "Mei opens before the lanterns are lit."

**Description.** Mei is up before everyone else. She stands at her counter in the blue half-dark, while the lane's lanterns are still unlit, with the kettle already in her hand and a thread of steam going up. Her stall is the plainest on the lane: a teapot with a spout and two small cups on the counter, one lantern on its pole, and later a striped awning and a crowd at the cups. She is calm and patient, with the look of someone who is early and is used to it. Her pose is standing straight, slightly turned toward the empty lane, as if she is waiting for the first customer.

**Prompt (for a reference picture, at most 60 words):**

> Full-length pixel-art tea seller, adult woman, real proportions, standing behind a plain wooden counter in blue pre-dawn dusk, one unlit lantern beside her, holding a kettle with a thin ribbon of steam, small teapot and two cups on the counter. One-pixel warm near-black outline, light from upper left, limited dusk palette with one amber lamp glow.

**Must not look like:** a cartoon teahouse mascot, or a stock "tea-house lady" in a brand's packaging style.

### 2. Bo, the Dumpling Cart (`dumpling`)

**Habit in `model.js`:** "Bo talks while he folds, and regulars stay to listen."

**Description.** Bo never stops talking. He leans on his cart with a dumpling half folded in his hands, his head turned to the regulars and his mouth open mid-story, so you can tell from the shape alone that he is in the middle of a sentence. The cart has stacked bamboo steamers (one, then two, and later a cloth awning and a queue down the lane), with pale steam rising from the top steamer. He is friendly and a little untidy, with his sleeves rolled up. The pose is a half turn to the crowd with both hands still busy.

**Prompt (for a reference picture, at most 60 words):**

> Full-length pixel-art dumpling vendor, adult man, real proportions, sleeves rolled, mid-sentence with open mouth, turned to unseen listeners while his hands fold one dumpling. Wooden cart with two stacked bamboo steamers, pale steam rising, cloth awning edge. One-pixel warm near-black outline, light from upper left, limited dusk palette with amber lamplight.

**Must not look like:** a fast-food chain's chef mascot, or a smiling cartoon dumpling character.

### 3. An, the Lantern Stand (`lantern`)

**Habit in `model.js`:** "An trims each wick until the flame sits still."

**Description.** An is the quiet one, and the whole figure is about attention. She stands close to one lantern on its pole with her head bent and small scissors at the wick, watching the flame until it stops moving. The lantern is the brightest thing in her picture and lights her face from the front, which is why she can be drawn in very few pixels. Her stall has one pole, then a pair of poles, then a string of lamps, so the poles stand behind her at the sides. The pose is a still crouch or lean, with a steady hand, and no hurry. Her tool is settled by the tale "An Trims the Wicks" in `vendor-tales.json`: a small pair of silver scissors. Silver is not one of the nine colours, so draw the blades in `#ddd4c6` (rule) with `#6e6258` (mute) for the shadow side.

**Prompt (for a reference picture, at most 60 words):**

> Full-length pixel-art lantern seller, adult woman, real proportions, leaning close to a paper lantern on a tall wooden pole, head bent, steady hand trimming the wick with small scissors, flame perfectly still and lighting her face. Second pole behind her. One-pixel warm near-black outline, light from upper left, limited dusk palette, lamp yellow brightest.

**Must not look like:** a lantern-festival poster figure, or a genie-lamp or wizard character.

### 4. Qiao, the Mooncake Table (`mooncake`)

**Habit in `model.js`:** "Qiao counts the tins twice, then parts with the one she likes least."

**Description.** Qiao is careful and a little sly. She stands at a long table with a few round tins in front of her, one held up in each hand as if she is weighing them, and her eyes cut to the one she would rather keep. Her pose is the counting itself: tins lined along the table in a neat row, one set slightly apart from the others. The table has one stack of tins, then two, a painted sign, and finally tins along the whole table, and each tin shows a lamp-yellow top. She is precise and fair, never greedy. The pose reads as "counting again".

**Prompt (for a reference picture, at most 60 words):**

> Full-length pixel-art mooncake seller, adult woman, real proportions, standing at a long wooden table, a round tin in each hand as if weighing them, glancing at the one set apart, neat row of tins with lamp-yellow tops behind. One-pixel warm near-black outline, light from upper left, limited dusk palette with amber table and lamp glow.

**Must not look like:** a bakery brand's mascot, or a shopkeeper who looks stingy or sinister. She counts twice because she is fair.

### 5. Ren, the Incense Tray (`incense`)

**Habit in `model.js`:** "Ren lights one stick for the stall and one for the alley."

**Description.** Ren's picture is two sticks. He holds one lit stick over his tray, and with the other hand he points a second stick out toward the mouth of the alley, so the figure faces two ways at once: the stall and the lane. The tray is a small dark wooden box with sticks standing in it, and thin smoke rises from the sticks (a small bronze stand at the alley's mouth comes later, for the second stick). He is slow, calm, and a little ceremonial. The smoke is the second character in the picture, a pale mute-grey ribbon that you can see from the gate, so leave room above his head for it. The pose is a half turn, with one arm out toward the alley.

**Prompt (for a reference picture, at most 60 words):**

> Full-length pixel-art incense seller, adult man, real proportions, calm and unhurried, one lit incense stick held over a small dark wooden tray, other arm out toward an alley, thin grey smoke ribbons rising above his head. Small bronze stand at the alley's mouth holding the second stick. One-pixel warm near-black outline, light from upper left, limited dusk palette, lamp glow.

**Must not look like:** a stock "mystic" or fortune-teller, or any real religion's monk, priest or holy figure. Ren is a shopkeeper.

### 6. Old Wen, the Story Mat (`stories`)

**Habit in `model.js`:** "Old Wen stops just before the ending. The crowd pays to hear the rest."

**Description.** Old Wen sits on a low mat in the lane, with his back straight and one hand raised mid-gesture, and he has stopped. His mouth is closed. That closed mouth and the held hand are the picture: the moment before the ending, with the crowd leaning in. He is the oldest on the lane, so he is drawn with a long, patient face and a settled, unhurried body, sitting on the ground between cushions (one cushion, then two, then a paper screen, then listeners sitting in the lane). **Lane sprite versus portrait.** On the lane, `lane.js` draws the same 56x14 counter in front of every open stall, Old Wen's included, with his mat below it, so the lane sprite shows only his head, shoulders and raised hand above the counter, like the other five. The full seated figure on the mat is for the larger portrait only. The pose is seated, one hand lifted, a small smile held back.

**Prompt (for a reference picture, at most 60 words):**

> Pixel-art storyteller, elderly man sitting cross-legged on a low woven mat in a lamplit lane, real proportions, one hand lifted mid-gesture, mouth closed, pausing just before the ending, cushions beside him, small paper screen behind. One-pixel warm near-black outline, light from upper left, limited dusk palette, warm lamp glow on his face.

**Must not look like:** a stock wise old sage or wizard, or any real elder, teacher or public figure.

## For the Game Art Director

Please read the six briefs and say yes, or ask for changes on the pull request. Choices that are yours to make: each vendor's age, build, clothing and small props that `model.js` does not state (Qiao's tins and the holder for Ren's second stick); whether the larger portrait is wanted at all, or only the 16x24 lane sprite; and whether the vendors should keep the pronouns from the tales.
