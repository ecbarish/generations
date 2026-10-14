/* Lantern Bowl, on the field. The sim is model.js. The camera is view.js.
   Saves, numbers, sound and the settings row come from shared/. */
(function () {
  'use strict';

  var M = window.LanternModel, V = window.LanternView;
  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('field'), ctx = canvas.getContext('2d');
  var KEY = 'lantern-bowl-save-v1', VERSION = '0.1.4', SAVE_V = 2;
  var reduce = Settings.reduced();
  var sideCam = null;
  var STRIPS = [
    'offence_skill_side_idle', 'offence_skill_side_run', 'offence_skill_side_throw', 'offence_skill_side_dive',
    'defence_skill_side_idle', 'defence_skill_side_run', 'defence_skill_side_tackle',
    'offence_line_side_idle', 'offence_line_side_run',
    'defence_line_side_idle', 'defence_line_side_run', 'defence_line_side_tackle'
  ];
  function loadArt() {
    STRIPS.forEach(function (name) {
      var img = new Image();
      img.onload = function () { V.drawPlayer.sprites[name + '.png'] = img; };
      img.src = 'art/' + name + '.png';
      var mask = new Image();
      mask.onload = function () { V.drawPlayer.masks[name + '.png'] = mask; };
      mask.src = 'art/' + name + '_mask.png';
    });
  }
  loadArt();

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
  /* v1 files have no overtime count. The match itself is unchanged. */
  migrateSave.steps = {
    1: function (data) {
      var next = Object.assign({}, data);
      next.v = 2;
      if (next.match && typeof next.match === 'object') {
        next.match = Object.assign({}, next.match);
        if (next.match.otTurns == null) next.match.otTurns = 0;
      }
      return next;
    }
  };
  migrateSave.SAVE_V = SAVE_V;

  Arcade.validators[KEY] = function (o) { return !!migrateSave(o); };

  function newerSave(file) {
    return !!(file && typeof file === 'object' && file.game === 'lantern-bowl' && typeof file.v === 'number' && isFinite(file.v) && file.v > SAVE_V);
  }
  var HELD_NOTE = 'This save is from a newer version, so progress will not be saved.';
  var raw = Arcade.load(KEY);
  var holdSave = newerSave(raw);
  var migrated = holdSave ? null : migrateSave(raw);
  var save = {
    v: SAVE_V, game: 'lantern-bowl',
    sound: migrated && [0, 1, 2].indexOf(migrated.sound) >= 0 ? migrated.sound : 0,
    match: migrated && migrated.match ? migrated.match : null
  };

  var state = null, mode = 'title', last = 0, bannerUntil = 0, aimDrag = null, lastSheet = '';
  var keys = new Set(), turboHeld = false, gesture = null, steer = 0, queued = { juke: 0, dive: false, throw: null };
  var sheetDetail = false, watchLeft = 0, touchGuard = 0, rushWatch = false, promptUntil = 0;
  var pointerNotes = [];

  function persist() {
    if (holdSave) return false;
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
  var build = $('build');
  if (build) build.textContent = 'v' + VERSION;
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
  function prompt(text) {
    say(text);
    promptUntil = performance.now() + 2200;
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

  function showHeld() {
    var el = $('held');
    if (!el) return;
    el.hidden = !holdSave;
    el.textContent = holdSave ? HELD_NOTE : '';
  }
  function title() {
    mode = 'title'; state = null; lastSheet = ''; sheetDetail = false; watchLeft = 0;
    showHeld();
    say('');
    var sheet = $('sheet');
    if (sheet) { sheet.textContent = ''; sheet.hidden = true; }
    var cue = $('cue');
    if (cue) { cue.hidden = true; cue.textContent = ''; }
    var again = save.match ? '<button type="button" data-continue>Continue the game</button>' : '';
    panel('Lamplight Field',
      '<p>The Brackenport Lanterns have Millrace under the lanterns. You call the offence. Their drives play out on the field.</p>' +
      '<p>Two-minute quarters. Pick a play, then drag right to throw. A short pull stays short. Swipe to juke, tap to dive.</p>' +
      '<div class="actions"><button type="button" data-kick>Kick off</button>' + again + '</div>');
    dock();
  }

  function kickoff(seed) {
    lastSheet = '';
    state = M.create({ seed: (seed >>> 0) || (Date.now() >>> 0) || 1 });
    mode = 'play';
    hidePanel();
    persist();
    showCall();
    canvas.focus();
  }

  function resume() {
    if (!save.match) return title();
    lastSheet = '';
    state = M.restore(save.match);
    hidePanel();
    if (state.phase === 'final') return showFinal();
    mode = 'play';
    if (state.phase === 'cpu' || state.possession === 'away') return beginWatch();
    showCall();
    canvas.focus();
  }

  function showCall() {
    if (!state || state.phase === 'final') return showFinal();
    if (state.possession !== 'home') return beginWatch();
    if (mode === 'watch') lastSheet = '';
    mode = 'play';
    dock();
    say(M.currentMessage(state));
  }

  /* Millrace's snaps play on the field. Each one stays live so the ball and the players move, then the result holds briefly. */
  function beginWatch() {
    if (!state || state.phase === 'final') return showFinal();
    if (state.possession === 'home') return showCall();
    mode = 'watch';
    hidePanel();
    if (state.phase === 'live') { lastSheet = ''; dock(); return; }
    lastSheet = '';
    say('');
    if (state.down >= 4) {
      M.kick(state);
      return holdWatch();
    }
    if (!M.callPlay(state, M.cpuCall(state))) {
      if (state.phase === 'final') return showFinal();
      return showCall();
    }
    dock();
  }
  function holdWatch() {
    mode = 'watch';
    hidePanel();
    watchLeft = rushWatch ? 0.04 : 0.4;
    say(M.currentMessage(state));
    persist();
    dock();
  }

  function showFinal() {
    mode = 'final';
    var s = state.score;
    var line = s.home === s.away ? 'Level at the lanterns.' : s.home > s.away ? 'The Lanterns take it.' : 'Millrace takes it.';
    panel('Final', '<p>' + line + '</p><p>Lanterns ' + s.home + ', Millrace ' + s.away + '.</p><div class="actions"><button type="button" data-again>Play again</button></div>');
    dock();
    say('');
    persist();
    audio.sfx(s.home >= s.away ? 'win' : 'lose');
  }

  function escapeText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function escapeAttr(s) { return escapeText(s).replace(/"/g, '&quot;'); }

  var GLYPH = {
    inside: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M7 10l5-5 5 5"/></svg>',
    outside: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18c8 0 12-6 12-12M14 6h4v4"/></svg>',
    quick: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h10M12 8l4 4-4 4"/></svg>',
    deep: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M14 7l5 5-5 5"/></svg>',
    kick: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/></svg>',
    turbo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14c3-6 5 2 8-4s5 2 8-4"/></svg>'
  };
  function kickWhy(live, fourth) {
    if (live) return 'Kick waits. The play is already going.';
    if (!fourth) return 'Kick waits for fourth down.';
    return '';
  }
  function turboWhy(live) { return live ? '' : 'Turbo waits until the ball is moving.'; }
  function hintText() {
    var live = !!(mode === 'play' && state && state.phase === 'live');
    var show = mode === 'play' && state && (state.phase === 'call' || state.phase === 'live');
    var fourth = !!(state && state.down >= 4);
    var parts = [];
    if (live && state.play && state.play.load > 0 && state.play.offence === 'home') parts.push(M.READING_HINT);
    if (show) {
      var turboNote = turboWhy(live);
      var kickNote = kickWhy(live, fourth);
      if (turboNote) parts.push(turboNote);
      if (kickNote) parts.push(kickNote);
    }
    var passLive = live && state.play && state.play.family === 'pass' && !state.play.thrown && !state.play.flight;
    if (passLive) parts.push('Drag right to throw. A short pull stays short.');
    if (live) parts.push('Swipe to juke. Tap to dive.');
    return parts.join(' ');
  }
  function paintHint() {
    var hint = $('hint');
    if (!hint) return;
    var text = hintText();
    hint.textContent = text;
    hint.classList.toggle('reading', text.indexOf(M.READING_HINT) >= 0);
  }
  function dock() {
    var show = mode === 'play' && state && (state.phase === 'call' || state.phase === 'live');
    var live = !!(show && state.phase === 'live');
    var fourth = !!(state && state.down >= 4);
    paintHint();
    if (!show) { $('dock').innerHTML = ''; return; }
    var cells = [
      { id: 'inside', label: 'Inside', play: true, off: live, why: '' },
      { id: 'outside', label: 'Outside', play: true, off: live, why: '' },
      { id: 'quick', label: 'Quick', play: true, off: live, why: '' },
      { id: 'deep', label: 'Deep', play: true, off: live, why: '' },
      { id: 'kick', label: 'Kick', play: true, off: live || !fourth, why: kickWhy(live, fourth) },
      { id: 'turbo', label: 'Turbo', play: false, off: !live, why: turboWhy(live) }
    ];
    $('dock').innerHTML = '<div class="dock-plays">' + cells.map(function (c) {
      var why = c.off ? c.why : '';
      var name = why ? c.label + '. ' + why : c.label;
      var attr = c.play ? ' data-play="' + c.id + '"' : ' id="turbo"';
      attr += ' aria-label="' + escapeAttr(name) + '" title="' + escapeAttr(why || c.label) + '"';
      var slot = why ? ' data-why="' + escapeAttr(why) + '"' : '';
      return '<span class="slot"' + slot + '><button type="button"' + attr + (c.off ? ' disabled' : '') + '>' + GLYPH[c.id] + '<span>' + c.label + '</span></button></span>';
    }).join('') + '</div>';
    var turbo = $('turbo');
    if (turbo && !turbo.disabled) {
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
    dock();
    canvas.focus();
  }

  function afterWhistle() {
    audio.sfx(state.last && state.last.kind === 'score' ? 'win' : state.last && state.last.kind === 'turnover' ? 'warn' : 'hit');
    persist();
    turboHeld = false;
    if (state.phase === 'final') return showFinal();
    if (state.phase === 'cpu' || state.possession === 'away') return holdWatch();
    showCall();
  }

  function finishLive() {
    if (state && state.phase === 'live' && state.play) lastSheet = snapLine(state);
    if (state && state.phase === 'live') M.finish(state, M.policies.neutral);
    if (state && state.phase !== 'live') afterWhistle();
  }

  $('dock').addEventListener('click', function (e) {
    var why = e.target.closest('[data-why]');
    if (why && why.dataset.why) { prompt(why.dataset.why); return; }
    var b = e.target.closest('[data-play]');
    if (b && !b.disabled) begin(b.dataset.play);
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

  function armGesture(x, y, id) {
    if (!state) return;
    if (state.phase === 'call' && state.possession === 'home') { prompt('Pick a play first.'); return; }
    if (state.phase !== 'live' || mode === 'watch') return;
    gesture = { x: x, y: y, t: performance.now(), id: id };
    aimDrag = null;
  }
  function dragGesture(x, y) {
    if (!gesture || !state || state.phase !== 'live') return;
    if (state.play && state.play.family === 'run') steer = Math.max(-1, Math.min(1, (x - gesture.x) / 80));
    var pass = state.play && state.play.family === 'pass' && !state.play.thrown && !state.play.flight;
    if (!pass) { aimDrag = null; return; }
    var dx = x - gesture.x, dy = y - gesture.y;
    var rect = canvas.getBoundingClientRect();
    var pull = V.classifyPull(Math.hypot(dx, dy));
    var dir = V.dragToField(dx, dy);
    aimDrag = {
      kind: pull.kind,
      preview: M.aimThrow(state.play, { dirX: dir.dirX, dirY: dir.dirY, power: pull.power }),
      x: x - rect.left, y: y - rect.top
    };
  }
  function releaseGesture(x, y) {
    aimDrag = null;
    if (!gesture || !state || state.phase !== 'live') { gesture = null; steer = 0; return; }
    var dx = x - gesture.x, dy = y - gesture.y;
    var dist = Math.hypot(dx, dy), quick = performance.now() - gesture.t < 320;
    var pass = state.play && state.play.family === 'pass' && !state.play.thrown && !state.play.flight;
    if (pass && dist > 22) {
      var pull = V.classifyPull(dist), dir = V.dragToField(dx, dy);
      queued.throw = { dirX: dir.dirX, dirY: dir.dirY, power: pull.power };
    } else if (quick && Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      queued.juke = dx > 0 ? 1 : -1;
    } else if (dist < 18) queued.dive = true;
    gesture = null; steer = 0;
  }
  function fromTouch(e) {
    var t = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
    return t ? { x: t.clientX, y: t.clientY, id: t.identifier } : null;
  }
  function notePointer(source, x, y) {
    pointerNotes.push({ source: source, x: x, y: y });
    if (pointerNotes.length > 12) pointerNotes.shift();
  }
  canvas.addEventListener('touchstart', function (e) {
    var p = fromTouch(e);
    if (!p) return;
    e.preventDefault();
    touchGuard = performance.now() + 800;
    notePointer('touch', p.x, p.y);
    armGesture(p.x, p.y, p.id);
  }, { passive: false });
  canvas.addEventListener('touchmove', function (e) {
    var p = fromTouch(e);
    if (!p) return;
    e.preventDefault();
    touchGuard = performance.now() + 800;
    dragGesture(p.x, p.y);
  }, { passive: false });
  canvas.addEventListener('touchend', function (e) {
    var p = fromTouch(e);
    if (!p) return;
    e.preventDefault();
    touchGuard = performance.now() + 800;
    releaseGesture(p.x, p.y);
  }, { passive: false });
  canvas.addEventListener('touchcancel', function () {
    touchGuard = performance.now() + 800;
    gesture = null; aimDrag = null; steer = 0;
  });
  function mouseAfterTouch(e) {
    return !!(e && (e.pointerType === 'touch' || performance.now() < touchGuard));
  }
  ['mousedown', 'mouseup', 'click'].forEach(function (type) {
    canvas.addEventListener(type, function (e) {
      if (performance.now() >= touchGuard) return;
      notePointer('ignored', e.clientX, e.clientY);
      e.preventDefault();
      e.stopPropagation();
    }, true);
  });
  canvas.addEventListener('pointerdown', function (e) {
    if (mouseAfterTouch(e)) {
      if (e.pointerType !== 'touch') notePointer('ignored', e.clientX, e.clientY);
      return;
    }
    notePointer('pointer', e.clientX, e.clientY);
    if (state && state.phase === 'live') { try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* already gone */ } }
    armGesture(e.clientX, e.clientY, e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (mouseAfterTouch(e) || !gesture || gesture.id !== e.pointerId) return;
    dragGesture(e.clientX, e.clientY);
  });
  canvas.addEventListener('pointerup', function (e) {
    if (mouseAfterTouch(e)) return;
    releaseGesture(e.clientX, e.clientY);
  });
  if ($('sheet')) $('sheet').addEventListener('click', function () { sheetDetail = !sheetDetail; hud(); });

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

  function windClause(game) {
    var note = '';
    Object.keys(game.fatigue || {}).forEach(function (who) {
      var left = Math.round((1 - (game.fatigue[who] || 0)) * 100);
      if (left < 100) note = ' · ' + who + ' wind ' + Arcade.fmt(left);
    });
    return note;
  }
  function blockersPhrase(off, def) {
    var gap = Number(off.line) - Number(def.rush);
    if (gap >= 8) return 'The blockers have room';
    if (gap <= -8) return 'The rush is through';
    return 'The blockers are matched';
  }
  function blockersDetail(off, def) {
    return 'Blockers ' + Arcade.fmt(off.line) + ', rush ' + Arcade.fmt(def.rush);
  }
  function rosterLine(game) {
    var off = game[game.possession === 'away' ? 'away' : 'home'];
    var def = game[game.possession === 'away' ? 'home' : 'away'];
    var hands = off.wr && off.wr[0] ? off.wr[0] : off.qb;
    var wind = windClause(game);
    if (sheetDetail) return off.qb.name + ' throw ' + Arcade.fmt(off.qb.throw) + ' · ' + hands.name + ' hands ' + Arcade.fmt(hands.catch) + ' · ' + blockersDetail(off, def) + wind;
    return off.qb.name + ' throwing · ' + hands.name + ' catching · ' + blockersPhrase(off, def) + wind;
  }
  /* The strip names whoever has the ball on this snap: the carrier on a run,
     or the passer and the target while the throw is still in the air. */
  function snapLine(game) {
    var play = game.play;
    if (!play || !play.actors || !play.actors.length) return rosterLine(game);
    var side = play.offence === 'away' ? 'away' : 'home';
    var off = game[side];
    var def = game[side === 'away' ? 'home' : 'away'];
    var carrier = play.actors[play.carrier] || play.actors[0];
    var wind = windClause(game);
    var match = sheetDetail ? blockersDetail(off, def) : blockersPhrase(off, def);
    if (play.family === 'pass' && !play.didCatch) {
      var target = play.flight && play.flight.target;
      if (!target) {
        play.actors.forEach(function (a) {
          if (!a.off || a.role === 'qb' || !a.route) return;
          if (!target || a.route.x > target.route.x) target = a;
        });
      }
      var hands = target || (off.wr && off.wr[0]) || carrier;
      if (sheetDetail) return carrier.name + ' throw ' + Arcade.fmt(carrier.throw) + ' · ' + hands.name + ' hands ' + Arcade.fmt(hands.catch) + ' · ' + match + wind;
      return carrier.name + ' throwing · ' + hands.name + ' catching · ' + match + wind;
    }
    if (sheetDetail) return carrier.name + ' carry ' + Arcade.fmt(carrier.carry) + ' · speed ' + Arcade.fmt(carrier.speed) + ' · ' + match + wind;
    return carrier.name + ' carrying · ' + match + wind;
  }
  function hud() {
    if (!state) {
      $('homeScore').textContent = '0'; $('awayScore').textContent = '0';
      $('clock').textContent = 'Q1 ' + Arcade.fmtTime(M.QUARTER);
      $('down').textContent = 'Kickoff';
      if ($('sheet')) { $('sheet').hidden = true; $('sheet').textContent = ''; }
      if ($('cue')) $('cue').hidden = true;
      if ($('banner').textContent) say('');
      return;
    }
    $('homeScore').textContent = Arcade.fmt(state.score.home);
    $('awayScore').textContent = Arcade.fmt(state.score.away);
    $('clock').textContent = state.quarter >= 5 ? 'OT' : 'Q' + state.quarter + ' ' + Arcade.fmtTime(Math.max(0, Math.ceil(state.clock)));
    $('down').textContent = state.phase === 'final' ? 'Final' : M.downWords(state);
    var live = state.phase === 'live';
    if (live && state.play) lastSheet = snapLine(state);
    var sheet = $('sheet');
    var curtainUp = $('curtain') && !$('curtain').hidden;
    if (sheet) {
      var watching = mode === 'watch';
      sheet.hidden = live || curtainUp || watching;
      if (!sheet.hidden) sheet.textContent = lastSheet || rosterLine(state);
    }
    var cue = $('cue');
    var cueName = mode === 'play' && live && state.play && state.play.offence === 'home' ? state.play.cue : '';
    if (cue) {
      cue.hidden = !cueName;
      cue.textContent = cueName === 'juke' ? 'Swipe to juke' : cueName === 'dive' ? 'Tap to dive' : cueName === 'turbo' ? 'Hold Turbo' : '';
    }
    paintHint();
    if (performance.now() >= promptUntil) {
      var msg = state.phase === 'live' || state.phase === 'final' ? '' : M.currentMessage(state);
      if ($('banner').textContent !== msg) say(msg);
    }
  }

  function resize() {
    var r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return { w: r.width, h: r.height, dpr: dpr };
  }

  function updateCamera(dt) {
    var play = state && state.play;
    var live = !!(state && state.phase === 'live' && play);
    var spot = live ? play.startSpot : (state ? state.spot : 25);
    var ball = live && play.ball ? play.ball : { x: 0, y: 0 };
    var family = 'pocket';
    if (live && play.flight) family = 'air';
    else if (live && (play.family === 'run' || play.didCatch)) family = 'run';
    var qbX = spot;
    var landX = spot;
    if (live && play.flight) {
      qbX = spot + play.flight.fromX;
      landX = spot + play.flight.toX;
    }
    var focus = V.sideFocus({
      family: family,
      cut: !live,
      spot: spot,
      ballX: spot + ball.x,
      qbX: qbX,
      landX: landX
    });
    sideCam = V.stepSideCamera(sideCam, focus.target, dt, { chase: !!focus.chase, cut: !live });
  }

  function draw() {
    var box = resize();
    var scale = Math.max(0.01, Math.min(box.w / V.SIDE.w, box.h / V.SIDE.h));
    var ox = (box.w - V.SIDE.w * scale) / 2;
    var oy = (box.h - V.SIDE.h * scale) / 2;
    ctx.setTransform(box.dpr, 0, 0, box.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#141820';
    ctx.fillRect(0, 0, box.w, box.h);
    ctx.setTransform(box.dpr * scale, 0, 0, box.dpr * scale, box.dpr * ox, box.dpr * oy);
    ctx.imageSmoothingEnabled = false;
    var play = state && state.phase === 'live' ? state.play : null;
    V.paintMatch(ctx, {
      game: state,
      play: play,
      camX: sideCam ? sideCam.x : (state ? state.spot : 25),
      aim: aimDrag,
      reduced: reduce
    });
  }

  function frame(now) {
    var dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (mode === 'play' && state && state.phase === 'live' && !document.hidden) {
      if (state.play) lastSheet = snapLine(state);
      M.step(state, reduce ? Math.min(dt, 0.02) : dt, readGesture());
      soundFor(state.events);
      if (state.phase !== 'live') afterWhistle();
    } else if (mode === 'watch' && state && !document.hidden) {
      if (state.phase === 'live') {
        var scale = rushWatch ? 28 : (reduce ? 4 : 2.4);
        var budget = dt * scale, steps = 0, heard = [];
        while (budget > 0 && state.phase === 'live' && steps++ < 48) {
          if (state.play) lastSheet = snapLine(state);
          var slice = Math.min(0.05, budget);
          M.step(state, slice, M.policies.cpu(state.play, state));
          if (state.events && state.events.length) heard = heard.concat(state.events);
          budget -= slice;
        }
        soundFor(heard);
        if (state.phase !== 'live') holdWatch();
      } else if (watchLeft > 0) {
        watchLeft -= dt;
        if (watchLeft <= 0) {
          if (state.phase === 'final') showFinal();
          else if (state.possession !== 'home') beginWatch();
          else showCall();
        }
      }
    }
    updateCamera(dt);
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
      refresh: function () {
        if (state && state.phase !== 'live' && state.phase !== 'final' && state.possession === 'home') showCall();
      },
      playCpu: function () { rushWatch = true; if (state) beginWatch(); },
      watchLive: function () { rushWatch = false; if (state) beginWatch(); },
      rush: function (on) { rushWatch = !!on; },
      migrateSave: migrateSave,
      pointerNotes: pointerNotes,
      hintText: hintText
    };
  }
})();
