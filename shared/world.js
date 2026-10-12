/* The world kit (S4, 2026-10-09): walkable tile worlds for every Generations game. Born in Wildbond (T7b, T13),
   shared so Realmbound's towns (and later Starfall's guild hall and Otherworld) walk and look the same way.

   1. World.walker: a grid you walk on, with smooth sliding between tiles, held keys, click-to-walk (shortest path),
      and bumping into people, doors, exits and signs. The game keeps the position in its own save.
      const wk = World.walker({
        map: () => mapObject,              { rows: ['...'], ... } the map you're on
        tiles,                             legend: { ch: { solid, door, exit, sign, tall } }; unknown = solid
        pos: () => S.pos,                  { map, x, y, dir }, saved by the game
        people: m => [{ at: [x, y], dir }],  standing people (they block, and bumping them talks)
        busy: () => bool,                  no moving during dialogue, battles...
        speed: () => tilesPerSecond,
        on: { person(n), door(x, y, ch), exit(x, y, ch), sign(x, y), step(x, y, ch) }
      });
      wk.place(x, y, dir); wk.tick(dt); wk.step(dir); wk.walkTo(x, y); wk.interact(); wk.arrived();
      wk.keyDown(e) / wk.keyUp(e) return true when they used the key; wk.tap(mx, my, cam) walks to a tapped tile.
      wk.fx, wk.fy: where to draw the walker; wk.fol: a follower one step behind.
   2. World.hd(): the HD-2D look. A flat ground texture laid out through a tilted camera, things that stand up
      (trees, walls, people) drawn far to near with soft shadows, haze and depth of field toward the horizon, warm
      light and a vignette. The game paints its own tiles and sprites.
      const hd = World.hd({ src: 16 });
      const cam = hd.draw(ctx, W, H, t, { rows, px, py, sky: [top, bottom], hill, under, flat(gx, ch, x, y, src, t),
        stands: { ch: 1 }, stand(ctx, ch, left, baseY, s, t, x, y), noShadow: { ch: 1 }, things: [{ x, y, draw(ctx, left, baseY, s, p), shadow }],
        haze, light: true });
      cam.fwd(wx, wy) -> [screenX, screenY, tileSize]; cam.inv(mx, my) -> [tileX, tileY]                         */
(function () {
  'use strict';
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const KEYDIR = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' };

  function walker(o) {
    const K = { fx: 0, fy: 0, path: [], held: [], queued: null, fol: { x: 0, y: 0, fx: 0, fy: 0 }, ready: false };
    const P = () => o.pos(), M = () => o.map(), T = ch => o.tiles[ch] || { solid: 1 };
    function tileAt(m, x, y) { return y < 0 || y >= m.rows.length || x < 0 || x >= m.rows[0].length ? null : m.rows[y][x]; }
    function personAt(m, x, y) { return (o.people ? o.people(m) : []).find(n => n.at[0] === x && n.at[1] === y) || null; }
    function blocked(m, x, y) { const ch = tileAt(m, x, y); return ch === null || !!T(ch).solid || !!personAt(m, x, y); }
    function arrived() { const p = P(); return Math.abs(K.fx - p.x) < .01 && Math.abs(K.fy - p.y) < .01; }
    function place(x, y, dir) {
      const p = P(); p.x = x; p.y = y; p.dir = dir || p.dir || 'down'; K.fx = x; K.fy = y; K.path = []; K.held = []; K.ready = true;
      const [dx, dy] = DIRS[p.dir], bx = x - dx, by = y - dy, ok = !blocked(M(), bx, by);
      K.fol = { x: ok ? bx : x, y: ok ? by : y }; K.fol.fx = K.fol.x; K.fol.fy = K.fol.y;
    }
    function step(dir) {
      if (o.busy && o.busy()) return false;
      const p = P(), m = M(), [dx, dy] = DIRS[dir], nx = p.x + dx, ny = p.y + dy, ch = tileAt(m, nx, ny), t = ch === null ? { solid: 1 } : T(ch);
      p.dir = dir;
      const n = personAt(m, nx, ny); if (n) { K.path = []; if (o.on.person) o.on.person(n); return false; }
      if (t.door) { K.path = []; if (o.on.door) o.on.door(nx, ny, ch); return false; }
      if (t.exit) { K.path = []; if (o.on.exit) o.on.exit(nx, ny, ch); return false; }
      if (t.sign) { K.path = []; if (o.on.sign) o.on.sign(nx, ny); return false; }
      if (blocked(m, nx, ny)) { K.path = []; return false; }
      K.fol.x = p.x; K.fol.y = p.y; p.x = nx; p.y = ny;
      if (o.on.step) o.on.step(nx, ny, ch);
      return true;
    }
    /* the shortest route to a tile; the last step may be onto a person, door, exit or sign */
    function walkTo(tx, ty) {
      const p = P(), m = M(), W0 = m.rows[0].length, key = (x, y) => y * W0 + x, prev = new Map([[key(p.x, p.y), null]]), q = [[p.x, p.y]], goal = key(tx, ty);
      while (q.length) {
        const [x, y] = q.shift(); if (key(x, y) === goal) break;
        for (const d in DIRS) {
          const nx = x + DIRS[d][0], ny = y + DIRS[d][1], k = key(nx, ny); if (prev.has(k) || nx < 0 || ny < 0 || nx >= W0 || ny >= m.rows.length) continue;
          const t = T(tileAt(m, nx, ny)); if (k !== goal && (blocked(m, nx, ny) || t.door || t.exit || t.sign)) continue;
          prev.set(k, [key(x, y), d]); q.push([nx, ny]);
        }
      }
      if (!prev.has(goal) || goal === key(p.x, p.y)) return false;
      const steps = []; for (let k = goal; prev.get(k); k = prev.get(k)[0]) steps.unshift(prev.get(k)[1]);
      K.path = steps; return true;
    }
    function tick(h) {
      if (!K.ready) { const p = P(); place(p.x, p.y, p.dir); }
      if (o.busy && o.busy()) return;
      const p = P(), sp = (o.speed ? o.speed() : 5) * h, f = K.fol;
      K.fx += Math.max(-sp, Math.min(sp, p.x - K.fx)); K.fy += Math.max(-sp, Math.min(sp, p.y - K.fy));
      f.fx += Math.max(-sp, Math.min(sp, f.x - f.fx)); f.fy += Math.max(-sp, Math.min(sp, f.y - f.fy));
      if (!arrived()) return;
      const dir = K.held[K.held.length - 1] || K.queued || K.path.shift(); K.queued = null;
      if (dir) step(dir);
    }
    function interact() {
      if (o.busy && o.busy()) return false;
      const p = P(), m = M(), [dx, dy] = DIRS[p.dir], x = p.x + dx, y = p.y + dy, n = personAt(m, x, y), ch = tileAt(m, x, y), t = ch === null ? {} : T(ch);
      if (n) { if (o.on.person) o.on.person(n); return true; }
      if (t.door && o.on.door) { o.on.door(x, y, ch); return true; }
      if (t.sign && o.on.sign) { o.on.sign(x, y); return true; }
      return false;
    }
    function keyDown(e) {
      const k = e.key.toLowerCase(), d = KEYDIR[k]; if (!d) return false;
      if (!K.held.includes(d)) K.held.push(d); K.path = [];
      if (!e.repeat) { if (arrived()) step(d); else K.queued = d; }
      return true;
    }
    function keyUp(e) { const d = KEYDIR[e.key.toLowerCase()]; if (d) K.held = K.held.filter(x => x !== d); return !!d; }
    function tap(mx, my, cam) { if (!cam) return false; const [tx, ty] = cam.inv ? cam.inv(mx, my) : [Math.floor((mx - cam.ox) / cam.ts), Math.floor((my - cam.oy) / cam.ts)]; return tx !== undefined && walkTo(tx, ty); }
    return Object.assign(K, { tileAt, personAt, blocked, arrived, place, step, walkTo, tick, interact, keyDown, keyUp, tap, DIRS });
  }

  /* ---------------- the HD-2D renderer ---------------- */
  function hd(opt) {
    opt = opt || {};
    const SRC = opt.src || 16, mk = () => { const c = document.createElement('canvas'); return [c, c.getContext('2d')]; };
    const [ground, gx] = mk(), [screen, sx] = mk(), filterOK = 'filter' in gx;
    const parse = c => { if (c[0] === '#') { let h = c.slice(1); if (h.length === 3) h = [...h].map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); } return (String(c).match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number); };
    const rgba = (c, a) => `rgba(${parse(c).join(',')},${a})`;
    const mixHex = (a, b, k) => { const p = parse(a), q = parse(b); return `rgb(${p.map((v, i) => Math.round(v + (q[i] - v) * k)).join(',')})`; };
    /* the camera: horizon at 20% of the height, the walker at 80%, about 4 tiles from the lens */
    function camera(W, H, v) { const yh = H * (v.horizon || .2), ys = H * .8, dp = 4.2, ts = H / (v.zoom || 6.5); return { W, H, yh, dp, K: (ys - yh) * dp, F: ts * dp, px: v.px + .5, py: v.py + .5 }; }
    function project(C, wx, wy) { const d = C.dp + (C.py - wy); if (d < .45) return null; const s = C.F / d; return { x: C.W / 2 + (wx - C.px) * s, y: C.yh + C.K / d, s, d }; }
    function shadow(c, x, y, s) { c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x, y, s * .42, s * .12, 0, 0, 7); c.fill(); }
    function light(c, W, H) {
      const sun = c.createRadialGradient(W * .2, -H * .3, 0, W * .2, -H * .3, W * 1.1); sun.addColorStop(0, 'rgba(255,236,190,.30)'); sun.addColorStop(1, 'rgba(255,236,190,0)'); c.fillStyle = sun; c.fillRect(0, 0, W, H);
      const vg = c.createRadialGradient(W / 2, H * .62, W * .3, W / 2, H * .62, W * .8); vg.addColorStop(0, 'rgba(10,12,30,0)'); vg.addColorStop(1, 'rgba(10,12,30,.38)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    }
    function draw(c, W, H, t, v) {
      const rows = v.rows.length, cols = v.rows[0].length, C = camera(W, H, v), stands = v.stands || {};
      // 1. the flat ground texture
      if (ground.width !== cols * SRC || ground.height !== rows * SRC) { ground.width = cols * SRC; ground.height = rows * SRC; }
      gx.imageSmoothingEnabled = false;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const ch = v.rows[y][x]; v.flat(gx, stands[ch] ? (typeof v.under === 'function' ? v.under(ch) : v.under || ',') : ch, x * SRC, y * SRC, SRC, t, x, y); }
      // 2. sky and far hills, then the ground in perspective, one screen row at a time
      if (screen.width !== Math.ceil(W) || screen.height !== Math.ceil(H)) { screen.width = Math.ceil(W); screen.height = Math.ceil(H); }
      sx.imageSmoothingEnabled = false;
      if (v.skyDraw) v.skyDraw(sx, W, C.yh + 1, t); else { const sky = sx.createLinearGradient(0, 0, 0, C.yh); sky.addColorStop(0, v.sky[0]); sky.addColorStop(1, v.sky[1]); sx.fillStyle = sky; sx.fillRect(0, 0, W, C.yh + 1); }
      sx.fillStyle = mixHex(v.hill, v.sky[1], .4); sx.beginPath(); sx.moveTo(0, C.yh + 1);
      for (let x = 0; x <= W + 8; x += 8) sx.lineTo(x, C.yh - H * .05 - Math.sin(x * .012 + C.px * .1) * H * .035 - Math.sin(x * .043) * H * .012);
      sx.lineTo(W, C.yh + 1); sx.fill();
      sx.fillStyle = v.edgeFill || v.hill; sx.fillRect(0, C.yh, W, H - C.yh);
      for (let y = Math.floor(C.yh) + 1; y < H; y++) {
        const d = C.K / (y - C.yh), wy = C.py - (d - C.dp); if (d > 18 || wy < 0 || wy >= rows) continue;
        const s = C.F / d, half = W / 2 / s; sx.drawImage(ground, (C.px - half) * SRC, Math.floor(wy * SRC), 2 * half * SRC, 1, 0, y, W, 1);
      }
      // 3. haze toward the horizon
      const hz = v.haze || v.sky[1], fogTo = C.yh + (H * .8 - C.yh) * .4, fog = sx.createLinearGradient(0, C.yh - H * .08, 0, fogTo);
      fog.addColorStop(0, rgba(hz, .9)); fog.addColorStop(1, rgba(hz, 0)); sx.fillStyle = fog; sx.fillRect(0, C.yh - H * .08, W, fogTo - C.yh + H * .08);
      c.drawImage(screen, 0, 0, W, H);
      // 4. depth of field: the far distance goes soft
      if (filterOK && v.dof !== false) { const b1 = C.yh + (H - C.yh) * .16, b2 = C.yh + (H - C.yh) * .28; c.save();
        c.filter = 'blur(1px)'; c.drawImage(screen, 0, 0, W, b2, 0, 0, W, b2); c.filter = 'blur(2px)'; c.drawImage(screen, 0, 0, W, b1, 0, 0, W, b1); c.restore(); }
      // 5. everything that stands up, far to near
      const list = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const ch = v.rows[y][x]; if (stands[ch]) list.push({ tile: ch, x, y }); }
      for (const q of v.things || []) list.push(q);
      list.sort((a, b) => a.y - b.y || (a.tile ? -1 : 1));
      const vis = [];
      for (const q of list) {
        const p = project(C, q.x + .5, q.y + .92); if (!p || p.d > 17 || p.y - p.s * 2.5 > H) continue;
        const s = p.s, left = p.x - s / 2; if (left > W + s || left + s < -s) continue; vis.push({ q, p, s, left });
      }
      // 5a. with the light engine (shared/light.js): every shadow on the ground first, along the sun or moon, and at
      // night away from nearby lamps and torches, so they never fall on top of the things behind them
      const lt = v.lt, sun = v.sun;
      if (lt && sun) {
        const lamps = (v.lamps || []).map(l => { const p = project(C, l.x, l.y); return p && { x: p.x, y: p.y - p.s * (l.h || 1), reach: p.s * (l.reach || 4) }; }).filter(Boolean);
        for (const { q, p, s, left } of vis) {
          if (q.tile && (v.noCast || {})[q.tile]) continue; if (!q.tile && q.shadow === false) continue;
          const draw = q.tile ? cc => v.stand(cc, q.tile, left, p.y, s, t, q.x, q.y, 'shadow') : cc => q.draw(cc, left, p.y, s, p, 'shadow');
          const box = q.tile ? [left - s * .45, p.y - s * 2.9, s * 1.9, s * 2.95] : [left - s * .35, p.y - s * 1.8, s * 1.7, s * 1.85];
          if (sun.day || sun.elev > .15) lt.cast(c, draw, box, p.y, sun, { k: q.tile ? 1 : (q.shadow || 1) });
          if (!sun.day && lamps.length) { let best = null, bd = 1e9; for (const l of lamps) { const d = Math.hypot(l.x - p.x, l.y - p.y); if (d < l.reach && d < bd && d > s * .3) { bd = d; best = l; } }
            if (best) lt.cast(c, draw, box, p.y, sun, { from: [best.x, best.y], reach: best.reach }); }
        }
      }
      // 5b. the things themselves, far to near, each sitting on a soft contact shadow
      for (const { q, p, s, left } of vis) {
        if (q.tile) { if (!(v.noShadow || {})[q.tile]) lt && sun ? lt.contact(c, p.x, p.y, s * .5, sun) : shadow(c, p.x, p.y, s); v.stand(c, q.tile, left, p.y, s, t, q.x, q.y); continue; }
        if (q.shadow !== false) lt && sun ? lt.contact(c, p.x, p.y, s * .45 * (q.shadow || 1), sun) : shadow(c, p.x, p.y, s * (q.shadow || 1));
        q.draw(c, left, p.y, s, p);
      }
      if (v.light !== false) light(c, W, H);
      return { fwd(wx, wy) { const p = project(C, wx, wy); return p && [p.x, p.y, p.s]; }, inv(mx, my) { if (my <= C.yh + 2) return []; const d = C.K / (my - C.yh), s = C.F / d; return [Math.floor(C.px + (mx - W / 2) / s), Math.floor(C.py - (d - C.dp))]; } };
    }
    return { draw, light };
  }
  window.World = { walker, hd, DIRS };
})();
