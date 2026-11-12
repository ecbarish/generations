'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createDocument } = require('./dom.cjs');

const ROOT = path.resolve(__dirname, '..', '..');
const SURFACES = {
  desktop: { width: 1400, height: 900, actEvery: 1, gapLimit: 60 },
  phone: { width: 390, height: 844, actEvery: 2, gapLimit: 150 }
};
const POLICIES = {
  'greedy-cheapest': { hold: false, buy: 'cheapest' },
  'hold-heavy': { hold: true, buy: 'cheapest' },
  idle: { hold: false, buy: 'frontier' }
};
const JUMP = 1.6;
const MARKS = [60, 180, 300];

function near(a, b) {
  return typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
}

function pairsIn(text) {
  const out = [];
  const re = /(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)(?:\s+\S+){0,4}?\s+to\s+(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)/g;
  let m;
  while ((m = re.exec(text))) out.push([Number(m[1].replace(/,/g, '')), Number(m[2].replace(/,/g, ''))]);
  return out;
}

function clocksIn(text) {
  const out = [];
  const re = /\b(\d{1,2}):(\d{2})\b/g;
  let m;
  while ((m = re.exec(text))) out.push(Number(m[1]) * 60 + Number(m[2]));
  return out;
}

function countsIn(text) {
  const stripped = text.replace(/\b\d{1,2}:\d{2}\b/g, ' ');
  const words = { six: 6, eight: 8, ten: 10, twelve: 12, fifteen: 15 };
  const out = [];
  const re = /\b(six|eight|ten|twelve|fifteen|\d+)\b/gi;
  let m;
  while ((m = re.exec(stripped))) {
    const raw = m[1].toLowerCase();
    out.push(words[raw] != null ? words[raw] : Number(raw));
  }
  return out;
}

function moneyToken(text) {
  const m = /(?:^|[\s·])(\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)(K|M|B|T)?(?=\s*coins\b)/.exec(text);
  if (!m) return '';
  return m[1].replace(/,/g, '') + (m[2] || '');
}

function tokenValue(token) {
  const m = /^(\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)(K|M|B|T)?$/.exec(token || '');
  if (!m) return NaN;
  const n = Number(m[1].replace(/,/g, ''));
  const mul = m[2] === 'K' ? 1e3 : m[2] === 'M' ? 1e6 : m[2] === 'B' ? 1e9 : m[2] === 'T' ? 1e12 : 1;
  return n * mul;
}

function moneyAgrees(token, actual, fmt) {
  if (!token || !Number.isFinite(actual)) return false;
  if (token === fmt(actual)) return true;
  if (/[KMBT]$/.test(token)) return false;
  const shown = tokenValue(token);
  return Number.isFinite(shown) && Math.abs(shown - actual) <= Math.max(0.05, Math.abs(actual) * 1e-4);
}

function labeledQty(text) {
  let m = /^Buy\s+(\d+)/.exec(text);
  if (m) return Number(m[1]);
  m = /^(?:Next|Max)\s+·\s+(\d+)/.exec(text);
  if (m) return Number(m[1]);
  if (/Unroll the Story Mat/.test(text)) return 1;
  if (/mat · \d+ ·/.test(text)) {
    const batch = /mat · (\d+) ·/.exec(text);
    return batch ? Number(batch[1]) : 1;
  }
  if (/mat ·/.test(text)) return 1;
  return 0;
}

function selfTest() {
  if (pairsIn('Tea 0.45 to 0.52. Lanterns 700 to 770.').length !== 2) throw new Error('pair parse');
  if (clocksIn('opens at 15:00, or at 10')[0] !== 900) throw new Error('clock parse');
  if (countsIn('once ten tea stalls, or at 15:00, or at 10 trays').indexOf(15) >= 0) throw new Error('clock leaked into a count');
  if (countsIn('once twelve tables').indexOf(12) < 0) throw new Error('twelve');
  if (moneyToken('Buy 1 · 2.20M coins') !== '2.20M') throw new Error('money token');
  if (moneyAgrees('9', 6, function (n) { return String(n); })) throw new Error('mismatch detector missed a wrong price');
  if (!moneyAgrees('6', 6, function (n) { return String(n); })) throw new Error('mismatch detector rejected a true price');
  if (labeledQty('Unroll the Story Mat · ends the night · 6 coins') !== 1) throw new Error('unroll quantity');
}

function leavesOf(set) {
  const out = [];
  if (!set) return out;
  for (const stall of Object.keys(set)) {
    const row = set[stall];
    if (typeof row === 'number') { out.push({ stall: stall, field: stall, value: row }); continue; }
    if (!row || typeof row !== 'object') continue;
    for (const field of Object.keys(row)) {
      const value = row[field];
      if (typeof value === 'number') out.push({ stall: stall, field: field, value: value });
      else if (Array.isArray(value) && typeof value[0] === 'number') out.push({ stall: stall, field: field, value: value[0] });
    }
  }
  return out;
}

function catalogueValue(M, leaf) {
  if (leaf.field === 'offlineRate') return M.OFFLINE_RATE;
  if (leaf.field === 'offlineCap') return M.OFFLINE_CAP;
  const stall = M.STALLS.filter(function (s) { return s.id === leaf.stall; })[0];
  if (!stall) return null;
  if (leaf.field === 'milestones') return M.STALL_MILESTONES[0];
  if (leaf.field === 'unlockAt') return stall.unlockAt || M.UNLOCK_AT;
  return stall[leaf.field];
}

function auditPatchLine(M, line, set, where, bag) {
  const leaves = leavesOf(set);
  pairsIn(line).forEach(function (pair) {
    const hit = leaves.filter(function (leaf) {
      return near(leaf.value, pair[1]) && near(catalogueValue(M, leaf), pair[0]);
    })[0];
    if (!hit) bag.add(where, line, 'no matching rule value', pair[0] + ' to ' + pair[1]);
    else if (hit.field === 'base') {
      const charged = firstCopyCharge(M, where, hit);
      if (charged && (!near(charged[0], pair[0]) || !near(charged[1], pair[1]))) {
        bag.add(where, line, Math.round(charged[0]) + ' to ' + Math.round(charged[1]), pair[0] + ' to ' + pair[1]);
      }
    }
  });
  const instead = /(\d+(?:\.\d+)?)\s+[^.]*?\binstead of\s+(\d+(?:\.\d+)?)/g;
  let m;
  while ((m = instead.exec(line))) {
    const shown = Number(m[1]);
    const old = Number(m[2]);
    const hit = leaves.some(function (leaf) {
      return near(leaf.value, shown) && near(catalogueValue(M, leaf), old);
    });
    if (!hit) bag.add(where, line, 'no matching rule value', shown + ' instead of ' + old);
  }
  const percent = /(?:about\s+)?(\d+(?:\.\d+)?)%\s+(more|less)/g;
  while ((m = percent.exec(line))) {
    const pct = Number(m[1]);
    const dir = m[2];
    const hit = leaves.some(function (leaf) {
      const cat = catalogueValue(M, leaf);
      if (leaf.field === 'growth') return dir === 'more' && Math.abs((leaf.value - 1) * 100 - pct) < 0.6;
      if (!(cat > 0) || !(leaf.value > 0)) return false;
      const expect = dir === 'more' ? 1 + pct / 100 : 1 - pct / 100;
      return Math.abs(leaf.value / cat - expect) < 0.02;
    });
    if (!hit) bag.add(where, line, 'no matching rule value', pct + '% ' + dir);
  }
  const insteadPct = /instead of\s+(\d+(?:\.\d+)?)%/g;
  while ((m = insteadPct.exec(line))) {
    const pct = Number(m[1]);
    const hit = leaves.some(function (leaf) {
      const cat = catalogueValue(M, leaf);
      return leaf.field === 'growth' && typeof cat === 'number' && Math.abs((cat - 1) * 100 - pct) < 0.6;
    });
    if (!hit) bag.add(where, line, 'no matching catalogue growth', 'instead of ' + pct + '%');
  }
}

function auditUnlockCopy(M, bag) {
  const fresh = M.fresh();
  const clock = M.matSecondsLeft(fresh);
  M.STALLS.forEach(function (stall, i) {
    if (!stall.next) return;
    const clocks = clocksIn(stall.next);
    const counts = countsIn(stall.next);
    const need = M.unlockNeed(fresh, i + 1);
    if (counts.indexOf(need) < 0) bag.add('unlock ' + stall.id, stall.next, String(need), 'counts ' + counts.join(', '));
    if (i + 1 === M.STALLS.length - 1 && clocks.indexOf(clock) < 0) {
      bag.add('unlock ' + stall.id, stall.next, clock + 's', 'clocks ' + clocks.join(', '));
    }
  });
  const gate = M.matGateLine(fresh);
  const trays = /at (\d+) incense trays/.exec(gate);
  const gateClock = clocksIn(gate)[0];
  const matNeed = M.unlockNeed(fresh, M.STALLS.length - 1);
  if (!trays || Number(trays[1]) !== matNeed) bag.add('mat gate', gate, String(matNeed), trays ? trays[1] : 'missing');
  if (gateClock !== clock) bag.add('mat gate', gate, clock + 's', String(gateClock));
  M.OMENS.forEach(function (omen) { auditPatchLine(M, omen.line, omen.set, 'omen ' + omen.id, bag); });
  M.CHARMS.forEach(function (charm) { auditPatchLine(M, charm.line, charm.set, 'charm ' + charm.id, bag); });
}

function makeBag(session) {
  return {
    count: 0,
    seen: {},
    items: [],
    add: function (where, text, rule, shown) {
      const key = String(where).replace(/ @\d+/g, '') + '|' + rule + '|' + shown;
      if (this.seen[key]) { this.seen[key]++; return; }
      this.seen[key] = 1;
      this.count++;
      if (this.items.length < 30) {
        this.items.push({
          session: session || 'catalogue',
          where: where,
          text: String(text || '').replace(/\s+/g, ' ').slice(0, 220),
          rule: String(rule),
          shown: String(shown)
        });
      }
    }
  };
}

function loadPage() {
  const html = fs.readFileSync(path.join(ROOT, 'games/night-market/index.html'), 'utf8');
  const doc = createDocument(html);
  let clock = 1700000000000;
  function ClockDate() {
    const args = arguments;
    if (new.target) {
      if (!args.length) return new Date(clock);
      return new Date(...args);
    }
    return Date();
  }
  ClockDate.now = function () { return clock; };
  ClockDate.parse = Date.parse;
  ClockDate.UTC = Date.UTC;
  ClockDate.prototype = Date.prototype;
  const storage = new Map();
  const localStorage = {
    getItem: function (k) { return storage.has(k) ? storage.get(k) : null; },
    setItem: function (k, v) { storage.set(k, String(v)); },
    removeItem: function (k) { storage.delete(k); },
    key: function (i) { return Array.from(storage.keys())[i] || null; },
    get length() { return storage.size; }
  };
  const context = {
    console: console,
    Date: ClockDate,
    setInterval: function () { return 1; },
    clearInterval: function () {},
    setTimeout: function () { return 1; },
    clearTimeout: function () {},
    document: doc,
    localStorage: localStorage,
    location: { search: '', hash: '', href: 'http://localhost/games/night-market/index.html', reload: function () {} },
    confirm: function () { return false; },
    innerWidth: 1400,
    innerHeight: 900,
    scrollY: 0,
    scrollTo: function () {},
    addEventListener: function () {},
    removeEventListener: function () {},
    matchMedia: function (query) {
      const w = context.innerWidth;
      const h = context.innerHeight;
      const maxW = /max-width:\s*(\d+)px/.exec(query);
      const minW = /min-width:\s*(\d+)px/.exec(query);
      const maxH = /max-height:\s*(\d+)px/.exec(query);
      let matches = false;
      if (maxW && maxH) matches = w <= Number(maxW[1]) && h <= Number(maxH[1]);
      else if (maxW && minW) matches = w <= Number(maxW[1]) && w >= Number(minW[1]);
      else if (maxW) matches = w <= Number(maxW[1]);
      else if (minW) matches = w >= Number(minW[1]);
      return { matches: matches, media: query, addListener: function () {}, removeListener: function () {}, addEventListener: function () {}, removeEventListener: function () {} };
    }
  };
  context.window = context;
  context.self = context;
  context.globalThis = context;
  vm.createContext(context);
  for (const file of ['shared/engine.js', 'shared/idle-core.js', 'games/night-market/model.js', 'games/night-market/game.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  }
  context.__setClock = function (ms) { clock = ms; };
  context.__advance = function (ms) { clock += ms; };
  context.__clock = function () { return clock; };
  return context;
}

function adopt(state, next) {
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, next);
}

function handIndex(M, state) {
  let last = -1;
  for (let i = 0; i < M.STALLS.length; i++) {
    if (!M.unlocked(state, i)) continue;
    if (!state.stalls[i].hired) return i;
    last = i;
  }
  return last;
}

function pour(M, state, times, ledger) {
  const i = handIndex(M, state);
  if (i < 0) return;
  for (let n = 0; n < times; n++) {
    if (M.canHire(state, i)) { M.hire(state, i); return; }
    const before = state.lifetime;
    const result = M.handSell(state, i);
    if (!result.ok) return;
    if (ledger) ledger.hold += state.lifetime - before;
    if (M.canHire(state, i)) { M.hire(state, i); return; }
  }
}

function resetDom(doc) {
  doc.querySelectorAll('#stalls [data-i]').forEach(function (el) { el.remove(); });
  const choices = doc.querySelector('#pick-choices');
  if (choices) {
    choices.dataset.sig = '';
    choices.replaceChildren();
  }
  const crowd = doc.querySelector('#crowd-choices');
  if (crowd) {
    crowd.dataset.sig = '';
    crowd.replaceChildren();
  }
}

function needsHands(M, state) {
  for (let i = 0; i < M.STALLS.length; i++) {
    if (!M.unlocked(state, i)) break;
    if (!state.stalls[i].hired) return true;
  }
  return false;
}

function frontierIndex(M, state) {
  const mat = M.STALLS.length - 1;
  if (M.terminalUnroll(state)) return mat;
  for (let i = 0; i < mat; i++) {
    if (!M.unlocked(state, i)) break;
    if (!state.stalls[i].hired) return -1;
    if (state.stalls[i].owned < M.unlockNeed(state, i + 1)) return i;
  }
  if (M.unlocked(state, mat) && state.stalls[mat].owned === 0) return mat;
  return -1;
}

function isMeaningful(M, state, i) {
  if (!M.unlocked(state, i) || !state.stalls[i].hired) return false;
  const price = M.cost(i, state.stalls[i].owned, 1, state);
  if (!(price > 0) || !isFinite(price)) return false;
  if (i === frontierIndex(M, state)) return true;
  if (i === M.STALLS.length - 1 && state.stalls[i].owned === 0) return true;
  return M.paybackSeconds(state, i, 1) <= (M.PAYBACK_CAP || 450);
}

function affordable(M, state) {
  const found = [];
  for (let i = 0; i < M.STALLS.length; i++) {
    if (!isMeaningful(M, state, i)) continue;
    const price = M.cost(i, state.stalls[i].owned, 1, state);
    if (price <= state.cash + 0.001) found.push({ i: i, price: price });
  }
  found.sort(function (a, b) { return a.price - b.price || a.i - b.i; });
  return found;
}

function noteJump(M, state, i, jumps, at) {
  const owned = state.stalls[i].owned;
  const unit = M.cost(i, owned, 1, state);
  const prev = state._unit && state._unit[i];
  if (prev > 0 && unit / prev > JUMP) {
    jumps.push({
      at: at,
      stall: M.STALLS[i].id,
      from: prev,
      to: unit,
      ratio: Math.round((unit / prev) * 1000) / 1000
    });
  }
  if (!state._unit) state._unit = {};
  state._unit[i] = unit;
}

function answer(M, state) {
  const offer = state.night && state.night.offer;
  if (!offer || !offer.options || !offer.options.length) return null;
  if (offer.kind === 'omen') return M.choose(state, 0);
  M.skipOffer(state);
  return 'skip';
}

function firstCopyCharge(M, where, leaf) {
  const parts = String(where).split(' ');
  const kind = parts[0];
  const id = parts.slice(1).join(' ');
  const i = M.STALLS.findIndex(function (s) { return s.id === leaf.stall; });
  if (i < 0 || (kind !== 'omen' && kind !== 'charm')) return null;
  const fresh = M.fresh();
  const before = M.cost(i, 0, 1, fresh);
  if (kind === 'omen') fresh.night.omen = id;
  else fresh.night.charms.push(id);
  return [before, M.cost(i, 0, 1, fresh)];
}

function clockMatCharge(M, state) {
  const mat = M.STALLS.length - 1;
  const probe = M.fresh();
  probe.stalls = state.stalls.map(function (s) {
    return { owned: s.owned, serves: s.serves, hired: !!s.hired };
  });
  probe.stalls[mat].owned = 0;
  probe.night.wallMs = 900 * 1000;
  probe.night.matShown = 0;
  probe.night.matOffer = 0;
  probe.night.earlyQuote = 0;
  probe.night.omen = null;
  probe.night.charms = [];
  return M.cost(mat, 0, 1, probe);
}

function auditChoice(M, state, kind, id, text, bag, at) {
  if (kind === 'omen') {
    const row = M.omenById(id);
    if (row && text !== row.line) bag.add('choice ' + id + ' @' + at, text, row.line, text);
    return;
  }
  if (kind !== 'charm') return;
  const row = M.charmById(id);
  if (!row || !row.set) return;
  const stallId = row.stall;
  const index = M.STALLS.findIndex(function (s) { return s.id === stallId; });
  if (index < 0) return;
  const owned = state.stalls[index] ? state.stalls[index].owned : 0;
  const fmtMoney = globalFmt;
  const pair = /([\d,.]+(?:K|M|B|T)?)\s+to\s+([\d,.]+(?:K|M|B|T)?)/.exec(text);
  if (pair && row.set[stallId] && row.set[stallId].base != null) {
    const before = M.cost(index, owned, 1, state);
    state.night.charms.push(id);
    const after = M.cost(index, owned, 1, state);
    state.night.charms.pop();
    if (!moneyAgrees(pair[1].replace(/,/g, ''), before, fmtMoney) || !moneyAgrees(pair[2].replace(/,/g, ''), after, fmtMoney)) {
      bag.add('choice ' + id + ' @' + at, text, fmtMoney(before) + ' to ' + fmtMoney(after), pair[1] + ' to ' + pair[2]);
    }
  }
  const opens = /opens at\s+(\d+)/.exec(text);
  if (opens) {
    state.night.charms.push(id);
    const need = M.unlockNeed(state, index);
    state.night.charms.pop();
    if (Number(opens[1]) !== need) bag.add('choice ' + id + ' @' + at, text, String(need), opens[1]);
  }
  const doubles = /doubles at\s+(\d+)\s+instead of\s+(\d+)/.exec(text);
  if (doubles) {
    const setAt = row.set[stallId] && row.set[stallId].milestones && row.set[stallId].milestones[0];
    if (Number(doubles[1]) !== setAt || Number(doubles[2]) !== M.STALL_MILESTONES[0]) {
      bag.add('choice ' + id + ' @' + at, text, setAt + ' instead of ' + M.STALL_MILESTONES[0], doubles[1] + ' instead of ' + doubles[2]);
    }
  }
  const pluses = [];
  const plusRe = /\+(\d+)%/g;
  let plus;
  while ((plus = plusRe.exec(text))) pluses.push(Number(plus[1]));
  if (pluses.length && row.set[stallId] && row.set[stallId].rate != null) {
    const beforeProd = M.production(state, index);
    const beforeInc = M.income(state);
    state.night.charms.push(id);
    const afterProd = M.production(state, index);
    const afterInc = M.income(state);
    state.night.charms.pop();
    if (!(beforeProd > 0)) return;
    const local = Math.round((afterProd / beforeProd - 1) * 100);
    const night = beforeInc > 0 ? Math.round(((afterInc - beforeInc) / beforeInc) * 100) : local;
    const shownLocal = pluses[pluses.length - 1];
    const shownNight = pluses.length > 1 ? pluses[0] : null;
    if (shownLocal !== local || (shownNight != null && shownNight !== night)) {
      bag.add('choice ' + id + ' @' + at, text, (shownNight == null ? '' : night + '% and ') + local + '%', pluses.join('% ') + '%');
    }
  }
}

let globalFmt = function (n) { return String(n); };

function scrape(doc, M, state, bag, at) {
  const fmt = globalFmt;
  const rateText = doc.querySelector('#rate') ? doc.querySelector('#rate').textContent : '';
  const rateTok = /([\d.]+(?:K|M|B|T)?)\s+coins a second/.exec(rateText);
  const income = M.income(state);
  if (!/The night has ended/.test(rateText)) {
    if (income > 0) {
      if (!rateTok || rateTok[1] !== fmt(income)) bag.add('rate @' + at, rateText, fmt(income), rateTok ? rateTok[1] : 'missing');
    } else if (rateTok) bag.add('rate @' + at, rateText, 'nothing earning', rateTok[1]);
  }
  const goal = doc.querySelector('#goal') ? doc.querySelector('#goal').textContent : '';
  const goalCost = /It costs\s+([\d,.]+(?:K|M|B|T)?)\./.exec(goal);
  if (goalCost) {
    const mat = M.STALLS.length - 1;
    const actual = M.cost(mat, state.stalls[mat].owned, 1, state);
    if (!moneyAgrees(goalCost[1].replace(/\.$/, ''), actual, fmt)) bag.add('goal @' + at, goal, fmt(actual), goalCost[1]);
  }
  const help = doc.querySelector('#bulk-help') ? doc.querySelector('#bulk-help').textContent : '';
  const best = /Best payback: ([^,]+), ([^.]+)\./.exec(help);
  if (best) {
    const i = M.STALLS.findIndex(function (s) { return s.name === best[1]; });
    const label = i >= 0 ? M.paybackLabel(M.paybackSeconds(state, i, 1)) : '';
    if (!label || label !== best[2]) bag.add('bulk help @' + at, help, label || 'none', best[2]);
  }
  const rows = doc.querySelectorAll('#stalls [data-i]');
  rows.forEach(function (li) {
    const i = Number(li.dataset.i);
    const owned = state.stalls[i].owned;
    const open = M.unlocked(state, i);
    const buy = li.querySelector('[data-act="buy"]');
    const text = buy ? buy.textContent : '';
    const qty = labeledQty(text);
    const token = moneyToken(text);
    if (qty > 0 && token && !moneyAgrees(token, M.cost(i, owned, qty, state), fmt)) {
      bag.add('buy ' + M.STALLS[i].id + ' @' + at, text, fmt(M.cost(i, owned, qty, state)), token);
    }
    const dataCount = buy ? parseInt(buy.dataset.count, 10) : 0;
    if (dataCount > 0 && qty > 0 && dataCount !== qty) bag.add('buy count ' + M.STALLS[i].id + ' @' + at, text, String(qty), String(dataCount));
    const need = state.stalls[i].hired && li.querySelector('.need') ? li.querySelector('.need').textContent : '';
    const needMoney = /Need\s+(\S+)\s+more/.exec(need);
    const asking = qty > 0 ? qty : 1;
    const rowPrice = M.cost(i, owned, asking, state);
    if (needMoney) {
      const gap = Math.ceil(rowPrice - state.cash - 1e-9);
      if (!(gap > 0) || !moneyAgrees(needMoney[1], gap, fmt)) bag.add('need ' + M.STALLS[i].id + ' @' + at, need, fmt(Math.max(0, gap)), needMoney[1]);
    }
    const namedPrice = /Next\s+(.+?)\s+·\s+([0-9][0-9.,]*(?:K|M|B|T)?)/.exec(need);
    if (namedPrice) {
      if (namedPrice[1] !== M.STALLS[i].name) bag.add('need target ' + M.STALLS[i].id + ' @' + at, need, M.STALLS[i].name, namedPrice[1]);
      if (!moneyAgrees(namedPrice[2], rowPrice, fmt)) bag.add('need price ' + M.STALLS[i].id + ' @' + at, need, fmt(rowPrice), namedPrice[2]);
    }
    const opens = /opens at\s+(\d+)/.exec(need);
    if (opens && i + 1 < M.STALLS.length && Number(opens[1]) !== M.unlockNeed(state, i + 1)) {
      bag.add('need unlock ' + M.STALLS[i].id + ' @' + at, need, String(M.unlockNeed(state, i + 1)), opens[1]);
    }
    const wait = li.querySelector('.wait') ? li.querySelector('.wait').textContent : '';
    if (!open && i === M.STALLS.length - 1) {
      const serveText = (li.querySelector('[data-act="serve"]') || {}).textContent || '';
      const about = /about\s+([0-9][0-9.,]*(?:K|M|B|T)?)/.exec(serveText);
      const shown = about ? about[1] : moneyToken(serveText);
      const openPrice = clockMatCharge(M, state);
      const early = /early buy/i.test(serveText);
      if (shown && /then\b/.test(serveText)) {
        if (!moneyAgrees(shown, openPrice, fmt)) bag.add('locked mat then @' + at, serveText, fmt(openPrice), shown);
      } else if (shown && early) {
        if (!moneyAgrees(shown, M.cost(i, 0, 1, state), fmt)) bag.add('locked mat early @' + at, serveText, fmt(M.cost(i, 0, 1, state)), shown);
      } else if (shown) {
        bag.add('locked mat headline @' + at, serveText, 'labeled then or early buy', shown);
      } else if (!/then\b/.test(serveText)) {
        bag.add('locked mat @' + at, serveText, 'the price when it opens', 'missing');
      }
    }
    if (!open && i > 0) {
      const trays = /at (\d+) incense trays/.exec(wait);
      if (trays && Number(trays[1]) !== M.unlockNeed(state, i)) bag.add('shutter ' + M.STALLS[i].id + ' @' + at, wait, String(M.unlockNeed(state, i)), trays[1]);
      else if (!trays) {
        const atCount = / at (\d+)(?!:)/.exec(wait);
        if (atCount && Number(atCount[1]) !== M.unlockNeed(state, i)) bag.add('shutter ' + M.STALLS[i].id + ' @' + at, wait, String(M.unlockNeed(state, i)), atCount[1]);
      }
      if (/Story Mat opens at|whichever comes first/.test(wait)) {
        const stated = clocksIn(wait)[0];
        const rule = M.matSecondsLeft(M.fresh());
        if (stated !== rule) bag.add('shutter clock @' + at, wait, rule + 's', String(stated));
        const preview = moneyToken(wait);
        if (preview && !moneyAgrees(preview, M.matLivePrice(state), fmt)) bag.add('shutter price @' + at, wait, fmt(M.matLivePrice(state)), preview);
      }
    }
    if (open && state.stalls[i].hired) {
      const facts = li.querySelector('.facts') ? li.querySelector('.facts').textContent : '';
      const factTok = /([\d.]+(?:K|M|B|T)?)\s+coins a second/.exec(facts);
      const produced = M.production(state, i);
      if (produced > 0 && (!factTok || factTok[1] !== fmt(produced))) bag.add('facts ' + M.STALLS[i].id + ' @' + at, facts, fmt(produced), factTok ? factTok[1] : 'missing');
      const seconds = M.paybackSeconds(state, i, qty > 0 ? qty : 1);
      const label = M.paybackLabel(seconds);
      const times = wait.match(/\d+d(?: \d+h)?|\d+h(?: \d+m)?|\d+m \d+s|\d+m(?! )|\d+s/g) || [];
      if (label && times.indexOf(label) < 0) bag.add('payback ' + M.STALLS[i].id + ' @' + at, wait, label, times.join(' ') || 'missing');
      if (!label && times.length) bag.add('payback ' + M.STALLS[i].id + ' @' + at, wait, 'no payback', times.join(' '));
    }
  });
  const offer = state.night && state.night.offer;
  if (offer && offer.options) {
    const buttons = doc.querySelectorAll('#pick-choices button');
    offer.options.forEach(function (id, index) {
      const button = buttons[index];
      if (!button) return;
      auditChoice(M, state, offer.kind, id, button.textContent, bag, at);
    });
  }
  const lead = doc.querySelector('#crowd-lead') ? doc.querySelector('#crowd-lead').textContent : '';
  const leadPrice = /It will cost\s+([\d,.]+(?:K|M|B|T)?)\./.exec(lead);
  if (leadPrice) {
    const mat = M.STALLS.length - 1;
    const actual = M.cost(mat, state.stalls[mat].owned, 1, state);
    if (!moneyAgrees(leadPrice[1].replace(/,/g, ''), actual, fmt)) bag.add('crowd @' + at, lead, fmt(actual), leadPrice[1]);
  }
  doc.querySelectorAll('#crowd-choices button').forEach(function (button) {
    if (button.dataset.act !== 'mat-now') return;
    const shown = /Unroll\s+([\d.]+(?:K|M|B|T)?)/.exec(button.textContent);
    if (!shown) return;
    const mat = M.STALLS.length - 1;
    const actual = M.cost(mat, state.stalls[mat].owned, 1, state);
    if (!moneyAgrees(shown[1], actual, fmt)) bag.add('crowd unroll @' + at, button.textContent, fmt(actual), shown[1]);
    if (button.dataset.quote && shown[1] !== fmt(Number(button.dataset.quote))) {
      bag.add('crowd unroll quote @' + at, button.textContent, fmt(Number(button.dataset.quote)), shown[1]);
    }
  });
  const finale = doc.querySelector('#finale');
  const summary = doc.querySelector('#finale-summary');
  if (finale && !finale.hidden && summary) {
    const stated = /Story Mat will cost\s+([\d,.]+(?:K|M|B|T)?)/.exec(summary.textContent);
    if (stated) {
      const charge = clockMatCharge(M, state);
      if (!moneyAgrees(stated[1].replace(/,/g, ''), charge, fmt)) {
        bag.add('dawn mat @' + at, summary.textContent, fmt(charge), stated[1]);
      }
    }
    const earnedTok = /([0-9][0-9.,]*(?:K|M|B|T)?)\s+coins earned tonight/.exec(summary.textContent);
    const played = state.stalls.some(function (s) { return s.owned > 0; });
    const earnedValue = earnedTok ? tokenValue(earnedTok[1].replace(/,/g, '')) : 0;
    if (played && !(earnedValue > 0)) bag.add('night total @' + at, summary.textContent, 'more than 0', earnedTok ? earnedTok[1] : 'missing');
  }
}

function runSession(env, surfaceName, policyName, seconds) {
  const M = env.NightMarket;
  const page = env.__nightMarket;
  const state = page.state;
  const surface = SURFACES[surfaceName];
  const policy = POLICIES[policyName];
  env.innerWidth = surface.width;
  env.innerHeight = surface.height;
  if (env.document.documentElement) {
    env.document.documentElement.clientWidth = surface.width;
    env.document.documentElement.clientHeight = surface.height;
  }
  adopt(state, M.fresh());
  resetDom(env.document);
  page.render();
  const bag = makeBag(surfaceName + ' ' + policyName);
  const jumps = [];
  const buys = {};
  const ledger = { hold: 0, acc: 0 };
  scrape(env.document, M, state, bag, 0);
  const omenId = answer(M, state);
  const shares = {};
  let gap = 0;
  let longest = 0;
  let gapStart = 0;
  let gapAt = 0;
  let storyMatAt = null;
  let t = 0;
  for (t = 1; t <= seconds; t++) {
    env.__advance(1000);
    if (M.prepareMat) M.prepareMat(state);
    if (!(M.dawnDue(state) && !(state.night && state.night.kept))) {
      if (policy.hold) {
        const step = M.holdCredit(1, ledger.acc);
        ledger.acc = step.acc;
        pour(M, state, step.pours, ledger);
      } else if (t % surface.actEvery === 0 && needsHands(M, state)) pour(M, state, 1, null);
      M.addCash(state, M.income(state));
      const choices = affordable(M, state);
      if (choices.length) gap = 0;
      else {
        if (gap === 0) gapStart = t;
        gap++;
        if (gap > longest) { longest = gap; gapAt = gapStart; }
      }
      if (t % surface.actEvery === 0) {
        let pick = null;
        if (policy.buy === 'frontier') {
          const want = frontierIndex(M, state);
          pick = choices.filter(function (c) { return c.i === want; })[0] || null;
        } else pick = choices[0] || null;
        if (pick) {
          noteJump(M, state, pick.i, jumps, t);
          const bought = M.buy(state, pick.i, 1);
          if (bought.ok) {
            const id = M.STALLS[pick.i].id;
            buys[id] = (buys[id] || 0) + 1;
          }
        }
      }
    }
    page.render();
    scrape(env.document, M, state, bag, t);
    answer(M, state);
    if (MARKS.indexOf(t) >= 0) shares[String(t)] = state.lifetime > 0 ? ledger.hold / state.lifetime : 0;
    const mat = state.stalls[M.STALLS.length - 1];
    if (storyMatAt == null && mat && mat.owned >= 1) storyMatAt = t;
    if (storyMatAt != null) break;
  }
  return {
    surface: surfaceName,
    policy: policyName,
    omen: omenId && M.omenById(omenId) ? M.omenById(omenId).name : null,
    seconds: t > seconds ? seconds : t,
    storyMatAt: storyMatAt,
    holdingShare: {
      '60': shares['60'] == null ? null : roundShare(shares['60']),
      '180': shares['180'] == null ? null : roundShare(shares['180']),
      '300': shares['300'] == null ? null : roundShare(shares['300'])
    },
    longestGapSec: longest,
    gapStart: longest ? gapAt : null,
    gapLimit: surface.gapLimit,
    priceJumps: jumps.slice(0, 20),
    priceJumpCount: jumps.length,
    buys: buys,
    mismatchCount: bag.count,
    mismatches: bag.items
  };
}

function roundShare(n) { return Math.round(n * 1000) / 1000; }

function markdown(report) {
  const lines = [];
  lines.push('# Night Market new-player audit');
  lines.push('');
  lines.push(report.ok ? 'Pass. Every scripted session stayed inside the gap limits, and every checked price and condition matched the rule. A same-item price jump over 1.6x is listed below and does not fail this bar.' : 'Fail. A gap or a displayed value broke the bar.');
  lines.push('');
  if (report.failures.length) {
    lines.push('Failures:');
    report.failures.forEach(function (f) { lines.push('- ' + f); });
    lines.push('');
  }
  lines.push('Sessions:');
  report.sessions.forEach(function (s) {
    const mat = s.storyMatAt == null ? 'not reached' : s.storyMatAt + 's';
    lines.push('- ' + s.surface + ' ' + s.policy + ': longest gap ' + s.longestGapSec + 's (limit ' + s.gapLimit + 's), first Story Mat ' + mat + ', holding share at 1/3/5 min ' + fmtShare(s.holdingShare) + ', price jumps over 1.6x: ' + s.priceJumpCount + '.');
  });
  lines.push('');
  const jumps = report.sessions.reduce(function (n, s) { return n.concat(s.priceJumps.map(function (j) { return s.surface + ' ' + s.policy + ' ' + j.stall + ' ' + j.ratio + 'x at ' + j.at + 's'; })); }, []);
  lines.push(jumps.length ? 'Price jumps over 1.6x: ' + jumps.slice(0, 12).join('; ') + (jumps.length > 12 ? '; …' : '') + '.' : 'No consecutive purchase of the same item jumped more than 1.6x.');
  lines.push('');
  lines.push('Mismatches: ' + report.mismatchCount + '.');
  report.mismatches.slice(0, 12).forEach(function (m) {
    lines.push('- ' + m.session + ' ' + m.where + ': showed ' + m.shown + ', rule ' + m.rule + '. ' + m.text);
  });
  if (report.mismatchCount > 12) lines.push('- … ' + (report.mismatchCount - 12) + ' more.');
  lines.push('');
  return lines.join('\n');
}

function fmtShare(share) {
  return [share['60'], share['180'], share['300']].map(function (n) { return n == null ? 'n/a' : Math.round(n * 100) + '%'; }).join(' / ');
}

function parseArgs(argv) {
  const out = { check: false, seconds: 45 * 60, out: '', json: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') out.check = true;
    else if (arg === '--json') out.json = true;
    else if (arg === '--seconds') out.seconds = Number(argv[++i]);
    else if (arg === '--out') out.out = argv[++i];
    else throw new Error('Unknown argument ' + arg);
  }
  if (!(out.seconds > 0)) throw new Error('--seconds needs a positive number');
  return out;
}

function main() {
  selfTest();
  const args = parseArgs(process.argv.slice(2));
  const env = loadPage();
  globalFmt = env.Arcade.fmt;
  const bag = makeBag('catalogue');
  auditUnlockCopy(env.NightMarket, bag);
  const sessions = [];
  for (const surface of Object.keys(SURFACES)) {
    for (const policy of Object.keys(POLICIES)) {
      sessions.push(runSession(env, surface, policy, args.seconds));
    }
  }
  const mismatches = bag.items.concat(sessions.reduce(function (all, s) { return all.concat(s.mismatches); }, []));
  const mismatchCount = bag.count + sessions.reduce(function (n, s) { return n + s.mismatchCount; }, 0);
  const failures = [];
  sessions.forEach(function (s) {
    if (s.longestGapSec > s.gapLimit) failures.push(s.surface + ' ' + s.policy + ' gap ' + s.longestGapSec + 's exceeds ' + s.gapLimit + 's');
  });
  if (mismatchCount > 0) failures.push(mismatchCount + ' displayed price or condition mismatch' + (mismatchCount === 1 ? '' : 'es'));
  const report = {
    ok: failures.length === 0,
    thresholds: { desktopGapSec: 60, phoneGapSec: 150, mismatches: 0 },
    failures: failures,
    mismatchCount: mismatchCount,
    mismatches: mismatches.slice(0, 40),
    sessions: sessions.map(function (s) {
      return {
        surface: s.surface,
        policy: s.policy,
        omen: s.omen,
        seconds: s.seconds,
        storyMatAt: s.storyMatAt,
        holdingShare: s.holdingShare,
        longestGapSec: s.longestGapSec,
        gapStart: s.gapStart,
        gapLimit: s.gapLimit,
        priceJumpCount: s.priceJumpCount,
        priceJumps: s.priceJumps,
        buys: s.buys
      };
    })
  };
  const md = markdown(report);
  if (args.out) {
    fs.mkdirSync(args.out, { recursive: true });
    fs.writeFileSync(path.join(args.out, 'report.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(args.out, 'report.md'), md);
  }
  if (args.check) {
    const gaps = sessions.map(function (s) { return s.surface + ' ' + s.policy + ' ' + s.longestGapSec + 's'; }).join(', ');
    const jumpCount = sessions.reduce(function (n, s) { return n + s.priceJumpCount; }, 0);
    console.log((report.ok ? 'PASS' : 'FAIL') + ' nm-audit: ' + gaps + ', mismatches ' + mismatchCount + ', price jumps ' + jumpCount);
    if (!report.ok) failures.forEach(function (f) { console.log('  ' + f); });
    process.exit(report.ok ? 0 : 1);
  }
  if (args.json) console.log(JSON.stringify(report, null, 2));
  else console.log(md);
}

main();
