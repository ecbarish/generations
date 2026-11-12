'use strict';

const fs = require('fs');
const path = require('path');
const { audit, selfTest } = require('./saltmarsh.cjs');

function clock(sec) {
  if (sec == null) return 'not reached';
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor(sec % 3600 / 60);
  const s = sec % 60;
  if (h) return h + 'h ' + m + 'm ' + s + 's (' + sec + 's)';
  if (m) return m + 'm ' + s + 's (' + sec + 's)';
  return s + 's';
}

function markdown(report) {
  const lines = [];
  lines.push('# Saltmarsh Shipping Office new-player audit');
  lines.push('');
  lines.push('Source: ' + report.source + '.');
  lines.push(report.ok
    ? 'Pass. Every away return of 60s or more had something to buy or claim, and every checked number matched the state or the charge.'
    : 'Fail. An away return or a displayed number broke the bar.');
  lines.push('Idle waits over 30s are listed in full. They stay in the report either way.');
  lines.push('');
  if (report.failures.length) {
    lines.push('## Failures');
    lines.push('');
    report.failures.forEach(row => lines.push('- ' + row));
    lines.push('');
  }
  report.sessions.forEach(function (session) {
    lines.push('## ' + session.policy);
    lines.push('');
    const names = ['rowboats', 'sloops', 'schooners', 'barks'];
    const owned = (session.owned || []).map((n, i) => names[i] + ' ' + n).join(', ');
    lines.push('The sitting ran ' + clock(session.seconds) + '. Boats: ' + owned + '. Cash ' + (session.cashText || session.cash) + '.');
    lines.push('First light: ' + (session.firstLight
      ? session.firstLight.name + ' at ' + clock(session.firstLight.t) + '. ' + session.firstLight.how
      : 'not reached.'));
    lines.push('Year 1 ended: ' + (session.year1.endedAt == null
      ? session.year1.how
      : clock(session.year1.endedAt) + '. ' + session.year1.how));
    lines.push('Year 2 started: ' + (session.year2.startedAt == null
      ? session.year2.how
      : clock(session.year2.startedAt) + '. ' + session.year2.how));
    lines.push('Year 2 ended: ' + (session.year2.endedAt == null
      ? (session.year2.startedAt == null ? 'It did not start.' : 'It did not close inside this sitting.')
      : clock(session.year2.endedAt) + '. ' + (session.year2.endedHow || '')));
    lines.push('');
    lines.push('Idle waits over 30s with nothing affordable: ' + session.idleWaits.length + '.');
    session.idleWaits.forEach(function (row) {
      lines.push('- At ' + clock(row.t) + ', ' + row.seconds + 's. ' + row.context);
    });
    lines.push('');
    lines.push('Away returns of 60s or more: ' + session.awayReturns.length + '.');
    session.awayReturns.forEach(function (row) {
      lines.push('- Returned at ' + clock(row.t) + ' after ' + row.awaySeconds + 's. '
        + (row.waiting ? 'Waiting: ' + row.waitingLabel : 'Nothing waiting to buy or claim.')
        + ' ' + row.context);
    });
    lines.push('');
  });
  lines.push('## Mismatches');
  lines.push('');
  lines.push(report.mismatchCount + ' distinct number' + (report.mismatchCount === 1 ? '' : 's') + ' disagreed.');
  report.mismatches.forEach(function (row) {
    lines.push('- ' + row.session + ' ' + row.where + ' at ' + clock(row.t) + '. Copy: "' + row.text + '". Shown `' + row.shown + '`. Real value ' + row.actual + '.');
  });
  lines.push('');
  return lines.join('\n');
}

function parseArgs(argv) {
  const out = { check: false, json: false, seconds: 6 * 3600, out: '', root: path.resolve(__dirname, '..', '..'), label: '' };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') out.check = true;
    else if (arg === '--json') out.json = true;
    else if (arg === '--seconds') out.seconds = Number(argv[++i]);
    else if (arg === '--out') out.out = argv[++i];
    else if (arg === '--root') out.root = path.resolve(argv[++i]);
    else if (arg === '--label') out.label = argv[++i];
    else throw new Error('Unknown argument ' + arg);
  }
  if (!(out.seconds > 0)) throw new Error('--seconds needs a positive number');
  return out;
}

function main() {
  selfTest();
  const args = parseArgs(process.argv.slice(2));
  const report = audit({
    root: args.root,
    seconds: args.seconds,
    label: args.label || args.root
  });
  const md = markdown(report);
  if (args.out) {
    fs.mkdirSync(args.out, { recursive: true });
    fs.writeFileSync(path.join(args.out, 'report.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(args.out, 'report.md'), md);
  }
  if (args.check) {
    const waits = report.idleWaits.length;
    console.log((report.ok ? 'PASS' : 'FAIL') + ' saltmarsh-audit: mismatches ' + report.mismatchCount + ', idle waits over 30s ' + waits + ', sessions ' + report.sessions.length);
    if (!report.ok) report.failures.forEach(row => console.log('  ' + row));
    process.exit(report.ok ? 0 : 1);
  }
  if (args.json) console.log(JSON.stringify(report, null, 2));
  else console.log(md);
}

main();
