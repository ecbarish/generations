/* LB-G14: pure dilemma picker. Nothing in the live game loads this yet.
   UMD: require(...), or window.LanternBowlDilemmaPick. No DOM, SPORT, storage, clock or Math.random, and no save of its own.

   pick(cards, { when, used, rng })
     cards: the `cards` array of dilemmas.json. when: 'afterWin', 'afterLoss', 'bye' or 'beforeGame'.
     used: a plain array of card ids the caller keeps, oldest first. rng: a function returning a number from 0 up to
     (not including) 1, for example seeded(seed). Returns one card (the card object from `cards`) whose `when` matches and
     whose id is not in `used`, or null when none is left. A bad `when` throws, so does a malformed card or argument.
     Which card: the last two cards in `used` give the roles shown most recently. Among the cards left, a role that is not
     one of those two is preferred, then one that is not the very last role, then any. Among those, the role shown the fewest
     times in `used` goes first (used cards that are not in `cards` count for nothing), so roles stay spread across a season.
     The rng picks one of the tied roles, then one of that role's cards, so a non-null pick calls rng twice and null never does.
   apply(card, choiceIndex, state)
     Returns a fresh { cardId, choiceIndex, target, result, morale, points, fans, owner, total }. The four numbers are the
     choice's effects exactly, with 0 for any the card does not list; target is 'player', 'team' or null; total is the optional
     `state` (running totals with any of the four numbers) plus those effects. Nothing is clamped. state and card are not changed.
   seeded(seed): a small repeatable rng (mulberry32), so a season can store only a seed. WHEN lists the four valid `when` words. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LanternBowlDilemmaPick = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const WHEN = Object.freeze(['afterWin', 'afterLoss', 'bye', 'beforeGame']);
  const SCORED = Object.freeze(['morale', 'points', 'fans', 'owner']);
  const RECENT = 2;
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const fail = (path, reason) => { throw new TypeError('LanternBowlDilemmaPick: ' + path + ' ' + reason); };
  const plain = v => v !== null && typeof v === 'object' && !Array.isArray(v);

  function checkWhen(when) {
    if (typeof when !== 'string' || !WHEN.includes(when)) fail('when', 'must be one of ' + WHEN.join(', '));
    return when;
  }
  function checkCards(cards) {
    if (!Array.isArray(cards)) fail('cards', 'must be an array');
    const seen = new Set();
    cards.forEach((c, i) => {
      const at = 'cards[' + i + ']';
      if (!plain(c)) fail(at, 'must be a card record');
      if (typeof c.id !== 'string' || !c.id) fail(at + '.id', 'must be nonempty text');
      if (seen.has(c.id)) fail(at + '.id', 'is a repeat of "' + c.id + '"');
      seen.add(c.id);
      checkWhen(c.when);
      if (typeof c.role !== 'string' || !c.role) fail(at + '.role', 'must be nonempty text');
    });
    return cards;
  }
  function checkTotals(state, path) {
    if (state === undefined || state === null) return {};
    if (!plain(state)) fail(path, 'must be a record of numbers');
    for (const k of SCORED) if (own(state, k) && !Number.isFinite(state[k])) fail(path + '.' + k, 'must be a finite number');
    return state;
  }

  function pick(cards, options) {
    checkCards(cards);
    if (!plain(options)) fail('options', 'must be { when, used, rng }');
    const when = checkWhen(options.when), used = options.used, rng = options.rng;
    if (!Array.isArray(used) || used.some(id => typeof id !== 'string')) fail('used', 'must be an array of card ids');
    if (typeof rng !== 'function') fail('rng', 'must be a function');
    const taken = new Set(used), byId = new Map(cards.map(c => [c.id, c]));
    const eligible = cards.filter(c => c.when === when && !taken.has(c.id));
    if (!eligible.length) return null;

    const shown = used.map(id => byId.get(id)).filter(Boolean).map(c => c.role);   // roles of used cards, oldest first
    const count = role => shown.reduce((n, r) => n + (r === role ? 1 : 0), 0);
    const recent = shown.slice(-RECENT), last = shown.slice(-1);
    const pool = [x => !recent.includes(x.role), x => !last.includes(x.role), () => true]
      .map(keep => eligible.filter(keep)).find(list => list.length);
    const fewest = Math.min(...pool.map(c => count(c.role)));
    const roles = [...new Set(pool.filter(c => count(c.role) === fewest).map(c => c.role))];
    const draw = () => {
      const r = rng();
      if (typeof r !== 'number' || !(r >= 0 && r < 1)) fail('rng', 'must return a number from 0 up to but not including 1');
      return r;
    };
    const role = roles[Math.floor(draw() * roles.length)];
    const cardsOfRole = pool.filter(c => c.role === role);
    return cardsOfRole[Math.floor(draw() * cardsOfRole.length)];
  }

  function apply(card, choiceIndex, state) {
    if (!plain(card)) fail('card', 'must be a card record');
    if (typeof card.id !== 'string' || !card.id) fail('card.id', 'must be nonempty text');
    if (!Array.isArray(card.choices)) fail('card.choices', 'must be an array');
    if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= card.choices.length) fail('choiceIndex', 'must be a whole number from 0 to ' + (card.choices.length - 1));
    const choice = card.choices[choiceIndex];
    if (!plain(choice) || !plain(choice.effects)) fail('card.choices[' + choiceIndex + '].effects', 'must be a record');
    const totals = checkTotals(state, 'state'), e = choice.effects, out = {};
    for (const k of SCORED) {
      if (own(e, k) && !Number.isFinite(e[k])) fail('card.choices[' + choiceIndex + '].effects.' + k, 'must be a finite number');
      out[k] = own(e, k) ? e[k] : 0;
    }
    const target = e.target === 'player' || e.target === 'team' ? e.target : null;
    const total = {}; for (const k of SCORED) total[k] = (own(totals, k) ? totals[k] : 0) + out[k];
    return { cardId: card.id, choiceIndex, target, result: typeof choice.result === 'string' ? choice.result : '', morale: out.morale, points: out.points, fans: out.fans, owner: out.owner, total };
  }

  function seeded(seed) {
    if (!Number.isSafeInteger(seed)) fail('seed', 'must be a safe integer');
    let s = seed >>> 0;
    return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  return Object.freeze({ WHEN, pick, apply, seeded });
});
