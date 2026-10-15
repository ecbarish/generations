#!/usr/bin/env node
'use strict';
/* OW-TAP, no dependencies for the default command:
 *   node tests/ow-tap.cjs
 * Source-only negative control: node tests/ow-tap.cjs --css /tmp/ow-before.css
 * Real layout, native interaction, screenshots and the unchanged Otherworld suite:
 *   node tests/ow-tap.cjs --browser --output /tmp/ow-tap-evidence
 * Optional paired BEFORE screenshots/measurements (baseline violations are recorded):
 *   git show <base>:games/otherworld/style.css > /tmp/ow-before.css
 *   node tests/ow-tap.cjs --browser --output /tmp/ow-tap-evidence --baseline-css /tmp/ow-before.css
 * Browser mode requires Playwright and its Chromium (or CHROME_PATH=/path/to/chromium). It fails, rather than skips or
 * substitutes mocked geometry, when a browser/server cannot start. Contexts are
 * disposable; it never connects to a browser profile or reads a player's save.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const CSS = 'games/otherworld/style.css';
const SAVE_KEY = 'otherworld-save-v1';
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const fingerprint = file => crypto.createHash('sha256').update(read(file)).digest('hex');
const TARGETS = ['.hud .home', '.hbtn', '.arc-set-btn', '.chip', '.swatch'];
const PAGE = 'games/otherworld/index.html';
// Fingerprint every locally loaded script/stylesheet in its declared page,
// including runtime-injected settings/feedback/dialogue CSS dependencies.
const PAGE_DEPS = [PAGE, ...[...read(PAGE).matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g)]
  .map(m => m[1]).filter(url => !/^(?:https?:)?\/\//.test(url))
  .map(url => path.posix.normalize(path.posix.join(path.posix.dirname(PAGE), url)))];
const MODEL_SCRIPTS = ['shared/engine.js', ...['00-data', '01-game', '03-lanthorn', '04-hearthmere', '05-ashen', '06-memories', '08-open-choices'].map(n => `games/otherworld/js/${n}.js`)];
let checks = 0;
function check(label, fn) { fn(); checks++; console.log(`PASS ${label}`); }

function options(argv) {
  const out = { browser: false, output: path.resolve('/tmp/ow-tap-evidence'), baseline: null, css: CSS };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--browser') out.browser = true;
    else if (['--output', '--baseline-css', '--css'].includes(argv[i])) {
      const key = argv[i] === '--output' ? 'output' : argv[i] === '--css' ? 'css' : 'baseline';
      assert.ok(argv[i + 1] && !argv[i + 1].startsWith('--'), `${argv[i]} needs a path`);
      out[key] = path.resolve(argv[++i]);
    } else throw Error(`Unknown option: ${argv[i]}`);
  }
  assert.ok(out.css === CSS || !out.browser, '--css is source-only; use --baseline-css for paired browser captures');
  assert.ok(!out.baseline || out.browser, '--baseline-css requires --browser');
  return out;
}

// This deliberately checks source contracts, NOT a simulated CSS cascade. Only
// top-level rules count; actual cascade, wrapping and hit-testing need --browser.
function declarations(css, selector) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let start = 0, depth = 0, head = '', body = '', result = {};
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') {
      if (depth === 0) { head = css.slice(start, i).trim(); start = i + 1; }
      depth++;
    } else if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        body = css.slice(start, i);
        if (!head.startsWith('@') && head.split(',').some(s => s.trim() === selector)) {
          for (const item of body.split(';')) {
            const colon = item.indexOf(':');
            if (colon >= 0) result[item.slice(0, colon).trim()] = item.slice(colon + 1).trim();
          }
        }
        start = i + 1;
      }
    }
  }
  return result;
}
function sourceChecks(cssFile) {
  const css = path.isAbsolute(cssFile) ? fs.readFileSync(cssFile, 'utf8') : read(cssFile);
  for (const selector of TARGETS) check(`${selector} has unconditional 44px minima in both directions`, () => {
    const d = declarations(css, selector);
    for (const prop of ['min-width', 'min-height']) {
      assert.match(d[prop] || '', /^\d+(?:\.\d+)?px$/, `${selector} ${prop} must be an explicit pixel minimum`);
      assert.ok(parseFloat(d[prop]) >= 44, `${selector} ${prop}: ${d[prop]}`);
    }
  });
  check('arcade anchor has a real centered inline-flex box and outranks shared a.home', () => {
    const d = declarations(css, '.hud .home');
    assert.equal(d.display, 'inline-flex');
    assert.equal(d['align-items'], 'center');
    assert.equal(d['justify-content'], 'center');
    assert.match(read('shared/settings.js'), /a\.home\{display:inline-flex/);
  });
  check('swatches remain 44px round squares', () => {
    const d = declarations(css, '.swatch');
    assert.equal(d.width, '44px'); assert.equal(d.height, '44px'); assert.equal(d['border-radius'], '50%');
  });
  check('real page and setup code still expose all tested native controls', () => {
    const html = read('games/otherworld/index.html'), game = read('games/otherworld/js/01-game.js');
    assert.match(html, /<a class="home" href="\.\.\/\.\.\/index\.html"/);
    assert.match(html, /<button id="statusBtn" class="hbtn"/);
    assert.match(game, /<button class="chip" data-pick=/);
    assert.match(game, /<button class="swatch/);
    assert.match(read('games/otherworld/js/09-ledger.js'), /class="chip" data-ledger-open/);
  });
}

const OLD_SAVES = [
  { label: 'pre-ledger Between save', state: { v: 1, name: 'Old', mem: { guildmaster: true, tide: true }, lives: [{ world: 'asterhold', gift: 'appraisal', name: 'Old', ending: 'e_walls', at: 1700000000000 }], life: null, met: true } },
  { label: 'legacy Asterhold active life', state: { v: 1, name: 'Ren', look: { hair: '#4a5aa8', skin: '#7a4a2e' }, mem: { oldroot: true }, lives: [], met: true, life: { world: 'asterhold', gift: 'pocket', name: 'Ren', flags: { mira: true, sharedBread: true }, at: 'a_guild', silver: 17, status: true, mem: { oldroot: true, seed: true } } } },
  { label: 'Hearthmere save with paid decisions', state: { v: 1, name: 'Yuna', look: { hair: '#c84a3a', skin: '#d8a882' }, mem: { broth: true }, lives: [], met: true, life: { world: 'hearthmere', gift: 'cooking', name: 'Yuna', flags: { innOpen: true }, at: 'h_prep', silver: 7, status: false, mem: { broth: true }, entered: { h_key: true, h_prep: true }, town: { day: 1, food: 4, fear: 1 }, hearth: { day: 2, stores: 4, warmth: 2, welcome: 1 } } } },
  { label: 'Ashen return knowledge and ending in progress', state: { v: 1, name: 'Kai', look: { hair: '#e8e8f0', skin: '#f1c9a0' }, mem: { mercy: true }, lives: [{ world: 'hearthmere', gift: 'speech', name: 'Kai', ending: 'e_hearth_shared', at: 1700000010000 }], met: true, life: { world: 'ashen', gift: 'return', name: 'Kai', flags: { records: true }, at: 's_dusk', ending: 'e_ash_death', silver: 3, status: false, mem: { mercy: true }, ash: { day: 3, returns: 2, knowledge: { store: true, record: true } } } } }
];
function containsOriginal(actual, expected, where = 'save') {
  if (Array.isArray(expected)) { assert.deepEqual(actual, expected, where); return; }
  if (expected && typeof expected === 'object') {
    for (const key of Object.keys(expected)) containsOriginal(actual[key], expected[key], `${where}.${key}`);
  } else assert.equal(actual, expected, where);
}
function saveVM() {
  // Web Storage adapter: keys are enumerable; its methods are not. Engine backup
  // enumeration therefore uses the same API/shape as it does in a browser.
  const storage = Object.create(null), listeners = [];
  Object.defineProperties(storage, {
    getItem: { value: k => Object.hasOwn(storage, k) ? storage[k] : null },
    setItem: { value: (k, v) => { storage[k] = String(v); } },
    removeItem: { value: k => { delete storage[k]; } },
    key: { value: i => Object.keys(storage)[i] ?? null },
    length: { get: () => Object.keys(storage).length }
  });
  const context = vm.createContext({ console, localStorage: storage });
  vm.runInContext('window = globalThis', context);
  // Engine has an intentional no-document path; load its actual storage code
  // through that path. Game model scripts only register two click listeners at
  // evaluation time. Capture those, but never fake a click, renderer or Dialogue.
  vm.runInContext(read(MODEL_SCRIPTS[0]), context, { filename: MODEL_SCRIPTS[0] });
  // World extensions register canvas renderers in SCENES; the empty registry
  // accepts registrations only. No renderer or scene function is executed.
  context.SCENES = {};
  context.document = { addEventListener: (type, handler) => listeners.push({ type, handler }) };
  for (const file of MODEL_SCRIPTS.slice(1)) vm.runInContext(read(file), context, { filename: file });
  const api = vm.runInContext('({ key: KEY, fresh, load, save, prepareLife, get state(){return S}, set state(value){S=value} })', context);
  assert.equal(listeners.length, 2, 'only expected model click registrations are adapted');
  return { api, storage };
}
function saveChecks() {
  check('actual Otherworld load/save keep the original storage key', () => assert.equal(saveVM().api.key, SAVE_KEY));
  for (const fixture of OLD_SAVES) check(`${fixture.label}: actual load, save and second load preserve fields`, () => {
    const { api, storage } = saveVM(), raw = JSON.stringify(fixture.state);
    storage.setItem(SAVE_KEY, raw);
    api.load();
    assert.equal(storage.getItem(SAVE_KEY), raw, 'loading does not rewrite the fixture');
    containsOriginal(plain(api.state), fixture.state);
    assert.ok(api.state.look.hair && api.state.look.skin, 'legacy missing appearance gets defaults');
    if (api.state.life) assert.equal(api.state.life.entered[api.state.life.at], true, 'resumed node has an effect receipt');
    if (fixture.state.life?.at === 'a_guild') assert.equal(api.state.life.silver, 17, 'legacy silver retained');
    const normalized = plain(api.state);
    api.save();
    assert.deepEqual(JSON.parse(storage.getItem(SAVE_KEY)), normalized);
    assert.ok(JSON.parse(storage.getItem('arcade-index-v1')).otherworld, 'real engine report was saved');
    assert.ok(Object.keys(storage).some(k => k.startsWith(`arcade-backup:${SAVE_KEY}:`)), 'real engine backup was written');
    api.state = api.fresh(); api.load();
    assert.deepEqual(plain(api.state), normalized, 'second load is lossless');
    containsOriginal(plain(api.state), fixture.state);
  });
  check('actual load rejects another game’s save without rewriting it', () => {
    const { api, storage } = saveVM(), raw = JSON.stringify({ team: [], money: 12 });
    storage.setItem(SAVE_KEY, raw); const fresh = plain(api.state); api.load();
    assert.deepEqual(plain(api.state), fresh); assert.equal(storage.getItem(SAVE_KEY), raw);
  });
}

async function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
  const server = http.createServer((req, res) => {
    let relative;
    try { relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
    let file = path.resolve(ROOT, `.${relative}`);
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
    if (relative.endsWith('/')) file = path.join(file, 'index.html');
    fs.readFile(file, (error, data) => {
      if (error) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data);
    });
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { server, origin: `http://localhost:${server.address().port}` };
}

async function browserChecks(opts) {
  fs.mkdirSync(opts.output, { recursive: true });
  const report = { generatedAt: new Date().toISOString(), nodeChecks: checks, browser: 'not started',
    scope: 'Real Otherworld page, real native controls, disposable Playwright contexts. No player storage/profile access.',
    fonts: 'External requests are blocked for deterministic offline runs; screenshots use installed fallback fonts.',
    sourceSHA256: Object.fromEntries([...new Set([...PAGE_DEPS, 'tests/otherworld.html', 'tests/otherworld-checks.js'])].map(f => [f, fingerprint(f)])),
    cases: [], suite: null, errors: [] };
  const writeReport = () => fs.writeFileSync(path.join(opts.output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  let server, browser;
  try {
    let chromium;
    try { ({ chromium } = require('playwright')); } catch (e) { throw Error(`Browser mode needs Playwright: ${e.message}`); }
    const serving = await serve(); server = serving.server;
    browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
    report.browser = await browser.version();
    const variants = opts.baseline ? [['before', fs.readFileSync(opts.baseline, 'utf8')], ['after', null]] : [['after', null]];
    if (opts.baseline) report.baselineSHA256 = crypto.createHash('sha256').update(variants[0][1]).digest('hex');
    const sizes = [[320, 568], [360, 800], [375, 812], [390, 844], [844, 390], [1366, 768]];
    for (const [variant, baseline] of variants) for (const [width, height] of sizes) for (const coarse of [true, false]) for (const textScale of [1, 1.3]) {
      const name = `${variant}-${width}x${height}-${coarse ? 'coarse' : 'fine'}-${textScale === 1 ? 'normal' : 'larger'}`;
      const item = { name, width, height, pointer: coarse ? 'coarse' : 'fine', textScale, measurements: [], screenshots: [], assertions: [], violations: [], errors: [] };
      report.cases.push(item);
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: coarse, isMobile: false, deviceScaleFactor: 1, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const page = await context.newPage(); page.setDefaultTimeout(8000);
      page.on('pageerror', e => item.errors.push(e.message));
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (url.origin !== serving.origin) return route.abort();
        if (baseline !== null && url.pathname === '/games/otherworld/style.css') return route.fulfill({ status: 200, contentType: 'text/css', body: baseline });
        return route.continue();
      });
      const expect = (ok, label, details) => { item.assertions.push({ label, ok: !!ok }); if (!ok) item.violations.push({ label, details }); };
      const activate = loc => coarse ? loc.tap() : loc.click();
      const shot = async state => { const file = `${name}-${state}.png`; await page.screenshot({ path: path.join(opts.output, file) }); item.screenshots.push(file); };
      const stateText = () => page.evaluate(() => JSON.stringify(window.__ow.S));
      async function measure(state, selector, minCount = 1) {
        const locs = page.locator(selector).filter({ visible: true });
        const count = await locs.count(); expect(count >= minCount, `${state}: ${selector} count >= ${minCount}`, count);
        for (let i = 0; i < count; i++) {
          const loc = locs.nth(i); await loc.scrollIntoViewIfNeeded();
          const m = await loc.evaluate(el => {
            const r = el.getBoundingClientRect(), css = getComputedStyle(el), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            const hit = document.elementFromPoint(cx, cy), clips = [];
            for (let p = el.parentElement; p; p = p.parentElement) {
              const s = getComputedStyle(p), a = p.getBoundingClientRect();
              if (/(hidden|auto|scroll|clip)/.test(s.overflowX) && (r.left < a.left - 1 || r.right > a.right + 1)) clips.push(p.id || p.className || p.tagName);
              if (/(hidden|auto|scroll|clip)/.test(s.overflowY) && (r.top < a.top - 1 || r.bottom > a.bottom + 1)) clips.push(p.id || p.className || p.tagName);
            }
            return { label: el.getAttribute('aria-label') || el.textContent.trim(), tag: el.tagName, classes: el.className,
              x: r.left, y: r.top, width: r.width, height: r.height, minWidth: css.minWidth, minHeight: css.minHeight,
              radius: css.borderRadius, display: css.display, clippedBy: clips,
              fits: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1,
              hit: hit === el || el.contains(hit), disabled: el.disabled || false };
          });
          item.measurements.push({ state, selector, ...m });
          expect(m.width >= 43.99 && m.height >= 43.99, `${state}: ${m.label} >= 44x44`, m);
          expect(m.fits && !m.clippedBy.length, `${state}: ${m.label} reachable within viewport/scroll panel`, m);
          expect(m.hit, `${state}: ${m.label} center hit-test reaches its control`, m);
          expect(m.tag === (selector.includes('.home') ? 'A' : 'BUTTON'), `${state}: ${m.label} remains native`, m.tag);
          if (m.classes.includes('swatch')) expect(Math.abs(m.width - m.height) < 0.1 && m.radius === '50%', `${state}: ${m.label} remains circular`, m);
        }
      }
      async function noOverlap(state, selector) {
        const overlaps = await page.locator(selector).evaluateAll(els => {
          const boxes = els.filter(el => el.getClientRects().length).map(el => ({ label: el.getAttribute('aria-label') || el.textContent.trim(), r: el.getBoundingClientRect() }));
          const out = [];
          for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
            const x = boxes[a], y = boxes[b];
            if (Math.min(x.r.right, y.r.right) - Math.max(x.r.left, y.r.left) > 0.5 && Math.min(x.r.bottom, y.r.bottom) - Math.max(x.r.top, y.r.top) > 0.5) out.push([x.label, y.label]);
          }
          return out;
        });
        expect(!overlaps.length, `${state}: control boxes do not overlap after wrapping`, overlaps);
      }
      async function panelFits(selector, label) {
        const m = await page.locator(selector).evaluate(el => {
          const r = el.getBoundingClientRect();
          return { fits: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1,
            noHorizontalScroll: el.scrollWidth <= el.clientWidth + 1, documentFits: document.documentElement.scrollWidth <= innerWidth + 1,
            x: r.x, y: r.y, width: r.width, height: r.height, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
        });
        expect(m.fits && m.noHorizontalScroll && m.documentFits, `${label}: bounded and no horizontal scroll`, m);
      }
      try {
        await page.goto(`${serving.origin}/games/otherworld/`, { waitUntil: 'load' });
        await page.waitForFunction(() => !!window.__ow);
        expect(await page.evaluate(() => matchMedia('(pointer:coarse)').matches) === coarse, 'requested pointer mode is real');
        expect(await page.locator('#statusBtn').isHidden(), 'Status button is hidden before a life begins');
        await activate(page.locator('.arc-set-btn'));
        if (textScale === 1.3) await activate(page.locator('.arc-set [data-r="0"][data-o="2"]'));
        expect(await page.evaluate(() => Settings.prefs.text) === textScale, 'text scale selected through real Settings');
        await panelFits('.arc-set', 'Settings'); await shot('settings');
        await activate(page.locator('.arc-set [data-close]'));
        expect(await page.locator('.arc-set-btn').evaluate(el => document.activeElement === el), 'Settings restores focus');
        for (const sel of ['.hud .home', '.hud .hbtn', '.hud .arc-set-btn', '[data-between-shortcut]']) await measure('intro', sel);
        await noOverlap('intro', '.hud .home,.hud .hbtn'); await panelFits('.hud', 'Intro header'); await shot('intro');
        // Prevent navigation only after recording native anchor activation. No
        // hub fixture is substituted; the original href must still be correct.
        await page.locator('.hud .home').evaluate(el => el.addEventListener('click', e => { e.preventDefault(); window.__owTapHomeClicked = true; }, { once: true }));
        await page.locator('.hud .home').focus();
        expect(await page.locator('.hud .home').evaluate(el => document.activeElement === el), 'Arcade link accepts focus');
        await activate(page.locator('.hud .home'));
        expect(await page.evaluate(() => window.__owTapHomeClicked === true), 'Arcade link supports native click/tap');
        expect(await page.locator('.hud .home').getAttribute('href') === '../../index.html', 'Arcade destination unchanged');
        await activate(page.locator('.feedback-container > button'));
        expect(await page.locator('.feedback-container > button').getAttribute('aria-expanded') === 'true', 'Feedback opens natively');
        await page.keyboard.press('Escape');
        expect(await page.locator('.feedback-menu').isHidden(), 'Feedback closes with Escape');
        await activate(page.locator('[data-between-shortcut]'));
        await page.locator('[data-world="asterhold"]').waitFor();
        await measure('world', '.chip', 1); await panelFits('#choose', 'World selection'); await shot('world');
        const beforeLedger = await stateText();
        await activate(page.locator('[data-ledger-open]'));
        expect(await page.locator('#ledger').isVisible(), 'ledger chip opens real ledger');
        await panelFits('#ledger', 'Memories ledger'); await shot('ledger');
        await page.keyboard.press('Escape');
        expect(await page.locator('#ledger').isHidden() && await stateText() === beforeLedger, 'ledger Escape closes without story mutation');
        await activate(page.locator('[data-world="asterhold"]'));
        await activate(page.locator('[data-gift="pocket"]'));
        await page.locator('#pname').waitFor();
        expect(await page.locator('[data-pick]').count() === 6, 'all six name chips are present');
        expect(await page.locator('.swatch').count() === 11, 'all six hair and five skin swatches are present');
        await measure('self', '.chip', 6); await measure('self', '.swatch', 11);
        await noOverlap('self', '.chip,.swatch'); await panelFits('#choose', 'Name/appearance selection');
        await page.locator('#choose').evaluate(el => { el.scrollTop = 0; }); await shot('self-top');
        await page.locator('.go').scrollIntoViewIfNeeded(); await shot('self-bottom');
        const names = await page.locator('[data-pick]').evaluateAll(els => els.map(el => el.dataset.pick));
        for (const name of [...names, ...names.slice().reverse()]) {
          await activate(page.locator(`[data-pick="${name}"]`));
          expect(await page.locator('#pname').inputValue() === name, `native name activation: ${name}`);
        }
        await page.locator('[data-pick="Haru"]').focus(); await page.keyboard.press('Tab');
        expect(await page.locator('[data-hair]').first().evaluate(el => document.activeElement === el), 'Tab reaches first hair swatch after name chips');
        await page.locator('[data-pick="Kai"]').focus(); await page.keyboard.press('Enter');
        expect(await page.locator('#pname').inputValue() === 'Kai', 'focused name chip supports Enter');
        expect(await page.locator('[data-pick="Kai"]').evaluate(el => document.activeElement === el && el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none'), 'keyboard focus is visible on name chip');
        for (const kind of ['hair', 'skin']) {
          const values = await page.locator(`[data-${kind}]`).evaluateAll((els, k) => els.map(el => el.dataset[k]), kind);
          for (const color of [...values, ...values.slice().reverse()]) {
            await activate(page.locator(`[data-${kind}="${color}"]`));
            expect(await page.evaluate(({ k, c }) => window.__ow.S.look[k] === c, { k: kind, c: color }), `native ${kind} activation: ${color}`);
            expect(await page.locator(`[data-${kind}].on`).count() === 1, `${kind} has exactly one selected swatch`);
          }
          const button = page.locator(`[data-${kind}]`).nth(1); await button.focus(); await page.keyboard.press('Space');
          const color = await button.getAttribute(`data-${kind}`);
          expect(await page.evaluate(({ k, c }) => window.__ow.S.look[k] === c, { k: kind, c: color }), `focused ${kind} swatch supports Space`);
          expect(await button.evaluate(el => document.activeElement === el && el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none'), `keyboard focus is visible on ${kind} swatch`);
        }
        const selectedLook = await page.evaluate(() => ({ ...window.__ow.S.look }));
        await activate(page.locator('.go'));
        expect(await page.evaluate(() => window.__ow.S.life.name) === 'Kai', 'native Begin keeps selected name');
        // Use the existing development hook solely to select the authored status
        // scene; rendering, status button, settings and ledger remain real DOM.
        await page.evaluate(() => { window.__ow.run('a_guild'); document.querySelector('#status').hidden = true; });
        expect(await page.locator('#statusBtn').isVisible(), 'Status button appears at the authored guild scene');
        for (const sel of ['.hud .home', '.hud .hbtn', '.hud .arc-set-btn']) await measure('active-life', sel);
        await noOverlap('active-life', '.hud .home,.hud .hbtn'); await panelFits('.hud', 'Active-life header'); await shot('active-header');
        const beforeStatus = await stateText();
        await activate(page.locator('#statusBtn'));
        expect(await page.locator('#status').isVisible(), 'Status button opens native panel');
        await panelFits('#status', 'Status'); await shot('status');
        await activate(page.locator('#status [data-close]'));
        expect(await page.locator('#status').isHidden() && await stateText() === beforeStatus, 'Status close preserves story');
        await activate(page.locator('#ledgerBtn'));
        expect(await page.locator('#ledger').isVisible(), 'header Memories button opens ledger');
        await page.keyboard.press('Escape');
        expect(await page.locator('#ledgerBtn').evaluate(el => document.activeElement === el), 'ledger restores header focus');
        await page.reload({ waitUntil: 'load' }); await page.waitForFunction(() => !!window.__ow);
        expect(await page.evaluate(() => window.__ow.S.name) === 'Kai', 'chosen name survives real reload');
        expect(JSON.stringify(await page.evaluate(() => window.__ow.S.look)) === JSON.stringify(selectedLook), 'chosen swatches survive real reload');
        // Real browser old-save path, separate from VM fixtures. a_guild already
        // awarded silver in this legacy save; startup must not pay again.
        await page.evaluate(({ key, fixture }) => localStorage.setItem(key, JSON.stringify(fixture)), { key: SAVE_KEY, fixture: OLD_SAVES[1].state });
        await page.reload({ waitUntil: 'load' }); await page.waitForFunction(() => !!window.__ow);
        containsOriginal(await page.evaluate(() => window.__ow.S), OLD_SAVES[1].state);
        expect(await page.evaluate(() => window.__ow.S.life.silver) === 17, 'legacy browser resume does not repay guild silver');
        await page.evaluate(() => window.__ow.save());
        containsOriginal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE_KEY), OLD_SAVES[1].state);
      } catch (e) {
        item.errors.push(e.stack || e.message);
        try { await shot('ERROR'); } catch { /* preserve the original failure */ }
      } finally { await context.close(); writeReport(); }
      console.log(`${variant === 'before' ? 'BASELINE' : item.violations.length || item.errors.length ? 'FAIL' : 'PASS'} ${name}: ${item.measurements.length} measured controls, ${item.violations.length} violations, ${item.errors.length} errors`);
    }
    // This is the unchanged, real browser suite, not a DOM shim or a copy of its
    // assertions. Its own save-restoration wrapper runs in another empty context.
    const context = await browser.newContext({ reducedMotion: 'reduce', serviceWorkers: 'block' });
    try {
      const page = await context.newPage(); const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await context.route('**/*', route => new URL(route.request().url()).origin === serving.origin ? route.continue() : route.abort());
      await page.goto(`${serving.origin}/tests/otherworld.html`); await page.locator('#run').click();
      await page.waitForFunction(() => /^(PASS|FAIL)/.test(document.querySelector('#summary').textContent), null, { timeout: 180000 });
      report.suite = { summary: await page.locator('#summary').textContent(), total: await page.locator('#results li').count(), failures: await page.locator('#results .fail').allTextContents(), errors };
      await page.screenshot({ path: path.join(opts.output, 'otherworld-checks.png') });
      assert.match(report.suite.summary, /^PASS/); assert.ok(report.suite.total > 0); assert.deepEqual(errors, []);
    } finally { await context.close(); }
    const failed = report.cases.filter(c => c.name.startsWith('after-') && (c.violations.length || c.errors.length));
    assert.equal(failed.length, 0, `${failed.length} final browser cases failed; see ${path.join(opts.output, 'report.json')}`);
    report.result = 'PASS';
    console.log(`PASS real browser matrix and ${report.suite.summary}; evidence: ${opts.output}`);
  } catch (e) {
    report.result = 'FAIL'; report.errors.push(e.stack || e.message); throw e;
  } finally {
    writeReport();
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
}

(async () => {
  const opts = options(process.argv.slice(2));
  sourceChecks(opts.css); saveChecks();
  console.log(`PASS ${checks} standalone source/save checks. This is not browser geometry or the existing Otherworld browser suite.`);
  if (opts.browser) await browserChecks(opts);
  else console.log('NOT RUN browser geometry/screenshots and existing Otherworld checks. Use --browser --output <dir>.');
})().catch(e => { console.error(`FAIL OW-TAP: ${e.stack || e.message}`); process.exitCode = 1; });
