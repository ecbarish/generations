/* The arcade launcher (L8; trimmed by AR2.12, 2026-10-09): the arcade hall, a cozy room of cabinets whose screens
   play each game's cover. Walk along with the arrow keys or tap a cabinet to walk to it, Enter to play.
   Evan (2026-10-09): the living world only showed some of the games and the road repeated it with Wildbond's own
   town art, so both are gone and the vote between the styles is closed (docs/VOTES.md). The hall shows every game.
   Each cabinet is also a real link laid over it, so keyboard, screen readers and taps work the same way.
   Reads window.ARCADE (GAMES, covers, idx) from index.html; draws with shared/ambience.js and shared/light.js.   */
(function () {
  'use strict';
  const A = window.ARCADE, root = document.getElementById('launcher'); if (!A || !root) return;
  const cv = root.querySelector('#launchCv'), hits = root.querySelector('#launchHits'), hint = root.querySelector('#launchHint');
  const cx = cv.getContext('2d'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AMB = Ambience.create({ reduce: () => reduce }), LT = Light.create({ reduce: () => reduce, quality: () => 'high' });
  try { localStorage.removeItem('arcade-launcher'); } catch (e) {} // the old style choice; only one style now
  let W = 0, H = 0, hover = null, lastT = 0;
  const playable = A.GAMES.filter(g => g.href), byId = id => A.GAMES.find(g => g.id === id);
  const prog = id => { if (byId(id).preview) return 'Early preview · Classic saves stay separate'; const p = A.idx[id]; return p ? p.summary : 'Not started yet'; };
  function size() {
    const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = Math.max(1, Math.round(W * d)); cv.height = Math.max(1, Math.round(H * d)); cx.setTransform(d, 0, 0, d, 0, 0);
    cx.imageSmoothingEnabled = false; layoutHits();
  }
  const R = (x, y, w, h, col) => { cx.fillStyle = col; cx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function label(x, y, title, sub, col) {
    cx.save(); cx.font = `700 ${Math.max(13, Math.round(H / 18))}px Figtree, system-ui, sans-serif`; const fs2 = Math.max(11, Math.round(H / 26));
    const w1 = cx.measureText(title).width; cx.font = `${fs2}px Figtree, system-ui, sans-serif`; const w2 = cx.measureText(sub).width, w = Math.min(W - 12, Math.max(w1, w2) + 20), hh = H / 18 + fs2 + 16;
    const lx = Math.min(Math.max(6, x - w / 2), W - w - 6), ly = Math.max(6, y - hh);
    cx.fillStyle = 'rgba(18,16,28,.82)'; cx.fillRect(lx, ly, w, hh); cx.fillStyle = col; cx.fillRect(lx, ly + hh - 3, w, 3);
    cx.fillStyle = '#fff'; cx.font = `700 ${Math.max(13, Math.round(H / 18))}px Figtree, system-ui, sans-serif`; cx.textBaseline = 'top'; cx.textAlign = 'left'; cx.fillText(title, lx + 10, ly + 6, w - 20);
    cx.fillStyle = '#cfc8e0'; cx.font = `${fs2}px Figtree, system-ui, sans-serif`; cx.fillText(sub, lx + 10, ly + 8 + H / 18, w - 20); cx.restore();
  }
  function glow(x, y, r, col, a) { const g = cx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); cx.save(); cx.globalAlpha = a; cx.fillStyle = g; cx.fillRect(x - r, y - r, r * 2, r * 2); cx.restore(); }

  /* ===================== the arcade hall ===================== */
  const kindAt = g => { const i = (window.ArcadeKinds || []).findIndex(k => k.id === g.kind); return i < 0 ? 99 : i; };
  /* Evan (2026-10-11): squeezing every cabinet onto one screen made them tiny. Cabinets now keep one readable size and
     stand in a row longer than the screen; the view follows you as you walk (HALL.x and the camera are in pixels). */
  const HALL = { x: 0, cam: 0, target: null, go: null, dir: 1, keys: {} }, CABS = playable.concat(A.GAMES.filter(g => !g.href)).map((g, i) => [g, i]).sort((m, n) => kindAt(m[0]) - kindAt(n[0]) || m[1] - n[1]).map(m => m[0]); // grouped like the sections below, Classics last
  const screens = {};
  const cabW = () => Math.max(70, Math.min(150, H * .26)), gap = () => cabW() * 1.55, margin = () => Math.max(cabW() * 1.2, W * .12);
  function cabX(i) { return margin() + i * gap(); } // in hall pixels
  const hallLen = () => Math.max(W, cabX(CABS.length - 1) + margin());
  function hall(t, dt) {
    const floor = H * .82, p = Math.max(2, Math.round(H / 120)), cam = HALL.cam;
    R(0, 0, W, floor, '#1c1630'); for (let x = -((cam * .5) % (p * 8)); x < W; x += p * 8) R(x, 0, p * 4, floor, '#201a36'); // striped wallpaper, half-speed
    R(0, floor - p * 3, W, p * 3, '#3a2a50');
    const g = cx.createLinearGradient(0, floor, 0, H); g.addColorStop(0, '#2a1838'); g.addColorStop(1, '#140c1e'); cx.fillStyle = g; cx.fillRect(0, floor, W, H - floor);
    const carpet = ['#ff6fa8', '#7ab8ff', '#ffcf4d', '#7fe0a0'], span = hallLen(); for (let i = 0; i < 40 * Math.ceil(span / Math.max(1, W)); i++) { const x = (i * 97) % span - cam; if (x < -20 || x > W + 20) continue; const y = floor + p * 2 + ((i * 53) % Math.max(1, H - floor - p * 4)); R(x, y, p * 3, p, carpet[i % 4]); R(x + p, y - p, p, p * 3, carpet[i % 4]); }
    // neon sign
    cx.save(); cx.font = `${Math.max(14, Math.round(H / 10))}px Bungee, Impact, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'top';
    const flick = reduce ? 1 : (Math.sin(t * 23) > -.95 ? 1 : .4); cx.shadowColor = '#ff6fa8'; cx.shadowBlur = 18 * flick; cx.fillStyle = `rgba(255,111,168,${.9 * flick})`; cx.fillText('IDLE ARCADE', W / 2, H * .05); cx.restore();
    const lights = [{ x: W / 2, y: H * .1, r: H * .3, col: '#ff6fa8' }];
    for (let i = 0; i < 5; i++) { const lx = W * (.1 + i * .2); R(lx - p * 3, 0, p * 6, p * 2, '#5a4a70'); lights.push({ x: lx, y: p * 3, r: H * .35, col: '#ffe8c0' }); }
    CABS.forEach((gm, i) => {
      const x = cabX(i) - cam, cw = cabW(), ch = H * .52; if (x < -cw || x > W + cw) return;
      const top = floor - ch, on = hover === gm.id, col = { 'wildbond-preview': '#2f7a52', 'starfall-preview': '#3a4a8a', primordial: '#1e5a60', 'starfall-guild': '#3a4a8a', realmbound: '#4a2a6a', wildbond: '#2f7a52', baseball: '#5a5a5a', 'diamond-career': '#245c58', otherworld: '#4a3a7a' }[gm.id] || '#444';
      R(x - cw / 2, top, cw, ch, col); R(x - cw / 2 - p, top, p, ch, '#00000055'); R(x - cw / 2, top, cw, p * 6, '#0a0a12');
      cx.save(); cx.font = `${Math.max(9, Math.round(cw / 9))}px Bungee, Impact, sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillStyle = gm.href ? '#ffcf4d' : '#8a8aa0';
      cx.fillText(gm.title.toUpperCase(), x, top + p * 3, cw * .94); // squeezed to fit narrow phone cabinets cx.restore();
      const sw = cw * .8, sh = ch * .38, sx = x - sw / 2, sy = top + p * 9;
      let s = screens[gm.id]; if (!s) { s = screens[gm.id] = document.createElement('canvas'); s.width = 160; s.height = 90; }
      const sc = s.getContext('2d'), photo = document.querySelector('[data-game="'+gm.id+'"] .cover img'); if (photo && photo.complete && photo.naturalWidth) sc.drawImage(photo,0,0,160,90); else if (gm.href && A.covers[gm.cover]) A.covers[gm.cover](sc, 160, 90, reduce ? 0 : t); else { sc.fillStyle = '#111'; sc.fillRect(0, 0, 160, 90); for (let k = 0; k < 160; k++) { sc.fillStyle = `rgba(255,255,255,${Math.random() * .25})`; sc.fillRect(Math.random() * 160, Math.random() * 90, 2, 1); }
        sc.fillStyle = '#ccc'; sc.font = '14px Bungee, Impact, sans-serif'; sc.textAlign = 'center'; sc.fillText('COMING SOON', 80, 50); }
      R(sx - p, sy - p, sw + p * 2, sh + p * 2, '#0a0a12'); cx.drawImage(s, sx, sy, sw, sh);
      R(x - cw * .4, sy + sh + p * 3, cw * .8, p * 4, '#1a1a24'); R(x - cw * .2, sy + sh + p * 2, p * 2, p * 3, '#e0483e'); R(x + cw * .1, sy + sh + p * 3, p * 2, p * 2, '#3a8ae0'); R(x + cw * .2, sy + sh + p * 3, p * 2, p * 2, '#ffcf4d');
      lights.push({ x, y: sy + sh / 2, r: cw * (on ? 1.4 : 1), col: gm.href ? '#a8d8ff' : '#666' });
      if (on) { glow(x, sy + sh / 2, cw, gm.href ? '#ffcf4d' : '#888', .35); label(x, top - p * 2, gm.title, gm.href ? prog(gm.id) : 'Coming soon', '#ffcf4d'); }
    });
    // you: walk to the cabinet you chose, or with the arrow keys
    const speed = Math.max(260, gap() * 3), k = HALL.keys; let vx = (k.right ? 1 : 0) - (k.left ? 1 : 0);
    if (vx) HALL.target = null; else if (HALL.target !== null) { const d = HALL.target - HALL.x; if (Math.abs(d) < 6) { const gm = HALL.go; HALL.target = null; if (gm && gm.href) location.href = gm.href; } else { vx = Math.sign(d); if (Math.abs(d) < speed * dt) HALL.x = HALL.target - vx * speed * dt; } }
    HALL.x = Math.max(cabW() * .4, Math.min(hallLen() - cabW() * .4, HALL.x + vx * speed * dt)); if (vx) HALL.dir = vx;
    HALL.cam = Math.max(0, Math.min(hallLen() - W, HALL.x - W / 2)); placeHits();
    const near = CABS.reduce((best, gm, i) => Math.abs(cabX(i) - HALL.x) < Math.abs(cabX(best.i) - HALL.x) ? { gm, i } : best, { gm: CABS[0], i: 0 });
    if (Math.abs(cabX(near.i) - HALL.x) >= gap() * .4) hover = null; else { hover = near.gm.id; if (hint) hint.textContent = near.gm.href ? 'Press Enter (or tap) to play ' + near.gm.title : near.gm.title + ' is coming soon'; }
    walker(HALL.x - cam, floor + p * 2, p * 1.4, HALL.dir, vx && !reduce ? Math.floor(t * 8) % 2 : 0);
    // more cabinets beyond the edge: a soft arrow on that side
    cx.save(); cx.fillStyle = 'rgba(255,207,77,.75)'; cx.font = `${Math.round(H / 9)}px Bungee, Impact, sans-serif`; cx.textBaseline = 'middle';
    if (cam > 4) { cx.textAlign = 'left'; cx.fillText('‹', p * 3, floor - H * .3); } if (cam < hallLen() - W - 4) { cx.textAlign = 'right'; cx.fillText('›', W - p * 3, floor - H * .3); } cx.restore();
    AMB.lights(cx, W, H, t, { dark: .8, max: .5, lights, tint: '#0a0614' });
    LT.bloom(cx, cv, W, H, { day: false });
  }
  function walker(x, gy, p, dir, step) {
    const q = (dx, dy, w, h, c) => R(x + (dir > 0 ? dx : -dx - w) * p, gy - 16 * p + dy * p, w * p, h * p, c);
    q(-3, 0, 6, 2, '#6b4423'); q(-3, 2, 6, 4, '#f1c9a0'); q(dir > 0 ? 1 : -2, 3, 1, 1, '#222'); q(-3, 6, 6, 5, '#3a6fd8'); q(-4, 7, 1, 3, '#f1c9a0'); q(3, 7, 1, 3, '#f1c9a0');
    q(-3, 11, 2, 5 - step, '#2b2b3a'); q(1, 11, 2, 4 + step, '#2b2b3a');
  }


  /* ===================== links over each cabinet, input, the loop ===================== */
  function layoutHits() {
    hits.innerHTML = CABS.map(g => g.href ? `<a class="launch-hit" href="${g.href}" data-id="${g.id}" aria-label="${g.title}: ${prog(g.id)}"></a>`
      : `<span class="launch-hit soon" data-id="${g.id}" aria-label="${g.title}: coming soon" role="img"></span>`).join('');
    placeHits();
  }
  function placeHits() { // each link sits over its cabinet as the view scrolls
    const w = cabW() + 8; hits.querySelectorAll('[data-id]').forEach((h, i) => { h.style.left = (cabX(i) - HALL.cam - w / 2) + 'px'; h.style.width = w + 'px'; });
    cv.parentElement.scrollLeft = 0; // focus may scroll the clipped view; the camera owns scrolling
  }
  const xOf = id => cabX(CABS.findIndex(g => g.id === id));
  hits.addEventListener('focusin', e => { // keyboard: tabbing to a cabinet brings you to it
    const h = e.target.closest('[data-id]'); if (!h) return; hover = h.dataset.id; HALL.x = xOf(hover); HALL.target = null; HALL.cam = Math.max(0, Math.min(hallLen() - W, HALL.x - W / 2)); placeHits();
  });
  hits.addEventListener('click', e => { // a tap walks you there first, then you go in
    const h = e.target.closest('[data-id]'); if (!h || e.detail === 0) return; e.preventDefault();
    const g = byId(h.dataset.id); HALL.target = xOf(g.id); HALL.go = g;
  });
  addEventListener('keydown', e => {
    if (e.target.closest('button,input,select,textarea,.arc-set-bg') || (!root.contains(document.activeElement) && document.activeElement !== document.body)) return;
    const k = e.key; if (k === 'ArrowLeft' || k === 'a') { HALL.keys.left = true; e.preventDefault(); } if (k === 'ArrowRight' || k === 'd') { HALL.keys.right = true; e.preventDefault(); }
    if ((k === 'Enter' || k === ' ') && hover && document.activeElement === document.body) { const g = byId(hover); if (g && g.href) location.href = g.href; }
  });
  addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'a') HALL.keys.left = false; if (e.key === 'ArrowRight' || e.key === 'd') HALL.keys.right = false; });
  function frame(ms) {
    const t = ms / 1000, dt = Math.min(.1, t - lastT || 0); lastT = t;
    if (W >= 1 && H >= 1 && !document.hidden) hall(reduce ? 0 : t, dt);
    requestAnimationFrame(frame);
  }
  if (hint) hint.textContent = 'Walk with ← → or tap a cabinet';
  addEventListener('resize', size); size(); HALL.x = cabX(0); requestAnimationFrame(frame);
  window.__launcher = { CABS, hall: HALL };
})();
