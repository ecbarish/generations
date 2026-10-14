/* Cameras and gestures for Lantern Bowl. Presentation only.
   The sim keeps yards. This file turns them into a picture, or a throw.
   Built: behind (the older look the checks still use) and the side-on field. */
(function (root) {
  'use strict';

  var RESERVED = ['side'];

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function behind(point, cam, view) {
    var depth = (point.x - cam.x) + 16;
    var z = Math.max(2.4, depth);
    var f = 15 / z;
    var scale = clamp(f * 2.6, 0.7, 2.6);
    if (view.w <= 430) scale = Math.max(scale, 2.05);
    return {
      x: view.w * 0.5 + (point.y - cam.y) * view.w * 0.11 * f,
      y: view.h * 0.84 - (point.x - cam.x) * view.h * 0.09 * f,
      scale: scale
    };
  }

  /* Keep a ring inside the picture. The sim's pocket is in yards; this is only the drawing. */
  function fitCircle(center, radius, view, margin) {
    var m = margin == null ? 6 : margin;
    var w = Math.max(m * 2 + 1, view.w), h = Math.max(m * 2 + 1, view.h);
    var cx = clamp(center.x, m, w - m);
    var cy = clamp(center.y, m, h - m);
    var room = Math.min(cx - m, w - m - cx, cy - m, h - m - cy);
    return { x: cx, y: cy, r: Math.max(0, Math.min(Number(radius) || 0, room)) };
  }

  /* Yards from the line of scrimmage. The goal comes toward the camera as the spot advances. */
  function fieldLocal(spot, absolute) {
    return (Number(absolute) || 0) - (Number(spot) || 0);
  }

  /* Camera sits just behind the ball, in field yards. The ball stays put; the field moves. */
  function followBall(ball) {
    ball = ball || {};
    return { x: (Number(ball.x) || 0) - 3, y: (Number(ball.y) || 0) * 0.25 };
  }

  /* Art files use id_view_pose.png. None are shipped yet; drawPlayer falls back to code. */
  function spriteFile(id, viewName, pose) {
    return String(id || 'player') + '_' + String(viewName || 'back') + '_' + String(pose || 'idle') + '.png';
  }

  function project(name, point, cam, view) {
    if (name === 'behind') return behind(point, cam || { x: 0, y: 0 }, view || { w: 390, h: 520 });
    if (name === 'side') return sideProject(point, cam, view);
    return null;
  }

  /* How the pocket is framed, and how far a finger must drag for a full throw.
     Full power uses the room behind the quarterback, and still leaves a deep route on screen. */
  function passFrame(cssW, cssH) {
    var w = Number(cssW) || 844, h = Number(cssH) || 390;
    var layout = fitLayout(w, h);
    var scale = layout && layout.scale >= 1 ? layout.scale : 1;
    var pictureW = layout ? layout.w : w;
    var yard = layout && layout.yard ? layout.yard : 12;
    var anchor = layout ? layout.anchor : Math.round(pictureW * 0.28);
    var ahead = 30 * yard;
    var maxX = Math.max(anchor + yard, pictureW - ahead);
    var want = Math.min(pictureW * 0.48, maxX);
    var screenX = want * scale;
    return {
      span: Math.max(160, Math.round(screenX - 36)),
      screenX: screenX,
      pictureX: want,
      scale: scale,
      anchor: anchor,
      yard: yard
    };
  }
  function pullSpan(cssW, cssH) {
    return passFrame(cssW, cssH).span;
  }
  /* Screen pixels. Power fills across that span, so a short drag stays a short throw. */
  function classifyPull(pixels, span) {
    var full = Number(span);
    if (!(full > 40)) full = pullSpan(844, 390);
    var power = clamp((Number(pixels) || 0) / full, 0, 1);
    return { power: power, kind: power < 0.42 ? 'bullet' : 'lob', span: full };
  }
  /* Camera target that puts the quarterback far enough from the left edge to make that drag. */
  function pocketAim(qbWorld, cssW, cssH) {
    var frame = passFrame(cssW, cssH);
    return (Number(qbWorld) || 0) - (frame.pictureX - frame.anchor) / frame.yard;
  }

  /* Pull back from anywhere. The throw goes the other way. Right on the side field is downfield. */
  function dragToField(dx, dy) {
    var dirX = -(Number(dx) || 0);
    var dirY = -(Number(dy) || 0);
    var mag = Math.hypot(dirX, dirY) || 1;
    return { dirX: dirX / mag, dirY: dirY / mag };
  }
  /* Yards the quarterback slides back after the snap. Drawing only; the throw still leaves the pocket. */
  function pocketDrop(elapsed) {
    var u = clamp((Number(elapsed) || 0) / 0.55, 0, 1);
    return -4.6 * (1 - (1 - u) * (1 - u));
  }
  /* Screen pixels of loft. The ball peaks halfway and comes down on the landing spot. */
  function ballLoft(u, kind) {
    var t = clamp(Number(u) || 0, 0, 1);
    return Math.sin(t * Math.PI) * (kind === 'lob' ? 36 : 16);
  }
  /* The picture matches a landscape screen. The field stays side-on. */
  function layoutFor(cssW, cssH) {
    var w = Number(cssW) || 0, h = Number(cssH) || 0;
    if (w < 1 || h < 1) return null;
    var pictureH = SIDE.h;
    var pictureW = Math.round(pictureH * (w / h));
    pictureW = Math.max(SIDE.w, Math.min(pictureW, 760));
    return {
      w: pictureW, h: pictureH, yard: SIDE.yard, top: SIDE.top, fieldH: SIDE.fieldH,
      widthY: SIDE.widthY, anchor: Math.round(pictureW * 0.28), lead: SIDE.lead
    };
  }
  /* A phone held upright. Desktop sizes, and a phone already sideways, play the field. */
  function phoneTurn(cssW, cssH) {
    var w = Number(cssW) || 0, h = Number(cssH) || 0;
    return h > w && w > 0 && w <= 520;
  }
  /* Whole-pixel scale. The picture then widens and grows so the field fills the box. */
  function fitLayout(cssW, cssH) {
    var base = layoutFor(cssW, cssH);
    if (!base) return null;
    var w = Number(cssW), h = Number(cssH);
    var fit = Math.min(w / base.w, h / base.h);
    var scale = Math.floor(fit);
    if (!(scale >= 1)) scale = 1;
    var fillW = Math.max(8, Math.floor(w / scale));
    var fillH = Math.max(8, Math.floor(h / scale));
    var chrome = Math.max(0, base.h - base.fieldH);
    var margin = Math.min(chrome, Math.max(base.top, Math.floor(fillH / 5)));
    return {
      w: fillW, h: fillH, yard: base.yard, top: base.top, widthY: base.widthY,
      lead: base.lead, scale: scale,
      fieldH: Math.max(16, fillH - margin),
      anchor: Math.round(fillW * 0.28)
    };
  }

  /* Run lane and pocket ring, drawn under the players. Colours and patterns from the art spec. */
  var LANE_STYLE = {
    open: { color: '#f2d080', pattern: 'solid', width: 2, chevron: true },
    contested: { color: '#b89a5a', pattern: 'dashed', dash: [3, 3], width: 2 },
    closed: { color: '#3a2a30', pattern: 'dotted', dash: [1, 2], width: 1, mark: '#f6edd4' }
  };
  var RING_STEPS = [
    { rx: 28, color: '#f6edd4', width: 2, dash: null, pulse: 0, low: '#f6edd4' },
    { rx: 22, color: '#f2d080', width: 2, dash: null, pulse: 1, low: '#ffb0a4' },
    { rx: 16, color: '#f2d080', width: 2, dash: null, pulse: 0.5, low: '#ffb0a4' },
    { rx: 10, color: '#ffb0a4', width: 1, dash: [3, 3], pulse: 0.25, low: '#ffb0a4' }
  ];
  function laneStyle(state) { return LANE_STYLE[state] || LANE_STYLE.open; }
  /* Two rails, 9px apart, perpendicular to the downfield run. */
  function laneRails(x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    var px = -dy / len, py = dx / len, gap = 4.5;
    return [1, -1].map(function (side) {
      return {
        x0: x0 + px * gap * side, y0: y0 + py * gap * side,
        x1: x1 + px * gap * side, y1: y1 + py * gap * side
      };
    });
  }
  function snapPx(n) { return Math.round(Number(n) || 0); }
  /* A crisp run of pixels. Strokes sit on half-pixels and blur; filled rects do not. */
  function pixelLine(ctx, x0, y0, x1, y1, width, dash) {
    x0 = snapPx(x0); y0 = snapPx(y0); x1 = snapPx(x1); y1 = snapPx(y1);
    var w = Math.max(1, snapPx(width) || 1);
    var ox = Math.floor((w - 1) / 2);
    var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    var err = dx - dy, x = x0, y = y0, dist = 0;
    var onLen = dash ? Math.max(1, snapPx(dash[0])) : 0;
    var offLen = dash ? Math.max(1, snapPx(dash[1] == null ? dash[0] : dash[1])) : 0;
    var span = onLen + offLen;
    var upright = dy >= dx;
    while (true) {
      if (!span || (dist % span) < onLen) {
        if (upright) ctx.fillRect(x - ox, y, w, 1);
        else ctx.fillRect(x, y - ox, 1, w);
      }
      if (x === x1 && y === y1) break;
      var e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
      dist++;
    }
  }
  /* Ellipse outline as whole pixels. Width grows inward so the outer edge stays on the radius. */
  function pixelEllipse(ctx, cx, cy, rx, ry, width, dash) {
    cx = snapPx(cx); cy = snapPx(cy);
    rx = Math.max(1, snapPx(rx)); ry = Math.max(1, snapPx(ry));
    var seen = {}, pts = [];
    function add(x, y) {
      var key = x + ',' + y;
      if (seen[key]) return;
      seen[key] = 1;
      pts.push([x, y]);
    }
    var y, x;
    for (y = -ry; y <= ry; y++) {
      x = snapPx(rx * Math.sqrt(Math.max(0, 1 - (y / ry) * (y / ry))));
      add(cx - x, cy + y);
      add(cx + x, cy + y);
    }
    for (x = -rx; x <= rx; x++) {
      y = snapPx(ry * Math.sqrt(Math.max(0, 1 - (x / rx) * (x / rx))));
      add(cx + x, cy - y);
      add(cx + x, cy + y);
    }
    pts.sort(function (a, b) {
      return Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx);
    });
    var w = Math.max(1, snapPx(width) || 1);
    var onLen = dash ? Math.max(1, snapPx(dash[0])) : 0;
    var offLen = dash ? Math.max(1, snapPx(dash[1] == null ? dash[0] : dash[1])) : 0;
    var span = onLen + offLen;
    pts.forEach(function (p, i) {
      if (span && (i % span) >= onLen) return;
      ctx.fillRect(p[0], p[1], 1, 1);
      if (w < 2) return;
      var ix = p[0] + (p[0] < cx ? 1 : p[0] > cx ? -1 : 0);
      var iy = p[1] + (p[1] < cy ? 1 : p[1] > cy ? -1 : 0);
      ctx.fillRect(ix, iy, 1, 1);
    });
  }
  function drawRunLane(ctx, spec) {
    spec = spec || {};
    var style = laneStyle(spec.state);
    var k = spec.px > 0 ? spec.px : 1;
    var x0 = Number(spec.x0) || 0, y0 = Number(spec.y0) || 0;
    var x1 = Number(spec.x1) || 0, y1 = Number(spec.y1) || 0;
    var dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    var rails = laneRails(x0, y0, x1, y1);
    var width = Math.max(1, snapPx(style.width * k));
    var dash = style.dash ? [style.dash[0] * k, style.dash[1] * k] : null;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = style.color;
    rails.forEach(function (rail) {
      pixelLine(ctx, rail.x0 * k, rail.y0 * k, rail.x1 * k, rail.y1 * k, width, dash);
    });
    if (style.chevron) {
      var px = -(dy / len), py = dx / len, wing = 3 * k;
      for (var d = 10; d < len - 2; d += 10) {
        var cx = (x0 + dx / len * d) * k, cy = (y0 + dy / len * d) * k;
        var tipx = (x0 + dx / len * (d + 4)) * k, tipy = (y0 + dy / len * (d + 4)) * k;
        pixelLine(ctx, cx + px * wing, cy + py * wing, tipx, tipy, width, null);
        pixelLine(ctx, cx - px * wing, cy - py * wing, tipx, tipy, width, null);
      }
    }
    if (style.mark) {
      var mx = (x0 + x1) / 2 * k, my = (y0 + y1) / 2 * k, arm = 3 * k;
      ctx.fillStyle = style.mark;
      pixelLine(ctx, mx - arm, my - arm, mx + arm, my + arm, Math.max(1, snapPx(k)), null);
      pixelLine(ctx, mx + arm, my - arm, mx - arm, my + arm, Math.max(1, snapPx(k)), null);
    }
    ctx.restore();
    return style;
  }
  function pocketRing(step, time, reduced) {
    var spec = RING_STEPS[Math.max(0, Math.min(3, step | 0))];
    var color = spec.color, pulsing = false;
    if (!reduced && spec.pulse) {
      var phase = ((Number(time) || 0) % spec.pulse) / spec.pulse;
      if (phase < 0.25) { color = spec.low; pulsing = true; }
    }
    return {
      rx: spec.rx, ry: spec.rx / 2, color: color, width: spec.width,
      dash: spec.dash, pulse: reduced ? 0 : spec.pulse, pulsing: pulsing
    };
  }
  /* 120ms between pocket steps, snapped to whole pixels. */
  function tweenRadius(fromR, toR, t) {
    var u = clamp((Number(t) || 0) / 0.12, 0, 1);
    return Math.round(fromR + (toR - fromR) * u);
  }
  function drawPocketRing(ctx, spec) {
    spec = spec || {};
    var k = spec.px > 0 ? spec.px : 1;
    var fromStep = spec.from == null ? spec.step : spec.from;
    var from = pocketRing(fromStep, 0, true);
    var look = pocketRing(spec.step || 0, spec.time || 0, !!spec.reduced);
    var rx = spec.tween == null || spec.tween >= 0.12 ? look.rx : tweenRadius(from.rx, look.rx, spec.tween);
    var ry = Math.max(1, Math.round(rx / 2));
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = look.color;
    pixelEllipse(ctx, (Number(spec.x) || 0) * k, (Number(spec.y) || 0) * k, rx * k, ry * k, look.width * k, look.dash ? [look.dash[0] * k, look.dash[1] * k] : null);
    ctx.restore();
    return { rx: rx, ry: ry, color: look.color, width: look.width, dash: look.dash, pulse: look.pulse, pulsing: look.pulsing };
  }

  /* Side-on field. 384×216, 12px per yard, the vertical axis squashed into 160px under a 28px strip. */
  var SIDE = { w: 384, h: 216, yard: 12, top: 18, fieldH: 180, widthY: 53.333333, anchor: 140, lead: 40 };
  var STRIPES = ['#2d8a3c', '#38994a'];
  var PALETTE = [
    '#1e1a22', '#f2d080', '#e7c4a8', '#c99a78', '#8a5e48', '#f6edd4', '#c9bc9a', '#8a7e64',
    '#5a6478', '#3e4658', '#2a3040', '#8a4a2a', '#5e3020',
    '#e07a48', '#c45a32', '#8a3420', '#4a93a4', '#2d6f80', '#1c4a58',
    '#2d8a3c', '#38994a', '#ffffff', '#4aa8ff', '#ffdd33',
    '#b89a5a', '#3a2a30', '#ffb0a4', '#141820'
  ];
  var RAMPS = {
    '#c45a32': ['#e07a48', '#c45a32', '#8a3420'],
    '#2d6f80': ['#4a93a4', '#2d6f80', '#1c4a58']
  };
  var GLYPH = {
    A: '010,101,111,101,101', B: '110,101,110,101,110', C: '111,100,100,100,111',
    D: '110,101,101,101,110', E: '111,100,110,100,111', G: '111,100,101,101,111',
    I: '111,010,010,010,111', J: '001,001,001,101,110', K: '101,110,100,110,101',
    L: '100,100,100,100,111', M: '101,111,101,101,101', N: '101,111,111,101,101',
    O: '111,101,101,101,111', P: '111,101,111,100,100', R: '110,101,110,101,101',
    S: '111,100,111,001,111', T: '111,010,010,010,010', U: '101,101,101,101,111',
    V: '101,101,101,101,010', W: '101,101,101,111,101',
    '0': '111,101,101,101,111', '1': '010,110,010,010,111', '2': '111,001,111,100,111',
    '3': '111,001,111,001,111', '4': '101,101,111,001,001', '5': '111,100,111,001,111',
    '6': '111,100,111,101,111', '7': '111,001,010,010,010', '8': '111,101,111,101,111',
    '9': '111,101,111,001,111'
  };
  /* Words the picture paints with GLYPH. A space leaves a gap. Anything else needs a lit cell. */
  var FIELD_WORDS = ['Lanterns', 'Millrace', 'POWER', 'LOB', 'BULLET', 'JUKE', 'SPIN', 'DIVE', 'GO', '10', '20', '30', '40', '50'];
  function missingGlyphs(text) {
    var missing = [];
    String(text || '').toUpperCase().split('').forEach(function (ch) {
      if (ch === ' ') return;
      var rows = GLYPH[ch];
      if (!rows || String(rows).indexOf('1') < 0) missing.push(ch);
    });
    return missing;
  }
  function snapWorld(x) { return Math.round((Number(x) || 0) * SIDE.yard) / SIDE.yard; }
  function chainLines(game) {
    game = game || {};
    var spot = Number(game.spot) || 0;
    var toGo = Number(game.toGo);
    if (!isFinite(toGo)) toGo = 10;
    return { los: spot, first: spot + toGo };
  }
  /* Critically damped spring. Screen motion is whole pixels because the look point snaps to 1/12 yard. */
  function stepSideCamera(cam, target, dt, flags) {
    flags = flags || {};
    target = Number(target) || 0;
    if (!cam) cam = { x: snapWorld(target), v: 0, chasing: false };
    if (flags.cut) {
      cam.x = snapWorld(target);
      cam.v = 0;
      cam.chasing = false;
      return cam;
    }
    if (!flags.chase) {
      cam.chasing = false;
      cam.v = 0;
      cam.x = snapWorld(cam.x);
      return cam;
    }
    var omega = 9;
    var step = Math.max(0, Number(dt) || 0);
    var n = Math.max(1, Math.ceil(step / 0.016));
    var h = step / n;
    var x = cam.x, v = cam.v || 0, i;
    for (i = 0; i < n; i++) {
      var accel = omega * omega * (target - x) - 2 * omega * v;
      v += accel * h;
      x += v * h;
    }
    cam.x = snapWorld(x);
    cam.v = v;
    cam.chasing = true;
    return cam;
  }
  function sideFocus(spec) {
    spec = spec || {};
    var spot = Number(spec.spot) || 0;
    if (spec.whistle || spec.family === 'dead') return { target: spot, chase: false, cut: false };
    if (spec.cut) {
      var behind = spec.qbX == null ? spot - 8 : Number(spec.qbX);
      return { target: behind, chase: false, cut: true };
    }
    if (spec.family === 'air') return { target: ((Number(spec.qbX) || 0) + (Number(spec.landX) || 0)) / 2, chase: true, cut: false };
    if (spec.family === 'run') return { target: (Number(spec.ballX) || spot) + SIDE.lead / SIDE.yard, chase: true, cut: false };
    var pocket = spec.qbX == null ? spot - 8 : Number(spec.qbX);
    return { target: pocket, chase: true, cut: false };
  }
  function alongPx(abs, camX) {
    var delta = ((Number(abs) || 0) - (Number(camX) || 0)) * SIDE.yard;
    return Math.round(SIDE.anchor + delta);
  }
  function crossPx(lat) {
    return Math.round(SIDE.top + SIDE.fieldH / 2 + (Number(lat) || 0) * (SIDE.fieldH / SIDE.widthY));
  }
  function sideProject(point, cam, view) {
    point = point || {};
    cam = cam || {};
    return { x: alongPx(point.x, cam.x), y: crossPx(point.y), scale: 1, view: view || null };
  }
  function rampFor(color) {
    var key = String(color || '').toLowerCase();
    return RAMPS[key] || ['#e07a48', '#c45a32', '#8a3420'];
  }
  function hexRgb(hex) {
    var n = parseInt(String(hex).replace('#', ''), 16);
    if (!isFinite(n)) n = 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function paintSprite(file, ramp, muted) {
    var key = file + '|' + ramp.join(',') + '|' + (muted ? 'm' : 'b');
    if (drawPlayer.painted[key]) return drawPlayer.painted[key];
    var img = drawPlayer.sprites[file];
    var mask = drawPlayer.masks[file];
    if (!img || !mask || !img.width || typeof document === 'undefined') return img || null;
    var c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    var g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(img, 0, 0);
    var base = g.getImageData(0, 0, c.width, c.height);
    var mc = document.createElement('canvas');
    mc.width = mask.width;
    mc.height = mask.height;
    var mg = mc.getContext('2d');
    mg.drawImage(mask, 0, 0);
    var md = mg.getImageData(0, 0, mc.width, mc.height);
    var light = hexRgb(muted ? ramp[1] : ramp[0]);
    var mid = hexRgb(muted ? ramp[2] : ramp[1]);
    var dark = hexRgb(ramp[2]);
    var i, tone;
    for (i = 0; i < md.data.length; i += 4) {
      if (md.data[i + 3] < 128) continue;
      tone = md.data[i] > 200 ? light : md.data[i] > 120 ? mid : dark;
      base.data[i] = tone[0];
      base.data[i + 1] = tone[1];
      base.data[i + 2] = tone[2];
      base.data[i + 3] = 255;
    }
    g.putImageData(base, 0, 0);
    drawPlayer.painted[key] = c;
    return c;
  }
  function drawGlyph(ctx, ch, x, y, scale) {
    var rows = (GLYPH[ch] || '').split(',');
    var sy, sx, row;
    for (sy = 0; sy < rows.length; sy++) {
      row = rows[sy];
      for (sx = 0; sx < row.length; sx++) {
        if (row.charAt(sx) === '1') ctx.fillRect(x + sx * scale, y + sy * scale, scale, scale);
      }
    }
  }
  function drawText(ctx, text, x, y, color, scale) {
    var s = scale || 1;
    ctx.fillStyle = color || '#f6edd4';
    String(text || '').toUpperCase().split('').forEach(function (ch, i) {
      drawGlyph(ctx, ch, Math.round(x + i * 4 * s), Math.round(y), s);
    });
  }
  function yardX(abs, camX) { return alongPx(abs, camX); }
  function latY(lat) { return crossPx(lat); }
  function paintField(ctx, spec) {
    var camX = spec.camX;
    var spot = spec.spot;
    var marks = spec.marks;
    var top = SIDE.top, bot = SIDE.top + SIDE.fieldH;
    ctx.fillStyle = '#141820';
    ctx.fillRect(0, 0, SIDE.w, SIDE.h);
    var left = Math.floor(camX - SIDE.anchor / SIDE.yard) - 2;
    var right = Math.ceil(camX + (SIDE.w - SIDE.anchor) / SIDE.yard) + 2;
    var band;
    for (band = Math.floor(left / 5) * 5; band < right; band += 5) {
      var x0 = yardX(band, camX), x1 = yardX(band + 5, camX);
      var zone = band < 0 ? spec.own : band >= 100 ? spec.far : null;
      ctx.fillStyle = zone ? zone.color : STRIPES[Math.floor(Math.abs(band) / 5) % 2];
      ctx.fillRect(Math.min(x0, x1), top, Math.abs(x1 - x0) || 1, SIDE.fieldH);
    }
    [spec.own, spec.far].forEach(function (zone) {
      if (!zone) return;
      var mid = zone.goal < 50 ? zone.goal - 5 : zone.goal + 5;
      var tx = yardX(mid, camX) - String(zone.name).length * 4;
      if (tx > -40 && tx < SIDE.w) drawText(ctx, zone.name, tx, top + 70, '#f6edd4', 2);
    });
    var yard;
    for (yard = Math.max(0, Math.floor(left)); yard <= Math.min(100, Math.ceil(right)); yard++) {
      var x = yardX(yard, camX);
      if (yard % 5 === 0) {
        ctx.fillStyle = '#ffffff';
        var thick = yard === 0 || yard === 100 ? 2 : 1;
        ctx.fillRect(x, top, thick, SIDE.fieldH);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, latY(-11.8) - 1, 1, 3);
        ctx.fillRect(x, latY(11.8) - 1, 1, 3);
      }
      if (yard % 10 === 0 && yard > 0 && yard < 100) {
        var shown = yard <= 50 ? yard : 100 - yard;
        drawText(ctx, String(shown), x + 4, top + 16, '#f6edd4', 2);
      }
    }
    [0, 100].forEach(function (goal) {
      var gx = yardX(goal, camX);
      ctx.fillStyle = '#ffdd33';
      [-1, 1].forEach(function (side) {
        ctx.fillRect(gx - 1, latY(side * 26.666) - (side < 0 ? 5 : 0), 3, 5);
      });
    });
    if (marks) {
      ctx.fillStyle = '#4aa8ff';
      ctx.fillRect(yardX(marks.los, camX), top, 2, SIDE.fieldH);
      ctx.fillStyle = '#ffdd33';
      ctx.fillRect(yardX(marks.first, camX), top, 2, SIDE.fieldH);
    }
  }
  function spritePose(off, pose) {
    if (off) return pose === 'throw' || pose === 'catch' || pose === 'dive' || pose === 'run' ? pose : 'idle';
    if (pose === 'tackle' || pose === 'catch' || pose === 'run') return pose;
    if (pose === 'dive') return 'tackle';
    return 'idle';
  }
  function poseOf(p, play) {
    if (!play) return { pose: 'idle', frame: 0 };
    var carrier = play.actors && play.actors[play.carrier];
    var t = play.elapsed || 0;
    if (p.link && carrier && p.link === carrier && (play.diving || (play.diveUntil && t < play.diveUntil))) return { pose: 'dive', frame: Math.floor(t * 8) % 2 };
    if (p.off && p.role === 'qb' && play.family === 'pass' && !play.thrown && !play.flight) return { pose: 'throw', frame: 0 };
    if (!p.off && carrier && Math.hypot((p.x - carrier.x), (p.y - carrier.y)) < 1.15 && (play.family === 'run' || play.didCatch)) return { pose: 'tackle', frame: Math.floor(t * 6) % 2 };
    var moving = t > 0.04 && (p.link || p.route || p.role === 'dl' || p.role === 'lb' || p.role === 'cb' || p.role === 's' || p.role === 'wr');
    if (moving) return { pose: 'run', frame: Math.floor(t * 8) % 4 };
    return { pose: 'idle', frame: Math.floor(t * 2) % 2 };
  }
  /* The bar is the whole drag. A 130px pull on a phone fills only part of it. */
  function powerMeter(power, pictureW) {
    var p = clamp(Number(power) || 0, 0, 1);
    var bw = Math.round(Math.max(110, Math.min(200, (Number(pictureW) || 384) * 0.34)));
    return { power: p, width: bw, fill: Math.max(0, Math.round((bw - 2) * p)) };
  }
  /* Sits on the near sideline, clear of the score line. */
  function drawPowerMeter(ctx, power) {
    var meter = powerMeter(power, SIDE.w);
    var p = meter.power;
    var labelW = 40, gap = 6, bw = meter.width, bh = 10;
    var x = Math.round((SIDE.w - (labelW + gap + bw)) / 2);
    var y = Math.max(4, SIDE.h - bh - 8);
    drawText(ctx, 'POWER', x, y, '#f6edd4', 2);
    var bx = x + labelW + gap, by = y;
    ctx.fillStyle = '#1e1a22';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#c9bc9a';
    ctx.fillRect(bx, by, bw, 1);
    ctx.fillRect(bx, by + bh - 1, bw, 1);
    ctx.fillRect(bx, by, 1, bh);
    ctx.fillRect(bx + bw - 1, by, 1, bh);
    var fill = Math.round((bw - 2) * p);
    if (fill > 0) {
      ctx.fillStyle = '#4aa8ff';
      ctx.fillRect(bx + 1, by + 1, fill, bh - 2);
    }
  }
  /* A predicted arc and the landing circle. Lamplight stays on the aimed player, not the arc. */
  function drawPassGuide(ctx, at, carrier, aim) {
    var preview = aim.preview || {};
    var from = at(carrier.x, carrier.y);
    var end = at(preview.x, preview.y);
    var wobble = clamp(Number(aim.wobble) || 0, 0, 1);
    var time = Number(aim.time) || 0;
    if (wobble > 0) {
      end = {
        x: end.x + Math.round(Math.sin(time * 9) * wobble * 14),
        y: end.y + Math.round(Math.cos(time * 7) * wobble * 8)
      };
    }
    var radius = Math.max(0.6, Number(aim.radius) || Number(preview.radius) || 1.2);
    var alongR = Math.max(4, Math.round(radius * SIDE.yard));
    var crossR = Math.max(3, Math.round(radius * (SIDE.fieldH / SIDE.widthY)));
    var rx = Math.min(alongR, Math.max(4, Math.floor(SIDE.w / 2) - 2));
    var ry = Math.min(crossR, Math.max(3, Math.floor(SIDE.h / 2) - 2));
    rx = Math.max(4, rx); ry = Math.max(3, ry);
    end = {
      x: clamp(end.x, rx + 2, Math.max(rx + 2, SIDE.w - rx - 2)),
      y: clamp(end.y, ry + 2, Math.max(ry + 2, SIDE.h - ry - 2))
    };
    var loft = (aim.kind === 'lob' ? 28 : 10) + wobble * 10;
    var samples = 8, i;
    var prev = from;
    ctx.fillStyle = wobble > 0 ? '#ffb0a4' : '#f6edd4';
    for (i = 1; i <= samples; i++) {
      var t = i / samples;
      var u = 1 - t;
      var x = u * u * from.x + 2 * u * t * ((from.x + end.x) / 2) + t * t * end.x;
      var y = u * u * from.y + 2 * u * t * (((from.y + end.y) / 2) - loft) + t * t * end.y;
      var next = { x: Math.round(x), y: Math.round(y) };
      pixelLine(ctx, prev.x, prev.y, next.x, next.y, 2, [2, 3]);
      prev = next;
    }
    ctx.fillStyle = '#4aa8ff';
    pixelEllipse(ctx, end.x, end.y, rx, ry, 2, [2, 3]);
    ctx.fillStyle = '#f6edd4';
    ctx.fillRect(end.x - 3, end.y, 7, 1);
    ctx.fillRect(end.x, end.y - 3, 1, 7);
    if (aim.power != null) drawPowerMeter(ctx, aim.power);
    return { end: end, kind: aim.kind === 'lob' ? 'lob' : 'bullet', ry: ry };
  }
  /* The throw word sits above the sprites, inside the picture, at the 8px glyph size. */
  function drawPassLabel(ctx, guide) {
    if (!guide || !guide.end) return;
    var text = guide.kind === 'lob' ? 'LOB' : 'BULLET';
    var scale = 2;
    var tw = text.length * 4 * scale;
    var th = 5 * scale;
    var x = clamp(Math.round(guide.end.x - tw / 2), 2, Math.max(2, SIDE.w - tw - 2));
    var y = Math.round(guide.end.y - (guide.ry || 6) - th - 3);
    if (y < 2) y = Math.min(Math.max(2, SIDE.h - th - 2), Math.round(guide.end.y + (guide.ry || 6) + 3));
    ctx.fillStyle = '#1e1a22';
    ctx.fillRect(x - 2, y - 2, tw + 4, th + 4);
    drawText(ctx, text, x, y, '#f2d080', scale);
  }
  /* Open is a light ring with a chevron. A window is dashed. Covered is dotted, with a cross. */
  function opennessMark(band) {
    if (band === 'window') return { color: '#ffdd33', shape: 'dashed', outline: '#1e1a22' };
    if (band === 'covered') return { color: '#ffb0a4', shape: 'dotted', outline: '#1e1a22' };
    return { color: '#f6edd4', shape: 'chevron', outline: '#1e1a22' };
  }
  function drawOpenMark(ctx, x, y, band) {
    var mark = opennessMark(band);
    var rx = 7, ry = 4;
    ctx.fillStyle = mark.outline;
    pixelEllipse(ctx, x, y, rx + 2, ry + 2, 2, null);
    ctx.fillStyle = mark.color;
    if (mark.shape === 'dashed') pixelEllipse(ctx, x, y, rx, ry, 2, [3, 2]);
    else if (mark.shape === 'dotted') pixelEllipse(ctx, x, y, rx, ry, 2, [1, 2]);
    else pixelEllipse(ctx, x, y, rx, ry, 2, null);
    ctx.fillStyle = mark.outline;
    if (mark.shape === 'chevron') {
      pixelLine(ctx, x - 2, y - 3, x + 4, y, 1, null);
      pixelLine(ctx, x - 2, y + 3, x + 4, y, 1, null);
    } else if (mark.shape === 'dotted') {
      pixelLine(ctx, x - 3, y - 2, x + 3, y + 2, 1, null);
      pixelLine(ctx, x - 3, y + 2, x + 3, y - 2, 1, null);
    }
  }
  function useSide(layout, fn) {
    if (!layout) return fn();
    var keys = ['w', 'h', 'yard', 'top', 'fieldH', 'widthY', 'anchor', 'lead'];
    var prev = {};
    keys.forEach(function (k) { prev[k] = SIDE[k]; if (layout[k] != null) SIDE[k] = layout[k]; });
    try { return fn(); }
    finally { keys.forEach(function (k) { SIDE[k] = prev[k]; }); }
  }
  function drawChalk(ctx, at, lines) {
    (lines || []).forEach(function (line) {
      if (!line) return;
      var a = at(line.x0, line.y0), b = at(line.x1, line.y1);
      ctx.fillStyle = '#f6edd4';
      pixelLine(ctx, a.x, a.y, b.x, b.y, 2, [3, 3]);
    });
  }
  function paintMatch(ctx, spec) {
    spec = spec || {};
    return useSide(spec.layout, function () { return paintMatchDraw(ctx, spec); });
  }
  function paintMatchDraw(ctx, spec) {
    var game = spec.game;
    var play = spec.play;
    var live = !!(game && play && game.phase === 'live');
    var spot = live ? play.startSpot : (game ? game.spot : 25);
    var camX = spec.camX == null ? spot : spec.camX;
    var offSide = live ? play.offence : (game ? game.possession : 'home');
    var off = game ? game[offSide === 'away' ? 'away' : 'home'] : { color: '#c45a32', short: 'Lanterns' };
    var def = game ? game[offSide === 'away' ? 'home' : 'away'] : { color: '#2d6f80', short: 'Millrace' };
    var ownColor = (off.color === '#2d6f80' ? '#1c4a58' : '#8a3420');
    var farColor = (def.color === '#c45a32' ? '#8a3420' : '#1c4a58');
    var picture = live ? null : (game ? game : null);
    var squad = live ? play.squad : (picture ? spec.squad : null);
    if (!live && game && !squad) {
      var preview = root.LanternModel && root.LanternModel.previewSquad
        ? root.LanternModel.previewSquad(off, def, spec.formation || game.look || 'singleback')
        : null;
      squad = preview ? preview.squad : [];
      spec.ball = spec.ball || (preview && preview.ball);
    }
    if (live) squad = play.squad || [];
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    paintField(ctx, {
      camX: camX,
      spot: spot,
      own: { color: ownColor, name: off.short || 'Lanterns', goal: 0 },
      far: { color: farColor, name: def.short || 'Millrace', goal: 100 },
      marks: game ? chainLines({ spot: spot, toGo: game.toGo }) : null
    });
    function at(x, y) { return sideProject({ x: spot + x, y: y }, { x: camX }); }
    var drop = play && play.family === 'pass' && !play.thrown && !play.flight ? pocketDrop(play.elapsed) : 0;
    if (!live) drawChalk(ctx, at, spec.chalk);
    function openBand(p, list) {
      var best = 99;
      (list || []).forEach(function (o) {
        if (o.off) return;
        var d = Math.hypot(o.x - p.x, o.y - p.y);
        if (d < best) best = d;
      });
      return root.LanternModel && root.LanternModel.opennessBand ? root.LanternModel.opennessBand(best) : (best <= 2.6 ? 'covered' : best < 5 ? 'window' : 'open');
    }
    if (play && (play.family === 'run' || play.didCatch) && play.lanes) {
      play.lanes.forEach(function (lane) {
        var stateName = play.laneStates && play.laneStates[lane.id] ? play.laneStates[lane.id].state : 'open';
        var near = at(0.2, lane.y), far = at(6.2, lane.y);
        drawRunLane(ctx, { x0: near.x, y0: near.y, x1: far.x, y1: far.y, state: stateName, px: 1 });
      });
    }
    if (play && play.family === 'pass' && !play.thrown && !play.flight) {
      var qb = play.actors[play.carrier];
      var pocketAt = qb && at(qb.x + drop, qb.y);
      if (pocketAt) {
        drawPocketRing(ctx, {
          x: pocketAt.x, y: pocketAt.y, step: play.ringStep || 0, from: play.ringFrom || 0,
          tween: play.ringTween == null ? 0.12 : play.ringTween, time: play.elapsed || 0,
          reduced: !!spec.reduced, px: 1
        });
      }
    }
    var bodies = (squad || []).map(function (p) {
      var px = p.x;
      if (drop && p.off && p.role === 'qb') px += drop;
      return { p: p, s: at(px, p.y) };
    }).sort(function (a, b) { return a.p.y - b.p.y; });
    var carrier = play && play.actors ? play.actors[play.carrier] : null;
    var aimPreview = spec.aim && spec.aim.preview;
    var aimTarget = null;
    if (aimPreview && play && root.LanternModel && root.LanternModel.aimReceiver) {
      aimTarget = root.LanternModel.aimReceiver(play, aimPreview.x, aimPreview.y);
    } else if (aimPreview) aimTarget = aimPreview.target;
    bodies.forEach(function (row) {
      var p = row.p;
      var team = p.off ? off : def;
      var ramp = rampFor(team.color);
      var posed = poseOf(p, play);
      var pose = spritePose(!!p.off, posed.pose);
      var aimed = !!(aimTarget && p.link && p.link === aimTarget);
      drawPlayer(ctx, {
        x: row.s.x, y: row.s.y, scale: 1,
        file: spriteFile((p.off ? 'offence_' : 'defence_') + (p.body === 'line' ? 'line' : 'skill'), 'side', pose),
        id: p.role, view: 'side', pose: pose, frame: posed.frame,
        body: p.body, face: p.face, ramp: ramp, muted: p.body === 'line',
        fill: team.color, trim: ramp[0], role: p.role,
        outline: aimed ? '#f2d080' : '#1e1a22'
      });
      var ring = '';
      if (aimed) ring = '#f2d080';
      else if (carrier && p.link === carrier) ring = '#f6edd4';
      if (ring) {
        ctx.fillStyle = ring;
        pixelEllipse(ctx, row.s.x, row.s.y - 9, 11, 7, 2, null);
      }
    });
    var ball = live ? play.ball : spec.ball;
    if (ball) {
      var bx = ball.x, by = ball.y - 0.2;
      if (drop && carrier && carrier.role === 'qb' && !play.flight) bx += drop;
      var b = at(bx, by);
      if (play && play.flight) {
        var flightU = clamp(play.flight.t / (play.flight.air || 1), 0, 1);
        b.y -= ballLoft(flightU, play.flight.kind);
      }
      ctx.fillStyle = '#8a4a2a';
      ctx.fillRect(b.x - 3, b.y - 2, 6, 3);
      ctx.fillStyle = '#f6edd4';
      ctx.fillRect(b.x - 1, b.y - 1, 1, 1);
      ctx.fillStyle = '#1e1a22';
      ctx.fillRect(b.x - 4, b.y - 2, 1, 3);
      ctx.fillRect(b.x + 3, b.y - 2, 1, 3);
    }
    if (play && carrier && (play.family === 'run' || play.didCatch)) {
      var who = null;
      bodies.forEach(function (row) { if (row.p.link === carrier) who = row.s; });
      var juking = !!(play.jukeUntil && play.elapsed < play.jukeUntil);
      var spinning = !!(play.spinUntil && play.elapsed < play.spinUntil);
      var diving = !!(play.diving || (play.diveUntil && play.elapsed < play.diveUntil));
      if (who && (juking || spinning || diving || play.turboOn)) {
        drawText(ctx, juking ? 'JUKE' : spinning ? 'SPIN' : diving ? 'DIVE' : 'GO', who.x - 8, who.y - 22, '#f6edd4', 1);
      }
    }
    var showRings = !live || (play && play.family === 'pass' && !play.didCatch);
    if (showRings && squad && squad.length) {
      squad.forEach(function (p) {
        if (!p.off || (p.role !== 'wr' && p.role !== 'te' && p.role !== 'rb')) return;
        var spotAt = at(p.x, p.y);
        drawOpenMark(ctx, spotAt.x, spotAt.y + 2, openBand(p, squad));
      });
    }
    var guide = null;
    if (play && play.family === 'pass' && !play.thrown && spec.aim && spec.aim.preview && carrier) {
      guide = drawPassGuide(ctx, at, { x: carrier.x + drop, y: carrier.y }, spec.aim);
    } else if (play && play.family === 'pass' && !play.thrown && !spec.aim && spec.coach && carrier) {
      guide = drawPassGuide(ctx, at, { x: carrier.x + drop, y: carrier.y }, {
        preview: { x: carrier.x + 12, y: carrier.y - 2 },
        kind: 'bullet',
        radius: 1.4,
        wobble: 0
      });
    }
    if (guide) drawPassLabel(ctx, guide);
    ctx.restore();
    return { spot: spot, camX: camX, squad: (squad || []).length };
  }

  /* One entry for every player. A sprite replaces the figure; the game does not grow a second drawer. */
  function drawPlayer(ctx, spec) {
    spec = spec || {};
    var file = spec.file || spriteFile(spec.id, spec.view, spec.pose);
    var img = spec.ramp ? paintSprite(file, spec.ramp, !!spec.muted) : drawPlayer.sprites[file];
    if (!img) img = drawPlayer.sprites[file];
    var s = Number(spec.scale) > 0 ? spec.scale : 1;
    var x = Number(spec.x) || 0, y = Number(spec.y) || 0;
    if (img && img.width > 0 && img.height > 0) {
      var strip = img.height === 16 && img.width >= 16 && img.width % 16 === 0;
      var sw = strip ? 16 : img.width, sh = strip ? 16 : img.height;
      var frames = strip ? img.width / 16 : 1;
      var frame = ((spec.frame | 0) % frames + frames) % frames;
      /* A 16-tall strip is drawn at native size, so a 1px outline stays 1px
         and the lineman stays wider than the skill body. */
      var dw = strip ? 16 : 18 * s;
      var dh = strip ? 16 : dw * (sh / sw);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(Math.round(x), Math.round(y));
      if (spec.face > 0) ctx.scale(-1, 1);
      ctx.fillStyle = '#1e1a22';
      ctx.fillRect(Math.round(-dw / 2) + 2, -2, Math.max(4, dw - 6), 2);
      ctx.drawImage(img, frame * sw, 0, sw, sh, Math.round(-dw / 2), -dh + 1, dw, dh);
      if (spec.role === 'wr' || spec.role === 'cb') {
        ctx.fillStyle = spec.trim || '#f6edd4';
        ctx.fillRect(spec.face > 0 ? -4 : 1, -9, 2, 2);
      }
      ctx.restore();
      return 'sprite';
    }
    var pose = spec.pose || 'idle';
    var lean = pose === 'juke' ? (spec.jukeDir < 0 ? -1 : 1) * 7 * s : 0;
    var squash = pose === 'dive' ? 0.62 : 1;
    var swing = pose === 'run1' ? 1 : pose === 'run2' ? -1 : pose === 'dive' ? 0.35 : 0;
    ctx.save();
    ctx.translate(x + lean, y);
    ctx.scale(1, squash);
    ctx.lineCap = 'round';
    ctx.lineWidth = 1;
    ctx.strokeStyle = spec.outline || '#1e1a22';
    ctx.beginPath();
    ctx.moveTo(-3.2 * s, -7 * s);
    ctx.lineTo((-3.2 - swing * 4.2) * s, 1.5 * s);
    ctx.moveTo(3.2 * s, -7 * s);
    ctx.lineTo((3.2 + swing * 4.2) * s, 1.5 * s);
    ctx.moveTo(-5 * s, -12 * s);
    ctx.lineTo(-8 * s, -7 * s);
    ctx.moveTo(5 * s, -12 * s);
    ctx.lineTo(8 * s, -7 * s);
    ctx.stroke();
    ctx.fillStyle = spec.fill || '#c45a32';
    ctx.beginPath();
    ctx.ellipse(0, -12 * s, 6.2 * s, 7.4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e7c4a8';
    ctx.beginPath();
    ctx.arc(0, -21 * s, 4.6 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return 'figure';
  }
  drawPlayer.sprites = {};
  drawPlayer.masks = {};
  drawPlayer.painted = {};

  var api = {
    RESERVED: RESERVED, project: project, classifyPull: classifyPull, pullSpan: pullSpan,
    pocketAim: pocketAim, passFrame: passFrame, powerMeter: powerMeter, dragToField: dragToField,
    fitCircle: fitCircle, fieldLocal: fieldLocal, followBall: followBall, spriteFile: spriteFile,
    drawPlayer: drawPlayer, laneStyle: laneStyle, laneRails: laneRails, drawRunLane: drawRunLane,
    pocketRing: pocketRing, tweenRadius: tweenRadius, drawPocketRing: drawPocketRing, RING_STEPS: RING_STEPS,
    SIDE: SIDE, PALETTE: PALETTE, chainLines: chainLines, stepSideCamera: stepSideCamera,
    sideFocus: sideFocus, sideProject: sideProject, paintMatch: paintMatch, rampFor: rampFor,
    pocketDrop: pocketDrop, ballLoft: ballLoft, layoutFor: layoutFor, fitLayout: fitLayout,
    opennessMark: opennessMark, phoneTurn: phoneTurn,
    GLYPH: GLYPH, FIELD_WORDS: FIELD_WORDS, missingGlyphs: missingGlyphs
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LanternView = api;
})(typeof window === 'object' ? window : globalThis);
