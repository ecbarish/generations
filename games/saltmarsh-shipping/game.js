/* Saltmarsh Shipping Office. The window is the whole game.
   Idle runs the clock, the tab title and the save. Captains are paid from
   their own clocks, at most once for a stretch of time. */
(function () {
  'use strict';

  var M = window.Saltmarsh;
  var P = window.SaltmarshPhase;
  var KEY = M.SAVE_KEY;
  var VERSION = '0.1.0';
  var $ = function (sel) { return document.querySelector(sel); };
  var money = function (n) { return M.coins(n); };
  var view = { rowing: 0, ripple: null };
  var taps = [];
  var idle = null;
  var awayOn = false;

  Arcade.versions[KEY] = M.SAVE_VERSION;
  Arcade.validators[KEY] = M.valid;

  var raw = null;
  try { raw = Arcade.load(KEY); } catch (e) { raw = null; }
  var state = M.openSave(raw);

  function persist(obj) {
    if (Arcade.held[KEY]) return false;
    if (!obj) {
      state.seen = Date.now();
      obj = M.serialize(state, state.seen);
    }
    return Arcade.save(KEY, obj);
  }

  function bootIdle(seen) {
    if (idle) idle.stop();
    idle = M.createIdle(state, persist);
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

  function buyLabel(i) {
    var q = M.quote(state, i, state.bulk);
    if (state.bulk === 'max') {
      if (!(q.count > 0)) return 'Max · one costs ' + money(q.cost) + ' coins';
      return 'Buy up to ' + q.count + ' · ' + money(q.cost) + ' coins';
    }
    var n = state.bulk === 10 ? 10 : 1;
    return 'Buy ' + n + ' · ' + money(q.cost) + ' coins';
  }

  function visibleBoats() {
    var phase = P.read(state);
    if (!phase.boats) return [];
    var last = 0;
    for (var i = 0; i < M.BOATS.length; i++) {
      if (M.unlocked(state, i)) last = i + 1;
    }
    return M.BOATS.slice(0, Math.min(M.BOATS.length, last + 1));
  }

  function fillBoat(li, i) {
    var boat = M.BOATS[i];
    var open = M.unlocked(state, i);
    var owned = state.boats[i].owned;
    li.className = 'boat' + (open ? '' : ' closed');
    li.querySelector('h2').textContent = boat.name + (owned > 0 ? ' · ' + owned : '');
    li.querySelector('.habit').textContent = open ? M.lookLine(state, i) : boat.next;
    var facts = li.querySelector('.facts');
    var wait = li.querySelector('.wait');
    var buy = li.querySelector('[data-act="buy"]');
    if (!open) {
      facts.textContent = '';
      wait.textContent = i === 0 ? 'Row three cargoes first.' : '';
      buy.hidden = true;
      return;
    }
    var rate = M.production(state, i);
    facts.textContent = owned > 0 ? money(rate) + ' coins a second from these.' : 'None tied up yet.';
    wait.textContent = M.paybackLine(state, i);
    buy.hidden = false;
    buy.textContent = buyLabel(i);
    buy.disabled = !(M.quote(state, i, state.bulk).count > 0);
  }

  function fillSheds() {
    var box = $('#sheds');
    var phase = P.read(state);
    box.hidden = !phase.sheds;
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
    var shedBtn = box.querySelector('[data-act="shed"]');
    if (price == null || M.openFork(state)) shedBtn.hidden = true;
    else {
      shedBtn.hidden = false;
      shedBtn.disabled = !(state.cash >= price);
      shedBtn.textContent = 'Raise another shed · ' + money(price) + ' coins';
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
    M.CAPTAINS.forEach(function (cap, i) {
      var need = i === 0 ? M.WREN_AT : M.UNLOCK_AT;
      if (state.boats[cap.tier].owned < need && !state.captains[i].hired) return;
      shown.push(i);
    });
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
      if (!state.captains[i].hired) status.textContent = eachText + ' coins a haul, once they take a boat.';
      else {
        var next = M.nextIn(state, i, Date.now());
        var brought = state.captains[i].brought || 0;
        var back = next === Infinity ? 'The haul is waiting on shed room.' : 'Back in ' + (next > 0 ? next + 's' : 'a moment') + '.';
        status.textContent = each + ' coins each haul. Brought ' + money(brought) + ' so far. ' + back;
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

  function fillChoice() {
    var box = $('#choice');
    if (!box) return;
    var offer = M.choiceOffer(state);
    box.hidden = !offer;
    if (box.hidden) return;
    var host = $('#choice-cards');
    if (host.dataset.sig !== offer.id) {
      host.dataset.sig = offer.id;
      host.replaceChildren();
      function card(which, title, line) {
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
        button.dataset.act = 'fork';
        button.dataset.which = which;
        actions.appendChild(button);
        wrap.appendChild(h);
        wrap.appendChild(p);
        wrap.appendChild(actions);
        host.appendChild(wrap);
      }
      card('fit', offer.fit.name, offer.fit.line);
      card('shed', offer.shed.name, offer.shed.line);
    }
    var fitBtn = host.querySelector('[data-which="fit"]');
    var shedBtn = host.querySelector('[data-which="shed"]');
    if (fitBtn) {
      fitBtn.disabled = !offer.fit.affordable;
      fitBtn.textContent = offer.fit.name + ' · ' + money(offer.fit.cost) + ' coins';
    }
    if (shedBtn) {
      shedBtn.disabled = !offer.shed.affordable;
      shedBtn.textContent = 'Another shed · ' + money(offer.shed.cost || 0) + ' coins';
    }
  }

  function render() {
    var phase = P.read(state);
    $('#office').dataset.phase = P.name(state);
    $('#coins').textContent = money(state.cash);
    $('#away-rule').textContent = M.awayRule(state);
    var boatsRate = M.income(state);
    var captainsRate = M.captainRate(state);
    var rateLine = $('#rate');
    var totalRate = boatsRate + captainsRate;
    if (!(boatsRate > 0) && !(captainsRate > 0)) rateLine.textContent = 'Nothing is earning yet.';
    else if (captainsRate > 0) rateLine.textContent = money(totalRate) + ' coins a second. The captains add ' + money(captainsRate) + '.';
    else rateLine.textContent = money(boatsRate) + ' coins a second';
    if (totalRate > 0) document.title = '+' + money(totalRate) + '/s · Saltmarsh Shipping';
    $('#goal').textContent = P.goal(state);
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
    ask.hidden = askIndex < 0;
    if (askIndex >= 0) {
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
    $('#bulk').hidden = !phase.boats;
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
    Array.prototype.forEach.call(list.children, function (li) { fillBoat(li, +li.dataset.i); });
    fillChoice();
    fillSheds();
    fillLog();
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
        var motion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var reduced = motion || (window.Settings && Settings.reduced());
        var choice = $('#choice');
        var target = choice && !choice.hidden ? choice : fleet;
        if (target.scrollIntoView) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }
    }
    if (openedFleet) fleet.classList.add('reveal');
    if (audio && audio.render) audio.render();
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
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.act = 'away';
    btn.textContent = 'Close the log';
    box.appendChild(btn);
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

  function hireAt(index) {
    if (!M.hire(state, index).ok) return;
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

  document.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.id === 'row' || b.id === 'sound' || b.id === 'ask' || b.classList.contains('arc-set-btn')) return;
    if (b.dataset.bulk) {
      M.setBulk(state, b.dataset.bulk);
      persist();
      render();
      return;
    }
    if (b.dataset.act === 'away') {
      $('#away').hidden = true;
      awayOn = false;
      $('#away').replaceChildren();
      return;
    }
    if (b.dataset.act === 'fork') {
      var offer = M.choiceOffer(state);
      if (offer && M.chooseFork(state, offer.id, b.dataset.which).ok) {
        if (b.dataset.which === 'shed') bootIdle(null);
        if (state.sound) audio.sfx('quest');
        persist();
        render();
      }
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
    var result = M.buy(state, i, state.bulk);
    if (!result.ok) return;
    var nowOwned = state.boats[i].owned;
    if (result.notes && result.notes.length) {
      var wrap = $('.harbour-wrap');
      var rect = wrap.getBoundingClientRect();
      pop(rect.left + rect.width * 0.62, rect.top + 24, result.notes[0].split('.')[0]);
    }
    if (state.sound) audio.sfx(M.lookIndex(had) !== M.lookIndex(nowOwned) || (result.notes && result.notes.length) ? 'quest' : 'coin');
    persist();
    render();
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

  var cashBeforeAway = state.cash;
  var booksBeforeAway = M.captainBooks(state);
  var haulsBeforeAway = M.captainHauls(state);
  var summary = bootIdle(typeof state.seen === 'number' ? state.seen : null);
  var cashAfterBoats = state.cash;
  if (summary) M.collectCaptains(state, Date.now(), M.OFFLINE_RATE);
  state.seen = Date.now();
  persist();
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
  function captainGain(books) {
    var nowBooks = M.captainBooks(state);
    var n = 0;
    for (var i = 0; i < nowBooks.length; i++) n += nowBooks[i] - (books && books[i] ? books[i] : 0);
    return n;
  }

  setInterval(function () {
    var before = state.cash;
    var paid = M.collectCaptains(state, Date.now(), 1);
    if (paid.length) {
      persist();
      var wrap = $('.harbour-wrap');
      if (wrap) {
        var rect = wrap.getBoundingClientRect();
        pop(rect.left + rect.width * 0.5, rect.top + 36, '+' + money(state.cash - before));
      }
    }
    render();
  }, 250);

  window.__saltmarsh = {
    state: state,
    render: render,
    idle: function () { return idle; },
    away: function () { return awayOn; },
    taps: taps,
    view: view,
    M: M,
    P: P
  };
})();
