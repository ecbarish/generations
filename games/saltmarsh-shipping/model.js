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
      next: 'Ten rowboats, and Capt. Wren will take the pier.'
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
      next: 'Ten schooners mark the trade routes. The routes themselves stay furled.'
    },
    {
      id: 'bark', name: 'Bark',
      base: 28000, growth: 1.12, rate: 420,
      looks: ['One bark on the deep mooring', 'House flags', 'A stone quay', 'A crane tall enough for the barks'],
      next: 'The deep-water boats carry the long cargoes.'
    }
  ];

  var CAPTAINS = [
    {
      id: 'wren', name: 'Capt. Wren', tier: 0, every: 20, pay: 6,
      habit: 'Wren counts every crate aloud, and always finds one short.',
      line: function (n) { return 'Capt. Wren is back with ' + n + (n === 1 ? ' crate' : ' crates') + '. A gull stole one.'; }
    },
    {
      id: 'bramble', name: 'Capt. Bramble', tier: 1, every: 24, pay: 36,
      habit: 'Bramble will not cast off until the kettle has boiled.',
      line: function (n) { return 'Capt. Bramble is back with ' + n + (n === 1 ? ' crate' : ' crates') + '. The tea was finished before the pier.'; }
    },
    {
      id: 'hollis', name: 'Capt. Hollis', tier: 2, every: 30, pay: 180,
      habit: 'Hollis draws the headland on the back of every manifest.',
      line: function (n) { return 'Capt. Hollis is back with ' + n + (n === 1 ? ' crate' : ' crates') + ' and a new line on the chart.'; }
    },
    {
      id: 'pell', name: 'Capt. Pell', tier: 3, every: 36, pay: 700,
      habit: 'Pell names every boat, and will not say which is the favourite.',
      line: function (n) { return 'Capt. Pell is back from deep water with ' + n + (n === 1 ? ' crate' : ' crates') + '.'; }
    }
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
      captains: CAPTAINS.map(function () { return { hired: false }; }),
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

  function production(state, i) {
    var boat = state.boats[i];
    if (!boat || !(boat.owned > 0) || !spec(i)) return 0;
    return spec(i).rate * boat.owned * Idle.milestoneMult(boat.owned);
  }

  function income(state) {
    var n = 0;
    for (var i = 0; i < BOATS.length; i++) n += production(state, i);
    return n;
  }

  function addCash(state, amount) {
    if (!(amount > 0) || !isFinite(amount)) return 0;
    state.cash += amount;
    state.lifetime += amount;
    return amount;
  }

  function handSell(state, i) {
    if (i === undefined || i === null) i = 0;
    if (i !== 0) return { ok: false, reason: 'closed' };
    state.trips += 1;
    addCash(state, HAND_PAY);
    return { ok: true, ready: state.trips >= HAND_TRIPS };
  }

  function canHire(state, i) {
    var cap = captainSpec(i);
    if (!cap || !state.captains[i] || state.captains[i].hired) return false;
    if (!(state.trips >= HAND_TRIPS)) return false;
    return state.boats[cap.tier].owned >= UNLOCK_AT;
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
    pushLog(state, captainSpec(i).name + ' takes the pier. ' + captainSpec(i).habit, when);
    return { ok: true, id: captainSpec(i).id };
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
    state.boats[i].owned += q.count;
    return { ok: true, count: q.count, cost: q.cost };
  }

  function offlineCap(state) {
    var n = state && state.warehouses > 0 ? Math.floor(state.warehouses) : 1;
    if (n < 1) n = 1;
    if (n > MAX_WAREHOUSES) n = MAX_WAREHOUSES;
    return n * WAREHOUSE_HOURS * 3600;
  }

  function warehousePrice(state) {
    var n = state.warehouses || 1;
    if (n >= MAX_WAREHOUSES) return null;
    return WAREHOUSE_COST[n];
  }

  function buyWarehouse(state) {
    var price = warehousePrice(state);
    if (price == null) return { ok: false, reason: 'full' };
    if (!(state.cash >= price)) return { ok: false, reason: 'cost', cost: price };
    state.cash -= price;
    if (state.cash < 1e-6) state.cash = 0;
    state.warehouses += 1;
    return { ok: true, warehouses: state.warehouses, cost: price };
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
            for (var i = 0; i < CAPTAINS.length; i++) if (CAPTAINS[i].id === who) cap = CAPTAINS[i];
            if (!cap || !(units > 0)) return;
            var rate = state._awayRate > 0 ? state._awayRate : 1;
            addCash(state, cap.pay * units * rate);
            pushLog(state, cap.line(units), state._logNow);
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

  function lookLine(state, i) {
    var owned = state.boats[i].owned;
    var boat = spec(i);
    if (!(owned > 0)) return boat.name + 's wait on the price list.';
    var look = boat.looks[lookIndex(owned)];
    if (Idle.milestoneMult(owned) <= 1) return look + '.';
    return look + '. Each one earns ' + timesWord(owned) + '.';
  }

  function awayRule(state) {
    var hours = offlineCap(state) / 3600;
    var sheds = (state && state.warehouses) || 1;
    return 'While away: earns ' + Math.round(OFFLINE_RATE * 100) + '%, up to ' + hours + 'h (' + sheds + (sheds === 1 ? ' shed' : ' sheds') + ')';
  }

  function awayCopy(state, summary) {
    var sheds = state.warehouses || 1;
    var hours = offlineCap(state) / 3600;
    var hold = sheds === 1 ? 'The shed holds ' + hours + ' hours' : 'The sheds hold ' + hours + ' hours';
    var lead = 'You were gone ' + Arcade.fmtTime(summary.away) + '.';
    if (summary.capped) lead += ' ' + hold + ', so ' + Arcade.fmtTime(summary.credited) + ' counted.';
    else lead += ' The office kept ' + Arcade.fmtTime(summary.credited) + ' of it.';
    lead += ' While away, the boats earn ' + Math.round(OFFLINE_RATE * 100) + '%.';
    var box = summary.gained > 0
      ? Arcade.fmt(summary.gained) + ' coins are in the shed.'
      : 'The shed is empty. Nothing was earning while you were gone.';
    return { title: 'While you were away', lead: lead, box: box };
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
    }
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
      captains: state.captains.map(function (c) { return { hired: !!c.hired }; }),
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
    o.captains.forEach(function (c, i) { state.captains[i].hired = c.hired; });
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
    OFFLINE_RATE: OFFLINE_RATE,
    WAREHOUSE_HOURS: WAREHOUSE_HOURS,
    MAX_WAREHOUSES: MAX_WAREHOUSES,
    fresh: fresh,
    unlocked: unlocked,
    income: income,
    production: production,
    addCash: addCash,
    handSell: handSell,
    canHire: canHire,
    hire: hire,
    quote: quote,
    buy: buy,
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
    setBulk: setBulk,
    valid: valid,
    serialize: serialize,
    restore: restore,
    openSave: openSave,
    createIdle: createIdle,
    lookIndex: lookIndex
  };
})();
