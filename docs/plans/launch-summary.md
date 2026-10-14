# Launch summary

Evan, 2026-10-14. One page. **Finished means playable and fun**, not "the pull request merged." Further improvements do not hold a game. The fun bar is at least **7/10**, confirmed for Lantern Bowl, Night Market and Wildbond.

Little Ranch's dates are still **pending dev-lead check**. Lantern Bowl, Night Market and Wildbond are **checked by dev lead**.

The bar for every game: a newcomer plays the first session without help; Playtester fun at least 7/10; no blocker or major bug; plays on a phone where that applies; one clear goal.

**Pace behind the dates.** Squash merges on `main` from 2026-09-30 through 2026-10-14 (14 days, first-parent commits whose subject ends with `(#NNN)` and does not start with "Merge"): Wildbond 6 (3.0 a week), Lantern Bowl 3 (1.5), Little Ranch 1 (0.5; its toys in that window mostly used merge commits), Night Market 1 (0.5, and that was IDLE-CORE). Guest AIs are part-time. The dates in the table are the leads' forward rates, not that raw burst. Wildbond's checked pace is about 2 pulls a week.

| Game | Owner | Finish, in short | Must-haves | Pulls left | Likely | Slower | First task |
|---|---|---|---|---|---|---|---|
| Little Ranch | Side Games Dev Lead (Grok and dot help) | First visit reaches bedtime; fun ≥ 7/10; sound choice survives reload; phone; no crash | Bedtime in the first sitting; sound preference kept; phone session; fun ≥ 7/10 | 2S block finish. #400 LR18 may land as polish and does not set the date | 2026-11-04 | 2026-11-18 | LRL-1, bedtime in the first visit |
| Lantern Bowl | Side Games Dev Lead | A newcomer plays a match that reads as football in 5 seconds; Retro Bowl passing with no auto-aim; routes shown before the snap; fun ≥ 7/10; phone, including the version label at 360px | Readable field (#383, merging); passing and play art; score, down and clock; median carry nearer 3 than 2.7; save on Arcade.versions; phone; fun ≥ 7/10 | 1M merging, then 2M + 2–3S | 2026-11-11 | 2026-12-02 | 5b-1, controls and passing |
| Night Market | Side Games Dev Lead | One stall you work yourself, on the idle core, found from the hub; fun ≥ 7/10; reload keeps it; phone | Hand work before a hire; capped offline and an away summary; reload; hub entry; phone; fun ≥ 7/10 | 1L + 2S. The L is #403, built, 56 tests pass, ready once its checks are green | 2026-11-04 | 2026-11-18 | Hub entry. The stall is already in #403 |
| Wildbond | Wildbond & Starfall Dev Lead | Nine battle sprites wired; menu, including Choose Ripplet; a fair battle; a first catch that cannot fail; fun ≥ 7/10 (now 5/10, partial); phone session must pass and is not yet tested | Sprites (S, in progress); menu and Choose Ripplet; battle starts on the action menu; guided first catch; objective and early pace; road, north exit and Continue | 4M + 2S. WBL-11 and WBL-12 are SSA, parallel, and do not block unless Godot uses them | 2026-11-11 | 2026-12-09 | WBL-6, wire the 9 battle sprites |

Full lists: [launch-little-ranch.md](launch-little-ranch.md), [launch-lantern-bowl.md](launch-lantern-bowl.md), [launch-night-market.md](launch-night-market.md), [launch-wildbond.md](launch-wildbond.md).
