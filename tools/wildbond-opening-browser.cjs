// WB-C2 exact-web-pack regression. All gameplay uses browser keyboard/touch inputs.
// Observations are screenshots/OCR and known authored colours, never game-method hooks.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const { PNG } = require('pngjs');

function geometry(size) {
  const scale = Math.max(1, Math.floor(Math.min(size.width / 384, size.height / 216)));
  return { scale, x: (size.width - 384 * scale) / 2, y: (size.height - 216 * scale) / 2 };
}
function logicalImage(buffer, size) {
  const source = PNG.sync.read(buffer), g = geometry(size);
  const result = new PNG({ width: 384, height: 216 });
  for (let y = 0; y < 216; y++) for (let x = 0; x < 384; x++) {
    const sx = Math.floor(g.x + (x + 0.5) * g.scale), sy = Math.floor(g.y + (y + 0.5) * g.scale);
    source.data.copy(result.data, (y * 384 + x) * 4, (sy * source.width + sx) * 4, (sy * source.width + sx) * 4 + 4);
  }
  return result;
}
function upscale(image, factor = 4) {
  const output = new PNG({ width: image.width * factor, height: image.height * factor });
  for (let y = 0; y < output.height; y++) for (let x = 0; x < output.width; x++) {
    const from = (Math.floor(y / factor) * image.width + Math.floor(x / factor)) * 4;
    image.data.copy(output.data, (y * output.width + x) * 4, from, from + 4);
  }
  return PNG.sync.write(output);
}
function colourPixels(image, rgb) {
  const pixels = [];
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    const i = (y * image.width + x) * 4;
    if (rgb.every((v, c) => Math.abs(image.data[i + c] - v) <= 2)) pixels.push([x, y]);
  }
  return pixels;
}
function playerTile(image) {
  // Default Rowan's #d8453a shirt, separate from Cindercub's #d8642e body.
  // Select the connected torso, not disconnected sleeves or ambient animation.
  const remaining = new Set(colourPixels(image, [216, 69, 58]).map(([x, y]) => y * 384 + x));
  const groups = [];
  while (remaining.size) {
    const first = remaining.values().next().value, queue = [first], group = [];
    remaining.delete(first);
    while (queue.length) {
      const p = queue.pop(); group.push(p);
      for (const q of [p - 384, p + 384, p - 1, p + 1]) if (remaining.delete(q)) queue.push(q);
    }
    if (group.length >= 8 && group.length <= 80) groups.push(group);
  }
  groups.sort((a, b) => b.length - a.length);
  assert(groups.length, 'Default Rowan shirt is visible in the actual game image');
  const group = groups[0];
  const cx = group.reduce((n, p) => n + p % 384, 0) / group.length;
  const cy = group.reduce((n, p) => n + Math.floor(p / 384), 0) / group.length;
  // figures.gd paints the torso at actor position +(5,2); camera clamps at y108..116.
  return { x: Math.round((cx - 6.5) / 16), y: Math.round((cy + (cy >= 104 ? 8 : 0) - 4.5) / 16), centroid: [cx, cy] };
}
const normalize = text => text.toLowerCase().replace(/[^a-z0-9]/g, '');
function matches(text, phrase) {
  const source = normalize(text), target = normalize(phrase);
  if (source.includes(target)) return true;
  if (target.length < 6) return false;
  const tolerance = Math.min(3, Math.max(1, Math.floor(target.length * 0.20)));
  // Approximate substring matching tolerates a few OCR glyph errors, never absent text.
  let row = Array.from({ length: target.length + 1 }, (_, i) => i);
  for (const char of source) {
    const next = [0];
    for (let j = 1; j <= target.length; j++) next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (char === target[j - 1] ? 0 : 1));
    if (next[target.length] <= tolerance) return true;
    row = next;
  }
  return false;
}
function crop(image, x, y, width, height) {
  const result = new PNG({ width, height });
  for (let row = 0; row < height; row++) image.data.copy(result.data, row * width * 4, ((y + row) * image.width + x) * 4, ((y + row) * image.width + x + width) * 4);
  return result;
}
function palePanels(image) {
  const remaining = new Set();
  for (let y = 0; y < 190; y++) for (let x = 0; x < 384; x++) {
    const i = (y * 384 + x) * 4, [r, g, b] = image.data.subarray(i, i + 3);
    if (r > 180 && g > 170 && b > 130 && r - g < 40 && g - b < 70) remaining.add(y * 384 + x);
  }
  const panels = [];
  while (remaining.size) {
    const first = remaining.values().next().value, queue = [first], group = [];
    remaining.delete(first);
    while (queue.length) {
      const p = queue.pop(); group.push(p);
      for (const q of [p - 384, p + 384, p - 1, p + 1]) if (remaining.delete(q)) queue.push(q);
    }
    if (group.length < 400) continue;
    const xs = group.map(p => p % 384), ys = group.map(p => Math.floor(p / 384));
    const x = Math.min(...xs), y = Math.min(...ys), width = Math.max(...xs) - x + 1, height = Math.max(...ys) - y + 1;
    if (width >= 80 && height >= 12) panels.push([x, y, width, height]);
  }
  return panels;
}
function readText(image, temporary) {
  const regions = [...palePanels(image), [14, 18, 356, 24], [8, 194, 368, 18], [196, 179, 160, 21], [322, 171, 44, 15]];
  return regions.map(([x, y, w, h], i) => {
    const file = temporary + '-' + i + '.png';
    fs.writeFileSync(file, PNG.sync.write(crop(image, x, y, w, h)));
    // Smooth enlarged glyph edges; tight crops keep scenery from dominating OCR.
    execFileSync('convert', [file, '-filter', 'Lanczos', '-resize', '400%', file], { timeout: 15000 });
    return execFileSync('tesseract', [file, 'stdout', '--psm', h <= 21 ? '7' : '6'], { encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] });
  }).join('\n');
}

async function reviewOpening(browser, api, size, method) {
  const { open, screenPoint, check, report, out } = api;
  report.openings ??= [];
  const tag = `${method}-${size.width}x${size.height}`;
  const current = await open(browser, size, null, false, { phone: method === 'touch' });
  const { page } = current;
  const record = { method, size, checkpoints: [], movement: [], fresh: true, partner: 'cindercub' };
  const start = Date.now();
  let counter = 0;
  async function observe(label, required = null) {
    let text = '', image;
    const file = `opening-${tag}-${label}.png`;
    for (let attempt = 0; attempt < 8; attempt++) {
      await page.waitForTimeout(350);
      const screenshot = await page.screenshot();
      fs.writeFileSync(path.join(out, 'screens', file), screenshot);
      image = logicalImage(screenshot, size);
      const ocrFile = path.join(out, `opening-${tag}-ocr.png`);
      text = readText(image, ocrFile);
      if (!required || required.every(value => matches(text, value))) break;
    }
    fs.writeFileSync(path.join(out, `opening-${tag}-${label}.txt`), text);
    if (required) check(required.every(value => matches(text, value)), `${tag}/${label}: visible text ${required.join(' + ')}`);
    report.screenshots.push(file);
    record.checkpoints.push({ label, file, text, seconds: (Date.now() - start) / 1000 });
    return { text, image };
  }
  async function tap(x, y) {
    const p = screenPoint(size, x, y);
    await page.touchscreen.tap(p.x, p.y);
    await page.waitForTimeout(300);
  }
  async function advance() {
    if (method === 'touch') await tap(190, 108); // dialogue accepts any ordinary tap
    else { await page.keyboard.press('Enter'); await page.waitForTimeout(300); }
  }
  async function move(direction) {
    const dirs = { up: [0, -1, 'ArrowUp'], down: [0, 1, 'ArrowDown'], left: [-1, 0, 'ArrowLeft'], right: [1, 0, 'ArrowRight'] };
    const [dx, dy, key] = dirs[direction];
    if (method === 'touch') {
      const p = screenPoint(size, 80 + dx * 12, 184 + dy * 12);
      const session = await page.context().newCDPSession(page);
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
      await page.waitForTimeout(100);
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await session.detach();
    } else {
      await page.keyboard.down(key); await page.waitForTimeout(100); await page.keyboard.up(key);
    }
    await page.waitForTimeout(500);
  }
  async function position() { return playerTile(logicalImage(await page.screenshot(), size)); }
  async function walkTo(x, y) {
    // Authored clear corridors, closed-loop position from pixels only.
    for (let i = 0; i < 24; i++) {
      const before = await position();
      if (before.x === x && before.y === y) return;
      const direction = before.y !== y ? (before.y < y ? 'down' : 'up') : before.x < x ? 'right' : 'left';
      await move(direction);
      const after = await position();
      record.movement.push({ before, direction, after });
      check(before.x !== after.x || before.y !== after.y, `${tag}: ${direction} visibly moves Rowan`);
    }
    throw Error(`${tag}: did not reach ${x},${y} through ordinary movement`);
  }
  try {
    await observe('howto', ['How to play']);
    await advance();
    await observe('short-arrival', ['supply cart', 'ranch fence']);
    await advance();
    await observe('maren-register', ['Every tamer signs', 'register']);
    await advance();
    await observe('register', ['Ranch Register']);
    if (method === 'touch') await tap(270, 173);
    else {
      for (let i = 0; i < 9; i++) await page.keyboard.press('ArrowDown');
      await advance();
    }
    await observe('signed-colour', ['ink dries']);
    await advance(); await advance(); await advance();
    await observe('barn-invitation', ['Come to the barn']);
    await advance();
    await observe('follow-maren', ['Follow Maren']);
    await page.waitForTimeout(1800); // clear signing particles and let Maren lead
    await walkTo(11, 6);
    await walkTo(18, 6);
    await move('up');
    await move('up'); // authored barn threshold; map transition owns the landing
    await observe('barn-greeting', ['Three young ones']);
    await advance();
    await observe('choose-in-world', ['Walk up to one']);
    await walkTo(11, 5);
    await walkTo(8, 5);
    // The young creature may be in any of its six authored stall cells.
    // Search bounded neighbouring positions; stop as soon as the visible card opens.
    let card = false;
    for (const direction of [null, 'up', 'left', 'right', 'right', 'left', 'down', 'left']) {
      if (direction) await move(direction);
      let seen = await observe(`approach-${counter++}`);
      if (method === 'touch') {
        // No Meet button means no interaction is available; never tap the world fallback.
        if (!matches(seen.text, 'Meet')) continue;
        await tap(344, 178);
      } else await page.keyboard.press('Enter');
      seen = await observe(`meet-${counter++}`);
      if (matches(seen.text, 'Choose Cindercub')) { card = true; break; }
    }
    check(card, `${tag}: Cindercub card opens through walking and Meet`);
    await observe('partner-card', ['Choose Cindercub', 'Not yet']);
    if (method === 'touch') await tap(312, 190);
    else await advance(); // default selection must be Not yet
    await observe('declined', ['Walk up to one']);
    await page.waitForTimeout(400);
    if (method === 'touch') await tap(344, 178); else await advance();
    await observe('card-reopened', ['Choose Cindercub', 'Not yet']);
    if (method === 'touch') await tap(230, 190);
    else { await page.keyboard.press('ArrowLeft'); await advance(); }
    const acquired = await observe('partner-acquired', ['kneel in the straw', 'Cindercub']);
    check(colourPixels(acquired.image, [216, 100, 46]).length >= 3, `${tag}: selected Cindercub is visibly coloured after bonding`);
    await advance(); await advance(); await advance();
    await observe('heritage-after-bond', ['grandmother', 'land grew tired']);
    await advance();
    await observe('harvest-after-bond', ['harvest supper']);
    await advance(); await advance(); await advance();
    await observe('partner-control', ['Walk out into Larkhaven', 'Cindercub']);
    const before = await position();
    await move('down');
    const after = await position();
    check(after.x === before.x && after.y === before.y + 1, `${tag}: control returns and Rowan walks a full tile with partner`);
    const finished = await observe('movement-with-partner', ['Cindercub']);
    check(colourPixels(finished.image, [216, 100, 46]).length >= 3, `${tag}: acquired partner remains visible after movement`);
    check(current.errors.length === 0, `${tag}: complete opening has no browser/game-script errors`);
    record.controlReturned = true;
    record.partnerAcquired = true;
    record.regainedMovement = { before, after };
    record.completed = true;
    report.openings.push(record);
  } finally { await current.context.close(); }
}
module.exports = { reviewOpening, logicalImage, playerTile, normalize, matches, readText };
