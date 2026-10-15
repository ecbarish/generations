/* Deterministic NM-RETUNE measurements. This is test tooling, never game code.
   Browser tests load the same runner; Node CLI compares current files with a git ref.
   All elapsed times are simulated, not observed human playtime. */
(function (root) {
  'use strict';
  var PROFILES = [
    { id: 'active', buyMs: 1000, handMs: 1000, tickMs: 1000, policy: 'frontier' },
    { id: 'saver', buyMs: 1000, handMs: 1000, tickMs: 1000, policy: 'save-payback', teaFirst: true },
    { id: 'minute-glance', buyMs: 60000, handMs: 1000, tickMs: 1000, policy: 'frontier' },
    { id: 'hold-saver', buyMs: 1000, handMs: 120, firstHandMs: 350, tickMs: 250, policy: 'save-payback', teaFirst: true, extraHand: true },
    { id: 'milestone-saver', buyMs: 1000, handMs: 1000, tickMs: 1000, policy: 'milestone', teaFirst: true },
    { id: 'hold-milestone', buyMs: 1000, handMs: 120, firstHandMs: 350, tickMs: 250, policy: 'milestone', teaFirst: true, extraHand: true },
    { id: 'tea-only', buyMs: 1000, handMs: 1000, tickMs: 1000, policy: 'tea' }
  ];

  function simulate(M, profile, durationSec) {
    profile = typeof profile === 'string' ? PROFILES.filter(function (p) { return p.id === profile; })[0] : profile;
    if (!profile) throw Error('Unknown pacing profile');
    var state = M.fresh(), limit = (durationSec || 7200) * 1000;
    var nextHand = profile.firstHandMs || profile.handMs, nextTick = profile.tickMs, nextBuy = profile.buyMs;
    var lastTick = 0, tea25 = null, million = null, hires = [], purchases = [], snapshots = {};
    function work(ms) {
      for (var i = 0; i < M.STALLS.length; i++) {
        if (!M.unlocked(state, i)) break;
        if (profile.policy === 'tea' && i > 0) break;
        if (state.stalls[i].hired) continue;
        M.handSell(state, i);
        if (M.canHire(state, i)) { M.hire(state, i); hires[i] = ms / 1000; }
        return;
      }
      if (profile.extraHand) {
        for (var j = M.STALLS.length - 1; j >= 0; j--) {
          if (M.unlocked(state, j)) { M.handSell(state, j); return; }
        }
      }
    }
    function buy(i, mode, ms) {
      var result = M.buy(state, i, mode);
      if (result.ok) purchases.push({ at: ms / 1000, stall: i, count: result.count });
      return result.ok;
    }
    function spend(ms) {
      if (profile.policy === 'tea') { buy(0, 'max', ms); return; }
      if (profile.teaFirst && state.stalls[0].owned < 25) { buy(0, 1, ms); return; }
      if (profile.policy === 'frontier') {
        for (var i = M.STALLS.length - 1; i >= 0; i--) {
          if (M.quote(state, i, 'max').count > 0) { buy(i, 'max', ms); return; }
        }
      } else {
        // Include unaffordable choices: the saver waits instead of spending their reserve.
        for (var n = 0; n < 1000; n++) {
          var best = -1, payback = Infinity, count = 1, cost = 0;
          for (var j = 0; j < M.STALLS.length; j++) {
            if (!M.unlocked(state, j) || !state.stalls[j].hired) continue;
            var counts = [1], owned = state.stalls[j].owned;
            if (profile.policy === 'milestone') [25, 50, 100].forEach(function (at) { if (at > owned) counts.push(at - owned); });
            counts.forEach(function (amount) {
              var stall = M.STALLS[j], price = stall.base * Math.pow(stall.growth, owned) * (Math.pow(stall.growth, amount) - 1) / (stall.growth - 1);
              var before = M.production(state, j);
              state.stalls[j].owned = owned + amount;
              var added = M.production(state, j) - before;
              state.stalls[j].owned = owned;
              var seconds = price / added;
              if (seconds < payback) { best = j; payback = seconds; count = amount; cost = price; }
            });
          }
          if (best < 0 || cost > state.cash) return;
          for (var k = 0; k < count; k++) if (!buy(best, 1, ms)) return;
        }
        throw Error('Unbounded purchasing loop');
      }
    }
    for (var ms = Math.min(nextHand, nextTick, nextBuy); ms <= limit; ms = Math.min(nextHand, nextTick, nextBuy)) {
      // Preserve the existing test order: hand action, earned income, then purchase.
      if (ms === nextHand) { work(ms); nextHand += profile.handMs; }
      if (ms === nextTick) { M.addCash(state, M.income(state) * (ms - lastTick) / 1000); lastTick = ms; nextTick += profile.tickMs; }
      if (ms === nextBuy) { spend(ms); nextBuy += profile.buyMs; }
      if (tea25 === null && state.stalls[0].owned >= 25) tea25 = ms / 1000;
      if (million === null && state.lifetime >= 1000000) million = ms / 1000;
      if (ms === 600000 || ms === 1800000 || ms === 3600000) snapshots[ms / 1000] = {
        income: M.income(state), lifetime: state.lifetime, owned: state.stalls.map(function (s) { return s.owned; })
      };
    }
    var byGoal = purchases.filter(function (p) { return million !== null && p.at <= million; });
    var maxGap = 0;
    for (var g = 1; g < byGoal.length; g++) maxGap = Math.max(maxGap, byGoal[g].at - byGoal[g - 1].at);
    if (byGoal.length && million !== null) maxGap = Math.max(maxGap, million - byGoal[byGoal.length - 1].at);
    return { longestPurchaseGapBeforeMillion: maxGap, profile: profile.id, hireAt: hires, tea25: tea25, million: million, snapshots: snapshots, purchases: purchases, state: state };
  }
  var api = { PROFILES: PROFILES, simulate: simulate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.NightMarketPacing = api;
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && require.main === module) {
  const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), cp = require('node:child_process'), crypto = require('node:crypto');
  const root = path.resolve(__dirname, '..');
  const args = process.argv.slice(2), refAt = args.indexOf('--baseline-ref');
  if (args.some((arg, i) => arg !== '--baseline-ref' && arg !== '--check' && (refAt < 0 || i !== refAt + 1))) throw Error('Usage: node tools/night-market-pacing.cjs [--baseline-ref <commit>] [--check]');
  function measure(ref) {
    const context = { console: console, window: null, Arcade: {} }; context.window = context;
    vm.createContext(context);
    let modelSource;
    for (const file of ['shared/idle-core.js', 'games/night-market/model.js']) {
      const source = ref ? cp.execFileSync('git', ['show', ref + ':' + file], { cwd: root, encoding: 'utf8' }) : fs.readFileSync(path.join(root, file), 'utf8');
      if (file.endsWith('model.js')) modelSource = source;
      vm.runInContext(source, context, { filename: file });
    }
    const profiles = module.exports.PROFILES.map(profile => {
      const result = module.exports.simulate(context.NightMarket, profile);
      return { longestPurchaseGapBeforeMillion: result.longestPurchaseGapBeforeMillion, profile: result.profile, hireAt: result.hireAt, tea25: result.tea25, million: result.million, snapshots: result.snapshots, purchaseActions: result.purchases.length };
    });
    const fixture = JSON.parse(fs.readFileSync(path.join(root, 'docs/playtests/nm-retune/legacy-v1.json'), 'utf8'));
    const M = context.NightMarket;
    const oldSaveRoundTrip = M.valid(fixture) && JSON.stringify(M.serialize(M.restore(fixture), fixture.seen)) === JSON.stringify(fixture);
    return { oldSaveRoundTrip: oldSaveRoundTrip, source: ref || 'working-tree', modelSha256: crypto.createHash('sha256').update(modelSource).digest('hex'), stalls: context.NightMarket.STALLS.map(s => ({id: s.id, base: s.base, growth: s.growth, rate: s.rate, serves: s.serves, hand: s.hand})), profiles: profiles };
  }
  const report = { kind: 'deterministic simulation; seconds are simulated, not human playtime', durationSec: 7200, baseline: refAt >= 0 ? measure(args[refAt + 1]) : null, current: measure(null) };
  if (refAt >= 0) {
    const old = cp.execFileSync('git', ['show', args[refAt + 1] + ':games/night-market/model.js'], { cwd: root, encoding: 'utf8' });
    const current = fs.readFileSync(path.join(root, 'games/night-market/model.js'), 'utf8');
    const withoutBalance = source => source.replace(/(growth|rate): [0-9.]+/g, '$1: BALANCE');
    report.productionChangesAreOnlyGrowthAndRateNumbers = withoutBalance(old) === withoutBalance(current);
  }
  if (args.includes('--check')) {
    const assert = require('node:assert/strict');
    assert.equal(report.current.oldSaveRoundTrip, true, 'legacy save round trip');
    if (report.baseline) {
      assert.equal(report.baseline.oldSaveRoundTrip, true, 'fixture is valid under the old build');
      assert.equal(report.productionChangesAreOnlyGrowthAndRateNumbers, true, 'production scope');
      assert.equal(report.baseline.profiles.find(p => p.profile === 'active').million, 485, 'reproduce original active baseline');
    }
    for (const profile of report.current.profiles) {
      assert(profile.snapshots[600].lifetime < 1000000, profile.profile + ' early rush');
      assert(profile.million >= 2700, profile.profile + ' lower bound');
      if (!['minute-glance', 'tea-only'].includes(profile.profile)) {
        assert(profile.million <= 4500, profile.profile + ' active upper target');
        assert(profile.tea25 > 0 && profile.tea25 <= 600, profile.profile + ' first milestone');
      }
    }
    const active = report.current.profiles.find(p => p.profile === 'active');
    assert.equal(active.hireAt[0], 25, 'first vendor');
    assert(active.longestPurchaseGapBeforeMillion <= 90, 'no forced long purchase wait in the active profile');
    assert(active.snapshots[1800].owned.filter(n => n > 0).length >= 4, 'four types at half an hour');
    report.validation = 'passed';
  }
  console.log(JSON.stringify(report, null, 2));
}
