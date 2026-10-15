"""Validate WBW-5 planning data; this does not load or change a runtime map.

Run: python3 -m unittest tools/test_wildbond_world_route_encounters.py
No packages, engine, network or writes are needed. New standalone tests are not
part of normal CI yet; paste their output in the PR as well as checking CI.
"""

from copy import deepcopy
import json
import math
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'docs/plans/wildbond-world/route-encounters.json'
NOTES = ROOT / 'docs/plans/wildbond-world/route-encounters.md'
GAME = ROOT / 'wildbond-godot/data/wildbond.json'
EVOLUTION = ROOT / 'wildbond-godot/data/evolution.json'
BACKLOG = ROOT / 'docs/plans/guest-backlog.md'
DESIGN = ROOT / 'docs/plans/wildbond-world-design.md'
GATES = ROOT / 'docs/plans/wildbond-world/gates.json'
GRAPH = ROOT / 'docs/plans/wildbond-world/world-graph.json'
MAIN = ROOT / 'wildbond-godot/scripts/main.gd'
PHASE = 'WB-WORLD-1'
# These are conservative first-visit safety floors, not new runtime locks.
# Orchard Fen uses Reedhold's four-badge floor, since its exact rope is unspecified.
# Trial Road uses seven; all eight are required at its LAST exit to the league.
FLOOR_BADGE = {
    'millgrass': None, 'dewcut': None, 'rootwater': None,
    'wrackline': 'thorn', 'ashstair': 'tide', 'sootpath': 'ember',
    'passfoot': 'beacon', 'longboards': 'beacon', 'orchardfen': 'beacon',
    'latepath': 'reed', 'flintcut': 'reed', 'ribbonroad': 'echo',
    'sheltermile': 'loom', 'chartroad': 'loom', 'seaward': 'loom', 'trialroad': 'loom',
}
# Gate records supporting those floors, read from WBW-6 when it exists.
GATE_ANCHORS = {
    'thorn': 'thornwood--saltmarsh_route', 'tide': 'saltmarsh--ashstair',
    'ember': 'emberfall--sootpath', 'beacon': 'cloudglass--passfoot',
    'reed': 'stillreed--latepath', 'echo': 'hollowecho--ribbonroad',
    'loom': 'sunthread--sheltermile',
}
UNIQUE_IDS = {'elderhorn', 'breakwatermane', 'hearthcrown', 'lanterncrest',
              'stillwake', 'undertone', 'meadowmantle', 'watchlight', 'veilmote'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def exact_keys(value, keys, label):
    require(isinstance(value, dict) and set(value) == set(keys),
            f'{label}: unexpected fields')


def reject_constant(value):
    raise ValueError(f'Non-finite JSON number: {value}')


def finite_float(value):
    result = float(value)
    require(math.isfinite(result), 'Non-finite JSON number')
    return result


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, f'Duplicate JSON key: {key}')
        result[key] = value
    return result


def load_json(text):
    return json.loads(text, object_pairs_hook=unique_object,
                      parse_constant=reject_constant, parse_float=finite_float)


def load(path):
    return load_json(path.read_text(encoding='utf-8'))


def expected_routes(backlog):
    """Read the row's country assignments, not adjacent rows or narrative IDs."""
    section = backlog.split('## WBW-5: Encounter tables for the 16 new routes', 1)[1]
    section = section.split('\n## WBW-4:', 1)[0]
    result = {}
    for country, ids in re.findall(r'^  - ([A-Za-z]+): ([a-z, ]+)$', section, re.M):
        for route in ids.split(', '):
            require(route not in result, f'duplicate backlog route {route}')
            result[route] = country.lower()
    require(len(result) == 16 and set(result) == set(FLOOR_BADGE),
            'WBW-5 route scope changed; reconcile its contract')
    return result


def route_names(design):
    section = design.split('### Routes (20)', 1)[1].split('### Towns (10)', 1)[0]
    return dict(re.findall(r'^\| \d+ \| `([^`]+)` \| ([^|]+?) \|', section, re.M))


def source_contract():
    game, evolution = load(GAME), load(EVOLUTION)
    routes = expected_routes(BACKLOG.read_text(encoding='utf-8'))
    names = route_names(DESIGN.read_text(encoding='utf-8'))
    require(set(routes) <= set(names), 'route absent from design route table')
    species = game['SPECIES'] | evolution['species']
    badges = list(game['BADGES'])
    require(badges == ['thorn', 'tide', 'ember', 'beacon', 'reed', 'echo', 'loom', 'horizon'],
            'badge progression changed; reconcile first-visit floors')
    caps = game['CAP_TABLE']
    require(len(caps) == len(badges) + 1 and
            all(type(n) is int and n > 0 for n in caps), 'invalid source cap table')
    pools = {biome: {p[0] for p in game['BIOMES'][biome]['wild']} |
             {p[0] for p in evolution.get('wild', {}).get(biome, [])}
             for biome in set(routes.values())}
    # WILD_EXTRA is keyed by MAP ID. A country's main map shares its biome ID.
    # Do not pool extras from unrelated maps, or even a special pocket such as
    # thornwood_grove: those encounters belong to that pocket, not every road.
    for biome in pools:
        require(game['MAPS'][biome]['biome'] == biome, 'country map/biome changed')
        require(pools[biome] <= species.keys(), 'source encounter has unknown species')
    return dict(routes=routes, names=names, species=species, pools=pools,
                biomes=game['BIOMES'], badges=badges, caps=caps,
                floors={route: 0 if badge is None else badges.index(badge) + 1
                        for route, badge in FLOOR_BADGE.items()})


def positive_finite(value):
    if type(value) not in (int, float) or value <= 0:
        return False
    try:
        return math.isfinite(value)
    except OverflowError:
        return False


def validate(data, source=None, phase=PHASE):
    """Raise ValueError on invalid data. Return the input, without modifying it.

    phase is the prospective consumer's phase, independent of the file's label.
    A future open-order consumer must not silently reuse phase-one level bands.
    """
    source = source_contract() if source is None else source
    require(phase == PHASE, 'phase change requires a new encounter-level contract')
    exact_keys(data, {'schemaVersion', 'phase', 'routes'}, 'root')
    require(type(data['schemaVersion']) is int and data['schemaVersion'] == 1,
            'schemaVersion must be 1')
    require(data['phase'] == PHASE, 'phase must be WB-WORLD-1')
    exact_keys(data['routes'], source['routes'], 'routes')
    for route, country in source['routes'].items():
        row = data['routes'][route]
        exact_keys(row, {'biome', 'lv', 'wild'}, route)
        require(row['biome'] == country, f'{route}: wrong parent biome')
        lv = row['lv']
        require(isinstance(lv, list) and len(lv) == 2 and
                all(type(n) is int for n in lv), f'{route}: expected two integer levels')
        low, high = lv
        parent_low, parent_high = source['biomes'][country]['lv']
        require(parent_low <= low <= high <= parent_high,
                f'{route}: level band outside parent country')
        cap = source['caps'][source['floors'][route]]
        require(high <= cap, f'{route}: level band exceeds first-visit cap {cap}')
        wild = row['wild']
        require(isinstance(wild, list) and len(wild) > 0, f'{route}: empty or invalid wild table')
        seen, weights = set(), []
        for pair in wild:
            require(isinstance(pair, list) and len(pair) == 2,
                    f'{route}: wild must use [species, weight] pairs')
            species, weight = pair
            require(isinstance(species, str) and species in source['species'],
                    f'{route}: unknown species')
            require(species not in seen, f'{route}: duplicate species {species}')
            seen.add(species)
            require(species in source['pools'][country], f'{route}: foreign-country species {species}')
            require(species not in UNIQUE_IDS and not source['species'][species].get('unique', False),
                    f'{route}: unique species forbidden')
            require(species != 'kilnback', f'{route}: Kilnback is excluded')
            # bool is an int subclass; enormous JSON ints can overflow float().
            require(positive_finite(weight), f'{route}: weight must be positive and finite')
            weights.append(weight)
        try:
            total = math.fsum(weights)
        except OverflowError:
            raise ValueError(f'{route}: weight total must be finite') from None
        require(math.isfinite(total) and total > 0, f'{route}: invalid weight total')
    return data


class RouteEncounters(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load(DATA)
        cls.source = source_contract()

    def test_data_passes_without_mutation(self):
        before = deepcopy(self.data)
        self.assertIs(validate(self.data, self.source), self.data)
        self.assertEqual(self.data, before)

    def test_exact_design_scope_and_country_assignments(self):
        self.assertEqual(len(self.source['routes']), 16)
        self.assertEqual(self.source['routes']['passfoot'], 'cloudglass')
        self.assertNotIn('glassfall', self.data['routes'])
        self.assertNotIn('crestpath', self.data['routes'])
        self.assertNotIn('thornwood_route', self.data['routes'])
        self.assertNotIn('saltmarsh_route', self.data['routes'])

    def test_all_species_are_known_country_members_and_nonunique(self):
        for route, row in self.data['routes'].items():
            pool = self.source['pools'][row['biome']]
            for species, weight in row['wild']:
                self.assertIn(species, pool, route)
                self.assertNotIn(species, UNIQUE_IDS | {'kilnback'}, route)
                self.assertFalse(self.source['species'][species].get('unique', False), route)
                self.assertGreater(weight, 0)
        self.assertEqual({s for s, row in self.source['species'].items() if row.get('unique')}, UNIQUE_IDS)
        self.assertNotIn('glassharrier', self.source['pools']['thornwood'])
        self.assertIn('creekribbon', self.source['pools']['saltmarsh'])

    def test_bands_fit_countries_and_conservative_first_visits(self):
        for route, row in self.data['routes'].items():
            count = self.source['floors'][route]
            self.assertLessEqual(row['lv'][1], self.source['caps'][count], route)
        self.assertEqual(self.source['floors']['rootwater'], 0)
        self.assertEqual(self.source['floors']['orchardfen'], 4)
        self.assertEqual(self.source['floors']['trialroad'], 7)

    def test_gates_support_phase_one_badge_floors(self):
        if not GATES.exists():
            self.skipTest('WBW-6 gates.json is not present')
        gates = load(GATES)
        for badge, door in GATE_ANCHORS.items():
            records = [g for g in gates['gates'] if g['door'] == door and g['kind'] == 'badge']
            self.assertEqual([g['key'] for g in records], [badge], door)
            self.assertEqual(records[0]['ready']['badge'], badge)
        self.assertEqual([b['id'] for b in gates['badges']], self.source['badges'])
        self.assertEqual([b['capAfter'] for b in gates['badges']], self.source['caps'][1:])
        league = [g['key'] for g in gates['gates'] if g['door'] == 'trialstair--league' and g['kind'] == 'badge']
        self.assertEqual(league, self.source['badges'])

    def test_world_graph_has_all_sixteen_routes_in_phase_one(self):
        if not GRAPH.exists():
            self.skipTest('WBW-3 world-graph.json is not present')
        graph = load(GRAPH)
        places = {p['id']: p for p in graph['places']}
        for route in self.source['routes']:
            self.assertEqual(places[route]['kind'], 'route', route)
            self.assertEqual(places[route]['phase'], 1, route)
        # Existing graph exposes Orchard Fen's unresolved rope. Do not infer
        # safe runtime reachability from this graph, or silently add a gate.
        thorn = [e for e in graph['links'] if e['id'] == 'thornwood--rootwater']
        self.assertEqual(thorn[0]['gate'], [])

    def test_design_phase_and_level_consumer_are_explicit(self):
        design = DESIGN.read_text(encoding='utf-8')
        self.assertIn('This phase keeps today\'s ropes', design)
        self.assertIn('Orchard Fen and Ribbon Road stay behind those same later ropes', design)
        self.assertIn('Trial Road reaches the league in this phase', design)
        main = MAIN.read_text(encoding='utf-8')
        self.assertIn('DATA["WILD_EXTRA"] = ej.data.get("wild", {})', main)
        self.assertIn('base = DATA.MAPS[map_name].wild', main)
        self.assertIn('DATA.get("WILD_EXTRA", {}).get(map_name, [])', main)
        self.assertIn('var biome: Dictionary = DATA.BIOMES[DATA.MAPS[map_name].biome]', main)
        self.assertIn('int(biome.lv[0]), int(biome.lv[1])', main)

    def test_open_order_cannot_reuse_phase_one_bands(self):
        with self.assertRaisesRegex(ValueError, 'phase change'):
            validate(self.data, self.source, phase='WB-WORLD-ORDER')
        two_badge_cap = self.source['caps'][2]
        incompatible = {country for country in set(self.source['routes'].values())
                        if self.source['biomes'][country]['lv'][0] > two_badge_cap}
        self.assertEqual(incompatible, {'stillreed', 'hollowecho', 'sunthread', 'farwatch'})

    def test_weights_are_relative_and_tables_are_distinct(self):
        signatures = set()
        for row in self.data['routes'].values():
            total = math.fsum(w for _, w in row['wild'])
            self.assertEqual(total, 100)
            self.assertAlmostEqual(sum(w / total for _, w in row['wild']), 1.0)
            signature = tuple(sorted((species, weight / total) for species, weight in row['wild']))
            self.assertNotIn(signature, signatures)
            signatures.add(signature)
        # 100 is a presentation choice, not a runtime/schema requirement.
        scaled = deepcopy(self.data)
        for row in scaled['routes'].values():
            for pair in row['wild']:
                pair[1] *= 0.125
        validate(scaled, self.source)
        # A single large finite weight is valid; only a non-finite sum fails.
        large = deepcopy(self.data)
        large['routes']['millgrass']['wild'] = [['seedpip', 1.5e308]]
        validate(large, self.source)

    def test_source_changes_are_not_hidden_by_cached_species_or_caps(self):
        source = deepcopy(self.source)
        source['caps'][4] = 45
        with self.assertRaisesRegex(ValueError, 'cap'):
            validate(self.data, source)
        source = deepcopy(self.source)
        source['pools']['saltmarsh'].remove('creekribbon')
        with self.assertRaisesRegex(ValueError, 'foreign-country'):
            validate(self.data, source)
        source = deepcopy(self.source)
        source['species']['seedpip']['unique'] = True
        with self.assertRaisesRegex(ValueError, 'unique'):
            validate(self.data, source)

    def test_strict_json_rejects_duplicates_and_nonfinite_numbers(self):
        cases = ['{"a":1,"a":2}', '{"routes":{"x":1,"x":2}}',
                 '{"x":NaN}', '{"x":Infinity}', '{"x":-Infinity}',
                 '{"x":1e999}', '{"x":-1e999}', '{"x":1,}']
        for text in cases:
            with self.subTest(text=text), self.assertRaises(ValueError):
                load_json(text)
        self.assertEqual(load_json(json.dumps(self.data)), self.data)

    def test_malformed_data_is_rejected(self):
        cases = []
        def add(label, edit):
            bad = deepcopy(self.data)
            edit(bad)
            cases.append((label, bad))
        odd = [None, False, 7, 'bad', []]
        for value in odd:
            cases.append(('root type', value))
            add('routes type', lambda d, v=value: d.__setitem__('routes', v))
        for key in self.data:
            add('missing root ' + key, lambda d, k=key: d.pop(k))
        for value in [True, 0, 2, 1.0, '1', None]:
            add('schema version', lambda d, v=value: d.__setitem__('schemaVersion', v))
        for value in [None, 1, [], 'WB-WORLD-ORDER', 'WB-WORLD-2']:
            add('phase', lambda d, v=value: d.__setitem__('phase', v))
        add('extra root', lambda d: d.__setitem__('runtime', True))
        add('extra route', lambda d: d['routes'].__setitem__('crestpath', deepcopy(d['routes']['passfoot'])))
        for route in self.data['routes']:
            add('missing route', lambda d, r=route: d['routes'].pop(r))
            for value in odd:
                add('row type', lambda d, r=route, v=value: d['routes'].__setitem__(r, v))
            for key in ['biome', 'lv', 'wild']:
                add('missing row field', lambda d, r=route, k=key: d['routes'][r].pop(k))
            add('extra row field', lambda d, r=route: d['routes'][r].__setitem__('locked', 'horizon'))
            add('wrong country', lambda d, r=route: d['routes'][r].__setitem__('biome', 'league'))
            country = self.source['routes'][route]
            lower, upper = self.source['biomes'][country]['lv']
            for value in [None, '2,3', [], [2], [2, 3, 4], [False, 3], [2.0, 3],
                          [lower - 1, lower], [upper, upper + 1], [upper, lower]]:
                add('bad level band', lambda d, r=route, v=value: d['routes'][r].__setitem__('lv', v))
            for value in [None, False, 1, 'bad', {}, [], [None], [['seedpip']], [['seedpip', 1, 2]]]:
                add('wild shape', lambda d, r=route, v=value: d['routes'][r].__setitem__('wild', v))
            for value in [0, -1, True, None, '1', [], {}, float('nan'), float('inf'),
                          -float('inf'), 10**400]:
                add('bad weight', lambda d, r=route, v=value: d['routes'][r]['wild'][0].__setitem__(1, v))
            for value in [None, False, 1, [], {}, 'greysail', 'missing']:
                add('bad species', lambda d, r=route, v=value: d['routes'][r]['wild'][0].__setitem__(0, v))
            add('duplicate species', lambda d, r=route: d['routes'][r]['wild'].append(deepcopy(d['routes'][r]['wild'][0])))
            add('weight sum overflow', lambda d, r=route: [p.__setitem__(1, 1e308) for p in d['routes'][r]['wild']])
        for route in ['longboards', 'orchardfen', 'latepath', 'flintcut', 'ribbonroad', 'chartroad', 'seaward', 'trialroad']:
            cap = self.source['caps'][self.source['floors'][route]]
            add('inside country but over cap', lambda d, r=route, c=cap: d['routes'][r].__setitem__('lv', [c, c + 1]))
        for species in sorted(UNIQUE_IDS | {'kilnback', 'glassharrier', 'brineskit'}):
            add('forbidden or foreign species', lambda d, s=species: d['routes']['millgrass']['wild'][0].__setitem__(0, s))
        # Kilnback IS in Emberfall WILD_EXTRA; prove the explicit exclusion.
        add('in-country Kilnback', lambda d: d['routes']['ashstair']['wild'][0].__setitem__(0, 'kilnback'))
        for label, bad in cases:
            with self.subTest(case=label), self.assertRaises(ValueError):
                validate(bad, self.source)
        print(f'WBW-5 malformed fixtures: {len(cases)} rejected.')

    def test_notes_cover_route_contract_and_handoff(self):
        notes = NOTES.read_text(encoding='utf-8')
        for route in self.data['routes']:
            self.assertIn(f'`{route}`', notes)
        for text in ['WB-WORLD-ORDER', 'Orchard Fen', 'Trial Road', '_wild_battle()',
                     'WILD_EXTRA', 'Kilnback', 'No runtime', 'No save-format']:
            self.assertIn(text, notes)


if __name__ == '__main__':
    unittest.main()
