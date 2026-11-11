'use strict';
/* LR-WORLD-3: each doorway is a building. sillLine is local until the shared post kit lands. */
(function (root) {
  function sillLine(L) { return L.ground + L.U * .13; }

  function overlaps(a, b) {
    return a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1 && a.y0 < b.y1 - 1 && b.y0 < a.y1 - 1;
  }

  function layout(L, W, H, stops) {
    const U = L.U, sky = L.ground - U * .28, foot = Math.round(sillLine(L)), top = Math.ceil(sky) + 1;
    const band = area => {
      const stop = stops[area];
      const lo = stop + (area > 0 ? U * .2 : 0) + 2;
      const hi = stop + W - (area < 3 ? U * .2 : 0) - 2;
      return { lo, hi: Math.max(lo + 8, hi) };
    };
    const place = (name, door, area, widthU) => {
      const anchor = L[door].x, edge = band(area), half = widthU * U / 2;
      let x0 = Math.max(edge.lo, anchor - half), x1 = Math.min(edge.hi, anchor + half);
      if (x0 > anchor) x0 = anchor;
      if (x1 < anchor) x1 = anchor;
      return { name, door, anchor, x0, x1, y0: top, y1: foot };
    };
    const pull = list => {
      list.sort((a, b) => a.anchor - b.anchor);
      for (let n = 0; n < 8; n++) for (let i = 1; i < list.length; i++) {
        const a = list[i - 1], b = list[i];
        if (a.x1 + 4 <= b.x0) continue;
        const share = a.x1 + 4 - b.x0, roomA = a.x1 - a.anchor - 2, roomB = b.anchor - b.x0 - 2;
        const takeA = Math.max(0, Math.min(roomA, share / 2));
        const takeB = Math.max(0, Math.min(roomB, share - takeA));
        a.x1 -= takeA; b.x0 += takeB;
      }
    };
    const garden = [place('hutch', 'ksign', 0, .28), place('picnic', 'tsign', 0, .34)];
    const toys = [place('stage', 'stage', 2, .5), place('shelf', 'shelf', 2, .24)];
    const yard = [place('barn', 'dsign', 3, .42), place('shed', 'sign', 3, .26)];
    pull(garden); pull(toys); pull(yard);
    const anchor = L.wsign.x, edge = band(3), half = .3 * U / 2;
    let x0 = Math.max(edge.lo, anchor - half), x1 = Math.min(edge.hi, anchor + half);
    if (x0 > anchor) x0 = anchor;
    if (x1 < anchor) x1 = anchor;
    const wagonTop = foot + 4, wagonBot = Math.min(H - 2, wagonTop + Math.max(12, U * .22));
    const wagon = { name: 'wagon', door: 'wsign', anchor, x0, x1, y0: wagonTop, y1: Math.max(wagonTop + 8, wagonBot) };
    const pondW = U * .26;
    const pond = { name: 'pond', door: null, anchor: U * .15, x0: U * .02, x1: U * .02 + pondW, y0: L.ground + U * .02, y1: L.ground + U * .16 };
    const gateX = U * 6.05, gateW = U * .22;
    const gate = { name: 'gate', door: null, anchor: gateX, x0: gateX - gateW / 2, x1: gateX + gateW / 2, y0: top + U * .08, y1: foot };
    if (wagon.x1 > gate.x0 - 4 && wagon.anchor < gate.x0) wagon.x1 = Math.max(wagon.anchor, gate.x0 - 4);
    const raw = garden.concat(toys, yard, [wagon, pond, gate]).map(b => ({
      name: b.name, door: b.door,
      x0: Math.round(b.x0), y0: Math.round(b.y0),
      x1: Math.round(Math.max(b.x0 + 6, b.x1)), y1: Math.round(Math.max(b.y0 + 6, b.y1))
    }));
    for (let n = 0; n < 8; n++) for (let i = 0; i < raw.length; i++) for (let j = i + 1; j < raw.length; j++) {
      const a = raw[i], b = raw[j];
      if (!overlaps(a, b)) continue;
      if (a.x1 - a.x0 > b.x1 - b.x0) a.x1 = Math.max(Math.round(a.door ? L[a.door].x : a.x0) + 4, b.x0 - 4);
      else b.x0 = Math.min(Math.round(b.door ? L[b.door].x : b.x1) - 4, a.x1 + 4);
    }
    return raw;
  }

  function at(list, p) {
    let name = null;
    for (const b of list || []) {
      if (!b.door || p.x < b.x0 || p.x > b.x1 || p.y < b.y0 || p.y > b.y1) continue;
      name = b.door;
    }
    return name;
  }

  function nudge(st, L, door) {
    if (!st || !door || !st[door]) return 0;
    return Math.sin(st.t * 30) * st[door].shake * L.R * .95 * .06;
  }

  function paint(pick3, g, day, dusk, night) { return pick3(day, dusk, night, g); }

  function shift(b, dx) { return { x0: b.x0 + dx, x1: b.x1 + dx, y0: b.y0, y1: b.y1, name: b.name, door: b.door }; }

  function drawHutch(e, b) {
    const { cx, R, pick3, g, ell } = e, w = b.x1 - b.x0, h = b.y1 - b.y0, wall = b.y0 + h * .38;
    const wood = paint(pick3, g, '#a87a4a', '#a06a3a', '#3a2e38'), dark = paint(pick3, g, '#5a3a24', '#5a3a24', '#1e1a24');
    cx.fillStyle = dark; cx.beginPath(); cx.moveTo(R(b.x0), R(wall)); cx.lineTo(R(b.x0 + w / 2), R(b.y0)); cx.lineTo(R(b.x1), R(wall)); cx.fill();
    cx.fillStyle = wood; cx.fillRect(R(b.x0 + w * .08), R(wall), R(w * .84), Math.max(1, R(b.y1 - wall)));
    cx.fillStyle = paint(pick3, g, '#c8955a', '#a87a4a', '#2e2430'); cx.fillRect(R(b.x0 + w * .08), R(wall), Math.max(2, R(w * .12)), Math.max(1, R(b.y1 - wall)));
    cx.fillStyle = dark; cx.fillRect(R(b.x0 + w * .38), R(wall + h * .16), R(w * .24), Math.max(1, R(b.y1 - wall - h * .16)));
    ell(b.x0 + w * .2, b.y1 - h * .08, w * .08, h * .08, paint(pick3, g, '#3f9a48', '#4a7a3a', '#1e3a34'));
    ell(b.x0 + w * .78, wall + h * .12, w * .05, h * .1, '#ff8a2a');
    ell(b.x0 + w * .78, wall + h * .04, w * .06, h * .05, '#4fae4a');
  }

  function drawPicnic(e, b) {
    const { cx, R, pick3, g, ell } = e, w = b.x1 - b.x0, h = b.y1 - b.y0, cloth = b.y0 + h * .22;
    const post = paint(pick3, g, '#8a5a34', '#7a5030', '#1e1a24'), red = paint(pick3, g, '#c8453a', '#e8805a', '#8a2a24');
    cx.fillStyle = post; cx.fillRect(R(b.x0 + w * .12), R(cloth), Math.max(2, R(w * .06)), Math.max(1, R(b.y1 - cloth)));
    cx.fillRect(R(b.x1 - w * .18), R(cloth), Math.max(2, R(w * .06)), Math.max(1, R(b.y1 - cloth)));
    cx.fillStyle = red; cx.fillRect(R(b.x0), R(b.y0 + h * .08), R(w), Math.max(2, R(h * .2)));
    cx.fillStyle = '#fff4e0'; cx.fillRect(R(b.x0), R(b.y0 + h * .16), R(w), Math.max(1, R(h * .04)));
    for (let i = 0; i < 4; i++) ell(b.x0 + w * (i + .5) / 4, cloth + h * .06, w * .12, h * .06, red);
    const top = b.y1 - h * .22;
    cx.fillStyle = paint(pick3, g, '#c8955a', '#a87a4a', '#3a2e38'); cx.fillRect(R(b.x0 + w * .08), R(top), R(w * .84), Math.max(2, R(h * .08)));
    cx.fillStyle = post; cx.fillRect(R(b.x0 + w * .16), R(top), Math.max(2, R(w * .05)), Math.max(1, R(b.y1 - top)));
    cx.fillRect(R(b.x1 - w * .21), R(top), Math.max(2, R(w * .05)), Math.max(1, R(b.y1 - top)));
  }

  function drawStage(e, b) {
    const { cx, R, pick3, g } = e, w = b.x1 - b.x0, h = b.y1 - b.y0, deck = b.y1 - h * .28;
    const red = paint(pick3, g, '#c8453a', '#e8805a', '#8a2a24'), wood = paint(pick3, g, '#c8955a', '#a87a4a', '#3a2e38');
    cx.fillStyle = paint(pick3, g, '#8a2a24', '#8a2a24', '#1e1a24'); cx.fillRect(R(b.x0), R(b.y0), R(w), Math.max(2, R(h * .1)));
    cx.fillStyle = red; cx.fillRect(R(b.x0), R(b.y0 + h * .08), R(w * .28), Math.max(1, R(deck - b.y0)));
    cx.fillRect(R(b.x1 - w * .28), R(b.y0 + h * .08), R(w * .28), Math.max(1, R(deck - b.y0)));
    cx.fillStyle = wood; cx.fillRect(R(b.x0), R(deck), R(w), Math.max(2, R(b.y1 - deck)));
    cx.fillStyle = paint(pick3, g, '#8a5a34', '#7a5030', '#1e1a24');
    for (let i = 0; i < 4; i++) cx.fillRect(R(b.x0 + i * w / 4), R(deck), Math.max(1, R(w * .02)), Math.max(1, R(b.y1 - deck)));
    cx.fillStyle = paint(pick3, g, '#5a3a24', '#5a3a24', '#1e1a24'); cx.fillRect(R(b.x0 + w * .18), R(deck), R(w * .22), Math.max(2, R(h * .08)));
    cx.fillRect(R(b.x1 - w * .4), R(deck), R(w * .22), Math.max(2, R(h * .08)));
  }

  function drawShelf(e, b) {
    const { cx, R, pick3, g, mixHex } = e, w = b.x1 - b.x0, h = b.y1 - b.y0;
    const wood = paint(pick3, g, '#8a5a34', '#7a5030', '#1e1a24'), shelf = paint(pick3, g, '#c8955a', '#a87a4a', '#3a2e38');
    const drip = c => g > .6 ? mixHex(c, '#20203a', .6) : c;
    cx.fillStyle = wood; cx.fillRect(R(b.x0), R(b.y0), Math.max(3, R(w * .16)), Math.max(1, R(h)));
    cx.fillStyle = shelf; cx.fillRect(R(b.x0), R(b.y0 + h * .08), R(w), Math.max(2, R(h * .7)));
    const blocks = ['#ff6fa8', '#4fa6ff', '#ffd03a'];
    for (let i = 0; i < 3; i++) {
      const y = b.y0 + h * (.36 + i * .18);
      cx.fillStyle = shelf; cx.fillRect(R(b.x0 + w * .14), R(y), R(w * .8), Math.max(2, R(h * .05)));
      cx.fillStyle = drip(blocks[i]); cx.fillRect(R(b.x0 + w * (.32 + (i % 2) * .26)), R(y - h * .1), R(w * .18), Math.max(2, R(h * .1)));
    }
  }

  function drawBarn(e, b) {
    const { cx, R, pick3, g } = e, w = b.x1 - b.x0, h = b.y1 - b.y0, eave = b.y0 + h * .34;
    const red = paint(pick3, g, '#c8453a', '#e8805a', '#8a2a24'), dark = paint(pick3, g, '#8a2a24', '#8a2a24', '#1e1a24');
    cx.fillStyle = dark; cx.beginPath(); cx.moveTo(R(b.x0 - w * .04), R(eave)); cx.lineTo(R(b.x0 + w / 2), R(b.y0)); cx.lineTo(R(b.x1 + w * .04), R(eave)); cx.fill();
    cx.fillStyle = red; cx.fillRect(R(b.x0), R(eave), R(w), Math.max(1, R(b.y1 - eave)));
    cx.fillStyle = paint(pick3, g, '#e8483c', '#e8805a', '#8a2a24'); cx.fillRect(R(b.x0), R(eave), Math.max(2, R(w * .1)), Math.max(1, R(b.y1 - eave)));
    const dw = w * .36, dh = (b.y1 - eave) * .72, dx = b.x0 + (w - dw) / 2, dy = b.y1 - dh;
    cx.fillStyle = '#fff4e0'; cx.fillRect(R(dx), R(dy), R(dw), R(dh));
    cx.strokeStyle = dark; cx.lineWidth = Math.max(2, w * .03);
    cx.strokeRect(R(dx), R(dy), R(dw), R(dh));
    cx.beginPath(); cx.moveTo(R(dx), R(dy)); cx.lineTo(R(dx + dw), R(dy + dh)); cx.moveTo(R(dx + dw), R(dy)); cx.lineTo(R(dx), R(dy + dh)); cx.stroke();
    cx.fillStyle = '#f2c14e'; cx.fillRect(R(b.x0 + w * .16), R(eave + h * .06), R(w * .1), R(h * .1));
  }

  function drawShed(e, b) {
    const { cx, R, pick3, g, mixHex, ell } = e, w = b.x1 - b.x0, h = b.y1 - b.y0, eave = b.y0 + h * .28;
    const wood = paint(pick3, g, '#a87a4a', '#a06a3a', '#3a2e38'), dark = paint(pick3, g, '#5a3a24', '#5a3a24', '#1e1a24');
    const drip = c => g > .6 ? mixHex(c, '#20203a', .6) : c;
    cx.fillStyle = dark; cx.beginPath(); cx.moveTo(R(b.x0), R(eave)); cx.lineTo(R(b.x1), R(eave)); cx.lineTo(R(b.x1), R(b.y0 + h * .08)); cx.lineTo(R(b.x0), R(b.y0)); cx.fill();
    cx.fillStyle = wood; cx.fillRect(R(b.x0), R(eave), R(w), Math.max(1, R(b.y1 - eave)));
    cx.fillStyle = paint(pick3, g, '#c8955a', '#a87a4a', '#2e2430'); cx.fillRect(R(b.x0), R(eave), Math.max(2, R(w * .12)), Math.max(1, R(b.y1 - eave)));
    const drips = ['#ff6fa8', '#4fa6ff', '#ffd03a', '#5fd06a'];
    drips.forEach((c, i) => {
      const x = b.x0 + w * (.22 + i * .16);
      cx.fillStyle = drip(c); cx.fillRect(R(x), R(eave + h * .08), Math.max(2, R(w * .06)), R(h * (.2 + (i % 2) * .12)));
      ell(x + w * .03, eave + h * (.28 + (i % 2) * .12), w * .04, h * .04, drip(c));
    });
  }

  function drawWagon(e, b) {
    const { cx, R, pick3, g, ell } = e, w = b.x1 - b.x0, h = b.y1 - b.y0, bed = b.y0 + h * .35;
    const red = paint(pick3, g, '#c8453a', '#e8805a', '#8a2a24'), wood = paint(pick3, g, '#8a5a34', '#7a5030', '#1e1a24');
    cx.fillStyle = wood; cx.fillRect(R(b.x1 - w * .08), R(bed + h * .15), R(w * .16), Math.max(2, R(h * .08)));
    cx.fillStyle = red; cx.fillRect(R(b.x0 + w * .08), R(bed), R(w * .7), Math.max(2, R(h * .32)));
    cx.fillStyle = paint(pick3, g, '#e8483c', '#e8805a', '#8a2a24'); cx.fillRect(R(b.x0 + w * .08), R(bed), Math.max(2, R(w * .08)), Math.max(2, R(h * .32)));
    cx.fillStyle = wood; cx.fillRect(R(b.x0 + w * .08), R(bed), R(w * .7), Math.max(1, R(h * .06)));
    ell(b.x0 + w * .28, b.y1 - h * .16, h * .16, h * .16, '#5a3a24');
    ell(b.x0 + w * .62, b.y1 - h * .16, h * .16, h * .16, '#5a3a24');
    ell(b.x0 + w * .28, b.y1 - h * .16, h * .06, h * .06, '#f2c14e');
    ell(b.x0 + w * .62, b.y1 - h * .16, h * .06, h * .06, '#f2c14e');
  }

  function drawPond(e, b) {
    const { pick3, g, ell } = e, cx0 = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, rx = (b.x1 - b.x0) / 2, ry = (b.y1 - b.y0) / 2;
    ell(cx0, cy, rx, ry, paint(pick3, g, '#4fa6e8', '#5a7ab8', '#2a3a68'));
    ell(cx0 - rx * .25, cy - ry * .2, rx * .4, ry * .28, paint(pick3, g, '#9ad6f4', '#7cc0f4', '#4a4458'));
    const { cx, R } = e;
    cx.fillStyle = paint(pick3, g, '#3f9a48', '#4a7a3a', '#1e3a34');
    cx.fillRect(R(b.x0 + rx * .2), R(b.y0 - ry * .3), Math.max(1, R(rx * .08)), R(ry * .7));
    cx.fillRect(R(b.x1 - rx * .35), R(b.y0 - ry * .15), Math.max(1, R(rx * .08)), R(ry * .55));
  }

  function drawGate(e, b) {
    const { cx, R, L, pick3, g } = e, w = b.x1 - b.x0, gap = w * .42, mid = (b.x0 + b.x1) / 2;
    const fy = L.ground + L.U * .02, post = paint(pick3, g, '#7a5434', '#7a5030', '#1e1a24');
    const grass = paint(pick3, g, '#7cc85a', '#b0a050', '#2a4a40');
    cx.fillStyle = grass; cx.fillRect(R(mid - gap / 2), R(fy - L.U * .04), Math.max(2, R(gap)), Math.max(2, R(b.y1 - fy + L.U * .06)));
    cx.fillStyle = post; cx.fillRect(R(mid - gap / 2 - w * .08), R(b.y0), Math.max(2, R(w * .08)), Math.max(1, R(b.y1 - b.y0)));
    cx.fillRect(R(mid + gap / 2), R(b.y0), Math.max(2, R(w * .08)), Math.max(1, R(b.y1 - b.y0)));
    cx.fillStyle = paint(pick3, g, '#c8955a', '#a87a4a', '#3a2e38');
    cx.fillRect(R(b.x0), R(b.y0 + (b.y1 - b.y0) * .28), R(mid - gap / 2 - b.x0), Math.max(2, R((b.y1 - b.y0) * .08)));
    cx.fillRect(R(mid + gap / 2 + w * .08), R(b.y0 + (b.y1 - b.y0) * .55), R(b.x1 - mid - gap / 2 - w * .08), Math.max(2, R((b.y1 - b.y0) * .08)));
  }

  function hideWagonPost(e) {
    const post = (e.L.postRects || []).find(q => q.name === 'wsign');
    if (!post) return;
    e.cx.fillStyle = paint(e.pick3, e.g, '#7abf5c', '#909848', '#24423f');
    e.cx.fillRect(post.x, post.y, post.w, Math.max(1, post.h));
  }

  function drawStageDeck(e) {
    const b = (e.L.buildings || []).find(q => q.name === 'stage');
    if (!b) return;
    const { cx, R, L, pick3, g } = e, h = Math.max(4, L.U * .06), dx = nudge(e.st, L, 'stage');
    cx.fillStyle = paint(pick3, g, '#c8955a', '#a87a4a', '#3a2e38');
    cx.fillRect(R(b.x0 + dx), R(b.y1), Math.max(1, R(b.x1 - b.x0)), R(h));
    cx.fillStyle = paint(pick3, g, '#8a5a34', '#7a5030', '#1e1a24');
    cx.fillRect(R(b.x0 + dx), R(b.y1), Math.max(1, R(b.x1 - b.x0)), Math.max(1, R(h * .2)));
  }

  const BACK = { hutch: drawHutch, picnic: drawPicnic, stage: drawStage, shelf: drawShelf, barn: drawBarn, shed: drawShed };
  const FRONT = { wagon: drawWagon, pond: drawPond, gate: drawGate };

  function drawSome(e, table) {
  for (const b of e.L.buildings || []) {
    const fn = table[b.name];
    if (!fn) continue;
    fn(e, shift(b, nudge(e.st, e.L, b.door)));
  }
}

function drawPlaques(e) {
  if (!e.plaque) return;
  const board = e.L.R * 1.9;
  for (const b of e.L.buildings || []) {
    if (!b.door) continue;
    const w = b.x1 - b.x0, h = b.y1 - b.y0, dx = nudge(e.st, e.L, b.door);
    const x = (b.x0 + b.x1) / 2 + dx;
    const y = b.name === 'wagon' ? b.y0 + h * .45 : b.y0 + h * .5;
    const fit = Math.min(.62, (w * .7) / board);
    const clipTop = b.y0 + (b.name === 'wagon' || b.name === 'picnic' || b.name === 'stage' ? 0 : h * .14);
    e.cx.save();
    e.cx.beginPath();
    e.cx.rect(e.R(b.x0 + dx), e.R(clipTop), Math.max(1, e.R(w)), Math.max(1, e.R(b.y1 - clipTop)));
    e.cx.clip();
    e.plaque(b.door, x, y, Math.max(.38, fit));
    e.cx.restore();
  }
}

  root.LRBuildings = {
    layout,
    at,
    drawBack(e) { drawSome(e, BACK); hideWagonPost(e); },
    drawFront(e) { drawStageDeck(e); drawSome(e, FRONT); drawPlaques(e); }
  };
})(window);
