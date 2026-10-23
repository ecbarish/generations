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
    return {
      hand: true,
      boats: state.trips >= M.HAND_TRIPS,
      captain: owned(0) >= M.UNLOCK_AT,
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

  /* One sentence, always. The player should be able to read it and know what to do. */
  function goal(state) {
    var M = window.Saltmarsh;
    var phase = read(state);
    var left, i, owned, nextAt;
    if (!phase.boats) {
      left = M.HAND_TRIPS - state.trips;
      if (left === 1) return 'Row one more cargo yourself. Then a second boat can tie up.';
      return 'Row ' + left + ' cargoes yourself. Then a second boat can tie up.';
    }
    if (!phase.captain) {
      left = M.UNLOCK_AT - state.boats[0].owned;
      return 'Tie up ' + more(left, 'rowboat', 'rowboats') + '. Then Capt. Wren takes the pier and the harbour log opens.';
    }
    if (M.canHire(state, 0)) return 'Ask Capt. Wren to take the pier.';
    if (!phase.fleet) {
      left = M.UNLOCK_AT - state.boats[1].owned;
      return 'Buy ' + more(left, 'sloop', 'sloops') + '. At ten, the fleet chart unrolls.';
    }
    if (M.canHire(state, 1)) return 'Ask Capt. Bramble to take a sloop.';
    if (!phase.routesReady) {
      left = M.UNLOCK_AT - state.boats[2].owned;
      return 'Buy ' + more(left, 'schooner', 'schooners') + '. Ten schooners mark the trade routes. Those routes stay furled for now.';
    }
    if (M.canHire(state, 2)) return 'Ask Capt. Hollis to take a schooner.';
    if (state.boats[3].owned < M.UNLOCK_AT) {
      left = M.UNLOCK_AT - state.boats[3].owned;
      return 'Buy ' + more(left, 'bark', 'barks') + '. The deep-water boats carry the long cargoes.';
    }
    if (M.canHire(state, 3)) return 'Ask Capt. Pell to take a bark.';
    for (i = M.BOATS.length - 1; i >= 0; i--) {
      owned = state.boats[i].owned;
      if (owned < M.UNLOCK_AT || owned >= 100) continue;
      nextAt = owned < 25 ? 25 : owned < 50 ? 50 : 100;
      left = nextAt - owned;
      return 'Buy ' + more(left, M.BOATS[i].name.toLowerCase(), M.BOATS[i].name.toLowerCase() + 's') + ', and the dock changes.';
    }
    if (state.warehouses < M.MAX_WAREHOUSES) return 'Raise another shed if you want the office to keep more while you are away.';
    if (!phase.routesOpen) return 'The trade routes are marked on the chart. They open on the next tide, and then the lights along the coast.';
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
