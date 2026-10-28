/* Saltmarsh Shipping Office (IDLE-SS1). Rules only: no page, no storage.
   Load shared/engine.js, shared/idle-core.js and shared/roster.js first.
   Boat income is the boats you have bought. A captain is a person on a timed
   haul, paid from the job clock, never a multiplier on the boats.
   The phase layer lives in phase.js. This file does not open trade routes. */
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
      base: 28000, growth: 1.12, rate: 420,
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
        function (coins) { return 'A fresh mark on the chart, and ' + coins + ' coins from Capt. Hollis.'; }
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
      forks: { sloop: null, schooner: null },
      waivedSheds: 0,
      marks: 0,
      fleetSeen: false,
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
    var scaled = Math.round((income(state) + captainRate(state)) * 3);
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
      cross(BARK_LAMP, 'The bar lamp is lit. You can see it from the office window.');
    }
    cross(25, boat.name + 's reach 25. Flags go up, and each one earns twice as much.');
    cross(50, boat.name + 's reach 50. The dock grows longer, and each one earns four times as much.');
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
    state.warehouses = idx + 1;
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
            var line = cap.lines[(row.hauls - 1) % cap.lines.length];
            pushLog(state, line(coins(paid), boat, units), state._logNow);
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

  function paybackSeconds(state, i) {
    var boat = spec(i);
    var owned = state.boats[i] ? state.boats[i].owned : 0;
    if (!boat || !unlocked(state, i)) return Infinity;
    var cost = Idle.bulkCost(boat.base, boat.growth, owned, 1);
    var before = boat.rate * owned * Idle.milestoneMult(owned);
    var afterOwned = owned + 1;
    var added = boat.rate * afterOwned * Idle.milestoneMult(afterOwned) - before;
    if (!(cost > 0) || !(added > 0) || !isFinite(cost) || !isFinite(added)) return Infinity;
    return cost / added;
  }

  function paybackLabel(seconds) {
    if (!(seconds > 0) || !isFinite(seconds)) return '';
    if (seconds >= 60) return Arcade.fmtTime(Math.round(seconds));
    return Math.max(1, Math.round(seconds)) + 's';
  }

  function paybackLine(state, i) {
    var boat = spec(i);
    if (!boat) return '';
    var label = paybackLabel(paybackSeconds(state, i));
    if (!label) return '';
    return 'The next ' + boat.name.toLowerCase() + ' pays for itself in ' + label + '.';
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
        schooner: state.forks && (state.forks.schooner === 'fit' || state.forks.schooner === 'shed') ? state.forks.schooner : null
      },
      waivedSheds: state.waivedSheds || 0,
      marks: state.marks || 0,
      fleetSeen: !!state.fleetSeen,
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
    }
    state.forks = { sloop: null, schooner: null };
    if (o.forks) {
      if (o.forks.sloop === 'fit' || o.forks.sloop === 'shed') state.forks.sloop = o.forks.sloop;
      if (o.forks.schooner === 'fit' || o.forks.schooner === 'shed') state.forks.schooner = o.forks.schooner;
    }
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
      getRate: function () { return income(state); },
      apply: function (amount) { addCash(state, amount); },
      maxOfflineSec: offlineCap(state),
      offlineRate: OFFLINE_RATE,
      title: { label: 'Saltmarsh Shipping', unit: '' },
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
