# Pokemon Battle Advanced: bounded architecture inspection

Evan asked whether REA could help understand the reference demo. Inspected its public browser build on 2026-10-17. The useful result is a practical implementation approach for Wildbond, not a recovered or licensed source project.

## What was actually inspected

Opened [the developer page](https://thedaigan.itch.io/pba) in Chrome and pressed Run game. Read its iframe URL and the inline Godot loader through the DOM. Downloaded that publicly served HTML and its declared game pack into a separate local temporary research directory. No assets or third-party scripts entered Wildbond's runtime or this PR.

The loader declares `index.pck` at **31,553,628 bytes**, `index.wasm` at **39,513,091 bytes**, no GDExtension libraries and threads disabled. The downloaded pack matches its declared size. Its format-4 header identifies **Godot 4.7.1**, with an ordinary unencrypted directory containing **5,631 entries**. All **5,631 payload MD5s** match their directory records; SHA-256 of the entire pack is `bb704b67362da64bd84b5542ade0fe2e17b58a9c4ec19a39f4cda82ab3572366`. Checks establish consistency of observed bytes, not trust or a software license.

Used the public [Godot pack reader](https://github.com/godotengine/godot/blob/master/core/io/file_access_pack.cpp) and [token-buffer format](https://github.com/godotengine/godot/blob/master/modules/gdscript/gdscript_tokenizer_buffer.cpp) to interpret the directory and selected compressed identifier tables. Node's built-in Zstandard decompressor was sufficient. No foreign script was executed locally, no native executable downloaded and no encryption bypass attempted.

The game reached an optional analytics prompt. Browser canvas keyboard input did not reliably move its selection, so no opt-in was confirmed and no gameplay, battle outcome, camera motion or performance was verified. The separate native browser-window list did not identify the research tab, so unrelated user windows were left untouched.

[Compact observations](pba-inspection.json) retain counts, provenance and selected symbols, rather than publishing the downloaded game or reconstructed source.

## Findings and their limits

| Observation | Evidence | Implication for Wildbond |
|---|---|---|
| Sprites are integrated with a 3D scene | Sprite module identifies Sprite3D, pixel_size, frame grids, front/back frames; camera module identifies Camera3D | Godot's standard sprite-in-3D representation is a credible route; no need to model every creature to begin. Exact billboard settings were not recovered. |
| Camera has exploration and battle responsibilities | camera_rig identifiers include pitch_deg, distance, fov, focus_follow, focus_battle, occluder/building fading | Implement a bounded follow camera and explicit battle framing; handle foreground visibility. Exact pitch, zoom, smoothing values and runtime behaviour remain unverified. |
| Animation has explicit geometry and timing | The inspected Bulbasaur metadata has 37 named states; Idle/Walk/Attack/Hurt have eight directions, Sleep has one; each includes frame dimensions, durations and anchors | Store dimensions, per-frame foot anchors, direction count and timing explicitly. Avoid assuming all states share a canvas or every animation has eight directions. |
| Frames vary significantly by animation | Example Walk is six 40x40 frames per direction; Attack is eleven 64x72; Idle is three 32x40 | Uniformly slicing a contact sheet would be wrong. The metadata strategy is useful for Wildbond's clipping and foot-placement problems. Do not adopt those particular Pokemon frames. |
| World building and streaming are separate modules | world_builder has frame-budget/per-frame symbols; zone_streamer has zone changes and in-flight work | Consider progressive loading when a measured scene needs it. Names alone do not prove chunk geometry, streaming algorithm or smooth performance. |
| Atmosphere is layered | Dedicated rain/weather/time-of-day/water-reflection modules and shaders; selected identifiers include ambient light and fog | Build daylight/shadows first, then one weather variant. Avoid adding every effect before browser performance is measured. |
| Game logic and content have boundaries | Separate battle/combatant, stats, capture, evolution, encounter data, save/state and UI paths | Keep Wildbond's species/save model independent of its presentation. Presence of a file does not prove feature completeness. |

Godot directly supports [Sprite3D](https://docs.godotengine.org/en/stable/classes/class_sprite3d.html) and [SpriteBase3D](https://docs.godotengine.org/en/stable/classes/class_spritebase3d.html), including texture regions, frame grids, physical pixel size, lighting and billboard modes. These are engine capabilities, not recovered claims about the reference's exact settings.

## Would REA save work here?

REA is not installed or run. Its [browser observation tools](https://github.com/morluto/rea/blob/main/docs/browser-observation.md) can capture page/script/resource evidence; its [JavaScript analysis](https://github.com/morluto/rea/blob/main/docs/javascript-artifact-reconstruction.md) targets modules and relationships in JavaScript applications. Here, the JavaScript layer is mainly a Godot launcher/engine boundary. The game-specific modules reside in the PCK as 146 GDC files and compiled scenes, not a JavaScript application source tree. No dedicated Godot PCK/GDScript provider was found in the reviewed REA documentation.

Installing the full REA/native-decompiler setup is unlikely to improve this specific first investigation enough to justify it. That is an assessment of this target, not a claim that REA cannot provide deeper WASM/native evidence. Its documented WASM inspection requires a separate WABT dependency; the engine binary is not the most direct source of this game's scene decisions.

## Concrete next implementation

Build one isolated Thornwood clearing using Wildbond's approved starter identity and existing species IDs. Use Sprite3D with explicit animation metadata and physical scale, simple 3D terrain, a pitched follow camera, grounded feet/contact shadow and foreground occlusion handling. Start with directional idle/walk; a two-view battle sprite alone is insufficient for eight-direction exploration.

Add one encounter-to-battle-to-return loop while preserving the existing journey. Keep the requested turn-based rules unless Evan separately chooses to explore real-time combat. Then add a day/night or rain variant and measure browser frame time/input on desktop and phone. A freely orbiting camera should wait until there are enough directional views.

Use independently obtained licensed environment packs where they fit, such as [Kenney Nature Kit](https://kenney.nl/assets/nature-kit), credited on the developer page. No source-code reuse license was established for the demo itself; recovered metadata does not grant one. The efficient next step is a small Wildbond implementation using known Godot facilities and approved art, rather than attempting to transplant this compiled game.

This inspection did not change game code, save formats, production assets, exports or versions.

