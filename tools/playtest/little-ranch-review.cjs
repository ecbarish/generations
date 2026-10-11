/* LR2: real Chromium regression and screenshot evidence, isolated from player storage.
   Run: node tools/playtest/little-ranch-review.cjs [output-directory]
   Requires Playwright and Chromium; no production data or network services are used. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const out = path.resolve(process.argv[2] || 'little-ranch-review');
fs.mkdirSync(out, { recursive: true });
const report = { checks: [], screenshots: [] };
const check = (name, ok, detail) => { report.checks.push({ name, pass: !!ok, detail }); if (!ok) throw Error(name + ': ' + JSON.stringify(detail)); };
const baseline = execFileSync('git', ['show', '95412d5ec7e9bc37beeefb1cc396617482f92182:games/little-ranch/game.js'], { cwd: root, encoding: 'utf8' });
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let name = decodeURIComponent(url.pathname);
  if (name.startsWith('/baseline/')) {
    if (name.endsWith('game.js')) { res.setHeader('Content-Type', 'text/javascript'); return res.end(baseline); }
    name = '/games/little-ranch/index.html';
  }
  if (name.endsWith('/')) name += 'index.html';
  const file = path.resolve(root, '.' + name);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, bytes) => { if (err) { res.writeHead(404); return res.end(); } res.setHeader('Content-Type', name.endsWith('.js') ? 'text/javascript' : 'text/html'); res.end(bytes); });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
  try {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, serviceWorkers: 'block' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const shot = async name => { await page.screenshot({ path: path.join(out, name + '.png') }); report.screenshots.push(name + '.png'); };
    const advance = secs => page.evaluate(secs => LR.advance(secs), secs);
    const state = () => page.evaluate(() => ({ food: LR.state.bowl.food, acts: LR.state.acts, act: LR.state.baby.act, x: LR.state.baby.x, home: LR.layout.home.x }));
    const tap = async place => {
      const p = await page.evaluate(place => LR.toScreen(place === 'bush' ? { x: LR.layout.bush.x, y: LR.layout.bush.y - LR.layout.R * .4 } : LR.layout[place]), place);
      await page.mouse.click(p.x, p.y);
    };
    // The old suite's storage restoration must keep an existing sound choice and another game's save.
    await page.goto(origin + '/tests/little-ranch.html');
    await page.evaluate(() => { localStorage.setItem('little-ranch-settings-v1', '{"sound":false}'); localStorage.setItem('lr2-unrelated-save', '{"level":27}'); });
    for (let run = 1; run <= 2; run++) {
      await page.click('#run');
      await page.waitForFunction(() => /^(PASS|FAIL)/.test(document.querySelector('#summary').textContent), null, { timeout: 120000 });
      const result = await page.locator('#summary').textContent();
      check('Browser regression suite run ' + run, /^PASS/.test(result), result);
      const storage = await page.evaluate(() => [localStorage.getItem('little-ranch-settings-v1'), localStorage.getItem('lr2-unrelated-save')]);
      check('Existing settings and unrelated save survive run ' + run, storage[0] === '{"sound":false}' && storage[1] === '{"level":27}', storage);
      await shot('checks-' + run);
    }
    for (const base of [true, false]) {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(origin + (base ? '/baseline/' : '/games/little-ranch/'));
      await tap('bowl'); await tap('bush'); await advance(8); await tap('bowl'); await advance(5);
      const s = await state();
      check((base ? 'Baseline reproduces' : 'Repair clears') + ' interrupted feeding', base ? s.food > 0 && s.acts === 1 : s.food === 0 && s.acts === 2, s);
      await shot((base ? 'before' : 'after') + '-interrupted-feed');
      await page.setViewportSize({ width: 3440, height: 1440 });
      await page.evaluate(() => LR.newVisit());
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForFunction(() => document.querySelector('canvas').width < 250);
      const rotated = await state();
      check((base ? 'Baseline reproduces' : 'Repair prevents') + ' offscreen baby after rotation', base ? rotated.x > documentWidth(rotated.home) : Math.abs(rotated.x - rotated.home) < .001, rotated);
      await shot((base ? 'before' : 'after') + '-rotation');
    }
    for (const [width, height] of [[375,812],[667,375],[1366,768],[1920,1080],[3440,1440]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => LR.newVisit());
      await tap('bowl'); await advance(1.5);
      await shot('feeding-' + width + 'x' + height);
      await advance(4);
      await tap('bush'); await advance(2);
      await shot('peekaboo-' + width + 'x' + height);
      await advance(8);
      check(width + 'x' + height + ': food and peekaboo complete', (await state()).acts === 2, await state());
    }
    await page.reload();
    check('Reload keeps the existing sound preference', await page.evaluate(() => JSON.parse(localStorage.getItem(LR.PREF)).sound === false));
    check('No browser errors', errors.length === 0, errors);
    await context.close();
  } finally { await browser.close(); server.close(); fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2)); }
  console.log('PASS: ' + report.checks.length + ' review checks; ' + report.screenshots.length + ' screenshots.');
})().catch(e => { server.close(); console.error(e); process.exitCode = 1; });
function documentWidth(home) { return home * 2; }
