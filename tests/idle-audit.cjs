'use strict';

const assert = require('assert');
const path = require('path');
const { audit, selfTest } = require('../tools/idle-audit/saltmarsh.cjs');

selfTest();

const report = audit({
  root: path.resolve(__dirname, '..'),
  seconds: 150,
  label: 'contract',
  policies: ['greedy-cheapest', 'paced-desktop', 'idle-away']
});

assert.strictEqual(report.game, 'saltmarsh-shipping');
assert.strictEqual(report.sessions.length, 3);
assert.ok(Array.isArray(report.failures));
assert.ok(Array.isArray(report.mismatches));
assert.strictEqual(report.thresholds.idleWaitSec, 30);
assert.strictEqual(report.thresholds.awayReturnSec, 60);

for (const session of report.sessions) {
  assert.ok(session.seconds > 0, session.policy + ' ran');
  assert.ok(Object.prototype.hasOwnProperty.call(session, 'firstLight'));
  assert.ok(session.year1 && session.year1.how, session.policy + ' year 1');
  assert.ok(session.year2 && session.year2.how, session.policy + ' year 2');
  assert.ok(Array.isArray(session.idleWaits));
  assert.ok(Array.isArray(session.awayReturns));
  assert.ok(Array.isArray(session.owned) && session.owned.length === 4);
  session.idleWaits.forEach(function (row) {
    assert.ok(row.seconds > 30, 'idle wait stays over 30s');
    assert.strictEqual(typeof row.t, 'number');
    assert.ok(row.context, 'idle wait names its context');
  });
  session.mismatches.forEach(function (row) {
    assert.ok(row.text, 'mismatch keeps the copy');
    assert.ok(row.shown !== undefined, 'mismatch keeps the shown token');
    assert.ok(row.actual !== undefined, 'mismatch keeps the real value');
  });
}

const away = report.sessions.filter(session => session.policy === 'idle-away')[0];
assert.ok(away.awayReturns.length >= 1, 'the away player comes back at least once');
away.awayReturns.forEach(function (row) {
  assert.ok(row.awaySeconds >= 60, 'away returns are 60s or more');
  assert.strictEqual(typeof row.waiting, 'boolean');
  assert.ok(row.context, 'away return names what the desk was doing');
});

const greedy = report.sessions.filter(session => session.policy === 'greedy-cheapest')[0];
assert.ok(greedy.owned[0] > 0, 'greedy play ties up a rowboat');
assert.strictEqual(greedy.awayReturns.length, 0);

console.log('PASS idle-audit contract: ' + report.sessions.map(session => session.policy + ' ' + session.seconds + 's').join(', '));
