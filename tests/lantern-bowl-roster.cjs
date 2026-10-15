/* LB-G1: original, inactive roster data; no engine, DOM, clocks or saves.
   Node: node tests/lantern-bowl-roster.cjs
   Browser: LanternRosterChecks.runChecks(data, (label, ok) => check(label, ok)).

   Contract: flat player records { id, name, age, ...2–4 named rating keys }.
   Omitted skills read as 50, just like model.js person(). Player overall is
   the unrounded arithmetic mean of AUTHORED skills, not all nine defaults.
   Club overall is the unrounded, equally weighted mean of player overalls.
   A 2-skill player counts just as much as a 4-skill player. High/low players
   use that same overall, not a single outlying skill. Compare before rounding.
   This definition is explicit because averaging nine defaulted skills cannot
   reach the required Harrowgate target or 80+ player with only 2–4 ratings.

   Slots are authoritative: 10 offence + 11 defence + kicker = 22.
   Director correction: #373 issuecomment-6182646603 (2026-10-15).
   #451 route bindings stay wr0 -> wr[0], wr1 -> wr[1], te -> te, rb -> rb.
   IDs are stable fictional identities, never indices or future save fields.
   No consuming engine integration or player-card design is defined here. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LanternRosterChecks = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const CLUBS = ['brackenport', 'millrace', 'harrowgate', 'tollbridge', 'quarryhill', 'fernmoor'];
  const TARGETS = { brackenport: 60, millrace: 63, harrowgate: 72, tollbridge: 55, quarryhill: 67, fernmoor: 50 };
  const RATINGS = ['throw', 'catch', 'speed', 'carry', 'block', 'rush', 'cover', 'tackle', 'kick'];
  const SLOTS = { qb: 1, rb: 1, wr: 2, te: 1, line: 5, front: 4, backers: 3, secondary: 4, kicker: 1 };
  const IDENTITY = ['id', 'name', 'age'];
  const ESSENTIAL = { qb: ['throw'], rb: ['speed', 'carry'], wr: ['speed', 'catch'], te: ['catch', 'block'], line: ['block'], front: ['rush'], backers: ['tackle'], secondary: ['cover'], kicker: ['kick'] };
  const KEPT = {
    brackenport: ['Wren Talley', 'Mara Holt', 'Ada Brisk', 'Tomas Reed', 'Bram Okafor', 'Sol Varga'],
    millrace: ['Ned Harrow', 'Cole Pimm', 'Lise Venn', 'Otto Brant', 'Ivo Pell', 'Pat Low']
  };
  // Read-only baseRoster fixture: preserves every authored ordering and tie.
  const LEGACY = {
    brackenport: [{ throw: 64, speed: 52, carry: 48 }, { speed: 66, carry: 63, catch: 54 }, { speed: 70, catch: 68 }, { speed: 60, catch: 58 }, { speed: 48, catch: 60, block: 62 }, { kick: 61 }],
    millrace: [{ throw: 64, speed: 54, carry: 50 }, { speed: 64, carry: 62, catch: 56 }, { speed: 66, catch: 62 }, { speed: 60, catch: 58 }, { speed: 51, catch: 58, block: 56 }, { kick: 58 }]
  };
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const object = o => o !== null && typeof o === 'object' && !Array.isArray(o);
  const text = s => typeof s === 'string' && s.trim().length > 0;
  const mean = values => values.reduce((sum, n) => sum + n, 0) / values.length;
  const authored = player => RATINGS.filter(key => own(player, key));
  const rating = (player, key) => own(player, key) ? player[key] : 50;
  const playerOverall = player => mean(authored(player).map(key => player[key]));
  // 12 is divisible by all allowed skill counts (2, 3, 4), so exact integer
  // twelfths preserve inclusive club-average boundaries without float drift.
  const overallTwelfths = player => {
    const keys = authored(player);
    return keys.reduce((sum, key) => sum + player[key], 0) * (12 / keys.length);
  };
  const players = club => Object.keys(SLOTS).flatMap(slot => SLOTS[slot] === 1 ? [club[slot]] : club[slot]);
  const keptPlayers = club => [club.qb, club.rb, club.wr[0], club.wr[1], club.te, club.kicker];
  function clubSummary(club) {
    const all = players(club), overalls = all.map(playerOverall);
    return { count: all.length, average: all.reduce((sum, p) => sum + overallTwelfths(p), 0) / (12 * all.length), lowest: Math.min(...overalls), highest: Math.max(...overalls) };
  }

  function validate(data) {
    const errors = [], ids = new Set();
    const error = (path, message) => errors.push(path + ': ' + message);
    function fields(value, allowed, required, path) {
      if (!object(value)) { error(path, 'must be an object'); return false; }
      for (const key of Object.keys(value)) if (!allowed.includes(key)) error(path, 'unknown key ' + key);
      for (const key of required) if (!own(value, key)) error(path + '.' + key, 'required');
      return true;
    }
    function player(p, path) {
      if (!fields(p, IDENTITY.concat(RATINGS), IDENTITY, path)) return;
      if (!text(p.id)) error(path + '.id', 'must be a nonblank string');
      else if (ids.has(p.id)) error(path + '.id', 'duplicate player ID ' + p.id);
      else ids.add(p.id);
      if (!text(p.name)) error(path + '.name', 'must be a nonblank string');
      if (!Number.isInteger(p.age) || p.age < 21 || p.age > 36) error(path + '.age', 'must be a whole number from 21 to 36');
      const keys = authored(p);
      if (keys.length < 2 || keys.length > 4) error(path, 'requires 2 to 4 authored ratings');
      for (const key of keys) {
        if (!Number.isInteger(p[key]) || p[key] < 35 || p[key] > 90) error(path + '.' + key, 'rating must be a whole number from 35 to 90');
      }
    }
    // Accept JSON-shaped input only. Catch cycles/getters/sparse arrays before
    // semantic traversal, without invoking a getter or walking a huge array.
    function jsonShape(value, path, seen) {
      if (value === null || ['string', 'boolean'].includes(typeof value)) return;
      if (typeof value === 'number') { if (!Number.isFinite(value)) error(path, 'must be finite JSON'); return; }
      if (typeof value !== 'object') { error(path, 'must be JSON data'); return; }
      if (seen.has(value)) { error(path, 'cycle or repeated object'); return; }
      seen.add(value);
      const keys = Reflect.ownKeys(value), array = Array.isArray(value);
      if (!array && Object.getPrototypeOf(value) !== null && Object.getPrototypeOf(value) !== Object.prototype) {
        // Cross-realm browser fixtures still have a plain-object prototype.
        const proto = Object.getPrototypeOf(value);
        if (Object.getPrototypeOf(proto) !== null || Object.getOwnPropertyNames(proto).sort().join(',') !== Object.getOwnPropertyNames(Object.prototype).sort().join(',')) {
          error(path, 'must be a plain JSON object'); return;
        }
      }
      if (array && (value.length > 22 || keys.length !== value.length + 1)) { error(path, 'invalid array length, sparse array or extra array field'); return; }
      for (const key of keys) {
        if (array && key === 'length') continue;
        if (typeof key !== 'string' || (array && !/^(0|[1-9][0-9]*)$/.test(key))) { error(path, 'unknown JSON field'); continue; }
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor.enumerable || !own(descriptor, 'value')) { error(path, 'requires plain enumerable values'); continue; }
        jsonShape(descriptor.value, path + '.' + key, seen);
      }
    }
    try { jsonShape(data, 'roster', new Set()); } catch (_) { error('roster', 'must be inspectable JSON data'); }
    if (errors.length) return errors;
    if (!fields(data, ['schemaVersion', 'clubs'], ['schemaVersion', 'clubs'], 'roster')) return errors;
    if (data.schemaVersion !== 1) error('schemaVersion', 'must be 1');
    if (!fields(data.clubs, CLUBS, CLUBS, 'clubs')) return errors;
    for (const id of CLUBS) {
      const club = data.clubs[id], start = errors.length, path = 'clubs.' + id;
      if (!fields(club, Object.keys(SLOTS), Object.keys(SLOTS), path)) continue;
      for (const [slot, count] of Object.entries(SLOTS)) {
        const value = club[slot], at = path + '.' + slot;
        if (count === 1) player(value, at);
        else if (!Array.isArray(value) || value.length !== count) error(at, 'requires exactly ' + count + ' players');
        else value.forEach((p, i) => player(p, at + '[' + i + ']'));
      }
      if (errors.length !== start) continue;
      for (const [slot, keys] of Object.entries(ESSENTIAL)) {
        const group = SLOTS[slot] === 1 ? [club[slot]] : club[slot];
        for (const p of group) for (const key of keys) if (!own(p, key)) error(path + '.' + slot, 'position requires authored ' + key);
      }
      if (KEPT[id]) keptPlayers(club).forEach((p, i) => {
        if (p.name !== KEPT[id][i]) error(path, 'kept identity must remain in its slot: ' + KEPT[id][i]);
        for (const key of Object.keys(LEGACY[id][i])) if (!own(p, key)) error(path, p.name + ' must keep authored ' + key);
      });
      const summary = clubSummary(club);
      if (summary.count !== 22) error(path, 'requires 22 players');
      if (Math.abs(summary.average - TARGETS[id]) > 2) error(path, 'club average must be within 2 of ' + TARGETS[id]);
      if (summary.highest < 80) error(path, 'requires a player overall of at least 80');
      if (summary.lowest > 45) error(path, 'requires a player overall of at most 45');
    }
    if (!errors.length) {
      const original = [];
      for (const id of Object.keys(LEGACY)) keptPlayers(data.clubs[id]).forEach((p, i) => {
        for (const key of Object.keys(LEGACY[id][i])) original.push([LEGACY[id][i][key], p[key]]);
      });
      if (!original.every(a => original.every(b => Math.sign(a[0] - b[0]) === Math.sign(a[1] - b[1])))) error('clubs', 'kept skill strengths and ties must retain their relative order');
      const home = data.clubs.brackenport, away = data.clubs.millrace;
      const unit = (club, slot, key) => mean(club[slot].map(p => rating(p, key)));
      if (unit(home, 'line', 'block') >= unit(away, 'line', 'block')) error('clubs', 'Millrace must retain its stronger line specialty');
      for (const [slot, key] of [['front', 'rush'], ['backers', 'tackle'], ['secondary', 'cover']]) if (unit(home, slot, key) <= unit(away, slot, key)) error('clubs', 'Brackenport must retain its stronger ' + key + ' specialty');
      if (home.kicker.kick <= away.kicker.kick) error('clubs', 'Brackenport must retain its stronger kick specialty');
    }
    return errors;
  }

  function runChecks(data, report) {
    const clone = () => JSON.parse(JSON.stringify(data));
    const before = JSON.stringify(data), errors = validate(data);
    report('six-club roster satisfies the schema: ' + errors.join('; '), errors.length === 0);
    if (errors.length) return;
    const reject = (label, change, fragment) => {
      const fixture = clone(); change(fixture);
      const faults = validate(fixture);
      report(label, faults.length > 0 && (!fragment || faults.some(e => e.includes(fragment))));
    };
    const accept = (label, change) => { const fixture = clone(); change(fixture); report(label, validate(fixture).length === 0); };
    for (const id of CLUBS) {
      const club = data.clubs[id], summary = clubSummary(club);
      report(id + ': 22 players, 10 offence, 11 defence and a kicker', summary.count === 22 && 1 + 1 + club.wr.length + 1 + club.line.length === 10 && club.front.length + club.backers.length + club.secondary.length === 11);
      report(id + ': club average ' + summary.average.toFixed(4) + ' is within 2 of ' + TARGETS[id], Math.abs(summary.average - TARGETS[id]) <= 2);
      report(id + ': a strong and a developing player use their overall', summary.highest >= 80 && summary.lowest <= 45);
      for (const [slot, keys] of Object.entries(ESSENTIAL)) {
        const group = SLOTS[slot] === 1 ? [club[slot]] : club[slot];
        report(id + '.' + slot + ': position skills are authored', group.every(p => keys.every(key => own(p, key))));
      }
    }
    // Every legacy rating pair, including cross-club ties, keeps its ordering.
    const legacyRatings = [];
    for (const id of Object.keys(LEGACY)) keptPlayers(data.clubs[id]).forEach((p, i) => {
      for (const key of Object.keys(LEGACY[id][i])) legacyRatings.push([LEGACY[id][i][key], p[key]]);
    });
    report('all original named skill orderings and ties survive the wider scale', legacyRatings.every(a => legacyRatings.every(b => Math.sign(a[0] - b[0]) === Math.sign(a[1] - b[1]))));
    const home = data.clubs.brackenport, away = data.clubs.millrace;
    const unitMean = (club, slot, key) => mean(club[slot].map(p => rating(p, key)));
    report('Millrace keeps the stronger line specialty', unitMean(away, 'line', 'block') > unitMean(home, 'line', 'block'));
    report('Brackenport keeps its rush, cover, tackle and kick specialties', unitMean(home, 'front', 'rush') > unitMean(away, 'front', 'rush') && unitMean(home, 'secondary', 'cover') > unitMean(away, 'secondary', 'cover') && unitMean(home, 'backers', 'tackle') > unitMean(away, 'backers', 'tackle') && home.kicker.kick > away.kicker.kick);
    report('the source data is unchanged by validation and summaries', JSON.stringify(data) === before);
    report('omitted rating is 50 without mutating the record', rating({ throw: 90, carry: 70 }, 'block') === 50);
    report('player overall averages only authored ratings', playerOverall({ throw: 90, carry: 70 }) === 80);
    report('two-rating and four-rating players have equal weight', mean([{ throw: 90, carry: 70 }, { throw: 40, carry: 40, speed: 40, catch: 40 }].map(playerOverall)) === 60);
    report('overall is not prematurely rounded', playerOverall({ throw: 61, carry: 60, speed: 60 }) === 181 / 3);
    for (const invalid of [null, [], false, 7, 'roster', undefined, NaN, Infinity]) report('rejects malformed root ' + String(invalid), validate(invalid).length > 0);
    for (const version of [0, 2, '1', null, true]) reject('rejects schema version ' + String(version), f => { f.schemaVersion = version; }, 'schemaVersion');
    for (const key of ['schemaVersion', 'clubs']) reject('requires top-level ' + key, f => { delete f[key]; }, key);
    reject('rejects unknown top-level key', f => { f.save = {}; }, 'unknown key');
    for (const id of CLUBS) reject('requires club ' + id, f => { delete f.clubs[id]; }, id);
    reject('rejects a seventh club', f => { f.clubs.other = {}; }, 'unknown key');
    reject('rejects an array of clubs', f => { f.clubs = []; });
    for (const [slot, count] of Object.entries(SLOTS)) {
      reject('requires slot ' + slot, f => { delete f.clubs.brackenport[slot]; }, slot);
      reject('rejects null slot ' + slot, f => { f.clubs.brackenport[slot] = null; }, slot);
      if (count > 1) {
        reject('rejects too few ' + slot, f => { f.clubs.brackenport[slot].pop(); }, slot);
        reject('rejects too many ' + slot, f => { f.clubs.brackenport[slot].push({}); }, slot);
        reject('rejects sparse ' + slot, f => { delete f.clubs.brackenport[slot][0]; });
      } else reject('rejects array slot ' + slot, f => { f.clubs.brackenport[slot] = []; }, slot);
    }
    reject('rejects invented fullback slot', f => { f.clubs.brackenport.fb = {}; }, 'unknown key');
    for (const field of IDENTITY) {
      reject('requires player ' + field, f => { delete f.clubs.brackenport.qb[field]; }, field);
      for (const bad of ['', ' ', null, false, 17, [], {}]) {
        if (field === 'age') continue;
        reject('rejects malformed ' + field + ' ' + JSON.stringify(bad), f => { f.clubs.brackenport.qb[field] = bad; }, field);
      }
    }
    for (const age of [20, 37, 21.5, '21', null, true]) reject('rejects age ' + age, f => { f.clubs.brackenport.qb.age = age; }, '.age');
    for (const age of [21, 36]) accept('accepts boundary age ' + age, f => { f.clubs.brackenport.qb.age = age; });
    reject('rejects duplicate ID across clubs', f => { f.clubs.millrace.qb.id = f.clubs.brackenport.qb.id; }, 'duplicate player ID');
    reject('rejects duplicate ID within a club', f => { f.clubs.brackenport.line[0].id = f.clubs.brackenport.qb.id; }, 'duplicate player ID');
    reject('rejects unknown rating key', f => { f.clubs.brackenport.qb.accuracy = 70; }, 'unknown key');
    reject('rejects a nested ratings wrapper', f => { f.clubs.brackenport.qb.ratings = { throw: 70 }; }, 'unknown key');
    for (const bad of [91, 34, 60.5, '60', null, true, NaN, Infinity, -Infinity, {}, []]) reject('rejects rating ' + String(bad), f => { f.clubs.brackenport.qb.throw = bad; });
    for (const bound of [35, 90]) accept('accepts boundary rating ' + bound, f => { f.clubs.brackenport.line[1].block = bound; });
    reject('rejects one authored skill', f => { const p = f.clubs.brackenport.line[0]; delete p.tackle; }, '2 to 4');
    reject('rejects five authored skills', f => { Object.assign(f.clubs.brackenport.line[0], { throw: 60, carry: 60, kick: 60 }); }, '2 to 4');
    accept('accepts four authored skills', f => { Object.assign(f.clubs.brackenport.line[0], { speed: 65, carry: 65 }); });
    for (const id of Object.keys(KEPT)) {
      for (let i = 0; i < 6; i++) reject('keeps ' + KEPT[id][i] + ' in its slot', f => { keptPlayers(f.clubs[id])[i].name = 'Different Player'; }, 'kept identity');
      reject('rejects swapped receivers in ' + id, f => { f.clubs[id].wr.reverse(); }, 'kept identity');
      reject('keeps original skills in ' + id, f => { const p = f.clubs[id].qb; delete p.throw; p.cover = 70; }, 'keep authored throw');
    }
    const setBoundary = (f, upper) => {
      const all = players(f.clubs.harrowgate);
      all.forEach((p, i) => {
        const value = i === 0 ? 80 : i === 1 ? 40 : upper ? (i < 14 ? 75 : 76) : 71;
        authored(p).forEach(key => { p[key] = value; });
      });
    };
    accept('accepts club average exactly target minus 2', f => setBoundary(f, false));
    accept('accepts club average exactly target plus 2', f => setBoundary(f, true));
    reject('rejects average just below the boundary without rounding', f => { setBoundary(f, false); f.clubs.harrowgate.wr[0].speed--; }, 'club average');
    reject('rejects average just above the boundary without rounding', f => { setBoundary(f, true); f.clubs.harrowgate.wr[0].speed++; }, 'club average');
    const mixedBoundary = [[84,84,84],[43,43,43],[78,74],[74,75],[75,74,74],[75,74],[75,74],[76,76],[75,76],[76,74],[75,74,76],[74,74,75],[75,74,75],[76,76,76],[76,75,76],[76,76,74],[76,74,74],[75,76,74],[75,76,76],[74,75,75],[75,75,74],[74,76]];
    accept('accepts mixed skill counts at the exact upper boundary without floating drift', f => {
      players(f.clubs.harrowgate).forEach((p, i) => authored(p).forEach((key, j) => { p[key] = mixedBoundary[i][j]; }));
    });
    reject('rejects reversed legacy skill strengths', f => { f.clubs.brackenport.qb.throw = 35; }, 'relative order');
    reject('requires the kicker positional skill', f => { const p = f.clubs.harrowgate.kicker; p.throw = p.kick; delete p.kick; }, 'requires authored kick');
    reject('rejects club average outside tolerance', f => { players(f.clubs.harrowgate).forEach(p => authored(p).forEach(key => { p[key] = 50; })); }, 'club average');
    reject('rejects club without an 80-overall player', f => { players(f.clubs.brackenport).forEach(p => { if (playerOverall(p) >= 80) authored(p).forEach(key => { p[key] = 79; }); }); }, 'at least 80');
    reject('rejects club without a 45-or-lower overall player', f => { players(f.clubs.brackenport).forEach(p => { if (playerOverall(p) <= 45) authored(p).forEach(key => { p[key] = 46; }); }); }, 'at most 45');
    reject('one high skill is not a high-overall player', f => { f.clubs.brackenport.wr[0].speed = 90; f.clubs.brackenport.wr[0].catch = 50; }, 'at least 80');
    reject('rejects enormous sparse arrays promptly', f => { f.clubs.brackenport.line.length = 1000000000; });
    reject('rejects extra array fields', f => { f.clubs.brackenport.line.extra = true; });
    const cyclic = clone(); cyclic.clubs.brackenport.qb.loop = cyclic;
    report('rejects cyclic input without throwing', validate(cyclic).length > 0);
    let called = false; const accessor = clone(); Object.defineProperty(accessor.clubs.brackenport.qb, 'throw', { enumerable: true, get() { called = true; throw new Error('getter'); } });
    report('rejects getters without invoking them', validate(accessor).length > 0 && !called);
    report('all checks leave the source unchanged', JSON.stringify(data) === before);
  }
  return { validate, runChecks, rating, playerOverall, clubSummary };
});

if (typeof module === 'object' && module.exports && typeof require === 'function' && require.main === module) {
  const fs = require('fs'), path = require('path'), vm = require('vm');
  const api = module.exports, file = path.join(__dirname, '../games/lantern-bowl/roster.json');
  let passed = 0, failed = 0;
  const report = (name, ok) => { if (ok) passed++; else { failed++; console.error('FAIL: ' + name); } };
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    api.runChecks(data, report);
    const context = vm.createContext({ window: {} });
    vm.runInContext(fs.readFileSync(__filename, 'utf8'), context, { filename: __filename });
    report('browser export loads without Node, DOM, timers or storage', typeof context.window.LanternRosterChecks?.runChecks === 'function');
    const browserData = vm.runInContext('JSON.parse(' + JSON.stringify(JSON.stringify(data)) + ')', context);
    const browserResults = [];
    context.window.LanternRosterChecks.runChecks(browserData, (name, ok) => browserResults.push([name, ok]));
    report('browser branch runs every check with the same result', browserResults.length === passed + failed - 1 && browserResults.every(([, ok]) => ok));
    const modelContext = vm.createContext({});
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../games/lantern-bowl/model.js'), 'utf8'), modelContext);
    const existing = modelContext.LanternModel.create({ seed: 1 });
    const sourceNames = [], authoredNames = [];
    for (const [id, side] of [['brackenport', 'home'], ['millrace', 'away']]) {
      const old = existing[side], fresh = data.clubs[id];
      sourceNames.push(old.qb.name, old.rb.name, old.wr[0].name, old.wr[1].name, old.te.name, old.kicker);
      authoredNames.push(fresh.qb.name, fresh.rb.name, fresh.wr[0].name, fresh.wr[1].name, fresh.te.name, fresh.kicker.name);
      const oldPlayers = [old.qb, old.rb, old.wr[0], old.wr[1], old.te];
      const newPlayers = [fresh.qb, fresh.rb, fresh.wr[0], fresh.wr[1], fresh.te];
      report(id + ': wider ratings agree with the current baseRoster source', newPlayers.every((p, i) => Object.keys(p).filter(k => !['id', 'name', 'age'].includes(k)).every(k => p[k] === 2 * oldPlayers[i][k] - 58)) && fresh.kicker.kick === 2 * old.kick - 58);
    }
    report('all twelve kept names match the current model in slot order', JSON.stringify(sourceNames) === JSON.stringify(authoredNames));
    for (const [id, club] of Object.entries(data.clubs)) {
      const summary = api.clubSummary(club);
      console.log(id + ': ' + summary.count + ' players | average ' + summary.average.toFixed(4) + ' | low ' + summary.lowest.toFixed(2) + ' | high ' + summary.highest.toFixed(2));
    }
  } catch (error) { report(error.stack || String(error), false); }
  console.log((failed ? 'FAIL' : 'PASS') + ': Lantern Bowl roster — ' + passed + ' passed, ' + failed + ' failed.');
  if (failed) process.exitCode = 1;
}
