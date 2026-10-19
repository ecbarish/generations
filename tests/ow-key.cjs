'use strict';
// OW-KEY: run the real boot handler, dialogue and story/save code without browser dependencies.
// The small DOM adapter does not render or synthesize native keyboard clicks; those are checked
// below as an unconsumed key followed by the real button click listener. Normal browser checks
// remain tests/otherworld.html. Run: node tests/ow-key.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
let checks = 0;
const check = (value, label) => { assert.ok(value, label); checks++; };

function game() {
  const listeners = {}, stored = new Map([['another-game-save', 'unchanged']]);
  const document = { activeElement: null, addEventListener(type, fn) { (listeners[type] ||= []).push(fn); } };
  class Element {
    constructor(tag = 'div', className = '') {
      this.tagName = tag.toUpperCase(); this.className = className; this.children = [];
      this.dataset = {}; this.attributes = {}; this.events = {}; this.hidden = false; this.disabled = false;
      this.classList = {
        contains: name => this.className.split(/\s+/).includes(name),
        add: name => { if (!this.classList.contains(name)) this.className += ' ' + name; },
        remove: name => { this.className = this.className.split(/\s+/).filter(x => x !== name).join(' '); },
        toggle: (name, on) => { (on ? this.classList.add : this.classList.remove)(name); }
      };
    }
    appendChild(el) { el.parentNode = this; this.children.push(el); return el; }
    append(el) { this.appendChild(el); }
    setAttribute(k, v) { this.attributes[k] = String(v); }
    get isConnected() { return true; }
    focus() { document.activeElement = this; }
    remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(x => x !== this); }
    contains(el) { return el === this || this.children.some(x => x.contains(el)); }
    addEventListener(type, fn) { (this.events[type] ||= []).push(fn); }
    click() { if (!this.disabled) for (const fn of this.events.click || []) fn({ target: this, stopPropagation() {} }); }
    matches(selector) {
      return selector.split(',').some(s => {
        s = s.trim();
        if (s === 'button:not(.dlg-choices button):not(.dlg-continue)')
          return this.tagName === 'BUTTON' && !this.closest('.dlg-choices') && !this.classList.contains('dlg-continue');
        if (s.includes(' ')) {
          const at = s.lastIndexOf(' ');
          return this.matches(s.slice(at + 1)) && !!this.parentNode?.closest(s.slice(0, at));
        }
        if (s[0] === '.') return this.classList.contains(s.slice(1));
        if (s[0] === '#') return this.id === s.slice(1);
        if (s[0] === '[') return false; // Optional presentation-only shortcuts are absent in this adapter.
        return this.tagName === s.toUpperCase();
      });
    }
    closest(selector) { return this.matches(selector) ? this : this.parentNode?.closest(selector) || null; }
    querySelectorAll(selector) {
      return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    set innerHTML(html) {
      this.children = []; this.textContent = html.replace(/<[^>]*>/g, '');
      if (html.includes('class="dlg-face"')) {
        for (const [tag, cls] of [['canvas', 'dlg-face'], ['div', 'dlg-body']]) this.append(new Element(tag, cls));
        const body = this.querySelector('.dlg-body');
        for (const [tag, cls] of [['b', 'dlg-who'], ['span', 'dlg-role'], ['p', 'dlg-say'], ['p', 'dlg-reader'],
          ['div', 'dlg-choices'], ['button', 'dlg-continue']]) body.append(new Element(tag, cls));
      }
    }
    getContext() { return new Proxy({}, { get: () => () => {} }); }
  }
  const ids = {};
  for (const id of ['stage', 'choose', 'status', 'statusBtn', 'where', 'hudRight']) {
    ids[id] = new Element(); ids[id].id = id;
  }
  ids.choose.hidden = ids.status.hidden = true;
  document.head = new Element('head'); document.body = new Element('body');
  document.getElementById = id => ids[id]; document.createElement = tag => new Element(tag);
  const context = vm.createContext({ console, document, location: { hostname: 'localhost' },
    Settings: { create() {}, trapTab() {} }, setupFeedback() {}, setScene() {}, SCENES: {},
    MutationObserver: class { observe() {} }, matchMedia: () => ({ matches: false }),
    setInterval() {}, setTimeout() {}, clearTimeout() {},
    Arcade: { validators: {}, load: key => stored.has(key) ? JSON.parse(stored.get(key)) : null,
      save: (key, value) => stored.set(key, JSON.stringify(value)), report() {} }
  });
  context.window = context;
  const run = code => vm.runInContext(code, context);
  for (const file of ['shared/dialogue.js', ...['00-data', '01-game', '03-lanthorn', '04-hearthmere',
    '05-ashen', '06-memories', '08-open-choices', '99-boot'].map(name => `games/otherworld/js/${name}.js`)])
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  function key(key, target = context.__ow.D.el, repeat = false) {
    const event = { key, target, repeat, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
    for (const fn of listeners.keydown || []) fn(event);
    return event;
  }
  function fixture(mask) {
    run(`S = fresh(); S.life = { world: 'asterhold', gift: 'pocket', name: 'Test', flags: {},
      at: '__key', silver: 6, status: false, mem: {} };
      NODES.__key = { lines: [['', 'Choose deliberately.']], choices: ${JSON.stringify(mask)}.map((ready, i) =>
        ({ t: 'Choice ' + i, need: () => ready, why: 'Locked', go: '__after', fx: l => { l.flags.picked = i; } })) };
      NODES.__after = { lines: [['', 'Your choice is kept.']], choices: [
        { t: 'Left', go: '__key' }, { t: 'Right', go: '__key' }] };
      run('__key'); D.skip();`);
  }
  return { context, run, key, fixture, stored, ids, Element, snapshot: () => run('JSON.stringify(S)'),
    asking: () => context.__ow.D.el.classList.contains('asking'),
    buttons: () => context.__ow.D.el.querySelectorAll('.dlg-choices button') };
}

const g = game();
// Every arrangement of zero through four locks/ready choices; the ready item's original
// index matters, so a single ready item after a lock must not select index zero.
for (let length = 0; length <= 4; length++) for (let bits = 0; bits < 2 ** length; bits++) {
  const mask = Array.from({ length }, (_, i) => !!(bits & (1 << i)));
  if (!length) continue; // No-choice narration is exercised separately below.
  for (const key of [' ', 'Enter']) for (const repeat of [false, true]) {
    g.fixture(mask); const before = g.snapshot(), event = g.key(key, undefined, repeat);
    if (mask.filter(Boolean).length === 1) {
      check(g.run('S.life.flags.picked') === mask.indexOf(true), `single ready original index: ${mask}, ${key}, ${repeat}`);
      check(g.run('S.life.at') === '__after', 'single ready choice follows the authored destination');
    } else {
      check(g.snapshot() === before && g.asking(), `zero/multiple ready choices stay open: ${mask}, ${key}, ${repeat}`);
    }
    check(event.defaultPrevented, 'generic handled Space/Enter prevents its page default');
  }
}

for (const key of [' ', 'Enter']) {
  g.fixture([true, true]); const before = g.snapshot(), saved = [...g.stored];
  for (let i = 0; i < 50; i++) g.key(key, undefined, i > 0);
  check(g.snapshot() === before && g.asking(), `${key}: holding or repeating never picks a branch`);
  check(JSON.stringify([...g.stored]) === JSON.stringify(saved), `${key}: ambiguous keys do not save or spend`);
  g.key('2'); check(g.run('S.life.flags.picked') === 1, 'number 2 still selects the second branch after repeats');
}

for (const key of ['1', '2', '3', '9']) {
  g.fixture([false, true, true]); const before = g.snapshot();
  check(g.key(key).defaultPrevented, 'asking numbered keys remain handled');
  check(key === '2' || key === '3' ? g.run('S.life.flags.picked') === Number(key) - 1 : g.snapshot() === before,
    `${key}: number keys preserve authored indexes and reject locks/missing lines`);
}
g.fixture([false, true, true]); const beforeClick = g.snapshot();
g.buttons()[0].click(); check(g.snapshot() === beforeClick, 'locked click cannot choose');
g.buttons()[2].click(); check(g.run('S.life.flags.picked') === 2, 'real dialogue click listener selects the third branch');

for (const key of [' ', 'Enter']) {
  g.fixture([true, true]); const choice = g.buttons()[1], before = g.snapshot(); choice.focus();
  check(!g.key(key, choice).defaultPrevented && g.snapshot() === before, 'focused choice key is left to native activation');
  choice.click(); check(g.run('S.life.flags.picked') === 1, 'focused second choice still activates its own click handler');
}

// The existing forms, settings and non-dialogue buttons must keep their key handling.
for (const tag of ['input', 'textarea', 'select', 'button']) for (const key of [' ', 'Enter', '2', 'Escape']) {
  g.fixture([true, true]); const target = new g.Element(tag), before = g.snapshot();
  check(!g.key(key, target).defaultPrevented && g.snapshot() === before, `${tag}: ${key} stays outside dialogue`);
}
for (const key of [' ', 'Enter', '2', 'Escape']) {
  g.fixture([true, true]); const settings = new g.Element('div', 'arc-set-bg'), child = new g.Element('span');
  settings.append(child); const before = g.snapshot();
  check(!g.key(key, child).defaultPrevented && g.snapshot() === before, 'settings descendant cannot select a story');
}
for (const id of ['choose', 'status']) for (const key of [' ', 'Enter', '2', 'Escape']) {
  g.fixture([true, true]); const before = g.snapshot(); g.ids[id].hidden = false;
  check(!g.key(key).defaultPrevented && g.snapshot() === before, `${id} overlay blocks story input`);
  g.ids[id].hidden = true;
}
for (const key of ['Tab', 'ArrowLeft', 'ArrowRight', '0', 'a']) {
  g.fixture([true, true]); const before = g.snapshot();
  check(!g.key(key).defaultPrevented && g.snapshot() === before, `${key} navigation/unrelated key remains unconsumed`);
}

for (const key of [' ', 'Enter']) {
  g.fixture([true, true]); g.run("run('__key')");
  check(!g.asking(), 'narration initially has no visible choices');
  g.key(key); g.key(key);
  check(g.asking() && g.run('S.life.at') === '__key', 'reading keys reveal the choice without choosing');
  for (let i = 0; i < 10; i++) g.key(key, undefined, true);
  check(g.asking() && g.run('S.life.at') === '__key', 'continued held reading key stops at the question');
  const before = g.snapshot(); g.key('Escape');
  check(g.asking() && g.snapshot() === before, 'Escape reveals the question without choosing');
}

for (const key of [' ', 'Enter']) {
  g.run("S.life.flags.narrationDone = 0; D.play([['', 'First line.'], ['', 'Last line.']], () => S.life.flags.narrationDone++)");
  for (let i = 0; i < 4; i++) g.key(key);
  check(g.run('sceneState === null && S.life.flags.narrationDone === 1'), 'no-choice narration still advances and finishes once');
  g.fixture([true, true]); g.run("run('__key')");
  const button = g.context.__ow.D.el.querySelector('.dlg-continue'), before = g.run('sceneState.shown');
  check(!g.key(key, button).defaultPrevented && g.run('sceneState.shown') === before, 'focused Continue key is not doubled by the document handler');
  button.click(); check(g.run('sceneState.shown') > before, 'Continue click still reveals narration');
}

g.fixture([true, true]);
g.run('NODES.__key.choices[0].need = l => l.silver > 0; NODES.__key.choices[1].need = l => l.silver > 3; S.life.silver = 2');
g.key('Enter'); check(g.run('S.life.flags.picked') === 0, 'readiness is recomputed when a choice locks while the question is open');
g.fixture([true, false]);
g.run('NODES.__key.choices[1].need = () => true');
const unlockedBefore = g.snapshot(); g.key(' ');
check(g.snapshot() === unlockedBefore && g.asking(), 'newly unlocked second choice prevents generic selection');

// Real authored beat + paid decision + real save/load functions. Storage is an isolated Map;
// browser storage recovery is separately covered by the unchanged Otherworld suite.
g.run(`S = fresh(); S.life = { world: 'asterhold', gift: 'pocket', name: 'Legacy', flags: {},
  at: 'a_pocket_job', silver: 6, status: false, mem: { tide: true } }; run('a_pocket_job'); D.skip();`);
const authoredBefore = g.snapshot();
g.key(' '); g.key('Enter');
check(g.snapshot() === authoredBefore && g.asking(), 'real Pocket Space job remains open on generic keys');
g.key('2'); g.run('D.skip(); save()');
check(g.run('S.life.flags.refusedCrate && S.life.silver === 3'), 'numbered paid refusal still spends exactly three silver');
const paidSave = g.snapshot(); g.run('S = fresh(); load(); run(S.life.at)');
check(g.snapshot() === paidSave, 'saved paid choice reloads without a repeated cost or reward');
check(g.stored.get('another-game-save') === 'unchanged', 'unrelated storage is untouched');
const legacy = { v: 1, name: 'Legacy', mem: {}, lives: [], life: { world: 'asterhold', gift: 'pocket', name: 'Legacy',
  flags: {}, at: 'a_market', silver: 9, status: true, mem: {} } };
g.stored.set('otherworld-save-v1', JSON.stringify(legacy)); g.run('S = fresh(); load(); run(S.life.at); D.skip()');
check(g.run("S.life.at === 'a_market' && S.life.silver === 9 && !!S.life.town && !!S.life.entered"), 'legacy v1 life receives current defaults and retains its purse');
const legacyBefore = g.snapshot(); g.key(' '); g.key('Enter');
check(g.snapshot() === legacyBefore, 'legacy multi-choice save is also protected from ambiguous keys');
g.run('sceneState = null');
check(!g.key('Enter').defaultPrevented, 'idle scene leaves keyboard input alone');

console.log(`PASS — ${checks} OW-KEY keyboard, dialogue, focus and save checks.`);
