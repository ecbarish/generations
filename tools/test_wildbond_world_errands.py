#!/usr/bin/env python3
"""Standalone WBW-1 data validation; no game or save writes. Standard library only."""
from copy import deepcopy
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'docs/plans/wildbond-world/errands.json'
DESIGN = ROOT / 'docs/plans/wildbond-world-design.md'
WORLD = ROOT / 'wildbond-godot/data/wildbond.json'
IDS = ('sq-nora-bird', 'sq-isolde-path', 'sq-tobin-tally', 'sq-sela-warmth',
       'sq-vessa-beacon', 'sq-lowbell', 'sq-senna-stones', 'sq-halen-passing',
       'sq-rysa-skiffs', 'sq-spire-memory')
GIVERS = ('pip_gran', 'isolde', 'tobin', 'sela', 'vessa', 'tavil', 'senna',
          'halen', 'rysa', 'orla')
TOWNS = ('larkhaven', 'thornwood', 'saltmarsh_route', 'emberfall', 'cloudglass',
         'stillreed', 'hollowecho', 'sunthread', 'farwatch', 'league')
FIELDS = {'field:' + s for s in ('stone', 'tide', 'grove', 'lantern', 'glide', 'hush', 'daymark')}
NAMED_PLACES = {'Lantern Quay', 'Outer Shoal'}
KINDS = {'hear', 'recover', 'return', 'find', 'escort', 'observe', 'return-object',
         'help', 'lesson', 'light', 'listen', 'report', 'arrange', 'carry', 'finish',
         'deliver', 'remember', 'reflect'}
KEY_RE = re.compile(r'sq:[a-z-]+:(heard|step|done)\Z')
CARGO = ('Nora’s thread', 'Bram’s dried mushroom', 'Perrin’s quay knot',
         'Sela’s warm nail', 'Ilka’s rope splice', 'Juna’s reed bundle',
         'Veslin’s spare echo stone', 'Mirel’s ribbon', 'Delka’s corrected chart')
CARGO_FROM = ('pip_gran', 'bram', None, 'sela', 'ilka', None, 'veslin', 'mirel', 'delka')
CARGO_TO = ('bram', None, 'sela', 'ilka', None, 'veslin', 'mirel', 'delka', 'halen')


def load_json(path):
    """Reject duplicate keys and JavaScript non-finite extensions, not just bad JSON."""
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError('Duplicate JSON key: ' + key)
            result[key] = value
        return result

    def constant(value):
        raise ValueError('Non-finite JSON number: ' + value)

    return json.loads(Path(path).read_text(encoding='utf-8'),
                      object_pairs_hook=pairs, parse_constant=constant)


def source_references(world=None, design=None):
    world = load_json(WORLD) if world is None else world
    design = DESIGN.read_text(encoding='utf-8') if design is None else design
    section = design.split('## 2. The connected map\n', 1)[1].split('\n## 3.', 1)[0]
    # Route/water tables and parenthesized cave IDs are the actual machine-ID declarations.
    planned = set(re.findall(r'^\|(?: \d+ \|)? `([a-z_]+)` \|', section, re.M))
    planned.update(re.findall(r'\(`([a-z_]+)`\)', section))
    return {'actors': set(world['CAST']) | {'pip_gran'}, 'badges': set(world['BADGES']),
            'maps': set(world['MAPS']) | planned, 'design': design, 'world': world}


def validate_document(document, references=None):
    """Return actionable errors for arbitrary input, without modifying it or raising."""
    refs = source_references() if references is None else references
    errors = []

    def fail(path, message):
        errors.append(f'{path}: {message}')

    def obj(value, required, path, optional=()):
        if not isinstance(value, dict):
            fail(path, 'must be an object')
            return False
        if set(value) != set(required) | (set(value) & set(optional)):
            fail(path, 'missing or unknown fields')
        return True

    def text(value, path, short=False):
        if not isinstance(value, str) or not value.strip() or value != value.strip():
            fail(path, 'must be a nonempty trimmed string')
            return False
        if '\n' in value or '\r' in value or any(ord(c) < 32 for c in value):
            fail(path, 'must be one printable line')
        if short and len(value) > 120:
            fail(path, 'log exceeds 120 code points')
        return True

    def one(value, allowed, path):
        if not isinstance(value, str) or value not in allowed:
            fail(path, 'unknown reference')

    def unique_list(value, allowed, path):
        if not isinstance(value, list):
            fail(path, 'must be an array')
            return
        seen = set()
        for i, item in enumerate(value):
            one(item, allowed, f'{path}[{i}]')
            if isinstance(item, str):
                if item in seen:
                    fail(path, 'duplicate reference')
                seen.add(item)

    def gates(value, path):
        if obj(value, ('badges', 'fields', 'maps', 'story'), path):
            for key, allowed in [('badges', refs['badges']), ('fields', FIELDS),
                                 ('maps', refs['maps']), ('story', {'leagueEnding'})]:
                unique_list(value.get(key), allowed, path + '.' + key)

    def location(value, path):
        if not isinstance(value, dict) or len(value) != 1:
            fail(path, 'must contain exactly map or place')
        elif 'map' in value:
            one(value['map'], refs['maps'], path + '.map')
        elif 'place' in value:
            one(value['place'], NAMED_PLACES, path + '.place')
        else:
            fail(path, 'unknown location form')

    if not obj(document, ('schemaVersion', 'errands'), '$'):
        return errors
    if type(document.get('schemaVersion')) is not int or document['schemaVersion'] != 1:
        fail('schemaVersion', 'must be integer 1')
    errands = document.get('errands')
    if not isinstance(errands, list):
        return errors + ['errands: must be an array']
    if [q.get('id') if isinstance(q, dict) else None for q in errands] != list(IDS):
        fail('errands', 'must contain exactly the ten design IDs in order')
    for qi, q in enumerate(errands):
        path = f'errands[{qi}]'
        if not obj(q, ('id', 'town', 'giver', 'requires', 'log', 'storyKeys', 'steps', 'rewards'), path):
            continue
        id = q.get('id')
        one(id, IDS, path + '.id')
        one(q.get('giver'), refs['actors'], path + '.giver')
        if obj(q.get('town'), ('name', 'map'), path + '.town'):
            text(q['town'].get('name'), path + '.town.name')
            one(q['town'].get('map'), refs['maps'], path + '.town.map')
        gates(q.get('requires'), path + '.requires')
        text(q.get('log'), path + '.log', True)
        expected_keys = {phase: f'sq:{id}:{phase}' for phase in ('heard', 'step', 'done')}
        if q.get('storyKeys') != expected_keys:
            fail(path + '.storyKeys', 'must contain only this errand’s three exact keys')
        if isinstance(q.get('storyKeys'), dict):
            for key in q['storyKeys'].values():
                if not isinstance(key, str) or not KEY_RE.fullmatch(key):
                    fail(path + '.storyKeys', 'key fails sq grammar')
        rewards = q.get('rewards')
        if not isinstance(rewards, dict):
            fail(path + '.rewards', 'must be an object')
        else:
            for key, value in rewards.items():
                if key not in {'lures', 'coins', 'berries'} or type(value) is not int or value <= 0:
                    fail(path + '.rewards', 'only positive integer existing bag rewards are allowed')
        steps = q.get('steps')
        if not isinstance(steps, list) or len(steps) < 2:
            fail(path + '.steps', 'must contain hearing and completion')
            continue
        for i, s in enumerate(steps):
            sp = path + f'.steps[{i}]'
            if not obj(s, ('kind', 'log', 'locations', 'actors', 'requires', 'write'), sp,
                       ('object', 'subject', 'count', 'group', 'cargo')):
                continue
            one(s.get('kind'), KINDS, sp + '.kind')
            if (i == 0) != (s.get('kind') == 'hear'):
                fail(sp + '.kind', 'hearing must be the first and only hear step')
            text(s.get('log'), sp + '.log', True)
            locations = s.get('locations')
            if not isinstance(locations, list) or not locations:
                fail(sp + '.locations', 'must be a nonempty array')
            else:
                for j, value in enumerate(locations):
                    location(value, sp + f'.locations[{j}]')
            unique_list(s.get('actors'), refs['actors'], sp + '.actors')
            gates(s.get('requires'), sp + '.requires')
            phase = 'heard' if i == 0 else ('done' if i == len(steps) - 1 else 'step')
            value = True if phase != 'step' else i
            write = s.get('write')
            if not isinstance(write, dict) or set(write) != {'key', 'value'} or \
               write.get('key') != expected_keys[phase] or type(write.get('value')) is not type(value) or \
               write.get('value') != value:
                fail(sp + '.write', 'must be the sequential checkpoint or true presence flag')
            for key in ('object', 'subject'):
                if key in s:
                    text(s[key], sp + '.' + key)
            if 'count' in s and (type(s['count']) is not int or s['count'] <= 0):
                fail(sp + '.count', 'must be a positive integer')
            if 'group' in s and (id != 'sq-spire-memory' or s['group'] != 'league regulars'):
                fail(sp + '.group', 'only the unresolved league regulars group is allowed')
            if (s.get('kind') == 'carry') != ('cargo' in s):
                fail(sp, 'carry steps must have cargo and other kinds must not')
            if 'cargo' in s:
                c = s['cargo']
                if id != 'sq-halen-passing':
                    fail(sp + '.cargo', 'only Halen has passing-along cargo')
                if not obj(c, ('name', 'from', 'to', 'placeholder'), sp + '.cargo',
                           ('fromPlaceholder', 'toPlaceholder')):
                    continue
                text(c.get('name'), sp + '.cargo.name')
                if type(c.get('placeholder')) is not bool:
                    fail(sp + '.cargo.placeholder', 'must be a boolean')
                for role in ('from', 'to'):
                    alias = role + 'Placeholder'
                    if c.get(role) is None:
                        one(c.get(alias), {'Perrin', 'Juna'}, sp + '.cargo.' + alias)
                    else:
                        one(c.get(role), refs['actors'], sp + '.cargo.' + role)
                        if alias in c:
                            fail(sp + '.cargo.' + alias, 'a resolved actor cannot also be a placeholder')
                if c.get('placeholder') != (c.get('from') is None):
                    fail(sp + '.cargo.placeholder', 'Perrin’s and Juna’s outgoing items remain placeholders')
    return errors


class ErrandContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load_json(DATA)
        cls.refs = source_references()
        cls.by_id = {q['id']: q for q in cls.data['errands']}

    def test_valid_data(self):
        self.assertEqual(validate_document(self.data, self.refs), [])

    def test_ids_match_the_design_table(self):
        section = self.refs['design'].split('### One errand in each town\n', 1)[1].split('\n## 4.', 1)[0]
        self.assertEqual(re.findall(r'^\| `(sq-[a-z-]+)` \|', section, re.M), list(IDS))
        self.assertEqual([q['giver'] for q in self.data['errands']], list(GIVERS))
        self.assertEqual([q['town']['map'] for q in self.data['errands']], list(TOWNS))

    def test_source_names_and_unresolved_places(self):
        self.assertEqual(len(self.refs['world']['MAPS']), 15)
        for name in NAMED_PLACES:
            self.assertIn(name, self.refs['design'].split('## 2.', 1)[1].split('## 3.', 1)[0])
        self.assertNotIn('perrin', self.refs['actors'])
        self.assertNotIn('juna', self.refs['actors'])
        locations = [loc for q in self.data['errands'] for s in q['steps'] for loc in s['locations']]
        self.assertEqual({x['place'] for x in locations if 'place' in x}, NAMED_PLACES)

    def test_story_contract_can_resume_every_checkpoint(self):
        for q in self.data['errands']:
            with self.subTest(errand=q['id']):
                story = {'old-story': True}
                for i, step in enumerate(q['steps']):
                    write = step['write']
                    story[write['key']] = write['value']
                    story = json.loads(json.dumps(story))
                    self.assertTrue(story['old-story'])
                    self.assertTrue(story[q['storyKeys']['heard']])
                    if 0 < i < len(q['steps']) - 1:
                        self.assertEqual(story[q['storyKeys']['step']], i)
                    if i == len(q['steps']) - 1:
                        self.assertTrue(story[q['storyKeys']['done']])
                self.assertEqual(set(story) - {'old-story'}, set(q['storyKeys'].values())
                                    if len(q['steps']) > 2 else {q['storyKeys']['heard'], q['storyKeys']['done']})
        # This is a JSON contract check, not a test of Godot's future errand consumer.

    def test_early_access_and_lesson_order(self):
        for id in ('sq-nora-bird', 'sq-tobin-tally'):
            q = self.by_id[id]
            self.assertEqual(q['requires']['badges'], [])
            for g in [q['requires']] + [s['requires'] for s in q['steps']]:
                self.assertEqual(g['fields'], [])
                self.assertNotIn('loom', g['badges'])
        q = self.by_id['sq-isolde-path']
        self.assertEqual(q['requires']['badges'], ['thorn'])
        self.assertFalse(any(s['requires']['fields'] for s in q['steps']))
        q = self.by_id['sq-vessa-beacon']
        self.assertEqual(q['requires']['badges'], ['beacon'])
        self.assertEqual(q['requires']['fields'], [])
        self.assertEqual([s['kind'] for s in q['steps']], ['hear', 'help', 'lesson', 'light'])
        self.assertFalse(any(s['requires']['fields'] for s in q['steps'][:-1]))
        self.assertEqual(q['steps'][-1]['requires']['fields'], ['field:glide'])
        self.assertEqual(self.by_id['sq-sela-warmth']['steps'][1]['requires']['fields'], ['field:lantern'])

    def test_specific_story_outcomes(self):
        lowbell = self.by_id['sq-lowbell']
        self.assertEqual(lowbell['steps'][1]['requires']['fields'], ['field:tide'])
        self.assertEqual(lowbell['steps'][-1]['actors'], ['veslin'])
        self.assertEqual(lowbell['steps'][-1]['locations'], [{'map': 'hollowecho'}])
        stones = self.by_id['sq-senna-stones']['steps']
        self.assertEqual(sum(s.get('count', 0) for s in stones if s['kind'] == 'recover'), 3)
        self.assertEqual(stones[2]['requires']['fields'], ['field:hush'])
        self.assertEqual(stones[-1]['count'], 3)
        skiffs = self.by_id['sq-rysa-skiffs']['steps'][-1]
        self.assertEqual(skiffs['count'], 2)
        self.assertEqual(skiffs['requires']['fields'], ['field:tide'])
        self.assertEqual(skiffs['locations'], [{'place': 'Outer Shoal'}])
        spire = self.by_id['sq-spire-memory']
        self.assertEqual(spire['requires']['story'], ['leagueEnding'])
        self.assertEqual(spire['steps'][0]['group'], 'league regulars')
        self.assertEqual(spire['steps'][-1]['actors'], ['orla'])
        self.assertTrue(all(q['rewards'] == {} for q in self.data['errands']))

    def test_passing_along_preserves_nine_objects_and_placeholders(self):
        q = self.by_id['sq-halen-passing']
        carries = [s for s in q['steps'] if s['kind'] == 'carry']
        self.assertEqual([s['cargo']['name'] for s in carries], list(CARGO))
        self.assertEqual([s['cargo']['from'] for s in carries], list(CARGO_FROM))
        self.assertEqual([s['cargo']['to'] for s in carries], list(CARGO_TO))
        self.assertEqual([i for i, s in enumerate(carries) if s['cargo']['placeholder']], [2, 5])
        for index, name in [(2, 'Perrin'), (5, 'Juna')]:
            self.assertEqual(carries[index]['cargo']['fromPlaceholder'], name)
            self.assertEqual(carries[index - 1]['cargo']['toPlaceholder'], name)
        self.assertEqual(q['steps'][-1]['actors'], ['halen'])
        self.assertEqual(q['requires']['badges'], [])
        self.assertEqual(q['requires']['fields'], [])

    def test_malformed_documents_are_rejected_without_mutating(self):
        def put(path, value):
            d = deepcopy(self.data)
            target = d
            for key in path[:-1]:
                target = target[key]
            target[path[-1]] = value
            return d
        q = ['errands', 0]
        s = q + ['steps', 1]
        cases = [None, [], {}, {'quests': []}, put(['schemaVersion'], True),
                 put(['schemaVersion'], 2), put(['errands'], {}), put(['errands'], []),
                 put(q, None), put(q + ['id'], 'sq-made-up'), put(q + ['giver'], 'perrin'),
                 put(q + ['giver'], []), put(q + ['town'], None),
                 put(q + ['town', 'map'], 'reedhold'), put(q + ['town', 'name'], ''),
                 put(q + ['requires'], None), put(q + ['requires', 'badges'], ['made-up']),
                 put(q + ['requires', 'badges'], ['thorn', 'thorn']),
                 put(q + ['requires', 'fields'], ['field:flying']),
                 put(q + ['requires', 'maps'], ['lantern_quay']),
                 put(q + ['requires', 'story'], ['sq:sq-nora-bird:done']),
                 put(q + ['requires', 'maps'], [[]]), put(q + ['log'], 'x' * 121),
                 put(q + ['log'], 'A\nB'), put(q + ['log'], ' padded '),
                 put(q + ['storyKeys', 'heard'], 'sq:nora-bird:heard'),
                 put(q + ['storyKeys'], {'heard': 'sq:sq-nora-bird:heard'}),
                 put(q + ['rewards'], {'wooden-bird': 1}), put(q + ['rewards'], {'coins': True}),
                 put(q + ['rewards'], {'lures': -1}), put(q + ['rewards'], {'berries': 1.5}),
                 put(q + ['rewards'], []), put(q + ['steps'], []), put(s, []),
                 put(s + ['kind'], 'give-badge'), put(s + ['kind'], 'hear'),
                 put(s + ['locations'], []), put(s + ['locations'], [{'map': 'invented'}]),
                 put(s + ['locations'], [{'place': 'Invented Town'}]),
                 put(s + ['locations'], [{'map': 'larkhaven', 'place': 'Lantern Quay'}]),
                 put(s + ['actors'], ['juna']), put(s + ['actors'], [{}]),
                 put(s + ['write', 'key'], 'field:stone'), put(s + ['write', 'value'], True),
                 put(s + ['write', 'value'], 1.5), put(s + ['write', 'value'], -1),
                 put(q + ['steps', 0, 'write', 'value'], False),
                 put(q + ['steps', 0, 'write', 'value'], 1),
                 put(['errands', 7, 'steps', 3, 'cargo', 'from'], 'perrin'),
                 put(['errands', 7, 'steps', 3, 'cargo', 'placeholder'], False),
                 put(['errands', 7, 'steps', 3, 'cargo', 'fromPlaceholder'], 'New Keeper'),
                 put(['errands', 7, 'steps', 3, 'cargo', 'toPlaceholder'], 'Juna'),
                 put(['errands', 8, 'steps', 1, 'count'], True)]
        for field in ('quests', 'dialogue', 'saveVersion', 'inventory'):
            cases.append(put([field], {}))
            cases.append(put(q + [field], {}))
        for index, malformed in enumerate(cases):
            with self.subTest(fixture=index):
                snapshot = deepcopy(malformed)
                self.assertTrue(validate_document(malformed, self.refs))
                self.assertEqual(malformed, snapshot)
        print(f'WBW-1 malformed fixtures: {len(cases)} rejected.')

    def test_strict_json_parser(self):
        import tempfile
        for body in ('{"a":1,"a":2}', '{"a":NaN}', '{"a":Infinity}', '{"a":-Infinity}', '{bad'):
            with self.subTest(body=body), tempfile.TemporaryDirectory() as folder:
                path = Path(folder) / 'invalid.json'
                path.write_text(body, encoding='utf-8')
                with self.assertRaises(ValueError):
                    load_json(path)


if __name__ == '__main__':
    unittest.main()
