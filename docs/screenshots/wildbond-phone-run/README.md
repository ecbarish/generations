# WB-C3: Wildbond on a phone held sideways, by touch

Recorded 2026-10-14 by `node tools/wildbond-phone-run.cjs <web build> <out>`, on an emulated Pixel 7 in landscape
(Android user agent, touch, 863 by 360 CSS pixels at 2.625 device pixels per CSS pixel). Every input is a touch: taps
on the game itself, and a thumb held on the walking pad. Screenshots are halved in size; `run.json` lists the device,
the user agent and the browser errors (none).

- `before-01-how-to-play.png`: the published preview (pack e07fb136). The game sits at 1x in a black frame, and the
  page marks "Keyboard (what you're using)" on a phone.
- `after-*`: this branch's source, exported to a scratch copy of the preview (play/wildbond is unchanged). The game
  fills the phone's height and the phone column is marked. A tap on Maren's bubble moves her talk on, which it didn't
  before (the bubble swallowed the tap). Then: register signed by touch, tap the barn door to walk in, tap Cindercub to
  walk up, Meet, Choose, walk with the pad, the battle with Wren (Fight, Bite, won), and the field book (the bag, its
  Satchel and Team pages, and a tap outside to close it). Long captions now stay on screen, between the walking pad and the button while they show (after-19).

Not claimed: a physical phone.
