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
      await page.waitForFunction(() => /^(PASS|FAIL)/.test(document.querySelector('#summary').textContent), null, { timeout: 300000 });
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
    await reviewBedtime(page, shot);
    check('No browser errors', errors.length === 0, errors);
    await context.close();
    await reviewSoundReload(browser, origin);
  } finally { await browser.close(); server.close(); fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2)); }
  console.log('PASS: ' + report.checks.length + ' review checks; ' + report.screenshots.length + ' screenshots.');
})().catch(e => { server.close(); console.error(e); process.exitCode = 1; });
function documentWidth(home) { return home * 2; }

// LRL-4: trusted pointer input and real page.reload() in fresh, isolated contexts.
// Observe native Web Audio calls without replacing them. This proves scheduling and
// gating, not what a human hears or how a physical phone/WebView behaves.
async function reviewSoundReload(browser, origin) {
  report.soundReload = { method: 'Chromium mouse input, the real three-second grown-up lock, real page reloads, and native Web Audio observation. Fresh isolated local/session storage; no production saves. Not an audible or physical-phone acceptance.', cases: [] };
  for (const [width, height] of [[375, 812], [667, 375], [1366, 768]]) {
    const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
    try {
      await context.addInitScript(() => {
        window.lrl4Audio = [];
        window.lrl4Writes = [];
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (Audio) {
          const create = Audio.prototype.createOscillator;
          Audio.prototype.createOscillator = function (...args) { const node = create.apply(this, args); window.lrl4Audio.push(this); return node; };
        }
        for (const op of ['setItem', 'removeItem', 'clear']) {
          const original = Storage.prototype[op];
          Storage.prototype[op] = function (...args) { window.lrl4Writes.push({ area: this === localStorage ? 'local' : 'session', op, key: args[0] ?? null }); return original.apply(this, args); };
        }
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(origin + '/games/little-ranch/');
      await page.waitForFunction(() => !!window.LR);
      // Seed only once. Never reseed in an init script or across the reload being tested.
      await page.evaluate(() => {
        localStorage.setItem('lrl4-unrelated-save', '{"level":27,"coins":1234}');
        sessionStorage.setItem('lrl4-unrelated-session', '{"room":"kept"}');
        window.lrl4Writes.length = 0;
      });
      const storage = () => page.evaluate(() => [localStorage, sessionStorage].map(s => Object.keys(s).filter(k => s !== localStorage || k !== LR.PREF).sort().map(k => [k, s.getItem(k)])));
      const preserved = await storage();
      const open = async () => {
        const r = await page.locator('#lock').boundingBox();
        await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await page.mouse.down();
        try { await page.waitForFunction(() => !document.querySelector('#grown').hidden, null, { timeout: 6000 }); }
        finally { await page.mouse.up(); }
      };
      const snapshot = () => page.evaluate(() => ({
        sound: LR.prefs.sound, stored: localStorage.getItem(LR.PREF), navigation: performance.getEntriesByType('navigation')[0].type,
        panelHidden: document.querySelector('#grown').hidden, label: document.querySelector('#gSoundLabel').textContent,
        pressed: document.querySelector('#gSound').getAttribute('aria-pressed'), off: document.querySelector('#gSound').classList.contains('off'),
        waves: getComputedStyle(document.querySelector('#gWaves')).display !== 'none', mute: getComputedStyle(document.querySelector('#gMute')).display !== 'none',
        mode: LR.state.mode, acts: LR.state.acts, place: LR.state.place, tones: LR.tones, words: LR.words.length,
        oscillators: window.lrl4Audio.length, audioStates: [...new Set(window.lrl4Audio.map(a => a.state))], writes: window.lrl4Writes
      }));
      const shot = async name => {
        await page.locator('#grown').evaluate(panel => Promise.all(panel.getAnimations({ subtree: true }).map(animation => animation.finished)));
        await page.screenshot({ path: path.join(out, name + '.png') }); report.screenshots.push(name + '.png');
      };
      check(`LRL-4 ${width}x${height}: a fresh profile defaults to sound on without storing a visit`, (await snapshot()).sound === true && (await snapshot()).stored === null);
      for (const sound of [false, true]) {
        const label = `LRL-4 ${width}x${height} sound ${sound ? 'on' : 'off'}`;
        await open(); await page.click('#gSound');
        const chosen = await snapshot();
        check(label + ': the real switch saves only the sound choice', chosen.sound === sound && chosen.stored === JSON.stringify({ sound }) && chosen.writes.length === 1 && chosen.writes[0].area === 'local' && chosen.writes[0].op === 'setItem' && chosen.writes[0].key === 'little-ranch-settings-v1', chosen);
        for (let reload = 1; reload <= 2; reload++) {
          await page.reload(); await page.waitForFunction(() => !!window.LR);
          const loaded = await snapshot();
          check(label + ` reload ${reload}: a real reload restores the choice and starts a playable visit`, loaded.navigation === 'reload' && loaded.sound === sound && loaded.stored === JSON.stringify({ sound }) && loaded.panelHidden && loaded.mode === 'play' && loaded.acts === 0 && loaded.place === 'ranch', loaded);
          await open(); const control = await snapshot();
          check(label + ` reload ${reload}: the visible control matches the loaded choice`, control.label === (sound ? 'Sound on' : 'Sound off') && control.pressed === String(sound) && control.off === !sound && control.waves === sound && control.mute === !sound, control);
          if (reload === 1) await shot(`lrl4-${width}x${height}-sound-${sound ? 'on' : 'off'}-reloaded`);
          await page.click('#gX');
          const flowers = await page.evaluate(() => LR.layout.flowers.map(p => LR.toScreen(p)));
          for (const p of flowers) await page.mouse.click(p.x, p.y);
          await page.waitForFunction(() => LR.state.sung === 5 && LR.state.acts === 1);
          if (sound) await page.waitForFunction(() => window.lrl4Audio.length > 0 && window.lrl4Audio.every(a => a.state === 'running'));
          const played = await snapshot();
          check(label + ` reload ${reload}: five real flower taps complete an activity and obey both audio and speech gates`, played.panelHidden && played.mode === 'play' && played.acts === 1 && (sound ? played.tones > 0 && played.words > 0 && played.oscillators > 0 && played.audioStates.every(s => s === 'running') : played.tones === 0 && played.words === 0 && played.oscillators === 0), played);
          if (reload === 1) await shot(`lrl4-${width}x${height}-sound-${sound ? 'on' : 'off'}-playing`);
          await open(); await page.click('#gNew'); const restarted = await snapshot();
          check(label + ` reload ${reload}: New visit stays playable without rewriting any save`, restarted.panelHidden && restarted.mode === 'play' && restarted.acts === 0 && restarted.sound === sound && restarted.stored === JSON.stringify({ sound }) && restarted.writes.length === 0 && JSON.stringify(await storage()) === JSON.stringify(preserved), restarted);
          report.soundReload.cases.push({ width, height, sound, reload, loaded, control, played, restarted });
        }
      }
      check(`LRL-4 ${width}x${height}: no page errors across both choices and repeated reloads`, errors.length === 0, errors);
    } finally { await context.close(); }
  }
  fs.writeFileSync(path.join(out, 'lrl4-report.json'), JSON.stringify(report.soundReload, null, 2));
}

// LRL-1 accelerated QA: real browser pointer input and the existing LR.advance clock.
// Stop the production animation loop only after the original review has finished,
// so screenshot latency cannot consume a yawn or cross a bedtime threshold.
// No forced bedtime, action-count/state assignment, or disabled bedtime routine. These
// repeatable screenshots are engineering evidence, not a real-time newcomer playtest.
async function reviewBedtime(page, shot) {
  await page.evaluate(() => new Promise(resolve => {
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = () => 0;
    // Drain the already-queued production frame; its next request is now a no-op.
    // The saved browser rAF also lets the browser paint without advancing the game.
    raf(() => raf(resolve));
  }));
  const rooms = { shed: 'sign', wagon: 'wsign', kitchen: 'ksign', door: 'dsign', dough: 'tsign' };
  const roomArea = { sign: 3, wsign: 3, ksign: 0, dsign: 3, tsign: 0 };
  // newVisit leaves the camera on the Meadow. A room sign lives in the Garden or the Barn Yard,
  // so the camera has to arrive before the tap. rAF is stopped, so LR.go does not move until LR.advance.
  const showSign = sign => page.evaluate(area => { LR.go(area); LR.advance(.7); }, roomArea[sign]);
  const sizes = [[375, 812], [667, 375], [1024, 768], [1366, 768], [3440, 1440]];
  const limits = await page.evaluate(() => ({ acts: LR.BEDTIME_ACTS, seconds: LR.BEDTIME_SECS ?? 360, grace: LR.BEDTIME_GRACE ?? 6 }));
  check('LRL-1 keeps twelve different toys, a six-minute day and bounded grace', limits.acts === 12 && limits.seconds === 360 && limits.grace === 6, limits);
  report.bedtime = { method: 'Accelerated QA: real mouse taps/drags; production animation loop stopped after the original suite; only LR.advance moves game time; real resize events and enabled teeth/water/goodnight routine. Not a real-time newcomer playtest.', limits, visits: [] };
  const advance = seconds => page.evaluate(seconds => LR.advance(seconds), seconds);
  const advanceTo = seconds => page.evaluate(seconds => { if (LR.state.t < seconds) LR.advance(seconds - LR.state.t); }, seconds);
  const snapshot = () => page.evaluate(() => {
    const s = LR.state, b = s.baby;
    return { t: s.t, place: s.place, mode: s.mode, acts: s.acts, act: b.act, tx: b.tx, callback: !!b.then,
      down: !!s.down, sponge: !!(s.sponge.drag || s.sponge.auto || s.sponge.scrubbed), food: s.bowl.food,
      dusk: s.dusk, lullabyAt: s.lullabyAt, routine: s.routine && { step: s.routine.step, doing: s.routine.doing && s.routine.doing.what, said: s.routine.said },
      friend: s.friend && s.friend.act, sound: LR.prefs.sound };
  });
  const point = key => page.evaluate(key => {
    const l = LR.layout, s = LR.state;
    const points = { body: () => LR.partPoint('body'), tail: () => LR.partPoint('tail'), pot: () => l.shed.pots[2],
      passenger: () => ({ x: l.wagon.wait[0].x, y: l.wagon.wait[0].y - l.wagon.z * .5 }),
      food: () => l.kitchen.foods[0], switch: () => l.door.g.switch, lump: () => l.dough.lump,
      roll: () => ({ x: l.dough.lump.x + l.dough.lr * 2.4, y: l.dough.lump.y }),
      flower: () => l.flowers[1], friend: () => LR.fCentre(),
      baby: () => ({ x: s.baby.x, y: l.home.y - l.size * .9 }),
      peek: () => ({ x: l.bush.x, y: l.bush.y - l.R * .4 }) };
    return LR.toScreen(points[key] ? points[key]() : l[key]);
  }, key);
  const tap = async key => { const p = await point(key); await page.mouse.click(p.x, p.y); };
  const drag = async (from, to) => {
    const a = await point(from), b = await point(to);
    await page.mouse.move(a.x, a.y); await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 8 }); await page.mouse.up();
  };
  const viewport = async (width, height) => {
    await page.setViewportSize({ width, height });
    await page.waitForFunction(({ width, height }) => {
      const c = document.querySelector('canvas'), scale = Math.max(2, Math.round(Math.min(width, height) / 190));
      return c.width === Math.ceil(width / scale) && c.height === Math.ceil(height / scale);
    }, { width, height }, { polling: 50 }); // rAF is paused; the real resize event still runs layout().
  };
  const fresh = friend => page.evaluate(friend => { LR.setRoutine(true); LR.setFriend(friend); LR.newVisit(); }, friend);
  const storage = () => page.evaluate(() => [localStorage, sessionStorage].map(s => Object.keys(s).sort().map(k => [k, s.getItem(k)])));
  const storedBefore = await storage();
  await page.evaluate(() => {
    window.lrlStorageWrites = [];
    for (const op of ['setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[op];
      Storage.prototype[op] = function (...args) { window.lrlStorageWrites.push({ op, key: args[0] ?? null }); return original.apply(this, args); };
    }
  });
  const finishRoutine = async label => {
    await advance(2.1); await tap('item');
    let s = await snapshot();
    check(label + ': a real toothbrush tap starts brushing', s.act === 'brush' && s.routine.doing === 'teeth', s);
    await advance(2); await tap('item'); s = await snapshot();
    check(label + ': a real cup tap starts drinking', s.act === 'drink' && s.routine.doing === 'water', s);
    await advance(1.6); await tap('flower');
    if (await page.evaluate(() => !!LR.state.friend)) await tap('friend');
    s = await snapshot();
    check(label + ': real goodnight taps finish the routine before the lullaby', s.routine.step === 3 && s.routine.said.flowers && (s.friend === null || s.routine.said.friend), s);
    await advance(await page.evaluate(() => LR.DUSK_SECS) + 2); s = await snapshot();
    check(label + ': the lullaby leads to sleep', s.mode === 'sleep' && s.act === 'sleep' && s.dusk === 1 && s.lullabyAt !== null && (s.friend === null || s.friend === 'sleep'), s);
    return s;
  };
  for (const [width, height] of sizes) {
    await viewport(width, height);
    for (const [room, sign] of Object.entries(rooms)) {
      const label = `LRL-1 ${room} ${width}x${height}`, name = `lrl1-${room}-${width}x${height}`;
      await fresh(true); await showSign(sign); await tap(sign);
      check(label + ': the picture sign opens the room', (await snapshot()).place === room, await snapshot());
      if (room === 'shed') { await tap('pot'); await drag('body', 'tail'); }
      if (room === 'wagon') await tap('passenger');
      if (room === 'kitchen') { await tap('food'); await advance(4); }
      if (room === 'door') await tap('switch');
      if (room === 'dough') { await tap('lump'); await drag('lump', 'roll'); }
      const interacted = await page.evaluate(room => {
        const s = LR.state;
        if (room === 'shed') return Object.keys(s.shed.parts).length > 0 && s.shed.doneAt === null;
        if (room === 'wagon') return s.wagon.aboard[0] && !s.wagon.aboard[1];
        if (room === 'kitchen') return s.kitchen.berries === 1;
        if (room === 'door') return s.door.touched.switch && s.door.phase === 'shut';
        return s.dough.spin > 0 && s.dough.stamps === 0;
      }, room);
      check(label + ': real input plays with an unfinished toy', interacted);
      await advanceTo(limits.seconds - 3);
      const before = await snapshot();
      check(label + ': the unfinished room stays playable before bedtime', before.mode === 'play' && before.place === room && before.acts === 0, before);
      await shot(name + '-before');
      await advanceTo(limits.seconds + .2);
      const dusk = await snapshot();
      check(label + ': the clock automatically returns to the ranch and yawns', dusk.mode === 'dusk' && dusk.place === 'ranch' && dusk.act === 'yawn' && dusk.routine.step === 0 && dusk.lullabyAt === null && dusk.acts === 0 && !dusk.callback && dusk.tx === null && !dusk.down && !dusk.sponge, dusk);
      await shot(name + '-dusk');
      const asleep = await finishRoutine(label);
      check(label + ': no unfinished-room reward or resumed callback', asleep.acts === 0 && !asleep.callback && asleep.tx === null && asleep.food === 0 && !asleep.down && !asleep.sponge, asleep);
      await shot(name + '-asleep');
      report.bedtime.visits.push({ room, width, height, before, dusk, asleep });
    }
  }
  // Freeze an existing ranch activity inside each room, then rotate while holding a
  // real gesture across the threshold. A late release must not become a new tap.
  const holds = { shed: 'body', wagon: 'passenger', kitchen: 'food', door: 'switch', dough: 'lump' };
  for (const [room, sign] of Object.entries(rooms)) {
    const label = 'LRL-1 held/rotated ' + room;
    await viewport(375, 812); await fresh(true); await tap('peek');
    // The peek starts a walk. Moving the camera would drop that walk, so put it back before the sign tap.
    await page.evaluate(area => {
      const b = LR.state.baby, kept = { x: b.x, tx: b.tx, then: b.then, act: b.act, dir: b.dir, at: b.at };
      LR.go(area); LR.advance(.7); Object.assign(LR.state.baby, kept);
    }, roomArea[sign]);
    await tap(sign);
    let s = await snapshot();
    check(label + ': entry interrupts a real ranch activity', s.place === room && (s.callback || s.tx !== null || s.act === 'hide'), s);
    await advanceTo(limits.seconds - 2);
    const p = await point(holds[room]); await page.mouse.move(p.x, p.y); await page.mouse.down();
    if (room === 'shed' || room === 'dough') await page.mouse.move(p.x + 24, p.y, { steps: 4 });
    await viewport(667, 375); await advanceTo(limits.seconds + .2); s = await snapshot();
    check(label + ': the active gesture gets a brief grace period', s.mode === 'play' && s.place === room && s.down, s);
    await advanceTo(limits.seconds + limits.grace + .25); s = await snapshot();
    check(label + ': the grace deadline clears the old activity and pointer', s.mode === 'dusk' && s.place === 'ranch' && s.act === 'yawn' && !s.down && !s.callback && s.tx === null && s.acts === 0, s);
    const item = await point('item'); await page.mouse.move(item.x, item.y); await page.mouse.up(); s = await snapshot();
    check(label + ': late pointerup does not brush, reopen a room or grant a reward', s.place === 'ranch' && s.mode === 'dusk' && s.routine.step === 0 && !s.routine.doing && s.acts === 0, s);
    await shot('lrl1-' + room + '-rotated-late-release');
    await advance(await page.evaluate(() => LR.ROUTINE_WAIT * 3 + LR.DUSK_SECS) + 20); s = await snapshot();
    check(label + ': the unattended real routine reaches sleep without a stale reward', s.mode === 'sleep' && s.act === 'sleep' && s.routine.step === 3 && s.routine.said.flowers && s.routine.said.friend && s.lullabyAt !== null && s.acts === 0, s);
  }
  await viewport(1024, 768); await fresh(false);
  for (let i = 0; i < limits.acts; i++) { await tap('baby'); await advance(1); }
  let s = await snapshot();
  check('LRL-1 mashing one toy cannot bring bedtime early', s.mode === 'play' && s.acts <= 1 && s.t < 30, s);
  await advanceTo(limits.seconds + .3); s = await snapshot();
  check('LRL-1 the day still ends at about six minutes', (s.mode === 'dusk' || s.mode === 'sleep') && s.t >= limits.seconds, s);
  if (s.mode !== 'dusk') { await fresh(false); await advanceTo(limits.seconds + .2); s = await snapshot(); }
  await finishRoutine('LRL-1 six-minute day, no visiting friend');
  const storedAfter = await storage(), writes = await page.evaluate(() => window.lrlStorageWrites);
  check('LRL-1 creates no settings or unrelated-storage writes', writes.length === 0 && JSON.stringify(storedBefore) === JSON.stringify(storedAfter), { writes, before: storedBefore, after: storedAfter });
  check('LRL-1 keeps the existing muted sound preference', (await snapshot()).sound === false);
  fs.writeFileSync(path.join(out, 'lrl1-evidence.txt'), report.bedtime.method + '\n' +
    'All five rooms at 375x812, 667x375, 1024x768, 1366x768 and 3440x1440.\n' +
    'Stable filenames: lrl1-<room>-<width>x<height>-before/dusk/asleep.png.\n' +
    'Also: held gestures, frozen ranch activities, rotation, late pointerup, unattended routine, one-toy mash and storage-write audit.\n' +
    'Sound remains muted by the existing saved preference; lullaby scheduling is checked in state.\n');
}

