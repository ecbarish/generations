'use strict';
/* T35: a small, authored town that changes over three days. These are choices and scene details, not meters.
   No wall clock or offline decay: reading slowly costs nothing. Data/functions stay separate from the runner. */
const TOWN_START = { day: 1, food: 4, fear: 1 };
const OLD_DAY = { a_tower: 2, a_corvin: 2, a_alone: 2, a_alone_live: 2, a_council: 3,
  a_exposed: 3, a_walls: 3, a_heart: 3, a_strike: 3 };
function prepareLife(life, legacy = false) {
  life.flags ||= {}; life.mem ||= {};
  if (!life.entered) life.entered = legacy ? { [life.at]: true } : {};
  if (!life.town) {
    life.town = { ...TOWN_START };
    if (legacy) townDay(life, OLD_DAY[life.at] || 1);
  }
  const t = life.town;
  for (const [key, fallback, low, high] of [['day', 1, 1, 3], ['food', 4, 0, 6], ['fear', 1, 0, 6]])
    t[key] = Number.isFinite(t[key]) ? Math.max(low, Math.min(high, Math.floor(t[key]))) : fallback;
  return life;
}
function townShift(life, food = 0, fear = 0) {
  const t = life.town;
  t.food = Math.max(0, Math.min(6, t.food + food));
  t.fear = Math.max(0, Math.min(6, t.fear + fear));
}
function townDay(life, day) {
  while (life.town.day < Math.min(3, day)) { life.town.day++; townShift(life, -1, 2); }
}
function townView(life) {
  const t = life?.town || TOWN_START;
  return { day: t.day, scarce: t.food <= 2, frightened: t.fear >= 4,
    stalls: t.food <= 2 ? 1 : t.food >= 5 ? 4 : 3, shutters: t.fear >= 4 ? 4 : 1,
    queue: t.food <= 2 ? 6 : t.fear >= 4 ? 4 : 2 };
}
const breadPrice = life => life.town.food <= 2 ? 4 : life.town.fear >= 4 ? 3 : 2;
const friendlyTown = life => life.town.food >= 3 && life.town.fear <= 3;
const routeNext = life => has(life, 'mira') ? 'a_tower' : has(life, 'corvin') ? 'a_corvin' : 'a_alone';
const marketNext = life => life.gift === 'pocket' ? 'a_pocket_job' : 'a_departure';
const MEMORY_REPLY = {
  tide: 'You remember the beasts running. That is a useful difference: fear looks rather like fury from a distance.',
  oldroot: 'Oldroot. A name carried kindly can open more than a sword.',
  guildmaster: 'You remember what Voss hid. Keep that knowledge; leave room for other people to surprise you.',
  lantern: 'Mira made a little light, and you remembered it. Small things travel well.',
  seed: 'A warm seed. Even here, among all these shelves, it seems to be waiting for spring.',
  rootsong: 'You brought back a song too slow for most ears. I sometimes hum it when the library is quiet.'
};
function archivistMemories(mem) { return Object.keys(MEMORY_REPLY).filter(k => mem[k]).map(k => ['archivist', MEMORY_REPLY[k]]); }
function townEpilogue(life, end) {
  if (!life.town || end === 'e_away' || ENDINGS[end].death) return [];
  const lines = [];
  if (has(life, 'crate') || has(life, 'mendedCrate')) lines.push(['', 'Ressa finds the missing flour in Corvin\'s storehouse. You help carry it back; she accepts your hands before she accepts your apology.']);
  if (has(life, 'neighbours')) lines.push(['', 'At the well, the people who answered your call leave a cup waiting for you.']);
  else if (life.town.food <= 2) lines.push(['', 'Lanthorn has another morning. Bread is still thinly sliced; Old Bren sets out for the grain farms at first light.']);
  else lines.push(['', 'The ovens in Lanthorn are lit again. A loaf cools on Ressa\'s sill, beside an open shutter.']);
  return lines;
}
CAST.ressa = { name: 'Ressa', title: 'Baker of Lanthorn', skin: '#d8a882', hair: 'bun', hairCol: '#5a3a2a', shirt: '#8a6a3a', bg: '#ead5b0' };
/* Why belongs beside need, including the older choices. All options remain visible. */
/* Sword Saint's existing cost now closes the gentle alternatives explicitly, rather than only being flavor. */
for (const c of NODES.a_heart.choices.slice(1)) {
  const need = c.need;
  c.need = life => life.gift !== 'sword' && (!need || need(life));
  const why = c.why;
  c.why = life => life.gift === 'sword' ? 'Your hand has already drawn the blade. The Instinct will not let you hold back.' : why;
}
const heartLines = NODES.a_heart.lines;
NODES.a_heart.lines = life => [...heartLines(life), ...(life.gift === 'sword' ? [
  ['', 'Your hand draws the blade before you can choose. Every frightened movement of the roots feels like an attack. The Instinct will not let you hold back.']
] : [])];
const guildLines = NODES.a_guild.lines;
NODES.a_guild.lines = life => [...guildLines(life), ['hesta', 'Six silver for your first provisions. Keep some by; bread gets dear when the carts stop coming.']];
NODES.a_guild.fx = life => { life.silver += 6; };
for (const c of NODES.a_mira.choices) c.go = 'a_market';
// The guard contract paid twenty silver already in O0. Keep that amount; make its line honest.
NODES.a_corvin.lines[0][1] = 'The wagons roll out at dusk. Corvin counts out the promised twenty silver before you leave.';
NODES.a_corvin.lines[1][1] = 'Past the walls, the outer farms are dark. One still has a light in the window.';
NODES.a_corvin.fx = life => { life.flags.betrayal = true; townDay(life, 2); };
NODES.a_corvin.choices[0].go = 'a_return_market';
NODES.a_tower.go = 'a_return_market';
NODES.a_alone_live.go = 'a_return_market';
const towerFx = NODES.a_tower.fx;
NODES.a_tower.fx = life => { townDay(life, 2); towerFx(life); };
const aloneFx = NODES.a_alone.fx;
NODES.a_alone.fx = life => { townDay(life, 2); aloneFx(life); };
NODES.a_market = { bg: 'market', lines: life => [
  ...(has(life, 'mira') ? [['mira', 'The tower can wait until this flour is off the cart. I will be at the gate.']]
    : has(life, 'corvin') ? [['corvin', 'The wagons leave at dusk. Until then, a guard who can lift a sack is worth more than a speech.']]
    : has(life, 'alone') ? [['', 'The Deepwood will keep until dark. The market will not. The road you chose still waits beyond Lanthorn.']]
    : []),
  ['', 'Lanthorn\'s market smells of bread and damp rope. A woman is lifting sacks off Old Bren\'s cart, one by one.'],
  ['ressa', 'Ressa. Baker, when the flour comes. We have three days before the tide and more mouths every hour.'],
  ...(life.gift === 'appraisal' ? [
    ['', 'Your gift catches a truth before you mean it to: she has not eaten, so her children can. Ressa feels you looking.'],
    ['ressa', 'That was not yours to take. I will sell you bread, but my kitchen is private.']] : [
    ['ressa', 'There is soup by my hearth for anyone who will sit a while. Nobody should face their first day hungry.']]),
  ['bren', 'A pair of hands would help more than a fine promise. The queue at the well can wait until we have unloaded.']],
  fx: life => { if (life.gift === 'appraisal') life.flags.readRessa = true; }, choices: [
    { t: 'Help Bren unload the flour', go: marketNext, fx: life => { townShift(life, 2, -1); life.flags.unloaded = true; } },
    { t: 'Accept Ressa\'s invitation to her hearth', need: life => !has(life, 'readRessa'),
      why: 'Ressa felt you reading her. She has closed her kitchen to you.', go: marketNext,
      fx: life => { townShift(life, 1, -1); life.flags.hearth = true; } },
    { t: life => `Buy bread for the waiting families (${breadPrice(life)} silver)`, need: life => life.silver >= breadPrice(life),
      why: 'You have too little silver for bread at today\'s price.', go: marketNext,
      fx: life => { life.silver -= breadPrice(life); townShift(life, 1, -2); life.flags.sharedBread = true; } },
    { t: 'Keep your silver and leave the market', go: marketNext }
  ] };
NODES.a_pocket_job = { bg: 'market', lines: [
  ['corvin', 'Pocket Space! I reserved a cart for you. One sealed crate to my storehouse; four silver. Do not open it.'],
  ['', 'Flour dust clings to the lid. Through the slats, you see sacks marked for the outer farms.'],
  ['ressa', 'That is the relief flour. Those families were promised it.'],
  ['corvin', 'Carry it and be paid. Refuse and cover my cart: three silver. Or help my porters until dusk; a gift like yours makes everyone expect a favor.']], choices: [
    { t: 'Carry Corvin\'s crate (earn four silver)', go: 'a_departure',
      fx: life => { life.silver += 4; life.flags.crate = true; townShift(life, -2, 1); } },
    { t: 'Refuse and pay for the reserved cart (three silver)', need: life => life.silver >= 3,
      why: 'You cannot cover the cart. You can still refuse and spend the afternoon helping the porters.', go: 'a_departure',
      fx: life => { life.silver -= 3; life.flags.refusedCrate = true; townShift(life, 0, -1); } },
    { t: 'Refuse; work off the cart until dusk', go: 'a_departure',
      fx: life => { life.flags.refusedCrate = true; life.flags.delayed = true; townDay(life, 2); townShift(life, -1, 1); } }
  ] };
NODES.a_return_market = { bg: 'market', lines: life => [
  ['', life.town.food <= 2 ? 'The market has one bread stall left. Empty baskets wait beside the well.' : 'Flour is being measured into smaller bags. The market still has bread, but no cart has come today.'],
  ['ressa', life.town.fear >= 4 ? 'People are closing their shutters. They hear the bell and imagine teeth at every door.' : 'Bren has kept the well queue orderly. It helps when somebody stays.'],
  ...(has(life, 'crate') ? [['ressa', 'You took our relief flour. I cannot offer you my hearth while those families go without. You can help put it right.']] : []),
  ['bren', 'The council meets tomorrow, before the last night. What shall we tell the people waiting here?']],
  fx: life => townDay(life, 2), choices: [
    { t: life => `Buy another loaf to share (${breadPrice(life)} silver)`, need: life => life.silver >= breadPrice(life),
      why: 'Bread has grown dear and your purse will not cover it. Bren still needs help at the well.', go: 'a_council',
      fx: life => { life.silver -= breadPrice(life); townShift(life, 2, -2); } },
    { t: 'Stay at the well; share what you know', go: 'a_council', fx: life => { townShift(life, 1, -3); life.flags.reassured = true; } },
    { t: 'Ask Ressa to rally the neighbors', need: life => friendlyTown(life) && !has(life, 'crate') && !has(life, 'readRessa'),
      why: life => has(life, 'readRessa') ? 'Ressa will sell bread and hear the council, but will not open that private door again.' : has(life, 'crate') ? 'Ressa will not rally for you while the relief flour is in Corvin\'s storehouse.' : life.town.food < 3 ? 'Ressa is feeding her own queue. There is too little bread to send anyone away.' : 'The neighbors are afraid to leave their doors. Bren can help you reassure them.',
      go: 'a_council', fx: life => { life.flags.neighbours = true; townShift(life, 0, -2); } },
    { t: 'Help retrieve the relief flour from Corvin', need: life => has(life, 'crate'),
      why: 'No relief crate was diverted in this life.', go: 'a_council',
      fx: life => { life.flags.crate = false; life.flags.mendedCrate = true; life.silver = Math.max(0, life.silver - 4); townShift(life, 2, -2); } },
    { t: 'Leave them to prepare; go to the council', go: 'a_council' }
  ] };
const councilLines = NODES.a_council.lines;
NODES.a_council.fx = life => townDay(life, 3);
NODES.a_council.lines = life => [
  ['', life.town.food <= 2 ? 'On the last day, Ressa cuts the remaining loaves thin. A line of empty cups waits outside the Guild Hall.' : 'On the last day, bread and water are carried to the Guild Hall. There is enough to keep people standing.'],
  ['hesta', life.town.fear >= 4 ? 'The shutters are closing. I have names on the muster sheet who are too frightened to come.' : 'People have come from the well together. They are afraid, but they are here.'],
  ...(has(life, 'neighbours') ? [['ressa', 'You came when we needed hands. We have brought ours.']] : []),
  ...councilLines(life)
];
const wallsLines = NODES.a_walls.lines;
NODES.a_walls.lines = life => [...wallsLines(life),
  ['', has(life, 'neighbours') ? 'Ressa passes water along the wall. Bren keeps the frightened ones beside him until dawn.' : life.town.fear >= 4 ? 'There are gaps along the wall where people could not bring themselves to stand.' : 'The people from the well carry bread and water to the watch.']];
NODES.a_departure = { bg: 'market', lines: life => [
  ...(has(life, 'unloaded') ? [['bren', 'There. Flour in the stalls, not in my cart. Come back when you can; we will remember your hands.']]
    : has(life, 'hearth') ? [['ressa', 'A bowl by the fire, then. I have a spare spoon. You can return it when this is over.']]
    : has(life, 'sharedBread') ? [['ressa', 'Paid for, and shared. Watch their faces when they find there is enough for the person behind them.']]
    : [['', 'You leave your silver in your purse. Behind you, Bren lifts another sack alone.']]),
  ...(has(life, 'crate') ? [['', 'Four silver settle in your hand. The relief flour vanishes into your gift, and Ressa turns away.']]
    : has(life, 'delayed') ? [['', 'You spend the afternoon with the porters. By dusk, the well queue is longer and your journey is still ahead.']]
    : has(life, 'refusedCrate') ? [['', "You count out three silver for Corvin's cart. The relief flour stays with Ressa. Saying no has cost you, but the families will eat."]]
    : []),
  ['', 'Beyond Lanthorn, the Deepwood is still moving. It is time to find out why.']
], go: routeNext };

// Visit the square on the final day too: the visible town carries the consequences into the council.
for (const c of NODES.a_return_market.choices) c.go = 'a_last_market';
NODES.a_last_market = { bg: 'market', fx: life => townDay(life, 3), lines: life => [
  ['', life.town.food <= 2 ? 'On the last morning, three bread stalls stand empty. Ressa saves the last loaf for the queue at the well.' : 'On the last morning, there is bread in the square. Bren divides it among the people heading to the Guild Hall.'],
  ['ressa', life.town.fear >= 4 ? 'The shutters are closed. Knock gently; some of them are frightened even of a friend.' : 'Leave the shutters open a little. We need to see that someone else is still here.'],
  ['hesta', 'The council is gathering. Come inside. We have one night left.']
], go: 'a_council' };
