'use strict';
/* Studio text browser (E4, Lane C task C1). Read-only.
   Finds every piece of player text in the games (dialogue, quest text, item and creature names, descriptions) and says
   where it lives: the game, the file, the line, and the path inside the data (for example SPECIES.cindercub.dex).

   How it reads the games, without changing anything:
   - Browser games (games/<game>/): each game's own index.html says which scripts it loads. Those scripts (all but
     99-boot.js, so the game never starts) run inside a sealed frame with no access to saves, and the data they build
     is walked key by key. The same files are also scanned for sentences written straight into the code.
   - Godot games: the data files (starfall-godot/data/*.json) are read as JSON, and the
     main scripts (*.gd) are scanned for sentences. Add new files to SOURCES below.
   Nothing here writes to localStorage, and nothing is linked from player pages. Checks: tests/studio.html. */
(function () {
  const SOURCES = [
    { id: 'realmbound', name: 'Realmbound', dir: 'games/realmbound/' },
    { id: 'starfall-guild', name: 'Starfall Guild (browser)', dir: 'games/starfall-guild/' },
    { id: 'otherworld', name: 'Otherworld', dir: 'games/otherworld/' },
    { id: 'diamond-career', name: 'Diamond Career', dir: 'games/diamond-career/' },
    { id: 'primordial', name: 'Primordial', dir: 'games/primordial/', inline: true },
    { id: 'starfall-godot', name: 'Starfall village (Godot)', json: ['starfall-godot/data/stories.json'],
      gd: ['figures', 'main'].map(n => `starfall-godot/scripts/${n}.gd`) },
  ];
  const KINDS = ['Dialogue', 'Quest', 'Creature name', 'Item name', 'Name', 'Description', 'In code', 'Other text'];

  /* ---- Scanning source code for string literals ---- */
  const REGEX_AFTER = new Set(['return', 'typeof', 'case', 'of', 'in', 'do', 'else', 'void', 'delete', 'throw', 'new', 'yield', 'await', 'instanceof']);
  const ESC = { n: '\n', t: '\t', r: '', b: '', f: '', v: '', 0: '' };
  function readQuoted(src, i, q) { // i at the opening quote; returns [text, end index after closing quote, newlines inside]
    let out = '', j = i + 1, nl = 0;
    while (j < src.length) {
      const c = src[j];
      if (c === '\\') { const d = src[j + 1];
        if (d === 'u') { const m = /^u\{([0-9a-fA-F]+)\}|^u([0-9a-fA-F]{4})/.exec(src.slice(j + 1, j + 10)); if (m) { out += String.fromCodePoint(parseInt(m[1] || m[2], 16)); j += 1 + m[0].length; continue; } }
        if (d === 'x') { out += String.fromCharCode(parseInt(src.substr(j + 2, 2), 16) || 0); j += 4; continue; }
        if (d === '\n') { nl++; j += 2; continue; }
        out += d in ESC ? ESC[d] : d; j += 2; continue; }
      if (c === q) return [out, j + 1, nl];
      if (c === '\n') { if (q === '`') { nl++; out += c; j++; continue; } return [out, j, nl]; } // unterminated: stop at line end
      if (q === '`' && c === '$' && src[j + 1] === '{') { // ${...}: skip the code, leave a gap
        let depth = 1; j += 2;
        while (j < src.length && depth) { const e = src[j];
          if (e === '\n') nl++;
          if (e === '"' || e === "'" || e === '`') { const r = readQuoted(src, j, e); nl += r[2]; j = r[1]; continue; }
          if (e === '{') depth++; else if (e === '}') depth--; j++; }
        out += '\u2026'; continue; }
      out += c; j++;
    }
    return [out, j, nl];
  }
  /* Every string literal in a JavaScript file, with its line. Skips comments and regular expressions. */
  function jsStrings(src) {
    const out = []; let i = 0, line = 1, prev = '';
    while (i < src.length) {
      const c = src[i];
      if (c === '\n') { line++; i++; continue; }
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') { let j = src.indexOf('*/', i + 2); if (j < 0) j = src.length; for (let k = i; k < j; k++) if (src[k] === '\n') line++; i = j + 2; continue; }
      if (c === '"' || c === "'" || c === '`') { const [text, end, nl] = readQuoted(src, i, c); out.push({ text, line }); line += nl; i = end; prev = 's'; continue; }
      if (c === '/') {
        const isRegex = prev === '' || (prev.startsWith('w:') ? REGEX_AFTER.has(prev.slice(2)) : !(prev === ')' || prev === ']' || prev === '}' || prev === 's'));
        if (isRegex) { let j = i + 1, cls = false;
          while (j < src.length && src[j] !== '\n') { const d = src[j]; if (d === '\\') { j += 2; continue; } if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) break; j++; }
          j++; while (/[a-z]/i.test(src[j] || '')) j++; i = j; prev = 's'; continue; }
      }
      if (/[A-Za-z0-9_$]/.test(c)) { let j = i; while (j < src.length && /[A-Za-z0-9_$.]/.test(src[j])) j++; prev = 'w:' + src.slice(i, j).split('.').pop(); i = j; continue; }
      prev = c; i++;
    }
    return out;
  }
  /* Every string literal in a GDScript file, with its line ("...", '...', """...""", and # comments). */
  function gdStrings(src) {
    const out = []; let i = 0, line = 1;
    while (i < src.length) {
      const c = src[i];
      if (c === '\n') { line++; i++; continue; }
      if (c === '#') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if ((c === '"' || c === "'") && src.substr(i, 3) === c.repeat(3)) { let j = src.indexOf(c.repeat(3), i + 3); if (j < 0) j = src.length;
        const text = src.slice(i + 3, j); out.push({ text, line }); line += (text.match(/\n/g) || []).length; i = j + 3; continue; }
      if (c === '"' || c === "'") { const [text, end, nl] = readQuoted(src, i, c); out.push({ text, line }); line += nl; i = end; continue; }
      i++;
    }
    return out;
  }

  /* ---- Which strings are player text, and what kind ---- */
  const tidy = s => String(s).replace(/<[^>]{0,200}>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/ ([.,;:!?])/g, '$1').trim();
  const NAME_KEY = /^(name|names|title|label|nick|short|full|fullname|plural)$/i;
  const CODEISH = /[{};]\s*$|=>|\bfunction\b|\bvar\(|\bconst\b|\breturn\b|\d(px|em|rem|vh|vw|ms)\b|rgba?\(|hsla?\(|#[0-9a-f]{3,8}\b|\.(js|png|ogg|wav|json|gd|tscn|svg|css|html)\b|^[.#]?[a-z-]+\s*[:{]|res:\/\/|user:\/\/|^\s*[\[(<]|[=<>]=|&&|\|\||\$\{|\\n/i;
  function letters(s) { const t = s.replace(/\s/g, ''); return t ? (t.match(/[A-Za-z\u00C0-\u024F]/g) || []).length / t.length : 0; }
  function wordsOf(s) { return s.split(' ').filter(w => /[A-Za-z]{2}/.test(w)).length; }
  /* key: the last key of the data path (or '' for code). Returns true when the string reads as something a player sees. */
  function isPlayerText(raw, key, fromCode) {
    const s = tidy(raw); if (s.length < 2 || s.length > 4000) return false;
    if (CODEISH.test(s) || letters(s) < 0.6) return false;
    if (/^[a-z]+[A-Z_][A-Za-z0-9_]*$|^[a-z0-9_-]+$/.test(s)) return false; // ids like flameRush, wild_bond, deep-tide
    if (!fromCode && NAME_KEY.test(key || '') && /^[A-Z0-9\u00C0-\u024F'"]/.test(s)) return true;
    const w = wordsOf(s);
    if (fromCode) return w >= 3 && /^[A-Z0-9'"\u2018\u201C(\u2026.]/.test(s) || w >= 5;
    return w >= 2 && /[A-Za-z]{3}/.test(s);
  }
  function kindOf(path, key, fromCode, text) {
    if (fromCode) return 'In code';
    const p = String(path).toLowerCase(), k = String(key || '').toLowerCase(), root = String(path).split(/[.[]/)[0];
    const itemish = /item|gear|loot|junk|trinket|weapon|armou?r|offh|food|suppl|potion|shop|ware|recipe|keepsake|reward|relic|herb|ingredient|drop/i;
    if (/quest|bount|commission|errand|objective|\bjob|jobs|goal/.test(p)) return 'Quest';
    if (NAME_KEY.test(k) || /names?$/.test(root.toLowerCase())) {
      if (/species|creature|monster|beast|foe|enem|mob|roster|pet|mount|evo|hybrid|variant|catalog/i.test(root)) return 'Creature name';
      if (itemish.test(p)) return 'Item name';
      return 'Name'; }
    const t = tidy(text || '');
    if ((itemish.test(root) || /^drops?$/.test(k)) && t && !/[.!?]$/.test(t) && wordsOf(t) <= 4) return 'Item name';
    if (/^(desc|description|dex|lore|flavou?r|about|_about|blurb|hint|help|info|tip|tips|note|notes|summary|effect)$/.test(k)) return 'Description';
    if (/line|say|said|talk|chat|dialog|greet|speech|speak|story|stories|scene|cast|bark|repl|text|msg|message|intro|outro|ask|answer|beat|letter|welcome|farewell|chatter|voice|quote|spire|npc|choice|epilog|season|festival|warden|trainer|heritage|ending|win|lose|after|before|memor|node/.test(p)) return 'Dialogue';
    return 'Other text';
  }

  /* ---- Reading each kind of source ---- */
  const isId = k => /^[A-Za-z_$][\w$]*$/.test(k);
  const join = (path, k) => typeof k === 'number' ? `${path}[${k}]` : path ? (isId(k) ? `${path}.${k}` : `${path}[${JSON.stringify(k)}]`) : String(k);
  function walk(value, path, emit, seen, depth) {
    if (typeof value === 'string') { emit(path, value); return; }
    if (!value || typeof value !== 'object' || depth > 14 || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) value.forEach((v, i) => walk(v, join(path, i), emit, seen, depth + 1));
    else if (value instanceof Map) value.forEach((v, k) => walk(v, join(path, String(k)), emit, seen, depth + 1));
    else for (const k of Object.keys(value)) { let v; try { v = value[k]; } catch (e) { continue; } walk(v, join(path, k), emit, seen, depth + 1); }
  }
  const lastKey = path => { const m = /(?:\.([\w$]+)|\["([^"]*)"\])$/.exec(path) || /^([\w$]+)$/.exec(path); return m ? (m[1] || m[2] || '') : ''; };
  // the line where a string is written in some file: search for its first words as written in the source
  function locate(files, text) {
    const head = text.split('\n')[0].slice(0, 48); if (head.length < 2) return null;
    const tries = [head, head.replace(/'/g, "\\'"), JSON.stringify(head).slice(1, -1), head.replace(/"/g, '\\"')];
    for (const f of files) for (const t of tries) { const at = f.src.indexOf(t); if (at >= 0) { const line = f.src.slice(0, at).split('\n').length; return { file: f.file, line: line === 1 && f.src.indexOf('\n', at) < 0 ? null : line }; } }
    return null;
  }
  async function fetchText(url) { const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) throw Error(r.status + ' ' + url); return r.text(); }

  // The sealed frame: no same-origin access (so no saves, no cookies), storage stubs so games' top-level code runs.
  const STUB = `<script>(function(){function S(){const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:i=>[...m.keys()][i]||null,get length(){return m.size}}}
for(const n of ['localStorage','sessionStorage'])try{Object.defineProperty(window,n,{value:S(),configurable:true})}catch(e){}
window.__errors=[];window.addEventListener('error',e=>{window.__errors.push(String(e.message||'error'))});})();<\/script>`;
  function collector(names, token) {
    return `<script>(function(){const names=${JSON.stringify(names)},out={},seen=new WeakSet();let count=0;
const isId=k=>/^[A-Za-z_$][\\w$]*$/.test(k);
const join=(p,k)=>typeof k==='number'?p+'['+k+']':p?(isId(k)?p+'.'+k:p+'['+JSON.stringify(k)+']'):String(k);
function walk(v,p,list,d){if(count>300000)return;if(typeof v==='string'){if(v.length>1&&/[A-Za-z]/.test(v)){list.push([p,v]);count++}return}
if(!v||typeof v!=='object'||d>14||seen.has(v))return;if(typeof Node!=='undefined'&&v instanceof Node)return;if(v===window||v===document)return;seen.add(v);
if(Array.isArray(v))v.forEach((x,i)=>walk(x,join(p,i),list,d+1));else if(v instanceof Map)v.forEach((x,k)=>walk(x,join(p,String(k)),list,d+1));
else{let ks=[];try{ks=Object.keys(v)}catch(e){}for(const k of ks){let x;try{x=v[k]}catch(e){continue}walk(x,join(p,k),list,d+1)}}}
const missing=[];for(const n of names){let v;try{v=(0,eval)(n)}catch(e){missing.push(n);continue}if(!v||typeof v!=='object'&&typeof v!=='string')continue;const list=[];walk(v,n,list,0);if(list.length)out[n]=list}
parent.postMessage({__studioText:${JSON.stringify(token)},out,missing,errors:window.__errors.slice(0,20)},'*');})();<\/script>`;
  }
  function runSealed(html, token, timeoutMs) {
    return new Promise(resolve => {
      const frame = document.createElement('iframe');
      frame.setAttribute('sandbox', 'allow-scripts'); frame.setAttribute('aria-hidden', 'true'); frame.tabIndex = -1;
      frame.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px;height:600px;border:0;visibility:hidden';
      const done = data => { clearTimeout(timer); window.removeEventListener('message', onMsg); frame.remove(); resolve(data); };
      const onMsg = e => { if (e.source === frame.contentWindow && e.data && e.data.__studioText === token) done(e.data); };
      const timer = setTimeout(() => done({ out: {}, errors: ['The game took too long to read.'] }), timeoutMs || 20000);
      window.addEventListener('message', onMsg);
      frame.srcdoc = html; document.body.appendChild(frame);
    });
  }
  // the top-level names a script declares (const/let/var/function-free data), so the frame can hand them back
  function declaredNames(src) {
    const names = new Set();
    for (const m of src.matchAll(/^(?:const|let|var)\s+([^=;]+?=)/gm)) { const id = /^([A-Za-z_$][\w$]*)\s*=$/.exec(m[1].trim()); if (id) names.add(id[1]); }
    for (const m of src.matchAll(/^(?:const|let|var)\s[^\n]*?,\s*([A-Za-z_$][\w$]*)\s*=\s*[[{]/gm)) names.add(m[1]);
    for (const m of src.matchAll(/^\s*window\.([A-Za-z_$][\w$]*)\s*=\s*[[{]/gm)) names.add(m[1]);
    return [...names];
  }

  async function readBrowserGame(game, base) {
    const dir = new URL(game.dir, base), html = await fetchText(new URL('index.html', dir));
    const files = [], notes = [];
    if (game.inline) { // one page with its script written inside it
      files.push({ file: game.dir + 'index.html', src: html });
      return { files, data: {}, notes: ['Read from the page only (its game starts as soon as it loads, so it is not run).'] };
    }
    const srcs = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m => m[1]);
    const own = srcs.filter(s => /^js\//.test(s));
    for (const s of own) { try { files.push({ file: game.dir + s, src: await fetchText(new URL(s, dir)) }); } catch (e) { notes.push('Could not read ' + game.dir + s); } }
    const names = new Map(); for (const f of files) for (const n of declaredNames(f.src)) if (!names.has(n)) names.set(n, f.file);
    const body = (/<body[^>]*>([\s\S]*)<\/body>/i.exec(html) || ['', ''])[1].replace(/<script\b[\s\S]*?<\/script>/gi, '');
    const token = String(Math.random());
    const page = `<!doctype html><html><head><meta charset="utf-8"><base href="${dir.href}">${STUB}</head><body>${body}` +
      srcs.filter(s => !/99-boot\.js$/.test(s)).map(s => `<script src="${s.replace(/"/g, '&quot;')}"><\/script>`).join('') +
      collector([...names.keys()], token) + '</body></html>';
    const res = await runSealed(page, token, 30000);
    if (res.errors && res.errors.length) notes.push(`${res.errors.length} script message(s) while reading (normal for code that expects the game to be running).`);
    const missing = (res.missing || []).filter(n => /^[A-Z][A-Z0-9_]{2,}$/.test(n) && n !== 'VERSION');
    if (missing.length) notes.push(`Tables that only exist once the game is running (their text is still found by reading the code): ${missing.join(', ')}.`);
    return { files, data: res.out || {}, declaredIn: names, notes };
  }

  /* Build the whole index. root: the URL of the repo root (studio.html uses its own folder). */
  async function build(root, onProgress) {
    const base = new URL(root || './', location.href), map = new Map(), perGame = {}, notes = {};
    const add = (text, game, file, line, path, kind) => {
      const t = tidy(text); let e = map.get(t);
      if (!e) map.set(t, e = { text: t, kinds: new Set(), places: [], games: new Set() });
      if (e.places.some(p => p.game === game.id && p.file === file && p.path === path && p.line === line)) return;
      e.kinds.add(kind); e.games.add(game.id); e.places.push({ game: game.id, gameName: game.name, file, line, path });
    };
    for (const game of SOURCES) {
      onProgress && onProgress(game.name);
      const found = new Set(); notes[game.id] = [];
      try {
        let files = [];
        if (game.dir) {
          const r = await readBrowserGame(game, base); files = r.files; notes[game.id].push(...r.notes);
          for (const [name, list] of Object.entries(r.data)) for (const [path, raw] of list) {
            const key = lastKey(path); if (!isPlayerText(raw, key, false)) continue;
            const at = locate(files, tidy(raw)) || locate(files, raw) || { file: r.declaredIn.get(name), line: null };
            add(raw, game, at.file, at.line, path, kindOf(path, key, false, raw)); found.add(tidy(raw));
          }
        }
        for (const f of game.json || []) {
          let src; try { src = await fetchText(new URL(f, base)); } catch (e) { notes[game.id].push('Could not read ' + f); continue; }
          files.push({ file: f, src }); const one = [{ file: f, src }];
          walk(JSON.parse(src), '', (path, raw) => { const key = lastKey(path); if (!isPlayerText(raw, key, false)) return;
            const at = locate(one, raw) || { line: null }; add(raw, game, f, at.line, path, kindOf(path, key, false, raw)); found.add(tidy(raw)); }, new WeakSet(), 0);
        }
        for (const f of game.gd || []) { try { files.push({ file: f, src: await fetchText(new URL(f, base)), gd: true }); } catch (e) { notes[game.id].push('Could not read ' + f); } }
        // sentences written straight into the code (not already found in the data)
        for (const f of files) { if (/\.json$/.test(f.file)) continue;
          const lits = f.gd ? gdStrings(f.src) : jsStrings(game.inline ? (/<script>([\s\S]*?)<\/script>/i.exec(f.src) || ['', ''])[1] : f.src);
          const offset = game.inline ? f.src.slice(0, f.src.search(/<script>/i)).split('\n').length - 1 : 0;
          for (const l of lits) { const t = tidy(l.text); if (found.has(t) || !isPlayerText(l.text, '', true)) continue; found.add(t); add(l.text, game, f.file, l.line + offset, '', 'In code'); }
        }
      } catch (e) { notes[game.id].push('Could not read this game: ' + e.message); }
      perGame[game.id] = found.size;
    }
    const entries = [...map.values()].map(e => Object.assign(e, { kinds: [...e.kinds], games: [...e.games] }));
    entries.sort((a, b) => a.places[0].game.localeCompare(b.places[0].game) || a.text.localeCompare(b.text));
    return { entries, perGame, notes, total: entries.length };
  }


  /* Raw data from a browser game, for the Studio viewers (C2): the named top-level tables, copied out of the sealed
     frame as plain data (functions dropped). The game never starts and cannot touch saves. */
  async function loadGameData(root, dir, names) {
    const base = new URL(root || './', location.href), d = new URL(dir, base), html = await fetchText(new URL('index.html', d));
    const srcs = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m => m[1]).filter(s => !/99-boot\.js$/.test(s));
    const body = (/<body[^>]*>([\s\S]*)<\/body>/i.exec(html) || ['', ''])[1].replace(/<script\b[\s\S]*?<\/script>/gi, '');
    const token = String(Math.random());
    const grab = `<script>(function(){const out={};for(const n of ${JSON.stringify(names)}){try{out[n]=JSON.parse(JSON.stringify((0,eval)(n)))}catch(e){}}
parent.postMessage({__studioText:${JSON.stringify(token)},out},'*');})();<\/script>`;
    const page = `<!doctype html><html><head><meta charset="utf-8"><base href="${d.href}">${STUB}</head><body>${body}` +
      srcs.map(s => `<script src="${s.replace(/"/g, '&quot;')}"><\/script>`).join('') + grab + '</body></html>';
    return (await runSealed(page, token, 30000)).out || {};
  }

  /* Search: every word must appear in the text, the file or the path. */
  function search(entries, query, game, kind) {
    const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
    return entries.filter(e => (!game || e.games.includes(game)) && (!kind || e.kinds.includes(kind)) &&
      words.every(w => e.text.toLowerCase().includes(w) || e.places.some(p => (p.path + ' ' + p.file).toLowerCase().includes(w))));
  }

  window.StudioText = { SOURCES, KINDS, jsStrings, gdStrings, isPlayerText, kindOf, declaredNames, tidy, lastKey, build, search, loadGameData };
})();
