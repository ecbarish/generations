/* Short payback labels for the office games.
   Load shared/engine.js first. This file never reads or writes storage.
   Night Market and the Saltmarsh Shipping Office used the same wording:
   no label when the time is missing, whole seconds under a minute (at least 1s),
   and Arcade.fmtTime from a minute up. 59.5 seconds stays "60s". */
(function () {
  'use strict';
  function paybackLabel(seconds) {
    if (!(seconds > 0) || !isFinite(seconds)) return '';
    if (seconds >= 60) return Arcade.fmtTime(Math.round(seconds));
    return Math.max(1, Math.round(seconds)) + 's';
  }
  window.PaybackLabel = paybackLabel;
})();
