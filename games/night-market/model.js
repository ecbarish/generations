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
    return { nights: [], omens: [], charms: [], pool: POOL_START, pairs: [] };
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
  /* Seed 1 keeps the catalogue, so the no-omen night stays on its clock.
     Any other seed opens one stall at 6 and holds the opposite stall until the
     one before it reaches 12. Twelve is the incense tray's own count. Twenty
     made the climb from a handful of carts to the lantern a two-minute wait
     with nothing to decide. The stall you buy to reach the early one costs
     three quarters of its price. The stall you buy to reach the late one costs
     half as much again. The early stall also doubles at 20. */
  function seedLead(seed) {
    seed = seed >>> 0;
    if (seed === 1) return -1;
    return 1 + ((seed >>> 2) % 4);
  }
  function seedLag(seed) {
    var lead = seedLead(seed);
    if (lead < 0) return -1;
    return 1 + ((lead + 1) % 4);
  }
  function catalogueUnlock(i) {
    var stall = spec(i);
    return stall && stall.unlockAt ? stall.unlockAt : UNLOCK_AT;
  }
  function seedUnlock(seed, i) {
    if (i <= 0) return catalogueUnlock(i);
    seed = seed >>> 0;
    /* Seed 1 keeps every catalogue count, including the tray at 12 and the mat at 10. */
    if (seed === 1) return catalogueUnlock(i);
    var lead = seedLead(seed);
    if (lead < 0) return catalogueUnlock(i);
    if (i === lead) return 6;
    /* The tray is not stuck at 12. 10, 12 and 14 are counts the night already uses. */
    if (i === 4) return [10, 12, 14][seed % 3];
    if (i === seedLag(seed)) return 12;
    return catalogueUnlock(i);
  }
  function seedPriceFactor(seed, i) {
    var lead = seedLead(seed);
    if (lead < 0 || !(i >= 0)) return 1;
    if (i === lead - 1) return 0.75;
    if (i === seedLag(seed) - 1) return 1.5;
    return 1;
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
    var omenOptions = drawOmens(seed, null, 0);
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
      boosts: [],
      priced: [],
      twists: [],
      half: [],
      lates: [],
      sustain: [],
      fillerOpen: 0,
      fillerUsed: 0,
      offered: [],
      queue: [],
      shown: omenOptions.map(function (id) { return 'omen:' + id; }),
      recent: [],
      costCuts: 0,
      pairs: [],
      offer: { kind: 'omen', stall: null, options: omenOptions }
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
    var twists = state.night.twists || [];
    for (i = 0; i < twists.length; i++) {
      charm = twistById(twists[i]);
      if (charm) list.push(charm);
    }
    var boosts = state.night.boosts || [];
    for (i = 0; i < boosts.length; i++) {
      if (BOOST_RATE[boosts[i]] != null) {
        var boosted = { set: {} };
        boosted.set[boosts[i]] = { rate: BOOST_RATE[boosts[i]] };
        list.push(boosted);
      }
    }
    var lates = state.night.lates || [];
    for (i = 0; i < lates.length; i++) {
      if (lates[i].indexOf('omen-') === 0) {
        var lateOmen = omenById(lates[i].slice(5));
        if (lateOmen) list.push(lateOmen);
      }
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
      if (!(owned < patch.milestones[0])) return false;
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
  function stallTaken(state, stallId) {
    var list = (state.night && state.night.charms) || [], n, row;
    for (n = 0; n < list.length; n++) {
      row = charmById(list[n]);
      if (row && row.stall === stallId) return true;
    }
    return false;
  }
  function charmStallOk(state, stallId) {
    var i = stallIndex(stallId);
    if (i < 0 || stallTaken(state, stallId)) return false;
    if (state.night && state.night.kept && stallId === 'stories') return true;
    if (!stallInPlay(state, i)) return false;
    if (!unlocked(state, i) && !(state.stalls[i] && state.stalls[i].owned > 0)) return false;
    /* A stall that just opened still has nothing on it. Its charm would not
       move tonight's income. Offer it once the player owns one. */
    if (!(state.stalls[i] && state.stalls[i].owned > 0)) return false;
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
      return charmUseful(state, c) && pending.indexOf(c.id) < 0 && charmStallOk(state, c.stall) &&
        !seenCard(state, 'charm', c.id) && !takenCard(state, 'charm', c.id);
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
    var n = Math.min(2, unique.length);
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

  function marksFor(state, i) {
    var id = spec(i) ? spec(i).id : '';
    var marks = id ? stallField(state, id, 'milestones', null) : null;
    var night = state && state.night;
    if (!marks && night && (seedLead(night.seed) === i || (night.early || []).indexOf(id) >= 0)) marks = [20, 50, 100, 150, 200, 300, 400];
    return marks || STALL_MILESTONES;
  }
  function stallMultOwned(state, i, owned) {
    return Idle.milestoneMult(owned, marksFor(state, i));
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
    return stallField(state, spec(i).id, 'rate', spec(i).rate) * st.owned * stallMultOwned(state, i, st.owned) * laneMult(state) * sustainMult(state, spec(i).id);
  }

  /* A later raise, after the named beats are used. Each one is a new card.
     Skipping it leaves the night's income alone. */
  function sustainMult(state, stallId) {
    var list = state && state.night && state.night.sustain;
    if (!list || !list.length) return 1;
    var n = 0, i;
    for (i = 0; i < list.length; i++) if (list[i] === stallId) n++;
    return n ? Math.pow(1.05, n) : 1;
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

  function nextMark(owned, state, i) {
    var marks = NEXT_MARKS;
    if (state && typeof i === 'number' && spec(i)) {
      var mile = marksFor(state, i);
      marks = owned < 10 ? [10].concat(mile) : mile;
    }
    for (var k = 0; k < marks.length; k++) if (owned < marks[k]) return marks[k];
    return 0;
  }

  function countToNext(owned, state, i) {
    if (owned && typeof owned === 'object') {
      i = state;
      state = owned;
      owned = state.stalls[i] ? state.stalls[i].owned : 0;
    }
    var at = nextMark(owned, state, i);
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
      var room = countToNext(state, i);
      var capN = room > 0 ? room : 20;
      afford = maxFit(i, owned, state.cash, capN, state);
      n = afford;
      while (n > 0 && paybackSeconds(state, i, n) > PAYBACK_CAP) n--;
      if (!(n > 0)) {
        /* The sim still refuses the slow batch. The button sells one copy. */
        return { count: 0, cost: one, blocked: afford > 0 ? 'payback' : 'cost' };
      }
      priced = cost(i, owned, n, state);
      return { count: n, cost: priced, blocked: null };
    }
    if (mode === 'next') {
      n = countToNext(state, i);
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
    return Arcade.fmtTime(Math.max(1, Math.round(seconds)));
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
    if (marksFor(state, i).indexOf(owned) >= 0 && seconds >= 30 * 60) {
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
      /* 10 opens the next stall. It does not double the row. The hint names only a real x2. */
      marks = marksFor(state, i);
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
    var at = nextMark(owned, state, i);
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
  function choiceKind(kind) {
    return kind === 'early' || kind === 'boost' || kind === 'priced' || kind === 'twist' || kind === 'half' || kind === 'late' || kind === 'sustain' || kind === 'pick';
  }
  function cleanOffer(offer) {
    if (!offer || !Array.isArray(offer.options)) return null;
    if (offer.kind !== 'omen' && offer.kind !== 'charm' && !choiceKind(offer.kind)) return null;
    var options = offer.options.filter(function (id) {
      if (offer.kind === 'omen') return knownId(OMENS, id);
      if (offer.kind === 'charm') return knownId(CHARMS, id);
      if (offer.kind === 'twist') return !!twistById(id);
      if (offer.kind === 'late') return !!(charmById(id) || (id.indexOf('omen-') === 0 && omenById(id.slice(5))));
      if (offer.kind === 'sustain') return stallIndex(String(id).split('@')[0]) >= 0;
      if (offer.kind === 'pick') {
        var pickBits = String(id).split(':');
        return pickBits.length > 1 && (pickBits[0] === 'charm' ? !!charmById(pickBits[1]) : pickBits[0] === 'twist' ? !!twistById(pickBits[1]) : pickBits[0] === 'again' ? stallIndex(String(pickBits[1]).split('@')[0]) >= 0 : stallIndex(pickBits[1]) >= 0);
      }
      return stallIndex(id) >= 0;
    });
    if (options.length < (offer.kind === 'omen' ? 1 : 2)) return null;
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
        early: (night.early || []).slice(),
        boosts: (night.boosts || []).slice(),
        priced: (night.priced || []).slice(),
        twists: (night.twists || []).slice(),
        half: (night.half || []).slice(),
        lates: (night.lates || []).slice(),
        sustain: (night.sustain || []).slice(),
        shown: (night.shown || []).slice(),
        fillerOpen: night.fillerOpen || 0,
        fillerUsed: night.fillerUsed || 0,
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
        pool: meta.pool > 0 ? meta.pool : POOL_START,
        pairs: (meta.pairs || []).slice()
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
    function keepIds(list, ok) {
      return Array.isArray(list) ? list.filter(function (id) { return typeof id === 'string' && (!ok || ok(id)); }) : [];
    }
    state.night.early = keepIds(o.night.early, function (id) { return stallIndex(id) >= 0; });
    state.night.boosts = keepIds(o.night.boosts, function (id) { return stallIndex(id) >= 0; });
    state.night.priced = keepIds(o.night.priced, function (id) { return stallIndex(id) >= 0; });
    state.night.twists = keepIds(o.night.twists, function (id) { return !!twistById(id); });
    state.night.half = keepIds(o.night.half, function (id) { return stallIndex(id) >= 0; });
    state.night.lates = keepIds(o.night.lates, function (id) {
      return !!(charmById(id) || (id.indexOf('omen-') === 0 && omenById(id.slice(5))));
    });
    state.night.sustain = keepIds(o.night.sustain, function (id) { return stallIndex(id) >= 0; });
    state.night.shown = keepIds(o.night.shown, function (id) { return id.indexOf(':') > 0; });
    state.night.fillerOpen = o.night.fillerOpen > 0 ? Math.floor(o.night.fillerOpen) : 0;
    state.night.fillerUsed = o.night.fillerUsed > 0 ? Math.floor(o.night.fillerUsed) : 0;
    state.night.offered = keepIds(o.night.offered, function (id) {
      return stallIndex(id) >= 0 || id === 'mid-mooncake' || id === 'mat-wait' || id === 'kept-lane' || id === 'mid-omen' || id.indexOf('late-') === 0 || id.indexOf('early-') === 0 || id.indexOf('boost-') === 0 || id.indexOf('priced-') === 0 || id.indexOf('twist-') === 0 || id.indexOf('half-') === 0 || id.indexOf('sustain-') === 0 || id.indexOf('pick-') === 0;
    });
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
      pool: Math.max(POOL_START, Math.min(CHARMS.length, Math.floor(o.meta.pool) || POOL_START)),
      pairs: Array.isArray(o.meta.pairs) ? o.meta.pairs.filter(function (id) { return typeof id === 'string'; }) : []
    };
    return state;
  }

  /* The game and the checks share this. The away cap and rate follow the night. */
  function createIdle(state, save) {
    return Idle.create({
    getRate: function () {
      if (dawnDue(state) && !(state.night && state.night.kept)) return 0;
      return income(state);
    },
    apply: function (amount) {
      if (dawnDue(state) && !(state.night && state.night.kept)) return;
      addCash(state, amount);
    },
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
  var TWISTS = [
    { id: 'warm-tea', name: 'Warmer tea', line: 'Tea earns 0.52 a second. Lanterns cost 770.', set: { tea: { rate: 0.52 }, lantern: { base: 770 } } },
    { id: 'loud-carts', name: 'Louder carts', line: 'Dumplings earn 1.05 a second. Mooncakes cost 7360.', set: { dumpling: { rate: 1.05 }, mooncake: { base: 7360 } } },
    { id: 'short-wick', name: 'Shorter wick', line: 'The Story Mat costs 1,760,000. Incense earns 460 a second.', set: { stories: { base: 1760000 }, incense: { rate: 460 } } },
    { id: 'quiet-tea', name: 'Quieter tea', line: 'Tea costs 5. Incense costs 77,000.', set: { tea: { base: 5 }, incense: { base: 77000 } } }
  ];
  var BOOST_RATE = { tea: 0.54, dumpling: 1.08, lantern: 6, mooncake: 48 };
  function twistById(id) { return byId(TWISTS, id); }
  function offeredHas(state, id) {
    return state.night.offered.indexOf(id) >= 0;
  }
  function placeOffer(state, offer) {
    if (offer && offer.generated) {
      var kept = (offer.options || []).filter(function (id) { return offerGate(state, offer.kind, id, false); });
      if (kept.length < 2) return false;
      offer.options = kept.slice(0, 2);
      var key = pairKey(offer.kind, offer.options);
      state.night.pairs = state.night.pairs || [];
      state.meta.pairs = state.meta.pairs || [];
      if (state.night.pairs.indexOf(key) < 0) state.night.pairs.push(key);
      if (state.meta.pairs.indexOf(key) < 0) state.meta.pairs.push(key);
      state.night.recent = offer.options.map(function (id) { return offer.kind + ':' + id; });
      if (offer.kind === 'priced' || offer.kind === 'half') state.night.costCuts = (state.night.costCuts || 0) + 1;
      if (offer.kind === 'pick') {
        offer.options.forEach(function (pid) {
          var bits = String(pid).split(':');
          var inner = bits[0] + ':' + bits.slice(1).join(':');
          if (state.night.shown.indexOf(inner) < 0) state.night.shown.push(inner);
          state.night.recent.push(inner);
          if (bits[0] === 'priced' || bits[0] === 'half') state.night.costCuts = (state.night.costCuts || 0) + 1;
        });
      }
    }
    touchQuiet(state);
    rememberCards(state, offer);
    if (!state.night.offer) state.night.offer = offer;
    else state.night.queue.push(offer);
    return true;
  }
  function liveIds(state) {
    var ids = [], i;
    for (i = 0; i < STALLS.length; i++) if (unlocked(state, i)) ids.push(STALLS[i].id);
    return ids;
  }
  function pairOf(state, kind, pool) {
    if (pool.length < 2) return null;
    var id = kind + '-' + pool[0];
    if (offeredHas(state, id)) return null;
    state.night.offered.push(id);
    return placeOffer(state, { kind: kind, stall: null, options: pool.slice(0, 2) });
  }
  function pushFiller(state) {
    var i, id, pool = [];
    var early = state.night.early || [];
    for (i = 0; i < liveIds(state).length; i++) {
      id = liveIds(state)[i];
      if (early.indexOf(id) >= 0 || seedLead(state.night.seed) === stallIndex(id)) continue;
      if (offeredHas(state, 'early-' + id)) continue;
      pool.push(id);
    }
    if (pool.length >= 2) return pairOf(state, 'early', pool);
    pool = [];
    var boosts = state.night.boosts || [];
    for (i = 0; i < liveIds(state).length; i++) {
      id = liveIds(state)[i];
      if (BOOST_RATE[id] == null || boosts.indexOf(id) >= 0 || offeredHas(state, 'boost-' + id)) continue;
      var stall = spec(stallIndex(id));
      var now = stallField(state, id, 'rate', stall ? stall.rate : 0);
      if (!(BOOST_RATE[id] > now)) continue;
      pool.push(id);
    }
    if (pool.length >= 2) return pairOf(state, 'boost', pool);
    pool = [];
    var priced = state.night.priced || [];
    for (i = 0; i < liveIds(state).length; i++) {
      id = liveIds(state)[i];
      if (priced.indexOf(id) >= 0 || offeredHas(state, 'priced-' + id)) continue;
      pool.push(id);
    }
    if (pool.length >= 2) return pairOf(state, 'priced', pool);
    var left = TWISTS.filter(function (row) { return (state.night.twists || []).indexOf(row.id) < 0 && !offeredHas(state, 'twist-' + row.id); });
    if (left.length >= 2) {
      state.night.offered.push('twist-' + left[0].id);
      return placeOffer(state, { kind: 'twist', stall: null, options: [left[0].id, left[1].id] });
    }
    return false;
  }
  function cardKey(kind, id) { return kind + ':' + id; }
  function seenCard(state, kind, id) {
    var list = (state.night && state.night.shown) || [];
    return list.indexOf(cardKey(kind, id)) >= 0;
  }
  function rememberCards(state, offer) {
    if (!state.night || !offer || !offer.options) return false;
    state.night.shown = state.night.shown || [];
    var changed = false, i, key;
    for (i = 0; i < offer.options.length; i++) {
      key = cardKey(offer.kind, offer.options[i]);
      if (state.night.shown.indexOf(key) >= 0) continue;
      state.night.shown.push(key);
      changed = true;
    }
    return changed;
  }
  function takenCard(state, kind, id) {
    var night = state.night || {};
    if (kind === 'charm') return (night.charms || []).indexOf(id) >= 0;
    if (kind === 'twist') return (night.twists || []).indexOf(id) >= 0;
    if (kind === 'early') return (night.early || []).indexOf(id) >= 0;
    if (kind === 'boost') return (night.boosts || []).indexOf(id) >= 0;
    if (kind === 'priced') return (night.priced || []).indexOf(id) >= 0;
    if (kind === 'half') return (night.half || []).indexOf(id) >= 0;
    if (kind === 'sustain') return false;
    if (kind === 'omen') return night.omen === id;
    return false;
  }
  function ownedOf(state, id) {
    var i = stallIndex(id);
    return i >= 0 && state.stalls[i] ? state.stalls[i].owned : 0;
  }
  /* Shorter wick is the Short wick omen. Offering it again is the same pick. */
  var TWIST_OMEN = { 'warm-tea': 'rain', 'loud-carts': 'ferry', 'short-wick': 'wick', 'quiet-tea': 'alley' };
  function twistRepeatsOmen(state, twist) {
    return !!(twist && state.night && TWIST_OMEN[twist.id] === state.night.omen);
  }
  function withListed(state, listName, id, fn) {
    var list = state.night[listName];
    var added = list.indexOf(id) < 0;
    if (added) list.push(id);
    var result = fn();
    if (added) list.pop();
    return result;
  }
  function twistHelps(state, id) {
    var twist = twistById(id);
    if (!twist || twistRepeatsOmen(state, twist)) return false;
    var beforeI = income(state);
    var beforeP = {}, key;
    for (key in twist.set) {
      if (Object.prototype.hasOwnProperty.call(twist.set, key)) beforeP[key] = oneCost(state, key, null);
    }
    var afterI = withListed(state, 'twists', id, function () { return income(state); });
    if (moneyText(beforeI) !== moneyText(afterI)) return true;
    var afterP = withListed(state, 'twists', id, function () {
      var out = {}, k;
      for (k in beforeP) out[k] = oneCost(state, k, null);
      return out;
    });
    for (key in beforeP) if (moneyText(beforeP[key]) !== moneyText(afterP[key])) return true;
    return false;
  }
  function priceMoves(before, after) {
    return moneyText(before) !== moneyText(after);
  }
  function earlyPool(state) {
    var pool = [], i, id, ids = liveIds(state);
    for (i = 0; i < ids.length; i++) {
      id = ids[i];
      if (id === 'stories') continue;
      if (takenCard(state, 'early', id) || seenCard(state, 'early', id)) continue;
      if (seedLead(state.night.seed) === stallIndex(id)) continue;
      if (offeredHas(state, 'early-' + id)) continue;
      /* "Doubles at 20" after 20 copies does not change the row. */
      if (ownedOf(state, id) >= 20) continue;
      pool.push(id);
    }
    return pool;
  }
  function boostPool(state) {
    var pool = [], i, id, ids = liveIds(state);
    for (i = 0; i < ids.length; i++) {
      id = ids[i];
      if (BOOST_RATE[id] == null || takenCard(state, 'boost', id) || seenCard(state, 'boost', id)) continue;
      if (offeredHas(state, 'boost-' + id)) continue;
      if (ownedOf(state, id) < 1) continue;
      var stall = spec(stallIndex(id));
      var now = stallField(state, id, 'rate', stall ? stall.rate : 0);
      if (!(BOOST_RATE[id] > now)) continue;
      if (income(state) > 0 && production(state, stallIndex(id)) > 0 && nightPercent(state, id, now, BOOST_RATE[id]) === 0) continue;
      pool.push(id);
    }
    return pool;
  }
  function pricedPool(state) {
    var pool = [], i, id, ids = liveIds(state);
    for (i = 0; i < ids.length; i++) {
      id = ids[i];
      if (takenCard(state, 'priced', id) || seenCard(state, 'priced', id) || offeredHas(state, 'priced-' + id)) continue;
      if (!priceMoves(oneCost(state, id, null), oneCost(state, id, null) * (59500 / 70000))) continue;
      pool.push(id);
    }
    return pool;
  }
  function twistPool(state) {
    return TWISTS.filter(function (row) {
      if (takenCard(state, 'twist', row.id) || seenCard(state, 'twist', row.id)) return false;
      if (offeredHas(state, 'twist-' + row.id)) return false;
      return twistHelps(state, row.id);
    });
  }
  /* A beat for the long save, including night 2's second half. Three quarters
     is the seed's own price, used once, on a stall the seed did not already
     cheapen. It waits until the ordinary beats are used up. */
  function halfPool(state) {
    if (!state.night || openStallCount(state) < 4) return [];
    var pool = [], i, id, before;
    for (i = 0; i < STALLS.length; i++) {
      if (!unlocked(state, i)) continue;
      id = STALLS[i].id;
      if (takenCard(state, 'half', id) || seenCard(state, 'half', id)) continue;
      if (seedPriceFactor(state.night.seed, i) === 0.75) continue;
      before = oneCost(state, id, null);
      if (!priceMoves(before, before * 0.75)) continue;
      pool.push(id);
    }
    return pool;
  }
  function matWait(state) {
    var mat = STALLS.length - 1;
    return !!(state && state.night && unlocked(state, mat) && state.stalls[mat].owned === 0 && !state.night.kept);
  }
  function openStallCount(state) {
    var n = 0, i;
    for (i = 0; i < STALLS.length; i++) if (unlocked(state, i)) n++;
    return n;
  }
  function fillerOffersLeft(state) {
    return Math.floor(earlyPool(state).length / 2) + Math.floor(boostPool(state).length / 2) +
      Math.floor(pricedPool(state).length / 2) + Math.floor(twistPool(state).length / 2);
  }
  function canSpendFiller(state) {
    return fillerOffersLeft(state) >= 1;
  }
  function pairKey(kind, options) {
    return kind + ':' + options.slice().sort().join('|');
  }
  function cardStall(kind, id) {
    if (kind === 'charm' || kind === 'late') {
      var charm = charmById(id);
      if (charm) return charm.stall;
      return '';
    }
    if (kind === 'sustain') return String(id).split('@')[0];
    if (stallIndex(id) >= 0) return id;
    return '';
  }
  function goalBuy(state) {
    var i, need, mat = STALLS.length - 1;
    for (i = 0; i < mat; i++) {
      if (!state.stalls[i].hired) continue;
      need = unlockNeed(state, i + 1);
      if (state.stalls[i].owned < need) return i;
    }
    if (unlocked(state, mat) && state.stalls[mat].owned === 0 && !(state.night && state.night.kept)) return mat;
    return -1;
  }
  function timeToGoal(state) {
    var i = goalBuy(state);
    var rate = income(state);
    if (i < 0 || !(rate > 0)) return Infinity;
    var price = cost(i, state.stalls[i].owned, 1, state);
    return Math.max(0, price - state.cash) / rate;
  }
  function withCard(state, kind, id, fn) {
    var night = state.night;
    var listName = kind === 'charm' || (kind === 'late' && charmById(id)) ? 'charms'
      : kind === 'boost' ? 'boosts'
      : kind === 'early' ? 'early'
      : kind === 'priced' ? 'priced'
      : kind === 'half' ? 'half'
      : kind === 'twist' ? 'twists'
      : kind === 'late' ? 'lates'
      : kind === 'sustain' || kind === 'again' ? 'sustain'
      : '';
    if (!listName) return fn();
    var list = night[listName] = night[listName] || [];
    var stored = kind === 'sustain' || kind === 'again' ? String(id).split('@')[0] : id;
    var added = list.indexOf(stored) < 0 || kind === 'sustain' || kind === 'again';
    if (kind === 'sustain' || kind === 'again' || list.indexOf(stored) < 0) list.push(stored);
    var result = fn();
    if (added) list.pop();
    return result;
  }
  /* Judged when the card is shown, not when it was queued. Both sides of a pair
     must pass. A cost cut has to move the goal, not a stall you are not buying. */
  function offerGate(state, kind, id, onTable) {
    if (kind === 'pick') {
      var pickBits = String(id).split(':');
      return offerGate(state, pickBits[0], pickBits.slice(1).join(':'), onTable);
    }
    if (!state || !state.night || kind === 'omen' || !id) return false;
    if (!onTable && (seenCard(state, kind, id) || takenCard(state, kind, id))) return false;
    if (!onTable && (state.night.recent || []).indexOf(kind + ':' + id) >= 0) return false;
    var stallId = cardStall(kind, id);
    var goalAt = goalBuy(state);
    var buyingFirst = goalAt >= 0 && stallId && spec(goalAt).id === stallId && ownedOf(state, stallId) < 1;
    if (stallId && ownedOf(state, stallId) < 1 && !buyingFirst) return false;
    if (kind === 'again') {
      var againStall = String(id).split('@')[0];
      if (ownedOf(state, againStall) < 1) return false;
      var againNeed = parseInt(String(id).split('@')[2], 10);
      if (!(againNeed > 0) || againNeed > 8) return false;
      var againText = moneyText(income(state));
      state.night.sustain = state.night.sustain || [];
      var againPushes = 0;
      while (againPushes < againNeed) {
        state.night.sustain.push(againStall);
        againPushes++;
      }
      var againMoved = moneyText(income(state)) !== againText;
      while (againPushes > 0) {
        state.night.sustain.pop();
        againPushes--;
      }
      return againMoved;
    }
    if (kind === 'early' && ownedOf(state, id) >= 20) return false;
    if (kind === 'charm') {
      var charm = charmById(id);
      if (!charm || !charmUseful(state, charm)) return false;
      var mile = charm.set && charm.set[charm.stall] && charm.set[charm.stall].milestones;
      if (mile && ownedOf(state, charm.stall) >= mile[0]) return false;
      if (mile && ownedOf(state, charm.stall) >= 1 && ownedOf(state, charm.stall) < mile[0]) {
        var mileI = stallIndex(charm.stall);
        var wasOwned = state.stalls[mileI].owned;
        state.stalls[mileI].owned = mile[0];
        var plainMile = income(state);
        var withMile = withCard(state, 'charm', id, function () { return income(state); });
        state.stalls[mileI].owned = wasOwned;
        return moneyText(plainMile) !== moneyText(withMile);
      }
    }
    if ((kind === 'priced' || kind === 'half') && (state.night.costCuts || 0) >= 1 && !onTable) return false;
    if (kind === 'early' && stallId && ownedOf(state, stallId) >= 1 && ownedOf(state, stallId) < 20) {
      var earlyI = stallIndex(stallId);
      var earlyOwned = state.stalls[earlyI].owned;
      state.stalls[earlyI].owned = 20;
      var plainAt = production(state, earlyI);
      var doubledAt = withCard(state, 'early', id, function () { return production(state, earlyI); });
      state.stalls[earlyI].owned = earlyOwned;
      if (plainAt > 0 && moneyText(plainAt) !== moneyText(doubledAt)) return true;
    }
    var before = income(state);
    var timeBefore = timeToGoal(state);
    var after = withCard(state, kind, id, function () { return income(state); });
    var timeAfter = withCard(state, kind, id, function () { return timeToGoal(state); });
    if (moneyText(before) === moneyText(after) && !(timeBefore > 0 && timeAfter < timeBefore)) return false;
    if (kind === 'twist' && moneyText(before) !== moneyText(after)) return true;
    var incomeMove = before > 0 ? Math.abs(after - before) / before : (after > before ? 1 : 0);
    var localBefore = stallId ? production(state, stallIndex(stallId)) : 0;
    var localAfter = stallId ? withCard(state, kind, id, function () { return production(state, stallIndex(stallId)); }) : 0;
    var localMove = localBefore > 0 ? Math.abs(localAfter - localBefore) / localBefore : 0;
    /* The night's income line has to move. A +0 on the big number is not an offer.
       Five percent of the row, or of the whole night, is the floor when the line does move. */
    if (moneyText(before) !== moneyText(after) && (incomeMove >= 0.05 || localMove >= 0.05 || kind === 'early' || kind === 'boost' || kind === 'charm')) return true;
    if ((kind === 'priced' || kind === 'half' || (kind === 'charm' && charmById(id) && charmById(id).set && charmById(id).set[charmById(id).stall] && charmById(id).set[charmById(id).stall].base != null)) && timeBefore > 0 && isFinite(timeBefore)) {
      if ((timeBefore - timeAfter) / timeBefore >= 0.10) return true;
    }
    return false;
  }
  function passingPair(state, kind, pool) {
    var pairs = [], i, j, key, used;
    for (i = 0; i < pool.length; i++) {
      if (!offerGate(state, kind, pool[i], false)) continue;
      for (j = i + 1; j < pool.length; j++) {
        if (!offerGate(state, kind, pool[j], false)) continue;
        key = pairKey(kind, [pool[i], pool[j]]);
        used = ((state.meta && state.meta.pairs) || []).indexOf(key) >= 0 || ((state.night.pairs) || []).indexOf(key) >= 0;
        pairs.push({ options: [pool[i], pool[j]], key: key, used: used });
      }
    }
    var fresh = pairs.filter(function (row) { return !row.used; });
    var pick = fresh.length ? fresh[0] : (pairs.length === 1 ? pairs[0] : null);
    if (!pick && pairs.length) pick = pairs[0];
    if (pairs.length > 1 && pick && pick.used) {
      pick = fresh[0] || null;
    }
    if (!pick) return null;
    return { mark: kind + '-' + pick.options[0], kind: kind, offer: { kind: kind, stall: null, options: pick.options.slice(), generated: true } };
  }
  function pairOffer(kind, pool) {
    return null;
  }
  function buildingFirst(state, pool) {
    var built = -1, i;
    for (i = 0; i < STALLS.length; i++) {
      if (state.stalls[i].hired && state.stalls[i].owned > 0) built = i;
    }
    var id = built >= 0 ? STALLS[built].id : '';
    return pool.slice().sort(function (a, b) {
      if (a === id) return -1;
      if (b === id) return 1;
      return 0;
    });
  }
  function passingCards(state) {
    var built = -1, i, buckets = { boost: [], early: [], twist: [], charm: [], priced: [], again: [] };
    var order = ['boost', 'twist', 'early', 'charm', 'priced', 'again'];
    for (i = 0; i < STALLS.length; i++) if (state.stalls[i].hired && state.stalls[i].owned > 0) built = i;
    var builtId = built >= 0 ? STALLS[built].id : '';
    function add(kind, id) {
      if (offerGate(state, kind, id, false)) buckets[kind].push(kind + ':' + id);
    }
    var rows = buildingFirst(state, boostPool(state));
    for (i = 0; i < rows.length; i++) add('boost', rows[i]);
    rows = earlyPool(state);
    if (builtId && rows.indexOf(builtId) >= 0) add('early', builtId);
    for (i = 0; i < rows.length; i++) if (rows[i] !== builtId) add('early', rows[i]);
    rows = twistPool(state);
    for (i = 0; i < rows.length; i++) add('twist', rows[i].id);
    for (i = 0; i < CHARMS.length; i++) add('charm', CHARMS[i].id);
    if ((state.night.costCuts || 0) < 1) {
      rows = pricedPool(state);
      for (i = 0; i < rows.length; i++) add('priced', rows[i]);
    }
    var queued = 0;
    for (i = 0; i < order.length; i++) queued += buckets[order[i]].length;
    /* A raise is a new card. Serials already shown this night are skipped, and a
       pair that already came up (this night or the one before) steps forward
       while another pair still changes the income line. */
    if (queued < 2) {
      var raiseTargets = [];
      if (builtId) raiseTargets.push(builtId);
      for (i = 0; i < STALLS.length; i++) {
        if (STALLS[i].id === 'stories' || !state.stalls[i].hired || state.stalls[i].owned < 1) continue;
        if (raiseTargets.indexOf(STALLS[i].id) < 0) raiseTargets.push(STALLS[i].id);
      }
      var raiseId = function (stallId, serial) {
        var text = moneyText(income(state));
        var n = 0;
        state.night.sustain = state.night.sustain || [];
        while (n < 8 && moneyText(income(state)) === text) {
          state.night.sustain.push(stallId);
          n++;
        }
        var moved = moneyText(income(state)) !== text;
        var pops = n;
        while (pops > 0) { state.night.sustain.pop(); pops--; }
        var raised = moved ? stallId + '@' + serial + '@' + n : '';
        return raised && offerGate(state, 'again', raised, false) ? raised : '';
      };
      var ti, maxSerial, shownList, sk, num, serial, guard, sideA, sideB, raisedKey, raisedUsed, raisedPick;
      for (ti = 0; ti < raiseTargets.length && buckets.again.length < 2; ti++) {
        maxSerial = 0;
        shownList = state.night.shown || [];
        for (sk = 0; sk < shownList.length; sk++) {
          if (shownList[sk].indexOf('again:' + raiseTargets[ti] + '@') !== 0) continue;
          num = parseInt(shownList[sk].split('@')[1], 10);
          if (num > maxSerial) maxSerial = num;
        }
        serial = maxSerial;
        raisedPick = null;
        for (guard = 0; guard < 8; guard++) {
          sideA = raiseId(raiseTargets[ti], serial + 1);
          sideB = raiseId(raiseTargets[ti], serial + 2);
          if (!sideA || !sideB) break;
          raisedKey = pairKey('pick', ['again:' + sideA, 'again:' + sideB]);
          raisedUsed = ((state.meta && state.meta.pairs) || []).indexOf(raisedKey) >= 0 || ((state.night.pairs) || []).indexOf(raisedKey) >= 0;
          raisedPick = [sideA, sideB];
          if (!raisedUsed) break;
          serial += 2;
        }
        if (raisedPick) {
          buckets.again.push('again:' + raisedPick[0]);
          buckets.again.push('again:' + raisedPick[1]);
        }
      }
    }
    var pool = [], n = 0, more = true;
    while (more) {
      more = false;
      for (i = 0; i < order.length; i++) {
        if (buckets[order[i]][n]) { pool.push(buckets[order[i]][n]); more = true; }
      }
      n++;
    }
    return pool;
  }
  function mixedOffer(state) {
    var pool = passingCards(state), i, j, key, fresh = null, any = null, used;
    if (pool.length < 2) return null;
    for (i = 0; i < pool.length && !fresh; i++) {
      for (j = i + 1; j < pool.length; j++) {
        key = pairKey('pick', [pool[i], pool[j]]);
        used = ((state.meta && state.meta.pairs) || []).indexOf(key) >= 0 || (state.night.pairs || []).indexOf(key) >= 0;
        if (!any) any = [pool[i], pool[j]];
        if (!used) { fresh = [pool[i], pool[j]]; break; }
      }
    }
    var options = fresh || (pool.length === 2 ? any : null);
    if (!options) return null;
    return { mark: 'pick-' + options[0], kind: 'pick', offer: { kind: 'pick', stall: null, options: options, generated: true } };
  }
  function fillerOffer(state) {
    return passingPair(state, 'early', earlyPool(state)) ||
      passingPair(state, 'boost', buildingFirst(state, boostPool(state))) ||
      passingPair(state, 'twist', twistPool(state).map(function (row) { return row.id; })) ||
      passingPair(state, 'priced', pricedPool(state)) ||
      passingPair(state, 'half', halfPool(state));
  }
  function cardDead(state, kind, id) {
    if (takenCard(state, kind, id)) return true;
    if (kind === 'early') {
      if (ownedOf(state, id) >= 20) return true;
      if (seedLead(state.night.seed) === stallIndex(id)) return true;
    }
    if (kind === 'boost') {
      var stall = spec(stallIndex(id));
      var now = stallField(state, id, 'rate', stall ? stall.rate : 0);
      if (!(BOOST_RATE[id] > now)) return true;
      if (ownedOf(state, id) < 1) return true;
      if (income(state) > 0 && production(state, stallIndex(id)) > 0 && nightPercent(state, id, now, BOOST_RATE[id]) === 0) return true;
    }
    if (kind === 'charm') {
      var charm = charmById(id);
      /* A placed card leaves only when it no longer changes the night. Owning
         nothing is handled when the card is chosen, so a hand-set offer stays. */
      if (!charm || !charmUseful(state, charm) || takenCard(state, 'charm', id)) return true;
    }
    if (kind === 'twist') return !twistHelps(state, id);
    if (kind === 'priced' || kind === 'half') {
      var before = oneCost(state, id, null);
      var factor = kind === 'half' ? 0.75 : (59500 / 70000);
      if (!priceMoves(before, before * factor)) return true;
    }
    if (kind === 'sustain') return !sustainHelps(state, String(id).split('@')[0]);
    return false;
  }
  function pruneOffer(state) {
    var offer = state.night && state.night.offer;
    if (!offer || offer.kind === 'omen') return false;
    var keep = offer.options.filter(function (id) {
      if (cardDead(state, offer.kind, id)) return false;
      if (offer.generated && !offerGate(state, offer.kind, id, true)) return false;
      return true;
    });
    if (keep.length === offer.options.length) return false;
    if (keep.length >= 2) { offer.options = keep; return true; }
    advanceOffer(state);
    return true;
  }
  /* Charms that change the night right now. One per stall, and the stall this
     beat is about comes first, so a dead card cannot take the pair's seat. */
  function gatedCharms(state, preferStall) {
    var rows = poolRows(state).filter(function (c) {
      if (seenCard(state, 'charm', c.id) || takenCard(state, 'charm', c.id)) return false;
      return offerGate(state, 'charm', c.id, false);
    });
    var seenStall = {}, unique = [], i;
    for (i = 0; i < rows.length; i++) {
      if (seenStall[rows[i].stall]) continue;
      seenStall[rows[i].stall] = true;
      unique.push(rows[i].id);
    }
    unique.sort(function (a, b) {
      var as = charmById(a).stall === preferStall ? 0 : 1;
      var bs = charmById(b).stall === preferStall ? 0 : 1;
      return as - bs;
    });
    return unique.length >= 2 ? unique.slice(0, 2) : [];
  }
  /* The next offer. elapse, syncOffers and the next-choice line all read this.
     No mutation. A gate that is already open comes before a quiet filler, so the
     line cannot name a trade while a charm is what will actually appear. */
  function peekGap(state) {
    if (!state.night) return { why: 'none', fire: null };
    var atDawn = dawnDue(state);
    var plan = charmPlan(state.night.seed), g, id, i, opts;
    if (offerRoom(state)) {
      for (g = 0; g < plan.length; g++) {
        id = plan[g];
        if (offeredHas(state, id)) continue;
        i = stallIndex(id);
        if (i < 0 || !unlocked(state, i)) continue;
        opts = gatedCharms(state, id);
        if (opts.length >= 2) return { why: 'now', fire: { mark: id, kind: 'charm', offer: { kind: 'charm', stall: id, options: opts, generated: true } } };
      }
    }
    var moon = stallIndex('mooncake');
    var incense = stallIndex('incense');
    var mat = STALLS.length - 1;
    var at = midAt(state.night.seed);
    if (offerRoom(state) && moon >= 0 && state.stalls[moon].owned >= at && state.stalls[moon].owned < unlockNeed(state, incense) && !offeredHas(state, 'mid-mooncake')) {
      opts = gatedCharms(state, 'mooncake');
      if (opts.length >= 2) return { why: 'now', fire: { mark: 'mid-mooncake', kind: 'charm', offer: { kind: 'charm', stall: 'mooncake', options: opts, generated: true } } };
      /* The mooncake charm does nothing until the table is hired. Offer another
         real pair now, instead of repeating the charms the player just skipped. */
      var midMixed = mixedOffer(state);
      if (midMixed) return { why: 'now', fire: { mark: 'mid-mooncake', kind: midMixed.kind, offer: midMixed.offer } };
    }
    if (offerRoom(state) && unlocked(state, mat) && state.stalls[mat].owned === 0 && !state.night.kept && !offeredHas(state, 'mat-wait') && oneCost(state, 'stories', null) > state.cash) {
      opts = gatedCharms(state, 'stories');
      if (opts.length >= 2) return { why: 'now', fire: { mark: 'mat-wait', kind: 'charm', offer: { kind: 'charm', stall: 'stories', options: opts, generated: true } } };
    }
    /* Quiet beats stop once the night has ended. A gate that is already open
       still uses the same peek, including the one that arrives with the mat. */
    if (atDawn) return { why: 'none', fire: null };
    if (!offeredHas(state, 'mid-omen') && moon >= 0 && state.stalls[moon].owned >= at) {
      var twists = twistPool(state).map(function (row) { return row.id; }).filter(function (cid) { return offerGate(state, 'twist', cid, false); });
      if (twists.length >= 2) return { why: 'quiet', fire: { mark: 'mid-omen', kind: 'twist', offer: { kind: 'twist', stall: 'mooncake', options: twists.slice(0, 2), generated: true } } };
    }
    if (!offeredHas(state, 'late-incense') && unlocked(state, incense) && ownedOf(state, 'incense') > 0 && !stallTaken(state, 'incense')) {
      var incenseOpts = gatedCharms(state, 'incense');
      if (incenseOpts.length >= 2) return { why: 'now', fire: { mark: 'late-incense', kind: 'incense', offer: { kind: 'charm', stall: 'incense', options: incenseOpts, generated: true } } };
    }
    if (!offeredHas(state, 'late-stories') && unlocked(state, mat) && state.stalls[mat].owned === 0 && !stallTaken(state, 'stories')) {
      var storyOpts = gatedCharms(state, 'stories');
      if (storyOpts.length >= 2) return { why: 'now', fire: { mark: 'late-stories', kind: 'stories', offer: { kind: 'charm', stall: 'stories', options: storyOpts, generated: true } } };
    }
    var stall = lowestStallId(state);
    var options = gatedCharms(state, stall);
    if (options.length >= 2) return { why: 'quiet', fire: { mark: null, kind: 'charm', offer: { kind: 'charm', stall: stall, options: options, generated: true } } };
    var filler = fillerOffer(state);
    if (filler) return { why: 'quiet', fire: filler };
    var mixed = mixedOffer(state);
    if (mixed) return { why: 'quiet', fire: mixed };
    var rescue = rescuePool(state);
    var late = passingPair(state, 'late', rescue);
    if (late) return { why: 'quiet', fire: late };
    return { why: 'none', fire: null };
  }
  /* Cards that were not on the table yet. The mat save spends these two at a
     time, so the last stretch still has a decision. An unseen omen keeps its
     own numbers. A charm outside tonight's earlier offers is still that charm. */
  function rescuePool(state) {
    if (!state.night || dawnDue(state)) return [];
    var pool = [], i, charm, omen;
    for (i = 0; i < CHARMS.length; i++) {
      charm = CHARMS[i];
      if (seenCard(state, 'charm', charm.id) || seenCard(state, 'late', charm.id) || takenCard(state, 'charm', charm.id)) continue;
      if (!charmUseful(state, charm) || !charmStallOk(state, charm.stall)) continue;
      pool.push(charm.id);
    }
    for (i = 0; i < OMENS.length; i++) {
      omen = OMENS[i];
      if (state.night.omen === omen.id || seenCard(state, 'omen', omen.id) || seenCard(state, 'late', 'omen-' + omen.id)) continue;
      pool.push('omen-' + omen.id);
    }
    return pool;
  }
  function sustainHelps(state, stallId) {
    var i = stallIndex(stallId);
    var before = production(state, i);
    if (!(before > 0)) return false;
    state.night.sustain = state.night.sustain || [];
    state.night.sustain.push(stallId);
    var after = production(state, i);
    state.night.sustain.pop();
    return moneyText(before) !== moneyText(after);
  }
  function sustainPool(state) {
    if (!state.night || dawnDue(state)) return [];
    var pool = [], i, stallId, shown;
    for (i = 0; i < STALLS.length; i++) {
      if (STALLS[i].id === 'stories') continue;
      stallId = STALLS[i].id;
      if (!unlocked(state, i) || ownedOf(state, stallId) < 1) continue;
      if (!sustainHelps(state, stallId)) continue;
      shown = 0;
      var list = state.night.shown || [], k, prefix = 'sustain:' + stallId + '@';
      for (k = 0; k < list.length; k++) if (list[k].indexOf(prefix) === 0) shown++;
      pool.push(stallId + '@' + (shown + 1));
    }
    return pool;
  }
  function gapOffer(state) {
    return peekGap(state).fire;
  }
  function waitingOnMat(state) {
    var peek = peekGap(state);
    return peek.why === 'bank';
  }
  function predictKey(fire) {
    if (!fire) return '';
    return fire.kind + ':' + (fire.offer && fire.offer.stall ? fire.offer.stall : '');
  }
  function pushGap(state) {
    var peek = peekGap(state);
    if (!peek.fire) return false;
    /* The next-choice line is this same peek. Once it has been asked, the
       offer waits until that sentence has been the line, and a different beat
       cannot slip in ahead of it. A caller that never asks is not locked. */
    if (state.night.predictOn) {
      if (state.night.predictKey !== predictKey(peek.fire) || !state.night.predictReady) return false;
    }
    if (!placeOffer(state, peek.fire.offer)) return false;
    if (peek.fire.mark) state.night.offered.push(peek.fire.mark);
    return true;
  }
  function elapse(state, dt) {
    if (!state || !state.night || !(dt > 0)) return false;
    if (state.night.offer || dawnDue(state)) {
      touchQuiet(state);
      return false;
    }
    state.night.quiet = (state.night.quiet || 0) + dt;
    /* A doubling at 20 goes stale if Max buys past it first. Offer it as soon
       as a stall is close, instead of waiting out the quiet. */
    var earlySoon = false;
    if (state.night.quiet < 100) {
      var soon = earlyPool(state), si, soonOwned;
      for (si = 0; si < soon.length; si++) {
        soonOwned = ownedOf(state, soon[si]);
        if (soonOwned >= 8 && soonOwned < 20) { earlySoon = true; break; }
      }
      if (!earlySoon) return false;
      var peeked = peekGap(state);
      if (!peeked.fire || peeked.fire.kind !== 'early') return false;
    }
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
    } else if (offer.kind === 'twist' && twistById(id)) {
      if (state.night.twists.indexOf(id) < 0) state.night.twists.push(id);
    } else if (offer.kind === 'early' && stallIndex(id) >= 0) {
      if (state.night.early.indexOf(id) < 0) state.night.early.push(id);
    } else if (offer.kind === 'boost' && BOOST_RATE[id] != null) {
      if (state.night.boosts.indexOf(id) < 0) state.night.boosts.push(id);
    } else if (offer.kind === 'priced' && stallIndex(id) >= 0) {
      if (state.night.priced.indexOf(id) < 0) state.night.priced.push(id);
    } else if (offer.kind === 'half' && stallIndex(id) >= 0) {
      if (state.night.half.indexOf(id) < 0) state.night.half.push(id);
    } else if (offer.kind === 'late') {
      if (charmById(id)) {
        if (state.night.charms.indexOf(id) < 0) state.night.charms.push(id);
      } else if (id.indexOf('omen-') === 0 && omenById(id.slice(5))) {
        if (state.night.lates.indexOf(id) < 0) state.night.lates.push(id);
      } else return null;
    } else if (offer.kind === 'pick') {
      var pickBits = String(id).split(':');
      var pickKind = pickBits[0];
      var pickId = pickBits.slice(1).join(':');
      if (pickKind === 'charm' && charmById(pickId)) {
        if (state.night.charms.indexOf(pickId) < 0) state.night.charms.push(pickId);
      } else if (pickKind === 'boost' && BOOST_RATE[pickId] != null) {
        if (state.night.boosts.indexOf(pickId) < 0) state.night.boosts.push(pickId);
      } else if (pickKind === 'early' && stallIndex(pickId) >= 0) {
        if (state.night.early.indexOf(pickId) < 0) state.night.early.push(pickId);
      } else if (pickKind === 'priced' && stallIndex(pickId) >= 0) {
        if (state.night.priced.indexOf(pickId) < 0) state.night.priced.push(pickId);
      } else if (pickKind === 'half' && stallIndex(pickId) >= 0) {
        if (state.night.half.indexOf(pickId) < 0) state.night.half.push(pickId);
      } else if (pickKind === 'twist' && twistById(pickId)) {
        if (state.night.twists.indexOf(pickId) < 0) state.night.twists.push(pickId);
      } else if (pickKind === 'again') {
        var againBits = String(pickId).split('@');
        var againTimes = parseInt(againBits[2], 10) || 1;
        state.night.sustain = state.night.sustain || [];
        while (againTimes--) state.night.sustain.push(againBits[0]);
      } else return null;
    } else if (offer.kind === 'sustain') {
      var sustainId = String(id).split('@')[0];
      if (stallIndex(sustainId) < 0) return null;
      state.night.sustain = state.night.sustain || [];
      state.night.sustain.push(sustainId);
    } else return null;
    advanceOffer(state);
    return id;
  }
  function skipOffer(state) {
    var offer = state.night && state.night.offer;
    if (!offer || offer.kind === 'omen') return false;
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
    var priced = state && state.night && state.night.priced;
    if (priced && priced.indexOf(stallId) >= 0) base = base * (59500 / 70000);
    var half = state && state.night && state.night.half;
    if (half && half.indexOf(stallId) >= 0) base = base * 0.75;
    var factor = seedPriceFactor(state && state.night ? state.night.seed : 1, stallIndex(stallId));
    if (factor !== 1) base = base * factor;
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
  function fillerReady(state) {
    if (charmOptions(state, lowestStallId(state), false).length >= 2) return true;
    var ids = liveIds(state);
    if (ids.length >= 2) return true;
    var left = TWISTS.filter(function (row) { return (state.night.twists || []).indexOf(row.id) < 0; });
    return left.length >= 2;
  }
  function describeOffer(next) {
    if (!next) return '';
    if (next.kind === 'incense') return 'The next choice comes as the Incense Tray grows.';
    if (next.kind === 'stories' || next.kind === 'late') return 'The next choice comes while you save for the Story Mat.';
    if (next.kind === 'early') return 'The next choice lets a stall double at 20.';
    if (next.kind === 'boost' || next.kind === 'sustain') return 'The next choice raises what a stall earns.';
    if (next.kind === 'pick') return 'The next choice changes the lane.';
    if (next.kind === 'priced' || next.kind === 'half') return 'The next choice makes a stall cheaper.';
    if (next.kind === 'twist') return 'The next choice is a small trade.';
    return 'The next choice comes before the lane is quiet for long.';
  }
  function nextOfferLine(state) {
    if (!state.night) return 'The next choice waits.';
    if (state.night.offer) return 'A choice is waiting.';
    if (dawnDue(state)) return 'No more choices tonight.';
    var next = gapOffer(state);
    var key = predictKey(next);
    if (!state.night.predictOn || state.night.predictKey !== key) {
      state.night.predictOn = true;
      state.night.predictKey = key;
      state.night.predictReady = false;
    } else state.night.predictReady = true;
    if (next) return describeOffer(next);
    var plan = charmPlan(state.night.seed), g, id, i, soonest = null, soonestAt = 99;
    for (g = 0; g < plan.length; g++) {
      id = plan[g];
      if (state.night.offered.indexOf(id) >= 0) continue;
      i = stallIndex(id);
      if (i < 0 || unlocked(state, i) || !gateViable(state, id)) continue;
      if (i < soonestAt) { soonest = spec(i); soonestAt = i; }
    }
    if (!soonest) {
      for (i = 1; i < STALLS.length - 1; i++) if (!unlocked(state, i)) { soonest = spec(i); break; }
    }
    if (soonest) return 'The next choice comes when the ' + soonest.name + ' opens.';
    var mat = STALLS.length - 1;
    if (!state.stalls[mat] || state.stalls[mat].owned < 1) return 'The next choice comes while you save for the Story Mat.';
    return 'No more choices tonight.';
  }
  function offerLine(state, charm) {
    if (!charm || !charm.stall) return charm && charm.line ? charm.line : '';
    var patch = charm.set && charm.set[charm.stall];
    var stall = spec(stallIndex(charm.stall));
    var name = stall ? stall.name : charm.stall;
    if (patch && patch.base != null) {
      var before = oneCost(state, charm.stall, null);
      var after = oneCost(state, charm.stall, patch.base);
      var cut = before > 0 ? Math.round((1 - after / before) * 100) : 0;
      return cut + '% cheaper, ' + name + ': ' + moneyText(before) + ' to ' + moneyText(after) + '.';
    }
    if (patch && patch.milestones) {
      return name + ' doubles at ' + patch.milestones[0] + ' instead of 25.';
    }
    if (patch && patch.rate != null) {
      var now = stallField(state, charm.stall, 'rate', stall ? stall.rate : patch.rate);
      var local = ratePercent(now, patch.rate);
      var earning = income(state) > 0 && production(state, stallIndex(charm.stall)) > 0;
      if (!earning) return name + ' +' + local + '%.';
      var total = nightPercent(state, charm.stall, now, patch.rate);
      return 'Your income +' + total + '%, ' + name + ' +' + local + '%.';
    }
    if (patch && patch.unlockAt != null) return name + ' opens at ' + patch.unlockAt + '.';
    return charm.line;
  }
  function choiceName(kind, id) {
    if (kind === 'omen') { var omen = omenById(id); return omen ? omen.name : id; }
    if (kind === 'charm') { var charm = charmById(id); return charm ? charm.name : id; }
    if (kind === 'twist') { var twist = twistById(id); return twist && twist.name ? twist.name : id; }
    if (kind === 'late') {
      if (charmById(id)) return charmById(id).name;
      if (id.indexOf('omen-') === 0) { var lateOmen = omenById(id.slice(5)); return lateOmen ? lateOmen.name : id; }
    }
    if (kind === 'pick') {
      var pickBits = String(id).split(':');
      return choiceName(pickBits[0], pickBits.slice(1).join(':'));
    }
    if (kind === 'again' || kind === 'sustain') {
      var sustainStall = spec(stallIndex(String(id).split('@')[0]));
      return sustainStall ? sustainStall.name : id;
    }
    var stall = spec(stallIndex(id));
    return stall ? stall.name : id;
  }
  function priceChoiceLine(state, id, factor) {
    var stall = spec(stallIndex(id));
    var name = stall ? stall.name : id;
    var before = oneCost(state, id, null);
    var after = before * factor;
    var cut = before > 0 ? Math.round((1 - after / before) * 100) : 0;
    return cut + '% cheaper, ' + name + ': ' + moneyText(before) + ' to ' + moneyText(after) + '.';
  }
  function twistChoiceLine(state, id) {
    var twist = twistById(id);
    if (!twist) return id;
    var before = income(state);
    var after = withListed(state, 'twists', id, function () { return income(state); });
    var incomeBit = 'Your income ' + moneyText(before) + ' to ' + moneyText(after) + ' a second. ';
    return incomeBit + twist.line;
  }
  function lateChoiceLine(state, id) {
    if (charmById(id)) return offerLine(state, charmById(id));
    var omen = id.indexOf('omen-') === 0 ? omenById(id.slice(5)) : null;
    if (!omen) return id;
    var before = income(state);
    state.night.lates.push(id);
    var after = income(state);
    state.night.lates.pop();
    return 'Your income ' + moneyText(before) + ' to ' + moneyText(after) + ' a second. ' + omen.line;
  }
  function choiceLine(state, kind, id) {
    if (kind === 'pick' || kind === 'again') {
      if (kind === 'again') {
        var againStallId = String(id).split('@')[0];
        var againName = spec(stallIndex(againStallId));
        var againTimes = parseInt(String(id).split('@')[2], 10);
        if (!(againTimes > 0)) againTimes = 1;
        var againBefore = income(state);
        state.night.sustain = state.night.sustain || [];
        var againLeft = againTimes;
        while (againLeft--) state.night.sustain.push(againStallId);
        var againAfter = income(state);
        againLeft = againTimes;
        while (againLeft--) state.night.sustain.pop();
        return 'Your income ' + moneyText(againBefore) + ' to ' + moneyText(againAfter) + ' a second. ' + (againName ? againName.name : againStallId) + ' earns more.';
      }
      var pickLine = String(id).split(':');
      return choiceLine(state, pickLine[0], pickLine.slice(1).join(':'));
    }
    if (kind === 'charm') return offerLine(state, charmById(id));
    if (kind === 'omen') {
      var omen = omenById(id);
      return omen ? omen.line : id;
    }
    if (kind === 'twist') return twistChoiceLine(state, id);
    if (kind === 'late') return lateChoiceLine(state, id);
    if (kind === 'half') return priceChoiceLine(state, id, 0.75);
    var stall = spec(stallIndex(id));
    var name = stall ? stall.name : id;
    if (kind === 'early') return name + ' doubles at 20 instead of 25.';
    if (kind === 'priced') return priceChoiceLine(state, id, 59500 / 70000);
    if (kind === 'sustain') {
      var sustainStallId = String(id).split('@')[0];
      var sustainIndex = stallIndex(sustainStallId);
      var sustainStall = spec(sustainIndex);
      var sustainName = sustainStall ? sustainStall.name : sustainStallId;
      var sustainBefore = production(state, sustainIndex);
      state.night.sustain = state.night.sustain || [];
      state.night.sustain.push(sustainStallId);
      var sustainAfter = production(state, sustainIndex);
      state.night.sustain.pop();
      var sustainLocal = sustainBefore > 0 ? Math.round((sustainAfter / sustainBefore - 1) * 100) : 0;
      var sustainIncome = income(state);
      state.night.sustain.push(sustainStallId);
      var sustainIncomeAfter = income(state);
      state.night.sustain.pop();
      var sustainTotal = sustainIncome > 0 ? Math.round((sustainIncomeAfter / sustainIncome - 1) * 100) : 0;
      if (!(sustainTotal > 0)) return sustainName + ' +' + sustainLocal + '%.';
      return 'Your income +' + sustainTotal + '%, ' + sustainName + ' +' + sustainLocal + '%.';
    }
    if (kind === 'boost') {
      var now = stallField(state, id, 'rate', stall ? stall.rate : BOOST_RATE[id]);
      var local = ratePercent(now, BOOST_RATE[id]);
      var total = nightPercent(state, id, now, BOOST_RATE[id]);
      if (!(income(state) > 0)) return name + ' +' + local + '%.';
      return 'Your income +' + total + '%, ' + name + ' +' + local + '%.';
    }
    return id;
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
    if (offer.generated) next = next.filter(function (id) { return offerGate(state, offer.kind, id, false); });
    if (next.length < 2 || sameSet(next, before)) return false;
    state.night.rerollUsed = true;
    /* The opening omen is three choices, and the night's shape sits in that draw.
       A stall pair stays two. */
    offer.options = offer.kind === 'omen' ? next : next.slice(0, 2);
    var rerollKey = pairKey(offer.kind, offer.options);
    state.night.pairs = state.night.pairs || [];
    state.meta.pairs = state.meta.pairs || [];
    if (state.night.pairs.indexOf(rerollKey) < 0) state.night.pairs.push(rerollKey);
    if (state.meta.pairs.indexOf(rerollKey) < 0) state.meta.pairs.push(rerollKey);
    state.night.recent = offer.options.map(function (id) { return offer.kind + ':' + id; });
    rememberCards(state, offer);
    return true;
  }
  var CHARM_OFFER_CAP = 4;
  function offerRoom(state) {
    var n = 0, i, id, list = state.night.offered || [];
    for (i = 0; i < list.length; i++) {
      id = list[i];
      if (stallIndex(id) >= 0 || id === 'mid-mooncake' || id === 'mat-wait' || id === 'kept-lane') n++;
    }
    return n < CHARM_OFFER_CAP;
  }
  function pushOffer(state, offer) {
    if (!offer.options || offer.options.length < 2) return false;
    rememberCards(state, offer);
    if (!state.night.offer) state.night.offer = offer;
    else state.night.queue.push(offer);
    return true;
  }
  function syncOffers(state) {
    if (!state.night) return false;
    if (pruneOffer(state)) { /* a dead card left the table */ }
    var added = false;
    /* The same peek the next-choice line reads. A quiet filler still waits for elapse. */
    if (!state.night.offer) {
      var peek = peekGap(state);
      if (peek.fire && peek.why === 'now') added = pushGap(state);
    }
    /* Story Mat growth only changes later mats, so that charm waits until the lane stays open. */
    if (state.night.kept && state.night.offered.indexOf('kept-lane') < 0) {
      state.night.offered.push('kept-lane');
      var offer = { kind: 'charm', stall: 'stories', options: charmOptions(state, 'stories', false) };
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
    var remembered = rememberCards(state, offer);
    if (offer.kind !== 'omen' && offer.kind !== 'charm') return remembered;
    var list = offer.kind === 'omen' ? state.meta.omens : state.meta.charms;
    var changed = false, i, id;
    for (i = 0; i < offer.options.length; i++) {
      id = offer.options[i];
      if (list.indexOf(id) < 0) { list.push(id); changed = true; }
    }
    return changed || remembered;
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
    choiceLine: choiceLine,
    choiceName: choiceName,
    nextOfferLine: nextOfferLine,
    offerGate: offerGate,
    pairKey: pairKey,
    elapse: elapse,
    touchQuiet: touchQuiet,
    seedLead: seedLead,
    seedLag: seedLag,
    seedUnlock: seedUnlock,
    seedPriceFactor: seedPriceFactor,
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
    unlockNeed: unlockNeed,
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
