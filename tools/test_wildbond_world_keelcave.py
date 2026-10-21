"""WBW-14 planning checks. No map is loaded by the game and no save is written.

Run: python3 -m unittest tools/test_wildbond_world_keelcave.py
--runtime-landings is a separate pre-wiring gate and intentionally fails today.
"""
from collections import deque
from copy import deepcopy
from itertools import product
import json
import math
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
WORLD = ROOT / 'docs/plans/wildbond-world'
BLUEPRINT = WORLD / 'keelcave.json'
GAME = ROOT / 'wildbond-godot/data/wildbond.json'
DESIGN = ROOT / 'docs/plans/wildbond-world-design.md'
GRAPH = WORLD / 'world-graph.json'
GATES = WORLD / 'gates.json'
DIRECTIONS = {'up', 'down', 'left', 'right'}
APPROACH = 'greywash--keelcave:field:tide'
ENVELOPE = {'id', 'status', 'map', 'gates', 'zones', 'markers', 'layout', 'integration'}
MAP_KEYS = {'name', 'biome', 'start', 'rows', 'exits', 'signs', 'items', 'wild'}
UNIQUES = {'elderhorn', 'breakwatermane', 'hearthcrown', 'lanterncrest', 'stillwake',
           'undertone', 'meadowmantle', 'watchlight', 'veilmote'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def exact_keys(value, keys, label):
    require(isinstance(value, dict) and set(value) == keys, label + ': unexpected fields')


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'duplicate JSON key: ' + key)
        result[key] = value
    return result


def reject_constant(value):
    raise ValueError('non-finite JSON number: ' + value)


def finite_float(value):
    number = float(value)
    require(math.isfinite(number), 'non-finite JSON number: ' + value)
    return number


def load_json(text):
    return json.loads(text, object_pairs_hook=unique_object,
                      parse_constant=reject_constant, parse_float=finite_float)


def coordinate(value, width, height, label):
    require(isinstance(value, list) and len(value) == 2 and
            all(type(v) is int for v in value), label + ': expected integer [x, y]')
    x, y = value
    require(0 <= x < width and 0 <= y < height, label + ': out of bounds')
    return x, y


def reachable(rows, tiles, start, size=1):
    """Four-neighbour BFS of top-left footprints, not a runtime movement model."""
    width, height = len(rows[0]), len(rows)
    def fits(x, y):
        return all(0 <= x + i < width and 0 <= y + j < height and
                   not tiles[rows[y + j][x + i]].get('solid', 0)
                   for i in range(size) for j in range(size))
    origin = tuple(start)
    if not fits(*origin):
        return set()
    seen, todo = {origin}, deque([origin])
    while todo:
        x, y = todo.popleft()
        for point in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if point not in seen and fits(*point):
                seen.add(point)
                todo.append(point)
    return seen


def rect_tiles(rects, width, height):
    require(isinstance(rects, list) and rects, 'zone needs nonempty rects')
    points = set()
    for rect in rects:
        require(isinstance(rect, list) and len(rect) == 4 and
                all(type(v) is int for v in rect), 'rect must be integer [x,y,w,h]')
        x, y, w, h = rect
        require(w > 0 and h > 0 and 0 <= x and 0 <= y and x + w <= width and y + h <= height,
                'rect out of bounds')
        covered = {(x+i, y+j) for i in range(w) for j in range(h)}
        require(not covered & points, 'rects in one zone overlap')
        points |= covered
    return points


def source_records(source, field):
    require(isinstance(source, dict) and isinstance(source.get(field), list) and
            all(isinstance(row, dict) for row in source[field]), 'invalid source ' + field)
    return source[field]


def one_record(source, field, ident):
    found = [r for r in source_records(source, field) if r.get('id') == ident]
    require(len(found) == 1, 'source must contain one ' + ident)
    return found[0]


def validate_exit_landing(record, runtime=False):
    require(isinstance(record, dict), 'exit must be an object')
    base = {'to', 'x', 'y', 'dir'}
    require(set(record) in (base, base | {'landing'}), 'exit: unexpected fields')
    require(record['to'] == 'greywash', 'only Greywash may connect to Keelcave')
    if 'landing' in record:
        require(record['landing'] == 'planned', 'unknown landing marker')
        require(all(record[key] is None for key in ('x', 'y', 'dir')),
                'planned landing leaves x/y/dir null')
        require(not runtime, 'planned landing must be resolved before runtime wiring')
    else:
        require(all(type(record[key]) is int and record[key] >= 0 for key in ('x', 'y')),
                'resolved landing requires nonnegative integer coordinates')
        require(isinstance(record['dir'], str) and record['dir'] in DIRECTIONS,
                'resolved landing requires an arrival direction')


def validate_runtime_landings(data, game=None):
    """Reject unresolved/unsafe arrival tiles; this does not implement runtime gates."""
    if game is None:
        game = load_json(GAME.read_text(encoding='utf-8'))
    require(isinstance(data, dict) and isinstance(data.get('map'), dict), 'invalid runtime map')
    exits = data['map'].get('exits')
    exact_keys(exits, {'S'}, 'runtime exits')
    record = exits['S']
    validate_exit_landing(record, runtime=True)
    require(isinstance(game, dict) and isinstance(game.get('MAPS'), dict), 'missing MAPS source')
    target = game['MAPS'].get('greywash')
    require(isinstance(target, dict), 'runtime Greywash destination does not exist')
    rows = target.get('rows')
    require(isinstance(rows, list) and rows and all(isinstance(row, str) and row for row in rows),
            'destination needs rows')
    require(all(len(row) == len(rows[0]) for row in rows), 'destination must be rectangular')
    x, y = coordinate([record['x'], record['y']], len(rows[0]), len(rows), 'arrival')
    tiles = game.get('TILES')
    require(isinstance(tiles, dict) and all(ch in tiles and isinstance(tiles[ch], dict)
            for row in rows for ch in row), 'destination has unknown tiles')
    tile = tiles[rows[y][x]]
    require(not tile.get('solid', 0) and not tile.get('exit', 0),
            'arrival must be passable and must not immediately exit')


def approach_allowed(data, from_place, learned):
    """Test-only interpretation of the incoming requirement, not a live entry hook."""
    requirements = data['integration']['incoming_requirements']
    return from_place in requirements and set(requirements[from_place]) <= set(learned)


def validate(data, game=None, design=None, graph=None, gates=None):
    if game is None: game = load_json(GAME.read_text(encoding='utf-8'))
    if design is None: design = DESIGN.read_text(encoding='utf-8')
    if graph is None: graph = load_json(GRAPH.read_text(encoding='utf-8'))
    if gates is None: gates = load_json(GATES.read_text(encoding='utf-8'))
    exact_keys(data, ENVELOPE, 'blueprint')
    require(data['id'] == 'keelcave' and data['status'] == 'proposed', 'proposed Keelcave identity required')
    m = data['map']
    exact_keys(m, MAP_KEYS, 'map')
    require(m['name'] == 'Keelcave' and m['biome'] == 'saltmarsh', 'map identity drift')
    rows = m['rows']
    require(isinstance(rows, list) and 7 <= len(rows) <= 19 and
            all(isinstance(row, str) and row for row in rows), 'short cave needs nonempty rows')
    width, height = len(rows[0]), len(rows)
    require(9 <= width <= 29 and all(len(row) == width for row in rows), 'short rectangular grid required')
    tiles = game['TILES']
    require(all(ch in {'#', '.', '"', 'S'} and ch in tiles for row in rows for ch in row),
            'dry cave only uses existing dry floor, rock, encounter and south-exit glyphs')
    require(tiles['#'].get('solid') == 1 and all(not tiles[c].get('solid', 0) for c in '."S')
            and tiles['S'].get('exit') == 1 and not any(tiles[c].get('exit', 0) for c in '."'),
            'TILES collision contract changed')
    start = m['start']
    require(isinstance(start, list) and len(start) == 3, 'start must be [x,y,direction]')
    origin = coordinate(start[:2], width, height, 'start')
    require(isinstance(start[2], str) and start[2] in DIRECTIONS, 'invalid start direction')
    require(rows[origin[1]][origin[0]] == '.', 'start must be ordinary floor')
    walkable = {(x,y) for y,row in enumerate(rows) for x,ch in enumerate(row) if not tiles[ch].get('solid', 0)}
    require(reachable(rows, tiles, origin) == walkable, 'unreachable walkable tile')
    exact_keys(m['exits'], {'S'}, 'exits')
    validate_exit_landing(m['exits']['S'])
    require(m['exits']['S'].get('landing') == 'planned', 'unplaced Greywash landing must remain planned')
    mouth = sorted((x,y) for x,y in walkable if rows[y][x] == 'S')
    require(len(mouth) == 3 and all(y == height-1 for x,y in mouth) and
            [x for x,y in mouth] == list(range(mouth[0][0], mouth[0][0]+3)),
            'one three-tile mouth must be on the south edge')
    require(all((x,y) in mouth for x,y in walkable if x in (0,width-1) or y in (0,height-1)),
            'unregistered open boundary')
    require(all(rows[y][x] == '.' for x,_ in mouth for y in range(height-4,height-1)),
            'mouth needs a clear three-by-three dry approach')
    require(m['signs'] == {} and isinstance(m['signs'], dict), 'no new sign copy')
    require(m['items'] == [] and isinstance(m['items'], list), 'slip is an overlay, not a bag item')
    require(data['gates'] == [] and isinstance(data['gates'], list), 'no lesson obstacle inside the dry cave')

    zones = data['zones']
    require(isinstance(zones, list) and len(zones) == 2, 'dry cave and back ledge zones required')
    areas = {}
    for zone, (ident, kind) in zip(zones, [('dry-cave','dry'), ('back-ledge','ledge')]):
        exact_keys(zone, {'id','kind','rects'}, 'zone')
        require(zone['id'] == ident and zone['kind'] == kind, 'zone identity drift')
        areas[ident] = rect_tiles(zone['rects'], width, height)
        require(areas[ident] <= walkable, 'zone includes a wall')
    require(areas['dry-cave'] == walkable, 'every walkable tile must stay dry')
    ledge = areas['back-ledge']
    require(ledge and all(y < origin[1] for x,y in ledge) and not ledge & set(mouth),
            'ledge must be behind the chamber, not beside the mouth')
    top = min(y for x,y in walkable)
    require(min(y for x,y in ledge) == top and len({x for x,y in ledge}) >= 3,
            'back ledge must reach the back wall and leave room for a mount')
    markers = data['markers']
    require(isinstance(markers, list) and len(markers) == 1, 'one Rinse slip marker required')
    marker = markers[0]
    exact_keys(marker, {'id','kind','move','at'}, 'marker')
    require(marker['id'] == 'slip-rinse' and marker['kind'] == 'lesson-slip' and marker['move'] == 'rinse',
            'Rinse marker identity drift')
    at = coordinate(marker['at'], width, height, 'Rinse marker')
    require(at in ledge and rows[at[1]][at[0]] == '.', 'Rinse must sit on ordinary back-ledge floor')
    move = game['MOVES'].get('rinse')
    require(isinstance(move, dict) and move.get('name') == 'Rinse',
            'Rinse move source changed')
    layout = data['layout']
    exact_keys(layout, {'mouth_px','ceiling_px','mounts_allowed'}, 'layout')
    require(isinstance(layout['mouth_px'], list) and all(type(v) is int for v in layout['mouth_px']) and
            layout['mouth_px'] == [48,48], 'mouth is 48 by 48 pixels, not tiles')
    require(type(layout['ceiling_px']) is int and layout['ceiling_px'] == 48 and
            layout['mounts_allowed'] is True, '48px ceiling admits mounts')
    for mouth_x in (mouth[0][0], mouth[1][0]):
        mount_seen = reachable(rows, tiles, (mouth_x,height-2), size=2)
        require(origin in mount_seen and at in mount_seen, 'two-by-two mount cannot reach start and slip')

    for ident, name, kind in [('keelcave','Keelcave','cave'), ('greywash','Greywash Sound','water')]:
        place = one_record(graph, 'places', ident)
        require(place.get('name') == name and place.get('kind') == kind, 'graph place identity drift')
    links = [r for r in source_records(graph,'links') if r.get('a') == 'keelcave' or r.get('b') == 'keelcave']
    require(len(links) == 1, 'Keelcave must have exactly one graph connection')
    link = links[0]
    require(link.get('id') == 'greywash--keelcave' and link.get('a') == 'greywash' and
            link.get('b') == 'keelcave' and link.get('gate') == [{'field':'tide'}] and
            type(link.get('phase')) is int and link['phase'] == 6 and
            link.get('oneWay', False) is False, 'only the two-way Tide Ride approach from Greywash is allowed')
    gate = one_record(gates, 'gates', APPROACH)
    require(all(gate.get(k) == v for k,v in {'door':'greywash--keelcave','place':'greywash--keelcave',
            'kind':'field','key':'field:tide','teacher':'nerys','phase':6}.items()), 'approach gate source drift')
    lesson = one_record(gates, 'lessons', 'tide')
    tide_ready = {'element':'Tide', 'onWalkingTeam':True, 'mode':'any',
                  'conditions':[{'type':'level','min':18}, {'type':'bond','step':'Friendly','min':20}]}
    require(lesson.get('key') == 'field:tide' and lesson.get('teachingBadge') == 'tide' and
            gate.get('ready') == lesson.get('ready') == tide_ready,
            'approach must retain Tide Ride readiness')
    tide = one_record(gates, 'badges', 'tide')
    caps = game['CAP_TABLE']
    require(isinstance(caps,list) and len(caps) >= 3 and all(type(c) is int for c in caps), 'bad cap table')
    require(type(tide.get('order')) is int and tide['order'] == 2 and tide.get('capAfter') == caps[2],
            'Tide badge must be second and agree with CAP_TABLE')
    integration = data['integration']
    exact_keys(integration, {'status','destinations','incoming_requirements','approach_gate'}, 'integration')
    require(integration['status'] == 'unresolved_landings' and integration['destinations'] == ['greywash'],
            'Greywash must remain the sole unresolved destination')
    exact_keys(integration['incoming_requirements'], {'greywash'}, 'incoming requirements')
    require(integration['incoming_requirements']['greywash'] == ['field:tide'] and
            integration['approach_gate'] == APPROACH, 'incoming Greywash approach requires canonical Tide Ride')

    country = game['BIOMES']['saltmarsh']
    require(country.get('lv') == [12,22] and all(type(v) is int for v in country['lv']) and
            country.get('req') == 'thorn', 'Saltmarsh encounter source changed')
    require(country['lv'][1] <= caps[2], 'encounters exceed the Tide badge cap')
    wild = m['wild']
    require(isinstance(wild,list) and len(wild) == 10, 'all ten Saltmarsh encounters required')
    seen = set()
    for row in wild:
        require(isinstance(row,list) and len(row) == 2, 'encounter must be [species,weight]')
        species, weight = row
        require(isinstance(species,str) and species in game['SPECIES'] and species not in seen,
                'unknown or duplicate species')
        require(species not in UNIQUES and not game['SPECIES'][species].get('unique',False),
                'guardian may not be a normal encounter')
        require(type(weight) is int and weight > 0, 'weight must be a positive integer')
        seen.add(species)
    require(wild == country['wild'], 'Saltmarsh species and weights must stay unchanged')
    require(isinstance(design,str) and
            '3. **Keelcave** (`keelcave`). Off Greywash Sound. Needs Tide Ride to reach the sound, then a short dry cave. A Tide lesson slip is on the back ledge.' in design and
            '| `slip-rinse` | Rinse | Tide | Keelcave |' in design and
            '| Keelcave | 48×48px, the arch sitting on the waterline | 48px above the rideable water |' in design,
            'design cave, Rinse or doorway contract changed')
    return {'width':width, 'height':height, 'walkable':len(walkable), 'back_ledge':len(ledge),
            'species':len(wild), 'level_band':country['lv'][:], 'tide_cap':caps[2], 'destinations':['greywash']}


class KeelcaveTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load_json(BLUEPRINT.read_text(encoding='utf-8'))
        cls.game = load_json(GAME.read_text(encoding='utf-8'))
        cls.graph = load_json(GRAPH.read_text(encoding='utf-8'))
        cls.gates = load_json(GATES.read_text(encoding='utf-8'))
        cls.design = DESIGN.read_text(encoding='utf-8')

    def check(self, data, **sources):
        args = {'game':self.game, 'graph':self.graph, 'gates':self.gates, 'design':self.design}
        args.update(sources)
        return validate(data, **args)

    def rejects(self, path, value):
        bad = deepcopy(self.data)
        parent = bad
        for key in path[:-1]: parent = parent[key]
        if path: parent[path[-1]] = value
        else: bad = value
        with self.subTest(path=path,value=value):
            with self.assertRaises(ValueError): self.check(bad)

    def test_blueprint_and_sources(self):
        summary = self.check(self.data)
        self.assertEqual(summary, {'width':21,'height':15,'walkable':111,'back_ledge':21,
                                  'species':10,'level_band':[12,22],'tide_cap':35,'destinations':['greywash']})
        print('WBW-14 layout:', summary)

    def test_inputs_remain_unchanged(self):
        before = deepcopy([self.data,self.game,self.graph,self.gates])
        self.check(self.data)
        self.assertEqual([self.data,self.game,self.graph,self.gates],before)

    def test_greywash_is_the_only_approach_for_every_lesson_combination(self):
        keys = ['field:stone','field:tide','field:grove','field:lantern','field:glide','field:hush','field:daymark']
        for bits in product((False,True),repeat=7):
            learned = {k for k,b in zip(keys,bits) if b}
            for place in [p['id'] for p in self.graph['places']]+['unknown']:
                self.assertEqual(approach_allowed(self.data,place,learned), place == 'greywash' and 'field:tide' in learned)

    def test_every_mouth_tile_reaches_the_dry_cave_and_slip(self):
        m = self.data['map']; rows = m['rows']; tiles = self.game['TILES']
        all_tiles = reachable(rows,tiles,m['start'][:2])
        for x in (9,10,11):
            self.assertEqual(reachable(rows,tiles,(x,14)),all_tiles)
        self.assertIn((10,3),all_tiles)
        for start in ((9,13),(10,13)):
            self.assertIn((10,3),reachable(rows,tiles,start,size=2))
        self.assertIn((9,13),reachable(rows,tiles,(10,3),size=2))

    def test_nested_values_reject_wrong_types(self):
        paths=[]
        def walk(value,path):
            paths.append((path,value))
            if isinstance(value,dict):
                for key,v in value.items(): walk(v,path+[key])
            elif isinstance(value,list):
                for i,v in enumerate(value): walk(v,path+[i])
        walk(self.data,[])
        count=0
        for path,value in paths:
            replacements = [None] if value is not None else [0,False,[],{}]
            if isinstance(value,(dict,list)): replacements += ['invalid',False,2.5]
            for replacement in replacements:
                self.rejects(path,replacement); count+=1
        print('WBW-14 malformed nested values rejected:',count)

    def test_objects_reject_missing_or_extra_fields(self):
        paths=[]
        def walk(value,path):
            if isinstance(value,dict):
                paths.append((path,value))
                for k,v in value.items(): walk(v,path+[k])
            elif isinstance(value,list):
                for i,v in enumerate(value): walk(v,path+[i])
        walk(self.data,[])
        count=0
        for path,obj in paths:
            for key in list(obj)+['unexpected']:
                bad=deepcopy(obj)
                if key in bad: del bad[key]
                else: bad[key]=None
                self.rejects(path,bad); count+=1
        print('WBW-14 malformed object fields rejected:',count)

    def test_no_second_exit_or_open_border(self):
        for target in ['saltmarsh','saltmarsh_pool','lanternquay','opengrey','tidegrotto','']:
            self.rejects(['map','exits','S','to'],target)
        self.rejects(['map','exits'],{**self.data['map']['exits'],'E':deepcopy(self.data['map']['exits']['S'])})
        for x,y,ch in [(0,6,'.'),(10,0,'.'),(10,3,'S'),(20,6,'E'),(9,14,'#')]:
            rows=self.data['map']['rows'][:];rows[y]=rows[y][:x]+ch+rows[y][x+1:]
            self.rejects(['map','rows'],rows)

    def test_dry_short_reachable_and_mount_safe_layout(self):
        for x,y,ch in [(10,3,'~'),(10,5,'#'),(9,5,'#'),(10,11,'"'),(1,1,'.')]:
            rows=self.data['map']['rows'][:];rows[y]=rows[y][:x]+ch+rows[y][x+1:]
            self.rejects(['map','rows'],rows)
        self.rejects(['map','rows'],self.data['map']['rows']+['#'*21]*5)
        self.rejects(['layout','mouth_px'],[48,32])
        self.rejects(['layout','ceiling_px'],32)
        self.rejects(['layout','mounts_allowed'],False)
        self.rejects(['gates'],[{'key':'field:lantern','at':[10,5]}])

    def test_rinse_on_back_ledge(self):
        for path,value in [(['markers',0,'at'],[10,11]),(['markers',0,'at'],[0,0]),
                           (['markers',0,'move'],'mistVeil'),(['markers',0,'id'],'rinse'),
                           (['markers',0,'kind'],'quest-prop'),(['markers'],[]),
                           (['zones',1,'rects'],[[9,12,3,2]]),(['zones',1,'rects'],[[0,0,3,3]]),
                           (['zones',0,'kind'],'wet'),(['map','items'],[['slip-rinse',1]])]:
            self.rejects(path,value)
        game=deepcopy(self.game);del game['MOVES']['rinse']
        with self.assertRaises(ValueError):self.check(self.data,game=game)
        game=deepcopy(self.game);game['MOVES']['rinse']['name']='Mist Veil'
        with self.assertRaises(ValueError):self.check(self.data,game=game)

    def test_exact_saltmarsh_encounters_and_tide_cap(self):
        for weight in [0,-1,True,1.5,'24']:
            self.rejects(['map','wild',0,1],weight)
        for species in sorted(UNIQUES)+['unknown','pebblepaw','kilnback']:
            self.rejects(['map','wild',0,0],species)
        self.rejects(['map','wild',1],self.data['map']['wild'][0])
        self.rejects(['map','wild'],self.data['map']['wild'][::-1])
        for band in [[12,23],[True,22],[12,36]]:
            game=deepcopy(self.game);game['BIOMES']['saltmarsh']['lv']=band
            with self.assertRaises(ValueError):self.check(self.data,game=game)
        game=deepcopy(self.game);gates=deepcopy(self.gates)
        game['CAP_TABLE'][2]=21;gates['badges'][1]['capAfter']=21
        with self.assertRaisesRegex(ValueError,'exceed'):self.check(self.data,game=game,gates=gates)
        game=deepcopy(self.game);game['SPECIES']['brineskit']['unique']=True
        with self.assertRaises(ValueError):self.check(self.data,game=game)

    def test_graph_cannot_add_another_way_in_or_drop_tide(self):
        for field,value in [('a','saltmarsh'),('b','opengrey'),('gate',[]),('oneWay',True),('phase',2)]:
            graph=deepcopy(self.graph)
            edge=next(r for r in graph['links'] if r['id']=='greywash--keelcave');edge[field]=value
            with self.assertRaises(ValueError):self.check(self.data,graph=graph)
        for a,b in [('saltmarsh','keelcave'),('keelcave','saltmarsh'),('greywash','keelcave')]:
            graph=deepcopy(self.graph);graph['links'].append({'id':'extra','a':a,'b':b,'gate':[],'phase':6})
            with self.assertRaises(ValueError):self.check(self.data,graph=graph)
        graph=deepcopy(self.graph);graph['links']=[r for r in graph['links'] if r['id']!='greywash--keelcave']
        with self.assertRaises(ValueError):self.check(self.data,graph=graph)
        for ident in ('greywash','keelcave'):
            graph=deepcopy(self.graph);graph['places']=[p for p in graph['places'] if p['id']!=ident]
            with self.assertRaises(ValueError):self.check(self.data,graph=graph)

    def test_approach_source_and_local_requirement_must_agree(self):
        self.rejects(['integration','incoming_requirements'],{'greywash':[]})
        self.rejects(['integration','incoming_requirements'],{'greywash':['field:lantern']})
        self.rejects(['integration','approach_gate'],'greywash--keelcave')
        for key,value in [('key','field:lantern'),('teacher','toren'),('ready',{}),('door','other'),('phase',2)]:
            gates=deepcopy(self.gates);gate=next(g for g in gates['gates'] if g['id']==APPROACH);gate[key]=value
            with self.assertRaises(ValueError):self.check(self.data,gates=gates)
        gates=deepcopy(self.gates);gates['gates']=[g for g in gates['gates'] if g['id']!=APPROACH]
        with self.assertRaises(ValueError):self.check(self.data,gates=gates)
        for original,replacement in [('short dry cave','long flooded cave'),('back ledge','front room'),
                                     ('| `slip-rinse` | Rinse | Tide | Keelcave |','| `slip-rinse` | Rinse | Tide | Lowbell |')]:
            with self.assertRaises(ValueError):self.check(self.data,design=self.design.replace(original,replacement))

    def test_planned_exit_never_guesses_arrival(self):
        for field in ('x','y','dir'):
            for value in [0,False,'up']:
                self.rejects(['map','exits','S',field],value)
        for value in [None,False,'resolved']:
            self.rejects(['map','exits','S','landing'],value)
        bad=deepcopy(self.data['map']['exits']['S']);del bad['landing']
        self.rejects(['map','exits','S'],bad)
        with self.assertRaisesRegex(ValueError,'planned landing must be resolved'):
            validate_runtime_landings(self.data,self.game)

    def test_runtime_gate_only_accepts_real_safe_resolved_arrivals(self):
        data=deepcopy(self.data);game=deepcopy(self.game)
        data['map']['exits']['S']={'to':'greywash','x':1,'y':1,'dir':'up'}
        with self.assertRaisesRegex(ValueError,'does not exist'):validate_runtime_landings(data,game)
        game['MAPS']['greywash']={'rows':['####','#..#','#..#','####']}
        validate_runtime_landings(data,game)
        for key,value in [('x',True),('x',1.5),('x',-1),('x',4),('y',None),('dir',None),('dir',[]),('to','saltmarsh')]:
            bad=deepcopy(data);bad['map']['exits']['S'][key]=value
            with self.assertRaises(ValueError):validate_runtime_landings(bad,game)
        for rows in [[],None,['#','#.'],['####','#S.#','#..#','####'],['####','####','#..#','####'],['####','#?.#','#..#','####']]:
            bad=deepcopy(game);bad['MAPS']['greywash']['rows']=rows
            with self.assertRaises(ValueError):validate_runtime_landings(data,bad)

    def test_strict_json(self):
        for text in ['{"a":1,"a":2}','{"x":{"a":1,"a":2}}','[NaN]','[Infinity]','[-Infinity]',
                     '[1e999]','[-1e999]','{"a":01}','{"a":1,}']:
            with self.assertRaises(ValueError):load_json(text)
        self.assertEqual(load_json('{"a":null}'),{'a':None})


if __name__ == '__main__':
    if '--runtime-landings' in sys.argv:
        try:
            validate_runtime_landings(load_json(BLUEPRINT.read_text(encoding='utf-8')))
        except ValueError as error:
            print('Runtime landing gate:',error)
            sys.exit(1)
        print('Runtime landings are resolved and safe; other wiring remains separate.')
    else:
        unittest.main()
