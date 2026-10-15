/* Checks for games/lantern-bowl/sound-cues.js (LB-G4, loop fix LB-G9). Plain Node, no packages:  node tests/lantern-bowl-sound-cues.cjs
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
        cancelScheduledValues(...a) { chk('cancelScheduledValues', a); },
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

  /* A stand-in that writes down every call play() makes, in order, with the time each call was given. Used to prove what a cue
     schedules and when. `at` is the clock the context reports, which a check can move forward. */
  function recorder() {
    const ev = []; let id = 0;
    const f = n => (typeof n === 'number' ? Math.round(n * 1e6) / 1e6 : String(n));
    const mkParam = (nid, label) => {
      const p = {};
      ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'cancelScheduledValues'].forEach(m => {
        p[m] = (...a) => { ev.push({ node: nid, param: label, call: m, args: a, text: nid + '.' + label + '.' + m + '(' + a.map(f).join(',') + ')' }); return p; };
      });
      return p;
    };
    const node = (kind) => {
      const nid = kind + (id++); ev.push({ node: nid, call: 'create', args: [], text: 'create ' + nid });
      return {
        nid, connect(to) { ev.push({ node: nid, call: 'connect', args: [], text: nid + '.connect(' + ((to && to.nid) || 'dest') + ')' }); return to; },
        start(t) { ev.push({ node: nid, call: 'start', args: [t], text: nid + '.start(' + f(t) + ')' }); },
        stop(t) { ev.push({ node: nid, call: 'stop', args: [t], text: nid + '.stop(' + f(t) + ')' }); }
      };
    };
    const ctx = {
      currentTime: 0, sampleRate: 8000,
      createGain() { const n = node('gain'); n.gain = mkParam(n.nid, 'gain'); return n; },
      createOscillator() { const n = node('osc'); n.frequency = mkParam(n.nid, 'freq'); return n; },
      createBiquadFilter() { const n = node('filter'); n.frequency = mkParam(n.nid, 'ffreq'); n.Q = mkParam(n.nid, 'Q'); return n; },
      createBufferSource() { return node('src'); },
      createBuffer(ch, len) { ev.push({ call: 'buffer', args: [len], text: 'buffer ' + len }); const d = new Float32Array(len); return { getChannelData() { return d; } }; }
    };
    return { ctx, ev };
  }
  function fingerprint(ev) {
    const s = ev.map(e => e.text).join('\n'); let x = 2166136261;
    for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; }
    return x.toString(16) + ':' + ev.length;
  }
  /* Taken from sound-cues.js as it was on main before LB-G9 (play at time 0, stop at 0.05 s). A one-shot cue's schedule must not move. */
  const ONE_SHOT_BEFORE = {
    touchdown: 'c6690fbb:174', tackle: '955ff4cd:29', catch: '8023faa8:28', crowdSwell: 'ae9dfd1d:17',
    whistle: '3ce8d4b1:37', kick: '82c7663e:28', firstDown: '50fc57de:48', interception: 'd2a77f01:62'
  };

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


    // LB-G9: a loop cue holds its volume until stop(), then fades out.
    {
      const bed = cues.crowdBed, peak = bed.voices[0].gain, attack = bed.voices[0].attack;
      add('crowdBed voices have no release of their own (stop() does the fade)', bed.voices.every(v => v.release === undefined));
      add('the loop release is 0.25 s and under the 0.3 s the row allows', L.loopRelease === 0.25 && L.loopRelease <= 0.3, L.loopRelease);
      const isZeroRamp = e => e.call === 'linearRampToValueAtTime' && e.args[0] === 0;

      // 30 seconds later and stop() never called: nothing ramped to 0, nothing stopped, and the gain was only ever raised to its peak.
      let r = recorder(), h = api.play(r.ctx, { nid: 'dest' }, 'crowdBed'); r.ctx.currentTime = 30;
      add('crowdBed schedules no ramp to 0 before stop()', !r.ev.some(isZeroRamp), r.ev.filter(isZeroRamp).map(e => e.text).join('; '));
      add('crowdBed schedules no source stop before stop() (sources and the wobble run on)', !r.ev.some(e => e.call === 'stop'), r.ev.filter(e => e.call === 'stop').map(e => e.text).join('; '));
      const gainSets = r.ev.filter(e => e.param === 'gain' && e.node === 'gain0');   // the voice's own gain, not the wobble's
      add('crowdBed gain is raised once to its peak and then held (no later gain event)',
        gainSets.length === 2 && gainSets[0].call === 'setValueAtTime' && gainSets[0].args[0] === 0 && gainSets[1].call === 'linearRampToValueAtTime' && gainSets[1].args[0] === peak && gainSets[1].args[1] === attack,
        gainSets.map(e => e.text).join('; '));
      add('crowdBed noise buffer is set to loop', (function () { const q = recorder(); let src = null, orig = q.ctx.createBufferSource; q.ctx.createBufferSource = function () { src = orig(); return src; }; api.play(q.ctx, { nid: 'd' }, 'crowdBed'); return !!src && src.loop === true; })());
      const beforeStop = r.ev.length;

      r.ctx.currentTime = 30; h.stop();
      const after = r.ev.slice(beforeStop), stops = after.filter(e => e.call === 'stop');
      const sourceNodes = r.ev.filter(e => e.call === 'create' && /^(osc|src)/.test(e.node)).map(e => e.node);
      add('after stop() every source (noise and wobble) is stopped', sourceNodes.length >= 2 && sourceNodes.every(n => stops.some(e => e.node === n)), sourceNodes.join());
      add('every source is stopped no sooner than now and within 0.3 s', stops.every(e => e.args[0] >= 30 && e.args[0] <= 30.3), stops.map(e => e.text).join('; '));
      const fade = after.filter(isZeroRamp);
      add('after stop() the gain ramps to 0 within 0.3 s', fade.length === 1 && fade[0].args[1] > 30 && fade[0].args[1] <= 30.3, fade.map(e => e.text).join('; '));
      add('stop() cancels the old plan and starts the fade from the held peak', after.some(e => e.call === 'cancelScheduledValues' && e.args[0] === 30) && after.some(e => e.call === 'setValueAtTime' && e.args[0] === peak && e.args[1] === 30));
      add('the fade finishes no later than the sources stop', fade.length === 1 && stops.every(e => e.args[0] >= fade[0].args[1]));
      const n1 = r.ev.length; h.stop();
      add('a second stop() schedules nothing more', r.ev.length === n1);

      // stop() while the attack is still rising fades from where the gain is, not from the peak.
      r = recorder(); h = api.play(r.ctx, { nid: 'dest' }, 'crowdBed'); r.ctx.currentTime = attack / 2; const mark = r.ev.length; h.stop();
      const start = r.ev.slice(mark).filter(e => e.call === 'setValueAtTime' && e.param === 'gain')[0];
      add('stop() halfway through the attack starts the fade from half the peak', start && Math.abs(start.args[0] - peak / 2) < 1e-9, start && start.text);
      // stop() before the loop has started (a cue played ahead of the clock) cannot go negative.
      r = recorder(); r.ctx.currentTime = 5; h = api.play(r.ctx, { nid: 'dest' }, 'crowdBed'); r.ctx.currentTime = 4; h.stop();
      const early = r.ev.filter(e => e.call === 'setValueAtTime' && e.param === 'gain' && e.args[1] === 4)[0];
      add('stop() before the start time fades from 0, never from a negative gain', early && early.args[0] === 0, early && early.text);
      add('a loop cue made on the fly with a release would still not schedule it (release is ignored on a loop)', (function () {
        const saved = bed.voices[0].release; bed.voices[0].release = 0.5;
        const q = recorder(); api.play(q.ctx, { nid: 'd' }, 'crowdBed'); bed.voices[0].release = saved;
        return !q.ev.some(isZeroRamp);
      })());

      // Every one-shot cue still schedules exactly what it did before this row (same calls, same times, same order).
      Object.keys(ONE_SHOT_BEFORE).forEach(n => {
        const q = recorder(), hh = api.play(q.ctx, { nid: 'dest' }, n); q.ctx.currentTime = 0.05; hh.stop();
        add('one-shot ' + n + ' schedules exactly what it did before', fingerprint(q.ev) === ONE_SHOT_BEFORE[n], fingerprint(q.ev) + ' vs ' + ONE_SHOT_BEFORE[n]);
        add('one-shot ' + n + ' still ends itself (a ramp to 0 and a stop for every source)', q.ev.some(isZeroRamp) && q.ev.filter(e => e.call === 'stop').length >= q.ev.filter(e => e.call === 'start').length);
      });
      add('every one-shot cue is covered by the before-fingerprints', NEEDED.filter(n => !cues[n].loop).every(n => ONE_SHOT_BEFORE[n]));
      // Through the old stand-in too: a loop's play() and stop() send only finite numbers.
      const s2 = stubContext(); const h2 = api.play(s2.ctx, {}, 'crowdBed'); s2.ctx.currentTime = 12; h2.stop();
      add('a crowdBed play and stop send no non-finite number to the audio', s2.log.bad.length === 0, s2.log.bad.join('; '));
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

  return { run, checks, stubContext, recorder, NEEDED };
});
