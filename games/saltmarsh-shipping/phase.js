/* Phase and unlock layer for the Saltmarsh Shipping Office.
   shared/idle-core.js has no phase system, so this stays in the game folder.
   ROUTES_OPEN is the stub PR 2 flips when ten schooners may actually sail. */
(function () {
  'use strict';

  var ROUTES_OPEN = false;

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
    return {
      hand: true,
      boats: state.trips >= M.HAND_TRIPS,
      captain: owned(0) >= M.WREN_AT,
      sheds: owned(1) >= 1 || (state.warehouses || 1) > 1,
      log: hauled || !!(state && state.fleetSeen),
      fleet: owned(1) >= M.UNLOCK_AT,
      routesReady: routesReady,
      routesOpen: ROUTES_OPEN && routesReady,
      lighthousesOpen: false,
      ending: false
    };
  }

  function routesOpen() { return ROUTES_OPEN; }

  function more(n, singular, plural) {
    if (n === 1) return 'one more ' + singular;
    return n + ' more ' + plural;
  }

  /* A fitting and the next shed, once the player can pay for one of them. */
  function choiceLine(state) {
    var M = window.Saltmarsh;
    var offers = M.fittingOffers(state);
    if (!offers.length) return '';
    var price = M.warehousePrice(state);
    if (price == null) return '';
    var fit = offers[0];
    if (!(state.cash >= fit.cost) && !(state.cash >= price)) return '';
    if (fit.id === 'sloop-hull') return 'Choose a lighter sloop hull, or another shed.';
    if (fit.id === 'schooner-hold') return 'Choose a deeper schooner hold, or another shed.';
    return 'Choose ' + fit.name.toLowerCase() + ', or another shed.';
  }

  /* One sentence, always. The player should be able to read it and know what to do. */
  function goal(state) {
    var M = window.Saltmarsh;
    var phase = read(state);
    var left, i, owned, nextAt, choice;
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
    if (!phase.fleet) {
      choice = choiceLine(state);
      if (choice) return choice;
      left = M.UNLOCK_AT - state.boats[1].owned;
      if (left > 0) return 'Buy ' + more(left, 'sloop', 'sloops') + '. At ten, the fleet chart unrolls.';
    }
    if (M.canHire(state, 1)) return M.askLine(1);
    if (!phase.routesReady) {
      choice = choiceLine(state);
      if (choice) return choice;
      left = M.UNLOCK_AT - state.boats[2].owned;
      return 'Buy ' + more(left, 'schooner', 'schooners') + '. Ten schooners mark the trade routes, and the next tide is when they sail.';
    }
    if (M.canHire(state, 2)) return M.askLine(2);
    if (state.boats[3].owned < M.UNLOCK_AT) {
      choice = choiceLine(state);
      if (choice) return choice;
      left = M.UNLOCK_AT - state.boats[3].owned;
      return 'Buy ' + more(left, 'bark', 'barks') + '. The deep-water boats carry the long cargoes.';
    }
    if (M.canHire(state, 3)) return M.askLine(3);
    choice = choiceLine(state);
    if (choice) return choice;
    for (i = M.BOATS.length - 1; i >= 0; i--) {
      owned = state.boats[i].owned;
      if (owned < M.UNLOCK_AT || owned >= 100) continue;
      nextAt = owned < 25 ? 25 : owned < 50 ? 50 : 100;
      left = nextAt - owned;
      return 'Buy ' + more(left, M.BOATS[i].name.toLowerCase(), M.BOATS[i].name.toLowerCase() + 's') + ', and the dock changes.';
    }
    if (state.warehouses < M.MAX_WAREHOUSES) return 'Raise another shed if you want the office to keep more while the game is closed.';
    if (!phase.routesOpen) return 'The routes are marked along the coast. They sail on the next tide, with the lights after them.';
    return 'The coast is ready for its lights.';
  }

  function name(state) {
    var phase = read(state);
    if (phase.fleet) return 'fleet';
    if (phase.captain) return 'captain';
    if (phase.boats) return 'boats';
    return 'dock';
  }

  window.SaltmarshPhase = { read: read, goal: goal, name: name, routesOpen: routesOpen };
})();
