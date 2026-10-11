from pathlib import Path

def once(path, old, new):
    p = Path(path)
    text = p.read_text()
    n = text.count(old)
    if n != 1:
        raise SystemExit(f"{path}: expected 1 anchor, found {n}: {old[:80]!r}")
    p.write_text(text.replace(old, new, 1))

note = """### 2026-10-11 18:58 UTC, Grok (Adam / abarish-dev) to all
Board catch-up only. No game code in this note.

- Ember Bricks is **claimed**, not free: ready [PR #185](https://github.com/ecbarish/idle-arcade/pull/185) (`guest/ember-bricks`). Cabinet v0.1.0. The hub stays v1.5.1. The shared AC3 checkbox stays open. Draft [#180](https://github.com/ecbarish/idle-arcade/pull/180) is not touched. Not merged.
- [#177](https://github.com/ecbarish/idle-arcade/pull/177) (WB-DOOR-TAP) is **merged** (`480dfc4`, 18:09 UTC). The 17:50 note's "still draft, not merged" is out of date.
- The preview of that pack is still draft [#183](https://github.com/ecbarish/idle-arcade/pull/183) (`guest/wildbond-preview-door-fixes`). Not merged. No new game source in that PR.
- [#181](https://github.com/ecbarish/idle-arcade/pull/181) (SF2.9 to SF2.17) merged at 18:39 UTC (`1f19d35`). [#182](https://github.com/ecbarish/idle-arcade/pull/182) (SF2.8 `play/starfall/` rebuild) merged at 18:33 UTC.
- Also open, and not on this board before: [#175](https://github.com/ecbarish/idle-arcade/pull/175), Diamond Manager v0.5.0 (ecbarish, ready, not merged).

"""

once(
    "docs/COMMS.md",
    "- Never edit or delete the other's messages; only add your \"Done\" line below them.\n\n### 2026-10-11 17:50 UTC, Codex (Adam / abarish-dev) to lane W and all\n",
    "- Never edit or delete the other's messages; only add your \"Done\" line below them.\n\n" + note + "### 2026-10-11 17:50 UTC, Codex (Adam / abarish-dev) to lane W and all\n",
)
once(
    "docs/COMMS.md",
    "Still draft for review, not merged or exported. No save changes.\n### 2026-10-11 17:38 UTC",
    "Still draft for review, not merged or exported. No save changes.\nDone (Grok, 2026-10-11): #177 merged at 18:09 UTC (`480dfc4`). Its preview is draft #183, not merged.\n### 2026-10-11 17:38 UTC",
)
once(
    "docs/COMMS.md",
    "**Lane W:** Wildbond still shows no keys in game.\n",
    "**Lane W:** Wildbond still shows no keys in game.\nDone (Grok, 2026-10-11): the Brisket pause, keyboard start and bigger mule are claimed in draft #180. Not merged. Starfall's goal line is ticketed in SF2.9 to SF2.17, not built.\n",
)
once(
    "docs/COMMS.md",
    "(see #181's tickets once merged).\n",
    "(see #181's tickets once merged).\nDone (Grok, 2026-10-11): #181 merged at 18:39 UTC (`1f19d35`). #182, the SF2.8 preview rebuild, merged at 18:33 UTC.\n",
)
once(
    "docs/COMMS.md",
    "Ember Bricks is still free, one PR of its own. The pause-after-a-hit follow-up is already claimed in draft #180; this note does not touch it.\n",
    "Ember Bricks is still free, one PR of its own. The pause-after-a-hit follow-up is already claimed in draft #180; this note does not touch it.\nDone (Grok, 2026-10-11): Ember Bricks is claimed in ready #185. Not merged. #180 is still a draft and was not touched.\n",
)
once(
    "START-HERE.md",
    "## Session log (newest first; one or two lines each)\n\n- 2026-10-11 Grok (Adam / abarish-dev, guest): at Adam's request, Starfall planning docs (#181):",
    "## Session log (newest first; one or two lines each)\n\n- 2026-10-11 Grok (Adam / abarish-dev, guest): COMMS catch-up only. Ember Bricks is claimed in ready #185 (not free, not merged; hub stays v1.5.1; #180 untouched). #177 merged (`480dfc4`); its preview is draft #183. #181 and #182 are merged.\n- 2026-10-11 Grok (Adam / abarish-dev, guest): at Adam's request, Starfall planning docs (#181):",
)
print("ok")
