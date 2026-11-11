/* Patent Pending screen. Rules stay in model.js. */
(function () {
  'use strict';

  var M = window.Patent;
  var state;
  var idle;
  var sfx;
  var tab = 'inventions';
  var scroll = { inventions: 0, improvements: 0, charter: 0 };
  var cards = [];
  var upRows = [];
  var stepHold = '';
  var stepUntil = 0;
  var slipPay = 0;
  var slipUntil = 0;
  var lastFrame = 0;
  var confirming = false;
  var shown = [];
  var idleCap = 0;

  function $(id) { return document.getElementById(id); }
  function money(n) {
    if (!isFinite(n)) return Arcade.fmt(n);
    return Arcade.fmt(Math.max(0, Math.round(n)));
  }
  function now() { return Date.now(); }
  function day() { return M.localDay(new Date()); }

  function page(name) { return $('page-' + name); }

  function showTab(name) {
    scroll[tab] = page(tab).scrollTop;
    tab = name;
    ['inventions', 'improvements', 'charter'].forEach(function (n) {
      var on = n === name;
      $('tab-' + n).setAttribute('aria-selected', on ? 'true' : 'false');
      var el = page(n);
      el.hidden = !on;
      el.classList.toggle('on', on);
    });
    page(name).scrollTop = scroll[name] || 0;
    if (name === 'charter') drawCharter();
    paintHint();
  }

  function note(text, ms) {
    stepHold = text;
    stepUntil = now() + (ms || 2600);
    paintNotice();
  }

  function paintNotice() {
    var goal = M.GOALS[state.goal];
    var n = $('goal-n');
    var text = $('goal-text');
    var pay = $('goal-pay');
    if (!goal) {
      n.textContent = 'Done';
      text.textContent = 'Every goal is filed. Keep the office open.';
      pay.textContent = '';
    } else {
      n.textContent = 'Goal ' + (state.goal + 1) + '/' + M.GOALS.length;
      text.textContent = goal.text;
      var reward = M.goalPay(state, goal, now(), day());
      pay.textContent = reward > 0 ? '+' + money(reward) : '';
    }
    var line = $('step-line');
    if (slipUntil > now()) {
      if (!$('slip')) {
        line.textContent = '';
        var b = document.createElement('button');
        b.type = 'button';
        b.id = 'slip';
        b.textContent = 'A loose filing slip · +' + money(slipPay);
        b.onclick = catchSlip;
        line.appendChild(b);
      }
      return;
    }
    if (stepUntil > now() && stepHold) {
      line.textContent = stepHold;
      return;
    }
    line.textContent = stepText();
  }

  function stepText() {
    if (state.charters > 0 || state.coachOff) return '';
    if (state.stamps < 5) return 'Step 1 of 4. Stamp the wide button. Each stamp files the Better Paperclip.';
    if (!state.clerk[0]) return 'Step 2 of 4. Hire Clerk Pip for the Better Paperclip. Pip keeps filing while you are away.';
    if (state.owned[1] < 1) return 'Step 3 of 4. File the Self-stirring Spoon. Each new invention pays more than the last.';
    if (M.upgradeCount(state) < 1) return 'Step 4 of 4. Open Improvements and file one.';
    return 'The office can run while you step away.';
  }

  function paintHint() {
    document.querySelectorAll('.coach-mark').forEach(function (el) { el.classList.remove('coach-mark'); });
    if (state.charters > 0 || state.coachOff || slipUntil > now()) return;
    var target = null;
    if (state.stamps < 5) target = $('stamp');
    else if (!state.clerk[0]) target = document.querySelector('[data-hire="0"]');
    else if (state.owned[1] < 1) target = document.querySelector('[data-buy="1"]');
    else if (M.upgradeCount(state) < 1) target = $('tab-improvements');
    if (target) target.classList.add('coach-mark');
  }

  function speak(found) {
    if (!found) return;
    if (found.goals && found.goals.length) {
      var g = found.goals[found.goals.length - 1];
      note('Filed. ' + g.text + '. +' + money(g.pay) + ' fees.');
      if (sfx) sfx.sfx('quest');
    } else if (found.achievements && found.achievements.length) {
      note(found.achievements[0].name + '. ' + found.achievements[0].note);
      if (sfx) sfx.sfx('badge');
    }
  }

  function saveNow() {
    state.seen = Date.now();
    Arcade.save(M.SAVE_KEY, M.serialize(state, state.seen));
    Arcade.report('patent-pending', {
      summary: money(state.lifetime) + ' fees filed',
      detail: state.seals + (state.seals === 1 ? ' seal' : ' seals')
    });
  }

  function armIdle() {
    if (idle) idle.stop();
    idle = M.createIdle(state, function (blob) {
      Arcade.save(M.SAVE_KEY, blob);
      Arcade.report('patent-pending', {
        summary: money(state.lifetime) + ' fees filed',
        detail: state.seals + (state.seals === 1 ? ' seal' : ' seals')
      });
    });
    /* The away grant waits for Collect, measured from the moment the office was left. */
    idle.start(Date.now());
  }

  function markLeft() {
    if (!state || !state.introduced) return;
    state.leftAt = Date.now();
    state.cashAtLeave = state.cash;
    state.seen = state.leftAt;
    saveNow();
  }

  var welcomeOwed = 0;
  var welcomeCredited = 0;

  function showWelcome(pack, owed) {
    welcomeOwed = owed > 0 ? owed : 0;
    welcomeCredited = pack.credited > 0 ? pack.credited : 0;
    $('welcome-time').textContent = 'You were away ' + Arcade.fmtTime(Math.round(pack.away)) + '.';
    var list = $('welcome-lines');
    list.replaceChildren();
    if (!pack.lines.length) {
      var empty = document.createElement('li');
      empty.textContent = 'No clerk was at a desk, so the office held still.';
      list.appendChild(empty);
    } else {
      pack.lines.forEach(function (line) {
        var li = document.createElement('li');
        li.textContent = line.clerk + ' filed ' + money(line.amount) + ' on the ' + line.name + '.';
        list.appendChild(li);
      });
    }
    $('welcome-total').textContent = 'Together, ' + money(pack.total) + ' in fees.';
    if (pack.capped) $('welcome-total').textContent += ' They keep at most ' + Arcade.fmtTime(pack.credited) + '.';
    var unlock = M.nextUnlock(state, welcomeOwed, now(), day());
    $('welcome-next').textContent = unlock ? unlock.text : '';
    $('welcome').hidden = false;
  }

  function offerWelcome() {
    if (!state.introduced || !state.leftAt) return;
    var away = (Date.now() - state.leftAt) / 1000;
    if (away < 30) return;
    var pack = M.awayLines(state, away, Date.now(), day());
    var drifted = state.cash - (state.cashAtLeave || 0);
    var owed = Math.max(0, pack.total - Math.max(0, drifted));
    showWelcome(pack, owed);
  }

  function selectedName() {
    var i = state.selected;
    if (state.owned[i] > 0) return M.INVENTIONS[i].name;
    return M.INVENTIONS[0].name;
  }

  function paintStamp() {
    var sub = $('stamp-sub');
    var i = state.selected;
    var inv = M.INVENTIONS[i];
    if (state.owned[i] > 0 && !state.clerk[i]) {
      sub.textContent = money(5 * M.stampFactor(state)) + ' a stamp, on the ' + inv.name;
    } else if (state.owned[i] > 0 && state.clerk[i]) {
      if (now() < state.boostUntil && state.boostIndex === i) sub.textContent = inv.name + ' is boosted';
      else if (state.combo > 0 && state.combo < M.COMBO_NEED) sub.textContent = 'Stamp ' + state.combo + ' of ' + M.COMBO_NEED + ' on the ' + inv.name;
      else sub.textContent = 'Four stamps, a few seconds apart, boost the ' + inv.name;
    } else {
      sub.textContent = 'Files the ' + selectedName();
    }
  }

  function paintHeader() {
    $('fees').textContent = money(state.cash);
    var rate = M.managedRate(state, now(), day());
    $('rate').textContent = 'Clerks file ' + money(rate) + '/s';
    var dock = M.docket(day());
    $('docket').textContent = "Today's docket. " + dock.label + ' gives the ' + dock.invention + ' ' + dock.factor + ' times the fees.';
    var sound = $('sound');
    sound.textContent = state.sound === 0 ? 'Quiet' : state.sound === 2 ? 'Music' : 'Sound';
    sound.setAttribute('aria-pressed', state.sound ? 'true' : 'false');
    paintStamp();
    paintNotice();
    paintHint();
  }

  function barScale(i) {
    var cycle = M.INVENTIONS[i].cycle;
    if (state.clerk[i] && state.owned[i] > 0) {
      var t = (Date.now() / 1000) % cycle;
      return t / cycle;
    }
    if (!state.running[i]) return 0;
    return Math.max(0, Math.min(1, state.progress[i] / cycle));
  }

  function paintCard(i) {
    var card = cards[i];
    if (M.unlocked(state, i) || state.owned[i] > 0) shown[i] = true;
    card.root.classList.toggle('locked', !shown[i]);
    card.root.hidden = !shown[i];
    var count = state.owned[i];
    card.count.textContent = String(count);
    var rate = M.eachRate(state, i, now(), day());
    var boosted = !!(state.clerk[i] && now() < state.boostUntil && state.boostIndex === i);
    card.root.classList.toggle('boosted', boosted);
    card.sub.hidden = count <= 0;
    if (boosted) {
      var left = Math.max(1, Math.ceil((state.boostUntil - now()) / 1000));
      card.badge.classList.add('on');
      card.badge.textContent = '×1.5 · ' + left + 's';
      card.sub.textContent = money(rate) + '/s · boosted';
    } else {
      card.badge.classList.remove('on');
      card.badge.textContent = '';
      card.sub.textContent = count > 0
        ? money(rate) + '/s · ' + (state.clerk[i] ? 'clerk at the desk' : 'file it by hand')
        : '';
    }
    card.bar.style.transform = 'scaleX(' + barScale(i) + ')';
    var n = M.buyCount(state, i);
    var cost = M.bulkCost(state, i, n);
    var canFile = state.cash >= cost;
    card.buy.disabled = false;
    card.buy.classList.toggle('ready', canFile);
    card.buy.classList.toggle('short', !canFile);
    card.buy.setAttribute('aria-disabled', canFile ? 'false' : 'true');
    card.buy.firstChild.textContent = canFile ? (n > 1 ? 'File ' + n : 'File') : 'Need';
    card.cost.textContent = money(cost);
    var inv = M.INVENTIONS[i];
    if (state.clerk[i]) {
      card.hire.disabled = true;
      card.hire.classList.remove('ready');
      card.hire.classList.remove('short');
      card.hire.removeAttribute('aria-disabled');
      card.hire.textContent = 'Hired';
      card.hireLabel.textContent = inv.clerk + ' is at the desk.';
    } else {
      var hc = M.clerkCost(i);
      var canHire = count >= 1 && state.cash >= hc;
      card.hire.disabled = false;
      card.hire.classList.toggle('ready', canHire);
      card.hire.classList.toggle('short', !canHire);
      card.hire.setAttribute('aria-disabled', canHire ? 'false' : 'true');
      card.hire.textContent = canHire ? 'Hire' : 'Need ' + money(hc);
      card.hireLabel.textContent = count < 1
        ? 'A clerk waits until you file one.'
        : 'Hire ' + inv.clerk + ' · ' + money(hc);
    }
    card.root.classList.toggle('picked', state.selected === i && count > 0);
  }

  function paintUp(row) {
    var u = row.up;
    var owned = !!state.up[u.id];
    row.root.classList.toggle('filed', owned);
    var canUp = !owned && state.cash >= u.cost;
    row.button.disabled = owned;
    row.button.classList.toggle('ready', canUp);
    row.button.classList.toggle('short', !owned && !canUp);
    row.button.setAttribute('aria-disabled', canUp || owned ? 'false' : 'true');
    row.button.textContent = owned ? 'Filed' : canUp ? money(u.cost) : 'Need ' + money(u.cost);
  }

  function render() {
    paintHeader();
    for (var i = 0; i < cards.length; i++) paintCard(i);
    $('up-count').textContent = 'Filed ' + M.upgradeCount(state) + ' of ' + M.UPGRADES.length;
    for (var u = 0; u < upRows.length; u++) paintUp(upRows[u]);
  }

  function drawCharter() {
    var p = M.charterPreview(state);
    var root = $('charter');
    root.innerHTML =
      '<h2>File a new charter</h2>' +
      '<p class="lead">A charter closes this office and opens the next one from a single Better Paperclip. Seals stay. Each seal adds 2 percent to all filing fees.</p>' +
      '<div class="kv"><span>Seals now</span><b>' + p.seals + '</b></div>' +
      '<div class="kv"><span>Seals this charter would add</span><b>' + p.gain + '</b></div>' +
      '<div class="kv"><span>Seals after</span><b>' + p.nextSeals + '</b></div>' +
      '<div class="kv"><span>Permanent bonus now</span><b>×' + p.multiplier.toFixed(2) + '</b></div>' +
      '<div class="kv"><span>Permanent bonus after</span><b>×' + p.nextMultiplier.toFixed(2) + '</b></div>' +
      '<p class="hint" id="charter-hint"></p>' +
      '<div class="lists"><div><h3>You keep</h3><ul id="keep"></ul></div><div><h3>You lose</h3><ul id="lose"></ul></div></div>' +
      '<div class="charter-act"><button type="button" id="file-charter"' + (p.canFile ? '' : ' disabled') + '>' +
      (p.canFile ? 'File this charter' : 'Earn a seal first') + '</button></div>' +
      '<div class="confirm" id="confirm" hidden></div>' +
      '<div class="achs" id="achs"></div>';
    $('charter-hint').textContent = p.hint;
    var keep = $('keep');
    var lose = $('lose');
    p.keep.forEach(function (line) {
      var li = document.createElement('li');
      li.textContent = line;
      keep.appendChild(li);
    });
    p.lose.forEach(function (line) {
      var li = document.createElement('li');
      li.textContent = line;
      lose.appendChild(li);
    });
    var ach = $('achs');
    M.ACHIEVEMENTS.forEach(function (a) {
      var row = document.createElement('div');
      row.className = 'ach' + (state.ach[a.id] ? ' on' : '');
      var b = document.createElement('b');
      b.textContent = a.name;
      var em = document.createElement('span');
      em.textContent = a.note;
      row.appendChild(b);
      row.appendChild(em);
      ach.appendChild(row);
    });
    var btn = $('file-charter');
    if (btn) btn.onclick = function () { openConfirm(p); };
  }

  function openConfirm(p) {
    confirming = true;
    var box = $('confirm');
    box.hidden = false;
    box.innerHTML = '';
    var lead = document.createElement('p');
    lead.textContent = 'File the charter? You gain ' + p.gain + ' seal' + (p.gain === 1 ? '' : 's') +
      '. The permanent bonus becomes ×' + p.nextMultiplier.toFixed(2) + '.';
    var row = document.createElement('div');
    row.className = 'charter-act';
    var yes = document.createElement('button');
    yes.type = 'button';
    yes.textContent = 'File it';
    var no = document.createElement('button');
    no.type = 'button';
    no.textContent = 'Keep this office';
    yes.onclick = function () {
      var result = M.fileCharter(state);
      confirming = false;
      if (!result.ok) return;
      if (sfx) sfx.sfx('win');
      saveNow();
      rearm();
      note('New charter. The permanent bonus is now ×' + result.preview.nextMultiplier.toFixed(2) + '.');
      showTab('inventions');
      render();
    };
    no.onclick = function () {
      confirming = false;
      box.hidden = true;
    };
    row.appendChild(yes);
    row.appendChild(no);
    box.appendChild(lead);
    box.appendChild(row);
  }

  function rearm() {
    state.seen = Date.now();
    armIdle();
    idleCap = M.offlineCap(state);
  }

  function onStamp() {
    var result = M.stamp(state, now(), day());
    if (sfx) sfx.sfx(result.boosted ? 'level' : 'coin');
    if (result.boosted && !state.boostTold) {
      state.boostTold = true;
      note('Four quick stamps boost the invention you picked. The row glows, and its fees per second rise, for eight seconds.');
    }
    speak(result);
    render();
  }

  function onBuy(i) {
    var result = M.buy(state, i, now(), day());
    if (!result.ok) {
      note('Not enough fees for ' + result.count + ' ' + M.INVENTIONS[i].name + '.');
      return;
    }
    if (sfx) sfx.sfx('coin');
    speak(result);
    render();
    if (tab === 'charter' && !confirming) drawCharter();
  }

  function onHire(i) {
    var result = M.hire(state, i, now(), day());
    if (!result.ok) {
      note(M.INVENTIONS[i].clerk + ' costs ' + money(result.cost) + '.');
      return;
    }
    if (sfx) sfx.sfx('level');
    if (!(result.goals && result.goals.length)) note(M.INVENTIONS[i].clerk + ' is at the desk.');
    speak(result);
    render();
  }

  function onUpgrade(id) {
    var result = M.buyUpgrade(state, id, now(), day());
    if (!result.ok) return;
    if (sfx) sfx.sfx('loot');
    speak(result);
    if (result.upgrade.kind === 'o') rearm();
    render();
  }

  function catchSlip() {
    if (!(slipPay > 0) || slipUntil < now()) return;
    var caught = slipPay;
    M.grant(state, caught);
    var found = M.checkAll(state, now(), day());
    slipUntil = 0;
    slipPay = 0;
    if (sfx) sfx.sfx('badge');
    note('Caught. +' + money(caught) + ' fees are in the drawer.');
    speak(found);
    render();
    scheduleSlip();
  }

  function scheduleSlip() {
    setTimeout(dropSlip, 25000 + Math.random() * 20000);
  }

  function dropSlip() {
    if (document.hidden || slipUntil > now()) return scheduleSlip();
    slipPay = M.slipPay(state, now(), day());
    if (!(slipPay > 0)) return scheduleSlip();
    slipUntil = now() + 8000;
    paintNotice();
    setTimeout(function () {
      if (slipUntil && slipUntil <= now() + 50) {
        slipUntil = 0;
        paintNotice();
        scheduleSlip();
      }
    }, 8100);
  }

  function buildRows() {
    var list = $('rows');
    M.INVENTIONS.forEach(function (inv, i) {
      var li = document.createElement('li');
      li.className = 'card' + (i === 0 ? '' : ' locked');
      if (i !== 0) li.hidden = true;
      li.dataset.invention = inv.id;
      var icon = document.createElement('button');
      icon.type = 'button';
      icon.className = 'icon';
      icon.innerHTML = inv.icon;
      icon.setAttribute('aria-label', 'File the ' + inv.name + ' by hand');
      var mid = document.createElement('div');
      var name = document.createElement('div');
      name.className = 'name';
      name.textContent = inv.name + ' ';
      var count = document.createElement('span');
      count.className = 'count-n';
      name.appendChild(count);
      var badge = document.createElement('span');
      badge.className = 'boost-badge';
      name.appendChild(badge);
      var blurb = document.createElement('p');
      blurb.className = 'blurb';
      blurb.textContent = inv.blurb;
      var sub = document.createElement('p');
      sub.className = 'sub';
      var bar = document.createElement('div');
      bar.className = 'bar';
      var fill = document.createElement('i');
      bar.appendChild(fill);
      mid.appendChild(name);
      mid.appendChild(blurb);
      mid.appendChild(sub);
      mid.appendChild(bar);
      var buy = document.createElement('button');
      buy.type = 'button';
      buy.className = 'buy';
      buy.dataset.buy = String(i);
      buy.appendChild(document.createTextNode('File'));
      var small = document.createElement('small');
      buy.appendChild(small);
      var hireRow = document.createElement('div');
      hireRow.className = 'hire-row';
      var hireLabel = document.createElement('span');
      var hire = document.createElement('button');
      hire.type = 'button';
      hire.className = 'hire';
      hire.dataset.hire = String(i);
      hire.textContent = 'Hire';
      hireRow.appendChild(hireLabel);
      hireRow.appendChild(hire);
      li.appendChild(icon);
      li.appendChild(mid);
      li.appendChild(buy);
      li.appendChild(hireRow);
      list.appendChild(li);
      icon.onclick = function () {
        state.selected = i;
        var poked = M.poke(state, i);
        if (poked.ok && sfx) sfx.sfx('select');
        render();
      };
      mid.onclick = function () { state.selected = i; render(); };
      buy.onclick = function () { onBuy(i); };
      hire.onclick = function () { onHire(i); };
      cards.push({ root: li, count: count, sub: sub, bar: fill, buy: buy, cost: small, hire: hire, hireLabel: hireLabel, badge: badge });
    });
  }

  function buildUps() {
    var list = $('ups');
    M.UPGRADES.forEach(function (up) {
      var li = document.createElement('li');
      li.className = 'up';
      var mark = document.createElement('div');
      mark.className = 'mark';
      mark.textContent = up.kind === 'o' ? 'N' : up.kind === 't' ? 'S' : up.kind === 'g' ? 'B' : 'I';
      var mid = document.createElement('div');
      var name = document.createElement('div');
      name.className = 'name';
      name.textContent = up.name;
      var note = document.createElement('p');
      note.className = 'blurb';
      note.textContent = up.note;
      mid.appendChild(name);
      mid.appendChild(note);
      var button = document.createElement('button');
      button.type = 'button';
      button.dataset.up = up.id;
      button.textContent = money(up.cost);
      li.appendChild(mark);
      li.appendChild(mid);
      li.appendChild(button);
      list.appendChild(li);
      button.onclick = function () { onUpgrade(up.id); };
      upRows.push({ root: li, up: up, button: button });
    });
  }

  function wireSound() {
    sfx = ArcadeSound.create({
      tracks: {
        desk: {
          bpm: 92,
          lead: 'triangle',
          echo: false,
          mel: 'E4 . G4 A4 . C5 A4 G4 E4',
          bass: 'A2 . . E2 . A2 . D2',
          drum: 'k . h . k . h h'
        }
      },
      mode: function () { return state.sound; },
      setMode: function (mode) { state.sound = mode; },
      musicKey: function () { return state.sound >= 2 ? 'desk' : null; }
    });
    $('sound').onclick = function () {
      sfx.cycle();
      saveNow();
      render();
    };
  }

  function loop(t) {
    var dt = lastFrame ? Math.min(1, (t - lastFrame) / 1000) : 0;
    lastFrame = t;
    if (dt) {
      var moved = M.advance(state, dt, now(), day());
      if (moved.paid) {
        speak(moved);
        render();
      } else {
        for (var i = 0; i < cards.length; i++) cards[i].bar.style.transform = 'scaleX(' + barScale(i) + ')';
      }
    }
    if (stepUntil && stepUntil < now() && slipUntil < now()) paintNotice();
    requestAnimationFrame(loop);
  }

  function boot() {
    Arcade.validators[M.SAVE_KEY] = M.valid;
    Arcade.versions[M.SAVE_KEY] = M.SAVE_VERSION;
    var saved = Arcade.load(M.SAVE_KEY);
    state = saved && M.valid(saved) ? M.restore(saved) : M.fresh();
    var roll = M.rollDay(state, day());
    buildRows();
    buildUps();
    wireSound();
    $('tools').innerHTML = Arcade.saveToolsHTML(M.SAVE_KEY, 'buy');
    $('stamp').onclick = onStamp;
    $('tab-inventions').onclick = function () { showTab('inventions'); };
    $('tab-improvements').onclick = function () { showTab('improvements'); };
    $('tab-charter').onclick = function () { showTab('charter'); };
    document.querySelectorAll('[data-bulk]').forEach(function (b) {
      b.onclick = function () {
        state.bulk = Number(b.dataset.bulk);
        document.querySelectorAll('[data-bulk]').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
        });
        if (sfx) sfx.sfx('select');
        render();
      };
    });
    $('open-office').onclick = function () {
      state.introduced = true;
      $('intro').hidden = true;
      saveNow();
      if (sfx) sfx.sfx('coin');
    };
    $('welcome-collect').onclick = function () {
      if (welcomeOwed > 0) M.grant(state, welcomeOwed);
      var found = M.noteReturn(state, welcomeCredited, now(), day());
      state.leftAt = 0;
      state.cashAtLeave = state.cash;
      welcomeOwed = 0;
      welcomeCredited = 0;
      $('welcome').hidden = true;
      speak(found);
      saveNow();
      render();
      if (sfx) sfx.sfx('coin');
    };
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) markLeft();
      else offerWelcome();
    });
    window.addEventListener('pagehide', markLeft);
    idleCap = M.offlineCap(state);
    armIdle();
    if (!state.introduced) $('intro').hidden = false;
    else if (roll.changed) note('Day ' + state.streak + ' in a row. All filing fees are a little stronger today.', 6000);
    offerWelcome();
    render();
    scheduleSlip();
    setInterval(function () { render(); }, 500);
    requestAnimationFrame(loop);
  }

  window.PatentView = {
    showSlip: function () {
      slipPay = Math.max(1, Math.round(M.slipPay(state, now(), day())));
      slipUntil = now() + 8000;
      paintNotice();
    },
    plan: function () { return M.nextPurchase(state, now(), day()); },
    rate: function () { return M.managedRate(state, now(), day()); },
    fees: function () { return state.cash; }
  };

  boot();
})();
