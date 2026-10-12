/* Shared dialogue scenes for Generations games (S1, 2026-10-08).
   A speaker portrait, a name plate and typewriter text over a game's scene, with optional choices at the end.
   One look across the arcade (pixel portraits, the same layout and controls), themed per game by CSS variables.

   Lines are [who, text]. who: a cast key ('maren'), a cast key with a mood ('maren:happy'; moods: happy, sad,
   surprised, angry), '' for narration, or '@<creature id>' when the game draws its own creatures.

   const D = Dialogue.create({
     host,                    element the scene box sits in (position: relative)
     theme,                   'wildbond' | 'realmbound' | … (adds class dlg-<theme>; colours in the CSS below)
     get, set,                read/write the game's own scene state (null when no scene), so games keep their variable
     cast(who),               -> { name, title, skin, hair, hairCol, hatCol, shirt, bg, beard, ears, tusks } or null
     creature(ctx, id),       optional: draw a creature portrait for '@id' lines (64x64 canvas)
     ctx(c),                  optional: wrap a 2D context (Wildbond's Pocket era colours)
     fill(text),              optional: fill placeholders like {name}
     blip(who),               optional: a typing sound
     auto(),                  optional: true when lines (and choices) should advance on their own
     onStart(), onEnd(),      optional hooks (refresh panels, save)
     keys                     optional: false to leave Space/Enter/Esc/1-9 alone
   });
   D.play(lines, done, { choices: ['Accept', 'Not now'] })   done(choiceIndex) runs when the scene ends
   D.advance(), D.skip(), D.choose(i), D.el

   Dialogue.lookFor(name, { palette, races }) gives any name a stable look of its own, so characters without
   hand-made entries (Realmbound's many quest givers) still get a portrait that's always the same. */
(function () {
  'use strict';
  var CSS = [
    '.dlg{position:absolute;left:10px;right:10px;bottom:10px;display:flex;gap:12px;align-items:flex-start;z-index:5;',
    'background:var(--dlg-bg);border:3px solid var(--dlg-line);border-radius:var(--dlg-radius);padding:10px 14px 10px 10px;',
    'box-shadow:0 4px 0 var(--dlg-shadow);cursor:pointer;min-height:84px;color:var(--dlg-ink)}',
    '.dlg[hidden]{display:none}',
    '.dlg .dlg-reader{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}',
    '.dlg .dlg-continue{font:inherit;font-size:calc(14px * var(--arc-text,1));margin-top:6px;padding:5px 14px;min-height:40px;border:2px solid var(--dlg-line);border-radius:8px;background:var(--dlg-btn);color:var(--dlg-btn-ink)}',
    '.dlg .dlg-continue[hidden]{display:none}',
    '.dlg .dlg-face{position:static;inset:auto;width:64px;height:64px;flex:none;border-radius:calc(var(--dlg-radius) - 4px);',
    'border:2px solid var(--dlg-line);image-rendering:pixelated;background:#eee}',
    '.dlg.right{flex-direction:row-reverse;padding:10px 10px 10px 14px}.dlg.right .dlg-body{text-align:right}',
    '.dlg .dlg-body{min-width:0;flex:1}',
    '.dlg .dlg-who{font-family:var(--dlg-name-font);font-size:17px;color:var(--dlg-name)}',
    '.dlg .dlg-role{color:var(--dlg-muted);font-size:12px;margin:0 8px}',
    '.dlg .dlg-say{margin:2px 0 0;font-size:15px;line-height:1.4;min-height:2.8em}',
    '.dlg.narr .dlg-say{font-style:italic;color:var(--dlg-muted)}.dlg.narr .dlg-face{display:none}',
    '.dlg .dlg-more{position:absolute;right:12px;bottom:6px;font-size:12px;color:var(--dlg-name);opacity:0}',
    '.dlg.ready:not(.asking) .dlg-more{opacity:1;animation:dlgbob .8s ease-in-out infinite}',
    '.dlg .dlg-choices{display:none;gap:8px;flex-wrap:wrap;margin-top:6px}.dlg.asking .dlg-choices{display:flex}',
    '.dlg .dlg-choices button{font:inherit;font-weight:700;font-size:14px;padding:5px 12px;border-radius:999px;cursor:pointer;',
    'border:2px solid var(--dlg-line);background:var(--dlg-btn);color:var(--dlg-btn-ink)}',
    '.dlg .dlg-choices button:first-child{background:var(--dlg-name);color:var(--dlg-bg-solid)}',
    '.dlg .dlg-choices kbd{opacity:.6;font-size:11px;margin-left:4px}',
    '@keyframes dlgbob{50%{transform:translateY(3px)}}',
    '@media (prefers-reduced-motion: reduce){.dlg.ready .dlg-more{animation:none}}',
    '@media (max-width:560px){.dlg{left:6px;right:6px;bottom:6px;padding:8px;gap:8px;min-height:0}',
    '.dlg .dlg-face{width:44px;height:44px}.dlg .dlg-say{font-size:13px}.dlg .dlg-role{display:none}}',
    /* themes: one layout, each game's own colours */
    '.dlg{--dlg-bg:rgba(255,253,246,.96);--dlg-bg-solid:#fffdf6;--dlg-line:#17323a;--dlg-shadow:rgba(23,50,58,.35);--dlg-ink:#17323a;',
    '--dlg-muted:#5a6f78;--dlg-name:#2c7a4b;--dlg-name-font:inherit;--dlg-radius:12px;--dlg-btn:#fff;--dlg-btn-ink:#17323a}',
    '.dlg.dlg-wildbond{--dlg-name:var(--leaf-d,#2c7a4b);--dlg-muted:var(--muted,#5a6f78);--dlg-name-font:var(--f-disp,inherit)}',
    '.dlg.dlg-realmbound{--dlg-bg:rgba(24,19,14,.95);--dlg-bg-solid:#18130e;--dlg-line:var(--bronze,#8a6a35);--dlg-shadow:rgba(0,0,0,.5);',
    '--dlg-ink:var(--fg,#e9e1cf);--dlg-muted:var(--muted,#a89a80);--dlg-name:var(--gold,#f2c14e);--dlg-name-font:var(--f-head,serif);',
    '--dlg-radius:6px;--dlg-btn:var(--stone2,#241e17);--dlg-btn-ink:var(--fg,#e9e1cf)}'
  ].join('');
  var styled = false;
  function addStyle() { if (styled) return; styled = true; var s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); }

  function shade(hex, n) {
    var v = parseInt(hex.slice(1, 7), 16), f = function (x) { return Math.round(n < 0 ? x * (1 + n) : x + (255 - x) * n); };
    return '#' + [16, 8, 0].map(function (s) { return f((v >> s) & 255).toString(16).padStart(2, '0'); }).join('');
  }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  /* ---- portraits: a 32x32 bust drawn at 2x. Shared by every game, so characters look like one family. ---- */
  function drawPortrait(c, P, opts) {
    opts = opts || {};
    var mood = opts.mood || '', open = !!opts.open, blink = !!opts.blink;
    var q = function (x, y, w, h, col) { c.fillStyle = col; c.fillRect(x * 2, y * 2, w * 2, h * 2); };
    var hc = P.hairCol || '#4a3a2a', dk = shade(hc, -0.35), sk = P.skin || '#e8b890', skd = shade(sk, -0.18), bg = P.bg || '#dde6ee';
    q(0, 0, 32, 32, bg); q(4, 4, 24, 24, shade(bg, 0.25));
    if (P.hair === 'long' || P.hair === 'braid') { q(7, 9, 4, 18, hc); q(21, 9, 4, P.hair === 'braid' ? 10 : 18, hc); }
    if (P.hair === 'hood') { q(6, 5, 20, 22, P.hatCol || '#4a4a5a'); }
    var shirt = P.shirt || '#5a6a8a';
    q(5, 25, 22, 7, shirt); q(8, 24, 16, 2, shirt); q(13, 24, 6, 3, shade(shirt, -0.25)); q(14, 21, 4, 4, skd);
    if (P.ears === 'pointed') { q(7, 11, 3, 2, sk); q(6, 10, 2, 1, sk); q(22, 11, 3, 2, sk); q(24, 10, 2, 1, sk); }
    else { q(9, 13, 1, 4, skd); q(22, 13, 1, 4, skd); }
    q(10, 9, 12, 13, sk); q(11, 21, 10, 1, sk);
    /* eyes and brows show the mood; a blink now and then */
    var browY = mood === 'surprised' ? 12 : 13;
    if (blink) { q(12, 16, 2, 1, '#1d1d28'); q(18, 16, 2, 1, '#1d1d28'); }
    else { q(12, 15, 2, 2, '#1d1d28'); q(18, 15, 2, 2, '#1d1d28'); q(12, 15, 1, 1, '#ffffff'); q(18, 15, 1, 1, '#ffffff'); }
    if (mood === 'angry') { q(11, 13, 1, 1, dk); q(12, 14, 2, 1, dk); q(20, 13, 1, 1, dk); q(18, 14, 2, 1, dk); }
    else if (mood === 'sad') { q(11, 14, 1, 1, dk); q(12, 13, 2, 1, dk); q(20, 14, 1, 1, dk); q(18, 13, 2, 1, dk); }
    else { q(11, browY, 3, 1, dk); q(18, browY, 3, 1, dk); }
    q(14, 18, 1, 1, skd);
    if (open || mood === 'surprised') { q(14, 19, 4, 2, '#7a3b3b'); q(15, 20, 2, 1, '#d77'); }
    else if (mood === 'happy') { q(13, 19, 1, 1, '#9a5148'); q(14, 20, 4, 1, '#9a5148'); q(18, 19, 1, 1, '#9a5148'); }
    else if (mood === 'sad') { q(14, 20, 4, 1, '#9a5148'); q(13, 21, 1, 1, '#9a5148'); q(18, 21, 1, 1, '#9a5148'); }
    else q(14, 19, 4, 1, '#9a5148');
    if (P.tusks) { q(12, 20, 1, 2, '#f1ecd8'); q(19, 20, 1, 2, '#f1ecd8'); }
    if (P.beard) { var bc = P.beard === true ? hc : P.beard; q(10, 18, 12, 4, bc); q(11, 22, 10, 2, bc); q(13, 24, 6, 1, bc); q(14, 19, 4, 1, shade(bc, -0.3)); }
    if (mood !== 'angry' && mood !== 'sad') { q(11, 17, 2, 1, 'rgba(255,120,120,.35)'); q(19, 17, 2, 1, 'rgba(255,120,120,.35)'); }
    /* hair on top */
    if (P.hair !== 'bald' && P.hair !== 'hood') { q(9, 6, 14, 5, hc); q(9, 10, 2, 5, hc); q(21, 10, 2, 5, hc); q(11, 10, 5, 2, hc); q(10, 6, 12, 1, shade(hc, 0.2)); }
    if (P.hair === 'bald') { q(10, 8, 12, 2, sk); q(12, 8, 3, 1, shade(sk, 0.2)); }
    if (P.hair === 'spiky') for (var x = 9; x <= 21; x += 3) { q(x, 4, 2, 2, hc); q(x + 1, 3, 1, 1, hc); }
    if (P.hair === 'bun') { q(13, 2, 6, 4, hc); q(14, 1, 4, 1, hc); q(14, 2, 2, 1, shade(hc, 0.25)); }
    if (P.hair === 'long') { q(8, 8, 2, 8, hc); q(22, 8, 2, 8, hc); }
    if (P.hair === 'braid') { q(22, 18, 3, 3, hc); q(23, 21, 2, 3, dk); q(22, 24, 3, 2, hc); }
    if (P.hair === 'hat') { var hcol = P.hatCol || '#5a4a3a'; q(10, 2, 12, 6, hcol); q(10, 6, 12, 1, shade(hcol, 0.3)); q(5, 8, 22, 2, shade(hcol, -0.2)); }
    if (P.hair === 'hood') { var hd = P.hatCol || '#4a4a5a'; q(8, 4, 16, 6, hd); q(7, 8, 3, 14, hd); q(22, 8, 3, 14, hd); q(9, 5, 14, 1, shade(hd, 0.2)); }
  }

  /* ---- a stable look from a name: same name, same face, every time ---- */
  var SKINS = ['#f2c8a2', '#e8b890', '#d29a74', '#c48e68', '#a87452', '#8a5a3e', '#f0d0b0'];
  var HAIRCOLS = ['#2a2a2a', '#4a3a2a', '#6b4423', '#8a5a2b', '#c96a2a', '#d8c08a', '#d8d4cc', '#b8483a', '#2a2a3a'];
  var STYLES = ['short', 'short', 'long', 'bun', 'spiky', 'braid', 'hat', 'hood', 'bald'];
  var PALETTES = { cool: ['#3a5a7a', '#4a6a8a', '#2f5e78', '#5a6a8a', '#4a5a3a', '#6a4a8a'], warm: ['#9a5a3a', '#8a3a2a', '#a0703a', '#7a5028', '#9a4a5a', '#6a5a2a'],
    green: ['#5b8a4a', '#3d6b52', '#7a8c5a', '#4a6e4e', '#6a7a5a', '#2c7a4b'] };
  var RACE_LOOK = { stonekin: { beard: true, skins: ['#d8a080', '#c89070', '#b88060'] }, grishar: { tusks: true, skins: ['#8a9a6a', '#7a8a5a', '#9aa07a', '#6f8060'] },
    duskelf: { ears: 'pointed', skins: ['#b8a0c8', '#a890b8', '#c8b0d0', '#9a88b0'] }, human: {} };
  function lookFor(name, o) {
    o = o || {}; var h = hash(String(name)), pick = function (a, n) { return a[(h >>> n) % a.length]; };
    var race = o.races ? pick(o.races, 3) : 'human', R = RACE_LOOK[race] || {}, pal = PALETTES[o.palette] || PALETTES.cool;
    var look = { name: name, title: o.title || '', skin: R.skins ? pick(R.skins, 5) : pick(SKINS, 5), hair: pick(STYLES, 9), hairCol: pick(HAIRCOLS, 13),
      hatCol: pick(pal, 17), shirt: pick(pal, 21), bg: shade(pick(pal, 25), 0.75) };
    if (R.beard || (race === 'human' && (h >>> 28) % 4 === 0)) look.beard = true;
    if (R.tusks) look.tusks = true; if (R.ears) look.ears = R.ears;
    return look;
  }

  /* ---- the scene box ---- */
  function create(o) {
    addStyle();
    var el = document.createElement('div');
    el.className = 'dlg dlg-' + (o.theme || 'wildbond'); el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Conversation'); el.tabIndex = -1;
    el.innerHTML = '<canvas class="dlg-face" width="64" height="64" aria-hidden="true"></canvas><div class="dlg-body"><b class="dlg-who"></b>' +
      '<span class="dlg-role"></span><p class="dlg-say" aria-hidden="true"></p><p class="dlg-reader" role="status" aria-live="polite" aria-atomic="true"></p><div class="dlg-choices"></div><button type="button" class="dlg-continue">Continue</button></div><span class="dlg-more" aria-hidden="true">▼</span>';
    o.host.appendChild(el);
    var face = el.querySelector('.dlg-face'), say = el.querySelector('.dlg-say'), choiceBox = el.querySelector('.dlg-choices');
    var get = o.get, set = o.set, reduce = false;
    try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var api = {}, previousFocus = null;
    var nextButton = el.querySelector('.dlg-continue');
    nextButton.addEventListener('click', function (e) { e.stopPropagation(); api.advance(); });
    el.addEventListener('keydown', function (e) { if (window.Settings) Settings.trapTab(e, el); });
    function split(who) { var i = who.indexOf(':'); return i > 0 && who[0] !== '@' ? [who.slice(0, i), who.slice(i + 1)] : [who, '']; }
    function paint(who, open) {
      var p = split(who), key = p[0], mood = p[1], c = face.getContext('2d'); if (o.ctx) c = o.ctx(c);
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 64, 64); c.imageSmoothingEnabled = false;
      face.hidden = !key; if (!key) return;
      if (key[0] === '@') { if (o.creature) o.creature(c, key.slice(1)); return; }
      var look = o.cast(key); if (look) drawPortrait(c, look, { mood: mood, open: open, blink: !reduce && !!(get() && get().blink > 0) });
    }
    function showLine() {
      var T = get(), who = T.lines[T.i][0], key = split(who)[0], look = key && key[0] !== '@' ? o.cast(key) : null;
      el.classList.toggle('narr', !key); el.classList.toggle('right', T.i % 2 === 1 && T.alternate);
      el.querySelector('.dlg-who').textContent = look ? look.name : key && key[0] === '@' && o.creatureName ? o.creatureName(key.slice(1)) : '';
      el.querySelector('.dlg-role').textContent = look ? look.title || '' : '';
      el.querySelector('.dlg-reader').textContent = (look ? look.name + ': ' : '') + T.lines[T.i][1];
      nextButton.hidden = false; choiceBox.innerHTML = '';
      T.shown = reduce ? 1e9 : 0; T.wait = 0; el.classList.remove('asking'); paint(who, false);
    }
    function last() { var T = get(); return T && T.i >= T.lines.length - 1; }
    function finish(choice) {
      var T = get(); if (!T) return; var done = T.done; set(null); el.hidden = true; el.classList.remove('asking');
      if (previousFocus && previousFocus.isConnected) previousFocus.focus();
      if (o.onEnd) o.onEnd(); if (done) done(choice === undefined ? 0 : choice);
    }
    function ask() {
      var T = get(); el.classList.add('asking'); nextButton.hidden = true; if (document.activeElement === nextButton) el.focus(); choiceBox.innerHTML = '';
      T.choices.forEach(function (label, i) {
        var b = document.createElement('button'); b.type = 'button'; b.innerHTML = label + '<kbd aria-hidden="true">' + (i + 1) + '</kbd>';
        b.addEventListener('click', function (e) { e.stopPropagation(); api.choose(i); }); choiceBox.appendChild(b);
      });
    }
    api.el = el;
    api.play = function (lines, done, opts) {
      opts = opts || {};
      if (!lines || !lines.length) { if (done) done(0); return; }
      if (!get()) previousFocus = document.activeElement;
      set({ lines: lines.map(function (l) { return [l[0], o.fill ? o.fill(l[1]) : l[1]]; }), i: 0, shown: 0, wait: 0, done: done,
        choices: opts.choices || null, alternate: !!opts.alternate, blink: 0, blinkT: 2 + Math.random() * 2 });
      el.hidden = false; showLine(); el.focus(); if (o.onStart) o.onStart();
    };
    api.advance = function () {
      var T = get(); if (!T) return; var len = T.lines[T.i][1].length;
      if (T.shown < len) { T.shown = len; return; }
      if (last()) { if (T.choices) { if (!el.classList.contains('asking')) ask(); return; } finish(); return; }
      T.i++; showLine();
    };
    api.skip = function () { var T = get(); if (!T) return; T.i = T.lines.length - 1; showLine(); T.shown = 1e9; if (T.choices) ask(); else finish(); };
    api.choose = function (i) { var T = get(); if (!T || !T.choices || i < 0 || i >= T.choices.length) return; finish(i); };
    /* typewriter (about 45 characters a second), mouth movement, blinking, auto-advance */
    setInterval(function () {
      var T = get(); if (!T) return; var line = T.lines[T.i], who = line[0], t = line[1], key = split(who)[0], person = key && key[0] !== '@';
      T.blinkT -= 0.045; if (T.blinkT <= 0) { T.blink = 0.15; T.blinkT = 2.5 + Math.random() * 3; } if (T.blink > 0) T.blink -= 0.045;
      if (T.shown < t.length) {
        var before = T.shown; T.shown = Math.min(t.length, T.shown + 2);
        if (key && o.blip && Math.floor(T.shown / 6) > Math.floor(before / 6)) o.blip(key);
        if (person) paint(who, T.shown < t.length && T.shown % 4 < 2);
      } else {
        if (person) paint(who, false);
        if (T.choices && last() && !el.classList.contains('asking')) ask();
      }
      say.textContent = t.slice(0, T.shown);
      el.classList.toggle('ready', T.shown >= t.length);
      if (T.shown >= t.length && o.auto && o.auto()) { T.wait += 0.045; if (T.wait > 3.5) { if (T.choices && last()) api.choose(0); else api.advance(); } }
    }, 45);
    el.addEventListener('click', function (e) { e.stopPropagation(); if (!el.classList.contains('asking')) api.advance(); });
    if (o.keys !== false) document.addEventListener('keydown', function (e) {
      if (!get() || e.target.closest('.arc-set-bg,dialog[open]') || (e.target.matches && e.target.matches('input,textarea'))) return;
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('button,a,summary,select')) return;
      var asking = el.classList.contains('asking'), n = Number(e.key);
      if (asking && n >= 1 && n <= 9) api.choose(n - 1);
      else if (e.key === ' ' || e.key === 'Enter') { if (asking) api.choose(0); else api.advance(); }
      else if (e.key === 'Escape') api.skip();
      else return;
      e.preventDefault(); e.stopImmediatePropagation();
    }, true);
    return api;
  }

  window.Dialogue = { create: create, lookFor: lookFor, drawPortrait: drawPortrait, shade: shade };
})();
