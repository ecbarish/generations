// Explicitly authorized post-publication verification only. No request routing,
// response overrides, filesystem exposure, fixture injection, or pack mutation.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const { chromium } = require('playwright');
const { reviewOpening } = require('./wildbond-opening-browser.cjs');

const OFFICIAL = 'https://ecbarish.github.io/generations/play/wildbond/';
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'live-opening-review');
const expected = JSON.parse(fs.readFileSync(path.join(root, 'play/wildbond/build.json'), 'utf8'));
const source = process.env.WB_SOURCE_COMMIT;
function authorizedRelease() {
assert(process.env.WB_LIVE_OPENING_APPROVED === '1', 'Post-publication live test requires explicit WB_LIVE_OPENING_APPROVED=1');
assert(/^[0-9a-f]{40}$/.test(source || '') && source.startsWith('c8fa1c8'), 'Pin the exact approved WB-C2 merged source SHA, beginning c8fa1c8');
assert.equal(expected.source_commit, source, 'Committed release manifest must identify the approved WB-C2 source');
assert(/^[0-9a-f]{64}$/.test(expected.sha256?.['index.pck'] || ''), 'Committed pack digest is required');
}
const report = { completed: false, suite: 'live-opening', url: OFFICIAL, source_commit: source,
  expected_pack_sha256: expected.sha256['index.pck'], checks: [], consoles: [], screenshots: [], openings: [], loads: [], error: null };
fs.mkdirSync(path.join(out, 'screens'), { recursive: true });
const check = (ok, label) => { assert(ok, label); report.checks.push(label); console.log('PASS ' + label); };
function screenPoint(size, x, y) {
  const scale = Math.max(1, Math.floor(Math.min(size.width / 384, size.height / 216)));
  return { x: (size.width - 384 * scale) / 2 + x * scale, y: (size.height - 216 * scale) / 2 + y * scale };
}
function officialResponse(response, name) {
  assert.equal(response.url(), OFFICIAL + name, 'Unexpected live-resource URL or redirect');
  assert.equal(response.status(), 200, 'Live resource must return HTTP 200');
}
async function open(browser, size, fixture, before, options = {}) {
  assert.equal(fixture, null, 'No save injection is permitted for live opening');
  assert.equal(before, false, 'No previous-pack override is permitted live');
  assert.equal(options.settings, undefined, 'No settings injection is permitted live');
  const context = await browser.newContext({ viewport: size, hasTouch: !!options.phone, isMobile: !!options.phone });
  const page = await context.newPage();
  const errors = [];
  let load = null;
  const bodies = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    const line = message.text();
    report.consoles.push({ type: message.type(), line, size });
    if (/SCRIPT ERROR|Parse Error|Failed to load script|Aborted\(/.test(line)) errors.push(line);
  });
  page.on('response', response => {
    if (new URL(response.url()).pathname !== '/generations/play/wildbond/index.pck') return;
    bodies.push((async () => {
      officialResponse(response, 'index.pck');
      const body = await response.body();
      const sha256 = crypto.createHash('sha256').update(body).digest('hex');
      assert.equal(sha256, expected.sha256['index.pck'], 'The actual browser-loaded pack must match the reviewed committed digest');
      load = { size, method: options.phone ? 'touch' : 'keyboard', url: response.url(), status: response.status(), bytes: body.length, sha256, fromServiceWorker: response.fromServiceWorker() };
      report.loads.push(load);
    })().catch(error => { errors.push('Pack verification: ' + error.message); }));
  });
  try {
    const manifest = await context.request.get(OFFICIAL + 'build.json', { headers: { 'Cache-Control': 'no-cache' }, timeout: 60000 });
    officialResponse(manifest, 'build.json');
    assert.deepEqual(await manifest.json(), expected, 'Live manifest must equal the exact committed release manifest');
    const response = await page.goto(OFFICIAL, { timeout: 90000 });
    assert.equal(response.url(), OFFICIAL, 'Official page must load without a cross-site or path redirect');
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => !document.querySelector('#status'), null, { timeout: 90000 });
    await Promise.all(bodies);
    check(load !== null, `${size.width}x${size.height}: witnessed actual live pack response body`);
    check(errors.length === 0, `${size.width}x${size.height}: live pack digest and startup are clean`);
    await page.waitForTimeout(1200);
    return { context, page, errors };
  } catch (error) { await context.close(); throw error; }
}
(async () => {
  let browser;
  try {
    authorizedRelease();
    browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    for (const [size, method] of [[{ width: 1920, height: 1080 }, 'keyboard'], [{ width: 812, height: 375 }, 'touch']]) {
      await reviewOpening(browser, { open, screenPoint, check, report, out }, size, method);
    }
    check(report.loads.length === 2 && report.loads.every(load => load.sha256 === expected.sha256['index.pck']), 'Both fresh browsers used the exact reviewed live pack');
    const mandatory = 'howto short-arrival maren-register register signed-colour barn-invitation follow-maren barn-greeting choose-in-world partner-card declined card-reopened partner-acquired heritage-after-bond harvest-after-bond partner-control movement-with-partner'.split(' ');
    assert.equal(report.openings.length, 2);
    assert.deepEqual(new Set(report.openings.map(c => c.method)), new Set(['keyboard', 'touch']));
    for (const entry of report.openings) {
      assert(entry.completed && entry.partnerAcquired && entry.controlReturned && entry.fresh);
      assert.equal(entry.partner, 'cindercub');
      assert(mandatory.every(label => entry.checkpoints.some(capture => capture.label === label)), 'All live visual checkpoints are mandatory');
      const { before, after } = entry.regainedMovement;
      assert(after.x === before.x && after.y === before.y + 1, 'Live movement must visibly resume after the bond');
      for (const capture of entry.checkpoints) {
        const png = fs.readFileSync(path.join(out, 'screens', capture.file));
        assert(png.length > 1000 && png.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')));
        assert.equal(png.readUInt32BE(16), entry.size.width);
        assert.equal(png.readUInt32BE(20), entry.size.height);
      }
    }
    report.completed = true;
    console.log('LIVE OPENING REVIEW PASSED');
  } catch (error) {
    report.error = error.stack || String(error);
    console.error(report.error);
    process.exitCode = 1;
  } finally {
    report.checked_at = new Date().toISOString();
    fs.writeFileSync(path.join(out, 'live-opening.json'), JSON.stringify(report, null, 2) + '\n');
    if (browser) await browser.close();
  }
})();
