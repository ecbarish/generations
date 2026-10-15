/* LB-G8: pure season standings and playoffs. Nothing in the live game loads this yet.
   UMD: require(...), or window.LanternBowlStandings. No DOM, SPORT, storage or randomness.

   table(season, results): week is the zero-based index into season.fixtures (0–9).
   home/away are club indexes, and their order must match that week's fixture.
   Scores are nonnegative safe integers; overtime must have produced a winner.
   Partial/out-of-order results are allowed; duplicate games and unknown fixtures are not.
   Tiebreakers: total wins, wins against ALL clubs in the original equal-wins group,
   overall points difference, overall points for, original club index. Do not restart
   head-to-head on a smaller subgroup: that could turn a three-way cycle into a sort bug.

   bracket(season, orderedTable): copies the top four club INDEXES, in seed order
   1v4 and 2v3. It also accepts a partial table for a projected bracket; the future
   caller decides when the regular season is finished. No seeds or extra save fields.
   advance(bracket, semiResults): two { home, away, homeScore, awayScore } records,
   in either order, matching the semi pairings. Returns a new bracket with a final
   between the winners, higher original seed at home. An existing final must agree.
   All three functions leave their inputs untouched and return fresh plain data. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LanternBowlStandings = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const fail = (path, reason) => { throw new TypeError('LanternBowlStandings: ' + path + ' ' + reason); };
  function integer(value, min, max, path) {
    if (!Number.isSafeInteger(value) || value < min || value > max) fail(path, 'must be a safe integer from ' + min + ' to ' + max);
    return value;
  }
  function record(value, fields, path, exact) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(path, 'must be a plain record');
    const proto = Object.getPrototypeOf(value);
    if (proto !== null && Object.getPrototypeOf(proto) !== null) fail(path, 'must be a plain record');
    if (exact && Reflect.ownKeys(value).some(key => !fields.includes(key))) fail(path, 'has an unknown field');
    const copy = Object.create(null);
    for (const field of fields) {
      const item = Object.getOwnPropertyDescriptor(value, field);
      if (!item || !own(item, 'value') || !item.enumerable) fail(path + '.' + field, 'must be an own enumerable data field');
      copy[field] = item.value;
    }
    return copy;
  }
  function array(value, path, length) {
    if (!Array.isArray(value)) fail(path, 'must be an array');
    if (length !== undefined && value.length !== length) fail(path, 'must have ' + length + ' entries');
    // Copy indexed own values, without invoking user iterators, getters or inherited slots.
    const copy = [];
    for (let i = 0; i < value.length; i++) {
      const item = Object.getOwnPropertyDescriptor(value, i);
      if (!item || !own(item, 'value') || !item.enumerable) fail(path + '[' + i + ']', 'must be an own enumerable data item');
      copy.push(item.value);
    }
    return copy;
  }
  function add(a, b, path) {
    const sum = a + b;
    if (!Number.isSafeInteger(sum)) fail(path, 'exceeds safe integer precision');
    return sum;
  }
  const desc = (a, b) => a === b ? 0 : a > b ? -1 : 1;
  function readSeason(value) {
    const season = record(value, ['clubs', 'weeks', 'fixtures', 'playoffs'], 'season');
    const clubs = array(season.clubs, 'season.clubs');
    if (clubs.length < 4) fail('season.clubs', 'must contain at least four clubs');
    const ids = new Set();
    const names = clubs.map((club, i) => {
      const id = record(club, ['id'], 'season.clubs[' + i + ']').id;
      if (typeof id !== 'string' || !id.trim() || ids.has(id)) fail('season.clubs[' + i + '].id', 'must be unique nonempty text');
      ids.add(id); return id;
    });
    const weeks = integer(season.weeks, 1, Number.MAX_SAFE_INTEGER, 'season.weeks');
    const fixtures = array(season.fixtures, 'season.fixtures', weeks);
    const scheduled = Array(clubs.length).fill(0), keys = new Set();
    fixtures.forEach((week, w) => {
      const seen = new Set();
      array(week, 'season.fixtures[' + w + ']').forEach((game, g) => {
        const at = 'season.fixtures[' + w + '][' + g + ']';
        const pair = array(game, at, 2);
        pair.forEach((index, side) => integer(index, 0, clubs.length - 1, at + '[' + side + ']'));
        if (pair[0] === pair[1]) fail(at, 'cannot pair a club with itself');
        for (const index of pair) {
          if (seen.has(index)) fail(at, 'lists a club more than once this week');
          seen.add(index); scheduled[index]++;
        }
        keys.add(w + ':' + pair[0] + ':' + pair[1]);
      });
    });
    const playoffs = record(season.playoffs, ['teams', 'rounds', 'seeding'], 'season.playoffs');
    const rounds = array(playoffs.rounds, 'season.playoffs.rounds', 2);
    if (playoffs.teams !== 4 || playoffs.seeding !== 'standings' || rounds[0] !== 'semi' || rounds[1] !== 'final') {
      fail('season.playoffs', 'must use four teams, standings seeding and semi/final rounds');
    }
    return { names, weeks, keys, scheduled };
  }
  function score(result, path) {
    integer(result.homeScore, 0, Number.MAX_SAFE_INTEGER, path + '.homeScore');
    integer(result.awayScore, 0, Number.MAX_SAFE_INTEGER, path + '.awayScore');
    if (result.homeScore === result.awayScore) fail(path, 'cannot be tied; finish overtime first');
  }
  function table(season, results) {
    const data = readSeason(season), played = new Set();
    const games = array(results, 'results').map((input, i) => {
      const at = 'results[' + i + ']';
      const r = record(input, ['week', 'home', 'away', 'homeScore', 'awayScore'], at, true);
      integer(r.week, 0, data.weeks - 1, at + '.week');
      integer(r.home, 0, data.names.length - 1, at + '.home');
      integer(r.away, 0, data.names.length - 1, at + '.away');
      const key = r.week + ':' + r.home + ':' + r.away;
      if (!data.keys.has(key)) fail(at, 'does not match a scheduled week and home/away pairing');
      if (played.has(key)) fail(at, 'duplicates a result for the same fixture');
      played.add(key); score(r, at); return r;
    });
    const rows = data.names.map((id, index) => ({ index, id, w: 0, l: 0, pf: 0, pa: 0, diff: 0, played: 0 }));
    const headWins = rows.map(() => Array(rows.length).fill(0));
    for (const r of games) {
      const home = rows[r.home], away = rows[r.away];
      home.pf = add(home.pf, r.homeScore, 'points for'); home.pa = add(home.pa, r.awayScore, 'points against');
      away.pf = add(away.pf, r.awayScore, 'points for'); away.pa = add(away.pa, r.homeScore, 'points against');
      home.played++; away.played++;
      const winner = r.homeScore > r.awayScore ? home : away, loser = winner === home ? away : home;
      winner.w++; loser.l++; headWins[winner.index][loser.index]++;
    }
    rows.forEach(row => { row.diff = row.pf - row.pa; });
    rows.sort((a, b) => desc(a.w, b.w) || a.index - b.index);
    const ordered = [];
    for (let start = 0; start < rows.length;) {
      let end = start + 1;
      while (end < rows.length && rows[end].w === rows[start].w) end++;
      const group = rows.slice(start, end), h2h = new Map();
      for (const row of group) h2h.set(row.index, group.reduce((sum, other) => sum + headWins[row.index][other.index], 0));
      group.sort((a, b) => desc(h2h.get(a.index), h2h.get(b.index)) || desc(a.diff, b.diff) || desc(a.pf, b.pf) || a.index - b.index);
      ordered.push(...group); start = end;
    }
    return ordered;
  }
  function bracket(season, orderedTable) {
    const data = readSeason(season), seen = new Set();
    const rows = array(orderedTable, 'table', data.names.length).map((input, i) => {
      const at = 'table[' + i + ']';
      const row = record(input, ['index', 'id', 'w', 'l', 'pf', 'pa', 'diff', 'played'], at, true);
      integer(row.index, 0, data.names.length - 1, at + '.index');
      if (seen.has(row.index) || row.id !== data.names[row.index]) fail(at, 'must identify a unique club from this season');
      seen.add(row.index);
      for (const key of ['w', 'l', 'pf', 'pa', 'played']) integer(row[key], 0, Number.MAX_SAFE_INTEGER, at + '.' + key);
      integer(row.diff, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, at + '.diff');
      if (add(row.w, row.l, at + '.played') !== row.played || row.played > data.scheduled[row.index] || row.diff !== row.pf - row.pa) {
        fail(at, 'has inconsistent totals');
      }
      return row;
    });
    if (rows.some((row, i) => i > 0 && row.w > rows[i - 1].w)) fail('table', 'must already be ordered by standings');
    // Tied rows cannot be re-ranked here: the head-to-head results belong to table().
    return { semis: [[rows[0].index, rows[3].index], [rows[1].index, rows[2].index]], final: null };
  }
  function advance(input, semiResults) {
    const b = record(input, ['semis', 'final'], 'bracket', true), seen = new Set();
    const semis = array(b.semis, 'bracket.semis', 2).map((game, i) => {
      return array(game, 'bracket.semis[' + i + ']', 2).map((index, side) => {
        integer(index, 0, Number.MAX_SAFE_INTEGER, 'bracket.semis[' + i + '][' + side + ']');
        if (seen.has(index)) fail('bracket.semis', 'must contain four distinct club indexes');
        seen.add(index); return index;
      });
    });
    const seeds = [semis[0][0], semis[1][0], semis[1][1], semis[0][1]];
    const oldFinal = b.final === null ? null : array(b.final, 'bracket.final', 2);
    const complete = new Set();
    const winners = array(semiResults, 'semiResults', 2).map((inputResult, i) => {
      const at = 'semiResults[' + i + ']';
      const r = record(inputResult, ['home', 'away', 'homeScore', 'awayScore'], at, true);
      integer(r.home, 0, Number.MAX_SAFE_INTEGER, at + '.home');
      integer(r.away, 0, Number.MAX_SAFE_INTEGER, at + '.away');
      const semi = semis.findIndex(pair => pair[0] === r.home && pair[1] === r.away);
      if (semi === -1 || complete.has(semi)) fail(at, 'must match a different scheduled semi-final');
      complete.add(semi); score(r, at);
      return r.homeScore > r.awayScore ? r.home : r.away;
    }).sort((a, b) => seeds.indexOf(a) - seeds.indexOf(b));
    if (oldFinal && (oldFinal[0] !== winners[0] || oldFinal[1] !== winners[1])) fail('bracket.final', 'does not match the semi-final winners in seed order');
    return { semis, final: winners };
  }
  return { table, bracket, advance };
});
