'use strict';
/* Little Ranch (LR1, the smallest test): a tap-and-play toy for ages 2 to 4 (docs/proposals/games-for-everyone.md).
   One baby Cindercub in a sunny corner of the ranch. Tap the bowl and it eats; drag (or tap) the sponge and it gets
   bubbly; tap the bush for peekaboo; tap the baby and it giggles. After a dozen or so things (or six minutes) it yawns,
   the sky turns orange, a lullaby plays and it curls up asleep: the visit is over. No words to read, nothing to fail,
   no timers to beat, no links out. The way back to the arcade and the sound switch sit behind a grown-up lock (hold
   the corner button for three seconds). Art and sounds are drawn and made in code. Only the sound choice is stored
   (little-ranch-settings-v1); there is no save. Once it's asleep, six taps on it wake it up for a fresh sunny day (LR12):
   each tap makes it stir and its zzz shrink. In the daytime, tapping the sun brightens it, and the fifth tap brings a
   rainbow over the field while the baby cheers (LR13). At night, three taps on the moon play Twinkle Twinkle Little Star
   while the stars twinkle and the baby sleeps on (LR14). A paint-drip sign at the ranch's edge leads to the Paint Shed
   (LR9): four fat pots and a big outline of the baby; tap a pot, tap (or drag over) a part to fill it; when every part
   is coloured, sparkles, and the painted baby walks back out to the ranch in its colours until bedtime. The barn
   picture goes home at any time. Nothing is saved. Checks: tests/little-ranch.html. */
(function () {
  const VERSION = '0.9.0', PREF = 'little-ranch-settings-v1', BEDTIME_ACTS = 12, BEDTIME_SECS = 360, HOLD_MS = 3000, WAKE_TAPS = 6, SUN_TAPS = 5, BOW_SECS = 5, MOON_TAPS = 3, BEAT = .45, SHED_WALK_SECS = 2.6, HINT_SECS = 6;
  // LR-C1: things on the ranch, in the order an idle hint offers them (the first one not yet played with)
  const HINTS = ['bowl', 'sponge', 'bush', 'baby', 'flowers', 'sun', 'sign', 'wsign'];
  // LR10: the Little Wagon. Two cars (red and blue), two babies to load, three things along the valley and one colour gate
  const CARS = ['#e8483c', '#3f8ae8'], RIDE = { windmill: 1.05, pond: 1.75, woolies: 2.45, gate: 3.2, end: 4.1 }, RIDE_SPEED = .24, WAGON_END_SECS = 2.4;
  // LR3: the singing flowers, a row of five along the front of the meadow, each with its own note (C D E G A: any order sounds sweet)
  const FLOWERS = ['#ff6f91', '#ffa040', '#b07aff', '#4fb4ff', '#ff5a5a'], FLOWER_NOTES = [72, 74, 76, 79, 81], SONG_TAPS = 5;
  // LR9: the Paint Shed's four fat pots and the four parts of the baby's outline (in the order they're drawn)
  const PAINT = ['#ff6fa8', '#4fa6ff', '#ffd03a', '#5fd06a'], PARTS = ['tail', 'legs', 'body', 'head'];
  // Twinkle Twinkle Little Star, first verse (traditional, public domain): [note, beats]
  const A = [[72,1],[72,1],[79,1],[79,1],[81,1],[81,1],[79,2],[77,1],[77,1],[76,1],[76,1],[74,1],[74,1],[72,2]], B = [[79,1],[79,1],[77,1],[77,1],[76,1],[76,1],[74,2]];
  const TWINKLE = [...A, ...B, ...B, ...A], SONG_BEATS = TWINKLE.reduce((n, x) => n + x[1], 0), LULLABY_SECS = 25 * .55;
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
  let tones = 0; // notes actually played (for the checks: none when the sound is off)
  function tone(f, dur, at, vol, type, slide) { const a = audio(); if (!a) return; tones++; const t = a.currentTime + (at || 0), o = a.createOscillator(), g = a.createGain();
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
    flower: n => { tone(hz(n), .45, 0, .26, 'triangle'); tone(hz(n + 12), .3, .02, .06, 'sine'); },
    twinkle: () => tone(1568 + Math.random() * 400, .4, 0, .08),
    stir: n => tone(330 + n * 60, .18, 0, .2, 'triangle', 380 + n * 60), // a sleepy murmur, a little higher each tap
    shine: n => tone(784 * Math.pow(1.122, n), .25, 0, .18, 'sine'), // a bright note, a step up each tap
    rainbow: () => [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => tone(hz(n), .5, i * .09, .2, 'triangle')),
    hum: n => tone(hz(67 + n * 2), .7, 0, .14, 'sine'), // the moon's soft note, a little higher each tap
    star: n => { tone(hz(n), BEAT * 1.6, 0, .16, 'sine'); tone(hz(n + 12), BEAT, 0, .04, 'sine'); }, // a soft music-box note
    splat: k => { tone(hz([60, 64, 67, 71][k] + 12), .2, 0, .25, 'triangle', hz([60, 64, 67, 71][k] + 7)); crunch(); },
    pick: k => tone(hz([72, 76, 79, 83][k]), .15, 0, .22, 'sine'),
    baa: () => { tone(330, .35, 0, .2, 'triangle', 300); tone(336, .35, .02, .08, 'sine', 296); },
    splash: () => { crunch(); tone(500, .2, 0, .2, 'sine', 1200); },
    clop: () => tone(180 + Math.random() * 30, .07, 0, .1, 'triangle', 140),
    door: () => { tone(330, .12, 0, .2, 'triangle', 440); tone(523, .18, .1, .22, 'triangle'); },
    wake: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, .22, i * .1, .28, 'triangle')); },
    lullaby: () => { const tune = [67, 64, 0, 67, 64, 0, 69, 67, 64, 62, 60, 0, 0, 62, 64, 67, 64, 62, 60, 0, 0, 0, 64, 62, 60]; // original, slow, soft
      tune.forEach((n, i) => { if (n) { tone(hz(n), .8, i * .55, .28, 'triangle'); if (i % 3 === 0) tone(hz(n - 12), 1.2, i * .55, .12, 'sine'); } }); }
  };
  const sfx = (name, arg) => { try { SFX[name](arg); } catch (e) {} };

  /* ---------------- the visit ---------------- */
  let st;
  function newVisit() {
    st = { t: 0, mode: 'play', dusk: 0, acts: 0, baby: { x: 0, tx: null, then: null, dir: 1, act: null, at: 0, soap: 0, happy: 0 },
      bowl: { food: 0 }, sponge: { x: null, y: null, drag: null, auto: null, scrubbed: false }, bubbles: [], fx: [], bush: { shake: 0 }, lullabyAt: null, wake: 0, stir: 0, dawn: false, sun: { taps: 0, glow: 0, last: 0, bow: null }, moon: { taps: 0, glow: 0, last: 0, song: null },
      place: 'ranch', shed: { pot: 0, parts: {}, doneAt: null }, paint: null, sign: { shake: 0 }, used: {}, idleAt: 0, flowers: FLOWERS.map(() => ({ bob: 0, at: -9 })), sung: 0, wsign: { shake: 0 }, wagon: null };
    layout(); st.baby.x = L.home.x;
  }
  function layout() {
    const r = cv.getBoundingClientRect(), cssW = Math.max(1, r.width || innerWidth), cssH = Math.max(1, r.height || innerHeight);
    const old = L, oldW = W, oldH = H;
    S = Math.max(2, Math.round(Math.min(cssW, cssH) / 190)); W = Math.ceil(cssW / S); H = Math.ceil(cssH / S);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const U = Math.min(W, H * 1.15), wide = W > H * 1.3, sp = wide ? Math.min(W * .3, U * 1.1) : W * .28; // big screens: things spread out
    L = { U, R: U * .14, ground: H * .56, size: U * .17,
      home: { x: W / 2, y: H * .76 }, bowl: { x: W / 2 - sp, y: H * .84 }, sponge: { x: W / 2 + sp, y: H * .86 }, bush: { x: W / 2 + sp * .8, y: H * .6 }, sun: { x: W * .22, y: H * .17 }, sign: { x: Math.max(W * .11, U * .14 * 1.3), y: H * .5 } };
    L.wsign = { x: W - Math.max(W * .12, U * .14 * 1.3), y: L.ground - U * .14 * 1.7 }; // LR10: the wagon-wheel sign, on the hill
    { // LR10: the wagon place. The wagon stays put in the middle while the valley rolls by
      const z = Math.min(W * .11, H * .15), gy = H * .7;
      L.wagon = { z, gy, cars: [0, 1].map(i => ({ x: W * .12 + i * z * 2.35, y: gy - z * .5 })), puller: { x: W * .12 + z * 4.9, y: gy - z * .8 },
        wait: [0, 1].map(i => ({ x: W * (.22 + i * .28), y: H * .9 })), barn: null }; }
    { // LR3: on wide screens between the bowl and the sponge, in front; on tall ones a row across the bottom of the meadow
      const lo = W / 2 - sp + U * .14, hi = W / 2 + sp - U * .14 * .8, wstep = (hi - lo) / FLOWERS.length, x0 = wide ? lo + wstep / 2 : W * .1, step = wide ? wstep : W * .8 / (FLOWERS.length - 1), r = Math.min(step * (wide ? .56 : .5), U * (wide ? .12 : .1)), y = wide ? H * .9 : H * .935;
      L.flowers = FLOWERS.map((c, i) => ({ x: x0 + i * step, y, r, stem: H * .985 })); }
    { // the Paint Shed (LR9): the outline in the middle, four pots along the bottom, the barn picture top left
      const potR = Math.min(W * .108, H * .1), z = Math.min(W * .82 / 2.4, H * .5 / 2.1);
      L.shed = { z, x: W / 2 - z * .08, y: H * .7, potR, pots: PAINT.map((c, i) => ({ x: W * (.125 + i * .25), y: H * .88 - potR * .4 })), barn: { x: Math.max(potR * 1.15, W * .1), y: Math.max(potR * 1.15, H * .09), r: potR * .95 } }; }
    L.wagon.barn = L.shed.barn;
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
  // LR12: tapping the sleeping baby. Each tap it stirs and its zzz get smaller; on the sixth it wakes up happy and a
  // fresh sunny day starts (the same reset as New visit), with the sky brightening from night.
  function nudge() {
    st.wake++; st.stir = 1; sfx('stir', st.wake); fx('zzz', st.baby.x + L.size * .6, L.home.y - L.size * 1.3);
    if (st.wake < WAKE_TAPS) return;
    newVisit(); st.dusk = 1; st.dawn = true; st.baby.act = 'giggle'; st.baby.at = 0; st.baby.happy = 1; sfx('wake');
    for (let i = 0; i < 5; i++) fx('heart', babyCentre().x + (i - 2) * L.size * .4, babyCentre().y - L.size);
  }
  // LR13: the sun surprise. Daytime only (no sun at night). Each tap brightens it; the fifth brings a rainbow over the
  // field and the baby looks up and cheers; after a few seconds the rainbow fades and the count starts again.
  const sunAt = () => ({ x: L.sun.x, y: lerp(L.sun.y, L.ground + L.U * .1, clamp(st.dusk * 1.6, 0, 1)) });
  const daytime = () => st.mode === 'play' && st.dusk < .3;
  function shine() {
    const u = st.sun; if (u.bow) { fx('spark', sunAt().x, sunAt().y); sfx('twinkle'); return; }
    u.taps++; u.last = st.t; u.glow = u.taps / SUN_TAPS; sfx('shine', u.taps); for (let i = 0; i < 3; i++) fx('spark', sunAt().x + (i - 1) * L.U * .06, sunAt().y);
    if (u.taps < SUN_TAPS) return;
    u.bow = { at: st.t }; sfx('rainbow');
    const b = st.baby; if (!b.act && b.tx === null) { b.act = 'cheer'; b.at = st.t; } done();
  }
  // LR14: the moon's song. At night, while the baby sleeps (and the bedtime lullaby is over), each tap on the moon makes it
  // glow a little more; the third plays Twinkle Twinkle Little Star while the stars twinkle in time. The baby sleeps on.
  const moonAt = () => ({ x: W * .8, y: lerp(L.ground, H * .16, clamp((st.dusk - .6) / .4, 0, 1)) });
  const moonUp = () => st.mode === 'sleep' && st.baby.act === 'sleep' && !st.dawn && st.lullabyAt !== null && st.t - st.lullabyAt > LULLABY_SECS;
  function hum() {
    const u = st.moon, m = moonAt(); fx('spark', m.x, m.y - L.U * .1);
    if (u.song) { sfx('twinkle'); return; }
    u.taps++; u.last = st.t; u.glow = u.taps / MOON_TAPS; sfx('hum', u.taps);
    if (u.taps >= MOON_TAPS) u.song = { at: st.t, i: 0, beat: -9 };
  }
  function song(dt) { // plays the tune note by note, so it stops at once if the baby wakes
    const u = st.moon; if (!u.song) { if (u.taps && st.t - u.last > 10) u.taps = 0; u.glow = Math.max(u.taps / MOON_TAPS, u.glow - dt * .5); return; }
    const k = (st.t - u.song.at) / BEAT; let start = 0;
    for (let i = 0; i < TWINKLE.length; i++) { if (i >= u.song.i && k >= start) { u.song.i = i + 1; u.song.beat = st.t; sfx('star', TWINKLE[i][0]);
        const sx = (i * 7 * 97.3) % W, sy = (i * 7 * 53.7) % (L.ground * .8); fx('spark', sx, sy); } start += TWINKLE[i][1]; }
    if (k > SONG_BEATS + 1) { u.song = null; u.taps = 0; }
  }

  // LR9: the Paint Shed. Through the paint-drip sign; four pots and a big outline of the baby. Tap a pot (the first is
  // ready in the brush), then tap or drag over a part: it fills. When all four parts have colour: sparkles and a cheer,
  // and a moment later the painted baby walks back out of the sign into the ranch, in its colours until bedtime.
  function enterShed() { if (st.mode !== 'play' || st.place !== 'ranch') return; st.place = 'shed'; st.sign.shake = 1; st.sponge.drag = null; st.shed.doneAt = null; sfx('door'); }
  function leaveShed(painted) {
    st.place = 'ranch'; sfx('door');
    if (painted) { st.paint = { ...st.shed.parts }; st.shed.parts = {}; st.shed.doneAt = null; const b = st.baby;
      b.act = null; b.x = L.sign.x; b.then = null; go(L.home.x, () => { b.act = 'cheer'; b.at = st.t; }); done(); }
  }
  function shedPrims(part) { const S2 = L.shed, z = S2.z, ox = S2.x, oy = S2.y, hx = .42, hy = -1.25, hr = .66;
    const e = (x, y, rx, ry) => ({ k: 'e', x: ox + x * z, y: oy + y * z, rx: rx * z, ry: ry * z }), t = pts => ({ k: 't', pts: pts.map(([x, y]) => [ox + x * z, oy + y * z]) });
    if (part === 'tail') return [e(-.85, -.7, .3, .18), e(-1.1, -.92, .18, .18)];
    if (part === 'legs') return [-.45, .35].map(lx => ({ k: 'r', x: ox + lx * z, y: oy - .4 * z, w: .24 * z, h: .4 * z }));
    if (part === 'body') return [e(0, -.55, .78, .48)];
    return [t([[hx - hr * .75, hy - hr * .25], [hx - hr * .55, hy - hr * 1.2], [hx - hr * .1, hy - hr * .7]]), t([[hx + hr * .75, hy - hr * .25], [hx + hr * .55, hy - hr * 1.2], [hx + hr * .1, hy - hr * .7]]), e(hx, hy, hr, hr * .9)]; }
  function inPrim(q, p, pad) { if (q.k === 'e') return ((p.x - q.x) / (q.rx + pad)) ** 2 + ((p.y - q.y) / (q.ry + pad)) ** 2 <= 1;
    if (q.k === 'r') return p.x >= q.x - pad && p.x <= q.x + q.w + pad && p.y >= q.y - pad && p.y <= q.y + q.h + pad;
    const xs = q.pts.map(v => v[0]), ys = q.pts.map(v => v[1]); return p.x >= Math.min(...xs) - pad && p.x <= Math.max(...xs) + pad && p.y >= Math.min(...ys) - pad && p.y <= Math.max(...ys) + pad; }
  function partAt(p) { // no fiddly edges: inside a part (with a margin), or else the nearest part when close to the baby
    for (const part of ['head', 'legs', 'tail', 'body']) if (shedPrims(part).some(q => inPrim(q, p, L.shed.z * .08))) return part;
    const c = { x: L.shed.x, y: L.shed.y - L.shed.z }; if (Math.hypot(p.x - c.x, p.y - c.y) > L.shed.z * 1.9) return null;
    let best = null, bd = 1e9; for (const part of PARTS) for (const q of shedPrims(part)) { const qx = q.k === 'e' ? q.x : q.k === 'r' ? q.x + q.w / 2 : q.pts[1][0], qy = q.k === 'e' ? q.y : q.k === 'r' ? q.y + q.h / 2 : q.pts[1][1], dd = Math.hypot(p.x - qx, p.y - qy); if (dd < bd) { bd = dd; best = part; } }
    return best; }
  function partPoint(part) { const q = shedPrims(part)[part === 'head' ? 2 : 0]; return q.k === 'e' ? { x: q.x, y: q.y } : { x: q.x + q.w / 2, y: q.y + q.h * .8 }; }
  function paintPart(part, p) { const sh = st.shed; if (sh.doneAt !== null || !part || sh.parts[part] === sh.pot) return;
    sh.parts[part] = sh.pot; sfx('splat', sh.pot); for (let i = 0; i < 4; i++) { fx('blob', p.x, p.y); st.fx[st.fx.length - 1].col = PAINT[sh.pot]; }
    if (PARTS.every(k => k in sh.parts)) { sh.doneAt = st.t; sfx('rainbow'); for (let i = 0; i < 18; i++) { fx(i % 3 ? 'spark' : 'blob', L.shed.x + (Math.random() - .5) * L.shed.z * 2.6, L.shed.y - Math.random() * L.shed.z * 2); if (!(i % 3)) st.fx[st.fx.length - 1].col = PAINT[i % 4]; } } }
  function pickPot(i) { st.shed.pot = i; sfx('pick', i); const q = L.shed.pots[i]; fx('spark', q.x, q.y - L.shed.potR); }
  function shedTap(p) { const S2 = L.shed;
    if (near(p, S2.barn, S2.barn.r * 1.15)) return leaveShed(false);
    const i = S2.pots.findIndex(q => near(p, q, S2.potR * 1.15)); if (i >= 0) return pickPot(i);
    const part = st.shed.doneAt === null && partAt(p); if (part) return paintPart(part, p);
    fx('spark', p.x, p.y); sfx('note'); }
  // LR-C1: a gentle idle hint, so a child alone is never stuck. After a few quiet seconds one thing glows softly and
  // bobs: the first thing not yet played with (then each in turn); at night the sleeping baby (tap to wake); in the
  // shed the next uncoloured part, or the barn once it's all painted. Any touch hides it again. Nothing to read.
  function hint() {
    if (st.t - st.idleAt < HINT_SECS || !panel.hidden) return null;
    if (st.place === 'wagon') { const w = st.wagon, V = L.wagon;
      if (w.phase === 'load') { const i = [0, 1].find(k => !w.aboard[k]); return i !== undefined ? { name: 'baby' + i, x: V.wait[i].x, y: V.wait[i].y - V.z * .5, r: V.z * .9 } : { name: 'wagon', x: V.puller.x, y: V.puller.y, r: V.z * 1.05 }; }
      if (w.phase === 'gate' && w.gate.at === null) { const c = V.cars[w.gate.col]; return { name: 'car' + w.gate.col, x: c.x, y: c.y - V.z * .3, r: V.z * 1.05 }; }
      return null; }
    if (st.place === 'shed') { if (st.shed.doneAt !== null) return null; const k = PARTS.find(q => !(q in st.shed.parts)); const z = L.shed.z;
      return k ? { name: k, ...partPoint(k), r: z * .55 } : null; }
    if (st.mode === 'sleep') return st.baby.act === 'sleep' && !st.moon.song ? { name: 'baby', ...babyCentre(), r: L.size * 1.1 } : null;
    if (st.mode !== 'play' || busy() || st.sponge.drag || st.sponge.auto || st.sun.bow) return null;
    const left = HINTS.filter(k => !st.used[k] && (k !== 'sun' || daytime())), all = HINTS.filter(k => k !== 'sun' || daytime());
    const name = left.length ? left[0] : all[Math.floor((st.t - st.idleAt - HINT_SECS) / 8) % all.length];
    const at = { bowl: [L.bowl, L.R * 1.1], sponge: [L.sponge, L.R * 1.05], bush: [{ x: L.bush.x, y: L.bush.y - L.R * .5 }, L.R * 1.35], baby: [babyCentre(), L.size * 1.1], sun: [sunAt(), L.U * .15], sign: [{ x: L.sign.x, y: L.sign.y - L.R * .45 }, L.R * 1.05], flowers: [L.flowers[2], L.flowers[2].r * 1.4], wsign: [{ x: L.wsign.x, y: L.wsign.y - L.R * .45 }, L.R * 1.05] }[name];
    return { name, x: at[0].x, y: at[0].y, r: at[1] };
  }
  function drawHint() { const h = hint(); if (!h) return; const k = st.t - st.idleAt - HINT_SECS, m = reduce() ? 0 : 1, pulse = .5 + .5 * Math.sin(k * 3.2);
    const a = clamp(k / 1.2, 0, 1) * (.22 + .2 * (m ? pulse : .5)), r = h.r * (1 + .08 * pulse * m);
    ell(h.x, h.y, r, r * .92, `rgba(255,250,200,${a})`); cx.strokeStyle = `rgba(255,255,255,${a * 1.6})`; cx.lineWidth = Math.max(2, L.U * .012); cx.beginPath(); cx.arc(R(h.x), R(h.y), R(r), 0, 7); cx.stroke();
    if (m && Math.floor(k / 1.4) !== Math.floor((k - 1 / 30) / 1.4)) fx('spark', h.x + (Math.random() - .5) * h.r, h.y - h.r * .6); }
  const hintBob = name => { const h = hint(); if (!h || h.name !== name || reduce()) return 0; return Math.abs(Math.sin((st.t - st.idleAt) * 3.2)) * L.U * .025; };
  // LR3: tap a flower and it sings its note and bobs; the baby dances to whatever she plays. Dragging along the row plays
  // each flower it passes. Every fifth note counts as one happy thing (so a long song doesn't rush bedtime).
  function sing(i) { const f = st.flowers[i]; f.bob = 1; f.at = st.t; sfx('flower', FLOWER_NOTES[i]); const q = L.flowers[i];
    fx('note', q.x + (Math.random() - .5) * q.r, q.y - q.r); st.fx[st.fx.length - 1].col = FLOWERS[i];
    const b = st.baby; if (b.tx === null && (!b.act || b.act === 'dance')) { if (b.act !== 'dance') b.dir = -b.dir; b.act = 'dance'; b.at = st.t; }
    if (++st.sung % SONG_TAPS === 0) done(); }
  const flowerAt = p => { let best = -1, bd = 1; L.flowers.forEach((q, i) => { const k = Math.hypot(p.x - q.x, (p.y - q.y) * .8) / (q.r * 1.15); if (k <= bd) { bd = k; best = i; } }); return best; };

  // LR10: the Little Wagon. Through the wagon-wheel sign. Tap each baby and it hops into a car and waves; with both aboard,
  // tap the wagon and it rolls. The valley goes by: a windmill (tap: it spins), a pond (tap: splash), woolies (tap: baa).
  // A coloured gate stops it: tap any car and the gate swings open with a cheer; the car of the gate's colour gets the
  // bigger cheer, so nothing is ever wrong. At the end the babies hop off and walk home to the ranch (one happy thing).
  function enterWagon() { if (st.mode !== 'play' || st.place !== 'ranch') return; st.place = 'wagon'; st.wsign.shake = 1; st.sponge.drag = null;
    st.wagon = { phase: 'load', aboard: [false, false], hop: [-9, -9], x: 0, t0: st.t, things: { windmill: { at: -9, spin: 0, a: 0 }, pond: { at: -9 }, woolies: { at: -9 } }, gate: { col: Math.random() < .5 ? 0 : 1, at: null, big: false }, endAt: null, wiggle: 0, cheer: -9 };
    sfx('door'); }
  function leaveWagon(rode) { st.place = 'ranch'; sfx('door'); st.wagon = null;
    if (rode) { const b = st.baby; b.act = null; b.then = null; b.x = L.wsign.x; go(L.home.x, () => { b.act = 'cheer'; b.at = st.t; }); done(); } }
  const thingAt = k => { const w = st.wagon, z = L.wagon.z; return { x: (RIDE[k] - w.x) * W + L.wagon.puller.x, y: k === 'windmill' ? L.wagon.gy - z * 1.9 : k === 'pond' ? H * .86 : L.wagon.gy - z * .25 }; };
  const thingR = k => L.wagon.z * (k === 'windmill' ? 1.25 : k === 'pond' ? 1.15 : 1.1);
  function wagonTap(p) { const w = st.wagon, V = L.wagon;
    if (near(p, V.barn, V.barn.r * 1.15)) return leaveWagon(false);
    const car = V.cars.findIndex(c => Math.abs(p.x - c.x) <= V.z * 1.15 && Math.abs(p.y - (c.y - V.z * .3)) <= V.z * 1.1);
    const pull = Math.hypot(p.x - V.puller.x, p.y - V.puller.y) <= V.z * 1.15;
    if (w.phase === 'load') {
      const i = [0, 1].find(k => !w.aboard[k] && Math.hypot(p.x - V.wait[k].x, p.y - (V.wait[k].y - V.z * .5)) <= V.z * 1.1);
      if (i !== undefined) { w.aboard[i] = true; w.hop[i] = st.t; sfx('boo'); fx('heart', V.cars[i].x, V.cars[i].y - V.z * 1.4); return; }
      if (car >= 0 && !w.aboard[car]) { const k = car; w.aboard[k] = true; w.hop[k] = st.t; sfx('boo'); fx('heart', V.cars[k].x, V.cars[k].y - V.z * 1.4); return; } // a tap on the empty car loads its baby too
      if (car >= 0 || pull) { if (w.aboard[0] && w.aboard[1]) { w.phase = 'ride'; sfx('wake'); } else { w.wiggle = 1; sfx('pick', 0); } return; } }
    if (w.phase === 'gate' && w.gate.at === null && car >= 0) { const big = car === w.gate.col; w.gate.at = st.t; w.gate.big = big; w.cheer = st.t;
      sfx(big ? 'rainbow' : 'giggle'); const n = big ? 10 : 3; for (let i = 0; i < n; i++) fx(big && i % 2 ? 'spark' : 'heart', V.cars[car].x + (Math.random() - .5) * V.z * 2, V.cars[car].y - V.z * (1.2 + Math.random())); return; }
    if (w.phase !== 'load') for (const k of ['windmill', 'pond', 'woolies']) { const q = thingAt(k); if (q.x > -V.z && q.x < W + V.z && Math.hypot(p.x - q.x, p.y - q.y) <= thingR(k)) { const t = w.things[k]; t.at = st.t;
      if (k === 'windmill') { t.spin = 1; sfx('rainbow'); } else if (k === 'pond') { sfx('splash'); for (let i = 0; i < 6; i++) { fx('blob', q.x, q.y - V.z * .2); st.fx[st.fx.length - 1].col = '#9ad6f4'; } } else sfx('baa');
      return; } }
    if (car >= 0 || pull) { w.wiggle = 1; sfx('giggle'); return; }
    fx('spark', p.x, p.y); sfx('note'); }
  function wagonUpdate(dt) { const w = st.wagon; w.wiggle = Math.max(0, w.wiggle - dt * 2); const t = w.things.windmill; t.a += dt * (.6 + t.spin * 9); t.spin = Math.max(0, t.spin - dt * .35);
    if (w.phase === 'ride') { const gateStop = RIDE.gate - L.wagon.z * 1.1 / W, stopAt = w.gate.at === null ? gateStop : RIDE.end; w.x = Math.min(stopAt, w.x + RIDE_SPEED * dt);
      if (w.gate.at === null && w.x >= gateStop) w.phase = 'gate'; else if (w.x >= RIDE.end) { w.phase = 'end'; w.endAt = st.t; sfx('rainbow'); } }
    else if (w.phase === 'gate' && w.gate.at !== null && st.t - w.gate.at > 1.1) w.phase = 'ride';
    else if (w.phase === 'end' && st.t - w.endAt > WAGON_END_SECS) leaveWagon(true);
    if (w.phase === 'ride' && Math.floor(st.t / .5) !== Math.floor((st.t - dt) / .5)) sfx('clop'); }
  function bedtime() { if (st.mode !== 'play') return; st.mode = 'dusk'; st.baby.act = 'yawn'; st.baby.at = st.t; st.bowl.food = 0; sfx('yawn'); st.sponge.drag = null; st.sponge.auto = null; }

  function update(dt) {
    st.t += dt; const b = st.baby, sp = L.U * .9;
    if (st.place === 'wagon') { st.fx = st.fx.filter(f => st.t - f.at < 1.4); wagonUpdate(dt); return; }
    if (st.place === 'shed') { st.fx = st.fx.filter(f => st.t - f.at < 1.4); if (st.shed.doneAt !== null && st.t - st.shed.doneAt > SHED_WALK_SECS) leaveShed(true); return; }
    st.sign.shake = Math.max(0, st.sign.shake - dt * 1.5); st.wsign.shake = Math.max(0, st.wsign.shake - dt * 1.5);
    st.stir = Math.max(0, st.stir - dt * 2.5); song(dt);
    { const u = st.sun; if (u.bow && st.t - u.bow.at > BOW_SECS) { u.bow = null; u.taps = 0; } // the rainbow fades, the count starts again
      if (!u.bow) { if (u.taps && st.t - u.last > 10) u.taps = 0; u.glow = Math.max(u.taps / SUN_TAPS, u.glow - dt * .5); } } if (st.dawn) { st.dusk = Math.max(0, st.dusk - dt / 2.5); if (st.dusk === 0) st.dawn = false; }
    if (b.tx !== null) { const d = b.tx - b.x; if (Math.abs(d) <= sp * dt) { b.x = b.tx; b.tx = null; const f = b.then; b.then = null; if (f) f(); } else b.x += Math.sign(d) * sp * dt; }
    const since = st.t - b.at;
    if (b.act === 'eat') { if (Math.floor(since / .35) !== Math.floor((since - dt) / .35)) { sfx('crunch'); fx('crumb', L.bowl.x + (Math.random() - .5) * L.R, L.bowl.y - L.R * .3); }
      st.bowl.food = clamp(1 - since / 2.4, 0, 1); if (since > 2.4) { b.act = null; st.bowl.food = 0; done(); home(); } }
    if (b.act === 'giggle' && since > .8) { b.act = null; if (!st.sponge.drag && !st.sponge.auto) {} }
    if (b.act === 'hide' && since > 3.5) { b.act = 'peek'; b.at = st.t; st.bush.shake = 1; sfx('boo'); }
    if (b.act === 'peek' && since > 1.4) { b.act = null; done(); home(); }
    if (b.act === 'yawn' && since > 1.6) { b.act = null; home(); }
    if (b.act === 'cheer' && since > 1.8) b.act = null;
    if (b.act === 'dance') { if (since > 1.3) b.act = null; else if (Math.floor(since / .32) !== Math.floor((since - dt) / .32)) b.dir = -b.dir; }
    for (const f of st.flowers) f.bob = Math.max(0, f.bob - dt * 1.6);
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
      if (st.dusk >= 1 && b.act === 'sleep') { st.mode = 'sleep'; st.paint = null; } } // bedtime washes the paint off
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
    if (b.act === 'cheer') { hop = Math.abs(Math.sin(since * 9)) * z * .45 * m; eyes = 'happy'; mouth = 1.1; }
    if (b.act === 'dance') { hop = Math.abs(Math.sin(since * 10)) * z * .3 * m; eyes = 'happy'; mouth = .9; squash = 1 + Math.sin(since * 20) * .06 * m; }
    if (b.act === 'eat') { squash = 1 + Math.sin(since * 18) * .05; eyes = 'happy'; }
    if (b.act === 'yawn') { mouth = clamp(Math.sin(since / 1.6 * Math.PI) * 1.6, 0, 1.3); eyes = 'closed'; }
    if (st.baby.happy > 0 && eyes === 'open') eyes = 'happy';
    if (Math.floor(t * 10) % 37 === 0 && eyes === 'open') eyes = 'closed'; // blinks
    const sleep = b.act === 'sleep';
    shadow(x, y, z * 1.1);
    const body = '#e06a32', dark = '#b4471c', cream = '#ffe2b8', P = st.paint ? Object.fromEntries(Object.entries(st.paint).map(([k, v]) => [k, PAINT[v]])) : {}; // painted in the Paint Shed (LR9)
    const bodyC = P.body || body, headC = P.head || body, tailC = P.tail || body, legC = P.legs ? mixHex(P.legs, '#000000', .2) : dark, ember = P.tail ? mixHex(P.tail, '#ffffff', .45) : '#ffd04a';
    if (sleep && st.stir > 0) x += Math.sin(t * 40) * st.stir * z * .1 * m; // stirring when tapped (LR12)
    if (sleep) { // curled up: a round bun with the tail wrapped round, breathing
      const br = 1 + Math.sin(t * 1.6) * .03 * m + st.stir * .06;
      ell(x, y - z * .45, z * 1.05 * br, z * .55 * br, bodyC); ell(x + z * .7, y - z * .3, z * .55, z * .3, P.tail ? tailC : dark); ell(x + z * 1.15, y - z * .35, z * .16, z * .14, ember);
      ell(x - z * .55, y - z * .55, z * .5, z * .42, headC); ell(x - z * .7, y - z * .42, z * .26, z * .18, cream);
      cx.fillStyle = '#3a2420'; cx.fillRect(R(x - z * .62), R(y - z * .62), R(z * .18), Math.max(1, R(z * .05))); cx.fillRect(R(x - z * .32), R(y - z * .62), R(z * .18), Math.max(1, R(z * .05)));
      if (st.moon.song || st.moon.glow > 0) { cx.fillStyle = '#3a2420'; cx.fillRect(R(x - z * .55), R(y - z * .4), R(z * .16), Math.max(1, R(z * .04))); cx.fillRect(R(x - z * .62), R(y - z * .44), Math.max(1, R(z * .06)), Math.max(1, R(z * .04))); cx.fillRect(R(x - z * .4), R(y - z * .44), Math.max(1, R(z * .06)), Math.max(1, R(z * .04))); } // a little smile
      cx.beginPath(); cx.moveTo(R(x - z * .85), R(y - z * .85)); cx.lineTo(R(x - z * .7), R(y - z * 1.15)); cx.lineTo(R(x - z * .55), R(y - z * .9)); cx.fillStyle = headC; cx.fill();
      return; }
    const by = y - hop;
    // tail with a glowing ember tip
    ell(x - d * z * .85, by - z * .7, z * .3, z * .18, tailC); ell(x - d * z * 1.1, by - z * .9 - Math.sin(t * 5) * z * .05 * m, z * .17, z * .17, ember);
    // body and short legs
    for (const lx of [-.45, .35]) { cx.fillStyle = legC; cx.fillRect(R(x + lx * z), R(by - z * .35), R(z * .22), R(z * .35 + hop * .5)); }
    ell(x, by - z * .55, z * .78, z * .48 * squash, bodyC); ell(x + d * z * .15, by - z * .45, z * .45, z * .26, cream);
    // the big baby head
    const hx = x + d * z * .42, hy = by - z * 1.25 - (b.act === 'cheer' ? z * .12 : 0) + (b.act === 'eat' ? Math.abs(Math.sin(since * 9)) * z * .25 : 0), hr = z * .66;
    for (const s of [-1, 1]) { cx.fillStyle = headC; cx.beginPath(); cx.moveTo(R(hx + s * hr * .75), R(hy - hr * .25)); cx.lineTo(R(hx + s * hr * .55), R(hy - hr * 1.2)); cx.lineTo(R(hx + s * hr * .1), R(hy - hr * .7)); cx.fill();
      cx.fillStyle = '#ff9a8a'; cx.beginPath(); cx.moveTo(R(hx + s * hr * .6), R(hy - hr * .45)); cx.lineTo(R(hx + s * hr * .52), R(hy - hr * .95)); cx.lineTo(R(hx + s * hr * .28), R(hy - hr * .65)); cx.fill(); }
    ell(hx, hy, hr, hr * .9, headC); ell(hx + d * hr * .2, hy + hr * .35, hr * .52, hr * .38, cream);
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
  function drawFlowers(g) { // LR3: big friendly flowers; open by day, gently closed at night
    const night = clamp((g - .4) / .5, 0, 1), m = reduce() ? .3 : 1, hb = hintBob('flowers');
    L.flowers.forEach((q, i) => { const f = st.flowers[i], k = st.t - f.at, bob = f.bob * f.bob, sway = Math.sin(k * 14) * bob * q.r * .3 * m + Math.sin(st.t * 1.3 + i) * q.r * .04 * m;
      const hy = q.y - bob * q.r * .35 * m - hb, hx = q.x + sway, r = q.r * (1 + bob * .18 * m);
      cx.fillStyle = pick3('#3f9a48', '#5a8a3a', '#1e3a34', g); cx.fillRect(R(q.x - Math.max(1, q.r * .07)), R(hy), Math.max(2, R(q.r * .14)), R(q.stem - hy));
      ell(q.x - q.r * .32, q.stem - q.r * .35, q.r * .3, q.r * .12, cx.fillStyle); ell(q.x + q.r * .32, q.stem - q.r * .55, q.r * .3, q.r * .12, cx.fillStyle);
      const pc = mixHex(FLOWERS[i], '#2a2a4a', night * .55), open = 1 - night * .45;
      for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2 + (night ? 0 : Math.sin(k * 10) * bob * .3); ell(hx + Math.cos(a) * r * .5 * open, hy + Math.sin(a) * r * .5 * open, r * .36, r * .3, pc); }
      ell(hx, hy, r * .32, r * .32, mixHex('#ffd84a', '#5a5040', night * .6));
      if (night < .5) { cx.fillStyle = '#3a2420'; cx.fillRect(R(hx - r * .14), R(hy - r * .06), Math.max(1, R(r * .07)), Math.max(1, R(r * .09))); cx.fillRect(R(hx + r * .08), R(hy - r * .06), Math.max(1, R(r * .07)), Math.max(1, R(r * .09)));
        ell(hx, hy + r * .1, r * (bob > .2 ? .1 : .07), r * (bob > .2 ? .09 : .04), '#8a2a2a'); } }); }
  function drawRainbow(k) { // a big arch over the field, fading in and out
    const a = clamp(Math.min(k / .6, (BOW_SECS - k) / 1.2), 0, 1) * .8, cxr = W / 2, cyr = L.ground + L.U * .1, R0 = Math.min(W * .48, L.ground * 1.15), band = Math.max(2, L.U * .03);
    ['#ff5a5a', '#ffa040', '#ffe050', '#6ad060', '#50a8ff', '#8a6ae0'].forEach((c, i) => { cx.strokeStyle = c; cx.globalAlpha = a; cx.lineWidth = band; cx.beginPath(); cx.arc(R(cxr), R(cyr), R(R0 - i * band), Math.PI, 0); cx.stroke(); });
    cx.globalAlpha = 1; }
  function drawFx(U) {
    for (const f of st.fx) { const k = st.t - f.at, x = f.x + f.vx * k, y = f.y + f.vy * k, a = clamp(1 - k / 1.4, 0, 1);
      if (f.kind === 'heart') { const r = U * .035; cx.fillStyle = `rgba(255,90,120,${a})`; ell(x - r * .5, y, r * .6, r * .6, cx.fillStyle); ell(x + r * .5, y, r * .6, r * .6, cx.fillStyle); cx.beginPath(); cx.moveTo(R(x - r * 1.05), R(y + r * .15)); cx.lineTo(R(x), R(y + r * 1.3)); cx.lineTo(R(x + r * 1.05), R(y + r * .15)); cx.fill(); }
      else if (f.kind === 'spark') { cx.fillStyle = `rgba(255,240,150,${a})`; const r = U * .03 * (1 + k); cx.fillRect(R(f.x - r), R(f.y), R(r * 2), 1); cx.fillRect(R(f.x), R(f.y - r), 1, R(r * 2)); }
      else if (f.kind === 'blob') { const r = U * .025 * (1 + k * .5); cx.globalAlpha = a; ell(x, y + U * .4 * k * k, r, r, f.col || '#fff'); cx.globalAlpha = 1; }
      else if (f.kind === 'note') { const r = U * .03; cx.globalAlpha = a; const nx = x + Math.sin(k * 6) * r, ny = f.y - U * .18 * k; ell(nx, ny, r * .7, r * .55, f.col || '#fff'); cx.fillStyle = f.col || '#fff'; cx.fillRect(R(nx + r * .45), R(ny - r * 1.9), Math.max(1, R(r * .22)), R(r * 1.9)); cx.fillRect(R(nx + r * .45), R(ny - r * 1.9), R(r * .8), Math.max(1, R(r * .3))); cx.globalAlpha = 1; }
      else if (f.kind === 'crumb') ell(f.x + f.vx * k * .5, f.y - U * .1 * k + U * .3 * k * k, U * .012, U * .012, `rgba(200,130,58,${a})`);
      else if (f.kind === 'zzz') { const zz = clamp(1 - k / 3, 0, 1), r = U * .03 * (1 + k * .4) * (1 - st.wake / WAKE_TAPS * .75); cx.strokeStyle = `rgba(230,230,255,${zz})`; cx.lineWidth = 1; cx.beginPath(); const zx = f.x + k * U * .05, zy = f.y - k * U * .08;
        cx.moveTo(R(zx - r), R(zy - r)); cx.lineTo(R(zx + r), R(zy - r)); cx.lineTo(R(zx - r), R(zy + r)); cx.lineTo(R(zx + r), R(zy + r)); cx.stroke(); } }
  }

  // LR9: the paint-drip picture sign at the ranch's edge, and the Paint Shed itself
  function drawPot(x, y, r, col, lift) { // a fat paint pot: a wooden bucket brimming with colour, drips down its side
    y -= lift; shadow(x, y + r * .75 + lift, r * .9);
    cx.fillStyle = '#7a5434'; cx.beginPath(); cx.moveTo(R(x - r * .85), R(y - r * .35)); cx.lineTo(R(x + r * .85), R(y - r * .35)); cx.lineTo(R(x + r * .68), R(y + r * .75)); cx.lineTo(R(x - r * .68), R(y + r * .75)); cx.fill();
    cx.fillStyle = '#5a3a24'; cx.fillRect(R(x - r * .8), R(y), R(r * 1.6), Math.max(1, R(r * .1))); cx.fillRect(R(x - r * .72), R(y + r * .45), R(r * 1.44), Math.max(1, R(r * .1)));
    ell(x, y - r * .35, r * .88, r * .3, '#4a2e1c'); ell(x, y - r * .33, r * .78, r * .24, col);
    for (const [dx, h] of [[-.5, .5], [.1, .75], [.55, .4]]) { cx.fillStyle = col; cx.fillRect(R(x + dx * r), R(y - r * .3), Math.max(2, R(r * .16)), R(r * h)); ell(x + dx * r + r * .08, y - r * .3 + r * h, r * .1, r * .1, col); } }
  function drawSign(g) {
    const s = L.sign, r = L.R * .95, sh = Math.sin(st.t * 30) * st.sign.shake * r * .06;
    cx.fillStyle = pick3('#8a5a34', '#7a5030', '#2e2430', g); cx.fillRect(R(s.x - r * .08), R(s.y - r * .2), Math.max(2, R(r * .16)), R(r * 1.4)); // the post
    cx.save(); cx.translate(R(s.x + sh), R(s.y - r * .45 - hintBob('sign'))); cx.fillStyle = pick3('#5a3a24', '#5a3a24', '#1e1a24', g); cx.fillRect(R(-r * .95), R(-r * .72), R(r * 1.9), R(r * 1.44));
    cx.fillStyle = pick3('#f4e2c0', '#e8c890', '#4a4458', g); cx.fillRect(R(-r * .85), R(-r * .62), R(r * 1.7), R(r * 1.24));
    PAINT.forEach((c, i) => { cx.fillStyle = g > .6 ? mixHex(c, '#20203a', .6) : c; const x = -r * .66 + i * r * .44; cx.fillRect(R(x - r * .17), R(-r * .62), R(r * .34), R(r * (.35 + (i % 2) * .25))); ell(x, -r * .62 + r * (.35 + (i % 2) * .25), r * .17, r * .14, cx.fillStyle); });
    cx.fillStyle = '#8a5a34'; cx.save(); cx.rotate(-.5); cx.fillRect(R(-r * .1), R(r * .02), R(r * .2), R(r * .7)); cx.restore(); // a little brush
    cx.restore(); }
  function drawWheel(x, y, r, a, col) { cx.strokeStyle = col || '#5a3a24'; cx.lineWidth = Math.max(2, r * .22); cx.beginPath(); cx.arc(R(x), R(y), R(r), 0, 7); cx.stroke();
    cx.lineWidth = Math.max(1, r * .12); for (let k = 0; k < 4; k++) { const b = a + k * Math.PI / 4; cx.beginPath(); cx.moveTo(R(x - Math.cos(b) * r), R(y - Math.sin(b) * r)); cx.lineTo(R(x + Math.cos(b) * r), R(y + Math.sin(b) * r)); cx.stroke(); }
    ell(x, y, r * .22, r * .22, '#f2c14e'); }
  function drawWheelSign(g) { // LR10: a picture-sign with a wagon wheel and a red car
    const s = L.wsign, r = L.R * .95, sh = Math.sin(st.t * 30) * st.wsign.shake * r * .06, bob = hintBob('wsign');
    cx.fillStyle = pick3('#8a5a34', '#7a5030', '#2e2430', g); cx.fillRect(R(s.x - r * .08), R(s.y - r * .2 - bob), Math.max(2, R(r * .16)), R(r * 1.4 + bob));
    cx.save(); cx.translate(R(s.x + sh), R(s.y - r * .45 - bob)); cx.fillStyle = pick3('#5a3a24', '#5a3a24', '#1e1a24', g); cx.fillRect(R(-r * .95), R(-r * .72), R(r * 1.9), R(r * 1.44));
    cx.fillStyle = pick3('#d8f0c8', '#e8d890', '#3a4458', g); cx.fillRect(R(-r * .85), R(-r * .62), R(r * 1.7), R(r * 1.24));
    cx.fillStyle = g > .6 ? mixHex(CARS[0], '#20203a', .6) : CARS[0]; cx.fillRect(R(-r * .7), R(-r * .3), R(r * 1.1), R(r * .45));
    drawWheel(-r * .4, r * .25, r * .26, st.t * 2, '#3a2420'); drawWheel(r * .2, r * .25, r * .26, st.t * 2, '#3a2420'); cx.restore(); }
  function drawMini(x, y, z, kind, wave, hop) { // a small baby riding or waiting: 0 the Cindercub, 1 its friend, a round baby Pebblit
    y -= hop; const body = kind ? '#8fa0b8' : '#e06a32', dark = kind ? '#6a7a94' : '#b4471c';
    shadow(x, y + hop, z * .6);
    ell(x, y - z * .35, z * .55, z * .38, body); if (kind) { ell(x - z * .2, y - z * .5, z * .1, z * .08, dark); ell(x + z * .22, y - z * .3, z * .08, z * .06, dark); } else ell(x - z * .55, y - z * .55, z * .16, z * .16, '#ffd04a');
    const hy = y - z * .95; if (!kind) for (const s2 of [-1, 1]) { cx.fillStyle = body; cx.beginPath(); cx.moveTo(R(x + s2 * z * .38), R(hy - z * .1)); cx.lineTo(R(x + s2 * z * .3), R(hy - z * .62)); cx.lineTo(R(x + s2 * z * .05), R(hy - z * .35)); cx.fill(); }
    ell(x, hy, z * .44, z * .4, body); ell(x, hy + z * .15, z * .26, z * .18, kind ? '#c8d4e4' : '#ffe2b8');
    for (const s2 of [-1, 1]) ell(x + s2 * z * .17, hy - z * .04, z * .07, z * .09, '#2a1a18'); ell(x, hy + z * .2, z * .07, z * .05, '#8a2a2a');
    if (wave) { const a = Math.sin(st.t * 10) * .5; cx.save(); cx.translate(R(x + z * .45), R(y - z * .55)); cx.rotate(-.9 + a); cx.fillStyle = body; cx.fillRect(0, R(-z * .08), R(z * .45), Math.max(2, R(z * .16))); cx.restore(); } }
  function drawWagon() {
    const U = L.U, V = L.wagon, z = V.z, w = st.wagon, m = reduce() ? .3 : 1, roll = w.x * W / (z * .4);
    const sky = cx.createLinearGradient(0, 0, 0, V.gy); sky.addColorStop(0, '#6cbcec'); sky.addColorStop(1, '#d4eef8'); cx.fillStyle = sky; cx.fillRect(0, 0, W, V.gy);
    const sx = k => ((k - w.x * W * .35) % (W * 1.6) + W * 1.6) % (W * 1.6) - W * .3; // far hills drift slowly
    for (let i = 0; i < 3; i++) ell(sx(i * W * .55), V.gy - z * .2, W * .42, z * 1.6, i % 2 ? '#8acb6a' : '#7abf5c');
    cx.fillStyle = '#7cc85a'; cx.fillRect(0, R(V.gy - z * .2), W, H - R(V.gy - z * .2)); cx.fillStyle = '#d8b878'; cx.fillRect(0, R(V.gy - z * .05), W, R(z * .5)); // the dirt road
    cx.fillStyle = 'rgba(160,120,70,.5)'; for (let x = -((w.x * W) % (z * .9)); x < W; x += z * .9) cx.fillRect(R(x), R(V.gy + z * .2), R(z * .3), Math.max(1, R(z * .06)));
    // the valley's three things and the gate
    const vis = k => { const q = thingAt(k); return q.x > -z * 2 && q.x < W + z * 2 ? q : null; };
    let q = vis('windmill'); if (q) { const t = w.things.windmill; cx.fillStyle = '#f4ead8'; cx.beginPath(); cx.moveTo(R(q.x - z * .45), R(V.gy - z * .1)); cx.lineTo(R(q.x - z * .22), R(q.y)); cx.lineTo(R(q.x + z * .22), R(q.y)); cx.lineTo(R(q.x + z * .45), R(V.gy - z * .1)); cx.fill();
      cx.fillStyle = '#c8453a'; cx.beginPath(); cx.moveTo(R(q.x - z * .3), R(q.y)); cx.lineTo(R(q.x), R(q.y - z * .35)); cx.lineTo(R(q.x + z * .3), R(q.y)); cx.fill();
      for (let k = 0; k < 4; k++) { const a = t.a + k * Math.PI / 2; cx.save(); cx.translate(R(q.x), R(q.y)); cx.rotate(a); cx.fillStyle = '#fff8ec'; cx.fillRect(0, R(-z * .1), R(z * 1.05), R(z * .2)); cx.fillStyle = '#a07c58'; cx.fillRect(0, R(-z * .02), R(z * 1.05), Math.max(1, R(z * .04))); cx.restore(); }
      ell(q.x, q.y, z * .1, z * .1, '#5a3a24'); }
    q = vis('pond'); if (q) { const t = st.t - w.things.pond.at, rip = t < 1.2 ? t / 1.2 : 0; ell(q.x, q.y, z * 1.15, z * .38, '#4fa6e8'); ell(q.x - z * .2, q.y - z * .08, z * .7, z * .16, '#9ad6f4');
      if (rip) { cx.strokeStyle = `rgba(255,255,255,${1 - rip})`; cx.lineWidth = Math.max(1, z * .05); cx.beginPath(); cx.ellipse(R(q.x), R(q.y), R(z * (.3 + rip * .8)), R(z * (.1 + rip * .25)), 0, 0, 7); cx.stroke(); }
      for (const dx of [-.9, .95]) { cx.fillStyle = '#3f9a48'; cx.fillRect(R(q.x + dx * z), R(q.y - z * .6), Math.max(1, R(z * .06)), R(z * .5)); ell(q.x + dx * z, q.y - z * .62, z * .06, z * .14, '#8a5a34'); } }
    q = vis('woolies'); if (q) { const t = st.t - w.things.woolies.at; for (let i = 0; i < 2; i++) { const hop2 = t < .8 ? Math.abs(Math.sin(t * 8 + i)) * z * .25 * m : 0, x = q.x + (i - .5) * z * 1.05, y = q.y - hop2;
      shadow(x, q.y + z * .05, z * .5); for (let k = 0; k < 6; k++) ell(x + Math.cos(k) * z * .32, y - z * .45 + Math.sin(k * 1.7) * z * .15, z * .26, z * .22, '#fbf6ec');
      ell(x + z * .42, y - z * .52, z * .2, z * .18, '#3a3040'); ell(x + z * .48, y - z * .56, z * .04, z * .04, '#fff'); cx.fillStyle = '#3a3040'; cx.fillRect(R(x - z * .25), R(y - z * .2), Math.max(1, R(z * .1)), R(z * .25)); cx.fillRect(R(x + z * .15), R(y - z * .2), Math.max(1, R(z * .1)), R(z * .25));
      if (t < .8) { cx.globalAlpha = 1 - t / .8; ell(x + z * .7, y - z * .9, z * .12, z * .1, '#fff'); cx.globalAlpha = 1; } } }
    q = vis('gate'); if (q) { const gx = q.x, open = w.gate.at === null ? 0 : clamp((st.t - w.gate.at) / .9, 0, 1), col = CARS[w.gate.col];
      cx.fillStyle = '#7a5434'; cx.fillRect(R(gx - z * .1), R(V.gy - z * 1.7), R(z * .2), R(z * 1.75)); cx.fillRect(R(gx + z * 1.3), R(V.gy - z * 1.7), R(z * .2), R(z * 1.75));
      const len = z * 1.2 * Math.cos(open * 1.35); cx.fillStyle = col; cx.fillRect(R(gx + z * .1), R(V.gy - z * 1.3), R(len), R(z * .22)); cx.fillRect(R(gx + z * .1), R(V.gy - z * .75), R(len), R(z * .22));
      for (let k = 0; k < 3; k++) cx.fillRect(R(gx + z * .1 + len * k / 2.4), R(V.gy - z * 1.3), Math.max(1, R(z * .14 * Math.max(.2, Math.cos(open * 1.35)))), R(z * .78));
      ell(gx, V.gy - z * 1.8, z * .26, z * .26, col); ell(gx + z * 1.4, V.gy - z * 1.8, z * .26, z * .26, col); }
    q = { x: (RIDE.end - w.x) * W + V.puller.x + z * 2 }; if (q.x < W + z * 3) { cx.fillStyle = '#c8453a'; cx.fillRect(R(q.x), R(V.gy - z * 1.6), R(z * 1.8), R(z * 1.5)); cx.beginPath(); cx.moveTo(R(q.x - z * .2), R(V.gy - z * 1.55)); cx.lineTo(R(q.x + z * .9), R(V.gy - z * 2.4)); cx.lineTo(R(q.x + z * 2), R(V.gy - z * 1.55)); cx.fillStyle = '#8a2a24'; cx.fill(); cx.fillStyle = '#fff4e0'; cx.fillRect(R(q.x + z * .6), R(V.gy - z * .9), R(z * .6), R(z * .8)); } // the barn at the end of the road
    // the puller: a big gentle creature, then the two cars with their babies
    const P = V.puller, bounce = w.phase === 'ride' ? Math.abs(Math.sin(st.t * 6)) * z * .08 * m : 0, wig = Math.sin(st.t * 30) * w.wiggle * z * .05;
    shadow(P.x, V.gy + z * .1, z * .9); cx.fillStyle = '#6a4a36'; for (const lx of [-.5, -.2, .25, .55]) cx.fillRect(R(P.x + lx * z), R(P.y + z * .3 - bounce), R(z * .18), R(z * .55 + bounce));
    ell(P.x + wig, P.y - bounce, z * .85, z * .55, '#a87a54'); ell(P.x + z * .75 + wig, P.y - z * .45 - bounce, z * .42, z * .38, '#a87a54'); ell(P.x + z * .95 + wig, P.y - z * .32 - bounce, z * .2, z * .14, '#e8c8a8');
    ell(P.x + z * .78 + wig, P.y - z * .55 - bounce, z * .06, z * .07, '#2a1a18'); ell(P.x + z * .55 + wig, P.y - z * .82 - bounce, z * .14, z * .08, '#8a6a4a');
    cx.fillStyle = '#5a3a24'; cx.fillRect(R(V.cars[1].x + z * .9), R(P.y - z * .05), R(P.x - z * .8 - V.cars[1].x - z * .9), Math.max(1, R(z * .08)));
    const hint2 = hint();
    V.cars.forEach((c, i) => { const cw = wig * (i ? -1 : 1), cheer = st.t - w.cheer < 1.4 && (w.gate.big ? true : i === w.gate.col) ? Math.abs(Math.sin((st.t - w.cheer) * 9)) * z * .2 * m : 0, hb = hint2 && hint2.name === 'car' + i && !reduce() ? Math.abs(Math.sin(st.t * 3.2)) * z * .08 : 0;
      if (i) cx.fillRect(R(V.cars[0].x + z * .9), R(c.y), R(c.x - V.cars[0].x - z * 1.8), Math.max(1, R(z * .08)));
      const k = st.t - w.hop[i], ride = w.aboard[i] && k > .45, by = c.y - z * .55 - bounce - cheer - hb;
      if (ride) drawMini(c.x + cw, by, z * .9, i, w.phase === 'load' || w.phase === 'end' || cheer > 0, 0);
      cx.fillStyle = CARS[i]; cx.fillRect(R(c.x - z * .9 + cw), R(c.y - z * .6 - bounce - hb), R(z * 1.8), R(z * .85)); cx.fillStyle = mixHex(CARS[i], '#000000', .25); cx.fillRect(R(c.x - z * .9 + cw), R(c.y - z * .6 - bounce - hb), R(z * 1.8), Math.max(1, R(z * .14)));
      drawWheel(c.x - z * .5 + cw, c.y + z * .35 - hb * .3, z * .32, roll, '#3a2420'); drawWheel(c.x + z * .5 + cw, c.y + z * .35 - hb * .3, z * .32, roll, '#3a2420');
      if (!w.aboard[i]) drawMini(V.wait[i].x, V.wait[i].y, z * .9, i, false, hint2 && hint2.name === 'baby' + i && !reduce() ? Math.abs(Math.sin(st.t * 3.2)) * z * .15 : 0);
      else if (!ride) { const a = k / .45, hx = lerp(V.wait[i].x, c.x, a), hy = lerp(V.wait[i].y, by, a) - Math.sin(a * Math.PI) * z; drawMini(hx, hy, z * .9, i, false, 0); } });
    drawHint();
    const b = V.barn; ell(b.x, b.y, b.r, b.r, 'rgba(255,248,232,.9)'); cx.fillStyle = '#c8453a'; cx.fillRect(R(b.x - b.r * .55), R(b.y - b.r * .15), R(b.r * 1.1), R(b.r * .7));
    cx.beginPath(); cx.moveTo(R(b.x - b.r * .7), R(b.y - b.r * .1)); cx.lineTo(R(b.x), R(b.y - b.r * .62)); cx.lineTo(R(b.x + b.r * .7), R(b.y - b.r * .1)); cx.fillStyle = '#8a2a24'; cx.fill();
    cx.fillStyle = '#fff4e0'; cx.fillRect(R(b.x - b.r * .2), R(b.y + b.r * .12), R(b.r * .4), R(b.r * .43)); cx.fillStyle = '#5fb34a'; cx.fillRect(R(b.x - b.r * .7), R(b.y + b.r * .55), R(b.r * 1.4), Math.max(2, R(b.r * .1)));
    drawFx(U); }
  function drawShed() {
    const U = L.U, S2 = L.shed, z = S2.z, sh = st.shed;
    const wall = cx.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, '#c88a54'); wall.addColorStop(1, '#a8703e'); cx.fillStyle = wall; cx.fillRect(0, 0, W, H);
    cx.fillStyle = 'rgba(90,50,24,.35)'; for (let x = 0; x < W; x += Math.max(6, U * .12)) cx.fillRect(R(x), 0, 1, R(H * .74));
    const wx = W * .78, wy = H * .14, ww = Math.min(W * .16, U * .3); cx.fillStyle = '#5a3a24'; cx.fillRect(R(wx - ww * .55), R(wy - ww * .45), R(ww * 1.1), R(ww * .9)); // a window with the sky
    cx.fillStyle = '#9ad6f4'; cx.fillRect(R(wx - ww * .47), R(wy - ww * .37), R(ww * .94), R(ww * .74)); cx.fillStyle = '#5a3a24'; cx.fillRect(R(wx - 1), R(wy - ww * .37), 2, R(ww * .74)); cx.fillRect(R(wx - ww * .47), R(wy - 1), R(ww * .94), 2);
    [[.3, .12], [.5, .2], [.12, .45], [.88, .42], [.62, .08]].forEach(([a, b], i) => { const c = PAINT[i % 4]; ell(W * a, H * b, U * .04, U * .03, c); ell(W * a + U * .05, H * b + U * .02, U * .015, U * .015, c); }); // old splats on the wall
    cx.fillStyle = '#8a5a34'; cx.fillRect(0, R(H * .74), W, H - R(H * .74)); cx.fillStyle = 'rgba(60,34,18,.4)'; for (let y = H * .74; y < H; y += Math.max(5, U * .08)) cx.fillRect(0, R(y), W, 1);
    // the outline: each part white until it is painted, with a thick dark edge (a colouring book)
    const done = sh.doneAt !== null, hop = done ? Math.abs(Math.sin((st.t - sh.doneAt) * 9)) * z * .15 * (reduce() ? .3 : 1) : 0;
    drawHint(); shadow(S2.x, S2.y, z * 1.2); cx.save(); cx.translate(0, -hop);
    for (const part of PARTS) { const col = part in sh.parts ? PAINT[sh.parts[part]] : '#fffaf0';
      for (const q of shedPrims(part)) { cx.beginPath(); if (q.k === 'e') cx.ellipse(R(q.x), R(q.y), R(q.rx), R(q.ry), 0, 0, 7); else if (q.k === 'r') cx.rect(R(q.x), R(q.y), R(q.w), R(q.h)); else { cx.moveTo(R(q.pts[0][0]), R(q.pts[0][1])); cx.lineTo(R(q.pts[1][0]), R(q.pts[1][1])); cx.lineTo(R(q.pts[2][0]), R(q.pts[2][1])); cx.closePath(); }
        cx.fillStyle = col; cx.fill(); cx.strokeStyle = '#3a2420'; cx.lineWidth = Math.max(2, z * .05); cx.stroke(); } }
    const hx = S2.x + .42 * z, hy = S2.y - 1.25 * z, hr = .66 * z; // the face, always friendly
    ell(S2.x + .15 * z, S2.y - .45 * z, .42 * z, .24 * z, 'rgba(255,240,215,.75)'); ell(hx + hr * .2, hy + hr * .35, hr * .5, hr * .36, 'rgba(255,240,215,.85)');
    for (const s of [-1, 1]) { const ex = hx + s * hr * .38 + hr * .1, ey = hy - hr * .05; if (done) { cx.fillStyle = '#2a1a18'; cx.fillRect(R(ex - hr * .15), R(ey), R(hr * .3), Math.max(2, R(hr * .07))); } else { ell(ex, ey, hr * .15, hr * .19, '#2a1a18'); ell(ex - hr * .05, ey - hr * .07, hr * .05, hr * .05, '#fff'); } }
    ell(hx + hr * .25, hy + hr * .22, hr * .1, hr * .07, '#3a2420'); ell(hx + hr * .22, hy + hr * .5, hr * .13 * (done ? 1.2 : .8), hr * .1 * (done ? 1.3 : .6), '#8a2a2a');
    ell(hx - hr * .5, hy + hr * .2, hr * .15, hr * .09, '#ff9a8a'); ell(hx + hr * .65, hy + hr * .2, hr * .15, hr * .09, '#ff9a8a');
    cx.restore();
    // the pots, the chosen one lifted with a brush in it
    S2.pots.forEach((q, i) => { const on = i === sh.pot, lift = on ? S2.potR * (.25 + .06 * Math.sin(st.t * 5) * (reduce() ? 0 : 1)) : 0;
      if (on) ell(q.x, q.y + S2.potR * .2, S2.potR * 1.15, S2.potR * 1.05, 'rgba(255,250,210,.45)');
      drawPot(q.x, q.y, S2.potR, PAINT[i], lift);
      if (on) { cx.save(); cx.translate(R(q.x + S2.potR * .25), R(q.y - S2.potR * .35 - lift)); cx.rotate(.35); cx.fillStyle = '#8a5a34'; cx.fillRect(R(-S2.potR * .07), R(-S2.potR * 1.1), R(S2.potR * .14), R(S2.potR * .9)); cx.fillStyle = PAINT[i]; cx.fillRect(R(-S2.potR * .11), R(-S2.potR * .3), R(S2.potR * .22), R(S2.potR * .3)); cx.restore(); } });
    // the barn picture: home to the ranch
    const b = S2.barn; ell(b.x, b.y, b.r, b.r, 'rgba(255,248,232,.9)');
    cx.fillStyle = '#c8453a'; cx.fillRect(R(b.x - b.r * .55), R(b.y - b.r * .15), R(b.r * 1.1), R(b.r * .7));
    cx.beginPath(); cx.moveTo(R(b.x - b.r * .7), R(b.y - b.r * .1)); cx.lineTo(R(b.x), R(b.y - b.r * .62)); cx.lineTo(R(b.x + b.r * .7), R(b.y - b.r * .1)); cx.fillStyle = '#8a2a24'; cx.fill();
    cx.fillStyle = '#fff4e0'; cx.fillRect(R(b.x - b.r * .2), R(b.y + b.r * .12), R(b.r * .4), R(b.r * .43)); cx.fillStyle = '#5fb34a'; cx.fillRect(R(b.x - b.r * .7), R(b.y + b.r * .55), R(b.r * 1.4), Math.max(2, R(b.r * .1)));
    drawFx(U); }
  function draw() {
    if (st.place === 'shed') return drawShed();
    if (st.place === 'wagon') return drawWagon();
    const g = st.dusk, U = L.U;
    const sky = cx.createLinearGradient(0, 0, 0, L.ground); sky.addColorStop(0, pick3('#6cbcec', '#e8805a', '#121a44', g)); sky.addColorStop(1, pick3('#d4eef8', '#ffd08a', '#3a3a70', g));
    cx.fillStyle = sky; cx.fillRect(0, 0, W, L.ground + 1);
    if (g > .55) { cx.fillStyle = `rgba(255,255,230,${clamp((g - .55) * 2.2, 0, 1)})`; for (let i = 0; i < 40; i++) { const x = (i * 97.3) % W, y = (i * 53.7) % (L.ground * .8), tw = .6 + .4 * Math.sin(st.t * 2 + i); if (tw > .5 || st.moon.song) { const sz = st.moon.song && (i % 3 === (st.moon.song.i % 3)) ? 2 : 1; cx.fillRect(R(x), R(y), sz, sz); } } }
    const sunY = lerp(L.sun.y, L.ground + U * .1, clamp(g * 1.6, 0, 1)); const glow = st.sun.glow;
    ell(L.sun.x, sunY, U * (.13 + glow * .07), U * (.13 + glow * .07), `rgba(255,240,180,${(.25 + glow * .35) * (1 - g)})`); ell(L.sun.x, sunY, U * (.09 + glow * .025), U * (.09 + glow * .025), glow > 0 ? mixHex('#fff4b0', '#ffffff', glow) : pick3('#fff4b0', '#ffb050', '#ff8040', g));
    if (st.sun.bow) drawRainbow(st.t - st.sun.bow.at);
    if (g > .6) { const k = clamp((g - .6) / .4, 0, 1), mg = st.moon.song ? 1 : st.moon.glow, pulse = st.moon.song ? clamp(1 - (st.t - st.moon.song.beat) / BEAT, 0, 1) * .25 : 0;
      if (mg > 0) { ell(W * .8, lerp(L.ground, H * .16, k), U * (.11 + mg * .05 + pulse * .03), U * (.11 + mg * .05 + pulse * .03), `rgba(240,240,200,${.12 + mg * .2 + pulse * .2})`); }
      ell(W * .8, lerp(L.ground, H * .16, k), U * .07, U * .07, '#f4f0d8'); ell(W * .8 + U * .03, lerp(L.ground, H * .16, k) - U * .02, U * .06, U * .06, (mg > 0 ? mixHex('#121a44', '#5a5e6e', clamp((.12 + mg * .2 + pulse * .2) / .37, 0, 1)) : '#121a44')); }
    ell(W * .25, L.ground + U * .05, W * .45, U * .22, pick3('#8acb6a', '#a0a050', '#2a4a48', g)); ell(W * .8, L.ground + U * .07, W * .4, U * .18, pick3('#7abf5c', '#909848', '#24423f', g));
    cx.fillStyle = pick3('#7cc85a', '#b0a050', '#2a4a40', g); cx.fillRect(0, R(L.ground), W, H - R(L.ground));
    cx.fillStyle = pick3('#a87a4a', '#a06a3a', '#3a2e38', g); const fy = L.ground + U * .02; cx.fillRect(0, R(fy), W, Math.max(1, R(U * .025))); cx.fillRect(0, R(fy + U * .07), W, Math.max(1, R(U * .025)));
    for (let x = W * .05; x < W; x += U * .3) cx.fillRect(R(x), R(fy - U * .03), Math.max(2, R(U * .03)), R(U * .14));
    for (let i = 0; i < 30; i++) { const x = (i * 61.7) % W, y = L.ground + U * .2 + (i * 37.1) % (H - L.ground - U * .2); cx.fillStyle = pick3('#5aa848', '#8a8a40', '#1e3a36', g); cx.fillRect(R(x), R(y), 1, 2); }
    drawHint();
    drawSign(g); drawWheelSign(g);
    const hidden = st.baby.act === 'hide' || st.baby.act === 'peek';
    if (!hidden) drawBush(false);
    // the bowl
    const bw = L.R, bb = hintBob('bowl'); shadow(L.bowl.x, L.bowl.y, bw); cx.save(); cx.translate(0, -R(bb)); ell(L.bowl.x, L.bowl.y - bw * .25, bw, bw * .45, pick3('#4a90d8', '#5a7ab8', '#2a3a68', g)); ell(L.bowl.x, L.bowl.y - bw * .45, bw * .82, bw * .2, '#2a4a7a');
    if (st.bowl.food > 0) for (let i = 0; i < 9 * st.bowl.food; i++) ell(L.bowl.x + (i % 5 - 2) * bw * .3, L.bowl.y - bw * (.5 + (i % 2) * .12), bw * .14, bw * .11, '#c8823a'); cx.restore();
    drawFlowers(g);
    if (hidden) { // peekaboo: behind the bush, then up comes the head
      const k = st.baby.act === 'peek' ? Math.sin(clamp((st.t - st.baby.at) / 1.4, 0, 1) * Math.PI) : 0, save = st.baby.x;
      const base = L.bush.y + L.R * .3; cx.save(); cx.beginPath(); cx.rect(0, 0, W, R(base)); cx.clip(); // only what rises above the bush's foot shows
      cx.translate(0, L.bush.y - L.home.y + L.size * .9 - k * L.size * 1.4); st.baby.x = L.bush.x; drawBaby(); st.baby.x = save; cx.restore(); drawBush(true); }
    else drawBaby();
    // the sponge
    const s = st.sponge, sw = L.R * .8; if (!s.drag && !s.auto) shadow(s.x, s.y + sw * .3, sw);
    cx.save(); cx.translate(R(s.x), R(s.y - hintBob('sponge'))); cx.rotate(s.drag || s.auto ? Math.sin(st.t * 10) * .2 : 0);
    cx.fillStyle = pick3('#ffd84a', '#ffc04a', '#6a6040', g); cx.fillRect(R(-sw), R(-sw * .55), R(sw * 2), R(sw * 1.1)); cx.fillStyle = 'rgba(200,140,40,.6)';
    for (const [a, c] of [[-.5, -.2], [.3, .1], [-.1, .25], [.6, -.25]]) cx.fillRect(R(a * sw), R(c * sw), Math.max(1, R(sw * .16)), Math.max(1, R(sw * .16))); cx.restore();
    for (const u of st.bubbles) { const x = u.x + Math.sin(st.t * 2 + u.seed) * u.r * .8; cx.strokeStyle = 'rgba(255,255,255,.9)'; cx.lineWidth = 1; cx.beginPath(); cx.arc(R(x), R(u.y), Math.max(2, R(u.r)), 0, 7); cx.stroke();
      ell(x, u.y, u.r, u.r, 'rgba(200,230,255,.25)'); ell(x - u.r * .35, u.y - u.r * .35, u.r * .2 + .5, u.r * .2 + .5, '#fff'); }
    drawFx(U);
    if (g > 0) { cx.fillStyle = `rgba(20,20,60,${g * .25})`; cx.fillRect(0, 0, W, H); }
  }

  /* ---------------- touch and mouse ---------------- */
  const at = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
  // LR-C1: where tap zones overlap (big zones on a tablet), the thing whose middle is nearest wins, so a tap on the
  // baby's head beside the bush tickles the baby rather than starting peekaboo.
  function ranchTarget(p) { const s = st.sponge, c = [];
    if (!s.auto) c.push(['sponge', s, L.R * 1.1]); c.push(['sign', L.sign, L.R * 1.1], ['wsign', L.wsign, L.R * 1.1], ['bowl', L.bowl, L.R * 1.2], ['bush', { x: L.bush.x, y: L.bush.y - L.R * .4 }, L.R * 1.4]);
    if (st.baby.act !== 'hide') c.push(['baby', babyCentre(), L.size * 1.2]); if (daytime()) c.push(['sun', sunAt(), Math.max(L.U * .16, L.R)]);
    L.flowers.forEach((q, i) => c.push(['flower' + i, { x: q.x, y: q.y }, q.r * 1.15]));
    let best = null, bk = 1; for (const [n, q, r] of c) { const k = Math.hypot(p.x - q.x, p.y - q.y) / r; if (k <= bk) { bk = k; best = n; } } return best; }
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); audio(); const p = at(e), s = st.sponge; st.idleAt = st.t;
    // LR9: the shed and the sign act when the finger lifts (like the grown-up panel, LR15); a drag over the outline paints
    if (st.place === 'wagon') { st.down = { id: e.pointerId, p }; return; }
    if (st.place === 'shed') { st.down = { id: e.pointerId, p, drag: false }; try { cv.setPointerCapture(e.pointerId); } catch (err) {} return; }
    if (st.mode !== 'play') { // bedtime: taps twinkle; six taps on the sleeping baby wake it for a new day (LR12)
      if (st.baby.act === 'sleep' && near(p, babyCentre(), L.size * 1.2)) return nudge();
      if (moonUp() && near(p, moonAt(), Math.max(L.U * .16, L.R))) return hum();
      fx('spark', p.x, p.y); sfx('twinkle'); return; }
    const bub = st.bubbles.find(u => Math.hypot(u.x - p.x, u.y - p.y) < u.r * 1.8 + L.U * .02);
    if (bub) { st.bubbles.splice(st.bubbles.indexOf(bub), 1); fx('spark', bub.x, bub.y); sfx('pop'); return; }
    st.idleAt = st.t;
    const pick = ranchTarget(p); if (pick) st.used[/^flower/.test(pick) ? 'flowers' : pick] = 1;
    if (pick === 'sponge') { s.drag = { id: e.pointerId, x: p.x, y: p.y, at: performance.now(), moved: 0 }; try { cv.setPointerCapture(e.pointerId); } catch (err) {} return; }
    if (pick === 'sign') { st.down = { id: e.pointerId, p, sign: 'paint' }; st.sign.shake = .5; return; }
    if (pick === 'wsign') { st.down = { id: e.pointerId, p, sign: 'wagon' }; st.wsign.shake = .5; return; }
    if (/^flower/.test(pick)) { const i = +pick.slice(6); st.down = { id: e.pointerId, p, flower: i }; try { cv.setPointerCapture(e.pointerId); } catch (err) {} return sing(i); }
    if (pick === 'bowl') return act.feed();
    if (pick === 'bush') return act.peek();
    if (pick === 'baby') return act.tickle();
    if (pick === 'sun') return shine();
    act.sparkle(p);
  });
  cv.addEventListener('pointermove', e => { const d = st.down;
    if (d && d.id === e.pointerId && d.flower !== undefined) { const i = flowerAt(at(e)); if (i >= 0 && i !== d.flower) { d.flower = i; sing(i); } return; } if (d && d.id === e.pointerId && st.place === 'shed') { const p = at(e);
      if (!d.drag && Math.hypot(p.x - d.p.x, p.y - d.p.y) > L.shed.z * .15) { d.drag = true; paintPart(partAt(d.p), d.p); } if (d.drag) paintPart(partAt(p), p); return; }
    const s = st.sponge; if (!s.drag || s.drag.id !== e.pointerId) return; const p = at(e);
    s.drag.moved += Math.hypot(p.x - s.x, p.y - s.y); s.x = p.x; s.y = p.y; if (near(p, babyCentre(), L.size * 1.3)) act.scrub(p); });
  const release = e => { const d = st.down; if (d && d.id === e.pointerId) { st.down = null; if (e.type === 'pointercancel') return; const p = at(e);
      if (d.sign === 'paint') { if (near(p, L.sign, L.R * 1.3)) enterShed(); return; } if (d.sign === 'wagon') { if (near(p, L.wsign, L.R * 1.3)) enterWagon(); return; } if (d.flower !== undefined) return; if (!d.drag && st.place === 'shed') shedTap(p); if (st.place === 'wagon') wagonTap(p); return; }
    const s = st.sponge; if (!s.drag || s.drag.id !== e.pointerId) return;
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
  // The panel's buttons act on the pointer lifting over the button where it went down (with click as the fallback for
  // keyboards and scripts), so they don't depend on the browser turning a touch into a click: in an Android WebView
  // that click can be dropped, which left "Back to play" doing nothing (LR15).
  const APP = /[?&]app=1(&|$)/.test(location.search) || !!window.LittleRanchApp; // inside the standalone app
  if (APP) panel.classList.add('app');
  function press(el, fn) {
    let down = null, fired = -1e9;
    el.addEventListener('pointerdown', e => { down = e.pointerId; });
    el.addEventListener('pointercancel', () => { down = null; });
    el.addEventListener('pointerup', e => { if (down !== e.pointerId) return; down = null; if (el === panel && e.target !== panel) return; e.preventDefault(); fired = performance.now(); fn(); });
    el.addEventListener('click', e => { e.preventDefault(); if (performance.now() - fired < 700) return; if (el === panel && e.target !== panel) return; fn(); });
  }
  function soundLabel() { const b = document.getElementById('gSound'); document.getElementById('gSoundLabel').textContent = prefs.sound ? 'Sound on' : 'Sound off';
    b.classList.toggle('off', !prefs.sound); b.setAttribute('aria-pressed', String(prefs.sound)); document.getElementById('gWaves').style.display = prefs.sound ? '' : 'none'; document.getElementById('gMute').style.display = prefs.sound ? 'none' : ''; }
  function openPanel() { panel.hidden = false; soundLabel(); clearTimeout(idle); idle = setTimeout(closePanel, 20000); }
  function closePanel() { panel.hidden = true; clearTimeout(idle); }
  if (APP) document.getElementById('gNewLabel').textContent = 'Replay';
  press(panel, closePanel); // a tap on the dimmed backdrop, outside the card
  press(document.getElementById('gX'), closePanel);
  press(document.getElementById('gClose'), closePanel);
  press(document.getElementById('gNew'), () => { newVisit(); closePanel(); });
  press(document.getElementById('gSound'), () => { prefs.sound = !prefs.sound; try { localStorage.setItem(PREF, JSON.stringify(prefs)); } catch (e) {} if (!prefs.sound && ac) { ac.close(); ac = null; } soundLabel(); clearTimeout(idle); idle = setTimeout(closePanel, 20000); });
  press(document.getElementById('gHome'), () => { location.href = document.getElementById('gHome').href; });
  press(document.getElementById('gExit'), () => { closePanel(); try { window.LittleRanchApp && window.LittleRanchApp.exit(); } catch (e) {} });

  /* ---------------- run ---------------- */
  newVisit(); addEventListener('resize', layout);
  let last = performance.now();
  (function loop(now) { const dt = Math.min(.1, (now - last) / 1000); last = now; layout(); update(dt); draw(); requestAnimationFrame(loop); })(last);
  // for the checks (tests/little-ranch.html): the state, the places, and a way to move time on
  window.LR = { VERSION, PREF, BEDTIME_ACTS, HOLD_MS, WAKE_TAPS, SUN_TAPS, BOW_SECS, MOON_TAPS, BEAT, SONG_BEATS, TWINKLE, get tones() { return tones; }, get prefs() { return prefs; }, moonAt: () => moonAt(), PAINT, PARTS, HINT_SECS, FLOWERS, FLOWER_NOTES, SONG_TAPS, sing: i => sing(i), CARS, RIDE, enterWagon, leaveWagon, thingAt: k => thingAt(k), hint: () => hint(), ranchTarget: p => ranchTarget(p), enterShed, leaveShed, partPoint: k => partPoint(k), partAt: p => partAt(p), get state() { return st; }, get layout() { return L; }, get scale() { return S; }, act, bedtime, newVisit, openPanel, APP,
    advance(secs) { for (let k = 0; k < secs; k += 1 / 30) update(1 / 30); draw(); },
    toScreen(p) { const r = cv.getBoundingClientRect(); return { x: r.left + p.x / W * r.width, y: r.top + p.y / H * r.height }; } };
})();

