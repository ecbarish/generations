/* Generations shared idle core.
   Load shared/engine.js first. This file never reads or writes storage.

   Offline means the page was closed. start(lastSeen) is the only offline
   catch-up: min(away, cap) at offlineRate, returned as a summary the game draws.
   While the page is loaded, including a hidden tab, every tick credits the
   Date.now() gap at the online rate, held to maxOfflineSec so one forward clock
   jump cannot pay more than the cap. Gaps inside the cap, including a hidden tab
   woken every minute, credit in full. There is no hidden-tab threshold. A clock
   step backward credits 0.

   Pass save and the core calls it with lastSeen on visibilitychange (when the
   tab hides), on pagehide, and every 30s. The game writes that through engine.js.
   Also save from those same moments if you keep your own listener. Ticks are
   setInterval(tick, 250). Games draw with their own requestAnimationFrame.

   var idle = Idle.create({
     getRate: function () { return state.perSecond; },
     apply: function (amount) { state.cash += amount; },
     maxOfflineSec: 4 * 3600,
     offlineRate: 0.5,
     title: { label: 'Night Market', unit: '$' },
     save: function (seen) { state.seen = seen; Arcade.save(key, state); }
   });
   var away = idle.start(savedLastSeen); // {away, credited, gained, capped}, or null if away < 60s
   // The game draws its own "While you were away" panel from that summary.
   // While running, the tab title is '+' + unit + Arcade.fmt(rate) + '/s · ' + label
   // (for a rate of 1200: '+$1.20K/s · Night Market'), refreshed once a second.
   idle.stop(); // puts the previous tab title back
   Idle.milestoneMult(owned);          // x2 at 25, x4 at 50, x8 at 100
   Idle.bulkCost(base, growth, owned, 10); // growth defaults to Idle.DEFAULT_GROWTH (1.07)
   Idle.maxAffordable(base, growth, owned, state.cash);
*/
(function () {
  'use strict';

  var DEFAULT_CAP = 8 * 3600;
  var DEFAULT_GROWTH = 1.07; // generators may override, usually in 1.05-1.15
  var AWAY_MIN = 60;
  var TICK_MS = 250;
  var SAVE_MS = 30000;
  var MILESTONES = [25, 50, 100];
  var SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  var titleWarned = false;

  /* Title fallback when engine.js fmt is missing. Whole numbers under 1,000, the
     same short scale as fmtI above that. Not a second public formatter. */
  function plainFmtI(x) {
    if (!isFinite(x)) return '∞';
    if (x < 0) return '-' + plainFmtI(-x);
    if (x < 1000) return String(Math.floor(x));
    var e = Math.floor(Math.log10(x) / 3);
    if (e < SUF.length) {
      var m = x / Math.pow(10, e * 3);
      if (m >= 999.5 && e + 1 < SUF.length) { e++; m = x / Math.pow(10, e * 3); }
      return m.toFixed(m < 10 ? 2 : m < 100 ? 1 : 0) + SUF[e];
    }
    var ex = Math.floor(Math.log10(x));
    return (x / Math.pow(10, ex)).toFixed(2) + 'e' + ex;
  }
  function titleNumber(rate) {
    if (window.Arcade && typeof Arcade.fmt === 'function') return Arcade.fmt(rate);
    if (!titleWarned) {
      titleWarned = true;
      if (typeof console !== 'undefined' && console.warn) console.warn('Idle: Arcade.fmt is missing, so the tab title is using plain numbers.');
    }
    if (window.Arcade && typeof Arcade.fmtI === 'function') return Arcade.fmtI(rate);
    return plainFmtI(rate);
  }

  function growthOf(growth) {
    if (growth === undefined || growth === null) return DEFAULT_GROWTH;
    return growth;
  }

  /* x2 at each milestone the player has reached. 25, 50 and 100 stack to x8.
     A second call with the same owned count stays put: the game saves owned. */
  function milestoneMult(owned, steps) {
    var list = steps && steps.length ? steps : MILESTONES;
    var n = owned > 0 && isFinite(owned) ? owned : 0;
    var mult = 1;
    for (var i = 0; i < list.length; i++) if (n >= list[i]) mult *= 2;
    return mult;
  }

  function bulkCost(base, growth, owned, n) {
    growth = growthOf(growth);
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
    growth = growthOf(growth);
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
    var saveFn = typeof opts.save === 'function' ? opts.save : null;
    var running = false;
    var timer = 0;
    var listening = false;
    var lastWall = 0;
    var lastTitleAt = -Infinity;
    var lastSaveAt = 0;
    var savedTitle = null;
    var summary = null;

    function rateNow() {
      var rate = +getRate();
      return isFinite(rate) && rate > 0 ? rate : 0;
    }
    /* A number is fixed for the idle. A function is read when the away box is paid,
       so a night can change the cap or the rate without building a second clock. */
    function offlineCap() {
      if (typeof opts.maxOfflineSec !== 'function') return maxOfflineSec;
      var cap = +opts.maxOfflineSec();
      return isFinite(cap) && cap >= 0 ? cap : DEFAULT_CAP;
    }
    function offlineFrac() {
      if (typeof opts.offlineRate !== 'function') return offlineRate;
      var frac = +opts.offlineRate();
      if (!isFinite(frac) || frac < 0) frac = 1;
      if (frac > 1) frac = 1;
      return frac;
    }
    function addOffline(awaySec) {
      var cap = offlineCap();
      var capped = awaySec > cap;
      var credited = awaySec > 0 ? (capped ? cap : awaySec) : 0;
      var gained = credited > 0 ? rateNow() * credited * offlineFrac() : 0;
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
      if (savedTitle === null) savedTitle = document.title;
      var unit = titleOpts.unit || '';
      var label = titleOpts.label || '';
      document.title = '+' + unit + titleNumber(rateNow()) + '/s · ' + label;
      lastTitleAt = now;
    }
    function flushSave(now) {
      if (typeof saveFn !== 'function') return;
      lastSaveAt = now;
      saveFn(now);
    }
    function onVisibility() {
      if (running && typeof document !== 'undefined' && document.hidden) flushSave(Date.now());
    }
    function onPageHide() {
      if (running) flushSave(Date.now());
    }
    function unbindSaves() {
      if (!listening) return;
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisibility);
      if (typeof window !== 'undefined') window.removeEventListener('pagehide', onPageHide);
      listening = false;
    }
    function bindSaves() {
      unbindSaves();
      if (typeof saveFn !== 'function') return;
      if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);
      if (typeof window !== 'undefined') window.addEventListener('pagehide', onPageHide);
      listening = true;
    }
    function disarm() {
      if (timer && typeof clearInterval === 'function') clearInterval(timer);
      timer = 0;
    }
    function arm() {
      if (!running || timer || typeof setInterval !== 'function') return;
      timer = setInterval(onTick, TICK_MS);
    }
    function onTick() {
      if (!running) return;
      var wall = Date.now();
      var wallDt = (wall - lastWall) / 1000;
      lastWall = wall;
      /* Loaded page, hidden or not: online rate. One jump cannot exceed the cap. */
      wallDt = Math.min(wallDt, maxOfflineSec);
      if (wallDt > 0) {
        var gained = rateNow() * wallDt;
        if (gained) apply(gained);
      }
      if (running && wall - lastSaveAt >= SAVE_MS) flushSave(wall);
      if (running && wall - lastTitleAt >= 1000) writeTitle(wall);
    }
    function start(lastSeen) {
      running = false;
      disarm();
      unbindSaves();
      summary = null;
      running = true;
      var now = Date.now();
      lastWall = now;
      lastSaveAt = now;
      var result = null;
      if (typeof lastSeen === 'number' && isFinite(lastSeen)) {
        var away = (now - lastSeen) / 1000;
        if (away >= AWAY_MIN) result = addOffline(away);
      }
      writeTitle(now);
      bindSaves();
      arm();
      return result;
    }
    function stop() {
      running = false;
      disarm();
      unbindSaves();
      if (savedTitle !== null && typeof document !== 'undefined') {
        document.title = savedTitle;
        savedTitle = null;
      }
    }
    function lastSeen() { return Date.now(); }

    return { start: start, stop: stop, lastSeen: lastSeen };
  }

  window.Idle = {
    create: create,
    bulkCost: bulkCost,
    maxAffordable: maxAffordable,
    milestoneMult: milestoneMult,
    DEFAULT_GROWTH: DEFAULT_GROWTH
  };
})();
