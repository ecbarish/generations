# WB-GUEST-WORKBENCH-UX: real-user walkthrough of the Sprite Workbench

Reviewer: Grok (guest, operator Adam), as routed in [#373](https://github.com/ecbarish/generations/issues/373#issuecomment-6258774707). Report only. No editor code, art, runtime, save or shared file was changed.

- **Tested source:** #576 feature checkout pinned at `a9ef87fc38f7290f98e7ae61175216834a729bf5`. The workbench is from #574 (`tools/sprite-workbench/`).
- **What ran:** Godot **4.7.2.stable** (Linux, `--rendering-driver opengl3` on llvmpipe; there is no GPU here) ran `res://workbench.tscn` under Xvfb at 1920×1080 with no window manager. The tool's own window size was 1200×820 (the project default), plus 800×600 (the project minimum) and 1920×1080.
- **How it was driven:** real mouse and keyboard events through `xdotool`. There were no script hooks or test harness.
- **Process:** one Godot process at a time, run on 2026-10-19 from 09:02 to 09:36 ET. Godot, Xvfb and the browser that **Show export** spawned were all stopped afterwards.
- **Scratch output:** `XDG_DATA_HOME` pointed at a scratch folder, so `user://drafts` and `user://exports` landed outside the repo. `git status` stayed clean apart from Godot's own untracked `.uid` import files, which are not committed.
- **Evidence:** `grok-ux/`. Every screenshot shows committed original Wildbond art only (the Mosshog family). No private pack, Pokémon or NPC art was loaded, and Base trio was not captured.

## Pass/fail

| # | Step (README order) | Result | Evidence |
|---|---|---|---|
| 1 | Launch at the default 1200×820 | **Fail (layout)**. The first creature on screen (Thicketboar, frame 0, zoom 6) overflows the top of the canvas. It runs under the caption, and the pixel grid draws over the toolbar row. | `03`, `15` |
| 2 | Import the cleaned manifest (`tests/mosshog_clean/frames.json`) with **Open measurements** | **Pass, with friction**. The dialog opens in `tests/mosshog_family` (the pre-cleanup sheets), so you have to go up a level and into `mosshog_clean` by hand. | `01` |
| 3 | Step frames (Previous/Next, Left/Right) and read the frame label | Pass. "Frame 13 / 23 · Walk right" is clear. The arrow keys stop working silently once any spinbox has focus. This is documented, but easy to trip over. | `02` |
| 4 | Onion overlay (previous and next frame) | **Fail (usability)**. The magenta and cyan ghosts draw *under* the current frame at 28% alpha. They only show where a neighbour sticks out past the current silhouette, and on the cleaned walk that is a faint purple smudge at the feet. Interior drift, which is what the README says the overlay is for, cannot be seen. | `02`, `02b` |
| 5 | Pixel grid | Pass at zoom ≥ 4. Same overflow as row 1 on tall frames. | `03` |
| 6 | Change a root: Root X 33 → 35, then **Apply offset to this cycle** | Pass. The sprite moves 2 px against the cross, and the draft saved frames 12 to 15 as 35/62 (the whole walk-right cycle only). At 1200×820 the Apply button sits below the fold until you scroll the left panel. | `04` |
| 7 | Paint: pick a swatch, then drag | Pass. Picking a swatch switches the mode to Paint, and one drag made an 11-pixel stroke. | `05` |
| 8 | Erase (mode dropdown, then drag) | Pass. The erased pixels show the checkerboard. They are hard to spot on the dark-navy check, especially with the onion on. | `06` |
| 9 | Undo/Redo (buttons, Ctrl+Z, Ctrl+Shift+Z) | **Pass, one defect**. Erase → Ctrl+Z gave a pixel-identical result to before, and Ctrl+Shift+Z matched after. But any click in Paint or Erase mode that lands *outside the frame* still records an empty undo step, so the next Undo seems to do nothing (D3). | numeric diffs in the notes below |
| 10 | Unsaved-change prompt (an edit, then **Mosshog family**) | Pass. "Unsaved workbench edits" appears. Cancel keeps the edits, and **Discard and continue** loads the family. The focus ring starts on the destructive button, so Enter or Space discards (D5). | `07`, `15` |
| 11 | Unsaved prompt when closing the window | **Not verified**. Xvfb has no window manager, and a synthetic `WM_DELETE_WINDOW` sent with Xlib did not reach the tool. The code path is wired (`workbench.gd:45`, `:184`), but I could not exercise it as a user. | `61`/`62` in scratch only |
| 12 | Save a scratch draft (button and Ctrl+S), including overwrite | Pass. The default is `user://drafts/mosshog-draft.json`. Overwriting shows Godot's confirm and leaves a `.bak`, as the README says. | `08` |
| 13 | Reopen the scratch draft (**Open draft**) | Pass. "Draft restored against verified original sources." Frame 13 shows Root X 35. **Friction**: Open draft starts in `tests/mosshog_family`, not in the drafts folder Save just used (the Recent list helps). After restore the view jumps to frame 0. | `09`, `10` |
| 14 | **Export atlas** | Pass. There is no dialog. The status line shows the versioned folder, which holds `atlas.png`, `frames.json` and `edit-session.json`. The folder name is a Unix time plus a µs tick count (`mosshog-1792416677-78773-516464048`), which is hard to read. | `11` |
| 15 | **Show export** | Pass (environment-dependent). `OS.shell_open` → `xdg-open` opened the folder, which on this box was a Chrome directory listing. | `12` |
| 16 | Reopen the exported atlas (**Open measurements** on the export's `frames.json`) | Pass. It loads as uniform 78×71 cells with re-based roots, and the frame 13 paint stroke is baked in. | `13` |
| 17 | Open a committed edit session (`mosshog_clean/assets/mosshog/edit-session.json` with **Open draft**) | Pass. The hashes verified and it restored. | `14` |
| 18 | Small window (800×600 minimum) | Pass, but cramped. The toolbar wraps to two rows and zoom auto-drops to 3× so Thicketboar fits. The left panel shows about 7 controls, and palette, Undo and Reset need scrolling. | `16` |
| 19 | Large window (1920×1080) | Pass. Everything in the left panel fits with almost no scroll. Zoom stays at the manual 6×, so the sprite is small in a big canvas (no "fit" option). | `17` |
| — | Reference PNG | Not run (optional, and outside the routing steps). | — |

**Totals:** 19 steps. 14 pass (several with friction), 1 pass with a defect (row 9), 1 environment-dependent pass (row 15), 2 fail (rows 1 and 4), 1 not verified (row 11). Reference PNG was not run.

## Defects with exact reproductions

**D1. Tall frames overflow the canvas at default zoom; the grid and sprite draw outside the viewer**
- **Repro:** launch the tool (1200×820, zoom 6). Thicketboar frame 0 is selected. Its leaves run past the canvas top, under the "Native pixels · 6×" caption. Tick **Pixel grid** and the grid lines draw above the canvas, over the toolbar row.
- **Cause:**
  - `canvas.gd:20` fits zoom to `(size.y-130)/h` as if the whole height were usable.
  - `canvas.gd:21` places the root at `size.y*.62`, so only about 62% of the height is above the ground line.
  - The viewer (`workbench.gd:91`) does not set `clip_contents`.
- **Evidence:** `03`, `15`.

**D2. The onion overlay can't show interior drift**
- **Repro:** load `mosshog_clean/frames.json`, pick Mosshog, go to frame 13 (Walk right) and leave **Overlay neighbouring frames** on. Only a faint purple shape at the hind foot is visible. Nothing shows inside the body.
- **Cause:** `canvas.gd:33-35` draws the previous and next poses *before* the current frame with `Color(…, .28)` modulate. The opaque current frame hides them, and the dark outline pixels stay near-black on the navy check.
- **Evidence:** `02`, `02b`.

**D3. A click outside the frame in Paint or Erase records an empty undo step**
- **Repro:**
  1. Choose Erase and drag across the body.
  2. Click empty canvas once.
  3. Press Ctrl+Z. Nothing changes; the screenshot is pixel-identical.
  4. Press Ctrl+Z again. Only now is the erase undone.
- **Cause:** `canvas.gd:61-62` calls `session.checkpoint()` on mouse-down before `dab()` checks that the point is inside the frame (`canvas.gd:53`). The same happens with a press that doesn't move.

**D4. The file dialogs default to the wrong folders for this checkout**
- **Repro:**
  - **Open measurements** and **Open draft** both open in `wildbond-godot/tests/mosshog_family`.
  - The cleaned #576 manifest is in `tests/mosshog_clean`.
  - The drafts that **Save draft** writes are in `user://drafts`.
  - The **Mosshog family** button also loads the pre-cleanup `mosshog_family` sheets.
- **Cause:** `workbench.gd:165` (`dialog.current_dir=Session.family_manifest().get_base_dir()` for every non-save mode) and `session.gd:20`.

**D5. The destructive button holds focus in the unsaved prompt**
- **Repro:** make an edit, click **Mosshog family**, and press Enter. The edits are discarded, because the focus ring is on **Discard and continue**.
- **Cause:** a default `ConfirmationDialog` (`workbench.gd:94`) with the OK button relabelled as the destructive action.
- **Evidence:** `07`.

**Minor (no fix needed to use the tool):**
- At 1200×820, "Apply offset to this cycle" sits below the fold (`16` shows it at 800×600).
- Erased pixels are low-contrast on the dark checkerboard.
- After **Open draft** the view resets to frame 0.
- Export folder names are not human-readable.
- Arrow keys and Space are silently ignored after you touch a spinbox. This is documented, but the frame doesn't move and the UI gives no hint why.

## Notes on what was measured

- **Undo/redo:** I compared cursor-free window captures (`ffmpeg -draw_mouse 0`):
  - erase vs base: differs
  - Ctrl+Z vs base: identical
  - Ctrl+Shift+Z vs erase: identical
  - empty-click vs erase: identical
  - Ctrl+Z after empty-click: identical, which is the no-op step (D3)
  - a second Ctrl+Z vs base: identical
- **Draft JSON:** `pixels` was `{}` after the root edit. After the paint stroke it was `{"mosshog:13": 11 px}`. Anchors for frames 12 to 15 were `[35,62]`; all other frames were unchanged.
- **Exported atlas:** frame 13 has `region [78,213,78,71]` and `anchor [37,64]`, and the painted stroke is present in `atlas.png`.

## Top three actions (for Codex, none made here)

1. **D1:** fit the zoom to the space above the ground line, for example `min(... , (size.y*.62-40)/anchor_y)`, and set `clip_contents=true` on the viewer. It is the first thing a user sees.
2. **D2:** make the onion useful. Draw the ghosts *over* the current frame as tinted outlines or silhouettes at about 40 to 50% alpha (or offer a "ghosts on top" toggle), so interior drift shows.
3. **D3 + D5 + D4 (small UX fixes):**
   - only checkpoint once a dab actually lands inside the frame;
   - put focus on Cancel in the unsaved dialog;
   - start Open draft in `user://drafts`;
   - start Open measurements in the last-used folder, or in `mosshog_clean` on #576.

## Questions for owners

- **Game Art Director:** should the onion show interior drift (D2)? Right now it can't, and that is the main reason to use it on the cleaned walk.
- **Dev Lead:** should **Mosshog family** and the dialog default point at `mosshog_clean` on the #576 stack, or stay on the original sheets (D4)? Also, should the unsaved-close path get an automated check, given it couldn't be tested here without a window manager?
