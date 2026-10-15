/* NM-G9: data-only Willow Quay tales. Run: node tests/nm-district-tales.cjs
 * No packages or game/storage execution. Node reads the two JSON files; browsers pass
 * { data, districts } to checks(). Exports NightMarketDistrictTaleChecks without module.
 * validate(data, districts) returns reason-specific errors and never changes its inputs.
 * Habit anchors are editorial guardrails, not proof of tone or originality: read all tales.
 * Only districts[0] (Willow Quay) is consumed. Cedar Steps and future entries are untouched.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NightMarketDistrictTaleChecks = api;
  if (typeof require === 'function' && typeof module === 'object' && require.main === module) process.exitCode = api.run() ? 0 : 1;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DISTRICT = 'willow-quay';
  const IDS = Object.freeze(['chestnut', 'ribbon', 'soup', 'kite', 'flower', 'music']);
  const MILESTONES = Object.freeze(['hired', '25', '50', '100']);
  const LIMITS = Object.freeze({ title: 32, text: 280, minSentences: 2, maxSentences: 3 });
  // Each concept appears in the authored source habit and across that vendor's tales.
  // Every individual tale must also retain at least one concrete habit anchor.
  const HABITS = Object.freeze({
    chestnut: ['warm', 'cone', 'last', 'ferry'],
    ribbon: ['bow', 'twice', 'breeze'],
    soup: ['warm', 'bowl', 'before', 'soup'],
    kite: ['kite', 'lamplight', 'before', 'tail'],
    flower: ['flower', 'water', 'jar'],
    music: ['quiet', 'between', 'tune', 'ferr']
  });
  const BANNED = /\b(?:XP|cooldown|multiplier|bonus|unlock|upgrade|schema|Starbucks|McDonald'?s?|Disney|Amazon|Retro Bowl|ALL-22|Wildbond|Little Ranch|Lantern Bowl|Beijing|Tokyo|China|Japan)\b/i;
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const keys = (o, wanted) => same(Object.keys(o).sort(), wanted.slice().sort());
  const clone = v => JSON.parse(JSON.stringify(v));
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const names = (s, name) => new RegExp('(^|[^A-Za-z])' + escape(name) + '(?![A-Za-z])').test(s);
  const clean = s => typeof s === 'string' && s.length > 0 && s === s.trim() && !/\s{2,}|[^\x20-\x7e]/.test(s);

  // JSON.parse alone silently overwrites duplicate keys. Validate syntax first, then
  // walk its string-safe token stream to reject duplicates, including escaped keys.
  function parse(text) {
    if (typeof text !== 'string') throw new TypeError('JSON input must be text');
    const data = JSON.parse(text);
    const tokens = text.match(/"(?:\\[\s\S]|[^"\\])*"|[{}\[\],:]|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g);
    let at = 0;
    function value() {
      const token = tokens[at++];
      if (token === '{') {
        const seen = new Set();
        if (tokens[at] !== '}') do {
          const key = JSON.parse(tokens[at++]);
          if (seen.has(key)) throw new SyntaxError('duplicate JSON key: ' + key);
          seen.add(key); at++; value();
          if (tokens[at] !== ',') break;
          at++;
        } while (true);
        at++;
      } else if (token === '[') {
        if (tokens[at] !== ']') do {
          value();
          if (tokens[at] !== ',') break;
          at++;
        } while (true);
        at++;
      }
    }
    value();
    return data;
  }

  function sourceErrors(districts) {
    if (!object(districts) || districts.schemaVersion !== 1 || !Array.isArray(districts.districts)) return ['district source must have schemaVersion 1 and a districts array'];
    const district = districts.districts[0];
    if (!object(district) || district.id !== DISTRICT || !Array.isArray(district.stalls)) return ['district source first entry must be Willow Quay with stalls'];
    if (district.stalls.length !== IDS.length || !district.stalls.every((s, i) => object(s) && s.id === IDS[i])) return ['district source must give the six Willow Quay stall IDs in order'];
    const errs = [], vendors = new Set();
    district.stalls.forEach(s => {
      const validVendor = clean(s.vendor) && /^[A-Z][a-z]+(?: [A-Z][a-z]+)*$/.test(s.vendor);
      if (!validVendor) errs.push(s.id + ': source vendor must be a capitalised name');
      else if (vendors.has(s.vendor)) errs.push(s.id + ': source vendor repeats');
      vendors.add(s.vendor);
      if (!validVendor || !clean(s.habit) || !names(s.habit, s.vendor) || !HABITS[s.id].every(k => s.habit.toLowerCase().includes(k))) errs.push(s.id + ': source habit changed; review its tale anchors');
    });
    return errs;
  }

  // Count complete, capitalised sentences; reject empty punctuation and trailing fragments.
  // This small prose format intentionally excludes abbreviations and dialogue punctuation.
  function sentenceCount(text) {
    const parts = text.split(/(?<=[.!?]) /);
    return parts.every(s => /^[A-Z][^.!?]*[.!?]$/.test(s)) ? parts.length : 0;
  }

  function validate(data, districts) {
    const errs = sourceErrors(districts);
    if (errs.length) return errs;
    const bad = msg => errs.push(msg), stalls = districts.districts[0].stalls;
    if (!object(data)) return ['tale file must be an object'];
    if (!keys(data, ['schemaVersion', 'districts'])) bad('top-level keys must be exactly schemaVersion and districts');
    if (data.schemaVersion !== 1) bad('schemaVersion must be 1');
    if (!object(data.districts)) { bad('districts must be an object'); return errs; }
    if (!keys(data.districts, [DISTRICT])) bad('districts must contain only willow-quay');
    const tales = data.districts[DISTRICT];
    if (!object(tales)) { bad('willow-quay must be an object'); return errs; }
    if (!same(Object.keys(tales), stalls.map(s => s.id))) bad('tales must contain exactly the source stall IDs in order');
    const titles = new Set(), texts = new Set();
    stalls.forEach(stall => {
      const list = tales[stall.id], anchors = HABITS[stall.id];
      if (!Array.isArray(list)) { bad(stall.id + ': tales must be an array'); return; }
      if (list.length !== MILESTONES.length) bad(stall.id + ': needs exactly four tales');
      for (let i = 0; i < list.length; i++) {
        const tale = list[i], where = stall.id + '/' + i;
        if (!object(tale)) { bad(where + ': tale must be an object'); continue; }
        if (!keys(tale, ['at', 'title', 'text'])) bad(where + ': tale keys must be exactly at, title and text');
        if (tale.at !== MILESTONES[i]) bad(where + ': milestone must be ' + MILESTONES[i]);
        if (!clean(tale.title)) bad(where + ': title must be nonempty plain ASCII with single spaces');
        else {
          if (tale.title.length > LIMITS.title) bad(where + ': title exceeds 32 characters');
          const title = tale.title.toLowerCase();
          if (titles.has(title)) bad(where + ': title repeats');
          titles.add(title);
        }
        if (!clean(tale.text)) { bad(where + ': text must be nonempty plain ASCII with single spaces'); continue; }
        if (tale.text.length > LIMITS.text) bad(where + ': text exceeds 280 characters');
        const count = sentenceCount(tale.text);
        if (count < LIMITS.minSentences || count > LIMITS.maxSentences) bad(where + ': text must have two or three complete sentences');
        if (!names(tale.text, stall.vendor)) bad(where + ': text must name its source vendor ' + stall.vendor);
        if (stalls.some(other => other.id !== stall.id && names(tale.text, other.vendor))) bad(where + ': text names another vendor');
        const text = tale.text.toLowerCase();
        if (texts.has(text)) bad(where + ': text repeats');
        texts.add(text);
        if (!anchors.some(k => text.includes(k))) bad(where + ': text lacks a habit anchor');
        const prose = tale.text + ' ' + (typeof tale.title === 'string' ? tale.title : '');
        if (/[0-9]/.test(prose)) bad(where + ': write numbers as words');
        if (/[<>{}\[\]`]|https?:|www\./i.test(prose)) bad(where + ': markup, placeholders and links are not prose');
        if (BANNED.test(prose)) bad(where + ': contains rule jargon, a real brand/place or another game');
      }
      const prose = list.filter(object).map(t => typeof t.text === 'string' ? t.text : '').join(' ').toLowerCase();
      anchors.forEach(k => { if (!prose.includes(k)) bad(stall.id + ': tales lose habit anchor ' + k); });
    });
    return errs;
  }

  function malformed(good) {
    const out = [], add = (name, expect, change) => {
      const data = clone(good), result = change(data);
      out.push({ name, expect, data: result === undefined ? data : result });
    };
    [null, false, 3, 'text', []].forEach((v, i) => add('root type ' + i, 'file must be an object', () => v));
    add('schema missing', 'top-level keys', d => { delete d.schemaVersion; });
    [0, 2, '1', null, true].forEach(v => add('schema ' + v, 'schemaVersion must be 1', d => { d.schemaVersion = v; }));
    add('extra root key', 'top-level keys', d => { d.extra = 1; });
    [null, [], 1, 'x'].forEach((v, i) => add('districts type ' + i, 'districts must be an object', d => { d.districts = v; }));
    add('district missing', 'only willow-quay', d => { delete d.districts[DISTRICT]; });
    add('extra district', 'only willow-quay', d => { d.districts['cedar-steps'] = {}; });
    [null, [], 1, 'x'].forEach((v, i) => add('willow type ' + i, 'willow-quay must be an object', d => { d.districts[DISTRICT] = v; }));
    add('extra stall', 'source stall IDs', d => { d.districts[DISTRICT].unknown = []; });
    add('stall order', 'source stall IDs', d => { const t = d.districts[DISTRICT]; d.districts[DISTRICT] = Object.fromEntries(IDS.slice().reverse().map(id => [id, t[id]])); });
    IDS.forEach(id => {
      const edit = fn => d => fn(d.districts[DISTRICT], d.districts[DISTRICT][id]);
      add(id + ' missing', 'source stall IDs', edit(t => { delete t[id]; }));
      add(id + ' wrong list', 'tales must be an array', edit(t => { t[id] = {}; }));
      add(id + ' short list', 'exactly four tales', edit((t, a) => { a.pop(); }));
      add(id + ' long list', 'exactly four tales', edit((t, a) => { a.push(clone(a[0])); }));
      MILESTONES.forEach((at, i) => {
        const row = fn => edit((t, a) => fn(a[i], a));
        const label = id + '/' + at + ' ';
        add(label + 'null', 'tale must be an object', edit((t, a) => { a[i] = null; }));
        add(label + 'array', 'tale must be an object', edit((t, a) => { a[i] = []; }));
        ['at', 'title', 'text'].forEach(k => add(label + 'missing ' + k, 'tale keys', row(t => { delete t[k]; })));
        add(label + 'extra field', 'tale keys', row(t => { t.reward = 1; }));
        add(label + 'wrong milestone', 'milestone must be', row(t => { t.at = i ? Number(at) : 0; }));
        add(label + 'duplicate milestone', 'milestone must be', row(t => { t.at = MILESTONES[(i + 1) % 4]; }));
        [null, '', 32, [], {}].forEach((v, j) => add(label + 'title type ' + j, 'title must be', row(t => { t.title = v; })));
        add(label + 'long title', 'title exceeds', row(t => { t.title = 'A'.repeat(33); }));
        add(label + 'title space', 'title must be', row(t => { t.title += ' '; }));
        [null, '', 5, [], {}].forEach((v, j) => add(label + 'text type ' + j, 'text must be', row(t => { t.text = v; })));
        add(label + 'text space', 'text must be', row(t => { t.text += ' '; }));
        add(label + 'text newline', 'text must be', row(t => { t.text += '\n'; }));
        add(label + 'long text', 'text exceeds', row(t => { t.text = 'A'.repeat(279) + '. B.'; }));
        add(label + 'one sentence', 'complete sentences', row(t => { t.text = 'A quiet evening.'; }));
        add(label + 'four sentences', 'complete sentences', row(t => { t.text = 'A quiet evening. A warm bowl. A soft breeze. A paper kite.'; }));
        add(label + 'trailing fragment', 'complete sentences', row(t => { t.text += ' The quay'; }));
        add(label + 'punctuation only', 'complete sentences', row(t => { t.text = '... ...'; }));
        add(label + 'no vendor', 'source vendor', row(t => { t.text = t.text.replace(/\b(?:Lin|Suri|Tao|Neri|Asha|Fen)\b/g, 'Someone'); }));
        add(label + 'vendor substring', 'source vendor', row(t => { t.text = t.text.replace(/\b(Lin|Suri|Tao|Neri|Asha|Fen)\b/g, '$1ling'); }));
        add(label + 'digit', 'numbers as words', row(t => { t.title = 'A 2nd Cone'; }));
        add(label + 'markup', 'not prose', row(t => { t.title = '<b>A Cone</b>'; }));
        add(label + 'jargon', 'rule jargon', row(t => { t.title = 'An XP Bonus'; }));
      });
      add(id + 'duplicate title', 'title repeats', edit((t, a) => { a[1].title = a[0].title.toUpperCase(); }));
      add(id + 'duplicate text', 'text repeats', edit((t, a) => { a[1].text = a[0].text; }));
      add(id + 'lost habit', 'habit anchor', edit((t, a) => { a.forEach(tale => { tale.text = tale.text.replace(new RegExp(HABITS[id].join('|'), 'gi'), 'soft'); }); }));
    });
    return out;
  }

  function loadSources() {
    if (typeof require !== 'function') throw new Error('Browser callers must pass { data, districts }');
    const fs = require('fs'), path = require('path'), base = path.join(__dirname, '..', 'games', 'night-market');
    return { data: parse(fs.readFileSync(path.join(base, 'district-tales.json'), 'utf8')), districts: parse(fs.readFileSync(path.join(base, 'districts.json'), 'utf8')) };
  }

  function checks(input) {
    const source = input === undefined ? loadSources() : input;
    const out = [], add = (name, ok, detail) => out.push({ name, ok: !!ok, detail: ok ? '' : (detail || '') });
    if (!object(source) || !own(source, 'data') || !own(source, 'districts')) return [{ name: 'source input', ok: false, detail: 'checks requires { data, districts }' }];
    const data = source.data, districts = source.districts, before = JSON.stringify(source), errors = validate(data, districts);
    add('real source and all 24 tales pass', errors.length === 0, errors.join(' | '));
    add('validation is deterministic', JSON.stringify(errors) === JSON.stringify(validate(data, districts)));
    add('validation preserves both inputs', JSON.stringify(source) === before);
    add('strict parse round-trips the data', JSON.stringify(parse(JSON.stringify(data))) === JSON.stringify(data));
    if (errors.length) return out;
    malformed(data).forEach(f => {
      let found;
      try { found = validate(f.data, districts); } catch (e) { found = ['THREW: ' + e.message]; }
      add('rejects ' + f.name, found.some(e => e.includes(f.expect)), found.join(' | '));
    });
    const badSources = [null, {}, { schemaVersion: 1, districts: [] }, { schemaVersion: 1, districts: [null] }, { schemaVersion: 2, districts: [] }];
    badSources.forEach((bad, i) => add('rejects malformed source ' + i, validate(data, bad).length > 0));
    IDS.forEach((id, i) => {
      ['id', 'vendor', 'habit'].forEach(k => {
        const bad = clone(districts); bad.districts[0].stalls[i][k] = null;
        add('rejects source ' + id + ' ' + k, validate(data, bad).length > 0);
      });
      [false, 3, [], {}, { toString: null }, { toString: {}, valueOf: null }].forEach((vendor, j) => {
        const bad = clone(districts); bad.districts[0].stalls[i].vendor = vendor;
        add('rejects non-string source vendor ' + id + ' ' + j, validate(data, bad).some(e => e.includes('source vendor must')));
      });
      const bad = clone(districts); bad.districts[0].stalls[i].vendor = 'Other';
      bad.districts[0].stalls[i].habit = bad.districts[0].stalls[i].habit.replace(districts.districts[0].stalls[i].vendor, 'Other');
      add('uses source vendor for ' + id, validate(data, bad).some(e => e.includes('source vendor Other')));
    });
    const future = clone(districts); future.districts.push({ id: 'future-district' });
    add('later district entries are irrelevant', validate(data, future).length === 0);
    const boundary = clone(data), first = boundary.districts[DISTRICT][IDS[0]][0];
    first.title = 'A'.repeat(32);
    const opening = districts.districts[0].stalls[0].vendor + ' saves a warm cone for the last ferry worker. ';
    first.text = opening + 'A'.repeat(280 - opening.length - 1) + '.';
    add('exactly 32 title and 280 text characters are accepted', validate(boundary, districts).length === 0);
    first.text = first.text.slice(0, -1) + 'A.';
    add('281 text characters are rejected', validate(boundary, districts).some(e => e.includes('text exceeds')));
    const serialized = JSON.stringify(data);
    [
      ['', 'empty'], ['{', 'truncated'], ['{"x":1,}', 'trailing comma'], ['{"x":NaN}', 'NaN'],
      ['{"x":1,"x":2}', 'duplicate root'], ['{"x":{"y":1,"y":2}}', 'duplicate nested'],
      ['{"x":1,"\\u0078":2}', 'escaped duplicate'], ['[{"at":"25","at":"50"}]', 'duplicate in array']
    ].forEach(([text, label]) => {
      let rejected = false; try { parse(text); } catch (_) { rejected = true; }
      add('strict parser rejects ' + label, rejected);
    });
    // Positive string-escape and repeated-key-in-different-object tests use JSON.stringify.
    const positive = { a: 'braces { } and "quoted" text', b: [true, false, null, -1.2e3], c: { a: 1 } };
    add('strict parser permits escaped strings and separate object keys', JSON.stringify(parse(JSON.stringify(positive))) === JSON.stringify(positive));
    add('validation remains immutable after malformed cases', JSON.stringify(data) === serialized && JSON.stringify(source) === before);
    return out;
  }

  function run(log) {
    log = log || console.log;
    let result;
    try { result = checks(); } catch (e) { log('FAIL: ' + e.message); return false; }
    // The future HTML integration receives this same API without Node globals.
    const fs = require('fs'), vm = require('vm'), context = { window: null };
    context.window = context; vm.createContext(context);
    vm.runInContext(fs.readFileSync(__filename, 'utf8'), context, { filename: __filename });
    const browser = context.NightMarketDistrictTaleChecks, sources = loadSources();
    result.push({ name: 'browser export exists without Node globals', ok: !!browser && browser === context.window.NightMarketDistrictTaleChecks });
    if (browser) {
      const browserResults = browser.checks(sources);
      result.push({ name: 'browser checks match Node checks', ok: JSON.stringify(browserResults) === JSON.stringify(checks(sources)) });
    }
    const failed = result.filter(r => !r.ok);
    failed.forEach(r => log('FAIL ' + r.name + ': ' + r.detail));
    log('NM-G9: ' + (result.length - failed.length) + ' passed, ' + failed.length + ' failed.');
    if (!failed.length) log('24 tales; six source vendors; hired/25/50/100; ' + malformed(loadSources().data).length + ' reason-specific malformed tale fixtures rejected.');
    return failed.length === 0;
  }
  return { validate, checks, malformed, parse, loadSources, run, LIMITS, MILESTONES };
});
