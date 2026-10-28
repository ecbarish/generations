# Review of Gemini's Godot production report

Codex, 2026-10-07. Supplied report, preserved byte-for-byte from Evan's pasted attachment before Git normalization. The pasted report text contained no bibliography, source URLs or inline citations. Evan subsequently supplied a screenshot of Gemini's source list, confirming that Gemini did provide sources separately. The visible entries are recorded below; the screenshot does not expose their exact URLs or claim-level attribution, and may show only part of the list. No URLs have been guessed. Its instructions are external research proposals, not Evan's instructions or approved project requirements. Read against [the actual brief](archive/gemini-godot-production-prompt.md) and [current owner direction](owner-direction-2026-10-07.md).

## Recommendation

Keep the practical topics: expressive animation, a coherent art scale, readable UI, separation of content/rules/presentation, safe saves and repeatable tests. Do not adopt this report as the production blueprint. It substitutes an elaborate new creature game for the smaller opening we asked to validate, and uses absolute guarantees that the evidence supplied does not justify.

The next step remains one polished opening with the existing rules: arrival, customization, three partners, one first battle, a bond that restores colour, a Wilddex entry, save and reopen. Claude owns the current Godot fixes. This review edits no trial code and does not commit the portfolio to Godot.

## Scope and project facts

| Report assumption | Project reality / decision |
|---|---|
| Wildbond already has complex elemental chemistry and stamina combat | The browser data uses Wildbond's own element wheel, moves and cooldown fields. Chemistry and stamina were later experiments, expressly excluded from the migration brief. Do not implement them from this report. |
| Fire melts a plastic creature into poison; Updraft changes defenses | These examples are not Wildbond canon or existing rules. They must not be imported as project facts. |
| At least two traversal powers belong in the slice | Future world/traversal design is separate; the requested proof is the opening loop. Defer this extra scope. |
| Capture uses a thrown device and shaking animation | The central interaction is bonding. The first trial has a creature choosing the traveler. A generic capture-device sequence needs a creative decision, not automatic adoption. |
| Environmental restoration follows capture quotas / corrupted enemies | These triggers are not approved restoration rules. Keep the bond as the current proof and separately decide how restored colour persists. |
| Eight-way movement, 12–15-frame attacks and a 320x180 canvas are mandatory | These are design options with workload and readability tradeoffs, not established minimums. The current trial is 384x216. Compare representative art and motion before replacing it. |
| Six two-week sprints establish the schedule | No team capacity, asset inventory, measured task estimates or linked evidence is supplied. The 12-week schedule and 15-workday combat-track claim are not usable project estimates. |
| Web delivery and automated CI/plugin setup are mandatory immediately | Evan wants platform choice open and an approximate $200 total cash budget. Start with the existing Windows trial, add tools only when they earn their complexity, and evaluate other targets separately. |

## Technical checks against primary sources

### Pixel snapping: a direct contradiction

The report demands both transform and vertex snapping to eliminate movement artifacts. Godot's reference discourages combining them because movement can become less smooth, and favors transform snapping alone. This is relevant to the current trial, which also enables both. Give Claude the finding; do not change his settings concurrently. Compare movement and camera smoothing visually rather than promising zero jitter. [ProjectSettings reference](https://docs.godotengine.org/en/stable/classes/class_projectsettings.html#class-projectsettings-property-rendering-2d-snap-snap-2d-transforms-to-pixel)

### Resolution and UI: alternatives, not a single mandate

320x180's listed integer multiples are correct arithmetic, but that does not prove it is uniquely optimal. The report omits the requested ultrawide comparison. It alternates between mandating full-resolution canvas_items rendering and a low-resolution SubViewport without specifying a complete compositing/layout design. Both can be useful; neither automatically guarantees smooth cameras or perfect art. Compare readable UI and an appropriately framed world at the actual target sizes before locking settings. [Multiple resolutions](https://docs.godotengine.org/en/stable/tutorials/rendering/multiple_resolutions.html)

### MSDF: useful, with a tradeoff

The report claims mandatory MSDF plus font hinting yields universally sharp text. Godot's FontFile reference says hinting is unavailable with MSDF, which can reduce readability at small sizes. Test the selected font at actual text sizes, including large-text settings, rather than treating MSDF as a guarantee. [FontFile reference](https://docs.godotengine.org/en/stable/classes/class_fontfile.html#class-fontfile-property-multichannel-signed-distance-field)

### Saves: data formats are not guarantees

A useful principle is to keep imported saves as validated data and avoid loading untrusted executable resources. But binary serialization is not “permanently secure.” FileAccess permits object decoding when allow_objects is enabled and warns against it for untrusted data; leave it disabled. Validation, limits, error handling, schema migration and backups still matter. [FileAccess reference](https://docs.godotengine.org/en/stable/classes/class_fileaccess.html#class-fileaccess-method-get-var)

The blanket dismissal of JSON and claimed thousands of parsing lines are unsupported. Godot's own saving tutorial demonstrates JSON, while noting type limitations. Stable IDs plus simple validated numbers/strings/arrays/dictionaries can suit a browser/native interchange; Resources can suit trusted shipped content. Select a small contract using representative data, rather than declaring one format always superior. [Saving games](https://docs.godotengine.org/en/stable/tutorials/io/saving_games.html)

### Tint and desaturation differ

CanvasModulate tints a canvas. It is useful for time-of-day coloration but not equivalent to true desaturation. Keep colour restoration's shader behavior distinct from ambient tint. [CanvasModulate reference](https://docs.godotengine.org/en/stable/classes/class_canvasmodulate.html)

### Web constraints: valid conditional findings

Current official web-export documentation supports the report's Compatibility/WebGL2 restriction, lack of Godot 4 C# web export, and single-threaded exports avoiding threading isolation requirements. Those facts apply if we choose web export; they do not make web the required first delivery or eliminate all hosting/browser constraints. The brief remains Windows-first for the current slice, with other targets separately tested. [Web export documentation](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)

### Testing tools: evaluate before adopting

Headless rule checks, fixtures and recorded frames are good directions. The report supplies no sources for its comparison of GUT/GDUnit4 or the named godot-ai-playtest plugin, and no verified plugin repository, license or compatibility evidence. I have not validated those plugin claims. No plugins or dependencies were installed.

A TCP playtest interface is not inherently secure, and faster automated progression is not equivalent to human playtime. For now use existing headless/demo capabilities and small explicit checks. Add a framework or development-only input/state hook only when it solves an observed need. Automated tests do not guarantee discoverable controls, expressive art or a passable route for a newcomer.

## Keep / try / defer / reject

- **Keep as goals:** readable art/UI, feedback with anticipation/impact/recovery, stable content IDs, rules separated from presentation, safe save/reload, reproducible checks and reduced-motion comfort.
- **Try in a tiny comparison:** one improved character/partner animation set; camera/world framing; UI rendered separately if it improves readability; one representative content import and save round trip. Give the player visible improvements before broad architecture work.
- **Defer:** traversal abilities, complex day/night polish, full-roster art, web/mobile validation, large CI/plugin infrastructure and portfolio-wide engine migration.
- **Reject as adopted requirements:** invented chemistry/stamina/capture rules, quota restoration, mandatory frame counts, a uniquely correct resolution, JSON dismissal, absolute security/performance claims and an unsupported fixed schedule.

## A smaller delivery order

1. Let Claude finish the gate/fence/animation work and observe a player reaching the bond without coaching. Record the actual obstacle if they cannot.
2. Agree a small art reference for one tamer and one partner; compare silhouette, facing, gait, gesture and shadow in motion on desktop/ultrawide. Do not require hundreds of assets yet.
3. Add partner choice and one battle using existing rules; preserve clear player agency and a result that waits. No new stamina model.
4. Add the first sketchbook entry and save/reopen the slice. Explicitly distinguish native slice saves from imported browser journeys until the import is proven.
5. Record what the player understood, what felt good, what failed, and what to change. Decide the next investment from that evidence.

These are proposed milestones, not a date commitment or instructions for Claude to execute from this document. No paid tooling is required by this review.

## Optional Gemini correction prompt

Please revise your Wildbond report against the original brief. It asked for a small opening using existing combat, not mandatory stamina, elemental chemistry, plastic/poison transmutation, two traversal abilities or capture-device throwing. The project currently uses a 384x216 Godot trial; compare alternatives rather than mandating 320x180. Your source list is visible separately, but the pasted report has no claim-level links: provide primary citations for technical claims and distinguish facts, assumptions and recommendations. Correct the advice to combine both pixel-snapping settings and the claim that MSDF supports font hinting. Remove absolute claims about secure serialization, perfect performance or guaranteed stability. Do not dismiss JSON without testing a representative stable-ID interchange. Verify any proposed testing plugin's repository, license and engine compatibility. Cover 3440x1440 ultrawide, actual humanoid/cub animation options, creator/partner choice, accessibility, browser-save import and human newcomer testing. Replace the unsupported fixed 12-week schedule with a ranked small-slice task list, estimates with explicit assumptions, keep/change/defer choices and unresolved owner decisions. The project is a passion project with an approximate $200 total cash ceiling and an open platform decision; no plugin purchase, engine commitment or new gameplay system is approved.
## Source-list clarification supplied by Evan

Evan supplied a screenshot after the first review. Gemini did include sources; the text attachment omitted that panel. This corrects the source-availability criticism, not the technical findings or scope assessment. The visible list contains:

- colson.reclaimhosting.com — PIXEL ART SIZES FOR GAMES
- gist.github.com — (Pixel Art) 16:9 Adaptive Integer scale resolutions
- notkey.studio — Choosing the Right Rendering Resolution for a Pixel Art Game
- cbr.com — Cassette Beasts Is The Best Pokémon Clone With Improvements
- cassettebeasts.com — Elements, Chemistry & Fusion
- store.steampowered.com — Fixed Monster Journal not being available when loading a demo
- tvtropes.org — Cassette Beasts (Video Game)
- thegamer.com — Beginner Tips For Cassette Beasts
- findindiegame.com — Indie Games Database
- noobfeed.com — Cozy Grove: Camp Spirit Review
- gpa-site.com — 30 Best Cozy & Slow-Life Games
- gdquest.com — Setting up pixel art graphics in Godot 4
- docs.godotengine.org — ProjectSettings, Godot Engine 4.4 documentation
- youtube.com — Godot 4 Dynamic Screen Sizes
- reddit.com — Question about resolution, aspect ratio, pixel art project on Godot 4
- docs.godotengine.org — Multiple resolutions

The official Godot references and first-party Cassette Beasts entry are relevant starting points. A first-party description of another game's chemistry can support a comparison; it cannot establish that Wildbond already has that system or that Evan approved it. Article/review/listing/forum sources may offer useful perspectives, but do not by themselves justify mandatory architecture, frame counts, a fixed production estimate or security guarantees. The visible Godot ProjectSettings entry is version 4.4; version-specific advice should be checked against the installed engine.

This inventory is transcribed from the supplied screenshot, not an independently opened or verified set of webpages. The primary-documentation checks earlier in this review remain separately linked. Obtain the exact source links and claim mapping before concluding the named testing plugins or workload figures are evidenced by sources that may appear further down Gemini's list.