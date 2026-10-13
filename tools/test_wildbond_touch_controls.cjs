// Offline whole-opening touch observer checks. Optional --screens DIR adds
// actual browser-negative/Sign fixtures; --card FILE adds a real phone card.
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { PNG } = require('pngjs');
const { controlObservation, stallStep, meetLabel } = require('./wildbond-opening-browser.cjs');
for (const text of ['Meet', 'Mect', 'Meel']) assert(meetLabel(text));
for (const text of ['Feed', 'Next', 'Greet', 'Read', 'Talk', 'Walk up and tap Meet', '']) assert(!meetLabel(text));
// Every authored starter cell must be reachable by adjacency without stepping
// into the creature or leaving the first-stall approach rectangle.
for (const sx of [7, 8, 9]) for (const sy of [3, 4]) {
  let player = { x: 8, y: 5 }, found = false;
  const visited = new Set(), blocked = new Set();
  for (let attempt = 0; attempt < 18; attempt++) {
    if (Math.abs(player.x - sx) + Math.abs(player.y - sy) === 1) { found = true; break; }
    visited.add(`${player.x},${player.y}`);
    const next = stallStep(player, visited, blocked);
    assert(next, `Reachable neighbour for starter ${sx},${sy}`);
    assert(next.x >= 7 && next.x <= 9 && next.y >= 4 && next.y <= 5);
    if (next.x === sx && next.y === sy) blocked.add(`${next.x},${next.y}`);
    else player = { x: next.x, y: next.y };
  }
  assert(found, `Starter at ${sx},${sy} found within bounded search`);
}
// A blocked requested cell must be routed around using observed position.
const around = stallStep({ x: 8, y: 5 }, new Set(['8,5']), new Set(['8,4']));
assert(around && !(around.x === 8 && around.y === 4));
const temporary = fs.mkdtempSync('/tmp/wb-touch-controls-');
let real = 0;
function inspect(file, expected) {
  const bytes = fs.readFileSync(file), image = PNG.sync.read(bytes), size = { width: image.width, height: image.height };
  for (const kind of ['meet', 'sign', 'choose', 'notyet']) {
    const observed = controlObservation(bytes, size, kind, path.join(temporary, 'control'));
    assert.equal(observed.visible, expected.includes(kind), `${file}: ${kind}, background=${observed.background}, text=${observed.text}`);
  }
  console.log('PASS actual screenshot', file, expected);
  real++;
}
try {
  for (let i = 2; i < process.argv.length; i += 2) {
    const argument = process.argv[i], value = process.argv[i + 1];
    if (argument === '--screens') {
      inspect(path.join(value, 'opening-touch-812x375-approach-0.png'), []);
      inspect(path.join(value, 'opening-touch-812x375-meet-15.png'), []);
      inspect(path.join(value, 'opening-touch-812x375-register.png'), ['sign']);
    } else if (argument === '--card') inspect(value, ['choose', 'notyet']);
    else if (argument === '--meet') inspect(value, ['meet']);
    else throw Error('Use --screens DIR, --card FILE, or --meet FILE');
  }
  console.log(`PASS crop-local controls, all six starter positions, blocked movement, and ${real} actual screenshots`);
  if (!process.argv.includes('--meet')) console.log('NOTE: no real visible-Meet screenshot supplied; runtime must capture and verify the positive button.');
} finally { fs.rmSync(temporary, { recursive: true, force: true }); }
