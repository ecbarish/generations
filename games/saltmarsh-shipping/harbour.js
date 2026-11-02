/* The harbour outside the office window. CSS pixels, flat shapes, no images.
   Coast colours and the placeholder timber, hull and panel are in
   docs/saltmarsh-lighting.md. The lamp is the house lamplight #f2d080. */
(function () {
  'use strict';

  var SKY = '#9cbecb';
  var MIST = '#d4e5e4';
  var WATER = '#23394c';
  var SAND = '#c8c5a0';
  var LAMP = '#f2d080';
  var TIMBER = '#8d7a52';
  var HULL = '#6e5840';

  /* Label rows stay a plate apart, including on a short sideways harbour. */
  function laneYs(h, n) {
    if (!(n > 0)) return [];
    var bottom = h * 0.74;
    var gap = 0;
    if (n > 1) {
      gap = Math.min(52, (h * 0.74 - h * 0.52) / (n - 1));
      if (gap < 22) gap = 22;
    }
    var ys = [];
    for (var i = 0; i < n; i++) ys.push(bottom - i * gap);
    return ys;
  }

  /* On a short canvas the top row sits above the usual waterline, so the water rises to meet it. */
  function waterTop(h, n) {
    var ys = laneYs(h, n);
    var topLane = n ? ys[n - 1] : h * 0.74;
    return Math.min(h * 0.46, topLane - 4);
  }

  function boatCount(state, i) {
    return state.boats && state.boats[i] ? state.boats[i].owned : 0;
  }

  function drawBoat(ctx, kind, x, y) {
    var hullW = kind === 'bark' ? 46 : kind === 'schooner' ? 36 : kind === 'sloop' ? 28 : 22;
    var hullH = kind === 'rowboat' ? 7 : 8;
    ctx.fillStyle = HULL;
    ctx.beginPath();
    ctx.moveTo(x - hullW / 2, y);
    ctx.lineTo(x + hullW / 2, y);
    ctx.lineTo(x + hullW / 2 - 5, y + hullH);
    ctx.lineTo(x - hullW / 2 + 5, y + hullH);
    ctx.closePath();
    ctx.fill();
    if (kind === 'rowboat') {
      ctx.fillStyle = TIMBER;
      ctx.fillRect(x - 1, y - 8, 2, 8);
      return;
    }
    var masts = kind === 'bark' ? 3 : kind === 'schooner' ? 2 : 1;
    var gap = 10;
    for (var m = 0; m < masts; m++) {
      var mx = x - ((masts - 1) * gap) / 2 + m * gap;
      ctx.fillStyle = MIST;
      ctx.fillRect(mx, y - 22, 2, 22);
      ctx.beginPath();
      ctx.moveTo(mx + 2, y - 20);
      ctx.lineTo(mx + 12, y - 8);
      ctx.lineTo(mx + 2, y - 6);
      ctx.closePath();
      ctx.fill();
    }
    if (kind === 'bark') {
      ctx.fillStyle = LAMP;
      ctx.fillRect(x + hullW / 2 - 8, y - 4, 3, 3);
    }
  }

  function init(canvas, getState, getView, reduced) {
    var ctx = canvas.getContext('2d');
    var running = true;

    function frame(now) {
      if (!running) return;
      var state = getState();
      var view = getView();
      var rect = canvas.getBoundingClientRect();
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var bw = Math.max(1, Math.round(rect.width * dpr));
      var bh = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      var w = rect.width, h = rect.height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var reduce = reduced();
      var bob = function (seed) { return reduce ? 0 : Math.sin(now / 700 + seed) * 1.6; };

      ctx.fillStyle = SKY;
      ctx.fillRect(0, 0, w, h);
      var laneN = 0;
      for (var ln = 0; ln < 4; ln++) if (boatCount(state, ln) > 0) laneN++;
      var topLane = laneN ? laneYs(h, laneN)[laneN - 1] : h * 0.74;
      var waterLine = waterTop(h, laneN);
      ctx.fillStyle = MIST;
      ctx.fillRect(0, waterLine - h * 0.12, w, h * 0.16);
      ctx.fillStyle = WATER;
      ctx.fillRect(0, waterLine, w, h * 0.86 - waterLine);
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = SKY;
      for (var wave = 0; wave < 4; wave++) {
        var wy = h * 0.52 + wave * (h * 0.07);
        var shift = reduce ? 0 : (now / 80 + wave * 30) % 40;
        for (var x = -40 + shift; x < w; x += 46) ctx.fillRect(x, wy, 22, 2);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = SAND;
      ctx.fillRect(0, h * 0.84, w, h * 0.16);

      var officeX = 28;
      ctx.fillStyle = WATER;
      ctx.fillRect(officeX, h * 0.72, 54, h * 0.14);
      ctx.fillStyle = SAND;
      ctx.fillRect(officeX + 22, h * 0.78, 12, h * 0.08);
      ctx.fillStyle = state.captains && state.captains[0] && state.captains[0].hired ? LAMP : TIMBER;
      ctx.fillRect(officeX + 40, h * 0.74, 6, 6);

      var sheds = state.warehouses || 1;
      for (var s = 0; s < sheds; s++) {
        var sx = w - 36 - s * 28;
        ctx.fillStyle = TIMBER;
        ctx.fillRect(sx, h * 0.76, 22, h * 0.1);
        ctx.fillStyle = HULL;
        ctx.beginPath();
        ctx.moveTo(sx - 2, h * 0.76);
        ctx.lineTo(sx + 11, h * 0.70);
        ctx.lineTo(sx + 24, h * 0.76);
        ctx.fill();
      }

      var best = 0;
      for (var b = 0; b < 4; b++) best = Math.max(best, boatCount(state, b));
      var barks = boatCount(state, 3);
      var flagsOn = best >= 25 || barks >= 12;
      var quayEnd = Math.min(w * (barks >= 12 ? 0.74 : 0.60), w - 36 - (sheds - 1) * 28 - 8);
      ctx.fillStyle = TIMBER;
      ctx.fillRect(w * 0.18, h * 0.78, Math.max(0, quayEnd - w * 0.18), 8);
      var lampR = Math.max(3, h * 0.03);
      var lampY = Math.min(h * 0.40, topLane - 22 - lampR - 6);
      if (barks >= 16 && lampY - lampR >= 2) {
        ctx.fillStyle = LAMP;
        ctx.beginPath();
        ctx.arc(w * 0.72, lampY, lampR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.font = '14px Georgia, Palatino, serif';
      var rows = boatCount(state, 0);
      var rowLabel = rows + ' ' + (rows === 1 ? 'rowboat' : 'rowboats');
      /* The flags start after the rowboat count. On a wide harbour the count already ends first, so they stay a quarter of the way along. */
      var flagX = Math.max(w * 0.24, 16 + ctx.measureText(rowLabel).width + 8);
      var flagEnd = flagX + 3 * 28 + 10;
      var pierEnd = w * 0.60;
      var px = w * 0.40;
      /* After the last flag when he would cover one. A wide harbour already clears them, so that layout stays. A long count cannot walk him off the pier. */
      if (flagsOn && px - 4 < flagEnd) px = flagEnd + 12;
      if (px + 12 > pierEnd) px = pierEnd - 12;
      if (flagsOn) {
        ctx.fillStyle = LAMP;
        for (var f = 0; f < 4; f++) {
          var fx = flagX + f * 28;
          ctx.fillRect(fx, h * 0.78 - 16, 2, 16);
          ctx.beginPath();
          ctx.moveTo(fx + 2, h * 0.78 - 16);
          ctx.lineTo(fx + 10, h * 0.78 - 12);
          ctx.lineTo(fx + 2, h * 0.78 - 8);
          ctx.fill();
        }
      }
      if (best >= 100) {
        ctx.strokeStyle = TIMBER;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w * 0.62, h * 0.84);
        ctx.lineTo(w * 0.62, h * 0.58);
        ctx.lineTo(w * 0.78, h * 0.58);
        ctx.stroke();
        ctx.fillStyle = HULL;
        ctx.fillRect(w * 0.74, h * 0.58, 8, 10);
      }

      var rowing = view.rowing > 0 && now - view.rowing < 900;
      var trip = rowing ? (now - view.rowing) / 900 : 0;
      var skiffX = w * 0.22 + (rowing ? Math.sin(trip * Math.PI) * w * 0.45 : 0);
      drawBoat(ctx, 'rowboat', skiffX, h * 0.62 + bob(1));

      /* Every owned fleet stays on the water, between the waterline and the pier. */
      function fleet(kind, index, y, spread) {
        var n = boatCount(state, index);
        var show = Math.min(n, 5);
        var word = n === 1 ? kind : kind + 's';
        var label = n + ' ' + word;
        ctx.font = '14px Georgia, Palatino, serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = WATER;
        ctx.fillRect(0, y - 12, ctx.measureText(label).width + 16, 19);
        ctx.lineWidth = 3;
        ctx.strokeStyle = WATER;
        ctx.strokeText(label, 10, y + 4);
        ctx.fillStyle = MIST;
        ctx.fillText(label, 10, y + 4);
        var start = Math.max(w * 0.34, 10 + ctx.measureText(label).width + 12);
        /* The hull is centred, so the first rowboat starts a hull-half and a gap past the last flag. */
        if (kind === 'rowboat' && flagsOn) start = Math.max(start, flagEnd + 11 + 8);
        var room = Math.max(spread, w - 16 - start);
        var step = show > 1 ? Math.min(spread, room / (show - 1)) : spread;
        for (var i = 0; i < show; i++) drawBoat(ctx, kind, start + i * step, y + bob(i + index));
      }
      if (state.captains && state.captains[0] && state.captains[0].hired) {
        var py = h * 0.78 - 18;
        ctx.fillStyle = SAND;
        ctx.fillRect(px, py, 8, 14);
        ctx.fillRect(px - 4, py + 4, 16, 3);
        ctx.beginPath();
        ctx.arc(px + 4, py - 4, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      var lanes = [
        ['rowboat', 0, 24],
        ['sloop', 1, 32],
        ['schooner', 2, 40],
        ['bark', 3, 50]
      ].filter(function (lane) { return boatCount(state, lane[1]) > 0; });
      var ys = laneYs(h, lanes.length);
      lanes.forEach(function (lane, index) {
        fleet(lane[0], lane[1], ys[index], lane[2]);
      });

      if (!reduce) {
        var gx = ((now / 40) % (w + 40)) - 20;
        ctx.strokeStyle = WATER;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(gx, h * 0.18);
        ctx.lineTo(gx + 7, h * 0.18 + 4);
        ctx.lineTo(gx + 14, h * 0.18);
        ctx.stroke();
      }

      if (view.ripple && now - view.ripple.at < 700) {
        var age = (now - view.ripple.at) / 700;
        var rx = view.ripple.x - rect.left;
        var ry = view.ripple.y - rect.top;
        ctx.globalAlpha = 1 - age;
        ctx.strokeStyle = MIST;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rx, ry, 8 + age * 28, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
    return { stop: function () { running = false; } };
  }

  window.SaltmarshHarbour = { init: init, laneYs: laneYs, waterTop: waterTop };
})();
