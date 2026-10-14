'use strict';
/* DM-N1c: isolated, repeatable evidence for recent form at the original three sizes.
   Serve the repository locally, then run:
     node tests/diamond-manager-review.cjs http://localhost:8777 /tmp/diamond-manager-review
   Uses Playwright's installed Chromium unless CHROME_PATH is explicitly supplied.
   Fixtures live only in fresh browser contexts. Screenshots/results never enter source folders. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const origin = new URL(process.argv[2] || 'http://localhost:8777').origin;
assert.equal(new URL(origin).hostname, 'localhost', 'The game exposes __dm only on localhost.');
const output = path.resolve(process.argv[3] || process.env.DM_REVIEW_OUTPUT || path.join(os.tmpdir(), 'diamond-manager-review'));
fs.mkdirSync(output, { recursive: true });
const sizes = [[390, 844], [1440, 1000], [3440, 1440]];
const report = {
  date: new Date().toISOString(),
  commit: process.env.REVIEW_HEAD_SHA || null,
  origin,
  method: 'Fresh Chromium context per size; seeded roster fixtures and a real simulated game through the on-screen controls.',
  saveIsolation: 'Empty localStorage verified before game scripts; no user profile, imported saves or persistent browser context.',
  views: [],
};

async function capture(page, result, name) {
  const file = `${name}-${result.width}.png`;
  await page.screenshot({ path: path.join(output, file), fullPage: true });
  result.screenshots.push(file);
}

async function noOverflow(page, result, state) {
  const dimensions = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert.ok(dimensions.document <= dimensions.viewport && dimensions.body <= dimensions.viewport,
    `${state}: page overflows horizontally (${JSON.stringify(dimensions)})`);
  result.checks.push(`${state}: no horizontal page overflow`);
}

// Playwright's visible state alone does not prove that text is inside a clipped table.
async function readable(locator) {
  await locator.scrollIntoViewIfNeeded();
  assert.equal(await locator.isVisible(), true, 'Text is visible');
  const box = await locator.evaluate(element => {
    const r = element.getBoundingClientRect();
    let left = 0, right = innerWidth, top = 0, bottom = innerHeight;
    for (let p = element.parentElement; p; p = p.parentElement) {
      const style = getComputedStyle(p), b = p.getBoundingClientRect();
      if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
        left = Math.max(left, b.left); right = Math.min(right, b.right);
      }
      if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
        top = Math.max(top, b.top); bottom = Math.min(bottom, b.bottom);
      }
    }
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, clip: { left, right, top, bottom } };
  });
  assert.ok(box.left >= box.clip.left - 1 && box.right <= box.clip.right + 1 &&
    box.top >= box.clip.top - 1 && box.bottom <= box.clip.bottom + 1,
  `Text is fully within its scrolling panel: ${JSON.stringify(box)}`);
}

async function review(browser, width, height) {
  const result = { width, height, status: 'running', checks: [], screenshots: [], pageErrors: [] };
  report.views.push(result);
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: width === 390,
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => result.pageErrors.push(error.message));
  try {
    await page.addInitScript(() => { window.__reviewInitialStorageKeys = Object.keys(localStorage); });
    await page.goto(`${origin}/games/diamond-manager/`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.__dm);
    assert.deepEqual(await page.evaluate(() => window.__reviewInitialStorageKeys), []);
    await page.locator('#note #n-ok').click();
    await page.locator('#note').waitFor({ state: 'hidden' });
    result.checks.push('Fresh context starts with no saved data; welcome closes using its button');

    const fixture = await page.evaluate(() => {
      const d = window.__dm, league = d.newLeague(1310), club = league.clubs[d.DM.you];
      league.intro = false;
      const hot = club.players.find(p => p.id === club.lineup[0]);
      const cold = club.players.find(p => p.id === club.lineup[1]);
      const pitcher = d.pitchers(club).slice().sort((a, b) => d.overall(b) - d.overall(a))[0];
      // Exercise the same recording function as completed games; no new random rolls.
      for (let n = 0; n < 3; n++) d.recordForm(league, {
        home: d.DM.you, away: 1, done: true, formKey: `review:${n}`,
        box: { [hot.id]: { ab: 4, h: 2 }, [cold.id]: { ab: 4, h: 0 } },
        pbox: { [pitcher.id]: { outs: 18, r: 1 } },
      });
      if (!d.validLeague(league)) throw Error('Roster fixture must be a valid league');
      d.L = league;
      return [hot, cold, pitcher].map(p => ({
        id: p.id, name: p.name, pitcher: p.pitcher, summary: d.formSummary(p),
        base: p, current: d.formRatings(p), overall: d.overall(p),
      }));
    });
    result.players = fixture.map(({ id, name, summary }) => ({ id, name, summary }));
    await page.locator('#a-office').click();
    await page.locator('#office').waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-tab="roster"]').getAttribute('aria-selected'), 'true');

    for (const player of fixture.slice(0, 2)) {
      const label = page.locator(`[data-form-player="${player.id}"]`);
      await readable(label);
      assert.equal(await label.innerText(), player.summary);
      assert.ok((await label.locator('..').innerText()).includes(player.name), 'Form stays beside the named player');
    }
    assert.ok(fixture[0].summary.startsWith('Hot · next game +3'));
    assert.ok(fixture[1].summary.startsWith('Cold · next game -3'));
    await capture(page, result, 'roster');
    result.checks.push('Named hot and cold batters show their next-game adjustments');
    await noOverflow(page, result, 'roster');

    for (const player of fixture) {
      const row = page.locator('tr').filter({ has: page.locator(`[data-form-player="${player.id}"]`) });
      const ratings = player.pitcher ? ['stuff', 'control'] : ['contact', 'power', 'eye'];
      const first = player.pitcher ? 4 : 6;
      for (let index = 0; index < ratings.length; index++) {
        const key = ratings[index], cell = row.locator('td').nth(first + index);
        await readable(cell);
        assert.equal((await cell.innerText()).replace(/\s+/g, ' ').trim(), `${player.current[key]} base ${player.base[key]}`);
        assert.equal(await cell.locator('.base-rating').innerText(), `base ${player.base[key]}`);
      }
      const permanent = player.pitcher ? 'stamina' : 'glove';
      const cell = row.locator('td').nth(first + ratings.length);
      assert.equal((await cell.innerText()).trim(), String(player.base[permanent]));
      assert.equal(await cell.locator('.base-rating').count(), 0, `${permanent} stays permanent`);
      assert.ok((await row.locator('.ovr').innerText()).startsWith(String(player.overall)));
    }
    result.checks.push('Current/base batting and pitching ratings agree; Overall, Glove and Stamina remain permanent');

    // Leave all three changed batting columns within the phone's horizontal scroll area.
    const hotCell = page.locator('tr').filter({ has: page.locator(`[data-form-player="${fixture[0].id}"]`) }).locator('td').nth(7);
    await readable(hotCell);
    const tableScroll = await hotCell.evaluate(cell => {
      const scroller = cell.closest('.scroll-x');
      return { left: scroller.scrollLeft, width: scroller.clientWidth, content: scroller.scrollWidth };
    });
    if (width === 390) {
      assert.ok(tableScroll.content > tableScroll.width && tableScroll.left > 0, 'Phone table scrolls to the changed ratings');
    }
    result.tableScroll = tableScroll;
    await capture(page, result, 'ratings');
    await noOverflow(page, result, 'scrolled ratings');

    const rules = page.locator('details.form-help'), summary = rules.locator('summary');
    assert.equal(await rules.evaluate(node => node.open), false);
    await summary.click();
    assert.equal(await rules.evaluate(node => node.open), true);
    const rulesText = await rules.locator('p').innerText();
    for (const text of ['last five qualifying appearances', 'three plate appearances', 'Pitchers need three innings',
      'up to three either way', 'Five settled appearances', 'Glove, Speed and Stamina never change']) {
      assert.ok(rulesText.includes(text), `Rules disclose: ${text}`);
    }
    await capture(page, result, 'rules');
    await noOverflow(page, result, 'expanded rules');
    await summary.click();
    assert.equal(await rules.evaluate(node => node.open), false);
    await page.locator('#close-office').click();
    await page.locator('#office').waitFor({ state: 'hidden' });
    await page.locator('#a-office').click();
    await page.keyboard.press('Escape');
    await page.locator('#office').waitFor({ state: 'hidden' });
    result.checks.push('Rules expand and collapse; front office closes by button and Escape');

    // A second deterministic league exercises the real simulate/settle/note path, not a fabricated note.
    await page.evaluate(() => { const d = window.__dm, league = d.newLeague(1311); league.intro = false; d.L = league; });
    await page.locator('#a-sim').click();
    await page.locator('#a-after').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => window.__dm.L.live.g.done), true);
    // Keep a reference only for inspecting what the real settlement records.
    await page.evaluate(() => { window.__reviewCompletedGame = window.__dm.L.live.g; });
    await page.locator('#a-after').click();
    await page.locator('#note').waitFor({ state: 'visible' });
    const changes = await page.evaluate(() => {
      const d = window.__dm;
      return window.__reviewCompletedGame.formChanges.filter(change => change.club === d.DM.you).slice(0, 3)
        .map(change => { const p = d.L.clubs[d.DM.you].players.find(p => p.id === change.id);
          return { name: p.name, next: d.formSummary(p).split(' · next game ')[1] }; });
    });
    assert.ok(changes.length > 0, 'Real game produces qualifying form changes');
    assert.ok((await page.locator('#note .who').textContent()).includes('Iona Vale'));
    assert.match(await page.locator('#note h2').innerText(), /^A (win|loss), \d+ to \d+$/);
    for (const change of changes) {
      const line = page.locator('#note li').filter({ hasText: change.name }).filter({ hasText: 'Next game:' });
      assert.equal(await line.count(), 1, `${change.name} has one named form note`);
      await readable(line);
      assert.ok((await line.innerText()).includes(`Next game: ${change.next}.`));
    }
    result.postgameChanges = changes;
    await capture(page, result, 'iona');
    await noOverflow(page, result, 'Iona postgame note');
    await page.locator('#note #n-ok').click();
    await page.locator('#note').waitFor({ state: 'hidden' });
    assert.deepEqual(await page.evaluate(() => {
      const d = window.__dm, league = d.L, club = league.clubs[d.DM.you];
      return { day: league.day, games: club.w + club.l, live: league.live, valid: d.validLeague(league) };
    }), { day: 1, games: 1, live: null, valid: true });
    await page.locator('#a-office').click();
    await page.locator('#close-office').click();
    await page.locator('#office').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#a-sim').isVisible(), true);
    result.checks.push('Real game settles once; Iona names the changed players and current adjustments; close returns to the field');
    await noOverflow(page, result, 'returned to field');
    assert.deepEqual(result.pageErrors, [], 'No uncaught page errors');
    result.checks.push('No page errors');
    result.status = 'pass';
    console.log(`PASS ${width}x${height}: ${result.checks.length} review checks`);
  } catch (error) {
    result.status = 'fail';
    result.error = error.stack || String(error);
    await capture(page, result, 'failure').catch(() => {});
    console.error(`FAIL ${width}x${height}: ${error.message}`);
  } finally {
    await context.close();
  }
}

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
    for (const [width, height] of sizes) await review(browser, width, height);
  } catch (error) {
    report.error = error.stack || String(error);
    console.error(error);
  } finally {
    if (browser) await browser.close();
    report.status = !report.error && report.views.length === sizes.length && report.views.every(view => view.status === 'pass') ? 'pass' : 'fail';
    fs.writeFileSync(path.join(output, 'browser-result.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(`Diamond Manager review: ${report.status.toUpperCase()} (${output})`);
    if (report.status !== 'pass') process.exitCode = 1;
  }
})();
