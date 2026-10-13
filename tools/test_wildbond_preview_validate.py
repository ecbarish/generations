#!/usr/bin/env python3
"""Synthetic positive/negative controls for the exact-pack browser evidence gate."""
import copy
import json
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest
import zlib

VALIDATOR = Path(__file__).with_name('wildbond-preview-validate.py')
LABELS = 'howto short-arrival maren-register register signed-colour barn-invitation follow-maren barn-greeting choose-in-world partner-card declined card-reopened partner-acquired heritage-after-bond harvest-after-bond partner-control movement-with-partner'.split()

def png(w, h):
    def chunk(kind, payload):
        return struct.pack('>I', len(payload)) + kind + payload + struct.pack('>I', zlib.crc32(kind + payload))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress((b'\0' + b'\0\0\0' * w) * h)) + chunk(b'tEXt', b'synthetic-test\0' + b'x' * 1000) + chunk(b'IEND', b'')

class BrowserEvidenceGate(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'screens').mkdir()
        self.report = dict(completed=True, suite='full', consoles=[], screenshots=[], openings=[], checks=['synthetic'], currentSave=dict(passed=True, indexedDB=True, fixtureFreeReload=True))
        for method, w, h in [('keyboard', 1920, 1080), ('touch', 812, 375)]:
            file = method + '.png'
            (self.root / 'screens' / file).write_bytes(png(w, h))
            self.report['screenshots'].append(file)
            self.report['openings'].append(dict(method=method, size=dict(width=w, height=h), completed=True, partnerAcquired=True, controlReturned=True, fresh=True, partner='cindercub', movement=[{}], regainedMovement=dict(before=dict(x=8, y=5), after=dict(x=8, y=6)), checkpoints=[dict(label=label, file=file) for label in LABELS]))
        self.report['doors'] = [dict(size=dict(width=w, height=h), building=b, phase=p) for w, h in ((1920, 1080), (812, 375), (844, 390), (960, 540)) for b in ('inn', 'shop', 'pip_home', 'gran_home', 'barn') for p in ('entry', 'exit', 'reentry')]
        self.report['pad'] = [dict(releaseVerified=True) for _ in range(12)]

    def gate(self, success=False):
        (self.root / 'web-review.json').write_text(json.dumps(self.report))
        result = subprocess.run([sys.executable, str(VALIDATOR), str(self.root)], capture_output=True, text=True)
        self.assertEqual(result.returncode == 0, success, result.stdout + result.stderr)

    def test_full_positive(self): self.gate(True)
    def test_incomplete_suite(self):
        self.report['completed'] = False
        self.gate()
    def test_focused_run_cannot_pass_full_gate(self):
        self.report['suite'] = 'opening-only'
        self.gate()
    def test_missing_phase(self):
        self.report['openings'][0]['checkpoints'].pop()
        self.gate()
    def test_missing_mobile(self):
        self.report['openings'].pop()
        self.gate()
    def test_no_regained_movement(self):
        self.report['openings'][0]['regainedMovement']['after']['y'] = 5
        self.gate()
    def test_no_save_reload(self):
        self.report['currentSave']['fixtureFreeReload'] = False
        self.gate()
    def test_script_error(self):
        self.report['consoles'].append(dict(line='SCRIPT ERROR: synthetic'))
        self.gate()
    def test_missing_screenshot(self):
        (self.root / 'screens/touch.png').unlink()
        self.gate()
    def test_wrong_dimensions(self):
        (self.root / 'screens/touch.png').write_bytes(png(1920, 1080))
        self.gate()
    def test_door_coverage_lost(self):
        self.report['doors'].pop()
        self.gate()
    def test_pad_release_lost(self):
        self.report['pad'][0]['releaseVerified'] = False
        self.gate()

if __name__ == '__main__': unittest.main()
