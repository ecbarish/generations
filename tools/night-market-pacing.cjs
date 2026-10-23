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
    var lastTick = 0, tea25 = null, million = null, hires = [], purchases = [], snapshots = {}, lastSpendAt = 0;
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
      if (result.ok) {
        purchases.push({ at: ms / 1000, stall: i, count: result.count });
        lastSpendAt = ms / 1000;
      }
      return result.ok;
    }
    function spend(ms) {
      if (profile.policy === 'tea') { buy(0, 'max', ms); return; }
      if (profile.teaFirst && state.stalls[0].owned < 25) { buy(0, 1, ms); return; }
      if (profile.policy === 'frontier') {
        for (var i = M.STALLS.length - 1; i >= 0; i--) {
          if (M.quote(state, i, 'max').count > 0) { buy(i, 'max', ms); return; }
        }
        /* Max has refused every copy. Buy 1 of the tagged stall, as the button says. */
        var saved = state.bulk;
        state.bulk = 1;
        var one = M.bestIndex(state);
        state.bulk = saved;
        if (one >= 0) buy(one, 1, ms);
      } else {
        // Include unaffordable choices: the saver waits instead of spending their reserve.
        for (var n = 0; n < 1000; n++) {
          var best = -1, payback = Infinity, count = 1, cost = 0;
          for (var j = 0; j < M.STALLS.length; j++) {
            if (!M.unlocked(state, j) || !state.stalls[j].hired) continue;
            var counts = [1], owned = state.stalls[j].owned;
            if (profile.policy === 'milestone') [10, 25, 50, 100, 150, 200, 300, 400].forEach(function (at) { if (at > owned) counts.push(at - owned); });
            counts.forEach(function (amount) {
              var price = M.cost(j, owned, amount);
              var before, added;
              if (profile.policy === 'milestone') {
                before = M.income(state);
                state.stalls[j].owned = owned + amount;
                added = M.income(state) - before;
              } else {
                before = M.production(state, j);
                state.stalls[j].owned = owned + amount;
                added = M.production(state, j) - before;
              }
              state.stalls[j].owned = owned;
              var seconds = price / added;
              if (!(added > 0) || !isFinite(seconds)) return;
              if (profile.policy === 'milestone') {
                var incomeNow = M.income(state);
                var wait = incomeNow > 0 ? Math.max(0, (price - state.cash) / incomeNow) : (price > state.cash ? Infinity : 0);
                // A new wait cannot stack on time already spent since the last purchase.
                var room = 120 - (ms / 1000 - lastSpendAt);
                if (wait > Math.max(0, room)) return;
              }
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

  /* One sensible buyer. Each second: one hand action on the earliest unlocked stall
     that nobody has taken yet, then that second's stall income, then at most one
     copy of the hired stall that pays for itself soonest. If that copy costs more
     than the coins on hand, the buyer waits. A worse stall is not a substitute.
     Times are simulated seconds, not a person's clock. */
  function playSensible(M, durationSec) {
    var state = M.fresh();
    var limit = durationSec || 4800;
    var marks = { 1000: null, 10000: null, 100000: null, 1000000: null };
    var snaps = {};
    var purchases = [];
    var waits = [];
    var overtakenAt = null;
    function handRate() {
      var best = 0;
      for (var i = 0; i < M.STALLS.length; i++) {
        if (!M.unlocked(state, i)) break;
        if (M.STALLS[i].hand > best) best = M.STALLS[i].hand;
      }
      return best * 10;
    }
    for (var t = 1; t <= limit; t++) {
      for (var i = 0; i < M.STALLS.length; i++) {
        if (!M.unlocked(state, i)) break;
        if (state.stalls[i].hired) continue;
        if (M.canHire(state, i)) M.hire(state, i);
        else M.handSell(state, i);
        break;
      }
      M.addCash(state, M.income(state));
      var best = -1, payback = Infinity, cost = 0;
      for (var j = 0; j < M.STALLS.length; j++) {
        if (!state.stalls[j].hired) continue;
        var seconds = M.paybackSeconds(state, j);
        if (seconds < payback) { payback = seconds; best = j; cost = M.quote(state, j, 1).cost; }
      }
      var income = M.income(state);
      var wait = best < 0 || !(income > 0) ? Infinity : Math.max(0, (cost - state.cash) / income);
      if (t >= 360 && t <= 900 && best >= 0) waits.push(wait);
      if (best >= 0 && state.cash >= cost && M.buy(state, best, 1).ok) purchases.push({ at: t, stall: best, payback: payback });
      income = M.income(state);
      if (overtakenAt === null && income > handRate()) overtakenAt = t;
      [1000, 10000, 100000, 1000000].forEach(function (mark) {
        if (marks[mark] === null && state.lifetime >= mark) marks[mark] = t;
      });
      if (t === 300 || t === 360 || t === 600 || t === 870 || t === 900 || t === 1800) {
        snaps[t] = {
          income: income,
          lifetime: state.lifetime,
          owned: state.stalls.map(function (s) { return s.owned; }),
          hand: handRate(),
          bestPayback: payback,
          wait: wait
        };
      }
    }
    var gaps = [], paybacks = [];
    purchases.forEach(function (p, index) {
      if (p.at < 360 || p.at > 900) return;
      if (index > 0) gaps.push(p.at - purchases[index - 1].at);
      paybacks.push(p.payback);
    });
    return { marks: marks, snaps: snaps, overtakenAt: overtakenAt, gaps: gaps, paybacks: paybacks, waits: waits, purchases: purchases, state: state };
  }

  /* The playtest buyer. Same minute as playSensible, except they buy the affordable
     stall that pays for itself soonest. They do not save up for a better one.
     visiblePaybacks are the longest line on any hired stall during minutes 6 to 15. */
  function playAffordable(M, durationSec) {
    var state = M.fresh();
    var limit = durationSec || 5400;
    var marks = { 1000: null, 10000: null, 100000: null, 1000000: null };
    var snaps = {};
    var purchases = [];
    var visible = [];
    for (var t = 1; t <= limit; t++) {
      for (var i = 0; i < M.STALLS.length; i++) {
        if (!M.unlocked(state, i)) break;
        if (state.stalls[i].hired) continue;
        if (M.canHire(state, i)) M.hire(state, i);
        else M.handSell(state, i);
        break;
      }
      M.addCash(state, M.income(state));
      var best = -1, payback = Infinity, worst = 0;
      for (var j = 0; j < M.STALLS.length; j++) {
        if (!state.stalls[j].hired) continue;
        var seconds = M.paybackSeconds(state, j);
        if (seconds > worst) worst = seconds;
        var quote = M.quote(state, j, 1);
        if (quote.count > 0 && seconds < payback) { payback = seconds; best = j; }
      }
      if (t >= 360 && t <= 900 && worst > 0) visible.push(worst);
      if (best >= 0 && M.buy(state, best, 1).ok) purchases.push({ at: t, stall: best, payback: payback });
      [1000, 10000, 100000, 1000000].forEach(function (mark) {
        if (marks[mark] === null && state.lifetime >= mark) marks[mark] = t;
      });
      if (t === 360 || t === 600 || t === 870 || t === 900 || t === 1800) {
        snaps[t] = {
          income: M.income(state),
          lifetime: state.lifetime,
          owned: state.stalls.map(function (s) { return s.owned; }),
          boughtPayback: best >= 0 ? payback : null,
          worstLine: worst
        };
      }
    }
    var paybacks = [];
    purchases.forEach(function (p) {
      if (p.at >= 360 && p.at <= 900) paybacks.push(p.payback);
    });
    return { marks: marks, snaps: snaps, paybacks: paybacks, visible: visible, purchases: purchases, state: state };
  }

  function topShare(M, state) {
    var total = M.income(state), best = 0, i;
    if (!(total > 0)) return 0;
    for (i = 0; i < M.STALLS.length; i++) best = Math.max(best, M.production(state, i));
    return best / total;
  }

  /* Named beats for the quarter hour after minute 15: a doubling, a lane light, or a chapter. */
  function noteBeats(M, state, ownedBefore, ms, beats) {
    var sec = ms / 1000, low = Infinity, prevLow = Infinity, i, now, prev, c, from;
    for (i = 0; i < 5; i++) prevLow = Math.min(prevLow, ownedBefore[i]);
    for (i = 0; i < M.STALLS.length; i++) {
      now = state.stalls[i].owned;
      prev = ownedBefore[i];
      if (i < 5 && now < low) low = now;
      [25, 50, 100, 150, 200, 300, 400].forEach(function (mark) {
        if (prev < mark && now >= mark) beats.push({ at: sec, name: mark + ' ' + M.STALLS[i].name + 's, x2' });
      });
      if (i === M.STALLS.length - 1) {
        from = prev > 0 ? prev : 0;
        for (c = from + 1; c <= now && c <= 10; c++) {
          beats.push({ at: sec, name: c === 10 ? "Old Wen's last chapter" : 'Story chapter ' + c + ': ' + M.chapterTitle(c) });
        }
      }
      ownedBefore[i] = now;
    }
    [10, 25, 50].forEach(function (mark) {
      if (prevLow < mark && low >= mark) beats.push({ at: sec, name: 'The whole lane lights at ' + mark });
    });
  }

  function purchaseGap(purchases, from, to) {
    var max = 0, at = 0, i, g;
    for (i = 1; i < purchases.length; i++) {
      if (purchases[i].at < from || purchases[i].at > to) continue;
      g = purchases[i].at - purchases[i - 1].at;
      if (g > max) { max = g; at = purchases[i].at; }
    }
    return { max: max, at: at };
  }

  function beatCoverage(beats, from, to) {
    var inWindow = beats.filter(function (b) { return b.at >= from && b.at <= to; });
    var edges = [from].concat(inWindow.map(function (b) { return b.at; }), [to]);
    var max = 0, i;
    for (i = 1; i < edges.length; i++) if (edges[i] - edges[i - 1] > max) max = edges[i] - edges[i - 1];
    return { max: max, count: inWindow.length, beats: inWindow };
  }

  function bestUnitPayback(M, state) {
    var best = Infinity, i;
    for (i = 0; i < M.STALLS.length; i++) {
      if (!state.stalls[i].hired) continue;
      best = Math.min(best, M.paybackSeconds(state, i, 1));
    }
    return best;
  }

  /* A buyer who uses the page's Best tag.
     Max and Next only consider a quote the button can make. Buy 1 scores every
     hired stall's next copy and waits when that best copy is still unaffordable.
     One purchase every few seconds, and hiring at the hold's pace. */
  function playBuyer(M, opts) {
    var state = M.fresh();
    state.bulk = opts.bulk;
    var limit = (opts.durationSec || 3600) * 1000;
    var HAND = 120, BUY = opts.buyMs || 4000;
    var marks = { 1000: null, 10000: null, 100000: null, 1000000: null };
    var snaps = {};
    var purchases = [];
    var bonuses = [];
    var beats = [];
    var bestPay = [];
    var ownedBefore = [0, 0, 0, 0, 0, 0];
    var story1 = null, story10 = null;
    var early = [0, 0, 0, 0, 0, 0];
    var spanBuys = 0, spanMats = 0;
    var laneAt = {};
    var matPay = [];
    var lastTick = 0, nextBuy = BUY, prevIncome = 0;
    function noteBonuses(ms) {
      var prevOwned = ownedBefore.slice();
      noteBeats(M, state, ownedBefore, ms, beats);
      for (var i = 0; i < M.STALLS.length; i++) {
        var now = state.stalls[i].owned, prev = prevOwned[i];
        [10, 25, 50, 100, 150, 200, 300, 400].forEach(function (mark) {
          if (prev < mark && now >= mark) bonuses.push({ at: ms / 1000, stall: i, mark: mark });
        });
      }
      var low = M.lowestOwned(state);
      [10, 25, 50].forEach(function (mark) {
        if (!laneAt[mark] && low >= mark) laneAt[mark] = { at: ms / 1000, before: prevIncome, after: M.income(state) };
      });
    }
    for (var ms = HAND; ms <= limit; ms += HAND) {
      for (var i = 0; i < M.STALLS.length; i++) {
        if (!M.unlocked(state, i)) break;
        if (state.stalls[i].hired) continue;
        if (M.canHire(state, i)) M.hire(state, i);
        else M.handSell(state, i);
        break;
      }
      M.addCash(state, M.income(state) * (ms - lastTick) / 1000);
      lastTick = ms;
      if (ms + 1e-6 >= nextBuy) {
        nextBuy += BUY;
        var bestUnit = Infinity, j;
        for (j = 0; j < M.STALLS.length; j++) {
          if (!state.stalls[j].hired) continue;
          bestUnit = Math.min(bestUnit, M.paybackSeconds(state, j, 1));
        }
        var pick = M.bestIndex(state);
        var mode = state.bulk;
        /* Max stays on the tagged stall. When Max refuses every affordable copy,
           the buyer does what the button says and uses Buy 1. On the old curve
           that fallback never comes up before the finale. */
        if (!(pick >= 0) && opts.fallback) {
          state.bulk = 1;
          pick = M.bestIndex(state);
          mode = 1;
          state.bulk = opts.bulk;
        }
        if (pick >= 0) {
          var q = M.quote(state, pick, mode);
          if (q.count > 0) {
            var pay = M.paybackSeconds(state, pick, q.count);
            var bought = M.buyExact(state, pick, q.count);
            if (bought.ok && bought.count === q.count) {
              purchases.push({ at: ms / 1000, stall: pick, payback: pay, count: bought.count });
              if (ms >= 600000 && ms < 960000) early[pick] += bought.count;
              if (story1 !== null && story10 === null) {
                spanBuys += bought.count;
                if (pick === 5) spanMats += bought.count;
              }
              if (pick === 5) matPay.push(pay);
            }
          }
        }
        noteBonuses(ms);
        if (ms >= 480000 && ms <= limit && isFinite(bestUnit)) bestPay.push({ at: ms, seconds: bestUnit });
      } else noteBonuses(ms);
      prevIncome = M.income(state);
      if (story1 === null && state.stalls[5].owned >= 1) story1 = ms / 1000;
      if (story10 === null && state.stalls[5].owned >= 10) story10 = ms / 1000;
      [30, 180, 360, 450, 540, 600, 720, 900, 960, 1200, 1500, 1800, 2400, 3000, 3600].forEach(function (sec) {
        if (!snaps[sec] && ms + 1e-6 >= sec * 1000) {
          var lines = [], bestLine = Infinity;
          for (var k = 0; k < M.STALLS.length; k++) {
            if (!state.stalls[k].hired) continue;
            var line = M.paybackSeconds(state, k, 1);
            lines.push(line);
            if (line < bestLine) bestLine = line;
          }
          snaps[sec] = {
            income: M.income(state),
            cash: state.cash,
            lifetime: state.lifetime,
            owned: state.stalls.map(function (s) { return s.owned; }),
            lines: lines,
            bestPayback: bestLine,
            topShare: topShare(M, state)
          };
        }
      });
      [1000, 10000, 100000, 1000000].forEach(function (mark) {
        if (marks[mark] === null && state.lifetime >= mark) marks[mark] = ms / 1000;
      });
    }
    function maxBetween(fromMs, toMs) {
      return bestPay.reduce(function (m, row) {
        return row.at >= fromMs && row.at <= toMs ? Math.max(m, row.seconds) : m;
      }, 0);
    }
    var earlyTotal = early.reduce(function (s, n) { return s + n; }, 0);
    return {
      marks: marks, snaps: snaps, purchases: purchases, bonuses: bonuses, beats: beats, bestPay: bestPay, state: state,
      story1: story1, story10: story10, laneAt: laneAt, early: early,
      earlyIncenseShare: earlyTotal ? early[4] / earlyTotal : 0,
      matShare: spanBuys ? spanMats / spanBuys : 0,
      matPay: matPay,
      maxBestPayback8to15: maxBetween(480000, 900000),
      maxBestPayback8to25: maxBetween(480000, 1500000),
      maxBestPayback15to60: maxBetween(900000, 3600000),
      purchaseGap15to60: purchaseGap(purchases, 900, 3600).max
    };
  }

  /* Best tag, Max, one buy every 4 seconds. This is the buyer that matches a pass
     which always takes the tagged stall. */
  function playMeasured(M, durationSec) {
    return playBuyer(M, { bulk: 'max', buyMs: 4000, durationSec: durationSec || 3600, fallback: true });
  }

  /* The same Best tag and the same Max rule, one buy every 5 seconds.
     A person tapping the tagged stall a little slower than the bot. */
  function playHuman(M, durationSec) {
    return playBuyer(M, { bulk: 'max', buyMs: 5000, durationSec: durationSec || 3600, fallback: true });
  }

  var api = {
    PROFILES: PROFILES, simulate: simulate, playSensible: playSensible, playAffordable: playAffordable,
    playMeasured: playMeasured, playHuman: playHuman, topShare: topShare, purchaseGap: purchaseGap, beatCoverage: beatCoverage
  };
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
      return { longestPurchaseGapBeforeMillion: result.longestPurchaseGapBeforeMillion, profile: result.profile, hireAt: result.hireAt, tea25: result.tea25, million: result.million, snapshots: result.snapshots, purchaseActions: result.purchases.length, purchaseGap60: module.exports.purchaseGap(result.purchases, 0, 3600).max };
    });
    const sensible = module.exports.playSensible(context.NightMarket, 5400);
    const affordable = module.exports.playAffordable(context.NightMarket, 5400);
    const measured = module.exports.playMeasured(context.NightMarket, 3600);
    const human = module.exports.playHuman(context.NightMarket, 3600);
    const coverage = (run) => module.exports.beatCoverage(run.beats, 900, 3600);
    const maxOf = (list) => list.reduce((m, n) => Math.max(m, n), 0);
    const fixture = JSON.parse(fs.readFileSync(path.join(root, 'docs/playtests/nm-retune/legacy-v1.json'), 'utf8'));
    const M = context.NightMarket;
    const oldSaveRoundTrip = M.valid(fixture) && JSON.stringify(M.serialize(M.restore(fixture), fixture.seen)) === JSON.stringify(fixture);
    return {
      oldSaveRoundTrip: oldSaveRoundTrip, source: ref || 'working-tree', modelSha256: crypto.createHash('sha256').update(modelSource).digest('hex'),
      stalls: context.NightMarket.STALLS.map(s => ({id: s.id, base: s.base, growth: s.growth, rate: s.rate, serves: s.serves, hand: s.hand})),
      profiles: profiles,
      sensible: {
        marks: sensible.marks, overtakenAt: sensible.overtakenAt,
        maxWaitMinute6to15: maxOf(sensible.waits), maxPaybackMinute6to15: maxOf(sensible.paybacks),
        minute6: sensible.snaps[360]
      },
      affordable: {
        marks: affordable.marks,
        maxPaybackMinute6to15: maxOf(affordable.paybacks),
        purchasesMinute6to15: affordable.paybacks.length,
        purchasesOver15Min: affordable.paybacks.filter(n => n > 15 * 60).length
      },
      measured: {
        marks: measured.marks,
        income: { 360: measured.snaps[360], 540: measured.snaps[540], 720: measured.snaps[720], 900: measured.snaps[900], 1200: measured.snaps[1200], 1500: measured.snaps[1500], 1800: measured.snaps[1800], 2400: measured.snaps[2400], 3600: measured.snaps[3600] },
        maxBestPayback8to15: measured.maxBestPayback8to15,
        maxBestPayback8to25: measured.maxBestPayback8to25,
        maxBestPayback15to60: measured.maxBestPayback15to60,
        purchaseGap15to60: measured.purchaseGap15to60,
        story1: measured.story1, story10: measured.story10,
        matShare: measured.matShare, earlyIncenseShare: measured.earlyIncenseShare, laneAt: measured.laneAt,
        beatGap: coverage(measured).max,
        timeline: coverage(measured).beats,
        bonuses: measured.bonuses.filter(function (b) { return b.at >= 480 && b.at <= 900 && (b.mark === 25 || b.mark === 50); })
      },
      human: {
        marks: human.marks,
        income: { 30: human.snaps[30], 180: human.snaps[180], 360: human.snaps[360], 540: human.snaps[540], 720: human.snaps[720], 900: human.snaps[900], 1200: human.snaps[1200], 1500: human.snaps[1500], 1800: human.snaps[1800], 2400: human.snaps[2400], 3600: human.snaps[3600] },
        maxBestPayback8to15: human.maxBestPayback8to15,
        maxBestPayback8to25: human.maxBestPayback8to25,
        maxBestPayback15to60: human.maxBestPayback15to60,
        purchaseGap15to60: human.purchaseGap15to60,
        story1: human.story1, story10: human.story10,
        matShare: human.matShare, earlyIncenseShare: human.earlyIncenseShare, laneAt: human.laneAt,
        beatGap: coverage(human).max,
        timeline: coverage(human).beats,
        bonuses: human.bonuses.filter(function (b) { return b.at >= 360 && b.at <= 900 && (b.mark === 25 || b.mark === 50); })
      }
    };
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
    const sensible = report.current.sensible;
    assert(sensible.marks[1000000] > 15 * 60 && sensible.marks[1000000] <= 40 * 60, 'sensible million stays after the opening quarter hour (' + Math.round(sensible.marks[1000000]) + 's)');
    assert(sensible.maxWaitMinute6to15 <= 120, 'minute 6 to 15 purchase wait (' + Math.round(sensible.maxWaitMinute6to15) + 's)');
    assert(sensible.maxPaybackMinute6to15 <= 20 * 60, 'minute 6 to 15 payback');
    assert(sensible.overtakenAt > 60 && sensible.overtakenAt < 360, 'stalls overtake a fast click after the opening');
    assert(sensible.minute6.income > sensible.minute6.hand, 'minute 6 stall income beats 10 clicks a second');
    const spend = report.current.affordable;
    assert(spend.marks[100000] < 15 * 60 && spend.marks[1000000] > 15 * 60 && spend.marks[1000000] <= 40 * 60, 'affordable buyer reaches 100K inside 15 minutes and a million after that (' + Math.round(spend.marks[1000000]) + 's)');
    assert(spend.purchasesMinute6to15 > 10 && spend.maxPaybackMinute6to15 <= 45 * 60, 'affordable buyer minute 6 to 15 purchase (' + Math.round(spend.maxPaybackMinute6to15) + 's)');
    const measured = report.current.measured;
    const humanPace = report.current.human;
    function doubled(list) { return list.some(function (b) { return b.mark === 25 || b.mark === 50; }); }
    assert(measured.maxBestPayback8to15 > 0 && measured.maxBestPayback8to15 <= 5 * 60, 'fast buyer minute 8 to 15 best payback stays under 5 minutes (' + Math.round(measured.maxBestPayback8to15) + 's)');
    assert(humanPace.maxBestPayback8to15 > 0 && humanPace.maxBestPayback8to15 <= 5 * 60, 'human buyer minute 8 to 15 best payback stays under 5 minutes (' + Math.round(humanPace.maxBestPayback8to15) + 's)');
    assert(measured.maxBestPayback8to25 > 0 && measured.maxBestPayback8to25 <= 12 * 60, 'fast buyer minute 8 to 25 best payback stays under 12 minutes (' + Math.round(measured.maxBestPayback8to25) + 's)');
    assert(humanPace.maxBestPayback8to25 > 0 && humanPace.maxBestPayback8to25 <= 12 * 60, 'human buyer minute 8 to 25 best payback stays under 12 minutes (' + Math.round(humanPace.maxBestPayback8to25) + 's)');
    assert(doubled(measured.bonuses), 'fast buyer still hits a 25 or 50 doubling from minute 8 to 15');
    assert(humanPace.bonuses.some(function (b) { return b.mark === 25; }) && humanPace.bonuses.some(function (b) { return b.mark === 50; }), 'human buyer still gets a 25 doubling and a 50 awning');
    for (const profile of report.current.profiles) assert(profile.snapshots[600].lifetime < 1000000, profile.profile + ' early rush');
    const active = report.current.profiles.find(p => p.profile === 'active');
    assert.equal(active.hireAt[0], 25, 'first vendor');
    assert(active.snapshots[1800].owned.filter(n => n > 0).length >= 4, 'four types at half an hour');
    for (const profile of report.current.profiles) {
      if (profile.profile === 'tea-only') continue;
      assert(profile.purchaseGap60 <= 120, profile.profile + ' purchase gap through minute 60 stays within two minutes (' + Math.round(profile.purchaseGap60) + 's)');
    }
    function lateOk(label, run) {
      const snap30 = run.income[1800], snap40 = run.income[2400], snap60 = run.income[3600];
      assert(run.purchaseGap15to60 <= 120, label + ' purchase gap from minute 15 to 60 stays within two minutes (' + Math.round(run.purchaseGap15to60) + 's)');
      assert(run.beatGap <= 8 * 60, label + ' named beat at least every 8 minutes from minute 15 to 60 (' + Math.round(run.beatGap) + 's)');
      assert(snap30 && snap30.topShare <= 0.70, label + ' top stall is at most 70% of income at minute 30 (' + (snap30 ? Math.round(snap30.topShare * 100) : 'none') + '%)');
      assert(snap60 && snap60.topShare <= 0.60, label + ' top stall is at most 60% of income at minute 60 (' + (snap60 ? Math.round(snap60.topShare * 100) : 'none') + '%)');
      assert(snap40 && snap60 && snap60.income >= snap40.income * 1.5, label + ' income keeps climbing from minute 40 to 60 (' + (snap40 ? Math.round(snap40.income) : 0) + ' to ' + (snap60 ? Math.round(snap60.income) : 0) + ')');
    }
    lateOk('fast buyer', measured);
    lateOk('human buyer', humanPace);
    function matWindow(label, run) {
      assert(run.story1 >= 20 * 60 && run.story1 <= 30 * 60, label + ' buys the first Story Mat between minute 20 and 30 (' + Math.round(run.story1) + 's)');
      assert(run.story10 >= 45 * 60 && run.story10 <= 55 * 60, label + ' reaches the finale between minute 45 and 55 (' + Math.round(run.story10) + 's)');
      var span = run.story10 - run.story1;
      assert(span >= 20 * 60 && span <= 25 * 60, label + ' takes 20 to 25 minutes from the first mat to the last (' + Math.round(span) + 's)');
      assert(run.matShare > 0 && run.matShare < 0.25, label + ' mats are a choice among other stalls (' + Math.round(run.matShare * 100) + '%)');
      assert(run.earlyIncenseShare < 0.5, label + ' minutes 10 to 16 are not only the incense tray (' + Math.round(run.earlyIncenseShare * 100) + '%)');
    }
    matWindow('fast buyer', measured);
    function laneBeforeFinale(label, run) {
      var lane = run.timeline.filter(function (b) { return b.name === 'The whole lane lights at 10'; })[0];
      var end = run.timeline.filter(function (b) { return b.name === "Old Wen's last chapter"; })[0];
      assert(lane && end && end.at - lane.at >= 60, label + ' lights the lane and only later tells the last chapter (' + (lane ? Math.round(lane.at) : 'none') + 's, ' + (end ? Math.round(end.at) : 'none') + 's)');
    }
    laneBeforeFinale('fast buyer', measured);
    laneBeforeFinale('human buyer', humanPace);
    matWindow('human buyer', humanPace);
    report.validation = 'passed';
  }
  console.log(JSON.stringify(report, null, 2));
}
