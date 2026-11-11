# Patent Pending

You run a tiny patent office in a small town. You start with one Better Paperclip. Stamp the desk to file it, file more inventions, and hire a clerk when an invention can run without you. Eighteen inventions climb from that clip to a Sky-ship. Improvements multiply one invention or the whole bureau. A charter closes the office and keeps the seals. Each seal adds 2 percent to every filing fee after that.

This is the first playable slice. The longer climb and the late-game balance are left for a second pull.

## Why the stamp stays

Penny Loop's counter pays about two seconds of income. A playtest found that pointless once managers were running. Patent Pending keeps one wide button, Stamp the desk, and gives it two beats on purpose.

Until the invention you have selected has a clerk, each stamp files it for five coins. Stamps in the same second share that one fee, so tapping faster does not pile it up. A stamp improvement multiplies that fee, and it still does not grow with the office. Clerk Pip costs 120 coins, about a minute of slow stamping. The guided steps ask for five stamps, then Pip.

Once that invention has a clerk, stamps stop paying a fee. Four stamps, each within a few seconds of the last, boost that invention for eight seconds, at one and a half times its filing. The button counts them, so a tap every two or three seconds still fills the row. The boost ends on its own, and another one waits until it has. You choose the invention by tapping its row. The button is a burst you aim, not a penny you outgrow.

## Away from the desk

Clerks keep filing while the page is closed. Come back after half a minute and a card names the time away, what each clerk filed, the total, and the next filing those fees can now pay for. Collect puts it in the drawer. The time is taken from the moment you left the page, not from the last save. The first four hours count, at the full clerk rate. Three night-ledger improvements add four, four, and twelve hours. One goal asks you to come back after the clerks have had about twenty minutes. The shared idle core does the bulk prices, the doublings at 25, 50 and 100, and the tab title. Today's docket is picked from the date on this device. One invention files two, three, or four times as much until tomorrow. There is no network call. Goals and the loose filing slip pay 30 to 60 seconds of what the clerks are filing, in whole coins, and they ignore a boost that is already running. A slip you catch says how many coins landed in the drawer. The first improvement on a row, and the first lamp, stay on Penny Loop's prices. Later copies, later lamps, and lasting changes cost more and multiply less, so the middle of the game still has a filing worth saving for. Improvements multiply one invention, or the whole office, and the name shows the times.

## What a charter shows first

The Charter tab shows the seals you would gain, the seals you would hold, and the permanent bonus before and after. It lists what you keep and what you lose. The hint says to keep filing when there is no seal, to wait for five seals when the bonus is still small, and to file when the bonus is at least ten percent. Filing uses that same preview. The result matches the numbers on the tab.

You keep the seals, the achievements, the goal you had reached, the return streak, the sound setting, and the fees you have ever filed. You lose the fees in the drawer, the inventions, the clerks, the improvements, and a combo that was in progress.

## Credits

The ladder, the costs and the seal formula come from Penny Loop by PENNY (@pennyloopHQ), MIT. The licence is `LICENSE-penny-loop.txt`. The names, the office and the pictures are original. There are no third-party pictures, no outside fonts, and no brand names.

## For the next change

`data.js` holds the eighteen inventions, the improvements, the goals and the achievements. `model.js` holds the rules and does not touch the page. `game.js` draws the office. Saves use `patent-pending-save-v1` through `shared/engine.js`. The game is new, so there is no older save to migrate.

Checks: `node tools/run-all-checks.cjs patent-pending`

Open `games/patent-pending/index.html`. The Lab card is in `launcher/games.js`.
