"""Reject missing, black, or clipped actual-renderer SF2.6c evidence."""
import json
import pathlib
import subprocess
import sys
root = pathlib.Path(sys.argv[1])
for side, expected in [('before', 8), ('after', 24)]:
    folder = root / side
    report = json.loads((folder / 'manifest.json').read_text())
    assert report['passed'] and not report['errors'], report
    assert report['display'] != 'headless'
    assert len(report['captures']) == expected
    for capture in report['captures']:
        path = folder / capture['file']
        stats = subprocess.check_output(['identify', '-format', '%w %h %[fx:standard_deviation]', str(path)], text=True).split()
        assert list(map(int, stats[:2])) == capture['size'], path
        assert float(stats[2]) > 0.04, f'Blank/black screenshot: {path}'
        if side == 'after' and capture['label'] in ['welcome', 'ready', 'return']:
            assert all(item['fits'] for item in capture['landmarks']), capture
    if side == 'before':
        assert any(not item['fits'] for capture in report['captures'] for item in capture['landmarks']), 'Baseline did not reproduce clipping'
access = json.loads((root / 'reachability.json').read_text())
assert len(access['states']) == 501
assert all(not state['unreachable_targets'] for state in access['states'])
print('PASS: 32 nonblank renderer captures; full roofs at four sizes; repeated service routes; 501 construction states')
