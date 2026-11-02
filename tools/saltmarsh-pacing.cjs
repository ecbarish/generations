/* Deterministic IDLE-SS1b measurements. This is test tooling, never game code.
   Elapsed times are simulated, not observed human playtime.
   The run buys the office's real routes, lighthouses and last voyage. */
(function (root) {
  'use strict';

  var PROFILES = [
    { id: 'active', buyMs: 1000, handMs: 1000, tickMs: 1000, policy: 'frontier' },
    { id: 'newcomer', buyMs: 5000, handMs: 2500, tickMs: 1000, policy: 'one' },
    { id: 'glance', buyMs: 60000, handMs: 1000, tickMs: 1000, policy: 'frontier' }
  ];

  function clock(sec) {
    sec = Math.round(sec);
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    if (h) return h + 'h ' + m + 'm';
    if (m) return m + 'm ' + s + 's';
    return s + 's';
  }

  function windowGap(times, start, end) {
    var points = [start];
    times.forEach(function (t) { if (t > start && t < end) points.push(t); });
    points.push(end);
    points.sort(function (a, b) { return a - b; });
    var gap = 0, i;
    for (i = 1; i < points.length; i++) gap = Math.max(gap, points[i] - points[i - 1]);
    return gap;
  }

  function simulate(M, profile, durationSec) {
    profile = typeof profile === 'string' ? PROFILES.filter(function (p) { return p.id === profile; })[0] : profile;
    if (!profile) throw Error('Unknown pacing profile');
    var state = M.fresh();
    var limit = (durationSec || 20000) * 1000;
    var nextHand = profile.handMs, nextTick = profile.tickMs, nextBuy = profile.buyMs;
    var lastTick = 0;
    var captainAt = null, fleetAt = null, schoonersAt = null, barksAt = null, endingAt = null;
    var purchases = [], maxGap = 0, lastBuyAt = null;
    var snapshots = {};
    var news = [0];
    var actions = [0];
    var seenChoice = '';
    function markAct(ms) { actions.push(ms / 1000); markBuy(ms); }
    function markNew(ms) { news.push(ms / 1000); }
    function rate() { return M.officeRate(state); }
    function markBuy(ms) {
      if (lastBuyAt != null) maxGap = Math.max(maxGap, ms / 1000 - lastBuyAt);
      lastBuyAt = ms / 1000;
    }
    function pickCard(desk) {
      var cards = desk.cards.slice();
      cards.sort(function (a, b) { return a.cost - b.cost; });
      var fit = null;
      cards.forEach(function (card) { if (card.which === 'fit' || card.which === 'hold') fit = card; });
      if (fit && M.paybackSeconds) {
        var best = Infinity, i;
        for (i = 0; i < M.BOATS.length; i++) {
          if (!(M.quote(state, i, 1).count > 0)) continue;
          best = Math.min(best, M.paybackSeconds(state, i));
        }
        var added = fit.which === 'hold' ? 80 * (state.boats[3] ? state.boats[3].owned : 0) : 0;
        if (fit.which === 'fit') {
          var offer = M.choiceOffer(state);
          added = offer && offer.fit ? offer.fit.cost : fit.cost;
          var spec = null;
          M.FITTINGS.forEach(function (row) { if (row.id === (offer && offer.fit && offer.fit.id)) spec = row; });
          if (!spec) M.FITTINGS.forEach(function (row) { if (row.name === fit.name) spec = row; });
          if (spec) added = spec.bonus * (state.boats[spec.tier] ? state.boats[spec.tier].owned : 0);
          else added = 0;
        }
        if (added > 0 && fit.cost / added <= best) return fit;
      }
      return cards[0];
    }
    function pickRoute(offers, sailing) {
      var fresh = offers.filter(function (offer) { return offer.depth === 0; });
      var pool = sailing < 5 && fresh.length ? fresh : offers;
      pool = pool.slice().sort(function (a, b) {
        var ap = a.gain > 0 ? a.cost / a.gain : Infinity;
        var bp = b.gain > 0 ? b.cost / b.gain : Infinity;
        return ap - bp;
      });
      return pool[0];
    }
    function bestBoat(ms) {
      var best = -1, bestPay = Infinity, i;
      for (i = 0; i < M.BOATS.length; i++) {
        if (!(M.quote(state, i, 1).count > 0)) continue;
        var pay = M.paybackSeconds(state, i);
        if (pay < bestPay) { bestPay = pay; best = i; }
      }
      if (best >= 0 && M.buy(state, best, 1).ok) markAct(ms);
    }
    function buyBoats(ms) {
      if (profile.policy === 'human') { bestBoat(ms); return; }
      if (profile.policy === 'one') {
        var i;
        for (i = M.BOATS.length - 1; i >= 0; i--) {
          if (M.quote(state, i, 1).count > 0) {
            if (M.buy(state, i, 1).ok) markAct(ms);
            return;
          }
        }
        return;
      }
      var j;
      for (j = M.BOATS.length - 1; j >= 0; j--) {
        if (M.quote(state, j, 'max').count > 0) {
          if (M.buy(state, j, 'max').ok) markAct(ms);
          return;
        }
      }
    }
    function saveFor(cost) {
      return cost <= rate() * 900;
    }
    function spend(ms) {
      var c;
      for (c = 0; c < M.CAPTAINS.length; c++) {
        if (M.canHire(state, c)) { M.hire(state, c, ms); markNew(ms); markAct(ms); }
      }
      var desk = M.deskChoice(state);
      if (desk) {
        if (seenChoice !== desk.id) { seenChoice = desk.id; markNew(ms); }
        var card = pickCard(desk);
        if (card && card.affordable) {
          if (M.chooseDesk(state, desk.id, card.which, ms).ok) { markAct(ms); markNew(ms); }
          return;
        }
        if (card && profile.policy !== 'human' && saveFor(card.cost)) return;
      }
      if (profile.chapters === false || state.boats[2].owned < M.UNLOCK_AT) {
        buyBoats(ms);
        return;
      }
      var sailing = M.routesSailing(state);
      var barks = state.boats[3].owned;
      var lamp = M.BARK_LAMP || 16;
      var chart = M.CHART_FULL || 24;
      var needRoutes = sailing < 1 || (barks >= lamp && (state.voyages || 0) < chart);
      if (needRoutes) {
        var offers = M.routeOffers(state, true);
        if (offers.length) {
          var route = pickRoute(offers, sailing);
          if (route.affordable) {
            if (M.signRoute(state, route.id, ms).ok) { markAct(ms); markNew(ms); }
            return;
          }
          if (profile.policy !== 'human' && saveFor(route.cost)) return;
        }
      }
      if (sailing >= 5 && (state.voyages || 0) >= (M.CHART_FULL || 24) && !M.allLightsLit(state)) {
        var lights = M.lightOffers(state, true);
        if (lights.length) {
          var light = lights.slice().sort(function (a, b) { return a.cost - b.cost; })[0];
          if (light.affordable) {
            if (M.buildLight(state, light.id, ms).ok) { markAct(ms); markNew(ms); }
            return;
          }
          if (profile.policy !== 'human' && saveFor(light.cost)) return;
        }
      }
      if (M.allLightsLit(state)) {
        var finale = M.finaleOffer(state, true);
        if (finale) {
          if (finale.affordable) {
            if (M.launchFinale(state, ms).ok) { endingAt = ms / 1000; markAct(ms); markNew(ms); }
            return;
          }
          if (profile.policy !== 'human' && saveFor(finale.cost)) return;
        }
      }
      if (sailing >= 5 && sailing < 24) {
        var more = M.routeOffers(state, true);
        if (more.length) {
          var again = pickRoute(more, sailing);
          if (again.affordable) {
            if (M.signRoute(state, again.id, ms).ok) { markAct(ms); markNew(ms); }
            return;
          }
          if (profile.policy !== 'human' && saveFor(again.cost) && M.allLightsLit(state)) return;
        }
      }
      buyBoats(ms);
    }

    for (var ms = Math.min(nextHand, nextTick, nextBuy); ms <= limit && endingAt == null; ms = Math.min(nextHand, nextTick, nextBuy)) {
      if (ms === nextHand) {
        if (state.trips < M.HAND_TRIPS) M.handSell(state, 0);
        nextHand += profile.handMs;
      }
      if (ms === nextTick) {
        M.addCash(state, rate() * (ms - lastTick) / 1000);
        state.played = ms / 1000;
        lastTick = ms;
        nextTick += profile.tickMs;
      }
      if (ms === nextBuy) {
        var ownedBefore = state.boats.map(function (b) { return b.owned; });
        var sailingBefore = M.routesSailing(state);
        var lightsBefore = M.lightsLit(state);
        spend(ms);
        nextBuy += profile.buyMs;
        if (M.routesSailing(state) > sailingBefore || M.lightsLit(state) > lightsBefore) markNew(ms);
        for (var t = 0; t < state.boats.length; t++) {
          [1, 5, 10, 25, 50, 100].forEach(function (at) {
            if (ownedBefore[t] < at && state.boats[t].owned >= at) markNew(ms);
          });
          if (t === 3 && ownedBefore[t] < (M.BARK_QUAY || 12) && state.boats[t].owned >= (M.BARK_QUAY || 12)) markNew(ms);
          [14, 20, 30, 40, 75].forEach(function (at) {
            if (ownedBefore[t] < at && state.boats[t].owned >= at) markNew(ms);
          });
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
          routes: M.routesSailing(state), lights: M.lightsLit(state)
        };
      }
    }

    var times = news.filter(function (t, i, all) { return all.indexOf(t) === i; }).sort(function (a, b) { return a - b; });
    var quietAll = 0;
    for (var g = 1; g < times.length; g++) quietAll = Math.max(quietAll, times[g] - times[g - 1]);
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
      routes: M.routesSailing(state),
      lights: M.lightsLit(state),
      snapshots: snapshots,
      clock: clock,
      daysAtOneShed: endingAt == null ? null : endingAt / (M.WAREHOUSE_HOURS * 3600 * M.OFFLINE_RATE),
      daysAtFullSheds: endingAt == null ? null : endingAt / (M.MAX_WAREHOUSES * M.WAREHOUSE_HOURS * 3600 * M.OFFLINE_RATE),
      offlineCap: M.offlineCap(state),
      quietGap: profile.policy === 'human' ? windowGap(actions, 240, 1200) : windowGap(times, 240, 1200),
      quietAll: quietAll,
      newsTimes: times
    };
  }

  /* Twenty minutes at the desk, then the page stays open through an eight-hour
     workday. Three looks spend what has piled up. Overnight the page is closed. */
  function workdays(M) {
    var intro = simulate(M, { id: 'active', buyMs: 1000, handMs: 1000, tickMs: 1000, policy: 'frontier' }, 1200);
    var state = M.fresh();
    var second = 0;
    function accrue(sec, mult, cap) {
      var span = cap ? Math.min(sec, M.offlineCap(state)) : sec;
      M.addCash(state, M.officeRate(state) * span * mult);
      second += sec;
      state.played = second;
    }
    function glance() {
      var guard = 0;
      while (guard++ < 80 && !state.ended) {
        var stamp = state.voyages + M.lightsLit(state) * 10 + (state.ended ? 100 : 0) + state.boats[3].owned;
        var c;
        for (c = 0; c < M.CAPTAINS.length; c++) if (M.canHire(state, c)) M.hire(state, c, second * 1000);
        var desk = M.deskChoice(state);
        if (desk) {
          var card = desk.cards.slice().sort(function (a, b) { return a.cost - b.cost; })[0];
          if (card && state.cash >= card.cost) M.chooseDesk(state, desk.id, card.which, second * 1000);
          else break;
        } else if (state.boats[2].owned >= 10 && (state.voyages || 0) < (M.CHART_FULL || 24) && (M.routesSailing(state) < 1 || state.boats[3].owned >= (M.BARK_LAMP || 16))) {
          var route = M.routeOffers(state, true)[0];
          if (route && state.cash >= route.cost) M.signRoute(state, route.id, second * 1000);
          else break;
        } else if ((state.voyages || 0) >= (M.CHART_FULL || 24) && !M.allLightsLit(state)) {
          var light = M.lightOffers(state, true)[0];
          if (light && state.cash >= light.cost) M.buildLight(state, light.id, second * 1000);
          else break;
        } else if (M.allLightsLit(state) && (state.voyages || 0) >= (M.CHART_FULL || 24)) {
          var finale = M.finaleOffer(state, true);
          if (finale && state.cash >= finale.cost) M.launchFinale(state, second * 1000);
          else break;
        } else {
          var bought = false, i;
          for (i = M.BOATS.length - 1; i >= 0; i--) {
            if (M.quote(state, i, 'max').count > 0) { M.buy(state, i, 'max'); bought = true; break; }
          }
          if (!bought) break;
        }
        if (state.voyages + M.lightsLit(state) * 10 + state.boats[3].owned === stamp && !state.ended) break;
      }
    }
    var t;
    for (t = 0; t < 1200 && !state.ended; t++) {
      if (state.trips < M.HAND_TRIPS) M.handSell(state, 0);
      accrue(1, 1, false);
      glance();
    }
    var day = 0;
    for (day = 0; day < 14 && !state.ended; day++) {
      var look;
      for (look = 0; look < 3 && !state.ended; look++) {
        accrue(Math.round((8 * 3600) / 3), 1, false);
        glance();
      }
      if (!state.ended) accrue(16 * 3600, M.OFFLINE_RATE, true);
    }
    return {
      days: state.ended ? Math.max(1, day) : null,
      still: (state.voyages || 0) + ' voyages, ' + M.lightsLit(state) + ' lights',
      ended: !!state.ended,
      captainDuringIntro: intro.captainAt,
      fleetDuringIntro: intro.fleetAt,
      owned: state.boats.map(function (b) { return b.owned; }),
      warehouses: state.warehouses,
      income: M.officeRate(state),
      clockSeconds: second
    };
  }

  function report(result) {
    function at(label, sec) { return '  ' + label + ': ' + (sec == null ? 'not reached' : result.clock(sec)); }
    return [
      result.profile + ' (simulated, not a watched play)',
      at('first captain (Wren can take the pier)', result.captainAt),
      at('fleet (10 sloops)', result.fleetAt),
      at('routes open (10 schooners)', result.schoonersAt),
      at('ten barks', result.barksAt),
      at('ending (last voyage)', result.endingAt),
      '  longest stretch between buys: ' + result.clock(result.longestGap || 0),
      '  longest stretch with nothing new, minutes 4 to 20: ' + result.clock(result.quietGap || 0),
      '  longest stretch with nothing new, whole run: ' + result.clock(result.quietAll || 0),
      '  boats owned: ' + result.owned.join(', '),
      '  routes sailing: ' + result.routes + ', lights burning: ' + result.lights
    ].join('\n');
  }

  /* A person at the desk. They wait for the next thing they mean to buy: the route,
     the spare sail, the open choice, or the boats the bar names. They do not buy
     a cheap boat just to fill the gap. Two seconds to reach for it once they can. */
  function handPlay(M, P, durationSec) {
    var state = M.fresh();
    var limit = (durationSec || 1200) * 1000;
    var waits = [];
    var seen = '';
    var since = 0;
    var readyAt = null;
    var REACT = 2000;
    function boatDesired() {
      if (!P || !P.boatNeed) return null;
      var need = P.boatNeed(state);
      if (!need) return null;
      var one = M.quote(state, need.tier, 1);
      return {
        id: 'boat:' + need.tier + ':' + state.boats[need.tier].owned,
        affordable: one.count > 0,
        buy: function () { if (one.count > 0) M.buy(state, need.tier, 1); }
      };
    }
    function desired() {
      var desk = M.deskChoice(state);
      if (desk) {
        var card = desk.cards.slice().sort(function (a, b) { return a.cost - b.cost; })[0];
        return {
          id: 'desk:' + desk.id,
          affordable: !!(card && state.cash >= card.cost),
          buy: function () { if (card) M.chooseDesk(state, desk.id, card.which, 0); }
        };
      }
      var c;
      for (c = 0; c < M.CAPTAINS.length; c++) {
        if (M.canHire(state, c)) {
          return { id: 'hire:' + c, affordable: true, buy: function () { M.hire(state, c, 0); } };
        }
      }
      var boats = boatDesired();
      if (boats) return boats;
      var offers = M.routesUnlocked(state) ? M.routeOffers(state, true) : [];
      var route = null;
      offers.forEach(function (offer) { if (!route || offer.cost < route.cost) route = offer; });
      var gear = M.gearOffer ? M.gearOffer(state) : null;
      var lightsDue = M.routesSailing(state) >= 5 && !M.allLightsLit(state) && (state.voyages || 0) >= (M.CHART_FULL || 24);
      if (!lightsDue && route) {
        if (gear && state.cash < route.cost && gear.cost <= route.cost) {
          return {
            id: 'gear:' + gear.id,
            affordable: state.cash >= gear.cost,
            buy: function () { M.buyGear(state, gear.id, 0); }
          };
        }
        return {
          id: 'route:' + route.id + ':' + ((state.routes && state.routes[route.id]) || 0),
          affordable: state.cash >= route.cost,
          buy: function () { M.signRoute(state, route.id, 0); }
        };
      }
      if (M.allLightsLit(state)) {
        var finale = M.finaleOffer(state, true);
        if (finale) {
          return {
            id: 'finale',
            affordable: finale.affordable,
            buy: function () { M.launchFinale(state, 0); }
          };
        }
      }
      if (lightsDue) {
        var lights = M.lightOffers(state, true);
        if (lights.length) {
          var light = lights.slice().sort(function (a, b) { return a.cost - b.cost; })[0];
          return {
            id: 'light:' + light.id + ':' + light.stage,
            affordable: state.cash >= light.cost,
            buy: function () { M.buildLight(state, light.id, 0); }
          };
        }
      }
      if (gear) {
        return {
          id: 'gear:' + gear.id,
          affordable: state.cash >= gear.cost,
          buy: function () { M.buyGear(state, gear.id, 0); }
        };
      }
      return null;
    }
    var ms;
    for (ms = 1000; ms <= limit && !state.ended; ms += 1000) {
      if (state.trips < M.HAND_TRIPS) M.handSell(state, 0);
      state.played = ms / 1000;
      M.addCash(state, M.officeRate(state));
      var want = desired();
      if (!want) continue;
      if (want.id !== seen) { seen = want.id; since = ms; readyAt = null; }
      if (!want.affordable) { readyAt = null; continue; }
      if (readyAt == null) readyAt = ms;
      if (ms - readyAt < REACT) continue;
      var wait = (ms - since) / 1000;
      var before = state.cash + ':' + (state.voyages || 0) + ':' + state.boats.map(function (b) { return b.owned; }).join(',');
      want.buy();
      var after = state.cash + ':' + (state.voyages || 0) + ':' + state.boats.map(function (b) { return b.owned; }).join(',');
      if (before !== after && since >= 600000 && since < 1200000) waits.push({ t: wait, id: seen });
      seen = '';
      readyAt = null;
    }
    var max = 0;
    waits.forEach(function (w) { if (w.t > max) max = w.t; });
    return { max: max, waits: waits, owned: state.boats.map(function (b) { return b.owned; }), routes: M.routesSailing(state) };
  }

  var api = { PROFILES: PROFILES, simulate: simulate, workdays: workdays, report: report, clock: clock, windowGap: windowGap, handPlay: handPlay };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SaltmarshPacing = api;
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && require.main === module) {
  const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
  const root = path.resolve(__dirname, '..');
  const context = { console: console, window: null, Arcade: {} };
  context.window = context;
  vm.createContext(context);
  for (const file of ['shared/engine.js', 'shared/idle-core.js', 'shared/roster.js', 'games/saltmarsh-shipping/model.js', 'games/saltmarsh-shipping/phase.js']) {
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
  const hand = pacing.simulate(M, { id: 'newcomer', buyMs: 5000, handMs: 2500, tickMs: 1000, policy: 'one', chapters: false }, 1200);
  lines.push('Hand player, first 20 minutes, boats and desk choices');
  lines.push('  longest stretch with nothing new, minutes 4 to 20: ' + pacing.clock(hand.quietGap || 0));
  lines.push('  boats owned: ' + hand.owned.join(', '));
  lines.push('');
  const desk = pacing.handPlay(M, context.SaltmarshPhase, 1200);
  lines.push('Hand at the desk, waits for the next route or the named boat, two seconds to reach');
  lines.push('  longest wait for the next desired purchase, minutes 10 to 20: ' + pacing.clock(desk.max || 0));
  lines.push('  those waits: ' + (desk.waits.length ? desk.waits.map(function (w) { return Math.round(w.t) + 's ' + w.id; }).join(', ') : 'none'));
  lines.push('  boats owned: ' + desk.owned.join(', ') + ', routes sailing: ' + desk.routes);
  lines.push('');
  const days = pacing.workdays(M);
  lines.push('Left open at work (20 minutes to learn, then the page stays open through the workday)');
  lines.push('  finishes on day: ' + (days.days == null ? 'not within 14 days' : days.days));
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
    const early = pacing.simulate(M, { id: 'newcomer', buyMs: 5000, handMs: 2500, tickMs: 1000, policy: 'one', chapters: false }, 1200);
    assert(early.quietGap <= 150, 'something new at least every 2.5 min from minute 4 to 20, gap was ' + early.quietGap);
    assert(early.owned[3] >= (M.BARK_QUAY || 12), 'the quay is reached inside 20 min, barks ' + early.owned[3]);
    const handRun = pacing.handPlay(M, context.SaltmarshPhase, 1200);
    assert(handRun.max <= 30, 'hand waits in minutes 10 to 20 stay within about 30s, was ' + handRun.max + ' (' + handRun.waits.map(function (w) { return Math.round(w.t) + ' ' + w.id; }).join(', ') + ')');
    console.log('validation: passed');
  }
}
