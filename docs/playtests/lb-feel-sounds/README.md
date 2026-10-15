# LB-G4: Lantern Bowl sound cues

`games/lantern-bowl/sound-cues.js` makes nine game-feel sounds live from oscillators and filtered noise. It has no samples and no recordings, and it never creates its own audio context. Nothing in the game calls it yet. A later row wires the cues in.

Open `index.html` in this folder through any static server (for example `python3 -m http.server` at the repo root, then `/docs/playtests/lb-feel-sounds/`). It has one button per cue, a volume slider, "Play each in turn", and an automatic check that renders every cue offline and reports its length and loudest sample.

| Cue | Length | What it is |
| --- | --- | --- |
| `touchdown` | 1.90 s | Original fanfare: a climb from G4, a dip and lift, then a held chord with a bright top note |
| `tackle` | 0.18 s | Falling low sine and a burst of low-passed noise |
| `catch` | 0.10 s | Rising triangle and a tick of high noise |
| `crowdBed` | loop | Band-passed noise that breathes slowly; plays until `stop()` |
| `crowdSwell` | 2.40 s | The same noise opening up and rising, then falling away |
| `whistle` | 0.45 s | High sine with a fast wobble, plus breath noise |
| `kick` | 0.40 s | Deep falling sine and a click |
| `firstDown` | 0.70 s | Three rising bell notes |
| `interception` | 0.90 s | Falling, slightly sour saw line over a low drop |

Shots: `desktop.png` (1000 px wide) and `phone.png` (390 px wide, touch). They show the page after every button was pressed, with the automatic check table.

## What was checked

- `node tests/lantern-bowl-sound-cues.cjs`: every cue exists, every note parses, durations and levels are inside the row's limits, a stand-in context gets only finite numbers, and the file has no `AudioContext` constructor, DOM, fetch, samples, timers or `Math.random`.
- In Chrome (desktop window and an emulated 390x844 touch phone), every button was pressed with a real click or tap, the crowd bed was started and stopped, and no script errors were raised. The offline render of every cue was not silent and never clipped with the slider at its top.
- **Not done by me:** nobody listened on speakers or headphones, and no real phone was used. The "heard in Chrome on desktop and on a phone" check needs a person with ears; the page is there for that.
