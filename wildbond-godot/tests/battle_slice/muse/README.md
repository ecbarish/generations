# Supplied Muse source intake

Source: Evan's **Wildbond demo source package.zip**, supplied in this chat on 2026-10-17, after the playable [Muse share](https://muse.ai/s/wildbond-battle-slice-xan6nxpxpxxiwxpxq) was reviewed through a successful catch. Original archive SHA-256 and every supplied file's byte count/hash are in `source-manifest.json`. The original ZIP/HTML remain in the chat attachment; the HTML is not duplicated here with its embedded copies of every image.

Attribution from the supplied integration notes: Bogsnap back is ChatGPT-generated; background is Evan-generated; the package includes four extracted Bogsnap idle frames and the older Cindercub front. Code is supplied from Muse for adaptation at Evan's request. No unrelated open-source license or Nintendo asset permission is inferred. These are **prototype intake assets**, excluded with the test scene from the public game pack, and not promoted to the production art library by this PR.

All seven image files retain their exact supplied bytes. The background was named `battle-bg.png` but contains JPEG data. Godot requires the actual format extension, so the installed name is `battle-bg.jpg`, recorded explicitly in the manifest. No re-encoding, redrawing or new image generation was performed. `.import` files use lossless compression and no mipmaps. **The four idle extracts are reference-only:** some cut off the snout at the right edge, and the silhouettes vary substantially. After Evan flagged the fragmented capture, playback was changed to the complete resting back with gentle whole-sprite motion. Normalising a frame's bounds does not repair a cropped drawing.

`original-functions.cjs` retains only five inspected inline functions and their chart/orb constants from the supplied HTML. It is a **development oracle**, not shipped runtime code. The wrapper supplies the original catch closure and exports calculations without the DOM, timers, animations or full HTML execution. No external dependency is needed.

```powershell
node wildbond-godot/tests/battle_slice/muse/generate-fixtures.cjs --check
```

This reproduces **348** original-JS cases and verifies the seven source asset hashes. Omit `--check` to regenerate `fixtures.json`. The native `muse_checks.gd` compares damage across physical/special, burn, stages, roll boundaries, STAB and resisted/super-effective pairings, and all reported catch fields across HP/orb/status/timing combinations. This establishes parity with **the supplied demo**, not full generation accuracy.

Native differences are explicit: stage inputs clamp to -6..+6; zero type multipliers remain immune; a zero catch rate stays impossible; invalid maximum HP is rejected. Muse's placeholder type chart is retained only in the comparison oracle. The playable study keeps Wildbond's seven canonical elements and existing 1.5/0.67 chart, but uses the ported flooring and 1.5 STAB calculation. It uses the four-shake probability model with its existing three-lure supply and basic timing bonus. Orb-tier UI, interactive timing ring, four animated shakes and full status-turn execution are later integration work; accepting parameters in pure math does not mean those controls/status systems are already in the native scene.

**Selected design correction:** Evan clarified that even the intact Bogsnap back in this ZIP is a different design from the agreed model sheet. The entire ZIP Bogsnap set is now reference-only. Playback uses the reference-derived Battle Back in `../approved_bogsnap/`, tied to a byte-preserved copy of Evan's selected sheet and explicit hashes. Preserve that identity in later art work; do not substitute a ZIP file because it has the same species name.

The public adventure's battle code, assets, world, saves and web export are unchanged. Keep this comparison and source provenance when promoting any accepted part into runtime.
