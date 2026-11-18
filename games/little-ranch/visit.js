'use strict';
(function (root) {
  const PREF = 'little-ranch-settings-v1';
  const BEDTIME_ACTS = 12, BEDTIME_SECS = 360, BEDTIME_GRACE = 6, DUSK_SECS = 16;
  const ROUTINE = ['teeth', 'water', 'night'], ROUTINE_WAIT = 9;
  const YAWN_LEAD = 40, DAWN_SECS = 2.5, SUNSET_HOLD = .22;

  function blank() {
    return {
      t: 0, mode: 'play', dusk: 0, acts: 0, yawned: 0, bedtimeAt: null,
      lullabyAt: null, wake: 0, dawn: false, routine: null, shut: 0
    };
  }

  function loadPrefs(storage) {
    const prefs = { sound: true };
    try { Object.assign(prefs, JSON.parse(storage.getItem(PREF) || '{}')); } catch (e) {}
    return prefs;
  }

  function savePrefs(storage, prefs) {
    storage.setItem(PREF, JSON.stringify(prefs));
  }

  function toggleSound(prefs) {
    prefs.sound = !prefs.sound;
    return prefs;
  }

  function warn(st) {
    const k = (st.t - (BEDTIME_SECS - YAWN_LEAD)) / YAWN_LEAD;
    return k < 0 ? 0 : k > 1 ? 1 : k;
  }

  function lateness(st) {
    return st.mode === 'sleep' ? 0 : warn(st) * .34;
  }

  function clock(st, hold) {
    if (st.mode !== 'play') return null;
    if (st.t < BEDTIME_SECS) return null;
    if (!(st.acts >= BEDTIME_ACTS || st.t > BEDTIME_SECS)) return null;
    if (st.bedtimeAt === null) st.bedtimeAt = st.t;
    if (!hold || st.t - st.bedtimeAt >= BEDTIME_GRACE) return 'bedtime';
    return null;
  }

  function beginDusk(st, withRoutine) {
    if (st.mode !== 'play') return false;
    st.routine = withRoutine ? { step: 0, at: st.t, doing: null, said: {}, doneAt: null } : null;
    st.shut = 0;
    st.mode = 'dusk';
    return true;
  }

  function takeYawn(st, idle) {
    if (st.mode !== 'play' || st.yawned || !idle || warn(st) <= .55) return false;
    st.yawned = 1;
    return true;
  }

  function advanceDawn(st, dt) {
    if (!st.dawn) return;
    st.dusk = Math.max(0, st.dusk - dt / DAWN_SECS);
    if (st.dusk === 0) st.dawn = false;
  }

  function advanceDusk(st, dt, quiet, sleeping) {
    if (st.mode !== 'dusk') return [];
    const cap = st.routine && st.routine.step < 3 ? SUNSET_HOLD : 1;
    st.dusk = Math.min(cap, st.dusk + dt / DUSK_SECS);
    const cues = [];
    if (st.dusk > .25 && st.lullabyAt === null) { st.lullabyAt = st.t; cues.push('lullaby'); }
    if (st.dusk > .55 && quiet) cues.push('curl');
    if (st.dusk >= 1 && (sleeping || quiet)) cues.push('sleep');
    return cues;
  }

  function enterSleep(st) {
    if (st.mode !== 'dusk') return false;
    st.mode = 'sleep';
    return true;
  }

  function armDawn(st) {
    st.dusk = 1;
    st.dawn = true;
  }

  function noteWake(st, taps) {
    st.wake += 1;
    return st.wake >= taps;
  }

  function step(st, event) {
    if (event.type === 'dawn') { advanceDawn(st, event.dt); return null; }
    if (event.type === 'arm-dawn') { armDawn(st); return true; }
    if (event.type === 'wake') return noteWake(st, event.taps);
    switch (st.mode) {
      case 'play':
        if (event.type === 'clock') return clock(st, event.hold);
        if (event.type === 'yawn') return takeYawn(st, event.idle);
        if (event.type === 'begin-dusk') return beginDusk(st, event.routine);
        return null;
      case 'dusk':
        if (event.type === 'dusk') return advanceDusk(st, event.dt, event.quiet, event.sleeping);
        if (event.type === 'sleep') return enterSleep(st);
        return null;
      default:
        return null;
    }
  }

  root.LittleRanchVisit = {
    PREF, BEDTIME_ACTS, BEDTIME_SECS, BEDTIME_GRACE, DUSK_SECS, ROUTINE, ROUTINE_WAIT,
    blank, loadPrefs, savePrefs, toggleSound, lateness, step
  };
})(window);
