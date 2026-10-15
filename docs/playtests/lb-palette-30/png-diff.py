#!/usr/bin/env python3
"""Proves the sprite edit is exactly the spec's: against a base ref (default origin/main), every changed PNG under games/lantern-bowl/art
differs only in pixels that were #c9bc9a and are now #d9c89a with the same alpha; the total is 123; no _mask.png changed.
    python3 docs/playtests/lb-palette-30/png-diff.py [base ref]"""
import io, subprocess, sys, warnings
from PIL import Image
warnings.simplefilter('ignore')
base = sys.argv[1] if len(sys.argv) > 1 else 'origin/main'
files = subprocess.check_output(['git', 'diff', '--name-only', base, '--', 'games/lantern-bowl/art']).decode().split()
total = bad = 0
for f in files:
    old = Image.open(io.BytesIO(subprocess.check_output(['git', 'show', base + ':' + f]))).convert('RGBA'); new = Image.open(f).convert('RGBA')
    if old.size != new.size: print(f, 'SIZE CHANGED'); bad += 1; continue
    n = b = 0
    for p, q in zip(old.getdata(), new.getdata()):
        if p != q:
            n += 1
            if not (p[:3] == (0xc9, 0xbc, 0x9a) and q[:3] == (0xd9, 0xc8, 0x9a) and p[3] == q[3]): b += 1
    total += n; bad += b
    print('%-34s %3d pixels changed, %d not a #c9bc9a -> #d9c89a swap' % (f.split('/')[-1], n, b))
masks = [f for f in files if f.endswith('_mask.png')]
print('%d files, %d pixels in total (spec: 12 and 123), %d stray pixels, %d mask files changed' % (len(files), total, bad, len(masks)))
sys.exit(0 if (len(files), total, bad, len(masks)) == (12, 123, 0, 0) else 1)
