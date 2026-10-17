/* Read-only audit. Run from any directory; writes JSON only to stdout.
   node docs/research/wildbond-development-audit/inventory.cjs > inventory.json
   This reports content/art coverage, not visual quality or playable completion. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const json = p => JSON.parse(read(p));
const data = json('wildbond-godot/data/wildbond.json');
const overlay = json('wildbond-godot/data/evolution.json');
// Match main.gd _ready(): overlay replacements are intentional, not duplicate JSON keys.
const species = {...data.SPECIES, ...overlay.species};
const ids = Object.keys(species).sort();
const exists = p => fs.existsSync(path.join(root, p));
const evolutions = id => Object.hasOwn(overlay.evos, id)
  ? overlay.evos[id] : species[id].evo ? [species[id].evo] : [];
const problems = [];
const edge = (from, to, kind) => {if (!species[to]) problems.push({from, to, kind});};
const seen = new Set(), active = new Set();
function visit(id) {
  if (active.has(id)) {problems.push({kind:'evolution cycle', id}); return;}
  if (seen.has(id) || !species[id]) return;
  active.add(id);
  for (const e of evolutions(id)) {edge(id, e.to, 'evolution'); visit(e.to);}
  active.delete(id); seen.add(id);
}
for (const id of ids) visit(id);
for (const id of data.STARTERS) edge('STARTERS', id, 'starter');
const speciesReview = ids.map(id => {
  const s = species[id];
  for (const lesson of s.learn) {
    if (!data.MOVES[lesson[1]]) problems.push({kind:'missing move', species:id, move:lesson[1]});
  }
  if (!data.ELEMENTS[s.el]) problems.push({kind:'missing element', species:id, element:s.el});
  const front = exists(`wildbond-godot/assets/creatures/battle/${id}_battle_front.png`);
  const back = exists(`wildbond-godot/assets/creatures/battle/${id}_battle_back.png`);
  const idle = exists(`wildbond-godot/assets/creatures/${id}_side_idle.png`);
  const walk = exists(`wildbond-godot/assets/creatures/${id}_side_walk.png`);
  return {id, name:s.name, family:s.fam, element:s.el, description:s.dex || null,
    evolutions:evolutions(id), art:{front, back, idle, walk}};
});
const pngSize = p => {
  const b = fs.readFileSync(path.join(root, p));
  if (b.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw Error(`Not PNG: ${p}`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};
const battleDir = 'wildbond-godot/assets/creatures/battle';
const battleFiles = fs.readdirSync(path.join(root, battleDir)).filter(f => f.endsWith('.png')).sort()
  .map(name => ({name, dimensions:pngSize(`${battleDir}/${name}`)}));
const scriptDir = 'wildbond-godot/scripts';
const scripts = fs.readdirSync(path.join(root, scriptDir)).filter(f => f.endsWith('.gd')).sort()
  .map(name => {
    const source = read(`${scriptDir}/${name}`);
    return {name, lines:source.trimEnd().split(/\r?\n/).length,
      sha256:crypto.createHash('sha256').update(source).digest('hex'),
      functions:[...source.matchAll(/^(?:static )?func (\w+)\(/gm)].map(m => m[1])};
  });
const descriptionGroups = new Map();
for (const s of speciesReview.filter(s => s.description)) {
  if (!descriptionGroups.has(s.description)) descriptionGroups.set(s.description, []);
  descriptionGroups.get(s.description).push(s);
}
const sameDescription = [...descriptionGroups.entries()]
  .filter(([,list]) => list.length > 1).map(([description,list]) => ({description, ids:list.map(s=>s.id)}));
const result = {
  baseline:'b8493ff05e08073a7255968a83d015bd520d1c28',
  checkout:execFileSync('git', ['rev-parse','HEAD'], {cwd:root,encoding:'utf8'}).trim(),
  counts:{base_species:Object.keys(data.SPECIES).length, overlay_species:Object.keys(overlay.species).length,
    overlapping_species:Object.keys(overlay.species).filter(id=>data.SPECIES[id]).length,
    effective_species:ids.length, moves:Object.keys(data.MOVES).length, elements:Object.keys(data.ELEMENTS).length,
    maps:Object.keys(data.MAPS).length, biomes:Object.keys(data.BIOMES).length, story_beats:data.STORY.length,
    scripts:scripts.length, front_sprites:speciesReview.filter(s=>s.art.front).length,
    back_sprite_files:speciesReview.filter(s=>s.art.back).length,
    world_idle:speciesReview.filter(s=>s.art.idle).length, world_walk:speciesReview.filter(s=>s.art.walk).length},
  maps:Object.entries(data.MAPS).map(([id,m])=>({id,name:m.name,biome:m.biome||null,
    width:m.rows[0].length,height:m.rows.length,exits:m.exits})),
  move_fields:[...new Set(Object.values(data.MOVES).flatMap(Object.keys))].sort(),
  same_description:sameDescription, battle_files:battleFiles, problems, scripts, species_review:speciesReview,
  limits:['Back file existence does not mean main renders it.',
    'Species review rows expose descriptions and evolution lines; they do not grade originality or visual quality.',
    'Graph/move checks do not prove every encounter, quest or save is valid; run the existing suites too.']
};
console.log(JSON.stringify(result, null, 2));
if (problems.length) process.exitCode = 1;
