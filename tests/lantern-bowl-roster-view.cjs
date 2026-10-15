/* Checks for games/lantern-bowl/roster-view.js (LB-G7). Plain Node, no packages:  node tests/lantern-bowl-roster-view.cjs
   Exports { run, checks, fakeDocument }. With no `module` it sets window.LanternBowlRosterViewChecks.
   The roster file has 22 players a club (10 offence, 11 defence, a kicker). The backlog row says 23; the Director's correction on #373
   (issuecomment-6182646603) and tests/lantern-bowl-roster.cjs both say 22, so this checks 22 and counts them from the file itself.
   render() is run on a tiny stand-in DOM below, so this test needs no browser; the preview page is checked in a real Chrome separately. */
(function (root, factory) {
  const api = factory(typeof require === 'function' ? require : null);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LanternBowlRosterViewChecks = api;
  if (typeof require === 'function' && typeof module === 'object' && require.main === module) process.exitCode = api.run() ? 0 : 1;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (req) {
  'use strict';
  const fs = req ? req('fs') : null, path = req ? req('path') : null, vm = req ? req('vm') : null;
  const SRC = path ? path.join(__dirname, '..', 'games', 'lantern-bowl', 'roster-view.js') : null;
  const ROSTER = path ? path.join(__dirname, '..', 'games', 'lantern-bowl', 'roster.json') : null;
  const CLUBS = ['brackenport', 'millrace', 'harrowgate', 'tollbridge', 'quarryhill', 'fernmoor'];
  const ORDER = ['qb', 'rb', 'wr', 'wr', 'te', 'line', 'line', 'line', 'line', 'line', 'front', 'front', 'front', 'front', 'backers', 'backers', 'backers', 'secondary', 'secondary', 'secondary', 'secondary', 'kicker'];
  const BANDS = [[35, 45], [46, 56], [57, 67], [68, 78], [79, 90]];
  const KEYS = ['throw', 'catch', 'speed', 'carry', 'block', 'rush', 'cover', 'tackle', 'kick'];

  const clone = o => JSON.parse(JSON.stringify(o));
  const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
  const throwsWith = (fn, re) => { try { fn(); return false; } catch (e) { return !!e && typeof e.message === 'string' && re.test(e.message); } };

  /* A stand-in DOM with just what render() uses. */
  function fakeDocument() {
    const styles = [];
    function node(tag, doc) {
      const n = { tag, ownerDocument: doc, children: [], attrs: {}, className: '', _text: '', id: '', parent: null,
        appendChild(c) { c.parent = n; n.children.push(c); return c; },
        removeChild(c) { n.children.splice(n.children.indexOf(c), 1); c.parent = null; return c; },
        setAttribute(k, v) { n.attrs[k] = String(v); },
        get firstChild() { return n.children[0] || null; },
        set textContent(t) { n._text = String(t); },
        get textContent() { return n._text + n.children.map(c => c.textContent).join(''); } };
      return n;
    }
    const doc = {
      head: null, documentElement: null,
      createElement(tag) { return node(tag, doc); },
      createTextNode(t) { const n = node('#text', doc); n._text = String(t); return n; },
      getElementById(id) { return styles.find(s => s.id === id) || null; }
    };
    doc.head = node('head', doc);
    doc.head.appendChild = function (c) { c.parent = doc.head; doc.head.children.push(c); if (c.tag === 'style') styles.push(c); return c; };
    doc.documentElement = doc.head;
    doc.styles = styles;
    doc.all = (n, pred, out) => { out = out || []; if (pred(n)) out.push(n); n.children.forEach(c => doc.all(c, pred, out)); return out; };
    return doc;
  }

  function load(src) {
    if (!vm) return req ? req(SRC) : root.LanternBowlRosterView;
    const win = {}, ctx = vm.createContext({ window: win });
    vm.runInContext(src === undefined ? fs.readFileSync(SRC, 'utf8') : src, ctx);
    return win.LanternBowlRosterView;
  }

  function checks(V, roster, source) {
    const out = [];
    const add = (name, ok, detail) => out.push({ name, ok: !!ok, detail: ok ? '' : (detail || '') });
    const guard = (name, fn) => { try { fn(); } catch (e) { add(name + ' (threw ' + e.message + ')', false); } };

    add('the module exports rows, render and gradeOf', V && typeof V.rows === 'function' && typeof V.render === 'function' && typeof V.gradeOf === 'function');
    if (!V || typeof V.rows !== 'function') return out;

    // Counting the players straight from the file, not from the module.
    const slots = ['qb', 'rb', 'wr', 'te', 'line', 'front', 'backers', 'secondary', 'kicker'];
    const fileCount = c => slots.reduce((n, s) => n + (Array.isArray(c[s]) ? c[s].length : 1), 0);
    add('the roster file has the six clubs', JSON.stringify(Object.keys(roster.clubs)) === JSON.stringify(CLUBS), Object.keys(roster.clubs).join());

    CLUBS.forEach(id => guard(id, () => {
      const rows = V.rows(roster, id), club = roster.clubs[id];
      add(id + ': one row per player in the file (22)', rows.length === 22 && rows.length === fileCount(club), rows.length + ' rows, ' + fileCount(club) + ' players');
      add(id + ': rows run QB, RB, WR, WR, TE, line, front, backers, secondary, kicker', JSON.stringify(rows.map(r => r.slot)) === JSON.stringify(ORDER), rows.map(r => r.slot).join());
      const want = [club.qb, club.rb, club.wr[0], club.wr[1], club.te].concat(club.line, club.front, club.backers, club.secondary, [club.kicker]);
      add(id + ': every row is the player in that place of the file (id, name, age)', rows.every((r, i) => r.id === want[i].id && r.name === want[i].name && r.age === want[i].age));
      add(id + ': groups are offence 10, defence 11, kicker 1', ['Offence', 'Defence', 'Kicker'].map(g => rows.filter(r => r.group === g).length).join() === '10,11,1');
      add(id + ': every star grade sits in its band', rows.every(r => {
        const have = KEYS.filter(k => Object.prototype.hasOwnProperty.call(want[rows.indexOf(r)], k)), mean = have.reduce((s, k) => s + want[rows.indexOf(r)][k], 0) / have.length;
        const n = Math.round(mean);
        return Math.abs(r.overall - mean) < 1e-9 && r.stars >= 1 && r.stars <= 5 && n >= BANDS[r.stars - 1][0] && n <= BANDS[r.stars - 1][1];
      }));
      add(id + ': the word matches the stars', rows.every(r => r.word === ['Rough', 'Fair', 'Solid', 'Strong', 'Elite'][r.stars - 1]));
      add(id + ': the two best ratings are the two highest the player has', rows.every((r, i) => {
        const p = want[i], have = KEYS.filter(k => Object.prototype.hasOwnProperty.call(p, k));
        const sorted = have.map((k, o) => ({ k, v: p[k], o })).sort((a, b) => b.v - a.v || a.o - b.o);
        return r.best.length === 2 && r.best[0].key === sorted[0].k && r.best[1].key === sorted[1].k && r.best[0].value === sorted[0].v && r.best[1].value === sorted[1].v && r.best[0].value >= r.best[1].value
          && have.every(k => p[k] <= r.best[1].value || k === r.best[0].key || k === r.best[1].key);
      }));
      add(id + ': each best rating carries a label, its own grade and a word', rows.every(r => r.best.every(b => b.label && b.stars === V.gradeOf(b.value) && b.word === V.WORDS[b.stars - 1])));
      add(id + ': the same input always gives the same rows', JSON.stringify(V.rows(roster, id)) === JSON.stringify(rows) && JSON.stringify(V.rows(clone(roster), id)) === JSON.stringify(rows));
    }));

    // Band edges, ties and what the module does not do to its input.
    [[35, 1], [45, 1], [46, 2], [56, 2], [57, 3], [67, 3], [68, 4], [78, 4], [79, 5], [90, 5], [45.4, 1], [45.5, 2], [78.5, 5], [34, 1], [91, 5]]
      .forEach(p => add('gradeOf(' + p[0] + ') is ' + p[1] + ' stars', V.gradeOf(p[0]) === p[1], String(V.gradeOf(p[0]))));
    add('gradeOf refuses a value that is not a number', throwsWith(() => V.gradeOf(NaN), /finite/) && throwsWith(() => V.gradeOf('60'), /finite/) && throwsWith(() => V.gradeOf(undefined), /finite/));
    const tied = { clubs: { x: clone(roster.clubs.brackenport) } };
    tied.clubs.x.qb = { id: 'x-q', name: 'Tie Case', age: 25, kick: 70, throw: 70, speed: 70, carry: 50 };
    guard('tie', () => add('a tie for best goes to the key that comes first in the shared list (throw before speed before kick)', V.rows(tied, 'x')[0].best.map(b => b.key).join() === 'throw,speed'));
    tied.clubs.x.qb = { id: 'x-q', name: 'Two Only', age: 25, speed: 40, carry: 60 };
    guard('two', () => add('a player with only two ratings shows both, highest first', V.rows(tied, 'x')[0].best.map(b => b.key + b.value).join() === 'carry60,speed40'));
    const frozen = deepFreeze(clone(roster)), before = JSON.stringify(roster);
    guard('frozen', () => { V.rows(frozen, 'millrace'); add('rows works on a frozen roster and changes nothing', JSON.stringify(frozen) === before); });

    // An unknown club ID throws a clear error.
    ['nope', '', 'Brackenport', ' millrace', 'constructor', '__proto__', 'toString', undefined, null, 5, {}, ['millrace']].forEach(bad =>
      add('club ' + JSON.stringify(bad === undefined ? 'undefined' : bad) + ' throws a clear error naming the clubs', throwsWith(() => V.rows(roster, bad), /^Unknown club .*brackenport, millrace, harrowgate, tollbridge, quarryhill, fernmoor$/)));
    ['not an object', null, [], {}, { clubs: [] }, { clubs: null }].forEach(bad =>
      add('a roster of ' + JSON.stringify(bad) + ' is refused', throwsWith(() => V.rows(bad, 'millrace'), /roster must be an object with a clubs object/)));

    // Malformed clubs are refused with a message that says where.
    const broken = {
      'a missing slot': [c => { delete c.te; }, /x\.te must be one player/],
      'a missing list': [c => { delete c.line; }, /x\.line must be a list of exactly 5/],
      'one receiver too few': [c => { c.wr.pop(); }, /x\.wr must be a list of exactly 2/],
      'one receiver too many': [c => { c.wr.push(clone(c.wr[0])); }, /x\.wr must be a list of exactly 2/],
      'a back four of five': [c => { c.secondary.push(clone(c.secondary[0])); }, /x\.secondary must be a list of exactly 4/],
      'a rating of 91': [c => { c.qb.throw = 91; }, /x\.qb \(.*\) has throw 91/],
      'a rating of 34': [c => { c.rb.speed = 34; }, /x\.rb \(.*\) has speed 34/],
      'a fractional rating': [c => { c.wr[1].catch = 60.5; }, /x\.wr\[1\] \(.*\) has catch 60\.5/],
      'a text rating': [c => { c.te.block = '60'; }, /x\.te \(.*\) has block 60/],
      'an unknown rating key': [c => { c.kicker.luck = 60; }, /x\.kicker \(.*\) has an unknown key luck/],
      'no name': [c => { c.line[2].name = ' '; }, /x\.line\[2\] needs a name/],
      'no id': [c => { delete c.front[0].id; }, /x\.front\[0\] needs an id/],
      'an age of 0': [c => { c.backers[1].age = 0; }, /x\.backers\[1\] \(.*\) needs a whole-number age/],
      'a fractional age': [c => { c.backers[1].age = 25.5; }, /needs a whole-number age/],
      'only one rating': [c => { c.qb = { id: 'a', name: 'B', age: 22, throw: 60 }; }, /needs at least two ratings/],
      'a player that is not an object': [c => { c.line[0] = 'Oren'; }, /x\.line\[0\] must be a player object/]
    };
    Object.keys(broken).forEach(name => {
      const r = { clubs: { x: clone(roster.clubs.brackenport) } };
      broken[name][0](r.clubs.x);
      add('a club with ' + name + ' is refused', throwsWith(() => V.rows(r, 'x'), broken[name][1]));
    });

    // render() on the stand-in DOM.
    guard('render', () => {
      const doc = fakeDocument(), box = doc.createElement('div'), rows = V.rows(roster, 'harrowgate');
      box.className = 'preview';
      V.render(box, rows);
      const isRow = n => /(^| )lbrv-row( |$)/.test(n.className);
      const listed = doc.all(box, isRow);
      add('render draws 22 rows', listed.length === 22, String(listed.length));
      add('render draws the rows in the rows() order, each with its tag, name and age', listed.every((li, i) => li.textContent.indexOf(rows[i].label) === 0 && li.textContent.indexOf(rows[i].name) > 0 && li.textContent.indexOf('age ' + rows[i].age) > li.textContent.indexOf(rows[i].name)));
      const heads = doc.all(box, n => n.tag === 'h2').map(n => n.textContent);
      add('render draws three groups: Offence, Defence, Kicker', heads.slice().sort().join() === 'Defence,Kicker,Offence' && heads.length === 3, heads.join());
      add('the groups hold 10, 11 and 1 rows', doc.all(box, n => n.tag === 'section').map(s => s.attrs['data-group'] + doc.all(s, isRow).length).sort().join() === 'Defence11,Kicker1,Offence10');
      add('the container keeps its own class and gains lbrv-root', /preview/.test(box.className) && /lbrv-root/.test(box.className), box.className);
      add('every row has its stars as an image with a text label, and the word beside them', listed.every((li, i) => {
        const st = doc.all(li, n => n.attrs.role === 'img')[0];
        return st && st.attrs['aria-label'] === rows[i].stars + ' of 5 stars, ' + rows[i].word && st.textContent.length === 5 && (st.textContent.match(/\u2605/g) || []).length === rows[i].stars
          && doc.all(li, n => n.className === 'lbrv-word')[0].textContent === rows[i].word;
      }));
      add('in every row the word for a rating comes before its number', listed.every((li, i) => {
        const t = li.textContent;
        return rows[i].best.every(b => { const a = t.indexOf(b.label + ' ' + b.word + ' ' + b.value); return a >= 0; });
      }));
      V.render(box, V.rows(roster, 'fernmoor'));
      add('drawing again replaces the list and does not add a second style block', doc.all(box, isRow).length === 22 && doc.styles.length === 1 && doc.all(box, n => n.textContent.indexOf('Harrow') >= 0 && isRow(n)).length === 0);
      add('render refuses a missing container and an empty list', throwsWith(() => V.render(null, rows), /DOM element/) && throwsWith(() => V.render(box, []), /rows\(\) returns/) && throwsWith(() => V.render(box, 'x'), /rows\(\) returns/));
      const css = doc.styles[0].textContent;
      add('the style block is the module\'s own CSS', css === V.CSS && /^\.lbrv-root/.test(css));
    });

    // Styles: prefix, text size and row height.
    guard('css', () => {
      const css = V.CSS;
      const classes = (css.match(/\.[A-Za-z_][\w-]*/g) || []).filter(c => !/^\.\d/.test(c));
      add('every class in the styles starts with lbrv-', classes.length > 10 && classes.every(c => c.indexOf('.lbrv-') === 0), classes.filter(c => c.indexOf('.lbrv-') !== 0).join());
      const selectors = []; css.replace(/@media[^{]*\{/g, '').replace(/([^{}]+)\{[^{}]*\}/g, (m, sel) => { sel.split(',').forEach(x => selectors.push(x.trim())); return m; });
      add('every selector starts with an lbrv- class, so none reaches a bare tag, id or the page', selectors.length > 10 && selectors.every(x => /^\.lbrv-/.test(x)), selectors.filter(x => !/^\.lbrv-/.test(x)).join(' | '));
      const sizes = (css.match(/font-size:\s*[\d.]+px/g) || []).concat(css.match(/font:\s*[\d.]+px/g) || []).map(s => parseFloat(s.replace(/[^\d.]/g, '')));
      add('every font size in the styles is 16px or more', sizes.length >= 3 && sizes.every(n => n >= 16), sizes.join());
      add('rows are at least 44px tall and so are the group headings', /\.lbrv-row\{[^}]*min-height:44px/.test(css) && /\.lbrv-head\{[^}]*min-height:44px/.test(css));
      const hex = (css.match(/#[0-9a-fA-F]{6}\b/g) || []).map(h => h.toLowerCase());
      if (fs) {
        const game = fs.readFileSync(path.join(__dirname, '..', 'games', 'lantern-bowl', 'style.css'), 'utf8') + fs.readFileSync(path.join(__dirname, '..', 'games', 'lantern-bowl', 'index.html'), 'utf8');
        const used = new Set((game.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()));
        const fresh = hex.filter(h => !used.has(h));
        add('every colour in the styles is one Lantern Bowl already uses, so the view adds none', hex.length >= 8 && fresh.length === 0, 'new: ' + Array.from(new Set(fresh)).join());
      }
      const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
      const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
      const pick = re => { const m = css.match(re); return m ? m[1].toLowerCase() : null; };
      const rowA = pick(/--lbrv-row:(#[0-9a-fA-F]{6})/), rowB = pick(/:nth-child\(even\)\{background:(#[0-9a-fA-F]{6})/), off = pick(/\.lbrv-off\{color:(#[0-9a-fA-F]{6})/), on = /\.lbrv-stars\{[^}]*color:var\(--lbrv-lamp\)/.test(css) && pick(/--lbrv-lamp:(#[0-9a-fA-F]{6})/);
      add('the unlit stars are 3:1 or better on both row colours', !!(rowA && rowB && off) && ratio(off, rowA) >= 3 && ratio(off, rowB) >= 3, [rowA, rowB, off].join(' '));
      add('lit and unlit stars differ by shape (a filled star and an outline), not only by colour', !!on && /i <= n \? '\\u2605' : '\\u2606'/.test(source || "i <= n ? '\\u2605' : '\\u2606'"));
      add('the stars are at least 20px, so they read at phone size', /\.lbrv-stars\{[^}]*font-size:(\d+)px/.test(css) && parseInt(css.match(/\.lbrv-stars\{[^}]*font-size:(\d+)px/)[1], 10) >= 20);
      add('the styles use no rem or em text sizes that could shrink below 16px', !/font-size:\s*[\d.]+(rem|em|%)/.test(css));
    });

    // Source rules.
    if (source) {
      [['imports', /\brequire\s*\(|\bimport\b/], ['network', /\b(fetch|XMLHttpRequest|WebSocket)\b/], ['storage', /localStorage|sessionStorage|indexedDB|document\.cookie/],
       ['clocks or random', /\bDate\b|\bperformance\b|Math\.random|setTimeout|setInterval|requestAnimationFrame/], ['audio', /AudioContext|createOscillator/]]
        .forEach(b => add('roster-view.js has no ' + b[0], !b[1].test(source)));
      add('rows() does not touch the document (only render does)', !/document\./.test(source.slice(source.indexOf('function rows'), source.indexOf('var CSS'))));
      add('the file does not name style.css or edit page styles outside its own block', !/style\.css/.test(source.replace(/\/\*[\s\S]*?\*\//, '')));
      if (vm) {
        const win = {}, ctx = vm.createContext({ window: win });
        let err = null; try { vm.runInContext(source, ctx); } catch (e) { err = e; }
        add('with no module, roster-view.js sets window.LanternBowlRosterView', !err && win.LanternBowlRosterView && typeof win.LanternBowlRosterView.rows === 'function');
      }
    }
    return out;
  }

  /* Broken copies of the module. Each is run through the same checks and must fail at least one. */
  function mutants(src) {
    const swap = (a, b) => { if (src.indexOf(a) < 0) throw new Error('mutant text not found: ' + a); return src.replace(a, b); };
    return {
      'a star band moved by one': swap('[46, 56]', '[46, 57]'),
      'the middle band cut short': swap('[57, 67]', '[57, 66]'),
      'three best ratings instead of two': swap('.slice(0, 2)', '.slice(0, 3)'),
      'the lowest ratings instead of the highest': swap('b.value - a.value', 'a.value - b.value'),
      'ties broken the other way': swap('|| a.order - b.order', '|| b.order - a.order'),
      'the wide receivers swapped with the tight end': swap("['te', 1, 'TE', 'Offence'], ['line', 5, 'OL', 'Offence']", "['line', 5, 'OL', 'Offence'], ['te', 1, 'TE', 'Offence']"),
      'an unknown club quietly drawn as the first club': swap("if (typeof clubId !== 'string' || !own(roster.clubs, clubId)) throw", "if (typeof clubId !== 'string' || !own(roster.clubs, clubId)) clubId = ids[0]; if (false) throw"),
      'a club check that lets a prototype name through': swap("!own(roster.clubs, clubId)", "!(clubId in roster.clubs)"),
      'ratings of 91 let through': swap('p[k] > MAX_RATING', 'p[k] > 99'),
      'a wrong word for the top grade': swap("'Strong', 'Elite'", "'Strong', 'Great'"),
      'overall using rounded-down ratings': swap('var overall = sum / have.length;', 'var overall = Math.floor(sum / have.length) - 1;'),
      'text below 16px': swap('.lbrv-name{display:block', '.lbrv-name{font-size:14px;display:block'),
      'the age dropped from the row': swap("grade.appendChild(el(doc, 'span', 'lbrv-age', 'age ' + r.age));", ''),
      'a row under 44px': swap('min-height:44px;padding:6px 10px', 'min-height:40px;padding:6px 10px'),
      'a style class without the prefix': swap('.lbrv-stars{display:block', '.stars{display:block'),
      'a smaller star size': swap('.lbrv-stars{display:block;font-size:20px', '.lbrv-stars{display:block;font-size:12px'),
      'unlit stars back to a dim colour': swap('.lbrv-off{color:#d9c89a}', '.lbrv-off{color:#4a4a50}'),
      'a row colour the game does not use': swap('--lbrv-row:#1b2430', '--lbrv-row:#182230'),
      'an even row colour the game does not use': swap('#141820}', '#141d2a}'),
      'lit and unlit stars drawn with the same glyph': swap("'\\u2605' : '\\u2606'", "'\\u2605' : '\\u2605'"),
      'a rule on a bare tag': swap("'.lbrv-word{display:block;font-weight:700}'", "'.lbrv-word{display:block;font-weight:700}li{color:red}'"),
      'a second style block on every draw': swap("if (doc.getElementById('lbrv-style')) return;", ''),
      'a list that is appended to, not replaced': swap('while (container.firstChild) container.removeChild(container.firstChild);', ''),
      'a clock in the module': swap("'use strict';", "'use strict'; var started = Date.now();"),
      'a network call in the module': swap("'use strict';", "'use strict'; var f = fetch;"),
      'the result depends on a random tie-break': swap('.sort(function (a, b) {', '.sort(function (a, b) { if (Math.random) a = a;')
    };
  }

  function run(log) {
    log = log || console.log;
    const src = fs ? fs.readFileSync(SRC, 'utf8') : null, roster = fs ? JSON.parse(fs.readFileSync(ROSTER, 'utf8')) : null;
    const V = load();
    const results = checks(V, roster, src), bad = results.filter(r => !r.ok);
    results.forEach(r => log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? ' [' + r.detail + ']' : '')));
    let caught = 0, total = 0;
    if (src && vm) {
      const m = mutants(src);
      Object.keys(m).forEach(name => {
        total++;
        let failed;
        try { failed = checks(load(m[name]), roster, m[name]).some(r => !r.ok); } catch (e) { failed = true; }
        if (failed) caught++;
        log((failed ? 'PASS ' : 'FAIL ') + 'broken copy is caught: ' + name);
        if (!failed) bad.push({ name });
      });
    }
    log('\n' + (results.length - results.filter(r => !r.ok).length) + ' checks passed, ' + results.filter(r => !r.ok).length + ' failed; ' + caught + ' of ' + total + ' broken copies caught');
    return bad.length === 0;
  }

  return { run, checks, mutants, fakeDocument };
});
