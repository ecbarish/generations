/* ONBOARD-KIT1 actual-browser regression review. Fresh contexts contain only synthetic saves.
   Usage: node tests/onboarding-browser.cjs [repository root] [artifact directory]
   Optional CHROME_PATH selects a locally installed browser; CI uses pinned Playwright Chromium.
   ONBOARDING_BASE_URL optionally runs the same review against actual public resources.
   State setup uses existing game bindings; all reviewed UI actions use real input. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const out = path.resolve(process.argv[3] || '/tmp/onboarding-review');
const publicBase = process.env.ONBOARDING_BASE_URL;
const manifest = process.env.ONBOARDING_PUBLIC_MANIFEST ? JSON.parse(fs.readFileSync(process.env.ONBOARDING_PUBLIC_MANIFEST, 'utf8')) : null;
const report = { started: new Date().toISOString(), checks: [], screenshots: [], geometry: [], failures: [] };
const responseChecks = new Set(), responseEvidence = [], responseFailures = [];
const expectedResponses = new Map(manifest ? manifest.files.map(file => [file.file, file.expected]) : []);
const configurations = [
  { width: 320, height: 568, text: 1, touch: true },
  { width: 375, height: 812, text: 1, touch: true },
  { width: 390, height: 844, text: 1.5, touch: true },
  { width: 667, height: 375, text: 1, touch: true },
  { width: 812, height: 375, text: 1, touch: true },
  { width: 1366, height: 768, text: 1, touch: false },
  { width: 1920, height: 1080, text: 1, touch: false },
  { width: 3440, height: 1440, text: 1, touch: false }
];
// Release smoke covers both phone orientations and desktop; the local review
// continues to run all eight configurations and every original assertion.
const reviewConfigurations = publicBase ? configurations.filter(config => [375, 812, 1366].includes(config.width)) : configurations;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
let browser, server, base;
function check(ok, label) { assert.ok(ok, label); report.checks.push(label); }
const run = (page, source) => page.evaluate(code => window.eval(code), source);
const ready = (page, saved = false) => publicBase
  ? page.waitForFunction(hasSave => window.eval('typeof started!=="undefined"&&started&&typeof boot==="function"&&typeof S!=="undefined"') && window.ArcadeOnboarding && (!hasSave || window.eval('!!S.cur')), saved)
  : page.waitForFunction(hasSave => window.__rb && window.ArcadeOnboarding && (!hasSave || window.__rb.S.cur), saved);
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function capture(page, label) {
  const file = label.replace(/[^a-z0-9._-]+/gi, '-') + '.png';
  await page.screenshot({ path: path.join(out, file) }); report.screenshots.push(file);
}
async function activate(page, selector, touch) {
  const target = page.locator(selector).first();
  await target.waitFor({ state: 'visible' });
  if (touch) { await target.tap(); return; }
  // Real Tab/Enter rather than DOM click/focus, including focus restoration and trapped notebooks.
  for (let i = 0; i < 120; i++) {
    if (await target.evaluate(el => document.activeElement === el)) { await page.keyboard.press('Enter'); return; }
    await page.keyboard.press('Tab');
  }
  throw Error('Keyboard cannot reach ' + selector);
}
async function closeBook(page, touch) {
  if (touch) await activate(page, '#fieldPutAway', true);
  else await page.keyboard.press('Escape');
  await page.locator('.menu').waitFor({ state: 'hidden' });
}
async function contextFor(config) {
  const context = await browser.newContext({
    viewport: { width: config.width, height: config.height }, hasTouch: config.touch,
    isMobile: config.touch, reducedMotion: 'reduce', serviceWorkers: 'block'
  });
  // Keep the original local policy. Public runs abort only optional Google fonts;
  // game resources always come from the real server, never route.fulfill/local bytes.
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(base).origin) return route.continue();
    if (!publicBase || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.abort();
    return route.continue();
  });
  if (publicBase) {
    const storage = await context.storageState();
    check(!storage.cookies.length && !storage.origins.length, 'public: new context contains no existing player data');
  }
  if (manifest) context.on('response', response => {
    const task = (async () => {
      const url = new URL(response.url()), site = new URL(base + '/');
      const executable = ['document', 'script', 'stylesheet'].includes(response.request().resourceType());
      if (url.origin !== site.origin || !url.pathname.startsWith(site.pathname)) {
        if (executable) responseFailures.push({ url: url.href, error: 'Loaded executable/document resource is outside the approved site' });
        return;
      }
      let file = decodeURIComponent(url.pathname.slice(site.pathname.length));
      if (file.endsWith('/')) file += 'index.html';
      if (!expectedResponses.has(file)) {
        if (executable) {
          responseFailures.push({ file, error: 'Loaded executable/document resource is absent from approved source manifest' });
        }
        return;
      }
      const actual = crypto.createHash('sha256').update(await response.body()).digest('hex');
      const evidence = { file, status: response.status(), expected: expectedResponses.get(file), actual };
      evidence.ok = response.ok() && actual === evidence.expected;
      responseEvidence.push(evidence);
      if (!evidence.ok) responseFailures.push(evidence);
    })().catch(error => responseFailures.push({ url: response.url(), error: error.message }));
    responseChecks.add(task); task.finally(() => responseChecks.delete(task));
  });
  return context;
}
async function closeContext(context) {
  // Finish reading real response bodies before closing their browser connection.
  await Promise.all([...responseChecks]);
  await context.close();
}
async function game(page, config) {
  await page.goto(base + '/games/realmbound/');
  await ready(page);
  if (publicBase) check(await run(page, "!S.cur&&localStorage.getItem(KEY)===null"), 'public: game starts without a saved hero before synthetic setup');
  await page.evaluate(text => document.documentElement.style.setProperty('--arc-text', text), config.text);
  await run(page, `clearArrival();clearTownService();closeRealmNotebook(false);RTALK=null;SCN.el.hidden=true;closeModal();
    S=emptyS();var browserHero=newHero('Guidance review','concord','human','hunter');
    S.chars=[browserHero];S.cur=browserHero.id;boot();accept('t1');C.phase='seek';C.t=3600;beginArrival(false);updateWorld();`);
  await settle(page);
}
async function snapshot(page) {
  return run(page, 'JSON.stringify({id:H().id,quests:H().quests,gear:H().gear,bags:H().bags,money:H().money,addons:H().addons})');
}
async function notebookFits(page, label) {
  const layout = await page.evaluate(() => {
    const book = document.querySelector('.menu'), r = book.getBoundingClientRect();
    const guide = document.querySelector('#roadGuide');
    return { fits: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1,
      noPageOverflow: document.documentElement.scrollWidth <= innerWidth + 1,
      noGuideOverflow: guide.hidden || guide.scrollWidth <= guide.clientWidth + 1,
      controls: [...book.querySelectorAll('#roadGuide button')].filter(el => el.getClientRects().length).every(el => el.getBoundingClientRect().height >= 44) };
  });
  for (const [key, value] of Object.entries(layout)) check(value, label + ': ' + key);
}
async function fieldFits(page, label) {
  const layout = await page.evaluate(() => {
    const box = selector => document.querySelector(selector).getBoundingClientRect();
    const dock = box('#fieldDock'), bar = box('.abar'), xp = box('.xp');
    const goal = document.querySelector('#roadNextGoal');
    return {
      withinViewport: document.documentElement.scrollWidth <= innerWidth + 1 && dock.bottom <= innerHeight + 1,
      combatClearance: bar.bottom <= xp.top + 1,
      dockClearance: xp.bottom <= dock.top + 1,
      noteStaysCarried: !!document.querySelector('[data-field-page="road"] #roadGuide'),
      goalStaysInDock: !!goal.closest('#fieldDock [data-field-book="road"]'),
      guideDoesNotCoverWorld: !document.querySelector('#roadGuide').getClientRects().length,
      worldUsable: !document.querySelector('.world').inert
    };
  });
  for (const [key, value] of Object.entries(layout)) check(value, label + ': ' + key);
}
async function reviewGame(config) {
  const name = (config.touch ? 'touch-' : 'keyboard-') + config.width + 'x' + config.height + '-text' + config.text;
  const context = await contextFor(config), page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await game(page, config);
    const original = await snapshot(page);
    const quietDockHeight = await page.locator('#fieldDock').evaluate(el => el.getBoundingClientRect().height);
    check(await run(page, 'arrivalPaused()'), name + ': fresh arrival is present');
    check(await page.locator('#roadGuide').isHidden(), name + ': optional guide yields to arrival');
    check(await page.locator('#roadNextGoal').isHidden(), name + ': dock goal yields to arrival');
    await capture(page, name + '-arrival');
    if (config.touch) await activate(page, '[data-road="skip"]', true);
    else await page.keyboard.press('Escape');
    await run(page, "C.phase='seek';C.t=3600;updateWorld();");
    check(await run(page, 'H().onboarding.arrival&&!arrivalPaused()'), name + ': actual input finishes arrival');
    await settle(page);
    check(await page.locator('#fieldDock').evaluate(el => el.getBoundingClientRect().height) === quietDockHeight, name + ': goal does not grow the existing dock');
    await fieldFits(page, name);
    await capture(page, name + '-field');
    await activate(page, '[data-field-book="road"]', config.touch);
    await notebookFits(page, name);
    check(await page.locator('#roadGuide').isVisible(), name + ': real input opens Road note');
    check(!!(await page.locator('#roadGuide .onboarding-goal').textContent()).trim(), name + ': next goal is readable');
    check(await page.locator('#roadGuide').getAttribute('data-input') === (config.touch ? 'touch' : 'keyboard'), name + ': input instructions match actual modality');
    const initialOrientation = config.height > config.width && config.touch;
    check(await page.locator('#roadGuide .onboarding-orientation').isVisible() === initialOrientation, name + ': optional orientation advice appears only where relevant');
    if (config.touch) {
      const touchCopy = await page.locator('#roadGuide .onboarding-input').textContent();
      await page.keyboard.press('Tab');
      check(await page.locator('#roadGuide').getAttribute('data-input') === 'keyboard', name + ': real key changes touch instructions');
      check(await page.locator('#roadGuide .onboarding-input').textContent() !== touchCopy, name + ': keyboard copy is distinct');
      await page.locator('#roadGuide .onboarding-title').tap();
      check(await page.locator('#roadGuide').getAttribute('data-input') === 'touch', name + ': real touch restores touch instructions');
      await page.setViewportSize({ width: config.height, height: config.width }); await settle(page);
      await notebookFits(page, name + ' rotated');
      check(await page.locator('#roadGuide .onboarding-orientation').isVisible() === !initialOrientation, name + ': rotation updates optional advice');
      check(await snapshot(page) === original, name + ': rotation preserves quest and inventory state');
      await capture(page, name + '-rotated-note');
      await page.setViewportSize({ width: config.width, height: config.height }); await settle(page);
    }
    await capture(page, name + '-road-note');
    await activate(page, '#roadGuide [data-onboarding-action="quests"]', config.touch);
    check(await run(page, "FIELD_BOOK==='quests'"), name + ': guide action opens actual Quest Journal');
    check(await page.locator('#roadGuide').isHidden(), name + ': guide clears Quest Journal');
    await notebookFits(page, name + ' quests');
    await activate(page, '[data-act="followquest"][data-arg="t1"]', config.touch);
    check(await run(page, "H().quests.active[0]==='t1'"), name + ': journal action remains usable');
    await capture(page, name + '-quests');
    await closeBook(page, config.touch);
    await activate(page, '[data-field-book="bags"]', config.touch);
    check(await run(page, "FIELD_BOOK==='bags'"), name + ': real input opens Satchel');
    check(await page.locator('#roadGuide').isHidden(), name + ': guide clears Satchel');
    await notebookFits(page, name + ' satchel');
    await capture(page, name + '-satchel');
    await closeBook(page, config.touch);
    await activate(page, '[data-field-book="road"]', config.touch);
    const hint = await run(page, 'roadHint().id');
    await activate(page, '#roadGuide .onboarding-dismiss', config.touch);
    check(await run(page, `H().onboarding.hints[${JSON.stringify(hint)}]===true`), name + ': dismissal belongs to existing hero state');
    check(await run(page, "FIELD_BOOK==='road'"), name + ': dismiss leaves notebook open');
    check(await page.locator('#roadGuide').isHidden() && await page.locator('#roadNextGoal').isHidden(), name + ': dismissed guide and current goal disappear');
    check(await page.locator('#fieldDock').evaluate(el => el.getBoundingClientRect().height) === quietDockHeight, name + ': dismissal leaves dock height unchanged');
    await closeBook(page, config.touch);
    await activate(page, '[data-field-book="road"]', config.touch);
    check(await page.locator('#roadGuide').isHidden(), name + ': reopening does not resurrect dismissed guidance');
    await closeBook(page, config.touch);
    check(await snapshot(page) === original, name + ': opening, actions and dismissal preserve quests, gear and money');
    await run(page, 'save();');
    await page.reload(); await ready(page, true);
    await page.evaluate(text => document.documentElement.style.setProperty('--arc-text', text), config.text);
    await run(page, "closeModal();C.phase='seek';C.t=3600;updateWorld();");
    check(await run(page, `H().onboarding.hints[${JSON.stringify(hint)}]===true`), name + ': dismissal survives actual reload');
    check(await snapshot(page) === original, name + ': actual reload preserves quests, rewards, gear and money');
    check(await run(page, '!arrivalPaused()&&!realmNotebookOpen()'), name + ': reload does not reopen arrival or notebook');
    await activate(page, '#fieldOptions summary', config.touch);
    await activate(page, '[data-road="reset"]', config.touch);
    await activate(page, '#fieldOptions summary', config.touch);
    await activate(page, '[data-field-book="road"]', config.touch);
    check(await page.locator('#roadGuide').isVisible(), name + ': Options Road help resets dismissed notes');
    check(await run(page, 'Object.keys(H().onboarding.hints).length===0'), name + ': reset affects hints only');
    await closeBook(page, config.touch);
    await run(page, "C.phase='intown';townEnter();talkPlaceQuest(townPeople().find(n=>n.name==='Deputy Rhea'));SCN.skip();updateWorld();");
    await settle(page);
    check(await page.locator('#roadGuide').isHidden() && await page.locator('#roadNextGoal').isHidden(), name + ': guidance yields to quest conversation');
    const clearance = await page.evaluate(() => {
      const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: r.height }; };
      const dialogue = box('.scene .dlg'), bar = box('.abar'), header = box('.top'), dock = box('#fieldDock');
      return { dialogue, bar, header, dock, clear: dialogue.top >= header.bottom - 1 && dialogue.bottom <= dock.top + 1 && (!bar.height || dialogue.bottom <= bar.top + 1) };
    });
    report.geometry.push({ configuration: name, scene: 'quest conversation', ...clearance });
    check(clearance.clear, name + ': quest conversation clears header, combat controls and dock: ' + JSON.stringify(clearance));
    await capture(page, name + '-dialogue');
    await activate(page, '.dlg-choices button:last-child', config.touch);
    check(await run(page, '!RTALK'), name + ': conversation choice remains usable');
    await fieldFits(page, name + ' walking');
    const before = await run(page, 'JSON.stringify([TOWN.pos.x,TOWN.pos.y])');
    if (config.touch) {
      await page.waitForFunction(() => window.eval('!!TOWN.cam'));
      const point = await run(page, `(()=>{const p=TOWN.pos,pending=[[p.x,p.y]],seen=new Set([p.x+','+p.y]);
        for(let i=0;i<pending.length;i++){const [px,py]=pending[i];for(const [dx,dy] of [[0,-1],[1,0],[-1,0],[0,1]]){
          const x=px+dx,y=py+dy,key=x+','+y,ch=TOWN.map.rows[y]?.[x],tile=TOWN_TILES[ch];
          if(seen.has(key)||!tile||tile.solid||tile.door||tile.exit||tile.sign||TOWN_WALK.blocked(TOWN.map,x,y))continue;
          seen.add(key);pending.push([x,y]);const at=TOWN.cam.fwd(x+.5,y+.5);if(!at)continue;
          const r=cv.getBoundingClientRect(),sx=r.left+at[0],sy=r.top+at[1];
          if(document.elementFromPoint(sx,sy)===cv)return {x:sx,y:sy};
        }}throw Error('No reachable clear ground for actual touch');})()`);
      await page.touchscreen.tap(point.x, point.y);
    } else {
      // Canvas focus is a test precondition; movement itself goes through trusted keyboard input.
      await page.locator('#scene').evaluate(el => { el.tabIndex = 0; el.focus(); });
      await page.keyboard.down('ArrowUp'); await page.waitForTimeout(350); await page.keyboard.up('ArrowUp');
    }
    await page.waitForFunction(previous => window.eval('JSON.stringify([TOWN.pos.x,TOWN.pos.y])') !== previous, before);
    check(true, name + ': actual ' + (config.touch ? 'touch' : 'keyboard') + ' still moves the hero');
    check(await snapshot(page) === original, name + ': reset, conversation and movement do not alter progress');
    check(errors.length === 0, name + ': no runtime errors: ' + errors.join('; '));
  } catch (error) {
    await capture(page, name + '-FAIL').catch(() => {}); throw error;
  } finally { await closeContext(context); }
}

async function reviewLegacy(version) {
  const config = { width: 375, height: 812, text: 1, touch: true };
  const context = await contextFor(config), page = await context.newPage();
  try {
    await game(page, config);
    const legacy = await run(page, `clearArrival();var legacyHero=newHero('Returning traveler','concord','human','hunter');
      delete legacyHero.onboarding;legacyHero.money=1234;
      legacyHero.quests={active:['t2'],prog:{t2:5},done:{t1:true},rewards:{t2:qReward(ALLQ.t2)}};
      var legacyAccount=${version === 1 ? "{v:1,hero:legacyHero,last:Date.now(),log:[]}" : "{v:2,chars:[legacyHero],cur:legacyHero.id,last:Date.now(),tab:'quests'}"};
      var legacyExpected=JSON.stringify({id:legacyHero.id,quests:legacyHero.quests,gear:legacyHero.gear,bags:legacyHero.bags,money:legacyHero.money,addons:legacyHero.addons});
      ({account:legacyAccount,expected:legacyExpected});`);
    // The next document reads an actual raw v1/v2 save. The old page's beforeunload save
    // cannot replace it: this one-page fixture is installed before any game scripts.
    await page.addInitScript(account => localStorage.setItem('realmbound-save-v1', JSON.stringify(account)), legacy.account);
    const original = legacy.expected;
    await page.reload(); await ready(page, true);
    await run(page, "closeModal();C.phase='seek';C.t=3600;updateWorld();");
    check(await snapshot(page) === original, 'legacy v' + version + ': real reload preserves old quest progress, rewards, inventory and money');
    check(await run(page, 'H().onboarding===null&&!arrivalPaused()'), 'legacy v' + version + ': no unsolicited onboarding opt-in');
    check(await page.locator('#roadNextGoal').isHidden(), 'legacy v' + version + ': returning player has no new goal badge');
    await activate(page, '[data-field-book="road"]', true);
    check(await page.locator('#roadGuide').isHidden(), 'legacy v' + version + ': old player Road note stays quiet');
    await closeBook(page, true);
    await activate(page, '#fieldOptions summary', true); await activate(page, '[data-road="replay"]', true);
    check(await run(page, 'arrivalPaused()'), 'legacy v' + version + ': existing replay still works');
    await activate(page, '#fieldOptions summary', true);
    await activate(page, '[data-road="skip"]', true);
    check(await run(page, 'H().onboarding===null'), 'legacy v' + version + ': replay never opts returning player into hints');
    check(await snapshot(page) === original, 'legacy v' + version + ': replay preserves prior progress');
  } finally { await closeContext(context); }
}

async function reviewReference() {
  const context = await contextFor({ width: 375, height: 812, text: 1, touch: true }), page = await context.newPage();
  try {
    await page.goto(base + '/tests/onboarding-reference.html');
    await page.waitForFunction(() => window.referenceController && window.referenceState);
    const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }));
    check(await page.locator('#referenceGuide').isVisible(), 'reference: second consumer renders without a game');
    await page.locator('#referenceGuide [data-onboarding-action]').first().tap();
    check(await page.evaluate(() => referenceState.actions.length === 1), 'reference: real tap invokes consumer action');
    await page.locator('#referenceGuide .onboarding-dismiss').tap();
    check(await page.locator('#referenceGuide').isHidden(), 'reference: consumer-owned dismissal hides note');
    await page.locator('#referenceReset').tap();
    check(await page.locator('#referenceGuide').isVisible(), 'reference: consumer reset reopens guidance');
    await activate(page, '#referenceSwap', false);
    check(await page.evaluate(() => referenceState.current === 'crossing'), 'reference: real keyboard activates a different goal');
    check(await page.locator('#referenceGuide').getAttribute('data-input') === 'keyboard', 'reference: actual keyboard updates presentation');
    await page.locator('#referenceGuide .onboarding-title').tap();
    await page.setViewportSize({ width: 812, height: 375 }); await settle(page);
    await capture(page, 'reference-landscape');
    await page.setViewportSize({ width: 375, height: 812 }); await settle(page);
    await capture(page, 'reference-portrait');
    check(await page.evaluate(() => JSON.stringify({ ...localStorage })) === stored, 'reference: presenter and neutral fixture write no save data');
    const lifecycle = await page.evaluate(() => {
      const el = document.createElement('aside'); document.body.append(el);
      let actions = 0, dismissed = 0, changes = 0;
      const controller = ArcadeOnboarding.create({ element: el, onAction: () => actions++, onDismiss: () => dismissed++, onInputChange: () => changes++ });
      const model = { id: 'safe', title: '<img src=x onerror=alert(1)>', text: '<script>bad()</script>', goal: 'Safe text',
        inputs: { keyboard: 'Keyboard', touch: 'Touch' }, actions: [{ id: 'go', label: '<b>Go</b>' }] };
      controller.update(model);
      const safe = !el.querySelector('img,script,b') && el.textContent.includes('<img');
      const button = el.querySelector('[data-onboarding-action]'); button.focus(); controller.update({ ...model, text: 'Updated' });
      const stable = document.activeElement === button && button === el.querySelector('[data-onboarding-action]');
      controller.update(null); const hidden = el.hidden;
      controller.update(model); controller.destroy(); controller.destroy(); controller.update(model);
      const after = changes;
      document.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      button.click(); const disposed = el.hidden && !el.childNodes.length && actions === 0 && dismissed === 0 && changes === after;
      el.remove(); return { safe, stable, hidden, disposed };
    });
    for (const [key, value] of Object.entries(lifecycle)) check(value, 'reference lifecycle: ' + key);
  } finally { await closeContext(context); }
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  try { report.source = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(); } catch { report.source = null; }
  report.mode = publicBase ? 'public' : 'local';
  report.configurations = reviewConfigurations;
  if (publicBase) {
    const url = new URL(publicBase);
    assert.equal(url.protocol, 'https:', 'Public verification requires HTTPS');
    assert.ok(!url.search && !url.hash && !url.username && !url.password, 'Public base must be a plain site URL');
    base = url.href.replace(/\/$/, '');
    if (manifest) {
      assert.equal(manifest.base.replace(/\/$/, ''), base, 'Manifest must describe the actual public base');
      report.publicSource = manifest.source;
    }
  } else {
    assert.ok(!manifest, 'Public manifest requires ONBOARDING_BASE_URL');
    server = http.createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let file = path.resolve(root, '.' + pathname); if (pathname.endsWith('/')) file = path.join(file, 'index.html');
      if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
      fs.readFile(file, (error, data) => {
        if (error) { res.writeHead(404); res.end(); return; }
        res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(data);
      });
    });
    await new Promise(resolve => server.listen(0, 'localhost', resolve)); base = 'http://localhost:' + server.address().port;
  }
  report.base = base;
  browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  report.browser = await browser.version();
  for (const config of reviewConfigurations) {
    try { await reviewGame(config); console.log('PASS', JSON.stringify(config)); }
    catch (error) { report.failures.push({ configuration: config, error: error.stack }); console.error(error.stack); }
  }
  for (const version of [1, 2]) {
    try { await reviewLegacy(version); } catch (error) { report.failures.push({ legacy: version, error: error.stack }); console.error(error.stack); }
  }
  try { await reviewReference(); } catch (error) { report.failures.push({ reference: true, error: error.stack }); console.error(error.stack); }
  if (manifest) {
    await Promise.all([...responseChecks]);
    const seen = new Set(responseEvidence.filter(item => item.ok).map(item => item.file));
    for (const file of manifest.files) if (file.requiredInBrowser && !seen.has(file.file)) responseFailures.push({ file: file.file, error: 'Approved resource was not verified in an actual browser response' });
    report.publicResponses = responseEvidence;
    report.publicResponseFailures = responseFailures;
    if (responseFailures.length) report.failures.push({ publicResources: responseFailures });
    else check(true, 'public: every required actual browser resource matches the approved immutable source');
  }
  assert.equal(report.failures.length, 0, 'Onboarding browser review failures; see report.json');
})().catch(error => { if (!report.failures.length) report.failures.push({ error: error.stack }); console.error(error.message); process.exitCode = 1; }).finally(async () => {
  report.finished = new Date().toISOString(); report.passed = report.failures.length === 0;
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(report.checks.length + ' passed assertions; ' + report.failures.length + ' failures. Evidence: ' + out);
  if (browser) await browser.close(); if (server) await new Promise(resolve => server.close(resolve));
});
