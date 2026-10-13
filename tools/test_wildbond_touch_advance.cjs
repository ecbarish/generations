// Offline observer regression. Optional arguments are real dialogue screenshots;
// no browser, server, game state changes, or network access are used.
const fs = require('fs');
const assert = require('assert/strict');
const { PNG } = require('pngjs');
const { dialogueTapPoint, logicalImage } = require('./wildbond-opening-browser.cjs');
function blank() {
  const image = new PNG({ width: 384, height: 216 });
  for (let p = 0; p < image.data.length; p += 4) image.data[p + 3] = 255;
  return image;
}
function panel(image, x, y, width, height) {
  for (let dy = y; dy < y + height; dy++) for (let dx = x; dx < x + width; dx++) {
    const p = (dy * image.width + dx) * 4;
    image.data.set([244, 233, 205, 255], p);
  }
  return image;
}
function safe(target) {
  const [px, py] = target.point;
  assert(target.panels.every(([x, y, w, h]) => px < x - 4 || px > x + w + 4 || py < y - 4 || py > y + h + 4));
  assert(Math.hypot(px - 80, py - 184) > 36, 'Dialogue tap stays clear of the thumb pad');
  assert(Math.hypot(px - 344, py - 178) > 24, 'Dialogue tap stays clear of Meet');
  assert(!(px > 340 && py < 40), 'Dialogue tap stays clear of field book');
}
// The failed barn greeting covers the previous fixed point once its border is included.
const barn = dialogueTapPoint(panel(blank(), 129, 73, 238, 33));
safe(barn);
assert(barn.panels.some(([x, y, w, h]) => 190 >= x - 4 && 190 <= x + w + 4 && 108 >= y - 4 && 108 <= y + h + 4));
assert.notDeepEqual(barn.point, [190, 108]);
// A moved bubble must select another ordinary world point instead of blindly tapping.
const left = dialogueTapPoint(panel(blank(), 4, 20, 240, 140));
safe(left);
assert(left.point[0] > 244);
assert.throws(() => dialogueTapPoint(blank()), /visible dialogue panel/);
assert.throws(() => dialogueTapPoint(panel(blank(), 0, 0, 384, 190)), /empty-world touch target/);
let count = 0;
for (const file of process.argv.slice(2)) {
  const bytes = fs.readFileSync(file), image = PNG.sync.read(bytes);
  const target = dialogueTapPoint(logicalImage(bytes, { width: image.width, height: image.height }));
  safe(target);
  console.log('PASS real screenshot', file, JSON.stringify(target));
  count++;
}
console.log(`PASS touch advance: four synthetic cases and ${count} real dialogue screenshots`);
