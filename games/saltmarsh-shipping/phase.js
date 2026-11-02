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
      lighthousesOpen: ROUTES_OPEN && routesReady && sailing >= 5 && !state.ended,
      ending: !!(state && state.ended)
    };
  }

  function routesOpen() { return ROUTES_OPEN; }

  function more(n, singular, plural) {
    if (n === 1) return 'one more ' + singular;
    return n + ' more ' + plural;
  }

  function choiceGoal(state) {
    var desk = window.Saltmarsh.deskChoice(state);
    return desk ? desk.goal : '';
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
    var need = window.Saltmarsh.needMore(state, cost);
    var base = sentence.replace(/\.$/, '');
    if (!need) return base + '.';
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
    var lights = M.routesSailing(state) >= 5 ? M.lightOffers(state, true) : [];
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
    var made = { route: routeAct, boat: boatAct, work: workAct, errand: errandAct, prep: prepAct, light: lightAct };
    var order = ['light', 'route', 'boat', 'work', 'errand', 'prep'];
    var rate = Math.max(1, M.officeRate(state));
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
    choice = choiceGoal(state);
    if (choice) return choice;
    if (!phase.fleet) {
      left = M.UNLOCK_AT - state.boats[1].owned;
      if (left > 0) return 'Buy ' + more(left, 'sloop', 'sloops') + '. At ten, the fleet chart unrolls.';
    }
    if (M.canHire(state, 1)) return M.askLine(1);
    if (!phase.routesReady) {
      left = M.UNLOCK_AT - state.boats[2].owned;
      return 'Buy ' + more(left, 'schooner', 'schooners') + '. Ten open the trade routes on the next tide.';
    }
    if (M.canHire(state, 2)) return M.askLine(2);
    sailing = M.routesSailing(state);
    if (sailing < 1) return routeOrBoat(state, 'Choose a route on the desk. Each one is a different run.');
    if (state.boats[3].owned < M.UNLOCK_AT) {
      left = M.UNLOCK_AT - state.boats[3].owned;
      return 'Buy ' + more(left, 'bark', 'barks') + '. Ten barks, and Capt. Pell can take a deep boat.';
    }
    if (M.canHire(state, 3)) return M.askLine(3);
    if (state.boats[3].owned < M.BARK_QUAY) {
      left = M.BARK_QUAY - state.boats[3].owned;
      return 'Buy ' + more(left, 'bark', 'barks') + '. Then the quay grows longer, and a choice comes with it.';
    }
    if (state.boats[3].owned < M.BARK_LAMP) {
      left = M.BARK_LAMP - state.boats[3].owned;
      return 'Buy ' + more(left, 'bark', 'barks') + '. Then a house lamp shows in the office window.';
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
    if (lit >= 4 && (state.played || 0) < (M.VOYAGE_AT || 2400)) {
      var leftMin = Math.max(1, Math.ceil(((M.VOYAGE_AT || 2400) - (state.played || 0)) / 60));
      return 'The lighthouses are burning. The voyage list opens in ' + leftMin + ' minutes.';
    }
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
    if (M.deskChoice(state)) return '#choice';
    if (!phase.fleet) return '#boats [data-i="1"]';
    if (M.canHire(state, 1)) return '#ask';
    if (!phase.routesReady) return '#boats [data-i="2"]';
    if (M.canHire(state, 2)) return '#ask';
    var sailing = M.routesSailing(state);
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

  window.SaltmarshPhase = { read: read, goal: goal, aim: aim, name: name, target: target, boatNeed: boatNeed, routesOpen: routesOpen, nextAct: nextAct };
})();
