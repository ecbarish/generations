#!/usr/bin/env python3
"""Reject partial browser runs, incomplete opening/save evidence, and missing captures."""
import argparse
import json
from pathlib import Path
import struct

p = argparse.ArgumentParser()
p.add_argument('folder', nargs='?', type=Path, default=Path('preview-review'))
p.add_argument('--opening-only', action='store_true', help='Explicit focused preparation run; not the full release gate')
a = p.parse_args()
r = json.loads((a.folder / 'web-review.json').read_text())
assert r.get('completed') is True, 'Browser suite did not finish successfully'
assert r.get('suite') == ('opening-only' if a.opening_only else 'full'), 'Wrong review scope'
required = {'howto', 'short-arrival', 'maren-register', 'register', 'signed-colour', 'barn-invitation', 'follow-maren', 'barn-greeting', 'choose-in-world', 'partner-card', 'declined', 'card-reopened', 'partner-acquired', 'heritage-after-bond', 'harvest-after-bond', 'partner-control', 'movement-with-partner'}
assert len(r.get('openings', [])) == 2
methods = set()
for case in r['openings']:
    methods.add(case['method'])
    assert case.get('completed') and case.get('partnerAcquired') and case.get('controlReturned') and case.get('fresh')
    assert case['partner'] == 'cindercub'
    expected = (1920, 1080) if case['method'] == 'keyboard' else (812, 375)
    assert (case['size']['width'], case['size']['height']) == expected
    assert required <= {x['label'] for x in case['checkpoints']}
    assert case['movement'], 'No observed real-input movement'
    before, after = case['regainedMovement']['before'], case['regainedMovement']['after']
    assert after['x'] == before['x'] and after['y'] == before['y'] + 1
    for capture in case['checkpoints']:
        data = (a.folder / 'screens' / capture['file']).read_bytes()
        assert data[:8] == b'\x89PNG\r\n\x1a\n' and len(data) > 1000
        assert struct.unpack('>II', data[16:24]) == expected
assert methods == {'keyboard', 'touch'}
assert r.get('currentSave', {}).get('passed') and r['currentSave']['indexedDB'] and r['currentSave']['fixtureFreeReload']
for capture in r['screenshots']:
    assert (a.folder / 'screens' / capture).stat().st_size > 1000
assert not any(any(word in item['line'] for word in ('SCRIPT ERROR', 'Parse Error', 'Failed to load script', 'Aborted(')) for item in r['consoles'])
if not a.opening_only:
    doors = {(c['size']['width'], c['size']['height'], c['building'], c['phase']) for c in r['doors']}
    expected = {(w, h, b, phase) for w, h in ((1920, 1080), (812, 375), (844, 390), (960, 540)) for b in ('inn', 'shop', 'pip_home', 'gran_home', 'barn') for phase in ('entry', 'exit', 'reentry')}
    assert doors == expected and len(r['doors']) == 60
    assert len(r['pad']) == 12 and all(c['releaseVerified'] for c in r['pad'])
print('PASS: complete browser opening, save, capture and requested suite coverage')
