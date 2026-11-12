/* A small document, enough for games/night-market/game.js to render.
   It is not a browser. It keeps the nodes the page script reads and writes. */
'use strict';

const VOID = { meta: 1, link: 1, img: 1, input: 1, br: 1, hr: 1, source: 1, area: 1, base: 1, col: 1, embed: 1, wbr: 1 };

function decode(text) {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, function (all, ent) {
    if (ent[0] === '#') {
      const n = ent[1] === 'x' || ent[1] === 'X' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(n) ? String.fromCharCode(n) : all;
    }
    if (ent === 'amp') return '&';
    if (ent === 'lt') return '<';
    if (ent === 'gt') return '>';
    if (ent === 'quot') return '"';
    if (ent === 'apos' || ent === '#39') return "'";
    if (ent === 'nbsp') return ' ';
    return all;
  });
}

function parseAttrs(raw) {
  const attrs = {};
  const re = /([:@\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let m;
  while ((m = re.exec(raw || ''))) attrs[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return attrs;
}

class Node {
  constructor(doc) {
    this.ownerDocument = doc;
    this.parentElement = null;
    this.childNodes = [];
  }
  remove() {
    const p = this.parentElement;
    if (!p) return;
    const i = p.childNodes.indexOf(this);
    if (i >= 0) p.childNodes.splice(i, 1);
    this.parentElement = null;
  }
}

class TextNode extends Node {
  constructor(doc, text) {
    super(doc);
    this.nodeType = 3;
    this.nodeValue = text;
    this.textContent = text;
  }
}

class Element extends Node {
  constructor(doc, tag) {
    super(doc);
    this.nodeType = 1;
    this.tag = String(tag || 'div').toLowerCase();
    this._attrs = {};
    this.style = {};
    this.style.setProperty = (name, value) => { this.style[name] = value == null ? '' : String(value); };
    this.inert = false;
    this.tabIndex = 0;
    this.value = '';
    this.max = '';
    this.type = '';
    this.title = '';
  }
  get tagName() { return this.tag.toUpperCase(); }
  get id() { return this.getAttribute('id') || ''; }
  set id(v) { this.setAttribute('id', v); }
  get className() { return this.getAttribute('class') || ''; }
  set className(v) { this.setAttribute('class', v == null ? '' : String(v)); }
  get classList() {
    const el = this;
    return {
      contains(name) { return classTokens(el).indexOf(name) >= 0; },
      add() {
        const have = classTokens(el);
        for (let i = 0; i < arguments.length; i++) if (arguments[i] && have.indexOf(arguments[i]) < 0) have.push(arguments[i]);
        el.setAttribute('class', have.join(' '));
      },
      remove() {
        const drop = {};
        for (let i = 0; i < arguments.length; i++) drop[arguments[i]] = 1;
        el.setAttribute('class', classTokens(el).filter(name => !drop[name]).join(' '));
      },
      toggle(name, force) {
        const has = this.contains(name);
        const on = force === undefined ? !has : !!force;
        if (on) this.add(name); else this.remove(name);
        return on;
      }
    };
  }
  get dataset() {
    const el = this;
    return new Proxy({}, {
      get(_t, prop) {
        if (typeof prop !== 'string') return undefined;
        const v = el.getAttribute('data-' + prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase()));
        return v == null ? undefined : v;
      },
      set(_t, prop, value) {
        el.setAttribute('data-' + String(prop).replace(/[A-Z]/g, m => '-' + m.toLowerCase()), value == null ? '' : String(value));
        return true;
      }
    });
  }
  get hidden() { return this.hasAttribute('hidden'); }
  set hidden(v) { if (v) this.setAttribute('hidden', ''); else this.removeAttribute('hidden'); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { if (v) this.setAttribute('disabled', ''); else this.removeAttribute('disabled'); }
  get children() { return this.childNodes.filter(n => n.nodeType === 1); }
  get nextElementSibling() {
    const kids = this.parentElement ? this.parentElement.children : [];
    const i = kids.indexOf(this);
    return i >= 0 ? kids[i + 1] || null : null;
  }
  get textContent() { return collectText(this); }
  set textContent(v) {
    this.childNodes = [];
    if (v != null && String(v) !== '') this.appendChild(new TextNode(this.ownerDocument, String(v)));
  }
  get innerHTML() { return this.childNodes.map(serialize).join(''); }
  set innerHTML(html) {
    this.childNodes = [];
    parseInto(this, String(html || ''));
  }
  get offsetHeight() { return this.hidden ? 0 : 40; }
  getBoundingClientRect() {
    return { x: 0, y: 0, top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 };
  }
  hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this._attrs, String(name).toLowerCase()); }
  getAttribute(name) {
    const key = String(name).toLowerCase();
    return this.hasAttribute(key) ? this._attrs[key] : null;
  }
  setAttribute(name, value) {
    const key = String(name).toLowerCase();
    this._attrs[key] = value == null ? '' : String(value);
    if (key === 'value') this.value = this._attrs[key];
    if (key === 'max') this.max = this._attrs[key];
    if (key === 'type') this.type = this._attrs[key];
    if (key === 'title') this.title = this._attrs[key];
    if (key === 'tabindex') this.tabIndex = Number(this._attrs[key]);
  }
  removeAttribute(name) { delete this._attrs[String(name).toLowerCase()]; }
  appendChild(node) {
    if (node.parentElement) node.remove();
    node.parentElement = this;
    this.childNodes.push(node);
    return node;
  }
  replaceChildren() {
    this.childNodes.forEach(n => { n.parentElement = null; });
    this.childNodes = [];
    for (let i = 0; i < arguments.length; i++) if (arguments[i]) this.appendChild(arguments[i]);
  }
  after(node) {
    const p = this.parentElement;
    if (!p || !node) return;
    if (node.parentElement) node.remove();
    const i = p.childNodes.indexOf(this);
    node.parentElement = p;
    p.childNodes.splice(i + 1, 0, node);
  }
  contains(node) {
    let n = node;
    while (n) {
      if (n === this) return true;
      n = n.parentElement;
    }
    return false;
  }
  closest(selector) {
    let n = this;
    while (n && n.nodeType === 1) {
      if (matches(n, selector, n)) return n;
      n = n.parentElement;
    }
    return null;
  }
  matches(selector) { return matches(this, selector, this); }
  querySelector(selector) { return queryAll(this, selector)[0] || null; }
  querySelectorAll(selector) { return queryAll(this, selector); }
  focus() {
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }
  addEventListener() {}
  removeEventListener() {}
}

function classTokens(el) {
  return (el.getAttribute('class') || '').split(/\s+/).filter(Boolean);
}

function collectText(node) {
  if (node.nodeType === 3) return node.nodeValue || '';
  let out = '';
  for (const child of node.childNodes) out += collectText(child);
  return out;
}

function serialize(node) {
  if (node.nodeType === 3) return node.nodeValue || '';
  const attrs = Object.keys(node._attrs).map(k => node._attrs[k] === '' ? ' ' + k : ' ' + k + '="' + node._attrs[k] + '"').join('');
  if (VOID[node.tag]) return '<' + node.tag + attrs + '>';
  return '<' + node.tag + attrs + '>' + node.childNodes.map(serialize).join('') + '</' + node.tag + '>';
}

function parseInto(parent, html) {
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w:-]*)>|<([a-zA-Z][\w:-]*)([^>]*?)(\/?)>|([^<]+)/g;
  const stack = [parent];
  let m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith('<!--')) continue;
    if (m[1]) {
      const name = m[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === name) { stack.length = i; break; }
      }
      continue;
    }
    if (m[2]) {
      const el = parent.ownerDocument.createElement(m[2]);
      const attrs = parseAttrs(m[3]);
      for (const key of Object.keys(attrs)) el.setAttribute(key, attrs[key]);
      stack[stack.length - 1].appendChild(el);
      const selfClose = m[4] === '/' || VOID[el.tag];
      if (!selfClose) stack.push(el);
      continue;
    }
    if (m[5] && m[5].trim()) stack[stack.length - 1].appendChild(new TextNode(parent.ownerDocument, decode(m[5])));
  }
}

function splitTop(selector) {
  const parts = [];
  let buf = '';
  let depth = 0;
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth = Math.max(0, depth - 1);
    if (c === ',' && depth === 0) { parts.push(buf); buf = ''; continue; }
    buf += c;
  }
  if (buf.trim()) parts.push(buf);
  return parts;
}

function splitChain(selector) {
  const chain = [];
  let buf = '';
  let depth = 0;
  let comb = 'start';
  function push() {
    const sel = buf.trim();
    if (sel) chain.push({ comb, sel });
    buf = '';
  }
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth = Math.max(0, depth - 1);
    if (depth === 0 && c === '>') { push(); comb = 'child'; continue; }
    if (depth === 0 && /\s/.test(c)) {
      if (buf.trim()) { push(); comb = 'desc'; }
      continue;
    }
    buf += c;
  }
  push();
  return chain;
}

function tokenize(sel) {
  const parts = [];
  let i = 0;
  while (i < sel.length) {
    const c = sel[i];
    if (c === '*') { parts.push({ type: 'tag', name: '*' }); i++; continue; }
    if (c === '#') {
      const m = /^#([^\s#.\[:]+)/.exec(sel.slice(i));
      parts.push({ type: 'id', name: m[1] });
      i += m[0].length;
      continue;
    }
    if (c === '.') {
      const m = /^\.([^\s#.\[:]+)/.exec(sel.slice(i));
      parts.push({ type: 'class', name: m[1] });
      i += m[0].length;
      continue;
    }
    if (c === '[') {
      const m = /^\[([^\s=~|^$*\]]+)(?:([~|^$*]?=)"([^"]*)"|([~|^$*]?=)'([^']*)'|([~|^$*]?=)([^\]]+))?\]/.exec(sel.slice(i));
      if (!m) throw new Error('Bad selector ' + sel);
      const value = m[3] ?? m[5] ?? m[7];
      parts.push({ type: 'attr', name: m[1].toLowerCase(), value: value == null ? null : value });
      i += m[0].length;
      continue;
    }
    if (c === ':') {
      if (sel.startsWith(':scope', i)) { parts.push({ type: 'scope' }); i += 6; continue; }
      if (sel.startsWith(':not(', i)) {
        let depth = 0;
        let j = i + 4;
        for (; j < sel.length; j++) {
          if (sel[j] === '(') depth++;
          else if (sel[j] === ')') { depth--; if (depth === 0) break; }
        }
        parts.push({ type: 'not', inner: sel.slice(i + 5, j) });
        i = j + 1;
        continue;
      }
      throw new Error('Unsupported selector ' + sel);
    }
    const m = /^[a-zA-Z][\w-]*/.exec(sel.slice(i));
    if (m) { parts.push({ type: 'tag', name: m[0].toLowerCase() }); i += m[0].length; continue; }
    throw new Error('Unsupported selector ' + sel);
  }
  return parts;
}

function matches(el, selector, scope) {
  if (!el || el.nodeType !== 1) return false;
  const parts = tokenize(selector.trim());
  if (!parts.length) return false;
  for (const part of parts) {
    if (part.type === 'tag' && part.name !== '*' && el.tag !== part.name) return false;
    if (part.type === 'id' && el.id !== part.name) return false;
    if (part.type === 'class' && !el.classList.contains(part.name)) return false;
    if (part.type === 'attr') {
      if (!el.hasAttribute(part.name)) return false;
      if (part.value != null && el.getAttribute(part.name) !== part.value) return false;
    }
    if (part.type === 'scope' && el !== scope) return false;
    if (part.type === 'not' && matches(el, part.inner, scope)) return false;
  }
  return true;
}

function descendants(node) {
  const out = [];
  function walk(n) {
    for (const child of n.childNodes) {
      if (child.nodeType === 1) { out.push(child); walk(child); }
    }
  }
  walk(node);
  return out;
}

function queryAll(root, selector) {
  const found = [];
  for (const group of splitTop(selector)) {
    const chain = splitChain(group.trim());
    if (!chain.length) continue;
    let current = [root];
    for (let s = 0; s < chain.length; s++) {
      const step = chain[s];
      const next = [];
      if (s === 0 && step.sel === ':scope') { next.push(root); }
      else if (s === 0) {
        const pool = root.nodeType === 1 || root.nodeType === 9 ? [root].concat(descendants(root)) : descendants(root);
        for (const n of pool) if (n !== root && matches(n, step.sel, root)) next.push(n);
        if (matches(root, step.sel, root) && root.nodeType === 1) next.unshift(root);
      } else if (step.comb === 'child') {
        for (const n of current) for (const c of n.children || []) if (matches(c, step.sel, root)) next.push(c);
      } else {
        for (const n of current) for (const d of descendants(n)) if (matches(d, step.sel, root)) next.push(d);
      }
      current = next;
    }
    for (const n of current) if (found.indexOf(n) < 0) found.push(n);
  }
  return found;
}

function createDocument(html) {
  const doc = new Element(null, '#document');
  doc.nodeType = 9;
  doc.ownerDocument = doc;
  doc.createElement = function (tag) { return new Element(doc, tag); };
  doc.getElementById = function (id) { return doc.querySelector('#' + id); };
  doc.createRange = function () {
    return { selectNodeContents: function () {}, getClientRects: function () { return []; } };
  };
  doc.elementFromPoint = function () { return null; };
  doc._listeners = [];
  doc.addEventListener = function () {};
  doc.removeEventListener = function () {};
  doc.hidden = false;
  doc.activeElement = null;
  const cleaned = String(html || '').replace(/<!doctype[^>]*>/i, '').replace(/<script[\s\S]*?<\/script>/gi, '');
  parseInto(doc, cleaned);
  doc.documentElement = doc.querySelector('html');
  doc.head = doc.querySelector('head');
  doc.body = doc.querySelector('body');
  doc.activeElement = doc.body;
  return doc;
}

module.exports = { createDocument, Element, TextNode };
