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
Playtester scored the launch games on 2026-10-14: Night Market **5/10**, Lantern Bowl **6/10**, Little Ranch **7/10**. The new gaps are in the pull counts below. The rates are unchanged. A phone-layout row is a Playtester session, already covered by the confirmation day, so it is not an extra build pull. Night Market's payback hint may share the existing relabel pull: the likely count does that, and the slower count gives it a pull of its own.

| Game | Build, likely | Playtest, likely | Buffer | Total | Date | Build, slower | Playtest, slower | Buffer | Total | Date |
|---|---|---|---|---:|---|---|---|---|---:|---|
| Little Ranch | 8 / 3.00 = 2.67 days | 1 round × 1 day | 0 | 3.67 | **2026-10-18** | 8 / 1.50 = 5.33 | 2 days + 1 / 1.50 = 0.67 | 2 | 10.00 | **2026-10-24** |
| Lantern Bowl | 9 / 0.86 = 10.50 days | 1 day | 0 | 11.50 | **2026-10-26** | 10 / 0.43 = 23.33 | 2 days + 1 / 0.43 = 2.33 | 2 | 29.67 | **2026-11-13** |
| Night Market | 8 / 0.29 = 28.00 days | 1 day | 0 | 29.00 | **2026-11-12** | 9 / 0.14 = 63.00 | 2 days + 1 / 0.14 = 7.00 | 2 | 74.00 | **2026-12-27** |
| Wildbond | 7 / 4.43 = 1.58 days | 1 day | 0 | 2.58 | **2026-10-17** | 7 / 2.43 = 2.88 | 2 days + 1 / 2.43 = 0.41 | 2 | 7.29 | **2026-10-22** |

The previous likely / slower dates, before these gaps, were Little Ranch 16 Oct / 20 Oct, Lantern Bowl 20 Oct / 1 Nov, Night Market 22 Oct / 8 Nov, and Wildbond 17 Oct / 22 Oct. Wildbond's pull count did not change.

Night Market's rate is still 2 pulls in the fortnight. Eight pulls at that rate is why its likely date moves to 12 November, and nine pulls on the 14-day rate is why the slower date moves to 27 December. Visual life is two of those pulls: the lane strip, coin pop and flicker, then steam, flash and passers-by. The 0.29 and 0.14 pulls-a-day rates come from a small sample of 2 merges, so the 12 November and 27 December dates are placeholders, not forecasts, and the rate will be re-measured after a week of real merges now that a guest bot is on the lane.

## Where the games are

Merged since the last draft: Night Market **#403** (`d9cde61`), Little Ranch **#400** LR18 (`43785a4`), **#381** LR17, Lantern Bowl 5a **#383**, **#380**, and **#399**. **#404** LR19 and **#409** LR20 are on hold.

| Game | Owner | Finish, in short | Must-haves still open | Pulls left | Likely | Slower | First task |
|---|---|---|---|---|---|---|---|
| Little Ranch | Side Games Dev Lead (guest bots welcome). Cookie art spec is Game Art Director first | Fun is 7/10. Dough tint, fox, cookie and cutter, sign wiggle, phone overlaps, bedtime, sound | LRL-6 through LRL-10 and LRL-12, plus LRL-1 and LRL-4. Phone playtest LRL-11 is not a build pull | 8 | 2026-10-18 | 2026-10-24 | LRL-6, dough tint |
| Lantern Bowl | Side Games Dev Lead (guest bots welcome) | Fun is 6/10. Sideways Kick off and Settings, then ratings, throw, drives, 5b and 5c | LBL-12, LBL-7 through LBL-10, plus 5b-1, 5b-2, 5c and the save. Phone playtest LBL-11 is not a build pull. Slower adds one pull for the label and the carry | 9 likely, 10 slower | 2026-10-26 | 2026-11-13 | LBL-12, sideways Kick off and Settings |
| Night Market | Guest lane (#373) has the payback hint, the offline label, the pour, and both visual pulls. Side Games Dev Lead keeps the rest. The visual spec is from Game Art Director | Fun is 5/10. Two visual pulls, back control and fold, payback, pour, save, offline, hall | Two visual pulls, NM-FIX-8, pour, save, offline, hub, and payback together with the relabel. Slower counts payback on its own. Phone playtest is not a build pull. NM-RETUNE and NM-CLAMP stay off this count. The 12 Nov and 27 Dec dates are placeholders | 8 likely, 9 slower | 2026-11-12 | 2026-12-27 | NM-FIX-3, lane strip, coin pop and flicker |
| Wildbond | Wildbond & Starfall Dev Lead | Menu, including Choose Ripplet; battles open on the action menu; an obvious Catch; an objective; then the 9 sprites; fun ≥ 7/10 (now 5/10); phone still untested | WBL-1 through WBL-10 and WBL-14. WBL-6 comes after WBL-4. #380 and #399 are merged | 4M + 3S = 7 | 2026-10-17 | 2026-10-22 | WBL-1, menu, status bar, and Choose Ripplet |

Full lists: [launch-little-ranch.md](launch-little-ranch.md), [launch-lantern-bowl.md](launch-lantern-bowl.md), [launch-night-market.md](launch-night-market.md), [launch-wildbond.md](launch-wildbond.md).
