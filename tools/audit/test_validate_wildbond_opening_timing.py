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
LABELS = ('howto', 'register', 'signed-invitation', 'follow-maren', 'barn-choice', 'partner-card', 'first-partner', 'partner-control', 'first-battle', 'first-battle-choice', 'free-roam', 'first-route', 'first-catch', 'catch-control')


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
                    'partner_control_seconds': 200 if variant == 'baseline' else 174,
                    'first_battle_seconds': 250, 'first_catch_seconds': 310, 'elapsed_seconds': 340,
                    'rapid': False, 'catch_attempts': 2, 'catch_joined_team': True,
                    'milestones': [{'label': label, 'seconds': 30, 'stage': 'bonded' if label == 'first-partner' else 'walk_out' if label == 'partner-control' else 'register'} for label in LABELS]}
            for mark in data['milestones']:
                if mark['label'] == 'first-battle': mark['stage'] = 'battle'
                if mark['label'] in ('free-roam', 'catch-control'): mark['stage'] = 'free'
                mark['map'] = 'thornwood_route'
                fields = {'first-partner': 'first_partner_seconds', 'partner-control': 'partner_control_seconds', 'first-battle': 'first_battle_seconds', 'first-catch': 'first_catch_seconds'}
                if mark['label'] in fields: mark['seconds'] = data[fields[mark['label']]]
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

    def run_gate(self, accepted=False, expected_error=None):
        result = subprocess.run([sys.executable, str(VALIDATOR), str(self.folder), '--require-rendered'], capture_output=True, text=True)
        self.assertEqual(result.returncode == 0, accepted, result.stdout + result.stderr)
        if expected_error is not None:
            self.assertIn(expected_error, result.stderr)

    def test_positive_control(self):
        self.run_gate(True)

    def test_wrong_selected_starter(self):
        self.mutate(lambda d: d.update(partner_id='mosshog'))
        self.run_gate()

    def test_incomplete_encounter(self):
        self.mutate(lambda d: next(m for m in d['milestones'] if m['label'] == 'partner-control').update(stage='bonded'))
        self.run_gate()

    def test_acquisition_over_180(self):
        def over_limit(data):
            data.update(first_partner_seconds=181, partner_control_seconds=190)
            for mark in data['milestones']:
                if mark['label'] == 'first-partner': mark['seconds'] = 181
                if mark['label'] == 'partner-control': mark['seconds'] = 190
        self.mutate(over_limit)
        self.run_gate(expected_error='First partner exceeds the fixed-protocol three-minute target')

    def test_control_over_180(self):
        def over_limit(data):
            data['partner_control_seconds'] = 181
            next(m for m in data['milestones'] if m['label'] == 'partner-control')['seconds'] = 181
        self.mutate(over_limit)
        self.run_gate(expected_error='Complete partner encounter exceeds the fixed-protocol three-minute target')

    def test_missing_battle(self):
        self.mutate(lambda d: d.update(first_battle_seconds=-1))
        self.run_gate()

    def test_catch_not_joined(self):
        self.mutate(lambda d: d.update(catch_joined_team=False))
        self.run_gate()

    def test_zero_catch_attempts(self):
        self.mutate(lambda d: d.update(catch_attempts=0))
        self.run_gate()

    def test_inconsistent_timestamp(self):
        self.mutate(lambda d: d.update(first_catch_seconds=309))
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
