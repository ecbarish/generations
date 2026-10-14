# Launch summary

Evan, 2026-10-14, redone the same evening. **Finished means playable and fun.** The fun bar is at least **7/10**. Further improvements do not hold a game. These dates replace the earlier ones. They use the measured merge rate. There is no "guests work part-time" discount.

A date is three parts, added up, then rounded up to a calendar day from 2026-10-14:

1. **Build** = pulls left ÷ the lane's feature rate.
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

**Likely** uses the 7-day feature rate. **Slower** uses the 14-day feature rate, two playtest rounds, and the 2-day buffer.

| Game | Build, likely | Playtest, likely | Buffer | Total | Date | Build, slower | Playtest, slower | Buffer | Total | Date |
|---|---|---|---|---:|---|---|---|---|---:|---|
| Little Ranch | 2 / 3.00 = 0.67 days | 1 round × 1 day | 0 | 1.67 | **2026-10-16** | 2 / 1.50 = 1.33 | 2 days + 1 / 1.50 = 0.67 | 2 | 6.00 | **2026-10-20** |
| Lantern Bowl | 4 / 0.86 = 4.67 days | 1 day | 0 | 5.67 | **2026-10-20** | 5 / 0.43 = 11.67 | 2 days + 1 / 0.43 = 2.33 | 2 | 18.00 | **2026-11-01** |
| Night Market | 2 / 0.29 = 7.00 days | 1 day | 0 | 8.00 | **2026-10-22** | 2 / 0.14 = 14.00 | 2 days + 1 / 0.14 = 7.00 | 2 | 25.00 | **2026-11-08** |
| Wildbond | 7 / 4.43 = 1.58 days | 1 day | 0 | 2.58 | **2026-10-17** | 7 / 2.43 = 2.88 | 2 days + 1 / 2.43 = 0.41 | 2 | 7.29 | **2026-10-22** |

Night Market's rate is 2 pulls in the whole fortnight (IDLE-CORE and IDLE-NM1, both on 14 October). That is why its build time is days, not hours. The work left is two small pulls.

## Where the games are

Merged since the last draft: Night Market **#403** (`d9cde61`), Little Ranch **#400** LR18 (`43785a4`), **#381** LR17, Lantern Bowl 5a **#383**, **#380**, and **#399**. **#404** LR19 and **#409** LR20 are on hold.

| Game | Owner | Finish, in short | Must-haves still open | Pulls left | Likely | Slower | First task |
|---|---|---|---|---|---|---|---|
| Little Ranch | Side Games Dev Lead (Grok and dot help) | First visit reaches bedtime; fun ≥ 7/10; sound choice survives reload; phone; no crash | Bedtime in the first sitting; sound preference kept; phone session; fun ≥ 7/10. LR17 and LR18 are merged | 2S | 2026-10-16 | 2026-10-20 | LRL-1, bedtime in the first visit |
| Lantern Bowl | Side Games Dev Lead | Reads as football in 5 seconds; Retro Bowl passing, no auto-aim; routes before the snap; fun ≥ 7/10; version label fits at 360px | 5b-1, 5b-2, 5c (label and median carry 2.7 vs 3), save on Arcade.versions. 5a is merged | 2M + 2S likely. Slower counts the label and the carry as their own S, so 5 pulls | 2026-10-20 | 2026-11-01 | 5b-1, controls and passing |
| Night Market | Side Games Dev Lead | One stall on the idle core, found from the hub; the payback label tells the truth; fun ≥ 7/10; phone | Hub entry; relabel "pays for itself". #403 is merged. The 1M-coin retune waits for the district slice. The hidden-tab clamp is SSA's, and it does not block | 2S | 2026-10-22 | 2026-11-08 | NM-HUB, the hall entry |
| Wildbond | Wildbond & Starfall Dev Lead | Menu, including Choose Ripplet; battles open on the action menu; an obvious Catch; an objective; then the 9 sprites; fun ≥ 7/10 (now 5/10); phone still untested | WBL-1 through WBL-10 and WBL-14. WBL-6 comes after WBL-4. #380 and #399 are merged | 4M + 3S = 7 | 2026-10-17 | 2026-10-22 | WBL-1, menu, status bar, and Choose Ripplet |

Full lists: [launch-little-ranch.md](launch-little-ranch.md), [launch-lantern-bowl.md](launch-lantern-bowl.md), [launch-night-market.md](launch-night-market.md), [launch-wildbond.md](launch-wildbond.md).
