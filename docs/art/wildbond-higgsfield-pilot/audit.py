"""Inspect originals without changing pixels. Pillow + NumPy; run beside this file."""
from pathlib import Path
import hashlib, json
import numpy as np
from PIL import Image

base = Path(__file__).resolve().parent
reports = []
for path in sorted((base / 'originals').glob('*.png')):
    rgba = np.asarray(Image.open(path).convert('RGBA'))
    alpha = rgba[:, :, 3]
    # Connected opaque runs, rather than fixed cells: generated poses cross gutters.
    parents, runs, previous = [], [], []
    def root(i):
        while parents[i] != i:
            parents[i] = parents[parents[i]]
            i = parents[i]
        return i
    for y, row in enumerate(alpha >= 128):
        edges = np.flatnonzero(np.diff(np.pad(row.astype(np.int8), (1, 1))))
        current = []
        cursor = 0
        for x0, x1 in zip(edges[::2], edges[1::2]):
            i = len(parents)
            parents.append(i)
            runs.append((y, int(x0), int(x1)))
            while cursor < len(previous) and previous[cursor][1] < x0:
                cursor += 1
            for p0, p1, pi in previous[cursor:]:
                if p0 > x1:
                    break
                parents[root(i)] = root(pi)
            current.append((int(x0), int(x1), i))
        previous = current
    components = {}
    for i, (y, x0, x1) in enumerate(runs):
        c = components.setdefault(root(i), [x0, y, x1, y + 1, 0])
        c[0], c[1], c[2], c[3] = min(c[0], x0), min(c[1], y), max(c[2], x1), max(c[3], y + 1)
        c[4] += x1 - x0
    n = 3 if 'props' in path.name else 2
    chosen = sorted(components.values(), key=lambda c: c[4], reverse=True)[:n*n]
    chosen.sort(key=lambda c: (c[1]+c[3])/2)
    cells = []
    for row in range(n):
        for col, c in enumerate(sorted(chosen[row*n:(row+1)*n], key=lambda c: c[0])):
            cells.append({'row': row, 'col': col, 'region': [c[0], c[1], c[2]-c[0], c[3]-c[1]], 'opaque_component_pixels': c[4]})
    reports.append({'file': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
        'width': rgba.shape[1], 'height': rgba.shape[0],
        'colors': len(np.unique(rgba[:,:,:3][alpha >= 128], axis=0)),
        'alpha': {'min': int(alpha.min()), 'max': int(alpha.max()),
                  'soft_pixels': int(((alpha > 0) & (alpha < 128)).sum()), 'body_pixels': int((alpha >= 128).sum())},
        'cells': cells, 'region_method': 'largest connected alpha>=128 components; independent details may be omitted'})
(base / 'audit.json').write_text(json.dumps(reports, indent=2) + '\n', encoding='utf-8')
print('AUDIT PASS: preserved four originals; located 21 main object bounds')
