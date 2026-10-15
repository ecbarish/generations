#!/usr/bin/env python3
"""List every colour one browser game uses, with the file and line of each use.

Run it from the repo root:

    python3 tools/palette-inventory.py                     # Lantern Bowl, plain-text report
    python3 tools/palette-inventory.py --game lantern-bowl --markdown
    python3 tools/palette-inventory.py --json out.json     # machine-readable copy
    python3 tools/palette-inventory.py --max 30            # exit 1 if the game palette has more than 30 colours

What it reads
  * Game code: every .css, .js and .html file under games/<game>/ (not .md, not tests).
    Comments are removed before scanning, so a note such as "see #444" is never read as a colour.
    In JavaScript only string literals are scanned.
  * Game data: .json files under games/<game>/. They are reported separately, because the live game
    draws them only when a loaded script names the file.
  * Sprites: games/<game>/art/*.png. Every opaque pixel colour is counted. Files ending in _mask.png are
    tint masks and are not shown to the player, so they are skipped. Pixels in the key colours
    #ff00ff, #c000c0 and #800080 are skipped too, because view.js repaints every one of them with the club ramp
    (the script checks that each key pixel sits under the mask and warns if one does not).
  * Shared chrome: the files under shared/ that games/<game>/index.html loads with <script src> or <link href>.
    They are arcade-wide (the settings panel and the save notices), so they are listed but not counted
    against the game's cap.

Which forms it recognises
  #rgb, #rgba, #rrggbb and #rrggbbaa; rgb(), rgba(), hsl() and hsla(); and CSS named colours
  (white, black, red and the rest) when they appear as a CSS value, an SVG fill or stroke, or a whole JS string.
  transparent, currentColor, inherit and none are not colours and are ignored.

How a colour is counted (the alpha rule)
  Every value is reduced to its opaque base #rrggbb. A translucent value counts as its base colour,
  so #141820, #141820f2 and rgba(20, 24, 32, 0.5) are one palette colour. A fully transparent value
  (alpha 0) is not counted. Colours the browser mixes at run time (opacity, globalAlpha, gradients between
  two stops) are not counted either; only the stops are. The game total is the number of distinct bases
  across game code and shown sprite pixels.
"""
import argparse
import colorsys
import json
import os
import re
import sys
from collections import OrderedDict

NAMED = {
    'aliceblue': 'f0f8ff', 'antiquewhite': 'faebd7', 'aqua': '00ffff', 'aquamarine': '7fffd4', 'azure': 'f0ffff',
    'beige': 'f5f5dc', 'bisque': 'ffe4c4', 'black': '000000', 'blanchedalmond': 'ffebcd', 'blue': '0000ff',
    'blueviolet': '8a2be2', 'brown': 'a52a2a', 'burlywood': 'deb887', 'cadetblue': '5f9ea0', 'chartreuse': '7fff00',
    'chocolate': 'd2691e', 'coral': 'ff7f50', 'cornflowerblue': '6495ed', 'cornsilk': 'fff8dc', 'crimson': 'dc143c',
    'cyan': '00ffff', 'darkblue': '00008b', 'darkcyan': '008b8b', 'darkgoldenrod': 'b8860b', 'darkgray': 'a9a9a9',
    'darkgreen': '006400', 'darkgrey': 'a9a9a9', 'darkkhaki': 'bdb76b', 'darkmagenta': '8b008b',
    'darkolivegreen': '556b2f', 'darkorange': 'ff8c00', 'darkorchid': '9932cc', 'darkred': '8b0000',
    'darksalmon': 'e9967a', 'darkseagreen': '8fbc8f', 'darkslateblue': '483d8b', 'darkslategray': '2f4f4f',
    'darkslategrey': '2f4f4f', 'darkturquoise': '00ced1', 'darkviolet': '9400d3', 'deeppink': 'ff1493',
    'deepskyblue': '00bfff', 'dimgray': '696969', 'dimgrey': '696969', 'dodgerblue': '1e90ff', 'firebrick': 'b22222',
    'floralwhite': 'fffaf0', 'forestgreen': '228b22', 'fuchsia': 'ff00ff', 'gainsboro': 'dcdcdc',
    'ghostwhite': 'f8f8ff', 'gold': 'ffd700', 'goldenrod': 'daa520', 'gray': '808080', 'green': '008000',
    'greenyellow': 'adff2f', 'grey': '808080', 'honeydew': 'f0fff0', 'hotpink': 'ff69b4', 'indianred': 'cd5c5c',
    'indigo': '4b0082', 'ivory': 'fffff0', 'khaki': 'f0e68c', 'lavender': 'e6e6fa', 'lavenderblush': 'fff0f5',
    'lawngreen': '7cfc00', 'lemonchiffon': 'fffacd', 'lightblue': 'add8e6', 'lightcoral': 'f08080',
    'lightcyan': 'e0ffff', 'lightgoldenrodyellow': 'fafad2', 'lightgray': 'd3d3d3', 'lightgreen': '90ee90',
    'lightgrey': 'd3d3d3', 'lightpink': 'ffb6c1', 'lightsalmon': 'ffa07a', 'lightseagreen': '20b2aa',
    'lightskyblue': '87cefa', 'lightslategray': '778899', 'lightslategrey': '778899', 'lightsteelblue': 'b0c4de',
    'lightyellow': 'ffffe0', 'lime': '00ff00', 'limegreen': '32cd32', 'linen': 'faf0e6', 'magenta': 'ff00ff',
    'maroon': '800000', 'mediumaquamarine': '66cdaa', 'mediumblue': '0000cd', 'mediumorchid': 'ba55d3',
    'mediumpurple': '9370db', 'mediumseagreen': '3cb371', 'mediumslateblue': '7b68ee', 'mediumspringgreen': '00fa9a',
    'mediumturquoise': '48d1cc', 'mediumvioletred': 'c71585', 'midnightblue': '191970', 'mintcream': 'f5fffa',
    'mistyrose': 'ffe4e1', 'moccasin': 'ffe4b5', 'navajowhite': 'ffdead', 'navy': '000080', 'oldlace': 'fdf5e6',
    'olive': '808000', 'olivedrab': '6b8e23', 'orange': 'ffa500', 'orangered': 'ff4500', 'orchid': 'da70d6',
    'palegoldenrod': 'eee8aa', 'palegreen': '98fb98', 'paleturquoise': 'afeeee', 'palevioletred': 'db7093',
    'papayawhip': 'ffefd5', 'peachpuff': 'ffdab9', 'peru': 'cd853f', 'pink': 'ffc0cb', 'plum': 'dda0dd',
    'powderblue': 'b0e0e6', 'purple': '800080', 'rebeccapurple': '663399', 'red': 'ff0000', 'rosybrown': 'bc8f8f',
    'royalblue': '4169e1', 'saddlebrown': '8b4513', 'salmon': 'fa8072', 'sandybrown': 'f4a460', 'seagreen': '2e8b57',
    'seashell': 'fff5ee', 'sienna': 'a0522d', 'silver': 'c0c0c0', 'skyblue': '87ceeb', 'slateblue': '6a5acd',
    'slategray': '708090', 'slategrey': '708090', 'snow': 'fffafa', 'springgreen': '00ff7f', 'steelblue': '4682b4',
    'tan': 'd2b48c', 'teal': '008080', 'thistle': 'd8bfd8', 'tomato': 'ff6347', 'turquoise': '40e0d0',
    'violet': 'ee82ee', 'wheat': 'f5deb3', 'white': 'ffffff', 'whitesmoke': 'f5f5f5', 'yellow': 'ffff00',
    'yellowgreen': '9acd32',
}
KEY_COLOURS = {'#ff00ff', '#c000c0', '#800080'}
CODE_EXT = ('.css', '.js', '.html')
HEX_RE = re.compile(r'#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-zA-Z_-])')
FUNC_RE = re.compile(r'\b(rgba?|hsla?)\(\s*([^)]*)\)', re.I)
NAMED_RE = re.compile(r'(?<![\w#.-])(' + '|'.join(sorted(NAMED, key=len, reverse=True)) + r')(?![\w-])', re.I)
CSS_COLOUR_PROP = re.compile(r'(?:^|[;{\s])(color|background(?:-color)?|border(?:-[a-z]+)*(?:-color)?|outline(?:-color)?|'
                             r'fill|stroke|text-shadow|box-shadow|caret-color|accent-color|text-decoration(?:-color)?|'
                             r'column-rule(?:-color)?|stop-color|--[\w-]+)\s*:\s*([^;}]*)', re.I)


def blank(text, start, end):
    """Replace text[start:end] with spaces, keeping newlines so line numbers survive."""
    return text[:start] + re.sub(r'[^\n]', ' ', text[start:end]) + text[end:]


def strip_css_comments(text):
    for m in reversed(list(re.finditer(r'/\*.*?\*/', text, re.S))):
        text = blank(text, m.start(), m.end())
    return text


def strip_html_comments(text):
    for m in reversed(list(re.finditer(r'<!--.*?-->', text, re.S))):
        text = blank(text, m.start(), m.end())
    return text


def js_string_spans(text):
    """Return (start, end) spans of JS string literal contents, skipping comments and regex-free code."""
    spans, i, n = [], 0, len(text)
    while i < n:
        c = text[i]
        if text.startswith('//', i):
            j = text.find('\n', i)
            i = n if j < 0 else j
        elif text.startswith('/*', i):
            j = text.find('*/', i + 2)
            i = n if j < 0 else j + 2
        elif c in '\'"`':
            j = i + 1
            while j < n and text[j] != c:
                if text[j] == '\\':
                    j += 1
                elif c != '`' and text[j] == '\n':
                    break
                j += 1
            spans.append((i + 1, j))
            i = j + 1
        else:
            i += 1
    return spans


def parse_alpha(a):
    a = a.strip()
    return float(a[:-1]) / 100 if a.endswith('%') else float(a)


def from_func(name, args):
    parts = [p for p in re.split(r'[\s,/]+', args.strip()) if p]
    if len(parts) < 3:
        return None
    try:
        alpha = parse_alpha(parts[3]) if len(parts) > 3 else 1.0
        if name.lower().startswith('rgb'):
            rgb = [round(float(p[:-1]) * 2.55) if p.endswith('%') else round(float(p)) for p in parts[:3]]
        else:
            h = float(re.sub(r'deg$', '', parts[0])) / 360
            s, l = float(parts[1].rstrip('%')) / 100, float(parts[2].rstrip('%')) / 100
            rgb = [round(v * 255) for v in colorsys.hls_to_rgb(h, l, s)]
    except ValueError:
        return None
    return '#%02x%02x%02x' % tuple(max(0, min(255, v)) for v in rgb), alpha


def from_hex(h):
    h = h.lower()
    if len(h) in (3, 4):
        h = ''.join(ch * 2 for ch in h)
    alpha = int(h[6:8], 16) / 255 if len(h) == 8 else 1.0
    return '#' + h[:6], alpha


def line_of(text, pos):
    return text.count('\n', 0, pos) + 1


def scan_segment(text, start, end, kind, allow_named):
    out = []
    seg = text[start:end]
    for m in HEX_RE.finditer(seg):
        base, alpha = from_hex(m.group(1))
        out.append((start + m.start(), m.group(0), base, alpha))
    for m in FUNC_RE.finditer(seg):
        got = from_func(m.group(1), m.group(2))
        if got:
            out.append((start + m.start(), m.group(0), got[0], got[1]))
    if allow_named:
        for m in NAMED_RE.finditer(seg):
            out.append((start + m.start(), m.group(0), '#' + NAMED[m.group(1).lower()], 1.0))
    return out


def scan_text(path, text):
    ext = os.path.splitext(path)[1].lower()
    hits = []
    if ext == '.css' or ext == '.html':
        clean = strip_css_comments(strip_html_comments(text) if ext == '.html' else text)
        # hex and rgb()/hsl() anywhere outside comments
        hits += scan_segment(clean, 0, len(clean), ext, False)
        # named colours only as a CSS value or an SVG/HTML colour attribute
        for m in CSS_COLOUR_PROP.finditer(clean):
            for h in scan_segment(clean, m.start(2), m.end(2), ext, True):
                if not h[1].startswith('#') and '(' not in h[1]:
                    hits.append(h)
        if ext == '.html':
            for m in re.finditer(r'\b(fill|stroke|color|bgcolor|stop-color)\s*=\s*"([^"]*)"', clean, re.I):
                v = m.group(2).strip()
                if v.lower() in NAMED:
                    hits.append((m.start(2), v, '#' + NAMED[v.lower()], 1.0))
            # inline <script> bodies are JS
            for sm in re.finditer(r'<script\b[^>]*>(.*?)</script>', clean, re.S | re.I):
                body = sm.group(1)
                for a, b in js_string_spans(body):
                    s = body[a:b]
                    if s.strip().lower() in NAMED:
                        hits.append((sm.start(1) + a, s, '#' + NAMED[s.strip().lower()], 1.0))
    elif ext in ('.js', '.cjs', '.mjs'):
        for a, b in js_string_spans(text):
            hits += scan_segment(text, a, b, ext, False)
            s = text[a:b]
            if s.strip().lower() in NAMED:
                hits.append((a, s, '#' + NAMED[s.strip().lower()], 1.0))
            else:  # a CSS block inside a JS string
                for m in CSS_COLOUR_PROP.finditer(s):
                    for h in scan_segment(s, m.start(2), m.end(2), ext, True):
                        if not h[1].startswith('#') and '(' not in h[1]:
                            hits.append((a + h[0], h[1], h[2], h[3]))
    elif ext == '.json':
        for m in re.finditer(r'"((?:[^"\\]|\\.)*)"', text):
            v = m.group(1)
            if re.fullmatch(r'#[0-9a-fA-F]{3,8}', v) and len(v) in (4, 5, 7, 9):
                base, alpha = from_hex(v[1:])
                hits.append((m.start(1), v, base, alpha))
    seen, uniq = set(), []
    for pos, raw, base, alpha in sorted(hits):
        if pos in seen:
            continue
        seen.add(pos)
        if raw.lower() in ('transparent', 'currentcolor', 'inherit', 'none'):
            continue
        uniq.append({'line': line_of(text, pos), 'raw': raw, 'base': base, 'alpha': round(alpha, 3)})
    return uniq


def loaded_shared(repo, game_dir):
    idx = os.path.join(game_dir, 'index.html')
    if not os.path.exists(idx):
        return []
    html = open(idx, encoding='utf-8').read()
    out = []
    for m in re.finditer(r'<(?:script[^>]*\bsrc|link[^>]*\bhref)="([^"]+)"', html):
        p = os.path.normpath(os.path.join(game_dir, m.group(1)))
        if os.path.exists(p) and not p.startswith(os.path.normpath(game_dir) + os.sep):
            out.append(p)
    return out


def scan_png(path):
    try:
        from PIL import Image
    except ImportError:
        sys.exit('Pillow is needed for the sprite scan: pip install pillow (or pass --skip-sprites)')
    im = Image.open(path).convert('RGBA')
    px = list(im.getdata())
    counts = {}
    for p in px:
        if p[3] == 0:
            continue
        h = '#%02x%02x%02x' % p[:3]
        counts[h] = counts.get(h, 0) + 1
    mask_path = path[:-4] + '_mask.png'
    stray = 0
    if os.path.exists(mask_path):
        mpx = list(Image.open(mask_path).convert('RGBA').getdata())
        for p, q in zip(px, mpx):
            if p[3] and ('#%02x%02x%02x' % p[:3]) in KEY_COLOURS and q[3] < 128:
                stray += 1
    return counts, stray


SKIP_SPRITES = False


def inventory(repo, game):
    game_dir = os.path.join(repo, 'games', game)
    if not os.path.isdir(game_dir):
        sys.exit('No such game folder: ' + game_dir)
    colours = OrderedDict()
    warnings = []

    def add(base, scope, rel, line, raw, alpha, n=1):
        c = colours.setdefault(base, {'hex': base, 'uses': [], 'scopes': set(), 'alphas': set(), 'count': 0})
        c['uses'].append({'file': rel, 'line': line, 'raw': raw, 'alpha': alpha, 'scope': scope, 'n': n})
        c['scopes'].add(scope)
        c['alphas'].add(alpha)
        c['count'] += n

    loaded_names = ''
    for root, _, files in os.walk(game_dir):
        for f in sorted(files):
            if f.endswith(CODE_EXT):
                loaded_names += open(os.path.join(root, f), encoding='utf-8').read()
    for root, _, files in sorted(os.walk(game_dir)):
        for f in sorted(files):
            p = os.path.join(root, f)
            rel = os.path.relpath(p, repo).replace(os.sep, '/')
            ext = os.path.splitext(f)[1].lower()
            if ext in CODE_EXT:
                for h in scan_text(p, open(p, encoding='utf-8').read()):
                    if h['alpha'] > 0:
                        add(h['base'], 'code', rel, h['line'], h['raw'], h['alpha'])
            elif ext == '.json':
                scope = 'data-loaded' if f in loaded_names else 'data-unloaded'
                for h in scan_text(p, open(p, encoding='utf-8').read()):
                    add(h['base'], scope, rel, h['line'], h['raw'], h['alpha'])
            elif ext == '.png' and not f.endswith('_mask.png') and not SKIP_SPRITES:
                counts, stray = scan_png(p)
                if stray:
                    warnings.append('%s has %d key-colour pixels outside its mask; they would show.' % (rel, stray))
                for h, n in sorted(counts.items()):
                    if h in KEY_COLOURS and not stray:
                        continue
                    add(h, 'sprite', rel, 0, h, 1.0, n)
    for p in loaded_shared(repo, game_dir):
        rel = os.path.relpath(p, repo).replace(os.sep, '/')
        for h in scan_text(p, open(p, encoding='utf-8').read()):
            if h['alpha'] > 0:
                add(h['base'], 'shared', rel, h['line'], h['raw'], h['alpha'])
    counted = [c for c in colours.values() if c['scopes'] & {'code', 'sprite', 'data-loaded'}]
    return colours, counted, warnings


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--repo', default='.', help='repo root (default: current folder)')
    ap.add_argument('--game', default='lantern-bowl')
    ap.add_argument('--json', help='also write the full inventory to this JSON file')
    ap.add_argument('--markdown', action='store_true', help='print a Markdown table')
    ap.add_argument('--max', type=int, help='exit 1 when the game palette has more colours than this')
    ap.add_argument('--skip-sprites', action='store_true', help='do not open PNGs (for a machine without Pillow); the count may be low')
    args = ap.parse_args()
    global SKIP_SPRITES
    SKIP_SPRITES = args.skip_sprites
    if SKIP_SPRITES:
        print('Sprites skipped: colours that appear only in sprite PNGs are missing from this count.', file=sys.stderr)
    colours, counted, warnings = inventory(args.repo, args.game)
    order = sorted(colours.values(), key=lambda c: (not (c['scopes'] & {'code', 'sprite', 'data-loaded'}), c['hex']))

    def where(c):
        out = []
        for u in c['uses']:
            tag = u['raw'] if u['raw'].lower() != c['hex'] else ''
            if u['scope'] == 'sprite':
                out.append('%s (%d px)' % (u['file'], u['n']))
            else:
                note = {'shared': ' [shared chrome]', 'data-unloaded': ' [data, not loaded]'}.get(u['scope'], '')
                out.append('%s:%d%s%s' % (u['file'], u['line'], (' ' + tag) if tag else '', note))
        return out

    if args.markdown:
        print('| Hex | Counted | Uses | Where |')
        print('|---|---|---|---|')
        for c in order:
            uses = sum(1 for u in c['uses'] if u['scope'] != 'sprite')
            spr = sum(1 for u in c['uses'] if u['scope'] == 'sprite')
            n = '%d' % uses + (' + %d sprites' % spr if spr else '')
            yes = 'yes' if c['scopes'] & {'code', 'sprite', 'data-loaded'} else 'no (' + ', '.join(sorted(c['scopes'])) + ')'
            print('| `%s` | %s | %s | %s |' % (c['hex'], yes, n, '<br>'.join(where(c))))
    else:
        for c in order:
            uses = sum(1 for u in c['uses'] if u['scope'] != 'sprite')
            spr = sum(1 for u in c['uses'] if u['scope'] == 'sprite')
            flag = '' if c['scopes'] & {'code', 'sprite', 'data-loaded'} else '  [not counted: %s]' % ', '.join(sorted(c['scopes']))
            print('%s  %d use%s%s%s' % (c['hex'], uses, '' if uses == 1 else 's', (', %d sprite files' % spr) if spr else '', flag))
            for w in where(c):
                print('    ' + w)
    for w in warnings:
        print('WARNING: ' + w, file=sys.stderr)
    shared = [c for c in colours.values() if c['scopes'] == {'shared'}]
    unloaded = [c for c in colours.values() if c['scopes'] == {'data-unloaded'}]
    print('\n%s palette: %d colours (game code, shown sprite pixels and loaded data; alpha variants fold into their base).'
          % (args.game, len(counted)))
    print('Not counted: %d only in shared chrome, %d only in data files the game does not load yet.' % (len(shared), len(unloaded)))
    if args.json:
        data = [{'hex': c['hex'], 'counted': bool(c['scopes'] & {'code', 'sprite', 'data-loaded'}),
                 'scopes': sorted(c['scopes']), 'alphas': sorted(c['alphas']), 'uses': c['uses']} for c in order]
        with open(args.json, 'w', encoding='utf-8') as fh:
            json.dump({'game': args.game, 'count': len(counted), 'colours': data}, fh, indent=1)
    if args.max is not None and len(counted) > args.max:
        print('Over the cap: %d > %d' % (len(counted), args.max), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
