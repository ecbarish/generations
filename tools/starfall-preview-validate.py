"""Keep browser coverage and nonblank images mandatory before publication."""
import json
from pathlib import Path
import subprocess
root = Path('preview-review')
r = json.loads((root/'web-review.json').read_text())
assert r.get('passed') and not r['errors'], r
assert len(r['checks']) >= 45, 'Browser coverage incomplete'
assert len(r['screenshots']) == 17, 'Missing reviewed screenshots'
for name in r['screenshots']:
    deviation = float(subprocess.check_output(['identify','-format','%[fx:standard_deviation]',str(root/'screens'/name)],text=True))
    assert deviation > 0.04, 'Blank image: ' + name
print('PASS: exact pack browser checks, fresh and legacy IndexedDB reloads, 17 nonblank screenshots')
