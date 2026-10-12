/* Shared creature system for Generations games.
   An individual creature = a species (data owned by each game) + its own genes, temperament, rarity and traits.
   Wildbond uses this first; Realmbound pets and mounts can move onto it later.
   Load after shared/engine.js. Exposes window.Creatures. */
(function () {
  'use strict';
  var R = Math.random;
  var STATS = ['hp', 'pow', 'grd', 'spd', 'wit', 'spi'];
  var STAT_NAME = { hp: 'Health', pow: 'Power', grd: 'Guard', spd: 'Speed', wit: 'Wits', spi: 'Spirit' };

  /* pot = range of each stat's hidden potential (0-31) for a wild creature of this rarity */
  var RARITY = [
    { name: 'Common', m: 1.00, traits: [0, 1], pot: [0, 15] },
    { name: 'Uncommon', m: 1.06, traits: [1, 1], pot: [3, 18] },
    { name: 'Rare', m: 1.12, traits: [1, 2], pot: [6, 22] },
    { name: 'Epic', m: 1.2, traits: [2, 2], pot: [10, 26] },
    { name: 'Legendary', m: 1.3, traits: [2, 3], pot: [14, 29] },
    { name: 'Mythical', m: 1.42, traits: [3, 3], pot: [18, 31] }
  ];
  var TEMPERAMENTS = {
    bold: { name: 'Bold', up: 'pow', down: 'grd' }, calm: { name: 'Calm', up: 'spi', down: 'spd' },
    skittish: { name: 'Skittish', up: 'spd', down: 'hp' }, proud: { name: 'Proud', up: 'wit', down: 'spi' },
    playful: { name: 'Playful', up: 'spd', down: 'wit' }, lazy: { name: 'Lazy', up: 'hp', down: 'spd' },
    steady: { name: 'Steady', up: null, down: null }
  };
  var TRAITS = {
    ferocious: { name: 'Ferocious', desc: 'Deals 10% more damage.' }, thick: { name: 'Thick Hide', desc: 'Takes 10% less damage.' },
    swift: { name: 'Swift', desc: 'Acts 10% faster.' }, keen: { name: 'Keen', desc: '+8% critical hit chance.' },
    loyal: { name: 'Loyal', desc: 'Bond grows 50% faster.' }, hardy: { name: 'Hardy', desc: 'Recovers faster between battles.' },
    lucky: { name: 'Lucky', desc: 'Finds more items while exploring.' }, gentle: { name: 'Gentle', desc: 'Wild creatures are easier to calm.' }
  };
  var BOND = [{ n: 'Wary', at: 0 }, { n: 'Friendly', at: 20 }, { n: 'Loyal', at: 60 }, { n: 'Devoted', at: 140 }, { n: 'Bonded', at: 280 }];

  function rint(a, b) { return a + Math.floor(R() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(R() * a.length)]; }
  function grade(p) { return p >= 30 ? 'S' : p >= 25 ? 'A' : p >= 20 ? 'B' : p >= 15 ? 'C' : p >= 10 ? 'D' : p >= 5 ? 'E' : 'F'; }
  function bondLvl(c) { var l = 0; for (var i = 0; i < BOND.length; i++) if (c.bond >= BOND[i].at) l = i; return l; }

  /* boost: 0 normal, higher = better odds (lures, traits, events) */
  function rollRarity(boost) {
    boost = boost || 0; var r = R() / (1 + boost);
    return r < 0.004 ? 3 : r < 0.03 ? 2 : r < 0.15 ? 1 : 0;
  }
  function rollTraits(rar) {
    var range = RARITY[rar].traits, n = rint(range[0], range[1]), keys = Object.keys(TRAITS), out = [];
    while (out.length < n) { var k = pick(keys); if (out.indexOf(k) < 0) out.push(k); }
    return out;
  }
  var uidN = Date.now() % 1e7;
  /* species: { id, name, ... } owned by the game. opts: { rar, temp, traits, pot, name } */
  function make(species, lvl, opts) {
    opts = opts || {};
    var rar = opts.rar !== undefined ? opts.rar : rollRarity(opts.boost);
    var pr = RARITY[rar].pot, pot = {};
    STATS.forEach(function (s) { pot[s] = opts.pot && opts.pot[s] !== undefined ? opts.pot[s] : rint(pr[0], pr[1]); });
    return {
      uid: ++uidN, sp: species.id, name: opts.name || species.name, lvl: lvl, xp: 0, rar: rar, pot: pot,
      temp: opts.temp || pick(Object.keys(TEMPERAMENTS)), traits: opts.traits || rollTraits(rar),
      bond: 0, hp: null, born: opts.born || ''
    };
  }
  /* Pokemon-style stat curve. base = species base stats (roughly 30-120). */
  function stats(c, base) {
    var t = TEMPERAMENTS[c.temp] || TEMPERAMENTS.steady, rm = RARITY[c.rar].m, bl = bondLvl(c), out = {};
    STATS.forEach(function (s) {
      var v = Math.floor((2 * base[s] + c.pot[s]) * c.lvl / 100);
      v = s === 'hp' ? v + c.lvl + 10 : v + 5;
      v += Math.floor(((c.train && c.train[s]) || 0) / 4); // trained points: every 4 adds 1
      if (t.up === s) v *= 1.1; if (t.down === s) v *= 0.9;
      out[s] = Math.max(1, Math.round(v * rm * (1 + 0.02 * bl)));
    });
    return out;
  }
  function xpNeed(lvl) { return Math.round(5 * Math.pow(lvl, 2.2) + 15); }
  /* Gives xp; returns the number of levels gained. cap = level cap */
  function gainXp(c, x, cap) {
    var gained = 0; c.xp += x;
    while (c.lvl < cap && c.xp >= xpNeed(c.lvl)) { c.xp -= xpNeed(c.lvl); c.lvl++; gained++; }
    if (c.lvl >= cap) c.xp = 0;
    return gained;
  }
  function addBond(c, v) { var b = bondLvl(c); c.bond += v * (c.traits.indexOf('loyal') >= 0 ? 1.5 : 1); return bondLvl(c) > b; }

  /* Breeding: child potential lands between the parents, with a chance to beat both. */
  function breed(a, b, species, lvl) {
    var pot = {};
    STATS.forEach(function (s) {
      var lo = Math.min(a.pot[s], b.pot[s]), hi = Math.max(a.pot[s], b.pot[s]);
      var v = rint(lo, hi); if (R() < 0.12) v = Math.min(31, hi + rint(1, 3));
      pot[s] = v;
    });
    var traits = [];
    a.traits.concat(b.traits).forEach(function (t) { if (traits.indexOf(t) < 0 && R() < 0.5) traits.push(t); });
    if (R() < 0.08) { var k = pick(Object.keys(TRAITS)); if (traits.indexOf(k) < 0) traits.push(k); }
    var rar = Math.max(0, Math.min(5, Math.max(a.rar, b.rar) - (R() < 0.6 ? 1 : 0) + (R() < 0.05 ? 1 : 0)));
    return make(species, lvl || 1, { rar: rar, pot: pot, traits: traits.slice(0, 3), temp: R() < 0.7 ? pick([a.temp, b.temp]) : undefined });
  }

  window.Creatures = {
    STATS: STATS, STAT_NAME: STAT_NAME, RARITY: RARITY, TEMPERAMENTS: TEMPERAMENTS, TRAITS: TRAITS, BOND: BOND,
    grade: grade, bondLvl: bondLvl, rollRarity: rollRarity, rollTraits: rollTraits, make: make, stats: stats,
    xpNeed: xpNeed, gainXp: gainXp, addBond: addBond, breed: breed
  };
})();
