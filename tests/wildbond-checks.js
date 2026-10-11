'use strict';

// Executed in the game iframe so classic-script lexical globals stay accessible.
function wildbondChecks() {
  const checks = [];
  const check = (label, test) => {
    try {
      if (!test()) throw Error('Expected condition was false.');
      checks.push({ ok: true, label });
    } catch (error) {
      checks.push({ ok: false, label: label + ' — ' + error.message });
    }
  };
  const wb = window.__wb;
  const tile = (m, x, y) => m && m.rows[y] && m.rows[y][x];
  const walkable = (m, x, y) => {
    const ch = tile(m, x, y);
    return ch !== undefined && !!TILES[ch] && !TILES[ch].solid && !TILES[ch].door;
  };
  const speaker = who => who === '' || Object.hasOwn(CAST, who) ||
    (typeof who === 'string' && who.startsWith('@') && Object.hasOwn(SPECIES, who.slice(1)));
  const lines = (label, list) => (list || []).forEach(([who], i) =>
    check(label + ' speaker ' + (i + 1), () => speaker(who)));

  check('WD3: sixty shared moves', () => Object.keys(MOVES).length === 60);
  for(const id of Object.keys(SPECIES)) {
    check('WD3: ' + id + ' remembers six to eight and brings an attack', () => {
      const c=newCreature(id,100),known=learnedMoves(c);
      return known.length>=6 && known.length<=8 && movesOf(c).length===4 && movesOf(c).some(m=>['hit','aoe','dot'].includes(MOVES[m].kind));
    });
    check('WD3: ' + id + ' old save keeps original moves', () => {
      const c=newCreature(id,100);delete c.moves;
      return JSON.stringify(movesOf(c))===JSON.stringify([...new Set(sp(c).legacyLearn.map(l=>l[1]))].slice(-4));
    });
  }
  for(const id of BattleEffects.bad) check('WD3: apply, expire and cleanse ' + id, () => {
    const u={c:newCreature('cindercub',30),st:{hp:100},buff:{},dots:[],status:{}};
    if(!BattleEffects.apply(u,id,2)||!BattleEffects.active(u,id))return false;
    BattleEffects.tick(u,2.1);if(BattleEffects.active(u,id))return false;
    u.wakeGrace=0;BattleEffects.apply(u,id,2);BattleEffects.cleanse(u);
    return !BattleEffects.active(u,id)&&!u.c.status;
  });
  check('WD3: sleep cannot chain after waking', () => {
    const u={c:newCreature('cindercub',30),st:{hp:100},buff:{},dots:[],status:{}};
    BattleEffects.apply(u,'sleep',3);BattleEffects.wake(u);
    return !BattleEffects.apply(u,'sleep',3)&&!BattleEffects.active(u,'sleep');
  });
  check('WD3: chosen moves survive serialization', () => {
    const c=newCreature('cindercub',30),chosen=['bite','steamBurst','coalFlick','packHunt'];
    return keepMoves(c,chosen)&&JSON.stringify(movesOf(JSON.parse(JSON.stringify(c))))===JSON.stringify(chosen)&&!keepMoves(c,['howl']);
  });

  for (const [id, m] of Object.entries(MAPS)) {
    check(id + ': map rows have equal lengths', () => m.rows.length > 0 && m.rows[0].length > 0 && m.rows.every(r => r.length === m.rows[0].length));
    const exits = new Set(m.rows.join('').split('').filter(ch => TILES[ch] && TILES[ch].exit));
    for (const ch of exits) {
      check(id + ': exit ' + ch + ' has a destination map', () => !!m.exits && !!m.exits[ch] && !!MAPS[m.exits[ch].to]);
      check(id + ': exit ' + ch + ' arrives on a walkable tile', () => {
        const ex = (m.exits || {})[ch];
        return !!ex && walkable(MAPS[ex.to], ex.x, ex.y) && !npcAt(MAPS[ex.to], ex.x, ex.y);
      });
    }
    for (const key of Object.keys(m.doors || {})) {
      check(id + ': door ' + key + ' sits on D', () => { const [x, y] = key.split(',').map(Number); return tile(m, x, y) === 'D'; });
    }
    for (const n of m.npcs || []) {
      check(id + ': NPC ' + n.who + ' is in CAST', () => Object.hasOwn(CAST, n.who));
      check(id + ': NPC ' + n.who + ' stands on a walkable tile', () => walkable(m, ...n.at));
      lines(id + ': ' + n.who + ' dialogue', n.lines);
      if (n.trainer) { lines(id + ': ' + n.who + ' victory', n.trainer.win); lines(id + ': ' + n.who + ' after', n.trainer.after); }
    }
    if (m.warden) {
      check(id + ': Warden spot is walkable', () => walkable(m, ...m.warden));
      check(id + ': area has a Warden beat', () => STORY.some(b => b.gate && (b.biome || 'thornwood') === m.biome));
    }
  }
  for (const [id, list] of Object.entries(SCENES)) lines('Scene ' + id, list);
  for (const b of STORY) {
    if (b.speaker !== undefined) check(b.id + ': story speaker', () => speaker(b.speaker));
    lines(b.id + ': introduction', b.lines); lines(b.id + ': victory', b.win);
    if (b.gate) {
      check(b.id + ': gate is a badge', () => Object.hasOwn(BADGES, b.gate));
      check(b.id + ': Warden trainer is a CAST speaker', () => Object.values(CAST).some(c => c.name === b.trainer));
    }
  }
  for (const [id, s] of Object.entries(SPECIES)) {
    for (const [level, move] of s.learn) check(id + ': level ' + level + ' move ' + move + ' exists', () => Object.hasOwn(MOVES, move));
    if (s.evo) check(id + ': evolution exists', () => Object.hasOwn(SPECIES, s.evo.to));
  }
  for (const [id, b] of Object.entries(BIOMES)) {
    for (const [sp] of b.wild) check(id + ': wild species ' + sp + ' exists', () => Object.hasOwn(SPECIES, sp));
    if (b.req) check(id + ': required badge is awarded by a Warden', () => Object.hasOwn(BADGES, b.req) && STORY.some(s => s.gate === b.req));
  }

  function reset() {
    // Clear transient battle/dialogue state as well as persistent state between scenarios.
    B = null; TALK = null; talkEl.hidden = true; W.after = W.afterDone = null; W.endT = W.autoT = 0; W.msg = '';
    S = fresh(); WK.ready = false; WK.held = []; WK.queued = null; WK.spot = null;
    WK.run = WK.pathRun = false; WK.cool = {}; WK.roam = []; WK.roamT = 99; WK.grassN = 10000;
    panelKey = tabKey = ''; closeModal();
  }
  function ready() {
    reset(); S.started = true; S.starter = 'ripplet'; S.rivalStarter = 'mosshog';
    S.team = [wb.newCreature('tidewyrm', 100, { rar: 4 })]; wb.placeAt('larkhaven');
  }
  function walk(x, y) {
    if (!wb.walkTo(x, y)) return false;
    let ticks = 0;
    while (WK.path.length && ticks++ < 2000) wb.worldTick(0.1);
    return ticks < 2000;
  }
  const launchWardens = STORY.filter(b => b.gate);
  launchWardens.forEach((gate, index) => check(gate.title + ': opponents fit the incoming hard badge cap', () => {
    ready(); S.badges = launchWardens.slice(0,index).map(b => b.gate); S.capMode = 'hard';
    const cap = levelCap(); S.biome = gate.biome || 'thornwood';
    S.team = ['ripplet','mosshog','cindercub'].map(id => wb.newCreature(id,cap));
    storyFight(gate);
    return B && B.story === gate.id && B.foes.length === 3 && B.foes.every(u => u.c.lvl <= cap);
  }));
  check('Stillreed entry gives a level-44 Cloudglass team level-46 wild encounters', () => {
    ready(); S.badges = launchWardens.slice(0,4).map(b => b.gate);
    S.team = [wb.newCreature('tidewyrm',44)]; wb.placeAt('stillreed');
    return Array.from({length:30}, () => wildLvl()).every(level => level === 46);
  });
  check('Stillreed wild levels still follow the team and stop at 60', () => {
    ready(); S.biome = 'stillreed'; S.team = [wb.newCreature('tidewyrm',50)];
    const middle = Array.from({length:30}, () => wildLvl()); S.team[0].lvl = 80;
    return middle.every(level => level >= 48 && level <= 51) && wildLvl() === 60;
  });
  check('Level tuning preserves an older over-cap guardian save with hard caps', () => {
    ready(); S.badges = launchWardens.slice(0,4).map(b => b.gate); S.capMode = 'hard';
    S.team = [wb.newCreature('stillwake',57,{rar:4})]; const uid = S.team[0].uid;
    save(); reset(); load(); grow(S.team[0],Cr.xpNeed(57));
    return S.team[0].uid === uid && S.team[0].sp === 'stillwake' && S.team[0].lvl === 57 && levelCap() === 55;
  });
  check('Choosing a starter puts you in Larkhaven', () => {
    reset(); wb.chooseStarter('ripplet', 'Test Tamer', 'classic'); skipTalk();
    return S.started && S.pos.map === 'larkhaven' && S.team[0].sp === 'ripplet';
  });
  check('Walking north from Larkhaven reaches Thornwood', () => {
    ready(); return walk(10, 0) && S.pos.map === 'thornwood';
  });
  check('Thornwood north gate stays locked without Thorn Badge', () => {
    ready(); wb.placeAt('thornwood', 13, 1, 'up'); wb.tryStep('up');
    return S.pos.map === 'thornwood' && W.msg.includes('Thorn Badge');
  });
  check('Thornwood north gate opens with Thorn Badge', () => {
    ready(); S.badges = ['thorn']; wb.placeAt('thornwood', 13, 1, 'up'); wb.tryStep('up');
    return S.pos.map === 'saltmarsh';
  });
  const badges = ['thorn', 'tide', 'ember', 'beacon'];
  for (let n = 0; n <= badges.length; n++) check('Level cap with ' + n + ' badges is ' + (15 + 10 * n), () => {
    ready(); S.badges = badges.slice(0, n); return wb.levelCap() === 15 + 10 * n;
  });
  check('Soft cap still grants a trickle of XP at the cap', () => {
    ready(); S.capMode = 'soft'; const c = wb.newCreature('tidewyrm', 15); c.xp = 0; grow(c, 100);
    return c.lvl === 15 && c.xp === Math.round(100 * SOFT_TRICKLE) && c.xp > 0 && c.xp < 100;
  });
  check('Hard cap grants no XP at the cap', () => {
    ready(); S.capMode = 'hard'; const c = wb.newCreature('tidewyrm', 15); c.xp = 0; grow(c, 100);
    return c.lvl === 15 && c.xp === 0;
  });
  check('Caps off lets a creature grow past level 15', () => {
    ready(); S.capMode = 'off'; const c = wb.newCreature('tidewyrm', 15); grow(c, 100000);
    return wb.levelCap() === 100 && c.lvl > 15;
  });
  for (const g of STORY.filter(b => b.gate)) {
    check(g.trainer + ': cannot be challenged in town', () => {
      ready(); S.biome = g.biome || 'thornwood'; S.explored = g.at; S.exploredIn = { [S.biome]: g.at };
      wb.challengeWarden(); return !wb.wardenReady() && !TALK && !wb.B;
    });
    check(g.trainer + ': can be challenged on their own map', () => {
      ready(); const area = g.biome || 'thornwood'; const map = Object.keys(MAPS).find(id => MAPS[id].biome === area);
      wb.placeAt(map); S.explored = g.at; S.exploredIn = { [area]: g.at }; renderAll();
      // no menu button any more (Evan, 2026-10-07): you walk up to the Warden standing on their map
      const warden = npcsOf(MAPS[map]).find(n => n.warden && n.warden.id === g.id);
      if (!wb.wardenReady() || !warden || document.querySelector('[data-act="warden"]')) return false;
      talkTo(warden); const scene = !!TALK && !talkEl.hidden; skipTalk();
      return scene && !!wb.B && wb.B.story === g.id && wb.B.trainer === g.trainer;
    });
    check(g.trainer + ': actual victory awards their badge', () => {
      ready(); const area = g.biome || 'thornwood'; wb.placeAt(Object.keys(MAPS).find(id => MAPS[id].biome === area));
      S.explored = g.at; S.exploredIn = { [area]: g.at }; wb.challengeWarden(); skipTalk();
      if (!wb.B) return false;
      let ticks = 0;
      while (wb.B && !wb.B.over && ticks++ < 10000) { wb.command('focus'); wb.worldTick(0.1); }
      const won = wb.B && wb.B.over === 'won'; wb.finishBattle(); skipTalk();
      return won && S.story[g.id] && S.badges.includes(g.gate);
    });
  }
  check('Old save without position, journey or cap mode loads defaults', () => {
    ready(); const old = JSON.parse(JSON.stringify(S)); delete old.pos; delete old.journey; delete old.capMode;
    localStorage.setItem('wildbond-save-v1', JSON.stringify(old)); load(); ensurePos();
    return S.journey === 'classic' && S.capMode === 'soft' && S.pos.map === 'thornwood' && S.team[0].sp === 'tidewyrm';
  });
  check('Walking into the inn heals the team', () => {
    ready(); S.team[0].hp = 1; wb.placeAt('larkhaven', 4, 5, 'up'); wb.tryStep('up');
    return S.team.every(c => c.hp === stOf(c).hp) && W.msg.includes('innkeeper');
  });
  check('Walking into the shop buys five lures for 50 coins', () => {
    ready(); const coins = S.coins, lures = S.lures; wb.placeAt('larkhaven', 18, 5, 'up'); wb.tryStep('up');
    return S.coins === coins - 50 && S.lures === lures + 5 && W.msg.includes('shopkeeper');
  });
  // T27: Stillreed content and the real walking, story, capture and badge paths.
  const basinSpecies = ['reedlet', 'ferrycrest', 'siltjaw', 'rillwhisk', 'orchardroot', 'gustreed', 'duskcord', 'glassbill', 'stillwake'];
  for (const id of basinSpecies) {
    check('Stillreed ' + id + ': valid family, element, moves and dex', () => {
      const s = SPECIES[id]; return s && ['wolf','cat','boar','lizard','croc','bird','spider','horse','sprite','hyena'].includes(s.fam) && ELEMENTS[s.el] && s.learn.every(([l,m]) => l > 0 && MOVES[m]) && !!s.dex;
    });
    check('Stillreed ' + id + ': base stats follow its role', () => {
      const s = SPECIES[id], total = Object.values(s.base).reduce((a,b) => a+b,0);
      return Object.keys(s.base).sort().join(',') === 'grd,hp,pow,spd,spi,wit' && Object.values(s.base).every(n => n > 0) && (s.unique ? total >= 500 && total <= 600 : id === 'ferrycrest' ? total >= 400 && total <= 440 : total >= 280 && total <= 320);
    });
  }
  check('Stillreed opens only with the Beacon Badge at levels 46-60', () => {
    ready(); const b=BIOMES.stillreed; if (b.lv.join(',') !== '46,60' || b.req !== 'beacon' || biomeOpen('stillreed')) return false;
    S.badges=badges.slice(); return biomeOpen('stillreed') && levelCap()===55;
  });
  check('Cloudglass ferry path is gated and walks into Stillreed after the badge', () => {
    ready(); S.badges=badges.slice(0,3); wb.placeAt('cloudglass',27,8,'right'); wb.tryStep('right');
    if(S.pos.map!=='cloudglass'||!W.msg.includes('Beacon Badge'))return false;
    S.badges=badges.slice();wb.tryStep('right');return S.pos.map==='stillreed'&&S.biome==='stillreed'&&S.pos.x===1&&S.pos.y===8;
  });
  check('Stillreed west exit returns to Cloudglass on a safe tile', () => {
    ready();S.badges=badges.slice();wb.placeAt('stillreed');wb.tryStep('left');return S.pos.map==='cloudglass'&&S.biome==='cloudglass'&&S.pos.x===27&&S.pos.y===8;
  });
  check('Stillreed map uses valid tiles and every walkable square is connected', () => {
    const m=MAPS.stillreed; if(m.rows.length!==14||m.rows.some(r=>r.length!==30||[...r].some(c=>!TILES[c])))return false;
    const seen=new Set(),todo=[m.start.slice(0,2)];
    while(todo.length){const [x,y]=todo.pop(),key=x+','+y;if(seen.has(key)||!walkable(m,x,y)||npcAt(m,x,y))continue;seen.add(key);for(const [dx,dy] of Object.values(DIRS))todo.push([x+dx,y+dy]);}
    for(let y=0;y<14;y++)for(let x=0;x<30;x++)if(walkable(m,x,y)&&!npcAt(m,x,y)&&!seen.has(x+','+y))return false;
    return m.items.every(it=>seen.has(it.at.join(',')))&&seen.has('0,8')&&seen.has('23,8')&&m.rows.some(r=>r.includes('~')&&r.includes('"'));
  });
  check('Stillreed has two signs, three unique items and two route trainers at 48-54', () => {
    const m=MAPS.stillreed;return Object.keys(m.signs).length===2&&m.items.length===3&&new Set(Object.values(MAPS).flatMap(m=>(m.items||[]).map(it=>it.id))).size===Object.values(MAPS).flatMap(m=>m.items||[]).length&&m.npcs.filter(n=>n.trainer).length===2&&m.npcs.filter(n=>n.trainer).every(n=>n.trainer.team.every(([id,l])=>SPECIES[id]&&l>=48&&l<=54));
  });
  check('Stillreed landing is reachable on dry boards while the moored skiff stays solid', () => {
    ready();S.badges=badges.slice();wb.placeAt('stillreed',11,9,'up');const explored=S.explored;
    for(const dir of ['up','right','right'])wb.tryStep(dir);
    if(S.pos.x!==13||S.pos.y!==8||TALK||B||S.explored!==explored)return false;
    wb.tryStep('up');if(S.pos.x!==13||S.pos.y!==8||!TILES.j.solid)return false;
    wb.tryStep('down');wb.tryStep('right');return S.pos.x===14&&S.pos.y===9&&!TALK&&!B&&S.explored===explored;
  });
  check('Landing sign explains the mooring and asks visitors to leave creature space', () => {
    ready();S.badges=badges.slice();wb.placeAt('stillreed',12,8,'up');wb.tryStep('up');
    return S.pos.x===12&&S.pos.y===8&&W.msg.includes('skiff')&&W.msg.includes('small creatures');
  });
  check('Both Stillreed channel crossings are boards with open water beside the ferry', () => {
    const m=MAPS.stillreed;return [4,9].every(y=>[12,13,14].every(x=>tile(m,x,y)==='b'&&walkable(m,x,y)))&&tile(m,13,7)==='j'&&tile(m,12,7)==='q'&&tile(m,14,7)==='~';
  });
  check('An old saved position on the lower crossing loads onto the new boards', () => {
    ready();S.badges=badges.slice();wb.placeAt('stillreed',13,9,'right');S.items={sr1:true};S.beaten={tavil:true};save();reset();load();ensurePos();
    return S.pos.map==='stillreed'&&S.pos.x===13&&S.pos.y===9&&tile(MAPS.stillreed,13,9)==='b'&&S.items.sr1&&S.beaten.tavil;
  });
  check('An old saved position beside the landing stays walkable', () => {
    ready();S.badges=badges.slice();wb.placeAt('stillreed',11,7,'down');save();reset();load();ensurePos();
    return S.pos.map==='stillreed'&&walkable(MAPS.stillreed,S.pos.x,S.pos.y)&&!blocked(MAPS.stillreed,S.pos.x,S.pos.y);
  });
  for(const era of ['pocket','pixel','bit16'])check(era+' paints distinct ferry and board tiles rather than fallback grass', () => {
    const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),P=worldPal(MAPS.stillreed);
    if(!P)return false;const pixels=ch=>{g.clearRect(0,0,32,32);ART[era].tile(g,ch,0,0,32,P,0,13,7);return Array.from(g.getImageData(0,0,32,32).data).join(',');};
    return pixels('b')!==pixels(',')&&pixels('j')!==pixels('~')&&pixels('q')!==pixels('~');
  });
  check('Stillreed wild table excludes its guardian and keeps Glassbill rare', () => {
    const w=BIOMES.stillreed.wild;return w.every(([id,n])=>[...basinSpecies,"laughrill","fordfoal"].includes(id)&&n>0&&!SPECIES[id].unique)&&w.find(([id])=>id==='glassbill')[1]===3&&w.filter(([id])=>id!=='glassbill').every(([,n])=>n>3)&&SPECIES.stillwake.fam==='croc'&&SPECIES.stillwake.el==='Tide'&&SPECIES.stillwake.big===1&&SPECIES.stillwake.unique===1;
  });
  check('Reedlet really evolves at 54 before the fifth badge is needed', () => {
    ready();S.badges=badges.slice();const c=wb.newCreature('reedlet',53);c.xp=0;grow(c,Cr.xpNeed(53));return c.lvl===54&&c.sp==='ferrycrest'&&S.caught.ferrycrest;
  });
  check('Stillreed weather is rainy and its original zone tune has valid notes', () => {
    const t=TRACKS.stillreed;return WEATHER.stillreed.join(',')==='rain,clear,rain,mist'&&t.mel.split(' ').length===32&&[16,32].includes(t.bass.split(' ').length)&&[...t.mel.split(' '),...t.bass.split(' ')].every(n=>n==='.'||ArcadeSound.hz(n)>0);
  });
  check('Stillreed clear daytime selects its zone music', () => {
    ready();S.badges=badges.slice();S.day=4;S.ranchT=0;wb.placeAt('stillreed');return weatherNow()==='clear'&&!isNight()&&musicKey()==='stillreed';
  });
  const basinBeats=STORY.filter(b=>b.biome==='stillreed');
  check('Stillreed story has exactly the required thresholds and team bands', () => basinBeats.length===3&&basinBeats.map(b=>b.at).join(',')==='6,14,24'&&basinBeats[0].team.every(([,l])=>l>=46&&l<=50)&&JSON.stringify(basinBeats[0].team.at(-1))==='["$rival",50]'&&JSON.stringify(basinBeats[1].wild)==='["stillwake",50,4]'&&basinBeats[2].team.map(([,l])=>l).join(',')==='53,54,55'&&basinBeats[2].gate==='reed'&&basinBeats.every(b=>b.lines.length>=3&&b.lines.length<=5&&b.win.length>=2&&b.win.length<=3));
  check('Wren ferry rematch triggers at six local explores and a real victory completes it', () => {
    ready();S.badges=badges.slice();wb.placeAt('stillreed');S.explored=100;S.exploredIn={stillreed:5};wb.explore();
    if(!TALK||!TALK.lines.some(([,t])=>t.includes('rope')))return false;skipTalk();return B&&B.story==='rival6'&&B.kind==='trainer'&&B.foes.at(-1).c.lvl===50&&finishFight()==='won'&&S.story.rival6;
  });
  check('Stillwake triggers at fourteen local explores and a real lure records the guardian', () => {
    ready();S.badges=badges.slice();S.story.rival6=true;wb.placeAt('stillreed');S.explored=100;S.exploredIn={stillreed:13};wb.explore();if(!TALK)return false;skipTalk();
    if(!B||B.story!=='stillwake'||B.foes[0].c.sp!=='stillwake'||B.foes[0].c.lvl!==50||B.foes[0].c.rar!==4)return false;
    const random=Math.random;try{Math.random=()=>0;wb.command('lure');if(!B.capture)return false;B.capture.pos=B.capture.zone;wb.calmNow();const caught=B.over==='caught';wb.finishBattle();skipTalk();return caught&&S.story.stillwake&&S.caught.stillwake&&[...S.team,...S.ranch].some(c=>c.sp==='stillwake');}finally{Math.random=random;}
  });
  check('Olan waits for 24 local explores; real victory awards Reed and cap 60 without changing eras', () => {
    ready();S.badges=badges.slice();S.story.rival6=S.story.stillwake=true;wb.placeAt('stillreed');S.explored=100;S.exploredIn={stillreed:23};
    if(wb.wardenReady())return false;wb.challengeWarden();if(TALK||B)return false;S.exploredIn.stillreed=24;const eras=JSON.stringify(S.eras);wb.challengeWarden();if(!TALK)return false;skipTalk();
    return B&&B.story==='warden5'&&finishFight()==='won'&&S.story.warden5&&S.badges.includes('reed')&&levelCap()===60&&JSON.stringify(S.eras)===eras;
  });
  check('Four-badge saves preserve progress and Stillreed saves reload their position and badge', () => {
    ready();S.badges=badges.slice();S.story.warden4=true;save();load();if(levelCap()!==55||!S.story.warden4||S.badges.length!==4)return false;
    S.badges.push('reed');wb.placeAt('stillreed',19,9,'right');S.items={sr1:true};S.beaten={evren:true};save();reset();load();ensurePos();return S.pos.map==='stillreed'&&S.pos.x===19&&S.biome==='stillreed'&&levelCap()===60&&S.items.sr1&&S.beaten.evren;
  });
  // T28: Hollowecho content and the real walking, story, capture and badge paths.
  const hillSpecies = ['hushpup', 'hushmane', 'flintroot', 'dripdart', 'ledgewhisk', 'bellmote', 'umbrelace', 'chimespark', 'undertone'];
  for (const id of hillSpecies) {
    check('Hollowecho ' + id + ': valid family, element, moves and dex', () => {
      const s = SPECIES[id]; return s && ['wolf','cat','boar','lizard','croc','bird','spider','horse','sprite','hyena'].includes(s.fam) && ELEMENTS[s.el] && s.learn.every(([l,m]) => l > 0 && MOVES[m]) && !!s.dex;
    });
    check('Hollowecho ' + id + ': base stats follow its role', () => {
      const s = SPECIES[id], total = Object.values(s.base).reduce((a,b) => a+b,0);
      return Object.keys(s.base).sort().join(',') === 'grd,hp,pow,spd,spi,wit' && Object.values(s.base).every(n => n > 0) && (s.unique ? total >= 500 && total <= 600 : id === 'hushmane' ? total >= 400 && total <= 440 : total >= 280 && total <= 320);
    });
  }
  check('Hollowecho opens only with the Reed Badge at levels 58-64', () => {
    ready(); const b=BIOMES.hollowecho; if (b.lv.join(',') !== '58,64' || b.req !== 'reed' || biomeOpen('hollowecho')) return false;
    S.badges=[...badges,'reed']; return biomeOpen('hollowecho') && levelCap()===60;
  });
  check('Stillreed hill exit is gated and walks into Hollowecho after Reed', () => {
    ready(); S.badges=badges.slice(); wb.placeAt('stillreed',28,9,'right');wb.tryStep('right');
    if(S.pos.map!=='stillreed'||!W.msg.includes('Reed Badge'))return false;
    S.badges.push('reed');wb.tryStep('right');return S.pos.map==='hollowecho'&&S.biome==='hollowecho'&&S.pos.x===1&&S.pos.y===9;
  });
  check('Hollowecho west exit returns to Stillreed on a safe tile', () => {
    ready();S.badges=[...badges,'reed'];wb.placeAt('hollowecho');wb.tryStep('left');return S.pos.map==='stillreed'&&S.biome==='stillreed'&&S.pos.x===28&&S.pos.y===9;
  });
  check('Hollowecho map uses valid tiles and every walkable square is connected', () => {
    const m=MAPS.hollowecho; if(m.rows.length!==14||m.rows.some(r=>r.length!==30||[...r].some(c=>!TILES[c])))return false;
    const seen=new Set(),todo=[m.start.slice(0,2)];
    while(todo.length){const [x,y]=todo.pop(),key=x+','+y;if(seen.has(key)||!walkable(m,x,y)||npcAt(m,x,y))continue;seen.add(key);for(const [dx,dy] of Object.values(DIRS))todo.push([x+dx,y+dy]);}
    for(let y=0;y<14;y++)for(let x=0;x<30;x++)if(walkable(m,x,y)&&!npcAt(m,x,y)&&!seen.has(x+','+y))return false;
    return m.items.every(it=>seen.has(it.at.join(',')))&&seen.has('0,9')&&seen.has('23,5')&&m.rows.some(r=>r.includes('R')&&r.includes('"'));
  });
  check('Hollowecho has a sign, three unique items and two route trainers at 58-62', () => {
    const m=MAPS.hollowecho;return Object.keys(m.signs).length===1&&m.items.length===3&&new Set(Object.values(MAPS).flatMap(m=>(m.items||[]).map(it=>it.id))).size===Object.values(MAPS).flatMap(m=>m.items||[]).length&&m.npcs.filter(n=>n.trainer).length===2&&m.npcs.filter(n=>n.trainer).every(n=>n.trainer.team.every(([id,l])=>SPECIES[id]&&l>=58&&l<=62));
  });
  check('Hollowecho wild table excludes its guardian and keeps Chimespark rare', () => {
    const w=BIOMES.hollowecho.wild;return w.every(([id,n])=>hillSpecies.includes(id)&&n>0&&!SPECIES[id].unique)&&w.find(([id])=>id==='chimespark')[1]===3&&w.filter(([id])=>id!=='chimespark').every(([,n])=>n>3)&&SPECIES.undertone.fam==='hyena'&&SPECIES.undertone.el==='Shade'&&SPECIES.undertone.big===1&&SPECIES.undertone.unique===1;
  });
  check('Hushpup really evolves at 60 before the sixth badge is needed', () => {
    ready();S.badges=[...badges,'reed'];const c=wb.newCreature('hushpup',59);c.xp=0;grow(c,Cr.xpNeed(59));return c.lvl===60&&c.sp==='hushmane'&&S.caught.hushmane;
  });
  check('Hollowecho weather alternates clear and mist and its original zone tune has valid notes', () => {
    const t=TRACKS.hollowecho;return WEATHER.hollowecho.join(',')==='clear,mist,clear'&&t.lead==='pulse'&&t.mel.split(' ').length===32&&[16,32].includes(t.bass.split(' ').length)&&[...t.mel.split(' '),...t.bass.split(' ')].every(n=>n==='.'||ArcadeSound.hz(n)>0);
  });
  check('Hollowecho clear daytime selects its zone music', () => {
    ready();S.badges=[...badges,'reed'];S.day=1;S.ranchT=0;wb.placeAt('hollowecho');return weatherNow()==='clear'&&!isNight()&&musicKey()==='hollowecho';
  });
  const hillBeats=STORY.filter(b=>b.biome==='hollowecho');
  check('Hollowecho story has exactly the required thresholds and team bands', () => hillBeats.length===3&&hillBeats.map(b=>b.at).join(',')==='6,14,24'&&hillBeats[0].team.every(([,l])=>l>=58&&l<=61)&&JSON.stringify(hillBeats[0].team.at(-1))==='["$rival",61]'&&JSON.stringify(hillBeats[1].wild)==='["undertone",63,4]'&&hillBeats[2].team.map(([,l])=>l).join(',')==='58,59,60'&&hillBeats[2].gate==='echo'&&hillBeats.every(b=>b.lines.length>=3&&b.lines.length<=5&&b.win.length>=2&&b.win.length<=3));
  check('Wren wrong-passage rematch triggers at six local explores and a real victory completes it', () => {
    ready();S.badges=[...badges,'reed'];wb.placeAt('hollowecho');S.explored=100;S.exploredIn={hollowecho:5};wb.explore();
    if(!TALK||!TALK.lines.some(([,t])=>t.includes('echo')))return false;skipTalk();return B&&B.story==='rival7'&&B.kind==='trainer'&&B.foes.at(-1).c.lvl===61&&finishFight()==='won'&&S.story.rival7;
  });
  check('Undertone triggers at fourteen local explores and a real lure records the guardian', () => {
    ready();S.badges=[...badges,'reed'];S.story.rival7=true;wb.placeAt('hollowecho');S.explored=100;S.exploredIn={hollowecho:13};wb.explore();if(!TALK)return false;skipTalk();
    if(!B||B.story!=='undertone'||B.foes[0].c.sp!=='undertone'||B.foes[0].c.lvl!==63||B.foes[0].c.rar!==4)return false;
    const random=Math.random;try{Math.random=()=>0;wb.command('lure');if(!B.capture)return false;B.capture.pos=B.capture.zone;wb.calmNow();const caught=B.over==='caught';wb.finishBattle();skipTalk();return caught&&S.story.undertone&&S.caught.undertone&&[...S.team,...S.ranch].some(c=>c.sp==='undertone');}finally{Math.random=random;}
  });
  check('Senna waits for 24 local explores; real victory awards Echo and cap 65 without changing eras', () => {
    ready();S.badges=[...badges,'reed'];S.story.rival7=S.story.undertone=true;wb.placeAt('hollowecho');S.explored=100;S.exploredIn={hollowecho:23};
    if(wb.wardenReady())return false;wb.challengeWarden();if(TALK||B)return false;S.exploredIn.hollowecho=24;const eras=JSON.stringify(S.eras);wb.challengeWarden();if(!TALK)return false;skipTalk();
    return B&&B.story==='warden6'&&finishFight()==='won'&&S.story.warden6&&S.badges.includes('echo')&&levelCap()===65&&JSON.stringify(S.eras)===eras;
  });
  check('Five-badge saves preserve progress; Hollowecho saves reload the Echo Badge', () => {
    ready();S.badges=[...badges,'reed'];S.story.warden5=true;save();load();if(levelCap()!==60||!S.story.warden5||S.badges.length!==5)return false;
    S.badges.push('echo');wb.placeAt('hollowecho',27,9,'right');S.items={he1:true};S.beaten={veslin:true};save();reset();load();ensurePos();return S.pos.map==='hollowecho'&&S.pos.x===27&&S.biome==='hollowecho'&&levelCap()===65&&S.items.he1&&S.beaten.veslin;
  });
  // T29: Sunthread content and the real walking, story, capture and badge paths.
  const commonsSpecies = ['clovercolt', 'bloomcourser', 'tilthtusk', 'hearthrunner', 'ribbonstride', 'hemglow', 'pennantlark', 'dawntassel', 'meadowmantle'];
  for (const id of commonsSpecies) {
    check('Sunthread ' + id + ': valid family, element, moves and dex', () => {
      const s = SPECIES[id]; return s && ['wolf','cat','boar','lizard','croc','bird','spider','horse','sprite','hyena'].includes(s.fam) && ELEMENTS[s.el] && s.learn.every(([l,m]) => l > 0 && MOVES[m]) && !!s.dex;
    });
    check('Sunthread ' + id + ': base stats follow its role', () => {
      const s = SPECIES[id], total = Object.values(s.base).reduce((a,b) => a+b,0);
      return Object.keys(s.base).sort().join(',') === 'grd,hp,pow,spd,spi,wit' && Object.values(s.base).every(n => n > 0) && (s.unique ? total >= 500 && total <= 600 : id === 'bloomcourser' ? total >= 400 && total <= 440 : total >= 280 && total <= 320);
    });
  }
  check('Sunthread opens only with the Echo Badge at levels 62-68', () => {
    ready(); const b=BIOMES.sunthread; if (b.lv.join(',') !== '62,68' || b.req !== 'echo' || biomeOpen('sunthread')) return false;
    S.badges=[...badges,'reed','echo']; return biomeOpen('sunthread') && levelCap()===65;
  });
  check('Hollowecho gathering exit is gated and walks into Sunthread after Echo', () => {
    ready(); S.badges=[...badges,'reed']; wb.placeAt('hollowecho',28,9,'right');wb.tryStep('right');
    if(S.pos.map!=='hollowecho'||!W.msg.includes('Echo Badge'))return false;
    S.badges.push('echo');wb.tryStep('right');return S.pos.map==='sunthread'&&S.biome==='sunthread'&&S.pos.x===1&&S.pos.y===9;
  });
  check('Sunthread west exit returns to Hollowecho on a safe tile', () => {
    ready();S.badges=[...badges,'reed','echo'];wb.placeAt('sunthread');wb.tryStep('left');return S.pos.map==='hollowecho'&&S.biome==='hollowecho'&&S.pos.x===28&&S.pos.y===9;
  });
  check('Sunthread map uses valid tiles and every walkable square is connected', () => {
    const m=MAPS.sunthread; if(m.rows.length!==14||m.rows.some(r=>r.length!==30||[...r].some(c=>!TILES[c])))return false;
    const seen=new Set(),todo=[m.start.slice(0,2)];
    while(todo.length){const [x,y]=todo.pop(),key=x+','+y;if(seen.has(key)||!walkable(m,x,y)||npcAt(m,x,y))continue;seen.add(key);for(const [dx,dy] of Object.values(DIRS))todo.push([x+dx,y+dy]);}
    for(let y=0;y<14;y++)for(let x=0;x<30;x++)if(walkable(m,x,y)&&!npcAt(m,x,y)&&!seen.has(x+','+y))return false;
    return m.items.every(it=>seen.has(it.at.join(',')))&&seen.has('0,9')&&seen.has('24,6')&&m.rows.some(r=>r.includes('#'))&&m.rows.some(r=>r.includes('f'));
  });
  check('Sunthread has a sign, three unique items and two route trainers at 64-67', () => {
    const m=MAPS.sunthread;return Object.keys(m.signs).length===2&&m.items.length===3&&new Set(Object.values(MAPS).flatMap(m=>(m.items||[]).map(it=>it.id))).size===Object.values(MAPS).flatMap(m=>m.items||[]).length&&m.npcs.filter(n=>n.trainer).length===2&&m.npcs.filter(n=>n.trainer).every(n=>n.trainer.team.every(([id,l])=>SPECIES[id]&&l>=64&&l<=67))&&m.npcs.some(n=>n.who==='pell'&&!n.trainer);
  });
  check('Sunthread wild table excludes its guardian and keeps Dawntassel rare', () => {
    const w=BIOMES.sunthread.wild;return w.every(([id,n])=>[...commonsSpecies,"sunfrill","boughchorus"].includes(id)&&n>0&&!SPECIES[id].unique)&&w.find(([id])=>id==='dawntassel')[1]===3&&w.filter(([id])=>id!=='dawntassel').every(([,n])=>n>3)&&SPECIES.meadowmantle.fam==='boar'&&SPECIES.meadowmantle.el==='Grove'&&SPECIES.meadowmantle.big===1&&SPECIES.meadowmantle.unique===1;
  });
  check('Clovercolt really evolves at 64 before the seventh badge is needed', () => {
    ready();S.badges=[...badges,'reed','echo'];const c=wb.newCreature('clovercolt',63);c.xp=0;grow(c,Cr.xpNeed(63));return c.lvl===64&&c.sp==='bloomcourser'&&S.caught.bloomcourser;
  });
  check('Sunthread weather has clear mornings and sudden rain and its original zone tune has valid notes', () => {
    const t=TRACKS.sunthread;return WEATHER.sunthread.join(',')==='clear,clear,rain'&&t.lead==='triangle'&&t.mel.split(' ').length===32&&[16,32].includes(t.bass.split(' ').length)&&[...t.mel.split(' '),...t.bass.split(' ')].every(n=>n==='.'||ArcadeSound.hz(n)>0);
  });
  check('Sunthread clear daytime selects its zone music', () => {
    ready();S.badges=[...badges,'reed','echo'];S.day=1;S.ranchT=0;wb.placeAt('sunthread');return weatherNow()==='clear'&&!isNight()&&musicKey()==='sunthread';
  });
  const commonsBeats=STORY.filter(b=>b.biome==='sunthread');
  check('Sunthread story has exactly the required thresholds and team bands', () => commonsBeats.length===3&&commonsBeats.map(b=>b.at).join(',')==='6,14,24'&&commonsBeats[0].team.every(([,l])=>l>=64&&l<=67)&&JSON.stringify(commonsBeats[0].team.at(-1))==='["$rival",67]'&&JSON.stringify(commonsBeats[1].wild)==='["meadowmantle",67,4]'&&commonsBeats[2].team.map(([,l])=>l).join(',')==='63,64,65'&&commonsBeats[2].gate==='loom'&&commonsBeats.every(b=>b.lines.length>=3&&b.lines.length<=5&&b.win.length>=2&&b.win.length<=3));
  check('Wren gathering rematch triggers at six local explores and a real victory completes it', () => {
    ready();S.badges=[...badges,'reed','echo'];wb.placeAt('sunthread');S.explored=100;S.exploredIn={sunthread:5};wb.explore();
    if(!TALK||!TALK.lines.some(([,t])=>t.includes('little partner')))return false;skipTalk();return B&&B.story==='rival8'&&B.kind==='trainer'&&B.foes.at(-1).c.lvl===67&&finishFight()==='won'&&S.story.rival8;
  });
  check('Meadowmantle triggers at fourteen local explores and a real lure records the guardian', () => {
    ready();S.badges=[...badges,'reed','echo'];S.story.rival8=true;wb.placeAt('sunthread');S.explored=100;S.exploredIn={sunthread:13};wb.explore();if(!TALK)return false;skipTalk();
    if(!B||B.story!=='meadowmantle'||B.foes[0].c.sp!=='meadowmantle'||B.foes[0].c.lvl!==67||B.foes[0].c.rar!==4)return false;
    const random=Math.random;try{Math.random=()=>0;wb.command('lure');if(!B.capture)return false;B.capture.pos=B.capture.zone;wb.calmNow();const caught=B.over==='caught';wb.finishBattle();skipTalk();return caught&&S.story.meadowmantle&&S.caught.meadowmantle&&[...S.team,...S.ranch].some(c=>c.sp==='meadowmantle');}finally{Math.random=random;}
  });
  check('Halen waits for 24 local explores; real victory awards Loom and cap 70 without changing eras', () => {
    ready();S.badges=[...badges,'reed','echo'];S.story.rival8=S.story.meadowmantle=true;wb.placeAt('sunthread');S.explored=100;S.exploredIn={sunthread:23};
    if(wb.wardenReady())return false;wb.challengeWarden();if(TALK||B)return false;S.exploredIn.sunthread=24;const eras=JSON.stringify(S.eras);wb.challengeWarden();if(!TALK)return false;skipTalk();
    return B&&B.story==='warden7'&&finishFight()==='won'&&S.story.warden7&&S.badges.includes('loom')&&levelCap()===70&&JSON.stringify(S.eras)===eras;
  });
  check('Six-badge saves preserve progress; Sunthread saves reload the Loom Badge', () => {
    ready();S.badges=[...badges,'reed','echo'];S.story.warden6=true;save();load();if(levelCap()!==65||!S.story.warden6||S.badges.length!==6)return false;
    S.badges.push('loom');wb.placeAt('sunthread',27,6,'right');S.items={st1:true};S.beaten={mirel:true};save();reset();load();ensurePos();return S.pos.map==='sunthread'&&S.pos.x===27&&S.biome==='sunthread'&&levelCap()===70&&S.items.st1&&S.beaten.mirel;
  });
  check('Sunthread battle profile uses green meadow hills and moving leaves', () => BATTLE_PLACES.sunthread.far==='dunes'&&BATTLE_PLACES.sunthread.near==='oaks'&&BATTLE_PLACES.sunthread.leaves>0&&!BATTLE_PLACES.sunthread.water);
  for (const n of MAPS.sunthread.npcs.filter(n=>n.trainer)) check('Sunthread trainer '+n.who+' plays and records a real victory', () => {
    ready();S.badges=[...badges,'reed','echo'];wb.placeAt('sunthread');talkTo(n);if(!TALK)return false;skipTalk();return B&&B.npc===n.who&&B.trainer===CAST[n.who].name&&finishFight()==='won'&&S.beaten[n.who];
  });
  // W1: Farwatch content and the real walking, story, capture and badge paths.
  const reachSpecies = ['shoalpup', 'soundhowl', 'keeljaw', 'chartwing', 'moorweft', 'inkwhisk', 'buoyglint', 'isleglimmer', 'watchlight'];
  for (const id of reachSpecies) {
    check('Farwatch ' + id + ': valid family, element, moves and dex', () => {
      const s = SPECIES[id]; return s && ['wolf','cat','boar','lizard','croc','bird','spider','horse','sprite','hyena'].includes(s.fam) && ELEMENTS[s.el] && s.learn.every(([l,m]) => l > 0 && MOVES[m]) && !!s.dex;
    });
    check('Farwatch ' + id + ': base stats follow its role', () => {
      const s = SPECIES[id], total = Object.values(s.base).reduce((a,b) => a+b,0);
      return Object.keys(s.base).sort().join(',') === 'grd,hp,pow,spd,spi,wit' && Object.values(s.base).every(n => n > 0) && (s.unique ? total >= 500 && total <= 600 : id === 'soundhowl' ? total >= 400 && total <= 440 : total >= 280 && total <= 320);
    });
  }
  check('Farwatch opens only with the Loom Badge at levels 66-72', () => {
    ready(); const b=BIOMES.farwatch; if (b.lv.join(',') !== '66,72' || b.req !== 'loom' || biomeOpen('farwatch')) return false;
    S.badges=[...badges,'reed','echo','loom']; return biomeOpen('farwatch') && levelCap()===70;
  });
  check('Sunthread coastal exit is gated and walks into Farwatch after Loom', () => {
    ready(); S.badges=[...badges,'reed','echo']; wb.placeAt('sunthread',28,9,'right');wb.tryStep('right');
    if(S.pos.map!=='sunthread'||!W.msg.includes('Loom Badge'))return false;
    S.badges.push('loom');wb.tryStep('right');return S.pos.map==='farwatch'&&S.biome==='farwatch'&&S.pos.x===1&&S.pos.y===9;
  });
  check('Farwatch west exit returns to Sunthread on a safe tile', () => {
    ready();S.badges=[...badges,'reed','echo','loom'];wb.placeAt('farwatch');wb.tryStep('left');return S.pos.map==='sunthread'&&S.biome==='sunthread'&&S.pos.x===28&&S.pos.y===9;
  });
  check('Farwatch map uses valid tiles and every walkable square is connected', () => {
    const m=MAPS.farwatch; if(m.rows.length!==14||m.rows.some(r=>r.length!==30||[...r].some(c=>!TILES[c])))return false;
    const seen=new Set(),todo=[m.start.slice(0,2)];
    while(todo.length){const [x,y]=todo.pop(),key=x+','+y;if(seen.has(key)||!walkable(m,x,y)||npcAt(m,x,y))continue;seen.add(key);for(const [dx,dy] of Object.values(DIRS))todo.push([x+dx,y+dy]);}
    for(let y=0;y<14;y++)for(let x=0;x<30;x++)if(walkable(m,x,y)&&!npcAt(m,x,y)&&!seen.has(x+','+y))return false;
    return m.items.every(it=>seen.has(it.at.join(',')))&&seen.has('0,9')&&seen.has('20,4')&&m.rows.some(r=>r.includes('#'))&&m.rows.some(r=>r.includes('f'));
  });
  const seenHarbor=m=>m.rows[9].slice(24,28)==='....'&&m.rows[8][24]==='~';
  check('Farwatch has a sign, three unique items and two route trainers at 68-70', () => {
    const m=MAPS.farwatch;return Object.keys(m.signs).length===2&&m.items.length===3&&new Set(Object.values(MAPS).flatMap(m=>(m.items||[]).map(it=>it.id))).size===Object.values(MAPS).flatMap(m=>m.items||[]).length&&m.npcs.filter(n=>n.trainer).length===2&&m.npcs.filter(n=>n.trainer).every(n=>n.trainer.team.every(([id,l])=>SPECIES[id]&&l>=68&&l<=70))&&m.rows.some(r=>r.includes('~'))&&seenHarbor(m);
  });
  check('Farwatch wild table excludes its guardian and keeps Isleglimmer rare', () => {
    const w=BIOMES.farwatch.wild;return w.every(([id,n])=>reachSpecies.includes(id)&&n>0&&!SPECIES[id].unique)&&w.find(([id])=>id==='isleglimmer')[1]===3&&w.filter(([id])=>id!=='isleglimmer').every(([,n])=>n>3)&&SPECIES.watchlight.fam==='sprite'&&SPECIES.watchlight.el==='Radiant'&&SPECIES.watchlight.big===1&&SPECIES.watchlight.unique===1;
  });
  check('Shoalpup really evolves at 68 before the eighth badge is needed', () => {
    ready();S.badges=[...badges,'reed','echo','loom'];const c=wb.newCreature('shoalpup',67);c.xp=0;grow(c,Cr.xpNeed(67));return c.lvl===68&&c.sp==='soundhowl'&&S.caught.soundhowl;
  });
  check('Farwatch weather has bright distance and sea fog and its original zone tune has valid notes', () => {
    const t=TRACKS.farwatch;return WEATHER.farwatch.join(',')==='clear,mist,clear,mist'&&t.lead==='triangle'&&t.mel.split(' ').length===32&&[16,32].includes(t.bass.split(' ').length)&&[...t.mel.split(' '),...t.bass.split(' ')].every(n=>n==='.'||ArcadeSound.hz(n)>0);
  });
  check('Farwatch clear daytime selects its zone music', () => {
    ready();S.badges=[...badges,'reed','echo','loom'];S.day=2;S.ranchT=0;wb.placeAt('farwatch');return weatherNow()==='clear'&&!isNight()&&musicKey()==='farwatch';
  });
  check('Farwatch fog really selects mist, keeps its zone tune and uses the existing Gale and Shade weather bonuses', () => {
    ready();S.badges=[...badges,'reed','echo','loom'];S.day=1;S.ranchT=0;wb.placeAt('farwatch');return weatherNow()==='mist'&&musicKey()==='farwatch'&&WEATHER_FX.mist.Gale===1.5&&WEATHER_FX.mist.Shade===1.5;
  });
  const reachBeats=STORY.filter(b=>b.biome==='farwatch');
  check('Farwatch story has exactly the required thresholds and team bands', () => reachBeats.length===3&&reachBeats.map(b=>b.at).join(',')==='6,14,24'&&reachBeats[0].team.every(([,l])=>l>=68&&l<=70)&&JSON.stringify(reachBeats[0].team.at(-1))==='["$rival",70]'&&JSON.stringify(reachBeats[1].wild)==='["watchlight",71,4]'&&reachBeats[2].team.map(([,l])=>l).join(',')==='68,69,70'&&reachBeats[2].gate==='horizon'&&reachBeats.every(b=>b.lines.length>=3&&b.lines.length<=5&&b.win.length>=2&&b.win.length<=3));
  check('Wren shared-notes rematch triggers at six local explores and a real victory completes it', () => {
    ready();S.badges=[...badges,'reed','echo','loom'];wb.placeAt('farwatch');S.explored=100;S.exploredIn={farwatch:5};wb.explore();
    if(!TALK||!TALK.lines.some(([,t])=>t.includes('league')))return false;skipTalk();return B&&B.story==='rival9'&&B.kind==='trainer'&&B.foes.at(-1).c.lvl===70&&finishFight()==='won'&&S.story.rival9;
  });
  check('Watchlight triggers at fourteen local explores and a real lure records the guardian', () => {
    ready();S.badges=[...badges,'reed','echo','loom'];S.story.rival9=true;wb.placeAt('farwatch');S.explored=100;S.exploredIn={farwatch:13};wb.explore();if(!TALK)return false;skipTalk();
    if(!B||B.story!=='watchlight'||B.foes[0].c.sp!=='watchlight'||B.foes[0].c.lvl!==71||B.foes[0].c.rar!==4)return false;
    const random=Math.random;try{Math.random=()=>0;wb.command('lure');if(!B.capture)return false;B.capture.pos=B.capture.zone;wb.calmNow();const caught=B.over==='caught';wb.finishBattle();skipTalk();return caught&&S.story.watchlight&&S.caught.watchlight&&[...S.team,...S.ranch].some(c=>c.sp==='watchlight');}finally{Math.random=random;}
  });
  check('Rysa waits for 24 local explores; real victory awards Horizon and cap 75 without changing eras', () => {
    ready();S.badges=[...badges,'reed','echo','loom'];S.story.rival9=S.story.watchlight=true;wb.placeAt('farwatch');S.explored=100;S.exploredIn={farwatch:23};
    if(wb.wardenReady())return false;wb.challengeWarden();if(TALK||B)return false;S.exploredIn.farwatch=24;const eras=JSON.stringify(S.eras);wb.challengeWarden();if(!TALK)return false;skipTalk();
    return B&&B.story==='warden8'&&finishFight()==='won'&&S.story.warden8&&S.badges.includes('horizon')&&levelCap()===75&&JSON.stringify(S.eras)===eras&&S.badges.length===8&&S.badges.slice(0,7).join(',')==='thorn,tide,ember,beacon,reed,echo,loom';
  });
  check('Seven-badge saves preserve progress; Farwatch saves reload the Horizon Badge', () => {
    ready();S.badges=[...badges,'reed','echo','loom'];S.story.warden7=true;save();load();if(levelCap()!==70||!S.story.warden7||S.badges.length!==7)return false;
    S.badges.push('horizon');wb.placeAt('farwatch',26,10,'right');S.items={fw1:true};S.beaten={delka:true};save();reset();load();ensurePos();return S.pos.map==='farwatch'&&S.pos.x===26&&S.biome==='farwatch'&&levelCap()===75&&S.items.fw1&&S.beaten.delka;
  });
  check('Farwatch battle profile uses coastal lookouts, stones, water and fog', () => BATTLE_PLACES.farwatch.far==='ruins'&&BATTLE_PLACES.farwatch.near==='stones'&&BATTLE_PLACES.farwatch.fog>0&&BATTLE_PLACES.farwatch.water);
  for (const n of MAPS.farwatch.npcs.filter(n=>n.trainer)) check('Farwatch trainer '+n.who+' plays and records a real victory', () => {
    ready();S.badges=[...badges,'reed','echo','loom'];wb.placeAt('farwatch');talkTo(n);if(!TALK)return false;skipTalk();return B&&B.npc===n.who&&B.trainer===CAST[n.who].name&&finishFight()==='won'&&S.beaten[n.who];
  });
  // T30: league entry, the daily gauntlet and the finale through the existing battle flow.
  function leagueReady() { ready(); S.badges=Object.keys(BADGES); S.day=1; S.ranchT=0; wb.placeAt('league'); leagueState(); }
  check('League road checks every one of the eight badges, then walks both ways', () => {
    for(const missing of Object.keys(BADGES)){ready();S.badges=Object.keys(BADGES).filter(b=>b!==missing);wb.placeAt('farwatch',12,1,'up');wb.tryStep('up');if(S.pos.map!=='farwatch'||!W.msg.includes('eight badges'))return false;}
    leagueReady();wb.placeAt('farwatch',12,1,'up');wb.tryStep('up');if(S.pos.map!=='league'||S.pos.x!==3||S.pos.y!==16)return false;wb.tryStep('down');return S.pos.map==='farwatch'&&S.pos.x===12&&S.pos.y===1;
  });
  check('League is a connected, valid walkable hall with five courts and a gate battle', () => {
    leagueReady();const m=MAPS.league,seen=new Set(),todo=[m.start.slice(0,2)];
    while(todo.length){const [x,y]=todo.pop(),k=x+','+y;if(seen.has(k)||!walkable(m,x,y)||npcAt(m,x,y))continue;seen.add(k);for(const [dx,dy]of Object.values(DIRS))todo.push([x+dx,y+dy]);}
    for(let y=0;y<m.rows.length;y++)for(let x=0;x<m.rows[0].length;x++)if(walkable(m,x,y)&&!npcAt(m,x,y)&&!seen.has(x+','+y))return false;
    return !m.biome&&m.league&&m.npcs.filter(n=>typeof n.league==='number').length===5&&m.npcs.some(n=>n.league==='wren')&&m.npcs.every(n=>seen.has(n.at[0]+','+(n.at[1]+1)))&&seen.has('3,17');
  });
  const leagueBeats=STORY.filter(b=>b.league!==undefined);
  check('Four voiced league teams are 70-74, Champion is 74-76 and Wren brings her partner at 73', () => leagueBeats.length===6&&leagueBeats.slice(1,5).every(b=>b.team.length===3&&b.team.every(([id,l])=>SPECIES[id]&&l>=70&&l<=74)&&b.lines.length>=2&&b.win.length)&&leagueBeats.at(-1).team.every(([id,l])=>SPECIES[id]&&l>=74&&l<=76)&&leagueBeats[0].team.at(-1).join(',')==='$rival,73');
  check('Wren must be met before any court; courts cannot be skipped', () => {
    leagueReady();leagueTalk(4);if(B||TALK||!W.msg.includes('Wren'))return false;leagueTalk('wren');if(!TALK)return false;skipTalk();if(!B||B.story!=='leagueWren'||finishFight()!=='won'||!S.story.leagueWren||!leagueLocked())return false;
    leagueTalk(2);return !B&&!TALK&&W.msg.includes('listening court')&&S.league.room===0;
  });
  for(let room=0;room<5;room++)check('League room '+(room+1)+' uses a real story battle and heals after its result scene', () => {
    leagueReady();S.story.leagueWren=true;S.league.room=room;S.league.active=true;S.team[0].hp=Math.round(stOf(S.team[0]).hp*.6);leagueTalk(room);if(!TALK)return false;skipTalk();if(!B||B.story!==leagueBeats[room+1].id||B.leagueDay!==1)return false;
    if(finishFight()!=='won')return false;return S.league.room===room+1&&S.team.every(c=>c.hp===stOf(c).hp)&&(room<4?S.pos.x===7+(room+1)*7:S.titles.includes('Champion'));
  });
  check('A league loss returns to entrance, keeps cleared rooms today and permits an immediate retry', () => {
    leagueReady();S.story.leagueWren=true;S.league.room=2;S.league.active=true;leagueTalk(2);skipTalk();S.team[0].hp=0;endBattle('lost');wb.finishBattle();skipTalk();
    if(S.pos.map!=='league'||S.pos.x!==3||S.pos.y!==16||S.league.room!==2||!leagueLocked()||S.team[0].hp!==stOf(S.team[0]).hp)return false;
    leagueContinue();skipTalk();return B&&B.story==='league3';
  });
  check('Failed gate battle does not mark Wren won and retries at the gate', () => {
    leagueReady();leagueTalk('wren');skipTalk();endBattle('lost');wb.finishBattle();skipTalk();leagueContinue();skipTalk();return B&&B.story==='leagueWren'&&!S.story.leagueWren&&S.league.room===0;
  });
  check('Gauntlet blocks travel, free inn healing, exit and ranch/team swapping; leaving clears rooms', () => {
    leagueReady();S.story.leagueWren=true;S.league.active=true;S.league.room=2;S.team[0].hp=1;wb.travelTo('thornwood');wb.placeAt('league',3,16,'down');wb.tryStep('down');wb.S.tab='ranch';restInTown();
    const uid=S.team[0].uid;
    const button=document.createElement('button');button.dataset.act='toranch';button.dataset.arg=uid;document.body.append(button);button.click();button.remove();
    if(S.pos.map!=='league'||S.team[0].hp!==1||S.team[0].uid!==uid||!TABS.ranch.build().includes('stays together'))return false;
    leagueLeave();return S.pos.map==='farwatch'&&!leagueLocked()&&S.league.room===0;
  });
  check('Cleared rooms persist across a same-day save reload and expire the next ranch day', () => {
    leagueReady();S.story.leagueWren=true;S.league.active=true;S.league.room=3;save();reset();load();ensurePos();if(S.league.room!==3||!leagueLocked())return false;
    S.day++;leagueState();return S.league.room===0&&!leagueLocked()&&S.pos.x===3&&S.story.leagueWren;
  });
  check('A day boundary during battle cannot advance an expired attempt', () => {
    leagueReady();S.story.leagueWren=true;S.league.active=true;S.league.room=3;leagueTalk(3);skipTalk();S.day++;endBattle('won');wb.finishBattle();skipTalk();return S.league.room===0&&!S.story.league4&&!leagueLocked()&&S.pos.x===3;
  });
  check('Old eight-badge saves default a fresh league attempt without losing creatures, story or titles', () => {
    leagueReady();const uid=S.team[0].uid;S.titles=['Trail test'];S.story.warden8=true;delete S.league;save();reset();load();return S.team[0].uid===uid&&S.story.warden8&&S.badges.length===8&&S.titles.join(',')==='Trail test'&&S.league.room===0&&!leagueLocked()&&!S.story.leagueChampion;
  });
  check('Champion victory and ending are once-only, recorded in Journal, and do not unlock unbuilt 3D or cap 100', () => {
    leagueReady();S.story.leagueWren=true;S.league.active=true;S.league.room=4;const eras=JSON.stringify(S.eras);leagueTalk(4);skipTalk();if(finishFight()!=='won')return false;
    if(!S.story.leagueChampion||!S.story.leagueEnding||!S.titles.includes('Champion')||!leagueJournal().includes('fully restored')||levelCap()!==75||JSON.stringify(S.eras)!==eras||leagueLocked())return false;
    const count=S.log.length;leagueTalk(4);skipTalk();save();reset();load();return S.titles.filter(t=>t==='Champion').length===1&&S.story.leagueEnding&&S.log.length===count;
  });
  check('Reload during a healing rest resumes the rest before allowing the next room', () => {
    leagueReady();S.story.leagueWren=true;S.league.active=true;leagueTalk(0);skipTalk();endBattle('won');S.team[0].hp=1;save();reset();load();leagueContinue();if(!TALK||B||S.league.room!==1||!S.league.rest)return false;skipTalk();return !S.league.rest&&S.team[0].hp===stOf(S.team[0]).hp;
  });
  check('Reload between Champion result and ending resumes the finale safely', () => {
    leagueReady();S.story.leagueWren=true;S.league.active=true;S.league.room=4;leagueTalk(4);skipTalk();endBattle('won');save();reset();load();wb.placeAt('league');leagueContinue();if(!TALK)return false;skipTalk();return S.story.leagueEnding&&S.titles.includes('Champion')&&!leagueLocked();
  });
  check('League tune, weather and backdrop select the hall without adding a wild biome', () => {
    leagueReady();const t=TRACKS.league;return musicKey()==='league'&&WEATHER.league.includes(weatherNow())&&BATTLE_PLACES.league.far==='ruins'&&t.mel.split(' ').length===32&&[...t.mel.split(' '),...t.bass.split(' ')].every(n=>n==='.'||ArcadeSound.hz(n)>0)&&!BIOMES.league&&!roamOn();
  });
  check('Ending includes Wren, Maren, Isolde and free guardians without requiring any capture', () => SCENES.leagueEnding.some(([who])=>who==='wren')&&SCENES.leagueEnding.some(([who])=>who==='maren')&&SCENES.leagueEnding.some(([who])=>who==='isolde')&&SCENES.leagueEnding.some(([,t])=>t.includes('guardians')));
  // Living battle backdrops: real canvas calls across routes, eras, weather and reduced motion.
  check('Battle scenery draws each route and weather without changing the save or battle', () => {
    ready();S.badges=Object.keys(BADGES);const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;
    const oldCx=cx,oldPW=PW,oldPH=PH;try{cx=canvas.getContext('2d');PW=320;PH=180;
      for(const id of Object.keys(BIOMES)){
        wb.placeAt(id);startBattle('wild',[wb.newCreature('ripplet',2)]);
        for(const day of [1,3,6])for(const part of [0,.5,.8]){S.day=day;S.ranchT=part*DAY_SECONDS;const before=JSON.stringify({S,B});
          if(drawBattleBackdrop(12)!==144||JSON.stringify({S,B})!==before)return false;}
        B=null;
      }return true;
    }finally{cx=oldCx;PW=oldPW;PH=oldPH;B=null;}
  });
  check('Reduced-motion battle backgrounds stay identical at different animation times', () => {
    ready();S.badges=Object.keys(BADGES);const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;
    const oldCx=cx,oldPW=PW,oldPH=PH,oldReduce=reduceMotion;try{cx=canvas.getContext('2d');PW=320;PH=180;reduceMotion=true;
      for(const id of Object.keys(BIOMES)){wb.placeAt(id);S.day=3;S.ranchT=.8*DAY_SECONDS;drawBattleBackdrop(1);
        const a=Array.from(cx.getImageData(0,0,320,180).data);drawBattleBackdrop(90);const b=cx.getImageData(0,0,320,180).data;
        if(a.some((n,i)=>n!==b[i]))return false;}
      return true;
    }finally{cx=oldCx;PW=oldPW;PH=oldPH;reduceMotion=oldReduce;}
  });
  // Challenge cosmetics use saved titles, never statistics or a new reward currency.
  check('A new ranch shows four locked pennants without changing the save', () => {
    ready();const before=JSON.stringify(S),node=document.createElement('div');node.innerHTML=ranchPennantsHTML();
    return node.querySelectorAll('[data-earned="false"]').length===4&&node.querySelectorAll('[data-earned="true"]').length===0&&node.textContent.includes('0/4 displayed')&&JSON.stringify(S)===before;
  });
  for(const [mode,data] of Object.entries(MODES))check(mode+': only its earned title displays the matching pennant', () => {
    ready();S.titles=[data.title];const before=JSON.stringify(S),node=document.createElement('div');node.innerHTML=ranchPennantsHTML();
    return node.querySelectorAll('[data-earned="true"]').length===1&&node.querySelector('[data-earned="true"]').dataset.pennant===mode&&node.textContent.includes(data.title)&&JSON.stringify(S)===before;
  });
  check('The real title award refreshes Ranch pennants without waiting for a new day', () => {
    ready();S.tab='ranch';S.modes={solo:true};S.badges=Object.keys(BADGES);renderTabs(true);
    if($('#tabbody').querySelector('[data-earned="true"]'))return false;checkTitles();renderTabs(false);
    return S.titles.includes(MODES.solo.title)&&$('#tabbody').querySelector('[data-earned="true"]').dataset.pennant==='solo'&&$('#tabbody').querySelectorAll('[data-earned="true"]').length===1;
  });
  check('Earned pennants persist through loading and do not require the mode to stay active', () => {
    ready();S.titles=Object.values(MODES).map(m=>m.title);S.modes={};save();reset();load();const node=document.createElement('div');node.innerHTML=ranchPennantsHTML();
    return node.querySelectorAll('[data-earned="true"]').length===4&&S.titles.length===4;
  });
  check('An old save without titles loads locked pennants and unknown titles unlock none', () => {
    ready();delete S.titles;save();reset();load();if(S.titles.length!==0)return false;S.titles=['A future title'];const node=document.createElement('div');node.innerHTML=ranchPennantsHTML();return node.querySelectorAll('[data-earned="true"]').length===0;
  });
  check('Rain audio follows the route and stops in town, before Tide and before starting', () => {
    ready();wb.placeAt('saltmarsh');S.day=1;S.ranchT=0;if(rainLevel()!==0)return false;
    S.badges=['thorn','tide'];for(let day=1;day<=97;day++){S.day=day;const expected=weatherNow()==='rain'?(stormy()?1:.65):0;if(rainLevel()!==expected)return false;}
    wb.placeAt('larkhaven');if(rainLevel()!==0)return false;wb.placeAt('saltmarsh');S.started=false;return rainLevel()===0;
  });
  // T24: exercise the same walking, dialogue and battle paths as the game.
  function finishFight() {
    let ticks = 0;
    while (B && !B.over && ticks++ < 10000) {
      if (B.tele) wb.command('guard');
      else if (B.cmd >= 2 && living('a').some(u => u.c.hp < u.st.hp * 0.5)) wb.command('rally');
      else wb.command('focus');
      wb.worldTick(0.1);
    }
    const result = B && B.over;
    if (result) { wb.finishBattle(); skipTalk(); }
    return result;
  }
  function beside(map, x, y) {
    for (const [dir, [dx, dy]] of Object.entries(DIRS)) {
      const px = x - dx, py = y - dy;
      if (walkable(map, px, py) && !npcAt(map, px, py) && !TILES[tile(map, px, py)].exit && !TILES[tile(map, px, py)].sign) return [px, py, dir];
    }
    throw Error('No walkable approach at ' + x + ',' + y);
  }
  const trainers = Object.entries(MAPS).flatMap(([map, m]) => (m.npcs || []).filter(n => n.trainer).map(n => ({ map, n })));
  for (const { map, n } of trainers) {
    check(map + ': walking into ' + n.who + "'s sight starts a trainer scene and battle", () => {
      ready(); const m = MAPS[map], [dx, dy] = DIRS[n.dir];
      const x = n.at[0] + dx, y = n.at[1] + dy;
      const [px, py, dir] = beside(m, x, y); wb.placeAt(map, px, py, dir);
      if (!walk(x, y) || !WK.spot || WK.spot.n.who !== n.who) return false;
      for (let i = 0; i < 30 && !TALK; i++) wb.worldTick(0.1);
      const scene = !!TALK && TALK.lines[0][0] === n.who; skipTalk();
      return scene && B && B.kind === 'trainer' && B.npc === n.who && B.trainer === CAST[n.who].name;
    });
    check(map + ': victory records ' + n.who + ' and talking again plays after dialogue', () => {
      ready(); wb.placeAt(map); talkTo(n); skipTalk();
      if (finishFight() !== 'won' || !S.beaten[n.who]) return false;
      talkTo(n); const expected = n.trainer.after || n.trainer.win;
      return !B && !!TALK && JSON.stringify(TALK.lines) === JSON.stringify(expected.map(([who, text]) => [who, fillText(text)]));
    });
    check(map + ': losing to ' + n.who + ' prevents another sight challenge until changing maps', () => {
      ready(); wb.placeAt(map); S.team = [wb.newCreature('ripplet', 1)]; S.team[0].hp = 1;
      talkTo(n); skipTalk();
      let ticks = 0; while (B && !B.over && ticks++ < 10000) { if (B.wait) wb.chooseTurn(movesOf(B.wait.c).find(m => !(B.wait.cds[m] > 0))); wb.worldTick(0.1); }
      if (!B || B.over !== 'lost' || !WK.cool[n.who] || S.beaten && S.beaten[n.who]) return false;
      wb.finishBattle(); skipTalk();
      const [dx, dy] = DIRS[n.dir], x = n.at[0] + dx, y = n.at[1] + dy;
      wb.placeAt(map, x, y); if (spotted(MAPS[map]) || WK.spot) return false;
      wb.placeAt('larkhaven'); wb.placeAt(map, x, y);
      return !WK.cool[n.who] && spotted(MAPS[map]) && WK.spot.n.who === n.who;
    });
  }
  for (const [id, m] of Object.entries(MAPS)) {
    for (const it of m.items || []) check(id + ': walking picks up ' + it.id + ' exactly once', () => {
      ready(); ensureRanch(); const [x, y] = it.at, [px, py, dir] = beside(m, x, y);
      wb.placeAt(id, px, py, dir);
      const before = { coins: S.coins, lures: S.lures, ...S.food };
      wb.tryStep(dir);
      if (S.pos.x !== x || S.pos.y !== y || !S.items[it.id]) return false;
      for (const [key, amount] of Object.entries(it.give)) if ((key === 'coins' || key === 'lures' ? S[key] : S.food[key]) !== before[key] + amount) return false;
      const after = JSON.stringify({ coins: S.coins, lures: S.lures, food: S.food });
      wb.placeAt(id, px, py, dir); wb.tryStep(dir);
      return !itemsLeft(m).some(i => i.id === it.id) && after === JSON.stringify({ coins: S.coins, lures: S.lures, food: S.food });
    });
    for (const [at, words] of Object.entries(m.signs || {})) check(id + ': sign ' + at + ' shows its text and blocks movement', () => {
      ready(); const [x, y] = at.split(',').map(Number), [px, py, dir] = beside(m, x, y);
      wb.placeAt(id, px, py, dir); wb.tryStep(dir);
      return !!TILES[tile(m, x, y)].sign && S.pos.x === px && S.pos.y === py && W.msg === 'The sign reads: "' + words + '"';
    });
  }
  check('Riding requires the Ember Badge and a conscious partner', () => {
    ready(); toggleRide(); if (S.ride) return false;
    S.badges = ['ember']; S.team[0].hp = 0; toggleRide(); if (S.ride) return false;
    healAll(); toggleRide(); return S.ride && rideOK() && speedNow() === RIDE_SPEED;
  });
  check('Riding toggles off and cannot toggle during battle or dialogue', () => {
    ready(); S.badges = ['ember']; toggleRide(); toggleRide(); if (S.ride) return false;
    talk([['maren', 'Wait here.']]); toggleRide(); if (S.ride) return false; skipTalk();
    startBattle('wild', [wb.newCreature('ripplet', 2)]); toggleRide(); return !S.ride;
  });
  check('Boots and Shift run; Auto always walks even while riding', () => {
    ready(); WK.run = true; if (speedNow() !== WALK_SPEED) return false;
    S.shoes = true; if (speedNow() !== RUN_SPEED) return false;
    S.badges = ['ember']; toggleRide(); if (speedNow() !== RIDE_SPEED) return false;
    S.auto = true; return speedNow() === WALK_SPEED;
  });
  check('New saves start with only the Pocket era', () => { reset(); return S.era === 'pocket' && JSON.stringify(S.eras) === '["pocket"]' && !S.shoes; });
  for (const [gate, era, before, prior] of [
    ['thorn', 'bit16', 'pocket', []], ['tide', 'hd', 'bit16', ['thorn']], ['ember', 'diorama', 'hd', ['thorn', 'tide']]
  ]) check(gate + ': real Warden victory unlocks and switches art eras', () => {
    ready(); S.badges = prior.slice(); S.era = before;
    S.eras = ['pocket', ...(prior.includes('thorn') ? ['pixel', 'bit16'] : []), ...(prior.includes('tide') ? ['hd'] : [])];
    const g = STORY.find(b => b.gate === gate), map = Object.keys(MAPS).find(id => MAPS[id].biome === (g.biome || 'thornwood'));
    wb.placeAt(map); S.explored = g.at; S.exploredIn = { [S.biome]: g.at }; wb.challengeWarden(); skipTalk();
    // Accelerate only this scenario's scheduled color/depth/solid scene. Restore the real timer even on failure.
    const timer = window.setTimeout, scenes = [];
    window.setTimeout = (fn, delay, ...args) => delay === 900 ? (scenes.push(() => fn(...args)), 0) : timer(fn, delay, ...args);
    try {
      if (finishFight() !== 'won') return false;
      for (const scene of scenes) scene();
      const changed = S.badges.includes(gate) && S.era === era && S.eras.includes(era) && !!TALK;
      skipTalk(); return changed && (gate !== 'thorn' || S.shoes && S.eras.includes('pixel'));
    } finally { window.setTimeout = timer; }
  });
  for (let n = 0; n <= 3; n++) check('Old save with ' + n + ' badges recovers its earned eras and boots', () => {
    ready(); S.badges = badges.slice(0, n); S.era = 'pixel'; S.eras = ['pixel']; delete S.shoes;
    save(); load();
    const expected = ['pocket', 'pixel', ...(n >= 1 ? ['bit16'] : []), ...(n >= 2 ? ['hd'] : []), ...(n >= 3 ? ['diorama'] : [])];
    return S.era === 'pixel' && expected.every(e => S.eras.includes(e)) && !!S.shoes === (n >= 1);
  });
  check('Darkness arrives with Thorn, rises at dusk, and reaches night', () => {
    ready(); S.ranchT = DAY_SECONDS * 0.8; if (darkness() !== 0 || isNight()) return false;
    S.badges = ['thorn']; if (!isNight() || darkness() !== 1) return false;
    S.ranchT = DAY_SECONDS * 0.7; if (!(darkness() > 0 && darkness() < 1) || isNight()) return false;
    S.ranchT = 0; return darkness() === 0 && !isNight();
  });
  function shareOf(element) {
    // Stratified uniform draws test the distribution without a probabilistic pass/fail threshold.
    const random = Math.random; let sample = 0, found = 0;
    Math.random = () => (sample + 0.5) / 2000;
    try { for (; sample < 2000; sample++) if (SPECIES[wildPick()].el === element) found++; }
    finally { Math.random = random; }
    return found;
  }
  check('Night increases Shade wild picks over daylight', () => {
    ready(); wb.placeAt('thornwood'); S.badges = ['thorn']; S.ranchT = 0; const day = shareOf('Shade');
    S.ranchT = DAY_SECONDS * 0.8; return shareOf('Shade') > day;
  });
  check('Weather stays clear before Tide and in town', () => {
    ready(); wb.placeAt('saltmarsh'); S.day = 1; S.ranchT = 0;
    if (weatherNow() !== 'clear') return false;
    S.badges = ['tide']; wb.placeAt('larkhaven'); return weatherNow() === 'clear';
  });
  check('Rain increases Tide wild picks compared with clear weather', () => {
    ready(); wb.placeAt('saltmarsh'); S.badges = ['thorn', 'tide']; S.ranchT = 0;
    const dayFor = weather => { for (let day = 1; day <= 100; day++) { S.day = day; if (weatherNow() === weather) return true; } return false; };
    if (!dayFor('clear')) return false; const clear = shareOf('Tide');
    return dayFor('rain') && shareOf('Tide') > clear;
  });
  // Trail forecast: compare predicted conditions to the live walking scene across day rollover.
  check('Forecast stays locked before Tide and hides unopened routes', () => {
    ready();if(weatherForecast('thornwood').length||!forecastHTML().includes('Earn the Tide Badge'))return false;
    S.badges=['thorn','tide'];return weatherForecast('stillreed').length===0&&weatherForecast('missing').length===0&&!forecastHTML().includes('Stillreed Basin');
  });
  check('Reading route forecasts leaves the save and clock untouched, including in town', () => {
    ready();S.badges=badges.slice();wb.placeAt('larkhaven');S.day=9;S.ranchT=245;const before=JSON.stringify(S);
    for(const id of Object.keys(BIOMES))weatherForecast(id);forecastHTML();return JSON.stringify(S)===before&&weatherNow()==='clear'&&weatherForecast('cloudglass').length===3;
  });
  for(const id of Object.keys(BIOMES))check(id+': every forecast period matches the live scene, including day rollover', () => {
    ready();S.badges=Object.keys(BADGES);wb.placeAt(id);
    for(const day of [1,4,13,97,98])for(let segment=0;segment<3;segment++){
      S.day=day;S.ranchT=(segment+0.2)*DAY_SECONDS/3;const forecast=weatherForecast(id);
      if(forecast.length!==3)return false;
      for(let i=0;i<3;i++){const f=forecast[i];if(f.day!==day+Math.floor((segment+i)/3)||f.segment!==(segment+i)%3)return false;
        S.day=f.day;S.ranchT=(f.segment+0.2)*DAY_SECONDS/3;if(weatherNow()!==f.weather)return false;}
    }return true;
  });
  check('Journal forecast refreshes at the period boundary without a new log entry', () => {
    ready();S.badges=badges.slice();wb.placeAt('saltmarsh');S.tab='journal';S.day=4;S.ranchT=DAY_SECONDS/3-0.05;renderTabs(true);
    const before=$('#tabbody').innerHTML;wb.worldTick(0.1);renderTabs(false);
    return before!==$('#tabbody').innerHTML&&$('#tabbody').textContent.includes('Now:')&&$('#tabbody').textContent.includes('period 2')&&$('#tabbody').textContent.includes('Saltmarsh Coast · here');
  });
  check('Journal forecast follows travel and refreshes over the ranch day boundary', () => {
    ready();S.badges=badges.slice();S.tab='journal';S.day=4;S.ranchT=DAY_SECONDS-0.05;wb.placeAt('cloudglass');renderTabs(true);
    wb.worldTick(0.1);wb.placeAt('stillreed');renderTabs(false);const text=$('#tabbody').textContent;
    return text.includes('Stillreed Basin · here')&&!text.includes('Cloudglass Pass · here')&&text.includes('Now:')&&text.includes('day 5, period 1');
  });
  check('Visible wild creatures appear only after Tide and outside town', () => {
    ready(); wb.placeAt('thornwood'); roamTick(13); if (WK.roam.length) return false;
    S.badges = ['tide']; for (let i = 0; i < 3; i++) roamTick(13);
    if (WK.roam.length !== 3 || !WK.roam.every(r => tile(curMap(), r.x, r.y) === '"' && SPECIES[r.sp])) return false;
    wb.placeAt('larkhaven'); roamTick(13); return WK.roam.length === 0;
  });
  check('Walking onto a visible creature starts a wild battle with its species', () => {
    ready(); S.badges = ['tide']; wb.placeAt('thornwood'); roamTick(13);
    const r = WK.roam[0], [px, py, dir] = beside(curMap(), r.x, r.y); wb.placeAt('thornwood', px, py, dir); wb.tryStep(dir);
    return B && B.kind === 'wild' && B.foes[0].c.sp === r.sp && B.foes[0].c.lvl === r.lvl && !WK.roam.includes(r);
  });
  check('Choosing Nuzlocke stores the selected mode', () => {
    reset(); wb.chooseStarter('ripplet', 'Modecheck', 'classic', { nuzlocke: true });
    return S.modes.nuzlocke && modeOn('nuzlocke') && !modeOn('solo');
  });
  check('Nuzlocke allows the first meeting but refuses a second lure in an area', () => {
    ready(); wb.placeAt('thornwood'); S.modes = { nuzlocke: true };
    startBattle('wild', [wb.newCreature('ripplet', 2)]); wb.command('lure');
    if (!B.firstMeet || !B.capture) return false;
    B.capture = null; wb.command('flee'); wb.finishBattle();
    startBattle('wild', [wb.newCreature('ripplet', 2)]); const lures = S.lures; wb.command('lure');
    return S.metIn.thornwood && !B.firstMeet && !B.capture && S.lures === lures && B.lines.some(l => l.t.includes('Nuzlocke:'));
  });
  check('Nuzlocke releases a fainted partner after an actual battle', () => {
    ready(); S.modes = { nuzlocke: true }; const fallen = wb.newCreature('ripplet', 1); fallen.hp = 0; S.team.push(fallen);
    startBattle('wild', [wb.newCreature('ripplet', 2)]);
    return finishFight() === 'won' && !S.team.some(c => c.uid === fallen.uid) && !S.ranch.some(c => c.uid === fallen.uid) && !S.modes.nuzlockeEnded;
  });
  check('An empty Nuzlocke team ends the run gently with a second-chance partner', () => {
    ready(); S.modes = { nuzlocke: true }; S.team = [wb.newCreature('ripplet', 1)]; S.team[0].hp = 1;
    startBattle('wild', [wb.newCreature('tidewyrm', 100)]);
    let ticks = 0; while (B && !B.over && ticks++ < 10000) { if (B.wait) wb.chooseTurn(movesOf(B.wait.c).find(m => !(B.wait.cds[m] > 0))); wb.worldTick(0.1); }
    if (!B || B.over !== 'lost') return false; wb.finishBattle();
    return !S.modes.nuzlocke && S.modes.nuzlockeEnded && S.team.length === 1 && S.team[0].hp > 0 && !!TALK && TALK.lines.some(([who]) => who === 'maren');
  });
  check('Solo permits one teammate and sends an actual catch to the ranch', () => {
    ready(); S.modes = { solo: true }; startBattle('wild', [wb.newCreature('ripplet', 2, { rar: 0 })]);
    wb.command('lure'); if (!B.capture) return false; B.capture.pos = B.capture.zone;
    const random = Math.random; Math.random = () => 0;
    try { calmNow(); } finally { Math.random = random; }
    return teamMax() === 1 && S.team.length === 1 && S.ranch.length === 1 && S.ranch[0].sp === 'ripplet' && B.over === 'caught';
  });
  check('Hardcore refuses Rally without spending points or healing', () => {
    ready(); S.modes = { hardcore: true }; startBattle('wild', [wb.newCreature('ripplet', 2)]);
    B.cmd = 3; S.team[0].hp = Math.floor(stOf(S.team[0]).hp / 2); const hp = S.team[0].hp; wb.command('rally');
    return S.team[0].hp === hp && B.cmd === 3 && B.lines.some(l => l.t.includes('Hardcore: no Rally'));
  });
  check('Randomizer is a stable permutation for one seed, including after save/load', () => {
    ready(); S.modes = { randomizer: true, seed: 123456 }; RANDOM_MAP = RANDOM_SEED = null;
    const pool = [...new Set(Object.values(BIOMES).flatMap(b => b.wild.map(([id]) => id)))].sort();
    const shuffled = pool.map(randomized); if (JSON.stringify(shuffled.slice().sort()) !== JSON.stringify(pool)) return false;
    save(); load(); RANDOM_MAP = RANDOM_SEED = null;
    return JSON.stringify(pool.map(randomized)) === JSON.stringify(shuffled) && shuffled.some((id, i) => id !== pool[i]);
  });
  for (const g of STORY.filter(b => b.gate)) check(g.trainer + ': talking starts a rematch, victory advances its tier, and the same day is blocked', () => {
    ready(); S.story[g.id] = true; S.badges = badges.slice(); S.capMode = 'off';
    S.team = [wb.newCreature('tidewyrm', Math.max(50,g.team.at(-1)[1]+6), { rar: 4, temp: 'steady', traits: ['ferocious', 'thick'], pot: Object.fromEntries(Cr.STATS.map(k => [k, 31])) })];
    const map = Object.keys(MAPS).find(id => MAPS[id].biome === (g.biome || 'thornwood')); wb.placeAt(map);
    const npc = npcsOf(curMap()).find(n => n.warden && n.warden.id === g.id); talkTo(npc); if (!TALK) return false; skipTalk();
    if (!B || B.kind !== 'trainer' || B.rematch !== g.id || B.tier !== 1 || finishFight() !== 'won') return false;
    if (S.rematch[g.id] !== 1 || rematchReady(g.id)) return false;
    talkTo(npc); const blocked = !!TALK && !B && TALK.lines.some(([, text]) => text.includes('tomorrow')); skipTalk();
    S.day++; return blocked && rematchReady(g.id) && rematchTier(g.id) === 2;
  });
  check('Wren appears in Larkhaven after rival2 and offers a trainer rematch', () => {
    ready(); if (wrenNpc() || npcsOf(MAPS.larkhaven).some(n => n.rematch === 'wren')) return false;
    S.story.rival2 = true; const npc = npcsOf(MAPS.larkhaven).find(n => n.rematch === 'wren');
    if (!npc || JSON.stringify(npc.at) !== JSON.stringify(WREN_SPOT.at)) return false;
    talkTo(npc); skipTalk(); return B && B.kind === 'trainer' && B.rematch === 'wren' && B.trainer === CAST.wren.name;
  });
  for (const biome of Object.keys(BIOMES)) check(biome + ': mastery counts each of its three stars independently', () => {
    ready(); const map = MAPS[biome], g = STORY.find(b => b.gate && (b.biome || 'thornwood') === biome);
    if (!map || !g || masteryOf(biome).stars !== 0) return false;
    for (const [id] of BIOMES[biome].wild) S.caught[id] = true;
    let m = masteryOf(biome); if (m.stars !== 1 || !m.dex || m.warden || m.secrets) return false;
    S.rematch[g.id] = 2; if (masteryOf(biome).stars !== 1) return false;
    S.rematch[g.id] = 3; m = masteryOf(biome); if (m.stars !== 2 || !m.warden) return false;
    S.items = Object.fromEntries((map.items || []).map(it => [it.id, true]));
    if (masteryOf(biome).secrets) return false;
    S.beaten = Object.fromEntries((map.npcs || []).filter(n => n.trainer).map(n => [n.who, true]));
    m = masteryOf(biome); return m.stars === 3 && m.dex && m.warden && m.secrets && m.hasWarden;
  });
  // T31: exercise real state transitions, reward accounting and the walkable post-game gates.
  function spireReady() { ready(); S.badges=Object.keys(BADGES); S.story.leagueEnding=S.story.leagueChampion=true; S.titles=['Champion']; S.eras=['pocket','pixel','bit16','hd','diorama']; ensureRanch(); placeAt('spire'); }
  function spireWin() { towerFight(); skipTalk(); if (!B || !B.towerFloor) return false; endBattle('won'); finishBattle(); skipTalk(); return true; }
  check('Spire road is locked before the ending and open afterward',()=>{
    ready();S.badges=Object.keys(BADGES);placeAt('league',1,15,'left');tryStep('left');if(S.pos.map!=='league'||!W.msg.includes('Champion ending'))return false;
    S.story.leagueEnding=true;tryStep('left');return S.pos.map==='spire'&&S.pos.x===17&&S.pos.y===14;
  });
  check('Spire exit returns to the league and an active climb cannot walk out',()=>{
    spireReady();placeAt('spire',17,14,'right');towerState().active=true;tryStep('right');if(S.pos.map!=='spire')return false;
    towerState().active=false;tryStep('right');return S.pos.map==='league'&&S.pos.x===1&&S.pos.y===15;
  });
  check('Tower start is rejected before the ending, outside the Spire, during battle or dialogue',()=>{
    ready();placeAt('spire');towerStart();if(B||TALK||towerState().active)return false;
    S.story.leagueEnding=true;placeAt('league');towerStart();if(B||TALK||towerState().active)return false;
    placeAt('spire');talk([['orla','Wait.']]);towerStart();if(towerState().active)return false;skipTalk();return true;
  });
  for(const [floor,level] of [[1,75],[5,79],[10,84],[20,94],[26,100],[30,100],[100,100]])check('Spire floor '+floor+' has level '+level+' and valid evolved trainer partners',()=>{
    const f=towerFloor(floor);return f.level===level&&f.team.length===3&&f.team.every(id=>SPECIES[id]&&!SPECIES[id].unique&&(!SPECIES[id].evo||SPECIES[id].evo.at>level))&&CAST[f.who];
  });
  check('Spire floor bands draw teams from all eight regions',()=>new Set(Array.from({length:30},(_,i)=>towerFloor(i+1).area)).size===8);
  check('Named regulars return at each tenth floor and their scene uses a valid speaker',()=>{
    spireReady();return [10,20,30,40].every(n=>{const f=towerFloor(n);return f.who===SPIRE_REGULARS[(n/10-1)%3]&&typeof SPIRE_LINES[f.who]==='string';});
  });
  check('Winning pays floor rewards exactly once and saves the best floor',()=>{
    spireReady();towerStart();skipTalk();const coins=S.coins,lures=S.lures;endBattle('won');towerResult('won');
    if(S.coins-coins!==towerReward(1,false).coins||S.lures-lures!==2||S.tower.floor!==1||S.tower.best!==1)return false;
    finishBattle();save();reset();load();return S.tower.best===1&&S.tower.floor===1&&S.tower.active&&towerJournal().includes('Best floor 1');
  });
  check('Only every fifth floor heals and pauses for the rest choice',()=>{
    spireReady();towerState().active=true;
    for(let i=1;i<=10;i++){towerFight();skipTalk();S.team[0].hp=1;endBattle('won');S.team[0].hp=1;finishBattle();skipTalk();
      if(i%5===0){if(!S.tower.rest||S.team[0].hp!==stOf(S.team[0]).hp)return false;towerContinue();skipTalk();}
      else if(S.tower.rest||S.team[0].hp!==1)return false;
      if(B){B=null;}
    }return S.tower.best===10;
  });
  check('Reloading a fifth-floor rest preserves the choice and heals before continuing',()=>{
    spireReady();Object.assign(towerState(),{active:true,floor:4,best:4});spireWin();save();reset();load();S.team[0].hp=1;
    if(!S.tower.rest||!towerPanel().includes('Keep climbing'))return false;towerContinue();skipTalk();return B&&B.towerFloor===6&&!S.tower.rest&&S.team[0].hp===stOf(S.team[0]).hp;
  });
  check('Loss ends the climb and preserves previous best and rewards',()=>{
    spireReady();Object.assign(towerState(),{active:true,floor:7,best:12});towerFight();skipTalk();const coins=S.coins,lures=S.lures;S.team[0].hp=0;endBattle('lost');finishBattle();skipTalk();
    return !S.tower.active&&!S.tower.rest&&S.tower.floor===0&&S.tower.best===12&&S.coins===coins&&S.lures===lures&&S.pos.map==='spire'&&S.team[0].hp>0&&!S.auto;
  });
  check('Leaving a climb keeps rewards and best, clears the run and permits ranch changes',()=>{
    spireReady();Object.assign(towerState(),{active:true,floor:8,best:8});const coins=S.coins;towerLeave();return S.pos.map==='league'&&!challengeLocked()&&S.tower.floor===0&&S.tower.best===8&&S.coins===coins;
  });
  for(const [floor,title] of [[10,'Spire Climber'],[20,'Beacon Companion'],[30,'Lightkeeper']])check('Milestone '+floor+' grants rare food, title and hatchable egg once across reloads',()=>{
    spireReady();const first=towerMilestone(floor);if(!first||S.food.lanternseed!==2||!S.titles.includes(title)||S.eggs.length!==1||S.eggs[0].child.rar!==2||S.eggs[0].days!==2)return false;
    save();reset();load();ensureRanch();if(towerMilestone(floor)||S.eggs.length!==1||S.food.lanternseed!==2)return false;
    newDay(true);if(S.eggs.length!==1)return false;newDay(true);return S.eggs.length===0&&everyone().some(c=>c.rar===2&&c.born.includes('floor '+floor))&&S.titles.filter(t=>t===title).length===1;
  });
  check('Auto receives less total coin/lure reward and less XP for the same floor',()=>{
    function earned(auto){spireReady();S.auto=auto;S.capMode='off';S.team=[newCreature('tidewyrm',75,{rar:4})];towerStart();skipTalk();const coin=S.coins,lure=S.lures;endBattle('won');return {coin:S.coins-coin,lure:S.lures-lure,xp:S.team[0].xp};}
    const active=earned(false),automatic=earned(true);return active.coin>automatic.coin&&active.lure>automatic.lure&&active.xp>automatic.xp;
  });
  check('Turning Auto off during a floor cannot reclaim its manual reward',()=>{
    spireReady();S.auto=true;towerStart();skipTalk();S.auto=false;const coins=S.coins;endBattle('won');return S.coins-coins===towerReward(1,true).coins;
  });
  check('Auto starts the next floor but waits for a fifth-floor rest choice',()=>{
    spireReady();S.auto=true;Object.assign(towerState(),{active:true,floor:1});towerTick();if(!TALK)return false;skipTalk();if(!B||B.towerFloor!==2)return false;B=null;S.tower.floor=5;S.tower.rest=true;towerTick();return !B&&!TALK;
  });
  check('An active climb locks free healing, travel and team swaps',()=>{
    spireReady();S.team.push(newCreature('bloomcourser',75));towerState().active=true;S.team[0].hp=1;restInTown();travelTo('thornwood');
    const button=document.createElement('button');button.dataset.act='toranch';button.dataset.arg=S.team[0].uid;document.body.append(button);button.click();button.remove();
    return S.pos.map==='spire'&&S.team[0].hp===1&&S.team.length===2&&TABS.ranch.build().includes('stays together');
  });
  for(const room of [0,1,2,3,4])check('League rematch '+room+' scales tiers, stamps attempts and is once each ranch day',()=>{
    spireReady();placeAt('league');const b=STORY.find(x=>x.league===room);startLeagueRematch(room);if(!TALK||!TALK.lines.some(([,s])=>s===leagueRematchLines[castKeyOf(b.trainer)]))return false;skipTalk();
    if(!B||B.rematch!==b.id||B.tier!==1||rematchReady(b.id))return false;endBattle('won');finishBattle();skipTalk();if(S.rematch[b.id]!==1)return false;
    startLeagueRematch(room);skipTalk();if(B)return false;save();reset();load();placeAt('league');startLeagueRematch(room);skipTalk();if(B)return false;
    S.day++;startLeagueRematch(room);skipTalk();return B&&B.tier===2&&B.foes.every(u=>u.c.lvl<=100);
  });
  check('Losing a league rematch consumes today but does not advance its tier',()=>{
    spireReady();placeAt('league');startLeagueRematch(4);skipTalk();endBattle('lost');finishBattle();skipTalk();return !rematchReady('leagueChampion')&&rematchTier('leagueChampion')===1;
  });
  check('Pre-Champion saves cannot start league rematches',()=>{ready();placeAt('league');startLeagueRematch(0);return !B&&!TALK&&!S.rematchDay;});
  check('Old Champion save gains safe tower defaults without changing cap, era or creature identity',()=>{
    spireReady();delete S.tower;const uid=S.team[0].uid,eras=JSON.stringify(S.eras),cap=S.capMode;save();reset();load();return S.tower.best===0&&!S.tower.active&&S.tower.claimed.length===0&&S.team[0].uid===uid&&S.capMode===cap&&levelCap()===75&&JSON.stringify(S.eras)===eras&&S.titles.includes('Champion');
  });
  check('Invalid tower fields normalize without unlocking a pre-Champion climb',()=>{ready();S.tower={best:-3,floor:Infinity,active:true,rest:true,claimed:[10,10,'20',-10,7]};const t=towerState();return t.best===0&&t.floor===0&&!t.active&&!t.rest&&t.claimed.join(',')==='10';});
  // The start screen (Evan's first-play notes): pick shows a page, nothing starts until Begin; names; modes locked
  check('the start screen asks you to choose before it starts, and Begin waits for a pick', () => {
    const keep = START.pick; START.pick = null;
    try { const html = startHTML(); return /data-act="pickstarter"/.test(html) && /id="beginBtn"[^>]*disabled/.test(html) && !/data-act="starter"/.test(html) &&
      STORY_NAMES.every(n => html.includes('data-arg="' + n + '"')) && /namerand/.test(html); } finally { START.pick = keep; }
  });
  check("picking a partner shows its Wilddex page (stats, first moves, strengths)", () => {
    const html = starterCard('cindercub'); return /Health/.test(html) && /Starts with/.test(html) && /Strong against/.test(html);
  });
  check('challenge modes stay locked on a first journey and unlock once you are Champion', () => {
    const keep = localStorage.getItem('wildbond-modes-unlocked'), titles = wb.S.titles;
    try { localStorage.removeItem('wildbond-modes-unlocked'); wb.S.titles = [];
      const locked = !modesUnlocked() && /unlock for your next journey/.test(startHTML()) && !/data-act="mode"/.test(startHTML());
      wb.S.titles = ['Champion']; const open = modesUnlocked() && /data-act="mode"/.test(startHTML());
      return locked && open; }
    finally { wb.S.titles = titles; if (keep === null) localStorage.removeItem('wildbond-modes-unlocked'); else localStorage.setItem('wildbond-modes-unlocked', keep); }
  });
  check('every opening scene line is a real line (no swallowed lines)', () => ['intro', 'rival1', 'rival1Win'].every(k => SCENES[k].every(l => Array.isArray(l) && typeof l[1] === 'string' && l[1].length > 5)));
  // Evan's second play notes: turn-based battles, earned autopilot, faded colour, walking instead of menu buttons, roles
  check('a new journey starts turn-based, in faded colour, and the battle waits for your move', () => {
    reset(); wb.chooseStarter('ripplet', 'Test', 'classic'); skipTalk();
    if (S.battleStyle !== 'turn' || !S.faded || S.era === 'pocket' || !wb.B) return false;
    for (let i = 0; i < 40 && wb.B && !wb.B.wait; i++) wb.worldTick(0.2);
    const B = wb.B; if (!B || !B.wait) return false;
    const n0 = B.lines.length, hp0 = B.allies.concat(B.foes).map(u => u.c.hp).join(); for (let i = 0; i < 20; i++) wb.worldTick(0.5); // nothing happens while it waits (no autopilot before a badge)
    if (B.wait === null || B.lines.length !== n0 || B.allies.concat(B.foes).map(u => u.c.hp).join() !== hp0) return false;
    const m = movesOf(B.wait.c)[0]; chooseTurn(m); return B.wait === null && B.lines.some(l => l.t.includes(MOVES[m].name));
  });
  check('autopilot and Auto-explore are switched off for now, even with badges, and a day lasts an hour', () => {
    const keep = S.badges.slice(); try { S.badges = ['thorn', 'tide']; renderAll(); return !autoEarned() && document.querySelector('#autoBtn').hidden && DAY_SECONDS === 3600; } finally { S.badges = keep; }
  });
  check('the Thorn Badge lifts the faded colour', () => {
    ready(); S.faded = true; S.era = 'bit16'; S.badges = []; const g = STORY.find(b => b.gate === 'thorn'); wb.startBattle('trainer', [wb.newCreature('cindercub', 3)], { trainer: g.trainer, story: g.id });
    const st = window.setTimeout; window.setTimeout = fn => { fn(); return 0; }; // run the badge's delayed scene now
    try { storyWin(g.id); if (W.afterDone) { const d = W.afterDone; W.afterDone = null; d(); } } finally { window.setTimeout = st; }
    for (let i = 0; i < 10 && TALK; i++) skipTalk(); return !S.faded && S.eras.includes('pixel');
  });
  check('no menu buttons skip the world: no travel, rest, lure or search buttons while walking', () => {
    ready(); wb.placeAt('larkhaven'); S.badges = []; panelKey = ''; renderAll();
    const acts = [...document.querySelectorAll('#panel [data-act]')].map(b => b.dataset.act);
    return !['biome', 'rest', 'lures', 'explore', 'warden'].some(a => acts.includes(a));
  });
  check('creature cards say what a creature is good at, in full words', () => {
    const html = cardHTML(wb.newCreature('mosshog', 5), 0, true);
    return /(Tank|Bruiser|Caster|Skirmisher|All-rounder)<\/b>/.test(html) && /Power <b>/.test(html) && /cmoves/.test(html);
  });
  // L1 shared settings (shared/settings.js + js/18-settings.js)
  check('the Settings panel offers sound, graphics, view, text size, motion and Tell us', () => {
    const b = document.querySelector('.arc-set-btn'); if (!b) return false; b.click();
    const labels = [...document.querySelectorAll('.arc-set-row>div:first-child')].map(d => d.textContent).join();
    document.querySelector('.arc-set [data-close]').click();
    return labels === 'Battle style,Sound,Graphics,View distance,Text size,Motion,Tell us' && document.querySelector('.arc-set-bg').hidden;
  });
  check('text size scales the panels, never the scene canvas', () => {
    const keep = localStorage.getItem('arcade-settings-v1'), root = document.documentElement;
    try { document.querySelector('.arc-set-btn').click();
      [...document.querySelectorAll('.arc-set-opts button')].find(x => x.textContent === 'Larger').click();
      const ok = getComputedStyle(root).getPropertyValue('--arc-text').trim() === '1.3' && Number(getComputedStyle(document.querySelector('.right')).zoom) > 1.2 &&
        getComputedStyle(document.querySelector('.scene canvas')).zoom === '1';
      [...document.querySelectorAll('.arc-set-opts button')].find(x => x.textContent === 'Normal').click(); document.querySelector('.arc-set [data-close]').click();
      return ok; }
    finally { if (keep === null) localStorage.removeItem('arcade-settings-v1'); else localStorage.setItem('arcade-settings-v1', keep); }
  });
  check('keys pressed inside the Settings panel never walk the tamer', () => {
    const S = wb.S; if (!S.started || !S.pos) return true; document.querySelector('.arc-set-btn').click(); const before = JSON.stringify(S.pos);
    document.querySelector('.arc-set').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const ok = JSON.stringify(S.pos) === before && !wb.WK.held.length; document.querySelector('.arc-set [data-close]').click(); wb.WK.held = []; return ok;
  });
  // L2 save safety (shared/engine.js): automatic backups, recovery from a damaged save, any save format, validators
  check('saving keeps an automatic backup of the save', () => {
    const key = 'wildbond-save-v1'; save(); // the first save of a visit makes one; after that at most every 10 minutes
    const b = Arcade.backups(key).find(x => x.k.endsWith(':auto-recent'));
    return b && Arcade.validators[key](JSON.parse(b.data)) && b.ver === VERSION && Arcade.backups(key).some(x => x.k.includes(':auto-day-'));
  });
  check('a damaged save loads from the newest backup instead of starting over', () => {
    const key = 'wildbond-save-v1', good = localStorage.getItem(key);
    try { localStorage.setItem(key, '{"team":[broken'); const o = Arcade.load(key);
      document.querySelectorAll('[role="status"]').forEach(d => { if (/could not be read/.test(d.textContent)) d.remove(); });
      return o && Array.isArray(o.team) && Arcade.recovered[key]; }
    finally { localStorage.setItem(key, good); delete Arcade.recovered[key]; }
  });
  check('saves load from an exported code or a downloaded file alike', () => {
    const o = { team: [], ranch: [], coins: 7 };
    return Arcade.decodeAny(Arcade.encode(o)).coins === 7 && Arcade.decodeAny(JSON.stringify(o)).coins === 7;
  });
  check("another game's save is refused (validators)", () => {
    const v = Arcade.validators['wildbond-save-v1']; return v({ team: [], ranch: [] }) && !v({ chars: [], v: 2 });
  });
  check('the Journal shows Your save with download, load and backups', () => {
    const html = TABS.journal.build(); return /Your save/.test(html) && /data-arcsave="download"/.test(html) && /data-arcsave="file"/.test(html) && /Automatic backups/.test(html);
  });
  check('view distance cycles Close, Wide, Far and widens the view (L11)', () => {
    const S = wb.S, was = S.view, seen = [];
    try { S.view = 'near'; const m1 = viewMult(); for (let i = 0; i < 3; i++) { cycleView(); seen.push(S.view); }
      S.view = 'far'; renderViewBtn();
      return m1 === 1 && viewMult() > 1.5 && seen.join() === 'wide,far,near' && document.querySelector('#viewBtn').textContent === 'View: Far'; }
    finally { S.view = was; }
  });
  check('saves without a view choice fall back to a valid view', () => { const S = wb.S, was = S.view; try { delete S.view; return !!VIEWS[viewKey()]; } finally { S.view = was; } });
  check('arrow keys inside the feedback menu never walk the tamer', () => {
    const box = document.querySelector('.feedback-container'); if (!box) return true;
    const S = wb.S; if (!S.started || !S.pos) return true; const before = JSON.stringify(S.pos);
    box.querySelector('button').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const ok = JSON.stringify(S.pos) === before && !wb.WK.held.length; wb.WK.held = []; return ok;
  });
  check('Healing changes the team-tab render key so the rest shows full health',()=>{spireReady();S.team[0].hp=1;const before=TABS.team.key();healAll();return TABS.team.key()!==before&&TABS.team.build().includes(S.team[0].hp+'/'+stOf(S.team[0]).hp);});
  check('Lantern seed uses normal ranch care and cannot create a free shop purchase',()=>{spireReady();const cost=FOODS.lanternseed.cost;S.coins=cost;buyFood('lanternseed',1);ensureCare(S.team[0]);S.team[0].plan={food:'lanternseed',act:'rest'};const before=S.team[0].train.wit||0;newDay(true);return cost>0&&S.coins===0&&S.food.lanternseed===0&&S.team[0].train.wit===before+1;});
  check('Milestone eggs that hatch during a climb stay on the ranch without changing its team',()=>{spireReady();towerState().active=true;towerMilestone(10);const uid=S.team[0].uid;newDay(true);newDay(true);return S.team.length===1&&S.team[0].uid===uid&&S.ranch.length===1&&S.ranch[0].rar===2;});
  check('Fleeing a Spire battle ends the climb without awarding the skipped floor',()=>{spireReady();Object.assign(towerState(),{active:true,floor:2,best:2});towerFight();skipTalk();const coins=S.coins;endBattle('fled');finishBattle();skipTalk();return !S.tower.active&&S.tower.floor===0&&S.tower.best===2&&S.coins===coins;});

  // G2 Saltmarsh: inspect the real scene calls, then restore every rendering hook.
  function coastalAir(weather, part, light = true, biome = 'saltmarsh') {
    ready(); S.badges = ['thorn', 'tide']; wb.placeAt(biome); S.ranchT = DAY_SECONDS * part;
    for (S.day = 1; S.day < 100 && weatherNow() !== weather; S.day++);
    if (weatherNow() !== weather) throw Error('No fixture weather');
    const out = {}, hooks = [], size = [PW, PH], cam = WK.cam; PW = 320; PH = 180; WK.cam = null;
    const hook = (obj, key, fn) => { hooks.push([obj, key, obj[key]]); obj[key] = fn; };
    for (const key of ['fog', 'grade', 'shafts']) hook(WLT, key, (...args) => { out[key] = args.at(-1); });
    hook(WLT, 'bloom', () => {});
    hook(AMB, 'weather', (...args) => { out.weather = args.at(-1); });
    for (const key of ['lights', 'life', 'flash']) hook(AMB, key, () => {});
    const before = JSON.stringify(S);
    try { drawAmbience(0, { light }, { m: curMap() }); out.unchanged = JSON.stringify(S) === before; out.height = PH; return out; }
    finally { for (const [obj, key, fn] of hooks) obj[key] = fn; [PW, PH] = size; WK.cam = cam; }
  }
  check('Saltmarsh clear fog stays low and translucent', () => {
    const a = coastalAir('clear', .33); return a.fog.top === a.height * .58 && a.fog.ground === a.height && a.fog.density === .17 && a.unchanged;
  });
  check('Saltmarsh mist uses a low sea-coloured layer and lighter weather veil', () => {
    const a = coastalAir('mist', .33); return Math.abs(a.fog.density - .43) < 1e-9 && a.weather.fog === .85 && a.weather.fogCol === '#d4e5e4';
  });
  check('Saltmarsh sunrise adds gentle mist without changing the ranch clock', () => {
    const a = coastalAir('clear', .97); return wbSun().day && wbSun().p < .12 && Math.abs(a.fog.density - .22) < 1e-9 && a.unchanged;
  });
  check('Saltmarsh night fog keeps the player lamp and cool coastal colour', () => {
    const a = coastalAir('clear', .83); return !wbSun().day && a.fog.col === Light.css(Light.mix('#d4e5e4', '#23394c', .5)) && a.fog.lights.some(l => l.col === '#ffe2b0' && l.r > 0);
  });
  check('Saltmarsh softened grade and shafts reach the shared renderer', () => {
    const a = coastalAir('clear', .33); return a.grade.amount === .72 && a.grade.tint === '#b6d4d5' && a.shafts.strength === .48;
  });
  check('Saltmarsh rain retains rain effects and suppresses sun shafts', () => {
    const a = coastalAir('rain', .33); return !a.shafts && a.weather.rain > 0 && a.weather.onThunder && a.fog.density === .17;
  });
  check('Saltmarsh early art eras keep their existing mist and skip lighting', () => {
    const a = coastalAir('mist', .33, false); return !a.fog && !a.grade && !a.shafts && a.weather.fog === 1.3 && !a.weather.fogCol;
  });
  check('Saltmarsh bounce light uses sky and sand without altering shadow direction', () => {
    coastalAir('clear', .33); const tuned = wbSun(), original = WLT.time(Light.cycle(dayPart(), .965, .70), { sky: BIOMES.saltmarsh.sky[1], ground: BIOMES.saltmarsh.ground || '#5a8a4a' });
    return JSON.stringify(tuned.shadow) === JSON.stringify(original.shadow) && JSON.stringify(tuned.shade) !== JSON.stringify(original.shade) && JSON.stringify(tuned.ambient) === JSON.stringify(Light.mix('#9cbecb', '#c8c5a0', .35));
  });
  check('Saltmarsh before the clock badge still uses fixed late morning', () => {
    ready(); wb.placeAt('saltmarsh'); S.ranchT = DAY_SECONDS * .83; return wbSun().t === WLT.time(.18).t && wbSun().day;
  });
  for (const biome of Object.keys(BIOMES).filter(id => id !== 'saltmarsh')) {
    check(biome + ': original bounce light remains unchanged', () => {
      ready(); S.badges = ['thorn', 'tide']; wb.placeAt(biome); S.ranchT = DAY_SECONDS * .33; const bio = BIOMES[biome];
      return JSON.stringify(wbSun()) === JSON.stringify(WLT.time(Light.cycle(dayPart(), .965, .70), { sky: bio.sky[1], ground: bio.ground || '#5a8a4a' }));
    });
  }
  check('Thornwood keeps its original fog height, grade and shafts', () => {
    const a = coastalAir('clear', .33, true, 'thornwood'); return a.fog.top === a.height * .2 && a.fog.density === .12 && a.grade.amount === .9 && a.shafts.strength === .8 + .12;
  });
  check('Stillreed keeps its original mist density and weather veil', () => {
    const a = coastalAir('mist', .33, true, 'stillreed'); return a.fog.top === a.height * .2 && Math.abs(a.fog.density - .7) < 1e-9 && a.weather.fog === 1.3 && a.weather.fogCol === '#e2ecdc';
  });


  // W11-1: content through the existing creature, evolution, encounter and art systems.
  const rosterBatch=['fernruff','briarwatch','poolkit','rilllynx','hearthlaugh','cairnclasp','bogbough','tumbletusk','slatehoof','kilnchirp','dewspinner','veilmote'];
  const previousRoster=["cindercub","blazefang","ripplet","tidewyrm","mosshog","thornback","glimmerwing","pebblepaw","duskweaver","bogsnap","emberling","gnawhound","sunspark","galefoal","elderhorn","brineskit","shoalcrest","dunepounce","reedtusk","wrackjaw","kiteskirl","spindriftfoal","foamglint","breakwatermane","slaglet","kilntusk","ashskip","cragskein","ventwhisk","thermwing","screegrin","glowmote","hearthcrown","mistfinch","cloudharrier","cirrusmane","shalecat","fogtail","pallweaver","gritbeak","lanternwisp","lanterncrest","reedlet","ferrycrest","siltjaw","rillwhisk","orchardroot","gustreed","duskcord","glassbill","stillwake","hushpup","hushmane","umbrelace","flintroot","ledgewhisk","bellmote","dripdart","chimespark","undertone","clovercolt","bloomcourser","tilthtusk","hemglow","pennantlark","hearthrunner","ribbonstride","dawntassel","meadowmantle","shoalpup","soundhowl","keeljaw","chartwing","moorweft","inkwhisk","buoyglint","isleglimmer","watchlight","lynxhound","drakelet","bramblestag"]; // main 4801a19; later batches may reuse a pair.
  const expectedPairs={fernruff:'wolf/Grove',briarwatch:'wolf/Grove',poolkit:'cat/Tide',rilllynx:'cat/Tide',hearthlaugh:'hyena/Radiant',cairnclasp:'lizard/Stone',bogbough:'croc/Grove',tumbletusk:'boar/Gale',slatehoof:'horse/Stone',kilnchirp:'bird/Ember',dewspinner:'spider/Tide',veilmote:'sprite/Shade'};
  check('W11 batch fills ten previously empty family/element pairs',()=>{const pairs=new Set();for(const id of rosterBatch){const s=SPECIES[id],pair=s.fam+'/'+s.el;pairs.add(pair);if(pair!==expectedPairs[id]||Object.entries(SPECIES).some(([other,s])=>previousRoster.includes(other)&&s.fam+'/'+s.el===pair))return false;}return pairs.size===10;});
  check('W11 names and IDs are distinct; adds twelve to the original 81',()=>Object.keys(SPECIES).length>=previousRoster.length+rosterBatch.length&&new Set(Object.values(SPECIES).map(s=>s.name.toLowerCase())).size===Object.keys(SPECIES).length);
  for(const id of rosterBatch){
    check(id+': appropriate base budget, supported body and elemental moves',()=>{const s=SPECIES[id],budget=['briarwatch','rilllynx','hearthlaugh'].includes(id)?420:id==='veilmote'?540:300;return Object.keys(s.base).length===6&&Cr.STATS.every(k=>Number.isInteger(s.base[k])&&s.base[k]>0)&&Object.values(s.base).reduce((a,b)=>a+b,0)===budget&&ELEMENTS[s.el]&&FAVORITE[s.fam]&&/^#[0-9a-f]{6}$/i.test(s.col)&&s.learn.every(([l,m],i)=>MOVES[m]&&l>=1&&(!i||l>=s.learn[i-1][0]))&&s.learn.some(([l,m])=>l===1&&['hit','aoe','dot'].includes(MOVES[m].kind))&&s.learn.some(([,m])=>MOVES[m].el===s.el)&&s.dex.length>30;});
    check(id+': creates, learns legal moves, and draws in all existing 2D eras',()=>{const c=newCreature(id,40,{rar:0,temp:'steady',traits:[]}),canvas=document.createElement('canvas');canvas.width=160;canvas.height=160;const ctx=canvas.getContext('2d');if(c.sp!==id||c.hp!==stOf(c).hp||movesOf(c).length<1||movesOf(c).length>4)return false;for(const era of ['pocket','pixel','bit16']){ctx.clearRect(0,0,160,160);ART[era].creature(ctx,80,90,4,SPECIES[id],true,0,{});if(!ctx.getImageData(0,0,160,160).data.some((v,i)=>i%4===3&&v))return false;}return true;});
  }
  for(const [id,target,at]of [['fernruff','briarwatch',18],['poolkit','rilllynx',24]]){
    check(id+': evolution uses the existing level gate and preserves individual identity',()=>{ready();S.capMode='off';const c=newCreature(id,at-1,{rar:2,temp:'steady',traits:['loyal']});c.name='My partner';c.bond=80;c.variant={gleaming:true,size:'tiny'};const before=JSON.stringify({uid:c.uid,pot:c.pot,temp:c.temp,traits:c.traits,rar:c.rar,bond:c.bond,variant:c.variant});S.team=[c];const msgs=grow(c,Cr.xpNeed(c.lvl));return c.sp===target&&c.lvl===at&&c.name==='My partner'&&msgs.some(m=>m.includes('evolved'))&&before===JSON.stringify({uid:c.uid,pot:c.pot,temp:c.temp,traits:c.traits,rar:c.rar,bond:c.bond,variant:c.variant})&&S.caught[target]&&baseForm(target)===id;});
    check(id+': default name changes with evolution and breeding returns the young form',()=>{ready();S.capMode='off';const c=newCreature(id,at-1,{rar:0});grow(c,Cr.xpNeed(c.lvl));const mate=newCreature(target,at,{rar:0});c.bond=mate.bond=30;const info=breedInfo(c,mate);return c.name===SPECIES[target].name&&info.ok&&info.opts.length===1&&info.opts[0]===id;});
  }
  check('Hearthlaugh stays itself through level 100, with ordinary rarity and useful support',()=>{ready();S.capMode='off';const c=newCreature('hearthlaugh',29,{rar:0});S.team=[c];grow(c,1e9);return c.sp==='hearthlaugh'&&c.lvl===100&&!SPECIES.hearthlaugh.evo&&!SPECIES.hearthlaugh.unique&&['howl','regrowth','radiance'].every(m=>SPECIES.hearthlaugh.learn.some(([,id])=>id===m));});
  check('Reserved Veilmote is unique, cannot breed, and never enters wild or Randomizer pools',()=>{ready();const c=newCreature('veilmote',60,{rar:4}),mate=newCreature('sunspark',60,{rar:0});c.bond=mate.bond=40;S.modes={randomizer:true,seed:997};return SPECIES.veilmote.unique===1&&!breedInfo(c,mate).ok&&Object.values(BIOMES).every(b=>b.wild.every(([id])=>id!=='veilmote'&&randomized(id)!=='veilmote'))&&!STORY.some(b=>b.wild&&b.wild[0]==='veilmote');});
  const batchWild={thornwood:['fernruff','bogbough'],saltmarsh:['poolkit','dewspinner'],emberfall:['cairnclasp','kilnchirp','hearthlaugh'],cloudglass:['tumbletusk','slatehoof']};
  for(const [biome,ids]of Object.entries(batchWild))check(biome+': each new species is reachable through the actual weighted picker',()=>{ready();S.modes={};S.biome=biome;const night=isNight(),fx=WEATHER_FX[weatherNow()]||{},weighted=BIOMES[biome].wild.map(([id,w])=>[id,w*(night&&SPECIES[id].el==='Shade'?3:night&&SPECIES[id].el==='Radiant'?.5:1)*(fx[SPECIES[id].el]||1)]),total=weighted.reduce((sum,[,w])=>sum+w,0),random=Math.random;try{for(const target of ids){let upto=0;for(const [id,w]of weighted){if(id===target){Math.random=()=> (upto+w/2)/total;if(wildPick()!==target)return false;break;}upto+=w;}}return true;}finally{Math.random=random;}});
  check('Hearthlaugh is rarer than the existing Emberfall rare and ordinary new spawns',()=>{const table=BIOMES.emberfall.wild,w=id=>table.find(([sp])=>sp===id)[1];return w('hearthlaugh')===2&&w('glowmote')===3&&w('cairnclasp')===6&&w('kilnchirp')===6;});
  check('Roster expansion preserves an old partner, money, progress and journal through load',()=>{ready();const c=newCreature('cindercub',11,{rar:1});c.name='Old friend';c.bond=53;S.team=[c];S.coins=271;S.badges=['thorn'];S.story={thornwarden:true};S.caught={cindercub:true};S.seen={cindercub:true};delete S.variantDex;const old=JSON.parse(JSON.stringify(S));localStorage.setItem(KEY,JSON.stringify(old));load();return JSON.stringify(S.team)===JSON.stringify(old.team)&&S.coins===old.coins&&JSON.stringify(S.story)===JSON.stringify(old.story)&&S.badges.join(',')==='thorn'&&Object.keys(S.caught).join(',')==='cindercub'&&!S.team.some(c=>rosterBatch.includes(c.sp));});

  // T37: data-only roster growth. Conditional options are an explicit Godot handoff.
  const catalogueBatch=['flintpup','cairnhound','ridgewarden','seedpip','hedgelark','boughchorus','saillet','draftscale','stormfrill','sunfrill','fogsail','cinderstitch','laughrill','fordfoal'];
  const oldCatalogue=[...previousRoster,...rosterBatch];
  check('T37 adds fourteen unique species and eight previously empty body/element pairs',()=>{
    const pairs=new Set(catalogueBatch.map(id=>SPECIES[id].fam+'/'+SPECIES[id].el));
    return catalogueBatch.length===14&&pairs.size===8&&[...pairs].every(pair=>!oldCatalogue.some(id=>SPECIES[id].fam+'/'+SPECIES[id].el===pair))&&new Set(Object.values(SPECIES).map(s=>s.name.toLowerCase())).size===Object.keys(SPECIES).length;
  });
  for(const id of catalogueBatch){
    check(id+': habitat, legal ordered moves and an ordinary stat budget',()=>{const s=SPECIES[id],sum=Object.values(s.base).reduce((a,b)=>a+b,0),final=['ridgewarden','boughchorus','stormfrill'].includes(id),young=['flintpup','seedpip','saillet'].includes(id);return sum===(final?510:young?300:420)&&!s.unique&&ELEMENTS[s.el]&&FAVORITE[s.fam]&&Cr.STATS.every(k=>Number.isInteger(s.base[k])&&s.base[k]>0&&s.base[k]<=120)&&/^#[0-9a-f]{6}$/i.test(s.col)&&s.learn.some(([l,m])=>l===1&&['hit','aoe','dot'].includes(MOVES[m].kind))&&s.learn.some(([,m])=>MOVES[m].el===s.el)&&s.learn.every(([l,m],i)=>MOVES[m]&&l>=1&&l<=100&&(!i||l>=s.learn[i-1][0]))&&Object.values(BIOMES).some(b=>s.dex.includes(b.name));});
    check(id+': creates and draws a visible body facing both ways in all 2D eras',()=>{ready();const c=newCreature(id,40,{rar:0,temp:'steady',traits:[]}),cv=document.createElement('canvas');cv.width=cv.height=160;const cx=cv.getContext('2d');if(c.hp!==stOf(c).hp||movesOf(c).length<1||movesOf(c).length>4)return false;for(const era of ['pocket','pixel','bit16'])for(const right of [false,true]){cx.clearRect(0,0,160,160);ART[era].creature(cx,80,90,4,SPECIES[id],right,0,{});if(!cx.getImageData(0,0,160,160).data.some((v,i)=>i%4===3&&v))return false;}return true;});
  }
  for(const [young,middle,adult]of [['flintpup','cairnhound','ridgewarden'],['seedpip','hedgelark','boughchorus'],['saillet','draftscale','stormfrill']]){
    check(young+': a full three-stage journey preserves identity and breeds the original young form',()=>{ready();S.capMode='off';const c=newCreature(young,SPECIES[young].evo.at-1,{rar:2,temp:'steady',traits:['loyal']});c.name='Longtime friend';c.bond=80;c.variant={gleaming:true,size:'tiny'};const identity=()=>JSON.stringify({uid:c.uid,pot:c.pot,temp:c.temp,traits:c.traits,rar:c.rar,bond:c.bond,variant:c.variant,name:c.name});const before=identity();S.team=[c];grow(c,Cr.xpNeed(c.lvl));if(c.sp!==middle||identity()!==before)return false;while(c.lvl<SPECIES[middle].evo.at)grow(c,Cr.xpNeed(c.lvl));if(c.sp!==adult||identity()!==before||baseForm(adult)!==young)return false;const mate=newCreature(adult,c.lvl,{rar:0});mate.bond=80;const info=breedInfo(c,mate);return S.caught[middle]&&S.caught[adult]&&info.ok&&info.opts.length===1&&info.opts[0]===young;});
  }
  for(const id of ['cinderstitch','laughrill','fordfoal'])check(id+': stays itself at 100 with a readable reason and support',()=>{ready();S.capMode='off';const c=newCreature(id,1,{rar:0});S.team=[c];grow(c,1e9);return c.lvl===100&&c.sp===id&&!SPECIES[id].evo&&!SPECIES[id].catalogueEvos&&SPECIES[id].dex.includes('never evolves')&&SPECIES[id].learn.some(([,m])=>['buff','guard','haste','slow','heal'].includes(MOVES[m].kind));});
  check('Saillet conditional handoff uses supported Godot fields, existing forms and maps, hints, then a default',()=>{const options=SPECIES.saillet.catalogueEvos;return options.length===3&&options[0].place==='cloudglass'&&options[0].to==='fogsail'&&options[1].bond===3&&options[1].to==='sunfrill'&&options[2].to==='draftscale'&&!options[2].place&&!options[2].bond&&options.every(e=>e.at===18&&SPECIES[e.to]&&(!e.place||MAPS[e.place])&&e.hint.length>30&&Object.keys(e).every(k=>['to','at','place','bond','with','hint'].includes(k)))&&SPECIES.saillet.evo.to==='draftscale';});
  const catalogueWild={thornwood:['seedpip'],saltmarsh:['saillet'],emberfall:['flintpup','cinderstitch'],cloudglass:['cairnhound','draftscale','fogsail'],stillreed:['laughrill','fordfoal'],sunthread:['sunfrill','boughchorus']};
  for(const [biome,ids]of Object.entries(catalogueWild))check(biome+': new creatures reachable in the actual weighted encounter picker',()=>{ready();S.modes={};S.biome=biome;const night=isNight(),fx=WEATHER_FX[weatherNow()]||{},table=BIOMES[biome].wild.map(([id,w])=>[id,w*(night&&SPECIES[id].el==='Shade'?3:night&&SPECIES[id].el==='Radiant'?.5:1)*(fx[SPECIES[id].el]||1)]),total=table.reduce((a,[,w])=>a+w,0),random=Math.random;try{for(const id of ids){let upto=0;let found=false;for(const [target,w]of table){if(target===id){Math.random=()=>(upto+w/2)/total;if(wildPick()!==id)return false;found=true;break;}upto+=w;}if(!found)return false;}return true;}finally{Math.random=random;}});
  check('Catalogue and handoff contain no cycles or invalid evolution targets',()=>{for(const start of Object.keys(SPECIES)){const walk=(id,path)=>{if(path.includes(id))return false;const s=SPECIES[id];if(!s)return false;return [...(s.evo?[s.evo]:[]),...(s.catalogueEvos||[])].every(e=>walk(e.to,[...path,id]));};if(!walk(start,[]))return false;}return true;});
  check('A newly caught catalogue adult round-trips alongside an old partner without changing progress',()=>{ready();const old=newCreature('cindercub',11,{rar:1});old.name='Old friend';old.bond=53;S.team=[old,newCreature('fogsail',34,{rar:0})];S.coins=271;S.badges=['thorn','tide'];S.story={thornwarden:true};const before=JSON.stringify(S.team);save();load();return JSON.stringify(S.team)===before&&S.coins===271&&S.badges.join(',')==='thorn,tide'&&S.story.thornwarden;});


  // T40: data-only witnesses, reachable at both sides of the existing badge milestone.
  for(const [area,who,badge]of[['stillreed','sivet','reed'],['hollowecho','orri','echo'],['sunthread','nesla','loom'],['farwatch','ceryn','horizon']]){
    const m=MAPS[area],n=m.npcs.find(n=>n.who===who);
    check(area+': thread witness has valid plain portrait lines and a small badge payoff',()=>n&&n.lines.length>=3&&n.lines.every(([w,t])=>w===who&&typeof t==='string')&&n.byBadge[badge].length>=2&&n.byBadge[badge].every(([w,t])=>w===who&&typeof t==='string'));
    check(area+': heritage handoff is lossless plain JSON for all four existing Godot IDs',()=>{
      const plain=JSON.parse(JSON.stringify(n));return ['farm','coast','highland','wander'].every(k=>plain.byHeritage[k]?.length&&plain.byHeritage[k].every(([w,t])=>w===who&&typeof t==='string'));
    });
    check(area+': witness never occupies a trainer, Warden, sign, exit or item spot',()=>{
      const at=n.at.join(',');return m.npcs.filter(p=>p.at.join(',')===at).length===1&&m.warden.join(',')!==at&&!m.signs[at]&&!(m.items||[]).some(it=>it.at.join(',')===at)&&!TILES[tile(m,...n.at)].exit;
    });
    check(area+': witness can be approached without crossing a person or a solid tile',()=>{
      const todo=[m.start.slice(0,2)],seen=new Set(todo.map(p=>p.join(',')));
      while(todo.length){const[x,y]=todo.shift();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const p=[x+dx,y+dy],key=p.join(',');if(!seen.has(key)&&walkable(m,...p)&&!npcAt(m,...p)){seen.add(key);todo.push(p);}}}
      return [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen.has([n.at[0]+dx,n.at[1]+dy].join(',')));
    });
    check(area+': browser conversation changes after the badge and does not change the save',()=>{
      const old=S,oldTalk=TALK;try{S=fresh();S.name='Reader';S.badges=[];wb.placeAt(area);const before=JSON.stringify(S);talkTo(n);const early=JSON.stringify(TALK.lines);TALK=null;S.badges=[badge];const beforeBadge=JSON.stringify(S);talkTo(n);return early===JSON.stringify(n.lines)&&JSON.stringify(TALK.lines)===JSON.stringify(n.byBadge[badge])&&JSON.stringify(S)===beforeBadge&&before.includes('Reader');}finally{S=old;TALK=oldTalk;}
    });
  }
  check('T40 signs retain road guidance and make no definitive accusation about the fading',()=>MAPS.stillreed.signs['12,7'].includes('LOW WATER')&&MAPS.hollowecho.signs['7,5'].includes('wall is flat')&&MAPS.sunthread.signs['27,4'].includes('one knot')&&MAPS.farwatch.signs['14,5'].includes('missing lines have not been guessed'));
  // T45: lossless heritage handoff, every early NPC and Warden, with the shared route retained.
  const earlyPeople=['larkhaven','thornwood','saltmarsh','emberfall','cloudglass'].flatMap(area=>MAPS[area].npcs.map(n=>({who:n.who,entry:n,area})));
  const earlyWardens=[['warden','isolde'],['warden2','nerys'],['warden3','toren'],['warden4','vessa']].map(([id,who])=>({who,entry:STORY.find(b=>b.id===id),area:id}));
  check('T45 covers eleven existing people and four Wardens, with no duplicate recognition text',()=>earlyPeople.length===11&&earlyWardens.length===4&&new Set(Object.values(EARLY_HERITAGE_LINES).flat()).size===60);
  for(const {who,entry,area} of [...earlyPeople,...earlyWardens]){
    check(area+'/'+who+': shared lines and all four plain-JSON origins retained',()=>entry.lines.length>0&&JSON.stringify(entry.byHeritage)===JSON.stringify(JSON.parse(JSON.stringify(entry.byHeritage)))&&Object.keys(entry.byHeritage).sort().join(',')==='coast,farm,highland,wander');
    for(const heritage of ['farm','coast','highland','wander'])check(who+'/'+heritage+': attributed, readable, original recognition',()=>{const lines=entry.byHeritage[heritage];return lines.length===1&&lines[0][0]===who&&CAST[who]&&lines[0][1].length>=50&&lines[0][1].length<=220&&!/[\n\r]/.test(lines[0][1]);});
  }
  // WS3/T50: optional exported content must never remove baseline encounters or clues.
  const seasons=['spring','summer','autumn','winter'];
  for(const [area,biome] of Object.entries(BIOMES)){
    const map=MAPS[area],original=biome.wild,ids=original.map(w=>w[0]),total=original.reduce((n,w)=>n+w[1],0);
    check(area+': four plain-JSON seasonal tables',()=>map&&Object.keys(map.seasonal).join(',')===seasons.join(',')&&JSON.stringify(map.seasonal)===JSON.stringify(JSON.parse(JSON.stringify(map.seasonal))));
    for(const season of seasons){
      const table=map.seasonal[season].wild;
      check(area+'/'+season+': same species in copied table, no guardian',()=>table!==original&&table.map(w=>w[0]).join(',')===ids.join(',')&&table.every((w,i)=>w!==original[i]&&!SPECIES[w[0]].unique));
      check(area+'/'+season+': modest total and distinct ecology',()=>Math.abs(table.reduce((n,w)=>n+w[1],0)-total)<=total*.1&&JSON.stringify(table)!==JSON.stringify(original));
      for(const [id,weight] of table)check(area+'/'+season+'/'+id+': positive safe relative weight',()=>SPECIES[id]&&Number.isInteger(weight)&&weight>0&&weight<=30&&Math.abs(weight-original.find(w=>w[0]===id)[1])<=3);
    }
  }
  const visitors=Object.entries(SPECIES).filter(([,v])=>v.seasonal);
  check('WS3: four existing favored visitors',()=>visitors.length===4);
  for(const [id,spec] of visitors){
    const v=spec.seasonal;
    check(id+': favored season and plain export metadata',()=>seasons.includes(v.favoredSeason)&&v.inSeasonWeight===6&&v.outOfSeasonWeight===2&&!spec.unique&&JSON.stringify(v)===JSON.stringify(JSON.parse(JSON.stringify(v))));
    for(const area of v.areas)for(const season of seasons)check(id+'/'+area+'/'+season+': available year-round without capture or badge conditions',()=>MAPS[area].seasonal[season].wild.find(w=>w[0]===id)[1]===(season===v.favoredSeason?6:2));
  }
  const seasonalPeople=Object.entries(MAPS).flatMap(([area,m])=>(m.npcs||[]).filter(n=>n.lines).map(n=>({area,n})));
  check('WS3: all 24 ordinary map residents have seasonal observations',()=>seasonalPeople.length===24&&seasonalPeople.every(({n})=>n.bySeason));
  for(const {area,n} of seasonalPeople){
    check(area+'/'+n.who+': shared conversation retained with all four seasons',()=>n.lines.length>0&&Object.keys(n.bySeason).join(',')===seasons.join(',')&&JSON.stringify(n.bySeason)===JSON.stringify(JSON.parse(JSON.stringify(n.bySeason))));
    for(const season of seasons)check(n.who+'/'+season+': readable attributed observation, no rule jargon or timed pressure',()=>{const lines=n.bySeason[season];return lines.length===1&&lines[0][0]===n.who&&CAST[n.who]&&lines[0][1].length>=45&&lines[0][1].length<=180&&/^[\x20-\x7e]+$/.test(lines[0][1])&&!/\b(XP|cooldown|gate|flag|stat|only today|must return)\b/i.test(lines[0][1]);});
  }
  for(const [area,who,badge] of [['stillreed','sivet','reed'],['hollowecho','orri','echo'],['sunthread','nesla','loom'],['farwatch','ceryn','horizon']])check(who+': seasonal observation cannot replace shared clue, heritage or small payoff',()=>{const n=MAPS[area].npcs.find(n=>n.who===who);return n.lines.length===3&&n.byBadge[badge].length===2&&Object.keys(n.byHeritage).length===4&&Object.values(n.bySeason).every(l=>l[0][0]===who);});
  const festivalSeasons={planting:'spring',longlight:'summer',lanterns:'autumn',midwinter:'winter'};
  const festivals=MAPS.larkhaven.festivals;
  check('Larkhaven festivals use exactly the existing four calendar IDs',()=>JSON.stringify(Object.keys(festivals).sort())===JSON.stringify(Object.keys(festivalSeasons).sort()));
  const keepsakeIds=new Set(), activityIds=new Set();
  for(const [id,season] of Object.entries(festivalSeasons)){
    const f=festivals[id];
    check(id+' has its calendar season and a readable title',()=>f.season===season&&/^[A-Z]/.test(f.name)&&f.name.length<40);
    check(id+' has a short local tradition',()=>typeof f.tradition==='string'&&f.tradition.length>80&&f.tradition.length<300);
    check(id+' does not duplicate calendar dates or prices',()=>!Object.keys(f).some(k=>/date|day|price|cost|reward|stat/i.test(k)));
    check(id+' keepsake has only descriptive cosmetic fields',()=>JSON.stringify(Object.keys(f.keepsake).sort())==='["description","id","name"]');
    check(id+' keepsake ID is unique and safe',()=>/^[a-z][a-z_]+$/.test(f.keepsake.id)&&!keepsakeIds.has(f.keepsake.id));
    keepsakeIds.add(f.keepsake.id);
    check(id+' keepsake name and description are readable',()=>/^[A-Z]/.test(f.keepsake.name)&&f.keepsake.name.length<50&&f.keepsake.description.length>40&&f.keepsake.description.length<200);
    check(id+' activity ID is unique and safe',()=>/^[a-z][a-z_]+$/.test(f.activity.id)&&!activityIds.has(f.activity.id));
    activityIds.add(f.activity.id);
    check(id+' activity has a short title',()=>/^[A-Z]/.test(f.activity.name)&&f.activity.name.length<40);
    for(const phase of ['invite','complete']){
      const lines=f.activity[phase];
      check(id+' '+phase+' has a short shared dialogue scene',()=>Array.isArray(lines)&&lines.length===2);
      for(const [i,line] of lines.entries()){
        check(id+' '+phase+' '+i+' uses an existing local portrait speaker',()=>Array.isArray(line)&&line.length===2&&!!CAST[line[0]]&&MAPS.larkhaven.npcs.some(n=>n.who===line[0]));
        check(id+' '+phase+' '+i+' is readable player-facing text',()=>typeof line[1]==='string'&&line[1].length>=40&&line[1].length<=200&&/^[\x20-\x7e]+$/.test(line[1])&&!/mood\s*[-+]|quest id|unlock flag|\bneedDun\b/i.test(line[1]));
      }
    }
  }
  check('Long Light celebrates participation, not only a race victory',()=>/taking part/.test(festivals.longlight.activity.complete.map(l=>l[1]).join(' ')));
  check('Midwinter gift expects no returned gift',()=>/do not owe/.test(festivals.midwinter.activity.complete.map(l=>l[1]).join(' ')));
  check('Planting flower remains after the celebration',()=>/flower stays/.test(festivals.planting.activity.complete.map(l=>l[1]).join(' ')));
  for(const who of ['maren','pip']){
    const n=MAPS.larkhaven.npcs.find(n=>n.who===who);
    check(who+' festival observations preserve ordinary and seasonal dialogue',()=>!!n.lines&&n.lines.length>0&&Object.keys(n.bySeason).length===4);
    check(who+' festival observations cover exactly the calendar IDs',()=>JSON.stringify(Object.keys(n.byFestival).sort())===JSON.stringify(Object.keys(festivalSeasons).sort()));
    for(const id of Object.keys(festivalSeasons)){
      const lines=n.byFestival[id];
      check(who+' '+id+' uses its own portrait and short readable text',()=>lines.length===1&&lines[0].length===2&&lines[0][0]===who&&lines[0][1].length>=40&&lines[0][1].length<=200&&/^[\x20-\x7e]+$/.test(lines[0][1]));
    }
  }
  check('Other residents retain their existing conversation shapes',()=>Object.values(MAPS).every(m=>(m.npcs||[]).every(n=>!n.byFestival||(m===MAPS.larkhaven&&['maren','pip'].includes(n.who)))));

  check('Post-Champion gate scene is a short shared portrait scene',()=>Array.isArray(SCENES.leagueAfter)&&SCENES.leagueAfter.length===6);
  for(const [i,line] of SCENES.leagueAfter.entries()){
    check('Gate return line '+i+' has an existing speaker',()=>line.length===2&&!!CAST[line[0]]);
    check('Gate return line '+i+' is short readable world text',()=>line[1].length>=40&&line[1].length<=180&&/^[\x20-\x7e]+$/.test(line[1]));
  }
  const returningWardens=[['warden','isolde'],['warden2','nerys'],['warden3','toren'],['warden4','vessa'],['warden5','olan'],['warden6','senna'],['warden7','halen'],['warden8','rysa']];
  for(const [id,who] of returningWardens){
    const b=STORY.find(b=>b.id===id), lines=b.byStory.leagueEnding;
    check(id+' returns through the existing Warden actor',()=>!!b.gate&&!!CAST[who]&&b.lines.length>0&&b.win.length>0);
    check(id+' has two post-Champion lines',()=>Array.isArray(lines)&&lines.length===2);
    for(const [i,line] of lines.entries()){
      check(id+' return '+i+' uses its own portrait',()=>line.length===2&&line[0]===who);
      check(id+' return '+i+' is short and readable',()=>line[1].length>=40&&line[1].length<=100&&/^[\x20-\x7e]+$/.test(line[1]));
    }
  }
  check('Exactly the eight Wardens receive the ending appendix',()=>STORY.filter(b=>b.byStory&&b.byStory.leagueEnding).length===8);
  check('Existing Champion ending remains a separate scene',()=>SCENES.leagueEnding!==SCENES.leagueAfter&&SCENES.leagueEnding.some(l=>l[1].includes('reason it faded')));


  // WD2: appearance is species data, independent of family, stats and saved variants.
  const appearanceShapes = ["wolf","lizard","boar","cat","hyena","croc","horse","bird","spider","sprite","serpent","turtle","moth","treefolk"];
  const appearanceVocabulary = {"head":["bell-crown","branch-antlers","branch-crest","broad-crest","bubble-cheeks","bubble-crown","clay-beak","curved-tusks","ember-antlers","ember-fangs","feather-antennae","feather-crest","fin-crest","fin-ears","folded-ears","frilled-cheeks","glass-beak","glass-crest","glowing-tusks","lantern-crest","lantern-crown","leaf-crest","leaf-ears","long-tusks","long-whiskers","low-brow","moss-brow","pebble-crown","pennant-crest","pointed-cheeks","pointed-ears","reed-crest","round-cheeks","round-crest","round-ears","seed-beak","seed-fangs","short-tusks","small-fangs","stone-beak","stone-crown","stone-fangs","stone-jaw","sun-rays","swept-cheeks","swept-crest","swept-ears","tall-ears","tassel-antennae","tassel-crown","thorn-antlers","tufted-ears","wide-cheeks"],"back":["ash-collar","beacon-orbit","broad-sail","broad-wings","cairn-ridge","cloud-mane","crust-plates","crystal-ridge","dew-collar","echo-mane","ember-ruff","ember-spots","fern-ruff","fin-ridge","flame-mane","flower-canopy","flower-mane","foam-orbit","glass-wings","keel-ridge","leaf-mane","leaf-wings","light-orbit","mist-ruff","mist-wings","moss-bed","narrow-wings","orchard-canopy","reed-bed","reed-ridge","sand-ruff","seed-bed","shaggy-ruff","shell-plates","silk-collar","small-sail","smooth","soft-ruff","soft-wings","soil-bed","spark-orbit","spray-mane","spray-ruff","steam-orbit","steam-ruff","stone-canopy","stone-mane","stone-paws","stone-ruff","storm-sail","sun-sail","thorn-ridge","wave-mane","wave-ridge","willow-canopy","wind-mane"],"tail":["brush","copper","curled","fan","fin","forked","hook","lantern","paddle","plume","reed","ribbon","root","stub","tapered","tassel","thread"],"pattern":["bands","bars","chevrons","cracks","diamonds","ink","mottled","rays","rings","saddle","socks","speckles","spots","swirls","vines"]};
  const appearanceSignatures = new Set();
  for (const [id, species] of Object.entries(SPECIES)) {
    check(id + ': complete drawable appearance', () => species.look && appearanceShapes.includes(species.shape) &&
      Object.keys(species.look).length === 4 && Object.entries(appearanceVocabulary).every(([key, values]) => values.includes(species.look[key])));
    check(id + ': appearance survives JSON export', () => JSON.stringify(JSON.parse(JSON.stringify(species.look))) === JSON.stringify(species.look));
    const signature = JSON.stringify([species.shape, species.look]);
    check(id + ': distinct silhouette and markings', () => !appearanceSignatures.has(signature));
    appearanceSignatures.add(signature);
  }
  check('Appearance catalogue covers hybrids and base species exactly', () => Object.keys(SPECIES_LOOKS).length === Object.keys(SPECIES).length && Object.keys(SPECIES).every(id => SPECIES_LOOKS[id]));
  for (const [id, shape] of Object.entries({tidewyrm:'serpent',rillwhisk:'serpent',bogbough:'turtle',cairnclasp:'turtle',siltjaw:'turtle',veilmote:'moth',fogsail:'moth',dawntassel:'moth',orchardroot:'treefolk',flintroot:'treefolk',meadowmantle:'treefolk'})) {
    check(id + ': preserves Claude body override', () => SPECIES[id].shape === shape);
  }
  check('Drawing shape does not replace breeding family', () => SPECIES.tidewyrm.fam === 'croc' && SPECIES.orchardroot.fam === 'boar' && SPECIES.veilmote.fam === 'sprite' && HYBRIDS['cat+wolf'] === 'lynxhound');
  const appearanceCreature = newCreature('cindercub', 5);
  check('Appearance metadata stays out of creature saves', () => !('look' in appearanceCreature) && !('shape' in appearanceCreature));

  return checks;
}

(() => {
  const button = document.querySelector('#run'), summary = document.querySelector('#summary'), results = document.querySelector('#results');
  const keys = ['wildbond-save-v1', 'arcade-index-v1', 'wildbond-modes-unlocked'];
  let active = null;
  function result(ok, label) {
    const li = document.createElement('li'); li.className = ok ? 'pass' : 'fail'; li.textContent = (ok ? 'PASS — ' : 'FAIL — ') + label; results.appendChild(li);
  }
  function restore() {
    if (!active) return;
    // Destroy the writer (timers and beforeunload save) BEFORE restoring the originals.
    if (active.frame) { active.frame.remove(); active.frame = null; }
    const errors = [];
    for (const k of Object.keys(localStorage)) if (k.startsWith('arcade-backup:') && !active.backup.has(k)) localStorage.removeItem(k);
    for (const [key, value] of active.backup) {
      try {
        if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
        if (localStorage.getItem(key) !== value) throw Error('Value did not match backup.');
      } catch (error) { errors.push(key + ': ' + error.message); }
    }
    if (errors.length) throw Error('Save restoration failed: ' + errors.join('; '));
    active = null;
  }
  addEventListener('pagehide', restore);
  button.addEventListener('click', async () => {
    button.disabled = true; results.replaceChildren(); summary.className = ''; summary.textContent = 'Running…';
    let total = 0, failed = 0;
    const record = (ok, label) => { total++; if (!ok) failed++; result(ok, label); };
    try {
      if (location.hostname !== 'localhost' || !/^https?:$/.test(location.protocol)) throw Error('Open this page through serve.ps1 at http://localhost:8765/tests/wildbond.html.');
      // Finish ALL reads before changing storage; if backup fails, no game is loaded.
      const backup = new Map(keys.concat(Object.keys(localStorage).filter(k => k.startsWith('arcade-backup:'))).map(key => [key, localStorage.getItem(key)])); // automatic save backups too (engine.js)
      active = { backup, frame: null };
      localStorage.removeItem(keys[0]);
      const frame = document.createElement('iframe'); frame.title = 'Wildbond test instance'; active.frame = frame;
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(Error('Game iframe load timed out.')), 15000);
        frame.onload = () => { clearTimeout(timer); resolve(); };
        frame.onerror = () => { clearTimeout(timer); reject(Error('Game iframe failed to load.')); };
        frame.src = '../games/wildbond/'; document.querySelector('#game').appendChild(frame);
      });
      const w = frame.contentWindow;
      if (!w.__wb) throw Error('Wildbond localhost test hook is unavailable.');
      for (const c of w.eval('(' + wildbondChecks.toString() + ')()')) record(c.ok, c.label);
      for (const c of w.eval('(' + wildbondVariantChecks.toString() + ')()')) record(c.ok, c.label);
    } catch (error) {
      record(false, error.message);
    } finally {
      try { restore(); } catch (error) { record(false, error.message); }
      summary.textContent = failed ? 'FAIL — ' + failed + ' of ' + total + ' failed.' : 'PASS — ' + total + ' checks.';
      summary.className = failed ? 'fail' : 'pass'; button.disabled = false;
    }
  });
})();
