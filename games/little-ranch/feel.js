/* Each place keeps one animal and the little thing it plays with. A tap hops them by day and stirs them at bedtime. Arriving is answered with one hello. */
(function () {
  if (!window.LR) return;
  const LIFE = [
    { area: 0, animal: 'bird', prop: 'berry', day: '#e8483c', night: '#8a2a24', belly: '#fff0d8', propDay: '#c8453a', propNight: '#8a2a24' },
    { area: 1, animal: 'bunny', prop: 'clover', day: '#f4f0d8', night: '#8a8aa0', belly: '#fff8ec', propDay: '#5cba5a', propNight: '#1e3a36' },
    { area: 2, animal: 'chick', prop: 'block', day: '#ffd03a', night: '#c8902a', belly: '#fff3a0', propDay: '#4fa6ff', propNight: '#2a3a68' },
    { area: 3, animal: 'woolly', prop: 'pail', day: '#fff8ec', night: '#b8ab98', belly: '#f4ead8', propDay: '#8a5a34', propNight: '#5a3a24' }
  ];
  LIFE.forEach(row => { row.pose = 'rest'; row.at = 0; row.greeted = false; row.spot = null; });
  const cv = document.querySelector('#ranch');
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const night = () => LR.state.mode !== 'play' || LR.state.dusk > .55;
  let seen = -1, pending = false, lastT = 0, held = null;

  function reset() {
    LIFE.forEach(row => { row.pose = 'rest'; row.at = 0; row.greeted = false; });
    seen = -1; pending = false;
  }
  function watch() {
    const t = LR.state.t;
    if (t + .001 < lastT) reset();
    lastT = t;
    const area = LR.camera.area;
    const moving = Math.abs(LR.camera.x - LR.camera.target) > .5;
    if (seen !== area) { seen = area; pending = true; }
    if (!pending || moving || LR.state.place !== 'ranch') return;
    pending = false;
    const row = LIFE[area];
    row.greeted = true;
    if (!reduce() && !night()) { row.pose = 'hello'; row.at = t; }
  }
  function lift(row) {
    if (reduce()) return 0;
    const t = LR.state.t - row.at, U = LR.layout.U;
    if (row.pose === 'rest') return night() ? 0 : Math.sin(LR.state.t * 3) * 1.5;
    const dur = row.pose === 'stir' ? .35 : row.pose === 'hello' ? .6 : .5;
    if (t >= dur) { row.pose = 'rest'; return lift(row); }
    const k = t / dur;
    if (row.pose === 'stir') return Math.sin(k * Math.PI * 3) * U * .015;
    return Math.sin(k * Math.PI) * U * .1;
  }
  function clear(x, y, r) {
    const pts = [[0, 0], [r * .8, 0], [-r * .8, 0], [0, r * .6], [0, -r * .6]];
    return pts.every(([dx, dy]) => !LR.ranchTarget({ x: x + dx, y: y + dy }));
  }
  function blocked(x, y, r, stop) {
    const L = LR.layout, U = L.U, W = cv.width, sx = x - stop;
    if (sx - r < U * .2 || sx + r > W - U * .2) return true;
    if (y - r < 10 || y + r > cv.height - 4) return true;
    const lock = 56 / (LR.scale || 2);
    if (sx + r > W - lock && y - r < lock) return true;
    if (Math.hypot(sx - W * .12, y - (L.ground + U * .45)) < r + 8) return true;
    const ySwipe = L.ground - U * .36;
    const samples = [.4, .5, .62, .74, .84];
    for (let i = 0; i < samples.length; i++) if (Math.hypot(sx - W * samples[i], y - ySwipe) < r + 4) return true;
    if (Math.hypot(sx - W * .22, y - cv.height * .17) < Math.max(U * .16, L.R) + r) return true;
    const z = L.size, by = L.home.y + z * .06, marks = [LR.state.baby.x + z * .9, LR.state.baby.x - z * 1.4];
    if (LR.state.friend) marks.push(LR.state.friend.x + z * .9, LR.state.friend.x - z * 1.4);
    for (let i = 0; i < marks.length; i++) if (Math.hypot(x - marks[i], y - by) < r + z * .5) return true;
    return !clear(x, y, r);
  }
  function place(area) {
    const L = LR.layout, U = L.U, stop = LR.world.areas[area].stop;
    const want = U * .175, minR = 22 / (LR.scale || 2);
    const bands = [[L.ground + U * .12, cv.height - 4], [L.ground - U * .02, L.ground + U * .1]];
    for (let r = want; r >= minR - .1; r -= Math.max(2, U * .015)) {
      const step = Math.max(8, r * .55);
      for (let b = 0; b < bands.length; b++) {
        for (let y = bands[b][0]; y < bands[b][1] && y < cv.height - r; y += step) {
          for (let sx = U * .2 + r; sx <= cv.width - U * .2 - r; sx += step) {
            const x = stop + sx;
            if (!blocked(x, y, r, stop)) return { x, y, r };
          }
        }
      }
    }
    return null;
  }
  function worldPoint(e) {
    const src = (e.changedTouches && e.changedTouches[0]) || e;
    const box = cv.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    return {
      x: LR.camera.x + (src.clientX - box.left) / box.width * cv.width,
      y: (src.clientY - box.top) / box.height * cv.height
    };
  }
  function idOf(e) { const t = e.changedTouches && e.changedTouches[0]; return t ? t.identifier : e.pointerId; }
  function hit(p) {
    if (!p || LR.state.place !== 'ranch' || LR.ranchTarget(p)) return null;
    for (let i = 0; i < LIFE.length; i++) {
      const row = LIFE[i];
      if (row.area !== LR.camera.area || !row.spot) continue;
      if (Math.hypot(p.x - row.spot.x, p.y - row.spot.y) <= row.spot.r) return row;
    }
    return null;
  }
  function react(row) {
    row.pose = night() ? 'stir' : 'hop';
    row.at = LR.state.t;
    if (!night()) LR.act.sparkle({ x: row.spot.x, y: row.spot.y });
  }
  function down(e) {
    const id = idOf(e);
    if (held && held.id === id) { if (!held.pass) { e.preventDefault(); e.stopPropagation(); } return; }
    const row = hit(worldPoint(e));
    if (!row) return;
    // Bedtime taps still brush, drink and say goodnight. The animal only stirs along with them.
    if (night()) { held = { id, row, pass: true }; return; }
    held = { id, row, pass: false };
    e.preventDefault();
    e.stopPropagation();
  }
  function up(e) {
    if (!held || held.id !== idOf(e)) return;
    const row = held.row, pass = held.pass;
    held = null;
    if (!pass) { e.preventDefault(); e.stopPropagation(); }
    if (e.type !== 'pointercancel' && e.type !== 'touchcancel') react(row);
  }
  cv.addEventListener('pointerdown', down, true);
  cv.addEventListener('pointerup', up, true);
  cv.addEventListener('pointercancel', up, true);
  cv.addEventListener('touchstart', down, true);
  cv.addEventListener('touchend', up, true);
  cv.addEventListener('touchcancel', up, true);

  function rect(x, y, w, h, colour) {
    cx.fillStyle = colour;
    cx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  }
  function animal(row, x, y, s) {
    const dark = night(), body = dark ? row.night : row.day, belly = row.belly, eye = '#2a1a18';
    if (row.animal === 'bird') {
      rect(x - s * .4, y - s * .2, s * .8, s * .55, body);
      rect(x - s * .05, y - s * .5, s * .4, s * .38, body);
      rect(x + s * .28, y - s * .38, s * .22, s * .14, '#ffd03a');
      rect(x - s * .15, y, s * .35, s * .2, belly);
    } else if (row.animal === 'bunny') {
      rect(x - s * .22, y - s * .72, s * .16, s * .4, body);
      rect(x + s * .08, y - s * .72, s * .16, s * .4, body);
      rect(x - s * .36, y - s * .28, s * .72, s * .58, body);
      rect(x - s * .18, y - s * .02, s * .36, s * .22, belly);
    } else if (row.animal === 'chick') {
      rect(x - s * .36, y - s * .32, s * .72, s * .62, body);
      rect(x + s * .2, y - s * .08, s * .22, s * .14, '#e8483c');
      rect(x - s * .06, y - s * .48, s * .18, s * .16, '#e8483c');
      rect(x - s * .2, y + s * .26, s * .12, s * .1, '#c8902a');
      rect(x + s * .08, y + s * .26, s * .12, s * .1, '#c8902a');
    } else {
      rect(x - s * .4, y - s * .32, s * .8, s * .58, body);
      rect(x - s * .22, y - s * .08, s * .28, s * .2, belly);
      rect(x - s * .28, y + s * .22, s * .12, s * .14, '#5a3a24');
      rect(x + s * .14, y + s * .22, s * .12, s * .14, '#5a3a24');
    }
    if (dark) rect(x + s * .02, y - s * .22, s * .16, s * .05, eye);
    else rect(x + s * .04, y - s * .24, s * .1, s * .1, eye);
  }
  function prop(row, x, y, s, hop) {
    const colour = night() ? row.propNight : row.propDay;
    const px = x + s * .34, py = y + s * .02 - hop * 1.6;
    if (row.prop === 'berry' || row.prop === 'block') rect(px, py, s * .28, s * .28, colour);
    else if (row.prop === 'clover') {
      rect(px, py, s * .14, s * .14, colour);
      rect(px + s * .12, py + s * .02, s * .14, s * .14, colour);
      rect(px + s * .04, py + s * .14, s * .14, s * .14, colour);
    } else {
      rect(px, py, s * .26, s * .2, colour);
      rect(px + s * .06, py - s * .1, s * .14, s * .1, colour);
    }
  }
  let cx;
  function paint() {
    if (!LR.layout || !LR.state || LR.state.place !== 'ranch') return;
    watch();
    LIFE.forEach(row => { row.spot = row.area === LR.camera.area ? place(row.area) : row.spot; });
    cx = cv.getContext('2d');
    cx.save();
    cx.setTransform(1, 0, 0, 1, 0, 0);
    const row = LIFE[LR.camera.area], spot = row && row.spot;
    if (spot) {
      const s = Math.min(LR.layout.U * .2, spot.r * 1.15), hop = lift(row);
      const x = spot.x - LR.camera.x, y = spot.y - hop;
      animal(row, x, y, s);
      prop(row, x, y, s, hop);
    }
    cx.restore();
  }
  const advance = LR.advance, redraw = LR.redraw;
  LR.advance = function (secs) { const out = advance(secs); paint(); return out; };
  LR.redraw = function () { redraw(); paint(); };
  const frame = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (fn) {
    return frame(function (t) { fn(t); paint(); });
  };
  window.LRFeel = {
    rows: () => LIFE.map(row => ({ area: row.area, animal: row.animal, prop: row.prop, pose: row.pose, greeted: row.greeted, spot: row.spot, lift: lift(row) })),
    spot: area => place(area),
    paint
  };
  paint();
})();
