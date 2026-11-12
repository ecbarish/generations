'use strict';

const path = require('path');
const { loadPage } = require('./page.cjs');

const HTML = 'games/saltmarsh-shipping/index.html';
const POLICIES = ['greedy-cheapest', 'paced-desktop', 'idle-away'];
const IDLE_OVER = 30;
const AWAY_GAP = 60;
const AWAY_PLAN = [60, 120, 300, 600];

function moneyToken(text) {
  const match = /(?:^|[\s·])(\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)(K|M|B|T|Qa|Qi|Sx|Sp|Oc|No|Dc)?(?=\s*coins\b)/.exec(text || '');
  if (!match) return '';
  return match[1].replace(/,/g, '') + (match[2] || '');
}

function tokenValue(token) {
  const match = /^(\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)(K|M|B|T|Qa|Qi|Sx|Sp|Oc|No|Dc)?$/.exec(token || '');
  if (!match) return NaN;
  const n = Number(match[1].replace(/,/g, ''));
  const suffix = match[2] || '';
  const names = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
  const at = names.indexOf(suffix);
  return at < 0 ? NaN : n * Math.pow(10, at * 3);
}

function agrees(token, actual, format) {
  if (!token || !Number.isFinite(actual)) return false;
  if (token === format(actual)) return true;
  const shown = tokenValue(token);
  return Number.isFinite(shown) && Math.abs(shown - actual) <= Math.max(0.51, Math.abs(actual) * 1e-4);
}

function makeBag(session) {
  return {
    count: 0,
    seen: {},
    items: [],
    add(where, text, actual, shown) {
      const key = String(where) + '|' + shown + '|' + actual + '|' + text;
      if (this.seen[key]) {
        this.seen[key] += 1;
        return;
      }
      this.seen[key] = 1;
      this.count += 1;
      this.items.push({
        session: session,
        t: null,
        where: where,
        text: String(text || '').replace(/\s+/g, ' ').slice(0, 300),
        shown: String(shown),
        actual: actual
      });
    }
  };
}

function usable(button) {
  if (!button || button.disabled || button.hidden) return false;
  return !button.closest('[hidden]');
}

function office(page) {
  return page.__saltmarsh;
}

function yearNow(M, state) {
  if (M.yearOf) return M.yearOf(state);
  return state && state.year === 2 ? 2 : 1;
}

function logLines(state) {
  return (state && state.log || []).map(row => row && row.text ? row.text : '').filter(Boolean);
}

function watchHow(state, pattern, fallback) {
  const lines = logLines(state);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (pattern.test(lines[i])) return lines[i];
  }
  return lines.length ? lines[lines.length - 1] : fallback;
}

function chargeFor(button, M, state) {
  const act = button.dataset.act || '';
  const id = button.id || '';
  if (id === 'row') return { kind: 'pay', value: M.handPay(state) };
  if (id === 'ask' || act === 'year' || id === 'finale-go') return { kind: 'claim', value: 0 };
  if (act === 'buy') {
    const tier = Number(button.closest('[data-i]') && button.closest('[data-i]').dataset.i);
    const count = Number(button.dataset.count) || 1;
    const quote = M.quote(state, tier, count);
    return { kind: 'charge', value: quote.cost, count: count };
  }
  if (act === 'route') {
    const offers = M.routeOffers(state, false);
    const row = offers.filter(offer => offer.id === button.dataset.route)[0];
    return row ? { kind: 'charge', value: row.cost } : null;
  }
  if (act === 'light') {
    const offers = M.lightOffers(state, false);
    const row = offers.filter(offer => offer.id === button.dataset.light)[0];
    return row ? { kind: 'charge', value: row.cost } : null;
  }
  if (act === 'shed') {
    const price = M.warehousePrice(state);
    return price == null ? null : { kind: 'charge', value: price };
  }
  if (act === 'gear') {
    const offer = M.gearOffer(state);
    return offer ? { kind: 'charge', value: offer.cost } : null;
  }
  if (act === 'work' || id === 'work-go') {
    const offer = M.workOffer(state);
    return offer ? { kind: 'charge', value: offer.cost } : null;
  }
  if (act === 'errand' || id === 'errand-go') {
    const offer = M.errandOffer(state);
    return offer ? { kind: 'charge', value: offer.cost } : null;
  }
  if (act === 'prep' || id === 'provision-go') {
    const offer = M.nextPreparation(state);
    return offer ? { kind: 'charge', value: offer.cost } : null;
  }
  if (act === 'fork') {
    const desk = M.deskChoice(state);
    const card = desk && (desk.cards || []).filter(row => row.which === button.dataset.which)[0];
    return card ? { kind: 'charge', value: card.cost } : null;
  }
  return null;
}

function quotedCosts(M, state) {
  const costs = [];
  function add(cost) { if (cost > 0 && isFinite(cost)) costs.push(cost); }
  (M.routeOffers(state, false) || []).forEach(row => add(row.cost));
  (M.lightOffers(state, false) || []).forEach(row => add(row.cost));
  const desk = M.deskChoice(state);
  if (desk && desk.cards) desk.cards.forEach(card => add(card.cost));
  for (let i = 0; i < M.BOATS.length; i++) add(M.quote(state, i, 1).cost);
  if (M.workOffer) add((M.workOffer(state) || {}).cost);
  if (M.errandOffer) add((M.errandOffer(state) || {}).cost);
  if (M.nextPreparation) add((M.nextPreparation(state) || {}).cost);
  if (M.gearOffer) add((M.gearOffer(state) || {}).cost);
  add(M.warehousePrice(state));
  return costs;
}

function scrape(page, bag, t) {
  const doc = page.document;
  const game = office(page);
  const M = page.Saltmarsh;
  const state = game.state;
  const coins = doc.querySelector('#coins');
  if (coins && coins.textContent !== M.coins(state.cash)) {
    bag.add('coins @' + t, coins.textContent, state.cash, coins.textContent);
  }
  const rate = doc.querySelector('#rate');
  if (rate) {
    const total = M.officeRate(state);
    const captains = M.captainRate(state);
    const expected = !(total > 0)
      ? 'Nothing is earning yet.'
      : captains > 0
        ? M.rateWords(total) + '. Captains add ' + M.coins(captains) + '.'
        : M.rateWords(total);
    if (rate.textContent !== expected) bag.add('rate @' + t, rate.textContent, total, rate.textContent);
  }
  const away = doc.querySelector('#away-rule');
  if (away && away.textContent) {
    const text = away.textContent;
    const pct = /(\d+)%/.exec(text);
    const hours = /up to (\d+)h/.exec(text);
    const sheds = /\((\d+) sheds?\)/.exec(text);
    const expectPct = Math.round(M.OFFLINE_RATE * 100);
    const expectHours = M.offlineCap(state) / 3600;
    const expectSheds = state.warehouses || 1;
    if (pct && Number(pct[1]) !== expectPct) bag.add('away rule @' + t, text, expectPct, pct[1]);
    if (hours && Number(hours[1]) !== expectHours) bag.add('away rule hours @' + t, text, expectHours, hours[1]);
    if (sheds && Number(sheds[1]) !== expectSheds) bag.add('away rule sheds @' + t, text, expectSheds, sheds[1]);
  }
  const scene = doc.querySelector('.scene');
  if (scene && /trips/.test(scene.textContent)) {
    const words = { one: 1, two: 2, three: 3, four: 4 };
    const word = /\b(one|two|three|four|\d+)\s+trips/i.exec(scene.textContent);
    if (word) {
      const shown = words[word[1].toLowerCase()] || Number(word[1]);
      if (shown !== M.HAND_TRIPS) bag.add('scene trips @' + t, scene.textContent, M.HAND_TRIPS, word[1]);
    }
  }
  const sheds = doc.querySelector('#sheds p');
  if (sheds && !sheds.closest('[hidden]')) {
    const text = sheds.textContent;
    if (/two hours/.test(text) && M.WAREHOUSE_HOURS !== 2) bag.add('shed hours @' + t, text, M.WAREHOUSE_HOURS, 'two hours');
    if (/four sheds/.test(text) && M.MAX_WAREHOUSES !== 4) bag.add('shed cap @' + t, text, M.MAX_WAREHOUSES, 'four sheds');
    if (/pays half/.test(text) && M.OFFLINE_RATE !== 0.5) bag.add('shed half @' + t, text, M.OFFLINE_RATE, 'half');
  }
  const aim = doc.querySelector('#aim');
  if (aim && !aim.hidden && aim.textContent) {
    const mins = /in (\d+) minutes/.exec(aim.textContent);
    if (mins && M.VOYAGE_AT) {
      const left = Math.max(1, Math.ceil((M.VOYAGE_AT - (state.played || 0)) / 60));
      if (Number(mins[1]) !== left) bag.add('aim @' + t, aim.textContent, left, mins[1]);
    }
    if (/Four lighthouses/.test(aim.textContent) && M.LIGHTS.length !== 4) {
      bag.add('aim lights @' + t, aim.textContent, M.LIGHTS.length, 'Four');
    }
  }
  const goalEl = doc.querySelector('#goal');
  if (goalEl && goalEl.textContent) {
    const goalText = goalEl.textContent;
    const need = /Need\s+(\S+)/.exec(goalText);
    const priceTok = moneyToken(goalText.replace(/Need\s+\S+/, ''));
    if (priceTok) {
      const costs = quotedCosts(M, state).filter(cost => M.coins(cost) === priceTok);
      if (!costs.length) bag.add('goal @' + t, goalText, 'no charge formats as ' + priceTok, priceTok);
      else if (need && M.coins(costs[0] - state.cash) !== need[1]) {
        bag.add('goal need @' + t, goalText, costs[0] - state.cash, need[1]);
      }
    }
  }
  doc.querySelectorAll('button').forEach(function (button) {
    if (!usable(button)) return;
    const charge = chargeFor(button, M, state);
    if (!charge) return;
    const text = button.textContent || '';
    const token = moneyToken(text);
    if (charge.kind === 'pay') {
      if (token && !agrees(token, charge.value, M.coins)) bag.add('row pay @' + t, text, charge.value, token);
      return;
    }
    if (charge.kind !== 'charge') return;
    if (token && !agrees(token, charge.value, M.coins)) bag.add((button.dataset.act || button.id) + ' @' + t, text, charge.value, token);
    if (button.dataset.act === 'buy') {
      const labeled = /Buy\s+(\d+)/.exec(text);
      const dataCount = Number(button.dataset.count) || 0;
      if (labeled && dataCount > 0 && Number(labeled[1]) !== dataCount) {
        bag.add('buy count @' + t, text, dataCount, labeled[1]);
      }
    }
    const need = /Need\s+(\S+)/.exec(text);
    if (need && state.cash < charge.value && need[1] !== M.coins(charge.value - state.cash)) {
      bag.add('need @' + t, text, charge.value - state.cash, need[1]);
    }
  });
  doc.querySelectorAll('#boats [data-i]').forEach(function (row) {
    if (row.closest('[hidden]')) return;
    const tier = Number(row.dataset.i);
    const owned = state.boats[tier] ? state.boats[tier].owned : 0;
    const title = row.querySelector('h2') ? row.querySelector('h2').textContent : '';
    const shown = /·\s*(\d+)/.exec(title);
    if (owned > 0 && shown && Number(shown[1]) !== owned) bag.add('owned ' + tier + ' @' + t, title, owned, shown[1]);
    const wait = row.querySelector('.wait') ? row.querySelector('.wait').textContent : '';
    if (wait && M.unlocked(state, tier)) {
      const label = M.paybackLabel(M.paybackSeconds(state, tier));
      if (label && wait.indexOf(label) < 0) bag.add('payback ' + tier + ' @' + t, wait, label, wait);
    }
  });
  const crew = doc.querySelector('#crew');
  if (crew && !crew.hidden && /every\s+\d+s/.test(crew.textContent)) {
    const every = /every\s+(\d+)s/.exec(crew.textContent);
    const hired = state.captains.map((row, index) => row && row.hired ? index : -1).filter(index => index >= 0).pop();
    if (every && hired >= 0 && Number(every[1]) !== M.CAPTAINS[hired].every) {
      bag.add('crew every @' + t, crew.textContent, M.CAPTAINS[hired].every, every[1]);
    }
  }
  const regard = doc.querySelector('#ledger, #book, #season-book');
  if (regard && regard.textContent && /Harbour regard is\s+(\d+)/.test(regard.textContent)) {
    const shown = /Harbour regard is\s+(\d+)/.exec(regard.textContent);
    const actual = state.reputation || 0;
    if (shown && Number(shown[1]) !== actual) bag.add('regard @' + t, regard.textContent, actual, shown[1]);
  }
  for (const item of bag.items) if (item.t == null) item.t = t;
}

function actions(page) {
  const game = office(page);
  const M = page.Saltmarsh;
  const state = game.state;
  const found = [];
  page.document.querySelectorAll('button').forEach(function (button) {
    if (!usable(button)) return;
    if (button.dataset.bulk || button.id === 'sound' || button.classList.contains('arc-set-btn')) return;
    if (button.dataset.act === 'away') return;
    const text = button.textContent || '';
    if (button.id === 'row') {
      found.push({ kind: 'row', cost: 0, claim: true, button: button, text: text });
      return;
    }
    if (button.id === 'ask') {
      found.push({ kind: 'hire', cost: 0, claim: true, button: button, text: text });
      return;
    }
    if (button.dataset.act === 'year' || /Begin a new year/.test(text)) {
      found.push({ kind: 'year', cost: 0, claim: true, button: button, text: text });
      return;
    }
    if (button.dataset.act === 'anew') {
      found.push({ kind: 'harbour', cost: 0, claim: true, button: button, text: text });
      return;
    }
    if (button.id === 'finale-go') {
      found.push({ kind: 'sail', cost: 0, claim: true, button: button, text: text });
      return;
    }
    const charge = chargeFor(button, M, state);
    if (!charge || charge.kind !== 'charge') return;
    found.push({
      kind: button.dataset.act || button.id,
      cost: charge.value,
      claim: false,
      button: button,
      text: text,
      affordable: state.cash + 1e-9 >= charge.value
    });
  });
  return found;
}

function cheapest(list) {
  const open = list.filter(row => row.affordable && row.cost >= 0);
  open.sort((a, b) => a.cost - b.cost);
  return open[0] || null;
}

function contextLine(page, list) {
  const game = office(page);
  const M = page.Saltmarsh;
  const state = game.state;
  const next = list.filter(row => !row.claim).sort((a, b) => a.cost - b.cost)[0];
  const goal = page.document.querySelector('#goal');
  const goalText = goal ? goal.textContent : '';
  const nextText = next ? next.text + ' costs ' + M.coins(next.cost) : 'nothing left to buy';
  return 'cash ' + M.coins(state.cash) + ', earning ' + M.coins(M.officeRate(state)) + '/s, next ' + nextText + ', goal ' + goalText;
}

function click(page, action) {
  action.button.click();
}

function advance(page, seconds, hidden) {
  const state = office(page).state;
  const before = state.played || 0;
  page.__advance(Math.round(seconds * 1000));
  if (!hidden) {
    const bumped = (state.played || 0) - before;
    if (seconds > bumped) state.played = before + seconds;
  }
  if (office(page).render) office(page).render();
}

function noteLight(M, state, t, session) {
  if (session.firstLight) return;
  const ids = (M.LIGHTS || []).map(row => row.id);
  if (state.lights && state.lights.glass != null) ids.push('glass');
  for (const id of ids) {
    if ((state.lights && state.lights[id]) >= 2) {
      const spec = (M.LIGHTS || []).filter(row => row.id === id)[0];
      session.firstLight = { t: t, id: id, name: spec ? spec.name : id, how: 'The lighthouse reached its burning stage.' };
      return;
    }
  }
}

function noteYears(M, state, t, session) {
  const year = yearNow(M, state);
  if (!session.year1.endedAt && state.ended && year === 1) {
    session.year1.endedAt = t;
    session.year1.how = watchHow(state, /voyage|grows quiet|season ledger/, 'The office closed the first watch.');
  }
  if (session.year1.endedAt != null && !session.year2.startedAt && year === 2 && !state.ended) {
    session.year2.startedAt = t;
    session.year2.how = watchHow(state, /new year at the office/, 'A new year began at the office.');
  }
  if (session.year2.startedAt != null && !session.year2.endedAt && state.ended && year === 2) {
    session.year2.endedAt = t;
    session.year2.endedHow = watchHow(state, /winter year|season ledger|grows quiet/, 'The second year closed.');
  }
}

function finished(M, state, session) {
  if (session.year2.endedAt != null) return true;
  return session.year1.endedAt != null && !M.beginYear && yearNow(M, state) === 1;
}

function waitSpan(page) {
  const game = office(page);
  const M = page.Saltmarsh;
  const state = game.state;
  const rate = M.officeRate(state);
  const list = actions(page).filter(row => !row.claim && !row.affordable);
  if (!list.length || !(rate > 0)) return 5;
  list.sort((a, b) => a.cost - b.cost);
  const seconds = (list[0].cost - state.cash) / rate;
  let soon = seconds;
  for (let i = 0; i < (state.captains || []).length; i++) {
    if (!state.captains[i] || !state.captains[i].hired || !M.nextIn) continue;
    const next = M.nextIn(state, i, page.__clock());
    if (next > 0 && next < soon) soon = next;
  }
  if (!(soon > 0) || !isFinite(soon)) return 5;
  return Math.max(1, Math.min(120, Math.ceil(soon)));
}

function recordWait(session, t, seconds, line) {
  if (seconds <= IDLE_OVER) return;
  session.idleWaits.push({ t: round(t), seconds: round(seconds), context: line });
}

function round(n) { return Math.round(n * 10) / 10; }

function somethingWaiting(page) {
  const M = page.Saltmarsh;
  const state = office(page).state;
  const list = actions(page);
  const claim = list.filter(row => row.claim && row.kind !== 'row');
  if (claim.length) return { waiting: true, label: claim[0].text };
  const buy = list.filter(row => !row.claim && row.cost > 0 && row.affordable);
  if (buy.length) return { waiting: true, label: buy[0].text };
  if (state.trips < M.HAND_TRIPS && list.some(row => row.kind === 'row')) {
    return { waiting: true, label: list.filter(row => row.kind === 'row')[0].text };
  }
  return { waiting: false, label: '' };
}

function runPolicy(page, policy, seconds, bag) {
  const game = office(page);
  const M = page.Saltmarsh;
  const state = game.state;
  const session = {
    policy: policy,
    seconds: 0,
    firstLight: null,
    year1: { endedAt: null, how: 'Year 1 has not closed inside this sitting.' },
    year2: {
      startedAt: null,
      endedAt: null,
      how: M.beginYear ? 'Year 2 has not started inside this sitting.' : 'This ruleset has no second year.',
      endedHow: null
    },
    idleWaits: [],
    awayReturns: [],
    mismatches: []
  };
  let t = 0;
  let awayAt = 0;
  let awayStep = 0;
  let dry = 0;
  let dryAt = 0;
  let paceDue = 0;
  const stepsMax = 80000;
  game.render();
  scrape(page, bag, 0);
  function pricedLocked(list) {
    const priced = list.filter(row => !row.claim && row.cost > 0);
    return priced.length > 0 && !priced.some(row => row.affordable);
  }
  function closeDry(list) {
    if (dry > IDLE_OVER) recordWait(session, dryAt, dry, contextLine(page, list));
    dry = 0;
  }
  function addDry(list, dt) {
    if (!pricedLocked(list)) {
      closeDry(list);
      return;
    }
    if (dry === 0) dryAt = t;
    dry += dt;
  }
  for (let step = 0; step < stepsMax && t < seconds; step++) {
    noteLight(M, state, t, session);
    noteYears(M, state, t, session);
    if (finished(M, state, session)) break;
    const list = actions(page);
    if (policy === 'idle-away' && t - awayAt >= 45) {
      closeDry(list);
      const away = AWAY_PLAN[awayStep % AWAY_PLAN.length];
      awayStep += 1;
      page.__setVisibility(true);
      advance(page, away, true);
      t += away;
      page.__setVisibility(false);
      page.__flushTimers();
      const back = somethingWaiting(page);
      session.awayReturns.push({
        t: round(t),
        awaySeconds: away,
        waiting: back.waiting,
        waitingLabel: back.label,
        context: contextLine(page, actions(page))
      });
      awayAt = t;
      scrape(page, bag, t);
      continue;
    }
    const buy = cheapest(list);
    const hire = list.filter(row => row.kind === 'hire')[0];
    const year = list.filter(row => row.kind === 'year')[0];
    const sail = list.filter(row => row.kind === 'sail')[0];
    const row = list.filter(row => row.kind === 'row')[0];
    const readySail = sail && M.finaleOffer && M.finaleOffer(state);
    let acted = false;
    if (policy === 'paced-desktop') {
      if (t >= paceDue) {
        paceDue = t + 5;
        if (year) { click(page, year); acted = true; }
        else if (readySail) { click(page, sail); acted = true; }
        else if (game.followGoal()) acted = true;
      }
    } else if (year) { click(page, year); acted = true; }
    else if (readySail) { click(page, sail); acted = true; }
    else if (hire) { click(page, hire); acted = true; }
    else if (buy) { click(page, buy); acted = true; }
    else if (row) { click(page, row); acted = true; }
    if (acted) {
      addDry(list, 1);
      advance(page, 1, false);
      t += 1;
      page.__flushTimers();
      scrape(page, bag, t);
      continue;
    }
    const jump = policy === 'paced-desktop' ? Math.min(5, waitSpan(page)) : waitSpan(page);
    const dt = Math.max(1, Math.min(jump, seconds - t));
    addDry(list, dt);
    advance(page, dt, false);
    t += dt;
  }
  closeDry(actions(page));
  noteLight(M, state, t, session);
  noteYears(M, state, t, session);
  session.seconds = round(t);
  session.owned = (state.boats || []).map(row => row.owned || 0);
  session.lights = state.lights ? Object.assign({}, state.lights) : {};
  session.cash = state.cash;
  session.cashText = M.coins(state.cash);
  if (!M.beginYear && !session.year2.startedAt) {
    session.year2.how = 'This ruleset has no second year.';
  }
  session.mismatches = bag.items.filter(item => item.session === policy);
  return session;
}

function freshGame(root) {
  return loadPage(root, HTML);
}

function audit(options) {
  const root = options.root;
  const seconds = options.seconds;
  const policies = options.policies || POLICIES;
  const sessions = [];
  let mismatchCount = 0;
  const mismatches = [];
  for (const policy of policies) {
    const page = freshGame(root);
    if (!page.Saltmarsh || !page.__saltmarsh) throw new Error('Saltmarsh did not boot from ' + root);
    const bag = makeBag(policy);
    const session = runPolicy(page, policy, seconds, bag);
    sessions.push(session);
    mismatchCount += bag.count;
    mismatches.push(...bag.items);
  }
  const failures = [];
  sessions.forEach(function (session) {
    session.awayReturns.forEach(function (row) {
      if (row.awaySeconds >= AWAY_GAP && !row.waiting) {
        failures.push(session.policy + ' returned at ' + row.t + 's after ' + row.awaySeconds + 's away with nothing to buy or claim');
      }
    });
  });
  if (mismatchCount > 0) failures.push(mismatchCount + ' number' + (mismatchCount === 1 ? '' : 's') + ' in the copy disagreed with the state or the charge');
  return {
    game: 'saltmarsh-shipping',
    source: options.label || path.resolve(root),
    ok: failures.length === 0,
    thresholds: { idleWaitSec: IDLE_OVER, awayReturnSec: AWAY_GAP, mismatches: 0 },
    failures: failures,
    mismatchCount: mismatchCount,
    mismatches: mismatches,
    idleWaits: sessions.reduce((all, session) => all.concat(session.idleWaits.map(row => Object.assign({ policy: session.policy }, row))), []),
    sessions: sessions
  };
}

function selfTest() {
  if (moneyToken('Buy 1 · 2.20M coins') !== '2.20M') throw new Error('money token');
  if (agrees('9', 6, n => String(Math.round(n)))) throw new Error('mismatch detector missed a wrong price');
  if (!agrees('6', 6, n => String(Math.round(n)))) throw new Error('mismatch detector rejected a true price');
  if (tokenValue('1.20K') !== 1200) throw new Error('suffix value');
}

module.exports = { audit, selfTest, moneyToken, agrees, POLICIES, IDLE_OVER, AWAY_GAP };
