/* Each place keeps one animal and the little thing it plays with. A tap hops them by day and stirs them at bedtime. Arriving is answered with one hello. */
(function () {
  if (!window.LR) return;
  const LIFE = [
    { area: 0, animal: 'bird', prop: 'berry', day: '#e8483c', night: '#8a2a24', belly: '#fff0d8', shine: '#ff9a8a', shineNight: '#c8453a', propDay: '#c8453a', propNight: '#8a2a24' },
    { area: 1, animal: 'bunny', prop: 'clover', day: '#f4f0d8', night: '#8a8aa0', belly: '#fff8ec', shine: '#ffffff', shineNight: '#c8d4e4', propDay: '#5cba5a', propNight: '#1e3a36' },
    { area: 2, animal: 'chick', prop: 'block', day: '#ffd03a', night: '#c8902a', belly: '#fff3a0', shine: '#fff4b0', shineNight: '#ffd03a', propDay: '#4fa6ff', propNight: '#2a3a68' },
    { area: 3, animal: 'woolly', prop: 'pail', day: '#fff8ec', night: '#b8ab98', belly: '#f4ead8', shine: '#ffffff', shineNight: '#e8e0d0', propDay: '#8a5a34', propNight: '#5a3a24' }
  ];
  LIFE.forEach(row => { row.pose = 'rest'; row.at = 0; row.greeted = false; row.spot = null; });
  const INK = '#1e1a24';
  const cv = document.querySelector('#ranch');
  function figure() {
    const scale = LR.scale || 2;
    const s = Math.max(28, Math.ceil(72 / scale));
    return { s, r: s * .62 };
  }
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
    const ay = L.ground - U * .08;
    if (Math.abs(y - ay) < U * .175 + r && (sx - r < U * .2 || sx + r > W - U * .2)) return true;
    if (y - r < 8 || y + r > cv.height - 4) return true;
    const lock = 56 / (LR.scale || 2);
    if (sx + r > W - lock && y - r < lock) return true;
    if (Math.hypot(sx - W * .12, y - (L.ground + U * .45)) < r + 8) return true;
    const ySwipe = L.ground - U * .36;
    const samples = [.4, .5, .62, .74, .84];
    for (let i = 0; i < samples.length; i++) if (Math.hypot(sx - W * samples[i], y - ySwipe) < r + 4) return true;
    if (Math.hypot(sx - W * .22, y - cv.height * .17) < Math.max(U * .16, L.R) + r) return true;
    if (L.here && L.here.length) {
      const top = L.here[0].y, left = L.here[0].x, right = L.here[L.here.length - 1].x;
      if (y < top + r + U * .04 && sx > left - r - 6 && sx < right + r + 6) return true;
    }
    const z = L.size, by = L.home.y + z * .06, marks = [LR.state.baby.x + z * .9, LR.state.baby.x - z * 1.4];
    for (let i = 0; i < marks.length; i++) if (Math.hypot(x - marks[i], y - by) < 12) return true;
    return !clear(x, y, r);
  }
  function place(area) {
    const L = LR.layout, U = L.U, stop = LR.world.areas[area].stop, fit = figure(), r = fit.r, s = fit.s;
    const skyTop = r + 8, skyBot = Math.max(skyTop + 4, L.ground - U * .32);
    const hill = Math.max(skyTop, L.ground - s * .55);
    const grassTop = L.ground + Math.max(U * .24, s);
    const sky = [skyTop, skyBot], hillBand = [hill, hill + 4], grass = [grassTop, cv.height - 4];
    const bands = LIFE[area].animal === 'bird' ? [sky, hillBand] : [hillBand, grass, sky];
    const step = Math.max(6, r * .45);
    for (let b = 0; b < bands.length; b++) {
      for (let y = bands[b][0]; y <= bands[b][1]; y += step) {
        for (let sx = r + 8; sx <= cv.width - r - 8; sx += step) {
          const x = stop + sx;
          if (!blocked(x, y, r, stop)) return { x, y, r, s };
        }
      }
    }
    const y = Math.min(skyBot, Math.max(skyTop, L.ground * .34));
    for (let sx = cv.width * .58; sx >= r + 8; sx -= step) {
      if (!blocked(stop + sx, y, r * .8, stop)) return { x: stop + sx, y, r, s };
    }
    return { x: stop + cv.width * .58, y, r, s };
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

  function block(x, y, w, h, fill, shine) {
    const rx = Math.round(x), ry = Math.round(y), rw = Math.max(2, Math.round(w)), rh = Math.max(2, Math.round(h));
    cx.fillStyle = INK;
    cx.fillRect(rx - 2, ry - 2, rw + 4, rh + 4);
    cx.fillStyle = fill;
    cx.fillRect(rx, ry, rw, rh);
    if (shine) { cx.fillStyle = shine; cx.fillRect(rx, ry, Math.max(1, Math.round(rw * .38)), Math.max(1, Math.round(rh * .42))); }
  }
  function animal(row, x, y, s) {
    const dark = night(), body = dark ? row.night : row.day, shine = dark ? row.shineNight : row.shine, eye = '#2a1a18';
    if (row.animal === 'bird') {
      block(x - s * .4, y - s * .2, s * .8, s * .55, body, shine);
      block(x - s * .05, y - s * .52, s * .42, s * .4, body, shine);
      block(x + s * .3, y - s * .38, s * .24, s * .14, '#ffd03a', '#fff4b0');
      block(x - s * .16, y, s * .34, s * .2, row.belly, null);
      block(x + s * .08, y - s * .4, s * .1, s * .1, eye, null);
    } else if (row.animal === 'bunny') {
      block(x - s * .28, y - s * .7, s * .16, s * .38, body, shine);
      block(x + s * .12, y - s * .7, s * .16, s * .38, body, shine);
      block(x - s * .22, y - s * .62, s * .06, s * .2, '#ffb0a0', null);
      block(x + s * .16, y - s * .62, s * .06, s * .2, '#ffb0a0', null);
      block(x - s * .36, y - s * .22, s * .72, s * .5, body, shine);
      block(x - s * .18, y - s * .02, s * .36, s * .22, row.belly, null);
      block(x - s * .1, y - s * .12, s * .08, s * .08, eye, null);
      block(x + s * .08, y - s * .12, s * .08, s * .08, eye, null);
    } else if (row.animal === 'chick') {
      block(x - s * .38, y - s * .34, s * .76, s * .64, body, shine);
      block(x + s * .22, y - s * .08, s * .24, s * .16, '#e8483c', '#ff9a8a');
      block(x - s * .08, y - s * .5, s * .2, s * .18, '#e8483c', '#ff9a8a');
      block(x - s * .22, y + s * .26, s * .14, s * .12, '#c8902a', null);
      block(x + s * .08, y + s * .26, s * .14, s * .12, '#c8902a', null);
      block(x + s * .02, y - s * .16, s * .1, s * .1, eye, null);
    } else {
      block(x - s * .4, y - s * .28, s * .8, s * .52, body, shine);
      block(x - s * .2, y - s * .06, s * .28, s * .22, row.belly, null);
      block(x - s * .28, y + s * .2, s * .12, s * .14, '#5a3a24', null);
      block(x + s * .14, y + s * .2, s * .12, s * .14, '#5a3a24', null);
      block(x - s * .08, y - s * .14, s * .08, s * .08, eye, null);
      block(x + s * .08, y - s * .14, s * .08, s * .08, eye, null);
    }
  }
  function prop(row, x, y, s, hop) {
    const colour = night() ? row.propNight : row.propDay;
    const px = x + s * .36, py = y + s * .02 - hop * 1.4;
    if (row.prop === 'berry' || row.prop === 'block') block(px, py, s * .3, s * .3, colour, null);
    else if (row.prop === 'clover') {
      block(px, py, s * .16, s * .16, colour, '#8acb6a');
      block(px + s * .12, py + s * .02, s * .16, s * .16, colour, '#8acb6a');
      block(px + s * .04, py + s * .14, s * .16, s * .16, colour, '#8acb6a');
    } else {
      block(px, py, s * .28, s * .22, colour, '#c8955a');
      block(px + s * .06, py - s * .12, s * .16, s * .12, colour, '#c8955a');
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
      const s = spot.s || figure().s, hop = lift(row);
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
    rows: () => LIFE.map(row => ({ area: row.area, animal: row.animal, prop: row.prop, pose: row.pose, greeted: row.greeted, spot: row.spot, lift: lift(row), span: row.spot ? row.spot.s : 0 })),
    spot: area => place(area),
    paint
  };
  paint();
})();
