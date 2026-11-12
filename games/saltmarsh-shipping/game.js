/* Saltmarsh Shipping Office. The window is the whole game.
   Idle runs the clock, the tab title and the save. Captains are paid from
   their own clocks, at most once for a stretch of time. */
(function () {
  'use strict';

  var M = window.Saltmarsh;
  var P = window.SaltmarshPhase;
  var KEY = M.SAVE_KEY;
  var VERSION = '0.3.0';
  var $ = function (sel) { return document.querySelector(sel); };
  var money = function (n) { return M.coins(n); };
  var view = { rowing: 0, ripple: null, choice: '', routes: false, goalTimer: 0, ledgerOn: false };
  var taps = [];
  var idle = null;
  var awayOn = false;

  Arcade.versions[KEY] = M.SAVE_VERSION;
  Arcade.validators[KEY] = M.valid;

  function previewName() {
    var search = '';
    try { search = window.location && window.location.search || ''; } catch (e) { search = ''; }
    var match = /(?:\?|&)state=(fleet|lamps|final)(?:&|$)/.exec(search);
    return match ? match[1] : '';
  }
  var preview = previewName();
  var raw = null;
  if (!preview) {
    try { raw = Arcade.load(KEY); } catch (e) { raw = null; }
  }
  var state = preview ? (M.preset(preview) || M.openSave(null)) : M.openSave(raw);

  function persist(obj) {
    if (preview) return false;
    if (Arcade.held[KEY]) return false;
    if (!obj) {
      state.seen = Date.now();
      obj = M.serialize(state, state.seen);
    }
    return Arcade.save(KEY, obj);
  }

  function bootIdle(seen) {
    if (idle) idle.stop();
    state._quiet = false;
    idle = M.createIdle(state, persist);
    var rawStop = idle.stop;
    idle.stop = function () {
      state._quiet = true;
      rawStop();
    };
    return idle.start(seen);
  }

  var audio = ArcadeSound.create({
    mode: function () { return state.sound || 0; },
    setMode: function (v) { state.sound = v; persist(); },
    button: function () { return $('#sound'); },
    musicKey: function () { return state.sound >= 2 ? 'harbour' : null; },
    tracks: {
      harbour: {
        bpm: 76,
        lead: 'triangle',
        mel: 'D4 . F4 . A4 . G4 . F4 . D4 . C4 . D4 .',
        bass: 'D3 . . A2 . . C3 . . D3 . .',
        drum: 'k . . h . .'
      }
    }
  });

  function boatQuote(i) {
    if (state.bulk !== 'max') return M.quote(state, i, state.bulk);
    var open = M.quote(state, i, 'max');
    var cap = M.goalCap(state, i);
    if (!(open.count > 0) || cap == null) return open;
    var room = cap - state.boats[i].owned;
    if (!(room > 0)) return open;
    var count = Math.min(open.count, room);
    var q = M.quote(state, i, count);
    q.toGoal = q.count === room;
    return q;
  }

  function hullTitle(i, count) {
    var name = M.BOATS[i].name;
    return count === 1 ? name : name + 's';
  }

  function buyLabel(i) {
    var q = boatQuote(i);
    if (state.bulk === 'max') {
      if (!(q.count > 0)) {
        var one = M.quote(state, i, 1);
        return 'Max · ' + money(one.cost) + ' · ' + M.needMore(state, one.cost);
      }
      if (q.toGoal) return 'Buy ' + q.count + ' ' + hullTitle(i, q.count).toLowerCase() + ' for the next step · ' + money(q.cost);
      return 'Buy up to ' + q.count + ' ' + hullTitle(i, q.count).toLowerCase() + ' · ' + money(q.cost);
    }
    var n = state.bulk === 10 ? 10 : 1;
    var label = hullTitle(i, n) + ' · ' + money(q.cost);
    if (!(q.count > 0)) label += ' · ' + M.needMore(state, q.cost);
    return label;
  }

  function visibleBoats() {
    var phase = P.read(state);
    if (!phase.boats) return [];
    /* All four hulls stay on the page once the shop is open, so a purchase
       cannot insert a new row and shove the buttons underneath. */
    return M.BOATS.slice();
  }

  function showLine(el, text) {
    if (!el) return;
    el.textContent = text || '';
    if (text) el.setAttribute('title', text);
    else el.removeAttribute('title');
  }

  function fillBoat(li, i) {
    var boat = M.BOATS[i];
    var open = M.unlocked(state, i);
    var owned = state.boats[i].owned;
    var marked = li.classList.contains('goal-target');
    li.className = 'boat' + (open ? '' : ' closed');
    if (marked) li.classList.add('goal-target');
    li.querySelector('h2').textContent = boat.name + (owned > 0 ? ' · ' + owned : '');
    showLine(li.querySelector('.habit'), open ? M.lookLine(state, i) : boat.next);
    var facts = li.querySelector('.facts');
    var wait = li.querySelector('.wait');
    var buy = li.querySelector('[data-act="buy"]');
    if (!open) {
      facts.textContent = '';
      showLine(wait, i === 0 ? 'Row three cargoes first.' : '');
      buy.hidden = true;
      return;
    }
    var rate = M.production(state, i);
    showLine(facts, owned > 0 ? M.rateWords(rate) + ' from these.' : 'None tied up yet.');
    showLine(wait, M.paybackLine(state, i));
    buy.hidden = false;
    var priced = boatQuote(i);
    var boatGoal = P.nextAct(state);
    if (boatGoal && boatGoal.kind === 'boat' && boatGoal.tier === i) {
      priced = { count: boatGoal.count, cost: boatGoal.cost };
      buy.textContent = hullTitle(i, boatGoal.count) + ' · ' + money(boatGoal.cost) + (state.cash >= boatGoal.cost ? '' : ' · ' + M.needMore(state, boatGoal.cost));
    } else buy.textContent = buyLabel(i);
    buy.disabled = !(priced.count > 0) || (boatGoal && boatGoal.kind === 'boat' && boatGoal.tier === i && !(state.cash >= boatGoal.cost));
    buy.dataset.count = String(priced.count || 0);
    buy.dataset.chunk = boatGoal && boatGoal.kind === 'boat' && boatGoal.tier === i ? '1' : '';
  }

  function fillSheds() {
    var box = $('#sheds');
    var phase = P.read(state);
    box.hidden = !(phase.boats || phase.sheds);
    if (box.hidden) return;
    var price = M.warehousePrice(state);
    var sheds = state.warehouses;
    var body = sheds + (sheds === 1 ? ' shed' : ' sheds') + ' on the sand. Each one keeps two hours when the game is closed, up to four sheds. A closed game pays half. A page left open keeps the full rate.';
    var copy = box.querySelector('p');
    if (!copy) {
      box.replaceChildren();
      var h = document.createElement('h2');
      h.textContent = 'The sheds';
      copy = document.createElement('p');
      var actions = document.createElement('div');
      actions.className = 'actions';
      var button = document.createElement('button');
      button.type = 'button';
      button.dataset.act = 'shed';
      actions.appendChild(button);
      box.appendChild(h);
      box.appendChild(copy);
      box.appendChild(actions);
    }
    copy.textContent = body;
    var hold = box.querySelector('.shed-hold');
    if (!hold) {
      hold = document.createElement('p');
      hold.className = 'shed-hold';
      box.insertBefore(hold, box.querySelector('.actions'));
    }
    hold.replaceChildren();
    var note = M.shedNote(state).replace(/^\s+/, '');
    var mark = note.indexOf('The next shed is ');
    if (mark >= 0) {
      hold.appendChild(document.createTextNode(note.slice(0, mark + 'The next shed is '.length)));
      var priceEl = document.createElement('span');
      priceEl.className = 'shed-price';
      var rest = note.slice(mark + 'The next shed is '.length);
      var coinsAt = rest.indexOf(' coins.');
      priceEl.textContent = coinsAt >= 0 ? rest.slice(0, coinsAt) : rest;
      hold.appendChild(priceEl);
      hold.appendChild(document.createTextNode(coinsAt >= 0 ? rest.slice(coinsAt) : ''));
    } else hold.textContent = note;
    var shedBtn = box.querySelector('[data-act="shed"]');
    shedBtn.hidden = false;
    if (price == null) {
      shedBtn.disabled = true;
      shedBtn.textContent = 'The yard is full';
    } else if (M.openFork(state)) {
      shedBtn.disabled = true;
      shedBtn.textContent = 'Shed · ' + money(price);
    } else {
      shedBtn.disabled = !(state.cash >= price);
      shedBtn.textContent = 'Shed · ' + money(price) + (state.cash >= price ? '' : ' · ' + M.needMore(state, price));
    }
  }

  function fillLog() {
    var phase = P.read(state);
    var box = $('#log');
    box.hidden = !phase.log;
    if (box.hidden) return;
    var list = $('#log-lines');
    var lines = state.log && state.log.length ? state.log : [{ text: 'The log is open. Nothing has come in yet.' }];
    var sig = lines.map(function (line) { return line.text; }).join('\n');
    if (list.dataset.sig === sig) return;
    list.dataset.sig = sig;
    list.replaceChildren();
    lines.forEach(function (line) {
      var li = document.createElement('li');
      li.textContent = line.text;
      list.appendChild(li);
    });
  }

  function fillCaptains() {
    var list = $('#captains');
    var shown = [];
    /* Every captain keeps a place once the fleet is open, so hiring one
       does not push the routes and the lights down. */
    M.CAPTAINS.forEach(function (cap, i) { shown.push(i); });
    var sig = shown.join(',') + ':' + state.captains.map(function (c) { return c.hired ? 1 : 0; }).join('');
    if (list.dataset.sig !== sig) {
      list.dataset.sig = sig;
      list.replaceChildren();
      shown.forEach(function (i) {
        var cap = M.CAPTAINS[i];
        var li = document.createElement('li');
        li.className = 'captain';
        li.dataset.captain = String(i);
        var title = document.createElement('h3');
        title.textContent = cap.name;
        var habit = document.createElement('p');
        habit.className = 'habit';
        habit.textContent = cap.habit;
        var status = document.createElement('p');
        status.className = 'wait';
        li.appendChild(title);
        li.appendChild(habit);
        li.appendChild(status);
        list.appendChild(li);
      });
    }
    Array.prototype.forEach.call(list.children, function (li) {
      var i = +li.dataset.captain;
      var status = li.querySelector('.wait');
      var each = M.haulCoins(M.CAPTAINS[i], 1, 1);
      var eachText = money(each);
      var title = li.querySelector('h3');
      if (title) title.textContent = M.CAPTAINS[i].name + ' · ' + eachText + ' coins';
      if (!state.captains[i].hired) showLine(status, eachText + '/haul, once they take a boat.');
      else {
        var next = M.nextIn(state, i, Date.now());
        var brought = state.captains[i].brought || 0;
        var back = next === Infinity ? 'needs a shed' : (next > 0 ? 'back ' + next + 's' : 'back now');
        var perk = i === 0 ? M.wrenPerkLine(state) : i === 1 ? M.bramblePerkLine(state) : '';
        showLine(status, eachText + '/haul · ' + back + (perk ? ' · ' + perk : '') + ' · ' + money(brought) + ' so far');
      }
    });
  }

  function fillChart() {
    var phase = P.read(state);
    var chart = $('#chart');
    var note = chart.querySelector('p') || chart.appendChild(document.createElement('p'));
    if (!phase.routesReady) note.textContent = 'The fleet is on the chart. Ten schooners will mark the trade routes, and the next tide is when they sail.';
    else if (!phase.routesOpen) note.textContent = 'The routes are marked along the coast. They sail on the next tide, with the lights after them.';
    else note.textContent = 'The routes are open.';
    var ticks = chart.querySelector('.mark-row');
    if (!ticks) {
      ticks = document.createElement('div');
      ticks.className = 'mark-row';
      ticks.setAttribute('aria-hidden', 'true');
      chart.appendChild(ticks);
    }
    var count = Math.min(12, state.marks || 0);
    if (ticks.childElementCount !== count) {
      ticks.replaceChildren();
      for (var m = 0; m < count; m++) ticks.appendChild(document.createElement('i'));
    }
    var markNote = chart.querySelector('.marks');
    if (!markNote) {
      markNote = document.createElement('p');
      markNote.className = 'marks';
      chart.appendChild(markNote);
    }
    markNote.hidden = !(count > 0);
    markNote.textContent = count === 1 ? 'Hollis has marked the chart once.' : 'Hollis has marked the chart ' + count + ' times.';
  }

  function cardButton(which, title, line) {
    var wrap = document.createElement('div');
    wrap.className = 'choice-card';
    var h = document.createElement('h3');
    h.textContent = title;
    var p = document.createElement('p');
    p.className = 'habit';
    p.textContent = line;
    var actions = document.createElement('div');
    actions.className = 'actions';
    var button = document.createElement('button');
    button.type = 'button';
    button.dataset.which = which;
    actions.appendChild(button);
    wrap.appendChild(h);
    wrap.appendChild(p);
    wrap.appendChild(actions);
    return wrap;
  }

  function choiceTrigger(offer) {
    if (!offer) return null;
    if (offer.id === 'sloop') return document.querySelector('#boats [data-i="1"] [data-act="buy"]');
    if (offer.id === 'schooner') return document.querySelector('#boats [data-i="2"] [data-act="buy"]');
    if (offer.id === 'quay') return document.querySelector('#light-cards [data-light="quay"] button');
    if (offer.id === 'pilot') return document.querySelector('#routes');
    return null;
  }

  function placeChoice(box, offer) {
    var trigger = choiceTrigger(offer);
    var bar = document.querySelector('.goalbar');
    var barH = bar ? Math.ceil(bar.getBoundingClientRect().height) : 74;
    var viewH = window.innerHeight || 800;
    var cardMid = viewH * 0.45;
    if (trigger) {
      var card = trigger.getBoundingClientRect();
      if (card.height > 0 && card.width > 0) cardMid = card.top + card.height / 2;
    }
    function pinBelow() {
      box.style.top = 'auto';
      box.style.bottom = (barH + 8) + 'px';
      var cardBottom = trigger ? trigger.getBoundingClientRect().bottom : 0;
      var room = viewH - (cardBottom > 0 ? cardBottom : 0) - barH - 16;
      box.style.maxHeight = cardBottom > 8 && room > 140 ? Math.floor(room) + 'px' : '';
    }
    function pinAbove() {
      box.style.bottom = 'auto';
      box.style.top = '4.2rem';
      var cardTop = trigger ? trigger.getBoundingClientRect().top : viewH;
      var room = cardTop - 72 - 12;
      box.style.maxHeight = cardTop < viewH && room > 140 ? Math.floor(room) + 'px' : '';
    }
    function overlapsCard() {
      if (!trigger) return false;
      var sheet = box.getBoundingClientRect();
      var card = trigger.getBoundingClientRect();
      if (!(sheet.height > 0) || !(card.height > 0)) return false;
      return sheet.top < card.bottom - 1 && sheet.bottom > card.top + 1 && sheet.left < card.right && sheet.right > card.left;
    }
    if (cardMid < viewH * 0.5) pinBelow();
    else pinAbove();
    if (overlapsCard()) {
      if (box.style.top === 'auto') pinAbove();
      else pinBelow();
    }
  }

  function fillChoice() {
    var box = $('#choice');
    if (!box) return;
    var back = $('#choice-back');
    var offer = M.deskChoice(state);
    if (!offer) {
      box.hidden = true;
      if (back) back.hidden = true;
      box.style.top = '';
      box.style.bottom = '';
      box.style.maxHeight = '';
      return;
    }
    placeChoice(box, offer);
    box.hidden = false;
    if (back) back.hidden = false;
    placeChoice(box, offer);
    /* A short phone keeps the sheet to the office cap, above the goal bar. */
    var narrowSheet = window.matchMedia('(max-width: 899px)').matches;
    var shortSheet = window.matchMedia('(max-height: 430px)').matches;
    if (view.choiceFor !== offer.id) {
      view.choiceFor = offer.id;
      view.choiceShut = true;
    }
    if (!narrowSheet) view.choiceShut = false;
    var fold = $('#choice-fold');
    var title = $('#choice-title');
    if (title) title.textContent = offer.goal || 'A choice on the desk';
    if (narrowSheet) {
      if (!fold) {
        fold = document.createElement('button');
        fold.type = 'button';
        fold.id = 'choice-fold';
        fold.dataset.act = 'choice-fold';
        var bar = box.querySelector('.choice-bar') || box;
        bar.appendChild(fold);
      }
      fold.textContent = view.choiceShut ? 'Open the choice' : 'Hide the choice';
    } else if (fold) {
      fold.remove();
    }
    var shut = !!(narrowSheet && view.choiceShut);
    box.classList.toggle('is-shut', shut);
    if (shut) {
      box.style.top = 'auto';
      box.style.bottom = '4.6rem';
      box.style.maxHeight = '';
    } else if (narrowSheet || shortSheet) {
      var sheetCap = Math.floor(window.innerHeight * 0.46);
      var sheetNow = parseFloat(box.style.maxHeight);
      if (!sheetNow || sheetNow > sheetCap) box.style.maxHeight = Math.max(140, sheetCap) + 'px';
    }
    var host = $('#choice-cards');
    var sig = offer.id + ':' + offer.cards.map(function (card) { return card.which; }).join(',');
    if (host.dataset.sig !== sig) {
      host.dataset.sig = sig;
      host.replaceChildren();
      offer.cards.forEach(function (card) {
        var wrap = cardButton(card.which, card.name, card.line);
        wrap.querySelector('button').dataset.act = 'fork';
        host.appendChild(wrap);
      });
    }
    offer.cards.forEach(function (card) {
      var button = host.querySelector('[data-which="' + card.which + '"]');
      if (!button) return;
      button.disabled = !card.affordable;
      button.replaceChildren();
      var main = document.createElement('span');
      main.className = 'take-main';
      main.textContent = 'Take · ' + money(card.cost);
      button.appendChild(main);
      if (!card.affordable && card.cost > 0) {
        var sub = document.createElement('span');
        sub.className = 'take-need';
        sub.textContent = M.needMore(state, card.cost);
        button.appendChild(sub);
      }
    });
  }

  function settledSentence(row) {
    if (row.id === 'sloop' && row.lockedName === 'Another shed') return 'You took the lighter sloop hulls. The extra shed was not built.';
    if (row.id === 'sloop') return 'You built the shed. The lighter sloop hulls were not taken.';
    if (row.id === 'schooner' && row.lockedName === 'Another shed') return 'You took the deeper schooner holds. The extra shed was not built.';
    if (row.id === 'schooner') return 'You built the shed. The deeper schooner holds were not taken.';
    if (row.id === 'quay' && row.takenName === 'A lamp on the quay') return 'You took the quay lamp. The deeper holds were not built.';
    if (row.id === 'quay') return 'You took the deeper holds. The quay lamp was not built.';
    if (row.id === 'pilot' && row.takenName === 'A bell on the pier') return 'You took the pier bell. The coal for the night runs was not taken.';
    return 'You took the coal for the night runs. The pier bell was not taken.';
  }

  /* One visible line, the same height as the line left after the choice. */
  function pendingLine(row) {
    if (row.id === 'sloop') return 'Not yet: sloop hulls or a shed.';
    if (row.id === 'schooner') return 'Not yet: schooner holds or shed.';
    if (row.id === 'quay') return 'Not yet: quay lamp or holds.';
    if (row.id === 'pilot') return 'Not yet: pier bell or coal.';
    return settledSentence(row);
  }

  /* The line the open choice will leave behind. It stays in the list, unseen,
     so taking the choice does not push the button that opened it. */
  function pendingSettled(offer) {
    if (!offer) return null;
    if (offer.id === 'quay') return { id: 'quay', takenName: 'A lamp on the quay', lockedName: 'Deeper bark holds' };
    if (offer.id === 'pilot') return { id: 'pilot', takenName: 'A bell on the pier', lockedName: 'Coal for the night runs' };
    return null;
  }

  function fillSettled() {
    var box = $('#settled');
    if (!box) return;
    var rows = M.settledForks(state).slice();
    var known = {};
    rows.forEach(function (row) { known[row.id] = true; });
    var phase = P.read(state);
    if (phase.boats || rows.length) {
      [
        { id: 'sloop', takenName: 'Lighter sloop hulls', lockedName: 'Another shed' },
        { id: 'schooner', takenName: 'Deeper schooner holds', lockedName: 'Another shed' },
        { id: 'quay', takenName: 'A lamp on the quay', lockedName: 'Deeper bark holds' },
        { id: 'pilot', takenName: 'A bell on the pier', lockedName: 'Coal for the night runs' }
      ].forEach(function (row) { if (!known[row.id]) rows.push(row); });
    }
    var pendingId = {};
    rows.forEach(function (row) { if (!known[row.id]) pendingId[row.id] = true; });
    box.hidden = !rows.length;
    if (box.hidden) return;
    var list = $('#settled-list');
    var sig = rows.map(function (row) { return row.id + row.takenName + (pendingId[row.id] ? '?' : ''); }).join('|');
    if (list.dataset.sig === sig) return;
    list.dataset.sig = sig;
    list.replaceChildren();
    rows.forEach(function (row) {
      var li = document.createElement('li');
      li.textContent = pendingId[row.id] ? pendingLine(row) : settledSentence(row);
      list.appendChild(li);
    });
  }

  function fillRoutes() {
    var box = $('#routes');
    if (!box) return;
    var phase = P.read(state);
    box.hidden = !phase.routesOpen || state.ended;
    if (box.hidden) return;
    var offers = M.routeOffers(state, true);
    var note = $('#routes-note');
    var done = M.routesComplete(state);
    note.textContent = done
      ? 'Every route on the chart has been signed.'
      : offers.length
        ? 'A price stays while that card is on the desk. Signing one does not raise the others.'
        : 'The next contract is not on the desk yet.';
    var host = $('#route-cards');
    if (done && M.finaleOffer && M.finaleOffer(state)) {
      if (host.dataset.sig !== 'folded') {
        host.dataset.sig = 'folded';
        host.replaceChildren();
      }
      var gearFold = $('#route-gear');
      if (gearFold) gearFold.hidden = true;
      return;
    }
    var offerById = {};
    offers.forEach(function (offer) { offerById[offer.id] = offer; });
    var rows = [];
    /* Only the contracts on the desk. A signed route stays in its card,
       so a new name is not inserted above a button the player can already see. */
    var waitingLine = [];
    (M.shownRoutes ? M.shownRoutes(state) : M.ROUTES).forEach(function (spec) {
      var offer = offerById[spec.id] || null;
      var signed = (state.routes && state.routes[spec.id]) || 0;
      if (offer) rows.push({ spec: spec, offer: offer, signed: signed, waiting: false, queued: false });
      else if (signed > 0 && signed < spec.depths) {
        var peek = M.peekRoute(state, spec);
        if (peek) waitingLine.push(spec.name + ' ' + money(peek.cost) + ' after the current one');
        rows.push({ spec: spec, offer: null, signed: signed, waiting: false, queued: true });
      }
    });
    /* On a phone the same price is already on the card, so the note stays one sentence. */
    if (waitingLine.length && window.innerWidth >= 900) note.textContent = note.textContent + ' ' + waitingLine.join('. ') + '.';
    var sig = rows.map(function (row) {
      var cost = row.offer ? Math.round(row.offer.cost) : 0;
      return row.spec.id + ':' + row.signed + ':' + cost + ':' + (row.offer ? 1 : 0);
    }).join('|');
    if (host.dataset.sig !== sig) {
      host.dataset.sig = sig;
      host.replaceChildren();
      rows.forEach(function (row) {
        var spec = row.spec;
        var offer = row.offer;
        var wrap = document.createElement('div');
        wrap.className = 'route-card' + (row.queued ? ' is-wait' : '');
        wrap.dataset.route = spec.id;
        var h = document.createElement('h3');
        var contract = M.routeContract(state, spec.id);
        h.textContent = row.waiting
          ? spec.name
          : row.signed >= spec.depths
            ? spec.name + ' · ' + contract.signed + ' signed'
            : spec.name + ' · contract ' + contract.next + ' of ' + contract.depths;
        var p = document.createElement('p');
        p.className = 'habit';
        var risk = spec.risk > 0 ? ' About ' + Math.round(spec.risk * 100) + '% can be lost.' : ' Nothing is risked.';
        p.textContent = row.waiting
          ? 'Not on the desk yet.'
          : spec.line + ' It is ' + spec.time + '.' + risk + (spec.perk ? ' ' + spec.perk : '');
        var gain = document.createElement('p');
        gain.className = 'facts';
        var peek = !offer && row.signed > 0 && row.signed < spec.depths ? M.peekRoute(state, spec) : null;
        if (row.waiting) gain.textContent = 'It waits its turn.';
        else if (offer) gain.textContent = 'Adds about ' + M.rateWords(offer.gain) + '.';
        else if (peek) gain.textContent = 'Next: ' + money(peek.cost) + ', after the current one.';
        else gain.textContent = 'Signed.';
        wrap.appendChild(h);
        wrap.appendChild(p);
        wrap.appendChild(gain);
        var actions = document.createElement('div');
        actions.className = 'actions';
        var button = document.createElement('button');
        button.type = 'button';
        button.dataset.route = spec.id;
        if (offer) button.dataset.act = 'route';
        else {
          button.disabled = true;
          button.textContent = row.waiting ? 'Not yet' : (peek ? (money(peek.cost) + ' · after the current one') : 'Signed');
        }
        actions.appendChild(button);
        wrap.appendChild(actions);
        host.appendChild(wrap);
      });
    }
    Array.prototype.forEach.call(host.querySelectorAll('[data-act="route"]'), function (button) {
      var id = button.dataset.route;
      var offer = offerById[id] || null;
      if (!offer) return;
      var heading = button.parentNode && button.parentNode.parentNode ? button.parentNode.parentNode.querySelector('h3') : null;
      if (heading) {
        var contractNow = M.routeContract(state, id);
        heading.textContent = contractNow.signed >= contractNow.depths
          ? offer.name + ' · ' + contractNow.signed + ' signed'
          : offer.name + ' · contract ' + contractNow.next + ' of ' + contractNow.depths;
      }
      button.disabled = !offer.affordable;
      var label = 'Sign · ' + money(offer.cost);
      button.textContent = offer.affordable ? label : label + ' · ' + M.needMore(state, offer.cost);
    });
    Array.prototype.forEach.call(host.querySelectorAll('button[disabled][data-route]'), function (button) {
      var spec = null;
      (M.shownRoutes ? M.shownRoutes(state) : M.ROUTES).forEach(function (row) { if (row.id === button.dataset.route) spec = row; });
      if (!spec) return;
      var signedNow = (state.routes && state.routes[spec.id]) || 0;
      if (signedNow <= 0) return;
      var peek = M.peekRoute(state, spec);
      var card = button.parentNode && button.parentNode.parentNode;
      var facts = card ? card.querySelector('.facts') : null;
      if (!peek) return;
      var contractNow = M.routeContract(state, spec.id);
      button.textContent = money(peek.cost) + ' · after the current one';
      if (facts) facts.textContent = 'Next: ' + money(peek.cost) + ', after the current one.';
    });
    var gear = M.gearOffer(state);
    var gearHost = $('#route-gear');
    if (!gearHost) {
      gearHost = document.createElement('div');
      gearHost.id = 'route-gear';
      gearHost.className = 'route-card';
      box.appendChild(gearHost);
    }
    /* Sail stays above the route cards, so a new Sign row cannot push it down. */
    if (host && gearHost.compareDocumentPosition(host) & Node.DOCUMENT_POSITION_PRECEDING) box.insertBefore(gearHost, host);
    if (!gear) {
      if (gearHost.dataset.hold === '1' && gearHost.dataset.holdSig === sig) gearHost.hidden = false;
      else if (gearHost.dataset.id && gearHost.hidden === false && gearHost.offsetHeight > 0) {
        var held = gearHost.offsetHeight;
        gearHost.dataset.hold = '1';
        gearHost.dataset.holdSig = sig;
        gearHost.style.minHeight = held + 'px';
        gearHost.replaceChildren();
        var heldNote = document.createElement('p');
        heldNote.className = 'habit';
        heldNote.textContent = 'The spare sail is fitted.';
        var heldActions = document.createElement('div');
        heldActions.className = 'actions';
        var heldBtn = document.createElement('button');
        heldBtn.type = 'button';
        heldBtn.disabled = true;
        heldBtn.textContent = 'Fitted';
        heldActions.appendChild(heldBtn);
        gearHost.appendChild(heldNote);
        gearHost.appendChild(heldActions);
        gearHost.hidden = false;
      } else {
        gearHost.hidden = false;
        gearHost.dataset.hold = '';
        if (gearHost.dataset.reserved !== '1') {
          gearHost.dataset.reserved = '1';
          gearHost.replaceChildren();
          var waitH = document.createElement('h3');
          waitH.textContent = 'Spare sail';
          var waitP = document.createElement('p');
          waitP.className = 'habit';
          waitP.textContent = 'A spare sail waits for the first route you sign.';
          var waitA = document.createElement('div');
          waitA.className = 'actions';
          var waitB = document.createElement('button');
          waitB.type = 'button';
          waitB.disabled = true;
          waitB.textContent = 'Not yet';
          waitA.appendChild(waitB);
          gearHost.appendChild(waitH);
          gearHost.appendChild(waitP);
          gearHost.appendChild(waitA);
        }
      }
    } else {
      if (gearHost.dataset.hold === '1' && gearHost.dataset.holdSig !== sig) {
        gearHost.dataset.hold = '';
        gearHost.style.minHeight = '';
        gearHost.dataset.id = '';
      }
      gearHost.hidden = false;
      if (gearHost.dataset.id !== gear.id) {
        gearHost.dataset.id = gear.id;
        gearHost.dataset.hold = '';
        gearHost.style.minHeight = '';
        gearHost.replaceChildren();
        var gh = document.createElement('h3');
        gh.textContent = 'Spare sail · ' + gear.name.replace(/^A spare sail for /, '');
        var gp = document.createElement('p');
        gp.className = 'habit';
        gp.textContent = gear.line;
        var ga = document.createElement('div');
        ga.className = 'actions';
        var gb = document.createElement('button');
        gb.type = 'button';
        gb.dataset.act = 'gear';
        gb.dataset.route = gear.id;
        ga.appendChild(gb);
        gearHost.appendChild(gh);
        gearHost.appendChild(gp);
        gearHost.appendChild(ga);
      }
      var gearBtn = gearHost.querySelector('button');
      if (gearBtn) {
        gearBtn.disabled = !gear.affordable;
        var gearLabel = 'Sail · ' + money(gear.cost);
        gearBtn.textContent = gear.affordable ? gearLabel : gearLabel + ' · ' + M.needMore(state, gear.cost);
      }
    }
  }

  function fillLights() {
    var box = $('#lights');
    if (!box) return;
    var phase = P.read(state);
    box.hidden = !phase.lighthousesOpen || state.ended;
    if (box.hidden) return;
    var offers = M.lightOffers(state, true);
    var burning = M.lightsLit(state);
    var lightNote = burning >= 4
      ? '4 lit. Every lighthouse on the coast is burning.'
      : burning + ' lit. Four lighthouses. Each one changes the routes.';
    if (M.yearOf && M.yearOf(state) === 2) {
      lightNote += M.glassBurning(state)
        ? ' The Glass Lighthouse is burning, and the winter storm has lifted.'
        : ' The Glass Lighthouse is still dark, so the winter storm takes a cut from every route.';
    }
    $('#lights-note').textContent = lightNote;
    var host = $('#light-cards');
    if (M.allLightsLit(state) && M.finaleOffer && M.finaleOffer(state)) {
      if (host.dataset.sig !== 'folded') {
        host.dataset.sig = 'folded';
        host.replaceChildren();
      }
      return;
    }
    var sig = offers.map(function (offer) { return offer.id + ':' + offer.stage + ':' + Math.round(offer.cost); }).join('|') + ':b' + ((state.boats[3] && state.boats[3].owned) || 0) + ':r' + M.routesSailing(state) + (offers.length ? '' : ':done');
    if (host.dataset.sig !== sig) {
      host.dataset.sig = sig;
      host.replaceChildren();
      (M.shownLights ? M.shownLights(state) : M.LIGHTS).forEach(function (spec) {
        var stage = state.lights[spec.id] || 0;
        var offer = null;
        for (var i = 0; i < offers.length; i++) if (offers[i].id === spec.id) offer = offers[i];
        var wrap = document.createElement('div');
        wrap.className = 'light-card';
        wrap.dataset.light = spec.id;
        wrap.dataset.stage = String(stage);
        var h = document.createElement('h3');
        h.textContent = spec.name + (stage >= 2 ? ' · burning' : stage === 1 ? ' · tower up' : ' · dark');
        var p = document.createElement('p');
        p.className = 'habit';
        var lineAt = stage >= 2 ? spec.lines.length - 1 : stage;
        p.textContent = spec.lines[lineAt] || spec.lines[0];
        wrap.appendChild(h);
        wrap.appendChild(p);
        var actions = document.createElement('div');
        actions.className = 'actions';
        var button = document.createElement('button');
        button.type = 'button';
        button.dataset.light = spec.id;
        if (offer) button.dataset.act = 'light';
        else {
          button.disabled = true;
          button.textContent = M.lightClosed ? M.lightClosed(state, spec) : (stage >= 2 ? 'Burning' : 'Not yet');
        }
        actions.appendChild(button);
        wrap.appendChild(actions);
        host.appendChild(wrap);
      });
    }
    Array.prototype.forEach.call(host.querySelectorAll('button'), function (button) {
      var spec = null;
      var lightList = M.shownLights ? M.shownLights(state) : M.LIGHTS;
      for (var s = 0; s < lightList.length; s++) if (lightList[s].id === button.dataset.light) spec = lightList[s];
      var offer = null;
      for (var i = 0; i < offers.length; i++) if (offers[i].id === button.dataset.light) offer = offers[i];
      if (spec && spec.id === 'quay' && (state.lights.quay || 0) < 2) {
        var habit = button.closest('.light-card') && button.closest('.light-card').querySelector('.habit');
        var needs = M.lightClosed(state, spec);
        var story = spec.lines[(state.lights.quay || 0)] || spec.lines[0];
        if (habit) habit.textContent = needs && needs !== 'Not yet' && needs !== 'Burning' ? needs : story;
      }
      if (!offer || offer.blocked) {
        button.disabled = true;
        var closed = (offer && offer.blocked) || (M.lightClosed ? M.lightClosed(state, spec) : 'Not yet');
        var stop = closed.indexOf('. ');
        button.textContent = stop > 0 ? closed.slice(0, stop + 1) : closed;
        return;
      }
      button.dataset.act = 'light';
      var verb = offer.stage === 0 ? 'Raise' : offer.stage === 1 ? 'Light' : 'Keep';
      button.disabled = !offer.affordable;
      var label = verb + ' · ' + money(offer.cost);
      button.textContent = offer.affordable ? label : label + ' · ' + M.needMore(state, offer.cost);
    });
  }

  function fillWork() {
    var box = $('#harbour-work');
    if (!box) return;
    var offer = M.finaleOffer && M.finaleOffer(state) ? null : (M.workOffer ? M.workOffer(state) : null);
    box.hidden = !offer;
    if (box.hidden) return;
    $('#work-note').textContent = offer.name + '. ' + offer.line;
    var button = $('#work-go');
    button.disabled = !(state.cash >= offer.cost);
    var label = offer.name + ' · ' + money(offer.cost);
    button.textContent = state.cash >= offer.cost ? label : label + ' · ' + M.needMore(state, offer.cost);
  }

  function fillErrand() {
    var box = $('#errand');
    if (!box) return;
    var offer = M.finaleOffer && M.finaleOffer(state) ? null : (M.errandOffer ? M.errandOffer(state) : null);
    box.hidden = !offer;
    if (box.hidden) return;
    $('#errand-note').textContent = offer.name + '. ' + offer.line;
    var button = $('#errand-go');
    button.disabled = !(state.cash >= offer.cost);
    var label = offer.name + ' · ' + money(offer.cost);
    button.textContent = state.cash >= offer.cost ? label : label + ' · ' + M.needMore(state, offer.cost);
  }

  function fillProvision() {
    var box = $('#provision');
    if (!box) return;
    var open = M.voyageOpen && M.voyageOpen(state);
    var offers = open && M.preparationOffers ? M.preparationOffers(state) : [];
    box.hidden = !open;
    if (box.hidden) return;
    var title = $('#provision-title');
    var done = M.PREPARATIONS.length - offers.length;
    if (title) title.textContent = 'For the last voyage: ' + done + ' / ' + M.PREPARATIONS.length;
    $('#provision-note').textContent = offers.length
      ? 'These prices don\'t go up as your fleet grows.'
      : 'All ' + M.PREPARATIONS.length + ' are packed.';
    var host = $('#provision-cards');
    var actions = $('#provision-actions');
    var doneMap = state.prepDone || {};
    var sig = M.PREPARATIONS.map(function (item) { return item.id + (doneMap[item.id] ? ':' + doneMap[item.id] : ':0'); }).join('|');
    if (host.dataset.sig !== sig) {
      host.dataset.sig = sig;
      host.replaceChildren();
      if (!offers.length) {
        host.style.minHeight = '';
        host.dataset.heldHeight = '';
        var packed = document.createElement('p');
        packed.className = 'habit';
        packed.textContent = 'All ' + M.PREPARATIONS.length + ' are packed.';
        host.appendChild(packed);
      } else {
        var item = null;
        M.PREPARATIONS.forEach(function (row) { if (row.id === offers[0].id) item = row; });
        var card = document.createElement('div');
        card.className = 'route-card';
        var h = document.createElement('h3');
        h.textContent = item ? item.name : offers[0].name;
        var p = document.createElement('p');
        p.className = 'habit';
        if (item && item.choice) p.textContent = item.choice[0].line.replace(/\.$/, '') + ', or ' + item.choice[1].line.charAt(0).toLowerCase() + item.choice[1].line.slice(1);
        else p.textContent = (item && item.line) || offers[0].line || '';
        card.appendChild(h);
        card.appendChild(p);
        host.appendChild(card);
      }
    }
    if (offers.length) {
      var held = parseFloat(host.dataset.heldHeight || '0');
      var nowH = host.offsetHeight;
      if (nowH > held) {
        host.dataset.heldHeight = String(nowH);
        host.style.minHeight = nowH + 'px';
      }
    }
    var current = offers[0];
    var button = $('#provision-go');
    var alt = $('#provision-alt');
    if (!current) {
      button.hidden = true;
      if (actions) {
        actions.hidden = true;
        actions.style.minHeight = '';
        actions.dataset.heldHeight = '';
      }
      if (alt) alt.hidden = true;
      return;
    }
    button.hidden = false;
    if (actions) actions.hidden = false;
    button.dataset.prep = current.id;
    button.dataset.which = current.choice ? current.choice[0].id : '';
    function packLabel(node, opt) {
      node.replaceChildren();
      var main = document.createElement('span');
      main.className = 'take-main';
      main.textContent = opt.name;
      var price = document.createElement('span');
      price.className = 'take-need';
      price.textContent = money(opt.cost) + (opt.effect ? ' · ' + opt.effect : '');
      node.appendChild(main);
      node.appendChild(price);
      node.disabled = !(state.cash >= opt.cost);
      node.dataset.cost = String(opt.cost);
      if (state.cash >= opt.cost) node.removeAttribute('title');
      else node.setAttribute('title', opt.name + ' · ' + money(opt.cost) + (opt.effect ? ' · ' + opt.effect : ''));
    }
    packLabel(button, current.choice ? current.choice[0] : { name: current.name, cost: current.cost, effect: current.effect || '' });
    if (current.choice) {
      if (!alt) {
        alt = document.createElement('button');
        alt.type = 'button';
        alt.id = 'provision-alt';
        alt.dataset.act = 'prep';
        button.parentNode.appendChild(alt);
      }
      alt.hidden = false;
      alt.dataset.prep = current.id;
      alt.dataset.which = current.choice[1].id;
      packLabel(alt, current.choice[1]);
    } else if (alt) alt.hidden = true;
    if (actions) {
      actions.style.minHeight = '';
      actions.dataset.heldHeight = '';
    }
  }

  function fillFinale() {
    var box = $('#finale');
    if (!box) return;
    var offer = M.finaleOffer(state);
    box.hidden = !offer;
    if (box.hidden) return;
    $('#finale-note').textContent = offer.line;
    var button = $('#finale-go');
    button.disabled = false;
    button.textContent = 'Set sail';
  }

  function fillEnding() {
    var box = $('#ending');
    if (!box) return;
    box.hidden = !state.ended || view.ledgerOn;
    if (box.hidden) return;
    var stats = state.ending || M.statsOf(state, Date.now());
    var voyageHow = '';
    if (state.prepDone && state.prepDone.pilot === 'pilot') voyageHow = ' A pilot brought the risky cargo back in.';
    if (state.prepDone && state.prepDone.pilot === 'chart') voyageHow = ' The bought chart stayed in the cabin, and the boats earned a little more.';
    var yearLead = state.year === 2
      ? 'The winter year is home. Frost Lane and the Glass Lighthouse stay on the chart.'
      : 'The last voyage is home. The lighthouses stay lit along the Saltmarsh coast.';
    $('#ending-lead').textContent = yearLead + voyageHow;
    var list = $('#ending-stats');
    var watch = stats.elapsed > 0 ? Arcade.fmtTime(Math.round(stats.elapsed)) : 'a short watch';
    var lines = [
      'Time at the office: ' + watch + '. This is the whole watch, across every visit, not only the page open now.',
      'Coins earned: ' + money(stats.lifetime),
      'Boats tied up: ' + stats.boats,
      'Routes signed: ' + stats.voyages,
      'Captain hauls: ' + (stats.hauls > 0 ? stats.hauls : 'none yet'),
      'Lighthouses burning: ' + stats.lights + ' of four'
    ];
    if (stats.charts > 0) lines.push('You carry ' + stats.charts + (stats.charts === 1 ? ' chart' : ' charts') + ' into the next year.');
    if (list.dataset.sig !== lines.join('|')) {
      list.dataset.sig = lines.join('|');
      list.replaceChildren();
      lines.forEach(function (text) {
        var li = document.createElement('li');
        li.textContent = text;
        list.appendChild(li);
      });
    }
    var credits = $('#credits');
    if (!credits.childElementCount) {
      [
        'The Saltmarsh Shipping Office',
        'Capt. Wren, who counted every coin',
        'Capt. Bramble, who waited for the kettle',
        'Capt. Hollis, who marked the chart',
        'Capt. Pell, who named the boat',
        'The gull, who took one',
        'You, who rowed the first cargo'
      ].forEach(function (text) {
        var li = document.createElement('li');
        li.textContent = text;
        credits.appendChild(li);
      });
    }
    var again = $('#new-harbour');
    var harbourSig = (state.year === 2 ? '2' : '1') + ':' + (view.yearCaptain || 0) + ':' + ((state.ledger && state.ledger.length) || 0);
    if (again.dataset.sig !== harbourSig) {
      again.dataset.sig = harbourSig;
      again.replaceChildren();
      var picked = view.yearCaptain >= 0 && view.yearCaptain < M.CAPTAINS.length ? view.yearCaptain : 0;
      var lead = document.createElement('p');
      lead.textContent = state.year === 2
        ? 'This year is in the season ledger.'
        : 'The next year keeps the harbour\'s regard. Choose who comes with you, then begin.';
      again.appendChild(lead);
      var actions = document.createElement('div');
      actions.className = 'actions year-actions';
      if (state.year !== 2) {
        var names = document.createElement('div');
        names.className = 'year-names';
        M.CAPTAINS.forEach(function (cap, i) {
          var name = document.createElement('button');
          name.type = 'button';
          name.dataset.act = 'year-cap';
          name.dataset.captain = String(i);
          name.setAttribute('aria-pressed', i === picked ? 'true' : 'false');
          name.textContent = cap.name;
          names.appendChild(name);
        });
        actions.appendChild(names);
        var yearBtn = document.createElement('button');
        yearBtn.type = 'button';
        yearBtn.className = 'year-primary';
        yearBtn.dataset.act = 'year';
        yearBtn.dataset.captain = String(picked);
        yearBtn.textContent = 'Begin year 2 with ' + M.CAPTAINS[picked].name;
        actions.appendChild(yearBtn);
      }
      var bookBtn = document.createElement('button');
      bookBtn.type = 'button';
      bookBtn.dataset.act = 'ledger';
      bookBtn.textContent = 'Read the season ledger';
      actions.appendChild(bookBtn);
      again.appendChild(actions);
    }
  }

  function fillLedger() {
    var box = $('#ledger');
    if (!box) return;
    var viewBook = M.ledgerView ? M.ledgerView(state) : { rows: [], best: null, year: 1, reputation: 0, storm: false };
    box.hidden = !(viewBook.rows.length || viewBook.year === 2);
    if (box.hidden) return;
    var note = $('#ledger-note');
    var best = viewBook.best > 0 ? Arcade.fmtTime(Math.round(viewBook.best)) : 'not yet';
    var regard = viewBook.reputation > 0
      ? 'Harbour regard is ' + viewBook.reputation + '. It keeps Frost Lane on the chart in a new year, and it does not fill the chest.'
      : 'Harbour regard has not been written yet.';
    var storm = viewBook.storm ? ' The winter storm is still on the routes.' : '';
    note.textContent = 'Best watch: ' + best + '. ' + regard + storm;
    var list = $('#ledger-rows');
    var sig = viewBook.rows.map(function (row) {
      return row.year + ':' + row.elapsed + ':' + (row.lights || []).join(',');
    }).join('|');
    if (list.dataset.sig === sig) return;
    list.dataset.sig = sig;
    list.replaceChildren();
    if (!viewBook.rows.length) {
      var empty = document.createElement('li');
      empty.textContent = 'No year has been closed yet.';
      list.appendChild(empty);
      return;
    }
    viewBook.rows.forEach(function (row) {
      var li = document.createElement('li');
      var watch = row.elapsed > 0 ? Arcade.fmtTime(Math.round(row.elapsed)) : 'a short watch';
      var lights = row.lights && row.lights.length ? row.lights.join(', ') : 'no light burning';
      li.textContent = row.title + '. ' + watch + '. Lights lit: ' + lights + '.';
      list.appendChild(li);
    });
  }

  function scrollTo(el) {
    if (!el || !el.scrollIntoView) return;
    var motion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var reduced = motion || (window.Settings && Settings.reduced());
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  function render(fromClock) {
    var pin = document.querySelector('#boats [data-i="0"] [data-act="buy"]');
    var pinTop = pin ? pin.getBoundingClientRect().top : null;
    var sec = Math.floor(Date.now() / 1000);
    view.allowPrices = !fromClock || view.priceSec !== sec;
    if (view.allowPrices) view.priceSec = sec;
    var phase = P.read(state);
    $('#office').dataset.phase = P.name(state);
    $('#coins').textContent = money(state.cash);
    showLine($('#away-rule'), M.awayRule(state));
    var boatsRate = M.income(state);
    var captainsRate = M.captainRate(state);
    var routeRate = M.routeIncome(state);
    var rateLine = $('#rate');
    var totalRate = boatsRate + captainsRate + routeRate;
    if (!(totalRate > 0)) showLine(rateLine, 'Nothing is earning yet.');
    else if (captainsRate > 0) showLine(rateLine, M.rateWords(totalRate) + '. Captains add ' + money(captainsRate) + '.');
    else showLine(rateLine, M.rateWords(totalRate));
    if (M.yearOf && M.yearOf(state) === 2 && M.glassBurning && !M.glassBurning(state) && !state.ended) {
      rateLine.textContent = rateLine.textContent + ' A winter storm is on the water until the Glass Lighthouse is burning.';
    }
    var goalEl = $('#goal');
    var focusStep = P.bestStep ? P.bestStep(state) : null;
    goalEl.textContent = P.goal(state);
    if (focusStep && goalEl.textContent === focusStep.sentence) {
      goalEl.dataset.step = focusStep.kind + ':' + (focusStep.id || '');
      goalEl.dataset.wait = String(focusStep.wait || 0);
      goalEl.dataset.payback = String(Math.round(focusStep.payback || 0));
    } else {
      goalEl.dataset.step = '';
      goalEl.dataset.wait = '';
    }
    var aim = $('#aim');
    if (aim) {
      var aimText = P.aim(state);
      aim.hidden = !aimText || !!state.ended;
      aim.textContent = aimText;
    }
    var scene = document.querySelector('.scene');
    if (scene) {
      if (state.ended) scene.textContent = 'Night on the Saltmarsh coast. The lighthouses are burning.';
      else if (state.trips < M.HAND_TRIPS) scene.textContent = 'Row this cargo. Three trips, and a second boat can tie up.';
      else scene.textContent = 'The Saltmarsh coast, from the office window.';
    }
    var rowing = view.rowing > 0 && performance.now() - view.rowing < 650;
    var row = $('#row');
    row.disabled = rowing;
    if (rowing) row.textContent = 'Rowing…';
    else if (state.trips < M.HAND_TRIPS) row.textContent = 'Row this cargo · ' + money(M.handPay(state)) + ' coins';
    else row.textContent = 'Row the skiff · ' + money(M.handPay(state)) + ' coins';
    var ask = $('#ask');
    var crew = $('#crew');
    var askIndex = -1;
    for (var c = 0; c < M.CAPTAINS.length; c++) if (M.canHire(state, c)) { askIndex = c; break; }
    var deskOpen = !!M.deskChoice(state);
    ask.hidden = askIndex < 0 || deskOpen;
    var pellBanner = $('#pell-banner');
    if (pellBanner) pellBanner.hidden = askIndex !== 3 || view.pellClosed || deskOpen;
    if (askIndex >= 0 && !deskOpen) {
      ask.dataset.captain = String(askIndex);
      ask.textContent = M.askLine(askIndex);
      if (crew) crew.hidden = true;
    } else if (crew) {
      var hired = -1;
      for (var h = 0; h < M.CAPTAINS.length; h++) if (state.captains[h].hired) hired = h;
      if (hired >= 0) {
        var onPier = M.CAPTAINS[hired];
        crew.hidden = !phase.boats;
        crew.textContent = onPier.name + ' · ' + money(M.haulCoins(onPier, 1, 1)) + ' coins every ' + onPier.every + 's';
      } else if (phase.boats) {
        crew.hidden = false;
        crew.textContent = 'The pier stays clear for Capt. Wren.';
      } else crew.hidden = true;
    }
    $('#bulk').hidden = !phase.boats || state.ended;
    $('#row').hidden = !!state.ended;
    document.querySelectorAll('[data-bulk]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(state.bulk) === b.dataset.bulk ? 'true' : 'false');
    });
    var boats = visibleBoats();
    var list = $('#boats');
    if (list.children.length !== boats.length) {
      list.replaceChildren();
      boats.forEach(function (boat, n) {
        var i = M.BOATS.indexOf(boat);
        var li = document.createElement('li');
        li.dataset.i = String(i);
        li.innerHTML = '<h2></h2><p class="habit"></p><p class="facts"></p><p class="wait"></p><div class="actions"><button type="button" data-act="buy"></button></div>';
        list.appendChild(li);
      });
    }
    Array.prototype.forEach.call(list.children, function (li) {
      fillBoat(li, +li.dataset.i);
      li.classList.toggle('is-now', !!(focusStep && focusStep.kind === 'boat' && String(focusStep.tier) === li.dataset.i));
    });
    fillChoice();
    fillSettled();
    fillRoutes();
    fillLights();
    var nextLight = null;
    Array.prototype.forEach.call(document.querySelectorAll('#light-cards .light-card'), function (card) {
      var burning = card.querySelector('h3') && /burning/.test(card.querySelector('h3').textContent);
      if (!burning && !nextLight) nextLight = card;
      if (focusStep && focusStep.kind === 'light' && focusStep.id === card.dataset.light) nextLight = card;
    });
    Array.prototype.forEach.call(document.querySelectorAll('#light-cards .light-card'), function (card) {
      card.classList.toggle('is-now', card === nextLight);
    });
    fillWork();
    fillErrand();
    fillProvision();
    fillFinale();
    fillEnding();
    fillLedger();
    fillSheds();
    fillLog();
    if (state.ended && !view.endingOn) {
      view.endingOn = true;
      var endingBox = $('#ending');
      if (endingBox) {
        endingBox.tabIndex = -1;
        scrollTo(endingBox);
        if (endingBox.focus) endingBox.focus();
      }
    }
    var fleet = $('#fleet');
    var openedFleet = fleet.hidden && phase.fleet;
    fleet.hidden = !phase.fleet;
    if (!fleet.hidden) {
      fillChart();
      fillCaptains();
      if (M.noteFleet(state)) {
        openedFleet = true;
        fleet.classList.add('reveal');
        persist();
      }
    }
    var desk = M.deskChoice(state);
    view.choice = desk ? desk.id : '';
    var routes = $('#routes');
    if (routes && !routes.hidden) view.routes = true;
    if (openedFleet) fleet.classList.add('reveal');
    Array.prototype.forEach.call(document.querySelectorAll('.actions button'), function (el) {
      if (!el.textContent) return;
      if (el.getAttribute('title') && el.getAttribute('title').indexOf('Need ') >= 0) return;
      el.setAttribute('title', el.textContent);
    });
    if (audio && audio.render) audio.render();
    var pinned = document.querySelector('#boats [data-i="0"] [data-act="buy"]');
    if (pinned && pinTop != null) {
      var shift = pinned.getBoundingClientRect().top - pinTop;
      if (shift > 2) window.scrollBy(0, shift);
    }
  }

  function showAway(summary, detail) {
    var copy = M.awayCopy(state, summary, detail);
    var box = $('#away');
    box.hidden = false;
    awayOn = true;
    box.replaceChildren();
    var h = document.createElement('h2');
    h.textContent = copy.title;
    var lead = document.createElement('p');
    lead.textContent = copy.lead;
    box.appendChild(h);
    box.appendChild(lead);
    (copy.lines || []).forEach(function (text) {
      var p = document.createElement('p');
      p.textContent = text;
      box.appendChild(p);
    });
    (M.returnOffers ? M.returnOffers(state) : []).forEach(function (step) {
      var act = document.createElement('button');
      act.type = 'button';
      act.textContent = step.label;
      act.dataset.act = step.kind;
      if (step.kind === 'light') act.dataset.light = step.id;
      if (step.kind === 'prep') act.dataset.prep = step.id;
      if (step.which) act.dataset.which = step.which;
      box.appendChild(act);
    });
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.act = 'away';
    btn.textContent = 'Close the log';
    box.appendChild(btn);
  }

  function cheer(button, text) {
    var el = $('#cheer');
    if (!el || !button || !button.getBoundingClientRect) return;
    var rect = button.getBoundingClientRect();
    el.hidden = false;
    el.textContent = text;
    el.style.left = (rect.left + rect.width / 2) + 'px';
    el.style.top = rect.top + 'px';
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    button.classList.add('answered');
    setTimeout(function () { button.classList.remove('answered'); }, 450);
  }

  function pop(x, y, text) {
    var wrap = $('.harbour-wrap');
    var rect = wrap.getBoundingClientRect();
    var el = $('#float');
    el.hidden = false;
    el.textContent = text;
    el.style.left = Math.max(8, x - rect.left) + 'px';
    el.style.top = Math.max(8, y - rect.top) + 'px';
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  }

  function rowAt(x, y, source) {
    taps.push({ x: x, y: y, source: source });
    if (view.rowing > 0 && performance.now() - view.rowing < 650) return;
    var sold = M.handSell(state, 0);
    if (!sold.ok) return;
    view.rowing = performance.now();
    view.ripple = { x: x, y: y, at: view.rowing };
    pop(x, y, '+' + sold.pay);
    if (state.sound) audio.sfx('blip');
    persist();
    render();
  }

  /* A tap's place comes from the touch itself. The click that follows is ignored. */
  function bindTap(el, fn) {
    var arm = null;
    el.addEventListener('touchstart', function (e) {
      if (el.disabled || !e.touches || e.touches.length !== 1) return;
      var t = e.touches[0];
      arm = { x: t.clientX, y: t.clientY, id: t.identifier };
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (el.disabled) return;
      var t = null;
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (!arm || e.changedTouches[i].identifier === arm.id) { t = e.changedTouches[i]; break; }
      }
      var start = arm;
      arm = null;
      if (!t) return;
      if (start && (t.clientX - start.x) * (t.clientX - start.x) + (t.clientY - start.y) * (t.clientY - start.y) > 24 * 24) return;
      el.dataset.swallow = '1';
      setTimeout(function () { if (el.dataset.swallow === '1') el.dataset.swallow = ''; }, 700);
      e.preventDefault();
      fn(t.clientX, t.clientY, 'touch');
    }, { passive: false });
    el.addEventListener('click', function (e) {
      if (el.dataset.swallow === '1') {
        el.dataset.swallow = '';
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (el.disabled) return;
      fn(e.clientX, e.clientY, 'mouse');
    });
  }

  function actNow() {
    return typeof window.__saltmarshTime === 'number' ? window.__saltmarshTime : Date.now();
  }

  function hireAt(index) {
    if (!M.hire(state, index, actNow()).ok) return;
    if (state.sound) audio.sfx('level');
    persist();
    render();
  }

  bindTap($('#row'), rowAt);
  bindTap($('#harbour'), function (x, y, source) { rowAt(x, y, source); });
  bindTap($('#ask'), function () {
    var index = +$('#ask').dataset.captain;
    if ($('#ask').hidden || !isFinite(index)) return;
    hireAt(index);
  });

  var armed = null;
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest('button');
    if (!b) { armed = null; return; }
    var li = b.closest('[data-i]');
    armed = {
      t: performance.now(),
      el: b,
      act: b.dataset.act || '',
      route: b.dataset.route || '',
      light: b.dataset.light || '',
      count: b.dataset.count || '',
      chunk: b.dataset.chunk || '',
      which: b.dataset.which || '',
      prep: b.dataset.prep || '',
      bulk: b.dataset.bulk || '',
      id: b.id || '',
      tier: li ? li.dataset.i : '',
      x: e.clientX,
      y: e.clientY
    };
    view.lastY = e.clientY;
  }, true);
  function stillSame(el, a) {
    if (!el) return false;
    return (el.dataset.act || '') === a.act && (el.dataset.prep || '') === a.prep && (el.dataset.which || '') === a.which && (el.dataset.route || '') === a.route && (el.dataset.light || '') === a.light;
  }
  function findLive(a) {
    if (!a) return null;
    if (a.el && a.el.isConnected && stillSame(a.el, a)) return a.el;
    if (a.prep) {
      var q = '#provision [data-prep="' + a.prep + '"]';
      if (a.which) q += '[data-which="' + a.which + '"]';
      var same = document.querySelector(q);
      if (same) return same;
    }
    if (a.act === 'route' && a.route) return document.querySelector('[data-act="route"][data-route="' + a.route + '"]');
    if (a.act === 'light' && a.light) return document.querySelector('[data-act="light"][data-light="' + a.light + '"]');
    if (a.act === 'buy' && a.tier !== '') return document.querySelector('#boats [data-i="' + a.tier + '"] [data-act="buy"]');
    if (a.id) {
      var byId = document.getElementById(a.id);
      if (stillSame(byId, a)) return byId;
    }
    return null;
  }
  function buttonKey(b) {
    return [b.id || '', b.dataset.act || '', b.dataset.which || '', b.dataset.prep || '', b.dataset.route || '', b.dataset.light || ''].join('|');
  }
  /* The next fork or errand must not inherit the tap that opened it. */
  function armGuard(e, b) {
    var seen = new Map();
    document.querySelectorAll('button').forEach(function (btn) { seen.set(btn, buttonKey(btn)); });
    view.guard = { until: performance.now() + 450, x: e.clientX, y: e.clientY, seen: seen, key: buttonKey(b) };
  }
  /* A render between press and release moves the button. The press still counts
     when the finger has not travelled, even if the click lands on empty page. */
  document.addEventListener('pointerup', function (e) {
    if (!armed) return;
    if (performance.now() - armed.t > 700) return;
    var dx = e.clientX - armed.x;
    var dy = e.clientY - armed.y;
    if (dx * dx + dy * dy > 24 * 24) return;
    var live = findLive(armed);
    if (!live || live.disabled) return;
    if (view.guard && performance.now() < view.guard.until) {
      var pdx = e.clientX - view.guard.x;
      var pdy = e.clientY - view.guard.y;
      var knownLive = view.guard.seen.get(live);
      if (pdx * pdx + pdy * pdy < 72 * 72 && !(knownLive != null && knownLive === buttonKey(live))) return;
    }
    var hit = document.elementFromPoint(e.clientX, e.clientY);
    var hitBtn = hit && hit.closest ? hit.closest('button') : null;
    if (hitBtn === live) return;
    live.click();
  }, true);
  function remembered(b) {
    if (!armed || !b) return null;
    if (performance.now() - armed.t > 400) return null;
    if (armed.el === b) return armed;
    /* A render between press and click replaces the node. The same control
       still counts: same action, same boat, route or light. */
    var li = b.closest('[data-i]');
    var tier = li ? li.dataset.i : '';
    if ((b.dataset.act || '') === armed.act && tier === armed.tier && (b.dataset.route || '') === armed.route && (b.dataset.light || '') === armed.light && (b.dataset.bulk || '') === armed.bulk && (b.dataset.prep || '') === armed.prep && (b.dataset.which || '') === armed.which && (b.id || '') === armed.id) return armed;
    return null;
  }
  function keepPlace(work) {
    var x = window.scrollX;
    var y = window.scrollY;
    work();
    if (window.scrollX !== x || Math.abs(window.scrollY - y) > 1) window.scrollTo(x, y);
  }

  document.addEventListener('click', function (e) {
    view.freshPrices = true;
    var b = e.target.closest('button');
    if (b && view.guard && performance.now() < view.guard.until && (e.clientX || e.clientY)) {
      var gdx = e.clientX - view.guard.x;
      var gdy = e.clientY - view.guard.y;
      var known = view.guard.seen.get(b);
      if (gdx * gdx + gdy * gdy < 72 * 72 && !(known != null && known === buttonKey(b))) return;
    }
    var held = remembered(b);
    if (!b || (b.disabled && !held)) return;
    if (held) {
      b.dataset.act = held.act;
      if (held.route) b.dataset.route = held.route;
      if (held.light) b.dataset.light = held.light;
      if (held.count) b.dataset.count = held.count;
      if (held.chunk) b.dataset.chunk = held.chunk;
      if (held.which) b.dataset.which = held.which;
      if (held.prep) b.dataset.prep = held.prep;
      if (held.bulk) b.dataset.bulk = held.bulk;
    }
    if (b.id === 'row' || b.id === 'sound' || b.id === 'ask' || b.classList.contains('arc-set-btn')) return;
    if (b.id === 'pell-close') {
      view.pellClosed = true;
      render();
      return;
    }
    if (b.dataset.bulk) {
      keepPlace(function () {
        M.setBulk(state, b.dataset.bulk);
        persist();
        render();
      });
      return;
    }
    if (b.dataset.act === 'away') {
      $('#away').hidden = true;
      awayOn = false;
      $('#away').replaceChildren();
      render();
      return;
    }
    if (b.dataset.act === 'fork') {
      var offer = M.deskChoice(state);
      var trigger = choiceTrigger(offer);
      if (offer && M.chooseDesk(state, offer.id, b.dataset.which).ok) {
        if (b.dataset.which === 'shed') bootIdle(null);
        if (state.sound) audio.sfx('quest');
        armGuard(e, b);
        keepPlace(function () {
          persist();
          render();
        });
        if (trigger && trigger.isConnected && trigger.focus) trigger.focus({ preventScroll: true });
      }
      return;
    }
    if (b.dataset.act === 'gear') {
      if (M.buyGear(state, b.dataset.route).ok) {
        cheer(b, 'Sail up');
        if (state.sound) audio.sfx('coin');
        keepPlace(function () { persist(); render(); });
      }
      return;
    }
    if (b.dataset.act === 'route') {
      if (M.signRoute(state, b.dataset.route).ok) {
        cheer(b, 'Signed');
        if (state.sound) audio.sfx('coin');
        keepPlace(function () { persist(); render(); });
      }
      return;
    }
    if (b.dataset.act === 'light') {
      var raised = (state.lights[b.dataset.light] || 0) === 0;
      if (M.buildLight(state, b.dataset.light).ok) {
        cheer(b, raised ? 'Raised' : 'Lit');
        if (state.sound) audio.sfx(raised ? 'quest' : 'level');
        keepPlace(function () { persist(); render(); });
      }
      return;
    }
    if (b.dataset.act === 'prep' || b.id === 'provision-go') {
      if (M.buyPreparation(state, b.dataset.prep, b.dataset.which || '', actNow()).ok) {
        if (state.sound) audio.sfx('quest');
        armGuard(e, b);
        keepPlace(function () {
          persist();
          render();
        });
        if (M.preparationsComplete(state)) {
          var sail = $('#finale-go');
          if (sail) {
            sail.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
            if (sail.focus) sail.focus({ preventScroll: true });
          }
        }
      }
      return;
    }
    if (b.dataset.act === 'work' || b.id === 'work-go') {
      if (M.buyWork(state, actNow()).ok) {
        if (state.sound) audio.sfx('quest');
        persist();
        render();
      }
      return;
    }
    if (b.dataset.act === 'errand' || b.id === 'errand-go') {
      if (M.buyErrand(state, actNow()).ok) {
        if (state.sound) audio.sfx('quest');
        persist();
        render();
      }
      return;
    }
    if (b.id === 'finale-go') {
      if (M.launchFinale(state, Date.now()).ok) {
        cheer(b, 'Under way');
        if (state.sound) audio.sfx('level');
        persist();
        render();
        scrollTo($('#ending'));
      }
      return;
    }
    if (b.dataset.act === 'year-cap') {
      view.yearCaptain = +b.dataset.captain;
      var harbour = $('#new-harbour');
      if (harbour) harbour.dataset.sig = '';
      render();
      return;
    }
    if (b.dataset.act === 'choice-fold') {
      view.choiceShut = !view.choiceShut;
      render();
      return;
    }
    if (b.dataset.act === 'year') {
      if (M.beginYear(state, Date.now(), +b.dataset.captain).ok) {
        view.choice = '';
        view.routes = false;
        view.endingOn = false;
        view.ledgerOn = false;
        bootIdle(null);
        persist();
        render();
        window.scrollTo(0, 0);
      }
      return;
    }
    if (b.dataset.act === 'ledger') {
      view.ledgerOn = true;
      render();
      scrollTo($('#ledger'));
      return;
    }
    if (b.dataset.act === 'anew') {
      M.newHarbour(state, +b.dataset.captain, Date.now());
      view.choice = '';
      view.routes = false;
      view.endingOn = false;
      view.ledgerOn = false;
      bootIdle(null);
      persist();
      render();
      window.scrollTo(0, 0);
      return;
    }
    if (b.dataset.act === 'shed') {
      if (M.buyWarehouse(state).ok) {
        if (state.sound) audio.sfx('select');
        bootIdle(null);
        persist();
        render();
      }
      return;
    }
    var cap = b.closest('[data-captain]');
    if (cap && b.dataset.act === 'hire') { hireAt(+cap.dataset.captain); return; }
    var li = b.closest('[data-i]');
    if (!li || b.dataset.act !== 'buy') return;
    var i = +li.dataset.i;
    var had = state.boats[i].owned;
    var shown = +b.getAttribute('data-count');
    if (!(shown > 0)) return;
    var result = M.buy(state, i, shown);
    if (!result.ok) return;
    if (b.dataset.chunk === '1') M.commitGoal(state, 'boat');
    var nowOwned = state.boats[i].owned;
    if (result.notes && result.notes.length) {
      var wrap = $('.harbour-wrap');
      var rect = wrap.getBoundingClientRect();
      pop(rect.left + rect.width * 0.62, rect.top + 24, result.notes[0].split('.')[0]);
    }
    if (state.sound) audio.sfx(M.lookIndex(had) !== M.lookIndex(nowOwned) || (result.notes && result.notes.length) ? 'quest' : 'coin');
    keepPlace(function () {
      persist();
      render();
      var again = document.querySelector('#boats [data-i="' + i + '"] [data-act="buy"]');
      if (again && again.focus) again.focus();
    });
  });

  $('#sound').addEventListener('click', function () { audio.cycle(); persist(); });
  Settings.create({
    mount: '#settingsMount',
    btnClass: '',
    rows: [{
      label: 'Sound',
      options: [[0, 'Off'], [1, 'Effects'], [2, 'Effects and music']],
      get: function () { return state.sound || 0; },
      set: function (v) { state.sound = v; persist(); audio.render(); if (v) audio.sfx('select'); }
    }]
  });
  if (window.setupFeedback) setupFeedback('Saltmarsh Shipping Office', VERSION, function () {
    return P.goal(state);
  });

  if (window.SaltmarshHarbour) {
    SaltmarshHarbour.init($('#harbour'), function () { return state; }, function () { return view; }, function () { return Settings.reduced(); });
  }

  function drawTools() { $('#tools').innerHTML = Arcade.saveToolsHTML(KEY, 'btn'); }
  drawTools();
  $('details.save').addEventListener('toggle', function () { if (this.open) drawTools(); });

  if (typeof state.born !== 'number') state.born = Date.now();
  var cashBeforeAway = state.cash;
  var booksBeforeAway = M.captainBooks(state);
  var haulsBeforeAway = M.captainHauls(state);
  var bootMs = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
  var stamp = M.awayStamp ? M.awayStamp(state.seen, state.leftAt, bootMs, Date.now()) : state.seen;
  var summary = bootIdle(typeof stamp === 'number' ? stamp : null);
  var cashAfterBoats = state.cash;
  if (summary) M.collectCaptains(state, Date.now(), M.OFFLINE_RATE);
  state.seen = Date.now();
  persist();
  if (summary && summary.credited) state.played = (state.played || 0) + summary.credited;
  if (summary && (summary.gained > 0 || summary.capped || state.cash !== cashBeforeAway)) {
    showAway(summary, {
      before: cashBeforeAway,
      after: state.cash,
      boatGain: cashAfterBoats - cashBeforeAway,
      captains: M.captainAwayLines(state, booksBeforeAway, haulsBeforeAway),
      openPage: false
    });
  }
  render();

  /* A hidden tab stays loaded, so the boats keep the full rate. The log says so.
     A closed game is the other path: half rate, applied above when the page loads. */
  var hiddenAt = null;
  var cashAtHide = null;
  var booksAtHide = null;
  var haulsAtHide = null;
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      state.leftAt = hiddenAt;
      state.seen = hiddenAt;
      if (!state._quiet) persist();
      cashAtHide = state.cash;
      booksAtHide = M.captainBooks(state);
      haulsAtHide = M.captainHauls(state);
      return;
    }
    if (hiddenAt == null) return;
    var awaySec = (Date.now() - hiddenAt) / 1000;
    var before = cashAtHide;
    var books = booksAtHide;
    var hauls = haulsAtHide;
    hiddenAt = null;
    cashAtHide = null;
    booksAtHide = null;
    haulsAtHide = null;
    if (!(awaySec >= 60)) return;
    var tries = 0;
    function settle() {
      tries += 1;
      var moved = state.cash !== before;
      if (!moved && tries < 10 && M.income(state) > 0) {
        setTimeout(settle, 100);
        return;
      }
      var capSeconds = M.offlineCap(state);
      showAway({
        away: awaySec,
        credited: Math.min(awaySec, capSeconds),
        gained: Math.max(0, state.cash - before),
        capped: awaySec > capSeconds
      }, {
        before: before,
        after: state.cash,
        boatGain: Math.max(0, state.cash - before - captainGain(books)),
        captains: M.captainAwayLines(state, books, hauls),
        openPage: true
      });
      render();
    }
    setTimeout(settle, 50);
  });
  window.addEventListener('pageshow', function () { render(); });
  function captainGain(books) {
    var nowBooks = M.captainBooks(state);
    var n = 0;
    for (var i = 0; i < nowBooks.length; i++) n += nowBooks[i] - (books && books[i] ? books[i] : 0);
    return n;
  }

  setInterval(function () {
    if (window.__saltmarshHold) return;
    var before = state.cash;
    if (document.visibilityState !== 'hidden') state.played = (state.played || 0) + 0.25;
    var paid = M.collectCaptains(state, Date.now(), 1);
    if (paid.length) {
      persist();
      var wrap = $('.harbour-wrap');
      if (wrap) {
        var rect = wrap.getBoundingClientRect();
        pop(rect.left + rect.width * 0.5, rect.top + 36, '+' + money(state.cash - before));
      }
    }
    render(!paid.length);
  }, 250);

  function showGoal() {
    var sel = P.target(state);
    var el = sel ? document.querySelector(sel) : null;
    if (!el) return;
    Array.prototype.forEach.call(document.querySelectorAll('.goal-target'), function (node) {
      node.classList.remove('goal-target');
    });
    el.classList.add('goal-target');
    scrollTo(el);
    if (view.goalTimer) clearTimeout(view.goalTimer);
    view.goalTimer = setTimeout(function () { el.classList.remove('goal-target'); }, 2200);
  }
  var goalEl = $('#goal');
  if (goalEl) {
    goalEl.addEventListener('click', showGoal);
    goalEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      showGoal();
    });
  }

  function usableControl(b) {
    return !!(b && !b.disabled && !b.hidden && !b.closest('[hidden]'));
  }

  /* One click of whatever the goal bar is asking for. The pacing run uses this,
     so a measured wait is a wait on the step the player can see. */
  function followGoal() {
    var goal = ($('#goal') && $('#goal').textContent) || '';
    function press(el) {
      var x = window.scrollX;
      var y = window.scrollY;
      el.click();
      if (window.scrollX !== x || Math.abs((window.scrollY || 0) - y) > 1) window.scrollTo(x, y);
    }
    var cheap = P.bestStep ? P.bestStep(state) : (P.cheapestAffordable ? P.cheapestAffordable(state) : null);
    if (cheap && goal === cheap.sentence) {
      if (!cheap.affordable) return false;
      if (cheap.kind === 'choice') {
        if (view.choiceShut) {
          view.choiceShut = false;
          render();
        }
        var whichBtn = cheap.which ? document.querySelector('#choice [data-which="' + cheap.which + '"]') : document.querySelector('#choice-cards button');
        if (usableControl(whichBtn)) { press(whichBtn); return true; }
        return false;
      }
      if (cheap.kind === 'prep') {
        var prepSel = '#provision [data-prep="' + cheap.id + '"]' + (cheap.which ? '[data-which="' + cheap.which + '"]' : '');
        var prepHit = document.querySelector(prepSel) || $('#provision-go');
        if (usableControl(prepHit)) { press(prepHit); return true; }
        return false;
      }
      if (cheap.kind === 'route') {
        var routeHit = document.querySelector('#route-cards [data-route="' + cheap.id + '"] [data-act="route"]');
        if (usableControl(routeHit)) { press(routeHit); return true; }
        return false;
      }
      if (cheap.kind === 'light') {
        var lightHit = document.querySelector('#light-cards [data-light="' + cheap.id + '"] [data-act="light"]');
        if (usableControl(lightHit)) { press(lightHit); return true; }
        return false;
      }
      if (cheap.kind === 'gear') {
        var gearHit = document.querySelector('#route-gear button');
        if (usableControl(gearHit)) { press(gearHit); return true; }
        return false;
      }
      if (cheap.kind === 'boat') {
        var boatHit = document.querySelector('#boats [data-i="' + cheap.tier + '"] [data-act="buy"]');
        if (boatHit) boatHit.dataset.count = String(cheap.count || 1);
        if (usableControl(boatHit)) { press(boatHit); return true; }
        return false;
      }
    }
    var act = P.nextAct(state);
    if (/^Choose a route/.test(goal)) {
      var routeAct = P.nextAct(state);
      var routeBtn = routeAct && routeAct.kind === 'route'
        ? document.querySelector('#route-cards [data-route="' + routeAct.id + '"] [data-act="route"]')
        : null;
      if (usableControl(routeBtn)) { press(routeBtn); return true; }
      return false;
    }
    if (/^Pick bell or coal/.test(goal)) {
      var bellBtn = document.querySelector('#choice-cards button');
      if (usableControl(bellBtn)) { press(bellBtn); return true; }
      return false;
    }
    if (/^Choose fresh|^Choose a pilot/.test(goal)) {
      var prepBtn = act && act.kind === 'prep'
        ? document.querySelector('#provision [data-prep="' + act.id + '"]' + (act.which ? '[data-which="' + act.which + '"]' : ''))
        : $('#provision-go');
      if (usableControl(prepBtn)) { press(prepBtn); return true; }
      return false;
    }
    if (/^Choose /.test(goal)) {
      if (view.choiceShut) {
        view.choiceShut = false;
        render();
      }
      var choice = document.querySelector('#choice-cards button');
      if (usableControl(choice)) { press(choice); return true; }
      return false;
    }
    if (/^Ask /.test(goal)) {
      var ask = $('#ask');
      if (usableControl(ask)) { press(ask); return true; }
      return false;
    }
    if (/^Row /.test(goal)) {
      var row = $('#row');
      if (usableControl(row)) { press(row); return true; }
      return false;
    }
    if (/^Set sail/.test(goal)) {
      var sail = $('#finale-go');
      if (usableControl(sail)) { press(sail); return true; }
      return false;
    }
    if (/^Pack /.test(goal)) {
      var packBtn = act && act.kind === 'prep'
        ? document.querySelector('#provision [data-prep="' + act.id + '"]')
        : $('#provision-go');
      if (usableControl(packBtn)) { press(packBtn); return true; }
      return false;
    }
    if (/^Do the harbour work/.test(goal)) {
      var workBtn = $('#work-go');
      if (usableControl(workBtn)) { press(workBtn); return true; }
      return false;
    }
    if (/^Run the errand/.test(goal)) {
      var errandBtn = $('#errand-go');
      if (usableControl(errandBtn)) { press(errandBtn); return true; }
      return false;
    }
    if (/^Send /.test(goal)) {
      var send = $('#finale-go');
      if (usableControl(send)) { press(send); return true; }
      return false;
    }
    if (/^Sign /.test(goal) && act && act.kind === 'route') {
      var routeBtn = document.querySelector('#route-cards [data-route="' + act.id + '"] [data-act="route"]');
      if (usableControl(routeBtn)) { press(routeBtn); return true; }
      return false;
    }
    if (/^(Raise|Light) the /.test(goal) && act && act.kind === 'light') {
      var lightBtn = document.querySelector('#light-cards [data-light="' + act.id + '"] [data-act="light"]');
      if (usableControl(lightBtn)) { press(lightBtn); return true; }
      return false;
    }
    if (/^Buy |^Tie up /.test(goal)) {
      if (state.year === 2) {
        var namedTier = /rowboat/.test(goal) ? 0 : /sloop/.test(goal) ? 1 : /schooner/.test(goal) ? 2 : /bark/.test(goal) ? 3 : -1;
        var namedBtn = namedTier < 0 ? null : document.querySelector('#boats [data-i="' + namedTier + '"] [data-act="buy"]');
        if (namedBtn) namedBtn.dataset.count = '1';
        if (usableControl(namedBtn)) { press(namedBtn); return true; }
      }
      var boatTier = act && act.kind === 'boat' ? act.tier : (P.boatNeed(state) && P.boatNeed(state).tier);
      var buy = boatTier == null ? null : document.querySelector('#boats [data-i="' + boatTier + '"] [data-act="buy"]');
      if (act && act.kind === 'boat' && buy) buy.dataset.count = String(act.count);
      if (usableControl(buy)) { press(buy); return true; }
      return false;
    }
    return false;
  }

  window.__saltmarsh = {
    state: state,
    render: render,
    idle: function () { return idle; },
    away: function () { return awayOn; },
    taps: taps,
    view: view,
    preview: preview,
    followGoal: followGoal,
    M: M,
    P: P
  };
})();
