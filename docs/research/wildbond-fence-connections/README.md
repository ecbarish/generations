# WB-GUEST-FENCE-CONNECTIONS: Grok for Adam

**Problem:** Evan reported that the paddock fence doesn't connect. The inherited branch in `wildbond-godot/tests/opening/scene.gd` drew one full-cell rail pair per post, on a single axis. When a post had neighbours on both axes it chose horizontal. As a result:
- The four corners overhung outward, and the side runs had no rail into the corner posts.
- The posts beside the entrance drew rails halfway across the gap.

**Fix (fence branch only):** each `=` post now draws one half-cell rail pair toward each neighbouring `=` post.
- Runs meet once, at the shared cell edge, with no overlapping rails.
- Corners join on both axes.
- End posts and the entrance stay open.
- An isolated post gets a post and no rails.
- Glyphs, collision, the entrance, interaction anchors, progression, saves and art are unchanged.

**Check:** `wildbond-godot/tests/fence_connections/checks.gd`. Run it as `godot --path wildbond-godot -s res://tests/fence_connections/checks.gd -- <out-dir> --fallback`.
- It loads the soft-ground audition (#591, expanded paddock), which is unsaved.
- It reads every rendered rail mesh and asserts:
  - each rail is a half cell on one axis;
  - no rail connects to a non-fence tile;
  - each post has exactly 2× its fence-neighbour count of rails;
  - all four corners have 4 rails;
  - the entrance (21,22) stays open, and its end posts (20,22) and (22,22) have one side only;
  - no two rails share a position;
  - the gap is walkable and the fence is solid;
  - the paddock anchor is unchanged;
  - no save is created and the real profile is never selected.
- With a display it also captures two native views.

**Results** (Godot 4.7.2, base `c94e856b`, throwaway `XDG_DATA_HOME`/`XDG_CONFIG_HOME`, fallback art):

| Run | Result |
|---|---|
| Headless, forward_plus (structure only, nothing drawn) | 15 passed, 0 failed, rails=112, posts=29 |
| Native Xvfb, `--rendering-driver opengl3` (gl_compatibility, llvmpipe) | 17 passed, 0 failed, two views captured |
| Native Xvfb, Vulkan requested | Box has no `VK_KHR_surface`, so Godot fell back to gl_compatibility (17/0). **forward_plus was not rendered natively here.** |
| Same check on the unfixed base | 8 failed (shape, counts, 4 corners, 2 entrance ends), which confirms the check catches the bug |

Evidence (fallback art only): `evidence/before-*` shows the unfixed base and `evidence/after-*` shows the fix, each from a south view and a west view of the paddock.

**Not run locally:** the full `tools/run-all-checks.cjs` aggregate. I kept the box load light and left it to CI on the PR head. The handoff records the CI result.

**Limits:** these are render-only meshes; fence collision was already per-cell and is untouched. The compact (`--compact`) layout uses the same code path but has no paddock fence to inspect.
