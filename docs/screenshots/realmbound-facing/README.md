# Realmbound facing and shadows (RB1.8)

## Design

Keep the existing 2D people and perspective world. Front, rear and mirrored profile views follow the walker direction; NPCs use their existing direction (Down when none was authored). The rear head is hair and neck, with no eyes or beard. Profiles show one eye and a nose. Class colours, equipment and race features remain recognisable. Moving walkers lift alternate boots and move the opposite arm; standing figures do not march. Reduced motion freezes those steps. Combat sprites retain their existing presentation.

The large oval is a contact shadow, not the object silhouette. Low graphics also made the shared caster draw an ellipse. A Realmbound-only adapter uses Light.create's unblurred silhouette caster for walkable towns and roads, in both quality settings, and reduces the contact radius to 34% and its opacity to 45%. Fog and bloom still obey the existing graphics setting. No shared engine changes. The road now supplies its existing hearth, inn and campfire as cast-light sources.

Side walls now draw as connected perspective planes, with continuous rails, instead of separate front-facing wall blocks. Evan preferred the original substantial flame: adjacent hearth tiles now form one broad fireplace, with a taller opening, stone surround and mantel scaled around the fire. The flame retains size 1.4, with no escaping embers and a clip inside the opening. It is centred on the combined footprint, and the cast light and warm glow agree with it; people and furnishings retain their scale. Interior zoom changes from 5.2 to 6.2: people and upright objects occupy less height relative to the floor, giving a modestly steeper-looking view. This is framing in the existing perspective renderer, not a new 3D camera.

## Evidence

- One full run hit the unchanged Lighthouse Watch check "a burst pops a spark for 25 points"; the next full run passed it without test or game edits. All 16 suites passed. Realmbound: 8620 checks, including 91 new checks in realmbound-facing.js. A second run with reduced motion also passed.
- Pixel checks cover all race/class combinations, four distinct views, 0/1/2 visible eyes, opacity preservation, walking/stationary/reduced-motion poses, silhouette gaps on Low and High, sunlight direction, lamp direction, small contact bounds and live town/road renderer integration. Additional checks verify shared wall corners, alignment with the smooth floor camera, and visible flame containment across four animation times in both inns. The flame must stay substantial relative to a tile, rather than merely using a small size setting.
- Before/after captures use isolated contexts and Low graphics at 375x812, 1366x768, 1920x1080 and 3440x1440. Before loads the four original rendering scripts from main in browser request interception. Same room/hero/camera; outdoor comparison uses the same fixed sunrise state. No player saves read. No page errors.
- The inn captures demonstrate the rear view and hearth shadows. Town dawn captures show profiles and tree/person silhouettes. Road hearth captures show shadows cast away from the fire. People sheets show all five classes in all four directions.
- Actual canvas click to the Keeper, existing rest choice and keyboard exit passed at all four sizes during development.
- Local headless drawing sample before the follow-up wall/camera/fire adjustment (25 frames, warm median, not a device FPS guarantee): Low town drawing went from 1.7 to 2.2 ms at 375 and 3.1 to 4.5 ms at 3440; High measured 2.1 and 12.6 ms after. Pixel silhouettes cost more than ovals; Low still skips the atmospheric High effects.

## Scope and follow-up

PR #153's inn furnishing remains separate; these captures use main's original furnishings. No saves, controls, services, balance, versions, Godot files or outside assets changed. Casts are projected sprite silhouettes on a flat floor, not 3D mesh lighting, and do not model shadows climbing other objects. This answers direction and object shape without an engine migration.

An idea: a later art pass could add distinct body silhouettes and clothing details by race, using these same four poses. Richer animation can build on the existing stepping cycle.