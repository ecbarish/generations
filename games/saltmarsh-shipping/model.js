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
  /* Early contracts are a short step. The later ones, and lighting a lighthouse, wait until the office has been open a while. */
  var CHART_FULL = 24;
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

  var BOAT_NAMES = ['Grey Lark', 'Kettle', 'Whelk', 'Reed'];
  var CAPTAINS = [
    {
      id: 'wren', name: 'Capt. Wren', tier: 0, every: 20, pay: 180,
      habit: 'Wren counts every coin aloud, and a gull always takes one.',
      harbour: 'On the next harbour her count keeps more of Gull Rock.',
      lines: [
        function (coins) { return 'Capt. Wren is back with ' + coins + ' coins. A gull took one off the pile.'; },
        function (coins) { return 'Capt. Wren counts the coins twice and lands ' + coins + '. One is gone.'; },
        function (coins) { return 'The gull left Capt. Wren ' + coins + ' coins. She is already counting the next pile.'; }
      ]
    },
    {
      id: 'bramble', name: 'Capt. Bramble', tier: 1, every: 24, pay: 700,
      habit: 'Bramble waits for the kettle, then brings the tea money with the haul.',
      harbour: 'On the next harbour the kettle quickens the Tea Reach.',
      lines: [
        function (coins) { return 'Capt. Bramble is back with ' + coins + ' coins. The kettle money is in the pile.'; },
        function (coins) { return 'The kettle boiled, and Capt. Bramble landed ' + coins + ' coins.'; },
        function (coins) { return 'Capt. Bramble would not cast off until the tea was poured. ' + coins + ' coins came in.'; }
      ]
    },
    {
      id: 'hollis', name: 'Capt. Hollis', tier: 2, every: 30, pay: 9000,
      habit: 'Each return, Hollis adds a mark to the fleet chart.',
      harbour: 'On the next harbour his marks open the headland.',
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
      harbour: 'On the next harbour she names the boat on the deep run.',
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
    { id: 'sloop-hull', tier: 1, need: 10, bonus: 1, cost: 700, name: 'Lighter sloop hulls', line: 'Each sloop earns 1 more a second.' },
    { id: 'schooner-hold', tier: 2, need: 10, bonus: 8, cost: 6000, name: 'Deeper schooner holds', line: 'Each schooner earns 8 more a second.' }
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
      routeGear: {},
      gearQuote: null,
      played: 0,
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
      pilot: null,
      pilotQuote: null,
      provisions: 0,
      provisionQuote: null,
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
    if (typeof mode === 'number' && isFinite(mode) && mode > 0) n = Math.floor(mode);
    else n = mode === '10' ? 10 : 1;
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
    if (i >= 2) cross(5, 'Five ' + boat.name.toLowerCase() + 's. A second line is tied beside the first.');
    if (i === 3) {
      cross(BARK_QUAY, 'Twelve barks, and the quay grows longer. House flags go up.');
      cross(14, 'Fourteen barks. The tide board goes up on the quay.');
      cross(20, 'Twenty barks. A second line of bollards stands on the quay.');
      cross(BARK_LAMP, 'A house lamp shows in the office window. It is not one of the four lighthouses.');
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

  /* Wren and Bramble land often. One running line each, so a milestone is not pushed off the page. */
  function captainLog(state, cap, text, now) {
    if (!state.log) state.log = [];
    var i;
    for (i = 0; i < state.log.length; i++) {
      if (state.log[i].who === cap.id) {
        state.log[i].text = text;
        state.log[i].t = typeof now === 'number' ? now : Date.now();
        return;
      }
    }
    state.log.unshift({ t: typeof now === 'number' ? now : Date.now(), text: text, who: cap.id });
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
            if (units > 1) captainLog(state, cap, cap.name + ' is back from ' + units + ' hauls, ' + coins(paid) + ' coins in all.', state._logNow);
            else {
              var spoken = cap.lines[(row.hauls - 1) % cap.lines.length];
              captainLog(state, cap, spoken(coins(paid), boat, units), state._logNow);
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
    var times = mult >= 8 ? '×8' : mult >= 4 ? '×4' : mult >= 2 ? '×2' : '';
    var shown = added < 10 ? (Math.round(added * 10) / 10).toString() : coins(Math.round(added));
    return 'Adds ' + shown + '/s' + (times ? ' (' + times + ')' : '') + '. Pays back in ' + label + '.';
  }

  function shedPasses(state) {
    var passed = [];
    if (state && state.forks && state.forks.sloop === 'fit') passed.push({ name: 'lighter sloop hulls', price: WAREHOUSE_COST[1] });
    if (state && state.forks && state.forks.schooner === 'fit') passed.push({ name: 'deeper schooner holds', price: WAREHOUSE_COST[2] });
    return passed;
  }

  /* The price list is 480, then 8.40K, then 125K. Passing a shed for a fitting
     spends that step, so the next shed is the following price. */
  function shedNote(state) {
    if (!state) return '';
    var passed = shedPasses(state);
    var price = warehousePrice(state);
    var sheds = state.warehouses || 1;
    if (!passed.length) {
      if (price == null && sheds >= MAX_WAREHOUSES) return ' The yard is full. Four sheds are standing.';
      return '';
    }
    var bits = passed.map(function (row) {
      return 'The ' + coins(row.price) + ' coin price was passed for the ' + row.name + '.';
    });
    if (price == null) {
      return ' ' + bits.join(' ') + ' ' + sheds + (sheds === 1 ? ' shed is' : ' sheds are') + ' standing. There is no third shed: those cheaper prices were passed, and the yard stops there.';
    }
    return ' ' + bits.join(' ') + ' This shed is further down the list, at ' + coins(price) + ' coins. Each fitting took a cheaper shed\'s place, so this is the next price on the list.';
  }

  function needMore(state, cost) {
    if (!(cost > 0) || !state || state.cash >= cost) return '';
    return 'Need ' + coins(cost - state.cash);
  }

  /* The next boat count the desk is aiming at. Max on the page stops here.
     quote('max') itself stays uncapped, for a player who adds boats by the handful in the ledger. */
  function goalCap(state, i) {
    if (!state || !state.boats || !state.boats[i]) return null;
    var phase = window.SaltmarshPhase;
    if (phase && phase.boatNeed) {
      var need = phase.boatNeed(state);
      if (!need || need.tier !== i || !(state.boats[i].owned < need.at)) return null;
      return need.at;
    }
    var owned = state.boats[i].owned;
    var marks = [];
    function add(n) { if (owned < n) marks.push(n); }
    if (i === 0) { add(WREN_AT); add(SLOOP_AT); }
    add(UNLOCK_AT);
    if (i === 3) { add(BARK_QUAY); add(BARK_LAMP); }
    add(25);
    add(50);
    add(100);
    if (!marks.length) return null;
    marks.sort(function (a, b) { return a - b; });
    return marks[0];
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
    return owned + ' ' + boat.name.toLowerCase() + 's. Each earns ' + timesWord(owned) + '.';
  }

  function awayRule(state) {
    var hours = offlineCap(state) / 3600;
    var sheds = (state && state.warehouses) || 1;
    return 'Closed: ' + Math.round(OFFLINE_RATE * 100) + '% up to ' + hours + 'h (' + sheds + (sheds === 1 ? ' shed' : ' sheds') + '). Open page: full rate.';
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
    { id: 'kelp', name: 'Kelp Road', order: 1, depths: 4, risk: 0, first: 26, mid: 28, later: 32, payback: 74, time: 'a short run inside the bar', line: 'Safe and close. The pay is sure.', perk: '' },
    { id: 'gull', name: 'Gull Rock', order: 2, depths: 4, risk: 0.28, wren: true, first: 26, mid: 28, later: 32, payback: 60, time: 'a longer beat', line: 'More coin, if the gulls leave the pile alone.', perk: 'Wren\'s count keeps more of it.' },
    { id: 'tea', name: 'Tea Reach', order: 3, depths: 4, risk: 0, bramble: true, first: 28, mid: 28, later: 32, payback: 66, time: 'a kettle stop', line: 'Bramble knows this water. The run pays better once the kettle has been boiling.', perk: 'Bramble\'s kettle quickens it.' },
    { id: 'headland', name: 'Hollis Headland', order: 4, depths: 4, risk: 0, first: 28, mid: 28, later: 32, payback: 78, time: 'a long leg', line: 'The headland shows once Hollis has marked the chart, or once two other routes are sailing.', perk: 'Hollis drew this one.' },
    { id: 'reed', name: 'Reed Channel', order: 5, depths: 4, risk: 0, first: 28, mid: 28, later: 32, payback: 84, time: 'the deep water', line: 'Pell takes it slow, and it pays.', perk: 'Pell names the boat that goes.' },
    { id: 'night', name: 'Night Cut', order: 6, depths: 4, risk: 0.36, night: true, first: 26, mid: 28, later: 32, payback: 56, time: 'a fast dark run', line: 'Fast, and part of the cargo can vanish before a lighthouse is burning.', perk: 'A lighthouse on the coast keeps more of it.' }
  ];
  var LIGHTS = [
    { id: 'pier', name: 'Pier Lighthouse', wait: 26, lines: ['Still dark. Raising the Pier Lighthouse makes nights safer.', 'The Pier Lighthouse\'s tower is up. Lighting it keeps Gull Rock and the Night Cut whole.', 'The Pier Lighthouse is burning. Gull Rock and the Night Cut keep their cargo.'] },
    { id: 'headland', name: 'Headland Lighthouse', wait: 26, lines: ['Still dark. Raising the Headland Lighthouse makes the runs quicker.', 'The Headland Lighthouse\'s tower is up. Lighting it makes every route pay sooner.', 'The Headland Lighthouse is burning. Every route pays sooner.'] },
    { id: 'reed', name: 'Reed Lighthouse', wait: 26, lines: ['Still dark. Raising the Reed Lighthouse puts the far water on the chart.', 'The Reed Lighthouse\'s tower is up. Lighting it shows the road for the last voyage.', 'The Reed Lighthouse is burning. The last voyage can see its road.'] },
    { id: 'quay', name: 'Quay Lighthouse', wait: 26, lines: ['Still dark. Raising the Quay Lighthouse makes the captains\' work count for more.', 'The Quay Lighthouse\'s tower is up. Lighting it pulls harder on Wren\'s and Bramble\'s routes.', 'The Quay Lighthouse is burning. Wren and Bramble pull harder on their routes.'] }
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
  function towersUp(state) {
    var n = 0;
    if (!state || !state.lights) return false;
    LIGHT_IDS.forEach(function (id) { if (state.lights[id] >= 1) n += 1; });
    return n >= LIGHTS.length;
  }
  function wrenKeep(state) {
    var hauls = state.captains && state.captains[0] ? (state.captains[0].hauls || 0) : 0;
    var keep = Math.min(0.2, hauls * 0.01);
    if (state.pilot === 'bell') keep += 0.05;
    if (state.lights && state.lights.quay >= 2) keep = Math.min(0.4, keep * 2);
    return keep > 0.4 ? 0.4 : keep;
  }
  function brambleHaste(state) {
    var hauls = state.captains && state.captains[1] ? (state.captains[1].hauls || 0) : 0;
    var haste = Math.min(0.16, hauls * 0.008);
    if (state.pilot === 'bell') haste += 0.05;
    if (state.lights && state.lights.quay >= 2) haste = Math.min(0.32, haste * 2);
    return haste > 0.32 ? 0.32 : haste;
  }
  function nightSafety(state) {
    var safety = 0;
    if (state.pilot === 'coal') safety += 0.2;
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
      if (state.routeGear && state.routeGear[spec.id]) g *= 1.2;
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
    /* Every contract on the desk is a short step, about half a minute of the office.
       The long arc is the provisions after the lights, not a hidden wait on a later contract. */
    var stake = depth <= 0 ? spec.first : depth === 1 ? spec.mid : spec.later;
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
    var early = [];
    var late = [];
    ROUTES.forEach(function (spec) {
      var signed = (state.routes[spec.id] || 0);
      if (signed >= spec.depths) return;
      if (!routeVisible(state, spec)) return;
      if (signed >= 2) late.push(spec);
      else early.push(spec);
    });
    early.sort(function (a, b) { return a.order - b.order; });
    late.sort(function (a, b) { return a.order - b.order; });
    /* Later contracts are offered one at a time, so each one is a full step.
       While an earlier contract is still on the desk, the later ones wait for it. */
    var list = early.length ? early.slice(0, 3) : late.slice(0, 1);
    return list.map(function (spec) {
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
    var depth = state.routes[id];
    if (state.quotes) delete state.quotes[id + ':' + (depth - 1)];
    pushLog(state, spec.name + ', contract ' + depth + '. ' + spec.line, now);
    return { ok: true, id: id, depth: depth };
  }
  function routeContract(state, id) {
    var spec = routeById(id);
    var signed = (state && state.routes && state.routes[id]) || 0;
    var depths = spec ? spec.depths : 4;
    var next = signed + 1;
    if (next > depths) next = depths;
    var label = signed >= depths ? signed + ' signed' : signed + ' signed · contract ' + next + ' of ' + depths;
    return { signed: signed, next: next, depths: depths, label: label };
  }
  /* A contract that is signed but not on the desk yet. The price is a live look, not a locked quote,
     so putting it on the card does not freeze a cheap price for later. */
  function peekRoute(state, spec) {
    if (!spec || !state) return null;
    var signed = (state.routes && state.routes[spec.id]) || 0;
    if (signed <= 0 || signed >= spec.depths) return null;
    var offers = routeOffers(state, false);
    var i;
    for (i = 0; i < offers.length; i++) if (offers[i].id === spec.id) return null;
    var built = computeRoute(state, spec);
    return { id: spec.id, depth: built.depth, depths: spec.depths, cost: built.cost, name: spec.name };
  }
  function routesComplete(state) {
    var i;
    for (i = 0; i < ROUTES.length; i++) {
      if ((state.routes && state.routes[ROUTES[i].id] || 0) < ROUTES[i].depths) return false;
    }
    return true;
  }
  function routeLedger(state) {
    return ROUTES.map(function (spec) {
      return spec.name + ' ' + routeContract(state, spec.id).label;
    }).join('. ') + '.';
  }
  /* A small fitting for a route that is already sailing. One per route, priced when it first appears. */
  function gearOffer(state) {
    if (!routesUnlocked(state) || !state || state.ended) return null;
    if (!state.routeGear) state.routeGear = {};
    var quoted = state.gearQuote && routeById(state.gearQuote.id);
    if (quoted && (state.routes[quoted.id] || 0) > 0 && !state.routeGear[quoted.id]) {
      return {
        id: quoted.id,
        name: 'A spare sail for ' + quoted.name,
        cost: state.gearQuote.cost,
        line: 'This run pays a little more. The other prices on the desk stay as they are.',
        affordable: state.cash >= state.gearQuote.cost
      };
    }
    var pick = null;
    ROUTES.forEach(function (spec) {
      if (pick) return;
      if ((state.routes[spec.id] || 0) > 0 && !state.routeGear[spec.id]) pick = spec;
    });
    if (!pick) { state.gearQuote = null; return null; }
    state.gearQuote = { id: pick.id, cost: Math.round(Math.max(1, officeRate(state)) * 12) };
    return {
      id: pick.id,
      name: 'A spare sail for ' + pick.name,
      cost: state.gearQuote.cost,
      line: 'This run pays a little more. The other prices on the desk stay as they are.',
      affordable: state.cash >= state.gearQuote.cost
    };
  }
  function buyGear(state, id, now) {
    var offer = gearOffer(state);
    if (!offer || (id && offer.id !== id)) return { ok: false, reason: 'closed' };
    if (!(state.cash >= offer.cost)) return { ok: false, reason: 'cost', cost: offer.cost };
    state.cash -= offer.cost;
    if (state.cash < 1e-6) state.cash = 0;
    if (!state.routeGear) state.routeGear = {};
    state.routeGear[offer.id] = true;
    state.gearQuote = null;
    var spec = routeById(offer.id);
    pushLog(state, 'A spare sail for ' + (spec ? spec.name : 'the run') + '. That route pays a little more.', now);
    return { ok: true, id: offer.id };
  }
  function quoteLight(state, spec, lock) {
    var stage = (state.lights && state.lights[spec.id]) || 0;
    if (stage >= 2) return null;
    var key = spec.id + ':' + stage;
    if (!state.lightQuotes) state.lightQuotes = {};
    if (state.lightQuotes[key]) return state.lightQuotes[key];
    /* Raising and lighting are the same short step whenever they appear.
       There is no clock that makes a lighthouse dearer after a hidden minute. */
    var cost = Math.max(1, officeRate(state)) * spec.wait;
    /* A price already on the desk caps a new raise. Raising one lighthouse
       must not reprice the others by the income that raise just added.
       Lighting a tower is a separate watch, so it keeps its own price. */
    if (lock && stage === 0) {
      var cap = 0;
      Object.keys(state.lightQuotes).forEach(function (k) {
        var quoted = state.lightQuotes[k];
        if (quoted && quoted.cost > cap) cap = quoted.cost;
      });
      if (cap > 0 && cost > cap * 1.35) cost = Math.round(cap * 1.35);
    }
    var built = { id: spec.id, stage: stage, cost: cost, line: spec.lines[stage] };
    if (lock) state.lightQuotes[key] = built;
    return built;
  }
  function lightOffers(state, lock) {
    if (!routesUnlocked(state) || routesSailing(state) < 5) return [];
    var out = [];
    LIGHTS.forEach(function (spec) {
      var quote = quoteLight(state, spec, !!lock);
      if (!quote) return;
      var blocked = '';
      if (spec.id === 'quay' && (!state.forks || !state.forks.quay)) blocked = 'Choose the quay first.';
      out.push({
        id: spec.id, name: spec.name, stage: quote.stage, cost: quote.cost, line: quote.line,
        verb: quote.stage === 0 ? 'Raise the' : 'Light the',
        blocked: blocked,
        affordable: !blocked && state.cash >= quote.cost
      });
    });
    return out;
  }
  function buildLight(state, id, now) {
    var spec = lightById(id);
    if (!spec || routesSailing(state) < 5 || state.ended) return { ok: false, reason: 'closed' };
    if (id === 'quay' && (!state.forks || !state.forks.quay)) return { ok: false, reason: 'choice' };
    var quote = quoteLight(state, spec, true);
    if (!quote || !(state.cash >= quote.cost)) return { ok: false, reason: 'cost', cost: quote && quote.cost };
    state.cash -= quote.cost;
    if (state.cash < 1e-6) state.cash = 0;
    var prevStage = (state.lights[id] || 0);
    state.lights[id] = prevStage + 1;
    if (state.lightQuotes) delete state.lightQuotes[id + ':' + prevStage];
    pushLog(state, quote.line, now);
    if (allLightsLit(state)) pushLog(state, 'Every lighthouse on the coast is burning. Sign every route, and provision the last voyage.', now);
    return { ok: true, stage: state.lights[id] };
  }
  /* After the four lights, the hold is filled one purchase at a time.
     Lighting the coast opens this stretch. It does not send the last voyage. */
  var PROVISION_TOTAL = 210;
  var PROVISION_SPAN = 32;
  var PROVISION_NAMES = [
    'Victuals for the crew',
    'Canvas for the sails',
    'Coal for the lamps',
    'A pilot for the bar',
    'Charts for the last run'
  ];
  function provisionOffer(state, lock) {
    if (!allLightsLit(state) || !state || state.ended) return null;
    var done = state.provisions || 0;
    if (done >= PROVISION_TOTAL) return null;
    var name = PROVISION_NAMES[done % PROVISION_NAMES.length];
    var cost;
    if (state.provisionQuote && finiteNum(state.provisionQuote.cost)) {
      name = state.provisionQuote.name || name;
      cost = state.provisionQuote.cost;
    } else {
      cost = Math.max(1, officeRate(state)) * PROVISION_SPAN;
      if (lock) state.provisionQuote = { name: name, cost: cost };
    }
    return {
      index: done,
      total: PROVISION_TOTAL,
      name: name,
      cost: cost,
      affordable: state.cash >= cost,
      line: 'Provision the last voyage: ' + done + ' / ' + PROVISION_TOTAL
    };
  }
  function buyProvision(state, now) {
    var offer = provisionOffer(state, true);
    if (!offer) return { ok: false, reason: 'closed' };
    if (!(state.cash >= offer.cost)) return { ok: false, reason: 'cost', cost: offer.cost };
    state.cash -= offer.cost;
    if (state.cash < 1e-6) state.cash = 0;
    state.provisions = (state.provisions || 0) + 1;
    state.provisionQuote = null;
    var left = PROVISION_TOTAL - state.provisions;
    var sentence = offer.name + '. Provision the last voyage: ' + state.provisions + ' / ' + PROVISION_TOTAL + '.';
    if (left === 0) sentence += ' The hold is full.';
    pushLog(state, sentence, now);
    return { ok: true, provisions: state.provisions };
  }
  function finaleOffer(state, lock) {
    if (!allLightsLit(state) || !routesComplete(state) || (state.provisions || 0) < PROVISION_TOTAL || state.ended) return null;
    if (state.finaleCost == null && lock) state.finaleCost = Math.max(1, officeRate(state)) * 32;
    var cost = state.finaleCost != null ? state.finaleCost : Math.max(1, officeRate(state)) * 32;
    return { cost: cost, affordable: state.cash >= cost, line: 'Every route is signed and the hold is full. One last run, past the lights, and the office is finished.' };
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
    if (finiteNum(state.played) && state.played > 0) elapsed = state.played;
    else if (finiteNum(state.born) && finiteNum(now)) elapsed = Math.max(0, (now - state.born) / 1000);
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
      var cost = Math.round(Math.max(1, officeRate(state)) * 24);
      state.quayQuote = { lamp: cost, hold: cost };
    }
    var q = state.quayQuote;
    return {
      id: 'quay',
      goal: 'Choose a lamp on the quay, or deeper bark holds.',
      lamp: { which: 'lamp', name: 'A lamp on the quay', cost: q.lamp, line: 'Safer nights. Gull Rock and the Night Cut keep more.', affordable: state.cash >= q.lamp },
      hold: { which: 'hold', name: 'Deeper bark holds', cost: q.hold, line: 'Each bark earns 80 more a second.', affordable: state.cash >= q.hold }
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
  /* A short decision once two routes are sailing and the quay choice is settled.
     It sits in the stretch that used to be one long price. */
  function pilotOffer(state) {
    if (!state || state.ended || state.pilot) return null;
    if (!routesUnlocked(state)) return null;
    var sailing = routesSailing(state);
    if (sailing < 2 || sailing >= 5) return null;
    if (openFork(state) || quayOffer(state)) return null;
    if (!finiteNum(state.pilotQuote)) state.pilotQuote = Math.round(Math.max(1, officeRate(state)) * 18);
    var cost = state.pilotQuote;
    return {
      id: 'pilot',
      goal: 'Choose a bell for the pier, or coal for the night runs.',
      cards: [
        { which: 'bell', name: 'A bell on the pier', cost: cost, line: 'Wren and Bramble count for a little more.', affordable: state.cash >= cost },
        { which: 'coal', name: 'Coal for the night runs', cost: cost, line: 'Gull Rock and the Night Cut keep more at night.', affordable: state.cash >= cost }
      ]
    };
  }
  function choosePilot(state, which, now) {
    var offer = pilotOffer(state);
    if (!offer) return { ok: false, reason: 'closed' };
    var card = null;
    offer.cards.forEach(function (c) { if (c.which === which) card = c; });
    if (!card) return { ok: false, reason: 'closed' };
    if (!(state.cash >= card.cost)) return { ok: false, reason: 'cost', cost: card.cost };
    state.cash -= card.cost;
    if (state.cash < 1e-6) state.cash = 0;
    state.pilot = which === 'coal' ? 'coal' : 'bell';
    if (state.pilot === 'coal') pushLog(state, 'Coal for the night runs. Gull Rock and the Night Cut keep more while the coast is dark.', now);
    else pushLog(state, 'A bell on the pier. Wren and Bramble count for a little more on their routes.', now);
    return { ok: true, which: state.pilot };
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
    if (quay) return { id: 'quay', goal: quay.goal, cards: [quay.lamp, quay.hold] };
    var pilot = pilotOffer(state);
    if (!pilot) return null;
    return { id: 'pilot', goal: pilot.goal, cards: pilot.cards };
  }
  function chooseDesk(state, id, which, now) {
    if (id === 'quay') return chooseQuay(state, which, now);
    if (id === 'pilot') return choosePilot(state, which, now);
    return chooseFork(state, id, which, now);
  }
  /* The cheapest route still takes more than about a minute, and the purse cannot pay it yet. */
  function routeWait(state) {
    var offers = routeOffers(state, false);
    if (!offers.length) return false;
    var cost = offers[0].cost;
    var i;
    for (i = 1; i < offers.length; i++) if (offers[i].cost < cost) cost = offers[i].cost;
    var rate = Math.max(1, officeRate(state));
    return cost > rate * 70 && !(state.cash >= cost);
  }
  function boatStep(state) {
    var best = -1;
    var bestPay = Infinity;
    var i;
    for (i = 0; i < BOATS.length; i++) {
      if (!unlocked(state, i)) continue;
      var pay = paybackSeconds(state, i);
      if (pay < bestPay) { bestPay = pay; best = i; }
    }
    if (best < 0) return null;
    var cap = goalCap(state, best);
    var owned = state.boats[best].owned;
    var left = cap == null ? 1 : cap - owned;
    if (!(left > 0)) left = 1;
    if (left > 2) left = 2;
    return { tier: best, left: left };
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
    if (state.pilot === 'bell' || state.pilot === 'coal') {
      var bell = state.pilot === 'bell';
      out.push({
        id: 'pilot',
        takenName: bell ? 'A bell on the pier' : 'Coal for the night runs',
        lockedName: bell ? 'Coal for the night runs' : 'A bell on the pier'
      });
    }
    return out;
  }
  function wrenPerkLine(state) {
    if (!(state.captains && state.captains[0] && state.captains[0].hired)) return '';
    var pct = Math.round(wrenKeep(state) * 100);
    if (pct <= 0) return 'Gull soon';
    return 'Gull +' + pct + '%';
  }
  function bramblePerkLine(state) {
    if (!(state.captains && state.captains[1] && state.captains[1].hired)) return '';
    var pct = Math.round(brambleHaste(state) * 100);
    if (pct <= 0) return 'Tea soon';
    return 'Tea +' + pct + '%';
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
    if (o.pilot != null && o.pilot !== 'bell' && o.pilot !== 'coal') return false;
    if (o.pilotQuote != null && (!finiteNum(o.pilotQuote) || o.pilotQuote < 0)) return false;
    if (o.provisions != null && (!finiteNum(o.provisions) || o.provisions < 0)) return false;
    if (o.provisionQuote != null && (typeof o.provisionQuote !== 'object' || !finiteNum(o.provisionQuote.cost) || o.provisionQuote.cost < 0)) return false;
    if (o.played != null && (!finiteNum(o.played) || o.played < 0)) return false;
    if (o.routeGear != null && typeof o.routeGear !== 'object') return false;
    if (o.gearQuote != null && typeof o.gearQuote !== 'object') return false;
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
      routeGear: state.routeGear && typeof state.routeGear === 'object' ? state.routeGear : {},
      gearQuote: state.gearQuote && finiteNum(state.gearQuote.cost) ? { id: state.gearQuote.id, cost: state.gearQuote.cost } : null,
      played: state.played || 0,
      ended: !!state.ended,
      ending: state.ending || null,
      born: finiteNum(state.born) ? state.born : null,
      charts: state.charts || 0,
      keptCaptain: state.keptCaptain || null,
      pilot: state.pilot === 'bell' || state.pilot === 'coal' ? state.pilot : null,
      pilotQuote: finiteNum(state.pilotQuote) ? state.pilotQuote : null,
      provisions: state.provisions || 0,
      provisionQuote: state.provisionQuote && finiteNum(state.provisionQuote.cost) ? { name: state.provisionQuote.name || '', cost: state.provisionQuote.cost } : null,
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
    state.routeGear = {};
    if (o.routeGear && typeof o.routeGear === 'object') {
      ROUTE_IDS.forEach(function (id) { if (o.routeGear[id]) state.routeGear[id] = true; });
    }
    state.gearQuote = o.gearQuote && finiteNum(o.gearQuote.cost) && routeById(o.gearQuote.id) ? { id: o.gearQuote.id, cost: o.gearQuote.cost } : null;
    state.played = finiteNum(o.played) ? o.played : 0;
    state.ended = !!o.ended;
    state.ending = o.ending || null;
    state.born = finiteNum(o.born) ? o.born : null;
    state.charts = finiteNum(o.charts) ? Math.floor(o.charts) : 0;
    state.keptCaptain = typeof o.keptCaptain === 'string' ? o.keptCaptain : null;
    state.pilot = o.pilot === 'bell' || o.pilot === 'coal' ? o.pilot : null;
    state.pilotQuote = finiteNum(o.pilotQuote) ? o.pilotQuote : null;
    state.provisions = finiteNum(o.provisions) ? Math.max(0, Math.floor(o.provisions)) : 0;
    state.provisionQuote = o.provisionQuote && finiteNum(o.provisionQuote.cost) ? { name: typeof o.provisionQuote.name === 'string' ? o.provisionQuote.name : '', cost: o.provisionQuote.cost } : null;
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

  /* Dev preview for the live Pages build. These states are not written into the real save. */
  function preset(name) {
    if (name !== 'fleet' && name !== 'lamps' && name !== 'final') return null;
    var s = fresh();
    var when = Date.now();
    s.trips = HAND_TRIPS;
    s.born = when;
    s.boats[0].owned = SLOOP_AT;
    s.boats[1].owned = UNLOCK_AT;
    s.boats[2].owned = UNLOCK_AT;
    s.forks.sloop = 'fit';
    s.forks.schooner = 'fit';
    s.fittings['sloop-hull'] = true;
    s.fittings['schooner-hold'] = true;
    s.waivedSheds = 2;
    s.fleetSeen = true;
    s.captains[0].hired = true;
    s.captains[1].hired = true;
    s.captains[2].hired = true;
    s.jobs.wren = { job: 'haul', since: when };
    s.jobs.bramble = { job: 'haul', since: when };
    s.jobs.hollis = { job: 'haul', since: when };
    s.cash = 1000;
    s.lifetime = 1000;
    if (name === 'fleet') return s;
    s.boats[3].owned = BARK_LAMP;
    s.captains[3].hired = true;
    s.jobs.pell = { job: 'haul', since: when };
    s.forks.quay = 'lamp';
    s.pilot = 'bell';
    ['kelp', 'gull', 'tea', 'headland', 'reed'].forEach(function (id) {
      s.routes[id] = 1;
      s.routeGross[id] = 100;
    });
    s.voyages = 5;
    s.lights.pier = 2;
    s.lights.headland = 2;
    s.lights.reed = 2;
    if (name === 'lamps') return s;
    s.routes.kelp = 4;
    s.routes.gull = 4;
    s.routes.tea = 4;
    s.routes.headland = 4;
    s.routes.reed = 4;
    s.routes.night = 4;
    s.routeGross.night = 100;
    s.voyages = CHART_FULL;
    s.lights.quay = 2;
    s.provisions = PROVISION_TOTAL;
    s.ended = false;
    s.finaleCost = null;
    s.cash = 0;
    return s;
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
    CHART_FULL: CHART_FULL,
    PROVISION_TOTAL: PROVISION_TOTAL,
    PROVISION_SPAN: PROVISION_SPAN,
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
    needMore: needMore,
    goalCap: goalCap,
    routeWait: routeWait,
    boatStep: boatStep,
    preset: preset,
    pilotOffer: pilotOffer,
    marginalRate: marginalRate,
    officeRate: officeRate,
    routeIncome: routeIncome,
    ROUTES: ROUTES,
    LIGHTS: LIGHTS,
    routesUnlocked: routesUnlocked,
    routesSailing: routesSailing,
    lightsLit: lightsLit,
    allLightsLit: allLightsLit,
    towersUp: towersUp,
    routeOffers: routeOffers,
    signRoute: signRoute,
    routeContract: routeContract,
    peekRoute: peekRoute,
    routesComplete: routesComplete,
    routeLedger: routeLedger,
    gearOffer: gearOffer,
    buyGear: buyGear,
    lightOffers: lightOffers,
    buildLight: buildLight,
    provisionOffer: provisionOffer,
    buyProvision: buyProvision,
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
