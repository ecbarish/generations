'use strict';
/* DM-MOOD: run the real model in isolated VMs; no browser or user storage.
   node tests/dm-mood.cjs
   --morale FILE runs the regressions against an alternate morale source (negative control).
   --compare-morale FILE additionally compares ordinary games and legacy saves with that source. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const moraleFile = path.join(root, 'games/diamond-manager/js/morale.js');
const args = process.argv.slice(2);
function option(name) {
  const i = args.indexOf(name);
  if (i < 0) return null;
  assert.ok(args[i + 1] && !args[i + 1].startsWith('--'), `${name} requires a file`);
  return path.resolve(args[i + 1]);
}
for (let i = 0; i < args.length; i += 2) assert.ok(['--morale', '--compare-morale'].includes(args[i]), `Unknown option ${args[i]}`);
const selected = option('--morale') || moraleFile;
const comparison = option('--compare-morale');
const plain = value => JSON.parse(JSON.stringify(value));
let checks = 0, failures = 0;
function check(label, run) {
  checks++;
  try { run(); console.log(`PASS ${label}`); }
  catch (error) { failures++; console.error(`FAIL ${label}: ${error.message}`); }
}
function model(file = selected) {
  const context = vm.createContext({});
  const html = fs.readFileSync(path.join(root, 'games/diamond-manager/index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1])
    .filter(src => src === '../../shared/sports-office.js' || (src.startsWith('js/') && !['js/field.js', 'js/ui.js'].includes(src)));
  assert.equal(scripts.length, 8, 'Use the current eight model scripts in browser order');
  for (const src of scripts) {
    const original = path.resolve(root, 'games/diamond-manager', src);
    vm.runInContext(fs.readFileSync(original === moraleFile ? file : original, 'utf8'), context, {filename: src});
  }
  const d = vm.runInContext('({DM,newLeague,recordMood,freshMorale,validMorale,validLeague,migrateLeague,loadLeague,newGame,playGame,playDay,dayKey,pitchers,overall,askSalary,playerStory})', context);
  // Observe the actual participation sets; do not replace or rewrite recordMood.
  d.participation = (L, g) => {
    const entries = [];
    context.Set = class extends Set { constructor(values) { super(values); entries.push(Array.from(this)); } };
    try { d.recordMood(L, g); } finally { delete context.Set; }
    assert.equal(entries.length, 4, 'One batter set and one pitcher set per side');
    return [entries[3], entries[1]]; // away, home; recordMood visits home first.
  };
  return d;
}
function fixture(d, side) {
  const L = d.newLeague(310), g = d.newGame(L, 4, 2, 401);
  L.day = 8; g.key = d.dayKey(L); g.done = true; g.winner = side ? g.home : g.away;
  for (const c of L.clubs) for (const p of c.players) {
    p.years = 2; p.salary = 2000; delete p.rest;
    p.morale = d.freshMorale(); p.morale.missed = 2;
  }
  return {L, g, ci: side ? g.home : g.away};
}
const d = model();
for (const side of [0, 1]) {
  const label = side ? 'home' : 'away';
  for (const kind of ['used absent', 'used null', 'side absent', 'side null', 'empty', 'populated', 'duplicates']) {
    check(`${label}: ${kind} uses only this side's participation`, () => {
      const {L, g, ci} = fixture(d, side), own = g.starters[side];
      const relief = d.pitchers(L.clubs[ci]).find(p => p.id !== own).id;
      const expected = kind === 'empty' ? [] : ['populated', 'duplicates'].includes(kind) ? [relief] : [own];
      if (kind === 'used absent') delete g.used;
      else if (kind === 'used null') g.used = null;
      else if (kind === 'side absent') delete g.used[side];
      else if (kind === 'side null') g.used[side] = null;
      else g.used[side] = kind === 'empty' ? [] : kind === 'duplicates' ? [relief, relief] : [relief];
      const before = JSON.stringify(g), seed = L.seed, sets = d.participation(L, g);
      assert.deepEqual(sets[side], expected);
      assert.ok(!sets[side].includes(g.starters[1 - side]), 'Opposing starter must never enter the fallback set');
      assert.equal(JSON.stringify(g), before, 'The game result is not mutated');
      assert.equal(L.seed, seed, 'No extra random rolls');
      for (const p of d.pitchers(L.clubs[ci])) {
        const played = expected.includes(p.id);
        assert.equal(p.morale.missed, played ? 0 : 3);
        assert.equal(p.morale.mood, played ? 53 : 51 - (d.overall(p) >= 62 ? 3 : 1));
        assert.equal(p.salary, 2000); assert.equal(p.years, 2);
      }
      assert.ok(d.validLeague(L), 'Recorded fixture remains a valid league');
    });
  }
  for (const kind of ['starters absent', 'starters null', 'own starter absent', 'own starter null']) {
    check(`${label}: ${kind} grants no phantom appearance`, () => {
      const {L, g} = fixture(d, side); delete g.used[side];
      if (kind === 'starters absent') delete g.starters;
      else if (kind === 'starters null') g.starters = null;
      else if (kind === 'own starter null') g.starters[side] = null;
      else delete g.starters[side];
      assert.deepEqual(d.participation(L, g)[side], []);
    });
  }
  check(`${label}: a delayed result does not credit the opposing starter after a roster swap`, () => {
    const {L, g, ci} = fixture(d, side), other = side ? g.away : g.home;
    // Defensive stale-result fixture: IDs remain unique and both rosters stay legal.
    // It is not evidence that today's UI permits a trade before recording a game.
    const newcomer = L.clubs[other].players.find(p => p.id === g.starters[1 - side]);
    const outgoing = d.pitchers(L.clubs[ci]).find(p => p.id !== g.starters[side]);
    const exchange = (club, out, incoming) => { club.players[club.players.indexOf(out)] = incoming; };
    exchange(L.clubs[ci], outgoing, newcomer); exchange(L.clubs[other], newcomer, outgoing);
    delete g.used[side]; d.recordMood(L, g);
    assert.equal(newcomer.morale.missed, 3, 'The opposing appearance is not counted for the new club');
    assert.equal(newcomer.morale.mood, 51 - (d.overall(newcomer) >= 62 ? 3 : 1));
    assert.ok(d.validLeague(L), 'The league still has unique IDs and legal rosters');
  });
}
check('Both missing lists resolve independently, including when club indices are not side indices', () => {
  const {L, g} = fixture(d, 0); delete g.used;
  assert.deepEqual(d.participation(L, g), [[g.starters[0]], [g.starters[1]]]);
});
check('An existing used list works even without any starter metadata', () => {
  const {L, g} = fixture(d, 1), expected = plain(g.used); delete g.starters;
  assert.deepEqual(d.participation(L, g), expected);
});
check('Duplicate recording remains idempotent and preserves the game and random seed', () => {
  const {L, g} = fixture(d, 1); delete g.used;
  d.recordMood(L, g); const before = JSON.stringify({L, g}); d.recordMood(L, g);
  assert.equal(JSON.stringify({L, g}), before);
});
check('Resting pitchers still avoid a missed-game penalty and batter participation is unchanged', () => {
  const {L, g, ci} = fixture(d, 1), resting = d.pitchers(L.clubs[ci]).find(p => p.id !== g.starters[1]);
  resting.rest = {day: g.key - 1, pitches: 95}; delete g.used;
  d.recordMood(L, g); assert.equal(resting.morale.missed, 2); assert.equal(resting.morale.mood, 51);
  for (const p of L.clubs[ci].players.filter(p => !p.pitcher)) {
    const played = g.bat[1].includes(p.id) || g.first[1].includes(p.id);
    assert.equal(p.morale.missed, played ? 0 : 3);
  }
});
function reload(d, L) {
  const raw = JSON.stringify(L), writes = [];
  const storage = {getItem: key => key === d.DM.key ? raw : null, setItem: (...entry) => writes.push(entry)};
  const loaded = d.loadLeague(storage, []);
  assert.ok(loaded, 'The actual loader accepts the save instead of replacing the league');
  assert.deepEqual(plain(loaded), plain(L)); assert.equal(writes.length, 0, 'No rejected-save backup');
  const migrated = d.migrateLeague(loaded); assert.ok(d.validLeague(migrated));
  return migrated;
}
for (const variant of ['current', 'pre-morale', 'requests', 'live without form metadata']) {
  check(`Legacy storage round trip: ${variant}`, () => {
    const L = d.newLeague(508); L.cash = 12345;
    if (variant === 'pre-morale') for (const c of L.clubs) for (const p of c.players) delete p.morale;
    if (variant === 'requests') {
      const p = L.clubs[0].players[0]; p.morale = {...d.freshMorale(), mood: 20, missed: 4, request: {kind: 'trade', key: 100}};
    }
    if (variant === 'live without form metadata') {
      L.live = {g: d.newGame(L, 0, 1, 99)}; delete L.live.g.formKey; delete L.live.g.formChanges;
    }
    const M = reload(d, L), again = reload(d, M);
    assert.equal(M.seed, L.seed); assert.equal(M.cash, 12345); assert.equal(M.schema, 1);
    assert.deepEqual(plain(again), plain(M));
    if (variant === 'requests') assert.deepEqual(plain(M.clubs[0].players[0].morale), plain(L.clubs[0].players[0].morale));
    if (variant === 'pre-morale') assert.ok(M.clubs.every(c => c.players.every(p => p.morale.mood === 50)));
    if (comparison) assert.deepEqual(plain(M), plain(reload(model(comparison), plain(L))), 'Migration matches the original model exactly');
  });
}
if (comparison) {
  const old = model(comparison);
  for (const seed of [1, 97, 211, 310, 508, 811]) {
    check(`Normal play remains byte-identical to the original morale model: seed ${seed}, 30 days`, () => {
      const a = d.newLeague(seed), b = old.newLeague(seed);
      for (let day = 0; day < 30; day++) {
        d.playDay(a); old.playDay(b);
        assert.equal(JSON.stringify(a), JSON.stringify(b), `Unchanged state on day ${day + 1}`);
        assert.ok(d.validLeague(a));
      }
    });
  }
}
console.log(`DM-MOOD: ${checks - failures}/${checks} checks passed${comparison ? ' (including original-model comparisons)' : ''}.`);
process.exitCode = failures ? 1 : 0;
