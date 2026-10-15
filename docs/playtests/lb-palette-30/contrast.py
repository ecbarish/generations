#!/usr/bin/env python3
"""LB-PAL contrast table, recomputed. WCAG 2 relative-luminance contrast, before and after the six merges.
Run from the repo root:  python3 docs/playtests/lb-palette-30/contrast.py
Each pairing is (kind, name, fg_before, fg_after, bg_before, bg_after). Translucent backgrounds are measured as their opaque base.
It also checks, in the head's source, that the 'after' colours the table relies on are what the code now uses."""
import re, sys

def lin(c):
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
def lum(h):
    r, g, b = (int(h[i:i + 2], 16) for i in (1, 3, 5))
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
def cr(a, b):
    x, y = sorted((lum(a), lum(b)), reverse=True)
    return (x + 0.05) / (y + 0.05)

ROWS = [
 ('Text', 'Body text on the page', '#f6edd4', '#f6edd4', '#10141c', '#141820'),
 ('Text', 'Title and Home link on the page', '#f2d080', '#f2d080', '#10141c', '#141820'),
 ('Text', 'Version label, 11px', '#d9c89a', '#d9c89a', '#10141c', '#141820'),
 ('Text', 'Turbo while held', '#1a120c', '#1e1a22', '#f2d080', '#f2d080'),
 ('Graphic', 'Power meter frame on its well', '#c9bc9a', '#d9c89a', '#1e1a22', '#1e1a22'),
 ('Graphic', 'Sprite trim against the ink outline', '#c9bc9a', '#d9c89a', '#1e1a22', '#1e1a22'),
 ('Graphic', 'Power meter frame on dark grass', '#c9bc9a', '#d9c89a', '#2d8a3c', '#2d8a3c'),
 ('Graphic', 'Power meter frame on light grass', '#c9bc9a', '#d9c89a', '#38994a', '#38994a'),
 ('Graphic', 'Stick knob on dark grass', '#c9bc9a', '#d9c89a', '#2d8a3c', '#2d8a3c'),
 ('Graphic', 'Stick knob on light grass', '#c9bc9a', '#d9c89a', '#38994a', '#38994a'),
 ('Decorative', 'Screen frame border on the page', '#6d5a38', '#6d5a38', '#10141c', '#141820'),
 ('Decorative', 'Screen frame border on the screen fill', '#6d5a38', '#6d5a38', '#101820', '#141820'),
 ('Decorative', 'Button fill on the page', '#243044', '#243044', '#10141c', '#141820'),
 ('Decorative', 'HUD text shadow', '#000000', '#141820', '#141820', '#141820'),
 ('Graphic (#495)', 'Unlit star on a row', '#4a4a50', '#8a7e64', '#182230', '#1b2430'),
 ('Graphic (#495)', 'Unlit star on an even row', '#4a4a50', '#8a7e64', '#141d2a', '#141820'),
 ('Text (#495)', 'Dim text on a row', '#c9bf9f', '#d9c89a', '#182230', '#1b2430'),
 ('Text (#495)', 'Lamplight on a row', '#f2d080', '#f2d080', '#182230', '#1b2430'),
 ('Text (#495)', 'Main text on a row', '#f6edd4', '#f6edd4', '#182230', '#1b2430'),
]
SPEC_AFTER = [15.22, 11.94, 10.73, 11.51, 10.34, 10.34, 2.63, 2.18, 2.63, 2.18, 2.68, 2.68, 1.34, 1.00, 3.91, 4.44, 9.45, 10.52, 13.40]
print('| Kind | Pairing | Foreground | Background | Before | After | Spec |')
print('|---|---|---|---|---|---|---|')
bad = 0
for (k, n, fb, fa, bb, ba), want in zip(ROWS, SPEC_AFTER):
    b, a = cr(fb, bb), cr(fa, ba)
    ok = abs(round(a, 2) - want) <= 0.011
    bad += (not ok)
    f = fb if fb == fa else '%s → %s' % (fb, fa); g = bb if bb == ba else '%s → %s' % (bb, ba)
    print('| %s | %s | `%s` | `%s` | %.2f | %.2f | %.2f%s |' % (k, n, f, g, b, a, want, '' if ok else ' MISMATCH'))
text = [cr(fa, ba) for (k, _, _, fa, _, ba) in ROWS if k.startswith('Text')]
drops = [n for (k, n, fb, fa, bb, ba) in ROWS if k.startswith('Graphic') and cr(fb, bb) >= 3 and cr(fa, ba) < 3]
print()
print('lowest text ratio after: %.2f (needs 4.5)' % min(text))
print('graphics that fall from >= 3:1 to below: %s' % (drops or 'none'))
# the head's source must use the 'after' colours
src = lambda p: open('games/lantern-bowl/' + p, encoding='utf8').read()
css, view, game, roster = src('style.css'), src('view.js'), src('game.js'), src('roster-view.js')
checks = {
 'style.css has no #10141c, #101820, #000 or #1a120c': not re.search(r'#10141c|#101820|#000\b|#000000|#1a120c', css, re.I),
 'style.css turbo text is #1e1a22': '#1e1a22' in css,
 'view.js has no #c9bc9a or #2a3040': not re.search(r'#c9bc9a|#2a3040', view, re.I),
 'view.js meter frame is #d9c89a': "ctx.fillStyle = '#d9c89a'" in view,
 'game.js knob is #d9c89a and no #c9bc9a': '#d9c89a' in game and '#c9bc9a' not in game,
 'roster-view.js panel is #141820': '--lbrv-panel:#141820' in roster,
}
for k, v in checks.items():
    print(('ok   ' if v else 'FAIL ') + k); bad += (not v)
sys.exit(1 if bad else 0)
