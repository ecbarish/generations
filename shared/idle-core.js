/* Generations shared idle core.
   Load shared/engine.js first. This file never reads or writes storage: the game
   saves idle.lastSeen() itself through Arcade.save / Arcade.load.

   var idle = Idle.create({
     getRate: function () { return state.perSecond; },
     apply: function (amount) { state.cash += amount; },
     maxOfflineSec: 8 * 3600,
     offlineRate: 1,
     title: { label: 'Night Market', unit: '$' }
   });
   var away = idle.start(savedLastSeen); // {away, credited, gained, capped}, or null if away < 60s
   // The game draws its own "While you were away" panel from that summary.
   // While running, the tab title is '+' + unit + Arcade.fmt(rate) + '/s · ' + label
   // (for a rate of 1200: '+$1.20K/s · Night Market'), refreshed once a second.
   idle.stop(); // puts the previous tab title back
   Arcade.save(key, { cash: state.cash, seen: idle.lastSeen() });
   Idle.bulkCost(base, growth, owned, 10);
   Idle.maxAffordable(base, growth, owned, state.cash);
*/
(function () {
  'use strict';

  var DEFAULT_CAP = 8 * 3600;
  var AWAY_MIN = 60;
  var HIDDEN_GAP = 5;

  function bulkCost(base, growth, owned, n) {
    n = Math.floor(n);
    if (!(n > 0) || !(base > 0) || !isFinite(base)) return 0;
    if (!isFinite(owned) || owned < 0) owned = 0;
    else owned = Math.floor(owned);
    if (!isFinite(growth) || !(growth > 0)) return 0;
    if (growth === 1) return base * n;
    var first = base * Math.pow(growth, owned);
    var span = Math.pow(growth, n);
    if (!isFinite(first) || !isFinite(span)) return Infinity;
    var sum = first * (span - 1) / (growth - 1);
    return isFinite(sum) ? sum : Infinity;
  }

  /* Largest n whose closed-form ladder price fits in cash. The log step is the
     answer; a few boundary nudges only correct floating-point rounding. */
  function maxAffordable(base, growth, owned, cash) {
    if (!(cash > 0) || !isFinite(cash)) return 0;
    if (bulkCost(base, growth, owned, 1) > cash) return 0;
    if (!isFinite(owned) || owned < 0) owned = 0;
    else owned = Math.floor(owned);
    var first = base * Math.pow(growth, owned);
    var n;
    if (growth === 1) n = Math.floor(cash / first);
    else {
      var inner = 1 + cash * (growth - 1) / first;
      if (!(inner > 1) || !isFinite(inner)) return 1;
      n = Math.floor(Math.log(inner) / Math.log(growth) + 1e-9);
    }
    if (!isFinite(n) || n < 1) n = 1;
    if (growth > 1) {
      var finite = Math.floor(Math.log(Number.MAX_VALUE) / Math.log(growth)) - 1;
      if (n > finite) n = finite;
    }
    var guard = 0;
    while (n > 0 && bulkCost(base, growth, owned, n) > cash && guard++ < 6) n--;
    guard = 0;
    while (guard++ < 6 && bulkCost(base, growth, owned, n + 1) <= cash) n++;
    return n > 0 ? n : 0;
  }

  function create(opts) {
    opts = opts || {};
    var getRate = typeof opts.getRate === 'function' ? opts.getRate : function () { return 0; };
    var apply = typeof opts.apply === 'function' ? opts.apply : function () {};
    var maxOfflineSec = (typeof opts.maxOfflineSec === 'number' && isFinite(opts.maxOfflineSec) && opts.maxOfflineSec >= 0) ? opts.maxOfflineSec : DEFAULT_CAP;
    var offlineRate = (typeof opts.offlineRate === 'number' && isFinite(opts.offlineRate) && opts.offlineRate >= 0) ? opts.offlineRate : 1;
    if (offlineRate > 1) offlineRate = 1; // away time never pays more than active play
    var titleOpts = opts.title || null;
    var running = false;
    var rafId = 0;
    var lastWall = 0;
    var lastPerf = 0;
    var lastTitleAt = -Infinity;
    var savedTitle = null;
    var summary = null;

    function rateNow() {
      var rate = +getRate();
      return isFinite(rate) && rate > 0 ? rate : 0;
    }
    function perfNow() {
      return (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
    }
    function tabHidden() {
      return typeof document !== 'undefined' && document.hidden === true;
    }
    function addOffline(awaySec) {
      var capped = awaySec > maxOfflineSec;
      var credited = awaySec > 0 ? (capped ? maxOfflineSec : awaySec) : 0;
      var gained = credited > 0 ? rateNow() * credited * offlineRate : 0;
      if (gained) apply(gained);
      if (!summary) summary = { away: 0, credited: 0, gained: 0, capped: false };
      if (awaySec > 0) summary.away += awaySec;
      summary.credited += credited;
      summary.gained += gained;
      if (capped) summary.capped = true;
      return summary;
    }
    function writeTitle(now) {
      if (!titleOpts || typeof document === 'undefined') return;
      var fmt = window.Arcade && typeof Arcade.fmt === 'function' ? Arcade.fmt : null;
      if (!fmt) return;
      if (savedTitle === null) savedTitle = document.title;
      var unit = titleOpts.unit || '';
      var label = titleOpts.label || '';
      document.title = '+' + unit + fmt(rateNow()) + '/s · ' + label;
      lastTitleAt = now;
    }
    function schedule() {
      if (!running || typeof requestAnimationFrame !== 'function') return;
      rafId = requestAnimationFrame(onFrame);
    }
    function onFrame() {
      if (!running) return;
      var wall = Date.now();
      var perf = perfNow();
      var wallDt = (wall - lastWall) / 1000;
      var perfDt = (perf - lastPerf) / 1000;
      lastWall = wall;
      lastPerf = perf;
      if (!(wallDt > 0)) {
        /* A clock that moves backward credits nothing. */
      } else if (wallDt > maxOfflineSec || (tabHidden() && wallDt > HIDDEN_GAP)) {
        addOffline(wallDt);
      } else {
        var dt = perfDt > 0 ? Math.min(perfDt, wallDt) : wallDt;
        var gained = rateNow() * dt;
        if (gained) apply(gained);
      }
      if (running && wall - lastTitleAt >= 1000) writeTitle(wall);
      if (running) schedule();
    }
    function start(lastSeen) {
      running = false;
      if (rafId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId);
      rafId = 0;
      summary = null;
      running = true;
      var now = Date.now();
      lastWall = now;
      lastPerf = perfNow();
      var result = null;
      if (typeof lastSeen === 'number' && isFinite(lastSeen)) {
        var away = (now - lastSeen) / 1000;
        if (away >= AWAY_MIN) result = addOffline(away);
      }
      writeTitle(now);
      schedule();
      return result;
    }
    function stop() {
      running = false;
      if (rafId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId);
      rafId = 0;
      if (savedTitle !== null && typeof document !== 'undefined') {
        document.title = savedTitle;
        savedTitle = null;
      }
    }
    function lastSeen() { return Date.now(); }

    return { start: start, stop: stop, lastSeen: lastSeen };
  }

  window.Idle = { create: create, bulkCost: bulkCost, maxAffordable: maxAffordable };
})();
