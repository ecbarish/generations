// Review the shipped WASM engine and release PCK through real browser inputs.
// FS exposure and fixture preloading are Playwright response overrides only;
// neither is written into the game shell, engine, scripts or exported pack.
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert/strict');
const { isDeepStrictEqual } = require('util');
const { chromium } = require('playwright');
const { reviewOpening } = require('./wildbond-opening-browser.cjs');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'preview-review');
fs.mkdirSync(path.join(out, 'screens'), { recursive: true });
const report = { completed: false, suite: process.env.WB_OPENING_ONLY === '1' ? 'opening-only' : 'full', checks: [], consoles: [], screenshots: [], doors: [], pad: [] };
const check = (ok, label) => { assert(ok, label); report.checks.push(label); console.log('PASS ' + label); };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  // Local-only aliases model the repository rename under one browser origin.
  const requestPath = decodeURIComponent(url.pathname).replace(/^\/(?:idle-arcade|generations)(?=\/play\/wildbond\/)/, '');
  let file = path.join(root, requestPath);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.json': 'application/json' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

async function open(browser, size, fixture, before = false, options = {}) {
  const phone = options.phone ?? size.width <= 960;
  const context = await browser.newContext({ viewport: size, hasTouch: phone, isMobile: phone });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => {
    const line = msg.text();
    report.consoles.push({ type: msg.type(), line });
    if (/SCRIPT ERROR|Parse Error|Failed to load script|Aborted\(/.test(line)) errors.push(line);
  });
  await page.route('**/play/wildbond/index.js', route => {
    const source = fs.readFileSync(path.join(root, 'play/wildbond/index.js'), 'utf8');
    assert(source.includes('var FS={'), 'Engine filesystem declaration found');
    route.fulfill({ contentType: 'text/javascript', body: source.replace('var FS={', 'var FS=globalThis.__reviewFS={') });
  });
  await page.route('**/play/wildbond/', route => {
    let source = fs.readFileSync(path.join(root, 'play/wildbond/index.html'), 'utf8');
    let hook = 'window.__reviewEngine = engine;';
    if (fixture) hook += `engine.preloadFile(new TextEncoder().encode(${JSON.stringify(JSON.stringify(fixture))}), '/userfs/godot/app_userdata/Wildbond (Godot trial)/journey.json');`;
    if (options.settings) hook += `engine.preloadFile(new TextEncoder().encode(${JSON.stringify(options.settings)}), '/userfs/godot/app_userdata/Wildbond (Godot trial)/settings.cfg');`;
    source = source.replace('const engine = new Engine(GODOT_CONFIG);', 'const engine = new Engine(GODOT_CONFIG);' + hook);
    assert(source.includes('__reviewEngine'), 'Review override attached to exported shell');
    route.fulfill({ contentType: 'text/html', body: source });
  });
  if (before) await page.route('**/play/wildbond/index.pck', route => route.fulfill({ path: process.env.BEFORE_PACK, contentType: 'application/octet-stream' }));
  const prefix = options.pathPrefix || '';
  assert(['', '/idle-arcade', '/generations'].includes(prefix), 'Only documented local review aliases are permitted');
  await page.goto(`http://127.0.0.1:${server.address().port}${prefix}/play/wildbond/`);
  await page.waitForFunction(() => !document.querySelector('#status'), null, { timeout: 90000 });
  await page.waitForTimeout(1200);
  check(errors.length === 0, `${before ? 'previous' : 'refreshed'} web pack starts at ${size.width}×${size.height}`);
  return { context, page, errors };
}

async function shot(page, label) {
  const file = label + '.png';
  await page.screenshot({ path: path.join(out, 'screens', file) });
  report.screenshots.push(file);
}
async function press(page, key, times = 1, delay = 350) {
  for (let i = 0; i < times; i++) { await page.keyboard.press(key); await page.waitForTimeout(delay); }
}
async function step(page, direction, count = 1) {
  for (let i = 0; i < count; i++) {
    await page.keyboard.down(direction);
    await page.waitForTimeout(120);
    await page.keyboard.up(direction);
    await page.waitForTimeout(330);
  }
}
async function goToBench(page) {
  await step(page, 'ArrowUp', 2);
  await step(page, 'ArrowLeft', 9);
  await persisted(page, d => d.map === 'barn' && d.x === 2 && d.y === 9, 'walk to Maren’s workbench through real keyboard inputs');
}
async function readSave(page) {
  return page.evaluate(() => {
    const fs = globalThis.__reviewFS;
    function find(dir) {
      for (const name of fs.readdir(dir)) {
        if (name === '.' || name === '..') continue;
        const p = dir + '/' + name;
        if (fs.isDir(fs.stat(p).mode)) { const result = find(p); if (result) return result; }
        else if (name === 'journey.json') return JSON.parse(fs.readFile(p, { encoding: 'utf8' }));
      }
      return null;
    }
    return find('/userfs');
  });
}
async function persisted(page, test, label) {
  let save;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(500);
    save = await readSave(page);
    if (save && test(save)) { check(true, label); return save; }
  }
  await shot(page, 'failed-persistence');
  throw new Error(label + ': last save ' + JSON.stringify(save));
}
async function persistedInBrowser(page, moves) {
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(500);
    const stored = await page.evaluate(() => new Promise((resolve, reject) => {
      const request = indexedDB.open('/userfs');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('FILE_DATA', 'readonly');
        const file = transaction.objectStore('FILE_DATA').get('/userfs/godot/app_userdata/Wildbond (Godot trial)/journey.json');
        file.onerror = () => { db.close(); reject(file.error); };
        file.onsuccess = () => {
          const contents = file.result?.contents;
          db.close();
          resolve(contents ? JSON.parse(new TextDecoder().decode(contents)) : null);
        };
      };
    }));
    if (stored && JSON.stringify(stored.team[0].moves) === JSON.stringify(moves)) {
      check(true, 'Godot persisted the chosen moves to browser storage before reload');
      return;
    }
  }
  throw new Error('Chosen moves did not reach browser storage within fifteen seconds');
}
async function continueJourney(page) {
  await press(page, 'Enter');
  await page.waitForTimeout(600);
  await press(page, 'Enter'); // Welcome back.
  await page.waitForTimeout(700);
}

// No game-method or PCK overrides: only a synthetic old-format save establishes
// the initial location. Each exit and re-entry continues the prior real arrival.
// The 24x14 maps clamp the camera to y=108..116 on the 384x216 canvas.
function screenPoint(size, x, y) {
  const scale = Math.max(1, Math.floor(Math.min(size.width / 384, size.height / 216)));
  return { x: (size.width - 384 * scale) / 2 + x * scale, y: (size.height - 216 * scale) / 2 + y * scale };
}
function tilePoint(size, tile, player) {
  const cameraY = Math.max(108, Math.min(116, player.y * 16 + 8));
  return screenPoint(size, tile[0] * 16 + 8, tile[1] * 16 + 8 - (cameraY - 108));
}
async function pointInput(page, method, point) {
  if (method === 'touch') await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}
const settingsText = buttons => `[settings]\nmusic=3\nambience=4\neffects=5\ntext=0\npace=1\nbuttons=${buttons}\n`;
async function readSettings(page) {
  return page.evaluate(() => globalThis.__reviewFS.readFile('/userfs/godot/app_userdata/Wildbond (Godot trial)/settings.cfg', { encoding: 'utf8' }));
}
async function browserStored(page, test, label) {
  let stored;
  for (let i = 0; i < 30; i++) {
    stored = await page.evaluate(() => new Promise((resolve, reject) => {
      const request = indexedDB.open('/userfs');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('FILE_DATA', 'readonly');
        const entry = tx.objectStore('FILE_DATA').get('/userfs/godot/app_userdata/Wildbond (Godot trial)/journey.json');
        entry.onerror = () => { db.close(); reject(entry.error); };
        entry.onsuccess = () => { const bytes = entry.result?.contents; db.close(); resolve(bytes ? JSON.parse(new TextDecoder().decode(bytes)) : null); };
      };
    }));
    if (stored && test(stored)) { check(true, label); return stored; }
    await page.waitForTimeout(500);
  }
  throw new Error(label + ': last IndexedDB save ' + JSON.stringify(stored));
}
async function reloadWithoutFixtures(page) {
  await page.unroute('**/play/wildbond/');
  await page.reload();
  await page.waitForFunction(() => !document.querySelector('#status'), null, { timeout: 90000 });
  await page.waitForTimeout(900);
  await continueJourney(page);
}
async function reviewDoors(browser, legacy) {
  const buildings = { inn: [4, 4], shop: [7, 10], pip_home: [13, 4], gran_home: [2, 10], barn: [18, 4] };
  const sizes = [{ width: 1920, height: 1080 }, { width: 812, height: 375 }, { width: 844, height: 390 }, { width: 960, height: 540 }];
  for (const size of sizes) {
    const phone = size.width <= 960;
    const method = phone ? 'touch' : 'mouse';
    const tag = `${size.width}x${size.height}`;
    for (const [building, door] of Object.entries(buildings)) {
      const fixture = structuredClone(legacy);
      Object.assign(fixture, { map: 'larkhaven', x: door[0], y: door[1] + 2 });
      fixture.story['arr:larkhaven'] = true;
      const current = await open(browser, size, fixture, false, { phone, settings: settingsText(0) });
      const { page } = current;
      try {
        await continueJourney(page);
        let previous = await persisted(page, d => d.saved !== fixture.saved && d.map === 'larkhaven' && d.x === fixture.x && d.y === fixture.y, `${tag}/${building}: legacy starting position loads`);
        if (phone) {
          // A genuine first touch activates Auto without a direction or world tap.
          const center = screenPoint(size, 80, 184);
          await page.touchscreen.tap(center.x, center.y);
          await page.waitForTimeout(400);
        }
        await shot(page, `doors-${tag}-${building}-before`);
        for (const phase of ['entry', 'exit', 'reentry']) {
          const exiting = phase === 'exit';
          const goal = exiting ? [11, building === 'barn' ? 12 : 11] : door;
          const expected = exiting ? { map: 'larkhaven', x: door[0], y: door[1] + 1 } : { map: building, x: 11, y: building === 'barn' ? 11 : 10 };
          const point = tilePoint(size, goal, previous);
          const before = { map: previous.map, x: previous.x, y: previous.y, partner: previous.partner };
          await pointInput(page, method, point);
          const arrived = await persisted(page, d => d.map === expected.map && d.x === expected.x && d.y === expected.y, `${tag}/${building}/${method}: ${phase} reaches the exact landing`);
          check(arrived.partner === legacy.partner && arrived.team[0].sp === legacy.team[0].sp && arrived.team[0].lvl === 30 && arrived.bag.coins === 321 && arrived.bag.lures === 17, `${tag}/${building}/${phase}: partner, creature and possessions survive`);
          report.doors.push({ size, building, method, phase, before, goal, screenPoint: point, after: { map: arrived.map, x: arrived.x, y: arrived.y, partner: arrived.partner }, phoneMode: 'auto' });
          await shot(page, `doors-${tag}-${building}-${phase}`);
          previous = arrived;
        }
        const landing = { x: 11, y: building === 'barn' ? 11 : 10 };
        const beforeReload = await browserStored(page, d => d.map === building && d.x === landing.x && d.y === landing.y && d.partner === legacy.partner, `${tag}/${building}: real browser storage has the exact entered-room landing`);
        await reloadWithoutFixtures(page);
        const loaded = await persisted(page, d => d.saved !== beforeReload.saved && d.map === building && d.x === landing.x && d.y === landing.y && d.partner === legacy.partner, `${tag}/${building}: fixture-free reload loads and newly saves the exact interior landing and partner`);
        check(loaded.bag.coins === 321 && loaded.bag.lures === 17 && loaded.team[0].sp === legacy.team[0].sp && loaded.team[0].lvl === 30, `${tag}/${building}: reload preserves possessions and creature`);
        check(await readSettings(page) === settingsText(0), `${tag}/${building}: existing phone and sound settings survive`);
        check(current.errors.length === 0, `${tag}/${building}: no browser or game-script errors`);
      } finally { await current.context.close(); }
    }
    if (phone) await reviewPad(browser, size, legacy);
  }
  check(report.doors.length === 60, 'all five buildings complete entry, exit and re-entry at all four view sizes');
}
async function reviewPad(browser, size, legacy) {
  const tag = `${size.width}x${size.height}`;
  const fixture = structuredClone(legacy);
  Object.assign(fixture, { map: 'larkhaven', x: 10, y: 8 });
  fixture.story['arr:larkhaven'] = true;
  const current = await open(browser, size, fixture, false, { phone: true, settings: settingsText(0) });
  const { page } = current;
  try {
    await continueJourney(page);
    let previous = await persisted(page, d => d.saved !== fixture.saved && d.map === 'larkhaven' && d.x === 10 && d.y === 8, `${tag}: pad fixture loads`);
    const center = screenPoint(size, 80, 184);
    await page.touchscreen.tap(center.x, center.y);
    const session = await page.context().newCDPSession(page);
    for (const [name, dx, dy] of [['right', 1, 0], ['down', 0, 1], ['left', -1, 0], ['up', 0, -1]]) {
      const point = screenPoint(size, 80 + dx * 12, 184 + dy * 12);
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y }] });
      await page.waitForTimeout(120);
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const expected = { x: previous.x + dx, y: previous.y + dy };
      const arrived = await persisted(page, d => d.map === 'larkhaven' && d.x === expected.x && d.y === expected.y, `${tag}: visible Auto pad moves ${name}`);
      await page.waitForTimeout(5500);
      const released = await readSave(page);
      check(released.x === expected.x && released.y === expected.y, `${tag}: releasing ${name} stops movement and leaks no world tap`);
      report.pad.push({ size, name, before: { x: previous.x, y: previous.y }, after: expected, releaseVerified: true, phoneMode: 'auto' });
      await shot(page, `pad-${tag}-${name}`);
      previous = arrived;
    }
    await session.detach();
    check(current.errors.length === 0, `${tag}: phone pad has no browser or script errors`);
  } finally { await current.context.close(); }
}

async function reviewRenameContinuity(browser, fixture) {
  assert(process.env.BEFORE_PACK && fs.existsSync(process.env.BEFORE_PACK), 'Actual previous pack required for rename continuity');
  const current = await open(browser, { width: 812, height: 375 }, fixture, true, { phone: true, settings: settingsText(0), pathPrefix: '/idle-arcade' });
  const { page } = current;
  let canonicalPack = null;
  const canonicalBodyChecks = [];
  try {
    const previousUrl = page.url();
    check(new URL(previousUrl).pathname === '/idle-arcade/play/wildbond/', 'Rename review starts at the simulated old repository path');
    await continueJourney(page);
    await persisted(page, d => d.saved !== fixture.saved && d.map === 'barn' && d.x === 11 && d.y === 11, 'Previous shipped pack loads the once-preloaded journey at the old path');
    // A real input change ensures this is old-runtime persistence, not a static fixture comparison.
    await step(page, 'ArrowUp');
    const changed = await persisted(page, d => d.map === 'barn' && d.x === 11 && d.y === 10, 'Real keyboard movement in previous pack changes the old-path journey');
    const stored = await browserStored(page, d => d.map === 'barn' && d.x === 11 && d.y === 10 && d.saved === changed.saved, 'Old-path changed journey is persisted to real origin IndexedDB');
    const oldSettings = await readSettings(page);
    await shot(page, 'rename-old-path-persisted');
    // Observe all loaded pack bytes after removing every preload and old-pack substitution.
    await page.unroute('**/play/wildbond/');
    await page.unroute('**/play/wildbond/index.pck');
    page.on('response', response => {
      if (new URL(response.url()).pathname !== '/generations/play/wildbond/index.pck') return;
      canonicalBodyChecks.push((async () => {
        assert.equal(response.status(), 200);
        const body = await response.body();
        const crypto = require('crypto');
        const actual = crypto.createHash('sha256').update(body).digest('hex');
        const expected = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'play/wildbond/index.pck'))).digest('hex');
        assert.equal(actual, expected, 'Canonical-path browser loads the exact new committed pack');
        canonicalPack = { sha256: actual, bytes: body.length, url: response.url() };
      })().catch(error => current.errors.push('Rename pack verification: ' + error.message)));
    });
    const canonicalUrl = `http://127.0.0.1:${server.address().port}/generations/play/wildbond/`;
    check(new URL(previousUrl).origin === new URL(canonicalUrl).origin, 'Rename scenario retains the same actual browser origin');
    await page.goto(canonicalUrl);
    await page.waitForFunction(() => !document.querySelector('#status'), null, { timeout: 90000 });
    await Promise.all(canonicalBodyChecks);
    check(canonicalPack !== null, 'Observed new pack response at the simulated canonical path');
    await page.waitForTimeout(900);
    await continueJourney(page);
    function possessionsPreserved(save) {
      return save.partner === stored.partner && isDeepStrictEqual(save.team, stored.team)
        && isDeepStrictEqual(save.ranch, stored.ranch) && isDeepStrictEqual(save.bag, stored.bag)
        && isDeepStrictEqual(save.look, stored.look) && isDeepStrictEqual(save.badges, stored.badges)
        && Object.entries(stored.story).every(([key, value]) => isDeepStrictEqual(save.story[key], value));
    }
    // Existing authored interior reload behavior uses the doorway landing, not the old tile.
    const loaded = await persisted(page, d => d.saved !== stored.saved && d.map === 'barn' && d.x === 11 && d.y === 11 && possessionsPreserved(d), 'Canonical path loads the changed old-path IndexedDB journey without a fixture and preserves partner, team, ranch, possessions and progression');
    check(await readSettings(page) === oldSettings, 'Phone and sound settings survive same-origin repository path rename');
    await browserStored(page, d => d.saved === loaded.saved && possessionsPreserved(d), 'Canonical path persists the retained journey back to the same IndexedDB');
    await shot(page, 'rename-canonical-path-loaded');
    check(current.errors.length === 0, 'Same-origin path continuity has no browser/game-script errors');
    report.renameContinuity = { passed: true, scope: 'simulated-local-same-origin-path-rename', oldPath: '/idle-arcade/play/wildbond/', canonicalPath: '/generations/play/wildbond/', sameOrigin: true, priorPack: true, priorPackSha256: require('crypto').createHash('sha256').update(fs.readFileSync(process.env.BEFORE_PACK)).digest('hex'), realInputChange: true, indexedDB: true, fixtureFreeNavigation: true, settingsPreserved: true, newPack: canonicalPack, oldPosition: { x: stored.x, y: stored.y }, canonicalPosition: { x: loaded.x, y: loaded.y }, screenshots: ['rename-old-path-persisted.png', 'rename-canonical-path-loaded.png'] };
  } finally { await current.context.close(); }
}

async function reviewCurrentSave(browser) {
  const fixture = JSON.parse(fs.readFileSync(path.join(root, 'wildbond-godot/tests/fixtures/wb-c2-pre-change.json'), 'utf8'));
  const current = await open(browser, { width: 812, height: 375 }, fixture, false, { phone: true, settings: settingsText(0) });
  function preserved(save) {
    return save.partner === fixture.partner && save.map === fixture.map && save.x === fixture.x && save.y === fixture.y
      && save.look.name === fixture.look.name && save.look.heritage === fixture.look.heritage
      && JSON.stringify(save.badges) === JSON.stringify(fixture.badges)
      && isDeepStrictEqual(save.team, fixture.team) && isDeepStrictEqual(save.ranch, fixture.ranch)
      && Object.entries(fixture.bag).every(([key, value]) => JSON.stringify(save.bag[key]) === JSON.stringify(value))
      && Object.entries(fixture.story).every(([key, value]) => JSON.stringify(save.story[key]) === JSON.stringify(value));
  }
  try {
    await continueJourney(current.page);
    const loaded = await persisted(current.page, d => d.saved !== fixture.saved && preserved(d), 'WB-C2 frozen pre-change journey preserves partner, team, inventory, heritage, badges, story and location');
    await browserStored(current.page, preserved, 'WB-C2 frozen journey reaches real browser IndexedDB');
    await shot(current.page, 'wb-c2-current-save-before-reload');
    await reloadWithoutFixtures(current.page);
    await persisted(current.page, d => d.saved !== loaded.saved && preserved(d), 'WB-C2 frozen journey survives fixture-free browser reload');
    check(await readSettings(current.page) === settingsText(0), 'WB-C2 frozen journey preserves existing phone and sound settings');
    await shot(current.page, 'wb-c2-current-save-after-reload');
    check(current.errors.length === 0, 'WB-C2 frozen journey has no browser/game-script errors');
    report.currentSave = { passed: true, source: 'wildbond-godot/tests/fixtures/wb-c2-pre-change.json', fixtureFreeReload: true, indexedDB: true, partner: fixture.partner };
  } finally { await current.context.close(); }
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    for (const [size, method] of [[{ width: 812, height: 375 }, 'touch'], [{ width: 1920, height: 1080 }, 'keyboard']]) {
      await reviewOpening(browser, { open, screenPoint, check, report, out }, size, method);
    }
    await reviewCurrentSave(browser);
    if (process.env.WB_OPENING_ONLY === '1') { report.completed = true; return; }
    const fixtures = Object.fromEntries(['barn', 'thornwood', 'champion'].map(name => [name, JSON.parse(fs.readFileSync(path.join(out, 'fixtures', name + '.json'), 'utf8'))]));
    check(!fixtures.barn.team[0].moves && !fixtures.barn.spire && !fixtures.barn.rematches, 'fixtures were written in the pre-WD3/pre-Spire format');
    await reviewRenameContinuity(browser, fixtures.barn);
    for (const size of [{ width: 667, height: 375 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 3440, height: 1440 }]) {
      const tag = `${size.width}x${size.height}`;
      if (size.width === 667 || size.width === 1920) {
        const old = await open(browser, size, fixtures.barn, true);
        await continueJourney(old.page);
        await persisted(old.page, d => d.saved !== fixtures.barn.saved && d.map === 'barn', 'the previous web pack loads the old-format review journey at ' + tag);
        await goToBench(old.page);
        await press(old.page, 'e');
        await shot(old.page, `before-workbench-${tag}`);
        await old.context.close();
      }
      const current = await open(browser, size, fixtures.barn);
      const { page } = current;
      await shot(page, `continue-${tag}`);
      await continueJourney(page);
      const loaded = await persisted(page, d => d.saved !== fixtures.barn.saved, 'legacy barn journey is loaded and saved by the new web game at ' + tag);
      check(loaded.map === 'barn' && loaded.x === 11 && loaded.y === 11 && loaded.bag.coins === 321 && loaded.bag.lures === 17 && loaded.team[0].sp === fixtures.barn.team[0].sp && loaded.team[0].lvl === 30, 'legacy barn entry, satchel and creature survive at ' + tag);
      await goToBench(page);
      if (size.width === 667) {
        await page.touchscreen.tap((size.width - 384) / 2 + 344, (size.height - 216) / 2 + 178);
        await page.waitForTimeout(400);
      } else await press(page, 'e');
      await shot(page, `workbench-${tag}`);
      await press(page, 'ArrowRight'); // Cards start on Done; wrap to Practice.
      await press(page, 'Enter');
      await shot(page, `practice-${tag}`);
      await press(page, 'ArrowDown', 3, 120);
      await press(page, 'e', 2); // Select Pack Hunt, then rest the first old move.
      await shot(page, `practice-chosen-${tag}`);
      await press(page, 'Escape');
      await press(page, 'Escape');
      const selected = await persisted(page, d => (d.team[0].moves || []).length === 4 && d.team[0].moves.includes('packHunt'), 'a fourth move chosen through web practice saves at ' + tag);
      check(selected.bag.coins === 321 && selected.team[0].lvl === 30, 'practice preserves money and level at ' + tag);
      await persistedInBrowser(page, selected.team[0].moves);
      // Reload without fixture injection: this checks browser persistence, not a repeated preload.
      await page.unroute('**/play/wildbond/');
      await page.reload();
      await page.waitForFunction(() => !document.querySelector('#status'), null, { timeout: 90000 });
      await page.waitForTimeout(900);
      await continueJourney(page);
      // _load_game uses _go; _switch always places barn arrivals at BARN_EXIT
      // (11,12) + UP, including reloads. Bench coordinates are not retained.
      const reloaded = await persisted(page, d => d.saved !== selected.saved && d.map === 'barn' && d.x === 11 && d.y === 11, 'chosen-move journey is loaded and newly saved at the authored barn landing after fixture-free reload at ' + tag);
      check(JSON.stringify(reloaded.team[0].moves) === JSON.stringify(selected.team[0].moves), 'chosen moves survive a browser reload at ' + tag);
      check(current.errors.length === 0, 'no script or page errors in the workbench/reload flow at ' + tag);
      await current.context.close();
    }
    const thorn = await open(browser, { width: 1366, height: 768 }, fixtures.thornwood);
    await continueJourney(thorn.page);
    const t = await persisted(thorn.page, d => d.saved !== fixtures.thornwood.saved, 'pre-expansion Thornwood save loads and autosaves in the web build');
    check(t.map === 'thornwood' && t.x === 13 && t.y === 14 && t.bag.lures === 17, 'old Thornwood map ID, coordinates and lures are preserved');
    await shot(thorn.page, 'thornwood-settlement');
    await thorn.page.keyboard.down('ArrowDown');
    await thorn.page.waitForTimeout(650);
    await thorn.page.keyboard.up('ArrowDown');
    await persisted(thorn.page, d => d.map === 'thornwood_route', 'walking south from the old settlement reaches the new Thornwood trail');
    await shot(thorn.page, 'thornwood-trail');
    check(thorn.errors.length === 0, 'Thornwood transitions without script/page errors');
    await thorn.context.close();

    const champion = await open(browser, { width: 1920, height: 1080 }, fixtures.champion);
    await continueJourney(champion.page);
    await persisted(champion.page, d => d.spire && d.spire.best === 0 && !d.spire.active, 'legacy Champion receives safe empty Spire defaults');
    await champion.page.keyboard.down('ArrowLeft');
    await champion.page.waitForTimeout(330);
    await champion.page.keyboard.up('ArrowLeft');
    await persisted(champion.page, d => d.map === 'spire', 'legacy Champion can walk into the new Lighthouse Spire');
    await shot(champion.page, 'spire-arrival');
    await step(champion.page, 'ArrowLeft', 11);
    await persisted(champion.page, d => d.map === 'spire' && d.x === 6 && d.y === 14, 'walk beside Orla through real keyboard inputs');
    await press(champion.page, 'e', 2);
    await champion.page.waitForTimeout(2500);
    await shot(champion.page, 'spire-battle');
    check(champion.errors.length === 0, 'Spire encounter has no script/page errors');
    await champion.context.close();

    const opening = await open(browser, { width: 667, height: 375 });
    const start = Date.now();
    await shot(opening.page, 'new-journey-controls');
    await press(opening.page, 'Enter', 3);
    await opening.page.waitForTimeout(6000);
    await press(opening.page, 'Enter', 4);
    await shot(opening.page, 'new-journey-register');
    await press(opening.page, 'Enter', 10, 200);
    await press(opening.page, 'Enter', 8);
    await opening.page.keyboard.down('ArrowUp');
    await opening.page.waitForTimeout(600);
    await opening.page.keyboard.up('ArrowUp');
    await opening.page.waitForTimeout(Math.max(0, 60000 - (Date.now() - start)));
    await shot(opening.page, 'new-journey-one-minute');
    await opening.page.setViewportSize({ width: 375, height: 812 });
    await opening.page.waitForTimeout(700);
    await shot(opening.page, 'phone-portrait');
    await opening.page.setViewportSize({ width: 667, height: 375 });
    await opening.page.waitForTimeout(700);
    await shot(opening.page, 'phone-rotated-back');
    check(opening.errors.length === 0, 'new journey responds for a minute and survives portrait/landscape rotation without script/page errors');
    await opening.context.close();
    await reviewDoors(browser, fixtures.barn);
    report.completed = true;
    console.log('WEB REVIEW PASSED: ' + report.checks.length + ' checks, ' + report.screenshots.length + ' screenshots');
  } finally {
    fs.writeFileSync(path.join(out, 'web-review.json'), JSON.stringify(report, null, 2) + '\n');
    await browser.close();
    server.close();
  }
})().catch(e => { console.error(e); server.close(); process.exitCode = 1; });

