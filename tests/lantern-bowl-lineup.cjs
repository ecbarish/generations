/* LB-G12 standalone contract checks. Run: node tests/lantern-bowl-lineup.cjs
   Exercises the inactive pure module; this does not wire it into the game. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Lineup = require('../games/lantern-bowl/lineup.js');
const roster = require('../games/lantern-bowl/roster.json');
const playbook = require('../games/lantern-bowl/playbook.json');
const GROUPS = ['qb', 'rb', 'wr', 'te', 'line', 'front', 'backers', 'secondary', 'kicker'];
const SLOTS = { qb: 1, rb: 1, wr: 2, te: 1, line: 5, front: 4, backers: 3, secondary: 4, kicker: 1 };
const OFF = ['qb', 'rb', 'wr', 'te', 'line'];
const DEF = ['front', 'backers', 'secondary'];
const RATINGS = ['throw', 'catch', 'speed', 'carry', 'block', 'rush', 'cover', 'tackle', 'kick'];
const unit = g => OFF.includes(g) ? 'offence' : DEF.includes(g) ? 'defence' : 'special';
const copy = x => JSON.parse(JSON.stringify(x));
const flat = c => GROUPS.flatMap(g => [].concat(c[g]));
const inUnit = (c, groups) => groups.flatMap(g => [].concat(c[g]));
const freeze = x => { if (x && typeof x === 'object') { for (const value of Object.values(x)) freeze(value); Object.freeze(x); } return x; };
const sortIds = c => GROUPS.map(g => [].concat(c[g]).map(p => p.id));
const weights = { qb: [['throw', 4], ['speed', 1]], rb: [['carry', 3], ['speed', 2], ['catch', 1]], wr: [['catch', 3], ['speed', 2]], te: [['catch', 2], ['block', 2], ['speed', 1]], line: [['block', 4], ['tackle', 1]], front: [['rush', 4], ['tackle', 1], ['speed', 1]], backers: [['tackle', 3], ['cover', 2], ['speed', 1]], secondary: [['cover', 4], ['speed', 2], ['tackle', 1]], kicker: [['kick', 4], ['speed', 1]] };
const rating = (p, key, penalty = 0) => (Object.hasOwn(p, key) ? p[key] : 50) - penalty;
function cmp(group, a, b, pa = 0, pb = 0) {
  const w = weights[group];
  const score = (p, pen) => w.reduce((sum, [key, weight]) => sum + rating(p, key, pen) * weight, 0);
  if (score(a, pa) !== score(b, pb)) return score(b, pb) - score(a, pa);
  for (const [key] of w) if (rating(a, key, pa) !== rating(b, key, pb)) return rating(b, key, pb) - rating(a, key, pa);
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
function runChecks(api = Lineup) {
  let checks = 0, malformed = 0;
  const check = (condition, message) => { checks++; assert.ok(condition, message); };
  const equal = (a, b, message) => { checks++; assert.deepEqual(copy(a), copy(b), message); };
  const rejects = (fn, pattern, message) => { checks++; malformed++; assert.throws(fn, pattern, message); };
  function invariants(s, club, out = []) {
    const source = new Map(GROUPS.flatMap(g => [].concat(club[g]).map(p => [p.id, { p, group: g }])));
    equal(Object.keys(s), GROUPS, 'exact output groups');
    equal(flat(s).length, 22, 'authoritative 22 slots');
    for (const groups of [OFF, DEF, ['kicker']]) {
      const people = inUnit(s, groups);
      equal(new Set(people.map(p => p.id)).size, people.length, 'unique per unit');
    }
    for (const group of GROUPS) {
      const people = [].concat(s[group]);
      equal(people.length, SLOTS[group], group + ' count');
      check(SLOTS[group] === 1 ? !Array.isArray(s[group]) : Array.isArray(s[group]), 'fixed output shape');
      for (let i = 1; i < people.length; i++) check(cmp(group, people[i - 1], people[i], people[i - 1].twoWay ? 5 : 0, people[i].twoWay ? 5 : 0) <= 0, 'best first after substitution');
      for (const p of people) {
        check(source.has(p.id), 'no invented reserve'); check(!out.includes(p.id), 'unavailable ID excluded');
        const original = source.get(p.id);
        equal([p.id, p.name, p.age], [original.p.id, original.p.name, original.p.age], 'identity preserved');
        equal(p.sourceGroup, original.group, 'source group retained');
        equal(p.twoWay, unit(original.group) !== unit(group), 'cross-unit penalty only');
        equal(Object.keys(p.effectiveRatings), RATINGS, 'all effective skills');
        for (const key of RATINGS) {
          equal(Object.hasOwn(p, key), Object.hasOwn(original.p, key), 'sparse authored skill presence preserved');
          if (Object.hasOwn(p, key)) equal(p[key], original.p[key], 'stored rating unchanged');
          equal(p.effectiveRatings[key], rating(original.p, key, p.twoWay ? 5 : 0), 'exact effective rating');
        }
      }
    }
    const n = api.teamNumbers(s);
    const avg = (groups, key) => Math.max(35, Math.min(90, Math.round(inUnit(s, groups).reduce((sum, p) => sum + p.effectiveRatings[key], 0) / inUnit(s, groups).length)));
    equal(n, { line: avg(['line'], 'block'), rush: avg(['front'], 'rush'), cover: avg(['secondary'], 'cover'), tackle: avg(DEF, 'tackle'), kick: avg(['kicker'], 'kick') }, 'independent exact aggregate');
    check(Object.values(n).every(x => Number.isInteger(x) && x >= 35 && x <= 90), 'bounded team numbers');
    const p = api.playbookSlots(s);
    equal(Object.keys(p), ['qb', 'rb', 'wr', 'te'], 'playbook keys');
    for (const group of ['qb', 'rb', 'wr', 'te']) for (let i = 0; i < [].concat(s[group]).length; i++) {
      const e = [].concat(s[group])[i], adapted = [].concat(p[group])[i];
      equal(adapted.id, e.id, 'playbook identity');
      for (const key of RATINGS) equal(adapted[key], e.effectiveRatings[key], 'engine reads effective flat skills');
    }
  }
  const counts = {};
  for (const [clubId, raw] of Object.entries(roster.clubs)) {
    const c = freeze(copy(raw)), before = JSON.stringify(c), s = api.starters(c);
    invariants(s, c);
    equal(new Set(flat(s).map(p => p.id)).size, 22, 'healthy roster has 22 unique players');
    equal(flat(s).filter(p => p.twoWay).length, 0, 'healthy roster has no penalty');
    equal(api.starters(c), s, 'same input same output');
    equal(api.starters(c, { out: [] }), s, 'empty out matches absent options');
    for (const group of ['qb', 'rb', 'te', 'kicker']) equal(s[group].id, c[group].id, 'kept singleton identity');
    equal(s.wr.map(p => p.id), c.wr.map(p => p.id), 'kept receiver slot identities');
    for (const injured of flat(c)) {
      const opts = freeze({ out: [injured.id] }), lineup = api.starters(c, opts);
      invariants(lineup, c, opts.out);
      equal(flat(lineup).filter(p => p.twoWay).length, 1, 'one unavailable creates exactly one two-way entry');
      const group = GROUPS.find(g => [].concat(c[g]).some(p => p.id === injured.id));
      const fill = [].concat(lineup[group]).find(p => p.twoWay);
      const candidates = GROUPS.filter(g => unit(g) !== unit(group)).flatMap(g => [].concat(c[g]));
      equal(fill.id, candidates.slice().sort((a, b) => cmp(group, a, b, 5, 5))[0].id, 'best eligible opposite-unit replacement');
      const originals = flat(lineup).filter(p => p.id === fill.id && !p.twoWay);
      equal(originals.length, 1, 'donor natural entry remains unpenalized');
      equal(api.starters(c, { out: [injured.id, injured.id] }), lineup, 'duplicate out ID is harmless');
      equal(api.starters(c, opts), lineup, 'injury determinism');
    }
    equal(JSON.stringify(c), before, 'frozen source untouched');
    counts[clubId] = api.teamNumbers(s);
    // Every rotating eleven-player survivor set spans extreme positional shortages.
    const all = flat(c);
    for (let start = 0; start < all.length; start++) {
      const keep = new Set(Array.from({ length: 11 }, (_, i) => all[(start + i) % all.length].id));
      const out = all.filter(p => !keep.has(p.id)).map(p => p.id);
      invariants(api.starters(c, { out }), c, out);
    }
    rejects(() => api.starters(c, { out: all.slice(10).map(p => p.id) }), /fewer than 11 eligible players \(10\)/, 'ten eligible impossible');
    rejects(() => api.starters(c, { out: all.map(p => p.id) }), /fewer than 11 eligible players \(0\)/, 'none eligible impossible');
  }
  const base = copy(roster.clubs.brackenport);
  const bench = (id, n) => Object.assign({ id, name: id, age: 25 }, Object.fromEntries(RATINGS.map(k => [k, n])));
  // A same-side spare wins over a far stronger opposite-side player, even in a different group.
  for (const target of GROUPS) {
    const c = copy(base), inj = [].concat(c[target])[0];
    const same = GROUPS.find(g => unit(g) === unit(target) && g !== target) || target;
    c[same] = [].concat(c[same], bench('weak-spare-' + target, 35));
    const opposite = unit(target) === 'offence' ? 'front' : 'qb';
    c[opposite] = [].concat(c[opposite], bench('strong-opposite-' + target, 90));
    const s = api.starters(c, { out: [inj.id] }); invariants(s, c, [inj.id]);
    check([].concat(s[target]).some(p => p.id === 'weak-spare-' + target), 'same-side spare wins: ' + target);
    check([].concat(s[target]).every(p => !p.twoWay), 'same-side has no penalty: ' + target);
  }
  // Higher native bench ratings change the chosen player and improve each legacy number.
  for (const [group, stat] of [['line', 'line'], ['front', 'rush'], ['secondary', 'cover'], ['backers', 'tackle'], ['kicker', 'kick']]) {
    const c = copy(base), before = api.teamNumbers(api.starters(c))[stat];
    c[group] = [].concat(c[group], bench('better-' + group, 90));
    const s = api.starters(c); invariants(s, c);
    check(api.teamNumbers(s)[stat] > before, 'better starter raises ' + stat);
  }
  // Equal scores with different skill splits resolve by primary skill, then stable ID.
  const tied = copy(base);
  tied.qb = [Object.assign(bench('z-qb', 50), { throw: 60, speed: 50 }), Object.assign(bench('a-qb', 50), { throw: 59, speed: 54 }), Object.assign(bench('b-qb', 50), { throw: 60, speed: 50 })];
  equal(api.starters(tied).qb.id, 'b-qb', 'score ties: primary skill then ID');
  const tiedS = api.starters(tied);
  for (const group of GROUPS) tied[group] = [].concat(tied[group]).reverse();
  equal(api.starters(tied), tiedS, 'candidate order independence');
  const reordered = Object.fromEntries(GROUPS.slice().reverse().map(g => [g, tied[g]]));
  equal(api.starters(reordered), tiedS, 'object group order independence');
  // Sparse authored skills default to 50, but effective defaults are 45 for two-way entries.
  const sparse = copy(base);
  for (const p of flat(sparse)) for (const key of RATINGS) delete p[key];
  const ss = api.starters(sparse, { out: [sparse.qb.id] }); invariants(ss, sparse, [sparse.qb.id]);
  check(RATINGS.every(k => ss.qb.effectiveRatings[k] === 45 && !Object.hasOwn(ss.qb, k)), 'default then penalty');
  equal(api.playbookSlots(ss).qb.throw, 45, 'engine adapter sees penalty');
  const low = copy(base);
  for (const p of flat(low)) for (const key of RATINGS) p[key] = 35;
  const ls = api.starters(low, { out: [low.kicker.id] });
  equal(ls.kicker.effectiveRatings.kick, 30, 'flat penalty not silently clamped');
  equal(api.teamNumbers(ls).kick, 35, 'only team adapter clamps aggregate');
  const frozenS = freeze(api.starters(freeze(copy(base)), freeze({ out: [base.qb.id] })));
  const n = api.teamNumbers(frozenS), slots = api.playbookSlots(frozenS);
  slots.qb.throw = 999; slots.wr[0].name = 'changed'; n.kick = 999;
  equal(api.playbookSlots(frozenS).qb.throw, frozenS.qb.effectiveRatings.throw, 'adapter result cannot mutate starter');
  const mutable = api.starters(base); mutable.line[0].block = 90; mutable.line[0].effectiveRatings.block = 90;
  equal(JSON.stringify(base), JSON.stringify(roster.clubs.brackenport), 'result cannot mutate source');
  const allIds = flat(base).map(p => p.id);
  let seed = 712367;
  const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let run = 0; run < 120; run++) {
    const order = allIds.slice();
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const out = order.slice(0, run % 12), s = api.starters(base, { out });
    invariants(s, base, out);
    equal(api.starters(base, { out: out.slice().reverse() }), s, 'out ordering independence');
  }
  // Every route/carrier identity remains directly resolvable through the adapter.
  const slotsHealthy = api.playbookSlots(api.starters(base));
  const bindings = { qb: slotsHealthy.qb, rb: slotsHealthy.rb, wr0: slotsHealthy.wr[0], wr1: slotsHealthy.wr[1], te: slotsHealthy.te };
  for (const play of playbook.plays) {
    if (play.carrierSlot) check(Boolean(bindings[play.carrierSlot]), 'carrier binding ' + play.id);
    for (const slot of Object.keys(play.routes || {})) check(Boolean(bindings[slot]), 'route binding ' + play.id);
  }
  // Strict malformed inputs; no getters, inherited slots, unknown data or coercion.
  for (const bad of [null, [], 3, 'club', true, new Date(), Object.create(base)]) rejects(() => api.starters(bad), /plain record|is required/, 'bad club');
  for (const group of GROUPS) {
    const missing = copy(base); delete missing[group]; rejects(() => api.starters(missing), /is required/, 'missing group');
    const bad = copy(base); bad[group] = null; rejects(() => api.starters(bad), /plain record/, 'null group');
  }
  const unknown = copy(base); unknown.bench = []; rejects(() => api.starters(unknown), /unknown group bench/, 'unknown group');
  const dup = copy(base); dup.front[0].id = dup.qb.id; rejects(() => api.starters(dup), /duplicate player ID/, 'input duplicate');
  for (const key of ['id', 'name', 'age'].concat(RATINGS)) for (const bad of [null, false, {}, [], '', '50', NaN, Infinity, -Infinity, 34, 91, 49.5]) {
    if ((key === 'id' || key === 'name') && typeof bad === 'string' && bad.trim()) continue;
    if (key === 'age' && bad === 34) continue;
    const c = copy(base); c.qb[key] = bad; rejects(() => api.starters(c), /nonblank text|must be an integer/, 'bad player ' + key);
  }
  for (const key of ['id', 'name', 'age']) { const c = copy(base); delete c.qb[key]; rejects(() => api.starters(c), /is required/, 'required identity'); }
  for (const key of ['unknown', '__proto__']) { const c = copy(base); Object.defineProperty(c.qb, key, { value: 50, enumerable: true }); rejects(() => api.starters(c), /unknown field/, 'unknown player field'); }
  for (const bad of [null, [], false, 0, '', new Date()]) rejects(() => api.starters(base, bad), /plain record/, 'bad opts');
  rejects(() => api.starters(base, { reserve: [] }), /unknown field/, 'unknown opts field');
  for (const bad of [null, {}, false, 'id', 5]) rejects(() => api.starters(base, { out: bad }), /must be an array/, 'bad out');
  for (const bad of [null, {}, false, '', 5]) rejects(() => api.starters(base, { out: [bad] }), /nonblank text/, 'bad out ID');
  rejects(() => api.starters(base, { out: ['not-a-player'] }), /unknown player ID/, 'unknown out ID');
  let getterCalls = 0;
  for (const target of ['club', 'player', 'opts', 'array']) {
    const c = copy(base), opts = {};
    const obj = target === 'club' ? c : target === 'player' ? c.qb : target === 'opts' ? opts : c.wr;
    const key = target === 'club' ? 'qb' : target === 'player' ? 'throw' : target === 'opts' ? 'out' : '0';
    Object.defineProperty(obj, key, { enumerable: true, configurable: true, get() { getterCalls++; return 50; } });
    rejects(() => api.starters(c, opts), /data field|data item/, 'getter rejected');
  }
  equal(getterCalls, 0, 'no getter executed');
  const hole = copy(base); delete hole.wr[0]; rejects(() => api.starters(hole), /data item/, 'sparse group rejected');
  const hidden = copy(base); Object.defineProperty(hidden.qb, 'throw', { enumerable: false, value: 50 }); rejects(() => api.starters(hidden), /data field/, 'nonenumerable rejected');
  const symbol = copy(base); symbol.qb[Symbol('oops')] = 1; rejects(() => api.starters(symbol), /unknown field/, 'symbol rejected');
  const extraArray = copy(base); extraArray.wr.side = 1; rejects(() => api.starters(extraArray), /unknown array field/, 'extra array field rejected');
  const nullProto = copy(base); Object.setPrototypeOf(nullProto, null); Object.setPrototypeOf(nullProto.qb, null);
  equal(api.starters(nullProto), api.starters(base), 'null-prototype records work');
  for (const adapter of ['teamNumbers', 'playbookSlots']) {
    const badCases = [
      [s => { s.bench = []; }, /unknown group/], [s => { delete s.line; }, /is required/],
      [s => { s.line.pop(); }, /must have 5/], [s => { s.line[1] = copy(s.line[0]); }, /duplicates a player/],
      [s => { s.qb.effectiveRatings.throw++; }, /must equal/], [s => { delete s.qb.effectiveRatings.throw; }, /is required/],
      [s => { s.qb.twoWay = true; }, /must equal|does not match/], [s => { s.qb.sourceGroup = 'oops'; }, /unknown group/],
      [s => { s.qb.id = ''; }, /nonblank/], [s => { s.qb.age = 0; }, /integer/],
      [s => { delete s.qb.twoWay; }, /is required/], [s => { s.qb.effectiveRatings.extra = 50; }, /unknown field/]
    ];
    for (const [mutate, expected] of badCases) { const s = api.starters(base); mutate(s); rejects(() => api[adapter](s), expected, adapter + ' malformed'); }
    const s = api.starters(base, { out: [base.qb.id] });
    const donor = flat(s).find(p => p.id === s.qb.id && !p.twoWay); donor.name += ' mismatch';
    rejects(() => api[adapter](s), /inconsistent stored identity/, 'cross-unit identity mismatch');
    for (const bad of [null, [], {}, 7]) rejects(() => api[adapter](bad), /plain record|is required/, 'adapter bad root');
  }
  return { checks, malformed, counts };
}
if (require.main === module) {
  const node = runChecks();
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../games/lantern-bowl/lineup.js'), 'utf8'), context, { timeout: 2000 });
  const browser = runChecks(context.window.LanternBowlLineup);
  assert.deepEqual(copy(browser), copy(node));
  console.log('LB-G12: ' + (node.checks + browser.checks) + ' checks pass in CommonJS and browser-global VM; ' + (node.malformed + browser.malformed) + ' malformed cases rejected.');
  for (const [club, values] of Object.entries(node.counts)) console.log(club + ': ' + JSON.stringify(values));
}
module.exports = { runChecks };
