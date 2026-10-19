# WB-GUEST-CHAPTER-PLAY: Grok guest playtest

These are guest impressions only. **Evan's fun acceptance is still pending and this report does not replace it** (see the last section).

## What ran
- **Code:** SHA `a9ef87fc38f7290f98e7ae61175216834a729bf5` (pinned #576), `wildbond-godot` opening chapter, played natively.
- **Engine and display:** Godot 4.7.2 with `--rendering-driver opengl3` (llvmpipe, no GPU), on Xvfb at 1920×1080 with a 1536×864 window.
- **Input:** real keyboard input through xdotool (WASD, E, Space, Tab, Esc).
- **Profile:** throwaway, using `XDG_DATA_HOME=/workspace/cp_scratch/xdg` and `XDG_CONFIG_HOME=/workspace/cp_scratch/cfg`.
  - Before launch, I checked the override headlessly: `user://` resolved to `/workspace/cp_scratch/xdg/godot/app_userdata/Wildbond (Godot trial)` and held no save.
  - The real `~/.local/share/godot/...` profile had no save written to it, and no one else's profile was used.
- **Art:** no private pack, so the game ran on fallback/test art ("TEST ART / private sprite pack missing") with original starters. The evidence holds only that art.
- **Box load:** one Godot process at a time. Godot and the display were closed afterwards.

## Route and real elapsed time (America/New_York)
| Time | Step |
|---|---|
| 09:45:06 | Launched, starter choice (Mosshog) |
| ~09:46 | Welcome popup, then HUD says to speak to Maren, found beside the ranch |
| ~09:47–09:49 | Thornwood Trail: snagged on the sign and trees, wild Pidgey, caught on the 6th Bond Ball |
| 09:49–09:52:49 | Back to Larkhaven, then about 3 min wedged east of the Healing Inn before finding the door |
| ~09:53 | Healed at the inn |
| 09:55:07 | Reported back to Maren; HUD switches to "Follow the north trail / Meet Warden Isolde" |
| ~09:56 | Passed Bram on the trail (did not take the optional friendly battle), then Thornwood town |
| 09:57:07 | Reached Warden Isolde and accepted the Challenge |
| ~09:57–10:02 | Badge battle: beat Pidgey, Mosshog fainted to Wooper at round ~18, then Pidgey lost. **Defeat** |
| 10:02:25 | Respawned outside the Gate Loft; rested and restored the party at 10:02:52 |
| ~10:03 | Stopped |

- **Total:** about 18 min.
- **How far it got:** starter, outing, both heals, Maren's return, and reaching and fighting Isolde all ran. **The Thorn Badge was not won** (Lv5/Lv4 party against Lv6/7/8), so the badge reward and the "return after badge" step were not seen.
- **Softlocks:** none hit. Defeat sends you to the Gate Loft, as intended.

## Exact stuck points (reproducible)
1. **Trailhead snags (Thornwood Trail, around cells (10..12, -10..-14)).** The sign post and the pines in the trail lane stop straight north/south walking. You have to sidestep left or right. A second sign blocks the lane again at the entrance to Thornwood town. Evidence: `grok/08`, `grok/14`. Source: `map.gd:20-24` (solid glyphs include `P`/`T`).
2. **Healing Inn approach, about 3 min lost.**
   - The inn door D is at (4,4) and is used from (4,5). It sits behind the ranch roof (ranch x5–9, y8–10) from the camera's view.
   - The Inn Neighbor NPC at (7,6) stands in the lane and reads as the player, while the real player is hidden under the roof.
   - Evidence: `grok/09`, `grok/11`. Source: `tests/opening/scene.gd:241` (home doors).
3. **Player and creature hidden by trees.**
   - Trees and the ranch roof cover the player (`grok/08`, `grok/12`, `grok/20`). Only buildings fade.
   - The wild creature's "Meet …" prompt fires while it is invisible inside dense trees (`grok/05`). Source: `scene.gd:346-348` (`enter_battle`, distance < 2.4).
4. **The welcome popup and the HUD give different orders.** The popup says "Explore Thornwood, catch a partner, then visit the Healing Inn", but the HUD says to speak to Maren first (`grok/02`, `grok/03`).

## Other findings
- **Dialogue:**
  - E opens dialogue but **does not advance it**; Space or clicking Continue does. Not explained anywhere.
  - At Isolde, Space selected **Challenge** straight away (it is the focused default), so a mashing player skips "Prepare" (`grok/16`).
- **Maren:**
  - Her first talk splits a sentence across pages and never explains the catch → inn → return loop.
  - She says "bring your team back here to rest", but resting happens at the inn.
  - Her speaker label switches between "Keeper Maren" and "MAREN" (`grok/04`).
- **Copy and labels:**
  - The badge fight header reads **"Warden Isolde / Friendly Battle"** (`tests/opening/battle.gd:59`), which undersells a badge challenge (`grok/17`).
  - The Gate Loft restore dialogue is labelled **"HEALING INN"** (`tests/opening/community_center.gd:40`) (`grok/21`).
  - After the Isolde talk and the defeat, the HUD still reads "Meet Warden Isolde" instead of "Rest, then challenge Isolde" (`grok/20`).
  - "Bring your new partner to the Healing Inn" stays up inside the inn, with no "talk at the counter" hint.
- **Encounter:**
  - The overworld creature species changes between visits (Pidgey, then a "Meet Vulpix" prompt).
  - Fallback Wooper is drawn as a crocodile. This may just be fallback art; check it with the private pack (`grok/18`).
- **Pacing and difficulty:**
  - A badge round takes about 6 s; the fight lasted around 5 min of mostly button presses.
  - A route with no grinding (Mosshog Lv5 + Pidgey Lv4) lost to Isolde's Lv6/7/8 team. Nothing told me to train first or to take Bram's optional battle.
- **Readability:**
  - Town and trail signs are unreadable at gameplay scale.
  - The map's "Thornwood" label sits on the northern town while the middle region (the trail) has no label, so "Explore Thornwood" is ambiguous.
- **Inside the Gate Loft:** Space opened the WILDBOND menu instead of doing nothing or interacting (`grok/` capture not kept; reproducible by pressing Space after entering).

## Three highest-impact improvements
1. **Keep the player and the targets visible.** Fade or cut away trees and roofs that sit between the camera and the player, the partner, or a wild creature that is prompting. This was the cause of most of my lost time (stuck points 2 and 3).
2. **One clear objective voice for the outing.**
   - Make the welcome popup match the HUD (Maren first).
   - Have Maren spell out the catch → heal at the inn → come back loop in one page.
   - Update the HUD after a defeat ("Rest at the Gate Loft, then challenge Isolde"). Let E advance dialogue too.
3. **Clear the walking lanes and signal the difficulty step.**
   - Move the trail and town signs and the in-lane pines off the walkable path.
   - Before the first badge, nudge the player toward Bram's battle or training, and make Prepare the default focus.
   - Relabel "Friendly Battle" / "HEALING INN" for the badge fight and the Gate Loft.

(These are observations only. No fixes, story or map design are proposed here.)

## Guest impressions vs. Evan's fun acceptance
- **My impressions (a guest playing headless on llvmpipe with fallback art):**
  - The loop is easy to follow once the HUD is trusted.
  - Catching and healing feel good.
  - Isolde's lines land well.
  - The friction is mostly camera occlusion and snagging, plus a difficulty wall at the first badge.
- **Not covered by this report:** whether the chapter is *fun*. That is Evan's acceptance, and it is still pending. Nothing here should be read as that acceptance.
