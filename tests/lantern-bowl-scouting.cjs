/* LB-G10: standalone data contract, not a game play-caller.
   node tests/lantern-bowl-scouting.cjs [optional-scouting.json]
   References are the checked-out main-derived season.json and playbook.json.
   API: validate(data, season, playbook) -> error strings; parse(text) -> JSON data.

   Shares: runShare is the fraction of calls that run; deepShare is the fraction
   of PASSES that go deep. versus[call] contains additive percentage-point deltas,
   not replacements or multipliers. Adjusted values must stay in the same bands.
   favourites are positive relative preferences with a total of 1, not a second
   run/pass distribution. A future caller can normalize them within the chosen
   run/pass/depth group. The diagnostic below demonstrates that interpretation;
   it is neither runtime integration nor a gameplay balance simulation. */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const CALLS = ['blitz', 'balanced', 'prevent'];
const SHARES = ['runShare', 'deepShare'];
const EPSILON = 1e-12;
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const finite = value => typeof value === 'number' && Number.isFinite(value);

// JSON.parse discards duplicate keys. Catch them before they can hide a typo or
// change a club silently. This scanner only checks structure/duplicates; the
// platform parser remains responsible for JSON grammar and number/string syntax.
function parse(text) {
  if (typeof text !== 'string') throw new TypeError('scouting JSON must be text');
  const result = JSON.parse(text);
  let offset = 0;
  function space() { while (/\s/.test(text[offset] || '') && offset < text.length) offset++; }
  function string() {
    const start = offset++;
    while (offset < text.length) {
      const char = text[offset++];
      if (char === '\\') offset++;
      else if (char === '"') return JSON.parse(text.slice(start, offset));
    }
    throw new SyntaxError('Unterminated JSON string');
  }
  function value(depth) {
    if (depth > 32) throw new SyntaxError('JSON nesting exceeds 32 levels');
    space();
    if (text[offset] === '{') {
      offset++; space(); const seen = new Set();
      if (text[offset] !== '}') while (true) {
        const key = string();
        if (seen.has(key)) throw new SyntaxError('Duplicate JSON key: ' + key);
        seen.add(key); space(); offset++; value(depth + 1); space();
        if (text[offset] !== ',') break;
        offset++; space();
      }
      offset++;
    } else if (text[offset] === '[') {
      offset++; space();
      if (text[offset] !== ']') while (true) {
        value(depth + 1); space();
        if (text[offset] !== ',') break;
        offset++; space();
      }
      offset++;
    } else if (text[offset] === '"') string();
    else { while (offset < text.length && !/[\s,}\]]/.test(text[offset])) offset++; }
  }
  value(0);
  return result;
}

function validate(data, season, playbook) {
  const errors = [];
  const error = (where, message) => errors.push(where + ': ' + message);
  function record(value, fields, where, exact = true) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      error(where, 'must be a plain object'); return false;
    }
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      error(where, 'must be a plain object without inherited fields'); return false;
    }
    let good = true;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string' || (exact && !fields.includes(key))) {
        error(where, 'unknown field ' + String(key)); good = false; continue;
      }
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!own(descriptor, 'value') || !descriptor.enumerable) {
        error(where + '.' + key, 'must be an enumerable data field'); good = false;
      }
    }
    for (const key of fields) if (!own(value, key)) {
      error(where + '.' + key, 'is required'); good = false;
    }
    return good;
  }
  function array(value, min, max, where) {
    if (!Array.isArray(value) || value.length < min || value.length > max) {
      error(where, 'must contain ' + min + (min === max ? '' : ' to ' + max) + ' entries'); return false;
    }
    let good = true;
    for (const key of Reflect.ownKeys(value)) if (key !== 'length' &&
        (typeof key !== 'string' || !/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length)) {
      error(where, 'unknown array field ' + String(key)); good = false;
    }
    for (let i = 0; i < value.length; i++) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
      if (!descriptor || !own(descriptor, 'value') || !descriptor.enumerable) {
        error(where + '[' + i + ']', 'must be an enumerable data item (no sparse arrays)'); good = false;
      }
    }
    return good;
  }
  function range(value, min, max, where, tolerance = 0) {
    const good = finite(value) && value >= min - tolerance && value <= max + tolerance;
    if (!good) error(where, 'must be a finite number from ' + min + ' to ' + max);
    return good;
  }
  try {
    // Inspect only the reference fields used here, without hard-coding opponent
    // IDs or play IDs; the reference files' own suites check their full schemas.
    if (!record(season, ['schemaVersion', 'clubs'], 'season reference', false) || season.schemaVersion !== 1 ||
        !array(season.clubs, 6, 6, 'season reference.clubs')) {
      error('season reference', 'requires schemaVersion 1 and six clubs'); return errors;
    }
    const clubIds = [];
    for (const club of season.clubs) {
      if (!record(club, ['id'], 'season reference.club', false) ||
          typeof club.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(club.id)) {
        error('season reference.club.id', 'must be an ID'); continue;
      }
      clubIds.push(club.id);
    }
    if (clubIds.length !== 6 || new Set(clubIds).size !== 6 || !clubIds.includes('brackenport')) {
      error('season reference', 'requires six distinct IDs including brackenport'); return errors;
    }
    if (!record(playbook, ['schemaVersion', 'plays'], 'playbook reference', false) || playbook.schemaVersion !== 1 ||
        !array(playbook.plays, 1, 100, 'playbook reference.plays')) {
      error('playbook reference', 'requires schemaVersion 1 and a nonempty play list'); return errors;
    }
    const plays = new Map();
    for (const play of playbook.plays) {
      if (!record(play, ['id', 'family'], 'playbook reference.play', false) ||
          typeof play.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(play.id) ||
          !['run', 'pass'].includes(play.family) ||
          (play.family === 'pass' && !['short', 'intermediate', 'deep'].includes(play.depthTier))) {
        error('playbook reference.play', 'requires a valid ID, family and pass depth'); continue;
      }
      if (plays.has(play.id)) error('playbook reference.play', 'duplicate play ID ' + play.id);
      plays.set(play.id, play);
    }
    if (errors.length) return errors;
    const opponents = clubIds.filter(id => id !== 'brackenport');
    if (!record(data, ['schemaVersion', 'clubs'], 'scouting')) return errors;
    if (data.schemaVersion !== 1) error('schemaVersion', 'must be 1');
    if (!record(data.clubs, opponents, 'clubs')) return errors;
    const tops = new Set(); let runLean = false, passLean = false;
    for (const id of opponents) {
      const club = data.clubs[id], here = 'clubs.' + id;
      if (!record(club, ['runShare', 'favourites', 'deepShare', 'versus', 'note'], here)) continue;
      const runOK = range(club.runShare, 0.3, 0.7, here + '.runShare');
      const deepOK = range(club.deepShare, 0, 0.4, here + '.deepShare');
      if (runOK) { runLean ||= club.runShare >= 0.6; passLean ||= club.runShare <= 0.4; }
      if (array(club.favourites, 3, 4, here + '.favourites')) {
        const seen = new Set(); const ranked = []; let sum = 0, weightsOK = true;
        for (let i = 0; i < club.favourites.length; i++) {
          const favourite = club.favourites[i], at = here + '.favourites[' + i + ']';
          if (!record(favourite, ['id', 'weight'], at)) { weightsOK = false; continue; }
          if (typeof favourite.id !== 'string' || !plays.has(favourite.id)) error(at + '.id', 'must exist in playbook.json');
          if (seen.has(favourite.id)) error(at + '.id', 'duplicate favourite');
          seen.add(favourite.id);
          if (!range(favourite.weight, Number.MIN_VALUE, 1, at + '.weight')) weightsOK = false;
          else { sum += favourite.weight; ranked.push(favourite); }
        }
        if (weightsOK) {
          if (Math.abs(sum - 1) > EPSILON) error(here + '.favourites', 'weights must sum to 1');
          ranked.sort((a, b) => b.weight - a.weight);
          if (ranked[0].weight === ranked[1].weight) error(here + '.favourites', 'must have one unambiguous top favourite');
          else if (tops.has(ranked[0].id)) error(here + '.favourites', 'top favourite must differ between clubs');
          else tops.add(ranked[0].id);
        }
      }
      if (record(club.versus, CALLS, here + '.versus')) for (const call of CALLS) {
        const delta = club.versus[call], at = here + '.versus.' + call;
        if (!record(delta, SHARES, at)) continue;
        for (const field of SHARES) {
          if (!range(delta[field], -0.15, 0.15, at + '.' + field)) continue;
          if ((field === 'runShare' && runOK) || (field === 'deepShare' && deepOK)) {
            range(club[field] + delta[field], field === 'runShare' ? 0.3 : 0,
              field === 'runShare' ? 0.7 : 0.4, at + '.' + field + ' adjusted share', EPSILON);
          }
        }
      }
      if (typeof club.note !== 'string' || !club.note.trim() || club.note !== club.note.trim() ||
          Array.from(club.note).length > 140 || /[\r\n\t\x00-\x1f\x7f]/.test(club.note)) {
        error(here + '.note', 'must be one trimmed line of 1 to 140 characters');
      } else {
        if (/\b(blitz|balanced|prevent)\b/i.test(club.note.normalize('NFKC'))) error(here + '.note', 'must not name a defence call');
        if (!/^[^.!?]+[.!?]$/.test(club.note)) error(here + '.note', 'must be one sentence');
      }
    }
    if (!runLean) error('clubs', 'at least one club must lean run (runShare >= 0.6)');
    if (!passLean) error('clubs', 'at least one club must lean pass (runShare <= 0.4)');
  } catch (_) {
    error('scouting or reference', 'must be inspectable plain data');
  }
  return errors;
}

function runChecks(data, season, playbook) {
  let checks = 0, malformed = 0;
  function check(name, assertion) { checks++; assert.ok(assertion, name); }
  const initial = JSON.stringify([data, season, playbook]);
  const clone = value => JSON.parse(JSON.stringify(value));
  check('authored data passes: ' + validate(data, season, playbook).join('; '), validate(data, season, playbook).length === 0);
  function rejects(name, mutate, expected = '') {
    const fixture = clone(data); mutate(fixture);
    const errors = validate(fixture, season, playbook); malformed++;
    check(name, errors.length > 0 && errors.some(message => message.includes(expected)));
  }
  function accepts(name, mutate) {
    const fixture = clone(data); mutate(fixture);
    check(name + ': ' + validate(fixture, season, playbook).join('; '), validate(fixture, season, playbook).length === 0);
  }
  const ids = Object.keys(data.clubs), first = fixture => fixture.clubs[ids[0]];
  for (const bad of [null, undefined, true, 1, 'bad', [], new Date(0), () => {}]) {
    malformed++; check('reject root ' + String(bad), validate(bad, season, playbook).length > 0);
  }
  for (const field of ['schemaVersion', 'clubs']) rejects('missing ' + field, f => { delete f[field]; }, field);
  for (const bad of [0, 2, '1', null, false, NaN, Infinity]) rejects('bad version ' + bad, f => { f.schemaVersion = bad; }, 'schemaVersion');
  rejects('unknown root field', f => { f.extra = 1; }, 'unknown field');
  rejects('exclude home club', f => { f.clubs.brackenport = first(f); }, 'brackenport');
  rejects('unknown club', f => { f.clubs.unknown = first(f); }, 'unknown');
  for (const id of ids) rejects('require ' + id, f => { delete f.clubs[id]; }, id);
  for (const field of ['runShare', 'favourites', 'deepShare', 'versus', 'note']) {
    rejects('missing club ' + field, f => { delete first(f)[field]; }, field);
  }
  rejects('unknown club field', f => { first(f).ratings = {}; }, 'unknown field');
  const shapes = [f => { f.clubs = null; }, f => { f.clubs[ids[0]] = []; }, f => { first(f).favourites = {}; },
    f => { first(f).favourites[0] = null; }, f => { first(f).versus = []; }, f => { first(f).versus.blitz = 0; }];
  shapes.forEach((change, i) => rejects('malformed shape ' + i, change));
  for (const field of SHARES) {
    for (const bad of [null, true, '', '0.4', [], {}, NaN, Infinity, -Infinity]) {
      rejects('bad ' + field + ' type ' + String(bad), f => { first(f)[field] = bad; }, field);
    }
    const [min, max] = field === 'runShare' ? [0.3, 0.7] : [0, 0.4];
    for (const bad of [min - 0.000001, max + 0.000001]) rejects('out of range ' + field, f => { first(f)[field] = bad; }, field);
    for (const edge of [min, max]) accepts('inclusive ' + field + ' ' + edge, f => {
      first(f)[field] = edge;
      for (const call of CALLS) first(f).versus[call][field] = 0;
      // Keep a separate pass-leaning club when this fixture moves Millrace up.
    });
  }
  for (const length of [0, 1, 2, 5]) rejects('favourite count ' + length, f => {
    first(f).favourites = Array.from({ length }, (_, i) => ({ id: playbook.plays[i].id, weight: 1 / length }));
  }, 'entries');
  for (const field of ['id', 'weight']) rejects('favourite requires ' + field, f => { delete first(f).favourites[0][field]; }, field);
  rejects('unknown favourite field', f => { first(f).favourites[0].bias = 1; }, 'unknown field');
  for (const bad of ['no-play', '__proto__', 'constructor', '', null, 1]) rejects('bad favourite ID ' + bad, f => { first(f).favourites[0].id = bad; }, '.id');
  rejects('duplicate favourite ID', f => { first(f).favourites[1].id = first(f).favourites[0].id; }, 'duplicate favourite');
  for (const bad of [0, -0.01, 1.01, null, false, '0.5', NaN, Infinity]) rejects('bad weight ' + bad, f => { first(f).favourites[0].weight = bad; }, 'weight');
  for (const delta of [-0.01, 0.01, 0.00000001]) rejects('weights total is not one ' + delta, f => { first(f).favourites[0].weight += delta; }, 'sum');
  rejects('tied favourite leaders', f => { first(f).favourites = [{id:'quick',weight:0.4},{id:'inside',weight:0.4},{id:'deep',weight:0.2}]; }, 'unambiguous');
  rejects('repeated top favourite', f => { f.clubs.harrowgate.favourites[0].id = 'quick'; }, 'top favourite');
  rejects('no run-leaning club', f => { for (const c of Object.values(f.clubs)) c.runShare = 0.5; }, 'lean run');
  rejects('no pass-leaning club', f => { for (const c of Object.values(f.clubs)) c.runShare = 0.6; }, 'lean pass');
  for (const call of CALLS) {
    rejects('missing ' + call, f => { delete first(f).versus[call]; }, call);
    for (const field of SHARES) {
      rejects('missing ' + call + ' ' + field, f => { delete first(f).versus[call][field]; }, field);
      for (const bad of [-0.150001, 0.150001, '0', null, false, NaN, Infinity]) {
        rejects('bad delta ' + call + ' ' + field + ' ' + bad, f => { first(f).versus[call][field] = bad; }, field);
      }
      for (const edge of [-0.15, 0.15]) accepts('inclusive delta ' + call + ' ' + field + ' ' + edge, f => {
        first(f).runShare = 0.5; first(f).deepShare = 0.2; first(f).versus[call][field] = edge;
      });
    }
  }
  rejects('unknown defence call', f => { first(f).versus.man = {runShare:0,deepShare:0}; }, 'unknown field');
  rejects('unknown delta field', f => { first(f).versus.blitz.weight = 0; }, 'unknown field');
  rejects('adjusted run too low', f => { first(f).runShare = 0.3; first(f).versus.blitz.runShare = -0.01; }, 'adjusted share');
  rejects('adjusted run too high', f => { first(f).runShare = 0.7; first(f).versus.blitz.runShare = 0.01; }, 'adjusted share');
  rejects('adjusted deep below zero', f => { first(f).deepShare = 0; first(f).versus.blitz.deepShare = -0.01; }, 'adjusted share');
  rejects('adjusted deep too high', f => { first(f).deepShare = 0.4; first(f).versus.blitz.deepShare = 0.01; }, 'adjusted share');
  for (const bad of ['', ' ', null, 1, [], 'Two sentences. Another.', 'No ending', ' Line.', 'Line. ', 'A\nline.', 'A\tline.', 'A\0line.', 'x'.repeat(140) + '.']) {
    rejects('bad note ' + JSON.stringify(bad), f => { first(f).note = bad; }, '.note');
  }
  for (const call of CALLS) for (const spelling of [call, call.toUpperCase(), call[0].toUpperCase() + call.slice(1)]) {
    rejects('note must not name ' + spelling, f => { first(f).note = 'They prefer ' + spelling + '.'; }, 'defence call');
  }
  rejects('fullwidth call name', f => { first(f).note = 'They prefer Ｂｌｉｔｚ.'; }, 'defence call');
  accepts('exactly 140 characters', f => { first(f).note = 'A'.repeat(139) + '.'; });
  accepts('unicode characters counted once', f => { first(f).note = '🏈'.repeat(139) + '.'; });
  accepts('lower-ranked weight ties allowed', f => { first(f).favourites = [{id:'quick',weight:0.4},{id:'inside',weight:0.3},{id:'deep',weight:0.3}]; });
  accepts('favourite order is not ranking', f => { for (const c of Object.values(f.clubs)) c.favourites.reverse(); });
  accepts('club order is not identity', f => { f.clubs = Object.fromEntries(Object.entries(f.clubs).reverse()); });
  rejects('sparse favourites', f => { delete first(f).favourites[1]; }, 'sparse');
  rejects('enormous sparse array', f => { first(f).favourites.length = 1e9; }, 'entries');
  rejects('custom array field', f => { first(f).favourites.extra = 1; }, 'unknown array');
  rejects('symbol field', f => { first(f)[Symbol('extra')] = 1; }, 'unknown field');
  rejects('inherited required field', f => {
    const c = first(f), value = c.runShare; delete c.runShare; Object.setPrototypeOf(c, {runShare:value});
  }, 'inherited');
  let getterCalls = 0;
  rejects('getters are rejected unread', f => {
    Object.defineProperty(first(f), 'runShare', {enumerable:true,get(){ getterCalls++; throw new Error('getter ran'); }});
  }, 'data field');
  rejects('array getters are rejected unread', f => {
    Object.defineProperty(first(f).favourites, '0', {enumerable:true,get(){ getterCalls++; throw new Error('getter ran'); }});
  }, 'data item');
  check('no getter executed', getterCalls === 0);
  rejects('hidden required field', f => { Object.defineProperty(first(f), 'note', {enumerable:false}); }, 'data field');
  rejects('cycle is rejected', f => { first(f).versus.blitz = f; });
  const revoked = Proxy.revocable({}, {}); revoked.revoke(); malformed++;
  check('revoked proxy rejection is nonthrowing', validate(revoked.proxy, season, playbook).length > 0);
  function freeze(value) { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
  check('deep-frozen data validates', validate(freeze(clone(data)), freeze(clone(season)), freeze(clone(playbook))).length === 0);
  for (const [name, edit] of [
    ['season missing', refs => { refs[0] = null; }], ['season version', refs => { refs[0].schemaVersion = 2; }],
    ['season duplicate', refs => { refs[0].clubs[1].id = refs[0].clubs[0].id; }],
    ['home missing', refs => { refs[0].clubs[0].id = 'home'; }],
    ['season sparse', refs => { delete refs[0].clubs[1]; }],
    ['playbook missing', refs => { refs[1] = null; }], ['playbook version', refs => { refs[1].schemaVersion = 2; }],
    ['play duplicate', refs => { refs[1].plays[1].id = refs[1].plays[0].id; }],
    ['play removed', refs => { refs[1].plays = refs[1].plays.filter(p => p.id !== 'quick'); }],
    ['play depth', refs => { refs[1].plays.find(p => p.family === 'pass').depthTier = 'unknown'; }],
    ['play family', refs => { refs[1].plays[0].family = 'kick'; }]
  ]) {
    const refs = [clone(season), clone(playbook)]; edit(refs); malformed++;
    check('invalid reference ' + name, validate(data, ...refs).length > 0);
  }
  const renamed = [clone(data), clone(season), clone(playbook)];
  renamed[0].clubs.newclub = renamed[0].clubs.millrace; delete renamed[0].clubs.millrace;
  renamed[1].clubs.find(c => c.id === 'millrace').id = 'newclub';
  renamed[2].plays.find(p => p.id === 'quick').id = 'newplay';
  renamed[0].clubs.newclub.favourites[0].id = 'newplay';
  check('IDs derive from supplied references rather than a copied list', validate(...renamed).length === 0);
  for (const text of ['{', '{"a":1,}', '{"a":1,"a":2}', '{"a":{"b":1,"b":2}}',
    '{"a":[{"b":1,"\\u0062":2}]}', '[NaN]', '[Infinity]', '{"x":undefined}']) {
    malformed++; checks++; assert.throws(() => parse(text), undefined, 'malformed JSON: ' + text);
  }
  check('parser keeps escaped quotes and braces', parse('{"a\\\"b":"{\\\"c\\\":0}","other":[null,true,1]}')['a"b'] === '{"c":0}');
  check('parser keeps JSON round trip', JSON.stringify(parse(JSON.stringify(data))) === JSON.stringify(data));

  // Deterministic stratified decision grid: exact authored hundredth shares,
  // no PRNG and no engine. Deep is conditional on passing, never on all snaps.
  // Every favourite pool in the authored data supports this diagnostic; that
  // extra coverage is a data check, not a new requirement for arbitrary files.
  const byId = new Map(playbook.plays.map(play => [play.id, play]));
  const rows = [];
  for (const [id, club] of Object.entries(data.clubs)) {
    for (const call of CALLS) {
      const run = club.runShare + club.versus[call].runShare;
      const deep = club.deepShare + club.versus[call].deepShare;
      const expected = [run, (1 - run) * (1 - deep), (1 - run) * deep];
      check(id + '/' + call + ' probabilities sum to 1', Math.abs(expected.reduce((a,b)=>a+b,0) - 1) < EPSILON);
      const counts = [0, 0, 0];
      for (let a = 0; a < 100; a++) for (let b = 0; b < 100; b++) {
        counts[(a + 0.5) / 100 < run ? 0 : (b + 0.5) / 100 < deep ? 2 : 1]++;
      }
      counts.forEach((count, bucket) => check(id + '/' + call + ' grid share ' + bucket, Math.abs(count / 10000 - expected[bucket]) < EPSILON));
      const poolTotals = [0, 0, 0];
      for (const favourite of club.favourites) {
        const play = byId.get(favourite.id), bucket = play.family === 'run' ? 0 : play.depthTier === 'deep' ? 2 : 1;
        poolTotals[bucket] += favourite.weight;
      }
      check(id + '/' + call + ' authored favourites cover each positive bucket', expected.every((share, i) => share === 0 || poolTotals[i] > 0));
      let total = 0;
      for (const favourite of club.favourites) {
        const play = byId.get(favourite.id), bucket = play.family === 'run' ? 0 : play.depthTier === 'deep' ? 2 : 1;
        const probability = expected[bucket] * favourite.weight / poolTotals[bucket]; total += probability;
        check(id + '/' + call + '/' + play.id + ' diagnostic weight is a probability', probability >= 0 && probability <= 1);
      }
      check(id + '/' + call + ' normalized favourites preserve total', Math.abs(total - 1) < EPSILON);
      rows.push({club:id,call,run:Number(run.toFixed(2)),deepAmongPasses:Number(deep.toFixed(2)),deepOverall:Number(expected[2].toFixed(4))});
    }
    check(id + ' changes by defensive call', new Set(CALLS.map(call => JSON.stringify(club.versus[call]))).size === 3);
  }
  for (const call of ['blitz', 'prevent']) check('opponents respond differently to ' + call,
    new Set(Object.values(data.clubs).map(club => JSON.stringify(club.versus[call]))).size === 5);
  check('no mutation of data or references', JSON.stringify([data, season, playbook]) === initial);
  check('deterministic validation', JSON.stringify(validate(data, season, playbook)) === JSON.stringify(validate(data, season, playbook)));
  return {checks, malformed, rows};
}

module.exports = Object.freeze({parse, validate, runChecks});
if (require.main === module) {
  try {
    const read = name => parse(fs.readFileSync(path.join(__dirname, '../games/lantern-bowl/', name), 'utf8'));
    const data = process.argv[2] ? parse(fs.readFileSync(process.argv[2], 'utf8')) : read('scouting.json');
    const result = runChecks(data, read('season.json'), read('playbook.json'));
    console.log('LB-G10: ' + result.checks + ' checks passed; ' + result.malformed + ' malformed cases rejected.');
    console.log('15 deterministic 10,000-call diagnostic grids passed; no game engine or save integration.');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error('FAIL LB-G10: ' + error.message); process.exitCode = 1;
  }
}
