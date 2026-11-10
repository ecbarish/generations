/* Patent Pending rules. No page, no storage.
   Load shared/engine.js, shared/idle-core.js, then data.js.
   Clerks earn through Idle.create. A stamp files by hand only while the
   chosen invention has no clerk. After that, four quick stamps boost it. */
(function () {
  'use strict';

  var D = window.PatentData;
  var INVENTIONS = D.INVENTIONS;
  var UPGRADES = D.UPGRADES;
  var GOALS = D.GOALS;
  var ACHIEVEMENTS = D.ACHIEVEMENTS;
  var SAVE_KEY = 'patent-pending-save-v1';
  var SAVE_VERSION = 1;
  var N = INVENTIONS.length;
  var COMBO_WINDOW = 1500;
  var COMBO_NEED = 4;
  var BOOST_MS = 8000;
  var BASE_AWAY_HOURS = 4;
  var SEAL_RATE = 0.02;
  var KEEP = [
    'Charter seals and the bonus they give',
    'Achievements',
    'How far the goal list has been read',
    'The return streak',
    'The sound setting',
    'Fees you have ever filed'
  ];
  var LOSE = [
    'Fees in the drawer',
    'Every invention and its count',
    'Every clerk',
    'Every improvement, including the night ledger',
    'A stamp combo in progress'
  ];

  function fresh() {
    var owned = [];
    var clerk = [];
    var progress = [];
    var running = [];
    for (var i = 0; i < N; i++) {
      owned.push(i === 0 ? 1 : 0);
      clerk.push(false);
      progress.push(0);
      running.push(false);
    }
    return {
      v: SAVE_VERSION,
      cash: 0,
      lifetime: 0,
      seals: 0,
      charters: 0,
      owned: owned,
      clerk: clerk,
      progress: progress,
      running: running,
      up: {},
      ach: {},
      goal: 0,
      stamps: 0,
      boosts: 0,
      combo: 0,
      lastStamp: 0,
      boostUntil: 0,
      boostIndex: 0,
      boostTold: false,
      leftAt: 0,
      cashAtLeave: 0,
      selected: 0,
      bulk: 1,
      sound: 1,
      coachOff: false,
      introduced: false,
      streak: 0,
      day: '',
      seen: null,
      play: 0
    };
  }

  function valid(o) {
    return !!(o && o.game === 'patent-pending' && o.v === SAVE_VERSION &&
      typeof o.cash === 'number' && isFinite(o.cash) &&
      Array.isArray(o.owned) && o.owned.length === N &&
      Array.isArray(o.clerk) && o.clerk.length === N);
  }

  function copyMap(src) {
    var out = {};
    if (!src) return out;
    Object.keys(src).forEach(function (k) { if (src[k]) out[k] = true; });
    return out;
  }

  function serialize(state, seen) {
    return {
      v: SAVE_VERSION,
      game: 'patent-pending',
      cash: state.cash,
      lifetime: state.lifetime,
      seals: state.seals,
      charters: state.charters,
      owned: state.owned.slice(),
      clerk: state.clerk.map(function (c) { return !!c; }),
      progress: state.progress.slice(),
      running: state.running.map(function (r) { return !!r; }),
      up: copyMap(state.up),
      ach: copyMap(state.ach),
      goal: state.goal,
      stamps: state.stamps,
      boosts: state.boosts,
      combo: state.combo,
      lastStamp: state.lastStamp,
      boostUntil: state.boostUntil,
      boostIndex: state.boostIndex,
      boostTold: !!state.boostTold,
      leftAt: state.leftAt || 0,
      cashAtLeave: state.cashAtLeave || 0,
      selected: state.selected,
      bulk: state.bulk,
      sound: state.sound,
      coachOff: !!state.coachOff,
      introduced: !!state.introduced,
      streak: state.streak,
      day: state.day || '',
      seen: typeof seen === 'number' ? seen : state.seen,
      play: state.play
    };
  }

  function num(n, fallback) {
    return typeof n === 'number' && isFinite(n) ? n : fallback;
  }

  function restore(o) {
    var state = fresh();
    if (!valid(o)) return state;
    state.cash = o.cash;
    state.lifetime = num(o.lifetime, o.cash);
    state.seals = Math.max(0, Math.floor(num(o.seals, 0)));
    state.charters = Math.max(0, Math.floor(num(o.charters, 0)));
    for (var i = 0; i < N; i++) {
      state.owned[i] = Math.max(0, Math.floor(num(o.owned[i], 0)));
      state.clerk[i] = !!o.clerk[i];
      state.progress[i] = Math.max(0, num(o.progress && o.progress[i], 0));
      state.running[i] = !!(o.running && o.running[i]) && !state.clerk[i];
    }
    state.up = copyMap(o.up);
    state.ach = copyMap(o.ach);
    state.goal = Math.max(0, Math.min(GOALS.length, Math.floor(num(o.goal, 0))));
    state.stamps = Math.max(0, Math.floor(num(o.stamps, 0)));
    state.boosts = Math.max(0, Math.floor(num(o.boosts, 0)));
    state.combo = Math.max(0, Math.floor(num(o.combo, 0)));
    state.lastStamp = num(o.lastStamp, 0);
    state.boostUntil = num(o.boostUntil, 0);
    state.boostIndex = Math.max(0, Math.min(N - 1, Math.floor(num(o.boostIndex, 0))));
    state.boostTold = !!o.boostTold;
    state.leftAt = num(o.leftAt, 0);
    state.cashAtLeave = num(o.cashAtLeave, 0);
    state.selected = Math.max(0, Math.min(N - 1, Math.floor(num(o.selected, 0))));
    state.bulk = o.bulk === 10 || o.bulk === 0 ? o.bulk : 1;
    state.sound = o.sound === 0 || o.sound === 2 ? o.sound : 1;
    state.coachOff = !!o.coachOff;
    state.introduced = !!o.introduced;
    state.streak = Math.max(0, Math.floor(num(o.streak, 0)));
    state.day = typeof o.day === 'string' ? o.day : '';
    state.seen = typeof o.seen === 'number' && isFinite(o.seen) ? o.seen : null;
    state.play = Math.max(0, num(o.play, 0));
    return state;
  }

  function replaceState(state, next) {
    Object.keys(state).forEach(function (k) { delete state[k]; });
    Object.keys(next).forEach(function (k) { state[k] = next[k]; });
  }

  function localDay(date) {
    var d = date || new Date();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function previousDay(day) {
    var parts = day.split('-');
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() - 1);
    return localDay(d);
  }

  function rollDay(state, today) {
    if (state.day === today) return { changed: false, first: false, streak: state.streak };
    var prev = state.day;
    var first = !prev;
    state.streak = prev === previousDay(today) ? (state.streak || 1) + 1 : 1;
    state.day = today;
    return { changed: !first, first: first, streak: state.streak };
  }

  function hashDay(day) {
    var h = 2166136261;
    for (var i = 0; i < day.length; i++) h = (h ^ day.charCodeAt(i)) * 16777619 >>> 0;
    return h;
  }

  function docket(day) {
    var h = hashDay(day);
    var index = (h >>> 7) % N;
    return {
      day: day,
      index: index,
      factor: 1.25,
      label: D.DOCKETS[h % D.DOCKETS.length],
      invention: INVENTIONS[index].name
    };
  }

  function grant(state, amount) {
    if (!(amount > 0) || !isFinite(amount)) return 0;
    state.cash += amount;
    state.lifetime += amount;
    return amount;
  }

  function unitCost(state, i) {
    var v = INVENTIONS[i];
    return v.base * Math.pow(v.growth, state.owned[i]);
  }

  function bulkCost(state, i, count) {
    var v = INVENTIONS[i];
    return Idle.bulkCost(v.base, v.growth, state.owned[i], count);
  }

  function buyCount(state, i) {
    if (state.bulk === 10) return 10;
    if (state.bulk === 0) {
      var v = INVENTIONS[i];
      var n = Idle.maxAffordable(v.base, v.growth, state.owned[i], state.cash);
      if (!(n > 0)) return 1;
      return Math.min(10, n);
    }
    return 1;
  }

  function clerkCost(i) {
    var hire = INVENTIONS[i].hire;
    if (hire > 0) return hire;
    return INVENTIONS[i].base * 45;
  }

  function upgradeCount(state, kind) {
    var n = 0;
    for (var i = 0; i < UPGRADES.length; i++) {
      var u = UPGRADES[i];
      if (state.up[u.id] && (!kind || u.kind === kind)) n++;
    }
    return n;
  }

  function stampFactor(state) {
    var m = 1;
    for (var i = 0; i < UPGRADES.length; i++) {
      var u = UPGRADES[i];
      if (state.up[u.id] && u.kind === 't') m *= u.factor;
    }
    return m;
  }

  function boostFactor(state) {
    return 2 + 0.25 * upgradeCount(state, 't');
  }

  function sealMultiplier(state) {
    return 1 + Math.max(0, state.seals) * SEAL_RATE;
  }

  function achievementMultiplier(state) {
    var n = 0;
    for (var i = 0; i < ACHIEVEMENTS.length; i++) if (state.ach[ACHIEVEMENTS[i].id]) n++;
    return 1 + n * 0.01;
  }

  function streakMultiplier(state) {
    return 1 + Math.min(Math.max(0, state.streak || 0), 10) * 0.05;
  }

  function permanentMultiplier(state) {
    return sealMultiplier(state) * achievementMultiplier(state);
  }

  function offlineCap(state) {
    var hours = BASE_AWAY_HOURS;
    for (var i = 0; i < UPGRADES.length; i++) {
      var u = UPGRADES[i];
      if (u.kind === 'o' && state.up[u.id]) hours += u.hours;
    }
    return hours * 3600;
  }

  function passes(state, test) {
    if (!test) return false;
    if (test.kind === 'stamps') return state.stamps >= test.n;
    if (test.kind === 'owned') return state.owned[test.index] >= test.n;
    if (test.kind === 'ownedAny') {
      for (var i = 0; i < N; i++) if (state.owned[i] >= test.n) return true;
      return false;
    }
    if (test.kind === 'allOwned') {
      for (var a = 0; a < N; a++) if (state.owned[a] <= 0) return false;
      return true;
    }
    if (test.kind === 'clerks') {
      var c = 0;
      for (var k = 0; k < N; k++) if (state.clerk[k]) c++;
      return c >= test.n;
    }
    if (test.kind === 'clerksAll') {
      for (var j = 0; j < N; j++) if (!state.clerk[j]) return false;
      return true;
    }
    if (test.kind === 'upgrades') return upgradeCount(state) >= test.n;
    if (test.kind === 'lifetime') return state.lifetime >= test.n;
    if (test.kind === 'charters') return state.charters >= test.n;
    if (test.kind === 'seals') return state.seals >= test.n;
    if (test.kind === 'boosts') return state.boosts >= test.n;
    return false;
  }

  function multiplier(state, i, now, day, withBoost) {
    var m = Idle.milestoneMult(state.owned[i]);
    var extra = 0;
    for (var u = 0; u < UPGRADES.length; u++) {
      var up = UPGRADES[u];
      if (!state.up[up.id]) continue;
      if (up.kind === 'g') extra += 0.12;
      else if (up.kind === 'v' && up.invention === i) extra += 0.2;
    }
    m *= 1 + extra;
    var dock = docket(day || localDay(now ? new Date(now) : new Date()));
    if (dock.index === i) m *= dock.factor;
    m *= sealMultiplier(state) * achievementMultiplier(state) * streakMultiplier(state);
    if (withBoost !== false && now != null && now < state.boostUntil && state.boostIndex === i && state.clerk[i]) m *= 1.5;
    return m;
  }

  function cycleRevenue(state, i, now, day) {
    if (state.owned[i] <= 0) return 0;
    return INVENTIONS[i].revenue * state.owned[i] * multiplier(state, i, now, day);
  }

  function eachRate(state, i, now, day) {
    if (state.owned[i] <= 0) return 0;
    var full = cycleRevenue(state, i, now, day) / INVENTIONS[i].cycle;
    if (state.clerk[i]) return full;
    /* The first filing does nothing until its clerk. Later inventions
       file a quarter on their own, so buying one is felt before the hire. */
    if (i === 0) return 0;
    return full * 0.25;
  }

  function potential(state, now, day) {
    var sum = 0;
    for (var i = 0; i < N; i++) if (state.owned[i] > 0) sum += eachRate(state, i, now, day);
    return sum;
  }

  function managedRate(state, now, day) {
    var sum = 0;
    for (var i = 0; i < N; i++) sum += eachRate(state, i, now, day);
    return sum;
  }

  /* Clerk income without the short boost, so a goal cannot pay the boosted rate. */
  function rewardRate(state, now, day) {
    var sum = 0;
    for (var i = 0; i < N; i++) {
      if (!state.clerk[i] || state.owned[i] <= 0) continue;
      sum += INVENTIONS[i].revenue * state.owned[i] * multiplier(state, i, now, day, false) / INVENTIONS[i].cycle;
    }
    if (sum > 0) return sum;
    return 0.02;
  }

  /* A stamp pays a small fee. Extra taps in the same second share one cap,
     so four taps a second earn less than twice one tap a second, and the
     fee never grows with the office. */
  function handPay(state, now) {
    var fee = 0.05;
    var cap = 0.075;
    if (state.stampWindow == null || now - state.stampWindow >= 1000) {
      state.stampWindow = now;
      state.stampPaid = 0;
    }
    var room = cap - (state.stampPaid || 0);
    if (!(room > 0)) return 0;
    var pay = Math.min(fee, room);
    state.stampPaid += pay;
    return pay;
  }

  function goalPay(state, goal, now, day) {
    return rewardRate(state, now, day) * goal.seconds;
  }

  function checkGoals(state, now, day) {
    var done = [];
    var guard = 0;
    while (state.goal < GOALS.length && guard++ < GOALS.length) {
      var goal = GOALS[state.goal];
      if (!passes(state, goal.test)) break;
      var pay = goalPay(state, goal, now, day);
      grant(state, pay);
      state.goal++;
      done.push({ id: goal.id, text: goal.text, pay: pay });
    }
    return done;
  }

  function checkAchievements(state) {
    var freshOnes = [];
    for (var i = 0; i < ACHIEVEMENTS.length; i++) {
      var a = ACHIEVEMENTS[i];
      if (state.ach[a.id] || !passes(state, a.test)) continue;
      state.ach[a.id] = true;
      freshOnes.push(a);
    }
    return freshOnes;
  }

  function checkAll(state, now, day) {
    return { goals: checkGoals(state, now, day), achievements: checkAchievements(state) };
  }

  function resolveSelected(state) {
    var s = state.selected;
    if (s >= 0 && s < N && state.owned[s] > 0) return s;
    for (var i = 0; i < N; i++) if (state.owned[i] > 0 && !state.clerk[i]) return i;
    for (var k = 0; k < N; k++) if (state.owned[k] > 0) return k;
    return 0;
  }

  function stamp(state, now, day) {
    if (now == null) now = Date.now();
    state.stamps += 1;
    var chosen = resolveSelected(state);
    state.selected = chosen;
    var pay = 0;
    var boosted = false;
    if (!state.clerk[chosen] && state.owned[chosen] > 0) {
      pay = handPay(state, now, day);
      grant(state, pay);
      state.combo = 0;
    } else if (state.clerk[chosen] && !(now < state.boostUntil)) {
      if (now - state.lastStamp <= 400) state.combo += 1;
      else state.combo = 1;
      if (state.combo >= COMBO_NEED) {
        state.boostIndex = chosen;
        state.boostUntil = now + BOOST_MS;
        state.combo = 0;
        state.boosts += 1;
        boosted = true;
      }
    }
    state.lastStamp = now;
    var found = checkAll(state, now, day);
    return {
      pay: pay,
      chosen: chosen,
      boosted: boosted,
      combo: state.combo,
      goals: found.goals,
      achievements: found.achievements
    };
  }

  function poke(state, i) {
    if (state.owned[i] <= 0 || state.clerk[i] || state.running[i]) return { ok: false };
    state.running[i] = true;
    state.selected = i;
    return { ok: true };
  }

  function buy(state, i, now, day) {
    var count = buyCount(state, i);
    var cost = bulkCost(state, i, count);
    if (!(cost > 0) || state.cash < cost || !isFinite(cost)) return { ok: false, count: count, cost: cost };
    state.cash -= cost;
    state.owned[i] += count;
    state.selected = i;
    var found = checkAll(state, now, day);
    return { ok: true, count: count, cost: cost, goals: found.goals, achievements: found.achievements };
  }

  function hire(state, i, now, day) {
    if (state.clerk[i] || state.owned[i] < 1) return { ok: false, cost: clerkCost(i) };
    var cost = clerkCost(i);
    if (state.cash < cost) return { ok: false, cost: cost };
    state.cash -= cost;
    state.clerk[i] = true;
    state.running[i] = false;
    state.progress[i] = 0;
    state.selected = i;
    var found = checkAll(state, now, day);
    return { ok: true, cost: cost, goals: found.goals, achievements: found.achievements };
  }

  function buyUpgrade(state, id, now, day) {
    var up = null;
    for (var i = 0; i < UPGRADES.length; i++) if (UPGRADES[i].id === id) up = UPGRADES[i];
    if (!up || state.up[up.id] || state.cash < up.cost) return { ok: false, upgrade: up };
    state.cash -= up.cost;
    state.up[up.id] = true;
    var found = checkAll(state, now, day);
    return { ok: true, upgrade: up, goals: found.goals, achievements: found.achievements };
  }

  function advance(state, dt, now, day) {
    if (!(dt > 0)) return { paid: 0, goals: [], achievements: [] };
    var paid = 0;
    for (var i = 0; i < N; i++) {
      if (!state.running[i] || state.clerk[i] || state.owned[i] <= 0) continue;
      state.progress[i] += dt;
      if (state.progress[i] >= INVENTIONS[i].cycle) {
        paid += grant(state, cycleRevenue(state, i, now, day));
        state.progress[i] = 0;
        state.running[i] = false;
      }
    }
    var found = paid ? checkAll(state, now, day) : { goals: [], achievements: [] };
    return { paid: paid, goals: found.goals, achievements: found.achievements };
  }

  function unlocked(state, i) {
    if (i === 0 || state.owned[i] > 0) return true;
    var cost = unitCost(state, i);
    return state.cash >= cost * 0.35 || state.lifetime >= cost;
  }

  function sealsFor(lifetime) {
    return Math.floor(12 * Math.sqrt(Math.max(0, lifetime) / 1e6));
  }

  function charterHint(gain) {
    if (gain < 1) return 'Keep filing. This charter would add no seals.';
    if (gain < 5) return 'You can file, but five seals, a ten percent bonus, is the first charter that feels stronger than the office you close.';
    return 'A good time. You would keep the bonus and start again from one Better Paperclip.';
  }

  function charterPreview(state) {
    var gain = Math.max(0, sealsFor(state.lifetime) - state.seals);
    var nextSeals = state.seals + gain;
    var ach = achievementMultiplier(state);
    return {
      gain: gain,
      seals: state.seals,
      nextSeals: nextSeals,
      multiplier: permanentMultiplier(state),
      nextMultiplier: (1 + nextSeals * SEAL_RATE) * ach,
      keep: KEEP.slice(),
      lose: LOSE.slice(),
      hint: charterHint(gain),
      canFile: gain >= 1
    };
  }

  function fileCharter(state) {
    var preview = charterPreview(state);
    if (!preview.canFile) return { ok: false, gain: 0, preview: preview };
    var next = fresh();
    next.seals = preview.nextSeals;
    next.lifetime = state.lifetime;
    next.charters = state.charters + 1;
    next.ach = copyMap(state.ach);
    next.goal = state.goal;
    next.streak = state.streak;
    next.day = state.day;
    next.sound = state.sound;
    next.coachOff = true;
    next.introduced = true;
    next.play = state.play;
    replaceState(state, next);
    return { ok: true, gain: preview.gain, preview: preview };
  }

  function awayPay(state, awaySec, now, day) {
    var cap = offlineCap(state);
    var away = awaySec > 0 ? awaySec : 0;
    var capped = away > cap;
    var credited = capped ? cap : away;
    var gained = credited * managedRate(state, now, day);
    return { away: away, credited: credited, gained: gained, capped: capped, cap: cap };
  }

  function slipPay(state, now, day) {
    return rewardRate(state, now, day) * 8;
  }

  function produce(state, seconds, now, day) {
    if (!(seconds > 0)) return 0;
    return grant(state, managedRate(state, now, day) * seconds);
  }

  /* The next thing a steady player would buy: a missing clerk, or the first copy of a new invention. */
  function nextPurchase(state) {
    var best = null;
    for (var i = 0; i < N; i++) {
      if (state.owned[i] > 0 && !state.clerk[i]) {
        var hireCost = clerkCost(i);
        if (!best || hireCost < best.cost) best = { kind: 'hire', index: i, cost: hireCost };
      }
    }
    if (best) return best;
    for (var k = 0; k < N; k++) {
      if (state.owned[k] > 0) continue;
      if (!unlocked(state, k) && !(state.cash >= unitCost(state, k))) continue;
      var cost = unitCost(state, k);
      if (!(cost > 0) || !isFinite(cost)) continue;
      if (!best || cost < best.cost) best = { kind: 'buy', index: k, cost: cost };
    }
    return best;
  }

  function awayLines(state, awaySec, now, day) {
    var cap = offlineCap(state);
    var away = awaySec > 0 ? awaySec : 0;
    var credited = away > cap ? cap : away;
    var lines = [];
    var total = 0;
    for (var i = 0; i < N; i++) {
      if (!state.clerk[i] || state.owned[i] <= 0) continue;
      var amount = eachRate(state, i, now, day) * credited;
      total += amount;
      lines.push({ name: INVENTIONS[i].name, clerk: INVENTIONS[i].clerk, amount: amount });
    }
    return { away: away, credited: credited, capped: away > cap, total: total, lines: lines };
  }

  function createIdle(state, save) {
    return Idle.create({
      getRate: function () { return managedRate(state, Date.now()); },
      apply: function (amount) { grant(state, amount); },
      maxOfflineSec: offlineCap(state),
      offlineRate: 1,
      title: { label: 'Patent Pending', unit: '' },
      save: function (seen) {
        state.seen = seen;
        if (typeof save === 'function') save(serialize(state, seen));
      }
    });
  }

  window.Patent = {
    SAVE_KEY: SAVE_KEY,
    SAVE_VERSION: SAVE_VERSION,
    INVENTIONS: INVENTIONS,
    UPGRADES: UPGRADES,
    GOALS: GOALS,
    ACHIEVEMENTS: ACHIEVEMENTS,
    COMBO_NEED: COMBO_NEED,
    COMBO_WINDOW: COMBO_WINDOW,
    BOOST_MS: BOOST_MS,
    fresh: fresh,
    valid: valid,
    serialize: serialize,
    restore: restore,
    localDay: localDay,
    rollDay: rollDay,
    docket: docket,
    grant: grant,
    unitCost: unitCost,
    bulkCost: bulkCost,
    buyCount: buyCount,
    clerkCost: clerkCost,
    milestone: function (owned) { return Idle.milestoneMult(owned); },
    stampFactor: stampFactor,
    boostFactor: boostFactor,
    sealMultiplier: sealMultiplier,
    achievementMultiplier: achievementMultiplier,
    streakMultiplier: streakMultiplier,
    permanentMultiplier: permanentMultiplier,
    offlineCap: offlineCap,
    multiplier: multiplier,
    cycleRevenue: cycleRevenue,
    potential: potential,
    managedRate: managedRate,
    eachRate: eachRate,
    handPay: handPay,
    goalPay: goalPay,
    produce: produce,
    nextPurchase: nextPurchase,
    passes: passes,
    checkAll: checkAll,
    stamp: stamp,
    poke: poke,
    buy: buy,
    hire: hire,
    buyUpgrade: buyUpgrade,
    advance: advance,
    unlocked: unlocked,
    sealsFor: sealsFor,
    charterPreview: charterPreview,
    fileCharter: fileCharter,
    awayPay: awayPay,
    slipPay: slipPay,
    rewardRate: rewardRate,
    awayLines: awayLines,
    createIdle: createIdle,
    upgradeCount: upgradeCount
  };
})();
