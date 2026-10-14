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
    return {
      x: view.w * 0.5 + (point.y - cam.y) * view.w * 0.11 * f,
      y: view.h * 0.84 - (point.x - cam.x) * view.h * 0.09 * f,
      scale: clamp(f * 2.05, 0.42, 2.35)
    };
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

  var api = { RESERVED: RESERVED, project: project, classifyPull: classifyPull, dragToField: dragToField };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LanternView = api;
})(typeof window === 'object' ? window : globalThis);
