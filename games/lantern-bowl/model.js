/* Lantern Bowl rules. Headless: no DOM, timers, audio or storage.
   Positions are yards. x grows toward the offence's goal; y is lateral.
   The behind-the-play camera is presentation and does not live here.
   Ratings are 0–100, league average about 50. The chance curve is our own
   logistic. Nothing here is taken from another football game. */
(function (root) {
  'use strict';

  var QUARTER = 120;
  var SIDELINE = 24.5;
  /* How far a repeated call can move one rating. A habit is noticed; it is not a new roster. */
  var TENDENCY_CAP = 12;
  var READING_HINT = "THEY'RE READING IT";
  var RING_RADII = [28, 22, 16, 10];
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
  /* Ink around every person. Lamplight is the aimed player only, never the team outline. */
  function teamOutline() {
    return '#1e1a22';
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
        qb: person('Ned Harrow', { throw: 64, speed: 54, carry: 50 }),
        rb: person('Cole Pimm', { speed: 64, carry: 62, catch: 56 }),
        wr: [person('Lise Venn', { speed: 66, catch: 62 }), person('Otto Brant', { speed: 60, catch: 58 })],
        te: person('Ivo Pell', { speed: 51, catch: 58, block: 56 }),
        kicker: 'Pat Low', line: 60, rush: 58, cover: 55, tackle: 58, kick: 58
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
      possession: 'home', received: 'home', score: { home: 0, away: 0 }, phase: 'call', play: null, events: [],
      fatigue: {}, usage: { inside: 0, outside: 0, quick: 0, deep: 0 },
      home: applyOver(baseRoster('home'), opts.home), away: applyOver(baseRoster('away'), opts.away),
      last: null, lastGain: 0, log: [], playSerial: 0, halfKick: false,
      otTurns: 0, otSide: null
    };
  }

  function fatigueOf(game, id) { return game.fatigue[id] || 0; }
  function recover(game) {
    Object.keys(game.fatigue).forEach(function (id) { game.fatigue[id] = Math.max(0, game.fatigue[id] - 0.18); });
  }
  /* Overtime has no clock. Quarter 5 is that untimed period; the save already stores quarter. */
  function endRegulation(game) {
    game.clock = 0;
    if (game.score.home !== game.score.away) { game.phase = 'final'; return; }
    game.quarter = 5;
    game.otTurns = 0;
    game.otReady = true;
    var first = other(game.received || 'home');
    game.otSide = first;
    game.possession = first;
    game.spot = 75;
    game.down = 1;
    game.toGo = Math.min(10, Math.max(1, 100 - game.spot));
    if (game.phase === 'final') game.phase = 'call';
  }
  function burn(game, seconds) {
    if (game.quarter >= 5) return;
    var left = Math.max(0, seconds), guard = 0;
    while (left > 0 && guard++ < 8) {
      if (game.clock <= 0) {
        if (game.quarter >= 4) return endRegulation(game);
        game.quarter += 1; game.clock = QUARTER;
        noteQuarter(game);
      }
      if (left < game.clock - 1e-9) { game.clock -= left; return; }
      left -= game.clock; game.clock = 0;
      if (game.quarter >= 4) return endRegulation(game);
      game.quarter += 1; game.clock = QUARTER;
      noteQuarter(game);
    }
  }
  function noteQuarter(game) {
    var line = { 2: 'Second quarter.', 3: 'Third quarter.', 4: 'Fourth quarter.' };
    if (game.quarter === 3) game.halfKick = true;
    if (line[game.quarter]) game.quarterNote = line[game.quarter];
  }
  /* After one overtime turn ends, the other side starts on the 25.
     After both turns, a lead wins. A level score starts the same pair again. */
  function finishOtTurn(game, text) {
    if (game.quarter !== 5 || game.phase === 'final') return text;
    if (!game.otSide) game.otSide = game.possession;
    if (game.possession === game.otSide) return text;
    game.otTurns = (game.otTurns || 0) + 1;
    text = String(text).replace(/\s*$/, '');
    if (game.otTurns % 2 === 1) {
      var next = other(game.otSide);
      game.otSide = next;
      game.possession = next;
      game.spot = 75;
      game.down = 1;
      game.toGo = 10;
      return text + ' ' + (game[next].short || 'The other side') + ' ball, on the 25.';
    }
    if (game.score.home !== game.score.away) {
      game.phase = 'final';
      return text + ' Overtime is over.';
    }
    var first = other(game.received || 'home');
    game.otTurns = 0;
    game.otSide = first;
    game.possession = first;
    game.spot = 75;
    game.down = 1;
    game.toGo = 10;
    return text + ' Still level. ' + (game[first].short || 'They') + ' ball again, on the 25.';
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
  function phrase(name, cap) {
    var s = String(name == null ? '' : name).replace(/^\s+|\s+$/g, '');
    if (!s) return s;
    s = s.replace(/^The\b/, 'the');
    if (!cap) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  /* The winner is whoever the snap already decided. A lower number stopped the play; it did not "beat" a higher one. */
  function resultLine(winner, wVal, loser, lVal) {
    wVal = Math.round(Number(wVal) || 0);
    lVal = Math.round(Number(lVal) || 0);
    var verb = wVal >= lVal ? 'beat' : 'stopped';
    return phrase(winner, true) + ' (' + wVal + ') ' + verb + ' ' + phrase(loser, false) + ' (' + lVal + ').';
  }
  function decided(offName, offVal, defName, defVal) {
    offVal = Math.round(Number(offVal) || 0);
    defVal = Math.round(Number(defVal) || 0);
    if (offVal >= defVal) return ' ' + resultLine(offName, offVal, defName, defVal);
    return ' ' + resultLine(defName, defVal, offName, offVal);
  }
  function openHalf(game, text) {
    if (!game.halfKick || game.phase === 'final') { game.halfKick = false; return text; }
    game.halfKick = false;
    var kickTo = other(game.received || 'home');
    giveBall(game, kickTo, 25);
    var club = game[kickTo] && game[kickTo].short ? game[kickTo].short : 'The other side';
    return String(text).replace(/\s*$/, '') + ' Halftime. ' + club + ' receives the kickoff.';
  }
  function closePlay(game, text, kind, gain, seconds, caught) {
    recover(game);
    game.lastGain = gain || 0;
    game.play = null;
    var spent = Math.max(4, Math.min(MAX_CLOCK, Number(seconds) || 4));
    burn(game, spent);
    text = openHalf(game, text);
    if (game.quarterNote) {
      text = String(text).replace(/\s*$/, '') + ' ' + game.quarterNote;
      game.quarterNote = '';
    }
    if (game.otReady) {
      game.otReady = false;
      var firstName = game[game.possession] && game[game.possession].short;
      text = String(text).replace(/\s*$/, '') + ' Overtime. Level at the gun, so each side gets one turn from the 25. ' + (firstName || 'Millrace') + ' goes first. Whoever leads after both turns wins. If it is still level, they play another pair of turns.';
    }
    if (game.quarter === 5) text = finishOtTurn(game, text);
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
    var bq = before.quarter >= 5 ? 4 : before.quarter;
    var aq = after.quarter >= 5 ? 4 : after.quarter;
    var bc = before.quarter >= 5 ? 0 : before.clock;
    var ac = after.quarter >= 5 ? 0 : after.clock;
    return bc - ac + (aq - bq) * QUARTER;
  }
  function spotWords(spot) {
    var yard = Math.round(Number(spot) || 0);
    if (yard >= 100 || yard <= 0) return 'the goal line';
    if (yard <= 50) return 'our ' + yard;
    var theirs = 100 - yard;
    if (theirs < 1) return 'the goal line';
    return 'their ' + theirs;
  }
  /* Yard lines stay on the Lanterns' map of the field. "Our" is their end and "their" is
     Millrace's, for whoever has the ball, so a turnover does not rename our 11 as their 11. */
  function downWords(game) {
    var names = ['', '1st', '2nd', '3rd', '4th'];
    var goal = game.spot + game.toGo >= 99.5;
    var fromHome = game.possession === 'away' ? (100 - game.spot) : game.spot;
    return names[game.down] + ' and ' + (goal ? 'Goal' : String(Math.max(1, Math.round(game.toGo)))) + ' at ' + spotWords(fromHome);
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
    var yardsShown = Math.abs(Math.round(rounded));
    var shown = yardsShown < 1 ? ' for no gain' : (rounded >= 0 ? ' for ' : ', a loss of ') + yardsShown;
    var because = note || '';
    if (code === 'td') {
      var scored = String(label).replace(/[. ]*$/, '') + ' for a score.';
      return closePlay(game, scored + scoreTd(game, side) + because, 'score', rounded, 12, caught);
    }
    if (code === 'safety') return closePlay(game, label + '.' + scoreSafety(game, side) + because, 'score', rounded, 12, caught);
    if (code === 'downs') {
      giveBall(game, other(side), 100 - game.spot);
      return closePlay(game, label + shown + '. Fourth down fails. Turnover on downs.' + because, 'turnover', rounded, 14, caught);
    }
    var extra = code === 'first' && !/stuffed/i.test(label) ? ' First down.' : '';
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

  /* How hard Millrace sits on a play the Lanterns keep calling.
     Only the three most-used calls get extra attention, and only once a play is a habit. */
  function tendencyLoad(game, id) {
    if (!game || game.possession !== 'home') return 0;
    var keys = ['inside', 'outside', 'quick', 'deep'];
    var usage = game.usage || {};
    var rows = keys.map(function (key) { return { id: key, n: usage[key] || 0 }; });
    var total = 0, i, rank = 0, n = 0;
    rows.forEach(function (row) { total += row.n; });
    rows.sort(function (a, b) { return b.n - a.n || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); });
    for (i = 0; i < rows.length; i++) if (rows[i].id === id) { rank = i; n = rows[i].n; }
    if (rank > 2 || n < 3 || total < 4) return 0;
    var share = n / total;
    if (share < 0.34) return 0;
    var weight = (rank === 0 ? 1 : rank === 1 ? 0.55 : 0.32) * (0.5 + share);
    return Math.min(TENDENCY_CAP, (n - 2) * 2.35 * weight);
  }
  function noteUsage(game, id) {
    if (!game || game.possession !== 'home' || !PLAYS[id]) return;
    if (!game.usage) game.usage = { inside: 0, outside: 0, quick: 0, deep: 0 };
    game.usage[id] = (game.usage[id] || 0) + 1;
  }
  function buildRun(play, off, def, id) {
    var back = off.rb;
    play.engage = 0.32;
    play.actors.push(actor({ off: true, role: 'rb', name: back.name, x: 0, y: id === 'outside' ? 9 : 0, speed: back.speed, carry: back.carry, catch: back.catch }));
    play.carrier = 0;
    play.lanes.forEach(function (lane) {
      play.actors.push(actor({
        off: false, role: 'dl', name: 'Rush', x: lane.open ? 2.7 : 1.4, y: lane.y,
        tackle: def.tackle, speed: 54, blocked: lane.open ? 1.7 : 0.18, laneId: lane.id
      }));
    });
    play.actors.push(actor({ off: false, role: 'lb', name: 'Backer', x: 8.4, y: -4, tackle: def.tackle, speed: 56 }));
    play.actors.push(actor({ off: false, role: 'lb', name: 'Backer', x: 8.8, y: 5, tackle: def.tackle, speed: 56 }));
    play.actors.push(actor({ off: false, role: 's', name: 'Safety', x: 18, y: 0, tackle: def.tackle, cover: def.cover, speed: 60, hold: 12 }));
    play.laneStates = {};
    play.lanes.forEach(function (lane) {
      play.laneStates[lane.id] = { state: 'open', since: 0 };
    });
    play.snapLane = id === 'outside' ? 'right' : 'mid';
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
      var held = roll(game) < chance(off.line, def.rush);
      play.actors.push(actor({
        off: false, role: 'dl', name: 'Rush', x: held ? 2.2 : 1.5, y: y, rush: def.rush, tackle: def.tackle, speed: 48,
        blocked: held ? 3.4 : 1.15
      }));
    });
    routes.forEach(function (r) {
      play.actors.push(actor({ off: false, role: 'cb', name: 'Cover', x: r.x + 1.1, y: r.y, cover: def.cover, tackle: def.tackle, speed: 52, route: { x: r.toX, y: r.toY } }));
    });
    play.actors.push(actor({ off: false, role: 's', name: 'Safety', x: deep ? 16 : 9, y: 0, cover: def.cover, tackle: def.tackle, speed: 54 }));
  }

  /* The play the player calls picks the formation. Inside is the I, outside is singleback, a pass is shotgun. */
  function formationFor(id) {
    if (id === 'inside') return 'iform';
    if (id === 'outside') return 'singleback';
    if (id === 'quick' || id === 'deep') return 'shotgun';
    return 'singleback';
  }
  function bodyOf(role) {
    return role === 'ol' || role === 'dl' ? 'line' : 'skill';
  }
  function member(off, role, name, x, y, extra) {
    return Object.assign({
      off: !!off, role: role, name: name || '', x: x, y: y, anchorX: x, anchorY: y,
      face: off ? 1 : -1, body: bodyOf(role), link: null, linkX: 0, linkY: 0, route: null
    }, extra || {});
  }
  /* Eleven a side. Coordinates are yards from the line of scrimmage: x downfield, y lateral. */
  function formationSpots(off, formation) {
    var qb = off.qb, rb = off.rb, te = off.te;
    var wr = off.wr || [];
    var olY = [-2, -1, 0, 1, 2];
    var olName = ['Tackle', 'Guard', 'Centre', 'Guard', 'Tackle'];
    var rows = [];
    olY.forEach(function (y, i) {
      rows.push(member(true, 'ol', olName[i], -0.55, y));
    });
    if (formation === 'shotgun') {
      rows.push(member(true, 'qb', qb.name, -6, 0));
      rows.push(member(true, 'rb', rb.name, -2, 3));
      rows.push(member(true, 'te', te.name, 0, -3));
      rows.push(member(true, 'wr', wr[0] ? wr[0].name : 'Receiver', 0, -8));
      rows.push(member(true, 'wr', wr[1] ? wr[1].name : 'Receiver', 0, 12));
      rows.push(member(true, 'wr', 'Slot', 0, 18, { route: { x: 14, y: 16 } }));
    } else if (formation === 'iform') {
      rows.push(member(true, 'qb', qb.name, -2, 0));
      rows.push(member(true, 'rb', 'Fullback', -3.6, 0));
      rows.push(member(true, 'rb', rb.name, -5.4, 0));
      rows.push(member(true, 'te', te.name, -0.45, 3.3));
      rows.push(member(true, 'wr', wr[0] ? wr[0].name : 'Receiver', 0, -14));
      rows.push(member(true, 'wr', wr[1] ? wr[1].name : 'Receiver', 0, 14));
    } else {
      rows.push(member(true, 'qb', qb.name, -2, 0));
      rows.push(member(true, 'rb', rb.name, -4.8, 0));
      rows.push(member(true, 'te', te.name, -0.45, -3.3));
      rows.push(member(true, 'te', 'Wing', -0.45, 3.3));
      rows.push(member(true, 'wr', wr[0] ? wr[0].name : 'Receiver', 0, -14));
      rows.push(member(true, 'wr', wr[1] ? wr[1].name : 'Receiver', 0, 14));
    }
    return rows;
  }
  function defenceSpots(formation) {
    var nickel = formation === 'shotgun';
    var rows = [];
    [-1.5, -0.5, 0.5, 1.5].forEach(function (y, i) {
      rows.push(member(false, 'dl', i === 0 || i === 3 ? 'End' : 'Tackle', 0.7, y));
    });
    if (nickel) {
      rows.push(member(false, 'lb', 'Backer', 4.4, -3.2));
      rows.push(member(false, 'lb', 'Backer', 4.4, 3.2));
    } else {
      rows.push(member(false, 'lb', 'Backer', 4.6, -4.5));
      rows.push(member(false, 'lb', 'Backer', 4.2, 0));
      rows.push(member(false, 'lb', 'Backer', 4.6, 4.5));
    }
    var wrs = formationSpots({ qb: { name: '' }, rb: { name: '' }, te: { name: '' }, wr: [{ name: '' }, { name: '' }] }, formation).filter(function (p) { return p.role === 'wr'; });
    wrs.forEach(function (wr) {
      rows.push(member(false, 'cb', 'Cover', wr.anchorX + 1.15, wr.anchorY));
    });
    rows.push(member(false, 's', 'Safety', 12, -6));
    rows.push(member(false, 's', 'Safety', 14, 6));
    return { rows: rows, defence: nickel ? 'nickel' : 'base' };
  }
  function claim(squad, actor, pred) {
    var i;
    for (i = 0; i < squad.length; i++) {
      if (squad[i].link || !pred(squad[i])) continue;
      squad[i].link = actor;
      squad[i].linkX = actor.x;
      squad[i].linkY = actor.y;
      squad[i].name = actor.name || squad[i].name;
      return squad[i];
    }
    return null;
  }
  /* Picture of all 22. Rules actors stay the rules; linemen keep a tight row and are not those actors. */
  function composeSquad(off, defSide, play) {
    var formation = formationFor(play.id);
    var squad = formationSpots(off, formation);
    var defence = defenceSpots(formation);
    squad = squad.concat(defence.rows);
    var backfield = null;
    play.actors.forEach(function (actor) {
      if (actor.role === 'qb' || actor.role === 'wr' || actor.role === 'te' || actor.role === 'cb' || actor.role === 's') {
        var taken = claim(squad, actor, function (p) { return p.off === actor.off && p.role === actor.role; });
        if (taken && actor.route) taken.route = null;
      } else if (play.family === 'run' && actor.off && actor.role === 'rb') {
        backfield = claim(squad, actor, function (p) { return p.off && p.role === 'rb' && p.anchorX < -4; });
        if (!backfield) backfield = claim(squad, actor, function (p) { return p.off && p.role === 'rb'; });
      } else if (play.family !== 'run' && actor.off && actor.role === 'rb') {
        claim(squad, actor, function (p) { return p.off && p.role === 'rb'; });
      }
    });
    return { squad: squad, formation: formation, defence: defence.defence };
  }
  function previewSquad(off, defSide, formation) {
    formation = formationFor(formation) === formation ? formation : (formation || 'singleback');
    if (formation !== 'iform' && formation !== 'shotgun' && formation !== 'singleback') formation = 'singleback';
    var defence = defenceSpots(formation);
    var squad = formationSpots(off, formation).concat(defence.rows);
    var ball = { x: -1.15, y: 0 };
    squad.forEach(function (p) {
      if (p.off && p.role === 'qb') ball = { x: p.x, y: p.y };
    });
    return { squad: squad, formation: formation, defence: defence.defence, ball: ball };
  }
  function faceSquad(play) {
    var ball = play.ball || { x: 0, y: 0 };
    play.squad.forEach(function (p) {
      if (p.off && (p.role === 'ol' || p.role === 'qb' || p.role === 'te' || p.role === 'rb')) p.face = 1;
      else if (p.off) p.face = 1;
      else p.face = ball.x + 0.05 < p.x ? -1 : 1;
    });
  }
  function driftSquad(play, p, dt) {
    var ball = play.ball || { x: 0, y: 0 };
    if (p.route) {
      moveToward(p, p.route.x, p.route.y, 4.6, dt);
      return;
    }
    if (p.role === 'ol') {
      p.x = p.anchorX + Math.sin(play.elapsed * 8 + p.anchorY * 3) * 0.06;
      p.y = p.anchorY;
      return;
    }
    if (p.role === 'dl') {
      var qb = carrierOf(play);
      var tx = play.family === 'pass' && !play.flight ? Math.min(p.anchorX + 2.8, qb.x + 1.2) : p.anchorX + Math.max(0, Math.min(1.4, ball.x));
      moveToward(p, tx, p.anchorY, 1.35, dt);
      return;
    }
    if (!p.off) {
      var depth = p.anchorX + Math.max(-0.4, Math.min(7, ball.x * 0.22));
      moveToward(p, depth, p.anchorY * 0.72 + ball.y * 0.28, 3.3, dt);
    }
  }
  function placeBall(play) {
    if (play.flight) {
      play.ball = { x: play.flight.x, y: play.flight.y };
      return play.ball;
    }
    var carrier = carrierOf(play);
    var body = null;
    (play.squad || []).forEach(function (p) { if (p.link === carrier) body = p; });
    play.ball = body ? { x: body.x, y: body.y } : { x: carrier.x, y: carrier.y };
    return play.ball;
  }
  /* Per-tick picture. Linked bodies copy the rules actor's movement. Nothing here rolls the dice. */
  function syncSquad(play, dt) {
    if (!play || !play.squad) return play;
    play.squad.forEach(function (p) {
      if (p.link) {
        p.x = p.anchorX + (p.link.x - p.linkX);
        p.y = p.anchorY + (p.link.y - p.linkY);
      } else if (dt > 0) driftSquad(play, p, dt);
    });
    placeBall(play);
    faceSquad(play);
    return play;
  }

  function callPlay(game, id) {
    if (game.phase !== 'call' && game.phase !== 'cpu') return false;
    var spec = PLAYS[id];
    if (!spec) return false;
    var off = game[game.possession], def = game[other(game.possession)];
    var load = tendencyLoad(game, spec.id);
    if (game.possession === 'home') noteUsage(game, spec.id);
    var rush = def.rush + (spec.family === 'run' ? load * 0.85 : load * 0.22);
    var tuned = {
      cover: def.cover + (spec.family === 'pass' ? load : load * 0.3),
      tackle: def.tackle + (spec.family === 'run' ? load : load * 0.2),
      rush: rush, line: def.line
    };
    var lanes = ['left', 'mid', 'right'].map(function (name, i) {
      var y = [-12, 0, 12][i];
      return { id: name, y: y, open: roll(game) < chance(off.line, rush), block: off.line, rush: rush };
    });
    var play = {
      id: spec.id, family: spec.family, label: spec.label, elapsed: 0, offence: game.possession,
      startSpot: game.spot, lanes: lanes, pocket: 7.4, block: off.line, rush: rush, load: load,
      actors: [], carrier: 0, thrown: false, flight: null, didCatch: false,
      jukeUsed: false, jukeUntil: 0, diving: false, engage: 0,
      ringStep: 0, ringFrom: 0, ringTween: 0.12, rushersWinning: 0
    };
    if (spec.family === 'run') buildRun(play, off, tuned, spec.id);
    else buildPass(game, play, off, tuned, spec.id);
    var picture = composeSquad(off, def, play);
    play.squad = picture.squad;
    play.formation = picture.formation;
    play.defence = picture.defence;
    syncSquad(play, 0);
    game.look = picture.formation;
    game.play = play;
    game.phase = 'live';
    game.events = ['snap'];
    return true;
  }

  /* A throw that has already picked a receiver. Ratings still decide it.
     An ordinary arm and a pair of good hands should bring most of those in.
     A weak arm against tight coverage should not. */
  function throwWindow(dist, kind) {
    var bullet = kind !== 'lob';
    return (bullet ? 22 : 18) + dist * (bullet ? 0.2 : 0.12);
  }
  function resolveCatch(rollFn, qbThrow, hands, cover, dist, kind) {
    var difficulty = throwWindow(dist, kind);
    if (kind === 'lob') difficulty += Math.max(0, dist - 12) * 1.35;
    var coverEff = cover + (kind === 'lob' ? Math.max(0, dist - 12) * 0.7 : 0);
    if (rollFn() > chance(qbThrow, difficulty)) return 'miss';
    if (rollFn() < chance(coverEff - 8, hands)) return rollFn() < 0.28 ? 'pick' : 'drop';
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
    if (game.phase === 'live' && play.elapsed > 7.4) endCarry(game, play, carrierOf(play).name + ' is stopped');
    if (game.phase === 'live' && game.play) syncSquad(game.play, dt);
    return game;
  }

  function stepPocket(game, play, dt, inp) {
    var qb = carrierOf(play);
    play.actors.forEach(function (a) {
      if (a.off && a.route) moveToward(a, a.route.x, a.route.y, 4.3 + a.speed / 28, dt);
      else if (!a.off && a.role === 'cb' && a.route) moveToward(a, a.route.x, a.route.y, 4.5 + a.cover / 40, dt);
      else if (!a.off && a.role === 'dl') {
        var slow = play.elapsed < a.blocked ? 0.18 : 1;
        moveToward(a, qb.x, qb.y, (2.7 + a.rush / 70) * slow, dt);
      }
    });
    var winning = 0;
    play.actors.forEach(function (a) {
      if (!a.off && a.role === 'dl' && play.elapsed + 1e-9 >= a.blocked) winning += 1;
    });
    play.rushersWinning = winning;
    var step = winning <= 0 ? 0 : winning === 1 ? 1 : winning === 2 ? 2 : 3;
    if (step !== play.ringStep) {
      play.ringFrom = play.ringStep;
      play.ringStep = step;
      play.ringTween = 0;
    } else if (play.ringTween < 0.12) play.ringTween = Math.min(0.12, play.ringTween + dt);
    var edge = (play.rush - play.block) / 22;
    play.pocket = Math.max(0.35, 7.4 - winning * 1.8 - Math.max(0, edge));
    if (step >= 3) play.collapseFor = (play.collapseFor || 0) + dt;
    else play.collapseFor = 0;
    var rusher = nearest(play, qb.x, qb.y, function (a) { return !a.off && a.role === 'dl'; });
    if (inp.dive) {
      play.family = 'run'; play.diving = true; play.usedDive = true; qb.x += 1.3;
      game.events.push('dive');
      return;
    }
    if (inp.throw) return launch(game, play, inp.throw);
    if ((rusher && rusher.d < 0.58) || (step >= 3 && play.collapseFor > 1.05)) {
      if (roll(game) < chance(play.rush, qb.throw)) {
        game.events.push('sack');
        return applyYards(game, -(2 + roll(game) * 4), qb.name + ' is sacked', false, ' ' + resultLine('the rush', play.rush, 'the line', play.block));
      }
      game.events.push('miss');
      return incomplete(game, qb.name + ' throws it away');
    }
  }

  /* Yards this pull can travel. A short drag dies at a checkdown.
     Length grows with the square of the pull, so a long drag is the one that reaches a deep route. */
  function throwReach(power) {
    var p = clamp(Number(power) || 0, 0, 1);
    return 7.5 + p * p * 35;
  }
  /* Where this drag is headed. No dice, so the picture can show the same spot the snap will use.
     The aim line picks the receiver: the one closest to that line, not the deepest in a wide cone.
     Pull strength sets how far the ball can travel, and whether it is a bullet or a lob. */
  function aimThrow(play, thrown) {
    var qb = carrierOf(play);
    var mag = Math.hypot(thrown.dirX, thrown.dirY) || 1;
    var dirX = thrown.dirX / mag, dirY = thrown.dirY / mag;
    var power = clamp(Number(thrown.power) || 0, 0, 1);
    var kind = power < 0.42 ? 'bullet' : 'lob';
    var reach = throwReach(power);
    var best = null, bestMiss = 1e9, bestDot = -1;
    play.actors.forEach(function (a) {
      if (!a.off || a.role === 'qb') return;
      var aim = a.route || { x: a.x, y: a.y };
      var dx = aim.x - qb.x, dy = aim.y - qb.y;
      var dist = Math.hypot(dx, dy) || 1;
      var dot = (dx / dist) * dirX + (dy / dist) * dirY;
      if (dot <= 0) return;
      if (dist > reach + 5) return;
      var miss = Math.abs(dx * dirY - dy * dirX);
      if (miss < bestMiss - 1e-6 || (Math.abs(miss - bestMiss) <= 1e-6 && dot > bestDot)) {
        best = { actor: a, aim: aim, dist: dist };
        bestMiss = miss;
        bestDot = dot;
      }
    });
    if (best) {
      return {
        kind: kind, power: power, aimed: true, reach: reach,
        target: best.actor, x: best.aim.x, y: best.aim.y, dist: best.dist
      };
    }
    return {
      kind: kind, power: power, aimed: false, reach: reach, target: null,
      x: qb.x + dirX * reach, y: qb.y + dirY * reach, dist: reach
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

  function slippingSoon(play) {
    return play.elapsed < play.jukeUntil || play.elapsed < (play.diveUntil || 0);
  }
  function updateRunLanes(play) {
    if (!play.lanes) return;
    if (!play.laneStates) {
      play.laneStates = {};
      play.lanes.forEach(function (lane) {
        play.laneStates[lane.id] = { state: 'open', since: 0 };
      });
    }
    play.lanes.forEach(function (lane) {
      var row = play.laneStates[lane.id];
      var lost = false, entered = false;
      play.actors.forEach(function (a) {
        if (a.off) return;
        var free = play.elapsed + 1e-9 >= (a.blocked || 0);
        if (a.laneId === lane.id && free) lost = true;
        if (free && Math.abs(a.y - lane.y) < 4.2 && a.x > -0.4 && a.x < 7.2) entered = true;
      });
      if (play.elapsed - row.since < 0.15 - 1e-9) return;
      var next = row.state;
      if (row.state === 'open' && lost) next = 'contested';
      else if (row.state === 'contested' && entered) next = 'closed';
      if (next !== row.state) {
        row.state = next;
        row.since = play.elapsed;
      }
    });
  }
  function readLane(play, y) {
    var best = play.lanes[Math.floor(play.lanes.length / 2)] || play.lanes[0];
    var bestD = 1e9;
    (play.lanes || []).forEach(function (lane) {
      var d = Math.abs(lane.y - y);
      if (d < bestD) { best = lane; bestD = d; }
    });
    return best;
  }
  function laneRead(play, y) {
    var lane = readLane(play, y);
    var row = play.laneStates && lane && play.laneStates[lane.id];
    return { lane: lane, state: row ? row.state : 'open' };
  }
  /* A timed move is a contest, not a promise. Most wins add a chunk. A clean win can break it. */
  function moveContest(game, offRating, defRating) {
    var p = chance(offRating, defRating);
    var r = roll(game);
    if (r >= p) return 'stop';
    if (r < p * 0.36) return 'break';
    return 'gain';
  }
  function extendMove(game, play, kind) {
    if (play.goalX == null || play.moveExtended) return;
    play.moveExtended = true;
    var result = kind === 'juke' ? play.jukeResult : play.diveResult;
    if (play.hole === 'stuff' && result !== 'break') return;
    var boost = result === 'break'
      ? (kind === 'juke' ? (play.hole === 'break' ? 0.8 + roll(game) * 0.6 : 8.15 + roll(game) * 0.5) : 1.6 + roll(game) * 1.2)
      : (result === 'gain' ? (kind === 'dive' ? 1.35 + roll(game) * 0.9 : 0.85 + roll(game) * 0.55) : 0);
    if (result === 'break') { play.breakaway = true; play.hole = 'break'; }
    if (play.offence === 'away') boost *= 0.8;
    play.goalX += boost;
    if (boost > 0 && play.arriveAt != null) play.arriveAt = Math.min(2.95, Math.max(play.arriveAt, play.elapsed + 0.45));
  }
  /* A juke keeps the lane it left. Steering before that can still choose a lane. */
  function holeLane(play, back) {
    var y = play.holeY != null ? play.holeY : (back.y + (play._steer || 0) * 12);
    return readLane(play, y);
  }
  /* Contest rolls wait until the hole has used its own rolls, so an early step and a timed one share the lane. */
  function resolveArmed(game, play) {
    if (!play || play.goalX == null) return;
    var back = carrierOf(play);
    if (play.jukeArmed && !play.jukeResolved) {
      play.jukeResolved = true;
      if (!play.jukeResult) {
        play.jukeResult = play.jukeWasTimed ? moveContest(game, back.speed + 2, play.jukeThreat || 50) : 'stop';
        play.jukeBreak = play.jukeResult === 'break';
        play.jukeTimed = play.jukeResult !== 'stop';
      }
      if (play.jukeBreak) { play.breakaway = true; back.x += 1.15; }
      if (play.jukeWasTimed) {
        play.ratingNote = play.jukeResult === 'stop'
          ? ' ' + resultLine('the tackle', play.jukeThreat, 'the juke', back.speed)
          : ' ' + resultLine('the juke', back.speed, 'the tackle', play.jukeThreat);
      }
      if (play.jukeTimed) extendMove(game, play, 'juke');
    }
    if (play.diveArmed && !play.diveResolved) {
      play.diveResolved = true;
      if (!play.diveResult) {
        var diveAtGoal = game.spot >= 94;
        play.diveResult = play.diveWasTimed ? (diveAtGoal ? 'break' : moveContest(game, back.carry + 8, play.diveThreat || 50)) : 'stop';
        play.diveBreak = play.diveResult === 'break';
        play.diveTimed = play.diveResult !== 'stop';
      }
      if (play.diveBreak) play.breakaway = true;
      if (play.diveWasTimed) {
        play.ratingNote = play.diveResult === 'stop'
          ? ' ' + resultLine('the tackle', play.diveThreat, 'the dive', back.carry)
          : ' ' + resultLine('the dive', back.carry, 'the tackle', play.diveThreat);
      }
      if (play.diveTimed) extendMove(game, play, 'dive');
    }
  }
  function settleHole(game, play, back) {
    if (play.goalX != null) return;
    if (play.didCatch) {
      if (play.elapsed < 0.22) return;
    } else if (play.elapsed < 0.86) return;
    var lane = holeLane(play, back);
    var held = !!(lane && lane.open);
    var threat = nearest(play, back.x, back.y, function (a) { return !a.off; });
    var tackle = threat ? threat.actor.tackle : 55;
    if (!play.didCatch && !held) {
      var piled = roll(game);
      if (piled < 0.155) {
        play.hole = 'stuff';
        play.goalX = -(0.7 + piled * 8);
        play.arriveAt = 1.08 + piled * 2.2;
      } else if (piled < 0.23) {
        play.hole = 'stuff';
        play.goalX = 0;
        play.arriveAt = 1.12 + piled;
      } else {
        play.hole = 'gain';
        var along = (piled - 0.23) / 0.77;
        play.goalX = 1.15 + along * 3.45;
        play.arriveAt = 1.16 + along * 0.7;
      }
      if (back.x > play.goalX) play.arriveAt = Math.max(play.arriveAt, play.elapsed + 0.35);
      play.ratingNote = play.ratingNote || (' ' + resultLine(play.hole === 'stuff' ? 'the rush' : 'the line', play.hole === 'stuff' ? play.rush : play.block, play.hole === 'stuff' ? 'the line' : 'the rush', play.hole === 'stuff' ? play.block : play.rush));
    } else {
      var juice = back.speed;
      var tax = play.offence === 'home' ? (play.load || 0) : 0;
      var second = !play.didCatch && roll(game) < chance(juice, tackle + (play.offence === 'away' ? 6 : 16) + tax) * 1.05;
      if (second) {
        var broke = roll(game);
        play.hole = 'break';
        play.breakaway = true;
        play.goalX = 10.4 + broke * 11.2;
        play.arriveAt = 2.05 + broke * 0.78;
      } else if (play.didCatch) {
        var room = play.catchRoom == null ? 3 : play.catchRoom;
        var after = roll(game);
        var bonus = room >= 4.2 ? (2.6 + after * 9.4) : (0.4 + after * (1.1 + Math.min(room, 4) * 0.55));
        if (play.offence === 'home') bonus += 1.3;
        play.hole = 'catch';
        play.goalX = back.x + bonus;
        play.arriveAt = play.elapsed + 0.42 + after * 0.5;
      } else {
        var gained = roll(game);
        play.hole = 'gain';
        play.goalX = 2.55 + gained * 1.95;
        play.arriveAt = 1.28 + gained * 0.85;
      }
      if (tax && play.goalX > 0) play.goalX = Math.max(0.15, play.goalX - tax * 0.42);
      if (!play.ratingNote) play.ratingNote = ' ' + resultLine('the line', play.block, 'the rush', play.rush);
    }
    if (play.hole !== 'stuff' && play.turboBank) {
      play.goalX += play.turboBank;
      play.turboBank = 0;
    }
    if (play.offence === 'away' && play.goalX > 0) play.goalX = 0.12 + play.goalX * 0.97;
    if (!play.diveBreak && !play.jukeBreak && game.spot >= 94) play.goalX = Math.min(play.goalX, 1.05 + roll(game) * 2.3);
    play.arriveAt = Math.max(play.didCatch ? play.elapsed + 0.35 : 1.02, Math.min(2.95, play.arriveAt || 1.4));
    resolveArmed(game, play);
  }
  function stepCarry(game, play, dt, inp) {
    if (play.flight) return fly(game, play, dt);
    var back = carrierOf(play);
    var fatigue = fatigueOf(game, back.name);
    play.turboOn = false;
    if (inp.turbo && fatigue < 0.82) {
      fatigue += dt * 0.4;
      play.turboOn = true;
      game.events.push('turbo');
    }
    game.fatigue[back.name] = clamp(fatigue, 0, 1);
    var engage = play.engage || 0;
    var reading = play.elapsed < engage;
    if (inp.juke && !play.jukeUsed) {
      var jukeThreat = nearest(play, back.x, back.y, function (a) { return !a.off; });
      var jukeTackle = jukeThreat ? jukeThreat.actor.tackle : 50;
      var jukeWasTimed = !!(jukeThreat && jukeThreat.d < 2.8 && play.elapsed + 1e-6 >= engage);
      if (play.holeY == null) play.holeY = back.y;
      back.y += inp.juke * (3.6 + back.speed / 40);
      play.jukeUsed = true; play.usedJuke = true; play.jukeDir = inp.juke;
      play.jukeArmed = true; play.jukeWasTimed = jukeWasTimed; play.jukeThreat = jukeTackle;
      play.jukeUntil = play.elapsed + (jukeWasTimed ? 0.9 : 0.28);
      if (play.goalX != null) resolveArmed(game, play);
      game.events.push('juke');
    }
    if (inp.dive && !play.diving) {
      var diveThreat = nearest(play, back.x, back.y, function (a) { return !a.off; });
      var diveTackle = diveThreat ? diveThreat.actor.tackle : 50;
      var diveWasTimed = !!(diveThreat && diveThreat.d < 2.6 && play.elapsed + 1e-6 >= engage);
      var diveAtGoal = game.spot >= 94;
      play.diving = true; play.usedDive = true;
      play.diveArmed = true; play.diveWasTimed = diveWasTimed; play.diveThreat = diveTackle;
      if (diveWasTimed && diveAtGoal) {
        play.diveResult = 'break';
        play.diveBreak = true;
        play.diveTimed = true;
        play.breakaway = true;
      }
      var diveBurst = (play.diveBreak ? 3.05 : 1.05) + back.carry / 62;
      if (play.jukeWasTimed && !diveAtGoal) diveBurst *= 0.4;
      back.x += diveBurst;
      play.diveUntil = play.elapsed + (diveWasTimed ? 0.72 : 0.26);
      if (play.goalX != null) resolveArmed(game, play);
      game.events.push('dive');
    }
    play._steer = inp.steer;
    updateRunLanes(play);
    var read = laneRead(play, back.y);
    if (play.turboOn && read.state !== 'closed' && play.hole !== 'stuff' && (play.turboSpent || 0) < 0.85) {
      var turboAdd = Math.min(0.85 - (play.turboSpent || 0), 0.9 * dt);
      play.turboSpent = (play.turboSpent || 0) + turboAdd;
      if (play.goalX != null) play.goalX += turboAdd;
      else play.turboBank = (play.turboBank || 0) + turboAdd;
    }
    if (play.goalX == null) {
      var openish = !!(read.lane && read.lane.open && read.state !== 'closed');
      var crawl = (reading ? 0.62 : 1) * (play.didCatch ? 2.4 : openish ? 1.35 : 0.18);
      back.x += crawl * dt;
    } else {
      var remain = Math.max(1 / 30, (play.arriveAt || play.elapsed + 0.4) - play.elapsed);
      back.x += (play.goalX - back.x) * Math.min(1, dt / remain);
    }
    back.y = clamp(back.y + inp.steer * 8.4 * dt, -SIDELINE - 1, SIDELINE + 1);
    play.actors.forEach(function (a) {
      if (a === back || a.off) return;
      if (a.hold && back.x < a.hold) return;
      var slow = play.elapsed < a.blocked ? 0.2 : 1;
      var close = reading ? 0.55 : 1.05;
      if (play.breakaway) close *= 0.92;
      moveToward(a, back.x, back.y, defenderRate(a) * slow * close, dt);
    });
    updateRunLanes(play);
    if (Math.abs(back.y) > SIDELINE) return endCarry(game, play, back.name + ' steps out');
    if (game.spot + back.x >= 100) return endCarry(game, play, back.name);
    var closing = nearest(play, back.x, back.y, function (a) { return !a.off; });
    play.cue = null;
    if (!reading && closing && !slippingSoon(play)) {
      if (!play.jukeUsed && closing.d < 2.8 && closing.d >= 1.35) play.cue = 'juke';
      else if (!play.diving && closing.d < 1.85) play.cue = 'dive';
      else if (fatigue < 0.45 && back.x < 22) play.cue = 'turbo';
    } else if (!reading && fatigue < 0.45 && back.x > 1 && back.x < 22) play.cue = 'turbo';
    if (!reading || play.didCatch) settleHole(game, play, back);
    if (play.goalX != null && play.elapsed + 1e-9 >= (play.arriveAt || 0) && !slippingSoon(play)) {
      back.x = play.goalX;
      if (!play.didCatch) {
        var tackler = closing && closing.actor;
        var tackleAt = tackler ? tackler.tackle : 55;
        if (play.jukeBreak && play.hole === 'break') play.ratingNote = ' ' + resultLine('the juke', back.speed, 'the tackle', tackleAt);
        else if (play.diveBreak && play.hole === 'break') play.ratingNote = ' ' + resultLine('the dive', back.carry, 'the tackle', tackleAt);
        else if (play.hole === 'stuff') play.ratingNote = ' ' + resultLine('the rush', play.rush, 'the line', play.block);
        else if (play.hole === 'break') play.ratingNote = ' ' + resultLine('the carry', back.carry, 'the tackle', tackleAt);
        else play.ratingNote = ' ' + resultLine('the line', play.block, 'the rush', play.rush);
      }
      game.events.push('tackle');
      return endCarry(game, play, back.name + (play.didCatch ? ' catches it and is stopped' : ' is stopped'));
    }
  }

  function carryLabel(play, who, yards) {
    var name = who.name;
    if (play.didCatch) {
      if (play.usedJuke && play.usedDive) return name + ' catches it, jukes and dives';
      if (play.usedJuke) return name + ' catches it and jukes';
      if (play.usedDive) return name + ' catches it and dives';
      return name + ' catches it and is stopped';
    }
    var inside = play.id === 'inside';
    var edge = play.id === 'outside';
    if (play.usedJuke && play.usedDive) return name + (inside ? ' jukes and dives between the tackles' : edge ? ' jukes and dives toward the sideline' : ' jukes and dives');
    if (play.usedJuke) return name + (inside ? ' jukes between the tackles' : edge ? ' jukes toward the sideline' : ' jukes');
    if (play.usedDive) return name + (inside ? ' dives between the tackles' : edge ? ' dives toward the sideline' : ' dives');
    if (play.breakaway) return name + (inside ? ' breaks through the middle' : edge ? ' breaks it outside' : ' breaks away');
    if (inside) return (play.hole === 'stuff' || yards <= 0) ? name + ' is stuffed between the tackles' : name + ' finds a hole between the tackles';
    if (edge) return (play.hole === 'stuff' || yards <= 0) ? name + ' is stuffed at the edge' : name + ' turns the corner';
    return '';
  }
  function endCarry(game, play, label) {
    var who = carrierOf(play);
    var named = carryLabel(play, who, who.x);
    return applyYards(game, who.x, named || label, play.didCatch, play.ratingNote || '');
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
    if (play.offence === 'away') cov += 3;
    var hands = catcher.actor.catch;
    var opening = throwWindow(dist, ball.kind);
    var outcome = resolveCatch(function () { return roll(game); }, ball.qb, hands, cov, dist, ball.kind);
    if (outcome === 'catch') {
      catcher.actor.x = ball.toX; catcher.actor.y = ball.toY;
      play.flight = null; play.family = 'run'; play.didCatch = true;
      play.carrier = play.actors.indexOf(catcher.actor);
      play.diving = false; play.jukeUsed = false; play.usedJuke = false; play.usedDive = false;
      play.engage = 0;
      play.catchRoom = cover ? cover.d : 8;
      play.ratingNote = ' ' + resultLine(catcher.actor.name + "'s hands", hands, 'the cover', cov);
      game.events.push('catch');
      return;
    }
    if (outcome === 'pick') {
      game.events.push('pick');
      var landed = ball.x;
      var field = clamp(play.startSpot + landed, 0, 100);
      giveBall(game, other(play.offence), 100 - field);
      return closePlay(game, 'Intercepted near ' + catcher.actor.name + '. ' + resultLine('the cover', cov, catcher.actor.name + "'s hands", hands), 'turnover', 0, 10, false);
    }
    if (outcome === 'drop') {
      game.events.push('miss');
      return incomplete(game, catcher.actor.name + ' cannot bring it in. ' + resultLine('the cover', cov, catcher.actor.name + "'s hands", hands));
    }
    game.events.push('miss');
    return incomplete(game, 'The throw misses ' + catcher.actor.name + '. ' + resultLine('the window', opening, 'the throw', ball.qb));
  }

  function incomplete(game, text) {
    var side = game.possession;
    var line = String(text).replace(/[. ]*$/, '');
    game.down += 1;
    if (game.down > 4) {
      giveBall(game, other(side), 100 - game.spot);
      return closePlay(game, line + '. Fourth down fails. Turnover on downs.', 'turnover', 0, 6, false);
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
    if (game.toGo <= 2) return r < 0.68 ? 'inside' : 'quick';
    if (game.spot >= 68) return r < 0.42 ? 'inside' : r < 0.78 ? 'quick' : 'outside';
    if (game.toGo >= 8) return r < 0.16 ? 'deep' : r < 0.58 ? 'quick' : r < 0.82 ? 'outside' : 'inside';
    if (r < 0.3) return 'inside';
    if (r < 0.56) return 'outside';
    if (r < 0.86) return 'quick';
    return 'deep';
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
      var away = play.offence === 'away';
      if (away && game && roll(game) < 0.2) lane = play.lanes[play.id === 'outside' ? 2 : 1] || lane;
      var steer = clamp((lane.y - back.y) / 6, -1, 1);
      var threat = nearest(play, back.x, back.y, function (a) { return !a.off; });
      var tired = game ? fatigueOf(game, back.name) : 0;
      var jukeOk = !away || (game && roll(game) < 0.58);
      var arrived = play.elapsed + 1 / 30 >= (play.engage || 0);
      var juke = jukeOk && !play.jukeUsed && arrived && threat && threat.d < 2.4 ? (back.y >= threat.actor.y ? 1 : -1) : 0;
      var dive = !play.diving && arrived && threat && threat.d < 1.6 && back.x > 1.2 && (!away || (game && roll(game) < 0.5));
      return { steer: steer, turbo: !away && tired < 0.55 && back.x < 14, juke: juke, dive: dive, throw: null };
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
    var prefer;
    if (game.toGo <= 2) prefer = ['inside', 'quick', 'outside'];
    else if (game.spot >= 62) prefer = ['quick', 'inside', 'outside'];
    else if (game.toGo >= 8) prefer = ['quick', 'outside', 'inside', 'deep'];
    else prefer = ['outside', 'inside', 'quick', 'deep'];
    var r = roll(game);
    if (r < 0.30) return prefer[prefer.length - 1];
    var fresh = prefer.filter(function (id) { return tendencyLoad(game, id) < 8; });
    var pool = fresh.length ? fresh : prefer;
    return pool[Math.floor(roll(game) * Math.min(3, pool.length))];
  }
  function simulateGame(seed, style) {
    var game = create({ seed: (seed >>> 0) || 1 });
    var guard = 0;
    var pol = style === 'careless' ? policies.careless : policies.cpu;
    while (game.phase !== 'final' && guard++ < 240) {
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
  function callStyle(game, style) {
    var r = roll(game);
    if (style === 'run') {
      if (game.toGo <= 2 || game.spot >= 94) return 'inside';
      if (r < 0.34) return 'inside';
      if (r < 0.62) return 'outside';
      if (r < 0.90) return 'quick';
      return 'deep';
    }
    if (style === 'pass') {
      if (game.toGo <= 1) return 'inside';
      if (r < 0.55) return 'quick';
      if (r < 0.78) return 'deep';
      return r < 0.94 ? 'inside' : 'outside';
    }
    return callChoice(game, 'attentive');
  }
  /* Runs only, from the kickoff, until the drive has 50 yards or the clock and the sticks say otherwise. */
  function runClockDrive(seed) {
    var game = create({ seed: (seed >>> 0) || 1 });
    var mark = { quarter: game.quarter, clock: game.clock, phase: game.phase };
    var yards = 0, guard = 0;
    while (game.possession === 'home' && game.phase !== 'final' && guard++ < 24) {
      if (yards >= 50) break;
      if (clockSpent(mark, game) >= 90) break;
      if (game.down >= 4) break;
      var id = roll(game) < 0.55 ? 'inside' : 'outside';
      if (!callPlay(game, id)) break;
      finish(game, policies.cpu);
      yards += game.last ? Number(game.last.gain) || 0 : 0;
    }
    return {
      yards: Math.round(yards * 10) / 10,
      clock: Math.round(clockSpent(mark, game) * 10) / 10,
      seed: (seed >>> 0) || 1
    };
  }
  function simulateStyle(seed, style) {
    var game = create({ seed: (seed >>> 0) || 1 });
    var guard = 0;
    while (game.phase !== 'final' && guard++ < 280) {
      if (game.possession !== 'home') { cpuDrive(game); continue; }
      if (game.phase === 'final') break;
      if (game.down >= 4) { kick(game); continue; }
      if (!callPlay(game, callStyle(game, style))) break;
      finish(game, policies.cpu);
    }
    return game;
  }
  function styleBand(n, seed) {
    var runScore = 0, runOpp = 0, runWins = 0, passScore = 0, passOpp = 0, passWins = 0;
    var mixScore = 0, mixOpp = 0, mixWins = 0, i;
    for (i = 0; i < n; i++) {
      var key = ((seed + i * 17) >>> 0) || 1;
      var runGame = simulateStyle(key, 'run');
      var passGame = simulateStyle(key, 'pass');
      var mixGame = simulateStyle(key, 'mixed');
      runScore += runGame.score.home; runOpp += runGame.score.away;
      passScore += passGame.score.home; passOpp += passGame.score.away;
      mixScore += mixGame.score.home; mixOpp += mixGame.score.away;
      if (runGame.score.home > runGame.score.away) runWins += 1;
      if (passGame.score.home > passGame.score.away) passWins += 1;
      if (mixGame.score.home > mixGame.score.away) mixWins += 1;
    }
    return {
      n: n,
      run: { mean: runScore / n, opp: runOpp / n, wins: runWins },
      pass: { mean: passScore / n, opp: passOpp / n, wins: passWins },
      mixed: { mean: mixScore / n, opp: mixOpp / n, wins: mixWins }
    };
  }
  function millraceDrives(n, seed) {
    var drives = 0, punt = 0, fieldGoal = 0, turnover = 0, touchdown = 0, i;
    for (i = 0; i < n; i++) {
      var game = create({ seed: ((seed + i * 19) >>> 0) || 1 });
      var guard = 0;
      while (game.phase !== 'final' && guard++ < 280) {
        if (game.possession !== 'away') {
          if (game.down >= 4) kick(game);
          else if (!callPlay(game, 'inside')) break;
          else finish(game, policies.neutral);
          continue;
        }
        var before = game.score.away;
        var lines = cpuDrive(game);
        if (!lines.length) break;
        drives += 1;
        var text = lines.map(function (row) { return row.text; }).join(' ');
        if (/Touchdown/.test(text) && game.score.away > before) touchdown += 1;
        else if (/makes it|misses from/.test(text)) fieldGoal += 1;
        else if (/punts/.test(text)) punt += 1;
        else if (/Intercept|Turnover|Fourth down fails|Safety/.test(text)) turnover += 1;
      }
    }
    return { drives: drives, punt: punt, fieldGoal: fieldGoal, turnover: turnover, touchdown: touchdown, n: n };
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
  /* One Millrace snap. The drive keeps going when the quarter turns; only a real change of possession, the half, or the gun stops it. */
  function cpuSnap(game) {
    if (!game || game.phase === 'final' || game.possession !== 'away') return false;
    if (game.down >= 4) { kick(game); return true; }
    if (!callPlay(game, cpuCall(game))) return false;
    finish(game, policies.cpu);
    return true;
  }
  function cpuDrive(game, onPlay) {
    var lines = [], n = 0;
    while (game.possession === 'away' && game.phase !== 'final' && n < 24) {
      if (!cpuSnap(game)) break;
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
    var arrived = play.elapsed + 1 / 30 >= (play.engage || 0) && threat && threat.d < 2.5;
    var juke = !play.jukeUsed && arrived ? (back.y >= threat.actor.y ? 1 : -1) : 0;
    return { steer: 0, turbo: false, juke: juke, dive: false, throw: null };
  }
  function earlyJukePolicy(play) {
    if (!play || play.family === 'pass' || play.jukeUsed) return policies.neutral();
    if (play.elapsed < 0.05) return { steer: 0, turbo: false, juke: 1, dive: false, throw: null };
    return policies.neutral();
  }
  function divePolicy(play) {
    if (!play || play.family === 'pass') return policies.neutral();
    var back = carrierOf(play);
    var threat = nearest(play, back.x, back.y, function (a) { return !a.off; });
    var arrived = play.elapsed + 1 / 30 >= (play.engage || 0) && threat && threat.d < 2.35;
    return { steer: 0, turbo: false, juke: 0, dive: !play.diving && !!arrived, throw: null };
  }
  function earlyDivePolicy(play) {
    if (!play || play.diving || play.family === 'pass') return policies.neutral();
    if (play.elapsed < 0.05) return { steer: 0, turbo: false, juke: 0, dive: true, throw: null };
    return policies.neutral();
  }
  function scriptedSeries(seed, plan) {
    var game = create({ seed: (seed >>> 0) || 1 });
    var guard = 0, called = 0;
    while (game.phase !== 'final' && guard++ < 240) {
      if (game.possession !== 'home') { cpuDrive(game); continue; }
      if (game.down >= 4) { kick(game); continue; }
      var id = plan(game, called);
      called += 1;
      if (!callPlay(game, id)) break;
      finish(game, id === 'quick' ? scriptedQuick : policies.cpu);
    }
    return game;
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
      fatigue: Object.assign({}, game.fatigue),
      usage: Object.assign({ inside: 0, outside: 0, quick: 0, deep: 0 }, game.usage),
      received: game.received === 'away' ? 'away' : 'home',
      home: game.home, away: game.away,
      last: game.last, log: game.log.slice(), lastGain: game.lastGain, playSerial: game.playSerial || 0,
      otTurns: game.otTurns || 0
    };
  }
  function restore(data) {
    data = data || {};
    var game = create({ seed: data.seed || 1 });
    if (data.home && data.home.qb) game.home = data.home;
    if (data.away && data.away.qb) game.away = data.away;
    game.rng = (data.rng >>> 0) || game.rng;
    game.seed = (data.seed >>> 0) || game.seed;
    var quarter = Math.round(Number(data.quarter) || 1);
    game.quarter = quarter === 5 ? 5 : clamp(quarter, 1, 4);
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
    game.received = data.received === 'away' ? 'away' : 'home';
    game.usage = { inside: 0, outside: 0, quick: 0, deep: 0 };
    if (data.usage && typeof data.usage === 'object') {
      ['inside', 'outside', 'quick', 'deep'].forEach(function (id) {
        game.usage[id] = Math.max(0, Math.round(Number(data.usage[id]) || 0));
      });
    }
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
    game.otTurns = Math.max(0, Math.round(Number(data.otTurns) || 0));
    game.otSide = game.quarter === 5 ? game.possession : null;
    game.otReady = false;
    game.play = null;
    return game;
  }

  var api = {
    QUARTER: QUARTER, SIDELINE: SIDELINE, MAX_CLOCK: MAX_CLOCK, PLAYS: PLAYS,
    chance: chance, teamOutline: teamOutline, create: create, restore: restore, serialise: serialise,
    callPlay: callPlay, kick: kick, step: step, finish: finish, cpuDrive: cpuDrive, cpuSnap: cpuSnap, cpuCall: cpuCall,
    policies: policies, downWords: downWords, spotWords: spotWords, resolveCatch: resolveCatch,
    laneOpenRate: laneOpenRate, catchRate: catchRate, sampleRunYards: sampleRunYards,
    passCatchShare: passCatchShare, digestScript: digestScript, snapshot: snapshot, burn: burn,
    moveChains: moveChains, currentMessage: currentMessage, clockSpent: clockSpent, aimThrow: aimThrow,
    simulateGame: simulateGame, winSplit: winSplit, jukePolicy: jukePolicy, divePolicy: divePolicy,
    earlyJukePolicy: earlyJukePolicy, earlyDivePolicy: earlyDivePolicy, scriptedSeries: scriptedSeries,
    scriptedQuick: scriptedQuick,
    tendencyLoad: tendencyLoad, resultLine: resultLine, decided: decided,
    TENDENCY_CAP: TENDENCY_CAP, READING_HINT: READING_HINT, RING_RADII: RING_RADII,
    simulateStyle: simulateStyle, styleBand: styleBand, millraceDrives: millraceDrives, runClockDrive: runClockDrive,
    callStyle: callStyle,
    laneRead: laneRead, updateRunLanes: updateRunLanes,
    formationFor: formationFor, previewSquad: previewSquad, syncSquad: syncSquad
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LanternModel = api;
})(typeof window === 'object' ? window : globalThis);
