/* Cameras and gestures for Lantern Bowl. Presentation only.
   The sim keeps yards. This file turns them into a picture, or a throw.
   Built: behind (you stand behind the offence; lanes and the pocket are visible).
   Reserved: side (a side-on quick look). Not built. project('side') returns null. */
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
    return null;
  }

  /* Screen pixels. A short pull is a bullet; a long pull is a lob. */
  function classifyPull(pixels) {
    var power = clamp((Number(pixels) || 0) / 150, 0, 1);
    return { power: power, kind: power < 0.42 ? 'bullet' : 'lob' };
  }

  /* Screen drag: up the glass is downfield, right is to the offence's right. */
  function dragToField(dx, dy) {
    var dirX = -Number(dy) || 0, dirY = Number(dx) || 0;
    var mag = Math.hypot(dirX, dirY) || 1;
    return { dirX: dirX / mag, dirY: dirY / mag };
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

  /* One entry for every player. A later sprite replaces the figure; the game does not grow a second drawer. */
  function drawPlayer(ctx, spec) {
    spec = spec || {};
    var file = spriteFile(spec.id, spec.view, spec.pose);
    var img = drawPlayer.sprites[file];
    var s = Number(spec.scale) > 0 ? spec.scale : 1;
    var x = Number(spec.x) || 0, y = Number(spec.y) || 0;
    if (img && img.width > 0 && img.height > 0) {
      var w = 18 * s, h = w * (img.height / img.width);
      ctx.drawImage(img, x - w / 2, y - h * 0.92, w, h);
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
    ctx.lineWidth = Math.max(2, 2.4 * s);
    ctx.strokeStyle = spec.outline || '#f6edd4';
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

  var api = {
    RESERVED: RESERVED, project: project, classifyPull: classifyPull, dragToField: dragToField,
    fitCircle: fitCircle, fieldLocal: fieldLocal, followBall: followBall, spriteFile: spriteFile,
    drawPlayer: drawPlayer, laneStyle: laneStyle, laneRails: laneRails, drawRunLane: drawRunLane,
    pocketRing: pocketRing, tweenRadius: tweenRadius, drawPocketRing: drawPocketRing, RING_STEPS: RING_STEPS
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LanternView = api;
})(typeof window === 'object' ? window : globalThis);
