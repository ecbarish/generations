'use strict';
/* The walkable world (T7b): one tile map per place. Data only. 12-walk.js moves you around these maps and
   ART[era].tile / ART[era].walker draw them, so a later era (HD-2D, voxel, 3D) can render the same maps.
   Tiles: '.' path  ',' grass  '"' tall grass (wild creatures hide here)  'f' flowers  '_' sand
          'T' tree  '~' water  'o' hot spring  'R' rock  'r' roof  '#' wall  'D' door  '=' fence  'P' signpost  'b' boardwalk  'j' moored skiff  'q' mooring sign
          (T ~ o R r # = P j q are solid)   'N' 'S' 'E' 'W' an exit on that side, drawn as path.
   A map: rows (all the same length), biome (wild creatures and levels; none for towns), start [x, y, facing],
   exits { N: { to, x, y, dir, locked } } (locked = what you're told if the next area's badge isn't earned yet),
   doors { 'x,y': 'inn' | 'shop' | 'ranch' }, signs { 'x,y': text }, npcs [{ who (a CAST key), at: [x, y], dir, lines, act }],
   warden [x, y] (where the area's Warden stands, if it has one), pen [x0, y0, x1, y1] (ranch creatures roam here),
   items [{ id, at: [x, y], give: { coins | lures | meat | fish | grain | berries: amount } }] (picked up once, by walking on them).
   A route trainer is an npc with trainer: { team: [[species, level]], sight (tiles they see ahead), win, after }:
   walk into their line of sight and they come for a battle; `lines` play before it, `win` after you win, `after` later. */
const TILES = {
  '.': {}, ',': {}, '"': { tall: 1 }, f: {}, _: {}, N: { exit: 1 }, S: { exit: 1 }, E: { exit: 1 }, W: { exit: 1 },
  T: { solid: 1 }, '~': { solid: 1 }, o: { solid: 1 }, R: { solid: 1 }, r: { solid: 1 }, '#': { solid: 1 }, '=': { solid: 1 }, D: { door: 1 },
  P: { solid: 1, sign: 1 }, b: {}, j: { solid: 1 }, q: { solid: 1, sign: 1 } // boardwalk and moored skiff (water beneath)
};

/* Townsfolk and passers-by: speakers for map conversations. Wardens and story speakers live in 00-data.js. */
Object.assign(CAST, {
  pip: { name: 'Pip', skin: '#f2c8a2', hair: 'spiky', hairCol: '#c96a2a', shirt: '#e0b03a', bg: '#f5e6b8', title: 'Larkhaven kid' },
  tobin: { name: 'Old Tobin', skin: '#c48e68', hair: 'hat', hairCol: '#d8d4cc', hatCol: '#4a4038', shirt: '#6a7a5a', bg: '#d8e2d0', title: 'Saltmarsh fisher' },
  delka: { name: 'Delka', skin: '#ce9c77', hair: 'hat', hairCol: '#736a61', hatCol: '#667f88', shirt: '#7f9392', bg: '#d5e4e2', title: 'Lookout recorder' },
  sivren: { name: 'Sivren', skin: '#966a4b', hair: 'short', hairCol: '#b9b6a3', shirt: '#5a7e92', bg: '#dbe6ec', title: 'Harbor keeper' },
  // route trainers
  bram: { name: 'Bram', skin: '#e8b890', hair: 'short', hairCol: '#4a3a2a', shirt: '#7a8a3a', bg: '#dfe6c4', title: 'Forager' },
  lise: { name: 'Lise', skin: '#d29a74', hair: 'long', hairCol: '#2a2a3a', shirt: '#c8604a', bg: '#f0d6cc', title: 'Birdwatcher' },
  cato: { name: 'Cato', skin: '#a8724e', hair: 'hat', hairCol: '#3a3028', hatCol: '#d8c08a', shirt: '#3a7a9a', bg: '#d0e4ec', title: 'Beachcomber' },
  marit: { name: 'Marit', skin: '#f0c8a4', hair: 'bun', hairCol: '#b8483a', shirt: '#4a6a8a', bg: '#d8e0ec', title: 'Lighthouse runner' },
  orsk: { name: 'Orsk', skin: '#8a5a3e', hair: 'short', hairCol: '#1e1e22', shirt: '#9a5a3a', bg: '#ecd4c0', title: 'Ridge hiker' },
  sela: { name: 'Sela', skin: '#c88a64', hair: 'spiky', hairCol: '#e8e0d0', shirt: '#6a4a8a', bg: '#e0d4ec', title: 'Spring keeper' },
  ilka: { name: 'Ilka', skin: '#e2b48c', hair: 'long', hairCol: '#5a3a24', shirt: '#7a8c5a', bg: '#e0e6d0', title: 'Rope-mender' },
  teodor: { name: 'Teodor', skin: '#a87452', hair: 'hat', hairCol: '#2a2a2a', hatCol: '#5a6a7a', shirt: '#c8b48a', bg: '#e6e0d0', title: 'Cloud-watcher' },
  evren: { name: 'Evren', skin: '#d4a27a', hair: 'bun', hairCol: '#493a2c', shirt: '#6c8650', bg: '#e0dfb9', title: 'Orchard keeper' },
  tavil: { name: 'Tavil', skin: '#946749', hair: 'short', hairCol: '#b8b49a', shirt: '#5a7d85', bg: '#d0dfd5', title: 'Ferry rope-mender' },
  veslin: { name: 'Veslin', skin: '#b28162', hair: 'bun', hairCol: '#5c4f4b', shirt: '#9e986d', bg: '#dadcc4', title: 'Bell keeper' },
  narro: { name: 'Narro', skin: '#deb798', hair: 'short', hairCol: '#393d48', shirt: '#69808d', bg: '#cedbdf', title: 'Cave surveyor' },
  mirel: { name: 'Mirel', skin: '#c79975', hair: 'bun', hairCol: '#55412e', shirt: '#b39255', bg: '#e9e3bc', title: 'Shelter mender' },
  aldren: { name: 'Aldren', skin: '#8f6145', hair: 'short', hairCol: '#c5af7c', shirt: '#738e72', bg: '#dce8c8', title: 'Gathering runner' },
  pell: { name: 'Pell', skin: '#c4956c', hair: 'hat', hairCol: '#796b58', hatCol: '#7a684c', shirt: '#aa895b', bg: '#e8dec0', title: 'Traveling peddler' }
});

const MAPS = {
  larkhaven: { name: 'Larkhaven', pal: 'thornwood', start: [11, 7, 'down'],
    rows: [
      'TTTTTTTTTTNNTTTTTTTTTTTT',
      'T,,,,,,,,,..P,,,,,,,,,,T',
      'T,rrrrr,,,..,,,,rrrrr,,T',
      'T,rrrrr,,,..,,,,rrrrr,,T',
      'T,##D##,,,..,,,,##D##,,T',
      'T,,,.,,,,,..,,,,,,.,,,,T',
      'T,,.................,f,T',
      'T,f,,,,,,,..,,,,,,,,,,,T',
      'T,,,,rrrrr..,=======,,,T',
      'T,,,,rrrrr..,=,,,,,=,,,T',
      'T,,,,##D##..,=,,,,,=,f,T',
      'T,f,,,,.,,..,===.===,,,T',
      'T,,,,,,..........,,,,,,T',
      'TTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    exits: { N: { to: 'thornwood', x: 13, y: 14, dir: 'up' } },
    doors: { '4,4': 'inn', '18,4': 'shop', '7,10': 'ranch' },
    signs: { '12,1': 'North: Thornwood. Mind the tall grass, and mind your partner.' },
    items: [{ id: 'lh1', at: [22, 12], give: { coins: 30 } }],
    pen: [14, 9, 18, 10],
    npcs: [
      { who: 'maren', at: [9, 11], dir: 'down', act: 'ranch',
        lines: [['maren', 'Your ranch creatures are out in the paddock, {name}. Come into the barn and I\'ll show you how they\'re doing.']],
        byBadge: { thorn: [['maren', 'Well, look at that. In my day the world had four colors and we liked it.'],
          ['maren', '...It is very pretty, though. Don\'t tell Isolde I said so. Come on, the barn\'s open.']] } },
      { who: 'pip', at: [21, 7], dir: 'left',
        lines: [['pip', 'Wren says she\'s going to be Champion. I\'m going to be Champion first. I\'m seven, so I\'ve got loads of time.'],
          ['pip', 'The tall grass up north is where the wild ones hide. Mum says don\'t go in without a partner. You\'ve got one, so that\'s fine.']],
        byBadge: { thorn: [['pip', 'Did everything just get... brighter? My shirt is YELLOW. Was it always yellow?'],
          ['pip', 'Mum says I\'m imagining it. Mum has also started wearing her good scarf, so.']],
          tide: [['pip', 'Mum, the corners are round now. The corners of EVERYTHING. Come and look!'],
            ['pip', 'Mum says the corners were always round. Then she stood looking at the windmill for a really long time.']] } }
    ] },
  thornwood: { name: 'Thornwood', biome: 'thornwood', start: [13, 14, 'up'], warden: [12, 1],
    rows: [
      'TTTTTTTTTTTTTNNTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTT,..,TTTTTTTTTTTTTT',
      'TT""""TTT,,,,..,,,TT"""""TTTTT',
      'T"""""",,,,,,..,,,,,,""""""""T',
      'T""""",,TT,,,..,,TT,,""""""""T',
      'T"",,,,TTT,,,..,,TTT,,,,"""""T',
      'T,,,,,,,,,,,,..,,,,,,,,,,,,,,T',
      'T~~~~,,""""""..,,"""""""",,TTT',
      'T~~~~,,""""""..,,"""""""",,,,T',
      'T~~~,,,""""""..,,,,,,TTT,,,,,T',
      'T,,,,,,,,,,,,..,,,,,,,,,,,,,,T',
      'TT""""""",,,,..,,,""""""",,TTT',
      'TT""""""",,,,..,,,""""""",,TTT',
      'TTT"""",,,,,P..,,,,,,""""TTTTT',
      'TTTTTTTTTTTTT..TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTSSTTTTTTTTTTTTTTT'
    ],
    exits: { S: { to: 'larkhaven', x: 10, y: 1, dir: 'down' },
      N: { to: 'saltmarsh', x: 13, y: 12, dir: 'up', locked: 'The hawthorn gate is shut tight. Warden Isolde keeps it, and she opens it only for tamers who have earned the Thorn Badge.' } },
    signs: { '12,13': 'Thornwood. South: Larkhaven. North: the hawthorn gate and Warden Isolde.' },
    items: [{ id: 'tw1', at: [2, 6], give: { coins: 60 } }, { id: 'tw2', at: [27, 10], give: { lures: 3 } }, { id: 'tw3', at: [5, 9], give: { berries: 5 } }],
    npcs: [
      { who: 'bram', at: [11, 10], dir: 'right',
        trainer: { sight: 3, team: [['gnawhound', 5], ['duskweaver', 6]],
          win: [['bram', 'Ha! Fair\'s fair. I was only out here for mushrooms anyway.']],
          after: [['bram', 'The stream by the pond floods in spring. Best mushrooms in Thornwood grow right where it stops.']] },
        lines: [['bram', 'Hold it! You walked right past my mushroom patch. Least you can do is give me a battle.']] },
      { who: 'lise', at: [16, 6], dir: 'left',
        trainer: { sight: 3, team: [['glimmerwing', 8], ['emberling', 9], ['pebblepaw', 10]],
          win: [['lise', 'Oh, that was lovely to watch. Your team moves like a flock.']],
          after: [['lise', 'I\'ve counted forty-one Glimmerwings this week. One of them keeps following Wren around.']] },
        lines: [['lise', 'Shh! You\'ll scare the birds. ...Well, now they\'re gone. You owe me a battle.']] }
    ],
    wardenDone: 'The gate is yours, {name}. The coast is waiting.' },
  saltmarsh: { name: 'Saltmarsh Coast', biome: 'saltmarsh', start: [13, 12, 'up'], warden: [16, 4],
    rows: [
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~______~~~~~~~~~~~~~~~~',
      '~~~~~______________~~~~~~~~~~~',
      '______________________________',
      '_""""__RR____..___""""""__RR__',
      '""""""_______..__"""""""""____',
      '""""""",,,,,,..,,"""""""",,,TT',
      '"""""",,,,,,,................E',
      '""""",,,RR,,,................E',
      'T""""",,,,,,,..,,""""""",,,TTT',
      'TT"""",,,,,,P..,,,""""",,TTTTT',
      'TTTTTTTTTTTTT..TTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTSSTTTTTTTTTTTTTTT'
    ],
    exits: { S: { to: 'thornwood', x: 13, y: 1, dir: 'down' },
      E: { to: 'emberfall', x: 1, y: 8, dir: 'right', locked: 'The cliff path up to the highlands is roped off. A sign reads: "Tide Badge holders only. By order of Warden Nerys."' } },
    npcs: [
      { who: 'tobin', at: [6, 3], dir: 'down',
        lines: [['tobin', 'Forty years I\'ve fished this coast. Seen the tide go out further than it should, once. Didn\'t much like what walked out of it.'],
          ['tobin', 'Reeds hide the wild ones. Walk through slow and they\'ll come and have a look at you.'],
          ['tobin', 'And before you ask: no, the sea has not "got bluer lately". Sea\'s always been this color. Always.']] },
      { who: 'cato', at: [16, 7], dir: 'left',
        trainer: { sight: 3, team: [['kiteskirl', 14], ['reedtusk', 15]],
          win: [['cato', 'Washed up, just like everything else on this beach. Good battle, though.']],
          after: [['cato', 'Found a shell yesterday that hums when the tide comes in. Old Tobin told me to put it back.']] },
        lines: [['cato', 'A new tamer on my beach? The tide brought you in, so let\'s see what you\'re made of.']] },
      { who: 'marit', at: [22, 9], dir: 'up',
        trainer: { sight: 1, team: [['wrackjaw', 17], ['dunepounce', 18], ['brineskit', 18]],
          win: [['marit', 'You\'re fast. Faster than me, and I run the lighthouse stairs twice a day.']],
          after: [['marit', 'Warden Nerys says the flats change every six hours. I time my runs by them.']] },
        lines: [['marit', 'Out of the way, I\'m on a run! ...Actually, no. A battle first. Then the run.']] }
    ],
    signs: { '12,11': 'Saltmarsh Coast. East: the cliff road to the Emberfall Highlands.' },
    items: [{ id: 'sm1', at: [2, 4], give: { lures: 3 } }, { id: 'sm2', at: [27, 6], give: { fish: 5 } }, { id: 'sm3', at: [10, 11], give: { coins: 120 } }],
    wardenDone: 'The flats will still be here when the tide turns, {name}. So will I.' },
  emberfall: { name: 'Emberfall Highlands', biome: 'emberfall', start: [1, 8, 'right'], warden: [20, 6],
    rows: [
      'RRRRRRRRRRRRRNNRRRRRRRRRRRRRRR',
      'RRRRRRRR""""R..RRRRRR""""RRRRR',
      'RRRR"""""""",,,RRRR,,""""""RRR',
      'RR""""""""",,,,,,,,,,""""""""R',
      'R""""",,oo,,,,RR,,,,,,""""""RR',
      'R"""",,ooo,,,,RR,,,,,,,,""""RR',
      'R,,,,,,,,,,,,,,,,,,,,,,,,,,,RR',
      'R,P""""",,,,,,,,,""""""",,,,RR',
      'W.........................,,RR',
      'W.........................,,RR',
      'R,,""""""",,,,RR,,,"""""",,RRR',
      'RR,""""""""",,,RR,,""""""",RRR',
      'RRRR""""""RRRRRRRRR""""RRRRRRR',
      'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR'
    ],
    exits: { W: { to: 'saltmarsh', x: 28, y: 8, dir: 'left' },
      N: { to: 'cloudglass', x: 13, y: 12, dir: 'up', locked: 'A rope bars the high path into the cloud. A tag on it reads: "Ember Badge holders only. The pass is no place to learn patience. Toren."' } },
    signs: { '2,7': 'Emberfall Highlands. Mind the springs: they\'re warmer than they look.' },
    items: [{ id: 'ef1', at: [12, 3], give: { meat: 5 } }, { id: 'ef2', at: [27, 6], give: { lures: 5 } }, { id: 'ef3', at: [26, 11], give: { coins: 250 } }],
    npcs: [
      { who: 'orsk', at: [10, 7], dir: 'down',
        trainer: { sight: 1, team: [['emberling', 24], ['ventwhisk', 25]],
          win: [['orsk', 'Good. Good! My legs are tired anyway. I\'ll blame them.']],
          after: [['orsk', 'From the top of the ridge you can see all the way back to Larkhaven. Tiny little windmill.']] },
        lines: [['orsk', 'The ridge path is narrow, friend. Only one of us gets to keep walking. Battle for it?']] },
      { who: 'sela', at: [17, 10], dir: 'up',
        trainer: { sight: 1, team: [['screegrin', 27], ['thermwing', 28], ['kilntusk', 29]],
          win: [['sela', 'Warm work. Your team deserves a soak in the springs after that.']],
          after: [['sela', 'Toren sits by the springs every morning. He says he\'s thinking. I think he\'s napping.']] },
        lines: [['sela', 'Visitors to the springs have to earn their soak. Show me your team!']] }
    ],
    wardenDone: 'You\'ve earned your badge here, {name}. The mountain will remember your team.' },
  cloudglass: { name: 'Cloudglass Pass', biome: 'cloudglass', edge: 'R', start: [13, 12, 'up'], warden: [14, 2],
    rows: [
      'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
      'RRR""""RRRRR,,,,,,RRRR"""""RRR',
      'RR""""""",,,,,,,,,,,,""""""""R',
      'R""""",,,,,,,,,,,,,,,,,""""RRR',
      'R"",,,RR,,,,,..,,,,,RR,,""",RR',
      'RR,,RRR,"""",..,"""",RRR,,,,RR',
      'R"""",,,"""""..""""",,,,,"""RR',
      'R"""",RR,,,,,..,,,,,RR,"""""RR',
      'RR,,,,,,,,,,,..,,,,,,,,,,,,,EE',
      'R""""""",,RR,..,RR,,""""""",RR',
      'RR"""""",,,,P..,,,,,""""""RRRR',
      'RRR""""",,,,,..,,,,,"""""RRRRR',
      'RRRRRRRRRRRRR..RRRRRRRRRRRRRRR',
      'RRRRRRRRRRRRRSSRRRRRRRRRRRRRRR'
    ],
    exits: { S: { to: 'emberfall', x: 13, y: 1, dir: 'down' },
      E: { to: 'stillreed', x: 1, y: 8, dir: 'right', locked: 'The basin ferry path waits for the Beacon Badge. Vessa asks every team to learn the pass before descending.' } },
    signs: { '12,10': 'Cloudglass Pass. South: Emberfall. Up top: Warden Vessa\'s shelter. If the cloud comes down, stop and shout.' },
    items: [{ id: 'cg1', at: [2, 8], give: { coins: 300 } }, { id: 'cg2', at: [27, 8], give: { lures: 5 } }, { id: 'cg3', at: [3, 2], give: { berries: 6 } }],
    npcs: [
      { who: 'ilka', at: [8, 8], dir: 'right',
        trainer: { sight: 5, team: [['fogtail', 34], ['pallweaver', 35]],
          win: [['ilka', 'Good knots, your team. You tie yourselves together without even trying.']],
          after: [['ilka', 'Every rope on this pass, I\'ve mended at least twice. Vessa says that makes me the pass\'s grandmother. I\'m thirty-one.']] },
        lines: [['ilka', 'Mind the rope! ...You didn\'t trip on it. Fine. Then you can battle me instead.']] },
      { who: 'teodor', at: [15, 5], dir: 'left',
        trainer: { sight: 2, team: [['gritbeak', 38], ['cirrusmane', 39], ['shalecat', 40]],
          win: [['teodor', 'The cloud is lifting. That usually happens right after I lose.']],
          after: [['teodor', 'I count the clouds every morning. Yesterday, four hundred and twelve. Vessa says I made that up. I did not.']] },
        lines: [['teodor', 'Stand still. You\'re in my view of the cloud. ...Well, now that you\'re here, a battle.']] }
    ],
    wardenDone: 'The cloud always lifts in the end, {name}. Bring a friend next time anyway.' },
  stillreed: { name: 'Stillreed Basin', biome: 'stillreed', start: [1, 8, 'right'], warden: [23, 9],
    rows: [
      "TTTTTTTTTTTT~~~TTTTTTTTTTTTTTT",
      "T,,,,,,,,,,\"~~~\",,,,,,,,,,,,,T",
      "T,\"\"\"\"\",,,,\"~~~\",,,T,T,T,T,,,T",
      "T,\"\"\"\"\",,,,\"~~~\",,,T,T,T,T,,,T",
      "T,,,........bbb.............,T",
      "T,\"\"\"\"\",,,,\"~~~\",,,,,,,,\"\"\"\",T",
      "T,\"\"\"\"\",,,,\"~~~\",,,,,,,,\"\"\"\",T",
      "T,,,,,,,,,,\"qj~\",,,,,,,,\"\"\"\",T",
      "W..P.......bbb~\",,,,,,,,,,,,,T",
      "T,,,........bbb..............E",
      "T,\"\"\"\"\",,,,\"~~~\",,,,,,,,,,,,,T",
      "T,\"\"\"\"\",,,,\"~~~\",,,,,,,,,,,,,T",
      "T,,,,,,,,,,\"~~~\",,,,,,,,,,,,,T",
      "TTTTTTTTTTTT~~~TTTTTTTTTTTTTTT"
    ],
    exits: { W: { to: 'cloudglass', x: 27, y: 8, dir: 'left' }, E: { to: 'hollowecho', x: 1, y: 9, dir: 'right', locked: 'The hill survey trail requires the Reed Badge. Leave the basin crossing safe before exploring the caverns.' } },
    signs: { '12,7': 'Stillreed ferry landing. Walk onto the boards below. The skiff is tied up while the rope is mended; leave the end of the landing clear for small creatures.', '3,8': 'Stillreed Basin. West: Cloudglass Pass. Leave the ferry landing open for small creatures; orchard paths cross the channels on raised boards.' },
    items: [{ id: 'sr1', at: [4, 3], give: { fish: 6 } }, { id: 'sr2', at: [24, 6], give: { lures: 6 } }, { id: 'sr3', at: [27, 11], give: { berries: 8 } }],
    npcs: [
      { who: 'evren', at: [8, 5], dir: 'right',
        trainer: { sight: 3, team: [['orchardroot', 48], ['gustreed', 49]],
          win: [['evren', 'Lovely footing. Not one fallen apple squashed! Both teams have earned a rest.']],
          after: [['evren', 'Orchardroot turns the fallen fruit into good soil. We leave some for the herd before we fill our baskets.']] },
        lines: [['evren', 'Welcome to the orchard path. A friendly battle while the ferry comes back? We can keep the landing clear.']] },
      { who: 'tavil', at: [21, 10], dir: 'up',
        trainer: { sight: 2, team: [['rillwhisk', 52], ['duskcord', 53], ['ferrycrest', 54]],
          win: [['tavil', 'Well held. Your partners gave each other room, like a good knot that still opens.']],
          after: [['tavil', 'Wren and a new tamer freed a ferry rope today. The passengers thanked them; the rope had no comment.']] },
        lines: [['tavil', 'The boards are dry enough for a battle. Shall we? I promise the losing team still gets a ferry ride.']] }
    ],
    wardenDone: 'The landing stays open, {name}. Keep winning with room for your neighbors.' },
  hollowecho: {
  name: 'Hollowecho Hills',
  biome: 'hollowecho',
  edge: 'R',
  start: [ 1, 9, 'right' ],
  warden: [ 23, 4 ],
  rows: [
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    'R,rrrrr,,,RRRRR,",,,RRRRRRR,,R',
    'R,rrrrr,,,RRRRR""",,RRRRRRR,,R',
    'R,##_##,",RRRRR"""",RR___RR,,R',
    'R,_____""",RRR,""",,,R___R,,,R',
    'R,__.__P""",,,,,",,,........,R',
    'R,,,.,,""",,,,,......,,,,"".,R',
    'R,,,............,,,,,,,,"""."R',
    'R,,",.,,RRRRR,,",,R_RR,,,"".,R',
    'W.....,,RRRRR,""",R__R,,,,"..E',
    'R"""""",RRRRR"""""R__R,,RRR,,R',
    'R""""",,,RRR,,""",RRRR,,RRR,,R',
    'R,,",,,,,,,,,,,",,,,,,,,,,,,,R',
    'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR'
  ],
  exits: { W: { to: 'stillreed', x: 28, y: 9, dir: 'left' }, E: { to: 'sunthread', x: 1, y: 9, dir: 'right', locked: 'The gathering trail requires the Echo Badge. Listen to your partners before joining Sunthread Commons.' } },
  signs: {
    '7,5': 'Hollowecho Hills. West: Stillreed Basin. Ring the hamlet bell before dusk; answer a returning team before choosing your next passage.'
  },
  items: [
    { id: 'he1', at: [ 3, 5 ], give: { berries: 8 } },
    { id: 'he2', at: [ 19, 10 ], give: { lures: 6 } },
    { id: 'he3', at: [ 27, 8 ], give: { coins: 500 } }
  ],
  npcs: [
    {
      who: 'veslin',
      at: [ 6, 6 ],
      dir: 'down',
      trainer: {
        sight: 1,
        team: [ [ 'bellmote', 58 ], [ 'umbrelace', 59 ] ],
        win: [ [ 'veslin', 'Good listening! The bell can wait while both teams catch their breath.' ] ],
        after: [
          [ 'veslin', 'One ring means a team is home. We always answer, even if supper is getting cold.' ]
        ]
      },
      lines: [
        [
          'veslin',
          'Welcome back to daylight. A friendly battle beside the bell? Nobody has to find the dark trail alone.'
        ]
      ]
    },
    {
      who: 'narro',
      at: [ 16, 6 ],
      dir: 'down',
      trainer: {
        sight: 1,
        team: [ [ 'dripdart', 60 ], [ 'flintroot', 61 ], [ 'hushmane', 62 ] ],
        win: [
          [
            'narro',
            'A fine change of plan. My partners heard yours coming and still could not quite keep up.'
          ]
        ],
        after: [
          [
            'narro',
            'The bright mouth has loose footing. My Dripdart showed me the familiar passage; I changed the map.'
          ]
        ]
      },
      lines: [
        [
          'narro',
          'I have put the measuring cord away. Shall we see what our partners make of a battle on level ground?'
        ]
      ]
    }
  ],
  wardenDone: 'Keep listening, {name}. A careful return matters more than a perfect map.'
},
  sunthread: {
  "name": "Sunthread Commons",
  "biome": "sunthread",
  "start": [
    1,
    9,
    "right"
  ],
  "warden": [
    24,
    5
  ],
  "rows": [
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
    "T,,,,,,,,,,,,,,,,,,rrrrrrrr,,T",
    "T,,\"\"\"\",f,T,,\"\"\",,,rrrrrrrr,,T",
    "T,\"\"\"\"\"f,TT,\"\"\"\"\",,########,,T",
    "T,\"\"\"\"\",,f,f,\"\"\"\"\"_________P,T",
    "T,,\"\"\",,,,,,,,\"\"\"P__________,T",
    "T,,,,,.......,,,,,,.........,T",
    "T,,,,,.,,,,,.,,,,,,.,,,,,,,f,T",
    "T,,,,,.,,,,,.....f..,,,,,T,,,T",
    "W......,,,,,,,,,,,f,f,T,T,,,,E",
    "T,,\"\"\"\"\"===,,,,,,,,,,\"\"\"\"\"\"T,T",
    "T,\"\"\"\"\"\",,,,,,====,,\"\"\"\"\"\"\",,T",
    "T,,,\"\"\",,,,,,,,,,,,,,,\"\"\"\",,,T",
    "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
  ],
  "exits": {
    "E": { "to": "farwatch", "x": 1, "y": 9, "dir": "right", "locked": "The coastal road requires the Loom Badge. Make room for every partner before Farwatch Reach." },
    "W": {
      "to": "hollowecho",
      "x": 28,
      "y": 9,
      "dir": "left"
    }
  },
  "signs": {
    "17,5": "Sunthread Commons. West: Hollowecho Hills. Follow the winding meadow path to the gathering; leave the nursery beds and resting partners room.",
    "27,4": "The meeting hall welcomes every team. When the wind rises, bring loose shelter ties here and let the youngest creatures rest."
  },
  "items": [
    {
      "id": "st1",
      "at": [
        3,
        4
      ],
      "give": {
        "grain": 8
      }
    },
    {
      "id": "st2",
      "at": [
        14,
        10
      ],
      "give": {
        "lures": 6
      }
    },
    {
      "id": "st3",
      "at": [
        26,
        11
      ],
      "give": {
        "berries": 8
      }
    }
  ],
  "npcs": [
    {
      "who": "mirel",
      "at": [
        8,
        6
      ],
      "dir": "down",
      "trainer": {
        "sight": 2,
        "team": [
          [
            "clovercolt",
            64
          ],
          [
            "hemglow",
            65
          ]
        ],
        "win": [
          [
            "mirel",
            "Beautifully shared. My little Hemglow still has enough light to guide the late arrivals."
          ]
        ],
        "after": [
          [
            "mirel",
            "We mend one tie at a time. Clovercolt holds the cord; Hemglow shows me where it has frayed."
          ]
        ]
      },
      "lines": [
        [
          "mirel",
          "A friendly battle while the next shelter dries? Every partner gets a useful turn."
        ]
      ]
    },
    {
      "who": "aldren",
      "at": [
        19,
        7
      ],
      "dir": "left",
      "trainer": {
        "sight": 2,
        "team": [
          [
            "pennantlark",
            65
          ],
          [
            "blazefang",
            66
          ],
          [
            "ribbonstride",
            67
          ]
        ],
        "win": [
          [
            "aldren",
            "Well played! A quick runner and a steady helper can both carry a team."
          ]
        ],
        "after": [
          [
            "aldren",
            "Ribbonstride collects loose ribbons after the gusts. Blazefang dries them under the bench. I mostly untangle them."
          ]
        ]
      },
      "lines": [
        [
          "aldren",
          "The hall is nearly ready. Shall our teams try a battle before we carry the last benches over?"
        ]
      ]
    },
    {
      "who": "pell",
      "at": [
        21,
        4
      ],
      "dir": "down",
      "lines": [
        [
          "pell",
          "Just passing through! I have sold a lantern to every hero who ever needed one. Brisket says that cannot possibly be true."
        ],
        [
          "pell",
          "Today I am keeping the shelter ties in one place. Brisket has found the shade. A gathering runs better when everyone knows their job."
        ]
      ]
    }
  ],
  "wardenDone": "There is a place for your whole team here, {name}. Remember the names of those who helped you."
},
  farwatch: {
  "name": "Farwatch Reach",
  "biome": "farwatch",
  "start": [
    1,
    9,
    "right"
  ],
  "warden": [
    20,
    3
  ],
  "rows": [
    "RRRRRRRRRRRRNRRRRRRRRRRR~~~~~~",
    "R,,,,,,rrrr,,,,,\"\"\",,,RR~~~~~~",
    "R,,\"\"\",rrrr,,,,\"\"\"\",,,RR~~~~~~",
    "R,\"\"\"\",####,,,,,,,______~~~~~~",
    "R,\"\"\"\"f,,,,R,,,.......__~~~~~~",
    "R,\"\"\",,,,,,R,,P.,,___.__~~~~~~",
    "R,,,,,..........,,,,,.,,~~~~~~",
    "R,,,f,.,,,,,,,,,R,___.__~~~~~~",
    "R,,,,,.,,,,\"\"\",,R,___._P~~~~~~",
    "W......,,.............__....~~",
    "R,,,rrrrr.\"\"\"\",,,,______....~~",
    "R,,,#####.\"\"\",,,,,______~~~~~~",
    "R,,T,,,,,.,,f,,,T,______~~~~~~",
    "RRRRRRRRRRRRRRRRRRRRRRRR~~~~~~"
  ],
  "exits": {
    "N": { "to": "league", "x": 3, "y": 16, "dir": "up", "locked": "The league requires all eight badges. Every road has something to teach your team." },
    "W": {
      "to": "sunthread",
      "x": 28,
      "y": 9,
      "dir": "left"
    }
  },
  "signs": {
    "14,5": "Farwatch Reach. West: Sunthread Commons. Follow the bluff path to the harbor. Lookout records are checked each tide; a crossed-out note is better than a hidden mistake.",
    "23,8": "Returning teams: answer the shore lantern before approaching. Rest on the harbor bench; distant islands are not a marked route."
  },
  "items": [
    {
      "id": "fw1",
      "at": [
        3,
        4
      ],
      "give": {
        "lures": 8
      }
    },
    {
      "id": "fw2",
      "at": [
        12,
        10
      ],
      "give": {
        "fish": 8
      }
    },
    {
      "id": "fw3",
      "at": [
        26,
        10
      ],
      "give": {
        "berries": 8
      }
    }
  ],
  "npcs": [
    {
      "who": "delka",
      "at": [
        9,
        6
      ],
      "dir": "down",
      "lines": [
        [
          "delka",
          "A friendly battle? Chartwing checks the wind, and Moorweft checks the footing. I try to check both."
        ]
      ],
      "trainer": {
        "sight": 2,
        "team": [
          [
            "chartwing",
            68
          ],
          [
            "moorweft",
            69
          ]
        ],
        "win": [
          [
            "delka",
            "That was useful practice. I will mark where my plan changed, so the next team can learn from it."
          ]
        ],
        "after": [
          [
            "delka",
            "The lookout ledger has a space for corrections. Filling it in is part of the job."
          ]
        ]
      }
    },
    {
      "who": "sivren",
      "at": [
        20,
        8
      ],
      "dir": "left",
      "lines": [
        [
          "sivren",
          "We have a clear patch beside the harbor. Shall we practice before the fog comes back?"
        ]
      ],
      "trainer": {
        "sight": 2,
        "team": [
          [
            "keeljaw",
            69
          ],
          [
            "buoyglint",
            70
          ],
          [
            "shoalpup",
            70
          ]
        ],
        "win": [
          [
            "sivren",
            "Well played! Every partner is counted, every plank is back on shore. A good finish."
          ]
        ],
        "after": [
          [
            "sivren",
            "Some teams are heading toward the league. We keep a dry bench for them and a lantern for the ones returning."
          ]
        ]
      }
    }
  ],
  "wardenDone": "Eight badges, {name}. Take time to rest before the league, and leave clear notes for the teams behind you."
},
  league: {
  "name": "Returning Light League",
  "league": true,
  "pal": "cloudglass",
  "edge": "R",
  "start": [
    3,
    16,
    "up"
  ],
  "rows": [
    "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
    "R~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~R",
    "R~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~R",
    "R,,,,rrrrr,,rrrrr,,rrrrr,,rrrrr,,rrrrr,R",
    "R,,,,#####,,#####,,#####,,#####,,#####,R",
    "R,,,,_____,,_____,,_____,,_____,,_____,R",
    "R,,,,_____,,_____,,_____,,_____,,_____,R",
    "R,,,,f_._f,,f_._f,,f_._f,,f_._f,,f_._f,R",
    "R,,..................................,,R",
    "R,,..................................,,R",
    "R,,..................................,,R",
    "R,,.,,,P,,,,,,P,,,,,,P,,,,,,P,,,,,,P,,,R",
    "R,,.,,,,,,,,f,,,,,,,,,,,,,,f,,,,,,,,,,,R",
    "R,,.,,,,~~~~~~~,,,,,,,,~~~~~~~~,,,,,,,,R",
    "R,,.,,,,~~~~~~~,,,,,,,,~~~~~~~~,,,,,,,,R",
    "W...,====,,,,,,,,,,,,,,,,,,,,,,,,====,,R",
    "R,,.,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,R",
    "RRRSRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR"
  ],
  "exits": {
    "W": { "to": "spire", "x": 17, "y": 14, "dir": "left", "locked": "The Spire opens after the Champion ending. Take your team home in the story first." },
    "S": {
      "to": "farwatch",
      "x": 12,
      "y": 1,
      "dir": "down"
    }
  },
  "signs": {
    "7,11": "Listening court: listen while the plan changes.",
    "14,11": "Shelter court: strength leaves somewhere safe to rest.",
    "21,11": "Shared-work court: every partner has a part.",
    "28,11": "Honest-record court: corrections belong where others can see them.",
    "35,11": "Champion terrace: bring the whole journey with you."
  },
  "npcs": [
    {
      "who": "wren",
      "at": [
        3,
        12
      ],
      "dir": "down",
      "league": "wren"
    },
    {
      "who": "nelva",
      "at": [
        4,
        15
      ],
      "dir": "left",
      "league": "keeper"
    },
    {
      "who": "edrin",
      "at": [
        7,
        6
      ],
      "dir": "down",
      "league": 0
    },
    {
      "who": "maela",
      "at": [
        14,
        6
      ],
      "dir": "down",
      "league": 1
    },
    {
      "who": "corven",
      "at": [
        21,
        6
      ],
      "dir": "down",
      "league": 2
    },
    {
      "who": "liora",
      "at": [
        28,
        6
      ],
      "dir": "down",
      "league": 3
    },
    {
      "who": "avenne",
      "at": [
        35,
        6
      ],
      "dir": "down",
      "league": 4
    }
  ]
},
  spire: {
  "name": "The Lighthouse Spire",
  "tower": true,
  "pal": "farwatch",
  "start": [
    9,
    14,
    "up"
  ],
  "rows": [
    "RRRRRRRRRRRRRRRRRRR",
    "R~~~~~~~~~~~~~~~~~R",
    "R~~,,,rrrrrrr,,,~~R",
    "R~~,,,#######,,,~~R",
    "R~~,,,_______,,,~~R",
    "R~~,,,_______,,,~~R",
    "R~~,,,__f_f__,,,~~R",
    "R~~,,,.......,,,~~R",
    "R~~,,,.......,,,~~R",
    "R~~,,,.......,,,~~R",
    "R~~,,,,,...,,,,,~~R",
    "R~~,,,,P...P,,,,~~R",
    "R~~,,,,,...,,,,,~~R",
    "R~~,====...====,~~R",
    "R~~,..............E",
    "R~~,,,,,...,,,,,~~R",
    "R~~~~~~~~~~~~~~~~~R",
    "RRRRRRRRRRRRRRRRRRR"
  ],
  "exits": {
    "E": {
      "to": "league",
      "x": 1,
      "y": 15,
      "dir": "right"
    }
  },
  "signs": {
    "7,11": "The Lighthouse Spire. Champions climb together; every fifth floor has a healing bench.",
    "11,11": "Leave with what you earned. Milestone gifts are yours once; the Journal remembers your best floor."
  },
  "npcs": []
}
};

/* T40: plain content, exported with MAPS. byHeritage is a Godot handoff, keyed to its existing
   farm/coast/highland/wander IDs. Classic has no heritage selector; all base clues work without it. */
MAPS.stillreed.signs['12,7'] += ' An older tally cut into the post reads: LOW WATER / KEEP BOTH SIDE BY SIDE. Two worn prints meet beneath it.';
MAPS.hollowecho.signs['7,5'] += ' Below the present route, an older carving shows steps rising where the wall is flat. Nobody has scratched them out.';
MAPS.sunthread.signs['27,4'] += ' Four old shelter ties share one knot, although their loose ends are braided differently. Please mend around it, not through it.';
MAPS.farwatch.signs['14,5'] += ' The oldest copied account stops after: TWO FIGURES / ONE SHADOW. The space below is left empty; its missing lines have not been guessed.';
MAPS.stillreed.npcs.push({who:'sivet',at:[10,6],dir:'up',
 lines:[
  ['sivet','Someone keeps taking the short blue rope from my post. Nothing else goes missing. An Unbound visitor said I should stop tying creatures to boats. I do not.'],
  ['sivet','My grandmother said the old pair came up from the low water. My grandfather said they ran down to it. Same night, different ends of the landing.'],
  ['sivet','Olan keeps the old tally because nobody knows what it counted. A crossing? A rescue? I would like an answer, not a prettier guess.']],
 byBadge:{reed:[
  ['sivet','Found the blue rope. A Rillwhisk had lined its nest with it, well above the flood. I put spare lengths beside the post. The nest can stay.'],
  ['sivet','That explains my missing rope, not the old prints. Whatever came over this landing, Stillwake keeps room for the young ones now.']]},
 byHeritage:{
  farm:[['sivet','Farmfolk, are you? Your harvest knot holds like ours. Gran called hers a shore knot. Perhaps we borrowed the same hands.']],
  coast:[['sivet','Coastfolk! You will know the low-water verse. Mine says stand beside, not bind tight. I wonder when those words parted.']],
  highland:[['sivet','A Highlander taught Granddad to loop this rope twice. He said a mountain watcher needed two hands. Granddad only needed a ferry.']],
  wander:[['sivet','A Wanderer never knots the loose end beyond untying. I like that. So does the Rillwhisk, though it has not returned my rope.']]}
});
MAPS.hollowecho.npcs.push({who:'orri',at:[5,5],dir:'right',
 lines:[
  ['orri','We ring twice. Something rings a third time behind that wall. People call it the watcher. I mend bells, not stories.'],
  ['orri','There is a rubbing in my tool roll: two hands around one small paw. It has the same split-loop border as Sivet\'s ferry tally.'],
  ['orri','Senna found warmth in a cold stone pocket. She would not call it a footprint, and neither will I. Something sleeping and something keeping watch could leave the same warmth.']],
 byBadge:{echo:[
  ['orri','The third ring was a loose bell tongue in a runoff crack. A Dripdart tapped it when the water rose. I fixed it; the youngster found a quieter pool.'],
  ['orri','The warm pocket is farther in. A bell mended is not a mountain explained.']]},
 byHeritage:{
  farm:[['orri','You call that border a harvest loop? My family used it on a warning bell. Perhaps a warning and a welcome once hung from the same cord.']],
  coast:[['orri','You know a paw between two hands from your shore songs? Here the verse says stone instead of sea. Bring your words; I will keep both copies.']],
  highland:[['orri','A Highlander will know why I will not call the watcher cruel. My grandmother sang that it stayed. Yours may have sung that it slept.']],
  wander:[['orri','A Wanderer once said the rubbing shows a single creature, not two people. Could be. The stone has room for either reading.']]}
});
MAPS.sunthread.npcs.push({who:'nesla',at:[22,5],dir:'left',
 lines:[
  ['nesla','The green ribbons vanished from the nursery this morning. Someone blamed the Unbound. Somebody always knows the culprit before finding the ribbon.'],
  ['nesla','An Unbound visitor left this copy: When two became one, the land went pale. So let every creature go. Those are their words. A short account makes a long command.'],
  ['nesla','Our four old ties have different braids but the same knot. The coast says a wave took the colour; my aunt says hungry fields. Both families kept this cloth.']],
 byBadge:{loom:[
  ['nesla','Ribbonstride had gathered the green ribbons under the nursery bench, out of the gusts. I marked a basket for loose ties. No villain, just a helper with no instructions.'],
  ['nesla','The Unbound visitor helped move a shelter, then left before the badges came out. I can thank those hands without agreeing with that copied page.']]},
 byHeritage:{
  farm:[['nesla','Farmfolk know the hungry-fields verse. Your last line says the land will remember. Mine says the hands will remember. I have kept both.']],
  coast:[['nesla','Coastfolk call this braid a wave edge. We call it a furrow. Fold the cloth and they meet in the middle.']],
  highland:[['nesla','The Highland tie faces the mountain. It was not cut away when someone blamed the watcher. A gathering keeps a place even for a disputed tale.']],
  wander:[['nesla','A Wanderer might hear care in that Unbound page. I do too. But leave room for the youngster that chose to stay; it knows something the page cannot.']]}
});
MAPS.farwatch.npcs.push({who:'ceryn',at:[18,3],dir:'down',
 lines:[
  ['ceryn','A light circles the empty west mooring every dusk. Some say Watchlight is waiting for the lost pair. I have started counting boats before telling that story.'],
  ['ceryn','The copied account says one shadow and then nothing. The witness stood behind it. A flash could hide a rescue as easily as a blow.'],
  ['ceryn','The inn has an old painted inlet with a lower shore beneath this one. The paint is unbroken. The coast may have changed; or something more than colour went missing.']],
 byBadge:{horizon:[
  ['ceryn','Counted the circling light. Watchlight was guiding a Keeljaw with a torn mooring cloth caught on its back. We freed the cloth. The empty mooring is quiet again.'],
  ['ceryn','A small waiting answered. The lost pair is still a question. I filed both notes, on different pages.']]},
 byHeritage:{
  farm:[['ceryn','Your harvest tale names the morning after. The shore account ends at the flash. Perhaps both families wrote only what their own window showed.']],
  coast:[['ceryn','Coastfolk will notice the old inlet verse uses the same split-loop mark as the ferry tally. It might mark the reader, rather than the sea.']],
  highland:[['ceryn','Your mountain verse begins while our shore verse ends. Do not throw either away because the clocks disagree; the witnesses may have been looking in different directions.']],
  wander:[['ceryn','A Wanderer gave me a copy of the one-shadow account and asked me to leave its last page blank. Another wrote a conclusion there. I kept the blank one too.']]}
});
/* T45: every existing early-road person has a perspective for all four origins.
   Classic retains its base conversation; Godot appends these exported reactions. */
for (const area of ['larkhaven','thornwood','saltmarsh','emberfall','cloudglass']) {
 for (const npc of MAPS[area].npcs) npc.byHeritage=Object.fromEntries(['farm','coast','highland','wander'].map((h,i)=>[h,[[npc.who,EARLY_HERITAGE_LINES[npc.who][i]]]]));
}

/* WS3/T50: plain seasonal content for the existing Godot export; no Classic dispatcher.
   Small signed shifts between common neighbors, then four favored visitors (always available).
   Each table is copied, so no BIOMES wild entry, prerequisite, level or reward is mutated. */
const SEASONAL_SHIFTS = {
 thornwood: {spring:{glimmerwing:2,emberling:-2},summer:{emberling:2,duskweaver:-2},autumn:{gnawhound:2,glimmerwing:-2},winter:{duskweaver:2,bogsnap:-2}},
 saltmarsh: {spring:{reedtusk:2,dunepounce:-2},summer:{kiteskirl:2,wrackjaw:-2},autumn:{wrackjaw:2,kiteskirl:-2},winter:{brineskit:2,reedtusk:-2}},
 emberfall: {spring:{slaglet:-2},summer:{thermwing:2,cragskein:-2},autumn:{cragskein:2},winter:{ventwhisk:2,thermwing:-2}},
 cloudglass: {spring:{mistfinch:2,shalecat:-2},summer:{cirrusmane:2,pallweaver:-2},autumn:{gritbeak:2,mistfinch:-2},winter:{fogtail:2,cirrusmane:-2}},
 stillreed: {spring:{reedlet:2,duskcord:-2},summer:{gustreed:2,siltjaw:-2},autumn:{orchardroot:2,gustreed:-2},winter:{rillwhisk:2,reedlet:-2}},
 hollowecho: {spring:{dripdart:2,flintroot:-2},summer:{ledgewhisk:2,hushpup:-2},autumn:{flintroot:2,dripdart:-2},winter:{umbrelace:2,ledgewhisk:-2}},
 sunthread: {spring:{clovercolt:2},summer:{pennantlark:2,hemglow:-2},autumn:{tilthtusk:2,pennantlark:-2},winter:{ribbonstride:-2}},
 farwatch: {spring:{shoalpup:2,moorweft:-2},summer:{chartwing:2,inkwhisk:-2},autumn:{moorweft:2,chartwing:-2},winter:{buoyglint:2,shoalpup:-2}}
};
for (const [area,shifts] of Object.entries(SEASONAL_SHIFTS)) {
 MAPS[area].seasonal = {};
 for (const [season,delta] of Object.entries(shifts)) MAPS[area].seasonal[season] = {
  wild: BIOMES[area].wild.map(([id,weight]) => {
   const visitor = SPECIES[id].seasonal;
   return [id,visitor && visitor.areas.includes(area) ? (visitor.favoredSeason === season ? visitor.inSeasonWeight : visitor.outOfSeasonWeight) : weight + (delta[id] || 0)];
  })
 };
}
/* Shared dialogue first; append one selected seasonal observation. Seasonal lines are never clue replacements. */
const SEASONAL_VOICES = {
 maren: [
  'The new shoots are easy to tread on. Walk beside your partner and leave the little ones a clear patch.',
  'There is shade beside the barn. Let your partner choose a cool place before you set off again.',
  'I keep a dry basket by the door for fallen leaves. Someone small has decided it is a bed.',
  'I am knitting a cover for the smallest partner. Leave room for its ears; that is the important bit.'
 ],
 pip: [
  'My partner spotted the first flower before I did. I still get to be Champion, though.',
  'I made a shade tent! Mum says it is a towel over two chairs. My partner likes it.',
  'I picked the biggest leaf for my partner. It picked the smallest one for me. Fair trade.',
  'I made tiny tracks beside the big tracks. Now everyone knows we came together.'
 ],
 bram: [
  'New mushrooms hide under old leaves. My partner finds them; I remember where not to step.',
  'The mushrooms keep to the shade. So do I, until a friendly battle warms us up.',
  'A whole basket of leaves, and one mushroom. My partner insists that is a successful morning.',
  'Leave the old log alone. Something little has tucked itself beneath it for the cold.'
 ],
 lise: [
  'Hear the nestlings? Wait for their parents to come back before walking past that branch.',
  'The birds take their baths where the leaves drip. It is a much better idea than my dusty path.',
  'A bare branch makes a fine perch. It makes a poor hiding place for a birdwatcher.',
  'I leave the sheltered branches undisturbed. The birds know where the wind cannot reach.'
 ],
 tobin: [
  'Little fish in the shallows. Mind where you put your boots; this is their coast too.',
  'Best shade on the coast is under my hat. No, you cannot all borrow it at once.',
  'Reed seeds stick to the boat. I brush them off at the bank, where they can do some good.',
  'Cold hands, warm flask. Give your partner the dry seat; you can stand for a minute.'
 ],
 cato: [
  'New reeds mean more little hiding places. I let my partner look before I follow.',
  'Warm sand, clear sky. We practice above the tideline and cool our paws afterward.',
  'Loose reeds mark where the tide reached. Leave them there for the next team to see.',
  'The sheltered beach is calmer. No victory is worth sending a tired partner into cold spray.'
 ],
 marit: [
  'I run around the fresh reed beds, not through them. My partner keeps me honest.',
  'An early run, then shade. Being quick does not mean ignoring a thirsty partner.',
  'The wind keeps beating my best time. I have decided we are not racing it.',
  'Shorter runs today. We come home together, even if my partner wants to stop every few steps.'
 ],
 orsk: [
  'New growth beside warm stone. Even a ridge has room for something small.',
  'We practice before the rocks grow hot. A sensible start saves a sore paw.',
  'Loose grit gathers beneath the ledges. We check the footing before challenging anyone.',
  'The windward side is cold. Come round beside the warm stones before we talk.'
 ],
 sela: [
  'The spring path is damp. Shake your boots off before your partner settles for a rest.',
  'A warm spring is lovely, but shade and a drink come first after a long climb.',
  'I clear the leaves from the spring steps. A small kindness is worth doing twice.',
  'Steam hides the edge of the water. I stay close enough for my partner to find me.'
 ],
 ilka: [
  'Wet rope stretches. I check the knots before my partner takes the narrow way.',
  'Dry the rope in the sun, then put it in the shade. My partner thinks this is a very slow game.',
  'A bright ribbon marks the loose end. It saves us searching through the fallen leaves.',
  'Cold fingers make clumsy knots. We stop and warm them before trying again.'
 ],
 teodor: [
  'Rain leaves little pools on the stone. My partner studies the clouds in every one.',
  'A clear day stretches the view. I still ask my partner which way it would like to go.',
  'The clouds move faster than my drawing. I have left some room for corrections.',
  'I draw with gloves on. My partner has politely declined to judge the result.'
 ],
 evren: [
  'The orchard buds are opening. We walk around the roots and let them have their space.',
  'A cool bench beneath the orchard is worth more than another hurried lap.',
  'Windfall goes in the shared basket. Leave the sound fruit on the branch a little longer.',
  'The orchard is resting. We mend the baskets while the roots do their quiet work.'
 ],
 tavil: [
  'Spring rain leaves the boards slick. Let your partner choose its footing before you hurry.',
  'We leave a dry cloth at the landing. Everyone gets a place to sit after crossing.',
  'A leaf on the boards can hide a loose edge. I sweep first, then invite a battle.',
  'Cold hands need a longer rest between crossings. The next team can wait a little.'
 ],
 sivet: [
  'I hang the damp rope where the breeze can reach it. A tidy landing leaves room for everyone.',
  'The rope dries quickly today. I keep the spare coil in the shade beside the post.',
  'I shake the leaves out of the spare coil. They belong in the orchard, not in a knot.',
  'We cross with warm hands and steady partners. I will hold the boat while you settle.'
 ],
 veslin: [
  'A nest has appeared beneath the eaves. We ring gently until everyone has settled.',
  'The bell carries across the warm hills. Someone always waves before answering.',
  'The leaves are loud underfoot. I listen for the returning team before ringing supper in.',
  'We keep a warm place near the bell house. A late arrival should never find it empty.'
 ],
 narro: [
  'Rain changes the loose ground. I check my marks with my partner before using yesterday\'s route.',
  'Shade is welcome on the survey path. A good map leaves room for a rest.',
  'The cord catches fallen leaves. My partner finds this much funnier than I do.',
  'I keep the chalk dry inside my coat. The next team should still be able to read our marks.'
 ],
 orri: [
  'I leave a gap beside the bell rope for the nest builders. Repairs can wait until they pass.',
  'A cool tool roll and a dry bench. That is most of a good working day.',
  'Leaves in the tool roll again. I have given them their own pocket until I can sweep.',
  'Metal is cold on the fingers. Warm your hands first; the bell will still need mending afterward.'
 ],
 mirel: [
  'New shelter ties need loose ends for mending. Clovercolt holds them while I check the cloth.',
  'Hemglow can rest under the cloth too. A helper should get to enjoy the shade it makes.',
  'We fold the dry cloth before the wind returns. Everyone takes a corner they can manage.',
  'The shelter stays open on the calm side. A little partner needs a place out of the wind.'
 ],
 aldren: [
  'I carry the welcome list around the nursery beds. There is no hurry worth trampling a shoot.',
  'A message can wait while its runner drinks. I am learning to follow my own advice.',
  'I have a pocket full of leaves and one important note. The leaves are winning.',
  'I bring the last team in before putting the benches away. Nobody rests on a cold doorstep.'
 ],
 pell: [
  'Brisket found the first flower. I found the first puddle. We each have our talents.',
  'Finest shade in the Commons! Brisket discovered it, but I am happy to take the credit.',
  'A leaf fell into my hat. Brisket says it improves the arrangement. Difficult customer.',
  'I offered Brisket a blanket. He selected two. That mule has a fine head for business.'
 ],
 nesla: [
  'I mend around the new nursery shoots. A useful stitch leaves room for something to grow.',
  'A broad cloth makes shade for many small backs. It need not belong to the strongest one.',
  'We dry the gathering cloth before folding it. Next time, every team should find a clean corner.',
  'I sew the loose edge before the wind gets in. Someone small is waiting under the bench.'
 ],
 delka: [
  'Rain changes the approach. I check it again before copying a note for another team.',
  'Clear air is useful, but Chartwing still waits for the shore answer before returning.',
  'Wind-blown grit covers the old marks. We brush them clear before opening the lookout book.',
  'I keep the ledger beneath a dry cover. A wet page is a poor promise to the next traveler.'
 ],
 sivren: [
  'The harbor bench dries between showers. There is room for one more tired team.',
  'Keep a drink in the shade and a lantern ready. A bright day can still end in fog.',
  'We collect the loose planks before the wind rises. Smaller paws need the dry way home.',
  'A warm cloth waits on the harbor bench. Count everyone ashore before wrapping up yourself.'
 ],
 ceryn: [
  'I dry the lookout pages one at a time. The next reader deserves a clear record.',
  'The ledger stays beneath the shade cloth. Salt and strong sunlight are hard on old ink.',
  'I brush the leaves away before closing the book. A folded leaf is not a bookmark forever.',
  'Cold fingers write untidily. I leave more room between the lines and check them in the warm.'
 ]
};
for (const map of Object.values(MAPS)) for (const npc of map.npcs || []) if (SEASONAL_VOICES[npc.who] && npc.lines) {
 npc.bySeason = {};
 for (const [i,season] of ['spring','summer','autumn','winter'].entries()) npc.bySeason[season] = [[npc.who,SEASONAL_VOICES[npc.who][i]]];
}// WS6: exported festival writing; calendar dates and activity handling belong to Godot.
MAPS.larkhaven.festivals = {
 planting: {
  name:'Planting Day', season:'spring',
  tradition:'Neighbors swap seeds and tie bright scraps to their baskets. Each partner helps plant one flower at the ranch; its patch stays after the ribbons come down.',
  keepsake:{id:'planting_ribbon',name:'Seed Basket Ribbon',description:'A green ribbon with a little flower stitched into the end. A reminder of the patch you planted together.'},
  activity:{id:'plant_flower',name:'A Flower Together',
   invite:[['maren','Choose a flower for your ranch. Leave a little space beside it; your partner may have a different idea about where to sit.'],['pip','I picked the smallest seed. That does not mean it will be the smallest flower.']],
   complete:[['maren','There. A patch that belongs to both of you. When the ribbons come down, the flower stays.'],['pip','Here is a ribbon for your basket. Mine has soil on it already. That is how you know we helped.']]}
 },
 longlight: {
  name:'The Long Light', season:'summer',
  tradition:'Lanterns wait along the ranch path while the town shares the long evening. Partners run a friendly race, then everyone rests together; taking part matters more than finishing first.',
  keepsake:{id:'longlight_pennant',name:'Long Light Pennant',description:'A small gold pennant with a crooked sun. It remembers an evening spent running, resting and cheering together.'},
  activity:{id:'friendly_race',name:'One More Lap',
   invite:[['pip','One lap with your partner! I will cheer at the bend. You can go slowly; I have enough cheers for everyone.'],['maren','We all meet in the shade afterward. Leave a bowl of water there before you set out.']],
   complete:[['pip','You both came back! This pennant is for taking part. I painted the sun myself; it leans a little when it cheers.'],['maren','Sit with your partner a while. The good part of a long evening is having time to spend together.']]}
 },
 lanterns: {
  name:'The Harvest Lanterns', season:'autumn',
  tradition:'Carved lanterns light a shared supper. Tamers fill the ranch trough for every partner before serving themselves, then sit nearby instead of hurrying away.',
  keepsake:{id:'harvest_lantern',name:'Supper Lantern',description:'A small carved lantern with a leaf-shaped window. It remembers making room at the supper for every partner.'},
  activity:{id:'share_supper',name:'A Place for Everyone',
   invite:[['maren','Fill the trough for every partner, then bring your own plate over. Supper is better when nobody has been forgotten.'],['pip','I carved a leaf in this lantern. It was meant to be a whole tree, but the leaf lets more light through.']],
   complete:[['maren','Everyone has a place now. Stay for a moment and listen; a quiet supper can be good company.'],['pip','Take the leaf lantern home. You can put it by your next supper, even when the festival is over.']]}
 },
 midwinter: {
  name:'The Midwinter Hearth', season:'winter',
  tradition:'The town hangs garlands and lights around a big tree. Neighbors give something small and handmade, chosen for the person receiving it, with no gift expected in return.',
  keepsake:{id:'hearth_star',name:'Handmade Hearth Star',description:'A folded paper star with one uneven point. Someone took the time to make it for you.'},
  activity:{id:'give_gift',name:'Something for Someone',
   invite:[['maren','Make something small for someone you know. Think of what they would enjoy; it need not be clever or expensive.'],['pip','A bookmark for a reader. A soft cloth for cold paws. I am still thinking about mine.']],
   complete:[['maren','You thought about someone and followed through. That is enough; they do not owe you a gift back.'],['pip','I made you this star. One point came out shorter, but it will still catch the light.']]}
 }
};
const FESTIVAL_VOICES = {
 maren:{
  planting:'I save the scraps from old sewing for the seed baskets. A little ribbon can make an ordinary morning feel special.',
  longlight:'The lanterns can wait until dusk. For now, there is shade, water and a place beside your partner.',
  lanterns:'Leave room at the trough for the shy ones. They may join us once the first hungry noses have settled.',
  midwinter:'I have been sewing with the door shut. It is hard to keep a surprise when curious ears follow every sound.'
 },
 pip:{
  planting:'We traded seeds this morning. I wrote down what mine was before I forgot; that was my best idea all day.',
  longlight:'I am practicing cheering without spilling my drink. It is harder than running, but somebody has to do it.',
  lanterns:'I kept the bits from carving my lantern. Maren says they can go in the supper, so nothing good gets wasted.',
  midwinter:'My garland reaches almost all the way around the tree. The short bit is where we will stand for the picture.'
 }
};
for (const npc of MAPS.larkhaven.npcs) if (FESTIVAL_VOICES[npc.who]) {
 npc.byFestival = {};
 for (const [id,text] of Object.entries(FESTIVAL_VOICES[npc.who])) npc.byFestival[id] = [[npc.who,text]];
}
