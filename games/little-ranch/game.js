'use strict';
/* Little Ranch (LR1, the smallest test): a tap-and-play toy for ages 2 to 4 (docs/proposals/games-for-everyone.md).
   One baby Cindercub in a sunny corner of the ranch. Tap the bowl and it eats; drag (or tap) the sponge and it gets
   bubbly; tap the bush for peekaboo; tap the baby and it giggles. After a dozen or so things (or six minutes) it yawns,
   the sky turns orange, a lullaby plays and it curls up asleep: the visit is over. No words to read, nothing to fail,
   no timers to beat, no links out. The way back to the arcade and the sound switch sit behind a grown-up lock (hold
   the corner button for three seconds). Art and sounds are drawn and made in code. Only the sound choice is stored
   (little-ranch-settings-v1); there is no save. Checks: tests/little-ranch.html. */
(function () {
  const VERSION = '0.1.1', PREF = 'little-ranch-settings-v1', BEDTIME_ACTS = 12, BEDTIME_SECS = 360, HOLD_MS = 3000;
  const cv = document.getElementById('ranch'), cx = cv.getContext('2d');
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
  const mixHex = (a, b, k) => { const p = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), q = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
    return 'rgb(' + p.map((v, i) => Math.round(lerp(v, q[i], clamp(k, 0, 1)))).join(',') + ')'; };
  const pick3 = (a, b, c, k) => k < .5 ? mixHex(a, b, k * 2) : mixHex(b, c, (k - .5) * 2);
  let W = 0, H = 0, S = 1, L = {};
  let prefs = { sound: true }; try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREF) || '{}')); } catch (e) {}

  /* ---------------- gentle sound, made live ---------------- */
  let ac = null, master = null;
  function audio() { if (!prefs.sound) return null; if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .16;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; master.connect(lp); lp.connect(ac.destination); } catch (e) { return null; } }
    if (ac.state === 'suspended') ac.resume(); return ac; }
  function tone(f, dur, at, vol, type, slide) { const a = audio(); if (!a) return; const t = a.currentTime + (at || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol || .5, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05); }
  function crunch() { const a = audio(); if (!a) return; const n = a.sampleRate * .06, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1800; g.gain.value = .35; s.buffer = b; s.connect(f); f.connect(g); g.connect(master); s.start(); }
  const NOTES = [523, 587, 659, 784, 880], hz = n => 440 * Math.pow(2, (n - 69) / 12);
  const SFX = {
    plink: () => { tone(880, .18, 0, .3); tone(1175, .22, .08, .25); },
    crunch, giggle: () => [0, .09, .18].forEach((d, i) => tone(700 + i * 120, .1, d, .3, 'triangle', 900 + i * 120)),
    bloop: () => tone(420 + Math.random() * 200, .14, 0, .25, 'sine', 900), pop: () => tone(1200, .06, 0, .3, 'sine', 500),
    rustle: () => { crunch(); setTimeout(crunch, 90); }, boo: () => { tone(392, .16, 0, .4, 'triangle', 523); tone(659, .3, .14, .4, 'triangle', 784); },
    note: () => tone(NOTES[Math.floor(Math.random() * NOTES.length)], .5, 0, .2), yawn: () => tone(440, .9, 0, .3, 'triangle', 262),
    twinkle: () => tone(1568 + Math.random() * 400, .4, 0, .08),
    lullaby: () => { const tune = [67, 64, 0, 67, 64, 0, 69, 67, 64, 62, 60, 0, 0, 62, 64, 67, 64, 62, 60, 0, 0, 0, 64, 62, 60]; // original, slow, soft
      tune.forEach((n, i) => { if (n) { tone(hz(n), .8, i * .55, .28, 'triangle'); if (i % 3 === 0) tone(hz(n - 12), 1.2, i * .55, .12, 'sine'); } }); }
  };
  const sfx = name => { try { SFX[name](); } catch (e) {} };

  /* ---------------- the visit ---------------- */
  let st;
  function newVisit() {
    st = { t: 0, mode: 'play', dusk: 0, acts: 0, baby: { x: 0, tx: null, then: null, dir: 1, act: null, at: 0, soap: 0, happy: 0 },
      bowl: { food: 0 }, sponge: { x: null, y: null, drag: null, auto: null, scrubbed: false }, bubbles: [], fx: [], bush: { shake: 0 }, lullabyAt: null };
    layout(); st.baby.x = L.home.x;
  }
  function layout() {
    const r = cv.getBoundingClientRect(), cssW = Math.max(1, r.width || innerWidth), cssH = Math.max(1, r.height || innerHeight);
    const old = L, oldW = W, oldH = H;
    S = Math.max(2, Math.round(Math.min(cssW, cssH) / 190)); W = Math.ceil(cssW / S); H = Math.ceil(cssH / S);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const U = Math.min(W, H * 1.15), wide = W > H * 1.3, sp = wide ? Math.min(W * .3, U * 1.1) : W * .28; // big screens: things spread out
    L = { U, R: U * .14, ground: H * .56, size: U * .17,
      home: { x: W / 2, y: H * .76 }, bowl: { x: W / 2 - sp, y: H * .84 }, sponge: { x: W / 2 + sp, y: H * .86 }, bush: { x: W / 2 + sp * .8, y: H * .6 }, sun: { x: W * .22, y: H * .17 } };
    if (st && old.U && (W !== oldW || H !== oldH)) {
      // Keep progress between the same places, rather than keeping obsolete canvas pixels.
      // The eating spot includes the baby's size, so a plain width ratio is not enough.
      const moveX = x => {
        const left = x < old.home.x;
        const from = left ? old.bowl.x + old.size * 1.3 : old.bush.x;
        const to = left ? L.bowl.x + L.size * 1.3 : L.bush.x;
        return L.home.x + (x - old.home.x) * (to - L.home.x) / (from - old.home.x);
      };
      st.baby.x = moveX(st.baby.x);
      if (st.baby.tx !== null) st.baby.tx = moveX(st.baby.tx);
      const sx = W / oldW, sy = H / oldH, sz = L.U / old.U;
      const s = st.sponge;
      if (s.drag || s.auto) { s.x *= sx; s.y *= sy; }
      if (s.drag) { s.drag.x *= sx; s.drag.y *= sy; s.drag.moved *= sz; }
      for (const u of st.bubbles) { u.x *= sx; u.y *= sy; u.r *= sz; }
      for (const f of st.fx) { f.x *= sx; f.y *= sy; f.vx *= sx; f.vy *= sy; }
    }
    if (st && !st.sponge.drag && !st.sponge.auto) { st.sponge.x = L.sponge.x; st.sponge.y = L.sponge.y; }
  }
  const busy = () => !!(st.baby.act || st.baby.tx !== null);
  const near = (p, q, r) => Math.hypot(p.x - q.x, p.y - q.y) <= r;
  const babyCentre = () => ({ x: st.baby.x, y: L.home.y - L.size * .9 });
  function go(x, then) { st.baby.tx = x; st.baby.then = then; st.baby.dir = x < st.baby.x ? -1 : 1; }
  function done() { st.acts++; st.baby.happy = 1; for (let i = 0; i < 3; i++) fx('heart', babyCentre().x + (i - 1) * L.size * .5, babyCentre().y - L.size); }
  function fx(kind, x, y) { st.fx.push({ kind, x, y, at: st.t, vx: (Math.random() - .5) * L.U * .2, vy: -L.U * (.15 + Math.random() * .2) }); }
  function home() { go(L.home.x, null); }

  const act = {
    feed() { if (st.baby.act === 'eat' || st.bowl.food > 0) { fx('spark', L.bowl.x, L.bowl.y - L.R * .5); return; }
      st.bowl.food = 1; sfx('plink'); if (st.baby.act === 'hide' || st.baby.act === 'peek') st.baby.act = null;
      go(L.bowl.x + L.size * 1.3, () => { st.baby.dir = -1; st.baby.act = 'eat'; st.baby.at = st.t; }); },
    scrub(p) { // the sponge is on the baby: bubbles
      const b = st.baby; if (b.act === 'hide' || b.act === 'peek' || b.act === 'sleep') return;
      b.soap = Math.min(1, b.soap + .05); if (!(st.t - (st.sponge.lastBubble || -1) < .08)) { st.sponge.lastBubble = st.t; st.bubbles.push({ x: p.x + (Math.random() - .5) * L.size, y: p.y, r: L.U * (.025 + Math.random() * .03), at: st.t, seed: Math.random() * 6 }); if (Math.random() < .4) sfx('bloop'); }
      if (!b.act) { b.act = 'giggle'; b.at = st.t; } st.sponge.scrubbed = true; },
    bath() { if (st.sponge.auto) return; st.sponge.auto = { at: st.t }; },
    peek() { const b = st.baby;
      if (b.act === 'hide') { b.act = 'peek'; b.at = st.t; st.bush.shake = 1; sfx('boo'); return; }
      if (b.act === 'peek') return; st.bush.shake = 1; sfx('rustle'); b.act = null;
      st.bowl.food = 0; // Peekaboo replaces the meal, including a walk toward the bowl.
      go(L.bush.x, () => { b.act = 'hide'; b.at = st.t; }); },
    tickle() { const b = st.baby; if (b.act || b.tx !== null) { sfx('giggle'); return; } b.act = 'giggle'; b.at = st.t; sfx('giggle'); done(); },
    sparkle(p) { fx('spark', p.x, p.y); sfx('note'); }
  };
  function bedtime() { if (st.mode !== 'play') return; st.mode = 'dusk'; st.baby.act = 'yawn'; st.baby.at = st.t; st.bowl.food = 0; sfx('yawn'); st.sponge.drag = null; st.sponge.auto = null; }

  function update(dt) {
    st.t += dt; const b = st.baby, sp = L.U * .9;
    if (b.tx !== null) { const d = b.tx - b.x; if (Math.abs(d) <= sp * dt) { b.x = b.tx; b.tx = null; const f = b.then; b.then = null; if (f) f(); } else b.x += Math.sign(d) * sp * dt; }
    const since = st.t - b.at;
    if (b.act === 'eat') { if (Math.floor(since / .35) !== Math.floor((since - dt) / .35)) { sfx('crunch'); fx('crumb', L.bowl.x + (Math.random() - .5) * L.R, L.bowl.y - L.R * .3); }
      st.bowl.food = clamp(1 - since / 2.4, 0, 1); if (since > 2.4) { b.act = null; st.bowl.food = 0; done(); home(); } }
    if (b.act === 'giggle' && since > .8) { b.act = null; if (!st.sponge.drag && !st.sponge.auto) {} }
    if (b.act === 'hide' && since > 3.5) { b.act = 'peek'; b.at = st.t; st.bush.shake = 1; sfx('boo'); }
    if (b.act === 'peek' && since > 1.4) { b.act = null; done(); home(); }
    if (b.act === 'yawn' && since > 1.6) { b.act = null; home(); }
    // the sponge: dragged, or gliding over by itself after a tap
    const s = st.sponge, bc = babyCentre();
    if (s.auto) { const k = st.t - s.auto.at; if (k < .6) { s.x = lerp(L.sponge.x, bc.x, k / .6); s.y = lerp(L.sponge.y, bc.y, k / .6); }
      else if (k < 2.2) { s.x = bc.x + Math.sin(k * 9) * L.size * .5; s.y = bc.y + Math.cos(k * 7) * L.size * .25; act.scrub(s); }
      else { s.auto = null; if (s.scrubbed) done(); s.scrubbed = false; } }
    else if (!s.drag) { s.x = lerp(s.x, L.sponge.x, Math.min(1, dt * 6)); s.y = lerp(s.y, L.sponge.y, Math.min(1, dt * 6)); }
    b.soap = Math.max(0, b.soap - dt * .08); b.happy = Math.max(0, b.happy - dt * .7); st.bush.shake = Math.max(0, st.bush.shake - dt * 1.5);
    for (const u of st.bubbles) u.y -= L.U * .08 * dt; st.bubbles = st.bubbles.filter(u => st.t - u.at < 7 && u.y > -u.r);
    st.fx = st.fx.filter(f => st.t - f.at < (f.kind === 'zzz' ? 3 : 1.4));
    // bedtime: after enough play, the sky turns orange, then night; a lullaby; the baby curls up
    if (st.mode === 'play' && !busy() && !s.drag && !s.auto && (st.acts >= BEDTIME_ACTS || st.t > BEDTIME_SECS)) bedtime();
    if (st.mode === 'dusk') { st.dusk = Math.min(1, st.dusk + dt / 10);
      if (st.dusk > .25 && st.lullabyAt === null) { st.lullabyAt = st.t; sfx('lullaby'); }
      if (st.dusk > .55 && !busy()) { b.act = 'sleep'; b.at = st.t; }
      if (st.dusk >= 1 && b.act === 'sleep') st.mode = 'sleep'; }
    if (b.act === 'sleep' && Math.floor(st.t / 1.2) !== Math.floor((st.t - dt) / 1.2)) fx('zzz', b.x + L.size * .6, L.home.y - L.size * 1.3);
  }

  /* ---------------- drawing (in code, chunky pixels) ---------------- */
  const R = Math.round;
  function ell(x, y, rx, ry, col) { cx.fillStyle = col; cx.beginPath(); cx.ellipse(R(x), R(y), Math.max(1, R(rx)), Math.max(1, R(ry)), 0, 0, 7); cx.fill(); }
  function shadow(x, y, w) { const k = st.dusk, off = lerp(-1, 1.6, k) * w * .25; ell(x + off, y, w * (1 + k * .3), w * .22, `rgba(40,30,60,${.22 * (1 - st.dusk * .6)})`); }
  function drawBaby() {
    const b = st.baby, z = L.size, t = st.t, since = t - b.at, d = b.dir, m = reduce() ? .3 : 1;
    let x = b.x, y = L.home.y, hop = 0, squash = 1, eyes = 'open', mouth = 0;
    if (b.tx !== null) hop = Math.abs(Math.sin(t * 12)) * z * .18 * m;
    if (b.act === 'giggle') { hop = Math.abs(Math.sin(since * 16)) * z * .25 * m; eyes = 'happy'; mouth = 1; }
    if (b.act === 'eat') { squash = 1 + Math.sin(since * 18) * .05; eyes = 'happy'; }
    if (b.act === 'yawn') { mouth = clamp(Math.sin(since / 1.6 * Math.PI) * 1.6, 0, 1.3); eyes = 'closed'; }
    if (st.baby.happy > 0 && eyes === 'open') eyes = 'happy';
    if (Math.floor(t * 10) % 37 === 0 && eyes === 'open') eyes = 'closed'; // blinks
    const sleep = b.act === 'sleep';
    shadow(x, y, z * 1.1);
    const body = '#e06a32', dark = '#b4471c', cream = '#ffe2b8', ember = '#ffd04a';
    if (sleep) { // curled up: a round bun with the tail wrapped round, breathing
      const br = 1 + Math.sin(t * 1.6) * .03 * m;
      ell(x, y - z * .45, z * 1.05 * br, z * .55 * br, body); ell(x + z * .7, y - z * .3, z * .55, z * .3, dark); ell(x + z * 1.15, y - z * .35, z * .16, z * .14, ember);
      ell(x - z * .55, y - z * .55, z * .5, z * .42, body); ell(x - z * .7, y - z * .42, z * .26, z * .18, cream);
      cx.fillStyle = '#3a2420'; cx.fillRect(R(x - z * .62), R(y - z * .62), R(z * .18), Math.max(1, R(z * .05))); cx.fillRect(R(x - z * .32), R(y - z * .62), R(z * .18), Math.max(1, R(z * .05)));
      cx.beginPath(); cx.moveTo(R(x - z * .85), R(y - z * .85)); cx.lineTo(R(x - z * .7), R(y - z * 1.15)); cx.lineTo(R(x - z * .55), R(y - z * .9)); cx.fillStyle = body; cx.fill();
      return; }
    const by = y - hop;
    // tail with a glowing ember tip
    ell(x - d * z * .85, by - z * .7, z * .3, z * .18, body); ell(x - d * z * 1.1, by - z * .9 - Math.sin(t * 5) * z * .05 * m, z * .17, z * .17, ember);
    // body and short legs
    for (const lx of [-.45, .35]) { cx.fillStyle = dark; cx.fillRect(R(x + lx * z), R(by - z * .35), R(z * .22), R(z * .35 + hop * .5)); }
    ell(x, by - z * .55, z * .78, z * .48 * squash, body); ell(x + d * z * .15, by - z * .45, z * .45, z * .26, cream);
    // the big baby head
    const hx = x + d * z * .42, hy = by - z * 1.25 + (b.act === 'eat' ? Math.abs(Math.sin(since * 9)) * z * .25 : 0), hr = z * .66;
    for (const s of [-1, 1]) { cx.fillStyle = body; cx.beginPath(); cx.moveTo(R(hx + s * hr * .75), R(hy - hr * .25)); cx.lineTo(R(hx + s * hr * .55), R(hy - hr * 1.2)); cx.lineTo(R(hx + s * hr * .1), R(hy - hr * .7)); cx.fill();
      cx.fillStyle = '#ff9a8a'; cx.beginPath(); cx.moveTo(R(hx + s * hr * .6), R(hy - hr * .45)); cx.lineTo(R(hx + s * hr * .52), R(hy - hr * .95)); cx.lineTo(R(hx + s * hr * .28), R(hy - hr * .65)); cx.fill(); }
    ell(hx, hy, hr, hr * .9, body); ell(hx + d * hr * .2, hy + hr * .35, hr * .52, hr * .38, cream);
    ell(hx - hr * .5, hy + hr * .2, hr * .16, hr * .1, '#ff9a8a'); ell(hx + hr * .62, hy + hr * .2, hr * .16, hr * .1, '#ff9a8a');
    for (const s of [-1, 1]) { const ex = hx + s * hr * .38 + d * hr * .1, ey = hy - hr * .05;
      if (eyes === 'open') { ell(ex, ey, hr * .17, hr * .21, '#2a1a18'); ell(ex - hr * .05, ey - hr * .08, hr * .06, hr * .06, '#fff'); }
      else { cx.fillStyle = '#2a1a18'; const w = hr * .3; cx.fillRect(R(ex - w / 2), R(ey + (eyes === 'happy' ? -hr * .04 : 0)), R(w), Math.max(1, R(hr * .07))); if (eyes === 'happy') { cx.fillRect(R(ex - w / 2), R(ey + hr * .03), Math.max(1, R(hr * .07)), Math.max(1, R(hr * .06))); cx.fillRect(R(ex + w / 2 - hr * .07), R(ey + hr * .03), Math.max(1, R(hr * .07)), Math.max(1, R(hr * .06))); } } }
    ell(hx + d * hr * .25, hy + hr * .22, hr * .1, hr * .07, '#3a2420');
    if (mouth) ell(hx + d * hr * .22, hy + hr * .48, hr * .14 * mouth, hr * .12 * mouth, '#8a2a2a');
    if (b.soap > .05) for (let i = 0; i < 6; i++) ell(x + Math.cos(i * 2.1) * z * .6, by - z * (.7 + .5 * Math.sin(i * 1.7)), z * .12 * b.soap + 1, z * .1 * b.soap + 1, 'rgba(255,255,255,.85)');
  }
  function drawBush(front) {
    const b = L.bush, r = L.R * 1.25, sh = Math.sin(st.t * 30) * st.bush.shake * r * .08 * (reduce() ? .3 : 1), g = st.dusk;
    if (!front) shadow(b.x, b.y + r * .2, r);
    const c1 = pick3('#3f9a48', '#4a7a3a', '#1e3a34', g), c2 = pick3('#5cba5a', '#6a9a48', '#2a4a40', g);
    ell(b.x + sh - r * .55, b.y - r * .3, r * .6, r * .55, c1); ell(b.x + sh + r * .55, b.y - r * .3, r * .6, r * .55, c1); ell(b.x + sh, b.y - r * .6, r * .75, r * .65, c2);
    for (let i = 0; i < 4; i++) ell(b.x + sh + Math.cos(i * 1.6) * r * .6, b.y - r * (.55 + .2 * Math.sin(i * 2)), r * .08, r * .08, g > .6 ? '#c8c0e8' : '#ffd0e0');
  }
  function draw() {
    const g = st.dusk, U = L.U;
    const sky = cx.createLinearGradient(0, 0, 0, L.ground); sky.addColorStop(0, pick3('#6cbcec', '#e8805a', '#121a44', g)); sky.addColorStop(1, pick3('#d4eef8', '#ffd08a', '#3a3a70', g));
    cx.fillStyle = sky; cx.fillRect(0, 0, W, L.ground + 1);
    if (g > .55) { cx.fillStyle = `rgba(255,255,230,${clamp((g - .55) * 2.2, 0, 1)})`; for (let i = 0; i < 40; i++) { const x = (i * 97.3) % W, y = (i * 53.7) % (L.ground * .8), tw = .6 + .4 * Math.sin(st.t * 2 + i); if (tw > .5) cx.fillRect(R(x), R(y), 1, 1); } }
    const sunY = lerp(L.sun.y, L.ground + U * .1, clamp(g * 1.6, 0, 1)); ell(L.sun.x, sunY, U * .09, U * .09, pick3('#fff4b0', '#ffb050', '#ff8040', g)); ell(L.sun.x, sunY, U * .13, U * .13, `rgba(255,240,180,${.25 * (1 - g)})`);
    if (g > .6) { const k = clamp((g - .6) / .4, 0, 1); ell(W * .8, lerp(L.ground, H * .16, k), U * .07, U * .07, '#f4f0d8'); ell(W * .8 + U * .03, lerp(L.ground, H * .16, k) - U * .02, U * .06, U * .06, pick3('#121a44', '#121a44', '#121a44', 1)); }
    ell(W * .25, L.ground + U * .05, W * .45, U * .22, pick3('#8acb6a', '#a0a050', '#2a4a48', g)); ell(W * .8, L.ground + U * .07, W * .4, U * .18, pick3('#7abf5c', '#909848', '#24423f', g));
    cx.fillStyle = pick3('#7cc85a', '#b0a050', '#2a4a40', g); cx.fillRect(0, R(L.ground), W, H - R(L.ground));
    cx.fillStyle = pick3('#a87a4a', '#a06a3a', '#3a2e38', g); const fy = L.ground + U * .02; cx.fillRect(0, R(fy), W, Math.max(1, R(U * .025))); cx.fillRect(0, R(fy + U * .07), W, Math.max(1, R(U * .025)));
    for (let x = W * .05; x < W; x += U * .3) cx.fillRect(R(x), R(fy - U * .03), Math.max(2, R(U * .03)), R(U * .14));
    for (let i = 0; i < 30; i++) { const x = (i * 61.7) % W, y = L.ground + U * .2 + (i * 37.1) % (H - L.ground - U * .2); cx.fillStyle = pick3('#5aa848', '#8a8a40', '#1e3a36', g); cx.fillRect(R(x), R(y), 1, 2); }
    const hidden = st.baby.act === 'hide' || st.baby.act === 'peek';
    if (!hidden) drawBush(false);
    // the bowl
    const bw = L.R; shadow(L.bowl.x, L.bowl.y, bw); ell(L.bowl.x, L.bowl.y - bw * .25, bw, bw * .45, pick3('#4a90d8', '#5a7ab8', '#2a3a68', g)); ell(L.bowl.x, L.bowl.y - bw * .45, bw * .82, bw * .2, '#2a4a7a');
    if (st.bowl.food > 0) for (let i = 0; i < 9 * st.bowl.food; i++) ell(L.bowl.x + (i % 5 - 2) * bw * .3, L.bowl.y - bw * (.5 + (i % 2) * .12), bw * .14, bw * .11, '#c8823a');
    if (hidden) { // peekaboo: behind the bush, then up comes the head
      const k = st.baby.act === 'peek' ? Math.sin(clamp((st.t - st.baby.at) / 1.4, 0, 1) * Math.PI) : 0, save = st.baby.x;
      const base = L.bush.y + L.R * .3; cx.save(); cx.beginPath(); cx.rect(0, 0, W, R(base)); cx.clip(); // only what rises above the bush's foot shows
      cx.translate(0, L.bush.y - L.home.y + L.size * .9 - k * L.size * 1.4); st.baby.x = L.bush.x; drawBaby(); st.baby.x = save; cx.restore(); drawBush(true); }
    else drawBaby();
    // the sponge
    const s = st.sponge, sw = L.R * .8; if (!s.drag && !s.auto) shadow(s.x, s.y + sw * .3, sw);
    cx.save(); cx.translate(R(s.x), R(s.y)); cx.rotate(s.drag || s.auto ? Math.sin(st.t * 10) * .2 : 0);
    cx.fillStyle = pick3('#ffd84a', '#ffc04a', '#6a6040', g); cx.fillRect(R(-sw), R(-sw * .55), R(sw * 2), R(sw * 1.1)); cx.fillStyle = 'rgba(200,140,40,.6)';
    for (const [a, c] of [[-.5, -.2], [.3, .1], [-.1, .25], [.6, -.25]]) cx.fillRect(R(a * sw), R(c * sw), Math.max(1, R(sw * .16)), Math.max(1, R(sw * .16))); cx.restore();
    for (const u of st.bubbles) { const x = u.x + Math.sin(st.t * 2 + u.seed) * u.r * .8; cx.strokeStyle = 'rgba(255,255,255,.9)'; cx.lineWidth = 1; cx.beginPath(); cx.arc(R(x), R(u.y), Math.max(2, R(u.r)), 0, 7); cx.stroke();
      ell(x, u.y, u.r, u.r, 'rgba(200,230,255,.25)'); ell(x - u.r * .35, u.y - u.r * .35, u.r * .2 + .5, u.r * .2 + .5, '#fff'); }
    for (const f of st.fx) { const k = st.t - f.at, x = f.x + f.vx * k, y = f.y + f.vy * k, a = clamp(1 - k / 1.4, 0, 1);
      if (f.kind === 'heart') { const r = U * .035; cx.fillStyle = `rgba(255,90,120,${a})`; ell(x - r * .5, y, r * .6, r * .6, cx.fillStyle); ell(x + r * .5, y, r * .6, r * .6, cx.fillStyle); cx.beginPath(); cx.moveTo(R(x - r * 1.05), R(y + r * .15)); cx.lineTo(R(x), R(y + r * 1.3)); cx.lineTo(R(x + r * 1.05), R(y + r * .15)); cx.fill(); }
      else if (f.kind === 'spark') { cx.fillStyle = `rgba(255,240,150,${a})`; const r = U * .03 * (1 + k); cx.fillRect(R(f.x - r), R(f.y), R(r * 2), 1); cx.fillRect(R(f.x), R(f.y - r), 1, R(r * 2)); }
      else if (f.kind === 'crumb') ell(f.x + f.vx * k * .5, f.y - U * .1 * k + U * .3 * k * k, U * .012, U * .012, `rgba(200,130,58,${a})`);
      else if (f.kind === 'zzz') { const zz = clamp(1 - k / 3, 0, 1), r = U * .03 * (1 + k * .4); cx.strokeStyle = `rgba(230,230,255,${zz})`; cx.lineWidth = 1; cx.beginPath(); const zx = f.x + k * U * .05, zy = f.y - k * U * .08;
        cx.moveTo(R(zx - r), R(zy - r)); cx.lineTo(R(zx + r), R(zy - r)); cx.lineTo(R(zx - r), R(zy + r)); cx.lineTo(R(zx + r), R(zy + r)); cx.stroke(); } }
    if (g > 0) { cx.fillStyle = `rgba(20,20,60,${g * .25})`; cx.fillRect(0, 0, W, H); }
  }

  /* ---------------- touch and mouse ---------------- */
  const at = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); audio(); const p = at(e), s = st.sponge;
    if (st.mode !== 'play') { fx('spark', p.x, p.y); sfx('twinkle'); return; } // bedtime: taps only twinkle, the baby stays asleep
    const bub = st.bubbles.find(u => Math.hypot(u.x - p.x, u.y - p.y) < u.r * 1.8 + L.U * .02);
    if (bub) { st.bubbles.splice(st.bubbles.indexOf(bub), 1); fx('spark', bub.x, bub.y); sfx('pop'); return; }
    if (!s.auto && near(p, s, L.R * 1.1)) { s.drag = { id: e.pointerId, x: p.x, y: p.y, at: performance.now(), moved: 0 }; try { cv.setPointerCapture(e.pointerId); } catch (err) {} return; }
    if (near(p, L.bowl, L.R * 1.2)) return act.feed();
    if (near(p, { x: L.bush.x, y: L.bush.y - L.R * .4 }, L.R * 1.4)) return act.peek();
    if (st.baby.act !== 'hide' && near(p, babyCentre(), L.size * 1.2)) return act.tickle();
    act.sparkle(p);
  });
  cv.addEventListener('pointermove', e => { const s = st.sponge; if (!s.drag || s.drag.id !== e.pointerId) return; const p = at(e);
    s.drag.moved += Math.hypot(p.x - s.x, p.y - s.y); s.x = p.x; s.y = p.y; if (near(p, babyCentre(), L.size * 1.3)) act.scrub(p); });
  const release = e => { const s = st.sponge; if (!s.drag || s.drag.id !== e.pointerId) return;
    const tap = s.drag.moved < L.R * .5 && performance.now() - s.drag.at < 500; s.drag = null;
    if (tap) act.bath(); else if (s.scrubbed) { s.scrubbed = false; done(); } };
  cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release);
  addEventListener('contextmenu', e => e.preventDefault());

  /* ---------------- the grown-up lock: hold three seconds ---------------- */
  const lock = document.getElementById('lock'), ring = document.getElementById('lockRing'), panel = document.getElementById('grown');
  let hold = null, idle = null;
  function holdStart(e) { if (e) e.preventDefault(); if (hold) return; hold = { at: performance.now() }; (function tick() { if (!hold) return; const k = Math.min(1, (performance.now() - hold.at) / HOLD_MS);
    ring.setAttribute('stroke-dashoffset', String(119.4 * (1 - k))); if (k >= 1) { hold = null; ring.setAttribute('stroke-dashoffset', '119.4'); openPanel(); } else requestAnimationFrame(tick); })(); }
  function holdEnd() { hold = null; ring.setAttribute('stroke-dashoffset', '119.4'); }
  lock.addEventListener('pointerdown', holdStart); ['pointerup', 'pointerleave', 'pointercancel'].forEach(n => lock.addEventListener(n, holdEnd));
  lock.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) holdStart(e); }); lock.addEventListener('keyup', holdEnd);
  lock.addEventListener('click', e => e.preventDefault());
  function soundLabel() { document.getElementById('gSoundLabel').textContent = prefs.sound ? 'Sound on' : 'Sound off'; }
  function openPanel() { panel.hidden = false; soundLabel(); clearTimeout(idle); idle = setTimeout(closePanel, 20000); }
  function closePanel() { panel.hidden = true; clearTimeout(idle); }
  document.getElementById('gClose').onclick = closePanel;
  document.getElementById('gNew').onclick = () => { newVisit(); closePanel(); };
  document.getElementById('gSound').onclick = () => { prefs.sound = !prefs.sound; try { localStorage.setItem(PREF, JSON.stringify(prefs)); } catch (e) {} if (!prefs.sound && ac) { ac.close(); ac = null; } soundLabel(); idle && (clearTimeout(idle), idle = setTimeout(closePanel, 20000)); };

  /* ---------------- run ---------------- */
  newVisit(); addEventListener('resize', layout);
  let last = performance.now();
  (function loop(now) { const dt = Math.min(.1, (now - last) / 1000); last = now; layout(); update(dt); draw(); requestAnimationFrame(loop); })(last);
  // for the checks (tests/little-ranch.html): the state, the places, and a way to move time on
  window.LR = { VERSION, PREF, BEDTIME_ACTS, HOLD_MS, get state() { return st; }, get layout() { return L; }, get scale() { return S; }, act, bedtime, newVisit, openPanel,
    advance(secs) { for (let k = 0; k < secs; k += 1 / 30) update(1 / 30); draw(); },
    toScreen(p) { const r = cv.getBoundingClientRect(); return { x: r.left + p.x / W * r.width, y: r.top + p.y / H * r.height }; } };
})();

