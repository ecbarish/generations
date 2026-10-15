/* Checks for games/lantern-bowl/dilemma-pick.js (LB-G14). Plain Node, no packages:  node tests/lantern-bowl-dilemma-pick.cjs
   It loads the real games/lantern-bowl/dilemmas.json and season.json, and never changes them. The inputs it passes to the picker
   are deep-frozen, so any write to cards, used or state would throw. Seeded, so it prints the same thing on every run.
   Exits 1 if a check fails. */
'use strict';
const fs = require('fs'), path = require('path');
const DATA = path.join(__dirname, '..', 'games', 'lantern-bowl');
const read = name => fs.readFileSync(path.join(DATA, name), 'utf8');
const P = require(path.join(DATA, 'dilemma-pick.js'));
const before = { dilemmas: read('dilemmas.json'), season: read('season.json') };
const deepFreeze = v => { if (v && typeof v === 'object') { Object.values(v).forEach(deepFreeze); Object.freeze(v); } return v; };
const cards = deepFreeze(JSON.parse(before.dilemmas).cards), season = JSON.parse(before.season);
const WHEN = ['afterWin', 'afterLoss', 'bye', 'beforeGame'], SCORED = ['morale', 'points', 'fans', 'owner'];
const byId = new Map(cards.map(c => [c.id, c]));
const SEASONS = 300, BASE_SEED = 0x1b14d11a;

let passed = 0, failed = 0;
const check = (name, ok, detail) => { if (ok) passed++; else failed++; console.log((ok ? 'PASS' : 'FAIL') + ' - ' + name + (detail ? ' (' + detail + ')' : '')); };
const throws = (fn, type) => { try { fn(); } catch (e) { return !type || e instanceof type; } return false; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---- one ten-week season as a caller would run it: a card before each game, and one after it (a win or a loss) ----
function playSeason(seed, afterOnly) {
  const rng = P.seeded(seed), results = P.seeded(seed ^ 0x5bd1e995), used = [], shown = [], nulls = { afterWin: 0, afterLoss: 0, beforeGame: 0 };
  for (let week = 0; week < season.weeks; week++) {
    const slots = afterOnly ? [] : ['beforeGame'];
    slots.push(results() < .5 ? 'afterWin' : 'afterLoss');
    for (const when of slots) {
      const card = P.pick(cards, { when, used, rng });
      if (card) { used.push(card.id); shown.push({ week, when, card }); } else nulls[when]++;
    }
  }
  return { used, shown, nulls };
}

// ---- the data the picker is run on ----
const perWhen = Object.fromEntries(WHEN.map(w => [w, cards.filter(c => c.when === w)]));
const everyClubPlaysEveryWeek = season.fixtures.every(w => new Set(w.flat()).size === season.clubs.length);

check('the module exposes pick, apply, seeded and the four when words', typeof P.pick === 'function' && typeof P.apply === 'function' && typeof P.seeded === 'function' && same(P.WHEN, WHEN));
check('the real card file has ' + cards.length + ' cards, ' + WHEN.map(w => perWhen[w].length + ' ' + w).join(', '), cards.length === 16 && WHEN.every(w => perWhen[w].length === 4));

// each `when` only ever gets matching cards, from empty to full `used`, from many seeds
let whenOk = true, notUsedOk = true, picks = 0;
for (let n = 0; n < 400; n++) {
  const rng = P.seeded(BASE_SEED + n), when = WHEN[n % 4], used = [];
  for (let i = 0; i < 6; i++) {
    const card = P.pick(cards, { when, used: used.slice(), rng });
    if (!card) break;
    picks++; whenOk = whenOk && card.when === when && byId.get(card.id) === card; notUsedOk = notUsedOk && !used.includes(card.id); used.push(card.id);
  }
}
check('each when only gets cards whose when matches, and never a used card (' + picks + ' picks, 400 seeds)', whenOk && notUsedOk);

// no repeats in a ten-week season, over many seeded seasons
let repeatsOk = true, validOk = true;
const stats = { byeShown: 0, shown: 0, full: 0, nulls: { afterWin: 0, afterLoss: 0, beforeGame: 0 }, roles: {}, roleRuns: 0, roleRunsBaseline: 0, pairs: 0 };
for (let n = 0; n < SEASONS; n++) {
  const r = playSeason(BASE_SEED + n * 104729, false);
  repeatsOk = repeatsOk && new Set(r.used).size === r.used.length && r.used.every(id => byId.has(id));
  validOk = validOk && r.shown.every(s => s.card.when === s.when); stats.byeShown += r.shown.filter(s => s.card.when === 'bye').length;
  stats.shown += r.used.length; if (r.used.length === 2 * season.weeks) stats.full++;
  for (const k of Object.keys(stats.nulls)) stats.nulls[k] += r.nulls[k];
  r.shown.forEach((s, i) => { stats.roles[s.card.role] = (stats.roles[s.card.role] || 0) + 1; if (i && r.shown[i - 1].card.role === s.card.role) stats.roleRuns++; stats.pairs += i ? 1 : 0; });
}
check('no card repeats in any of ' + SEASONS + ' seeded ten-week seasons (a card before and after every game)', repeatsOk && validOk);

// null when a when is used up
let nullOk = true;
for (const w of WHEN) {
  const used = perWhen[w].map(c => c.id);
  nullOk = nullOk && P.pick(cards, { when: w, used, rng: P.seeded(1) }) === null;
  // one fewer used: exactly the left-out card comes back
  const left = perWhen[w][2];
  nullOk = nullOk && P.pick(cards, { when: w, used: used.filter(id => id !== left.id), rng: P.seeded(1) }) === left;
  // drawing a when dry one pick at a time: four cards, then null, then null again
  const u = [], rng = P.seeded(9), seen = [];
  for (let i = 0; i < 6; i++) { const c = P.pick(cards, { when: w, used: u.slice(), rng }); seen.push(c ? c.id : null); if (c) u.push(c.id); }
  nullOk = nullOk && seen.slice(0, 4).every(Boolean) && new Set(seen.slice(0, 4)).size === 4 && seen[4] === null && seen[5] === null;
}
check('it returns null once every card for that when is used (and the one left-out card otherwise)', nullOk);
check('it returns null when every card of every kind is used, and when the card list is empty', P.pick(cards, { when: 'bye', used: cards.map(c => c.id), rng: P.seeded(1) }) === null && P.pick([], { when: 'bye', used: [], rng: P.seeded(1) }) === null);
let nullDraws = 0; P.pick(cards, { when: 'bye', used: perWhen.bye.map(c => c.id), rng: () => { nullDraws++; return .5; } });
check('a null result does not spend any rng draw, and a card result spends exactly two', nullDraws === 0 && (() => { let n = 0; P.pick(cards, { when: 'bye', used: [], rng: () => { n++; return .5; } }); return n === 2; })());

// same seed, same sequence
const seqA = playSeason(BASE_SEED, false).used, seqB = playSeason(BASE_SEED, false).used, seqC = playSeason(BASE_SEED + 1, false).used;
let diffSeeds = 0; for (let n = 0; n < 50; n++) if (!same(playSeason(BASE_SEED + n, false).used, seqA)) diffSeeds++;
check('the same seed gives the same sequence of cards, and different seeds give different ones (' + diffSeeds + ' of 50 differ from the first)', same(seqA, seqB) && !same(seqA, seqC) && diffSeeds > 25);
check('seeded() repeats, stays from 0 up to below 1, and a bad seed throws', (() => { const a = P.seeded(7), b = P.seeded(7); for (let i = 0; i < 1000; i++) { const x = a(); if (x !== b() || !(x >= 0 && x < 1)) return false; } return throws(() => P.seeded(1.5), TypeError) && throws(() => P.seeded('a'), TypeError); })());

// a fair spread of roles: first the real cards, then a made-up pool where the numbers are easy to see
let backToBack = 0, neverBackToBack = true;
for (let n = 0; n < 400; n++) {
  const rng = P.seeded(BASE_SEED + n), used = [];
  let lastRole = null;
  for (let i = 0; i < 8; i++) { // the afterWin and afterLoss cards, drawn alternately: 8 cards
    const when = i % 2 ? 'afterLoss' : 'afterWin', card = P.pick(cards, { when, used, rng });
    if (!card) continue;
    const others = cards.some(c => c.when === when && !used.includes(c.id) && c.role !== lastRole);
    if (lastRole === card.role) { backToBack++; if (others) neverBackToBack = false; }
    lastRole = card.role; used.push(card.id);
  }
}
check('a role is never shown twice in a row while a card of another role is left for that when (400 seeds)', neverBackToBack, backToBack + ' forced repeats');
const pool = [];
for (const [role, n] of [['qb', 9], ['rb', 5], ['kicker', 3]]) for (let i = 0; i < n; i++) pool.push({ id: role + i, when: 'bye', role, choices: [] });
deepFreeze(pool);
let spreadOk = true, worst = 0;
for (let n = 0; n < 300; n++) {
  const rng = P.seeded(BASE_SEED + n), used = [], counts = { qb: 0, rb: 0, kicker: 0 };
  for (let i = 0; i < 9; i++) { // nine picks: every role has at least three cards, so the counts must stay level
    const card = P.pick(pool, { when: 'bye', used, rng }); if (!card) { spreadOk = false; break; } used.push(card.id); counts[card.role]++;
    const spread = Math.max(...Object.values(counts)) - Math.min(...Object.values(counts)); worst = Math.max(worst, spread); if (spread > 1) spreadOk = false;
  }
  spreadOk = spreadOk && counts.qb === 3 && counts.rb === 3 && counts.kicker === 3;
}
check('roles stay level: on a made-up pool of 9 qb, 5 rb and 3 kicker cards, the first nine picks are three of each, never more than one apart (300 seeds)', spreadOk, 'widest gap seen ' + worst);
// recency beats totals: a role that was shown a lot, but not lately, comes before the role that was just shown
{
  const mk = (id, role) => ({ id, when: 'bye', role, choices: [] }), hand = deepFreeze([mk('y1', 'y'), mk('y2', 'y'), mk('y3', 'y'), mk('y4', 'y'), mk('x1', 'x'), mk('x2', 'x'), mk('z1', 'z')]);
  const lastX = ['y1', 'y2', 'y3', 'x1'], twoY = ['x1', 'z1', 'y1'];
  let ok = true;
  for (let n = 0; n < 100; n++) {
    ok = ok && P.pick(hand, { when: 'bye', used: lastX.concat(['z1']).slice(0, 4), rng: P.seeded(n) }).role !== 'x';   // x was just shown, y and z were not
    ok = ok && P.pick(hand.filter(c => c.role !== 'z'), { when: 'bye', used: lastX, rng: P.seeded(n) }).role === 'y';   // x (1 shown) against y (3 shown): y, because x was last
    ok = ok && P.pick(hand.filter(c => c.id !== 'z1'), { when: 'bye', used: twoY, rng: P.seeded(n) }).role === 'x';   // z, y shown lately: x was shown first of three, so it is not recent
  }
  check('a role shown often but not lately comes before the role that was just shown (3 cases, 100 seeds each)', ok);
}
let usedCardsIgnored = true;
{ const used = ['not-a-card', 'also-not'], card = P.pick(cards, { when: 'bye', used, rng: P.seeded(3) }); usedCardsIgnored = card && card.when === 'bye' && !used.includes(card.id); }
check('ids in used that are not in the card list are ignored, apart from never being returned', usedCardsIgnored);

// the season shape on the real data
const roleList = Object.keys(stats.roles).sort((a, b) => stats.roles[b] - stats.roles[a]);
check('only 4 before-game cards exist, so in every ten-week season 6 of the 10 before-game slots come back empty', stats.nulls.beforeGame === SEASONS * (season.weeks - 4));
check('season.json has every club playing in every one of its 10 weeks, so a bye card never comes up in a season', everyClubPlaysEveryWeek && season.weeks === 10);
check('there is no repeat even when a caller asks for twenty cards in a season: at most 12 are ever shown (4 before-game, 4 after-win, 4 after-loss)', (() => { const used = [], rng = P.seeded(11); for (let i = 0; i < 20; i++) { const w = WHEN[i % 3 === 0 ? 3 : (i % 3 === 1 ? 0 : 1)], c = P.pick(cards, { when: w, used, rng }); if (c) used.push(c.id); } return new Set(used).size === used.length && used.length === 12; })());

// bad input
check('a bad when throws (none, wrong case, a number, null, an object, a when the cards do not have)', [undefined, 'afterwin', 'AFTERWIN', 3, null, {}, 'duringGame', ''].every(w => throws(() => P.pick(cards, { when: w, used: [], rng: P.seeded(1) }), TypeError)));
check('a bad when throws even when the card list is empty', throws(() => P.pick([], { when: 'sometime', used: [], rng: P.seeded(1) }), TypeError));
check('bad used, rng, options and cards all throw', throws(() => P.pick(cards, { when: 'bye', rng: P.seeded(1) }), TypeError) && throws(() => P.pick(cards, { when: 'bye', used: 'x', rng: P.seeded(1) }), TypeError) && throws(() => P.pick(cards, { when: 'bye', used: [1], rng: P.seeded(1) }), TypeError)
  && throws(() => P.pick(cards, { when: 'bye', used: [] }), TypeError) && throws(() => P.pick(cards, { when: 'bye', used: [], rng: () => 1 }), TypeError) && throws(() => P.pick(cards, { when: 'bye', used: [], rng: () => NaN }), TypeError)
  && throws(() => P.pick(cards, null), TypeError) && throws(() => P.pick(null, { when: 'bye', used: [], rng: P.seeded(1) }), TypeError)
  && throws(() => P.pick([cards[0], cards[0]], { when: 'afterWin', used: [], rng: P.seeded(1) }), TypeError) && throws(() => P.pick([{ id: 'a', when: 'sometime', role: 'x' }], { when: 'bye', used: [], rng: P.seeded(1) }), TypeError) && throws(() => P.pick([{ id: 'a', when: 'bye' }], { when: 'bye', used: [], rng: P.seeded(1) }), TypeError));

// apply
const exact = (card, i, state) => { const effects = card.choices[i].effects, r = P.apply(card, i, state), s = state || {};
  return r.cardId === card.id && r.choiceIndex === i && r.result === card.choices[i].result && r.target === (effects.target || null)
    && SCORED.every(k => r[k] === (effects[k] || 0) && r.total[k] === (s[k] || 0) + (effects[k] || 0)); };
let applyCount = 0, applyOk = true;
for (const c of cards) c.choices.forEach((_, i) => { applyCount++; applyOk = applyOk && exact(c, i) && exact(c, i, { morale: 3, points: 10, fans: -4, owner: 1 }) && exact(c, i, { morale: 1 }); });
check('apply returns every card\'s exact effects, result text and target for every choice (' + applyCount + ' choices), plus the optional totals', applyOk && applyCount === 32);
check('apply treats a missing effect as 0 and keeps a target-less effect as null, as in the cards that only change fans and owner', (() => { const c = byId.get('loss-boos'), r = P.apply(c, 0); return r.morale === 0 && r.points === 0 && r.fans === 2 && r.owner === -2 && r.target === null; })());
check('apply leaves its inputs untouched (deep-frozen card and state), and returns data the caller can change freely', (() => {
  const state = deepFreeze({ morale: 4, points: 2, fans: 0, owner: -1 }), c = byId.get('win-victory-lap'), snap = JSON.stringify([c, state]);
  const r = P.apply(c, 0, state); r.morale = 99; r.total.fans = 99;
  const again = P.apply(c, 0, state);
  return JSON.stringify([c, state]) === snap && again.morale === -1 && again.total.fans === 3 && !Object.isFrozen(r) && r.total !== again.total;
})());
check('pick leaves cards and used untouched (deep-frozen), and returns the card from the list itself', (() => { const used = deepFreeze(['win-victory-lap']), snap = JSON.stringify([cards, used]), c = P.pick(cards, { when: 'afterWin', used, rng: P.seeded(2) }); return JSON.stringify([cards, used]) === snap && byId.get(c.id) === c; })());
check('apply throws on a bad choice index, a bad card and a bad state', [-1, 2, 1.5, '0', NaN, null, undefined, Infinity].every(i => throws(() => P.apply(cards[0], i), TypeError))
  && throws(() => P.apply(null, 0), TypeError) && throws(() => P.apply({ id: 'x' }, 0), TypeError) && throws(() => P.apply(cards[0], 0, 5), TypeError) && throws(() => P.apply(cards[0], 0, [1]), TypeError) && throws(() => P.apply(cards[0], 0, { morale: NaN }), TypeError)
  && throws(() => P.apply({ id: 'x', choices: [{ effects: { morale: 'a' } }] }, 0), TypeError));

check('the module uses no Math.random, Date, storage, DOM or network', (() => { const src = fs.readFileSync(path.join(DATA, 'dilemma-pick.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//, ''); return !/Math\.random|Date\b|localStorage|sessionStorage|document\.|fetch\(|XMLHttpRequest|Worker\b/.test(src); })());
check('the data files were not changed by the run', read('dilemmas.json') === before.dilemmas && read('season.json') === before.season);

// ---- what a ten-week season looks like, for the README ----
console.log('\nWhat a ten-week season gets over ' + SEASONS + ' seeded seasons (a card before each of 10 games and one after it, wins and losses at 50/50):');
console.log('cards shown per season: ' + (stats.shown / SEASONS).toFixed(2) + ' of 20 slots; every slot filled in ' + stats.full + ' of ' + SEASONS + ' seasons');
console.log('slots with no card left per season: before a game ' + (stats.nulls.beforeGame / SEASONS).toFixed(2) + ', after a win ' + (stats.nulls.afterWin / SEASONS).toFixed(2) + ', after a loss ' + (stats.nulls.afterLoss / SEASONS).toFixed(2));
console.log('role share of the cards shown: ' + roleList.map(r => r + ' ' + (100 * stats.roles[r] / stats.shown).toFixed(1) + '%').join(', '));
console.log('the same role twice running in a season: ' + (100 * stats.roleRuns / stats.pairs).toFixed(1) + '% of back-to-back cards');
console.log('bye cards shown: ' + stats.byeShown + ' (no club has a bye week in season.json: ' + (everyClubPlaysEveryWeek ? 'true' : 'false') + ')');
console.log('\n' + (failed ? 'FAIL' : 'PASS') + ' - ' + passed + ' of ' + (passed + failed) + ' Lantern Bowl dilemma picker checks.');
if (failed) process.exitCode = 1;
