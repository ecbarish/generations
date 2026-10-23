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
      } else {
        // Include unaffordable choices: the saver waits instead of spending their reserve.
        for (var n = 0; n < 1000; n++) {
          var best = -1, payback = Infinity, count = 1, cost = 0;
          for (var j = 0; j < M.STALLS.length; j++) {
            if (!M.unlocked(state, j) || !state.stalls[j].hired) continue;
            var counts = [1], owned = state.stalls[j].owned;
            if (profile.policy === 'milestone') [10, 25, 50, 100, 150, 200, 300, 400].forEach(function (at) { if (at > owned) counts.push(at - owned); });
            counts.forEach(function (amount) {
              var stall = M.STALLS[j], price = stall.base * Math.pow(stall.growth, owned) * (Math.pow(stall.growth, amount) - 1) / (stall.growth - 1);
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

  /* Buying this copy must leave some next copy that still pays for itself within five minutes. */
  function keepsShortBuy(M, state, j, count) {
    var st = state.stalls[j];
    var owned = st.owned;
    st.owned = owned + count;
    var best = bestUnitPayback(M, state);
    st.owned = owned;
    return best <= 300;
  }

  function storyTarget(pace, minute) {
    /* Chapter 1 is the minute-20 choice. Later chapters stay under five minutes apart
       and the last one lands before minute 60, after the lane has already lit. */
    if (pace === 'fast') {
      if (minute < 20) return 0;
      return Math.min(10, Math.floor((minute - 20) / 4.15) + 1);
    }
    if (minute < 20.5) return 0;
    return Math.min(10, Math.floor((minute - 20.5) / 4.05) + 1);
  }

  function nextStoryPrice(M, state) {
    var n = state.stalls[5].owned;
    if (n >= 10) return 0;
    return M.STALLS[5].base * Math.pow(M.STALLS[5].growth, n);
  }

  function affordableOne(M, state, j) {
    if (!state.stalls[j] || !state.stalls[j].hired || !M.unlocked(state, j)) return false;
    var q = M.quote(state, j, 1);
    return q.count > 0 && keepsShortBuy(M, state, j, 1);
  }

  function closestBeat(M, state, reach, loose) {
    var marks = [25, 50, 100, 150, 200, 300, 400];
    var best = null, i, k, left, cost, income;
    income = M.income(state);
    reach = reach || 30;
    for (i = 0; i < 5; i++) {
      if (!state.stalls[i].hired) continue;
      for (k = 0; k < marks.length; k++) {
        left = marks[k] - state.stalls[i].owned;
        if (!(left > 0 && left <= reach) || !affordableOne(M, state, i)) continue;
        cost = M.quote(state, i, 1).cost;
        /* After the last chapter a doubling can cost more than twelve seconds.
           Skipping every one of them leaves the last ten minutes with no beat. */
        if (!loose && cost > 20000 && cost > income * 12) continue;
        if (!best || left < best.left || (left === best.left && cost < best.cost)) best = { j: i, left: left, cost: cost, mark: marks[k] };
      }
    }
    return best;
  }

  function cheapestKeep(M, state) {
    var best = -1, cost = Infinity, j, q;
    for (j = 0; j < 5; j++) {
      if (!affordableOne(M, state, j)) continue;
      q = M.quote(state, j, 1);
      if (q.cost < cost) { cost = q.cost; best = j; }
    }
    return best;
  }

  function sinceNamedBeat(beats, sec) {
    var last = 0, i;
    for (i = 0; i < beats.length; i++) if (beats[i].at <= sec && beats[i].at >= last) last = beats[i].at;
    return last > 0 ? sec - last : sec - 900;
  }

  /* After the opening, chase the next doubling and Old Wen's chapters.
     One stall's next copy stays inside five minutes, so the later evening does not go flat. */
  function eveningChoice(M, state, opts) {
    var pace = opts.pace;
    /* Mooncakes, then incense. The Story Mat is the next choice, around minute 20,
       so the stretch after minute 15 is not one more tray. */
    var steps = [{ j: 2, until: 25 }, { j: 3, until: 12 }, { j: 4, until: 10 }];
    var s, step, want, beat, fill, fillers, f, reserve;
    for (s = 0; s < steps.length; s++) {
      step = steps[s];
      if (state.stalls[step.j].owned >= step.until) continue;
      if (!state.stalls[step.j].hired || !affordableOne(M, state, step.j)) {
        if (opts.sinceBuy >= 90) return cheapestKeep(M, state);
        return -1;
      }
      return step.j;
    }
    want = storyTarget(pace, opts.minute);
    if (state.stalls[5].hired && state.stalls[5].owned < 10 && state.stalls[5].owned < want) {
      if (affordableOne(M, state, 5)) return 5;
      if (opts.sinceBeat >= 210) {
        beat = closestBeat(M, state, 30);
        if (beat) return beat.j;
      }
      if (opts.sinceBuy >= 90) return cheapestKeep(M, state);
      return -1;
    }
    if (opts.sinceBeat >= 210) {
      beat = closestBeat(M, state, state.stalls[5].owned >= 10 ? 60 : 30, state.stalls[5].owned >= 10);
      if (beat) return beat.j;
    }
    if (state.stalls[5].owned >= 10 && state.stalls[4].owned < 25 && affordableOne(M, state, 4)) return 4;
    fillers = pace === 'human'
      ? [{ j: 2, until: 50 }, { j: 3, until: 100 }, { j: 1, until: 100 }, { j: 0, until: 100 }, { j: 2, until: 100 }]
      : [{ j: 0, until: 150 }, { j: 2, until: 100 }, { j: 3, until: 100 }, { j: 1, until: 150 }, { j: 0, until: 200 }];
    reserve = state.stalls[5].hired && state.stalls[5].owned < 10 ? nextStoryPrice(M, state) : 0;
    for (f = 0; f < fillers.length; f++) {
      fill = fillers[f];
      if (state.stalls[fill.j].owned >= fill.until || !affordableOne(M, state, fill.j)) continue;
      if (reserve > 0 && state.cash - M.quote(state, fill.j, 1).cost < reserve) continue;
      return fill.j;
    }
    if (opts.sinceBuy >= 90) return cheapestKeep(M, state);
    return -1;
  }

  /* The fast buyer. Pouring uses the page's hold (every 120ms) while a stall still needs a vendor.
     Once a second it buys one copy of the affordable stall that pays for itself soonest.
     It does not tunnel into one stall while a doubling on another row is the better buy.
     From minute 15 it chases doublings and Old Wen, and it keeps a buy inside five minutes. */
  function playMeasured(M, durationSec) {
    var state = M.fresh();
    var limit = (durationSec || 960) * 1000;
    var marks = { 1000: null, 10000: null, 100000: null, 1000000: null };
    var snaps = {};
    var purchases = [];
    var bonuses = [];
    var beats = [];
    var bestPay = [];
    var ownedBefore = [0, 0, 0, 0, 0, 0];
    var story1 = null, story10 = null, lastBuy = 0;
    var HAND = 120, BUY = 1000, lastTick = 0, nextBuy = BUY;
    function noteBonuses(ms) {
      var prevOwned = ownedBefore.slice();
      noteBeats(M, state, ownedBefore, ms, beats);
      for (var i = 0; i < M.STALLS.length; i++) {
        var now = state.stalls[i].owned, prev = prevOwned[i];
        [10, 25, 50, 100, 150, 200, 300, 400].forEach(function (mark) {
          if (prev < mark && now >= mark) bonuses.push({ at: ms / 1000, stall: i, mark: mark });
        });
      }
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
        var best = Infinity, bestJ = -1, bestCost = 0, options = [];
        for (var j = 0; j < M.STALLS.length; j++) {
          if (!state.stalls[j].hired) continue;
          var seconds = M.paybackSeconds(state, j, 1);
          var cost = M.quote(state, j, 1).cost;
          options.push({ j: j, seconds: seconds, cost: cost });
          if (seconds < best) { best = seconds; bestJ = j; bestCost = cost; }
        }
        var pick = -1, pickPay = Infinity;
        // Through minute 15 the buyer spends on the best stall they can already afford.
        // After that they chase doublings and Old Wen, and they keep one buy inside five minutes.
        if (ms <= 900000) {
          for (var n = 0; n < options.length; n++) {
            var o = options[n];
            if (!(state.cash >= o.cost)) continue;
            if (o.seconds < pickPay) { pick = o.j; pickPay = o.seconds; }
          }
        } else {
          pick = eveningChoice(M, state, {
            pace: 'fast',
            minute: ms / 60000,
            sinceBuy: ms / 1000 - lastBuy,
            sinceBeat: sinceNamedBeat(beats, ms / 1000)
          });
          if (pick >= 0) pickPay = M.paybackSeconds(state, pick, 1);
        }
        if (pick >= 0 && M.buy(state, pick, 1).ok) {
          purchases.push({ at: ms / 1000, stall: pick, payback: pickPay });
          lastBuy = ms / 1000;
        }
        noteBonuses(ms);
        if (ms >= 480000 && ms <= limit && isFinite(best)) bestPay.push({ at: ms, seconds: best });
      } else noteBonuses(ms);
      if (story1 === null && state.stalls[5].owned >= 1) story1 = ms / 1000;
      if (story10 === null && state.stalls[5].owned >= 10) story10 = ms / 1000;
      [360, 450, 540, 720, 840, 900, 1200, 1500, 1800, 2400, 3000, 3600].forEach(function (sec) {
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
    var moonTimes = [];
    purchases.forEach(function (p) { if (p.stall === 3 && (moonTimes.length === 0 || p.at !== moonTimes[moonTimes.length - 1])) moonTimes.push(p.at); });
    var moonGaps = [];
    for (var g = 1; g < moonTimes.length; g++) moonGaps.push(moonTimes[g] - moonTimes[g - 1]);
    var windowBonuses = bonuses.filter(function (b) { return b.at >= 480 && b.at <= 900; });
    var bonusGaps = [];
    for (var b = 1; b < windowBonuses.length; b++) bonusGaps.push(windowBonuses[b].at - windowBonuses[b - 1].at);
    function maxBetween(fromMs, toMs) {
      return bestPay.reduce(function (m, row) {
        return row.at >= fromMs && row.at <= toMs ? Math.max(m, row.seconds) : m;
      }, 0);
    }
    return {
      marks: marks, snaps: snaps, purchases: purchases, bonuses: bonuses, beats: beats, bonusGaps: bonusGaps,
      moonTimes: moonTimes, moonGaps: moonGaps, bestPay: bestPay, state: state,
      story1: story1, story10: story10,
      maxBestPayback8to15: maxBetween(480000, 900000),
      maxBestPayback8to25: maxBetween(480000, 1500000),
      maxBestPayback15to60: maxBetween(900000, 3600000),
      purchaseGap15to60: purchaseGap(purchases, 900, 3600).max
    };
  }

  /* A desktop player, about half the fast buyer's pace on the old curve.
     Real clicks: one pour every 1.2s (25 cups and 0 coins a second at 0:30).
     One purchase every 7s, and only when it pays for itself within 6 minutes,
     unless that copy is walking into a doubling at 25, 50 or 100. */
  function playHuman(M, durationSec) {
    var state = M.fresh();
    var limit = (durationSec || 960) * 1000;
    var marks = { 1000: null, 10000: null, 100000: null, 1000000: null };
    var snaps = {};
    var bonuses = [];
    var beats = [];
    var purchases = [];
    var bestPay = [];
    var ownedBefore = [0, 0, 0, 0, 0, 0];
    var story1 = null, story10 = null, lastBuy = 0;
    var POUR = 1200, BUY = 7000, lastTick = 0, nextPour = POUR, nextBuy = 30000;
    function chasing(owned) {
      return [25, 50, 100, 150, 200, 300, 400].some(function (mark) {
        var left = mark - owned;
        return left > 0 && left <= 12;
      });
    }
    for (var ms = 40; ms <= limit; ms += 40) {
      if (ms + 1e-6 >= nextPour) {
        nextPour += POUR;
        for (var i = 0; i < M.STALLS.length; i++) {
          if (!M.unlocked(state, i)) break;
          if (state.stalls[i].hired) continue;
          if (M.canHire(state, i)) M.hire(state, i);
          else M.handSell(state, i);
          break;
        }
      }
      M.addCash(state, M.income(state) * (ms - lastTick) / 1000);
      lastTick = ms;
      var best = Infinity;
      if (ms + 1e-6 >= nextBuy) {
        nextBuy += BUY;
        var options = [];
        for (var j = 0; j < M.STALLS.length; j++) {
          if (!state.stalls[j].hired) continue;
          var seconds = M.paybackSeconds(state, j, 1);
          options.push({ j: j, seconds: seconds, cost: M.quote(state, j, 1).cost });
          if (seconds < best) best = seconds;
        }
        var pick = -1, pickPay = Infinity;
        // Through minute 20 this is the same buyer as the opening: six minutes, or a doubling within 12.
        if (ms <= 900000) {
          for (var n = 0; n < options.length; n++) {
            var o = options[n];
            if (!(state.cash >= o.cost)) continue;
            if (o.seconds > 360 && !chasing(state.stalls[o.j].owned)) continue;
            if (o.seconds < pickPay) { pick = o.j; pickPay = o.seconds; }
          }
        } else {
          pick = eveningChoice(M, state, {
            pace: 'human',
            minute: ms / 60000,
            sinceBuy: ms / 1000 - lastBuy,
            sinceBeat: sinceNamedBeat(beats, ms / 1000)
          });
          if (pick >= 0) pickPay = M.paybackSeconds(state, pick, 1);
        }
        if (pick >= 0 && M.buy(state, pick, 1).ok) {
          purchases.push({ at: ms / 1000, stall: pick, payback: pickPay });
          lastBuy = ms / 1000;
        }
        var prevOwned = ownedBefore.slice();
        noteBeats(M, state, ownedBefore, ms, beats);
        for (var b = 0; b < M.STALLS.length; b++) {
          var now = state.stalls[b].owned, prev = prevOwned[b];
          [10, 25, 50, 100, 150, 200, 300, 400].forEach(function (mark) {
            if (prev < mark && now >= mark) bonuses.push({ at: ms / 1000, stall: b, mark: mark });
          });
        }
        if (ms >= 480000 && ms <= limit && isFinite(best)) bestPay.push({ at: ms, seconds: best });
      }
      if (story1 === null && state.stalls[5].owned >= 1) story1 = ms / 1000;
      if (story10 === null && state.stalls[5].owned >= 10) story10 = ms / 1000;
      [30, 180, 360, 540, 720, 900, 1200, 1500, 1800, 2400, 3000, 3600].forEach(function (sec) {
        if (!snaps[sec] && ms + 1e-6 >= sec * 1000) {
          var line = Infinity;
          for (var k = 0; k < M.STALLS.length; k++) {
            if (!state.stalls[k].hired) continue;
            line = Math.min(line, M.paybackSeconds(state, k, 1));
          }
          snaps[sec] = {
            income: M.income(state),
            cash: state.cash,
            lifetime: state.lifetime,
            owned: state.stalls.map(function (s) { return s.owned; }),
            bestPayback: line,
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
    return {
      marks: marks, snaps: snaps, purchases: purchases, bonuses: bonuses, beats: beats, bestPay: bestPay, state: state,
      story1: story1, story10: story10,
      maxBestPayback8to15: maxBetween(480000, 900000),
      maxBestPayback8to25: maxBetween(480000, 1500000),
      maxBestPayback15to60: maxBetween(900000, 3600000),
      purchaseGap15to60: purchaseGap(purchases, 900, 3600).max
    };
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
    assert(sensible.maxWaitMinute6to15 <= 90, 'minute 6 to 15 purchase wait');
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
    assert(measured.maxBestPayback8to25 > 0 && measured.maxBestPayback8to25 <= 5 * 60, 'fast buyer minute 8 to 25 best payback stays under 5 minutes (' + Math.round(measured.maxBestPayback8to25) + 's)');
    assert(humanPace.maxBestPayback8to25 > 0 && humanPace.maxBestPayback8to25 <= 5 * 60, 'human buyer minute 8 to 25 best payback stays under 5 minutes (' + Math.round(humanPace.maxBestPayback8to25) + 's)');
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
      assert(run.maxBestPayback15to60 > 0 && run.maxBestPayback15to60 <= 5 * 60, label + ' best payback from minute 15 to 60 stays under 5 minutes (' + Math.round(run.maxBestPayback15to60) + 's)');
      assert(run.purchaseGap15to60 <= 120, label + ' purchase gap from minute 15 to 60 stays within two minutes (' + Math.round(run.purchaseGap15to60) + 's)');
      assert(run.beatGap <= 5 * 60, label + ' named beat at least every 5 minutes from minute 15 to 60 (' + Math.round(run.beatGap) + 's)');
      assert(snap30 && snap30.topShare <= 0.70, label + ' top stall is at most 70% of income at minute 30 (' + (snap30 ? Math.round(snap30.topShare * 100) : 'none') + '%)');
      assert(snap60 && snap60.topShare <= 0.60, label + ' top stall is at most 60% of income at minute 60 (' + (snap60 ? Math.round(snap60.topShare * 100) : 'none') + '%)');
      assert(snap40 && snap60 && snap60.income >= snap40.income * 3, label + ' income at least triples from minute 40 to 60 (' + (snap40 ? Math.round(snap40.income) : 0) + ' to ' + (snap60 ? Math.round(snap60.income) : 0) + ')');
    }
    lateOk('fast buyer', measured);
    lateOk('human buyer', humanPace);
    assert(measured.story1 >= 18 * 60 && measured.story1 <= 26 * 60, 'fast buyer buys the first Story Mat around minute 20 (' + Math.round(measured.story1) + 's)');
    function laneBeforeFinale(label, run) {
      var lane = run.timeline.filter(function (b) { return b.name === 'The whole lane lights at 10'; })[0];
      var end = run.timeline.filter(function (b) { return b.name === "Old Wen's last chapter"; })[0];
      assert(lane && end && end.at - lane.at >= 60, label + ' lights the lane and only later tells the last chapter (' + (lane ? Math.round(lane.at) : 'none') + 's, ' + (end ? Math.round(end.at) : 'none') + 's)');
    }
    laneBeforeFinale('fast buyer', measured);
    laneBeforeFinale('human buyer', humanPace);
    assert(humanPace.story10 >= 50 * 60 && humanPace.story10 <= 60 * 60, 'human buyer reaches Old Wen\'s last chapter between minute 50 and 60 (' + Math.round(humanPace.story10) + 's)');
    report.validation = 'passed';
  }
  console.log(JSON.stringify(report, null, 2));
}
