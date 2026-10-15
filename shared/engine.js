/* Generations shared engine.
   Every game loads this before its own script and uses window.Arcade for:
   - number/time formatting (fmt, fmtI, fmtTime)
   - per-game saves in localStorage (load, save, erase) that never throw
   - portable save strings for backup or moving devices (encode, decode)
   - a progress card for the hub page (report, readIndex)
   All games on one site share an origin, so the hub can read every game's card. */
(function () {
  'use strict';
  var INDEX_KEY = 'arcade-index-v1';
  var SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

  function fmt(x) {
    if (!isFinite(x)) return '∞';
    if (x < 0) return '-' + fmt(-x);
    if (x < 1000) {
      if (x === Math.floor(x)) return String(x);
      return x < 10 ? x.toFixed(2) : x < 100 ? x.toFixed(1) : Math.floor(x).toString();
    }
    var e = Math.floor(Math.log10(x) / 3);
    if (e < SUF.length) {
      var m = x / Math.pow(10, e * 3);
      if (m >= 999.5 && e + 1 < SUF.length) { e++; m = x / Math.pow(10, e * 3); }
      return m.toFixed(m < 10 ? 2 : m < 100 ? 1 : 0) + SUF[e];
    }
    var ex = Math.floor(Math.log10(x));
    return (x / Math.pow(10, ex)).toFixed(2) + 'e' + ex;
  }
  function fmtI(x) { return x < 1000 ? String(Math.floor(x)) : fmt(x); }
  function fmtTime(s) {
    s = Math.floor(s);
    var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    if (d) return d + 'd ' + h + 'h';
    if (h) return h + 'h ' + m + 'm';
    if (m) return m + 'm ' + sec + 's';
    return sec + 's';
  }

  /* Save safety (L2, 2026-10-07). Beside every save the engine keeps automatic backups, in the format the Studio
     lists and restores (arcade-backup:<save key>:<id> = { at, why, data, ver }): a recent one at most every 10 minutes
     and one a day for the last 3 days. If a save can't be read, load() falls back to the newest backup that can, and
     the page says so. saveToolsHTML() draws a "Your save" box (download, load a file, restore a backup) any game can
     put in its menus; validators[key] (set by each game) checks that a file really is that game's save.
     versions[key] and migrates[key] are optional, set before load, beside validators. versions[key] is this game's
     current save version (a number). The save's version is the v it already stores. An older v runs
     migrates[key](save, fromVersion) when that function is set. undefined from that function means unchanged.
     A newer v, a migrate that returns null, or a migrate that throws, is refused: load returns null, the stored
     text is left untouched, and save stays off for the rest of the session. held[key] is the notice a game can show.
     While held[key] is set, erase keeps the save and its hub row and writes nothing over them. replaceSave rejects
     a newer file up front, before it writes, with that same notice. A game that sets no version behaves as before.
     This never writes a new save field. */
  var BK = 'arcade-backup:', RECENT_MS = 10 * 60 * 1000, DAYS = 3, lastBk = {}, frozen = {}, recovered = {}, validators = {}, versions = {}, migrates = {}, held = {}, heldShown = {};
  var HELD_NOTE = 'This save is from a newer version, so progress will not be saved.';
  function ver() { try { return typeof VERSION !== 'undefined' ? String(VERSION) : ''; } catch (e) { return ''; } }
  function putBackup(key, id, raw, why) { localStorage.setItem(BK + key + ':' + id, JSON.stringify({ at: Date.now(), why: why, data: raw, ver: ver() })); }
  function autoBackup(key, raw) {
    var now = Date.now(); if (lastBk[key] && now - lastBk[key] < RECENT_MS) return; lastBk[key] = now;
    try {
      putBackup(key, 'auto-recent', raw, 'automatic (every 10 minutes)');
      var day = new Date(now).toISOString().slice(0, 10);
      if (!localStorage.getItem(BK + key + ':auto-day-' + day)) putBackup(key, 'auto-day-' + day, raw, 'automatic (once a day)');
      var days = Object.keys(localStorage).filter(function (k) { return k.indexOf(BK + key + ':auto-day-') === 0; }).sort().reverse();
      days.slice(DAYS).forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) { /* storage full: the save itself still went through */ }
  }
  function backups(key) {
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(BK + key + ':') === 0) {
      try { var b = JSON.parse(localStorage.getItem(k)); if (b && typeof b.data === 'string') { b.k = k; out.push(b); } } catch (e) {} } } } catch (e) {}
    return out.sort(function (a, b) { return b.at - a.at; });
  }
  function gameVersion(key) {
    var v = versions[key];
    return typeof v === 'number' && isFinite(v) ? v : null;
  }
  function fileVersion(obj) {
    if (!obj || typeof obj !== 'object' || typeof obj.v !== 'number' || !isFinite(obj.v)) return null;
    return obj.v;
  }
  function newerThanGame(key, obj) {
    var current = gameVersion(key), from = fileVersion(obj);
    return current != null && from != null && from > current;
  }
  function noticeHeld(key) {
    if (heldShown[key] || typeof document === 'undefined') return;
    heldShown[key] = true;
    var show = function () {
      if (!document.body) return;
      var d = document.createElement('div');
      d.setAttribute('role', 'status');
      d.setAttribute('data-arc-held', key);
      d.className = 'arc-held';
      d.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;max-width:min(92vw,560px);background:#1d2433;color:#fff;border:1px solid #f2c14e;border-radius:10px;padding:10px 14px;font:14px/1.4 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.4)';
      d.textContent = held[key];
      document.body.appendChild(d);
    };
    try { if (document.body) show(); else document.addEventListener('DOMContentLoaded', show); } catch (e) {}
  }
  function holdNewer(key) { held[key] = HELD_NOTE; noticeHeld(key); }
  /* No registered version, or a save with no numeric v, is returned as parsed.
     undefined from migrate means unchanged. null holds the session the same way a throw does. */
  function applyVersion(key, obj) {
    var current = gameVersion(key);
    if (current == null) return obj;
    var from = fileVersion(obj);
    if (from == null || from === current) return obj;
    if (from > current) { holdNewer(key); return null; }
    if (typeof migrates[key] !== 'function') return obj;
    try {
      var next = migrates[key](obj, from);
      if (next === undefined) return obj;
      if (next === null) { holdNewer(key); return null; }
      return next;
    }
    catch (e) { holdNewer(key); return null; }
  }
  function load(key) {
    var r; try { r = localStorage.getItem(key); } catch (e) { return null; }
    if (!r) return null;
    try { return applyVersion(key, JSON.parse(r)); } catch (e) { /* damaged: try the backups, newest first */ }
    var bs = backups(key);
    for (var i = 0; i < bs.length; i++) {
      try {
        var o = JSON.parse(bs[i].data);
        if (newerThanGame(key, o)) continue;
        var out = applyVersion(key, o);
        if (held[key]) return null;
        recovered[key] = bs[i]; noticeRecovered(bs[i]); return out;
      } catch (e) {}
    }
    return null;
  }
  function save(key, obj) {
    if (frozen[key] || held[key]) return false; // frozen: a restore or import is about to reload; held: a newer save must stay as stored
    try { var raw = JSON.stringify(obj); localStorage.setItem(key, raw); autoBackup(key, raw); return true; } catch (e) { return false; }
  }
  function encode(obj) { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); }
  function decode(text) { return JSON.parse(decodeURIComponent(escape(atob(String(text).trim())))); }
  /* a save in any form people have: an exported code (base64), or the plain JSON of a downloaded save file */
  function decodeAny(text) { text = String(text || '').trim(); try { return decode(text); } catch (e) { return JSON.parse(text); } }
  /* replace a save with another (an import or a restore), backing up the current one first, then reload the page */
  function replaceSave(key, raw, why) {
    var o = JSON.parse(raw);
    if (!o || typeof o !== 'object') throw new Error('not a save for this game');
    if (newerThanGame(key, o)) throw new Error(HELD_NOTE);
    if (validators[key] && !validators[key](o)) throw new Error('not a save for this game');
    var cur = localStorage.getItem(key); if (cur) putBackup(key, Date.now(), cur, why);
    localStorage.setItem(key, raw); frozen[key] = true; location.reload();
  }
  function download(name, text) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function saveToolsHTML(key, btn) {
    btn = btn || 'btn'; var bs = backups(key);
    var heldNote = held[key] ? '<p class="arc-note arc-held-note" role="status">' + esc(held[key]) + '</p>' : '';
    return '<div class="arc-save" data-key="' + esc(key) + '">' + heldNote + '<div class="arc-save-row"><button class="' + btn + '" data-arcsave="download">Download my save</button>' +
      '<label class="' + btn + ' alt arc-file">Load a save file<input type="file" accept=".json,.txt,application/json,text/plain" data-arcsave="file"></label></div>' +
      '<details class="arc-bk"><summary>Automatic backups (' + bs.length + ')</summary>' + (bs.length ? bs.map(function (b) {
        return '<div class="arc-bk-row"><span>' + esc(new Date(b.at).toLocaleString()) + ' · ' + esc(b.why || 'backup') + (b.ver ? ' · v' + esc(b.ver) : '') + '</span>' +
          '<button class="' + btn + ' alt" data-arcsave="restore" data-k="' + esc(b.k) + '">Restore</button></div>'; }).join('') :
        '<p class="arc-note">The first one is made the next time the game saves.</p>') +
      '<p class="arc-note">Restoring or loading a file backs up your current save first, then reloads the game.</p></details>' +
      '<p class="arc-save-msg" aria-live="polite"></p></div>';
  }
  function say(box, t) { var m = box && box.querySelector('.arc-save-msg'); if (m) m.textContent = t; }
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('[data-arcsave]'); if (!el || el.tagName === 'INPUT') return;
      var box = el.closest('.arc-save'), key = box && box.dataset.key; if (!key) return;
      if (el.dataset.arcsave === 'download') { var raw = localStorage.getItem(key); if (!raw) { say(box, 'There is no save yet.'); return; }
        download(key + '-' + new Date().toISOString().slice(0, 10) + '.json', raw); say(box, 'Downloaded. Keep the file somewhere safe; Load a save file brings it back.'); }
      if (el.dataset.arcsave === 'restore') {
        if (!confirm('Restore this backup? Your current save is backed up first, then the game reloads.')) return;
        try { replaceSave(key, JSON.parse(localStorage.getItem(el.dataset.k)).data, 'before a restore'); } catch (err) { say(box, err && err.message === HELD_NOTE ? HELD_NOTE : 'That backup could not be restored.'); }
      }
    });
    document.addEventListener('change', function (e) {
      var el = e.target; if (!el.matches || !el.matches('[data-arcsave="file"]') || !el.files || !el.files[0]) return;
      var box = el.closest('.arc-save'), key = box && box.dataset.key, rd = new FileReader();
      rd.onload = function () {
        try { var o = decodeAny(rd.result);
          // check it is this game's save before asking, so a wrong file never gets a "Replace your save?" question first
          if (!o || typeof o !== 'object' || (validators[key] && !validators[key](o))) throw new Error('not a save for this game');
          if (newerThanGame(key, o)) throw new Error(HELD_NOTE);
          if (!confirm('Replace your save with this file? Your current save is backed up first, then the game reloads.')) { el.value = ''; return; }
          replaceSave(key, JSON.stringify(o), 'before loading a file');
        } catch (err) { el.value = ''; say(box, err && err.message === HELD_NOTE ? HELD_NOTE : "That file isn't a save for this game."); }
      };
      rd.readAsText(el.files[0]);
    });
    var css = document.createElement('style');
    css.textContent = '.arc-save{margin:8px 0}.arc-save-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.arc-file{position:relative;overflow:hidden;cursor:pointer}' +
      '.arc-file input{position:absolute;inset:0;opacity:0;cursor:pointer}.arc-bk{margin-top:8px}.arc-bk summary{cursor:pointer;padding:4px 0}' +
      '.arc-bk-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;padding:3px 0;font-size:.9em}.arc-note,.arc-save-msg{font-size:.88em;opacity:.8;margin:6px 0}';
    (document.head || document.documentElement).appendChild(css);
  }
  function noticeRecovered(b) {
    if (typeof document === 'undefined') return;
    var show = function () { var d = document.createElement('div'); d.setAttribute('role', 'status');
      d.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;max-width:min(92vw,560px);background:#1d2433;color:#fff;border:1px solid #f2c14e;border-radius:10px;padding:10px 14px;font:14px/1.4 system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.4)';
      d.textContent = 'Your save could not be read, so the game loaded your automatic backup from ' + new Date(b.at).toLocaleString() + '.';
      document.body.appendChild(d); setTimeout(function () { d.remove(); }, 12000); };
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
  }

  function readIndex() { return load(INDEX_KEY) || {}; }
  /* info: { summary: 'one line shown big on the hub card', detail: 'one quieter line' } */
  function report(gameId, info) {
    var idx = readIndex();
    idx[gameId] = { summary: info.summary || '', detail: info.detail || '', last: Date.now() };
    save(INDEX_KEY, idx);
  }
  function erase(key, gameId) {
    if (held[key]) return;
    try { localStorage.removeItem(key); } catch (e) {}
    var idx = readIndex(); delete idx[gameId]; save(INDEX_KEY, idx);
  }

  window.Arcade = {
    fmt: fmt, fmtI: fmtI, fmtTime: fmtTime,
    load: load, save: save, encode: encode, decode: decode, decodeAny: decodeAny, erase: erase,
    backups: backups, saveToolsHTML: saveToolsHTML, replaceSave: replaceSave, validators: validators, versions: versions, migrates: migrates, held: held, recovered: recovered,
    report: report, readIndex: readIndex,
    home: '../../index.html'
  };
})();
