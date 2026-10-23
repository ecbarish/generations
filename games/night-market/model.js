/* Night Market Stalls (IDLE-NM1). NM-PACING claimed by Grok on 2026-10-23.
   Rules only: no page, no storage.
   Load shared/engine.js and shared/idle-core.js first.
   Shared milestones double at 25, 50 and 100. That doubling is the beat a player feels.
   Hiring is a person who runs stalls you have already worked. It is not a bonus. */
(function () {
  'use strict';

  var SAVE_KEY = 'night-market-save-v1';
  var SAVE_VERSION = 1;
  var OFFLINE_CAP = 4 * 3600;
  var OFFLINE_RATE = 0.5;
  var UNLOCK_AT = 10;

  /* Hand work pays 1 coin. Growth stays between 1.05 and 1.15.
     Tea grows at 1.07 so the cup after the fifty-stall awning is still a short wait.
     Dumplings grow at 1.06 so the cart does not climb from a minute and a half toward nine.
     From minute 8 to 25 the soonest payback stays under about five minutes.
     The Incense Tray opens at twelve mooncake tables and pays for itself in about a minute and a half,
     so coins saved past the quarter hour have somewhere to go. */
  var STALLS = [
    {
      id: 'tea', name: 'Tea Stall', vendor: 'Mei',
      habit: 'Mei opens before the lanterns are lit.',
      serve: 'Pour a cup', left: 'cup', lefts: 'cups', hire: 'Ask Mei to take the stall',
      base: 6, growth: 1.07, rate: 0.45, serves: 25, hand: 1,
      looks: ['One lantern', 'Two lanterns', 'A striped awning', 'A crowd at the cups'],
      gossip: 'Mei says the regulars were waiting in the dark.',
      next: 'Bo brings the Dumpling Cart once ten tea stalls are pouring.'
    },
    {
      id: 'dumpling', name: 'Dumpling Cart', vendor: 'Bo',
      habit: 'Bo talks while he folds, and regulars stay to listen.',
      serve: 'Fold a dumpling', left: 'dumpling', lefts: 'dumplings', hire: 'Ask Bo to take the cart',
      base: 80, growth: 1.06, rate: 0.9, serves: 12, hand: 1,
      looks: ['One steamer', 'Two steamers', 'A cloth awning', 'A queue down the lane'],
      gossip: 'Bo says he talked the whole time, and the dumplings still sold.',
      next: 'An brings the Lantern Stand once ten carts are folding.'
    },
    {
      id: 'lantern', name: 'Lantern Stand', vendor: 'An',
      habit: 'An trims each wick until the flame sits still.',
      serve: 'Light a lantern', left: 'lantern', lefts: 'lanterns', hire: 'Ask An to take the stand',
      base: 700, growth: 1.07, rate: 5, serves: 10, hand: 1,
      looks: ['One pole', 'A pair of poles', 'A string of lamps', 'The alley lit'],
      gossip: 'An says the wicks burned clean the whole time.',
      next: 'Qiao brings the Mooncake Table once ten stands are lit.'
    },
    {
      id: 'mooncake', name: 'Mooncake Table', vendor: 'Qiao',
      habit: 'Qiao counts the tins twice, then parts with the one she likes least.',
      serve: 'Wrap a mooncake', left: 'mooncake', lefts: 'mooncakes', hire: 'Ask Qiao to take the table',
      base: 6400, growth: 1.05, rate: 40, serves: 8, hand: 1,
      looks: ['One stack of tins', 'Two stacks of tins', 'A painted sign', 'Tins along the table'],
      gossip: 'Qiao says she counted the tins twice, and they still sold.',
      next: 'Ren brings the Incense Tray once twelve tables are wrapping.'
    },
    {
      id: 'incense', name: 'Incense Tray', vendor: 'Ren',
      habit: 'Ren lights one stick for the stall and one for the alley.',
      serve: 'Light a stick', left: 'stick', lefts: 'sticks', hire: 'Ask Ren to take the tray',
      base: 52380, growth: 1.05, rate: 540, serves: 8, hand: 1, unlockAt: 12,
      looks: ['One tray', 'Two trays', 'A bronze stand', 'Smoke you can see from the gate'],
      gossip: 'Ren says the alley smelled of smoke before anyone arrived.',
      next: 'Old Wen unrolls the Story Mat once ten trays are burning.'
    },
    {
      id: 'stories', name: 'Story Mat', vendor: 'Old Wen',
      habit: 'Old Wen stops just before the ending. The crowd pays to hear the rest.',
      serve: 'Tell a piece of the story', left: 'piece of the story', lefts: 'pieces of the story', hire: 'Ask Old Wen to take the mat',
      base: 2500000, growth: 1.15, rate: 220, serves: 6, hand: 1,
      looks: ['One cushion', 'Two cushions', 'A paper screen', 'Listeners sitting in the lane'],
      gossip: 'Old Wen says he reached the ending, then started again.',
      next: ''
    }
  ];

  function fresh() {
    return {
      cash: 0,
      lifetime: 0,
      seen: null,
      bulk: 1,
      stalls: STALLS.map(function () { return { owned: 0, serves: 0, hired: false }; })
    };
  }

  function spec(i) { return STALLS[i] || null; }

  /* A stall can ask for more than the usual ten of the one before it. Incense waits for twelve tables. */
  function unlockNeed(i) {
    var stall = spec(i);
    return stall && stall.unlockAt ? stall.unlockAt : UNLOCK_AT;
  }

  function unlocked(state, i) {
    if (!spec(i)) return false;
    if (i === 0) return true;
    return state.stalls[i - 1].owned >= unlockNeed(i);
  }

  function lookIndex(owned) {
    if (owned >= 100) return 3;
    if (owned >= 50) return 2;
    if (owned >= 25) return 1;
    return 0;
  }

  /* 25, 50 and 100 each double the row again. That doubling is the beat a player feels. */
  function stallMult(owned) {
    return Idle.milestoneMult(owned);
  }

  function timesWord(owned) {
    var m = stallMult(owned);
    if (m >= 16) return 'sixteen times as much';
    if (m >= 8) return 'eight times as much';
    if (m >= 4) return 'four times as much';
    if (m >= 2) return 'twice as much';
    return 'what one stall earns';
  }

  function production(state, i) {
    var st = state.stalls[i];
    if (!st || !st.hired || !(st.owned > 0)) return 0;
    return spec(i).rate * st.owned * stallMult(st.owned);
  }

  function income(state) {
    var n = 0;
    for (var i = 0; i < STALLS.length; i++) n += production(state, i);
    return n;
  }

  function addCash(state, amount) {
    if (!(amount > 0) || !isFinite(amount)) return 0;
    state.cash += amount;
    state.lifetime += amount;
    return amount;
  }

  function handSell(state, i) {
    if (!unlocked(state, i)) return { ok: false, reason: 'closed' };
    var stall = spec(i);
    state.stalls[i].serves += 1;
    addCash(state, stall.hand);
    return {
      ok: true,
      ready: !state.stalls[i].hired && state.stalls[i].serves >= stall.serves
    };
  }

  function canHire(state, i) {
    if (!unlocked(state, i) || state.stalls[i].hired) return false;
    return state.stalls[i].serves >= spec(i).serves;
  }

  function hire(state, i) {
    if (!unlocked(state, i)) return { ok: false, reason: 'closed' };
    if (state.stalls[i].hired) return { ok: false, reason: 'hired' };
    if (state.stalls[i].serves < spec(i).serves) {
      return { ok: false, reason: 'serves', need: spec(i).serves - state.stalls[i].serves };
    }
    state.stalls[i].hired = true;
    return { ok: true };
  }

  function quote(state, i, mode) {
    if (!spec(i)) return { count: 0, cost: 0, blocked: 'closed' };
    var stall = spec(i);
    var owned = state.stalls[i].owned;
    var one = Idle.bulkCost(stall.base, stall.growth, owned, 1);
    if (!state.stalls[i].hired) return { count: 0, cost: one, blocked: 'hire' };
    if (!unlocked(state, i)) return { count: 0, cost: one, blocked: 'closed' };
    var n, cost;
    if (mode === 'max') {
      n = Idle.maxAffordable(stall.base, stall.growth, owned, state.cash);
      cost = n > 0 ? Idle.bulkCost(stall.base, stall.growth, owned, n) : one;
      return { count: n, cost: cost, blocked: n > 0 ? null : 'cost' };
    }
    n = mode === 10 || mode === '10' ? 10 : 1;
    cost = Idle.bulkCost(stall.base, stall.growth, owned, n);
    if (!(cost >= 0) || cost > state.cash) return { count: 0, cost: cost, blocked: 'cost' };
    return { count: n, cost: cost, blocked: null };
  }

  function buy(state, i, mode) {
    var q = quote(state, i, mode);
    return buyExact(state, i, q.count);
  }

  /* Spends exactly `count`, priced the same way quote() priced that many.
     The button stores that count at render; a later income tick must not buy a different number. */
  function buyExact(state, i, count) {
    if (!spec(i) || !state.stalls[i] || !state.stalls[i].hired || !unlocked(state, i)) {
      return { ok: false, reason: 'closed', count: 0, cost: 0 };
    }
    count = Math.floor(count);
    var stall = spec(i);
    var cost = count > 0 ? Idle.bulkCost(stall.base, stall.growth, state.stalls[i].owned, count) : 0;
    if (!(count > 0) || !(cost >= 0) || cost > state.cash) return { ok: false, reason: 'cost', count: 0, cost: cost };
    state.cash -= cost;
    if (state.cash < 1e-6) state.cash = 0;
    state.stalls[i].owned += count;
    return { ok: true, count: count, cost: cost };
  }

  /* Payback is the price of the selected quantity divided by the income those stalls add.
     A tenth or a twenty-fifth can add more than one stall's rate, because the whole row doubles. */
  function paybackSeconds(state, i, count) {
    var stall = spec(i);
    var st = state.stalls && state.stalls[i];
    if (!stall || !st || !st.hired) return Infinity;
    var n = count > 0 ? Math.floor(count) : 1;
    var cost = Idle.bulkCost(stall.base, stall.growth, st.owned, n);
    var owned = st.owned > 0 ? st.owned : 0;
    var before = stall.rate * owned * stallMult(owned);
    var afterOwned = owned + n;
    var added = stall.rate * afterOwned * stallMult(afterOwned) - before;
    if (!(cost > 0) || !(added > 0) || !isFinite(cost) || !isFinite(added)) return Infinity;
    return cost / added;
  }

  function buyCount(state, i) {
    var mode = state && state.bulk;
    if (mode === 'max') {
      var q = quote(state, i, 'max');
      return q.count > 0 ? q.count : 1;
    }
    if (mode === 10 || mode === '10') return 10;
    return 1;
  }

  function paybackLabel(seconds) {
    if (!(seconds > 0) || !isFinite(seconds)) return '';
    if (seconds >= 60) return Arcade.fmtTime(Math.round(seconds));
    return Math.max(1, Math.round(seconds)) + 's'; // whole seconds: "22s", never "22.0s" (playtest fix)
  }

  function paybackLine(state, i) {
    var stall = spec(i);
    if (!stall) return '';
    var n = buyCount(state, i);
    var label = paybackLabel(paybackSeconds(state, i, n));
    if (!label) return stall.vendor + ' is running this stall.';
    if (n === 1) return 'The next one pays for itself in ' + label + '.';
    return n + ' more pay for themselves in ' + label + '.';
  }

  function awayRule() {
    return 'While away: earns ' + Math.round(OFFLINE_RATE * 100) + '%, up to ' + (OFFLINE_CAP / 3600) + 'h';
  }

  function secondsToNext(state) {
    var rate = income(state);
    if (!(rate > 0)) return Infinity;
    var best = Infinity;
    for (var i = 0; i < STALLS.length; i++) {
      if (!state.stalls[i].hired) continue;
      var one = Idle.bulkCost(spec(i).base, spec(i).growth, state.stalls[i].owned, 1);
      if (one > 0 && isFinite(one)) best = Math.min(best, one / rate);
    }
    return best;
  }

  function pluralStall(name, n) { return n === 1 ? name : name + 's'; }

  /* The soonest tenth, twenty-fifth, fiftieth or hundredth still ahead.
     skipAt lets an unlock line point at a different, larger bonus. */
  function nextBonus(state, skipI, skipAt) {
    var best = null, i, k, marks, left;
    for (i = 0; i < STALLS.length; i++) {
      if (!state.stalls[i].hired) continue;
      marks = [10, 25, 50, 100];
      for (k = 0; k < marks.length; k++) {
        if (state.stalls[i].owned >= marks[k]) continue;
        if (i === skipI && marks[k] === skipAt) continue;
        left = marks[k] - state.stalls[i].owned;
        if (!best || left < best.left) best = { i: i, at: marks[k], left: left };
        break;
      }
    }
    return best;
  }

  function bonusSentence(bonus) {
    if (!bonus) return '';
    var name = spec(bonus.i).name;
    return 'Next bonus: ' + bonus.at + ' ' + pluralStall(name, bonus.at) + ', x2.';
  }

  function withBonus(sentence, bonus) {
    var extra = bonusSentence(bonus);
    return extra ? sentence + ' ' + extra : sentence;
  }

  function goal(state) {
    var i, stall, left, bonus;
    for (i = 0; i < STALLS.length; i++) {
      if (!unlocked(state, i) || state.stalls[i].hired) continue;
      stall = spec(i);
      if (state.stalls[i].serves >= stall.serves) return stall.vendor + ' will take the ' + stall.name + ' whenever you ask.';
      left = stall.serves - state.stalls[i].serves;
      if (i === 0 && state.stalls[i].serves === 0) return 'Hold to pour. ' + left + ' more ' + stall.lefts + ', then ' + stall.vendor + ' will take the stall.';
      return left + ' more ' + (left === 1 ? stall.left : stall.lefts) + ' to do yourself. Then ' + stall.vendor + ' will take it.';
    }
    for (i = 0; i < STALLS.length; i++) {
      if (!state.stalls[i].hired || state.stalls[i].owned > 0) continue;
      if (!(quote(state, i, 1).count > 0)) return 'Buy the first ' + spec(i).name + '. ' + spec(i).vendor + ' will run it.';
    }
    for (i = 0; i < STALLS.length - 1; i++) {
      if (!state.stalls[i].hired) continue;
      var need = unlockNeed(i + 1);
      if (state.stalls[i].owned >= need) continue;
      left = need - state.stalls[i].owned;
      bonus = nextBonus(state, i, need);
      return withBonus((left === 1 ? 'One more ' : left + ' more ') + spec(i).name.toLowerCase() + (left === 1 ? '' : 's') + '. ' + spec(i).next, bonus);
    }
    bonus = nextBonus(state);
    if (bonus) {
      stall = spec(bonus.i);
      return withBonus((bonus.left === 1 ? 'One more ' : bonus.left + ' more ') + stall.name.toLowerCase() + (bonus.left === 1 ? '' : 's') + '.', bonus);
    }
    return 'Every stall has a crowd. The lane is as bright as it gets tonight.';
  }

  function lookLine(state, i) {
    var owned = state.stalls[i].owned;
    var stall = spec(i);
    if (!state.stalls[i].hired) return '';
    if (owned <= 0) return stall.vendor + ' is here, waiting for the first one.';
    var look = stall.looks[lookIndex(owned)];
    if (stallMult(owned) <= 1) return look + '.';
    return look + '. It earns ' + timesWord(owned) + '.';
  }

  function gossipLine(state) {
    for (var i = STALLS.length - 1; i >= 0; i--) {
      if (state.stalls[i].hired) return spec(i).gossip;
    }
    return 'The lane was quiet.';
  }

  function awayCopy(summary) {
    var lead = 'You were gone ' + Arcade.fmtTime(summary.away) + '.';
    if (summary.capped) lead += ' The box only holds four hours, so ' + Arcade.fmtTime(summary.credited) + ' counted.';
    else lead += ' The stalls kept ' + Arcade.fmtTime(summary.credited) + ' of it.';
    lead += ' While away, stalls earn ' + Math.round(OFFLINE_RATE * 100) + '%.';
    var box = summary.gained > 0
      ? Arcade.fmt(summary.gained) + ' coins are in the box.'
      : 'The box is empty. Nothing was earning while you were gone.';
    return { title: 'While you were away', lead: lead, box: box };
  }

  function setBulk(state, mode) {
    state.bulk = mode === 'max' ? 'max' : mode === 10 || mode === '10' ? 10 : 1;
    return state.bulk;
  }

  function valid(o) {
    if (!o || o.v !== SAVE_VERSION || o.game !== 'night-market' || !Array.isArray(o.stalls) || o.stalls.length !== STALLS.length) return false;
    if (!isFinite(o.cash) || o.cash < 0 || !isFinite(o.lifetime) || o.lifetime < 0) return false;
    for (var i = 0; i < o.stalls.length; i++) {
      var s = o.stalls[i];
      if (!s || !isFinite(s.owned) || !isFinite(s.serves) || s.owned < 0 || s.serves < 0) return false;
    }
    return true;
  }

  function serialize(state, seen) {
    return {
      v: SAVE_VERSION,
      game: 'night-market',
      cash: state.cash,
      lifetime: state.lifetime,
      seen: typeof seen === 'number' ? seen : state.seen,
      bulk: state.bulk,
      stalls: state.stalls.map(function (s) {
        return { owned: s.owned, serves: s.serves, hired: !!s.hired };
      })
    };
  }

  function restore(o) {
    var state = fresh();
    if (!valid(o)) return state;
    state.cash = o.cash;
    state.lifetime = o.lifetime;
    state.seen = typeof o.seen === 'number' && isFinite(o.seen) ? o.seen : null;
    state.bulk = setBulk(state, o.bulk);
    o.stalls.forEach(function (s, i) {
      state.stalls[i].owned = Math.floor(s.owned);
      state.stalls[i].serves = Math.floor(s.serves);
      state.stalls[i].hired = !!s.hired;
    });
    return state;
  }

  /* The game and the checks share this, so the cap and the half rate cannot drift. */
  function createIdle(state, save) {
    return Idle.create({
      getRate: function () { return income(state); },
      apply: function (amount) { addCash(state, amount); },
      maxOfflineSec: OFFLINE_CAP,
      offlineRate: OFFLINE_RATE,
      title: { label: 'Night Market', unit: '' },
      save: function (seen) {
        state.seen = seen;
        if (typeof save === 'function') save(serialize(state, seen));
      }
    });
  }

  window.NightMarket = {
    STALLS: STALLS,
    SAVE_KEY: SAVE_KEY,
    SAVE_VERSION: SAVE_VERSION,
    OFFLINE_CAP: OFFLINE_CAP,
    OFFLINE_RATE: OFFLINE_RATE,
    UNLOCK_AT: UNLOCK_AT,
    fresh: fresh,
    unlocked: unlocked,
    income: income,
    production: production,
    addCash: addCash,
    handSell: handSell,
    canHire: canHire,
    hire: hire,
    quote: quote,
    buy: buy,
    buyExact: buyExact,
    secondsToNext: secondsToNext,
    stallMult: stallMult,
    paybackSeconds: paybackSeconds,
    paybackLine: paybackLine,
    paybackLabel: paybackLabel,
    awayRule: awayRule,
    goal: goal,
    lookLine: lookLine,
    gossipLine: gossipLine,
    awayCopy: awayCopy,
    setBulk: setBulk,
    valid: valid,
    serialize: serialize,
    restore: restore,
    createIdle: createIdle
  };
})();
