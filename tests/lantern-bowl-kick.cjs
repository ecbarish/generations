/* Checks for games/lantern-bowl/kick.js (LB-G5). Plain Node, no packages:  node tests/lantern-bowl-kick.cjs
   It prints the make-rate table, then the checks. Exports { run, checks, table }; with no `module` it sets
   window.LanternBowlKickChecks, so an HTML test page can run it later. */
(function (root, factory) {
  const api = factory(typeof require === 'function' ? require : null);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LanternBowlKickChecks = api;
  if (typeof require === 'function' && typeof module === 'object' && require.main === module) process.exitCode = api.run() ? 0 : 1;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (req) {
  'use strict';
  const fs = req ? req('fs') : null, path = req ? req('path') : null, vm = req ? req('vm') : null;
  const SRC = path ? path.join(__dirname, '..', 'games', 'lantern-bowl', 'kick.js') : null;
  const DISTANCES = [20, 30, 40, 50], RATINGS = [35, 60, 90], KICKS = 1000;
  // How far a tap lands from where it should: [power miss, aim miss], each drawn from -1..1 times this.
  const QUALITIES = { perfect: [0, 0], 'a little off': [0.08, 0.07], sloppy: [0.25, 0.25] };

  function load() { return req ? req(SRC) : root.LanternBowlKick; }

  /* A small seeded random source (mulberry32), standing in for the game's dice. */
  function seeded(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* 1,000 seeded kicks for one distance, rating and tap quality. The same seeds are used at every distance. */
  function makeRate(K, distance, rating, quality) {
    const rng = seeded(1000), taps = seeded(77), q = QUALITIES[quality];
    const ideal = K.idealPowerTap(distance, rating);
    let good = 0;
    for (let i = 0; i < KICKS; i++) {
      const powerTap = ideal + (taps() * 2 - 1) * q[0], aimTap = 0.5 + (taps() * 2 - 1) * q[1];
      if (K.resolve({ powerTap, aimTap, distanceYards: distance, kickRating: rating, rng }).good) good++;
    }
    return good / KICKS;
  }

  function table(K) {
    const t = {};
    RATINGS.forEach(r => Object.keys(QUALITIES).forEach(q => { t[r + '|' + q] = DISTANCES.map(d => makeRate(K, d, r, q)); }));
    return t;
  }
  function printTable(t, log) {
    log('Make rate over ' + KICKS + ' seeded kicks (percent)');
    log('rating  taps          ' + DISTANCES.map(d => String(d).padStart(5) + ' yd').join(''));
    RATINGS.forEach(r => Object.keys(QUALITIES).forEach(q =>
      log(String(r).padEnd(8) + q.padEnd(14) + t[r + '|' + q].map(v => (v * 100).toFixed(1).padStart(8)).join(''))));
  }

  function countingRng(inner) { const f = function () { f.calls++; return inner(); }; f.calls = 0; return f; }
  function threw(fn, type) { try { fn(); } catch (e) { return !type || e instanceof type; } return false; }

  /* The half-width of the aim sweet spot with every random nudge held at zero (rng always 0.5), found by scanning. */
  function sweetHalf(K, distance, rating) {
    const flat = () => 0.5, ideal = K.idealPowerTap(distance, rating);
    let widest = 0;
    for (let off = 0; off <= 0.5; off += 0.001) {
      if (K.resolve({ powerTap: ideal, aimTap: 0.5 + off, distanceYards: distance, kickRating: rating, rng: flat }).good) widest = off;
    }
    return widest;
  }

  function checks(K, t) {
    K = K || load();
    const out = [], add = (name, ok, detail) => out.push({ name, ok: !!ok, detail: ok ? '' : (detail === undefined ? '' : String(detail)) });
    t = t || table(K);
    const pct = v => (v * 100).toFixed(1) + '%';

    // The make-rate rules from the row.
    add('a 90 kicker with perfect taps makes at least 90% from 40 yards', t['90|perfect'][2] >= 0.9, pct(t['90|perfect'][2]));
    add('a 35 kicker with perfect taps makes under 50% from 50 yards', t['35|perfect'][3] < 0.5, pct(t['35|perfect'][3]));
    RATINGS.forEach(r => {
      [2, 3].forEach(i => add('rating ' + r + ': sloppy taps miss more than they make from ' + DISTANCES[i] + ' yards',
        t[r + '|sloppy'][i] < 0.5, pct(t[r + '|sloppy'][i])));
      Object.keys(QUALITIES).forEach(q => {
        const row = t[r + '|' + q];
        add('rating ' + r + ', ' + q + ' taps: make rate never rises with distance', row.every((v, i) => i === 0 || v <= row[i - 1]), row.map(pct).join(' '));
        add('rating ' + r + ', ' + q + ' taps: 20 yards is easier than 50', row[0] > row[3], row.map(pct).join(' '));
      });
      DISTANCES.forEach((d, i) => add('rating ' + r + ', ' + d + ' yards: better taps never make less (perfect, a little off, sloppy)',
        t[r + '|perfect'][i] >= t[r + '|a little off'][i] && t[r + '|a little off'][i] >= t[r + '|sloppy'][i],
        [t[r + '|perfect'][i], t[r + '|a little off'][i], t[r + '|sloppy'][i]].map(pct).join(' ')));
    });
    DISTANCES.forEach((d, i) => {
      add('perfect taps at ' + d + ' yards: a higher rating never makes less', t['35|perfect'][i] <= t['60|perfect'][i] && t['60|perfect'][i] <= t['90|perfect'][i],
        RATINGS.map(r => pct(t[r + '|perfect'][i])).join(' '));
    });
    add('the same seed gives the same table', JSON.stringify(table(K)) === JSON.stringify(t));

    // The needle.
    const samples = [];
    RATINGS.concat([35, 50, 70, 90]).forEach(r => { for (let s = 0; s < 12; s += 0.013) samples.push(K.needleAt(s, r, 0), K.needleAt(s, r, 0.37)); });
    add('needleAt stays from 0 to 1', samples.every(v => v >= 0 && v <= 1 && isFinite(v)), Math.min.apply(null, samples) + ' to ' + Math.max.apply(null, samples));
    add('needleAt starts at 0 with phase 0', RATINGS.every(r => K.needleAt(0, r, 0) === 0));
    add('needleAt gives the same answer for the same inputs', K.needleAt(1.234, 60, 0.2) === K.needleAt(1.234, 60, 0.2));
    add('needleAt uses phase to start elsewhere in the sweep', Math.abs(K.needleAt(0, 60, 0.25) - 0.5) < 0.06 && K.needleAt(0, 60, 0.5) > 0.9, K.needleAt(0, 60, 0.25) + ' / ' + K.needleAt(0, 60, 0.5));
    add('needleAt treats a missing phase as 0', K.needleAt(0.7, 60) === K.needleAt(0.7, 60, 0));
    function firstPeak(r) { for (let s = 0; s < 5; s += 0.001) if (K.needleAt(s, r, 0) >= 0.95) return s; return Infinity; }
    function turns(r) { let n = 0, up = null, prev = K.needleAt(0, r, 0); for (let s = 0.005; s < 10; s += 0.005) { const v = K.needleAt(s, r, 0), u = v > prev; if (up !== null && u !== up && Math.abs(v - prev) > 1e-9) n++; if (Math.abs(v - prev) > 1e-9) up = u; prev = v; } return n; }
    function roughness(r) { // how far the needle strays from a plain out-and-back line
      let sum = 0, n = 0; const p = K.sweepSeconds(r);
      for (let s = 0; s < 8; s += 0.007) { let u = s / p; u -= Math.floor(u); const line = u < 0.5 ? u * 2 : 2 - u * 2; sum += Math.abs(K.needleAt(s, r, 0) - line); n++; }
      return sum / n;
    }
    add('a higher rating sweeps slower (35, 60, 90)', firstPeak(35) < firstPeak(60) && firstPeak(60) < firstPeak(90), [35, 60, 90].map(firstPeak).join(' < '));
    add('a 35 kicker sweeps at least 1.5 times faster than a 90 kicker', K.sweepSeconds(90) / K.sweepSeconds(35) >= 1.5, K.sweepSeconds(35) + ' vs ' + K.sweepSeconds(90));
    add('a higher rating turns the needle around less often', turns(35) > turns(60) && turns(60) > turns(90), [35, 60, 90].map(turns).join(' > '));
    add('a higher rating shakes less (steadier)', roughness(35) > roughness(60) && roughness(60) > roughness(90), [35, 60, 90].map(r => roughness(r).toFixed(4)).join(' > '));
    add('a 90 kicker follows a clean out-and-back line', roughness(90) < 1e-9, roughness(90));
    add('ratings outside 35 to 90 act like the nearest end', K.needleAt(0.8, 10, 0) === K.needleAt(0.8, 35, 0) && K.needleAt(0.8, 200, 0) === K.needleAt(0.8, 90, 0));
    add('needleAt rejects a non-number', threw(() => K.needleAt('1', 60, 0), TypeError) && threw(() => K.needleAt(NaN, 60, 0), TypeError) && threw(() => K.needleAt(1, undefined, 0), TypeError));

    // The sweet spot, with no random nudge.
    const half = {}; RATINGS.forEach(r => { half[r] = DISTANCES.map(d => sweetHalf(K, d, r)); });
    add('a higher rating has a wider sweet spot at every distance', DISTANCES.every((d, i) => half[35][i] < half[60][i] && half[60][i] < half[90][i]), JSON.stringify(half));
    add('the sweet spot narrows as distance rises', RATINGS.every(r => half[r].every((v, i) => i === 0 || v < half[r][i - 1])), JSON.stringify(half));
    add('the sweet spot is centred on 0.5 and never the whole needle', RATINGS.every(r => half[r].every(v => v > 0.02 && v < 0.3)), JSON.stringify(half));

    // resolve: shape, reasons, randomness.
    const flat = () => 0.5;
    const base = { powerTap: K.idealPowerTap(40, 60), aimTap: 0.5, distanceYards: 40, kickRating: 60, rng: flat };
    const one = K.resolve(base);
    add('resolve returns { good, reason }', one && typeof one.good === 'boolean' && typeof one.reason === 'string' && Object.keys(one).sort().join() === 'good,reason');
    add('a centred aim with the ideal power is good and says so', one.good === true && one.reason === 'good');
    add('too little power is short', (r => !r.good && r.reason === 'short')(K.resolve(Object.assign({}, base, { powerTap: 0.1 }))));
    add('an aim far to the left is wide left', (r => !r.good && r.reason === 'wide left')(K.resolve(Object.assign({}, base, { aimTap: 0.05 }))));
    add('an aim far to the right is wide right', (r => !r.good && r.reason === 'wide right')(K.resolve(Object.assign({}, base, { aimTap: 0.95 }))));
    add('short is reported before wide when both are wrong', K.resolve(Object.assign({}, base, { powerTap: 0.1, aimTap: 0.05 })).reason === 'short');
    add('there is no automatic aim: a far-off aim never makes it from 40 yards at any rating', RATINGS.every(r => [0, 0.1, 0.9, 1].every(a =>
      !K.resolve({ powerTap: K.idealPowerTap(40, r), aimTap: a, distanceYards: 40, kickRating: r, rng: flat }).good)));
    add('hitting it harder than needed costs accuracy', (() => { const ideal = K.idealPowerTap(40, 60); return sweetHalf(K, 40, 60) > 0 &&
      !K.resolve({ powerTap: 1, aimTap: 0.5 + sweetHalf(K, 40, 60) - 0.002, distanceYards: 40, kickRating: 60, rng: flat }).good && ideal < 1; })());
    const seenReasons = new Set(), rng = seeded(5);
    let allValid = true, sixEvery = true;
    for (let i = 0; i < 4000; i++) {
      const counted = countingRng(rng);
      const r = K.resolve({ powerTap: rng(), aimTap: rng(), distanceYards: 15 + rng() * 45, kickRating: 35 + rng() * 55, rng: counted });
      seenReasons.add(r.reason);
      if (K.REASONS.indexOf(r.reason) < 0 || r.good !== (r.reason === 'good')) allValid = false;
      if (counted.calls !== 6) sixEvery = false;
    }
    add('every result has one of the four reasons, and good matches it', allValid);
    add('all four reasons turn up over 4,000 mixed kicks', seenReasons.size === 4, [...seenReasons].join());
    add('resolve draws from rng exactly six times, whatever the outcome', sixEvery);
    add('the same seed gives the same kicks, a different seed does not', (() => {
      const run = seed => { const g = seeded(seed), o = []; for (let i = 0; i < 200; i++) o.push(K.resolve({ powerTap: 0.8, aimTap: 0.5, distanceYards: 50, kickRating: 50, rng: g }).reason); return o.join(); };
      return run(9) === run(9) && run(9) !== run(10);
    })());
    add('resolve clamps taps to 0 to 1 and ratings to 35 to 90', (() => {
      const a = K.resolve({ powerTap: 5, aimTap: -3, distanceYards: 30, kickRating: 500, rng: seeded(3) });
      const b = K.resolve({ powerTap: 1, aimTap: 0, distanceYards: 30, kickRating: 90, rng: seeded(3) });
      return a.reason === b.reason && a.good === b.good;
    })());
    add('resolve rejects a missing rng, a missing or odd option, and a non-finite number', [
      () => K.resolve(), () => K.resolve({}), () => K.resolve(Object.assign({}, base, { rng: undefined })), () => K.resolve(Object.assign({}, base, { rng: 0.5 })),
      () => K.resolve(Object.assign({}, base, { powerTap: NaN })), () => K.resolve(Object.assign({}, base, { aimTap: undefined })),
      () => K.resolve(Object.assign({}, base, { distanceYards: Infinity })), () => K.resolve(Object.assign({}, base, { kickRating: '60' }))
    ].every(f => threw(f, TypeError)));
    add('resolve changes nothing it was given', (() => { const o = Object.assign({}, base), copy = JSON.stringify(Object.assign({}, o, { rng: 0 })); K.resolve(o); return JSON.stringify(Object.assign({}, o, { rng: 0 })) === copy && o.rng === flat; })());
    add('Math.random is never used', (() => {
      const real = Math.random; let called = 0; Math.random = () => { called++; return real(); };
      try { K.resolve(base); K.needleAt(1, 60, 0.3); } finally { Math.random = real; }
      return called === 0;
    })());

    // The file itself.
    if (fs) {
      const src = fs.readFileSync(SRC, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      [['document or window use beyond the global', /\bdocument\b|\blocalStorage\b|\bsessionStorage\b/], ['timers', /\b(setTimeout|setInterval|requestAnimationFrame|requestIdleCallback)\b/],
        ['Date or performance clocks', /\bDate\b|\bperformance\b/], ['Math.random', /Math\.random/], ['audio', /AudioContext|\bAudio\b|createOscillator/],
        ['network', /\b(fetch|XMLHttpRequest|WebSocket)\b/], ['imports', /\brequire\s*\(|\bimport\b/]]
        .forEach(b => add('kick.js has no ' + b[0], !b[1].test(src)));
      if (vm) {
        const win = {}, ctx = vm.createContext({ window: win });
        let err = null; try { vm.runInContext(fs.readFileSync(SRC, 'utf8'), ctx); } catch (e) { err = e; }
        add('with no module, kick.js sets window.LanternBowlKick', !err && win.LanternBowlKick && typeof win.LanternBowlKick.resolve === 'function' && typeof win.LanternBowlKick.needleAt === 'function', err && err.message);
      }
    }
    return out;
  }

  function run(log) {
    log = log || console.log;
    const K = load(), t = table(K);
    printTable(t, log);
    log('');
    const results = checks(K, t), bad = results.filter(r => !r.ok);
    results.forEach(r => log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? ' [' + r.detail + ']' : '')));
    log('\n' + (results.length - bad.length) + ' passed, ' + bad.length + ' failed');
    return bad.length === 0;
  }

  return { run, checks, table, seeded, makeRate, sweetHalf };
});
