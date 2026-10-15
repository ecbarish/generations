/* NM-FIX-6 evidence: real Chromium, real clicks, real reloads, real downloads and file choosers.
   Run: NODE_PATH=<playwright> CHROME_PATH=<chrome> node docs/playtests/nm-save-reload/reload-check.cjs [output-directory]
   No network, no production data: a local static server and a throwaway browser profile. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../../..');
const out = path.resolve(process.argv[2] || __dirname);
fs.mkdirSync(out, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = http.createServer((q, r) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(path.join(root, p), (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }); r.end(d); });
});
const report = { checks: [], shots: [] };
const check = (name, ok, detail) => { report.checks.push({ name, pass: !!ok, detail }); if (!ok) throw new Error(name + ': ' + JSON.stringify(detail)); };
const KEY = 'night-market-save-v1';
// Other games' saves, seeded before anything happens. They must come out byte for byte the same.
const OTHERS = { 'little-ranch-settings-v1': '{"sound":false}', 'wildbond-save-v1': '{"v":1,"game":"wildbond","party":["Ember"],"note":"keep me"}', 'starfall-save-v1': '{"v":1,"note":"starfall"}',
  'unrelated-save': 'keep', 'arcade-backup:wildbond-save-v1:auto-recent': '{"at":1,"why":"seed","data":"x","ver":"0"}' };

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const origin = 'http://127.0.0.1:' + server.address().port, url = origin + '/games/night-market/';
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message)); const missing = []; page.on('response', r => { if (r.status() >= 400) missing.push(new URL(r.url()).pathname); }); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  const shot = async (name, sel) => { if (sel) await page.locator(sel).scrollIntoViewIfNeeded(); else await page.evaluate(() => window.scrollTo(0, 0)); const f = path.join(out, name + '.png'); await page.screenshot({ path: f, fullPage: true }); report.shots.push(name + '.png'); };
  const ls = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
  const save = () => page.evaluate(k => Arcade.load(k), KEY);
  const others = all => Object.fromEntries(Object.entries(all).filter(([k]) => !k.includes('night-market') && k !== 'arcade-index-v1'));
  let dialogs = []; page.on('dialog', d => { dialogs.push(d.message()); d.accept(); });

  await page.goto(url); await page.evaluate(o => { for (const [k, v] of Object.entries(o)) localStorage.setItem(k, v); }, OTHERS);
  await page.evaluate(() => localStorage.setItem('arcade-index-v1', JSON.stringify({ wildbond: { name: 'Wildbond', line: 'seeded row', at: 1 } })));
  await page.reload();
  // Count every storage write from here on that is not Night Market's own.
  await page.addInitScript(() => { window.__writes = JSON.parse(sessionStorage.getItem('__w') || '[]'); for (const op of ['setItem', 'removeItem', 'clear']) { const o = Storage.prototype[op]; Storage.prototype[op] = function (...a) { if (this === localStorage) { window.__writes.push([op, a[0] || null]); sessionStorage.setItem('__w', JSON.stringify(window.__writes)); } return o.apply(this, a); }; } });
  await page.reload();
  const before = others(await ls());
  check('The other games\' seeded saves are there before we start', Object.keys(before).length === Object.keys(OTHERS).length, Object.keys(before));

  // 1. Play with real clicks, then Your save does something.
  for (let i = 0; i < 12; i++) await page.click('[data-i="0"] [data-act="serve"]');
  // keep serving with real clicks until the first stall can be hired, then hire it, so there is something to earn while away
  for (let i = 0; i < 60 && !(await page.locator('[data-i="0"] [data-act="hire"]').isVisible()); i++) await page.click('[data-i="0"] [data-act="serve"]');
  await page.click('[data-i="0"] [data-act="hire"]');
  // ...and pour by hand until the first stall can be bought, then buy one (a hired stall with none owned earns nothing)
  for (let i = 0; i < 400 && await page.locator('[data-i="0"] [data-act="buy"]').isDisabled(); i++) await page.click('[data-i="0"] [data-act="serve"]');
  await page.click('[data-i="0"] [data-act="buy"]');
  let played = await save();
  check('Real clicks hired the first stall and bought one (it now earns by itself)', (await save()).stalls[0].hired === true && (await save()).stalls[0].owned >= 1, (await save()).stalls[0]);
  played = await save();
  check('Real serve clicks are saved straight away', played && played.cash > 0 || played && played.lifetime > 0, played && { cash: played.cash, lifetime: played.lifetime });
  await page.click('details.save summary'); await page.waitForSelector('#tools [data-arcsave="download"]');
  check('"Your save" opens and shows Download, Load a file and the automatic backups', await page.locator('#tools [data-arcsave="download"]').count() === 1 && await page.locator('#tools input[data-arcsave="file"]').count() === 1 && /Automatic backups \(\d+\)/.test(await page.locator('#tools .arc-bk summary').innerText()), await page.locator('#tools').innerText());
  await shot('1-your-save-open', 'details.save');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#tools [data-arcsave="download"]')]);
  const dlPath = path.join(out, 'downloaded-save.json'); await dl.saveAs(dlPath); const dlText = fs.readFileSync(dlPath, 'utf8');
  check('Download my save hands over a real file that is this game\'s save', /night-market-save-v1-\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()) && JSON.parse(dlText).game === 'night-market' && JSON.parse(dlText).lifetime === played.lifetime, { name: dl.suggestedFilename() });
  check('...and says so on the page', /Downloaded/.test(await page.locator('#tools .arc-save-msg').innerText()));

  // 2. Reload shows the away summary after a real absence (the stored last-seen time is moved back 2 hours).
  const aged = Object.assign({}, played, { seen: Date.now() - 2 * 3600 * 1000 });
  // The page's own pagehide save stamps "seen" with the current time, so the aged save is put in storage just before the reload's scripts run:
  // exactly the state left behind by closing the tab two hours ago.
  const agedText = JSON.stringify(aged);
  await page.addInitScript(([k, t]) => { if (!sessionStorage.getItem('__aged')) { sessionStorage.setItem('__aged', '1'); localStorage.setItem(k, t); } }, [KEY, agedText]);
  await page.reload(); await page.waitForSelector('#away:not([hidden])', { timeout: 5000 }).catch(() => {});
  const awayText = await page.locator('#away').innerText();
  check('A reload after 2 hours away shows "While you were away" with the time and the coins earned', /While you were away/.test(awayText) && /2h/.test(awayText) && /coin/i.test(awayText), awayText);
  await shot('2-away-summary-after-reload', '#away');
  const afterAway = await save();
  check('The away coins are in the saved cash', afterAway.cash > played.cash, { before: played.cash, after: afterAway.cash });
  await page.click('#away [data-act="away"]');
  check('"Put the box away" closes the summary', await page.locator('#away').isHidden());
  await page.reload();
  check('An immediate second reload does not show the box again (nothing new was earned)', await page.locator('#away').isHidden());

  // 3. Load a save file: a good one replaces the save (and backs the old one up); a wrong one is refused and changes nothing.
  const good = Object.assign({}, JSON.parse(dlText), { cash: 12345 }); const goodPath = path.join(out, 'good-save.json'); fs.writeFileSync(goodPath, JSON.stringify(good));
  const beforeLoad = await save(); dialogs = [];
  await page.click('details.save summary'); await page.waitForSelector('#tools input[data-arcsave="file"]');
  await Promise.all([page.waitForNavigation(), page.setInputFiles('#tools input[data-arcsave="file"]', goodPath)]);
  const loaded = await save();
  check('Load a save file asks first, then the game reloads with that save', dialogs.length === 1 && /Replace your save/.test(dialogs[0]) && Math.floor(loaded.cash) >= 12345, { dialogs, cash: loaded.cash });
  const bks = await page.evaluate(() => Arcade.backups('night-market-save-v1').map(b => b.why));
  check('The save it replaced was backed up first', bks.includes('before loading a file'), bks);
  const bad = path.join(out, 'wrong-game.json'); fs.writeFileSync(bad, JSON.stringify({ v: 1, game: 'wildbond', cash: 1 }));
  await page.click('details.save summary'); await page.waitForSelector('#tools input[data-arcsave="file"]'); const keep = await save(); dialogs = [];
  await page.setInputFiles('#tools input[data-arcsave="file"]', bad); await page.waitForFunction(() => /isn't a save/.test(document.querySelector('#tools .arc-save-msg').textContent));
  check('Another game\'s file is refused with a message and the save is untouched', (now => now.game === 'night-market' && JSON.stringify(now.stalls) === JSON.stringify(keep.stalls) && now.cash >= keep.cash)(await save()) && dialogs.length === 0, { msg: await page.locator('#tools .arc-save-msg').innerText(), dialogs, keep, now: await save() });
  await shot('3-wrong-file-refused', 'details.save');

  // 4. Restore an automatic backup.
  await page.reload(); await page.click('details.save summary'); await page.waitForSelector('#tools .arc-bk');
  await page.click('#tools .arc-bk summary'); const n = await page.locator('#tools [data-arcsave="restore"]').count(); dialogs = [];
  check('There is at least one backup to restore', n > 0, n);
  const target = await page.evaluate(() => { const b = Arcade.backups('night-market-save-v1').find(x => x.why === 'before loading a file'); return b && b.k; });
  await Promise.all([page.waitForNavigation(), page.click(`#tools [data-arcsave="restore"][data-k="${target}"]`)]);
  const restored = await save();
  check('Restore asks first, then reloads with the older save (the one from before the file load)', dialogs.length === 1 && /Restore this backup/.test(dialogs[0]) && Math.abs(restored.lifetime - beforeLoad.lifetime) < 1e-6 + beforeLoad.lifetime * 0.5 + 5 && restored.cash < 12345, { cash: restored.cash });

  // 5. Through all of that, nothing else was touched.
  const afterAll = await ls(), w = await page.evaluate(() => window.__writes);
  const mine = k => k.includes('night-market');
  check('Every other game\'s save is byte for byte what we seeded', JSON.stringify(others(afterAll)) === JSON.stringify(before), Object.keys(others(afterAll)));
  const idx = JSON.parse(await page.evaluate(() => localStorage.getItem('arcade-index-v1')) && (await page.evaluate(() => JSON.stringify(Arcade.readIndex()))));
  check('The hub index keeps the other game\'s row and gains only Night Market\'s', idx.wildbond && idx.wildbond.line === 'seeded row', Object.keys(idx));
  check('Every storage write across all those reloads was to a Night Market key or the hub index', w.length > 0 && w.every(([, k]) => k === null ? false : mine(k) || k === 'arcade-index-v1'), w.filter(([, k]) => !(k && (mine(k) || k === 'arcade-index-v1'))));
  check('No page errors or console errors, and the only missing file is the browser\'s favicon request (also missing on main)', errors.length === 0 && missing.every(u => u === '/favicon.ico'), { errors, missing });
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log('PASS: ' + report.checks.length + ' reload checks; ' + report.shots.length + ' screenshots.');
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
