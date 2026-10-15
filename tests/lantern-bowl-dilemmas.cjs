/* Checks for games/lantern-bowl/dilemmas.json (LB-G6). Plain Node, no packages:  node tests/lantern-bowl-dilemmas.cjs
   Exports { run, checks, validate }. With no `module` it sets window.LanternBowlDilemmaChecks; there the caller passes the
   parsed JSON to checks(data), because a page has no file system. validate(data) returns a list of problems (empty = fine). */
(function (root, factory) {
  const api = factory(typeof require === 'function' ? require : null);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LanternBowlDilemmaChecks = api;
  if (typeof require === 'function' && typeof module === 'object' && require.main === module) process.exitCode = api.run() ? 0 : 1;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (req) {
  'use strict';
  const fs = req ? req('fs') : null, path = req ? req('path') : null;
  const FILE = path ? path.join(__dirname, '..', 'games', 'lantern-bowl', 'dilemmas.json') : null;

  const WHEN = ['afterWin', 'afterLoss', 'bye', 'beforeGame'];
  const ROLES = ['qb', 'rb', 'wr', 'te', 'line', 'defence', 'kicker', 'team'];
  const SCORED = ['morale', 'points', 'fans', 'owner'];                       // the four numbers an effect can change
  const EFFECT_KEYS = ['morale', 'target', 'points', 'fans', 'owner'];
  const LIMITS = { minCards: 12, text: 160, label: 32, result: 120, perWhen: 3, morale: [-5, 5], points: [0, 3], fans: [-5, 5], owner: [-5, 5] };
  const PLACEHOLDERS = ['name', 'club'];
  // The names already in Lantern Bowl's two starting clubs, which a card must never use, and one phrase to keep clear of.
  const KNOWN = ['Wren', 'Talley', 'Mara', 'Holt', 'Ada', 'Brisk', 'Tomas', 'Reed', 'Bram', 'Okafor', 'Sol', 'Varga', 'Ned', 'Harrow', 'Cole', 'Pimm',
    'Lise', 'Venn', 'Otto', 'Brant', 'Ivo', 'Pell', 'Pat', 'Low', 'Brackenport', 'Millrace', 'Retro Bowl'];

  const isInt = v => typeof v === 'number' && isFinite(v) && Math.floor(v) === v;
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const same = (a, b) => a.length === b.length && a.slice().sort().join() === b.slice().sort().join();
  const val = (e, k) => (e && typeof e[k] === 'number' ? e[k] : 0);

  function placeholdersOf(s) { return (String(s).match(/\{[^}]*\}|[{}]/g) || []); }
  /* Capitalised words in the middle of a sentence would mean a proper noun (a person or a place). */
  function properNouns(s) {
    const clean = String(s).replace(/\{[^}]*\}/g, 'ph');
    const out = [];
    clean.split(/(?<=[.!?])\s+/).forEach(sentence => sentence.split(/\s+/).slice(1).forEach(w => { if (/^[A-Z]/.test(w.replace(/^[^A-Za-z]+/, ''))) out.push(w); }));
    return out;
  }

  function validate(data) {
    const errs = [], bad = m => errs.push(m);
    if (!isObj(data)) return ['the file is not an object'];
    if (!same(Object.keys(data), ['schemaVersion', 'cards'])) bad('top level must have exactly schemaVersion and cards, has: ' + Object.keys(data).join(','));
    if (data.schemaVersion !== 1) bad('schemaVersion must be 1');
    if (!Array.isArray(data.cards)) { bad('cards must be an array'); return errs; }
    if (data.cards.length < LIMITS.minCards) bad('need at least ' + LIMITS.minCards + ' cards, found ' + data.cards.length);
    const ids = new Set(), texts = new Set(), perWhen = {}, roles = new Set();
    data.cards.forEach((card, i) => {
      const at = 'card ' + i + (isObj(card) && card.id ? ' (' + card.id + ')' : '');
      if (!isObj(card)) return bad(at + ' is not an object');
      if (!same(Object.keys(card), ['id', 'when', 'role', 'text', 'choices'])) bad(at + ': keys must be exactly id, when, role, text, choices');
      if (typeof card.id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(card.id)) bad(at + ': id must be lowercase words joined by dashes');
      else if (ids.has(card.id)) bad(at + ': duplicate id'); else ids.add(card.id);
      if (WHEN.indexOf(card.when) < 0) bad(at + ': when must be one of ' + WHEN.join(', ')); else perWhen[card.when] = (perWhen[card.when] || 0) + 1;
      if (ROLES.indexOf(card.role) < 0) bad(at + ': role must be one of ' + ROLES.join(', ')); else roles.add(card.role);
      if (typeof card.text !== 'string' || !card.text.trim()) bad(at + ': text is missing');
      else {
        if (card.text.length > LIMITS.text) bad(at + ': text is ' + card.text.length + ' characters, the limit is ' + LIMITS.text);
        if (texts.has(card.text)) bad(at + ': text repeats another card'); texts.add(card.text);
        if (card.role && card.role !== 'team' && card.text.indexOf('{name}') < 0) bad(at + ': a ' + card.role + ' card must use {name} in its text');
        if (card.role === 'team' && /\{name\}/.test(card.text + JSON.stringify(card.choices || []))) bad(at + ': a team card has no one to call {name}');
      }
      if (!Array.isArray(card.choices) || card.choices.length !== 2) { bad(at + ': must have exactly two choices'); return; }
      card.choices.forEach((c, j) => {
        const cat = at + ' choice ' + j;
        if (!isObj(c)) return bad(cat + ' is not an object');
        if (!same(Object.keys(c), ['label', 'result', 'effects'])) bad(cat + ': keys must be exactly label, result, effects');
        if (typeof c.label !== 'string' || !c.label.trim()) bad(cat + ': label is missing');
        else if (c.label.length > LIMITS.label) bad(cat + ': label is ' + c.label.length + ' characters, the limit is ' + LIMITS.label);
        if (typeof c.result !== 'string' || !c.result.trim()) bad(cat + ': result is missing');
        else {
          if (c.result.length > LIMITS.result) bad(cat + ': result is ' + c.result.length + ' characters, the limit is ' + LIMITS.result);
          if (!/^(\{[a-z]+\}|[A-Z])/.test(c.result) || !/\.$/.test(c.result)) bad(cat + ': result must be a full sentence that starts with a capital and ends with a full stop');
        }
        [card.text, c.label, c.result].forEach(s => {
          if (typeof s !== 'string') return;
          placeholdersOf(s).forEach(p => { if (PLACEHOLDERS.indexOf(p.slice(1, -1)) < 0 || p.length < 3) bad(cat + ': "' + p + '" is not an allowed placeholder (only {name} and {club})'); });
          properNouns(s).forEach(w => bad(cat + ': "' + w + '" looks like a proper noun; use {name} or {club}'));
          KNOWN.forEach(n => { if (new RegExp('\\b' + n + '\\b', 'i').test(s)) bad(cat + ': uses the real name "' + n + '"'); });
        });
        const e = c.effects;
        if (!isObj(e)) return bad(cat + ': effects must be an object');
        Object.keys(e).forEach(k => { if (EFFECT_KEYS.indexOf(k) < 0) bad(cat + ': effects has an unknown key "' + k + '"'); });
        SCORED.forEach(k => {
          if (!(k in e)) return;
          const range = LIMITS[k];
          if (!isInt(e[k])) bad(cat + ': ' + k + ' must be a whole number');
          else if (e[k] < range[0] || e[k] > range[1]) bad(cat + ': ' + k + ' must be from ' + range[0] + ' to ' + range[1] + ', is ' + e[k]);
        });
        if ('morale' in e && e.target !== 'player' && e.target !== 'team') bad(cat + ': morale needs a target of player or team');
        if ('target' in e && !('morale' in e)) bad(cat + ': target without morale');
        if (!SCORED.some(k => val(e, k) !== 0)) bad(cat + ': every effect is zero');
      });
      if (card.choices.every(c => isObj(c) && isObj(c.effects))) {
        const [a, b] = card.choices.map(c => c.effects);
        const differ = SCORED.filter(k => val(a, k) !== val(b, k));
        if (differ.length < 2) bad(at + ': the two choices differ in only ' + differ.length + ' effect key(s); they must differ in at least two');
        const aWins = SCORED.every(k => val(a, k) >= val(b, k)), bWins = SCORED.every(k => val(b, k) >= val(a, k));
        if ((aWins || bWins) && differ.length) bad(at + ': one choice is better than the other in every effect, so it costs nothing');
        if (card.choices[0].label === card.choices[1].label) bad(at + ': both choices have the same label');
        if (card.choices[0].result === card.choices[1].result) bad(at + ': both choices have the same result');
      }
    });
    WHEN.forEach(w => { if ((perWhen[w] || 0) < LIMITS.perWhen) bad('need at least ' + LIMITS.perWhen + ' cards for ' + w + ', found ' + (perWhen[w] || 0)); });
    ROLES.forEach(r => { if (!roles.has(r)) bad('no card uses the role ' + r); });
    return errs;
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* Each of these breaks one thing in a copy of the good data. validate must report a problem for every one. */
  function malformed(good) {
    const m = [];
    const add = (name, fn) => { const d = clone(good); fn(d); m.push([name, d]); };
    add('schemaVersion 2', d => { d.schemaVersion = 2; });
    add('schemaVersion missing', d => { delete d.schemaVersion; });
    add('an extra top-level key', d => { d.extra = 1; });
    add('cards is not an array', d => { d.cards = {}; });
    add('too few cards', d => { d.cards = d.cards.slice(0, 11); });
    add('a duplicate id', d => { d.cards[1].id = d.cards[0].id; });
    add('an id with capitals', d => { d.cards[0].id = 'Bad Id'; });
    add('an unknown when', d => { d.cards[0].when = 'halftime'; });
    add('an unknown role', d => { d.cards[0].role = 'coach'; });
    add('text over 160 characters', d => { d.cards[0].text = 'A'.padEnd(161, 'a'); });
    add('empty text', d => { d.cards[0].text = ''; });
    add('a repeated card text', d => { d.cards[1].text = d.cards[0].text; d.cards[1].role = d.cards[0].role; });
    add('a player card with no {name}', d => { const c = d.cards.find(x => x.role !== 'team'); c.text = 'Someone is upset about the game.'; });
    add('a team card that uses {name}', d => { const c = d.cards.find(x => x.role === 'team'); c.text += ' {name} agrees.'; });
    add('one choice only', d => { d.cards[0].choices.pop(); });
    add('three choices', d => { d.cards[0].choices.push(clone(d.cards[0].choices[0])); });
    add('a label over 32 characters', d => { d.cards[0].choices[0].label = 'L'.padEnd(33, 'l'); });
    add('a result over 120 characters', d => { d.cards[0].choices[0].result = 'R' + 'r'.repeat(125) + '.'; });
    add('a result with no full stop', d => { d.cards[0].choices[0].result = 'The crowd goes quiet'; });
    add('an unknown placeholder', d => { d.cards[0].text += ' {coach} waves.'; });
    add('an unclosed placeholder', d => { d.cards[0].choices[0].result = 'The {name team cheers.'; });
    add('a real player name', d => { d.cards.find(x => x.role !== 'team').text += ' Wren Talley disagrees.'; });
    add('a proper noun', d => { d.cards[0].choices[0].result = 'The team visits Paris.'; });
    add('an unknown effect key', d => { d.cards[0].choices[0].effects.coins = 2; });
    add('morale out of range', d => { d.cards[0].choices[0].effects.morale = 6; d.cards[0].choices[0].effects.target = 'team'; });
    add('morale with no target', d => { const e = d.cards.find(x => x.choices[0].effects.morale !== undefined).choices[0].effects; delete e.target; });
    add('a target with no morale', d => { d.cards[0].choices[1].effects = { target: 'team', fans: 1 }; });
    add('a bad target', d => { const e = d.cards.find(x => x.choices[0].effects.morale !== undefined).choices[0].effects; e.target = 'coach'; });
    add('points below 0', d => { d.cards[0].choices[0].effects.points = -1; });
    add('points above 3', d => { d.cards[0].choices[0].effects.points = 4; });
    add('fans out of range', d => { d.cards[0].choices[0].effects.fans = -6; });
    add('owner out of range', d => { d.cards[0].choices[0].effects.owner = 9; });
    add('a fractional effect', d => { d.cards[0].choices[0].effects.fans = 1.5; });
    add('a string effect', d => { d.cards[0].choices[0].effects.fans = '2'; });
    add('a choice with no effects', d => { d.cards[0].choices[0].effects = {}; });
    add('choices that differ in one key', d => { const c = d.cards[0]; c.choices[1].effects = clone(c.choices[0].effects); c.choices[1].effects.fans = (c.choices[1].effects.fans || 0) + 1; });
    add('one choice that is better in everything', d => { const c = d.cards[0]; c.choices[0].effects = { points: 2, fans: 2, owner: 1 }; c.choices[1].effects = { points: 1, fans: 1 }; });
    add('two identical choices', d => { const c = d.cards[0]; c.choices[1] = clone(c.choices[0]); });
    add('fewer than three cards for one when', d => { d.cards.filter(c => c.when === 'bye').slice(2).forEach(c => { c.when = 'afterWin'; }); });
    add('a role nobody uses', d => { d.cards.filter(c => c.role === 'kicker').forEach(c => { c.role = 'team'; c.text = c.text.replace(/\{name\}/g, 'the kicker'); c.choices.forEach(x => { x.label = x.label.replace(/\{name\}/g, 'they'); x.result = x.result.replace(/\{name\}/g, 'the kicker'); }); }); });
    add('a card with an extra key', d => { d.cards[0].mood = 'happy'; });
    add('a choice with an extra key', d => { d.cards[0].choices[0].cost = 1; });
    add('a card that is not an object', d => { d.cards[0] = 'hello'; });
    return m;
  }

  function checks(data) {
    const out = [], add = (name, ok, detail) => out.push({ name, ok: !!ok, detail: ok ? '' : (detail === undefined ? '' : String(detail)) });
    if (data === undefined) {
      if (!fs) throw new Error('pass the parsed dilemmas.json to checks(data) when there is no file system');
      add('dilemmas.json exists and is valid JSON', (() => { try { data = JSON.parse(fs.readFileSync(FILE, 'utf8')); return true; } catch (e) { return false; } })());
      if (!data) return out;
    }
    const errs = validate(data);
    add('the file passes every rule (no problems)', errs.length === 0, errs.slice(0, 5).join(' | '));
    errs.slice(0, 20).forEach(e => add('problem: ' + e, false));
    const cards = Array.isArray(data.cards) ? data.cards : [];
    add('schemaVersion is 1', data.schemaVersion === 1);
    add('there are at least 12 cards', cards.length >= LIMITS.minCards, cards.length);
    add('every id is unique', new Set(cards.map(c => c.id)).size === cards.length);
    WHEN.forEach(w => add('at least 3 cards for ' + w, cards.filter(c => c.when === w).length >= LIMITS.perWhen, cards.filter(c => c.when === w).length));
    ROLES.forEach(r => add('role ' + r + ' has a card', cards.some(c => c.role === r)));
    add('every card has exactly two choices', cards.every(c => Array.isArray(c.choices) && c.choices.length === 2));
    add('no card text is over 160 characters', cards.every(c => String(c.text).length <= LIMITS.text), Math.max.apply(null, cards.map(c => String(c.text).length)));
    add('no label is over 32 and no result is over 120 characters', cards.every(c => (c.choices || []).every(x => String(x.label).length <= LIMITS.label && String(x.result).length <= LIMITS.result)));
    add('the two choices of every card differ in at least two effect keys', cards.every(c => {
      const [a, b] = (c.choices || []).map(x => x.effects || {}); return a && b && SCORED.filter(k => val(a, k) !== val(b, k)).length >= 2; }));
    add('no choice is free: neither choice of a card wins in every effect', cards.every(c => {
      const [a, b] = (c.choices || []).map(x => x.effects || {});
      return a && b && !SCORED.every(k => val(a, k) >= val(b, k)) && !SCORED.every(k => val(b, k) >= val(a, k)); }));
    add('every effect key used is allowed', cards.every(c => (c.choices || []).every(x => Object.keys(x.effects || {}).every(k => EFFECT_KEYS.indexOf(k) >= 0))));
    add('only {name} and {club} are used as placeholders', cards.every(c => [c.text].concat((c.choices || []).map(x => x.label), (c.choices || []).map(x => x.result))
      .every(s => placeholdersOf(s).every(p => p === '{name}' || p === '{club}'))));
    add('both placeholders are used somewhere in the file', JSON.stringify(cards).indexOf('{name}') >= 0 && JSON.stringify(cards).indexOf('{club}') >= 0);
    add('every effect is small: none is above 3 in size', cards.every(c => (c.choices || []).every(x => SCORED.every(k => Math.abs(val(x.effects, k)) <= 3))));

    // Malformed data must be rejected, and a few helper behaviours must hold.
    add('validate accepts a clean copy of the data', validate(clone(data)).length === 0);
    malformed(data).forEach(([name, d]) => { const e = validate(d); add('rejects: ' + name, e.length > 0, 'no problem reported'); });
    add('validate does not throw on null, a string or an array', [null, 'x', [], 5, undefined].every(v => { try { return validate(v).length > 0; } catch (e) { return false; } }));
    add('validate changes nothing it was given', (() => { const s = JSON.stringify(data); validate(data); return JSON.stringify(data) === s; })());
    return out;
  }

  function run(log) {
    log = log || console.log;
    const results = checks(), bad = results.filter(r => !r.ok);
    results.forEach(r => log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? ' [' + r.detail + ']' : '')));
    log('\n' + (results.length - bad.length) + ' passed, ' + bad.length + ' failed');
    return bad.length === 0;
  }

  return { run, checks, validate, malformed, LIMITS };
});
