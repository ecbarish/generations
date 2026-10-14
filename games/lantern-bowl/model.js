/* Lantern Bowl rules. Headless: no DOM, timers, audio or storage.
   Positions are yards. x grows toward the offence's goal; y is lateral.
   The behind-the-play camera is presentation and does not live here.
   Ratings are 0–100, league average about 50. The chance curve is our own
   logistic. Nothing here is taken from another football game. */
(function (root) {
  'use strict';

  var QUARTER = 120;
  var SIDELINE = 24.5;
  /* One snap, including a score, never takes more than this off the clock.
     A whole defence series is several snaps, each capped on its own. */
  var MAX_CLOCK = 14;

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function roll(game) {
    game.rng = (Math.imul(game.rng >>> 0, 1664525) + 1013904223) >>> 0;
    return game.rng / 4294967296;
  }
  /* 0.5 when the ratings match. About 0.75 at +20. Capped so nobody is automatic. */
  function chance(off, def) {
    var z = (Number(off) - Number(def)) / 18;
    var p = 1 / (1 + Math.exp(-z));
    return p < 0.08 ? 0.08 : p > 0.92 ? 0.92 : p;
  }
  function teamOutline(hex) {
    var n = parseInt(String(hex).replace('#', ''), 16);
    if (!isFinite(n)) n = 0xc45a32;
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function mix(c, lamp) { return clamp(Math.round(c * 0.28 + lamp * 0.5 + 255 * 0.22), 0, 255); }
    function hex2(v) { return v.toString(16).padStart(2, '0'); }
    return '#' + hex2(mix(r, 242)) + hex2(mix(g, 208)) + hex2(mix(b, 128));
  }
  function other(side) { return side === 'home' ? 'away' : 'home'; }

  function person(name, ratings) {
    return Object.assign({
      name: name, throw: 50, catch: 50, speed: 50, carry: 50,
      block: 50, rush: 50, cover: 50, tackle: 50, kick: 50
    }, ratings || {});
  }
  function baseRoster(side) {
    if (side === 'home') {
      return {
        club: 'Brackenport Lanterns', short: 'Lanterns', color: '#c45a32',
        qb: person('Wren Talley', { throw: 64, speed: 52, carry: 48 }),
        rb: person('Mara Holt', { speed: 66, carry: 63, catch: 54 }),
        wr: [person('Ada Brisk', { speed: 70, catch: 68 }), person('Tomas Reed', { speed: 60, catch: 58 })],
        te: person('Bram Okafor', { speed: 48, catch: 60, block: 62 }),
        kicker: 'Sol Varga', line: 58, rush: 60, cover: 62, tackle: 61, kick: 61
      };
    }
    return {
      club: 'Millrace', short: 'Millrace', color: '#2d6f80',
        qb: person('Ned Harrow', { throw: 61, speed: 52, carry: 48 }),
        rb: person('Cole Pimm', { speed: 63, carry: 58, catch: 52 }),
        wr: [person('Lise Venn', { speed: 64, catch: 57 }), person('Otto Brant', { speed: 57, catch: 52 })],
        te: person('Ivo Pell', { speed: 50, catch: 54, block: 55 }),
        kicker: 'Pat Low', line: 56, rush: 58, cover: 55, tackle: 58, kick: 54
    };
  }
  function applyOver(roster, over) {
    if (!over) return roster;
    ['line', 'rush', 'cover', 'tackle', 'kick'].forEach(function (k) {
      if (over[k] != null) roster[k] = Number(over[k]);
    });
    if (over.throw != null) roster.qb.throw = Number(over.throw);
    if (over.carry != null) roster.rb.carry = Number(over.carry);
    if (over.speed != null) roster.rb.speed = Number(over.speed);
    if (over.catch != null) {
      roster.wr.forEach(function (w) { w.catch = Number(over.catch); });
      roster.te.catch = Number(over.catch);
      roster.rb.catch = Number(over.catch);
    }
    return roster;
  }

  var PLAYS = {
    inside: { id: 'inside', family: 'run', label: 'Inside run', detail: 'Holt, between the tackles.' },
    outside: { id: 'outside', family: 'run', label: 'Outside run', detail: 'Holt toward the sideline.' },
    quick: { id: 'quick', family: 'pass', label: 'Quick pass', detail: 'A short pull throws a bullet.' },
    deep: { id: 'deep', family: 'pass', label: 'Deep pass', detail: 'A long pull throws a lob.' }
  };

  function create(opts) {
    opts = opts || {};
    var seed = (opts.seed >>> 0) || 1;
    return {
      v: 1, seed: seed, rng: seed, quarter: 1, clock: QUARTER, down: 1, toGo: 10, spot: 25,
      possession: 'home', score: { home: 0, away: 0 }, phase: 'call', play: null, events: [],
      fatigue: {}, home: applyOver(baseRoster('home'), opts.home), away: applyOver(baseRoster('away'), opts.away),
      last: null, lastGain: 0, log: [], playSerial: 0
    };
  }

  function fatigueOf(game, id) { return game.fatigue[id] || 0; }
  function recover(game) {
    Object.keys(game.fatigue).forEach(function (id) { game.fatigue[id] = Math.max(0, game.fatigue[id] - 0.18); });
  }
  function burn(game, seconds) {
    var left = Math.max(0, seconds), guard = 0;
    while (left > 0 && guard++ < 8) {
      if (game.clock <= 0) {
        if (game.quarter >= 4) { game.phase = 'final'; game.clock = 0; return; }
        game.quarter += 1; game.clock = QUARTER;
      }
      if (left < game.clock - 1e-9) { game.clock -= left; return; }
      left -= game.clock; game.clock = 0;
      if (game.quarter >= 4) { game.phase = 'final'; return; }
      game.quarter += 1; game.clock = QUARTER;
    }
  }
  function giveBall(game, side, spot) {
    game.possession = side;
    game.spot = clamp(spot, 1, 99);
    game.down = 1;
    game.toGo = Math.min(10, Math.max(1, 100 - game.spot));
  }
  function finishPhase(game) {
    if (game.phase === 'final') return;
    game.phase = game.possession === 'home' ? 'call' : 'cpu';
  }
  function decided(offName, offVal, defName, defVal) {
    offVal = Math.round(Number(offVal) || 0);
    defVal = Math.round(Number(defVal) || 0);
    if (offVal >= defVal) return ' ' + offName + ' (' + offVal + ') beat ' + defName + ' (' + defVal + ').';
    return ' ' + defName + ' (' + defVal + ') beat ' + offName + ' (' + offVal + ').';
  }
  function closePlay(game, text, kind, gain, seconds, caught) {
    recover(game);
    game.lastGain = gain || 0;
    game.play = null;
    var spent = Math.max(4, Math.min(MAX_CLOCK, Number(seconds) || 4));
    burn(game, spent);
    if (game.phase !== 'final') finishPhase(game);
    game.playSerial = (game.playSerial || 0) + 1;
    if (game.phase !== 'final') {
      var situation = downWords(game);
      if (text.indexOf(situation) < 0) text = String(text).replace(/\s*$/, '') + ' Now ' + situation + '.';
    }
    game.last = {
      text: text, kind: kind || 'play', gain: game.lastGain, caught: !!caught,
      serial: game.playSerial, quarter: game.quarter, down: game.down, toGo: game.toGo,
      spot: game.spot, possession: game.possession
    };
    game.log.push(text);
    if (game.log.length > 16) game.log.shift();
  }
  /* The line on screen belongs to this snap only. A leftover from an earlier down is blank. */
  function currentMessage(game) {
    var last = game && game.last;
    if (!last || !game || game.phase === 'live') return '';
    if (last.serial !== game.playSerial) return '';
    if (last.quarter !== game.quarter || last.down !== game.down || last.possession !== game.possession) return '';
    if (Math.abs(last.spot - game.spot) > 0.25 || Math.abs(last.toGo - game.toGo) > 0.25) return '';
    return last.text || '';
  }
  function clockSpent(before, after) {
    if (!before || !after) return 0;
    return before.clock - after.clock + (after.quarter - before.quarter) * QUARTER;
  }
  function spotWords(spot) {
    var yard = Math.round(spot);
    return yard <= 50 ? 'our ' + yard : 'their ' + (100 - yard);
  }
  function downWords(game) {
    var names = ['', '1st', '2nd', '3rd', '4th'];
    var goal = game.spot + game.toGo >= 99.5;
    return names[game.down] + ' and ' + (goal ? 'Goal' : String(Math.max(1, Math.round(game.toGo)))) + ' at ' + spotWords(game.spot);
  }
  function moveChains(game, yards) {
    var next = game.spot + yards;
    if (next >= 100) { game.spot = 100; return 'td'; }
    if (next < 0) { game.spot = 0; return 'safety'; }
    if (yards + 1e-6 >= game.toGo) {
      game.spot = next; game.down = 1;
      game.toGo = Math.min(10, Math.max(1, 100 - game.spot));
      return 'first';
    }
    game.spot = next; game.down += 1;
    game.toGo = Math.max(0.5, game.toGo - yards);
    return game.down > 4 ? 'downs' : 'down';
  }
  function scoreTd(game, side) {
    game.score[side] += 6;
    var good = roll(game) < chance(game[side].kick, 32);
    if (good) game.score[side] += 1;
    giveBall(game, other(side), 25);
    return good ? ' Touchdown, and the kick is good.' : ' Touchdown. The kick drifts wide.';
  }
  function scoreSafety(game, offence) {
    game.score[other(offence)] += 2;
    giveBall(game, other(offence), 45);
    return ' Safety.';
  }
  function applyYards(game, yards, label, caught, note) {
    var side = game.possession;
    var rounded = Math.round(yards * 10) / 10;
    var code = moveChains(game, yards);
    var shown = (rounded >= 0 ? ' for ' : ', a loss of ') + Math.abs(Math.round(rounded));
    var because = note || '';
    if (code === 'td') {
      var scored = /jukes|dives/.test(label) ? label + ' for a score.' : label + ' scores.';
      return closePlay(game, scored + scoreTd(game, side) + because, 'score', rounded, 12, caught);
    }
    if (code === 'safety') return closePlay(game, label + '.' + scoreSafety(game, side) + because, 'score', rounded, 12, caught);
    if (code === 'downs') {
      giveBall(game, other(side), 100 - game.spot);
      return closePlay(game, label + shown + '. Turnover on downs.' + because, 'turnover', rounded, 14, caught);
    }
    var extra = code === 'first' ? ' First down.' : '';
    var seconds = Math.min(MAX_CLOCK, Math.max(6, 6 + Math.abs(rounded) * 0.25));
    return closePlay(game, label + shown + '.' + extra + because, code === 'first' ? 'first' : 'play', rounded, seconds, caught);
  }

  function actor(partial) {
    return Object.assign({
      off: false, role: 'lb', name: '', x: 0, y: 0, speed: 50, carry: 50, catch: 50,
      throw: 50, cover: 50, tackle: 50, rush: 50, blocked: 0, route: null
    }, partial);
  }
  function carrierOf(play) { return play.actors[play.carrier]; }
  function nearest(play, x, y, pred) {
    var best = null, bestD = 1e9;
    play.actors.forEach(function (a) {
      if (!pred(a)) return;
      var d = Math.hypot(a.x - x, a.y - y);
      if (d < bestD) { best = a; bestD = d; }
    });
    return best ? { actor: best, d: bestD } : null;
  }
  function moveToward(a, tx, ty, rate, dt) {
    var dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy) || 0.0001;
    var step = Math.min(d, Math.max(0, rate) * dt);
    a.x += dx / d * step; a.y += dy / d * step;
    return d;
  }

  function buildRun(play, off, def, id) {
    var back = off.rb;
    play.actors.push(actor({ off: true, role: 'rb', name: back.name, x: 0, y: id === 'outside' ? 9 : 0, speed: back.speed, carry: back.carry, catch: back.catch }));
    play.carrier = 0;
    play.lanes.forEach(function (lane) {
      play.actors.push(actor({
        off: false, role: 'dl', name: 'Rush', x: lane.open ? 3.4 : 0.65, y: lane.y,
        tackle: def.tackle, speed: 58, blocked: lane.open ? 0.32 : 0
      }));
    });
    play.actors.push(actor({ off: false, role: 'lb', name: 'Backer', x: 5.2, y: -3, tackle: def.tackle, speed: 56 }));
    play.actors.push(actor({ off: false, role: 'lb', name: 'Backer', x: 5.6, y: 4, tackle: def.tackle, speed: 56 }));
    play.actors.push(actor({ off: false, role: 's', name: 'Safety', x: 13, y: 0, tackle: def.tackle, cover: def.cover, speed: 60, hold: 6 }));
  }
  function buildPass(game, play, off, def, id) {
    var deep = id === 'deep';
    var qb = off.qb;
    play.actors.push(actor({ off: true, role: 'qb', name: qb.name, x: -6, y: 0, speed: qb.speed, carry: qb.carry, throw: qb.throw }));
    play.carrier = 0;
    var routes = deep
      ? [{ role: 'wr', who: off.wr[0], x: 1, y: -14, toX: 28, toY: -3 }, { role: 'wr', who: off.wr[1], x: 1, y: 15, toX: 26, toY: 12 }, { role: 'te', who: off.te, x: 0, y: -6, toX: 16, toY: -14 }]
      : [{ role: 'wr', who: off.wr[0], x: 0, y: -8, toX: 15, toY: -8 }, { role: 'wr', who: off.wr[1], x: 0, y: 12, toX: 9, toY: 16 }, { role: 'te', who: off.te, x: 0, y: -3, toX: 8, toY: -1 }];
    routes.forEach(function (r) {
      play.actors.push(actor({ off: true, role: r.role, name: r.who.name, x: r.x, y: r.y, speed: r.who.speed, catch: r.who.catch, carry: 48, route: { x: r.toX, y: r.toY } }));
    });
    play.actors.push(actor({ off: true, role: 'rb', name: off.rb.name, x: -2, y: 3, speed: off.rb.speed, catch: off.rb.catch, carry: off.rb.carry, route: { x: 4, y: 7 } }));
    [-4, 0, 4].forEach(function (y) {
      play.actors.push(actor({
        off: false, role: 'dl', name: 'Rush', x: 1.1, y: y, rush: def.rush, tackle: def.tackle, speed: 50,
        blocked: roll(game) < chance(off.line, def.rush) ? 1.2 : 0.12
      }));
    });
    routes.forEach(function (r) {
      play.actors.push(actor({ off: false, role: 'cb', name: 'Cover', x: r.x + 1.1, y: r.y, cover: def.cover, tackle: def.tackle, speed: 52, route: { x: r.toX, y: r.toY } }));
    });
    play.actors.push(actor({ off: false, role: 's', name: 'Safety', x: deep ? 16 : 9, y: 0, cover: def.cover, tackle: def.tackle, speed: 54 }));
  }

  function callPlay(game, id) {
    if (game.phase !== 'call' && game.phase !== 'cpu') return false;
    var spec = PLAYS[id];
    if (!spec) return false;
    var off = game[game.possession], def = game[other(game.possession)];
    var lanes = ['left', 'mid', 'right'].map(function (name, i) {
      var y = [-12, 0, 12][i];
      return { id: name, y: y, open: roll(game) < chance(off.line, def.rush), block: off.line, rush: def.rush };
    });
    var play = {
      id: spec.id, family: spec.family, label: spec.label, elapsed: 0, offence: game.possession,
      startSpot: game.spot, lanes: lanes, pocket: 7.4, block: off.line, rush: def.rush,
      actors: [], carrier: 0, thrown: false, flight: null, didCatch: false,
      jukeUsed: false, jukeUntil: 0, diving: false
    };
    if (spec.family === 'run') buildRun(play, off, def, spec.id);
    else buildPass(game, play, off, def, spec.id);
    game.play = play;
    game.phase = 'live';
    game.events = ['snap'];
    return true;
  }

  /* A throw that has already picked a receiver. Ratings still decide it.
     An ordinary arm and a pair of good hands should bring most of those in.
     A weak arm against tight coverage should not. */
  function resolveCatch(rollFn, qbThrow, hands, cover, dist, kind) {
    var bullet = kind !== 'lob';
    var difficulty = (bullet ? 22 : 18) + dist * (bullet ? 0.2 : 0.12);
    if (rollFn() > chance(qbThrow, difficulty)) return 'miss';
    if (rollFn() < chance(cover - 8, hands)) return rollFn() < 0.28 ? 'pick' : 'drop';
    return 'catch';
  }

  function readInput(input) {
    input = input || {};
    return {
      steer: clamp(Number(input.steer) || 0, -1, 1),
      turbo: !!input.turbo,
      juke: input.juke > 0 ? 1 : input.juke < 0 ? -1 : 0,
      dive: !!input.dive,
      throw: input.throw && isFinite(input.throw.dirX) && isFinite(input.throw.dirY) ? {
        dirX: input.throw.dirX, dirY: input.throw.dirY, power: clamp(Number(input.throw.power) || 0, 0, 1)
      } : null
    };
  }

  function step(game, dt, input) {
    game.events = [];
    if (game.phase !== 'live' || !game.play) return game;
    dt = clamp(Number(dt) || 0, 0, 0.05);
    var play = game.play, inp = readInput(input);
    play.elapsed += dt;
    if (play.family === 'pass' && !play.thrown && !play.flight) stepPocket(game, play, dt, inp);
    else stepCarry(game, play, dt, inp);
    if (game.phase === 'live' && play.elapsed > 8) endCarry(game, play, 'The whistle blows');
    return game;
  }

  function stepPocket(game, play, dt, inp) {
    var qb = carrierOf(play);
    play.actors.forEach(function (a) {
      if (a.off && a.route) moveToward(a, a.route.x, a.route.y, 4.3 + a.speed / 28, dt);
      else if (!a.off && a.role === 'cb' && a.route) moveToward(a, a.route.x, a.route.y, 4.5 + a.cover / 40, dt);
      else if (!a.off && a.role === 'dl') {
        var slow = play.elapsed < a.blocked ? 0.32 : 1;
        moveToward(a, qb.x, qb.y, (4.7 + a.rush / 35) * slow, dt);
      }
    });
    var edge = (play.rush - play.block) / 22;
    play.pocket = Math.max(0.35, play.pocket - (0.8 + Math.max(0, edge) * 1.65) * dt);
    var rusher = nearest(play, qb.x, qb.y, function (a) { return !a.off && a.role === 'dl'; });
    if (inp.dive) {
      play.family = 'run'; play.diving = true; play.usedDive = true; qb.x += 1.3;
      game.events.push('dive');
      return;
    }
    if (inp.throw) return launch(game, play, inp.throw);
    if (play.pocket < 1.15 || (rusher && rusher.d < 1.02)) {
      if (roll(game) < chance(play.rush, qb.throw)) {
        game.events.push('sack');
        return applyYards(game, -(2 + roll(game) * 4), qb.name + ' is sacked', false, decided('The rush', play.rush, 'the line', play.block));
      }
      game.events.push('miss');
      return incomplete(game, qb.name + ' throws it away');
    }
  }

  /* Where this drag is headed. No dice, so the picture can show the same target the snap will use. */
  function aimThrow(play, thrown) {
    var qb = carrierOf(play);
    var mag = Math.hypot(thrown.dirX, thrown.dirY) || 1;
    var dirX = thrown.dirX / mag, dirY = thrown.dirY / mag;
    var power = clamp(Number(thrown.power) || 0, 0, 1);
    var kind = power < 0.42 ? 'bullet' : 'lob';
    var reach = kind === 'bullet' ? 8 + power * 16 : 14 + power * 30;
    var cone = kind === 'bullet' ? 0.93 : 0.88;
    var best = null, bestScore = -1;
    play.actors.forEach(function (a) {
      if (!a.off || a.role === 'qb') return;
      var aim = a.route || { x: a.x, y: a.y };
      var dx = aim.x - qb.x, dy = aim.y - qb.y, dist = Math.hypot(dx, dy) || 1;
      if (dist > reach + 6) return;
      var dot = (dx / dist) * dirX + (dy / dist) * dirY;
      if (dot < cone) return;
      var score = dot - Math.abs(dist - reach) / 50;
      if (score > bestScore) { best = { actor: a, aim: aim, dist: dist, dot: dot }; bestScore = score; }
    });
    return {
      kind: kind, power: power, aimed: !!best,
      target: best ? best.actor : null,
      x: best ? best.aim.x : qb.x + dirX * reach,
      y: best ? best.aim.y : qb.y + dirY * reach,
      dist: best ? best.dist : reach
    };
  }
  function launch(game, play, thrown) {
    var qb = carrierOf(play);
    var aim = aimThrow(play, thrown);
    play.thrown = true;
    play.flight = {
      x: qb.x, y: qb.y, fromX: qb.x, fromY: qb.y, toX: aim.x, toY: aim.y,
      air: aim.kind === 'bullet' ? 0.28 + aim.dist / 70 : 0.5 + aim.dist / 28,
      t: 0, kind: aim.kind, qb: qb.throw, target: aim.target
    };
    game.events.push(aim.kind === 'bullet' ? 'throw' : 'lob');
  }

  function carrierRate(a, fatigue, turbo) {
    var base = 4.15 + a.speed / 40;
    var gas = turbo && fatigue < 0.82 ? 1.3 : 1;
    return base * gas * (1 - clamp(fatigue, 0, 1) * 0.4);
  }
  function defenderRate(a) { return 5.05 + (a.tackle || 50) / 42; }

  function stepCarry(game, play, dt, inp) {
    if (play.flight) return fly(game, play, dt);
    var back = carrierOf(play);
    var fatigue = fatigueOf(game, back.name);
    if (inp.turbo && fatigue < 0.82) {
      fatigue += dt * 0.4;
      game.events.push('turbo');
    }
    game.fatigue[back.name] = clamp(fatigue, 0, 1);
    if (inp.juke && !play.jukeUsed) {
      var jukeThreat = nearest(play, back.x, back.y, function (a) { return !a.off; });
      back.y += inp.juke * (3.4 + back.speed / 45);
      play.jukeUsed = true; play.usedJuke = true; play.jukeDir = inp.juke; play.jukeUntil = play.elapsed + 0.48;
      play.ratingNote = decided('The juke', back.speed, 'the tackle', jukeThreat ? jukeThreat.actor.tackle : 50);
      game.events.push('juke');
    }
    if (inp.dive && !play.diving) {
      var diveThreat = nearest(play, back.x, back.y, function (a) { return !a.off; });
      play.diving = true; play.usedDive = true;
      back.x += 2.15 + back.carry / 55;
      play.diveUntil = play.elapsed + 0.35;
      play.ratingNote = decided('The dive', back.carry, 'the tackle', diveThreat ? diveThreat.actor.tackle : 50);
      game.events.push('dive');
    }
    var speed = carrierRate(back, game.fatigue[back.name], inp.turbo && fatigue < 0.82);
    back.x += speed * dt;
    back.y = clamp(back.y + inp.steer * 4.8 * dt, -SIDELINE - 1, SIDELINE + 1);
    play.actors.forEach(function (a) {
      if (a === back || a.off) return;
      if (a.hold && back.x < a.hold) return;
      var slow = play.elapsed < a.blocked ? 0.25 : 1;
      moveToward(a, back.x, back.y, defenderRate(a) * slow, dt);
    });
    if (Math.abs(back.y) > SIDELINE) return endCarry(game, play, back.name + ' steps out');
    if (game.spot + back.x >= 100) return endCarry(game, play, back.name);
    var hit = nearest(play, back.x, back.y, function (a) { return !a.off; });
    var slipping = play.elapsed < play.jukeUntil || play.elapsed < (play.diveUntil || 0);
    if (hit && hit.d < 1.05 && !slipping) {
      var tackleP = chance(hit.actor.tackle, back.carry) * (play.diving ? 0.4 : 1);
      if (roll(game) < tackleP * dt * 12) {
        if (play.diving) back.x += 0.6;
        play.ratingNote = decided('The carry', back.carry, 'the tackle', hit.actor.tackle);
        game.events.push('tackle');
        return endCarry(game, play, back.name + (play.didCatch ? ' catches it and is stopped' : ' is stopped'));
      }
    }
  }

  function endCarry(game, play, label) {
    var name = carrierOf(play).name;
    var move = play.usedJuke && play.usedDive ? name + ' jukes and dives' : play.usedJuke ? name + ' jukes' : play.usedDive ? name + ' dives' : label;
    return applyYards(game, carrierOf(play).x, move, play.didCatch, play.ratingNote || '');
  }

  function fly(game, play, dt) {
    var ball = play.flight;
    ball.t += dt;
    var u = clamp(ball.t / ball.air, 0, 1);
    ball.x = ball.fromX + (ball.toX - ball.fromX) * u;
    ball.y = ball.fromY + (ball.toY - ball.fromY) * u;
    play.actors.forEach(function (a) {
      if (a.off && a.role !== 'qb' && a.route) moveToward(a, a.route.x, a.route.y, 4.3 + a.speed / 28, dt);
      if (!a.off && (a.role === 'cb' || a.role === 's')) moveToward(a, ball.toX, ball.toY, 4.5 + a.cover / 35, dt);
    });
    if (u < 1) return;
    var qb = carrierOf(play);
    var dist = Math.hypot(ball.toX - qb.x, ball.toY - qb.y);
    if (!ball.target) {
      game.events.push('miss');
      return incomplete(game, 'The throw falls incomplete');
    }
    var catcher = { actor: ball.target, d: 0 };
    var cover = nearest(play, ball.toX, ball.toY, function (a) { return !a.off && (a.role === 'cb' || a.role === 's'); });
    var cov = cover && cover.d < (ball.kind === 'bullet' ? 3.2 : 5.5) ? cover.actor.cover : 32;
    var outcome = resolveCatch(function () { return roll(game); }, ball.qb, catcher.actor.catch, cov, dist, ball.kind);
    if (outcome === 'catch') {
      catcher.actor.x = ball.toX; catcher.actor.y = ball.toY;
      play.flight = null; play.family = 'run'; play.didCatch = true;
      play.carrier = play.actors.indexOf(catcher.actor);
      play.diving = false; play.jukeUsed = false; play.usedJuke = false; play.usedDive = false;
      play.ratingNote = decided(catcher.actor.name + "'s hands", catcher.actor.catch, 'the cover', cov);
      game.events.push('catch');
      return;
    }
    if (outcome === 'pick') {
      game.events.push('pick');
      var spot = clamp(game.spot + ball.toX, 1, 99);
      giveBall(game, other(play.offence), 100 - spot);
      return closePlay(game, 'Intercepted near ' + catcher.actor.name + '.' + decided('The cover', cov, catcher.actor.name + "'s hands", catcher.actor.catch), 'turnover', 0, 10, false);
    }
    game.events.push('miss');
    return incomplete(game, catcher.actor.name + ' cannot bring it in.' + decided('The cover', cov, catcher.actor.name + "'s hands", catcher.actor.catch));
  }

  function incomplete(game, text) {
    var side = game.possession;
    var line = String(text).replace(/[. ]*$/, '');
    game.down += 1;
    if (game.down > 4) {
      giveBall(game, other(side), 100 - game.spot);
      return closePlay(game, line + '. Turnover on downs.', 'turnover', 0, 6, false);
    }
    return closePlay(game, line + '.', 'miss', 0, 6, false);
  }

  function kick(game) {
    if (game.phase !== 'call' && game.phase !== 'cpu') return false;
    if (100 - game.spot <= 38) return fieldGoal(game);
    return punt(game);
  }
  function fieldGoal(game) {
    var side = game.possession;
    var dist = Math.round((100 - game.spot) + 17);
    var good = roll(game) < chance(game[side].kick, 18 + dist * 0.62);
    if (good) game.score[side] += 3;
    var text = game[side].kicker + (good ? ' makes it from ' : ' misses from ') + dist + '.';
    giveBall(game, other(side), good ? 25 : clamp(100 - game.spot, 20, 80));
    return closePlay(game, text, good ? 'score' : 'miss', 0, 8, false);
  }
  function punt(game) {
    var team = game[game.possession];
    var travel = 36 + (team.kick - 50) / 7 + (roll(game) - 0.5) * 8;
    var land = game.spot + travel, text;
    if (land >= 100) {
      giveBall(game, other(game.possession), 25);
      text = team.kicker + ' punts into the end zone. Touchback.';
    } else {
      giveBall(game, other(game.possession), 100 - land);
      text = team.kicker + ' punts, about ' + Math.round(travel) + ' yards.';
    }
    return closePlay(game, text, 'punt', 0, 10, false);
  }

  function cpuCall(game) {
    var r = roll(game);
    if (game.toGo <= 2) return r < 0.72 ? 'inside' : 'quick';
    if (game.toGo >= 8) return r < 0.4 ? 'deep' : r < 0.72 ? 'quick' : 'outside';
    if (r < 0.38) return 'inside';
    if (r < 0.66) return 'outside';
    return 'quick';
  }

  function bestLane(play) {
    var open = null;
    play.lanes.forEach(function (lane) { if (lane.open && !open) open = lane; });
    return open || play.lanes[1];
  }
  function leadTarget(play) {
    var best = null, bestX = -1e9;
    play.actors.forEach(function (a) {
      if (a.off && a.route && a.route.x > bestX) { bestX = a.route.x; best = a.route; }
    });
    return best || { x: 12, y: 0 };
  }

  var policies = {
    neutral: function () { return { steer: 0, turbo: false, juke: 0, dive: false, throw: null }; },
    cpu: function (play, game) {
      if (!play) return policies.neutral();
      if (play.family === 'pass' && !play.thrown && !play.flight) {
        var wait = play.id === 'deep' ? 1.05 : 0.5;
        if (play.elapsed < wait && play.pocket > 2.3) return policies.neutral();
        var qb = carrierOf(play), target = leadTarget(play);
        var dx = target.x - qb.x, dy = target.y - qb.y, m = Math.hypot(dx, dy) || 1;
        return { steer: 0, turbo: false, juke: 0, dive: false, throw: { dirX: dx / m, dirY: dy / m, power: play.id === 'deep' ? 0.8 : 0.3 } };
      }
      var back = carrierOf(play);
      var lane = bestLane(play);
      var steer = clamp((lane.y - back.y) / 6, -1, 1);
      var threat = nearest(play, back.x, back.y, function (a) { return !a.off; });
      var tired = game ? fatigueOf(game, back.name) : 0;
      var juke = !play.jukeUsed && threat && threat.d < 2.4 && back.x > 1.5 ? (back.y >= threat.actor.y ? 1 : -1) : 0;
      var dive = !play.diving && threat && threat.d < 1.6 && back.x > 4;
      return { steer: steer, turbo: tired < 0.55 && back.x < 14, juke: juke, dive: dive, throw: null };
    },
    careless: function (play, game) {
      if (!play) return policies.neutral();
      if (play.family === 'pass' && !play.thrown && !play.flight) {
        if (play.elapsed < 0.12) return policies.neutral();
        var ang = roll(game) * Math.PI * 2;
        return { steer: 0, turbo: false, juke: 0, dive: false, throw: { dirX: Math.cos(ang), dirY: Math.sin(ang), power: roll(game) } };
      }
      return {
        steer: roll(game) < 0.5 ? -1 : 1,
        turbo: false,
        juke: 0,
        dive: false,
        throw: null
      };
    }
  };
  function callChoice(game, style) {
    if (style === 'careless') {
      var ids = ['inside', 'outside', 'quick', 'deep'];
      return ids[Math.floor(roll(game) * ids.length)];
    }
    if (game.toGo <= 2) return roll(game) < 0.75 ? 'inside' : 'quick';
    if (game.spot >= 68) return roll(game) < 0.45 ? 'deep' : 'quick';
    if (game.toGo >= 8) return roll(game) < 0.6 ? 'quick' : 'inside';
    return roll(game) < 0.45 ? 'inside' : 'quick';
  }
  function simulateGame(seed, style) {
    var game = create({ seed: (seed >>> 0) || 1 });
    var guard = 0;
    var pol = style === 'careless' ? policies.careless : policies.cpu;
    while (game.phase !== 'final' && guard++ < 100) {
      if (game.possession !== 'home') { cpuDrive(game); continue; }
      if (game.phase === 'final') break;
      if (game.down >= 4) {
        if (style === 'careless' && roll(game) < 0.7) {
          if (!callPlay(game, callChoice(game, 'careless'))) break;
          finish(game, pol);
        } else kick(game);
        continue;
      }
      if (!callPlay(game, callChoice(game, style === 'careless' ? 'careless' : 'attentive'))) break;
      finish(game, pol);
    }
    return game;
  }
  function winSplit(style, n, seed) {
    var wins = 0, losses = 0, ties = 0, i;
    for (i = 0; i < n; i++) {
      var game = simulateGame(((seed + i * 17) >>> 0) || 1, style);
      if (game.score.home > game.score.away) wins += 1;
      else if (game.score.home < game.score.away) losses += 1;
      else ties += 1;
    }
    return { wins: wins, losses: losses, ties: ties, n: n };
  }

  function finish(game, policy) {
    var pol = policy || policies.neutral, guard = 0;
    while (game.phase === 'live' && guard++ < 360) step(game, 1 / 30, pol(game.play, game));
    return game;
  }
  function cpuDrive(game, onPlay) {
    var lines = [], n = 0;
    while (game.possession === 'away' && game.phase !== 'final' && n < 10) {
      if (game.down >= 4) kick(game);
      else if (!callPlay(game, cpuCall(game))) break;
      else finish(game, policies.cpu);
      if (game.last) lines.push({ text: game.last.text, gain: game.last.gain });
      if (onPlay) onPlay(game);
      n += 1;
    }
    return lines;
  }

  function laneOpenRate(block, rush, n, seed) {
    var open = 0, i;
    for (i = 0; i < n; i++) {
      var game = create({ seed: (seed + i) >>> 0, home: { line: block }, away: { rush: rush } });
      callPlay(game, 'inside');
      if (game.play.lanes[1].open) open += 1;
    }
    return open / n;
  }
  function catchRate(qb, hands, cover, n, seed) {
    var caught = 0, i;
    for (i = 0; i < n; i++) {
      var game = { rng: ((seed + i * 13) >>> 0) || 1 };
      if (resolveCatch(function () { return roll(game); }, qb, hands, cover, 12, 'bullet') === 'catch') caught += 1;
    }
    return caught / n;
  }
  function sampleRunYards(opts, n, seed) {
    opts = opts || {};
    var sum = 0, i;
    for (i = 0; i < n; i++) {
      var game = create({
        seed: (seed + i) >>> 0,
        home: { line: opts.block, carry: opts.carry, speed: opts.speed == null ? 55 : opts.speed },
        away: { rush: opts.rush, tackle: opts.tackle }
      });
      callPlay(game, 'inside');
      finish(game, policies.neutral);
      sum += game.lastGain || 0;
    }
    return sum / n;
  }
  function scriptedQuick(play) {
    if (!play || play.thrown || play.flight || play.family !== 'pass') return policies.neutral();
    if (play.elapsed < 0.42) return policies.neutral();
    var qb = carrierOf(play), target = null;
    play.actors.forEach(function (a) {
      if (!target && a.off && a.role === 'wr') target = a.route || a;
    });
    target = target || { x: 12, y: -8 };
    var dx = target.x - qb.x, dy = target.y - qb.y, m = Math.hypot(dx, dy) || 1;
    return { steer: 0, turbo: false, juke: 0, dive: false, throw: { dirX: dx / m, dirY: dy / m, power: 0.28 } };
  }
  function jukePolicy(play) {
    if (!play || play.family === 'pass') return policies.neutral();
    var back = carrierOf(play);
    var threat = nearest(play, back.x, back.y, function (a) { return !a.off; });
    var juke = !play.jukeUsed && threat && threat.d < 3.2 ? (back.y >= threat.actor.y ? 1 : -1) : 0;
    return { steer: 0, turbo: false, juke: juke, dive: false, throw: null };
  }
  function divePolicy(play) {
    if (!play) return policies.neutral();
    return { steer: 0, turbo: false, juke: 0, dive: !play.diving, throw: null };
  }
  function passCatchShare(opts, n, seed) {
    opts = opts || {};
    var caught = 0, i;
    for (i = 0; i < n; i++) {
      var game = create({
        seed: ((seed + i * 17) >>> 0) || 1,
        home: { throw: opts.throw, catch: opts.catch },
        away: { cover: opts.cover, rush: opts.rush == null ? 42 : opts.rush }
      });
      callPlay(game, 'quick');
      finish(game, scriptedQuick);
      if (game.last && game.last.caught) caught += 1;
    }
    return caught / n;
  }
  function snapshot(game) {
    return [
      game.score.home, game.score.away, game.quarter, Math.round(game.clock * 1000) / 1000,
      game.down, Math.round(game.toGo * 1000) / 1000, Math.round(game.spot * 1000) / 1000,
      game.possession, game.phase, game.rng, game.last ? game.last.text : ''
    ].join('|');
  }
  function digestScript(seed) {
    var game = create({ seed: seed }), i;
    for (i = 0; i < 4; i++) {
      if (game.phase === 'final') break;
      if (game.possession !== 'home') cpuDrive(game);
      if (game.phase === 'final' || game.possession !== 'home') break;
      if (game.down >= 4) kick(game);
      else {
        callPlay(game, i % 2 ? 'quick' : 'inside');
        finish(game, i % 2 ? scriptedQuick : policies.neutral);
      }
    }
    if (game.possession === 'away' && game.phase !== 'final') cpuDrive(game);
    return snapshot(game);
  }
  function serialise(game) {
    return {
      quarter: game.quarter, clock: game.clock, down: game.down, toGo: game.toGo, spot: game.spot,
      possession: game.possession, score: { home: game.score.home, away: game.score.away },
      phase: game.phase === 'live' ? 'call' : game.phase, rng: game.rng, seed: game.seed,
      fatigue: Object.assign({}, game.fatigue), home: game.home, away: game.away,
      last: game.last, log: game.log.slice(), lastGain: game.lastGain, playSerial: game.playSerial || 0
    };
  }
  function restore(data) {
    data = data || {};
    var game = create({ seed: data.seed || 1 });
    if (data.home && data.home.qb) game.home = data.home;
    if (data.away && data.away.qb) game.away = data.away;
    game.rng = (data.rng >>> 0) || game.rng;
    game.seed = (data.seed >>> 0) || game.seed;
    game.quarter = clamp(Math.round(Number(data.quarter) || 1), 1, 4);
    game.clock = clamp(Number(data.clock), 0, QUARTER);
    if (!isFinite(game.clock)) game.clock = QUARTER;
    game.down = clamp(Math.round(Number(data.down) || 1), 1, 4);
    game.toGo = clamp(Number(data.toGo) || 10, 0.5, 100);
    game.spot = clamp(Number(data.spot) || 25, 1, 99);
    game.possession = data.possession === 'away' ? 'away' : 'home';
    if (data.score) {
      game.score.home = Math.max(0, Math.round(Number(data.score.home) || 0));
      game.score.away = Math.max(0, Math.round(Number(data.score.away) || 0));
    }
    if (data.phase === 'final') game.phase = 'final';
    else if (data.phase === 'cpu') game.phase = 'cpu';
    else game.phase = 'call';
    game.fatigue = data.fatigue && typeof data.fatigue === 'object' ? Object.assign({}, data.fatigue) : {};
    game.last = data.last || null;
    game.lastGain = Number(data.lastGain) || 0;
    game.playSerial = Number(data.playSerial) || 0;
    if (game.last && !game.playSerial) {
      game.playSerial = game.last.serial || 1;
      if (!game.last.serial) {
        game.last.serial = game.playSerial;
        game.last.quarter = game.quarter;
        game.last.down = game.down;
        game.last.toGo = game.toGo;
        game.last.spot = game.spot;
        game.last.possession = game.possession;
      }
    }
    game.log = Array.isArray(data.log) ? data.log.slice(-16) : [];
    game.play = null;
    return game;
  }

  var api = {
    QUARTER: QUARTER, SIDELINE: SIDELINE, MAX_CLOCK: MAX_CLOCK, PLAYS: PLAYS,
    chance: chance, teamOutline: teamOutline, create: create, restore: restore, serialise: serialise,
    callPlay: callPlay, kick: kick, step: step, finish: finish, cpuDrive: cpuDrive, cpuCall: cpuCall,
    policies: policies, downWords: downWords, spotWords: spotWords, resolveCatch: resolveCatch,
    laneOpenRate: laneOpenRate, catchRate: catchRate, sampleRunYards: sampleRunYards,
    passCatchShare: passCatchShare, digestScript: digestScript, snapshot: snapshot, burn: burn,
    moveChains: moveChains, currentMessage: currentMessage, clockSpent: clockSpent, aimThrow: aimThrow,
    simulateGame: simulateGame, winSplit: winSplit, jukePolicy: jukePolicy, divePolicy: divePolicy,
    decided: decided
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LanternModel = api;
})(typeof window === 'object' ? window : globalThis);
