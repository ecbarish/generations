/* Lantern Bowl sound cues (LB-G4). Every sound is built live from oscillators and filtered noise: no samples, no
   recordings, no melody taken from a song or another game. The fanfare is an original phrase.
   Nothing here creates an AudioContext or touches the DOM, saves or clocks. The caller passes its own context and the
   node to play into:  LanternBowlCues.play(audioContext, destinationNode, 'touchdown').
   `play` returns { name, duration, loop, stop() } or null for an unknown name. A loop (the crowd bed) runs until stop():
   after its attack it holds its gain at the peak, schedules no release and no source stop, and stop() fades it out over
   LOOP_RELEASE (0.25 s) before stopping every source. A one-shot cue ends itself and its stop() cuts it at once.
   Notes are spelled like shared/sound.js ('C5', 'F#4'). Gains are 0..0.5 per voice, the range tone() uses there, and the
   voices that sound together add up to 1.0 or less before the caller's own master volume. `level` is that loudest sum.
   The notes of one chord share a voice's gain, so a 3-note chord at 0.07 adds 0.21.

   A cue is pure data: { duration, level, loop?, voices: [...] } where level is the loudest the voices add up to and a voice is
     { kind: 'tone',  wave, note | notes[], at, dur, gain, to? }       a pitch (to = a note to glide to), 'notes' = chord
     { kind: 'noise', at, dur, gain, filter: { type, freq, to?, q? } }  filtered noise, the filter may sweep to `to`
     optional shape: { attack, release } seconds, and 'lfo': { rate, depth } for a slow wobble (whistle, crowd) */
(function (root) {
  'use strict';

  var NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function hz(n) {
    var m = /^([A-G]#?)(\d)$/.exec(n);
    return m ? 440 * Math.pow(2, (NOTE[m[1]] + (Number(m[2]) + 1) * 12 - 69) / 12) : 0;
  }

  var LIMITS = {
    touchdown: 2.0, tackle: 0.2, catch: 0.2, whistle: 0.5, kick: 0.5, swell: 2.5, bedLevel: 0.35, voiceGain: 0.5, loopRelease: 0.25
  };
  var LOOP_RELEASE = LIMITS.loopRelease;

  var cues = {
    /* About 1.9 seconds: a quick climb from G4, a turn that dips and lifts, then a held chord under a bright top note.
       Written for square and triangle voices so it sounds like the arcade's family. */
    touchdown: {
      duration: 1.9, level: 0.67, voices: [
        { kind: 'tone', wave: 'square', note: 'G4', at: 0.00, dur: 0.11, gain: 0.26 },
        { kind: 'tone', wave: 'square', note: 'C5', at: 0.11, dur: 0.11, gain: 0.26 },
        { kind: 'tone', wave: 'square', note: 'E5', at: 0.22, dur: 0.11, gain: 0.26 },
        { kind: 'tone', wave: 'square', note: 'A5', at: 0.33, dur: 0.20, gain: 0.28 },
        { kind: 'tone', wave: 'square', note: 'G5', at: 0.55, dur: 0.11, gain: 0.26 },
        { kind: 'tone', wave: 'square', note: 'D5', at: 0.66, dur: 0.11, gain: 0.26 },
        { kind: 'tone', wave: 'square', note: 'B4', at: 0.77, dur: 0.11, gain: 0.26 },
        { kind: 'tone', wave: 'square', note: 'E5', at: 0.88, dur: 0.20, gain: 0.28 },
        { kind: 'tone', wave: 'triangle', notes: ['C4', 'G4'], at: 1.10, dur: 0.80, gain: 0.14 },
        { kind: 'tone', wave: 'square', notes: ['C5', 'E5', 'G5'], at: 1.10, dur: 0.80, gain: 0.07 },
        { kind: 'tone', wave: 'square', note: 'C6', at: 1.10, dur: 0.80, gain: 0.12, lfo: { rate: 6, depth: 0.012 } },
        { kind: 'noise', at: 1.10, dur: 0.30, gain: 0.06, filter: { type: 'highpass', freq: 5000 } }
      ]
    },
    /* A dull hit: a falling low sine under a short burst of low-passed noise. */
    tackle: {
      duration: 0.18, level: 0.75, voices: [
        { kind: 'tone', wave: 'sine', note: 'A2', to: 'A1', at: 0, dur: 0.18, gain: 0.45, attack: 0.002 },
        { kind: 'noise', at: 0, dur: 0.12, gain: 0.30, filter: { type: 'lowpass', freq: 700, to: 200 }, attack: 0.002 }
      ]
    },
    /* A quick bright pop: a rising triangle and a tick of high noise, like a ball landing in hands. */
    catch: {
      duration: 0.10, level: 0.57, voices: [
        { kind: 'tone', wave: 'triangle', note: 'D5', to: 'A5', at: 0, dur: 0.10, gain: 0.35, attack: 0.002 },
        { kind: 'noise', at: 0, dur: 0.05, gain: 0.22, filter: { type: 'highpass', freq: 3000 }, attack: 0.001 }
      ]
    },
    /* A steady murmur: band-passed noise that breathes slowly. A loop, so it plays until stop(). Its `dur` is the length of the
       noise buffer that repeats; the voice has no release, because stop() does the fade. */
    crowdBed: {
      duration: 4.0, level: 0.28, loop: true, voices: [
        { kind: 'noise', at: 0, dur: 4.0, gain: 0.22, filter: { type: 'bandpass', freq: 650, q: 0.6 }, lfo: { rate: 0.25, depth: 0.06 }, attack: 0.5 }
      ]
    },
    /* The crowd rising: the same noise opens up and gets louder, then falls away. */
    crowdSwell: {
      duration: 2.4, level: 0.35, voices: [
        { kind: 'noise', at: 0, dur: 2.4, gain: 0.35, filter: { type: 'bandpass', freq: 500, to: 1500, q: 0.7 }, attack: 1.1, release: 1.0 }
      ]
    },
    /* A referee's whistle: a high pitch with a fast wobble, plus a breath of noise. */
    whistle: {
      duration: 0.45, level: 0.35, voices: [
        { kind: 'tone', wave: 'sine', note: 'C#7', at: 0, dur: 0.45, gain: 0.28, attack: 0.01, release: 0.06, lfo: { rate: 32, depth: 0.04 } },
        { kind: 'noise', at: 0, dur: 0.45, gain: 0.07, filter: { type: 'bandpass', freq: 2800, q: 4 }, attack: 0.01, release: 0.06 }
      ]
    },
    /* A deep thump with a click on top, for the kick. */
    kick: {
      duration: 0.40, level: 0.75, voices: [
        { kind: 'tone', wave: 'sine', note: 'B2', to: 'E1', at: 0, dur: 0.40, gain: 0.5, attack: 0.002 },
        { kind: 'noise', at: 0, dur: 0.05, gain: 0.25, filter: { type: 'lowpass', freq: 1800 }, attack: 0.001 }
      ]
    },
    /* Three rising bell-like notes, bright and short. */
    firstDown: {
      duration: 0.70, level: 0.60, voices: [
        { kind: 'tone', wave: 'triangle', note: 'E5', at: 0.00, dur: 0.22, gain: 0.26 },
        { kind: 'tone', wave: 'triangle', note: 'A5', at: 0.14, dur: 0.22, gain: 0.26 },
        { kind: 'tone', wave: 'triangle', note: 'C#6', at: 0.28, dur: 0.42, gain: 0.26 },
        { kind: 'tone', wave: 'sine', note: 'C#7', at: 0.28, dur: 0.30, gain: 0.08 }
      ]
    },
    /* The ball goes the wrong way: a falling, slightly sour line over a low drop. */
    interception: {
      duration: 0.90, level: 0.50, voices: [
        { kind: 'tone', wave: 'saw', note: 'E5', at: 0.00, dur: 0.18, gain: 0.20 },
        { kind: 'tone', wave: 'saw', note: 'D#5', at: 0.18, dur: 0.18, gain: 0.20 },
        { kind: 'tone', wave: 'saw', note: 'B4', at: 0.36, dur: 0.18, gain: 0.20 },
        { kind: 'tone', wave: 'saw', note: 'F4', to: 'D4', at: 0.54, dur: 0.36, gain: 0.22 },
        { kind: 'tone', wave: 'sine', note: 'E2', to: 'B1', at: 0.54, dur: 0.36, gain: 0.28 }
      ]
    }
  };

  var WAVES = { sine: 'sine', square: 'square', triangle: 'triangle', saw: 'sawtooth' };
  var NAMES = Object.keys(cues);

  /* A small repeatable noise source, so the same cue sounds the same each time. */
  function noiseData(length, seed) {
    var out = new Float32Array(length), s = seed >>> 0 || 1;
    for (var i = 0; i < length; i++) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      out[i] = s / 2147483648 - 1;
    }
    return out;
  }

  function envelope(g, t0, dur, peak, attack, release) {
    var a = Math.min(attack == null ? 0.006 : attack, dur * 0.5), r = Math.min(release == null ? Math.min(0.06, dur * 0.5) : release, dur - a);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    if (dur - a - r > 0.001) g.gain.setValueAtTime(peak, t0 + dur - r);
    g.gain.linearRampToValueAtTime(0, t0 + dur);
  }

  /* A loop's gain: rise over the attack, then stay at the peak. Nothing is scheduled after that, so it cannot go quiet by itself. */
  function holdEnvelope(g, t0, peak, attack) {
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + (attack == null ? 0.006 : attack));
  }

  function play(ctx, dest, name) {
    var cue = cues[name];
    if (!cue || !ctx || !dest) return null;
    var t0 = ctx.currentTime || 0, sources = [], holds = [], wobbles = [], stopped = false;
    cue.voices.forEach(function (v, vi) {
      var g = ctx.createGain(), start = t0 + v.at, end = start + v.dur;
      if (cue.loop) {
        var attack = v.attack == null ? 0.006 : v.attack;
        holdEnvelope(g, start, v.gain, attack);
        holds.push({ g: g, start: start, peak: v.gain, attack: attack });
      } else envelope(g, start, v.dur, v.gain, v.attack, v.release);
      g.connect(dest);
      if (v.kind === 'noise') {
        var len = Math.max(1, Math.floor(ctx.sampleRate * (cue.loop ? v.dur : v.dur + 0.05)));
        var buf = ctx.createBuffer(1, len, ctx.sampleRate);
        buf.getChannelData(0).set(noiseData(len, 7 + vi * 101 + name.length));
        var src = ctx.createBufferSource(), f = ctx.createBiquadFilter();
        src.buffer = buf; src.loop = !!cue.loop;
        f.type = v.filter.type; f.frequency.setValueAtTime(v.filter.freq, start);
        if (v.filter.to && !cue.loop) f.frequency.exponentialRampToValueAtTime(v.filter.to, end);
        if (v.filter.q != null) f.Q.setValueAtTime(v.filter.q, start);
        src.connect(f); f.connect(g);
        if (v.lfo) wobble(ctx, g.gain, v, start, end, sources, cue.loop && wobbles);
        src.start(start); if (!cue.loop) src.stop(end);
        sources.push(src);
      } else {
        var list = v.notes || [v.note];
        list.forEach(function (n) {
          var osc = ctx.createOscillator();
          osc.type = WAVES[v.wave];
          osc.frequency.setValueAtTime(hz(n), start);
          if (v.to && !cue.loop) osc.frequency.exponentialRampToValueAtTime(hz(v.to), end);
          if (v.lfo) wobble(ctx, osc.frequency, { lfo: { rate: v.lfo.rate, depth: v.lfo.depth * hz(n) } }, start, end, sources, cue.loop && wobbles);
          osc.connect(g);
          osc.start(start); if (!cue.loop) osc.stop(end);
          sources.push(osc);
        });
      }
    });
    return {
      name: name, duration: cue.duration, loop: !!cue.loop,
      stop: function () {
        var now = ctx.currentTime || 0;
        if (!cue.loop) { sources.forEach(function (s) { try { s.stop(now); } catch (e) { /* already stopped */ } }); return; }
        if (stopped) return;          // a second stop() changes nothing
        stopped = true;
        var until = now + LOOP_RELEASE;
        holds.forEach(function (h) {
          // Where the gain is right now, so a stop() inside the attack fades from there and does not jump.
          var done = h.attack > 0 ? Math.min(1, Math.max(0, (now - h.start) / h.attack)) : 1;
          h.g.gain.cancelScheduledValues(now);
          h.g.gain.setValueAtTime(h.peak * done, now);
          h.g.gain.linearRampToValueAtTime(0, until);
        });
        // The wobble adds to the gain, so fade it too; otherwise it would still be swinging when the sources stop.
        wobbles.forEach(function (w) {
          w.g.gain.cancelScheduledValues(now);
          w.g.gain.setValueAtTime(w.depth, now);
          w.g.gain.linearRampToValueAtTime(0, until);
        });
        sources.forEach(function (s) { try { s.stop(until); } catch (e) { /* already stopped */ } });
      }
    };
  }

  /* A slow or fast wobble on a parameter: a low-frequency oscillator feeding it through a gain. */
  function wobble(ctx, param, v, start, end, sources, loopFades) {
    var lfo = ctx.createOscillator(), amount = ctx.createGain();
    lfo.type = 'sine'; lfo.frequency.setValueAtTime(v.lfo.rate, start);
    amount.gain.setValueAtTime(v.lfo.depth, start);
    lfo.connect(amount); amount.connect(param);
    lfo.start(start); if (!loopFades) lfo.stop(end);
    else loopFades.push({ g: amount, depth: v.lfo.depth });   // a loop's wobble is faded out by stop(), not stopped at `end`
    sources.push(lfo);
  }

  var api = { cues: cues, names: NAMES, limits: LIMITS, hz: hz, play: play };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LanternBowlCues = api;
})(typeof window === 'object' ? window : globalThis);
