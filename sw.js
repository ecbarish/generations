'use strict';
/* Offline play (L5). Online first: with internet, every page, script and style comes fresh from the site (so a new
   release shows up on the next reload, with nothing to bump), and each copy is kept. Without internet, or when the
   site is very slow, the kept copy is used. The hub prepares a complete copy of the eight games on its first visit,
   so they work offline even before you've opened them. Saves are never touched (they live in localStorage).
   CACHE_VERSION only needs changing if this worker's own storage format changes. See docs/offline.md. */
const CACHE_VERSION = '2';
const ROOT = new URL('./', self.location.href);
const PREFIX = 'idle-arcade-shell:' + ROOT.href + ':';
const CACHE = PREFIX + CACHE_VERSION;
const SLOW_MS = 4000; // past this, a waiting network request gives way to the kept copy (it still refreshes it)
const PAGES = ['index.html', 'promo.html', 'promo-wildbond.html', 'playtest.html', 'credits.html',
  'games/primordial/index.html', 'games/starfall-guild/index.html', 'games/realmbound/index.html', 'games/wildbond/index.html',
  'games/otherworld/index.html', 'games/diamond-career/index.html', 'games/diamond-manager/index.html',
  'games/lantern-bowl/index.html'];
const CORE = ['manifest.webmanifest', 'shared/offline.js', 'icons/arcade.svg', 'icons/arcade-192.png', 'icons/arcade-512.png'];
function local(path, base) { const u = new URL(path, base || ROOT); return u.origin === ROOT.origin && u.pathname.startsWith(ROOT.pathname) ? u : null; }
// HTML is authored in this repo. Only explicit scripts/styles and credits notices are followed; no crawled links or remote assets.
function dependencies(html, url) {
  const out = [];
  for (const tag of html.matchAll(/<(script|link|a)\b[^>]*>/gi)) {
    const attrs = {}; for (const a of tag[0].matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)) attrs[a[1].toLowerCase()] = a[2].replace(/&amp;/g, '&');
    const kind = tag[1].toLowerCase();
    const path = kind === 'script' ? attrs.src : kind === 'link' && attrs.rel === 'stylesheet' ? attrs.href :
      kind === 'a' && /^(?:credits\.html|CREDITS\.md|licenses\/)/.test(attrs.href || '') ? attrs.href : null;
    if (path) { const u = local(path, url); if (u) out.push(u.href); }
  }
  return out;
}
// one key per file: directories mean their index.html, and query strings (?gm) or #hashes don't make new copies
function keyOf(url) { const u = new URL(url); if (u.pathname.endsWith('/')) u.pathname += 'index.html'; u.search = ''; u.hash = ''; return u.href; }
self.addEventListener('install', e => e.waitUntil((async () => {
  const cache = await caches.open(CACHE), seen = new Set(), queue = [...PAGES, ...CORE].map(p => new URL(p, ROOT).href);
  try {
    while (queue.length) {
      const url = queue.shift(); if (seen.has(url)) continue; seen.add(url);
      const response = await fetch(new Request(url, { cache: 'reload', headers: { 'X-Arcade-Prepare': '1' } }));
      if (!response.ok || response.type === 'opaque') throw Error('Offline file unavailable: ' + url);
      if (new URL(url).pathname.endsWith('.html')) queue.push(...dependencies(await response.clone().text(), url));
      await cache.put(url, response);
    }
  } catch (error) { await caches.delete(CACHE); throw error; }
  // Safe to take over at once: this worker never pins old files while there is internet.
  await self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const name of await caches.keys()) if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || e.request.headers.has('X-Arcade-Prepare')) return;
  const url = local(e.request.url); if (!url || url.pathname.endsWith('/sw.js')) return;
  const key = keyOf(url.href);
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // always ask the site first (bypassing the browser's HTTP cache), and keep a copy of every good answer
    const fresh = fetch(e.request, { cache: 'no-cache' }).then(async r => { if (r.ok && r.type === 'basic') await cache.put(key, r.clone()); return r; });
    const kept = await cache.match(key);
    if (!kept) return fresh; // nothing kept: the network's answer (or its error) is all there is
    const slow = new Promise(res => setTimeout(() => res(null), SLOW_MS));
    try { const r = await Promise.race([fresh, slow]); if (r && r.ok) return r; } catch (_) { /* offline */ }
    e.waitUntil(fresh.catch(() => {})); // a slow answer still refreshes the kept copy for next time
    return kept;
  })());
});
