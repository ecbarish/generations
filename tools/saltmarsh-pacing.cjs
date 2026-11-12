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
        var lights = M.lightOffers(state, false);
        if (lights.length) {
          var light = lights.slice().sort(function (a, b) { return a.cost - b.cost; })[0];
          if (light.affordable) {
            if (M.buildLight(state, light.id, ms).ok) { markAct(ms); markNew(ms); }
            return;
          }
          if (profile.policy !== 'human' && saveFor(light.cost)) return;
        }
      }
      if (M.voyageOpen && M.voyageOpen(state) && M.nextPreparation) {
        var prov = M.nextPreparation(state);
        if (prov) {
          if (prov.affordable && M.buyPreparation(state, prov.id, prov.choice ? prov.choice[0].id : '', ms).ok) { markAct(ms); markNew(ms); return; }
          if (profile.policy !== 'human' && saveFor(prov.cost)) return;
        }
      }
      if (M.preparationsComplete && M.preparationsComplete(state)) {
        var ready = M.finaleOffer(state);
        if (ready && M.launchFinale(state, ms).ok) { endingAt = ms / 1000; markAct(ms); markNew(ms); return; }
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

  /* What the goal bar is asking for. Kept in step with the page's followGoal. */
  function goalAction(M, P, state, now) {
    var goal = P.goal(state);
    if (/^Choose fresh|^Choose a pilot/.test(goal)) {
      var earlyPrep = P.nextAct(state);
      if (earlyPrep && earlyPrep.kind === 'prep') {
        return { id: 'prep:' + earlyPrep.id, affordable: state.cash >= earlyPrep.cost, buy: function () { M.buyPreparation(state, earlyPrep.id, earlyPrep.which || '', now); } };
      }
    }
    if (/^Choose a route/.test(goal)) {
      var first = P.nextAct(state);
      if (first && first.kind === 'route') {
        return {
          id: 'route:' + first.id + ':' + ((state.routes && state.routes[first.id]) || 0),
          affordable: state.cash >= first.cost,
          buy: function () { M.signRoute(state, first.id, now); }
        };
      }
      return null;
    }
    if (/^Pick bell or coal/.test(goal) || /^Choose /.test(goal)) {
      var desk = M.deskChoice(state);
      var card = desk && desk.cards[0];
      return {
        id: 'desk:' + (desk ? desk.id : ''),
        affordable: !!(card && state.cash >= card.cost),
        buy: function () { if (card && state.cash >= card.cost) M.chooseDesk(state, desk.id, card.which, now); }
      };
    }
    if (/^Ask /.test(goal)) {
      var hire = -1, c;
      for (c = 0; c < M.CAPTAINS.length; c++) if (M.canHire(state, c)) { hire = c; break; }
      return {
        id: 'hire:' + hire,
        affordable: hire >= 0,
        buy: function () { if (hire >= 0) M.hire(state, hire, now); }
      };
    }
    if (/^Row /.test(goal)) {
      return {
        id: 'row',
        affordable: state.trips < M.HAND_TRIPS,
        buy: function () { M.handSell(state, 0); }
      };
    }
    var act = P.nextAct(state);
    if (/^Set sail/.test(goal) && act && act.kind === 'finale') {
      return { id: 'sail', affordable: true, buy: function () { M.launchFinale(state, now); } };
    }
    if ((/^Pack /.test(goal) || /^Choose fresh/.test(goal) || /^Choose a pilot/.test(goal)) && act && act.kind === 'prep') {
      return { id: 'prep:' + act.id, affordable: state.cash >= act.cost, buy: function () { M.buyPreparation(state, act.id, act.which || '', now); } };
    }
    if (/^Do the harbour work/.test(goal) && act && act.kind === 'work') {
      return { id: 'work', affordable: state.cash >= act.cost, buy: function () { M.buyWork(state, now); } };
    }
    if (/^Run the errand/.test(goal) && act && act.kind === 'errand') {
      return { id: 'errand', affordable: state.cash >= act.cost, buy: function () { M.buyErrand(state, now); } };
    }
    if (/^Sign /.test(goal) && act && act.kind === 'route') {
      return { id: 'route:' + act.id + ':' + ((state.routes && state.routes[act.id]) || 0), affordable: state.cash >= act.cost, buy: function () { M.signRoute(state, act.id, now); } };
    }
    if (/^(Raise|Light) the /.test(goal) && act && act.kind === 'light') {
      return { id: 'light:' + act.id + ':' + ((state.lights && state.lights[act.id]) || 0), affordable: state.cash >= act.cost, buy: function () { M.buildLight(state, act.id, now); } };
    }
    if (/^Buy |^Tie up /.test(goal)) {
      if (act && act.kind === 'boat') {
        return {
          id: 'boat:' + act.tier + ':' + state.boats[act.tier].owned + ':' + act.count,
          affordable: state.cash >= act.cost,
          buy: function () { if (M.buy(state, act.tier, act.count).ok) M.commitGoal(state, 'boat'); }
        };
      }
      var need = P.boatNeed(state);
      if (!need) return null;
      return {
        id: 'boat:' + need.tier + ':' + state.boats[need.tier].owned,
        affordable: M.quote(state, need.tier, 1).count > 0,
        buy: function () { if (M.quote(state, need.tier, 1).count > 0) M.buy(state, need.tier, 1); }
      };
    }
    return null;
  }

  function overlapGap(times, start, end) {
    var pts = times.slice().sort(function (a, b) { return a - b; });
    var gap = 0, i;
    for (i = 1; i < pts.length; i++) {
      var left = Math.max(pts[i - 1], start);
      var right = Math.min(pts[i], end);
      if (right > left && right - left > gap) gap = right - left;
    }
    return gap;
  }

  /* The same decisions as the browser greedy run, without the page.
     Cash matches the office: boats and routes each second, captains on their hauls. */
  function greedyRun(M, P, durationSec) {
    P = P || root.SaltmarshPhase;
    var state = M.fresh();
    var limit = durationSec || 30000;
    var sim = 1700000000000;
    var actions = [0];
    var sec;
    for (sec = 1; sec <= limit && !state.ended; sec++) {
      sim += 1000;
      state.played = sec;
      M.addCash(state, M.income(state) + M.routeIncome(state));
      M.collectCaptains(state, sim, 1);
      var act = goalAction(M, P, state, sim);
      if (!act || !act.affordable) continue;
      var before = state.cash + ':' + (state.voyages || 0) + ':' + (state.provisions || 0) + ':' + M.lightsLit(state) + ':' + (state.ended ? 1 : 0) + ':' + state.boats.map(function (b) { return b.owned; }).join(',');
      act.buy();
      var after = state.cash + ':' + (state.voyages || 0) + ':' + (state.provisions || 0) + ':' + M.lightsLit(state) + ':' + (state.ended ? 1 : 0) + ':' + state.boats.map(function (b) { return b.owned; }).join(',');
      if (before !== after) actions.push(sec);
    }
    if (actions[actions.length - 1] !== state.played) actions.push(state.played);
    var end = Math.min(1800, state.played || 0);
    return {
      endingAt: state.ended ? state.played : null,
      maxGap: state.played > 240 ? overlapGap(actions, 240, end) : 0,
      owned: state.boats.map(function (b) { return b.owned; }),
      routes: M.routesSailing(state),
      lights: M.lightsLit(state),
      provisions: state.provisions || 0
    };
  }

  /* Twenty minutes at the desk, then the page stays open through an eight-hour
     workday. Three looks spend what has piled up. Overnight the page is closed. */
  function workdays(M, P) {
    P = P || root.SaltmarshPhase;
    var intro = simulate(M, { id: 'active', buyMs: 1000, handMs: 1000, tickMs: 1000, policy: 'frontier' }, 1200);
    var state = M.fresh();
    var second = 0;
    function accrue(sec, mult, cap) {
      var span = cap ? Math.min(sec, M.offlineCap(state)) : sec;
      M.addCash(state, (M.income(state) + M.routeIncome(state)) * span * mult);
      second += sec;
      state.played = second;
    }
    function glance(limitBuys) {
      var guard = 0;
      /* Three short looks in a workday. A look does not empty the whole hold,
         so a page left open still takes about three days. */
      var capBuys = limitBuys || 70;
      while (guard++ < capBuys && !state.ended) {
        var act = goalAction(M, P, state, second * 1000);
        if (!act || !act.affordable) break;
        var before = (state.voyages || 0) + ':' + (state.provisions || 0) + ':' + M.lightsLit(state) + ':' + state.cash + ':' + state.boats.map(function (b) { return b.owned; }).join(',');
        act.buy();
        var after = (state.voyages || 0) + ':' + (state.provisions || 0) + ':' + M.lightsLit(state) + ':' + state.cash + ':' + state.boats.map(function (b) { return b.owned; }).join(',');
        if (before === after) break;
      }
    }
    var t;
    for (t = 0; t < 1200 && !state.ended; t++) {
      accrue(1, 1, false);
      M.collectCaptains(state, second * 1000, 1);
      glance(1);
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
    var ms;
    for (ms = 1000; ms <= limit && !state.ended; ms += 1000) {
      state.played = ms / 1000;
      M.addCash(state, M.income(state) + M.routeIncome(state));
      M.collectCaptains(state, ms, 1);
      var want = goalAction(M, P, state, ms);
      if (!want) continue;
      if (want.id !== seen) { seen = want.id; since = ms; readyAt = null; }
      if (!want.affordable) { readyAt = null; continue; }
      if (readyAt == null) readyAt = ms;
      if (ms - readyAt < REACT) continue;
      var wait = (ms - since) / 1000;
      var before = state.cash + ':' + (state.voyages || 0) + ':' + (state.provisions || 0) + ':' + state.boats.map(function (b) { return b.owned; }).join(',');
      want.buy();
      var after = state.cash + ':' + (state.voyages || 0) + ':' + (state.provisions || 0) + ':' + state.boats.map(function (b) { return b.owned; }).join(',');
      if (before !== after) waits.push({ t: wait, start: since / 1000, end: ms / 1000, id: seen });
      seen = '';
      readyAt = null;
    }
    var max = 0;
    waits.forEach(function (w) {
      var left = Math.max(w.start, 240);
      var right = Math.min(w.end, 1800);
      if (right > left && right - left > max) max = right - left;
    });
    return { max: max, waits: waits, owned: state.boats.map(function (b) { return b.owned; }), routes: M.routesSailing(state) };
  }

  /* A person reading the goal bar: the same decisions, two seconds after the coins are there.
     Starts from a new office. No preset. */
  function organicRun(M, P) {
    P = P || root.SaltmarshPhase;
    var state = M.fresh();
    var sim = 1700000000000;
    var firstLight = null;
    var ready = null;
    var seen = '';
    var sec;
    for (sec = 1; sec <= 12000 && !state.ended; sec++) {
      sim += 1000;
      state.played = sec;
      M.addCash(state, M.income(state) + M.routeIncome(state));
      M.collectCaptains(state, sim, 1);
      var act = goalAction(M, P, state, sim);
      if (!act) continue;
      if (act.id !== seen) { seen = act.id; ready = null; }
      if (!act.affordable) { ready = null; continue; }
      if (ready == null) ready = sec;
      if (sec - ready < 2) continue;
      act.buy();
      if (firstLight == null && M.lightsLit(state) > 0) firstLight = sec;
      seen = '';
      ready = null;
    }
    return {
      endingAt: state.ended ? state.played : null,
      firstLight: firstLight,
      played: state.played,
      hauls: (state.captains || []).reduce(function (n, c) { return n + ((c && c.hauls) || 0); }, 0)
    };
  }

  var api = { PROFILES: PROFILES, simulate: simulate, workdays: workdays, report: report, clock: clock, windowGap: windowGap, handPlay: handPlay, greedyRun: greedyRun, goalAction: goalAction, organicRun: organicRun };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SaltmarshPacing = api;
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && require.main === module) {
  const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
  const root = path.resolve(__dirname, '..');
  const context = { console: console, window: null, Arcade: {} };
  context.window = context;
  vm.createContext(context);
  for (const file of ['shared/engine.js', 'shared/payback-label.js', 'shared/idle-core.js', 'shared/roster.js', 'games/saltmarsh-shipping/model.js', 'games/saltmarsh-shipping/phase.js']) {
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
  const desk = pacing.handPlay(M, context.SaltmarshPhase, 1800);
  lines.push('Hand at the desk, waits for the next route or the named boat, two seconds to reach');
  lines.push('  longest wait for the next desired purchase, minutes 4 to 30: ' + pacing.clock(desk.max || 0));
  lines.push('  those waits: ' + (desk.waits.length ? desk.waits.map(function (w) { return Math.round(w.t) + 's ' + w.id; }).join(', ') : 'none'));
  lines.push('  boats owned: ' + desk.owned.join(', ') + ', routes sailing: ' + desk.routes);
  lines.push('');
  const model = pacing.greedyRun(M, context.SaltmarshPhase);
  lines.push('Goal-following model (same decisions as the browser greedy run)');
  lines.push('  ending: ' + (model.endingAt == null ? 'not reached' : pacing.clock(model.endingAt) + ' (' + model.endingAt + 's)'));
  lines.push('  longest no-action stretch, minutes 4 to 30: ' + (model.maxGap || 0) + 's');
  lines.push('');
  const days = pacing.workdays(M, context.SaltmarshPhase);
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
    assert(active.endingAt > 0 && active.endingAt <= model.endingAt, 'an office that buys boats freely still reaches the ending, and not later than the goal model, was ' + active.endingAt + ' model ' + model.endingAt);
    assert(active.longestGap <= 300, 'no chapter longer than 5 min, was ' + active.longestGap);
    const office = pacing.workdays(M, context.SaltmarshPhase);
    assert(office.days >= 1 && office.days <= 3, 'left open 1–3 days, was ' + office.days + ' (' + office.still + ')');
    const newbie = pacing.simulate(M, 'newcomer');
    assert(newbie.captainAt >= 90 && newbie.captainAt <= 180, 'newcomer captain 1.5–3 min, was ' + newbie.captainAt);
    assert(newbie.fleetAt > newbie.captainAt && newbie.fleetAt <= 1800, 'newcomer fleet within 30 min, was ' + newbie.fleetAt);
    const early = pacing.simulate(M, { id: 'newcomer', buyMs: 5000, handMs: 2500, tickMs: 1000, policy: 'one', chapters: false }, 1200);
    assert(early.quietGap <= 150, 'something new at least every 2.5 min from minute 4 to 20, gap was ' + early.quietGap);
    assert(early.owned[3] >= (M.BARK_QUAY || 12), 'the quay is reached inside 20 min, barks ' + early.owned[3]);
    const handRun = pacing.handPlay(M, context.SaltmarshPhase, 1800);
    assert(handRun.max <= 40, 'hand waits in minutes 4 to 30 stay within about 40s, was ' + handRun.max + ' (' + handRun.waits.map(function (w) { return Math.round(w.t) + 's ' + w.id; }).join(', ') + ')');
    const nodeRun = model;
    browserGreedy().then(function (browser) {
      const browserEnding = browser.ending || 0;
      const nodeEnding = nodeRun.endingAt || 0;
      const apart = browserEnding > 0 ? Math.abs(nodeEnding - browserEnding) / browserEnding : 1;
      console.log('browser ending: ' + pacing.clock(browserEnding) + ' (' + browserEnding + 's)');
      console.log('model ending: ' + pacing.clock(nodeEnding) + ' (' + nodeEnding + 's)');
      console.log('browser longest no-action stretch, minutes 4 to 120: ' + browser.maxGap + 's');
      console.log('model longest no-action stretch, minutes 4 to 30: ' + nodeRun.maxGap + 's');
      assert(browser.ended, 'browser greedy reached the ending' + (browser.goal ? ' goal ' + browser.goal : '') + (browser.fail ? ' ' + browser.fail : ''));
      assert(browserEnding >= 6300 && browserEnding <= 9000, 'browser ending 1h45m–2h30m, was ' + browserEnding);
      assert(apart <= 0.10, 'model matches the browser within 10%, browser ' + browserEnding + ' model ' + nodeEnding);
      assert(browser.maxGap <= 40, 'browser minutes 4 to 120 stay within about 40s, was ' + browser.maxGap);
      console.log('validation: passed');
    }).catch(function (err) {
      console.error(err);
      process.exit(1);
    });
  }
}

function browserGreedy() {
  const http = require('node:http');
  const fs = require('node:fs');
  const path = require('node:path');
  const { chromium } = require('playwright');
  const browserPath = require('./find-browser.cjs');
  const rootDir = path.resolve(__dirname, '..');
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.cjs': 'text/javascript' };
  return new Promise(function (resolve, reject) {
    const server = http.createServer(function (req, res) {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(rootDir, p);
      if (!file.startsWith(rootDir)) { res.writeHead(403); return res.end(); }
      fs.readFile(file, function (err, data) {
        if (err) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', function () {
      const port = server.address().port;
      const exe = browserPath();
      chromium.launch({ headless: true, executablePath: exe || undefined }).then(function (browser) {
        return browser.newPage().then(function (page) {
          return page.goto('http://127.0.0.1:' + port + '/games/saltmarsh-shipping/index.html', { waitUntil: 'load' }).then(function () {
            return page.waitForFunction(function () { return window.__saltmarsh && window.Saltmarsh && window.SaltmarshPhase; });
          }).then(function () {
            return page.evaluate(function () {
              const bridge = window.__saltmarsh;
              const M = window.Saltmarsh;
              window.__saltmarshHold = true;
              try { bridge.idle().stop(); } catch (e) { /* already stopped */ }
              const state = bridge.state;
              let sim = 1700000000000;
              const actions = [0];
              let guard = 0;
              let stuck = 0;
              while (!state.ended && guard++ < 30000) {
                sim += 1000;
                window.__saltmarshTime = sim;
                state.played = (state.played || 0) + 1;
                bridge.view.rowing = 0;
                M.addCash(state, M.income(state) + M.routeIncome(state));
                M.collectCaptains(state, sim, 1);
                bridge.render();
                const goal = (document.querySelector('#goal') || {}).textContent || '';
                const names = /Need /.test(goal) || /Choose /.test(goal) || /^Pick bell/.test(goal) || /Ask Capt/.test(goal) || /^Row /.test(goal) || /^Sign /.test(goal) || /^Raise the /.test(goal) || /^Light the /.test(goal) || /^Pack /.test(goal) || /^Set sail/.test(goal) || /^Do the harbour work/.test(goal) || /^Run the errand/.test(goal) || /^Buy /.test(goal) || /^Tie up /.test(goal);
                if (!names) return { ended: false, ending: state.played, maxGap: stuck, goal: goal, fail: 'goal' };
                const clicked = bridge.followGoal();
                if (clicked) { actions.push(state.played); stuck = 0; }
                else {
                  stuck += 1;
                  const cap = state.played >= 240 && state.played <= 7200 ? 40 : 60;
                  if (stuck > cap) return { ended: false, ending: state.played, maxGap: stuck, goal: goal, fail: 'stuck' };
                }
              }
              if (actions[actions.length - 1] !== state.played) actions.push(state.played);
              const pts = actions.slice().sort(function (a, b) { return a - b; });
              const end = Math.min(7200, state.played);
              let gap = 0;
              for (let i = 1; i < pts.length; i++) {
                const left = Math.max(pts[i - 1], 240);
                const right = Math.min(pts[i], end);
                if (right > left && right - left > gap) gap = right - left;
              }
              return { ended: !!state.ended, ending: state.played, maxGap: state.played > 240 ? gap : 0 };
            });
          });
        }).then(function (result) {
          return browser.close().then(function () { return result; });
        });
      }).then(function (result) {
        server.close();
        resolve(result);
      }).catch(function (err) {
        server.close();
        reject(err);
      });
    });
  });
}
