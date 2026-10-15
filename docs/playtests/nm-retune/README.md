# NM-RETUNE: a longer first evening

This is reproducible engineering evidence, not a timed human playtest. The task is the balance-only assignment to dot in [#373](https://github.com/ecbarish/generations/issues/373#issuecomment-6180470748), using the 45–75-minute **active-play** target in `docs/research/office-idle-progression.md` §8.6. No district move is implemented or claimed by this PR.

## What changed

Only eleven numerical literals in `games/night-market/model.js` change: six cost-growth factors and five production rates. All six base prices, hand payouts, hire requirements, unlock conditions, shared milestones, save fields, the four-hour cap and 50% offline rate remain unchanged. No production functions, UI, art, shared code, versions, or release files change.

| Stall | Cost growth before → after | Coins/second per owned stall before → after |
|---|---:|---:|
| Tea | 1.07 → 1.11 | 0.5 → 0.5 |
| Dumpling | 1.08 → 1.15 | 4 → 0.5 |
| Lantern | 1.09 → 1.15 | 30 → 2.5 |
| Mooncake | 1.10 → 1.15 | 250 → 5 |
| Incense | 1.11 → 1.15 | 2,200 → 50 |
| Story Mat | 1.12 → 1.15 | 22,000 → 500 |

The original gentle prices and fast later-tier income compounded too quickly. Tea itself needed a modest growth change: leaving it unchanged permits a tea-only million in about 38 minutes. The new growth factors stay within the spec's allowed 1.05–1.15 range. The later rates slow the compounding while the same shared 25/50/100 milestones remain worth buying. Incense is included because a saver can reach it before the first million; measuring only the original spending policy misses that route.

These are new tuning numbers, superseding the starting values described in the existing game README/model comment. Generations Reviewer owns the game's release/version bookkeeping. A human fun-score or launch approval is still required separately.

## Reproduce

From this checkout:

    node tools/night-market-pacing.cjs --baseline-ref 5e5a3893a0478a7aa4816348c1dba85cbd7a6829 --check
    node tools/run-all-checks.cjs night-market
    node tools/run-all-checks.cjs

The first command loads the real idle core and game model, for both the recorded baseline and current working tree. It simulates two hours, validates the old-save fixture on both builds, and verifies that stripping only `growth` and `rate` numbers makes both production source files identical. `timings.json` records the model SHA-256 values, all balance values, timing results, first hires, 10/30/60-minute snapshots and purchase gaps. The same pure runner is loaded by the browser regression page.

## Before and after

| Deterministic policy | Before: first million | After: first million | After: tea ×2 milestone |
|---|---:|---:|---:|
| Original active, highest affordable tier | 8m05s | 65m28s | 1m40s |
| Deliberate saver, best next-stall payback | 6m34s | 65m31s | 1m37s |
| Deliberate saver, also plans milestone bundles | 8m39s | 63m24s | 1m37s |
| Ideal continuous hold + next-stall saver | 5m24.75s | 48m06.25s | 31s |
| Ideal continuous hold + milestone saver | 7m18.25s | 49m43s | 31s |
| Background tab, buying once a minute | 11m09s | 88m40s | 37m00s |
| Tea-only control | 38m24s | 101m58s | 1m39s |

Five active policies fall within the 45–75-minute target. This is a measured set of strategies, not proof of a universal minimum or maximum. The two intentionally restricted controls are slower: a once-a-minute shopper takes about 89 minutes, and refusing all other stalls takes about 102 minutes. The target is not claimed for those controls or every possible player.

### Exact assumptions

- Original active and minute-glance profiles match the pre-existing test's ordering: one hand serve each second until every available vendor is hired; one second of current income; then buy max in the highest affordable tier. They do no extra hand work after hiring. Buying happens every second or every 60 seconds respectively. This reproduces the reported 485-second baseline.
- Savers first purchase 25 tea stalls, then choose the lowest next-stall payback across all hired/unlocked rows, including unaffordable ones, and wait for that choice. They can buy multiple affordable units in a one-second decision. Milestone savers also consider saving the total price for 25/50/100 owned before buying that bundle through normal single-unit purchases.
- Hold stress profiles use independent integer-millisecond schedules: first serve at 350ms, further serves every 120ms, income every 250ms, buying every 1,000ms. They instantly redirect hand work to new vendors and otherwise keep serving the highest unlocked stall. There is no travel, reading or pointer-movement cost. This is an idealised high-input strategy, not a claim that a person holds and buys simultaneously.
- No offline earnings, free cash, changed production APIs or altered milestones are used in any timed run. Baseline and retune use the same simulator. The old save is a separate compatibility test, never the start of a timing run.

## Opening, progression and waits

The original active profile still hires Mei after exactly 25 serves at 25 seconds. Tea still starts at five coins and produces 0.5/s; all hand rewards and all six hire requirements are preserved. Tea's first milestone moves from 65 to 100 seconds, comfortably within the ten-minute target. Bo is hired at 56 seconds, An at three minutes and Qiao at 11m34s. Four stall types are purchased by 30 minutes, and four are still being developed at one hour.

At 30 minutes, that profile owns `[75,38,20,2,0,0]`, earns 248/s and has earned 294,585.5 lifetime coins. At one hour it owns `[84,45,27,9,0,0]`, earns 393/s and has earned 868,678.5 lifetime coins. Its longest gap between purchases before a million is **80 seconds**, so the target is not produced by a forced multi-minute buying dead end. That upper gap is asserted in the standalone measurement check.

Saving is a tradeoff: the next-stall saver voluntarily waits up to 443 seconds for its chosen purchase; the milestone saver can reserve coins for 1,352 seconds rather than buy cheaper available stalls. Their hold variants have maximum chosen waits of 326 and 1,142 seconds. These are heuristic decisions, not blocked controls. They are disclosed because a longer economy still needs a fresh feel/playtest judgement. The minute-glance profile's maximum purchase gap is 120 seconds.

The old browser assertion requiring more than 1,000/s after 30 minutes encoded the economy this task is replacing. It is replaced by stronger tests of actual time-to-million, early-milestone timing and no first-ten-minute rush. Existing checks for four purchased types at 30 minutes, growing income, a 2–600-second frontier purchase, office progression, and every input/save/offline regression are retained.

## Save compatibility

`legacy-v1.json` is a literal fixture in the pre-retune v1 schema, with fractional cash/lifetime, an already-earned million, varied hires/serves, milestone ownership and bulk mode. Both the old and new model validate it and preserve every field through restore/serialize. The browser suite also loads it through the real game, reloads the page, and checks that earned balances and every stall survive. Existing checks retain the unknown-version refusal, offline summary, automatic save timestamp and other games' storage isolation.

Existing players keep their earned cash, lifetime total, ownership, hires, hand work and save settings. **Their future production and future offline credit use the new rates, and their next purchases use the new growth factors.** There is no reset or migration, and no subtraction of coins they already earned.

## Verification state

- Standalone deterministic measurement and scope/save checks: passed.
- The model portion of the real HTML regression suite: 71 assertions passed in a Node VM. This is not a browser pass.
- JavaScript syntax and `git diff --check`: passed. Independent code/pacing review found no blocking issue; additional hold/frontier, 250ms-buy and 5/15-second-buy sensitivity runs stayed within the active target.
- Implementation head `a0f095bb2b6881062cadcddaf77fc786e160a7a2`: all 28 aggregate suites passed, including 98 Night Market real-browser assertions, in [Checks run 38653944153](https://github.com/ecbarish/generations/actions/runs/38653944153). The final documentation/main-reconciliation head receives a separate exact-head run; its result is recorded in the PR self-check.
- No screenshot, human-session duration, phone-play score, visual approval, merge or publication is claimed. Local Chromium cannot launch because its process-singleton socket is denied. The dot cloud browser was available but could not reach this checkout's localhost server. This task changes no layout or art; browser CI checks the rendered numeric payback text and real controls.
