'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../../..');
const phase = process.argv[2];
if (phase !== 'before' && phase !== 'after') throw Error('Usage: node docs/playtests/nm-launch-polish/capture.cjs before|after');
const shots = path.join(__dirname, 'shots');
fs.mkdirSync(shots, { recursive: true });
const sizes = [
  [320, 640, 1], [375, 700, 1], [390, 700, 1], [390, 844, 1],
  [768, 800, 1], [820, 800, 1], [820, 1180, 2], [844, 390, 1],
  [1280, 800, 1], [1920, 900, 1]
];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };
const server = http.createServer((q, r) => {
  let p = decodeURIComponent(new URL(q.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root + path.sep)) { r.writeHead(403); return r.end(); }
  fs.readFile(file, (e, d) => {
    if (e) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    r.end(d);
  });
});
const label = (w, h, dpr) => w + 'x' + h + (dpr === 1 ? '' : '-dpr' + dpr);

(async () => {
  await new Promise(ok => server.listen(0, '127.0.0.1', ok));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, headless: true });
  const measured = [];
  for (const [w, h, dpr] of sizes) {
    const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.goto(origin + '/games/night-market/');
    await page.waitForFunction(() => document.querySelector('#stalls .count') && !document.querySelector('#stalls .count').hidden);
    const count = page.locator('#stalls .count').first();
    await count.scrollIntoViewIfNeeded();
    const px = await count.evaluate(el => getComputedStyle(el).fontSize);
    const name = phase + '-' + label(w, h, dpr);
    await page.screenshot({ path: path.join(shots, name + '.png') });
    await count.screenshot({ path: path.join(shots, name + '-count.png') });
    measured.push({ width: w, height: h, dpr, fontSize: px, text: await count.innerText() });
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.goto(origin + '/games/night-market/');
  await page.waitForFunction(() => window.NightLane);
  const placed = await page.evaluate(() => {
    __nightMarket.state.stalls[0].owned = 1;
    const NL = NightLane;
    for (let i = 0; i < 500 && !NL.walkers().some(P => P.x >= 8 && P.x <= NL.W - 24); i++) NL.step(1);
    return NL.walkers().length;
  });
  await page.locator('#lane').screenshot({ path: path.join(shots, phase + '-lane-walker.png') });
  const cleared = await page.evaluate(() => { NightLane.setReduce(true); return NightLane.walkers().length; });
  await page.locator('#lane').screenshot({ path: path.join(shots, phase + '-lane-reduced.png') });
  measured.push({ lane: '1280x800', walkersBeforeReduce: placed, walkersAfterReduce: cleared });
  await context.close();
  fs.writeFileSync(path.join(__dirname, 'measurements-' + phase + '.json'), JSON.stringify(measured, null, 2) + '\n');
  console.log(phase, JSON.stringify(measured));
  await browser.close();
  server.close();
})().catch(e => { console.error(e); process.exit(1); });
