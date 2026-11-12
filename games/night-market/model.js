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
  var SAVE_VERSION = 1;
  var OFFLINE_CAP = 4 * 3600;
  var OFFLINE_RATE = 0.5;
  /* 1,000,000 coins is minute 21 on the 2.5s and 5s buyers. 250,000,000 is inside
     45 to 75 minutes for both, with a few minutes of room on each side. */
  var MOVE_AT = 250000000;
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

  /* Old Wen tells one chapter of the tortoise's climb for each mat. The tenth is the ending.
     These lines are the game's own tale. The unused tale files stay unloaded. */
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

  var QUAY = [
    {
      id: 'tea', name: 'Tea Stall', vendor: 'Mei',
      habit: 'Mei opens before the lanterns are lit.',
      serve: 'Pour a cup', left: 'cup', lefts: 'cups', hire: 'Ask Mei to take the stall',
      base: 6, growth: 1.07, rate: 0.45, serves: 25, hand: 1,
      looks: ['One lantern', 'Two lanterns', 'A striped awning', 'A crowd at the cups'],
      gossip: 'Mei says the regulars were waiting in the dark.',
      next: ''
    },
    {
      id: 'chestnut', name: 'Chestnut Brazier', vendor: 'Lin',
      habit: 'Lin saves the warmest paper cone for the last ferry worker.',
      serve: 'Fill a cone', left: 'cone', lefts: 'cones', hire: 'Ask Lin to tend the brazier',
      base: 20, growth: 1.08, rate: 4, serves: 25, hand: 1,
      looks: ['One iron pan', 'Two warm pans', 'A copper chimney', 'Steam above the quay'],
      gossip: 'Lin says the ferries ran late, so she kept the coals warm.',
      next: ''
    }
  ];

  var TALES = {
    tea: [
      { at: 'hired', title: 'Mei Opens Early', text: 'Mei takes over the tea stall and opens it before the lanterns are lit. A few regulars are already waiting in the dark, hands wrapped around their coats. She pours the first cup and says nothing, because the steam says enough.' },
      { at: '25', title: 'Warm Bread for the Row', text: 'Mei has twenty-five tea stalls pouring now, and the first one still opens before the lanterns. A baker stops by on his way to work and leaves a loaf of warm bread as thanks. Mei shares it with the whole row.' },
      { at: '50', title: 'The Quiet Hour', text: 'At fifty tea stalls, Mei still wakes before anyone else. She likes the quiet hour when the lane is blue and the kettles begin to sing. By the time the lanterns are lit, there is already a line.' },
      { at: '100', title: 'No One Waits in the Dark', text: 'Mei has a hundred tea stalls, and no one waits in the dark any more. Each one opens just before the lanterns, as if the lane were taking a breath. She smiles and pours one more cup for the street sweeper.' }
    ],
    dumpling: [
      { at: 'hired', title: 'Bo Folds and Talks', text: 'Bo rolls up his sleeves at the dumpling cart and begins to talk. He tells the regulars about his cousin\'s goat while his fingers pinch each fold. Nobody leaves until the steamer is full.' },
      { at: '25', title: 'The Goat Gets a Name', text: 'Twenty-five carts are folding now, and the goat in Bo\'s story has finally been given a name. The regulars argue about whether it suits her. Bo laughs, folds three more dumplings, and says it suits her fine.' },
      { at: '50', title: 'Listeners in the Lane', text: 'At fifty carts, people stay after their dumplings are gone just to hear how the story goes. Bo never rushes, because a good fold takes the time it takes. The steam rises, the goat gets lost again, and everyone cheers.' },
      { at: '100', title: 'One Long Story', text: 'Bo has a hundred carts, and every one is steaming while he tells the story he started on his first day. He says the goat is still lost, but nobody believes him. The dumplings sell, and the story goes on.' }
    ],
    lantern: [
      { at: 'hired', title: 'An Trims the Wicks', text: 'An takes the lantern stand and trims each wick with a small pair of silver scissors. She waits until the flame sits perfectly still before she hangs the lantern. She says a calm flame is a kind flame.' },
      { at: '25', title: 'Twenty-Five Steady Flames', text: 'Twenty-five lantern stands glow along the lane now, and An has trimmed every wick herself. A child asks why she takes so long. An says the light looks after the people, so she looks after the light.' },
      { at: '50', title: 'Clean Light', text: 'At fifty stands, An\'s wicks burn so clean that there is no smoke at all. The moths come to look, and then they simply sit and rest. An lets them, because a lantern should welcome everyone.' },
      { at: '100', title: 'The Alley, Lit', text: 'An has a hundred lantern stands, and the whole alley glows as softly as a sleeping cat. She trims the last wick of the night and waits for the flame to go still. Then she lets the lane see itself.' }
    ],
    mooncake: [
      { at: 'hired', title: 'Qiao Counts Twice', text: 'Qiao sets out her tins of mooncakes and counts them once, then counts them again. When a customer asks for one, she hands over the tin she likes least and keeps the best for later. The customer says it is delicious anyway.' },
      { at: '25', title: 'The Tin She Likes Best', text: 'Qiao has twenty-five tables now, and she counts every tin twice. She still gives away the one she likes least, and somehow it is always the first one asked for. She is starting to think the lane knows her secret.' },
      { at: '50', title: 'A Painted Sign', text: 'At fifty tables, a painter offers to make Qiao a sign. She counts her coins twice, nods, and asks for tins painted along the edge. The sign is finished by dusk, and the whole table looks proud of itself.' },
      { at: '100', title: 'Tins Along the Table', text: 'Qiao has a hundred tables, and tins line every one. She counts them twice that evening, just to be sure, and the number comes out the same both times. Qiao pats the nearest tin and smiles.' }
    ],
    incense: [
      { at: 'hired', title: 'Ren Lights Two Sticks', text: 'Ren takes the incense tray and lights one stick for the stall. Then he lights a second stick and sets it at the mouth of the alley, for anyone passing by. He says a lane should smell welcome before it looks it.' },
      { at: '25', title: 'Cedar Before Dusk', text: 'With twenty-five trays burning, the alley smells of cedar before anyone has arrived. Ren says that is the point of the second stick. Visitors follow the smell and find a smiling lane.' },
      { at: '50', title: 'A Bronze Stand', text: 'At fifty trays, Ren buys a small bronze stand for the alley stick. It holds the smoke in a thin ribbon that curls up toward the lanterns. Ren watches it for a while and lights the next stick.' },
      { at: '100', title: 'Smoke from the Gate', text: 'Ren has a hundred trays, and the smoke rises in soft ribbons you can see from the gate. He still lights one stick for the stall and one for the alley, just as he did on the first night. Some things stay the same.' }
    ],
    stories: [
      { at: 'hired', title: 'Old Wen Unrolls the Mat', text: 'Old Wen unrolls the story mat and sits down slowly, one knee at a time. He begins a tale about a tortoise who carried a lantern up a hill. Just before the ending, Old Wen stops, and the crowd leans in to pay for the rest.' },
      { at: '25', title: 'The Tortoise Climbs', text: 'Twenty-five mats are spread across the lane, and Old Wen\'s tortoise has reached the middle of the hill. The listeners bring cushions and tea. Old Wen smiles and stops right before the best part.' },
      { at: '50', title: 'A Paper Screen', text: 'At fifty mats, Old Wen paints a paper screen so the children can see the hill. The tortoise is very small and very brave on it. Just before the tortoise reaches the top, Old Wen pauses and asks who wants to hear the rest.' },
      { at: '100', title: 'The Ending, Twice', text: 'Old Wen has a hundred mats, and tonight he finally reaches the ending of the tortoise\'s tale. The crowd sighs happily, and then he begins again from the start. Nobody minds, because the lane loves the hill.' }
    ],
    chestnut: [
      { at: 'hired', title: 'Lin Takes the Brazier', text: 'Lin rakes the coals until they glow, then fills a paper cone for the last ferry worker. The chestnuts smell like the evening water. She keeps the warmest cone aside, as she always has.' },
      { at: '25', title: 'The Last Ferry', text: 'Twenty-five braziers line Willow Quay, and Lin still watches for the last ferry. The worker takes the warmest cone and stays to warm his hands. Lin nods and turns the next pan.' },
      { at: '50', title: 'A Copper Chimney', text: 'At fifty braziers a copper chimney goes up over Lin\'s first pan. The smoke leans out over the water and the ferries answer with their lamps. Lin says the quay should be easy to find in the dark.' },
      { at: '100', title: 'Steam above the Quay', text: 'Lin has a hundred braziers, and the steam sits over the water after the ferries stop. She fills one more cone and sets it on the rail. Someone will be cold when the next boat comes in.' }
    ]
  };

  function fresh() {
    return {
      cash: 0,
      lifetime: 0,
      seen: null,
      bulk: 1,
      place: 'lane',
      quay: null,
      stalls: STALLS.map(function () { return { owned: 0, serves: 0, hired: false }; })
    };
  }

  function onQuay(state) {
    return !!(state && state.place === 'quay' && state.quay && state.quay.length === 2);
  }

  function board(state) {
    return onQuay(state) ? { specs: QUAY, slots: state.quay } : null;
  }

  function activeSpecs(state) { return onQuay(state) ? QUAY : STALLS; }
  function activeSlots(state) { return onQuay(state) ? state.quay : state.stalls; }

  function spec(i) { return STALLS[i] || null; }

  /* A stall can ask for more than the usual ten of the one before it. Incense waits for twelve tables. */
  function unlockNeed(i) {
    var stall = spec(i);
    return stall && stall.unlockAt ? stall.unlockAt : UNLOCK_AT;
  }

  function unlocked(state, i) {
    if (onQuay(state)) return i === 0 || i === 1;
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

  /* 25, 50, 100, 150, 200, 300 and 400 each double the row again. */
  function stallMult(owned) {
    return Idle.milestoneMult(owned, STALL_MILESTONES);
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

  function timesWord(owned) {
    var m = stallMult(owned);
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
    if (onQuay(state)) {
      var q = state.quay[i];
      var qs = QUAY[i];
      if (!q || !qs || !q.hired || !(q.owned > 0)) return 0;
      return qs.rate * q.owned * stallMult(q.owned);
    }
    var st = state.stalls[i];
    if (!st || !st.hired || !(st.owned > 0)) return 0;
    return spec(i).rate * st.owned * stallMult(st.owned) * laneMult(state);
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
    var stall = onQuay(state) ? QUAY[i] : spec(i);
    var st = onQuay(state) ? state.quay[i] : state.stalls[i];
    if (!stall || !st) return { ok: false, reason: 'closed' };
    st.serves += 1;
    addCash(state, stall.hand);
    return {
      ok: true,
      ready: !st.hired && st.serves >= stall.serves
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

  function slotOf(state, i) {
    if (onQuay(state)) return { stall: QUAY[i], st: state.quay[i] };
    return { stall: spec(i), st: state.stalls[i] };
  }

  function canHire(state, i) {
    var row = slotOf(state, i);
    if (!unlocked(state, i) || !row.st || row.st.hired) return false;
    return row.st.serves >= row.stall.serves;
  }

  function hire(state, i) {
    var row = slotOf(state, i);
    if (!unlocked(state, i) || !row.st || !row.stall) return { ok: false, reason: 'closed' };
    if (row.st.hired) return { ok: false, reason: 'hired' };
    if (row.st.serves < row.stall.serves) {
      return { ok: false, reason: 'serves', need: row.stall.serves - row.st.serves };
    }
    row.st.hired = true;
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

  function cost(i, owned, n, stallOverride) {
    var stall = stallOverride || spec(i);
    n = Math.floor(n);
    if (!stall || !(n > 0)) return 0;
    if (!isFinite(owned) || owned < 0) owned = 0;
    else owned = Math.floor(owned);
    if (priceOrigin(owned + n - 1) === 0) return Idle.bulkCost(stall.base, stall.growth, owned, n);
    var total = 0, k;
    for (k = 0; k < n; k++) total += unitCost(stall, owned + k);
    return total;
  }

  function maxFit(i, owned, cash, limit, stallOverride) {
    var cap = limit > 0 ? limit : 80;
    if (!(cash > 0) || cost(i, owned, 1, stallOverride) > cash) return 0;
    var lo = 1, hi = 1;
    while (hi < cap && cost(i, owned, hi, stallOverride) <= cash) {
      lo = hi;
      hi = Math.min(cap, hi * 2);
    }
    if (cost(i, owned, hi, stallOverride) <= cash) return hi;
    while (lo < hi) {
      var mid = Math.ceil((lo + hi) / 2);
      if (cost(i, owned, mid, stallOverride) <= cash) lo = mid;
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

  function quote(state, i, mode) {
    var row = slotOf(state, i);
    var stall = row.stall;
    var st = row.st;
    if (!stall || !st) return { count: 0, cost: 0, blocked: 'closed' };
    var owned = st.owned;
    var over = onQuay(state) ? stall : null;
    var one = cost(i, owned, 1, over);
    if (!unlocked(state, i)) return { count: 0, cost: one, blocked: 'closed' };
    if (!st.hired) {
      if (mode !== 1 && mode !== '1') return { count: 0, cost: one, blocked: 'hire' };
      if (!(one >= 0) || one > state.cash) return { count: 0, cost: one, blocked: 'cost' };
      return { count: 1, cost: one, blocked: null };
    }
    var n, priced, afford;
    if (mode === 'max') {
      var room = countToNext(owned);
      var capN = room > 0 ? room : 20;
      afford = maxFit(i, owned, state.cash, capN, over);
      n = afford;
      while (n > 0 && paybackSeconds(state, i, n) > PAYBACK_CAP) n--;
      if (!(n > 0)) {
        /* Coins can cover a copy that Max still refuses. Say so, instead of a dead Buy 1. */
        return { count: 0, cost: one, blocked: afford > 0 ? 'payback' : 'cost' };
      }
      priced = cost(i, owned, n, over);
      return { count: n, cost: priced, blocked: null };
    }
    if (mode === 'next') {
      n = countToNext(owned);
      if (!(n > 0)) return { count: 0, cost: one, blocked: 'done' };
      var toward = maxFit(i, owned, state.cash, n, over);
      /* Greyed Next prices the next single step. A batch price does not match the one copy you are short. */
      if (!(toward > 0)) return { count: 0, cost: one, blocked: 'cost' };
      return { count: toward, cost: cost(i, owned, toward, over), blocked: null };
    }
    n = mode === 10 || mode === '10' ? 10 : 1;
    priced = cost(i, owned, n, over);
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
    var row = slotOf(state, i);
    if (!row.stall || !row.st || !unlocked(state, i)) {
      return { ok: false, reason: 'closed', count: 0, cost: 0 };
    }
    count = Math.floor(count);
    if (!row.st.hired && count !== 1) return { ok: false, reason: 'hire', count: 0, cost: 0 };
    var over = onQuay(state) ? row.stall : null;
    var priced = count > 0 ? cost(i, row.st.owned, count, over) : 0;
    if (!(count > 0) || !(priced >= 0) || priced > state.cash) return { ok: false, reason: 'cost', count: 0, cost: priced };
    state.cash -= priced;
    if (state.cash < 1e-6) state.cash = 0;
    row.st.owned += count;
    return { ok: true, count: count, cost: priced };
  }

  /* Payback is the price of the selected quantity divided by the income those stalls add.
     A tenth or a twenty-fifth can add more than one stall's rate, because the whole row doubles. */
  function paybackSeconds(state, i, count) {
    var row = slotOf(state, i);
    var stall = row.stall;
    var st = row.st;
    if (!stall || !st || !st.hired) return Infinity;
    var n = count > 0 ? Math.floor(count) : 1;
    var priced = cost(i, st.owned, n, onQuay(state) ? stall : null);
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
    var row = slotOf(state, i);
    var stall = row.stall;
    if (!stall) return '';
    var owned = row.st ? row.st.owned : 0;
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

  function awayRule() {
    return 'While away: earns ' + Math.round(OFFLINE_RATE * 100) + '%, up to ' + (OFFLINE_CAP / 3600) + 'h';
  }

  function secondsToNext(state) {
    var rate = income(state);
    if (!(rate > 0)) return Infinity;
    var best = Infinity;
    for (var i = 0; i < STALLS.length; i++) {
      if (!state.stalls[i].hired) continue;
      var one = cost(i, state.stalls[i].owned, 1);
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

  function quayGoal(state) {
    var lin = state.quay[1];
    var stall = QUAY[1];
    var left;
    if (!lin.hired) {
      if (lin.serves >= stall.serves) return 'Lin will tend the Chestnut Brazier whenever you ask.';
      left = stall.serves - lin.serves;
      if (lin.serves === 0) return 'Hold to fill a cone. ' + left + ' more cones, then Lin will tend the brazier.';
      return left + ' more ' + (left === 1 ? 'cone' : 'cones') + ' to do yourself. Then Lin will tend the brazier.';
    }
    if (!(lin.owned > 0)) return 'Buy the first Chestnut Brazier. Lin will tend it.';
    var at = nextMark(lin.owned);
    if (!at) return 'Lin\'s braziers are as warm as they get tonight.';
    var n = at - lin.owned;
    return (n === 1 ? 'One more chestnut brazier' : n + ' more chestnut braziers') + ' reaches ' + at + ', and that brazier doubles.';
  }

  function goal(state) {
    if (onQuay(state)) return quayGoal(state);
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

  function nextGoalLine(state, i) {
    var row = slotOf(state, i);
    var stall = row.stall;
    var owned = row.st ? row.st.owned : 0;
    var at = nextMark(owned);
    if (!stall) return '';
    if (!at) return 'Every doubling on this stall is lit.';
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
    if (onQuay(state)) return '';
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
    if (onQuay(state)) return '';
    var owned = state.stalls[STALLS.length - 1] ? state.stalls[STALLS.length - 1].owned : 0;
    if (!(owned > 0)) return '';
    if (owned > FINALE_AT) return 'Old Wen tells it again.';
    if (owned === FINALE_AT) return "Old Wen's last chapter is told.";
    return 'Chapter ' + owned + ' of ' + FINALE_AT + ': ' + chapterTitle(owned) + '.';
  }

  function finaleReached(state) {
    if (onQuay(state)) return false;
    return !!(state.stalls[STALLS.length - 1] && state.stalls[STALLS.length - 1].owned >= FINALE_AT);
  }

  function finaleCopy() {
    var ch = CHAPTERS[FINALE_AT - 1];
    return { title: ch.title, lead: ch.text, choice: 'Keep the lane open' };
  }

  function lookLine(state, i) {
    var row = slotOf(state, i);
    var owned = row.st ? row.st.owned : 0;
    var stall = row.stall;
    if (!stall || !row.st) return '';
    if (!row.st.hired) return '';
    if (owned <= 0) return stall.vendor + ' is here, waiting for the first one.';
    var look = stall.looks[lookIndex(owned)];
    return stallMult(owned) <= 1 ? look + '.' : look + '. It earns ' + timesWord(owned) + '.';
  }

  function gossipLine(state) {
    if (onQuay(state)) {
      if (state.quay[1].hired) return QUAY[1].gossip;
      if (state.quay[0].hired) return QUAY[0].gossip;
      return 'The quay was quiet.';
    }
    for (var i = STALLS.length - 1; i >= 0; i--) {
      if (state.stalls[i].hired) return spec(i).gossip;
    }
    return 'The lane was quiet.';
  }

  function awayCopy(summary, state) {
    var lead = 'You were gone ' + Arcade.fmtTime(summary.away) + '.';
    if (summary.capped) lead += ' The box only holds four hours, so ' + Arcade.fmtTime(summary.credited) + ' counted.';
    else lead += ' The stalls kept ' + Arcade.fmtTime(summary.credited) + ' of it.';
    lead += ' While away, stalls earn ' + Math.round(OFFLINE_RATE * 100) + '%.';
    var box = summary.gained === 1
      ? '1 coin is in the box.'
      : summary.gained > 0
        ? Arcade.fmt(summary.gained) + ' coins are in the box.'
        : 'The box is empty. Nothing was earning while you were gone.';
    var copy = {
      title: 'While you were away',
      lead: lead,
      box: box,
      payout: Arcade.fmt(summary.gained) + (summary.gained === 1 ? ' coin' : ' coins')
    };
    if (state) copy.next = closerLead(state);
    return copy;
  }

  var PERMITS = [
    { id: 'mei', name: "Mei's permit" },
    { id: 'bo', name: "Bo's cart" },
    { id: 'lane', name: 'The lane light' },
    { id: 'quay', name: 'The Quay permit' },
    { id: 'lin', name: "Lin's brazier" }
  ];

  function permitShown(state, id) {
    return id === 'lin' ? state.place === 'quay' : true;
  }

  function permitDone(state, id) {
    if (id === 'mei') return !!(state.stalls[0] && state.stalls[0].hired);
    if (id === 'bo') return !!(state.stalls[0] && state.stalls[0].owned >= 10);
    if (id === 'lane') return lowestOwned(state) >= 10;
    if (id === 'quay') return state.lifetime >= MOVE_AT;
    if (id === 'lin') return !!(state.quay && state.quay[1] && state.quay[1].hired);
    return false;
  }

  function permitList(state) {
    return PERMITS.filter(function (p) { return permitShown(state, p.id); }).map(function (p) {
      return { id: p.id, name: p.name, done: permitDone(state, p.id) };
    });
  }

  function nextPermit(state) {
    var list = permitList(state);
    if (state.place === 'quay') {
      var lin = null, i;
      for (i = 0; i < list.length; i++) if (list[i].id === 'lin') lin = list[i];
      if (lin && !lin.done) return lin;
    }
    for (var k = 0; k < list.length; k++) if (!list[k].done) return list[k];
    return null;
  }

  function permitProgress(state, id) {
    if (id === 'mei') return permitDone(state, 'mei') ? 1 : Math.min(1, (state.stalls[0].serves || 0) / 25);
    if (id === 'bo') return Math.min(1, (state.stalls[0].owned || 0) / 10);
    if (id === 'lane') return Math.min(1, lowestOwned(state) / 10);
    if (id === 'quay') return state.lifetime >= MOVE_AT ? 1 : Math.min(1, state.lifetime / MOVE_AT);
    if (id === 'lin') {
      if (!state.quay || !state.quay[1]) return 0;
      if (state.quay[1].hired) return 1;
      return Math.min(1, state.quay[1].serves / 25);
    }
    return 0;
  }

  function servesFor(id) {
    var i;
    for (i = 0; i < STALLS.length; i++) if (STALLS[i].id === id) return STALLS[i].serves;
    for (i = 0; i < QUAY.length; i++) if (QUAY[i].id === id) return QUAY[i].serves;
    return 25;
  }

  function progressFor(state, id) {
    var owned = 0, hired = false, serves = 0, i;
    for (i = 0; i < STALLS.length; i++) {
      if (STALLS[i].id !== id) continue;
      if (state.stalls[i].owned > owned) owned = state.stalls[i].owned;
      if (state.stalls[i].hired) hired = true;
      if (state.stalls[i].serves > serves) serves = state.stalls[i].serves;
    }
    if (state.quay) {
      for (i = 0; i < QUAY.length; i++) {
        if (QUAY[i].id !== id) continue;
        if (state.quay[i].owned > owned) owned = state.quay[i].owned;
        if (state.quay[i].hired) hired = true;
        if (state.quay[i].serves > serves) serves = state.quay[i].serves;
      }
    }
    return { owned: owned, hired: hired, serves: serves };
  }

  function stories(state) {
    var order = ['tea', 'dumpling', 'lantern', 'mooncake', 'incense', 'stories', 'chestnut'];
    var out = [];
    order.forEach(function (id) {
      (TALES[id] || []).forEach(function (tale) {
        var p = progressFor(state, id);
        var unlocked = tale.at === 'hired' ? p.hired : p.owned >= +tale.at;
        var fraction = tale.at === 'hired'
          ? (p.hired ? 1 : Math.min(1, p.serves / servesFor(id)))
          : Math.min(1, p.owned / +tale.at);
        out.push({ id: id, at: tale.at, title: tale.title, text: tale.text, unlocked: unlocked, fraction: fraction });
      });
    });
    return out;
  }

  function nextStory(state) {
    var best = null;
    stories(state).forEach(function (tale) {
      if (tale.unlocked) return;
      if (!best || tale.fraction > best.fraction) best = tale;
    });
    return best;
  }

  function closerLead(state) {
    var permit = nextPermit(state);
    var story = nextStory(state);
    if (!permit && !story) return 'The book is full.';
    var prem = permit ? 1 - permitProgress(state, permit.id) : 2;
    var srem = story ? 1 - story.fraction : 2;
    var useStory = srem < prem;
    var name = useStory ? story.title : permit.name;
    var rem = useStory ? srem : prem;
    if (rem <= 0.2) return 'You are close to ' + name + '.';
    return 'Next in the book: ' + name + '.';
  }

  function canMove(state) {
    return state.place !== 'quay' && state.lifetime >= MOVE_AT;
  }

  function move(state) {
    if (state.place === 'quay') return { ok: true, already: true };
    if (!(state.lifetime >= MOVE_AT)) return { ok: false, reason: 'early' };
    state.place = 'quay';
    state.cash = 0;
    state.quay = [
      { owned: 1, serves: 25, hired: true },
      { owned: 0, serves: 0, hired: false }
    ];
    return { ok: true };
  }

  function goalProgress(state) {
    if (onQuay(state)) {
      var lin = state.quay[1];
      if (!lin.hired) return { value: Math.min(lin.serves, 25), max: 25 };
      if (!(lin.owned > 0)) return { value: 0, max: 1 };
      var at = nextMark(lin.owned);
      if (!at) return { value: 1, max: 1 };
      return { value: lin.owned, max: at };
    }
    var i, stall, need, bonus, owned;
    for (i = 0; i < STALLS.length; i++) {
      if (!unlocked(state, i) || state.stalls[i].hired) continue;
      stall = spec(i);
      return { value: Math.min(state.stalls[i].serves, stall.serves), max: stall.serves };
    }
    for (i = 0; i < STALLS.length - 1; i++) {
      if (!state.stalls[i].hired) continue;
      need = unlockNeed(i + 1);
      owned = state.stalls[i].owned;
      if (owned >= need) continue;
      return { value: Math.min(owned, need), max: need };
    }
    bonus = nextBonus(state);
    if (bonus) {
      owned = state.stalls[bonus.i].owned;
      return { value: owned, max: bonus.at };
    }
    return { value: 1, max: 1 };
  }

  /* Same rule as the Best tag. Max and Next only count a buy the button can make.
     Buy 1 and Buy 10 score one step or ten even when the coins are short, and the
     tag stays off until that stall can actually be bought. */
  function bestIndex(state) {
    var best = -1, score = Infinity, i, n, sec, mode = state.bulk;
    var slots = activeSlots(state);
    for (i = 0; i < slots.length; i++) {
      if (!slots[i].hired || !unlocked(state, i)) continue;
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
      place: state.place === 'quay' ? 'quay' : 'lane',
      quay: state.place === 'quay' && state.quay ? state.quay.map(function (s) {
        return { owned: s.owned, serves: s.serves, hired: !!s.hired };
      }) : null,
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
    state.place = 'lane';
    state.quay = null;
    if (o.place === 'quay' && Array.isArray(o.quay) && o.quay.length === 2 && o.quay.every(function (s) {
      return s && isFinite(s.owned) && isFinite(s.serves) && s.owned >= 0 && s.serves >= 0;
    })) {
      state.place = 'quay';
      state.quay = o.quay.map(function (s) {
        return { owned: Math.floor(s.owned), serves: Math.floor(s.serves), hired: !!s.hired };
      });
    }
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
    MOVE_AT: MOVE_AT,
    QUAY: QUAY,
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
    fresh: fresh,
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
    goalProgress: goalProgress,
    lookLine: lookLine,
    gossipLine: gossipLine,
    awayCopy: awayCopy,
    setBulk: setBulk,
    valid: valid,
    serialize: serialize,
    restore: restore,
    createIdle: createIdle,
    onQuay: onQuay,
    activeSpecs: activeSpecs,
    activeSlots: activeSlots,
    permitList: permitList,
    nextPermit: nextPermit,
    stories: stories,
    nextStory: nextStory,
    closerLead: closerLead,
    canMove: canMove,
    move: move
  };
})();
