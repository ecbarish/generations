'use strict';
/* Studio checks (Lane C). The text browser: studio/text-browser.js and its section in studio.html. */
async function studioChecks() {
  const checks = [], T = window.StudioText;
  const check = async (label, test) => { try { if (!(await test())) throw Error('Expected condition was false.'); checks.push({ ok: true, label }); } catch (e) { checks.push({ ok: false, label: label + ' — ' + e.message }); } };
  const texts = list => list.map(x => x.text);
  const snapshot = () => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return JSON.stringify(Object.entries(o).sort()); };

  // ---- reading code: string literals and their lines
  const js = T.jsStrings("const a = 'Hello there, tamer.'; // 'not this'\n/* 'nor this' */ const b = x / 2 / y, r = /it's \\/ a 'regex'/g;\nconst c = `Hi ${name + '}'}, welcome`;\nconst d = 'It\\'s \"fine\"'; return /'quoted' in regex/.test(s);");
  await check('Code reading finds quoted text and skips comments', () => texts(js).includes('Hello there, tamer.') && !texts(js).some(t => /not this|nor this/.test(t)));
  await check('Code reading skips regular expressions but not division', () => !texts(js).some(t => /regex|quoted/.test(t)) && texts(js).includes("It's \"fine\""));
  await check('Template text keeps its words and marks the gaps', () => texts(js).includes('Hi \u2026, welcome'));
  await check('Each string knows its line', () => js.find(x => x.text === 'Hello there, tamer.').line === 1 && js.find(x => x.text.startsWith('Hi')).line === 3 && js.find(x => x.text.startsWith('It')).line === 4);
  const gd = T.gdStrings('# "a comment"\nvar a = "Is this the guild?"\nvar b = """Two\nlines"""\nvar c = \'Tea\\\'s ready.\' # "trailing"');
  await check('Godot script reading skips # comments and reads all three quote styles', () => texts(gd).join('|') === 'Is this the guild?|Two\nlines|Tea\'s ready.');
  await check('Godot script strings know their lines', () => gd[0].line === 2 && gd[1].line === 3 && gd[2].line === 5);
  await check('Top-level data names are found, including a second one on the same line', () => { const n = T.declaredNames("const SPECIES = {\n};\nconst CAP = [1], MOVES = {};\nlet x = 1;\nfunction f(){ const inner = {}; }"); return n.includes('SPECIES') && n.includes('CAP') && n.includes('MOVES') && !n.includes('inner'); });

  // ---- what counts as player text, and what kind it is
  const yes = [['A wolf pup with smoldering fur.', 'dex', false], ['Cindercub', 'name', false], ['Thorn Badge', 'name', false], ['Is this the guild? I heard there is work.', '', true]];
  const no = [['#d8642e', 'col', false], ['flameRush', 'move', false], ['wild_bond', 'id', false], ['color: #fff; padding: 4px', '', true], ['games/realmbound/js/00-core.js', '', false],
    ['..##..TT..', 'row', false], ['ember', 'el', false], ['Ok', '', true], ['(a, b) => a + b', '', true], ['res://assets/music/thornwood.ogg', '', true]];
  await check('Sentences, names and titles count as player text', () => yes.every(([s, k, c]) => T.isPlayerText(s, k, c)));
  await check('Colours, ids, file paths, map rows and code do not', () => no.every(([s, k, c]) => !T.isPlayerText(s, k, c)));
  await check('Kinds: creature names, items, quests, descriptions, dialogue and code', () =>
    T.kindOf('SPECIES.cindercub.name', 'name') === 'Creature name' && T.kindOf('SPECIES.cindercub.dex', 'dex') === 'Description' &&
    T.kindOf('QUESTS[2].text', 'text') === 'Quest' && T.kindOf('STORY[1].lines[0][1]', '') === 'Dialogue' && T.kindOf('JUNK.beast[4]', '', false, 'Chipped Tooth') === 'Item name' &&
    T.kindOf('', '', true) === 'In code' && T.KINDS.length === 8);
  await check('Text is tidied for reading (no tags, single spaces)', () => T.tidy('Hello <b>there</b> ,  friend') === 'Hello there, friend');

  // ---- the whole index, read from the real files
  const before = snapshot(), started = Date.now();
  const index = await T.build('../');
  const secs = (Date.now() - started) / 1000;
  await check(`Reads every game (${T.SOURCES.length} sources, ${index.total} pieces of text, ${secs.toFixed(1)}s)`, () => T.SOURCES.every(g => index.perGame[g.id] > 0) && index.total > 1500);
  const least = { realmbound: 1000, 'starfall-guild': 100, otherworld: 300, 'diamond-career': 80, primordial: 40, 'starfall-godot': 150 };
  await check('Each game gives at least the text it had on 2026-10-09 (a big drop means the reader broke)', () => Object.entries(least).every(([g, n]) => index.perGame[g] >= n) || (() => { throw Error(JSON.stringify(index.perGame)); })());
  const throne = index.entries.find(e => e.text.includes('The Hollow Throne is sealed'));
  await check('A Realmbound line shows the game, the file and the line', () => throne &&
    throne.places.some(p => p.game === 'realmbound' && p.file === 'games/realmbound/js/19-raid.js' && p.line > 0));
  await check('Realmbound names the Hollow Throne', () => index.entries.some(e => /Hollow Throne/.test(e.text) && e.games.includes('realmbound')));
  await check('Starfall village stories are read from stories.json with their paths', () => index.entries.some(e => e.places.some(p => p.file === 'starfall-godot/data/stories.json' && /^(Aki|Ren|Yuna|Kaito|Hana|Sora)\b/.test(p.path))));
  await check('Text written straight into Godot scripts is found with its line', () => index.entries.some(e => e.places.some(p => p.game === 'starfall-godot' && /\.gd$/.test(p.file) && p.line > 0)));
  await check('Realmbound item and quest text is found', () => index.entries.some(e => e.games.includes('realmbound') && e.kinds.includes('Item name')) && index.entries.some(e => e.games.includes('realmbound') && e.kinds.includes('Quest')));
  await check('Every place has a game and a file; data places have a path; code places have a line', () => index.entries.every(e => e.text && e.places.length && e.places.every(p => p.game && p.file && (p.path || p.line > 0))));
  await check('No game save or setting was changed while reading', () => snapshot() === before);
  await check('The sealed reading frames are gone afterwards', () => !document.querySelector('iframe[sandbox]'));
  await check('Search needs every word, in the text or the path, and filters by game and kind', () => {
    const a = T.search(index.entries, 'hollow throne'), b = T.search(index.entries, 'Seraveth', 'realmbound'), c = T.search(index.entries, '', 'starfall-godot', 'In code');
    const hay = e => (e.text + ' ' + e.places.map(p => p.path + ' ' + p.file).join(' ')).toLowerCase();
    return a.length && a.every(e => hay(e).includes('hollow') && hay(e).includes('throne')) && b.some(e => /Seraveth/.test(e.text)) && c.length && c.every(e => e.games.includes('starfall-godot') && e.kinds.includes('In code'));
  });

  // ---- creature and quest viewers (E5): the rules flag broken data, and the real data reads clean
  const V = window.StudioViewers;
  const good = { SPECIES: { a: { name: 'Alpha', fam: 'wolf', el: 'Ember', base: { hp: 1, pow: 1, grd: 1, spd: 1, wit: 1, spi: 1 }, learn: [[1, 'bite']], evo: { at: 5, to: 'b' }, dex: 'A pup.' },
    b: { name: 'Beta', fam: 'wolf', el: 'Ember', base: { hp: 2, pow: 2, grd: 2, spd: 2, wit: 2, spi: 2 }, learn: [[1, 'bite']], dex: 'A wolf.' } },
    MOVES: { bite: { name: 'Bite', el: null, pow: 40 } }, ELEMENTS: { Ember: {} }, BIOMES: { wood: { name: 'Wood', req: 'thorn', wild: [['a', 5]] } }, BADGES: { thorn: {} }, STORY: [{ gate: 'thorn' }] };
  const flagged = r => Object.values(r).flat().filter(x => x.problems.length).map(x => x.id + ': ' + x.problems.join('; '));
  await check('Viewers: good Wildbond data has no problems', () => flagged(V.wildbond(good)).length === 0);
  const broken = JSON.parse(JSON.stringify(good)); Object.assign(broken.SPECIES.a, { fam: 'dragon', el: 'Lava', learn: [[0, 'zap']], evo: { at: 5, to: 'zzz' }, dex: '' }); broken.SPECIES.b.name = 'alpha';
  broken.BIOMES.wood.wild.push(['ghost', 3]); broken.BIOMES.wood.req = 'moon'; broken.EVOS = { b: [{ to: 'a', at: 0, place: 'mars', with: 'nobody' }] };
  const why = flagged(V.wildbond(broken)).join(' | ');
  await check('Viewers: the Wildbond test rules flag families, elements, moves, evolutions, dex, names, wild tables and badges', () =>
    ['unknown body family', 'unknown element "Lava"', "move that doesn't exist: zap", 'move zap at level 0', "evolves into a creature that doesn't exist: zzz", 'no Wilddex entry', 'same name as', "a creature that doesn't exist: ghost", 'no Warden gives', 'not an area', "raised with a creature that doesn't exist"].every(w => why.includes(w)) || (() => { throw Error(why); })());
  const rbFlags = flagged(V.realmbound({ ZONES: { vale: { name: 'Vale', mobs: [{ id: 'wolf' }] } }, QUESTS: { vale: [{ id: 'q1', name: 'A', text: 'B', mob: 'wolf' }, { id: 'q2', name: 'C', text: 'D', mob: 'bear', req: 'q9' }, { id: 'q1', name: 'E', text: 'F' }] } })).join(' | ');
  await check('Viewers: the Realmbound quest rules flag a missing target, a missing earlier quest and a repeated id', () => /"bear" doesn't live in Vale/.test(rbFlags) && /"q9", which doesn't exist/.test(rbFlags) && /used twice/.test(rbFlags) && !/^q1: .*bear/.test(rbFlags));
  const real = await V.load('../');
  await check(`Viewers: the real data loads (${real.realmbound.quests.length} Realmbound quests)`, () => real.realmbound.quests.length >= 60);
  await check('Viewers: the games\' current data has no problems (the same rules as the game checks)', () => { const f = Object.values(real).map(flagged).flat(); if (f.length) throw Error(f.slice(0, 5).join(' | ')); return true; });
  await check('No game save or setting was changed by the viewers', () => snapshot() === before);

  // ---- lighting and music tuner (E7): reads the games' tables, keeps only real tweaks, in its own key
  const TN = window.StudioTuner;
  await check('Tuner: reads a table out of code, skipping strings and comments with braces in them', () => { const src = "const X = 1;\n// const ZL = { no }\nconst ZL = { a: { fog: .2, col: '#fff', n: '} {' }, /* } */ b: { grade: 1.1 } };\nconst Y = {};";
    const v = TN.value(TN.literal(src, 'ZL')); return v.a.fog === .2 && v.a.n === '} {' && v.b.grade === 1.1 && Object.keys(v).length === 2; });
  await check('Tuner: refuses a table with code in it', () => { try { TN.value("{ a: alert(1) }"); return false; } catch (e) { return /plain data/.test(e.message); } });
  const zone = { key: 'g:z', base: { fog: .3, shadow: 1, grade: .9 } };
  await check('Tuner: keeps only what differs from the game, inside the slider ranges', () => { const st = { light: {}, music: {} };
    TN.set(st, 'light', zone, { fog: .3, shadow: 9, grade: .9 }); const a = JSON.stringify(st.light);
    TN.set(st, 'light', zone, { fog: .3, shadow: 1, grade: .9 }); return a === '{"g:z":{"shadow":2}}' && !('g:z' in st.light); });
  const tn = await TN.load('../');
  const z = k => tn.zones.find(x => x.key === k);
  await check(`Tuner: reads every zone's air and every tune (${tn.zones.length} zones, ${tn.tunes.length} tunes)`, () =>
    tn.zones.filter(x => x.game === 'realmbound').length >= 8 && TN.MUSIC.every(m => tn.tunes.some(t => t.game === m.game)) && tn.tunes.every(t => t.base.bpm > 0 && t.track.mel));
  await check('Tuner: starts at what the game uses today (Fens fog .55 grade .8; Thornvale grade 1)', () =>
    z('realmbound:fens').base.fog === .55 && z('realmbound:fens').base.grade === .8 && z('realmbound:thornvale').base.grade === 1);
  await check('No game save or setting was changed by reading the tuner tables', () => snapshot() === before);

  // ---- the Studio page itself
  const frame = document.createElement('iframe'); frame.src = '../studio.html'; document.querySelector('#frame').replaceChildren(frame);
  await new Promise(ok => frame.onload = ok);
  const w = frame.contentWindow, d = frame.contentDocument;
  for (let i = 0; i < 600 && !(w.__studioTextIndex && w.__studioViewers); i++) await new Promise(ok => setTimeout(ok, 100));
  await check('The Studio shows the text browser with a count for every game', () => w.__studioTextIndex && d.querySelectorAll('#tbStats span').length === T.SOURCES.length && /pieces of text/.test(d.querySelector('#tbStatus').textContent));
  const find = d.querySelector('#tbFind'); find.value = 'Seraveth'; find.dispatchEvent(new w.Event('input'));
  await new Promise(ok => setTimeout(ok, 400));
  await check('Searching the Studio lists matches with highlighted words and where they live', () => { const items = [...d.querySelectorAll('#tbList .tb-item')];
    return items.length > 0 && items.every(x => /seraveth/i.test(x.textContent)) && d.querySelector('#tbList mark') && /19-raid\.js|01-world\.js/.test(d.querySelector('#tbList').textContent) && d.querySelector('#tbMore').hidden; });
  const kind = d.querySelector('#tbKind'); kind.value = 'Quest'; kind.dispatchEvent(new w.Event('change'));
  await check('The kind filter narrows the list', () => [...d.querySelectorAll('#tbList .tb-kind')].every(x => x.textContent === 'Quest') && d.querySelectorAll('#tbList .tb-item').length >= 1);
  await check('The Studio shows the creature and quest viewers with a row per creature', () => w.__studioViewers && d.querySelectorAll('#vwTable tr').length === w.__studioViewers.realmbound.quests.length + 1 && /no problems|with problems/.test(d.querySelector('#vwStatus').textContent));
  // the tuner on the page: a slider writes its own key and nothing else, the preview follows, reset clears it
  for (let i = 0; i < 100 && !w.__studioTuner; i++) await new Promise(ok => setTimeout(ok, 100));
  const keep = localStorage.getItem(TN.KEY), others = () => { const o = JSON.parse(snapshot()).filter(([k]) => k !== TN.KEY); return JSON.stringify(o); }, othersBefore = others();
  await check('The Studio shows the tuner with every zone and tune, and a preview frame', () => w.__studioTuner && d.querySelectorAll('#tnZone option').length === tn.zones.length && d.querySelectorAll('#tnTune option').length === tn.tunes.length && d.querySelector('#tnPreview').contentWindow.show);
  const zsel = d.querySelector('#tnZone'); zsel.value = 'realmbound:fens'; zsel.dispatchEvent(new w.Event('change'));
  const fogIn = d.querySelector('#tn-fog'); fogIn.value = '0.9'; fogIn.dispatchEvent(new w.Event('input', { bubbles: true }));
  await new Promise(ok => setTimeout(ok, 300));
  await check('Moving a slider keeps the tweak in the tuner key only, and the preview draws it', () => { const st = JSON.parse(localStorage.getItem(TN.KEY));
    const fw = d.querySelector('#tnPreview').contentWindow; return st.light['realmbound:fens'].fog === .9 && others() === othersBefore && fw.__frames > 0 && /realmbound:fens/.test(d.querySelector('#tnOut').value); });
  d.querySelector('#tnReset').click();
  await check('"Back to the game\'s values" clears the tweak', () => !(JSON.parse(localStorage.getItem(TN.KEY) || '{"light":{}}').light['realmbound:fens']) && d.querySelector('#tn-fog').value === '0.55');
  if (keep === null) localStorage.removeItem(TN.KEY); else localStorage.setItem(TN.KEY, keep);
  frame.remove();
  await check('Player pages do not link to the Studio', async () => { for (const p of ['../index.html', '../playtest.html']) { const t = await (await fetch(p)).text(); if (/href=["'][^"']*studio(\.html|\/)/.test(t)) return false; } return true; });
  return checks;
}
document.querySelector('#run').addEventListener('click', async () => {
  const button = document.querySelector('#run'); button.disabled = true; const summary = document.querySelector('#summary'); summary.textContent = 'Running…';
  try { const checks = await studioChecks(), fail = checks.filter(c => !c.ok);
    document.querySelector('#results').replaceChildren(...checks.map(c => { const li = document.createElement('li'); li.className = c.ok ? 'pass' : 'fail'; li.textContent = (c.ok ? 'PASS' : 'FAIL') + ' — ' + c.label; return li; }));
    summary.className = fail.length ? 'fail' : 'pass'; summary.textContent = fail.length ? 'FAIL — ' + fail.length + ' of ' + checks.length + ' failed.' : 'PASS — ' + checks.length + ' Studio checks.';
  } catch (e) { summary.className = 'fail'; summary.textContent = 'FAIL — ' + e.message; } finally { button.disabled = false; }
});
