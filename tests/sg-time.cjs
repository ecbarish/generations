'use strict';

// Standalone SG-TIME regressions. Run: node tests/sg-time.cjs
// SG_TIME_LOOP=/path/to/04-loop.js runs these same expectations against a baseline.
// The real state, dungeon, staff, loop and boot scripts run in isolated VMs.
// Only browser presentation, storage and scheduling are replaced; no real saves are used.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const scriptDir = path.join(root, 'games/starfall-guild/js');
const loopPath = process.env.SG_TIME_LOOP || path.join(scriptDir, '04-loop.js');
const sources = ['00-data.js', '01-state-save.js', '02-dungeon.js', '03-town-staff.js', '04-loop.js', '99-boot.js']
  .map(name => [name, fs.readFileSync(name === '04-loop.js' ? loopPath : path.join(scriptDir, name), 'utf8')]);
const clone = value => JSON.parse(JSON.stringify(value));
const oldFixture = vm.runInNewContext(fs.readFileSync(path.join(root, 'tests/starfall-checks.js'), 'utf8')
  .split('// Runs in the game iframe')[0] + '\nMAIN_SAVE;');
let passed = 0, failed = 0;
function test(label, fn) {
  try { fn(); passed++; console.log('PASS ' + label); }
  catch (error) { failed++; console.error('FAIL ' + label + ': ' + error.message); }
}
function near(actual, expected, label = 'elapsed seconds') {
  assert.ok(Math.abs(actual - expected) <= Math.max(1e-8, Math.abs(expected) * 1e-10),
    `${label}: expected ${expected}, counted ${actual}`);
}
function runtime(saved = null, wall = 1800000000000) {
  let clock = 0, seed = 12345, persisted = saved && clone(saved);
  const intervals = [], events = {}, modals = [];
  const math = Object.create(Math);
  math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const Arcade = {
    validators: {}, fmt: String, fmtI: String, fmtTime: String,
    save: (_, state) => { persisted = clone(state); }, load: () => persisted && clone(persisted),
    encode: JSON.stringify, decode: JSON.parse, report() {}
  };
  const context = vm.createContext({
    console, Math: math, Date: { now: () => wall + clock }, performance: { now: () => clock },
    Arcade, window: { Arcade, claude: { hot: { ready() {} } } }, location: { hostname: 'localhost' },
    document: { querySelector() {}, addEventListener: (type, fn) => { events[type] = fn; } },
    setInterval: (fn, delay) => { intervals.push({ fn, delay }); },
    addEventListener: (type, fn) => { events[type] = fn; }, requestAnimationFrame() {},
    sfx() {}, toast() {}, closeModal() {}, resize() {}, renderTab() {}, updateUI() {},
    setupFeedback() {}, SND: { render() {} }, frame() {}, modalKind: null,
    openModal: (...args) => modals.push(args), offlineHTML: data => JSON.stringify(data)
  });
  for (const [filename, source] of sources) vm.runInContext(source, context, { filename });
  const run = code => vm.runInContext(code, context);
  run('D=derive();');
  return {
    run, state: () => clone(run('S')), saved: () => clone(persisted), modals,
    start: () => run('start({});'),
    tick(seconds) { clock += seconds * 1000; intervals.find(i => i.delay === 100).fn(); },
    save: () => run('save();')
  };
}
function timeDelta(before, after, seconds) {
  near(after.stats.play - before.stats.play, seconds, 'lifetime seconds');
  near(after.stats.run - before.stats.run, seconds, 'season seconds');
}
function excludingTime(state) {
  const copy = clone(state); delete copy.stats.play; delete copy.stats.run; return copy;
}
function prepared(paused = false) {
  const game = runtime();
  game.run("S.biz[0]=2;S.resting=8;S.php=1;S.boardT=17;D=derive();spawn();");
  if (paused) game.run("S.regionOffer=['frost','desert','sky'];");
  return game;
}

// This is the reproducible remaining miss: the no-reward threshold also dropped time.
for (const paused of [false, true]) {
  for (const seconds of [0.001, 0.1, 1, 15, 29.999]) {
    test(`${paused ? 'region choice' : 'ordinary'} short reload counts ${seconds}s without rewards`, () => {
      const game = prepared(paused), before = game.state();
      assert.equal(game.run(`offline(${seconds})`), null);
      const after = game.state(); timeDelta(before, after, seconds);
      assert.deepEqual(excludingTime(after), excludingTime(before));
    });
  }
}

for (const paused of [false, true]) {
  for (const seconds of [30, 30.001, 60, 60.001, 120, 86399.999, 86400, 86400.001, 172800]) {
    test(`${paused ? 'region choice' : 'ordinary'} offline ${seconds}s preserves the one-day cap`, () => {
      const game = prepared(paused), before = game.state(), counted = Math.min(seconds, 86400);
      const result = game.run(`offline(${seconds})`), after = game.state();
      timeDelta(before, after, counted);
      if (paused) {
        assert.equal(result, null);
        assert.deepEqual(excludingTime(after), excludingTime(before));
      } else {
        near(result.sec, counted); near(result.eff, 0.5); near(result.gain, counted);
        near(after.gold - before.gold, counted);
        assert.equal(after.boardT, 0); assert.equal(after.resting, 0);
        near(after.php, game.run('D.pmax'));
        assert.equal(after.floor, before.floor); assert.equal(after.stats.kills, before.stats.kills);
      }
    });
  }
}

test('Night Shift and farm rewards are unchanged above the 30s threshold', () => {
  const game = runtime();
  game.run("S.party=[makeAdv(1,'swordsman')];S.party[0].lvl=25;S.biz[0]=2;S.crest.night=3;D=derive();S.php=D.pmax;spawn();");
  const before = game.state(), rate = game.run('D.gps+farmRate()');
  const result = game.run('offline(35.5)');
  assert.equal(result.farm, true); near(result.eff, 0.8);
  near(result.gain, rate * 35.5 * 0.8); timeDelta(before, game.state(), 35.5);
});

for (const value of ['NaN', 'Infinity', '-Infinity', '-1', '0', 'null', 'undefined', '"15"']) {
  for (const method of ['advance', 'offline']) {
    test(`${method} ignores ${value} without changing the saved state`, () => {
      const game = prepared(), before = game.state();
      game.run(`${method}(${value})`); assert.deepEqual(game.state(), before);
    });
  }
}

for (const paused of [false, true]) {
  for (const seconds of [0.001, 0.1, 0.25, 0.251, 1, 59.999, 60, 120, 1200]) {
    test(`${paused ? 'region choice' : 'ordinary'} advance counts all ${seconds}s`, () => {
      const game = prepared(paused), before = game.state();
      game.run(`advance(${seconds})`); timeDelta(before, game.state(), seconds);
      if (paused) assert.deepEqual(excludingTime(game.state()), excludingTime(before));
    });
  }
}

test('A 20-minute foreground session counts 1200s through combat and recovery', () => {
  const game = runtime(); game.start(); const before = game.state();
  for (let i = 0; i < 12000; i++) game.tick(0.1);
  timeDelta(before, game.state(), 1200);
  assert.ok(game.state().stats.kills > 0);
});

for (const paused of [false, true]) {
  test(`The real boot load counts a 15s absence ${paused ? 'during a region choice' : 'during normal play'}`, () => {
    const saved = clone(oldFixture), wall = saved.last + 15000;
    if (paused) saved.regionOffer = ['frost', 'desert', 'sky'];
    const game = runtime(saved, wall); game.start();
    timeDelta(saved, game.state(), 15);
    assert.equal(game.state().gold, saved.gold); assert.equal(game.modals.length, 0);
    assert.equal(game.state().last, wall);
    game.tick(0.1); timeDelta(saved, game.state(), 15.1);
    game.save(); assert.deepEqual(game.saved(), game.state());
  });
}

test('Repeated short save/reload sessions count 1200s, not just 600s', () => {
  let saved = clone(oldFixture), wall = saved.last;
  const before = clone(saved);
  for (let i = 0; i < 120; i++) {
    wall += 5000;
    const game = runtime(saved, wall); game.start();
    for (let tick = 0; tick < 50; tick++) game.tick(0.1);
    game.save(); saved = game.saved(); wall = saved.last;
  }
  timeDelta(before, saved, 1200);
  console.log(`  Repeated reload evidence: elapsed 1200s; counted ${(saved.stats.play - before.stats.play).toFixed(6)}s.`);
});

for (const seconds of [59.999, 60, 60.001, 120, 86401]) {
  test(`The real boot timer dispatch counts ${seconds}s once`, () => {
    const game = runtime(); game.start();
    game.run("S.regionOffer=['frost','desert','sky'];");
    const before = game.state(); game.tick(seconds);
    timeDelta(before, game.state(), Math.min(seconds, 86400));
    assert.equal(game.modals.length, 0);
    game.tick(0.1); timeDelta(before, game.state(), Math.min(seconds, 86400) + 0.1);
  });
}

test('The original unsplit save loads unchanged, then round-trips with only the counted totals', () => {
  const game = runtime(oldFixture);
  game.run('S=merge(load());D=derive();');
  assert.deepEqual(game.state(), clone(oldFixture));
  assert.deepEqual(clone(game.run('JSON.parse(exportSave())')), clone(oldFixture));
  const before = game.state(); game.run('offline(12.345)'); const after = game.state();
  timeDelta(before, after, 12.345);
  assert.deepEqual(excludingTime(after), excludingTime(before));
  assert.equal(after.v, 1); assert.deepEqual(Object.keys(after).sort(), Object.keys(before).sort());
  game.save();
  const saved = game.saved(); game.run('S=merge(load());D=derive();');
  assert.deepEqual(game.state(), saved);
});

test('A save without optional time totals still gets the original defaults', () => {
  const saved = clone(oldFixture); delete saved.stats.play; delete saved.stats.run;
  const game = runtime(saved); game.run('S=merge(load());D=derive();offline(2.5);');
  assert.equal(game.state().stats.play, 2.5); assert.equal(game.state().stats.run, 2.5);
  assert.equal(game.state().v, saved.v);
});

test('A new season resets only its run clock and a subsequent short absence counts once', () => {
  const game = runtime(); game.start();
  game.run('S.best=20;S.stats.play=1234.5;S.stats.run=456.25;newSeason(false);');
  let state = game.state(); assert.equal(state.stats.play, 1234.5); assert.equal(state.stats.run, 0);
  assert.ok(state.regionOffer.length);
  game.run('offline(12.5);chooseRegion(S.regionOffer[0],false);advance(0.25);');
  state = game.state(); near(state.stats.play, 1247.25); near(state.stats.run, 12.75);
  assert.equal(state.stats.seasons, 1); assert.equal(state.regionOffer, null);
});

test('Staff-triggered season changes preserve total elapsed time', () => {
  const game = runtime(); game.start();
  game.run('S.best=20;S.autoAt=1;S.staff.unl.aldric=true;S.staff.on.aldric=true;');
  const before = game.state(); game.run('advance(1);'); const after = game.state();
  near(after.stats.play - before.stats.play, 1);
  assert.equal(after.stats.seasons, 1); near(after.stats.run, 0.75);
});

test('A region choice arising mid-tick still counts the unsimulated remainder', () => {
  const game = prepared();
  // Force the existing loop's interruption branch without changing production helpers.
  game.run("runStaff=function(){S.regionOffer=['frost'];};");
  const before = game.state(); game.run('advance(10);');
  timeDelta(before, game.state(), 10);
  near(game.state().gold - before.gold, 0.5);
});

console.log(`SG-TIME: ${passed} checks passed; ${failed} failed. No save fields or reward rules changed.`);
process.exitCode = failed ? 1 : 0;
