'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createDocument } = require('./dom.cjs');

function makeStorage() {
  const bag = Object.create(null);
  const api = {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(bag, key) ? bag[key] : null;
    },
    setItem(key, value) { bag[key] = String(value); },
    removeItem(key) { delete bag[key]; },
    key(index) { return Object.keys(bag)[index] || null; },
    get length() { return Object.keys(bag).length; }
  };
  return new Proxy(bag, {
    get(target, prop) {
      if (Object.prototype.hasOwnProperty.call(api, prop)) return api[prop];
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = String(value);
      return true;
    },
    ownKeys() { return Object.keys(bag); },
    getOwnPropertyDescriptor(target, prop) {
      if (!Object.prototype.hasOwnProperty.call(bag, prop)) return undefined;
      return { configurable: true, enumerable: true, value: bag[prop] };
    }
  });
}

function scriptSrcs(html) {
  const out = [];
  const re = /<script\s+[^>]*src="([^"]+)"/gi;
  let match;
  while ((match = re.exec(html))) out.push(match[1]);
  return out;
}

function loadPage(root, htmlPath) {
  const htmlFile = path.resolve(root, htmlPath);
  const html = fs.readFileSync(htmlFile, 'utf8');
  const doc = createDocument(html);
  let clock = 1700000000000;
  const timers = [];
  const intervals = [];
  let timerSeq = 1;

  function ClockDate() {
    const args = arguments;
    if (new.target) {
      if (!args.length) return new Date(clock);
      return new Date(...args);
    }
    return new Date(clock).toString();
  }
  ClockDate.now = function () { return clock; };
  ClockDate.parse = Date.parse;
  ClockDate.UTC = Date.UTC;
  ClockDate.prototype = Date.prototype;

  const context = {
    console: console,
    Math: Math,
    JSON: JSON,
    Number: Number,
    String: String,
    Boolean: Boolean,
    Array: Array,
    Object: Object,
    RegExp: RegExp,
    Error: Error,
    TypeError: TypeError,
    RangeError: RangeError,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    Infinity: Infinity,
    NaN: NaN,
    Map: Map,
    Set: Set,
    WeakMap: WeakMap,
    Promise: Promise,
    Symbol: Symbol,
    Proxy: Proxy,
    Reflect: Reflect,
    URL: URL,
    URLSearchParams: URLSearchParams,
    encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent,
    Date: ClockDate,
    localStorage: makeStorage(),
    document: doc,
    location: {
      search: '',
      hash: '',
      href: 'http://localhost/' + htmlPath,
      reload() {}
    },
    navigator: { userAgent: 'idle-audit' },
    innerWidth: 1400,
    innerHeight: 900,
    scrollX: 0,
    scrollY: 0,
    devicePixelRatio: 1,
    scrollTo() {},
    confirm() { return false; },
    open() { return { closed: false, close() {} }; },
    getComputedStyle() { return { getPropertyValue() { return ''; } }; },
    requestAnimationFrame() { return 1; },
    cancelAnimationFrame() {},
    performance: { now() { return clock; } },
    Node: {
      ELEMENT_NODE: 1,
      TEXT_NODE: 3,
      DOCUMENT_NODE: 9,
      DOCUMENT_POSITION_DISCONNECTED: 1,
      DOCUMENT_POSITION_PRECEDING: 2,
      DOCUMENT_POSITION_FOLLOWING: 4,
      DOCUMENT_POSITION_CONTAINS: 8,
      DOCUMENT_POSITION_CONTAINED_BY: 16
    },
    setTimeout(fn) {
      const id = timerSeq++;
      timers.push({ id: id, fn: fn });
      return id;
    },
    clearTimeout(id) {
      const at = timers.findIndex(row => row.id === id);
      if (at >= 0) timers.splice(at, 1);
    },
    setInterval(fn) {
      const id = timerSeq++;
      intervals.push({ id: id, fn: fn });
      return id;
    },
    clearInterval(id) {
      const at = intervals.findIndex(row => row.id === id);
      if (at >= 0) intervals.splice(at, 1);
    },
    addEventListener() {},
    removeEventListener() {},
    matchMedia(query) {
      const width = context.innerWidth;
      const maxW = /max-width:\s*(\d+)px/.exec(query);
      const minW = /min-width:\s*(\d+)px/.exec(query);
      let matches = false;
      if (maxW) matches = width <= Number(maxW[1]);
      if (minW) matches = matches && width >= Number(minW[1]);
      return {
        matches: matches,
        media: query,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {}
      };
    }
  };
  context.window = context;
  context.self = context;
  context.globalThis = context;
  vm.createContext(context);

  const base = path.dirname(htmlFile);
  for (const src of scriptSrcs(html)) {
    const file = path.resolve(base, src);
    context.document.currentScript = { src: 'file://' + file };
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  }
  context.document.currentScript = null;

  context.__advance = function (ms) {
    clock += ms;
    const due = intervals.slice();
    for (const row of due) {
      if (intervals.indexOf(row) >= 0) row.fn();
    }
  };
  context.__flushTimers = function () {
    const due = timers.splice(0, timers.length);
    for (const row of due) row.fn();
  };
  context.__clock = function () { return clock; };
  context.__setVisibility = function (hidden) {
    context.document.hidden = hidden;
    context.document.visibilityState = hidden ? 'hidden' : 'visible';
    const event = {
      type: 'visibilitychange',
      target: context.document,
      currentTarget: null,
      preventDefault() {},
      stopPropagation() {}
    };
    const rows = context.document._listeners || [];
    for (const row of rows) {
      if (row.type === 'visibilitychange') row.fn.call(context.document, event);
    }
  };
  return context;
}

module.exports = { loadPage };
