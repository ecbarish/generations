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
    if (sailing < 1) return 'Choose a route on the desk. Each one is a different run.';
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
      return 'Buy ' + more(left, 'bark', 'barks') + '. Then the bar lamp is lit.';
    }
    if (sailing < 5) return 'Choose the next route. Five different routes wake the lighthouses.';
    if ((state.voyages || 0) < 18) return 'Sign the next route. The last voyage waits until the chart is full.';
    if (!M.allLightsLit(state)) {
      lit = M.lightsLit(state);
      if (lit <= 0) return 'Raise a lighthouse. Each one changes the routes.';
      if (lit === 1) return 'One lighthouse is burning. Raise the next.';
      if (lit === 2) return 'Two lighthouses are burning. Raise the next.';
      return 'Three lighthouses are burning. Raise the next.';
    }
    if (M.finaleOffer(state, false)) return 'Send the last voyage.';
    for (i = M.BOATS.length - 1; i >= 0; i--) {
      owned = state.boats[i].owned;
      if (owned < M.UNLOCK_AT || owned >= 100) continue;
      nextAt = owned < 25 ? 25 : owned < 50 ? 50 : 100;
      left = nextAt - owned;
      var change = nextAt === 25 ? 'each one earns twice as much' : nextAt === 50 ? 'each one earns four times as much' : 'a crane rises over them';
      return 'Buy ' + more(left, M.BOATS[i].name.toLowerCase(), M.BOATS[i].name.toLowerCase() + 's') + ', and ' + change + '.';
    }
    if (state.warehouses < M.MAX_WAREHOUSES) return 'Raise another shed if you want the office to keep more while the game is closed.';
    return 'The coast is ready for its lights.';
  }

  /* Shown from the fleet onward, beside the one next step. */
  function aim(state) {
    var M = window.Saltmarsh;
    if (!state || state.trips < M.HAND_TRIPS || state.boats[1].owned < M.UNLOCK_AT) return '';
    if (state.ended) return '';
    var lit = M.lightsLit(state);
    if (lit >= 4) return 'The lamps are burning. The last voyage is the end of the office.';
    if (lit === 1) return 'Four lamps along the coast, then the last voyage home. One is burning.';
    if (lit > 1) return 'Four lamps along the coast, then the last voyage home. ' + ['', '', 'Two', 'Three'][lit] + ' are burning.';
    return 'Four lamps along the coast, then the last voyage home.';
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

  window.SaltmarshPhase = { read: read, goal: goal, aim: aim, name: name, routesOpen: routesOpen };
})();
