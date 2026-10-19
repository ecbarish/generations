/* NM-G8 evidence. Plain Node with playwright-core (or playwright) and Chrome; not run by CI.
     CHROME_PATH=/usr/bin/google-chrome node docs/playtests/nm-playtest-fixes-2/capture.cjs shots <outdir> <tag>
     CHROME_PATH=... node docs/playtests/nm-playtest-fixes-2/capture.cjs scrollbar
   `shots` saves the lane at four sizes with two people mid-lane (run once on main and once on the branch, then stack them).
   `scrollbar` loads the page with a classic 15px scrollbar (Chrome's headless default hides scrollbars) at ten widths and three
   market sizes, prints documentElement.scrollWidth against clientWidth, and lists any 404 (the old /favicon.ico). */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
let pw; try { pw = require('playwright-core'); } catch (e) { pw = require('playwright'); }
const ROOT = path.join(__dirname, '..', '..', '..'), mode = process.argv[2] || 'scrollbar';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const missing = [];
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, b) => { if (e) { missing.push(q.url); r.statusCode = 404; r.end('no'); } else { r.setHeader('content-type', mime[path.extname(p)] || 'application/octet-stream'); r.end(b); } }); });
(async () => {
  await new Promise(r => srv.listen(0, r)); const base = 'http://127.0.0.1:' + srv.address().port;
  const launch = { executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] };
  if (mode === 'scrollbar') launch.ignoreDefaultArgs = ['--hide-scrollbars'];
  const br = await pw.chromium.launch(launch);
  if (mode === 'shots') {
    const out = process.argv[3], tag = process.argv[4]; fs.mkdirSync(out, { recursive: true });
    for (const [w, h, kind] of [[390, 844, 'mid'], [844, 390, 'mid'], [1366, 768, 'big'], [1920, 1080, 'big']]) {
      const ctx = await br.newContext({ viewport: { width: w, height: h } }), pg = await ctx.newPage();
      await pg.goto(base + '/games/night-market/index.html');
      await pg.evaluate(k => { const s = __nightMarket.state; s.stalls.forEach((t, i) => { t.owned = k === 'big' ? 22 : [30, 12, 5, 2, 0, 0][i]; t.hired = k === 'big' || i < 4; t.serves = 30; }); s.cash = 1e6; s.lifetime = 1e6; __nightMarket.render(); }, kind);
      await pg.waitForTimeout(300);
      await pg.evaluate(() => { const L = NightLane; L.setReduce(true); L.setReduce(false); const mid = () => L.walkers().filter(p => p.x > 40 && p.x < 330).length; for (let i = 0; i < 3000 && mid() < 2; i++) L.step(1); L.setReduce(true); });
      await pg.locator('.lane').screenshot({ path: path.join(out, tag + '-lane-' + w + 'x' + h + '.png') });
      await ctx.close();
    }
  } else {
    console.log('market\tviewport\tinnerWidth\tscrollWidth\tclientWidth\tstrip left\tstrip right');
    for (const kind of ['fresh', 'mid', 'big']) for (const [w, h] of [[320, 568], [360, 780], [390, 844], [568, 320], [768, 1024], [844, 390], [1024, 768], [1152, 800], [1366, 768], [1920, 1080]]) {
      const ctx = await br.newContext({ viewport: { width: w, height: h } }), pg = await ctx.newPage();
      await pg.goto(base + '/games/night-market/index.html');
      await pg.evaluate(k => { const s = __nightMarket.state; s.stalls.forEach((t, i) => { t.owned = k === 'big' ? 66 : k === 'mid' ? 30 : 0; t.hired = k !== 'fresh'; }); s.bulk = 'max'; __nightMarket.render(); }, kind);
      await pg.waitForTimeout(300);
      const r = await pg.evaluate(() => { const d = document.documentElement, l = document.querySelector('#lane').getBoundingClientRect(); return [innerWidth, d.scrollWidth, d.clientWidth, Math.round(l.left), Math.round(l.right)]; });
      console.log([kind, w + 'x' + h].concat(r).join('\t') + (r[1] > r[2] ? '\tSPILLS ' + (r[1] - r[2]) + 'px' : '')); await ctx.close();
    }
    console.log('requests that returned 404: ' + JSON.stringify(missing));
  }
  await br.close(); srv.close();
})();
