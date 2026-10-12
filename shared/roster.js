/* Shared roster and jobs for Generations games (S3, 2026-10-08). Members you aren't playing take jobs; each job
   pays whole units on a timer, like IdleOn's AFK characters but with no daily chores: a job keeps running until you
   change it, and everything comes back in one report.

   Earnings come only from timestamps, so the same stretch of time pays the same whether you were playing, away, or
   on another character, and loading an old save can't pay twice (the job's clock is saved with the reward).
   Time away is capped like rested XP: a job stops earning after `capHours` without being collected.

   const R = Roster.create({
     get: () => state,             the game's saved object; Roster keeps { jobs: { [who]: { job, since } } } in it
     jobs: { id: { name, every(who) seconds per unit, give(who, units) } },
     slots: () => n,               how many members may work at once
     canWork(who),                 optional: false for the member being played, for example
     capHours: 8                   optional
   });
   R.assign(who, job, now?), R.stop(who, now?)   start or stop a job (stopping pays what's earned first)
   R.collect(now?)                               pay every job; returns [{ who, job, units }] for the report
   R.jobOf(who), R.busy(), R.free()              what someone is doing, how many slots are used / left
   R.nextIn(who, now?)                           seconds until their next unit
   R.forget(who)                                 drop a member who no longer exists (nothing is paid)
   Members are keyed by String(who): pass numbers or strings, jobs and reports always use the string form.   */
(function () {
  'use strict';
  function create(o) {
    var capMs = (o.capHours || 8) * 3600 * 1000;
    function st() { var s = o.get(); if (!s.jobs || typeof s.jobs !== 'object') s.jobs = {}; return s; }
    function clock(now) { return typeof now === 'number' ? now : Date.now(); }
    function job(id) { return o.jobs[id] || null; }
    /* pay one member up to `now`; the clock keeps any part-finished unit */
    function settle(who, now) {
      who = String(who);
      var a = st().jobs[who], j = a && job(a.job); if (!j) return 0;
      var every = Math.max(1, j.every(who)) * 1000, since = Math.min(a.since, now), gap = now - since;
      var worked = Math.min(gap, capMs), units = Math.floor(worked / every);
      /* past the cap the job sits idle, so the clock jumps forward to now minus the unfinished part */
      a.since = gap > capMs ? now - (worked - units * every) : since + units * every;
      if (units > 0) j.give(who, units);
      return units;
    }
    function collect(now) {
      now = clock(now); var out = [], jobs = st().jobs;
      Object.keys(jobs).forEach(function (who) { var u = settle(who, now); if (u) out.push({ who: who, job: jobs[who].job, units: u }); });
      return out;
    }
    function busy() { return Object.keys(st().jobs).length; }
    function free() { return Math.max(0, o.slots() - busy()); }
    function assign(who, id, now) {
      who = String(who);
      now = clock(now); var s = st();
      if (!job(id) || (o.canWork && !o.canWork(who))) return false;
      if (s.jobs[who]) { if (s.jobs[who].job === id) return true; settle(who, now); }
      else if (!free()) return false;
      s.jobs[who] = { job: id, since: now }; return true;
    }
    function stop(who, now) { who = String(who); var s = st(); if (!s.jobs[who]) return 0; var u = settle(who, clock(now)); delete s.jobs[who]; return u; }
    function forget(who) { delete st().jobs[String(who)]; }
    function jobOf(who) { var a = st().jobs[who]; return a ? a.job : null; }
    function nextIn(who, now) {
      var a = st().jobs[who], j = a && job(a.job); if (!j) return 0;
      var every = Math.max(1, j.every(who)) * 1000, gap = clock(now) - a.since;
      return gap >= capMs ? Infinity : Math.max(0, Math.ceil((every - gap % every) / 1000));
    }
    return { assign: assign, stop: stop, collect: collect, jobOf: jobOf, busy: busy, free: free, nextIn: nextIn, forget: forget, settle: settle };
  }
  window.Roster = { create: create };
})();
