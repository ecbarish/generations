/* LB-PAL evidence. Plain Node with playwright-core (or playwright) and Chrome; not run by CI.
     CHROME_PATH=/usr/bin/google-chrome node docs/playtests/lb-palette-30/capture.cjs <repo root> <outdir> <tag>
   Serves <repo root> (so run it once on main and once on the branch), loads games/lantern-bowl/index.html at 844x390 and
   1920x1080 (device pixel ratio 1, a fresh save, a fixed clock) and saves five screens per size: the title panel, a pass aimed
   mid-drag (the power meter), a run mid-drag (the touch stick), the roster page (the #495 view) and the Final panel.
   Then `node docs/playtests/lb-palette-30/diff.cjs <outdir>` compares the before and after pairs. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
let pw; try { pw = require('playwright-core'); } catch (e) { pw = require('playwright'); }
const [ROOT, OUT, TAG] = process.argv.slice(2); fs.mkdirSync(OUT, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, b) => { if (e) { r.statusCode = 404; r.end('no'); } else { r.setHeader('content-type', mime[path.extname(p)] || 'application/octet-stream'); r.end(b); } }); });
(async () => {
  await new Promise(r => srv.listen(0, r)); const base = 'http://127.0.0.1:' + srv.address().port;
  const br = await pw.chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox'] });
  for (const [w, h] of [[844, 390], [1920, 1080]]) {
    const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const pg = await ctx.newPage(), size = w + 'x' + h, shot = name => pg.screenshot({ path: path.join(OUT, `${TAG}-${name}-${size}.png`) });
    const T0 = 1760000000000;
    // a fake clock: the game's timers, requestAnimationFrame and performance.now all move only when we say, so both builds see the same frames
    const settle = async () => { await pg.waitForTimeout(400); await pg.clock.pauseAt(T0 + 60000 * (++epoch)); };
    const tick = ms => pg.clock.runFor(ms);
    let epoch = 0;
    const press = async sel => { const b = await pg.locator(sel).first().boundingBox(); await pg.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };
    await pg.clock.install({ time: T0 });
    await pg.goto(base + '/games/lantern-bowl/index.html'); await settle(); await tick(500);
    await shot('title');
    const field = async () => (await pg.locator('#field').boundingBox());
    const drag = async (dx, dy) => { const b = await field(), x = b.x + b.width * 0.4, y = b.y + b.height * 0.55; await pg.mouse.move(x, y); await pg.mouse.down(); await pg.mouse.move(x + dx / 2, y + dy / 2); await pg.mouse.move(x + dx, y + dy); await tick(120); };
    // a pass: Quick, then a drag toward the far receivers
    await press('#panel button'); await tick(300);
    await press('#dock button:has-text("Quick")'); await tick(500);
    await drag(Math.round(w * 0.12), -Math.round(h * 0.1)); await shot('pass-aim'); await pg.mouse.up(); await tick(100);
    // a run: a fresh game, Outside run, then a drag to steer
    await pg.evaluate(() => localStorage.clear()); await pg.reload(); await settle(); await tick(400);
    await press('#panel button'); await tick(300);
    await press('#dock button:has-text("Outside run")'); await tick(500);
    await drag(Math.round(w * 0.05), Math.round(h * 0.06)); await shot('run-stick'); await pg.mouse.up();
    // the Final panel, through the saved match
    await pg.evaluate(() => { const H = __lantern; H.state.phase = 'final'; H.state.score = { home: 24, away: 17 }; H.persist(); });
    await pg.reload(); await settle(); await tick(500);
    await press('#panel button'); await tick(400); await shot('final');
    // the roster page
    await pg.goto(base + '/docs/playtests/lb-roster-view/index.html'); await settle(); await tick(500); await shot('roster');
    await ctx.close();
  }
  await br.close(); srv.close();
})();
