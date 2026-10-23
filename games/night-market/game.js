/* Night Market Stalls. The lane is the whole screen. Idle runs the clock and the save. */
(function () {
  'use strict';

  var M = window.NightMarket;
  var KEY = M.SAVE_KEY;
  var $ = function (sel) { return document.querySelector(sel); };
  var money = function (n) { return Arcade.fmt(n); };

  Arcade.versions[KEY] = M.SAVE_VERSION;
  Arcade.validators[KEY] = M.valid;

  var raw = Arcade.load(KEY);
  var protect = !!(raw && !M.valid(raw));
  var state = raw && M.valid(raw) ? M.restore(raw) : M.fresh();
  var awayOn = false;

  function persist(obj) {
    if (protect || Arcade.held[KEY]) return false;
    if (!obj) {
      state.seen = Date.now();
      obj = M.serialize(state, state.seen);
    }
    return Arcade.save(KEY, obj);
  }

  var idle = M.createIdle(state, persist);
  var paybackHintUntil = 0;
  var paybackHintStall = -1;
  var paybackHintDone = false;

  // ART-NM-1: the lane strip only hears about sales, hires and buys; it reads state and never changes it
  function lane(what, i, a, b) { var L = window.NightLane; if (L && L[what]) L[what](i, a, b); }
  if (window.NightLane && document.getElementById('lane')) window.NightLane.init(document.getElementById('lane'), function () { return state; }, M.unlocked);

  function buyLabel(i, q) {
    q = q || M.quote(state, i, state.bulk);
    if (q.blocked === 'hire' || q.blocked === 'closed') return 'Buy 1';
    if (state.bulk === 'max' && q.count > 0) return 'Max · ' + q.count + ' · ' + money(q.cost);
    var n = state.bulk === 10 ? 10 : 1;
    return 'Buy ' + n + ' · ' + money(q.cost) + ' coins';
  }

  /* Which pour still has to be done by hand. The Best tag belongs on a purchase, never here. */
  function handJobIndex() {
    var i, lastHired = -1;
    for (i = 0; i < M.STALLS.length; i++) {
      if (!M.unlocked(state, i)) continue;
      if (!state.stalls[i].hired) return i;
      lastHired = i;
    }
    return lastHired;
  }

  function bestBuyIndex() {
    var best = -1, score = Infinity, i, n, sec;
    for (i = 0; i < M.STALLS.length; i++) {
      if (!state.stalls[i].hired || !M.unlocked(state, i)) continue;
      n = state.bulk === 'max' ? Math.max(1, M.quote(state, i, 'max').count) : (state.bulk === 10 ? 10 : 1);
      sec = M.paybackSeconds(state, i, n);
      if (sec < score) { score = sec; best = i; }
    }
    return best;
  }

  function fillRow(li, i) {
    var stall = M.STALLS[i];
    var st = state.stalls[i];
    var open = M.unlocked(state, i);
    li.className = 'stall' + (open ? '' : ' closed');
    li.querySelector('h2').textContent = open
      ? stall.name + (st.owned > 0 ? ' · ' + st.owned : '')
      : stall.name;
    li.querySelector('.habit').textContent = open ? stall.habit : 'Still shuttered.';
    var facts = li.querySelector('.facts');
    var wait = li.querySelector('.wait');
    var serve = li.querySelector('[data-act="serve"]');
    var ask = li.querySelector('[data-act="hire"]');
    var buy = li.querySelector('[data-act="buy"]');
    if (!open) {
      li.querySelector('.pour').hidden = li.querySelector('.count').hidden = true;
      facts.textContent = '';
      wait.textContent = i > 0 ? M.STALLS[i - 1].next : '';
      serve.hidden = ask.hidden = buy.hidden = true;
      serve.classList.remove('best');
      return;
    }
    serve.hidden = false; // the pour button never vanishes: after the hire you can still pour by hand
    var pouring = i === handJobIndex();
    serve.classList.remove('best');
    serve.textContent = !st.hired
      ? (pouring && i > 0 ? 'This stall · ' + stall.serve : stall.serve)
      : (stall.serve + ' yourself · +' + stall.hand);
    var bar = li.querySelector('.pour');
    bar.hidden = !!st.hired;
    if (!st.hired) { var k = Math.min(st.serves, stall.serves); bar.value = k; bar.max = stall.serves; bar.textContent = k + ' of ' + stall.serves;
      li.querySelector('.count').textContent = k + ' of ' + stall.serves + ' ' + stall.lefts + (k < stall.serves ? ' · press and hold to keep going' : ' · now press “' + stall.hire + '”'); }
    li.querySelector('.count').hidden = !!st.hired;
    if (!st.hired) {
      facts.textContent = '';
      var need = stall.serves - st.serves;
      wait.textContent = need > 0
        ? need + ' more ' + (need === 1 ? stall.left : stall.lefts) + ' to do yourself.'
        : stall.vendor + ' will take it whenever you ask.';
      ask.hidden = !M.canHire(state, i);
      ask.textContent = stall.hire;
      ask.disabled = false;
      buy.hidden = true;
      return;
    }
    var rate = M.production(state, i);
    facts.textContent = st.owned + ' open · ' + money(rate) + ' coins a second. ' + M.lookLine(state, i);
    wait.textContent = M.paybackLine(state, i);
    var hint = li.querySelector('.payback-hint');
    var showHint = false;
    if (!paybackHintDone && /pay(?:s)? for (?:itself|themselves)/i.test(wait.textContent)) {
      if (!paybackHintUntil) { paybackHintUntil = Date.now() + 8000; paybackHintStall = i; }
      if (i === paybackHintStall && Date.now() < paybackHintUntil) showHint = true;
      else if (i === paybackHintStall && Date.now() >= paybackHintUntil) paybackHintDone = true;
    }
    if (hint) {
      hint.hidden = !showHint;
      hint.textContent = showHint ? 'A lower time is a better buy.' : '';
    }
    ask.hidden = true;
    buy.hidden = false;
    var offer = M.quote(state, i, state.bulk);
    var deal = i === bestBuyIndex();
    buy.classList.toggle('best', deal);
    buy.dataset.count = String(offer.count);
    buy.textContent = (deal ? 'Best · ' : '') + buyLabel(i, offer);
    buy.disabled = !(offer.count > 0);
  }

  function render() {
    $('#coins').textContent = money(state.cash);
    $('#away-rule').textContent = M.awayRule();
    var rate = M.income(state);
    $('#rate').textContent = rate > 0 ? money(rate) + ' coins a second' : 'Nothing is earning yet.';
    $('#goal').textContent = M.goal(state);
    var hiring = state.stalls.some(function (s) { return s.hired; });
    $('#bulk').hidden = !hiring;
    document.querySelectorAll('[data-bulk]').forEach(function (b) {
      var on = String(state.bulk) === b.dataset.bulk;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var list = $('#stalls');
    if (!list.children.length) {
      M.STALLS.forEach(function (stall, i) {
        var li = document.createElement('li');
        li.dataset.i = String(i);
        li.innerHTML = '<h2></h2><p class="habit"></p><p class="facts"></p><p class="wait"></p>' +
          '<progress class="pour" hidden></progress><p class="count" hidden></p>' +
          '<div class="actions"><button type="button" data-act="serve"></button>' +
          '<button type="button" class="ask" data-act="hire"></button>' +
          '<button type="button" data-act="buy"></button></div>' +
          '<p class="payback-hint" hidden></p>';
        list.appendChild(li);
      });
    }
    Array.prototype.forEach.call(list.children, function (li) { fillRow(li, +li.dataset.i); });
    syncPins();
  }

  /* On a phone the green goal returns only after the lane has left the screen,
     so the strip does not sit on the pour. A tap on it jumps back to the goal.
     On a desktop the coin total does the same once the coins and the lane have scrolled away. */
  function syncPins() {
    var pin = $('#goal-pin');
    var goal = $('#goal');
    var laneEl = document.getElementById('lane');
    if (!pin || !goal) return;
    pin.textContent = goal.textContent;
    var coinPin = $('#coin-pin');
    var coins = document.querySelector('.coins');
    var phone = window.matchMedia('(max-width: 1000px)').matches;
    var wide = window.matchMedia('(min-width: 1001px)').matches;
    var laneBox = laneEl ? laneEl.getBoundingClientRect() : null;
    var coinBox = coins ? coins.getBoundingClientRect() : null;
    var laneGone = !!laneBox && laneBox.bottom <= 0;
    var coinsGone = !!coinBox && coinBox.bottom <= 0;
    var showGoal = phone && laneGone;
    pin.hidden = !showGoal;
    if (coinPin) {
      var rate = M.income(state);
      coinPin.textContent = money(state.cash) + ' coins · ' + (rate > 0 ? money(rate) + ' a second' : 'nothing earning yet');
      coinPin.hidden = !(wide && laneGone && coinsGone);
    }
    var shown = showGoal ? pin : (coinPin && !coinPin.hidden ? coinPin : null);
    document.documentElement.style.scrollPaddingTop = shown ? Math.ceil(shown.getBoundingClientRect().height) + 'px' : '';
  }

  function showAway(summary) {
    var copy = M.awayCopy(summary);
    var box = $('#away');
    box.hidden = false;
    awayOn = true;
    box.innerHTML = '<h2>' + copy.title + '</h2><p>' + copy.lead + '</p><p>' + copy.box + '</p><p>' +
      M.gossipLine(state) + '</p><button type="button" data-act="away">Put the box away</button>';
  }

  // Hold to pour: press and hold a serve button and it keeps serving, a few a second, until you let go
  // (playtest: 25 single clicks was a chore). A plain click still serves once.
  // NM-G8: before the hire, a hold stops at the vendor's count (12 of 12 dumplings). A plain click still serves, and still pays.
  var HOLD_DELAY = 350, HOLD_EVERY = 120, hold = null;
  function serveOnce(i) { if (M.handSell(state, i).ok) lane('serve', i); persist(); render(); }
  function atCount(i) { return !state.stalls[i].hired && state.stalls[i].serves >= M.STALLS[i].serves; }
  function stopHold() { if (!hold) return; clearTimeout(hold.t); clearInterval(hold.iv); hold.done = true; }
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('[data-act="serve"]');
    if (!b || b.disabled || e.button > 0) return;
    stopHold();
    var i = +b.closest('[data-i]').dataset.i, h = { b: b, i: i, n: 0, done: false };
    h.t = setTimeout(function () {
      if (atCount(i)) return;                                                   // already at the count: the release is a plain click
      h.iv = setInterval(function () { if (atCount(i)) { stopHold(); return; } h.n++; serveOnce(i); if (atCount(i)) stopHold(); }, HOLD_EVERY);
      h.n++; serveOnce(i); if (atCount(i)) stopHold();
    }, HOLD_DELAY);
    hold = h;
  });
  ['pointerup', 'pointercancel', 'blur'].forEach(function (ev) { (ev === 'blur' ? window : document).addEventListener(ev, stopHold); });
  document.addEventListener('pointerleave', stopHold);
  document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('[data-act="serve"]')) e.preventDefault(); });

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#goal-pin')) {
      var goal = $('#goal');
      if (goal) goal.scrollIntoView({ block: 'start' });
      return;
    }
    if (e.target.closest && e.target.closest('#coin-pin')) {
      var coins = document.querySelector('.coins');
      if (coins) coins.scrollIntoView({ block: 'start' });
      return;
    }
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.act === 'serve' && hold && hold.b === b && hold.n > 0) { hold = null; return; } // a hold already poured; the release isn't one more
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
    var li = b.closest('[data-i]');
    if (!li) return;
    var i = +li.dataset.i;
    if (b.dataset.act === 'serve') { if (M.handSell(state, i).ok) lane('serve', i); }
    else if (b.dataset.act === 'hire') { if (M.hire(state, i).ok) lane('hire', i); }
    else if (b.dataset.act === 'buy') {
      var had = state.stalls[i].owned;
      var quoted = parseInt(b.dataset.count, 10);
      if (M.buyExact(state, i, quoted).ok) lane('buy', i, had, state.stalls[i].owned);
    }
    else return;
    persist();
    render();
  });

  function drawTools() { $('#tools').innerHTML = Arcade.saveToolsHTML(KEY, 'btn'); }
  drawTools();
  $('details.save').addEventListener('toggle', function () { if (this.open) drawTools(); }); // fresh backups each time it opens
  var summary = idle.start(typeof state.seen === 'number' ? state.seen : null);
  state.seen = Date.now();
  persist(M.serialize(state, state.seen));
  if (summary && (summary.gained > 0 || summary.capped)) showAway(summary);
  render();
  setInterval(render, 250);
  window.addEventListener('scroll', syncPins, true);
  window.addEventListener('resize', syncPins);

  window.__nightMarket = { state: state, render: render, idle: idle, HOLD_DELAY: HOLD_DELAY, HOLD_EVERY: HOLD_EVERY, drawTools: drawTools, away: function () { return awayOn; } };
})();
