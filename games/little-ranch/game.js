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
   picture goes home at any time. A wagon-wheel sign leads to the Little Wagon (LR10); a snack-bowl sign to the Snack
   Kitchen (LR11): tap a food and the baby eats it, loving berries and pulling funny faces at the rest. On some visits a baby
   Pebblit friend wanders in (LR4): it eats and gets bubbly too, and a tap on it makes the two nuzzle. Tap the cloud for soft rain (LR5); afterwards
   puddles shine on the grass and a rainbow comes out; tap a puddle and the baby jumps in. The hat basket (LR6): each tap puts the next hat on the baby's head. At bedtime (LR7) the
   toothbrush, a cup of water and goodnight to each friend come before the lullaby. The device's own voice says the
   creatures' names, the colours and "night night" (LR8). No microphone, and nothing is saved. A big soft ball sits in the grass (LR16): tap it and it rolls, and the baby runs over and kicks it. Checks: tests/little-ranch.html. */
(function () {
  const VERSION = '0.16.0', PREF = 'little-ranch-settings-v1', BEDTIME_ACTS = 12, BEDTIME_SECS = 360, HOLD_MS = 3000, WAKE_TAPS = 6, SUN_TAPS = 5, BOW_SECS = 5, MOON_TAPS = 3, BEAT = .45, SHED_WALK_SECS = 2.6, HINT_SECS = 6;
  // LR-C1: things on the ranch, in the order an idle hint offers them (the first one not yet played with)
  const HINTS = ['bowl', 'sponge', 'bush', 'baby', 'friend', 'flowers', 'sun', 'cloud', 'puddle', 'basket', 'ball', 'sign', 'wsign', 'ksign', 'tsign'];
  // LR11: the Snack Kitchen. Four foods (berries, carrot, lemon, broccoli), one bowl, one baby who loves berries and pulls a
  // funny face at the rest (puffed cheeks, a sour squeeze, a tongue out). Three bowls of berries and it's full and happy.
  // LR4: a second friend. On some visits (about half) a baby Pebblit wanders in and settles beside the baby. Tap the bowl
  // and it trots over and eats too; the sponge bubbles it as well; tap it and the two babies run together and nuzzle.
  // LR5: rain and puddles. Tap the cloud: soft rain for a few seconds (another tap keeps it going); when it stops, two
  // puddles shine on the grass and a rainbow comes out. Tap a puddle and the baby runs over and jumps in, splash! The puddles dry up after a while.
  // LR6: the hat basket. Tap it and a hat hops out onto the baby's head: a straw sun hat, a party hat, a crown, a flower
  // crown, a cowboy hat, then the hat hops back in (bare head) and round again. Every third hat is one happy thing.
  // LR7: the bedtime routine. At dusk, before the lullaby: tap the toothbrush (the baby brushes, foamy), then the cup (a big
  // drink), then say goodnight to each friend (the flowers, and the Pebblit when it's visiting): tap them and they wave and
  // yawn. Then the lullaby and sleep. Nothing to fail and never stuck: a step left alone for a few seconds does itself.
  const ROUTINE = ['teeth', 'water', 'night'], ROUTINE_WAIT = 8, BRUSH_SECS = 1.8, DRINK_SECS = 1.4; let useRoutine = true;
  const HATS = ['straw', 'party', 'crown', 'flowers', 'cowboy'], HAT_FLY = .6, HAT_TRIES = 3;
  const RAIN_SECS = 5, PUDDLE_SECS = 60, SPLASH_SECS = 1.3;
  // LR16: the meadow ball. Tap it and it rolls to the other side of the grass; the baby runs over and kicks. Every third kick is one happy thing. Nothing to miss. At night a tap only boings.
  const FRIEND_ODDS = .5, NUZZLE_SECS = 1.6, FRIEND_EAT_SECS = 2.4; let forceFriend = null;
  const FOODS = ['berries', 'carrot', 'lemon', 'broccoli'], FOOD_FACES = ['yum', 'puff', 'sour', 'tongue'], KITCHEN_BERRIES = 3, FLY_SECS = .5, EAT_SECS = .9, FACE_SECS = 1.6, KITCHEN_END_SECS = 2.6;
  // LR18: the Dough Table. One lump of dough in the baby's colour: tap it and it squishes flat; rub a finger over it (a
  // forgiving drag, anywhere on the table) and it rolls back into a ball. Tap the cutter and it stamps out a little dough baby
  // that hops away. There's always more dough. Three little babies and it's a happy cheer, then home (one happy thing).
  const DOUGH_BABIES = 3, STAMP_SECS = .9, DOUGH_END_SECS = 2.6;
  // LR10: the Little Wagon. Two cars (red and blue), two babies to load, three things along the valley and one colour gate
  const CARS = ['#e8483c', '#3f8ae8'], RIDE = { windmill: 1.05, pond: 1.75, woolies: 2.45, gate: 3.2, end: 4.1 }, RIDE_SPEED = .24, WAGON_END_SECS = 2.4;
  // LR3: the singing flowers, a row of five along the front of the meadow, each with its own note (C D E G A: any order sounds sweet)
  const FLOWERS = ['#ff6f91', '#ffa040', '#b07aff', '#4fb4ff', '#ff5a5a'], FLOWER_NOTES = [72, 74, 76, 79, 81], SONG_TAPS = 5;
  // LR9: the Paint Shed's four fat pots and the four parts of the baby's outline (in the order they're drawn)
  const PAINT = ['#ff6fa8', '#4fa6ff', '#ffd03a', '#5fd06a'], PARTS = ['tail', 'legs', 'body', 'head'];
  // LR8: spoken words, the browser's own voice. Names, colours and "night night". No microphone, nothing saved.
  // Sound off means silence. A real parent's recording still needs Evan's yes.
  const POT_WORDS = ['pink', 'blue', 'yellow', 'green'], FLOWER_WORDS = ['pink', 'orange', 'purple', 'blue', 'red'], CAR_WORDS = ['red', 'blue'], FOOD_WORDS = ['berries', 'carrot', 'lemon', 'broccoli'];
  const words = [];
  function speak(text) {
    if (!prefs.sound || !text) return;
    words.push(text);
    try {
      const syn = window.speechSynthesis; if (!syn || typeof syn.speak !== 'function') return;
      syn.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = .85; u.pitch = 1.15; u.lang = 'en-US'; u.onerror = () => {};
      syn.speak(u);
    } catch (e) {}
  }
  function speakNight() { if (st.nightSaid) return; st.nightSaid = true; speak('Night night'); }
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
    drip: () => tone(1400 + Math.random() * 900, .04, 0, .035, 'sine', 900),
    splash: () => { crunch(); tone(500, .2, 0, .2, 'sine', 1200); },
    boing: () => tone(196, .22, 0, .32, 'sine', 98),
    clop: () => tone(180 + Math.random() * 30, .07, 0, .1, 'triangle', 140),
    yum: () => { tone(hz(72), .12, 0, .25, 'triangle'); tone(hz(76), .12, .12, .25, 'triangle'); tone(hz(84), .25, .24, .25, 'triangle'); },
    funny: k => { const f = [0, 330, 520, 260][k] || 300; tone(f, .5, 0, .22, 'triangle', f * .55); tone(f * 1.02, .5, .03, .08, 'sine', f * .5); },
    munch: () => { crunch(); tone(260, .08, 0, .12, 'triangle', 200); },
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
      place: 'ranch', shed: { pot: 0, parts: {}, doneAt: null }, paint: null, sign: { shake: 0 }, used: {}, idleAt: 0, flowers: FLOWERS.map(() => ({ bob: 0, at: -9 })), sung: 0, wsign: { shake: 0 }, wagon: null, ksign: { shake: 0 }, kitchen: null, tsign: { shake: 0 }, dough: null, friend: null, cloud: { rain: null, until: 0, puff: 0 }, puddles: [], hat: { wear: -1, fly: null, tries: 0, shake: 0 }, ball: { from: -1, to: -1, at: -9, kicks: 0 }, routine: null, shut: 0 };
    if (forceFriend !== null ? forceFriend : Math.random() < FRIEND_ODDS) st.friend = { x: 1.1, tx: null, then: null, act: null, at: 0, soap: 0, dir: -1 };
    layout(); st.baby.x = L.home.x; if (st.friend) fgo(L.fhome.x, null); // it wanders in from the right
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
    L.cloud = { x: W * .64, y: Math.max(H * .08, U * .08), r: Math.min(U * .1, H * .11) }; // LR5
    L.puddles = [{ x: W / 2 - sp * .62, y: H * .69 }, { x: W / 2 + sp * (wide ? .7 : .5), y: H * (wide ? .67 : .7) }].map(q => ({ ...q, r: U * .12 }));
    L.basket = wide ? { x: Math.max(U * .14 * .62, L.sign.x - U * .14 * (.1 + .6 * .95)), y: H * .69, r: U * .14 * .6 } : { x: Math.max(W * .09, U * .14 * .95), y: H * .7, r: U * .14 * .9 }; // wide: left of the paint sign's post (LR-POLISH-1) // LR6: the hat basket, at the field's left edge
    L.item = wide ? { x: L.bowl.x + U * .14 * .6, y: L.bowl.y - U * .14 * .45, r: U * .14 * .8 } : { x: Math.max(U * .14 * 1.2, L.home.x - L.size * 2.1), y: L.home.y - L.size * .55, r: U * .14 * .95 }; // LR7: where the toothbrush and the cup wait
    L.fhome = { x: L.home.x + (L.sponge.x - L.home.x) * .9, y: L.home.y }; L.fz = L.size * .95; // LR4: the friend's spot, between the baby and the sponge
    L.ksign = { x: W * .45, y: L.ground - U * .14 * 1.7 }; // LR11: the snack-bowl sign, on the hilltop
    { const fr = Math.min(W * .108, H * .1), ty = H * .64, z = Math.min(W * .22, H * .24);
      L.kitchen = { fr, ty, z, baby: { x: W * .5, y: ty }, bowl: { x: W * .5, y: ty + z * .12, r: Math.max(fr * 1.1, z * .5) }, foods: FOODS.map((f, i) => ({ x: W * (.125 + i * .25), y: H * .87 })), barn: L.shed.barn }; }
    L.tsign = wide ? { x: (L.sign.x + L.ksign.x) / 2, y: H * .48 } : { x: W * .3, y: L.ground - U * .14 * 3.4 }; // LR18: the dough sign, between the paint and snack signs
    { const lr = Math.min(W * .17, H * .17), cr = Math.min(W * .1, H * .1); // LR18
      L.dough = { lr, cr, ty: H * .5, lump: { x: W * .42, y: H * .66 }, cutter: { x: W * .8, y: H * .64 }, barn: L.shed.barn }; }
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
  const fCentre = () => ({ x: st.friend.x * W, y: L.home.y - L.fz * .75 });
  function fgo(x, then) { const f = st.friend; f.tx = x / W; f.then = then; f.dir = x < f.x * W ? -1 : 1; }
  function friendTap() { const f = st.friend, b = st.baby; // LR4: run together and nuzzle (one happy thing); if anyone's busy, just a giggle
    speak('Pebblit');
    if (busy() || f.act || f.tx !== null || st.sponge.auto) { if (!f.act && f.tx === null) { f.act = 'giggle'; f.at = st.t; } sfx('giggle'); return; }
    f.act = 'wait'; go(f.x * W - L.size * 1.15, () => { b.dir = 1; b.act = 'nuzzle'; b.at = st.t; f.act = 'nuzzle'; f.at = st.t; f.dir = -1; sfx('giggle'); sfx('wake');
      for (let i = 0; i < 4; i++) fx('heart', f.x * W - L.size * .6 + (i - 1.5) * L.size * .35, L.home.y - L.size * 1.9); }); }
  function scrubFriend(p) { const f = st.friend; if (!f || f.act === 'sleep') return; f.soap = Math.min(1, f.soap + .05);
    if (!(st.t - (st.sponge.lastFBubble || -1) < .08)) { st.sponge.lastFBubble = st.t; st.bubbles.push({ x: p.x + (Math.random() - .5) * L.fz, y: p.y, r: L.U * (.025 + Math.random() * .03), at: st.t, seed: Math.random() * 6 }); if (Math.random() < .4) sfx('bloop'); }
    if (!f.act && f.tx === null) { f.act = 'giggle'; f.at = st.t; } st.sponge.scrubbed = true; }
  function friendUpdate(dt) { const f = st.friend; if (!f) return; const sp = L.U * .9 / W;
    if (f.tx !== null) { const d = f.tx - f.x; if (Math.abs(d) <= sp * dt) { f.x = f.tx; f.tx = null; const g = f.then; f.then = null; if (g) g(); } else f.x += Math.sign(d) * sp * dt; }
    const since = st.t - f.at;
    if (f.act === 'eat') { if (Math.floor(since / .4) !== Math.floor((since - dt) / .4)) fx('crumb', L.bowl.x + (Math.random() - .5) * L.R, L.bowl.y - L.R * .3); if (since > FRIEND_EAT_SECS) { f.act = null; fgo(L.fhome.x, null); } }
    if (f.act === 'giggle' && since > .8) f.act = null;
    if (f.act === 'nuzzle' && since > NUZZLE_SECS) f.act = null;
    if (f.act === 'wait' && st.baby.tx === null && st.baby.act !== 'nuzzle') f.act = null;
    if (st.mode === 'sleep' && f.tx === null && f.act !== 'sleep') { f.act = 'sleep'; f.x = Math.min(W - L.fz * .85, Math.max(L.fhome.x, L.home.x + L.size * 1.32 + L.fz * .82)) / W; } // curled up clear of the sleeping baby (LR-POLISH-1)
    f.soap = Math.max(0, f.soap - dt * .08); }
  function drawFriend() { const f = st.friend; if (!f) return; const z = L.fz, x = f.x * W, y = L.home.y, since = st.t - f.at, m = reduce() ? .3 : 1;
    if (f.act === 'sleep') { shadow(x, y, z * .9); ell(x, y - z * .4, z * .8, z * .45, '#8fa0b8'); ell(x - z * .3, y - z * .55, z * .1, z * .08, '#6a7a94'); ell(x + z * .45, y - z * .45, z * .38, z * .34, '#8fa0b8');
      cx.fillStyle = '#2a1a18'; for (const dx of [.33, .58]) cx.fillRect(R(x + dx * z - z * .07), R(y - z * .5), R(z * .14), Math.max(1, R(z * .04))); return; }
    let hop = 0; if (f.tx !== null) hop = Math.abs(Math.sin(st.t * 12)) * z * .15 * m; if (f.act === 'giggle') hop = Math.abs(Math.sin(since * 16)) * z * .2 * m;
    if (f.act === 'nuzzle') hop = Math.abs(Math.sin(since * 6)) * z * .08 * m; if (f.act === 'eat') hop = Math.abs(Math.sin(since * 9)) * z * .1 * m;
    hop += hintBob('friend');
    drawMini(x, y, z, 1, f.act === 'nuzzle' || f.act === 'giggle', hop);
    if (f.soap > .05) for (let i = 0; i < 6; i++) ell(x + Math.cos(i * 2.1) * z * .55, y - hop - z * (.6 + .45 * Math.sin(i * 1.7)), z * .12 * f.soap + 1, z * .1 * f.soap + 1, 'rgba(255,255,255,.85)'); }

  const act = {
    feed() { if (st.baby.act === 'eat' || st.bowl.food > 0) { fx('spark', L.bowl.x, L.bowl.y - L.R * .5); return; }
      st.bowl.food = 1; sfx('plink'); if (st.baby.act === 'hide' || st.baby.act === 'peek') st.baby.act = null;
      go(L.bowl.x + L.size * 1.3, () => { st.baby.dir = -1; st.baby.act = 'eat'; st.baby.at = st.t; });
      const f = st.friend; if (f && !f.act && f.tx === null) fgo(Math.max(L.size * .9, L.bowl.x - L.size * .9), () => { f.act = 'eat'; f.at = st.t; f.dir = 1; }); }, // LR4: the friend eats too
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
    tickle() { const b = st.baby; speak('Cindercub'); if (b.act || b.tx !== null) { sfx('giggle'); return; } b.act = 'giggle'; b.at = st.t; sfx('giggle'); done(); },
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
  function pickPot(i) { st.shed.pot = i; sfx('pick', i); speak(POT_WORDS[i]); const q = L.shed.pots[i]; fx('spark', q.x, q.y - L.shed.potR); }
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
    if (st.place === 'dough') { const D = st.dough, V = L.dough; if (D.phase !== 'play' || D.stamp) return null;
      return D.flat < .5 && !D.stamps ? { name: 'lump', ...V.lump, r: V.lr * 1.2 } : { name: 'cutter', ...V.cutter, r: V.cr * 1.3 }; }
    if (st.place === 'kitchen') return st.kitchen.phase === 'idle' ? { name: 'food0', x: L.kitchen.foods[0].x, y: L.kitchen.foods[0].y, r: L.kitchen.fr * 1.25 } : null;
    if (st.place === 'shed') { if (st.shed.doneAt !== null) return null; const k = PARTS.find(q => !(q in st.shed.parts)); const z = L.shed.z;
      return k ? { name: k, ...partPoint(k), r: z * .55 } : null; }
    if (st.mode === 'dusk' && st.routine && st.routine.step < 3 && !st.routine.doing && st.baby.act !== 'yawn' && st.baby.tx === null) { const r = st.routine; // LR7
      if (r.step < 2) return { name: 'item', x: L.item.x, y: L.item.y, r: L.item.r * 1.1 };
      return r.said.flowers ? { name: 'friend', ...fCentre(), r: L.fz * 1.1 } : { name: 'flowers', x: L.flowers[2].x, y: L.flowers[2].y, r: L.flowers[2].r * 1.4 }; }
    if (st.mode === 'sleep') return st.baby.act === 'sleep' && !st.moon.song ? { name: 'baby', ...babyCentre(), r: L.size * 1.1 } : null;
    if (st.mode !== 'play' || busy() || st.sponge.drag || st.sponge.auto || st.sun.bow) return null;
    const ok = k => (!['sun', 'cloud'].includes(k) || daytime()) && (k !== 'puddle' || st.puddles.some(q => q.i === 0)) && (k !== 'friend' || (st.friend && st.friend.tx === null)), left = HINTS.filter(k => !st.used[k] && ok(k)), all = HINTS.filter(ok);
    const name = left.length ? left[0] : all[Math.floor((st.t - st.idleAt - HINT_SECS) / 8) % all.length];
    const at = { bowl: [L.bowl, L.R * 1.1], sponge: [L.sponge, L.R * 1.05], bush: [{ x: L.bush.x, y: L.bush.y - L.R * .5 }, L.R * 1.35], baby: [babyCentre(), L.size * 1.1], sun: [sunAt(), L.U * .15], sign: [{ x: L.sign.x, y: L.sign.y - L.R * .45 }, L.R * 1.05], flowers: [L.flowers[2], L.flowers[2].r * 1.4], wsign: [{ x: L.wsign.x, y: L.wsign.y - L.R * .45 }, L.R * 1.05], ksign: [{ x: L.ksign.x, y: L.ksign.y - L.R * .45 }, L.R * 1.05], tsign: [{ x: L.tsign.x, y: L.tsign.y - L.R * .45 }, L.R * 1.05], friend: [st.friend ? fCentre() : L.home, L.fz * 1.1], cloud: [L.cloud, L.cloud.r * 1.3], basket: [{ x: L.basket.x, y: L.basket.y - L.R * .15 }, L.R * 1.05], puddle: [L.puddles[0], L.puddles[0].r], ball: [ballNow(), ballNow().r * 1.2] }[name];
    return { name, x: at[0].x, y: at[0].y, r: at[1] };
  }
  function drawHint() { const h = hint(); if (!h) return; const k = st.t - st.idleAt - HINT_SECS, m = reduce() ? 0 : 1, pulse = .5 + .5 * Math.sin(k * 3.2);
    const a = clamp(k / 1.2, 0, 1) * (.22 + .2 * (m ? pulse : .5)), r = h.r * (1 + .08 * pulse * m);
    ell(h.x, h.y, r, r * .92, `rgba(255,250,200,${a})`); cx.strokeStyle = `rgba(255,255,255,${a * 1.6})`; cx.lineWidth = Math.max(2, L.U * .012); cx.beginPath(); cx.arc(R(h.x), R(h.y), R(r), 0, 7); cx.stroke();
    if (m && Math.floor(k / 1.4) !== Math.floor((k - 1 / 30) / 1.4)) fx('spark', h.x + (Math.random() - .5) * h.r, h.y - h.r * .6); }
  const hintBob = name => { const h = hint(); if (!h || h.name !== name || reduce()) return 0; return Math.abs(Math.sin((st.t - st.idleAt) * 3.2)) * L.U * .025; };
  const BALL_ROLL = .7, BALL_KICKS = 3;
  function ballSpot(side) { const y = L.ground + L.R * 1.35, span = Math.min(L.size * 1.15, W * .18);
    return { x: clamp(L.home.x + side * span, W * .24, W * .76), y, r: L.R * .88 }; }
  function ballNow() { const b = st.ball, A = ballSpot(b.from), B = ballSpot(b.to), k = b.at < 0 ? 1 : clamp((st.t - b.at) / BALL_ROLL, 0, 1), e = k * k * (3 - 2 * k);
    return { x: lerp(A.x, B.x, e), y: A.y, r: A.r, rolling: b.at >= 0 && k < 1 }; }
  function kickBall() { const b = st.ball; if (b.at >= 0 && st.t - b.at < BALL_ROLL) { sfx('boing'); return; }
    b.from = b.to; b.to = -b.from; b.at = st.t; sfx('boing'); if (st.mode === 'play') speak('ball');
    if (st.mode !== 'play' || busy() || st.sponge.drag || st.sponge.auto) return;
    go(ballSpot(b.to).x, () => { if (st.mode !== 'play') return; st.baby.act = 'giggle'; st.baby.at = st.t; sfx('giggle'); if (++b.kicks % BALL_KICKS === 0) done(); }); }
  function drawBall() { const q = ballNow(), g = st.dusk, bob = hintBob('ball'), squash = q.rolling ? 1.12 : 1;
    shadow(q.x, q.y + q.r * .15, q.r); ell(q.x, q.y - bob, q.r * squash, q.r / squash, pick3('#ff5b6e', '#e23b4e', '#6a3040', g));
    ell(q.x - q.r * .28, q.y - bob - q.r * .22, q.r * .28, q.r * .2, 'rgba(255,255,255,.7)'); }
  // LR3: tap a flower and it sings its note and bobs; the baby dances to whatever she plays. Dragging along the row plays
  // each flower it passes. Every fifth note counts as one happy thing (so a long song doesn't rush bedtime).
  function sing(i) { const f = st.flowers[i]; f.bob = 1; f.at = st.t; sfx('flower', FLOWER_NOTES[i]); speak(FLOWER_WORDS[i]); const q = L.flowers[i];
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
      if (i !== undefined) { w.aboard[i] = true; w.hop[i] = st.t; sfx('boo'); speak(CAR_WORDS[i]); fx('heart', V.cars[i].x, V.cars[i].y - V.z * 1.4); return; }
      if (car >= 0 && !w.aboard[car]) { const k = car; w.aboard[k] = true; w.hop[k] = st.t; sfx('boo'); speak(CAR_WORDS[k]); fx('heart', V.cars[k].x, V.cars[k].y - V.z * 1.4); return; } // a tap on the empty car loads its baby too
      if (car >= 0 || pull) { if (w.aboard[0] && w.aboard[1]) { w.phase = 'ride'; sfx('wake'); } else { w.wiggle = 1; sfx('pick', 0); } return; } }
    if (w.phase === 'gate' && w.gate.at === null && car >= 0) { const big = car === w.gate.col; w.gate.at = st.t; w.gate.big = big; w.cheer = st.t; speak(CAR_WORDS[car]);
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
  // LR11: the Snack Kitchen. Through the snack-bowl sign. Tap a food and it hops into the bowl; the baby eats it. Berries:
  // a happy yum and hearts. The rest: a funny face (carrot: puffed cheeks; lemon: a sour squeeze; broccoli: tongue out) and
  // a giggly sound, never a wrong answer. After three bowls of berries it's full: a cheer, then home to the ranch (one happy thing).
  function enterKitchen() { if (st.mode !== 'play' || st.place !== 'ranch') return; st.place = 'kitchen'; st.ksign.shake = 1; st.sponge.drag = null;
    st.kitchen = { phase: 'idle', food: null, at: st.t, berries: 0, face: null, wig: FOODS.map(() => 0), giggle: -9 }; sfx('door'); }
  function leaveKitchen(fed) { st.place = 'ranch'; sfx('door'); st.kitchen = null;
    if (fed) { const b = st.baby; b.act = null; b.then = null; b.x = L.ksign.x; go(L.home.x, () => { b.act = 'cheer'; b.at = st.t; }); done(); } }
  const foodAt = p => { let best = -1, bd = 1; L.kitchen.foods.forEach((q, i) => { const k = Math.hypot(p.x - q.x, p.y - q.y) / (L.kitchen.fr * 1.25); if (k <= bd) { bd = k; best = i; } }); return best; };
  function feedKitchen(i) { const k = st.kitchen; if (k.phase !== 'idle') { k.wig[i] = 1; sfx('note'); return; } k.phase = 'fly'; k.food = i; k.at = st.t; sfx('pick', i); speak(FOOD_WORDS[i]); }
  function kitchenTap(p) { const k = st.kitchen, V = L.kitchen;
    if (near(p, V.barn, V.barn.r * 1.15)) return leaveKitchen(false);
    if (k.phase === 'full') { fx('spark', p.x, p.y); sfx('note'); return; }
    const i = foodAt(p); if (i >= 0) return feedKitchen(i);
    if (Math.hypot(p.x - V.baby.x, p.y - (V.baby.y - V.z * 1.1)) <= V.z * 1.1) { k.giggle = st.t; sfx('giggle'); return; }
    fx('spark', p.x, p.y); sfx('note'); }
  function kitchenUpdate(dt) { const k = st.kitchen, V = L.kitchen, e = st.t - k.at; k.wig = k.wig.map(v => Math.max(0, v - dt * 2.5));
    if (k.phase === 'fly' && e >= FLY_SECS) { k.phase = 'eat'; k.at = st.t; sfx('munch'); }
    else if (k.phase === 'eat' && e >= EAT_SECS) { k.phase = 'face'; k.at = st.t; k.face = FOOD_FACES[k.food]; const hx = V.baby.x, hy = V.baby.y - V.z * 1.6;
      if (k.food === 0) { k.berries++; sfx('yum'); for (let j = 0; j < 3; j++) fx('heart', hx + (j - 1) * V.z * .5, hy); } else { sfx('funny', k.food); fx('spark', hx, hy); } }
    else if (k.phase === 'face' && e >= FACE_SECS) { k.face = null; k.food = null; k.at = st.t;
      if (k.berries >= KITCHEN_BERRIES) { k.phase = 'full'; sfx('rainbow'); for (let j = 0; j < 10; j++) fx(j % 2 ? 'spark' : 'heart', V.baby.x + (Math.random() - .5) * V.z * 2.4, V.baby.y - V.z * (1 + Math.random() * 1.2)); } else k.phase = 'idle'; }
    else if (k.phase === 'full' && e >= KITCHEN_END_SECS) leaveKitchen(true); }
  // LR18: the Dough Table
  const doughCol = () => mixHex(st.paint && st.paint.body !== undefined ? PAINT[st.paint.body] : '#e06a32', '#ffffff', .35);
  function enterDough() { if (st.mode !== 'play' || st.place !== 'ranch') return; st.place = 'dough'; st.tsign.shake = 1; st.sponge.drag = null;
    st.dough = { phase: 'play', at: st.t, flat: 0, goal: 0, roll: 0, spin: 0, poke: -9, stamp: null, stamps: 0, hops: [] }; sfx('door'); }
  function leaveDough(made) { st.place = 'ranch'; sfx('door'); st.dough = null;
    if (made) { const b = st.baby; b.act = null; b.then = null; b.x = L.tsign.x; go(L.home.x, () => { b.act = 'cheer'; b.at = st.t; }); done(); } }
  function squish() { const D = st.dough, V = L.dough; D.poke = st.t; if (D.goal < 1) { D.goal = 1; D.roll = 0; sfx('splat', 0); } else sfx('boing'); fx('spark', V.lump.x, V.lump.y - V.lr * .5); }
  function rollDough(dist) { const D = st.dough, V = L.dough; D.spin += dist / V.lr; if (D.goal < 1) { D.wob = st.t; return; } D.roll += dist / (V.lr * 2.2);
    if (D.roll >= 1) { D.goal = 0; D.roll = 0; sfx('pick', 2); fx('spark', V.lump.x, V.lump.y - V.lr); } else if (Math.floor(D.roll * 4) !== Math.floor((D.roll - dist / (V.lr * 2.2)) * 4)) sfx('clop'); }
  function stamp() { const D = st.dough; if (D.phase !== 'play') return; if (D.stamp) { sfx('note'); return; } D.stamp = { at: st.t, hit: false }; sfx('pick', 0); }
  function doughTap(p) { const D = st.dough, V = L.dough;
    if (near(p, V.barn, V.barn.r * 1.15)) return leaveDough(false);
    if (D.phase !== 'play') { fx('spark', p.x, p.y); sfx('note'); return; }
    if (near(p, V.cutter, V.cr * 1.4)) return stamp();
    if (Math.hypot(p.x - V.lump.x, (p.y - V.lump.y) * 1.3) <= V.lr * 1.6) return squish();
    fx('spark', p.x, p.y); sfx('note'); }
  function doughUpdate(dt) { const D = st.dough, V = L.dough; D.flat += clamp(D.goal - D.flat, -dt * 5, dt * 5);
    if (D.stamp) { const e = st.t - D.stamp.at;
      if (!D.stamp.hit && e >= STAMP_SECS * .45) { D.stamp.hit = true; D.goal = 1; D.flat = Math.max(D.flat, .8); D.stamps++; sfx('splat', 2); sfx('giggle');
        D.hops.push({ at: st.t, dir: D.stamps % 2 ? 1 : -1 }); for (let j = 0; j < 3; j++) fx('heart', V.lump.x + (j - 1) * V.lr * .4, V.lump.y - V.lr * .6); }
      if (e >= STAMP_SECS) { D.stamp = null; if (D.stamps >= DOUGH_BABIES && D.phase === 'play') { D.phase = 'done'; D.at = st.t; sfx('rainbow'); } } }
    D.hops = D.hops.filter(h => st.t - h.at < 3);
    if (D.phase === 'done' && st.t - D.at >= DOUGH_END_SECS) leaveDough(true); }
  function hatTap() { const h = st.hat; h.shake = 1; if (h.fly) { sfx('note'); return; } // LR6
    const next = h.wear + 1 >= HATS.length ? -1 : h.wear + 1; h.fly = { from: h.wear, to: next, at: st.t }; sfx('pick', 2); }
  function hatUpdate(dt) { const h = st.hat; h.shake = Math.max(0, h.shake - dt * 2.5);
    if (h.fly && st.t - h.fly.at >= HAT_FLY) { h.wear = h.fly.to; h.fly = null; const c = babyCentre();
      if (h.wear >= 0) { sfx('giggle'); for (let i = 0; i < 4; i++) fx('spark', c.x + (i - 1.5) * L.size * .3, c.y - L.size * 1.1); const b = st.baby; if (!b.act && b.tx === null) { b.act = 'giggle'; b.at = st.t; } if (++h.tries % HAT_TRIES === 0) done(); }
      else sfx('bloop'); } }
  const hatTop = () => { const b = st.baby, z = L.size; return { x: b.x + b.dir * z * .42, y: L.home.y - z * 1.25 - z * .66 * .8 }; };
  function drawHat(i, x, y, r) { // r is the head's radius; (x, y) is the top of the head
    if (i === 0) { ell(x, y + r * .12, r * 1.25, r * .3, '#e8c870'); ell(x, y - r * .12, r * .7, r * .45, '#f0d888'); cx.fillStyle = '#e84a5a'; cx.fillRect(R(x - r * .68), R(y - r * .02), R(r * 1.36), Math.max(1, R(r * .14))); ell(x + r * .5, y - r * .02, r * .12, r * .12, '#ffffff'); }
    else if (i === 1) { cx.fillStyle = '#4fb4ff'; cx.beginPath(); cx.moveTo(R(x - r * .5), R(y + r * .15)); cx.lineTo(R(x + r * .5), R(y + r * .15)); cx.lineTo(R(x), R(y - r * 1.2)); cx.fill();
      cx.fillStyle = '#ffd04a'; for (const k of [.25, .65]) { const w2 = r * .5 * (1 - k) + r * .05; cx.fillRect(R(x - w2), R(y + r * .15 - k * r * 1.35), R(w2 * 2), Math.max(1, R(r * .12))); } ell(x, y - r * 1.2, r * .16, r * .16, '#ff5a8a'); }
    else if (i === 2) { cx.fillStyle = '#f2c14e'; cx.beginPath(); cx.moveTo(R(x - r * .6), R(y + r * .15)); for (let k = 0; k <= 4; k++) { cx.lineTo(R(x - r * .6 + k * r * .3), R(y - r * (k % 2 ? .25 : .7))); } cx.lineTo(R(x + r * .6), R(y + r * .15)); cx.fill();
      ell(x, y - r * .05, r * .1, r * .1, '#e84a5a'); ell(x - r * .32, y, r * .08, r * .08, '#4fb4ff'); ell(x + r * .32, y, r * .08, r * .08, '#5fb34a'); }
    else if (i === 3) { for (let k = 0; k < 5; k++) { const fx2 = x + (k - 2) * r * .3, fy = y + Math.abs(k - 2) * r * .1 - r * .05; ell(fx2, fy, r * .17, r * .17, ['#ff6f91', '#ffa040', '#b07aff', '#4fb4ff', '#ff5a5a'][k]); ell(fx2, fy, r * .07, r * .07, '#fff3a0'); } }
    else if (i === 4) { cx.fillStyle = '#8a5a34'; cx.beginPath(); cx.ellipse(R(x), R(y + r * .08), R(r * 1.2), R(r * .25), 0, 0, 7); cx.fill(); ell(x, y - r * .3, r * .55, r * .45, '#9a6a3e'); cx.fillStyle = '#5a3a24'; cx.fillRect(R(x - r * .55), R(y - r * .12), R(r * 1.1), Math.max(1, R(r * .12))); ell(x - r * 1.1, y - r * .05, r * .2, r * .14, '#8a5a34'); ell(x + r * 1.1, y - r * .05, r * .2, r * .14, '#8a5a34'); } }
  function drawBasket(g) { const B = L.basket, r = B.r, sh = Math.sin(st.t * 30) * st.hat.shake * r * .08, bob = hintBob('basket'), x = B.x + sh, y = B.y - bob, dk = c => g > .6 ? mixHex(c, '#20203a', .6) : c;
    shadow(B.x, B.y + r * .55, r * .95);
    ell(x - r * .35, y - r * .45, r * .3, r * .14, dk('#e8c870')); ell(x + r * .05, y - r * .6, r * .2, r * .25, dk('#4fb4ff')); ell(x + r * .4, y - r * .45, r * .22, r * .12, dk('#f2c14e')); // hats peeking out
    cx.fillStyle = dk('#c8904a'); cx.beginPath(); cx.moveTo(R(x - r * .85), R(y - r * .35)); cx.lineTo(R(x + r * .85), R(y - r * .35)); cx.lineTo(R(x + r * .65), R(y + r * .55)); cx.lineTo(R(x - r * .65), R(y + r * .55)); cx.fill();
    cx.fillStyle = dk('#a8703a'); for (const k of [-.1, .2]) cx.fillRect(R(x - r * .78), R(y + k * r), R(r * 1.56), Math.max(1, R(r * .08))); for (const k of [-.45, 0, .45]) cx.fillRect(R(x + k * r - r * .04), R(y - r * .35), Math.max(1, R(r * .08)), R(r * .9));
    ell(x, y - r * .35, r * .88, r * .12, dk('#8a5a34')); cx.strokeStyle = dk('#8a5a34'); cx.lineWidth = Math.max(2, r * .1); cx.beginPath(); cx.ellipse(R(x), R(y - r * .35), R(r * .6), R(r * .55), 0, Math.PI, 2 * Math.PI); cx.stroke(); }
  function drawHatFly() { const h = st.hat; if (!h.fly) return; const a = clamp((st.t - h.fly.at) / HAT_FLY, 0, 1), top = hatTop(), B = { x: L.basket.x, y: L.basket.y - L.R * .5 }, hr = L.size * .66;
    const on = h.fly.to >= 0, i = on ? h.fly.to : h.fly.from, A = on ? B : top, Z = on ? top : B, k = on ? a : a;
    if (i >= 0) drawHat(i, lerp(A.x, Z.x, k), lerp(A.y, Z.y, k) - Math.sin(k * Math.PI) * L.size * 1.2, hr * lerp(on ? .6 : 1, on ? 1 : .6, k)); }
  function rainTap() { const c = st.cloud; c.puff = 1; // LR5
    if (!daytime()) return; if (!c.rain) { c.rain = st.t; sfx('rustle'); } c.until = Math.max(c.until, st.t) + (c.rain === st.t ? RAIN_SECS : 2); }
  function rainUpdate(dt) { const c = st.cloud; c.puff = Math.max(0, c.puff - dt * 2);
    if (c.rain) { if (Math.floor(st.t / .13) !== Math.floor((st.t - dt) / .13)) sfx('drip');
      if (st.t >= c.until || !daytime()) { c.rain = null; if (daytime()) { st.puddles = [0, 1].map(i => ({ i, at: st.t, splash: -9 })); if (!st.sun.bow) st.sun.bow = { at: st.t }; sfx('rainbow'); } } }
    st.puddles = st.puddles.filter(q => st.t - q.at < PUDDLE_SECS && st.mode === 'play'); }
  function puddleTap(i) { const q = st.puddles.find(u => u.i === i), P = L.puddles[i], b = st.baby; if (!q) return;
    if (busy()) { q.splash = st.t; sfx('splash'); for (let k = 0; k < 6; k++) { fx('blob', P.x, P.y); st.fx[st.fx.length - 1].col = '#9ad6f4'; } return; }
    go(P.x, () => { b.act = 'splash'; b.at = st.t; q.splash = st.t; sfx('splash'); sfx('giggle'); for (let k = 0; k < 10; k++) { fx('blob', P.x + (Math.random() - .5) * P.r, P.y); st.fx[st.fx.length - 1].col = '#9ad6f4'; } }); }
  const puddleAt = p => { let best = -1, bd = 1; for (const q of st.puddles) { const P = L.puddles[q.i], k = Math.hypot(p.x - P.x, (p.y - P.y) * 1.6) / P.r; if (k <= bd) { bd = k; best = q.i; } } return best; };
  function drawCloud(g) { if (g > .5) return; const c = L.cloud, r = c.r * (1 + st.cloud.puff * .12), rain = !!st.cloud.rain, col = rain ? '#c8d4e4' : '#ffffff', a = 1 - g * 2, bob = hintBob('cloud'), y = c.y - bob;
    cx.globalAlpha = a; for (const [dx, dy, k] of [[-.75, .15, .55], [.75, .15, .55], [-.3, -.15, .7], [.3, -.2, .65], [0, .2, .7]]) ell(c.x + dx * r, y + dy * r, r * k, r * k, col);
    ell(c.x - r * .3, y + r * .1, r * .07, r * .09, '#5a6a80'); ell(c.x + r * .3, y + r * .1, r * .07, r * .09, '#5a6a80'); ell(c.x, y + r * .35, r * .12, r * (rain ? .1 : .05), '#8a8aa0'); cx.globalAlpha = 1;
    if (rain) { cx.strokeStyle = 'rgba(120,170,230,.8)'; cx.lineWidth = Math.max(1.5, L.U * .006); const top = y + r * .5, bot = L.ground + L.U * .25, span = r * 2.4, m = reduce() ? .4 : 1;
      cx.beginPath(); for (let i = 0; i < 26; i++) { const x = c.x - span / 2 + (i * 37.7 % span), k = ((st.t * 1.6 * m + i * .137) % 1), yy = top + k * (bot - top); cx.moveTo(R(x), R(yy)); cx.lineTo(R(x - L.U * .006), R(yy + L.U * .03)); } cx.stroke(); } }
  function drawPuddles() { for (const q of st.puddles) { const P = L.puddles[q.i], dry = clamp(1 - (st.t - q.at - (PUDDLE_SECS - 6)) / 6, 0, 1), grow = clamp((st.t - q.at) / .6, 0, 1), k = dry * grow, sp2 = st.t - q.splash, bob = hintBob('puddle') && q.i === 0 ? hintBob('puddle') * .5 : 0;
    ell(P.x, P.y, P.r * k, P.r * .36 * k, '#5aa8e0'); ell(P.x - P.r * .2, P.y - P.r * .06, P.r * .5 * k, P.r * .1 * k, '#a8dcf8');
    if (bob) { cx.strokeStyle = 'rgba(255,255,255,.7)'; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(R(P.x), R(P.y), R(P.r * k + bob), R(P.r * .36 * k + bob * .4), 0, 0, 7); cx.stroke(); }
    if (sp2 < 1) { cx.strokeStyle = `rgba(255,255,255,${1 - sp2})`; cx.lineWidth = Math.max(1, L.U * .006); cx.beginPath(); cx.ellipse(R(P.x), R(P.y), R(P.r * (.3 + sp2)), R(P.r * .36 * (.3 + sp2)), 0, 0, 7); cx.stroke(); } } }
  const routineFriends = () => ['flowers'].concat(st.friend ? ['friend'] : []);
  function routineStep(k) { const r = st.routine, b = st.baby; r.at = st.t; st.idleAt = st.t; // do step k (by a tap, or by itself)
    if (k === 0) { r.doing = { what: 'teeth', at: st.t }; b.act = 'brush'; b.at = st.t; b.dir = -1; sfx('bloop'); }
    else if (k === 1) { r.doing = { what: 'water', at: st.t }; b.act = 'drink'; b.at = st.t; b.dir = -1; sfx('plink'); } }
  function sayNight(who) { const r = st.routine, b = st.baby; if (r.said[who]) return; r.said[who] = true; r.at = st.t; st.idleAt = st.t; sfx('yawn'); speakNight();
    if (!b.act && b.tx === null) { b.act = 'wave'; b.at = st.t; }
    if (who === 'flowers') { st.flowers.forEach(f => { f.bob = 1; f.at = st.t; }); fx('zzz', L.flowers[2].x, L.flowers[2].y - L.flowers[2].r); }
    else { const f = st.friend; f.act = 'giggle'; f.at = st.t; const c = fCentre(); fx('zzz', c.x, c.y - L.fz); }
    if (routineFriends().every(k => r.said[k])) { r.step = 3; r.doneAt = st.t; for (let i = 0; i < 3; i++) fx('heart', babyCentre().x + (i - 1) * L.size * .5, babyCentre().y - L.size); } }
  function routineTap(p) { const r = st.routine; if (!r || r.step >= 3) return false;
    if (r.doing || st.baby.act === 'yawn' || st.baby.tx !== null) { fx('spark', p.x, p.y); sfx('twinkle'); return true; }
    if (r.step < 2) { if (near(p, L.item, L.item.r * 1.1)) { routineStep(r.step); return true; } }
    else { const fi = flowerAt(p); if (fi >= 0) { sayNight('flowers'); return true; } if (st.friend && near(p, fCentre(), L.fz * 1.25)) { sayNight('friend'); return true; } }
    return false; }
  function routineUpdate(dt) { const r = st.routine, b = st.baby; if (!r) return; st.shut = r.said.flowers ? Math.min(1, st.shut + dt) : st.shut;
    if (r.doing) { const k = st.t - r.doing.at, dur = r.doing.what === 'teeth' ? BRUSH_SECS : DRINK_SECS;
      if (r.doing.what === 'teeth' && Math.floor(k / .25) !== Math.floor((k - dt) / .25)) { const c = babyCentre(); fx('blob', c.x - L.size * .3, c.y - L.size * .2); st.fx[st.fx.length - 1].col = '#ffffff'; sfx('bloop'); }
      if (k >= dur) { r.doing = null; r.step++; r.at = st.t; if (b.act === 'brush' || b.act === 'drink') { b.act = null; } sfx('giggle'); } return; }
    if (r.step < 3 && b.act !== 'yawn' && b.tx === null && st.t - r.at > ROUTINE_WAIT) { if (r.step < 2) routineStep(r.step); else sayNight(routineFriends().find(k => !r.said[k])); } }
  function drawItem(what, x, y, r, tilt) { cx.save(); cx.translate(R(x), R(y)); cx.rotate(tilt || 0);
    if (what === 'teeth') { cx.rotate(-.6); cx.fillStyle = '#4fb4ff'; cx.fillRect(R(-r * .12), R(-r * .2), R(r * .24), R(r * 1.1)); ell(0, r * .9, r * .14, r * .14, '#4fb4ff');
      cx.fillStyle = '#ffffff'; cx.fillRect(R(-r * .2), R(-r * .55), R(r * .4), R(r * .35)); cx.fillStyle = '#9ad6f4'; for (let k = 0; k < 3; k++) cx.fillRect(R(-r * .18 + k * r * .14), R(-r * .55), Math.max(1, R(r * .06)), R(r * .35));
      ell(0, -r * .62, r * .2, r * .12, '#7cd8a0'); ell(r * .05, -r * .7, r * .1, r * .07, '#ffffff'); }
    else { cx.fillStyle = '#ff9a40'; cx.beginPath(); cx.moveTo(R(-r * .45), R(-r * .55)); cx.lineTo(R(r * .45), R(-r * .55)); cx.lineTo(R(r * .35), R(r * .6)); cx.lineTo(R(-r * .35), R(r * .6)); cx.fill();
      ell(0, -r * .55, r * .45, r * .12, '#7cc0f4'); cx.strokeStyle = '#ff9a40'; cx.lineWidth = Math.max(2, r * .12); cx.beginPath(); cx.arc(R(r * .45), R(0), R(r * .25), -1.4, 1.4); cx.stroke();
      ell(-r * .12, 0, r * .07, r * .09, '#ffffff'); ell(r * .12, 0, r * .07, r * .09, '#ffffff'); cx.fillStyle = '#ffffff'; cx.fillRect(R(-r * .1), R(r * .18), R(r * .2), Math.max(1, R(r * .05))); }
    cx.restore(); }
  function drawRoutine(g) { const r = st.routine; if (!r || r.step >= 2 && !r.doing) return; const I = L.item, hb = hint(), bob = hb && hb.name === 'item' && !reduce() ? Math.abs(Math.sin(st.t * 3.2)) * I.r * .2 : 0;
    if (r.doing) { const b = st.baby, z = L.size, hx = b.x + b.dir * z * .42, my = L.home.y - z * 1.25 + z * .66 * .48, k = st.t - r.doing.at;
      if (r.doing.what === 'teeth') drawItem('teeth', hx + b.dir * z * .5 + Math.sin(k * 20) * z * .12, my + z * .1, I.r * .7, b.dir > 0 ? .4 : -.4);
      else drawItem('water', hx + b.dir * z * .55, my + z * .15, I.r * .6, b.dir * -.6 * clamp(k / .4, 0, 1)); return; }
    ell(I.x, I.y + I.r * .55, I.r * .9, I.r * .22, 'rgba(255,240,200,.35)'); drawItem(ROUTINE[r.step], I.x, I.y - bob, I.r); }
  function bedtime() { if (st.mode !== 'play') return; st.routine = useRoutine ? { step: 0, at: st.t, doing: null, said: {}, doneAt: null } : null; st.shut = 0; if (st.friend) { st.friend.act = null; fgo(L.fhome.x, null); } st.mode = 'dusk'; st.baby.act = 'yawn'; st.baby.at = st.t; st.bowl.food = 0; sfx('yawn'); st.sponge.drag = null; st.sponge.auto = null; }

  function update(dt) {
    st.t += dt; const b = st.baby, sp = L.U * .9;
    if (st.place === 'wagon') { st.fx = st.fx.filter(f => st.t - f.at < 1.4); wagonUpdate(dt); return; }
    if (st.place === 'kitchen') { st.fx = st.fx.filter(f => st.t - f.at < 1.4); kitchenUpdate(dt); return; }
    if (st.place === 'dough') { st.fx = st.fx.filter(f => st.t - f.at < 1.4); doughUpdate(dt); return; }
    if (st.place === 'shed') { st.fx = st.fx.filter(f => st.t - f.at < 1.4); if (st.shed.doneAt !== null && st.t - st.shed.doneAt > SHED_WALK_SECS) leaveShed(true); return; }
    st.sign.shake = Math.max(0, st.sign.shake - dt * 1.5); st.wsign.shake = Math.max(0, st.wsign.shake - dt * 1.5); st.ksign.shake = Math.max(0, st.ksign.shake - dt * 1.5); st.tsign.shake = Math.max(0, st.tsign.shake - dt * 1.5);
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
    if (b.act === 'wave' && since > 1.2) b.act = null;
    if (b.act === 'nuzzle' && since > NUZZLE_SECS) { b.act = null; done(); home(); }
    friendUpdate(dt); rainUpdate(dt); hatUpdate(dt);
    if (b.act === 'splash' && since > SPLASH_SECS) { b.act = null; done(); home(); }
    if (b.act === 'dance') { if (since > 1.3) b.act = null; else if (Math.floor(since / .32) !== Math.floor((since - dt) / .32)) b.dir = -b.dir; }
    for (const f of st.flowers) f.bob = Math.max(0, f.bob - dt * 1.6);
    // the sponge: dragged, or gliding over by itself after a tap
    const s = st.sponge, bc = babyCentre();
    if (s.auto) { const k = st.t - s.auto.at; if (k < .6) { s.x = lerp(L.sponge.x, bc.x, k / .6); s.y = lerp(L.sponge.y, bc.y, k / .6); }
      else if (k < 2.2) { s.x = bc.x + Math.sin(k * 9) * L.size * .5; s.y = bc.y + Math.cos(k * 7) * L.size * .25; act.scrub(s); }
      else if (st.friend && st.friend.act !== 'sleep' && k < 3.6) { const fc = fCentre(); s.x = fc.x + Math.sin(k * 9) * L.fz * .5; s.y = fc.y + Math.cos(k * 7) * L.fz * .25; scrubFriend(s); } // LR4: then the friend
      else { s.auto = null; if (s.scrubbed) done(); s.scrubbed = false; } }
    else if (!s.drag) { s.x = lerp(s.x, L.sponge.x, Math.min(1, dt * 6)); s.y = lerp(s.y, L.sponge.y, Math.min(1, dt * 6)); }
    b.soap = Math.max(0, b.soap - dt * .08); b.happy = Math.max(0, b.happy - dt * .7); st.bush.shake = Math.max(0, st.bush.shake - dt * 1.5);
    for (const u of st.bubbles) u.y -= L.U * .08 * dt; st.bubbles = st.bubbles.filter(u => st.t - u.at < 7 && u.y > -u.r);
    st.fx = st.fx.filter(f => st.t - f.at < (f.kind === 'zzz' ? 3 : 1.4));
    // bedtime: after enough play, the sky turns orange, then night; a lullaby; the baby curls up
    if (st.mode === 'play' && !busy() && !s.drag && !s.auto && (st.acts >= BEDTIME_ACTS || st.t > BEDTIME_SECS)) bedtime();
    if (st.mode === 'dusk') { routineUpdate(dt); st.dusk = Math.min(st.routine && st.routine.step < 3 ? .22 : 1, st.dusk + dt / 10); // LR7: the sky waits at sunset for the routine
      if (st.dusk > .25 && st.lullabyAt === null) { st.lullabyAt = st.t; sfx('lullaby'); }
      if (st.dusk > .55 && !busy()) { if (b.act !== 'sleep') speakNight(); b.act = 'sleep'; b.at = st.t; }
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
    if (b.act === 'splash') { hop = Math.abs(Math.sin(since * 10)) * z * .4 * m; eyes = 'happy'; mouth = 1.1; }
    if (b.act === 'brush') { eyes = 'happy'; mouth = .5; squash = 1 + Math.sin(since * 30) * .03 * m; }
    if (b.act === 'drink') { eyes = 'closed'; mouth = .3; }
    if (b.act === 'wave') { hop = Math.abs(Math.sin(since * 8)) * z * .12 * m; eyes = 'happy'; mouth = .7; }
    if (b.act === 'nuzzle') { eyes = 'happy'; mouth = .6; x += d * Math.abs(Math.sin(since * 6)) * z * .12 * m; }
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
    if (st.hat.wear >= 0 && !(st.hat.fly && st.hat.fly.from === st.hat.wear)) drawHat(st.hat.wear, hx, hy - hr * .8, hr); // LR6
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
    const night = Math.max(clamp((g - .4) / .5, 0, 1), st.shut), m = reduce() ? .3 : 1, hb = hintBob('flowers');
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
  function drawFood(i, x, y, r) { // LR11: big, round, chunky foods
    if (i === 0) { ell(x + r * .1, y - r * .62, r * .32, r * .14, '#4fae4a'); for (const [dx, dy] of [[-.38, -.15], [.38, -.15], [0, -.28], [-.2, .25], [.22, .25]]) { ell(x + dx * r, y + dy * r, r * .36, r * .36, '#5a3fa8'); ell(x + dx * r - r * .1, y + dy * r - r * .12, r * .09, r * .09, '#b8a8f0'); } }
    else if (i === 1) { cx.fillStyle = '#ff8a2a'; cx.beginPath(); cx.moveTo(R(x - r * .42), R(y - r * .5)); cx.lineTo(R(x + r * .42), R(y - r * .5)); cx.lineTo(R(x), R(y + r * .85)); cx.fill(); ell(x, y - r * .5, r * .42, r * .14, '#ff9a40');
      cx.fillStyle = '#c86a1a'; for (const k of [.1, .4]) cx.fillRect(R(x - r * .25), R(y + k * r - r * .2), R(r * .2), Math.max(1, R(r * .05)));
      for (const a of [-.5, 0, .5]) { cx.save(); cx.translate(R(x), R(y - r * .55)); cx.rotate(a); ell(0, -r * .3, r * .1, r * .3, '#4fae4a'); cx.restore(); } }
    else if (i === 2) { ell(x, y, r * .78, r * .58, '#ffe04a'); ell(x - r * .8, y, r * .14, r * .1, '#ffe04a'); ell(x + r * .8, y, r * .14, r * .1, '#ffe04a'); ell(x - r * .22, y - r * .2, r * .22, r * .1, '#fff6b0'); ell(x + r * .3, y - r * .5, r * .2, r * .09, '#4fae4a'); }
    else { cx.fillStyle = '#8acb6a'; cx.fillRect(R(x - r * .14), R(y), R(r * .28), R(r * .7)); for (const [dx, dy, k] of [[-.42, -.05, .34], [.42, -.05, .34], [0, -.38, .4], [-.2, -.2, .32], [.22, -.2, .32]]) ell(x + dx * r, y + dy * r, r * k, r * k, '#3f9a48');
      for (const [dx, dy] of [[-.3, -.3], [.2, -.45], [.4, -.1]]) ell(x + dx * r, y + dy * r, r * .08, r * .08, '#6cc070'); } }
  function drawKSign(g) { // LR11: a picture-sign with a bowl of berries
    const s = L.ksign, r = L.R * .95, sh = Math.sin(st.t * 30) * st.ksign.shake * r * .06, bob = hintBob('ksign'), dk = c => g > .6 ? mixHex(c, '#20203a', .6) : c;
    cx.fillStyle = pick3('#8a5a34', '#7a5030', '#2e2430', g); cx.fillRect(R(s.x - r * .08), R(s.y - r * .2 - bob), Math.max(2, R(r * .16)), R(r * 1.4 + bob));
    cx.save(); cx.translate(R(s.x + sh), R(s.y - r * .45 - bob)); cx.fillStyle = pick3('#5a3a24', '#5a3a24', '#1e1a24', g); cx.fillRect(R(-r * .95), R(-r * .72), R(r * 1.9), R(r * 1.44));
    cx.fillStyle = pick3('#fff0d8', '#f0d8a0', '#4a4458', g); cx.fillRect(R(-r * .85), R(-r * .62), R(r * 1.7), R(r * 1.24));
    for (const [dx, dy] of [[-.3, -.08], [0, -.18], [.3, -.08], [-.15, -.3], [.15, -.3]]) ell(dx * r, dy * r, r * .17, r * .17, dk('#5a3fa8'));
    cx.fillStyle = dk('#4fa6e8'); cx.beginPath(); cx.moveTo(R(-r * .65), R(-r * .05)); cx.lineTo(R(r * .65), R(-r * .05)); cx.lineTo(R(r * .4), R(r * .45)); cx.lineTo(R(-r * .4), R(r * .45)); cx.fill();
    ell(0, -r * .05, r * .65, r * .1, dk('#7cc0f4')); cx.restore(); }
  function drawTSign(g) { // LR18: a picture-sign with a round lump of dough and a rolling pin
    const s = L.tsign, r = L.R * .95, sh = Math.sin(st.t * 30) * st.tsign.shake * r * .06, bob = hintBob('tsign'), dk = c => g > .6 ? mixHex(c, '#20203a', .6) : c;
    cx.fillStyle = pick3('#8a5a34', '#7a5030', '#2e2430', g); cx.fillRect(R(s.x - r * .08), R(s.y - r * .2 - bob), Math.max(2, R(r * .16)), R(Math.max(r * 1.4, L.ground + L.U * .04 - s.y + r * .2) + bob));
    cx.save(); cx.translate(R(s.x + sh), R(s.y - r * .45 - bob)); cx.fillStyle = pick3('#5a3a24', '#5a3a24', '#1e1a24', g); cx.fillRect(R(-r * .95), R(-r * .72), R(r * 1.9), R(r * 1.44));
    cx.fillStyle = pick3('#fff0d8', '#f0d8a0', '#4a4458', g); cx.fillRect(R(-r * .85), R(-r * .62), R(r * 1.7), R(r * 1.24));
    ell(-r * .2, r * .05, r * .42, r * .36, dk('#f0a070')); ell(-r * .3, -r * .08, r * .12, r * .08, dk('#ffd0b0'));
    cx.save(); cx.rotate(-.5); cx.fillStyle = dk('#c8955a'); cx.fillRect(R(r * .05), R(r * .25), R(r * .7), R(r * .2)); cx.fillStyle = dk('#8a5a34'); cx.fillRect(R(-r * .05), R(r * .29), R(r * .12), R(r * .12)); cx.fillRect(R(r * .73), R(r * .29), R(r * .12), R(r * .12)); cx.restore(); cx.restore(); }
  function drawDoughBaby(x, y, z, col, squash) { // a little dough baby: round body, round head, two pointy ears, two dot eyes
    const sq = squash || 0; ell(x, y - z * .4, z * .55 * (1 + sq * .2), z * .4 * (1 - sq * .2), col); const hy = y - z * 1.0 * (1 - sq * .15);
    for (const s2 of [-1, 1]) { cx.fillStyle = col; cx.beginPath(); cx.moveTo(R(x + s2 * z * .35), R(hy - z * .1)); cx.lineTo(R(x + s2 * z * .3), R(hy - z * .62)); cx.lineTo(R(x + s2 * z * .05), R(hy - z * .3)); cx.fill(); }
    ell(x, hy, z * .45, z * .4, col); for (const s2 of [-1, 1]) ell(x + s2 * z * .17, hy - z * .03, z * .06, z * .07, '#3a2420'); ell(x, hy + z * .17, z * .08, z * .05, '#c86a5a'); }
  function drawDough() { // LR18: the Dough Table
    const U = L.U, V = L.dough, D = st.dough, m = reduce() ? .3 : 1, col = doughCol(), hb = hint(), bob = n => hb && hb.name === n && !reduce() ? Math.abs(Math.sin(st.t * 3.2)) * V.lr * .12 : 0;
    const wall = cx.createLinearGradient(0, 0, 0, V.ty); wall.addColorStop(0, '#d8ecf8'); wall.addColorStop(1, '#bcdcef'); cx.fillStyle = wall; cx.fillRect(0, 0, W, V.ty);
    for (let i = 0; i < 4; i++) ell(W * (.3 + i * .16), V.ty * .35, U * .03, U * .03, ['#ff6fa8', '#ffd03a', '#5fd06a', '#4fa6ff'][i]);
    cx.fillStyle = '#c8955a'; cx.fillRect(0, R(V.ty), W, H - R(V.ty)); cx.fillStyle = '#b8854a'; for (let y = V.ty + U * .06; y < H; y += U * .09) cx.fillRect(0, R(y), W, Math.max(1, R(U * .008)));
    cx.fillStyle = '#8a5a34'; cx.fillRect(0, R(V.ty), W, Math.max(2, R(U * .02)));
    // the lump: a ball (0) or a flat pancake (1), wobbling as it rolls
    const q = V.lump, f = D.flat, pk = clamp(1 - (st.t - D.poke) / .4, 0, 1) * m, wob = D.wob ? clamp(1 - (st.t - D.wob) / .3, 0, 1) * m : 0, b0 = bob('lump');
    const rx = V.lr * (1 + f * .5 + pk * .1 + Math.sin(D.spin * 3) * .04 * m + wob * .06), ry = V.lr * (.82 - f * .55 - pk * .08), cy = q.y - ry - b0 + V.lr * .2;
    ell(q.x, q.y + V.lr * .22, rx * 1.05, V.lr * .16, 'rgba(90,50,20,.25)'); ell(q.x, cy, rx, ry, col); ell(q.x - rx * .35, cy - ry * .45, rx * .22, Math.max(1, ry * .22), mixHex(col, '#ffffff', .5));
    for (let i = 0; i < 3; i++) { const a = D.spin + i * 2.1; ell(q.x + Math.cos(a) * rx * .55, cy + Math.sin(a) * ry * .4, rx * .06, Math.max(1, ry * .06), mixHex(col, '#000000', .12)); }
    if (D.stamp && D.stamp.hit && st.t - D.stamp.at < STAMP_SECS) drawDoughBaby(q.x, cy + ry * .2, V.lr * .7, mixHex(col, '#ffffff', .15), 0);
    // the little dough babies hopping away
    for (const h of D.hops) { const e = st.t - h.at, k = e / 3, x = q.x + h.dir * k * W * .7, y = cy + ry * .2 - Math.abs(Math.sin(e * 6)) * V.lr * .6 * m; drawDoughBaby(x, y, V.lr * .7, mixHex(col, '#ffffff', .15), Math.abs(Math.cos(e * 6)) < .3 ? .6 : 0); }
    // the cutter: a blue baby-shaped cutter with a red knob; it hops over, presses, and hops back
    let cxp = V.cutter.x, cyp = V.cutter.y - bob('cutter');
    if (D.stamp) { const e = (st.t - D.stamp.at) / STAMP_SECS, go2 = e < .35 ? e / .35 : e < .6 ? 1 : 1 - (e - .6) / .4, k = go2 * go2 * (3 - 2 * go2);
      cxp = lerp(V.cutter.x, q.x, k); cyp = lerp(V.cutter.y, cy + ry * .2, k) - Math.sin(k * Math.PI) * V.lr * .8 * m; }
    { const z = V.cr; cx.strokeStyle = '#3f8ae8'; cx.lineWidth = Math.max(2, z * .16); cx.beginPath(); cx.arc(R(cxp), R(cyp - z * .25), R(z * .62), 0, 7); cx.stroke();
      for (const s2 of [-1, 1]) { cx.beginPath(); cx.moveTo(R(cxp + s2 * z * .5), R(cyp - z * .55)); cx.lineTo(R(cxp + s2 * z * .5), R(cyp - z * 1.15)); cx.lineTo(R(cxp + s2 * z * .1), R(cyp - z * .82)); cx.stroke(); }
      cx.fillStyle = '#3f8ae8'; cx.fillRect(R(cxp - z * .08), R(cyp - z * 1.35), R(z * .16), R(z * .5)); ell(cxp, cyp - z * 1.4, z * .28, z * .22, '#e8483c'); }
    if (D.phase === 'done') for (let i = 0; i < 6; i++) { const a = st.t * 1.5 + i; ell(q.x + Math.cos(a) * V.lr * 1.6, q.y - V.lr * .6 + Math.sin(a) * V.lr * .6, U * .01, U * .01, '#fff3a0'); }
    drawHint();
    const b = V.barn; ell(b.x, b.y, b.r, b.r, 'rgba(255,248,232,.9)'); cx.fillStyle = '#c8453a'; cx.fillRect(R(b.x - b.r * .55), R(b.y - b.r * .15), R(b.r * 1.1), R(b.r * .7));
    cx.beginPath(); cx.moveTo(R(b.x - b.r * .7), R(b.y - b.r * .1)); cx.lineTo(R(b.x), R(b.y - b.r * .62)); cx.lineTo(R(b.x + b.r * .7), R(b.y - b.r * .1)); cx.fillStyle = '#8a2a24'; cx.fill();
    cx.fillStyle = '#fff4e0'; cx.fillRect(R(b.x - b.r * .2), R(b.y + b.r * .12), R(b.r * .4), R(b.r * .43)); cx.fillStyle = '#5fb34a'; cx.fillRect(R(b.x - b.r * .7), R(b.y + b.r * .55), R(b.r * 1.4), Math.max(2, R(b.r * .1)));
    drawFx(U); }
  function drawKBaby(x, y, z, face, since, giggle) { // the kitchen's baby: big, sitting up at the table, all face
    const m = reduce() ? .3 : 1, body = '#e06a32', cream = '#ffe2b8', hr = z * .62;
    let hop = 0, sx = 0; if (face === 'yum' || face === 'full' || giggle) hop = Math.abs(Math.sin(since * 12)) * z * .12 * m;
    if (face === 'tongue') sx = Math.sin(since * 14) * z * .08 * m; if (face === 'sour') sx = Math.sin(since * 50) * z * .025 * m;
    ell(x - z * .7, y - z * .9, z * .26, z * .16, body); ell(x - z * .92, y - z * 1.08, z * .16, z * .16, '#ffd04a');
    ell(x, y - z * .45 - hop, z * .78, z * .62, body); ell(x, y - z * .38 - hop, z * .48, z * .4, cream);
    const hx = x + sx, hy = y - z * 1.35 - hop + (face === 'eat' ? Math.abs(Math.sin(since * 9)) * z * .12 * m + z * .1 : 0);
    for (const s2 of [-1, 1]) { cx.fillStyle = body; cx.beginPath(); cx.moveTo(R(hx + s2 * hr * .75), R(hy - hr * .25)); cx.lineTo(R(hx + s2 * hr * .55), R(hy - hr * 1.2)); cx.lineTo(R(hx + s2 * hr * .1), R(hy - hr * .7)); cx.fill();
      cx.fillStyle = '#ff9a8a'; cx.beginPath(); cx.moveTo(R(hx + s2 * hr * .6), R(hy - hr * .45)); cx.lineTo(R(hx + s2 * hr * .52), R(hy - hr * .95)); cx.lineTo(R(hx + s2 * hr * .28), R(hy - hr * .65)); cx.fill(); }
    ell(hx, hy, hr, hr * .9, body); ell(hx, hy + hr * .35, hr * .55, hr * .38, cream);
    const puff = face === 'puff' ? 1 + .15 * Math.sin(since * 10) * m : 0;
    for (const s2 of [-1, 1]) ell(hx + s2 * hr * .58, hy + hr * .22, hr * (puff ? .32 * puff : .16), hr * (puff ? .26 * puff : .1), puff ? '#ffb0a0' : '#ff9a8a');
    const ink = '#2a1a18', bar = (x1, y1, w, h) => { cx.fillStyle = ink; cx.fillRect(R(x1), R(y1), Math.max(1, R(w)), Math.max(1, R(h))); };
    for (const s2 of [-1, 1]) { const ex = hx + s2 * hr * .38, ey = hy - hr * .08;
      if (face === 'yum' || face === 'full' || giggle) { bar(ex - hr * .15, ey - hr * .04, hr * .3, hr * .07); bar(ex - hr * .15, ey + hr * .03, hr * .07, hr * .06); bar(ex + hr * .08, ey + hr * .03, hr * .07, hr * .06); }
      else if (face === 'sour') { cx.strokeStyle = ink; cx.lineWidth = Math.max(1.5, hr * .07); cx.beginPath(); cx.moveTo(R(ex - s2 * hr * .15), R(ey - hr * .12)); cx.lineTo(R(ex + s2 * hr * .12), R(ey)); cx.lineTo(R(ex - s2 * hr * .15), R(ey + hr * .12)); cx.stroke(); }
      else if (face === 'tongue' && s2 > 0) bar(ex - hr * .15, ey, hr * .3, hr * .07);
      else { const big = face === 'puff' ? 1.25 : 1; ell(ex, ey, hr * .17 * big, hr * .21 * big, ink); ell(ex - hr * .05, ey - hr * .08, hr * .06, hr * .06, '#fff'); } }
    ell(hx, hy + hr * .2, hr * .1, hr * .07, '#3a2420');
    const my = hy + hr * .5;
    if (face === 'yum' || face === 'full') ell(hx, my, hr * .26, hr * (.12 + .08 * Math.abs(Math.sin(since * 12))), '#8a2a2a');
    else if (face === 'eat') ell(hx, my, hr * .18, hr * (.06 + .1 * Math.abs(Math.sin(since * 14))), '#8a2a2a');
    else if (face === 'puff') ell(hx, my, hr * .07, hr * .07, '#8a2a2a');
    else if (face === 'sour') { ell(hx, my, hr * .1, hr * .09, '#8a2a2a'); ell(hx, my, hr * .05, hr * .04, '#c85a5a'); }
    else if (face === 'tongue') { ell(hx, my, hr * .2, hr * .08, '#8a2a2a'); ell(hx, my + hr * .14, hr * .13, hr * .16, '#ff7a8a'); bar(hx - hr * .01, my + hr * .06, hr * .02, hr * .16); }
    else if (giggle) ell(hx, my, hr * .16, hr * .12, '#8a2a2a');
    else { cx.fillStyle = '#8a2a2a'; cx.fillRect(R(hx - hr * .14), R(my), R(hr * .28), Math.max(1, R(hr * .06))); }
    if (face === 'sour') for (const s2 of [-1, 1]) ell(hx + s2 * hr * 1.1, hy - hr * .5, hr * .06, hr * .1, '#9ad6f4'); }
  function drawKitchen() {
    const U = L.U, V = L.kitchen, k = st.kitchen, z = V.z, e = st.t - k.at, m = reduce() ? .3 : 1;
    const wall = cx.createLinearGradient(0, 0, 0, V.ty); wall.addColorStop(0, '#ffe6a8'); wall.addColorStop(1, '#f4cf86'); cx.fillStyle = wall; cx.fillRect(0, 0, W, V.ty);
    { const wx = W * .78, wy = H * .2, ww = Math.min(W * .16, H * .2); cx.fillStyle = '#8a5a34'; cx.fillRect(R(wx - ww * 1.1), R(wy - ww * .9), R(ww * 2.2), R(ww * 1.8)); cx.fillStyle = '#9ad6f4'; cx.fillRect(R(wx - ww), R(wy - ww * .8), R(ww * 2), R(ww * 1.6));
      ell(wx - ww * .3, wy + ww * .5, ww * .9, ww * .4, '#7cc85a'); cx.fillStyle = '#8a5a34'; cx.fillRect(R(wx - ww * .05), R(wy - ww * .8), R(ww * .1), R(ww * 1.6)); cx.fillRect(R(wx - ww), R(wy - ww * .05), R(ww * 2), R(ww * .1));
      cx.fillStyle = '#ff6f91'; cx.fillRect(R(wx - ww * 1.25), R(wy - ww * 1.0), R(ww * 2.5), R(ww * .22)); }
    for (let i = 0; i < 3; i++) { const px = W * (.34 + i * .1), py = H * .12; cx.fillStyle = '#7a5434'; cx.fillRect(R(px - U * .002), R(py - U * .05), Math.max(1, R(U * .004)), R(U * .05)); ell(px, py + U * .02, U * .035, U * .03, ['#c8453a', '#4fa6e8', '#ffb03a'][i]); }
    drawKBaby(V.baby.x, V.baby.y, z, k.phase === 'eat' ? 'eat' : k.phase === 'full' ? 'full' : k.face, e, st.t - k.giggle < 1);
    // the table, with a checked cloth
    cx.fillStyle = '#fff4e0'; cx.fillRect(0, R(V.ty), W, H - R(V.ty)); const cs = Math.max(8, U * .06); cx.fillStyle = 'rgba(230,80,90,.35)';
    for (let y = V.ty, r2 = 0; y < H; y += cs, r2++) for (let x = (r2 % 2) * cs; x < W; x += cs * 2) cx.fillRect(R(x), R(y), R(cs), R(cs));
    cx.fillStyle = '#e8504a'; cx.fillRect(0, R(V.ty), W, Math.max(2, R(U * .015)));
    // the bowl, and what's in it
    const B = V.bowl; shadow(B.x, B.y + B.r * .45, B.r * .9);
    if (k.phase === 'eat' && k.food !== null) drawFood(k.food, B.x, B.y - B.r * .25 + e / EAT_SECS * B.r * .3, V.fr * .6 * (1 - e / EAT_SECS * .7));
    cx.fillStyle = '#4fa6e8'; cx.beginPath(); cx.moveTo(R(B.x - B.r), R(B.y - B.r * .2)); cx.lineTo(R(B.x + B.r), R(B.y - B.r * .2)); cx.quadraticCurveTo(R(B.x + B.r * .9), R(B.y + B.r * .55), R(B.x), R(B.y + B.r * .55)); cx.quadraticCurveTo(R(B.x - B.r * .9), R(B.y + B.r * .55), R(B.x - B.r), R(B.y - B.r * .2)); cx.fill();
    ell(B.x, B.y - B.r * .2, B.r, B.r * .16, '#7cc0f4'); for (const dx of [-.5, 0, .5]) ell(B.x + dx * B.r, B.y + B.r * .15, B.r * .08, B.r * .08, '#fff');
    // the four foods (always there: there's always more), and the one hopping to the bowl
    const hint2 = hint();
    V.foods.forEach((q, i) => { const lift = (hint2 && hint2.name === 'food' + i && !reduce() ? Math.abs(Math.sin(st.t * 3.2)) * V.fr * .2 : 0) + Math.abs(Math.sin(st.t * 30)) * k.wig[i] * V.fr * .12;
      ell(q.x, q.y + V.fr * .75, V.fr * 1.05, V.fr * .28, 'rgba(255,255,255,.95)'); ell(q.x, q.y + V.fr * .7, V.fr * .85, V.fr * .18, 'rgba(220,200,180,.6)'); drawFood(i, q.x, q.y - lift, V.fr); });
    if (k.phase === 'fly') { const a = clamp(e / FLY_SECS, 0, 1), q = V.foods[k.food]; drawFood(k.food, lerp(q.x, B.x, a), lerp(q.y, B.y - B.r * .3, a) - Math.sin(a * Math.PI) * z * .9 * m, V.fr * lerp(1, .7, a)); }
    if (k.phase === 'full') for (let i = 0; i < 6; i++) { const a = st.t * 1.5 + i; ell(V.baby.x + Math.cos(a) * z * 1.2, V.baby.y - z * 1.3 + Math.sin(a) * z * .6, U * .01, U * .01, '#fff3a0'); }
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
    if (st.place === 'kitchen') return drawKitchen();
    if (st.place === 'dough') return drawDough();
    const g = st.dusk, U = L.U;
    const sky = cx.createLinearGradient(0, 0, 0, L.ground); sky.addColorStop(0, pick3('#6cbcec', '#e8805a', '#121a44', g)); sky.addColorStop(1, pick3('#d4eef8', '#ffd08a', '#3a3a70', g));
    cx.fillStyle = sky; cx.fillRect(0, 0, W, L.ground + 1);
    if (g > .55) { cx.fillStyle = `rgba(255,255,230,${clamp((g - .55) * 2.2, 0, 1)})`; for (let i = 0; i < 40; i++) { const x = (i * 97.3) % W, y = (i * 53.7) % (L.ground * .8), tw = .6 + .4 * Math.sin(st.t * 2 + i); if (tw > .5 || st.moon.song) { const sz = st.moon.song && (i % 3 === (st.moon.song.i % 3)) ? 2 : 1; cx.fillRect(R(x), R(y), sz, sz); } } }
    const sunY = lerp(L.sun.y, L.ground + U * .1, clamp(g * 1.6, 0, 1)); const glow = st.sun.glow;
    ell(L.sun.x, sunY, U * (.13 + glow * .07), U * (.13 + glow * .07), `rgba(255,240,180,${(.25 + glow * .35) * (1 - g)})`); ell(L.sun.x, sunY, U * (.09 + glow * .025), U * (.09 + glow * .025), glow > 0 ? mixHex('#fff4b0', '#ffffff', glow) : pick3('#fff4b0', '#ffb050', '#ff8040', g));
    if (st.sun.bow) drawRainbow(st.t - st.sun.bow.at);
    drawCloud(g);
    if (g > .6) { const k = clamp((g - .6) / .4, 0, 1), mg = st.moon.song ? 1 : st.moon.glow, pulse = st.moon.song ? clamp(1 - (st.t - st.moon.song.beat) / BEAT, 0, 1) * .25 : 0;
      if (mg > 0) { ell(W * .8, lerp(L.ground, H * .16, k), U * (.11 + mg * .05 + pulse * .03), U * (.11 + mg * .05 + pulse * .03), `rgba(240,240,200,${.12 + mg * .2 + pulse * .2})`); }
      ell(W * .8, lerp(L.ground, H * .16, k), U * .07, U * .07, '#f4f0d8'); ell(W * .8 + U * .03, lerp(L.ground, H * .16, k) - U * .02, U * .06, U * .06, (mg > 0 ? mixHex('#121a44', '#5a5e6e', clamp((.12 + mg * .2 + pulse * .2) / .37, 0, 1)) : '#121a44')); }
    ell(W * .25, L.ground + U * .05, W * .45, U * .22, pick3('#8acb6a', '#a0a050', '#2a4a48', g)); ell(W * .8, L.ground + U * .07, W * .4, U * .18, pick3('#7abf5c', '#909848', '#24423f', g));
    cx.fillStyle = pick3('#7cc85a', '#b0a050', '#2a4a40', g); cx.fillRect(0, R(L.ground), W, H - R(L.ground));
    cx.fillStyle = pick3('#a87a4a', '#a06a3a', '#3a2e38', g); const fy = L.ground + U * .02; cx.fillRect(0, R(fy), W, Math.max(1, R(U * .025))); cx.fillRect(0, R(fy + U * .07), W, Math.max(1, R(U * .025)));
    for (let x = W * .05; x < W; x += U * .3) cx.fillRect(R(x), R(fy - U * .03), Math.max(2, R(U * .03)), R(U * .14));
    for (let i = 0; i < 30; i++) { const x = (i * 61.7) % W, y = L.ground + U * .2 + (i * 37.1) % (H - L.ground - U * .2); cx.fillStyle = pick3('#5aa848', '#8a8a40', '#1e3a36', g); cx.fillRect(R(x), R(y), 1, 2); }
    drawHint();
    drawPuddles(); drawBasket(g); drawTSign(g); drawSign(g); drawWheelSign(g); drawKSign(g);
    const hidden = st.baby.act === 'hide' || st.baby.act === 'peek';
    if (!hidden) drawBush(false);
    // the bowl
    const bw = L.R, bb = hintBob('bowl'); shadow(L.bowl.x, L.bowl.y, bw); cx.save(); cx.translate(0, -R(bb)); ell(L.bowl.x, L.bowl.y - bw * .25, bw, bw * .45, pick3('#4a90d8', '#5a7ab8', '#2a3a68', g)); ell(L.bowl.x, L.bowl.y - bw * .45, bw * .82, bw * .2, '#2a4a7a');
    if (st.bowl.food > 0) for (let i = 0; i < 9 * st.bowl.food; i++) ell(L.bowl.x + (i % 5 - 2) * bw * .3, L.bowl.y - bw * (.5 + (i % 2) * .12), bw * .14, bw * .11, '#c8823a'); cx.restore();
    drawBall();
    drawFlowers(g);
    if (hidden) { // peekaboo: behind the bush, then up comes the head
      const k = st.baby.act === 'peek' ? Math.sin(clamp((st.t - st.baby.at) / 1.4, 0, 1) * Math.PI) : 0, save = st.baby.x;
      const base = L.bush.y + L.R * .3; cx.save(); cx.beginPath(); cx.rect(0, 0, W, R(base)); cx.clip(); // only what rises above the bush's foot shows
      cx.translate(0, L.bush.y - L.home.y + L.size * .9 - k * L.size * 1.4); st.baby.x = L.bush.x; drawBaby(); st.baby.x = save; cx.restore(); drawBush(true); }
    else { drawFriend(); drawBaby(); }
    drawHatFly(); if (st.mode === 'dusk') drawRoutine(g);
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
    if (!s.auto) c.push(['sponge', s, L.R * 1.1]); c.push(['sign', L.sign, L.R * 1.1], ['wsign', L.wsign, L.R * 1.1], ['ksign', L.ksign, L.R * 1.1], ['tsign', L.tsign, L.R * 1.1], ['bowl', L.bowl, L.R * 1.2], ['bush', { x: L.bush.x, y: L.bush.y - L.R * .4 }, L.R * 1.4]);
    if (st.baby.act !== 'hide') c.push(['baby', babyCentre(), L.size * 1.2]); if (st.friend) c.push(['friend', fCentre(), L.fz * 1.25]); if (daytime()) c.push(['sun', sunAt(), Math.max(L.U * .16, L.R)], ['cloud', L.cloud, L.cloud.r * 1.35]);
    for (const q of st.puddles) c.push(['puddle' + q.i, L.puddles[q.i], L.puddles[q.i].r]); c.push(['basket', { x: L.basket.x, y: L.basket.y - L.R * .15 }, L.R * 1.05]);
    L.flowers.forEach((q, i) => c.push(['flower' + i, { x: q.x, y: q.y }, q.r * 1.15]));
    { const q = ballNow(); c.push(['ball', q, q.r * 1.2]); }
    let best = null, bk = 1; for (const [n, q, r] of c) { const k = Math.hypot(p.x - q.x, p.y - q.y) / r; if (k <= bk) { bk = k; best = n; } } return best; }
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); audio(); const p = at(e), s = st.sponge; st.idleAt = st.t;
    // LR9: the shed and the sign act when the finger lifts (like the grown-up panel, LR15); a drag over the outline paints
    if (st.place === 'dough') { st.down = { id: e.pointerId, p, last: p, moved: 0 }; try { cv.setPointerCapture(e.pointerId); } catch (err) {} return; } // LR18: a tap or a rub
    if (st.place === 'wagon' || st.place === 'kitchen') { st.down = { id: e.pointerId, p }; return; }
    if (st.place === 'shed') { st.down = { id: e.pointerId, p, drag: false }; try { cv.setPointerCapture(e.pointerId); } catch (err) {} return; }
    if (st.mode === 'dusk' && routineTap(p)) return; // LR7
    if (st.mode !== 'play') { // bedtime: taps twinkle; six taps on the sleeping baby wake it for a new day (LR12)
      const q = ballNow(), bc = babyCentre();
      const onBall = near(p, q, q.r * 1.2), onBaby = st.baby.act === 'sleep' && near(p, bc, L.size * 1.2);
      if (onBall && (!onBaby || Math.hypot(p.x - q.x, p.y - q.y) <= Math.hypot(p.x - bc.x, p.y - bc.y))) return kickBall();
      if (onBaby) return nudge();
      if (moonUp() && near(p, moonAt(), Math.max(L.U * .16, L.R))) return hum();
      fx('spark', p.x, p.y); sfx('twinkle'); return; }
    const bub = st.bubbles.find(u => Math.hypot(u.x - p.x, u.y - p.y) < u.r * 1.8 + L.U * .02);
    if (bub) { st.bubbles.splice(st.bubbles.indexOf(bub), 1); fx('spark', bub.x, bub.y); sfx('pop'); return; }
    st.idleAt = st.t;
    const pick = ranchTarget(p); if (pick) st.used[/^flower/.test(pick) ? 'flowers' : /^puddle/.test(pick) ? 'puddle' : pick] = 1;
    if (pick === 'sponge') { s.drag = { id: e.pointerId, x: p.x, y: p.y, at: performance.now(), moved: 0 }; try { cv.setPointerCapture(e.pointerId); } catch (err) {} return; }
    if (pick === 'sign') { st.down = { id: e.pointerId, p, sign: 'paint' }; st.sign.shake = .5; return; }
    if (pick === 'wsign') { st.down = { id: e.pointerId, p, sign: 'wagon' }; st.wsign.shake = .5; return; }
    if (pick === 'tsign') { st.down = { id: e.pointerId, p, sign: 'dough' }; st.tsign.shake = .5; return; }
    if (pick === 'ksign') { st.down = { id: e.pointerId, p, sign: 'kitchen' }; st.ksign.shake = .5; return; }
    if (/^flower/.test(pick)) { const i = +pick.slice(6); st.down = { id: e.pointerId, p, flower: i }; try { cv.setPointerCapture(e.pointerId); } catch (err) {} return sing(i); }
    if (pick === 'bowl') return act.feed();
    if (pick === 'bush') return act.peek();
    if (pick === 'baby') return act.tickle();
    if (pick === 'friend') return friendTap();
    if (pick === 'sun') return shine();
    if (pick === 'cloud') return rainTap();
    if (pick === 'basket') return hatTap();
    if (/^puddle/.test(pick)) return puddleTap(+pick.slice(6));
    if (pick === 'ball') return kickBall();
    act.sparkle(p);
  });
  cv.addEventListener('pointermove', e => { const d = st.down;
    if (d && d.id === e.pointerId && st.place === 'dough') { const p = at(e), k = Math.hypot(p.x - d.last.x, p.y - d.last.y); d.moved += k; d.last = p; if (d.moved > L.dough.lr * .3 && st.dough.phase === 'play') rollDough(k); return; }
    if (d && d.id === e.pointerId && d.flower !== undefined) { const i = flowerAt(at(e)); if (i >= 0 && i !== d.flower) { d.flower = i; sing(i); } return; } if (d && d.id === e.pointerId && st.place === 'shed') { const p = at(e);
      if (!d.drag && Math.hypot(p.x - d.p.x, p.y - d.p.y) > L.shed.z * .15) { d.drag = true; paintPart(partAt(d.p), d.p); } if (d.drag) paintPart(partAt(p), p); return; }
    const s = st.sponge; if (!s.drag || s.drag.id !== e.pointerId) return; const p = at(e);
    s.drag.moved += Math.hypot(p.x - s.x, p.y - s.y); s.x = p.x; s.y = p.y; if (near(p, babyCentre(), L.size * 1.3)) act.scrub(p); else if (st.friend && near(p, fCentre(), L.fz * 1.2)) scrubFriend(p); });
  const release = e => { const d = st.down; if (d && d.id === e.pointerId) { st.down = null; if (e.type === 'pointercancel') return; const p = at(e);
      if (d.sign === 'paint') { if (near(p, L.sign, L.R * 1.3)) enterShed(); return; } if (d.sign === 'wagon') { if (near(p, L.wsign, L.R * 1.3)) enterWagon(); return; } if (d.sign === 'kitchen') { if (near(p, L.ksign, L.R * 1.3)) enterKitchen(); return; } if (d.sign === 'dough') { if (near(p, L.tsign, L.R * 1.3)) enterDough(); return; } if (st.place === 'dough') { if (d.moved <= L.dough.lr * .3) doughTap(p); return; } if (d.flower !== undefined) return; if (!d.drag && st.place === 'shed') shedTap(p); if (st.place === 'wagon') wagonTap(p); if (st.place === 'kitchen') kitchenTap(p); return; }
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
  press(document.getElementById('gSound'), () => { prefs.sound = !prefs.sound; try { localStorage.setItem(PREF, JSON.stringify(prefs)); } catch (e) {} if (!prefs.sound) { if (ac) { ac.close(); ac = null; } try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} } soundLabel(); clearTimeout(idle); idle = setTimeout(closePanel, 20000); });
  press(document.getElementById('gHome'), () => { location.href = document.getElementById('gHome').href; });
  press(document.getElementById('gExit'), () => { closePanel(); try { window.LittleRanchApp && window.LittleRanchApp.exit(); } catch (e) {} });

  /* ---------------- run ---------------- */
  newVisit(); addEventListener('resize', layout);
  let last = performance.now();
  (function loop(now) { const dt = Math.min(.1, (now - last) / 1000); last = now; layout(); update(dt); draw(); requestAnimationFrame(loop); })(last);
  // for the checks (tests/little-ranch.html): the state, the places, and a way to move time on
  window.LR = { VERSION, PREF, BEDTIME_ACTS, HOLD_MS, WAKE_TAPS, SUN_TAPS, BOW_SECS, MOON_TAPS, BEAT, SONG_BEATS, TWINKLE, get tones() { return tones; }, get words() { return words; }, get prefs() { return prefs; }, moonAt: () => moonAt(), PAINT, PARTS, POT_WORDS, FLOWER_WORDS, CAR_WORDS, FOOD_WORDS, HINT_SECS, FLOWERS, FLOWER_NOTES, SONG_TAPS, sing: i => sing(i), CARS, RIDE, enterWagon, leaveWagon, FOODS, FOOD_FACES, KITCHEN_BERRIES, FRIEND_ODDS, NUZZLE_SECS, RAIN_SECS, PUDDLE_SECS, HATS, HAT_TRIES, BALL_KICKS, ballNow, ROUTINE, ROUTINE_WAIT, setRoutine: v => { useRoutine = v; }, hatTop: () => hatTop(), setFriend: v => { forceFriend = v; }, fCentre: () => fCentre(), enterKitchen, leaveKitchen, DOUGH_BABIES, STAMP_SECS, DOUGH_END_SECS, enterDough, leaveDough, thingAt: k => thingAt(k), hint: () => hint(), ranchTarget: p => ranchTarget(p), enterShed, leaveShed, partPoint: k => partPoint(k), partAt: p => partAt(p), get state() { return st; }, get layout() { return L; }, get scale() { return S; }, act, bedtime, newVisit, openPanel, APP,
    advance(secs) { for (let k = 0; k < secs; k += 1 / 30) update(1 / 30); draw(); },
    toScreen(p) { const r = cv.getBoundingClientRect(); return { x: r.left + p.x / W * r.width, y: r.top + p.y / H * r.height }; } };
})();

