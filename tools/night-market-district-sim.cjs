/* NM-G2 / NM-G6: data-only measurements, never a runtime loader or save migration.
 * Spec-owner ruling: https://github.com/ecbarish/generations/pull/483#issuecomment-6183588332
 * Chain-only includes Mei as the canonical favourite, with no permits spent.
 * Arrival cases add one previously encountered favourite, unlocked and owned=1.
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
    need(data.schemaVersion === 1, 'schemaVersion must be 1');
    need(Array.isArray(data.districts) && data.districts.length > 0, 'districts must be nonempty');
    array(data.districts, data.districts.length, 'districts');
    need(Array.isArray(firstStalls) && firstStalls.length === 6, 'six reference stalls required');
    var ids = new Set(firstStalls.map(function (s) { return s.id; })), districtIds = new Set();
    data.districts.forEach(function (d, i) {
      validateDistrict(d, firstStalls, ids, (i + 1) * (i + 1) * 1000000);
      need(!districtIds.has(d.id), 'district id must be unique'); districtIds.add(d.id);
    });
    return true;
  }
  // Every entry uses the same shape; its array position supplies the square threshold.
  function validateDistrict(d, firstStalls, ids, threshold) {
    need(Array.isArray(firstStalls) && firstStalls.length === 6, 'six reference stalls required');
    var fields = Object.keys(firstStalls[0]);
    record(d, ['id', 'name', 'customers', 'moveAtLifetime', 'carryOver', 'permitStalls', 'stalls'], 'district');
    text(d.id, 'district id'); need(/^[a-z]+(?:-[a-z]+)*$/.test(d.id), 'district id format'); text(d.name, 'district name'); text(d.customers, 'customers');
    need(/^[^.!?]+[.!?]$/.test(d.customers), 'customers must be one sentence');
    need(Number.isSafeInteger(d.moveAtLifetime) && d.moveAtLifetime >= 1000000 && d.moveAtLifetime === threshold && Number.isInteger(Math.sqrt(d.moveAtLifetime / 1000000)), 'move threshold must match the district square: ' + threshold);
    record(d.carryOver, ['favouriteStall', 'cash', 'otherOwned', 'permits'], 'carryOver');
    record(d.carryOver.favouriteStall, ['unlocked', 'owned'], 'favouriteStall');
    need(d.carryOver.favouriteStall.unlocked === true && d.carryOver.favouriteStall.owned === 1, 'favourite carries one owned and unlocked');
    ['cash', 'otherOwned', 'permits'].forEach(function (k) { need(d.carryOver[k] === 0, 'no carried ' + k); });
    array(d.stalls, 6, 'stalls'); array(d.permitStalls, 6, 'permitStalls');
    d.stalls.forEach(function (s, i) { record(s, fields, 'stall ' + i); });
    d.stalls.forEach(function (s, i) {
      text(s.id, 'stall id');
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
    });
    // All scalar fields are known text before a neighbouring name is inspected.
    d.stalls.forEach(function (s, i) {
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
  function createModel(d, Idle, firstStalls, options, previousDistricts) {
    previousDistricts = previousDistricts === undefined ? [] : previousDistricts;
    need(Array.isArray(previousDistricts), 'previous districts must be an array');
    array(previousDistricts, previousDistricts.length, 'previous districts');
    // Validate the complete prefix: a 4M destination cannot masquerade as entry 0.
    validate({ schemaVersion: 1, districts: previousDistricts.concat([d]) }, firstStalls);
    var favourites = firstStalls.concat.apply(firstStalls, previousDistricts.map(function (prior) { return prior.stalls; }));
    options = options || {};
    record(options, Object.keys(options), 'simulation options');
    need(Object.keys(options).every(function (k) { return ['favouriteId', 'departureLifetime'].includes(k); }), 'unknown simulation option');
    var favourite = null;
    if (own(options, 'favouriteId')) {
      favourite = favourites.find(function (s) { return s.id === options.favouriteId; });
      need(!!favourite, 'unknown favourite stall');
    }
    var grant = own(options, 'departureLifetime') ? permitsFor(options.departureLifetime) : 0;
    if (own(options, 'departureLifetime')) need(options.departureLifetime >= d.moveAtLifetime, 'departure is below the move threshold');
    // A carried previous-district type remains distinct; never rename it into a new vendor.
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
    function rejects(fn, message, pattern) { need(pattern instanceof RegExp, 'rejection must name its expected reason: ' + message); var error = null; try { fn(); } catch (e) { error = e; } check(error && pattern.test(error.message), message + (error ? ': ' + error.message : ': did not reject')); rejected++; }
    var districtIndex = 0;
    function broken(edit, message, pattern) {
      var copy = clone(data);
      edit(copy);
      rejects(function () { validate(copy, firstStalls); }, message, pattern);
    }
    validate(data, firstStalls); checks++;
    var pristine = JSON.stringify(data);
    for (districtIndex = 0; districtIndex < data.districts.length; districtIndex++) {
      var d = data.districts[districtIndex], previous = data.districts.slice(0, districtIndex);
      var favourites = firstStalls.concat.apply(firstStalls, previous.map(function (prior) { return prior.stalls; }));
      function makeModel(options) { return createModel(d, Idle, firstStalls, options, previous); }
      check(validate({ schemaVersion: 1, districts: previous.concat([d]) }, firstStalls), 'each valid prefix is accepted');
      broken(function (c) { c.districts[districtIndex] = null; }, 'null district', /district: object required/);
      broken(function (c) { c.districts[districtIndex].unexpected = true; }, 'unknown district field', /district: unexpected or missing field/);
      broken(function (c) { Object.setPrototypeOf(c.districts[districtIndex], { inherited: true }); }, 'district prototype', /district: plain data required/);
      broken(function (c) { c.districts[districtIndex].stalls[0].id = 'Upper Case'; }, 'stall identifier format', /stall id must be new and unique/);
      broken(function (c) { c.districts[districtIndex].carryOver.extra = 0; }, 'carry-over extra field', /carryOver: unexpected or missing field/);
      broken(function (c) { c.districts[districtIndex].permitStalls.pop(); }, 'short permit mapping', /permitStalls: exact dense array required/);
      broken(function (c) { delete c.districts[districtIndex].permitStalls[1]; }, 'sparse permit mapping', /permitStalls: exact dense array required/);
      [0, -1, null, '4000000', NaN, Infinity, 3999999, 4000001].forEach(function (bad) {
        broken(function (c) { c.districts[districtIndex].moveAtLifetime = bad; }, 'invalid move threshold', /move threshold/);
      });
      var coercions = 0, coercing = clone(data);
      coercing.districts[districtIndex].stalls[0].id = { toString: function () { coercions++; return 'forged'; } };
      rejects(function () { validate(coercing, firstStalls); }, 'nonstring stall id', /stall id: plain text required/);
      check(coercions === 0, 'validator never coerces a stall id');
      ['name', 'vendor'].forEach(function (key) {
        var later = clone(data);
        later.districts[districtIndex].stalls[1][key] = { toString: function () { coercions++; return d.stalls[1][key]; } };
        rejects(function () { validate(later, firstStalls); }, 'nonstring next-stall ' + key, /(?:name|vendor): plain text required/);
        check(coercions === 0, 'validator never coerces cross-stall text');
      });
      var getters = 0, districtHook = clone(data), thresholdHook = clone(data);
      Object.defineProperty(districtHook.districts, districtIndex, { enumerable: true, get: function () { getters++; return d; } });
      Object.defineProperty(thresholdHook.districts[districtIndex], 'moveAtLifetime', { enumerable: true, get: function () { getters++; return d.moveAtLifetime; } });
      rejects(function () { validate(districtHook, firstStalls); }, 'computed district entry', /districts: missing or computed element/);
      rejects(function () { validate(thresholdHook, firstStalls); }, 'computed move threshold', /district: data fields only/);
      check(getters === 0, 'validator never invokes district/threshold getters');
      rejects(function () { makeModel({ favouriteId: d.stalls[0].id }); }, 'current-district favourite cannot carry', /unknown favourite stall/);
      rejects(function () { createModel(d, Idle, firstStalls, undefined, null); }, 'invalid previous-district argument', /previous districts must be an array/);
      if (districtIndex > 0) {
        rejects(function () { createModel(d, Idle, firstStalls); }, 'later district requires its complete prefix', /move threshold/);
        broken(function (c) { c.districts[districtIndex].id = c.districts[0].id; }, 'unique district identifiers', /district id must be unique/);
        broken(function (c) { c.districts[districtIndex].stalls[0].id = c.districts[0].stalls[0].id; }, 'cross-district stall collision', /stall id must be new and unique/);
        broken(function (c) { c.districts[districtIndex].moveAtLifetime = c.districts[0].moveAtLifetime; }, 'later district cannot reuse earlier threshold', /move threshold/);
      }
      Object.keys(data).forEach(function (key) { broken(function (c) { delete c[key]; }, 'missing root ' + key, /district file: unexpected or missing field/); });
      Object.keys(d).forEach(function (key) { broken(function (c) { delete c.districts[districtIndex][key]; }, 'missing district ' + key, /district: unexpected or missing field/); });
      Object.keys(d.stalls[0]).forEach(function (key) { broken(function (c) { delete c.districts[districtIndex].stalls[0][key]; }, 'missing STALLS field ' + key, /stall 0: unexpected or missing field/); });
      [null, [], 1, 'district', true].forEach(function (bad) { rejects(function () { validate(bad, firstStalls); }, 'invalid file shape', /district file: object required/); });
      broken(function (c) { c.schemaVersion = 2; }, 'unsupported version', /schemaVersion must be 1/);
      broken(function (c) { c.unexpected = true; }, 'unknown root field', /district file: unexpected or missing field/);
      broken(function (c) { var duplicate = clone(c.districts[districtIndex]); duplicate.moveAtLifetime = Math.pow(c.districts.length + 1, 2) * 1000000; c.districts.push(duplicate); }, 'appended duplicate district is invalid', /stall id must be new and unique/);
      broken(function (c) { delete c.districts[districtIndex]; }, 'sparse districts', /districts: missing or computed element|districts: exact dense array required/);
      broken(function (c) { c.districts[districtIndex].id = 'Upper Case'; }, 'district identifier', /district id format/);
      broken(function (c) { c.districts[districtIndex].customers = 'First sentence. Second sentence.'; }, 'customers sentence count', /customers must be one sentence/);
      broken(function (c) { c.districts[districtIndex].moveAtLifetime = 999999; }, 'fixed move threshold', /move threshold/);
      ['cash', 'otherOwned', 'permits'].forEach(function (key) { broken(function (c) { c.districts[districtIndex].carryOver[key] = 1; }, 'no carried ' + key, /no carried (cash|otherOwned|permits)/); });
      broken(function (c) { c.districts[districtIndex].carryOver.favouriteStall.owned = 2; }, 'exactly one favourite owned', /favourite carries one owned and unlocked/);
      broken(function (c) { c.districts[districtIndex].carryOver.favouriteStall.unlocked = false; }, 'favourite unlocked', /favourite carries one owned and unlocked/);
      broken(function (c) { c.districts[districtIndex].carryOver.favouriteStall.hired = true; }, 'no carried hiring flag', /favouriteStall: unexpected or missing field/);
      broken(function (c) { c.districts[districtIndex].stalls.pop(); }, 'six stalls', /stalls: exact dense array required/);
      broken(function (c) { delete c.districts[districtIndex].stalls[2]; }, 'dense stalls', /stalls: exact dense array required/);
      broken(function (c) {
        var fake = [null, null, null, null, null, null], proto = Object.create(Array.prototype);
        proto.forEach = function () {}; Object.setPrototypeOf(fake, proto); c.districts[districtIndex].stalls = fake;
      }, 'custom array prototype cannot bypass validation', /stalls: exact dense array required/);
      broken(function (c) { c.districts[districtIndex].stalls[0].id = firstStalls[0].id; }, 'no original stall id', /stall id must be new and unique/);
      broken(function (c) { c.districts[districtIndex].stalls[1].id = c.districts[districtIndex].stalls[0].id; }, 'no duplicate stall id', /stall id must be new and unique/);
      broken(function (c) { c.districts[districtIndex].stalls[0].incomeMultiplier = 2; }, 'no extra stall fields', /stall 0: unexpected or missing field/);
      broken(function (c) { c.districts[districtIndex].stalls[0].looks.pop(); }, 'four looks', /looks: exact dense array required/);
      broken(function (c) { c.districts[districtIndex].stalls[0].looks[0] = ''; }, 'nonempty look', /look: plain text required/);
      broken(function (c) { c.districts[districtIndex].stalls[0].name = '  Padded name'; }, 'trimmed writing', /name: plain text required/);
      broken(function (c) { c.districts[districtIndex].stalls[0].habit = 'Wrong vendor.'; }, 'vendor identity', /vendor must match their writing/);
      broken(function (c) { c.districts[districtIndex].stalls[0].next = 'An invented next stall.'; }, 'next chain text', /next must name the next vendor and stall/);
      broken(function (c) { c.districts[districtIndex].stalls[5].next = 'Another district.'; }, 'final next empty', /next must name the next vendor and stall/);
      broken(function (c) { c.districts[districtIndex].permitStalls.reverse(); }, 'permit order', /permitStalls must list every type once in chain order/);
      broken(function (c) { c.districts[districtIndex].permitStalls[1] = c.districts[districtIndex].permitStalls[0]; }, 'unique permit mapping', /permitStalls must list every type once in chain order/);
      ['base', 'growth', 'rate', 'serves', 'hand'].forEach(function (key) {
        [0, -1, null, '1', NaN, Infinity].forEach(function (bad) { broken(function (c) { c.districts[districtIndex].stalls[0][key] = bad; }, 'invalid numeric ' + key, /positive finite number required/); });
      });
      broken(function (c) { c.districts[districtIndex].stalls[0].growth = 1.16; }, 'growth upper range', /growth must be/);
      broken(function (c) { c.districts[districtIndex].stalls[0].growth = 1.04; }, 'growth lower range', /growth must be/);
      broken(function (c) { c.districts[districtIndex].stalls[0].serves = 1.5; }, 'whole serves', /serves must be a positive whole number/);
      broken(function (c) { Object.setPrototypeOf(c.districts[districtIndex].stalls[0], { injected: 1 }); }, 'inherited object fields', /stall 0: plain data required/);
      broken(function (c) { c.districts[districtIndex].stalls[0][Symbol('extra')] = 1; }, 'symbol object fields', /stall 0: unexpected or missing field/);
      broken(function (c) { c.districts[districtIndex].stalls[Symbol('extra')] = 1; }, 'symbol array fields', /stalls: exact dense array required/);
      var hookCalls = 0, hooked = clone(data);
      Object.defineProperty(hooked.districts[districtIndex].stalls[0], 'base', { enumerable: true, get: function () { hookCalls++; return 15; } });
      rejects(function () { validate(hooked, firstStalls); }, 'getter input rejected', /stall 0: data fields only/); check(hookCalls === 0, 'validator does not invoke data getter');
      var nextHook = clone(data);
      Object.defineProperty(nextHook.districts[districtIndex].stalls[1], 'vendor', { enumerable: true, get: function () { hookCalls++; return 'Suri'; } });
      rejects(function () { validate(nextHook, firstStalls); }, 'cross-stall getter input rejected', /stall 1: data fields only/); check(hookCalls === 0, 'cross-stall validation does not invoke getter');
      [[0, 0], [999999, 0], [1000000, 1], [3999999, 1], [4000000, 2], [9000000, 3], [16000000, 4], [36000000, 6]].forEach(function (pair) { check(permitsFor(pair[0]) === pair[1], 'permit square-root boundary'); });
      [[24999999.999999996, 4], [80999999.99999999, 8], [99999999.99999999, 9]].forEach(function (pair) { check(permitsFor(pair[0]) === pair[1], 'next-representable amount below square threshold'); });
      [-1, NaN, Infinity, '1000000', null].forEach(function (bad) { rejects(function () { permitsFor(bad); }, 'invalid permit lifetime', /lifetime must be finite and nonnegative/); });
      rejects(function () { makeModel({ favouriteId: 'missing' }); }, 'unknown favourite', /unknown favourite stall/);
      rejects(function () { makeModel({ departureLifetime: d.moveAtLifetime - 1 }); }, 'move cannot be offered early', /departure is below the move threshold/);
      rejects(function () { makeModel({ oldCash: 1000 }); }, 'old cash cannot carry', /unknown simulation option/);
      var M = makeModel(), s = M.fresh();
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
      for (var f = 0; f < favourites.length; f++) {
        var carry = makeModel({ favouriteId: favourites[f].id, departureLifetime: d.moveAtLifetime }), state = carry.fresh();
        check(carry.STALLS[1].id === favourites[f].id && state.stalls[1].owned === 1 && !state.stalls[1].hired, 'favourite identity and ownership only');
        check(state.cash === 0 && state.lifetime === 0 && state.stalls.every(function (st, i) { return st.owned === (i === 1 ? 1 : 0); }), 'no old cash/earnings/other owned');
        check(state.open.filter(Boolean).length === 2 && state.permits === permitsFor(d.moveAtLifetime), 'two types arrive open and fresh permits are awarded');
        var income = carry.income(state); check(carry.spendPermit(state).stall === d.stalls[1].id && state.permits === permitsFor(d.moveAtLifetime) - 1, 'one permit opens the next locked type');
        while (state.permits > 0) check(carry.spendPermit(state).ok, 'remaining freshly earned permit opens another type');
        check(!carry.spendPermit(state).ok && state.permits === 0 && carry.income(state) === income, 'no negative permit balance or income boost');
      }
      var many = makeModel({ departureLifetime: 36000000 }), manyState = many.fresh();
      for (var spent = 0; many.spendPermit(manyState).ok; spent++) { need(spent < 6, 'permit loop guard'); }
      check(spent === 5 && manyState.permits === 1 && manyState.open.every(Boolean), 'five locked types consume exactly five tokens');
      check(!many.spendPermit(manyState).ok && manyState.permits === 1, 'all-open permit spending is a no-op');
      var profiles = ['active', 'saver'].map(function (id) { return P.PROFILES.find(function (p) { return p.id === id; }); });
      profiles.forEach(function (profile) {
        [undefined, { favouriteId: 'tea', departureLifetime: d.moveAtLifetime }].forEach(function (options) {
          var a = simulate(makeModel(options), profile, 7200, false);
          var b = P.simulate(makeModel(options), profile, 7200);
          equal(a.state, b.state, profile.id + ': unchanged runner produces identical final state');
          equal(a.million, b.million, profile.id + ': unchanged runner million event matches');
        });
      });
    }
    broken(function (c) { c.districts = []; }, 'empty districts', /districts must be nonempty/);
    broken(function (c) { c.districts = {}; }, 'nonarray districts', /districts must be nonempty/);
    broken(function (c) { c.districts[Symbol('extra')] = 1; }, 'symbol district-array field', /districts: exact dense array required/);
    broken(function (c) { Object.setPrototypeOf(c.districts, Object.create(Array.prototype)); }, 'custom district-array prototype', /districts: exact dense array required/);
    if (data.districts.length > 1) broken(function (c) { c.districts.reverse(); }, 'district order fixes its move threshold', /move threshold/);
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
  const profiles = ['active', 'saver'].map(id => P.PROFILES.find(p => p.id === id));
  const checks = api.runChecks(data, firstStalls, Idle, P), duration = 14400;
  function time(n) { return n === null ? 'not reached' : (n / 60).toFixed(2); }
  console.log('NM-G2 / NM-G6. Deterministic simulated minutes; no runtime/save integration.');
  console.log('Chain-only calibration: Mei carries one Tea Stall; no permits spent. Gate: all six new types available in 48–66 minutes.');
  console.log('Other favourites can change later timing; own 1M is report-only, measured for up to four simulated hours.');
  for (const [index, d] of data.districts.entries()) {
    const previous = data.districts.slice(0, index);
    const favourites = firstStalls.concat(...previous.map(prior => prior.stalls));
    const grant = api.permitsFor(d.moveAtLifetime);
    const arrivalOptions = { favouriteId: 'tea', departureLifetime: d.moveAtLifetime };
    const reports = profiles.map(p => api.simulate(api.createModel(d, Idle, firstStalls, arrivalOptions, previous), p, duration, false));
    for (const r of reports) {
      assert(r.unlockAt.every(t => t !== null), d.id + '/' + r.profile + ': all six types must become available');
      assert(r.unlockAt[5] >= 48 * 60 && r.unlockAt[5] <= 66 * 60, d.id + '/' + r.profile + ': chain completion must take 48–66 minutes');
      if (r.profile === 'active') for (let i = 1; i < 6; i++) assert(r.unlockAt[i] - r.unlockAt[i - 1] >= 180 && r.unlockAt[i] - r.unlockAt[i - 1] <= 900, d.id + ': active consecutive unlock gap must be 3–15 minutes');
      assert(r.firstBuyAt !== null && r.firstBuyAt <= 120, d.id + '/' + r.profile + ': first new stall within two minutes without shortcuts');
    }
    const favouriteArrivals = favourites.flatMap(f => profiles.map(p => ({ favourite: f.id, result: api.simulate(api.createModel(d, Idle, firstStalls, { favouriteId: f.id, departureLifetime: d.moveAtLifetime }, previous), p, duration, true) })));
    for (const item of favouriteArrivals) assert(item.result.firstBuyAt !== null && item.result.firstBuyAt <= 120, d.id + '/' + item.favourite + '/' + item.result.profile + ': first new stall within two minutes with fresh permits');
    for (const f of favourites) for (const p of profiles) {
      const r = api.simulate(api.createModel(d, Idle, firstStalls, { favouriteId: f.id, departureLifetime: d.moveAtLifetime }, previous), p, duration, false);
      assert(r.firstBuyAt !== null && r.firstBuyAt <= 120, d.id + '/' + f.id + '/' + p.id + ': first new stall within two minutes without permits');
    }
    const arrivals = profiles.map(p => api.simulate(api.createModel(d, Idle, firstStalls, arrivalOptions, previous), p, duration, true));
    console.log('\n' + d.name + ' | move lifetime ' + d.moveAtLifetime + ' | fresh permits ' + grant);
    console.log('profile | ' + d.stalls.map(s => s.id).join(' | ') + ' | first new hire | first new buy | own 1M (report only)');
    for (const r of reports) console.log(r.profile + ' | ' + r.unlockAt.map(time).join(' | ') + ' | ' + time(r.firstDistrictHireAt) + ' | ' + time(r.firstBuyAt) + ' | ' + time(r.million));
    console.log('Arrival: favourite keeps one owned and unlocked; hiring is re-earned; old cash/permit balance are zero.');
    console.log('Every previously encountered favourite/profile buys the first new stall within two minutes. Fresh permits are spent only in these separate shortcut examples:');
    for (const r of arrivals) console.log(r.profile + ' + Mei + ' + grant + ' permit(s) | ' + r.unlockAt.map(time).join(' | ') + ' | first new hire ' + time(r.firstDistrictHireAt) + ' | first new buy ' + time(r.firstBuyAt) + ' | own 1M ' + time(r.million));
    for (let i = 0; i < profiles.length; i++) assert.deepEqual(reports[i], api.simulate(api.createModel(d, Idle, firstStalls, arrivalOptions, previous), profiles[i], duration, false), d.id + ': deterministic replay');
  }
  const fixture = JSON.parse(fs.readFileSync(path.join(base, 'docs/playtests/nm-retune/legacy-v1.json'), 'utf8'));
  const original = context.NightMarket;
  assert(original.valid(fixture), 'existing literal v1 save remains valid');
  assert.equal(JSON.stringify(original.serialize(original.restore(fixture), fixture.seen)), JSON.stringify(fixture), 'existing literal v1 save round trip');
  console.log(checks.checks + ' self-checks passed, including ' + checks.rejected + ' rejected malformed inputs; timing gates, exact replay and unchanged legacy-v1 save round trip passed.');
}
