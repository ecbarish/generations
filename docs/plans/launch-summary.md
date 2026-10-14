# Launch summary

Evan, 2026-10-14, redone the same evening. **Finished means playable and fun.** The fun bar is at least **7/10**. Further improvements do not hold a game. These dates replace the earlier ones. They use the measured merge rate. There is no "guests work part-time" discount.

A date is three parts, added up, then rounded up to a calendar day from 2026-10-14:

1. **Build** = bundles left ÷ the lane's feature rate. The rate was measured per merged pull. Applying it to a bundle makes the date an estimate.
2. **Playtest** = the rounds below. A round is one Playtester session. The known fixes are already in the build count, so the likely case is one confirmation day and no second fix. The slower case adds a second round: another day, plus one fix pull at the 14-day rate.
3. **Buffer** = extra days that are not in the rate. Likely uses **0**. Slower uses **2**, and that 2 is the only padding.

## How a merged pull was counted

`git log origin/main --first-parent` from 2026-10-01 through 2026-10-14. A merged pull is a commit whose subject ends with `(#NNN)` and does not start with "Merge", or a commit that starts with "Merge pull request" or "Merge PR". Docs and bookkeeping are subjects that start with `docs:`, `COMMS:` or `QUEUE:`, or that say bookkeeping or session log. A feature pull is any other merged pull in that lane. "Live", "publish" and "publication" notes are counted in the lane, and left out of the feature rate, because the build maths is for feature pulls.

Seven calendar days had no merged pull: 1–5 October, 7 October and 8 October. They still count in the per-day rate.

| Lane | 7 days (8–14 Oct) | per day | of which feature | feature per day | 14 days (1–14 Oct) | per day | feature | feature per day |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Little Ranch | 28 | 4.00 | 21 | 3.00 | 28 | 2.00 | 21 | 1.50 |
| Lantern Bowl | 6 | 0.86 | 6 | 0.86 | 6 | 0.43 | 6 | 0.43 |
| Night Market / idle | 2 | 0.29 | 2 | 0.29 | 2 | 0.14 | 2 | 0.14 |
| Wildbond | 34 | 4.86 | 31 | 4.43 | 37 | 2.64 | 34 | 2.43 |
| Docs / bookkeeping | 21 | 3.00 | 11 | 1.57 | 21 | 1.50 | 11 | 0.79 |
| Everything else | 189 | 27.00 | 188 | 26.86 | 193 | 13.79 | 192 | 13.71 |
| **All lanes** | **280** | **40.00** | **259** | **37.00** | **287** | **20.50** | **266** | **19.00** |

Per day is the count divided by 7 or by 14. One of Wildbond's 31 feature pulls in the 7-day window is the hub button (#396). Leaving it in does not move Wildbond's date.

**Likely** uses the 7-day feature rate on the bundle count, plus 1 playtest day. **Slower** uses the 14-day feature rate, two playtest rounds, and the 2-day buffer. These per-pull rates are applied to bundles, so the dates are estimates.

Playtester scored the launch games on 2026-10-14: Night Market **5/10**, Lantern Bowl **6/10**, Little Ranch **7/10**. Open gaps are now bundles. A phone-layout playtest is the confirmation day, not an extra bundle. Payback hint and offline label are done (#421, `1459413`).

| Game | Bundles | Build, likely | Playtest, likely | Buffer | Total | Date | Build, slower | Playtest, slower | Buffer | Total | Date |
|---|---:|---|---|---:|---:|---|---|---|---:|---:|---|
| Little Ranch | 2 | 2 / 3.00 = 0.67 days | 1 day | 0 | 1.67 | **2026-10-16** | 2 / 1.50 = 1.33 | 2 days + 1 / 1.50 = 0.67 | 2 | 6.00 | **2026-10-20** |
| Lantern Bowl | 5 | 5 / 0.86 = 5.83 days | 1 day | 0 | 6.83 | **2026-10-21** | 5 / 0.43 = 11.67 | 2 days + 1 / 0.43 = 2.33 | 2 | 18.00 | **2026-11-01** |
| Night Market | 4 | 4 / 0.29 = 14.00 days | 1 day | 0 | 15.00 | **2026-10-29** | 4 / 0.14 = 28.00 | 2 days + 1 / 0.14 = 7.00 | 2 | 39.00 | **2026-11-22** |
| Wildbond | 4 | 4 / 4.43 = 0.90 days | 1 day | 0 | 1.90 | **2026-10-16** | 4 / 2.43 = 1.65 | 2 days + 1 / 2.43 = 0.41 | 2 | 6.06 | **2026-10-21** |

Counting each gap as its own pull, the dates on this pull request were Little Ranch 18 Oct / 24 Oct, Lantern Bowl 26 Oct / 13 Nov, Night Market 12 Nov / 27 Dec, and Wildbond 17 Oct / 22 Oct.

The 0.29 and 0.14 pulls-a-day rates come from a small sample of 2 merges, so the 29 October and 22 November Night Market dates are placeholders, not forecasts, and the rate will be re-measured after a week of real merges now that a guest bot is on the lane.

## Where the games are

Merged since the last draft: Night Market **#403** (`d9cde61`), payback and the offline label **#421** (`1459413`), Little Ranch **#400** LR18 (`43785a4`), **#381** LR17, Lantern Bowl 5a **#383**, **#380**, and **#399**. **#404** LR19 and **#409** LR20 are on hold.

| Game | Owner | Finish, in short | Bundles still open | Bundles | Likely | Slower | First bundle |
|---|---|---|---|---|---|---|---|
| Little Ranch | Side Games Dev Lead | Fun is 7/10. Toy polish, then the first visit | LR-POLISH, LR-VISIT. Phone playtest is not a bundle | 2 | 2026-10-16 | 2026-10-20 | LR-POLISH, toy polish |
| Lantern Bowl | Side Games Dev Lead | Fun is 6/10. Passing and ratings, a phone fix, the playbook, the readout, the save | LB-PASS, LB-PHONE, LB-BOOK, LB-READ, LB-SAVE. Kick off is the phone bundle, not passing | 5 | 2026-10-21 | 2026-11-01 | LB-PASS, passing and ratings |
| Night Market | Guest lane (#373) | Fun is 5/10. Playtest fixes, visuals, phone layout, hall entry. Payback and offline are done | NM-PLAY, NM-VIS, NM-PHONE, NM-HUB. NM-RETUNE and NM-CLAMP stay off this count. Dates are placeholders | 4 | 2026-10-29 | 2026-11-22 | NM-PLAY, playtest fixes |
| Wildbond | Wildbond & Starfall Dev Lead | Menu and battle start, then the catch, the sprites, the road. Fun is 5/10 | WB-OPEN, WB-CATCH, WB-LOOK, WB-ROAD | 4 | 2026-10-16 | 2026-10-21 | WB-OPEN, menu and battle start |

Full lists: [launch-little-ranch.md](launch-little-ranch.md), [launch-lantern-bowl.md](launch-lantern-bowl.md), [launch-night-market.md](launch-night-market.md), [launch-wildbond.md](launch-wildbond.md).
