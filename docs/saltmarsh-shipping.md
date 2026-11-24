# Saltmarsh Shipping Office: the coast

Evan approved this on 24 November 2026, from the mid-game proposal, with two changes. Year two is in this pass. A person playing reaches the first lighthouse in about five minutes and the last voyage in about forty minutes.

This page is the design for that pass. Chunk 1 builds the path. Voyages, captain posts, the Night Cut, and packing the last voyage stay labelled as coming until their own chunks.

## What the player does

You still buy boats. That is the minute-to-minute play.

A route opens once. One Sign, and then it is crewed by one kind of boat. Kelp Road takes rowboats, Tea Reach takes sloops, Gull Rock takes schooners, and Reed Channel takes barks. Another boat of that kind makes that route pay more. There is no second contract on a route.

Every few minutes the Coast Chart names a lighthouse. Each lighthouse has one fixed coin price and one Light button. The order is Pier, Headland, Reed, Quay.

- Pier. Voyages from the quay are coming.
- Headland. Captain posts are coming. Wren, Bramble, Hollis, or Pell will take one route each.
- Reed. The Night Cut is coming. It will take half the time, and some cargo can be lost.
- Quay. Sixteen barks have to be at their moorings. Packing for the last voyage is coming.

The one choice that stays is a pilot or a chart. A pilot is for the risky cargo, which is coming with the voyages. A chart makes every boat earn 10% more. The choice sits in the page. It does not cover the buys.

## The Coast Chart

The chart is an ordered list of stops. Each stop has exactly one requirement and a live count, such as "Quay: 11/16 barks." The current stop is the one the goal bar names. The hint is the buy that moves that requirement. Buying anything else is allowed, and it does not count as the hint.

The strip above the harbour lists the stops. It is a working list. The Game Art Director draws the final chart.

Year one ends at the last voyage. That stop is on the chart after the Quay light. The packing itself is coming, so the stop is a note that the voyage is the next work, not a second shop.

## Year two

Year two is Frost Lane and the Glass Lighthouse, the same two names the office already used, set into this model.

Both are stops on the Coast Chart after the last voyage. Frost Lane opens once, crewed by barks, with one Sign. The Glass Lighthouse is one Light button at a fixed price. Lighting it is marked as the winter storm lifting, and that storm is coming with the later chunks.

## What is gone

Contract depths and signing a route again, spare sails, harbour jobs, errands, the separate raise step, the house lamp as its own milestone, and the bell-or-coal choice are gone. Hollis Headland is the Headland Lighthouse, not its own route. The Night Cut is not a route.

The early office stays. Three cargoes by hand, the rowboats, Capt. Wren, the sloops, the sheds, and the hull-or-shed choices are still there.

## Save

The live key is `saltmarsh-shipping-save-v2`. A file under the old key is left where it is. This office starts a new one. There is no migration.

## How the length is judged

A person-paced run buys only what the goal names, and waits about two seconds once the coins are there. That run should light the Pier at about five minutes and reach the last voyage at about forty minutes. The tool is `node tools/saltmarsh-pacing.cjs`. It is a simulation, not a watched play. A watched play at 390 and 1280 pixels is recorded with the pull.
