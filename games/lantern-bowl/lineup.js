/* LB-G12: pure depth charts and engine adapters; no runtime, DOM, saves or RNG.
   require(...) or window.LanternBowlLineup.

   Contract ruling: #373 issuecomment-6186019343. There are 22 slots: ten on
   offence, eleven on defence and one kicker. IDs are unique WITHIN each unit.
   Each input group is a player or an array of candidates (empty is allowed).
   This accepts roster.json unchanged and lets a future caller supply depth in
   the existing groups, without creating reserves or changing the authored data.

   Selection: reserve each group's best eligible natural players first. Fill
   vacancies with unused players from the same unit, then unused players from
   other units. Units are offence / defence / special teams (kicker); the kicker
   can cover a field slot and field players can cover kicker. This follows the
   ruling's whole-club minimum: 11 eligible players can fill every unit. Within
   a unit, vacancies are filled in SLOTS order. Final groups are best first.
   Scores are the integer weighted sums below; ties use the listed skills in
   order, then stable player ID (code-unit order, never locale or input order).

   An entry keeps its original sparse ratings and adds sourceGroup, twoWay and
   effectiveRatings (all nine skills; missing authored skills default to 50,
   exactly as model.js person()). Only the cross-unit ENTRY takes the flat -5;
   that player's natural-unit entry and the supplied club remain unchanged.
   Effective skills can reach 30; the teamNumbers adapter rounds and clamps its
   averages to the specified 35..90 range. playbookSlots returns fresh player
   copies with FLAT effective skills, ready for engine use, not stored ratings.
   No persistence shape or runtime integration is introduced here.

   Team numbers: line = five blockers' block; rush = four front players' rush;
   cover = four secondary players' cover; tackle = all eleven defenders' tackle;
   kick = the kicker's kick. Unweighted arithmetic averages, rounded once.
   Unknown groups, duplicate input IDs, malformed records/options/ratings and
   unknown out IDs throw clear errors. A valid club with fewer than 11 eligible
   players throws RangeError; otherwise a full lineup is always returned. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LanternBowlLineup = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const SLOTS = { qb: 1, rb: 1, wr: 2, te: 1, line: 5, front: 4, backers: 3, secondary: 4, kicker: 1 };
  const GROUPS = Object.keys(SLOTS);
  const RATINGS = ['throw', 'catch', 'speed', 'carry', 'block', 'rush', 'cover', 'tackle', 'kick'];
  const UNITS = { qb: 'offence', rb: 'offence', wr: 'offence', te: 'offence', line: 'offence', front: 'defence', backers: 'defence', secondary: 'defence', kicker: 'special' };
  const WEIGHTS = {
    qb: [['throw', 4], ['speed', 1]], rb: [['carry', 3], ['speed', 2], ['catch', 1]],
    wr: [['catch', 3], ['speed', 2]], te: [['catch', 2], ['block', 2], ['speed', 1]],
    line: [['block', 4], ['tackle', 1]], front: [['rush', 4], ['tackle', 1], ['speed', 1]],
    backers: [['tackle', 3], ['cover', 2], ['speed', 1]], secondary: [['cover', 4], ['speed', 2], ['tackle', 1]],
    kicker: [['kick', 4], ['speed', 1]]
  };
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const fail = (path, message) => { throw new TypeError('LanternBowlLineup: ' + path + ' ' + message); };
  function record(value, allowed, required, path) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(path, 'must be a plain record');
    const proto = Object.getPrototypeOf(value);
    if (proto !== null && Object.getPrototypeOf(proto) !== null) fail(path, 'must be a plain record');
    const copy = Object.create(null);
    for (const key of Reflect.ownKeys(value)) {
      if (!allowed.includes(key)) fail(path, 'has an unknown ' + (path === 'club' || path === 'starters' ? 'group' : 'field') + ' ' + String(key));
      const item = Object.getOwnPropertyDescriptor(value, key);
      if (!item.enumerable || !own(item, 'value')) fail(path + '.' + key, 'must be an own enumerable data field');
      copy[key] = item.value;
    }
    for (const key of required) if (!own(copy, key)) fail(path + '.' + key, 'is required');
    return copy;
  }
  function array(value, path) {
    if (!Array.isArray(value)) fail(path, 'must be an array');
    if (Reflect.ownKeys(value).some(key => key !== 'length' && (typeof key !== 'string' || !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length))) fail(path, 'has an unknown array field');
    const copy = [];
    for (let i = 0; i < value.length; i++) {
      const item = Object.getOwnPropertyDescriptor(value, i);
      if (!item || !item.enumerable || !own(item, 'value')) fail(path + '[' + i + ']', 'must be an own enumerable data item');
      copy.push(item.value);
    }
    return copy;
  }
  function text(value, path) {
    if (typeof value !== 'string' || !value.trim()) fail(path, 'must be nonblank text');
    return value;
  }
  function integer(value, min, max, path) {
    if (!Number.isInteger(value) || value < min || value > max) fail(path, 'must be an integer from ' + min + ' to ' + max);
    return value;
  }
  function player(value, path, entry) {
    const extra = entry ? ['sourceGroup', 'twoWay', 'effectiveRatings'] : [];
    const p = record(value, ['id', 'name', 'age'].concat(RATINGS, extra), ['id', 'name', 'age'].concat(extra), path);
    text(p.id, path + '.id'); text(p.name, path + '.name');
    integer(p.age, 21, 36, path + '.age');
    for (const key of RATINGS) if (own(p, key)) integer(p[key], 35, 90, path + '.' + key);
    if (entry) {
      if (!GROUPS.includes(p.sourceGroup)) fail(path + '.sourceGroup', 'is an unknown group');
      if (typeof p.twoWay !== 'boolean') fail(path + '.twoWay', 'must be boolean');
      p.effectiveRatings = record(p.effectiveRatings, RATINGS, RATINGS, path + '.effectiveRatings');
      for (const key of RATINGS) {
        const expected = (own(p, key) ? p[key] : 50) - (p.twoWay ? 5 : 0);
        if (p.effectiveRatings[key] !== expected) fail(path + '.effectiveRatings.' + key, 'must equal the stored/default rating minus the two-way penalty');
      }
    }
    return p;
  }
  function rawCopy(p) {
    const result = { id: p.id, name: p.name, age: p.age };
    for (const key of RATINGS) if (own(p, key)) result[key] = p[key];
    return result;
  }
  function makeEntry(candidate, group) {
    const result = rawCopy(candidate.player);
    result.sourceGroup = candidate.group;
    result.twoWay = UNITS[candidate.group] !== UNITS[group];
    result.effectiveRatings = {};
    for (const key of RATINGS) result.effectiveRatings[key] = (own(result, key) ? result[key] : 50) - (result.twoWay ? 5 : 0);
    return result;
  }
  function compare(group, rates, id) {
    const weights = WEIGHTS[group];
    return (a, b) => {
      const ar = rates(a), br = rates(b);
      const score = r => weights.reduce((sum, pair) => sum + r[pair[0]] * pair[1], 0);
      const difference = score(br) - score(ar);
      if (difference) return difference;
      for (const [key] of weights) if (ar[key] !== br[key]) return br[key] - ar[key];
      return id(a) < id(b) ? -1 : id(a) > id(b) ? 1 : 0;
    };
  }
  function starters(club, opts) {
    const groups = record(club, GROUPS, GROUPS, 'club'), candidates = [], ids = new Set();
    for (const group of GROUPS) {
      const list = Array.isArray(groups[group]) ? array(groups[group], 'club.' + group) : [groups[group]];
      for (let i = 0; i < list.length; i++) {
        const p = player(list[i], 'club.' + group + '[' + i + ']', false);
        if (ids.has(p.id)) fail('club', 'has a duplicate player ID ' + p.id);
        ids.add(p.id); candidates.push({ player: p, group });
      }
    }
    const options = opts === undefined ? {} : record(opts, ['out'], [], 'opts');
    const out = new Set();
    if (own(options, 'out')) for (const id of array(options.out, 'opts.out')) {
      text(id, 'opts.out ID');
      if (!ids.has(id)) fail('opts.out', 'contains unknown player ID ' + id);
      out.add(id);
    }
    const eligible = candidates.filter(c => !out.has(c.player.id));
    if (eligible.length < 11) throw new RangeError('LanternBowlLineup: fewer than 11 eligible players (' + eligible.length + '); cannot fill the defence unit');
    const picked = {}, used = { offence: new Set(), defence: new Set(), special: new Set() };
    const ranked = (group, pool) => pool.slice().sort(compare(group, c => makeEntry(c, group).effectiveRatings, c => c.player.id));
    const take = (group, candidate) => { picked[group].push(makeEntry(candidate, group)); used[UNITS[group]].add(candidate.player.id); };
    // Reserve natural starters in ALL groups before allocating a spare to a vacancy.
    for (const group of GROUPS) {
      picked[group] = [];
      for (const candidate of ranked(group, eligible.filter(c => c.group === group)).slice(0, SLOTS[group])) take(group, candidate);
    }
    for (const group of GROUPS) while (picked[group].length < SLOTS[group]) {
      const unit = UNITS[group], available = eligible.filter(c => !used[unit].has(c.player.id));
      const sameSide = available.filter(c => UNITS[c.group] === unit);
      take(group, ranked(group, sameSide.length ? sameSide : available)[0]);
    }
    const result = {};
    for (const group of GROUPS) {
      picked[group].sort(compare(group, p => p.effectiveRatings, p => p.id));
      result[group] = SLOTS[group] === 1 ? picked[group][0] : picked[group];
    }
    return result;
  }
  function readStarters(value) {
    const groups = record(value, GROUPS, GROUPS, 'starters'), result = {};
    const used = { offence: new Set(), defence: new Set(), special: new Set() }, identities = new Map();
    for (const group of GROUPS) {
      const list = SLOTS[group] === 1 ? [groups[group]] : array(groups[group], 'starters.' + group);
      if (list.length !== SLOTS[group]) fail('starters.' + group, 'must have ' + SLOTS[group] + ' entries');
      result[group] = list.map((value, i) => {
        const path = 'starters.' + group + '[' + i + ']', p = player(value, path, true), unit = UNITS[group];
        if (used[unit].has(p.id)) fail(path, 'duplicates a player within the ' + unit + ' unit');
        used[unit].add(p.id);
        if (p.twoWay !== (UNITS[p.sourceGroup] !== unit)) fail(path + '.twoWay', 'does not match the source and destination units');
        const identity = JSON.stringify([rawCopy(p), p.sourceGroup]);
        if (identities.has(p.id) && identities.get(p.id) !== identity) fail(path, 'has inconsistent stored identity or ratings across units');
        identities.set(p.id, identity);
        return p;
      });
    }
    return result;
  }
  function teamNumbers(value) {
    const s = readStarters(value);
    const mean = (players, key) => Math.max(35, Math.min(90, Math.round(players.reduce((sum, p) => sum + p.effectiveRatings[key], 0) / players.length)));
    return { line: mean(s.line, 'block'), rush: mean(s.front, 'rush'), cover: mean(s.secondary, 'cover'), tackle: mean(s.front.concat(s.backers, s.secondary), 'tackle'), kick: mean(s.kicker, 'kick') };
  }
  function playbookSlots(value) {
    const s = readStarters(value);
    const adapted = p => Object.assign({ id: p.id, name: p.name, age: p.age, twoWay: p.twoWay }, p.effectiveRatings);
    return { qb: adapted(s.qb[0]), rb: adapted(s.rb[0]), wr: s.wr.map(adapted), te: adapted(s.te[0]) };
  }
  return Object.freeze({ starters, teamNumbers, playbookSlots });
});
