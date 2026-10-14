/* Lantern Bowl, on the field. The sim is model.js. The camera is view.js.
   Saves, numbers, sound and the settings row come from shared/. */
(function () {
  'use strict';

  var M = window.LanternModel, V = window.LanternView;
  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('field'), ctx = canvas.getContext('2d');
  var KEY = 'lantern-bowl-save-v1', VERSION = '0.1.5', SAVE_V = 2;
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
    passing: migrated && migrated.passing === 'all22' ? 'all22' : 'retro',
    tutored: !!(migrated && migrated.tutored),
    match: migrated && migrated.match ? migrated.match : null
  };

  var state = null, mode = 'title', last = 0, bannerUntil = 0, aimDrag = null, lastSheet = '';
  var keys = new Set(), turboHeld = false, gesture = null, steer = 0, queued = { juke: 0, dive: false, spin: false, throw: null };
  var stick = null, receiverKey = '', throwKind = 'bullet', turboTouch = null;
  var sheetDetail = false, watchLeft = 0, resultLeft = 0, touchGuard = 0, rushWatch = false, promptUntil = 0, summaryLine = '';
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
    }, {
      label: 'Passing',
      options: [['retro', 'Retro Bowl'], ['all22', 'All 22']],
      get: function () { return save.passing === 'all22' ? 'all22' : 'retro'; },
      set: function (v) { save.passing = v === 'all22' ? 'all22' : 'retro'; receiverKey = ''; persist(); },
      note: 'The ball goes where you drag. A second finger switches a lob and a bullet.'
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
    var html = String(body || '');
    var actions = '';
    var split = html.match(/([\s\S]*)(<div class="actions">[\s\S]*<\/div>)\s*$/);
    if (split) { html = split[1]; actions = split[2]; }
    $('panel').innerHTML = '<h2 id="panelTitle">' + title + '</h2><div class="panel-copy">' + html + '</div>' + actions;
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
    mode = 'title'; state = null; lastSheet = ''; summaryLine = ''; sheetDetail = false; watchLeft = 0;
    showHeld();
    say('');
    var sheet = $('sheet');
    if (sheet) { sheet.textContent = ''; sheet.hidden = true; }
    var cue = $('cue');
    if (cue) { cue.hidden = true; cue.textContent = ''; }
    var again = save.match ? '<button type="button" data-continue>Continue the game</button>' : '';
    panel('Lamplight Field',
      '<p>The Brackenport Lanterns have Millrace under the lanterns. You call the offence. Before their drive, you pick a defence, and that drive plays as a short highlight.</p>' +
      '<p>Two-minute quarters, slow enough for several drives. Pick a play, then pull back from the quarterback and let go to throw. With the ball, swipe to steer and juke.</p>' +
      '<div class="actions"><button type="button" data-kick>Kick off</button>' + again + '</div>');
    dock();
  }

  function kickoff(seed) {
    lastSheet = '';
    summaryLine = '';
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
    if (state.phase === 'cpu' || state.possession === 'away') return askDefence();
    showCall();
    canvas.focus();
  }

  function hideSheet() {
    var sheet = $('sheet');
    if (!sheet) return;
    sheet.hidden = true;
    sheet.textContent = '';
  }
  function showCall() {
    resultLeft = 0;
    if (!state || state.phase === 'final') return showFinal();
    if (state.possession !== 'home') return askDefence();
    if (mode === 'watch' || mode === 'result') lastSheet = '';
    mode = 'play';
    hideSheet();
    dock();
    say(shortToast(summaryLine || M.currentMessage(state)));
  }
  /* The whistle's line stays up, with the next play cards held back so they cannot cover it. */
  function showResult() {
    if (!state || state.phase === 'final') return showFinal();
    if (state.possession !== 'home') return holdWatch();
    mode = 'result';
    resultLeft = 1.15;
    hidePanel();
    hideSheet();
    dock();
    say(shortToast(summaryLine || M.currentMessage(state)));
  }

  /* One choice, then Millrace's drive. The highlight itself has no buttons. */
  function askDefence() {
    if (!state || state.phase === 'final') return showFinal();
    if (state.possession === 'home') return showCall();
    if (state.defenceCall) return beginWatch();
    if (rushWatch) return chooseDefence('balanced');
    mode = 'defence';
    hidePanel();
    summaryLine = '';
    dock();
    say('');
  }
  function chooseDefence(id) {
    if (!state || !M.DEFENCE[id] || state.possession === 'home' || state.phase === 'final') return;
    state.defenceCall = id;
    state.driveFrom = state.log.length;
    summaryLine = '';
    mode = 'watch';
    hidePanel();
    beginWatch();
  }
  function finishDrive() {
    if (!state) return;
    var lines = state.log.slice(state.driveFrom || 0);
    summaryLine = M.driveSummary(lines, state.defenceCall);
    state.defenceCall = null;
    state.driveFrom = null;
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
    watchLeft = rushWatch ? 0.04 : (state && state.defenceCall ? 0.14 : 0.35);
    if (state && state.defenceCall) say('');
    else say(summaryLine || M.currentMessage(state));
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
    field: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16h16M12 16V8M9 11l3-3 3 3"/></svg>',
    punt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16c6-2 10-8 16-10M14 6l6 0 0 6"/></svg>',
    blitz: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3L5 14h7l-1 7 8-11h-7l1-7z"/></svg>',
    balanced: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16M12 4v16"/></svg>',
    prevent: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l7 3v6c0 4-3 6-7 7-4-1-7-3-7-7V7l7-3z"/></svg>',
    turbo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14c3-6 5 2 8-4s5 2 8-4"/></svg>'
  };
  function playLabel(id) {
    if (id === 'field') return 'Field goal';
    if (id === 'punt') return 'Punt';
    if (id === 'kick') return 'Kick';
    if (M.DEFENCE[id]) return M.DEFENCE[id].label;
    if (M.PLAYS[id]) return M.PLAYS[id].label.replace(' pass', '');
    return id;
  }
  function hintText() {
    if (mode === 'defence') return 'Pick a defence.';
    var live = !!(mode === 'play' && state && state.phase === 'live');
    var parts = [];
    if (live && state.play && state.play.load > 0 && state.play.offence === 'home') parts.push(M.READING_HINT);
    var passLive = live && state.play && state.play.family === 'pass' && !state.play.thrown && !state.play.flight && state.play.offence === 'home';
    if (passLive) parts.push('Pull back to throw.');
    else if (live && carryingNow()) parts.push('Swipe to steer.');
    return parts.join(' ');
  }
  function paintHint() {
    var hint = $('hint');
    if (!hint) return;
    var text = hintText();
    hint.hidden = !text;
    hint.textContent = text;
    hint.classList.toggle('reading', text.indexOf(M.READING_HINT) >= 0);
  }
  function dock() {
    paintHint();
    var choosing = mode === 'defence' && state && state.possession !== 'home' && state.phase !== 'live' && state.phase !== 'final';
    if (choosing) {
      var calls = ['blitz', 'balanced', 'prevent'];
      $('dock').innerHTML = '<div class="dock-plays">' + calls.map(function (id) {
        var label = playLabel(id);
        return '<button type="button" data-defence="' + id + '" aria-label="' + escapeAttr(label) + '">' + GLYPH[id] + '<span>' + escapeText(label) + '</span></button>';
      }).join('') + '</div>';
      return;
    }
    var show = mode === 'play' && state && state.phase === 'call' && state.possession === 'home';
    if (!show) { $('dock').innerHTML = ''; return; }
    var cells = M.offerPlays(state);
    $('dock').innerHTML = '<div class="dock-plays">' + cells.map(function (id) {
      var label = playLabel(id);
      return '<button type="button" data-play="' + id + '" aria-label="' + escapeAttr(label) + '">' + (GLYPH[id] || '') + '<span>' + escapeText(label) + '</span></button>';
    }).join('') + '</div>';
  }

  function begin(id) {
    if (!state || state.phase !== 'call' || state.possession !== 'home') return;
    resultLeft = 0;
    if (mode === 'result') mode = 'play';
    summaryLine = '';
    if (id === 'kick' || id === 'field' || id === 'punt') { M.kick(state, id === 'kick' ? null : id); afterWhistle(); return; }
    if (!M.callPlay(state, id)) return;
    audio.sfx('select');
    hidePanel();
    say('');
    dock();
    canvas.focus();
  }

  function afterWhistle() {
    resultLeft = 0;
    audio.sfx(state.last && state.last.kind === 'score' ? 'win' : state.last && state.last.kind === 'turnover' ? 'warn' : 'hit');
    persist();
    turboHeld = false;
    if (state.phase === 'final') return showFinal();
    if (state.phase === 'cpu' || state.possession === 'away') return holdWatch();
    showResult();
  }

  function finishLive() {
    if (state && state.phase === 'live' && state.play) lastSheet = snapLine(state);
    if (state && state.phase === 'live') M.finish(state, M.policies.neutral);
    if (state && state.phase !== 'live') afterWhistle();
  }

  $('dock').addEventListener('click', function (e) {
    var why = e.target.closest('[data-why]');
    if (why && why.dataset.why) { prompt(why.dataset.why); return; }
    var defence = e.target.closest('[data-defence]');
    if (defence && !defence.disabled) { chooseDefence(defence.dataset.defence); return; }
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
    var out = {
      steer: steer, turbo: turboHeld || keys.has('shift'),
      juke: queued.juke, dive: queued.dive || keys.has(' '), spin: queued.spin, throw: queued.throw
    };
    queued = { juke: 0, dive: false, spin: false, throw: null };
    if (keys.has('j')) out.juke = -1;
    if (keys.has('l')) out.juke = 1;
    if (keys.has('k') && state && state.phase === 'live') out.spin = true;
    if (keys.has('arrowleft') || keys.has('a')) out.steer = -1;
    if (keys.has('arrowright') || keys.has('d')) out.steer = 1;
    return out;
  }
  var keyHeld = {};
  function receiverNames() {
    var names = [];
    if (!state || !state.play) return names;
    state.play.actors.forEach(function (a) {
      if (a.off && a.route && a.role !== 'qb' && a.role !== 'ol') names.push(a.name);
    });
    return names;
  }
  function receiverThrow(name, kind) {
    save.tutored = true;
    return {
      receiver: name, kind: kind, autoAim: true, sling: false,
      dirX: 1, dirY: 0, power: kind === 'lob' ? 0.72 : 0.28
    };
  }
  /* Direction tests hand-ported from cptx032/virtual-joystick (Willie Lawrence, CC0 / public domain).
     https://github.com/cptx032/virtual-joystick
     The base appears where the finger lands, instead of sitting in one corner. */
  function stickFlags(dx, dy) {
    return {
      up: dy < 0 && Math.abs(dx) <= 2 * Math.abs(dy),
      down: dy > 0 && Math.abs(dx) <= 2 * Math.abs(dy),
      left: dx < 0 && Math.abs(dy) <= 2 * Math.abs(dx),
      right: dx > 0 && Math.abs(dy) <= 2 * Math.abs(dx)
    };
  }
  function carryingNow() {
    return !!(state && state.play && state.phase === 'live' && (state.play.family === 'run' || state.play.didCatch) && !state.play.flight);
  }
  function passPocket() {
    return !!(state && state.play && state.phase === 'live' && state.play.family === 'pass' && !state.play.thrown && !state.play.flight);
  }
  function turnedAway() {
    return !!(V.phoneTurn && V.phoneTurn(window.innerWidth, window.innerHeight));
  }
  function paintTurn() {
    var card = $('turn');
    var on = turnedAway();
    if (card) card.hidden = !on;
    if (on) {
      gesture = null;
      aimDrag = null;
      stick = null;
      steer = 0;
      turboHeld = false;
    }
    return on;
  }
  function toggleThrowKind() {
    throwKind = throwKind === 'lob' ? 'bullet' : 'lob';
    if (aimDrag) {
      aimDrag.kind = throwKind;
      if (aimDrag.preview) aimDrag.preview.kind = throwKind;
    }
  }

  function armGesture(x, y, id) {
    if (turnedAway() || !state) return;
    if (state.phase === 'call' && state.possession === 'home') { prompt('Pick a play first.'); return; }
    if (state.phase !== 'live' || mode === 'watch') return;
    gesture = { x: x, y: y, t: performance.now(), id: id };
    aimDrag = null;
    if (carryingNow()) stick = { x: x, y: y, dx: 0, dy: 0, flags: stickFlags(0, 0) };
    else stick = null;
  }
  function dragGesture(x, y) {
    if (!gesture || !state || state.phase !== 'live') return;
    var dx = x - gesture.x, dy = y - gesture.y;
    if (carryingNow()) {
      var flags = stickFlags(dx, dy);
      var analog = Math.max(-1, Math.min(1, dx / 64));
      if (flags.left) analog = Math.min(analog, -0.45);
      if (flags.right) analog = Math.max(analog, 0.45);
      steer = analog;
      stick = { x: gesture.x, y: gesture.y, dx: dx, dy: dy, flags: flags };
      aimDrag = null;
      return;
    }
    var pass = state.play && state.play.family === 'pass' && !state.play.thrown && !state.play.flight;
    if (!pass) { aimDrag = null; stick = null; return; }
    var rect = canvas.getBoundingClientRect();
    var pull = V.classifyPull(Math.hypot(dx, dy), V.pullSpan(rect.width, rect.height));
    var dir = V.dragToField(dx, dy);
    var preview = M.slingAim(state.play, { dirX: dir.dirX, dirY: dir.dirY, power: pull.power, kind: throwKind });
    var qb = state.play.actors[state.play.carrier];
    var held = (performance.now() - gesture.t) / 1000;
    var guide = M.guideState(qb ? qb.throw : 50, held, pull.power, preview.dist, M.pressureFactor(state.play));
    aimDrag = {
      kind: throwKind,
      preview: preview,
      power: pull.power,
      radius: guide.radius,
      wobble: guide.wobble,
      time: held,
      x: x - rect.left, y: y - rect.top
    };
  }
  function releaseGesture(x, y) {
    aimDrag = null;
    stick = null;
    if (!gesture || !state || state.phase !== 'live') { gesture = null; steer = 0; return; }
    var dx = x - gesture.x, dy = y - gesture.y;
    var dist = Math.hypot(dx, dy), quick = performance.now() - gesture.t < 320;
    var pass = state.play && state.play.family === 'pass' && !state.play.thrown && !state.play.flight;
    if (pass && dist > 22) {
      var field = canvas.getBoundingClientRect();
      var pull = V.classifyPull(dist, V.pullSpan(field.width, field.height)), dir = V.dragToField(dx, dy);
      queued.throw = {
        dirX: dir.dirX, dirY: dir.dirY, power: pull.power, kind: throwKind,
        sling: true, autoAim: false, held: (performance.now() - gesture.t) / 1000
      };
      save.tutored = true;
    } else if (quick && Math.abs(dy) > 28 && Math.abs(dy) > Math.abs(dx) * 1.2) {
      queued.spin = true;
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
  function eachChangedTouch(e, fn) {
    var list = e.changedTouches || [];
    var i;
    for (i = 0; i < list.length; i++) fn(list[i]);
  }
  canvas.addEventListener('touchstart', function (e) {
    if (!e.changedTouches || !e.changedTouches.length) return;
    e.preventDefault();
    touchGuard = performance.now() + 800;
    eachChangedTouch(e, function (t) {
      notePointer('touch', t.clientX, t.clientY);
      if (gesture && gesture.id !== t.identifier) {
        if (carryingNow()) { turboHeld = true; turboTouch = t.identifier; }
        else if (passPocket()) toggleThrowKind();
        return;
      }
      armGesture(t.clientX, t.clientY, t.identifier);
    });
  }, { passive: false });
  canvas.addEventListener('touchmove', function (e) {
    if (!e.changedTouches || !e.changedTouches.length) return;
    e.preventDefault();
    touchGuard = performance.now() + 800;
    eachChangedTouch(e, function (t) {
      if (!gesture || gesture.id !== t.identifier) return;
      dragGesture(t.clientX, t.clientY);
    });
  }, { passive: false });
  canvas.addEventListener('touchend', function (e) {
    if (!e.changedTouches || !e.changedTouches.length) return;
    e.preventDefault();
    touchGuard = performance.now() + 800;
    eachChangedTouch(e, function (t) {
      if (turboTouch === t.identifier) { turboHeld = false; turboTouch = null; return; }
      if (!gesture || gesture.id !== t.identifier) return;
      releaseGesture(t.clientX, t.clientY);
    });
  }, { passive: false });
  canvas.addEventListener('touchcancel', function () {
    touchGuard = performance.now() + 800;
    gesture = null; aimDrag = null; stick = null; steer = 0; turboHeld = false; turboTouch = null;
  });
  canvas.addEventListener('contextmenu', function (e) {
    if (!passPocket()) return;
    e.preventDefault();
    toggleThrowKind();
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
    if (e.button != null && e.button !== 0) return;
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
  var receiverHold = null;
  function buttonTouch(el, down) {
    if (!el) return;
    el.addEventListener('touchstart', function (e) {
      var p = fromTouch(e);
      if (!p) return;
      e.preventDefault();
      e.stopPropagation();
      touchGuard = performance.now() + 800;
      notePointer('touch', p.x, p.y);
      down(p);
    }, { passive: false });
    el.addEventListener('pointerdown', function (e) {
      if (mouseAfterTouch(e)) { e.preventDefault(); notePointer('ignored', e.clientX, e.clientY); return; }
      down({ x: e.clientX, y: e.clientY });
    });
  }
  buttonTouch($('turbo'), function () {
    turboHeld = true;
    if ($('turbo')) $('turbo').classList.add('held');
  });
  if ($('turbo')) {
    ['touchend', 'touchcancel', 'pointerup', 'pointercancel'].forEach(function (ev) {
      $('turbo').addEventListener(ev, function () {
        turboHeld = false;
        $('turbo').classList.remove('held');
      });
    });
  }
  if ($('receivers')) {
    $('receivers').addEventListener('touchstart', function (e) {
      var b = e.target.closest('[data-receiver]');
      var p = fromTouch(e);
      if (!b || !p) return;
      e.preventDefault();
      e.stopPropagation();
      touchGuard = performance.now() + 800;
      notePointer('touch', p.x, p.y);
      receiverHold = { name: b.dataset.receiver, t: performance.now(), touch: true };
    }, { passive: false });
    $('receivers').addEventListener('touchend', function (e) {
      if (!receiverHold || !receiverHold.touch) return;
      e.preventDefault();
      touchGuard = performance.now() + 800;
      var kind = performance.now() - receiverHold.t < 220 ? 'bullet' : 'lob';
      queued.throw = receiverThrow(receiverHold.name, kind);
      receiverHold = null;
    }, { passive: false });
    $('receivers').addEventListener('pointerdown', function (e) {
      var b = e.target.closest('[data-receiver]');
      if (!b) return;
      if (mouseAfterTouch(e)) { e.preventDefault(); notePointer('ignored', e.clientX, e.clientY); return; }
      receiverHold = { name: b.dataset.receiver, t: performance.now(), touch: false };
    });
    $('receivers').addEventListener('pointerup', function (e) {
      if (!receiverHold || receiverHold.touch || mouseAfterTouch(e)) return;
      var kind = performance.now() - receiverHold.t < 220 ? 'bullet' : 'lob';
      queued.throw = receiverThrow(receiverHold.name, kind);
      receiverHold = null;
    });
  }

  window.addEventListener('keydown', function (e) {
    if (turnedAway()) return;
    if (e.target.closest && e.target.closest('input,button,a,select,textarea,.arc-set-bg')) return;
    var k = e.key.toLowerCase();
    if (k === 'p' || k === 'escape') { e.preventDefault(); togglePause(); return; }
    if (mode === 'defence' && '123'.indexOf(k) >= 0) {
      chooseDefence(['blitz', 'balanced', 'prevent'][Number(k) - 1]);
      return;
    }
    if (mode === 'play' && state && state.phase === 'call' && '123'.indexOf(k) >= 0) {
      var offered = M.offerPlays(state);
      var pick = offered[Number(k) - 1];
      if (pick) begin(pick);
      return;
    }
    if (k === 'k' && state && state.phase === 'call' && state.down >= 4) {
      var kickId = M.offerPlays(state).indexOf('field') >= 0 ? 'field' : 'punt';
      begin(kickId);
      return;
    }
    if (k === 'shift' && !e.repeat && passPocket()) toggleThrowKind();
    keys.add(k);
    if (!keyHeld[k]) keyHeld[k] = performance.now();
    if (k === ' ' || k === 'arrowleft' || k === 'arrowright' || k === 'shift') e.preventDefault();
  });
  window.addEventListener('keyup', function (e) {
    var k = e.key.toLowerCase();
    delete keyHeld[k];
    keys.delete(k);
  });

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
  function shortToast(text) {
    var s = String(text || '').replace(/\s*\(\d+\)/g, '').replace(/\s+/g, ' ').trim();
    var dot = s.indexOf('. ');
    if (dot > 12 && dot < 120) s = s.slice(0, dot + 1);
    if (s.length > 110) s = s.slice(0, 107) + '…';
    return s;
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
    $('down').textContent = state.phase === 'final' ? 'Final' : M.downWords(state).replace(' and ', ' & ').replace(' at ', ' · ');
    var live = state.phase === 'live';
    if (live && state.play) lastSheet = snapLine(state);
    var sheet = $('sheet');
    var curtainUp = $('curtain') && !$('curtain').hidden;
    if (sheet) {
      sheet.hidden = true;
      if (live || curtainUp || mode === 'title' || mode === 'watch' || mode === 'defence') sheet.textContent = '';
    }
    var cue = $('cue');
    var cueName = mode === 'play' && live && state.play && state.play.offence === 'home' ? state.play.cue : '';
    if (cue) {
      cue.hidden = !cueName;
      cue.textContent = cueName === 'juke' ? 'Swipe to juke' : cueName === 'dive' ? 'Tap to dive' : cueName === 'turbo' ? 'Second finger sprints' : '';
    }
    paintHint();
    paintTools();
    if (performance.now() >= promptUntil) {
      var watching = mode === 'watch' || mode === 'defence';
      var calling = mode === 'play' && state.phase === 'call' && state.possession === 'home';
      var msg = '';
      if (!curtainUp && (mode === 'result' || calling)) msg = shortToast(summaryLine || M.currentMessage(state) || '');
      else if (!watching && state.phase !== 'live' && state.phase !== 'final' && mode !== 'title') msg = '';
      if ($('banner').textContent !== msg) say(msg);
    }
  }

  function fitChrome() {
    var tight = window.innerWidth <= 380;
    var gear = document.querySelector('#settingsMount .arc-set-btn');
    if (gear) {
      if (!gear.dataset.full) gear.dataset.full = gear.textContent || '⚙ Settings';
      gear.textContent = tight ? '⚙' : gear.dataset.full;
      gear.setAttribute('aria-label', 'Settings');
    }
  }
  function resize() {
    var r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    fitChrome();
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
    var view = canvas.getBoundingClientRect();
    var qbX = V.pocketAim(spot - 6 + V.pocketDrop(0.55), view.width, view.height);
    var landX = spot;
    if (live && play.flight) {
      qbX = spot + play.flight.fromX;
      landX = spot + play.flight.toX;
    } else if (live && family === 'pocket') {
      var carrier = play.actors[play.carrier];
      var qbWorld = spot + (carrier ? carrier.x : -6) + V.pocketDrop(play.elapsed);
      qbX = V.pocketAim(qbWorld, view.width, view.height);
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
    var play = state && state.phase === 'live' ? state.play : null;
    var passLive = !!(play && play.family === 'pass' && !play.thrown && !play.flight && play.offence === 'home');
    var layout = V.fitLayout(box.w, box.h) || V.layoutFor(box.w, box.h);
    var picture = layout || V.SIDE;
    var offers = state && state.phase === 'call' ? M.offerPlays(state) : null;
    var previewId = null;
    if (offers) {
      offers.forEach(function (id) {
        if (!previewId && id !== 'kick' && id !== 'field' && id !== 'punt') previewId = id;
      });
    }
    var paint = {
      game: state,
      play: play,
      camX: sideCam ? sideCam.x : (state ? state.spot : 25),
      aim: aimDrag,
      coach: passLive && mode === 'play' && !save.tutored && !aimDrag,
      reduced: reduce,
      layout: layout,
      formation: previewId ? M.formationFor(previewId) : null,
      chalk: !play && previewId ? M.previewRoutes(previewId, state) : null
    };
    var scale = picture.scale >= 1 ? picture.scale : Math.max(1, Math.floor(Math.min(box.w / picture.w, box.h / picture.h)));
    var ox = Math.floor((box.w - picture.w * scale) / 2);
    var oy = Math.floor((box.h - picture.h * scale) / 2);
    ctx.setTransform(box.dpr, 0, 0, box.dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#141820';
    ctx.fillRect(0, 0, box.w, box.h);
    ctx.setTransform(box.dpr * scale, 0, 0, box.dpr * scale, box.dpr * ox, box.dpr * oy);
    ctx.imageSmoothingEnabled = false;
    V.paintMatch(ctx, paint);
    drawStick(box);
  }
  function drawStick(box) {
    if (!stick || !carryingNow()) return;
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    var radius = Math.max(16, Math.round(28 * (canvas.width / V.SIDE.w)));
    var x = Math.round((stick.x - rect.left) * sx);
    var y = Math.round((stick.y - rect.top) * sy);
    var dx = (stick.dx || 0) * sx, dy = (stick.dy || 0) * sy;
    var mag = Math.hypot(dx, dy);
    if (mag > radius) { dx *= radius / mag; dy *= radius / mag; }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#f6edd4';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#f6edd4';
    ctx.lineWidth = Math.max(1, Math.round(sx));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(Math.round(x + dx), Math.round(y + dy), Math.max(6, Math.round(radius / 2)), 0, Math.PI * 2);
    ctx.fillStyle = '#c9bc9a';
    ctx.fill();
    ctx.restore();
  }
  function paintTools() {
    var row = $('receivers');
    var turbo = $('turbo');
    if (turbo) turbo.hidden = true;
    if (!row) return;
    row.hidden = true;
    row.innerHTML = '';
    receiverKey = '';
  }
  function armMove(which, e) {
    if (e && e.cancelable) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    touchGuard = performance.now() + 800;
    if (which === 'spin') queued.spin = true;
    else queued.juke = queued.juke || 1;
  }

  function frame(now) {
    var dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (paintTurn()) {
      hud();
      draw();
      requestAnimationFrame(frame);
      return;
    }
    if (mode === 'result' && state && !document.hidden) {
      resultLeft -= dt;
      if (resultLeft <= 0) showCall();
    } else if (mode === 'play' && state && state.phase === 'live' && !document.hidden) {
      if (state.play) lastSheet = snapLine(state);
      M.step(state, reduce ? Math.min(dt, 0.02) : dt, readGesture());
      soundFor(state.events);
      if (state.phase !== 'live') afterWhistle();
    } else if (mode === 'watch' && state && !document.hidden) {
      if (state.phase === 'live') {
        var scale = rushWatch ? 28 : (state.defenceCall ? (reduce ? 6 : 8) : (reduce ? 4 : 2.4));
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
          else if (state.possession !== 'home') {
            if (!state.defenceCall) askDefence();
            else beginWatch();
          } else {
            finishDrive();
            showCall();
          }
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
      playCpu: function () { rushWatch = true; if (state) askDefence(); },
      watchLive: function () { rushWatch = false; if (state) askDefence(); },
      chooseDefence: chooseDefence,
      rush: function (on) { rushWatch = !!on; },
      migrateSave: migrateSave,
      pointerNotes: pointerNotes,
      hintText: hintText
    };
  }
})();
