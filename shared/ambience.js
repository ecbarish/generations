/* Shared ambience for Generations games (S5, 2026-10-09): living scenes drawn in code, no image files.
   The same weather, light and life in every game, so the arcade feels like one family:
   - sky:     day/night gradient, twinkling stars, a pixel moon or sun, aurora, drifting pixel clouds
   - far:     distant scenery that scrolls with parallax and sways in the wind (pines, oaks, dead trees, peaks,
              mesas, standing stones, giant canopy trees, reeds, ruins)
   - weather: rain with splashes, snow, ash, embers, spores, blown leaves, dust, fireflies, grave-wisps, fog,
              and lightning storms (a branching bolt, a double flash, thunder a beat later through a callback)
   - fire / smoke / embers: campfires, torches and chimneys
   - lights:  night as a dark layer with real pools of flickering light cut out of it
   - life:    birds, bats at dusk, distant drakes
   Everything respects prefers-reduced-motion (no lightning flashes, no moving particles).

   const amb = Ambience.create({ reduce: () => bool });
   amb.sky(ctx, W, H, t, { top, bottom, night, stars, moon, sun, aurora, clouds: { n, col, alpha, speed }, storm })
   amb.far(ctx, W, H, t, { layers: [{ kind, col, base, h, par, seed, snow }], scroll, wind, night })
   amb.weather(ctx, W, H, t, { rain, snow, ash, embers, spores, leaves, dust, fireflies, wisps, fog, wind, ground, px,
                               storm, onThunder(vol), splashAnywhere })
   amb.flash(ctx, W, H, t)                            lightning: draw last
   amb.lights(ctx, W, H, t, { dark, tint, lights: [{ x, y, r, col, flick }] })
   amb.fire(ctx, x, y, px, t, { id, size, logs, smoke, embers }) -> a light for amb.lights
   amb.smoke(ctx, x, y, px, t, { id, wind }); amb.embers(ctx, x, y, px, t, { id, rate, spread })
   amb.life(ctx, W, H, t, { birds, bats, drakes, col, y0, y1 })
   t is in seconds; every call in one frame shares the same t.                                                     */
(function () {
  'use strict';
  function rng(seed) { let a = seed >>> 0; return function () { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function rgb(c) {
    if (Array.isArray(c)) return c;
    if (c[0] === '#') { let h = c.slice(1); if (h.length === 3) h = h.split('').map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
    const m = String(c).match(/[\d.]+/g) || [0, 0, 0]; return m.slice(0, 3).map(Number);
  }
  function mix(a, b, k) { const p = rgb(a), q = rgb(b); k = Math.max(0, Math.min(1, k)); return `rgb(${p.map((v, i) => Math.round(v + (q[i] - v) * k)).join(',')})`; }
  function rgba(c, a) { const p = rgb(c); return `rgba(${p[0]},${p[1]},${p[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`; }
  /* a pixel circle: one rect per pixel row */
  function blob(ctx, x, y, r, px) {
    px = Math.max(1, px || 1); if (!(r > 0)) return;
    for (let dy = -r; dy <= r; dy += px) { const w = Math.sqrt(Math.max(0, r * r - dy * dy)), y0 = Math.round(y + dy), y1 = Math.round(y + dy + px); ctx.fillRect(Math.round(x - w), y0, Math.max(px, Math.round(w * 2)), Math.max(1, y1 - y0)); }
  }

  function create(opt) {
    opt = opt || {};
    const reduce = () => (typeof opt.reduce === 'function' ? opt.reduce() : !!opt.reduce);
    const st = { ft: null, dt: 0.016, pools: {}, shapes: {}, bolt: null, flash: 0, nextBolt: 3, thunder: [], off: null };
    function step(t) { if (t !== st.ft) { st.dt = st.ft === null ? 0.016 : Math.min(0.1, Math.max(0, t - st.ft)); st.ft = t; } return st.dt; }
    function pool(key, n, make) { const p = st.pools[key] || (st.pools[key] = []); while (p.length < n) p.push(make(true)); if (p.length > n) p.length = n; return p; }
    const R = Math.random;

    /* ---------------- sky ---------------- */
    function sky(ctx, W, H, t, o) {
      if (!(W >= 1 && H >= 1)) return; // nothing to draw on (a hidden or unsized canvas)
      step(t); const night = o.night || 0, storm = o.storm || 0, h = o.h || H;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, mix(mix(o.top, o.nightTop || '#070b22', night), '#3a4152', storm * .55));
      g.addColorStop(1, mix(mix(o.bottom, o.nightBottom || '#2e3868', night), '#545c6c', storm * .5));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, h);
      const px = o.px || Math.max(2, Math.round(H / 160));
      if (night > 0.05 && o.stars !== false) {
        const n = Math.round(Math.min(160, W * h / 2600)), r = rng(17);
        for (let i = 0; i < n; i++) {
          const x = r() * W, y = r() * h * .75, tw = reduce() ? 1 : .55 + .45 * Math.sin(t * (.8 + (i % 7) * .35) + i), a = night * (1 - storm) * tw * (.35 + r() * .65);
          ctx.fillStyle = rgba('#f4f1ff', a); ctx.fillRect(Math.round(x), Math.round(y), px * (i % 11 === 0 ? 2 : 1) / 2 + .5, px * (i % 11 === 0 ? 2 : 1) / 2 + .5);
          if (i % 23 === 0) { ctx.fillRect(Math.round(x - px), Math.round(y), px * 2.5, 1); ctx.fillRect(Math.round(x + px * .25), Math.round(y - px), 1, px * 2.5); }
        }
      }
      if (o.aurora && night > .2 && !storm) {
        for (let k = 0; k < 3; k++) for (let x = 0; x < W; x += px * 2) {
          const y = h * (.1 + .07 * k) + Math.sin(x * .006 + (reduce() ? 0 : t * .25) + k * 1.7) * h * .05, a = night * .22 * (.5 + .5 * Math.sin(x * .013 + t * (reduce() ? 0 : .6) + k));
          ctx.fillStyle = rgba(k === 1 ? '#8af0d0' : '#7cf08a', a * 1.5); ctx.fillRect(x, y, px * 2, h * .14);
          ctx.fillStyle = rgba('#b48aff', a * .5); ctx.fillRect(x, y + h * .14, px * 2, h * .05);
        }
      }
      if (o.moon !== false && night > .1) {
        const mx = W * (o.moonX || .82), my = h * (o.moonY || .17), mr = Math.max(px * 3, Math.round(H * .045));
        const gl = ctx.createRadialGradient(mx, my, mr * .5, mx, my, mr * 4); gl.addColorStop(0, rgba('#dfe8ff', .22 * night * (1 - storm))); gl.addColorStop(1, rgba('#dfe8ff', 0));
        ctx.fillStyle = gl; ctx.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
        ctx.fillStyle = rgba('#eef0ff', night * (1 - storm * .7)); blob(ctx, mx, my, mr, px);
        ctx.fillStyle = rgba('#c9cfe6', night * (1 - storm * .7)); blob(ctx, mx - mr * .35, my - mr * .2, mr * .25, px); blob(ctx, mx + mr * .3, my + mr * .35, mr * .18, px);
      }
      if (o.sun && night < .8) {
        const sx = W * (o.sunX || .14), sy = h * (o.sunY || .16), sr = Math.max(px * 3, Math.round(H * .05)), a = (1 - night) * (1 - storm);
        const gl = ctx.createRadialGradient(sx, sy, sr * .4, sx, sy, sr * 5); gl.addColorStop(0, rgba('#fff4c8', .35 * a)); gl.addColorStop(1, rgba('#fff4c8', 0));
        ctx.fillStyle = gl; ctx.fillRect(sx - sr * 5, sy - sr * 5, sr * 10, sr * 10); ctx.fillStyle = rgba('#fff6d8', a); blob(ctx, sx, sy, sr, px);
      }
      if (o.clouds) {
        const c = o.clouds, n = c.n || 5, r = rng(31), P = W * 1.6, col = mix(mix(c.col || '#ffffff', '#2a3046', night * .75), '#4a5060', storm * .8);
        for (let i = 0; i < n; i++) {
          const depth = .4 + r() * .6, y = h * ((c.y0 || .08) + r() * ((c.y1 || .4) - (c.y0 || .08))), w = (W * .12 + r() * W * .14) * depth * (1 + storm * .6);
          const x = ((r() * P + (reduce() ? 0 : t) * (c.speed || 6) * depth * (1 + storm)) % P) - W * .3, seed = r() * 1e6;
          ctx.fillStyle = rgba(col, (c.alpha || .85) * (.6 + depth * .4) * (1 - night * .35) + storm * .15);
          const rr = rng(seed | 0), bumps = 4 + Math.floor(rr() * 3);
          for (let b = 0; b < bumps; b++) { const bx = x + (b / (bumps - 1) - .5) * w, br = w * (.18 + rr() * .16); blob(ctx, bx, y - br * .3, br, px); }
          ctx.fillRect(Math.round(x - w * .55), Math.round(y - px), Math.round(w * 1.1), Math.round(w * .16));
        }
      }
    }

    /* ---------------- far scenery ---------------- */
    function shapes(kind, seed, W, H, base, hh) {
      const key = [kind, seed, Math.round(W), Math.round(H), base, hh].join('|'); if (st.shapes[key]) return st.shapes[key];
      const r = rng(seed * 977 + kind.length * 131), P = W * 1.5, out = { P, els: [] }, top = H * base, mh = H * hh;
      const step = { pines: W / 26, oaks: W / 13, dead: W / 9, canopy: W / 4.5, stones: W / 8, reeds: W / 70, ruins: W / 6 }[kind];
      if (kind === 'peaks' || kind === 'mesas' || kind === 'dunes') {
        const n = kind === 'peaks' ? 14 : kind === 'mesas' ? 7 : 10; out.pts = [];
        for (let i = 0; i <= n; i++) out.pts.push([i / n * P, top - (kind === 'dunes' ? .4 + .6 * r() : .35 + .65 * r()) * mh, r()]);
        out.pts[n][1] = out.pts[0][1];
      } else for (let x = 0; x < P; x += step * (.6 + r() * .8)) out.els.push({ x, s: .6 + r() * .6, v: r(), i: out.els.length });
      return (st.shapes[key] = out);
    }
    function far(ctx, W, H, t, o) {
      if (!(W >= 1 && H >= 1)) return; // nothing to draw on (a hidden or unsized canvas)
      step(t); const night = o.night || 0, px = o.px || Math.max(2, Math.round(H / 160)), wind = o.wind || .3, mo = reduce() ? 0 : 1;
      for (const L of o.layers || []) {
        const sh = shapes(L.kind, L.seed || 1, W, H, L.base, L.h), P = sh.P, off = (((o.scroll || 0) * (L.par || .2)) % P + P) % P;
        const col = mix(mix(L.col, '#0b0f22', night * .28), '#e8f0ff', (st.flash || 0) * .35), mh = H * L.h, gy = H * L.base;
        ctx.fillStyle = col;
        for (const rep of [0, P]) {
          const ox = rep - off; if (ox > W || ox + P < 0) continue;
          if (sh.pts) {
            ctx.beginPath(); ctx.moveTo(ox + sh.pts[0][0], H);
            sh.pts.forEach(([x, y], i) => { if (L.kind === 'mesas' && i) { const [px0, py0] = sh.pts[i - 1]; ctx.lineTo(ox + px0 + (x - px0) * .25, y); ctx.lineTo(ox + x - (x - px0) * .25, y); } ctx.lineTo(ox + x, y); });
            ctx.lineTo(ox + P, H); ctx.closePath(); ctx.fill();
            if (L.snow) { ctx.fillStyle = mix('#f4f8ff', '#0b0f22', night * .5); for (const [x, y, v] of sh.pts) if (y < gy - mh * .6) { ctx.beginPath(); ctx.moveTo(ox + x, y); ctx.lineTo(ox + x - mh * .09, y + mh * .14); ctx.lineTo(ox + x + mh * .09, y + mh * .14); ctx.fill(); } ctx.fillStyle = col; }
            if (L.glow) for (const [x, y, v] of sh.pts) if (v > .7) { const g = ctx.createRadialGradient(ox + x, y, 1, ox + x, y, mh * .5); g.addColorStop(0, rgba(L.glow, .45 * (.7 + .3 * Math.sin(t * 2 * mo + v * 9)))); g.addColorStop(1, rgba(L.glow, 0)); ctx.fillStyle = g; ctx.fillRect(ox + x - mh * .5, y - mh * .5, mh, mh); ctx.fillStyle = col; }
            continue;
          }
          for (const e of sh.els) {
            const x = ox + e.x, s = e.s, sway = Math.sin(t * 1.3 * mo + e.i * 1.7) * wind * px * 1.5 * mo; if (x < -W * .2 || x > W * 1.2) continue;
            if (L.kind === 'pines') { const th = mh * s; for (let k = 0; k < 4; k++) { const w = th * (.42 - k * .09), y = gy - th * (.25 + k * .2); ctx.fillRect(Math.round(x - w / 2 + sway * k / 3), Math.round(y), Math.round(w), Math.round(th * .22)); } ctx.fillRect(Math.round(x - px), Math.round(gy - th * .25), px * 2, Math.round(th * .25)); }
            else if (L.kind === 'oaks') { const th = mh * s; ctx.fillRect(Math.round(x - px), Math.round(gy - th * .45), px * 2, Math.round(th * .45)); blob(ctx, x + sway, gy - th * .62, th * .3, px); blob(ctx, x - th * .22 + sway * .7, gy - th * .5, th * .2, px); blob(ctx, x + th * .22 + sway * .7, gy - th * .52, th * .22, px); }
            else if (L.kind === 'canopy') { const th = mh * s; ctx.fillRect(Math.round(x - th * .05), Math.round(gy - th * .7), Math.round(th * .1), Math.round(th * .7)); const sw = sway * 1.6;
              blob(ctx, x + sw, gy - th * .85, th * .32, px); blob(ctx, x - th * .3 + sw * .8, gy - th * .72, th * .24, px); blob(ctx, x + th * .32 + sw * .8, gy - th * .74, th * .26, px);
              if (L.light) { ctx.fillStyle = rgba(L.light, .35 * (1 - night * .5)); blob(ctx, x - th * .08 + sw, gy - th * .98, th * .12, px); ctx.fillStyle = col; } }
            else if (L.kind === 'dead') { const th = mh * s; ctx.fillRect(Math.round(x - px), Math.round(gy - th), px * 2, Math.round(th)); for (let k = 0; k < 4; k++) { const y = gy - th * (.45 + k * .14), dir = k % 2 ? 1 : -1, len = th * (.32 - k * .05); for (let j = 0; j < len; j += px) ctx.fillRect(Math.round(x + dir * j + sway * (j / len)), Math.round(y - j * .45), px, px); } }
            else if (L.kind === 'stones') { const th = mh * s * .6; if (e.v < .4) { ctx.beginPath(); ctx.ellipse(x, gy, th * 1.4, th * .55, 0, Math.PI, 0); ctx.fill(); } else { ctx.save(); ctx.translate(x, gy); ctx.rotate((e.v - .7) * .25); ctx.fillRect(-th * .14, -th, th * .28, th); if (e.v > .85) ctx.fillRect(-th * .45, -th * 1.05, th * .9, th * .14); ctx.restore(); } }
            else if (L.kind === 'reeds') { const th = mh * s; for (let j = 0; j < th; j += px) ctx.fillRect(Math.round(x + sway * 1.5 * (j / th)), Math.round(gy - j), px, px); if (e.v > .7) ctx.fillRect(Math.round(x + sway * 1.5 - px * .5), Math.round(gy - th - px * 2), px * 2, px * 3); }
            else if (L.kind === 'ruins') { const th = mh * s; if (e.v < .5) { ctx.fillRect(x, gy - th, th * .18, th); ctx.fillRect(x + th * .5, gy - th * .7, th * .18, th * .7); ctx.fillRect(x - th * .04, gy - th, th * .5, th * .1); } else ctx.fillRect(x, gy - th * .55 * e.v, th * .2, th * .55 * e.v); }
          }
        }
      }
    }

    /* ---------------- weather ---------------- */
    function weather(ctx, W, H, t, o) {
      if (!(W >= 1 && H >= 1)) return; // nothing to draw on (a hidden or unsized canvas)
      const dt = step(t), px = o.px || Math.max(2, Math.round(H / 160)), wind = o.wind || 0, ground = o.ground || H, area = Math.max(.4, W / 800), still = reduce();
      const mv = still ? 0 : dt;
      if (o.fog) { for (let i = 0; i < 5; i++) { const y = ground - H * (.05 + i * .09), w = W * .7, x = ((t * (8 + i * 3) * (still ? 0 : 1) + i * W * .37) % (W + w)) - w;
          const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, rgba(o.fogCol || '#dfe7ea', 0)); g.addColorStop(.5, rgba(o.fogCol || '#dfe7ea', .22 * o.fog)); g.addColorStop(1, rgba(o.fogCol || '#dfe7ea', 0));
          ctx.fillStyle = g; ctx.fillRect(x, y - H * .06, w, H * .12); } }
      if (o.rain) {
        const n = Math.round(150 * o.rain * area), drops = pool('rain', n, init => ({ x: R() * (W + 100) - 50, y: init ? R() * H : -R() * H * .3, v: 520 + R() * 260, l: 7 + R() * 7, end: o.splashAnywhere ? R() * H : ground - R() * px * 6 }));
        const sp = st.pools.splash || (st.pools.splash = []);
        ctx.strokeStyle = o.rainCol || 'rgba(175,205,255,.55)'; ctx.lineWidth = Math.max(1, px / 2); ctx.beginPath();
        for (const d of drops) {
          d.y += d.v * mv; d.x += wind * d.v * .25 * mv;
          if (d.y >= d.end) { if (sp.length < 120) sp.push({ x: d.x, y: d.end, a: 0 }); d.y = -R() * H * .2; d.x = R() * (W + 100) - 50; d.end = o.splashAnywhere ? R() * H : ground - R() * px * 6; }
          ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - wind * d.l * .5, d.y - d.l);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(200,220,255,.7)';
        for (let i = sp.length - 1; i >= 0; i--) { const s = sp[i]; s.a += dt; if (s.a > .18 || still) { sp.splice(i, 1); continue; } const k = s.a / .18, r = px * (1 + k * 2);
          ctx.globalAlpha = 1 - k; ctx.fillRect(s.x - r, s.y - px * k * 2, px, px); ctx.fillRect(s.x + r, s.y - px * k * 2, px, px); ctx.fillRect(s.x - px / 2, s.y - px * (1 + k * 3), px, px); }
        ctx.globalAlpha = 1; ctx.fillStyle = rgba('#1e2846', .1 * o.rain); ctx.fillRect(0, 0, W, H);
      }
      const drift = (key, n, make, upd, draw) => { const p = pool(key, n, make); for (const q of p) { upd(q); draw(q); } };
      if (o.snow) drift('snow', Math.round(110 * o.snow * area), () => ({ x: R() * W, y: R() * H, v: 18 + R() * 34, s: R() < .3 ? 2 : 1, ph: R() * 6 }),
        q => { q.y += q.v * mv * (1 + wind * .3); q.x += (wind * 40 + Math.sin(t * 1.4 + q.ph) * 14) * mv; if (q.y > ground) { q.y = -4; q.x = R() * W; } if (q.x > W + 5) q.x = -5; if (q.x < -5) q.x = W + 5; },
        q => { ctx.fillStyle = 'rgba(250,252,255,.88)'; ctx.fillRect(Math.round(q.x), Math.round(q.y), px * q.s / 1.5, px * q.s / 1.5); });
      if (o.ash) drift('ash', Math.round(70 * o.ash * area), () => ({ x: R() * W, y: R() * H, v: 14 + R() * 22, ph: R() * 6 }),
        q => { q.y += q.v * mv; q.x += (wind * 30 + Math.sin(t * 2 + q.ph) * 10) * mv; if (q.y > ground) { q.y = -4; q.x = R() * W; } },
        q => { ctx.fillStyle = 'rgba(92,86,84,.75)'; const f = Math.sin(t * 5 + q.ph) > 0; ctx.fillRect(Math.round(q.x), Math.round(q.y), f ? px * 1.5 : px * .75, f ? px * .75 : px * 1.5); });
      if (o.embers) drift('embers', Math.round(40 * o.embers * area), () => ({ x: R() * W, y: ground - R() * H * .9, v: 22 + R() * 40, life: R() * 3, max: 2 + R() * 2.5, ph: R() * 6 }),
        q => { q.y -= q.v * mv; q.x += (Math.sin(t * 3 + q.ph) * 16 + wind * 30) * mv; q.life += mv; if (q.life > q.max || q.y < 0) { q.x = R() * W; q.y = ground - R() * px * 4; q.life = 0; } },
        q => { const k = q.life / q.max, c = k < .4 ? '#ffe28a' : k < .75 ? '#ff8a2a' : '#c0381a'; ctx.fillStyle = rgba(c, .25 * (1 - k)); ctx.fillRect(q.x - px, q.y - px, px * 3, px * 3); ctx.fillStyle = rgba(c, (1 - k) * (.6 + .4 * Math.sin(t * 20 + q.ph))); ctx.fillRect(q.x, q.y, px, px); });
      if (o.spores) drift('spores', Math.round(45 * o.spores * area), () => ({ x: R() * W, y: R() * H, v: 6 + R() * 12, ph: R() * 6 }),
        q => { q.y -= q.v * mv; q.x += (Math.sin(t * .7 + q.ph) * 10 + wind * 14) * mv; if (q.y < -5) { q.y = ground; q.x = R() * W; } },
        q => { const a = .45 + .4 * Math.sin(t * 2 + q.ph); ctx.fillStyle = rgba(o.sporeCol || '#e2e98a', a * .25); ctx.fillRect(q.x - px, q.y - px, px * 3, px * 3); ctx.fillStyle = rgba(o.sporeCol || '#e2e98a', a); ctx.fillRect(q.x, q.y, px, px); });
      if (o.leaves) { const cols = o.leafCols || ['#d08a2a', '#b8552a', '#e0b84a', '#7a9a3a'];
        drift('leaves', Math.round(18 * o.leaves * area), () => ({ x: R() * W, y: R() * H * .8, ph: R() * 6, c: cols[Math.floor(R() * cols.length)], v: 30 + R() * 40 }),
          q => { q.x += (q.v + wind * 60) * mv; q.y += (14 + Math.sin(t * 2 + q.ph) * 22) * mv; if (q.x > W + 8 || q.y > ground) { q.x = -8; q.y = R() * H * .7; } },
          q => { ctx.fillStyle = q.c; const f = Math.floor(t * 6 + q.ph) % 2; ctx.fillRect(Math.round(q.x), Math.round(q.y), f ? px * 2 : px, f ? px : px * 2); }); }
      if (o.dust) drift('dust', Math.round(40 * o.dust * area), () => ({ x: R() * W, y: R() * H, ph: R() * 6 }),
        q => { q.x += Math.sin(t * .4 + q.ph) * 6 * mv; q.y += Math.cos(t * .3 + q.ph) * 4 * mv; },
        q => { ctx.fillStyle = rgba(o.dustCol || '#f2e6c8', .25 + .2 * Math.sin(t + q.ph)); ctx.fillRect(Math.round(q.x), Math.round(q.y), Math.max(1, px / 2), Math.max(1, px / 2)); });
      if (o.fireflies) drift('flies', Math.round(26 * o.fireflies * area), () => ({ bx: R() * W, by: ground - R() * H * .45, ph: R() * 6, sp: 1 + R() * 2 }),
        q => {}, q => { const x = q.bx + Math.sin(t * .5 + q.ph) * 30 + Math.sin(t * 1.3 + q.ph * 2) * 10, y = q.by + Math.cos(t * .4 + q.ph) * 16, b = still ? .6 : Math.pow(Math.max(0, Math.sin(t * q.sp + q.ph)), 3);
          if (b < .02) return; const g = ctx.createRadialGradient(x, y, 0, x, y, px * 5); g.addColorStop(0, rgba(o.flyCol || '#e9ff8a', .55 * b)); g.addColorStop(1, rgba(o.flyCol || '#e9ff8a', 0)); ctx.fillStyle = g; ctx.fillRect(x - px * 5, y - px * 5, px * 10, px * 10);
          ctx.fillStyle = rgba('#fbffd0', b); ctx.fillRect(Math.round(x), Math.round(y), px, px); });
      if (o.wisps) drift('wisps', Math.round(7 * o.wisps * area), () => ({ bx: R() * W, by: ground - H * (.05 + R() * .25), ph: R() * 6 }),
        q => {}, q => { const x = q.bx + Math.sin(t * .3 + q.ph) * 40, y = q.by + Math.sin(t * 1.1 + q.ph) * 8, a = .5 + .3 * Math.sin(t * 2.3 + q.ph);
          const g = ctx.createRadialGradient(x, y, 0, x, y, px * 9); g.addColorStop(0, rgba(o.wispCol || '#bfe4ff', .5 * a)); g.addColorStop(1, rgba(o.wispCol || '#bfe4ff', 0)); ctx.fillStyle = g; ctx.fillRect(x - px * 9, y - px * 9, px * 18, px * 18);
          ctx.fillStyle = rgba('#f0faff', a); ctx.fillRect(Math.round(x - px / 2), Math.round(y - px), px, px * 2); });
      /* lightning: schedule a bolt, then thunder a beat later */
      if (o.storm && !still) {
        st.nextBolt -= dt;
        if (st.nextBolt <= 0) { st.nextBolt = (4 + R() * 10) / Math.max(.3, o.storm); st.bolt = makeBolt(W, ground); st.flash = 1; st.thunder.push({ at: t + .35 + R() * 1.4, vol: .5 + R() * .5 }); }
      }
      for (let i = st.thunder.length - 1; i >= 0; i--) if (t >= st.thunder[i].at) { const v = st.thunder.splice(i, 1)[0].vol; if (o.onThunder) o.onThunder(v); }
    }
    function makeBolt(W, ground) {
      const x0 = W * (.1 + R() * .8), segs = [], branch = [];
      let x = x0, y = 0; const yEnd = ground * (.55 + R() * .35);
      while (y < yEnd) { const nx = x + (R() - .5) * W * .05, ny = y + yEnd / (9 + R() * 5); segs.push([x, y, nx, ny]); if (R() < .22 && branch.length < 3) branch.push([nx, ny, nx + (R() - .5) * W * .12, ny + yEnd * .18]); x = nx; y = ny; }
      return { segs, branch, age: 0 };
    }
    function flash(ctx, W, H, t) {
      if (!(W >= 1 && H >= 1)) return; // nothing to draw on (a hidden or unsized canvas)
      const dt = step(t); if (!st.bolt) return; const b = st.bolt; b.age += dt;
      const f = b.age < .07 ? 1 : b.age < .13 ? .25 : b.age < .22 ? .85 : Math.max(0, .85 - (b.age - .22) * 2.2);
      st.flash = f; if (f <= 0) { st.bolt = null; st.flash = 0; return; }
      ctx.fillStyle = rgba('#dfe6ff', .4 * f); ctx.fillRect(0, 0, W, H);
      if (b.age < .3) {
        for (const [w, a] of [[6, .25], [2.5, .9]]) { ctx.strokeStyle = rgba('#f4f6ff', a * f); ctx.lineWidth = w; ctx.beginPath();
          for (const s of b.segs) { ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]); } for (const s of b.branch) { ctx.moveTo(s[0], s[1]); ctx.lineTo(s[2], s[3]); } ctx.stroke(); }
      }
    }

    /* ---------------- night and light ---------------- */
    function lights(ctx, W, H, t, o) {
      const dark = o.dark || 0; if (dark <= .01 || W < 1 || H < 1) return; const mo = reduce() ? 0 : 1;
      const off = st.off || (st.off = document.createElement('canvas')); if (off.width !== Math.ceil(W) || off.height !== Math.ceil(H)) { off.width = Math.ceil(W); off.height = Math.ceil(H); }
      const c = off.getContext('2d'); c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, off.width, off.height);
      c.fillStyle = rgba(o.tint || '#0a0e2a', dark * (o.max || .62)); c.fillRect(0, 0, off.width, off.height);
      c.globalCompositeOperation = 'destination-out';
      const ls = (o.lights || []).map((l, i) => Object.assign({}, l, { r: l.r * (l.flick ? 1 + (.07 * Math.sin(t * 11 * mo + i * 3) + .05 * Math.sin(t * 23 * mo + i * 7)) * mo : 1) }));
      for (const l of ls) { const g = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.55, 'rgba(0,0,0,.65)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2); }
      ctx.drawImage(off, 0, 0, W, H);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const l of ls) { const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * .8); g.addColorStop(0, rgba(l.col || '#ffb060', (o.glow || .22) * (.35 + .65 * dark))); g.addColorStop(1, rgba(l.col || '#ffb060', 0)); ctx.fillStyle = g; ctx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2); }
      ctx.restore();
    }

    /* ---------------- fire, smoke, embers ---------------- */
    function emit(key, x, y, rate, make, dt) { const p = st.pools[key] || (st.pools[key] = []); const e = st.pools[key + ':acc'] || (st.pools[key + ':acc'] = [0]); e[0] += dt * rate; while (e[0] >= 1 && p.length < 80) { e[0] -= 1; p.push(make(x, y)); } return p; }
    function embers(ctx, x, y, px, t, o) {
      o = o || {}; const dt = reduce() ? 0 : step(t), p = emit('em:' + (o.id || 0), x, y, o.rate || 5, (x, y) => ({ x: x + (R() - .5) * (o.spread || px * 4), y, v: 25 + R() * 35, a: 0, max: .8 + R() * 1.4, ph: R() * 6 }), dt);
      for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; q.a += dt; if (q.a > q.max) { p.splice(i, 1); continue; } q.y -= q.v * dt; q.x += (Math.sin(t * 4 + q.ph) * 12 + (o.wind || 0) * 25) * dt;
        const k = q.a / q.max; ctx.fillStyle = rgba(k < .5 ? '#ffe28a' : '#ff7a2a', 1 - k); ctx.fillRect(Math.round(q.x), Math.round(q.y), px * .75, px * .75); }
    }
    function smoke(ctx, x, y, px, t, o) {
      o = o || {}; const dt = reduce() ? 0 : step(t), p = emit('sm:' + (o.id || 0), x, y, o.rate || 3, (x, y) => ({ x, y, r: px * 1.5, a: 0, max: 2.5 + R(), ph: R() * 6 }), dt);
      for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; q.a += dt; if (q.a > q.max) { p.splice(i, 1); continue; } q.y -= 16 * dt; q.x += ((o.wind || .3) * 14 + Math.sin(t + q.ph) * 4) * dt * (1 + q.a); q.r += px * .9 * dt;
        ctx.fillStyle = rgba(o.col || '#9a9aa4', .32 * (1 - q.a / q.max)); blob(ctx, q.x, q.y, q.r, Math.max(1, px / 2)); }
      if (reduce()) { ctx.fillStyle = rgba(o.col || '#9a9aa4', .2); blob(ctx, x, y - px * 6, px * 3, px); }
    }
    function fire(ctx, x, y, px, t, o) {
      o = o || {}; const s = o.size || 1, mo = reduce() ? 0 : 1, w = 6 * px * s;
      if (o.logs !== false) { ctx.fillStyle = '#5a3a1f'; ctx.fillRect(Math.round(x - w * .7), Math.round(y - px), Math.round(w * 1.4), px * 1.5); ctx.fillStyle = '#7a4a24'; ctx.fillRect(Math.round(x - w * .5), Math.round(y - px * 2), Math.round(w), px * 1.2); }
      const rows = Math.round(7 * s), cols = ['#fff2b0', '#ffd34a', '#ffb02a', '#ff7a2a', '#e0483e'];
      for (let i = 0; i < rows; i++) { const k = i / rows, ww = w * (1 - k) * (.75 + .25 * Math.sin(t * 13 * mo + i * 1.9)), jx = Math.sin(t * 9 * mo + i * 2.3) * px * k * 1.5;
        ctx.fillStyle = cols[Math.min(cols.length - 1, Math.floor(k * cols.length + (Math.sin(t * 17 * mo + i) > .6 ? 1 : 0)))]; ctx.fillRect(Math.round(x - ww / 2 + jx), Math.round(y - px * 2 - (i + 1) * px * s), Math.max(px, Math.round(ww)), Math.ceil(px * s)); }
      if (o.embers !== false) embers(ctx, x, y - px * 4 * s, px, t, { id: (o.id || 0) + 'f', rate: 4 * s, spread: w });
      if (o.smoke) smoke(ctx, x, y - px * (8 + 3 * s) * s, px, t, { id: (o.id || 0) + 'f', wind: o.wind });
      return { x, y: y - px * 4 * s, r: px * 34 * s, col: '#ffa850', flick: true };
    }

    /* ---------------- life ---------------- */
    function life(ctx, W, H, t, o) {
      if (!(W >= 1 && H >= 1)) return; // nothing to draw on (a hidden or unsized canvas)
      const dt = reduce() ? 0 : step(t), y0 = o.y0 || .08, y1 = o.y1 || .4, col = o.col || '#1d2433';
      const fl = pool('life', (o.birds || 0) + (o.bats || 0) + (o.drakes || 0), init => ({}));
      fl.forEach((q, i) => {
        const kind = i < (o.birds || 0) ? 'bird' : i < (o.birds || 0) + (o.bats || 0) ? 'bat' : 'drake';
        if (!q.kind || q.kind !== kind || q.x > W + 60 || q.x < -80) { Object.assign(q, { kind, x: q.kind ? -40 - R() * W * .6 : R() * W, y: H * (y0 + R() * (y1 - y0)), v: kind === 'drake' ? 14 + R() * 10 : kind === 'bat' ? 50 + R() * 30 : 30 + R() * 30, ph: R() * 6 }); }
        q.x += q.v * dt; if (kind === 'bat') q.y += Math.sin(t * 6 + q.ph) * 30 * dt; else q.y += Math.sin(t * .8 + q.ph) * 4 * dt;
        const px = o.px || Math.max(2, Math.round(H / 160)), flap = Math.sin(t * (kind === 'drake' ? 2.5 : kind === 'bat' ? 14 : 8) + q.ph) > 0; ctx.fillStyle = col;
        if (kind === 'bird') { ctx.fillRect(q.x, q.y, px, px); ctx.fillRect(q.x - px, q.y - (flap ? px : 0), px, px); ctx.fillRect(q.x + px, q.y - (flap ? px : 0), px, px); ctx.fillRect(q.x - 2 * px, q.y - (flap ? 2 * px : -px * 0), px, px); ctx.fillRect(q.x + 2 * px, q.y - (flap ? 2 * px : 0), px, px); }
        else if (kind === 'bat') { ctx.fillRect(q.x, q.y, px, px); ctx.fillRect(q.x - 2 * px, q.y + (flap ? -px : px), px * 2, px); ctx.fillRect(q.x + px, q.y + (flap ? -px : px), px * 2, px); }
        else { const s = px * 1.6, wy = flap ? -3 * s : s; ctx.fillRect(q.x - 4 * s, q.y, 9 * s, 2 * s); ctx.fillRect(q.x + 5 * s, q.y - s, 3 * s, 2 * s); ctx.fillRect(q.x - 8 * s, q.y + s, 4 * s, s);
          ctx.beginPath(); ctx.moveTo(q.x - 2 * s, q.y); ctx.lineTo(q.x - 5 * s, q.y + wy); ctx.lineTo(q.x + 3 * s, q.y); ctx.fill(); }
      });
    }
    return { sky, far, weather, flash, lights, fire, smoke, embers, life, get flashing() { return st.flash || 0; } };
  }
  window.Ambience = { create, mix, rgba, blob, rng };
})();
