/* The light engine (S6 / G1, 2026-10-09): light, shadow and atmosphere for every Generations game, drawn in code.
   Inspired by WoW: Forever's renderer (Evan: "paying attention to the details of the lighting and the shadows greatly
   affects the overall look"): shadows that line up with the sun and moon and move through the day, bounce light that
   carries colour into the shade, fog you move through that light scatters in, and real torchlight. In our pixel style:
   - Light.create({ reduce, quality }) -> lt
   - lt.time(t01): the sky at a time of day. t01: 0 sunrise, .25 noon, .5 sunset, .75 midnight. Returns a state
     { t, day, sunX, elev, light, ambient, shade, shadow: { sx, sy, alpha }, grade, night }.
     Light.cycle(k, sunrise, sunset) turns a game's own day fraction into t01.
   - lt.cast(ctx, draw, box, baseY, st, o): a sprite's real silhouette, laid on the ground along the light, soft-edged
     and tinted by bounce light. draw(c) paints the sprite; box = [left, top, w, h] in the same coordinates.
     o: { from: [x, y] } casts away from a point light instead (torches at night), { k } scales strength.
   - lt.fog(ctx, W, H, t, { ground, top, density, col, lights, drift }): volumetric-looking fog: drifting noise,
     heavier near the ground, with halos where lights scatter through it.
   - lt.shafts(ctx, W, H, t, st, { strength, from }): light shafts from a low sun or moon.
   - lt.grade(ctx, W, H, st, { tint, amount }): the colour of the hour (golden, blue, night) and a soft vignette.
   - lt.bloom(ctx, canvas, W, H, st): bright lights bleed softly (High quality, where canvas filters exist).
   Respects reduced motion (no drifting fog or shimmering shafts) and has a Low quality for slow devices.          */
(function () {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, v) => { const k = clamp((v - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
  function rgb(c) { if (Array.isArray(c)) return c; if (c[0] === '#') { let h = c.slice(1); if (h.length === 3) h = [...h].map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); } return (String(c).match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number); }
  function mix(a, b, k) { const p = rgb(a), q = rgb(b); k = clamp(k, 0, 1); return [0, 1, 2].map(i => Math.round(p[i] + (q[i] - p[i]) * k)); }
  const css = (c, a) => { const p = rgb(c); return a === undefined ? `rgb(${p.join(',')})` : `rgba(${p.join(',')},${clamp(a, 0, 1).toFixed(3)})`; };
  /* a game's own clock (k in 0..1, with its sunrise and sunset) as t01 */
  function cycle(k, sunrise, sunset) {
    k = ((k % 1) + 1) % 1; const dayLen = ((sunset - sunrise) % 1 + 1) % 1, since = ((k - sunrise) % 1 + 1) % 1;
    return since < dayLen ? since / dayLen * .5 : .5 + (since - dayLen) / (1 - dayLen) * .5;
  }

  function create(opt) {
    opt = opt || {};
    const reduce = () => (typeof opt.reduce === 'function' ? opt.reduce() : !!opt.reduce);
    const quality = () => (typeof opt.quality === 'function' ? opt.quality() : opt.quality || 'high');
    const mk = () => { const c = document.createElement('canvas'); return [c, c.getContext('2d')]; };
    const [scr, sx] = mk(), [noise, nx] = mk(), [fogc, fx] = mk(), [blm, bx] = mk();
    const filterOK = 'filter' in sx;
    /* soft value noise, made once: the texture the fog drifts with */
    (function makeNoise() {
      noise.width = 256; noise.height = 128; const img = nx.createImageData(256, 128), g = [], G = 17;
      let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      for (let i = 0; i < G * 9; i++) g.push(r());
      const at = (x, y) => g[(y % 9) * G + (x % G)];
      for (let y = 0; y < 128; y++) for (let x = 0; x < 256; x++) {
        let v = 0, a = 1, f = 1 / 32, tot = 0;
        for (let o = 0; o < 3; o++) { const X = x * f * (256 / 256), Y = y * f, x0 = Math.floor(X), y0 = Math.floor(Y), tx = X - x0, ty = Y - y0, sm = q => q * q * (3 - 2 * q);
          const v0 = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sm(tx), v1 = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sm(tx);
          v += (v0 + (v1 - v0) * sm(ty)) * a; tot += a; a *= .5; f *= 2; }
        v /= tot; const i = (y * 256 + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = Math.round(clamp((v - .3) * 1.8, 0, 1) * 255);
      }
      nx.putImageData(img, 0, 0);
    })();

    /* ---------------- the sky's light at a time of day ---------------- */
    function time(t01, o) {
      o = o || {}; const t = ((t01 % 1) + 1) % 1, day = t < .5, p = day ? t / .5 : (t - .5) / .5;
      const sunX = -Math.cos(p * Math.PI), elev = Math.sin(p * Math.PI);  // across the sky, height above the horizon
      const golden = day ? 1 - smooth(.05, .45, elev) : 0, dawn = day && p < .5;
      const night = day ? 0 : smooth(0, .25, elev) * .6 + .4;
      const light = day ? mix(mix('#fff6e4', dawn ? '#ffb48a' : '#ffa850', golden), '#ff7a50', golden * golden * .5) : mix('#7088c0', '#a8c0ff', elev);
      const sky = o.sky || (day ? mix('#9cc4e8', '#f0a878', golden * .8) : '#1c2448'), ground = o.ground || '#4a6a3a';
      const ambient = mix(sky, ground, .35);                           // bounce: sky light plus colour off the ground
      const shade = mix(mix(ambient, '#000000', .55), '#101828', day ? 0 : .5);
      const len = day ? clamp(.35 / (elev + .12), .45, 3.2) : clamp(.25 / (elev + .2), .3, 1.4);
      const shadow = { sx: -sunX * len, sy: .32 * (.6 + .4 * (1 - elev)) * (day ? 1 : .8), alpha: day ? .52 * smooth(0, .12, elev) + .08 : .2 * elev + .05 };
      const grade = day ? { col: mix('#fff0d0', '#ff9a50', golden), amt: .08 + golden * .22 } : { col: '#3048a0', amt: .22 };
      return { t, day, p, sunX, elev, light, ambient, shade, shadow, grade, night, golden };
    }

    /* ---------------- shadows: the sprite's own silhouette, laid along the light ---------------- */
    function cast(c, draw, box, baseY, st, o) {
      o = o || {}; let [L, T, Wd, Ht] = box; L = Math.floor(L); T = Math.floor(T); Wd = Math.ceil(Wd); Ht = Math.ceil(Ht);
      if (Wd < 2 || Ht < 2) return;
      let { sx: shx, sy: shy, alpha } = st.shadow;
      if (o.from) { // a point light: the shadow falls away from it, longer the closer the light is to the ground
        const cxp = L + Wd / 2, dx = cxp - o.from[0], dy = baseY - o.from[1], d = Math.hypot(dx, dy) || 1, reach = o.reach || 200;
        const k = clamp(1 - d / reach, 0, 1); if (k <= .02) return;
        shx = dx / d * 1.4; shy = clamp(dy / d, -.2, 1) * .45 + .1; alpha = .28 * k;
      }
      alpha *= o.k === undefined ? 1 : o.k; if (alpha <= .01) return;
      if (quality() === 'low') { c.fillStyle = css(st.shade, alpha); c.beginPath(); c.ellipse(L + Wd / 2 + shx * Ht * .25, baseY + shy * Ht * .2, Wd * .45 + Math.abs(shx) * Ht * .25, Wd * .14, 0, 0, 7); c.fill(); return; }
      const pad = 2; if (scr.width < Wd + pad * 2 || scr.height < Ht + pad * 2) { scr.width = Math.max(scr.width, Wd + pad * 2); scr.height = Math.max(scr.height, Ht + pad * 2); }
      sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalCompositeOperation = 'source-over'; sx.clearRect(0, 0, Wd + pad * 2, Ht + pad * 2);
      sx.save(); sx.translate(pad - L, pad - T); draw(sx); sx.restore();
      sx.globalCompositeOperation = 'source-in'; sx.fillStyle = css(st.shade); sx.fillRect(0, 0, Wd + pad * 2, Ht + pad * 2); sx.globalCompositeOperation = 'source-over';
      // point (x, y) at height (baseY - y) lands at (x + h*shx, baseY + h*shy): an affine map
      c.save(); c.globalAlpha = alpha;
      if (filterOK && quality() === 'high') c.filter = `blur(${Math.max(.6, Ht / 40).toFixed(1)}px)`;
      c.transform(1, 0, -shx, -shy, shx * baseY, baseY * (1 + shy));
      c.drawImage(scr, 0, 0, Wd + pad * 2, Ht + pad * 2, L - pad, T - pad, Wd + pad * 2, Ht + pad * 2);
      c.restore();
    }
    /* a soft contact shadow right under something: it sits on the ground */
    function contact(c, x, y, w, st, k) { const g = c.createRadialGradient(x, y, 0, x, y, w); g.addColorStop(0, css(st.shade, .45 * (k || 1))); g.addColorStop(1, css(st.shade, 0));
      c.save(); c.translate(x, y); c.scale(1, .28); c.translate(-x, -y); c.fillStyle = g; c.fillRect(x - w, y - w, w * 2, w * 2); c.restore(); }

    /* ---------------- fog you move through ---------------- */
    function fog(c, W, H, t, o) {
      if (!(W >= 1 && H >= 1) || !(o.density > 0)) return;
      const ground = o.ground || H, top = o.top === undefined ? H * .45 : o.top, mo = reduce() ? 0 : 1, col = o.col || '#dfe7ea';
      if (fogc.width !== Math.ceil(W) || fogc.height !== Math.ceil(H)) { fogc.width = Math.ceil(W); fogc.height = Math.ceil(H); }
      fx.globalCompositeOperation = 'source-over'; fx.clearRect(0, 0, W, H); fx.imageSmoothingEnabled = true;
      // two layers of drifting noise, stretched wide, heavier near the ground
      for (const [sc, sp, a] of [[1.6, 6, .9], [2.6, -3.5, .7]]) {
        const tw = 256 * sc * (W / 400), th = 128 * sc * (H / 260), off = ((t * sp * (o.drift || 1) * mo) % tw + tw) % tw;
        fx.globalAlpha = a; for (let x = -off; x < W; x += tw) for (let y = top - th * .25; y < ground + th * .2; y += th * .9) fx.drawImage(noise, x, y, tw, th);
      }
      fx.globalAlpha = 1; fx.globalCompositeOperation = 'source-in'; fx.fillStyle = css(col); fx.fillRect(0, 0, W, H);
      fx.globalCompositeOperation = 'destination-in'; const g = fx.createLinearGradient(0, top, 0, ground);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.55, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,1)'); fx.fillStyle = g; fx.fillRect(0, 0, W, H);
      fx.globalCompositeOperation = 'source-over';
      c.save(); c.globalAlpha = clamp(o.density, 0, 1) * .75; c.drawImage(fogc, 0, 0, W, H); c.restore();
      // light scatters in the fog: halos around lamps and fires
      if (o.lights && o.lights.length) { c.save(); c.globalCompositeOperation = 'lighter';
        for (const l of o.lights) { const r = l.r * 1.25, gg = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, r); gg.addColorStop(0, css(l.col || '#ffc070', .22 * clamp(o.density, 0, 1.2))); gg.addColorStop(1, css(l.col || '#ffc070', 0));
          c.fillStyle = gg; c.fillRect(l.x - r, l.y - r, r * 2, r * 2); }
        c.restore(); }
    }

    /* ---------------- light shafts from a low sun or moon ---------------- */
    function shafts(c, W, H, t, st, o) {
      o = o || {}; const low = st.day ? smooth(.1, .55, 1 - st.elev) * smooth(0, .08, st.elev) : st.elev * .6, s = (o.strength === undefined ? 1 : o.strength) * low;
      if (s <= .02 || !(W >= 1)) return; const mo = reduce() ? 0 : 1;
      const from = o.from || [W * (.5 + st.sunX * .55), -H * .15], col = st.light;
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) {
        const ang = Math.PI / 2 - st.sunX * .5 + (i - 3) * .09 + Math.sin(t * .15 * mo + i * 1.7) * .02, len = H * 1.6, wdt = W * (.025 + (i % 3) * .015);
        const ex = from[0] + Math.cos(ang) * len, ey = from[1] + Math.sin(ang) * len, nx2 = -Math.sin(ang) * wdt, ny2 = Math.cos(ang) * wdt;
        const g = c.createLinearGradient(from[0], from[1], ex, ey); const a = s * (.05 + .035 * Math.sin(t * .3 * mo + i * 2.1));
        g.addColorStop(0, css(col, a)); g.addColorStop(.7, css(col, a * .5)); g.addColorStop(1, css(col, 0));
        c.fillStyle = g; c.beginPath(); c.moveTo(from[0], from[1]); c.lineTo(ex + nx2, ey + ny2); c.lineTo(ex - nx2, ey - ny2); c.closePath(); c.fill();
      }
      c.restore();
    }

    /* ---------------- the colour of the hour ---------------- */
    function grade(c, W, H, st, o) {
      o = o || {}; if (!(W >= 1)) return; const amt = (o.amount === undefined ? 1 : o.amount) * st.grade.amt; c.save();
      c.globalCompositeOperation = 'soft-light'; c.fillStyle = css(o.tint ? mix(st.grade.col, o.tint, .35) : st.grade.col, amt * 2.2); c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'source-over';
      const vg = c.createRadialGradient(W / 2, H * .55, Math.min(W, H) * .35, W / 2, H * .55, Math.max(W, H) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, css(st.shade, .32)); c.fillStyle = vg; c.fillRect(0, 0, W, H);
      c.restore();
    }
    /* ---------------- bloom: bright things bleed softly ---------------- */
    function bloom(c, canvas, W, H, st, o) {
      if (!filterOK || quality() !== 'high' || !(W >= 1)) return; o = o || {};
      const w = Math.ceil(W / 3), h = Math.ceil(H / 3); if (blm.width !== w || blm.height !== h) { blm.width = w; blm.height = h; }
      bx.filter = 'brightness(.55) contrast(3.2) blur(3px)'; bx.clearRect(0, 0, w, h); bx.drawImage(canvas, 0, 0, w, h); bx.filter = 'none';
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (o.amount || .35) * (st.day ? .6 : 1); c.drawImage(blm, 0, 0, canvas.width, canvas.height); c.restore();
    }
    return { time, cast, contact, fog, shafts, grade, bloom, quality };
  }
  window.Light = { create, cycle, mix, css };
})();
