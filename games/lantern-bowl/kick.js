/* Lantern Bowl two-tap kick rules (LB-G5). Headless: no DOM, timers, audio, storage or clock.
   The player taps twice on a sweeping needle. The first tap sets POWER, the second sets AIM. The kicker's rating sets how
   fast the needle sweeps and how steadily it moves, and how much the kick itself wobbles. There is no automatic aim.
   Nothing in the game uses this file yet; field goals and punts on fourth down stay in model.js.

   needleAt(seconds, kickRating, phase)  the needle's position from 0 to 1, `seconds` after the sweep started.
       It runs 0 to 1 and back again. `phase` (0 to 1, default 0) is where in the sweep it starts. A low rating sweeps fast and
       shakes a little; a high rating sweeps slowly and smoothly. The result is the same every time for the same inputs.
   resolve({ powerTap, aimTap, distanceYards, kickRating, rng })  decides the kick and returns { good, reason }.
       powerTap and aimTap are the needle positions (0 to 1) at the first and second tap. Aim 0.5 is dead centre.
       reason is 'good', 'short', 'wide left' or 'wide right'. Randomness comes only from `rng`, a function that returns
       a number from 0 up to (not including) 1, such as the game's seeded dice. resolve calls it exactly six times every time,
       whatever happens, so the seeded game stays in step.
   idealPowerTap(distanceYards, kickRating)  the power tap that just clears a distance with a small margin, for tests and hints.
   Ratings run 35 to 90 (Evan's approved range) and are clamped into it. */
(function (root) {
  'use strict';

  var MIN_RATING = 35, MAX_RATING = 90;
  var REASONS = ['good', 'short', 'wide left', 'wide right'];

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function skill(rating) { return (clamp(rating, MIN_RATING, MAX_RATING) - MIN_RATING) / (MAX_RATING - MIN_RATING); }   // 0 to 1
  function lerp(a, b, t) { return a + (b - a) * t; }
  function finite(v, name) {
    if (typeof v !== 'number' || !isFinite(v)) throw new TypeError('LanternBowlKick: ' + name + ' must be a finite number');
    return v;
  }

  /* Seconds for the needle to go from 0 to 1 and back. */
  function sweepSeconds(rating) { return lerp(0.9, 2.2, skill(rating)); }
  /* How far the needle shakes off its straight line (0 to 1 scale). */
  function shake(rating) { return lerp(0.05, 0, skill(rating)); }

  function needleAt(seconds, kickRating, phase) {
    finite(seconds, 'seconds'); finite(kickRating, 'kickRating');
    var ph = phase === undefined ? 0 : finite(phase, 'phase');
    var u = seconds / sweepSeconds(kickRating) + ph;
    u -= Math.floor(u);                                   // where we are in this sweep, 0 up to 1
    var pos = u < 0.5 ? u * 2 : 2 - u * 2;                // out and back
    pos += shake(kickRating) * Math.sin(seconds * 19.3 + ph * 6.2832) * Math.sin(seconds * 7.1 + 0.9);
    return clamp(pos, 0, 1);
  }

  /* The farthest this kicker can send it with a full-power tap. */
  function reach(rating) { return lerp(55, 71.5, skill(rating)); }
  function idealPowerTap(distanceYards, kickRating) {
    finite(distanceYards, 'distanceYards'); finite(kickRating, 'kickRating');
    return clamp(distanceYards / reach(kickRating) + 0.06, 0, 1);
  }

  /* A bell-shaped nudge with an average of 0 and a spread of about 1, using three draws. */
  function nudge(rng) { return (rng() + rng() + rng() - 1.5) * 2; }

  function resolve(opts) {
    if (!opts || typeof opts !== 'object') throw new TypeError('LanternBowlKick: resolve needs an options object');
    if (typeof opts.rng !== 'function') throw new TypeError('LanternBowlKick: rng must be a function');
    var power = clamp(finite(opts.powerTap, 'powerTap'), 0, 1), aim = clamp(finite(opts.aimTap, 'aimTap'), 0, 1);
    var dist = finite(opts.distanceYards, 'distanceYards'), s = skill(finite(opts.kickRating, 'kickRating'));
    var rating = clamp(opts.kickRating, MIN_RATING, MAX_RATING);
    // Always six draws, in this order, so the same seed gives the same game.
    var powerNoise = nudge(opts.rng) * lerp(0.04, 0.01, s);
    var aimNoise = nudge(opts.rng) * lerp(0.05, 0.02, s) * (0.5 + dist / 40);

    var ideal = idealPowerTap(dist, rating);
    var carried = power + powerNoise;                      // how much of the kick's power really arrives
    var over = Math.max(0, power - ideal);                 // hitting it harder than needed costs accuracy
    var half = lerp(0.09, 0.15, s) * clamp(1.6 - dist / 45, 0.35, 1.6) * (1 - 0.9 * over);   // half-width of the goal in aim
    var drift = aim + aimNoise - 0.5;

    var reason;
    if (carried < dist / reach(rating)) reason = 'short';
    else if (drift < -half) reason = 'wide left';
    else if (drift > half) reason = 'wide right';
    else reason = 'good';
    return { good: reason === 'good', reason: reason };
  }

  var api = { needleAt: needleAt, resolve: resolve, idealPowerTap: idealPowerTap, sweepSeconds: sweepSeconds, REASONS: REASONS, MIN_RATING: MIN_RATING, MAX_RATING: MAX_RATING };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LanternBowlKick = api;
})(typeof window === 'object' ? window : globalThis);
