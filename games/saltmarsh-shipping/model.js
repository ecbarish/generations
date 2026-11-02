/* Saltmarsh Shipping Office (IDLE-SS1). Rules only: no page, no storage.
   Load shared/engine.js, shared/idle-core.js and shared/roster.js first.
   Boat income is the boats you have bought. A captain is a person on a timed
   haul, paid from the job clock, never a multiplier on the boats.
   The phase layer lives in phase.js. Trade routes, lighthouses and the
   last voyage live here too. Boat income is never a global multiplier. */
(function () {
  'use strict';

  var SAVE_KEY = 'saltmarsh-shipping-save-v1';
  var SAVE_VERSION = 1;
  var HAND_PAY = 5;
  var HAND_TRIPS = 3;
  var UNLOCK_AT = 10;
  /* Wren arrives on her own, then the sloop shop a little later, so the pier does not open all at once. */
  var WREN_AT = 18;
  var SLOOP_AT = 32;
  /* A hand player with about eighteen barks at minute 15 meets these before then. */
  var BARK_QUAY = 12;
  var BARK_LAMP = 16;
  var OFFLINE_RATE = 0.5;
  var WAREHOUSE_HOURS = 2;
  var MAX_WAREHOUSES = 4;
  /* Cost of the shed that brings the office up to this many. The first shed is already standing. */
  var WAREHOUSE_COST = [0, 480, 8400, 125000];

  /* First three tiers are the §8.2 starting points. The bark is tuned so the
     deep-water boats keep an active office busy after the schooners, without a
     global multiplier. Payback on the first bark is about a minute. */
  var BOATS = [
    {
      id: 'rowboat', name: 'Rowboat',
      base: 8, growth: 1.07, rate: 0.6,
      looks: ['One boat tied at the dock', 'Flags along the pier', 'A longer dock', 'A crane over the crates'],
      next: 'Capt. Wren takes the pier once enough rowboats are tied up.'
    },
    {
      id: 'sloop', name: 'Sloop',
      base: 120, growth: 1.08, rate: 5,
      looks: ['One sloop on the mooring', 'Flags on the sloops', 'A second pier', 'A crane that reaches the sloops'],
      next: 'Ten sloops, and the fleet chart unrolls.'
    },
    {
      id: 'schooner', name: 'Schooner',
      base: 1800, growth: 1.10, rate: 40,
      looks: ['One schooner outside the bar', 'Signal flags', 'A deeper berth', 'A crane on the outer pier'],
      next: 'Ten schooners mark the trade routes. They sail on the next tide.'
    },
    {
      id: 'bark', name: 'Bark',
      base: 28000, growth: 1.08, rate: 800,
      looks: ['One bark on the deep mooring', 'House flags', 'A stone quay', 'A crane tall enough for the barks'],
      next: 'The deep-water boats carry the long cargoes.'
    }
  ];

  var BOAT_NAMES = ['Grey Lark', 'Kettle', 'Bar Light', 'Reed'];
  var CAPTAINS = [
    {
      id: 'wren', name: 'Capt. Wren', tier: 0, every: 20, pay: 180,
      habit: 'Wren counts every coin aloud, and a gull always takes one.',
      lines: [
        function (coins) { return 'Capt. Wren is back with ' + coins + ' coins. A gull took one off the pile.'; },
        function (coins) { return 'Capt. Wren counts the coins twice and lands ' + coins + '. One is gone.'; },
        function (coins) { return 'The gull left Capt. Wren ' + coins + ' coins. She is already counting the next pile.'; }
      ]
    },
    {
      id: 'bramble', name: 'Capt. Bramble', tier: 1, every: 24, pay: 700,
      habit: 'Bramble waits for the kettle, then brings the tea money with the haul.',
      lines: [
        function (coins) { return 'Capt. Bramble is back with ' + coins + ' coins. The kettle money is in the pile.'; },
        function (coins) { return 'The kettle boiled, and Capt. Bramble landed ' + coins + ' coins.'; },
        function (coins) { return 'Capt. Bramble would not cast off until the tea was poured. ' + coins + ' coins came in.'; }
      ]
    },
    {
      id: 'hollis', name: 'Capt. Hollis', tier: 2, every: 30, pay: 9000,
      habit: 'Each return, Hollis adds a mark to the fleet chart.',
      lines: [
        function (coins) { return 'Capt. Hollis is back with ' + coins + ' coins and a new mark on the chart.'; },
        function (coins) { return 'Capt. Hollis drew the headland and landed ' + coins + ' coins.'; },
        function (coins) { return 'A fresh mark on the chart, and ' + coins + ' coins from Capt. Hollis.'; },
        function (coins) { return 'Capt. Hollis waited out a squall and still landed ' + coins + ' coins.'; },
        function (coins) { return 'The chart gains a cove. Capt. Hollis brought ' + coins + ' coins.'; },
        function (coins) { return 'Capt. Hollis names the tide, not the weather, and lands ' + coins + ' coins.'; },
        function (coins) { return 'A gull tried Hollis\'s pencil. The chart is fine, and ' + coins + ' coins came in.'; },
        function (coins) { return 'Capt. Hollis shaded the bar and added ' + coins + ' coins to the book.'; }
      ]
    },
    {
      id: 'pell', name: 'Capt. Pell', tier: 3, every: 36, pay: 54000,
      habit: 'Pell names the boat she sailed, and the log says which one.',
      lines: [
        function (coins, boat) { return 'Capt. Pell is back aboard the ' + boat + ' with ' + coins + ' coins.'; },
        function (coins, boat) { return 'The ' + boat + ' made the pier. Capt. Pell landed ' + coins + ' coins.'; },
        function (coins, boat) { return 'Capt. Pell will not say the ' + boat + ' is the favourite. ' + coins + ' coins came ashore.'; }
      ]
    }
  ];
  /* One-off fittings. A flat extra per boat, not a multiplier on the whole office.
     Each one is paired with a shed. Taking one locks the other. */
  var FITTINGS = [
    { id: 'sloop-hull', tier: 1, need: 10, bonus: 1, cost: 700, name: 'Lighter sloop hulls', line: 'Each sloop earns 1 more coin a second, from now on.' },
    { id: 'schooner-hold', tier: 2, need: 10, bonus: 8, cost: 6000, name: 'Deeper schooner holds', line: 'Each schooner earns 8 more coins a second, from now on.' }
  ];
  var FORKS = [
    { id: 'sloop', fit: 'sloop-hull', goal: 'Choose a lighter sloop hull, or another shed.' },
    { id: 'schooner', fit: 'schooner-hold', goal: 'Choose a deeper schooner hold, or another shed.' }
  ];

  function fresh() {
    return {
      cash: 0,
      lifetime: 0,
      seen: null,
      bulk: 1,
      trips: 0,
      warehouses: 1,
      sound: 0,
      boats: BOATS.map(function () { return { owned: 0 }; }),
      captains: CAPTAINS.map(function () { return { hired: false, brought: 0, hauls: 0 }; }),
      fittings: {},
      forks: { sloop: null, schooner: null, quay: null },
      waivedSheds: 0,
      marks: 0,
      fleetSeen: false,
      routes: { kelp: 0, gull: 0, tea: 0, headland: 0, reed: 0, night: 0 },
      lights: { pier: 0, headland: 0, reed: 0, quay: 0 },
      routeGross: {},
      routeCut: {},
      quotes: {},
      lightQuotes: {},
      quayQuote: null,
      finaleCost: null,
      voyages: 0,
      ended: false,
      born: null,
      charts: 0,
      keptCaptain: null,
      jobs: {},
      log: []
    };
  }

  function spec(i) { return BOATS[i] || null; }
  function captainSpec(i) { return CAPTAINS[i] || null; }

  function unlocked(state, i) {
    if (!spec(i) || !state.boats[i]) return false;
    if (!(state.trips >= HAND_TRIPS)) return false;
    if (i === 0) return true;
    if (i === 1) return state.boats[0].owned >= SLOOP_AT;
    return state.boats[i - 1].owned >= UNLOCK_AT;
  }

  function lookIndex(owned) {
    if (owned >= 100) return 3;
    if (owned >= 50) return 2;
    if (owned >= 25) return 1;
    return 0;
  }

  function timesWord(owned) {
    var m = Idle.milestoneMult(owned);
    if (m >= 8) return 'eight times as much';
    if (m >= 4) return 'four times as much';
    if (m >= 2) return 'twice as much';
    return 'what one boat earns';
  }

  function fittingBonus(state, i) {
    if (!state.fittings) return 0;
    var extra = 0;
    FITTINGS.forEach(function (fit) {
      if (fit.tier === i && state.fittings[fit.id]) extra += fit.bonus;
    });
    if (i === 3 && state.fittings['bark-hold']) extra += 80;
    return extra;
  }

  function production(state, i) {
    var boat = state.boats[i];
    if (!boat || !(boat.owned > 0) || !spec(i)) return 0;
    /* The fitting is a flat extra on each boat. Milestones still double only the boat's own rate. */
    return spec(i).rate * boat.owned * Idle.milestoneMult(boat.owned) + fittingBonus(state, i) * boat.owned;
  }

  /* One haul, in coins. Wren's gull takes one per landing. Bramble's kettle adds the tea money. */
  function haulCoins(cap, units, rate) {
    if (!cap || !(units > 0)) return 0;
    var scale = typeof rate === 'number' && rate >= 0 ? rate : 1;
    var gross = cap.pay * units * scale;
    var tea = cap.id === 'bramble' ? 10 * units * scale : 0;
    var gull = cap.id === 'wren' ? units : 0;
    var coins = Math.round(gross + tea - gull);
    return coins > 0 ? coins : 1;
  }

  function income(state) {
    var n = 0;
    for (var i = 0; i < BOATS.length; i++) n += production(state, i);
    return n;
  }

  /* What the captains add between hauls, so the rate line moves when one is hired. */
  function captainRate(state) {
    var n = 0;
    for (var i = 0; i < CAPTAINS.length; i++) {
      if (!state.captains[i] || !state.captains[i].hired) continue;
      n += haulCoins(CAPTAINS[i], 1, 1) / CAPTAINS[i].every;
    }
    return n;
  }

  function addCash(state, amount) {
    if (!(amount > 0) || !isFinite(amount)) return 0;
    state.cash += amount;
    state.lifetime += amount;
    return amount;
  }

  function wrenHired(state) {
    return !!(state.captains[0] && state.captains[0].hired);
  }

  /* Whole coins under a thousand, then the same short scale as the rest of the arcade. */
  function shedChoiceText(cost) {
    if (cost == null) return 'The sheds are full';
    return 'Another shed · ' + coins(cost) + ' coins';
  }

  function coins(n) {
    n = Math.round(n);
    if (!isFinite(n)) return '0';
    if (n < 0) return '-' + coins(-n);
    if (n < 1000) return String(n);
    return Arcade.fmt(n);
  }

  /* The first three cargoes are a flat 5, so the shop still opens on the same coins.
     After that, the skiff pays about three seconds of what the office earns, and it stays yours. */
  function handPay(state) {
    if (!state || state.trips < HAND_TRIPS) return HAND_PAY;
    var scaled = Math.round(officeRate(state) * 3);
    return Math.max(HAND_PAY, scaled);
  }

  function handSell(state, i) {
    if (i === undefined || i === null) i = 0;
    if (i !== 0) return { ok: false, reason: 'closed' };
    var pay = handPay(state);
    state.trips += 1;
    addCash(state, pay);
    return { ok: true, ready: state.trips >= HAND_TRIPS, pay: pay };
  }

  function boatsForCaptain(i) {
    return i === 0 ? WREN_AT : UNLOCK_AT;
  }

  function canHire(state, i) {
    var cap = captainSpec(i);
    if (!cap || !state.captains[i] || state.captains[i].hired) return false;
    if (!(state.trips >= HAND_TRIPS)) return false;
    return state.boats[cap.tier].owned >= boatsForCaptain(i);
  }

  function askLine(i) {
    var cap = captainSpec(i);
    if (!cap) return '';
    if (cap.tier === 0) return 'Ask ' + cap.name + ' to take the pier.';
    var boat = spec(cap.tier);
    return 'Ask ' + cap.name + ' to take a ' + boat.name.toLowerCase() + '.';
  }

  function hire(state, i, now) {
    if (!canHire(state, i)) {
      if (!captainSpec(i)) return { ok: false, reason: 'closed' };
      if (state.captains[i].hired) return { ok: false, reason: 'hired' };
      return { ok: false, reason: 'boats' };
    }
    var when = typeof now === 'number' && isFinite(now) ? now : Date.now();
    state.captains[i].hired = true;
    if (!state.jobs || typeof state.jobs !== 'object') state.jobs = {};
    state.jobs[captainSpec(i).id] = { job: 'haul', since: when };
    var cap = captainSpec(i);
    var haul = haulCoins(cap, 1, 1);
    var welcome = cap.tier === 0
      ? cap.name + ' takes the pier. '
      : cap.name + ' takes a ' + spec(cap.tier).name.toLowerCase() + '. ';
    pushLog(state, welcome + cap.habit + ' That is ' + coins(haul) + ' coins every ' + cap.every + ' seconds.', when);
    return { ok: true, id: cap.id };
  }

  function quote(state, i, mode) {
    if (!spec(i)) return { count: 0, cost: 0, blocked: 'closed' };
    var boat = spec(i);
    var owned = state.boats[i] ? state.boats[i].owned : 0;
    var one = Idle.bulkCost(boat.base, boat.growth, owned, 1);
    if (!unlocked(state, i)) return { count: 0, cost: one, blocked: state.trips >= HAND_TRIPS ? 'closed' : 'trips' };
    var n, cost;
    if (mode === 'max') {
      n = Idle.maxAffordable(boat.base, boat.growth, owned, state.cash);
      cost = n > 0 ? Idle.bulkCost(boat.base, boat.growth, owned, n) : one;
      return { count: n, cost: cost, blocked: n > 0 ? null : 'cost' };
    }
    n = mode === 10 || mode === '10' ? 10 : 1;
    cost = Idle.bulkCost(boat.base, boat.growth, owned, n);
    if (!(cost >= 0) || cost > state.cash) return { count: 0, cost: cost, blocked: 'cost' };
    return { count: n, cost: cost, blocked: null };
  }

  function buy(state, i, mode) {
    var q = quote(state, i, mode);
    if (!(q.count > 0)) return { ok: false, reason: q.blocked || 'cost', count: 0, cost: q.cost };
    state.cash -= q.cost;
    if (state.cash < 1e-6) state.cash = 0;
    var beforeOwned = state.boats[i].owned;
    state.boats[i].owned += q.count;
    var notes = growthNotes(state, i, beforeOwned);
    return { ok: true, count: q.count, cost: q.cost, notes: notes };
  }

  function growthNotes(state, i, before) {
    var after = state.boats[i].owned;
    var boat = spec(i);
    var notes = [];
    function cross(at, text) {
      if (before < at && after >= at) notes.push(text);
    }
    if (i === 3) {
      cross(BARK_QUAY, 'Twelve barks, and the quay grows longer. House flags go up.');
      cross(14, 'Fourteen barks. The tide board goes up on the quay.');
      cross(20, 'Twenty barks. A second line of bollards stands on the quay.');
      cross(BARK_LAMP, 'The bar lamp is lit. You can see it from the office window.');
    }
    cross(25, boat.name + 's reach 25. Flags go up, and each one earns twice as much.');
    cross(30, boat.name + 's reach 30. Another lantern goes up along the pier.');
    cross(40, boat.name + 's reach 40. The ropes are doubled on the pier.');
    cross(50, boat.name + 's reach 50. The dock grows longer, and each one earns four times as much.');
    cross(75, boat.name + 's reach 75. A new gangway reaches them.');
    cross(100, boat.name + 's reach 100. A crane rises over them.');
    notes.forEach(function (text) { pushLog(state, text); });
    return notes;
  }

  function offlineCap(state) {
    var n = state && state.warehouses > 0 ? Math.floor(state.warehouses) : 1;
    if (n < 1) n = 1;
    if (n > MAX_WAREHOUSES) n = MAX_WAREHOUSES;
    return n * WAREHOUSE_HOURS * 3600;
  }

  /* Skipped sheds (the player took the fitting instead) move the price up a step. */
  function shedIndex(state) {
    return (state.warehouses || 1) + (state.waivedSheds || 0);
  }

  function warehousePrice(state) {
    var idx = shedIndex(state);
    if (idx >= MAX_WAREHOUSES) return null;
    return WAREHOUSE_COST[idx];
  }

  function buyWarehouse(state, fromChoice) {
    if (!fromChoice && openFork(state)) return { ok: false, reason: 'choice', cost: warehousePrice(state) };
    var idx = shedIndex(state);
    if (idx >= MAX_WAREHOUSES) return { ok: false, reason: 'full' };
    var price = WAREHOUSE_COST[idx];
    if (!(state.cash >= price)) return { ok: false, reason: 'cost', cost: price };
    state.cash -= price;
    if (state.cash < 1e-6) state.cash = 0;
    state.warehouses += 1;
    if (state.warehouses > MAX_WAREHOUSES) state.warehouses = MAX_WAREHOUSES;
    return { ok: true, warehouses: state.warehouses, cost: price };
  }

  function fittingById(id) {
    for (var i = 0; i < FITTINGS.length; i++) if (FITTINGS[i].id === id) return FITTINGS[i];
    return null;
  }

  function fittingOffers(state) {
    return FITTINGS.filter(function (fit) {
      if (state.fittings && state.fittings[fit.id]) return false;
      return !!(state.boats[fit.tier] && state.boats[fit.tier].owned >= fit.need);
    }).map(function (fit) {
      return {
        id: fit.id, tier: fit.tier, cost: fit.cost, name: fit.name, line: fit.line, bonus: fit.bonus,
        affordable: state.cash >= fit.cost
      };
    });
  }

  function forkById(id) {
    for (var i = 0; i < FORKS.length; i++) if (FORKS[i].id === id) return FORKS[i];
    return null;
  }

  function forkForFit(fitId) {
    for (var i = 0; i < FORKS.length; i++) if (FORKS[i].fit === fitId) return FORKS[i];
    return null;
  }

  function forkTaken(state, id) {
    return !!(state.forks && state.forks[id]);
  }

  /* The first open pair. Taking either side locks the other. */
  function openFork(state) {
    if (!state.forks) state.forks = { sloop: null, schooner: null };
    for (var i = 0; i < FORKS.length; i++) {
      var fork = FORKS[i];
      if (forkTaken(state, fork.id)) continue;
      var fit = fittingById(fork.fit);
      if (fit && state.boats[fit.tier] && state.boats[fit.tier].owned >= fit.need) return fork;
    }
    return null;
  }

  function choiceOffer(state) {
    var fork = openFork(state);
    if (!fork) return null;
    var fit = fittingById(fork.fit);
    var price = warehousePrice(state);
    return {
      id: fork.id,
      goal: fork.goal,
      fit: {
        id: fit.id, name: fit.name, cost: fit.cost, line: fit.line,
        affordable: state.cash >= fit.cost
      },
      shed: {
        name: 'Another shed',
        cost: price,
        line: 'Two more hours kept when the game is closed. The boats are not changed.',
        affordable: price != null && state.cash >= price
      }
    };
  }

  function chooseFork(state, forkId, which, now) {
    var fork = forkById(forkId);
    if (!fork) return { ok: false, reason: 'closed' };
    if (forkTaken(state, fork.id)) return { ok: false, reason: 'locked' };
    var open = openFork(state);
    if (!open || open.id !== fork.id) return { ok: false, reason: 'closed' };
    var fit = fittingById(fork.fit);
    if (which === 'fit') {
      if (!(state.cash >= fit.cost)) return { ok: false, reason: 'cost', cost: fit.cost };
      state.cash -= fit.cost;
      if (state.cash < 1e-6) state.cash = 0;
      if (!state.fittings) state.fittings = {};
      state.fittings[fit.id] = true;
      state.forks[fork.id] = 'fit';
      state.waivedSheds = (state.waivedSheds || 0) + 1;
      pushLog(state, fit.name + '. ' + fit.line + ' The shed stays unbuilt.', now);
      return { ok: true, which: 'fit', id: fit.id };
    }
    if (which === 'shed') {
      var bought = buyWarehouse(state, true);
      if (!bought.ok) return bought;
      state.forks[fork.id] = 'shed';
      pushLog(state, 'Another shed, instead of the ' + fit.name.toLowerCase() + '. The office keeps two more hours when the game is closed.', now);
      return { ok: true, which: 'shed', warehouses: state.warehouses, cost: bought.cost };
    }
    return { ok: false, reason: 'closed' };
  }

  function buyFitting(state, id, now) {
    var fork = forkForFit(id);
    if (!fork) return { ok: false, reason: 'closed' };
    return chooseFork(state, fork.id, 'fit', now);
  }

  function pushLog(state, text, now) {
    if (!state.log) state.log = [];
    state.log.unshift({ t: typeof now === 'number' ? now : Date.now(), text: text });
    if (state.log.length > 12) state.log.length = 12;
  }

  function rosterFor(state) {
    return Roster.create({
      get: function () { return state; },
      capHours: offlineCap(state) / 3600,
      slots: function () { return CAPTAINS.length; },
      jobs: {
        haul: {
          name: 'Haul',
          every: function (who) {
            for (var i = 0; i < CAPTAINS.length; i++) if (CAPTAINS[i].id === who) return CAPTAINS[i].every;
            return 60;
          },
          give: function (who, units) {
            var cap = null;
            var index = -1;
            for (var i = 0; i < CAPTAINS.length; i++) if (CAPTAINS[i].id === who) { cap = CAPTAINS[i]; index = i; }
            if (!cap || !(units > 0) || !state.captains[index]) return;
            var rate = state._awayRate > 0 ? state._awayRate : 1;
            var paid = haulCoins(cap, units, rate);
            addCash(state, paid);
            var row = state.captains[index];
            row.brought = (row.brought || 0) + paid;
            row.hauls = (row.hauls || 0) + units;
            if (cap.id === 'hollis') state.marks = Math.min(12, (state.marks || 0) + units);
            var boat = BOAT_NAMES[(row.hauls - 1) % BOAT_NAMES.length];
            if (units > 1) {
              pushLog(state, cap.name + ' is back from ' + units + ' hauls, ' + coins(paid) + ' coins in all.', state._logNow);
            } else {
              var line = cap.lines[(row.hauls - 1) % cap.lines.length];
              pushLog(state, line(coins(paid), boat, units), state._logNow);
            }
          }
        }
      }
    });
  }

  /* Pay every captain's clock once. The same `now` a second time pays nothing,
     because the job's since moves forward with the crates. */
  function collectCaptains(state, now, awayRate) {
    if (!state.jobs) state.jobs = {};
    state._awayRate = typeof awayRate === 'number' && awayRate >= 0 ? awayRate : 1;
    state._logNow = typeof now === 'number' ? now : Date.now();
    var rows = rosterFor(state).collect(state._logNow);
    state._awayRate = 1;
    return rows;
  }

  function nextIn(state, i, now) {
    var cap = captainSpec(i);
    if (!cap || !state.captains[i] || !state.captains[i].hired) return 0;
    return rosterFor(state).nextIn(cap.id, now);
  }

  function marginalRate(state, i) {
    var owned = state.boats[i] ? state.boats[i].owned : 0;
    var before = production(state, i);
    state.boats[i].owned = owned + 1;
    var after = production(state, i);
    state.boats[i].owned = owned;
    return after - before;
  }

  function paybackSeconds(state, i) {
    var boat = spec(i);
    var owned = state.boats[i] ? state.boats[i].owned : 0;
    if (!boat || !unlocked(state, i)) return Infinity;
    var cost = Idle.bulkCost(boat.base, boat.growth, owned, 1);
    var added = marginalRate(state, i);
    if (!(cost > 0) || !(added > 0) || !isFinite(cost) || !isFinite(added)) return Infinity;
    return cost / added;
  }

  function paybackLabel(seconds) {
    if (!(seconds > 0) || !isFinite(seconds)) return '';
    if (seconds >= 60) return Arcade.fmtTime(Math.round(seconds));
    return Math.max(1, Math.round(seconds)) + 's';
  }

  function rateWords(n) {
    var shown, text;
    if (!(n > 0)) return '0 coins a second';
    if (n < 10) {
      shown = Math.round(n * 10) / 10;
      text = Math.abs(shown - Math.round(shown)) < 0.001 ? String(Math.round(shown)) : shown.toFixed(1);
    } else {
      shown = Math.round(n);
      text = coins(shown);
    }
    return text + (Math.abs(shown - 1) < 0.001 ? ' coin a second' : ' coins a second');
  }

  function paybackLine(state, i) {
    var boat = spec(i);
    if (!boat) return '';
    var label = paybackLabel(paybackSeconds(state, i));
    if (!label) return '';
    var added = marginalRate(state, i);
    var mult = Idle.milestoneMult((state.boats[i] ? state.boats[i].owned : 0) + 1);
    var times = mult >= 8 ? 'eight times' : mult >= 4 ? 'four times' : mult >= 2 ? 'twice' : '';
    var line = 'The next ' + boat.name.toLowerCase() + ' adds ' + rateWords(added) + ' and pays for itself in ' + label + '.';
    if (times) line += ' The milestone is in that figure: each one earns ' + times + ' as much.';
    return line;
  }

  function shedNote(state) {
    if (!(state && state.waivedSheds > 0)) return '';
    return ' You left a shed unbuilt, so this one is further down the list and costs more.';
  }

  function pluralLook(look, owned) {
    if (owned === 1) return look;
    if (look === 'One boat tied at the dock') return owned + ' boats tied at the dock';
    if (look === 'One sloop on the mooring') return owned + ' sloops on the mooring';
    if (look === 'One schooner outside the bar') return owned + ' schooners outside the bar';
    if (look === 'One bark on the deep mooring') return owned + ' barks on the deep mooring';
    return look;
  }

  function lookLine(state, i) {
    var owned = state.boats[i].owned;
    var boat = spec(i);
    if (!(owned > 0)) return boat.name + 's wait on the price list.';
    var look = pluralLook(boat.looks[lookIndex(owned)], owned);
    if (Idle.milestoneMult(owned) <= 1) return look + '.';
    return look + '. Each one earns ' + timesWord(owned) + '.';
  }

  function awayRule(state) {
    var hours = offlineCap(state) / 3600;
    var sheds = (state && state.warehouses) || 1;
    return 'A closed game earns ' + Math.round(OFFLINE_RATE * 100) + '%, up to ' + hours + 'h (' + sheds + (sheds === 1 ? ' shed' : ' sheds') + '). A page left open keeps the full rate.';
  }

  /* `detail` is the cash the page actually moved: before, boat coins, captain lines, after.
     A closed game uses the half rate. A page that stayed open uses the full rate. */
  function awayCopy(state, summary, detail) {
    detail = detail || {};
    var openPage = !!detail.openPage;
    var sheds = state.warehouses || 1;
    var hours = offlineCap(state) / 3600;
    var hold = sheds === 1 ? 'The shed holds ' + hours + ' hours' : 'The sheds hold ' + hours + ' hours';
    var lead = 'You were gone ' + Arcade.fmtTime(summary.away) + '.';
    if (openPage) {
      lead += ' The page stayed open, so the boats kept the full rate.';
      if (summary.capped) lead += ' One catch-up is held to ' + hours + ' hours.';
    } else {
      lead += ' The game was closed, so the boats earned ' + Math.round(OFFLINE_RATE * 100) + '%.';
      if (summary.capped) lead += ' ' + hold + ', so ' + hours + ' hours counted.';
    }
    var lines = [];
    if (typeof detail.before === 'number') lines.push('You left with ' + coins(detail.before) + ' coins.');
    var boatGain = typeof detail.boatGain === 'number' ? detail.boatGain : (summary.gained || 0);
    lines.push('The boats added ' + coins(boatGain) + ' coins.');
    var captains = detail.captains || [];
    if (!captains.length) lines.push('No captain was at the pier.');
    captains.forEach(function (row) { lines.push(row); });
    if (typeof detail.after === 'number') lines.push('You came back to ' + coins(detail.after) + ' coins.');
    return { title: 'While you were away', lead: lead, lines: lines, box: lines.join(' ') };
  }

  function captainBooks(state) {
    return state.captains.map(function (c) { return c && c.brought ? c.brought : 0; });
  }

  function captainHauls(state) {
    return state.captains.map(function (c) { return c && c.hauls ? c.hauls : 0; });
  }

  function captainAwayLines(state, beforeBrought, beforeHauls) {
    var lines = [];
    var any = false;
    for (var i = 0; i < CAPTAINS.length; i++) {
      var row = state.captains[i];
      if (!row || !row.hired) continue;
      any = true;
      var before = beforeBrought && typeof beforeBrought[i] === 'number' ? beforeBrought[i] : 0;
      var added = (row.brought || 0) - before;
      var haulsBefore = beforeHauls && typeof beforeHauls[i] === 'number' ? beforeHauls[i] : 0;
      var hauls = (row.hauls || 0) - haulsBefore;
      if (added > 0) {
        var word = hauls === 1 ? 'haul' : 'hauls';
        lines.push(CAPTAINS[i].name + ': ' + hauls + ' ' + word + ', ' + coins(added) + ' coins.');
      } else lines.push(CAPTAINS[i].name + ' was out, and no haul landed in this stretch.');
    }
    if (!any) lines.push('No captain was at the pier.');
    return lines;
  }

  function noteFleet(state, now) {
    if (state.fleetSeen) return false;
    state.fleetSeen = true;
    pushLog(state, 'The fleet chart unrolls on the desk.', now);
    return true;
  }

  function setBulk(state, mode) {
    state.bulk = mode === 'max' ? 'max' : mode === 10 || mode === '10' ? 10 : 1;
    return state.bulk;
  }

  function finiteNum(n) { return typeof n === 'number' && isFinite(n); }

  var ROUTES = [
    { id: 'kelp', name: 'Kelp Road', order: 1, depths: 4, risk: 0, first: 100, later: 290, payback: 74, time: 'a short run inside the bar', line: 'Safe and close. The pay is sure.', perk: '' },
    { id: 'gull', name: 'Gull Rock', order: 2, depths: 4, risk: 0.28, wren: true, first: 110, later: 290, payback: 60, time: 'a longer beat', line: 'More coin, if the gulls leave the pile alone.', perk: 'Wren\'s count keeps more of it.' },
    { id: 'tea', name: 'Tea Reach', order: 3, depths: 4, risk: 0, bramble: true, first: 110, later: 290, payback: 66, time: 'a kettle stop', line: 'Bramble knows this water. The run pays better once the kettle has been boiling.', perk: 'Bramble\'s kettle quickens it.' },
    { id: 'headland', name: 'Hollis Headland', order: 4, depths: 4, risk: 0, first: 120, later: 290, payback: 78, time: 'a long leg', line: 'The headland shows once Hollis has marked the chart, or once two other routes are sailing.', perk: 'Hollis drew this one.' },
    { id: 'reed', name: 'Reed Channel', order: 5, depths: 4, risk: 0, first: 130, later: 290, payback: 84, time: 'the deep water', line: 'Pell takes it slow, and it pays.', perk: 'Pell names the boat that goes.' },
    { id: 'night', name: 'Night Cut', order: 6, depths: 4, risk: 0.36, night: true, first: 100, later: 290, payback: 56, time: 'a fast dark run', line: 'Fast, and part of the cargo can vanish before a light is burning.', perk: 'A lamp on the coast keeps more of it.' }
  ];
  var LIGHTS = [
    { id: 'pier', name: 'Pier Light', wait: 280, lines: ['The Pier Light\'s tower is up. Nights get safer.', 'The Pier Light is burning. Gull Rock and the Night Cut keep their cargo.'] },
    { id: 'headland', name: 'Headland Light', wait: 280, lines: ['The Headland Light\'s tower is up. Runs start to quicken.', 'The Headland Light is burning. Every route pays sooner.'] },
    { id: 'reed', name: 'Reed Light', wait: 280, lines: ['The Reed Light\'s tower is up. The far water shows on the chart.', 'The Reed Light is burning. The last voyage can see its road.'] },
    { id: 'quay', name: 'Quay Light', wait: 280, lines: ['The Quay Light\'s tower is up. The captains\' work counts for more.', 'The Quay Light is burning. Wren and Bramble pull harder on their routes.'] }
  ];
  var ROUTE_IDS = ROUTES.map(function (r) { return r.id; });
  var LIGHT_IDS = LIGHTS.map(function (r) { return r.id; });

  function routeById(id) {
    for (var i = 0; i < ROUTES.length; i++) if (ROUTES[i].id === id) return ROUTES[i];
    return null;
  }
  function lightById(id) {
    for (var i = 0; i < LIGHTS.length; i++) if (LIGHTS[i].id === id) return LIGHTS[i];
    return null;
  }
  function routesUnlocked(state) {
    return !!(state && !state.ended && state.trips >= HAND_TRIPS && state.boats && state.boats[2] && state.boats[2].owned >= UNLOCK_AT);
  }
  function routesSailing(state) {
    var n = 0;
    if (!state || !state.routes) return 0;
    ROUTE_IDS.forEach(function (id) { if (state.routes[id] > 0) n += 1; });
    return n;
  }
  function lightsLit(state) {
    var n = 0;
    if (!state || !state.lights) return 0;
    LIGHT_IDS.forEach(function (id) { if (state.lights[id] >= 2) n += 1; });
    return n;
  }
  function allLightsLit(state) { return lightsLit(state) >= LIGHTS.length; }
  function wrenKeep(state) {
    var hauls = state.captains && state.captains[0] ? (state.captains[0].hauls || 0) : 0;
    var keep = Math.min(0.2, hauls * 0.01);
    if (state.lights && state.lights.quay >= 2) keep = Math.min(0.4, keep * 2);
    return keep;
  }
  function brambleHaste(state) {
    var hauls = state.captains && state.captains[1] ? (state.captains[1].hauls || 0) : 0;
    var haste = Math.min(0.16, hauls * 0.008);
    if (state.lights && state.lights.quay >= 2) haste = Math.min(0.32, haste * 2);
    return haste;
  }
  function nightSafety(state) {
    var safety = 0;
    if (state.forks && state.forks.quay === 'lamp') safety += 0.5;
    if (state.lights && state.lights.pier >= 1) safety += 0.5;
    if (state.lights && state.lights.pier >= 2) safety += 0.5;
    return safety > 1 ? 1 : safety;
  }
  function headMult(state) {
    var stage = state.lights && state.lights.headland || 0;
    var m = 1;
    if (stage >= 1) m *= 1.12;
    if (stage >= 2) m *= 1.12;
    return m;
  }
  function routeIncome(state) {
    if (!state || !state.routeGross) return 0;
    var n = 0;
    ROUTES.forEach(function (spec) {
      var gross = state.routeGross[spec.id] || 0;
      if (!(gross > 0)) return;
      var cut = (state.routeCut && state.routeCut[spec.id]) || 0;
      if (spec.wren || spec.night) cut *= (1 - nightSafety(state));
      var g = gross - cut;
      if (g < 0) g = 0;
      if (spec.wren) g *= (1 + wrenKeep(state));
      if (spec.bramble) g *= (1 + brambleHaste(state));
      n += g;
    });
    return n * headMult(state);
  }
  function officeRate(state) {
    return income(state) + captainRate(state) + routeIncome(state);
  }
  function routeVisible(state, spec) {
    if (!routesUnlocked(state)) return false;
    var charts = state.charts || 0;
    if (spec.id === 'headland') return (state.marks || 0) >= 4 || routesSailing(state) >= 2 || charts >= 1;
    if (spec.id === 'reed') {
      var pell = state.captains && state.captains[3] && state.captains[3].hired;
      var barks = state.boats[3] && state.boats[3].owned >= UNLOCK_AT;
      return charts >= 2 || (pell && barks);
    }
    return true;
  }
  function computeRoute(state, spec) {
    var depth = (state.routes && state.routes[spec.id]) || 0;
    var rate = Math.max(1, officeRate(state));
    var stake = depth === 0 ? spec.first : spec.later;
    var risk = spec.risk || 0;
    if (spec.wren) risk = Math.max(0, risk - wrenKeep(state));
    return { id: spec.id, depth: depth, cost: rate * stake, gross: (rate * stake) / spec.payback, risk: risk };
  }
  function quoteRoute(state, spec, lock) {
    var depth = (state.routes && state.routes[spec.id]) || 0;
    var key = spec.id + ':' + depth;
    if (!state.quotes) state.quotes = {};
    if (state.quotes[key]) return state.quotes[key];
    var built = computeRoute(state, spec);
    if (lock) state.quotes[key] = built;
    return built;
  }
  function offerGain(state, quote, spec) {
    var cut = quote.gross * (quote.risk || 0);
    if (spec.wren || spec.night) cut *= (1 - nightSafety(state));
    var g = quote.gross - cut;
    if (g < 0) g = 0;
    if (spec.wren) g *= (1 + wrenKeep(state));
    if (spec.bramble) g *= (1 + brambleHaste(state));
    return g * headMult(state);
  }
  function routeOffers(state, lock) {
    if (!routesUnlocked(state)) return [];
    var list = [];
    ROUTES.forEach(function (spec) {
      if ((state.routes[spec.id] || 0) >= spec.depths) return;
      if (!routeVisible(state, spec)) return;
      list.push(spec);
    });
    list.sort(function (a, b) {
      var ad = state.routes[a.id] || 0;
      var bd = state.routes[b.id] || 0;
      if ((ad === 0) !== (bd === 0)) return ad === 0 ? -1 : 1;
      return a.order - b.order;
    });
    return list.slice(0, 3).map(function (spec) {
      var quote = quoteRoute(state, spec, !!lock);
      return {
        id: spec.id, name: spec.name, depth: quote.depth, depths: spec.depths,
        cost: quote.cost, gain: offerGain(state, quote, spec), risk: quote.risk,
        time: spec.time, line: spec.line, perk: spec.perk,
        affordable: state.cash >= quote.cost
      };
    });
  }
  function signRoute(state, id, now) {
    var spec = routeById(id);
    if (!spec || !routeVisible(state, spec) || (state.routes[id] || 0) >= spec.depths) return { ok: false, reason: 'closed' };
    var quote = quoteRoute(state, spec, true);
    if (!(state.cash >= quote.cost)) return { ok: false, reason: 'cost', cost: quote.cost };
    state.cash -= quote.cost;
    if (state.cash < 1e-6) state.cash = 0;
    state.routes[id] = (state.routes[id] || 0) + 1;
    if (!state.routeGross) state.routeGross = {};
    if (!state.routeCut) state.routeCut = {};
    state.routeGross[id] = (state.routeGross[id] || 0) + quote.gross;
    state.routeCut[id] = (state.routeCut[id] || 0) + quote.gross * (quote.risk || 0);
    state.voyages = (state.voyages || 0) + 1;
    state.quotes = {};
    var depth = state.routes[id];
    pushLog(state, spec.name + ', contract ' + depth + '. ' + spec.line, now);
    return { ok: true, id: id, depth: depth };
  }
  function quoteLight(state, spec, lock) {
    var stage = (state.lights && state.lights[spec.id]) || 0;
    if (stage >= 2) return null;
    var key = spec.id + ':' + stage;
    if (!state.lightQuotes) state.lightQuotes = {};
    if (state.lightQuotes[key]) return state.lightQuotes[key];
    var built = { id: spec.id, stage: stage, cost: Math.max(1, officeRate(state)) * spec.wait, line: spec.lines[stage] };
    if (lock) state.lightQuotes[key] = built;
    return built;
  }
  function lightOffers(state, lock) {
    if (!routesUnlocked(state) || routesSailing(state) < 5) return [];
    var out = [];
    LIGHTS.forEach(function (spec) {
      var quote = quoteLight(state, spec, !!lock);
      if (!quote) return;
      out.push({
        id: spec.id, name: spec.name, stage: quote.stage, cost: quote.cost, line: quote.line,
        verb: quote.stage === 0 ? 'Raise' : 'Light',
        affordable: state.cash >= quote.cost
      });
    });
    return out;
  }
  function buildLight(state, id, now) {
    var spec = lightById(id);
    if (!spec || routesSailing(state) < 5 || state.ended) return { ok: false, reason: 'closed' };
    var quote = quoteLight(state, spec, true);
    if (!quote || !(state.cash >= quote.cost)) return { ok: false, reason: 'cost', cost: quote && quote.cost };
    state.cash -= quote.cost;
    if (state.cash < 1e-6) state.cash = 0;
    state.lights[id] = (state.lights[id] || 0) + 1;
    state.lightQuotes = {};
    pushLog(state, quote.line, now);
    if (allLightsLit(state)) pushLog(state, 'Every lamp on the coast is burning. The last voyage can leave.', now);
    return { ok: true, stage: state.lights[id] };
  }
  function finaleOffer(state, lock) {
    if (!allLightsLit(state) || (state.voyages || 0) < 18 || state.ended) return null;
    if (state.finaleCost == null && lock) state.finaleCost = Math.max(1, officeRate(state)) * 280;
    var cost = state.finaleCost != null ? state.finaleCost : Math.max(1, officeRate(state)) * 280;
    return { cost: cost, affordable: state.cash >= cost, line: 'One last run, past the lights, and the office is finished.' };
  }
  function chartCount(lifetime) {
    if (!(lifetime > 0)) return 0;
    return Math.floor(Math.sqrt(lifetime / 1e7));
  }
  function statsOf(state, now) {
    var boats = 0, hauls = 0;
    (state.boats || []).forEach(function (b) { boats += b.owned || 0; });
    (state.captains || []).forEach(function (c) { hauls += c && c.hauls || 0; });
    var elapsed = 0;
    if (finiteNum(state.born) && finiteNum(now)) elapsed = Math.max(0, (now - state.born) / 1000);
    return {
      elapsed: elapsed, lifetime: state.lifetime || 0, boats: boats,
      voyages: state.voyages || 0, hauls: hauls, lights: lightsLit(state),
      charts: chartCount(state.lifetime || 0)
    };
  }
  function launchFinale(state, now) {
    var offer = finaleOffer(state, true);
    if (!offer || !(state.cash >= offer.cost)) return { ok: false, reason: 'cost', cost: offer && offer.cost };
    state.cash -= offer.cost;
    if (state.cash < 1e-6) state.cash = 0;
    state.ended = true;
    state.ending = statsOf(state, finiteNum(now) ? now : Date.now());
    pushLog(state, 'The last voyage goes out past the lights. The office grows quiet.', now);
    return { ok: true, ending: state.ending };
  }
  function quayOffer(state) {
    if (!state || state.ended || (state.forks && state.forks.quay)) return null;
    if (!state.boats[3] || state.boats[3].owned < BARK_QUAY) return null;
    if (!state.quayQuote) {
      var cost = Math.round(Math.max(1, officeRate(state)) * 80);
      state.quayQuote = { lamp: cost, hold: cost };
    }
    var q = state.quayQuote;
    return {
      id: 'quay',
      goal: 'Choose a lamp on the quay, or deeper bark holds.',
      lamp: { which: 'lamp', name: 'A lamp on the quay', cost: q.lamp, line: 'Nights are safer. Gull Rock and the Night Cut keep more cargo, and a lamp shows on the quay.', affordable: state.cash >= q.lamp },
      hold: { which: 'hold', name: 'Deeper bark holds', cost: q.hold, line: 'Each bark earns 80 more coins a second. The night runs stay as they are.', affordable: state.cash >= q.hold }
    };
  }
  function chooseQuay(state, which, now) {
    var offer = quayOffer(state);
    if (!offer) return { ok: false, reason: 'closed' };
    var card = which === 'lamp' ? offer.lamp : which === 'hold' ? offer.hold : null;
    if (!card) return { ok: false, reason: 'closed' };
    if (!(state.cash >= card.cost)) return { ok: false, reason: 'cost', cost: card.cost };
    state.cash -= card.cost;
    if (state.cash < 1e-6) state.cash = 0;
    if (!state.forks) state.forks = { sloop: null, schooner: null, quay: null };
    state.forks.quay = which;
    if (which === 'hold') {
      if (!state.fittings) state.fittings = {};
      state.fittings['bark-hold'] = true;
      pushLog(state, 'Deeper bark holds. Each bark earns more. The quay lamp stays unbuilt.', now);
    } else {
      pushLog(state, 'A lamp on the quay. Nights are safer. The deeper holds stay unbuilt.', now);
    }
    return { ok: true, which: which };
  }
  function deskChoice(state) {
    if (!state || state.ended) return null;
    var fork = choiceOffer(state);
    if (fork) {
      return {
        id: fork.id,
        goal: fork.goal,
        cards: [
          { which: 'fit', name: fork.fit.name, cost: fork.fit.cost, line: fork.fit.line, affordable: fork.fit.affordable },
          { which: 'shed', name: fork.shed.name, cost: fork.shed.cost, line: fork.shed.line, affordable: fork.shed.affordable }
        ]
      };
    }
    var quay = quayOffer(state);
    if (!quay) return null;
    return { id: 'quay', goal: quay.goal, cards: [quay.lamp, quay.hold] };
  }
  function chooseDesk(state, id, which, now) {
    if (id === 'quay') return chooseQuay(state, which, now);
    return chooseFork(state, id, which, now);
  }
  function settledForks(state) {
    var out = [];
    if (!state || !state.forks) return out;
    FORKS.forEach(function (fork) {
      if (!state.forks[fork.id]) return;
      var fit = fittingById(fork.fit);
      var tookFit = state.forks[fork.id] === 'fit';
      out.push({
        id: fork.id,
        takenName: tookFit ? fit.name : 'Another shed',
        lockedName: tookFit ? 'Another shed' : fit.name
      });
    });
    if (state.forks.quay) {
      var lamp = state.forks.quay === 'lamp';
      out.push({
        id: 'quay',
        takenName: lamp ? 'A lamp on the quay' : 'Deeper bark holds',
        lockedName: lamp ? 'Deeper bark holds' : 'A lamp on the quay'
      });
    }
    return out;
  }
  function wrenPerkLine(state) {
    if (!(state.captains && state.captains[0] && state.captains[0].hired)) return '';
    var pct = Math.round(wrenKeep(state) * 100);
    if (pct <= 0) return 'Wren\'s next hauls trim what the gulls take from Gull Rock.';
    return 'Wren\'s count keeps ' + pct + '% more of Gull Rock.';
  }
  function bramblePerkLine(state) {
    if (!(state.captains && state.captains[1] && state.captains[1].hired)) return '';
    var pct = Math.round(brambleHaste(state) * 100);
    if (pct <= 0) return 'Bramble\'s kettle will shorten the Tea Reach once it is sailing.';
    return 'The kettle shortens the Tea Reach. It pays ' + pct + '% more.';
  }
  function copyOnto(state, next) {
    Object.keys(state).forEach(function (key) { delete state[key]; });
    Object.keys(next).forEach(function (key) { state[key] = next[key]; });
  }
  function newHarbour(state, captainIndex, now) {
    var charts = chartCount(state && state.lifetime);
    var when = finiteNum(now) ? now : Date.now();
    copyOnto(state, fresh());
    state.charts = charts;
    state.born = when;
    if (captainIndex >= 0 && captainIndex < CAPTAINS.length) {
      state.captains[captainIndex].hired = true;
      state.keptCaptain = CAPTAINS[captainIndex].id;
      state.jobs[CAPTAINS[captainIndex].id] = { job: 'haul', since: when };
      pushLog(state, CAPTAINS[captainIndex].name + ' comes across to the new harbour.', when);
    } else {
      pushLog(state, 'A new harbour. The desk is clear.', when);
    }
    if (charts === 1) pushLog(state, 'One chart shows a route before its season.', when);
    else if (charts > 1) pushLog(state, charts + ' charts show routes before their season.', when);
    return state;
  }
  function packCounts(src, ids, max) {
    var out = {};
    ids.forEach(function (id) {
      var n = src && finiteNum(src[id]) ? Math.floor(src[id]) : 0;
      if (n < 0) n = 0;
      if (n > max) n = max;
      out[id] = n;
    });
    return out;
  }
  function packMoneyMap(src) {
    var out = {};
    if (!src || typeof src !== 'object') return out;
    Object.keys(src).sort().forEach(function (key) {
      if (finiteNum(src[key]) && src[key] > 0) out[key] = src[key];
    });
    return out;
  }
  function countsOk(obj, ids, max) {
    if (obj == null) return true;
    if (typeof obj !== 'object') return false;
    for (var i = 0; i < ids.length; i++) {
      if (obj[ids[i]] == null) continue;
      if (!finiteNum(obj[ids[i]]) || obj[ids[i]] < 0 || obj[ids[i]] > max) return false;
    }
    return true;
  }

  function valid(o) {
    if (!o || o.v !== SAVE_VERSION || o.game !== 'saltmarsh-shipping') return false;
    if (!finiteNum(o.cash) || o.cash < 0 || !finiteNum(o.lifetime) || o.lifetime < 0) return false;
    if (!finiteNum(o.trips) || o.trips < 0) return false;
    if (!finiteNum(o.warehouses) || o.warehouses < 1 || o.warehouses > MAX_WAREHOUSES) return false;
    if (o.sound !== 0 && o.sound !== 1 && o.sound !== 2) return false;
    if (!Array.isArray(o.boats) || o.boats.length !== BOATS.length) return false;
    if (!Array.isArray(o.captains) || o.captains.length !== CAPTAINS.length) return false;
    var i;
    for (i = 0; i < o.boats.length; i++) {
      if (!o.boats[i] || !finiteNum(o.boats[i].owned) || o.boats[i].owned < 0) return false;
    }
    for (i = 0; i < o.captains.length; i++) {
      if (!o.captains[i] || typeof o.captains[i].hired !== 'boolean') return false;
      if (o.captains[i].brought != null && (!finiteNum(o.captains[i].brought) || o.captains[i].brought < 0)) return false;
      if (o.captains[i].hauls != null && (!finiteNum(o.captains[i].hauls) || o.captains[i].hauls < 0)) return false;
    }
    if (o.fittings != null && typeof o.fittings !== 'object') return false;
    if (o.forks != null && typeof o.forks !== 'object') return false;
    if (o.waivedSheds != null && (!finiteNum(o.waivedSheds) || o.waivedSheds < 0)) return false;
    if (o.marks != null && (!finiteNum(o.marks) || o.marks < 0)) return false;
    if (o.fleetSeen != null && typeof o.fleetSeen !== 'boolean') return false;
    if (o.jobs != null && typeof o.jobs !== 'object') return false;
    if (o.log != null && !Array.isArray(o.log)) return false;
    if (!countsOk(o.routes, ROUTE_IDS, 4) || !countsOk(o.lights, LIGHT_IDS, 2)) return false;
    if (o.ended != null && typeof o.ended !== 'boolean') return false;
    if (o.quotes != null && typeof o.quotes !== 'object') return false;
    if (o.quayQuote != null && typeof o.quayQuote !== 'object') return false;
    if (o.voyages != null && (!finiteNum(o.voyages) || o.voyages < 0)) return false;
    if (o.charts != null && (!finiteNum(o.charts) || o.charts < 0)) return false;
    if (o.born != null && !finiteNum(o.born)) return false;
    if (o.finaleCost != null && (!finiteNum(o.finaleCost) || o.finaleCost < 0)) return false;
    if (o.routeGross != null && typeof o.routeGross !== 'object') return false;
    if (o.routeCut != null && typeof o.routeCut !== 'object') return false;
    return true;
  }

  function serialize(state, seen) {
    return {
      v: SAVE_VERSION,
      game: 'saltmarsh-shipping',
      cash: state.cash,
      lifetime: state.lifetime,
      seen: typeof seen === 'number' ? seen : state.seen,
      bulk: state.bulk,
      trips: state.trips,
      warehouses: state.warehouses,
      sound: state.sound === 1 || state.sound === 2 ? state.sound : 0,
      boats: state.boats.map(function (b) { return { owned: b.owned }; }),
      captains: state.captains.map(function (c) {
        return { hired: !!c.hired, brought: c.brought || 0, hauls: c.hauls || 0 };
      }),
      fittings: state.fittings && typeof state.fittings === 'object' ? state.fittings : {},
      forks: {
        sloop: state.forks && (state.forks.sloop === 'fit' || state.forks.sloop === 'shed') ? state.forks.sloop : null,
        schooner: state.forks && (state.forks.schooner === 'fit' || state.forks.schooner === 'shed') ? state.forks.schooner : null,
        quay: state.forks && (state.forks.quay === 'lamp' || state.forks.quay === 'hold') ? state.forks.quay : null
      },
      waivedSheds: state.waivedSheds || 0,
      marks: state.marks || 0,
      fleetSeen: !!state.fleetSeen,
      routes: packCounts(state.routes, ROUTE_IDS, 4),
      lights: packCounts(state.lights, LIGHT_IDS, 2),
      routeGross: packMoneyMap(state.routeGross),
      routeCut: packMoneyMap(state.routeCut),
      quotes: state.quotes && typeof state.quotes === 'object' ? state.quotes : {},
      lightQuotes: state.lightQuotes && typeof state.lightQuotes === 'object' ? state.lightQuotes : {},
      quayQuote: state.quayQuote && finiteNum(state.quayQuote.lamp) ? { lamp: state.quayQuote.lamp, hold: state.quayQuote.hold } : null,
      finaleCost: finiteNum(state.finaleCost) ? state.finaleCost : null,
      voyages: state.voyages || 0,
      ended: !!state.ended,
      ending: state.ending || null,
      born: finiteNum(state.born) ? state.born : null,
      charts: state.charts || 0,
      keptCaptain: state.keptCaptain || null,
      jobs: state.jobs || {},
      log: (state.log || []).slice(0, 12)
    };
  }

  function restore(o) {
    var state = fresh();
    if (!valid(o)) return state;
    state.cash = o.cash;
    state.lifetime = o.lifetime;
    state.seen = finiteNum(o.seen) ? o.seen : null;
    state.bulk = setBulk(state, o.bulk);
    state.trips = Math.floor(o.trips);
    state.warehouses = Math.floor(o.warehouses);
    state.sound = o.sound;
    o.boats.forEach(function (b, i) { state.boats[i].owned = Math.floor(b.owned); });
    o.captains.forEach(function (c, i) {
      state.captains[i].hired = c.hired;
      state.captains[i].brought = finiteNum(c.brought) ? c.brought : 0;
      state.captains[i].hauls = finiteNum(c.hauls) ? Math.floor(c.hauls) : 0;
    });
    state.fittings = {};
    if (o.fittings && typeof o.fittings === 'object') {
      FITTINGS.forEach(function (fit) { if (o.fittings[fit.id]) state.fittings[fit.id] = true; });
      if (o.fittings['bark-hold']) state.fittings['bark-hold'] = true;
    }
    state.forks = { sloop: null, schooner: null, quay: null };
    if (o.forks) {
      if (o.forks.sloop === 'fit' || o.forks.sloop === 'shed') state.forks.sloop = o.forks.sloop;
      if (o.forks.schooner === 'fit' || o.forks.schooner === 'shed') state.forks.schooner = o.forks.schooner;
      if (o.forks.quay === 'lamp' || o.forks.quay === 'hold') state.forks.quay = o.forks.quay;
    }
    state.routes = packCounts(o.routes, ROUTE_IDS, 4);
    state.lights = packCounts(o.lights, LIGHT_IDS, 2);
    state.routeGross = packMoneyMap(o.routeGross);
    state.routeCut = packMoneyMap(o.routeCut);
    state.quotes = o.quotes && typeof o.quotes === 'object' ? o.quotes : {};
    state.lightQuotes = o.lightQuotes && typeof o.lightQuotes === 'object' ? o.lightQuotes : {};
    state.quayQuote = o.quayQuote && finiteNum(o.quayQuote.lamp) ? { lamp: o.quayQuote.lamp, hold: finiteNum(o.quayQuote.hold) ? o.quayQuote.hold : o.quayQuote.lamp } : null;
    state.finaleCost = finiteNum(o.finaleCost) ? o.finaleCost : null;
    state.voyages = finiteNum(o.voyages) ? Math.floor(o.voyages) : 0;
    state.ended = !!o.ended;
    state.ending = o.ending || null;
    state.born = finiteNum(o.born) ? o.born : null;
    state.charts = finiteNum(o.charts) ? Math.floor(o.charts) : 0;
    state.keptCaptain = typeof o.keptCaptain === 'string' ? o.keptCaptain : null;
    state.waivedSheds = finiteNum(o.waivedSheds) ? Math.floor(o.waivedSheds) : 0;
    state.marks = finiteNum(o.marks) ? Math.min(12, Math.floor(o.marks)) : 0;
    state.fleetSeen = !!o.fleetSeen;
    state.jobs = {};
    if (o.jobs) {
      Object.keys(o.jobs).forEach(function (id) {
        var job = o.jobs[id];
        if (job && typeof job.job === 'string' && finiteNum(job.since)) state.jobs[id] = { job: job.job, since: job.since };
      });
    }
    state.log = [];
    if (Array.isArray(o.log)) {
      o.log.forEach(function (line) {
        if (line && typeof line.text === 'string') state.log.push({ t: finiteNum(line.t) ? line.t : 0, text: line.text });
      });
      if (state.log.length > 12) state.log.length = 12;
    }
    return state;
  }

  /* A missing save, a broken file, or a save for another game becomes a new office.
     This never throws. There is no migration: nothing has shipped yet. */
  function openSave(raw) {
    try {
      if (!raw || !valid(raw)) return fresh();
      return restore(raw);
    } catch (e) {
      return fresh();
    }
  }

  function createIdle(state, save) {
    return Idle.create({
      getRate: function () { return income(state) + routeIncome(state); },
      apply: function (amount) { addCash(state, amount); },
      maxOfflineSec: offlineCap(state),
      offlineRate: OFFLINE_RATE,
      title: {
        label: 'Saltmarsh Shipping',
        unit: '',
        rate: function () { return officeRate(state); }
      },
      save: function (seen) {
        state.seen = seen;
        if (typeof save === 'function') save(serialize(state, seen));
      }
    });
  }

  window.Saltmarsh = {
    BOATS: BOATS,
    CAPTAINS: CAPTAINS,
    SAVE_KEY: SAVE_KEY,
    SAVE_VERSION: SAVE_VERSION,
    HAND_PAY: HAND_PAY,
    HAND_TRIPS: HAND_TRIPS,
    UNLOCK_AT: UNLOCK_AT,
    WREN_AT: WREN_AT,
    SLOOP_AT: SLOOP_AT,
    BARK_QUAY: BARK_QUAY,
    BARK_LAMP: BARK_LAMP,
    FITTINGS: FITTINGS,
    OFFLINE_RATE: OFFLINE_RATE,
    WAREHOUSE_HOURS: WAREHOUSE_HOURS,
    MAX_WAREHOUSES: MAX_WAREHOUSES,
    fresh: fresh,
    unlocked: unlocked,
    income: income,
    captainRate: captainRate,
    haulCoins: haulCoins,
    production: production,
    addCash: addCash,
    handPay: handPay,
    handSell: handSell,
    canHire: canHire,
    askLine: askLine,
    hire: hire,
    quote: quote,
    buy: buy,
    coins: coins,
    shedChoiceText: shedChoiceText,
    fittingOffers: fittingOffers,
    buyFitting: buyFitting,
    choiceOffer: choiceOffer,
    chooseFork: chooseFork,
    openFork: openFork,
    offlineCap: offlineCap,
    warehousePrice: warehousePrice,
    buyWarehouse: buyWarehouse,
    collectCaptains: collectCaptains,
    nextIn: nextIn,
    paybackSeconds: paybackSeconds,
    paybackLine: paybackLine,
    paybackLabel: paybackLabel,
    rateWords: rateWords,
    shedNote: shedNote,
    marginalRate: marginalRate,
    officeRate: officeRate,
    routeIncome: routeIncome,
    ROUTES: ROUTES,
    LIGHTS: LIGHTS,
    routesUnlocked: routesUnlocked,
    routesSailing: routesSailing,
    lightsLit: lightsLit,
    allLightsLit: allLightsLit,
    routeOffers: routeOffers,
    signRoute: signRoute,
    lightOffers: lightOffers,
    buildLight: buildLight,
    finaleOffer: finaleOffer,
    launchFinale: launchFinale,
    quayOffer: quayOffer,
    chooseQuay: chooseQuay,
    deskChoice: deskChoice,
    chooseDesk: chooseDesk,
    settledForks: settledForks,
    wrenKeep: wrenKeep,
    brambleHaste: brambleHaste,
    wrenPerkLine: wrenPerkLine,
    bramblePerkLine: bramblePerkLine,
    newHarbour: newHarbour,
    statsOf: statsOf,
    chartCount: chartCount,
    lookLine: lookLine,
    awayRule: awayRule,
    awayCopy: awayCopy,
    captainBooks: captainBooks,
    captainHauls: captainHauls,
    captainAwayLines: captainAwayLines,
    noteFleet: noteFleet,
    setBulk: setBulk,
    valid: valid,
    serialize: serialize,
    restore: restore,
    openSave: openSave,
    createIdle: createIdle,
    lookIndex: lookIndex
  };
})();
