/* LR-G1: phone pre-check for the LRL-11 playtest. Real Chromium, real touch taps, no game file changed.
   Run:  node docs/playtests/lrl-11/phone-precheck.cjs [output-directory]
   Needs Playwright (the `playwright` package, or `playwright-core`) and a Chromium or Chrome binary
   (set CHROME_PATH, or it tries /usr/bin/google-chrome, then Playwright's own browser).
   It serves the repo from a throw-away local server and uses a fresh browser profile for every size, so it never
   reads or writes player storage and makes no network call. It reports findings. It fixes nothing.
   Output: report.json and one screenshot per place and size, named <width>x<height>-<place>.png. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const { execFileSync } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('playwright-core')); }

const ROOT = path.resolve(__dirname, '../../..');
const OUT = path.resolve(process.argv[2] || __dirname);
const MIN = 44;     // the smallest tap target, in CSS pixels, on both sides
const STEP = 2;     // sampling grid for the screen, in CSS pixels
const SIZES = [[390, 844, 'iPhone 12 upright'], [844, 390, 'iPhone 12 sideways'], [360, 780, 'small Android'], [1024, 594, 'tablet']];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.cjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };

fs.mkdirSync(OUT, { recursive: true });
const report = { script: 'docs/playtests/lrl-11/phone-precheck.cjs', head: null, browser: null, game: null, minTapTarget: MIN, sampleStepPx: STEP, sizes: [], findings: [], probes: [], notes: [] };
try { report.head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch (e) { report.head = null; }

const server = http.createServer((req, res) => {
  let name; try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (name.endsWith('/')) name += 'index.html';
  const file = path.resolve(ROOT, '.' + name);
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, bytes) => { if (err) { res.writeHead(404); return res.end(); } res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream'); res.end(bytes); });
});

/* ---- runs inside the page: the game's own tap zones, copied from games/little-ranch/game.js (onDown, release and the
   *Tap functions), laid out from LR.layout. They are checked against the game two ways: LR.ranchTarget on the ranch,
   and real taps at the middle of one zone in every place (see the probes in report.json). ---- */
function pageZones(args) {
  const { kind, step, vw, vh } = args;
  const L = LR.layout, st = LR.state, W = L.U ? Math.ceil(document.querySelector('canvas').getBoundingClientRect().width / LR.scale) : 0;
  const cv = document.querySelector('canvas').getBoundingClientRect(), H = Math.ceil(cv.height / LR.scale);
  const sx = cv.width / W, sy = cv.height / H; // CSS pixels per canvas pixel
  const R = L.R;
  const circle = (name, p, r) => ({ name, cx: p.x, cy: p.y, rx: r, ry: r, shape: 'c' });
  const ell = (name, p, rx, ry) => ({ name, cx: p.x, cy: p.y, rx, ry, shape: 'c' });
  const rect = (name, x0, y0, x1, y1) => ({ name, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rx: (x1 - x0) / 2, ry: (y1 - y0) / 2, shape: 'r' });
  const fn = (name, nameAtFn, cx, cy, rx, ry) => ({ name, cx, cy, rx, ry, shape: 'f', nameAt: nameAtFn });
  const signFace = q => ({ x: q.x, y: q.y - R * .45 });
  const babyC = () => ({ x: st.baby.x, y: L.home.y - L.size * .9 });
  const fC = () => ({ x: st.friend.x * W, y: L.home.y - L.fz * .75 });
  const groups = [];
  if (kind === 'ranch') {
    const g = [], s = st.sponge;
    if (!s.auto) g.push(circle('sponge', s, R * 1.1));
    g.push(circle('sign (paint shed)', signFace(L.sign), R * 1.25), circle('wsign (wagon)', signFace(L.wsign), R * 1.25), circle('ksign (snack kitchen)', signFace(L.ksign), R * 1.25), circle('tsign (dough)', signFace(L.tsign), R * 1.25), circle('dsign (barn door)', signFace(L.dsign), R * 1.25));
    g.push(circle('bowl', L.bowl, R * 1.2), circle('bush', { x: L.bush.x, y: L.bush.y - R * .4 }, R * 1.4));
    if (st.baby.act !== 'hide') g.push(circle('baby', babyC(), L.size * 1.2));
    if (st.friend) g.push(circle('friend', fC(), L.fz * 1.25));
    if (st.mode === 'play' && st.dusk < .3) { const sunY = L.sun.y + (L.ground + L.U * .1 - L.sun.y) * Math.min(1, Math.max(0, st.dusk * 1.6)); g.push(circle('sun', { x: L.sun.x, y: sunY }, Math.max(L.U * .16, R)), circle('cloud', L.cloud, L.cloud.r * 1.35)); }
    for (const q of st.puddles) g.push(circle('puddle' + q.i, L.puddles[q.i], L.puddles[q.i].r));
    g.push(circle('basket (hats)', { x: L.basket.x, y: L.basket.y - R * .15 }, R * 1.05));
    L.flowers.forEach((q, i) => g.push(circle('flower' + i, q, q.r * 1.15)));
    const b = LR.ballNow(); g.push(circle('ball', b, b.r * 1.2));
    groups.push(g);
  } else if (kind === 'shed') {
    const S2 = L.shed;
    groups.push([circle('barn (leave)', S2.barn, S2.barn.r * 1.15)]);
    groups.push(S2.pots.map((q, i) => circle('pot' + i, q, S2.potR * 1.15)));
    if (st.shed.doneAt === null) groups.push(['head', 'legs', 'tail', 'body'].map(part => fn('outline: ' + part, p => LR.partAt(p) === part ? part : null, S2.x, S2.y - S2.z, S2.z * 1.9, S2.z * 1.9)));
  } else if (kind === 'wagon') {
    const V = L.wagon, w = st.wagon;
    groups.push([circle('barn (leave)', V.barn, V.barn.r * 1.15)]);
    groups.push(V.wait.map((q, i) => circle('waiting baby ' + i, { x: q.x, y: q.y - V.z * .5 }, V.z * 1.1)).filter((z, i) => !w.aboard[i]));
    groups.push(V.cars.map((c, i) => rect('car ' + i, c.x - V.z * 1.15, c.y - V.z * .3 - V.z * 1.1, c.x + V.z * 1.15, c.y - V.z * .3 + V.z * 1.1)));
    groups.push([circle('puller', V.puller, V.z * 1.15)]);
  } else if (kind === 'kitchen') {
    const V = L.kitchen;
    groups.push([circle('barn (leave)', V.barn, V.barn.r * 1.15)]);
    groups.push(V.foods.map((q, i) => circle('food' + i, q, V.fr * 1.25)));
    groups.push([circle('baby', { x: V.baby.x, y: V.baby.y - V.z * 1.1 }, V.z * 1.1)]);
  } else if (kind === 'dough') {
    const V = L.dough;
    groups.push([circle('barn (leave)', V.barn, V.barn.r * 1.15)]);
    groups.push(V.dots.map((q, i) => circle('colour dot' + i, q, V.dr * 1.2)));
    groups.push([circle('cutter', V.cutter, V.cr * 1.4)]);
    groups.push([ell('dough lump', V.lump, V.lr * 1.6, V.lr * 1.6 / 1.3)]);
  } else if (kind === 'door') {
    const V = L.door;
    groups.push([circle('barn (leave)', V.barn, V.barn.r * 1.15)]);
    groups.push(LR.GADGETS.map(k => circle('gadget ' + k, V.g[k], V.gr * 1.25)));
    groups.push([rect('door', V.x - V.dw * .6, V.top - V.gr * .3, V.x + V.dw * .6, V.bot)]);
  } else if (kind === 'dusk') { // the bedtime routine: the toothbrush or cup, then the flowers and the friend
    const r = st.routine, g = [];
    if (r && r.step < 2) g.push(circle('toothbrush or cup', L.item, L.item.r * 1.1));
    else if (r && r.step < 3) { L.flowers.forEach((q, i) => g.push(ell('flower' + i, q, q.r * 1.15, q.r * 1.15 / .8))); if (st.friend) g.push(circle('friend', fC(), L.fz * 1.25)); }
    groups.push(g);
  } else if (kind === 'sleep') { // bedtime taps: the ball and the sleeping baby
    const g = [], b = LR.ballNow(); g.push(circle('ball', b, b.r * 1.2));
    if (st.baby.act === 'sleep') g.push(circle('sleeping baby', babyC(), L.size * 1.2));
    groups.push(g);
  }
  const zones = groups.flat();
  const kOf = (z, p) => z.shape === 'f' ? (z.nameAt(p) ? .5 : 2) : z.shape === 'r' ? (Math.abs(p.x - z.cx) <= z.rx && Math.abs(p.y - z.cy) <= z.ry ? .5 : 2) : Math.hypot((p.x - z.cx) / z.rx, (p.y - z.cy) / z.ry);
  const resolve = p => { for (const g of groups) { let best = null, bk = 1; for (const z of g) { const k = kOf(z, p); if (k <= bk) { bk = k; best = z; } } if (best) return best; } return null; };
  const cols = Math.ceil(vw / step), rows = Math.ceil(vh / step), grid = new Array(cols * rows), pairs = {}, idx = new Map(zones.map((z, i) => [z, i]));
  let mismatches = 0, compared = 0, firstMismatch = null;
  for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++) {
    const x = gx * step + step / 2, y = gy * step + step / 2, p = { x: (x - cv.left) / sx, y: (y - cv.top) / sy };
    const win = resolve(p); grid[gy * cols + gx] = win ? idx.get(win) : -1;
    const hit = []; for (const z of zones) if (kOf(z, p) <= 1) hit.push(idx.get(z));
    for (let a = 0; a < hit.length; a++) for (let b = a + 1; b < hit.length; b++) { const key = hit[a] + '|' + hit[b]; const w = pairs[key] || (pairs[key] = { n: 0, a: 0, b: 0 }); w.n++; if (win && idx.get(win) === hit[a]) w.a++; else if (win && idx.get(win) === hit[b]) w.b++; }
    if (kind === 'ranch') { compared++; const real = LR.ranchTarget(p), mine = win ? win.name : null; const norm = n => n && n.replace(/ \(.*\)$/, '').replace(/^(sign|wsign|ksign|tsign|dsign) .*/, '$1').replace(/^basket.*/, 'basket');
      if (norm(real) !== norm(mine)) { mismatches++; if (!firstMismatch) firstMismatch = { at: [x, y], game: real, script: mine }; } }
  }
  const meta = zones.map(z => ({ name: z.name, shape: z.shape, centre: [Math.round((cv.left + z.cx * sx) * 10) / 10, Math.round((cv.top + z.cy * sy) * 10) / 10], halfExtent: [Math.round(z.rx * sx * 10) / 10, Math.round(z.ry * sy * 10) / 10] }));
  return { cols, rows, step, grid, pairs, zones: meta, compared, mismatches, firstMismatch, canvasScale: [sx, sy], mode: st.mode, place: st.place };
}

/* ---- node side: findings from the sampled grid ---- */
function largestSquare(grid, cols, rows, id) { // side, in cells, of the biggest all-one-zone square
  let best = 0, prev = new Int32Array(cols + 1), cur = new Int32Array(cols + 1), area = 0, minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
  for (let y = 0; y < rows; y++) { cur.fill(0);
    for (let x = 0; x < cols; x++) { if (grid[y * cols + x] === id) { area++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; cur[x + 1] = 1 + Math.min(prev[x], prev[x + 1], cur[x]); if (cur[x + 1] > best) best = cur[x + 1]; } }
    [prev, cur] = [cur, prev]; }
  return { best, area, bbox: area ? [minX, minY, maxX, maxY] : null };
}
const r1 = n => Math.round(n * 10) / 10;

async function domReport(page, selectors) {
  return page.evaluate(sels => sels.map(sel => { const r1 = n => Math.round(n * 10) / 10; const e = document.querySelector(sel); if (!e || e.hidden || !e.offsetParent && getComputedStyle(e).position !== 'fixed') return { sel, shown: false };
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return { sel, shown: false };
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2, top = document.elementFromPoint(cx, cy);
    const lbl = e.querySelector('.lbl');
    return { sel, shown: true, x: r1(r.x), y: r1(r.y), w: r1(r.width), h: r1(r.height), right: r1(r.right), bottom: r1(r.bottom), centreHit: !!top && (top === e || e.contains(top)), labelCut: lbl ? lbl.scrollWidth > lbl.clientWidth + 1 : false }; }), selectors);
}

(async () => {
  await new Promise(res => server.listen(0, '127.0.0.1', res));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const launch = { args: ['--no-sandbox'] };
  const chrome = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => fs.existsSync(p));
  if (chrome) launch.executablePath = chrome;
  const browser = await chromium.launch(launch);
  report.browser = browser.version();
  const finding = (f) => { report.findings.push(f); };
  let failed = false;
  try {
    for (const [vw, vh, label] of SIZES) {
      const size = vw + 'x' + vh, sizeRep = { size, label, places: [] };
      const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
      const page = await ctx.newPage(), errs = []; page.on('pageerror', e => errs.push(String(e.message))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      await page.goto(origin + '/games/little-ranch/'); await page.waitForFunction(() => window.LR);
      report.game = await page.evaluate(() => LR.VERSION);
      const cdp = await ctx.newCDPSession(page);
      const tapCss = async p => { await page.touchscreen.tap(p.x, p.y); await page.waitForTimeout(90); };
      const canvasToCss = (pt) => page.evaluate(p => LR.toScreen(p), pt);
      const reset = (routine, friend) => page.evaluate(([ro, fr]) => { LR.setRoutine(ro); LR.setFriend(fr); LR.newVisit(); LR.advance(.6); }, [!!routine, !!friend]);
      const lockRect = async () => (await domReport(page, ['#lock']))[0];

      const visit = async (place, kind, note) => {
        await page.evaluate(() => LR.advance(.3));
        const z = await page.evaluate(pageZones, { kind, step: STEP, vw, vh });
        await page.screenshot({ path: path.join(OUT, size + '-' + place + '.png') });
        const lock = await lockRect(), placeRep = { place, shot: size + '-' + place + '.png', mode: z.mode, uiPlace: z.place, zones: [], overlaps: [], note: note || null };
        if (kind === 'ranch' && z.mismatches) { failed = true; report.probes.push({ size, place, check: 'the script\'s ranch zones agree with LR.ranchTarget', pass: false, detail: z.mismatches + ' of ' + z.compared + ' sampled points differ', first: z.firstMismatch }); }
        else if (kind === 'ranch') report.probes.push({ size, place, check: 'the script\'s ranch zones agree with LR.ranchTarget', pass: true, detail: z.compared + ' sampled points, 0 differ' });
        z.zones.forEach((zone, i) => {
          const sq = largestSquare(z.grid, z.cols, z.rows, i), side = sq.best * STEP, centreInside = zone.centre[0] >= 0 && zone.centre[0] <= vw && zone.centre[1] >= 0 && zone.centre[1] <= vh;
          const bb = sq.bbox ? [sq.bbox[0] * STEP, sq.bbox[1] * STEP, (sq.bbox[2] + 1) * STEP, (sq.bbox[3] + 1) * STEP] : null;
          const underLock = lock.shown && bb ? z.grid.reduce((n, g, c) => { if (g !== i) return n; const x = (c % z.cols) * STEP + STEP / 2, y = Math.floor(c / z.cols) * STEP + STEP / 2; return n + (x >= lock.x && x <= lock.right && y >= lock.y && y <= lock.bottom ? 1 : 0); }, 0) : 0;
          const zr = { name: zone.name, centre: zone.centre, nominalHalfExtent: zone.halfExtent, areaPx: sq.area * STEP * STEP, bboxPx: bb && bb.map(r1), largestSquarePx: side, underLockPx: underLock * STEP * STEP };
          placeRep.zones.push(zr);
          const where = size + ' / ' + place + ' / ' + zone.name;
          if (!sq.area) finding({ kind: 'cut-off', size, place, thing: zone.name, shot: placeRep.shot, text: 'no part of ' + zone.name + ' can be tapped on this screen (its middle is at ' + zone.centre.join(', ') + ' on a ' + vw + 'x' + vh + ' screen)' });
          else if (side < MIN) finding({ kind: 'small', size, place, thing: zone.name, shot: placeRep.shot, text: zone.name + ' has a tap area whose biggest square is ' + side + ' by ' + side + ' px, under ' + MIN + ' by ' + MIN, squarePx: side });
          if (sq.area && !centreInside) finding({ kind: 'cut-off', size, place, thing: zone.name, shot: placeRep.shot, text: zone.name + ' has its middle off the screen at ' + zone.centre.join(', ') });
          if (underLock && (underLock * STEP * STEP) / (sq.area * STEP * STEP) > .25) finding({ kind: 'overlap', size, place, thing: zone.name, shot: placeRep.shot, text: zone.name + ' lies ' + Math.round(100 * underLock / sq.area) + '% under the grown-ups lock button, so a tap there goes to the lock' });
        });
        const areaOf = zn => zn.shape === 'c' ? Math.PI * zn.halfExtent[0] * zn.halfExtent[1] : zn.shape === 'r' ? 4 * zn.halfExtent[0] * zn.halfExtent[1] : null; // the game's own outline test has no tidy area
        Object.keys(z.pairs).forEach(k => { const [a, b] = k.split('|').map(Number), A = z.zones[a], B = z.zones[b], pr = z.pairs[k], cell = STEP * STEP, area = pr.n * cell;
          const smaller = Math.min(areaOf(A) || 1e12, areaOf(B) || 1e12), winner = pr.a > pr.b ? A.name : pr.b > pr.a ? B.name : 'neither';
          const lossA = areaOf(A) ? pr.b * cell / areaOf(A) : 0, lossB = areaOf(B) ? pr.a * cell / areaOf(B) : 0; // the share of each zone that the other one takes
          placeRep.overlaps.push({ a: A.name, b: B.name, areaPx: area, shareOfSmaller: smaller < 1e12 ? Math.round(100 * area / smaller) / 100 : null, winner, shareLostByA: Math.round(100 * lossA) / 100, shareLostByB: Math.round(100 * lossB) / 100 });
          [[A, B, lossA], [B, A, lossB]].forEach(([lose, win, loss]) => { if (loss >= .5) finding({ kind: 'overlap', size, place, thing: lose.name + ' and ' + win.name, shot: placeRep.shot, text: Math.round(loss * 100) + '% of the tap area of ' + lose.name + ' is taken by ' + win.name + ' where the two overlap, so a tap on that part of ' + lose.name + ' does the ' + win.name + ' thing instead' }); }); });
        sizeRep.places.push(placeRep); return z;
      };
      const probe = (check, pass, detail) => { if (!pass) failed = true; report.probes.push({ size, check, pass: !!pass, detail }); };
      const tapZone = async (zone) => tapCss({ x: zone.centre[0], y: zone.centre[1] });

      // The ranch, in the day, with no friend.
      await reset(false, false); await visit('ranch', 'ranch');
      await reset(false, true); await visit('ranch-with-friend', 'ranch', 'a friend is visiting');

      // Every place, entered by a real tap on its sign.
      const signs = [['shed', 'sign', 'shed', 'sign (paint shed)'], ['wagon', 'wsign', 'wagon', 'wsign (wagon)'], ['kitchen', 'ksign', 'kitchen', 'ksign (snack kitchen)'], ['dough', 'tsign', 'dough', 'tsign (dough)'], ['door', 'dsign', 'door', 'dsign (barn door)']];
      for (const [place, key, kind] of signs) {
        await reset(false, false);
        const p = await page.evaluate(k => { const q = LR.layout[k], R = LR.layout.R; return LR.toScreen({ x: q.x, y: q.y - R * .45 }); }, key);
        await tapCss(p); await page.waitForTimeout(150);
        const now = await page.evaluate(() => LR.state.place);
        probe('a real tap on the ' + key + ' opens the ' + place, now === place, 'place is "' + now + '"');
        if (now !== place) continue;
        const z = await visit(place, kind);
        const find = n => z.zones.find(q => q.name === n), bar = find('barn (leave)');
        // one real tap at the middle of a zone in this place, checked against the game's state
        if (place === 'shed') { const pot = find('pot2'); await tapZone(pot); probe('shed: a real tap at the middle of pot 2 picks it', await page.evaluate(() => LR.state.shed.pot === 2), 'pot is ' + (await page.evaluate(() => LR.state.shed.pot))); }
        if (place === 'wagon') { const w0 = find('waiting baby 0'); await tapZone(w0); probe('wagon: a real tap at the middle of waiting baby 0 loads her', await page.evaluate(() => LR.state.wagon.aboard[0] === true), ''); }
        if (place === 'kitchen') { const f1 = find('food1'); await tapZone(f1); probe('kitchen: a real tap at the middle of food 1 sends it to the bowl', await page.evaluate(() => LR.state.kitchen.phase === 'fly' && LR.state.kitchen.food === 1), 'phase ' + (await page.evaluate(() => LR.state.kitchen.phase))); }
        if (place === 'dough') { const d0 = find('colour dot0'); await tapZone(d0); probe('dough: a real tap at the middle of colour dot 0 colours the dough', await page.evaluate(() => LR.state.dough.col === 0), ''); }
        if (place === 'door') { const g = find('gadget bell'); await tapZone(g); probe('door: a real tap at the middle of the bell rings it', await page.evaluate(() => LR.state.door.touched.bell === true), ''); }
        await tapZone(bar); await page.waitForTimeout(150);
        probe('a real tap at the middle of the barn picture leaves the ' + place, await page.evaluate(() => LR.state.place === 'ranch'), 'place is "' + (await page.evaluate(() => LR.state.place)) + '"');
      }

      // Bedtime: the routine, then the sleeping ranch.
      await reset(true, true);
      await page.evaluate(() => { LR.bedtime(); });
      let got = false; for (let i = 0; i < 40 && !got; i++) { await page.evaluate(() => LR.advance(1)); got = await page.evaluate(() => { const r = LR.state.routine; return !!(r && !r.doing && r.step < 3 && LR.state.baby.act !== 'yawn' && LR.state.baby.tx === null && LR.state.mode === 'dusk'); }); }
      if (got) await visit('bedtime-routine', 'dusk', 'the toothbrush or cup is waiting'); else report.notes.push(size + ': the bedtime routine never reached a step with something to tap within 40 game seconds, so it was not measured');
      await reset(false, false); await page.evaluate(() => { LR.bedtime(); });
      let slept = false; for (let i = 0; i < 30 && !slept; i++) { await page.evaluate(() => LR.advance(2)); slept = await page.evaluate(() => LR.state.mode === 'sleep' && LR.state.baby.act === 'sleep'); }
      if (slept) await visit('bedtime-asleep', 'sleep', 'the baby is asleep'); else report.notes.push(size + ': the baby was not asleep within 60 game seconds of bedtime, so the sleeping ranch was not measured');

      // The grown-ups panel: hold the lock for three seconds with a real finger, then look at the buttons.
      await reset(false, false);
      const lk = await lockRect();
      probe('the grown-ups lock is at least ' + MIN + ' by ' + MIN, lk.shown && lk.w >= MIN && lk.h >= MIN, lk.w + ' by ' + lk.h);
      if (lk.w < MIN || lk.h < MIN) finding({ kind: 'small', size, place: 'ranch', thing: 'grown-ups lock button', shot: size + '-ranch.png', text: 'the grown-ups lock button is ' + lk.w + ' by ' + lk.h + ' px' });
      if (lk.right > vw + .5 || lk.bottom > vh + .5 || lk.x < -.5 || lk.y < -.5) finding({ kind: 'cut-off', size, place: 'ranch', thing: 'grown-ups lock button', shot: size + '-ranch.png', text: 'the grown-ups lock button reaches past the screen edge' });
      const holdMs = await page.evaluate(() => LR.HOLD_MS), c = { x: lk.x + lk.w / 2, y: lk.y + lk.h / 2 };
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.x, y: c.y, id: 1 }] }); await page.waitForTimeout(holdMs + 500);
      const open = await page.evaluate(() => !document.getElementById('grown').hidden);
      probe('holding the lock with a real finger opens the grown-ups panel', open, 'hold of ' + holdMs + ' ms');
      if (open) {
        // Measure while the finger is still down, so the panel is looked at as the grown-up first sees it.
        await page.screenshot({ path: path.join(OUT, size + '-grown-ups-panel.png') });
        const ids = ['#gX', '#gNew', '#gSound', '#gHome', '#gClose'], d = await domReport(page, ids), shown = d.filter(x => x.shown);
        const card = await page.evaluate(() => { const k = document.querySelector('#grown .card'), r = k.getBoundingClientRect(), q = n => Math.round(n * 10) / 10; return { scrolls: k.scrollHeight > k.clientHeight + 1, top: q(r.top), bottom: q(r.bottom), left: q(r.left), right: q(r.right) }; });
        const placeRep = { place: 'grown-ups-panel', shot: size + '-grown-ups-panel.png', buttons: shown, card, zones: [], overlaps: [] }; sizeRep.places.push(placeRep);
        shown.forEach(b => {
          if (b.w < MIN || b.h < MIN) finding({ kind: 'small', size, place: 'grown-ups-panel', thing: b.sel, shot: placeRep.shot, text: b.sel + ' is ' + b.w + ' by ' + b.h + ' px' });
          if (b.x < -.5 || b.y < -.5 || b.right > vw + .5 || b.bottom > vh + .5) finding({ kind: 'cut-off', size, place: 'grown-ups-panel', thing: b.sel, shot: placeRep.shot, text: b.sel + ' reaches past the screen edge' });
          if (!b.centreHit) finding({ kind: 'overlap', size, place: 'grown-ups-panel', thing: b.sel, shot: placeRep.shot, text: 'something else sits over the middle of ' + b.sel });
          if (b.labelCut) finding({ kind: 'cut-off', size, place: 'grown-ups-panel', thing: b.sel, shot: placeRep.shot, text: 'the label on ' + b.sel + ' is cut off' });
        });
        for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) { const A = shown[i], B = shown[j], w = Math.min(A.right, B.right) - Math.max(A.x, B.x), h = Math.min(A.bottom, B.bottom) - Math.max(A.y, B.y);
          if (w > 1 && h > 1) finding({ kind: 'overlap', size, place: 'grown-ups-panel', thing: A.sel + ' and ' + B.sel, shot: placeRep.shot, text: A.sel + ' and ' + B.sel + ' overlap by ' + r1(w) + ' by ' + r1(h) + ' px' }); }
        if (card.scrolls) finding({ kind: 'cut-off', size, place: 'grown-ups-panel', thing: 'panel card', shot: placeRep.shot, text: 'the panel card is taller than the screen and has to be scrolled' });
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(400);
      if (open) {
        const stays = await page.evaluate(() => !document.getElementById('grown').hidden);
        // In Chromium's touch emulation a click lands on the panel's backdrop as the finger lifts, and the panel closes. Phones do not always send a click after a long press, so this needs a look on a real phone.
        if (!stays) finding({ kind: 'check-on-a-phone', size, place: 'grown-ups-panel', thing: 'the panel after the finger lifts', shot: size + '-grown-ups-panel.png', text: 'after a three-second hold the panel opens, but in Chromium\'s touch emulation it closes again about 1 ms after the finger lifts, because a click lands on the dimmed backdrop and the backdrop closes the panel. A real phone may send no click after a long press, so Playtester should hold the lock for three seconds, lift, and see whether the panel stays' });
        await page.evaluate(() => LR.openPanel()); await page.waitForTimeout(200);
        const x = (await domReport(page, ['#gX']))[0]; await tapCss({ x: x.x + x.w / 2, y: x.y + x.h / 2 }); await page.waitForTimeout(250);
        probe('a real tap on the panel\'s close button closes it', await page.evaluate(() => document.getElementById('grown').hidden), '');
      }
      // The page itself: no sideways scroll, canvas fills the screen.
      const pg = await page.evaluate(() => { const c = document.querySelector('canvas').getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, iw: innerWidth, ih: innerHeight, canvas: [Math.round(c.width), Math.round(c.height)] }; });
      sizeRep.page = pg; if (pg.sw > pg.iw + 1 || pg.sh > pg.ih + 1) finding({ kind: 'cut-off', size, place: 'ranch', thing: 'page', shot: size + '-ranch.png', text: 'the page is bigger than the screen (' + pg.sw + 'x' + pg.sh + ' on ' + pg.iw + 'x' + pg.ih + ')' });
      sizeRep.pageErrors = errs; if (errs.length) { failed = true; report.notes.push(size + ': page errors: ' + errs.join(' | ')); }
      report.sizes.push(sizeRep); await ctx.close();
    }
  } finally { await browser.close(); server.close(); }
  report.summary = { findings: report.findings.length, small: report.findings.filter(f => f.kind === 'small').length, overlap: report.findings.filter(f => f.kind === 'overlap').length, checkOnAPhone: report.findings.filter(f => f.kind === 'check-on-a-phone').length, cutOff: report.findings.filter(f => f.kind === 'cut-off').length, probesFailed: report.probes.filter(p => !p.pass).length, probes: report.probes.length };
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1) + '\n');
  console.log(JSON.stringify(report.summary));
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
