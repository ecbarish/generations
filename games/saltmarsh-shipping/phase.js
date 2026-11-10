/* Phase and unlock layer for the Saltmarsh Shipping Office.
   shared/idle-core.js has no phase system, so this stays in the game folder.
   Trade routes open once ten schooners are tied up. */
(function () {
  'use strict';

  var ROUTES_OPEN = true;

  function read(state) {
    var M = window.Saltmarsh;
    var boats = state && state.boats;
    var owned = function (i) { return boats && boats[i] ? boats[i].owned : 0; };
    var routesReady = owned(2) >= M.UNLOCK_AT;
    var hauled = false;
    if (state && state.captains) {
      for (var i = 0; i < state.captains.length; i++) {
        if (state.captains[i] && state.captains[i].hauls > 0) hauled = true;
      }
    }
    var sailing = M.routesSailing ? M.routesSailing(state) : 0;
    return {
      hand: true,
      boats: state.trips >= M.HAND_TRIPS,
      captain: owned(0) >= M.WREN_AT,
      sheds: owned(1) >= 1 || (state.warehouses || 1) > 1,
      log: hauled || !!(state && state.fleetSeen),
      fleet: owned(1) >= M.UNLOCK_AT,
      routesReady: routesReady,
      routesOpen: ROUTES_OPEN && routesReady && !state.ended,
      lighthousesOpen: ROUTES_OPEN && routesReady && !state.ended,
      ending: !!(state && state.ended)
    };
  }

  function routesOpen() { return ROUTES_OPEN; }

  function more(n, singular, plural) {
    if (n === 1) return 'one more ' + singular;
    return n + ' more ' + plural;
  }

  function choiceGoal(state) {
    var M = window.Saltmarsh;
    var desk = M.deskChoice(state);
    if (!desk) return '';
    var cost = desk.cards && desk.cards[0] ? desk.cards[0].cost : 0;
    if (desk.id === 'pilot') {
      var line = 'Pick bell or coal on the desk.';
      return cost > 0 && state.cash < cost ? withNeed(state, line, cost) : line;
    }
    if (desk.id === 'squall' || desk.id === 'request' || desk.id === 'windfall') {
      return cost > 0 && state.cash < cost ? withNeed(state, desk.goal, cost) : desk.goal;
    }
    return desk.goal;
  }

  /* When the next contract is more than about a minute away, name a boat instead. */
  function routeOrBoat(state, sentence) {
    var M = window.Saltmarsh;
    if (!M.routeWait || !M.routeWait(state) || !M.boatStep) return sentence;
    var step = M.boatStep(state);
    if (!step) return sentence;
    var name = M.BOATS[step.tier].name.toLowerCase();
    var count = step.left === 1 ? 'one more ' + name : step.left + ' more ' + name + 's';
    return 'Buy ' + count + '. The next route is dear, and this boat pays for itself sooner.';
  }

  function withNeed(state, sentence, cost) {
    var M = window.Saltmarsh;
    var need = M.needMore(state, cost);
    var base = sentence.replace(/\.$/, '');
    if (!need) return base + '.';
    var rate = M.officeRate(state);
    var sec = rate > 0 ? Math.ceil((cost - state.cash) / rate) : 0;
    if (sec > 0) return base + '. ' + need + ', ' + sec + 's.';
    return base + '. ' + need + ' more.';
  }

  /* Pending Light beats a new Raise. Otherwise the desk rotates through
     different kinds of work so the late watch is not one repeated button. */
  function nextAct(state) {
    var M = window.Saltmarsh;
    if (!state || state.ended || !M.routesUnlocked(state)) return null;
    if (M.finaleOffer && M.finaleOffer(state)) {
      return { kind: 'finale', id: 'finale', selector: '#finale', sentence: 'Set sail.', cost: 0, rank: 0 };
    }
    var routes = M.routeOffers(state, true);
    var lights = M.lightOffers(state, true) || [];
    var route = null;
    var pending = null;
    var raised = null;
    var i;
    for (i = 0; i < routes.length; i++) if (!route || routes[i].cost < route.cost) route = routes[i];
    for (i = 0; i < lights.length; i++) {
      if (lights[i].blocked) continue;
      if (lights[i].stage === 1) {
        if (!pending || lights[i].cost < pending.cost) pending = lights[i];
      } else if (!raised || lights[i].cost < raised.cost) raised = lights[i];
    }
    if (pending) {
      return {
        kind: 'light', id: pending.id, rank: 0,
        selector: '#light-cards [data-light="' + pending.id + '"]',
        sentence: withNeed(state, 'Light the ' + pending.name + ', ' + M.coins(pending.cost), pending.cost),
        cost: pending.cost
      };
    }
    if (M.voyageOpen && M.voyageOpen(state) && M.nextPreparation) {
      var packing = M.nextPreparation(state);
      if (packing && state.cash >= packing.cost) {
        var readyLine = packing.choice
          ? 'Choose ' + packing.choice[0].name.toLowerCase() + ', or ' + packing.choice[1].name.toLowerCase() + ', ' + M.coins(packing.cost)
          : 'Pack ' + packing.name + ', ' + M.coins(packing.cost);
        return {
          kind: 'prep', id: packing.id, which: packing.choice ? packing.choice[0].id : '', rank: 0, cost: packing.cost,
          selector: '#provision',
          sentence: withNeed(state, readyLine, packing.cost)
        };
      }
    }
    function routeAct() {
      if (!route) return null;
      return {
        kind: 'route', id: route.id, rank: 1, cost: route.cost,
        selector: '#route-cards [data-route="' + route.id + '"]',
        sentence: withNeed(state, 'Sign ' + route.name + ', ' + M.coins(route.cost), route.cost)
      };
    }
    function lightAct() {
      if (!raised) return null;
      return {
        kind: 'light', id: raised.id, rank: 0, cost: raised.cost,
        selector: '#light-cards [data-light="' + raised.id + '"]',
        sentence: withNeed(state, 'Raise the ' + raised.name + ', ' + M.coins(raised.cost), raised.cost)
      };
    }
    function boatAct() {
      var chunk = M.boatChunk ? M.boatChunk(state) : null;
      if (!chunk) return null;
      var noun = chunk.count === 1 ? chunk.name.toLowerCase() : chunk.name.toLowerCase() + 's';
      return {
        kind: 'boat', id: 'boat', tier: chunk.tier, count: chunk.count, rank: 2, cost: chunk.cost,
        selector: '#boats [data-i="' + chunk.tier + '"]',
        sentence: withNeed(state, 'Buy ' + chunk.count + ' ' + noun + ', ' + M.coins(chunk.cost), chunk.cost)
      };
    }
    function workAct() {
      var work = M.workOffer ? M.workOffer(state) : null;
      if (!work) return null;
      return {
        kind: 'work', id: 'work', rank: 3, cost: work.cost,
        selector: '#harbour-work',
        sentence: withNeed(state, 'Do the harbour work: ' + work.name + ', ' + M.coins(work.cost), work.cost)
      };
    }
    function errandAct() {
      var errand = M.errandOffer ? M.errandOffer(state) : null;
      if (!errand) return null;
      return {
        kind: 'errand', id: 'errand', rank: 5, cost: errand.cost,
        selector: '#errand',
        sentence: withNeed(state, 'Run the errand: ' + errand.name + ', ' + M.coins(errand.cost), errand.cost)
      };
    }
    function prepAct() {
      var prep = M.nextPreparation ? M.nextPreparation(state) : null;
      if (!prep) return null;
      var sentence;
      if (prep.choice) sentence = 'Choose ' + prep.choice[0].name.toLowerCase() + ', or ' + prep.choice[1].name.toLowerCase() + ', ' + M.coins(prep.cost);
      else sentence = 'Pack ' + prep.name + ', ' + M.coins(prep.cost);
      return {
        kind: 'prep', id: prep.id, which: prep.choice ? prep.choice[0].id : '', rank: 4, cost: prep.cost,
        selector: '#provision',
        sentence: withNeed(state, sentence, prep.cost)
      };
    }
    var rate = Math.max(1, M.officeRate(state));
    var raisedNow = lightAct();
    var sideWork = workAct();
    var sideErrand = errandAct();
    if (raisedNow && (!sideWork || raisedNow.cost <= sideWork.cost) && (!sideErrand || raisedNow.cost <= sideErrand.cost)) {
      return raisedNow;
    }
    var made = { route: routeAct, boat: boatAct, work: workAct, errand: errandAct, prep: prepAct, light: lightAct };
    var order = ['light', 'route', 'boat', 'work', 'errand', 'prep'];
    var limit = rate * 38;
    var cursor = state.goalCursor || 0;
    var step, opt;
    for (step = 0; step < order.length; step++) {
      opt = made[order[(cursor + step) % order.length]]();
      if (opt && opt.cost <= limit) return opt;
    }
    var rest = [];
    order.concat(['light']).forEach(function (kind) {
      var row = made[kind]();
      if (row) rest.push(row);
    });
    if (!rest.length) return null;
    rest.sort(function (a, b) { return a.cost - b.cost; });
    return rest[0];
  }

  /* One boat whose pay shows up on the rate line. A token sloop does not count. */
  function incomeBoat(state) {
    var M = window.Saltmarsh;
    if (!state || !M.voyageOpen || !M.voyageOpen(state)) return null;
    var rate = Math.max(1, M.officeRate(state));
    var tier;
    for (tier = M.BOATS.length - 1; tier >= 0; tier--) {
      if (!M.unlocked(state, tier)) continue;
      var one = M.quote(state, tier, 1);
      if (!(one.count > 0)) continue;
      var add = M.marginalRate(state, tier);
      if (!(add >= 100)) continue;
      if (one.cost > rate * 90) continue;
      return { tier: tier, cost: one.cost, add: add, name: M.BOATS[tier].name };
    }
    return null;
  }

  /* Lights, routes, the open choice, the next pack, and a boat that changes the rate.
     The goal bar and the session check both read this list. */
  function progressSteps(state) {
    var M = window.Saltmarsh;
    var out = [];
    if (!state || state.ended || !M.routesUnlocked(state) || M.routesSailing(state) < 1) return out;
    (M.lightOffers(state, false) || []).forEach(function (row) {
      if (row.blocked) return;
      var verb = row.stage === 0 ? 'Raise' : 'Light';
      out.push({
        kind: 'light', id: row.id, cost: row.cost, affordable: state.cash >= row.cost,
        selector: '#light-cards [data-light="' + row.id + '"]',
        sentence: withNeed(state, verb + ' the ' + row.name + ', ' + M.coins(row.cost), row.cost)
      });
    });
    (M.routeOffers(state, false) || []).forEach(function (row) {
      out.push({
        kind: 'route', id: row.id, cost: row.cost, affordable: state.cash >= row.cost,
        selector: '#route-cards [data-route="' + row.id + '"]',
        sentence: withNeed(state, 'Sign ' + row.name + ', ' + M.coins(row.cost), row.cost)
      });
    });
    var desk = M.deskChoice(state);
    if (desk && desk.cards && desk.cards.length) {
      var card = desk.cards.slice().sort(function (a, b) { return a.cost - b.cost; })[0];
      out.push({
        kind: 'choice', id: desk.id, which: card.which, cost: card.cost, affordable: state.cash >= card.cost,
        selector: '#choice',
        sentence: choiceGoal(state)
      });
    }
    if (M.voyageOpen && M.voyageOpen(state) && M.nextPreparation) {
      var prep = M.nextPreparation(state);
      if (prep) {
        var line = prep.choice
          ? 'Choose ' + prep.choice[0].name.toLowerCase() + ', or ' + prep.choice[1].name.toLowerCase() + ', ' + M.coins(prep.cost)
          : 'Pack ' + prep.name + ', ' + M.coins(prep.cost);
        out.push({
          kind: 'prep', id: prep.id, which: prep.choice ? prep.choice[0].id : '', fork: !!prep.choice,
          cost: prep.cost, affordable: state.cash >= prep.cost,
          selector: '#provision',
          sentence: withNeed(state, line, prep.cost)
        });
      }
      var boat = incomeBoat(state);
      if (boat) {
        out.push({
          kind: 'boat', tier: boat.tier, count: 1, cost: boat.cost, affordable: state.cash >= boat.cost,
          selector: '#boats [data-i="' + boat.tier + '"]',
          sentence: 'Buy a ' + boat.name.toLowerCase() + ', ' + M.coins(boat.cost) + '. It adds ' + M.coins(Math.max(1, Math.round(boat.add))) + ' a second.'
        });
      }
    }
    return out;
  }

  /* The cheapest step the purse can pay. Null when every step is still dear. */
  function cheapestAffordable(state) {
    var best = null;
    progressSteps(state).forEach(function (step) {
      if (!step.affordable) return;
      if (!best || step.cost < best.cost) best = step;
    });
    return best;
  }

  /* One sentence, always. The player should be able to read it and know what to do. */
  function goal(state) {
    var M = window.Saltmarsh;
    var phase = read(state);
    var left, i, owned, nextAt, choice, sailing, lit;
    if (state.ended) return 'The last voyage is home. Open a new harbour when you want one.';
    if (!phase.boats) {
      left = M.HAND_TRIPS - state.trips;
      if (left === 1) return 'Row one more cargo yourself. Then a second boat can tie up.';
      return 'Row ' + left + ' cargoes yourself. Then a second boat can tie up.';
    }
    if (state.boats[0].owned < M.WREN_AT) {
      left = M.WREN_AT - state.boats[0].owned;
      return 'Tie up ' + more(left, 'rowboat', 'rowboats') + '. Then Capt. Wren takes the pier.';
    }
    if (M.canHire(state, 0)) return M.askLine(0);
    if (state.boats[0].owned < M.SLOOP_AT) {
      left = M.SLOOP_AT - state.boats[0].owned;
      return 'Tie up ' + more(left, 'rowboat', 'rowboats') + '. Then a sloop can tie up.';
    }
    var desk = M.deskChoice(state);
    choice = choiceGoal(state);
    if (choice && (!phase.routesReady || (desk && (desk.id === 'sloop' || desk.id === 'schooner')))) return choice;
    if (!phase.fleet) {
      left = M.UNLOCK_AT - state.boats[1].owned;
      if (left > 0) return withNeed(state, 'Buy ' + more(left, 'sloop', 'sloops') + '. At ten, the fleet chart unrolls', M.quote(state, 1, left).cost);
    }
    if (M.canHire(state, 1)) return M.askLine(1);
    if (!phase.routesReady) {
      left = M.UNLOCK_AT - state.boats[2].owned;
      return withNeed(state, 'Buy ' + more(left, 'schooner', 'schooners') + '. Ten open the trade routes on the next tide', M.quote(state, 2, left).cost);
    }
    if (M.canHire(state, 2)) return M.askLine(2);
    sailing = M.routesSailing(state);
    if (sailing < 1) return routeOrBoat(state, 'Choose a route on the desk. Each one is a different run.');
    if (sailing >= 1) {
      var cheap = cheapestAffordable(state);
      if (cheap) return cheap.sentence;
      var pendingLight = null;
      var lightRows = M.lightOffers(state, true) || [];
      for (i = 0; i < lightRows.length; i++) {
        if (lightRows[i].blocked || lightRows[i].stage !== 1) continue;
        if (!pendingLight || lightRows[i].cost < pendingLight.cost) pendingLight = lightRows[i];
      }
      if (pendingLight) return withNeed(state, 'Light the ' + pendingLight.name + ', ' + M.coins(pendingLight.cost), pendingLight.cost);
    }
    if (choice) return choice;
    if (state.boats[3].owned < M.UNLOCK_AT) {
      left = M.UNLOCK_AT - state.boats[3].owned;
      return withNeed(state, 'Buy ' + left + ' barks', M.quote(state, 3, left).cost);
    }
    if (M.canHire(state, 3)) return M.askLine(3);
    if (state.boats[3].owned < M.BARK_QUAY) {
      left = M.BARK_QUAY - state.boats[3].owned;
      return withNeed(state, 'Buy ' + left + ' barks', M.quote(state, 3, left).cost);
    }
    if (state.boats[3].owned < M.BARK_LAMP) {
      left = M.BARK_LAMP - state.boats[3].owned;
      return withNeed(state, 'Buy ' + left + ' barks', M.quote(state, 3, left).cost);
    }
    var act = nextAct(state);
    if (act) return act.sentence;
    if (M.finaleOffer(state, false)) return 'Send the last voyage.';
    for (i = M.BOATS.length - 1; i >= 0; i--) {
      owned = state.boats[i].owned;
      if (owned < M.UNLOCK_AT || owned >= 100) continue;
      nextAt = owned < 25 ? 25 : owned < 50 ? 50 : 100;
      left = nextAt - owned;
      var change = nextAt === 25 ? 'each one earns twice as much' : nextAt === 50 ? 'each one earns four times as much' : 'a crane rises over them';
      var boatCost = M.quote(state, i, left).cost;
      return withNeed(state, 'Buy ' + more(left, M.BOATS[i].name.toLowerCase(), M.BOATS[i].name.toLowerCase() + 's') + ', and ' + change, boatCost);
    }
    if (state.warehouses < M.MAX_WAREHOUSES) return 'Raise another shed if you want the office to keep more while the game is closed.';
    return 'The coast is ready for its lights.';
  }

  /* How many of one boat the sentence on the bar is asking for. Null when the next step is not a boat. */
  function boatNeed(state) {
    var M = window.Saltmarsh;
    var phase = read(state);
    if (!state || state.ended || !phase.boats) return null;
    if (M.deskChoice(state)) return null;
    if (state.boats[0].owned < M.WREN_AT) return { tier: 0, at: M.WREN_AT };
    if (M.canHire(state, 0)) return null;
    if (state.boats[0].owned < M.SLOOP_AT) return { tier: 0, at: M.SLOOP_AT };
    if (!phase.fleet) return { tier: 1, at: M.UNLOCK_AT };
    if (M.canHire(state, 1)) return null;
    if (!phase.routesReady) return { tier: 2, at: M.UNLOCK_AT };
    if (M.canHire(state, 2)) return null;
    var sailing = M.routesSailing(state);
    if (sailing < 1) return null;
    if (state.boats[3].owned < M.UNLOCK_AT) return { tier: 3, at: M.UNLOCK_AT };
    if (M.canHire(state, 3)) return null;
    if (state.boats[3].owned < M.BARK_QUAY) return { tier: 3, at: M.BARK_QUAY };
    if (state.boats[3].owned < M.BARK_LAMP) return { tier: 3, at: M.BARK_LAMP };
    if (!M.allLightsLit(state)) return null;
    var i, owned, nextAt;
    for (i = M.BOATS.length - 1; i >= 0; i--) {
      owned = state.boats[i].owned;
      if (owned < M.UNLOCK_AT || owned >= 100) continue;
      nextAt = owned < 25 ? 25 : owned < 50 ? 50 : 100;
      if (owned < nextAt) return { tier: i, at: nextAt };
    }
    return null;
  }

  /* Shown from the fleet onward, beside the one next step. */
  function aim(state) {
    var M = window.Saltmarsh;
    if (!state || state.trips < M.HAND_TRIPS || state.boats[1].owned < M.UNLOCK_AT) return '';
    if (state.ended) return '';
    var lit = M.lightsLit(state);
    if (M.finaleOffer && M.finaleOffer(state)) return 'The list is complete. Set sail.';
    if (lit >= 4) return 'The lighthouses are burning. Pack the voyage list, then set sail.';
    if (lit === 1) return 'Four lighthouses along the coast, then the last voyage home. One is burning.';
    if (lit > 1) return 'Four lighthouses along the coast, then the last voyage home. ' + ['', '', 'Two', 'Three'][lit] + ' are burning.';
    return 'Four lighthouses along the coast, then the last voyage home.';
  }

  function boatTarget(state) {
    var M = window.Saltmarsh;
    if (!M.routeWait(state)) return '';
    var step = M.boatStep(state);
    return step ? '#boats [data-i="' + step.tier + '"]' : '';
  }

  /* The element the goal sentence is talking about. */
  function target(state) {
    var M = window.Saltmarsh;
    var phase = read(state);
    var step;
    if (!state || state.ended) return '#new-harbour';
    if (!phase.boats) return '#row';
    if (state.boats[0].owned < M.WREN_AT) return '#boats [data-i="0"]';
    if (M.canHire(state, 0)) return '#ask';
    if (state.boats[0].owned < M.SLOOP_AT) return '#boats [data-i="0"]';
    var earlyDesk = M.deskChoice(state);
    if (earlyDesk && (earlyDesk.id === 'sloop' || earlyDesk.id === 'schooner' || !phase.routesReady)) return '#choice';
    if (!phase.fleet) return '#boats [data-i="1"]';
    if (M.canHire(state, 1)) return '#ask';
    if (!phase.routesReady) return '#boats [data-i="2"]';
    if (M.canHire(state, 2)) return '#ask';
    var sailing = M.routesSailing(state);
    var sentence = goal(state);
    if (/^Choose a route/.test(sentence)) return '#route-cards [data-act="route"], #routes';
    var aimed = cheapestAffordable(state);
    if (aimed && aimed.sentence === sentence && aimed.selector) return aimed.selector;
    if (/^(Raise|Light) the /.test(sentence)) return '#lights';
    if (/^Sign /.test(sentence)) return '#routes';
    if (/^Pack |^Choose /.test(sentence) && M.voyageOpen(state)) return '#provision';
    if (/^Choose |^Pick bell/.test(sentence)) return '#choice';
    if (sailing < 1) return boatTarget(state) || '#routes';
    if (state.boats[3].owned < M.UNLOCK_AT) return '#boats [data-i="3"]';
    if (M.canHire(state, 3)) return '#ask';
    if (state.boats[3].owned < M.BARK_QUAY) return '#boats [data-i="3"]';
    if (state.boats[3].owned < M.BARK_LAMP) return '#boats [data-i="3"]';
    var act = nextAct(state);
    if (act) return act.selector;
    if (M.finaleOffer(state, false)) return '#finale';
    var i, owned, nextAt;
    for (i = M.BOATS.length - 1; i >= 0; i--) {
      owned = state.boats[i].owned;
      if (owned < M.UNLOCK_AT || owned >= 100) continue;
      nextAt = owned < 25 ? 25 : owned < 50 ? 50 : 100;
      if (owned < nextAt) return '#boats [data-i="' + i + '"]';
    }
    if (state.warehouses < M.MAX_WAREHOUSES) return '#sheds';
    return '#boats';
  }

  function name(state) {
    var phase = read(state);
    if (phase.ending) return 'ending';
    if (phase.lighthousesOpen) return 'lights';
    if (phase.routesOpen) return 'routes';
    if (phase.fleet) return 'fleet';
    if (phase.captain) return 'captain';
    if (phase.boats) return 'boats';
    return 'dock';
  }

  window.SaltmarshPhase = { read: read, goal: goal, aim: aim, name: name, target: target, boatNeed: boatNeed, routesOpen: routesOpen, nextAct: nextAct, progressSteps: progressSteps, cheapestAffordable: cheapestAffordable };
})();
