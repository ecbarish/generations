/* Saltmarsh Shipping Office. The window is the whole game.
   Idle runs the clock, the tab title and the save. Captains are paid from
   their own clocks, at most once for a stretch of time. */
(function () {
  'use strict';

  var M = window.Saltmarsh;
  var P = window.SaltmarshPhase;
  var KEY = M.SAVE_KEY;
  var VERSION = '0.2.0';
  var $ = function (sel) { return document.querySelector(sel); };
  var money = function (n) { return M.coins(n); };
  var view = { rowing: 0, ripple: null, choice: '', routes: false };
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
    copy.textContent = body + M.shedNote(state);
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
        var perk = i === 0 ? M.wrenPerkLine(state) : i === 1 ? M.bramblePerkLine(state) : '';
        status.textContent = each + ' coins each haul. Brought ' + money(brought) + ' so far. ' + back + (perk ? ' ' + perk : '');
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

  function fillChoice() {
    var box = $('#choice');
    if (!box) return;
    var offer = M.deskChoice(state);
    box.hidden = !offer;
    if (box.hidden) return;
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
      button.textContent = card.which === 'shed' ? M.shedChoiceText(card.cost) : card.name + ' · ' + money(card.cost) + ' coins';
    });
  }

  function fillSettled() {
    var box = $('#settled');
    if (!box) return;
    var rows = M.settledForks(state);
    box.hidden = !rows.length;
    if (box.hidden) return;
    var list = $('#settled-list');
    var sig = rows.map(function (row) { return row.id + row.takenName; }).join('|');
    if (list.dataset.sig === sig) return;
    list.dataset.sig = sig;
    list.replaceChildren();
    rows.forEach(function (row) {
      var li = document.createElement('li');
      li.textContent = row.takenName + ' is taken. ' + row.lockedName + ' is locked.';
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
    note.textContent = offers.length
      ? 'Pick one run. The others wait, and the prices are set until you choose.'
      : 'Every route on the chart has been signed.';
    var host = $('#route-cards');
    var sig = offers.map(function (offer) { return offer.id + ':' + offer.depth + ':' + Math.round(offer.cost); }).join('|');
    if (host.dataset.sig !== sig) {
      host.dataset.sig = sig;
      host.replaceChildren();
      offers.forEach(function (offer) {
        var wrap = document.createElement('div');
        wrap.className = 'route-card';
        var h = document.createElement('h3');
        h.textContent = offer.name + ' · ' + (offer.depth + 1) + ' of ' + offer.depths;
        var p = document.createElement('p');
        p.className = 'habit';
        var risk = offer.risk > 0 ? ' About ' + Math.round(offer.risk * 100) + '% can be lost.' : ' Nothing is risked.';
        p.textContent = offer.line + ' It is ' + offer.time + '.' + risk + (offer.perk ? ' ' + offer.perk : '');
        var gain = document.createElement('p');
        gain.className = 'facts';
        gain.textContent = 'Adds about ' + M.rateWords(offer.gain) + '.';
        var actions = document.createElement('div');
        actions.className = 'actions';
        var button = document.createElement('button');
        button.type = 'button';
        button.dataset.act = 'route';
        button.dataset.route = offer.id;
        actions.appendChild(button);
        wrap.appendChild(h);
        wrap.appendChild(p);
        wrap.appendChild(gain);
        wrap.appendChild(actions);
        host.appendChild(wrap);
      });
    }
    Array.prototype.forEach.call(host.querySelectorAll('[data-act="route"]'), function (button) {
      var id = button.dataset.route;
      var offer = null;
      for (var i = 0; i < offers.length; i++) if (offers[i].id === id) offer = offers[i];
      if (!offer) return;
      button.disabled = !offer.affordable;
      button.textContent = 'Sign ' + offer.name + ' · ' + money(offer.cost) + ' coins';
    });
  }

  function fillLights() {
    var box = $('#lights');
    if (!box) return;
    var phase = P.read(state);
    box.hidden = !phase.lighthousesOpen || state.ended;
    if (box.hidden) return;
    var offers = M.lightOffers(state, true);
    $('#lights-note').textContent = M.allLightsLit(state)
      ? 'Every lamp on the coast is burning.'
      : 'Each light changes the routes. Pick which one to raise next.';
    var host = $('#light-cards');
    var sig = offers.map(function (offer) { return offer.id + ':' + offer.stage + ':' + Math.round(offer.cost); }).join('|') + (offers.length ? '' : ':done');
    if (host.dataset.sig !== sig) {
      host.dataset.sig = sig;
      host.replaceChildren();
      M.LIGHTS.forEach(function (spec) {
        var stage = state.lights[spec.id] || 0;
        var offer = null;
        for (var i = 0; i < offers.length; i++) if (offers[i].id === spec.id) offer = offers[i];
        var wrap = document.createElement('div');
        wrap.className = 'light-card';
        var h = document.createElement('h3');
        h.textContent = spec.name + (stage >= 2 ? ' · burning' : stage === 1 ? ' · tower up' : ' · dark');
        var p = document.createElement('p');
        p.className = 'habit';
        p.textContent = stage >= 2 ? spec.lines[1] : (offer ? offer.line : spec.lines[0]);
        wrap.appendChild(h);
        wrap.appendChild(p);
        if (offer) {
          var actions = document.createElement('div');
          actions.className = 'actions';
          var button = document.createElement('button');
          button.type = 'button';
          button.dataset.act = 'light';
          button.dataset.light = spec.id;
          actions.appendChild(button);
          wrap.appendChild(actions);
        }
        host.appendChild(wrap);
      });
    }
    Array.prototype.forEach.call(host.querySelectorAll('[data-act="light"]'), function (button) {
      var offer = null;
      for (var i = 0; i < offers.length; i++) if (offers[i].id === button.dataset.light) offer = offers[i];
      if (!offer) return;
      button.disabled = !offer.affordable;
      button.textContent = offer.verb + ' ' + offer.name + ' · ' + money(offer.cost) + ' coins';
    });
  }

  function fillFinale() {
    var box = $('#finale');
    if (!box) return;
    var offer = M.finaleOffer(state, true);
    box.hidden = !offer;
    if (box.hidden) return;
    $('#finale-note').textContent = offer.line;
    var button = $('#finale-go');
    button.disabled = !offer.affordable;
    button.textContent = 'Send the last voyage · ' + money(offer.cost) + ' coins';
  }

  function fillEnding() {
    var box = $('#ending');
    if (!box) return;
    box.hidden = !state.ended;
    if (box.hidden) return;
    var stats = state.ending || M.statsOf(state, Date.now());
    $('#ending-lead').textContent = 'The last voyage is home. The lamps stay lit along the Saltmarsh coast.';
    var list = $('#ending-stats');
    var lines = [
      'Time at the office: ' + (stats.elapsed > 0 ? Arcade.fmtTime(Math.round(stats.elapsed)) : 'a short watch'),
      'Coins earned: ' + money(stats.lifetime),
      'Boats tied up: ' + stats.boats,
      'Routes signed: ' + stats.voyages,
      'Captain hauls: ' + stats.hauls,
      'Lighthouses burning: ' + stats.lights,
      'Charts for a new harbour: ' + stats.charts
    ];
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
    if (!again.childElementCount) {
      var lead = document.createElement('p');
      lead.textContent = 'Open a new harbour. You may ask one captain to come across.';
      again.appendChild(lead);
      var actions = document.createElement('div');
      actions.className = 'actions';
      M.CAPTAINS.forEach(function (cap, i) {
        var button = document.createElement('button');
        button.type = 'button';
        button.dataset.act = 'anew';
        button.dataset.captain = String(i);
        button.textContent = 'Ask ' + cap.name + ' to come';
        actions.appendChild(button);
      });
      var empty = document.createElement('button');
      empty.type = 'button';
      empty.dataset.act = 'anew';
      empty.dataset.captain = '-1';
      empty.textContent = 'Open it with an empty pier';
      actions.appendChild(empty);
      again.appendChild(actions);
    }
  }

  function scrollTo(el) {
    if (!el || !el.scrollIntoView) return;
    var motion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var reduced = motion || (window.Settings && Settings.reduced());
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  function render() {
    var phase = P.read(state);
    $('#office').dataset.phase = P.name(state);
    $('#coins').textContent = money(state.cash);
    $('#away-rule').textContent = M.awayRule(state);
    var boatsRate = M.income(state);
    var captainsRate = M.captainRate(state);
    var routeRate = M.routeIncome(state);
    var rateLine = $('#rate');
    var totalRate = boatsRate + captainsRate + routeRate;
    if (!(totalRate > 0)) rateLine.textContent = 'Nothing is earning yet.';
    else if (captainsRate > 0) rateLine.textContent = M.rateWords(totalRate) + '. The captains add ' + money(captainsRate) + '.';
    else rateLine.textContent = M.rateWords(totalRate);
    $('#goal').textContent = P.goal(state);
    var aim = $('#aim');
    if (aim) {
      var aimText = P.aim(state);
      aim.hidden = !aimText || !!state.ended;
      aim.textContent = aimText;
    }
    var scene = document.querySelector('.scene');
    if (scene) {
      if (state.ended) scene.textContent = 'Night on the Saltmarsh coast. The lamps are burning.';
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
    Array.prototype.forEach.call(list.children, function (li) { fillBoat(li, +li.dataset.i); });
    fillChoice();
    fillSettled();
    fillRoutes();
    fillLights();
    fillFinale();
    fillEnding();
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
      }
    }
    var desk = M.deskChoice(state);
    if (desk && view.choice !== desk.id) {
      view.choice = desk.id;
      scrollTo($('#choice'));
    } else if (!desk) view.choice = '';
    var routes = $('#routes');
    if (routes && !routes.hidden && !view.routes && P.goal(state).indexOf('Choose a route') === 0) {
      view.routes = true;
      scrollTo(routes);
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
      var offer = M.deskChoice(state);
      if (offer && M.chooseDesk(state, offer.id, b.dataset.which).ok) {
        if (b.dataset.which === 'shed') bootIdle(null);
        if (state.sound) audio.sfx('quest');
        persist();
        render();
      }
      return;
    }
    if (b.dataset.act === 'route') {
      if (M.signRoute(state, b.dataset.route).ok) {
        if (state.sound) audio.sfx('quest');
        persist();
        render();
      }
      return;
    }
    if (b.dataset.act === 'light') {
      if (M.buildLight(state, b.dataset.light).ok) {
        if (state.sound) audio.sfx('quest');
        persist();
        render();
      }
      return;
    }
    if (b.id === 'finale-go') {
      if (M.launchFinale(state, Date.now()).ok) {
        if (state.sound) audio.sfx('level');
        persist();
        render();
        scrollTo($('#ending'));
      }
      return;
    }
    if (b.dataset.act === 'anew') {
      M.newHarbour(state, +b.dataset.captain, Date.now());
      view.choice = '';
      view.routes = false;
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

  if (typeof state.born !== 'number') state.born = Date.now();
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
