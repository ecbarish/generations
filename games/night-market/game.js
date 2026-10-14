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

  function bulkLabel(mode) {
    if (mode === 'max') return 'Buy max';
    if (mode === 10) return 'Buy 10';
    return 'Buy 1';
  }

  function buyLabel(i) {
    var q = M.quote(state, i, state.bulk);
    var word = bulkLabel(state.bulk);
    if (q.blocked === 'hire') return word;
    if (!(q.count > 0)) return word + ' · ' + money(q.cost) + ' coins';
    if (state.bulk === 'max') return 'Buy ' + q.count + ' · ' + money(q.cost) + ' coins';
    return word + ' · ' + money(q.cost) + ' coins';
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
      facts.textContent = '';
      wait.textContent = i > 0 ? M.STALLS[i - 1].next : '';
      serve.hidden = ask.hidden = buy.hidden = true;
      return;
    }
    serve.hidden = !!st.hired;
    serve.textContent = stall.serve;
    if (!st.hired) {
      facts.textContent = st.serves + ' done by hand.';
      var need = stall.serves - st.serves;
      wait.textContent = need > 0
        ? need + ' more ' + (need === 1 ? stall.left : stall.lefts) + ' to do yourself.'
        : stall.vendor + ' will take it whenever you ask.';
      ask.hidden = false;
      ask.textContent = stall.hire;
      ask.disabled = !M.canHire(state, i);
      buy.hidden = true;
      return;
    }
    var rate = M.production(state, i);
    facts.textContent = st.owned + ' open · ' + money(rate) + ' coins a second. ' + M.lookLine(state, i);
    var one = M.quote(state, i, 1);
    wait.textContent = one.cost > 0 && M.income(state) > 0
      ? 'The next one pays for itself in ' + Arcade.fmtTime(Math.ceil(one.cost / M.income(state))) + '.'
      : stall.vendor + ' is running this stall.';
    ask.hidden = true;
    buy.hidden = false;
    buy.textContent = buyLabel(i);
    buy.disabled = !(M.quote(state, i, state.bulk).count > 0);
  }

  function render() {
    $('#coins').textContent = money(state.cash);
    var rate = M.income(state);
    $('#rate').textContent = rate > 0 ? money(rate) + ' coins a second' : 'Nothing is earning yet.';
    $('#goal').textContent = M.goal(state);
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
          '<div class="actions"><button type="button" data-act="serve"></button>' +
          '<button type="button" class="ask" data-act="hire"></button>' +
          '<button type="button" data-act="buy"></button></div>';
        list.appendChild(li);
      });
    }
    Array.prototype.forEach.call(list.children, function (li) { fillRow(li, +li.dataset.i); });
  }

  function showAway(summary) {
    var copy = M.awayCopy(summary);
    var box = $('#away');
    box.hidden = false;
    awayOn = true;
    box.innerHTML = '<h2>' + copy.title + '</h2><p>' + copy.lead + '</p><p>' + copy.box + '</p><p>' +
      M.gossipLine(state) + '</p><button type="button" data-act="away">Put the box away</button>';
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b || b.disabled) return;
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
    if (b.dataset.act === 'serve') M.handSell(state, i);
    else if (b.dataset.act === 'hire') M.hire(state, i);
    else if (b.dataset.act === 'buy') M.buy(state, i, state.bulk);
    else return;
    persist();
    render();
  });

  $('#tools').innerHTML = Arcade.saveToolsHTML(KEY, 'btn');
  var summary = idle.start(typeof state.seen === 'number' ? state.seen : null);
  state.seen = Date.now();
  persist(M.serialize(state, state.seen));
  if (summary && (summary.gained > 0 || summary.capped)) showAway(summary);
  render();
  setInterval(render, 250);

  window.__nightMarket = { state: state, render: render, idle: idle, away: function () { return awayOn; } };
})();
