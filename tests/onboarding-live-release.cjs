/* ONBOARD-KIT1 public release gate. Fresh synthetic profiles only.
   SOURCE_REF=<approved commit> node tests/onboarding-live-release.cjs [root] [output]
   Expected bytes always come from the resolved immutable git commit, not the
   working tree. The browser consumes actual HTTPS responses without replacement.
   --self-test checks the manifest/hash gate offline; it does not claim live QA. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync, spawn } = require('node:child_process');
const DEFAULT_BASE = 'https://ecbarish.github.io/generations/';
const ROOT_DOCUMENTS = ['games/realmbound/index.html', 'tests/onboarding-reference.html'];
const REQUIRED = ['shared/onboarding.js', 'shared/onboarding.css', 'games/realmbound/index.html',
  'games/realmbound/js/00-core.js', 'games/realmbound/js/10-state.js', 'games/realmbound/js/26-onboarding.js',
  'games/realmbound/js/99-boot.js', 'games/realmbound/style.css', 'games/realmbound/phone.css'];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function publicBase(value) {
  const url = new URL(value);
  assert.equal(url.protocol, 'https:', 'Public base must use HTTPS');
  assert.ok(!url.username && !url.password && !url.search && !url.hash, 'Public base must be a plain site URL');
  if (!url.pathname.endsWith('/')) url.pathname += '/';
  return url.href;
}
function localDependency(reference, owner, base) {
  const url = new URL(reference, new URL(owner, base)), site = new URL(base);
  if (url.origin !== site.origin) return null;
  assert.ok(url.pathname.startsWith(site.pathname), 'Dependency escapes the site root: ' + reference);
  const file = decodeURIComponent(url.pathname.slice(site.pathname.length));
  assert.ok(file && !file.split('/').includes('..'), 'Unsafe dependency path: ' + reference);
  return file;
}
function dependencies(file, bytes, base) {
  const text = bytes.toString('utf8'), found = [];
  if (file.endsWith('.html')) {
    for (const tag of text.matchAll(/<(script|link)\b[^>]*>/gi)) {
      if (tag[1].toLowerCase() === 'link' && !/\brel\s*=\s*["']stylesheet["']/i.test(tag[0])) continue;
      const attribute = tag[1].toLowerCase() === 'script' ? 'src' : 'href';
      const value = tag[0].match(new RegExp('\\b' + attribute + '\\s*=\\s*["\']([^"\']+)["\']', 'i'));
      if (value) found.push({ reference: value[1], requiredInBrowser: true });
    }
  }
  if (file.endsWith('.css')) {
    for (const match of text.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)|@import\s+["']([^"']+)["']/gi)) {
      const reference = match[1] || match[2];
      if (!reference.startsWith('data:') && !reference.startsWith('#')) found.push({ reference, requiredInBrowser: false });
    }
  }
  return found.map(item => ({ file: localDependency(item.reference, file, base), requiredInBrowser: item.requiredInBrowser })).filter(item => item.file);
}
function buildManifest(source, base, read) {
  const pending = ROOT_DOCUMENTS.map(file => ({ file, requiredInBrowser: true })), files = new Map();
  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    if (files.has(item.file)) {
      if (item.requiredInBrowser) files.get(item.file).requiredInBrowser = true;
      continue;
    }
    const bytes = read(item.file);
    files.set(item.file, { ...item, bytes: bytes.length, expected: hash(bytes) });
    pending.push(...dependencies(item.file, bytes, base));
  }
  for (const file of REQUIRED) assert.ok(files.has(file), 'Approved dependency manifest is missing ' + file);
  return { source, base, files: [...files.values()].sort((a, b) => a.file.localeCompare(b.file)) };
}
async function fetchHashes(manifest, timeout, fetcher = fetch) {
  return Promise.all(manifest.files.map(async item => {
    const url = new URL(item.file, manifest.base);
    url.searchParams.set('onboarding-release', manifest.source + '-' + Date.now());
    try {
      const response = await fetcher(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(timeout) });
      const actual = hash(Buffer.from(await response.arrayBuffer()));
      return { ...item, url: url.href, status: response.status, actual, ok: response.ok && actual === item.expected };
    } catch (error) { return { ...item, url: url.href, ok: false, error: error.message }; }
  }));
}
async function browserReview(root, out, manifestPath, manifest) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, 'onboarding-browser.cjs'), root, path.join(out, 'browser')], {
      cwd: root, stdio: 'inherit', env: { ...process.env, ONBOARDING_BASE_URL: manifest.base, ONBOARDING_PUBLIC_MANIFEST: manifestPath }
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? resolve() : reject(Error('Actual public browser review failed: exit ' + code + ', signal ' + signal)));
  });
}
async function main() {
  const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
  const out = path.resolve(process.argv[3] || '/tmp/onboarding-live-release');
  fs.mkdirSync(out, { recursive: true });
  const report = { started: new Date().toISOString(), passed: false, attempts: [] };
  const write = (name, value) => fs.writeFileSync(path.join(out, name), JSON.stringify(value, null, 2) + '\n');
  try {
    const requested = process.env.SOURCE_REF || 'HEAD';
    assert.match(requested, /^(HEAD|[a-f0-9]{7,40})$/i, 'SOURCE_REF must be HEAD or an explicit git commit');
    const source = execFileSync('git', ['rev-parse', '--verify', requested + '^{commit}'], { cwd: root, encoding: 'utf8' }).trim();
    assert.match(source, /^[a-f0-9]{40}$/i, 'Expected an immutable commit ID');
    const base = publicBase(process.env.ONBOARDING_BASE_URL || DEFAULT_BASE);
    const manifest = buildManifest(source, base, file => execFileSync('git', ['show', source + ':' + file], { cwd: root }));
    report.source = source; report.base = base; report.fileCount = manifest.files.length;
    report.coverage = '375x812 touch, 812x375 touch, 1366x768 keyboard; legacy v1/v2; reference consumer and lifecycle';
    const manifestPath = path.join(out, 'manifest.json'); write('manifest.json', manifest);
    const deadline = Date.now() + 10 * 60 * 1000;
    while (true) {
      const hashes = await fetchHashes(manifest, Math.max(1, Math.min(20000, deadline - Date.now())));
      const mismatches = hashes.filter(item => !item.ok);
      report.attempts.push({ at: new Date().toISOString(), mismatches });
      write('hashes.json', hashes); write('release-report.json', report);
      if (!mismatches.length) break;
      if (Date.now() >= deadline) throw Error('Pages did not serve the approved bytes within ten minutes: ' + JSON.stringify(mismatches));
      console.log('Waiting for approved Pages bytes: ' + mismatches.map(item => item.file).join(', '));
      await sleep(Math.min(15000, Math.max(0, deadline - Date.now())));
    }
    console.log('PASS: ' + manifest.files.length + ' public hashes match ' + source);
    await browserReview(root, out, manifestPath, manifest);
    const browser = JSON.parse(fs.readFileSync(path.join(out, 'browser/report.json'), 'utf8'));
    assert.ok(browser.passed && browser.mode === 'public' && browser.publicSource === source, 'Expected a successful actual-public browser report for the approved source');
    report.browserAssertions = browser.checks.length;
    const after = await fetchHashes(manifest, 20000); write('hashes-after-browser.json', after);
    assert.ok(after.every(item => item.ok), 'Public source changed during verification: ' + JSON.stringify(after.filter(item => !item.ok)));
    report.passed = true;
    console.log('PASS: approved public bytes, real phone/desktop input, dismissal/reload and synthetic legacy saves');
  } catch (error) {
    report.error = error.stack; console.error(error.stack); process.exitCode = 1;
  } finally {
    report.finished = new Date().toISOString(); write('release-report.json', report);
  }
}
async function selfTest() {
  const root = path.resolve(__dirname, '..');
  const source = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const manifest = buildManifest(source, DEFAULT_BASE, file => execFileSync('git', ['show', source + ':' + file], { cwd: root }));
  for (const file of REQUIRED) assert.ok(manifest.files.some(item => item.file === file && item.requiredInBrowser));
  assert.ok(manifest.files.some(item => item.file === 'shared/engine.js'));
  assert.ok(manifest.files.some(item => item.file === 'shared/settings.js'));
  assert.ok(manifest.files.some(item => item.file === 'games/realmbound/js/29-field-window.js'));
  assert.equal(publicBase(DEFAULT_BASE.slice(0, -1)), DEFAULT_BASE);
  assert.throws(() => publicBase('http://example.test/'));
  assert.throws(() => publicBase(DEFAULT_BASE + '?untrusted=true'));
  assert.equal(localDependency('../../shared/onboarding.js', ROOT_DOCUMENTS[0], DEFAULT_BASE), 'shared/onboarding.js');
  assert.equal(localDependency('https://fonts.googleapis.com/css2', ROOT_DOCUMENTS[0], DEFAULT_BASE), null);
  assert.throws(() => localDependency('/outside.js', ROOT_DOCUMENTS[0], DEFAULT_BASE));
  const css = dependencies('shared/sample.css', Buffer.from('@import "base.css";x{background:url(../images/a.png)}y{background:url(data:abc)}'), DEFAULT_BASE);
  assert.deepEqual(css.map(item => item.file), ['shared/base.css', 'images/a.png']);
  const bytes = Buffer.from('approved'), small = { source, base: DEFAULT_BASE, files: [{ file: 'sample.js', expected: hash(bytes) }] };
  const response = (body, status = 200) => async () => new Response(body, { status });
  assert.ok((await fetchHashes(small, 1000, response(bytes)))[0].ok);
  assert.ok(!(await fetchHashes(small, 1000, response('changed')))[0].ok);
  assert.ok(!(await fetchHashes(small, 1000, response(bytes, 404)))[0].ok);
  assert.ok(!(await fetchHashes(small, 1000, async () => { throw Error('offline'); }))[0].ok);
  console.log('PASS: immutable dependency manifest (' + manifest.files.length + ' files), required game/save resources, URL bounds, exact hash, HTTP failure and network failure tests. No live-browser claim.');
}
if (process.argv[2] === '--self-test') selfTest().catch(error => { console.error(error); process.exitCode = 1; });
else main();
