# Wildbond Pokemon-first chapter foundation

WB-JOURNEY-1, Codex / Evan, 2026-10-17, [PR #553](https://github.com/ecbarish/generations/pull/553), stacked on #552. Evan's current direction: Pokemon is the primary creature roster; Wildbond supplies its original interconnected world, story and added features. Original creatures can join gradually. The [direction and build order](DIRECTION.md) record that priority for future work.

## Completed increment

The town/trail prototype now has a persistent Pokemon-party loop: partner choice from the three installed samples, a matching animated lead follower, Pokemon on both sides of a battle, catches into a six-member party or sixty-member storage, party lead/store/withdraw controls, healing/purchases/rewards and a saved catch-and-return goal. Party HP and PP survive encounters and reopening; battle initialization no longer resets PP. Full storage blocks capture before spending a ball, duplicate result return cannot duplicate a catch/reward, and defeat restores the team beside the Center.

The existing crash-safe writer is reused. A separate versioned chapter file retains unique individuals, collection, supplies, wallet, goal/counters and a world checkpoint. Corrupt primaries can recover a valid backup; unreadable/unrecoverable or newer-version files are held without overwrite. The original adventure save is never opened. Saving inside a service resumes at its outside doorstep. Mid-battle closure resumes the pre-battle checkpoint; outcomes commit on Return to Trail.

Six-member party choices and bag recipients were checked for clipping, including the Back button and the last berry recipient. No shared engine/UI/save code is changed; the new adapters reuse those classes in the export-excluded chapter folder.

## Play and limits

[Play First Journey.bat](../../../wildbond-godot/tests/journey/Play%20First%20Journey.bat) launches the new build. [Controls, save policy and check commands](../../../wildbond-godot/tests/journey/README.md) are beside it. The installed trainer and imported Pokemon art remain external; public captures use original placeholders.

This is a durable foundation, **not yet the measured Larkhaven map, original story integration or canonical Pokemon mechanics**. The existing seven-element/stat/move/catching adapter remains a pilot proxy. Leveling, evolution, true type matchups, abilities and complete status/learnset behavior still need the proper data adapter. Current pilot species/levels are not the final starter selection. The next data pass must migrate version 1 records; no silent save reset.

## Verification

All **28 existing repository suites pass**, including Wildbond **26,962/0**, Starfall **488/0** and 23 unchanged save names. The separate chapter suite passes **43 portable / 44 private assertions**, covering choice/identity, save/reopen, HP/PP, wallet/items, corrupt/future saves, collection/storage, duplicate rewards, full capacity, six-party UI and defeat recovery. The focused tests use only their own process-specific save files.

Native Forward+ (Vulkan) and Compatibility (OpenGL) both pass pointer partner choice, Catch/Return, Center healing, save and fresh-scene resume, with clean exit. A controlled low-HP seeded encounter makes catch regression deterministic; this is not a human playtest or a claim about natural capture odds. Browser/mobile delivery and performance remain unvalidated.

Public evidence: [partner choice](captures/choose-partner.png), [world](captures/first-journey.png), [battle](captures/pokemon-battle.png), [restored catch](captures/caught-and-restored.png), [party after reopening](captures/saved-party.png), plus [Compatibility captures](compatibility/). Private Pokemon/trainer captures remain outside Git.

Production maps, original species/story/quest data, existing saves and public exports are unchanged. Next work follows the recorded order: proper Pokemon data/mechanics with migration, then the measured Larkhaven/Thornwood chapter and existing story hooks. No more disconnected towns or bulk original sprite generation are needed before that integration.
