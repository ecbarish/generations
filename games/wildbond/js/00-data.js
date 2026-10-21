'use strict';
/* Wildbond content data. Add species, moves and biomes here; no logic lives in this file. */

const LEVEL_CAP = 100;
/* Badge level caps (decided 2026-10-08, docs/research/decisions.md): the main story ends near level 70, so the cap
   rises 10 a badge for the first four, then 5: CAP_TABLE[badges]. The post-game opens the way to 100.
   Soft cap (default): XP drops to a trickle above it. Hard: no XP above it. Off: only the 100 limit. */
const CAP_TABLE = [15, 25, 35, 45, 55, 60, 65, 70, 75], SOFT_TRICKLE = 0.05;
/* Journey length: picked with your starter, changeable at the Larkhaven inn (Journal tab).
   Auto-explore always earns a little less XP than playing yourself (AUTO_XP). */
const JOURNEY = {
  breezy: { name: 'Breezy', xp: 0.36, coins: 1.5, rare: 0.15, desc: 'A quicker story: more XP and coins. First badge in about an hour.' },
  classic: { name: 'Classic', xp: 0.13, coins: 1, rare: 0, desc: 'The intended pace. First badge in about two to three hours.' },
  long: { name: 'Long Road', xp: 0.08, coins: 0.8, rare: -0.3, desc: 'For the grind: less XP and rarer finds. Every level is earned.' }
};
const AUTO_XP = 0.8;
const BADGES = { thorn: { name: 'Thorn Badge' }, tide: { name: 'Tide Badge' }, ember: { name: 'Ember Badge' }, beacon: { name: 'Beacon Badge' }, reed: { name: 'Reed Badge' }, echo: { name: 'Echo Badge' }, loom: { name: 'Loom Badge' }, horizon: { name: 'Horizon Badge' } };

/* Element wheel: each element is strong against the ones listed. */
const ELEMENTS = {
  Ember: { col: '#ff7a3a', beats: ['Grove', 'Gale'] },
  Tide: { col: '#3a9bff', beats: ['Ember', 'Stone'] },
  Grove: { col: '#4fc35a', beats: ['Tide', 'Stone'] },
  Stone: { col: '#b8946a', beats: ['Ember', 'Gale'] },
  Gale: { col: '#a8e0ff', beats: ['Grove', 'Shade'] },
  Shade: { col: '#8a5ad0', beats: ['Radiant', 'Gale'] },
  Radiant: { col: '#ffe36a', beats: ['Shade'] }
};

/* kind: hit (one target), aoe (all enemies), dot (damage over time), buff (allies +25% damage),
   haste (allies act faster), guard (allies take 40% less), heal (lowest ally), slow (target acts slower).
   spec: uses Wits vs Spirit instead of Power vs Guard. cd: seconds before it can be used again. */
const MOVES = {
  bite: { name: 'Bite', el: null, pow: 40, kind: 'hit', cd: 0 },
  scratch: { name: 'Scratch', el: null, pow: 40, kind: 'hit', cd: 0 },
  charge: { name: 'Charge', el: null, pow: 55, kind: 'hit', cd: 4 },
  tailWhip: { name: 'Tail Whip', el: null, pow: 38, kind: 'hit', cd: 0 },
  peck: { name: 'Peck', el: 'Gale', pow: 38, kind: 'hit', cd: 0 },
  emberSnap: { name: 'Ember Snap', el: 'Ember', pow: 55, kind: 'hit', spec: 1, cd: 3 },
  flameRush: { name: 'Flame Rush', el: 'Ember', pow: 85, kind: 'hit', cd: 7 },
  bubbleJet: { name: 'Bubble Jet', el: 'Tide', pow: 55, kind: 'hit', spec: 1, cd: 3 },
  tidePulse: { name: 'Tide Pulse', el: 'Tide', pow: 50, kind: 'aoe', spec: 1, cd: 8 },
  vineLash: { name: 'Vine Lash', el: 'Grove', pow: 55, kind: 'hit', cd: 3 },
  thornQuake: { name: 'Thorn Quake', el: 'Grove', pow: 50, kind: 'aoe', cd: 8 },
  gust: { name: 'Gust', el: 'Gale', pow: 55, kind: 'hit', spec: 1, cd: 3 },
  rockToss: { name: 'Rock Toss', el: 'Stone', pow: 62, kind: 'hit', cd: 4 },
  shadowSting: { name: 'Shadow Sting', el: 'Shade', pow: 30, kind: 'dot', spec: 1, cd: 6 },
  spark: { name: 'Spark', el: 'Radiant', pow: 50, kind: 'hit', spec: 1, cd: 2 },
  radiance: { name: 'Radiance', el: 'Radiant', pow: 55, kind: 'aoe', spec: 1, cd: 8 },
  howl: { name: 'Howl', kind: 'buff', cd: 14 },
  tailwind: { name: 'Tailwind', kind: 'haste', cd: 14 },
  mistVeil: { name: 'Mist Veil', kind: 'guard', cd: 12 },
  harden: { name: 'Harden', kind: 'guard', cd: 12 },
  webSnare: { name: 'Web Snare', kind: 'slow', cd: 10 },
  regrowth: { name: 'Regrowth', kind: 'heal', cd: 10 }
};

/* base stats: hp, pow (power), grd (guard), spd (speed), wit (wits), spi (spirit).
   learn: [level, move]. evo: evolves into another species at a level. */
const SPECIES = {
  cindercub: { name: 'Cindercub', fam: 'wolf', el: 'Ember', col: '#d8642e', base: { hp: 45, pow: 60, grd: 40, spd: 62, wit: 55, spi: 45 },
    learn: [[1, 'bite'], [5, 'emberSnap'], [6, 'howl'], [11, 'flameRush']], evo: { at: 14, to: 'blazefang' },
    dex: 'A wolf pup with smoldering fur. It sleeps curled around warm stones.' },
  blazefang: { name: 'Blazefang', fam: 'wolf', el: 'Ember', col: '#e8441e', big: 1, base: { hp: 65, pow: 88, grd: 58, spd: 90, wit: 78, spi: 60 },
    learn: [[1, 'bite'], [1, 'emberSnap'], [6, 'howl'], [11, 'flameRush']], dex: 'Its mane burns brighter the more it trusts its tamer.' },
  ripplet: { name: 'Ripplet', fam: 'lizard', el: 'Tide', col: '#3a8fd8', base: { hp: 50, pow: 48, grd: 55, spd: 45, wit: 60, spi: 55 },
    learn: [[1, 'tailWhip'], [5, 'bubbleJet'], [6, 'mistVeil'], [11, 'tidePulse']], evo: { at: 14, to: 'tidewyrm' },
    dex: 'A curious river lizard that blows bubbles when it is happy.' },
  tidewyrm: { name: 'Tidewyrm', fam: 'croc', el: 'Tide', col: '#1f6fbf', big: 1, base: { hp: 75, pow: 70, grd: 80, spd: 62, wit: 85, spi: 78 },
    learn: [[1, 'tailWhip'], [1, 'bubbleJet'], [6, 'mistVeil'], [11, 'tidePulse']], dex: 'It rides the river currents and can call up a wave at will.' },
  mosshog: { name: 'Mosshog', fam: 'boar', el: 'Grove', col: '#5d9a3e', base: { hp: 60, pow: 58, grd: 58, spd: 38, wit: 42, spi: 50 },
    learn: [[1, 'charge'], [5, 'vineLash'], [6, 'regrowth'], [11, 'thornQuake']], evo: { at: 14, to: 'thornback' },
    dex: 'Moss grows on its back. Birds nest in it, and it lets them.' },
  thornback: { name: 'Thornback', fam: 'boar', el: 'Grove', col: '#3f7a2a', big: 1, base: { hp: 88, pow: 85, grd: 85, spd: 52, wit: 60, spi: 70 },
    learn: [[1, 'charge'], [1, 'vineLash'], [6, 'regrowth'], [11, 'thornQuake']], dex: 'Its thorns can split a fallen log. It guards its herd fiercely.' },
  glimmerwing: { name: 'Glimmerwing', fam: 'bird', el: 'Gale', col: '#9fd6f0', base: { hp: 40, pow: 50, grd: 38, spd: 72, wit: 52, spi: 42 },
    learn: [[1, 'peck'], [4, 'gust'], [9, 'tailwind']], dex: 'Its feathers catch the light like glass.' },
  pebblepaw: { name: 'Pebblepaw', fam: 'cat', el: 'Stone', col: '#9a8a74', base: { hp: 48, pow: 60, grd: 62, spd: 48, wit: 35, spi: 45 },
    learn: [[1, 'scratch'], [5, 'rockToss'], [10, 'harden']], dex: 'It sharpens its claws on granite and naps in the sun.' },
  duskweaver: { name: 'Duskweaver', fam: 'spider', el: 'Shade', col: '#5a4a7a', base: { hp: 42, pow: 45, grd: 45, spd: 55, wit: 62, spi: 50 },
    learn: [[1, 'bite'], [5, 'shadowSting'], [10, 'webSnare']], dex: 'It weaves webs only at dusk, and they vanish by morning.' },
  bogsnap: { name: 'Bogsnap', fam: 'croc', el: 'Tide', col: '#4a6a4a', base: { hp: 58, pow: 62, grd: 55, spd: 35, wit: 40, spi: 48 },
    learn: [[1, 'bite'], [6, 'bubbleJet']], dex: 'It waits in still water for hours without moving.' },
  emberling: { name: 'Emberling', fam: 'lizard', el: 'Ember', col: '#e06a2a', base: { hp: 40, pow: 48, grd: 40, spd: 58, wit: 60, spi: 45 },
    learn: [[1, 'scratch'], [4, 'emberSnap'], [9, 'flameRush']], dex: 'It basks on hot rocks and glows faintly at night.' },
  gnawhound: { name: 'Gnawhound', fam: 'hyena', el: 'Shade', col: '#6a5a4a', base: { hp: 46, pow: 58, grd: 40, spd: 60, wit: 40, spi: 40 },
    learn: [[1, 'bite'], [7, 'shadowSting']], dex: 'Packs of them laugh at night to frighten travelers.' },
  sunspark: { name: 'Sunspark', fam: 'sprite', el: 'Radiant', col: '#ffe36a', base: { hp: 38, pow: 35, grd: 40, spd: 68, wit: 72, spi: 65 },
    learn: [[1, 'spark'], [6, 'regrowth'], [10, 'radiance']], dex: 'A rare spark of living light. Seeing one is said to be good luck.' },
  galefoal: { name: 'Galefoal', fam: 'horse', el: 'Gale', col: '#cfd8e0', base: { hp: 55, pow: 55, grd: 45, spd: 80, wit: 40, spi: 45 },
    learn: [[1, 'charge'], [6, 'gust']], dex: 'A wild foal that runs with the wind. Born to race.' },
  elderhorn: { name: 'Elderhorn', fam: 'horse', el: 'Grove', col: '#6a8a4a', antlers: 1, big: 1, unique: 1,
    base: { hp: 95, pow: 90, grd: 95, spd: 70, wit: 80, spi: 95 },
    learn: [[1, 'charge'], [1, 'vineLash'], [1, 'regrowth'], [1, 'thornQuake']], dex: 'The ancient guardian of Thornwood. Few have seen it and fewer have earned its trust.' },
  brineskit: { name: 'Brineskit', fam: 'lizard', el: 'Tide', col: '#569eaa',
    base: { hp: 48, pow: 42, grd: 48, spd: 58, wit: 60, spi: 44 },
    learn: [[1, 'tailWhip'], [1, 'bubbleJet'], [8, 'mistVeil'], [16, 'tidePulse']], evo: { at: 16, to: 'shoalcrest' },
    dex: 'It skims shallow tide pools on its wide toes and shelters beneath empty shells.' },
  shoalcrest: { name: 'Shoalcrest', fam: 'croc', el: 'Tide', col: '#307e96', big: 1,
    base: { hp: 75, pow: 62, grd: 72, spd: 58, wit: 85, spi: 68 },
    learn: [[1, 'tailWhip'], [1, 'bubbleJet'], [8, 'mistVeil'], [16, 'tidePulse']],
    dex: 'Its ridged back parts the surf into calm channels where smaller creatures can cross.' },
  dunepounce: { name: 'Dunepounce', fam: 'cat', el: 'Stone', col: '#c5aa75',
    base: { hp: 46, pow: 62, grd: 60, spd: 57, wit: 32, spi: 43 },
    learn: [[1, 'scratch'], [6, 'rockToss'], [12, 'harden'], [16, 'charge']],
    dex: 'It buries its stone-tipped paws in warm dunes before springing at shadows on the sand.' },
  reedtusk: { name: 'Reedtusk', fam: 'boar', el: 'Grove', col: '#829956',
    base: { hp: 65, pow: 58, grd: 62, spd: 30, wit: 38, spi: 47 },
    learn: [[1, 'charge'], [5, 'vineLash'], [12, 'regrowth']],
    dex: 'It combs the marsh with curved tusks, leaving narrow trails that fill with fresh reeds.' },
  wrackjaw: { name: 'Wrackjaw', fam: 'hyena', el: 'Stone', col: '#94877b',
    base: { hp: 50, pow: 65, grd: 48, spd: 62, wit: 32, spi: 43 },
    learn: [[1, 'bite'], [6, 'rockToss'], [12, 'howl']],
    dex: 'Its rattling laugh echoes through driftwood piles as it cracks shellfish with pebble-hard jaws.' },
  kiteskirl: { name: 'Kiteskirl', fam: 'bird', el: 'Gale', col: '#adc9da',
    base: { hp: 40, pow: 45, grd: 36, spd: 76, wit: 58, spi: 45 },
    learn: [[1, 'peck'], [5, 'gust'], [12, 'tailwind']],
    dex: 'It rides the sea breeze without flapping and whistles whenever a storm approaches.' },
  spindriftfoal: { name: 'Spindriftfoal', fam: 'horse', el: 'Gale', col: '#d2d9cb',
    base: { hp: 52, pow: 48, grd: 40, spd: 78, wit: 38, spi: 44 },
    learn: [[1, 'charge'], [6, 'gust'], [14, 'tailwind']],
    dex: 'It races along the waterline, scattering ribbons of sea spray with every stride.' },
  foamglint: { name: 'Foamglint', fam: 'sprite', el: 'Tide', col: '#a0dfcf',
    base: { hp: 36, pow: 30, grd: 40, spd: 64, wit: 72, spi: 58 },
    learn: [[1, 'bubbleJet'], [8, 'mistVeil'], [16, 'tidePulse']],
    dex: 'This elusive fleck of living foam glows only where moonlit waves meet the marsh.' },
  breakwatermane: { name: 'Breakwatermane', fam: 'wolf', el: 'Tide', col: '#497a9e', unique: 1, big: 1,
    base: { hp: 95, pow: 90, grd: 85, spd: 80, wit: 85, spi: 90 },
    learn: [[1, 'bite'], [1, 'bubbleJet'], [10, 'howl'], [16, 'tidePulse']],
    dex: 'The coast falls silent when this ancient wolf walks the breakers, its mane carrying the rhythm of every tide.' },
  slaglet: { name: 'Slaglet', fam: 'boar', el: 'Ember', col: '#b77748',
    base: { hp: 60, pow: 58, grd: 56, spd: 34, wit: 48, spi: 44 },
    learn: [[1, 'charge'], [1, 'emberSnap'], [9, 'harden'], [16, 'flameRush']], evo: { at: 22, to: 'kilntusk' },
    dex: 'It rolls in warm volcanic dust until its coat forms a snug crust that keeps out the mountain chill.' },
  kilntusk: { name: 'Kilntusk', fam: 'boar', el: 'Ember', col: '#965338', big: 1,
    base: { hp: 82, pow: 86, grd: 80, spd: 46, wit: 66, spi: 60 },
    learn: [[1, 'charge'], [1, 'emberSnap'], [9, 'harden'], [16, 'flameRush']],
    dex: 'Its glowing tusks loosen hardened lava so its herd can root for tender shoots beneath the stone.' },
  cragskein: { name: 'Cragskein', fam: 'spider', el: 'Stone', col: '#82736d',
    base: { hp: 46, pow: 40, grd: 68, spd: 38, wit: 62, spi: 46 },
    learn: [[1, 'bite'], [6, 'webSnare'], [10, 'rockToss'], [16, 'harden']],
    dex: 'Its mineral-dusted webs bridge narrow cracks, giving smaller creatures a safe path across the crags.' },
  ventwhisk: { name: 'Ventwhisk', fam: 'cat', el: 'Ember', col: '#b55e4a',
    base: { hp: 44, pow: 60, grd: 40, spd: 68, wit: 50, spi: 38 },
    learn: [[1, 'scratch'], [6, 'emberSnap'], [12, 'howl'], [16, 'flameRush']],
    dex: 'It curls beside warm vents and fans little clouds of steam with its copper-coloured tail.' },
  thermwing: { name: 'Thermwing', fam: 'bird', el: 'Gale', col: '#baa9a0',
    base: { hp: 40, pow: 48, grd: 38, spd: 74, wit: 58, spi: 42 },
    learn: [[1, 'peck'], [6, 'gust'], [13, 'tailwind']],
    dex: 'It circles on rising warmth, calling out sheltered ledges to the creatures climbing below.' },
  screegrin: { name: 'Screegrin', fam: 'hyena', el: 'Stone', col: '#8c7760',
    base: { hp: 52, pow: 64, grd: 54, spd: 56, wit: 34, spi: 40 },
    learn: [[1, 'bite'], [5, 'rockToss'], [11, 'howl'], [16, 'harden']],
    dex: 'Its cheerful chatter carries down the slopes as it gathers smooth stones for its den.' },
  glowmote: { name: 'Glowmote', fam: 'sprite', el: 'Radiant', col: '#f4cb78',
    base: { hp: 36, pow: 30, grd: 38, spd: 62, wit: 74, spi: 60 },
    learn: [[1, 'spark'], [8, 'regrowth'], [16, 'radiance']],
    dex: 'This seldom-seen spark drifts through the steam, lighting the way home when mist covers the highlands.' },
  hearthcrown: { name: 'Hearthcrown', fam: 'horse', el: 'Ember', col: '#a66e4c', antlers: 1, unique: 1, big: 1,
    base: { hp: 95, pow: 85, grd: 90, spd: 70, wit: 90, spi: 95 },
    learn: [[1, 'charge'], [1, 'emberSnap'], [12, 'regrowth'], [16, 'flameRush']],
    dex: 'The guardian of Emberfall warms frozen springs with its ember-lit antlers so every creature can drink.' },
  /* Cloudglass Pass (area 4, levels 32-42; docs/lore/wildbond.md) */
  mistfinch: { name: 'Mistfinch', fam: 'bird', el: 'Gale', col: '#b9c8d6',
    base: { hp: 44, pow: 48, grd: 40, spd: 72, wit: 52, spi: 46 },
    learn: [[1, 'peck'], [1, 'gust'], [12, 'tailwind'], [34, 'mistVeil']], evo: { at: 38, to: 'cloudharrier' },
    dex: 'It sings only when the cloud is thick, so lost walkers can follow the sound down to a ledge.' },
  cloudharrier: { name: 'Cloudharrier', fam: 'bird', el: 'Gale', col: '#8fa6bd', big: 1,
    base: { hp: 62, pow: 72, grd: 56, spd: 98, wit: 72, spi: 62 },
    learn: [[1, 'peck'], [1, 'gust'], [12, 'tailwind'], [34, 'mistVeil']],
    dex: 'It circles above a stranded traveler until someone climbs up to see what it has found.' },
  cirrusmane: { name: 'Cirrusmane', fam: 'horse', el: 'Gale', col: '#dfe6ec',
    base: { hp: 54, pow: 54, grd: 46, spd: 76, wit: 38, spi: 42 },
    learn: [[1, 'charge'], [1, 'gust'], [14, 'tailwind'], [30, 'howl']],
    dex: 'Its mane streams like a wisp of high cloud, and it never runs a ridge its herd can\'t follow.' },
  shalecat: { name: 'Shalecat', fam: 'cat', el: 'Stone', col: '#8e8a86',
    base: { hp: 50, pow: 62, grd: 64, spd: 50, wit: 36, spi: 42 },
    learn: [[1, 'scratch'], [1, 'rockToss'], [12, 'harden'], [30, 'bite']],
    dex: 'It naps on loose scree and knows, before anyone, which stones are about to slide.' },
  fogtail: { name: 'Fogtail', fam: 'cat', el: 'Gale', col: '#c9d2d8',
    base: { hp: 46, pow: 56, grd: 42, spd: 70, wit: 46, spi: 44 },
    learn: [[1, 'scratch'], [1, 'gust'], [10, 'mistVeil'], [28, 'tailwind']],
    dex: 'When the cloud rolls in it vanishes completely, except for the tip of its tail.' },
  pallweaver: { name: 'Pallweaver', fam: 'spider', el: 'Stone', col: '#9a9590',
    base: { hp: 46, pow: 50, grd: 54, spd: 52, wit: 58, spi: 44 },
    learn: [[1, 'bite'], [1, 'webSnare'], [10, 'rockToss'], [28, 'shadowSting']],
    dex: 'Its silk bridges the narrow cracks in the pass, and small creatures cross on them every morning.' },
  gritbeak: { name: 'Gritbeak', fam: 'bird', el: 'Stone', col: '#7d776e',
    base: { hp: 52, pow: 60, grd: 60, spd: 54, wit: 38, spi: 40 },
    learn: [[1, 'peck'], [1, 'rockToss'], [16, 'harden'], [30, 'gust']],
    dex: 'It cracks seeds on the rocks with its stone-hard beak, and the noise carries a long way in fog.' },
  lanternwisp: { name: 'Lanternwisp', fam: 'sprite', el: 'Radiant', col: '#ffe9a8',
    base: { hp: 40, pow: 38, grd: 42, spd: 66, wit: 76, spi: 68 },
    learn: [[1, 'spark'], [1, 'radiance'], [12, 'regrowth'], [30, 'tailwind']],
    dex: 'Rarely seen. It glows brightest beside the shelters, as if it knows which doors are open.' },
  lanterncrest: { name: 'Lanterncrest', fam: 'bird', el: 'Radiant', col: '#f6d77a', unique: 1, big: 1,
    base: { hp: 88, pow: 82, grd: 80, spd: 96, wit: 96, spi: 92 },
    learn: [[1, 'peck'], [1, 'spark'], [12, 'radiance'], [16, 'tailwind']],
    dex: 'The guardian of Cloudglass Pass. Its crest burns like a lamp through the thickest cloud, lighting the way to shelter.' },
  reedlet: { name: 'Reedlet', fam: 'lizard', el: 'Tide', col: '#759b89',
    base: { hp: 48, pow: 40, grd: 48, spd: 56, wit: 60, spi: 48 },
    learn: [[1, 'tailWhip'], [1, 'bubbleJet'], [12, 'mistVeil'], [24, 'tidePulse']], evo: { at: 54, to: 'ferrycrest' },
    dex: 'It balances on floating reeds and nudges loose ferry ropes toward the landing.' },
  ferrycrest: { name: 'Ferrycrest', fam: 'croc', el: 'Tide', col: '#4c8177', big: 1,
    base: { hp: 80, pow: 62, grd: 78, spd: 54, wit: 78, spi: 68 },
    learn: [[1, 'tailWhip'], [1, 'bubbleJet'], [12, 'mistVeil'], [24, 'tidePulse']],
    dex: 'Its broad crest parts a quiet channel through reeds without overturning their nests.' },
  siltjaw: { name: 'Siltjaw', fam: 'croc', el: 'Tide', col: '#7c8970',
    base: { hp: 60, pow: 58, grd: 62, spd: 30, wit: 42, spi: 48 },
    learn: [[1, 'bite'], [8, 'bubbleJet'], [18, 'harden'], [28, 'tidePulse']],
    dex: 'It rests under grey-green water with only its mossy nose above the surface.' },
  rillwhisk: { name: 'Rillwhisk', fam: 'lizard', el: 'Tide', col: '#8db7aa',
    base: { hp: 42, pow: 38, grd: 40, spd: 72, wit: 62, spi: 46 },
    learn: [[1, 'tailWhip'], [6, 'bubbleJet'], [16, 'mistVeil'], [26, 'tidePulse']],
    dex: 'Its whiskers tremble before the channel rises, giving boat families time to loosen their lines.' },
  orchardroot: { name: 'Orchardroot', fam: 'boar', el: 'Grove', col: '#7d9a52',
    base: { hp: 64, pow: 56, grd: 58, spd: 32, wit: 40, spi: 50 },
    learn: [[1, 'charge'], [6, 'vineLash'], [16, 'regrowth'], [26, 'thornQuake']],
    dex: 'It turns fallen orchard fruit into soft soil and leaves the growing roots undisturbed.' },
  gustreed: { name: 'Gustreed', fam: 'bird', el: 'Gale', col: '#d0bd78',
    base: { hp: 42, pow: 44, grd: 36, spd: 78, wit: 56, spi: 44 },
    learn: [[1, 'peck'], [6, 'gust'], [16, 'tailwind'], [26, 'mistVeil']],
    dex: 'It whistles between reed stems, then falls quiet when a tired ferry reaches the bank.' },
  duskcord: { name: 'Duskcord', fam: 'spider', el: 'Shade', col: '#76677c',
    base: { hp: 44, pow: 38, grd: 48, spd: 50, wit: 66, spi: 54 },
    learn: [[1, 'bite'], [6, 'shadowSting'], [16, 'webSnare'], [26, 'mistVeil']],
    dex: 'Its dusk webs catch drifting seeds above the water while leaving a gap for passing wings.' },
  glassbill: { name: 'Glassbill', fam: 'bird', el: 'Gale', col: '#a6c9bc',
    base: { hp: 40, pow: 38, grd: 38, spd: 76, wit: 62, spi: 46 },
    learn: [[1, 'peck'], [6, 'gust'], [16, 'tailwind'], [26, 'mistVeil']],
    dex: 'Rarely seen among the reeds, it taps clear notes on rain-filled shells before dawn.' },
  stillwake: { name: 'Stillwake', fam: 'croc', el: 'Tide', col: '#638d7c', unique: 1, big: 1,
    base: { hp: 100, pow: 86, grd: 100, spd: 60, wit: 90, spi: 95 },
    learn: [[1, 'bite'], [1, 'bubbleJet'], [1, 'mistVeil'], [1, 'tidePulse']],
    dex: "Stillreed Basin's guardian shelters small creatures in its calm wake as flooded channels carry them across." },
  hushpup: { name: 'Hushpup', fam: 'hyena', el: 'Shade', col: '#81729b', evo: { to: 'hushmane', at: 60 },
    base: { hp: 50, pow: 52, grd: 43, spd: 56, wit: 51, spi: 48 },
    learn: [[1,"bite"],[6,"shadowSting"],[16,"howl"],[26,"mistVeil"]],
    dex: 'It stops at a fork until the returning echo matches the footfalls of its friends.' },
  hushmane: { name: 'Hushmane', fam: 'hyena', el: 'Shade', col: '#66597c',
    base: { hp: 76, pow: 76, grd: 64, spd: 73, wit: 66, spi: 65 },
    learn: [[1,"bite"],[6,"shadowSting"],[16,"howl"],[26,"mistVeil"]],
    dex: 'Its soft call carries around stone bends without startling the creatures sheltering there.' },
  umbrelace: { name: 'Umbrelace', fam: 'spider', el: 'Shade', col: '#726b84',
    base: { hp: 47, pow: 43, grd: 51, spd: 48, wit: 59, spi: 52 },
    learn: [[1,"scratch"],[6,"shadowSting"],[16,"webSnare"],[26,"mistVeil"]],
    dex: 'It hangs silk beside unsafe ledges, leaving the familiar passage open.' },
  flintroot: { name: 'Flintroot', fam: 'boar', el: 'Stone', col: '#9a927a',
    base: { hp: 63, pow: 58, grd: 66, spd: 32, wit: 39, spi: 42 },
    learn: [[1,"charge"],[6,"rockToss"],[16,"harden"],[26,"howl"]],
    dex: 'It rubs loose stone from the trail with its shoulders before settling down to sleep.' },
  ledgewhisk: { name: 'Ledgewhisk', fam: 'cat', el: 'Stone', col: '#b0a698',
    base: { hp: 46, pow: 54, grd: 49, spd: 65, wit: 45, spi: 41 },
    learn: [[1,"scratch"],[6,"rockToss"],[16,"harden"],[26,"tailwind"]],
    dex: 'Its whiskers brush the wall while its paws find the broadest ledge in the dark.' },
  bellmote: { name: 'Bellmote', fam: 'sprite', el: 'Radiant', col: '#d9d797',
    base: { hp: 43, pow: 36, grd: 43, spd: 52, wit: 63, spi: 63 },
    learn: [[1,"radiance"],[6,"spark"],[16,"mistVeil"],[26,"regrowth"]],
    dex: 'It rests inside a silent bell and lights the rim when a returning team approaches.' },
  dripdart: { name: 'Dripdart', fam: 'lizard', el: 'Tide', col: '#6f9e9c',
    base: { hp: 48, pow: 46, grd: 43, spd: 65, wit: 53, spi: 45 },
    learn: [[1,"bubbleJet"],[6,"tidePulse"],[16,"tailwind"],[26,"mistVeil"]],
    dex: 'It follows falling drops to shallow pools, then taps the rock to call its neighbors.' },
  chimespark: { name: 'Chimespark', fam: 'sprite', el: 'Radiant', col: '#d4c5ed',
    base: { hp: 40, pow: 39, grd: 41, spd: 61, wit: 62, spi: 57 },
    learn: [[1,"radiance"],[6,"spark"],[16,"tailwind"],[26,"regrowth"]],
    dex: 'Rarely seen outside quiet hollows, it answers distant bells with a single bright note.' },
  undertone: { name: 'Undertone', fam: 'hyena', el: 'Shade', col: '#504765', unique: 1, big: 1,
    base: { hp: 94, pow: 91, grd: 87, spd: 88, wit: 82, spi: 88 },
    learn: [[1,"shadowSting"],[1,"howl"],[1,"mistVeil"],[1,"bite"]],
    dex: 'Its low call passes through winding stone to guide separated groups back to one another.' },
  /* Sunthread Commons: partners with different strengths. */
  clovercolt: { name: "Clovercolt", fam: "horse", el: "Grove", col: "#a5bb63",
    base: {hp: 54,pow: 47,grd: 45,spd: 62,wit: 43,spi: 49}, learn: [[1,"charge"],[1,"vineLash"],[18,"regrowth"],[32,"tailwind"]], evo: {at: 64,to: "bloomcourser"},
    dex: "It carries loose shelter ties in its mane and waits while slower partners cross the meadow." },
  bloomcourser: { name: "Bloomcourser", fam: "horse", el: "Grove", col: "#6d9a49", big: 1,
    base: {hp: 76,pow: 68,grd: 66,spd: 84,wit: 56,spi: 70}, learn: [[1,"charge"],[1,"vineLash"],[18,"regrowth"],[32,"tailwind"],[64,"thornQuake"]],
    dex: "Flowers open along its mane where young creatures lean against it during a storm." },
  tilthtusk: { name: "Tilthtusk", fam: "boar", el: "Grove", col: "#938353",
    base: {hp: 65,pow: 59,grd: 59,spd: 32,wit: 38,spi: 47}, learn: [[1,"charge"],[1,"vineLash"],[16,"harden"],[28,"regrowth"]],
    dex: "It loosens worn soil beside shared paths, carefully circling the marked nursery beds." },
  hemglow: { name: "Hemglow", fam: "sprite", el: "Radiant", col: "#f3d184",
    base: {hp: 41,pow: 33,grd: 41,spd: 57,wit: 68,spi: 60}, learn: [[1,"spark"],[14,"mistVeil"],[24,"regrowth"],[38,"radiance"]],
    dex: "Its small light marks the edge of a shelter cloth so tired travelers can find a place beneath it." },
  pennantlark: { name: "Pennantlark", fam: "bird", el: "Radiant", col: "#ebbe67",
    base: {hp: 44,pow: 45,grd: 37,spd: 70,wit: 61,spi: 43}, learn: [[1,"peck"],[1,"spark"],[20,"tailwind"],[36,"radiance"]],
    dex: "It flashes its wings above a gathering when the last returning team reaches the hall." },
  ribbonstride: { name: "Ribbonstride", fam: "horse", el: "Gale", col: "#b7cfb8",
    base: {hp: 50,pow: 47,grd: 37,spd: 79,wit: 46,spi: 41}, learn: [[1,"charge"],[1,"gust"],[20,"tailwind"],[36,"mistVeil"]],
    dex: "It runs ahead of sudden gusts and brings wind-loosened ribbons back to their posts." },
  dawntassel: { name: "Dawntassel", fam: "sprite", el: "Radiant", col: "#ffdfa0",
    base: {hp: 39,pow: 34,grd: 42,spd: 63,wit: 64,spi: 58}, learn: [[1,"spark"],[16,"radiance"],[28,"regrowth"],[40,"tailwind"]],
    dex: "A rare visitor at first light, it leaves a gold glimmer on the knots of a well-mended shelter." },
  meadowmantle: { name: "Meadowmantle", fam: "boar", el: "Grove", col: "#668950", big: 1, unique: 1,
    base: {hp: 108,pow: 88,grd: 105,spd: 55,wit: 76,spi: 98}, learn: [[1,"charge"],[1,"thornQuake"],[1,"harden"],[1,"regrowth"]],
    dex: "The guardian rests across the windward edge of nursery ground, keeping tender roots and sleeping young sheltered." },
  /* Farwatch Reach: careful records and the last stretch of the journey. */
  shoalpup: { name: "Shoalpup", fam: "wolf", el: "Tide", col: "#8cabb1", evo: {"to":"soundhowl","at":68},
    base: {"hp":52,"pow":54,"grd":43,"spd":62,"wit":43,"spi":46}, learn: [[1,"bite"],[1,"bubbleJet"],[18,"howl"],[32,"mistVeil"]],
    dex: "It waits at the tideline until every returning paw has reached dry sand." },
  soundhowl: { name: "Soundhowl", fam: "wolf", el: "Tide", col: "#5e8d9c", big: 1,
    base: {"hp":76,"pow":78,"grd":65,"spd":82,"wit":55,"spi":64}, learn: [[1,"bite"],[1,"bubbleJet"],[18,"howl"],[32,"mistVeil"],[68,"tidePulse"]],
    dex: "Its low call passes along the shore, letting separated teams find the same sheltered inlet." },
  keeljaw: { name: "Keeljaw", fam: "croc", el: "Tide", col: "#758f89",
    base: {"hp":66,"pow":58,"grd":62,"spd":30,"wit":40,"spi":44}, learn: [[1,"bite"],[1,"bubbleJet"],[18,"harden"],[32,"tidePulse"]],
    dex: "It nudges drifting planks into the harbor shallows and leaves them where smaller paws can climb." },
  chartwing: { name: "Chartwing", fam: "bird", el: "Gale", col: "#bdd3d5",
    base: {"hp":42,"pow":43,"grd":38,"spd":78,"wit":55,"spi":44}, learn: [[1,"peck"],[1,"gust"],[18,"tailwind"],[32,"mistVeil"]],
    dex: "It circles a lookout twice when fog closes the usual approach, then waits for the shore signal." },
  moorweft: { name: "Moorweft", fam: "spider", el: "Stone", col: "#aba698",
    base: {"hp":50,"pow":44,"grd":65,"spd":34,"wit":57,"spi":50}, learn: [[1,"scratch"],[1,"rockToss"],[18,"webSnare"],[32,"harden"]],
    dex: "Its stout silk catches loose pebbles above paths without hiding the marks travelers follow." },
  inkwhisk: { name: "Inkwhisk", fam: "cat", el: "Shade", col: "#777d98",
    base: {"hp":43,"pow":53,"grd":39,"spd":70,"wit":52,"spi":43}, learn: [[1,"scratch"],[1,"shadowSting"],[18,"mistVeil"],[32,"tailwind"]],
    dex: "It rests beside corrected charts and follows the fresh ink when an old shortcut becomes unsafe." },
  buoyglint: { name: "Buoyglint", fam: "sprite", el: "Radiant", col: "#e8d6a2",
    base: {"hp":40,"pow":32,"grd":44,"spd":56,"wit":66,"spi":62}, learn: [[1,"spark"],[14,"mistVeil"],[24,"regrowth"],[38,"radiance"]],
    dex: "It lights the sheltered side of a mooring post until the last returning team has landed." },
  isleglimmer: { name: "Isleglimmer", fam: "sprite", el: "Radiant", col: "#cde5e9",
    base: {"hp":39,"pow":33,"grd":42,"spd":63,"wit":65,"spi":58}, learn: [[1,"spark"],[16,"radiance"],[28,"mistVeil"],[40,"tailwind"]],
    dex: "Rarely seen beyond the lookouts, it hovers over a dry foothold before vanishing into sea fog." },
  watchlight: { name: "Watchlight", fam: "sprite", el: "Radiant", col: "#f4e0a5", unique: 1, big: 1,
    base: {"hp":96,"pow":68,"grd":88,"spd":82,"wit":104,"spi":92}, learn: [[1,"radiance"],[1,"mistVeil"],[1,"regrowth"],[1,"spark"]],
    dex: "Farwatch Reach's guardian marks a safe approach through fog, waiting for travelers to answer before moving on." },
  /* W11 batch 1: ten previously empty family/element pairs; existing rules and bodies. */
  fernruff: { name: 'Fernruff', fam: 'wolf', el: 'Grove', col: '#719b60',
    base: { hp: 52, pow: 54, grd: 48, spd: 56, wit: 38, spi: 52 },
    learn: [[1,'bite'],[5,'vineLash'],[9,'howl'],[16,'regrowth']], evo: { at: 18, to: 'briarwatch' },
    dex: 'This fern-maned pup leaves gaps in its den hedge so smaller neighbours can shelter with it.' },
  briarwatch: { name: 'Briarwatch', fam: 'wolf', el: 'Grove', col: '#49734b', big: 1,
    base: { hp: 76, pow: 72, grd: 70, spd: 74, wit: 52, spi: 76 },
    learn: [[1,'bite'],[5,'vineLash'],[9,'howl'],[16,'regrowth'],[26,'thornQuake']],
    dex: 'It walks the hedge at dawn, gently carrying lost hatchlings back to their nests.' },
  poolkit: { name: 'Poolkit', fam: 'cat', el: 'Tide', col: '#80b1b8',
    base: { hp: 42, pow: 44, grd: 40, spd: 68, wit: 62, spi: 44 },
    learn: [[1,'scratch'],[5,'bubbleJet'],[12,'mistVeil'],[20,'tidePulse']], evo: { at: 24, to: 'rilllynx' },
    dex: 'It pats rain rings in shallow pools, then watches the ripples reach the reeds.' },
  rilllynx: { name: 'Rilllynx', fam: 'cat', el: 'Tide', col: '#488d9e', big: 1,
    base: { hp: 62, pow: 58, grd: 60, spd: 92, wit: 88, spi: 60 },
    learn: [[1,'scratch'],[5,'bubbleJet'],[12,'mistVeil'],[20,'tidePulse'],[32,'tailwind']],
    dex: 'Its whiskers read currents beneath the bank; it crosses streams without disturbing a nest.' },
  hearthlaugh: { name: 'Hearthlaugh', fam: 'hyena', el: 'Radiant', col: '#d8bb7c', big: 1,
    base: { hp: 68, pow: 56, grd: 56, spd: 78, wit: 78, spi: 84 },
    learn: [[1,'bite'],[6,'spark'],[14,'howl'],[22,'regrowth'],[30,'radiance']],
    dex: 'It never evolves; its warm chuckle steadies frightened companions, and its light grows with practice.' },
  cairnclasp: { name: 'Cairnclasp', fam: 'lizard', el: 'Stone', col: '#a09b88',
    base: { hp: 50, pow: 44, grd: 70, spd: 32, wit: 58, spi: 46 },
    learn: [[1,'tailWhip'],[6,'rockToss'],[12,'harden'],[24,'mistVeil']],
    dex: 'It grips a cairn with all four feet and refuses to let a loose stone fall on the trail.' },
  bogbough: { name: 'Bogbough', fam: 'croc', el: 'Grove', col: '#6f8652',
    base: { hp: 64, pow: 54, grd: 64, spd: 26, wit: 40, spi: 52 },
    learn: [[1,'bite'],[6,'vineLash'],[12,'harden'],[22,'regrowth']],
    dex: 'Willow seedlings root in its ridged back; it rests where the bank needs holding together.' },
  tumbletusk: { name: 'Tumbletusk', fam: 'boar', el: 'Gale', col: '#b5bbc5',
    base: { hp: 50, pow: 58, grd: 40, spd: 72, wit: 38, spi: 42 },
    learn: [[1,'charge'],[6,'gust'],[14,'tailwind'],[28,'howl']],
    dex: 'It rolls into a headwind, scattering seeds through the high meadows with every tumble.' },
  slatehoof: { name: 'Slatehoof', fam: 'horse', el: 'Stone', col: '#89949b',
    base: { hp: 54, pow: 56, grd: 66, spd: 48, wit: 34, spi: 42 },
    learn: [[1,'charge'],[6,'rockToss'],[14,'harden'],[28,'mistVeil']],
    dex: 'Its broad hooves test each ledge before it lets the rest of the herd follow.' },
  kilnchirp: { name: 'Kilnchirp', fam: 'bird', el: 'Ember', col: '#cb7752',
    base: { hp: 40, pow: 42, grd: 36, spd: 70, wit: 68, spi: 44 },
    learn: [[1,'peck'],[6,'emberSnap'],[14,'tailwind'],[24,'flameRush']],
    dex: 'It dries its clay-lined nest beside warm vents, singing when the mud is ready for chicks.' },
  dewspinner: { name: 'Dewspinner', fam: 'spider', el: 'Tide', col: '#83b8bb',
    base: { hp: 42, pow: 34, grd: 48, spd: 52, wit: 70, spi: 54 },
    learn: [[1,'bite'],[6,'bubbleJet'],[12,'webSnare'],[22,'mistVeil']],
    dex: 'Its cupped webs collect morning dew; thirsty shore creatures drink before it rebuilds them.' },
  veilmote: { name: 'Veilmote', fam: 'sprite', el: 'Shade', col: '#85779f', unique: 1, big: 1,
    base: { hp: 84, pow: 54, grd: 82, spd: 90, wit: 116, spi: 114 },
    learn: [[1,'shadowSting'],[1,'mistVeil'],[16,'webSnare'],[28,'regrowth']],
    dex: 'A solitary mote folds deep shade around abandoned nests, keeping their last warmth through the night.' }
,
  /* T37 batch 2: eight empty pairs, three long lines; catalogueEvos is Godot handoff data. */
  flintpup: { name: "Flintpup", fam: "wolf", el: "Stone", col: "#aaa18b",
    base: {hp: 50,pow: 54,grd: 58,spd: 48,wit: 36,spi: 54},
    learn: [[1,"bite"],[6,"rockToss"],[12,"harden"],[20,"howl"]], evo: {"at":18,"to":"cairnhound"},
    dex: "On the Emberfall Highlands' cool scree, it taps loose stones with its paws before leading the pack across." },
  cairnhound: { name: "Cairnhound", fam: "wolf", el: "Stone", col: "#827b6b", big: 1,
    base: {hp: 74,pow: 76,grd: 84,spd: 64,wit: 48,spi: 74},
    learn: [[1,"bite"],[6,"rockToss"],[12,"harden"],[20,"howl"],[30,"mistVeil"]], evo: {"at":36,"to":"ridgewarden"},
    dex: "It keeps Cloudglass Pass's cairns upright through winter, resting against the smallest stones when the wind rises." },
  ridgewarden: { name: "Ridgewarden", fam: "wolf", el: "Stone", col: "#656b70", big: 1,
    base: {hp: 92,pow: 94,grd: 108,spd: 76,wit: 54,spi: 86},
    learn: [[1,"bite"],[6,"rockToss"],[12,"harden"],[20,"howl"],[30,"mistVeil"],[40,"charge"]],
    dex: "Cloudglass Pass's oldest ridge packs follow its patient steps; it returns for the last pup before leaving a ledge." },
  seedpip: { name: "Seedpip", fam: "bird", el: "Grove", col: "#9ca86a",
    base: {hp: 42,pow: 38,grd: 38,spd: 70,wit: 66,spi: 46},
    learn: [[1,"peck"],[6,"vineLash"],[12,"tailwind"],[20,"regrowth"]], evo: {"at":16,"to":"hedgelark"},
    dex: "In Thornwood, it tucks fallen seeds into fence cracks and checks them again after rain." },
  hedgelark: { name: "Hedgelark", fam: "bird", el: "Grove", col: "#688c51", big: 1,
    base: {hp: 62,pow: 54,grd: 56,spd: 94,wit: 86,spi: 68},
    learn: [[1,"peck"],[6,"vineLash"],[12,"tailwind"],[20,"regrowth"],[28,"thornQuake"]], evo: {"at":34,"to":"boughchorus"},
    dex: "Thornwood's hedges shelter its leafy nests; its dawn call waits until every nestling answers." },
  boughchorus: { name: "Boughchorus", fam: "bird", el: "Grove", col: "#427b54", big: 1,
    base: {hp: 80,pow: 66,grd: 72,spd: 108,wit: 100,spi: 84},
    learn: [[1,"peck"],[6,"vineLash"],[12,"tailwind"],[20,"regrowth"],[28,"thornQuake"],[38,"howl"]],
    dex: "In Sunthread Commons, it sings from orchard branches, leaving the first ripe fruit for the smaller birds." },
  saillet: { name: "Saillet", fam: "lizard", el: "Gale", col: "#b0c2b9",
    base: {hp: 42,pow: 40,grd: 40,spd: 70,wit: 66,spi: 42},
    learn: [[1,"tailWhip"],[6,"gust"],[12,"tailwind"],[20,"mistVeil"]], evo: {"at":18,"to":"draftscale"},
    dex: "On Saltmarsh Coast, it lifts its little back sail to dry after rain, leaning into whichever breeze smells of home.",
    catalogueEvos: [{"to":"fogsail","at":18,"place":"cloudglass","hint":"Maren thinks the mists of Cloudglass Pass quiet a young Saillet into a Fogsail."},{"to":"sunfrill","at":18,"bond":3,"hint":"A Saillet devoted to its tamer may grow a sail that holds the sunlight."},{"to":"draftscale","at":18,"hint":"Most Saillet follow the rising wind and become Draftscale."}] },
  draftscale: { name: "Draftscale", fam: "lizard", el: "Gale", col: "#7ca4ad", big: 1,
    base: {hp: 62,pow: 58,grd: 60,spd: 98,wit: 84,spi: 58},
    learn: [[1,"tailWhip"],[6,"gust"],[12,"tailwind"],[20,"mistVeil"],[30,"charge"]], evo: {"at":36,"to":"stormfrill"},
    dex: "Above Cloudglass Pass, its broad sail catches the rising air; it circles back whenever a young Saillet falls behind." },
  stormfrill: { name: "Stormfrill", fam: "lizard", el: "Gale", col: "#5f7f9b", big: 1,
    base: {hp: 76,pow: 76,grd: 76,spd: 118,wit: 98,spi: 66},
    learn: [[1,"tailWhip"],[6,"gust"],[12,"tailwind"],[20,"mistVeil"],[30,"charge"],[40,"howl"]],
    dex: "Cloudglass Pass's storm winds bend its great frill, but it folds the sail to shelter its companions from the worst gusts." },
  sunfrill: { name: "Sunfrill", fam: "lizard", el: "Radiant", col: "#d3b66a", big: 1,
    base: {hp: 68,pow: 56,grd: 62,spd: 88,wit: 82,spi: 64},
    learn: [[1,"tailWhip"],[6,"spark"],[12,"regrowth"],[20,"radiance"],[30,"mistVeil"]],
    dex: "Sunthread Commons's fence rails are its sunny resting places; its bright sail shades the little creatures gathered underneath." },
  fogsail: { name: "Fogsail", fam: "lizard", el: "Shade", col: "#918ba9", big: 1,
    base: {hp: 58,pow: 54,grd: 62,spd: 94,wit: 88,spi: 64},
    learn: [[1,"tailWhip"],[6,"shadowSting"],[12,"mistVeil"],[20,"webSnare"],[30,"gust"]],
    dex: "It drifts along Cloudglass Pass's fog banks, showing the pale edge of its sail to companions who might lose the path." },
  cinderstitch: { name: "Cinderstitch", fam: "spider", el: "Ember", col: "#cc815b", big: 1,
    base: {hp: 62,pow: 40,grd: 64,spd: 68,wit: 94,spi: 92},
    learn: [[1,"bite"],[6,"emberSnap"],[12,"webSnare"],[22,"harden"],[32,"flameRush"]],
    dex: "Beside the Emberfall Highlands' warm vents, it stitches ash into a snug nest. It never evolves: eight careful feet already make all the shelter its family needs." },
  laughrill: { name: "Laughrill", fam: "hyena", el: "Tide", col: "#78a7b2", big: 1,
    base: {hp: 72,pow: 68,grd: 58,spd: 88,wit: 56,spi: 78},
    learn: [[1,"bite"],[6,"bubbleJet"],[14,"howl"],[24,"mistVeil"],[34,"tidePulse"]],
    dex: "In Stillreed Basin, its bubbling chuckle carries over the pools. It never evolves; the same familiar voice guides its family home through every flood." },
  fordfoal: { name: "Fordfoal", fam: "horse", el: "Tide", col: "#88ada5", big: 1,
    base: {hp: 82,pow: 58,grd: 74,spd: 88,wit: 48,spi: 70},
    learn: [[1,"charge"],[6,"bubbleJet"],[14,"mistVeil"],[24,"tailwind"],[34,"tidePulse"]],
    dex: "At Stillreed Basin's shallow crossings, it tests the riverbed before anyone follows. It never evolves: a small, sure-footed body is just right for the reed paths." }
};
const STARTERS = ['cindercub', 'ripplet', 'mosshog'];

const BIOMES = {
  thornwood: { name: 'Thornwood', lv: [2, 12], sky: ['#9fd0f0', '#e0f0d0'], hill: '#4f7a3a', ground: '#6a9a48',
    wild: [['glimmerwing', 22], ['pebblepaw', 20], ['duskweaver', 16], ['bogsnap', 14], ['emberling', 12], ['gnawhound', 12], ['galefoal', 4], ['sunspark', 3], ['fernruff', 6], ['bogbough', 5], ["seedpip",6]] },
  saltmarsh: { name: 'Saltmarsh Coast', lv: [12, 22], req: 'thorn', sky: ['#7dbbd8', '#d1e9ed'], hill: '#a6ae75', ground: '#7f9b6c',
    wild: [['brineskit', 24], ['dunepounce', 20], ['reedtusk', 16], ['wrackjaw', 14], ['kiteskirl', 18], ['spindriftfoal', 8], ['foamglint', 3], ['poolkit', 6], ['dewspinner', 5], ["saillet",6]] },
  emberfall: { name: 'Emberfall Highlands', lv: [22, 32], req: 'tide', sky: ['#a6a6bf', '#efd0aa'], hill: '#81756d', ground: '#a58a68',
    wild: [['slaglet', 24], ['cragskein', 16], ['ventwhisk', 16], ['thermwing', 14], ['screegrin', 10], ['glowmote', 3], ['cairnclasp', 6], ['kilnchirp', 6], ['hearthlaugh', 2], ["flintpup",6], ["cinderstitch",4]] },
  cloudglass: { name: 'Cloudglass Pass', lv: [32, 42], req: 'ember', sky: ['#aebdcc', '#eef2f4'], hill: '#8d97a3', ground: '#a3ae98',
    wild: [['mistfinch', 22], ['shalecat', 20], ['cirrusmane', 18], ['pallweaver', 16], ['gritbeak', 14], ['fogtail', 12], ['lanternwisp', 3], ['tumbletusk', 6], ['slatehoof', 6], ["cairnhound",5], ["draftscale",5], ["fogsail",3]] },
  stillreed: { name: 'Stillreed Basin', lv: [46, 60], req: 'beacon', sky: ['#81988b', '#d6d8b2'], hill: '#65834c', ground: '#a49661',
    wild: [['reedlet', 24], ['siltjaw', 18], ['rillwhisk', 18], ['orchardroot', 18], ['gustreed', 16], ['duskcord', 14], ['glassbill', 3], ["laughrill",5], ["fordfoal",5]] },
  hollowecho: { name: 'Hollowecho Hills', lv: [58, 64], req: 'reed', sky: ['#7c9190', '#c5cfb9'], hill: '#657c60', ground: '#8c8c80',
    wild: [['hushpup',24],['umbrelace',18],['flintroot',18],['ledgewhisk',18],['bellmote',16],['dripdart',14],['chimespark',3]] },
  sunthread: {"name":"Sunthread Commons","lv":[62,68],"req":"echo","sky":["#9fcfe4","#f1e6b6"],"hill":"#90ac5f","ground":"#b4bf70","wild":[["clovercolt",24],["tilthtusk",18],["hemglow",18],["pennantlark",16],["ribbonstride",14],["dawntassel",3],["sunfrill",4],["boughchorus",4]]},
  farwatch: {"name":"Farwatch Reach","lv":[66,72],"req":"loom","sky":["#8caebe","#dce5db"],"hill":"#748b88","ground":"#aab29a","wild":[["shoalpup",24],["keeljaw",18],["chartwing",18],["moorweft",16],["inkwhisk",16],["buoyglint",14],["isleglimmer",3]]}
};

const RIVAL = { name: 'Wren', col: '#d85a8a' };
/* Speakers in dialogue scenes. Portraits are drawn in 09-dialogue.js from these colors.
   hair: short | long | bun | spiky | hood | hat. A line is [who, text]; who '' = narration, '@species' = a creature. */
const CAST = {
  maren: { name: 'Keeper Maren', skin: '#d9a77c', hair: 'bun', hairCol: '#c9c3b8', shirt: '#5b8a4a', bg: '#cfe7c4', title: 'Larkhaven ranch keeper' },
  wren: { name: 'Wren', skin: '#f0c7a4', hair: 'spiky', hairCol: '#3a2230', shirt: '#d85a8a', bg: '#f6d3e1', title: 'Your rival' },
  isolde: { name: 'Warden Isolde', skin: '#b98262', hair: 'long', hairCol: '#2a3b2c', shirt: '#3d6b52', bg: '#c9dfc8', title: 'Warden of Thornwood' },
  nerys: { name: 'Warden Nerys', skin: '#8a5a3c', hair: 'hat', hairCol: '#9a948a', hatCol: '#3c5a6a', shirt: '#2f5e78', bg: '#cfe3ea', title: 'Warden of the Saltmarsh' },
  toren: { name: 'Warden Toren', skin: '#b87d59', hair: 'short', hairCol: '#ddd0bd', shirt: '#98543c', bg: '#ead0b2', title: 'Warden of Emberfall' },
  vessa: { name: 'Warden Vessa', skin: '#c99a74', hair: 'bun', hairCol: '#e0d2b0', shirt: '#4a6e8e', bg: '#dde6ee', title: 'Warden of Cloudglass Pass' },
  olan: { name: 'Warden Olan', skin: '#ac7957', hair: 'hat', hairCol: '#c4c5ac', hatCol: '#82774e', shirt: '#5b7c69', bg: '#d4dfc5', title: 'Warden of Stillreed Basin' },
  senna: { name: 'Warden Senna', skin: '#bd8e6d', hair: 'short', hairCol: '#77747f', shirt: '#596b62', bg: '#ced6cf', title: 'Warden of Hollowecho Hills' },
  halen: {"name":"Warden Halen","skin":"#a97a56","hair":"short","hairCol":"#b0a78c","shirt":"#758b53","bg":"#e9e3bd","title":"Warden of Sunthread Commons"},
  edrin: {"name":"Edrin","title":"Listening court","shirt":"#6d8268","skin":"#deb08b","hair":"short","hairCol":"#66595a","bg":"#e5e8db"},
  maela: {"name":"Maela","title":"Shelter court","shirt":"#698796","skin":"#ba8767","hair":"bun","hairCol":"#66595a","bg":"#e5e8db"},
  corven: {"name":"Corven","title":"Shared-work court","shirt":"#b18d66","skin":"#deb08b","hair":"short","hairCol":"#66595a","bg":"#e5e8db"},
  liora: {"name":"Liora","title":"Honest-record court","shirt":"#b3a56d","skin":"#ba8767","hair":"bun","hairCol":"#66595a","bg":"#e5e8db"},
  avenne: {"name":"Champion Avenne","title":"Champion of the Returning Light League","shirt":"#8b7095","skin":"#deb08b","hair":"short","hairCol":"#66595a","bg":"#e5e8db"},
  nelva: {"name":"Nelva","title":"League rest keeper","shirt":"#798d88","skin":"#ba8767","hair":"bun","hairCol":"#66595a","bg":"#e5e8db"},
  rysa: {"name":"Warden Rysa","skin":"#bd906e","hair":"bun","hairCol":"#62565a","shirt":"#547c8a","bg":"#dbe6e1","title":"Warden of Farwatch Reach"}
};
/* Scenes that aren't tied to an explore count. */
const SCENES = {
  leagueEnding: [
    ["","At the gate, Wren stands on tiptoe until she sees your team. Maren has a blanket over one arm; Isolde waits beside the lookout stones."],
    ["wren","Champion! I practiced saying it quietly. That did not work. CHAMPION!"],
    ["maren","Come here, {name}. All of you. I remember three little ones waiting by a ranch gate. Look how far those paws have carried you."],
    ["isolde","The last pale seam has gone from the clouds. The water holds every colour of the shore. The world remembers its colours fully now."],
    ["","Along the coast, a lantern answers. In the basin, a sheltered wake crosses the reeds. Beyond the hills, the guardians answer in calls, light and leaf-shadow. Some travel beside tamers; others remain at home."],
    ["isolde","Their memory did not need a cage. Every bond, every safe return, reminded the land. The reason it faded is still an older story."],
    ["wren","We should go home and tell everyone. Then we should take the long way. I know a few places we missed."],
    ["maren","The ranch gate will be open. A Champion still needs somewhere to rest."],
    ["","Your journey is complete. You earned the Champion title. Keep exploring and raising your partners; more adventures after the league are coming."]
  ],
  intro: [
    ['', 'The supply cart stops at the edge of the trees. Larkhaven is a handful of roofs, a windmill and a ranch fence that runs right up to the forest.'],
    ['', 'Everything here looks faded, like an old picture left in the sun: the colours are all there, but thin and grey, as if the whole valley were half asleep.'],
    ['maren', 'You made it! I\'m Maren. I keep the ranch here, and I\'ve paired more young tamers with their first partner than I can count.'],
    ['maren', 'And yes, the colour. Everyone stares on their first day. The whole region faded long ago. Our Warden, Isolde, says it comes back a little with every bond a tamer earns. Maybe you\'ll be the one to prove her right.'],
    ['maren', 'Out there is Thornwood. Past it, the coast, the hills, places nobody has mapped yet. The creatures out there are wild, but not cruel. Treat them well and some will choose to walk with you.'],
    ['maren', 'That\'s the whole secret, really. Nobody owns a creature. You earn a bond, and the bond does the rest. Now, three little ones have been waiting all week to meet you.']
  ],
  rival1: [
    ['', 'The ranch gate bangs open.'],
    ['wren', 'Am I late? Maren, you said the new tamer was coming tomorrow!'],
    ['maren', 'I said today, Wren. This is Wren. Same age as you, same first day, and twice the noise.'],
    ['wren', 'Hey! So you picked {starter}? Then I\'m taking {rival}. Don\'t look at me like that, it\'s called strategy. Let\'s battle!']
  ],
  rival1Win: [
    ['wren', 'Okay. Okay! Not bad. {rival} and I were just warming up.'],
    ['maren', 'You two will push each other a long way. Now go on, Thornwood won\'t explore itself. Bring your team back here to rest whenever they need it.'],
    ['maren', 'And {name}? Watch how the wild ones move. Tire one out, toss a lure, and keep it calm. If it trusts you, it will come home with you.'],
    ['maren', 'Three can travel with you at a time. The rest live here at the ranch with me, and I look after them. A creature that has bonded with you always finds its way back to you.'],
    ['maren', 'One more thing. Here: my old Wilddex. Every creature you meet gets a sketch in it, and every one that bonds with you gets its whole page. Nobody has ever filled one.'],
    ['maren', 'Over a hundred kinds live between here and the far coast, and some only come out in the rain, at night, or for tamers they trust. Fill it as far as you can, and bring it back to show me.']
  ],
  /* the world starts faded (the Pocket era); the first badge brings its color back */
  colorReturns: [
    ['', 'The badge is warm in your hand. Then the whole forest seems to take a breath.'],
    ['', 'The grey lifts like mist: blue pours into the sky. Red roofs far to the south. Every leaf a different shade. Your partner\'s coat, bright as the day you met.'],
    ['isolde', 'Ah. You see it too. The region was faded long ago, and the guardians still remember it as it was. Every bond you earn reminds the world a little more.'],
    ['isolde', 'Take these as well: Warden\'s boots. Hold Shift and you\'ll cover twice the ground. Now go and show Maren. She\'ll pretend she isn\'t moved.']
  ],
  /* the second badge brings light and depth (16-bit -> HD-2D) */
  lightReturns: [
    ['', 'The tide turns. For a moment the whole beach holds still, and then the light changes.'],
    ['', 'Shadows stretch out long and soft. The lighthouse stands up off the sand. Far down the coast, the dunes fade into a blue haze you could almost walk into.'],
    ['nerys', 'Huh. Forty years on this coast and I\'ve never seen the far shore that clear.'],
    ['nerys', 'Keep your eyes open in the reeds now, {name}. When the world has depth, the wild ones stop hiding in it. And the weather\'s going to start doing as it pleases.']
  ],
  /* the third badge makes the world solid enough to walk all the way around (HD-2D -> Diorama) */
  solidReturns: [
    ['', 'The ground hums under your feet, low and steady, the way Nerys said it might.'],
    ['', 'The springs, the ridges, the path behind you: everything settles, solid and whole, like a model of the mountain someone carved and set down on a table. You could walk all the way around it.'],
    ['toren', 'There. Feel that? Old stones remember their shapes. Now and then they remind the rest of us.'],
    ['toren', 'Your partner looks like it could carry you up the next ridge, {name}. Press R and let it. Patience is good. So is a ride.']
  ]
};
/* Story beats trigger on the number of times you've explored. `text` goes to the journal; `lines` play as a
   scene before the fight and `win` after it. In lines, {name} {starter} {rival} are filled in. */
const STORY = [
  { at: 12, id: 'rival2', title: 'Wren again', text: 'Wren caught up with you on the Thornwood trail for a rematch.',
    lines: [['', 'Someone is sitting on a stump in the middle of the trail, swinging their legs.'],
      ['wren', 'Finally! I\'ve been waiting here for an hour. Okay, ten minutes. Still!'],
      ['wren', 'I caught a Glimmerwing yesterday. It sat on my head until I gave up and said yes. Want to see what we can do?']],
    win: [['wren', 'You and your team are really clicking. I can tell they trust you.'], ['wren', 'I won\'t lose next time. Probably. See you deeper in!']],
    team: [['glimmerwing', 6], ['$rival', 7]] },
  { at: 20, id: 'elder', title: 'Something moves in the old trees', text: 'Elderhorn, the guardian of Thornwood, stepped out of the oldest trees.',
    lines: [['', 'The birds stop. Even the wind stops. The trees here are older than Larkhaven, older than anyone\'s stories about it.'],
      ['', 'Between two trunks stands a stag of moss and bark, antlers hung with flowers. Elderhorn, the guardian of Thornwood. Maren said it shows itself only to tamers it is curious about.'],
      ['@elderhorn', 'It lowers its antlers. Not an attack. A test.']],
    win: [['@elderhorn', 'Elderhorn lowers its great head and breathes on your hands. The moss on its back flowers.'], ['', 'The guardian of Thornwood has chosen to walk with you.']],
    wild: ['elderhorn', 11, 4] },
  /* gate: a Warden. They wait for you to challenge them (a button, not a surprise) and award that badge. */
  { at: 26, id: 'warden', gate: 'thorn', title: 'The Thornwood Warden', text: 'Warden Isolde tested your bond at the Thornwood gate.',
    lines: [['', 'The road north ends at a gate of living hawthorn. A tall woman waits beside it, three creatures resting at her feet.'],
      ['isolde', 'Maren wrote to me about you, {name}. She does that when she thinks someone is worth watching.'],
      ['isolde', 'Wardens don\'t judge strength. Strength is easy. We judge whether your team fights for you or just near you.'],
      ['isolde', 'Show me your bond. If it holds, the road north is yours.']],
    win: [['isolde', 'Your bond is real. They looked back at you before every move. Not many teams do that.'],
      ['isolde', 'Take the Thorn Badge. The gate will open for you now, and the coast is waiting.'],
      ['isolde', 'One more thing. Thornwood isn\'t the only place with a guardian. Every region has something old watching it. Be kind when you meet them.']],
    trainer: 'Warden Isolde', team: [['pebblepaw', 11], ['bogsnap', 12], ['thornback', 14]] },
  /* Saltmarsh Coast: beats count explores made in that biome */
  { biome: 'saltmarsh', at: 6, id: 'rival3', title: 'Wren on the coast', text: 'Wren was waiting where the dunes meet the marsh for another battle.',
    lines: [['', 'Where the dunes meet the marsh, a familiar figure is building a very bad sandcastle.'],
      ['wren', 'There you are! I heard you beat Isolde. I got here first, though. Two whole days first.'],
      ['wren', 'The coast changes a team. Wind, salt, the tide pulling at your feet. Let me show you how much.']],
    win: [['wren', 'Ugh! Fine. Fine! You\'re good.'], ['wren', 'Hey, have you heard the howling at low tide? The old fishers say it\'s the keeper of the coast. I\'m going to find it first.']],
    team: [['kiteskirl', 17], ['brineskit', 18], ['$rival', 19]] },
  { biome: 'saltmarsh', at: 14, id: 'tidewolf', title: 'A howl over the breakers', text: 'Breakwatermane, keeper of the coast, appeared at low tide.',
    lines: [['', 'The tide pulls back further than it should. Fish flop on the bare sand. Far out, something howls.'],
      ['', 'A great wolf walks out of the surf, its mane breaking like a wave and reforming. Breakwatermane, keeper of the coast. Every wave seems to wait for it.'],
      ['@breakwatermane', 'It watches your team for a long moment, then steps forward.']],
    win: [['@breakwatermane', 'Breakwatermane shakes the sea from its mane and sits beside you, as calm as still water.'], ['', 'Somewhere up the beach, Wren yells something that sounds a lot like \"NO WAY.\"']],
    wild: ['breakwatermane', 21, 4] },
  { biome: 'saltmarsh', at: 24, id: 'warden2', gate: 'tide', title: 'The Saltmarsh Warden', text: 'Warden Nerys tested your team on the tidal flats below the lighthouse.',
    lines: [['', 'Below the old lighthouse the tide has pulled back, leaving a mile of rippled sand. A woman in a salt-stained hat waits on it, ankle-deep and unbothered.'],
      ['nerys', 'You\'re the one Isolde wrote about. She says your team looks back at you. Good. Out here, that isn\'t enough.'],
      ['nerys', 'The sea changes every six hours. A team that only knows one way to fight gets swept off its feet. I judge whether yours can change with it.'],
      ['nerys', 'The flats flood in an hour. Let\'s not waste it.']],
    win: [['nerys', 'You shifted when I shifted. Your team read the water as fast as mine did. That\'s the whole test.'],
      ['nerys', 'Take the Tide Badge. Your creatures can grow stronger now, and the road up to the Emberfall Highlands is open.'],
      ['nerys', 'Mind the hot springs up there. And if the ground hums under your feet, stand still and be polite. Something old lives in that mountain too.']],
    trainer: 'Warden Nerys', team: [['wrackjaw', 21], ['spindriftfoal', 22], ['brineskit', 24]] },
  /* Emberfall Highlands: beats count explores made in that biome */
  { biome: 'emberfall', at: 6, id: 'rival4', title: 'Wren at Warmstep Rise', text: 'Wren challenged you to a rematch on the warm stone trail above the coast.',
    lines: [['', 'The coast is a blue ribbon far below Warmstep Rise, where Wren is trying to keep a scarf out of a Thermwing\'s beak.'],
      ['wren', 'I beat you up here. That\'s a win. A small one. Still counts!'],
      ['wren', 'Thermwing and I have an agreement: it gives back my scarf, and it gets the first turn. That\'s teamwork.'],
      ['wren', 'Your team looks happy. Mine looks ready for a rematch. Come on, {name}, let\'s see what the climb taught us!']],
    win: [['wren', 'All right, you win. I\'m blaming the hill. It was clearly on your side.'],
      ['wren', 'Next time, I pick the hill. Come on, there\'s a warm spring ahead; both our teams have earned a rest.']],
    team: [['thermwing', 27], ['kilntusk', 28], ['$rival', 29]] },
  { biome: 'emberfall', at: 14, id: 'hearthstag', title: 'Hoofbeats beneath the mountain', text: 'Hearthcrown, guardian of Emberfall, emerged beside the highland springs.',
    lines: [['', 'The trail reaches a bowl of black stone where warm water bubbles softly through the cracks. Hoofbeats sound through the steam.'],
      ['', 'A great stag steps into view, ember light threaded through its antlers: Hearthcrown, guardian of Emberfall. The springs glow a little brighter around it.'],
      ['@hearthcrown', 'It nudges a loose stone away from your partner\'s feet, then lowers its antlers and waits. A gentle invitation to show your bond.']],
    win: [['@hearthcrown', 'Hearthcrown folds its legs beside your team, warming the stone beneath their tired paws.'],
      ['', 'When you rise to leave, the guardian rises too, ready to share the next stretch of the trail.']],
    wild: ['hearthcrown', 31, 4] },
  { biome: 'emberfall', at: 24, id: 'warden3', gate: 'ember', title: 'The Emberfall Warden', text: 'Warden Toren tested your patience on the warm stone above the springs.',
    lines: [['', 'Above the springs, steam drifts across a ring of warm stone. A grey-haired man waits with three creatures, letting a Glowmote finish its nap on his sleeve.'],
      ['toren', 'Welcome, {name}. Give us a moment. My smallest partner takes punctuality as a suggestion.'],
      ['toren', 'Up here, rushing across a hot ledge gets everyone hurt. I judge patience: can you wait for a safe opening when every part of you wants to push ahead?'],
      ['toren', 'Keep a steady pace, and give your team room to breathe. The mountain will still be here when we finish.']],
    win: [['toren', 'You waited without giving up. Even under pressure, you left your partners time to find their footing. Well done.'],
      ['toren', 'Take the Ember Badge. Your creatures can grow stronger now. You have earned it, and a sit by the springs.'],
      ['toren', 'Further on, beyond the high pass, there are old stones that stay warm through winter. Something was keeping watch there long before we Wardens arrived. Walk slowly, and listen.']],
    trainer: 'Warden Toren', team: [['cragskein', 31], ['glowmote', 32], ['kilntusk', 34]] },
  /* Cloudglass Pass: beats count explores made in that biome */
  { biome: 'cloudglass', at: 6, id: 'rival5', title: 'Wren in the cloud', text: 'Wren took a shortcut through the pass, then turned back for a lost traveler. The rematch waited until everyone was down safe.',
    lines: [['', 'The cloud closes in until you can barely see your partner. Somewhere above, a familiar voice is shouting directions at nobody in particular.'],
      ['wren', 'There you are! I found a shortcut. It was a great shortcut. Then I found a lost trader on it, so it got a bit less short.'],
      ['wren', 'He\'s safe at the shelter now. Turns out you can\'t win a race if you leave people on the ledge. Who knew. Maren, probably.'],
      ['wren', 'Anyway! Everyone\'s down, so it counts as a fair start. Let\'s battle!']],
    win: [['wren', 'You beat me AND I did a good deed today. I\'m calling that a draw. A moral draw.'],
      ['wren', 'The trader says there\'s a bird up here that glows like a lamp. Bet it\'s just a really shiny Mistfinch. Bet you want to find out anyway.']],
    team: [['cirrusmane', 37], ['cloudharrier', 38], ['$rival', 39]] },
  { biome: 'cloudglass', at: 14, id: 'lampbird', title: 'A light in the cloud', text: 'Lanterncrest, guardian of Cloudglass Pass, appeared where the path vanished into the cloud.',
    lines: [['', 'The cloud is so thick that the path ends a step in front of you. Then, high above, a light comes on. Then another, closer.'],
      ['', 'A great bird drops out of the white, its crest burning like a lamp: Lanterncrest, guardian of the pass. Where its light falls, you can see a shelter you would have walked straight past.'],
      ['@lanterncrest', 'It lands on the rock beside you and tilts its head, waiting to see whether you\'ll follow the light or test it.']],
    win: [['@lanterncrest', 'Lanterncrest settles its wings and the light in its crest softens, warm as a window at night.'],
      ['', 'When you set off again, the light goes with you, a little ahead, the way a friend walks in the dark.']],
    wild: ['lanterncrest', 41, 4] },
  { biome: 'cloudglass', at: 24, id: 'warden4', gate: 'beacon', title: 'The Cloudglass Warden', text: 'Warden Vessa tested your team on the shelter ledge at the top of the pass.',
    lines: [['', 'At the top of the pass a stone shelter clings to the ledge, a rope strung from its door into the cloud. A woman is coiling the rope, humming.'],
      ['vessa', 'Hello, {name}! Toren said you were patient. Good. Up here, patience is how you wait for the cloud. What I judge is what you do while you wait.'],
      ['vessa', 'Nobody crosses this pass alone, not even me. I lose my way twice a season. The trick is shouting for help before you need it, and answering when someone else shouts.'],
      ['vessa', 'So: does your team lean on each other, or does everyone try to carry the whole mountain? Let\'s find out.']],
    win: [['vessa', 'There it is. They covered for each other every time one of them stumbled. That\'s the whole test, and you passed it before I finished asking.'],
      ['vessa', 'Here, the Beacon Badge. Your team can grow stronger now. Keep it where you can see it when the cloud comes down.'],
      ['vessa', 'Past the pass the land opens up, wide and wet. I\'ve never been. If you go, shout back now and then, would you?']],
    trainer: 'Warden Vessa', team: [['shalecat', 41], ['lanternwisp', 42], ['cloudharrier', 44]] },
  /* Stillreed Basin: a fair restart, a sheltered crossing and a test of restraint. */
  { biome: 'stillreed', at: 6, id: 'rival6', title: 'A fair start at the ferry', text: 'Wren stopped the rematch to free a tangled ferry rope with you, then asked for a fair restart on dry ground.',
    lines: [['', 'Wren has just called the first move when a ferry rope snags beneath the landing. The boat tilts, and she waves her team back.'],
      ['wren', 'Wait! That rope is pulling the ferry sideways. Can you hold this end while I free it? We can argue about who was winning after nobody is falling in.'],
      ['', 'Together you loosen the knot. The ferry settles, and its passengers step onto the bank while both teams wait.'],
      ['wren', 'Right. Dry ground, both teams rested, nobody tangled. A fair restart! I am still planning to win, {name}.']],
    win: [['wren', 'You won the restart. The first three seconds do not count. That is a very official ferry rule I have just invented.'],
      ['wren', 'Thanks for holding the rope. Turns out asking for a hand leaves both of mine free to battle. We should do that more.']],
    team: [['gustreed', 46], ['duskcord', 48], ['$rival', 50]] },
  { biome: 'stillreed', at: 14, id: 'stillwake', title: 'The quiet crossing', text: 'Stillwake, guardian of Stillreed Basin, sheltered a crossing through the flooded reeds.',
    lines: [['', 'Rain swells the channel until the low bank disappears. Small creatures wait on a reed island with nowhere dry to step.'],
      ['', 'A great croc rises beside them: Stillwake, guardian of the basin. Its broad back shelters the crossing, and its wake smooths the water as the little ones follow.'],
      ['@stillwake', 'It waits until the last creature reaches the bank, then turns toward your team. The quiet water leaves room for an invitation.']],
    win: [['@stillwake', 'Stillwake lowers its broad head beside your partner. The channel behind it stays calm.'],
      ['', 'When your team walks on, the guardian follows at a patient distance, leaving the landing clear for the next crossing.']],
    wild: ['stillwake', 50, 4] },
  { biome: 'stillreed', at: 24, id: 'warden5', gate: 'reed', title: 'The Stillreed Warden', text: 'Warden Olan tested restraint beside the ferry landing, where a careless victory could upset another crossing.',
    lines: [['', 'Beside the landing, a ferryman coils a dry rope while his three partners leave space for a Rillwhisk to pass.'],
      ['olan', 'Welcome, {name}. I am Olan. If you came to make a splash, the rain has already booked every available slot.'],
      ['olan', 'A stronger team can win carelessly. I judge restraint: can yours leave a safe crossing for someone smaller while the battle is yours to take?'],
      ['olan', 'The ferry has right of way. Let your partners read the bank, and show me how you win without making every neighbor pay for it.']],
    win: [['olan', "You left them room. Your team kept its footing without taking everyone else's. That is the kind of strength this basin can live beside."],
      ['olan', 'Take the Reed Badge. Your partners can grow to level sixty now. Please celebrate on the dry boards; I have only just mopped them.'],
      ['olan', 'Stillwake keeps a quiet crossing, and now you know why we keep the landing open. Carry that care wherever your team goes next.']],
    trainer: 'Warden Olan', team: [['orchardroot', 53], ['ferrycrest', 54], ['siltjaw', 55]] },
  /* Hollowecho Hills: listen before choosing the passage. */
  {
  biome: 'hollowecho',
  at: 6,
  id: 'rival7',
  title: 'The passage that answers late',
  text: 'Wren listened to her uneasy partner at a wrong passage, then chose the familiar trail for your rematch.',
  lines: [
    [
      '',
      'Wren has drawn an arrow toward a bright cave mouth. Her partner stops short and looks back at her, ears low.'
    ],
    [
      'wren',
      'That was my very clever shortcut. The echo comes back wrong, though. You heard it before I did, did you?'
    ],
    [ '', 'She rubs out the arrow and follows her partner around the outcrop to the broad trail.' ],
    [
      'wren',
      'Listening was the cleverer move. Please remember I said something sensible before you beat me, {name}. Ready?'
    ]
  ],
  win: [
    [ 'wren', 'All right, you win. My shortcut lost before the battle even started.' ],
    [
      'wren',
      'My partner knew the way. Next time I will ask before I draw the arrow. You can still expect a rematch.'
    ]
  ],
  team: [ [ 'ledgewhisk', 58 ], [ 'hushmane', 60 ], [ '$rival', 61 ] ]
},
  {
  biome: 'hollowecho',
  at: 14,
  id: 'undertone',
  title: 'A low call through the stone',
  text: 'Undertone, guardian of Hollowecho Hills, guided a separated group home with a call carried through the caverns.',
  lines: [
    [
      '',
      'A bell rings at the hamlet. Beyond the outcrop, another answers, but a small group is still missing from the trail.'
    ],
    [
      '',
      'A low call threads through the stone. The lost travelers follow each answering note until their footsteps meet beside the bell post.'
    ],
    [
      '@undertone',
      'A great Shade hyena emerges last: Undertone. It waits for the group to embrace before turning a quiet, questioning ear toward your team.'
    ]
  ],
  win: [
    [
      '@undertone',
      'Undertone sits beside your partner and hums a note so low you feel it through the ground.'
    ],
    [
      '',
      'The travelers ring the home bell. When you take the next path, the guardian answers from beside you.'
    ]
  ],
  wild: [ 'undertone', 63, 4 ]
},
  {
  biome: 'hollowecho',
  at: 24,
  id: 'warden6',
  gate: 'echo',
  title: 'The Hollowecho Warden',
  text: 'Warden Senna tested whether you listened to a partner even when its warning contradicted your plan.',
  lines: [
    [
      '',
      'A quiet surveyor folds a map beside the cave mouth. Three partners watch the path while she waits for the last echo to fade.'
    ],
    [
      'senna',
      'Welcome, {name}. I am Senna. A tidy map is useful. A partner who disagrees with it is useful too.'
    ],
    [
      'senna',
      'I judge listening: will you change a good plan when someone beside you hears a warning you missed?'
    ],
    [ 'senna', 'Let them answer before you decide. We have enough daylight for a careful battle.' ]
  ],
  win: [
    [
      'senna',
      'You heard them, even when it meant giving up an opening. Your plan made room for what your partners knew.'
    ],
    [
      'senna',
      'Take the Echo Badge. Your team can grow to level sixty-five now. Keep listening when the trail looks certain.'
    ],
    [
      'senna',
      'Ring the bell before dusk, and answer when someone else rings. A safe return is worth recording.'
    ]
  ],
  trainer: 'Warden Senna',
  team: [ [ 'flintroot', 58 ], [ 'bellmote', 59 ], [ 'hushmane', 60 ] ]
},
  /* Sunthread: the regional gathering before the final stretch. */
  { biome: "sunthread", at: 6, id: "rival8", title: "A place in the gathering", text: "Wren helped a nervous young tamer and their partner find a useful role before a gathering rematch.",
    lines: [["","A young tamer grips an unused shelter rope while the gathering bustles around them. Wren kneels beside their little partner."],
      ["wren","You do not have to pull like the big ones. See those loose ends? Your partner can hold them while mine makes the knot."],
      ["","The little partner steadies a tie. The shelter cloth settles, and the young tamer smiles as the next team arrives beneath it."],
      ["wren","Everyone has a part. Mine is still beating you, {name}. I brought a few different strengths this time. Ready?"]],
    win: [["wren","All right, you win. Not one star performer in sight, and they still found every opening."],
      ["wren","The young tamer is showing the next arrivals where to rest. Come on, our partners have earned a place under that shelter too."]],
    team: [["blazefang",64],["ribbonstride",66],["$rival",67]] },
  { biome: "sunthread", at: 14, id: "meadowmantle", title: "The sheltered ground", text: "Meadowmantle, guardian of Sunthread Commons, sheltered the nursery beds while neighboring teams settled the gathering.",
    lines: [["","A sudden wind lifts the meadow grass. Beside the nursery beds, traveling teams fold their banners and let the youngest creatures rest."],
      ["","A broad Grove boar settles along the windward edge. Flowers and small sleeping backs disappear beneath the shelter of its leafy mantle."],
      ["@meadowmantle","Meadowmantle leaves the tender beds untouched. Once the wind eases, it rises, noses a clear patch of ground toward your team, and waits."]],
    win: [["@meadowmantle","Meadowmantle lowers its mantle beside your partner, leaving enough room for every tired paw."],
      ["","The gathered teams keep the nursery sheltered as you take the next path. The guardian chooses to walk beside you."]],
    wild: ["meadowmantle",67,4] },
  { biome: "sunthread", at: 24, id: "warden7", gate: "loom", title: "The Sunthread Warden", text: "Warden Halen tested how you made room for partners with different strengths at the gathering.",
    lines: [["","At the meeting hall, a patient organizer greets each returning tamer by name. He sets aside his list when your team approaches."],
      ["halen","Welcome, {name}. And welcome to the partners who brought you here. Names are easier to remember when you notice what each one does."],
      ["halen","I judge making space. One partner can carry the cloth, another hold a knot, another help a frightened neighbor. Can your team leave room for all of them?"],
      ["halen","Show me a battle where strength has more than one shape. The gathering can spare us a little time."]],
    win: [["halen","You made room for the quiet work as well as the bright opening. Your partners could trust one another to do different things."],
      ["halen","Take the Loom Badge. Your team can grow to level seventy now. A good gathering leaves nobody wondering whether they belong."],
      ["halen","There is still a road ahead. Remember the names of the teams beside you, and leave them a place to rest."]],
    trainer: "Warden Halen", team: [["tilthtusk",63],["hemglow",64],["bloomcourser",65]] },
  /* Farwatch: the eighth badge, before the league (W2). */
  { biome: "farwatch", at: 6, id: "rival9", title: "The notes we share", text: "Wren shared her corrected coastal notes before the last route rematch, with the league ahead.",
    lines: [
      ["","Wren holds out a salt-spotted notebook. A shortcut is crossed out; a sheltered approach is drawn beside it."],
      ["wren","I used to keep the best route to myself. Take a copy, {name}. That crossing is only safe when the water is low. I nearly wrote it as always safe."],
      ["wren","Eight roads since Larkhaven. Remember how sure I was that choosing the right starter would settle everything? My partner has had a few opinions since."],
      ["wren","The league is nearly in sight. First, one more battle here, as friends. Shared notes do not mean I am letting you win!"]
    ],
    win: [
      ["wren","You win. Again! I am writing that down accurately, even if the notebook would look better without it."],
      ["wren","At the league, bring the whole journey with you. I will bring mine. For now, let us get everyone back to the harbor."]
    ],
    team: [["chartwing",68],["inkwhisk",69],["$rival",70]] },
  { biome: "farwatch", at: 14, id: "watchlight", title: "An answering light", text: "Watchlight guided returning teams through the fog before inviting a bond beside the harbor.",
    lines: [
      ["","Sea fog folds over the lookout stones. A small light pauses above a dry inlet, then waits for an answering lantern from shore."],
      ["","The returning team reaches the sand. Harbor keepers lower their lanterns only after counting every partner."],
      ["@watchlight","Watchlight settles above the empty mooring. Its glow softens; it waits for your team to approach together."]
    ],
    win: [
      ["@watchlight","Watchlight rests beside your partner, its glow steady enough to read the nearest trail mark."],
      ["","The harbor keepers light the next approach themselves. The guardian chooses to accompany you; careful returns remain everyone's work."]
    ],
    wild: ["watchlight",71,4] },
  { biome: "farwatch", at: 24, id: "warden8", gate: "horizon", title: "The Farwatch Warden", text: "Rysa tested responsibility for shared knowledge and awarded the eighth badge before the league.",
    lines: [
      ["","At the lookout ledger, Rysa strikes through her own tide estimate and writes a correction large enough for anyone to see."],
      ["rysa","Welcome, {name}. I had yesterday's tide wrong. An honest correction helps more than a confident mistake. What we pass on becomes someone else's road."],
      ["rysa","Seven Wardens have met your team. I am the eighth. Before the league, show me you can listen, learn, and take responsibility when a partner proves you wrong."],
      ["rysa","We will battle on firm ground. Watch the team beside you as carefully as the one across from you."]
    ],
    win: [
      ["rysa","You learned as the battle changed. That is the kind of knowledge worth sharing. Nobody needs you to pretend the journey was easy."],
      ["rysa","Take the Horizon Badge, your eighth. Your partners can grow to level seventy-five. You have carried their trust from Larkhaven all the way to this shore."],
      ["rysa","The league is the next chapter, not a reason to forget these roads. Rest here, correct your notes, and remember who helped you reach the horizon."]
    ],
    trainer: "Warden Rysa", team: [["keeljaw",68],["moorweft",69],["soundhowl",70]] },
  /* T30: scripted league encounters; these do not trigger through wild explores. */
  { biome: "league", at: 0, id: "leagueWren", league: "wren", title: "The last gate battle", text: "Wren shared the last gate battle before the league.",
    lines: [
      ["","Wren closes her notebook beside the league gate. The first page is creased where a ranch name was written in a hurry."],
      ["wren","Larkhaven. My brilliant starter strategy. All those wrong turns. We made it, {name}. Our partners made it with us."],
      ["wren","Your notes helped me get here. Mine are yours too. But this last battle? You still have to earn it."],
      ["wren","Whatever happens inside, you will find me cheering for the team that walked every road beside you. Ready?"]
    ],
    win: [
      ["wren","You win. I wanted that one so badly! And I am glad it was you. Both things can be true."],
      ["wren","Go on. They can count your badges; I know what it took to earn them. I will be right here when you come out."]
    ],
    team: [["chartwing",72],["inkwhisk",73],["$rival",73]] },
  { biome: "league", at: 0, id: "league1", league: 0, title: "The listening court", trainer: "Edrin", text: "Edrin tested listening at the Returning Light League.",
    lines: [
      ["edrin","I used to shout a plan over every warning. My partners taught me to leave a silence."],
      ["edrin","This court asks you to hear what changes. Give your team room to answer."]
    ],
    win: [
      ["edrin","You listened while the battle was moving. That is harder than listening after it ends."]
    ],
    team: [["hushmane",70],["dripdart",71],["bloomcourser",72]] },
  { biome: "league", at: 0, id: "league2", league: 1, title: "The shelter court", trainer: "Maela", text: "Maela tested sheltering a team at the Returning Light League.",
    lines: [
      ["maela","A shelter is useful because someone can rest beneath it. Strength must leave a safe place for another."],
      ["maela","Show me how your team protects its tired paws."]
    ],
    win: [
      ["maela","Your strongest opening did not leave anybody behind. Come, the next bench is dry."]
    ],
    team: [["keeljaw",71],["flintroot",72],["ferrycrest",73]] },
  { biome: "league", at: 0, id: "league3", league: 2, title: "The shared-work court", trainer: "Corven", text: "Corven tested sharing the work at the Returning Light League.",
    lines: [
      ["corven","I carry the benches; Ribbonstride fetches the cloth. Neither of us could hold this gathering alone."],
      ["corven","Three partners, different work. Let us see what they can make together."]
    ],
    win: [
      ["corven","Nobody had to become somebody else to help. I like that team."]
    ],
    team: [["blazefang",72],["ribbonstride",73],["tilthtusk",74]] },
  { biome: "league", at: 0, id: "league4", league: 3, title: "The honest-record court", trainer: "Liora", text: "Liora tested learning honestly at the Returning Light League.",
    lines: [
      ["liora","My ledger has mistakes in it. They are crossed out where the next tamer can see them."],
      ["liora","A league battle is a record of what we learn, not proof we have nothing left to learn."]
    ],
    win: [
      ["liora","Write that down: we changed our minds, and our partners trusted us enough to try again."]
    ],
    team: [["buoyglint",72],["moorweft",73],["pennantlark",74]] },
  { biome: "league", at: 0, id: "leagueChampion", league: 4, title: "The Champion terrace", trainer: "Champion Avenne", text: "Avenne met your team on the Champion terrace.",
    lines: [
      ["avenne","Welcome, {name}. I know eight Wardens who have been waiting to hear how your team arrived."],
      ["avenne","The title belongs to a tamer, but the journey belongs to every partner beside them. Mine still teach me things."],
      ["avenne","Bring the forest, the crossing, the gathering and the horizon with you. Let us give them a battle worth remembering."]
    ],
    win: [
      ["avenne","There it is. A whole journey, answering together. You have earned this place."],
      ["avenne","Come back through the gate with me. The people who believed in you should hear your name first."]
    ],
    team: [["bloomcourser",74],["hushmane",75],["soundhowl",76]] }
];
const COUNTER = { cindercub: 'ripplet', ripplet: 'mosshog', mosshog: 'cindercub' };

/* Art eras: the world's look evolves as you progress (see "Eras you walk through" in docs/creature-game-design.md).
   light: the era shows the day/night clock. */
const ERAS = [
  { id: 'pocket', name: 'Pocket', unlock: 'From the start' },
  { id: 'pixel', name: 'Pixel', unlock: 'Earn the Thorn Badge' },
  { id: 'bit16', name: '16-bit', unlock: 'Earn the Thorn Badge' },
  { id: 'hd', name: 'HD-2D', unlock: 'Earn the Tide Badge' },
  { id: 'diorama', name: 'Diorama', unlock: 'Earn the Ember Badge' },
  { id: '3d', name: '3D', unlock: 'Become Champion', soon: true }
];

/* T40: later-road witnesses. Their accounts are clues, not answers to the old fight. */
Object.assign(CAST, {
  sivet: {name:'Sivet',title:'Ferry Rope Keeper',skin:'#c49b78',hair:'bun',hairCol:'#b5b6a2',shirt:'#678c7b',bg:'#c9d4bd'},
  orri: {name:'Orri',title:'Bell Mender',skin:'#e0b490',hair:'short',hairCol:'#5b5550',shirt:'#727b86',bg:'#c7cebe'},
  nesla: {name:'Nesla',title:'Gathering Weaver',skin:'#ba8866',hair:'braid',hairCol:'#3e3b35',shirt:'#ae8663',bg:'#e2dbb4'},
  ceryn: {name:'Ceryn',title:'Harbor Note Keeper',skin:'#ddb491',hair:'short',hairCol:'#8b7771',shirt:'#69868b',bg:'#d5e0dc'}
});
/* These additions change no encounters, counters, rewards or milestones. */
STORY.find(b=>b.id==='warden5').lines.splice(2,0,
 ['olan','The old ferry tally has two sets of prints that end at the same mark. A pair standing together, or one carrying the other? I cannot ask the stone.']);
STORY.find(b=>b.id==='warden6').lines.splice(2,0,
 ['senna','The oldest survey draws a ledge across that flat wall. My partner still steps wide of it. Perhaps it remembers a fall; perhaps the map does.']);
STORY.find(b=>b.id==='warden7').lines.splice(2,0,
 ['halen','Someone calling themselves Unbound opened a travel pen this morning. Two creatures went home; one frightened youngster stayed by its tamer. Freedom needs room for that answer too.']);
STORY.find(b=>b.id==='warden8').lines.splice(2,0,
 ['rysa','An old witness wrote that two figures became one before the colour went. The page ends there. It says nothing about what they were facing. Leave that blank until we know.']);
/* T45 / WB2.6: recognition for the first four roads. Exported data only.
   Append to the existing conversation in Godot; never replace its shared lines or trainer choices. */
const EARLY_HERITAGE_LINES = {
 maren: [
  'Farmfolk, then. Your family would know that a full paddock still needs a quiet place for each creature.',
  'Coastfolk, then. One partner can fill a whole life; the spare trough is for whoever needs water today.',
  'Highlander, then. There will be hard roads. Let your partner learn your kindness before it learns your courage.',
  'Wanderer, then. There is a latch on both sides of the paddock. Coming back should always be a choice.'
 ],
 pip: [
  'Your harvest song has the same last hum as ours! I thought Grandmother made that bit up.',
  'Can you teach me the shore verse? Tobin says our harvest hum fits under it, if you sing slowly.',
  'Do your mountain songs finish with a hum too? Grandmother says the oldest words got lost before the tune did.',
  'Someone passing through hummed our harvest tune without knowing its name. Was it one of your travelling songs?'
 ],
 bram: [
  'Farmfolk hands. You would know why I leave the lowest berries: the little ones cannot reach the rest.',
  'Your family keeps one partner close? Mine picks the berries while I carry the basket. We each have our work.',
  'A climb is not the only trial. Try waiting while a hungry creature decides whether to trust your hand.',
  'Passing through? Leave a few berries on this stump. Something will find your kindness after you have gone.'
 ],
 lise: [
  'At home you gather everyone under one roof. Birds keep nests apart, but still warn the whole wood together.',
  'One partner for life sounds lonely until I see the way yours listens. Perhaps a flock is not always many.',
  'You watch the high paths; I watch the branches. That bird circles a gap the old sketch calls a ledge.',
  'I like that you leave room for goodbye. Birds return to this branch without anyone fastening a door to it.'
 ],
 tobin: [
  'Your tired-land tale starts after our tide tale ends. I would like to hear what your elders remember of that morning.',
  'Coastfolk. You know the verse about the lowest water. Mind who tells it: I saw tracks, not their maker.',
  'Your watcher tale says the mountain went quiet. The same night, perhaps. A fisher cannot see behind a mountain.',
  'A traveller once said the glare came before the water moved. I saw the water; I cannot swear to their glare.'
 ],
 cato: [
  'You know a good seed by its weight? Shore stones have their own heft. This flat carving feels strangely shallow.',
  'That worn loop is familiar, is it? I found it above the usual tide line, not where the waves write.',
  'You have seen mountain marks like this shore loop? Perhaps someone carried a stone here. Or carried its story.',
  'Keep the shell if you like. Bring it back if it starts to feel like somebody else should find it.'
 ],
 marit: [
  'The lighthouse keeper used to ask for your harvest verse. Its last hum carries beautifully across dark water.',
  'Our shore verse has a pause where the light turns. The old keeper waited there, even when the lamp was steady.',
  'A watcher on a mountain and a keeper in a tower both need sleep. That does not tell us who failed whom.',
  'A light can welcome a returning traveller without asking them to stay. That is the kind I try to keep.'
 ],
 orsk: [
  'Farmfolk mend a fence after a storm. Up here we mend the trail. Either way, somebody must notice what broke.',
  'You keep one companion? The narrow ridge has room for two walking carefully. Numbers are not what make it safe.',
  'Our families disagree about the watcher. Grandfather says it slept; Mother says it never stopped looking. I listen to both.',
  'A passing tamer left this spare rope without a name. I would rather remember their kindness than claim their creature.'
 ],
 sela: [
  'The warm spring feeds that little green patch. Tired land can rest, your family says. I am trying to give it room.',
  'Your sea has a pull; our spring has a breath. The old stone marks a waterline higher than this flat bank.',
  'You have heard the watcher blamed too? The oldest spring song asks it to come home. I wonder who sang first.',
  'A traveller taught me to leave the spring path open. Creatures return for warmth; they should not need permission.'
 ],
 ilka: [
  'That harvest knot on your strap leaves the same spare loop as mine. Nobody here remembers who taught it first.',
  'A shore knot on a mountain rope. Keep the loose tail; wet hands and cold hands both need something to grip.',
  'You know why we test a rope gently before trusting it with a fall. Trust is not proved by breaking it.',
  'I can mend your strap without closing its quick-release loop. You should still be able to put your burden down.'
 ],
 teodor: [
  'Your family watches the soil; I watch the mist. Both leave an outline behind when something larger has passed.',
  'Coastfolk name clouds for sails. The old lookout chart draws a deep inlet here, although it is inland now.',
  'Our lookout chart puts the watcher beyond the ridge. A chart tells you where someone looked, not what they saw.',
  'A wanderer copied this chart and left its empty corner empty. I liked that. Not knowing deserves an honest space.'
 ],
 isolde: [
  'You were taught that care brings the land back. Show me the care between your partners; the field can wait.',
  'One close partner can carry a great deal. Let us see whether you hear its answer as clearly as your own.',
  'You learned trust through trials. A trial should reveal a bond, not demand that a creature endure your pride.',
  'A companion who might leave is still a companion. I judge how you stand together while it chooses to stay.'
 ],
 nerys: [
  'Your elders remember the tired fields. Mine remember the water leaving. Neither watched the whole valley that night.',
  'You know our oldest verse. Remember its speaker stood on the shore; a song can carry fear as faithfully as fact.',
  'A mountain watcher and something from the sea. Those tales might quarrel because their witnesses faced different ways.',
  'You understand an open path. At low water I leave two ways back: one for a tamer, one for a creature.'
 ],
 toren: [
  'Your family says the land grew tired. These stones stayed warm after the colour went. Rest can look different here.',
  'Your elders watched the tide; mine watched the ridge. There is a whole valley between those two windows.',
  'You have heard our watcher tale. I know the old warmth is real; I do not know whose vigil it belonged to.',
  'The visitor who copied these stones left the last mark unfinished. I trust that restraint more than a tidy ending.'
 ],
 vessa: [
  'Your harvest hum reaches this shelter too. We sing it when the fog closes in, although nobody calls it a field song.',
  'You know waiting for the tide. Wait for the cloud the same way, with your partner beside you rather than behind.',
  'You climbed from the warm stones. This shelter holds two old blankets; I will not guess who once needed them.',
  'Someone left the shelter latch open for the next traveller. Freedom and welcome can share a hinge.'
 ]
};
for (const [id, who] of [['warden','isolde'],['warden2','nerys'],['warden3','toren'],['warden4','vessa']]) {
 STORY.find(b=>b.id===id).byHeritage=Object.fromEntries(['farm','coast','highland','wander'].map((h,i)=>[h,[[who,EARLY_HERITAGE_LINES[who][i]]]]));
}

/* WS3/T50: data handoff only. Classic still uses BIOMES[id].wild unchanged.
   MAPS[id].seasonal[season].wild contains the complete relative-weight table for Godot.
   Every original species remains; these existing visitors are rare in every other season. */
for (const [id,season,area] of [['sunspark','summer','thornwood'],['glassbill','spring','stillreed'],['chimespark','autumn','hollowecho'],['fogsail','winter','cloudglass']]) {
  SPECIES[id].seasonal = { favoredSeason: season, areas: [area], inSeasonWeight: 6, outOfSeasonWeight: 2 };
}
// T54: exported return conversations; Classic dispatch remains unchanged.
SCENES.leagueAfter = [
  [
    "avenne",
    "Champion, {name}. Rest here. Nobody needs you to prove the whole journey twice."
  ],
  [
    "wren",
    "I promised to cheer here. I did not promise to be quiet about it."
  ],
  [
    "maren",
    "Water first, all of you. The story can wait until the smallest paws stop shaking."
  ],
  [
    "isolde",
    "Look at the colour on the shore. Every safe return helped the world remember."
  ],
  [
    "wren",
    "We still have questions. Let us walk those roads without inventing answers."
  ],
  [
    "maren",
    "Tomorrow gets a new page. Tonight, there is room for all of you at home."
  ]
];
const WARDEN_RETURNS = [
  [
    "warden",
    "isolde",
    [
      "Champion. You kept listening, even when the road grew louder.",
      "Staying beside you is still your partner's choice. Make room for it."
    ]
  ],
  [
    "warden2",
    "nerys",
    [
      "Welcome back, Champion. A returning boat needs a safe landing too.",
      "Shore and mountain tales look different ways. The missing page stays open."
    ]
  ],
  [
    "warden3",
    "toren",
    [
      "Champion. A tired team can still stop at a warm stone. Take your time.",
      "The stone is warm. Who kept watch here is still a question."
    ]
  ],
  [
    "warden4",
    "vessa",
    [
      "You came back, Champion. Sit beside your partner. The shelter is still open.",
      "Keep the latch opening both ways. A welcome should not trap anyone."
    ]
  ],
  [
    "warden5",
    "olan",
    [
      "Champion. Let the next crossing go ahead. Leave a safe landing behind you.",
      "Sivet found the rope and nest. The old ferry tally is a different question."
    ]
  ],
  [
    "warden6",
    "senna",
    [
      "Orri mended the loose bell tongue. Welcome back to a clearer path, Champion.",
      "The survey draws a ledge where the wall is flat. Its question is still open."
    ]
  ],
  [
    "warden7",
    "halen",
    [
      "Champion. Carry a bowl if you want company. There is room at the gathering.",
      "The youngster stayed when the pen opened. Care listens to that choice too."
    ]
  ],
  [
    "warden8",
    "rysa",
    [
      "Welcome back, Champion. Leave your corrected notes for the next team.",
      "The old page never names what the pair faced. Leave that space honest."
    ]
  ]
];
for (const [id,who,texts] of WARDEN_RETURNS) {
 const actor=STORY.find(b=>b.id===id);
 actor.byStory={...(actor.byStory||{}),leagueEnding:texts.map(text=>[who,text])};
}

/* WD2: species-level drawing hints only. Never copy these into creature saves.
   Renderer contract: docs/lore/wildbond-looks.md. Families still control gameplay. */
const SPECIES_LOOKS = {
  cindercub: {"shape":"wolf","look":{"head":"round-ears","back":"ember-ruff","tail":"curled","pattern":"spots"}},
  blazefang: {"shape":"wolf","look":{"head":"pointed-ears","back":"flame-mane","tail":"plume","pattern":"chevrons"}},
  ripplet: {"shape":"lizard","look":{"head":"bubble-cheeks","back":"smooth","tail":"paddle","pattern":"rings"}},
  tidewyrm: {"shape":"serpent","look":{"head":"fin-crest","back":"wave-ridge","tail":"fin","pattern":"bands"}},
  mosshog: {"shape":"boar","look":{"head":"short-tusks","back":"moss-bed","tail":"stub","pattern":"speckles"}},
  thornback: {"shape":"boar","look":{"head":"long-tusks","back":"thorn-ridge","tail":"stub","pattern":"chevrons"}},
  glimmerwing: {"shape":"bird","look":{"head":"glass-crest","back":"glass-wings","tail":"forked","pattern":"bars"}},
  pebblepaw: {"shape":"cat","look":{"head":"round-ears","back":"stone-paws","tail":"curled","pattern":"socks"}},
  duskweaver: {"shape":"spider","look":{"head":"small-fangs","back":"silk-collar","tail":"thread","pattern":"diamonds"}},
  bogsnap: {"shape":"croc","look":{"head":"low-brow","back":"reed-ridge","tail":"paddle","pattern":"mottled"}},
  emberling: {"shape":"lizard","look":{"head":"round-cheeks","back":"ember-spots","tail":"tapered","pattern":"spots"}},
  gnawhound: {"shape":"hyena","look":{"head":"tall-ears","back":"shaggy-ruff","tail":"brush","pattern":"saddle"}},
  sunspark: {"shape":"sprite","look":{"head":"sun-rays","back":"light-orbit","tail":"ribbon","pattern":"rays"}},
  galefoal: {"shape":"horse","look":{"head":"swept-ears","back":"wind-mane","tail":"ribbon","pattern":"socks"}},
  elderhorn: {"shape":"horse","look":{"head":"branch-antlers","back":"leaf-mane","tail":"plume","pattern":"vines"}},
  brineskit: {"shape":"lizard","look":{"head":"wide-cheeks","back":"shell-plates","tail":"paddle","pattern":"speckles"}},
  shoalcrest: {"shape":"croc","look":{"head":"fin-crest","back":"wave-ridge","tail":"paddle","pattern":"bars"}},
  dunepounce: {"shape":"cat","look":{"head":"pointed-ears","back":"sand-ruff","tail":"hook","pattern":"bands"}},
  reedtusk: {"shape":"boar","look":{"head":"curved-tusks","back":"reed-bed","tail":"stub","pattern":"bars"}},
  wrackjaw: {"shape":"hyena","look":{"head":"stone-jaw","back":"shell-plates","tail":"brush","pattern":"speckles"}},
  kiteskirl: {"shape":"bird","look":{"head":"swept-crest","back":"narrow-wings","tail":"forked","pattern":"chevrons"}},
  spindriftfoal: {"shape":"horse","look":{"head":"swept-ears","back":"spray-mane","tail":"ribbon","pattern":"rings"}},
  foamglint: {"shape":"sprite","look":{"head":"bubble-crown","back":"foam-orbit","tail":"ribbon","pattern":"rings"}},
  breakwatermane: {"shape":"wolf","look":{"head":"fin-ears","back":"wave-mane","tail":"fin","pattern":"chevrons"}},
  slaglet: {"shape":"boar","look":{"head":"short-tusks","back":"crust-plates","tail":"stub","pattern":"cracks"}},
  kilntusk: {"shape":"boar","look":{"head":"glowing-tusks","back":"crust-plates","tail":"brush","pattern":"cracks"}},
  cragskein: {"shape":"spider","look":{"head":"stone-fangs","back":"crystal-ridge","tail":"thread","pattern":"cracks"}},
  ventwhisk: {"shape":"cat","look":{"head":"long-whiskers","back":"steam-ruff","tail":"copper","pattern":"bands"}},
  thermwing: {"shape":"bird","look":{"head":"swept-crest","back":"broad-wings","tail":"fan","pattern":"rays"}},
  screegrin: {"shape":"hyena","look":{"head":"stone-jaw","back":"stone-ruff","tail":"brush","pattern":"bars"}},
  glowmote: {"shape":"sprite","look":{"head":"sun-rays","back":"steam-orbit","tail":"ribbon","pattern":"speckles"}},
  hearthcrown: {"shape":"horse","look":{"head":"ember-antlers","back":"flame-mane","tail":"plume","pattern":"cracks"}},
  mistfinch: {"shape":"bird","look":{"head":"round-crest","back":"mist-wings","tail":"fan","pattern":"speckles"}},
  cloudharrier: {"shape":"bird","look":{"head":"swept-crest","back":"broad-wings","tail":"forked","pattern":"bands"}},
  cirrusmane: {"shape":"horse","look":{"head":"swept-ears","back":"cloud-mane","tail":"plume","pattern":"swirls"}},
  shalecat: {"shape":"cat","look":{"head":"pointed-ears","back":"stone-ruff","tail":"hook","pattern":"cracks"}},
  fogtail: {"shape":"cat","look":{"head":"round-ears","back":"mist-ruff","tail":"lantern","pattern":"mottled"}},
  pallweaver: {"shape":"spider","look":{"head":"small-fangs","back":"silk-collar","tail":"thread","pattern":"bars"}},
  gritbeak: {"shape":"bird","look":{"head":"stone-beak","back":"narrow-wings","tail":"fan","pattern":"cracks"}},
  lanternwisp: {"shape":"sprite","look":{"head":"lantern-crown","back":"light-orbit","tail":"ribbon","pattern":"bars"}},
  lanterncrest: {"shape":"bird","look":{"head":"lantern-crest","back":"broad-wings","tail":"fan","pattern":"rays"}},
  reedlet: {"shape":"lizard","look":{"head":"reed-crest","back":"smooth","tail":"reed","pattern":"bars"}},
  ferrycrest: {"shape":"croc","look":{"head":"broad-crest","back":"wave-ridge","tail":"paddle","pattern":"chevrons"}},
  siltjaw: {"shape":"turtle","look":{"head":"moss-brow","back":"shell-plates","tail":"paddle","pattern":"mottled"}},
  rillwhisk: {"shape":"serpent","look":{"head":"long-whiskers","back":"fin-ridge","tail":"fin","pattern":"rings"}},
  orchardroot: {"shape":"treefolk","look":{"head":"branch-antlers","back":"orchard-canopy","tail":"root","pattern":"vines"}},
  gustreed: {"shape":"bird","look":{"head":"reed-crest","back":"narrow-wings","tail":"ribbon","pattern":"bars"}},
  duskcord: {"shape":"spider","look":{"head":"seed-fangs","back":"silk-collar","tail":"thread","pattern":"vines"}},
  glassbill: {"shape":"bird","look":{"head":"glass-beak","back":"glass-wings","tail":"forked","pattern":"rings"}},
  stillwake: {"shape":"croc","look":{"head":"broad-crest","back":"smooth","tail":"fin","pattern":"rings"}},
  hushpup: {"shape":"hyena","look":{"head":"tall-ears","back":"soft-ruff","tail":"brush","pattern":"socks"}},
  hushmane: {"shape":"hyena","look":{"head":"tall-ears","back":"echo-mane","tail":"brush","pattern":"chevrons"}},
  umbrelace: {"shape":"spider","look":{"head":"small-fangs","back":"silk-collar","tail":"thread","pattern":"swirls"}},
  flintroot: {"shape":"treefolk","look":{"head":"stone-crown","back":"stone-canopy","tail":"root","pattern":"cracks"}},
  ledgewhisk: {"shape":"cat","look":{"head":"long-whiskers","back":"smooth","tail":"hook","pattern":"socks"}},
  bellmote: {"shape":"sprite","look":{"head":"bell-crown","back":"light-orbit","tail":"tassel","pattern":"rings"}},
  dripdart: {"shape":"lizard","look":{"head":"round-cheeks","back":"smooth","tail":"tapered","pattern":"rings"}},
  chimespark: {"shape":"sprite","look":{"head":"bell-crown","back":"spark-orbit","tail":"tassel","pattern":"rays"}},
  undertone: {"shape":"hyena","look":{"head":"folded-ears","back":"echo-mane","tail":"brush","pattern":"bands"}},
  clovercolt: {"shape":"horse","look":{"head":"leaf-ears","back":"leaf-mane","tail":"ribbon","pattern":"spots"}},
  bloomcourser: {"shape":"horse","look":{"head":"leaf-ears","back":"flower-mane","tail":"plume","pattern":"vines"}},
  tilthtusk: {"shape":"boar","look":{"head":"curved-tusks","back":"soil-bed","tail":"stub","pattern":"vines"}},
  hemglow: {"shape":"sprite","look":{"head":"tassel-crown","back":"light-orbit","tail":"tassel","pattern":"bars"}},
  pennantlark: {"shape":"bird","look":{"head":"pennant-crest","back":"broad-wings","tail":"ribbon","pattern":"chevrons"}},
  ribbonstride: {"shape":"horse","look":{"head":"swept-ears","back":"wind-mane","tail":"ribbon","pattern":"chevrons"}},
  dawntassel: {"shape":"moth","look":{"head":"tassel-antennae","back":"broad-wings","tail":"tassel","pattern":"rays"}},
  meadowmantle: {"shape":"treefolk","look":{"head":"branch-antlers","back":"flower-canopy","tail":"root","pattern":"vines"}},
  shoalpup: {"shape":"wolf","look":{"head":"round-ears","back":"spray-ruff","tail":"paddle","pattern":"socks"}},
  soundhowl: {"shape":"wolf","look":{"head":"fin-ears","back":"wave-mane","tail":"paddle","pattern":"rings"}},
  keeljaw: {"shape":"croc","look":{"head":"low-brow","back":"keel-ridge","tail":"paddle","pattern":"bars"}},
  chartwing: {"shape":"bird","look":{"head":"swept-crest","back":"narrow-wings","tail":"forked","pattern":"spots"}},
  moorweft: {"shape":"spider","look":{"head":"stone-fangs","back":"silk-collar","tail":"thread","pattern":"speckles"}},
  inkwhisk: {"shape":"cat","look":{"head":"long-whiskers","back":"smooth","tail":"hook","pattern":"ink"}},
  buoyglint: {"shape":"sprite","look":{"head":"lantern-crown","back":"light-orbit","tail":"tassel","pattern":"bars"}},
  isleglimmer: {"shape":"sprite","look":{"head":"pebble-crown","back":"spark-orbit","tail":"ribbon","pattern":"spots"}},
  watchlight: {"shape":"sprite","look":{"head":"lantern-crown","back":"beacon-orbit","tail":"ribbon","pattern":"rays"}},
  fernruff: {"shape":"wolf","look":{"head":"leaf-ears","back":"fern-ruff","tail":"brush","pattern":"vines"}},
  briarwatch: {"shape":"wolf","look":{"head":"leaf-ears","back":"thorn-ridge","tail":"plume","pattern":"vines"}},
  poolkit: {"shape":"cat","look":{"head":"round-ears","back":"spray-ruff","tail":"curled","pattern":"rings"}},
  rilllynx: {"shape":"cat","look":{"head":"tufted-ears","back":"spray-ruff","tail":"hook","pattern":"rings"}},
  hearthlaugh: {"shape":"hyena","look":{"head":"tall-ears","back":"ember-ruff","tail":"brush","pattern":"rays"}},
  cairnclasp: {"shape":"turtle","look":{"head":"stone-crown","back":"shell-plates","tail":"stub","pattern":"cracks"}},
  bogbough: {"shape":"turtle","look":{"head":"moss-brow","back":"willow-canopy","tail":"paddle","pattern":"vines"}},
  tumbletusk: {"shape":"boar","look":{"head":"short-tusks","back":"seed-bed","tail":"curled","pattern":"swirls"}},
  slatehoof: {"shape":"horse","look":{"head":"swept-ears","back":"stone-mane","tail":"brush","pattern":"cracks"}},
  kilnchirp: {"shape":"bird","look":{"head":"clay-beak","back":"narrow-wings","tail":"fan","pattern":"socks"}},
  dewspinner: {"shape":"spider","look":{"head":"small-fangs","back":"dew-collar","tail":"thread","pattern":"rings"}},
  veilmote: {"shape":"moth","look":{"head":"feather-antennae","back":"soft-wings","tail":"tassel","pattern":"mottled"}},
  flintpup: {"shape":"wolf","look":{"head":"round-ears","back":"stone-ruff","tail":"stub","pattern":"cracks"}},
  cairnhound: {"shape":"wolf","look":{"head":"pointed-ears","back":"cairn-ridge","tail":"brush","pattern":"cracks"}},
  ridgewarden: {"shape":"wolf","look":{"head":"tufted-ears","back":"cairn-ridge","tail":"plume","pattern":"chevrons"}},
  seedpip: {"shape":"bird","look":{"head":"seed-beak","back":"narrow-wings","tail":"fan","pattern":"spots"}},
  hedgelark: {"shape":"bird","look":{"head":"leaf-crest","back":"leaf-wings","tail":"forked","pattern":"vines"}},
  boughchorus: {"shape":"bird","look":{"head":"branch-crest","back":"leaf-wings","tail":"plume","pattern":"vines"}},
  saillet: {"shape":"lizard","look":{"head":"round-cheeks","back":"small-sail","tail":"tapered","pattern":"bars"}},
  draftscale: {"shape":"lizard","look":{"head":"swept-cheeks","back":"broad-sail","tail":"ribbon","pattern":"bars"}},
  stormfrill: {"shape":"lizard","look":{"head":"frilled-cheeks","back":"storm-sail","tail":"ribbon","pattern":"chevrons"}},
  sunfrill: {"shape":"lizard","look":{"head":"frilled-cheeks","back":"sun-sail","tail":"ribbon","pattern":"rays"}},
  fogsail: {"shape":"moth","look":{"head":"feather-antennae","back":"mist-wings","tail":"ribbon","pattern":"bands"}},
  cinderstitch: {"shape":"spider","look":{"head":"ember-fangs","back":"ash-collar","tail":"thread","pattern":"chevrons"}},
  laughrill: {"shape":"hyena","look":{"head":"folded-ears","back":"spray-ruff","tail":"brush","pattern":"rings"}},
  fordfoal: {"shape":"horse","look":{"head":"swept-ears","back":"spray-mane","tail":"brush","pattern":"socks"}},
  lynxhound: {"shape":"cat","look":{"head":"tufted-ears","back":"shaggy-ruff","tail":"brush","pattern":"saddle"}},
  drakelet: {"shape":"lizard","look":{"head":"feather-crest","back":"narrow-wings","tail":"tapered","pattern":"bars"}},
  bramblestag: {"shape":"horse","look":{"head":"thorn-antlers","back":"thorn-ridge","tail":"brush","pattern":"vines"}}
};
function applySpeciesLooks(ids) {
  for (const id of ids) {
    const appearance = SPECIES_LOOKS[id];
    if (!appearance) throw Error("Missing species appearance: " + id);
    SPECIES[id].shape = appearance.shape;
    SPECIES[id].look = { ...appearance.look };
  }
}
applySpeciesLooks(Object.keys(SPECIES));
