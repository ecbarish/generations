/* Lantern Bowl roster view (LB-G7). A club's 22 players as a list, with ratings in words and stars first and numbers second.
   Nothing in the game opens this screen yet, and nothing here touches a save, a clock, the network or any game file.
   Reads the shape of games/lantern-bowl/roster.json: { schemaVersion, clubs: { <clubId>: { qb, rb, wr[2], te, line[5], front[4], backers[3], secondary[4], kicker } } }.

   rows(roster, clubId)   pure, no DOM. One row per player, in this order: QB, RB, WR, WR, TE, line, front, backers, secondary, kicker.
       Each row is { slot, label, group, id, name, age, best, overall, stars, word }:
         slot     the roster key ('qb', 'line', ...)       label  the short tag shown ('QB', 'OL', ...)
         group    'Offence', 'Defence' or 'Kicker'         best   the player's two best ratings, highest first, as
                                                                  { key, label, value, stars, word }; a tie goes to the key that comes first in RATING_KEYS
         overall  the mean of the ratings the player has (the same definition as tests/lantern-bowl-roster.cjs)
         stars    1 to 5 from overall rounded to a whole number: 35-45 one, 46-56 two, 57-67 three, 68-78 four, 79-90 five
         word     Rough, Fair, Solid, Strong or Elite for those five grades
       Throws an Error that names the problem for an unknown club, a missing or wrong-sized slot, or a player that is not valid.
       It never changes what it is given, and the same input always gives the same rows.
   render(container, rows)  builds the list inside `container` (replacing what was there). Rows are at least 44px tall and all text is 16px or larger.
       The few styles it needs are added once as one <style id="lbrv-style"> block, and every class starts with lbrv-, so nothing else on the page changes.
   gradeOf(value)  the 1-to-5 grade for one number, for tests and tooltips.
   Ratings run 35 to 90 (Evan's approved range). A missing rating key is not a rating (it reads as 50 in the game, but a view shows only what a player has). */
(function (root) {
  'use strict';

  var MIN_RATING = 35, MAX_RATING = 90;
  var BANDS = [[35, 45], [46, 56], [57, 67], [68, 78], [79, 90]];     // one entry per star, 1 to 5
  var WORDS = ['Rough', 'Fair', 'Solid', 'Strong', 'Elite'];
  var RATING_KEYS = ['throw', 'catch', 'speed', 'carry', 'block', 'rush', 'cover', 'tackle', 'kick'];
  var RATING_LABELS = { throw: 'Throwing', catch: 'Catching', speed: 'Speed', carry: 'Carrying', block: 'Blocking', rush: 'Pass rush', cover: 'Coverage', tackle: 'Tackling', kick: 'Kicking' };
  // slot key, how many players, the short tag, the group
  var SLOTS = [
    ['qb', 1, 'QB', 'Offence'], ['rb', 1, 'RB', 'Offence'], ['wr', 2, 'WR', 'Offence'], ['te', 1, 'TE', 'Offence'], ['line', 5, 'OL', 'Offence'],
    ['front', 4, 'DL', 'Defence'], ['backers', 3, 'LB', 'Defence'], ['secondary', 4, 'DB', 'Defence'], ['kicker', 1, 'K', 'Kicker']
  ];
  var GROUPS = ['Offence', 'Defence', 'Kicker'];

  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function isObject(o) { return o !== null && typeof o === 'object' && !Array.isArray(o); }
  function isWhole(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }

  function gradeOf(value) {
    if (typeof value !== 'number' || !isFinite(value)) throw new Error('A rating must be a finite number, got ' + String(value));
    var n = Math.round(value);
    for (var i = 0; i < BANDS.length; i++) if (n <= BANDS[i][1]) return i + 1;
    return BANDS.length;                                   // above 90 can only mean the top grade
  }

  function checkPlayer(p, path) {
    if (!isObject(p)) throw new Error(path + ' must be a player object');
    if (typeof p.id !== 'string' || !p.id) throw new Error(path + ' needs an id');
    if (typeof p.name !== 'string' || !p.name.trim()) throw new Error(path + ' needs a name');
    if (!isWhole(p.age) || p.age < 1) throw new Error(path + ' (' + p.name + ') needs a whole-number age');
    var have = RATING_KEYS.filter(function (k) { return own(p, k); });
    if (have.length < 2) throw new Error(path + ' (' + p.name + ') needs at least two ratings');
    have.forEach(function (k) {
      if (!isWhole(p[k]) || p[k] < MIN_RATING || p[k] > MAX_RATING) throw new Error(path + ' (' + p.name + ') has ' + k + ' ' + String(p[k]) + ', which is not a whole number from 35 to 90');
    });
    Object.keys(p).forEach(function (k) {
      if (k !== 'id' && k !== 'name' && k !== 'age' && RATING_KEYS.indexOf(k) < 0) throw new Error(path + ' (' + p.name + ') has an unknown key ' + k);
    });
    return have;
  }

  function rows(roster, clubId) {
    if (!isObject(roster) || !isObject(roster.clubs)) throw new Error('The roster must be an object with a clubs object');
    var ids = Object.keys(roster.clubs);
    if (typeof clubId !== 'string' || !own(roster.clubs, clubId)) throw new Error('Unknown club "' + String(clubId) + '". The clubs are: ' + ids.join(', '));
    var club = roster.clubs[clubId], out = [];
    SLOTS.forEach(function (s) {
      var key = s[0], count = s[1], list = club && club[key];
      if (count === 1) {
        if (!isObject(list)) throw new Error(clubId + '.' + key + ' must be one player');
        list = [list];
      } else if (!Array.isArray(list) || list.length !== count) {
        throw new Error(clubId + '.' + key + ' must be a list of exactly ' + count + ' players');
      }
      list.forEach(function (p, i) {
        var path = clubId + '.' + key + (count === 1 ? '' : '[' + i + ']');
        var have = checkPlayer(p, path);
        var sum = 0;
        have.forEach(function (k) { sum += p[k]; });
        var overall = sum / have.length;
        var best = have.map(function (k, order) { return { key: k, value: p[k], order: order }; })
          .sort(function (a, b) { return b.value - a.value || a.order - b.order; })      // `have` follows RATING_KEYS, so a tie keeps that order
          .slice(0, 2)
          .map(function (r) { var g = gradeOf(r.value); return { key: r.key, label: RATING_LABELS[r.key], value: r.value, stars: g, word: WORDS[g - 1] }; });
        var stars = gradeOf(overall);
        out.push({ slot: key, label: s[2], group: s[3], id: p.id, name: p.name, age: p.age, best: best, overall: overall, stars: stars, word: WORDS[stars - 1] });
      });
    });
    return out;
  }

  var CSS =
    '.lbrv-root{--lbrv-ink:#f6edd4;--lbrv-lamp:#f2d080;--lbrv-dim:#d9c89a;--lbrv-line:#6d5a38;--lbrv-panel:#141820;--lbrv-row:#1b2430;' +
    'font:16px/1.25 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--lbrv-ink);display:grid;grid-template-columns:1fr;gap:12px;align-items:start}' +
    '@media (min-width:640px){.lbrv-root{grid-template-columns:1fr 1fr}' +
    '.lbrv-group[data-group="Offence"]{grid-column:1;grid-row:1}' +
    '.lbrv-group[data-group="Defence"]{grid-column:2;grid-row:1 / span 2}' +
    '.lbrv-group[data-group="Kicker"]{grid-column:1;grid-row:2}}' +
    '.lbrv-group{border:1px solid var(--lbrv-line);border-radius:8px;background:var(--lbrv-panel);overflow:hidden;min-width:0}' +
    '.lbrv-head{margin:0;padding:8px 12px;min-height:44px;display:flex;align-items:center;font-size:16px;font-weight:700;color:var(--lbrv-lamp);border-bottom:1px solid var(--lbrv-line)}' +
    '.lbrv-rows{list-style:none;margin:0;padding:0}' +
    '.lbrv-row{display:grid;grid-template-columns:1.7rem minmax(0,1fr) auto;column-gap:8px;align-items:center;min-height:44px;padding:6px 10px;background:var(--lbrv-row)}' +
    '.lbrv-row+.lbrv-row{border-top:1px solid #243044}' +
    '.lbrv-row:nth-child(even){background:#141820}' +
    '.lbrv-slot{font-weight:700;color:var(--lbrv-lamp)}' +
    '.lbrv-who{min-width:0}' +
    '.lbrv-name{display:block;font-weight:700;overflow-wrap:anywhere}' +
    '.lbrv-age{display:block;font-weight:400;color:var(--lbrv-dim)}' +
    '.lbrv-best{display:block;color:var(--lbrv-ink);white-space:nowrap}' +
    '.lbrv-rw{font-weight:700}' +
    '.lbrv-rn{color:var(--lbrv-dim)}' +
    '.lbrv-grade{text-align:right;white-space:nowrap}' +
    '.lbrv-stars{display:block;font-size:20px;letter-spacing:0;color:var(--lbrv-lamp)}' +
    '.lbrv-off{color:#d9c89a}' +
    '.lbrv-word{display:block;font-weight:700}';

  function el(doc, tag, cls, text) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function ensureStyle(doc) {
    if (doc.getElementById('lbrv-style')) return;
    var s = doc.createElement('style');
    s.id = 'lbrv-style';
    s.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(s);
  }

  function starsNode(doc, n, word) {
    var wrap = el(doc, 'span', 'lbrv-stars');
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', n + ' of 5 stars, ' + word);
    for (var i = 1; i <= 5; i++) wrap.appendChild(el(doc, 'span', i <= n ? 'lbrv-on' : 'lbrv-off', i <= n ? '\u2605' : '\u2606'));
    return wrap;
  }

  function rowNode(doc, r) {
    var li = el(doc, 'li', 'lbrv-row');
    li.setAttribute('data-slot', r.slot);
    li.appendChild(el(doc, 'span', 'lbrv-slot', r.label));
    var who = el(doc, 'span', 'lbrv-who');
    who.appendChild(el(doc, 'span', 'lbrv-name', r.name));
    r.best.forEach(function (b) {
      var line = el(doc, 'span', 'lbrv-best');
      line.appendChild(doc.createTextNode(b.label + ' '));
      line.appendChild(el(doc, 'span', 'lbrv-rw', b.word));
      line.appendChild(doc.createTextNode(' '));
      line.appendChild(el(doc, 'span', 'lbrv-rn', String(b.value)));
      who.appendChild(line);
    });
    li.appendChild(who);
    var grade = el(doc, 'span', 'lbrv-grade');
    grade.appendChild(starsNode(doc, r.stars, r.word));
    grade.appendChild(el(doc, 'span', 'lbrv-word', r.word));
    grade.appendChild(el(doc, 'span', 'lbrv-age', 'age ' + r.age));
    li.appendChild(grade);
    return li;
  }

  function render(container, list) {
    if (!container || !container.ownerDocument) throw new Error('render needs a DOM element to draw into');
    if (!Array.isArray(list) || !list.length) throw new Error('render needs the rows that rows() returns');
    var doc = container.ownerDocument;
    ensureStyle(doc);
    while (container.firstChild) container.removeChild(container.firstChild);
    container.className = (container.className ? container.className.replace(/\blbrv-root\b/g, '').trim() + ' ' : '') + 'lbrv-root';
    GROUPS.forEach(function (g) {
      var section = el(doc, 'section', 'lbrv-group');
      section.setAttribute('data-group', g);
      section.appendChild(el(doc, 'h2', 'lbrv-head', g));
      var ol = el(doc, 'ol', 'lbrv-rows');
      list.filter(function (r) { return r.group === g; }).forEach(function (r) { ol.appendChild(rowNode(doc, r)); });
      section.appendChild(ol);
      container.appendChild(section);     // reading order stays Offence, Defence, Kicker; on a wide screen the CSS puts the kicker under offence (11 and 11)
    });
    return container;
  }

  var api = { rows: rows, render: render, gradeOf: gradeOf, BANDS: BANDS, WORDS: WORDS, RATING_KEYS: RATING_KEYS, RATING_LABELS: RATING_LABELS, SLOTS: SLOTS, MIN_RATING: MIN_RATING, MAX_RATING: MAX_RATING, CSS: CSS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LanternBowlRosterView = api;
})(typeof window === 'object' ? window : globalThis);
