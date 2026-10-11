'use strict';
/* Walkable towns (S4), on the arcade's world kit (shared/world.js): Wildbond's walking and HD-2D look, in Realmbound's
   colours. Arriving in town, the scene turns into the hub you can walk around (arrow keys / WASD, or tap where to go;
   Enter or Space talks to whoever you face):
   - the Inn (in Thornvale, the Abbey) rests everyone, the Smithy buys junk and repairs, the Trainer and the Stable open
     their tabs, the quest board and a quest giver (the next quest in a scene), townsfolk, and now and then Pell the
     travelling peddler with his mule Brisket (docs/lore/multiverse.md), who sells a healing potion;
   - the Guild hall: before founding it opens the Guild tab; once your guild exists you walk inside, where your guild
     adventurers gather by the hearth (each talks by mood and asks their favor), with the bank chest and jobs board;
   - the town gate takes you back out on the road.
   Concord hubs are stone-and-timber towns; Wildclan hubs are camps of hide tents around a great firepit, with torches
   and a totem. On Auto your hero strolls to the smithy, then out of the gate. Outside the scene (tests, hidden tabs)
   town works exactly as before. */
const TOWN_TILES = { ',': {}, f: {}, '.': {}, _: {}, r: {}, '~': { solid: 1 }, T: { solid: 1 }, '#': { solid: 1 }, '=': { solid: 1 }, L: { solid: 1 },
  O: { solid: 1 }, F: { solid: 1 }, Y: { solid: 1 }, H: { solid: 1 }, B: { solid: 1 },
  s: {}, U: { solid: 1 }, V: { solid: 1 }, K: { solid: 1 }, E: { solid: 1 }, A: { solid: 1 }, Q: { solid: 1 }, D: { door: 1 }, P: { sign: 1, solid: 1 }, C: { sign: 1, solid: 1 }, J: { sign: 1, solid: 1 }, G: { exit: 1 } };
const TOWN_W = 28, TOWN_H = 16;
/* buildings: their footprint, the door on the bottom row (facing the street) and what it opens */
const TOWN_BUILDINGS = [
  { kind: 'inn', name: 'Inn', x: 2, y: 2, w: 5, h: 3, door: 4 },
  { kind: 'smith', name: 'Smithy', x: 8, y: 3, w: 4, h: 2, door: 9 },
  { kind: 'guild', name: 'Guild Hall', x: 12, y: 1, w: 5, h: 4, door: 14 },
  { kind: 'trainer', name: 'Trainer', x: 18, y: 3, w: 4, h: 2, door: 19 },
  { kind: 'stable', name: 'Stable', x: 23, y: 2, w: 3, h: 3, door: 24 }
];
/* a few hubs rename their buildings */
const HUB_NAMES = { thornvale: { inn: 'Abbey' } };
function buildingName(b) { const h = H(), n = h && HUB_NAMES[h.zone]; return (n && n[b.kind]) || (townKind() === 'camp' ? { inn: 'Longhouse', smith: 'Forge', guild: 'Guild Lodge', trainer: 'Trainer', stable: 'Corral' }[b.kind] : b.name); }
/* Concord hubs are towns; Wildclan hubs (and the Wildclan side of shared hubs) are camps */
function townKind() { const h = H(); if (!h) return 'town'; const z = ZONES[h.zone]; return (z.faction || h.faction) === 'wild' ? 'camp' : 'town'; }
function townMap(kind) {
  const g = Array.from({ length: TOWN_H }, (_, y) => Array.from({ length: TOWN_W }, (_, x) => (y === 0 || x === 0 || x === TOWN_W - 1 || y === TOWN_H - 1) ? 'T' : ','));
  const doors = {};
  for (const b of TOWN_BUILDINGS) { for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) g[y][x] = '#'; const dy = b.y + b.h - 1; g[dy][b.door] = 'D'; doors[b.door + ',' + dy] = b;
    for (let y = dy + 1; y <= 6; y++) g[y][b.door] = '.'; }
  for (let x = 2; x <= 25; x++) g[6][x] = '.';
  for (let y = 7; y < TOWN_H - 1; y++) { g[y][13] = '.'; g[y][14] = '.'; }
  for (let y = 8; y <= 10; y++) for (let x = 10; x <= 17; x++) g[y][x] = '.';
  g[TOWN_H - 1][13] = 'G'; g[TOWN_H - 1][14] = 'G';
  g[9][11] = kind === 'camp' ? 'F' : 'O'; g[8][17] = 'P';
  if (kind === 'camp') g[8][10] = 'Y';
  for (const [x, y] of [[7, 7], [20, 7], [12, 12], [15, 12]]) g[y][x] = 'L';
  for (const [x, y] of [[3, 10], [5, 12], [22, 11], [24, 13], [2, 14], [9, 13], [19, 13], [26, 9]]) g[y][x] = 'T';
  for (const [x, y] of [[3, 8], [4, 8], [4, 9], [21, 9], [22, 9], [10, 12], [17, 13], [25, 12]]) g[y][x] = 'f';
  for (let x = 22; x <= 26; x++) if (g[5][x] === ',') g[5][x] = '=';
  return { rows: g.map(r => r.join('')), doors, start: [13, TOWN_H - 2, 'up'] };
}
/* the guild hall, inside: a hearth on the back wall, long tables, a rug, the bank chest and the jobs board */
const GUILD_HALL = {
  rows: [
    '################',
    '#______HH______#',
    '#_C___________J#',
    '#______________#',
    '#__BBBB__BBBB__#',
    '#______rr______#',
    '#______rr______#',
    '#__BBBB__BBBB__#',
    '#______rr______#',
    '#######GG#######'],
  doors: {}, start: [7, 8, 'up'], hall: true
};
const GUILD_SPOTS = [[3, 3], [12, 3], [2, 6], [13, 6], [5, 5], [10, 5], [3, 8], [12, 8]];
const TOWN_MAPS = { town: townMap('town'), camp: townMap('camp') };
const TOWN_HUBS = Object.fromEntries(Object.keys(HUB_LAYOUTS).map(zone=>[zone,{town:makeHubMap(zone,'town'),camp:makeHubMap(zone,'camp')}]));
const TOWN = { get map() { return inGuildHall() ? GUILD_HALL : SERVICE_ROOMS[TOWN.inside] || townOutsideMap(); }, inside: false, pos: { x: 13, y: TOWN_H - 2, dir: 'up' }, on: false, cam: null, last: null, auto: null };
/* the people of the hub (the giver's name follows the zone's first quest giver so they're someone you know) */
function townPeople() {
  const h = H(); if (!h) return [];
  if (inGuildHall()) return hallPeople();
  if (TOWN.inside) return serviceRoomPeople();
  const q = (QUESTS[h.zone] || [])[0], giverName = q ? giver(q) : 'Quartermaster Hale';
  const list = [
    { id: 'giver', name: giverName, at: [18, 9], dir: 'left', look: { race: FACTIONS[h.faction].races[0], cls: 'warrior', hair: '#6b4423' } },
    { id: 'registrar', name: 'Registrar Mott', at: [16, 6], dir: 'down', look: { race: FACTIONS[h.faction].races[1] || FACTIONS[h.faction].races[0], cls: 'priest', hair: '#d8d8d8' },
      lines: () => guildOn() ? [[`Registrar Mott`, `${G().name} is in good standing. The hall is through that door; mind the banners, they bite.`]]
        : foundProblem() ? [['Registrar Mott', `A guild? A fine idea. ${foundProblem()}`]] : [['Registrar Mott:happy', 'Everything is in order! Step into the hall and sign the charter.']] },
    { id: 'kid', name: townKind() === 'camp' ? 'Tikka the Firekeeper' : 'Pip the Lamplighter', at: [8, 9], dir: 'right', look: { race: h.faction === 'wild' ? 'grishar' : 'human', cls: 'rogue', hair: '#c96a2a' },
      lines: () => [[townKind() === 'camp' ? 'Tikka the Firekeeper' : 'Pip the Lamplighter', townKind() === 'camp'
        ? (realmNight() > .4 ? 'The big fire burns all night. Sit a while, the stories get better after dark.' : 'I keep the fire fed. Bring me a story and you can warm your hands for free!')
        : (realmNight() > .4 ? 'Every lamp lit! You can see the whole square from the inn roof.' : 'I light the lamps when it gets dark. Come back tonight and see!')]] }
  ];
  if (pellHere()) list.push({ id: 'pell', name: 'Pell', at: [6, 10], dir: 'right', look: { race: 'human', cls: 'hunter', hair: '#8a6a4a' }, mule: [5, 10] });
  return list;
}
/* inside the hall: your guild's adventurers, from every hero, and the registrar */
function hallPeople() {
  const list = [{ id: 'registrar', name: 'Registrar Mott', at: [7, 2], dir: 'down', look: { race: 'human', cls: 'priest', hair: '#d8d8d8' },
    lines: () => [['Registrar Mott', `Welcome home to ${G().name}. Level ${G().level}, ${Object.keys(G().members).length} adventurer${Object.keys(G().members).length === 1 ? '' : 's'} on the roll. The chest holds our supplies; the board, our work.`]] }];
  const members = Object.keys(G().members || {}).map(k => ({ k, w: workerOf(k) })).filter(x => x.w), seated = members.slice(0, GUILD_SPOTS.length);
  const guest = members.find(x => x.k === TOWN.storyGuest); if (guest && !seated.some(x => x.k === guest.k)) seated[seated.length - 1] = guest;
  seated.forEach(({ k, w }, i) =>
    list.push({ id: 'member', key: k, name: w.name, at: GUILD_SPOTS[i], dir: i % 2 ? 'left' : 'right', look: { race: w.n.race, cls: w.cls, hair: w.n.hair || '#6b4423' } }));
  return list;
}
/* Pell visits a hub for a while, then moves on (the same hours for everyone) */
function pellHere(now) { return Math.floor((now === undefined ? Date.now() : now) / 1800000) % 3 === 0; }
const TOWN_WALK = World.walker({
  map: () => TOWN.map, tiles: TOWN_TILES, pos: () => TOWN.pos,
  people: () => { const ps = townPeople(); return ps.concat(ps.filter(p => p.mule).map(p => ({ at: p.mule, isMule: 1, id: 'brisket' }))); },
  busy: () => !!RTALK || !!modalKind || (typeof realmNotebookOpen==='function' && realmNotebookOpen()), speed: () => 4.5,
  on: { person: n => townTalk(n), door: (x, y) => townDoor(TOWN.map.doors[x + ',' + y]), exit: townExit, sign: (x,y) => townSign(x,y) }
});
function townActive() { if(typeof realmRoadActive==='function'&&realmRoadActive())return false; const h = H(); return !!(h && C && !h.dun && C.phase === 'intown' && PW > 0); }
function townEnter() {
  TOWN.inside = false; TOWN.storyGuest = null; const [x, y, d] = TOWN.map.start; TOWN_WALK.place(x, y, d); TOWN.auto = null;
  if (aiOn()) { C.townT = Math.max(C.townT || 0, 25); TOWN.auto = 'smith'; }
}
function townExit() {
  if (TOWN.inside) { const b = townBuildings().find(x => x.kind === (inGuildHall() ? 'guild' : TOWN.inside)); TOWN.inside = false; TOWN_WALK.place(b.door, b.y + b.h, 'down'); line(`You step back out into ${hubName()}.`, 'l-sys'); return; }
  TOWN.auto = null; leaveTown();
}
function townSign(x, y) {
  const ch = TOWN.map.rows[y][x];
  if (ch === 'C') { S.tab = 'supplies'; renderTab(true); const b = bank(); line(`The guild chest: ${b.ore} ore, ${b.herb} herbs, ${b.kit} repair kits, ${b.potion} healing potions. (Guild tab)`, 'l-sys'); return; }
  if (ch === 'J') { S.tab = 'supplies'; renderTab(true); line(`The jobs board: ${ROSTER.busy()} of ${jobSlots()} slots working. (Guild tab)`, 'l-sys'); return; }
  townDoor({ kind: 'board' });
}
function townDoor(b) {
  if (!b) return; const h = H();
  if (['inn','smith'].includes(b.kind) && townActive() && !aiOn()) { TOWN.inside=b.kind;TOWN.auto=null;TOWN_WALK.place(...SERVICE_ROOMS[b.kind].start);line('You step into the '+buildingName(b)+'.','l-sys');sfx('select');return; }
  if (b.kind === 'inn') { C.hp = ST.hpMax; if (CLASSES[h.cls].res === 'mana') C.res = ST.resMax; for (const p of C.party) { p.dead = false; p.hp = compStats(p.n).hpMax; }
    line(townKind() === 'camp' ? 'You eat by the longhouse fire and sleep under heavy furs. Everyone is rested.' : HUB_NAMES[h.zone] && HUB_NAMES[h.zone].inn === 'Abbey'
      ? 'The brothers of the Abbey find you a quiet cell and a bowl of barley soup. Everyone is rested.' : 'The innkeeper sets a bowl of stew in front of you. Everyone is rested.', 'l-heal'); sfx('heal'); return; }
  if (b.kind === 'smith') { const junk = h.bags.filter(i => i.junk).length; sellJunk(true); repairAll(false); if (junk) line(`The smith buys your ${junk} bits of junk.`, 'l-loot'); S.tab = 'bags'; renderTab(true); sfx('coin'); return; }
  if (b.kind === 'trainer') { S.tab = 'talents'; renderTab(true); line('The trainer looks over your talents. (Talents tab)', 'l-sys'); return; }
  if (b.kind === 'stable') { S.tab = 'mounts'; renderTab(true); line('The stablehand nods at your mounts. (Mounts tab)', 'l-sys'); return; }
  if (b.kind === 'guild') {
    if (guildOn() && townActive()) { TOWN.inside = true; TOWN.auto = null; const [x, y, d] = GUILD_HALL.start; TOWN_WALK.place(x, y, d); line(`You step into the hall of ${G().name}.`, 'l-sys'); sfx('select'); return; }
    S.tab = 'supplies'; renderTab(true); line(guildOn() ? `You step into the hall of ${G().name}. (Guild tab)` : 'The Guild Hall stands empty, waiting for a charter. (Guild tab)', 'l-sys'); return; }
  if (b.kind === 'board') { S.tab = 'quests'; renderTab(true); line('You read the notices on the quest board. (Quests tab)', 'l-sys'); }
}
function townTalk(n) {
  if(n.id==='keeper'){talkTownService(n);return;}
  if (n.isMule) { SCN.play([['Pell', 'That\'s Brisket. He doesn\'t talk, which makes him the best listener in three worlds.']], null); return; }
  const h = H();
  if (n.id === 'member') { memberTalk(n.key); return; }
  if (n.id === 'registrar') { const hero = H(); SCN.play(n.lines(), choice => { SCN.el.classList.remove('member-story-dialogue'); if (choice === 0 && H() === hero) openMemberStoryBook(); }, { choices: ['Open the Hearth Book', 'Another time'] }); RTALK.memberStory = true; C.lastInput = C.run; TOWN.auto = null; SCN.el.classList.add('member-story-dialogue'); SCN.el.scrollIntoView({ block: 'center' }); return; }
  if (n.id === 'giver') { const q = (QUESTS[h.zone] || []).find(q => qState(q) === 'avail');
    if (q && h.quests.active.length < 3) { questOffer(q.id); return; }
    SCN.play([[n.name, q ? 'Your pack looks full already. Finish what you carry first, then come and see me.' : 'Nothing new on the board for you today. The road is quieter for your work.']], null); return; }
  if (n.id === 'pell') { const cost = 200;
    SCN.play([['Pell:happy', 'Just passing through! Honest prices, mind. A healing potion for the road? Two silver, and Brisket throws in a nod.']],
      c => { if (c !== 0) return; if (h.money < cost) { err('Not enough money.'); return; } h.money -= cost; bank().potion++; sfx('coin'); line('Pell hands you a healing potion. It goes into the supply bank.', 'l-loot'); save(); },
      { choices: ['Buy a potion (2s)', 'Not today'] }); return; }
  SCN.play(n.lines(), null);
}
/* a guild adventurer in the hall: their favor if they have one, otherwise a word that shows their mood */
function memberTalk(key) {
  if (playMemberStoryRepair(key, false)) return;
  if (!memberStoryProblem(key) && playMemberStory(key, false)) return;
  const w = workerOf(key); if (!w) return; const mood = w.m.mood, face = mood >= 70 ? ':happy' : mood < 30 ? ':sad' : '';
  const req = typeof memberRequest === 'function' ? memberRequest(key) : null;
  if (req) { const voice = (typeof REQUEST_VOICE !== 'undefined' && (REQUEST_VOICE[w.n.pers] || REQUEST_VOICE.cheerful)) || { hello: '' };
    SCN.play([[w.name + face, `${voice.hello} ${req.ask}`.trim()]], c => { if (c === 0 && fulfillMemberRequest(key)) { save(); renderTab(true); } },
      { choices: [`Give ${req.count} ${req.supply}`, 'Later'] }); return; }
  const lines = mood >= 70 ? ['Best hall in the realm, and I\'ve slept in a few. Point me at something and I\'ll do it.', 'When you\'re out there, we hear about it. Makes a person proud to wear the colours.']
    : mood >= 30 ? ['Quiet day. I wouldn\'t mind a job, or a road with you, if one comes up.', 'The hearth is warm. Still, I joined to be useful.']
    : ['I\'ve been sitting by this fire a long while. Do you still need me?', 'Nobody\'s asked for me in days. I\'m starting to wonder why I signed.'];
  const state = memberStoryState(key), personal = memberStoryResult(w.name, state);
  SCN.play([[w.name + (memberStoryHurt(state) ? ':sad' : face), personal || lines[Math.floor(Date.now() / 60000) % lines.length]]], null);
}
/* Services are offered by people in the room, with prices in their choice labels. */
function talkTownService(n){
  if(RTALK||!H()||!TOWN.inside||inGuildHall()||aiOn())return false;
  const room=TOWN.inside,hero=H(),account=S,price=repairCost(),junk=hero.bags.filter(i=>i.junk).reduce((sum,i)=>sum+i.value,0);
  let settled=false;const serviceState={cancelled:false};
  const inn=room==='inn',choices=inn?['Rest with your companions','Another time']:['Sell scraps · '+moneyTxt(junk),'Repair equipment · '+moneyTxt(price),'Sell scraps and repair','Another time','Commission guild gear'];
  SCN.play([[n.name,inn?'There is a warm bowl and a quiet bed for everyone who came with you. Will you stay a while?':'Set your pack down. I can buy the scraps, mend your equipment, or take care of both.']],choice=>{
    if(settled||serviceState.cancelled)return;settled=true;
    SCN.el.classList.remove('town-service-dialogue');
    if(S!==account||H()!==hero||TOWN.inside!==room||hero.mode==='auto')return;
    if(!inn&&choice===4){openGuildGear(n);return;}
    if(inn&&choice===0){C.hp=ST.hpMax;if(CLASSES[hero.cls].res==='mana')C.res=ST.resMax;for(const p of C.party){p.dead=false;p.hp=compStats(p.n).hpMax;}line('You and your companions rest by the hearth.','l-heal');sfx('heal');}
    else if(!inn&&choice<3){if(choice===0||choice===2)sellJunk(false);if(choice===1||choice===2)repairAll(false);renderTab(true);sfx('coin');}
    save();
  },{choices});RTALK.townService=true;RTALK.serviceState=serviceState;C.lastInput=C.run;TOWN.auto=null;SCN.el.classList.add('town-service-dialogue');SCN.el.scrollIntoView({block:'center'});return true;
}
function clearTownService(){
  if(RTALK&&RTALK.townService){RTALK.serviceState.cancelled=true;removeGuildGearPreview();RTALK=null;SCN.el.hidden=true;SCN.el.classList.remove('town-service-dialogue');}
}
/* Auto: stroll to the smithy, then out of the gate */
function townAutoTick() {
  if(typeof realmNotebookOpen==='function' && realmNotebookOpen())return;
  if (!TOWN.auto && aiOn() && !RTALK) { TOWN.auto = 'smith'; C.townT = Math.max(C.townT || 0, 25); } // Auto took over while you stood around
  if (!TOWN.auto || !aiOn() || RTALK || !TOWN_WALK.arrived() || TOWN_WALK.path.length) return;
  if (TOWN.inside) { TOWN_WALK.walkTo(TOWN.map.start[0], TOWN.map.rows.length - 1); return; } // out of the hall first
  if (TOWN.auto === 'smith') { const b = townBuildings().find(x => x.kind === 'smith'); TOWN_WALK.walkTo(b.door, b.y + b.h - 1); TOWN.auto = 'gate'; return; }
  if (TOWN.auto === 'gate') { TOWN_WALK.walkTo(13, TOWN_H - 1); TOWN.auto = 'out'; }
}

/* ---- painting the town ---- */
const TOWN_HD = World.hd({ src: 16 });
const tHash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
function townPal() {
  const h = H(), z = ZONES[h.zone], wild = townKind() === 'camp';
  return { grass: z.ground, grassDk: Ambience.mix(z.ground, '#000000', .18), grassLt: Ambience.mix(z.ground, '#ffffff', .12), stone: wild ? '#a08868' : '#9a9a90', stoneDk: wild ? '#7a6448' : '#76766e',
    wall: wild ? '#b08a60' : '#d8c8a8', timber: wild ? '#5a3a22' : '#5a4632', roof: wild ? ['#8a5a3a', '#6a4a2a', '#9a6a3a', '#a0603a', '#5a3a22'] : ['#8a2a1a', '#4a5a7a', '#6a2a5a', '#4a6a4a', '#7a3a1a'],
    tree: Ambience.mix(z.hill, '#2a5a2a', .4), treeDk: Ambience.mix(z.hill, '#000000', .3), wood: '#7a5634', woodDk: '#5a3c22', rug: '#8a2a2a', rugLt: '#c8a050' };
}
function townFlat(g, ch, X, Y, s, t, x, y) {
  const P = TOWN.pal, hsh = tHash(x, y), R = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(X + a, Y + b, w, h); };
  if(ch==='s'){R(0,0,s,s,'#d8e3e6');R((hsh%10),3,5,1,'#b9cbd5');return;}
  if(ch==='~'){R(0,0,s,s,'#345c6a');R(2,(reduce?5:(Math.floor(t*2)+y)%12),10,1,'#6c96a0');return;}
  if (ch === '.' || ch === 'G') { if (TOWN.inside) { R(0, 0, s, s, P.woodDk); return; } R(0, 0, s, s, P.stone); g.fillStyle = P.stoneDk; for (let i = 0; i < 4; i++) { const ox = (hsh >> (i * 3)) % 12, oy = (hsh >> (i * 5)) % 12; g.fillRect(X + ox, Y + oy, 4, 1); g.fillRect(X + ox, Y + oy, 1, 3); } return; }
  if (ch === '_') { R(0, 0, s, s, P.wood); g.fillStyle = P.woodDk; g.fillRect(X, Y + 7, s, 1); g.fillRect(X, Y + 15, s, 1); g.fillRect(X + (y % 2 ? 4 : 11), Y, 1, 7); g.fillRect(X + (y % 2 ? 9 : 2), Y + 8, 1, 7); return; }
  if (ch === 'r') { R(0, 0, s, s, P.rug); g.fillStyle = P.rugLt; g.fillRect(X + (x % 2 ? 0 : s - 2), Y, 2, s); if ((x + y) % 2) g.fillRect(X + 6, Y + 6, 4, 4); return; }
  R(0, 0, s, s, (hsh & 3) ? P.grass : P.grassDk); g.fillStyle = P.grassLt; for (let i = 0; i < 3; i++) g.fillRect(X + (hsh >> (i * 4)) % 14, Y + (hsh >> (i * 6)) % 14, 1, 2);
  if (ch === 'f') for (let i = 0; i < 5; i++) { g.fillStyle = ['#e85a7a', '#f2c14e', '#ffffff', '#b48aff'][(hsh >> i) & 3]; g.fillRect(X + (hsh >> (i * 3)) % 13 + 1, Y + (hsh >> (i * 4)) % 13 + 1, 2, 2); }
}
function buildingAt(x, y) { return townBuildings().find(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h); }
/* labels don't cast shadows */
function label(c, text, cxp, y, s) { if (TOWN.pass === 'shadow') return; const sz = Math.max(9, Math.round(s * .28)); c.font = `700 ${sz}px Alegreya Sans, sans-serif`; c.textAlign = 'center'; c.fillStyle = 'rgba(0,0,0,.55)'; c.fillText(text, cxp + 1, y + 1); c.fillStyle = '#ffe9b0'; c.fillText(text, cxp, y); c.textAlign = 'left'; }
function townStand(c, ch, left, base, s, t, x, y, pass) {
  TOWN.pass = pass;
  const P = TOWN.pal, u = s / 8, R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(Math.floor(left + a * u), Math.floor(base - (b + h) * u), Math.ceil(w * u), Math.ceil(h * u)); };
  const night = realmNight(), camp = townKind() === 'camp' && !TOWN.inside, px = Math.max(2, Math.round(u));
  if (ch === 'T') { const sw = reduce ? 0 : Math.sin(t * 1.3 + x) * .3; R(3, 0, 2, 4.5, '#5a3c22'); R(-.3, 4, 8.6, 5.4, P.treeDk); R(.2, 4.4, 7.6, 4.8, P.tree); R(.8 + sw, 8.8, 6.4, 3.2, P.treeDk); R(1.2 + sw, 9.1, 5.6, 2.7, P.tree); R(2 + sw * 1.5, 11.6, 4, 2, P.treeDk); R(2.4 + sw * 1.5, 11.8, 3.2, 1.6, P.tree); return; }
  if (TOWN.inside && ch === '#') { // the hall's walls: panelled wood, banners on the back wall, candles
    R(0, 0, 8, 14, P.woodDk); R(0, 0, 8, 1.2, '#3a2414'); R(0, 6, 8, .6, '#3a2414');
    if (inGuildHall() && y === 0 && x % 3 === 1) { R(2.4, 6.6, 3.2, 6, '#2a4a8a'); R(2.4, 6.4, 3.2, .5, '#f2c14e'); R(3.6, 8.5, .8, 2, '#f2c14e'); }
    if (y === 0 && x % 3 === 2) { R(3.6, 7, .8, 1.6, '#efe6cc'); R(3.7, 8.6, .6, .8, '#ffd36a'); }
    return; }
  if(ch==='K'){R(1,0,6,3,P.stoneDk);R(2,3,4,5,P.stone);R(3,5,2,1,'#b6bdaf');return;}
  // Inn furniture occupies its own solid cell; the centre runner stays clear for arrivals.
  if(ch==='U'){R(.7,0,6.6,6,P.woodDk);R(1,5.5,6,1,P.wood);R(1.2,.5,5.6,4.6,'#976d45');R(3.8,.5,.4,4.6,P.woodDk);R(3,2.3,.5,.6,'#d6af69');R(4.5,2.3,.5,.6,'#d6af69');R(1.4,6,4.8,.6,'#ded4b7');R(1.8,6.6,4,.6,'#b7b99d');return;}
  if(ch==='V'){R(1.3,0,.7,2,P.woodDk);R(6,0,.7,2,P.woodDk);R(1,2,6,1,P.wood);R(1.2,3,5.6,.8,'#9c5740');R(1.3,3,.7,3.5,P.woodDk);R(6,3,.7,3.5,P.woodDk);R(1.3,5,5.4,.7,P.wood);return;}
  if(ch==='E'&&TOWN.inside==='inn'){R(.7,0,6.6,1.5,P.woodDk);R(1,1.5,6,5.5,'#d6c8a7');R(1,5.4,6,1.6,P.woodDk);R(1.6,5.6,4.8,1,'#f0e5ca');R(1.2,1.7,5.6,3.7,'#567879');R(1.2,2.2,5.6,.5,'#adc1ae');R(1.2,4.6,5.6,.5,'#adc1ae');R(1.3,0,.7,1,P.woodDk);R(6,0,.7,1,P.woodDk);return;}
  if(ch==='E'){R(.4,0,7.2,2,P.woodDk);R(.8,2,6.4,1,'#ede4cb');R(1,3,6,1.4,'#537d86');R(1,3.4,6,1,'#759b9c');return;}
  if(ch==='A'){R(2,0,4,2,'#333943');R(3,2,2,3,'#555e69');R(.5,5,7,1.4,'#9ba7b3');return;}
  if(ch==='Q'){R(1,0,.8,7,P.woodDk);R(6,0,.8,7,P.woodDk);R(1,6,6,1,P.wood);R(3,2,.5,5,'#b7bec8');R(2,3,3,.5,'#b7bec8');return;}
  if (ch === 'H') { R(0, 0, 8, 12, '#6a6a70'); R(.6, 0, 6.8, 11, '#8a8a90'); R(1.6, 0, 4.8, 5, '#1a1410');
    if (x % 2 === 0) TOWN.hearth = AMB.fire(c, left + s, base - u * .5, px, t, { id: 'hearth', size: 1.4, smoke: false }); return; }
  if (ch === 'B') { R(-.2, 2.2, 8.4, 1.4, P.wood); R(-.2, 3.6, 8.4, .4, '#c8985a'); R(.6, 0, .8, 2.2, P.woodDk); R(6.6, 0, .8, 2.2, P.woodDk);
    if (x % 3 === 0) { R(2.4, 3.6, 1.4, 1.2, '#d8d8d8'); R(5, 3.6, 1.2, 1.6, '#a0703a'); } return; }
  if (ch === 'C') { R(.8, 0, 6.4, 4, '#6a4426'); R(.8, 4, 6.4, 1.6, '#8a5a30'); R(.8, 2.6, 6.4, .5, '#f2c14e'); R(3.6, 2, .8, 1.6, '#f2c14e'); label(c, 'Chest', left + s / 2, base - 7 * u, s); return; }
  if (ch === 'J') { R(1, 0, .8, 6, '#5a3c22'); R(6.2, 0, .8, 6, '#5a3c22'); R(.4, 4, 7.2, 6, '#6b4a2a'); R(.8, 4.4, 6.4, 5.2, '#a0703a');
    for (const [a, b2] of [[1.2, 8.6], [3.4, 8.2], [5.2, 8.8], [2, 6.2], [4.4, 6]]) R(a, b2 - 1.4, 1.6, 1.4, '#efe6cc'); label(c, 'Jobs', left + s / 2, base - 11 * u, s); return; }
  if (ch === '#' || ch === 'D') {
    const b = buildingAt(x, y), roof = P.roof[townBuildings().indexOf(b) % P.roof.length], front = y === b.y + b.h - 1, depth = b.y + b.h - 1 - y;
    if (camp) { // hide tents: a peaked roof of skins over a low wall
      const peak = 12 + Math.min(depth, 2) * 1.6;
      if (!front) { R(-.2, 0, 8.4, peak - 2, Ambience.mix(roof, '#000000', .2)); R(2, peak - 2, 4, 1.4, roof); R(3.5, peak - .6, 1, 2, P.woodDk); return; }
      R(0, 0, 8, 7, Ambience.mix(roof, '#000000', .1)); R(-.4, 7, 8.8, 2.2, roof); R(.6, 9.2, 6.8, 1.6, roof); R(2, 10.8, 4, 1.4, roof);
      for (let i = 0; i < 4; i++) R(.4 + i * 2, 1, .3, 5.6, Ambience.mix(roof, '#ffffff', .25));
      if (ch === 'D') { R(2.4, 0, 3.2, 5.2, '#2a1810'); R(2.4, 4.2, 3.2, 1, Ambience.mix(roof, '#ffffff', .2)); label(c, buildingName(b), left + s / 2, base - 13 * u, s); }
      return; }
    if (!front) { const hgt = 11 + depth * 2.2; R(-.2, 0, 8.4, hgt, Ambience.mix(roof, '#000000', .15)); R(-.2, hgt - 1.2, 8.4, 1.2, Ambience.mix(roof, '#ffffff', .15));
      if (b.kind === 'inn' && HUB_NAMES[H().zone] && depth === b.h - 1 && x === b.door) { R(2, hgt, 4, 6, '#b8b0a0'); R(2.6, hgt + 2, 2.8, 2.4, '#3a2a1a'); R(3.4, hgt + 2.4, 1.2, 1.4, '#c8a050'); R(1.4, hgt + 6, 5.2, 1.2, roof); R(2.6, hgt + 7.2, 2.8, 1.2, roof); R(3.6, hgt + 8.4, .8, 1.6, '#f2c14e'); }
      return; }
    R(0, 0, 8, 9, P.wall); R(0, 0, .8, 9, P.timber); R(7.2, 0, .8, 9, P.timber); R(0, 4.4, 8, .7, P.timber); R(-.4, 9, 8.8, 2.4, roof); R(-.4, 10.8, 8.8, .6, Ambience.mix(roof, '#ffffff', .2));
    if (ch === 'D') { R(2.2, 0, 3.6, 6, '#3a2414'); R(2.6, 0, 2.8, 5.4, '#6a4426'); R(4.6, 2.6, .5, .5, '#f2c14e');
      if (b.kind === 'guild') { R(.6, 5.4, 1.2, 3.2, guildOn() ? '#2a4a8a' : '#6a6a6a'); R(6.2, 5.4, 1.2, 3.2, guildOn() ? '#2a4a8a' : '#6a6a6a'); R(.6, 5.2, 1.2, .4, '#f2c14e'); R(6.2, 5.2, 1.2, .4, '#f2c14e'); }
      label(c, buildingName(b), left + s / 2, base - 11.8 * u, s); }
    else { const lit = Ambience.mix('#3a3448', '#ffd36a', .2 + .8 * night); R(2.4, 5.6, 3.2, 2.4, '#3a2414'); R(2.8, 6, 2.4, 1.7, lit); R(3.9, 6, .3, 1.7, '#3a2414'); }
    return;
  }
  if (ch === 'L') { if (camp) { R(3.6, 0, .8, 8, P.woodDk); AMB.fire(c, left + s / 2, base - 8 * u, Math.max(1, Math.round(u * .7)), t, { id: 'torch' + x + y, size: .6, logs: false }); return; }
    R(3.6, 0, .8, 9, '#2b2b3a'); R(2.8, 9, 2.4, 2.2, '#2b2b3a'); R(3.1, 9.3, 1.8, 1.6, Ambience.mix('#806040', '#ffe08a', .3 + .7 * night)); return; }
  if (ch === 'P') { R(1, 0, .8, 6, '#5a3c22'); R(6.2, 0, .8, 6, '#5a3c22'); R(.4, 4, 7.2, 5, '#6b4a2a'); R(.8, 4.4, 6.4, 4.2, '#a0703a');
    for (const [a, b2] of [[1.2, 7], [3.4, 6.6], [5.2, 7.2], [2, 5], [4.4, 4.8]]) R(a, b2 - 1.4, 1.6, 1.4, '#efe6cc'); return; }
  if (ch === 'O') { R(.4, 0, 7.2, 2.4, P.stoneDk); R(.8, .4, 6.4, 1.8, P.stone); R(1.2, 1.6, 5.6, .8, '#4a8ab8'); R(3.5, 2.2, 1, 3.6, P.stone);
    const sp = reduce ? 0 : (Math.sin(t * 6) + 1) * .3; R(3.2, 5.6 + sp, 1.6, .6, '#bfe4ff'); R(2.4, 4.2 - sp, .5, 1.2, '#bfe4ff'); R(5.1, 4.2 - sp, .5, 1.2, '#bfe4ff'); return; }
  if (ch === 'F') { for (let i = 0; i < 6; i++) R(.2 + i * 1.3, 0, 1, 1.4, i % 2 ? '#6a6a70' : '#8a8a90');
    TOWN.firepit = AMB.fire(c, left + s / 2, base - u, px, t, { id: 'firepit', size: 1.6, smoke: true }); return; }
  if (ch === 'Y') { R(3, 0, 2, 14, '#7a5634'); R(2, 12, 4, 2.4, '#c0392b'); R(2.4, 9, 3.2, 2.4, '#e0b03a'); R(2.6, 6, 2.8, 2.4, '#4a8a6a'); R(.6, 11.4, 1.6, 1, '#7a5634'); R(5.8, 11.4, 1.6, 1, '#7a5634');
    R(2.8, 13, .6, .6, '#111'); R(4.6, 13, .6, .6, '#111'); return; }
  if (ch === '=') { if (camp) { for (let i = 0; i < 4; i++) { R(.3 + i * 2, 0, 1.4, 6, P.woodDk); R(.5 + i * 2, 6, 1, 1, P.wood); } return; }
    R(0, 0, 1, 5, '#7a5028'); R(7, 0, 1, 5, '#7a5028'); R(0, 1.5, 8, 1, '#a0703a'); R(0, 3.5, 8, 1, '#a0703a'); return; }
}
/* draw the town (or the hall) into the scene */
function drawTown(t) {
  const h = H(), dt = TOWN.last === null ? 0 : Math.min(.1, Math.max(0, t - TOWN.last)); TOWN.last = t;
  if (!TOWN.on) { TOWN.on = true; townEnter(); }
  TOWN_WALK.tick(dt); townAutoTick(); TOWN.pal = townPal(); TOWN.hearth = TOWN.firepit = null;
  const z = ZONES[h.zone], night = realmNight(), wk = zoneWeather(h.zone), W = AMB_WEATHER[wk] || {}, p = TOWN_WALK, people = townPeople(), inside = TOWN.inside;
  const things = people.map(n => ({ x: n.at[0], y: n.at[1], draw(c, left, base, s) { const pp = s / 11; drawPerson(left + s * .14, base - 13 * pp, pp, { race: n.look.race, cls: n.look.cls, hair: n.look.hair }, t + n.at[0], c); } }));
  for (const n of people) if (n.mule) things.push({ x: n.mule[0], y: n.mule[1], draw(c, left, base, s) { const pp = s / 16; drawBeast(c, left + s * .3, base - 14 * pp, pp, '#7a5a3a', 'horse', true, t * .5); } });
  if(inside==='stable'){const mount=activeMount();things.push({x:3,y:3,draw(c,left,base,s){drawBeast(c,left+s*.15,base-s,s/16,mount?mount.col:'#937455',mount?mount.kind:'horse',true,t);}});}
  things.push({ x: p.fx, y: p.fy, draw(c, left, base, s) { const pp = s / 11; drawHero(left + s * .14, base - 13 * pp, pp, t, c); } });
  const view = { rows: TOWN.map.rows, px: p.fx, py: p.fy, flat: townFlat, under: inside ? '_' : ',', stand: townStand, things,
    stands: { T: 1, '#': 1, D: 1, L: 1, P: 1, O: 1, '=': 1, F: 1, Y: 1, H: 1, B: 1, C: 1, J: 1, K: 1, E: 1, A: 1, Q: 1, U: 1, V: 1 }, noShadow: { '#': 1, D: 1, H: 1 } };
  if (inside) Object.assign(view, { sky: ['#1a1008', '#2a1a10'], hill: '#2a1a10', edgeFill: '#1a1008', haze: '#2a1a10', dof: false, horizon: .12, zoom: 5.2,
    skyDraw: (g, w, hh) => { g.fillStyle = '#20140c'; g.fillRect(0, 0, w, hh); g.fillStyle = '#2a1a10'; for (let x = 0; x < w; x += 24) g.fillRect(x, 0, 4, hh); } });
  else { const sky = [Ambience.mix(z.sky[0], '#070b22', night * .85), Ambience.mix(z.sky[1], '#2e3868', night * .8)];
    Object.assign(view, { sky, hill: TOWN.pal.treeDk, edgeFill: TOWN.pal.treeDk, haze: sky[1],
      skyDraw: (g, w, hh, tt) => AMB.sky(g, w, hh, tt, { top: z.sky[0], bottom: z.sky[1], h: hh, night, clouds: { n: 4, speed: 6 }, storm: W.storm ? 1 : W.rain ? .45 : 0, px: 2 }) }); }
  const sun = inside ? Object.assign(LT.time(.75), { elev: 0 }) : realmSun(), camp = townKind() === 'camp' && !inside, lamps = [];
  TOWN.map.rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === 'L') lamps.push({ x: x + .5, y: y + .9, h: 1.3, reach: 4 }); else if (ch === 'F') lamps.push({ x: x + .5, y: y + .9, h: .4, reach: 6.5 }); else if (ch === 'H' && x % 2 === 0) lamps.push({ x, y: y + 1.2, h: .5, reach: 8 }); }));
  Object.assign(view, { lt: LT, sun, lamps, noCast: { H: 1, F: 1, L: camp ? 1 : 0 } }); // shadows from the sun, moon, lamps and fires (23-light.js)
  TOWN.cam = TOWN_HD.draw(cx, PW, PH, t, view);
  // light: lamps, torches, windows, doors, the firepit and hearth, you; weather outdoors only
  const lights = [], at = (x, y) => TOWN.cam.fwd(x, y);
  TOWN.map.rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === 'L' || ch === 'D' || (inside && ch === '#' && y === 0 && x % 3 === 2)) { const q = at(x + .5, y + .9); if (q) lights.push({ x: q[0], y: q[1] - q[2] * (ch === 'L' ? 1.25 : ch === '#' ? 1 : .5), r: q[2] * (ch === '#' ? 1.6 : 2.6), col: '#ffc860', flick: true }); } }));
  if (TOWN.firepit) lights.push(Object.assign(TOWN.firepit, { r: TOWN.firepit.r * 2.2 }));
  if (TOWN.hearth) lights.push(Object.assign(TOWN.hearth, { r: TOWN.hearth.r * 2.6 }));
  const me = at(p.fx + .5, p.fy + .5); if (me) lights.push({ x: me[0], y: me[1] - me[2] * .6, r: me[2] * 2.2, col: '#ffe2b0' });
  const air = inside ? { fog: .12, col: '#c09060' } : (ZONE_LIGHT[h.zone] || { fog: .15, col: '#e0e6ea' }); // fog you move through, light shafts, the colour of the hour
  LT.fog(cx, PW, PH, t, { ground: PH, top: PH * (air.townFogTop === undefined ? .25 : air.townFogTop), density: air.fog * (inside ? 1 : .8) + (W.fog ? .3 : 0) + (sun.day && sun.p < .12 ? .06 : 0), col: Light.css(Light.mix(air.col, '#1a2040', !inside && !sun.day ? .55 : 0)), lights });
  if (!inside) { LT.grade(cx, PW, PH, sun, { tint: air.tint, amount: air.grade }); if (!W.rain) LT.shafts(cx, PW, PH, t, sun, { strength: air.shafts === undefined ? 1 : air.shafts }); }
  if (!inside) AMB.weather(cx, PW, PH, t, Object.assign({}, W, { px: 2, splashAnywhere: true, fireflies: night > .4 && !W.rain ? .5 : 0, onThunder: v => sfx('thunder', v) }));
  else AMB.weather(cx, PW, PH, t, { dust: .5, px: 2 });
  const dark = inside ? .8 : night; if (dark > .02) AMB.lights(cx, PW, PH, t, { dark, max: inside ? .5 : .55, tint: inside ? '#140a04' : air.night || '#0a0e2a', lights });
  if (!inside) AMB.flash(cx, PW, PH, t);
  LT.bloom(cx, cv, PW, PH, sun);
  if(typeof renderRealmFieldLocation==='function')return; // The viewport HUD owns labels and walking hints.
  // where you are, top left
  const fs = Math.max(12, Math.round(PH / 17)); cx.font = `700 ${fs}px Alegreya Sans, sans-serif`; const text = inside ? inGuildHall() ? `${guildOn()?G().name:'The Unclaimed Hall'} · Guild Hall` : buildingName(townBuildings().find(b=>b.kind===TOWN.inside)) : hubName(), lw = cx.measureText(text).width + 16;
  cx.fillStyle = 'rgba(20,16,12,.72)'; cx.fillRect(8, 8, lw, fs * 1.6); cx.fillStyle = '#f2c14e'; cx.textBaseline = 'middle'; cx.fillText(text, 16, 8 + fs * .82); cx.textBaseline = 'alphabetic';
  if(RTALK)return;
  const hint = Math.max(10, Math.round(PH / 22)); cx.font = `600 ${hint}px Alegreya Sans, sans-serif`; cx.fillStyle = 'rgba(255,240,210,.75)'; cx.textAlign = 'right';
  cx.fillText(aiOn() ? 'Auto: off to the smithy, then the road' : inside ? (inGuildHall()?'Talk to your guild':TOWN.inside==='inn'?'Talk to the Keeper':TOWN.inside==='trainer'?'Talk to the Trainer':TOWN.inside==='stable'?'Talk to the Stable Keeper':'Talk to the Smith')+' · Door: back to town' : PW<500?'Arrows / WASD · Tap to walk · Enter to talk':'Walk: arrows / WASD or tap · Enter: talk · Gate: back to the road', PW - 10, PH - 10); cx.textAlign = 'left';
}
/* input while you're walking the town */
document.addEventListener('keydown', e => {
  if (!townActive() || RTALK || modalKind || (e.target.matches && e.target.closest('input,textarea,select,button,a,summary,[role="dialog"],.arc-set-bg'))) return;
  if (TOWN_WALK.keyDown(e)) { C.lastInput = C.run; TOWN.auto = null; e.preventDefault(); e.stopImmediatePropagation(); }
  else if ((e.key === 'Enter' || e.key === ' ') && TOWN_WALK.interact()) { e.preventDefault(); e.stopImmediatePropagation(); }
}, true);
document.addEventListener('keyup', e => { TOWN_WALK.keyUp(e); });
addEventListener('blur', () => { TOWN_WALK.held = []; });
cv.addEventListener('click', e => {
  if (!townActive() || !TOWN.cam || RTALK) return; const r = cv.getBoundingClientRect();
  if (TOWN_WALK.tap(e.clientX - r.left, e.clientY - r.top, TOWN.cam)) { C.lastInput = C.run; TOWN.auto = null; }
});
