# Current direction — Evan, 2026-10-17

> "I basically now want a pokemon game but we build the world and story around it and maybe add our own creatures over time. And we can add features"

This is the priority for this development thread. Pokemon supplies the primary creature roster and familiar battle/collecting conventions. Wildbond supplies the original region, settlements, characters, quests, ranch and story. Original creatures such as Bogsnap can join selectively over time; a large generated original roster is no longer the immediate art priority. Existing original content and saves are preserved rather than removed.

Use Gen 1–4 creature/art references and the Pokemon-inspired UI already explored. Prefer ready assets, suitable licensed systems and the existing tested code to drawing/rebuilding everything. The optional private import boundary remains intact. Keep the user's requested progression from older presentation toward more modern environments in mind; one measured geography should survive those presentation changes.

The region should be interconnected. The existing #455 design, #465 art and WBW-3 graph govern routes/loops; the latest local map-first study at #552 supplies a planning workflow. Do not mistake merged design documents, an art reference or a town demo for integrated regional gameplay.

## Build order

1. **Durable play loop:** Pokemon partner/follower, six-member party, catch into party/storage, heal/buy, persistent progress, reliable resume. WB-JOURNEY-1 supplies this first foundation.
2. **Proper Pokemon data/mechanics adapter:** canonical small roster, typing/matchups, stats/moves/accuracy/PP, catching rates, XP/leveling/evolution and migration from pilot records. Choose actual starters as part of that coherent roster, not by treating the three available import samples as final. Keep original-species records compatible through their own namespace.
3. **Measured opening chapter:** integrate Larkhaven's existing healing inn/shop/ranch/paddock, Maren/Wren and current quests into the new presentation. Use #552's measured layout and reserve Millgrass/Dewcut connections from the regional graph; verify real destination landings. Avoid writing a competing opening or generic replacement town.
4. **A complete first expedition:** trainer/wild encounters, a clear journey goal, rewards, return paths and existing story progression that persist. Playtest the whole loop for readability, pace and fun before adding more regions.
5. **Distinctive features in small tested increments:** ranching, breeding/training, richer party/storage/bag tools, field abilities, optional quests and regional loops. Add a feature because it improves play, not because another game has a long checklist.

The existing study battle adapter is explicitly not canonical Pokemon simulation. Replacing that adapter is ahead of mass sprite generation or expanding the world into more disconnected demonstrations. The present chapter save is separate from the adventure; integration needs an explicit migration strategy rather than overwriting either file.
