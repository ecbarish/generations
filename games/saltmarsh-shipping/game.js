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
  var money = function (n) { return Arcade.fmt(n); };
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

  function bulkLabel(mode) {
    if (mode === 'max') return 'Buy max';
    if (mode === 10) return 'Buy 10';
    return 'Buy 1';
  }

  function buyLabel(i) {
    var q = M.quote(state, i, state.bulk);
    var word = bulkLabel(state.bulk);
    if (!(q.count > 0)) return word + ' · ' + money(q.cost) + ' coins';
    if (state.bulk === 'max') return 'Buy ' + q.count + ' · ' + money(q.cost) + ' coins';
    return word + ' · ' + money(q.cost) + ' coins';
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
    box.hidden = !phase.captain;
    if (box.hidden) return;
    var price = M.warehousePrice(state);
    var sheds = state.warehouses;
    var body = sheds + (sheds === 1 ? ' shed' : ' sheds') + ' on the sand. Each one keeps two hours while you are away, up to four sheds. Away pay is half of being here.';
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
    if (price == null) shedBtn.hidden = true;
    else {
      shedBtn.hidden = false;
      shedBtn.disabled = !(state.cash >= price);
      shedBtn.textContent = 'Raise another shed · ' + money(price) + ' coins';
    }
  }

  function fillLog() {
    var phase = P.read(state);
    var box = $('#log');
    box.hidden = !phase.captain;
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
      if (state.boats[cap.tier].owned < M.UNLOCK_AT && !state.captains[i].hired) return;
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
        if (!state.captains[i].hired) {
          var actions = document.createElement('div');
          actions.className = 'actions';
          var ask = document.createElement('button');
          ask.type = 'button';
          ask.dataset.act = 'hire';
          ask.textContent = 'Ask ' + cap.name + ' to take the pier';
          actions.appendChild(ask);
          li.appendChild(actions);
        }
        list.appendChild(li);
      });
    }
    Array.prototype.forEach.call(list.children, function (li) {
      var i = +li.dataset.captain;
      var status = li.querySelector('.wait');
      var ask = li.querySelector('[data-act="hire"]');
      if (ask) ask.disabled = !M.canHire(state, i);
      if (!state.captains[i].hired) status.textContent = 'Waiting on the harbour road.';
      else {
        var next = M.nextIn(state, i, Date.now());
        status.textContent = next === Infinity ? 'The haul is waiting on shed room.' : 'Out on the water. Back in ' + (next > 0 ? next + 's' : 'a moment') + '.';
      }
    });
  }

  function fillChart() {
    var phase = P.read(state);
    var chart = $('#chart');
    var note = chart.querySelector('p') || chart.appendChild(document.createElement('p'));
    if (!phase.routesReady) note.textContent = 'Ten schooners will mark the trade routes. The chart is here for the fleet you already have.';
    else if (!phase.routesOpen) note.textContent = 'The trade routes are marked. They stay furled until the office opens them.';
    else note.textContent = 'The routes are open.';
  }

  function render() {
    var phase = P.read(state);
    $('#office').dataset.phase = P.name(state);
    $('#coins').textContent = money(state.cash);
    $('#away-rule').textContent = M.awayRule(state);
    var rate = M.income(state);
    $('#rate').textContent = rate > 0 ? money(rate) + ' coins a second' : 'Nothing is earning yet.';
    $('#goal').textContent = P.goal(state);
    var rowing = view.rowing > 0 && performance.now() - view.rowing < 650;
    var row = $('#row');
    row.disabled = rowing;
    row.textContent = rowing ? 'Rowing…' : (state.trips < M.HAND_TRIPS ? 'Row this cargo · ' + M.HAND_PAY + ' coins' : 'Row a cargo yourself · ' + M.HAND_PAY + ' coins');
    var ask = $('#ask');
    var askIndex = -1;
    for (var c = 0; c < M.CAPTAINS.length; c++) if (M.canHire(state, c)) { askIndex = c; break; }
    ask.hidden = askIndex < 0;
    if (askIndex >= 0) {
      ask.dataset.captain = String(askIndex);
      ask.textContent = 'Ask ' + M.CAPTAINS[askIndex].name + ' to take the pier';
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
    fillSheds();
    fillLog();
    var fleet = $('#fleet');
    fleet.hidden = !phase.fleet;
    if (!fleet.hidden) { fillChart(); fillCaptains(); }
    if (audio && audio.render) audio.render();
  }

  function showAway(summary) {
    var copy = M.awayCopy(state, summary);
    var box = $('#away');
    box.hidden = false;
    awayOn = true;
    box.replaceChildren();
    var h = document.createElement('h2');
    h.textContent = copy.title;
    var lead = document.createElement('p');
    lead.textContent = copy.lead;
    var coins = document.createElement('p');
    coins.textContent = copy.box;
    box.appendChild(h);
    box.appendChild(lead);
    box.appendChild(coins);
    (state.log || []).slice(0, 3).forEach(function (line) {
      var p = document.createElement('p');
      p.textContent = line.text;
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
    if (!M.handSell(state, 0).ok) return;
    view.rowing = performance.now();
    view.ripple = { x: x, y: y, at: view.rowing };
    pop(x, y, '+' + M.HAND_PAY);
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
    if (state.sound) audio.sfx(M.lookIndex(had) !== M.lookIndex(nowOwned) ? 'quest' : 'coin');
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

  var summary = bootIdle(typeof state.seen === 'number' ? state.seen : null);
  if (summary) M.collectCaptains(state, Date.now(), M.OFFLINE_RATE);
  state.seen = Date.now();
  persist();
  if (summary && (summary.gained > 0 || summary.capped)) showAway(summary);
  render();
  setInterval(function () {
    var paid = M.collectCaptains(state, Date.now(), 1);
    if (paid.length) persist();
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
