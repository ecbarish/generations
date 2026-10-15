"""Validate the real-game pacing comparison; no human fun/phone pass is inferred."""
import json
import re
from pathlib import Path
import statistics
import struct
import sys

root = Path(sys.argv[1])
base = json.loads((root / 'baseline/pacing.json').read_text())
now = json.loads((root / 'current/pacing.json').read_text())
assert base['source_sha'] == '90802ca04aaa8ffcf9055d5ba5aae6edb578ec80'
assert now['source_sha'] == (root / 'head.txt').read_text().strip()
assert base['engine'] == now['engine']
assert re.search(r'^WB-LOOK early pace: \d+ passed, 0 failed\. Engine: .+$', (root / 'regression.log').read_text(), re.MULTILINE)
summary = {'baseline_sha': base['source_sha'], 'head_sha': now['source_sha'], 'engine': now['engine'], 'comparisons': []}
for name, data in [('baseline', base), ('current', now)]:
    assert not data['failures'], data['failures']
    assert not re.search(r'(^|\n)(SCRIPT ERROR:|ERROR:)', (root / name / 'run.log').read_text()), 'Runtime errors invalidate rendered evidence.'
    assert len(data['rows']) == 600 and all(row['battle_opened'] for row in data['rows'])
    assert {(r['heritage'], r['starter'], r['seed']) for r in data['rows']} == {(h, s, n) for h in ['farm', 'wander'] for s in ['cindercub', 'ripplet', 'mosshog'] for n in range(1, 101)}
    assert len(data['story_cadence']) == 400
    assert {(r['heritage'], r['seed'], r['story']) for r in data['story_cadence']} == {(h, n, s) for h in ['farm', 'wander'] for n in range(1, 101) for s in ['rival2', 'elder']}
    assert all(row['explorations'] == {'rival2': 12, 'elder': 20}[row['story']] for row in data['story_cadence'])
    expected_shots = {f'{kind}-{w}x{h}.png': (w, h) for kind in ['quiet', 'encounter'] for w, h in [(1536, 864), (390, 844)]}
    assert len(data['screenshots']) == 4
    assert {s['file'] for s in data['screenshots']} == set(expected_shots)
    for shot in data['screenshots']:
        image = (root / name / shot['file']).read_bytes()
        assert image[:8] == b'\x89PNG\r\n\x1a\n' and len(image) > 1000
        assert struct.unpack('>II', image[16:24]) == (shot['width'], shot['height'])
        assert (shot['width'], shot['height']) == expected_shots[shot['file']]
        assert shot['display'] != 'headless'
        if shot['file'].startswith('quiet-'):
            assert shot['hp_after'] > shot['hp_before'] if name == 'current' else shot['hp_after'] == shot['hp_before']
for heritage in ['farm', 'wander']:
    groups = [[row for row in data['rows'] if row['heritage'] == heritage] for data in [base, now]]
    stats = []
    for rows in groups:
        times = sorted(row['movement_seconds'] for row in rows)
        stats.append({'mean': statistics.mean(times), 'median': statistics.median(times), 'p95': times[int(.95 * len(times)) - 1], 'max': max(times)})
        assert all(row['first_find_world_steps'] == 19 for row in rows), 'The initial ten-grass countdown must stay unchanged.'
    assert stats[1]['mean'] < stats[0]['mean'] * .85
    assert stats[1]['p95'] < stats[0]['p95'] * .8
    assert stats[1]['median'] == stats[0]['median'], 'Do not claim the median first encounter changed.'
    summary['comparisons'].append({'heritage': heritage, 'baseline': stats[0], 'current': stats[1]})
    for story in ['rival2', 'elder']:
        groups = [[row for row in data['story_cadence'] if row['heritage'] == heritage and row['story'] == story] for data in [base, now]]
        steps = [statistics.mean(row['grass_steps'] for row in rows) for rows in groups]
        assert steps[1] < steps[0]
        summary['comparisons'].append({'heritage': heritage, 'story': story, 'mean_grass_steps_before': steps[0], 'mean_grass_steps_after': steps[1]})
assert base['finds_1000_seeds']['healing'] == 0
assert now['finds_1000_seeds']['healing'] == now['finds_1000_seeds']['flavour'] > 0
for key in ['battle', 'loot', 'flavour', 'berry_gain']:
    assert base['finds_1000_seeds'][key] == now['finds_1000_seeds'][key], 'Find odds or loot changed.'
summary['scope'] = 'Scripted movement timing only, excluding opening, navigation, reading and combat. Median first encounter and initial countdown unchanged. Story walking cadence intentionally accelerates. No physical-phone or human-fun acceptance.'
(root / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps(summary, indent=2))
print('WB-LOOK evidence validation passed.')
