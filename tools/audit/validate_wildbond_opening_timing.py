#!/usr/bin/env python3
"""Validate WB-C2/WB-FUNNEL1 input protocols, not novice or physical-mobile speed."""
import argparse
import json
import struct
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('folder', type=Path)
p.add_argument('--require-rendered', action='store_true')
p.add_argument('--single', action='store_true', help='Validate one report without the historical WB-C2 comparison')
a = p.parse_args()
reports = {}
for variant in (('current',) if a.single else ('baseline', 'current')):
    folder = a.folder if a.single else a.folder / variant
    report = json.loads((folder / 'report.json').read_text())
    reports[variant] = report
    assert not report['failures'], report['failures']
    assert report['partner_acquired'] and report['input_events'] > 30
    assert report['partner_id'] == ('cindercub', 'ripplet', 'mosshog')[report['starter_index']], 'Wrong selected starter'
    assert report['source_sha'] and len(report['main_sha256']) == 64
    marks = {m['label']: m for m in report['milestones']}
    assert marks['first-partner']['stage'] == 'bonded'
    assert marks['partner-control']['stage'] == 'walk_out'
    assert marks['first-battle']['stage'] == 'battle'
    assert marks['free-roam']['stage'] == 'free'
    assert marks['first-catch']['map'] == 'thornwood_route'
    assert marks['catch-control']['stage'] == 'free'
    assert report['catch_joined_team'] and report['catch_attempts'] > 0
    assert 0 < report['first_partner_seconds'] < report['partner_control_seconds'] < report['first_battle_seconds'] < report['first_catch_seconds'] < report['elapsed_seconds']
    for label, field in [('first-partner', 'first_partner_seconds'), ('partner-control', 'partner_control_seconds'), ('first-battle', 'first_battle_seconds'), ('first-catch', 'first_catch_seconds')]:
        assert marks[label]['seconds'] == report[field], f'{label} timestamp disagrees'
    if not report['rapid']:
        assert marks['register']['seconds'] >= 12
        assert report['first_partner_seconds'] >= 54  # how-to + creator + card alone
    if a.require_rendered:
        assert report['rendered'] and report['display'] != 'headless'
        expected = [812, 375] if report['method'] == 'touch' else [1920, 1080]
        assert report['window_size'] == expected
        for label in ('howto', 'register', 'follow-maren', 'signed-invitation', 'barn-choice', 'partner-card', 'first-partner', 'partner-control', 'first-battle', 'free-roam', 'first-route', 'first-catch', 'catch-control'):
            shot = folder / f'{label}.png'
            assert shot.stat().st_size > 1000, shot
            assert list(struct.unpack('>II', shot.read_bytes()[16:24])) == expected, shot
        if report['method'] == 'keyboard' and report['starter_index'] == 0:
            for size in ('1366x768', '3440x1440'):
                shot = folder / f'catch-control-{size}.png'
                assert shot.stat().st_size > 1000
                assert struct.unpack('>II', shot.read_bytes()[16:24]) == tuple(map(int, size.split('x'))), shot
current = reports['current']
assert current['first_partner_seconds'] <= 180, 'First partner exceeds the fixed-protocol three-minute target'
assert current['partner_control_seconds'] <= 180, 'Complete partner encounter exceeds the fixed-protocol three-minute target'
if not a.single:
    base = reports['baseline']
    for field in ('method', 'starter_index', 'protocol', 'engine', 'rapid'):
        assert base[field] == current[field], field
    assert current['first_partner_seconds'] < base['first_partner_seconds']
    assert current['partner_control_seconds'] < base['partner_control_seconds']
    print(f"WB-C2 comparison: partner {base['first_partner_seconds']:.2f} -> {current['first_partner_seconds']:.2f}s; control {base['partner_control_seconds']:.2f} -> {current['partner_control_seconds']:.2f}s")
print(f"PASS {current['method']} starter {current['starter_index']}: NewGame -> partner {current['first_partner_seconds']:.2f}s; battle {current['first_battle_seconds']:.2f}s; catch {current['first_catch_seconds']:.2f}s (scripted {'rapid' if current['rapid'] else 'reading'} protocol)")
