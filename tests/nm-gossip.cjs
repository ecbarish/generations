/* Checks for games/night-market/gossip.json (NM-G5). Plain Node, no packages:  node tests/nm-gossip.cjs
   Exports { run, checks, validate, malformed, loadModel, BANDS, LIMITS }. With no `module` it sets window.NightMarketGossipChecks;
   there the caller passes { data, stalls, offlineCap } to checks(), because a page has no file system. validate(data, model)
   returns a list of problems (empty = fine). `model` is { stalls: [{ id, vendor, gossip }], offlineCap }; in Node it is read from the real
   games/night-market/model.js and shared/idle-core.js in a throw-away vm context, the way tools/night-market-pacing.cjs and
   tests/nm-vendor-tales.cjs read it, so nothing in the game is changed or loaded. */
(function (root, factory) {
  const api = factory(typeof require === 'function' ? require : null);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NightMarketGossipChecks = api;
  if (typeof require === 'function' && typeof module === 'object' && require.main === module) process.exitCode = api.run() ? 0 : 1;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (req) {
  'use strict';
  const fs = req ? req('fs') : null, path = req ? req('path') : null, vm = req ? req('vm') : null;
  const ROOT = path ? path.join(__dirname, '..') : null;
  const FILE = path ? path.join(ROOT, 'games', 'night-market', 'gossip.json') : null;

  /* Seconds away. short is under 30 minutes, evening is 30 minutes up to 2 hours, long is 2 hours up to the 4-hour offline cap. */
  const BANDS = [
    { id: 'short', fromSec: 0, toSec: 30 * 60 },
    { id: 'evening', fromSec: 30 * 60, toSec: 2 * 3600 },
    { id: 'long', fromSec: 2 * 3600, toSec: 4 * 3600 }
  ];
  const LIMITS = { perBand: [3, 6], line: 100 };
  // Words a line must never use: gossip never promises extra coins and never hints at a multiplier. Offline pay stays at 50%.
  const PROMISES = ['double', 'bonus', 'multiplier', 'coin', 'extra', 'profit', 'twice as', 'times as', 'hundred', 'thousand', 'million', 'dozen', 'percent'];
  // Time cues that would put a line in the wrong band (a short away must not say "all night", a long one must not say "a moment").
  const CUES = {
    short: ['all night', 'through the night', 'dawn', 'hours', 'whole night'],
    evening: ['all night', 'through the night', 'dawn', 'whole night', 'barely', 'a moment'],
    long: ['barely', 'a moment', 'only just', 'just begun']
  };
  // Words that must show up somewhere in a vendor's twelve lines, so each one keeps that vendor's habit.
  const VOICE = {
    tea: ['before the lanterns', 'dark'], dumpling: ['talk', 'fold'], lantern: ['wick', 'flame'],
    mooncake: ['tins', 'least'], incense: ['stick', 'alley'], stories: ['ending', 'crowd']
  };
  const BANNED = ['starbucks', 'mcdonald', 'china', 'chinese', 'beijing', 'tokyo', 'hong kong', 'japan', 'amazon', 'disney', 'cookie', 'clicker',
    'night market', 'retro bowl', 'lantern bowl', 'wildbond', 'little ranch'];

  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const names = (text, vendor) => new RegExp('(^|[^A-Za-z])' + esc(vendor) + '(?![A-Za-z])').test(text);
  const sentences = s => (String(s).match(/[^.!?]+[.!?]+(?=\s|$)/g) || []);
  function properNouns(s, allowed) {
    const out = [];
    String(s).split(/(?<=[.!?])\s+/).forEach(sentence => sentence.split(/\s+/).slice(1).forEach(w => {
      const bare = w.replace(/^[^A-Za-z]+/, '').replace(/('s)?[^A-Za-z]*$/, '');
      if (/^[A-Z]/.test(bare) && allowed.indexOf(bare) < 0) out.push(w);
    }));
    return out;
  }

  /* The real stall ids, vendors, existing one-line gossip and offline cap, from the game's own files, read and never changed. */
  function loadModel() {
    const ctx = { console: console, window: null, Arcade: {} }; ctx.window = ctx; vm.createContext(ctx);
    ['shared/idle-core.js', 'games/night-market/model.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }));
    return {
      stalls: ctx.NightMarket.STALLS.map(s => ({ id: s.id, vendor: s.vendor, gossip: s.gossip })),
      offlineCap: ctx.NightMarket.OFFLINE_CAP, offlineRate: ctx.NightMarket.OFFLINE_RATE
    };
  }

  function validate(data, model) {
    const errs = [], bad = m => errs.push(m);
    if (!isObj(data)) return ['the file is not an object'];
    if (!model || !Array.isArray(model.stalls)) return ['no model to check against'];
    if (!same(Object.keys(data).sort(), ['gossip', 'schemaVersion'])) bad('top-level keys must be exactly schemaVersion and gossip');
    if (data.schemaVersion !== 1) bad('schemaVersion must be 1');
    if (!isObj(data.gossip)) { bad('gossip must be an object'); return errs; }
    const ids = model.stalls.map(s => s.id), bandIds = BANDS.map(b => b.id);
    if (!same(Object.keys(data.gossip), ids)) bad('gossip must have exactly the stall ids ' + ids.join(', ') + ', in the stall order');
    const allVendors = model.stalls.map(s => s.vendor), allowed = [].concat.apply([], allVendors.map(v => v.split(' ')));
    const seen = {}; model.stalls.forEach(s => { if (typeof s.gossip === 'string') seen[s.gossip.toLowerCase()] = 'the one-line gossip in model.js for ' + s.id; });
    model.stalls.forEach(stall => {
      const bands = data.gossip[stall.id], where = stall.id;
      if (!isObj(bands)) { if (stall.id in data.gossip) bad(where + ': a stall must be an object of bands'); return; }
      if (!same(Object.keys(bands), bandIds)) bad(where + ': bands must be exactly ' + bandIds.join(', ') + ', in that order');
      const all = [];
      bandIds.forEach(band => {
        const list = bands[band], w0 = where + '/' + band;
        if (!Array.isArray(list)) { if (band in bands) bad(w0 + ': a band must be a list'); return; }
        if (list.length < LIMITS.perBand[0]) bad(w0 + ': needs at least ' + LIMITS.perBand[0] + ' lines, has ' + list.length);
        if (list.length > LIMITS.perBand[1]) bad(w0 + ': has more than ' + LIMITS.perBand[1] + ' lines (' + list.length + ')');
        list.forEach((s, i) => {
          const w = w0 + '/' + (i + 1);
          if (typeof s !== 'string' || !s.trim()) { bad(w + ': a line must be non-empty text'); return; }
          all.push(s);
          if (s !== s.trim() || /\s{2,}/.test(s)) bad(w + ': line has stray spaces');
          if (/[^\x20-\x7e]/.test(s)) bad(w + ': use plain ASCII only');
          if (/[0-9]/.test(s)) bad(w + ': a line has a number in it; write counts as words or leave them out');
          if (/[<>{}\[\]]/.test(s)) bad(w + ': no markup or placeholders');
          if (s.length > LIMITS.line) bad(w + ': line is over ' + LIMITS.line + ' characters');
          if (!/[.!?]$/.test(s)) bad(w + ': line must end with . ! or ?');
          const n = sentences(s).length;
          if (n !== 1) bad(w + ': a line must be one sentence, has ' + n);
          if (seen[s.toLowerCase()]) bad(w + ': line repeats ' + seen[s.toLowerCase()]); else seen[s.toLowerCase()] = w;
          if (!names(s, stall.vendor)) bad(w + ': line must name ' + stall.vendor);
          allVendors.filter(v => v !== stall.vendor).forEach(v => { if (names(s, v) || (v === 'Old Wen' && names(s, 'Wen'))) bad(w + ': line names another vendor, ' + v); });
          const low = s.toLowerCase();
          PROMISES.forEach(p => { if (new RegExp('(^|[^a-z])' + esc(p)).test(low)) bad(w + ': uses "' + p + '", and gossip never promises pay'); });
          BANNED.forEach(b => { if (low.indexOf(b) >= 0) bad(w + ': uses "' + b + '"'); });
          (CUES[band] || []).forEach(c => { if (low.indexOf(c) >= 0) bad(w + ': "' + c + '" does not fit the ' + band + ' band'); });
          properNouns(s, allowed).forEach(p => bad(w + ': proper noun "' + p + '" is not one of the six vendors'));
        });
      });
      const joined = all.join(' ').toLowerCase();
      (VOICE[stall.id] || []).forEach(k => { if (joined.indexOf(k) < 0) bad(where + ': the lines never use "' + k + '", so the vendor\'s habit is lost'); });
    });
    if (model.offlineCap !== undefined && BANDS[BANDS.length - 1].toSec !== model.offlineCap) bad('the long band must end at the game\'s offline cap of ' + model.offlineCap + ' seconds');
    return errs;
  }

  /* Hand-made broken copies of a good file. Each must be rejected, and the problem must mention `expect`. */
  function malformed(good) {
    const c = () => JSON.parse(JSON.stringify(good)), out = [];
    const m = (name, expect, fn) => { const d = c(); const r = fn(d); out.push({ name, expect, data: r === undefined ? d : r }); };
    const g = d => d.gossip;
    m('null', 'not an object', () => null);
    m('array', 'not an object', () => []);
    m('wrong schemaVersion', 'schemaVersion', d => { d.schemaVersion = 2; });
    m('extra top-level key', 'top-level', d => { d.extra = 1; });
    m('gossip missing', 'top-level', d => { delete d.gossip; });
    m('gossip is a list', 'gossip must be an object', d => { d.gossip = []; });
    m('stall removed', 'exactly the stall ids', d => { delete g(d).stories; });
    m('unknown stall added', 'exactly the stall ids', d => { g(d).noodle = g(d).tea; });
    m('stall order changed', 'stall order', d => { d.gossip = { dumpling: g(d).dumpling, tea: g(d).tea, lantern: g(d).lantern, mooncake: g(d).mooncake, incense: g(d).incense, stories: g(d).stories }; });
    m('stall is a list', 'object of bands', d => { g(d).tea = []; });
    m('band removed', 'bands must be exactly', d => { delete g(d).tea.long; });
    m('extra band', 'bands must be exactly', d => { g(d).tea.later = g(d).tea.long; });
    m('band order changed', 'bands must be exactly', d => { const t = g(d).tea; g(d).tea = { evening: t.evening, short: t.short, long: t.long }; });
    m('band is a string', 'must be a list', d => { g(d).tea.short = 'Mei waits.'; });
    m('only two lines', 'at least 3', d => { g(d).tea.short.pop(); g(d).tea.short.pop(); });
    m('seven lines', 'more than 6', d => { ['Mei says she wiped the counter.', 'Mei says she rinsed the cups.', 'Mei says she swept the step.'].forEach(t => g(d).tea.short.push(t)); });
    m('line is a number', 'non-empty text', d => { g(d).tea.short[0] = 7; });
    m('empty line', 'non-empty text', d => { g(d).tea.short[0] = ''; });
    m('line with an edge space', 'stray spaces', d => { g(d).tea.short[0] = ' ' + g(d).tea.short[0]; });
    m('line with a double space', 'stray spaces', d => { g(d).tea.short[0] = g(d).tea.short[0].replace('says ', 'says  '); });
    m('curly quote', 'plain ASCII', d => { g(d).tea.short[0] = g(d).tea.short[0].replace('Mei says', 'Mei\u2019s word is that'); });
    m('digit in a line', 'number', d => { g(d).tea.short[0] = g(d).tea.short[0].replace('the kettle', '3 kettles'); });
    m('markup in a line', 'markup', d => { g(d).tea.short[0] = g(d).tea.short[0].replace(/\.$/, ' <b>.'); });
    m('placeholder in a line', 'markup', d => { g(d).tea.short[0] = g(d).tea.short[0].replace('Mei', '{vendor}'); });
    m('line over 100 characters', 'over 100', d => { g(d).tea.short[0] = g(d).tea.short[0].replace(/\.$/, ' and the lane was glad to see her again, and all her regulars too.'); });
    m('no closing mark', 'must end with', d => { g(d).tea.short[0] = g(d).tea.short[0].replace(/\.$/, ''); });
    m('two sentences', 'one sentence', d => { g(d).tea.short[0] += ' Mei smiles.'; });
    m('repeated line in another band', 'line repeats', d => { g(d).tea.evening[0] = g(d).tea.short[0]; });
    m('repeated line in another case', 'line repeats', d => { g(d).tea.evening[0] = g(d).tea.short[0].toUpperCase(); });
    m('same line for another vendor', 'line repeats', d => { g(d).dumpling.short[0] = g(d).tea.short[0].replace('Mei', 'Bo'); g(d).dumpling.short[1] = g(d).dumpling.short[0]; });
    m('line repeats the one in model.js', 'model.js', d => { g(d).tea.short[0] = 'Mei says the regulars were waiting in the dark.'; });
    m('own vendor not named', 'must name Mei', d => { g(d).tea.short[0] = g(d).tea.short[0].replace(/Mei/g, 'She'); });
    m('own vendor only inside a word', 'must name Mei', d => { g(d).tea.short[0] = g(d).tea.short[0].replace(/Mei/g, 'Meiling'); });
    m('another vendor named', 'another vendor, Bo', d => { g(d).tea.short[0] = g(d).tea.short[0].replace(/\.$/, ' with Bo.'); });
    m('Old Wen named at another stall', 'another vendor, Old Wen', d => { g(d).tea.short[0] = g(d).tea.short[0].replace('kettle', 'Old Wen'); });
    m('Wen alone named at another stall', 'another vendor, Old Wen', d => { g(d).tea.short[0] = g(d).tea.short[0].replace('kettle', 'Wen'); });
    m('the word double', 'double', d => { g(d).tea.short[0] = g(d).tea.short[0].replace('kettle', 'double kettle'); });
    m('the word bonus', 'bonus', d => { g(d).tea.short[0] = g(d).tea.short[0].replace('kettle', 'bonus kettle'); });
    m('the word multiplier', 'multiplier', d => { g(d).tea.short[0] = g(d).tea.short[0].replace('kettle', 'multiplier kettle'); });
    m('a promise of coins', 'coin', d => { g(d).tea.short[0] = g(d).tea.short[0].replace('kettle', 'coin jar'); });
    m('a promise of extra pay', 'extra', d => { g(d).tea.short[0] = g(d).tea.short[0].replace('kettle', 'extra kettle'); });
    m('a number as a word, hundred', 'hundred', d => { g(d).tea.short[0] = g(d).tea.short[0].replace('kettle', 'hundred kettles'); });
    m('real brand', 'starbucks', d => { g(d).tea.short[0] = g(d).tea.short[0].replace('kettle', 'Starbucks kettle'); });
    m('other game named', 'wildbond', d => { g(d).tea.short[0] = g(d).tea.short[0].replace('kettle', 'wildbond kettle'); });
    m('invented person', 'proper noun', d => { g(d).tea.short[2] = g(d).tea.short[2].replace('regulars', 'regulars like Linus'); });
    m('invented place', 'proper noun', d => { g(d).dumpling.short[0] = g(d).dumpling.short[0].replace('a story', 'a story in Lakeview'); });
    m('a short line that says all night', 'short band', d => { g(d).tea.short[0] = g(d).tea.short[0].replace('the kettle', 'the kettle all night'); });
    m('an evening line that says dawn', 'evening band', d => { g(d).tea.evening[0] = g(d).tea.evening[0].replace('a line', 'a line until dawn'); });
    m('a long line that says barely', 'long band', d => { g(d).tea.long[0] = g(d).tea.long[0].replace('the lanterns', 'the lanterns, barely'); });
    m('habit lost: tea never says dark', 'never use "dark"', d => { Object.keys(g(d).tea).forEach(b => { g(d).tea[b] = g(d).tea[b].map(t => t.replace(/dark/g, 'night')); }); });
    m('habit lost: stories never say ending', 'never use "ending"', d => { Object.keys(g(d).stories).forEach(b => { g(d).stories[b] = g(d).stories[b].map(t => t.replace(/ending/g, 'finish')); }); });
    m('habit lost: mooncake never says tins', 'never use "tins"', d => { Object.keys(g(d).mooncake).forEach(b => { g(d).mooncake[b] = g(d).mooncake[b].map(t => t.replace(/tins/g, 'boxes')); }); });
    return out;
  }

  function checks(input) {
    const out = [], add = (name, ok, detail) => out.push({ name, ok: !!ok, detail: ok ? '' : (detail || '') });
    const data = input && input.data !== undefined ? input.data : JSON.parse(fs.readFileSync(FILE, 'utf8'));
    const model = input && input.stalls ? { stalls: input.stalls, offlineCap: input.offlineCap } : loadModel();
    const problems = validate(data, model);
    const gossip = isObj(data) && isObj(data.gossip) ? data.gossip : {};
    const lines = [];
    Object.keys(gossip).forEach(k => { if (isObj(gossip[k])) Object.keys(gossip[k]).forEach(b => (Array.isArray(gossip[k][b]) ? gossip[k][b] : []).forEach(s => lines.push(s))); });
    add('the model gives six stalls with a vendor each', model.stalls.length === 6 && model.stalls.every(s => s.id && s.vendor), JSON.stringify(model.stalls));
    add('the model gives the offline cap of four hours', model.offlineCap === 4 * 3600, String(model.offlineCap));
    add('the band edges are 30 minutes, 2 hours and the offline cap, with no gap', BANDS[0].fromSec === 0 && BANDS[0].toSec === 1800 && BANDS[1].fromSec === 1800 && BANDS[1].toSec === 7200 && BANDS[2].fromSec === 7200 && BANDS[2].toSec === model.offlineCap);
    add('the file passes every rule', problems.length === 0, problems.slice(0, 8).join(' | '));
    add('each stall id matches the game, in order', same(Object.keys(gossip), model.stalls.map(s => s.id)));
    add('each stall has the bands short, evening and long, in order', model.stalls.every(s => isObj(gossip[s.id]) && same(Object.keys(gossip[s.id]), ['short', 'evening', 'long'])));
    add('each band has at least three lines', model.stalls.every(s => isObj(gossip[s.id]) && BANDS.every(b => Array.isArray(gossip[s.id][b.id]) && gossip[s.id][b.id].length >= 3)));
    add('every line differs from every other line, and from the one-line gossip in model.js', (() => { const all = lines.map(s => String(s).toLowerCase()).concat(model.stalls.map(s => String(s.gossip).toLowerCase())); return all.length >= 18 && new Set(all).size === all.length; })());
    add('every line names its own vendor and no other', model.stalls.every(s => isObj(gossip[s.id]) && BANDS.every(b => (gossip[s.id][b.id] || []).every(t => names(t, s.vendor) && model.stalls.every(o => o.vendor === s.vendor || (!names(t, o.vendor) && !(o.vendor === 'Old Wen' && names(t, 'Wen'))))))));
    add('the longest line fits the limit', Math.max.apply(null, [0].concat(lines.map(t => String(t).length))) <= LIMITS.line);
    add('no line has a digit', lines.every(t => !/[0-9]/.test(t)));
    add('validate does not throw on odd input', [null, 'x', [], 5, undefined, {}, { gossip: 5 }, { schemaVersion: 1, gossip: { tea: null } }, { schemaVersion: 1, gossip: { tea: { short: [null], evening: 3, long: {} } } }].every(v => { try { return validate(v, model).length > 0; } catch (e) { return false; } }));
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

  return { run, checks, validate, malformed, loadModel, BANDS, LIMITS };
});
