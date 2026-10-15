/* LB-G11: data-only weekly choices and a deterministic reference simulation.
   Run: node tests/lantern-bowl-training.cjs [training.json]
   No engine, storage, fatigue implementation, save field or browser dependency.

   Integration notes for Side Games Dev Lead (this is not runtime wiring):
   - One focus per week, once per matching player, not once per named rating.
     rest has no ratings/XP; recovery:true is only a future fatigue marker.
   - Match XP and bonus XP use the SAME player pool and progression.json costs.
     A match precedes the week's training. Whichever award completes a level
     chooses one eligible skill: all nine hydrated skills for a match; the intersection
     of authored skills and focus.ratings for training. No per-skill XP bank.
     A remainder stays in the shared pool, so a later match may finish it.
     Capped targets still consume a level; no spill into unrelated skills.
   - This allocation order is an explicit reference convention for integration,
     not a newly imposed runtime/save contract. Future player choice stays with
     the Dev Lead. A focus never multiplies the existing event XP.
   - Roster slots are 22 per club (LB-G1's Director correction), not the separate
     LB-G3 synthetic 23-player fixture. Missing skills read as 50. Some authored
     veteran skills exceed the CURRENT-age potential cap; the simulation COPY
     is clamped at entry, with every adjustment reported, never the roster file.
   - Every gained level adds levelUp to ONE eligible rating, clips to age cap,
     consumes its next-level cost and keeps remainder. The terminal level drops
     later XP. After 10 games, age by LB-G3's exact old-age-change/new-age-cap rule.
   - Paired runs reuse the same per-player match events and per-level skill draw.
     Focus benefit is compared with that SAME player's unfocused counterfactual,
     never with a different role's naturally different match workload.
   - This is a synthetic training measurement, not match-engine balance evidence.
*/
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Progression = require('./lantern-bowl-progression.cjs');
const Roster = require('./lantern-bowl-roster.cjs');
const RATINGS = Object.freeze(['throw', 'catch', 'speed', 'carry', 'block', 'rush', 'cover', 'tackle', 'kick']);
const GROUPS = Object.freeze(['qb', 'rb', 'wr', 'te', 'line', 'front', 'backers', 'secondary', 'kicker']);
const IDS = Object.freeze(['passing', 'running', 'blocking', 'pass-rush', 'coverage', 'kicking', 'rest']);
const EVENTS = Object.freeze(['start', 'touchdown', 'catch', 'sack', 'tackle', 'madeKick', 'win']);
const SEED = 0x1b071a11;
const own = (v, k) => Object.prototype.hasOwnProperty.call(v, k);
const clone = v => JSON.parse(JSON.stringify(v));
const mean = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
const band = (bands, age) => bands.find(b => b.throughAge === null || age <= b.throughAge);
const cap = (p, age) => Math.min(p.ceiling, band(p.potential, age).cap);
const clamp = (value, p, age) => Math.max(p.floor, Math.min(value, cap(p, age)));
const playersIn = group => Array.isArray(group) ? group : [group];
const describe = value => typeof value === 'string' ? JSON.stringify(value) : value === null ? 'null' : typeof value;

// Copy descriptor values only: no getters, toJSON hooks, inherited methods,
// cycles, symbols, sparse/extended arrays or prototype-bearing class instances.
// Bounds stop malformed direct-JavaScript inputs before semantic traversal.
function plainCopy(input) {
  let nodes = 0;
  const seen = new Set();
  function visit(value, at, depth) {
    if (++nodes > 12000 || depth > 12) throw new TypeError(at + ': JSON structure is too large');
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'object' || value === null) throw new TypeError(at + ': must be finite JSON data');
    if (seen.has(value)) throw new TypeError(at + ': cycle or repeated object');
    seen.add(value);
    const array = Array.isArray(value), proto = Object.getPrototypeOf(value);
    if (array ? proto !== Array.prototype : proto !== null && proto !== Object.prototype) throw new TypeError(at + ': must be plain JSON data');
    const keys = Reflect.ownKeys(value), result = array ? [] : Object.create(null);
    if (array && (value.length > 1000 || keys.length !== value.length + 1)) throw new TypeError(at + ': sparse, extended or oversized array');
    for (const key of keys) {
      if (array && key === 'length') continue;
      if (typeof key !== 'string' || (array && (!/^(0|[1-9][0-9]*)$/.test(key) || +key >= value.length))) throw new TypeError(at + ': invalid JSON key');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor.enumerable || !own(descriptor, 'value')) throw new TypeError(at + ': requires enumerable data fields');
      result[key] = visit(descriptor.value, at + '.' + key, depth + 1);
    }
    return result;
  }
  return visit(input, 'input', 0);
}

// JSON.parse alone silently accepts duplicate names. This small bounded parser
// rejects them, including names that become identical after Unicode unescaping.
function parseStrict(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text, 'utf8') > 262144) throw new TypeError('JSON text must be at most 256 KiB');
  let i = 0, nodes = 0;
  const fail = message => { throw new SyntaxError(message + ' at offset ' + i); };
  const space = () => { while (/[\x20\t\r\n]/.test(text[i] || '\0')) i++; };
  function string() {
    const start = i++;
    while (i < text.length) {
      const c = text[i++];
      if (c === '"') return JSON.parse(text.slice(start, i));
      if (c === '\\') i++;
    }
    fail('Unterminated string');
  }
  function value(depth) {
    if (++nodes > 12000 || depth > 12) fail('JSON structure is too large');
    space();
    if (text[i] === '"') return string();
    if (text[i] === '{') {
      i++; space(); const result = Object.create(null);
      if (text[i] === '}') { i++; return result; }
      while (true) {
        space(); if (text[i] !== '"') fail('Expected object key');
        const key = string();
        if (own(result, key)) fail('Duplicate key ' + key);
        space(); if (text[i++] !== ':') fail('Expected colon');
        result[key] = value(depth + 1); space();
        if (text[i] === '}') { i++; return result; }
        if (text[i++] !== ',') fail('Expected comma');
      }
    }
    if (text[i] === '[') {
      i++; space(); const result = [];
      if (text[i] === ']') { i++; return result; }
      while (true) {
        if (result.length >= 1000) fail('Array is too large');
        result.push(value(depth + 1)); space();
        if (text[i] === ']') { i++; return result; }
        if (text[i++] !== ',') fail('Expected comma');
      }
    }
    for (const [token, result] of [['true', true], ['false', false], ['null', null]]) {
      if (text.startsWith(token, i)) { i += token.length; return result; }
    }
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i));
    if (match) {
      i += match[0].length;
      const number = Number(match[0]);
      if (!Number.isFinite(number)) fail('Number must be finite');
      return number;
    }
    fail('Expected JSON value');
  }
  const result = value(0); space();
  if (i !== text.length) fail('Unexpected trailing text');
  return result;
}

function validate(input, progression, roster) {
  const errors = [];
  let data, p, r;
  try { data = plainCopy(input); p = plainCopy(progression); r = plainCopy(roster); }
  catch (error) { return [error.message]; }
  const bad = (at, message) => errors.push(at + ': ' + message);
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  function fields(v, names, at) {
    if (!object(v)) { bad(at, 'must be an object'); return false; }
    for (const key of Object.keys(v)) if (!names.includes(key)) bad(at + '.' + key, 'unknown field');
    for (const key of names) if (!own(v, key)) bad(at + '.' + key, 'is required');
    return true;
  }
  function list(v, allowed, min, max, at) {
    if (!Array.isArray(v) || v.length < min || v.length > max) { bad(at, 'must contain ' + min + ' to ' + max + ' entries'); return false; }
    if (new Set(v).size !== v.length) bad(at, 'duplicate entry');
    for (const item of v) if (!allowed.includes(item)) bad(at, 'unknown value ' + describe(item));
    return v.every(item => allowed.includes(item));
  }
  for (const message of Progression.validate(p)) bad('progression', message);
  for (const message of Roster.validate(r)) bad('roster', message);
  if (errors.length) return errors;
  if (!fields(data, ['schemaVersion', 'focuses'], 'training')) return errors;
  if (data.schemaVersion !== 1) bad('schemaVersion', 'must be 1');
  if (!Array.isArray(data.focuses) || data.focuses.length !== IDS.length) { bad('focuses', 'must contain all seven choices exactly once'); return errors; }
  const seen = new Set(), labels = new Set();
  data.focuses.forEach((f, i) => {
    const at = 'focuses[' + i + ']', rest = object(f) && f.id === 'rest';
    if (!fields(f, ['id', 'label', 'detail', 'ratings', 'bonusXp', 'appliesTo'].concat(rest ? ['recovery'] : []), at)) return;
    if (!IDS.includes(f.id)) bad(at + '.id', 'unknown focus');
    if (seen.has(f.id)) bad(at + '.id', 'duplicate focus');
    seen.add(f.id);
    if (typeof f.label !== 'string' || !/^[A-Z][A-Za-z -]*$/.test(f.label) || f.label.trim() !== f.label || f.label.length > 20) bad(at + '.label', 'must be a capitalised label of 1 to 20 characters');
    if (labels.has(f.label)) bad(at + '.label', 'duplicate label');
    labels.add(f.label);
    if (typeof f.detail !== 'string' || !/^[A-Z][^.!?\n\r\x00-\x1f<>]*[.!?]$/.test(f.detail) || f.detail.length > 200) bad(at + '.detail', 'must be one plain sentence of at most 200 characters');
    const validRatings = list(f.ratings, RATINGS, rest ? 0 : 1, rest ? 0 : 3, at + '.ratings');
    const validGroups = list(f.appliesTo, GROUPS, 1, GROUPS.length, at + '.appliesTo');
    if (!Number.isSafeInteger(f.bonusXp) || (rest ? f.bonusXp !== 0 : f.bonusXp < 1 || f.bonusXp > 4)) bad(at + '.bonusXp', rest ? 'rest must give zero XP' : 'must be an integer from 1 to 4');
    if (rest) {
      if (f.recovery !== true) bad(at + '.recovery', 'rest must mark recovery true');
      if (validGroups && GROUPS.some(g => !f.appliesTo.includes(g))) bad(at + '.appliesTo', 'rest must cover the whole roster');
    } else if (validRatings && validGroups) {
      // Every named group can use at least one target; every target is authored
      // by at least one matching player. A QB's omitted catch is not invented.
      for (const [clubId, club] of Object.entries(r.clubs)) for (const group of f.appliesTo) {
        if (!own(club, group)) { bad(at + '.appliesTo', 'missing roster group ' + group); continue; }
        for (const player of playersIn(club[group])) if (!f.ratings.some(k => own(player, k))) bad(at + '.ratings', 'no authored target for ' + clubId + '/' + group);
      }
      for (const key of f.ratings) if (!Object.values(r.clubs).some(club => f.appliesTo.some(group => playersIn(club[group]).some(player => own(player, key))))) bad(at + '.ratings', 'target not authored by a matching player: ' + key);
    }
  });
  for (const id of IDS) if (!seen.has(id)) bad('focuses', 'missing focus ' + id);
  return errors;
}

function random(seed) {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new TypeError('seed must be a uint32');
  let state = seed;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
function fixture(p, r) {
  const players = [], adjustments = [];
  for (const [club, groups] of Object.entries(r.clubs)) for (const group of GROUPS) for (const source of playersIn(groups[group])) {
    const ratings = {}, authored = RATINGS.filter(k => own(source, k));
    for (const key of RATINGS) {
      const before = own(source, key) ? source[key] : 50;
      ratings[key] = clamp(before, p, source.age);
      if (ratings[key] !== before) adjustments.push({ id: source.id, key, from: before, to: ratings[key] });
    }
    players.push({ id: source.id, club, group, age: source.age, level: 0, xp: 0, ratings, authored });
  }
  return { players, adjustments };
}
function award(player, xp, keys, p, draws, phase, trace) {
  player.xp += xp;
  while (player.level < p.levels.length && player.xp >= p.levels[player.level]) {
    const cost = p.levels[player.level], draw = draws[player.level];
    player.xp -= cost; player.level++;
    const eligible = keys.filter(key => player.ratings[key] < cap(p, player.age));
    const key = eligible.length ? eligible[Math.floor(draw * eligible.length)] : null;
    const before = key ? player.ratings[key] : null;
    if (key) player.ratings[key] = clamp(before + p.levelUp, p, player.age);
    trace.push({ level: player.level, phase, key, gain: key ? player.ratings[key] - before : 0, cost });
  }
  if (player.level === p.levels.length) player.xp = 0;
}
function agePlayer(player, p) {
  for (const key of RATINGS) player.ratings[key] = clamp(player.ratings[key] + band(p.aging, player.age).change, p, player.age);
  player.age++;
  for (const key of RATINGS) player.ratings[key] = clamp(player.ratings[key], p, player.age);
}
function eventsFor(group, win, rng) {
  const e = { start: 1, touchdown: 0, catch: 0, sack: 0, tackle: 0, madeKick: 0, win: +win };
  const a = rng(), b = rng();
  if (group === 'qb') e.touchdown = Math.floor(a * 3);
  if (group === 'rb') e.touchdown = +(a < 0.4);
  if (group === 'wr' || group === 'te') { e.catch = 2 + Math.floor(a * 3); e.touchdown = +(b < 0.25); }
  if (['front', 'backers', 'secondary'].includes(group)) { e.tackle = 2 + Math.floor(a * 5); e.sack = +(b < 0.3); }
  if (group === 'kicker') e.madeKick = 1 + Math.floor(a * 3);
  return e;
}

function simulate(training, progression, roster, focusId, seed = SEED) {
  const errors = validate(training, progression, roster);
  if (errors.length) throw new TypeError(errors.join('; '));
  if (!IDS.includes(focusId)) throw new TypeError('unknown focus ' + describe(focusId));
  const rng = random(seed), data = plainCopy(training), p = plainCopy(progression), r = plainCopy(roster);
  const focus = data.focuses.find(f => f.id === focusId), initial = fixture(p, r);
  const baseline = clone(initial.players), trained = clone(initial.players), logs = initial.players.map(() => []), baseLogs = initial.players.map(() => []);
  const draws = initial.players.map(() => p.levels.map(() => rng()));
  const snapshots = [{ week: 0, phase: 'initial', baseline: clone(baseline), trained: clone(trained) }];
  const bonus = initial.players.map(() => 0), matchXp = initial.players.map(() => 0), events = [];
  for (let week = 1; week <= 10; week++) {
    const wins = Object.fromEntries(Object.keys(r.clubs).map(id => [id, rng() < 0.5]));
    events.push([]);
    for (let i = 0; i < trained.length; i++) {
      const a = baseline[i], b = trained[i], e = eventsFor(b.group, wins[b.club], rng);
      const earned = EVENTS.reduce((sum, key) => sum + e[key] * p.xp[key], 0);
      events[week - 1].push(e); matchXp[i] += earned;
      award(a, earned, RATINGS, p, draws[i], 'match', baseLogs[i]);
      award(b, earned, RATINGS, p, draws[i], 'match', logs[i]);
    }
    snapshots.push({ week, phase: 'match', baseline: clone(baseline), trained: clone(trained) });
    for (let i = 0; i < trained.length; i++) {
      const b = trained[i], matches = focus.appliesTo.includes(b.group);
      if (matches && focus.bonusXp) {
        bonus[i] += focus.bonusXp;
        award(b, focus.bonusXp, focus.ratings.filter(k => b.authored.includes(k)), p, draws[i], 'training', logs[i]);
      }
    }
    snapshots.push({ week, phase: 'training', baseline: clone(baseline), trained: clone(trained) });
  }
  for (const player of baseline.concat(trained)) agePlayer(player, p);
  snapshots.push({ week: 10, phase: 'birthday', baseline: clone(baseline), trained: clone(trained) });
  const rows = trained.map((player, i) => ({ id: player.id, group: player.group, matches: focus.bonusXp > 0 && focus.appliesTo.includes(player.group), bonusXp: bonus[i], matchXp: matchXp[i], extraLevels: player.level - baseline[i].level, targetedGain: focus.ratings.reduce((sum, k) => sum + player.ratings[k] - baseline[i].ratings[k], 0), trainingLevels: logs[i].filter(e => e.phase === 'training').length, trainingSkillGain: logs[i].filter(e => e.phase === 'training').reduce((sum, e) => sum + e.gain, 0) }));
  const matches = rows.filter(row => row.matches), others = rows.filter(row => !row.matches);
  return { focus: focusId, seed, adjustments: initial.adjustments, events, rows, baseline, trained, logs, baseLogs, snapshots,
    summary: { matchingPlayers: matches.length, meanBonusXp: mean(matches.map(p => p.bonusXp)), meanExtraLevels: mean(matches.map(p => p.extraLevels)), maxExtraLevels: Math.max(0, ...rows.map(p => p.extraLevels)), meanTargetedGain: mean(matches.map(p => p.targetedGain)), meanUnfocusedExtraLevels: mean(others.map(p => p.extraLevels)) } };
}

function runChecks(training, p, r) {
  let checks = 0, malformed = 0;
  const check = (name, condition) => { checks++; assert.ok(condition, name); };
  const same = (name, actual, expected) => { checks++; assert.deepEqual(actual, expected, name); };
  const rejects = (name, edit, reason) => {
    const copy = clone(training); edit(copy); const errors = validate(copy, p, r);
    malformed++; check(name + ': ' + errors.join('; '), errors.some(e => e.includes(reason)));
  };
  same('valid training data', validate(training, p, r), []);
  const before = JSON.stringify([training, p, r]), results = IDS.map(id => simulate(training, p, r, id));
  const rosterCount = Object.values(r.clubs).reduce((sum, club) => sum + GROUPS.reduce((n, g) => n + playersIn(club[g]).length, 0), 0);
  for (const result of results) {
    const focus = training.focuses.find(f => f.id === result.focus), rest = focus.id === 'rest';
    check(focus.id + ' simulates all main roster players', result.rows.length === rosterCount && rosterCount === 132);
    check(focus.id + ' has ten match/training weeks plus birthday', result.snapshots.length === 22);
    same(focus.id + ' deterministic', simulate(training, p, r, focus.id), result);
    for (const snapshot of result.snapshots) for (const player of snapshot.baseline.concat(snapshot.trained)) {
      check(focus.id + ' bounds at ' + snapshot.phase, RATINGS.every(k => Number.isInteger(player.ratings[k]) && player.ratings[k] >= p.floor && player.ratings[k] <= cap(p, player.age)));
      check(focus.id + ' XP remainder and level are valid', player.level >= 0 && player.level <= p.levels.length && player.xp >= 0 && (player.level === p.levels.length ? player.xp === 0 : player.xp < p.levels[player.level]));
    }
    result.rows.forEach((row, i) => {
      check(row.id + ' bounded benefit', row.extraLevels >= 0 && row.extraLevels <= 1);
      check(row.id + ' award once per week', row.bonusXp === (row.matches ? 10 * focus.bonusXp : 0));
      const ledgerXp = result.logs[i].reduce((sum, e) => sum + e.cost, 0) + result.trained[i].xp;
      check(row.id + ' XP conservation', ledgerXp === row.matchXp + row.bonusXp);
      if (!row.matches) same(row.id + ' unaffected group', result.trained[i], result.baseline[i]);
      for (const event of result.logs[i]) {
        check(row.id + ' single-skill clipped gain', event.gain >= 0 && event.gain <= p.levelUp && (event.key === null) === (event.gain === 0));
        if (event.phase === 'training' && event.key) check(row.id + ' training targets only named authored skills', focus.ratings.includes(event.key) && result.trained[i].authored.includes(event.key));
      }
    });
    if (rest) {
      same('rest leaves progression identical', result.trained, result.baseline);
      check('rest carries only a future recovery marker', focus.recovery === true && result.rows.every(row => row.bonusXp === 0));
    } else {
      check(focus.id + ' focused players gain more levels on average than their counterfactual', result.summary.meanExtraLevels > 0);
      check(focus.id + ' focused target skills gain on average', result.summary.meanTargetedGain > 0);
      check(focus.id + ' no unselected group benefit', result.summary.meanUnfocusedExtraLevels === 0);
      for (const group of focus.appliesTo) {
        const members = result.rows.filter(row => row.group === group);
        check(focus.id + '/' + group + ' gains extra levels on average', mean(members.map(row => row.extraLevels)) > 0);
        check(focus.id + '/' + group + ' gains named skills on average', mean(members.map(row => row.targetedGain)) > 0);
      }
    }
  }
  // Counterfactual event tapes do not drift when a focus changes level counts.
  for (const result of results) same(result.focus + ' same event tape', result.events, results[0].events);
  check('at least one inherited veteran rating is explicitly clamped on a copy', results[0].adjustments.length > 0);
  // All valid uint32 seed boundaries and several independent seasons.
  for (const seed of [0, 1, 42, 0xffffffff, 271828, 314159]) for (const id of IDS) {
    const result = simulate(training, p, r, id, seed);
    check(id + ' alternative seed bounded benefit', result.rows.every(row => row.extraLevels >= 0 && row.extraLevels <= 1));
    check(id + ' alternative seed never escapes caps', result.snapshots.every(s => s.trained.every(player => RATINGS.every(k => player.ratings[k] >= p.floor && player.ratings[k] <= cap(p, player.age)))));
  }
  // Analytical cost oracle: ten 2-XP sessions cannot cross two thresholds.
  // Check every reachable total, including immediately below/at each threshold.
  const totalCost = p.levels.reduce((a, b) => a + b, 0), levelAt = xp => { let level = 0; while (level < p.levels.length && xp >= p.levels[level]) xp -= p.levels[level++]; return level; };
  for (const focus of training.focuses) for (let total = 0; total <= totalCost + 1; total++) check(focus.id + ' threshold oracle', levelAt(total + focus.bonusXp * 10) - levelAt(total) <= 1);
  // Direct reference edges: partial cap, exhausted targets, and terminal XP.
  const edge = { id: 'edge', age: 30, level: 0, xp: p.levels[0] - 1, ratings: Object.fromEntries(RATINGS.map(k => [k, 84])), authored: ['throw', 'speed'] };
  let trace = [];
  award(edge, 2, ['throw'], p, p.levels.map(() => 0), 'training', trace);
  check('partial cap clips +2 to +1', edge.ratings.throw === 85 && edge.ratings.speed === 84 && edge.xp === 1 && edge.level === 1);
  edge.xp = p.levels[1] - 1; trace = [];
  award(edge, 2, ['throw'], p, p.levels.map(() => 0), 'training', trace);
  check('capped target consumes level without unrelated spill', edge.level === 2 && edge.xp === 1 && edge.ratings.speed === 84 && trace[0].key === null);
  edge.level = p.levels.length - 1; edge.xp = p.levels.at(-1) - 1;
  award(edge, 4, ['throw'], p, p.levels.map(() => 0), 'training', []);
  award(edge, 100, ['throw'], p, p.levels.map(() => 0), 'training', []);
  check('terminal level discards overflow and later awards', edge.level === p.levels.length && edge.xp === 0);
  for (const age of [26, 27, 30, 34, 36]) {
    const player = { age, ratings: Object.fromEntries(RATINGS.map(k => [k, cap(p, age)])) };
    const expected = clamp(clamp(cap(p, age) + band(p.aging, age).change, p, age), p, age + 1);
    agePlayer(player, p); check('birthday boundary ' + age, player.age === age + 1 && RATINGS.every(k => player.ratings[k] === expected));
  }

  rejects('wrong schema', v => { v.schemaVersion = 2; }, 'schemaVersion');
  rejects('unknown root field', v => { v.save = {}; }, 'unknown field');
  for (const field of ['schemaVersion', 'focuses']) rejects('missing ' + field, v => { delete v[field]; }, 'required');
  for (const value of [null, {}, 'seven', [], [1], new Array(8).fill(null)]) rejects('invalid focus list', v => { v.focuses = value; }, 'seven');
  for (let i = 0; i < training.focuses.length; i++) {
    const rest = training.focuses[i].id === 'rest';
    for (const field of Object.keys(training.focuses[i])) rejects('missing focus field ' + i + '/' + field, v => { delete v.focuses[i][field]; }, 'required');
    rejects('unknown focus field ' + i, v => { v.focuses[i].save = 1; }, 'unknown field');
    rejects('unknown focus ID ' + i, v => { v.focuses[i].id = 'unknown'; }, 'unknown focus');
    rejects('duplicate focus ID ' + i, v => { v.focuses[i].id = v.focuses[(i + 1) % 7].id; }, 'duplicate focus');
    for (const value of ['', 'x'.repeat(21), ' passing ', 'Passing\n', 5, null]) rejects('bad label ' + i, v => { v.focuses[i].label = value; }, '.label');
    for (const value of ['', 'No ending', 'Two. Sentences.', 'Line\nbreak.', '<b>Markup</b>.', 5, null]) rejects('bad detail ' + i, v => { v.focuses[i].detail = value; }, '.detail');
    for (const value of [-1, 0.5, '2', true, null, 5, NaN, Infinity]) rejects('bad XP ' + i, v => { v.focuses[i].bonusXp = value; }, Number.isFinite(value) || typeof value !== 'number' ? '.bonusXp' : 'finite JSON');
    for (const value of [null, {}, [], ['unknown'], ['qb', 'qb'], [{}], [[]], [null], [true], [1]]) rejects('bad appliesTo ' + i, v => { v.focuses[i].appliesTo = value; }, '.appliesTo');
    for (const value of [null, {}, ['unknown'], ['throw', 'throw'], ['throw', 'catch', 'speed', 'carry'], [{}], [[]], [null], [true], [1]]) rejects('bad ratings ' + i, v => { v.focuses[i].ratings = value; }, '.ratings');
    if (rest) {
      rejects('rest earns XP', v => { v.focuses[i].bonusXp = 1; }, 'zero XP');
      rejects('rest trains a rating', v => { v.focuses[i].ratings = ['throw']; }, '.ratings');
      rejects('rest recovery false', v => { v.focuses[i].recovery = false; }, 'recovery');
      rejects('rest omits a group', v => { v.focuses[i].appliesTo.pop(); }, 'whole roster');
    } else {
      rejects('active zero XP ' + i, v => { v.focuses[i].bonusXp = 0; }, '.bonusXp');
      rejects('active missing ratings ' + i, v => { v.focuses[i].ratings = []; }, '.ratings');
      rejects('active recovery field ' + i, v => { v.focuses[i].recovery = true; }, 'unknown field');
    }
  }
  rejects('group has no authored target', v => { v.focuses[0].appliesTo = ['kicker']; }, 'no authored target');
  rejects('unused named target', v => { v.focuses[0].ratings.push('kick'); }, 'target not authored');
  for (const value of [null, [], 0, 'training']) { malformed++; check('bad root rejected', validate(value, p, r).length > 0); }
  let getterReads = 0;
  const evil = clone(training); Object.defineProperty(evil.focuses[0], 'bonusXp', { enumerable: true, get() { getterReads++; throw Error('getter ran'); } });
  malformed++; check('getter rejected without reading', validate(evil, p, r).length > 0 && getterReads === 0);
  const direct = [
    v => { v.focuses[0].extra = v; },
    v => { v.focuses[0].ratings.length = 1000000; },
    v => { v.focuses[0].ratings.extra = 'x'; },
    v => { delete v.focuses[0].ratings[0]; },
    v => { v.focuses[0][Symbol('extra')] = 1; },
    v => { Object.defineProperty(v.focuses[0], 'label', { value: 'Passing', enumerable: false }); },
    v => { Object.setPrototypeOf(v.focuses[0], { id: 'passing' }); },
    v => { Object.setPrototypeOf(v.focuses, { map() { throw Error('called'); } }); },
    v => { v.focuses[0].bonusXp = 1n; },
    v => { v.focuses[0].bonusXp = undefined; },
    v => { v.focuses[0].bonusXp = () => 2; }
  ];
  for (const edit of direct) { const value = clone(training); edit(value); malformed++; check('non-JSON object rejected', validate(value, p, r).length > 0); }
  const revoked = Proxy.revocable({}, {}); revoked.revoke(); malformed++; check('revoked proxy safely rejected', validate(revoked.proxy, p, r).length > 0);
  const frozen = clone(training); Object.freeze(frozen); Object.freeze(frozen.focuses); Object.freeze(frozen.focuses[0]);
  same('frozen data works without mutation', simulate(frozen, p, r, 'passing'), results[0]);
  same('null-prototype parsed JSON accepted', validate(parseStrict(JSON.stringify(training)), p, r), []);
  const badJson = ['{"a":1,"a":2}', '{"a":1,"\\u0061":2}', '{"a":{"b":1,"b":2}}', '{"x":NaN}', '{"x":1e400}', '{"x":01}', '[1,]', '{"x":1,}', '{} trailing', '{"x":"bad\nline"}', '[', '/* comment */{}'];
  for (const text of badJson) { malformed++; checks++; assert.throws(() => parseStrict(text), undefined, 'malformed JSON rejected'); }
  const badProgression = clone(p); badProgression.levels[0] = 0;
  check('malformed progression rejected', validate(training, badProgression, r).some(e => e.startsWith('progression:')));
  const badRoster = clone(r); badRoster.clubs.brackenport.qb.throw = 100;
  check('malformed roster rejected', validate(training, p, badRoster).some(e => e.startsWith('roster:')));
  for (const seed of [-1, 0x100000000, 1.5, NaN, '1', null]) { checks++; assert.throws(() => simulate(training, p, r, 'passing', seed), /uint32/); }
  for (const id of ['', 'rested', null, {}, Object.create(null), '__proto__']) { checks++; assert.throws(() => simulate(training, p, r, id), /unknown focus/); }
  same('inputs remain unchanged', JSON.stringify([training, p, r]), before);
  return { checks, malformed, results };
}

module.exports = Object.freeze({ validate, simulate, parseStrict, runChecks, seed: SEED });
if (require.main === module) {
  try {
    const root = path.join(__dirname, '../games/lantern-bowl');
    const training = parseStrict(fs.readFileSync(process.argv[2] || path.join(root, 'training.json'), 'utf8'));
    const p = parseStrict(fs.readFileSync(path.join(root, 'progression.json'), 'utf8'));
    const r = parseStrict(fs.readFileSync(path.join(root, 'roster.json'), 'utf8'));
    const output = runChecks(training, p, r);
    console.log('PASS: ' + output.checks + ' Lantern Bowl training checks; ' + output.malformed + ' malformed cases.');
    console.log('Six main-roster clubs, 132 players; seven paired ten-week seasons; seed ' + SEED + '.');
    console.log('Focus      Players  Extra XP  Mean extra levels  Max  Mean target gain');
    for (const result of output.results) {
      const s = result.summary;
      console.log(result.focus.padEnd(11) + String(s.matchingPlayers).padEnd(9) + s.meanBonusXp.toFixed(0).padEnd(10) + s.meanExtraLevels.toFixed(3).padEnd(19) + String(s.maxExtraLevels).padEnd(5) + s.meanTargetedGain.toFixed(3));
    }
    console.log(output.results[0].adjustments.length + ' inherited ratings clamped in simulation-only copies before the season.');
    console.log('Rest gives no XP; recovery is a marker only. No runtime, fatigue or save integration.');
  } catch (error) { console.error('FAIL Lantern Bowl training: ' + error.message); process.exitCode = 1; }
}
