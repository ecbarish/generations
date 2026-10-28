/* Deterministic IDLE-SS1 measurements. This is test tooling, never game code.
   Elapsed times are simulated, not observed human playtime.
   The model API matches the Night Market runner: fresh, unlocked, handSell,
   canHire, hire, quote, buy, production, income, addCash.
   Trade routes and lighthouses are not sold in the game yet. The plan below is
   the curve they are heading for, frozen into prices when each chapter opens. */
(function (root) {
  'use strict';

  var PROFILES = [
    { id: 'active', buyMs: 1000, handMs: 1000, tickMs: 1000, policy: 'frontier' },
    { id: 'newcomer', buyMs: 5000, handMs: 2500, tickMs: 1000, policy: 'one' },
    { id: 'glance', buyMs: 60000, handMs: 1000, tickMs: 1000, policy: 'frontier' }
  ];

  /* After ten barks, an active office saves for these chapters one at a time.
     `wait` is how long that chapter takes at the income it opens on.
     A route leg then adds income (its price divided by `payback`). A light does not.
     The legs are short on purpose: a few minutes of saving, then the chart moves.
     PR 2 builds the screen. This only keeps the ending on a 2–3 hour curve. */
  function legs(name, kind, count, wait, payback) {
    var out = [];
    for (var i = 1; i <= count; i++) {
      out.push({ id: name.toLowerCase().replace(/\s+/g, '-') + '-' + i, name: name + ' ' + i, kind: kind, wait: wait, payback: payback });
    }
    return out;
  }
  var PLAN = []
    .concat(legs('Reed Channel', 'route', 4, 210, 75))
    .concat(legs('Across the bar', 'route', 4, 210, 75))
    .concat(legs('Headland run', 'route', 4, 220, 80))
    .concat(legs('North cargo', 'route', 4, 220, 80))
    .concat(legs('Deep roadstead', 'route', 4, 240, 90))
    .concat(legs('Pilot light', 'light', 2, 200))
    .concat(legs('Bar light', 'light', 2, 200))
    .concat(legs('Reed light', 'light', 2, 210))
    .concat(legs('Headland light', 'light', 2, 210))
    .concat(legs('North light', 'light', 2, 220))
    .concat(legs('Quay light', 'light', 2, 220))
    .concat(legs('Roadstead light', 'light', 2, 240))
    .concat(legs('Last light', 'light', 2, 240));

  function clock(sec) {
    sec = Math.round(sec);
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    if (h) return h + 'h ' + m + 'm';
    if (m) return m + 'm ' + s + 's';
    return s + 's';
  }

  function simulate(M, profile, durationSec) {
    profile = typeof profile === 'string' ? PROFILES.filter(function (p) { return p.id === profile; })[0] : profile;
    if (!profile) throw Error('Unknown pacing profile');
    var state = M.fresh();
    var limit = (durationSec || 20000) * 1000;
    var nextHand = profile.handMs, nextTick = profile.tickMs, nextBuy = profile.buyMs;
    var lastTick = 0;
    var captainAt = null, fleetAt = null, schoonersAt = null, barksAt = null, endingAt = null;
    var extra = 0, planAt = 0, chapter = null, bought = [];
    var purchases = [], maxGap = 0, lastBuyAt = null;
    var snapshots = {};
    var news = [0];
    function markNew(ms) {
      if (ms / 1000 <= 1200) news.push(ms / 1000);
    }

    function rate() { return M.income(state) + (M.captainRate ? M.captainRate(state) : 0) + extra; }
    function markBuy(ms) {
      if (lastBuyAt != null) maxGap = Math.max(maxGap, ms / 1000 - lastBuyAt);
      lastBuyAt = ms / 1000;
    }
    function maybeFit(ms) {
      if (!M.fittingOffers || !M.buyFitting) return false;
      var offers = M.fittingOffers(state);
      if (!offers.length || !(state.cash >= offers[0].cost)) return false;
      var fit = offers[0];
      var added = fit.bonus * (state.boats[fit.tier] ? state.boats[fit.tier].owned : 0);
      if (!(added > 0)) return false;
      var fitPay = fit.cost / added;
      var bestBoat = Infinity;
      for (var i = 0; i < M.BOATS.length; i++) {
        if (!(M.quote(state, i, 1).count > 0)) continue;
        bestBoat = Math.min(bestBoat, M.paybackSeconds(state, i));
      }
      if (!(fitPay <= bestBoat)) return false;
      if (M.chooseFork) {
        if (!M.chooseFork(state, fit.id === 'sloop-hull' ? 'sloop' : 'schooner', 'fit', ms).ok) return false;
      } else if (!M.buyFitting(state, fit.id, ms).ok) return false;
      markBuy(ms);
      markNew(ms);
      return true;
    }
    function openChapter(ms) {
      if (chapter || planAt >= PLAN.length || !barksAt) return;
      var spec = PLAN[planAt];
      var nowRate = rate();
      if (!(nowRate > 0)) return;
      chapter = {
        id: spec.id, name: spec.name, kind: spec.kind,
        cost: nowRate * spec.wait,
        rate: spec.kind === 'route' ? (nowRate * spec.wait) / spec.payback : 0,
        opened: ms / 1000
      };
    }
    function spend(ms) {
      var c;
      for (c = 0; c < M.CAPTAINS.length; c++) {
        if (M.canHire(state, c)) { M.hire(state, c, ms); markNew(ms); }
      }
      if (maybeFit(ms)) return;
      if (profile.chapters === false) {
        /* The route chapters are not in the game yet. This pass only buys boats. */
      } else openChapter(ms);
      if (chapter && state.cash >= chapter.cost) {
        state.cash -= chapter.cost;
        extra += chapter.rate;
        bought.push({ id: chapter.id, at: ms / 1000, cost: chapter.cost, rate: chapter.rate });
        markBuy(ms);
        markNew(ms);
        chapter = null;
        planAt += 1;
        if (planAt >= PLAN.length) endingAt = ms / 1000;
        return;
      }
      if (chapter && chapter.cost <= rate() * 900) return;
      if (profile.policy === 'one') {
        for (var i = M.BOATS.length - 1; i >= 0; i--) {
          if (M.quote(state, i, 1).count > 0) {
            if (M.buy(state, i, 1).ok) markBuy(ms);
            return;
          }
        }
        return;
      }
      for (var j = M.BOATS.length - 1; j >= 0; j--) {
        if (M.quote(state, j, 'max').count > 0) {
          if (M.buy(state, j, 'max').ok) markBuy(ms);
          return;
        }
      }
    }

    for (var ms = Math.min(nextHand, nextTick, nextBuy); ms <= limit && endingAt == null; ms = Math.min(nextHand, nextTick, nextBuy)) {
      if (ms === nextHand) {
        if (state.trips < M.HAND_TRIPS) M.handSell(state, 0);
        nextHand += profile.handMs;
      }
      if (ms === nextTick) {
        M.addCash(state, rate() * (ms - lastTick) / 1000);
        lastTick = ms;
        nextTick += profile.tickMs;
      }
      if (ms === nextBuy) {
        var ownedBefore = state.boats.map(function (b) { return b.owned; });
        spend(ms);
        nextBuy += profile.buyMs;
        for (var t = 0; t < state.boats.length; t++) {
          [1, 10, 25, 50, 100].forEach(function (at) {
            if (ownedBefore[t] < at && state.boats[t].owned >= at) markNew(ms);
          });
          if (t === 3 && ownedBefore[t] < (M.BARK_QUAY || 12) && state.boats[t].owned >= (M.BARK_QUAY || 12)) markNew(ms);
          if (t === 3 && ownedBefore[t] < (M.BARK_LAMP || 16) && state.boats[t].owned >= (M.BARK_LAMP || 16)) markNew(ms);
        }
      }
      if (captainAt == null && state.boats[0].owned >= (M.WREN_AT || M.UNLOCK_AT)) captainAt = ms / 1000;
      if (fleetAt == null && state.boats[1].owned >= M.UNLOCK_AT) fleetAt = ms / 1000;
      if (schoonersAt == null && state.boats[2].owned >= M.UNLOCK_AT) schoonersAt = ms / 1000;
      if (barksAt == null && state.boats[3].owned >= M.UNLOCK_AT) barksAt = ms / 1000;
      if (ms === 600000 || ms === 1800000 || ms === 3600000 || ms === 7200000 || ms === 10800000) {
        snapshots[ms / 1000] = {
          income: rate(), lifetime: state.lifetime,
          owned: state.boats.map(function (b) { return b.owned; }),
          plan: planAt
        };
      }
    }

    var cap = M.offlineCap(state);
    return {
      profile: profile.id,
      captainAt: captainAt,
      fleetAt: fleetAt,
      schoonersAt: schoonersAt,
      barksAt: barksAt,
      endingAt: endingAt,
      longestGap: maxGap,
      owned: state.boats.map(function (b) { return b.owned; }),
      income: rate(),
      lifetime: state.lifetime,
      warehouses: state.warehouses,
      planBought: bought.length,
      snapshots: snapshots,
      chapters: bought,
      clock: clock,
      /* One closed-page collection a day, at the shed the office has now. */
      daysAtOneShed: endingAt == null ? null : endingAt / (M.WAREHOUSE_HOURS * 3600 * M.OFFLINE_RATE),
      daysAtFullSheds: endingAt == null ? null : endingAt / (M.MAX_WAREHOUSES * M.WAREHOUSE_HOURS * 3600 * M.OFFLINE_RATE),
      offlineCap: cap,
      quietGap: (function () {
        var times = news.filter(function (t, i, all) { return all.indexOf(t) === i; }).sort(function (a, b) { return a - b; });
        var gap = 0;
        for (var g = 1; g < times.length; g++) gap = Math.max(gap, times[g] - times[g - 1]);
        if (times.length && times[times.length - 1] < 1200) gap = Math.max(gap, 1200 - times[times.length - 1]);
        return gap;
      })(),
      newsTimes: news.filter(function (t, i, all) { return all.indexOf(t) === i; }).sort(function (a, b) { return a - b; })
    };
  }

  /* A person who learns the office for twenty minutes, then checks it three times
     a day. Between checks the page is closed, so the sheds pay half rate. */
  function workdays(M) {
    var state = M.fresh();
    var extra = 0, planAt = 0, chapter = null, day = 0, second = 0;
    function rate() { return M.income(state) + (M.captainRate ? M.captainRate(state) : 0) + extra; }
    function activeBurst(seconds) {
      for (var t = 0; t < seconds; t++) {
        if (state.trips < M.HAND_TRIPS) M.handSell(state, 0);
        M.addCash(state, rate());
        var c;
        for (c = 0; c < M.CAPTAINS.length; c++) if (M.canHire(state, c)) M.hire(state, c, second * 1000);
        for (var i = M.BOATS.length - 1; i >= 0; i--) {
          if (M.quote(state, i, 'max').count > 0) { M.buy(state, i, 'max'); break; }
        }
        second += 1;
      }
    }
    function openChapter() {
      if (chapter || planAt >= PLAN.length || state.boats[3].owned < M.UNLOCK_AT) return;
      var spec = PLAN[planAt];
      var nowRate = rate();
      if (!(nowRate > 0)) return;
      chapter = { cost: nowRate * spec.wait, rate: spec.kind === 'route' ? (nowRate * spec.wait) / spec.payback : 0 };
    }
    function glance() {
      var guard = 0;
      while (guard++ < 40 && planAt < PLAN.length) {
        var c, bought = false;
        for (c = 0; c < M.CAPTAINS.length; c++) if (M.canHire(state, c)) M.hire(state, c, second * 1000);
        if (M.choiceOffer && M.chooseFork) {
          var offer = M.choiceOffer(state);
          if (offer && offer.shed.affordable) M.chooseFork(state, offer.id, 'shed', second * 1000);
          else if (offer && offer.fit.affordable) M.chooseFork(state, offer.id, 'fit', second * 1000);
        }
        openChapter();
        if (chapter && state.cash >= chapter.cost) {
          state.cash -= chapter.cost;
          extra += chapter.rate;
          chapter = null;
          planAt += 1;
          continue;
        }
        if (!(chapter && chapter.cost <= rate() * 900)) {
          for (var i = M.BOATS.length - 1; i >= 0; i--) {
            if (M.quote(state, i, 'max').count > 0) { M.buy(state, i, 'max'); bought = true; break; }
          }
        }
        var price = M.warehousePrice(state);
        if (price != null && state.cash >= price && state.cash - price >= rate() * 30) {
          M.buyWarehouse(state);
          bought = true;
        }
        if (!bought) break;
      }
      return planAt >= PLAN.length;
    }
    activeBurst(1200);
    var captainAt = state.boats[0].owned >= (M.WREN_AT || 10) ? second : null;
    var fleetAt = state.boats[1].owned >= 10 ? second : null;
    for (day = 0; day < 14 && planAt < PLAN.length; day++) {
      for (var check = 0; check < 3 && planAt < PLAN.length; check++) {
        var away = Math.min(6 * 3600, M.offlineCap(state));
        M.addCash(state, rate() * away * M.OFFLINE_RATE);
        second += 6 * 3600;
        if (glance()) break;
      }
    }
    return {
      days: planAt >= PLAN.length ? Math.max(1, Math.ceil(day)) : null,
      still: planAt,
      captainDuringIntro: captainAt,
      fleetDuringIntro: fleetAt,
      owned: state.boats.map(function (b) { return b.owned; }),
      warehouses: state.warehouses,
      income: rate()
    };
  }

  function report(result) {
    function at(label, sec) { return '  ' + label + ': ' + (sec == null ? 'not reached' : result.clock(sec)); }
    return [
      result.profile + ' (simulated, not a watched play)',
      at('first captain (Wren can take the pier)', result.captainAt),
      at('fleet (10 sloops)', result.fleetAt),
      at('routes marked (10 schooners)', result.schoonersAt),
      at('ten barks', result.barksAt),
      at('projected ending (last light)', result.endingAt),
      '  longest stretch between buys: ' + result.clock(result.longestGap || 0),
      '  longest stretch with nothing new, first 20 minutes: ' + result.clock(result.quietGap || 0),
      '  boats owned: ' + result.owned.join(', '),
      '  one shed, one collection a day: ' + (result.daysAtOneShed == null ? 'n/a' : result.daysAtOneShed.toFixed(1) + ' days of that active curve'),
      '  four sheds, one collection a day: ' + (result.daysAtFullSheds == null ? 'n/a' : result.daysAtFullSheds.toFixed(1) + ' days of that active curve')
    ].join('\n');
  }

  var api = { PROFILES: PROFILES, PLAN: PLAN, simulate: simulate, workdays: workdays, report: report, clock: clock };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SaltmarshPacing = api;
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && require.main === module) {
  const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
  const root = path.resolve(__dirname, '..');
  const context = { console: console, window: null, Arcade: {} };
  context.window = context;
  vm.createContext(context);
  for (const file of ['shared/engine.js', 'shared/idle-core.js', 'shared/roster.js', 'games/saltmarsh-shipping/model.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  const M = context.Saltmarsh;
  const pacing = module.exports;
  const lines = [];
  for (const profile of pacing.PROFILES) {
    const result = pacing.simulate(M, profile);
    lines.push(pacing.report(result));
    lines.push('');
  }
  const office = pacing.simulate(M, { id: 'newcomer', buyMs: 5000, handMs: 2500, tickMs: 1000, policy: 'one', chapters: false }, 1200);
  lines.push('Hand player, first 20 minutes, boats only (the route chapters are not for sale yet)');
  lines.push('  longest stretch with nothing new: ' + pacing.clock(office.quietGap || 0));
  lines.push('  boats owned: ' + office.owned.join(', '));
  lines.push('');
  const days = pacing.workdays(M);
  lines.push('Left open at work (20 min to learn the office, then three closed-page check-ins a day, half pay, shed cap)');
  lines.push('  finishes on day: ' + (days.days == null ? 'not within 14 days (' + days.still + ' chapters)' : days.days));
  lines.push('  sheds: ' + days.warehouses + ', boats: ' + days.owned.join(', '));
  const text = lines.join('\n');
  console.log(text);
  if (process.argv.includes('--check')) {
    const assert = require('node:assert/strict');
    const active = pacing.simulate(M, 'active');
    assert(active.captainAt > 0 && active.captainAt <= 600, 'captain within 10 min, was ' + active.captainAt);
    assert(active.fleetAt > active.captainAt && active.fleetAt <= 1800, 'fleet within 30 min, was ' + active.fleetAt);
    assert(active.endingAt >= 7200 && active.endingAt <= 10800, 'ending 2–3h, was ' + active.endingAt);
    assert(active.longestGap <= 300, 'no chapter longer than 5 min, was ' + active.longestGap);
    const office = pacing.workdays(M);
    assert(office.days >= 1 && office.days <= 3, 'left open 1–3 days, was ' + office.days);
    const newbie = pacing.simulate(M, 'newcomer');
    assert(newbie.captainAt >= 90 && newbie.captainAt <= 180, 'newcomer captain 1.5–3 min, was ' + newbie.captainAt);
    assert(newbie.fleetAt > newbie.captainAt && newbie.fleetAt <= 1800, 'newcomer fleet within 30 min, was ' + newbie.fleetAt);
    const hand = pacing.simulate(M, { id: 'newcomer', buyMs: 5000, handMs: 2500, tickMs: 1000, policy: 'one', chapters: false }, 1200);
    assert(hand.quietGap <= 300, 'something new at least every 5 min in the first 20, gap was ' + hand.quietGap);
    assert(hand.owned[3] >= (M.BARK_QUAY || 12), 'the quay is reached inside 20 min, barks ' + hand.owned[3]);
    console.log('validation: passed');
  }
}
