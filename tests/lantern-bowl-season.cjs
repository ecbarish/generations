/* LB-G2: dependency-free checks for Node and a later browser test page.
   Browser: LanternSeasonChecks.runChecks(data, (name, ok) => check(name, ok)).
   Node: node tests/lantern-bowl-season.cjs
   No match engine, DOM, timers, save or storage integration. Club indices are
   the sports-office contract; index 0 is the player. Contrast uses sRGB relative
   luminance against the existing ink outline. The authored fixtures match
   makeSchedule(10); validation also permits any other fair ordering. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LanternSeasonChecks = api;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const IDS = ['brackenport', 'millrace', 'harrowgate', 'tollbridge', 'quarryhill', 'fernmoor'];
  const ROOT_FIELDS = ['schemaVersion', 'clubs', 'weeks', 'quarterSeconds', 'fixtures', 'playoffs', 'trophy'];
  const CLUB_FIELDS = ['id', 'name', 'short', 'color', 'field'];
  const PLAYOFF_FIELDS = ['teams', 'rounds', 'seeding'];
  const INK = '#1e1a22';
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]';
  const hex = value => typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
  const rgb = color => [1, 3, 5].map(at => parseInt(color.slice(at, at + 2), 16));
  function luminance(color) {
    const linear = rgb(color).map(value => value / 255).map(value =>
      value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4));
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  }
  function contrast(a, b) {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function distance(a, b) {
    const x = rgb(a), y = rgb(b);
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
  }

  function validate(data) {
    const errors = [];
    const error = (path, message) => errors.push(path + ': ' + message);
    function record(value, fields, path) {
      if (!object(value)) { error(path, 'must be an object'); return false; }
      let valid = true;
      for (const key of Reflect.ownKeys(value)) {
        if (typeof key !== 'string' || !fields.includes(key)) {
          error(path, 'unknown field ' + String(key)); valid = false;
        } else {
          const descriptor = Object.getOwnPropertyDescriptor(value, key);
          if (!own(descriptor, 'value') || !descriptor.enumerable) {
            error(path + '.' + key, 'must be an enumerable data field'); valid = false;
          }
        }
      }
      for (const field of fields) if (!own(value, field)) {
        error(path + '.' + field, 'is required'); valid = false;
      }
      return valid;
    }
    function array(value, length, path) {
      if (!Array.isArray(value)) { error(path, 'must be an array'); return false; }
      if (value.length !== length) { error(path, 'must contain exactly ' + length + ' entries'); return false; }
      let valid = true;
      for (const key of Reflect.ownKeys(value)) {
        if (key === 'length') continue;
        if (typeof key !== 'string' || !/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length) {
          error(path, 'unknown array field ' + String(key)); valid = false;
        }
      }
      for (let i = 0; i < length; i++) {
        const descriptor = Object.getOwnPropertyDescriptor(value, i);
        if (!descriptor || !own(descriptor, 'value') || !descriptor.enumerable) {
          error(path + '[' + i + ']', 'must be an enumerable data item (no sparse arrays)'); valid = false;
        }
      }
      return valid;
    }
    function text(value, path) {
      if (typeof value !== 'string' || !value.trim()) { error(path, 'must be nonempty text'); return false; }
      return true;
    }
    try {
      if (!record(data, ROOT_FIELDS, 'season')) return errors;
      if (data.schemaVersion !== 1) error('schemaVersion', 'must be 1');
      if (data.weeks !== 10) error('weeks', 'must be 10');
      if (data.quarterSeconds !== 120) error('quarterSeconds', 'must be 120');
      text(data.trophy, 'trophy');
      if (array(data.clubs, 6, 'clubs')) {
        const colors = [];
        for (let i = 0; i < 6; i++) {
          const club = data.clubs[i], path = 'clubs[' + i + ']';
          if (!record(club, CLUB_FIELDS, path)) continue;
          if (club.id !== IDS[i]) error(path + '.id', 'must be ' + IDS[i] + ' in this index');
          for (const key of ['name', 'short', 'field']) text(club[key], path + '.' + key);
          if (!hex(club.color)) error(path + '.color', 'must be a six-digit hex colour');
          else {
            colors.push([i, club.color]);
            if (contrast(club.color, INK) < 3) error(path + '.color', 'must have at least 3:1 contrast against ' + INK);
          }
          const kept = i === 0 ? { name: 'Brackenport Lanterns', short: 'Lanterns', color: '#c45a32', field: 'Lamplight Field' } :
            i === 1 ? { name: 'Millrace', short: 'Millrace', color: '#2d6f80' } : null;
          if (kept) for (const key of Object.keys(kept)) {
            if (club[key] !== kept[key]) error(path + '.' + key, 'must preserve ' + kept[key]);
          }
        }
        for (let i = 0; i < colors.length; i++) for (let j = i + 1; j < colors.length; j++) {
          if (distance(colors[i][1], colors[j][1]) < 40) error('clubs.color',
            'indices ' + colors[i][0] + ' and ' + colors[j][0] + ' must have RGB distance at least 40');
        }
      }
      if (array(data.fixtures, 10, 'fixtures')) {
        const homes = Array(6).fill(0), aways = Array(6).fill(0);
        const meetings = Array.from({ length: 6 }, () => Array(6).fill(0));
        for (let week = 0; week < 10; week++) {
          const day = data.fixtures[week], path = 'fixtures[' + week + ']';
          if (!array(day, 3, path)) continue;
          const seen = Array(6).fill(0);
          for (let game = 0; game < 3; game++) {
            const pair = day[game], here = path + '[' + game + ']';
            if (!array(pair, 2, here)) continue;
            if (!pair.every(index => Number.isInteger(index) && index >= 0 && index < 6)) {
              error(here, 'club indices must be integers from 0 to 5'); continue;
            }
            const [home, away] = pair;
            if (home === away) { error(here, 'a club cannot play itself'); continue; }
            seen[home]++; seen[away]++;
            homes[home]++; aways[away]++; meetings[home][away]++;
          }
          for (let club = 0; club < 6; club++) {
            if (seen[club] !== 1) error(path, IDS[club] + ' must play exactly once this week');
          }
          if (week === 0 && seen[0] !== 1) error(path, 'Brackenport must play in week 1');
        }
        for (let club = 0; club < 6; club++) {
          if (homes[club] !== 5 || aways[club] !== 5) error('fixtures', IDS[club] + ' must have 5 home and 5 away games');
          for (let opponent = club + 1; opponent < 6; opponent++) {
            if (meetings[club][opponent] !== 1 || meetings[opponent][club] !== 1) error('fixtures',
              IDS[club] + '/' + IDS[opponent] + ' must meet twice, once at each home ground');
          }
        }
      }
      if (record(data.playoffs, PLAYOFF_FIELDS, 'playoffs')) {
        if (data.playoffs.teams !== 4) error('playoffs.teams', 'must be 4');
        if (data.playoffs.seeding !== 'standings') error('playoffs.seeding', 'must be standings');
        if (array(data.playoffs.rounds, 2, 'playoffs.rounds') &&
            (data.playoffs.rounds[0] !== 'semi' || data.playoffs.rounds[1] !== 'final')) {
          error('playoffs.rounds', 'must be semi then final');
        }
      }
    } catch (_) {
      // Hostile objects are not JSON, but callers get a rejection, not a crash.
      error('season', 'must be inspectable plain data');
    }
    return errors;
  }

  function runChecks(data, check) {
    if (typeof check !== 'function') throw new TypeError('runChecks requires check(name, boolean)');
    let count = 0;
    const report = (name, ok) => { count++; check('season: ' + name, Boolean(ok)); };
    const errors = validate(data);
    report('authored data satisfies the season contract' + (errors.length ? ' (' + errors.join('; ') + ')' : ''), errors.length === 0);
    if (errors.length) return count;
    const original = JSON.stringify(data), clone = () => JSON.parse(original);
    function reject(name, mutate, expected) {
      const fixture = clone(); mutate(fixture);
      const found = validate(fixture);
      report(name, found.length > 0 && (!expected || found.some(message => message.includes(expected))));
    }
    function accept(name, mutate) {
      const fixture = clone(); mutate(fixture);
      report(name, validate(fixture).length === 0);
    }
    for (let i = 0; i < 6; i++) {
      const games = data.fixtures.flat().filter(pair => pair.includes(i));
      report(IDS[i] + ' has 10 games, 5 home and 5 away', games.length === 10 &&
        games.filter(pair => pair[0] === i).length === 5 && games.filter(pair => pair[1] === i).length === 5);
      report(IDS[i] + ' has a different opponent in each first-half week',
        new Set(data.fixtures.slice(0, 5).flat().filter(pair => pair.includes(i)).map(pair => pair.find(index => index !== i))).size === 5);
      report(IDS[i] + ' stands apart from the ink outline', contrast(data.clubs[i].color, INK) >= 3);
      for (let j = i + 1; j < 6; j++) {
        report(IDS[i] + '/' + IDS[j] + ' play once at each ground',
          data.fixtures.flat().filter(pair => pair[0] === i && pair[1] === j).length === 1 &&
          data.fixtures.flat().filter(pair => pair[0] === j && pair[1] === i).length === 1);
        report(IDS[i] + '/' + IDS[j] + ' have distinct colours', distance(data.clubs[i].color, data.clubs[j].color) >= 40);
      }
    }
    report('contrast treats black and white as 21:1', Math.abs(contrast('#000000', '#ffffff') - 21) < 1e-12);
    report('contrast is symmetric and identical colours have ratio 1', contrast('#c45a32', INK) === contrast(INK, '#c45a32') && contrast(INK, INK) === 1);
    report('RGB distance uses all three channels', distance('#000000', '#182000') === 40 && distance('#000000', '#000028') === 40);
    report('validation is deterministic', JSON.stringify(validate(data)) === JSON.stringify(errors));
    for (const value of [null, undefined, 1, 'season', true, [], new Date(0), function () {}]) {
      report('rejects non-record root ' + String(value), validate(value).length > 0);
    }
    for (const field of ROOT_FIELDS) reject('requires ' + field, value => { delete value[field]; }, field);
    for (const field of ['schemaVersion', 'weeks', 'quarterSeconds']) {
      for (const bad of [0, -1, 1.5, String(data[field]), null, true, NaN, Infinity]) {
        reject('rejects invalid ' + field + ' ' + String(bad) + ' (' + typeof bad + ')', value => { value[field] = bad; }, field);
      }
    }
    for (const [name, set] of [
      ['clubs', (v, x) => { v.clubs = x; }], ['club', (v, x) => { v.clubs[2] = x; }],
      ['fixtures', (v, x) => { v.fixtures = x; }], ['week', (v, x) => { v.fixtures[0] = x; }],
      ['game', (v, x) => { v.fixtures[0][0] = x; }], ['playoffs', (v, x) => { v.playoffs = x; }],
      ['rounds', (v, x) => { v.playoffs.rounds = x; }]
    ]) for (const bad of [null, false, 6, 'wrong', {}, []]) {
      reject('rejects malformed ' + name + ' ' + JSON.stringify(bad), value => set(value, bad));
    }
    for (const field of CLUB_FIELDS) reject('requires club ' + field, value => { delete value.clubs[2][field]; }, field);
    for (const field of PLAYOFF_FIELDS) reject('requires playoff ' + field, value => { delete value.playoffs[field]; }, field);
    for (const [name, get] of [['root', v => v], ['club', v => v.clubs[2]], ['playoffs', v => v.playoffs]]) {
      reject('rejects unknown ' + name + ' fields', value => { get(value).extra = true; }, 'unknown field');
      reject('rejects symbol ' + name + ' fields', value => { get(value)[Symbol('extra')] = true; }, 'unknown field');
    }
    for (const [name, get] of [['clubs', v => v.clubs], ['fixtures', v => v.fixtures],
      ['week', v => v.fixtures[0]], ['game', v => v.fixtures[0][0]], ['rounds', v => v.playoffs.rounds]]) {
      reject('rejects sparse ' + name, value => { delete get(value)[0]; }, 'no sparse arrays');
      reject('rejects an extra ' + name + ' entry', value => { get(value).push(get(value)[0]); }, 'exactly');
      reject('rejects a missing ' + name + ' entry', value => { get(value).pop(); }, 'exactly');
      reject('rejects extra ' + name + ' array properties', value => { get(value).extra = 0; }, 'unknown array field');
      reject('rejects getter ' + name + ' items without invoking them', value => {
        Object.defineProperty(get(value), 0, { enumerable: true, get() { throw new Error('not data'); } });
      }, 'enumerable data item');
    }
    reject('rejects an enormous sparse fixture list promptly', value => { value.fixtures.length = 4294967295; }, 'exactly 10');
    reject('rejects an unknown club ID', value => { value.clubs[2].id = 'unknown'; }, '.id');
    reject('rejects a duplicate club ID', value => { value.clubs[2].id = value.clubs[1].id; }, '.id');
    reject('rejects clubs out of order', value => { [value.clubs[2], value.clubs[3]] = [value.clubs[3], value.clubs[2]]; }, '.id');
    for (const field of ['name', 'short', 'color', 'field']) {
      reject('preserves Brackenport ' + field, value => { value.clubs[0][field] = field === 'color' ? '#c55a32' : 'Changed'; }, 'must preserve');
    }
    for (const field of ['name', 'short', 'color']) {
      reject('preserves Millrace ' + field, value => { value.clubs[1][field] = field === 'color' ? '#2e6f80' : 'Changed'; }, 'must preserve');
    }
    for (const field of ['name', 'short', 'field', 'trophy']) for (const bad of ['', '   ', null, 5, {}, []]) {
      reject('rejects invalid ' + field + ' ' + JSON.stringify(bad), value => {
        if (field === 'trophy') value.trophy = bad; else value.clubs[2][field] = bad;
      }, field);
    }
    for (const bad of ['red', '#fff', 'd6b34c', '#zzzzzz', '#d6b34c00', '#d6b34c\n', null, 123456]) {
      reject('rejects malformed colour ' + String(bad), value => { value.clubs[2].color = bad; }, 'six-digit hex');
    }
    reject('rejects ink as a club colour', value => { value.clubs[2].color = INK; }, '3:1');
    reject('rejects a colour just below 3:1', value => { value.clubs[2].color = '#666666'; }, '3:1');
    accept('accepts a colour just above 3:1', value => { value.clubs[2].color = '#676767'; });
    reject('rejects two identical club colours', value => { value.clubs[2].color = value.clubs[3].color; }, 'RGB distance');
    reject('rejects RGB distance 39', value => { value.clubs[2].color = '#e7ffff'; value.clubs[3].color = '#c0ffff'; }, 'RGB distance');
    accept('accepts RGB distance 40 exactly', value => { value.clubs[2].color = '#e8ffff'; value.clubs[3].color = '#c0ffff'; });
    accept('accepts uppercase hex for a new club', value => { value.clubs[2].color = value.clubs[2].color.toUpperCase(); });
    for (const bad of [-1, 6, 0.5, '0', null, true, NaN, Infinity, {}, []]) for (const side of [0, 1]) {
      reject('rejects invalid fixture index ' + String(bad) + ' on side ' + side, value => { value.fixtures[0][0][side] = bad; }, 'indices');
    }
    reject('rejects a self-match', value => { value.fixtures[0][0][1] = value.fixtures[0][0][0]; }, 'itself');
    reject('rejects one club twice in a week', value => { value.fixtures[0][1][0] = value.fixtures[0][0][0]; }, 'exactly once');
    reject('rejects a repeated week and missing opponent', value => { value.fixtures[1] = value.fixtures[0]; }, 'must meet twice');
    reject('rejects two home matches for a pair', value => { value.fixtures[5] = value.fixtures[0]; }, 'must meet twice');
    reject('rejects a single reversed fixture and unbalanced home totals', value => { value.fixtures[0][0].reverse(); }, '5 home and 5 away');
    reject('rejects missing Brackenport in week 1', value => {
      const pair = value.fixtures[0].find(game => game.includes(0)); pair[pair.indexOf(0)] = 1;
    }, 'Brackenport must play');
    accept('accepts a reordered week list', value => { value.fixtures.reverse(); });
    accept('accepts reordered games within a week', value => { value.fixtures.forEach(week => week.reverse()); });
    accept('accepts globally swapped home and away', value => { value.fixtures.flat().forEach(pair => pair.reverse()); });
    for (const bad of [0, 2, 3, 6, '4', null, true]) {
      reject('rejects invalid playoff team count ' + String(bad), value => { value.playoffs.teams = bad; }, 'playoffs.teams');
    }
    for (const bad of ['random', '', null, 4]) {
      reject('rejects invalid playoff seeding ' + String(bad), value => { value.playoffs.seeding = bad; }, 'playoffs.seeding');
    }
    reject('rejects reversed playoff rounds', value => { value.playoffs.rounds.reverse(); }, 'semi then final');
    reject('rejects a quarterfinal', value => { value.playoffs.rounds[0] = 'quarter'; }, 'semi then final');
    reject('rejects a best-of-three final', value => { value.playoffs.bestOf = 3; }, 'unknown field');
    let accessed = false;
    reject('rejects record getters without invoking them', value => {
      Object.defineProperty(value.clubs[2], 'name', { enumerable: true, get() { accessed = true; return 'Wrong'; } });
    }, 'enumerable data field');
    report('no accessor was invoked', !accessed);
    reject('rejects inherited required fields', value => {
      const inherited = { name: value.clubs[2].name }; delete value.clubs[2].name; Object.setPrototypeOf(value.clubs[2], inherited);
    }, '.name');
    reject('rejects non-enumerable required fields', value => {
      Object.defineProperty(value.clubs[2], 'name', { value: value.clubs[2].name, enumerable: false });
    }, 'enumerable data field');
    reject('rejects cyclic data without throwing', value => { value.clubs[2] = value; }, 'unknown field');
    const revoked = Proxy.revocable({}, {}); revoked.revoke();
    report('rejects a revoked proxy without throwing', validate(revoked.proxy).length > 0);
    report('leaves supplied data unchanged', JSON.stringify(data) === original);
    return count;
  }
  return Object.freeze({ validate, runChecks });
});

if (typeof module === 'object' && module.exports && typeof require === 'function' && require.main === module) {
  try {
    const fs = require('node:fs'), path = require('node:path');
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../games/lantern-bowl/season.json'), 'utf8'));
    let passed = 0, failed = 0;
    module.exports.runChecks(data, (name, ok) => {
      if (ok) passed++; else { failed++; console.error('FAIL ' + name); }
    });
    console.log((failed ? 'FAIL' : 'PASS') + ': ' + passed + ' Lantern Bowl season checks passed, ' + failed + ' failed.');
    if (failed) process.exitCode = 1;
    else {
      console.log('6 clubs; 10 weeks; 30 games; every pair meets once at each ground.');
      console.log('Every club: 5 home, 5 away; Brackenport plays in week 1.');
      console.log('120-second quarters; top 4 by standings; semi then final; ' + data.trophy + '.');
    }
  } catch (error) {
    console.error('FAIL Lantern Bowl season: ' + error.message); process.exitCode = 1;
  }
}
