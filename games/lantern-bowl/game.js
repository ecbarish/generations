/* Lantern Bowl, on the field. The sim is model.js. The camera is view.js.
   Saves, numbers, sound and the settings row come from shared/. */
(function () {
  'use strict';

  var M = window.LanternModel, V = window.LanternView;
  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('field'), ctx = canvas.getContext('2d');
  var KEY = 'lantern-bowl-save-v1', VERSION = '0.1.1', SAVE_V = 1;
  var reduce = Settings.reduced();

  /* Older files climb: steps[1] turns a v1 save into v2, and so on, until SAVE_V.
     A file newer than this game is refused, so it is not reset into an older shape. */
  function migrateSave(raw) {
    if (!raw || typeof raw !== 'object' || raw.game !== 'lantern-bowl' || typeof raw.v !== 'number') return null;
    var target = migrateSave.SAVE_V;
    var data = raw, guard = 0;
    while (data.v !== target && guard++ < 8) {
      if (!(data.v < target)) return null;
      var step = migrateSave.steps[data.v];
      if (typeof step !== 'function') return null;
      var from = data.v;
      data = step(data);
      if (!data || typeof data.v !== 'number' || !(data.v > from)) return null;
    }
    if (!data || data.v !== target || data.game !== 'lantern-bowl') return null;
    if (data.match != null && !(data.match.score && data.match.home && data.match.away)) return null;
    return data;
  }
  migrateSave.steps = {};
  migrateSave.SAVE_V = SAVE_V;

  Arcade.validators[KEY] = function (o) { return !!migrateSave(o); };

  var raw = Arcade.load(KEY);
  var migrated = migrateSave(raw);
  var save = {
    v: SAVE_V, game: 'lantern-bowl',
    sound: migrated && [0, 1, 2].indexOf(migrated.sound) >= 0 ? migrated.sound : 0,
    match: migrated && migrated.match ? migrated.match : null
  };

  var state = null, mode = 'title', last = 0, bannerUntil = 0, aimDrag = null;
  var keys = new Set(), turboHeld = false, gesture = null, steer = 0, queued = { juke: 0, dive: false, throw: null };

  function persist() {
    save.match = state ? M.serialise(state) : save.match;
    var ok = Arcade.save(KEY, save);
    if (state) {
      Arcade.report('lantern-bowl', {
        summary: 'Lanterns ' + state.score.home + '–' + state.score.away,
        detail: 'Q' + state.quarter + ' ' + Arcade.fmtTime(Math.max(0, Math.ceil(state.clock)))
      });
    }
    return ok;
  }

  var audio = ArcadeSound.create({
    mode: function () { return save.sound; },
    setMode: function (v) { save.sound = v; persist(); },
    button: function () { return $('sound'); },
    musicKey: function () { return mode === 'title' ? null : 'field'; },
    tracks: {
      field: {
        bpm: 92, lead: 'pulse',
        mel: 'E4 G4 A4 . G4 E4 D4 . E4 G4 B4 A4 G4 E4 D4 E4',
        bass: 'E2 . A2 . D2 . E2 . G2 . A2 . E2 .',
        drum: 'k . h . s . h h'
      }
    }
  });
  $('sound').addEventListener('click', function () { audio.cycle(); });
  audio.render();

  Settings.create({
    mount: '#settingsMount',
    rows: [{
      label: 'Sound',
      options: [[0, 'Off'], [1, 'Effects'], [2, 'Effects and music']],
      get: function () { return save.sound; },
      set: function (v) { save.sound = v; persist(); audio.render(); audio.sfx('select'); }
    }]
  });
  if (window.Feedback) Feedback.register('Lantern Bowl', VERSION, function () {
    if (!state) return 'before kickoff';
    return M.downWords(state) + ', ' + state.score.home + '–' + state.score.away;
  });

  function say(text) {
    var banner = $('banner');
    banner.hidden = !text;
    banner.textContent = text || '';
    bannerUntil = 0;
  }
  function sentences(text) {
    var parts = String(text || '').match(/[^.!?]+[.!?]+/g);
    if (!parts || !parts.length) return [String(text || '')];
    return parts.map(function (s) { return s.trim(); }).filter(Boolean);
  }
  function panel(title, body) {
    $('panel').innerHTML = '<h2 id="panelTitle">' + title + '</h2>' + body;
    $('curtain').hidden = false;
  }
  function hidePanel() { $('curtain').hidden = true; }

  function title() {
    mode = 'title'; state = null;
    var again = save.match ? '<button type="button" data-continue>Continue the game</button>' : '';
    panel('Lamplight Field',
      '<p>The Brackenport Lanterns have Millrace under the lanterns. You call the offence. Their drives are told in a few lines.</p>' +
      '<p>Two-minute quarters. Drag to throw, swipe to juke, tap to dive. Turbo spends your wind.</p>' +
      '<div class="actions"><button type="button" data-kick>Kick off</button>' + again + '</div>');
    dock([]);
  }

  function kickoff(seed) {
    state = M.create({ seed: (seed >>> 0) || (Date.now() >>> 0) || 1 });
    mode = 'play';
    hidePanel();
    persist();
    showCall();
    canvas.focus();
  }

  function resume() {
    if (!save.match) return title();
    state = M.restore(save.match);
    hidePanel();
    if (state.phase === 'final') return showFinal();
    mode = 'play';
    if (state.phase === 'cpu' || state.possession === 'away') return showCpu();
    showCall();
    canvas.focus();
  }

  function showCall() {
    if (!state || state.phase === 'final') return showFinal();
    if (state.possession !== 'home') return showCpu();
    mode = 'play';
    var fourth = state.down >= 4;
    var buttons = [];
    Object.keys(M.PLAYS).forEach(function (id) {
      var p = M.PLAYS[id];
      buttons.push({ id: id, label: p.label, detail: p.detail });
    });
    if (fourth) buttons.unshift({ id: 'kick', label: 'Kick', detail: state.spot >= 62 ? 'Try a field goal.' : 'Punt it away.' });
    dock(buttons);
    say(M.currentMessage(state));
  }

  function showCpu() {
    mode = 'summary';
    var lines = M.cpuDrive(state, function () { persist(); });
    persist();
    if (!state || state.phase === 'final') return showFinal();
    var items = (lines.length ? lines : [{ text: 'They give it back.' }]).map(function (line) {
      var text = typeof line === 'string' ? line : line.text;
      return '<li>' + sentences(text).map(function (s) { return '<p>' + escapeText(s) + '</p>'; }).join('') + '</li>';
    }).join('');
    panel('Millrace had the ball',
      '<ol class="cpu-log">' + items + '</ol>' +
      '<div class="actions"><button type="button" data-ours>Our ball</button></div>');
    dock([]);
  }

  function showFinal() {
    mode = 'final';
    var s = state.score;
    var line = s.home === s.away ? 'Level at the lanterns.' : s.home > s.away ? 'The Lanterns take it.' : 'Millrace takes it.';
    panel('Final', '<p>' + line + '</p><p>Lanterns ' + s.home + ', Millrace ' + s.away + '.</p><div class="actions"><button type="button" data-again>Play again</button></div>');
    dock([]);
    persist();
    audio.sfx(s.home >= s.away ? 'win' : 'lose');
  }

  function escapeText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function dock(buttons) {
    $('dock').innerHTML = buttons.map(function (b) {
      return '<button type="button" data-play="' + b.id + '">' + b.label + '</button>';
    }).join('') + (mode === 'play' && state && state.phase === 'live'
      ? '<button type="button" id="turbo" aria-label="Turbo">Turbo</button>' : '');
    var turbo = $('turbo');
    if (turbo) {
      turbo.addEventListener('pointerdown', function (e) { e.preventDefault(); turboHeld = true; turbo.classList.add('held'); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        turbo.addEventListener(ev, function () { turboHeld = false; turbo.classList.remove('held'); });
      });
    }
  }

  function begin(id) {
    if (!state || state.phase !== 'call' || state.possession !== 'home') return;
    if (id === 'kick') { M.kick(state); afterWhistle(); return; }
    if (!M.callPlay(state, id)) return;
    audio.sfx('select');
    hidePanel();
    say('');
    dock([]);
    var live = '<button type="button" id="turbo" aria-label="Turbo">Turbo</button>';
    $('dock').innerHTML = live;
    var turbo = $('turbo');
    turbo.addEventListener('pointerdown', function (e) { e.preventDefault(); turboHeld = true; turbo.classList.add('held'); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      turbo.addEventListener(ev, function () { turboHeld = false; if (turbo) turbo.classList.remove('held'); });
    });
    canvas.focus();
  }

  function afterWhistle() {
    audio.sfx(state.last && state.last.kind === 'score' ? 'win' : state.last && state.last.kind === 'turnover' ? 'warn' : 'hit');
    persist();
    turboHeld = false;
    if (state.phase === 'final') return showFinal();
    if (state.phase === 'cpu' || state.possession === 'away') return showCpu();
    showCall();
  }

  function finishLive() {
    if (state && state.phase === 'live') M.finish(state, M.policies.neutral);
    if (state && state.phase !== 'live') afterWhistle();
  }

  $('dock').addEventListener('click', function (e) {
    var b = e.target.closest('[data-play]');
    if (b) begin(b.dataset.play);
  });
  $('curtain').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    if (b.hasAttribute('data-kick')) kickoff();
    else if (b.hasAttribute('data-again')) { save.match = null; state = null; persist(); title(); }
    else if (b.hasAttribute('data-continue')) resume();
    else if (b.hasAttribute('data-ours')) { mode = 'play'; hidePanel(); showCall(); }
  });

  function readGesture() {
    var out = { steer: steer, turbo: turboHeld || keys.has('shift'), juke: queued.juke, dive: queued.dive || keys.has(' '), throw: queued.throw };
    queued = { juke: 0, dive: false, throw: null };
    if (keys.has('j')) out.juke = -1;
    if (keys.has('l')) out.juke = 1;
    if (keys.has('arrowleft') || keys.has('a')) out.steer = -1;
    if (keys.has('arrowright') || keys.has('d')) out.steer = 1;
    return out;
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (!state || state.phase !== 'live') return;
    canvas.setPointerCapture(e.pointerId);
    gesture = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
    aimDrag = null;
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!gesture || gesture.id !== e.pointerId || !state || state.phase !== 'live') return;
    if (state.play && state.play.family === 'run') steer = Math.max(-1, Math.min(1, (e.clientX - gesture.x) / 80));
    var pass = state.play && state.play.family === 'pass' && !state.play.thrown && !state.play.flight;
    if (!pass) { aimDrag = null; return; }
    var dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
    var rect = canvas.getBoundingClientRect();
    var pull = V.classifyPull(Math.hypot(dx, dy));
    var dir = V.dragToField(dx, dy);
    aimDrag = {
      kind: pull.kind,
      preview: M.aimThrow(state.play, { dirX: dir.dirX, dirY: dir.dirY, power: pull.power }),
      x: e.clientX - rect.left, y: e.clientY - rect.top
    };
  });
  canvas.addEventListener('pointerup', function (e) {
    aimDrag = null;
    if (!gesture || !state || state.phase !== 'live') { gesture = null; steer = 0; return; }
    var dx = e.clientX - gesture.x, dy = e.clientY - gesture.y;
    var dist = Math.hypot(dx, dy), quick = performance.now() - gesture.t < 320;
    var pass = state.play && state.play.family === 'pass' && !state.play.thrown && !state.play.flight;
    if (pass && dist > 22) {
      var pull = V.classifyPull(dist), dir = V.dragToField(dx, dy);
      queued.throw = { dirX: dir.dirX, dirY: dir.dirY, power: pull.power };
    } else if (quick && Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      queued.juke = dx > 0 ? 1 : -1;
    } else if (dist < 18) queued.dive = true;
    gesture = null; steer = 0;
  });

  window.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input,button,a,select,textarea,.arc-set-bg')) return;
    var k = e.key.toLowerCase();
    if (k === 'p' || k === 'escape') { e.preventDefault(); togglePause(); return; }
    if (mode === 'play' && state && state.phase === 'call' && '1234'.indexOf(k) >= 0) {
      begin(['inside', 'outside', 'quick', 'deep'][Number(k) - 1]);
      return;
    }
    if (k === 'k' && state && state.phase === 'call' && state.down >= 4) { begin('kick'); return; }
    keys.add(k);
    if (k === ' ' || k === 'arrowleft' || k === 'arrowright') e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { keys.delete(e.key.toLowerCase()); });

  function togglePause() {
    if (!state || state.phase === 'final') return;
    if (mode === 'pause') { mode = 'play'; hidePanel(); return; }
    if (mode !== 'play') return;
    mode = 'pause';
    panel('Paused', '<div class="actions"><button type="button" id="resume">Resume</button></div>');
    $('resume').addEventListener('click', function () { mode = 'play'; hidePanel(); });
  }

  function soundFor(events) {
    (events || []).forEach(function (ev) {
      if (ev === 'catch') audio.sfx('catch');
      else if (ev === 'tackle' || ev === 'sack') audio.sfx('hit');
      else if (ev === 'juke' || ev === 'dive') audio.sfx('dodge');
      else if (ev === 'throw' || ev === 'lob' || ev === 'snap') audio.sfx('select');
      else if (ev === 'miss' || ev === 'pick') audio.sfx('miss');
    });
  }

  function hud() {
    if (!state) {
      $('homeScore').textContent = '0'; $('awayScore').textContent = '0';
      $('clock').textContent = 'Q1 ' + Arcade.fmtTime(M.QUARTER);
      $('down').textContent = 'Kickoff';
      $('gas').hidden = true;
      $('windLabel').textContent = '';
      if ($('sheet')) $('sheet').hidden = true;
      return;
    }
    $('homeScore').textContent = Arcade.fmt(state.score.home);
    $('awayScore').textContent = Arcade.fmt(state.score.away);
    $('clock').textContent = 'Q' + state.quarter + ' ' + Arcade.fmtTime(Math.max(0, Math.ceil(state.clock)));
    $('down').textContent = state.phase === 'final' ? 'Final' : M.downWords(state);
    var play = state.play, name = play ? (play.actors[play.carrier] && play.actors[play.carrier].name) : '';
    var wind = name ? 1 - (state.fatigue[name] || 0) : 1;
    var showWind = !!(play && state.phase === 'live');
    $('gas').hidden = !showWind;
    $('gas').classList.toggle('low', wind < 0.28);
    $('gas').querySelector('i').style.width = Math.round(wind * 100) + '%';
    $('gas').setAttribute('aria-label', 'Wind ' + Math.round(wind * 100));
    $('windLabel').textContent = showWind ? 'Wind ' + Arcade.fmt(Math.round(wind * 100)) : '';
    var sheet = $('sheet');
    if (sheet) {
      var off = state[state.possession === 'away' ? 'away' : 'home'];
      var def = state[state.possession === 'away' ? 'home' : 'away'];
      var hands = off.wr && off.wr[0] ? off.wr[0] : off.qb;
      sheet.hidden = false;
      sheet.textContent = off.qb.name + ' throw ' + Arcade.fmt(off.qb.throw) + ' · ' + hands.name + ' hands ' + Arcade.fmt(hands.catch) + ' · Line ' + Arcade.fmt(off.line) + ' vs rush ' + Arcade.fmt(def.rush);
    }
    var msg = state.phase === 'live' ? '' : M.currentMessage(state);
    if ($('banner').textContent !== msg) say(msg);
  }

  function resize() {
    var r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return { w: r.width, h: r.height, dpr: dpr };
  }

  function drawAthlete(p, fill, outline, pose) {
    var s = p.scale;
    var lean = pose && pose.juke ? pose.juke * 10 * s : 0;
    var squash = pose && pose.dive ? 0.62 : 1;
    ctx.save();
    ctx.translate(p.x + lean, p.y);
    ctx.scale(1, squash);
    ctx.lineWidth = Math.max(1.4, 2 * s);
    ctx.strokeStyle = outline;
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.ellipse(0, -7 * s, 3.1 * s, 5.2 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e4c2a4';
    ctx.beginPath(); ctx.arc(0, -14 * s, 2.3 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (pose && pose.word) {
      ctx.fillStyle = '#f6edd4';
      ctx.font = '700 ' + Math.max(12, 13 * s) + 'px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(pose.word, p.x + lean, p.y - 28 * s);
    }
  }

  function strokeWorld(ax, ay, bx, by, cam, view, color, width) {
    var a = V.project('behind', { x: ax, y: ay }, cam, view);
    var b = V.project('behind', { x: bx, y: by }, cam, view);
    if (!a || !b) return;
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }

  function draw() {
    var box = resize();
    ctx.setTransform(box.dpr, 0, 0, box.dpr, 0, 0);
    ctx.fillStyle = '#1b2438'; ctx.fillRect(0, 0, box.w, box.h);
    var view = { w: box.w, h: box.h };
    var play = state && state.play;
    var focus = play ? play.actors[play.carrier] : { x: 0, y: 0 };
    var cam = { x: (focus.x || 0) - 3, y: (focus.y || 0) * 0.25 };
    var offence = state ? (play ? play.offence : state.possession) : 'home';
    var sky = ctx.createLinearGradient(0, 0, 0, box.h * 0.45);
    sky.addColorStop(0, '#243456'); sky.addColorStop(1, '#6a4a52');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, box.w, box.h * 0.42);

    for (var yard = -8; yard <= 36; yard += 5) {
      var near = V.project('behind', { x: yard, y: -26 }, cam, view);
      var far = V.project('behind', { x: yard + 5, y: -26 }, cam, view);
      var farR = V.project('behind', { x: yard + 5, y: 26 }, cam, view);
      var nearR = V.project('behind', { x: yard, y: 26 }, cam, view);
      if (!near || !far || !farR || !nearR) continue;
      ctx.fillStyle = Math.round(yard / 5) % 2 ? '#1f6b3c' : '#257445';
      ctx.beginPath(); ctx.moveTo(near.x, near.y); ctx.lineTo(far.x, far.y); ctx.lineTo(farR.x, farR.y); ctx.lineTo(nearR.x, nearR.y); ctx.closePath(); ctx.fill();
    }
    [-26, 26].forEach(function (y) { strokeWorld(-8, y, 40, y, cam, view, '#f2d080', 2); });
    if (state) {
      strokeWorld(0, -26, 0, 26, cam, view, '#7fb6ff', 2);
      strokeWorld(state.toGo, -26, state.toGo, 26, cam, view, '#f2d080', 2);
    }
    if (play) {
      if (play.family === 'run' || play.didCatch) {
        play.lanes.forEach(function (lane) {
          var y0 = lane.y - 5, y1 = lane.y + 5;
          var a = V.project('behind', { x: 0.2, y: y0 }, cam, view);
          var b = V.project('behind', { x: 7, y: y0 }, cam, view);
          var c = V.project('behind', { x: 7, y: y1 }, cam, view);
          var d = V.project('behind', { x: 0.2, y: y1 }, cam, view);
          if (!a || !b || !c || !d) return;
          ctx.fillStyle = lane.open ? 'rgba(90, 210, 120, 0.38)' : 'rgba(210, 70, 60, 0.38)';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill();
        });
      }
      if (play.family === 'pass' && !play.thrown) {
        var qb = play.actors[play.carrier];
        var rx = play.pocket * 0.45, ry = play.pocket, guard = 0, ring = [];
        while (guard++ < 8) {
          ring = [];
          var outside = false;
          for (var i = 0; i <= 28; i++) {
            var ang = i / 28 * Math.PI * 2;
            var pt = V.project('behind', { x: qb.x + Math.cos(ang) * rx, y: qb.y + Math.sin(ang) * ry }, cam, view);
            if (!pt || pt.x < 6 || pt.y < 6 || pt.x > view.w - 6 || pt.y > view.h - 6) outside = true;
            if (pt) ring.push(pt);
          }
          if (!outside) break;
          rx *= 0.78; ry *= 0.78;
        }
        if (ring.length) {
          ctx.beginPath();
          ring.forEach(function (pt, i) { if (i) ctx.lineTo(pt.x, pt.y); else ctx.moveTo(pt.x, pt.y); });
          ctx.closePath();
          ctx.fillStyle = play.pocket < 2.2 ? 'rgba(211, 91, 74, 0.28)' : 'rgba(242, 208, 128, 0.2)';
          ctx.fill();
          ctx.strokeStyle = play.pocket < 2.2 ? '#ffb0a4' : '#f2d080';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
      var sprites = play.actors.map(function (a) {
        var pt = V.project('behind', a, cam, view);
        return { a: a, p: pt };
      }).filter(function (s) { return s.p; }).sort(function (u, v) { return u.p.y - v.p.y; });
      var carrier = play.actors[play.carrier];
      var juking = !!(carrier && play.jukeUntil && play.elapsed < play.jukeUntil);
      var diving = !!(carrier && (play.diving || (play.diveUntil && play.elapsed < play.diveUntil)));
      sprites.forEach(function (s) {
        var team = s.a.off ? state[play.offence] : state[play.offence === 'home' ? 'away' : 'home'];
        var aimed = aimDrag && aimDrag.preview && aimDrag.preview.target === s.a;
        var pose = s.a === carrier ? { juke: juking ? (play.jukeDir || 1) : 0, dive: diving, word: juking ? 'Juke' : diving ? 'Dive' : '' } : null;
        drawAthlete(s.p, team.color, aimed ? '#f2d080' : M.teamOutline(team.color), pose);
        if (aimed) {
          var mark = V.fitCircle(s.p, 16 * s.p.scale, view, 6);
          ctx.strokeStyle = '#f2d080'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(mark.x, mark.y, Math.max(8, mark.r), 0, Math.PI * 2); ctx.stroke();
        }
      });
      if (play.family === 'pass' && !play.thrown && carrier) {
        var from = V.project('behind', carrier, cam, view);
        if (from) {
          var start = V.fitCircle(from, 14 * from.scale, view, 6);
          ctx.strokeStyle = '#f6edd4'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(start.x, start.y, Math.max(7, start.r), 0, Math.PI * 2); ctx.stroke();
          if (aimDrag && aimDrag.preview) {
            var end = V.project('behind', { x: aimDrag.preview.x, y: aimDrag.preview.y }, cam, view) || { x: aimDrag.x, y: aimDrag.y, scale: 1 };
            var tip = V.fitCircle(end, 8, view, 6);
            ctx.strokeStyle = aimDrag.kind === 'bullet' ? '#f2d080' : '#d7ecff';
            ctx.lineWidth = aimDrag.kind === 'bullet' ? 4 : 2;
            ctx.setLineDash(aimDrag.kind === 'lob' ? [7, 6] : []);
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            if (aimDrag.kind === 'lob') ctx.quadraticCurveTo((start.x + tip.x) / 2, Math.min(start.y, tip.y) - 36, tip.x, tip.y);
            else ctx.lineTo(tip.x, tip.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#f6edd4';
            ctx.font = '700 14px ui-monospace, monospace';
            ctx.textAlign = 'center';
            var labelAt = V.fitCircle({ x: (start.x + tip.x) / 2, y: (start.y + tip.y) / 2 - 16 }, 4, view, 8);
            ctx.fillText(aimDrag.kind === 'bullet' ? 'Bullet' : 'Lob', labelAt.x, labelAt.y);
          }
        }
      }
      var ballAt = play.flight ? { x: play.flight.x, y: play.flight.y } : play.actors[play.carrier];
      var ball = V.project('behind', ballAt, cam, view);
      if (ball) {
        ctx.fillStyle = '#f2d080'; ctx.strokeStyle = '#1e1a22'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(ball.x, ball.y, 4 * ball.scale, 2.4 * ball.scale, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    } else if (state) {
      var off = state[offence], def = state[offence === 'home' ? 'away' : 'home'];
      var standing = [
        { off: true, x: -6, y: 0 }, { off: true, x: -1, y: 0 }, { off: true, x: 0, y: -10 }, { off: true, x: 0, y: 10 }, { off: true, x: 0, y: -3 },
        { off: false, x: 1.4, y: -12 }, { off: false, x: 1.2, y: 0 }, { off: false, x: 1.4, y: 12 }, { off: false, x: 7, y: -4 }, { off: false, x: 8, y: 5 }
      ];
      standing.map(function (a) {
        return { a: a, p: V.project('behind', a, cam, view), team: a.off ? off : def };
      }).filter(function (s) { return s.p; }).sort(function (u, v) { return u.p.y - v.p.y; }).forEach(function (s) {
        drawAthlete(s.p, s.team.color, M.teamOutline(s.team.color));
      });
    }
    if (!reduce) {
      ctx.fillStyle = 'rgba(242, 208, 128, 0.08)';
      var glow = V.fitCircle({ x: box.w * 0.5, y: 18 }, 70, view, 4);
      ctx.beginPath(); ctx.arc(glow.x, glow.y, glow.r, 0, Math.PI * 2); ctx.fill();
    }
  }

  function frame(now) {
    var dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (mode === 'play' && state && state.phase === 'live' && !document.hidden) {
      M.step(state, reduce ? Math.min(dt, 0.02) : dt, readGesture());
      soundFor(state.events);
      if (state.phase !== 'live') afterWhistle();
    }
    hud();
    draw();
    requestAnimationFrame(frame);
  }

  title();
  requestAnimationFrame(frame);

  if (['localhost', '127.0.0.1', '[::1]'].indexOf(location.hostname) >= 0) {
    window.__lantern = {
      M: M, V: V, VERSION: VERSION, KEY: KEY,
      get state() { return state; },
      get save() { return save; },
      get mode() { return mode; },
      kickoff: kickoff, resume: resume, begin: begin, finishLive: finishLive, persist: persist,
      migrateSave: migrateSave
    };
  }
})();
