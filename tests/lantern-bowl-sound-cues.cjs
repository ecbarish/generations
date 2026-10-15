/* Checks for games/lantern-bowl/sound-cues.js (LB-G4). Plain Node, no packages:  node tests/lantern-bowl-sound-cues.cjs
   Exports { run, checks } for other tools; in a page with no `module` it sets window.LanternBowlCuesChecks. */
(function (root, factory) {
  const api = factory(typeof require === 'function' ? require : null);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LanternBowlCuesChecks = api;
  if (typeof require === 'function' && typeof module === 'object' && require.main === module) process.exitCode = api.run() ? 0 : 1;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (req) {
  'use strict';
  const fs = req ? req('fs') : null, path = req ? req('path') : null;
  const SRC = path ? path.join(__dirname, '..', 'games', 'lantern-bowl', 'sound-cues.js') : null;
  const NEEDED = ['touchdown', 'tackle', 'catch', 'crowdBed', 'crowdSwell', 'whistle', 'kick', 'firstDown', 'interception'];
  const WAVES = ['sine', 'square', 'triangle', 'saw'];
  const FILTERS = ['lowpass', 'highpass', 'bandpass'];
  const NOTE_RE = /^[A-G]#?\d$/;   // the spelling shared/sound.js reads: 'C5', 'F#4'

  function load() { return req ? req(SRC) : root.LanternBowlCues; }

  function notesOf(v) { return v.kind === 'tone' ? (v.notes || [v.note]) : []; }
  function voiceAmount(v) { return (v.kind === 'tone' ? notesOf(v).length : 1) * v.gain + (v.kind === 'noise' && v.lfo ? v.lfo.depth : 0); }
  function end(cue) { return Math.max.apply(null, cue.voices.map(v => v.at + v.dur)); }
  function loudest(cue) {
    const ev = [];
    cue.voices.forEach(v => { const k = voiceAmount(v); ev.push([v.at, k], [v.at + v.dur, -k]); });
    ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let s = 0, m = 0; ev.forEach(e => { s += e[1]; m = Math.max(m, s); });
    return m;
  }

  /* A stand-in for an AudioContext that records what was asked of it and rejects anything non-finite. */
  function stubContext() {
    const log = { created: [], starts: 0, stops: 0, connects: 0, bad: [] };
    const param = (label) => {
      const chk = (n, args) => args.forEach(a => { if (typeof a !== 'number' || !isFinite(a)) log.bad.push(label + '.' + n + '(' + args.join(',') + ')'); });
      return {
        setValueAtTime(...a) { chk('setValueAtTime', a); }, linearRampToValueAtTime(...a) { chk('linearRamp', a); },
        exponentialRampToValueAtTime(...a) { chk('expRamp', a); if (a[0] <= 0) log.bad.push(label + ' expRamp to ' + a[0]); }
      };
    };
    const node = (kind, extra) => Object.assign({
      kind, connect(to) { log.connects++; if (!to) log.bad.push(kind + ' connect to nothing'); return to; },
      start(t) { log.starts++; if (!isFinite(t)) log.bad.push(kind + ' start ' + t); },
      stop(t) { log.stops++; if (!isFinite(t)) log.bad.push(kind + ' stop ' + t); }
    }, extra);
    const ctx = {
      currentTime: 0, sampleRate: 8000, created: log.created,
      createGain() { log.created.push('gain'); return node('gain', { gain: param('gain') }); },
      createOscillator() { log.created.push('osc'); return node('osc', { frequency: param('freq'), type: '' }); },
      createBiquadFilter() { log.created.push('filter'); return node('filter', { frequency: param('filterFreq'), Q: param('Q'), type: '' }); },
      createBufferSource() { log.created.push('source'); return node('source', { buffer: null, loop: false }); },
      createBuffer(ch, len, rate) { log.created.push('buffer'); const d = new Float32Array(len); return { getChannelData() { return d; }, length: len, sampleRate: rate }; }
    };
    return { ctx, log };
  }

  function checks() {
    const out = [], add = (name, ok, detail) => out.push({ name, ok: !!ok, detail: ok ? '' : (detail || '') });
    const api = load(), cues = api.cues;
    const L = api.limits;

    NEEDED.forEach(n => add('cue exists: ' + n, cues[n] && Array.isArray(cues[n].voices) && cues[n].voices.length > 0));
    add('no unexpected cue names', Object.keys(cues).every(n => NEEDED.indexOf(n) >= 0), Object.keys(cues).join(','));
    add('names list matches the cues', api.names.length === Object.keys(cues).length && api.names.every(n => cues[n]));

    NEEDED.forEach(n => {
      const c = cues[n]; if (!c) return;
      c.voices.forEach((v, i) => {
        const tag = n + ' voice ' + i;
        add(tag + ' is tone or noise', v.kind === 'tone' || v.kind === 'noise', v.kind);
        add(tag + ' has finite timing', isFinite(v.at) && v.at >= 0 && isFinite(v.dur) && v.dur > 0, v.at + '/' + v.dur);
        add(tag + ' gain is above 0 and no more than 0.5', v.gain > 0 && v.gain <= L.voiceGain, v.gain);
        if (v.kind === 'tone') {
          add(tag + ' wave is known', WAVES.indexOf(v.wave) >= 0, v.wave);
          const list = notesOf(v);
          add(tag + ' has a note', list.length > 0 && list.every(x => typeof x === 'string'));
          list.forEach(x => add(tag + ' note parses: ' + x, NOTE_RE.test(x) && api.hz(x) > 20 && api.hz(x) < 12000, x));
          if (v.to) add(tag + ' glide target parses: ' + v.to, NOTE_RE.test(v.to) && api.hz(v.to) > 20, v.to);
        } else {
          add(tag + ' has a known filter', v.filter && FILTERS.indexOf(v.filter.type) >= 0 && v.filter.freq > 20, JSON.stringify(v.filter));
          if (v.filter && v.filter.to) add(tag + ' filter sweep target is above 0', v.filter.to > 20);
        }
        if (v.lfo) add(tag + ' wobble is sensible', v.lfo.rate > 0 && v.lfo.rate < 60 && v.lfo.depth > 0, JSON.stringify(v.lfo));
      });
      add(n + ' duration matches its voices', Math.abs(c.duration - end(c)) < 0.011, c.duration + ' vs ' + end(c).toFixed(3));
      add(n + ' level matches the loudest sum of its voices', Math.abs(c.level - loudest(c)) < 0.011, c.level + ' vs ' + loudest(c).toFixed(3));
      add(n + ' sums to 1.0 or less', loudest(c) <= 1.0, loudest(c).toFixed(3));
    });

    const lim = (name, max) => add(name + ' is ' + max + ' s or shorter', cues[name] && cues[name].duration <= max, cues[name] && cues[name].duration);
    lim('touchdown', L.touchdown); lim('tackle', L.tackle); lim('catch', L.catch);
    lim('whistle', L.whistle); lim('kick', L.kick); lim('crowdSwell', L.swell);
    add('touchdown is long enough to be a fanfare (at least 1 s)', cues.touchdown && cues.touchdown.duration >= 1.0);
    add('touchdown uses at least 6 different notes', cues.touchdown && new Set([].concat.apply([], cues.touchdown.voices.map(notesOf))).size >= 6);
    add('crowdBed is a loop', cues.crowdBed && cues.crowdBed.loop === true);
    add('crowdBed level is 0.35 or less', cues.crowdBed && cues.crowdBed.level <= L.bedLevel, cues.crowdBed && cues.crowdBed.level);
    NEEDED.filter(n => n !== 'crowdBed').forEach(n => add(n + ' is not a loop', cues[n] && !cues[n].loop));

    // play() with a stand-in context: schedules everything, throws nothing, returns a handle.
    NEEDED.forEach(n => {
      const { ctx, log } = stubContext(), dest = { kind: 'dest' };
      let handle = null, err = null;
      try { handle = api.play(ctx, dest, n); if (handle) handle.stop(); } catch (e) { err = e; }
      add('play(' + n + ') throws nothing', !err, err && err.message);
      add('play(' + n + ') returns a handle with stop()', handle && typeof handle.stop === 'function' && handle.name === n && handle.duration === cues[n].duration);
      add('play(' + n + ') starts every source it makes', log.starts > 0 && log.starts === log.created.filter(k => k === 'osc' || k === 'source').length, log.starts);
      add('play(' + n + ') sends no non-finite number to the audio', log.bad.length === 0, log.bad.slice(0, 3).join('; '));
      add('play(' + n + ') connects into the node it was given', log.connects > 0);
    });
    {
      const { ctx } = stubContext();
      let r, err = null; try { r = [api.play(ctx, {}, 'nope'), api.play(null, {}, 'kick'), api.play(ctx, null, 'kick')]; } catch (e) { err = e; }
      add('play with an unknown name or missing context does nothing and throws nothing', !err && r.every(x => x === null), err && err.message);
    }

    // Source rules: no own AudioContext, no DOM, no samples, no network, no timers or clocks.
    if (fs) {
      const src = fs.readFileSync(SRC, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      const banned = [['new AudioContext', /new\s+(?:window\.)?(?:webkit)?(?:Offline)?AudioContext/], ['document', /\bdocument\b/], ['fetch/XHR', /\b(fetch|XMLHttpRequest)\b/], ['decodeAudioData', /decodeAudioData/],
        ['Audio element', /new\s+Audio\b/], ['localStorage', /localStorage|sessionStorage/], ['Math.random', /Math\.random/], ['timers', /\b(setTimeout|setInterval|requestAnimationFrame)\b/], ['imports', /\brequire\s*\(|\bimport\b/]];
      banned.forEach(b => add('sound-cues.js has no ' + b[0], !b[1].test(src)));
    }
    return out;
  }

  function run(log) {
    log = log || console.log;
    const results = checks(), bad = results.filter(r => !r.ok);
    results.forEach(r => log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? ' [' + r.detail + ']' : '')));
    log('\n' + (results.length - bad.length) + ' passed, ' + bad.length + ' failed');
    return bad.length === 0;
  }

  return { run, checks, stubContext, NEEDED };
});
