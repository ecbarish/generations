#!/usr/bin/env node
'use strict';
/* PR-AWAY: real Primordial script + real shared engine in an isolated VM.
 * Run: node tests/pr-away.cjs
 * Negative control: git show origin/main:games/primordial/index.html > /tmp/pr-before.html
 *                   node tests/pr-away.cjs --html /tmp/pr-before.html (must fail)
 * Native browser/visual evidence: node tests/pr-away.cjs --browser --output /tmp/pr-away-evidence
 * Add --baseline-html /tmp/pr-before.html to --browser for paired before/after captures.
 * Baseline measurements are recorded as violations, never treated as passing geometry.
 * Optional CHROME_PATH or PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH selects an existing Chromium.
 * Uses an already-installed Playwright (normal require/NODE_PATH); never installs a browser.
 * VM rectangles are stubs, NOT layout evidence. Only --browser measures real geometry.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const sha256 = s => createHash('sha256').update(s).digest('hex');
const ROOT = path.resolve(__dirname, '..');
const KEY = 'primordial-save-v1';
const NOW = Date.UTC(2026, 9, 15, 12);
const args = process.argv.slice(2);
let htmlPath = path.join(ROOT, 'games/primordial/index.html');
let browserMode = false, baselinePath = null, output = path.resolve('/tmp/pr-away-evidence');
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--html' && args[i + 1]) htmlPath = path.resolve(args[++i]);
  else if (args[i] === '--baseline-html' && args[i + 1]) baselinePath = path.resolve(args[++i]);
  else if (args[i] === '--output' && args[i + 1]) output = path.resolve(args[++i]);
  else if (args[i] === '--browser') browserMode = true;
  else throw Error('Usage: node tests/pr-away.cjs [--html path] [--browser] [--baseline-html path] [--output dir]');
}
if(baselinePath&&!browserMode)throw Error('--baseline-html requires --browser; use --html for a failing negative control.');
const HTML = fs.readFileSync(htmlPath, 'utf8');
const ENGINE = fs.readFileSync(path.join(ROOT, 'shared/engine.js'), 'utf8');
const SCRIPT = [...HTML.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(m => !/\bsrc\s*=/.test(m[1])).map(m => m[2]).find(s => s.includes("const KEY='primordial-save-v1'"));
assert.ok(SCRIPT, 'actual Primordial inline game script exists');
const BOOT = '/* ---------- boot ---------- */';
assert.equal(SCRIPT.split(BOOT).length, 2, 'one unambiguous hook location immediately before boot');
const clone = x => JSON.parse(JSON.stringify(x));
const plain = x => JSON.parse(JSON.stringify(x));
const withoutLast = x => { const y = clone(x); delete y.last; return y; };

// Hooks are inserted into the VM source, never into the shipped game.
// The legacy oracle is the old offline integrator, using the SAME economy functions
// in a second VM. It deliberately does not call the new offline/offer/spend methods.
const HOOKS = `
window.__awayTest = {
 get S(){return S;}, get D(){return D;}, get pending(){return typeof pendingAway==='undefined'?null:pendingAway;},
 get modal(){return modalKind;}, fresh, merge, derive, offline, save, importSave, exportSave, advance, closeModal,
 get offer(){return typeof offerAway==='function'?offerAway:null;},
 get spend(){return typeof spendAway==='function'?spendAway:null;},
 set(s){S=merge(s);D=derive();},
 legacy(sec){
   if(S.worldOffer||sec<30)return null;
   sec=Math.min(sec,86400);const eff=0.5+0.1*(S.genome.spores||0), t=sec*eff, n0=S.runTotal;
   const steps=300,h=t/steps;
   for(let k=0;k<steps;k++){D=derive();step(h);S.stats.run+=h;}
   S.stats.play+=sec;D=derive();checkMut();
   if(S.runTotal>S.stats.best)S.stats.best=S.runTotal;
   return {sec,eff,gain:S.runTotal-n0,state:JSON.parse(JSON.stringify(S))};
 }
};
`;

class EventTarget {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, cb) { if (!this.listeners.has(type)) this.listeners.set(type, []); this.listeners.get(type).push(cb); }
  removeEventListener(type, cb) { this.listeners.set(type, (this.listeners.get(type) || []).filter(x => x !== cb)); }
  dispatchEvent(event) {
    event.target ||= this; event.currentTarget = this;
    event.preventDefault ||= () => { event.defaultPrevented = true; };
    event.stopPropagation ||= () => { event.stopped = true; };
    for (const cb of this.listeners.get(event.type) || []) cb(event);
    if (event.bubbles && !event.stopped && this.parentElement) this.parentElement.dispatchEvent(event);
    return !event.defaultPrevented;
  }
}
function simpleMatch(el, selector) {
  if (!el.tagName) return false;
  const tag = selector.match(/^[a-z][\w-]*/i);
  if (tag && el.tagName.toLowerCase() !== tag[0].toLowerCase()) return false;
  for (const m of selector.matchAll(/#([\w-]+)/g)) if (el.id !== m[1]) return false;
  for (const m of selector.matchAll(/\.([\w-]+)/g)) if (!el.classList.contains(m[1])) return false;
  for (const m of selector.matchAll(/\[([\w-]+)(?:=["']?([^\]"']+)["']?)?\]/g)) {
    if (!Object.hasOwn(el.attrs, m[1])) return false;
    if (m[2] != null && el.getAttribute(m[1]) !== m[2]) return false;
  }
  return true;
}
function matches(el, selector) {
  return selector.split(',').some(part => {
    const pieces = part.trim().split(/\s+/); let current = el;
    if (!simpleMatch(current, pieces.pop())) return false;
    while (pieces.length) { const p = pieces.pop(); current = current.parentElement; while (current && !simpleMatch(current, p)) current = current.parentElement; if (!current) return false; }
    return true;
  });
}
class Element extends EventTarget {
  constructor(tag, doc) {
    super(); this.tagName = tag.toUpperCase(); this.ownerDocument = doc; this.attrs = {}; this.dataset = {};
    this.children = []; this.parentElement = null; this.style = { setProperty(k,v) { this[k] = v; } };
    this.hidden = false; this.disabled = false; this.value = ''; this._text = ''; this._html = '';
    this.classList = {
      contains: x => this.className.split(/\s+/).includes(x),
      add: (...xs) => { this.className = [...new Set([...this.className.split(/\s+/), ...xs])].filter(Boolean).join(' '); },
      remove: (...xs) => { this.className = this.className.split(/\s+/).filter(x => !xs.includes(x)).join(' '); },
      toggle: (x, force) => { const on = force === undefined ? !this.classList.contains(x) : !!force; this.classList[on ? 'add' : 'remove'](x); return on; }
    };
  }
  get id() { return this.attrs.id || ''; } set id(v) { this.attrs.id = String(v); }
  get className() { return this.attrs.class || ''; } set className(v) { this.attrs.class = String(v); }
  setAttribute(k, v) {
    this.attrs[k] = String(v);
    if (k.startsWith('data-')) this.dataset[k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(v);
    if (k === 'hidden') this.hidden = true;
    if (k === 'disabled') this.disabled = true;
    if (k === 'value') this.value = String(v);
  }
  getAttribute(k) { return this.attrs[k] ?? null; }
  get textContent() { return this._text + this.children.map(x => x.textContent).join(''); }
  set textContent(v) { this._text = String(v); this.children = []; }
  get innerHTML() { return this._html; }
  set innerHTML(v) { this._html = String(v); for (const c of this.children) c.parentElement = null; this.children = []; this._text = ''; parseHTML(this._html, this, this.ownerDocument); }
  appendChild(e) { e.parentElement = this; this.children.push(e); return e; }
  get firstChild() { return this.children[0] || null; }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(c => c !== this); this.parentElement = null; }
  matches(s) { return matches(this, s); }
  closest(s) { for (let e = this; e instanceof Element; e = e.parentElement) if (e.matches(s)) return e; return null; }
  querySelectorAll(s) { const out=[]; const visit = e => { for (const c of e.children) { if (c.matches(s)) out.push(c); visit(c); } }; visit(this); return out; }
  querySelector(s) { return this.querySelectorAll(s)[0] || null; }
  focus() { this.ownerDocument.activeElement = this; }
  select() {}
  click() { if (!this.disabled) this.dispatchEvent({ type: 'click', bubbles: true }); }
  getBoundingClientRect() { return { x:0,y:0,left:0,top:0,right:400,bottom:300,width:400,height:300 }; }
  getContext() { return new Proxy({}, { get: (_, p) => p === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {}, set: () => true }); }
}
function parseHTML(html, root, doc) {
  const stack = [root]; const clean = html.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const match of clean.matchAll(/<\/?([a-z][\w-]*)([^>]*)>|([^<]+)/gi)) {
    if (match[3]) { stack.at(-1)._text += match[3]; continue; }
    const [raw, tag, attrs] = match;
    if (raw.startsWith('</')) { for (let i = stack.length - 1; i > 0; i--) if (stack[i].tagName.toLowerCase() === tag.toLowerCase()) { stack.length = i; break; } continue; }
    const el = new Element(tag, doc);
    for (const a of attrs.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) el.setAttribute(a[1], a[2] ?? a[3] ?? a[4] ?? '');
    stack.at(-1).appendChild(el);
    if (!/^(meta|link|input|br|hr|img|source)$/i.test(tag) && !raw.endsWith('/>')) stack.push(el);
  }
}
function storage(seed) {
  const data = new Map(Object.entries(seed || {})); const writes=[];
  return { data, writes, fail: false,
    get length() { return data.size; }, key: i => [...data.keys()][i] ?? null,
    getItem: k => data.get(String(k)) ?? null,
    setItem(k,v) { if (this.fail && k === KEY) throw Error('injected quota failure'); data.set(String(k), String(v)); writes.push({key:String(k),value:String(v)}); },
    removeItem: k => data.delete(String(k)), clear: () => data.clear()
  };
}
function harness({ state, time = NOW, hidden = false, stored, hot = false, boot = true } = {}) {
  const doc = new Element('document', null); doc.ownerDocument=doc; doc.hidden=hidden; doc.activeElement=null;
  doc.createElement = tag => new Element(tag,doc); doc.getElementById = id => doc.querySelector('#'+id);
  parseHTML(HTML,doc,doc); doc.body=doc; doc.head=new Element('head',doc); doc.documentElement=doc;
  const win = new EventTarget(); const store = stored || storage(state ? {[KEY]:JSON.stringify(state)} : {});
  let clock=time, perf=0, id=0, random=731, start;
  const intervals=new Map(), timeouts=new Map(), rafs=new Map();
  const nativeMath = Object.create(Math); nativeMath.random = () => { random = (Math.imul(random,1664525)+1013904223)>>>0; return random / 4294967296; };
  class TestDate extends Date { constructor(...a) { super(...(a.length ? a : [clock])); } static now() { return clock; } }
  const context={ console, document:doc, localStorage:store, Date:TestDate, Math:nativeMath, performance:{now:()=>perf},
    location:{hostname:'pr-away.test',reload(){}}, navigator:{clipboard:{writeText:()=>Promise.resolve()}},
    matchMedia:()=>({matches:true}), URL, Blob, TextEncoder, TextDecoder,
    btoa:s=>Buffer.from(s,'binary').toString('base64'), atob:s=>Buffer.from(s,'base64').toString('binary'),
    setInterval:(cb,ms)=>{ intervals.set(++id,{cb,ms});return id;},clearInterval:id=>intervals.delete(id),
    setTimeout:(cb,ms)=>{timeouts.set(++id,{cb,at:clock+ms});return id;},clearTimeout:id=>timeouts.delete(id),
    requestAnimationFrame:cb=>{rafs.set(++id,cb);return id;},cancelAnimationFrame:id=>rafs.delete(id),
    addEventListener:win.addEventListener.bind(win),removeEventListener:win.removeEventListener.bind(win),confirm:()=>false,
    claude:{hot:{ready:cb=>{start=cb;}}}
  };
  context.window=context; vm.createContext(context);
  vm.runInContext(ENGINE,context,{filename:'shared/engine.js',timeout:10000});
  vm.runInContext(SCRIPT.replace(BOOT,HOOKS+'\n'+BOOT),context,{filename:htmlPath,timeout:10000});
  assert.equal(typeof start,'function','boot callback captured without rewriting production logic');
  const api=context.__awayTest;
  if (boot) start(hot && state ? {S:clone(state)} : {});
  return {api,doc,store,context,win,intervals,timeouts,
    get time(){return clock;}, get toasts(){return doc.querySelector('#toasts').children.map(e=>e.textContent);},
    stored(){return JSON.parse(store.getItem(KEY));},
    jump(ms){clock+=ms;perf+=ms;},
    jumpWall(ms){clock+=ms;}, jumpPerformance(ms){perf+=ms;},
    fire(ms){ const all=[...intervals.values()].filter(x=>x.ms===ms);assert.equal(all.length,1,'exactly one '+ms+'ms timer');all[0].cb(); },
    tick(ms){this.jump(ms);this.fire(100);},
    visibility(hidden){doc.hidden=hidden;doc.dispatchEvent({type:'visibilitychange'});},
    action(act,arg,extra={}) {const el=doc.createElement('button');el.setAttribute('data-act',act);if(arg!==undefined)el.setAttribute('data-arg',arg);Object.assign(el,extra);doc.dispatchEvent({type:'click',target:el});return el;},
    clickGift(){ const b=doc.querySelector('[data-act="spend-away"]');assert.ok(b,'explicit spend-away button exists');b.click();return b;},
    flushTimeouts(){for(const [i,t] of [...timeouts])if(t.at<=clock){timeouts.delete(i);t.cb();}}
  };
}
function fixture(patch={}) {
  const h=harness({boot:false}); const s=plain(h.api.fresh());
  Object.assign(s,{n:42,runTotal:42,last:NOW-120000,seed:12345},patch);
  s.tiers[0]={amt:10,bought:10};
  return s;
}
function legacy(state,sec) { const h=harness({boot:false});h.api.set(clone(state));return plain(h.api.legacy(sec)); }
function equalState(actual,expected,label) {assert.deepEqual(withoutLast(actual),withoutLast(expected),label);}
function rewardState(s) {return plain({n:s.n,runTotal:s.runTotal,tiers:s.tiers,stats:{run:s.stats.run,play:s.stats.play,best:s.stats.best},pending:s.pending,mutGranted:s.mutGranted});}
const cases=[];const test=(name,fn)=>cases.push({name,fn});

test('return opens a gift without granting nutrients, organisms, time, mutations or toasts',()=>{
  const s=fixture();const h=harness({state:s});
  equalState(h.api.S,s,'return must leave the saved economy unchanged until the button is pressed');
  assert.equal(h.api.S.last,s.last,'offer preserves the old checkpoint');assert.ok(h.api.pending,'gift is pending');
  assert.equal(h.api.modal,'offline');assert.equal(h.doc.querySelector('#modal').hidden,false);
  assert.match(h.doc.querySelector('#sheet').textContent,/gift/i);assert.doesNotMatch(h.doc.querySelector('#sheet').textContent,/kept growing|growth ran/i);
  assert.equal(h.toasts.length,0,'preview cannot announce an earned mutation');
  assert.equal(h.doc.activeElement?.dataset.act,'spend-away','gift receives initial keyboard focus');
  equalState(h.stored(),s,'stored economy is unspent');assert.equal(h.stored().last,s.last);
});

test('offline preview is pure and detached, including derived state, UI and storage',()=>{
  const s=fixture();const h=harness({boot:false});h.api.set(s);
  const before=plain(h.api.S), derived=plain(h.api.D), writes=h.store.writes.length, toastCount=h.toasts.length;
  const r=h.api.offline(120);assert.ok(r&&r.state&&r.gain>0,'preview returns sec, eff, gain and projected state');
  assert.equal(r.sec,120);assert.equal(r.eff,0.5);assert.deepEqual(plain(h.api.S),before);assert.deepEqual(plain(h.api.D),derived);
  assert.equal(h.store.writes.length,writes);assert.equal(h.toasts.length,toastCount);
  r.state.tiers[0].amt+=123;assert.deepEqual(plain(h.api.S),before,'preview cannot alias live tiers');
});

for (const [label,seconds,patch] of [
  ['ordinary 2-minute return',120,{}],['fractional threshold',30.125,{}],['one-day cap',864000,{}],
  ['Dormant Spores and mutations',1800,{genome:{spores:5,vigor:2},muts:['membrane','vacuole','quorum','glow']}],
  ['Tidal Pool phase changes',613,{world:'tide'}],['Snowball mutation multiplier',900,{world:'snowball',muts:['drift']}],
  ['Hydrothermal Vent',900,{world:'vent',genome:{spores:2},muts:['membrane','flagella']}],
  ['Sunlit Shallows',900,{world:'shallows',muts:['adhesion','spicules']}],
  ['Toxic Bloom',900,{world:'bloom',genome:{vigor:3},muts:['endo','radiate']}],
  ['Great Oxidation',900,{world:'oxygen',muts:['hive','vacuole','quorum']}],
  ['Predator Sea',900,{world:'predator',won:3,muts:['eyespot'],gm:50}]
]) test('claim exactly matches legacy rewards: '+label,()=>{
  const s=fixture(patch);s.tiers[1]={amt:4,bought:25};s.tiers[2]={amt:1,bought:1};s.last=NOW-seconds*1000;
  const expected=legacy(s,seconds);const h=harness({state:s});h.clickGift();
  equalState(h.api.S,expected.state,'same economy, breeding, best run, play time and mutation accounting');
  assert.equal(h.api.S.last,NOW);assert.equal(h.api.pending,null);assert.equal(h.api.modal,null);
  assert.equal(h.doc.activeElement?.id,'absorb','claim returns keyboard focus to the pool control');
  equalState(h.stored(),expected.state);assert.equal(h.stored().last,NOW);
});

test('an explicit button grants once; direct and queued duplicate spends are inert',()=>{
  const h=harness({state:fixture()});const b=h.clickGift(), claimed=plain(h.api.S),writes=h.store.writes.length;
  h.api.spend();h.action('spend-away');h.doc.dispatchEvent({type:'click',target:b});
  assert.deepEqual(plain(h.api.S),claimed);assert.equal(h.store.writes.length,writes,'duplicates do not save a second reward');
});

test('pending gift blocks Escape, backdrop, close, and all background game actions',()=>{
  const s=fixture({gm:1000,pending:1,offer:['membrane','flagella','pseudopod']});const h=harness({state:s});const before=plain(h.api.S);
  for(const [a,arg] of [['absorb'],['tab','gen'],['mode','max'],['buy','0'],['contest'],['draft'],['pickmut','membrane'],['gbuy','vigor'],['extinct'],['inst','feed'],['reset'],['import'],['close']])h.action(a,arg);
  h.doc.dispatchEvent({type:'keydown',key:'Escape'});h.doc.querySelector('#modal').dispatchEvent({type:'click',target:h.doc.querySelector('#modal')});h.api.closeModal();
  h.doc.querySelector('#poolWrap').dispatchEvent({type:'click',target:h.doc.querySelector('#pool'),clientX:20,clientY:20});
  const extAt=h.doc.createElement('input');extAt.id='extAt';extAt.value='999';h.doc.dispatchEvent({type:'change',target:extAt});
  assert.deepEqual(plain(h.api.S),before);assert.equal(h.api.modal,'offline');assert.ok(h.api.pending);
});

test('pending autosave, unload and repeated returns retain the unspent checkpoint and schema',()=>{
  const s=fixture();const h=harness({state:s});const p=plain(h.api.pending);
  h.jump(20000);h.fire(100);h.fire(10000);h.win.dispatchEvent({type:'beforeunload'});h.visibility(true);h.jump(45000);h.fire(10000);h.visibility(false);
  equalState(h.api.S,s);assert.equal(h.api.S.last,s.last);assert.deepEqual(plain(h.api.pending),p,'a pending gift does not grow or replace itself');
  assert.deepEqual(Object.keys(h.stored()).sort(),Object.keys(s).sort(),'no persisted gift field');
  assert.deepEqual(h.stored(),s,'autosaves and unload preserve the unspent state');
  const next=harness({stored:storage(Object.fromEntries(h.store.data)),time:h.time});
  equalState(next.api.S,s);assert.ok(next.api.pending,'reload regenerates the gift from the old checkpoint');
  assert.equal(next.api.pending.sec,(h.time-s.last)/1000);
});

test('claim is durable immediately; reload never pays the same absence again',()=>{
  const h=harness({state:fixture()});h.clickGift();const stored=clone(h.stored());
  const next=harness({stored:storage(Object.fromEntries(h.store.data)),time:h.time});
  assert.deepEqual(plain(next.api.S),stored);assert.equal(next.api.pending,null);assert.equal(next.api.modal,null);
  next.jump(10000);next.fire(10000);assert.equal(next.stored().last,stored.last,'autosave cannot fabricate progress through an unticked gap');
});

test('hidden timers and repeated hidden saves cannot grant or consume away time',()=>{
  const s=fixture({last:NOW});const h=harness({state:s});h.tick(100);const active=plain(h.api.S);
  h.visibility(true);h.jump(70000);h.fire(100);h.fire(10000);h.win.dispatchEvent({type:'beforeunload'});
  assert.deepEqual(plain(h.api.S),active);assert.deepEqual(h.stored(),active);assert.equal(h.api.pending,null);
  h.visibility(false);assert.ok(h.api.pending);assert.equal(h.api.pending.sec,70);equalState(h.api.S,active);
  h.clickGift();equalState(h.api.S,legacy(active,70).state);
});

test('initially hidden boot and hot snapshot cannot silently grant rewards',()=>{
  const s=fixture();for(const hot of [false,true]){
    const h=harness({state:s,hidden:true,hot});equalState(h.api.S,s);h.jump(40000);h.fire(100);h.fire(10000);equalState(h.api.S,s);
    h.visibility(false);assert.ok(h.api.pending);equalState(h.api.S,s);
  }
});

test('delayed visible timer offers from the saved checkpoint without first growing',()=>{
  const s=fixture({last:NOW});const h=harness({state:s});h.tick(100);const active=plain(h.api.S);
  h.jump(90000);h.fire(10000);assert.equal(h.stored().last,active.last);h.fire(100);
  equalState(h.api.S,active);assert.equal(h.api.pending.sec,90);h.clickGift();equalState(h.api.S,legacy(active,90).state);
});

for(const seconds of [29.999,30,60,60.001])test('delayed timer boundary '+seconds+' seconds',()=>{
  const s=fixture({last:NOW}),h=harness({state:s});h.tick(seconds*1000);
  if(seconds<30){assert.equal(h.api.pending,null);assert.ok(h.api.S.n>s.n);assert.equal(h.api.S.last,h.time);}
  else{equalState(h.api.S,s);assert.equal(h.api.pending.sec,seconds);h.clickGift();equalState(h.api.S,legacy(s,seconds).state);}
});

test('wall-clock-only sleep is offered even when the monotonic timer barely advances',()=>{
  const s=fixture({last:NOW}),h=harness({state:s});h.jumpWall(3600000);h.jumpPerformance(100);h.fire(100);
  equalState(h.api.S,s);assert.equal(h.api.pending.sec,3600);h.clickGift();equalState(h.api.S,legacy(s,3600).state);
});

test('a backwards wall clock retains a monotonic absence through an unspent reload',()=>{
  const s=fixture({last:NOW}),h=harness({state:s});h.jumpWall(-120000);h.jumpPerformance(60000);h.fire(100);
  equalState(h.api.S,s);assert.equal(h.api.pending.sec,60);assert.equal(h.api.S.last,h.time-60000);assert.equal(h.stored().last,h.time-60000);
  const next=harness({stored:storage(Object.fromEntries(h.store.data)),time:h.time});equalState(next.api.S,s);assert.equal(next.api.pending.sec,60);
  next.clickGift();equalState(next.api.S,legacy(s,60).state);
});

test('a pending hot snapshot recreates an unspent gift without growing the saved pool',()=>{
  const h=harness({state:fixture()});h.jump(15000);const snapshot=plain(h.api.S);
  const next=harness({state:snapshot,hot:true,time:h.time});equalState(next.api.S,snapshot);assert.equal(next.api.pending.sec,135);
});

test('hidden background action events and hidden spend cannot mutate state',()=>{
  const h=harness({state:fixture()});h.visibility(true);const before=plain(h.api.S);
  h.action('spend-away');h.api.spend();h.action('absorb');h.action('buy','0');h.action('tab','gen');h.action('mode','max');
  h.doc.querySelector('#poolWrap').dispatchEvent({type:'click',target:h.doc.querySelector('#pool'),clientX:20,clientY:20});
  assert.deepEqual(plain(h.api.S),before);assert.ok(h.api.pending);h.visibility(false);h.clickGift();assert.equal(h.api.pending,null);
});

for(const action of ['buy','absorb','pool','extAt'])test('first '+action+' input after a stall offers before changing the economy',()=>{
  const s=fixture({last:NOW,n:1000}),h=harness({state:s});h.jump(45000);
  if(action==='pool')h.doc.querySelector('#poolWrap').dispatchEvent({type:'click',target:h.doc.querySelector('#pool'),clientX:20,clientY:20});
  else if(action==='extAt'){const input=h.doc.createElement('input');input.id='extAt';input.value='999';h.doc.dispatchEvent({type:'change',target:input});}
  else h.action(action,action==='buy'?'0':undefined);
  equalState(h.api.S,s);assert.equal(h.api.pending.sec,45);assert.equal(h.api.modal,'offline');
  h.clickGift();equalState(h.api.S,legacy(s,45).state,'a post-return purchase cannot increase the already-earned gift');
});

test('world selection remains usable after a long wait without a false gift',()=>{
  const s=fixture({last:NOW,worldOffer:['vent','snowball','shallows']}),h=harness({state:s});h.jump(120000);h.action('world','vent');
  assert.equal(h.api.pending,null);assert.equal(h.api.S.world,'vent');assert.equal(h.api.S.worldOffer,null);assert.equal(h.api.modal,null);
  assert.equal(h.api.S.last,h.time);const n=h.api.S.n;h.tick(100);assert.ok(h.api.S.n>n,'normal active play resumes');
});

test('hide/unload before an overdue tick preserves the original checkpoint',()=>{
  const s=fixture({last:NOW});const h=harness({state:s});h.jump(65000);h.visibility(true);h.win.dispatchEvent({type:'beforeunload'});
  assert.equal(h.stored().last,NOW);h.jump(5000);h.visibility(false);assert.equal(h.api.pending.sec,70);equalState(h.api.S,s);
});

test('active ticks and successful claims advance the checkpoint; save alone does not',()=>{
  const s=fixture({last:NOW});const h=harness({state:s});h.tick(250);assert.equal(h.api.S.last,NOW+250);assert.ok(h.api.S.n>s.n);
  const checkpoint=h.api.S.last;h.jump(5000);assert.equal(h.api.save(),true);assert.equal(h.api.S.last,checkpoint);assert.equal(h.stored().last,checkpoint);
});

for(const [label,last] of [['missing',undefined],['null',null],['zero',0],['negative',-1],['future',NOW+999999],['nonnumeric','bad'],['numeric-string',String(NOW-120000)]])
  test('invalid timestamp cannot create a reward: '+label,()=>{
    const s=fixture();if(last===undefined)delete s.last;else s.last=last;const h=harness({state:s});
    equalState(h.api.S,s);assert.equal(h.api.pending,null);assert.equal(h.api.S.last,NOW);assert.equal(h.api.modal,null);
  });

test('preview rejects nonfinite or negative durations without mutating state',()=>{
  const h=harness({boot:false});h.api.set(fixture());const s=plain(h.api.S);
  for(const sec of [NaN,Infinity,-Infinity,-1,0,29.999])assert.equal(h.api.offline(sec),null,'invalid or subthreshold duration '+sec);
  assert.deepEqual(plain(h.api.S),s);
});

test('less than 30 seconds has no gift; exactly 30 seconds does',()=>{
  for(const seconds of [0,1,29.999,30]){
    const s=fixture({last:NOW-seconds*1000});const h=harness({state:s});equalState(h.api.S,s);
    assert.equal(!!h.api.pending,seconds===30);assert.equal(h.api.S.last,seconds===30?s.last:NOW);
  }
});

test('world-choice and zero-output states receive no fabricated gift',()=>{
  const world=fixture({worldOffer:['vent','snowball','shallows']});const h=harness({state:world});
  equalState(h.api.S,world);assert.equal(h.api.pending,null);assert.equal(h.api.modal,'world');assert.equal(h.api.S.last,NOW);
  const empty=fixture();empty.tiers.forEach(t=>{t.amt=0;t.bought=0;});const z=harness({state:empty});
  equalState(z.api.S,empty);assert.equal(z.api.pending,null);assert.equal(z.api.S.last,NOW);
});

test('legacy import resets the checkpoint and reset creates no saved gift field',()=>{
  const h=harness({state:fixture({last:NOW})});const imported=fixture({n:900,world:'vent',last:NOW-86400000});delete imported.genome;delete imported.stats.maxBought;
  h.api.importSave(h.context.Arcade.encode(imported));assert.equal(h.api.pending,null);assert.equal(h.api.S.n,900);assert.equal(h.api.S.last,NOW);
  assert.equal(h.stored().last,NOW);assert.equal(h.api.S.tiers.length,8);assert.equal(h.api.S.stats.maxBought.length,8);
  h.action('reset',undefined,{className:'armed'});assert.equal(h.api.S.n,0);assert.equal(h.api.pending,null);assert.equal(h.api.S.last,NOW);
  assert.deepEqual(Object.keys(h.stored()).sort(),Object.keys(h.api.fresh()).sort());
  const again=harness({stored:storage(Object.fromEntries(h.store.data)),time:NOW});assert.equal(again.api.S.n,0);assert.equal(again.api.pending,null);
});

test('failed claim restores the full unspent state, checkpoint, gift and mutation silence',()=>{
  const s=fixture();const h=harness({state:s}), before=plain(h.api.S), pending=plain(h.api.pending);
  h.store.fail=true;for(let i=0;i<3;i++){h.clickGift();assert.deepEqual(plain(h.api.S),before);assert.deepEqual(plain(h.api.pending),pending);}
  assert.match(h.doc.querySelector('#awayMsg').textContent,/could not save|storage/i);
  assert.equal(h.api.modal,'offline');assert.deepEqual(h.stored(),s);assert.equal(h.toasts.filter(t=>/mutation.*ready|mutations ready/i.test(t)).length,0);
  h.jump(90000);h.fire(100);h.fire(10000);assert.deepEqual(plain(h.api.S),before);
  h.store.fail=false;h.clickGift();equalState(h.api.S,legacy(s,120).state);assert.equal(h.api.S.last,h.time);assert.equal(h.stored().last,h.time);
  assert.equal(h.toasts.filter(t=>/mutation.*ready|mutations ready/i.test(t)).length,1,'mutation announced once, after durable success');
});

test('a capped lifetime counter does not discard nutrients that can still be collected',()=>{
  const s=fixture({runTotal:1e300}),h=harness({state:s});assert.ok(h.api.pending);assert.equal(h.api.pending.gain,600);
  equalState(h.api.S,s);h.clickGift();equalState(h.api.S,legacy(s,120).state);assert.equal(h.api.S.n,642);assert.equal(h.api.S.runTotal,1e300);
});

test('a nutrient-capped save can explicitly claim organism-only growth',()=>{
  const s=fixture({n:1e300,runTotal:1e300});s.tiers[1]={amt:4,bought:4};const h=harness({state:s});
  assert.ok(h.api.pending);assert.equal(h.api.pending.gain,0);equalState(h.api.S,s);
  assert.match(h.doc.querySelector('#sheet').textContent,/growth for your organisms/i);assert.doesNotMatch(h.doc.querySelector('#sheet').textContent,/\+0 nutrients/i);
  h.clickGift();equalState(h.api.S,legacy(s,120).state);assert.ok(h.api.S.tiers[0].amt>s.tiers[0].amt);assert.equal(h.api.S.n,1e300);
});

test('an entirely capped pool receives no fabricated reward',()=>{
  const s=fixture({n:1e300,runTotal:1e300});s.tiers.forEach(t=>{t.amt=1e300;});const h=harness({state:s});
  equalState(h.api.S,s);assert.equal(h.api.pending,null);assert.equal(h.api.modal,null);assert.equal(h.api.S.last,NOW);
});

test('failed offer persistence keeps the old durable save and a retryable gift',()=>{
  const s=fixture(),stored=storage({[KEY]:JSON.stringify(s)});stored.fail=true;
  const h=harness({stored});equalState(h.api.S,s);assert.deepEqual(h.stored(),s);assert.ok(h.api.pending);assert.equal(h.api.save(),false);
  h.clickGift();equalState(h.api.S,s);assert.ok(h.api.pending);stored.fail=false;h.clickGift();equalState(h.stored(),legacy(s,120).state);
});

test('time spent considering the gift does not spill into the first active tick',()=>{
  const h=harness({state:fixture()});h.jump(120000);h.clickGift();const before=plain(h.api.S);
  h.tick(100);assert.equal(h.api.pending,null);assert.ok(h.api.S.n>before.n);assert.ok(h.api.S.n-before.n<5,'only the 100ms active tick applies');
  assert.ok(Math.abs(h.api.S.stats.play-before.stats.play-0.1)<1e-9);assert.equal(h.api.S.last,h.time);
});

test('hidden game inputs are blocked even when no gift was pending at hide time',()=>{
  const h=harness({state:fixture({last:NOW,n:1000})});h.visibility(true);h.jump(45000);const before=plain(h.api.S);
  h.action('buy','0');h.action('absorb');h.action('tab','gen');h.action('mode','max');
  h.doc.querySelector('#poolWrap').dispatchEvent({type:'click',target:h.doc.querySelector('#pool'),clientX:20,clientY:20});
  const input=h.doc.createElement('input');input.id='extAt';input.value='999';h.doc.dispatchEvent({type:'change',target:input});
  assert.deepEqual(plain(h.api.S),before);assert.equal(h.api.pending,null);h.visibility(false);assert.equal(h.api.pending.sec,45);
});

test('mutation state and best-run statistics are saved before the success toast',()=>{
  const h=harness({state:fixture()});const el=h.doc.querySelector('#toasts');const add=el.appendChild.bind(el);let observed=0;
  el.appendChild=function(child){if(/mutation.*ready|mutations ready/i.test(child.textContent)){observed++;assert.equal(h.stored().pending,h.api.S.pending);assert.equal(h.stored().mutGranted,h.api.S.mutGranted);assert.equal(h.stored().stats.best,h.api.S.stats.best);assert.ok(h.stored().pending>0);}return add(child);};
  h.clickGift();assert.equal(observed,1);assert.ok(h.api.S.pending>0);
});

test('targeted controls and gift button declare a 44px minimum',()=>{
  const css=[...HTML.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
  function minHeight(selector){return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].some(m=>m[1].split(',').map(s=>s.trim()).includes(selector)&&/min-height\s*:\s*44px\b/.test(m[2]));}
  assert.ok(minHeight('.home')||minHeight('a.home'),'arcade link min-height:44px');
  assert.ok(minHeight('.tabs button'),'tabs min-height:44px');assert.ok(minHeight('.seg button'),'buy amounts min-height:44px');
  const h=harness({state:fixture()}), button=h.doc.querySelector('[data-act="spend-away"]');assert.ok(button);
  assert.ok(minHeight('.btn[data-act="spend-away"]')||minHeight('[data-act="spend-away"]')||minHeight("[data-act='spend-away']")||minHeight('.btn')||minHeight('.btn.primary')||minHeight('button'),'gift button min-height:44px');
});

async function browserChecks(){
  const baselineHTML=baselinePath?fs.readFileSync(baselinePath,'utf8'):null;
  let playwright;try{playwright=require('playwright');}catch(e){try{playwright=require('playwright-core');}catch{throw Error('Browser evidence unavailable: install-free Playwright resolution failed. Set NODE_PATH to an existing supported Playwright package. '+e.message);}}
  const launch={headless:true};
  if(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||process.env.CHROME_PATH)launch.executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||process.env.CHROME_PATH;
  let browser;try{browser=await playwright.chromium.launch(launch);}catch(e){throw Error('Browser evidence unavailable: Chromium did not launch; no geometry or screenshots were claimed. '+e.message);}
  fs.mkdirSync(output,{recursive:true});const evidence=[];
  const variants=[{label:'current',html:HTML,file:htmlPath,baseline:false}];
  if(baselinePath)variants.unshift({label:'baseline',html:baselineHTML,file:baselinePath,baseline:true});
  try{
    for(const variant of variants)for(const [name,width,height] of [['phone-small',320,740],['phone',375,812],['laptop',1366,768],['desktop',1920,1080],['ultrawide',3440,1440]]){
      const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'});
      try{
        // Serve exact repository bytes. Font requests are genuine; no DOM/geometry mocks.
        await context.route('**/*',async route=>{
          const u=new URL(route.request().url());
          if(['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)){await route.continue();return;}
          if(u.hostname!=='localhost'){await route.abort();return;}
          const pathname=decodeURIComponent(u.pathname),file=path.resolve(ROOT,'.'+pathname);
          if(!file.startsWith(ROOT+path.sep)){await route.abort();return;}
          if(pathname==='/games/primordial/index.html'){await route.fulfill({contentType:'text/html',body:variant.html});return;}
          if(fs.existsSync(file)&&fs.statSync(file).isFile()){await route.fulfill({contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream',body:fs.readFileSync(file)});return;}
          await route.fulfill({status:404,body:'Not found'});
        });
        const state=fixture({last:NOW-120000}),expected=legacy(state,120);
        await context.addInitScript(({state,key})=>{let seed=731;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};if(!localStorage.getItem('__pr-away-fixture')){localStorage.setItem(key,JSON.stringify(state));localStorage.setItem('__pr-away-fixture','1');}}, {state,key:KEY});
        const page=await context.newPage(),errors=[],fontFailures=[];
        page.on('pageerror',e=>errors.push(e.message));
        page.on('requestfailed',r=>{if(/fonts\.(googleapis|gstatic)\.com/.test(r.url()))fontFailures.push({url:r.url(),error:r.failure()?.errorText});});
        // Supported clock keeps exact rewards. Real canvas gets two frames, below a 100ms economy tick.
        await page.clock.install({time:NOW-60000});await page.clock.pauseAt(NOW);await page.clock.setFixedTime(NOW);
        const navigate=async reload=>{if(reload)await page.reload({waitUntil:'load'});else await page.goto('http://localhost/games/primordial/index.html',{waitUntil:'load'});await page.clock.runFor(32);};
        // Native pointer input at an actually visible, hit-tested center. This avoids the
        // locator stability check's two paused rAFs, without force or synthetic events.
        const nativeClick=async selector=>{
          const locator=page.locator(selector);assert.equal(await locator.count(),1,'one native target: '+selector);
          await locator.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest'}));
          const r=await locator.boundingBox();assert.ok(r&&r.width>0&&r.height>0,'visible native target: '+selector);
          const point={x:r.x+r.width/2,y:r.y+r.height/2};
          assert.equal(await locator.evaluate((el,p)=>{const hit=document.elementFromPoint(p.x,p.y);return hit===el||el.contains(hit);},point),true,'native target is unobscured: '+selector);
          await page.mouse.click(point.x,point.y);
        };
        await navigate(false);
        let fontTimer;const fontsSettled=await Promise.race([page.evaluate(()=>document.fonts.ready.then(()=>true)),new Promise(resolve=>{fontTimer=setTimeout(()=>resolve(false),15000);})]).finally(()=>clearTimeout(fontTimer));
        const fonts=await page.evaluate(()=>({status:document.fonts.status,faces:[...document.fonts].map(f=>({family:f.family,status:f.status}))}));
        const expectedFonts=['Figtree','Instrument Serif','JetBrains Mono'];
        const fallbackFonts=!expectedFonts.every(f=>fonts.faces.some(face=>face.family.replace(/["']/g,'')===f&&face.status==='loaded'));
        const prefix=variant.label+'-'+name;
        const capture=async phase=>{const file=prefix+'-'+phase+'.png';await page.screenshot({path:path.join(output,file),fullPage:true});return file;};
        const boxes=await page.locator('a.home, .tabs button, .seg button, #sheet .mfoot button').evaluateAll(es=>es.map(el=>{const r=el.getBoundingClientRect();return{text:el.textContent.trim(),height:r.height,width:r.width,minHeight:getComputedStyle(el).minHeight};}));
        assert.equal(boxes.length,10,prefix+': arcade + five tabs + three modes + return button');
        const shortControls=boxes.filter(box=>box.height<44);
        const noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
        const returnedN=await page.evaluate(()=>window.__pr.S.n);
        if(!variant.baseline){
          assert.equal(await page.evaluate(()=>document.activeElement?.dataset.act),'spend-away',prefix+': initial native focus');
          assert.equal(returnedN,state.n,prefix+': no reward before click');assert.deepEqual(shortControls,[],prefix+': all targeted controls >=44px');assert.ok(noOverflow,prefix+': no document overflow');
        }
        const screenshots=[await capture('return')];
        let saved;
        if(variant.baseline){
          // Record old automatic growth and short controls as before-state evidence, never a pass.
          await nativeClick('#sheet [data-act="close"]');saved=await page.evaluate(()=>JSON.parse(JSON.stringify(window.__pr.S)));
        }else{
          await page.keyboard.press('Escape');assert.equal(await page.locator('#modal').isVisible(),true,prefix+': Escape keeps gift');
          await navigate(true);assert.equal(await page.evaluate(()=>window.__pr.S.n),state.n,prefix+': unspent reload retains economy');
          await nativeClick('[data-act="spend-away"]');assert.equal(await page.locator('#modal').isVisible(),false,prefix+': native click spends gift');
          assert.equal(await page.evaluate(()=>document.activeElement?.id),'absorb',prefix+': native focus returns after spending');
          saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
          assert.deepEqual(rewardState(saved),rewardState(expected.state),prefix+': native click persisted exact legacy reward');assert.equal(saved.last,NOW,prefix+': claim timestamp');
          await navigate(true);assert.equal(await page.locator('[data-act="spend-away"]').count(),0,prefix+': claimed reload has no duplicate gift');
          assert.equal(await page.evaluate(()=>window.__pr.S.n),saved.n,prefix+': claimed reload does not repay');
          await page.locator('a.home').focus();assert.equal(await page.evaluate(()=>document.activeElement.matches('a.home')),true,prefix+': arcade link can receive keyboard focus');
        }
        screenshots.push(await capture('controls'));
        await nativeClick('[data-act="tab"][data-arg="gen"]');
        const sporesText=await page.locator('#g-d-spores').textContent();
        const genomeNoOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
        if(!variant.baseline){assert.match(sporesText,/welcome.back gift/i,prefix+': Dormant Spores describes the gift');assert.doesNotMatch(sporesText,/growth while you.re away/i,prefix+': no automatic-growth wording');assert.ok(genomeNoOverflow,prefix+': Genome has no document overflow');}
        screenshots.push(await capture('genome'));
        let organismGift=null;
        if(!variant.baseline&&(name==='phone'||name==='desktop')){
          const capped=fixture({n:1e300,runTotal:1e300});capped.tiers[1]={amt:4,bought:4};
          // Use the game's existing localhost fixture hook, then its real unload/save/reload path.
          await page.evaluate(({state,key})=>{window.__pr.set(state);localStorage.setItem(key,JSON.stringify(state));},{state:capped,key:KEY});
          await navigate(true);
          const label=await page.locator('#sheet .big').textContent();assert.match(label,/growth for your organisms/i,prefix+': organism-only label');
          const unchanged=await page.evaluate(()=>({n:window.__pr.S.n,tier:window.__pr.S.tiers[0].amt}));assert.equal(unchanged.n,capped.n);assert.equal(unchanged.tier,capped.tiers[0].amt);
          const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);assert.ok(fits,prefix+': organism-only modal has no document overflow');
          const shot=await capture('organism-gift');screenshots.push(shot);organismGift={label,noOverflow:fits,screenshot:shot};
        }
        assert.deepEqual(errors,[],prefix+': no page errors');
        evidence.push({variant:variant.label,name,width,height,controls:boxes,shortControls,noOverflow,genomeNoOverflow,initialN:state.n,returnedN,claimedN:saved.n,automaticGrowthOnReturn:returnedN>state.n,sporesText,organismGift,fontsSettled,fallbackFonts,fonts,fontFailures,screenshots});
        console.log((variant.baseline?'RECORDED baseline ':'PASS browser ')+name+': '+(variant.baseline?'automatic return growth and short controls recorded':'real geometry, native spend, reload and focus verified')+'; '+(fallbackFonts?'FONT LIMITATION: fallback fonts present':'all requested fonts loaded'));
      }finally{await context.close();}
    }
    fs.writeFileSync(path.join(output,'measurements.json'),JSON.stringify({sources:variants.map(v=>({variant:v.label,file:v.file,sha256:sha256(v.html)})),engineSha256:sha256(ENGINE),harnessSha256:sha256(fs.readFileSync(__filename)),capturedAt:new Date().toISOString(),evidence},null,2)+'\n');
    console.log('Browser evidence: '+output);
  }finally{await browser.close();}
}
(async()=>{
  let failed=0;
  for(const {name,fn} of cases){try{fn();console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n  '+e.stack);}}
  console.log(`${cases.length-failed}/${cases.length} PR-AWAY VM/source checks passed.`);
  console.log('Source SHA256: HTML '+sha256(HTML)+'; engine '+sha256(ENGINE));
  if(failed)process.exitCode=1;
  if(browserMode){try{await browserChecks();}catch(e){console.error('FAIL browser evidence\n  '+e.stack);process.exitCode=1;}}
})().catch(e=>{console.error(e);process.exitCode=1;});
