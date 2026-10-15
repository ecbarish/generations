// NM-G6 claimed by dot for Adam, 2026-10-15: validate and pace the third district.
/* NM-G2: data-only measurements, never a runtime loader or save migration.
 * Spec-owner ruling: https://github.com/ecbarish/generations/pull/483#issuecomment-6183588332
 * Chain-only includes Mei as the canonical favourite, with no permits spent.
 * Arrival cases add one existing first-district favourite, unlocked and owned=1.
 * ONLY ownership/unlocked status carries: hire must be earned again, cash=0,
 * and the old permit wallet is discarded. A new grant is computed from the
 * departure lifetime. No permits accrue during a district run; spending one
 * opens the next currently locked type in permitStalls order. Never an income boost.
 * The original active/saver profile definitions and spending policies are used.
 * Times are deterministic simulated time, not observed human playtime.
 */
(function (root) {
  'use strict';
  var own = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  function need(ok, message) { if (!ok) throw Error(message); }
  function record(o, keys, label) {
    need(o !== null && typeof o === 'object' && !Array.isArray(o), label + ': object required');
    var proto = Object.getPrototypeOf(o);
    need(proto === Object.prototype || proto === null, label + ': plain data required');
    var actual = Reflect.ownKeys(o);
    need(actual.length === keys.length && keys.every(function (k) { return own(o, k); }), label + ': unexpected or missing field');
    actual.forEach(function (k) { need(typeof k === 'string' && own(Object.getOwnPropertyDescriptor(o, k), 'value'), label + ': data fields only'); });
  }
  function array(a, length, label) {
    need(Array.isArray(a) && Object.getPrototypeOf(a) === Array.prototype && a.length === length && Reflect.ownKeys(a).length === length + 1, label + ': exact dense array required');
    for (var i = 0; i < length; i++) need(own(a, i) && own(Object.getOwnPropertyDescriptor(a, String(i)), 'value'), label + ': missing or computed element');
  }
  function text(s, label, empty) { need(typeof s === 'string' && s === s.trim() && (empty || s.length > 0) && s.length <= 200 && !/[\x00-\x1f]/.test(s), label + ': plain text required'); }
  function positive(n, label) { need(typeof n === 'number' && Number.isFinite(n) && n > 0, label + ': positive finite number required'); }
  function validate(data, firstStalls) {
    record(data, ['schemaVersion', 'districts'], 'district file');
    need(data.schemaVersion === 1, 'schemaVersion must be 1'); array(data.districts, 1, 'districts');
    need(Array.isArray(firstStalls) && firstStalls.length === 6, 'six reference stalls required');
    var fields = Object.keys(firstStalls[0]), d = data.districts[0], ids = new Set(firstStalls.map(function (s) { return s.id; }));
    record(d, ['id', 'name', 'customers', 'moveAtLifetime', 'carryOver', 'permitStalls', 'stalls'], 'district');
    text(d.id, 'district id'); need(/^[a-z]+(?:-[a-z]+)*$/.test(d.id), 'district id format'); text(d.name, 'district name'); text(d.customers, 'customers');
    need(/^[^.!?]+[.!?]$/.test(d.customers), 'customers must be one sentence');
    need(d.moveAtLifetime === 1000000, 'move threshold must stay 1000000');
    record(d.carryOver, ['favouriteStall', 'cash', 'otherOwned', 'permits'], 'carryOver');
    record(d.carryOver.favouriteStall, ['unlocked', 'owned'], 'favouriteStall');
    need(d.carryOver.favouriteStall.unlocked === true && d.carryOver.favouriteStall.owned === 1, 'favourite carries one owned and unlocked');
    ['cash', 'otherOwned', 'permits'].forEach(function (k) { need(d.carryOver[k] === 0, 'no carried ' + k); });
    array(d.stalls, 6, 'stalls'); array(d.permitStalls, 6, 'permitStalls');
    d.stalls.forEach(function (s, i) { record(s, fields, 'stall ' + i); });
    d.stalls.forEach(function (s, i) {
      need(/^[a-z]+(?:-[a-z]+)*$/.test(s.id) && !ids.has(s.id), 'stall id must be new and unique'); ids.add(s.id);
      fields.forEach(function (k) {
        if (k === 'looks') { array(s.looks, 4, 'looks'); s.looks.forEach(function (v) { text(v, 'look'); }); }
        else if (typeof firstStalls[0][k] === 'number') positive(s[k], k);
        else text(s[k], k, k === 'next' && i === 5);
      });
      need(s.growth >= 1.05 && s.growth <= 1.15, 'growth must be 1.05–1.15');
      need(Number.isSafeInteger(s.serves), 'serves must be a positive whole number');
      need(s.habit.includes(s.vendor) && s.gossip.includes(s.vendor) && s.hire.includes(s.vendor), 'vendor must match their writing');
      need(d.permitStalls[i] === s.id, 'permitStalls must list every type once in chain order');
      need(i === 5 ? s.next === '' : s.next.includes(d.stalls[i + 1].vendor) && s.next.includes(d.stalls[i + 1].name), 'next must name the next vendor and stall');
    });
    return true;
  }
  function permitsFor(lifetime) {
    need(typeof lifetime === 'number' && Number.isFinite(lifetime) && lifetime >= 0, 'lifetime must be finite and nonnegative');
    var n = Math.floor(Math.sqrt(lifetime / 1000000));
    need(Number.isSafeInteger(n), 'permit count exceeds safe integer range');
    // Square thresholds are whole coin amounts. BigInt avoids sqrt rounding
    // a next-representable value just below 25M up to five permits.
    var earned = BigInt(Math.floor(lifetime)), unit = 1000000n;
    while (BigInt(n) * BigInt(n) * unit > earned) n--;
    while (BigInt(n + 1) * BigInt(n + 1) * unit <= earned) n++;
    return n;
  }
  function createModel(d, Idle, firstStalls, options) {
    validate({ schemaVersion: 1, districts: [d] }, firstStalls);
    options = options || {};
    record(options, Object.keys(options), 'simulation options');
    need(Object.keys(options).every(function (k) { return ['favouriteId', 'departureLifetime'].includes(k); }), 'unknown simulation option');
    var favourite = null;
    if (own(options, 'favouriteId')) {
      favourite = firstStalls.find(function (s) { return s.id === options.favouriteId; });
      need(!!favourite, 'unknown favourite stall');
    }
    var grant = own(options, 'departureLifetime') ? permitsFor(options.departureLifetime) : 0;
    if (own(options, 'departureLifetime')) need(options.departureLifetime >= d.moveAtLifetime, 'departure is below the move threshold');
    // A carried first-district type remains distinct; never rename it into a new vendor.
    // Keep the first NEW type at index 0: the unchanged saver's teaFirst policy
    // buys 25 of that first type, never an expensive carried late-game favourite.
    var favouriteIndex = favourite ? 1 : -1;
    var slots = d.stalls.map(function (_, i) { return favourite && i > 0 ? i + 1 : i; });
    var stalls = favourite ? [d.stalls[0], favourite].concat(d.stalls.slice(1)) : d.stalls.slice();
    var now = 0, trace;
    var M = { STALLS: stalls };
    M.setTime = function (ms) { now = ms / 1000; };
    M.fresh = function () {
      now = 0; trace = { unlockAt: d.stalls.map(function (_, i) { return i === 0 ? 0 : null; }), firstBuyAt: null, firstDistrictHireAt: null, firstHireAt: null, permitSpends: [] };
      return { cash: 0, lifetime: 0, permits: grant, open: stalls.map(function (_, i) { return i === 0 || i === favouriteIndex; }), stalls: stalls.map(function (_, i) { return { owned: i === favouriteIndex ? 1 : 0, serves: 0, hired: false }; }) };
    };
    M.unlocked = function (s, i) {
      if (!Number.isInteger(i) || i < 0 || i >= stalls.length) return false;
      var districtIndex = slots.indexOf(i);
      return s.open[i] || (districtIndex > 0 && s.stalls[slots[districtIndex - 1]].owned >= 10);
    };
    function observe(s) { for (var i = 0; i < d.stalls.length; i++) if (M.unlocked(s, slots[i]) && trace.unlockAt[i] === null) trace.unlockAt[i] = now; }
    M.spendPermit = function (s) {
      if (s.permits <= 0) return { ok: false, reason: 'no permits' };
      for (var i = 0; i < d.permitStalls.length; i++) {
        var at = slots[i];
        if (!M.unlocked(s, at)) { s.open[at] = true; s.permits--; observe(s); trace.permitSpends.push({ at: now, stall: d.permitStalls[i] }); return { ok: true, stall: d.permitStalls[i] }; }
      }
      return { ok: false, reason: 'all open' };
    };
    M.production = function (s, i) { var a = s.stalls[i]; return a && a.hired && a.owned > 0 ? stalls[i].rate * a.owned * Idle.milestoneMult(a.owned) : 0; };
    M.income = function (s) { return stalls.reduce(function (sum, _, i) { return sum + M.production(s, i); }, 0); };
    M.addCash = function (s, n) { if (n > 0 && Number.isFinite(n)) { s.cash += n; s.lifetime += n; } };
    M.handSell = function (s, i) { if (!M.unlocked(s, i)) return { ok: false }; s.stalls[i].serves++; M.addCash(s, stalls[i].hand); return { ok: true }; };
    M.canHire = function (s, i) { return M.unlocked(s, i) && !s.stalls[i].hired && s.stalls[i].serves >= stalls[i].serves; };
    M.hire = function (s, i) { if (!M.canHire(s, i)) return { ok: false }; s.stalls[i].hired = true; if (trace.firstHireAt === null) trace.firstHireAt = now; if (i !== favouriteIndex && trace.firstDistrictHireAt === null) trace.firstDistrictHireAt = now; return { ok: true }; };
    M.quote = function (s, i, mode) {
      if (!M.unlocked(s, i) || !s.stalls[i].hired) return { count: 0, cost: 0 };
      var stall = stalls[i], owned = s.stalls[i].owned, count = mode === 'max' ? Idle.maxAffordable(stall.base, stall.growth, owned, s.cash) : 1;
      var cost = Idle.bulkCost(stall.base, stall.growth, owned, count);
      return { count: cost <= s.cash ? count : 0, cost: cost };
    };
    M.buy = function (s, i, mode) { var q = M.quote(s, i, mode); if (!q.count) return { ok: false }; s.cash -= q.cost; if (s.cash < 1e-6) s.cash = 0; s.stalls[i].owned += q.count; if (i === 0 && trace.firstBuyAt === null) trace.firstBuyAt = now; observe(s); return { ok: true, count: q.count }; };
    M.trace = function () { return trace; };
    return M;
  }
  // Same active/saver decisions as night-market-pacing.cjs, with an explicit clock
  // for availability events. A differential test below guards policy drift.
  function simulate(M, profile, durationSec, spendAtArrival) {
    need(profile && ['active', 'saver'].includes(profile.id) && profile.handMs === 1000 && profile.tickMs === 1000 && profile.buyMs === 1000, 'expected the existing one-second active/saver profile');
    need(profile.policy === (profile.id === 'active' ? 'frontier' : 'save-payback') && !!profile.teaFirst === (profile.id === 'saver'), 'profile purchasing policy changed');
    need(Number.isSafeInteger(durationSec) && durationSec > 0 && durationSec <= 86400, 'simulation duration must be 1–86400 whole seconds');
    var s = M.fresh(), million = null;
    if (spendAtArrival) while (M.spendPermit(s).ok) { /* Each token opens only one type. */ }
    for (var second = 1; second <= durationSec; second++) {
      M.setTime(second * 1000);
      for (var i = 0; i < M.STALLS.length; i++) {
        if (!M.unlocked(s, i)) break;
        if (s.stalls[i].hired) continue;
        M.handSell(s, i); if (M.canHire(s, i)) M.hire(s, i); break;
      }
      M.addCash(s, M.income(s));
      if (profile.teaFirst && s.stalls[0].owned < 25) M.buy(s, 0, 1);
      else if (profile.policy === 'frontier') {
        for (var j = M.STALLS.length - 1; j >= 0; j--) if (M.quote(s, j, 'max').count > 0) { M.buy(s, j, 'max'); break; }
      } else {
        for (var count = 0; count < 1000; count++) {
          var best = -1, payback = Infinity, cost = 0;
          for (var k = 0; k < M.STALLS.length; k++) {
            if (!M.unlocked(s, k) || !s.stalls[k].hired) continue;
            var st = M.STALLS[k], owned = s.stalls[k].owned;
            var price = st.base * Math.pow(st.growth, owned) * (Math.pow(st.growth, 1) - 1) / (st.growth - 1);
            var before = M.production(s, k); s.stalls[k].owned++;
            var added = M.production(s, k) - before; s.stalls[k].owned--;
            if (price / added < payback) { best = k; payback = price / added; cost = price; }
          }
          if (best < 0 || cost > s.cash || !M.buy(s, best, 1).ok) break;
        }
        need(count < 1000, 'unbounded purchasing loop');
      }
      need(Number.isFinite(s.cash) && s.cash >= 0 && Number.isFinite(s.lifetime), 'invalid simulated money');
      if (million === null && s.lifetime >= 1000000) million = second;
    }
    return { profile: profile.id, unlockAt: M.trace().unlockAt.slice(), firstBuyAt: M.trace().firstBuyAt, firstHireAt: M.trace().firstHireAt, firstDistrictHireAt: M.trace().firstDistrictHireAt, million: million, state: s };
  }
  function runChecks(data, firstStalls, Idle, P) {
    var checks = 0, rejected = 0;
    function check(ok, message) { need(ok, message); checks++; }
    function equal(a, b, message) { check(JSON.stringify(a) === JSON.stringify(b), message); }
    function clone(o) { return JSON.parse(JSON.stringify(o)); }
    function rejects(fn, message) { var threw = false; try { fn(); } catch (_) { threw = true; } check(threw, message); rejected++; }
    function broken(edit, message) { var copy = clone(data); edit(copy); rejects(function () { validate(copy, firstStalls); }, message); }
    validate(data, firstStalls); checks++;
    var pristine = JSON.stringify(data), d = data.districts[0];
    Object.keys(data).forEach(function (key) { broken(function (c) { delete c[key]; }, 'missing root ' + key); });
    Object.keys(d).forEach(function (key) { broken(function (c) { delete c.districts[0][key]; }, 'missing district ' + key); });
    Object.keys(d.stalls[0]).forEach(function (key) { broken(function (c) { delete c.districts[0].stalls[0][key]; }, 'missing STALLS field ' + key); });
    [null, [], 1, 'district', true].forEach(function (bad) { rejects(function () { validate(bad, firstStalls); }, 'invalid file shape'); });
    broken(function (c) { c.schemaVersion = 2; }, 'unsupported version');
    broken(function (c) { c.unexpected = true; }, 'unknown root field');
    broken(function (c) { c.districts.push(clone(c.districts[0])); }, 'only one district');
    broken(function (c) { delete c.districts[0]; }, 'sparse districts');
    broken(function (c) { c.districts[0].id = 'Upper Case'; }, 'district identifier');
    broken(function (c) { c.districts[0].customers = 'First sentence. Second sentence.'; }, 'customers sentence count');
    broken(function (c) { c.districts[0].moveAtLifetime = 999999; }, 'fixed move threshold');
    ['cash', 'otherOwned', 'permits'].forEach(function (key) { broken(function (c) { c.districts[0].carryOver[key] = 1; }, 'no carried ' + key); });
    broken(function (c) { c.districts[0].carryOver.favouriteStall.owned = 2; }, 'exactly one favourite owned');
    broken(function (c) { c.districts[0].carryOver.favouriteStall.unlocked = false; }, 'favourite unlocked');
    broken(function (c) { c.districts[0].carryOver.favouriteStall.hired = true; }, 'no carried hiring flag');
    broken(function (c) { c.districts[0].stalls.pop(); }, 'six stalls');
    broken(function (c) { delete c.districts[0].stalls[2]; }, 'dense stalls');
    broken(function (c) {
      var fake = [null, null, null, null, null, null], proto = Object.create(Array.prototype);
      proto.forEach = function () {}; Object.setPrototypeOf(fake, proto); c.districts[0].stalls = fake;
    }, 'custom array prototype cannot bypass validation');
    broken(function (c) { c.districts[0].stalls[0].id = firstStalls[0].id; }, 'no original stall id');
    broken(function (c) { c.districts[0].stalls[1].id = c.districts[0].stalls[0].id; }, 'no duplicate stall id');
    broken(function (c) { c.districts[0].stalls[0].incomeMultiplier = 2; }, 'no extra stall fields');
    broken(function (c) { c.districts[0].stalls[0].looks.pop(); }, 'four looks');
    broken(function (c) { c.districts[0].stalls[0].looks[0] = ''; }, 'nonempty look');
    broken(function (c) { c.districts[0].stalls[0].name = '  Padded name'; }, 'trimmed writing');
    broken(function (c) { c.districts[0].stalls[0].habit = 'Wrong vendor.'; }, 'vendor identity');
    broken(function (c) { c.districts[0].stalls[0].next = 'An invented next stall.'; }, 'next chain text');
    broken(function (c) { c.districts[0].stalls[5].next = 'Another district.'; }, 'final next empty');
    broken(function (c) { c.districts[0].permitStalls.reverse(); }, 'permit order');
    broken(function (c) { c.districts[0].permitStalls[1] = c.districts[0].permitStalls[0]; }, 'unique permit mapping');
    ['base', 'growth', 'rate', 'serves', 'hand'].forEach(function (key) {
      [0, -1, null, '1', NaN, Infinity].forEach(function (bad) { broken(function (c) { c.districts[0].stalls[0][key] = bad; }, 'invalid numeric ' + key); });
    });
    broken(function (c) { c.districts[0].stalls[0].growth = 1.16; }, 'growth upper range');
    broken(function (c) { c.districts[0].stalls[0].growth = 1.04; }, 'growth lower range');
    broken(function (c) { c.districts[0].stalls[0].serves = 1.5; }, 'whole serves');
    broken(function (c) { Object.setPrototypeOf(c.districts[0].stalls[0], { injected: 1 }); }, 'inherited object fields');
    broken(function (c) { c.districts[0].stalls[0][Symbol('extra')] = 1; }, 'symbol object fields');
    broken(function (c) { c.districts[0].stalls[Symbol('extra')] = 1; }, 'symbol array fields');
    var hookCalls = 0, hooked = clone(data);
    Object.defineProperty(hooked.districts[0].stalls[0], 'base', { enumerable: true, get: function () { hookCalls++; return 15; } });
    rejects(function () { validate(hooked, firstStalls); }, 'getter input rejected'); check(hookCalls === 0, 'validator does not invoke data getter');
    var nextHook = clone(data);
    Object.defineProperty(nextHook.districts[0].stalls[1], 'vendor', { enumerable: true, get: function () { hookCalls++; return 'Suri'; } });
    rejects(function () { validate(nextHook, firstStalls); }, 'cross-stall getter input rejected'); check(hookCalls === 0, 'cross-stall validation does not invoke getter');
    [[0, 0], [999999, 0], [1000000, 1], [3999999, 1], [4000000, 2], [9000000, 3], [16000000, 4], [36000000, 6]].forEach(function (pair) { check(permitsFor(pair[0]) === pair[1], 'permit square-root boundary'); });
    [[24999999.999999996, 4], [80999999.99999999, 8], [99999999.99999999, 9]].forEach(function (pair) { check(permitsFor(pair[0]) === pair[1], 'next-representable amount below square threshold'); });
    [-1, NaN, Infinity, '1000000', null].forEach(function (bad) { rejects(function () { permitsFor(bad); }, 'invalid permit lifetime'); });
    rejects(function () { createModel(d, Idle, firstStalls, { favouriteId: 'missing' }); }, 'unknown favourite');
    rejects(function () { createModel(d, Idle, firstStalls, { departureLifetime: 999999 }); }, 'move cannot be offered early');
    rejects(function () { createModel(d, Idle, firstStalls, { oldCash: 1000 }); }, 'old cash cannot carry');
    var M = createModel(d, Idle, firstStalls), s = M.fresh();
    check(M.unlocked(s, 0) && !M.unlocked(s, 1) && !M.unlocked(s, -1) && !M.unlocked(s, 6), 'only first district type starts open');
    check(!M.buy(s, 0, 1).ok && !M.hire(s, 0).ok && !M.handSell(s, 1).ok, 'closed/unearned actions reject');
    s.stalls[0].owned = 9; check(!M.unlocked(s, 1), 'nine does not open next type');
    s.stalls[0].owned = 10; check(M.unlocked(s, 1), 'ten opens next type without permits');
    s = M.fresh();
    for (var n = 0; n < d.stalls[0].serves - 1; n++) M.handSell(s, 0);
    check(!M.canHire(s, 0), 'must complete every hand serve'); M.handSell(s, 0);
    check(M.canHire(s, 0) && M.hire(s, 0).ok && !M.hire(s, 0).ok, 'hire exactly once');
    s.cash = d.stalls[0].base; check(M.buy(s, 0, 1).ok && s.stalls[0].owned === 1, 'purchase deducts quoted cost after hiring');
    [24, 25, 49, 50, 99, 100].forEach(function (owned) { s.stalls[0].owned = owned; var factor = owned >= 100 ? 8 : owned >= 50 ? 4 : owned >= 25 ? 2 : 1; check(M.production(s, 0) === d.stalls[0].rate * owned * factor, 'existing production milestone'); });
    for (var f = 0; f < firstStalls.length; f++) {
      var carry = createModel(d, Idle, firstStalls, { favouriteId: firstStalls[f].id, departureLifetime: 1000000 }), state = carry.fresh();
      check(carry.STALLS[1].id === firstStalls[f].id && state.stalls[1].owned === 1 && !state.stalls[1].hired, 'favourite identity and ownership only');
      check(state.cash === 0 && state.lifetime === 0 && state.stalls.every(function (st, i) { return st.owned === (i === 1 ? 1 : 0); }), 'no old cash/earnings/other owned');
      check(state.open.filter(Boolean).length === 2 && state.permits === 1, 'two types arrive open and one new permit is awarded');
      var income = carry.income(state); check(carry.spendPermit(state).stall === d.stalls[1].id && state.permits === 0, 'one permit opens the next locked type');
      check(!carry.spendPermit(state).ok && carry.income(state) === income, 'no negative permit balance or income boost');
    }
    var many = createModel(d, Idle, firstStalls, { departureLifetime: 36000000 }), manyState = many.fresh();
    for (var spent = 0; many.spendPermit(manyState).ok; spent++) { need(spent < 6, 'permit loop guard'); }
    check(spent === 5 && manyState.permits === 1 && manyState.open.every(Boolean), 'five locked types consume exactly five tokens');
    check(!many.spendPermit(manyState).ok && manyState.permits === 1, 'all-open permit spending is a no-op');
    var profiles = ['active', 'saver'].map(function (id) { return P.PROFILES.find(function (p) { return p.id === id; }); });
    profiles.forEach(function (profile) {
      [undefined, { favouriteId: 'tea', departureLifetime: 1000000 }].forEach(function (options) {
        var a = simulate(createModel(d, Idle, firstStalls, options), profile, 7200, false);
        var b = P.simulate(createModel(d, Idle, firstStalls, options), profile, 7200);
        equal(a.state, b.state, profile.id + ': unchanged runner produces identical final state');
        equal(a.million, b.million, profile.id + ': unchanged runner million event matches');
      });
    });
    check(pristine === JSON.stringify(data), 'data remains unchanged');
    return { checks: checks, rejected: rejected };
  }
  var api = { validate: validate, permitsFor: permitsFor, createModel: createModel, simulate: simulate, runChecks: runChecks };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NightMarketDistrictSim = api;
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && require.main === module) {
  const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
  const base = path.resolve(__dirname, '..'), api = module.exports, P = require('./night-market-pacing.cjs');
  const context = { console: console, Arcade: {} }; context.window = context; vm.createContext(context);
  for (const file of ['shared/idle-core.js', 'games/night-market/model.js']) vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), context, { filename: file });
  const firstStalls = JSON.parse(JSON.stringify(context.NightMarket.STALLS)), Idle = context.Idle;
  const input = process.argv[2] ? path.resolve(process.argv[2]) : path.join(base, 'games/night-market/districts.json');
  assert(process.argv.length <= 3, 'Usage: node tools/night-market-district-sim.cjs [districts.json]');
  const data = JSON.parse(fs.readFileSync(input, 'utf8')); api.validate(data, firstStalls);
  const d = data.districts[0], profiles = ['active', 'saver'].map(id => P.PROFILES.find(p => p.id === id));
  const checks = api.runChecks(data, firstStalls, Idle, P);
  const duration = 14400;
  const arrivalOptions = { favouriteId: 'tea', departureLifetime: 1000000 };
  const reports = profiles.map(p => api.simulate(api.createModel(d, Idle, firstStalls, arrivalOptions), p, duration, false));
  for (const r of reports) {
    assert(r.unlockAt.every(t => t !== null), r.profile + ': all six types must become available');
    assert(r.unlockAt[5] >= 48 * 60 && r.unlockAt[5] <= 66 * 60, r.profile + ': chain completion must take 48–66 minutes');
    if (r.profile === 'active') for (let i = 1; i < 6; i++) assert(r.unlockAt[i] - r.unlockAt[i - 1] >= 180 && r.unlockAt[i] - r.unlockAt[i - 1] <= 900, 'active: consecutive unlock gap must be 3–15 minutes');
  }
  const favouriteArrivals = firstStalls.flatMap(f => profiles.map(p => ({ favourite: f.id, result: api.simulate(api.createModel(d, Idle, firstStalls, { favouriteId: f.id, departureLifetime: 1000000 }), p, duration, true) })));
  for (const item of favouriteArrivals) assert(item.result.firstBuyAt !== null && item.result.firstBuyAt <= 120, item.favourite + '/' + item.result.profile + ': first new stall within two minutes with one permit');
  const arrivals = profiles.map(p => api.simulate(api.createModel(d, Idle, firstStalls, { favouriteId: 'tea', departureLifetime: 1000000 }), p, duration, true));
  for (const r of arrivals) assert(r.firstBuyAt !== null && r.firstBuyAt <= 120, r.profile + ': first new stall with Mei and one new permit must be bought within two minutes');
  function time(n) { return n === null ? 'not reached' : (n / 60).toFixed(2); }
  console.log('NM-G2: Willow Quay. Deterministic simulated minutes; no runtime/save integration.');
  console.log('Chain-only: Mei carries one Tea Stall; no permits spent. Gate: all six new types available in 48–66 minutes.');
  console.log('profile | ' + d.stalls.map(s => s.id).join(' | ') + ' | first new hire | first new buy | own 1M (report only)');
  for (const r of reports) console.log(r.profile + ' | ' + r.unlockAt.map(time).join(' | ') + ' | ' + time(r.firstDistrictHireAt) + ' | ' + time(r.firstBuyAt) + ' | ' + time(r.million));
  console.log('Calibration fixture: Mei; other favourites can change later timing. Every favourite/profile buys the first new stall within two minutes with one permit.');
  console.log('Arrival example: Mei/Tea Stall carries one owned and unlocked, hiring is re-earned; old cash/permit balance are zero.');
  console.log('Times are measured for up to four simulated hours; a missing own-million event is reported, never a pacing failure.');
  console.log('One freshly awarded permit (departure lifetime 1M) is spent at arrival; times below are separate from the no-shortcut gate.');
  for (const r of arrivals) console.log(r.profile + ' + Mei + 1 permit | ' + r.unlockAt.map(time).join(' | ') + ' | first new hire ' + time(r.firstDistrictHireAt) + ' | first new buy ' + time(r.firstBuyAt) + ' | own 1M ' + time(r.million));
  const fixture = JSON.parse(fs.readFileSync(path.join(base, 'docs/playtests/nm-retune/legacy-v1.json'), 'utf8'));
  const original = context.NightMarket;
  assert(original.valid(fixture), 'existing literal v1 save remains valid');
  assert.equal(JSON.stringify(original.serialize(original.restore(fixture), fixture.seen)), JSON.stringify(fixture), 'existing literal v1 save round trip');
  for (let i = 0; i < profiles.length; i++) assert.deepEqual(reports[i], api.simulate(api.createModel(d, Idle, firstStalls, arrivalOptions), profiles[i], duration, false), 'deterministic replay');
  console.log(checks.checks + ' self-checks passed, including ' + checks.rejected + ' rejected malformed inputs; timing gates, exact replay and unchanged legacy-v1 save round trip passed.');
}
