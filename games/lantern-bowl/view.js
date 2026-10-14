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
    drawPlayer: drawPlayer
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LanternView = api;
})(typeof window === 'object' ? window : globalThis);
