"""Rebuild the bounded local catalogue from pinned PokéAPI facts, never sprites.
Usage: python normalize_data.py CACHE_DIRECTORY [--fetch]
Without --fetch this only verifies cached inputs against source-manifest.json.
"""
import argparse
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parent
REVISION = '3eef329da031136b2206bedb6216c65bd9e095d8'
BASE = f'https://raw.githubusercontent.com/PokeAPI/api-data/{REVISION}/data/api/v2/'
SELECTED = [33, 28, 16, 98, 52, 39, 55, 341, 21, 53]


def number(url):
    return int(url.strip('/').split('/')[-1])


def build(cache, fetch):
    used = []
    previous = json.loads((ROOT / 'source-manifest.json').read_text(encoding='utf-8'))
    hashes = {x['path']: x['sha256'] for x in previous['sources']}

    def read(kind, identity):
        path = cache / f'{kind}-{identity}.json'
        if fetch and not path.exists():
            path.write_bytes(urllib.request.urlopen(BASE + f'{kind}/{identity}/index.json', timeout=30).read())
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if hashes.get(path.name) != digest:
            raise ValueError(f'Pinned source changed: {path.name}')
        used.append(path)
        return json.loads(path.read_text(encoding='utf-8'))

    data = {'species': {}, 'moves': {}, 'types': {}, 'growth': {}}
    for identity in SELECTED:
        move = read('move', identity)
        values = {key: move[key] for key in ['power', 'accuracy', 'pp', 'effect_chance']}
        for key in values:
            for old in sorted(move['past_values'], key=lambda x: number(x['version_group']['url'])):
                if number(old['version_group']['url']) > 9 and old[key] is not None:
                    values[key] = old[key]
                    break
        data['moves'][move['name']] = {
            'name': move['name'].replace('-', ' ').title(), 'pow': values['power'] or 0,
            'accuracy': (values['accuracy'] or 100) / 100, 'pp': values['pp'],
            'el': move['type']['name'], 'spec': int(move['damage_class']['name'] == 'special'),
            'priority': move['priority'], 'effect_chance': values['effect_chance'] or 0,
        }
    for identity in [16, 37, 194]:
        pokemon = read('pokemon', identity)
        species = read('pokemon-species', identity)
        learns = []
        for move in pokemon['moves']:
            if number(move['move']['url']) not in SELECTED:
                continue
            for version in move['version_group_details']:
                if version['version_group']['name'] == 'platinum' and version['move_learn_method']['name'] == 'level-up':
                    learns.append({'level': version['level_learned_at'], 'move': move['move']['name']})
        data['species'][f'pokemon:{identity}'] = {
            'name': pokemon['name'].title(),
            'stats': {x['stat']['name']: x['base_stat'] for x in pokemon['stats']},
            'types': [x['type']['name'] for x in pokemon['types']],
            'catch_rate': species['capture_rate'], 'base_experience': pokemon['base_experience'],
            'growth': species['growth_rate']['name'],
            'learnset': sorted(learns, key=lambda x: (x['level'], x['move'])),
        }
    for identity in range(1, 18):
        kind = read('type', identity)
        relations = kind['damage_relations']
        for old in sorted(kind['past_damage_relations'], key=lambda x: number(x['generation']['url'])):
            if number(old['generation']['url']) >= 4:
                relations = old['damage_relations']
                break
        chart = {}
        for group, multiplier in [('no_damage_to', 0), ('half_damage_to', .5), ('double_damage_to', 2)]:
            for target in relations[group]:
                chart[target['name']] = multiplier
        data['types'][kind['name']] = chart
    for identity in [2, 4]:
        growth = read('growth-rate', identity)
        data['growth'][growth['name']] = [0] + [x['experience'] for x in sorted(growth['levels'], key=lambda x: x['level'])]
    generated = json.dumps(data, indent=2) + '\n'
    target = ROOT / 'core-data.json'
    if target.read_text(encoding='utf-8') != generated:
        raise ValueError('Normalized data differs from committed catalogue; inspect rather than silently updating it.')
    print(f'Verified {len(set(used))} pinned sources and identical normalized catalogue.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('cache', type=Path)
    parser.add_argument('--fetch', action='store_true')
    args = parser.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    build(args.cache, args.fetch)
