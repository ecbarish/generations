/* LB-G8: plain Node checks; also usable by a later HTML page.
   Node: node tests/lantern-bowl-standings.cjs
   Browser: LanternBowlStandingsChecks.runChecks(LanternBowlStandings, season, emit).
   emit(name, ok, detail) is optional. runChecks returns { passed, failed, total }.
   Runtime integration, browser-page wiring and saves remain outside this row. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
    if (require.main === module) {
      const fs = require('fs'), path = require('path'), vm = require('vm');
      const dir = path.join(__dirname, '..');
      const source = fs.readFileSync(path.join(dir, 'games/lantern-bowl/standings.js'), 'utf8');
      const season = JSON.parse(fs.readFileSync(path.join(dir, 'games/lantern-bowl/season.json'), 'utf8'));
      const S = require('../games/lantern-bowl/standings.js');
      const printFailure = (name, ok, detail) => { if (!ok) console.error('FAIL ' + name + ': ' + detail); };
      const result = api.runChecks(S, season, printFailure);
      console.log('LB-G8: ' + result.passed + '/' + result.total + ' checks passed (' + result.failed + ' failed).');
      const sandbox = { window: {} };
      for (const key of ['document', 'localStorage', 'sessionStorage', 'SPORT', 'fetch', 'Date']) {
        Object.defineProperty(sandbox, key, { get() { throw new Error('Forbidden global: ' + key); } });
      }
      vm.createContext(sandbox);
      vm.runInContext('Math.random = function () { throw new Error("Randomness is forbidden"); };', sandbox);
      vm.runInContext(source, sandbox, { filename: 'standings.js' });
      vm.runInContext(fs.readFileSync(__filename, 'utf8'), sandbox, { filename: 'lantern-bowl-standings.cjs' });
      const browser = sandbox.window.LanternBowlStandingsChecks.runChecks(sandbox.window.LanternBowlStandings, season, printFailure);
      console.log('Browser-global VM: ' + browser.passed + '/' + browser.total + ' checks passed; no DOM, SPORT, storage, time or randomness.');
      console.log('Coverage: clean and partial tables; all five tiebreakers; 250 seeded seasons; all four playoff outcomes; malformed inputs; immutability.');
      process.exitCode = result.failed || browser.failed ? 1 : 0;
    }
  } else root.LanternBowlStandingsChecks = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const ids = rows => rows.map(row => row.index);
  const rowKeys = ['index', 'id', 'w', 'l', 'pf', 'pa', 'diff', 'played'];
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.freeze(value); Object.keys(value).forEach(key => freeze(value[key]));
    }
    return value;
  }
  function rng(seed) {
    let value = seed >>> 0;
    return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
  }
  function fullResults(season, ranking) {
    const results = [];
    season.fixtures.forEach((games, week) => games.forEach(([home, away]) => {
      const win = ranking.indexOf(home) < ranking.indexOf(away);
      results.push({ week, home, away, homeScore: win ? 21 : 7, awayScore: win ? 7 : 21 });
    }));
    return results;
  }
  // Independent club-centric oracle: derive each row by filtering its own games,
  // then decorate once with a mini-league key. No production helper is imported.
  function oracle(season, results) {
    const rows = season.clubs.map((club, index) => {
      const matches = results.filter(r => r.home === index || r.away === index);
      const pf = matches.reduce((n, r) => n + (r.home === index ? r.homeScore : r.awayScore), 0);
      const pa = matches.reduce((n, r) => n + (r.home === index ? r.awayScore : r.homeScore), 0);
      const w = matches.filter(r => (r.home === index) === (r.homeScore > r.awayScore)).length;
      return { index, id: club.id, w, l: matches.length - w, pf, pa, diff: pf - pa, played: matches.length };
    });
    const key = row => {
      const tied = rows.filter(other => other.w === row.w).map(other => other.index);
      const h2h = results.filter(r => {
        const winner = r.homeScore > r.awayScore ? r.home : r.away;
        const loser = winner === r.home ? r.away : r.home;
        return winner === row.index && tied.includes(loser);
      }).length;
      return [-row.w, -h2h, -row.diff, -row.pf, row.index];
    };
    return rows.map(row => ({ row, key: key(row) })).sort((a, b) => {
      for (let i = 0; i < a.key.length; i++) if (a.key[i] !== b.key[i]) return a.key[i] < b.key[i] ? -1 : 1;
      return 0;
    }).map(item => item.row);
  }
  function runChecks(S, season, emit) {
    let passed = 0, failed = 0;
    function test(name, fn) {
      let ok = false, detail = '';
      try { ok = fn() === true; if (!ok) detail = 'Expected true'; } catch (error) { detail = String(error && error.message || error); }
      if (ok) passed++; else failed++;
      if (emit) emit(name, ok, detail);
    }
    function rejects(name, fn) {
      test(name, () => { try { fn(); } catch (error) { return typeof error.message === 'string' && error.message.startsWith('LanternBowlStandings:'); } return false; });
    }
    const fixture = (home, away, homeScore, awayScore) => {
      const week = season.fixtures.findIndex(games => games.some(pair => pair[0] === home && pair[1] === away));
      if (week < 0) throw new Error('Test pair is absent from season.json');
      return { week, home, away, homeScore, awayScore };
    };
    const finish = (b, homeWins) => b.semis.map(([home, away], i) => ({ home, away, homeScore: homeWins[i] ? 21 : 7, awayScore: homeWins[i] ? 7 : 21 }));
    const ranking = [4, 2, 5, 0, 3, 1], full = fullResults(season, ranking), clean = S.table(season, full), b = S.bracket(season, clean);
    test('exports exactly the three public pure functions', () => equal(Object.keys(S).sort(), ['advance', 'bracket', 'table']));
    test('clean full-season table follows wins', () => equal(ids(clean), ranking) && equal(clean.map(r => r.w), [10, 8, 6, 4, 2, 0]));
    test('clean rows have exactly the required shape and arithmetic', () => clean.every((r, i) =>
      equal(Object.keys(r), rowKeys) && r.id === season.clubs[ranking[i]].id && r.w + r.l === 10 && r.played === 10 &&
      r.pf === r.w * 21 + r.l * 7 && r.pa === r.l * 21 + r.w * 7 && r.diff === r.pf - r.pa));
    test('all full-season tally invariants hold', () => clean.reduce((n, r) => n + r.w, 0) === 30 &&
      clean.reduce((n, r) => n + r.l, 0) === 30 && clean.reduce((n, r) => n + r.diff, 0) === 0 &&
      clean.reduce((n, r) => n + r.pf, 0) === clean.reduce((n, r) => n + r.pa, 0));
    test('empty season table stays in original club order', () => {
      const rows = S.table(season, []);
      return equal(ids(rows), [0, 1, 2, 3, 4, 5]) && rows.every(r => r.played === 0 && r.w === 0 && r.l === 0 && r.pf === 0 && r.pa === 0 && r.diff === 0);
    });
    const two = [fixture(0, 1, 1, 0), fixture(1, 2, 100, 0)];
    test('two-way H2H wins beat much better overall points difference', () => equal(ids(S.table(season, two)).slice(0, 2), [0, 1]));
    const cycle = [fixture(0, 1, 10, 7), fixture(1, 2, 21, 7), fixture(2, 0, 28, 7)];
    test('three-way cyclic H2H tie falls to overall points difference', () => equal(ids(S.table(season, cycle)).slice(0, 3), [1, 2, 0]));
    const points = [fixture(0, 1, 21, 14), fixture(1, 2, 28, 21), fixture(2, 0, 14, 7)];
    test('points for breaks equal wins, H2H and difference', () => {
      const rows = S.table(season, points).slice(0, 3);
      return equal(ids(rows), [1, 2, 0]) && rows.every(r => r.w === 1 && r.diff === 0) && equal(rows.map(r => r.pf), [42, 35, 28]);
    });
    const index = [fixture(0, 1, 7, 0), fixture(1, 2, 7, 0), fixture(2, 0, 7, 0)];
    test('original club index breaks a complete tie', () => equal(ids(S.table(season, index)).slice(0, 3), [0, 1, 2]));
    const originalGroup = [fixture(0, 1, 7, 0), fixture(1, 0, 0, 7), fixture(1, 2, 7, 0), fixture(0, 2, 0, 7), fixture(1, 4, 7, 0), fixture(2, 5, 35, 0)];
    test('H2H uses the original equal-wins group, without recursive restart', () => equal(ids(S.table(season, originalGroup)).slice(0, 3), [0, 2, 1]));
    test('H2H never lets a lower-win club jump a higher-win club', () => equal(S.table(season, [fixture(0, 1, 0, 7), fixture(0, 2, 7, 0), fixture(0, 3, 7, 0)])[0].index, 0));
    test('split home/away H2H meetings count both games', () => equal(S.table(season, [fixture(0, 1, 10, 0), fixture(1, 0, 7, 0)]).slice(0, 2).map(r => [r.index, r.w, r.l]), [[0, 1, 1], [1, 1, 1]]));
    test('partial season handles uneven games played and unplayed clubs', () => equal(S.table(season, full.slice(0, 7)), oracle(season, full.slice(0, 7))));
    test('last fixture week is accepted independently of prior weeks', () => S.table(season, full.slice(-1)).reduce((n, r) => n + r.played, 0) === 2);
    test('zero is a valid losing score', () => S.table(season, [fixture(0, 1, 0, 2)]).find(r => r.index === 0).pa === 2);
    test('bracket maps seed ranks to actual club indexes', () => equal(b, { semis: [[4, 0], [2, 5]], final: null }));
    test('bracket also projects the current partial table', () => equal(S.bracket(season, S.table(season, [])), { semis: [[0, 3], [1, 2]], final: null }));
    for (const first of [true, false]) for (const second of [true, false]) {
      const scores = finish(b, [first, second]);
      const expected = [first ? 4 : 0, second ? 2 : 5].sort((a, z) => ranking.indexOf(a) - ranking.indexOf(z));
      test('playoff winners preserve original seeds: ' + first + '/' + second, () => equal(S.advance(b, scores), { semis: b.semis, final: expected }));
      test('semi result order does not affect the final: ' + first + '/' + second, () => equal(S.advance(b, scores), S.advance(b, scores.slice().reverse())));
    }
    const scores = finish(b, [false, true]), advanced = S.advance(b, scores);
    test('replaying the same semi results is idempotent', () => equal(S.advance(advanced, scores), advanced));
    test('results table and brackets do not alias or mutate their inputs', () => {
      const s = freeze(clone(season)), r = freeze(clone(full));
      const t = freeze(S.table(s, r)), semis = freeze(S.bracket(s, t)), semiScores = freeze(finish(semis, [false, true]));
      const before = JSON.stringify([s, r, t, semis, semiScores]), done = S.advance(semis, semiScores);
      done.semis[0][0] = 99; done.final[0] = 99;
      const again = S.table(s, r); again[0].id = 'changed';
      return before === JSON.stringify([s, r, t, semis, semiScores]) && S.table(s, r)[0].id === season.clubs[4].id;
    });

    // Contract rejection checks: bad result data must not be silently counted.
    for (const bad of [null, {}, 1, 'results']) rejects('reject results array ' + JSON.stringify(bad), () => S.table(season, bad));
    const one = fixture(0, 1, 7, 0);
    for (const [key, bads] of Object.entries({ week: [-1, 10, 0.5, '1', NaN, Infinity], home: [-1, 6, 1.2, '0', NaN], away: [-1, 6, '1'], homeScore: [-1, 1.5, '7', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1], awayScore: [-1, null, true] })) {
      for (let i = 0; i < bads.length; i++) rejects('reject bad result ' + key + '/' + i, () => S.table(season, [{ ...one, [key]: bads[i] }]));
    }
    rejects('reject a valid pairing in the wrong week', () => S.table(season, [{ ...one, week: 0 }]));
    rejects('reject reversed home and away in the same week', () => S.table(season, [{ ...one, home: 1, away: 0 }]));
    rejects('reject self-match', () => S.table(season, [{ ...one, away: 0 }]));
    rejects('reject overtime tie', () => S.table(season, [{ ...one, awayScore: 7 }]));
    rejects('reject duplicate result', () => S.table(season, [one, { ...one }]));
    rejects('reject unknown result field', () => S.table(season, [{ ...one, score: 7 }]));
    rejects('reject missing result field', () => { const r = { ...one }; delete r.week; return S.table(season, [r]); });
    rejects('reject null result', () => S.table(season, [null]));
    rejects('reject sparse results', () => S.table(season, new Array(1)));
    rejects('reject accumulated score overflow', () => S.table(season, [fixture(0, 1, Number.MAX_SAFE_INTEGER, 0), fixture(0, 2, 1, 0)]));
    test('single maximum-safe score stays exact', () => S.table(season, [fixture(0, 1, Number.MAX_SAFE_INTEGER, 0)])[0].pf === Number.MAX_SAFE_INTEGER);
    let calls = 0;
    const getter = { ...one }; Object.defineProperty(getter, 'homeScore', { enumerable: true, get() { calls++; return 7; } });
    rejects('reject accessor result without running its getter', () => S.table(season, [getter]));
    test('result getter was not invoked', () => calls === 0);
    const inherited = Object.create(one);
    rejects('reject inherited result fields', () => S.table(season, [inherited]));
    const hooked = [one]; hooked[Symbol.iterator] = () => { throw new Error('input iterator called'); }; hooked.map = () => { throw new Error('input map called'); };
    test('caller array methods and iterators are not invoked', () => equal(S.table(season, hooked), S.table(season, [one])));
    const nullRecord = Object.assign(Object.create(null), one);
    test('null-prototype result records work', () => equal(S.table(season, [nullRecord]), S.table(season, [one])));

    const seasonMutations = [
      ['missing clubs', s => { delete s.clubs; }], ['duplicate club ID', s => { s.clubs[1].id = s.clubs[0].id; }],
      ['empty club ID', s => { s.clubs[0].id = ' '; }], ['too few clubs', s => { s.clubs.length = 3; }],
      ['bad weeks', s => { s.weeks = 0; }], ['weeks length mismatch', s => { s.weeks = 9; }],
      ['sparse week', s => { delete s.fixtures[0]; }], ['bad pair size', s => { s.fixtures[0][0].push(2); }],
      ['duplicate weekly club', s => { s.fixtures[0][1][0] = 0; }], ['self fixture', s => { s.fixtures[0][0] = [0, 0]; }],
      ['out of range fixture', s => { s.fixtures[0][0][1] = 6; }], ['bad playoff teams', s => { s.playoffs.teams = 2; }],
      ['bad playoff seeding', s => { s.playoffs.seeding = 'random'; }], ['bad playoff rounds', s => { s.playoffs.rounds.reverse(); }]
    ];
    for (const [name, change] of seasonMutations) rejects('reject season: ' + name, () => { const s = clone(season); change(s); return S.table(s, []); });
    rejects('reject null season', () => S.table(null, []));
    for (const [name, change] of [
      ['duplicate club', t => { t[1] = { ...t[0] }; }], ['wrong id', t => { t[0].id = 'unknown'; }],
      ['bad played', t => { t[0].played--; }], ['bad difference', t => { t[0].diff++; }],
      ['negative points', t => { t[0].pf = -1; }], ['unknown field', t => { t[0].seed = 1; }],
      ['missing row', t => { t.pop(); }], ['sparse row', t => { delete t[0]; }],
      ['unsorted wins', t => { [t[0], t[1]] = [t[1], t[0]]; }]
    ]) rejects('reject bracket table: ' + name, () => { const t = clone(clean); change(t); return S.bracket(season, t); });
    for (const [name, change] of [
      ['duplicate club', x => { x.semis[0][1] = x.semis[0][0]; }], ['invalid club index', x => { x.semis[1][0] = -1; }],
      ['wrong semi count', x => { x.semis.pop(); }], ['wrong pair size', x => { x.semis[0].push(3); }],
      ['unrelated final', x => { x.final = [4, 5]; }], ['unknown field', x => { x.seed = 1; }]
    ]) rejects('reject advance bracket: ' + name, () => { const x = clone(b); change(x); return S.advance(x, scores); });
    rejects('reject null bracket', () => S.advance(null, scores));
    rejects('reject missing semifinal', () => S.advance(b, scores.slice(0, 1)));
    rejects('reject duplicate semifinal', () => S.advance(b, [scores[0], scores[0]]));
    rejects('reject tied semifinal', () => S.advance(b, [{ ...scores[0], homeScore: 7, awayScore: 7 }, scores[1]]));
    rejects('reject reversed semifinal home', () => S.advance(b, [{ ...scores[0], home: scores[0].away, away: scores[0].home }, scores[1]]));
    rejects('reject unrelated semifinal', () => S.advance(b, [{ ...scores[0], away: 1 }, scores[1]]));
    rejects('reject fractional semifinal score', () => S.advance(b, [{ ...scores[0], homeScore: 7.5 }, scores[1]]));
    rejects('reject negative semifinal score', () => S.advance(b, [{ ...scores[0], awayScore: -1 }, scores[1]]));
    rejects('reject fixture-week field on semifinal', () => S.advance(b, [{ ...scores[0], week: 10 }, scores[1]]));

    for (let seed = 1; seed <= 250; seed++) {
      const random = rng(seed), generated = full.map(r => {
        const homeScore = Math.floor(random() * 57), awayScore = Math.floor(random() * 57);
        return { ...r, homeScore, awayScore: awayScore === homeScore ? awayScore + 1 : awayScore };
      });
      const partial = generated.filter(() => random() < 0.5), actual = S.table(season, generated);
      test('seed ' + seed + ': full and partial season agree with independent oracle', () => equal(actual, oracle(season, generated)) && equal(S.table(season, partial), oracle(season, partial)));
      test('seed ' + seed + ': result order cannot alter any tiebreaker', () => equal(actual, S.table(season, generated.slice().reverse())) && equal(S.table(season, partial), S.table(season, partial.slice().reverse())));
      test('seed ' + seed + ': all full-season accounting balances', () => actual.every(r => r.w + r.l === 10 && r.played === 10 && r.diff === r.pf - r.pa) && actual.reduce((n, r) => n + r.w, 0) === 30 && actual.reduce((n, r) => n + r.diff, 0) === 0);
      test('seed ' + seed + ': uniform score shift preserves full-season order', () => equal(ids(actual), ids(S.table(season, generated.map(r => ({ ...r, homeScore: r.homeScore + 3, awayScore: r.awayScore + 3 }))))));
      test('seed ' + seed + ': positive scaling preserves partial-season order', () => equal(ids(S.table(season, partial)), ids(S.table(season, partial.map(r => ({ ...r, homeScore: r.homeScore * 3, awayScore: r.awayScore * 3 }))))));
      test('seed ' + seed + ': playoff seeding survives either upset', () => {
        const bracket = S.bracket(season, actual), outcome = finish(bracket, [random() < 0.5, random() < 0.5]);
        const expected = outcome.map(r => r.homeScore > r.awayScore ? r.home : r.away).sort((a, z) => ids(actual).indexOf(a) - ids(actual).indexOf(z));
        return equal(S.advance(bracket, outcome).final, expected);
      });
    }
    return { passed, failed, total: passed + failed };
  }
  return { runChecks };
});
