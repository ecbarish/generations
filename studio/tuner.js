'use strict';
/* Studio lighting and music tuner (E7, Lane C task C4). Preview-only.
   Reads each zone's air straight from the games' own files (Realmbound ZONE_LIGHT in js/23-light.js)
   and their tunes (TRACKS in each game's sound file), and keeps Evan's tweaks in one
   localStorage key, StudioTuner.KEY. The games don't read that key yet, so playing is never affected; nothing here
   writes a save. The preview (studio/tuner-preview.html) draws a small scene with the real light engine,
   shared/light.js, and tunes play on the real sound engine, shared/sound.js. Checks: tests/studio.html. */
(function () {
  const KEY = 'studio-tuner-v1';
  const LIGHT = [ // where each game keeps its zones' air, and the light engine's defaults when a zone leaves a value out
    { game: 'realmbound', name: 'Realmbound', file: 'games/realmbound/js/23-light.js', table: 'ZONE_LIGHT', grade: 1 }];
  const MUSIC = [
    { game: 'realmbound', name: 'Realmbound', file: 'games/realmbound/js/17-sound.js' },
    { game: 'starfall-guild', name: 'Starfall Guild', file: 'games/starfall-guild/js/08-sound.js' }];
  const SLIDERS = { fog: [0, 1, .01], shadow: [0, 2, .05], grade: [0, 2, .05] }, TUNE = { bpm: [40, 220, 1], shift: [-12, 12, 1] };
  const LEADS = ['square', 'pulse', 'triangle', 'saw'];

  /* the text of `const NAME = { ... }` in a source file: matching braces, skipping strings and comments */
  function literal(src, name) {
    const re = new RegExp('(?:const|let|var)\\s+' + name + '\\s*=\\s*\\{', 'g'); let m; // the first one not in a // comment
    while ((m = re.exec(src)) && src.slice(src.lastIndexOf('\n', m.index) + 1, m.index).includes('//'));
    if (!m) throw Error(name + ' not found');
    let i = m.index + m[0].length - 1, depth = 0; const start = i;
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); if (i < 0) break; continue; }
      if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 1; continue; }
      if (c === '"' || c === "'" || c === '`') { for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++; continue; }
      if (c === '{') depth++; else if (c === '}' && --depth === 0) return src.slice(start, i + 1);
    }
    throw Error(name + ' has no end');
  }
  /* a plain data literal (numbers, strings, objects) as a value; anything with code in it is refused */
  function value(text) {
    const bare = text.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '').replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g, '""');
    if (/[()=;`]|=>/.test(bare)) throw Error('not plain data');
    return Function('"use strict"; return (' + text + ');')();
  }
  const title = id => id.replace(/(^|-)(\w)/g, (m, d, c) => (d ? ' ' : '') + c.toUpperCase());
  /* what the game draws with today: unset values filled the way the game fills them (23-light.js, 06-scene.js) */
  const defaults = (src, air) => ({ fog: air.fog === undefined ? .15 : air.fog, shadow: 1, grade: air.grade === undefined ? src.grade : air.grade });

  async function load(base) {
    const text = async f => { const r = await fetch(base + f); if (!r.ok) throw Error(f + ': ' + r.status); return r.text(); };
    const zones = [], tunes = [];
    for (const s of LIGHT) for (const [id, air] of Object.entries(value(literal(await text(s.file), s.table))))
      zones.push({ key: s.game + ':' + id, game: s.game, gameName: s.name, id, name: title(id), file: s.file, air, base: defaults(s, air) });
    for (const s of MUSIC) for (const [id, t] of Object.entries(value(literal(await text(s.file), 'TRACKS'))))
      tunes.push({ key: s.game + ':' + id, game: s.game, gameName: s.name, id, name: title(id), file: s.file, track: t, base: { bpm: t.bpm, shift: t.shift || 0, lead: t.lead || 'square' } });
    return { zones, tunes };
  }

  /* the saved tweaks: { light: { 'game:zone': { fog, shadow, grade } }, music: { 'game:tune': { bpm, shift, lead } } } */
  function read() {
    let o = null; try { o = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    return { light: (o && o.light) || {}, music: (o && o.music) || {} };
  }
  function write(o) {
    try { if (!Object.keys(o.light).length && !Object.keys(o.music).length) localStorage.removeItem(KEY); else localStorage.setItem(KEY, JSON.stringify(o)); return true; } catch (e) { return false; }
  }
  const clamp = (v, [a, b]) => Math.max(a, Math.min(b, Number(v)));
  /* keep only what differs from the game, inside the slider ranges */
  function tweak(base, now, ranges) {
    const out = {};
    for (const k of Object.keys(base)) { if (now[k] === undefined) continue;
      const v = ranges[k] ? clamp(now[k], ranges[k]) : LEADS.includes(now[k]) ? now[k] : base[k];
      if (typeof v === 'number' && !isFinite(v)) continue; if (v !== base[k]) out[k] = v; }
    return Object.keys(out).length ? out : null;
  }
  function set(store, kind, item, now) {
    const t = tweak(item.base, now, kind === 'light' ? SLIDERS : TUNE);
    if (t) store[kind][item.key] = t; else delete store[kind][item.key];
    return store;
  }
  /* what to preview: the zone's own air with the tweaks laid over it */
  const effective = (item, store, kind) => Object.assign({}, item.base, (store[kind] || {})[item.key] || {});

  window.StudioTuner = { KEY, LIGHT, MUSIC, SLIDERS, TUNE, LEADS, literal, value, load, read, write, tweak, set, effective };
})();
