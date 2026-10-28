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
    return M.bestIndex(state);
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
      if (i === M.STALLS.length - 1) wait.textContent += (wait.textContent ? ' ' : '') + 'Unroll the Story Mat for ' + money(M.cost(i, 0, 1, state)) + ' coins.';
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
        : (stall.serve + ' yourself · +' + stall.hand);
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
      nextGoal.textContent = chapter ? chapter + ' ' + M.nextGoalLine(state, i) : M.nextGoalLine(state, i);
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
    buy.dataset.count = String(offer.count);
    var firstMat = i === M.STALLS.length - 1 && st.owned === 0 && !(state.night && state.night.kept);
    var slowMax = state.bulk === 'max' && offer.blocked === 'payback' && !firstMat;
    buy.classList.toggle('unroll', firstMat);
    buy.classList.toggle('refused', slowMax);
    if (slowMax) {
      buy.classList.remove('reserved', 'keep-slot');
      buy.disabled = false;
      buy.dataset.count = '1';
      buy.title = 'A bigger batch pays for itself too slowly. Max buys one.';
      buy.textContent = 'Max · 1 · ' + money(offer.cost);
      wait.textContent = 'Max will not buy a slow batch. It buys one. Use 1, 10 or Next for the rest.';
    } else {
      buy.title = '';
      buy.textContent = firstMat
        ? ('Unroll the Story Mat · ends the night · ' + money(offer.cost) + ' coins')
        : buyLabel(i, offer);
      buy.disabled = !(offer.count > 0);
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
    }
  }
  function shutterLine(i) {
    var prev = M.STALLS[i - 1];
    var stall = M.STALLS[i];
    var need = M.unlockNeed(state, i);
    var unit = { tea: 'tea stalls', dumpling: 'carts', lantern: 'stands', mooncake: 'tables', incense: 'trays' };
    return stall.vendor + ' opens the ' + stall.name + ' at ' + need + ' ' + (unit[prev.id] || prev.name) + '.';
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
    if (M.nextOfferLine) M.nextOfferLine(state);
    var nowMs = Date.now();
    var quietDt = (nowMs - lastElapse) / 1000;
    lastElapse = nowMs;
    if (quietDt > 0) M.elapse(state, Math.min(quietDt, 120));
    var dawn = M.dawnDue(state);
    var goalText = dawn && !(state.night && state.night.kept) ? M.dawnGoal() : M.goal(state);
    var goalEl = $('#goal');
    goalEl.textContent = goalText;
    goalEl.hidden = false;
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
    }
    Array.prototype.forEach.call(list.children, function (li) { if (li.dataset.i) fillRow(li, +li.dataset.i); });
    var pick = $('#pick');
    var firstStall = list.querySelector(':scope > [data-i="0"]');
    if (pick && firstStall && !pick.contains(firstStall) && firstStall.nextElementSibling !== pick) firstStall.after(pick);
    renderPick();
    if (finaleOn) {
      setDawnInert(true);
      if (finale && !finale.contains(document.activeElement)) {
        var dawnButton = finale.querySelector('button');
        if (dawnButton) dawnButton.focus({ preventScroll: true });
      }
    }
    renderCodex();
    syncPins();
    var laneNow = window.NightLane;
    if (laneNow && laneNow.signature && laneNow.refresh) {
      var nextSig = laneNow.signature();
      if (nextSig !== laneSig) {
        laneSig = nextSig;
        laneNow.refresh();
      }
    }
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
      if (bonusAt > 0) pin.textContent = goal.textContent.slice(bonusAt);
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
      var idleChoices = $('#pick-choices');
      if (idleChoices && idleChoices.dataset.sig) {
        idleChoices.dataset.sig = '';
        idleChoices.replaceChildren();
      }
      var idleSkip = box.querySelector('[data-act="skip"]');
      var idleReroll = box.querySelector('[data-act="reroll"]');
      if (idleSkip) idleSkip.hidden = true;
      if (idleReroll) idleReroll.hidden = true;
      return;
    }
    $('#pick-lead').textContent = offer.kind === 'omen'
      ? 'Choose an omen for tonight.'
      : ((offer.kind === 'charm' ? 'Pick a charm for tonight, or skip: ' : 'Pick one for tonight, or skip: ') +
        choiceLead(offer.options, function (id) { return { name: M.choiceName(offer.kind, id) }; }));
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
      }
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
      button.textContent = M.choiceLine ? M.choiceLine(state, offer.kind, id) : (row ? (offer.kind === 'charm' ? M.offerLine(state, row) : row.line) : id);
      choices.appendChild(button);
    });
    var skip = box.querySelector('[data-act="skip"]');
    var again = box.querySelector('[data-act="reroll"]');
    if (skip) skip.hidden = offer.kind === 'omen';
    if (again) {
      again.hidden = !!(state.night && state.night.rerollUsed);
      again.disabled = !!(state.night && state.night.rerollUsed);
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
    var laneEl = document.getElementById('lane');
    if (laneEl && laneEl.scrollIntoView) laneEl.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  function atCount(i) { return !state.stalls[i].hired && state.stalls[i].serves >= M.STALLS[i].serves; }
  function pumpHold() {
    if (!hold || !hold.live) return;
    var now = Date.now();
    var step = M.holdCredit((now - hold.since) / 1000, hold.acc);
    hold.since = now;
    hold.acc = step.acc;
    var n = step.pours;
    if (!state.stalls[hold.i].hired) n = Math.min(n, Math.max(0, M.STALLS[hold.i].serves - state.stalls[hold.i].serves));
    var k;
    for (k = 0; k < n; k++) {
      if (atCount(hold.i)) break;
      if (!M.handSell(state, hold.i).ok) break;
      hold.n++;
      lane('serve', hold.i);
    }
    if (hold.n > 0 && atCount(hold.i)) stopHold();
  }
  function stopHold() {
    if (!hold) return;
    clearTimeout(hold.t);
    clearInterval(hold.iv);
    var poured = hold.n > 0;
    hold.live = false;
    hold.done = true;
    if (poured) persist();
    render();
  }
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('[data-act="serve"]');
    if (!b || b.disabled || e.button > 0) return;
    stopHold();
    var i = +b.closest('[data-i]').dataset.i, h = { b: b, i: i, n: 0, acc: 0, live: false, done: false, since: 0 };
    h.t = setTimeout(function () {
      if (atCount(i)) return;                                                   // already at the count: the release is a plain click
      h.live = true;
      h.since = Date.now();
      h.iv = setInterval(pumpHold, HOLD_PUMP);
      render();
    }, HOLD_DELAY);
    hold = h;
  });
  ['pointerup', 'pointercancel', 'blur'].forEach(function (ev) { (ev === 'blur' ? window : document).addEventListener(ev, stopHold); });
  document.addEventListener('pointerleave', stopHold);
  document.addEventListener('contextmenu', function (e) { if (e.target.closest && e.target.closest('[data-act="serve"]')) e.preventDefault(); });

  /* A render between press and release moves the button, and the click never lands.
     If the press was on Buy or a buy-mode button and the release missed it, count the press. */
  var pressedBuy = null;
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('button');
    if (!b || b.disabled || e.button > 0) return;
    if (b.dataset.act !== 'buy' && !b.dataset.bulk) return;
    pressedBuy = { el: b, t: Date.now() };
  }, true);
  document.addEventListener('pointerup', function (e) {
    var held = pressedBuy;
    pressedBuy = null;
    if (!held || !held.el || !document.contains(held.el)) return;
    if (held.el.disabled || Date.now() - held.t > 2000) return;
    var up = e.target && e.target.closest && e.target.closest('button');
    if (up === held.el) return;
    held.el.click();
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
    if (b.dataset.act === 'omen' || b.dataset.act === 'charm' || b.dataset.act === 'twist' || b.dataset.act === 'early' || b.dataset.act === 'boost' || b.dataset.act === 'priced' || b.dataset.act === 'half' || b.dataset.act === 'late' || b.dataset.act === 'sustain') {
      if (Date.now() - offerOpenedAt < 300) return;
      var pickedId = M.choose(state, +b.dataset.choice);
      if (pickedId) {
        var pickedRow = b.dataset.act === 'omen' ? M.omenById(pickedId) : M.charmById(pickedId);
        if (M.changesRate(pickedRow) || b.dataset.act === 'boost' || b.dataset.act === 'twist' || b.dataset.act === 'sustain') rateFlashUntil = Date.now() + 2500;
        if (b.dataset.act === 'omen') rebindIdle();
        persist();
        render();
        focusOffer();
      }
      return;
    }
    if (b.dataset.act === 'skip' || b.dataset.act === 'reroll') {
      if (Date.now() - offerOpenedAt < 300) return;
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
      if (window.scrollY !== stayed) window.scrollTo(0, stayed);
      return;
    }
    if (b.dataset.act === 'dismiss-note') {
      noteDismissed = true;
      render();
      return;
    }
    if ((b.dataset.act === 'buy' || b.dataset.act === 'serve' || b.dataset.act === 'hire') && M.dawnDue(state) && !(state.night && state.night.kept)) return;
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
    if (b.dataset.act === 'serve') { if (M.handSell(state, i).ok) lane('serve', i); }
    else if (b.dataset.act === 'hire') { if (M.hire(state, i).ok) lane('hire', i); }
    else if (b.dataset.act === 'buy') {
      var had = state.stalls[i].owned;
      var quoted = parseInt(b.dataset.count, 10);
      if (M.buyExact(state, i, quoted).ok) {
        lane('buy', i, had, state.stalls[i].owned);
        if (i === M.STALLS.length - 1 && had < 1 && state.stalls[i].owned >= 1) revealFinale();
      }
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
  settleHash();
  setInterval(render, 250);
  window.addEventListener('scroll', syncPins, true);
  window.addEventListener('resize', syncPins);
  window.addEventListener('hashchange', function () { syncPins(); settleHash(); });

  window.__nightMarket = { state: state, render: render, idle: idle, rebind: rebindIdle, HOLD_DELAY: HOLD_DELAY, HOLD_EVERY: HOLD_EVERY, drawTools: drawTools, away: function () { return awayOn; } };
})();
