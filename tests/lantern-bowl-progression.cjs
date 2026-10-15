/* LB-G3: data validation and a standalone, seeded reference simulation.
   Node: node tests/lantern-bowl-progression.cjs
   Browser: LanternProgressionChecks.runChecks(data, (name, ok) => check(name, ok)).

   Integration contract (nothing here runs in the game or writes a save):
   - levels[n] is the NEXT level's cost, not cumulative XP. Start at level 0;
     carry the remainder. The last entry is the final level; further XP is
     discarded. Even at a skill cap the level is consumed, never banked.
   - A level increases ONE eligible rating by levelUp, clipped to the cap.
     The reference sim chooses that rating with one seeded draw per level;
     a future player-facing choice is for LB-SEASON to design.
   - An age band's throughAge is inclusive. null is the final open-ended band.
     Potential is a CURRENT-age cap on every skill, not a lifetime peak or an
     overall cap. On the birthday a lower cap also clamps an existing rating.
   - After each ten-game season, apply the aging change for the age just played
     to every rating, then advance age by one and enforce the new age cap.
   - Overall is the arithmetic mean of the nine fixture skills. The 23 players
     below are synthetic measurement fixtures, NOT LB-G1's 22-player clubs.
     No roster, season, game engine, DOM, clock, storage or dependency is loaded.
   The event XP/costs/caps are original tuning within the backlog's limits.
   No training/injury mechanic, retirement or save field is introduced. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LanternProgressionChecks = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const KEYS = ['throw', 'catch', 'speed', 'carry', 'block', 'rush', 'cover', 'tackle', 'kick'];
  const EVENTS = ['start', 'touchdown', 'catch', 'sack', 'tackle', 'madeKick', 'win'];
  const FIELDS = ['schemaVersion', 'xp', 'levels', 'levelUp', 'potential', 'aging', 'floor', 'ceiling'];
  const SEED = 0x1a47b023;
  const own = (v, k) => Object.prototype.hasOwnProperty.call(v, k);
  const integer = Number.isSafeInteger;
  const plain = v => {
    if (v === null || typeof v !== 'object' || Array.isArray(v)) return false;
    const p = Object.getPrototypeOf(v);
    return p === null || Object.getPrototypeOf(p) === null;
  };

  function validate(data) {
    const errors = [];
    const bad = (path, message) => errors.push(path + ': ' + message);
    function record(v, fields, path) {
      if (!plain(v)) { bad(path, 'must be an object'); return false; }
      let ok = true;
      for (const k of Reflect.ownKeys(v)) {
        const d = Object.getOwnPropertyDescriptor(v, k);
        if (typeof k !== 'string' || !fields.includes(k)) { bad(path, 'unknown field ' + String(k)); ok = false; }
        else if (!own(d, 'value') || !d.enumerable) { bad(path + '.' + k, 'must be an enumerable data field'); ok = false; }
      }
      for (const k of fields) if (!own(v, k)) { bad(path + '.' + k, 'is required'); ok = false; }
      return ok;
    }
    function array(v, path) {
      if (!Array.isArray(v) || !v.length || v.length > 1000) { bad(path, 'must be a nonempty array of at most 1000 entries'); return false; }
      let ok = true;
      for (const k of Reflect.ownKeys(v)) {
        if (k !== 'length' && (typeof k !== 'string' || !/^(0|[1-9][0-9]*)$/.test(k) || Number(k) >= v.length)) {
          bad(path, 'unknown array field ' + String(k)); ok = false;
        }
      }
      for (let i = 0; i < v.length; i++) {
        const d = Object.getOwnPropertyDescriptor(v, i);
        if (!d || !own(d, 'value') || !d.enumerable) { bad(path + '[' + i + ']', 'must be an enumerable data item'); ok = false; }
      }
      return ok;
    }
    function bands(v, field, path) {
      if (!array(v, path)) return false;
      let ok = true, previous = -1;
      for (let i = 0; i < v.length; i++) {
        const b = v[i], at = path + '[' + i + ']';
        if (!record(b, ['throughAge', field], at)) { ok = false; continue; }
        if (i === v.length - 1 ? b.throughAge !== null : !integer(b.throughAge) || b.throughAge <= previous) {
          bad(at + '.throughAge', 'must rise strictly, with only the final band null'); ok = false;
        }
        previous = b.throughAge;
        if (!integer(b[field])) { bad(at + '.' + field, 'must be a safe whole number'); ok = false; }
      }
      return ok;
    }
    try {
      if (!record(data, FIELDS, 'progression')) return errors;
      if (data.schemaVersion !== 1) bad('schemaVersion', 'must be 1');
      if (data.floor !== 35 || data.ceiling !== 90) bad('bounds', 'must be floor 35 and ceiling 90');
      if (!integer(data.levelUp) || data.levelUp < 1 || data.levelUp > 3) bad('levelUp', 'must be 1 to 3');
      if (record(data.xp, EVENTS, 'xp')) for (const k of EVENTS) {
        if (!integer(data.xp[k]) || data.xp[k] < 0 || data.xp[k] > 10) bad('xp.' + k, 'must be 0 to 10');
      }
      if (array(data.levels, 'levels')) for (let i = 0; i < data.levels.length; i++) {
        if (!integer(data.levels[i]) || data.levels[i] <= (i ? data.levels[i - 1] : 0)) bad('levels[' + i + ']', 'must be positive and strictly rising');
      }
      if (bands(data.potential, 'cap', 'potential')) {
        for (let i = 0; i < data.potential.length; i++) {
          const cap = data.potential[i].cap;
          if (cap < 35 || cap > 90 || i && cap > data.potential[i - 1].cap) bad('potential[' + i + '].cap', 'must be 35 to 90 and never rise with age');
        }
        if (band(data.potential, 22).cap <= band(data.potential, 30).cap) bad('potential', 'age 22 must have a higher cap than age 30');
      }
      if (bands(data.aging, 'change', 'aging')) {
        // Check each interval's endpoints and the explicit growth/plateau/decline
        // boundaries. No unbounded loop over a supplied age is needed.
        const ages = [0, 26, 27, 28, 30, 31];
        for (let i = 0; i < data.aging.length - 1; i++) {
          ages.push(data.aging[i].throughAge, data.aging[i].throughAge + 1);
        }
        for (const age of ages) {
          const delta = band(data.aging, age).change;
          if (Math.abs(delta) > 55 || (age <= 27 ? delta <= 0 : age <= 30 ? delta !== 0 : delta >= 0)) {
            bad('aging', 'must grow through age 27, plateau at 28 to 30, and decline from 31 (change within -55 to 55)'); break;
          }
        }
      }
    } catch (_) { bad('progression', 'must be readable plain data'); }
    return errors;
  }
  function band(bands, age) {
    for (let i = 0; i < bands.length; i++) if (bands[i].throughAge === null || age <= bands[i].throughAge) return bands[i];
    throw new RangeError('Age is not covered');
  }
  function requireData(data) {
    const errors = validate(data);
    if (errors.length) throw new TypeError(errors.join('; '));
  }
  // Copy only validated own data fields. This ignores inherited array methods
  // and toJSON hooks on direct-JavaScript inputs to the public check runner.
  function tableCopy(data) {
    const result = {};
    for (const k of ['schemaVersion', 'levelUp', 'floor', 'ceiling']) result[k] = data[k];
    result.xp = {};
    for (const k of EVENTS) result.xp[k] = data.xp[k];
    result.levels = [];
    for (let i = 0; i < data.levels.length; i++) result.levels.push(data.levels[i]);
    for (const field of ['potential', 'aging']) {
      const valueKey = field === 'potential' ? 'cap' : 'change';
      result[field] = [];
      for (let i = 0; i < data[field].length; i++) result[field].push({ throughAge: data[field][i].throughAge, [valueKey]: data[field][i][valueKey] });
    }
    return result;
  }
  function rng(seed) {
    if (!integer(seed) || seed < 0 || seed > 0xffffffff) throw new TypeError('Seed must be a uint32');
    let state = seed;
    return function () {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }
  const overall = player => KEYS.reduce((sum, key) => sum + player.ratings[key], 0) / KEYS.length;
  const copy = player => ({ id: player.id, role: player.role, age: player.age, level: player.level, xp: player.xp, ratings: Object.assign({}, player.ratings) });
  const clamp = (n, data, age) => Math.max(data.floor, Math.min(n, data.ceiling, band(data.potential, age).cap));
  function fixture(data, seed = SEED) {
    requireData(data);
    const random = rng(seed), players = [];
    for (let i = 0; i < 23; i++) {
      const age = i === 0 ? 22 : i === 1 ? 33 : 21 + (i - 2) % 16;
      const ratings = {};
      for (const key of KEYS) ratings[key] = clamp(i === 0 ? 60 : i === 1 ? 72 : 40 + Math.floor(random() * 41), data, age);
      players.push({ id: 'fixture-' + (i + 1), role: i < 2 ? 'receiver' : ['passer', 'runner', 'receiver', 'defender', 'kicker'][i % 5], age, level: 0, xp: 0, ratings });
    }
    return players;
  }
  function randomDraw(random) {
    const draw = random();
    if (typeof draw !== 'number' || !Number.isFinite(draw) || draw < 0 || draw >= 1) throw new TypeError('RNG must return a number in [0, 1)');
    return draw;
  }
  function gain(player, events, data, random) {
    let earned = 0;
    for (const key of EVENTS) earned += events[key] * data.xp[key];
    player.xp += earned;
    let gained = 0;
    while (player.level < data.levels.length && player.xp >= data.levels[player.level]) {
      player.xp -= data.levels[player.level++];
      const eligible = KEYS.filter(key => player.ratings[key] < band(data.potential, player.age).cap);
      const draw = randomDraw(random); // Still consumed when every skill is capped.
      if (eligible.length) {
        const key = eligible[Math.floor(draw * eligible.length)];
        player.ratings[key] = clamp(player.ratings[key] + data.levelUp, data, player.age);
      }
      gained++;
    }
    if (player.level === data.levels.length) player.xp = 0;
    return gained;
  }
  function agePlayer(player, data) {
    const delta = band(data.aging, player.age).change;
    for (const key of KEYS) player.ratings[key] = clamp(player.ratings[key] + delta, data, player.age);
    player.age++;
    for (const key of KEYS) player.ratings[key] = clamp(player.ratings[key], data, player.age);
  }
  function matchEvents(player, win, random) {
    const events = { start: 1, touchdown: 0, catch: 0, sack: 0, tackle: 0, madeKick: 0, win: win ? 1 : 0 };
    const a = randomDraw(random), b = randomDraw(random);
    // Transparent synthetic workloads, not predictions of the match engine.
    if (player.role === 'receiver') { events.catch = 2 + Math.floor(a * 3); events.touchdown = b < 0.25 ? 1 : 0; }
    if (player.role === 'passer') events.touchdown = Math.floor(a * 3);
    if (player.role === 'runner') events.touchdown = a < 0.4 ? 1 : 0;
    if (player.role === 'defender') { events.tackle = 2 + Math.floor(a * 5); events.sack = b < 0.3 ? 1 : 0; }
    if (player.role === 'kicker') events.madeKick = 1 + Math.floor(a * 3);
    return events;
  }
  function simulate(data, seed = SEED) {
    requireData(data);
    const players = fixture(data, seed), random = rng((seed ^ 0x5f3759df) >>> 0), snapshots = [], seasons = [];
    const snapshot = (season, game, phase) => snapshots.push({ season, game, phase, players: players.map(copy) });
    snapshot(0, 0, 'initial');
    for (let season = 1; season <= 5; season++) {
      const before = players.map(overall);
      for (let game = 1; game <= 10; game++) {
        const win = randomDraw(random) < 0.5;
        for (const player of players) gain(player, matchEvents(player, win, random), data, random);
        snapshot(season, game, 'match');
      }
      for (const player of players) agePlayer(player, data);
      snapshot(season, 10, 'birthday');
      const values = players.flatMap(player => KEYS.map(key => player.ratings[key]));
      seasons.push({ season, starterAge: players[0].age, starter: overall(players[0]), starterGain: overall(players[0]) - before[0], veteranAge: players[1].age, veteran: overall(players[1]), mean: players.reduce((sum, p) => sum + overall(p), 0) / 23, min: Math.min(...values), max: Math.max(...values) });
    }
    return { initial: snapshots[0].players, players: players.map(copy), seasons, snapshots };
  }

  function runChecks(data, report = () => {}) {
    let count = 0;
    const check = (name, ok) => { count++; report(name, Boolean(ok)); };
    const errors = validate(data);
    check('authored progression validates: ' + errors.join('; '), errors.length === 0);
    if (errors.length) return count;
    const supplied = data;
    data = tableCopy(data);
    const original = JSON.stringify(data), clone = () => JSON.parse(original);
    function reject(name, mutate) { const v = clone(); mutate(v); check(name, validate(v).length > 0); }
    const result = simulate(data);
    check('fixture contains exactly 23 independent unique players', result.initial.length === 23 && new Set(result.initial.map(p => p.id)).size === 23);
    check('five seasons of ten games plus birthday snapshots', result.seasons.length === 5 && result.snapshots.length === 56 && result.snapshots.filter(s => s.phase === 'match').length === 50);
    for (const s of result.snapshots) {
      check('all skills, XP and caps valid at ' + s.season + '/' + s.game + '/' + s.phase, s.players.every(p =>
        KEYS.every(k => integer(p.ratings[k]) && p.ratings[k] >= 35 && p.ratings[k] <= 90 && p.ratings[k] <= band(data.potential, p.age).cap) &&
        Object.keys(p.ratings).length === 9 && integer(p.level) && p.level >= 0 && p.level <= data.levels.length && integer(p.xp) && p.xp >= 0 &&
        (p.level === data.levels.length ? p.xp === 0 : p.xp < data.levels[p.level])));
    }
    for (const s of result.seasons.slice(0, 2)) check('typical 22-year-old gains 2 to 6 overall in season ' + s.season, s.starterGain >= 2 && s.starterGain <= 6);
    check('33-year-old loses overall over five seasons', overall(result.players[1]) < overall(result.initial[1]));
    check('veteran declines in every season', result.seasons.every((s, i) => s.veteran < (i ? result.seasons[i - 1].veteran : 72)));
    check('same seed gives byte-identical complete history', JSON.stringify(result) === JSON.stringify(simulate(data)));
    check('different seed changes history', JSON.stringify(result) !== JSON.stringify(simulate(data, SEED + 1)));
    check('fixture and simulation leave data unchanged', original === JSON.stringify(data));
    check('returned snapshots are independent', result.initial[0] !== result.players[0] && result.initial[0].ratings !== result.players[0].ratings && result.snapshots[1].players[0].ratings !== result.initial[0].ratings);
    for (const seed of [0, 1, 42, 12345, 0xffffffff]) {
      const r = simulate(data, seed);
      check('young/veteran outcomes for seed ' + seed, r.seasons.slice(0, 2).every(s => s.starterGain >= 2 && s.starterGain <= 6) && overall(r.players[1]) < 72);
    }
    // Exercise exact per-event accounting independently of the synthetic workload.
    for (const event of EVENTS) {
      const p = copy(result.initial[0]), ev = Object.fromEntries(EVENTS.map(k => [k, k === event ? 1 : 0]));
      const spent = gain(p, ev, data, () => 0);
      const paid = data.levels.slice(0, p.level).reduce((sum, cost) => sum + cost, 0);
      check(event + ' pays exactly its table XP', paid + p.xp === data.xp[event] && spent === p.level);
    }
    const noEvents = Object.fromEntries(EVENTS.map(k => [k, 0]));
    const p = copy(result.initial[0]);
    p.xp = data.levels[0] - 1;
    const unchanged = JSON.stringify(p);
    gain(p, noEvents, data, () => 0);
    check('below threshold does not level', JSON.stringify(p) === unchanged);
    p.xp = data.levels[0];
    const before = Object.assign({}, p.ratings);
    gain(p, noEvents, data, () => 0);
    check('exact threshold spends cost and increments level once', p.level === 1 && p.xp === 0);
    check('one level changes exactly one rating by levelUp', KEYS.filter(k => p.ratings[k] !== before[k]).length === 1 && KEYS.reduce((n, k) => n + p.ratings[k] - before[k], 0) === data.levelUp);
    const burst = copy(result.initial[0]); burst.xp = data.levels[0] + data.levels[1] + 7;
    const burstCount = gain(burst, noEvents, data, () => 0.999999);
    check('multiple levels carry remainder', burstCount === 2 && burst.level === 2 && burst.xp === 7);
    const capped = copy(result.initial[0]); for (const k of KEYS) capped.ratings[k] = band(data.potential, capped.age).cap;
    capped.xp = data.levels[0]; let draws = 0;
    gain(capped, noEvents, data, () => { draws++; return 0; });
    check('a capped level is consumed without banked growth', capped.level === 1 && capped.xp === 0 && draws === 1 && KEYS.every(k => capped.ratings[k] === band(data.potential, capped.age).cap));
    const near = copy(capped); near.level = 0; near.xp = data.levels[0]; near.ratings.kick--;
    gain(near, noEvents, data, () => 0.5);
    check('level increase clips at potential and selects an eligible skill', near.ratings.kick === capped.ratings.kick && overall(near) === overall(capped));
    const terminal = copy(result.initial[0]); terminal.xp = data.levels.reduce((n, cost) => n + cost, 0) + 100;
    gain(terminal, noEvents, data, () => 0.5);
    check('terminal level drops surplus XP', terminal.level === data.levels.length && terminal.xp === 0);
    const terminalBefore = JSON.stringify(terminal);
    gain(terminal, Object.fromEntries(EVENTS.map(k => [k, 10])), data, () => { throw new Error('no further level'); });
    check('terminal level ignores future XP and needs no random draw', terminalBefore === JSON.stringify(terminal));
    for (const age of [21, 22, 26, 27, 28, 30, 31, 33, 34, 35, 90]) {
      for (const rating of [35, band(data.potential, age).cap]) {
        const a = copy(result.initial[0]); a.age = age; for (const k of KEYS) a.ratings[k] = rating;
        const expected = clamp(clamp(rating + band(data.aging, age).change, data, age), data, age + 1);
        agePlayer(a, data);
        check('birthday ordering/floor/cap at age ' + age + ' rating ' + rating, a.age === age + 1 && KEYS.every(k => a.ratings[k] === expected));
      }
    }
    for (const value of [undefined, null, [], 'data', 1, false]) check('reject invalid root ' + String(value), validate(value).length > 0);
    for (const field of FIELDS) reject('reject missing ' + field, v => { delete v[field]; });
    reject('reject unknown root field', v => { v.training = 1; });
    reject('reject schema version', v => { v.schemaVersion = 2; });
    for (const floor of [34, 36, '35']) reject('reject floor ' + floor, v => { v.floor = floor; });
    for (const ceiling of [89, 91, '90']) reject('reject ceiling ' + ceiling, v => { v.ceiling = ceiling; });
    for (const value of [0, 4, 1.5, '2', NaN, Infinity]) reject('reject levelUp ' + value, v => { v.levelUp = value; });
    for (const event of EVENTS) {
      reject('reject missing event ' + event, v => { delete v.xp[event]; });
      for (const value of [-1, 11, 1.5, '4', NaN, Infinity]) reject('reject ' + event + ' XP ' + value, v => { v.xp[event] = value; });
    }
    reject('reject unknown XP event', v => { v.xp.injury = 1; });
    for (const value of [[], [0], [18, 18], [18, 17], [1.5], ['18'], [Infinity], [Number.MAX_SAFE_INTEGER + 1]]) reject('reject non-rising/noninteger levels ' + value, v => { v.levels = value; });
    for (const field of ['potential', 'aging']) {
      reject('reject missing bands ' + field, v => { v[field] = []; });
      reject('reject wrong band object ' + field, v => { v[field][0] = null; });
      reject('reject unknown band key ' + field, v => { v[field][0].other = 1; });
      reject('reject gap/open end ' + field, v => { v[field][v[field].length - 1].throughAge = 99; });
      reject('reject early null ' + field, v => { v[field][0].throughAge = null; });
      reject('reject reversed ages ' + field, v => { v[field][1].throughAge = 20; });
      for (const value of [-1, 1.5, '26', NaN, Infinity]) reject('reject band age ' + field + '/' + value, v => { v[field][0].throughAge = value; });
    }
    for (const value of [34, 91, 80.5, '90', NaN]) reject('reject cap ' + value, v => { v.potential[0].cap = value; });
    reject('reject potential rising with age', v => { v.potential[1].cap = 91; });
    reject('reject equal young and mature potential', v => { v.potential[1].cap = 90; });
    reject('reject no young growth', v => { v.aging[0].change = 0; });
    reject('reject growth during plateau', v => { v.aging[2].change = 1; });
    reject('reject no veteran decline', v => { v.aging[3].change = 0; });
    reject('reject terminal growth', v => { v.aging[4].change = 1; });
    reject('reject noninteger aging', v => { v.aging[0].change = 1.5; });
    reject('reject excessive aging', v => { v.aging[0].change = 56; });
    for (const field of ['levels', 'potential', 'aging']) {
      reject('reject sparse ' + field, v => { delete v[field][0]; });
      reject('reject unknown array field ' + field, v => { v[field].extra = 1; });
      reject('reject array accessor ' + field, v => { Object.defineProperty(v[field], 0, { get() { throw new Error('must not run'); } }); });
    }
    let read = false;
    reject('reject root accessor without invoking it', v => { Object.defineProperty(v, 'xp', { get() { read = true; throw new Error('must not run'); } }); });
    reject('reject nested accessor without invoking it', v => { Object.defineProperty(v.xp, 'start', { get() { read = true; throw new Error('must not run'); } }); });
    reject('reject object-tag accessor without invoking it', v => { Object.defineProperty(v.xp, Symbol.toStringTag, { get() { read = true; throw new Error('must not run'); } }); });
    check('no supplied accessors invoked', !read);
    reject('reject hidden required fields', v => { Object.defineProperty(v.xp, 'start', { value: 4, enumerable: false }); });
    reject('reject cyclic data', v => { v.potential[0] = v; });
    const revoked = Proxy.revocable({}, {}); revoked.revoke();
    check('reject revoked proxy without crashing', validate(revoked.proxy).length > 0);
    const poison = clone();
    for (const field of ['levels', 'potential', 'aging']) Object.setPrototypeOf(poison[field], { map() { throw new Error('inherited method'); } });
    check('validation does not invoke inherited array methods', validate(poison).length === 0);
    let hookReads = 0;
    Object.setPrototypeOf(poison.levels, { get toJSON() { hookReads++; throw new Error('inherited hook'); } });
    check('canonical check input ignores inherited JSON hooks', JSON.stringify(tableCopy(poison)) === original && hookReads === 0);
    check('simulation ignores inherited array/JSON hooks', JSON.stringify(simulate(poison)) === JSON.stringify(result) && hookReads === 0);
    const nullProto = clone(); Object.setPrototypeOf(nullProto, null); Object.setPrototypeOf(nullProto.xp, null);
    check('null-prototype data accepted', validate(nullProto).length === 0);
    const frozen = clone(); Object.freeze(frozen.xp); Object.freeze(frozen.levels); Object.freeze(frozen);
    check('frozen data is not mutated', validate(frozen).length === 0 && JSON.stringify(simulate(frozen)) === JSON.stringify(result));
    for (const seed of [-1, 0x100000000, 1.5, '1', NaN]) {
      let throws = false; try { simulate(data, seed); } catch (_) { throws = true; }
      check('reject invalid seed ' + seed, throws);
    }
    let throws = false; try { simulate({}); } catch (_) { throws = true; }
    check('simulation rejects malformed table before running', throws);
    check('checks leave supplied data unchanged', original === JSON.stringify(tableCopy(supplied)));
    return count;
  }
  return Object.freeze({ validate, runChecks, fixture, simulate, overall, seed: SEED });
});

if (typeof module === 'object' && module.exports && typeof require === 'function' && require.main === module) {
  try {
    const fs = require('node:fs'), path = require('node:path');
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../games/lantern-bowl/progression.json'), 'utf8'));
    let passed = 0, failed = 0;
    module.exports.runChecks(data, (name, ok) => { if (ok) passed++; else { failed++; console.error('FAIL ' + name); } });
    console.log((failed ? 'FAIL' : 'PASS') + ': ' + passed + ' Lantern Bowl progression checks passed, ' + failed + ' failed.');
    if (failed) process.exitCode = 1;
    else {
      console.log('23 synthetic players; 5 seasons x 10 games; seed ' + module.exports.seed + '.');
      console.log('Season  Young age/overall/gain  Veteran age/overall  Squad mean  Min/max');
      for (const s of module.exports.simulate(data).seasons) console.log(String(s.season).padEnd(8) +
        (s.starterAge + '/' + s.starter.toFixed(2) + '/+' + s.starterGain.toFixed(2)).padEnd(24) +
        (s.veteranAge + '/' + s.veteran.toFixed(2)).padEnd(21) + s.mean.toFixed(2).padEnd(12) + s.min + '/' + s.max);
      console.log('Ages shown after each birthday. Every match and birthday respects 35-90 and the current-age skill cap.');
    }
  } catch (error) { console.error('FAIL Lantern Bowl progression: ' + error.message); process.exitCode = 1; }
}
