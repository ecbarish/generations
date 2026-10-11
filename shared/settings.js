/* Shared settings (L1, 2026-10-07): one Settings panel in every game, opened from a gear button in the header.
   Arcade-wide choices live here and follow the player into every game (localStorage 'arcade-settings-v1'):
     - Text size (Normal / Large / Larger): sets --arc-text, which each game's style.css multiplies into its panels'
       zoom (canvases never zoom, so taps stay exact).
     - Motion (Follow my device / Reduced / Full): every game asks matchMedia('(prefers-reduced-motion: reduce)') once
       at start, so this file answers that question with the player's choice (load it before the game's scripts).
       It applies on the next load; the panel offers to reload.
   Each game adds its own rows (sound, graphics, view distance...):
     Settings.create({ mount: '.chips', btnClass: 'snd', rows: [{ label, options: [[value, text]], get: () => v, set: v => {} }] })
   The panel stops key presses from reaching the game, so arrow keys never walk your character behind it. */
(function () {
  'use strict';
  var KEY = 'arcade-settings-v1', REDUCE_Q = /prefers-reduced-motion\s*:\s*reduce/;
  var prefs = { motion: 'auto', text: 1 };
  try { var saved = JSON.parse(localStorage.getItem(KEY) || '{}'); if (saved && typeof saved === 'object') { if (['auto', 'on', 'off'].indexOf(saved.motion) >= 0) prefs.motion = saved.motion; if ([1, 1.15, 1.3].indexOf(saved.text) >= 0) prefs.text = saved.text; } } catch (e) {}
  function store() { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {} }
  var realMM = window.matchMedia ? window.matchMedia.bind(window) : null;
  function deviceReduce() { try { return !!(realMM && realMM('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }
  var bootReduce = prefs.motion === 'on' || (prefs.motion === 'auto' && deviceReduce()); // what this page load uses
  if (realMM) window.matchMedia = function (q) {
    var r = realMM(q); if (prefs.motion === 'auto' || !REDUCE_Q.test(String(q))) return r;
    return { matches: bootReduce, media: r.media, onchange: null, addListener: function () {}, removeListener: function () {},
      addEventListener: function () {}, removeEventListener: function () {}, dispatchEvent: function () { return false; } };
  };
  function apply() {
    var root = document.documentElement; root.style.setProperty('--arc-text', String(prefs.text));
    root.classList.toggle('arc-reduce', bootReduce);
  }
  apply();
  var css = '.arc-reduce *,.arc-reduce *::before,.arc-reduce *::after{animation-duration:.001s!important;animation-iteration-count:1!important;transition:none!important;scroll-behavior:auto!important}' +
    '.arc-set-bg{position:fixed;inset:0;z-index:9990;background:rgba(8,10,18,.55);display:flex;align-items:center;justify-content:center;padding:16px}.arc-set-bg[hidden]{display:none}' +
    '.arc-set{width:min(460px,100%);max-height:88vh;overflow:auto;background:#1a1f2c;color:#eef1f7;border:1px solid #3a4560;border-radius:14px;padding:16px 18px;font:calc(15px * var(--arc-text,1))/1.45 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 12px 40px rgba(0,0,0,.5)}' +
    '.arc-set h2{margin:0 0 10px;font-size:calc(19px * var(--arc-text,1))}.arc-set-row{margin:12px 0}.arc-set-row>div:first-child{font-weight:600;margin-bottom:6px}' +
    '.arc-set-opts{display:flex;flex-wrap:wrap;gap:6px}.arc-set-opts button{font:inherit;font-size:inherit;min-height:40px;padding:6px 12px;border-radius:8px;border:1px solid #47526d;background:#232a3a;color:#eef1f7;cursor:pointer}' +
    '.arc-set-opts a{display:inline-flex;align-items:center;min-height:40px;padding:6px 12px;border-radius:8px;border:1px solid #47526d;background:#232a3a;color:#eef1f7;text-decoration:none}.arc-set-opts a:focus-visible{outline:2px solid #8be0d6;outline-offset:2px}.arc-set-note a{color:#8be0d6}.arc-set-opts button[aria-pressed="true"]{background:#f2c14e;color:#1a1020;border-color:#f2c14e;font-weight:700}.arc-set-opts button:focus-visible,.arc-set-x:focus-visible{outline:2px solid #8be0d6;outline-offset:2px}' +
    '.arc-set-note{font-size:calc(13px * var(--arc-text,1));opacity:1;margin:4px 0 0}.arc-set-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:14px}' +
    '.arc-set-x{font:inherit;min-height:40px;padding:6px 14px;border-radius:8px;border:0;background:#f2c14e;color:#1a1020;font-weight:700;cursor:pointer}';
  /* Phones and touch screens (L3, 2026-10-07): every button, menu and tab at least 40px tall so a thumb hits it;
     desktop layouts are unchanged. Every game loads this file, so one rule covers the arcade. */
  css += '@media (max-width:720px),(pointer:coarse){button,select,.tgl,.arc-file,a.home,a.btn{min-height:40px}button{min-width:40px}' +
    'a.home{display:inline-flex;align-items:center;padding-inline:10px}.arc-set-opts button,.arc-set-opts a{min-height:44px}}';
  var st = document.createElement('style'); st.textContent = css; (document.head || document.documentElement).appendChild(st);

  function create(o) {
    o = o || {};
    var rows = (o.rows || []).concat([
      { label: 'Text size', options: [[1, 'Normal'], [1.15, 'Large'], [1.3, 'Larger']], get: function () { return prefs.text; },
        set: function (v) { prefs.text = v; store(); apply(); }, note: 'For every game in the arcade.' },
      { label: 'Motion', options: [['auto', 'Follow my device'], ['on', 'Reduced'], ['off', 'Full']], get: function () { return prefs.motion; },
        set: function (v) { prefs.motion = v; store(); }, note: 'Reduced turns off flashes, falling particles and sweeping movement. For every game; applies when the game reloads.', reload: true }
    ]);
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = (o.btnClass || '') + ' arc-set-btn'; btn.textContent = '⚙ Settings';
    btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false');
    var bg = document.createElement('div'); bg.className = 'arc-set-bg'; bg.hidden = true;
    var box = document.createElement('div'); box.className = 'arc-set'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Settings');
    bg.appendChild(box);
    var needReload = false;
    function render() {
      var h = '<h2>Settings</h2>';
      rows.forEach(function (r, i) {
        var cur = r.get();
        h += '<div class="arc-set-row"><div>' + r.label + '</div><div class="arc-set-opts" role="group" aria-label="' + r.label + '">' +
          r.options.map(function (op, j) { return '<button type="button" data-r="' + i + '" data-o="' + j + '" aria-pressed="' + (String(op[0]) === String(cur)) + '">' + op[1] + '</button>'; }).join('') +
          '</div>' + (r.note ? '<p class="arc-set-note">' + r.note + '</p>' : '') + '</div>';
      });
      // "Tell us" (AR2.11): only when the game registered with shared/feedback.js; links are built fresh on open
      var fb = o.tellUs !== false && window.Feedback && window.Feedback.current;
      if (fb) h += '<div class="arc-set-row arc-tell"><div>Tell us</div><div class="arc-set-opts">' + window.Feedback.forms.map(function (f) {
        return '<a href="' + esc(window.Feedback.link(f.form)) + '" target="_blank" rel="noopener" data-tell="' + f.form + '">' + f.text + '</a>'; }).join('') +
        '</div><p class="arc-set-note">Opens a GitHub issue with the game and version filled in. Nothing from your save is sent.' +
        (window.Feedback.playtest ? ' No GitHub account, or ten minutes to spare? <a href="' + esc(window.Feedback.playtest) + '" target="_blank" rel="noopener">Try the playtest</a>.' : '') + '</p></div>';
      h += '<div class="arc-set-foot">' + (needReload ? '<button type="button" class="arc-set-x" data-reload>Reload now</button>' : '<span></span>') + '<button type="button" class="arc-set-x" data-close>Done</button></div>';
      box.innerHTML = h;
    }
    var lastFocus = null, inertBefore = [];
    function open() { if (!bg.hidden) return; btn.setAttribute('aria-expanded', 'true'); lastFocus = document.activeElement; render(); bg.hidden = false; inertBefore = Array.from(document.body.children).filter(function (el) { return el !== bg; }).map(function (el) { var prior = el.inert; el.inert = true; return [el, prior]; }); var b = box.querySelector('[aria-pressed="true"]') || box.querySelector('button'); if (b) b.focus(); }
    function close() { bg.hidden = true; btn.setAttribute('aria-expanded', 'false'); inertBefore.forEach(function (entry) { entry[0].inert = entry[1]; }); inertBefore = []; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
    btn.addEventListener('click', open);
    bg.addEventListener('click', function (e) {
      if (e.target === bg || e.target.closest('[data-close]')) { close(); return; }
      if (e.target.closest('[data-reload]')) { location.reload(); return; }
      var b = e.target.closest('[data-r]'); if (!b) return;
      var r = rows[Number(b.dataset.r)], v = r.options[Number(b.dataset.o)][0];
      r.set(v); if (r.reload) needReload = (prefs.motion === 'on' || (prefs.motion === 'auto' && deviceReduce())) !== bootReduce; // offer a reload only if it changes something
      render(); var again = box.querySelector('[data-r="' + b.dataset.r + '"][data-o="' + b.dataset.o + '"]'); if (again) again.focus();
    });
    box.addEventListener('keydown', function (e) { e.stopPropagation(); trapTab(e, box); if (e.key === 'Escape') close(); }); // keys never reach the game
    bg.addEventListener('keyup', function (e) { e.stopPropagation(); });
    document.addEventListener('keydown', function (e) { if (!bg.hidden && e.key === 'Escape') close(); });
    function mount() {
      var m = typeof o.mount === 'string' ? document.querySelector(o.mount) : o.mount;
      if (m) { if (o.before) m.insertBefore(btn, m.querySelector(o.before)); else m.appendChild(btn); }
      document.body.appendChild(bg);
    }
    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
    return { open: open, close: close, button: btn, refresh: function () { if (!bg.hidden) render(); } };
  }
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function trapTab(e, box) {
    if (e.key !== 'Tab') return;
    var targets = Array.from(box.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex="0"]')).filter(function (el) { return !el.closest('[inert]') && el.getClientRects().length; });
    if (!targets.length) { e.preventDefault(); box.tabIndex = -1; box.focus(); return; }
    var first = targets[0], last = targets[targets.length - 1];
    if (targets.indexOf(document.activeElement) < 0 || (e.shiftKey && document.activeElement === first) || (!e.shiftKey && document.activeElement === last)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
  }
  window.Settings = { create: create, trapTab: trapTab, prefs: prefs, reduced: function () { return bootReduce; } };
})();
