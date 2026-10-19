/* Hub, Lab and game pages (HUB-REDESIGN, 2026-10-14). Reads the display-only save index; never writes a save
   except when the player confirms "Erase and start over" on a card. Classic editions are never shown. */
(function () {
  'use strict';
  const VERSION = '1.8.0';
  const CURRENT = ['wildbond-preview', 'starfall-preview', 'realmbound']; // the headline games on the hub
  const PAGES = { 'wildbond-preview': 'game/wildbond.html', 'starfall-preview': 'game/starfall.html', realmbound: 'game/realmbound.html' };
  const SHORT = {
    'wildbond-preview': 'Bond with creatures, explore eight regions and bring colour back to a faded valley.',
    'starfall-preview': 'Build a frontier guild town: post jobs, cook at the inn, work the forge, then hire help.',
    realmbound: 'A classic-MMO adventure from level 1 to 60. Quest, dungeon, raid, or let Auto play.'
  };
  const LAB_ART = { 'storm-front': 1, 'lighthouse-watch': 1, 'briskets-crossing': 1, 'ember-bricks': 1, baseball: 'diamond-manager', 'lantern-bowl': 1, otherworld: 1, 'little-ranch': 1 };
  const GODOT_SAVES = { 'wildbond-preview': '/app_userdata/Wildbond (Godot trial)/journey.json' };
  const SAVE_KEYS = { baseball: 'diamond-manager-save-v1', otherworld: 'otherworld-save-v1', realmbound: 'realmbound-save-v1', 'lantern-bowl': 'lantern-bowl-save-v1', keymaster: 'keymaster-save-v1' };
  const all = (window.ArcadeGames || []).filter(g => g.edition !== 'classic' && g.kind !== 'classic' && !g.classic && !g.newer);
  let idx = {};
  try { idx = window.ArcadeSportsProgress ? ArcadeSportsProgress.forHall(Arcade.readIndex()) : Arcade.readIndex(); } catch (_) { idx = {}; }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ago = t => { const s = (Date.now() - t) / 1000; if (s < 90) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago'; return Math.round(s / 86400) + ' days ago'; };
  const base = document.body.dataset.base || '';
  const art = g => g.image ? base + g.image : g.id === 'realmbound' ? base + 'images/play/rb-fight.jpg' : LAB_ART[g.id] ? base + 'images/lab/' + (LAB_ART[g.id] === 1 ? g.id : LAB_ART[g.id]) + '.jpg' : '';
  const save = g => g.preview ? null : idx[g.id];

  function card(g, opts) {
    const p = save(g), label = p ? 'Continue' : 'Play';
    const prog = p ? `<div class="prog"><b>${esc(p.summary)}</b> · ${esc(p.detail)}${Number.isFinite(p.last) ? ' · played ' + ago(p.last) : ''}</div>` : '';
    const reset = p && SAVE_KEYS[g.id] ? `<div class="reset" id="rs-${g.id}"><button class="linkbtn" data-reset="${g.id}">Reset progress</button></div>` : '';
    const more = opts.page && PAGES[g.id] ? `<a class="btn btn-ghost btn-sm" href="${base + PAGES[g.id]}">About</a>` : '';
    const how = opts.how ? `<details><summary>How to play</summary><p><b>What you do:</b> ${g.goal}</p><p><b>Controls:</b> ${g.controls}</p>${g.load ? `<p>${g.load}</p>` : ''}</details>` : '';
    const src = art(g);
    const anchor = opts.kindAnchors && !opts.seen[g.kind] ? (opts.seen[g.kind] = 1, ` id="kind-${g.kind}"`) : '';
    return `<article class="card cab" data-game="${g.id}"${anchor}><div class="card-art">${src ? `<img src="${src}" alt="${esc(g.alt || g.title + ' screenshot')}" loading="${opts.eager ? 'eager' : 'lazy'}" decoding="async" width="960" height="540">` : ''}<div class="ttl">${g.title}</div></div>
      <div class="card-body"><span class="chip ${g.status[1]}">${g.status[0]}</span><p>${opts.short && SHORT[g.id] ? SHORT[g.id] : g.blurb}</p>${prog}${how}
      <div class="card-actions">${g.href ? `<a class="btn btn-sm play" href="${base + g.href}">${label}</a>` : '<span class="chip">Being designed now</span>'}${more}</div>${reset}</div></article>`;
  }
  function wireResets(root) {
    root.addEventListener('click', e => {
      const r = e.target.closest('[data-reset]'), ok = e.target.closest('[data-erase]'), no = e.target.closest('[data-keep]');
      if (r) { const g = all.find(x => x.id === r.dataset.reset);
        document.getElementById('rs-' + g.id).innerHTML = `<p class="warn">Erase all ${esc(g.title)} progress on this device${g.id === 'realmbound' ? ', including every character' : ''}? This can't be undone.</p><div class="row"><button class="btn btn-sm" data-erase="${g.id}">Erase and start over</button><button class="btn btn-sm btn-ghost" data-keep="${g.id}">Keep my progress</button></div>`; }
      if (ok) { const id = ok.dataset.erase; Arcade.erase(SAVE_KEYS[id], id); location.reload(); }
      if (no) { const id = no.dataset.keep; document.getElementById('rs-' + id).innerHTML = `<button class="linkbtn" data-reset="${id}">Reset progress</button>`; }
    });
  }
  window.Hub = {
    VERSION, CURRENT, idx, games: all,
    current: () => CURRENT.map(id => all.find(g => g.id === id)).filter(Boolean),
    lab: () => all.filter(g => !CURRENT.includes(g.id)),
    render(el, list, opts) { if (!el) return; opts = Object.assign({ seen: {} }, opts); el.innerHTML = list.map(g => card(g, opts)).join(''); wireResets(el); },
    // Previews are Godot games: their saves live in the browser's IndexedDB file system, never in the shared index.
    // Read-only: only look inside the database if it already exists (never create it), and only list keys.
    // Old hub links (v1.7 and the canvas hall) keep working: section anchors of current games land on Play now,
    // the others move to the matching section of the Lab.
    redirectOldHash() {
      const h = location.hash.slice(1); if (!h) return;
      const labKinds = this.lab().map(g => 'kind-' + g.kind);
      if (h === 'more-games' || h === 'kindsNav' || (labKinds.includes(h) && !['kind-adventure', 'kind-build'].includes(h))) { location.replace('lab.html' + (h.startsWith('kind-') ? '#' + h : '')); return; }
      if (/^(kind-|launch)/.test(h)) { const t = document.getElementById('games'); if (t) t.scrollIntoView(); }
    },
    jump() { const t = location.hash && document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); },
    cta(el, id, name) {
      if (!el) return;
      const file = GODOT_SAVES[id];
      if (!file) { if (idx[id]) el.textContent = '▶ Continue ' + name; return; }
      if (!window.indexedDB || !indexedDB.databases) return;
      indexedDB.databases().then(list => {
        if (!list.some(d => d.name === '/userfs')) return;
        const req = indexedDB.open('/userfs');
        req.onsuccess = () => { const db = req.result; try {
          if (!db.objectStoreNames.contains('FILE_DATA')) return db.close();
          const keys = db.transaction('FILE_DATA', 'readonly').objectStore('FILE_DATA').getAllKeys();
          keys.onsuccess = () => { if (keys.result.some(k => String(k).endsWith(file))) el.textContent = '▶ Continue ' + name; db.close(); };
        } catch (_) { db.close(); } };
      }).catch(() => {});
    }
  };
})();
