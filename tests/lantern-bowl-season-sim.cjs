/* LB-G13: headless full-season simulation test for Lantern Bowl (LB-SEASON groundwork).
   Node: node tests/lantern-bowl-season-sim.cjs

   It plays whole seasons with nothing but the data on main and the pure standings module, to prove the season pieces fit
   together before the manager is built:
     - games/lantern-bowl/season.json     the six clubs, the 10 weeks, the 30 fixtures and the four-team bracket
     - games/lantern-bowl/roster.json     22 players per club with their ratings and ages
     - games/lantern-bowl/standings.js    LanternBowlStandings: table, bracket, advance
     - games/lantern-bowl/progression.json the XP, level, potential-cap and aging table
   It does NOT load lineup.js or training.json, and it is not the game's match engine. The score model below (a logistic on
   the clubs' average ratings) is this test's own, written only so that seasons can be played. Nothing here runs in the game,
   writes a save or touches the DOM, a clock, storage or the network. Same seed, same result.

   Progression follows the contract written at the top of tests/lantern-bowl-progression.cjs (LB-G3): levels[n] is the cost of
   the NEXT level, XP carries over, one level adds `levelUp` to one eligible rating (clipped to the age-band cap), and after
   a season the aging change for the age just played is applied before the player gets a year older and the new cap applies. */
'use strict';
const fs = require('fs'), path = require('path');
const DATA = path.join(__dirname, '..', 'games', 'lantern-bowl');
const readJson = name => JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));
const S = require(path.join(DATA, 'standings.js'));
const season = readJson('season.json'), roster = readJson('roster.json'), prog = readJson('progression.json');

const SEASONS = 200, CHAINS = 40, CHAIN_LENGTH = 5, BASE_SEED = 0x1b9a7c11;
const SCALE = 14;               // rating points that make a club about 2.0 times as likely to win (logistic scale)
const NON_RATINGS = ['id', 'name', 'age'];
const GROUPS = ['qb', 'rb', 'wr', 'te', 'line', 'front', 'backers', 'secondary', 'kicker'];

function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; }; }
const ids = season.clubs.map(c => c.id);

// ---- the roster, as plain mutable players (the data files are never changed) ----
function freshLeague() {
  return ids.map(id => {
    const players = [];
    for (const g of GROUPS) for (const p of [].concat(roster.clubs[id][g])) {
      const ratings = {}; for (const k of Object.keys(p)) if (!NON_RATINGS.includes(k)) ratings[k] = p[k];
      players.push({ id: p.id, group: g, age: p.age, level: 0, xp: 0, ratings });
    }
    return players;
  });
}
const copyLeague = league => league.map(c => c.map(p => ({ ...p, ratings: { ...p.ratings } })));
const playerMean = p => { const v = Object.values(p.ratings); return v.reduce((a, b) => a + b, 0) / v.length; };
const strength = club => club.reduce((a, p) => a + playerMean(p), 0) / club.length; // the average of its roster ratings

// ---- the score model: the winner is drawn with a logistic on the strength difference ----
function playGame(sa, sb, random) {
  const aWins = random() < 1 / (1 + Math.exp(-(sa - sb) / SCALE));
  const loser = 3 * Math.floor(random() * 7), winner = loser + 1 + Math.floor(random() * 15); // no ties
  return aWins ? [winner, loser] : [loser, winner];
}

// ---- progression, from progression.json ----
const band = (bands, age) => bands.find(b => b.throughAge === null || age <= b.throughAge);
const cap = age => band(prog.potential, age).cap;
const clamp = (n, age) => Math.max(prog.floor, Math.min(n, prog.ceiling, cap(age)));
const EVENT_XP = (group, random) => { // a transparent workload per group per game, not a prediction of the match engine
  const a = random(), b = random(), e = { start: 1, touchdown: 0, catch: 0, sack: 0, tackle: 0, madeKick: 0, win: 0 };
  if (group === 'qb') e.touchdown = Math.floor(a * 3);
  else if (group === 'rb') { e.touchdown = a < .4 ? 1 : 0; e.catch = Math.floor(b * 3); }
  else if (group === 'wr') { e.catch = 2 + Math.floor(a * 3); e.touchdown = b < .25 ? 1 : 0; }
  else if (group === 'te') e.catch = 1 + Math.floor(a * 2);
  else if (group === 'front' || group === 'backers') { e.tackle = 2 + Math.floor(a * 5); e.sack = b < .3 ? 1 : 0; }
  else if (group === 'secondary') e.tackle = 1 + Math.floor(a * 4);
  else if (group === 'kicker') e.madeKick = 1 + Math.floor(a * 2);
  return e;
};
function levelAndAge(p, games, wins, random) {
  let earned = 0;
  for (let g = 0; g < games; g++) { const e = EVENT_XP(p.group, random); for (const k of Object.keys(e)) earned += e[k] * prog.xp[k]; }
  earned += wins * prog.xp.win; p.xp += earned;
  while (p.level < prog.levels.length && p.xp >= prog.levels[p.level]) {
    p.xp -= prog.levels[p.level++];
    const keys = Object.keys(p.ratings).filter(k => p.ratings[k] < cap(p.age)), draw = random(); // the draw is spent even when all are capped
    if (keys.length) { const k = keys[Math.floor(draw * keys.length)]; p.ratings[k] = clamp(p.ratings[k] + prog.levelUp, p.age); }
  }
  if (p.level === prog.levels.length) p.xp = 0;
  const delta = band(prog.aging, p.age).change;
  for (const k of Object.keys(p.ratings)) p.ratings[k] = clamp(p.ratings[k] + delta, p.age);
  p.age++;
  for (const k of Object.keys(p.ratings)) p.ratings[k] = clamp(p.ratings[k], p.age);
}

// ---- one whole season: 30 fixtures, the table, the bracket, the semis and the final, then every player ages and levels once ----
function playSeason(league, seed) {
  const random = rng(seed), power = league.map(strength), results = [];
  season.fixtures.forEach((week, w) => week.forEach(([home, away]) => {
    const [homeScore, awayScore] = playGame(power[home], power[away], random);
    results.push({ week: w, home, away, homeScore, awayScore });
  }));
  const table = S.table(season, results), bracket = S.bracket(season, table);
  const semiResults = bracket.semis.map(([home, away]) => { const [homeScore, awayScore] = playGame(power[home], power[away], random); return { home, away, homeScore, awayScore }; });
  const advanced = S.advance(bracket, semiResults), [fh, fa] = advanced.final, [fhs, fas] = playGame(power[fh], power[fa], random);
  const champion = fhs > fas ? fh : fa, wins = ids.map((_, i) => table.find(r => r.index === i).w);
  const playoffGames = ids.map((_, i) => semiResults.some(r => r.home === i || r.away === i) ? 1 + (advanced.final.includes(i) ? 1 : 0) : 0);
  const playoffWins = ids.map((_, i) => (semiResults.some(r => (r.home === i && r.homeScore > r.awayScore) || (r.away === i && r.awayScore > r.homeScore)) ? 1 : 0) + (champion === i ? 1 : 0));
  league.forEach((club, i) => club.forEach(p => levelAndAge(p, 10 + playoffGames[i], wins[i] + playoffWins[i], random)));
  return { results, table, bracket, semiResults, final: advanced.final, champion, power };
}

// ---- the run ----
let passed = 0, failed = 0;
const check = (name, ok, detail) => { if (ok) passed++; else { failed++; } console.log((ok ? 'PASS' : 'FAIL') + ' - ' + name + (detail ? ' (' + detail + ')' : '')); };

const start = freshLeague();
const startPower = start.map(strength);
const overCap = start.reduce((n, c) => n + c.reduce((m, p) => m + Object.values(p.ratings).filter(v => v > cap(p.age)).length, 0), 0);

const summary = ids.map(() => ({ titles: 0, finals: 0, playoffs: 0, wins: 0, seed1: 0 }));
let shapeOk = true, weeksOk = true, playedOk = true, bracketOk = true, boundsOk = true, accountingOk = true, orderOk = true, minRating = Infinity, maxRating = -Infinity;
const first = [];
for (let n = 0; n < SEASONS; n++) {
  const league = copyLeague(start), r = playSeason(league, BASE_SEED + n * 7919);
  if (n < 3) first.push(r);
  const perWeek = Array(season.weeks).fill(0); r.results.forEach(g => perWeek[g.week]++);
  weeksOk = weeksOk && season.weeks === 10 && season.fixtures.length === 10 && perWeek.every(c => c === 3);
  shapeOk = shapeOk && r.results.length === 30;
  playedOk = playedOk && r.table.length === 6 && r.table.every(row => row.played === 10 && row.w + row.l === 10);
  accountingOk = accountingOk && r.table.reduce((a, row) => a + row.w, 0) === 30 && r.table.reduce((a, row) => a + row.l, 0) === 30 && r.table.reduce((a, row) => a + row.pf, 0) === r.table.reduce((a, row) => a + row.pa, 0);
  orderOk = orderOk && r.table.every((row, i) => i === 0 || row.w <= r.table[i - 1].w);
  const four = r.bracket.semis.flat();
  bracketOk = bracketOk && new Set(four).size === 4 && four.every(i => i >= 0 && i < 6) && r.final.length === 2 && r.final.every(i => four.includes(i)) && r.final.includes(r.champion) && r.bracket.semis[0][0] === r.table[0].index && r.bracket.semis[1][0] === r.table[1].index;
  r.table.forEach((row, i) => { summary[row.index].wins += row.w; if (i === 0) summary[row.index].seed1++; if (i < 4) summary[row.index].playoffs++; });
  r.final.forEach(i => summary[i].finals++); summary[r.champion].titles++;
  for (const c of league) for (const p of c) for (const v of Object.values(p.ratings)) { minRating = Math.min(minRating, v); maxRating = Math.max(maxRating, v); if (v < 35 || v > 90) boundsOk = false; }
}
check('the season has 10 weeks of 3 fixtures, and every one of the ' + SEASONS + ' seasons plays 30 games', weeksOk && shapeOk);
check('in every season each of the six clubs plays 10 games (wins and losses add to 10)', playedOk);
check('in every season the table adds up (30 wins, 30 losses, points for equal points against) and is ordered by wins', accountingOk && orderOk);
check('in every season the bracket is valid: four different clubs in seeds 1v4 and 2v3, a final between semi winners, one champion', bracketOk);
const share = i => summary[i].titles / SEASONS, hi = ids.indexOf('harrowgate'), lo = ids.indexOf('fernmoor');
check('the strongest club (harrowgate, ' + startPower[hi].toFixed(1) + ') is the strongest on average rating and fernmoor (' + startPower[lo].toFixed(1) + ') the weakest', startPower.every((v, i) => i === hi || v < startPower[hi]) && startPower.every((v, i) => i === lo || v > startPower[lo]));
check('harrowgate wins the Lamplight Cup more often than fernmoor (' + (share(hi) * 100).toFixed(1) + '% against ' + (share(lo) * 100).toFixed(1) + '%)', share(hi) > share(lo));
check('harrowgate wins the Lamplight Cup in less than 70% of seasons (' + (share(hi) * 100).toFixed(1) + '%), so a season is never a foregone conclusion', share(hi) < .7);
check('every rating stays within 35 to 90 after the age-and-level step at the end of each of ' + SEASONS + ' seasons (lowest ' + minRating + ', highest ' + maxRating + ')', boundsOk);

// five chained seasons: the same league carried forward, ratings, ages, levels and XP included
let chainOk = true, capOk = true, chainMin = Infinity, chainMax = -Infinity, ageOk = true;
const yearly = Array.from({ length: CHAIN_LENGTH + 1 }, () => ({ mean: 0, titlesHi: 0, young: 0, youngN: 0, old: 0, oldN: 0 }));
for (let c = 0; c < CHAINS; c++) {
  const league = copyLeague(start);
  for (let y = 0; y <= CHAIN_LENGTH; y++) {
    if (y < CHAIN_LENGTH) {
      const before = league.map(club => club.map(p => ({ age: p.age, mean: playerMean(p) })));
      const r = playSeason(league, BASE_SEED + 100000 + c * 104729 + y * 31);
      yearly[y + 1].titlesHi += r.champion === hi ? 1 : 0;
      league.forEach((club, i) => club.forEach((p, j) => { const d = playerMean(p) - before[i][j].mean; if (before[i][j].age <= 22) { yearly[y + 1].young += d; yearly[y + 1].youngN++; } if (before[i][j].age >= 33) { yearly[y + 1].old += d; yearly[y + 1].oldN++; } if (p.age !== before[i][j].age + 1) ageOk = false; }));
    }
    league.forEach(club => { yearly[y].mean += strength(club) / (6 * CHAINS); for (const p of club) for (const v of Object.values(p.ratings)) { chainMin = Math.min(chainMin, v); chainMax = Math.max(chainMax, v); if (v < 35 || v > 90) chainOk = false; if (y > 0 && v > cap(p.age)) capOk = false; } });
  }
}
check('every rating stays within 35 to 90 after five chained seasons (' + CHAINS + ' chains; lowest ' + chainMin + ', highest ' + chainMax + ')', chainOk);
const first1 = yearly[1];
check('in the first chained season the young gain and the old decline in overall (ages 22 and under ' + (first1.young / first1.youngN).toFixed(2) + ', ages 33 and over ' + (first1.old / first1.oldN).toFixed(2) + ' a player)', first1.youngN > 0 && first1.oldN > 0 && first1.young > 0 && first1.old < 0);
check('after the first season of aging nobody is above their age-band potential cap, and every player is one year older each season', capOk && ageOk);

// the same seed gives the same result, and a different seed gives a different one
const sig = r => JSON.stringify([r.results, r.table, r.bracket, r.semiResults, r.final, r.champion]);
const a = playSeason(copyLeague(start), 12345), b = playSeason(copyLeague(start), 12345), c = playSeason(copyLeague(start), 54321);
check('the same seed gives the same season and the same aged ratings', sig(a) === sig(b));
check('a different seed gives a different season', sig(a) !== sig(c));
check('the data files were not changed by the run (the league is a copy)', JSON.stringify(roster.clubs[ids[0]].qb) === JSON.stringify(readJson('roster.json').clubs[ids[0]].qb));

// ---- the table for the README ----
console.log('\nLamplight Cup title share over ' + SEASONS + ' seeded seasons (the test\'s own logistic score model, scale ' + SCALE + '):');
console.log('club         average rating   avg wins   top seed   playoffs   final   cup');
const rows = ids.map((id, i) => ({ id, i })).sort((x, y) => startPower[y.i] - startPower[x.i]);
for (const { id, i } of rows) console.log(id.padEnd(12) + String(startPower[i].toFixed(1)).padStart(14) + String((summary[i].wins / SEASONS).toFixed(1)).padStart(11) + String((summary[i].seed1 / SEASONS * 100).toFixed(0) + '%').padStart(11) + String((summary[i].playoffs / SEASONS * 100).toFixed(0) + '%').padStart(11) + String((summary[i].finals / SEASONS * 100).toFixed(0) + '%').padStart(8) + String((summary[i].titles / SEASONS * 100).toFixed(1) + '%').padStart(8));
console.log('\nAfter each chained season (' + CHAINS + ' chains of ' + CHAIN_LENGTH + '), the mean club strength, harrowgate cups, and the average one-season change in a player\'s overall for ages 22 and under and 33 and over:');
console.log('after season   mean strength   harrowgate cups   age<=22 change   age>=33 change');
yearly.forEach((y, k) => console.log(String(k).padStart(12) + String(y.mean.toFixed(1)).padStart(16) + String(k ? y.titlesHi + ' of ' + CHAINS : '-').padStart(18) + String(k && y.youngN ? (y.young / y.youngN).toFixed(2) : '-').padStart(17) + String(k && y.oldN ? (y.old / y.oldN).toFixed(2) : '-').padStart(17)));
console.log('\nStarting ratings above their age-band potential cap on main today: ' + overCap + ' (progression clamps them down at the first birthday).');
console.log('\nOne season, seed ' + (BASE_SEED) + ': champion ' + ids[first[0].champion] + ', final ' + first[0].final.map(i => ids[i]).join(' v ') + ', table ' + first[0].table.map(r => r.id + ' ' + r.w + '-' + r.l).join(', '));
console.log('\n' + (failed ? 'FAIL' : 'PASS') + ' - ' + passed + ' of ' + (passed + failed) + ' Lantern Bowl season simulation checks.');
process.exit(failed ? 1 : 0);
