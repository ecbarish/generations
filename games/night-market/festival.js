/* Night Market festival (NM-ROGUELITE-2).
   Visitors, Old Wen's answer, vendor tales, twelve more signs, five bells, and the night-10 ending.
   A sign replaces a price or a rate the night already uses. It does not add a multiplier or a coin. */
(function () {
  'use strict';

  var VISITORS = [
    { id: 'auntie-luo', name: 'Auntie Luo', line: 'Auntie Luo counts the lanterns and says the lane is still short of a full string.' },
    { id: 'piper-shen', name: 'Piper Shen', line: 'Piper Shen came off the last ferry and asks which stall smells like cedar.' },
    { id: 'little-tao', name: 'Little Tao', line: 'Little Tao wants the tortoise to reach the top and will wait for Old Wen.' },
    { id: 'cook-yan', name: 'Cook Yan', line: 'Cook Yan brings a spare lid for the steamer and stays to hear one chapter.' }
  ];
  var WARDEN = { id: 'warden-hui', name: 'Warden Hui', line: 'Warden Hui keeps the gate bell and says the hill is still the lane\'s business.' };
  var BELLS = [
    { tier: 1, name: 'opening bell', line: 'The opening bell rings over the lane. It is the first of five bells.' },
    { tier: 2, name: 'lane bell', line: 'The lane bell rings between the stalls. It is the second of five bells.' },
    { tier: 3, name: 'gate bell', line: 'The gate bell rings. Warden Hui is at the mouth of the alley. It is the third of five bells.' },
    { tier: 4, name: 'hill bell', line: 'The hill bell rings above the mats. It is the fourth of five bells.' },
    { tier: 5, name: 'last bell', line: 'The last bell rings over the hill. It is the fifth of five bells.' }
  ];
  var ENDING = {
    title: 'The lantern on the hill',
    lead: 'The tortoise sets the lantern on the hill. The last bell fades over a quiet lane. Warden Hui stands at the gate and does not call anyone back. Old Wen looks at the listeners, at the stalls, and at the dark above the hill. The lanterns go out, one by one. Ten nights are told, and the story is whole.'
  };
  var CARDS = [
    { id: 'paper-wind', kind: 'omen', name: 'Paper wind', line: 'Paper wind. Lanterns earn 5.6 a second instead of 5. Tea stalls cost 6.6 instead of 6.', set: { lantern: { rate: 5.6 }, tea: { base: 6.6 } } },
    { id: 'full-steamer', kind: 'omen', name: 'Full steamer', line: 'Full steamer. Dumplings earn 1.02 a second instead of 0.9. Mooncakes cost 7,040 instead of 6,400.', set: { dumpling: { rate: 1.02 }, mooncake: { base: 7040 } } },
    { id: 'warm-alley', kind: 'omen', name: 'Warm alley', line: 'Warm alley. Incense earns 590 a second instead of 540. Lantern stands cost 770 instead of 700.', set: { incense: { rate: 590 }, lantern: { base: 770 } } },
    { id: 'second-tin', kind: 'omen', name: 'Second tin', line: 'Second tin. Mooncakes earn 44 a second instead of 40. Dumpling carts cost 88 instead of 80.', set: { mooncake: { rate: 44 }, dumpling: { base: 88 } } },
    { id: 'early-kettle', kind: 'omen', name: 'Early kettle', line: 'Early kettle. Tea earns 0.5 a second instead of 0.45. Incense trays cost 77,000 instead of 70,000.', set: { tea: { rate: 0.5 }, incense: { base: 77000 } } },
    { id: 'soft-mat', kind: 'omen', name: 'Soft mat', line: 'Soft mat. The Story Mat earns 2,420 a second instead of 2,200, and the first mat costs 2,420,000 instead of 2,200,000.', set: { stories: { rate: 2420, base: 2420000 } } },
    { id: 'spare-cups', kind: 'charm', name: "Mei's spare cups", line: "Mei's spare cups. Tea stalls cost 5 instead of 6.", set: { tea: { base: 5 } } },
    { id: 'first-fold', kind: 'charm', name: "Bo's first fold", line: "Bo's first fold. Dumplings earn 1 a second instead of 0.9.", set: { dumpling: { rate: 1 } } },
    { id: 'still-flame', kind: 'charm', name: "An's still flame", line: "An's still flame. Lanterns earn 5.5 a second instead of 5.", set: { lantern: { rate: 5.5 } } },
    { id: 'spare-tin', kind: 'charm', name: "Qiao's spare tin", line: "Qiao's spare tin. Mooncakes cost 5,760 instead of 6,400.", set: { mooncake: { base: 5760 } } },
    { id: 'cedar-stick', kind: 'charm', name: "Ren's cedar stick", line: "Ren's cedar stick. Incense earns 590 a second instead of 540.", set: { incense: { rate: 590 } } },
    { id: 'earlier-line', kind: 'charm', name: "Wen's earlier line", line: "Wen's earlier line. The Story Mat costs 1,980,000 instead of 2,200,000.", set: { stories: { base: 1980000 } } }
  ];

  var taleBook = {};
  var talesReady = false;

  function market() { return window.NightMarket || null; }
  function nightNum(state) {
    return state && state.night && state.night.n > 0 ? Math.floor(state.night.n) : 1;
  }
  function nightSeed(state) {
    return state && state.night && state.night.seed > 0 ? (state.night.seed >>> 0) : 1;
  }
  function emptyFest() {
    return { met: [], spoken: [], tales: [], bells: [], cards: [], warden: false, ending: false, declined: 0, cardNight: 0, cardId: '' };
  }
  function asIds(list) {
    if (!Array.isArray(list)) return [];
    var out = [], i;
    for (i = 0; i < list.length && out.length < 80; i++) {
      if (typeof list[i] === 'string' && list[i] && list[i].length < 80) out.push(list[i]);
    }
    return out;
  }
  function copyFest(raw) {
    var bells = [], spoken = [], i, row, n;
    if (!raw || typeof raw !== 'object') return emptyFest();
    if (Array.isArray(raw.bells)) {
      for (i = 0; i < raw.bells.length; i++) {
        n = Math.floor(raw.bells[i]);
        if (n >= 1 && n <= 5 && bells.indexOf(n) < 0) bells.push(n);
      }
    }
    if (Array.isArray(raw.spoken)) {
      for (i = 0; i < raw.spoken.length && spoken.length < 40; i++) {
        row = raw.spoken[i];
        if (!row || !(row.n > 0) || typeof row.id !== 'string') continue;
        spoken.push({ n: Math.floor(row.n), id: row.id });
      }
    }
    return {
      met: asIds(raw.met),
      spoken: spoken,
      tales: asIds(raw.tales),
      bells: bells,
      cards: asIds(raw.cards),
      warden: !!raw.warden,
      ending: !!raw.ending,
      declined: raw.declined > 0 ? Math.floor(raw.declined) : 0,
      cardNight: raw.cardNight > 0 ? Math.floor(raw.cardNight) : 0,
      cardId: typeof raw.cardId === 'string' ? raw.cardId : ''
    };
  }
  function occupied(fest) {
    return !!(fest && (fest.met.length || fest.spoken.length || fest.tales.length || fest.bells.length || fest.cards.length || fest.warden || fest.ending || fest.declined || fest.cardId));
  }
  function ensure(state) {
    if (!state.meta) state.meta = { nights: [], omens: [], charms: [], pool: 6, pairs: [] };
    if (!state.meta.festival) state.meta.festival = emptyFest();
    return state.meta.festival;
  }
  function remember(list, id) {
    if (id && list.indexOf(id) < 0) list.push(id);
  }
  function lcg(seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s;
    };
  }
  function drawIds(rows, count, seed) {
    var bag = [], i, rand = lcg(seed), out = [];
    for (i = 0; i < rows.length; i++) bag.push(rows[i].id);
    while (out.length < count && bag.length) out.push(bag.splice(rand() % bag.length, 1)[0]);
    return out;
  }
  function byId(table, id) {
    for (var i = 0; i < table.length; i++) if (table[i].id === id) return table[i];
    return null;
  }
  function tierOf(n) {
    if (n >= 9) return 5;
    if (n >= 7) return 4;
    if (n >= 5) return 3;
    if (n >= 3) return 2;
    return 1;
  }
  function tier(state) { return tierOf(nightNum(state)); }
  function bellByTier(n) { return BELLS[n - 1] || null; }
  function bellLine(n) {
    var bell = bellByTier(n);
    return bell ? bell.line : '';
  }
  function pendingBells(state) {
    var fest = ensure(state), top = tier(state), out = [], i;
    for (i = 1; i <= top; i++) if (fest.bells.indexOf(i) < 0) out.push(i);
    return out;
  }
  function hearBell(state, n) {
    var fest = ensure(state);
    n = Math.floor(n);
    if (n < 1 || n > tier(state) || !bellByTier(n)) return '';
    remember(fest.bells, n);
    return bellLine(n);
  }
  function visitorFor(state) {
    var index = (nightSeed(state) + nightNum(state) * 3) % VISITORS.length;
    return VISITORS[index];
  }
  function visitorById(id) {
    return byId(VISITORS, id);
  }
  function spokenId(fest, n) {
    var i, row;
    for (i = 0; i < fest.spoken.length; i++) {
      row = fest.spoken[i];
      if (row.n === n) return row.id;
    }
    return '';
  }
  function speak(state, id) {
    var visitor = visitorFor(state);
    var fest = ensure(state);
    var n = nightNum(state);
    if (!visitor || (id && id !== visitor.id)) return '';
    if (spokenId(fest, n) === visitor.id) return visitor.line;
    fest.spoken.push({ n: n, id: visitor.id });
    remember(fest.met, visitor.id);
    return visitor.line;
  }
  function wardenAvailable(state) { return tier(state) >= 3; }
  function speakWarden(state) {
    if (!wardenAvailable(state)) return '';
    var fest = ensure(state);
    fest.warden = true;
    remember(fest.met, WARDEN.id);
    return WARDEN.line;
  }
  function previousNight(state) {
    var nights = state.meta && state.meta.nights || [];
    var n = nightNum(state), i, best = null;
    for (i = 0; i < nights.length; i++) {
      if (nights[i] && nights[i].n < n && (!best || nights[i].n > best.n)) best = nights[i];
    }
    return best;
  }
  function wenLine(state) {
    var M = market();
    if (!M || !state || !state.night) return '';
    var parts = [], fest = ensure(state), n = nightNum(state);
    var omen = state.night.omen && M.omenById(state.night.omen);
    if (omen) parts.push(omen.name + ' is in the story tonight.');
    var charms = state.night.charms || [];
    if (charms.length) {
      var charm = M.charmById(charms[0]);
      if (charm) parts.push(charm.name + ' stays in the telling.');
    }
    var said = visitorById(spokenId(fest, n));
    if (said) parts.push(said.name + ' spoke on the lane, and Old Wen nods.');
    if (fest.warden) parts.push('Old Wen leaves a pause for Warden Hui.');
    if (fest.cardNight === n && fest.cardId) {
      var card = byId(CARDS, fest.cardId);
      if (card) parts.push('He names ' + card.name + ' before he goes on.');
    }
    var prev = previousNight(state);
    if (prev && prev.omen) {
      var old = M.omenById(prev.omen);
      if (old) parts.push('Last night it was ' + old.name + '.');
    }
    if (!parts.length) return 'Old Wen looks along the lane and waits.';
    return 'Old Wen is telling tonight. ' + parts.join(' ');
  }
  function stallRow(state, id) {
    var M = market();
    if (!M) return null;
    for (var i = 0; i < M.STALLS.length; i++) if (M.STALLS[i].id === id) return state.stalls[i];
    return null;
  }
  function reached(row, at) {
    if (!row) return false;
    if (at === 'hired') return !!row.hired;
    var n = parseInt(at, 10);
    return n > 0 && row.owned >= n;
  }
  function attachTales(doc) {
    taleBook = {};
    if (!doc || !doc.tales) return false;
    Object.keys(doc.tales).forEach(function (stall) {
      (doc.tales[stall] || []).forEach(function (row) {
        if (!row || row.at == null || typeof row.text !== 'string') return;
        var id = stall + ':' + row.at;
        taleBook[id] = { id: id, stall: stall, at: String(row.at), title: row.title || '', text: row.text };
      });
    });
    talesReady = true;
    return true;
  }
  function taleReady(state) {
    var out = [], id, tale;
    if (!state) return out;
    for (id in taleBook) {
      if (!Object.prototype.hasOwnProperty.call(taleBook, id)) continue;
      tale = taleBook[id];
      if (reached(stallRow(state, tale.stall), tale.at)) out.push({ id: tale.id, title: tale.title, stall: tale.stall });
    }
    return out;
  }
  function hearTale(state, id) {
    var tale = taleBook[id];
    if (!tale || !state || !reached(stallRow(state, tale.stall), tale.at)) return '';
    remember(ensure(state).tales, tale.id);
    return tale.text;
  }
  function cardById(id) { return byId(CARDS, id); }
  function cardTonight(fest, n) { return fest.cardNight === n && !!fest.cardId; }
  function cardOffer(state) {
    var fest = ensure(state), n = nightNum(state);
    if (fest.declined === n || cardTonight(fest, n)) return [];
    return drawIds(CARDS, 3, (nightSeed(state) + n * 17) >>> 0);
  }
  function takeCard(state, id) {
    var card = cardById(id);
    var fest = ensure(state);
    var n = nightNum(state);
    var stallId, patch, deal;
    if (!card || !state.night || fest.declined === n || cardTonight(fest, n)) return false;
    state.night.deals = state.night.deals || [];
    for (stallId in card.set) {
      if (!Object.prototype.hasOwnProperty.call(card.set, stallId)) continue;
      patch = card.set[stallId];
      deal = { id: 'fest:' + card.id + ':' + stallId, stall: stallId, rate: 0, base: 0 };
      if (patch.rate > 0) deal.rate = patch.rate;
      if (patch.base > 0) deal.base = patch.base;
      if (!(deal.rate > 0) && !(deal.base > 0)) continue;
      state.night.deals.push(deal);
    }
    fest.cardNight = n;
    fest.cardId = card.id;
    remember(fest.cards, card.id);
    return true;
  }
  function declineCards(state) {
    var fest = ensure(state), n = nightNum(state);
    if (fest.declined === n || cardTonight(fest, n)) return false;
    fest.declined = n;
    return true;
  }
  function showEnding(state) {
    var M = market();
    return !!(M && state && state.night && state.night.n === 10 && M.dawnDue(state));
  }
  function install() {
    var M = market();
    if (!M || M.dawnCopy && M.dawnCopy.__festival) return;
    var dawn = M.dawnCopy, ser = M.serialize, res = M.restore;
    function wrappedDawn(state) {
      var copy = dawn(state);
      if (showEnding(state)) {
        copy.title = ENDING.title;
        copy.lead = ENDING.lead;
        ensure(state).ending = true;
      }
      return copy;
    }
    wrappedDawn.__festival = true;
    M.dawnCopy = wrappedDawn;
    M.serialize = function (state, seen) {
      var out = ser(state, seen);
      var fest = state && state.meta && state.meta.festival;
      if (out && out.meta && occupied(fest)) out.meta.festival = copyFest(fest);
      return out;
    };
    M.restore = function (raw) {
      var fest = raw && raw.meta && raw.meta.festival;
      var state = res(raw);
      if (state && state.meta && fest && typeof fest === 'object') state.meta.festival = copyFest(fest);
      return state;
    };
  }

  function para(text) {
    var p = document.createElement('p');
    p.textContent = text;
    return p;
  }
  function button(label, act, id) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.dataset.act = act;
    if (id != null) b.dataset.id = String(id);
    return b;
  }
  function signature(state) {
    var fest = state && state.meta && state.meta.festival;
    var stalls = (state && state.stalls || []).map(function (row) { return (row.hired ? 1 : 0) + ':' + row.owned; }).join(',');
    return [nightNum(state), nightSeed(state), state && state.night && state.night.omen, ((state && state.night && state.night.charms) || []).join(','), stalls, talesReady ? 1 : 0, JSON.stringify(fest || null)].join('|');
  }
  function paint(state, onChange) {
    var root = document.getElementById('festival');
    if (!root || !state || !state.night) return;
    var sig = signature(state);
    if (root.dataset.sig === sig) return;
    root.dataset.sig = sig;
    root.replaceChildren();
    var n = nightNum(state);
    var fest = ensure(state);
    var top = tier(state);
    var heard = fest.bells.indexOf(top) >= 0;
    var bell = bellByTier(top);
    root.appendChild(para('Night ' + n + '. ' + (heard && bell ? bell.line : 'The ' + (bell ? bell.name : 'bell') + ' has not been heard.')));
    pendingBells(state).forEach(function (tierNo) {
      var row = bellByTier(tierNo);
      root.appendChild(button('Hear the ' + row.name, 'fest-bell', tierNo));
    });
    fest.bells.forEach(function (tierNo) {
      if (tierNo === top) return;
      root.appendChild(para(bellLine(tierNo)));
    });
    root.appendChild(para(wenLine(state)));
    var visitor = visitorFor(state);
    var said = spokenId(fest, n);
    if (said === visitor.id) root.appendChild(para(visitor.line));
    else {
      root.appendChild(para(visitor.name + ' is on the lane.'));
      root.appendChild(button('Speak with ' + visitor.name, 'fest-speak', visitor.id));
    }
    if (wardenAvailable(state)) {
      if (fest.warden) root.appendChild(para(WARDEN.line));
      else {
        root.appendChild(para('Warden Hui keeps the gate.'));
        root.appendChild(button('Speak with Warden Hui', 'fest-warden', WARDEN.id));
      }
    }
    if (cardTonight(fest, n)) {
      var taken = cardById(fest.cardId);
      if (taken) root.appendChild(para(taken.line));
    } else if (fest.declined === n) {
      root.appendChild(para('The other signs wait for another night.'));
    } else {
      root.appendChild(para('Three more signs for tonight. Take one, or leave them.'));
      cardOffer(state).forEach(function (id) {
        var card = cardById(id);
        if (card) root.appendChild(button(card.line, 'fest-card', card.id));
      });
      root.appendChild(button('Leave them', 'fest-leave', ''));
    }
    taleReady(state).forEach(function (tale) {
      if (fest.tales.indexOf(tale.id) >= 0) {
        root.appendChild(para(tale.title + '. ' + taleBook[tale.id].text));
      } else {
        root.appendChild(button('Hear ' + tale.title, 'fest-tale', tale.id));
      }
    });
    if (showEnding(state)) root.appendChild(para(ENDING.lead));
    root.onclick = function (event) {
      var hit = event.target && event.target.closest ? event.target.closest('button') : null;
      if (!hit || !root.contains(hit)) return;
      var act = hit.dataset.act, changed = false;
      if (act === 'fest-speak') changed = !!speak(state, hit.dataset.id);
      else if (act === 'fest-warden') changed = !!speakWarden(state);
      else if (act === 'fest-bell') changed = !!hearBell(state, +hit.dataset.id);
      else if (act === 'fest-card') changed = !!takeCard(state, hit.dataset.id);
      else if (act === 'fest-leave') changed = declineCards(state);
      else if (act === 'fest-tale') changed = !!hearTale(state, hit.dataset.id);
      if (changed && typeof onChange === 'function') onChange();
    };
  }

  install();

  var ready = Promise.resolve();
  if (typeof fetch === 'function' && document.currentScript && document.currentScript.src) {
    var talesUrl = new URL('vendor-tales.json', document.currentScript.src).href;
    ready = fetch(talesUrl).then(function (res) { return res.ok ? res.json() : null; }).then(function (doc) {
      if (doc) attachTales(doc);
      if (window.__nightMarket && window.__nightMarket.render) window.__nightMarket.render();
    }).catch(function () { return null; });
  }

  window.NightFestival = {
    ready: ready,
    tier: tier,
    bellLine: bellLine,
    pendingBells: pendingBells,
    hearBell: hearBell,
    visitorFor: visitorFor,
    speak: speak,
    wardenAvailable: wardenAvailable,
    speakWarden: speakWarden,
    wenLine: wenLine,
    attachTales: attachTales,
    taleReady: taleReady,
    hearTale: hearTale,
    cards: function () { return CARDS.slice(); },
    cardOffer: cardOffer,
    takeCard: takeCard,
    declineCards: declineCards,
    ending: ENDING,
    showEnding: showEnding,
    paint: paint
  };
})();
