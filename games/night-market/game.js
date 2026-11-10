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
  /* A version this game no longer reads is replaced. A damaged current file, or a newer one, is left on disk. */
  var protect = !!(raw && !M.valid(raw) && !(typeof raw.v === 'number' && raw.v < M.SAVE_VERSION));
  var loaded = raw && M.valid(raw);
  var state = loaded ? M.restore(raw) : M.fresh();
  if (!loaded) M.armNight(state, 1, M.newSeed());
  /* ?charms=line shows every charm in the quiet line so a 320-wide check can
     see the reserved slot. It does not write the save. */
  var charmPreview = /(?:\?|&)charms=line(?:&|$)/.test(location.search);
  if (charmPreview && state.night) {
    var charmIds = M.CHARMS.map(function (c) { return c.id; });
    state.night.charms = charmIds.slice();
    if (!state.meta) state.meta = { omens: [], charms: [], nights: [], pool: charmIds.length, pairs: [] };
    state.meta.charms = charmIds.slice();
    state.night.omen = state.night.omen || 'ferry';
    state.night.offer = null;
    state.night.kept = true;
  }
  var awayOn = false;

  function persist(obj) {
    if (charmPreview || protect || Arcade.held[KEY]) return false;
    if (!obj) {
      state.seen = Date.now();
      obj = M.serialize(state, state.seen);
    }
    return Arcade.save(KEY, obj);
  }

  var idle = M.createIdle(state, persist);
  var dawnAtLoad = M.dawnDue(state);
  var rateFlashUntil = 0;
  var dawnCardSeen = false;
  var paybackHintUntil = 0;
  var paybackHintStall = -1;
  var paybackHintDone = false;
  var finaleDismissed = false;

  // ART-NM-1: the lane strip only hears about sales, hires and buys; it reads state and never changes it
  function lane(what, i, a, b) { var L = window.NightLane; if (L && L[what]) L[what](i, a, b); }
  if (window.NightLane && document.getElementById('lane')) window.NightLane.init(document.getElementById('lane'), function () { return state; }, M.unlocked);

  function buyLabel(i, q) {
    q = q || M.quote(state, i, state.bulk);
    if (q.blocked === 'hire' || q.blocked === 'closed') return 'Buy 1';
    if (state.bulk === 'max' && q.blocked === 'payback') return 'Max skips a slow payback';
    if (state.bulk === 'next') {
      var need = M.countToNext(state, i);
      if (!(need > 0)) return 'Next · lit';
      if (q.count > 0) return 'Next · ' + q.count + ' · ' + money(q.cost) + ' coins';
      return 'Next · 1 · ' + money(q.cost) + ' coins';
    }
    if (state.bulk === 'max' && q.count > 0) return 'Max · ' + q.count + ' · ' + money(q.cost);
    var n = state.bulk === 10 || state.bulk === '10' ? 10 : 1;
    var priced = M.cost(i, state.stalls[i].owned, n, state);
    return 'Buy ' + n + ' · ' + money(priced) + ' coins';
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
    var tagged = M.bestIndex(state);
    if (!(state.bulk === 1 || state.bulk === '1') || !(tagged >= 0)) return tagged;
    var price = M.cost(tagged, state.stalls[tagged].owned, 1, state);
    if (price <= state.cash + 0.001) return tagged;
    var best = -1, score = Infinity, i, sec, one;
    for (i = 0; i < state.stalls.length; i++) {
      if (!state.stalls[i].hired || !M.unlocked(state, i)) continue;
      one = M.cost(i, state.stalls[i].owned, 1, state);
      if (one > state.cash + 0.001) continue;
      sec = M.paybackSeconds(state, i, 1);
      if (sec < score) { score = sec; best = i; }
    }
    return best >= 0 ? best : tagged;
  }

  /* The stall a player would save for. bestIndex stays the purchase rule, so a
     stall you cannot afford yet is named here and never bought by the sim. */
  function bestUnitIndex() {
    var best = -1, score = Infinity, i, sec;
    for (i = 0; i < M.STALLS.length; i++) {
      if (!state.stalls[i].hired || !M.unlocked(state, i)) continue;
      sec = M.paybackSeconds(state, i, 1);
      if (!(sec < score)) continue;
      score = sec;
      best = i;
    }
    return best;
  }

  function showTag(tag, saveUp) {
    if (!tag) return;
    tag.hidden = false;
    tag.textContent = saveUp ? 'Best · save up' : 'Best';
  }

  function holdSuffix() {
    if (!(hold && hold.live)) return '';
    return ' · holding adds ' + money(M.holdRate());
  }

  function statusSentences(text) {
    return String(text || '').split(/[.!?]+/).map(function (s) { return s.replace(/\s+/g, ' ').trim(); }).filter(Boolean);
  }

  /* The green goal already names the lane and the next light. The amber counter
     stays quiet rather than say those sentences again. */
  function laneCounterText(goalText) {
    var laneText = M.laneLine(state);
    var goalParts = statusSentences(goalText);
    var repeated = statusSentences(laneText).some(function (s) { return goalParts.indexOf(s) >= 0; });
    return repeated ? '' : laneText;
  }

  function fillRow(li, i) {
    var stall = M.STALLS[i];
    var st = state.stalls[i];
    var open = M.unlocked(state, i);
    li.className = 'stall' + (open ? '' : ' closed');
    var tag = li.querySelector('.best-tag');
    if (tag) tag.hidden = true;
    li.querySelector('h2').textContent = open
      ? stall.name + (st.owned > 0 ? ' · ' + st.owned : '')
      : stall.name;
    li.querySelector('.habit').textContent = open ? stall.habit : 'Still shuttered.';
    var facts = li.querySelector('.facts');
    var wait = li.querySelector('.wait');
    var nextGoal = li.querySelector('.next-goal');
    var serve = li.querySelector('[data-act="serve"]');
    var ask = li.querySelector('[data-act="hire"]');
    var buy = li.querySelector('[data-act="buy"]');
    if (!open) {
      li.querySelector('.pour').hidden = li.querySelector('.count').hidden = true;
      li.querySelector('.count').textContent = '0 of ' + M.servesNeed(state, i) + ' ' + stall.lefts + ' · press and hold to keep going';
      facts.textContent = '';
      if (nextGoal) nextGoal.textContent = '';
      wait.textContent = i > 0 ? shutterLine(i) : '';
      serve.hidden = false;
      buy.hidden = false;
      ask.hidden = false;
      serve.classList.add('reserved', 'keep-slot');
      buy.classList.add('reserved', 'keep-slot');
      ask.classList.add('reserved', 'keep-slot');
      ask.textContent = stall.hire;
      serve.textContent = i > 0 ? ('This stall · ' + stall.serve) : stall.serve;
      buy.textContent = 'Buy 1';
      serve.classList.remove('best');
      return;
    }
    serve.classList.remove('keep-slot', 'reserved');
    buy.classList.remove('keep-slot', 'reserved');
    ask.classList.remove('keep-slot', 'reserved');
    serve.hidden = false;
    if (i === M.STALLS.length - 1) {
      serve.classList.add('reserved', 'keep-slot');
      serve.textContent = 'This stall · ' + stall.serve;
    }
    var pouring = i === handJobIndex();
    serve.classList.remove('best');
    if (i !== M.STALLS.length - 1) {
      serve.textContent = !st.hired
        ? (pouring && i > 0 ? 'This stall · ' + stall.serve : stall.serve)
        : (stall.serve + ' yourself · +' + Math.max(1, Math.round(M.holdRate() * stall.hand)) + '/s');
    }
    var bar = li.querySelector('.pour');
    bar.hidden = !!st.hired;
    var serves = M.servesNeed(state, i);
    if (!st.hired) { var k = Math.min(st.serves, serves); bar.value = k; bar.max = serves; bar.textContent = k + ' of ' + serves;
      li.querySelector('.count').textContent = k + ' of ' + serves + ' ' + stall.lefts + (k < serves ? ' · press and hold to keep going' : ' · now press “' + stall.hire + '”'); }
    li.querySelector('.count').hidden = !!st.hired;
    if (!st.hired) {
      facts.textContent = '';
      if (nextGoal) nextGoal.textContent = '';
      var need = serves - st.serves;
      wait.textContent = need > 0
        ? need + ' more ' + (need === 1 ? stall.left : stall.lefts) + ' to do yourself.'
        : stall.vendor + ' will take it whenever you ask.';
      if (i === M.STALLS.length - 1 && st.owned === 0) wait.textContent += ' The first Story Mat costs ' + money(M.quote(state, i, 1).cost) + ' coins.';
      /* The Ask button keeps its place before it can be used, so the pour
         does not shrink or drop when the words appear. */
      var ready = M.canHire(state, i);
      ask.hidden = false;
      ask.classList.toggle('reserved', !ready);
      ask.classList.toggle('keep-slot', !ready);
      ask.setAttribute('aria-hidden', ready ? 'false' : 'true');
      ask.textContent = stall.hire;
      ask.disabled = !ready;
      buy.hidden = false;
      buy.classList.add('reserved', 'keep-slot');
      buy.disabled = true;
      buy.textContent = 'Buy 1';
      return;
    }
    var rate = M.production(state, i);
    facts.textContent = st.owned + ' open · ' + money(rate) + ' coins a second. ' + M.lookLine(state, i);
    if (nextGoal) {
      var chapter = i === M.STALLS.length - 1 ? M.chapterLine(state) : '';
      var goalBit = chapter ? chapter + ' ' + M.nextGoalLine(state, i) : M.nextGoalLine(state, i);
      if (i < 5 && st.owned >= 7 && st.owned < 10 && st.owned === M.lowestOwned(state)) goalBit += ' The lane doubles once every stall has 10.';
      nextGoal.textContent = goalBit;
    }
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
    ask.hidden = false;
    ask.classList.add('reserved', 'keep-slot');
    ask.textContent = stall.hire;
    ask.disabled = true;
    if (i === M.STALLS.length - 1) {
      ask.hidden = false;
      ask.classList.add('reserved', 'keep-slot');
      ask.textContent = stall.hire;
    }
    buy.hidden = false;
    buy.classList.remove('reserved', 'keep-slot');
    var offer = M.quote(state, i, state.bulk);
    var affordable = bestBuyIndex();
    var saveUp = affordable < 0 && i === bestUnitIndex();
    var deal = offer.count > 0 && i === affordable;
    if (tag) {
      if (deal || saveUp) showTag(tag, saveUp);
      else tag.hidden = true;
    }
    buy.classList.remove('best');
    var holdingBuy = typeof pressedBuy !== 'undefined' && pressedBuy && pressedBuy.el === buy && Date.now() - pressedBuy.t < 1500;
    if (!holdingBuy) buy.dataset.count = String(offer.count);
    var firstMat = i === M.STALLS.length - 1 && st.owned === 0 && !(state.night && state.night.kept);
    var slowMax = state.bulk === 'max' && offer.blocked === 'payback' && !firstMat;
    buy.classList.toggle('unroll', firstMat);
    buy.classList.toggle('refused', slowMax);
    if (!holdingBuy && slowMax) {
      buy.classList.remove('reserved', 'keep-slot');
      buy.disabled = false;
      buy.dataset.count = '1';
      buy.title = 'A bigger batch pays for itself too slowly. Max buys one.';
      buy.textContent = 'Max · 1 · ' + money(offer.cost);
      wait.textContent = 'Max will not buy a slow batch. It buys one. Use 1, 10 or Next for the rest.';
    } else if (!holdingBuy) {
      buy.title = '';
      buy.textContent = firstMat
        ? ('Unroll the Story Mat · ends the night · ' + money(offer.cost) + ' coins')
        : buyLabel(i, offer);
      buy.disabled = !(offer.count > 0);
    } else if (slowMax) {
      wait.textContent = 'Max will not buy a slow batch. It buys one. Use 1, 10 or Next for the rest.';
    }
    var needLine = li.querySelector('.need');
    if (needLine) {
      var asking = state.bulk === 10 || state.bulk === '10' ? 10 : 1;
      if ((state.bulk === 'max' || state.bulk === 'next') && offer.count > 0) asking = offer.count;
      var livePrice = M.cost(i, st.owned, asking, state);
      var shortfall = !(offer.count > 0) && livePrice > state.cash + 0.001 && !(state.bulk === 'max' && offer.blocked === 'payback' && !firstMat);
      var gap = Math.ceil(livePrice - state.cash - 1e-9);
      if (!(gap > 0)) gap = 0;
      needLine.textContent = shortfall ? ('Need ' + money(gap) + ' more.') : '';
      if (!shortfall && i < M.STALLS.length - 1 && !M.unlocked(state, i + 1)) {
        var openAt = M.unlockNeed(state, i + 1);
        if (st.owned < openAt) {
          needLine.textContent = M.STALLS[i + 1].vendor + ' opens at ' + openAt + '.';
          if (i + 1 === M.STALLS.length - 1) needLine.textContent = M.matSecondsLeft(state) > 0 ? M.matCountdown(state) : ('Old Wen opens at ' + openAt + ' trays.');
        }
      }
    }
  }
  function shutterLine(i) {
    var prev = M.STALLS[i - 1];
    var stall = M.STALLS[i];
    var need = M.unlockNeed(state, i);
    var unit = { tea: 'tea stalls', dumpling: 'carts', lantern: 'stands', mooncake: 'tables', incense: 'trays' };
    var line = stall.vendor + ' opens the ' + stall.name + ' at ' + need + ' ' + (unit[prev.id] || prev.name) + '.';
    if (i === M.STALLS.length - 1) {
      if (M.matSecondsLeft(state) > 0) {
        var preview = M.matLivePrice(state);
        if (preview > 0 && state.night) state.night.matShown = preview;
        line = M.matCountdown(state) + (preview > 0 ? (' Price when it opens: ' + money(preview) + ' coins.') : ' Price set when it opens.');
      } else line = 'Old Wen opens the Story Mat at ' + need + ' incense trays.';
    }
    return line;
  }

  function rebindIdle() {
    if (idle && idle.stop) idle.stop();
    idle = M.createIdle(state, persist);
    state.seen = Date.now();
    idle.start(state.seen);
    if (window.__nightMarket) window.__nightMarket.idle = idle;
  }
  function render() {
    M.prepareMat(state);
    var freeze = M.dawnDue(state) && !(state.night && state.night.kept);
    if (freeze && !nightFrozen) {
      nightFrozen = true;
      if (idle && idle.stop) idle.stop();
    } else if (!freeze && nightFrozen) {
      nightFrozen = false;
      rebindIdle();
    }
    $('#coins').textContent = money(state.cash);
    $('#away-rule').textContent = M.awayRule(state);
    var rate = M.income(state);
    var rateLine = (freeze ? 'The night has ended.' : (rate > 0 ? money(rate) + ' coins a second' : 'Nothing is earning yet.')) + (freeze ? '' : holdSuffix());
    if (!freeze && state.night && state.night.offer) rateLine += ' The stalls are paused.';
    var rateEl = $('#rate');
    rateEl.textContent = rateLine;
    rateEl.classList.toggle('flash', Date.now() < rateFlashUntil);
    var omenNow = $('#omen-now');
    var omenRow = state.night && M.omenById(state.night.omen);
    if (omenNow) omenNow.textContent = omenRow ? omenRow.brief : "Tonight's omen";
    var bookNote = $('#book-note');
    if (bookNote) bookNote.hidden = false;
    var openKey = '';
    for (var oi = 0; oi < M.STALLS.length; oi++) openKey += M.unlocked(state, oi) ? '1' : '0';
    if (openKey !== seenOpen) seenOpen = openKey;
    /* Name the next offer before this frame can place it, so the line and the
       card are the same peek. */
    if (state.night) {
      var sinceUp = lastPointerUp ? Date.now() - lastPointerUp : 999;
      state.night.holdOffer = !!(pointerDown || (sinceUp >= 0 && sinceUp < 300));
    }
    if (M.nextOfferLine) M.nextOfferLine(state);
    var nowMs = Date.now();
    if (M.noteWall) {
      var wallBefore = state.night && state.night.wallMs || 0;
      M.noteWall(state, nowMs, document.hidden);
      var wallAfter = state.night && state.night.wallMs || 0;
      if (Math.floor(wallAfter / 10000) !== Math.floor(wallBefore / 10000)) persist();
    }
    var quietDt = (nowMs - lastElapse) / 1000;
    lastElapse = nowMs;
    if (quietDt > 0) M.elapse(state, Math.min(quietDt, 120));
    var dawn = M.dawnDue(state);
    var goalText = dawn && !(state.night && state.night.kept) ? M.dawnGoal() : M.goal(state);
    var goalEl = $('#goal');
    goalEl.hidden = false;
    var matI = M.STALLS.length - 1;
    var unrollNow = !dawn && M.terminalUnroll(state);
    if (unrollNow) {
      var matQuote = M.quote(state, matI, 1);
      var unrollBtn = goalEl.querySelector('[data-act="unroll"]');
      if (!unrollBtn) {
        goalEl.replaceChildren();
        unrollBtn = document.createElement('button');
        unrollBtn.type = 'button';
        unrollBtn.dataset.act = 'unroll';
        unrollBtn.className = 'goal-unroll';
        goalEl.appendChild(unrollBtn);
      }
      unrollBtn.textContent = goalText;
      unrollBtn.dataset.count = String(matQuote.count || 0);
      unrollBtn.disabled = !(matQuote.count > 0);
      unrollBtn.title = matQuote.count > 0 ? '' : 'Unroll costs ' + money(matQuote.cost) + ' coins.';
    } else {
      goalEl.textContent = goalText;
    }
    var laneGoal = $('#lane-goal');
    if (laneGoal) laneGoal.textContent = laneCounterText(goalText);
    var finale = $('#finale');
    var finaleNote = $('#finale-note');
    var finaleOn = M.dawnDue(state) && !finaleDismissed;
    var finaleBackdrop = $('#finale-backdrop');
    if (finale) {
      finale.hidden = !finaleOn;
      if (finaleBackdrop) finaleBackdrop.hidden = !finaleOn;
      if (finaleOn) {
        var copy = M.dawnCopy(state);
        $('#finale-title').textContent = copy.title;
        $('#finale-lead').textContent = copy.lead;
        var summaryEl = $('#finale-summary');
        if (summaryEl) summaryEl.textContent = copy.summary;
        var nextNight = finale.querySelector('[data-act="next-night"]');
        var choice = finale.querySelector('[data-act="finale"]');
        if (nextNight) nextNight.textContent = copy.next;
        if (choice) choice.textContent = copy.choice;
        if (!dawnCardSeen) dawnCardSeen = true;
      }
    }
    if (!finaleOn) dawnCardSeen = false;
    if (finaleNote) {
      var showNote = !!(state.night && state.night.kept && state.stalls[M.STALLS.length - 1].owned >= 1 && !noteDismissed && Date.now() < noteUntil);
      finaleNote.hidden = !showNote;
      var noteText = $('#finale-note-text');
      if (noteText && showNote) noteText.textContent = 'The mat is unrolled. The lane stays open.';
    }
    if (M.syncOffers(state) || M.noteDawn(state)) persist();
    var hiring = state.stalls.some(function (s) { return s.hired; });
    $('#bulk').hidden = false;
    document.querySelectorAll('#bulk [data-bulk]').forEach(function (b) {
      b.disabled = !hiring;
    });
    document.querySelectorAll('[data-bulk]').forEach(function (b) {
      var on = String(state.bulk) === b.dataset.bulk;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var list = $('#stalls');
    if (!list.querySelector(':scope > [data-i]')) {
      M.STALLS.forEach(function (stall, i) {
        var li = document.createElement('li');
        li.dataset.i = String(i);
        li.innerHTML = '<h2></h2><p class="best-tag" hidden>Best</p><p class="habit"></p><p class="facts"></p><p class="wait"></p>' +
          '<progress class="pour" hidden></progress><p class="count" hidden></p>' +
          '<div class="actions"><button type="button" data-act="serve"></button>' +
          '<button type="button" class="ask" data-act="hire"></button>' +
          '<button type="button" data-act="buy"></button></div>' +
          '<p class="next-goal"></p>' +
          '<p class="need"></p>' +
          '<p class="payback-hint" hidden></p>';
        list.appendChild(li);
      });
      var saveBox = list.querySelector('details.save');
      if (saveBox) list.appendChild(saveBox);
    }
    Array.prototype.forEach.call(list.children, function (li) { if (li.dataset.i) fillRow(li, +li.dataset.i); });
    /* A press is in progress. Rebuilding the offer would destroy the button
       under the finger, so the card waits until the pointer comes up. */
    if (!pointerDown) {
      var pick = $('#pick');
      var firstStall = list.querySelector(':scope > [data-i="0"]');
      if (pick && firstStall && !pick.contains(firstStall) && firstStall.nextElementSibling !== pick) firstStall.after(pick);
      renderPick();
    }
    if (finaleOn) {
      setDawnInert(true);
      var stayedForDawn = window.scrollY;
      if (finale && !finale.contains(document.activeElement)) {
        var dawnButton = finale.querySelector('button');
        if (dawnButton) dawnButton.focus({ preventScroll: true });
      }
      if (window.scrollY !== stayedForDawn) window.scrollTo(0, stayedForDawn);
    }
    renderCodex();
    if (window.NightFestival && NightFestival.paint) NightFestival.paint(state, function () { persist(); rebindIdle(); render(); });
    renderCrowd();
    var laneNow = window.NightLane;
    if (laneNow && laneNow.signature && laneNow.refresh) {
      var nextSig = laneNow.signature();
      if (nextSig !== laneSig) {
        laneSig = nextSig;
        laneNow.refresh();
      }
    }
    syncPins();
    placeUnroll();
  }
  /* The heading is the Unroll button. When that heading has scrolled away, the
     same button stays at the top of the window. Nothing is scrolled or focused. */
  function placeUnroll() {
    var goal = $('#goal');
    var btn = goal && goal.querySelector('[data-act="unroll"]');
    if (!btn) return;
    var y = window.scrollY || 0;
    if (btn._unrollY === y) return;
    btn._unrollY = y;
    var goalBox = goal.getBoundingClientRect();
    var laneEl = document.getElementById('lane');
    var laneBox = laneEl ? laneEl.getBoundingClientRect() : null;
    var laneGone = !laneBox || laneBox.bottom <= 0.5;
    var stuck = goalBox.bottom <= 0 && laneGone;
    btn.classList.toggle('stuck', stuck);
    if (!stuck) {
      btn.style.top = '';
      return;
    }
    var pin = $('#goal-pin');
    var top = pin && !pin.hidden ? pin.getBoundingClientRect().bottom : 0;
    btn.style.top = Math.max(0, Math.round(top)) + 'px';
  }

  /* On a phone the green line sits under the lane, and its pin returns the moment that line
     leaves. The lane is already gone by then, so the pin never covers the pour.
     On a desktop the coin total returns once the coins and the lane have scrolled away.
     Scroll padding stays at that pin's height even while the pin is hidden, so a jump
     to the stalls clears it from the top of the page as well as from the bottom. */
  function pinHeight(el) {
    if (!el) return 0;
    var was = el.hidden;
    el.hidden = false;
    var h = el.getBoundingClientRect().height;
    el.hidden = was;
    return h;
  }

  function pinLineCount(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var tops = [], rects = range.getClientRects(), r, t;
    for (r = 0; r < rects.length; r++) {
      t = Math.round(rects[r].top);
      if (tops.indexOf(t) < 0) tops.push(t);
    }
    return tops.length || 1;
  }

  function syncPins() {
    var pin = $('#goal-pin');
    var goal = $('#goal');
    var laneEl = document.getElementById('lane');
    if (!pin || !goal) return;
    pin.hidden = !!goal.hidden;
    pin.textContent = goal.hidden ? '' : goal.textContent;
    pin.title = pin.textContent;
    if (goal.hidden) pin.hidden = true;
    /* A long goal wraps under the lane. On a phone the pin keeps the bonus,
       on one line, instead of cutting off the words "Next bonus". */
    if (pinLineCount(pin) > 1) {
      var bonusAt = goal.textContent.indexOf('Next bonus:');
      var costAt = goal.textContent.indexOf('It costs ');
      if (bonusAt > 0) pin.textContent = goal.textContent.slice(bonusAt);
      else if (costAt > 0) pin.textContent = 'Unroll the Story Mat. ' + goal.textContent.slice(costAt);
    }
    var coinPin = $('#coin-pin');
    var coins = document.querySelector('.coins');
    var phone = window.matchMedia('(max-width: 1000px)').matches;
    var wide = window.matchMedia('(min-width: 1001px)').matches;
    var laneBox = laneEl ? laneEl.getBoundingClientRect() : null;
    var coinBox = coins ? coins.getBoundingClientRect() : null;
    var goalBox = goal.getBoundingClientRect();
    var laneGone = !!laneBox && laneBox.bottom <= 0;
    var coinsGone = !!coinBox && coinBox.bottom <= 0;
    /* The pin used to wait until the whole goal box had left. On a phone that left
       about 40px where "Next bonus" was already gone and the pin was not up yet.
       It appears as the goal starts to leave, and only once the lane has gone. */
    var showGoal = !goal.hidden && phone && (!laneBox || laneBox.bottom <= 0.5) && goalBox.top <= 0.5;
    pin.hidden = !showGoal;
    if (coinPin) {
      var rate = M.income(state);
      var per = rate > 0 ? money(rate) + ' a second' : 'nothing earning yet';
      coinPin.textContent = money(state.cash) + ' coins · ' + per + holdSuffix();
      coinPin.hidden = !(wide && laneGone && coinsGone);
    }
    var reserve = phone ? pinHeight(pin) : pinHeight(coinPin);
    document.documentElement.style.scrollPaddingTop = reserve > 0 ? Math.ceil(reserve) + 'px' : '';
    /* Reserving the pin can pull the lane the rest of the way off the screen.
       Judge the coin total against that final place. */
    if (coinPin && wide) {
      var laneFinal = laneEl ? laneEl.getBoundingClientRect().bottom : 1;
      var coinsFinal = coins ? coins.getBoundingClientRect().bottom : 1;
      coinPin.hidden = !(laneFinal <= 0 && coinsFinal <= 0);
    }
    if (state.night && state.night.offer) placeOfferPanel();
  }

  function settleHash() {
    var hash = location.hash;
    if (!hash || hash.length < 2) return;
    var target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (target && target.scrollIntoView) target.scrollIntoView({ block: 'start' });
  }

  function showAway(summary) {
    var copy = M.awayCopy(summary, state);
    var box = $('#away');
    box.hidden = false;
    awayOn = true;
    box.innerHTML = '<h2>' + copy.title + '</h2><p>' + copy.lead + '</p><p>' + copy.box + '</p><p>' +
      M.gossipLine(state) + '</p><button type="button" data-act="away">Put the box away</button>';
  }

  /* The open card stays on the slot when that slot is on screen, and slides
     only as far as it must to stay inside the window. The slot itself does not grow. */
  function placeOfferPanel() {
    var panel = $('#pick-panel');
    if (!panel) return;
    /* The card is an overlay on its slot. Inline coordinates would lift it
       off that slot, so the slot's own place is the whole rule. */
    panel.style.position = '';
    panel.style.top = '';
    panel.style.left = '';
    panel.style.right = '';
    panel.style.width = '';
    panel.style.maxHeight = '';
    var pick = $('#pick');
    if (!pick || pick.classList.contains('quiet')) return;
    /* The coin pin and the goal pin sit on the top of the window. The choose
       line starts under whichever one is showing, so the words are not covered. */
    var pin = document.querySelector('#coin-pin:not([hidden]), #goal-pin:not([hidden])');
    var pinBottom = 0;
    if (pin) {
      var pinBox = pin.getBoundingClientRect();
      if (pinBox.height > 1 && pinBox.bottom > 0) pinBottom = pinBox.bottom;
    }
    if (pinBottom > 8) {
      var top = Math.ceil(pinBottom + 8);
      panel.style.top = top + 'px';
      panel.style.maxHeight = Math.max(180, window.innerHeight - top - 8) + 'px';
    }
  }
  function renderPick() {
    var box = $('#pick');
    if (!box) return;
    var offer = state.night && state.night.offer;
    var show = !!(offer && offer.options && offer.options.length && !M.dawnDue(state));
    box.hidden = false;
    box.classList.toggle('quiet', !show);
    if (M.noteOffer(state)) persist();
    var panel = $('#pick-panel');
    var backdrop = $('#pick-backdrop');
      if (!show) {
      if (panel) {
        panel.removeAttribute('role');
        panel.removeAttribute('aria-modal');
      }
      if (backdrop) backdrop.hidden = true;
      if (!M.dawnDue(state) || (state.night && state.night.kept)) setBehindInert(false);
      if (offerModalSig) {
        offerModalSig = '';
        resumeOffer();
        var back = offerReturn;
        offerReturn = null;
        if (back && back.focus && document.contains(back)) back.focus({ preventScroll: true });
      }
      var omenQuiet = state.night && M.omenById(state.night.omen);
      var taken = ((state.night && state.night.charms) || []).map(function (id) {
        var row = M.charmById(id);
        return row ? row.name : id;
      });
      $('#pick-lead').textContent = (omenQuiet ? omenQuiet.brief : 'No omen yet.') +
        (taken.length ? ' Charms tonight: ' + taken.join(', ') + '.' : ' No charm yet.') +
        ' ' + M.nextOfferLine(state);
      var pausedQuiet = $('#pick-paused');
      if (pausedQuiet) pausedQuiet.hidden = true;
      var idleChoices = $('#pick-choices');
      if (idleChoices && idleChoices.dataset.sig) {
        idleChoices.dataset.sig = '';
        idleChoices.replaceChildren();
      }
      var idleSkip = box.querySelector('[data-act="skip"]');
      var idleReroll = box.querySelector('[data-act="reroll"]');
      if (idleSkip) idleSkip.hidden = true;
      if (idleReroll) idleReroll.hidden = true;
      placeOfferPanel();
      return;
    }
    $('#pick-lead').textContent = offer.kind === 'omen'
      ? 'Choose an omen for tonight.'
      : ((offer.kind === 'charm' ? 'Pick a charm for tonight, or skip: ' : 'Pick one for tonight, or skip: ') +
        choiceLead(offer.options, function (id) { return { name: M.choiceName(offer.kind, id) }; }));
    var paused = $('#pick-paused');
    if (paused) paused.hidden = false;
    var choices = $('#pick-choices');
    var sig = offer.kind + '|' + offer.options.join(',') + '|' + (state.night.rerollUsed ? 1 : 0);
    if (panel) {
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.setAttribute('aria-labelledby', 'pick-lead');
    }
    if (backdrop) backdrop.hidden = false;
    box.inert = false;
    setBehindInert(true);
    pauseOffer();
    if (choices.dataset.sig === sig) {
      var skipSame = box.querySelector('[data-act="skip"]');
      var againSame = box.querySelector('[data-act="reroll"]');
      if (skipSame) skipSame.hidden = offer.kind === 'omen';
      if (againSame) {
        againSame.hidden = !!(state.night && state.night.rerollUsed);
        againSame.disabled = !!(state.night && state.night.rerollUsed);
        againSame.textContent = state.night && state.night.rerollUsed ? 'Rerolled' : 'Reroll once';
      }
      placeOfferPanel();
      return;
    }
    choices.dataset.sig = sig;
    choices.replaceChildren();
    offer.options.forEach(function (id, index) {
      var row = offer.kind === 'omen' ? M.omenById(id) : M.charmById(id);
      var button = document.createElement('button');
      button.type = 'button';
      button.dataset.act = offer.kind;
      button.dataset.choice = String(index);
      button.dataset.stall = M.cardSubject ? (M.cardSubject(offer.kind, id) || '') : '';
      button.textContent = M.choiceLine ? M.choiceLine(state, offer.kind, id) : (row ? (offer.kind === 'charm' ? M.offerLine(state, row) : row.line) : id);
      choices.appendChild(button);
    });
    var skip = box.querySelector('[data-act="skip"]');
    var again = box.querySelector('[data-act="reroll"]');
    if (skip) skip.hidden = offer.kind === 'omen';
    if (again) {
      again.hidden = !!(state.night && state.night.rerollUsed);
      again.disabled = !!(state.night && state.night.rerollUsed);
      again.textContent = state.night && state.night.rerollUsed ? 'Rerolled' : 'Reroll once';
    }
    if (offerModalSig !== sig) {
      offerOpenedAt = Date.now();
      if (!offerReturn) {
        var current = document.activeElement;
        offerReturn = current && current !== document.body && panel && !panel.contains(current) ? current : document.querySelector('#stalls [data-act="serve"]');
      }
      offerModalSig = sig;
      var firstChoice = choices.querySelector('button');
      if (firstChoice) firstChoice.focus({ preventScroll: true });
    }
    placeOfferPanel();
    if (offerModalSig === sig) revealOffer();
  }
  function revealOffer() {
    var panel = $('#pick-panel');
    if (!panel || !state.night || !state.night.offer) return;
    var key = (state.night.offer.options || []).join('|');
    if (panel.dataset.revealed === key) return;
    panel.dataset.revealed = key;
    /* The card is fixed in the window. The opening omen is the one moment a
       wide screen still needs the stall list nudged so the first pour is in
       that window. Later cards do not move the rows. */
    if (!state.night.offer || state.night.offer.kind !== 'omen') return;
    var serve = document.querySelector('#stalls [data-i="0"] [data-act="serve"]');
    var scroller = document.querySelector('.stalls');
    if (!serve || !scroller || !(scroller.scrollHeight > scroller.clientHeight + 2)) return;
    if (scroller.scrollTop >= 24) return;
    var viewH = document.documentElement.clientHeight;
    var box = serve.getBoundingClientRect();
    if (box.bottom > viewH - 4) scroller.scrollTop += Math.min(box.bottom - viewH + 12, 80);
  }
  function trapTab(panel, e) {
    if (!panel || e.key !== 'Tab') return false;
    var keys = [];
    panel.querySelectorAll('button, [tabindex="0"]').forEach(function (b) {
      if (b.hidden || b.disabled || b.tabIndex < 0) return;
      keys.push(b);
    });
    if (!keys.length) return false;
    var index = keys.indexOf(document.activeElement);
    if (index < 0) index = e.shiftKey ? 0 : keys.length - 1;
    var next = e.shiftKey ? (index - 1 + keys.length) % keys.length : (index + 1) % keys.length;
    e.preventDefault();
    keys[next].focus();
    return true;
  }
  document.addEventListener('keydown', function (e) {
    var finaleOn = $('#finale') && !$('#finale').hidden;
    if (finaleOn) {
      if (e.key === 'Escape') {
        e.preventDefault();
        var nextDefault = $('#finale [data-act="next-night"]');
        if (nextDefault) nextDefault.click();
        return;
      }
      trapTab($('#finale'), e);
      return;
    }
    var note = $('#finale-note');
    if (note && !note.hidden && e.key === 'Escape') {
      e.preventDefault();
      noteDismissed = true;
      render();
      return;
    }
    var pick = $('#pick');
    if (!pick || pick.classList.contains('quiet') || pick.hidden) return;
    if (e.key === 'Escape') {
      var skipping = state.night && state.night.offer && state.night.offer.kind !== 'omen';
      if (skipping && M.skipOffer(state)) {
        e.preventDefault();
        persist();
        render();
        if (!$('#pick').classList.contains('quiet')) focusOffer();
      }
      return;
    }
    trapTab($('#pick-panel'), e);
  });

  function choiceLead(ids, lookup) {
    var names = ids.map(function (id) {
      var row = lookup(id);
      return row ? row.name : id;
    });
    if (names.length <= 1) return (names[0] || 'Choose one') + '.';
    if (names.length === 2) return names[0] + ' or ' + names[1] + '.';
    return names.slice(0, -1).join(', ') + ', or ' + names[names.length - 1] + '.';
  }

  function focusOffer() {
    var pick = $('#pick');
    var showing = pick && !pick.hidden && !pick.classList.contains('quiet');
    var choice = showing && pick.querySelector('#pick-choices button:not([disabled])');
    var lead = $('#pick-lead');
    if (choice) { choice.focus({ preventScroll: true }); return; }
    if (showing && lead) { lead.focus({ preventScroll: true }); return; }
    var pour = document.querySelector('#stalls [data-i="0"] [data-act="serve"]');
    if (pour && !pour.hidden && !pour.disabled) { pour.focus({ preventScroll: true }); return; }
    var buy = document.querySelector('#stalls [data-act="buy"]:not([disabled])');
    if (buy && !buy.hidden) buy.focus({ preventScroll: true });
  }

  function renderCodex() {
    var box = $('#codex');
    if (!box) return;
    var book = M.codexView(state);
    box.replaceChildren();
    var nights = document.createElement('p');
    nights.textContent = 'Nights seen: ' + book.nights.length + '.';
    box.appendChild(nights);
    if (!book.nights.length) {
      var empty = document.createElement('p');
      empty.textContent = 'No night has ended yet.';
      box.appendChild(empty);
    }
    book.nights.forEach(function (night) {
      var line = document.createElement('p');
      var charms = night.charms.length ? night.charms.join(', ') : 'no charm';
      line.textContent = 'Night ' + night.n + '. ' + (night.omen || 'No omen') + '. ' + charms + '.';
      box.appendChild(line);
    });
    var omens = document.createElement('p');
    omens.textContent = 'Omens seen: ' + book.omens.length + ' of ' + book.omenCount + '.';
    box.appendChild(omens);
    book.omens.forEach(function (omen) {
      var line = document.createElement('p');
      line.textContent = omen.line;
      box.appendChild(line);
    });
    var charms = document.createElement('p');
    charms.textContent = 'Charms seen: ' + book.charms.length + ' of ' + book.charmCount + '.';
    box.appendChild(charms);
    book.charms.forEach(function (charm) {
      var line = document.createElement('p');
      line.textContent = charm.line;
      box.appendChild(line);
    });
  }
  function syncCrowdPad() {
    var box = $('#crowd');
    var pad = box && !box.hidden ? box.offsetHeight : 0;
    document.documentElement.style.setProperty('--crowd-pad', pad + 'px');
  }
  function renderCrowd() {
    var box = $('#crowd');
    if (!box || !M.lateView) return;
    var pick = $('#pick');
    var modal = pick && !pick.classList.contains('quiet');
    var view = modal ? null : M.lateView(state);
    if (!view) { box.hidden = true; syncCrowdPad(); return; }
    box.hidden = false;
    var lead = $('#crowd-lead');
    if (lead) lead.textContent = view.lead;
    var choices = $('#crowd-choices');
    var sig = view.kind + '|' + view.mark;
    if (state.night && state.night.holdOffer && choices.dataset.sig !== sig) {
      if (!choices.dataset.sig) { box.hidden = true; syncCrowdPad(); return; }
      syncCrowdPad();
      return;
    }
    if (choices.dataset.sig === sig) { syncCrowdPad(); return; }
    choices.dataset.sig = sig;
    crowdOpenedAt = Date.now();
    choices.replaceChildren();
    if (view.kind === 'early-mat') {
      var nowBtn = document.createElement('button');
      nowBtn.type = 'button';
      nowBtn.dataset.act = 'mat-now';
      var quote = view.quote > 0 ? view.quote : 0;
      nowBtn.dataset.quote = quote > 0 ? String(quote) : '';
      nowBtn.textContent = quote > 0 ? ('Open the row · Unroll ' + money(quote)) : 'Open the row';
      var waitBtn = document.createElement('button');
      waitBtn.type = 'button';
      waitBtn.dataset.act = 'mat-wait';
      waitBtn.textContent = 'Wait for 15:00';
      choices.appendChild(nowBtn);
      choices.appendChild(waitBtn);
    } else (view.stalls || []).forEach(function (row) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.act = 'rush';
      btn.dataset.stall = row.id;
      btn.textContent = row.bonus > 0 ? (row.name + ' · +' + money(row.bonus) + '/s') : row.name;
      choices.appendChild(btn);
    });
    syncCrowdPad();
  }
  if (window.ResizeObserver && $('#crowd')) {
    var crowdObserver = new ResizeObserver(syncCrowdPad);
    crowdObserver.observe($('#crowd'));
  }

  // Hold to pour. The pour uses the same Date.now() seconds as stall income, about eight a second
  // on a desktop and on a phone. A stalled timer pays at most one second, so a hold cannot run ahead
  // of the clock, and once the stalls earn more than that the hold is only a top-up.
  // A plain click still serves once.
  // NM-G8: before the hire, a hold stops at the vendor's count (12 of 12 dumplings). A plain click still serves, and still pays.
  var HOLD_DELAY = 350, HOLD_EVERY = 120, HOLD_PUMP = 50, hold = null;
  var finaleScroll = false, finaleFocused = false, noteDismissed = false, noteUntil = 0;
  var lastElapse = Date.now();
  var seenOpen = '';
  var offerModalSig = '', offerReturn = null, offerPaused = false, offerOpenedAt = 0;
  var crowdOpenedAt = 0;
  var lastPointerUp = 0;
  var INPUT_ARM = 400;
  var laneSig = '';
  var nightFrozen = false;
  function setBehindInert(on) {
    var nodes = document.querySelectorAll('.stall, .lane, #bulk, #goal, #lane-goal, header, details.save, #finale, .goal-pin, .coin-pin');
    for (var n = 0; n < nodes.length; n++) nodes[n].inert = !!on;
    if (!on && $('#pick')) $('#pick').inert = false;
  }
  function setDawnInert(on) {
    var nodes = document.querySelectorAll('.stall, .lane, #bulk, #goal, #lane-goal, header, details.save, #pick, .goal-pin, .coin-pin');
    for (var n = 0; n < nodes.length; n++) nodes[n].inert = !!on;
    if ($('#finale')) $('#finale').inert = false;
  }
  function pauseOffer() {
    if (idle && idle.stop) idle.stop();
    offerPaused = true;
  }
  function resumeOffer() {
    if (!offerPaused) return;
    offerPaused = false;
    state.seen = Date.now();
    if (idle && idle.start) idle.start(state.seen);
  }
  function revealFinale() {
    if (finaleScroll || finaleDismissed) return;
    finaleScroll = true;
  }
  function atCount(i) { return !state.stalls[i].hired && state.stalls[i].serves >= M.servesNeed(state, i); }
  function pumpHold() {
    if (!hold || !hold.live || hold.settled) return;
    var now = Date.now();
    var step = M.holdCredit((now - hold.since) / 1000, hold.acc);
    hold.since = now;
    hold.acc = step.acc;
    var n = step.pours;
    if (!state.stalls[hold.i].hired) n = Math.min(n, Math.max(0, M.servesNeed(state, hold.i) - state.stalls[hold.i].serves));
    var k;
    for (k = 0; k < n; k++) {
      if (atCount(hold.i)) break;
      if (!M.handSell(state, hold.i).ok) break;
      hold.n++;
      lane('serve', hold.i);
    }
    var holdRow = hold.b && hold.b.closest ? hold.b.closest('[data-i]') : null;
    var holdCount = holdRow && holdRow.querySelector('.count');
    if (holdCount && !state.stalls[hold.i].hired) {
      var holdNeed = M.servesNeed(state, hold.i);
      var holdHave = state.stalls[hold.i].serves;
      holdCount.textContent = holdHave + ' of ' + holdNeed + ' ' + M.STALLS[hold.i].lefts + (holdHave < holdNeed ? ' · press and hold to keep going' : ' · now press “' + M.STALLS[hold.i].hire + '”');
    }
    if (hold.n > 0 && atCount(hold.i)) settleHold(true);
  }
  /* A later hold pays for the whole press. Settling the previous one does not
     render under the new press, or the second hold collapses to a single click. */
  function settleHold(doRender) {
    if (!hold || hold.settled) return;
    clearTimeout(hold.t);
    clearInterval(hold.iv);
    if (hold.live && hold.began) {
      var elapsed = (Date.now() - hold.began) / 1000;
      if (elapsed > 30) elapsed = 30;
      var due = M.holdCredit(elapsed, 0).pours;
      var i = hold.i;
      while (hold.n < due) {
        if (!state.stalls[i].hired && state.stalls[i].serves >= M.servesNeed(state, i)) break;
        if (!M.handSell(state, i).ok) break;
        hold.n++;
        lane('serve', i);
      }
    }
    var poured = hold.n > 0;
    hold.live = false;
    hold.settled = true;
    if (poured) persist();
    if (doRender) render();
  }
  function stopHold() { settleHold(true); }
  document.addEventListener('touchmove', function (e) {
    var target = e.target && e.target.closest && e.target.closest('button');
    if (!target) return;
    if (target.dataset.act === 'buy' || target.dataset.act === 'serve' || target.dataset.act === 'hire' || target.closest('#pick') || target.dataset.bulk) e.preventDefault();
  }, { passive: false });
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('[data-act="serve"]');
    if (!b || b.disabled || e.button > 0) return;
    settleHold(false);
    var i = +b.closest('[data-i]').dataset.i, h = { b: b, i: i, n: 0, acc: 0, live: false, settled: false, since: 0, began: 0 };
    h.t = setTimeout(function () {
      if (!hold || hold !== h || h.settled) return;
      if (atCount(i)) return;
      h.live = true;
      h.began = Date.now();
      h.since = h.began;
      h.iv = setInterval(pumpHold, HOLD_PUMP);
      render();
    }, HOLD_DELAY);
    hold = h;
  });
  ['pointerup', 'pointercancel', 'blur'].forEach(function (ev) { (ev === 'blur' ? window : document).addEventListener(ev, stopHold); });
  window.addEventListener('contextmenu', function (e) {
    var node = e.target;
    if (node && node.nodeType !== 1) node = node.parentElement;
    var t = node && node.closest && node.closest('button, #pick, .actions, #bulk');
    if (!t && typeof e.clientX === 'number') {
      var under = document.elementFromPoint(e.clientX, e.clientY);
      t = under && under.closest && under.closest('button, #pick, .actions, #bulk');
    }
    if (!t) return;
    if (t.closest('#pick') || t.closest('.actions') || t.closest('#bulk') || t.dataset.act === 'serve' || t.dataset.act === 'buy' || t.dataset.act === 'hire') {
      e.preventDefault();
    }
  }, true);

  /* A render between press and release moves the button, and the click never lands.
     If the press was on Buy or a buy-mode button and the release missed it, count the press. */
  var pointerDown = false;
  document.addEventListener('pointerdown', function () { pointerDown = true; }, true);
  document.addEventListener('pointerup', function () { pointerDown = false; lastPointerUp = Date.now(); }, true);
  document.addEventListener('pointercancel', function () { pointerDown = false; lastPointerUp = Date.now(); }, true);
  window.addEventListener('blur', function () { pointerDown = false; });
  var pressedBuy = null;
  var buyDown = null;
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('button');
    if (!b || b.disabled || e.button > 0) return;
    if (b.dataset.act !== 'buy' && !b.dataset.bulk) return;
    pressedBuy = { el: b, t: Date.now() };
    if (b.dataset.act === 'buy') {
      var stall = b.closest('[data-i]');
      buyDown = { i: stall ? +stall.dataset.i : -1, t: Date.now(), used: false };
    }
  }, true);
  document.addEventListener('pointerup', function (e) {
    var held = pressedBuy;
    pressedBuy = null;
    if (!held || !held.el) return;
    if (Date.now() - held.t > 2000) return;
    var el = document.contains(held.el) ? held.el : null;
    if (!el) {
      var stall = held.el.closest && held.el.closest('[data-i]');
      var act = held.el.dataset.act || '';
      var bulk = held.el.dataset.bulk || '';
      var sel = stall && act ? '[data-i="' + stall.dataset.i + '"] [data-act="' + act + '"]' : (bulk ? '[data-bulk="' + bulk + '"]' : '');
      el = sel ? document.querySelector(sel) : null;
    }
    if (!el || el.disabled) return;
    var up = e.target && e.target.closest && e.target.closest('button');
    if (up === el || up === held.el) return;
    el.click();
  }, true);
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#open-book')) {
      var saveBox = $('details.save');
      var book = $('details.codex');
      if (saveBox) saveBox.open = true;
      if (book) book.open = true;
      if (book && book.scrollIntoView) book.scrollIntoView({ block: 'start', behavior: 'auto' });
      return;
    }
    if (e.target.closest && e.target.closest('#goal-pin') && !(e.target.closest('[data-act="unroll"]'))) {
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
    if (b.dataset.act === 'omen' || b.dataset.act === 'charm' || b.dataset.act === 'twist' || b.dataset.act === 'early' || b.dataset.act === 'boost' || b.dataset.act === 'priced' || b.dataset.act === 'half' || b.dataset.act === 'late' || b.dataset.act === 'sustain' || b.dataset.act === 'pick') {
      if (Date.now() - offerOpenedAt < INPUT_ARM) return;
      var pickedId = M.choose(state, +b.dataset.choice);
      if (pickedId) {
        var pickedRow = b.dataset.act === 'omen' ? M.omenById(pickedId) : M.charmById(pickedId);
        if (M.changesRate(pickedRow) || b.dataset.act === 'boost' || b.dataset.act === 'twist' || b.dataset.act === 'sustain' || b.dataset.act === 'pick') rateFlashUntil = Date.now() + 2500;
        if (b.dataset.act === 'omen') rebindIdle();
        persist();
        render();
        focusOffer();
      }
      return;
    }
    if (b.dataset.act === 'skip' || b.dataset.act === 'reroll') {
      if (Date.now() - offerOpenedAt < INPUT_ARM) return;
    }
    if (b.dataset.act === 'skip') {
      if (M.skipOffer(state)) {
        persist();
        render();
        if (!$('#pick').classList.contains('quiet')) focusOffer();
      }
      return;
    }
    if (b.dataset.act === 'reroll') {
      if (M.reroll(state)) { persist(); render(); focusOffer(); }
      return;
    }
    if (b.dataset.act === 'mat-now' || b.dataset.act === 'mat-wait' || b.dataset.act === 'rush') {
      if (Date.now() - crowdOpenedAt < INPUT_ARM) return;
      if (M.takeLate) M.takeLate(state, b.dataset.act === 'rush' ? b.dataset.stall : (b.dataset.act === 'mat-now' ? 'now' : 'wait'));
      var crowdChoices = $('#crowd-choices');
      if (crowdChoices) crowdChoices.dataset.sig = '';
      persist();
      render();
      return;
    }
    if (b.dataset.act === 'next-night') {
      var stayed = window.scrollY;
      M.nextNight(state);
      finaleDismissed = false;
      noteDismissed = false;
      noteUntil = 0;
      finaleScroll = false;
      finaleFocused = false;
      persist();
      rebindIdle();
      render();
      focusOffer();
      window.scrollTo(0, 0);
      return;
    }
    if (b.dataset.act === 'dismiss-note') {
      noteDismissed = true;
      render();
      return;
    }
    if ((b.dataset.act === 'buy' || b.dataset.act === 'serve' || b.dataset.act === 'hire' || b.dataset.act === 'unroll') && M.dawnDue(state) && !(state.night && state.night.kept)) return;
    if (b.dataset.act === 'unroll') {
      var matAt = M.STALLS.length - 1;
      var matCount = parseInt(b.dataset.count, 10);
      var matHad = state.stalls[matAt].owned;
      if (M.buyExact(state, matAt, matCount).ok) {
        lane('buy', matAt, matHad, state.stalls[matAt].owned);
        if (matHad < 1 && state.stalls[matAt].owned >= 1) revealFinale();
      }
      persist();
      render();
      return;
    }
    if (b.dataset.act === 'finale') {
      M.keepLane(state);
      finaleDismissed = true;
      noteDismissed = false;
      noteUntil = Date.now() + 8000;
      nightFrozen = true;
      persist();
      rebindIdle();
      nightFrozen = false;
      render();
      var note = $('#finale-note');
      if (note && !note.hidden) note.focus({ preventScroll: true });
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
    var scrollY = window.scrollY;
    if (b.dataset.act === 'serve') { if (M.handSell(state, i).ok) lane('serve', i); }
    else if (b.dataset.act === 'hire') { if (M.hire(state, i).ok) lane('hire', i); }
    else if (b.dataset.act === 'buy') {
      if (buyDown && buyDown.i === i && buyDown.used && Date.now() - buyDown.t < 40) return;
      var had = state.stalls[i].owned;
      var quoted = parseInt(b.dataset.count, 10);
      if (M.buyExact(state, i, quoted).ok) {
        if (buyDown && buyDown.i === i) buyDown.used = true;
        lane('buy', i, had, state.stalls[i].owned);
        if (i === M.STALLS.length - 1 && had < 1 && state.stalls[i].owned >= 1) revealFinale();
      }
      pointerDown = false;
    }
    else return;
    persist();
    render();
    if (window.scrollY !== scrollY) window.scrollTo(0, scrollY);
  });

  function drawTools() { $('#tools').innerHTML = Arcade.saveToolsHTML(KEY, 'btn'); }
  drawTools();
  $('details.save').addEventListener('toggle', function () { if (this.open) drawTools(); }); // fresh backups each time it opens
  var summary = idle.start(typeof state.seen === 'number' ? state.seen : null);
  state.seen = Date.now();
  persist(M.serialize(state, state.seen));
  if (summary && (summary.gained > 0 || summary.capped)) showAway(summary);
  render();
  settleHash();
  setInterval(render, 250);
  window.addEventListener('scroll', syncPins, true);
  window.addEventListener('resize', syncPins);
  window.addEventListener('hashchange', function () { syncPins(); settleHash(); });

  window.__nightMarket = { state: state, render: render, idle: idle, rebind: rebindIdle, HOLD_DELAY: HOLD_DELAY, HOLD_EVERY: HOLD_EVERY, drawTools: drawTools, away: function () { return awayOn; } };
})();
