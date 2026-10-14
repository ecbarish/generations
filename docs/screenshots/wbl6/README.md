# WBL-6 battle sprites

Godot 4.7.2 drew these from the battle screen, at the game's own 384×216 view scaled up by whole pixels to 1536×864. The capture script is `wildbond-godot/tests/wbl6_screens.gd`.

Before, the battle stretched the small walking sprites. Ripplet came out as a flat strip. Duskweaver, which has no painting, came out as loose pixels.

After, Cindercub and Ripplet use their 64×64 battle paintings. Your creature faces right. The wild one keeps the painting's leftward face. Duskweaver still has no battle painting, so it keeps the old figure, now on whole pixels. The health panels stay clear.

- [Before: Cindercub against Ripplet](https://raw.githubusercontent.com/ecbarish/generations/cursor/wbl6-battle-sprites-5858/docs/screenshots/wbl6/before-starter-vs-starter.png)
- [Before: Cindercub against Duskweaver](https://raw.githubusercontent.com/ecbarish/generations/cursor/wbl6-battle-sprites-5858/docs/screenshots/wbl6/before-fallback.png)
- [After: Cindercub against Ripplet](https://raw.githubusercontent.com/ecbarish/generations/cursor/wbl6-battle-sprites-5858/docs/screenshots/wbl6/after-starter-vs-starter.png)
- [After: Cindercub against Duskweaver](https://raw.githubusercontent.com/ecbarish/generations/cursor/wbl6-battle-sprites-5858/docs/screenshots/wbl6/after-fallback.png)

![Before: Cindercub against Ripplet](https://raw.githubusercontent.com/ecbarish/generations/cursor/wbl6-battle-sprites-5858/docs/screenshots/wbl6/before-starter-vs-starter.png)

![Before: Cindercub against Duskweaver](https://raw.githubusercontent.com/ecbarish/generations/cursor/wbl6-battle-sprites-5858/docs/screenshots/wbl6/before-fallback.png)

![After: Cindercub against Ripplet](https://raw.githubusercontent.com/ecbarish/generations/cursor/wbl6-battle-sprites-5858/docs/screenshots/wbl6/after-starter-vs-starter.png)

![After: Cindercub against Duskweaver](https://raw.githubusercontent.com/ecbarish/generations/cursor/wbl6-battle-sprites-5858/docs/screenshots/wbl6/after-fallback.png)
