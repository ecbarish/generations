/* Shared chiptune sound for Generations games (S2, 2026-10-08). Everything is made live with Web Audio, no audio files.
   One sound family for the arcade: the same instruments, effects and mixing in every game, each with its own tunes.

   Tracks are note strings, one 8th note per token, '.' = rest: { bpm, mel, bass, drum?, lead?, shift?, echo? }
     mel/bass  notes like 'A4', 'C#5'; bass plays on a soft triangle
     drum      optional, 'k' kick, 's' snare, 'h' hi-hat, '.' rest (any length; it loops on its own)
     lead      'square' (default), 'pulse' (thinner, 25%), 'triangle' (soft, flute-like) or 'saw'
     shift     transpose in semitones; echo: false to keep the lead dry
   Moving between tracks crossfades instead of cutting. Music and effects have their own volume.

   const SFX = ArcadeSound.create({
     tracks,            { key: track }
     voices,            optional { speaker: pitch in Hz } for dialogue blips
     mode, setMode,     read/write the game's sound setting: 0 off, 1 effects, 2 effects + music
     musicKey(),        which track should play right now (or null for silence)
     rain()             optional: current rain strength 0..1 (quiet ambience in either sound-on mode)
     button             optional: the element that shows and cycles the setting
   });
   SFX.sfx(name, arg)   any effect below; safe to call any time (silent when sound is off); 'blip' takes a speaker or a pitch in Hz
   SFX.cycle(), SFX.render(), SFX.dispose() (release a player when removing it)                                                                              */
(function () {
  'use strict';
  var NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function hz(n, shift) { var m = /^([A-G]#?)(\d)$/.exec(n); return m ? 440 * Math.pow(2, (NOTE[m[1]] + (shift || 0) + (Number(m[2]) + 1) * 12 - 69) / 12) : 0; }
  var MUSIC_VOL = 0.9, SFX_VOL = 1, MASTER = 0.14;

  function create(o) {
    var A = { ac: null, master: null, music: null, fx: null, echo: null, pulse: null, noiseBuf: null, next: 0, step: 0, track: null, switching: 0, rain: null };
    var disposed = false;
    var tracks = {};
    Object.keys(o.tracks || {}).forEach(function (k) {
      var t = o.tracks[k], sp = function (s) { return s ? s.split(' ') : []; };
      tracks[k] = { bpm: t.bpm, shift: t.shift || 0, lead: t.lead || 'square', echo: t.echo !== false, mel: sp(t.mel), bass: sp(t.bass), drum: t.drum ? t.drum.split(/\s+/) : [] };
    });
    var mode = function () { return o.mode() || 0; };

    function audio() {
      if (disposed) return null;
      if (!A.ac) {
        try {
          var ac = A.ac = new (window.AudioContext || window.webkitAudioContext)();
          A.master = ac.createGain(); A.master.gain.value = MASTER; A.master.connect(ac.destination);
          A.music = ac.createGain(); A.music.gain.value = MUSIC_VOL; A.music.connect(A.master);
          A.fx = ac.createGain(); A.fx.gain.value = SFX_VOL; A.fx.connect(A.master);
          /* a light echo gives the lead some room */
          var d = ac.createDelay(1), fb = ac.createGain(), wet = ac.createGain(); d.delayTime.value = 0.21; fb.gain.value = 0.28; wet.gain.value = 0.3;
          d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(A.music); A.echo = d;
          /* a 25% pulse wave, the thinner classic handheld lead */
          var n = 32, re = new Float32Array(n), im = new Float32Array(n);
          for (var i = 1; i < n; i++) im[i] = 2 / (i * Math.PI) * Math.sin(i * Math.PI * 0.25);
          A.pulse = ac.createPeriodicWave(re, im);
          /* one second of white noise, reused by every drum and hit */
          var len = ac.sampleRate, buf = A.noiseBuf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
          for (var j = 0; j < len; j++) ch[j] = Math.random() * 2 - 1;
        } catch (e) { A.ac = null; return null; }
      }
      if (A.ac.state === 'suspended') A.ac.resume();
      return A.ac;
    }
    /* One filtered noise loop, below the tunes and effects. No context is created by the scheduler.
       Dry weather fades the loop to silence; off/hidden/disposed releases it immediately. */
    function stopRain() {
      if (!A.rain) return;
      A.rain.gain.gain.cancelScheduledValues(A.ac.currentTime); A.rain.gain.gain.setValueAtTime(0, A.ac.currentTime);
      A.rain.source.stop(); A.rain.source.disconnect(); A.rain.high.disconnect(); A.rain.low.disconnect(); A.rain.gain.disconnect();
      A.rain = null;
    }
    function syncRain() {
      if (disposed || !mode() || document.hidden || !A.ac || A.ac.state !== 'running') { stopRain(); return; }
      var level = o.rain ? Number(o.rain()) : 0;
      level = isFinite(level) ? Math.max(0, Math.min(1, level)) : 0;
      if (!A.rain && level > 0) {
        var ac = A.ac, source = ac.createBufferSource(), high = ac.createBiquadFilter(), low = ac.createBiquadFilter(), gain = ac.createGain();
        source.buffer = A.noiseBuf; source.loop = true;
        high.type = 'highpass'; high.frequency.value = 400; low.type = 'lowpass'; low.frequency.value = 2500;
        gain.gain.value = 0; source.connect(high); high.connect(low); low.connect(gain); gain.connect(A.master);
        A.rain = { source: source, high: high, low: low, gain: gain, level: -1 }; source.start();
      }
      if (A.rain && level !== A.rain.level) {
        A.rain.gain.gain.setTargetAtTime(level * .35, A.ac.currentTime, .35); A.rain.level = level;
      }
    }
    function dispose() {
      if (disposed) return; disposed = true;
      clearInterval(timer); document.removeEventListener('visibilitychange', syncRain); stopRain();
      if (A.ac && A.ac.state !== 'closed') { var closing = A.ac.close(); if (closing && closing.catch) closing.catch(function () {}); }
    }
    function tone(f, dur, type, at, vol, slide, bus, echo) {
      var ac = A.ac, osc = ac.createOscillator(), g = ac.createGain(), t = at || ac.currentTime;
      if (type === 'pulse') osc.setPeriodicWave(A.pulse); else osc.type = type === 'saw' ? 'sawtooth' : (type || 'square');
      osc.frequency.setValueAtTime(f, t); if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(bus || A.fx); if (echo) g.connect(A.echo); osc.start(t); osc.stop(t + dur + 0.02);
    }
    function noise(dur, at, vol, bus, highpass) {
      var ac = A.ac, s = ac.createBufferSource(), g = ac.createGain(), t = at || ac.currentTime;
      s.buffer = A.noiseBuf; g.gain.setValueAtTime(vol || 0.4, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      var last = g;
      if (highpass) { var f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = highpass; s.connect(f); f.connect(g); } else s.connect(g);
      last.connect(bus || A.fx); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    }
    function drum(k, t) {
      if (k === 'k') tone(150, 0.14, 'sine', t, 0.55, 0.28, A.music);
      else if (k === 's') { noise(0.11, t, 0.22, A.music, 900); tone(190, 0.06, 'triangle', t, 0.12, 0.6, A.music); }
      else if (k === 'h') noise(0.035, t, 0.07, A.music, 6000);
    }

    /* the shared effects: same sounds in every game, so the arcade feels like one family */
    function sfx(name, arg) {
      if (!mode() || document.hidden || !audio()) return;
      var t = A.ac.currentTime, arp = function (ns, d, ty, v) { ns.forEach(function (n, i) { tone(hz(n), d, ty || 'square', t + i * d, v || 0.35); }); };
      switch (name) {
        case 'blip': tone((typeof arg === 'number' ? arg : (o.voices && o.voices[arg]) || 440) * (0.95 + Math.random() * 0.1), 0.04, 'square', t, 0.12); break;
        case 'select': tone(880, 0.05, 'square', t, 0.15); break;
        case 'hit': noise(0.08, t, 0.35); tone(180, 0.08, 'square', t, 0.25, 0.5); break;
        case 'crit': noise(0.16, t, 0.5); tone(240, 0.16, 'sawtooth', t, 0.35, 0.3); break;
        case 'faint': tone(520, 0.45, 'triangle', t, 0.4, 0.2); break;
        case 'heal': arp(['C5', 'E5', 'G5', 'C6'], 0.06, 'triangle'); break;
        case 'warn': tone(330, 0.1, 'square', t, 0.25); tone(330, 0.1, 'square', t + 0.14, 0.25); break;
        case 'catch': arp(['G5', 'C6', 'E6', 'G6', 'C7'], 0.07); break;
        case 'miss': tone(300, 0.2, 'square', t, 0.25, 0.6); break;
        case 'win': arp(['C5', 'E5', 'G5', 'C6', 'G5', 'C6'], 0.09); break;
        case 'lose': arp(['E4', 'D#4', 'D4', 'C#4'], 0.16, 'triangle'); break;
        case 'level': arp(['C5', 'G5', 'C6', 'E6'], 0.08); break;
        case 'badge': arp(['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7'], 0.11); break;
        case 'quest': arp(['G4', 'C5', 'E5', 'G5', 'C6'], 0.08, 'pulse', 0.3); break;
        case 'coin': tone(988, 0.06, 'square', t, 0.18); tone(1319, 0.14, 'square', t + 0.06, 0.18); break;
        case 'loot': arp(['E5', 'G#5', 'B5', 'E6'], 0.06, 'pulse', 0.28); break;
        case 'dodge': noise(0.12, t, 0.18, null, 2500); tone(600, 0.1, 'triangle', t, 0.15, 1.6); break;
        case 'thunder': { /* a crack, then a long low rumble; arg 0..1 is how close the strike was */
          const v = typeof arg === 'number' ? arg : .7, ac = A.ac, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
          s.buffer = A.noiseBuf; s.loop = true; f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(140, t + 1.2);
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.9 * v, t + .04); g.gain.exponentialRampToValueAtTime(.35 * v, t + .5);
          g.gain.linearRampToValueAtTime(.45 * v, t + .9); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
          s.connect(f); f.connect(g); g.connect(A.fx); s.start(t, Math.random() * .4); s.stop(t + 2.7);
          tone(55, 1.8, 'sine', t + .05, .3 * v, .6); break; }
      }
    }

    /* the look-ahead sequencer, with a short crossfade whenever the track changes */
    var timer = setInterval(function () {
      syncRain();
      if (mode() < 2 || document.hidden || !A.ac || A.ac.state !== 'running') { A.track = null; return; }
      var ac = A.ac, now = ac.currentTime, k = o.musicKey(); if (k && !tracks[k]) k = null;
      if (k !== A.track && !A.switching) {
        if (A.track) { A.music.gain.cancelScheduledValues(now); A.music.gain.setValueAtTime(A.music.gain.value, now); A.music.gain.linearRampToValueAtTime(0.0001, now + 0.45); A.switching = now + 0.45; }
        else { A.track = k; A.step = 0; A.next = now + 0.1; A.music.gain.setValueAtTime(MUSIC_VOL, now); }
      }
      if (A.switching && now >= A.switching) {
        A.switching = 0; A.track = k; A.step = 0; A.next = now + 0.05;
        A.music.gain.cancelScheduledValues(now); A.music.gain.setValueAtTime(0.0001, now); A.music.gain.linearRampToValueAtTime(MUSIC_VOL, now + 0.6);
      }
      var tr = tracks[A.track]; if (!tr || A.switching) return;
      var len = 60 / tr.bpm / 2;
      while (A.next < now + 0.25) {
        var m = tr.mel[A.step % tr.mel.length], b = tr.bass[A.step % tr.bass.length], d = tr.drum.length ? tr.drum[A.step % tr.drum.length] : '.';
        if (m && m !== '.') tone(hz(m, tr.shift), len * 0.9, tr.lead, A.next, tr.lead === 'triangle' ? 0.16 : 0.09, null, A.music, tr.echo);
        if (b && b !== '.') tone(hz(b, tr.shift), len * 0.95, 'triangle', A.next, 0.22, null, A.music);
        if (d && d !== '.') drum(d, A.next);
        A.step++; A.next += len;
      }
    }, 60);

    document.addEventListener('visibilitychange', syncRain);

    function render() {
      syncRain();
      var b = o.button && o.button(); if (!b) return;
      b.textContent = ['Sound: off', 'Sound: effects', 'Sound: effects + music'][mode()]; b.setAttribute('aria-pressed', mode() ? 'true' : 'false');
    }
    function cycle() { o.setMode((mode() + 1) % 3); if (mode()) { audio(); sfx('select'); } render(); }
    return { sfx: sfx, cycle: cycle, render: render, dispose: dispose, hz: hz, tracks: tracks };
  }
  window.ArcadeSound = { create: create, hz: hz };
})();
