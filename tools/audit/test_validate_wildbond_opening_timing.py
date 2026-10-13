#!/usr/bin/env python3
"""Synthetic negative controls for the opening evidence gate; no gameplay claims."""
import json
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest
import zlib

VALIDATOR = Path(__file__).with_name('validate_wildbond_opening_timing.py')
LABELS = ('howto', 'register', 'signed-invitation', 'follow-maren', 'barn-choice', 'partner-card', 'first-partner', 'partner-control')


def png(width, height):
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))
    raw = (b'\0' + b'\0\0\0' * width) * height
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')


class OpeningGateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.folder = Path(self.tmp.name)
        for variant in ('baseline', 'current'):
            out = self.folder / variant
            out.mkdir()
            data = {'failures': [], 'partner_acquired': True, 'partner_id': 'cindercub', 'input_events': 80,
                    'source_sha': 'synthetic-test-fixture', 'main_sha256': '0' * 64,
                    'method': 'keyboard', 'starter_index': 0, 'protocol': 'synthetic', 'engine': 'synthetic',
                    'rendered': True, 'display': 'x11', 'window_size': [1920, 1080],
                    'first_partner_seconds': 168 if variant == 'baseline' else 119,
                    'elapsed_seconds': 200 if variant == 'baseline' else 174,
                    'milestones': [{'label': label, 'seconds': 30, 'stage': 'bonded' if label == 'first-partner' else 'walk_out' if label == 'partner-control' else 'register'} for label in LABELS]}
            (out / 'report.json').write_text(json.dumps(data))
            for label in LABELS:
                (out / f'{label}.png').write_bytes(png(1920, 1080))
            for w, h in ((1366, 768), (3440, 1440)):
                (out / f'partner-control-{w}x{h}.png').write_bytes(png(w, h))

    def mutate(self, fn):
        path = self.folder / 'current/report.json'
        data = json.loads(path.read_text())
        fn(data)
        path.write_text(json.dumps(data))

    def run_gate(self, accepted=False):
        result = subprocess.run([sys.executable, str(VALIDATOR), str(self.folder), '--require-rendered'], capture_output=True, text=True)
        self.assertEqual(result.returncode == 0, accepted, result.stdout + result.stderr)

    def test_positive_control(self):
        self.run_gate(True)

    def test_wrong_selected_starter(self):
        self.mutate(lambda d: d.update(partner_id='mosshog'))
        self.run_gate()

    def test_incomplete_encounter(self):
        self.mutate(lambda d: d['milestones'][-1].update(stage='bonded'))
        self.run_gate()

    def test_acquisition_over_180(self):
        self.mutate(lambda d: d.update(first_partner_seconds=181, elapsed_seconds=200))
        self.run_gate()

    def test_control_over_180(self):
        self.mutate(lambda d: d.update(elapsed_seconds=181))
        self.run_gate()

    def test_missing_capture(self):
        (self.folder / 'current/signed-invitation.png').unlink()
        self.run_gate()

    def test_wrong_capture_dimensions(self):
        (self.folder / 'current/partner-card.png').write_bytes(png(1366, 768))
        self.run_gate()

    def test_wrong_extra_capture_dimensions(self):
        (self.folder / 'current/partner-control-3440x1440.png').write_bytes(png(1366, 768))
        self.run_gate()


if __name__ == '__main__':
    unittest.main()
