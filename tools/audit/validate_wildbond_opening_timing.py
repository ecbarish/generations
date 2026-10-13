#!/usr/bin/env python3
"""Validate WB-C2 protocol reports; no claims about novice or physical-mobile speed."""
import argparse
import json
import struct
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('folder', type=Path)
p.add_argument('--require-rendered', action='store_true')
a = p.parse_args()
reports = {}
for variant in ('baseline', 'current'):
    report = json.loads((a.folder / variant / 'report.json').read_text())
    reports[variant] = report
    assert not report['failures'], report['failures']
    assert report['partner_acquired'] and report['input_events'] > 30
    assert report['partner_id'] == ('cindercub', 'ripplet', 'mosshog')[report['starter_index']], 'Wrong selected starter'
    assert report['source_sha'] and len(report['main_sha256']) == 64
    marks = {m['label']: m for m in report['milestones']}
    assert marks['first-partner']['stage'] == 'bonded'
    assert marks['partner-control']['stage'] == 'walk_out'
    assert marks['register']['seconds'] >= 12
    assert report['elapsed_seconds'] > report['first_partner_seconds']
    assert report['first_partner_seconds'] >= 54  # how-to + creator + card alone
    if a.require_rendered:
        assert report['rendered'] and report['display'] != 'headless'
        expected = [812, 375] if report['method'] == 'touch' else [1920, 1080]
        assert report['window_size'] == expected
        for label in ('howto', 'register', 'follow-maren', 'signed-invitation', 'barn-choice', 'partner-card', 'first-partner', 'partner-control'):
            shot = a.folder / variant / f'{label}.png'
            assert shot.stat().st_size > 1000, shot
            assert list(struct.unpack('>II', shot.read_bytes()[16:24])) == expected, shot
        if report['method'] == 'keyboard' and report['starter_index'] == 0:
            for size in ('1366x768', '3440x1440'):
                shot = a.folder / variant / f'partner-control-{size}.png'
                assert shot.stat().st_size > 1000
                assert struct.unpack('>II', shot.read_bytes()[16:24]) == tuple(map(int, size.split('x'))), shot
base, current = reports['baseline'], reports['current']
for field in ('method', 'starter_index', 'protocol', 'engine'):
    assert base[field] == current[field], field
assert current['first_partner_seconds'] <= 180, 'First partner exceeds the fixed-protocol three-minute target'
assert current['elapsed_seconds'] <= 180, 'Complete encounter exceeds the fixed-protocol three-minute target'
assert current['first_partner_seconds'] < base['first_partner_seconds']
assert current['elapsed_seconds'] < base['elapsed_seconds']
print(f"PASS {current['method']} starter {current['starter_index']}: acquisition {base['first_partner_seconds']:.2f} -> {current['first_partner_seconds']:.2f}s; control {base['elapsed_seconds']:.2f} -> {current['elapsed_seconds']:.2f}s (simulated protocol)")
