/* Night Market Stalls (IDLE-NM1). NM-PACING claimed by Grok on 2026-10-23.
   Rules only: no page, no storage.
   Load shared/engine.js and shared/idle-core.js first.
   A stall doubles at 25, 50, 100, 150, 200, 300 and 400. That doubling is the beat a player feels.
   The lane lights at 10, then again at 25 and 50. The first light doubles it. The later lights are smaller.
   The Story Mat does not pull that count back to zero. The lane light is the only extra multiplier,
   and it does not stack with a pairing.
   Holding pours on the same Date.now() seconds as stall income, about eight a second, and never faster.
   Hiring is a person who runs stalls you have already worked. It is not a bonus. */
(function () {
  'use strict';

  var SAVE_KEY = 'night-market-save-v1';
  var SAVE_VERSION = 2;
  var OFFLINE_CAP = 4 * 3600;
  var OFFLINE_RATE = 0.5;
  var UNLOCK_AT = 10;
  var STALL_MILESTONES = [25, 50, 100, 150, 200, 300, 400];
  var LANE_MILESTONES = [10, 25, 50];
  /* 10 doubles the lane. 25 and 50 raise it again, by less than another double, so the
     evening from minute 15 to 45 is a run of choices instead of two income cliffs. */
  var LANE_FACTORS = [1, 2, 2.5, 3.2];
  var NEXT_MARKS = [10, 25, 50, 100, 150, 200, 300, 400];
  var FINALE_AT = 10;
  /* One pour every 120ms of the stall clock. A late timer cannot pay more than one second. */
  var HOLD_PER_SEC = 1000 / 120;
  var HOLD_SLICE = 1;
  /* Max stops at the next doubling, and also when that buy would take longer than
     seven and a half minutes to pay for itself. A run from 25 lanterns therefore
     stops at 50 instead of climbing into a multi-hour payback. */
  var PAYBACK_CAP = 450;

  /* Old Wen tells one chapter of the tortoise's climb for each mat. The first mat ends the night.
     The tenth is his last chapter if the lane stays open. These lines are the game's own tale.
     The unused tale files stay unloaded. */
  var CHAPTERS = [
    { title: 'The tortoise takes the lantern', text: 'Old Wen sits on the mat. A tortoise finds a lantern at the foot of the hill and picks it up.' },
    { title: 'The first step', text: 'The hill is steep and the lantern is warm. The tortoise takes one step, and the crowd leans in.' },
    { title: 'Tea at the foot', text: 'Mei pours for the listeners. The tortoise rests, and Old Wen leaves the hill still ahead.' },
    { title: 'Steam on the path', text: 'Bo folds dumplings while he listens. The tortoise climbs past the steam, and Old Wen will not say what waits at the top.' },
    { title: 'A light on the path', text: 'An lights a wick so the children can see. The tortoise is very small on the hill, and very brave.' },
    { title: 'A tin for the climb', text: 'Qiao sets one tin aside for the ending. Old Wen smiles and keeps the tortoise on the steep middle.' },
    { title: 'Smoke in the alley', text: 'Ren lights a stick for the alley. The smoke drifts up the hill, and the tortoise follows it.' },
    { title: 'The paper screen', text: 'Old Wen paints the hill on a paper screen. Just before the top, he sets the brush down.' },
    { title: 'The crowd holds still', text: 'Nobody speaks. The tortoise is one step from the top, and Old Wen looks along the lane.' },
    { title: "Old Wen's last chapter", text: 'The tortoise sets the lantern on the hill. The lanterns over the lane go out, one by one. The night ends, and the story is whole.' }
  ];

  /* Hand work pays 1 coin. The five original stalls grow between 1.05 and 1.15.
     Tea grows at 1.07 so the cup after the fifty-stall awning is still a short wait.
     Dumplings grow at 1.06 so the cart does not climb from a minute and a half toward nine.
     The Incense Tray opens at twelve mooncake tables. The first tray pays for itself
     in about two minutes, and the second stays inside four, so a buyer still has other stalls.
     The Story Mat starts at 2,200,000 and grows at 1.36, faster than the lane, so each
     chapter falls behind the other stalls until the evening earns its way there. */
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
      base: 70000, growth: 1.1, rate: 540, serves: 8, hand: 1, unlockAt: 12,
      looks: ['One tray', 'Two trays', 'A bronze stand', 'Smoke you can see from the gate'],
      gossip: 'Ren says the alley smelled of smoke before anyone arrived.',
      next: 'Old Wen unrolls the Story Mat once ten trays are burning.'
    },
    {
      id: 'stories', name: 'Story Mat', vendor: 'Old Wen',
      habit: 'Old Wen stops just before the ending. The crowd pays to hear the rest.',
      serve: 'Tell a piece of the story', left: 'piece of the story', lefts: 'pieces of the story', hire: 'Ask Old Wen to take the mat',
      base: 2200000, growth: 1.36, rate: 2200, serves: 6, hand: 1,
      looks: ['One cushion', 'Two cushions', 'A paper screen', 'Listeners sitting in the lane'],
      gossip: 'Old Wen says he reached the ending, then started again.',
      next: ''
    }
  ];

  /* One night, one seed. Omens and charms replace a price, a rate, an unlock, a hire
     count, a milestone list, or the away box. They do not add a multiplier. */
  var OMENS = [
    { id: 'rain', name: 'Rain', brief: 'Rain. Tea earns more. Lanterns cost more.',
      line: 'Rain. Tea 0.45 to 0.52 coins a second. Lanterns cost 10% more, 700 to 770.',
      set: { tea: { rate: 0.52 }, lantern: { base: 770 } } },
    { id: 'ferry', name: 'Ferry crowd', brief: 'Ferry crowd. Dumplings earn more. Mooncakes cost more. Away pay is shorter.',
      line: 'Ferry crowd. Dumplings 0.9 to 1.05 a second. Mooncakes cost 15% more. Away pay is 75% for 2 hours instead of half for 4.',
      set: { dumpling: { rate: 1.05 }, mooncake: { base: 7360 }, offlineRate: 0.75, offlineCap: 2 * 3600 } },
    { id: 'wick', name: 'Short wick', brief: 'Short wick. The Story Mat costs less. Incense earns less.',
      line: 'Short wick. The Story Mat costs 20% less, 2,200,000 to 1,760,000. Incense 540 to 460 a second.',
      set: { stories: { base: 1760000 }, incense: { rate: 460 } } },
    { id: 'mooncake', name: 'Mooncake festival', brief: 'Mooncake festival. Qiao opens sooner. Mooncakes earn less.',
      line: 'Mooncake festival. Qiao opens at 6 lantern stands instead of 10. Mooncakes 40 to 34 a second.',
      set: { mooncake: { unlockAt: 6, rate: 34 } } },
    { id: 'alley', name: 'Quiet alley', brief: 'Quiet alley. Tea costs less. Incense opens later and costs more.',
      line: 'Quiet alley. Trays cost 10% more, 70,000 to 77,000, and wait for 14 tables instead of 12. Tea stalls cost 6 to 5 coins.',
      set: { incense: { unlockAt: 14, base: 77000 }, tea: { base: 5 } } },
    { id: 'pour', name: 'Long pour', brief: 'Long pour. Mei wants more cups. Tea earns more once she has the stall.',
      line: 'Long pour. Mei wants 30 cups instead of 25. Tea 0.45 to 0.52 a second once she has the stall.',
      set: { tea: { serves: 30, rate: 0.52 } } }
  ];
  var CHARMS = [
    { id: 'mei-regulars', name: "Mei's regulars", stall: 'tea', line: "Mei's regulars. Tea stalls cost about 17% less from now on. 6 to 5 coins.",
      set: { tea: { base: 5 } } },
    { id: 'bo-queue', name: "Bo's queue", stall: 'dumpling', line: "Bo's queue. Dumplings double at 22 carts instead of 25.",
      set: { dumpling: { milestones: [22, 50, 100, 150, 200, 300, 400] } } },
    { id: 'an-paper', name: "An's paper", stall: 'lantern', line: "An's paper. Lanterns 5 to 6 a second.",
      set: { lantern: { rate: 6 } } },
    { id: 'qiao-moulds', name: "Qiao's moulds", stall: 'mooncake', line: "Qiao's moulds. Mooncakes 40 to 48 a second.",
      set: { mooncake: { rate: 48 } } },
    { id: 'ren-sticks', name: "Ren's sticks", stall: 'incense', line: "Ren's sticks. Incense trays cost 15% less from now on. 70,000 to 59,500.",
      set: { incense: { base: 59500 } } },
    { id: 'wen-discount', name: "Wen's discount", stall: 'stories', line: "Wen's discount. Story Mats cost 15% less from now on. 2,200,000 to 1,870,000.",
      set: { stories: { base: 1870000 } } },
    { id: 'mei-quick', name: "Mei's quick pour", stall: 'tea', line: "Mei's quick pour. Tea 0.45 to 0.54 a second, before bonuses.",
      set: { tea: { rate: 0.54 } } },
    { id: 'bo-steam', name: "Bo's steam", stall: 'dumpling', line: "Bo's steam. Dumplings 0.9 to 1.08 a second, before bonuses.",
      set: { dumpling: { rate: 1.08 } } },
    { id: 'an-offcuts', name: "An's offcuts", stall: 'lantern', line: "An's offcuts. Lantern stands cost 15% less from now on. 700 to 595.",
      set: { lantern: { base: 595 } } },
    { id: 'qiao-early', name: 'Qiao comes early', stall: 'mooncake', line: 'Qiao comes early. Mooncakes open at 8 lantern stands instead of 10.',
      set: { mooncake: { unlockAt: 8 } } },
    { id: 'ren-early', name: 'Ren comes early', stall: 'incense', line: 'Ren comes early. Incense opens at 10 mooncake tables instead of 12.',
      set: { incense: { unlockAt: 10 } } },
    { id: 'wen-patient', name: "Wen's patience", stall: 'stories', line: "Wen's patience. Later Story Mats cost 20% more each, instead of 36%.",
      set: { stories: { growth: 1.2 } } }
  ];
  var CHARM_GATES = ['dumpling', 'lantern', 'mooncake', 'incense', 'stories'];
  var POOL_START = 6;

  function byId(table, id) {
    for (var i = 0; i < table.length; i++) if (table[i].id === id) return table[i];
    return null;
  }
  function omenById(id) { return byId(OMENS, id); }
  function charmById(id) { return byId(CHARMS, id); }
  function stallIndex(id) {
    for (var i = 0; i < STALLS.length; i++) if (STALLS[i].id === id) return i;
    return -1;
  }
  function emptyMeta() {
    return { nights: [], omens: [], charms: [], pool: POOL_START };
  }
  function lcg(seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s;
    };
  }
  function stepSeed(seed) {
    return lcg(seed)() || 1;
  }
  function drawIds(rows, count, rand, avoid) {
    var bag = [], i;
    for (i = 0; i < rows.length; i++) {
      if (!avoid || avoid.indexOf(rows[i].id) < 0) bag.push(rows[i].id);
    }
    var out = [];
    while (out.length < count && bag.length) out.push(bag.splice(rand() % bag.length, 1)[0]);
    return out;
  }
  function copyOffer(offer) {
    if (!offer) return null;
    return { kind: offer.kind, stall: offer.stall || null, options: offer.options.slice() };
  }
  function newSeed() {
    var n = Math.floor(Math.random() * 0xffffffff) >>> 0;
    return n || 1;
  }
  function omenShape(omen) {
    if (!omen || !omen.set) return '';
    if (omen.set.tea && omen.set.tea.rate != null) return 'tea';
    if (omen.set.dumpling) return 'dumpling';
    if (omen.set.mooncake && omen.set.mooncake.unlockAt != null) return 'mooncake';
    return 'incense';
  }
  function nightShape(seed) {
    return ['tea', 'dumpling', 'mooncake', 'incense'][(seed >>> 0) % 4];
  }
  /* Seed 1 keeps the catalogue unlocks, so the no-omen night stays on its clock.
     Any other seed picks a stall that opens early and another that opens late,
     within about a quarter of that stall's usual count, and that early stall
     doubles at 20 instead of 25. */
  function seedLead(seed) {
    seed = seed >>> 0;
    if (seed === 1) return -1;
    return 1 + ((seed >>> 2) % 4);
  }
  function catalogueUnlock(i) {
    var stall = spec(i);
    return stall && stall.unlockAt ? stall.unlockAt : UNLOCK_AT;
  }
  function seedUnlock(seed, i) {
    if (i <= 0) return catalogueUnlock(i);
    var lead = seedLead(seed);
    if (lead < 0) return catalogueUnlock(i);
    var base = catalogueUnlock(i);
    var low = Math.max(1, Math.round(base * 0.75));
    var high = Math.round(base * 1.25);
    if (i === lead) return low;
    var lag = lead === 4 ? 2 : lead + 1;
    if (i === lag) return high;
    return base;
  }
  function uniqueIds(ids) {
    var seen = {}, out = [], i;
    for (i = 0; i < ids.length; i++) {
      if (!ids[i] || seen[ids[i]]) continue;
      seen[ids[i]] = true;
      out.push(ids[i]);
    }
    return out;
  }
  function drawOmens(seed, avoid, attempt) {
    var shape = nightShape(seed);
    var mixed = (seed ^ ((attempt || 0) * 0x9e37)) >>> 0;
    var rand = lcg(mixed || 1);
    var options = drawIds(OMENS, 3, rand, avoid);
    var has = options.some(function (id) { return omenShape(omenById(id)) === shape; });
    if (!has) {
      var variants = OMENS.filter(function (o) { return omenShape(o) === shape; });
      options[options.length - 1] = variants[rand() % variants.length].id;
    }
    return uniqueIds(options);
  }
  function shuffleIds(ids, seed) {
    var bag = ids.slice(), rand = lcg((seed >>> 0) || 1), out = [];
    while (bag.length) out.push(bag.splice(rand() % bag.length, 1)[0]);
    return out;
  }
  /* Three charm beats, in an order the seed chooses. The earliest stall in
     this list is the night's first charm. */
  function charmPlan(seed) {
    return shuffleIds(CHARM_GATES, (seed ^ 0x51) >>> 0).slice(0, 3);
  }
  function midAt(seed) {
    seed = seed >>> 0;
    if (seed === 1) return 6;
    return 4 + ((seed >>> 3) % 5);
  }
  function beginNight(n, seed) {
    seed = (seed >>> 0) || 1;
    return {
      n: n > 0 ? Math.floor(n) : 1,
      seed: seed,
      omen: null,
      charms: [],
      rerollUsed: false,
      kept: false,
      recorded: false,
      earned: null,
      quiet: 0,
      early: [],
      offered: [],
      queue: [],
      offer: { kind: 'omen', stall: null, options: drawOmens(seed, null, 0) }
    };
  }
  function patches(state) {
    var list = [], i, charm;
    if (!state || !state.night) return list;
    if (omenById(state.night.omen)) list.push(omenById(state.night.omen));
    var charms = state.night.charms || [];
    for (i = 0; i < charms.length; i++) {
      charm = charmById(charms[i]);
      if (charm) list.push(charm);
    }
    return list;
  }
  function stallField(state, stallId, field, fallback) {
    var value = fallback, i, row;
    var list = patches(state);
    for (i = 0; i < list.length; i++) {
      row = list[i].set && list[i].set[stallId];
      if (row && row[field] != null) value = row[field];
    }
    return value;
  }
  function offlineOf(state) {
    var rate = OFFLINE_RATE, cap = OFFLINE_CAP, i, set, list = patches(state);
    for (i = 0; i < list.length; i++) {
      set = list[i].set;
      if (!set) continue;
      if (set.offlineRate != null) rate = set.offlineRate;
      if (set.offlineCap != null) cap = set.offlineCap;
    }
    return { rate: rate, cap: cap };
  }
  function poolRows(state) {
    var n = state && state.meta && state.meta.pool > 0 ? state.meta.pool : POOL_START;
    if (n > CHARMS.length) n = CHARMS.length;
    return CHARMS.slice(0, n);
  }
  function lowestStallId(state) {
    var best = 0, n = Infinity, i, owned, last = Math.min(5, STALLS.length);
    for (i = 0; i < last; i++) {
      owned = state.stalls[i] ? state.stalls[i].owned : 0;
      if (owned < n) { n = owned; best = i; }
    }
    return STALLS[best].id;
  }
  function charmUseful(state, charm) {
    if (!charm || !charm.set || !charm.stall) return false;
    var patch = charm.set[charm.stall];
    if (!patch) return false;
    var i = stallIndex(charm.stall);
    var owned = state.stalls[i] ? state.stalls[i].owned : 0;
    if (patch.unlockAt != null) return owned === 0 && !unlocked(state, i);
    /* Bo's queue moves the first doubling from 25 to 22. It still changes the row until 25. */
    if (patch.milestones) {
      if (!(owned < STALL_MILESTONES[0])) return false;
      return incomeMatters(state, charm.stall);
    }
    if (patch.growth != null && charm.stall === 'stories') return !!(state.night && state.night.kept);
    if (patch.base != null) {
      var before = oneCost(state, charm.stall, null);
      var after = oneCost(state, charm.stall, patch.base);
      if (moneyText(before) === moneyText(after)) return false;
      var cut = before > 0 ? Math.round((1 - after / before) * 100) : 0;
      return cut > 0 && after < before;
    }
    if (patch.rate != null) {
      var stall = spec(i);
      var now = stallField(state, charm.stall, 'rate', stall ? stall.rate : patch.rate);
      var local = ratePercent(now, patch.rate);
      if (local === 0) return false;
      /* A shut stall still changes the night once it opens. An open stall whose
         night-wide total rounds to 0% does not, so it is not offered. */
      if (income(state) > 0 && production(state, i) > 0 && nightPercent(state, charm.stall, now, patch.rate) === 0) return false;
      return true;
    }
    return true;
  }
  function ratePercent(now, next) {
    if (!(now > 0) || !(next > 0)) return 0;
    return Math.round((next / now - 1) * 100);
  }
  function nightPercent(state, stallId, now, next) {
    if (!(now > 0) || !(income(state) > 0)) return 0;
    return Math.round(stallShare(state, stallId) * (next / now - 1) * 100);
  }
  function stallShare(state, stallId) {
    var total = income(state);
    if (!(total > 0)) return 1;
    var i = stallIndex(stallId);
    if (i < 0) return 0;
    return production(state, i) / total;
  }
  function incomeMatters(state, stallId) {
    var i = stallIndex(stallId);
    if (i < 0) return false;
    if (!(income(state) > 0) || !(production(state, i) > 0)) return true;
    return Math.round(stallShare(state, stallId) * 100) >= 1;
  }
  function stallInPlay(state, i) {
    if (unlocked(state, i)) return true;
    var st = state.stalls[i];
    return !!(st && (st.owned > 0 || st.hired));
  }
  function nextLocked(state) {
    var i;
    for (i = 0; i < STALLS.length; i++) if (!stallInPlay(state, i)) return i;
    return -1;
  }
  function charmStallOk(state, stallId) {
    var i = stallIndex(stallId);
    if (i < 0) return false;
    if (state.night && state.night.kept && stallId === 'stories') return true;
    if (stallInPlay(state, i)) {
      if (stallId === 'incense' && !unlocked(state, i) && !(state.stalls[i].owned > 0)) return false;
      return true;
    }
    if (i !== nextLocked(state)) return false;
    if (stallId === 'incense') {
      var prev = state.stalls[i - 1] ? state.stalls[i - 1].owned : 0;
      return prev >= Math.ceil(unlockNeed(state, i) * 0.75);
    }
    return true;
  }
  function charmOptions(state, stallId, reroll, attempt) {
    var offeredN = state.night.offered ? state.night.offered.length : 0;
    var salt = (stallIndex(stallId) + 1) + (reroll ? 17 : 0) + state.night.charms.length * 31 + offeredN * 13 + (attempt || 0) * 97;
    var pending = (state.night.charms || []).slice();
    function hold(offer) {
      if (!offer || offer.kind !== 'charm') return;
      offer.options.forEach(function (id) { if (pending.indexOf(id) < 0) pending.push(id); });
    }
    hold(state.night.offer);
    (state.night.queue || []).forEach(hold);
    var rows = poolRows(state).filter(function (c) {
      return charmUseful(state, c) && pending.indexOf(c.id) < 0 && charmStallOk(state, c.stall);
    });
    rows.sort(function (a, b) { return stallShare(state, b.stall) - stallShare(state, a.stall); });
    if (state.night && state.night.kept && rows.some(function (c) { return c.id === 'wen-patient'; })) {
      rows = rows.filter(function (c) { return c.stall !== 'stories' || c.id === 'wen-patient'; });
    }
    var seenStall = {}, unique = [], u;
    for (u = 0; u < rows.length; u++) {
      if (seenStall[rows[u].stall]) continue;
      seenStall[rows[u].stall] = true;
      unique.push(rows[u]);
    }
    if (unique.length < 2) return [];
    var n = Math.min(3, unique.length);
    var options = drawIds(unique, n, lcg((state.night.seed + salt * 997) >>> 0), null);
    var local = null, i, stallOf = {};
    for (i = 0; i < unique.length; i++) if (unique[i].stall === stallId) { local = unique[i]; break; }
    for (i = 0; i < options.length; i++) stallOf[charmById(options[i]).stall] = true;
    if (local && !stallOf[local.stall] && (stallInPlay(state, stallIndex(stallId)) || stallId === 'stories')) {
      options[options.length - 1] = local.id;
    }
    if (state.night.kept && stallId === 'stories') {
      var patient = charmById('wen-patient');
      if (patient && unique.some(function (c) { return c.id === patient.id; }) && options.indexOf(patient.id) < 0) {
        var swapped = false, p;
        for (p = 0; p < options.length; p++) {
          if (charmById(options[p]).stall === 'stories') { options[p] = patient.id; swapped = true; break; }
        }
        if (!swapped) options[options.length - 1] = patient.id;
      }
    }
    var seen = {}, clean = [], stalls = {};
    for (i = 0; i < options.length; i++) {
      var row = charmById(options[i]);
      if (!row || seen[options[i]] || stalls[row.stall]) continue;
      seen[options[i]] = true;
      stalls[row.stall] = true;
      clean.push(options[i]);
    }
    return clean.length >= 2 ? clean : [];
  }
  function remember(list, id) {
    if (id && list.indexOf(id) < 0) list.push(id);
  }
  function fresh() {
    var meta = emptyMeta();
    return {
      cash: 0,
      lifetime: 0,
      seen: null,
      bulk: 1,
      stalls: STALLS.map(function () { return { owned: 0, serves: 0, hired: false }; }),
      night: beginNight(1, 1),
      meta: meta
    };
  }
  function armNight(state, n, seed) {
    state.night = beginNight(n || 1, seed);
    return state.night;
  }

  function spec(i) { return STALLS[i] || null; }

  /* A stall can ask for more than the usual ten of the one before it. Incense waits for twelve tables. */
  function unlockNeed(state, i) {
    var stall = spec(i);
    if (!stall) return UNLOCK_AT;
    var fallback = seedUnlock(state && state.night ? state.night.seed : 1, i);
    return stallField(state, stall.id, 'unlockAt', fallback);
  }

  function servesNeed(state, i) {
    var stall = spec(i);
    if (!stall) return 0;
    return stallField(state, stall.id, 'serves', stall.serves);
  }

  function unlocked(state, i) {
    if (!spec(i)) return false;
    if (i === 0) return true;
    return state.stalls[i - 1].owned >= unlockNeed(state, i);
  }

  function lookIndex(owned) {
    if (owned >= 100) return 3;
    if (owned >= 50) return 2;
    if (owned >= 25) return 1;
    return 0;
  }

  /* 25, 50, 100, 150, 200, 300 and 400 each double the row again. */
  function stallMult(owned) {
    return Idle.milestoneMult(owned, STALL_MILESTONES);
  }

  function stallMultOwned(state, i, owned) {
    var marks = stallField(state, spec(i).id, 'milestones', null);
    if (!marks && state && state.night && seedLead(state.night.seed) === i) marks = [20, 50, 100, 150, 200, 300, 400];
    var cuts = state && state.night && state.night.early;
    if (!marks && cuts && cuts.indexOf(spec(i).id) >= 0) marks = [20, 50, 100, 150, 200, 300, 400];
    return Idle.milestoneMult(owned, marks || STALL_MILESTONES);
  }

  /* Lowest of the five original stalls. A shuttered one still counts as zero, so the
     first light waits until tea, dumplings, lanterns, mooncakes and incense have kept up.
     The Story Mat is not in this count: opening it must not put the lane back to 0/10. */
  function lowestOwned(state) {
    var n = Infinity, i, owned, last = Math.min(5, STALLS.length);
    for (i = 0; i < last; i++) {
      owned = state.stalls[i] ? state.stalls[i].owned : 0;
      if (owned < n) n = owned;
    }
    return n === Infinity ? 0 : n;
  }

  function laneMult(state) {
    var low = lowestOwned(state), mult = LANE_FACTORS[0], k;
    for (k = 0; k < LANE_MILESTONES.length; k++) if (low >= LANE_MILESTONES[k]) mult = LANE_FACTORS[k + 1];
    return mult;
  }

  function timesWord(owned, mult) {
    var m = mult == null ? stallMult(owned) : mult;
    if (m >= 128) return 'a hundred and twenty-eight times as much';
    if (m >= 64) return 'sixty-four times as much';
    if (m >= 32) return 'thirty-two times as much';
    if (m >= 16) return 'sixteen times as much';
    if (m >= 8) return 'eight times as much';
    if (m >= 4) return 'four times as much';
    if (m >= 2) return 'twice as much';
    return 'what one stall earns';
  }

  function production(state, i) {
    var st = state.stalls[i];
    if (!st || !st.hired || !(st.owned > 0)) return 0;
    return stallField(state, spec(i).id, 'rate', spec(i).rate) * st.owned * stallMultOwned(state, i, st.owned) * laneMult(state);
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
      ready: !state.stalls[i].hired && state.stalls[i].serves >= servesNeed(state, i)
    };
  }

  /* Coins a second from holding. Before the stalls earn this much, holding is the work.
     Once they do, which is well before minute 10, holding stays at this rate and cannot pass them. */
  function holdRate() {
    return HOLD_PER_SEC;
  }

  /* Turn a gap on the stall clock into whole pours. `acc` keeps the fraction between calls.
     A gap longer than one second pays one second, so a stalled timer cannot run ahead. */
  function holdCredit(elapsedSec, acc) {
    var carried = acc > 0 && isFinite(acc) ? acc : 0;
    if (!(elapsedSec > 0) || !isFinite(elapsedSec)) return { pours: 0, acc: carried, seconds: 0 };
    var seconds = Math.min(elapsedSec, HOLD_SLICE);
    var next = carried + seconds * HOLD_PER_SEC;
    var pours = Math.floor(next + 1e-9);
    return { pours: pours, acc: next - pours, seconds: seconds };
  }

  function canHire(state, i) {
    if (!unlocked(state, i) || state.stalls[i].hired) return false;
    return state.stalls[i].serves >= servesNeed(state, i);
  }

  function hire(state, i) {
    if (!unlocked(state, i)) return { ok: false, reason: 'closed' };
    if (state.stalls[i].hired) return { ok: false, reason: 'hired' };
    if (state.stalls[i].serves < servesNeed(state, i)) {
      return { ok: false, reason: 'serves', need: servesNeed(state, i) - state.stalls[i].serves };
    }
    state.stalls[i].hired = true;
    return { ok: true };
  }

  function nextMark(owned) {
    for (var k = 0; k < NEXT_MARKS.length; k++) if (owned < NEXT_MARKS[k]) return NEXT_MARKS[k];
    return 0;
  }

  function countToNext(owned) {
    var at = nextMark(owned);
    return at > owned ? at - owned : 0;
  }

  /* Largest n, at most `limit`, whose price fits in cash. The shared helper already
     nudges for rounding; this still refuses a count the button could not actually buy. */
  /* From 100 onward the price sheds the growth already climbed, down to a fixed
     premium. The doubling itself stays on the old price, so x2 is still the short
     wait. The copies after it are a longer wait a player can still choose.
     Nothing before 100 changes, and minute 10 never reaches 100. */
  function priceOrigin(owned) {
    /* Prices stay on one curve. A reset after 100 made cheap stalls the only buy
       and then a wall, so the long wait after x2 is explained in words instead. */
    return 0;
  }

  function unitCost(stall, owned) {
    var origin = priceOrigin(owned);
    if (!origin) return stall.base * Math.pow(stall.growth, owned);
    return stall.base * Math.pow(stall.growth, 52 + owned - origin);
  }

  function cost(i, owned, n, state) {
    var stall = spec(i);
    n = Math.floor(n);
    if (!stall || !(n > 0)) return 0;
    if (!isFinite(owned) || owned < 0) owned = 0;
    else owned = Math.floor(owned);
    var base = priceBase(state, stall.id, null);
    var growth = stallField(state, stall.id, 'growth', stall.growth);
    if (priceOrigin(owned + n - 1) === 0) return Idle.bulkCost(base, growth, owned, n);
    var priced = { base: base, growth: growth };
    var total = 0, k;
    for (k = 0; k < n; k++) total += unitCost(priced, owned + k);
    return total;
  }

  function maxFit(i, owned, cash, limit, state) {
    var cap = limit > 0 ? limit : 80;
    if (!(cash > 0) || cost(i, owned, 1, state) > cash) return 0;
    var lo = 1, hi = 1;
    while (hi < cap && cost(i, owned, hi, state) <= cash) {
      lo = hi;
      hi = Math.min(cap, hi * 2);
    }
    if (cost(i, owned, hi, state) <= cash) return hi;
    while (lo < hi) {
      var mid = Math.ceil((lo + hi) / 2);
      if (cost(i, owned, mid, state) <= cash) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  function affordableCopies(stall, owned, cash, limit) {
    var n = Idle.maxAffordable(stall.base, stall.growth, owned, cash);
    if (!(n > 0)) return 0;
    if (limit > 0 && n > limit) n = limit;
    while (n > 0 && Idle.bulkCost(stall.base, stall.growth, owned, n) > cash) n--;
    return n > 0 ? n : 0;
  }

  function prepareMat(state) {
    var i = STALLS.length - 1;
    if (!state.stalls || !state.stalls[i]) return;
    if (unlocked(state, i) && !state.stalls[i].hired) state.stalls[i].hired = true;
  }
  function quote(state, i, mode) {
    if (!spec(i)) return { count: 0, cost: 0, blocked: 'closed' };
    prepareMat(state);
    var stall = spec(i);
    var owned = state.stalls[i].owned;
    var one = cost(i, owned, 1, state);
    if (!state.stalls[i].hired) return { count: 0, cost: one, blocked: 'hire' };
    if (!unlocked(state, i)) return { count: 0, cost: one, blocked: 'closed' };
    if (i === STALLS.length - 1 && owned === 0) {
      if (one > state.cash) return { count: 0, cost: one, blocked: 'cost' };
      return { count: 1, cost: one, blocked: null };
    }
    var n, priced, afford;
    if (mode === 'max') {
      var room = countToNext(owned);
      var capN = room > 0 ? room : 20;
      afford = maxFit(i, owned, state.cash, capN, state);
      n = afford;
      while (n > 0 && paybackSeconds(state, i, n) > PAYBACK_CAP) n--;
      if (!(n > 0)) {
        /* Coins can cover a copy that Max still refuses. Say so, instead of a dead Buy 1. */
        return { count: 0, cost: one, blocked: afford > 0 ? 'payback' : 'cost' };
      }
      priced = cost(i, owned, n, state);
      return { count: n, cost: priced, blocked: null };
    }
    if (mode === 'next') {
      n = countToNext(owned);
      if (!(n > 0)) return { count: 0, cost: one, blocked: 'done' };
      var toward = maxFit(i, owned, state.cash, n, state);
      /* Greyed Next prices the next single step. A batch price does not match the one copy you are short. */
      if (!(toward > 0)) return { count: 0, cost: one, blocked: 'cost' };
      return { count: toward, cost: cost(i, owned, toward, state), blocked: null };
    }
    n = mode === 10 || mode === '10' ? 10 : 1;
    priced = cost(i, owned, n, state);
    if (!(priced >= 0) || priced > state.cash) return { count: 0, cost: priced, blocked: 'cost' };
    return { count: n, cost: priced, blocked: null };
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
    var priced = count > 0 ? cost(i, state.stalls[i].owned, count, state) : 0;
    if (!(count > 0) || !(priced >= 0) || priced > state.cash) return { ok: false, reason: 'cost', count: 0, cost: priced };
    state.cash -= priced;
    if (state.cash < 1e-6) state.cash = 0;
    state.stalls[i].owned += count;
    return { ok: true, count: count, cost: priced };
  }

  /* Payback is the price of the selected quantity divided by the income those stalls add.
     A tenth or a twenty-fifth can add more than one stall's rate, because the whole row doubles. */
  function paybackSeconds(state, i, count) {
    var stall = spec(i);
    var st = state.stalls && state.stalls[i];
    if (!stall || !st || !st.hired) return Infinity;
    var n = count > 0 ? Math.floor(count) : 1;
    var priced = cost(i, st.owned, n, state);
    var before = income(state);
    st.owned += n;
    var after = income(state);
    st.owned -= n;
    var added = after - before;
    if (!(priced > 0) || !(added > 0) || !isFinite(priced) || !isFinite(added)) return Infinity;
    return priced / added;
  }

  function buyCount(state, i) {
    var mode = state && state.bulk;
    if (mode === 'max' || mode === 'next') {
      var q = quote(state, i, mode);
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
    var owned = state.stalls[i] ? state.stalls[i].owned : 0;
    var n = buyCount(state, i);
    var seconds = paybackSeconds(state, i, n);
    var label = paybackLabel(seconds);
    if (!label) return stall.vendor + ' is running this stall.';
    var line = n === 1 ? 'The next one pays for itself in ' + label + '.' : n + ' more pay for themselves in ' + label + '.';
    /* The copy after a doubling adds one stall. The doubling added the whole row.
       Name that, so a jump from about an hour to many hours does not look like a broken price. */
    if (STALL_MILESTONES.indexOf(owned) >= 0 && seconds >= 30 * 60) {
      return 'The x2 is already lit, so this one is the long wait: ' + label + '.';
    }
    return line;
  }

  function awayRule(state) {
    var off = offlineOf(state);
    return 'While away: earns ' + Math.round(off.rate * 100) + '%, up to ' + (off.cap / 3600) + 'h';
  }

  function secondsToNext(state) {
    var rate = income(state);
    if (!(rate > 0)) return Infinity;
    var best = Infinity;
    for (var i = 0; i < STALLS.length; i++) {
      if (!state.stalls[i].hired) continue;
      var one = cost(i, state.stalls[i].owned, 1, state);
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
      marks = NEXT_MARKS;
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

  function goalBody(state) {
    var i, stall, left, bonus;
    for (i = 0; i < STALLS.length; i++) {
      if (!unlocked(state, i) || state.stalls[i].hired) continue;
      stall = spec(i);
      if (state.stalls[i].serves >= servesNeed(state, i)) return stall.vendor + ' will take the ' + stall.name + ' whenever you ask.';
      left = servesNeed(state, i) - state.stalls[i].serves;
      if (i === 0 && state.stalls[i].serves === 0) return 'Hold to pour. ' + left + ' more ' + stall.lefts + ', then ' + stall.vendor + ' will take the stall.';
      return left + ' more ' + (left === 1 ? stall.left : stall.lefts) + ' to do yourself. Then ' + stall.vendor + ' will take it.';
    }
    for (i = 0; i < STALLS.length; i++) {
      if (!state.stalls[i].hired || state.stalls[i].owned > 0) continue;
      if (i === STALLS.length - 1 && !(state.night && state.night.kept)) return 'Unroll the Story Mat. That ends the night.';
      if (!(quote(state, i, 1).count > 0)) return 'Buy the first ' + spec(i).name + '. ' + spec(i).vendor + ' will run it.';
    }
    for (i = 0; i < STALLS.length - 1; i++) {
      if (!state.stalls[i].hired) continue;
      var need = unlockNeed(state, i + 1);
      if (state.stalls[i].owned >= need) continue;
      left = need - state.stalls[i].owned;
      bonus = nextBonus(state, i, need);
      var nxt = spec(i + 1);
      var follow = nxt ? (' ' + nxt.vendor + ' opens the ' + nxt.name + ' at ' + need + '.') : '';
      return withBonus((left === 1 ? 'One more ' : left + ' more ') + spec(i).name.toLowerCase() + (left === 1 ? '' : 's') + '.' + follow, bonus);
    }
    var matI = STALLS.length - 1;
    if (unlocked(state, matI) && state.stalls[matI].owned === 0 && !(state.night && state.night.kept)) {
      return 'Unroll the Story Mat. That ends the night.';
    }
    bonus = nextBonus(state);
    if (finaleReached(state)) {
      var ahead = laneAhead(state);
      if (ahead) return laneLine(state) + ' The next light raises what the whole lane earns.';
      var matsOwned = state.stalls[STALLS.length - 1].owned;
      if (matsOwned < 25) {
        var matsLeft = 25 - matsOwned;
        return (matsLeft === 1 ? 'One more Story Mat reaches 25, and that mat doubles.' : matsLeft + ' more Story Mats reach 25, and that mat doubles.');
      }
      if (bonus) {
        stall = spec(bonus.i);
        var payoff = stallMult(bonus.at) > stallMult(bonus.at - 1) ? ' That doubling pays about twice what the row earns now.' : '';
        return withBonus((bonus.left === 1 ? 'One more ' : bonus.left + ' more ') + stall.name.toLowerCase() + (bonus.left === 1 ? '' : 's') + '.', bonus) + payoff;
      }
    } else if (bonus) {
      stall = spec(bonus.i);
      return withBonus((bonus.left === 1 ? 'One more ' : bonus.left + ' more ') + stall.name.toLowerCase() + (bonus.left === 1 ? '' : 's') + '.', bonus);
    }
    return 'Every stall has a crowd. The lane is as bright as it gets tonight.';
  }

  function goal(state) {
    var body = goalBody(state);
    var mat = STALLS.length - 1;
    if (state && unlocked(state, mat) && state.stalls[mat].owned === 0 && !(state.night && state.night.kept)) {
      if (!body || !/Story Mat/i.test(body)) return 'Unroll the Story Mat. That ends the night.';
    }
    return body || 'The Story Mat is what the lane is working toward.';
  }
  function dawnGoal() {
    return 'The Story Mat is unrolled. That ends the night.';
  }

  function nextGoalLine(state, i) {
    var stall = spec(i);
    var owned = state.stalls[i] ? state.stalls[i].owned : 0;
    var at = nextMark(owned);
    if (!stall) return '';
    if (!at) return 'Every doubling on this stall is lit.';
    if (i === STALLS.length - 1 && owned === 0 && !(state.night && state.night.kept)) return 'Unrolling the Story Mat ends the night.';
    if (i === STALLS.length - 1 && at === FINALE_AT) return 'Next goal: 10 Story Mats. Old Wen\'s last chapter.';
    if (at === 10) return 'Next goal: 10 ' + pluralStall(stall.name, 10) + '.';
    return 'Next goal: ' + at + ' ' + pluralStall(stall.name, at) + ', x2.';
  }

  /* Tea, dumplings, lanterns, mooncakes and incense. The Story Mat is not one of them. */
  var LANE_WHO = 'tea through incense';

  function laneAhead(state) {
    var low = lowestOwned(state), k;
    for (k = 0; k < LANE_MILESTONES.length; k++) if (low < LANE_MILESTONES[k]) return LANE_MILESTONES[k];
    return 0;
  }

  /* Past the last lane light, the next stall doubling is the named target.
     It does not add another lane multiplier. */
  function laneTarget(low) {
    var k;
    for (k = 0; k < LANE_MILESTONES.length; k++) if (low < LANE_MILESTONES[k]) return LANE_MILESTONES[k];
    for (k = 0; k < STALL_MILESTONES.length; k++) if (low < STALL_MILESTONES[k]) return STALL_MILESTONES[k];
    return 0;
  }

  function laneLine(state) {
    var low = lowestOwned(state);
    var next = laneTarget(low);
    var lit = laneMult(state) >= 2 ? 'The whole lane is lit. ' : '';
    if (!next) return lit + 'Lane goal: ' + low + ' on ' + LANE_WHO + '.';
    return lit + 'Lane goal: ' + low + '/' + next + ' on ' + LANE_WHO + '.';
  }

  function chapterTitle(n) {
    var ch = CHAPTERS[n - 1];
    return ch ? ch.title : '';
  }

  function chapterLine(state) {
    var owned = state.stalls[STALLS.length - 1] ? state.stalls[STALLS.length - 1].owned : 0;
    if (!(owned > 0)) return '';
    if (owned > FINALE_AT) return 'Old Wen tells it again.';
    if (owned === FINALE_AT) return "Old Wen's last chapter is told.";
    return 'Chapter ' + owned + ' of ' + FINALE_AT + ': ' + chapterTitle(owned) + '.';
  }

  function finaleReached(state) {
    return !!(state.stalls[STALLS.length - 1] && state.stalls[STALLS.length - 1].owned >= FINALE_AT);
  }

  function finaleCopy() {
    var ch = CHAPTERS[FINALE_AT - 1];
    return { title: ch.title, lead: ch.text, choice: 'Keep the lane open' };
  }

  function lookLine(state, i) {
    var owned = state.stalls[i].owned;
    var stall = spec(i);
    if (!state.stalls[i].hired) return '';
    if (owned <= 0) return stall.vendor + ' is here, waiting for the first one.';
    var look = stall.looks[lookIndex(owned)];
    var mult = stallMultOwned(state, i, owned);
    return mult <= 1 ? look + '.' : look + '. It earns ' + timesWord(owned, mult) + '.';
  }

  function gossipLine(state) {
    for (var i = STALLS.length - 1; i >= 0; i--) {
      if (state.stalls[i].hired) return spec(i).gossip;
    }
    return 'The lane was quiet.';
  }

  function awayHours(cap) {
    var hours = cap / 3600;
    if (hours === 1) return 'one hour';
    if (hours === 2) return 'two hours';
    if (hours === 4) return 'four hours';
    return hours + ' hours';
  }

  function awayCopy(summary, state) {
    var off = offlineOf(state);
    var lead = 'You were gone ' + Arcade.fmtTime(summary.away) + '.';
    if (summary.capped) lead += ' The box only holds ' + awayHours(off.cap) + ', so ' + Arcade.fmtTime(summary.credited) + ' counted.';
    else lead += ' The stalls kept ' + Arcade.fmtTime(summary.credited) + ' of it.';
    lead += ' While away, stalls earn ' + Math.round(off.rate * 100) + '%.';
    var box = summary.gained > 0
      ? Arcade.fmt(summary.gained) + ' coins are in the box.'
      : 'The box is empty. Nothing was earning while you were gone.';
    return { title: 'While you were away', lead: lead, box: box };
  }

  /* Same rule as the Best tag. Max and Next only count a buy the button can make.
     Buy 1 and Buy 10 score one step or ten even when the coins are short, and the
     tag stays off until that stall can actually be bought. */
  function bestIndex(state) {
    var best = -1, score = Infinity, i, n, sec, mode = state.bulk;
    for (i = 0; i < STALLS.length; i++) {
      if (!state.stalls[i].hired || !unlocked(state, i)) continue;
      if (mode === 'max' || mode === 'next') n = quote(state, i, mode).count;
      else n = mode === 10 || mode === '10' ? 10 : 1;
      if (!(n > 0)) continue;
      sec = paybackSeconds(state, i, n);
      if (sec < score) { score = sec; best = i; }
    }
    return best;
  }

  function setBulk(state, mode) {
    if (mode === 'max') state.bulk = 'max';
    else if (mode === 'next') state.bulk = 'next';
    else if (mode === 10 || mode === '10') state.bulk = 10;
    else state.bulk = 1;
    return state.bulk;
  }

  function knownId(table, id) {
    return typeof id === 'string' && !!byId(table, id);
  }
  function cleanOffer(offer) {
    if (!offer || (offer.kind !== 'omen' && offer.kind !== 'charm') || !Array.isArray(offer.options)) return null;
    var table = offer.kind === 'omen' ? OMENS : CHARMS;
    var options = offer.options.filter(function (id) { return knownId(table, id); });
    if (!options.length) return null;
    return { kind: offer.kind, stall: typeof offer.stall === 'string' ? offer.stall : null, options: options };
  }
  function valid(o) {
    if (!o || o.v !== SAVE_VERSION || o.game !== 'night-market' || !Array.isArray(o.stalls) || o.stalls.length !== STALLS.length) return false;
    if (!isFinite(o.cash) || o.cash < 0 || !isFinite(o.lifetime) || o.lifetime < 0) return false;
    for (var i = 0; i < o.stalls.length; i++) {
      var s = o.stalls[i];
      if (!s || !isFinite(s.owned) || !isFinite(s.serves) || s.owned < 0 || s.serves < 0) return false;
    }
    if (!o.night || !isFinite(o.night.n) || o.night.n < 1 || !isFinite(o.night.seed)) return false;
    if (!o.meta || !Array.isArray(o.meta.nights) || !Array.isArray(o.meta.omens) || !Array.isArray(o.meta.charms)) return false;
    if (o.night.omen != null && !knownId(OMENS, o.night.omen)) return false;
    return true;
  }

  function serialize(state, seen) {
    var night = state.night || beginNight(1, 1);
    var meta = state.meta || emptyMeta();
    return {
      v: SAVE_VERSION,
      game: 'night-market',
      cash: state.cash,
      lifetime: state.lifetime,
      seen: typeof seen === 'number' ? seen : state.seen,
      bulk: state.bulk,
      stalls: state.stalls.map(function (s) {
        return { owned: s.owned, serves: s.serves, hired: !!s.hired };
      }),
      night: {
        n: night.n,
        seed: night.seed,
        omen: night.omen || null,
        charms: (night.charms || []).slice(),
        rerollUsed: !!night.rerollUsed,
        kept: !!night.kept,
        recorded: !!night.recorded,
        earned: typeof night.earned === 'number' ? night.earned : null,
        offered: (night.offered || []).slice(),
        queue: (night.queue || []).map(copyOffer),
        offer: copyOffer(night.offer)
      },
      meta: {
        nights: (meta.nights || []).map(function (n) {
          return { n: n.n, seed: n.seed, omen: n.omen || null, charms: (n.charms || []).slice() };
        }),
        omens: meta.omens.slice(),
        charms: meta.charms.slice(),
        pool: meta.pool > 0 ? meta.pool : POOL_START
      }
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
    state.night = beginNight(Math.floor(o.night.n), o.night.seed >>> 0);
    state.night.omen = knownId(OMENS, o.night.omen) ? o.night.omen : null;
    state.night.charms = (o.night.charms || []).filter(function (id) { return knownId(CHARMS, id); });
    state.night.rerollUsed = !!o.night.rerollUsed;
    state.night.kept = !!o.night.kept;
    state.night.recorded = !!o.night.recorded;
    state.night.earned = typeof o.night.earned === 'number' && isFinite(o.night.earned) ? o.night.earned : null;
    state.night.offered = Array.isArray(o.night.offered) ? o.night.offered.filter(function (id) { return stallIndex(id) >= 0 || id === 'mid-mooncake' || id === 'mat-wait' || id === 'kept-lane'; }) : [];
    state.night.queue = Array.isArray(o.night.queue) ? o.night.queue.map(cleanOffer).filter(Boolean) : [];
    state.night.offer = cleanOffer(o.night.offer);
    state.meta = {
      nights: o.meta.nights.map(function (n) {
        return {
          n: Math.floor(n.n) || 1,
          seed: (n.seed >>> 0) || 1,
          omen: knownId(OMENS, n.omen) ? n.omen : null,
          charms: (n.charms || []).filter(function (id) { return knownId(CHARMS, id); })
        };
      }),
      omens: o.meta.omens.filter(function (id) { return knownId(OMENS, id); }),
      charms: o.meta.charms.filter(function (id) { return knownId(CHARMS, id); }),
      pool: Math.max(POOL_START, Math.min(CHARMS.length, Math.floor(o.meta.pool) || POOL_START))
    };
    return state;
  }

  /* The game and the checks share this. The away cap and rate follow the night. */
  function createIdle(state, save) {
    return Idle.create({
      getRate: function () { return income(state); },
      apply: function (amount) { addCash(state, amount); },
      maxOfflineSec: offlineOf(state).cap,
      offlineRate: offlineOf(state).rate,
      title: { label: 'Night Market', unit: '' },
      save: function (seen) {
        state.seen = seen;
        if (typeof save === 'function') save(serialize(state, seen));
      }
    });
  }

  function advanceOffer(state) {
    state.night.offer = state.night.queue.length ? state.night.queue.shift() : null;
    touchQuiet(state);
  }
  function touchQuiet(state) {
    if (state && state.night) state.night.quiet = 0;
  }
  function pushGap(state) {
    var stall = lowestStallId(state);
    var options = charmOptions(state, stall, false, 5);
    if (options.length < 2) return false;
    touchQuiet(state);
    var offer = { kind: 'charm', stall: stall, options: options };
    if (!state.night.offer) state.night.offer = offer;
    else state.night.queue.push(offer);
    return true;
  }
  function elapse(state, dt) {
    if (!state || !state.night || !(dt > 0)) return false;
    if (state.night.offer || dawnDue(state)) {
      touchQuiet(state);
      return false;
    }
    state.night.quiet = (state.night.quiet || 0) + dt;
    if (state.night.quiet < 90) return false;
    return pushGap(state);
  }
  function choose(state, index) {
    var offer = state.night && state.night.offer;
    if (!offer || !(index >= 0)) return null;
    var id = offer.options[index];
    if (!id) return null;
    if (offer.kind === 'omen' && omenById(id)) {
      state.night.omen = id;
      remember(state.meta.omens, id);
    } else if (offer.kind === 'charm' && charmById(id) && state.night.charms.indexOf(id) < 0) {
      state.night.charms.push(id);
      remember(state.meta.charms, id);
    } else return null;
    advanceOffer(state);
    return id;
  }
  function skipOffer(state) {
    var offer = state.night && state.night.offer;
    if (!offer || offer.kind !== 'charm') return false;
    advanceOffer(state);
    return true;
  }
  function moneyText(n) {
    if (typeof Arcade !== 'undefined' && Arcade.fmt) return Arcade.fmt(n);
    return String(Math.round(n));
  }
  /* An omen replaces the catalogue price. A charm keeps its own discount and
     applies that fraction to tonight's price, so a discount cannot raise it. */
  function priceBase(state, stallId, extra) {
    var stall = spec(stallIndex(stallId));
    if (!stall) return 0;
    var catalogue = stall.base;
    var base = catalogue;
    var list = patches(state), p, row;
    for (p = 0; p < list.length; p++) {
      row = list[p].set && list[p].set[stallId];
      if (!row || row.base == null || !catalogue) continue;
      if (list[p].stall) base = base * (row.base / catalogue);
      else base = row.base;
    }
    if (extra != null && catalogue) base = base * (extra / catalogue);
    var cuts = state && state.night && state.night.early;
    if (cuts && cuts.indexOf(stallId) >= 0) base = base * (59500 / 70000);
    return base;
  }
  function oneCost(state, stallId, baseOverride) {
    var i = stallIndex(stallId);
    var stall = spec(i);
    if (!stall) return 0;
    var owned = state.stalls[i] ? state.stalls[i].owned : 0;
    var base = priceBase(state, stallId, baseOverride == null ? null : baseOverride);
    var growth = stallField(state, stallId, 'growth', stall.growth);
    return Idle.bulkCost(base, growth, owned, 1);
  }
  function ownedSnapshot(state) {
    return state.stalls.map(function (s) { return s.owned; });
  }
  function restoreOwned(state, saved) {
    saved.forEach(function (n, i) { state.stalls[i].owned = n; });
  }
  /* Pretend every stall before i has enough copies to open i, then put the counts back. */
  function withOpenThrough(state, i, fn) {
    var saved = ownedSnapshot(state), k, need;
    for (k = 0; k < i; k++) {
      need = unlockNeed(state, k + 1);
      if (state.stalls[k].owned < need) state.stalls[k].owned = need;
    }
    var result = fn();
    restoreOwned(state, saved);
    return result;
  }
  function gateViable(state, stallId) {
    if (!state.night || !offerRoom(state)) return false;
    var i = stallIndex(stallId);
    if (i < 0) return false;
    return withOpenThrough(state, i, function () {
      return charmOptions(state, stallId, false).length >= 2;
    });
  }
  function nextOfferLine(state) {
    if (!state.night) return 'The next choice waits.';
    if (state.night.offer) return 'A choice is waiting.';
    if (!offerRoom(state)) return 'No more choices tonight.';
    var moon = stallIndex('mooncake');
    var incense = stallIndex('incense');
    var plan = charmPlan(state.night.seed), g, id, i, soonest = null, soonestAt = 99;
    for (g = 0; g < plan.length; g++) {
      id = plan[g];
      if (state.night.offered.indexOf(id) >= 0) continue;
      i = stallIndex(id);
      if (i < 0 || unlocked(state, i) || !gateViable(state, id)) continue;
      if (i < soonestAt) { soonest = spec(i); soonestAt = i; }
    }
    if (soonest && soonestAt < moon) return 'The next choice comes when the ' + soonest.name + ' opens.';
    if (unlocked(state, moon) && state.night.offered.indexOf('mid-mooncake') < 0 && state.stalls[moon].owned < unlockNeed(state, incense) && gateViable(state, 'mooncake')) {
      return 'The next choice comes at ' + midAt(state.night.seed) + ' mooncake tables.';
    }
    if (soonest) return 'The next choice comes when the ' + soonest.name + ' opens.';
    if (charmOptions(state, lowestStallId(state), false).length >= 2) return 'The next choice comes before the lane is quiet for long.';
    return 'No more choices tonight.';
  }
  function offerLine(state, charm) {
    if (!charm || !charm.stall) return charm && charm.line ? charm.line : '';
    var patch = charm.set && charm.set[charm.stall];
    var share = stallShare(state, charm.stall);
    var earning = income(state) > 0 && production(state, stallIndex(charm.stall)) > 0;
    var sharePct = Math.round(share * 100);
    var shareWords = earning ? (sharePct + '% of your income') : 'not open yet';
    var stall = spec(stallIndex(charm.stall));
    var name = stall ? stall.name : charm.stall;
    if (patch && patch.base != null) {
      var before = oneCost(state, charm.stall, null);
      var after = oneCost(state, charm.stall, patch.base);
      var cut = before > 0 ? Math.round((1 - after / before) * 100) : 0;
      var change = cut > 0 ? (cut + '% less') : (cut < 0 ? (Math.abs(cut) + '% more') : 'the same');
      return charm.name + '. ' + name + ': ' + shareWords + '. Next one ' + moneyText(before) + ' to ' + moneyText(after) + ' coins, ' + change + '.';
    }
    if (patch && patch.milestones) {
      return charm.name + '. ' + name + ': ' + shareWords + '. Doubles at ' + patch.milestones[0] + ' instead of 25.';
    }
    if (patch && patch.rate != null) {
      var now = stallField(state, charm.stall, 'rate', stall ? stall.rate : patch.rate);
      var local = ratePercent(now, patch.rate);
      var perSecond = moneyText(now) + ' to ' + moneyText(patch.rate) + ' coins a second.';
      if (!earning) {
        return charm.name + '. ' + name + ': not open yet. +' + local + '% on ' + name + ' once it opens. ' + perSecond;
      }
      var total = nightPercent(state, charm.stall, now, patch.rate);
      return charm.name + '. ' + name + ': ' + shareWords + ', total +' + total + '%. ' + perSecond;
    }
    return charm.line;
  }
  function sameSet(a, b) {
    return (a || []).slice().sort().join(',') === (b || []).slice().sort().join(',');
  }
  function reroll(state) {
    var offer = state.night && state.night.offer;
    if (!offer || state.night.rerollUsed) return false;
    var before = offer.options.slice();
    var attempt = 1, next = before;
    while (attempt < 8) {
      next = offer.kind === 'omen'
        ? drawOmens(state.night.seed, before, attempt)
        : charmOptions(state, offer.stall, true, attempt);
      if (next.length >= 2 && !sameSet(next, before)) break;
      attempt++;
    }
    if (next.length < 2 || sameSet(next, before)) return false;
    state.night.rerollUsed = true;
    offer.options = next;
    return true;
  }
  var CHARM_OFFER_CAP = 4;
  function offerRoom(state) {
    return state.night.offered.length < CHARM_OFFER_CAP;
  }
  function pushOffer(state, offer) {
    if (!offer.options || offer.options.length < 2) return false;
    if (!state.night.offer) state.night.offer = offer;
    else state.night.queue.push(offer);
    return true;
  }
  function syncOffers(state) {
    if (!state.night) return false;
    var added = false, g, i, id, offer, plan = charmPlan(state.night.seed);
    for (g = 0; g < plan.length; g++) {
      if (!offerRoom(state)) break;
      id = plan[g];
      i = stallIndex(id);
      if (i < 0 || !unlocked(state, i) || state.night.offered.indexOf(id) >= 0) continue;
      offer = { kind: 'charm', stall: id, options: charmOptions(state, id, false) };
      if (!pushOffer(state, offer)) continue;
      state.night.offered.push(id);
      added = true;
    }
    var moon = stallIndex('mooncake');
    var incense = stallIndex('incense');
    var at = midAt(state.night.seed);
    if (offerRoom(state) && moon >= 0 && state.stalls[moon].owned >= at && state.stalls[moon].owned < unlockNeed(state, incense) && state.night.offered.indexOf('mid-mooncake') < 0) {
      offer = { kind: 'charm', stall: 'mooncake', options: charmOptions(state, 'mooncake', false) };
      if (pushOffer(state, offer)) { state.night.offered.push('mid-mooncake'); added = true; }
    }
    var mat = STALLS.length - 1;
    if (offerRoom(state) && unlocked(state, mat) && state.stalls[mat].owned === 0 && !(state.night.kept) && state.night.offered.indexOf('mat-wait') < 0 && oneCost(state, 'stories', null) > state.cash) {
      offer = { kind: 'charm', stall: 'stories', options: charmOptions(state, 'stories', false) };
      if (pushOffer(state, offer)) { state.night.offered.push('mat-wait'); added = true; }
    }
    /* Story Mat growth only changes later mats, so that charm waits until the lane stays open. */
    if (state.night.kept && state.night.offered.indexOf('kept-lane') < 0) {
      state.night.offered.push('kept-lane');
      offer = { kind: 'charm', stall: 'stories', options: charmOptions(state, 'stories', false) };
      if (offer.options.length) {
        if (!state.night.offer) state.night.offer = offer;
        else state.night.queue.push(offer);
        added = true;
      }
    }
    if (added) touchQuiet(state);
    return added;
  }
  function recordNight(state) {
    if (!state.night || state.night.recorded) return false;
    state.night.recorded = true;
    state.meta.nights.push({
      n: state.night.n,
      seed: state.night.seed,
      omen: state.night.omen || null,
      charms: state.night.charms.slice()
    });
    var pool = POOL_START + state.meta.nights.length * 2;
    state.meta.pool = pool > CHARMS.length ? CHARMS.length : pool;
    return true;
  }
  function dawnDue(state) {
    var mat = state && state.stalls && state.stalls[STALLS.length - 1];
    var i;
    if (!mat || !(mat.owned >= 1) || !state.night || state.night.kept) return false;
    if (!unlocked(state, STALLS.length - 1)) return false;
    for (i = 0; i < STALLS.length - 1; i++) {
      if (!state.stalls[i] || !(state.stalls[i].owned >= 1)) return false;
    }
    return true;
  }
  function noteDawn(state) {
    if (!dawnDue(state) || !state.night) return false;
    var froze = false;
    if (typeof state.night.earned !== 'number') {
      state.night.earned = state.lifetime;
      froze = true;
    }
    return recordNight(state) || froze;
  }
  function dawnCopy(state) {
    var n = state.night && state.night.n > 0 ? state.night.n : 1;
    var ch = CHAPTERS[(n - 1) % CHAPTERS.length];
    var names = state.stalls.map(function (s, i) { return spec(i).name + ' ' + s.owned; }).join(', ');
    var omen = state.night && omenById(state.night.omen);
    var charms = ((state.night && state.night.charms) || []).map(function (id) {
      var c = charmById(id);
      return c ? c.name : id;
    });
    var summary = names + '. ' + (omen ? omen.name : 'No omen') + '. ' +
      (charms.length ? charms.join(', ') : 'No charm') + '. ' +
      (typeof Arcade !== 'undefined' && Arcade.fmt ? Arcade.fmt(typeof state.night.earned === 'number' ? state.night.earned : state.lifetime) : String(Math.round(typeof state.night.earned === 'number' ? state.night.earned : state.lifetime))) + ' coins earned tonight.';
    return { title: ch.title, lead: ch.text, summary: summary, next: 'Next night', choice: 'Keep the lane open' };
  }
  function noteOffer(state) {
    var offer = state.night && state.night.offer;
    if (!offer || !state.meta) return false;
    var list = offer.kind === 'omen' ? state.meta.omens : state.meta.charms;
    var changed = false, i, id;
    for (i = 0; i < offer.options.length; i++) {
      id = offer.options[i];
      if (list.indexOf(id) < 0) { list.push(id); changed = true; }
    }
    return changed;
  }
  function changesRate(row) {
    var key, patch;
    if (!row || !row.set) return false;
    for (key in row.set) {
      if (!Object.prototype.hasOwnProperty.call(row.set, key)) continue;
      patch = row.set[key];
      if (patch && patch.rate != null) return true;
    }
    return false;
  }
  function keepLane(state) {
    if (!state.night) return state;
    noteDawn(state);
    state.night.kept = true;
    return state;
  }
  function nextNight(state) {
    var meta = state.meta || emptyMeta();
    state.meta = meta;
    recordNight(state);
    var n = (state.night && state.night.n > 0 ? state.night.n : 1) + 1;
    var seed = stepSeed(state.night ? state.night.seed : 1);
    state.cash = 0;
    state.lifetime = 0;
    state.bulk = 1;
    state.stalls = STALLS.map(function () { return { owned: 0, serves: 0, hired: false }; });
    state.night = beginNight(n, seed);
    return state;
  }
  function codexView(state) {
    var meta = state.meta || emptyMeta();
    return {
      nights: meta.nights.map(function (n) {
        var omen = omenById(n.omen);
        return {
          n: n.n,
          seed: n.seed,
          omen: omen ? omen.name : '',
          charms: (n.charms || []).map(function (id) { var c = charmById(id); return c ? c.name : ''; }).filter(Boolean)
        };
      }),
      omens: meta.omens.map(function (id) { return omenById(id); }).filter(Boolean).map(function (o) { return { name: o.name, line: o.line }; }),
      charms: meta.charms.map(function (id) { return charmById(id); }).filter(Boolean).map(function (c) { return { name: c.name, line: c.line }; }),
      omenCount: OMENS.length,
      charmCount: CHARMS.length
    };
  }
  function charmPickScore(state, offer, id) {
    var charm = charmById(id);
    if (!charm) return -1;
    var local = charm.stall === offer.stall ? 10 : 0;
    var i = stallIndex(charm.stall);
    var stall = spec(i);
    if (!stall) return local;
    var rate = charm.set && charm.set[stall.id] && charm.set[stall.id].rate != null ? charm.set[stall.id].rate : stallField(state, stall.id, 'rate', stall.rate);
    var base = charm.set && charm.set[stall.id] && charm.set[stall.id].base != null ? charm.set[stall.id].base : stallField(state, stall.id, 'base', stall.base);
    var growth = charm.set && charm.set[stall.id] && charm.set[stall.id].growth != null ? charm.set[stall.id].growth : stallField(state, stall.id, 'growth', stall.growth);
    return local + rate / (base * growth);
  }
  function autoPick(state, policy) {
    var taken = [], guard = 0, offer, best, score, i, s, id;
    syncOffers(state);
    while (state.night && state.night.offer && guard++ < 12) {
      offer = state.night.offer;
      if (offer.kind === 'omen') choose(state, 0);
      else if (policy === 'skip') skipOffer(state);
      else {
        best = 0;
        score = -Infinity;
        for (i = 0; i < offer.options.length; i++) {
          s = charmPickScore(state, offer, offer.options[i]);
          if (s > score) { score = s; best = i; }
        }
        id = choose(state, best);
        if (id) taken.push(id);
      }
      syncOffers(state);
    }
    return taken;
  }

  window.NightMarket = {
    STALLS: STALLS,
    SAVE_KEY: SAVE_KEY,
    SAVE_VERSION: SAVE_VERSION,
    OFFLINE_CAP: OFFLINE_CAP,
    OFFLINE_RATE: OFFLINE_RATE,
    UNLOCK_AT: UNLOCK_AT,
    STALL_MILESTONES: STALL_MILESTONES,
    LANE_MILESTONES: LANE_MILESTONES,
    LANE_FACTORS: LANE_FACTORS,
    NEXT_MARKS: NEXT_MARKS,
    FINALE_AT: FINALE_AT,
    HOLD_PER_SEC: HOLD_PER_SEC,
    PAYBACK_CAP: PAYBACK_CAP,
    CHAPTERS: CHAPTERS,
    OMENS: OMENS,
    CHARMS: CHARMS,
    fresh: fresh,
    armNight: armNight,
    omenById: omenById,
    charmById: charmById,
    servesNeed: servesNeed,
    choose: choose,
    prepareMat: prepareMat,
    charmUseful: charmUseful,
    charmOptions: charmOptions,
    offerLine: offerLine,
    nextOfferLine: nextOfferLine,
    elapse: elapse,
    touchQuiet: touchQuiet,
    seedLead: seedLead,
    seedUnlock: seedUnlock,
    newSeed: newSeed,
    charmPlan: charmPlan,
    midAt: midAt,
    nightShape: nightShape,
    noteOffer: noteOffer,
    changesRate: changesRate,
    skipOffer: skipOffer,
    reroll: reroll,
    syncOffers: syncOffers,
    dawnDue: dawnDue,
    noteDawn: noteDawn,
    dawnCopy: dawnCopy,
    keepLane: keepLane,
    nextNight: nextNight,
    codexView: codexView,
    autoPick: autoPick,
    lowestOwned: lowestOwned,
    laneMult: laneMult,
    nextMark: nextMark,
    countToNext: countToNext,
    nextGoalLine: nextGoalLine,
    laneLine: laneLine,
    chapterTitle: chapterTitle,
    chapterLine: chapterLine,
    finaleReached: finaleReached,
    finaleCopy: finaleCopy,
    unlocked: unlocked,
    income: income,
    production: production,
    addCash: addCash,
    handSell: handSell,
    holdRate: holdRate,
    holdCredit: holdCredit,
    canHire: canHire,
    hire: hire,
    quote: quote,
    cost: cost,
    bestIndex: bestIndex,
    buy: buy,
    buyExact: buyExact,
    secondsToNext: secondsToNext,
    stallMult: stallMult,
    paybackSeconds: paybackSeconds,
    paybackLine: paybackLine,
    paybackLabel: paybackLabel,
    awayRule: awayRule,
    goal: goal,
    dawnGoal: dawnGoal,
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
