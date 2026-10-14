// WB-C3: Wildbond on a phone held sideways, played by touch only, with a screenshot at each step.
// An emulated Pixel 7 in landscape (Android user agent, touch, device pixel ratio 2.625), so the game sees a phone.
// Taps are given in the game's own 384 by 216 view and mapped through the phone fit (fractional, centred).
//   node tools/wildbond-phone-run.cjs <web build folder> <output folder>
// The folder holds index.html/js/wasm/pck (play/wildbond, or a fresh pack in a scratch copy). Nothing is saved
// outside the browser profile, which is thrown away. The run is a record for eyes, not a pass/fail check:
// look at the screenshots (and errors.json, which must be []).
const fs = require('fs'), path = require('path'), http = require('http'), zlib = require('zlib');
let playwright;
try { playwright = require('playwright'); } catch (e) { playwright = require('/opt/node-tools/node_modules/playwright'); }
const { chromium, devices } = playwright;
const [root, out] = process.argv.slice(2);
if (!root || !out) { console.log('Use: node tools/wildbond-phone-run.cjs <web build folder> <output folder>'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.wasm': 'application/wasm', '.pck': 'application/octet-stream', '.png': 'image/png' };

// What a new player does, by touch. [what, ...]: tap x y | hold x y ms (a thumb on the pad) | wait ms | shot name
const STEPS = [
  ['wait', 20000], ['shot', '01-how-to-play'],
  ['tap', 190, 108], ['wait', 1500], ['shot', '02-arrival'],
  ['tap', 200, 185], ['wait', 2500], ['shot', '03-maren'],            // a tap on the bubble itself moves the talk on
  ['tap', 200, 60], ['wait', 1500], ['shot', '04-register'],
  ['tap', 270, 173], ['wait', 2500], ['shot', '05-signed'],           // "Sign the register"
  ['tap', 192, 100], ['tap', 192, 100], ['tap', 192, 100], ['tap', 192, 100], ['wait', 2000], ['shot', '06-follow-maren'],
  ['tap', 295, 62], ['wait', 6000], ['shot', '07-barn'],              // tap the barn door: Rowan walks there and in
  ['tap', 250, 90], ['wait', 1500],
  ['tap', 132, 62], ['wait', 5000], ['shot', '08-meet-button'],       // tap Cindercub: walk up, the Meet button shows
  ['tap', 344, 178], ['wait', 2000], ['shot', '09-partner-card'],
  ['tap', 230, 190], ['wait', 2000], ['shot', '10-chosen'],           // "Choose Cindercub"
  ...Array(7).fill(['tap', 192, 100]), ['wait', 1500], ['shot', '11-partner'],
  ['hold', 80, 198, 2500], ['wait', 1500], ['shot', '12-walked-with-pad'],   // thumb on the pad's down arrow
  ['tap', 182, 192], ['wait', 4000], ['shot', '13-out-of-the-barn'],
  ['tapUntil', 'battle', 192, 100, 20], ['wait', 1500], ['shot', '14-battle'],   // Wren's talk, until the battle opens
  ['tapUntil', 'menu', 192, 180, 6], ['shot', '15-battle-menu'],
  ['tap', 264, 178], ['wait', 1000], ['shot', '16-moves'],                      // Fight
  ['tap', 60, 178], ['wait', 2500], ['shot', '17-bite'],                        // Bite
  ['fight', 12], ['wait', 2000], ['shot', '18-after-battle'],                   // Fight, Bite, until the battle is over
  ['tapUntil', 'free', 192, 100, 10], ['wait', 1500], ['shot', '19-walking-again'],
  ['tapUntil', 'bag', 192, 100, 15], ['wait', 1000], ['shot', '20-bag-showing'],   // Maren's last words, until the bag shows
  ['tap', 366, 15], ['wait', 2000], ['shot', '20-field-book'],        // the bag, top right
  ['tap', 122, 23], ['wait', 1500], ['shot', '21-satchel'],
  ['tap', 80, 23], ['wait', 1500], ['shot', '22-team'],
  ['tap', 8, 100], ['wait', 1500], ['shot', '23-book-closed'],        // tap outside the book to close it
];

const files = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html'));
  fs.readFile(f, (e, d) => {
    if (e) { r.writeHead(404); r.end(); return; }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream',
      'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' });
    r.end(d);
  });
}).listen(0, async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined),
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ ...devices['Pixel 7 landscape'], serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`http://localhost:${files.address().port}/index.html`);
  const vp = page.viewportSize(), ua = await page.evaluate(() => navigator.userAgent);
  const sc = Math.min(vp.width / 384, vp.height / 216), ox = (vp.width - 384 * sc) / 2, oy = (vp.height - 216 * sc) / 2;
  const at = (x, y) => ({ x: ox + x * sc, y: oy + y * sc });
  const cdp = await context.newCDPSession(page);
  // One pixel of the screen, read from a tiny screenshot (a PNG's first pixel needs no filter: it is raw bytes).
  async function pixel(x, y) {
    const p = at(x, y), png = await page.screenshot({ clip: { x: p.x, y: p.y, width: 1, height: 1 } });
    let i = 8, idat = [];
    while (i < png.length) {
      const n = png.readUInt32BE(i), type = png.toString('ascii', i + 4, i + 8);
      if (type === 'IDAT') idat.push(png.subarray(i + 8, i + 8 + n));
      i += 12 + n;
    }
    const raw = zlib.inflateSync(Buffer.concat(idat));
    return [raw[1], raw[2], raw[3]];
  }
  // What's on screen, by colours the game always draws there: the battle's sky, its menu box, the world's bag.
  const SEEN = {
    battle: async () => { const [r, g, b] = await pixel(192, 30); return b > 190 && b > r + 30; },
    menu: async () => { const [r, g, b] = await pixel(247, 172); return r < 60 && g < 60 && b < 70; },   // the dark "Fight" button
    free: async () => !(await SEEN.battle()),
    bag: async () => { const [r, g, b] = await pixel(362, 18); return r > 140 && r < 185 && g > 95 && g < 135 && b > 35 && b < 80; },
  };
  async function tap(x, y) { const p = at(x, y); await page.touchscreen.tap(p.x, p.y); await page.waitForTimeout(1200); }
  for (const [what, ...a] of STEPS) {
    if (what === 'wait') await page.waitForTimeout(a[0]);
    else if (what === 'shot') { await page.screenshot({ path: path.join(out, a[0] + '.png') }); console.log('shot', a[0]); }
    else if (what === 'tap') await tap(a[0], a[1]);
    else if (what === 'tapUntil') {
      let seen = await SEEN[a[0]]();
      for (let i = 0; i < a[3] && !seen; i++) { await tap(a[1], a[2]); seen = await SEEN[a[0]](); }
      console.log('until', a[0], seen ? 'seen' : 'NOT SEEN');
      if (!seen) errors.push('never saw: ' + a[0]);
    } else if (what === 'fight') {
      for (let i = 0; i < a[0] && await SEEN.battle(); i++) {
        if (await SEEN.menu()) { await tap(264, 178); await tap(60, 178); } else await tap(100, 195);
      }
      console.log('battle', (await SEEN.battle()) ? 'STILL ON' : 'over');
    }
    else if (what === 'hold') {
      const p = at(a[0], a[1]);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
      await page.waitForTimeout(a[2]);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
  }
  fs.writeFileSync(path.join(out, 'run.json'), JSON.stringify({ device: 'Pixel 7 landscape', userAgent: ua, viewport: vp, scale: sc, errors }, null, 2));
  console.log(errors.length ? `${errors.length} browser errors (see run.json)` : 'no browser errors');
  await browser.close();
  files.close();
});
