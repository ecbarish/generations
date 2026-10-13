#!/usr/bin/env python3
"""Inspect the actual Godot 4.7.2 pack, rather than trusting stale build metadata."""
import argparse
import ctypes
import ctypes.util
import hashlib
import json
from pathlib import Path
import struct
import subprocess

ROOT = Path(__file__).resolve().parents[1]

def unpack(path):
    raw = path.read_bytes()
    magic, version, major, minor, patch, flags = struct.unpack_from('<6I', raw)
    assert (magic, version, major, minor, patch) == (0x43504447, 4, 4, 7, 2)
    assert flags == 2, 'Expected unencrypted relative-file-offset pack'
    base, cursor = struct.unpack_from('<QQ', raw, 24)
    count = struct.unpack_from('<I', raw, cursor)[0]
    cursor += 4
    entries = {}
    for _ in range(count):
        length = struct.unpack_from('<I', raw, cursor)[0]
        cursor += 4
        name = raw[cursor:cursor+length].rstrip(b'\0').decode()
        cursor += length
        offset, size = struct.unpack_from('<QQ', raw, cursor)
        cursor += 16
        md5 = raw[cursor:cursor+16]
        cursor += 16
        file_flags = struct.unpack_from('<I', raw, cursor)[0]
        cursor += 4
        assert not file_flags, (name, 'unexpected encrypted/removal file')
        assert name not in entries and '..' not in Path(name).parts
        data = raw[base+offset:base+offset+size]
        assert len(data) == size and hashlib.md5(data).digest() == md5, name
        entries[name] = data
    return raw, entries

def tokens(data):
    assert data[:4] == b'GDSC'
    version, size = struct.unpack_from('<II', data, 4)
    assert version == 101 and size > 0
    zstd = ctypes.CDLL(ctypes.util.find_library('zstd'))
    zstd.ZSTD_decompress.argtypes = [ctypes.c_void_p, ctypes.c_size_t, ctypes.c_void_p, ctypes.c_size_t]
    zstd.ZSTD_decompress.restype = ctypes.c_size_t
    output = ctypes.create_string_buffer(size)
    assert zstd.ZSTD_decompress(output, size, data[12:], len(data)-12) == size
    buf = output.raw
    count = struct.unpack_from('<I', buf)[0]
    cursor = 16
    identifiers = []
    for _ in range(count):
        length = struct.unpack_from('<I', buf, cursor)[0]
        cursor += 4
        identifiers.append(bytes(b ^ 0xb6 for b in buf[cursor:cursor+length*4]).decode('utf-32le'))
        cursor += length*4
    return buf, identifiers

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', required=True)
    parser.add_argument('--pack', type=Path, default=ROOT/'play/wildbond/index.pck')
    args = parser.parse_args()
    assert len(args.source) == 40
    raw, entries = unpack(args.pack)
    checked = []
    for name, data in entries.items():
        assert not name.startswith(('tests/', 'frames/')), 'Test-only resource shipped: '+name
        if name.startswith('data/') and name.endswith('.json'):
            source = subprocess.check_output(['git', 'show', args.source+':wildbond-godot/'+name], cwd=ROOT)
            assert json.loads(data) == json.loads(source), 'Packed data differs from exact source: '+name
            checked.append(name)
    assert {'data/wildbond.json', 'data/evolution.json'} <= set(checked)
    main_tokens, main_ids = tokens(entries['scripts/main.gdc'])
    _, battle_ids = tokens(entries['scripts/battle.gdc'])
    assert {'_evo_cine_start', '_draw_evo_cine', 'SIZE_SCALE', 'key_hint'} <= set(main_ids)
    assert 'SIZE_SCALE' in battle_ids
    assert b"The supply cart stops by Larkhaven's ranch fence." in main_tokens
    assert b'The supply cart stops at the edge of the trees.' not in main_tokens
    assert b'marenRanchTip' in main_tokens
    assert b'XXXXX,ntn,rrr,ntn,,XXXXX' in main_tokens
    report = {'passed': True, 'source': args.source, 'pack_sha256': hashlib.sha256(raw).hexdigest(),
              'pack_bytes': len(raw), 'entry_count': len(entries), 'data_files': sorted(checked),
              'opening_and_merged_feature_tokens': True, 'all_entry_md5_valid': True}
    out = ROOT/'preview-review'; out.mkdir(exist_ok=True)
    (out/'pack-inspection.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(report))

if __name__ == '__main__':
    main()
