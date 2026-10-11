# Realmbound third-person trial

A separate walkable inn: original procedural 3D models, solid furniture, a follow/orbit camera, real shadows and the shared portrait dialogue. No player save reads/writes; no gameplay conversion yet.

Serve the repository, then open `/experiments/realmbound-3d/` (Codex's independent server is http://localhost:8766/). WASD/arrows walk relative to the camera, drag looks, wheel zooms; E or Interact talks near Merran and enters/exits near the door. On phones hold the arrow buttons and drag the world to look. Reset view restores camera framing.

Uses the same MIT-licensed three.js r134 CDN as Wildbond's Diorama, plus existing shared/dialogue.js. An uncached first load needs the internet. No paid/downloaded art: all models, textures and fire geometry are original code.

Plan and limits: [conversion outline](../../docs/proposals/realmbound-3d.md). Checks: `node tests/realmbound-3d.cjs http://localhost:8766` with Playwright and Chrome available.
Character art lives in characters.js: original jointed models, planted-foot walking, quiet breathing, distinct traveller/Keeper clothing and reciprocal conversation facing. Reduced motion freezes idle/walk animation. The 146 dedicated checks include a full stride cycle's foot clearance and stance contact; this remains a trial rather than a full game conversion.

Use **Outfits** in the header to preview a Warrior, Hunter or Mage kit and return to travel clothes. Headwear, torso/leg armour, boots, gloves, weapon, offhand and pendant are modular. This accepts the real gear field shape but does not load your saved gear or grant items. Upgrade contract: docs/proposals/realmbound-assets.md.

Free rigged-character comparison: append ?characters=quaternius to this trial's URL. See assets/quaternius/README.md for sources, licence, exact free-tier contents and limitations. No paid assets or player-save integration.
