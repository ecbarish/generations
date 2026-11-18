/* Which picture a counted row uses at 0, 25, 50 and 100.
   Night Market's stall line and lane strip, and the Saltmarsh Shipping Office's
   mooring line, all used this same step. This file never reads or writes storage. */
(function () {
  'use strict';
  function lookIndex(owned) {
    if (owned >= 100) return 3;
    if (owned >= 50) return 2;
    if (owned >= 25) return 1;
    return 0;
  }
  window.LookIndex = lookIndex;
})();
