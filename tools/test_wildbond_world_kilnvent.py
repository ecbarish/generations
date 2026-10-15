"""Validate the WBW-8 planning blueprint for the Kilnvent; this does not load a game map.

Run from the repository root: python3 -m unittest tools/test_wildbond_world_kilnvent.py
Standalone, like the WBW-2 and WBW-6 tests: it reads the game's data and the design and changes nothing.
The two destination landings stay explicitly unresolved until the map owner places them.
"""

from collections import deque
from copy import deepcopy
import json
import math
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
BLUEPRINT = ROOT / "docs/plans/wildbond-world/kilnvent.json"
GAME = ROOT / "wildbond-godot/data/wildbond.json"
DESIGN = ROOT / "docs/plans/wildbond-world-design.md"
GATES = ROOT / "docs/plans/wildbond-world/gates.json"
GRAPH = ROOT / "docs/plans/wildbond-world/world-graph.json"
DIRECTIONS = {"up", "down", "left", "right"}
FIELD_KEYS = {"field:lantern"}
ENVELOPE = {"id", "map", "gates", "zones", "markers", "layout", "integration"}
MAP_KEYS = {"name", "biome", "start", "rows", "exits", "signs", "items", "wild"}
GATE_KEYS = {"id", "door", "key", "at", "beyond"}
EXIT_TARGETS = {"S": "ashstair", "E": "sootpath"}
ZONES = [("lit-chamber", "lit"), ("warm-dark", "dark")]
STONE_QUEST = "sq-sela-warmth"
ERRANDS = ROOT / "docs/plans/wildbond-world/errands.json"
GATE_IDS = {"kilnvent-deep-room:field:lantern", "kilnvent--sootpath:field:lantern"}


def reject_constant(value):
    raise ValueError(f"Non-finite JSON number: {value}")


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Duplicate JSON key: {key}")
        result[key] = value
    return result


def finite_float(value):
    number = float(value)
    if not math.isfinite(number):
        raise ValueError(f"Non-finite JSON number: {value}")
    return number


def load_json(text):
    return json.loads(text, object_pairs_hook=unique_object, parse_constant=reject_constant,
                      parse_float=finite_float)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def exact_keys(value, keys, label):
    require(isinstance(value, dict) and set(value) == keys, f"{label}: unexpected fields")


def coordinate(value, width, height, label):
    require(isinstance(value, list) and len(value) == 2, f"{label}: expected [x, y]")
    require(all(type(v) is int for v in value), f"{label}: coordinates must be integers")
    x, y = value
    require(0 <= x < width and 0 <= y < height, f"{label}: coordinate out of bounds")
    return x, y


def reachable(rows, tiles, start, blocked=()):
    """Four-neighbour BFS on the grid; a closed gate is an overlay that blocks a walkable tile."""
    width, height = len(rows[0]), len(rows)
    blocked = set(blocked)
    start = tuple(start)
    if start in blocked or tiles[rows[start[1]][start[0]]].get("solid", 0):
        return set()
    seen, queue = {start}, deque([start])
    while queue:
        x, y = queue.popleft()
        for point in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            nx, ny = point
            if not (0 <= nx < width and 0 <= ny < height):
                continue
            if point in seen or point in blocked or tiles[rows[ny][nx]].get("solid", 0):
                continue
            seen.add(point)
            queue.append(point)
    return seen


def body_reachable(rows, tiles, start, size, blocked=()):
    """Where a body `size` tiles wide and tall can stand, as top-left corners. A mount needs room, not a single tile."""
    width, height = len(rows[0]), len(rows)
    blocked = set(blocked)

    def fits(x, y):
        return all(0 <= x + i < width and 0 <= y + j < height and (x + i, y + j) not in blocked
                   and not tiles[rows[y + j][x + i]].get("solid", 0) for i in range(size) for j in range(size))
    start = tuple(start)
    if not fits(*start):
        return set()
    seen, queue = {start}, deque([start])
    while queue:
        x, y = queue.popleft()
        for point in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if point not in seen and fits(*point):
                seen.add(point)
                queue.append(point)
    return seen


def rect_tiles(rects, width, height, label):
    require(isinstance(rects, list) and rects, f"{label}: rects must be a nonempty list")
    out = set()
    for rect in rects:
        require(isinstance(rect, list) and len(rect) == 4 and all(type(v) is int for v in rect), f"{label}: a rect is [x, y, w, h]")
        x, y, w, h = rect
        require(w >= 1 and h >= 1 and 0 <= x and 0 <= y and x + w <= width and y + h <= height, f"{label}: rect out of bounds")
        out |= {(x + i, y + j) for i in range(w) for j in range(h)}
    return out


def validate_exit_landing(exit_record, *, runtime=False):
    """Only a visibly planned exit may carry null destination fields."""
    require(isinstance(exit_record, dict), "exit must be an object")
    base = {"to", "x", "y", "dir"}
    require(set(exit_record) in (base, base | {"landing"}), "exit: unexpected fields")
    require(isinstance(exit_record["to"], str) and bool(exit_record["to"]), "exit needs a destination id")
    planned = exit_record.get("landing") == "planned"
    if "landing" in exit_record:
        require(planned, "unknown landing marker")
    if planned:
        require(all(exit_record[key] is None for key in ("x", "y", "dir")),
                "planned landing must leave position and arrival direction explicitly null")
        require(not runtime, "planned landing must be resolved before runtime wiring")
    else:
        require(all(type(exit_record[key]) is int and exit_record[key] >= 0 for key in ("x", "y")),
                "unmarked landing requires nonnegative integer x/y")
        require(isinstance(exit_record["dir"], str) and exit_record["dir"] in DIRECTIONS,
                "resolved landing requires an arrival direction")


def validate_runtime_landings(data, game=None):
    """Pre-wiring gate: no planned marker, every landing exists and is safe.

    It does not wire the blueprint into the engine or check its other runtime behaviour. The current planning file must fail it.
    """
    if game is None:
        game = load_json(GAME.read_text(encoding="utf-8"))
    require(isinstance(data, dict) and isinstance(data.get("map"), dict), "runtime map must be an object")
    exits = data["map"].get("exits")
    exact_keys(exits, set(EXIT_TARGETS), "runtime exits")
    for glyph, exit_record in exits.items():
        validate_exit_landing(exit_record, runtime=True)
        target = exit_record["to"]
        require(target == EXIT_TARGETS[glyph], "runtime exit target differs from the designed connection")
        require(target in game["MAPS"], "runtime destination map does not exist")
        rows = game["MAPS"][target]["rows"]
        x, y = coordinate([exit_record["x"], exit_record["y"]], len(rows[0]), len(rows), "landing")
        tile = game["TILES"][rows[y][x]]
        require(not tile.get("solid", 0) and not tile.get("exit", 0),
                "runtime landing must be passable and must not immediately exit again")


def validate(data, game=None, design=None, gates=None, graph=None, errands=None):
    """Validate planning data, not runtime readiness. Never mutate any input."""
    if game is None: game = load_json(GAME.read_text(encoding="utf-8"))
    if design is None: design = DESIGN.read_text(encoding="utf-8")
    if gates is None: gates = load_json(GATES.read_text(encoding="utf-8"))
    if graph is None: graph = load_json(GRAPH.read_text(encoding="utf-8"))
    if errands is None: errands = load_json(ERRANDS.read_text(encoding="utf-8"))
    exact_keys(data, ENVELOPE, "blueprint")
    require(data["id"] == "kilnvent", "id must be kilnvent")
    m = data["map"]
    exact_keys(m, MAP_KEYS, "map")
    require(m["name"] == "Kilnvent" and m["biome"] == "emberfall", "map identity drift")
    rows = m["rows"]
    require(isinstance(rows, list) and len(rows) >= 3, "rows must be a nonempty rectangular grid")
    require(all(isinstance(row, str) and row for row in rows), "rows must be nonempty strings")
    width, height = len(rows[0]), len(rows)
    require(width >= 3 and all(len(row) == width for row in rows), "rows must be rectangular")
    tiles = game["TILES"]
    require(all(ch in {'#', '.', '"', 'S', 'E'} and ch in tiles for row in rows for ch in row), "unknown or unplanned TILES glyph")
    require(tiles['#'].get('solid') == 1 and all(not tiles[c].get('solid', 0) for c in '."SE')
            and all(tiles[c].get('exit') == 1 for c in 'SE'), "TILES collision contract changed")
    start = m["start"]
    require(isinstance(start, list) and len(start) == 3, "start must be [x, y, direction]")
    origin = coordinate(start[:2], width, height, "start")
    require(isinstance(start[2], str) and start[2] in DIRECTIONS, "invalid start direction")
    require(rows[origin[1]][origin[0]] == '.', "start must be ordinary floor")
    walkable = {(x, y) for y, row in enumerate(rows) for x, ch in enumerate(row) if not tiles[ch].get("solid", 0)}
    require(reachable(rows, tiles, origin) == walkable, "unreachable walkable tile")

    # The graph and gate sheet are current source references, not copied IDs that
    # can silently drift away from the later integration task.
    for place, name, kind in [('kilnvent', 'Kilnvent', 'cave'), ('ashstair', 'Ashstair', 'route'), ('sootpath', 'Sootpath', 'route')]:
        matches = [p for p in graph['places'] if p.get('id') == place]
        require(len(matches) == 1 and matches[0]['name'] == name and matches[0]['kind'] == kind, "graph place contract changed: " + place)
    for link_id, a, b, requirement in [('ashstair--kilnvent', 'ashstair', 'kilnvent', []),
                                       ('kilnvent--sootpath', 'kilnvent', 'sootpath', [{'field': 'lantern'}])]:
        matches = [link for link in graph['links'] if link.get('id') == link_id]
        require(len(matches) == 1 and matches[0]['a'] == a and matches[0]['b'] == b
                and matches[0]['gate'] == requirement and matches[0]['phase'] == 3, "graph link contract changed: " + link_id)
    require('4. **Kilnvent** (`kilnvent`)' in design and
            '| `slip-ember-mantle` | Ember Mantle | Ember | Kilnvent, after Lantern |' in design,
            "design cave or lesson source changed")
    exact_keys(m['exits'], set(EXIT_TARGETS), "exits")
    for glyph, record in m['exits'].items():
        validate_exit_landing(record)
        require(record['to'] == EXIT_TARGETS[glyph], "exit target differs from designed connection")
        require(record.get('landing') == 'planned', "both unplaced destination landings must be planned")
    exit_points = {(x, y) for x, y in walkable if tiles[rows[y][x]].get('exit', 0)}
    require({rows[y][x] for x, y in exit_points} == set(EXIT_TARGETS), "exit glyph and record mismatch")
    require(all((rows[y][x] == 'S' and y == height - 1) or (rows[y][x] == 'E' and x == width - 1)
                for x, y in exit_points), "exit is off its matching edge")
    mouth = sorted(p for p in exit_points if rows[p[1]][p[0]] == 'S')
    far = sorted(p for p in exit_points if rows[p[1]][p[0]] == 'E')
    require(len(mouth) == 3 and [p[0] for p in mouth] == list(range(mouth[0][0], mouth[0][0] + 3)), "mouth needs three adjacent tiles")
    require(len(far) == 3 and [p[1] for p in far] == list(range(far[0][1], far[0][1] + 3)), "far door needs three adjacent tiles")
    require(all((x, y) in walkable for x in range(mouth[0][0], mouth[0][0] + 3) for y in range(height - 4, height - 1)), "mouth needs a clear 3 by 3 approach")
    require(all(p in exit_points for p in walkable if p[0] in (0, width - 1) or p[1] in (0, height - 1)), "unregistered open border")
    require(m['signs'] == {}, "no new sign copy")
    require(m['items'] == [], "markers are planning overlays, not inventory items")

    # No WILD_EXTRA: extras are runtime-map keyed. Kilnvent uses the unchanged
    # country table named in design section 5, including its inherited levels.
    country = game['BIOMES']['emberfall']
    require(country['lv'] == [22, 32] and all(type(v) is int for v in country['lv']), "Emberfall band must stay 22 to 32")
    require(country['req'] == 'tide', "Emberfall first-visit badge changed")
    caps = game['CAP_TABLE']
    require(isinstance(caps, list) and len(caps) >= 4 and all(type(c) is int for c in caps), "CAP_TABLE must contain integer badge caps")
    badge_rows = gates['badges']
    badges = [b['id'] for b in badge_rows]
    require(badges[:3] == ['thorn', 'tide', 'ember'], "Tide and Ember badge counts changed")
    require(all(badge_rows[i]['order'] == i + 1 and badge_rows[i]['capAfter'] == caps[i + 1] for i in (1, 2)), 'badge sheet cap changed')
    require(all(country['lv'][1] <= caps[badges.index(badge) + 1] for badge in ('tide', 'ember')), "encounters exceed the Tide or Ember badge cap")
    wild = m['wild']
    require(isinstance(wild, list) and len(wild) == 12, "exactly twelve Emberfall species required")
    seen = set()
    for entry in wild:
        require(isinstance(entry, list) and len(entry) == 2, "wild row must be [species, weight]")
        species, weight = entry
        require(isinstance(species, str) and species in game['SPECIES'] and species not in seen, "unknown or duplicate species")
        require(species not in {'kilnback', 'hearthstag', 'hearthcrown'} and not game['SPECIES'][species].get('unique', False), "guardian or unsigned Kilnback in wild table")
        require(type(weight) is int and weight > 0, "wild weight must be a positive integer")
        seen.add(species)
    require(wild == country['wild'], "keep the complete Emberfall table and weights unchanged")

    records = data['gates']
    require(isinstance(records, list) and len(records) == 2, "exactly two Lantern gates required")
    source = [g for g in gates['gates'] if g.get('place') in ('kilnvent', 'kilnvent--sootpath')]
    require(len(source) == 2 and {g['id'] for g in source} == GATE_IDS, "canonical gate sheet changed")
    by_source = {g['id']: g for g in source}
    by_id, closed = {}, set()
    for gate in records:
        exact_keys(gate, GATE_KEYS, 'gate')
        ident = gate['id']
        require(isinstance(ident, str) and ident in GATE_IDS and ident not in by_id, "invalid or duplicate canonical gate id")
        s = by_source[ident]
        require(gate['door'] == s['door'] == ident.rsplit(':field:', 1)[0] and gate['key'] == s['key'] == 'field:lantern'
                and s['teacher'] == 'toren' and s['kind'] == 'field' and s['phase'] == 3, "gate source contract changed")
        require(isinstance(gate['at'], list) and len(gate['at']) >= 2, "gate needs a multi-tile barrier")
        points = [coordinate(p, width, height, ident) for p in gate['at']]
        require(len(set(points)) == len(points) and not (set(points) & closed), "duplicate gate tile")
        require(all(rows[y][x] == '.' for x, y in points) and origin not in points, "gate must overlay ordinary floor away from start")
        beyond = coordinate(gate['beyond'], width, height, 'gate witness')
        require(rows[beyond[1]][beyond[0]] == '.' and beyond != origin, "witness must be distinct ordinary floor")
        by_id[ident] = (set(points), beyond)
        closed.update(points)
    require(not ({b for _, b in by_id.values()} & closed), "witness cannot be a gate")
    no_lantern = reachable(rows, tiles, origin, closed)
    require(set(mouth) <= no_lantern and not (set(far) & no_lantern), "first chamber return or Lantern-gated onward exit broken")
    for ident, (points, beyond) in by_id.items():
        alone_closed = reachable(rows, tiles, origin, points)
        require(beyond not in alone_closed, "gate can be bypassed: " + ident)
        require(any(p in alone_closed for x, y in points for p in ((x-1,y),(x+1,y),(x,y-1),(x,y+1))), "closed gate is not approachable")
    deep_barrier, deep_witness = by_id['kilnvent-deep-room:field:lantern']
    far_barrier, _ = by_id['kilnvent--sootpath:field:lantern']
    reverse_closed = reachable(rows, tiles, far[0], closed)
    require(origin not in reverse_closed and deep_witness not in reverse_closed, "Sootpath can bypass Lantern")

    zones = data['zones']
    require(isinstance(zones, list) and len(zones) == 2, "two lighting zones required")
    zone_tiles = []
    for zone, (ident, kind) in zip(zones, ZONES):
        exact_keys(zone, {'id', 'kind', 'rects'}, 'zone')
        require(zone['id'] == ident and zone['kind'] == kind, "lighting zone identity changed")
        cells = rect_tiles(zone['rects'], width, height, ident)
        require(cells <= walkable and not (cells & closed), "zone covers a wall or gate")
        zone_tiles.append(cells)
    lit, dark = zone_tiles
    require(lit == no_lantern and origin in lit, "lit chamber must cover exactly the ungated first room")
    require(dark == reachable(rows, tiles, deep_witness, closed), "warm-dark zone must cover the whole protected chamber")
    require(not (dark & lit) and not (dark & reverse_closed) and not (dark & exit_points), "darkness bypass, overlap or exit")
    require(walkable == lit | dark | closed | reverse_closed, "an unclassified side pocket escapes the gate/lighting contract")
    for barrier in (deep_barrier, far_barrier):
        require(not (dark & reachable(rows, tiles, origin if barrier == deep_barrier else far[0], barrier)), "one Lantern barrier can be bypassed")
    require(any(rows[y][x] == '"' for x, y in lit) and any(rows[y][x] == '"' for x, y in dark), "both chambers need encounter patches")

    markers = data['markers']
    require(isinstance(markers, list) and len(markers) == 2, "exactly the slip and warm stone markers required")
    slip, stone = markers
    exact_keys(slip, {'id', 'kind', 'move', 'at'}, 'slip')
    require(slip['id'] == 'slip-ember-mantle' and slip['kind'] == 'lesson-slip' and slip['move'] == 'emberMantle', "Ember Mantle slip identity changed")
    require('emberMantle' in game['MOVES'] and game['MOVES']['emberMantle']['name'] == 'Ember Mantle', "Ember Mantle source move missing")
    exact_keys(stone, {'id', 'kind', 'quest', 'at'}, 'stone')
    require(stone['id'] == 'sela-warm-stone' and stone['kind'] == 'quest-prop' and stone['quest'] == STONE_QUEST, "Sela warm-stone marker changed")
    quests = [q for q in errands['errands'] if q.get('id') == STONE_QUEST]
    require(len(quests) == 1, "warm-stone quest source missing or duplicated")
    recover = [s for s in quests[0]['steps'] if s.get('kind') == 'recover']
    require(len(recover) == 1 and recover[0]['locations'] == [{'map': 'kilnvent'}]
            and recover[0]['requires']['fields'] == ['field:lantern'] and recover[0]['object'] == 'warm stone', "Sela recovery source changed")
    marker_points = [coordinate(mk['at'], width, height, 'marker') for mk in markers]
    require(len(set(marker_points)) == 2 and all(p in dark and rows[p[1]][p[0]] == '.' and p not in closed for p in marker_points), "markers need distinct ordinary floor in the warm dark")

    layout = data['layout']
    exact_keys(layout, {'mouth_px', 'ceiling_px', 'mounts_allowed'}, 'layout')
    require(isinstance(layout['mouth_px'], list) and all(type(v) is int for v in layout['mouth_px']) and layout['mouth_px'] == [48,48], "mouth must be 48 by 48px")
    require(type(layout['ceiling_px']) is int and layout['ceiling_px'] == 48 and layout['mounts_allowed'] is True, "48px ceiling must admit mounts")
    mount_start = (mouth[0][0], height - 3)
    mount_all = body_reachable(rows, tiles, mount_start, 2)
    require(deep_witness in mount_all and all(p in mount_all for p in marker_points)
            and (width - 2, far[0][1]) in mount_all, "2 by 2 mount cannot reach the deep room, markers and far door")
    require(origin in body_reachable(rows, tiles, mount_start, 2, closed), "mount cannot enter the lit chamber")
    integration = data['integration']
    exact_keys(integration, {'status', 'destinations', 'incoming_requirements'}, 'integration')
    require(integration['status'] == 'unresolved_landings' and integration['destinations'] == ['ashstair','sootpath'], "unresolved destinations must remain explicit")
    require(integration['incoming_requirements'] == {'sootpath':['field:lantern']}, "Sootpath incoming door requires Lantern; Ashstair mouth adds no local gate")
    return {'width':width, 'height':height, 'walkable':len(walkable), 'lit':len(lit), 'dark':len(dark),
            'species':len(wild), 'level_band':country['lv'], 'tide_cap':caps[2], 'ember_cap':caps[3], 'markers':len(markers)}


class KilnventTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load_json(BLUEPRINT.read_text(encoding='utf-8'))
        cls.game = load_json(GAME.read_text(encoding='utf-8'))
        cls.design = DESIGN.read_text(encoding='utf-8')
        cls.gates = load_json(GATES.read_text(encoding='utf-8'))
        cls.graph = load_json(GRAPH.read_text(encoding='utf-8'))
        cls.errands = load_json(ERRANDS.read_text(encoding='utf-8'))

    def check(self, data, **sources):
        args = {'game': self.game, 'design': self.design, 'gates': self.gates,
                'graph': self.graph, 'errands': self.errands}
        args.update(sources)
        return validate(data, **args)

    def test_blueprint_and_source_contract(self):
        summary = self.check(self.data)
        self.assertEqual(summary, {'width':31, 'height':21, 'walkable':254, 'lit':98, 'dark':145,
                                 'species':12, 'level_band':[22,32], 'tide_cap':35, 'ember_cap':45, 'markers':2})
        print('WBW-8 layout:', summary)

    def test_inputs_are_not_mutated(self):
        inputs = [self.data, self.game, self.gates, self.graph, self.errands]
        before = deepcopy(inputs)
        self.check(self.data)
        self.assertEqual(inputs, before)

    def test_both_entries_and_all_lesson_combinations(self):
        from itertools import product
        m = self.data['map']; rows = m['rows']; tiles = self.game['TILES']
        all_tiles = reachable(rows, tiles, m['start'][:2])
        dark = rect_tiles(self.data['zones'][1]['rects'], 31, 21, 'dark')
        lit = rect_tiles(self.data['zones'][0]['rects'], 31, 21, 'lit')
        entrances = [(x,y) for y,row in enumerate(rows) for x,c in enumerate(row) if c in 'SE']
        for choices in product((False,True), repeat=4):
            learned = {key for key, yes in zip(('field:lantern','field:stone','field:hush','field:grove'), choices) if yes}
            blocked = {tuple(p) for g in self.data['gates'] if g['key'] not in learned for p in g['at']}
            for start in entrances + [tuple(m['start'][:2])]:
                with self.subTest(learned=learned, start=start):
                    seen = reachable(rows, tiles, start, blocked)
                    if 'field:lantern' in learned:
                        self.assertEqual(seen, all_tiles)
                    else:
                        self.assertFalse(dark & seen)
                        if rows[start[1]][start[0]] != 'E': self.assertEqual(seen, lit)
                    for marker in self.data['markers']:
                        self.assertEqual(tuple(marker['at']) in seen, 'field:lantern' in learned)

    def test_each_gate_is_independently_a_barrier(self):
        m = self.data['map']; tiles = self.game['TILES']
        for gate in self.data['gates']:
            blocked = [tuple(p) for p in gate['at']]
            self.assertNotIn(tuple(gate['beyond']), reachable(m['rows'], tiles, m['start'][:2], blocked))
            self.assertIn(tuple(gate['beyond']), reachable(m['rows'], tiles, m['start'][:2]))

    def test_mount_clearance_both_directions(self):
        m = self.data['map']; tiles = self.game['TILES']
        closed = [tuple(p) for g in self.data['gates'] for p in g['at']]
        for start in [(4,18), (29,6)]:
            open_seen = body_reachable(m['rows'], tiles, start, 2)
            self.assertIn((5,17), open_seen)
            for marker in self.data['markers']: self.assertIn(tuple(marker['at']), open_seen)
            shut_seen = body_reachable(m['rows'], tiles, start, 2, closed)
            for marker in self.data['markers']: self.assertNotIn(tuple(marker['at']), shut_seen)

    def test_every_required_value_rejects_null_or_wrong_shape(self):
        # Walk every nested field, including every row, coordinate, gate and
        # species. Nulls are legal only at the six planned landing positions.
        paths = []
        def walk(value, path):
            paths.append((path,value))
            if isinstance(value,dict):
                for k,v in value.items(): walk(v,path+[k])
            elif isinstance(value,list):
                for i,v in enumerate(value): walk(v,path+[i])
        walk(self.data, [])
        rejected = 0
        for path,value in paths:
            replacements = [None] if value is not None else [0, False, [], {}]
            if isinstance(value, (dict,list)): replacements += ['invalid', False, 2.5]
            for replacement in replacements:
                bad = deepcopy(self.data)
                if not path: bad = replacement
                else:
                    parent = bad
                    for k in path[:-1]: parent = parent[k]
                    parent[path[-1]] = replacement
                with self.subTest(path=path, replacement=replacement):
                    with self.assertRaises(ValueError): self.check(bad)
                rejected += 1
        print('WBW-8 malformed nested values rejected:', rejected)

    def test_all_objects_reject_extra_or_missing_fields(self):
        paths = []
        def walk(value,path):
            if isinstance(value,dict):
                paths.append((path,value))
                for k,v in value.items(): walk(v,path+[k])
            elif isinstance(value,list):
                for i,v in enumerate(value): walk(v,path+[i])
        walk(self.data,[])
        count = 0
        for path,obj in paths:
            for key in list(obj) + ['unexpected']:
                bad = deepcopy(self.data); target = bad
                for k in path: target = target[k]
                if key == 'unexpected': target[key] = True
                else: del target[key]
                with self.subTest(path=path,key=key):
                    with self.assertRaises(ValueError): self.check(bad)
                count += 1
        print('WBW-8 malformed object schemas rejected:', count)

    def test_gate_identity_and_bypass_mutations(self):
        cases = []
        def add(change):
            bad = deepcopy(self.data); change(bad); cases.append(bad)
        add(lambda d:d['gates'][0].update(id='dark-line'))
        add(lambda d:d['gates'][1].update(id=d['gates'][0]['id']))
        add(lambda d:d['gates'][1].update(key='field:stone'))
        add(lambda d:d['gates'][0].update(door='answering-dark-hall'))
        add(lambda d:d['gates'][0]['at'].pop())
        add(lambda d:d['gates'][1]['at'].pop())
        add(lambda d:d['gates'][0]['at'].append(d['gates'][0]['at'][0]))
        add(lambda d:d['gates'][0].update(beyond=[5,17]))
        add(lambda d:d['integration'].update(incoming_requirements={}))
        add(lambda d:d['integration'].update(incoming_requirements={'ashstair':['tide'],'sootpath':['field:lantern']}))
        # Add a route around each wall, leaving the claimed barrier intact.
        for y,x in [(11,15),(5,28)]:
            bad = deepcopy(self.data)
            row = list(bad['map']['rows'][y]); row[x] = '.'; bad['map']['rows'][y] = ''.join(row)
            cases.append(bad)
        for bad in cases:
            with self.assertRaises(ValueError): self.check(bad)

    def test_marker_and_lighting_mutations(self):
        for field,value in [('id','slip-standing-stone'),('kind','item'),('move','standingStone'),('at',[5,17]),('at',[18,4]),('at',[30,6])]:
            bad=deepcopy(self.data);bad['markers'][0][field]=value
            with self.subTest(field=field,value=value):
                with self.assertRaises(ValueError):self.check(bad)
        for value in [[21,5],[5,17],[28,7],[25,10],[0,0]]:
            bad=deepcopy(self.data);bad['markers'][1]['at']=value
            with self.assertRaises(ValueError):self.check(bad)
        for zone,index,value in [(0,'kind','dark'),(1,'kind','lit'),(1,'rects',[[17,3,10,13]]),(1,'rects',[[2,11,11,8]]),(0,'rects',[[2,11,10,8]])]:
            bad=deepcopy(self.data);bad['zones'][zone][index]=value
            with self.assertRaises(ValueError):self.check(bad)

    def test_geometry_and_mount_mutations(self):
        cases=[]
        for x,y,ch in [(0,10,'.'),(5,17,'#'),(4,19,'#'),(15,12,'#'),(16,13,'#'),(30,7,'#'),(3,3,'.'),(3,12,'~')]:
            bad=deepcopy(self.data);row=list(bad['map']['rows'][y]);row[x]=ch;bad['map']['rows'][y]=''.join(row);cases.append(bad)
        bad=deepcopy(self.data);bad['map']['rows'][0]+='#';cases.append(bad)
        for key,value in [('mouth_px',[48,32]),('ceiling_px',32),('mounts_allowed',False)]:
            bad=deepcopy(self.data);bad['layout'][key]=value;cases.append(bad)
        for bad in cases:
            with self.assertRaises(ValueError):self.check(bad)

    def test_encounter_table_is_exact_and_cap_safe(self):
        for value in [0,-1,True,1.5,float('inf'),'24']:
            bad=deepcopy(self.data);bad['map']['wild'][0][1]=value
            with self.assertRaises(ValueError):self.check(bad)
        for species in ['kilnback','hearthstag','hearthcrown','elderhorn','pebblepaw','not-a-species']:
            bad=deepcopy(self.data);bad['map']['wild'][0][0]=species
            with self.assertRaises(ValueError):self.check(bad)
        bad=deepcopy(self.data);bad['map']['wild'][1]=bad['map']['wild'][0]
        with self.assertRaises(ValueError):self.check(bad)
        bad=deepcopy(self.data);bad['map']['wild'].reverse()
        with self.assertRaises(ValueError):self.check(bad)
        for band in [[22,36],[22,46],[True,32],[23,32]]:
            game=deepcopy(self.game);game['BIOMES']['emberfall']['lv']=band
            with self.assertRaises(ValueError):self.check(self.data,game=game)
        for i in (2,3):
            game=deepcopy(self.game);game['CAP_TABLE'][i]=31
            gates=deepcopy(self.gates);gates['badges'][i-1]['capAfter']=31
            with self.assertRaisesRegex(ValueError,'exceed'):self.check(self.data,game=game,gates=gates)

    def test_source_reference_drift(self):
        for ident in ['kilnvent','ashstair','sootpath']:
            graph=deepcopy(self.graph);graph['places']=[p for p in graph['places'] if p['id']!=ident]
            with self.assertRaises(ValueError):self.check(self.data,graph=graph)
        for ident in ['ashstair--kilnvent','kilnvent--sootpath']:
            graph=deepcopy(self.graph);graph['links']=[p for p in graph['links'] if p['id']!=ident]
            with self.assertRaises(ValueError):self.check(self.data,graph=graph)
        for ident in GATE_IDS:
            gates=deepcopy(self.gates);gates['gates']=[g for g in gates['gates'] if g['id']!=ident]
            with self.assertRaises(ValueError):self.check(self.data,gates=gates)
        game=deepcopy(self.game);del game['MOVES']['emberMantle']
        with self.assertRaises(ValueError):self.check(self.data,game=game)
        game=deepcopy(self.game);game['SPECIES']['slaglet']['unique']=True
        with self.assertRaises(ValueError):self.check(self.data,game=game)
        errands=deepcopy(self.errands);errands['errands']=[q for q in errands['errands'] if q['id']!=STONE_QUEST]
        with self.assertRaises(ValueError):self.check(self.data,errands=errands)
        with self.assertRaises(ValueError):self.check(self.data,design=self.design.replace('Kilnvent, after Lantern','Kilnvent, before Lantern'))

    def test_strict_json_loading(self):
        invalid = ['{"id":1,"id":2}', '{"x":{"a":1,"a":2}}', '[NaN]', '[Infinity]', '[-Infinity]', '[1e999]', '[-1e999]', '{"x":1,}', '{"x":01}']
        for raw in invalid:
            with self.assertRaises(ValueError):load_json(raw)
        self.assertEqual(load_json('{"x":null}'), {'x':None})

    def test_planned_landing_contract(self):
        for glyph in ('S','E'):
            for field in ('x','y','dir'):
                for value in (0,False,'up'):
                    bad=deepcopy(self.data);bad['map']['exits'][glyph][field]=value
                    with self.assertRaises(ValueError):self.check(bad)
            for marker in (None,'resolved',True):
                bad=deepcopy(self.data);bad['map']['exits'][glyph]['landing']=marker
                with self.assertRaises(ValueError):self.check(bad)
            bad=deepcopy(self.data);del bad['map']['exits'][glyph]['landing']
            with self.assertRaises(ValueError):self.check(bad)

    def test_runtime_gate_rejects_current_planning_file(self):
        with self.assertRaisesRegex(ValueError,'planned landing must be resolved before runtime wiring'):
            validate_runtime_landings(self.data,self.game)

    def test_runtime_gate_accepts_only_safe_resolved_landings(self):
        data=deepcopy(self.data);game=deepcopy(self.game)
        for glyph,target in EXIT_TARGETS.items():
            data['map']['exits'][glyph]={'to':target,'x':1,'y':1,'dir':'up'}
            game['MAPS'][target]={'rows':['###','#.#','###']}
        validate_runtime_landings(data,game)
        for glyph in EXIT_TARGETS:
            for key,value in [('x',True),('x',1.5),('x',-1),('x',3),('y',None),('dir',None),('dir','north'),('to','not-a-map')]:
                bad=deepcopy(data);bad['map']['exits'][glyph][key]=value
                with self.assertRaises(ValueError):validate_runtime_landings(bad,game)
            for ch in ('#','S','E'):
                badgame=deepcopy(game);badgame['MAPS'][EXIT_TARGETS[glyph]]['rows'][1]='#'+ch+'#'
                with self.assertRaises(ValueError):validate_runtime_landings(data,badgame)
            badgame=deepcopy(game);del badgame['MAPS'][EXIT_TARGETS[glyph]]
            with self.assertRaises(ValueError):validate_runtime_landings(data,badgame)


if __name__ == '__main__':
    if sys.argv[1:] == ['--runtime-landings']:
        try:
            validate_runtime_landings(load_json(BLUEPRINT.read_text(encoding='utf-8')))
        except ValueError as error:
            print(error, file=sys.stderr)
            sys.exit(1)
        print('All destination landings are safe; other runtime integration is still separate.')
    else:
        unittest.main()
