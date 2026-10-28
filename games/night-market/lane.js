/* Night Market lane strip (ART-NM-1, docs/plans/night-market-visuals.md). A 384x88 pixel band over the ledger:
   six stalls (effect 0), coin pops (1), lantern flicker (2), steam and smoke (3), upgrade flashes (4) and
   passers-by (5). Read-only: it looks at state.stalls and never touches the model, the idle core or the save.
   NM-G8: the stalls fill the top 66 rows and the passers-by walk on their own cobbled lane below them (rows 67 to 86),
   so a walker never crosses a counter. The strip was 72 high with the walkers drawn over the counters.
   Palette: only the 12 colours below. No alpha, no gradients; whole pixels at whole-number scale. */
(function () {
  'use strict';
  var C = { night: '#161326', ink: '#1e1a22', timber: '#241c16', amber: '#8a4e1d', mute: '#6e6258', rule: '#ddd4c6',
    wash: '#f6e6cf', lamp: '#f2d080', good: '#1d5c3e' };
  var W = 384, H = 88, SLOT = 64, TOP = 12, TICK = 125, MAX_COINS = 12;
  var STALL_BOTTOM = 66, WALK_Y = 67, WALK_W = 16, WALK_H = 20;      // stalls end at row 66; a walker's box is 16x20 from row 67
  var STEAM = ['rule', 'rule', null, 'rule', 'mute', null];         // tea, dumpling, lantern, mooncake, incense, story mat
  var STRIPE = ['wash', 'lamp', 'rule', 'good'];                     // the awning's light stripe, by look (0, 25, 50, 100 owned)
  var MILESTONES = [25, 50, 100];
  var FLASHES = [25, 50, 100, 150, 200, 300, 400];

  var cv, cx, bg, bx, watch, getState, unlockedFn, seed = 7, sig = '', raf = 0, last = 0, acc = 0, live = false;
  var finaleStart = 0, FINALE_STEP = 140, FINALE_MOMENT = 900;
  var ticks = 0, frames = 0, coins = [], flashes = [], walkers = [], lanterns = [], nextWalker = 0, coinAt = [], reduce = false;

  function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  function rect(c, x, y, w, h, col) { c.fillStyle = C[col]; c.fillRect(x, y, w, h); }
  function box(c, x, y, w, h, fill) { rect(c, x, y, w, h, 'ink'); if (w > 2 && h > 2) rect(c, x + 1, y + 1, w - 2, h - 2, fill); }
  function look(owned) { var k = 0; MILESTONES.forEach(function (m) { if (owned >= m) k++; }); return k; }
  function st() { return getState(); }
  function open(i) { return unlockedFn(st(), i); }
  function busy(i) { var t = st().stalls[i]; return open(i) && (t.hired || t.serves > 0); }

  /* ---- effect 0: the static lane, painted once per change of unlock / look ---- */
  function signature() { return st().stalls.map(function (t, i) { return (open(i) ? 1 : 0) + ':' + look(t.owned); }).join(','); }
  function paintStatic() {
    var c = bx; rect(c, 0, 0, W, H, 'night');
    rect(c, 0, 1, W, 1, 'ink');                                      // the lantern string
    rect(c, 0, STALL_BOTTOM, W, H - STALL_BOTTOM, 'mute'); rect(c, 0, STALL_BOTTOM, W, 1, 'ink');   // the lane's cobbles, where people walk (light enough for a dark silhouette)
    for (var x = 4; x < W; x += 12) rect(c, x, 70, 4, 1, 'timber');
    for (var x2 = 10; x2 < W; x2 += 12) rect(c, x2, 78, 4, 1, 'timber');
    rect(c, 0, H - 1, W, 1, 'ink');
    for (var i = 0; i < 6; i++) { var x0 = i * SLOT, y0 = TOP; if (open(i)) stallOpen(c, i, x0, y0); else stallShut(c, x0, y0); }
  }
  function stallShut(c, x0, y0) {
    rect(c, x0 + 5, y0 + 13, 54, 42, 'mute');                       // a lighter rim so a shuttered stall has an edge on the night
    box(c, x0 + 6, y0 + 14, 52, 40, 'timber');
    for (var y = y0 + 17; y < y0 + 52; y += 4) rect(c, x0 + 8, y, 48, 1, 'mute');
  }
  function stallOpen(c, i, x0, y0) {
    var s = STRIPE[look(st().stalls[i].owned)];
    rect(c, x0 + 7, y0 + 14, 3, 30, 'timber'); rect(c, x0 + 54, y0 + 14, 3, 30, 'timber');   // posts
    rect(c, x0 + 7, y0 + 14, 1, 30, 'amber');                                                 // lit from the upper left
    box(c, x0 + 3, y0 + 6, 58, 10, 'amber');                                                  // awning
    for (var k = 0; k < 7; k++) rect(c, x0 + 4 + k * 8, y0 + 7, 4, 8, s);
    for (var k2 = 0; k2 < 14; k2++) rect(c, x0 + 4 + k2 * 4, y0 + 16, 2, 1, k2 % 2 ? 'amber' : 'ink'); // scalloped edge
    box(c, x0 + 4, y0 + 36, 56, 14, 'amber');                                                 // counter
    rect(c, x0 + 5, y0 + 37, 54, 1, 'wash'); rect(c, x0 + 5, y0 + 48, 54, 1, 'timber'); rect(c, x0 + 58, y0 + 37, 1, 12, 'timber');
    var cx0 = x0 + 32, cy = y0 + 36;                                                          // what the stall sells, on the counter
    if (i === 0) { box(c, cx0 - 4, cy - 6, 8, 6, 'amber'); rect(c, cx0 + 4, cy - 4, 2, 1, 'ink'); box(c, cx0 + 9, cy - 4, 4, 4, 'wash'); box(c, cx0 - 13, cy - 4, 4, 4, 'wash'); }
    if (i === 1) { box(c, cx0 - 6, cy - 4, 12, 4, 'rule'); box(c, cx0 - 5, cy - 7, 10, 3, 'rule'); }
    if (i === 2) { rect(c, cx0 - 1, cy - 14, 1, 14, 'timber'); rect(c, cx0 + 10, cy - 14, 1, 14, 'timber'); }
    if (i === 3) { for (var m = 0; m < 3; m++) box(c, cx0 - 10 + m * 7, cy - 4, 5, 4, 'lamp'); }
    if (i === 4) { box(c, cx0 - 4, cy - 4, 8, 4, 'timber'); rect(c, cx0 - 1, cy - 9, 1, 5, 'mute'); rect(c, cx0 + 2, cy - 8, 1, 4, 'mute'); }
    if (i === 5) { box(c, x0 + 10, y0 + 50, 44, 4, 'amber'); for (var r = 0; r < 5; r++) rect(c, x0 + 13 + r * 8, y0 + 51, 4, 2, 'lamp'); }
  }

  /* ---- effect 2: lanterns ---- */
  function makeLanterns() {
    lanterns = [];
    for (var k = 0; k < 12; k++) lanterns.push({ x: 14 + k * 32, y: 2, w: 3, h: 4, stall: -1, f: 1, hold: 3 + Math.floor(rnd() * 6) });
    for (var i = 0; i < 6; i++) lanterns.push({ x: i * SLOT + 1, y: TOP + 4, w: 6, h: 8, stall: i, f: 1, hold: 3 + Math.floor(rnd() * 6) });
  }
  function nightEnded() {
    var s = st();
    if (window.NightMarket && typeof NightMarket.dawnDue === 'function') return NightMarket.dawnDue(s);
    return !!(s && s.stalls[5] && s.stalls[5].owned >= 10);
  }
  function finaleClock(now) {
    if (!nightEnded()) { finaleStart = 0; return null; }
    if (!finaleStart) finaleStart = now || (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (reduce) return 1e9;
    return (now || (typeof performance !== 'undefined' ? performance.now() : Date.now())) - finaleStart;
  }
  function dimCount(now) {
    var t = finaleClock(now);
    if (t === null) return 0;
    return Math.min(lanterns.length, Math.floor(t / FINALE_STEP));
  }
  function momentOn(now) { return nightEnded() && lanterns.length > 0 && dimCount(now) >= lanterns.length; }
  var finaleShown = 0;
  function finaleReady() {
    var t = finaleClock();
    if (t === null) { finaleShown = 0; return false; }
    if (reduce) {
      draw(1e9);
      if (!finaleShown) finaleShown = Date.now();
      return Date.now() - finaleShown >= 400;
    }
    return t >= lanterns.length * FINALE_STEP + FINALE_MOMENT;
  }
  /* Chapters 5 to 9 each light one more overhead lantern with the existing halo,
     so a Story Mat that barely changes income still changes the lane. */
  function chapterGlow() {
    var s = st();
    var owned = s && s.stalls[5] ? s.stalls[5].owned : 0;
    if (owned < 5 || owned >= 10) return 0;
    return owned - 4;
  }
  function drawLantern(L, index, now) {
    var dimmed = nightEnded() && index < dimCount(now);
    var lit = !dimmed && (L.stall < 0 || open(L.stall)), f = lit ? (reduce ? 1 : L.f) : 1;
    if (lit && L.stall < 0 && index < chapterGlow()) f = 0;
    if (f === 0) { rect(cx, L.x - 1, L.y - 1, L.w + 2, L.h + 2, 'wash'); }
    box(cx, L.x, L.y, L.w, L.h, 'amber');
    var core = lit ? 'lamp' : 'mute', d = f === 2 ? 1 : 0;
    if (L.w > 3) rect(cx, L.x + 2, L.y + 2 + d, L.w - 4, L.h - 4 - d, core); else rect(cx, L.x + 1, L.y + 1 + d, 1, L.h - 2 - d, core);
  }
  /* Old Wen sits, and the tortoise sets its lantern on the cobbles. Palette colours only. */
  function drawMoment() {
    var x = 168, y = 68;
    box(cx, x + 3, y + 5, 10, 3, 'timber');                                                  // tortoise: shell dome
    box(cx, x + 1, y + 7, 14, 6, 'timber');
    rect(cx, x + 4, y + 7, 8, 1, 'timber');
    rect(cx, x + 4, y + 6, 3, 1, 'amber');                                                     // lamplight from the upper left
    rect(cx, x + 4, y + 8, 3, 2, 'amber'); rect(cx, x + 9, y + 8, 3, 2, 'amber');              // shell plates
    rect(cx, x + 2, y + 13, 3, 2, 'ink'); rect(cx, x + 11, y + 13, 3, 2, 'ink');                // legs
    box(cx, x + 15, y + 8, 4, 4, 'timber'); rect(cx, x + 17, y + 9, 1, 1, 'ink');               // outlined head, eye
    box(cx, x + 22, y + 10, 5, 6, 'lamp');
    rect(cx, x + 24, y + 16, 1, 3, 'timber');
    var wx = x + 36;
    rect(cx, wx + 4, y, 6, 6, 'ink');
    rect(cx, wx + 3, y + 6, 8, 8, 'ink');
    rect(cx, wx + 4, y + 14, 3, 3, 'ink');
    rect(cx, wx + 8, y + 14, 3, 3, 'ink');
    rect(cx, wx + 11, y + 7, 1, 6, 'timber');
  }
  function stepLanterns() {
    if (nightEnded()) return;
    var changed = 0;
    for (var k = 0; k < lanterns.length && changed < 2; k++) {
      var L = lanterns[(k + ticks) % lanterns.length]; if (--L.hold > 0) continue;
      L.f = Math.floor(rnd() * 3); L.hold = 3 + Math.floor(rnd() * 6); changed++;                // 375-1000 ms, never in unison
    }
  }

  /* ---- effect 1: coins ---- */
  function pop(i) {
    var c = null; for (var k = 0; k < coins.length; k++) if (!coins[k].on) { c = coins[k]; break; }
    if (!c) return false;                                                                       // the pool is full: dropped
    c.on = true; c.i = i; c.f = 0; return true;
  }
  function drawCoin(c) {
    var x = c.i * SLOT + 30, y = TOP + 31 - [0, 2, 4, 6][c.f];
    if (c.f === 3) { rect(cx, x + 1, y + 1, 3, 1, 'lamp'); rect(cx, x + 2, y, 1, 3, 'lamp'); return; }  // the sparkle
    box(cx, x, y, 5, 5, 'lamp'); rect(cx, x + 1, y + 1, 1, 1, 'wash');
  }

  /* ---- effect 3: steam ---- */
  function drawSteam(i) {
    var col = STEAM[i]; if (!col || !busy(i)) return;
    var bx0 = i * SLOT + 31, by = TOP + 30, t = reduce ? 0 : Math.floor(ticks * TICK / 166);
    for (var p = 0; p < 3; p++) {
      var f = (t + p * 2 + i) % 6, sz = [3, 3, 2, 2, 1, 1][f];
      rect(cx, bx0 + Math.floor(f / 2), by - f * 2 - p, sz, sz, col);
    }
  }

  /* ---- effect 4: flashes ---- */
  function flash(i, milestone) {
    for (var k = 0; k < flashes.length; k++) if (flashes[k].i === i) flashes.splice(k--, 1);
    flashes.push({ i: i, m: !!milestone, f: 0 });
  }
  function drawFlash(F) {
    var x = F.i * SLOT, y = TOP - 1, w = SLOT, h = 56, col = F.m ? 'good' : 'lamp', last = F.m ? 3 : 1;
    if (F.f >= last) return;
    rect(cx, x, y, w, 1, col); rect(cx, x, y + h - 1, w, 1, col); rect(cx, x, y, 1, h, col); rect(cx, x + w - 1, y, 1, h, col);
    if (F.m && F.f === 1) [[x, y], [x + w - 1, y], [x, y + h - 1], [x + w - 1, y + h - 1]].forEach(function (q) {
      rect(cx, q[0] - 1, q[1], 3, 1, 'lamp'); rect(cx, q[0], q[1] - 1, 1, 3, 'lamp'); });
  }

  /* ---- effect 5: passers-by ---- */
  /* The lane gets busier as the market grows, by stalls owned in all (a stall opens at 10 of the one before it, and the incense tray at 12 mooncake tables): 1 walker
     from the first stall, 2 from 20 owned, 3 from 30, 4 from 50 and 5 from 66. None under reduced motion, where the strip
     is a still picture. (It was 1 for up to three running stalls and 2 from four, which only happens past 30 owned.) */
  var BUSY = [[66, 5], [50, 4], [30, 3], [20, 2], [1, 1]];
  function walkerCap() {
    if (reduce) return 0;
    var owned = 0;
    for (var i = 0; i < 6; i++) if (open(i)) owned += st().stalls[i].owned;
    for (var k = 0; k < BUSY.length; k++) if (owned >= BUSY[k][0]) return BUSY[k][1];
    return 0;
  }
  function spawn() {
    var left = rnd() < .5; walkers.push({ x: left ? -16 : W, dir: left ? 1 : -1, f: 0, lamp: rnd() < .35 });
    nextWalker = ticks + 96 + Math.floor(rnd() * 145);                                         // 12-30 s
  }
  function drawWalker(P) {
    var x = P.x, y = WALK_Y, leg = [0, 1, 0, -1][P.f];                                         // the top 20 of 24 px, on the cobbles below the stalls
    rect(cx, x + 5, y, 6, 6, 'ink'); rect(cx, x + 4, y + 6, 8, 10, 'ink'); rect(cx, x + 11, y + 7, 1, 9, 'timber');
    rect(cx, x + 5 + leg, y + 16, 2, 4, 'ink'); rect(cx, x + 9 - leg, y + 16, 2, 4, 'ink');
    rect(cx, x + (P.dir > 0 ? 12 : 2), y + 8 + (P.f % 2), 2, 6, 'ink');                        // the swinging arm
    if (P.lamp) box(cx, x + (P.dir > 0 ? 13 : 0), y + 13, 3, 4, 'lamp');
  }

  /* ---- the loop: fixed 8 fps, stopped when hidden ---- */
  function tick() {
    ticks++;
    var s = st();
    coins.forEach(function (c) { if (c.on && ++c.f > 3) c.on = false; });
    flashes.forEach(function (F) { F.f++; }); flashes = flashes.filter(function (F) { return F.f < (F.m ? 4 : 2); });
    s.stalls.forEach(function (t, i) {                                                          // hired stalls: a visual coin every 2 s
      if (!(t.hired && t.owned > 0 && open(i))) return;
      if (coinAt[i] === undefined) coinAt[i] = ticks + 2 + i * 3;
      if (ticks >= coinAt[i]) { pop(i); coinAt[i] = ticks + 16; }
    });
    stepLanterns();
    walkers.forEach(function (P) { P.x += P.dir; P.f = (P.f + 1) % 4; });
    walkers = walkers.filter(function (P) { return P.x > -17 && P.x < W + 1; });
    var cap = walkerCap(); if (!nightEnded() && walkers.length < cap && ticks >= nextWalker) spawn();
    if (momentOn()) walkers = [];
  }
  function draw(now) {
    var g = signature(); if (g !== sig) { sig = g; paintStatic(); }
    cx.drawImage(bg, 0, 0);
    lanterns.forEach(function (L, index) { drawLantern(L, index, now); });
    for (var i = 0; i < 6; i++) drawSteam(i);
    walkers.forEach(drawWalker);
    if (momentOn(now)) drawMoment();
    coins.forEach(function (c) { if (c.on) drawCoin(c); });
    flashes.forEach(drawFlash);
  }
  function loop(now) {
    raf = 0; if (!live) return; frames++;
    if (!last) last = now; acc += Math.min(now - last, 250); last = now;                       // no catch-up after a stall
    var n = 0; while (acc >= TICK && n < 2) { acc -= TICK; tick(); n++; } if (acc >= TICK) acc = 0;
    if (n || nightEnded()) draw(now);
    raf = requestAnimationFrame(loop);
  }
  function start() { if (live || reduce || document.hidden) return; live = true; last = 0; acc = 0; raf = requestAnimationFrame(loop); }
  function stop() { live = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
  function onVis() {
    if (document.hidden) { stop(); walkers = []; coins.forEach(function (c) { c.on = false; }); flashes = []; coinAt = []; return; } // gone, not frozen
    nextWalker = ticks + 8; start();
  }
  function applyReduce(on) {
    reduce = !!on;
    if (reduce) { stop(); walkers = []; still(); return; }
    start();
  }
  function still() { draw(); }                                                                  // reduced motion: one still frame
  function stillFor(ms) { draw(); setTimeout(function () { coins.forEach(function (c) { c.on = false; }); flashes = []; draw(); }, ms); }

  function fit() {
    // The lane breaks out of the page column to the full page width. Whole-number scale from 384 px up (2x from 768, 3x from
    // 1152, never more than 3x). Below 384 px a 1x strip can't fit, so it shrinks to the page width with every stall whole
    // (the one place the scale isn't a whole number, so the Tea Stall is never cut off).
    // NM-G8: the width is the page body's, which is the viewport minus a classic scrollbar. A scrollbar that appears once the
    // stalls have filled in shrinks it with no window resize, so a ResizeObserver on the body refits the strip as well.
    var vw = (document.body && document.body.clientWidth) || document.documentElement.clientWidth || W, wrap = cv.parentNode, k = vw < W ? vw / W : Math.min(3, Math.floor(vw / W));
    if (wrap.style.width === vw + 'px' && cv.dataset.scale === String(+k.toFixed(3))) return;
    wrap.style.width = vw + 'px';
    cv.style.width = Math.floor(W * k) + 'px'; cv.style.height = Math.floor(H * k) + 'px'; cv.dataset.scale = String(+k.toFixed(3));
  }

  window.NightLane = {
    init: function (canvas, stateFn, unlocked) {
      unlockedFn = unlocked;
      cv = canvas; cx = cv.getContext('2d'); cx.imageSmoothingEnabled = false; getState = stateFn;
      bg = document.createElement('canvas'); bg.width = W; bg.height = H; bx = bg.getContext('2d');
      for (var k = 0; k < MAX_COINS; k++) coins.push({ on: false, i: 0, f: 0 });
      makeLanterns();
      var mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null; reduce = !!(mq && mq.matches);
      if (mq && mq.addEventListener) mq.addEventListener('change', function () { applyReduce(mq.matches); });
      document.addEventListener('visibilitychange', onVis);
      window.addEventListener('resize', fit); fit();
      if (window.ResizeObserver && document.body) { watch = new ResizeObserver(function () { fit(); }); watch.observe(document.body); }
      nextWalker = 16; draw(); start();
    },
    serve: function (i) { pop(i); if (reduce) { coins.forEach(function (c) { if (c.on) c.f = 0; }); stillFor(500); } },
    buy: function (i, before, after) {
      var m = FLASHES.some(function (x) { return before < x && after >= x; });
      flash(i, m); if (reduce) stillFor(500);
    },
    hire: function (i) { flash(i, false); if (reduce) stillFor(500); },
    refresh: function () {
      if (!getState) return;
      var g = signature();
      if (!live || g !== sig) draw();
    },
    signature: function () { return getState ? signature() : ''; },
    // for the checks
    W: W, H: H, PALETTE: C, MAX_COINS: MAX_COINS, SLOT: SLOT, STALL_BOTTOM: STALL_BOTTOM, WALK: { y: WALK_Y, w: WALK_W, h: WALK_H },
    walkerCap: walkerCap, fit: fit, still: function () { draw(); }, background: function () { return bx.getImageData(0, 0, W, H); },
    get ticks() { return ticks; }, get frames() { return frames; }, get live() { return live; },
    coinsOn: function () { return coins.filter(function (c) { return c.on; }).length; },
    flashes: function () { return flashes.slice(); }, walkers: function () { return walkers.slice(); },
    lanterns: function () { return lanterns; }, step: function (n) { for (var k = 0; k < (n || 1); k++) tick(); draw(); },
    finaleReady: finaleReady, dimCount: function () { return dimCount(); },
    setReduce: function (v) { applyReduce(v); }
  };
})();
