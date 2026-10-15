/* Checks for games/night-market/vendor-tales.json (NM-G1). Plain Node, no packages:  node tests/nm-vendor-tales.cjs
   Exports { run, checks, validate, malformed }. With no `module` it sets window.NightMarketTaleChecks; there the caller passes
   { data, stalls, milestones } to checks(), because a page has no file system. validate(data, model) returns a list of problems
   (empty = fine). `model` is { stalls: [{ id, vendor }], milestones: [25, 50, 100] }; in Node it is read from the real
   games/night-market/model.js and shared/idle-core.js in a throw-away vm context, so nothing in the game is changed or loaded. */
(function (root, factory) {
  const api = factory(typeof require === 'function' ? require : null);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NightMarketTaleChecks = api;
  if (typeof require === 'function' && typeof module === 'object' && require.main === module) process.exitCode = api.run() ? 0 : 1;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (req) {
  'use strict';
  const fs = req ? req('fs') : null, path = req ? req('path') : null, vm = req ? req('vm') : null;
  const ROOT = path ? path.join(__dirname, '..') : null;
  const FILE = path ? path.join(ROOT, 'games', 'night-market', 'vendor-tales.json') : null;

  const LIMITS = { sentences: [2, 3], text: 280, title: 32 };
  // Words that must show up somewhere in a vendor's four tales, so each one keeps that vendor's habit and gossip.
  const VOICE = {
    tea: ['before the lanterns', 'dark'], dumpling: ['talk', 'dumplings'], lantern: ['wick', 'flame'],
    mooncake: ['twice', 'least'], incense: ['stick', 'alley'], stories: ['ending', 'crowd']
  };
  // Real brands, places and the other idle games' words a tale must never use.
  const BANNED = ['starbucks', 'mcdonald', 'china', 'chinese', 'beijing', 'tokyo', 'hong kong', 'japan', 'amazon', 'disney', 'cookie', 'clicker',
    'night market', 'retro bowl', 'lantern bowl', 'wildbond', 'little ranch'];

  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const names = (text, vendor) => new RegExp('(^|[^A-Za-z])' + esc(vendor) + '(?![A-Za-z])').test(text);
  const sentences = s => (String(s).match(/[^.!?]+[.!?]+(?=\s|$)/g) || []);
  /* Capitalised words in the middle of a sentence are proper nouns; only the six vendors' names are allowed. */
  function properNouns(s, allowed) {
    const out = [];
    String(s).split(/(?<=[.!?])\s+/).forEach(sentence => sentence.split(/\s+/).slice(1).forEach(w => {
      const bare = w.replace(/^[^A-Za-z]+/, '').replace(/('s)?[^A-Za-z]*$/, '');
      if (/^[A-Z]/.test(bare) && allowed.indexOf(bare) < 0) out.push(w);
    }));
    return out;
  }

  /* The real stall ids, vendors and milestone counts, from the game's own files, read and never changed. */
  function loadModel() {
    const ctx = { console: console, window: null, Arcade: {} }; ctx.window = ctx; vm.createContext(ctx);
    ['shared/idle-core.js', 'games/night-market/model.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }));
    const milestones = [];
    for (let n = 1; n <= 400; n++) if (ctx.Idle.milestoneMult(n) !== ctx.Idle.milestoneMult(n - 1)) milestones.push(n);
    return { stalls: ctx.NightMarket.STALLS.map(s => ({ id: s.id, vendor: s.vendor })), milestones: milestones };
  }

  function validate(data, model) {
    const errs = [], bad = m => errs.push(m);
    if (!isObj(data)) return ['the file is not an object'];
    if (!model || !Array.isArray(model.stalls) || !Array.isArray(model.milestones)) return ['no model to check against'];
    if (!same(Object.keys(data).sort(), ['schemaVersion', 'tales'])) bad('top-level keys must be exactly schemaVersion and tales');
    if (data.schemaVersion !== 1) bad('schemaVersion must be 1');
    if (!isObj(data.tales)) { bad('tales must be an object'); return errs; }
    const ids = model.stalls.map(s => s.id), slots = ['hired'].concat(model.milestones.map(String));
    if (!same(Object.keys(data.tales), ids)) bad('tales must have exactly the stall ids ' + ids.join(', ') + ', in the stall order');
    const allVendors = model.stalls.map(s => s.vendor), allowed = [].concat.apply([], allVendors.map(v => v.split(' ')));
    const titles = {}, texts = {};
    model.stalls.forEach(stall => {
      const list = data.tales[stall.id], where = stall.id;
      if (!Array.isArray(list)) { if (stall.id in data.tales) bad(where + ': tales must be a list'); return; }
      if (list.length !== slots.length) bad(where + ': needs exactly ' + slots.length + ' tales (' + slots.join(', ') + '), has ' + list.length);
      list.forEach((t, i) => {
        const w = where + '/' + (isObj(t) && t.at !== undefined ? t.at : i);
        if (!isObj(t)) { bad(w + ': a tale must be an object'); return; }
        if (!same(Object.keys(t).sort(), ['at', 'text', 'title'])) bad(w + ': keys must be exactly at, title and text');
        if (t.at !== slots[i]) bad(w + ': slot ' + (i + 1) + ' must be "' + slots[i] + '"');
        if (typeof t.title !== 'string' || !t.title.trim() || t.title !== t.title.trim()) bad(w + ': title must be non-empty text with no edge spaces');
        else {
          if (t.title.length > LIMITS.title) bad(w + ': title is over ' + LIMITS.title + ' characters');
          if (titles[t.title.toLowerCase()]) bad(w + ': title repeats ' + titles[t.title.toLowerCase()]);
          titles[t.title.toLowerCase()] = w;
        }
        if (typeof t.text !== 'string' || !t.text.trim()) { bad(w + ': text must be non-empty'); return; }
        const s = t.text;
        if (s !== s.trim() || /\s{2,}/.test(s)) bad(w + ': text has stray spaces');
        if (/[^\x20-\x7e]/.test(s) || /[^\x20-\x7e]/.test(t.title || '')) bad(w + ': use plain ASCII only');
        if (/[0-9]/.test(s) || /[0-9]/.test(t.title || '')) bad(w + ': write numbers as words');
        if (/[<>{}\[\]]/.test(s)) bad(w + ': no markup or placeholders');
        if (s.length > LIMITS.text) bad(w + ': text is over ' + LIMITS.text + ' characters');
        if (!/[.!?]$/.test(s)) bad(w + ': text must end with . ! or ?');
        const n = sentences(s).length;
        if (n < LIMITS.sentences[0] || n > LIMITS.sentences[1]) bad(w + ': text must be ' + LIMITS.sentences.join(' to ') + ' sentences, has ' + n);
        if (texts[s]) bad(w + ': text repeats ' + texts[s]);
        texts[s] = w;
        if (!names(s, stall.vendor)) bad(w + ': text must name ' + stall.vendor);
        allVendors.filter(v => v !== stall.vendor).forEach(v => { if (names(s, v) || (v === 'Old Wen' && names(s, 'Wen'))) bad(w + ': text names another vendor, ' + v); });
        const low = (s + ' ' + t.title).toLowerCase();
        BANNED.forEach(b => { if (low.indexOf(b) >= 0) bad(w + ': uses "' + b + '"'); });
        properNouns(s, allowed).forEach(p => bad(w + ': proper noun "' + p + '" is not one of the six vendors'));
      });
      const all = list.map(t => (t && t.text) || '').join(' ').toLowerCase();
      (VOICE[stall.id] || []).forEach(k => { if (all.indexOf(k) < 0) bad(where + ': the four tales never use "' + k + '", so the vendor\'s habit is lost'); });
    });
    return errs;
  }

  /* Hand-made broken copies of a good file. Each must be rejected, and the problem must mention `expect`. */
  function malformed(good) {
    const c = () => JSON.parse(JSON.stringify(good)), out = [];
    const m = (name, expect, fn) => { const d = c(); const r = fn(d); out.push({ name, expect, data: r === undefined ? d : r }); };
    m('null', 'not an object', () => null);
    m('array', 'not an object', () => []);
    m('wrong schemaVersion', 'schemaVersion', d => { d.schemaVersion = 2; });
    m('extra top-level key', 'top-level', d => { d.extra = 1; });
    m('tales missing', 'top-level', d => { delete d.tales; });
    m('tales is a list', 'tales must be an object', d => { d.tales = []; });
    m('stall removed', 'exactly the stall ids', d => { delete d.tales.stories; });
    m('unknown stall added', 'exactly the stall ids', d => { d.tales.noodle = d.tales.tea; });
    m('stall order changed', 'stall order', d => { d.tales = { dumpling: d.tales.dumpling, tea: d.tales.tea, lantern: d.tales.lantern, mooncake: d.tales.mooncake, incense: d.tales.incense, stories: d.tales.stories }; });
    m('stall is not a list', 'must be a list', d => { d.tales.tea = {}; });
    m('only three tales', 'exactly 4', d => { d.tales.tea.pop(); });
    m('five tales', 'exactly 4', d => { d.tales.tea.push(d.tales.tea[0]); });
    m('tale is a string', 'must be an object', d => { d.tales.tea[0] = 'hello'; });
    m('tale has an extra key', 'keys must be exactly', d => { d.tales.tea[0].mood = 'sad'; });
    m('tale missing title', 'keys must be exactly', d => { delete d.tales.tea[0].title; });
    m('slot out of order', 'slot 2', d => { const a = d.tales.tea; [a[1], a[2]] = [a[2], a[1]]; });
    m('slot is a number', 'slot 2', d => { d.tales.tea[1].at = 25; });
    m('slot repeated', 'slot 3', d => { d.tales.tea[2].at = '25'; });
    m('empty title', 'title must be non-empty', d => { d.tales.tea[0].title = ''; });
    m('title with edge space', 'title must be non-empty', d => { d.tales.tea[0].title = ' Mei Opens Early'; });
    m('title not a string', 'title must be non-empty', d => { d.tales.tea[0].title = 7; });
    m('title too long', 'title is over', d => { d.tales.tea[0].title = 'Mei opens the tea stall very early'; });
    m('title repeated', 'title repeats', d => { d.tales.dumpling[0].title = d.tales.tea[0].title; });
    m('title repeated in other case', 'title repeats', d => { d.tales.dumpling[0].title = d.tales.tea[0].title.toUpperCase(); });
    m('empty text', 'text must be non-empty', d => { d.tales.tea[0].text = ''; });
    m('text not a string', 'text must be non-empty', d => { d.tales.tea[0].text = null; });
    m('text with stray spaces', 'stray spaces', d => { d.tales.tea[0].text = ' ' + d.tales.tea[0].text; });
    m('text with a double space', 'stray spaces', d => { d.tales.tea[0].text = d.tales.tea[0].text.replace('. ', '.  '); });
    m('curly quote', 'plain ASCII', d => { d.tales.tea[0].text = d.tales.tea[0].text.replace('She', 'She\u2019s'); });
    m('digit in text', 'numbers as words', d => { d.tales.tea[1].text = d.tales.tea[1].text.replace('twenty-five', '25'); });
    m('digit in title', 'numbers as words', d => { d.tales.tea[1].title = 'Cup 25'; });
    m('markup in text', 'markup', d => { d.tales.tea[0].text += ' <b>'; });
    m('placeholder in text', 'markup', d => { d.tales.tea[0].text = d.tales.tea[0].text.replace('Mei', '{name}'); });
    m('text too long', 'over 280', d => { d.tales.tea[0].text = d.tales.tea[0].text + ' ' + 'Mei waits and pours and waits again. '.repeat(8).trim(); });
    m('no closing mark', 'must end with', d => { d.tales.tea[0].text = d.tales.tea[0].text.replace(/\.$/, ''); });
    m('one sentence', 'sentences', d => { d.tales.tea[0].text = 'Mei opens the tea stall before the lanterns are lit.'; });
    m('four sentences', 'sentences', d => { d.tales.tea[0].text += ' Mei smiles. Mei waits.'; });
    m('repeated text', 'text repeats', d => { d.tales.tea[1].text = d.tales.tea[0].text; });
    m('own vendor not named', 'must name Mei', d => { d.tales.tea[0].text = d.tales.tea[0].text.replace(/Mei/g, 'She'); });
    m('own vendor only as part of a word', 'must name Mei', d => { d.tales.tea[2].text = d.tales.tea[2].text.replace(/Mei/g, 'Meiling'); });
    m('another vendor named', 'another vendor, Bo', d => { d.tales.tea[0].text += ' Bo helps.'; });
    m('Old Wen named in another tale', 'another vendor, Old Wen', d => { d.tales.tea[3].text = d.tales.tea[3].text.replace('She smiles', 'Old Wen smiles'); });
    m('Wen alone named in another tale', 'another vendor, Old Wen', d => { d.tales.tea[3].text = d.tales.tea[3].text.replace('She smiles', 'Wen smiles'); });
    m('real brand', 'uses "starbucks"', d => { d.tales.tea[0].text = d.tales.tea[0].text.replace('tea stall', 'Starbucks stall'); });
    m('real place', 'uses "tokyo"', d => { d.tales.tea[2].text = d.tales.tea[2].text.replace('the lane', 'tokyo'); });
    m('other game named', 'uses "wildbond"', d => { d.tales.tea[2].text = d.tales.tea[2].text.replace('the lane', 'wildbond'); });
    m('invented person', 'proper noun', d => { d.tales.tea[0].text = d.tales.tea[0].text.replace('regulars', 'regulars like Linus'); });
    m('invented place', 'proper noun', d => { d.tales.dumpling[1].text = d.tales.dumpling[1].text.replace('the goat', 'the goat from Lakeview'); });
    m('habit lost: tea never says dark', 'never use "dark"', d => { d.tales.tea.forEach(t => { t.text = t.text.replace(/dark/g, 'night'); }); });
    m('habit lost: stories never say ending', 'never use "ending"', d => { d.tales.stories.forEach(t => { t.text = t.text.replace(/ending/g, 'finish'); }); });
    m('habit lost: lantern never says wick', 'never use "wick"', d => { d.tales.lantern.forEach(t => { t.text = t.text.replace(/wick/g, 'thread'); }); });
    return out;
  }

  function checks(input) {
    const out = [], add = (name, ok, detail) => out.push({ name, ok: !!ok, detail: ok ? '' : (detail || '') });
    const data = input && input.data !== undefined ? input.data : JSON.parse(fs.readFileSync(FILE, 'utf8'));
    const model = input && input.stalls ? { stalls: input.stalls, milestones: input.milestones } : loadModel();
    const problems = validate(data, model);
    add('the model gives six stalls with a vendor each', model.stalls.length === 6 && model.stalls.every(s => s.id && s.vendor), JSON.stringify(model.stalls));
    add('the model gives the milestones 25, 50 and 100', same(model.milestones, [25, 50, 100]), model.milestones.join());
    add('the file passes every rule', problems.length === 0, problems.slice(0, 8).join(' | '));
    const tales = isObj(data) && isObj(data.tales) ? data.tales : {};
    add('24 tales: four for each of the six vendors', Object.keys(tales).length === 6 && Object.keys(tales).every(k => Array.isArray(tales[k]) && tales[k].length === 4));
    add('each stall id matches the game, in order', same(Object.keys(tales), model.stalls.map(s => s.id)));
    add('each stall has its hired, 25, 50 and 100 tale in order', model.stalls.every(s => Array.isArray(tales[s.id]) && same(tales[s.id].map(t => t.at), ['hired', '25', '50', '100'])));
    add('all 24 titles differ', (() => { const t = []; Object.keys(tales).forEach(k => (tales[k] || []).forEach(x => t.push(String(x.title).toLowerCase()))); return t.length === 24 && new Set(t).size === 24; })());
    add('all 24 texts differ', (() => { const t = []; Object.keys(tales).forEach(k => (tales[k] || []).forEach(x => t.push(x.text))); return t.length === 24 && new Set(t).size === 24; })());
    add('every tale names its own vendor and no other', model.stalls.every(s => (tales[s.id] || []).every(t => names(t.text, s.vendor) && model.stalls.every(o => o.vendor === s.vendor || !names(t.text, o.vendor)))));
    add('the longest tale fits the limit', Math.max.apply(null, [0].concat([].concat.apply([], Object.keys(tales).map(k => tales[k])).map(t => String(t.text).length))) <= LIMITS.text);
    add('validate does not throw on odd input', [null, 'x', [], 5, undefined, {}, { tales: 5 }, { schemaVersion: 1, tales: { tea: [null] } }].every(v => { try { return validate(v, model).length > 0; } catch (e) { return false; } }));
    add('validate changes nothing it was given', (() => { const s = JSON.stringify(data); validate(data, model); return JSON.stringify(data) === s; })());
    add('validate refuses to run with no model', validate(data).length === 1);
    if (problems.length === 0) {
      malformed(data).forEach(f => {
        const errs = validate(f.data, model), hit = errs.some(e => e.toLowerCase().indexOf(f.expect.toLowerCase()) >= 0);
        add('rejects: ' + f.name, errs.length > 0 && hit, errs.length ? 'rejected but not for "' + f.expect + '": ' + errs.slice(0, 3).join(' | ') : 'was accepted');
      });
    }
    return out;
  }

  function run(log) {
    log = log || console.log;
    const results = checks(), bad = results.filter(r => !r.ok);
    results.forEach(r => log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? ' [' + r.detail + ']' : '')));
    log('\n' + (results.length - bad.length) + ' passed, ' + bad.length + ' failed');
    return bad.length === 0;
  }

  return { run, checks, validate, malformed, loadModel, LIMITS };
});
